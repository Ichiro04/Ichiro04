/* ============================================================
   SIMPLE TODAY (20 Nov 2026). He said the app shows "too much data".
   Measured on a phone: Today was 8.3 screens, 22 cards, 169 numbers,
   71 buttons, and the day plan appeared six ways (now card, up next,
   the 3 that matter, board, timing tower, wave).
   Research used:
   - a home screen is a routing decision: one clear next action, the rest
     one tap away (progressive disclosure);
   - people stop self-tracking when logging is a hassle or reflection
     feels bad (Epstein et al., CHI 2015 / 2017), so make lapses easy to
     come back from;
   - one missed day does not hurt habit formation, repeated misses do
     (Lally et al., 2010);
   - three rings beat a wall of numbers (Apple Fitness);
   - warn when the day is over-planned (Sunsama's workload limit).
   Nothing is deleted or renamed: "Show the full day" brings back every
   section exactly as before (state.todayView = 'full').
   ============================================================ */
const SIMPLE = { gap: 0, letter: false, budget: 120 };   // budget: his 1.5–2 h a day, in minutes

// days since the app was last opened, for the welcome-back line (stamped once per load)
{ const last = state.lastOpen, k = dkey(); SIMPLE.gap = last ? Math.max(0, daysBetween(last, k)) : 0; if (last !== k){ state.lastOpen = k; save(); } }

function spOn(){ return state.todayView !== 'full'; }

/* the lapse line: kind words with a number in them, never guilt */
function spLapse(){
  const now = new Date(), y = dkey(addDays(now, -1)), y2 = dkey(addDays(now, -2)), name = mvFirstName();
  if (SIMPLE.gap >= 2) return `Welcome back, ${name}. No catching up needed: start with the next block and today counts like any other day.`;
  if (!state.createdAt || state.createdAt >= y || !tasksForDay(y).length || isStreakDay(y)) return '';
  if (state.createdAt < y2 && tasksForDay(y2).length && !isStreakDay(y2)) return 'Two quiet days. Make today small: switch the day to Short and get four ticks. That is enough to restart.';
  return 'Yesterday slipped. One missed day does not undo a habit; two in a row starts to. Four tasks today and the line holds.';
}
// the letter (full view too) leads with it
mvLetter = (orig => function(){ const L = orig.apply(this, arguments), t = spLapse(); if (t) L.lines.unshift(t); return L; })(mvLetter);

/* tips rest for a week after being shown on 3 days without being used */
function tipSeen(ids){ const k = dkey(), s = state.tipSeen || (state.tipSeen = {}); let ch = false;
  ids.forEach(id => { const a = s[id] || (s[id] = []); if (!a.includes(k)){ a.push(k); if (a.length > 6) a.shift(); ch = true; } }); if (ch) save(); }
function tipTired(id){ const k = dkey(), a = (state.tipSeen || {})[id] || [], from = dkey(addDays(new Date(), -10));
  return !a.includes(k) && a.filter(d => d >= from && d < k).length >= 3; }
waveTips = (orig => function(){ return orig.apply(this, arguments).filter(t => !tipTired(t.id)).map(t => t.id === 'weigh' && spOn() && activeTab === 'today' ? Object.assign({}, t, { go: undefined, act: 'weigh' }) : t); })(waveTips);
tipsHTML = (orig => function(){ const h = orig.apply(this, arguments); try { tipSeen(waveTips().slice(0, 3).map(t => t.id)); } catch(_){} return h; })(tipsHTML);
document.addEventListener('click', e => { const b = e.target.closest('[data-wv="go"]'); if (b && state.tipSeen) { delete state.tipSeen[b.dataset.id]; save(); } }, true);

