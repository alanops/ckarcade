# CKA Tips System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a shared CKA tips + Leitner spaced-repetition system across CKArcade and Kube-Blitz so every tip is drilled via active recall, and progress in one game informs the other.

**Architecture:** A new `cka-tips` repo publishes `tips.json` + JSON Schema + a tiny `leitner.js` module to GitHub Pages. Both games fetch tips at load, vendor `leitner.js`, and share Leitner state via `localStorage['cka.leitner.v1']` under the same `alanops.github.io` origin. Kube-Blitz surfaces due tips as typing prompts; CKArcade links tips to missions and shows a post-mission reinforcement card.

**Tech Stack:** Vanilla JS (no build step in the games), Node + `ajv` for schema validation in CI, `vitest` for Leitner unit tests, GitHub Actions + GitHub Pages for publishing.

**Spec:** `docs/superpowers/specs/2026-04-18-cka-tips-system-design.md`

**Repos touched:**
- NEW: `github.com/alanops/cka-tips` (local path `~/workspace/ops/alanops/cka-tips/`)
- Existing: `github.com/alanops/ckarcade`
- Existing: `github.com/alanops/kube-blitz`

---

## File Structure

### `cka-tips` repo (new)

| Path | Responsibility |
|---|---|
| `tips.json` | Authoritative tip corpus (array) |
| `tip-schema.json` | JSON Schema for the corpus |
| `leitner.js` | Pure spaced-repetition functions; zero DOM deps |
| `leitner.test.js` | Vitest unit tests |
| `validate.mjs` | Node script that runs ajv over `tips.json` |
| `package.json` | Dev deps: `ajv`, `ajv-formats`, `vitest` |
| `.github/workflows/validate.yml` | Runs validate + tests on PR |
| `.github/workflows/pages.yml` | Publishes repo root to GitHub Pages |
| `index.html` | Tiny landing page that lists tips for sanity |
| `README.md` | Contributing + schema docs |

### `kube-blitz` repo (modified)

| Path | Change |
|---|---|
| `leitner.js` | New — vendored copy of the shared module |
| `tips-loader.js` | New — fetch + map tips → KB prompt shape |
| `normalise.js` | New — command normalisation for match checking |
| `app.js` | Modify — fetch tips, drive prompts via Leitner, wire mastery UI |
| `index.html` | Modify — include new scripts; add Mastery view markup |
| `styles.css` | Modify — toast, mastery panel |

### `ckarcade` repo (modified)

| Path | Change |
|---|---|
| `leitner.js` | New — vendored copy |
| `tips-loader.js` | New — fetch tips, index by id + mission |
| `app.js` | Modify — add `tipsExercised` to each mission; record results on complete; render tip card |
| `index.html` | Modify — include scripts; add tip card markup |
| `styles.css` | Modify — post-mission tip card, focus banner |

---

## Task 1: Scaffold `cka-tips` repo with schema and first seed tip

**Files:**
- Create: `~/workspace/ops/alanops/cka-tips/package.json`
- Create: `~/workspace/ops/alanops/cka-tips/tip-schema.json`
- Create: `~/workspace/ops/alanops/cka-tips/tips.json`
- Create: `~/workspace/ops/alanops/cka-tips/validate.mjs`
- Create: `~/workspace/ops/alanops/cka-tips/.gitignore`

- [x] **Step 1: Create directory and init git**

```bash
mkdir -p ~/workspace/ops/alanops/cka-tips
cd ~/workspace/ops/alanops/cka-tips
git init -b main
```

- [x] **Step 2: Write `package.json`**

```json
{
  "name": "cka-tips",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "validate": "node validate.mjs",
    "test": "vitest run"
  },
  "devDependencies": {
    "ajv": "^8.12.0",
    "ajv-formats": "^3.0.1",
    "vitest": "^1.6.0"
  }
}
```

- [x] **Step 3: Write `.gitignore`**

```
node_modules/
.DS_Store
coverage/
```

- [x] **Step 4: Write `tip-schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["id", "domain", "subtopic", "principle", "prompt", "answer", "docs", "difficulty"],
    "additionalProperties": false,
    "properties": {
      "id": { "type": "string", "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$" },
      "domain": { "enum": ["cluster", "workloads", "networking", "storage", "troubleshooting"] },
      "subtopic": { "type": "string", "minLength": 1 },
      "principle": { "type": "string", "minLength": 10 },
      "prompt": { "type": "string", "minLength": 5 },
      "answer": { "type": "string", "minLength": 5 },
      "alternates": { "type": "array", "items": { "type": "string" } },
      "docs": { "type": "string", "format": "uri" },
      "difficulty": { "type": "integer", "minimum": 1, "maximum": 3 },
      "missions": { "type": "array", "items": { "type": "string" } }
    }
  },
  "uniqueItems": true
}
```

- [x] **Step 5: Write the first seed tip in `tips.json`**

```json
[
  {
    "id": "kubectl-set-image",
    "domain": "workloads",
    "subtopic": "deployments",
    "principle": "Change a container image without editing YAML.",
    "prompt": "Update deployment 'web' to use nginx:1.25.",
    "answer": "kubectl set image deploy/web nginx=nginx:1.25",
    "alternates": ["kubectl set image deployment/web nginx=nginx:1.25"],
    "docs": "https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#set-image",
    "difficulty": 1,
    "missions": ["wrong-image"]
  }
]
```

- [x] **Step 6: Write `validate.mjs`**

```javascript
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const schema = JSON.parse(readFileSync('./tip-schema.json', 'utf8'));
const tips = JSON.parse(readFileSync('./tips.json', 'utf8'));

const validate = ajv.compile(schema);
if (!validate(tips)) {
  console.error('tips.json failed schema validation:');
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}

const ids = new Set();
for (const tip of tips) {
  if (ids.has(tip.id)) {
    console.error(`duplicate tip id: ${tip.id}`);
    process.exit(1);
  }
  ids.add(tip.id);
}

console.log(`OK: ${tips.length} tips valid`);
```

