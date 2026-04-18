# CKA Tips System — Design

**Date:** 2026-04-18
**Status:** Draft, pending user review
**Scope:** Cross-repo feature spanning CKArcade + Kube-Blitz (+ new `cka-tips` library repo)

## Motivation

Alan is preparing for the Certified Kubernetes Administrator (CKA) exam. Reading tips is passive and doesn't stick; active recall under mild time pressure drills material into long-term memory. This system turns CKA wisdom into drill prompts (Kube-Blitz) and applied missions with reinforcement cards (CKArcade), all tracked with shared spaced repetition so progress in one game informs the other.

## Goals

- **Active recall over reading.** Tips are encountered as prompts the player must answer, not text they must read.
- **Spaced repetition.** Leitner boxes surface due tips, de-prioritise mastered ones, and reinforce weak areas.
- **Cross-game progress.** Drilling a tip in Kube-Blitz promotes its box; applying it in a CKArcade mission also promotes it. Both games share one mastery state.
- **Minimal content tooling.** Content lives in a JSON file; adding a tip is a PR, not a platform.
- **Exam-useful by default.** Tip coverage maps to CKA exam domains and their weights.

## Non-goals

- Real Kubernetes backend (future `kind` mode, out of scope here).
- Exam timing/simulation beyond what the games already offer.
- AI-generated tips — content is human-curated.
- Accounts, sync-across-devices, multi-user. Single user, single browser (with manual export/import).

## Project decomposition

The broader "100+ tips CKA drill platform" decomposes into five sub-projects. **This spec covers sub-projects 1-4**; sub-project 5 (content production) runs as ongoing work once 1-4 ship.

1. Shared tips library + schema (`cka-tips` repo + `tips.json` + JSON Schema + 10 seed tips)
2. Leitner spaced-repetition tracker (shared `leitner.js` module, shared `localStorage` state)
3. Kube-Blitz integration (tips become prompts, due tips weighted, mastery view)
4. CKArcade integration (mission tagging, post-mission tip card, optional pre-mission banner)
5. Content production — target 100+ tips covering the CKA syllabus. Ongoing.

## Architecture

```
                            ┌──────────────────────────────┐
                            │  alanops.github.io/cka-tips/ │
                            │    tips.json (authoritative) │
                            │    tip-schema.json           │
                            │    leitner.js                │
                            └──────────────┬───────────────┘
                                           │ fetch
           ┌───────────────────────────────┼────────────────────────────────┐
           ▼                                                                ▼
┌──────────────────────┐              same origin            ┌──────────────────────┐
│   CKArcade           │◀────────────────────────────────────▶│   Kube-Blitz         │
│   missions →         │     localStorage['cka.leitner.v1']  │   prompts from tips  │
│   post-mission tip   │     shared read/write               │   Leitner-weighted   │
│   card + promotion   │                                     │   mastery view       │
└──────────────────────┘                                     └──────────────────────┘
```

All three sites live under `alanops.github.io`, so they share a single origin and one `localStorage` store. In production, cross-game sync is automatic.

## Components

### `cka-tips` repo (new)

- `tips.json` — authoritative corpus; array of tip objects.
- `tip-schema.json` — JSON Schema validated in CI via `ajv`.
- `leitner.js` — shared spaced-repetition module. Small enough to vendor (copy) into each game at build time to avoid CORS/MIME friction.
- GitHub Pages serves the repo at `alanops.github.io/cka-tips/`.

### Tip schema

