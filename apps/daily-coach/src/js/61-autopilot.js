/* ============================================================
   AUTOPILOT · the in-app coach that runs on its own
   - Builds today's plan (a to-do list) from the schedule, the
     day-plan blocks and his weakest area, once per day.
   - Works out tips from his own numbers (savings pace, best day,
     weakest habit, sleep against results, weight trend).
   - Knows when the 2-week and monthly check-ins are due and
     prepares a draft with the period's numbers filled in.
   - Runs when the app opens, when it comes back to the front
     and every 15 minutes while it stays open. Data never leaves
     the browser.
   Also: section layouts that can be reordered and hidden
   (Review and Coach), so the tabs can be edited later.
   ============================================================ */
Object.assign(ICONS, {
  robot:'<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5"/><circle cx="12" cy="3.5" r="1"/>',
  checklist:'<path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9"/>',
  grip:'<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  up:'<path d="M6 15l6-6 6 6"/>', down:'<path d="M6 9l6 6 6-6"/>',
  layout:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 9v12"/>',
  cube:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  quote:'<path d="M7 7h4v4c0 3-2 5-4 6M14 7h4v4c0 3-2 5-4 6"/>'
});

/* ---------- state defaults (older saves get them on first run) ---------- */
function apState(){
  if (!state.autopilot) state.autopilot = {};
  const a = state.autopilot;
  for (const [k, v] of Object.entries({ on:true, plan:true, checkins:true, tips:true, carry:true, log:[], last:'', notified:{} })) if (a[k] === undefined) a[k] = v;
  if (!a.anchor){ a.anchor = dkey(startOfWeek(parseKey(state.createdAt || dkey()))); }
  if (!state.reviews) state.reviews = [];
  if (!state.reviewDraft) state.reviewDraft = {};
  if (!state.coachPlan) state.coachPlan = { date:'', items:[] };
  if (!state.layout) state.layout = {};
  return a;
}
function apLog(msg){ const a = apState(); a.log.unshift({ ts: Date.now(), msg }); a.log = a.log.slice(0, 30); }

/* ---------- periods: 2-week (Mon to Sun fortnights) and calendar months ---------- */
function ciPeriod(type, ref = new Date()){
  ref = new Date(ref); ref.setHours(0,0,0,0);
  if (type === '1m'){ const from = new Date(ref.getFullYear(), ref.getMonth(), 1), to = new Date(ref.getFullYear(), ref.getMonth()+1, 0); return { type, from:dkey(from), to:dkey(to), days:to.getDate() }; }
  const anc = parseKey(apState().anchor), n = Math.floor(daysBetween(dkey(anc), dkey(ref)) / 14);
  const from = addDays(anc, n*14); return { type, from:dkey(from), to:dkey(addDays(from, 13)), days:14 };
}
function ciPrev(p){ return ciPeriod(p.type, addDays(parseKey(p.from), -1)); }
function ciDone(p){ return (state.reviews||[]).find(r => r.type === p.type && r.to === p.to); }
const CI_NAME = { '2w':'2-week check-in', '1m':'Monthly check-in' };
function ciStatus(type){ // what to show for a check-in right now
  const cur = ciPeriod(type), prev = ciPrev(cur), today = dkey(), left = daysBetween(today, cur.to);
  const started = (state.createdAt || today) <= prev.to;
  if (started && !ciDone(prev) && daysBetween(prev.to, today) <= 7) return { p:prev, state:'late', left:-daysBetween(prev.to, today) };
  if (ciDone(cur)) return { p:cur, state:'done', left };
  return { p:cur, state: left <= 2 ? 'due' : 'open', left };
}