- [x] **Step 7: Install deps and run validator**

```bash
cd ~/workspace/ops/alanops/cka-tips
npm install
npm run validate
```

Expected: `OK: 1 tips valid`

- [x] **Step 8: Commit**

```bash
git add package.json tip-schema.json tips.json validate.mjs .gitignore
git commit -m "feat: scaffold cka-tips repo with schema and first seed tip"
```

---

## Task 2: Add remaining 9 seed tips

**Files:**
- Modify: `~/workspace/ops/alanops/cka-tips/tips.json`

- [x] **Step 1: Replace tips.json with 10 seed tips**

```json
[
  {
    "id": "kubectl-set-image",
    "domain": "workloads",
    "subtopic": "deployments",
    "principle": "Change a container image without editing YAML.",
    "prompt": "Update deployment 'web' to use nginx:1.25.",
    "answer": "kubectl set image deploy/web nginx=nginx:1.25",
    "alternates": ["kubectl set image deployment/web nginx=nginx:1.25"],
    "docs": "https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#set-image",
    "difficulty": 1,
    "missions": ["wrong-image"]
  },
  {
    "id": "kubectl-edit-live",
    "domain": "workloads",
    "subtopic": "deployments",
    "principle": "Edit a running resource in your $EDITOR without creating a file.",
    "prompt": "Open deployment 'web' in your editor to change replicas.",
    "answer": "kubectl edit deploy web",
    "alternates": ["kubectl edit deployment web"],
    "docs": "https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#edit",
    "difficulty": 1,
    "missions": []
  },
  {
    "id": "kubectl-patch-replicas",
    "domain": "workloads",
    "subtopic": "deployments",
    "principle": "Patch replicas on a deployment without touching YAML.",
    "prompt": "Patch deployment 'web' to 5 replicas.",
    "answer": "kubectl patch deploy web -p '{\"spec\":{\"replicas\":5}}'",
    "alternates": ["kubectl patch deployment web -p '{\"spec\":{\"replicas\":5}}'"],
    "docs": "https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#patch",
    "difficulty": 2,
    "missions": ["traffic-surge"]
  },
  {
    "id": "kubectl-set-env",
    "domain": "workloads",
    "subtopic": "config",
    "principle": "Set or update environment variables on a workload imperatively.",
    "prompt": "Set DB_HOST=postgres on deployment 'web'.",
    "answer": "kubectl set env deploy/web DB_HOST=postgres",
    "alternates": ["kubectl set env deployment/web DB_HOST=postgres"],
    "docs": "https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#set-env",
    "difficulty": 1,
    "missions": []
  },
  {
    "id": "kubectl-set-resources",
    "domain": "workloads",
    "subtopic": "resources",
    "principle": "Set CPU and memory limits without editing YAML.",
    "prompt": "Set limits cpu=200m and memory=256Mi on deployment 'web'.",
    "answer": "kubectl set resources deploy/web --limits=cpu=200m,memory=256Mi",
    "alternates": ["kubectl set resources deployment/web --limits=cpu=200m,memory=256Mi"],
    "docs": "https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#set-resources",
    "difficulty": 2,
    "missions": []
  },
  {
    "id": "kubectl-scale",
    "domain": "workloads",
    "subtopic": "deployments",
    "principle": "Scale a workload imperatively.",
    "prompt": "Scale deployment 'web' to 10 replicas.",
    "answer": "kubectl scale deploy web --replicas=10",
    "alternates": ["kubectl scale deployment web --replicas=10"],
    "docs": "https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#scale",
    "difficulty": 1,
    "missions": ["traffic-surge"]
  },
  {
    "id": "kubectl-label",
    "domain": "workloads",
    "subtopic": "metadata",
    "principle": "Apply or change labels imperatively.",
    "prompt": "Label pod 'web-xyz' with env=prod.",
    "answer": "kubectl label pod web-xyz env=prod",
    "alternates": [],
    "docs": "https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#label",
    "difficulty": 1,
    "missions": []
  },
  {
    "id": "kubectl-annotate",
    "domain": "workloads",
    "subtopic": "metadata",
    "principle": "Apply or change annotations imperatively.",
    "prompt": "Annotate deployment 'web' with owner=matt.",
    "answer": "kubectl annotate deploy web owner=matt",
    "alternates": ["kubectl annotate deployment web owner=matt"],
    "docs": "https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#annotate",
    "difficulty": 1,
    "missions": []
  },
  {
    "id": "kubectl-dry-run-yaml",
    "domain": "workloads",
    "subtopic": "generators",
    "principle": "Generate a resource YAML scaffold without creating the resource.",
    "prompt": "Print YAML for a deployment named 'web' using image nginx, without creating it.",
    "answer": "kubectl create deploy web --image=nginx --dry-run=client -o yaml",
    "alternates": ["kubectl create deployment web --image=nginx --dry-run=client -o yaml"],
    "docs": "https://kubernetes.io/docs/reference/kubectl/conventions/#generators",
    "difficulty": 2,
    "missions": []
  },
  {
    "id": "kubectl-explain-recursive",
    "domain": "troubleshooting",
    "subtopic": "discovery",
    "principle": "Discover the exact path of any field inside a spec.",
    "prompt": "Show the full recursive field tree for pod.spec.containers.",
    "answer": "kubectl explain pod.spec.containers --recursive",
    "alternates": [],
    "docs": "https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#explain",
    "difficulty": 1,
    "missions": []
  }
]
```

- [x] **Step 2: Validate**

```bash
cd ~/workspace/ops/alanops/cka-tips
npm run validate
```

Expected: `OK: 10 tips valid`

- [x] **Step 3: Commit**

