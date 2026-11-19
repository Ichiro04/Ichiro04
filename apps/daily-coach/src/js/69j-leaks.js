/* ============================================================
   MONEY LEAKS (19 Nov 2026, from the user's "money leaks audit" video:
   agents read every transaction, flag where money quietly goes, rank by
   £ a month, and nothing changes until he approves it).
   Rule-based, on this device, over his own logged expenses, savings and
   budget lines. Each leak: what it is, the proof (entries and dates), what
   it is worth a month, one action, and his decision: Plan it / Not a leak /
   Fixed. Fixed leaks add up as "recovered", which feeds the £25k gap.
   ============================================================ */
const LK = { scanned: 0, anim: 0, raf: 0 };
const lkNorm = s => String(s || '').toLowerCase().replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 3).join(' ');
const lkCap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const lkMed = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0; };
const lkDays = n => dkey(addDays(new Date(), -(n - 1)));
function lkState(){ if (!state.leaks || typeof state.leaks !== 'object') state.leaks = {}; return state.leaks; }

function lkScan(){
  const ex = (state.expenses || []).filter(e => +e.amount > 0 && e.date), k = dkey(), d30 = lkDays(30), d90 = lkDays(90), L = [];
  const in30 = ex.filter(e => e.date >= d30 && e.date <= k), in90 = ex.filter(e => e.date >= d90 && e.date <= k);
  const catName = id => (catOf(id) || {}).name || id, fmtD = d => { const x = parseKey(d); return `${x.getDate()} ${MONTHS[x.getMonth()].slice(0, 3)}`; };
  // 1. the same thing, paid again each month: a subscription or a habit with a price
  const byNote = {}; in90.forEach(e => { const n = lkNorm(e.note); if (n.length >= 3) (byNote[n] = byNote[n] || []).push(e); });
  Object.entries(byNote).forEach(([n, es]) => {
    const months = new Set(es.map(e => e.date.slice(0, 7))), med = lkMed(es.map(e => +e.amount));
    if (months.size >= 2 && es.every(e => Math.abs(+e.amount - med) <= Math.max(1, med * .2)) && es.length <= months.size * 2)
      L.push({ id: 'sub:' + n, kind: 'Repeats monthly', cat: es[0].cat, m: med * (es.length / months.size), t: `${lkCap(n)}: ${money(med)} every month`,
        why: `Paid ${es.length} times in ${months.size} months (${es.slice(-3).map(e => fmtD(e.date)).join(', ')})`, act: 'Still using it? Cancel, pause or move to a cheaper plan.', ids: es.map(e => e.id) });
  });
  // 2. little and often: many small spends that add up
  const small = {}; in30.filter(e => +e.amount <= 8).forEach(e => { const key = lkNorm(e.note) || 'cat:' + e.cat; (small[key] = small[key] || []).push(e); });
  Object.entries(small).forEach(([key, es]) => { if (es.length < 5) return; const tot = es.reduce((a, e) => a + +e.amount, 0), label = key.startsWith('cat:') ? catName(key.slice(4)) : lkCap(key);
    L.push({ id: 'small:' + key, kind: 'Little and often', cat: es[0].cat, m: tot / 2, t: `${label}: ${es.length} small spends, ${money(tot)} in 30 days`,
      why: `Average ${money(tot / es.length)} each. Halving them saves about ${money0(tot / 2)} a month`, act: 'Set a weekly cap, or swap half of them for something from home.', ids: es.map(e => e.id) }); });
  // 3. over the budget line, and 4. creeping up against the two months before
  CATS.forEach(c => {
    const now = in30.filter(e => e.cat === c.id).reduce((a, e) => a + +e.amount, 0), bud = typeof catBudget === 'function' ? catBudget(c.id) : 0;
    const prev = ex.filter(e => e.cat === c.id && e.date >= lkDays(90) && e.date < d30).reduce((a, e) => a + +e.amount, 0) / 2;
    if (bud > 0 && now > bud + 5) L.push({ id: 'over:' + c.id, kind: 'Over budget', cat: c.id, m: now - bud, t: `${c.name}: ${money0(now - bud)} over its budget line`,
      why: `${money0(now)} in 30 days against ${money0(bud)} planned`, act: `Open Money and pick the two biggest ${c.name.toLowerCase()} spends to cut next month.`, ids: in30.filter(e => e.cat === c.id).map(e => e.id) });
    else if (prev > 20 && now > prev * 1.25 && now - prev > 10) L.push({ id: 'creep:' + c.id, kind: 'Creeping up', cat: c.id, m: now - prev, t: `${c.name}: up ${Math.round((now / prev - 1) * 100)}% on your usual month`,
      why: `${money0(now)} in the last 30 days; your usual is ${money0(prev)}`, act: 'Check what is new in this category before it becomes normal.', ids: in30.filter(e => e.cat === c.id).map(e => e.id) });
  });
  // 5. charged twice: same amount and description within a day
  const seen = {}; in90.slice().sort((a, b) => a.date < b.date ? -1 : 1).forEach(e => { const key = (lkNorm(e.note) || e.cat) + '|' + (+e.amount).toFixed(2), p = seen[key];
    if (p && (parseKey(e.date) - parseKey(p.date)) / 864e5 <= 1 && +e.amount >= 3) L.push({ id: 'dup:' + p.id + ':' + e.id, kind: 'Charged twice?', cat: e.cat, m: 0, once: +e.amount,
      t: `${lkCap(lkNorm(e.note)) || catName(e.cat)}: ${money(+e.amount)} twice`, why: `On ${fmtD(p.date)} and ${fmtD(e.date)}`, act: 'Check your bank app. If it is a double charge, ask for a refund.', ids: [p.id, e.id] });
    seen[key] = e; });
  // 6. pay with no job: by day 20, this month's saving is well under what the budget allows
  const mp = monthProgress(), mk = monthKey(), savedM = (state.savings || []).filter(s => (s.date || '').startsWith(mk)).reduce((a, s) => a + +s.amount, 0), can = feasiblePerMonth();
  if (mp.day >= 20 && can > 0 && savedM < can * .8) L.push({ id: 'nojob:' + mk, kind: 'Money with no job', cat: 'save', m: can - savedM, t: `${money0(can - savedM)} of this month’s pay has no job yet`,
    why: `Saved ${money0(savedM)} this month; the budget leaves ${money0(can)} to save`, act: 'Move it to savings now, and set a standing order for payday.', ids: [] });
  // 7. blind spots: days with nothing logged, where leaks hide
  const blind = []; for (let i = 1; i <= 14; i++){ const d = lkDays(i + 1); if (!ex.some(e => e.date === d)) blind.push(d); }
  if (blind.length >= 5) L.push({ id: 'blind:' + k, kind: 'Blind spots', cat: 'data', m: 0, t: `${blind.length} of the last 14 days have no spending logged`,
    why: 'A day with no entries is either a no-spend day or a leak nobody can see', act: 'Log every spend before bed, or note “no spend” on Today.', ids: [] });
  // no double counting: a creep in a category that is also over budget is dropped
  const overCats = new Set(L.filter(x => x.kind === 'Over budget').map(x => x.cat));
  return L.filter(x => !(x.kind === 'Creeping up' && overCats.has(x.cat))).map(x => ({ ...x, m: Math.round(x.m) })).sort((a, b) => (b.m || b.once || 0) - (a.m || a.once || 0));
}
function lkSummary(list = lkScan()){
  const st = lkState(), open = list.filter(x => !st[x.id] || st[x.id].s === 'plan'), fixedM = Object.values(st).filter(v => v.s === 'fixed').reduce((a, v) => a + (+v.m || 0), 0);
  const openM = open.reduce((a, x) => a + (x.m || 0), 0), gap = Math.max(0, needPerMonth() - feasiblePerMonth());
  return { list, open, openM, fixedM, gap, read: (state.expenses || []).length + (state.savings || []).length };
}

