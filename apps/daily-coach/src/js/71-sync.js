/* ============================================================
   SYNC · your data on every device (4 Nov 2026, user: "All four";
   "Yes, store it privately").
   - On the live claude.ai link the app also keeps its data in the
     artifact's own database, owner-only (declared rules: read and write
     "owner"), so the phone and the laptop share one set of data. The
     browser copy stays: the app opens instantly and works offline.
   - State is stored in parts (collection "s"): one document per top-level
     key; big keys are split (days by month, long arrays in chunks) to stay
     under the 256 KiB document limit. Each device has its own note in
     collection "m" ("m/<device>": time of its last save), so two devices
     saving at the same moment can never hide each other's save.
   - Three-way merge per part against the last synced hash, so a device
     that only ran its automatic jobs never overwrites real changes made
     on another device. Where both sides changed, objects are merged
     (the newer side's values win) and lists with ids are joined.
   - "cloud/digest" is a short summary for the morning agent (no raw data).
   - The offline copy (a file on disk) has no database and works as before.
   ============================================================ */
const SY = { db: null, status: 'off', last: {}, timer: 0, busy: false, again: false, unsub: null, unsubB: null, at: 0, err: '', pullT: 0 };
const SY_LOCAL = ['aiCache', 'agThemeV2', '_lastEdit'];           // stay on this device only
SY.dev = (() => { try { let d = localStorage.getItem('dc.dev'); if (!d){ d = 'd' + Math.random().toString(36).slice(2, 10); localStorage.setItem('dc.dev', d); } return d; } catch(e){ return 'd-mem'; } })();
const syHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ':' + s.length; };
const syMeta = () => { if (!state._sy || typeof state._sy !== 'object') state._sy = { ts: 0, h: {} }; if (!state._sy.h) state._sy.h = {}; if (!state._sy.seen) state._sy.seen = {}; return state._sy; };
/* other devices that saved since we last pulled: [{ dev, ts }] */
const syFresh = docs => docs.filter(d => d.id !== SY.dev && d.exists && (d.data().ts || 0) > (syMeta().seen[d.id] || 0)).map(d => ({ dev: d.id, ts: d.data().ts }));
const syNewest = list => list.reduce((a, x) => Math.max(a, x.ts), 0);

