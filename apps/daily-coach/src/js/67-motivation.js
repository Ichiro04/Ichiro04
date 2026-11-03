/* ============================================================
   TODAY · MORNING LETTER
   A quote of the day, a short letter written from your own numbers,
   and your own lines mixed into the rotation.
   ============================================================ */
Object.assign(ICONS, {
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
  speaker:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/>'
});

const MV_QUOTES = [
  ['Discipline', 'You do not rise to your goals. You fall to your routine, so build a good one.'],
  ['Discipline', 'Motivation gets you started. The checklist gets you finished.'],
  ['Discipline', 'Do the boring thing again today. Boring, repeated, is how big things are built.'],
  ['Discipline', 'Four tasks is a streak day. Nobody needs a perfect day, just a counted one.'],
  ['Discipline', 'The hardest part of a session is the first two minutes. Start the timer.'],
  ['Discipline', 'You will not feel like it. Do it anyway, and feel proud later.'],
  ['Discipline', 'A missed day is a pause. Two missed days is a habit. Come back today.'],
  ['Discipline', 'Make the next action so small you cannot say no to it.'],
  ['Discipline', 'Win the morning and the rest of the day follows.'],
  ['Discipline', 'Consistency beats intensity. Every single time.'],
  ['Money', 'Every pound you do not spend is a pound working for the person you are becoming.'],
  ['Money', 'Pay your future self first, then live on what is left.'],
  ['Money', 'Small leaks sink big ships. Log every spend, even the coffee.'],
  ['Money', 'Twenty-five thousand is just a lot of small, quiet yeses to saving.'],
  ['Money', 'Want it today, or want it more next year? Ask before you buy.'],
  ['Money', 'A budget is not a cage. It is a plan for your freedom.'],
  ['Money', 'Rich is a number in the bank, not a thing on your wrist.'],
  ['Money', 'Wait a day before anything over £20. Most wants pass.'],
  ['Learning', 'Band 7 is not talent. It is three hundred essays nobody saw.'],
  ['Learning', 'Say the new word out loud ten times. It is yours after that.'],
  ['Learning', 'Read slowly, write clearly, speak bravely.'],
  ['Learning', 'Every mistake you mark today is one the examiner never sees.'],
  ['Learning', 'An engineer is never finished learning. That is the job.'],
  ['Learning', 'Twenty minutes a day is two full working weeks of study in a year.'],
  ['Learning', 'You do not need to be fluent to start. You need to start to be fluent.'],
  ['Learning', 'Understanding is when you can explain it to someone else. Try it now.'],
  ['Learning', 'A drawing read correctly saves a part made wrong.'],
  ['Body', 'Train for the person who walks into that interview in a year.'],
  ['Body', 'Sleep is part of the plan, not a break from it.'],
  ['Body', 'Eight thousand steps clears the head better than any scroll.'],
  ['Body', 'The scale moves slowly. Your habits move it. Keep going.'],
  ['Body', 'One more rep is how strength is made.'],
  ['Body', 'Look after your body. It is the only place you have to live.'],
  ['Body', 'A walk solves more problems than another hour on the phone.'],
  ['Career', 'Applications are seeds. Plant two a day and stop counting.'],
  ['Career', 'Every no is one rejection closer to the yes that changes your life.'],
  ['Career', 'You have a degree, a plan and a work ethic. That is already a lot.'],
  ['Career', 'Tailor the first two lines. That is where they decide to read.'],
  ['Career', 'Your first engineering job is a door, not a final room. Walk through.'],
  ['Career', 'Prepare as if they will hire you tomorrow. One day they will.'],
  ['Career', 'Follow up. Most people do not, and that is your edge.'],
  ['Mind', 'Be patient with yourself. You are building a whole new life in a new country.'],
  ['Mind', 'Compare yourself with who you were last month, not with anyone else.'],
  ['Mind', 'Hard days count too. They are the ones that build you.'],
  ['Mind', 'You left home to build something. Look how far you have come already.'],
  ['Mind', 'Calm is a skill. Breathe in for four, out for six.'],
  ['Mind', 'Progress is quiet. Trust it even when you cannot hear it.'],
  ['Mind', 'Do your best today. That is all today ever asks.'],
  ['Mind', 'Your future self is watching. Make him proud.'],
  ['Mind', 'The plan is not to be perfect. The plan is to never quit.'],
  ['Mind', 'Stay soft with people, sharp with your goals.'],
  ['Mind', 'One good fortnight beats one perfect day.']
];