```json
{
  "id": "set-image",
  "domain": "workloads",
  "subtopic": "deployments",
  "principle": "Change a container image without editing YAML.",
  "prompt": "Update deployment 'web' to use nginx:1.25.",
  "answer": "kubectl set image deploy/web nginx=nginx:1.25",
  "alternates": [
    "kubectl set image deployment/web nginx=nginx:1.25"
  ],
  "docs": "https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#set-image",
  "difficulty": 1,
  "missions": ["wrong-image"]
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Kebab-case, stable across renames |
| `domain` | yes | One of `cluster \| workloads \| networking \| storage \| troubleshooting` (matches CKA exam domains) |
| `subtopic` | yes | Free text, e.g. `deployments`, `rbac`, `dns` |
| `principle` | yes | One sentence describing what the tip teaches |
| `prompt` | yes | Natural-language drill prompt shown in Kube-Blitz |
| `answer` | yes | Canonical command string |
| `alternates` | no | Equivalent commands accepted as correct |
| `docs` | yes | HTTPS link to official Kubernetes / Helm docs |
| `difficulty` | yes | 1 (reflex) / 2 (applied) / 3 (nuanced) |
| `missions` | no | Array of CKArcade mission IDs this tip exercises |

### Leitner module (`leitner.js`)

Pure functions over a state object. No framework deps. Exports:

- `loadState()` → reads `localStorage['cka.leitner.v1']`, migrates if needed, returns state.
- `saveState(state)` → writes.
- `selectDueTips(state, tips, opts)` → returns tips eligible for this session based on box cadence. `opts`: `{ domain, count, currentSession }`.
- `recordResult(state, tipId, correct)` → returns new state with box updated.
- `exportJson(state)` / `importJson(json)` → round-trip for manual sync.

State shape:

```json
{
  "version": 1,
  "session": 42,
  "updatedAt": "2026-04-18T10:00:00Z",
  "tips": {
    "set-image": { "box": 3, "lastSeen": 40, "mastered": false, "correctStreak": 2 }
  }
}
```

Box cadences (review every N sessions):

| Box | Cadence | Meaning |
|---|---|---|
| 1 | every session | Just learned / just missed |
| 2 | every 2nd | Warming up |
| 3 | every 4th | Solid |
| 4 | every 8th | Near mastery |
| 5 | every 16th | Mastered |

Transitions:

- Correct answer → promote one box (capped at 5). Set `mastered: true` once box reaches 5.
- Wrong answer in boxes 1–4 → drop to box 1.
- Wrong answer in box 5 → drop to box 3 (not 1; mastered tips get a softer demotion).
- First sighting → tip inserted at box 1.

Session counter increments at the start of each Kube-Blitz game round or CKArcade mission, whichever comes first in a sitting. Both games read and increment the same counter so the cadence is unified.

### Kube-Blitz integration

- Replace the hardcoded prompt array with a fetch of `tips.json`.
- Category filter maps loosely: Kube-Blitz's existing UI categories (`Pods`, `Deployments`, `Services`, `Ops`, `Config`, `Helm`) map onto `domain` + `subtopic` — e.g. `Deployments` → `domain=workloads,subtopic=deployments`; `Helm` → `domain=workloads,subtopic=helm`. Keep the existing UI; map via a small lookup table so content creators only think in `domain`/`subtopic`.
- At round start, call `selectDueTips` to build the round's prompt pool. Fill with not-yet-seen tips if due pool is short.
- Correct answer = typed command matches `answer` or any `alternates` after normalisation (trim, collapse whitespace, normalise `deploy`↔`deployment`, `svc`↔`service` etc.).
- After each round, show a small toast: `set-image → box 3 ↑` or `patch-replicas → box 1 ↓`.
- New "Mastery" screen: progress bar per domain, list of mastered tips, list of "due next session".

### CKArcade integration

- Each mission file gains `tipsExercised: [tipId, ...]`. Backfill the 6 existing missions (each already maps cleanly: Pod Panic → `kubectl-run`, The Wrong Image → `set-image`, Lost Signal → `svc-selectors`, Traffic Surge → `scale`, Night Rollout → `rollout-undo`, Harbor Routing → `service-routing`).
- On mission success, call `recordResult(state, tipId, true)` for each tip in `tipsExercised`.
- On mission failure or restart, no demotion (failure is ambiguous — a player may have learned from the hint).
- Post-mission card: show 1–2 tips from `tipsExercised` with principle + docs link + Leitner delta.
- Optional pre-mission banner: `Today's focus: Troubleshooting — 5 tips due.`
- Keep existing hint/scoring mechanics untouched.

