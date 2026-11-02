/* 57-render-camctl.js — "Camera Control" edge control for the knowledge map
 * Replaces the right-edge notch (kmNotchHTML: three ring gauges + pop-out cards) with an overlay
 * modelled on the iPhone 16 Camera Control:
 *  - At rest: only a slim sliver on the right edge, where the button would be.
 *  - Light press (tap the sliver): a black overlay grows out of the screen edge with a spring,
 *    concave fillets where it meets the edge, and a SLIDER: a tick ruler that scrolls past a
 *    fixed centre mark, prominent values with labels, the value + unit beside it.
 *  - Double light press (tap the overlay, or double-tap the sliver): a PICKER — the controls on
 *    a curved wheel, the selected one centred with its name. Swipe to move, tap to choose.
 *  - Controls: Streak · Today · Savings · Zoom. Zoom really zooms the map (snaps to 0.5×, 1×, 2×,
 *    5×, 10×, 24×). The other three are read-only gauges: the ruler stretches and springs back.
 *  - Retracts into the edge after ~2.5 s without input. Opens once by itself when the map opens.
 *  - Reduced motion: no springs, no auto-open. Keyboard: Enter opens, ↑/↓ adjusts, Tab/Esc.
 * kmNotchHTML() (54-render-galaxy.js) returns kmcHTML(); styles live in src/css/camctl.css.
 * The old ring notch (.km-notch/.km-nr/.km-npop and the 'km-nring' action) was removed.
 */
const KMC = { sel:'today', mode:'rest', drag:null, hideT:0, raf:0, pos:0, vel:0, menuPos:1, menuVel:0, introDone:false, lastMajor:null, tap:0 };
const KMC_ITEMS = [
  { id:'streak', name:'Streak', icon:'flame' },
  { id:'today',  name:'Today',  icon:'flag' },
  { id:'money',  name:'Savings', icon:'pound' },
  { id:'zoom',   name:'Zoom',   icon:null }
];
const KMC_SP = 9;                       // px between minor ticks
const kmcStill = () => (typeof motionOff === 'function' && motionOff());
const kmcBuzz = ms => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch(e){} };
const kmcIcon = (it, s=18) => it.icon && typeof ic === 'function' ? ic(it.icon, s)
  : `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.2 15.2L20 20M10.5 8v5M8 10.5h5"/></svg>`;

/* ---------- values: same sources the old rings used ---------- */
function kmcData(id){
  try {
    if (id === 'today'){ const d = todayDone(), t = todayTotal() || 1; return { v:d/t*100, min:0, max:100, step:2, majors:[0,25,50,75,100], fmt:v=>`${Math.round(v)}%`, sub:`${d} of ${t} done${d>=4?' · streak day ✓':` · ${Math.max(0,4-d)} to a streak day`}`, read:true }; }
    if (id === 'money'){ const s = savedTotal(), g = Number(state.settings.goal) || 25000; return { v:Math.min(100, s/g*100), min:0, max:100, step:2, majors:[0,25,50,75,100], fmt:v=>`${Math.round(v)}%`, sub:`${money0(s)} of ${money0(g)} · ${money0(Math.max(0,g-s))} to go`, read:true }; }
    if (id === 'streak'){ const st = currentStreak(), max = st < 30 ? 30 : st < 100 ? 100 : Math.ceil((st+50)/50)*50; const next = st < 7 ? 7 : st < 30 ? 30 : st < 100 ? 100 : st + 50;
      return { v:st, min:0, max, step:1, majors: max === 30 ? [0,7,14,21,30] : max === 100 ? [0,25,50,75,100] : [0, max/2, max], fmt:v=>`${Math.round(v)}d`, sub:`${st}-day streak · next ${next} days`, read:true }; }
    if (id === 'zoom'){ const z = (KM.camT || KM.cam || {z:1}).z || 1; return { log:true, v:z, min:.4, max:24, majors:[.5,1,2,5,10,24], fmt:v=>(v < 10 ? (Math.round(v*10)/10).toFixed(1).replace(/\.0$/,'') : Math.round(v)) + '×', sub:'Map zoom · slide to change', read:false }; }
  } catch(e){}
  return { v:0, min:0, max:100, step:2, majors:[0,50,100], fmt:v=>`${Math.round(v)}`, sub:'', read:true };
}
/* value <-> ruler position (px from the bottom of the ruler) */
function kmcU(d, v){ return d.log ? Math.log(v/d.min) * 130 : (v - d.min)/d.step*KMC_SP; }
function kmcV(d, u){ return d.log ? d.min*Math.exp(u/130) : d.min + u/KMC_SP*d.step; }
function kmcLen(d){ return kmcU(d, d.max); }

