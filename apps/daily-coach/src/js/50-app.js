/* ============================================================
   APP · chrome, motion, interaction, coach engine
   ============================================================ */

/* ---------- theme ---------- */
const mqDark = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){
  const want = state.theme === 'auto' ? (mqDark.matches ? 'dark' : 'light') : state.theme;
  document.documentElement.setAttribute('data-theme', want);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', want === 'dark' ? '#0A0A0D' : '#F3F4F6');
  syncLabTheme();
}
function applyMotion(){
  const on = state.reduceMotion || REDUCE_QUERY.matches;
  document.documentElement.classList.toggle('reduce', on);
}
mqDark.addEventListener('change', ()=>{ if (state.theme==='auto') applyTheme(); });
REDUCE_QUERY.addEventListener('change', applyMotion);

/* refract only where backdrop-filter actually accepts an SVG filter (Chromium) */
(function refract(){
  const ua = navigator.userAgent;
  const chromium = /Chrome\/|Edg\/|OPR\/|SamsungBrowser/.test(ua) && !/Firefox\//.test(ua);
  if (chromium){
    try { if (CSS.supports('backdrop-filter','blur(2px)') || CSS.supports('-webkit-backdrop-filter','blur(2px)')) document.documentElement.classList.add('has-refract'); } catch(e){}
  }
})();

/* ---------- tabs ---------- */
const TABS = [
  { id:'today',    name:'Today',    icon:'today',    title:'Today',    sub:'Small, boring, repeated. That is the whole method.' },
  { id:'train',    name:'Train',    icon:'dumbbell', title:'Train',    sub:'Three sessions a week, no equipment, add a rep.' },
  { id:'learn',    name:'Learn',    icon:'book',     title:'Learn',    sub:'Band 7+ English and the engineering that gets you hired.' },
  { id:'lab',      name:'Lab',      icon:'gears',    title:'Lab',      sub:'CAD, a real test bench and your engineering path.' },
  { id:'money',    name:'Money',    icon:'wallet',   title:'Money',    sub:'£25,000 in twelve months, one logged coffee at a time.' },
  { id:'progress', name:'Progress', icon:'chart',    title:'Progress', sub:'Evidence, not vibes.' },
  { id:'coach',    name:'Coach',    icon:'sparkles', title:'Coach',    sub:'The honest read on your week.' }
];
let activeTab = 'today';

function buildTabbar(){
  const bar = $('#tabbar');
  bar.insertAdjacentHTML('beforeend', TABS.map(t=>`
    <button class="tab" id="tab-${t.id}" role="tab" aria-selected="${t.id===activeTab}" aria-controls="view-${t.id}" data-tab="${t.id}">
      <span class="tic">${ic(t.icon,21)}</span>
      <span class="tname">${t.name}</span>
    </button>`).join(''));
}
function moveLens(){
  const lens = $('#lens'); const tab = $(`.tab[data-tab="${activeTab}"]`);
  if (!lens || !tab) return;
  lens.style.width = tab.offsetWidth + 'px';
  lens.style.transform = `translateX(${tab.offsetLeft - 7}px)`;
  if (!motionOff()){
    lens.classList.remove('travelling');
    void lens.offsetWidth;
    lens.classList.add('travelling');
    lens.addEventListener('animationend', ()=>lens.classList.remove('travelling'), { once:true });
  }
}

