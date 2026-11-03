/* ============================================================
   SETTINGS · redesign (3 Nov 2026, from settings research)
   - "Me" card at the top of the menu (avatar, name, day and streak)
   - grouped menu (You / App / Data), coloured icon tiles, each item
     shows its current value
   - an icon on every setting row, search across all settings
   - phones: menu list first, a page opens with a back button
   - reset kept apart from the other data buttons
   ============================================================ */
const SET_GROUPS = [
  ['You', 'you', [['profile', 'user', 'Me'], ['goals', 'target', 'Goals and money']]],
  ['App', 'app', [['look', 'palette', 'Look and motion'], ['coach', 'headset', 'Coach and voice'], ['auto', 'robot', 'Autopilot'], ['tips', 'bell', 'Tips']]],
  ['Data', 'data', [['data', 'shield', 'Your data']]]
];
const SET_ICO = {
  'profile.display':'sparkle', 'profile.name':'user', 'profile.city':'compass', 'profile.heightCm':'scale', 'profile.weightStart':'scale', 'profile.weightTarget':'target',
  theme:'sun', reduceMotion:'pause', railOpen:'menu', chatFab:'headset',
  'settings.goal':'piggy', 'settings.income':'wallet', 'settings.opening':'pound', 'settings.stepsGoal':'steps', 'settings.ieltsTarget':'pen', 'settings.examDate':'calendar', 'settings.planStart':'calendar', streakSaver:'flame',
  aiMode:'robot', aiCap:'gauge', aiDeep:'sparkles', voiceOut:'volume', voiceRate:'clock', voiceLang:'mic',
  'ap.on':'robot', 'ap.plan':'checklist', 'ap.checkins':'calendar', 'ap.tips':'bell', 'ap.carry':'arrowRight', 'autopilot.anchor':'calendar',
  tipsShow:'bell', backupAuto:'download'
};
function setStatus(sec){
  const s = state.settings || {}, a = typeof apState === 'function' ? apState() : {};
  if (sec === 'profile') return [state.profile.city, state.profile.degree ? 'BEng' : ''].filter(Boolean).join(' · ') || 'Name and body';
  if (sec === 'goals') return `${money0(+s.goal || 25000)} · ${(+s.stepsGoal || 8000).toLocaleString('en-GB')} steps`;
  if (sec === 'look') return `${(typeof SKINS !== 'undefined' && SKINS[state.skin || 'crimson'] || { name:'Crimson pearl' }).name} · ${({ auto:'Auto', light:'Light', dark:'Dark' })[state.theme || 'auto']}`;
  if (sec === 'coach'){ const v = typeof pickVoice === 'function' ? pickVoice() : null; return `${({ saver:'Saver', smart:'Smart', off:'Off' })[state.aiMode || 'saver']}${v ? ' · ' + v.name.replace(/^(Microsoft|Google) /, '').split(/[ (]/)[0] : ''}`; }
  if (sec === 'auto') return a.on === false ? 'Off' : 'On';
  if (sec === 'tips') return state.tipsShow === false ? 'Hidden' : 'Shown on Today';
  if (sec === 'data'){ const b = state.backup || {}; return b.last ? `Backup ${daysBetween(b.last, dkey())} days ago` : 'No backup yet'; }
  return '';
}
function setMeCard(){
  const day = typeof planDay === 'function' ? planDay() : 1, st = currentStreak();
  return `<button class="set-me${SET.sec === 'profile' ? ' on' : ''}" data-set-sec="profile" aria-label="Me: ${esc(displayName())}">
    <span class="set-av big">${esc(displayInitials())}</span>
    <span class="set-me-t"><b>${esc(displayName())}</b><small>Day ${day} of 365 · ${st}-day streak</small></span>${ic('chevron', 16)}</button>`;
}
function setNavHTML(){
  return `${setMeCard()}
    <label class="set-search">${ic('compass', 15)}<input id="setQ" type="search" placeholder="Search settings" aria-label="Search settings" autocomplete="off"></label>
    ${SET_GROUPS.map(([g, cls, items]) => `<div class="set-grp">${esc(g)}</div>${items.filter(([k]) => k !== 'profile').map(([k, i, l]) =>
      `<button class="set-ni ${cls}${k === SET.sec ? ' on' : ''}" data-set-sec="${k}"><span class="set-tile">${ic(i, 16)}</span><span class="set-ni-t"><span>${l}</span><small>${esc(setStatus(k))}</small></span>${ic('chevron', 14)}</button>`).join('')}`).join('')}`;
}
setHTML = function(){
  return `<div class="set-ov" id="setOv" role="dialog" aria-modal="true" aria-label="Settings">
    <div class="set-sheet${SET.page ? ' paged' : ''}">
      <aside class="set-nav">${setNavHTML()}</aside>
      <section class="set-body" id="setBody">${setBody(SET.sec)}</section>
      <button class="set-back" data-set-back aria-label="Back to settings">${ic('chevron', 18)}<span>Settings</span></button>
      <button class="set-x" data-set-close aria-label="Close settings">${ic('x', 18)}</button>
    </div></div>`;
};