function mvState(){
  if (!state.motivation || typeof state.motivation !== 'object') state.motivation = {};
  const m = state.motivation;
  if (!Array.isArray(m.mine)) m.mine = [];
  if (!Array.isArray(m.favs)) m.favs = [];
  return m;
}
const MV = { shift:0, del:null };
function mvPool(){
  const m = mvState();
  // your own lines show up twice as often as the built-in ones
  // kept lines join again too, so they come back more often
  const kept = m.favs.filter(t => !m.mine.includes(t)).map(t => [(MV_QUOTES.find(q => q[1] === t) || ['Kept'])[0], t]);
  return [...MV_QUOTES, ...m.mine.map(t => ['Your line', t]), ...m.mine.map(t => ['Your line', t]), ...kept];
}
function mvDayNo(){ return Math.floor(parseKey(dkey()).getTime() / 864e5); }
function mvPick(offset = 0){
  const p = mvPool();
  // a fixed shuffle step keeps neighbouring days on different topics
  const i = ((mvDayNo() * 7 + offset) % p.length + p.length) % p.length;
  return p[i];
}

/* the short quote card the fill system and the Review tab use */
quoteHTML = function(){ const q = mvPick(13); return `<div class="glass qt"><span class="qt-mark">${ic('quote', 26)}</span><p>${esc(q[1])}</p><i></i></div>`; };

/* ---------- the letter, written from today's numbers ---------- */
function mvFirstName(){ const n = (state.profile && state.profile.name) || ''; return (n.split(/\s+/)[0] || (state.profile && state.profile.display) || 'friend'); }
function mvLetter(){
  const k = dkey(), list = tasksForDay(k), done = countDone(k), total = list.length, h = new Date().getHours(), name = mvFirstName();
  const day = mvDayNo(), streak = currentStreak(), best = bestStreak();
  const greet = h < 12 ? `Good morning, ${name}.` : h < 18 ? `Good afternoon, ${name}.` : `Good evening, ${name}.`;
  const lines = [];

  // today
  const next = typeof upNext === 'function' ? upNext() : null;
  if (!total) lines.push('Today is a rest day. Rest properly. It is part of the plan.');
  else if (done >= total) lines.push('Every task is done today. Rest without guilt, because you earned it.');
  else if (done === 0) lines.push(`The day is still wide open. Start with the first one${next ? `: ${next.name.toLowerCase()}` : ''}. Momentum does the rest.`);
  else lines.push(`${done} done, ${total - done} to go${next ? `. Next up is ${next.name.toLowerCase()}` : ''}. ${done >= 4 ? 'The streak day is already safe.' : `${4 - done} more and today counts.`}`);

  // the rotating middle: two of these each day, in a different order
  const extra = [];
  if (streak >= 2) extra.push(`${streak} days in a row now${best > streak ? `, and your best is ${best}` : streak >= best && streak > 2 ? ', which is your best ever' : ''}. You keep promises to yourself. That is who you are now.`);
  else extra.push('Yesterday is closed. Four tasks today starts a new streak, and every long streak started with day one.');
  const saved = typeof savedTotal === 'function' ? savedTotal() : 0, goal = Number(state.settings.goal) || 25000;
  if (saved > 0){ const left = Math.max(1, 366 - (typeof planDay === 'function' ? planDay() : 1)), per = Math.max(0, (goal - saved) / left);
    extra.push(`You have saved ${money0(saved)}, which is ${Math.round(saved / goal * 100)}% of the ${money0(goal)} target. About ${money0(per)} a day keeps you on track.`); }
  else extra.push(`The ${money0(goal)} year starts with the first small transfer. Put something in the pot this week, even £10.`);
  const ex = state.settings.examDate;
  if (ex){ const dl = daysBetween(k, ex); if (dl > 0) extra.push(`${dl} days to IELTS. Every essay and cue card is a deposit towards band 7.`); else if (dl === 0) extra.push('Exam day. You have done the work. Read the question twice and trust your practice.'); }
  else extra.push('Pick your IELTS date when you are ready. A date turns practice into a plan.');
  try { const s = periodStats(dkey(addDays(new Date(), -13)), k), sc = areaScores(s), low = AREAS.slice().sort((a, b) => sc[a[0]] - sc[b[0]])[0];
    if (s.days >= 3) extra.push(`Your quietest area these two weeks is ${areaLow(low[1])}. One small win there today will lift the whole wheel.`); } catch(_){}
  extra.push('You moved country, finished an engineering degree and you are still building. Do not forget how strong that is.');
  for (let i = 0; i < 2 && extra.length; i++) lines.push(extra.splice((day + i * 3) % extra.length, 1)[0]);

  const close = ['Small, boring, repeated. That is the whole method.', 'Keep going. I am proud of you.', 'One day at a time. This one counts.', 'I am rooting for you, always.', 'Do your best today. It is enough.'][day % 5];
  return { greet, lines, close };
}