/* ---------- markup (replaces kmNotchHTML) ---------- */
function kmcHTML(){
  return `<aside class="km-cc" id="kmCC" data-mode="rest" aria-label="Quick control: today, savings, streak and zoom">
    <div class="cc-pill" id="kmcPill">
      <div class="cc-in">
        <div class="cc-slider"><div class="cc-ruler" id="kmcRuler"></div><i class="cc-mark"></i></div>
        <div class="cc-menu" id="kmcMenu">${KMC_ITEMS.map((it,i)=>`<button type="button" class="cc-it" data-i="${i}" tabindex="-1" aria-label="${it.name}">${kmcIcon(it)}</button>`).join('')}</div>
      </div>
      <button type="button" class="cc-btn" id="kmcBtn" aria-label="Open quick control" aria-expanded="false"></button>
    </div>
    <div class="cc-lab" id="kmcLab" aria-live="polite"><b class="num" id="kmcVal"></b><span id="kmcName"></span><small id="kmcSub"></small></div>
  </aside>`;
}
function kmcEl(id){ return document.getElementById(id); }

function kmcBuildRuler(){
  const d = kmcData(KMC.sel), r = kmcEl('kmcRuler'); if (!r) return d;
  const L = kmcLen(d), parts = [];
  if (d.log){
    const vals = []; for (let v = .4; v < 1; v += .1) vals.push(v); for (let v = 1; v < 3; v += .2) vals.push(v); for (let v = 3; v < 10; v += .5) vals.push(v); for (let v = 10; v <= 24.01; v += 1) vals.push(v);
    vals.forEach(v => { const maj = d.majors.some(m => Math.abs(m - v) < .001); if (!maj) parts.push(`<i class="t" style="bottom:${kmcU(d,v).toFixed(1)}px"></i>`); });
  } else {
    for (let v = d.min; v <= d.max + 1e-6; v += d.step){ const maj = d.majors.some(m => Math.abs(m - v) < 1e-6); if (!maj) parts.push(`<i class="t" style="bottom:${kmcU(d,v).toFixed(1)}px"></i>`); }
  }
  d.majors.forEach(m => parts.push(`<i class="t M" style="bottom:${kmcU(d,m).toFixed(1)}px"></i><em style="bottom:${kmcU(d,m).toFixed(1)}px">${d.log ? d.fmt(m) : d.fmt(m)}</em>`));
  r.innerHTML = parts.join(''); r.style.height = L + 'px';
  return d;
}
function kmcSetLabel(d, v){
  const it = KMC_ITEMS.find(x => x.id === KMC.sel);
  kmcEl('kmcVal').textContent = d.fmt(v); kmcEl('kmcName').textContent = it.name; kmcEl('kmcSub').textContent = d.sub;
}
function kmcMenuLabel(){
  const i = Math.round(Math.max(0, Math.min(KMC_ITEMS.length-1, KMC.menuPos))), it = KMC_ITEMS[i], d = kmcData(it.id);
  kmcEl('kmcVal').textContent = it.name; kmcEl('kmcName').textContent = d.fmt(d.v); kmcEl('kmcSub').textContent = 'Swipe to choose · tap to select';
}