/* the Me page: a profile card above the fields */
function setMeHero(){
  const saved = typeof savedTotal === 'function' ? savedTotal() : 0, ess = ((state.ielts || {}).essays || []).length, p = state.profile;
  const chip = (v, l, i) => `<div class="set-chip">${ic(i, 15)}<b class="num">${v}</b><small>${l}</small></div>`;
  return `<div class="set-hero">
    <span class="set-av huge">${esc(displayInitials())}</span>
    <div class="set-hero-t"><b>${esc(displayName())}</b><span>${esc(p.name || '')}</span><small>${esc([p.city, p.degree].filter(Boolean).join(' · '))}</small></div>
    <div class="set-chips">${chip(typeof planDay === 'function' ? planDay() : 1, 'day of 365', 'calendar')}${chip(currentStreak(), 'day streak', 'flame')}${chip(money0(saved), 'saved', 'piggy')}${chip(ess, 'essays', 'pen')}</div>
  </div>`;
}

/* every row gets an icon; the Me page gets its card; reset sits on its own */
setBody = (orig => function(sec){
  let h = orig.apply(this, arguments);
  if (sec === 'profile') h = h.replace('<h3>Profile</h3>', '<h3>Me</h3>' + setMeHero());
  if (sec === 'data'){ const m = h.match(/<button class="set-btn danger"[^]*?<\/button>/); if (m){ h = h.replace(m[0], '') + `<div class="set-sub">Danger zone</div><div class="set-danger"><span>Reset everything<small>Deletes all your logged data in this browser. Export a backup first.</small></span>${m[0]}</div>`; } }
  const t = document.createElement('template'); t.innerHTML = h;
  t.content.querySelectorAll('.set-f').forEach(f => {
    if (f.querySelector(':scope > .set-ic')) return;
    const el = f.querySelector('[data-set],[data-set-tg],[data-set-seg]'), key = f.dataset.ico ? '' : el ? (el.dataset.set || el.dataset.setTg || el.dataset.setSeg) : '';
    const name = f.dataset.ico || SET_ICO[key] || (/skin|tint|accent|blur|glass|depth|round|solid/i.test(f.textContent) ? 'palette' : 'sliders');
    const span = document.createElement('span'); span.className = 'set-ic'; span.innerHTML = ic(name, 16); f.prepend(span); f.classList.add('has-ic');
  });
  return t.innerHTML;
})(setBody);

/* search across every page */
function setSearch(q){
  const body = document.getElementById('setBody'); if (!body) return;
  q = q.trim().toLowerCase();
  if (!q){ body.innerHTML = setBody(SET.sec); return; }
  let out = '';
  SET_GROUPS.forEach(([, , items]) => items.forEach(([k, i, l]) => {
    const t = document.createElement('template'); t.innerHTML = setBody(k);
    const hits = [...t.content.querySelectorAll('.set-f')].filter(f => f.textContent.toLowerCase().includes(q) || l.toLowerCase().includes(q));
    if (hits.length) out += `<div class="set-sub set-hit">${ic(i, 14)} ${esc(l)} <button class="set-btn sm" data-set-sec="${k}">Open</button></div>` + hits.map(f => f.outerHTML).join('');
  }));
  body.innerHTML = `<h3>Results</h3>` + (out || `<p class="set-note">Nothing matches “${esc(q)}”.</p>`);
  SET.page = true; document.querySelector('#setOv .set-sheet')?.classList.add('paged');
}
document.addEventListener('input', e => { if (e.target.id === 'setQ'){ clearTimeout(SET.qt); SET.qt = setTimeout(() => setSearch(e.target.value), 120); } });

/* phones: picking a page slides it in; Back returns to the menu. Menu values refresh after changes. */
document.addEventListener('click', e => {
  const ov = e.target.closest('#setOv'); if (!ov) return;
  const sheet = ov.querySelector('.set-sheet');
  if (e.target.closest('[data-set-back]')){ e.stopPropagation(); SET.page = false; sheet.classList.remove('paged'); return; }
  const sec = e.target.closest('[data-set-sec]');
  if (sec){ SET.page = true; sheet.classList.add('paged'); const q = document.getElementById('setQ'); if (q && q.value && !sec.closest('.set-body')) q.value = '';
    ov.querySelectorAll('.set-me').forEach(b => b.classList.toggle('on', sec.dataset.setSec === 'profile'));
    if (sec.closest('.set-body')){ ov.querySelectorAll('.set-ni').forEach(b => b.classList.toggle('on', b.dataset.setSec === sec.dataset.setSec)); const body = document.getElementById('setBody'); body.innerHTML = setBody(SET.sec = sec.dataset.setSec); const q2 = document.getElementById('setQ'); if (q2) q2.value = ''; }
    setTimeout(() => document.getElementById('setBody')?.scrollTo(0, 0), 0); return; }
  if (e.target.closest('[data-set-tg],[data-set-seg]')) setTimeout(setNavRefresh, 30);
}, true);
document.addEventListener('change', e => { if (e.target.closest && e.target.closest('#setOv')) setTimeout(setNavRefresh, 60); });
function setNavRefresh(){
  const nav = document.querySelector('#setOv .set-nav'); if (!nav) return;
  nav.querySelectorAll('.set-ni').forEach(b => { const s = b.querySelector('small'); if (s) s.textContent = setStatus(b.dataset.setSec); });
  const me = nav.querySelector('.set-me'); if (me){ me.querySelector('b').textContent = displayName(); me.querySelector('.set-av').textContent = displayInitials(); }
}
/* opening Settings on a phone shows the menu first */
setOpen = (orig => function(sec){ SET.page = !!sec; return orig.apply(this, arguments); })(setOpen);
