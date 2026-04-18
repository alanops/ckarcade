const STORAGE_KEY = 'ckarcade-progress-v1';

const missions = [
  {
    id: 'pod-panic',
    zone: 'Pod District',
    title: 'Pod Panic',
    story: 'A scout pod failed to launch before the morning systems check. Spin up a healthy nginx scout pod before HQ notices the gap in perimeter coverage.',
    objective: 'Create a pod named scout using the nginx image.',
    duration: 240,
    hints: [
      'Use kubectl to create a single pod directly from an image.',
      'The command starts with: kubectl run scout ...',
      'Try: kubectl run scout --image=nginx'
    ],
    solution: [
      'kubectl run scout --image=nginx'
    ],
    createState: () => ({
      namespace: 'ops-lab',
      pods: [],
      deployments: [],
      services: [],
      alerts: ['No scout pod is protecting Pod District.'],
      logs: {},
      files: {}
    }),
    validator: (state) => {
      const pod = state.pods.find((item) => item.name === 'scout');
      return Boolean(pod && pod.image === 'nginx' && pod.status === 'Running' && pod.ready === '1/1');
    },
    tipsExercised: []
  },
  {
    id: 'wrong-image',
    zone: 'Deployment Heights',
    title: 'The Wrong Image',
    story: 'Bakery kiosks across the district are dark after a bad rollout. Fix the deployment image so all customer terminals come back online.',
    objective: 'Repair the bakery-web deployment so all 3 replicas are ready.',
    duration: 300,
    hints: [
      'Inspect the deployment and look for a bad image tag.',
      'Use kubectl set image on deployment/bakery-web.',
      'Try: kubectl set image deployment/bakery-web bakery-web=nginx:1.27'
    ],
    solution: [
      'kubectl get deployments',
      'kubectl describe deployment bakery-web',
      'kubectl set image deployment/bakery-web bakery-web=nginx:1.27'
    ],
    createState: () => ({
      namespace: 'bakery',
      pods: [
        { name: 'bakery-web-7ff9b', ready: '0/1', status: 'ImagePullBackOff', restarts: 4, age: '12m', labels: { app: 'bakery-web' }, image: 'nginx:notreal' },
        { name: 'bakery-web-7ff9c', ready: '0/1', status: 'ImagePullBackOff', restarts: 4, age: '12m', labels: { app: 'bakery-web' }, image: 'nginx:notreal' },
        { name: 'bakery-web-7ff9d', ready: '0/1', status: 'ImagePullBackOff', restarts: 4, age: '12m', labels: { app: 'bakery-web' }, image: 'nginx:notreal' }
      ],
      deployments: [
        { name: 'bakery-web', ready: '0/3', upToDate: 3, available: 0, age: '12m', image: 'nginx:notreal', replicas: 3, labels: { app: 'bakery-web' } }
      ],
      services: [
        { name: 'bakery-web', type: 'ClusterIP', clusterIP: '10.96.0.20', port: '80/TCP', age: '12m', selector: { app: 'bakery-web' } }
      ],
      alerts: ['bakery-web deployment is failing with ImagePullBackOff.'],
      logs: {
        'bakery-web-7ff9b': 'Failed to pull image "nginx:notreal": image not found.',
        'bakery-web-7ff9c': 'Failed to pull image "nginx:notreal": image not found.',
        'bakery-web-7ff9d': 'Failed to pull image "nginx:notreal": image not found.'
      },
      files: {}
    }),
    validator: (state) => {
      const deploy = state.deployments.find((item) => item.name === 'bakery-web');
      return Boolean(deploy && deploy.image === 'nginx:1.27' && deploy.ready === '3/3' && deploy.available === 3);
    },
    tipsExercised: ['kubectl-set-image']
  },
  {
    id: 'lost-signal',
    zone: 'Service Sector',
    title: 'Lost Signal',
    story: 'Traffic is reaching the checkout gateway but nothing is hitting the application pods. Restore routing before the queue rage meter maxes out.',
    objective: 'Fix the checkout service selector so it targets the healthy checkout-api pods.',
    duration: 300,
    hints: [
      'Compare the service selector with the pod labels.',
      'Use kubectl describe service checkout to inspect the mismatch.',
      'Try: kubectl patch service checkout -p {"spec":{"selector":{"app":"checkout-api"}}}'
    ],
    solution: [
      'kubectl get pods',
      'kubectl describe service checkout',
      'kubectl patch service checkout -p {"spec":{"selector":{"app":"checkout-api"}}}'
    ],
    createState: () => ({
      namespace: 'retail',
      pods: [
        { name: 'checkout-api-5dc79', ready: '1/1', status: 'Running', restarts: 0, age: '20m', labels: { app: 'checkout-api' }, image: 'ghcr.io/example/checkout:1.2.0' },
        { name: 'checkout-api-5dc80', ready: '1/1', status: 'Running', restarts: 0, age: '20m', labels: { app: 'checkout-api' }, image: 'ghcr.io/example/checkout:1.2.0' }
      ],
      deployments: [
        { name: 'checkout-api', ready: '2/2', upToDate: 2, available: 2, age: '20m', image: 'ghcr.io/example/checkout:1.2.0', replicas: 2, labels: { app: 'checkout-api' } }
      ],
      services: [
        { name: 'checkout', type: 'ClusterIP', clusterIP: '10.96.0.31', port: '8080/TCP', age: '20m', selector: { app: 'checkout' } }
      ],
      alerts: ['checkout service has zero endpoints due to a selector mismatch.'],
      logs: {},
      files: {}
    }),
    validator: (state) => {
      const svc = state.services.find((item) => item.name === 'checkout');
      return Boolean(svc && svc.selector.app === 'checkout-api');
    },
    tipsExercised: []
  },
  {
    id: 'traffic-surge',
    zone: 'Node Ops Station',
    title: 'Traffic Surge',
    story: 'The Edge Gateway is buckling under a sudden burst of traffic. Scale out the deployment before packet loss shreds your final score.',
    objective: 'Scale the edge-gateway deployment from 1 replica to 3 replicas.',
    duration: 240,
    hints: [
      'Check how many replicas the deployment currently has.',
      'Use kubectl scale deployment edge-gateway --replicas=3',
      'You need the deployment to report 3/3 ready replicas.'
    ],
    solution: [
      'kubectl get deployments',
      'kubectl scale deployment edge-gateway --replicas=3'
    ],
    createState: () => ({
      namespace: 'edge',
      pods: [
        { name: 'edge-gateway-799f0', ready: '1/1', status: 'Running', restarts: 0, age: '5m', labels: { app: 'edge-gateway' }, image: 'ghcr.io/example/gateway:2.0.0' }
      ],
      deployments: [
        { name: 'edge-gateway', ready: '1/1', upToDate: 1, available: 1, age: '5m', image: 'ghcr.io/example/gateway:2.0.0', replicas: 1, labels: { app: 'edge-gateway' } }
      ],
      services: [
        { name: 'edge-gateway', type: 'LoadBalancer', clusterIP: '10.96.0.99', port: '80:30080/TCP', age: '5m', selector: { app: 'edge-gateway' } }
      ],
      alerts: ['edge-gateway capacity is too low for current load.'],
      logs: {},
      files: {}
    }),
    validator: (state) => {
      const deploy = state.deployments.find((item) => item.name === 'edge-gateway');
      return Boolean(deploy && deploy.replicas === 3 && deploy.ready === '3/3');
    },
    tipsExercised: ['kubectl-scale', 'kubectl-patch-replicas']
  },
  {
    id: 'night-rollout',
    zone: 'Deployment Heights',
    title: 'Night Rollout',
    story: 'A midnight rollout left the reporting stack stranded on a fake image tag. Restore the reporting deployment before the morning dashboards open.',
    objective: 'Fix the report-api deployment so both replicas become ready.',
    duration: 300,
    hints: [
      'This mission behaves like an image rollback task.',
      'Inspect the deployment name and use kubectl set image.',
      'Try: kubectl set image deployment/report-api report-api=nginx:1.27'
    ],
    solution: [
      'kubectl describe deployment report-api',
      'kubectl set image deployment/report-api report-api=nginx:1.27'
    ],
    createState: () => ({
      namespace: 'analytics',
      pods: [
        { name: 'report-api-8810a', ready: '0/1', status: 'ImagePullBackOff', restarts: 3, age: '9m', labels: { app: 'report-api' }, image: 'nginx:ghost' },
        { name: 'report-api-8810b', ready: '0/1', status: 'ImagePullBackOff', restarts: 3, age: '9m', labels: { app: 'report-api' }, image: 'nginx:ghost' }
      ],
      deployments: [
        { name: 'report-api', ready: '0/2', upToDate: 2, available: 0, age: '9m', image: 'nginx:ghost', replicas: 2, labels: { app: 'report-api' } }
      ],
      services: [
        { name: 'report-api', type: 'ClusterIP', clusterIP: '10.96.0.71', port: '8080/TCP', age: '9m', selector: { app: 'report-api' } }
      ],
      alerts: ['report-api rollout is failing with ImagePullBackOff.'],
      logs: {
        'report-api-8810a': 'Failed to pull image "nginx:ghost": image not found.',
        'report-api-8810b': 'Failed to pull image "nginx:ghost": image not found.'
      },
      files: {}
    }),
    validator: (state) => {
      const deploy = state.deployments.find((item) => item.name === 'report-api');
      return Boolean(deploy && deploy.image === 'nginx:1.27' && deploy.ready === '2/2');
    },
    tipsExercised: []
  },
  {
    id: 'harbor-routing',
    zone: 'Ingress Harbor',
    title: 'Harbor Routing',
    story: 'A shipping tracker service is sending traffic into the void. Patch the selector so Harbor Control can see the tracker pods again.',
    objective: 'Fix the tracker service selector so it targets tracker-api pods.',
    duration: 280,
    hints: [
      'Compare the service selector with the pod labels.',
      'Use kubectl describe service tracker for the clue.',
      'Try: kubectl patch service tracker -p {"spec":{"selector":{"app":"tracker-api"}}}'
    ],
    solution: [
      'kubectl get pods',
      'kubectl describe service tracker',
      'kubectl patch service tracker -p {"spec":{"selector":{"app":"tracker-api"}}}'
    ],
    createState: () => ({
      namespace: 'harbor',
      pods: [
        { name: 'tracker-api-120aa', ready: '1/1', status: 'Running', restarts: 0, age: '14m', labels: { app: 'tracker-api' }, image: 'ghcr.io/example/tracker:3.1.0' },
        { name: 'tracker-api-120ab', ready: '1/1', status: 'Running', restarts: 0, age: '14m', labels: { app: 'tracker-api' }, image: 'ghcr.io/example/tracker:3.1.0' }
      ],
      deployments: [
        { name: 'tracker-api', ready: '2/2', upToDate: 2, available: 2, age: '14m', image: 'ghcr.io/example/tracker:3.1.0', replicas: 2, labels: { app: 'tracker-api' } }
      ],
      services: [
        { name: 'tracker', type: 'ClusterIP', clusterIP: '10.96.0.81', port: '8080/TCP', age: '14m', selector: { app: 'tracker' } }
      ],
      alerts: ['tracker service has no healthy endpoints.'],
      logs: {},
      files: {}
    }),
    validator: (state) => {
      const svc = state.services.find((item) => item.name === 'tracker');
      return Boolean(svc && svc.selector.app === 'tracker-api');
    },
    tipsExercised: []
  }
];

