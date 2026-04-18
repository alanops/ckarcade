# CKArcade

Retro-styled Kubernetes incident simulator for CKA-style practice.

## Live
- Game: https://alanops.github.io/ckarcade/
- Repo: https://github.com/alanops/ckarcade

## What it is
CKArcade turns Kubernetes troubleshooting into a small browser game.

You play through timed incident missions using terminal-style commands such as:
- `kubectl get ...`
- `kubectl describe ...`
- `kubectl logs ...`
- `kubectl run ...`
- `kubectl set image ...`
- `kubectl patch ...`
- `kubectl scale ...`

It is designed as a fun learning layer for CKA-style thinking rather than a full real-cluster exam simulator.

## Features
- 6 playable incident missions
- campaign map and mission progression
- score, rank, hints, and stability meter
- animated solution playback with movie-style controls
- terminal autocomplete, ghost suggestions, and clickable command chips
- command-path validation that turns input red when you go off track
- contextual links to official Kubernetes docs
- sound effects, keyboard shortcuts, and restart controls
- browser-only static app with no build step

## Missions
1. **Pod Panic** - create a missing pod
2. **The Wrong Image** - repair a broken deployment image
3. **Lost Signal** - fix a service selector mismatch
4. **Traffic Surge** - scale a deployment to survive load
5. **Night Rollout** - recover a failed image rollout
6. **Harbor Routing** - repair service routing for tracker pods

## Controls
### Game controls
- `Space` - play/pause solution playback
- `[` - step back
- `]` - step forward
- `H` - hint
- `R` - restart current mission
- `M` - toggle sound

### Terminal helpers
- `Tab` - accept ghost autocomplete
- `Right Arrow` - accept ghost autocomplete
- `Enter` - accept the top suggestion when the input is off the rails

## Run locally
```bash
cd ckarcade
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Reset options
### Restart current mission
- UI: **Restart Mission**
- terminal: `r` or `restart-mission`

### Restart full campaign from mission 1
- UI: **Restart Campaign**
- terminal: `reset-game` or `restart-campaign`

## Current scope
CKArcade currently uses a simulated cluster/game state rather than a real Kubernetes backend.

That makes it a good fit for:
- fast practice
- command familiarity
- troubleshooting pattern recognition
- game-style learning

## Next directions
- rank-based mission packs
- boss incidents per tier
- more realistic CKA mission chains
- side-panel docs/reference view
- optional real-cluster mode backed by `kind`

## Tips + mastery
Each mission is tagged with CKA tips from the shared [cka-tips](https://github.com/alanops/cka-tips) corpus. Solve a mission → its tips get promoted in a Leitner box. Mastery is shared with Kube-Blitz via localStorage.