```bash
git add tips.json
git commit -m "feat: seed 10 kubectl imperative tips"
```

---

## Task 3: Leitner module — state I/O and promotion transitions

**Files:**
- Create: `~/workspace/ops/alanops/cka-tips/leitner.js`
- Create: `~/workspace/ops/alanops/cka-tips/leitner.test.js`

- [x] **Step 1: Write failing tests first**

Create `leitner.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import {
  freshState,
  recordResult,
  BOX_CADENCE,
  CURRENT_VERSION,
} from './leitner.js';

describe('freshState', () => {
  it('returns a v1 state with session 0 and empty tips', () => {
    const s = freshState();
    expect(s.version).toBe(CURRENT_VERSION);
    expect(s.session).toBe(0);
    expect(s.tips).toEqual({});
  });
});

describe('recordResult — promotion', () => {
  it('promotes new tip from box 1 to box 2 on first correct', () => {
    const s = recordResult(freshState(), 'tip-a', true);
    expect(s.tips['tip-a'].box).toBe(2);
    expect(s.tips['tip-a'].mastered).toBe(false);
  });

  it('promotes through boxes 1→2→3→4→5', () => {
    let s = freshState();
    for (let i = 0; i < 5; i++) s = recordResult(s, 'tip-a', true);
    expect(s.tips['tip-a'].box).toBe(5);
    expect(s.tips['tip-a'].mastered).toBe(true);
  });

  it('caps box at 5 after mastery', () => {
    let s = freshState();
    for (let i = 0; i < 10; i++) s = recordResult(s, 'tip-a', true);
    expect(s.tips['tip-a'].box).toBe(5);
  });
});

describe('recordResult — demotion', () => {
  it('drops to box 1 on wrong answer in boxes 1-4', () => {
    let s = freshState();
    s = recordResult(s, 'tip-a', true); // box 2
    s = recordResult(s, 'tip-a', true); // box 3
    s = recordResult(s, 'tip-a', false);
    expect(s.tips['tip-a'].box).toBe(1);
  });

  it('drops mastered tip from box 5 to box 3 on wrong answer', () => {
    let s = freshState();
    for (let i = 0; i < 5; i++) s = recordResult(s, 'tip-a', true);
    expect(s.tips['tip-a'].box).toBe(5);
    s = recordResult(s, 'tip-a', false);
    expect(s.tips['tip-a'].box).toBe(3);
    expect(s.tips['tip-a'].mastered).toBe(true);
  });
});

describe('BOX_CADENCE', () => {
  it('defines the session cadence per box', () => {
    expect(BOX_CADENCE).toEqual({ 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 });
  });
});
```

- [x] **Step 2: Run tests — expect failure**

```bash
cd ~/workspace/ops/alanops/cka-tips
npm test -- leitner.test.js
```

Expected: all tests fail (module does not exist).

- [x] **Step 3: Implement `leitner.js`**

```javascript
export const CURRENT_VERSION = 1;
export const STORAGE_KEY = 'cka.leitner.v1';
export const BOX_CADENCE = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };

export function freshState() {
  return {
    version: CURRENT_VERSION,
    session: 0,
    updatedAt: new Date(0).toISOString(),
    tips: {},
  };
}

export function recordResult(state, tipId, correct) {
  const next = structuredClone(state);
  const prev = next.tips[tipId] || { box: 1, lastSeen: next.session, mastered: false, correctStreak: 0 };

  let box = prev.box;
  let streak = prev.correctStreak;
  let mastered = prev.mastered;

  if (correct) {
    box = Math.min(5, box + 1);
    streak = streak + 1;
    if (box === 5) mastered = true;
  } else {
    streak = 0;
    box = box === 5 ? 3 : 1;
  }

  next.tips[tipId] = {
    box,
    lastSeen: next.session,
    mastered,
    correctStreak: streak,
  };
  next.updatedAt = new Date().toISOString();
  return next;
}
```

- [x] **Step 4: Run tests — expect all pass**

```bash
npm test -- leitner.test.js
```

Expected: all green.

- [x] **Step 5: Commit**

```bash
git add leitner.js leitner.test.js
git commit -m "feat(leitner): state, freshState, recordResult promotion/demotion"
```

---

## Task 4: Leitner module — due-tip selection + export/import

**Files:**
- Modify: `~/workspace/ops/alanops/cka-tips/leitner.js`
- Modify: `~/workspace/ops/alanops/cka-tips/leitner.test.js`

- [x] **Step 1: Append failing tests**

Append to `leitner.test.js`:

```javascript
import { selectDueTips, loadState, saveState, exportJson, importJson, incrementSession } from './leitner.js';

const sampleTips = [
  { id: 'a', domain: 'workloads', subtopic: 'x', principle: 'p', prompt: 'p', answer: 'a', docs: 'https://x', difficulty: 1 },
  { id: 'b', domain: 'networking', subtopic: 'x', principle: 'p', prompt: 'p', answer: 'a', docs: 'https://x', difficulty: 1 },
  { id: 'c', domain: 'workloads', subtopic: 'x', principle: 'p', prompt: 'p', answer: 'a', docs: 'https://x', difficulty: 1 },
];

describe('selectDueTips', () => {
  it('returns all tips at session 0 (all unseen, all due)', () => {
    const s = freshState();
    const due = selectDueTips(s, sampleTips, { count: 10 });
    expect(due.length).toBe(3);
  });

  it('filters by domain when requested', () => {
    const s = freshState();
    const due = selectDueTips(s, sampleTips, { count: 10, domain: 'networking' });
    expect(due.map(t => t.id)).toEqual(['b']);
  });

  it('excludes tips whose next-due session is in the future', () => {
    let s = freshState();
    s = recordResult(s, 'a', true); // box 2, lastSeen 0, due again at session 2
    s = incrementSession(s);        // session 1
    const due = selectDueTips(s, sampleTips, { count: 10 });
    expect(due.map(t => t.id).sort()).toEqual(['b', 'c']);
  });

  it('respects count cap', () => {
    const s = freshState();
    const due = selectDueTips(s, sampleTips, { count: 2 });
    expect(due.length).toBe(2);
  });
});

describe('incrementSession', () => {
  it('bumps session counter', () => {
    const s = incrementSession(freshState());
    expect(s.session).toBe(1);
  });
});

describe('exportJson / importJson', () => {
  it('round-trips state', () => {
    let s = freshState();
    s = recordResult(s, 'a', true);
    const json = exportJson(s);
    const back = importJson(json);
    expect(back).toEqual(s);
  });

  it('rejects payload with wrong version', () => {
    expect(() => importJson(JSON.stringify({ version: 99, tips: {} }))).toThrow();
  });
});

describe('loadState / saveState', () => {
  it('returns freshState when localStorage is empty', () => {
    const fakeStorage = { getItem: () => null, setItem: () => {} };
    const s = loadState(fakeStorage);
    expect(s.version).toBe(CURRENT_VERSION);
    expect(s.tips).toEqual({});
  });

  it('persists state to localStorage', () => {
    const store = {};
    const fakeStorage = {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = v; },
    };
    const s = recordResult(freshState(), 'a', true);
    saveState(s, fakeStorage);
    expect(JSON.parse(store['cka.leitner.v1']).tips.a.box).toBe(2);
  });
});
```

- [x] **Step 2: Run tests — expect failures**

```bash
npm test -- leitner.test.js
```

Expected: failures for undefined exports.

- [x] **Step 3: Extend `leitner.js`**

Append to `leitner.js`:

```javascript
export function incrementSession(state) {
  return { ...state, session: state.session + 1, updatedAt: new Date().toISOString() };
}

export function selectDueTips(state, tips, opts = {}) {
  const { count = 20, domain = null } = opts;
  const pool = domain ? tips.filter(t => t.domain === domain) : tips.slice();
  const due = pool.filter(t => {
    const rec = state.tips[t.id];
    if (!rec) return true;
    const cadence = BOX_CADENCE[rec.box] || 1;
    return state.session - rec.lastSeen >= cadence;
  });
  shuffle(due, state.session);
  return due.slice(0, count);
}

function shuffle(arr, seed) {
  const rng = mulberry32(seed + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function loadState(storage = globalThis.localStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return freshState();
  try {
    const parsed = JSON.parse(raw);
    if (parsed.version !== CURRENT_VERSION) return freshState();
    return parsed;
  } catch {
    return freshState();
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportJson(state) {
  return JSON.stringify(state, null, 2);
}

export function importJson(json) {
  const parsed = JSON.parse(json);
  if (parsed.version !== CURRENT_VERSION) {
    throw new Error(`unsupported state version: ${parsed.version}`);
  }
  return parsed;
}
```

- [x] **Step 4: Run tests — all green**

```bash
npm test
```

Expected: all tests pass.

- [x] **Step 5: Commit**

```bash
git add leitner.js leitner.test.js
git commit -m "feat(leitner): selectDueTips, incrementSession, load/save/export/import"
```

---

## Task 5: CI + GitHub Pages publish

**Files:**
- Create: `~/workspace/ops/alanops/cka-tips/.github/workflows/validate.yml`
- Create: `~/workspace/ops/alanops/cka-tips/.github/workflows/pages.yml`
- Create: `~/workspace/ops/alanops/cka-tips/index.html`
- Create: `~/workspace/ops/alanops/cka-tips/README.md`

- [x] **Step 1: Validate workflow**

Create `.github/workflows/validate.yml`:

```yaml
name: validate
on:
  push:
    branches: [main]
  pull_request:
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run validate
      - run: npm test
```

- [x] **Step 2: Pages workflow**

Create `.github/workflows/pages.yml`:

```yaml
name: pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [x] **Step 3: `index.html` — DOM-safe tip list**

```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>CKA Tips</title>
<style>body{font:14px/1.5 system-ui;margin:2rem;max-width:60rem}code{background:#eee;padding:0 .3em}</style>
</head>
<body>
<h1>CKA Tips</h1>
<p>Authoritative corpus for CKArcade + Kube-Blitz.</p>
<p>Fetch at <code>https://alanops.github.io/cka-tips/tips.json</code>.</p>
<ul id="list"></ul>
<script>
fetch('tips.json').then(r => r.json()).then(tips => {
  const ul = document.getElementById('list');
  for (const t of tips) {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = t.id;
    li.append(b, ' — ', t.principle);
    ul.appendChild(li);
  }
});
</script>
</body></html>
```

- [x] **Step 4: README**

```markdown
# cka-tips

Shared tip corpus + Leitner spaced-repetition module for CKArcade and Kube-Blitz.

## Structure
- `tips.json` — authoritative tip array
- `tip-schema.json` — JSON Schema
- `leitner.js` — pure SR module (vendored into each game)

## Contributing a tip
1. Add an object to `tips.json` matching the schema.
2. Run `npm run validate`.
3. PR.

## Leitner logic
Edit `leitner.js`. Write tests first. `npm test`.

## Design
See design spec in ckarcade repo: `docs/superpowers/specs/2026-04-18-cka-tips-system-design.md`.
```

- [x] **Step 5: Create GitHub repo and push**

```bash
cd ~/workspace/ops/alanops/cka-tips
gh repo create alanops/cka-tips --public --source=. --remote=origin --push
```

- [x] **Step 6: Enable Pages**

```bash
gh api -X POST repos/alanops/cka-tips/pages -f build_type=workflow
```

- [x] **Step 7: Verify deploy**

Wait ~60s for Pages to build, then:

```bash
curl -sS https://alanops.github.io/cka-tips/tips.json | head -20
```

Expected: first seed tips visible.

- [x] **Step 8: Commit + push**

```bash
git add .github README.md index.html
git commit -m "ci: add validate + pages workflows, landing page, README"
git push
```

---

## Task 6: Kube-Blitz — fetch tips + vendor Leitner (behind `?tips=1` flag)

**Files:**
- Create: `~/workspace/ops/alanops/kube-blitz/leitner.js` (copy)
- Create: `~/workspace/ops/alanops/kube-blitz/tips-loader.js`
- Create: `~/workspace/ops/alanops/kube-blitz/normalise.js`
- Modify: `~/workspace/ops/alanops/kube-blitz/index.html`
- Modify: `~/workspace/ops/alanops/kube-blitz/app.js`

- [x] **Step 1: Copy `leitner.js` into kube-blitz**

```bash
cp ~/workspace/ops/alanops/cka-tips/leitner.js ~/workspace/ops/alanops/kube-blitz/leitner.js
```

- [x] **Step 2: Write `normalise.js`**

```javascript
export function normalise(cmd) {
  return cmd
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\bdeployment\b/g, 'deploy')
    .replace(/\bservice\b/g, 'svc')
    .replace(/\bnamespace\b/g, 'ns')
    .replace(/\bpods\b/g, 'pod');
}