const rankThresholds = [
  { score: 0, label: 'Trainee Operator' },
  { score: 400, label: 'Pod Wrangler' },
  { score: 900, label: 'Service Surgeon' },
  { score: 1500, label: 'Incident Commander' }
];

const ui = {
  gridLayout: document.getElementById('gridLayout'),
  missionPanel: document.getElementById('missionPanel'),
  dashboardPanel: document.getElementById('dashboardPanel'),
  toggleMissionPanelButton: document.getElementById('toggleMissionPanelButton'),
  toggleDashboardPanelButton: document.getElementById('toggleDashboardPanelButton'),
  missionTitle: document.getElementById('missionTitle'),
  missionStory: document.getElementById('missionStory'),
  missionZone: document.getElementById('missionZone'),
  missionObjective: document.getElementById('missionObjective'),
  missionIndex: document.getElementById('missionIndex'),
  timerValue: document.getElementById('timerValue'),
  scoreValue: document.getElementById('scoreValue'),
  rankValue: document.getElementById('rankValue'),
  hintCount: document.getElementById('hintCount'),
  stabilityFill: document.getElementById('stabilityFill'),
  stabilityText: document.getElementById('stabilityText'),
  terminalOutput: document.getElementById('terminalOutput'),
  terminalForm: document.getElementById('terminalForm'),
  terminalInput: document.getElementById('terminalInput'),
  terminalGhost: document.getElementById('terminalGhost'),
  ghostToggleButton: document.getElementById('ghostToggleButton'),
  terminalHint: document.getElementById('terminalHint'),
  terminalDocLink: document.getElementById('terminalDocLink'),
  terminalSuggestions: document.getElementById('terminalSuggestions'),
  alertList: document.getElementById('alertList'),
  podSummary: document.getElementById('podSummary'),
  serviceSummary: document.getElementById('serviceSummary'),
  deploymentSummary: document.getElementById('deploymentSummary'),
  missionResult: document.getElementById('missionResult'),
  hintButton: document.getElementById('hintButton'),
  solutionButton: document.getElementById('solutionButton'),
  stepBackButton: document.getElementById('stepBackButton'),
  stepForwardButton: document.getElementById('stepForwardButton'),
  resetMissionButton: document.getElementById('resetMissionButton'),
  nextMissionButton: document.getElementById('nextMissionButton'),
  playbackStatus: document.getElementById('playbackStatus'),
  playbackFill: document.getElementById('playbackFill'),
  playbackStepLabel: document.getElementById('playbackStepLabel'),
  speedSelect: document.getElementById('speedSelect'),
  missionMap: document.getElementById('missionMap'),
  soundToggleButton: document.getElementById('soundToggleButton'),
  resetGameButton: document.getElementById('resetGameButton')
};

