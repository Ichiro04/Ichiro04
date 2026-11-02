/* ============================================================
   SIDE RAIL — main navigation on screens 900px and wider.
   Collapsed: a slim column of icons (active one in a filled
   circle, names as tooltips). Expanded: a glass sidebar with
   sections, icons and names. The round arrow button switches.
   Phones keep the floating bottom tab bar.
   ============================================================ */
const RAIL_MQ = window.matchMedia ? window.matchMedia('(min-width: 900px)') : { matches:false, addEventListener(){} };
function railHTML(){
  const open = !!state.railOpen;
  const item = (t) => `<button class="rail-i${t.id===activeTab?' on':''}" data-rail="${t.id}" role="tab" aria-selected="${t.id===activeTab}" aria-label="${t.name}">
      <span class="rail-ic">${ic(t.icon, 19)}</span><span class="rail-n">${t.name}</span><span class="rail-tip" aria-hidden="true">${t.name}</span></button>`;
  const extra = (id, icon, name) => `<button class="rail-i" data-rail-x="${id}" aria-label="${name}"><span class="rail-ic">${ic(icon, 19)}</span><span class="rail-n">${name}</span><span class="rail-tip" aria-hidden="true">${name}</span></button>`;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return `<nav class="rail${open?' open':''}" id="rail" aria-label="Sections">
    <div class="rail-brand"><span class="rail-logo" aria-hidden="true"></span><span class="rail-bt"><b>KsHan</b><small>Personal growth</small></span></div>
    <div class="rail-sec">Main menu</div>
    <div class="rail-list" role="tablist"><span class="rail-lens" aria-hidden="true"><i></i></span>${TABS.map(item).join('')}</div>
    <div class="rail-sec">Explore</div>
    <div class="rail-list">${extra('map','gauge','Knowledge map')}${extra('cad','wrench','CAD workspace')}${extra('theme', dark ? 'sun' : 'moon', dark ? 'Light mode' : 'Dark mode')}</div>
    <div class="rail-foot"><span class="rail-av">KS</span><span class="rail-bt"><b>KsHan</b><small>${todayDone()}/${todayTotal()} today · ${currentStreak()}-day streak</small></span></div>
    <button class="rail-tog" data-rail-tog aria-label="${open?'Collapse':'Expand'} the side menu" aria-expanded="${open}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
  </nav>`;
}
function mountRail(){
  const old = document.getElementById('rail'), html = railHTML();
  if (old) old.outerHTML = html; else document.body.insertAdjacentHTML('beforeend', html);
  document.body.classList.toggle('has-rail', RAIL_MQ.matches);
  document.body.classList.toggle('rail-open', RAIL_MQ.matches && !!state.railOpen);
  requestAnimationFrame(()=>railLens(false));
}
function railLens(travel){ const r = document.getElementById('rail'), lens = r && r.querySelector('.rail-lens'), on = r && r.querySelector('[data-rail].on'); if (!lens || !on) return;
  lens.style.transform = `translateY(${on.offsetTop}px)`; lens.style.height = on.offsetHeight + 'px';
  if (travel && !motionOff()){ const i = lens.firstElementChild; i.classList.remove('go'); void i.offsetWidth; i.classList.add('go'); } }
function railSync(){ const r = document.getElementById('rail'); if (!r) return; const before = r.querySelector('[data-rail].on'); r.querySelectorAll('[data-rail]').forEach(b=>{ const on = b.dataset.rail === activeTab; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); }); railLens(before !== r.querySelector('[data-rail].on'));
  const f = r.querySelector('.rail-foot small'); if (f) f.textContent = `${todayDone()}/${todayTotal()} today · ${currentStreak()}-day streak`; }
document.addEventListener('click', e=>{
  const r = e.target.closest('#rail'); if (!r) return;
  const t = e.target.closest('[data-rail]'), x = e.target.closest('[data-rail-x]'), tog = e.target.closest('[data-rail-tog]');
  if (tog){ e.stopPropagation(); state.railOpen = !state.railOpen; save(); r.classList.toggle('open', state.railOpen); document.body.classList.toggle('rail-open', state.railOpen); tog.setAttribute('aria-expanded', String(state.railOpen)); tog.setAttribute('aria-label', (state.railOpen?'Collapse':'Expand') + ' the side menu'); setTimeout(()=>{ try { moveLens(); } catch(_){} if (typeof wsKick==='function') wsKick(); }, 380); return; }
  if (t){ e.stopPropagation(); setTab(t.dataset.rail); return; }
  if (x){ e.stopPropagation(); const id = x.dataset.railX;
    if (id==='map' && typeof kmOpen==='function') kmOpen();
    else if (id==='cad'){ labPane = 'cad'; setTab('lab', { force:true }); setTimeout(()=>{ try { showLabPane('cad'); const c = document.getElementById('cws'); if (c) c.scrollIntoView({ behavior: motionOff() ? 'auto' : 'smooth', block:'start' }); } catch(_){} }, 120); }
    else if (id==='theme'){ const dark = document.documentElement.getAttribute('data-theme') === 'dark'; state.theme = dark ? 'light' : 'dark'; save(); applyTheme(); mountRail(); }
  }
}, true);
/* keep the rail in step with the app */
{ const _setTab = setTab; setTab = function(tab, opts){ const r = _setTab(tab, opts); railSync(); return r; }; }
{ const _uc = updateChrome; updateChrome = function(){ const r = _uc.apply(this, arguments); railSync(); return r; }; }
(RAIL_MQ.addEventListener ? RAIL_MQ.addEventListener.bind(RAIL_MQ, 'change') : RAIL_MQ.addListener.bind(RAIL_MQ))(()=>mountRail());