## Storage

- **Key:** `cka.leitner.v1` (versioned).
- **Origin sharing:** All three sites live under `alanops.github.io`, so `localStorage` is naturally shared. No network sync needed.
- **Local dev caveat:** `python3 -m http.server 8080` for one game and `:8090` for the other = separate origins = separate state. Document this; provide an **Export / Import JSON** button in each game's settings as a manual workaround.
- **Migration:** On load, if `cka.leitner.v0` (or similar) exists, run a migration function. Version bump = new key and a one-shot migration.

## Seed content (10 tips)

Sourced from the kubectl-imperative tips Alan just captured:

1. `kubectl-edit-live` — edit running resource with `kubectl edit`.
2. `kubectl-patch-replicas` — `kubectl patch deploy web -p '{"spec":{"replicas":5}}'`.
3. `kubectl-set-image` — change image without YAML.
4. `kubectl-set-env` — add/update env vars imperatively.
5. `kubectl-set-resources` — set CPU/memory limits imperatively.
6. `kubectl-scale` — scale a deployment.
7. `kubectl-label` — label a resource imperatively.
8. `kubectl-annotate` — annotate a resource imperatively.
9. `kubectl-dry-run-yaml` — generate YAML scaffold with `--dry-run=client -o yaml`.
10. `kubectl-explain-recursive` — discover spec fields with `kubectl explain <kind>.spec.<field> --recursive`.

All tagged to at least one existing CKArcade mission, and all fitting Kube-Blitz prompt shape.

## Testing

- **Schema:** JSON Schema validation in CI on `cka-tips` repo (`ajv-cli`).
- **Leitner:** Unit tests for every transition case — first sighting, box promotion at 1→2→…→5, demotion from 1–4 to 1, demotion from 5 to 3, due selection at various session counters.
- **Game integration:** Manual smoke test per game after each sub-project ships; log a short checklist in each PR.
- **Export/import:** Round-trip test — export, clear localStorage, import, state equals original.

## Rollout

1. **Sub-project 1** — stand up `cka-tips` repo, schema, seed 10 tips, publish to GitHub Pages.
2. **Sub-project 2** — `leitner.js` module + unit tests in the `cka-tips` repo.
3. **Sub-project 3** — Kube-Blitz adopts tips behind `?tips=1` query flag. Validate for a few days.
4. **Sub-project 4** — CKArcade adopts tips behind the same flag. Backfill mission tags.
5. Remove the flag once both stable.
6. **Sub-project 5** — kick off content production cadence (target: ~10 tips per week until corpus reaches 100+).

## Risks & open questions

- **Answer matching fuzziness.** Players may type valid variants (`deploy` vs `deployment`, flag order). Normalisation is the mitigation; edge cases will need iteration.
- **"Optimal path" in CKArcade is fuzzy.** Initial rule: mission solved without `H` hints → tip promoted. With hints → tip untouched (neither promoted nor demoted). Revisit after play-testing.
- **Content quality at scale.** 100+ tips means review debt; introduce a PR checklist (docs link, difficulty calibration, exam-domain tag) to keep quality stable.
- **Cross-origin local dev.** Accepted limitation; Export/Import covers it.
- **Session counter drift.** If the user plays both games in parallel tabs, they could double-increment. Mitigate with a debounce (e.g. increment only if `lastSessionStart < now - 60s`). Revisit if it matters.

## Metrics

- Tips mastered per week (state snapshots).
- Domain mastery distribution (to guide content production).
- Retention: % of box-5 tips still in box 5 after two weeks.
- Kube-Blitz accuracy trend per domain.