const game = {
  score: 0,
  missionIndex: 0,
  unlockedIndex: 0,
  currentState: null,
  remainingTime: 0,
  timerId: null,
  hintUses: 0,
  completed: [],
  missionComplete: false,
  solving: false,
  playbackPaused: false,
  pauseRequested: false,
  solutionStepIndex: 0,
  playbackSpeed: 1,
  soundEnabled: true,
  audioContext: null,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  ghostEnabled: true
};

function loadProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    game.score = parsed.score || 0;
    game.completed = Array.isArray(parsed.completed) ? parsed.completed : [];
    game.unlockedIndex = Math.min(parsed.unlockedIndex || 0, missions.length - 1);
    game.missionIndex = Math.min(parsed.missionIndex || 0, game.unlockedIndex);
    game.soundEnabled = parsed.soundEnabled !== false;
    game.ghostEnabled = parsed.ghostEnabled !== false;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    score: game.score,
    completed: game.completed,
    missionIndex: game.missionIndex,
    unlockedIndex: game.unlockedIndex,
    soundEnabled: game.soundEnabled,
    ghostEnabled: game.ghostEnabled
  }));
}

function getRankLabel() {
  return rankThresholds.reduce((label, item) => game.score >= item.score ? item.label : label, rankThresholds[0].label);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function logLine(text, type = 'normal') {
  const line = document.createElement('div');
  line.className = `terminal-line ${type}`;
  line.textContent = text;
  ui.terminalOutput.appendChild(line);
  ui.terminalOutput.scrollTop = ui.terminalOutput.scrollHeight;
}

function expandKubectlAlias(command) {
  return (command || '').replace(/^\s*k(\s+)/i, 'kubectl$1');
}

function getDocLinkForCommand(command) {
  const value = expandKubectlAlias(command).trim().toLowerCase();
  if (!value || value === 'help' || value === 'status' || value === 'mission' || value === 'hint') {
    return 'https://kubernetes.io/docs/reference/kubectl/';
  }
  if (value.startsWith('kubectl get ')) {
    return 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_get/';
  }
  if (value.startsWith('kubectl describe ')) {
    return 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_describe/';
  }
  if (value.startsWith('kubectl logs ')) {
    return 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_logs/';
  }
  if (value.startsWith('kubectl run ')) {
    return 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_run/';
  }
  if (value.startsWith('kubectl set image ')) {
    return 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_set/kubectl_set_image/';
  }
  if (value.startsWith('kubectl patch ')) {
    return 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_patch/';
  }
  if (value.startsWith('kubectl scale ')) {
    return 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_scale/';
  }
  return 'https://kubernetes.io/docs/reference/kubectl/';
}

function getCommandCandidates() {
  const mission = missions[game.missionIndex];
  const state = game.currentState;
  const base = [
    'help',
    'clear',
    'mission',
    'status',
    'hint',
    'r',
    'restart-mission',
    'reset-game',
    'restart-campaign',
    'kubectl get pods',
    'kubectl get deployments',
    'kubectl get services',
    'kubectl describe pod <name>',
    'kubectl describe deployment <name>',
    'kubectl describe service <name>',
    'kubectl logs <pod-name>',
    'kubectl run scout --image=nginx',
    'kubectl set image deployment/<name> <container>=nginx:1.27',
    'kubectl patch service <name> -p {"spec":{"selector":{"app":"value"}}}',
    'kubectl scale deployment <name> --replicas=3'
  ];

  const podCommands = (state?.pods || []).flatMap((pod) => [
    `kubectl describe pod ${pod.name}`,
    `kubectl logs ${pod.name}`
  ]);
  const deploymentCommands = (state?.deployments || []).flatMap((dep) => [
    `kubectl describe deployment ${dep.name}`,
    `kubectl scale deployment ${dep.name} --replicas=${dep.replicas}`,
    `kubectl scale deployment ${dep.name} --replicas=3`,
    `kubectl set image deployment/${dep.name} ${dep.name}=nginx:1.27`
  ]);
  const serviceCommands = (state?.services || []).flatMap((svc) => [
    `kubectl describe service ${svc.name}`,
    `kubectl patch service ${svc.name} -p {"spec":{"selector":{"app":"${svc.selector?.app || 'app'}"}}}`
  ]);

  return [...new Set([...base, ...(mission.solution || []), ...podCommands, ...deploymentCommands, ...serviceCommands])];
}

function longestCommonPrefixLength(a, b) {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i += 1;
  return i;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

function rankCandidates(raw, candidates) {
  const lowered = raw.toLowerCase();
  const missionSolutions = new Set((missions[game.missionIndex].solution || []).map((item) => item.toLowerCase()));
  return candidates
    .map((candidate) => {
      const lowerCandidate = candidate.toLowerCase();
      const prefix = longestCommonPrefixLength(lowered, lowerCandidate);
      const distance = levenshtein(lowered, lowerCandidate.slice(0, Math.max(lowered.length, 1)));
      const words = lowered.split(/\s+/).filter(Boolean);
      const candidateWords = lowerCandidate.split(/\s+/);
      const verbBoost = words.some((word) => candidateWords.includes(word)) ? 1 : 0;
      const missionBoost = missionSolutions.has(lowerCandidate) ? 1 : 0;
      return { candidate, lowerCandidate, prefix, distance, verbBoost, missionBoost };
    })
    .sort((a, b) => (b.prefix - a.prefix) || (b.verbBoost - a.verbBoost) || (b.missionBoost - a.missionBoost) || (a.distance - b.distance) || (a.candidate.length - b.candidate.length));
}

function setSuggestions(rankedItems) {
  ui.terminalSuggestions.innerHTML = '';
  rankedItems.slice(0, 3).forEach((item) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `suggestion-chip${item.missionBoost ? ' mission-priority' : ''}`;
    chip.textContent = item.candidate;
    chip.addEventListener('click', () => {
      playUiClick();
      ui.terminalInput.value = item.candidate;
      updateTerminalGuidance();
      ui.terminalInput.focus();
    });
    ui.terminalSuggestions.appendChild(chip);
  });
}

function renderGhostCommand(raw, suggestion) {
  if (!suggestion) return '';
  const suffix = suggestion.slice(raw.length);
  const parts = suggestion.split(' ');
  return `${raw}<span class="ghost-cmd">${suffix.replace(/^([^\s]+)/, (match) => match)}</span>`
    .replace(/(kubectl)([^<]*)/, '<span class="ghost-cmd">$1</span>$2')
    .replace(/\b(get|describe|logs|run|set|patch|scale)\b/, '<span class="ghost-verb">$1</span>')
    .replace(/(<[^>]+>|--[a-z-]+(?:=[^\s]+)?|\{[^}]+\}|[a-z0-9-]+\/[a-z0-9-]+=[^\s]+)/gi, '<span class="ghost-arg">$1</span>');
}