function heroHTML(tab){
  const t = TABS.find(x=>x.id===tab);
  const words = t.sub.split(' ');
  return `<div class="eyebrow"><span class="pip"></span><span>${esc(prettyDate())}</span></div>
    <h1 class="rise">${esc(t.title)}</h1>
    <p class="sub">${words.map((w,i)=>`<span class="reveal-w"><span style="--i:${Math.min(i,14)}">${esc(w)}</span></span>`).join(' ')}</p>`;
}
function renderView(tab){
  const el = $('#view-'+tab);
  if (tab === 'lab'){ el.className = 'view'; mountLab(el); return; }
  const wide = { today:true, learn:true, progress:true }[tab] ? ' wide' : '';
  el.className = 'view' + wide + (motionOff() ? '' : ' cascade');
  const map = { today:renderToday, train:renderTrain, learn:renderLearn, money:renderMoney, progress:renderProgress, coach:renderCoach };
  el.innerHTML = (map[tab] || renderToday)();
  // each section arrives a beat after the one above it
  if (!motionOff()) Array.from(el.children).forEach((c,i)=>{ if (i < 12) c.style.setProperty('--ci', i); });
  if (tab === 'coach') mountChatScroll();
}
function setTab(tab, opts={}){
  if (tab === activeTab && !opts.force) return;
  const oldView = $('#view-'+activeTab), newView = $('#view-'+tab);
  const dir = TABS.findIndex(t=>t.id===tab) > TABS.findIndex(t=>t.id===activeTab) ? 1 : -1;
  activeTab = tab;
  TABS.forEach(t=>$('#tab-'+t.id).setAttribute('aria-selected', String(t.id===tab)));
  moveLens();
  const newIcon = $('#tab-'+tab) && $('#tab-'+tab).querySelector('.tic');
  if (newIcon && !motionOff()){
    newIcon.style.animation = 'none'; void newIcon.offsetWidth;
    newIcon.style.animation = 'tabPop .5s var(--ease-spring) forwards';
  }
  const hero = $('#hero');
  hero.innerHTML = heroHTML(tab);
  hero.style.setProperty('--vx', dir*18+'px');
  renderView(tab);
  newView.hidden = false;
  newView.style.setProperty('--vx', dir*18+'px');
  newView.classList.remove('leaving');
  void newView.offsetWidth;
  newView.style.animation = 'none'; void newView.offsetWidth; newView.style.animation = '';
  if (oldView && oldView !== newView){
    oldView.hidden = true;
  }
  if (tab === 'train') trainDayKey = dkey();
  window.scrollTo(0, 0);
  document.body.classList.remove('condensed');
  updateChrome();
  $('#fabwrap').style.display = (tab === 'money') ? '' : 'none';
  $('#fabwrap').classList.remove('tucked'); closeFab();
  $('#fabwrap').setAttribute('aria-hidden', tab === 'money' ? 'false':'true');
}

/* ---------- condensed title bar on scroll ---------- */
let lastScroll = 0;
function updateChrome(){
  const since = {
    today: `${todayDone()}/${todayTotal()} today`,
    train: `${sessionDonePct(dkey())}% logged`,
    learn: `${Object.keys(state.knowledge).length}/${KNOWLEDGE_PACKS.length} packs`,
    money: money0(savedTotal()),
    progress: `${currentStreak()}-day streak`,
    coach: ''
  }[activeTab] || '';
  $('#miniTitle').textContent = (TABS.find(t=>t.id===activeTab)||{title:''}).title;
  $('#miniSince').textContent = since;
  $('#miniMark').innerHTML = ic((TABS.find(t=>t.id===activeTab)||{icon:'today'}).icon, 19);
  $('#miniDot').style.display = activeTab==='today' && upNext() ? '' : 'none';
}
let fabTucked = false;
function onScroll(){
  const y = window.scrollY || 0;
  document.body.classList.toggle('condensed', y > 44);
  document.documentElement.style.setProperty('--sy', y.toFixed(0));
  if (activeTab === 'money'){
    const fab = $('#fabwrap');
    const down = y > lastScroll + 6;
    const up = y < lastScroll - 6;
    if (down && y > 260 && !fabTucked){ fabTucked = true; fab.classList.add('tucked'); closeFab(); }
    else if (up && fabTucked){ fabTucked = false; fab.classList.remove('tucked'); }
    if (y < 60 && fabTucked){ fabTucked = false; fab.classList.remove('tucked'); }
  }
  lastScroll = y;
}
window.addEventListener('scroll', ()=>{ requestAnimationFrame(onScroll); }, { passive:true });

/* ---------- bloom + press ---------- */
const motionOff = ()=> document.documentElement.classList.contains('reduce');

/* the light is scaled to the control it lands on, and capped small */
function bloomAt(x, y, host){
  if (motionOff()) return;
  const b = document.createElement('div');
  b.className = 'bloom';
  b.innerHTML = '<span class="core"></span><span class="ring"></span>';
  const w = host ? host.getBoundingClientRect().width : 44;
  // a chip lands small, a full-width row lands a little wider. Never a flare.
  const scale = clamp(1.7 + w/240, 1.7, 3.0).toFixed(2);
  b.style.setProperty('--bs', scale);
  b.style.left = x+'px'; b.style.top = y+'px';
  document.body.appendChild(b);
  setTimeout(()=>b.remove(), 560);
}
function sparkBurst(x, y, n=6, spread=26){
  if (motionOff()) return;
  for (let i=0;i<n;i++){
    const sp = document.createElement('div');
    sp.className = 'spark';
    const a = (Math.PI*2*i)/n + Math.random()*0.5;
    const r = spread*(0.6+Math.random()*0.7);
    sp.style.setProperty('--dx', (Math.cos(a)*r).toFixed(1)+'px');
    sp.style.setProperty('--dy', (Math.sin(a)*r - 6).toFixed(1)+'px');
    sp.style.left = x+'px'; sp.style.top = y+'px';
    sp.style.animationDelay = (i*14)+'ms';
    document.body.appendChild(sp);
    setTimeout(()=>sp.remove(), 760);
  }
}
document.addEventListener('pointerdown', e=>{
  const t = e.target.closest('.btn, .tab, .task, .setchip, .timer, .lrow, .exhead, .cuehead, .fab, .fabmenu button, .seg button, .chip');
  if (t) bloomAt(e.clientX, e.clientY, t);
}, { passive:true });