/* split state into documents: id -> body */
function syParts(src){
  const out = {};
  Object.keys(src).forEach(k => {
    if (k === '_sy' || SY_LOCAL.includes(k)) return;
    const v = src[k], js = JSON.stringify(v === undefined ? null : v);
    if (js.length < 180000){ out['k.' + k] = { k, v: v === undefined ? null : v }; return; }
    if (v && typeof v === 'object' && !Array.isArray(v)){
      const g = {}; Object.keys(v).forEach(kk => { const id = /^\d{4}-\d{2}/.test(kk) ? kk.slice(0, 7) : 'x' + (parseInt(syHash(kk), 36) % 6); (g[id] = g[id] || {})[kk] = v[kk]; });
      Object.keys(g).forEach(id => { out['k.' + k + '.' + id] = { k, o: g[id] }; });
    } else if (Array.isArray(v)){
      const n = Math.ceil(js.length / 150000), per = Math.ceil(v.length / n);
      for (let i = 0; i < n; i++) out['k.' + k + '.' + i] = { k, a: v.slice(i * per, (i + 1) * per), i };
    } else out['k.' + k] = { k, v };
  });
  return out;
}
/* rebuild a state object from documents */
function syJoin(parts){
  const s = {}, arr = {};
  Object.keys(parts).sort().forEach(id => { const p = parts[id]; if (!p || !p.k) return;
    if ('v' in p) s[p.k] = p.v;
    else if (p.o) s[p.k] = Object.assign(s[p.k] && typeof s[p.k] === 'object' ? s[p.k] : {}, p.o);
    else if (p.a) (arr[p.k] = arr[p.k] || []).push([p.i || 0, p.a]); });
  Object.keys(arr).forEach(k => { s[k] = arr[k].sort((a, b) => a[0] - b[0]).flatMap(x => x[1]); });
  return s;
}
/* both sides changed one part: objects merge (b wins on a clash), lists with ids join */
function syMergeVal(a, b){
  if (Array.isArray(a) && Array.isArray(b)){
    if (a.concat(b).every(x => x && typeof x === 'object' && 'id' in x)){ const m = new Map(); a.forEach(x => m.set(x.id, x)); b.forEach(x => m.set(x.id, x)); return [...m.values()]; }
    return b.length >= a.length ? b : a;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object'){ const o = { ...a }; Object.keys(b).forEach(k => { o[k] = k in a ? syMergeVal(a[k], b[k]) : b[k]; }); return o; }
  return b === undefined ? a : b;
}
function syMergePart(local, remote, localNewer){
  const [a, b] = localNewer ? [remote, local] : [local, remote], out = { ...b };
  if ('v' in a && 'v' in b) out.v = syMergeVal(a.v, b.v);
  if (a.o && b.o) out.o = syMergeVal(a.o, b.o);
  return out;
}

function syStatus(s, err){ SY.status = s; SY.err = err || ''; const el = document.getElementById('syncChip'); if (el) el.outerHTML = syChipHTML(); }
const syWhen = t => { if (!t) return 'never'; const d = new Date(t), m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
function syChipHTML(){
  const t = { off: ['off', 'This copy is not synced'], wait: ['wait', 'Connecting…'], on: ['on', `Synced ${syWhen(SY.at)}`], push: ['wait', 'Saving…'], err: ['err', 'Sync paused'] }[SY.status] || ['off', ''];
  return `<span id="syncChip" class="sync-chip ${t[0]}" title="${esc(SY.err || t[1])}"><i></i>${t[1]}</span>`;
}

/* local save without triggering another push */
let syQuiet = false;
save = (orig => function(){ const r = orig.apply(this, arguments); if (!syQuiet && SY.db){ clearTimeout(SY.timer); SY.timer = setTimeout(syPush, 2500); } return r; })(save);
function sySaveLocal(){ syQuiet = true; try { save(); } finally { syQuiet = false; } }

async function syPush(){
  if (!SY.db) return; if (SY.busy){ SY.again = true; return; }
  SY.busy = true; syStatus('push');
  try {
    // another device saved since we last looked: take its changes first, so nothing is overwritten or missed
    const fresh = syFresh((await SY.db.collection('m').get()).docs);
    if (fresh.length) await syPull(fresh);
    const parts = syParts(state), m = syMeta(), ids = Object.keys(parts); let wrote = 0;
    for (const id of ids){ const js = JSON.stringify(parts[id]); if (SY.last[id] === js) continue;
      await SY.db.doc('s/' + id).set(parts[id]); SY.last[id] = js; m.h[id] = syHash(js); wrote++; }
    for (const id of Object.keys(SY.last)){ if (!parts[id]){ await SY.db.doc('s/' + id).delete(); delete SY.last[id]; delete m.h[id]; wrote++; } }
    if (wrote){ m.ts = Date.now(); m.seen[SY.dev] = m.ts; await SY.db.doc('m/' + SY.dev).set({ ts: m.ts, parts: ids.length }); }
    SY.at = Date.now(); sySaveLocal(); syStatus('on');
    syDigest();
  } catch(e){ syStatus('err', (e && e.code === 'quota_exceeded') ? 'Cloud storage is full. Export a backup in Settings → Your data.' : 'Could not reach your cloud copy. Changes stay on this device and sync later.'); }
  if (SY.pending){ SY.pending = false; try { const fr = syFresh((await SY.db.collection('m').get()).docs); if (fr.length && await syPull(fr)) SY.again = true; SY.at = Date.now(); syStatus('on'); } catch(_){ } }
  SY.busy = false; if (SY.again){ SY.again = false; syPush(); }
}

/* pull the cloud copy and merge it with this device's */
async function syPull(fresh){
  const snap = await SY.db.collection('s').get(), remote = {}, m = syMeta(), newest = syNewest(fresh || []);
  snap.docs.forEach(d => { if (d.exists) remote[d.id] = d.data(); });
  const local = syParts(state), merged = {}, localNewer = (state._lastEdit || 0) > newest;
  new Set([...Object.keys(local), ...Object.keys(remote)]).forEach(id => {
    const L = local[id], R = remote[id], lj = L ? JSON.stringify(L) : '', rj = R ? JSON.stringify(R) : '', base = m.h[id];
    if (!R){ if (L && !(base && syHash(lj) === base)) merged[id] = L; return; }            // removed remotely and unchanged here: drop
    if (!L){ merged[id] = R; return; }
    if (lj === rj){ merged[id] = R; return; }
    const lChanged = !base || syHash(lj) !== base, rChanged = !base || syHash(rj) !== base;
    merged[id] = !lChanged ? R : !rChanged ? L : syMergePart(L, R, localNewer);
  });
  const keep = {}; SY_LOCAL.forEach(k => { if (k in state) keep[k] = state[k]; });
  const next = deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), syJoin(merged));
  Object.assign(next, keep); next._sy = { ts: Math.max(m.ts || 0, newest), h: {}, seen: { ...m.seen } }; (fresh || []).forEach(x => { next._sy.seen[x.dev] = x.ts; }); next._lastEdit = state._lastEdit || 0;
  Object.keys(remote).forEach(id => { const js = JSON.stringify(remote[id]); next._sy.h[id] = syHash(js); SY.last[id] = js; });
  const changedHere = JSON.stringify(syJoin(local)) !== JSON.stringify(syJoin(merged));
  state = next; sySaveLocal();
  if (changedHere){ try { AG.res = {}; AG.ctx = null; } catch(_){} try { renderView(activeTab); updateChrome(); } catch(_){} }
  return Object.keys(merged).some(id => !remote[id] || JSON.stringify(merged[id]) !== JSON.stringify(remote[id]));
}