function updateTerminalGuidance() {
  const raw = ui.terminalInput.value;
  const canonicalRaw = expandKubectlAlias(raw);
  const value = canonicalRaw.trim().toLowerCase();
  ui.terminalInput.classList.remove('input-invalid', 'input-valid');
  ui.terminalHint.classList.remove('hint-invalid', 'hint-valid');
  ui.terminalGhost.textContent = '';
  ui.terminalSuggestions.innerHTML = '';
  ui.terminalDocLink.href = 'https://kubernetes.io/docs/reference/kubectl/';
  ui.terminalDocLink.textContent = 'Official Kubernetes docs for further reading';

  if (!value) {
    ui.terminalHint.textContent = 'Ready for command input.';
    return;
  }

  const candidates = getCommandCandidates();
  const kubectlVerbMatch = value.match(/^kubectl\s+([a-z-]+)$/);
  const preferredCandidates = kubectlVerbMatch
    ? candidates.filter((candidate) => candidate.toLowerCase().startsWith(`kubectl ${kubectlVerbMatch[1]}`))
    : candidates;
  const ranked = rankCandidates(canonicalRaw.trim(), preferredCandidates.length ? preferredCandidates : candidates);
  const exactCandidate = candidates.find((candidate) => candidate.toLowerCase() === value);
  const partialCandidate = ranked.find((item) => item.lowerCandidate.startsWith(value))?.candidate;
  const best = ranked[0];

  if (exactCandidate) {
    ui.terminalInput.classList.add('input-valid');
    ui.terminalHint.classList.add('hint-valid');
    ui.terminalHint.textContent = 'Command path recognized.';
    ui.terminalDocLink.href = getDocLinkForCommand(exactCandidate);
    ui.terminalDocLink.textContent = 'Official Kubernetes docs for this command';
    setSuggestions(ranked);
    return;
  }

  if (partialCandidate) {
    if (game.ghostEnabled) {
      ui.terminalGhost.innerHTML = renderGhostCommand(raw, partialCandidate);
      ui.terminalHint.textContent = `Still on track… Press Tab or → to accept: ${partialCandidate}`;
    } else {
      ui.terminalHint.textContent = `On track. Suggested completion: ${partialCandidate}`;
    }
    ui.terminalDocLink.href = getDocLinkForCommand(partialCandidate);
    ui.terminalDocLink.textContent = 'Official Kubernetes docs for this command';
    setSuggestions(ranked);
    return;
  }

  const mismatchAt = best ? longestCommonPrefixLength(value, best.lowerCandidate) : 0;
  const wrongChunk = raw.trim().slice(mismatchAt) || raw.trim().slice(-1);
  ui.terminalInput.classList.add('input-invalid');
  ui.terminalHint.classList.add('hint-invalid');
  ui.terminalHint.textContent = best
    ? `Off the rails after “${wrongChunk}”. Nearest valid command: ${best.candidate}`
    : 'Off the rails: this no longer matches a supported command path.';
  if (best) {
    ui.terminalDocLink.href = getDocLinkForCommand(best.candidate);
    ui.terminalDocLink.textContent = 'Official Kubernetes docs for nearest command';
  }
  setSuggestions(ranked);
}

function ensureAudio() {
  if (!game.soundEnabled) return null;
  if (!game.audioContext) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    game.audioContext = new AudioContextCtor();
  }
  if (game.audioContext.state === 'suspended') {
    game.audioContext.resume().catch(() => {});
  }
  return game.audioContext;
}

function playTone(freq = 440, duration = 0.08, type = 'sine', gainValue = 0.03) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = gainValue;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration);
}

function playUiClick() {
  playTone(660, 0.04, 'square', 0.02);
}

function playSuccessFanfar() {
  playTone(523, 0.08, 'triangle', 0.03);
  setTimeout(() => playTone(659, 0.08, 'triangle', 0.03), 70);
  setTimeout(() => playTone(784, 0.12, 'triangle', 0.03), 140);
}

function playErrorBuzz() {
  playTone(180, 0.08, 'sawtooth', 0.025);
}

function renderMissionMap() {
  ui.missionMap.innerHTML = '';
  missions.forEach((mission, index) => {
    const button = document.createElement('button');
    const unlocked = index <= game.unlockedIndex;
    const completed = game.completed.includes(mission.id);
    button.className = `mission-map-button secondary${index === game.missionIndex ? ' active' : ''}${completed ? ' completed' : ''}${!unlocked ? ' locked' : ''}`;
    button.disabled = !unlocked || game.solving;
    button.innerHTML = `<strong>${index + 1}. ${mission.title}</strong><br><span class="mission-chip">${completed ? 'Completed' : unlocked ? mission.zone : 'Locked'}</span>`;
    button.addEventListener('click', () => {
      playUiClick();
      startMission(index);
    });
    ui.missionMap.appendChild(button);
  });
}

function renderDashboard() {
  const state = game.currentState;
  ui.alertList.innerHTML = '';
  state.alerts.forEach((alert) => {
    const li = document.createElement('li');
    li.textContent = alert;
    ui.alertList.appendChild(li);
  });

  ui.podSummary.textContent = state.pods.length
    ? state.pods.map((pod) => `${pod.name}  ${pod.ready}  ${pod.status}`).join('\n')
    : 'No pods present.';

  ui.serviceSummary.textContent = state.services.length
    ? state.services.map((svc) => `${svc.name}  ${svc.type}  selector=${JSON.stringify(svc.selector)}`).join('\n')
    : 'No services present.';

  ui.deploymentSummary.textContent = state.deployments.length
    ? state.deployments.map((dep) => `${dep.name}  ready=${dep.ready}  image=${dep.image}`).join('\n')
    : 'No deployments present.';
}

function calculateStability() {
  const mission = missions[game.missionIndex];
  const timeRatio = game.remainingTime / mission.duration;
  const alertPenalty = Math.min(game.currentState.alerts.length * 12, 40);
  const hintPenalty = game.hintUses * 6;
  let stability = Math.round((timeRatio * 70) + 30 - alertPenalty - hintPenalty);
  if (game.missionComplete) stability = 100;
  return Math.max(5, Math.min(100, stability));
}

