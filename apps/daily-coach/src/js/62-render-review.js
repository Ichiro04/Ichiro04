/* ============================================================
   REVIEW TAB · check-ins every 2 weeks and every month
   - Check-in cards with countdown rings; the form fills in the
     period's numbers, a coach's read, 1–5 ratings for six areas,
     three questions and a focus area for the next period.
   - Calendar: month grid coloured by tasks done, dots for
     training, English, money and weight, check-in days marked,
     tap a day to see it and edit its note.
   - Charts: fortnight wave against the last one, focus and daily
     balance cards, balance wheel, completion trend, history.
   ============================================================ */
const CAL = { m: null, sel: null };
const QUOTES = ['Small, boring, repeated. That is the whole method.', 'Less noise, more progress.', 'Stay soft. Stay sharp.', 'The plan only works if you look at it.', 'One good fortnight beats one perfect day.', 'Numbers instead of feelings, then one change.'];

function reviewBadge(){
  const due = ['2w','1m'].some(t => { const s = ciStatus(t); return s.state === 'due' || s.state === 'late'; });
  document.querySelectorAll('[data-tab="review"], .rail-i[data-tab="review"]').forEach(b => b.classList.toggle('has-due', due));
}

/* ---------- check-in cards ---------- */
function ciCardHTML(type){
  const s = ciStatus(type), p = s.p, total = type === '1m' ? p.days : 14, gone = clamp(daysBetween(p.from, dkey()) + 1, 0, total), pct = s.state === 'done' ? 1 : gone / total;
  const draft = state.reviewDraft[type + p.to], tag = { done:['Done','ok'], late:['Overdue','late'], due:[s.left === 0 ? 'Due today' : `Due in ${s.left} day${s.left > 1 ? 's' : ''}`,'due'], open:[`${s.left} days to go`,''] }[s.state];
  return `<div class="glass ci-card ${s.state}" data-tilt><div class="glare"></div>
    <div class="ci-top"><span class="ds-it">${ic('calendar', 17)}</span><div><b>${CI_NAME[type]}</b><small>${shortDate(parseKey(p.from))} – ${shortDate(parseKey(p.to))}</small></div><span class="ci-tag ${tag[1]}">${tag[0]}</span></div>
    <div class="ci-mid"><div class="ci-ring" style="--p:${pct.toFixed(3)}"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="33" pathLength="1"/><circle class="v" cx="40" cy="40" r="33" pathLength="1"/></svg><b class="num">${s.state === 'done' ? '✓' : Math.max(0, s.left)}</b><small>${s.state === 'done' ? 'done' : 'days left'}</small></div>
      <div class="ci-mini">${(() => { const st = periodStats(p.from, p.to); return `<span><b class="num">${st.pct}%</b> tasks</span><span><b class="num">${st.train}</b> sessions</span><span><b class="num">${st.essays + st.speaking}</b> English</span><span><b class="num">${money0(st.saved)}</b> saved</span>`; })()}</div></div>
    <button class="btn ${s.state === 'done' ? 'btn-soft' : 'btn-primary'} ci-go" data-ci="open" data-type="${type}" data-to="${p.to}">${s.state === 'done' ? `${ic('eye', 15)} View check-in` : `${ic('edit', 15)} ${draft && (draft.well || Object.keys(draft.ratings || {}).length) ? 'Carry on' : 'Start check-in'}`}</button>
  </div>`;
}

/* ---------- the coach's read of a period ---------- */
function ciRead(s, pv){
  const out = [], d = (a, b) => a - b;
  out.push(`You finished ${s.pct}% of scheduled tasks${pv && pv.days ? ` (${d(s.pct, pv.pct) >= 0 ? 'up' : 'down'} ${Math.abs(d(s.pct, pv.pct))} points on the period before)` : ''}, with ${s.streakDays} streak day${s.streakDays === 1 ? '' : 's'} out of ${s.days}.`);
  const sc = areaScores(s), best = AREAS.slice().sort((a, b) => sc[b[0]] - sc[a[0]]), lo = best[best.length - 1], hi = best[0];
  out.push(`Strongest area: ${areaLow(hi[1])} (${num(sc[hi[0]])}/5). Weakest: ${areaLow(lo[1])} (${num(sc[lo[0]])}/5).`);
  out.push(s.spent > s.budget ? `Spending was ${money0(s.spent)}, ${money0(s.spent - s.budget)} over the budget for these days.` : `Spending was ${money0(s.spent)}, inside the ${money0(s.budget)} budget for these days.`);
  if (s.weightChange !== null) out.push(`Weight ${s.weightChange <= 0 ? 'down' : 'up'} ${num(Math.abs(s.weightChange))} kg.`);
  out.push(`Suggested focus for the next period: ${areaLow(lo[1])}.`);
  return { text: out.join(' '), focus: lo[0] };
}