export function matches(typed, answer, alternates = []) {
  const n = normalise(typed);
  const candidates = [answer, ...alternates].map(normalise);
  return candidates.includes(n);
}
```

- [x] **Step 3: Write `tips-loader.js`**

```javascript
const TIPS_URL = 'https://alanops.github.io/cka-tips/tips.json';

export async function loadTips() {
  const res = await fetch(TIPS_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`tips fetch failed: ${res.status}`);
  return res.json();
}

export function tipToPrompt(tip) {
  return {
    id: tip.id,
    category: mapDomainToCategory(tip.domain, tip.subtopic),
    difficulty: ['easy', 'medium', 'hard'][tip.difficulty - 1] || 'easy',
    title: tip.principle,
    text: tip.prompt,
    acceptable: [tip.answer, ...(tip.alternates || [])],
    explanation: tip.principle,
    docs: tip.docs,
  };
}

function mapDomainToCategory(domain, subtopic) {
  if (subtopic === 'helm') return 'helm';
  if (domain === 'workloads' && subtopic === 'deployments') return 'deployments';
  if (domain === 'workloads') return 'deployments';
  if (domain === 'networking') return 'services';
  if (domain === 'troubleshooting') return 'ops';
  if (subtopic === 'config') return 'config';
  return 'ops';
}
```

- [x] **Step 4: Include scripts in `index.html`**

Find the existing `<script src="app.js"></script>` line and insert before it:

```html
<script type="module" src="leitner.js"></script>
<script type="module" src="tips-loader.js"></script>
<script type="module" src="normalise.js"></script>
```

- [x] **Step 5: Wire Leitner into `app.js` behind a flag**

At the end of `app.js`, after the existing game logic, append:

```javascript
// --- CKA Tips integration (flagged during rollout) ---
const tipsFlagOn = new URLSearchParams(location.search).has('tips');

async function initTipsMode() {
  const { loadTips, tipToPrompt } = await import('./tips-loader.js');
  const { loadState, saveState, selectDueTips, recordResult, incrementSession } =
    await import('./leitner.js');
  const { matches } = await import('./normalise.js');

  const tips = await loadTips();
  let state = incrementSession(loadState());
  saveState(state);

  const due = selectDueTips(state, tips, { count: 40 });
  const pool = due.length ? due : tips;
  prompts.length = 0;
  for (const t of pool) prompts.push(tipToPrompt(t));

  window.__tipsCheckAnswer = (promptObj, typed) => {
    const ok = matches(typed, promptObj.acceptable[0], promptObj.acceptable.slice(1));
    state = recordResult(state, promptObj.id, ok);
    saveState(state);
    return ok;
  };
}

if (tipsFlagOn) {
  initTipsMode().catch(err => console.error('tips mode failed', err));
}
```

Find the answer-check site in `app.js` (grep `acceptable` near line 543). When `window.__tipsCheckAnswer` is defined, call it instead of the existing `acceptable.includes(...)` comparison; otherwise fall back.

- [x] **Step 6: Smoke test locally**

```bash
cd ~/workspace/ops/alanops/kube-blitz
python3 -m http.server 8090
```

Open `http://localhost:8090/?tips=1`. Play a round; confirm prompts come from the live tips corpus. Open DevTools and inspect `localStorage.getItem('cka.leitner.v1')` — boxes should update on correct/wrong answers.

- [x] **Step 7: Commit + push**

```bash
git add leitner.js tips-loader.js normalise.js index.html app.js
git commit -m "feat: CKA tips mode behind ?tips=1 flag with Leitner tracking"
git push
```

---

## Task 7: Kube-Blitz — box-change toast + Mastery view + export/import

**Files:**
- Modify: `~/workspace/ops/alanops/kube-blitz/app.js`
- Modify: `~/workspace/ops/alanops/kube-blitz/index.html`
- Modify: `~/workspace/ops/alanops/kube-blitz/styles.css`

- [x] **Step 1: Add markup (DOM-safe — no inline scripts writing innerHTML)**

In `index.html`, before `</body>`, add:

```html
<button id="open-mastery">Mastery</button>
<div id="tip-toast" class="tip-toast hidden"></div>
<section id="mastery-panel" class="mastery-panel hidden">
  <h2>Mastery</h2>
  <div id="mastery-bars"></div>
  <div class="mastery-actions">
    <button id="export-leitner">Export</button>
    <button id="import-leitner">Import</button>
  </div>
</section>
```

- [x] **Step 2: Styles**

Append to `styles.css`:

```css
.tip-toast{position:fixed;bottom:1rem;right:1rem;background:#111;color:#0f0;padding:.5rem .75rem;font-family:monospace;border:1px solid #0f0;border-radius:4px;z-index:1000}
.tip-toast.hidden{display:none}
.mastery-panel{position:fixed;top:2rem;right:2rem;bottom:2rem;width:24rem;background:#000;color:#0f0;border:1px solid #0f0;padding:1rem;overflow:auto;z-index:900}
.mastery-panel.hidden{display:none}
.mastery-bar{display:flex;align-items:center;gap:.5rem;margin:.25rem 0}
.mastery-bar .name{width:10rem}
.mastery-bar .bar{flex:1;height:.5rem;background:#222;position:relative}
.mastery-bar .fill{position:absolute;left:0;top:0;bottom:0;background:#0f0}
.mastery-actions{margin-top:1rem;display:flex;gap:.5rem}
```

- [x] **Step 3: DOM-safe render helpers in `app.js`**

Extend `initTipsMode` with:

```javascript
function showToast(tipId, deltaBox) {
  const el = document.getElementById('tip-toast');
  if (!el) return;
  const arrow = deltaBox > 0 ? '↑' : deltaBox < 0 ? '↓' : '·';
  el.textContent = `${tipId} ${arrow} box ${state.tips[tipId].box}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 1800);
}

function renderMastery() {
  const domains = ['cluster', 'workloads', 'networking', 'storage', 'troubleshooting'];
  const host = document.getElementById('mastery-bars');
  host.replaceChildren();
  for (const d of domains) {
    const domainTips = tips.filter(t => t.domain === d);
    const mastered = domainTips.filter(t => state.tips[t.id]?.mastered).length;
    const pct = domainTips.length ? Math.round(100 * mastered / domainTips.length) : 0;

    const row = document.createElement('div');
    row.className = 'mastery-bar';

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = d;

    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('div');
    fill.className = 'fill';
    fill.style.width = `${pct}%`;
    bar.appendChild(fill);

    const count = document.createElement('span');
    count.textContent = `${mastered}/${domainTips.length}`;

    row.append(name, bar, count);
    host.appendChild(row);
  }
}

const baseCheck = window.__tipsCheckAnswer;
window.__tipsCheckAnswer = (promptObj, typed) => {
  const prev = state.tips[promptObj.id]?.box ?? 1;
  const ok = baseCheck(promptObj, typed);
  const next = state.tips[promptObj.id].box;
  showToast(promptObj.id, next - prev);
  return ok;
};

document.getElementById('open-mastery').addEventListener('click', () => {
  renderMastery();
  document.getElementById('mastery-panel').classList.toggle('hidden');
});

document.getElementById('export-leitner').addEventListener('click', async () => {
  const { exportJson } = await import('./leitner.js');
  await navigator.clipboard.writeText(exportJson(state));
  alert('Copied Leitner state to clipboard.');
});

document.getElementById('import-leitner').addEventListener('click', async () => {
  const { importJson, saveState } = await import('./leitner.js');
  const json = prompt('Paste Leitner state JSON:');
  if (!json) return;
  try {
    state = importJson(json);
    saveState(state);
    renderMastery();
    alert('Imported.');
  } catch (e) {
    alert('Import failed: ' + e.message);
  }
});
```

- [x] **Step 4: Smoke test**

Reload `http://localhost:8090/?tips=1`. Answer correctly — toast appears. Click Mastery — bars render.

- [x] **Step 5: Commit + push**

```bash
git add app.js index.html styles.css
git commit -m "feat: toast, mastery panel, export/import for tips mode"
git push
```

---

## Task 8: Kube-Blitz — drop the flag (tips on by default)

**Files:**
- Modify: `~/workspace/ops/alanops/kube-blitz/app.js`
- Modify: `~/workspace/ops/alanops/kube-blitz/README.md`

- [x] **Step 1: Remove flag gate**

In `app.js`, replace:

```javascript
if (tipsFlagOn) {
  initTipsMode().catch(err => console.error('tips mode failed', err));
}
```

with:

```javascript
initTipsMode().catch(err => {
  console.error('tips mode failed, falling back to static prompts', err);
});
```

- [x] **Step 2: Update README**

Append to `~/workspace/ops/alanops/kube-blitz/README.md`:

```
## Tips & mastery
Prompts come from the shared [cka-tips](https://github.com/alanops/cka-tips) corpus.
Mastery state is tracked in `localStorage['cka.leitner.v1']` and shared with CKArcade.
```

- [x] **Step 3: Smoke test at root URL (no flag)**

Open `http://localhost:8090/` — tips mode should be default.

- [x] **Step 4: Commit + push**

```bash
git add app.js README.md
git commit -m "feat: tips mode on by default"
git push
```

---

## Task 9: CKArcade — tag missions + vendor Leitner + record results (behind `?tips=1`)

**Files:**
- Create: `~/workspace/ops/alanops/ckarcade/leitner.js` (copy)
- Create: `~/workspace/ops/alanops/ckarcade/tips-loader.js`
- Modify: `~/workspace/ops/alanops/ckarcade/app.js`
- Modify: `~/workspace/ops/alanops/ckarcade/index.html`

- [x] **Step 1: Copy Leitner**

```bash
cp ~/workspace/ops/alanops/cka-tips/leitner.js ~/workspace/ops/alanops/ckarcade/leitner.js
```

- [x] **Step 2: Write `tips-loader.js`**

```javascript
const TIPS_URL = 'https://alanops.github.io/cka-tips/tips.json';

export async function loadTips() {
  const res = await fetch(TIPS_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`tips fetch failed: ${res.status}`);
  const tips = await res.json();
  const byId = new Map(tips.map(t => [t.id, t]));
  const byMission = new Map();
  for (const t of tips) {
    for (const m of (t.missions || [])) {
      if (!byMission.has(m)) byMission.set(m, []);
      byMission.get(m).push(t);
    }
  }
  return { tips, byId, byMission };
}
```