function updatePanelLayout() {
  ui.gridLayout.classList.toggle('left-collapsed', game.leftPanelCollapsed);
  ui.gridLayout.classList.toggle('right-collapsed', game.rightPanelCollapsed);
  ui.missionPanel.classList.toggle('panel-collapsed', game.leftPanelCollapsed);
  ui.dashboardPanel.classList.toggle('panel-collapsed', game.rightPanelCollapsed);
  ui.toggleMissionPanelButton.textContent = game.leftPanelCollapsed ? '⟩' : '⟨';
  ui.toggleDashboardPanelButton.textContent = game.rightPanelCollapsed ? '⟨' : '⟩';
  ui.toggleMissionPanelButton.setAttribute('aria-expanded', String(!game.leftPanelCollapsed));
  ui.toggleDashboardPanelButton.setAttribute('aria-expanded', String(!game.rightPanelCollapsed));
}

function renderStatus() {
  const mission = missions[game.missionIndex];
  ui.missionTitle.textContent = mission.title;
  ui.missionStory.textContent = mission.story;
  ui.missionZone.textContent = mission.zone;
  ui.missionObjective.textContent = mission.objective;
  ui.missionIndex.textContent = `${game.missionIndex + 1} / ${missions.length}`;
  ui.timerValue.textContent = formatTime(game.remainingTime);
  ui.scoreValue.textContent = game.score;
  ui.rankValue.textContent = getRankLabel();
  ui.hintCount.textContent = game.hintUses;
  ui.soundToggleButton.textContent = game.soundEnabled ? '🔊 Sound On' : '🔈 Sound Off';
  ui.ghostToggleButton.textContent = game.ghostEnabled ? '👻 Ghost On' : '👻 Ghost Off';
  ui.ghostToggleButton.setAttribute('aria-pressed', String(game.ghostEnabled));

  const stability = calculateStability();
  ui.stabilityFill.style.width = `${stability}%`;
  ui.stabilityText.textContent = stability >= 80
    ? 'Cluster steady. Operator performance nominal.'
    : stability >= 50
      ? 'Warning: user confidence and uptime are wobbling.'
      : 'Critical: incident pressure is escalating fast.';

  const totalSteps = mission.solution?.length || 0;
  const progress = totalSteps ? (game.solutionStepIndex / totalSteps) * 100 : 0;
  ui.solutionButton.textContent = game.solving ? '⏸ Pause' : '▶ Play';
  ui.playbackStatus.textContent = game.missionComplete
    ? 'Complete'
    : game.solving
      ? (game.pauseRequested ? 'Pausing after current command…' : 'Playing')
      : (game.solutionStepIndex > 0 ? 'Paused' : 'Idle');
  ui.playbackFill.style.width = `${progress}%`;
  ui.playbackStepLabel.textContent = `Step ${game.solutionStepIndex} / ${totalSteps}`;
  ui.stepBackButton.disabled = game.solving || game.solutionStepIndex <= 0;
  ui.stepForwardButton.disabled = game.solving || game.solutionStepIndex >= totalSteps || game.missionComplete;
  ui.hintButton.disabled = game.solving;
  ui.resetMissionButton.disabled = game.solving;
  ui.nextMissionButton.disabled = game.solving || !game.missionComplete || game.missionIndex >= missions.length - 1;
  ui.terminalInput.disabled = game.solving;
  updatePanelLayout();
  renderMissionMap();
  renderDashboard();
}

function cloneState(data) {
  return JSON.parse(JSON.stringify(data));
}

function startMission(index = game.missionIndex) {
  clearInterval(game.timerId);
  game.missionIndex = index;
  game.hintUses = 0;
  game.missionComplete = false;
  game.solving = false;
  game.playbackPaused = false;
  game.pauseRequested = false;
  game.solutionStepIndex = 0;
  game.playbackSpeed = Number(ui.speedSelect?.value || 1);
  const mission = missions[index];
  game.currentState = cloneState(mission.createState());
  game.remainingTime = mission.duration;
  ui.missionResult.classList.add('hidden');
  ui.missionResult.textContent = '';
  ui.terminalOutput.innerHTML = '';
  ui.terminalInput.value = '';
  updateTerminalGuidance();

  logLine(`=== ${mission.zone}: ${mission.title} ===`, 'success');
  logLine(mission.story);
  logLine(`Objective: ${mission.objective}`, 'warning');
  logLine(`Namespace: ${game.currentState.namespace}`);
  logLine('Type help to see available commands.');

  game.timerId = setInterval(() => {
    game.remainingTime -= 1;
    if (game.remainingTime <= 0) {
      game.remainingTime = 0;
      clearInterval(game.timerId);
      if (!game.missionComplete) {
        logLine('Mission timer expired. Stability dropped below safe limits.', 'error');
        ui.missionResult.classList.remove('hidden');
        ui.missionResult.textContent = 'Mission failed. Reset the mission and try again.';
      }
    }
    renderStatus();
  }, 1000);

  renderStatus();
}

function completeMission() {
  if (game.missionComplete) return;
  clearInterval(game.timerId);
  game.missionComplete = true;
  const base = 300;
  const timeBonus = Math.round((game.remainingTime / missions[game.missionIndex].duration) * 180);
  const hintPenalty = game.hintUses * 35;
  const earned = Math.max(120, base + timeBonus - hintPenalty);

  const missionId = missions[game.missionIndex].id;
  const firstClear = !game.completed.includes(missionId);
  if (firstClear) {
    game.score += earned;
    game.completed.push(missionId);
  }
  if (game.missionIndex < missions.length - 1) {
    game.unlockedIndex = Math.max(game.unlockedIndex, game.missionIndex + 1);
  }
  saveProgress();

  game.currentState.alerts = ['All systems green. Incident resolved.'];
  ui.missionResult.classList.remove('hidden');
  ui.missionResult.innerHTML = firstClear
    ? `Mission clear. +${earned} points earned.<br>Time remaining: ${formatTime(game.remainingTime)}<br>Hints used: ${game.hintUses}`
    : `Mission clear. Replay complete.<br>Time remaining: ${formatTime(game.remainingTime)}<br>Hints used: ${game.hintUses}`;
  logLine(firstClear ? 'Mission clear. District stability restored.' : 'Mission clear. Replay complete.', 'success');
  playSuccessFanfar();
  recordMissionTips(missionId, true);
  renderStatus();
}

function maybeCompleteMission() {
  if (missions[game.missionIndex].validator(game.currentState)) {
    completeMission();
  } else {
    renderStatus();
  }
}