/* ---------- check-in form (sheet) ---------- */
function ciFormHTML(type, to){
  const key = type + to, done = (state.reviews || []).find(r => r.type === type && r.to === to), from = done ? done.from : ciPeriod(type, parseKey(to)).from;
  const d = done || state.reviewDraft[key] || (state.reviewDraft[key] = { type, from, to, ratings:{}, well:'', block:'', change:'', focus:'' });
  const s = periodStats(from, to), pv = periodStats(ciPrev({ type, from, to }).from, ciPrev({ type, from, to }).to), read = ciRead(s, pv), sc = areaScores(s);
  const tile = (l, v, sub) => `<div class="ci-n"><small>${l}</small><b class="num">${v}</b>${sub ? `<i>${sub}</i>` : ''}</div>`;
  const delta = (a, b, unit = '') => b === null || b === undefined ? '' : `${a - b >= 0 ? '▲' : '▼'} ${num(Math.abs(a - b))}${unit}`;
  return `<div class="ci-form" data-ci-key="${key}" data-done="${done ? done.id : ''}">
    <p class="tiny">${shortDate(parseKey(from))} to ${shortDate(parseKey(to))} · ${s.days} day${s.days === 1 ? '' : 's'}${to >= dkey() ? ' so far' : ''}. The numbers fill themselves in.</p>
    <div class="ci-nums">${tile('Tasks done', s.pct + '%', delta(s.pct, pv.days ? pv.pct : null, ' pts'))}${tile('Streak days', s.streakDays, '')}${tile('Training', s.train, delta(s.train, pv.days ? pv.train : null))}${tile('Essays · speaking', `${s.essays} · ${s.speaking}`, '')}${tile('Packs read', s.packs, '')}${tile('Focused time', `${num(s.focus / 60)}h`, '')}${tile('Saved', money0(s.saved), '')}${tile('Spent', money0(s.spent), `budget ${money0(s.budget)}`)}${tile('Sleep', s.sleepAvg ? `${Math.floor(s.sleepAvg / 60)}h ${Math.round(s.sleepAvg % 60)}m` : '—', '')}${tile('Weight', s.weightChange === null ? '—' : `${s.weightChange > 0 ? '+' : ''}${num(s.weightChange)} kg`, '')}</div>
    <div class="ci-read"><span class="ds-it">${ic('sparkle', 15)}</span><p>${esc(read.text)}</p></div>
    ${type === '1m' ? moneyMonthHTML(from, to, s) : ''}
    <div class="h3" style="margin-top:14px">How did each area go?</div><p class="tiny">1 = badly, 5 = very well. The dot shows what your numbers say.</p>
    <div class="ci-rates">${AREAS.map(([id, name, icon]) => `<div class="ci-rate"><span>${ic(icon, 15)} ${name}</span><div class="ci-dots" role="radiogroup" aria-label="${name}">${[1,2,3,4,5].map(n => `<button role="radio" aria-checked="${d.ratings[id] === n}" class="${d.ratings[id] >= n ? 'on' : ''}${Math.round(sc[id]) === n ? ' auto' : ''}" data-ci="rate" data-id="${id}" data-v="${n}">${n}</button>`).join('')}</div></div>`).join('')}</div>
    <label class="ci-q"><b>What went well?</b><textarea data-ci-f="well" rows="2" placeholder="One or two things you are proud of">${esc(d.well)}</textarea></label>
    <label class="ci-q"><b>What got in the way?</b><textarea data-ci-f="block" rows="2" placeholder="Be specific: a time, a place, a habit">${esc(d.block)}</textarea></label>
    <label class="ci-q"><b>One change for the next ${type === '1m' ? 'month' : 'two weeks'}</b><textarea data-ci-f="change" rows="2" placeholder="Small enough to start tomorrow">${esc(d.change)}</textarea></label>
    <div class="h3" style="margin-top:12px">Focus area</div><p class="tiny">The autopilot adds one daily item for it. Suggested: ${esc(AREAS.find(a => a[0] === read.focus)[1])}.</p>
    <div class="ci-focus">${AREAS.map(([id, name, icon]) => `<button class="${(d.focus || read.focus) === id ? 'on' : ''}" data-ci="focus" data-id="${id}">${ic(icon, 14)} ${name}</button>`).join('')}</div>
    <div class="ci-acts">${done ? `<button class="btn btn-soft" data-ci="delete" data-id="${done.id}">${ic('trash', 15)} Delete</button><button class="btn btn-soft" data-ci="copy" data-id="${done.id}">${ic('edit', 15)} Copy as text</button>` : ''}<button class="btn btn-primary" data-ci="save">${ic('check', 15)} ${done ? 'Save changes' : 'Finish check-in'}</button></div>
  </div>`;
}
function ciDraftOf(form){ const key = form.dataset.ciKey, id = form.dataset.done; return id ? state.reviews.find(r => r.id === id) : state.reviewDraft[key]; }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ci]'); if (!b) return; e.stopPropagation();
  const a = b.dataset.ci, form = b.closest('.ci-form');
  if (a === 'open'){ openSheet({ title: CI_NAME[b.dataset.type], body: ciFormHTML(b.dataset.type, b.dataset.to) }); document.getElementById('sheet').classList.add('ci-sheet'); return; }
  if (!form) return; const d = ciDraftOf(form); if (!d) return;
  if (a === 'rate'){ d.ratings[b.dataset.id] = +b.dataset.v; save(); b.parentNode.querySelectorAll('button').forEach(x => { const n = +x.dataset.v; x.classList.toggle('on', n <= +b.dataset.v); x.setAttribute('aria-checked', String(n === +b.dataset.v)); }); }
  else if (a === 'focus'){ d.focus = b.dataset.id; save(); b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }
  else if (a === 'save'){
    const s = periodStats(d.from, d.to), read = ciRead(s, periodStats(ciPrev(d).from, ciPrev(d).to));
    const rec = { ...d, id: d.id || uid(), date: d.date || dkey(), nums: { pct:s.pct, train:s.train, essays:s.essays, speaking:s.speaking, packs:s.packs, focus:Math.round(s.focus), saved:s.saved, spent:s.spent, sleep:s.sleepAvg ? Math.round(s.sleepAvg) : null, weight:s.weightChange }, auto: areaScores(s), coach: read.text, focus: d.focus || read.focus };
    if (!d.id){ state.reviews.push(rec); delete state.reviewDraft[form.dataset.ciKey]; } else Object.assign(d, rec);
    state.focusArea = rec.focus; apLog(`${CI_NAME[rec.type]} saved. Focus: ${areaLow(AREAS.find(x => x[0] === rec.focus)[1])}.`);
    if (state.coachPlan) state.coachPlan.date = ''; save(); closeSheet(); toast('Check-in saved. Your plan now follows the new focus.', 'ok', 2200); renderView(activeTab); reviewBadge();
  }
  else if (a === 'copy'){ const r = state.reviews.find(x => x.id === b.dataset.id); if (!r) return; const txt = ciText(r);
    const ok = () => toast('Copied. Paste it into your notes.', 'ok', 1800);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, () => ciCopyFallback(txt, ok)); else ciCopyFallback(txt, ok); }
  else if (a === 'delete'){ state.reviews = state.reviews.filter(r => r.id !== b.dataset.id); save(); closeSheet(); renderView(activeTab); toast('Check-in deleted.', 'ok', 1400); }
}, true);
document.addEventListener('input', e => { const f = e.target.closest('[data-ci-f]'); if (!f) return; const d = ciDraftOf(f.closest('.ci-form')); if (!d) return; d[f.dataset.ciF] = f.value.slice(0, 600); clearTimeout(CAL.t); CAL.t = setTimeout(save, 400); });

