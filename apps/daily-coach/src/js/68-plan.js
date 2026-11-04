/* ============================================================
   PLAN TRACKING (3 Nov 2026, from the user's task-board references)
   - Today: the day plan as Board (To do / In progress / Done / Missed,
     drag cards or tap to move), Timeline (blocks on an hour grid with a
     now line) or List (filter All / Open / Done / Missed). Replaces the
     old Day plan list. Statuses are the same day-record `plan` values
     ('' / partly / done / missed), so the now card, tasks and charts
     all stay in step.
   - Learn: this week's study board (weekly targets as cards with
     progress dots).
   - Progress: week schedule grid (areas × days, status on every block).
   ============================================================ */
const PB = { view: null, filter: 'all', wk: 0, drag: null };
const PB_COLS = [['', 'To do', 'todo'], ['partly', 'In progress', 'doing'], ['done', 'Done', 'done'], ['missed', 'Missed', 'missed']];
const PB_TONE = { Training:'tr', English:'en', Engineering:'eg', Career:'ca', Walking:'wk', Routine:'ro' };
const pbView = () => PB.view || state.planView || 'board';
function pbDue(k, b, s){
  if (s === 'done') return ['Done', 'ok'];
  if (s === 'missed') return ['Missed', 'bad'];
  if (k !== dkey()) return [s === 'partly' ? 'Partly' : 'Open', s === 'partly' ? 'mid' : 'muted'];
  const m = nowMin();
  if (m >= b.start && m < b.start + b.dur) return ['Now', 'now'];
  if (m < b.start){ const d = Math.round(b.start - m), h = Math.floor(d / 60); return [h ? `in ${h} h ${d % 60 ? (d % 60) + ' min' : ''}`.trim() : `in ${d} min`, 'muted']; }
  return [s === 'partly' ? 'Partly' : 'Late', s === 'partly' ? 'mid' : 'late'];
}
function pbDots(n, of, id){
  return Array.from({ length: of }, (_, i) => id ? `<button class="pb-dot${i < n ? ' on' : ''}" data-a="ds-step" data-id="${id}" data-n="${i < n && i === n - 1 ? i : i + 1}" aria-label="Step ${i + 1} of ${of}${i < n ? ', done' : ''}"></button>` : `<i class="pb-dot${i < n ? ' on' : ''}"></i>`).join('');
}
function pbCard(k, b, compact){
  const s = blockStatus(k, b), [due, tone] = pbDue(k, b, s), st = (dayRec(k).pstep || {})[b.id] || 0, n = s === 'done' ? 3 : st;
  return `<article class="pb-card${compact ? ' compact' : ''}" data-pb-id="${b.id}" data-pb-st="${s}" tabindex="0" aria-label="${esc(b.name)}, ${esc(due)}">
    <div class="pb-top"><span class="pb-tag ${PB_TONE[b.cat] || 'ro'}">${esc(b.cat)}</span><button class="pb-more" data-pb-menu aria-label="Move ${esc(b.name)}" aria-expanded="false">${ic('grip', 15)}</button></div>
    <b class="pb-name">${esc(b.name)}</b><small class="pb-note">${esc(b.note)}</small>
    <div class="pb-prog"><span>Steps</span><span class="pb-dots">${pbDots(n, 3, s === 'done' ? '' : b.id)}</span><em class="num">${n}/3</em></div>
    <div class="pb-foot"><span class="pb-time num">${ic('clock', 13)}${b.t} · ${b.dur} min</span><span class="pb-due ${tone}">${esc(due)}</span></div>
    <div class="pb-move" hidden>${PB_COLS.map(([v, l]) => `<button class="${v === s ? 'on' : ''}" data-a="ds-status" data-id="${b.id}" data-v="${v}">${l}</button>`).join('')}</div>
  </article>`;
}
function pbBoardHTML(k, B){
  return `<div class="pb-board" role="list">${PB_COLS.map(([v, l, c]) => { const cards = B.filter(b => (blockStatus(k, b) || '') === v);
    return `<section class="pb-col ${c}" data-pb-col="${v}" role="listitem" aria-label="${l}"><header><i></i><b>${l}</b><span class="num">${cards.length}</span></header>
      <div class="pb-list">${cards.map((b, i) => pbCard(k, b, v === '' ? i >= 2 : v !== 'partly')).join('') || `<div class="pb-empty">${v === 'done' ? 'Finished blocks land here' : v === 'missed' ? 'Nothing missed' : v === 'partly' ? 'Drag a card here when you start' : 'All moved on'}</div>`}</div></section>`; }).join('')}</div>
    <div class="tiny pb-hint">Drag a card to another column, or tap ${ic('grip', 12)} to move it. Done also ticks the matching task.</div>`;
}
function pbTimelineHTML(k, B){
  const H0 = 6, H1 = 23, span = (H1 - H0) * 60, x = m => ((m - H0 * 60) / span * 100).toFixed(2) + '%', m = nowMin(), isToday = k === dkey();
  const hours = Array.from({ length: H1 - H0 + 1 }, (_, i) => H0 + i);
  return `<div class="pb-tl-wrap"><div class="pb-tl" style="--rows:${B.length}">
    <div class="pb-hours">${hours.map(h => `<span style="left:${x(h * 60)}">${pad2(h)}:00</span>`).join('')}</div>
    <div class="pb-grid">${hours.map(h => `<i style="left:${x(h * 60)}"></i>`).join('')}
      ${isToday && m >= H0 * 60 && m <= H1 * 60 ? `<div class="pb-now" style="left:${x(m)}"><span class="num">${hhmm(m)}</span></div>` : ''}
      ${B.map((b, i) => { const s = blockStatus(k, b) || 'open', next = s === 'open' ? 'done' : s === 'done' ? 'partly' : s === 'partly' ? 'missed' : '', late = isToday && s === 'open' && b.start + b.dur < m;
        return `<button class="pb-bar ${PB_TONE[b.cat] || 'ro'} st-${s}${late ? ' late' : ''}${b.dur < 45 ? ' narrow' : ''}" style="left:${x(b.start)};width:${(b.dur / span * 100).toFixed(2)}%;top:${i * 44}px" data-a="ds-status" data-id="${b.id}" data-v="${next}" aria-label="${esc(b.name)} at ${b.t}, ${s === 'open' ? 'open' : s}. Tap to change">
          <span><b>${esc(b.name)}</b><small class="num">${b.t} · ${b.dur} min${s !== 'open' ? ' · ' + ({ done:'Done', partly:'Partly', missed:'Missed' })[s] : late ? ' · Late' : ''}</small></span></button>`; }).join('')}
    </div></div></div>
    <div class="tiny pb-hint">Tap a block to cycle Done → Partly → Missed → Open.</div>`;
}
function pbListHTML(k, B){
  const cnt = { all: B.length, open: B.filter(b => !blockStatus(k, b) || blockStatus(k, b) === 'partly').length, done: B.filter(b => blockStatus(k, b) === 'done').length, missed: B.filter(b => blockStatus(k, b) === 'missed').length };
  const f = PB.filter, show = B.filter(b => { const s = blockStatus(k, b); return f === 'all' || (f === 'open' ? (!s || s === 'partly') : s === f); });
  return `<div class="pb-filter" role="tablist">${[['all', 'All'], ['open', 'Open'], ['done', 'Done'], ['missed', 'Missed']].map(([v, l]) => `<button role="tab" aria-selected="${f === v}" class="${f === v ? 'on' : ''}" data-pb-filter="${v}">${l}<span class="num">${cnt[v]}</span></button>`).join('')}</div>
    <ul class="pb-rows">${show.map(b => { const s = blockStatus(k, b), [due, tone] = pbDue(k, b, s), next = !s ? 'done' : s === 'done' ? 'partly' : s === 'partly' ? 'missed' : '';
      return `<li class="pb-row${s === 'done' ? ' done' : ''}"><span class="pb-tag ${PB_TONE[b.cat] || 'ro'}">${esc(b.cat)}</span>
        <span class="pb-rt"><b>${esc(b.name)}</b><small>${esc(b.note)}</small><small class="num">${b.t} · ${b.dur} min</small></span>
        <button class="pb-due ${tone}" data-a="ds-status" data-id="${b.id}" data-v="${next}" aria-label="${esc(b.name)}: ${esc(due)}. Tap to change">${esc(due)}</button>
        <button class="pb-check${s === 'done' ? ' on' : ''}" data-a="ds-status" data-id="${b.id}" data-v="${s === 'done' ? '' : 'done'}" aria-label="${s === 'done' ? 'Mark ' + esc(b.name) + ' open' : 'Mark ' + esc(b.name) + ' done'}">${ic('check', 14)}</button></li>`; }).join('') || `<li class="pb-row empty">Nothing here.</li>`}
      ${f === 'all' ? `<li class="pb-row sleep"><span class="pb-tag ro">Sleep</span><span class="pb-rt"><b>Lights out</b><small>Aim for 7 h 30 before a 06:15 start</small><small class="num">22:45</small></span></li>` : ''}</ul>`;
}
function planBoardHTML(){
  const k = dkey(), B = dayBlocks(k).filter(b => !b.skip), done = B.filter(b => blockStatus(k, b) === 'done').length, v = pbView();
  const pct = B.length ? Math.round(done / B.length * 100) : 0;
  const views = [['board', 'layout', 'Board'], ['timeline', 'menu', 'Timeline'], ['list', 'checklist', 'List']];
  return `<section class="pb" id="planBoard">
    <div class="pb-head"><div class="h2">Day plan <span class="side num">${done} of ${B.length} done</span></div>
      <div class="pb-views" role="tablist" aria-label="Day plan view">${views.map(([id, i, l]) => `<button role="tab" aria-selected="${v === id}" class="${v === id ? 'on' : ''}" data-pb-view="${id}">${ic(i, 15)}<span>${l}</span></button>`).join('')}</div></div>
    <div class="glass pb-box">
      <div class="pb-sum"><div class="pb-bar-o"><i style="width:${pct}%"></i></div><span class="num">${pct}% complete</span></div>
      ${v === 'timeline' ? pbTimelineHTML(k, B) : v === 'list' ? pbListHTML(k, B) : pbBoardHTML(k, B)}
    </div></section>`;
}
function pbRedraw(){ const el = document.getElementById('planBoard'); if (!el) return; const y = window.scrollY; el.outerHTML = planBoardHTML(); window.scrollTo(0, y); }