function printHelp() {
  logLine([
    'Available commands:',
    '  help                              Show this help',
    '  clear                             Clear terminal output',
    '  mission                           Reprint current objective',
    '  hint                              Spend a hint charge',
    '  status                            Show mission status',
    '  kubectl get pods',
    '  kubectl get deployments',
    '  kubectl get services',
    '  kubectl describe pod <name>',
    '  kubectl describe deployment <name>',
    '  kubectl describe service <name>',
    '  kubectl logs <pod-name>',
    '  kubectl run scout --image=nginx',
    '  kubectl set image deployment/<name> <container>=<image>',
    '  kubectl patch service <name> -p {"spec":{"selector":{"app":"value"}}}',
    '  kubectl scale deployment <name> --replicas=<n>'
  ].join('\n'));
}

function printKubectlTable(kind) {
  const state = game.currentState;
  if (kind === 'pods') {
    if (!state.pods.length) return logLine('No resources found.');
    const lines = ['NAME\tREADY\tSTATUS\tRESTARTS\tAGE'];
    state.pods.forEach((pod) => lines.push(`${pod.name}\t${pod.ready}\t${pod.status}\t${pod.restarts}\t${pod.age}`));
    return logLine(lines.join('\n'));
  }
  if (kind === 'deployments') {
    if (!state.deployments.length) return logLine('No resources found.');
    const lines = ['NAME\tREADY\tUP-TO-DATE\tAVAILABLE\tAGE'];
    state.deployments.forEach((dep) => lines.push(`${dep.name}\t${dep.ready}\t${dep.upToDate}\t${dep.available}\t${dep.age}`));
    return logLine(lines.join('\n'));
  }
  if (kind === 'services') {
    if (!state.services.length) return logLine('No resources found.');
    const lines = ['NAME\tTYPE\tCLUSTER-IP\tPORT(S)\tAGE'];
    state.services.forEach((svc) => lines.push(`${svc.name}\t${svc.type}\t${svc.clusterIP}\t${svc.port}\t${svc.age}`));
    return logLine(lines.join('\n'));
  }
}

function describeResource(kind, name) {
  const state = game.currentState;
  if (kind === 'pod') {
    const pod = state.pods.find((item) => item.name === name);
    if (!pod) return logLine(`Error from server (NotFound): pods "${name}" not found`, 'error');
    return logLine([
      `Name: ${pod.name}`,
      `Namespace: ${state.namespace}`,
      `Status: ${pod.status}`,
      `Ready: ${pod.ready}`,
      `Image: ${pod.image}`,
      `Labels: ${Object.entries(pod.labels || {}).map(([k, v]) => `${k}=${v}`).join(', ') || '<none>'}`
    ].join('\n'));
  }

  if (kind === 'deployment') {
    const dep = state.deployments.find((item) => item.name === name);
    if (!dep) return logLine(`Error from server (NotFound): deployments.apps "${name}" not found`, 'error');
    return logLine([
      `Name: ${dep.name}`,
      `Namespace: ${state.namespace}`,
      `Replicas: ${dep.replicas} desired | ${dep.available} available`,
      `Ready: ${dep.ready}`,
      `Image: ${dep.image}`,
      `Selector: ${Object.entries(dep.labels || {}).map(([k, v]) => `${k}=${v}`).join(', ')}`
    ].join('\n'));
  }

  if (kind === 'service') {
    const svc = state.services.find((item) => item.name === name);
    if (!svc) return logLine(`Error from server (NotFound): services "${name}" not found`, 'error');
    const endpointCount = state.pods.filter((pod) => Object.entries(svc.selector).every(([k, v]) => pod.labels?.[k] === v)).length;
    return logLine([
      `Name: ${svc.name}`,
      `Namespace: ${state.namespace}`,
      `Type: ${svc.type}`,
      `Selector: ${Object.entries(svc.selector || {}).map(([k, v]) => `${k}=${v}`).join(', ')}`,
      `Endpoints: ${endpointCount ? `${endpointCount} healthy pod(s)` : '<none>'}`
    ].join('\n'));
  }
}

function setPodFromDeployment(dep) {
  const state = game.currentState;
  state.pods = state.pods.filter((pod) => pod.labels?.app !== dep.labels.app);
  for (let i = 0; i < dep.replicas; i += 1) {
    state.pods.push({
      name: `${dep.name}-${String(10000 + i).slice(1)}`,
      ready: dep.image.includes('notreal') ? '0/1' : '1/1',
      status: dep.image.includes('notreal') ? 'ImagePullBackOff' : 'Running',
      restarts: dep.image.includes('notreal') ? 4 : 0,
      age: '1m',
      labels: { ...dep.labels },
      image: dep.image
    });
  }
}

function updateAlerts() {
  const state = game.currentState;
  const mission = missions[game.missionIndex];
  if (mission.id === 'pod-panic') {
    state.alerts = mission.validator(state) ? ['All systems green. Incident resolved.'] : ['No scout pod is protecting Pod District.'];
  }
  if (mission.id === 'wrong-image') {
    const broken = state.deployments[0].image !== 'nginx:1.27';
    state.alerts = broken ? ['bakery-web deployment is failing with ImagePullBackOff.'] : ['Bakery kiosks are serving normally.'];
  }
  if (mission.id === 'lost-signal') {
    const mismatch = state.services[0].selector.app !== 'checkout-api';
    state.alerts = mismatch ? ['checkout service has zero endpoints due to a selector mismatch.'] : ['Checkout traffic flow restored.'];
  }
  if (mission.id === 'traffic-surge') {
    const underScaled = state.deployments[0].replicas < 3;
    state.alerts = underScaled ? ['edge-gateway capacity is too low for current load.'] : ['Gateway fleet scaled and stable.'];
  }
  if (mission.id === 'night-rollout') {
    const broken = state.deployments[0].image !== 'nginx:1.27';
    state.alerts = broken ? ['report-api rollout is failing with ImagePullBackOff.'] : ['report-api rollout stabilized.'];
  }
  if (mission.id === 'harbor-routing') {
    const mismatch = state.services[0].selector.app !== 'tracker-api';
    state.alerts = mismatch ? ['tracker service has no healthy endpoints.'] : ['Harbor routing restored.'];
  }
}