/* three small numbers under the quote on wide screens */
function mvStatsHTML(){
  const k = dkey(), done = countDone(k), tot = tasksForDay(k).length, goal = Number(state.settings.goal) || 25000, saved = typeof savedTotal === 'function' ? savedTotal() : 0;
  const cell = (v, l) => `<div><b class="num">${v}</b><span>${l}</span></div>`;
  return `<div class="mv-stats">${cell(currentStreak(), 'day streak')}${cell(`${done}/${tot}`, 'tasks today')}${cell(Math.round(saved / goal * 100) + '%', 'of ' + money0(goal))}</div>`;
}
function mvHTML(){
  const m = mvState(), q = mvPick(MV.shift), fav = m.favs.includes(q[1]), L = mvLetter(), speak = 'speechSynthesis' in window;
  const date = new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' });
  return `<section class="mv-top"><div class="h2">Morning letter <span class="side">${esc(date)}</span></div>
  <div class="glass mv" id="mvCard">
    <div class="mv-q">
      <span class="mv-mark" aria-hidden="true">${ic('quote', 30)}</span>
      <div class="mv-qb">
        <span class="mv-cat">${esc(q[0])}</span>
        <p class="mv-qt">${esc(q[1])}</p>
      </div>
      <div class="mv-acts">
        <button class="mv-ib ${fav ? 'on' : ''}" data-mv="fav" aria-pressed="${fav}" aria-label="${fav ? 'Remove from kept lines' : 'Keep this line'}">${ic('heart', 17)}</button>
        <button class="mv-ib" data-mv="next" aria-label="Show another line">${ic('rotate', 17)}</button>
      </div>
      ${mvStatsHTML()}
    </div>
    <div class="mv-letter">
      <p class="mv-hi">${esc(L.greet)}</p>
      ${L.lines.map(t => `<p>${esc(t)}</p>`).join('')}
      <p class="mv-close">${esc(L.close)}</p>
      <p class="mv-sign">— ${esc(mvFirstName())}, one year from now</p>
    </div>
    <div class="mv-foot">
      ${speak ? `<button class="btn btn-soft btn-sm" data-mv="read">${ic('speaker', 15)}<span>Read it to me</span></button>` : ''}
      <button class="btn btn-soft btn-sm" data-mv="mine" aria-expanded="${MV.open ? 'true' : 'false'}" aria-controls="mvMine">${ic('plus', 15)}<span>Your lines${m.mine.length ? ` · ${m.mine.length}` : ''}</span></button>
    </div>
    <div class="mv-mine" id="mvMine" ${MV.open ? '' : 'hidden'}>
      <div class="tiny">Write the lines that get you going. They show up in the quote of the day twice as often as the built-in ones.</div>
      <div class="mv-add"><input id="mvIn" class="mv-in" maxlength="200" placeholder="e.g. I came here to build something. Build it." aria-label="Your own motivation line"><button class="btn btn-sm" data-mv="add">Add</button></div>
      ${m.mine.length ? `<ul class="mv-list">${m.mine.map((t, i) => `<li><span>${esc(t)}</span><button class="mv-x ${MV.del === i ? 'sure' : ''}" data-mv="del" data-i="${i}" aria-label="${MV.del === i ? 'Tap again to remove' : 'Remove this line'}">${MV.del === i ? 'Remove?' : ic('x', 14)}</button></li>`).join('')}</ul>` : ''}
      ${m.favs.length ? `<div class="tiny mv-kept">${ic('heart', 13)} ${m.favs.length} ${m.favs.length > 1 ? 'kept lines come' : 'kept line comes'} back more often.</div>` : ''}
    </div>
  </div></section>`;
}