/* ---------- numbers for any date range (used by check-ins, charts and tips) ---------- */
function periodStats(from, to){
  const today = dkey(), end = to < today ? to : today, out = { from, to, days:0, tasks:0, tasksAll:0, streakDays:0, train:0, essays:0, speaking:0, packs:0, essayDays:0, packDays:0,
    focus:0, sleep:[], steps:[], saved:0, spent:0, weightA:null, weightB:null, best:null, scores:[] };
  if (from > end) return out;
  for (let d = parseKey(from); dkey(d) <= end; d = addDays(d, 1)){
    const k = dkey(d), r = dayRec(k), n = countDone(k), tot = tasksForDay(k).length;
    out.days++; out.tasks += n; out.tasksAll += tot; out.scores.push(tot ? n/tot : 0);
    if (isStreakDay(k)) out.streakDays++;
    if (taskDone(k,'train') || sessionDonePct(k) >= 80) out.train++;
    if ((state.ielts && state.ielts.speaking && state.ielts.speaking[k]) || taskDone(k,'speaking')) out.speaking++;
    if (taskDone(k,'essay')) out.essayDays++;
    if (taskDone(k,'knowledge')) out.packDays++;
    if (typeof focusOf === 'function') out.focus += focusOf(k);
    const sl = typeof sleepMins === 'function' ? sleepMins(r) : null; if (sl) out.sleep.push(sl);
    if (r.steps) out.steps.push(+r.steps);
    if (+r.weight > 0){ if (out.weightA === null) out.weightA = +r.weight; out.weightB = +r.weight; out.weighN = (out.weighN || 0) + 1; }
    if (!out.best || n > out.best.n) out.best = { k, n };
  }
  const inR = k => k >= from && k <= end;
  out.essays = Math.max(out.essayDays, ((state.ielts && state.ielts.essays) || []).filter(e => inR(e.date || '')).length);
  out.packs = Math.max(out.packDays, Object.values(state.knowledge || {}).filter(v => inR(String(v))).length);
  out.saved = (state.savings || []).filter(s => inR(s.date || '')).reduce((a, s) => a + (+s.amount || 0), 0);
  out.spent = (state.expenses || []).filter(e => inR(e.date || '')).reduce((a, e) => a + (+e.amount || 0), 0);
  out.pct = out.tasksAll ? Math.round(out.tasks / out.tasksAll * 100) : 0;
  out.sleepAvg = out.sleep.length ? out.sleep.reduce((a, b) => a + b, 0) / out.sleep.length : null;
  out.stepsAvg = out.steps.length ? Math.round(out.steps.reduce((a, b) => a + b, 0) / out.steps.length) : null;
  out.weightChange = out.weighN >= 2 ? out.weightB - out.weightA : null;
  out.budget = Math.round(fixedTotal() * out.days / 30.4);
  return out;
}
/* six life areas scored 0–5 from the numbers, so the balance wheel works before any check-in */
const areaLow = n => n === 'English' ? n : n.toLowerCase();
const AREAS = [['train','Training','dumbbell'],['english','English','pen'],['eng','Engineering','gears'],['money','Money','pound'],['routine','Routine','flame'],['health','Sleep and health','moon']];
function areaScores(s){
  const wk = Math.max(1, s.days / 7), sc = v => Math.round(clamp(v, 0, 1) * 50) / 10;
  const scheduledTrain = wk * 4, eng = (s.essays + s.speaking) / (wk * 6), packs = s.packs / (wk * 5);
  const money = s.days ? (s.budget ? 1 - Math.max(0, s.spent - s.budget) / Math.max(1, s.budget) : 1) * .6 + (s.saved > 0 ? .4 : 0) : 0;
  const sleep = s.sleepAvg ? 1 - Math.min(1, Math.abs(s.sleepAvg - 465) / 150) : .5;
  return { train: sc(s.train / scheduledTrain), english: sc(eng), eng: sc(packs * .7 + (typeof kmStudyScores === 'function' ? .3 * apStudyAvg() : 0)), money: sc(money), routine: sc(s.pct / 100), health: sc(sleep * .7 + (s.stepsAvg ? Math.min(1, s.stepsAvg / (+state.settings.stepsGoal || 8000)) * .3 : .15)) };
}
function apStudyAvg(){ try { const m = kmStudyScores(); const v = Object.values(m); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; } catch(_){ return 0; } }
function weakestTopic(){
  if (typeof KM_DOMAINS === 'undefined' || typeof kmMastery !== 'function') return null;
  let best = null;
  KM_DOMAINS.forEach(d => { const m = d.topics.reduce((a, t) => a + kmMastery(t), 0) / d.topics.length / 100, gap = d.w * (1 - m);
    if (!best || gap > best.gap){ const t = d.topics.slice().sort((a, b) => kmMastery(a) - kmMastery(b))[0]; best = { gap, d, t, m }; } });
  return best;
}

