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
    }
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
    }
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
    }
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
    }
  }
];

const rankThresholds = [
  { score: 0, label: 'Trainee Operator' },
  { score: 400, label: 'Pod Wrangler' },
  { score: 900, label: 'Service Surgeon' },
  { score: 1500, label: 'Incident Commander' }
];

const ui = {
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
  alertList: document.getElementById('alertList'),
  podSummary: document.getElementById('podSummary'),
  serviceSummary: document.getElementById('serviceSummary'),
  deploymentSummary: document.getElementById('deploymentSummary'),
  missionResult: document.getElementById('missionResult'),
  hintButton: document.getElementById('hintButton'),
  solutionButton: document.getElementById('solutionButton'),
  resetMissionButton: document.getElementById('resetMissionButton'),
  nextMissionButton: document.getElementById('nextMissionButton')
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
  missionComplete: false
};

function loadProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    game.score = parsed.score || 0;
    game.completed = Array.isArray(parsed.completed) ? parsed.completed : [];
    game.unlockedIndex = Math.min(parsed.unlockedIndex || 0, missions.length - 1);
    game.missionIndex = Math.min(parsed.missionIndex || 0, game.unlockedIndex);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    score: game.score,
    completed: game.completed,
    missionIndex: game.missionIndex,
    unlockedIndex: game.unlockedIndex
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

  const stability = calculateStability();
  ui.stabilityFill.style.width = `${stability}%`;
  ui.stabilityText.textContent = stability >= 80
    ? 'Cluster steady. Operator performance nominal.'
    : stability >= 50
      ? 'Warning: user confidence and uptime are wobbling.'
      : 'Critical: incident pressure is escalating fast.';

  ui.nextMissionButton.disabled = !game.missionComplete || game.missionIndex >= missions.length - 1;
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
  const mission = missions[index];
  game.currentState = cloneState(mission.createState());
  game.remainingTime = mission.duration;
  ui.missionResult.classList.add('hidden');
  ui.missionResult.textContent = '';
  ui.terminalOutput.innerHTML = '';

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
  game.score += earned;

  const missionId = missions[game.missionIndex].id;
  if (!game.completed.includes(missionId)) {
    game.completed.push(missionId);
  }
  if (game.missionIndex < missions.length - 1) {
    game.unlockedIndex = Math.max(game.unlockedIndex, game.missionIndex + 1);
  }
  saveProgress();

  game.currentState.alerts = ['All systems green. Incident resolved.'];
  ui.missionResult.classList.remove('hidden');
  ui.missionResult.innerHTML = `Mission clear. +${earned} points earned.<br>Time remaining: ${formatTime(game.remainingTime)}<br>Hints used: ${game.hintUses}`;
  logLine('Mission clear. District stability restored.', 'success');
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
    if (!dep) return logLine(`Error from server (NotFound): deployments.apps "${match[1]}" not found`, 'error');
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
    updateAlerts();
    return maybeCompleteMission();
  }

  match = command.match(/^kubectl patch service ([a-z0-9-]+) -p (.+)$/i);
  if (match) {
    const svc = state.services.find((item) => item.name === match[1]);
    if (!svc) return logLine(`Error from server (NotFound): services "${match[1]}" not found`, 'error');
    try {
      const patch = JSON.parse(match[2]);
      const selector = patch?.spec?.selector;
      if (!selector) throw new Error('missing selector');
      svc.selector = selector;
      logLine(`service/${svc.name} patched`, 'success');
      updateAlerts();
      return maybeCompleteMission();
    } catch {
      return logLine('Patch parse failed. Use valid JSON such as {"spec":{"selector":{"app":"checkout-api"}}}', 'error');
    }
  }

  match = command.match(/^kubectl scale deployment ([a-z0-9-]+) --replicas=(\d+)$/i);
  if (match) {
    const dep = state.deployments.find((item) => item.name === match[1]);
    if (!dep) return logLine(`Error from server (NotFound): deployments.apps "${match[1]}" not found`, 'error');
    dep.replicas = Number(match[2]);
    dep.ready = `${dep.replicas}/${dep.replicas}`;
    dep.upToDate = dep.replicas;
    dep.available = dep.replicas;
    setPodFromDeployment(dep);
    logLine(`deployment.apps/${dep.name} scaled`, 'success');
    updateAlerts();
    return maybeCompleteMission();
  }

  return logLine('kubectl command not recognized in this simulator yet.', 'error');
}

function executeCommand(rawInput) {
  const command = rawInput.trim();
  if (!command) return;
  logLine(`operator@ckarcade:~$ ${command}`, 'command');

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
  if (command.startsWith('kubectl ')) return handleKubectl(command);
  return logLine('Unknown command. Type help for command options.', 'error');
}

function consumeHint() {
  const mission = missions[game.missionIndex];
  const hint = mission.hints[game.hintUses];
  if (!hint) return logLine('No more hints available for this mission.', 'warning');
  game.hintUses += 1;
  logLine(`Hint ${game.hintUses}: ${hint}`, 'warning');
  renderStatus();
}

function solveMission() {
  const mission = missions[game.missionIndex];
  const steps = mission.solution || [];
  if (!steps.length) {
    return logLine('No solution is configured for this mission yet.', 'warning');
  }
  logLine('Auto-solving mission...', 'success');
  steps.forEach((step) => executeCommand(step));
}

ui.terminalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  executeCommand(ui.terminalInput.value);
  ui.terminalInput.value = '';
});

ui.hintButton.addEventListener('click', consumeHint);
ui.solutionButton.addEventListener('click', solveMission);
ui.resetMissionButton.addEventListener('click', () => startMission(game.missionIndex));
ui.nextMissionButton.addEventListener('click', () => {
  if (game.missionComplete && game.missionIndex < game.unlockedIndex) {
    startMission(game.missionIndex + 1);
  }
});

loadProgress();
startMission(game.missionIndex);
ui.terminalInput.focus();
