/* ============================================================
   WIDE SCREENS · no empty landscape beside the content
   - The page uses the full width beside the rail (wide.css).
   - Train, Learn, Money and Progress get an "insight column":
     extra charts and trackers from his own data. On narrow
     screens it sits under the main content instead.
   - Coach and Review lay their sections out in columns.
   ============================================================ */
const SIDE_TABS = { train: trainSideHTML, learn: learnSideHTML, money: moneySideHTML, progress: progressSideHTML };

renderView = (orig => function(tab){
  const r = orig.apply(this, arguments), f = SIDE_TABS[tab], el = document.getElementById('view-' + tab);
  if (!f || !el) return r;
  let side = ''; try { side = f(); } catch(err){ console.warn('side', tab, err); return r; }
  const main = document.createElement('div'); main.className = 'xl-main' + (el.classList.contains('wide') ? ' xl-flex' : '');
  while (el.firstChild) main.appendChild(el.firstChild);
  if (tab === 'progress'){ try { main.insertAdjacentHTML('afterbegin', progressDashHTML()); } catch(err){ console.warn('dash', err); } }
  el.appendChild(main); el.insertAdjacentHTML('beforeend', `<aside class="xl-side" aria-label="More for ${tab}">${side}</aside>`); el.classList.add('xl');
  if (tab === 'progress') stxMount();
  try { if (typeof glassWatch === 'function') glassWatch(el); } catch(_){}
  return r;
})(renderView);

const sideCard = (title, sub, body, cls = '') => `<section class="glass xs-card ${cls}"><div class="xs-h"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>${body}</section>`;
const lastDays = n => Array.from({ length:n }, (_, i) => dkey(addDays(new Date(), i - n + 1)));
function heatWeeks(weeks, test){ // grid of the last N weeks, Monday first, test(k) → 0..4
  const start = addDays(startOfWeek(), -7 * (weeks - 1)); let h = '';
  for (let w = 0; w < weeks; w++) for (let d = 0; d < 7; d++){ const dt = addDays(start, w*7 + d), k = dkey(dt), fut = dt > new Date(); h += `<i class="xh l${fut ? 0 : test(k)}${fut ? ' fut' : ''}" title="${shortDate(dt)}"></i>`; }
  return `<div class="xheat" style="--w:${weeks}">${h}</div>`;
}
function miniBars(vals, labels, fmt = v => v, hi = -1){
  const mx = Math.max(1e-9, ...vals);
  return `<div class="xbars">${vals.map((v, i) => `<div class="xb${i === hi ? ' hi' : ''}"><em class="num">${v ? fmt(v) : ''}</em><i style="--h:${(v / mx).toFixed(3)};--i:${i}"></i><small>${esc(labels[i])}</small></div>`).join('')}</div>`;
}