- [x] **Step 3: Tag the 6 existing missions**

In `app.js`, add `tipsExercised` to each mission (inside the `const missions = [...]` array):

| Mission id | tipsExercised |
|---|---|
| `pod-panic` | `[]` — no `kubectl-run` tip seeded yet |
| `wrong-image` | `['kubectl-set-image']` |
| `lost-signal` | `[]` — needs `svc-selectors` tip |
| `traffic-surge` | `['kubectl-scale', 'kubectl-patch-replicas']` |
| `night-rollout` | `[]` — needs `kubectl-rollout-undo` |
| `harbor-routing` | `[]` — needs `svc-routing` |

Add the field as the last property of each mission object.

- [x] **Step 4: Include modules in `index.html`**

Before the existing `<script src="app.js">`:

```html
<script type="module" src="leitner.js"></script>
<script type="module" src="tips-loader.js"></script>
```

- [x] **Step 5: Wire recording at mission-complete**

At the end of `app.js`, append:

```javascript
// --- CKA Tips integration (flagged during rollout) ---
const tipsFlagOn = new URLSearchParams(location.search).has('tips');
let tipsBundle = null;
let leitnerState = null;

async function initCkArcadeTips() {
  const { loadTips } = await import('./tips-loader.js');
  const { loadState, saveState, incrementSession } = await import('./leitner.js');
  tipsBundle = await loadTips();
  leitnerState = incrementSession(loadState());
  saveState(leitnerState);
}

async function recordMissionTips(missionId, correct) {
  if (!tipsFlagOn || !tipsBundle) return;
  const { recordResult, saveState } = await import('./leitner.js');
  const mission = missions.find(m => m.id === missionId);
  for (const tipId of (mission.tipsExercised || [])) {
    leitnerState = recordResult(leitnerState, tipId, correct);
  }
  saveState(leitnerState);
}

if (tipsFlagOn) initCkArcadeTips().catch(err => console.error('tips init failed', err));
```

Hook `recordMissionTips(mission.id, true)` wherever the existing code flips mission state to complete (grep `missionComplete = true`).

- [x] **Step 6: Smoke test**

```bash
cd ~/workspace/ops/alanops/ckarcade
python3 -m http.server 8080
```

Open `http://localhost:8080/?tips=1`. Solve "The Wrong Image". Check DevTools `localStorage.getItem('cka.leitner.v1')` — `kubectl-set-image` should advance to box 2.

- [x] **Step 7: Commit + push**

```bash
git add leitner.js tips-loader.js app.js index.html
git commit -m "feat: tips mode wiring + mission tip tagging behind ?tips=1"
git push
```

---

## Task 10: CKArcade — Pro Tip card + focus banner + export/import

**Files:**
- Modify: `~/workspace/ops/alanops/ckarcade/app.js`
- Modify: `~/workspace/ops/alanops/ckarcade/index.html`
- Modify: `~/workspace/ops/alanops/ckarcade/styles.css`

- [x] **Step 1: Markup**

In `index.html`, inside the mission-complete UI region, add:

```html
<section id="pro-tip-card" class="pro-tip-card hidden">
  <h3>Pro Tip</h3>
  <p id="pro-tip-principle"></p>
  <a id="pro-tip-docs" target="_blank" rel="noreferrer">docs ↗</a>
  <small id="pro-tip-delta"></small>
</section>
<section id="focus-banner" class="focus-banner hidden"></section>
<div class="tips-actions">
  <button id="export-leitner">Export mastery</button>
  <button id="import-leitner">Import mastery</button>
</div>
```

- [x] **Step 2: Styles**

Append to `styles.css`:

```css
.pro-tip-card{border:1px solid #0ff;padding:1rem;margin:1rem 0;background:#001}
.pro-tip-card.hidden{display:none}
.focus-banner{background:#110;color:#ff0;padding:.5rem 1rem;border:1px solid #ff0;margin-bottom:.5rem}
.focus-banner.hidden{display:none}
.tips-actions{display:flex;gap:.5rem;margin-top:1rem}
```

- [x] **Step 3: Render the card (DOM-safe, textContent only)**

Extend `recordMissionTips` and add helpers in `app.js`:

```javascript
async function recordMissionTips(missionId, correct) {
  if (!tipsFlagOn || !tipsBundle) return;
  const { recordResult, saveState } = await import('./leitner.js');
  const mission = missions.find(m => m.id === missionId);
  const exercised = mission.tipsExercised || [];
  const before = exercised.map(id => leitnerState.tips[id]?.box ?? 1);
  for (const tipId of exercised) {
    leitnerState = recordResult(leitnerState, tipId, correct);
  }
  saveState(leitnerState);
  if (exercised.length) showProTipCard(exercised[0], before[0]);
}

function showProTipCard(tipId, prevBox) {
  const tip = tipsBundle.byId.get(tipId);
  if (!tip) return;
  const card = document.getElementById('pro-tip-card');
  document.getElementById('pro-tip-principle').textContent = tip.principle;
  const docs = document.getElementById('pro-tip-docs');
  docs.href = tip.docs;
  const now = leitnerState.tips[tipId].box;
  const suffix = now === 5 ? ' · mastered' : '';
  document.getElementById('pro-tip-delta').textContent =
    `${tip.id} box ${prevBox} → ${now}${suffix}`;
  card.classList.remove('hidden');
}

function renderFocusBanner() {
  const domains = ['cluster', 'workloads', 'networking', 'storage', 'troubleshooting'];
  let weakest = domains[0];
  let weakestScore = Infinity;
  for (const d of domains) {
    const dt = tipsBundle.tips.filter(t => t.domain === d);
    if (!dt.length) continue;
    const m = dt.filter(t => leitnerState.tips[t.id]?.mastered).length;
    const score = m / dt.length;
    if (score < weakestScore) { weakestScore = score; weakest = d; }
  }
  const banner = document.getElementById('focus-banner');
  banner.textContent = `Today's focus: ${weakest}`;
  banner.classList.remove('hidden');
}
```

Call `renderFocusBanner()` at the end of `initCkArcadeTips` (after `saveState(leitnerState)`).

- [x] **Step 4: Export / import buttons**

```javascript
document.getElementById('export-leitner').addEventListener('click', async () => {
  const { exportJson } = await import('./leitner.js');
  await navigator.clipboard.writeText(exportJson(leitnerState));
  alert('Copied Leitner state to clipboard.');
});