/* ---------- today's plan ---------- */
function apBuildPlan(k = dkey()){
  const items = [], blocks = typeof dayBlocks === 'function' ? dayBlocks(k).filter(b => !b.skip) : [], at = id => (blocks.find(b => b.task === id || b.id === id) || {}).t || '';
  tasksForDay(k).forEach(t => items.push({ id:'t-' + t.id, t:t.name, why:t.meta, src:'task', task:t.id, go:t.go, sub:t.sub, time:at(t.id), icon:t.icon }));
  blocks.filter(b => !b.task && b.cat !== 'Routine').forEach(b => items.push({ id:'b-' + b.id, t:b.name, why:b.note, src:'block', block:b.id, go:b.go, time:b.t, icon: b.cat === 'Career' ? 'bolt' : 'gears' }));
  const w = weakestTopic(); if (w && w.t) items.push({ id:'w-' + w.t.n, t:`Study 20 minutes: ${w.t.n}`, why:`${w.d.name} is your biggest gap (${Math.round(w.m*100)}% mastered, ${w.d.w}% of the plan)`, src:'auto', topic:w.t.n, time:'16:00', icon:'target' });
  ['2w','1m'].forEach(type => { const s = ciStatus(type); if (s.state === 'due' || s.state === 'late') items.push({ id:'ci-' + type + s.p.to, t:`Do your ${CI_NAME[type].toLowerCase()} (10 minutes)`, why: s.state === 'late' ? 'Overdue: the period has ended' : `Due ${shortDate(parseKey(s.p.to))}`, src:'auto', go:'review', time:'19:30', icon:'calendar' }); });
  const slp = periodStats(dkey(addDays(parseKey(k), -3)), dkey(addDays(parseKey(k), -1))).sleepAvg;
  if (slp && slp < 420) items.push({ id:'sleep', t:'In bed by 23:00 tonight', why:`You averaged ${Math.floor(slp/60)}h ${Math.round(slp%60)}m over the last 3 nights`, src:'auto', time:'22:45', icon:'moon' });
  const ex = state.settings.examDate; if (ex){ const dl = daysBetween(k, ex); if (dl >= 0 && dl <= 60) items.push({ id:'ielts', t:'IELTS timed reading, 20 minutes', why:`${dl} days to the exam`, src:'auto', go:'learn', time:'13:30', icon:'book' }); }
  if (state.focusArea){ const f = AREAS.find(a => a[0] === state.focusArea); if (f) items.push({ id:'focus', t:`Focus area: ${f[1]}`, why:'Chosen at your last check-in. Do one extra thing for it today.', src:'auto', go:{ train:'train', english:'learn', eng:'learn', money:'money', routine:'today', health:'progress' }[f[0]], time:'', icon:f[2] }); }
  return items.sort((a, b) => (a.time || '99') < (b.time || '99') ? -1 : 1);
}
function apItemDone(k, it){
  if (it.task) return taskDone(k, it.task);
  if (it.block) return (dayRec(k).plan || {})[it.block] === 'done';
  return !!it.done;
}
function apSetDone(k, it, on){
  if (it.task){ setTask(k, it.task, on); return; }
  if (it.block){ const r = dayRec(k, true); r.plan = r.plan || {}; if (on) r.plan[it.block] = 'done'; else delete r.plan[it.block]; save(); return; }
  it.done = on; save();
}
function apPlan(){ // today's plan, built on first look of the day
  const a = apState(), k = dkey(), p = state.coachPlan;
  if (p.date !== k){
    const carry = a.carry ? (p.items || []).filter(i => i.src === 'me' && !i.done).map(i => ({ ...i, carried:true })) : [];
    state.coachPlan = { date:k, items: [...(a.plan ? apBuildPlan(k) : []), ...carry] };
    apLog(`Built today’s plan: ${state.coachPlan.items.length} items${carry.length ? `, ${carry.length} carried over` : ''}.`); save();
  }
  return state.coachPlan;
}