/* ---------- card tilt + glare (fine pointers only) ---------- */
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
document.addEventListener('pointermove', e=>{
  if (!finePointer.matches) return;

  // specular sheen on glass controls
  const ctrl = e.target.closest('.btn');
  if (ctrl){
    const r = ctrl.getBoundingClientRect();
    ctrl.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
    ctrl.style.setProperty('--my', ((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
  }
  // tide art leans toward the pointer
  const tide = e.target.closest('.tideart');
  if (tide){
    const r = tide.getBoundingClientRect();
    const off = clamp(((e.clientX-r.left)/r.width - .5) * 14, -8, 8);
    tide.style.setProperty('--tide-x', off.toFixed(1)+'px');
  }

  // soft light following the pointer around the page
  const cl = document.getElementById('cursorlight');
  if (cl){
    cl.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
    document.body.classList.add('pointer-live');
  }

  const card = e.target.closest('[data-tilt]');
  $$('[data-tilt]').forEach(c=>{ if (c!==card){ c.style.transform=''; c.classList.remove('tilting'); } });
  if (!card) return;
  const r = card.getBoundingClientRect();
  const px = (e.clientX - r.left)/r.width, py = (e.clientY - r.top)/r.height;
  const rx = (0.5-py)*4.2, ry = (px-0.5)*5.2;
  card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
  card.style.setProperty('--gx', (px*100).toFixed(1)+'%');
  card.style.setProperty('--gy', (py*100).toFixed(1)+'%');
  card.classList.add('tilting');
}, { passive:true });
document.addEventListener('pointerleave', ()=>{
  $$('[data-tilt]').forEach(c=>c.style.transform='');
  document.body.classList.remove('pointer-live');
}, { passive:true });

/* ---------- toast ---------- */
function toast(msg, kind='ok', ms=2600){
  const wrap = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + (kind==='warn'?'warn':'');
  el.innerHTML = `<span class="tic">${ic(kind==='warn'?'info':'check',16)}</span><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(), 320); }, ms);
}

/* ---------- sheet ---------- */
let sheetResolve = null;
function openSheet({ title, body, actions='' }){
  const scrim = $('#scrim'), sheet = $('#sheet');
  sheet.innerHTML = `<div class="grab"></div>
    <div class="shead"><h2 id="sheetTitle">${esc(title)}</h2><button class="sclose" data-a="close-sheet" aria-label="Close">${ic('x',17)}</button></div>
    <div class="sbody">${body}</div>`;
  scrim.hidden = false; sheet.hidden = false;
  void sheet.offsetWidth;
  scrim.classList.add('show'); sheet.classList.add('show');
  document.body.style.overflow = 'hidden';
  setTimeout(()=>{ const f = sheet.querySelector('input,select,textarea,button'); if (f) f.focus({preventScroll:true}); }, 420);
}
function closeSheet(){
  const scrim = $('#scrim'), sheet = $('#sheet');
  scrim.classList.remove('show'); sheet.classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(()=>{ scrim.hidden = true; sheet.hidden = true; sheet.innerHTML=''; }, 380);
}
$('#scrim').addEventListener('click', closeSheet);
document.addEventListener('keydown', e=>{
  if (e.key === 'Escape'){ closeSheet(); $('#fabwrap').classList.remove('open'); $('#fab').classList.remove('open'); $('#fab').setAttribute('aria-expanded','false'); }
});

/* ============================================================
   TIMERS  (cue prep/talk, rest)
   ============================================================ */
const T = {
  prep: { total:60, left:60, running:false, done:false },
  talk: { total:120, left:120, running:false, done:false },
  rest: { total:60, left:60, running:false, label:'Rest', active:false }
};
function fmt(s){ s = Math.max(0, Math.round(s)); return `${Math.floor(s/60)}:${pad2(s%60)}`; }
function renderCueTimer(which){
  const t = T[which];
  $$('[data-tv="'+which+'"]').forEach(valEl=>{
    valEl.textContent = fmt(t.left);
    const btn = valEl.closest('.timer');
    if (!btn) return;
    const barEl = btn.querySelector('[data-tb="'+which+'"]');
    if (barEl) barEl.style.width = ((1 - t.left/t.total)*100).toFixed(1)+'%';
    btn.classList.toggle('running', t.running);
    btn.classList.toggle('done', t.done);
  });
}
function renderRest(){
  const bar = $('#restbar'), t = T.rest;
  bar.classList.toggle('show', t.active);
  $('#restTime').textContent = fmt(Math.ceil(t.left));
  $('#restProg').style.width = ((1 - t.left/t.total)*100).toFixed(1)+'%';
  $('#restLabel').textContent = t.label;
}
function tickAll(dt){
  let changed = false;
  ['prep','talk'].forEach(w=>{
    const t = T[w];
    if (t.running) { t.left -= dt; if (t.left <= 0){ t.left = 0; t.running = false; t.done = true; changed = true; cueAlarm(w); } renderCueTimer(w); }
  });
  if (T.rest.active && T.rest.running){
    T.rest.left -= dt;
    if (T.rest.left <= 0){ T.rest.left = 0; T.rest.running = false; T.rest.active = false; restAlarm(); }
    renderRest();
  }
}
let lastTick = performance.now();
setInterval(()=>{
  const now = performance.now();
  const dt = Math.min(1, (now - lastTick)/1000);
  lastTick = now;
  tickAll(dt);
}, 250);

function cueAlarm(which){
  toast(which==='prep' ? 'Prep over — start talking. Two minutes, no stopping.' : 'Two minutes done. Note one thing to fix, then move on.', 'ok', 3400);
  vibrate([40,60,40]);
}
function restAlarm(){
  toast('Rest done — next set.', 'ok', 1800);
  vibrate([30,50,30]);
}
function vibrate(p){ try { if (navigator.vibrate) navigator.vibrate(p); } catch(e){} }
function startRest(secs, label='Rest'){
  T.rest.total = secs; T.rest.left = secs; T.rest.running = true; T.rest.active = true; T.rest.label = label;
  renderRest();
}
$('#restSkip').addEventListener('click', ()=>{ T.rest.active = false; T.rest.running = false; renderRest(); });
$('#restbar').addEventListener('click', e=>{
  if (e.target.closest('#restSkip')) return;
  T.rest.running = !T.rest.running; renderRest();
});

/* ============================================================
   ACTIONS
   ============================================================ */
function markTaskAuto(id, val){
  const k = dkey();
  if (taskDone(k,id) !== !!val){ setTask(k, id, !!val); }
}
function syncAutoTasks(){
  const k = dkey();
  const steps = dayRec(k).steps || 0;
  if (steps >= state.settings.stepsGoal && !taskDone(k,'walk')) { setTask(k,'walk',true); toast('8,000 steps logged. Nice.'); }
  if (sessionDonePct(k) >= 100 && !taskDone(k,'train') && todaysSession().blocks.length) { setTask(k,'train',true); }
}

document.addEventListener('click', e=>{
  const tabBtn = e.target.closest('.tab');
  if (tabBtn){ setTab(tabBtn.dataset.tab); return; }
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const a = el.dataset.a;

  switch(a){
    case 'task': {
      const id = el.dataset.id, k = dkey();
      const nowDone = !taskDone(k,id);
      setTask(k, id, nowDone);
      if (nowDone){
        const box = el.querySelector('.cbx');
        if (box){ const r = box.getBoundingClientRect(); sparkBurst(r.left + r.width/2, r.top + r.height/2, 7, 30); }
        const def = TASK_DEFS.find(t=>t.id===id);
        const n = countDone(k), tot = tasksForDay(k).length;
        if (n === tot) toast('Whole day cleared. The sun is up. 🌅','ok',3000);
        else if (n === STREAK_TARGET && currentStreak() > 1) toast(`Streak day secured · ${currentStreak()} days`,'ok',2600);
        else toast(`${def?def.name:'Task'} done · ${n}/${tot}`,'ok',1600);
        vibrate(18);
      }
      renderView('today'); updateChrome();
      if (nowDone){
        const fresh = $(`#view-today .task[data-id="${id}"]`);
        if (fresh && !motionOff()){ fresh.classList.add('just-done'); setTimeout(()=>fresh.classList.remove('just-done'), 640); }
      }
      break;
    }
    case 'go': {
      e.stopPropagation();
      const def = TASK_DEFS.find(t=>t.id === el.closest('.task')?.dataset.id);
      if (def && def.sub) learnTab = def.sub;
      setTab(el.dataset.go);
      break;
    }
    case 'start': {
      const go = el.dataset.go;
      const def0 = TASK_DEFS.find(t=>t.id === el.dataset.id);
      if (def0 && def0.sub) learnTab = def0.sub;
      toast(`Starting: ${el.closest('.upnext').querySelector('.name').textContent}`,'ok',1600);
      setTab(go === 'today' ? 'today' : go);
      if (go === 'today'){ const id = el.dataset.id; setTask(dkey(), id, true); renderView('today'); }
      break;
    }
    case 'cue-toggle': {
      const cue = $('#cue'); const open = cue.classList.toggle('open');
      el.setAttribute('aria-expanded', String(open));
      break;
    }
    case 'cue-done': {
      state.ielts.speaking[dkey()] = true;
      setTask(dkey(),'speaking', true);
      save(); renderView(activeTab); updateChrome();
      toast('Speaking logged. One card a day is enough.','ok',2200);
      break;
    }
    case 'cue-next': {
      state.ielts.cueSeen.__idx = ((state.ielts.cueSeen.__idx||0)+1) % CUE_CARDS.length;
      save(); renderView(activeTab);
      break;
    }
    case 'timer': {
      const w = el.dataset.which, secs = Number(el.dataset.secs)||60;
      if (w === 'walk'){ startRest(secs, 'Walk'); toast('30 minute walk started. Leave the phone in your pocket.','ok',2400); break; }
      const t = T[w];
      if (t.done || t.left >= t.total){ t.left = t.total; t.done = false; }
      t.running = !t.running;
      if (t.running) t.left = t.left <= 0 ? secs : t.left;
      t.total = secs;
      renderCueTimer(w);
      break;
    }
    case 'steps': {
      const k = dkey(), d = dayRec(k, true);
      d.steps = Math.max(0, (d.steps||0) + Number(el.dataset.d));
      save(); syncAutoTasks(); renderView('today'); updateChrome();
      break;
    }
    case 'train-day': {
      trainDayKey = el.dataset.key;
      renderView('train');
      break;
    }
    case 'ex-cue': {
      const row = el.closest('.ex'); const open = row.classList.toggle('open');
      el.setAttribute('aria-expanded', String(open));
      break;
    }
    case 'set': {
      const { key, ex, i, n, rest } = el.dataset;
      const nowOn = toggleSet(key, ex, Number(i), Number(n));
      if (nowOn && Number(rest) > 0) startRest(Number(rest), 'Rest');
      syncAutoTasks();
      renderView('train'); updateChrome();
      vibrate(14);
      break;
    }
    case 'rest': startRest(Number(el.dataset.secs), 'Rest'); break;
    case 'learn-tab': learnTab = el.dataset.id; renderView('learn'); break;
    case 'essay-new': {
      const i = ESSAY_PROMPTS.indexOf(essayPrompt);
      essayPrompt = ESSAY_PROMPTS[(i+1) % ESSAY_PROMPTS.length];
      renderView('learn'); break;
    }
    case 'essay-start': {
      toast('40 minutes. Phone face down. Start with the position sentence.','ok',3200);
      startRest(40*60, 'Essay');
      break;
    }
    case 'know-done': {
      state.knowledge[el.dataset.id] = dkey();
      setTask(dkey(),'knowledge', true); save();
      renderView('learn'); updateChrome();
      toast('Pack logged. Now say the three key points out loud.','ok',2600);
      break;
    }
    case 'words-toggle': wordsShow = !wordsShow; renderView('learn'); break;
    case 'lab-open': openLab(el.dataset.id); break;
    case 'pf': {
      state.career = state.career || { portfolio:{} };
      state.career.portfolio = state.career.portfolio || {};
      const id = el.dataset.id;
      if (state.career.portfolio[id]) delete state.career.portfolio[id]; else state.career.portfolio[id] = true;
      save(); renderView('learn');
      if (state.career.portfolio[id]) toast('Portfolio piece ticked. One page each is enough.', 'ok', 2200);
      break;
    }
    case 'huht': {
      state.career = state.career || { portfolio:{} };
      const cur = Object.assign({applied:true}, state.career.huht || {});
      const id = el.dataset.id; cur[id] = !cur[id]; state.career.huht = cur;
      save(); renderView('learn');
      if (cur[id] && id!=='applied') toast('Stage passed. Keep going.', 'ok', 2000);
      break;
    }
    case 'story':
    case 'qa': {
      const holder = el.closest('.story');
      const open = holder.classList.toggle('open');
      el.setAttribute('aria-expanded', String(open));
      break;
    }
    case 'pick-cat': {
      const form = el.closest('form');
      form.querySelector('[name=cat]').value = el.dataset.id;
      $$('.chip[data-a="pick-cat"]', form).forEach(c=>{ c.classList.remove('chip-deep'); c.setAttribute('aria-pressed','false'); });
      el.classList.add('chip-deep'); el.setAttribute('aria-pressed','true');
      break;
    }
    case 'del-expense': {
      state.expenses = state.expenses.filter(x=>x.id !== el.dataset.id);
      save(); renderView('money'); toast('Removed.','ok',1400);
      break;
    }
    case 'edit-fixed': {
      const f = state.settings.fixed.find(x=>x.id===el.dataset.id);
      openSheet({ title: f.name, body: `<form data-form="fixed" data-id="${f.id}" style="display:grid;gap:12px">
        <div class="field"><label for="fa">Monthly amount</label>
          <div class="input-prefix"><span class="pfx">£</span><input class="input" id="fa" name="amount" type="number" step="1" min="0" value="${f.amount}" required></div></div>
        <button class="btn btn-deep" type="submit">Save</button>
        <p class="tiny">Fixed costs come out first. Everything left is what you can actually save or spend.</p>
      </form>` });
      break;
    }
    case 'edit-plan': {
      openSheet({ title:'Chase the number', body:`
        <div class="kv"><span>Income</span><b>${money0(state.settings.income)}</b></div>
        <div class="kv"><span>Fixed costs</span><b>−${money0(fixedTotal())}</b></div>
        <div class="kv"><span>Free cash</span><b>${money0(freeAfterFixed())}</b></div>
        <div class="kv"><span>£25k needs</span><b>${money0(needPerMonth())}/mo</b></div>
        <div class="callout warn">${ic('info',14)} On £${Math.round(state.settings.income)} take-home with this cost base, the headline goal needs a second income stream. The gap card lists the realistic ones.</div>
        <p class="tiny">Tap any fixed cost in the plan card to change it. Income and goal live in Coach → Settings.</p>`});
      break;
    }
    case 'add-saving': {
      openSheet({ title:'Add to savings', body:`<form data-form="saving" style="display:grid;gap:12px">
        <div class="field"><label for="sv">Amount moved</label>
          <div class="input-prefix"><span class="pfx">£</span><input class="input" id="sv" name="amount" type="number" step="1" min="1" placeholder="250" required></div></div>
        <div class="field"><label for="sn">Note</label><input class="input" id="sn" name="note" placeholder="Payday transfer"></div>
        <button class="btn btn-primary" type="submit">${ic('piggy',16)} Bank it</button>
      </form>`});
      break;
    }
    case 'mobility-quick': {
      openSheet({ title:'10 minute mobility flow', body:`
        <div style="display:grid;gap:10px">
          ${[['Cat–cow','1 min, breathe into the ribs'],['90/90 hip switch','2 min, rock side to side'],['Calf + ankle rocks','2 min, knee over toes'],['Thread the needle','1 min each side'],['Dead bug','2 × 10 each side'],['Deep squat hold','1 min, heels down']].map(([n,d])=>`
            <div class="row between" style="gap:10px"><span><b style="font-size:14px">${n}</b><span class="tiny" style="display:block">${d}</span></span><span class="chip chip-teal">do it</span></div>`).join('')}
        </div>
        <button class="btn btn-soft" data-a="close-sheet" style="margin-top:14px">Done</button>`});
      break;
    }
    case 'quick': {
      const q = el.dataset.q;
      sendMessage(q);
      break;
    }
    case 'clear-chat': {
      state.chat = []; save(); renderView('coach'); break;
    }
    case 'theme': {
      state.theme = el.dataset.id; save(); applyTheme(); renderView('coach'); break;
    }
    case 'reduce-toggle': {
      state.reduceMotion = !state.reduceMotion; save(); applyMotion(); renderView('coach');
      toast(state.reduceMotion?'Motion reduced.':'Motion restored.','ok',1500);
      break;
    }
    case 'export': {
      const json = JSON.stringify(state,null,2);
      const fallback = ()=>openSheet({ title:'Copy your backup', body:`<div class="field"><label for="bkx">Select all, copy, and keep it somewhere safe</label><textarea class="input" id="bkx" readonly style="min-height:200px">${json.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</textarea></div>`});
      (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(json).then(()=>toast('Backup copied to clipboard.','ok',2000)) : Promise.reject()).catch(fallback);
      break;
    }
    case 'import': {
      openSheet({ title:'Import backup', body:`<form data-form="import" style="display:grid;gap:12px">
        <div class="field"><label for="imp">Paste a backup file’s contents</label><textarea class="input" id="imp" name="json" placeholder='{"v":1,…}' required></textarea></div>
        <button class="btn btn-deep" type="submit">${ic('upload',16)} Merge and reload</button>
        <p class="tiny">Import replaces current data with the file’s data. Export first if unsure.</p>
      </form>`});
      break;
    }
    case 'reset': {
      openSheet({ title:'Reset everything?', body:`
        <p class="tiny">This clears every task, weigh-in, expense and essay stored in this browser. It cannot be undone.</p>
        <div class="row" style="gap:8px;margin-top:6px">
          <button class="btn btn-soft" data-a="close-sheet" style="flex:1">Keep my data</button>
          <button class="btn btn-deep" data-a="reset-confirm" style="flex:1;background:linear-gradient(165deg,#FFC700,#D9A400)">Reset</button>
        </div>`});
      break;
    }
    case 'reset-confirm': {
      localStorage.removeItem(KEY);
      state = load(); save(); closeSheet();
      setTab('today', {force:true}); window.scrollTo(0,0);
      toast('Fresh start.','ok',1800);
      break;
    }
    case 'close-sheet': closeSheet(); break;
    case 'fab-expense': closeFab(); openExpenseSheet(); break;
    case 'fab-saving': closeFab(); document.querySelector('[data-a="add-saving"]')?.click() || openSheet({title:'Add to savings', body:''}); break;
  }
});