function handleKubectl(command) {
  const state = game.currentState;

  if (/^kubectl get pods$/i.test(command)) return printKubectlTable('pods');
  if (/^kubectl get deployments$/i.test(command)) return printKubectlTable('deployments');
  if (/^kubectl get services$/i.test(command)) return printKubectlTable('services');

  let match = command.match(/^kubectl describe (pod|deployment|service) ([a-z0-9-]+)$/i);
  if (match) return describeResource(match[1].toLowerCase(), match[2]);

  match = command.match(/^kubectl logs ([a-z0-9-]+)$/i);
  if (match) {
    const logs = state.logs[match[1]];
    return logLine(logs || `No logs found for ${match[1]}.`, logs ? 'warning' : 'error');
  }

  match = command.match(/^kubectl run scout --image=(nginx)$/i);
  if (match) {
    const existing = state.pods.find((pod) => pod.name === 'scout');
    if (existing) return logLine('pod/scout already exists', 'warning');
    state.pods.push({
      name: 'scout', ready: '1/1', status: 'Running', restarts: 0, age: '5s', labels: { app: 'scout' }, image: 'nginx'
    });
    logLine('pod/scout created', 'success');
    updateAlerts();
    return maybeCompleteMission();
  }

  match = command.match(/^kubectl set image deployment\/([a-z0-9-]+) [a-z0-9-]+=([a-z0-9.:/-]+)$/i);
  if (match) {
    const dep = state.deployments.find((item) => item.name === match[1]);
    if (!dep) {
      playErrorBuzz();
      return logLine(`Error from server (NotFound): deployments.apps "${match[1]}" not found`, 'error');
    }
    dep.image = match[2];
    if (dep.image === 'nginx:1.27') {
      dep.ready = `${dep.replicas}/${dep.replicas}`;
      dep.available = dep.replicas;
      dep.upToDate = dep.replicas;
    }
    setPodFromDeployment(dep);
    Object.keys(state.logs).forEach((podName) => {
      state.logs[podName] = dep.image === 'nginx:1.27'
        ? 'nginx boot complete. Listening on :80'
        : `Failed to pull image "${dep.image}"`;
    });
    logLine(`deployment.apps/${dep.name} image updated`, 'success');
    playUiClick();
    updateAlerts();
    return maybeCompleteMission();
  }

  match = command.match(/^kubectl patch service ([a-z0-9-]+) -p (.+)$/i);
  if (match) {
    const svc = state.services.find((item) => item.name === match[1]);
    if (!svc) {
      playErrorBuzz();
      return logLine(`Error from server (NotFound): services "${match[1]}" not found`, 'error');
    }
    try {
      const patch = JSON.parse(match[2]);
      const selector = patch?.spec?.selector;
      if (!selector) throw new Error('missing selector');
      svc.selector = selector;
      logLine(`service/${svc.name} patched`, 'success');
      playUiClick();
      updateAlerts();
      return maybeCompleteMission();
    } catch {
      playErrorBuzz();
      return logLine('Patch parse failed. Use valid JSON such as {"spec":{"selector":{"app":"checkout-api"}}}', 'error');
    }
  }

  match = command.match(/^kubectl scale deployment ([a-z0-9-]+) --replicas=(\d+)$/i);
  if (match) {
    const dep = state.deployments.find((item) => item.name === match[1]);
    if (!dep) {
      playErrorBuzz();
      return logLine(`Error from server (NotFound): deployments.apps "${match[1]}" not found`, 'error');
    }
    dep.replicas = Number(match[2]);
    dep.ready = `${dep.replicas}/${dep.replicas}`;
    dep.upToDate = dep.replicas;
    dep.available = dep.replicas;
    setPodFromDeployment(dep);
    logLine(`deployment.apps/${dep.name} scaled`, 'success');
    playUiClick();
    updateAlerts();
    return maybeCompleteMission();
  }

  playErrorBuzz();
  return logLine('kubectl command not recognized in this simulator yet.', 'error');
}

function executeCommand(rawInput, options = {}) {
  const command = expandKubectlAlias(rawInput).trim();
  if (!command) return;
  if (options.echo !== false) {
    logLine(`operator@ckarcade:~$ ${command}`, 'command');
  }

  if (command === 'help') return printHelp();
  if (command === 'clear') {
    ui.terminalOutput.innerHTML = '';
    return;
  }
  if (command === 'mission') return logLine(`Objective: ${missions[game.missionIndex].objective}`, 'warning');
  if (command === 'status') {
    return logLine([
      `Mission: ${missions[game.missionIndex].title}`,
      `Zone: ${missions[game.missionIndex].zone}`,
      `Time remaining: ${formatTime(game.remainingTime)}`,
      `Score: ${game.score}`,
      `Namespace: ${game.currentState.namespace}`
    ].join('\n'));
  }
  if (command === 'hint') return consumeHint();
  if (command === 'r' || command === 'restart-mission') return startMission(game.missionIndex);
  if (command === 'reset-game' || command === 'restart-campaign') return resetGame();
  if (command.startsWith('kubectl ')) return handleKubectl(command);
  return logLine('Unknown command. Type help for command options.', 'error');
}

function consumeHint() {
  const mission = missions[game.missionIndex];
  const hint = mission.hints[game.hintUses];
  if (!hint) return logLine('No more hints available for this mission.', 'warning');
  playUiClick();
  game.hintUses += 1;
  logLine(`Hint ${game.hintUses}: ${hint}`, 'warning');
  renderStatus();
}

function resetGame() {
  const confirmed = window.confirm('Restart campaign from mission 1 and wipe score, progress, and unlocked missions?');
  if (!confirmed) return;
  clearInterval(game.timerId);
  localStorage.removeItem(STORAGE_KEY);
  game.score = 0;
  game.completed = [];
  game.unlockedIndex = 0;
  game.missionIndex = 0;
  game.hintUses = 0;
  game.solutionStepIndex = 0;
  game.missionComplete = false;
  playErrorBuzz();
  startMission(0);
  logLine('Campaign restarted. Welcome back, Trainee Operator.', 'warning');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scaledDelay(ms) {
  return Math.max(20, Math.round(ms / game.playbackSpeed));
}

async function animateCommand(step) {
  const prompt = document.createElement('div');
  prompt.className = 'terminal-line typing';
  ui.terminalOutput.appendChild(prompt);

  const prefix = 'operator@ckarcade:~$ ';
  for (let i = 0; i <= step.length; i += 1) {
    const typed = step.slice(0, i);
    prompt.innerHTML = `${prefix}${typed}<span class="terminal-cursor">█</span>`;
    ui.terminalOutput.scrollTop = ui.terminalOutput.scrollHeight;
    await wait(scaledDelay(22));
  }

  prompt.className = 'terminal-line command';
  prompt.textContent = `${prefix}${step}`;
  await wait(scaledDelay(180));
  executeCommand(step, { echo: false });
}

async function playSolution() {
  const mission = missions[game.missionIndex];
  const steps = mission.solution || [];
  if (!steps.length) {
    return logLine('No solution is configured for this mission yet.', 'warning');
  }
  if (game.missionComplete || game.solutionStepIndex >= steps.length) {
    return;
  }
  if (game.solving) {
    game.pauseRequested = true;
    renderStatus();
    return;
  }

  game.solving = true;
  game.playbackPaused = false;
  game.pauseRequested = false;
  renderStatus();
  logLine('Playing solution...', 'success');

  while (game.solutionStepIndex < steps.length && !game.missionComplete) {
    const step = steps[game.solutionStepIndex];
    await animateCommand(step);
    game.solutionStepIndex += 1;
    renderStatus();
    if (game.pauseRequested) {
      game.playbackPaused = true;
      game.pauseRequested = false;
      game.solving = false;
      logLine('Playback paused.', 'warning');
      renderStatus();
      return;
    }
    await wait(scaledDelay(300));
  }

  game.solving = false;
  game.playbackPaused = false;
  renderStatus();
}

async function stepForwardSolution() {
  const mission = missions[game.missionIndex];
  const steps = mission.solution || [];
  if (!steps.length || game.solving || game.missionComplete || game.solutionStepIndex >= steps.length) {
    return;
  }
  const step = steps[game.solutionStepIndex];
  game.solving = true;
  game.pauseRequested = false;
  renderStatus();
  await animateCommand(step);
  game.solutionStepIndex += 1;
  game.solving = false;
  renderStatus();
}

function stepBackSolution() {
  const mission = missions[game.missionIndex];
  const steps = mission.solution || [];
  if (!steps.length || game.solving || game.solutionStepIndex <= 0) {
    return;
  }
  const targetStep = game.solutionStepIndex - 1;
  startMission(game.missionIndex);
  for (let i = 0; i < targetStep; i += 1) {
    executeCommand(steps[i]);
  }
  game.solutionStepIndex = targetStep;
  renderStatus();
  logLine(`Rewound to step ${targetStep} of ${steps.length}.`, 'warning');
}

ui.terminalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  executeCommand(ui.terminalInput.value);
  ui.terminalInput.value = '';
  updateTerminalGuidance();
});

