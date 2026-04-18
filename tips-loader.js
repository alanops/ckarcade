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