/* ---------- tips from his own numbers ---------- */
function apTips(){
  const tips = [], now = new Date(), k = dkey(), s28 = periodStats(dkey(addDays(now, -27)), k), s14 = periodStats(dkey(addDays(now, -13)), k);
  // savings pace this month
  const m0 = dkey(new Date(now.getFullYear(), now.getMonth(), 1)), sm = periodStats(m0, k), need = needPerMonth(), dim = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const pace = sm.days ? sm.saved / sm.days * dim : 0;
  tips.push(sm.saved > 0 ? { id:'pace', icon:'piggy', t:`Saved ${money0(sm.saved)} this month. At this pace that is ${money0(pace)} by month end, against ${money0(need)} needed.`, go:'money', b:'Open money' }
                         : { id:'pace', icon:'piggy', t:`Nothing moved to savings this month yet. The plan needs ${money0(need)} a month: set up a transfer on payday.`, go:'money', b:'Add savings' });
  // best weekday
  const byDay = Array.from({ length:7 }, () => [0, 0]);
  for (let i = 0; i < 28; i++){ const kk = dkey(addDays(now, -i)); if (kk < (state.createdAt || k)) continue; const wd = isoWeekday(parseKey(kk)); byDay[wd][0] += countDone(kk); byDay[wd][1]++; }
  const avg = byDay.map(([a, n]) => n ? a/n : -1), bi = avg.indexOf(Math.max(...avg));
  if (avg[bi] > 0) tips.push({ id:'bestday', icon:'flame', t:`Your strongest day is ${DAYS_LONG[bi]} (${num(avg[bi])} tasks on average). Put the hardest work there.`, b:'' });
  // weakest habit over 14 days
  const rate = {}; for (let i = 0; i < 14; i++){ const kk = dkey(addDays(now, -i)); if (kk < (state.createdAt || k)) continue; tasksForDay(kk).forEach(t => { const r = rate[t.id] || (rate[t.id] = [0, 0, t]); r[1]++; if (taskDone(kk, t.id)) r[0]++; }); }
  const weak = Object.values(rate).filter(r => r[1] >= 2).sort((a, b) => a[0]/a[1] - b[0]/b[1])[0];
  if (weak && weak[0]/weak[1] < .6) tips.push({ id:'weak', icon:'target', t:`${weak[2].name}: done ${weak[0]} of ${weak[1]} times in two weeks. Tie it to something you already do, like lunch.`, go:weak[2].go, b:'Open it' });
  // sleep against results
  const good = [], bad = []; for (let i = 1; i < 28; i++){ const kk = dkey(addDays(now, -i)), sl = sleepMins(dayRec(kk)); if (sl) (sl >= 420 ? good : bad).push(dayScore(kk)); }
  if (good.length >= 3 && bad.length >= 3){ const g = good.reduce((a, b) => a+b, 0)/good.length, b2 = bad.reduce((a, b) => a+b, 0)/bad.length; if (g - b2 > .08) tips.push({ id:'sleepfx', icon:'moon', t:`After 7+ hours of sleep you finish ${Math.round(g*100)}% of tasks; after less, ${Math.round(b2*100)}%. Sleep is your cheapest win.`, b:'' }); }
  // weight trend
  const ws = weightSeries().filter(w => w.date >= dkey(addDays(now, -42)));
  if (ws.length >= 3){ const days = Math.max(1, daysBetween(ws[0].date, ws[ws.length-1].date)), perWk = (ws[ws.length-1].kg - ws[0].kg) / days * 7, left = ws[ws.length-1].kg - (+state.profile.weightTarget || 72);
    tips.push({ id:'weight', icon:'scale', t: perWk < -0.05 ? `Losing ${num(-perWk)} kg a week. At this rate you reach ${state.profile.weightTarget} kg in about ${Math.ceil(left / -perWk)} weeks.` : `Weight is flat or rising (${perWk >= 0 ? '+' : ''}${num(perWk)} kg a week). Check portions on the food shop list.`, go:'progress', b:'See progress' }); }
  // streak at risk tonight
  if (now.getHours() >= 18 && countDone(k) < STREAK_TARGET) tips.push({ id:'risk', icon:'flame', t:`${STREAK_TARGET - countDone(k)} more task${STREAK_TARGET - countDone(k) > 1 ? 's' : ''} keeps the streak alive tonight. Vocabulary and logging spends take 15 minutes.`, go:'today', b:'Show tasks' });
  // focus time
  if (s14.days >= 5){ const h = s14.focus / s14.days / 60; tips.push({ id:'focus', icon:'clock', t:`Focused time: ${num(h)} hours a day over the last two weeks${h < 2 ? '. Aim for two: finish the morning blocks first.' : '. Keep it there.'}`, go:'today', b:'' }); }
  { const ct = apSpendTip(); if (ct) tips.push(ct); }
  if (s28.essays === 0) tips.push({ id:'essay0', icon:'pen', t:'No IELTS essays logged in 4 weeks. One essay a week moves the band more than reading.', go:'learn', b:'Write one' });
  return tips;
}

