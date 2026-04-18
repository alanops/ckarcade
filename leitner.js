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