/* ---------- Learn: study board (user, 3 Nov 2026: Day / Week / Month / Finished,
   English, Engineering and Career kept apart, never mixed) ----------
   Targets are the blocks the day plan schedules in the period; done = those blocks done
   (a ticked task counts too, through blockStatus). */
const SB_AREAS = [
  ['English', 'en', [['essay', 'IELTS Task 2 essay', 'Write and score it in Learn → Essay', 'learn:essay'], ['speaking', 'Speaking cue card', '1 minute to plan, 2 to talk', 'learn:speak'], ['vocab', 'Vocabulary drill', '10 words in your own sentences', 'learn:words']]],
  ['Engineering', 'eg', [['knowledge', 'Knowledge pack', 'Read, then recall out loud', 'learn:know'], ['labpractice', 'Lab practice', '3D CAD or the drawing test', 'lab']]],
  ['Career', 'ca', [['jobs', 'Job search', 'Two applications or one follow-up', 'learn:career'], ['career', 'Career 15 minutes', 'Portfolio, drawing or interview questions', 'learn:career']]]
];
const SB = { view: null };
const sbView = () => SB.view || state.studyView || 'week';
function sbRange(v){
  const t = new Date(); t.setHours(0, 0, 0, 0);
  if (v === 'day') return [t, t];
  if (v === 'month') return [new Date(t.getFullYear(), t.getMonth(), 1), new Date(t.getFullYear(), t.getMonth() + 1, 0)];
  const ws = startOfWeek(); return [ws, addDays(ws, 6)];
}
function sbCount(id, from, to){
  const today = dkey(); let of = 0, n = 0, due = 0;
  for (let d = new Date(from); d <= to; d = addDays(d, 1)){ const k = dkey(d), b = dayBlocks(k).find(x => x.id === id); if (!b || b.skip) continue;
    of++; if (k <= today){ due++; if (blockStatus(k, b) === 'done') n++; } }
  return { of, n, due };
}
function sbCard(area, tone, [id, name, note, go], from, to, v){
  const c = sbCount(id, from, to); if (!c.of) return '';
  const done = c.n >= c.of, behind = !done && c.n < c.due - (v === 'day' ? 0 : 1), pct = Math.round(c.n / c.of * 100);
  const chip = done ? ['Done', 'ok'] : c.n === 0 && c.due === 0 ? ['Not started', 'muted'] : behind ? ['Behind', 'late'] : c.n ? ['On track', 'mid'] : ['To do', 'muted'];
  return `<article class="pb-card sb-card${done ? ' is-done' : ''}">
    <div class="pb-top"><b class="pb-name">${esc(name)}</b><button class="pb-more" data-sb-go="${go}" aria-label="Open ${esc(name)}">${ic('arrowRight', 15)}</button></div>
    <small class="pb-note">${esc(note)}</small>
    <div class="pb-prog"><span class="pb-dots">${c.of <= 14 ? pbDots(c.n, c.of) : `<span class="sb-bar"><i style="width:${pct}%"></i></span>`}</span><em class="num">${c.n}/${c.of}</em></div>
    <div class="pb-foot"><span class="pb-time">${v === 'day' ? 'Today' : v === 'week' ? 'This week' : 'This month'}</span><span class="pb-due ${chip[1]}">${chip[0]}</span></div></article>`;
}
/* finished: what you actually completed this month, newest first, per area */
function sbFinished(ids){
  const t = new Date(), from = new Date(t.getFullYear(), t.getMonth(), 1), out = [];
  for (let d = new Date(t); d >= from; d = addDays(d, -1)){ const k = dkey(d);
    dayBlocks(k).forEach(b => { if (ids.includes(b.id) && !b.skip && blockStatus(k, b) === 'done') out.push({ k, d: new Date(d), b }); }); }
  return out;
}
function sbFinishedCol(area, tone, items){
  const list = sbFinished(items.map(i => i[0])), essays = (state.ielts && state.ielts.essays) || [];
  const row = f => { const e = f.b.id === 'essay' ? essays.find(x => x.date === f.k && x.band) : null, pk = f.b.id === 'knowledge' && typeof KNOWLEDGE_PACKS !== 'undefined' ? KNOWLEDGE_PACKS.find(p => (state.knowledge || {})[p.id] === f.k) : null;
    return `<li><span class="sb-tick">${ic('check', 12)}</span><span class="sb-ft"><b>${esc(f.b.name)}</b><small>${esc(e ? 'Band ' + e.band : pk ? pk.title : f.b.note)}</small></span><span class="sb-fd num">${f.k === dkey() ? 'Today' : DAYS[isoWeekday(f.d)] + ' ' + f.d.getDate()}</span></li>`; };
  return `<ul class="sb-fin">${list.slice(0, 10).map(row).join('') || `<li class="sb-none">Nothing finished in ${esc(area === 'English' ? area : area.toLowerCase())} yet this month.</li>`}${list.length > 10 ? `<li class="sb-none">+ ${list.length - 10} more this month</li>` : ''}</ul>`;
}
function studyBoardHTML(){
  const v = sbView(), [from, to] = sbRange(v);
  let all = 0, tot = 0;
  const cols = SB_AREAS.map(([area, tone, items]) => {
    const sums = items.map(i => sbCount(i[0], from, to)), n = sums.reduce((a, c) => a + Math.min(c.n, c.of), 0), of = sums.reduce((a, c) => a + c.of, 0);
    const fin = v === 'finished' ? sbFinished(items.map(i => i[0])).length : 0; all += n; tot += of;
    const body = v === 'finished' ? sbFinishedCol(area, tone, items) : (items.map(i => sbCard(area, tone, i, from, to, v)).join('') || `<div class="pb-empty">Nothing planned for ${v === 'day' ? 'today' : 'this ' + v}.</div>`);
    return `<section class="pb-col sb-col ${tone}"><header><span class="pb-tag ${tone}">${area}</span><span class="num">${v === 'finished' ? fin : n + '/' + of}</span></header>
      ${v === 'finished' ? '' : `<div class="sb-area-bar"><i style="width:${of ? Math.round(n / of * 100) : 0}%"></i></div>`}<div class="pb-list">${body}</div></section>`; });
  const left = v === 'week' ? 6 - isoWeekday(new Date()) : v === 'month' ? Math.round((to - new Date()) / 864e5) : 0;
  const side = v === 'finished' ? 'this month, newest first' : `${all} of ${tot}${v === 'day' ? ' today' : ` · ${left > 0 ? left + ' day' + (left > 1 ? 's' : '') + ' left' : 'last day'}`}`;
  const views = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['finished', 'Finished']];
  return `<section class="sb" id="studyBoard"><div class="pb-head"><div class="h2">Study plan <span class="side num">${side}</span></div>
      <div class="pb-views" role="tablist" aria-label="Study period">${views.map(([id, l]) => `<button role="tab" aria-selected="${v === id}" class="${v === id ? 'on' : ''}" data-sb-view="${id}">${id === 'finished' ? ic('check', 14) : ic('calendar', 14)}<span>${l}</span></button>`).join('')}</div></div>
    <div class="pb-board sb-board">${cols.join('')}</div></section>`;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-sb-view]'); if (!b) return; e.stopPropagation(); state.studyView = SB.view = b.dataset.sbView; save(); const el = document.getElementById('studyBoard'); if (el){ const y = window.scrollY; el.outerHTML = studyBoardHTML(); window.scrollTo(0, y); } if (typeof fillView === 'function') setTimeout(() => fillView('learn'), 30); }, true);