/* three rings: tasks, steps, focus (Apple-style, one glance) */
function spRingsHTML(){
  const k = dkey(), tot = tasksForDay(k).length, done = countDone(k), r = dayRec(k), goal = +state.settings.stepsGoal || 8000, steps = +r.steps || 0;
  const B = dayBlocks(k).filter(b => !b.skip), plan = B.reduce((a, b) => a + b.dur, 0), foc = Math.round(focusOf(k));
  const rows = [
    ['Tasks', tot ? done / tot : 0, `${done} of ${tot}`, done >= 4 ? 'streak day safe' : `${Math.max(0, 4 - done)} more for a streak day`, '#A3122A'],
    ['Steps', steps / goal, steps.toLocaleString('en-GB'), `of ${goal.toLocaleString('en-GB')}`, '#C2742A'],
    ['Focus', plan ? foc / plan : 0, fmtHM(foc), `of ${fmtHM(plan)} planned`, '#3B6FB0'] ];
  const R = [46, 35, 24], C = 56;
  const ring = (p, i, col) => { const rr = R[i], c = 2 * Math.PI * rr, f = clamp(p, 0, 1);
    return `<circle cx="${C}" cy="${C}" r="${rr}" class="sp-rt" style="stroke:${col}"/><circle cx="${C}" cy="${C}" r="${rr}" class="sp-rv" style="stroke:${col};stroke-dasharray:${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${C} ${C})"/>`; };
  const shape = r.shape || 'full', over = plan > SIMPLE.budget * 1.15 && shape === 'full';
  return `<section class="glass sp-rings" aria-label="Today in three rings">
    <svg viewBox="0 0 ${C * 2} ${C * 2}" class="sp-rsvg" role="img" aria-label="${rows.map(x => `${x[0]} ${x[2]} ${x[3]}`).join(', ')}">${rows.map((x, i) => ring(x[1], i, x[4])).join('')}</svg>
    <div class="sp-rl">${rows.map(x => `<div class="sp-rr"><i style="background:${x[4]}"></i><span>${x[0]}</span><b class="num">${x[2]}</b><small>${x[3]}</small></div>`).join('')}</div>
    ${over ? `<div class="sp-load"><p><b>${fmtHM(plan)} planned.</b> Your goal is 1.5 to 2 hours a day. Short keeps every block but trims each to about 60%.</p><button class="btn btn-soft sm" data-a="ds-shape" data-v="short">Make today Short</button></div>` : ''}
  </section>`;
}

/* one list: today's tasks, the same rows and actions as the timing tower */
function spListHTML(){
  const k = dkey(), list = tasksForDay(k), next = upNext(), B = dayBlocks(k);
  const at = t => { const b = B.find(x => x.task === t.id); return b ? b.start : 9999; };
  const rows = list.slice().sort((a, b) => at(a) - at(b)).map((t, i) => { const d = taskDone(k, t.id), b = B.find(x => x.task === t.id);
    return `<button class="task tt-row ${d ? 'done' : ''} ${!d && next && t.id === next.id ? 'next' : ''}" data-a="task" data-id="${t.id}" aria-pressed="${d}" style="--i:${i}">
      <span class="pos num">${b ? b.t : ''}</span><span class="kind" style="background:${t.color}"></span>
      <span class="cbx" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M4 10.5l4 4L16 6"/></svg></span>
      <span class="tbody"><span class="tname">${esc(t.name)}</span><span class="tmeta">${esc(t.meta)}</span></span>
      ${t.go && t.go !== 'today' ? `<span class="tgo" data-a="go" data-go="${t.go}" aria-hidden="true">${ic('arrowRight', 16)}</span>` : ''}</button>`; }).join('');
  return `<div class="h2">Today’s list <span class="side num">${countDone(k)}/${list.length}</span></div>
    <div class="glass tasks tower sp-list">${rows || '<div class="tiny" style="padding:14px">Rest day. Nothing scheduled.</div>'}</div>`;
}

/* one tip, not three */
function spTipHTML(){ const t = waveTips().filter(x => !(x.id === 'weigh' && spWeighHTML()))[0]; if (!t) return ''; tipSeen([t.id]);
  return `<div class="wv-tip lg-chip sp-tip" data-tip="${t.id}"><span class="wv-ti">${ic(t.icon, 16)}</span><p>${esc(t.t)}</p>
    <div class="wv-ta"><button class="wv-go" data-wv="go" data-id="${t.id}">${esc(t.b)}</button><button class="wv-x" data-wv="x" data-id="${t.id}" aria-label="Hide this tip for today">${ic('x', 14)}</button></div></div>`; }
document.addEventListener('click', e => { if (e.target.closest('.sp [data-wv="x"]')) setTimeout(() => { if (activeTab === 'today') renderView('today'); }, motionOff() ? 0 : 380); }, true);

function spHelloHTML(){
  const L = mvLetter(), q = mvPick(MV.shift), date = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
  return `<section class="glass sp-hello">
    <div class="sp-hd"><small>${esc(date)}</small><b>${esc(L.greet)}</b></div>
    <p class="sp-line">${esc(L.lines[0] || '')}</p>
    <p class="sp-q">“${esc(q[1])}”</p>
    <button class="sp-more" data-sp="letter" aria-expanded="${SIMPLE.letter}">${SIMPLE.letter ? 'Fold the letter' : 'Read the whole letter'}</button>
  </section>`;
}