/* ---------- Train ---------- */
function trainSideHTML(){
  const ws = startOfWeek(), today = dkey();
  const week = DAYS.map((d, i) => { const dt = addDays(ws, i), k = dkey(dt), s = todaysSession(dt), pct = sessionDonePct(k), fut = k > today;
    const st = s.id === 'REST' ? 'rest' : fut ? 'fut' : pct >= 80 || taskDone(k, 'train') || taskDone(k, 'mobility') ? 'done' : pct > 0 ? 'part' : k === today ? 'now' : 'miss';
    return `<div class="xw ${st}${k === today ? ' today' : ''}"><small>${d}</small><b>${s.id === 'REST' ? '–' : s.id === 'WALK' ? 'W' : s.id}</b><i>${st === 'done' ? '✓' : st === 'part' ? Math.round(pct) + '%' : ''}</i></div>`; }).join('');
  const tm = addDays(new Date(), 1), next = todaysSession(tm);
  const trained = k => (sessionDonePct(k) >= 80 || taskDone(k, 'train')) ? 4 : (taskDone(k, 'mobility') || taskDone(k, 'walk')) ? 2 : sessionDonePct(k) > 0 ? 1 : 0;
  const s28 = periodStats(dkey(addDays(new Date(), -27)), today), ws8 = weightSeries().slice(-10);
  const wTxt = ws8.length >= 2 ? `${num(ws8[0].kg)} → ${num(ws8[ws8.length-1].kg)} kg` : ws8.length ? `${num(ws8[0].kg)} kg` : 'No weigh-ins yet';
  const wMin = Math.min(...ws8.map(w => w.kg), +state.profile.weightTarget || 72), wMax = Math.max(...ws8.map(w => w.kg), +state.profile.weightStart || 81);
  return sideCard('This week', 'Sessions planned and done', `<div class="xweek">${week}</div><div class="xleg"><span><i class="done"></i>Done</span><span><i class="part"></i>Started</span><span><i class="miss"></i>Missed</span></div>`)
    + sideCard('Tomorrow', DAYS_LONG[isoWeekday(tm)], `<div class="xnext"><span class="ds-it">${ic(next.id === 'REST' ? 'moon' : next.id === 'WALK' ? 'steps' : 'dumbbell', 17)}</span><div><b>${esc(next.day || 'Rest day')}</b><small>${next.blocks && next.blocks.length ? `${next.blocks.length} exercises · ${next.mins || 30} min` : 'Recovery: sleep, stretch, an easy walk'}</small></div></div>${next.blocks && next.blocks.length ? `<ul class="xlist">${next.blocks.slice(0, 7).map(b => `<li>${esc((EX[b.ex] || {}).name || b.ex)}<span class="num">${b.sets}×</span></li>`).join('')}</ul>` : ''}`)
    + sideCard('Last 8 weeks', `${s28.train} sessions in the last 4 weeks`, heatWeeks(8, trained) + `<div class="xleg"><span><i class="l2"></i>Walk or mobility</span><span><i class="l4"></i>Strength</span></div>`)
    + sideCard('Bodyweight', wTxt, ws8.length >= 2 ? waveSVG(ws8.map(w => 1 - (w.kg - wMin) / Math.max(.1, wMax - wMin)), ws8.map(w => shortDate(parseKey(w.date)).split(' ')[0]), 'xbw') + `<p class="tiny">Higher line = closer to ${state.profile.weightTarget} kg.</p>` : `<p class="tiny">Weigh in on Monday mornings and the trend appears here.</p><button class="lay-btn" data-xs="go" data-go="progress">${ic('scale', 14)} Log weight</button>`);
}

/* ---------- Learn ---------- */
function learnSideHTML(){
  const today = dkey(), s30 = periodStats(dkey(addDays(new Date(), -29)), today), know = state.knowledge || {};
  const eng = k => (taskDone(k, 'essay') ? 2 : 0) + (taskDone(k, 'speaking') ? 1 : 0) + (taskDone(k, 'vocab') ? 1 : 0);
  const vocab = lastDays(30).filter(k => taskDone(k, 'vocab')).length;
  const packs = KNOWLEDGE_PACKS.map(p => `<button class="xpk${know[p.id] ? ' on' : ''}" data-xs="pack" data-id="${p.id}" title="${esc(p.title)}"><span>${know[p.id] ? ic('check', 13) : ''}</span><small>${esc(p.title.split(/[:,(]| and /)[0].trim())}</small></button>`).join('');
  const readN = KNOWLEDGE_PACKS.filter(p => know[p.id]).length;
  return (typeof examCountHTML === 'function' ? examCountHTML('review') : '')
    + sideCard('English, last 30 days', `Target band ${num(+state.settings.ieltsTarget || 7)}`, `<div class="xnums"><div><b class="num">${s30.essays}</b><small>essays</small></div><div><b class="num">${s30.speaking}</b><small>speaking</small></div><div><b class="num">${vocab}</b><small>vocab days</small></div></div>${heatWeeks(6, k => Math.min(4, eng(k)))}`)
    + sideCard('Knowledge packs', `${readN} of ${KNOWLEDGE_PACKS.length} read · tap one to open it`, `<div class="xpks">${packs}</div><div class="pbar" style="margin-top:10px"><i style="width:${(readN / KNOWLEDGE_PACKS.length * 100).toFixed(0)}%"></i></div>`)
    + sideCard('Today’s pack', '', (() => { const doy = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 864e5), p = KNOWLEDGE_PACKS[doy % KNOWLEDGE_PACKS.length]; return `<b class="xq">${esc(p.title)}</b><p class="tiny">${esc(p.ask)}</p><button class="lay-btn" data-xs="pack" data-id="${p.id}">${ic('book', 14)} Open the pack</button>`; })());
}