renderLearn = (orig => function(){ return orig.apply(this, arguments).replace('<div class="learngrid">', studyBoardHTML() + '<div class="learngrid">'); })(renderLearn);

/* ---------- Progress: week schedule grid ---------- */
function weekGridHTML(){
  const ws = addDays(startOfWeek(), PB.wk * 7), today = dkey(), cats = ['Training', 'English', 'Engineering', 'Career', 'Walking', 'Routine'];
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i)), m = nowMin();
  let done = 0, all = 0;
  const cell = (d, cat) => { const k = dkey(d), B = dayBlocks(k).filter(b => !b.skip && b.cat === cat);
    const chips = B.map(b => { const s = blockStatus(k, b); all++; if (s === 'done') done++;
      const st = s || (k < today || (k === today && b.start + b.dur < m) ? 'missedopen' : 'planned');
      const lab = { done:'Done', partly:'Partly', missed:'Missed', missedopen:'Not logged', planned:'' }[st];
      return `<div class="wg-chip ${st}" title="${esc(b.name)} ${b.t}"><b>${esc(b.name)}</b><small class="num">${b.t}${lab ? `<em><i></i>${lab}</em>` : ''}</small></div>`; });
    return `<div class="wg-cell${k === today ? ' today' : ''}">${chips.slice(0, 2).join('')}${chips.length > 2 ? `<div class="wg-more">+ ${chips.length - 2} more</div>` : ''}</div>`; };
  const rows = cats.map(c => `<div class="wg-row"><div class="wg-cat"><span class="pb-tag ${PB_TONE[c]}">${c}</span></div>${days.map(d => cell(d, c)).join('')}</div>`).join('');
  const range = `${shortDate(ws)} – ${shortDate(addDays(ws, 6))}`;
  return `<section class="wg" id="weekGrid"><div class="wg-head"><div class="h2">Week schedule <span class="side num">${done} of ${all} blocks done</span></div>
    <div class="wg-nav"><button class="wg-b" data-wg="-1" aria-label="Previous week">${ic('chevron', 16)}</button><span class="num">${esc(range)}</span><button class="wg-b next" data-wg="1" aria-label="Next week" ${PB.wk >= 1 ? 'disabled' : ''}>${ic('chevron', 16)}</button><button class="wg-today" data-wg="0" ${PB.wk === 0 ? 'disabled' : ''}>This week</button></div></div>
    <div class="glass wg-box"><div class="wg-scroll"><div class="wg-grid">
      <div class="wg-row wg-days"><div class="wg-cat"></div>${days.map(d => `<div class="wg-day${dkey(d) === today ? ' today' : ''}"><b class="num">${d.getDate()}</b><span>${DAYS[isoWeekday(d)]}</span></div>`).join('')}</div>
      ${rows}</div></div>
      <div class="wg-key"><span><i class="done"></i>Done</span><span><i class="partly"></i>Partly</span><span><i class="missed"></i>Missed</span><span><i class="missedopen"></i>Not logged</span><span><i class="planned"></i>Planned</span></div></div></section>`;
}
renderView = (orig => function(tab){
  const r = orig.apply(this, arguments);
  if (tab === 'progress'){ const d = document.querySelector('#view-progress .pdash'); try { if (d) d.insertAdjacentHTML('afterend', weekGridHTML()); } catch(err){ console.warn('week grid', err); } }
  return r;
})(renderView);