/* point the quote of the day at a given line (the pool changes size when you add or keep one) */
function mvShow(t){ const p = mvPool(), i = p.findIndex(q => q[1] === t); if (i >= 0) MV.shift = i - ((mvDayNo() * 7) % p.length); }
function mvRedraw(focusIn){
  const el = document.getElementById('mvCard'); if (!el) return;
  const box = document.createElement('div'); box.innerHTML = mvHTML();
  const fresh = box.querySelector('#mvCard'); el.replaceWith(fresh);
  if (focusIn) document.getElementById('mvIn')?.focus();
  if (typeof fillView === 'function') { clearTimeout(MV.ft); MV.ft = setTimeout(() => { try { fillView(activeTab); } catch(_){} }, 60); }
}
function mvAdd(){
  const inp = document.getElementById('mvIn'), t = (inp && inp.value || '').trim().replace(/\s+/g, ' ').slice(0, 200);
  if (!t) { inp && inp.focus(); return; }
  const m = mvState(); if (m.mine.includes(t)) { toast('You already have that line.', 'ok', 1400); return; }
  m.mine.unshift(t); m.mine = m.mine.slice(0, 60); save();
  mvShow(t);
  mvRedraw(true); toast('Added. It is today’s line now.', 'ok', 1600);
}

/* the letter opens the Today tab, above everything else (the user asked for it at the top) */
renderToday = (orig => function(){ return mvHTML() + orig.apply(this, arguments); })(renderToday);

document.addEventListener('click', e => {
  const b = e.target.closest('[data-mv]'); if (!b) return;
  e.stopPropagation();
  const a = b.dataset.mv, m = mvState();
  if (a === 'next'){ MV.shift++; MV.del = null; mvRedraw(); document.querySelector('#mvCard .mv-qt')?.classList.add('swap'); }
  else if (a === 'fav'){ const t = mvPick(MV.shift)[1], i = m.favs.indexOf(t);
    if (i >= 0) { m.favs.splice(i, 1); } else { m.favs.unshift(t); m.favs = m.favs.slice(0, 80); }
    save(); mvShow(t); mvRedraw(); toast(i >= 0 ? 'Removed from your kept lines.' : 'Kept. It will come back more often.', 'ok', 1500); }
  else if (a === 'mine'){ MV.open = !MV.open; MV.del = null; mvRedraw(MV.open); }
  else if (a === 'add') mvAdd();
  else if (a === 'del'){ const i = +b.dataset.i;
    if (MV.del === i){ m.mine.splice(i, 1); MV.del = null; save(); mvRedraw(); toast('Line removed.', 'ok', 1200); }
    else { MV.del = i; mvRedraw(); } }
  else if (a === 'read'){
    const ss = window.speechSynthesis; if (!ss) return;
    if (ss.speaking){ ss.cancel(); return; }
    const L = mvLetter(), u = new SpeechSynthesisUtterance([mvPick(MV.shift)[1], L.greet, ...L.lines, L.close].join(' '));
    u.lang = 'en-GB'; u.rate = (state.voiceRate || 1) * .95; voiceSay(u); ss.speak(u);
  }
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'mvIn'){ e.preventDefault(); mvAdd(); } });