/* ---------- Money ---------- */
function moneySideHTML(){
  const now = new Date(), dim = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate(), m0 = new Date(now.getFullYear(), now.getMonth(), 1);
  const daily = [], cum = []; let run = 0;
  for (let d = 1; d <= now.getDate(); d++){ const k = dkey(new Date(now.getFullYear(), now.getMonth(), d)), v = (state.expenses || []).filter(e => e.date === k).reduce((a, e) => a + (+e.amount || 0), 0); daily.push(v); run += v; cum.push(run); }
  const flexBudget = Math.max(1, (CAT_BUDGET ? ['food','transport','fun','gear','life'].reduce((a, c) => a + catBudget(c), 0) : 400));
  const months = [], mLabels = []; for (let i = 5; i >= 0; i--){ const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push(spentMonth(d)); mLabels.push(MONTHS[d.getMonth()].slice(0, 3)); }
  const sv = (state.savings || []).slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')); let acc = +state.settings.opening || 0; const svPts = sv.map(s => (acc += +s.amount || 0));
  const goal = +state.settings.goal || 25000, sp = spendByCat(dkey(m0), dkey()), cats = CATS.map(c => ({ c, v: sp[c.id] })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const tot = cats.reduce((a, x) => a + x.v, 0) || 1; let ang = 0;
  const donut = cats.length ? `<svg viewBox="0 0 120 120" class="xdonut">${cats.map((x, i) => { const a0 = ang, a1 = ang + x.v / tot * Math.PI * 2; ang = a1; const r = 46, p = a => [60 + Math.sin(a) * r, 60 - Math.cos(a) * r], [x0, y0] = p(a0), [x1, y1] = p(a1 - .0001);
      return `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)}" class="xd${i % 5}"/>`; }).join('')}<text x="60" y="58" text-anchor="middle" class="xdt num">${money0(tot)}</text><text x="60" y="74" text-anchor="middle" class="xds">this month</text></svg>
      <div class="xdleg">${cats.map((x, i) => `<span><i class="xd${i % 5}"></i>${esc(x.c.name)}<b class="num">${Math.round(x.v / tot * 100)}%</b></span>`).join('')}</div>` : '<p class="tiny">No spending logged this month.</p>';
  return sideCard('Spending this month', `${money0(run)} so far · ${money0(flexBudget)} flexible budget`, cum.length > 1 ? waveSVG(cum.map(v => Math.min(1, v / flexBudget)), cum.map((_, i) => String(i + 1)), 'xmc') + `<p class="tiny">Running total against the flexible budget (top of the chart = budget).</p>` : '<p class="tiny">The chart starts on day 2 of the month.</p>')
    + sideCard('Where it went', 'Share of this month’s spending', `<div class="xdwrap">${donut}</div>`)
    + sideCard('Last 6 months', 'Total spent each month', miniBars(months, mLabels, money0, 5))
    + sideCard('Savings over time', `${money0(savedTotal())} of ${money0(goal)} · top of the chart = today`, svPts.length >= 2 ? waveSVG(svPts.map(v => v / Math.max(...svPts)), sv.map(s => shortDate(parseKey(s.date)).split(' ')[0]), 'xsv') : `<p class="tiny">Each deposit you add draws the line towards ${money0(goal)}.</p><button class="lay-btn" data-a="add-saving">${ic('piggy', 14)} Add to savings</button>`);
}

/* ---------- Progress ---------- */
function progressSideHTML(){
  const days = lastDays(28).filter(k => k >= (state.createdAt || '')), rows = {};
  days.forEach(k => tasksForDay(k).forEach(t => { const r = rows[t.id] || (rows[t.id] = { t, n:0, d:0 }); r.n++; if (taskDone(k, t.id)) r.d++; }));
  const habits = Object.values(rows).sort((a, b) => b.d / b.n - a.d / a.n);
  const wk = []; const wl = []; for (let i = 7; i >= 0; i--){ const from = addDays(startOfWeek(), -7 * i); const s = periodStats(dkey(from), dkey(addDays(from, 6))); wk.push(s.pct); wl.push(shortDate(from).split(' ')[0]); }
  const fs = lastDays(14).map(k => focusOf(k) / 60), slp = lastDays(14).map(k => (sleepMins(dayRec(k)) || 0) / 60);
  return sideCard('Habit strength', 'Last 4 weeks, each task', habits.length ? `<div class="xhab">${habits.map(h => { const p = h.d / h.n; return `<div class="xhb"><span>${ic(h.t.icon, 13)} ${esc(h.t.name)}</span><i><b style="--w:${p.toFixed(3)}" class="${p >= .8 ? 'good' : p < .4 ? 'low' : ''}"></b></i><em class="num">${Math.round(p * 100)}%</em></div>`; }).join('')}</div>` : '<p class="tiny">Tick tasks for a few days and each habit gets a bar.</p>')
    + sideCard('Week by week', 'Share of tasks done', miniBars(wk, wl, v => v + '%', 7))
    + sideCard('Focus and sleep', 'Last 14 days, hours', `<div class="xfs">${fs.map((v, i) => `<div><i class="f" style="--h:${Math.min(1, v / 6).toFixed(3)}"></i><i class="s" style="--h:${Math.min(1, slp[i] / 10).toFixed(3)}"></i></div>`).join('')}</div><div class="xleg"><span><i class="f"></i>Focused work (top 6h)</span><span><i class="s"></i>Sleep (top 10h)</span></div>`);
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-xs]'); if (!b) return; e.stopPropagation();
  if (b.dataset.xs === 'pack'){ window.knowPick = b.dataset.id; learnTab = 'know'; setTab('learn', { force:true }); window.scrollTo({ top:0, behavior: motionOff() ? 'auto' : 'smooth' }); }
  else if (b.dataset.xs === 'go') setTab(b.dataset.go, { force:true });
}, true);

/* ---------- Progress dashboard: KPI tiles + statistics chart (dashboard reference) ---------- */
const STX = { mode:'tasks' };
const STX_MODES = { tasks:['Tasks','check','Share of tasks done each day'], focus:['Focus','clock','Hours of focused work each day'], money:['Money','pound','Spent each day'], steps:['Steps','steps','Steps logged each day'] };
function stxData(mode){
  const ks = lastDays(30), lab = ks.map(k => shortDate(parseKey(k)));
  const v = ks.map(k => mode === 'tasks' ? Math.round(dayScore(k) * 100) : mode === 'focus' ? +(focusOf(k) / 60).toFixed(1) : mode === 'money' ? (state.expenses || []).filter(e => e.date === k).reduce((a, e) => a + (+e.amount || 0), 0) : +(dayRec(k).steps || 0));
  const fmt = mode === 'tasks' ? x => x + '%' : mode === 'focus' ? x => num(x) + 'h' : mode === 'money' ? x => money0(x) : x => Math.round(x).toLocaleString('en-GB');
  return { ks, lab, v, fmt };
}
function stxChartHTML(){
  const { lab, v, fmt } = stxData(STX.mode), W = 1000, H = 200, mx = STX.mode === 'tasks' ? 100 : Math.max(1, ...v) * 1.15, n = v.length;
  const X = i => i * W / (n - 1), Y = x => H - x / mx * (H - 10), pts = v.map((x, i) => [X(i), Y(x)]);
  const line = smoothPath(pts), area = line + ` L${W},${H} L0,${H} Z`, ticks = [0, .25, .5, .75, 1];
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="stxG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--cr-crimson)" stop-opacity=".35"/><stop offset="1" stop-color="var(--cr-crimson)" stop-opacity="0"/></linearGradient></defs>
    <g class="stx-grid">${ticks.map(t => `<line x1="0" x2="${W}" y1="${(H - t * (H - 10)).toFixed(1)}" y2="${(H - t * (H - 10)).toFixed(1)}" vector-effect="non-scaling-stroke"/>`).join('')}</g>
    <path class="stx-area" d="${area}"/><path class="stx-line" d="${line}" pathLength="1" vector-effect="non-scaling-stroke"/></svg>
    <div class="stx-y">${ticks.map(t => `<span style="bottom:${(t * (H - 10) / H * 100).toFixed(1)}%">${fmt(STX.mode === 'tasks' ? Math.round(t * 100) : t * mx)}</span>`).join('')}</div>
    <div class="stx-x">${lab.map((l, i) => i % 5 === 0 || i === n - 1 ? `<span style="left:${(i / (n - 1) * 100).toFixed(2)}%">${esc(l)}</span>` : '').join('')}</div>
    <i class="stx-dot" aria-hidden="true"></i><div class="stx-tip" role="status"></div>`;
}
function progressDashHTML(){
  const k = dkey(), s7 = periodStats(dkey(addDays(new Date(), -6)), k), saved = savedTotal(), goal = +state.settings.goal || 25000;
  const kpi = (icon, label, val, unit, sub) => `<div class="glass kpi"><div class="kh">${ic(icon, 16)}${label}</div><b class="num">${val}<small>${unit}</small></b><i>${sub}</i></div>`;
  const avg = mode => { const d = stxData(mode).v.slice(-7); return d.reduce((a, b) => a + b, 0) / 7; };
  return `<div class="pdash">
    <div class="kpis">${kpi('flame', 'Streak', currentStreak(), 'days', `Best ${bestStreak()} days`)}${kpi('target', '7-day completion', s7.pct, '%', `${s7.tasks} of ${s7.tasksAll} tasks`)}${kpi('clock', 'Focus, 7-day average', num(avg('focus')), 'h', 'focused work a day')}${kpi('piggy', 'Saved', money0(saved), '', `${Math.round(saved / goal * 100)}% of ${money0(goal)}`)}</div>
    <div class="glass stx"><div class="stx-h"><div><b>Statistics</b><small id="stxSub">${STX_MODES[STX.mode][2]} · last 30 days</small></div>
      <div class="stx-tabs" role="tablist">${Object.entries(STX_MODES).map(([id, m]) => `<button role="tab" aria-selected="${STX.mode === id}" class="${STX.mode === id ? 'on' : ''}" data-stx="${id}">${ic(m[1], 14)} ${m[0]}</button>`).join('')}</div></div>
      <div class="stx-c" id="stxC">${stxChartHTML()}</div></div>
  </div>`;
}
function stxMount(){
  const c = document.getElementById('stxC'); if (!c || c.dataset.m) return; c.dataset.m = '1';
  c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(), { lab, v, fmt } = stxData(STX.mode), n = v.length, i = clamp(Math.round((e.clientX - r.left) / r.width * (n - 1)), 0, n - 1);
    const mx = STX.mode === 'tasks' ? 100 : Math.max(1, ...v) * 1.15, x = i / (n - 1) * r.width, y = (1 - v[i] / mx * (190 / 200)) * r.height;
    const tip = c.querySelector('.stx-tip'), dot = c.querySelector('.stx-dot'); tip.textContent = `${lab[i]} · ${fmt(v[i])}`; tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.add('on');
    dot.style.left = x + 'px'; dot.style.top = y + 'px'; c.classList.add('hov'); });
  c.addEventListener('pointerleave', () => { c.classList.remove('hov'); c.querySelector('.stx-tip')?.classList.remove('on'); });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-stx]'); if (!b) return; e.stopPropagation(); STX.mode = b.dataset.stx;
  b.parentNode.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', String(x === b)); });
  const c = document.getElementById('stxC'); if (c){ c.innerHTML = stxChartHTML(); } const sub = document.getElementById('stxSub'); if (sub) sub.textContent = STX_MODES[STX.mode][2] + ' · last 30 days';
}, true);

