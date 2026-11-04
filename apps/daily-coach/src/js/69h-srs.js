/* ============================================================
   SPACED REVIEW (4 Nov 2026, user chose "All four" from the next-level list)
   - One deck from three sources: the 74 engineering words (English →
     Burmese + meaning), IELTS band-7 words (WORDS + SRS_IELTS below) and
     the user's own cards (mistakes, new words).
   - Each answer is graded Again / Hard / Good / Easy and the card comes
     back on a schedule (a light SM-2): soon when it was hard, later each
     time it was easy. Up to state.srs.newPerDay new cards a day.
   - Today shows a "Review" strip with what is due; the review runs
     full-screen. Learn → Words shows the deck and takes your own cards.
   - state.srs = { c:{ id:{ e, i, d, r, l } }, mine:[{ id, f, b, tag }],
     log:{ 'YYYY-MM-DD':{ n, ok, nw } }, newPerDay }
   ============================================================ */
const SRS_IELTS = [
  ['mitigate', 'To make a problem less severe.', 'Better training could mitigate the risk of accidents.'],
  ['detrimental', 'Causing harm or damage.', 'Long night shifts can be detrimental to sleep.'],
  ['substantial', 'Large in size, amount or importance.', 'The company made a substantial investment in automation.'],
  ['inevitable', 'Certain to happen; impossible to avoid.', 'Some downtime is inevitable when a line is changed over.'],
  ['proponent', 'A person who supports an idea.', 'Proponents of remote work point to saved travel time.'],
  ['exacerbate', 'To make a bad situation worse.', 'Skipping maintenance only exacerbates breakdowns.'],
  ['feasible', 'Possible and practical to do.', 'A four-day week is feasible in some factories.'],
  ['curtail', 'To reduce or limit something.', 'The council curtailed spending on public transport.'],
  ['unprecedented', 'Never having happened before.', 'Demand reached unprecedented levels last winter.'],
  ['alleviate', 'To make pain or a problem easier to bear.', 'New buses could alleviate traffic in the city centre.'],
  ['a double-edged sword', 'Something with both good and bad effects.', 'Social media is a double-edged sword for young people.'],
  ['to a large extent', 'Mostly; in most ways.', 'I agree with this view to a large extent.'],
  ['play a pivotal role', 'Be central to a result.', 'Teachers play a pivotal role in shaping attitudes.'],
  ['bring about', 'To cause something to happen.', 'Technology has brought about huge changes in manufacturing.'],
  ['in the long run', 'Over a long period of time.', 'In the long run, recycling saves money.'],
  ['tackle', 'To deal with a difficult problem.', 'Governments must tackle air pollution in cities.'],
  ['widen the gap', 'Make the difference between groups bigger.', 'Expensive tuition may widen the gap between rich and poor.'],
  ['a growing number of', 'More and more people or things.', 'A growing number of people work from home.'],
  ['it could be argued that', 'A careful way to introduce a view.', 'It could be argued that exams test memory, not skill.'],
  ['nevertheless', 'In spite of that.', 'The plan is costly; nevertheless, it is worth trying.'],
  ['consequently', 'As a result.', 'The machine overheated; consequently, the line stopped.'],
  ['whereas', 'Used to compare two different facts.', 'Cities are noisy, whereas villages are quiet.'],
  ['albeit', 'Although; even if.', 'The change was positive, albeit slow.'],
  ['by and large', 'On the whole; generally.', 'By and large, the scheme has been a success.'],
  ['ubiquitous', 'Found everywhere.', 'Smartphones are now ubiquitous.'],
  ['compelling', 'Very convincing.', 'There is compelling evidence that exercise improves mood.'],
  ['sedentary', 'Involving a lot of sitting and little movement.', 'Office work is often sedentary.'],
  ['affluent', 'Having a lot of money.', 'Affluent countries produce more waste per person.'],
  ['prioritise', 'To treat something as most important.', 'Schools should prioritise practical skills.'],
  ['raise awareness', 'Help people know about an issue.', 'Campaigns can raise awareness of road safety.'],
  ['take into account', 'To consider something when deciding.', 'Planners must take into account the cost of upkeep.'],
  ['on the other hand', 'Introduces the opposite side.', 'On the other hand, online courses lack face-to-face contact.'],
  ['a key factor', 'An important cause or part.', 'Price is a key factor when people choose a car.'],
  ['in terms of', 'Talking about a particular aspect.', 'In terms of cost, trains beat planes on short trips.'],
  ['drawback', 'A disadvantage.', 'The main drawback of solar power is the weather.'],
  ['outweigh', 'To be greater or more important than.', 'The benefits outweigh the drawbacks.']
];
const SRS_SRC = { gx: 'Engineering words', ie: 'IELTS words', me: 'Your cards' };
function srsState(){ const s = state.srs = state.srs && typeof state.srs === 'object' ? state.srs : {}; s.c = s.c || {}; s.mine = s.mine || []; s.log = s.log || {}; if (!s.newPerDay) s.newPerDay = 10; return s; }
const srsSlug = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
function srsCards(){
  const out = [];
  (typeof GLOSS !== 'undefined' ? GLOSS : []).forEach(([en, my, mean, area]) => out.push({ id: 'gx:' + srsSlug(en), src: 'gx', f: en, b: my, m: mean, tag: area, say: en, sayB: my }));
  (typeof WORDS !== 'undefined' ? WORDS : []).forEach(w => out.push({ id: 'ie:' + srsSlug(w.w), src: 'ie', f: w.w, m: w.d, ex: w.ex, tag: 'IELTS', say: w.w }));
  SRS_IELTS.forEach(([w, d, ex]) => out.push({ id: 'ie:' + srsSlug(w), src: 'ie', f: w, m: d, ex, tag: 'IELTS', say: w }));
  srsState().mine.forEach(c => out.push({ id: 'me:' + c.id, src: 'me', f: c.f, m: c.b, tag: c.tag || 'Your card', say: c.f, mine: c.id }));
  const seen = new Set(); return out.filter(c => !seen.has(c.id) && seen.add(c.id));
}
const srsToday = () => dkey();
function srsLog(){ const s = srsState(), k = srsToday(); return s.log[k] = s.log[k] || { n: 0, ok: 0, nw: 0 }; }
function srsQueue(){
  const s = srsState(), k = srsToday(), cards = srsCards();
  const due = cards.filter(c => s.c[c.id] && s.c[c.id].d <= k).sort((a, b) => s.c[a.id].d.localeCompare(s.c[b.id].d));
  const left = Math.max(0, s.newPerDay - srsLog().nw);
  // your own cards are never held back by the daily limit
  const fresh = cards.filter(c => !s.c[c.id] && c.src === 'me').concat(cards.filter(c => !s.c[c.id] && c.src !== 'me').slice(0, left));
  return { due, fresh, all: due.concat(fresh) };
}
function srsDueCount(){ const q = srsQueue(); return q.all.length; }
function srsCounts(){ const s = srsState(), cards = srsCards(); let nw = 0, lr = 0, mt = 0; cards.forEach(c => { const x = s.c[c.id]; if (!x) nw++; else if (x.i >= 21) mt++; else lr++; }); return { total: cards.length, nw, lr, mt }; }
/* next interval in days for each grade (1 again, 2 hard, 3 good, 4 easy) */
function srsNext(x, g){
  const e = x ? x.e : 2.5, i = x ? x.i : 0, r = x ? x.r : 0;
  if (g === 1) return { e: Math.max(1.3, e - .2), i: 0, r: 0 };
  if (g === 2) return { e: Math.max(1.3, e - .15), i: Math.max(1, Math.round(i * 1.2) || 1), r: r + 1 };
  if (g === 3) return { e, i: r === 0 ? 1 : r === 1 ? 3 : Math.max(i + 1, Math.round(i * e)), r: r + 1 };
  return { e: e + .15, i: r === 0 ? 4 : Math.max(i + 2, Math.round(i * e * 1.3)), r: r + 1 };
}
const srsIvl = d => d === 0 ? 'now' : d === 1 ? '1 day' : d < 30 ? `${d} days` : d < 365 ? `${Math.round(d / 30)} mo` : `${(d / 365).toFixed(1)} yr`;
function srsGrade(id, g){
  const s = srsState(), x = s.c[id], isNew = !x, n = srsNext(x, g), lg = srsLog();
  s.c[id] = { e: +n.e.toFixed(2), i: n.i, r: n.r, l: (x ? x.l || 0 : 0) + (g === 1 ? 1 : 0), d: dkey(addDays(new Date(), n.i)) };
  lg.n++; if (g > 1) lg.ok++; if (isNew) lg.nw++;
  Object.keys(s.log).forEach(d => { if (daysBetween(d, srsToday()) > 120) delete s.log[d]; });
  save();
}
function srsDaysStreak(){ const s = srsState(); let n = 0; for (let i = 0; i < 365; i++){ const d = dkey(addDays(new Date(), -i)), l = s.log[d]; if (l && l.n) n++; else if (i > 0) break; } return n; }