ui.terminalInput.addEventListener('input', updateTerminalGuidance);

ui.hintButton.addEventListener('click', consumeHint);
ui.solutionButton.addEventListener('click', () => {
  playUiClick();
  playSolution();
});
ui.stepBackButton.addEventListener('click', () => {
  playUiClick();
  stepBackSolution();
});
ui.stepForwardButton.addEventListener('click', () => {
  playUiClick();
  stepForwardSolution();
});
ui.speedSelect.addEventListener('change', () => {
  playUiClick();
  game.playbackSpeed = Number(ui.speedSelect.value || 1);
  renderStatus();
});
ui.resetMissionButton.addEventListener('click', () => {
  playUiClick();
  startMission(game.missionIndex);
});
ui.nextMissionButton.addEventListener('click', () => {
  if (game.missionComplete && game.missionIndex < game.unlockedIndex) {
    playUiClick();
    startMission(game.missionIndex + 1);
  }
});
ui.soundToggleButton.addEventListener('click', () => {
  game.soundEnabled = !game.soundEnabled;
  if (game.soundEnabled) {
    playUiClick();
  }
  saveProgress();
  renderStatus();
});
ui.ghostToggleButton.addEventListener('click', () => {
  game.ghostEnabled = !game.ghostEnabled;
  playUiClick();
  saveProgress();
  updateTerminalGuidance();
  renderStatus();
});
ui.resetGameButton.addEventListener('click', resetGame);
ui.toggleMissionPanelButton.addEventListener('click', () => {
  game.leftPanelCollapsed = !game.leftPanelCollapsed;
  renderStatus();
});
ui.toggleDashboardPanelButton.addEventListener('click', () => {
  game.rightPanelCollapsed = !game.rightPanelCollapsed;
  renderStatus();
});

document.addEventListener('keydown', (event) => {
  const target = event.target;
  const isFormField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
  const isTerminalInput = target === ui.terminalInput;
  const terminalHasTypedText = isTerminalInput && ui.terminalInput.value.trim().length > 0;
  if ((event.code === 'Tab' || event.code === 'ArrowRight') && isTerminalInput) {
    const raw = ui.terminalInput.value;
    const partialCandidate = rankCandidates(raw.trim(), getCommandCandidates()).find((item) => item.lowerCandidate.startsWith(raw.trim().toLowerCase()))?.candidate;
    if (partialCandidate && raw.trim()) {
      event.preventDefault();
      ui.terminalInput.value = partialCandidate;
      updateTerminalGuidance();
    }
    return;
  }
  if (isFormField && !isTerminalInput) return;
  if (isTerminalInput) {
    if (terminalHasTypedText && event.code === 'Enter' && ui.terminalInput.classList.contains('input-invalid')) {
      const topSuggestion = ui.terminalSuggestions.querySelector('.suggestion-chip');
      if (topSuggestion) {
        event.preventDefault();
        ui.terminalInput.value = topSuggestion.textContent;
        updateTerminalGuidance();
      }
    }
    return;
  }

  if (event.code === 'Space') {
    event.preventDefault();
    playSolution();
  } else if (event.key === '[') {
    event.preventDefault();
    stepBackSolution();
  } else if (event.key === ']') {
    event.preventDefault();
    stepForwardSolution();
  } else if (event.code === 'KeyH') {
    event.preventDefault();
    consumeHint();
  } else if (event.code === 'KeyR') {
    event.preventDefault();
    playUiClick();
    startMission(game.missionIndex);
  } else if (event.code === 'KeyM') {
    event.preventDefault();
    game.soundEnabled = !game.soundEnabled;
    saveProgress();
    renderStatus();
    if (game.soundEnabled) playUiClick();
  }
});

loadProgress();
startMission(game.missionIndex);
ui.terminalInput.focus();

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
  renderFocusBanner();
}

async function recordMissionTips(missionId, correct) {
  if (!tipsBundle) return;
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
  if (!card) return;
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
  if (!banner) return;
  banner.textContent = `Today's focus: ${weakest}`;
  banner.classList.remove('hidden');
}

const exportLeitnerButton = document.getElementById('export-leitner');
if (exportLeitnerButton) {
  exportLeitnerButton.addEventListener('click', async () => {
    const { exportJson } = await import('./leitner.js');
    if (!leitnerState) {
      alert('Tips not initialised yet.');
      return;
    }
    await navigator.clipboard.writeText(exportJson(leitnerState));
    alert('Copied Leitner state to clipboard.');
  });
}

const importLeitnerButton = document.getElementById('import-leitner');
if (importLeitnerButton) {
  importLeitnerButton.addEventListener('click', async () => {
    const { importJson, saveState } = await import('./leitner.js');
    const json = prompt('Paste Leitner state JSON:');
    if (!json) return;
    try {
      leitnerState = importJson(json);
      saveState(leitnerState);
      if (tipsBundle) renderFocusBanner();
      alert('Imported.');
    } catch (e) {
      alert('Import failed: ' + e.message);
    }
  });
}

initCkArcadeTips().catch(err => console.error('tips init failed', err));