/* ---------- Schedule: calendar week strip + day timeline (schedule reference) ---------- */
const SCH = { day:null, week:0 };
function schedHTML(){
  const today = dkey(); if (!SCH.day) SCH.day = today;
  const ws = addDays(startOfWeek(), SCH.week * 7), sel = parseKey(SCH.day), selK = SCH.day, isToday = selK === today, m = nowMin();
  const days = DAYS.map((d, i) => { const dt = addDays(ws, i), k = dkey(dt); return `<button class="${k === selK ? 'on' : ''}${k === today ? ' today' : ''}" data-sch="day" data-k="${k}" aria-pressed="${k === selK}">${d}<b class="num">${dt.getDate()}</b></button>`; }).join('');
  const B = dayBlocks(selK);
  const rows = B.map(b => { let st = blockStatus(selK, b) || ''; const now = isToday && m >= b.start && m < b.start + b.dur && st !== 'done'; if (!st && (selK < today || (isToday && m > b.start + b.dur))) st = 'missed';
    const end = b.start + (b.dur || b.min), lbl = { done:'Done', partly:'Partly', missed:'Missed' }[st] || (now ? 'Now' : selK > today || (isToday && m < b.start) ? 'Upcoming' : 'Open');
    return `<div class="sch-t num${now ? ' now' : ''}">${esc(b.t)}</div><div class="sch-b ${st}${now ? ' now' : ''}${b.skip ? ' skip' : ''}"><b>${esc(b.name)}</b><small><span>${lbl} · ${esc(b.cat)}</span><span class="num">${esc(b.t)} – ${hhmm(end)}</span></small>${now && b.note ? `<p>${esc(b.note)}${b.steps ? ': ' + b.steps.map(esc).join(' → ') : ''}</p>` : ''}</div>`; }).join('');
  const mLbl = `${MONTHS[addDays(ws, 3).getMonth()]} ${addDays(ws, 3).getFullYear()}`;
  return `<section class="glass sch"><div class="stx-h"><div><b>Schedule</b><small>${prettyDate(sel)}</small></div>
      <div class="sch-nav"><button class="cal-nav" data-sch="prev" aria-label="Previous week">${ic('back', 15)}</button><button class="lay-btn" data-sch="today">Today</button><button class="cal-nav nx" data-sch="next" aria-label="Next week">${ic('back', 15)}</button></div></div>
    <div class="sch-m">${mLbl}</div><div class="sch-days">${days}</div><div class="sch-tl">${rows}</div></section>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sch]'); if (!b) return; e.stopPropagation(); const a = b.dataset.sch;
  if (a === 'day') SCH.day = b.dataset.k; else if (a === 'today'){ SCH.week = 0; SCH.day = dkey(); } else { SCH.week += a === 'next' ? 1 : -1; SCH.day = dkey(addDays(addDays(startOfWeek(), SCH.week * 7), isoWeekday(parseKey(SCH.day)))); }
  const box = b.closest('.sch'); if (box){ box.outerHTML = schedHTML(); }
}, true);

/* ---------- Quick actions (player-panel reference) ---------- */
const QA = [
  ['cart', 'Log spending', 'Money, same day', 'money'], ['piggy', 'Add to savings', 'Towards £25k', 'saving'],
  ['scale', 'Log weight', 'Monday mornings', 'progress'], ['dumbbell', 'Start session', 'Today’s training', 'train'],
  ['pen', 'Write an essay', 'IELTS Task 2', 'essay'], ['book', 'Read a pack', 'Five points', 'pack'],
  ['calendar', 'Check-in', '2 weeks · month', 'review'], ['sparkle', 'Open Orbit', 'Your galaxy', 'orbit']
];
function quickHTML(){ return `<section class="glass qa"><div class="stx-h"><div><b>Quick actions</b><small>One tap to the thing you need</small></div></div><div class="qa-g">${QA.map(([i, t, s, id]) => `<button class="qa-b" data-qa="${id}"><span class="ds-it">${ic(i, 16)}</span><span><b>${t}</b><small>${s}</small></span></button>`).join('')}</div></section>`; }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-qa]'); if (!b) return; e.stopPropagation(); const a = b.dataset.qa;
  if (a === 'saving'){ const t = document.createElement('button'); t.dataset.a = 'add-saving'; t.hidden = true; document.body.appendChild(t); t.click(); t.remove(); return; }
  if (a === 'orbit'){ if (typeof kmOpen === 'function') kmOpen(); return; }
  if (a === 'essay'){ learnTab = 'essay'; setTab('learn', { force:true }); return; }
  if (a === 'pack'){ learnTab = 'know'; setTab('learn', { force:true }); return; }
  setTab(a, { force:true });
  if (a === 'money') setTimeout(() => document.querySelector('#view-money input[name="amount"]')?.focus(), 350);
}, true);

/* ---------- Status bars (player-panel reference) ---------- */
function statusHTML(){
  const k = dkey(), r = dayRec(k), y = dayRec(dkey(addDays(new Date(), -1))), f = r.feel || {}, sl = sleepMins(r) || sleepMins(y), steps = +r.steps || 0, goal = +state.settings.stepsGoal || 8000;
  const tasks = tasksForDay(k).length ? countDone(k) / tasksForDay(k).length : 0, fm = focusOf(k);
  const row = (icon, label, val, w, sub, col) => `<div class="stt-r"><span>${ic(icon, 15)} ${label}</span><b class="num">${val}</b><i><em style="--w:${clamp(w, 0, 1).toFixed(3)};--c:${col}"></em></i>${sub ? `<small>${sub}</small>` : ''}</div>`;
  return `<section class="glass stt"><div class="stx-h"><div><b>Status</b><small>How today is going</small></div></div>
    ${row('bolt', 'Energy', f.energy ? f.energy + '/5' : '–', (f.energy || 0) / 5, f.energy ? '' : 'Set it in the feel strip on Today', '#C9A882')}
    ${row('moon', 'Sleep', sl ? `${Math.floor(sl / 60)}h ${sl % 60}m` : '–', (sl || 0) / 480, sl ? (sl < 420 ? 'Under 7 hours: keep tonight early' : 'Good') : 'Add last night’s sleep on Today', '#5B7FA6')}
    ${row('steps', 'Steps', steps.toLocaleString('en-GB'), steps / goal, `Goal ${goal.toLocaleString('en-GB')}`, '#7E8B5A')}
    ${row('check', 'Tasks', Math.round(tasks * 100) + '%', tasks, `${countDone(k)} of ${tasksForDay(k).length} · ${STREAK_TARGET} keeps the streak`, 'var(--cr-crimson)')}
    ${row('clock', 'Focus', `${Math.floor(fm / 60)}h ${Math.round(fm % 60)}m`, fm / 240, 'Aim for 4 hours on a full day', 'var(--cr-sand)')}
  </section>`;
}