/* weigh-in in the quick log: on weigh days, or when nothing was logged this week (the Progress form is folded on phones) */
function spWeighHTML(){
  const k = dkey(), r = dayRec(k), weighDay = tasksForDay(k).some(t => t.id === 'weigh');
  const recent = (() => { for (let i = 0; i < 7; i++) if (dayRec(dkey(addDays(new Date(), -i))).weight) return true; return false; })();
  if (!weighDay && recent) return '';
  return `<form data-form="weight" class="sp-wt"><div class="input-prefix"><span class="pfx">kg</span><input class="input" name="kg" type="number" step="0.1" min="30" max="250" placeholder="${num(lastWeight())}" value="${r.weight || ''}" required aria-label="Weight today"></div>
    <button class="btn btn-soft sm" type="submit">${ic('scale', 14)} ${r.weight ? 'Update weight' : 'Log weight'}</button></form>`;
}
// the "Log weight" tip goes to this form in the simple view instead of the folded Progress card
document.addEventListener('click', e => { const b = e.target.closest('[data-wv="go"][data-id="weigh"]'); if (!b || !spOn() || activeTab !== 'today') return;
  const i = document.querySelector('#spToday .sp-wt input'); if (!i){ setTab('progress'); return; } i.scrollIntoView({ behavior: motionOff() ? 'auto' : 'smooth', block:'center' }); setTimeout(() => i.focus(), 300); }, true);

function simpleTodayHTML(){
  const due = (() => { try { return srsQueue().all.length; } catch(_){ return 0; } })();
  const brief = (typeof SYB !== 'undefined' && SYB.b && typeof briefingHTML === 'function') ? briefingHTML() : '';
  const exam = typeof examCountHTML === 'function' ? examCountHTML('today') : '';
  return `<div class="sp" id="spToday">
    <div class="sp-a">
      ${nowCardHTML()}
      ${spListHTML()}
      <div class="h2">Quick log</div>
      <div class="glass card sp-log">${stepsCardInner()}
        ${spWeighHTML()}
        <div class="sp-lb"><button class="btn btn-soft sm" data-a="fab-expense">${ic('cart', 14)} Add a spend</button><button class="btn btn-soft sm" data-a="fab-saving">${ic('piggy', 14)} Add to savings</button></div></div>
    </div>
    <div class="sp-b">
      ${SIMPLE.letter ? mvHTML() + '<button class="sp-more sp-fold" data-sp="letter" aria-expanded="true">Fold the letter</button>' : spHelloHTML() + (brief || '') + (due ? srsTodayHTML() : '')}
      ${spRingsHTML()}
      ${spTipHTML()}
      ${exam}
      <div class="sp-full"><button class="btn btn-deep" data-sp="full">${ic('list', 15)} Show the full day</button>
        <small>Wave, day plan board, feel and sleep, focus charts, timing tower, lap, time zones, cue card and Orbit.</small></div>
    </div>
  </div>`;
}

renderToday = (orig => function(){
  if (spOn()) return simpleTodayHTML();
  return `<div class="sp-switch"><button class="btn btn-soft sm" data-sp="simple">${ic('target', 14)} Simple view</button><span class="tiny">Everything for today. The simple view keeps only the next step, three rings and your list.</span></div>` + orig.apply(this, arguments);
})(renderToday);

document.addEventListener('click', e => {
  const b = e.target.closest('[data-sp]'); if (!b) return; e.stopPropagation();
  const a = b.dataset.sp;
  if (a === 'letter') SIMPLE.letter = !SIMPLE.letter;
  else if (a === 'full' || a === 'simple'){ state.todayView = a; save(); window.scrollTo({ top: 0, behavior: 'auto' }); }
  renderView('today'); updateChrome();
});

/* Progress on phones: the pulse, the 30-day chart and the week schedule stay; the older stat cards
   (numbers, bodyweight, IELTS, money, last 14 days, records and the insight cards) fold behind one button */
renderView = (orig => function(tab){
  const r = orig.apply(this, arguments);
  if (tab === 'progress'){ const v = document.getElementById('view-progress'), wg = v && v.querySelector('section.wg');
    if (v && wg){ const fold = window.innerWidth < 900 && !state.progressAll; v.classList.toggle('sp-folded', fold);
      if (window.innerWidth < 900) wg.insertAdjacentHTML('afterend', `<div class="sp-allb"><button class="btn ${fold ? 'btn-deep' : 'btn-soft'} sm" data-sp-all>${fold ? `${ic('list', 14)} Show all stats` : 'Fold the older stats'}</button>${fold ? '<small>Numbers, bodyweight, IELTS, money, last 14 days, records and habit strength.</small>' : ''}</div>`); } }
  return r;
})(renderView);
document.addEventListener('click', e => { const b = e.target.closest('[data-sp-all]'); if (!b) return; e.stopPropagation(); state.progressAll = !state.progressAll; save(); renderView('progress'); });