/* ---------- the run ---------- */
function apRun(reason){
  const a = apState(); if (!a.on){ return; }
  const k = dkey(); apPlan();
  if (a.checkins) ['2w','1m'].forEach(type => {
    const s = ciStatus(type); if (s.state !== 'due' && s.state !== 'late') return;
    const key = type + s.p.to, d = state.reviewDraft[key];
    if (!d){ state.reviewDraft[key] = { type, from:s.p.from, to:s.p.to, ratings:{}, well:'', block:'', change:'', focus:'' }; apLog(`Prepared your ${CI_NAME[type].toLowerCase()} for ${shortDate(parseKey(s.p.from))} to ${shortDate(parseKey(s.p.to))}.`); }
    if (a.notified[key] !== k){ a.notified[key] = k; setTimeout(() => toast(`${CI_NAME[type]} ${s.state === 'late' ? 'is overdue' : 'is ready'}. It’s in the Review tab.`, 'ok', 3200), 1600); }
  });
  if (a.last.slice(0, 10) !== k && reason !== 'manual') apLog('Morning run: tips and plan refreshed.');
  a.last = new Date().toISOString(); save();
  if (typeof reviewBadge === 'function') reviewBadge();
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') try { apRun('focus'); if (activeTab === 'coach' || activeTab === 'review') renderView(activeTab); } catch(_){} });
setInterval(() => { try { const before = state.coachPlan && state.coachPlan.date; apRun('tick'); if (before !== dkey() && (activeTab === 'coach' || activeTab === 'review')) renderView(activeTab); } catch(_){} }, 15 * 60 * 1000);

/* ---------- editable section layouts ---------- */
const LAYOUT_EDIT = {};
function layoutOrder(tab, ids){
  const L = state.layout[tab] || {}, order = (L.order || []).filter(id => ids.includes(id));
  ids.forEach(id => { if (!order.includes(id)) order.push(id); });
  return { order, hidden: L.hidden || [] };
}
function sectionsHTML(tab, defs){ // defs: [[id, title, () => html]]
  const ids = defs.map(d => d[0]), { order, hidden } = layoutOrder(tab, ids), edit = LAYOUT_EDIT[tab];
  const bar = `<div class="lay-bar"><button class="lay-btn${edit ? ' on' : ''}" data-lay="toggle" data-tab="${tab}">${ic(edit ? 'check' : 'layout', 15)} ${edit ? 'Done' : 'Edit layout'}</button></div>`;
  return bar + order.map((id, i) => { const d = defs.find(x => x[0] === id); if (!d) return '';
    const off = hidden.includes(id); if (off && !edit) return '';
    const tools = edit ? `<div class="lay-tools"><span class="lay-name">${ic('grip', 14)} ${esc(d[1])}</span><button data-lay="up" data-tab="${tab}" data-id="${id}" aria-label="Move ${esc(d[1])} up" ${i === 0 ? 'disabled' : ''}>${ic('up', 15)}</button><button data-lay="down" data-tab="${tab}" data-id="${id}" aria-label="Move ${esc(d[1])} down" ${i === order.length-1 ? 'disabled' : ''}>${ic('down', 15)}</button><button data-lay="hide" data-tab="${tab}" data-id="${id}" class="${off ? 'off' : ''}">${off ? 'Show' : 'Hide'}</button></div>` : '';
    let body = ''; try { body = off ? '' : d[2](); } catch(err){ body = `<div class="glass card tiny">This part could not load (${esc(err.message)}).</div>`; }
    return `<div class="lay-sec${edit ? ' editing' : ''}${off ? ' is-off' : ''}" data-sec="${id}">${tools}${body}</div>`; }).join('') + (edit ? `<div class="lay-foot"><button class="lay-btn" data-lay="reset" data-tab="${tab}">${ic('rotate', 14)} Reset this tab’s layout</button></div>` : '');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-lay]'); if (!b) return; e.stopPropagation();
  const tab = b.dataset.tab, a = b.dataset.lay, L = state.layout[tab] || (state.layout[tab] = { order:[], hidden:[] });
  if (a === 'toggle') LAYOUT_EDIT[tab] = !LAYOUT_EDIT[tab];
  else if (a === 'reset'){ delete state.layout[tab]; save(); toast('Layout reset.', 'ok', 1400); }
  else {
    const secs = Array.from(document.querySelectorAll(`#view-${tab} .lay-sec`)).map(s => s.dataset.sec), id = b.dataset.id, i = secs.indexOf(id);
    L.order = secs;
    if (a === 'up' && i > 0) [L.order[i-1], L.order[i]] = [L.order[i], L.order[i-1]];
    if (a === 'down' && i < secs.length-1) [L.order[i+1], L.order[i]] = [L.order[i], L.order[i+1]];
    if (a === 'hide'){ L.hidden = L.hidden || []; L.hidden = L.hidden.includes(id) ? L.hidden.filter(x => x !== id) : [...L.hidden, id]; }
    save();
  }
  renderView(tab);
}, true);