/* ---------- state machine ---------- */
function kmcSetMode(mode){
  const root = kmcEl('kmCC'); if (!root) return;
  KMC.mode = mode; root.dataset.mode = mode;
  kmcEl('kmcBtn').setAttribute('aria-expanded', String(mode !== 'rest'));
  root.querySelectorAll('.cc-it').forEach(b => b.tabIndex = mode === 'menu' ? 0 : -1);
  if (mode === 'slider'){ const d = kmcBuildRuler(); KMC.target = kmcU(d, d.v); KMC.d = d; if (KMC.fresh){ KMC.pos = 0; KMC.fresh = false; } kmcSetLabel(d, d.v); }
  if (mode === 'menu'){ KMC.menuTarget = KMC_ITEMS.findIndex(x => x.id === KMC.sel); kmcMenuLabel(); }
  if (mode === 'rest'){ KMC.fresh = true; }
  kmcArm(); kmcLoop();
}
function kmcArm(ms){ clearTimeout(KMC.hideT); if (KMC.mode === 'rest') return; KMC.hideT = setTimeout(()=>{ if (!KMC.drag && !KMC.hover) kmcSetMode('rest'); else kmcArm(); }, ms || 2600); }
function kmcLoop(){
  if (KMC.raf) return;
  const step = () => {
    KMC.raf = 0; const root = kmcEl('kmCC'); if (!root || !root.isConnected) return;
    const still = kmcStill();
    if (KMC.mode === 'slider' && KMC.d){
      if (!KMC.drag){
        const k = still ? 1 : .16; KMC.pos += (KMC.target - KMC.pos)*k;
        if (Math.abs(KMC.target - KMC.pos) < .2) KMC.pos = KMC.target;
      }
      const r = kmcEl('kmcRuler'); if (r) r.style.transform = `translateY(${KMC.pos.toFixed(2)}px)`;
      const v = kmcV(KMC.d, Math.max(0, Math.min(kmcLen(KMC.d), KMC.pos)));
      kmcSetLabel(KMC.d, KMC.d.read && !KMC.drag ? (Math.abs(KMC.target-KMC.pos) < .5 ? KMC.d.v : v) : v);
      const near = KMC.d.majors.find(m => Math.abs(kmcU(KMC.d, m) - KMC.pos) < 2);
      if (near !== undefined && near !== KMC.lastMajor){ KMC.lastMajor = near; if (KMC.drag) kmcBuzz(6); } else if (near === undefined) KMC.lastMajor = null;
    }
    if (KMC.mode === 'menu'){
      if (!KMC.drag){ const k = still ? 1 : .18; KMC.menuPos += (KMC.menuTarget - KMC.menuPos)*k; if (Math.abs(KMC.menuTarget - KMC.menuPos) < .002) KMC.menuPos = KMC.menuTarget; }
      kmcLayoutMenu();
    }
    const moving = KMC.drag || (KMC.mode === 'slider' && KMC.pos !== KMC.target) || (KMC.mode === 'menu' && KMC.menuPos !== KMC.menuTarget);
    if (moving) KMC.raf = requestAnimationFrame(step);
  };
  KMC.raf = requestAnimationFrame(step);
}
function kmcLayoutMenu(){
  const m = kmcEl('kmcMenu'); if (!m) return;
  const H = m.clientHeight || 260, cy = H/2, gap = 54, R = 150;
  m.querySelectorAll('.cc-it').forEach((b, i) => {
    const off = i - KMC.menuPos, y = cy + off*gap, a = off*gap/R;            // items ride a wheel whose centre is past the edge
    const x = (1 - Math.cos(a))*R*.62, sc = Math.max(.62, 1 - Math.abs(off)*.18), op = Math.max(0, 1 - Math.abs(off)*.38);
    b.style.transform = `translate(${x.toFixed(1)}px, ${(y - 20).toFixed(1)}px) scale(${sc.toFixed(3)})`;
    b.style.opacity = op.toFixed(3); b.classList.toggle('on', Math.abs(off) < .5);
  });
  kmcMenuLabel();
}