/* ---------- forms ---------- */
document.addEventListener('submit', e=>{
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;
  const data = Object.fromEntries(new FormData(form).entries());

  if (kind === 'essay'){
    const words = Number(data.words)||0;
    state.ielts.essays.push({ id:uid(), date:dkey(), prompt:(essayPrompt||essayPromptToday()).t, words, mins:Number(data.mins)||null, band:data.band?Number(data.band):null });
    setTask(dkey(),'essay',true); save();
    renderView('learn'); updateChrome();
    toast(words<250?`Logged ${words} words — under 250 is a penalty. Aim 270+.`:'Essay logged. Read one paragraph out loud.','ok',2800);
  }
  if (kind === 'weight'){
    const kg = Number(data.kg);
    if (!kg) return;
    const d = dayRec(dkey(), true); d.weight = kg;
    setTask(dkey(),'weigh',true); save();
    renderView('progress'); updateChrome();
    const ch = weightChangeWeek();
    toast(`Logged ${num(kg)} kg${ch!==null?` · ${ch>0?'+':''}${num(ch)} kg this week`:''}. Weekly trend beats daily noise.`,'ok',2800);
  }
  if (kind === 'expense'){
    const amount = Number(data.amount);
    if (!amount) return;
    state.expenses.push({ id:uid(), date:dkey(), amount, cat:data.cat||'life', note:(data.note||'').trim() });
    setTask(dkey(),'log',true); save();
    const spend = spentMonth(), dim = monthProgress().dim;
    const proj = spend/monthProgress().day*dim;
    renderView('money'); updateChrome();
    toast(proj > freeAfterFixed() ? `Logged. Projected ${money0(proj)} this month — that is over your flexible budget.` : `Logged ${money(amount)}. ${money0(Math.max(0,freeAfterFixed()-spend))} of flexible budget left.`, proj>freeAfterFixed()?'warn':'ok',2800);
  }
  if (kind === 'saving'){
    const amount = Number(data.amount);
    state.savings.push({ id:uid(), date:dkey(), amount, note:(data.note||'').trim() });
    save(); closeSheet(); renderView('money'); updateChrome();
    toast(`${money0(amount)} banked. ${money0(savedTotal())} of ${money0(state.settings.goal)}.`,'ok',2600);
  }
  if (kind === 'fixed'){
    const f = state.settings.fixed.find(x=>x.id===form.dataset.id);
    if (f){ f.amount = Number(data.amount)||0; save(); closeSheet(); renderView('money'); toast('Plan updated.','ok',1600); }
  }
  if (kind === 'settings'){
    state.settings.income = Number(data.income)||state.settings.income;
    state.settings.goal = Number(data.goal)||state.settings.goal;
    state.settings.examDate = data.exam||'';
    state.settings.stepsGoal = Number(data.steps)||state.settings.stepsGoal;
    save(); renderView('coach'); updateChrome();
    toast('Settings saved.','ok',1800);
  }
  if (kind === 'chat'){
    const msg = (data.msg||'').trim();
    if (!msg) return;
    form.querySelector('[name=msg]').value = '';
    sendMessage(msg);
  }
  if (kind === 'import'){
    try {
      const parsed = JSON.parse(data.json);
      state = deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), parsed);
      save(); closeSheet(); setTab('today',{force:true});
      toast('Backup imported.','ok',2000);
    } catch(err){ toast('That file did not parse. Nothing changed.','warn',2800); }
  }

  // a form submitted from the sheet should dismiss the sheet
  if (form.closest('#sheet')) closeSheet();
});