/* ---------- Coach tab: plan, tips and autopilot above the chat ---------- */
function apPlanHTML(){
  const k = dkey(), p = apPlan(), items = p.items, done = items.filter(i => apItemDone(k, i)).length, pct = items.length ? done / items.length : 0;
  return `<section class="glass cp-card">
    <div class="cp-head"><div><div class="h3">Today’s plan</div><div class="tiny">${done} of ${items.length} done · built by autopilot from your schedule and your gaps</div></div>
      <div class="cp-ring" style="--p:${pct.toFixed(3)}"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" pathLength="1"/><circle class="v" cx="22" cy="22" r="18" pathLength="1"/></svg><b class="num">${Math.round(pct*100)}%</b></div></div>
    <ul class="cp-list">${items.map((it, i) => { const on = apItemDone(k, it); return `<li class="cp-item${on ? ' on' : ''}" style="--i:${Math.min(i, 12)}">
      <button class="cp-check" data-cp="tick" data-id="${esc(it.id)}" role="checkbox" aria-checked="${on}" aria-label="${esc(it.t)}"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1"/></svg></button>
      <div class="cp-tx"><b>${esc(it.t)}</b>${it.why ? `<small>${esc(it.why)}${it.carried ? ' · carried over' : ''}</small>` : it.carried ? '<small>Carried over from yesterday</small>' : ''}</div>
      ${it.time ? `<span class="cp-time num">${esc(it.time)}</span>` : ''}
      ${it.go || it.topic ? `<button class="cp-go" data-cp="go" data-id="${esc(it.id)}" aria-label="Open">${ic('arrowRight', 15)}</button>` : ''}
      ${it.src === 'me' ? `<button class="cp-go" data-cp="del" data-id="${esc(it.id)}" aria-label="Delete ${esc(it.t)}">${ic('trash', 15)}</button>` : ''}
    </li>`; }).join('')}</ul>
    <form class="cp-add" data-cp-form><input id="cpNew" maxlength="80" placeholder="Add your own to-do…" aria-label="Add a to-do"><button class="btn btn-primary btn-sm" type="submit">${ic('plus', 15)} Add</button></form>
    <div class="cp-foot"><button class="lay-btn" data-cp="rebuild">${ic('rotate', 14)} Rebuild the plan</button><span class="tiny">Your own unfinished items carry over to tomorrow.</span></div>
  </section>`;
}
const AP_UI = { allTips:false };
function apTipsHTML(){
  const all = apTips(); if (!all.length) return '';
  const t = AP_UI.allTips ? all : all.slice(0, 4);
  return `<div class="h2">Tips from your numbers <span class="side">${all.length}</span></div>
    <div class="cp-tips">${t.map((x, i) => `<div class="glass cp-tip" style="--i:${i}"><span class="ds-it">${ic(x.icon, 16)}</span><p>${esc(x.t)}</p>${x.go && x.b ? `<button class="cp-tgo" data-cp="tipgo" data-go="${x.go}">${esc(x.b)} ${ic('arrowRight', 13)}</button>` : ''}</div>`).join('')}</div>
    ${all.length > 4 ? `<div class="cp-more"><button class="lay-btn" data-cp="moretips">${AP_UI.allTips ? 'Show fewer tips' : `Show ${all.length - 4} more tips`}</button></div>` : ''}`;
}
function apWeekHTML(){ // 7-day wave of task completion
  const vals = []; for (let i = 6; i >= 0; i--){ const k = dkey(addDays(new Date(), -i)); vals.push({ k, v: dayScore(k) }); }
  return `<div class="glass cp-week"><div class="row between"><div><div class="h3">This week’s wave</div><div class="tiny">Share of tasks done each day</div></div><span class="chip">${Math.round(vals.reduce((a, b) => a + b.v, 0) / 7 * 100)}%</span></div>${waveSVG(vals.map(x => x.v), vals.map(x => DAYS[isoWeekday(parseKey(x.k))]), 'cpw')}</div>`;
}
function apAutoHTML(){
  const a = apState(), s2 = ciStatus('2w'), s1 = ciStatus('1m'), when = ts => { const d = new Date(ts); return `${dkey(d) === dkey() ? 'Today' : shortDate(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
  return `<div class="glass cp-auto">
    <div class="row between"><div class="row" style="gap:10px"><span class="ds-it">${ic('robot', 17)}</span><div><div class="h3">Autopilot</div><div class="tiny">${a.on ? 'On · runs when you open the app and every 15 minutes' : 'Off'}</div></div></div>
      <button class="set-tg${a.on ? ' on' : ''}" data-cp="autoon" role="switch" aria-checked="${a.on}" aria-label="Autopilot"><i></i></button></div>
    <div class="cp-next"><span>${ic('calendar', 14)} 2-week check-in: <b>${ciLabel(s2)}</b></span><span>${ic('calendar', 14)} Monthly: <b>${ciLabel(s1)}</b></span></div>
    <ul class="cp-log">${(a.log || []).slice(0, 5).map(l => `<li><span class="num">${when(l.ts)}</span>${esc(l.msg)}</li>`).join('') || '<li>Nothing yet.</li>'}</ul>
    <p class="tiny">The cloud builder also works on the app itself at night and pushes the changes to GitHub. Your logged data never leaves this browser.</p>
  </div>`;
}
function ciLabel(s){ return s.state === 'done' ? 'done ✓' : s.state === 'late' ? 'overdue' : s.left === 0 ? 'due today' : s.state === 'due' ? `due in ${s.left} day${s.left > 1 ? 's' : ''}` : `${shortDate(parseKey(s.p.to))} (${s.left} days)`; }
function apGo(it){
  if (it.topic && typeof kmFindTopic === 'function'){ const t = kmFindTopic(it.topic);
    if (t && t.pack){ window.knowPick = t.pack; learnTab = 'know'; setTab('learn', { force:true }); return; }
    if (t && t.lab){ labPane = t.lab; setTab('lab', { force:true }); setTimeout(() => { try { showLabPane(t.lab); } catch(_){} }, 60); return; }
    if (t && t.learn){ learnTab = t.learn; setTab('learn', { force:true }); return; } }
  if (it.sub) learnTab = it.sub;
  if (it.go && it.go !== activeTab) setTab(it.go, { force:true });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cp]'); if (!b) return; e.stopPropagation();
  const a = b.dataset.cp, k = dkey(), items = apPlan().items, it = items.find(x => x.id === b.dataset.id);
  if (a === 'tick' && it){ const on = !apItemDone(k, it); apSetDone(k, it, on); const li = b.closest('.cp-item'); li.classList.toggle('on', on); b.setAttribute('aria-checked', String(on));
    if (on && !motionOff()) li.classList.add('pop'); setTimeout(() => { const box = document.querySelector('[data-sec="plan"]'); if (box && activeTab === 'coach') { const y = window.scrollY; box.innerHTML = box.querySelector('.lay-tools') ? box.querySelector('.lay-tools').outerHTML + apPlanHTML() : apPlanHTML(); window.scrollTo(0, y); } updateChrome(); }, on && !motionOff() ? 420 : 0); }
  else if (a === 'go' && it) apGo(it);
  else if (a === 'del' && it){ state.coachPlan.items = items.filter(x => x !== it); save(); renderView('coach'); }
  else if (a === 'rebuild'){ const mine = items.filter(x => x.src === 'me'); state.coachPlan = { date:k, items:[...apBuildPlan(k), ...mine] }; apLog('Plan rebuilt by hand.'); save(); renderView('coach'); toast('Plan rebuilt from your latest numbers.', 'ok', 1600); }
  else if (a === 'tipgo') setTab(b.dataset.go, { force:true });
  else if (a === 'moretips'){ AP_UI.allTips = !AP_UI.allTips; renderView('coach'); }
  else if (a === 'autoon'){ const s = apState(); s.on = !s.on; apLog(s.on ? 'Autopilot switched on.' : 'Autopilot switched off.'); save(); if (s.on) apRun('manual'); renderView('coach'); }
}, true);
document.addEventListener('submit', e => {
  if (!e.target.matches('[data-cp-form]')) return; e.preventDefault();
  const i = document.getElementById('cpNew'), t = i.value.trim(); if (!t) return;
  apPlan().items.push({ id:'me-' + uid(), t, src:'me', done:false, time:'' }); save(); renderView('coach');
  setTimeout(() => document.getElementById('cpNew')?.focus(), 30);
}, true);

/* the Coach tab keeps its chat, with the new parts above it (order and visibility are editable) */
const renderCoachChat = renderCoach;
renderCoach = function(){
  return sectionsHTML('coach', [
    ['plan', 'Today’s plan', apPlanHTML],
    ['tips', 'Tips from your numbers', () => apState().tips ? apTipsHTML() : ''],
    ['week', 'This week’s wave', apWeekHTML],
    ['auto', 'Autopilot', apAutoHTML],
    ['chat', 'Chat with your coach', renderCoachChat]
  ]);
};

/* ---------- shared SVG wave chart (smooth curve, gradient fill, drifting swell) ---------- */
function smoothPath(pts){
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++){ const p0 = pts[i-1] || pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2] || p2;
    d += ` C${(p1[0] + (p2[0]-p0[0])/6).toFixed(1)},${(p1[1] + (p2[1]-p0[1])/6).toFixed(1)} ${(p2[0] - (p3[0]-p1[0])/6).toFixed(1)},${(p2[1] - (p3[1]-p1[1])/6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`; }
  return d;
}
function waveSVG(vals, labels, id, prev){
  const W = 320, H = 120, P = 14, n = vals.length, X = i => P + i * (W - 2*P) / Math.max(1, n - 1), Y = v => H - 22 - clamp(v, 0, 1) * (H - 40);
  const pts = vals.map((v, i) => [X(i), Y(v)]), line = smoothPath(pts), area = line + ` L${X(n-1).toFixed(1)},${H-14} L${X(0).toFixed(1)},${H-14} Z`;
  const pv = prev && prev.length === n ? smoothPath(prev.map((v, i) => [X(i), Y(v)])) : '';
  const swell = (y, a) => { let d = `M-320,${y}`; for (let x = -320; x <= 640; x += 40) d += ` Q${x+10},${y-a} ${x+20},${y} T${x+40},${y}`; return d + ` L640,${H} L-320,${H} Z`; };
  return `<svg class="wv-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Wave chart">
    <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--cr-crimson)" stop-opacity=".32"/><stop offset="1" stop-color="var(--cr-crimson)" stop-opacity="0"/></linearGradient>
      <clipPath id="${id}c"><path d="${area}"/></clipPath></defs>
    <g clip-path="url(#${id}c)"><path class="wv-swell s1" d="${swell(H-30, 6)}"/><path class="wv-swell s2" d="${swell(H-24, 4)}"/></g>
    <path d="${area}" fill="url(#${id}g)"/>
    ${pv ? `<path d="${pv}" class="wv-prev"/>` : ''}
    <path d="${line}" class="wv-line" pathLength="1"/>
    ${pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === n-1 ? 3.6 : 2.2}" class="wv-dot${i === n-1 ? ' last' : ''}"/>`).join('')}
    ${labels ? labels.map((l, i) => (n <= 8 || i % Math.ceil(n/7) === 0 || i === n-1) ? `<text x="${X(i).toFixed(1)}" y="${H-2}" text-anchor="middle" class="wv-lbl">${esc(l)}</text>` : '').join('') : ''}
  </svg>`;
}

/* ---------- IELTS exam countdown (Today and Review) ---------- */
function examCountHTML(where){
  const ex = state.settings.examDate, k = dkey();
  if (!ex) return where === 'review' ? `<button class="glass ex-cd ex-none" data-ex="set">${ic('calendar', 16)}<span><b>Set your IELTS exam date</b><small>A countdown and a study plan for the last 60 days appear here.</small></span>${ic('arrowRight', 15)}</button>` : '';
  const dl = daysBetween(k, ex); if (dl < 0) return where === 'review' ? `<button class="glass ex-cd ex-none" data-ex="set">${ic('calendar', 16)}<span><b>Exam day has passed (${shortDate(parseKey(ex))})</b><small>Set the next date or your result.</small></span>${ic('arrowRight', 15)}</button>` : '';
  const created = state.createdAt && state.createdAt < k ? state.createdAt : dkey(addDays(new Date(), -30)), span = Math.max(1, daysBetween(created, ex)), pct = clamp(1 - dl / span, 0, 1);
  const s28 = periodStats(dkey(addDays(new Date(), -27)), k), essays = s28.essays, speak = s28.speaking, wk = Math.max(0, Math.floor(dl / 7));
  const plan = dl === 0 ? 'Today: sleep, breakfast, arrive 30 minutes early. No new material.' : dl <= 7 ? 'Final week: one full timed mock, then light review. Sleep matters more than one more essay.' : dl <= 30 ? 'One full timed mock a week, an essay every other day, speaking every day.' : dl <= 60 ? 'Build up: 3 essays and 4 speaking cards a week, timed.' : 'Steady: 3 essays and 3 speaking cards a week.';
  return `<div class="glass ex-cd ${dl <= 7 ? 'close' : ''}" role="group" aria-label="IELTS countdown">
    <div class="ex-ring" style="--p:${pct.toFixed(3)}"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" pathLength="1"/><circle class="v" cx="32" cy="32" r="27" pathLength="1"/></svg><b class="num">${dl}</b><small>${dl === 1 ? 'day' : 'days'}</small></div>
    <div class="ex-tx"><b>IELTS in ${dl === 0 ? 'today' : dl === 1 ? '1 day' : `${dl} days`}${wk >= 2 ? ` · ${wk} weeks` : ''}</b><small>${prettyDate(parseKey(ex))} · target band ${num(+state.settings.ieltsTarget || 7)}</small><p>${plan}</p>
      <span class="ex-chips"><span>${ic('pen', 13)} ${essays} essay${essays === 1 ? '' : 's'} in 4 weeks</span><span>${ic('mic', 13)} ${speak} speaking</span></span></div>
    <button class="ex-go" data-ex="go" aria-label="Open IELTS practice">${ic('arrowRight', 16)}</button>
  </div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ex]'); if (!b) return; e.stopPropagation();
  if (b.dataset.ex === 'set'){ if (typeof setOpen === 'function') setOpen('goals'); setTimeout(() => document.querySelector('#setOv [data-set="settings.examDate"]')?.focus(), 380); }
  else { learnTab = 'essay'; setTab('learn', { force:true }); }
}, true);