/* ---------- Today strip ---------- */
function srsTodayHTML(){
  const q = srsQueue(), lg = srsLog(), n = q.all.length, mins = Math.max(1, Math.round(n * .2));
  return `<section class="srs-strip${n ? '' : ' done'}" id="srsStrip" aria-label="Spaced review">
    <span class="srs-ic">${ic('rotate', 18)}</span>
    <div class="srs-t"><b>${n ? `Review · ${n} card${n === 1 ? '' : 's'} due` : 'Review done for today'}</b>
      <small>${n ? `${q.due.length} to repeat, ${q.fresh.length} new · about ${mins} min` : `${lg.n} reviewed today, ${lg.n ? Math.round(lg.ok / lg.n * 100) : 0}% remembered · ${srsDaysStreak()}-day review streak`}</small></div>
    ${n ? '<button class="btn btn-deep srs-go" data-srs-start>Start review</button>' : '<button class="btn btn-soft srs-go" data-srs-start="extra">Review more</button>'}</section>`;
}

/* ---------- full-screen review ---------- */
const SRSR = { q: [], i: 0, show: false, n: 0, ok: 0, again: new Set() };
function srsOpen(extra){
  const q = srsQueue(); let list = q.all;
  if (extra && !list.length){ const s = srsState(); list = srsCards().filter(c => s.c[c.id]).sort((a, b) => s.c[a.id].d.localeCompare(s.c[b.id].d)).slice(0, 15); }
  if (!list.length){ toast('Nothing to review yet. New cards come tomorrow.', 'ok', 2000); return; }
  Object.assign(SRSR, { q: list.slice(), i: 0, show: false, n: 0, ok: 0, again: new Set() });
  document.getElementById('srsBox')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="srs-box" id="srsBox" role="dialog" aria-modal="true" aria-label="Spaced review"><div class="srs-in" id="srsIn"></div></div>`);
  document.body.classList.add('srs-open'); srsDraw();
}
function srsClose(){ document.getElementById('srsBox')?.remove(); document.body.classList.remove('srs-open'); try { if (activeTab === 'today' || activeTab === 'learn') renderView(activeTab); } catch(_){} }
function srsDraw(){
  const box = document.getElementById('srsIn'); if (!box) return;
  const c = SRSR.q[SRSR.i];
  if (!c){
    box.innerHTML = `<div class="srs-end"><b>Done</b><p>${SRSR.n} cards · ${SRSR.n ? Math.round(SRSR.ok / SRSR.n * 100) : 0}% remembered · ${srsDaysStreak()}-day review streak</p>
      <p class="srs-sub">Cards you found hard come back sooner. See you tomorrow.</p><button class="btn btn-deep" data-srs-close>Close</button></div>`; return;
  }
  const x = srsState().c[c.id], pct = Math.round(SRSR.i / SRSR.q.length * 100);
  box.innerHTML = `<header class="srs-top"><span class="srs-src">${esc(SRS_SRC[c.src])} · ${esc(c.tag || '')}</span><span>${SRSR.i + 1} of ${SRSR.q.length}</span><button class="srs-x" data-srs-close aria-label="Close review">${ic('x', 18)}</button></header>
    <div class="srs-bar"><i style="width:${pct}%"></i></div>
    <div class="srs-card${SRSR.show ? ' open' : ''}">
      <div class="srs-f">${esc(c.f)}<button class="srs-say" data-srs-say="f" aria-label="Hear it">${ic('wave', 16)}</button></div>
      ${!x ? '<span class="srs-new">New</span>' : ''}
      ${SRSR.show ? `<div class="srs-b">${c.b ? `<p class="srs-my" lang="my">${esc(c.b)}${c.sayB ? `<button class="srs-say" data-srs-say="b" aria-label="Hear the Burmese">${ic('wave', 14)}</button>` : ''}</p>` : ''}${c.m ? `<p class="srs-m">${esc(c.m)}</p>` : ''}${c.ex ? `<p class="srs-ex">“${esc(c.ex)}”</p>` : ''}</div>` : `<p class="srs-hint">${c.src === 'gx' ? 'Say the Burmese and what it means, then check.' : c.src === 'me' ? 'Recall your answer, then check.' : 'Say what it means and use it in a sentence, then check.'}</p>`}
    </div>
    ${SRSR.show ? `<div class="srs-grades">${[[1, 'Again'], [2, 'Hard'], [3, 'Good'], [4, 'Easy']].map(([g, l]) => `<button class="srs-g g${g}" data-srs-g="${g}"><b>${l}</b><small>${srsIvl(srsNext(x, g).i)}</small><kbd>${g}</kbd></button>`).join('')}</div>`
      : `<button class="btn btn-deep srs-show" data-srs-show>Show answer <kbd>Space</kbd></button>`}`;
}
function srsAnswer(g){
  const c = SRSR.q[SRSR.i]; if (!c) return;
  srsGrade(c.id, g); SRSR.n++; if (g > 1) SRSR.ok++;
  if (g === 1 && !SRSR.again.has(c.id)){ SRSR.again.add(c.id); SRSR.q.push(c); }       // once more at the end
  SRSR.i++; SRSR.show = false; srsDraw();
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-srs-start],[data-srs-close],[data-srs-show],[data-srs-g],[data-srs-say],[data-srs-add],[data-srs-del],[data-srs-np]'); if (!t) return; e.stopPropagation();
  if (t.hasAttribute('data-srs-start')) return srsOpen(t.dataset.srsStart === 'extra');
  if (t.hasAttribute('data-srs-close')) return srsClose();
  if (t.hasAttribute('data-srs-show')){ SRSR.show = true; return srsDraw(); }
  if (t.dataset.srsG) return srsAnswer(+t.dataset.srsG);
  if (t.dataset.srsSay){ const c = SRSR.q[SRSR.i]; if (c) aiSpeak(t.dataset.srsSay === 'b' ? c.sayB : c.say, true); return; }
  if (t.hasAttribute('data-srs-add')){ const f = document.getElementById('srsAddF'), b = document.getElementById('srsAddB'); if (!f || !f.value.trim() || !b.value.trim()){ toast('Write both sides of the card.', 'warn', 1800); return; }
    srsState().mine.unshift({ id: Date.now().toString(36), f: f.value.trim().slice(0, 160), b: b.value.trim().slice(0, 400), tag: 'Your card', at: dkey() }); save(); toast('Card added. It comes up in your next review.', 'ok', 1800); renderView(activeTab); return; }
  if (t.dataset.srsDel){ const s = srsState(); if (t.dataset.armed !== '1'){ t.dataset.armed = '1'; t.textContent = 'Tap again to remove'; return; } s.mine = s.mine.filter(c => c.id !== t.dataset.srsDel); delete s.c['me:' + t.dataset.srsDel]; save(); renderView(activeTab); return; }
  if (t.dataset.srsNp){ srsState().newPerDay = +t.dataset.srsNp; save(); renderView(activeTab); }
});
document.addEventListener('keydown', e => {
  if (!document.getElementById('srsBox')) return;
  if (e.key === 'Escape') return srsClose();
  if (e.key === ' ' && !SRSR.show){ e.preventDefault(); SRSR.show = true; return srsDraw(); }
  if (SRSR.show && /^[1-4]$/.test(e.key)) srsAnswer(+e.key);
});

/* ---------- Learn → Words: the deck ---------- */
function srsDeckHTML(){
  const c = srsCounts(), q = srsQueue(), s = srsState(), lg = srsLog();
  return `<section class="card srs-deck"><div class="srs-dh"><div><h3>Review deck</h3><p class="muted">Engineering words, IELTS words and your own cards come back just before you would forget them.</p></div>
      <button class="btn btn-deep" data-srs-start${q.all.length ? '' : '="extra"'}>${q.all.length ? `Review ${q.all.length} now` : 'Review more'}</button></div>
    <div class="srs-nums"><div><b>${c.total}</b><small>cards</small></div><div><b>${c.nw}</b><small>not seen yet</small></div><div><b>${c.lr}</b><small>learning</small></div><div><b>${c.mt}</b><small>remembered 3 weeks +</small></div><div><b>${lg.n}</b><small>reviewed today</small></div></div>
    <div class="srs-np"><span>New cards a day</span>${[5, 10, 20].map(n => `<button class="${s.newPerDay === n ? 'on' : ''}" data-srs-np="${n}" aria-pressed="${s.newPerDay === n}">${n}</button>`).join('')}</div>
    <details class="srs-add"><summary>Add your own card · a mistake or a new word</summary>
      <div class="srs-form"><input id="srsAddF" maxlength="160" placeholder="Front, e.g. “I am agree” or “tolerance stack-up”" aria-label="Front of the card"><input id="srsAddB" maxlength="400" placeholder="Back, e.g. “I agree” or what it means" aria-label="Back of the card"><button class="btn btn-deep" data-srs-add>Add card</button></div>
      ${s.mine.length ? `<ul class="srs-mine">${s.mine.slice(0, 30).map(m => `<li><b>${esc(m.f)}</b><span>${esc(m.b)}</span><button class="btn btn-soft sm" data-srs-del="${esc(m.id)}">Remove</button></li>`).join('')}</ul>` : ''}</details></section>`;
}
learnWordsHTML = (orig => function(){ return srsDeckHTML() + orig.apply(this, arguments); })(learnWordsHTML);
// Today: the review strip sits right under the Morning letter
mvHTML = (orig => function(){ return orig.apply(this, arguments) + srsTodayHTML(); })(mvHTML);