/* ---------- the flow map: pay flows into each category; leaks glow red (canvas) ---------- */
function lkMount(){
  const cv = document.getElementById('lkMap'); if (!cv) return; cancelAnimationFrame(LK.raf);
  const ctx = cv.getContext('2d'), d = Math.min(2, devicePixelRatio || 1), sum = lkSummary(), st = lkState();
  const spend = {}; (state.expenses || []).filter(e => e.date >= lkDays(30)).forEach(e => { spend[e.cat] = (spend[e.cat] || 0) + +e.amount; });
  const leakCats = {}; sum.open.forEach(x => { leakCats[x.cat] = (leakCats[x.cat] || 0) + (x.m || x.once || 0); });
  let W = 0, H = 0, nodes = [], parts = [];
  const lay = () => { W = cv.clientWidth; H = cv.clientHeight; if (W < 8 || H < 8) return false; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    const cx = W * .56, cy = H * .5, rx = W * .36, ry = H * .36, cats = CATS.concat([{ id: 'save', name: 'Savings' }]);
    nodes = [{ id: 'pay', name: 'Pay', x: W * .1, y: cy, v: +state.settings.income || 0 }].concat(cats.map((c, i) => { const a = -Math.PI / 2 + i / cats.length * Math.PI * 2;
      return { id: c.id, name: c.name, x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, v: c.id === 'save' ? (state.savings || []).filter(s => (s.date || '') >= lkDays(30)).reduce((x, s) => x + +s.amount, 0) : (spend[c.id] || 0), leak: leakCats[c.id] || 0 }; }));
    const tot = nodes.slice(1).reduce((a, n) => a + n.v, 0) || 1, N = Math.min(900, Math.round(W * H / 260));
    parts = Array.from({ length: N }, (_, i) => { const r = Math.random() * tot; let acc = 0, n = nodes[1]; for (const x of nodes.slice(1)){ acc += x.v; if (r <= acc){ n = x; break; } }
      return { n, t: Math.random(), sp: .0025 + Math.random() * .004, a: Math.random() * Math.PI * 2, r: 6 + Math.random() * 26 * (n.leak ? 1.3 : 1), o: Math.random() * 1.6 - .8 }; });
    return true; };
  const draw = (time) => {
    if (!cv.isConnected){ cancelAnimationFrame(LK.raf); return; }
    ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
    const pay = nodes[0];
    parts.forEach(p => { p.t += p.sp * (motionOff() ? 0 : 1); if (p.t > 1.6) p.t = 0;
      const n = p.n, k = Math.min(1, p.t), mx = (pay.x + n.x) / 2, my = (pay.y + n.y) / 2 + p.o * 60, u = k;
      let x = (1 - u) * (1 - u) * pay.x + 2 * (1 - u) * u * mx + u * u * n.x, y = (1 - u) * (1 - u) * pay.y + 2 * (1 - u) * u * my + u * u * n.y;
      if (p.t > 1){ p.a += .02; x = n.x + Math.cos(p.a) * p.r; y = n.y + Math.sin(p.a) * p.r * .7; }
      const red = n.leak > 0, al = p.t > 1 ? .55 : .3;
      ctx.fillStyle = red ? `rgba(255,${80 + (p.r | 0)},${90},${al})` : n.id === 'save' ? `rgba(120,230,170,${al})` : `rgba(200,220,255,${al})`;
      ctx.fillRect(x, y, red ? 1.8 : 1.4, red ? 1.8 : 1.4); });
    ctx.globalCompositeOperation = 'source-over';
    nodes.forEach(n => { const big = n.id === 'pay', red = n.leak > 0, pulse = motionOff() ? 0 : (Math.sin(time / 500 + n.x) + 1) / 2;
      if (red){ ctx.strokeStyle = `rgba(255,90,100,${.35 + pulse * .4})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(n.x, n.y, 16 + pulse * 6, 0, 7); ctx.stroke(); }
      ctx.fillStyle = red ? '#FF5A64' : big ? '#F2F1ED' : n.id === 'save' ? '#7BE3A9' : '#DDE6FF'; ctx.beginPath(); ctx.arc(n.x, n.y, big ? 6 : 4.5, 0, 7); ctx.fill();
      ctx.font = '600 11px -apple-system, "Segoe UI", sans-serif'; ctx.fillStyle = 'rgba(242,241,237,.9)'; ctx.textAlign = n.x < W * .3 ? 'left' : 'center';
      ctx.fillText(n.name + (n.v ? ` · ${money0(n.v)}` : ''), n.x + (big ? 10 : 0), n.y - (big ? 10 : 12));
      if (red){ ctx.fillStyle = '#FF8A90'; ctx.font = '700 11px -apple-system, "Segoe UI", sans-serif'; ctx.fillText(n.leak ? `${money0(n.leak)} a month` : 'check', n.x, n.y + 24); } });
    if (!motionOff()) LK.raf = requestAnimationFrame(draw);
  };
  if (lay()) draw(0);
  if (!LK.ro){ LK.ro = new ResizeObserver(() => { const c = document.getElementById('lkMap'); if (c) lkMount(); }); }
  try { LK.ro.disconnect(); LK.ro.observe(cv); } catch(_){}
}

function lkHTML(){
  const s = lkSummary(), st = lkState(), share = s.gap ? Math.min(100, Math.round((s.openM + s.fixedM) / s.gap * 100)) : 0;
  const row = (x, i) => { const v = st[x.id] || {}, sv = v.s || '';
    return `<li class="lk-row ${sv}${LK.anim ? ' in' : ''}" style="--d:${i * 90}ms">
      <div class="lk-n">${String(i + 1).padStart(2, '0')}</div>
      <div class="lk-b"><small>${esc(x.kind)}${sv === 'plan' ? ' · <b>planned</b>' : sv === 'fixed' ? ' · <b>fixed</b>' : ''}</small><b>${esc(x.t)}</b><span>${esc(x.why)}</span><em>${esc(x.act)}</em></div>
      <div class="lk-v"><b>${x.m ? money0(x.m) : x.once ? money(x.once) : '–'}</b><small>${x.m ? 'a month' : x.once ? 'one-off' : 'no £ yet'}</small></div>
      <div class="lk-acts">${sv === 'fixed' ? `<button class="btn btn-soft sm" data-lk="undo" data-id="${esc(x.id)}">Undo</button>`
        : `${sv !== 'plan' ? `<button class="btn btn-deep sm" data-lk="plan" data-id="${esc(x.id)}">Plan it</button>` : ''}<button class="btn btn-soft sm" data-lk="fixed" data-id="${esc(x.id)}">Fixed</button><button class="btn btn-soft sm" data-lk="ignore" data-id="${esc(x.id)}">Not a leak</button>`}</div></li>`; };
  const shown = s.list.filter(x => (st[x.id] || {}).s !== 'ignore'), ignored = s.list.length - shown.length;
  return `<section class="lk" id="lkRoot" aria-label="Money leaks">
    <div class="lk-head"><div><small>Money leaks · audit of your own entries</small><b>${s.open.length ? `${money0(s.openM)} a month could be yours again` : 'No leaks found right now'}</b>
      <span>Read ${s.read} entries on this device. Nothing changes until you choose. ${s.gap ? `Your £25k gap is ${money0(s.gap)} a month; these leaks cover ${share}% of it.` : ''}</span></div>
      <div class="lk-kpis"><div><small>Open</small><b>${s.open.length}</b></div><div><small>Could save</small><b class="hot">${money0(s.openM)}</b></div><div><small>A year</small><b>${money0(s.openM * 12)}</b></div><div><small>Recovered</small><b class="ok">${money0(s.fixedM)}</b></div></div>
      <button class="btn btn-deep" data-lk="scan">${LK.scanned ? 'Run the audit again' : 'Run the audit'}</button></div>
    <div class="lk-grid"><div class="lk-mapw"><canvas id="lkMap" aria-label="Where your pay went in the last 30 days. Red rings are leaks."></canvas><div class="lk-scan" id="lkScan" hidden><i></i><span>Reading entries…</span></div>
      <p class="lk-key"><span><i class="w"></i>spending</span><span><i class="g"></i>savings</span><span><i class="r"></i>leak</span> · last 30 days</p></div>
      <ol class="lk-list">${shown.length ? shown.map(row).join('') : `<li class="lk-empty">Nothing flagged. Keep logging every spend, and the audit gets sharper each week.</li>`}
      ${ignored ? `<li class="lk-ign"><button class="btn btn-soft sm" data-lk="unignore">Show ${ignored} marked “not a leak”</button></li>` : ''}</ol></div></section>`;
}
renderMoney = (orig => function(){ const h = orig.apply(this, arguments), i = h.indexOf('<div class="h2'); return i < 0 ? lkHTML() + h : h.slice(0, i) + lkHTML() + h.slice(i); })(renderMoney);
renderView = (orig => function(tab){ const r = orig.apply(this, arguments); if (tab === 'money') requestAnimationFrame(lkMount); return r; })(renderView);

document.addEventListener('click', e => {
  const b = e.target.closest('[data-lk]'); if (!b) return; e.stopPropagation(); const a = b.dataset.lk, st = lkState();
  if (a === 'scan'){ const sc = document.getElementById('lkScan'), n = lkSummary().read; if (sc && !motionOff()){ sc.hidden = false; let i = 0; const t = setInterval(() => { i = Math.min(n, i + Math.ceil(n / 12)); sc.querySelector('span').textContent = `Reading ${i} of ${n} entries…`; if (i >= n){ clearInterval(t); setTimeout(() => { LK.scanned = Date.now(); LK.anim = 1; renderView('money'); LK.anim = 0; }, 350); } }, 90); }
    else { LK.scanned = Date.now(); renderView('money'); } return; }
  if (a === 'unignore'){ Object.keys(st).forEach(k => { if (st[k].s === 'ignore') delete st[k]; }); save(); renderView('money'); return; }
  const x = lkScan().find(q => q.id === b.dataset.id); if (!x) return;
  if (a === 'undo') delete st[x.id];
  else { st[x.id] = { s: a, at: Date.now(), m: x.m || 0, t: x.t }; if (a === 'fixed') toast(x.m ? `${money0(x.m)} a month back in your plan.` : 'Marked as fixed.', 'ok', 2000); if (a === 'plan') toast('Added to your plan. Do it this week.', 'ok', 1800); }
  if (a === 'plan' && state.coachPlan && Array.isArray(state.coachPlan.items) && !state.coachPlan.items.some(it => it.lk === x.id)) state.coachPlan.items.push({ id: 'lk' + Date.now().toString(36), t: x.act.split('.')[0], why: x.t, src: 'me', go: 'money', icon: 'piggy', lk: x.id });
  save(); renderView('money'); updateChrome();
}, true);

/* the Money agent reports the two biggest open leaks */
(() => { const ag = typeof AGENTS !== 'undefined' && AGENTS.find(a => a.id === 'money'); if (!ag) return; const run = ag.run;
  ag.run = function(c){ const r = run.call(this, c); try { const s = lkSummary(); s.open.slice(0, 2).forEach(x => r.findings.push({ id: 'leak-' + x.id, t: x.m ? `Leak: ${x.t} (${money0(x.m)} a month)` : `Leak: ${x.t}`, why: x.act, go: 'money', sev: x.m >= 40 ? 3 : 2 }));
    r.kpis.push(['Leaks', s.open.length, s.openM ? `${money0(s.openM)} a month` : 'none open']); } catch(_){} return r; }; })();