async function syInit(){
  if (!window.claude || typeof window.claude.use !== 'function') return;     // the offline file: nothing to do
  syStatus('wait');
  let db = null; try { db = await window.claude.use('db'); } catch(e){ db = null; }
  if (!db){ syStatus('off'); return; }
  SY.db = db;
  const to = setTimeout(() => { if (SY.status === 'wait') syStatus('err', 'The cloud copy is slow to answer. This device keeps working and syncs when it can.'); }, 10000);
  try {
    const devs = (await db.collection('m').get()).docs.filter(d => d.exists); clearTimeout(to);
    if (!devs.length){ await syPush(); toast('Your data is now saved to your private cloud copy, so it shows on every device.', 'ok', 3600); }
    else {
      const needPush = await syPull(devs.filter(d => d.id !== SY.dev).map(d => ({ dev: d.id, ts: d.data().ts || 0 })));
      SY.at = Date.now(); syStatus('on');
      if (needPush) syPush(); else syDigest();
    }
  } catch(e){ clearTimeout(to); syStatus('err', 'Could not reach your cloud copy. Changes stay on this device and sync later.'); }
  // live: another device saved
  SY.unsub = db.collection('m').onSnapshot(q => {
    if (!syFresh(q.docs).length) return;
    if (SY.busy){ SY.pending = true; return; }   // pulled as soon as the running push ends
    clearTimeout(SY.pullT); SY.pullT = setTimeout(async () => { if (SY.busy){ SY.pending = true; return; } SY.busy = true;
      try { const fr = syFresh((await db.collection('m').get()).docs); if (fr.length){ const need = await syPull(fr); SY.at = Date.now(); syStatus('on'); toast('Updated with changes from your other device.', 'ok', 2200); if (need) SY.again = true; } } catch(_){ }
      SY.busy = false; if (SY.again || SY.pending){ SY.again = false; syPush(); } }, 600);
  }, () => {});
  syBriefingWatch();
}
/* remember when the person (not an automatic job) last changed something: used on clashes */
document.addEventListener('click', e => { if (e.target.closest('button, [data-a], input, select, label')) state._lastEdit = Date.now(); }, true);
document.addEventListener('change', () => { state._lastEdit = Date.now(); }, true);