/* ---------- clicks: views, filter, move menu, study links, week nav ---------- */
document.addEventListener('click', e => {
  const v = e.target.closest('[data-pb-view]'); if (v){ e.stopPropagation(); state.planView = PB.view = v.dataset.pbView; save(); pbRedraw(); if (typeof fillView === 'function') setTimeout(() => fillView('today'), 30); return; }
  const f = e.target.closest('[data-pb-filter]'); if (f){ e.stopPropagation(); PB.filter = f.dataset.pbFilter; pbRedraw(); return; }
  const mn = e.target.closest('[data-pb-menu]'); if (mn){ e.stopPropagation(); const card = mn.closest('.pb-card'), mv = card.querySelector('.pb-move'), open = mv.hidden;
    document.querySelectorAll('.pb-move').forEach(x => { x.hidden = true; x.closest('.pb-card')?.querySelector('[data-pb-menu]')?.setAttribute('aria-expanded', 'false'); });
    mv.hidden = !open; mn.setAttribute('aria-expanded', String(open)); return; }
  const g = e.target.closest('[data-sb-go]'); if (g){ e.stopPropagation(); const [tab, sub] = g.dataset.sbGo.split(':'); if (sub) learnTab = sub; setTab(tab, { force: true }); window.scrollTo(0, 0); return; }
  const w = e.target.closest('[data-wg]'); if (w){ e.stopPropagation(); const d = +w.dataset.wg; PB.wk = d === 0 ? 0 : Math.min(1, PB.wk + d); const el = document.getElementById('weekGrid'); if (el) el.outerHTML = weekGridHTML(); return; }
}, true);