document.getElementById('import-leitner').addEventListener('click', async () => {
  const { importJson, saveState } = await import('./leitner.js');
  const json = prompt('Paste Leitner state JSON:');
  if (!json) return;
  try {
    leitnerState = importJson(json);
    saveState(leitnerState);
    alert('Imported.');
  } catch (e) {
    alert('Import failed: ' + e.message);
  }
});
```

- [x] **Step 5: Smoke test**

Reload `http://localhost:8080/?tips=1`. Solve "The Wrong Image". Confirm Pro Tip card appears with `kubectl-set-image` principle, docs link, and box delta.

- [x] **Step 6: Commit + push**

```bash
git add app.js index.html styles.css
git commit -m "feat: post-mission Pro Tip card, focus banner, export/import"
git push
```

---

## Task 11: CKArcade — drop the flag

**Files:**
- Modify: `~/workspace/ops/alanops/ckarcade/app.js`
- Modify: `~/workspace/ops/alanops/ckarcade/README.md`

- [x] **Step 1: Remove flag gate**

Change:

```javascript
if (tipsFlagOn) initCkArcadeTips().catch(err => console.error('tips init failed', err));
```

to:

```javascript
initCkArcadeTips().catch(err => console.error('tips init failed', err));
```

Remove the `tipsFlagOn` early-return in `recordMissionTips`.

- [x] **Step 2: README update**

Append to `ckarcade/README.md`:

```
## Tips + mastery
Each mission is tagged with CKA tips from the shared [cka-tips](https://github.com/alanops/cka-tips) corpus. Solve a mission → its tips get promoted in a Leitner box. Mastery is shared with Kube-Blitz via localStorage.
```

- [x] **Step 3: Smoke test at root URL**

`http://localhost:8080/` should now show tips by default.

- [x] **Step 4: Commit + push**

```bash
git add app.js README.md
git commit -m "feat: tips mode on by default"
git push
```

---

## Task 12: Content production kickoff (sub-project 5)

**Files:**
- Create: `~/workspace/ops/alanops/cka-tips/CONTRIBUTING.md`
- Create: `~/workspace/ops/alanops/cka-tips/.github/ISSUE_TEMPLATE/new-tip.yml`

- [x] **Step 1: Contributing guide**

```markdown
# Contributing tips

## Checklist for a new tip
- [ ] `id` is kebab-case, stable, unique.
- [ ] `domain` matches one of the 5 CKA exam domains.
- [ ] `principle` is one sentence, teaches a single idea.
- [ ] `prompt` is unambiguous — a human could answer without guessing.
- [ ] `answer` is the canonical imperative form.
- [ ] `alternates` covers plausible aliases (e.g. `deployment` vs `deploy`).
- [ ] `docs` links to official Kubernetes / Helm docs, not blogs.
- [ ] `difficulty` calibrated: 1 = reflex, 2 = applied, 3 = nuanced.
- [ ] `missions` populated if any existing CKArcade mission exercises this tip.
- [ ] `npm run validate` passes.
- [ ] `npm test` passes.

## Cadence
Target: +10 tips per week, weighted toward weak exam domains per mastery data.
```

- [x] **Step 2: Issue template**

Create `.github/ISSUE_TEMPLATE/new-tip.yml`:

```yaml
name: New tip
description: Propose a CKA tip
body:
  - type: textarea
    id: principle
    attributes: { label: Principle, description: one sentence }
    validations: { required: true }
  - type: input
    id: answer
    attributes: { label: Answer (canonical kubectl/helm command) }
    validations: { required: true }
  - type: input
    id: docs
    attributes: { label: Docs URL }
    validations: { required: true }
  - type: dropdown
    id: domain
    attributes:
      label: Domain
      options: [cluster, workloads, networking, storage, troubleshooting]
    validations: { required: true }
```

- [x] **Step 3: Commit + push**

```bash
cd ~/workspace/ops/alanops/cka-tips
git add CONTRIBUTING.md .github/ISSUE_TEMPLATE/new-tip.yml
git commit -m "docs: contributing guide + new-tip issue template"
git push
```

---

## Self-Review Notes

**Spec coverage check:**
- Shared tips library + schema → Tasks 1-2, 5
- Leitner tracker → Tasks 3-4
- Kube-Blitz integration → Tasks 6-8
- CKArcade integration → Tasks 9-11
- Content production kickoff → Task 12
- Storage/export/import → Tasks 4, 7, 10
- Rollout flag lifecycle → Tasks 6 (introduce) → 8, 11 (remove)

**Known gaps (deliberate, deferred to content production):**
- Missions `pod-panic`, `lost-signal`, `night-rollout`, `harbor-routing` have empty `tipsExercised` because the matching tips (`kubectl-run`, `svc-selectors`, `rollout-undo`, `svc-routing`) aren't in the 10-tip seed. They'll be filled in sub-project 5.
- Kube-Blitz's static prompt array remains in the source as a fallback when `tips.json` fetch fails; it is not the primary path.

**Type/name consistency:**
- `STORAGE_KEY = 'cka.leitner.v1'` used uniformly.
- `selectDueTips(state, tips, opts)` signature consistent across test + integration calls.
- `tipsExercised` field name used consistently in CKArcade + schema.
