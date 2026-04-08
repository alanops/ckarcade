# CKArcade

A retro-styled Kubernetes incident simulator built like a small video game for CKA-style practice.

## MVP features
- 4 playable incident missions
- terminal-driven command input
- mission timer, scoring, hints, and rank progression
- fake cluster dashboard with pods, deployments, and services
- browser-only static app with no build step

## Missions
1. **Pod Panic** - create a missing pod
2. **The Wrong Image** - repair a broken deployment image
3. **Lost Signal** - fix a service selector mismatch
4. **Traffic Surge** - scale a deployment to survive load

## Run locally
From this directory:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Current command support
- `help`
- `clear`
- `mission`
- `status`
- `hint`
- `kubectl get pods`
- `kubectl get deployments`
- `kubectl get services`
- `kubectl describe pod <name>`
- `kubectl describe deployment <name>`
- `kubectl describe service <name>`
- `kubectl logs <pod-name>`
- `kubectl run scout --image=nginx`
- `kubectl set image deployment/<name> <container>=<image>`
- `kubectl patch service <name> -p '{"spec":{"selector":{"app":"value"}}}'`
- `kubectl scale deployment <name> --replicas=<n>`

## Next good upgrades
- add more missions and a campaign map
- add sound effects and pixel-art animations
- support more `kubectl` verbs and YAML editing
- add a real-cluster exam mode backed by `kind`