/* ---------- drag a card to another column (mouse: drag; touch: press and hold) ---------- */
function pbDragStart(card, x, y){
  const r = card.getBoundingClientRect(), ghost = card.cloneNode(true);
  ghost.classList.add('pb-ghost'); ghost.style.width = r.width + 'px'; ghost.style.left = r.left + 'px'; ghost.style.top = r.top + 'px'; document.body.appendChild(ghost);
  card.classList.add('dragging'); PB.drag = { card, ghost, dx: x - r.left, dy: y - r.top, col: null, on: true };
  if (navigator.vibrate) try { navigator.vibrate(12); } catch(_){}
}
function pbDragMove(x, y){
  const d = PB.drag; if (!d || !d.on) return;
  d.ghost.style.left = (x - d.dx) + 'px'; d.ghost.style.top = (y - d.dy) + 'px';
  d.ghost.style.visibility = 'hidden'; const under = document.elementFromPoint(x, y); d.ghost.style.visibility = '';
  const col = under && under.closest('#planBoard [data-pb-col]');
  document.querySelectorAll('#planBoard .pb-col.over').forEach(c => { if (c !== col) c.classList.remove('over'); });
  if (col) col.classList.add('over'); d.col = col;
}
function pbDragEnd(){
  const d = PB.drag; PB.drag = null; clearTimeout(PB.hold); if (!d || !d.on) return;
  d.ghost.remove(); d.card.classList.remove('dragging'); document.querySelectorAll('#planBoard .pb-col.over').forEach(c => c.classList.remove('over'));
  PB.justDragged = Date.now();
  if (d.col && d.col.dataset.pbCol !== (d.card.dataset.pbSt || '')) dsAction('ds-status', { dataset: { id: d.card.dataset.pbId, v: d.col.dataset.pbCol } });
}
document.addEventListener('pointerdown', e => {
  const card = e.target.closest('#planBoard .pb-card'); if (!card || e.target.closest('button') || e.button > 0) return;
  const x0 = e.clientX, y0 = e.clientY, touch = e.pointerType !== 'mouse';
  PB.drag = { card, on: false, x0, y0, touch };
  if (touch) PB.hold = setTimeout(() => { if (PB.drag && !PB.drag.on && PB.drag.card === card) pbDragStart(card, PB.drag.x0, PB.drag.y0); }, 320);
});
document.addEventListener('pointermove', e => {
  const d = PB.drag; if (!d) return;
  if (!d.on){ const moved = Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 7;
    if (d.touch){ if (moved){ clearTimeout(PB.hold); PB.drag = null; } return; }
    if (moved) pbDragStart(d.card, d.x0, d.y0); else return; }
  pbDragMove(e.clientX, e.clientY);
});
document.addEventListener('pointerup', pbDragEnd);
document.addEventListener('pointercancel', () => { if (PB.drag && PB.drag.on) pbDragEnd(); else { clearTimeout(PB.hold); PB.drag = null; } });
document.addEventListener('touchmove', e => { if (PB.drag && PB.drag.on) e.preventDefault(); }, { passive: false });
/* a tap on a card (not a drag) opens its move menu */
document.addEventListener('click', e => {
  const card = e.target.closest('#planBoard .pb-card'); if (!card || e.target.closest('button')) return;
  if (PB.justDragged && Date.now() - PB.justDragged < 400) return;
  card.querySelector('[data-pb-menu]')?.click();
});
document.addEventListener('keydown', e => { const card = e.target.closest && e.target.closest('#planBoard .pb-card'); if (card && (e.key === 'Enter' || e.key === ' ') && e.target === card){ e.preventDefault(); card.querySelector('[data-pb-menu]')?.click(); } });