/* ---------- digest for the morning agent (a short summary, no raw data) ---------- */
let syDigestAt = 0;
function syDigest(){
  if (!SY.db || Date.now() - syDigestAt < 5 * 60 * 1000) return; syDigestAt = Date.now();
  try {
    const k = dkey(), ag = AGENTS.map(a => { const r = agResult(a.id); return r ? { id: a.id, name: a.name, area: a.area, on: agOn(a.id), score: r.score, headline: r.headline, kpis: (r.kpis || []).map(x => x.join(' · ')), open: r.findings.filter(f => !f.done).map(f => ({ t: f.t, why: f.why, sev: f.sev })) } : null; }).filter(Boolean);
    const plan = (typeof dayBlocks === 'function' ? dayBlocks(k) : []).filter(b => !b.skip).map(b => ({ t: b.t, name: b.name, cat: b.cat, status: blockStatus(k, b) }));
    const tom = (typeof dayBlocks === 'function' ? dayBlocks(dkey(addDays(new Date(), 1))) : []).filter(b => !b.skip).map(b => ({ t: b.t, name: b.name }));
    const w = periodStats(dkey(addDays(new Date(), -6)), k);
    SY.db.doc('cloud/digest').set({ at: Date.now(), date: k, name: displayName(), context: coachContext(), agents: ag, plan, tomorrow: tom,
      week: { pct: w.pct, focusMin: w.focus, sleepAvgMin: w.sleepAvg || null, stepsAvg: w.stepsAvg || 0, spent: w.spent },
      srsDue: typeof srsDueCount === 'function' ? srsDueCount() : null, examDate: state.settings.examDate || null,
      speaking: ((state.ielts || {}).mocks || []).slice(-3).map(x => ({ date: x.date, band: x.band, kind: x.kind })) }).catch(() => {});
  } catch(_){ }
}

/* ---------- morning briefing written by the cloud agent ---------- */
const SYB = { b: null };
function syBriefingWatch(){
  if (!SY.db) return;
  SY.unsubB = SY.db.doc('cloud/briefing').onSnapshot(s => { SYB.b = s.exists ? s.data() : null; const el = document.getElementById('cbBox'); if (el) el.outerHTML = briefingHTML(); else if (typeof activeTab !== 'undefined' && activeTab === 'today' && SYB.b) renderView('today'); }, () => {});
}
function briefingHTML(){
  const b = SYB.b; if (!b || !b.date) return '<div id="cbBox" hidden></div>';
  const today = b.date === dkey(), list = (x, cls) => (x || []).map(t => `<li class="${cls || ''}">${esc(t)}</li>`).join('');
  return `<section id="cbBox" class="cb${today ? '' : ' old'}" aria-label="Morning briefing from your agents">
    <header><span class="cb-dot"></span><b>Morning briefing</b><small>${today ? `written by Claude at ${esc(b.time || '')}` : `from ${esc(b.date)}; today's comes at about 06:00`}</small></header>
    ${b.headline ? `<p class="cb-head">${esc(b.headline)}</p>` : ''}
    ${b.top3 && b.top3.length ? `<ol class="cb-top">${list(b.top3)}</ol>` : ''}
    ${b.verdicts && b.verdicts.length ? `<details class="cb-more" open><summary>What each agent says</summary><ul class="cb-v">${b.verdicts.map(v => `<li><b>${esc(v.agent || '')}</b><span>${esc(v.text || '')}</span></li>`).join('')}</ul></details>` : ''}
    ${b.note ? `<p class="cb-note">${esc(b.note)}</p>` : ''}</section>`;
}
// right under the Morning letter, which stays first on Today
// (the review strip is added in 69h-srs.js, which loads before the first draw; the briefing goes between the letter and it)
mvHTML = (orig => function(){ const h = orig.apply(this, arguments), b = SYB.b ? briefingHTML() : ''; if (!b) return h; const i = h.indexOf('<section class="srs-strip'); return i < 0 ? h + b : h.slice(0, i) + b + h.slice(i); })(mvHTML);

/* ---------- Settings → Your data: sync status ---------- */
setBody = (orig => function(sec){ const h = orig.apply(this, arguments); if (sec !== 'data') return h;
  return `<div class="sync-box"><h3>Your data on every device</h3>
    <p class="set-note">${SY.db ? 'On the live link your data is also kept in a private copy in your claude.ai account (only you can open it), so your phone and laptop show the same data. This browser keeps its own copy too, so the app opens instantly and works offline.' : 'This copy is not synced. Open the live link on claude.ai to keep your data on every device.'}</p>
    <div class="sync-row">${syChipHTML()}<span class="sync-dev">This device: ${esc(SY.dev)}</span>${SY.db ? '<button class="btn btn-soft sm" data-sync-now>Sync now</button>' : ''}</div></div>` + h; })(setBody);
document.addEventListener('click', e => { const b = e.target.closest('[data-sync-now]'); if (!b) return; e.stopPropagation(); (async () => { syDigestAt = 0; await syPush(); toast('Synced.', 'ok', 1400); })(); }); // a push pulls other devices' changes first });

setTimeout(syInit, 0);