/* ---------- spending by category against the budget lines ---------- */
const CAT_BUDGET = { food:['food'], transport:['trans'], home:['rent'], fun:['fun'], gear:['learn'], life:['shop','misc','phone'] };
function spendByCat(from, to){
  const out = {}; CATS.forEach(c => out[c.id] = 0);
  (state.expenses || []).forEach(e => { if ((e.date || '') >= from && (e.date || '') <= to){ const id = catOf(e.cat).id; out[id] += +e.amount || 0; } });
  return out;
}
function catBudget(id){ return (CAT_BUDGET[id] || []).reduce((a, fid) => a + (+((state.settings.fixed || []).find(f => f.id === fid) || {}).amount || 0), 0); }
function apSpendTip(){
  const now = new Date(), from = dkey(new Date(now.getFullYear(), now.getMonth(), 1)), dim = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate(), frac = now.getDate() / dim;
  const sp = spendByCat(from, dkey()); let worst = null;
  CATS.forEach(c => { const b = catBudget(c.id); if (!b || c.id === 'home') return; const over = sp[c.id] - b * frac; if (over > 10 && (!worst || over > worst.over)) worst = { c, over, spent: sp[c.id], b }; });
  if (!worst) return null;
  return { id:'cat', icon:'cart', t:`${worst.c.name}: ${money0(worst.spent)} spent so far this month against a ${money0(worst.b)} budget. That is ${money0(worst.over)} ahead of pace with ${dim - now.getDate()} days to go.`, go:'money', b:'See spending' };
}

/* ---------- performance: blur only the glass that is on screen ----------
   backdrop-filter costs a re-blur per panel per frame while anything
   animates; panels scrolled out of view get .gl-off (no blur), which
   looks identical because they cannot be seen. */
const GLASS_SEL = '.glass,.lg,.lg-chip';
const glassIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('gl-off', !e.isIntersecting)), { rootMargin:'160px 0px' }) : null;
function glassWatch(root = document){ if (!glassIO) return; root.querySelectorAll(GLASS_SEL).forEach(el => { if (!el.dataset.gw){ el.dataset.gw = '1'; glassIO.observe(el); } }); }
renderView = (orig => function(tab){ const r = orig.apply(this, arguments); try { glassWatch(document.getElementById('view-' + tab) || document); } catch(_){} return r; })(renderView);
new MutationObserver(() => { clearTimeout(glassWatch.t); glassWatch.t = setTimeout(() => glassWatch(document.getElementById('main') || document), 120); }).observe(document.getElementById('main') || document.body, { childList:true, subtree:true });