/* ---------- calendar ---------- */
function calHTML(){
  const today = new Date(); if (!CAL.m) CAL.m = new Date(today.getFullYear(), today.getMonth(), 1); if (!CAL.sel) CAL.sel = dkey();
  const m = CAL.m, first = startOfWeek(m), last = new Date(m.getFullYear(), m.getMonth()+1, 0), cells = [];
  const due = new Set(); [ciPeriod('2w', m), ciPeriod('2w', addDays(m, 14)), ciPeriod('2w', addDays(m, 28)), ciPeriod('1m', m)].forEach(p => due.add(p.to));
  const revDays = new Set((state.reviews || []).map(r => r.date));
  for (let d = new Date(first); d <= last || isoWeekday(d) !== 0; d = addDays(d, 1)){
    const k = dkey(d), inM = d.getMonth() === m.getMonth(), fut = k > dkey(), r = dayRec(k), n = countDone(k), tot = tasksForDay(k).length, lvl = fut || !tot ? 0 : Math.ceil(n / tot * 4);
    const dots = [ (taskDone(k,'train') || sessionDonePct(k) >= 80) && 'tr', (taskDone(k,'essay') || taskDone(k,'speaking')) && 'en', (state.savings || []).some(s => s.date === k) && 'mo', +r.weight > 0 && 'wt' ].filter(Boolean);
    cells.push(`<button class="cal-d l${lvl}${inM ? '' : ' out'}${k === dkey() ? ' today' : ''}${k === CAL.sel ? ' sel' : ''}${due.has(k) ? ' due' : ''}${revDays.has(k) ? ' rev' : ''}" data-cal="pick" data-k="${k}" aria-label="${prettyDate(d)}: ${n} of ${tot} tasks">
      <span class="num">${d.getDate()}</span><i class="cal-dots">${dots.map(x => `<b class="${x}"></b>`).join('')}</i></button>`);
  }
  return `<div class="glass cal">
    <div class="cal-h"><button class="cal-nav" data-cal="prev" aria-label="Previous month">${ic('back', 16)}</button><div><b>${MONTHS[m.getMonth()]} ${m.getFullYear()}</b><small>${(() => { const s = periodStats(dkey(m), dkey(last)); return `${s.pct}% of tasks · ${s.streakDays} streak day${s.streakDays === 1 ? '' : 's'}`; })()}</small></div><button class="cal-nav nx" data-cal="next" aria-label="Next month">${ic('back', 16)}</button></div>
    <div class="cal-w">${DAYS.map(x => `<span>${x}</span>`).join('')}</div>
    <div class="cal-g">${cells.join('')}</div>
    <div class="cal-leg"><span><b class="tr"></b>Training</span><span><b class="en"></b>English</span><span><b class="mo"></b>Saved</span><span><b class="wt"></b>Weight</span><span><i class="ring"></i>Check-in day</span></div>
    <div class="cal-day" id="calDay">${calDayHTML(CAL.sel)}</div>
  </div>`;
}
function calDayHTML(k){
  const r = dayRec(k), d = parseKey(k), list = tasksForDay(k), sl = sleepMins(r), sp = (state.expenses || []).filter(e => e.date === k).reduce((a, e) => a + (+e.amount || 0), 0), sv = (state.savings || []).filter(s => s.date === k).reduce((a, s) => a + (+s.amount || 0), 0);
  return `<div class="cal-dh"><b>${prettyDate(d)}</b><span class="chip">${countDone(k)}/${list.length} tasks</span></div>
    <div class="cal-tasks">${list.map(t => k > dkey() ? `<span>${ic(t.icon, 13)} ${esc(t.name)}</span>` : `<button class="${taskDone(k, t.id) ? 'on' : ''}" data-cal="task" data-k="${k}" data-id="${t.id}" aria-pressed="${taskDone(k, t.id)}">${ic(taskDone(k, t.id) ? 'check' : t.icon, 13)} ${esc(t.name)}</button>`).join('') || '<span>No tasks scheduled</span>'}</div>
    ${k <= dkey() && list.length ? '<p class="tiny cal-hint">Tap a task to fix a missed log for this day.</p>' : ''}
    <div class="cal-facts"><span>${ic('clock', 13)} ${num(focusOf(k) / 60)}h focused</span><span>${ic('moon', 13)} ${sl ? `${Math.floor(sl / 60)}h ${sl % 60}m sleep` : 'no sleep logged'}</span><span>${ic('steps', 13)} ${(+r.steps || 0).toLocaleString('en-GB')} steps</span><span>${ic('cart', 13)} ${money(sp)} spent</span>${sv ? `<span>${ic('piggy', 13)} ${money(sv)} saved</span>` : ''}${+r.weight > 0 ? `<span>${ic('scale', 13)} ${num(r.weight)} kg</span>` : ''}</div>
    <label class="cal-note"><small>Note for this day</small><textarea data-cal-note="${k}" rows="2" placeholder="What happened, what you learned">${esc(r.note || '')}</textarea></label>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cal]'); if (!b) return; e.stopPropagation();
  const a = b.dataset.cal;
  if (a === 'pick'){ CAL.sel = b.dataset.k; document.querySelectorAll('.cal-d.sel').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); const box = document.getElementById('calDay'); if (box){ box.innerHTML = calDayHTML(CAL.sel); box.classList.remove('in'); void box.offsetWidth; box.classList.add('in'); } return; }
  if (a === 'task'){ const k = b.dataset.k, id = b.dataset.id, on = !taskDone(k, id); setTask(k, id, on); save();
    const t = TASK_DEFS.find(x => x.id === id); toast(`${t ? t.name : 'Task'} ${on ? 'ticked' : 'unticked'} for ${shortDate(parseKey(k))}.`, 'ok', 1600);
    const sec = b.closest('.lay-sec'); if (sec){ const tools = sec.querySelector('.lay-tools'); sec.innerHTML = (tools ? tools.outerHTML : '') + calHTML(); }
    else { const card = b.closest('.cal'); if (card) card.outerHTML = calHTML(); }
    updateChrome(); return; }
  CAL.m = new Date(CAL.m.getFullYear(), CAL.m.getMonth() + (a === 'next' ? 1 : -1), 1);
  const sec = b.closest('.lay-sec'); if (sec){ const tools = sec.querySelector('.lay-tools'); sec.innerHTML = (tools ? tools.outerHTML : '') + calHTML(); }
  else { const card = b.closest('.cal'); if (card) card.outerHTML = calHTML(); }
}, true);
document.addEventListener('input', e => { const t = e.target.closest('[data-cal-note]'); if (!t) return; const r = dayRec(t.dataset.calNote, true); r.note = t.value.slice(0, 600); clearTimeout(CAL.nt); CAL.nt = setTimeout(save, 400); });

/* ---------- pulse: this fortnight against the last ---------- */
function pulseHTML(){
  const p = ciPeriod('2w'), pv = ciPrev(p), s = periodStats(p.from, p.to), ps = periodStats(pv.from, pv.to);
  const vals = [], prev = [], labels = [];
  for (let i = 0; i < 14; i++){ const k = dkey(addDays(parseKey(p.from), i)), kp = dkey(addDays(parseKey(pv.from), i)); if (k > dkey()) break; vals.push(dayScore(k)); prev.push(dayScore(kp)); labels.push(DAYS[isoWeekday(parseKey(k))].slice(0, 1)); }
  const bars = []; for (let i = 13; i >= 0; i--){ const k = dkey(addDays(new Date(), -i)); bars.push(focusOf(k)); }
  const mx = Math.max(60, ...bars), avgH = bars.reduce((a, b) => a + b, 0) / 14;
  const cmp = (l, a, b, f = v => v) => `<div class="glass pl-stat"><small>${l}</small><b class="num">${f(a)}</b><i class="${a >= b ? 'up' : 'dn'}">${ps.days ? `${a >= b ? '▲' : '▼'} ${f(Math.abs(a - b))} vs last` : 'first period'}</i></div>`;
  return `<div class="h2">This fortnight <span class="side">${shortDate(parseKey(p.from))} – ${shortDate(parseKey(p.to))}</span></div>
    <div class="pl-grid">
      <div class="glass pl-focus"><small>Tasks done</small><b class="num">${s.pct}%</b>${waveSVG(vals.length > 1 ? vals : [0, vals[0] || 0], vals.length > 1 ? labels : null, 'plw', vals.length > 1 ? prev.slice(0, vals.length) : null)}<span class="tiny">Line = this fortnight · dashes = the one before</span></div>
      <div class="glass pl-bal"><small>Daily balance</small><b class="num">${Math.floor(avgH / 60)}h ${Math.round(avgH % 60)}m</b><span class="tiny">of focused work a day, last 14 days</span>
        <div class="pl-bars">${bars.map((v, i) => `<i style="--h:${(v / mx).toFixed(3)};--i:${i}"></i>`).join('')}</div></div>
    </div>
    <div class="pl-stats">${cmp('Training sessions', s.train, ps.train)}${cmp('English tasks', s.essays + s.speaking, ps.essays + ps.speaking)}${cmp('Packs read', s.packs, ps.packs)}${cmp('Saved', s.saved, ps.saved, money0)}</div>`;
}
/* ---------- balance wheel (radar) ---------- */
function wheelHTML(){
  const p = ciPeriod('2w'), s = periodStats(p.from, p.to), auto = areaScores(s), last = (state.reviews || []).slice(-1)[0];
  const R = 92, C = 120, n = AREAS.length, pt = (i, v) => { const a = -Math.PI/2 + i * 2*Math.PI/n; return [C + Math.cos(a) * R * v/5, C + Math.sin(a) * R * v/5]; };
  const poly = vals => AREAS.map((x, i) => pt(i, vals[x[0]] || 0).map(v => v.toFixed(1)).join(',')).join(' ');
  return `<div class="glass wh"><div class="row between"><div><div class="h3">Balance wheel</div><div class="tiny">Filled = what your numbers say now${last ? ' · line = how you rated your last check-in' : ''}</div></div></div>
    <svg viewBox="0 0 240 240" class="wh-svg" role="img" aria-label="Balance wheel">
      ${[1,2,3,4,5].map(l => `<polygon class="wh-grid" points="${AREAS.map((x, i) => pt(i, l).map(v => v.toFixed(1)).join(',')).join(' ')}"/>`).join('')}
      ${AREAS.map((x, i) => { const [x2, y2] = pt(i, 5); return `<line class="wh-axis" x1="${C}" y1="${C}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`; }).join('')}
      <polygon class="wh-auto" points="${poly(auto)}"/>
      ${last ? `<polygon class="wh-me" points="${poly(last.ratings || {})}"/>` : ''}
      ${AREAS.map((x, i) => { const [lx, ly] = pt(i, 6.15); return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" class="wh-lbl">${x[1].replace(' and health', '')}</text>`; }).join('')}
    </svg>
    <div class="wh-list">${AREAS.map(([id, name, icon]) => `<span>${ic(icon, 13)} ${name} <b class="num">${num(auto[id])}</b></span>`).join('')}</div></div>`;
}
/* ---------- trend over fortnights ---------- */
function trendHTML(){
  const cols = []; let p = ciPeriod('2w');
  for (let i = 0; i < 6; i++){ const s = periodStats(p.from, p.to); cols.unshift({ p, s, done: ciDone(p) }); p = ciPrev(p); }
  return `<div class="glass rv-tr"><div class="h3">Fortnight trend</div><div class="tiny">Share of tasks done in each 2-week period · ✓ = check-in done</div>
    <div class="tr-bars">${cols.map((c, i) => `<div class="tr-col${i === 5 ? ' now' : ''}"><b class="num">${c.s.days ? c.s.pct + '%' : '–'}</b><i style="--h:${(c.s.pct / 100).toFixed(3)};--i:${i}"></i><small>${shortDate(parseKey(c.p.from))}${c.done ? ' ✓' : ''}</small></div>`).join('')}</div></div>`;
}
/* ---------- history ---------- */
function historyHTML(){
  const list = (state.reviews || []).slice().sort((a, b) => b.to < a.to ? -1 : 1);
  return `<div class="h2">Past check-ins <span class="side">${list.length}</span></div>
    ${list.length ? `<div class="hi-list">${list.map(r => `<button class="glass hi-row" data-ci="open" data-type="${r.type}" data-to="${r.to}"><span class="ds-it">${ic('calendar', 15)}</span><div><b>${CI_NAME[r.type]} · ${shortDate(parseKey(r.from))} – ${shortDate(parseKey(r.to))}</b><small>${r.nums ? `${r.nums.pct}% tasks · ${r.nums.train} sessions · ${money0(r.nums.saved)} saved` : ''}${r.change ? ` · change: ${esc(r.change.slice(0, 60))}` : ''}</small></div>${ic('arrowRight', 15)}</button>`).join('')}</div>`
      : `<div class="glass card tiny" style="padding:16px">Your finished check-ins will appear here, newest first. The first 2-week check-in is due ${shortDate(parseKey(ciPeriod('2w').to))}.</div>`}`;
}
function quoteHTML(){ const q = QUOTES[Math.floor(Date.now() / 864e5) % QUOTES.length]; return `<div class="glass qt"><span class="qt-mark">${ic('quote', 26)}</span><p>${esc(q)}</p><i></i></div>`; }

function renderReview(){
  setTimeout(reviewBadge, 0);
  return `<div class="rv">` + sectionsHTML('review', [
    ['due', 'Check-ins', () => `<div class="ci-row">${ciCardHTML('2w')}${ciCardHTML('1m')}</div>`],
    ['exam', 'IELTS countdown', () => examCountHTML('review')],
    ['pulse', 'This fortnight', pulseHTML],
    ['cal', 'Calendar', calHTML],
    ['wheel', 'Balance wheel', wheelHTML],
    ['trend', 'Fortnight trend', trendHTML],
    ['history', 'Past check-ins', historyHTML],
    ['quote', 'Quote', quoteHTML]
  ]) + `</div>`;
}

/* ---------- money month (monthly check-in) ---------- */
function moneyMonthHTML(from, to, s){
  const sp = spendByCat(from, to), top = CATS.map(c => ({ c, v: sp[c.id], b: catBudget(c.id) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 3);
  const total = savedTotal(), goal = +state.settings.goal || 25000, left = Math.max(0, goal - total), need = needPerMonth(), pace = s.saved;
  const months = pace > 0 ? Math.ceil(left / pace) : null, mx = Math.max(1, ...top.map(x => Math.max(x.v, x.b)));
  return `<div class="mm"><div class="h3">Money month</div>
    <div class="mm-row"><div class="ci-n"><small>Saved this month</small><b class="num">${money0(s.saved)}</b><i>${pace >= need ? 'on plan' : `${money0(need - pace)} under the plan`}</i></div>
      <div class="ci-n"><small>Spent this month</small><b class="num">${money0(s.spent)}</b><i>budget ${money0(fixedTotal())}</i></div>
      <div class="ci-n"><small>Towards ${money0(goal)}</small><b class="num">${money0(total)}</b><i>${months ? `about ${months} month${months === 1 ? '' : 's'} at this pace` : 'start saving to see a date'}</i></div></div>
    ${top.length ? `<div class="mm-bars">${top.map(x => `<div class="mm-b"><span>${esc(x.c.name)}</span><i><b style="--w:${(x.v / mx).toFixed(3)}"></b>${x.b ? `<u style="--w:${(x.b / mx).toFixed(3)}"></u>` : ''}</i><em class="num">${money0(x.v)}${x.b ? ` / ${money0(x.b)}` : ''}</em></div>`).join('')}</div><p class="tiny">Top 3 categories · the line marks the budget</p>` : '<p class="tiny">No spending logged this month.</p>'}
  </div>`;
}
function ciText(r){
  const n = r.nums || {}, rate = AREAS.map(([id, name]) => `${name} ${r.ratings && r.ratings[id] ? r.ratings[id] : '–'}/5`).join(', ');
  return [`${CI_NAME[r.type]}: ${shortDate(parseKey(r.from))} – ${shortDate(parseKey(r.to))}`,
    `Tasks ${n.pct}% · training ${n.train} · essays ${n.essays} · speaking ${n.speaking} · packs ${n.packs} · saved ${money0(n.saved || 0)} · spent ${money0(n.spent || 0)}`,
    `Ratings: ${rate}`, r.well ? `Went well: ${r.well}` : '', r.block ? `Got in the way: ${r.block}` : '', r.change ? `One change: ${r.change}` : '',
    `Focus next: ${(AREAS.find(a => a[0] === r.focus) || [, '–'])[1]}`, r.coach ? `Coach: ${r.coach}` : ''].filter(Boolean).join('\n');
}
function ciCopyFallback(txt, ok){ const t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch(_){ toast('Could not copy here. Select the text and copy it by hand.', 'warn', 2600); } t.remove(); }