/* ---------- fab ---------- */
function closeFab(){
  document.body.classList.remove('fab-open');
  $('#fabwrap').classList.remove('open');
  $('#fab').classList.remove('open');
  $('#fab').setAttribute('aria-expanded','false');
}
$('#fab').addEventListener('click', ()=>{
  const w = $('#fabwrap');
  const open = w.classList.toggle('open');
  document.body.classList.toggle('fab-open', open);
  $('#fab').classList.toggle('open', open);
  $('#fab').setAttribute('aria-expanded', String(open));
});
$('#fabmenu').addEventListener('click', e=>{
  const b = e.target.closest('button[data-fab]'); if (!b) return;
  if (b.dataset.fab === 'expense'){ closeFab(); openExpenseSheet(); }
  else { closeFab(); document.querySelector('[data-a="add-saving"]').click(); }
});
function openExpenseSheet(){
  openSheet({ title:'Log spending', body:`<form data-form="expense" style="display:grid;gap:12px">
    <div class="field"><label for="xa">Amount</label>
      <div class="input-prefix"><span class="pfx">£</span><input class="input" id="xa" name="amount" type="number" step="0.01" min="0" placeholder="0.00" required></div></div>
    <div class="field"><label for="xn">What was it?</label><input class="input" id="xn" name="note" placeholder="Meal deal, bus, coffee"></div>
    <div class="field"><label>Category</label>
      <div class="tags">${CATS.map((c,i)=>`<button type="button" class="chip ${i===0?'chip-deep':''}" data-a="pick-cat" data-id="${c.id}">${c.name}</button>`).join('')}</div>
      <input type="hidden" name="cat" value="food">
    </div>
    <button class="btn btn-primary" type="submit">${ic('cart',16)} Add</button>
  </form>`});
}