/* ---------- input: tap = light press, tap again = double light press; drag/wheel to slide ---------- */
function kmcBind(){
  const root = kmcEl('kmCC'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  const pill = kmcEl('kmcPill');
  root.addEventListener('pointerenter', ()=>{ KMC.hover = true; });
  root.addEventListener('pointerleave', ()=>{ KMC.hover = false; kmcArm(1400); });
  pill.addEventListener('pointerdown', e => {
    if (KMC.mode === 'rest') return;
    e.stopPropagation(); pill.setPointerCapture && pill.setPointerCapture(e.pointerId);
    KMC.drag = { y:e.clientY, y0:e.clientY, moved:0, pos0:KMC.pos, mp0:KMC.menuPos, t:performance.now() }; kmcLoop();
  });
  pill.addEventListener('pointermove', e => {
    const g = KMC.drag; if (!g) return; const dy = e.clientY - g.y; g.y = e.clientY; g.moved += Math.abs(dy);
    if (KMC.mode === 'slider' && KMC.d){
      const L = kmcLen(KMC.d); let p = KMC.pos - dy;                       // finger up = value up
      if (KMC.d.read){ const over = p - KMC.target; p = KMC.target + Math.sign(over)*Math.min(46, Math.abs(over)*.45 + Math.max(0, Math.abs(over)-0)*0); }
      else {
        p = Math.max(-30, Math.min(L + 30, p));
        const z = kmcV(KMC.d, Math.max(0, Math.min(L, p))), cur = (KM.camT || KM.cam).z;
        if (typeof kmZoomAt === 'function' && Math.abs(z/cur - 1) > .002) kmZoomAt(z/cur, KM.W/2, KM.H/2);
      }
      KMC.pos = p;
    }
    if (KMC.mode === 'menu'){ KMC.menuPos = Math.max(-.4, Math.min(KMC_ITEMS.length - .6, KMC.menuPos - dy/54)); }
    kmcArm(); kmcLoop();
  });
  const end = e => {
    const g = KMC.drag; if (!g) return; KMC.drag = null;
    if (g.moved < 6){ kmcTap(e); }
    else if (KMC.mode === 'slider' && KMC.d){
      if (KMC.d.read) KMC.target = kmcU(KMC.d, KMC.d.v);
      else { // snap to a prominent zoom when close, like the real control
        const L = kmcLen(KMC.d), u = Math.max(0, Math.min(L, KMC.pos)), snap = KMC.d.majors.map(m => kmcU(KMC.d, m)).find(x => Math.abs(x - u) < 10);
        KMC.target = snap !== undefined ? snap : u; const z = kmcV(KMC.d, KMC.target), cur = (KM.camT || KM.cam).z;
        if (typeof kmZoomAt === 'function') kmZoomAt(z/cur, KM.W/2, KM.H/2); KMC.d.v = z; }
    }
    else if (KMC.mode === 'menu'){ KMC.menuTarget = Math.max(0, Math.min(KMC_ITEMS.length-1, Math.round(KMC.menuPos))); kmcBuzz(5); }
    kmcArm(); kmcLoop();
  };
  pill.addEventListener('pointerup', end); pill.addEventListener('pointercancel', end);
  pill.addEventListener('wheel', e => {
    if (KMC.mode === 'rest') return; e.preventDefault(); e.stopPropagation();
    if (KMC.mode === 'menu'){ KMC.menuTarget = Math.max(0, Math.min(KMC_ITEMS.length-1, KMC.menuTarget + Math.sign(e.deltaY))); }
    else if (KMC.d && !KMC.d.read){ const L = kmcLen(KMC.d); KMC.target = Math.max(0, Math.min(L, KMC.target - e.deltaY*.35)); const z = kmcV(KMC.d, KMC.target), cur = (KM.camT || KM.cam).z; kmZoomAt(z/cur, KM.W/2, KM.H/2); KMC.d.v = z; }
    kmcArm(); kmcLoop();
  }, { passive:false });
  kmcEl('kmcBtn').addEventListener('pointerdown', e => e.stopPropagation());
  kmcEl('kmcBtn').addEventListener('click', e => { e.stopPropagation(); kmcLightPress(); });
  kmcEl('kmcBtn').addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown'){ e.preventDefault(); kmcNudge(e.key === 'ArrowUp' ? 1 : -1); }
    if (e.key === 'Escape'){ kmcSetMode('rest'); }
  });
  root.querySelectorAll('.cc-it').forEach(b => b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); KMC.sel = KMC_ITEMS[+b.dataset.i].id; kmcSetMode('slider'); kmcEl('kmcBtn').focus(); } }));
}
function kmcLightPress(){
  const now = performance.now(), dbl = now - KMC.tap < 380; KMC.tap = now;
  if (KMC.mode === 'rest'){ kmcBuzz(8); kmcSetMode(dbl ? 'menu' : 'slider'); }
  else if (KMC.mode === 'slider'){ kmcBuzz(8); kmcSetMode('menu'); }
  else { KMC.sel = KMC_ITEMS[Math.round(KMC.menuTarget)].id; kmcBuzz(8); kmcSetMode('slider'); }
}
function kmcTap(e){
  if (KMC.mode === 'menu'){
    const b = e.target.closest && e.target.closest('.cc-it');
    const i = b ? +b.dataset.i : Math.round(KMC.menuPos);
    if (Math.round(KMC.menuTarget) !== i && b){ KMC.menuTarget = i; kmcLoop(); setTimeout(()=>{ KMC.sel = KMC_ITEMS[i].id; kmcSetMode('slider'); }, kmcStill() ? 0 : 260); }
    else { KMC.sel = KMC_ITEMS[i].id; kmcSetMode('slider'); }
    kmcBuzz(8);
  } else if (KMC.mode === 'slider'){ kmcBuzz(8); kmcSetMode('menu'); }
}
function kmcNudge(dir){
  if (KMC.mode === 'rest') kmcSetMode('slider');
  if (KMC.mode === 'menu'){ KMC.menuTarget = Math.max(0, Math.min(KMC_ITEMS.length-1, KMC.menuTarget - dir)); kmcLoop(); kmcArm(); return; }
  if (KMC.d && !KMC.d.read){ const i = KMC.d.majors.findIndex(m => m > KMC.d.v*1.01); const cur = KMC.d.v;
    const z = dir > 0 ? (KMC.d.majors.find(m => m > cur*1.01) || KMC.d.max) : ([...KMC.d.majors].reverse().find(m => m < cur*.99) || KMC.d.min);
    kmZoomAt(z/((KM.camT||KM.cam).z), KM.W/2, KM.H/2); KMC.d.v = z; KMC.target = kmcU(KMC.d, z); }
  kmcLoop(); kmcArm();
}

/* ---------- styles ---------- */

/* ---------- hook in: bind when the map shell appears; open once by itself so today's number is still seen ---------- */
(function(){
  const mo = new MutationObserver(() => {
    const root = document.getElementById('kmCC');
    if (root && !root.dataset.bound){
      kmcBind(); KMC.mode = 'rest'; KMC.fresh = true;
      if (!KMC.introDone && !kmcStill()){ KMC.introDone = true; setTimeout(()=>{ if (KMC.mode === 'rest' && document.getElementById('kmCC')){ kmcSetMode('slider'); kmcArm(4200); } }, 2400); }
    }
  });
  mo.observe(document.body, { childList:true, subtree:true });
})();