/* ---------- Lab tab: the engineering lab runs in its own frame ---------- */
let labPending = null;
function labFrame(){ return document.querySelector('iframe.labframe'); }
function syncLabTheme(){
  const f = labFrame(); if (!f) return;
  try { f.contentDocument.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || 'light'); } catch(e){}
}
function sizeLab(){
  const f = labFrame(); if (!f) return;
  const bar = document.getElementById('tabbar');
  const h = window.innerHeight - 72 - (bar ? bar.offsetHeight : 64) - 34;
  f.style.height = Math.max(440, h) + 'px';
}
function mountLab(el){
  if (!labFrame()){
    if (!window.LAB_HTML){ el.innerHTML = '<div class="glass card"><div class="tiny">The lab is added by the build. Run <b>npm run build</b> and open dist/daily-coach.html.</div></div>'; return; }
    el.innerHTML = '<div class="glass labwrap"><iframe class="labframe" title="Mechanical engineering lab" loading="eager"></iframe></div>';
    const f = labFrame();
    f.addEventListener('load', ()=>{
      syncLabTheme();
      if (labPending){ try { f.contentWindow.go(labPending); } catch(e){} labPending = null; }
    });
    f.srcdoc = window.LAB_HTML.replace('<head>', '<head><script>window.LAB_START=' + JSON.stringify(labPending || 'trends') + ';<\/script>');
  }
  sizeLab();
}
function openLab(section){
  const f = labFrame();
  if (activeTab !== 'lab') { labPending = section; setTab('lab'); }
  if (f && f.contentWindow && typeof f.contentWindow.go === 'function'){ try { f.contentWindow.go(section); } catch(e){} labPending = null; }
}
window.addEventListener('resize', sizeLab);
