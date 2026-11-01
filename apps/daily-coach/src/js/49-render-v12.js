/* ============================================================
   V12 ENGINE — animated 3D model with real geometry
   60° V, 6-throw crankshaft (throws 120° apart, two rods per
   pin), even firing every 60° of crank. Firing order
   1-7-5-11-3-9-6-12-2-8-4-10 (bank A = 1–6, bank B = 7–12),
   as listed for the BMW N73 V12. Piston position from the
   slider-crank equation s = r cos α + √(l² − r² sin² α).
   ============================================================ */
const V12 = { order:[1,7,5,11,3,9,6,12,2,8,4,10], theta:0, speed:0.25, run:true, yaw:-0.95, pitch:0.34, drag:null, raf:0, vis:false, io:null, last:0, tween:null, quiz:0, idle:0 };
const VG = { r:8, l:26, bore:7, sp:24, off:9, bank:Math.PI/6, deck:40, skirt:14 };
const STROKE = [ ['power','Power',[255,59,31]], ['exhaust','Exhaust',[138,143,156]], ['intake','Intake',[61,139,255]], ['compression','Compression',[255,194,26]] ];
const v12Fire = c => V12.order.indexOf(c) * 60;
function v12Cyl(c, theta){
  const A = c <= 6, i = A ? c-1 : c-7, beta = (A ? -1 : 1) * VG.bank;
  const phase = (((theta - v12Fire(c)) % 720) + 720) % 720, al = phase * Math.PI/180;
  const s = VG.r*Math.cos(al) + Math.sqrt(VG.l*VG.l - VG.r*VG.r*Math.sin(al)**2);
  const u = [0, Math.sin(beta), Math.cos(beta)], psi = beta + al;
  return { c, A, i, beta, phase, s, u, x: i*VG.sp + (A ? 0 : VG.off), pin:[VG.r*Math.sin(psi), VG.r*Math.cos(psi)], st: STROKE[Math.floor(phase/180)] };
}
function v12Build(theta){
  const faces = [], rods = [], cyls = [];
  for (let c=1;c<=12;c++){
    const k = v12Cyl(c, theta); cyls.push(k);
    const ev = [0, k.u[2], -k.u[1]];
    const pf = extrude([circleLoop(0,0,VG.bore-0.7,14)], k.s-5, k.s+4, [X, ev, k.u], [k.x,0,0]);
    pf.forEach((f,j)=>{ f.mat = j===0 ? k.st[0] : 'piston'; });
    faces.push(...pf);
    const g = [k.x, k.u[1]*(k.s-2), k.u[2]*(k.s-2)], p = [k.x, k.pin[0], k.pin[1]];
    rods.push({ a:p, b:g });
  }
  for (let i=0;i<6;i++){
    const k = cyls[i];
    faces.push(...extrude([circleLoop(k.pin[0],k.pin[1],2.6,10)], i*VG.sp-4, i*VG.sp+VG.off+4, [Y,Z,X], [0,0,0], 'red'));
    [i*VG.sp-5, i*VG.sp+VG.off+5].forEach(x=>rods.push({ a:[x,0,0], b:[x,k.pin[0],k.pin[1]], web:true }));
  }
  faces.push(...extrude([circleLoop(0,0,3.2,12)], -12, 5*VG.sp+VG.off+12, [Y,Z,X], [0,0,0], 'steel'));
  faces.forEach(f=>{ f.n = newell(f.loops[0]); const o = f.loops[0]; f.c = o.reduce((s,p)=>[s[0]+p[0]/o.length,s[1]+p[1]/o.length,s[2]+p[2]/o.length],[0,0,0]); });
  return { faces, rods, cyls };
}
const V12_CENTRE = [(5*VG.sp+VG.off)/2, 0, 20], V12_R = 78;
function v12Draw(){
  const cv = document.getElementById('v12Canvas'); if (!cv) return;
  const dpr = Math.min(2, window.devicePixelRatio||1), W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W*dpr)){ cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr); }
  const g = cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const s = Math.min(W,H)*0.46/V12_R*1.25, cx = W/2, cy = H/2 + 8;
  const tp = p => { const q = camXf([p[0]-V12_CENTRE[0],p[1]-V12_CENTRE[1],p[2]-V12_CENTRE[2]], V12.yaw, V12.pitch); return [cx+q[0]*s, cy-q[2]*s, q[1]]; };
  const M = v12Build(V12.theta), light = V3.norm([-0.45,-0.7,0.6]);
  const items = [];
  M.faces.forEach(f=>{ const n = camXf(f.n, V12.yaw, V12.pitch); if (n[1] < -1e-4){ f._n = n; items.push({ f, d: camXf(V3.sub(f.c,V12_CENTRE), V12.yaw, V12.pitch)[1] }); } });
  M.rods.forEach(r=>{ const m = [(r.a[0]+r.b[0])/2,(r.a[1]+r.b[1])/2,(r.a[2]+r.b[2])/2]; items.push({ r, d: camXf(V3.sub(m,V12_CENTRE), V12.yaw, V12.pitch)[1] }); });
  items.sort((a,b)=>b.d - a.d);
  const col = { steel: dark?[120,126,140]:[150,156,168], piston: dark?[170,176,190]:[196,201,211], red:[226,24,44] };
  STROKE.forEach(([k,,c])=>col[k] = c);
  items.forEach(it=>{
    if (it.r){
      const a = tp(it.r.a), b = tp(it.r.b);
      g.strokeStyle = it.r.web ? (dark?'#3A3A46':'#7A7F8C') : (dark?'#9CA1AE':'#5C6170'); g.lineWidth = it.r.web ? 4.5 : 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); return;
    }
    const f = it.f, lam = Math.max(0, V3.dot(f._n, light)), k = 0.42 + 0.62*lam, c = col[f.mat] || col.steel, sp = Math.pow(lam,16)*55;
    g.fillStyle = `rgb(${Math.min(255,c[0]*k+sp)|0},${Math.min(255,c[1]*k+sp)|0},${Math.min(255,c[2]*k+sp)|0})`;
    g.beginPath(); f.loops.forEach(l=>{ l.forEach((p,i)=>{ const q = tp(p); i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); }); g.closePath(); }); g.fill('evenodd');
    if (f.cap){ g.strokeStyle = dark?'rgba(255,255,255,.25)':'rgba(10,10,16,.35)'; g.lineWidth = .8; g.stroke(); }
  });
  // translucent deck planes show the two banks of the V
  [-1,1].forEach(sg=>{
    const b = sg*VG.bank, u = [0,Math.sin(b),Math.cos(b)], ev = [0,u[2],-u[1]], x0 = -10 + (sg>0?VG.off:0), x1 = 5*VG.sp + 10 + (sg>0?VG.off:0);
    const P = (x,w,e) => tp([x, u[1]*w + ev[1]*e, u[2]*w + ev[2]*e]);
    const q = [P(x0,VG.deck,-VG.bore-2),P(x1,VG.deck,-VG.bore-2),P(x1,VG.deck,VG.bore+2),P(x0,VG.deck,VG.bore+2)];
    g.fillStyle = dark ? 'rgba(255,255,255,.035)' : 'rgba(20,24,40,.05)'; g.strokeStyle = dark ? 'rgba(255,70,85,.35)' : 'rgba(225,6,27,.35)'; g.lineWidth = 1;
    g.beginPath(); q.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.fill(); g.stroke();
    const lb = P(x1+6, VG.deck, 0); g.font = '800 11px -apple-system,system-ui,sans-serif'; g.fillStyle = dark?'#FF4655':'#E1061B'; g.textAlign = 'center'; g.fillText(sg<0?'Bank A':'Bank B', lb[0], lb[1]);
  });
  // glass cylinder liners, combustion glow, spark, numbers
  M.cyls.forEach(k=>{
    const ev = [0, k.u[2], -k.u[1]];
    const ring = w => circleLoop(0,0,VG.bore,24).map(([a,b])=>tp([k.x + a, ev[1]*b + k.u[1]*w, ev[2]*b + k.u[2]*w]));
    const top = ring(VG.deck), bot = ring(VG.skirt), crown = ring(k.s+4);
    if (k.phase < 180){
      const a = 0.55*(1 - k.phase/180);
      g.fillStyle = `rgba(255,${90+Math.round(80*(1-k.phase/180))},30,${a.toFixed(2)})`;
      g.beginPath(); top.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); crown.slice().reverse().forEach(p=>g.lineTo(p[0],p[1])); g.closePath(); g.fill();
    }
    g.strokeStyle = dark ? 'rgba(200,215,255,.28)' : 'rgba(30,40,70,.28)'; g.lineWidth = 1;
    [top, bot].forEach(r=>{ g.beginPath(); r.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.stroke(); });
    if (k.phase < 22){
      const d = tp([k.x, k.u[1]*VG.deck, k.u[2]*VG.deck]), rr = 9*(1 - k.phase/22) + 3;
      const gr = g.createRadialGradient(d[0],d[1],0,d[0],d[1],rr*2.2); gr.addColorStop(0,'rgba(255,255,220,.95)'); gr.addColorStop(.4,'rgba(255,190,60,.7)'); gr.addColorStop(1,'rgba(255,60,20,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(d[0],d[1],rr*2.2,0,Math.PI*2); g.fill();
    }
    const lb = tp([k.x, k.u[1]*(VG.deck+7), k.u[2]*(VG.deck+7)]);
    g.font = '700 10px -apple-system,system-ui,sans-serif'; g.textAlign = 'center'; g.fillStyle = k.phase < 60 ? '#FF4655' : (dark?'#C9CBD2':'#3D3F4A');
    g.fillText(String(k.c), lb[0], lb[1]+3);
  });
  v12Panel(M.cyls);
}
function v12Panel(cyls){
  const t = ((V12.theta % 720) + 720) % 720, idx = Math.floor(t/60), firing = V12.order[idx];
  document.querySelectorAll('.v12-order i').forEach((el,i)=>el.classList.toggle('on', i===idx));
  const ang = document.getElementById('v12Ang'); if (ang) ang.textContent = `Crank ${Math.round(t % 360)}° · cycle ${Math.round(t)}° of 720° · cylinder ${firing} firing`;
  // cylinder 1 cut-away
  const k = cyls[0], svg = document.getElementById('v12Cut'); if (!svg) return;
  const S = 2.0, C = [80,136], R = VG.r*S, al = k.phase*Math.PI/180;
  const pinX = C[0] + R*Math.sin(al), pinY = C[1] - R*Math.cos(al), crownY = C[1] - (k.s+4)*S, gudY = C[1] - (k.s-2)*S;
  const q = id => svg.querySelector(id);
  q('#cutPiston').setAttribute('y', crownY.toFixed(1));
  q('#cutRod').setAttribute('d', `M${pinX.toFixed(1)},${pinY.toFixed(1)} L80,${gudY.toFixed(1)}`);
  q('#cutCrank').setAttribute('d', `M80,136 L${pinX.toFixed(1)},${pinY.toFixed(1)}`);
  q('#cutPin').setAttribute('cx', pinX.toFixed(1)); q('#cutPin').setAttribute('cy', pinY.toFixed(1));
  q('#cutGas').setAttribute('height', Math.max(0, crownY - 36).toFixed(1));
  q('#cutGas').setAttribute('class', 'gas ' + k.st[0]);
  const iv = k.st[0]==='intake' ? 6 : 0, xv = k.st[0]==='exhaust' ? 6 : 0;
  q('#cutIn').setAttribute('transform', `translate(0,${iv})`); q('#cutEx').setAttribute('transform', `translate(0,${xv})`);
  q('#cutSpark').style.opacity = k.phase < 22 ? 1 : 0;
  q('#cutLbl').textContent = k.st[1];
  q('#cutLbl').setAttribute('class', 'cut-lbl ' + k.st[0]);
}
function v12CardHTML(){
  const Qs = [['How many degrees of crank rotation between firings?',['45°','60°','90°'],1,'720° ÷ 12 cylinders = 60°, which is why the banks sit 60° apart.'],
    ['Which cylinder fires straight after cylinder 1 in this engine?',['2','7','12'],1,'Order 1-7-5-11…: 7 sits opposite 1 on the same crank pin and fires 60° later.'],
    ['Why does a V12 need no balance shafts?',['Each bank is an inline six, which is perfectly balanced','The crank is very heavy','It always runs at low rpm'],0,'An inline six has perfect primary and secondary balance; a V12 is two of them sharing one crank.']];
  const q = Qs[V12.quiz % Qs.length];
  return `<div class="glass v12card" id="v12Card">
    <div class="cadhead"><div><div class="h3">V12 engine, inside out</div><div class="tiny">Drag to rotate. Twelve pistons, one crankshaft, a power stroke every 60°.</div></div><span class="chip-live">Live</span></div>
    <div class="cadstage v12stage"><canvas id="v12Canvas" aria-label="Animated 3D V12 engine. Drag to rotate."></canvas>
      <div class="cadviews">${[['iso','Iso'],['front','Front'],['side','Side'],['top','Top']].map(([k,l])=>`<button data-a="v12-view" data-id="${k}">${l}</button>`).join('')}<button data-a="v12-run" class="${V12.run?'on':''}">${V12.run?'Pause':'Play'}</button></div></div>
    <div class="v12-ctrl"><label for="v12Speed" class="tiny">Slow motion</label><input type="range" id="v12Speed" min="0.04" max="1.2" step="0.01" value="${V12.speed}"><span class="tiny num" id="v12SpeedTxt"></span></div>
    <div class="v12-ang tiny num" id="v12Ang"></div>
    <div class="v12-order" aria-label="Firing order">${V12.order.map(c=>`<i><b class="num">${c}</b><span>${c<=6?'A':'B'}</span></i>`).join('')}</div>
    <div class="v12-legend">${STROKE.map(([k,l])=>`<span><i class="lg-${k}"></i>${l}</span>`).join('')}</div>
    <div class="v12-split">
      <svg viewBox="0 0 160 170" id="v12Cut" class="v12cut" role="img" aria-label="Cut-away of cylinder 1">
        <rect x="58" y="30" width="44" height="74" class="cut-wall"/>
        <rect x="60" y="36" width="40" height="0" id="cutGas" class="gas"/>
        <path d="M54,30 H106 V22 H54 Z" class="cut-head"/>
        <g id="cutIn"><path d="M66,16 V31 M61,31 H71" class="cut-valve in"/></g>
        <g id="cutEx"><path d="M94,16 V31 M89,31 H99" class="cut-valve ex"/></g>
        <circle cx="80" cy="34" r="5" id="cutSpark" class="cut-spark"/>
        <rect x="61" y="60" width="38" height="18" rx="2" id="cutPiston" class="cut-piston"/>
        <path id="cutRod" class="cut-rod"/>
        <circle cx="80" cy="136" r="22" class="cut-crankcase"/><path id="cutCrank" class="cut-crank"/><circle id="cutPin" r="4" class="cut-pin"/><circle cx="80" cy="136" r="4" class="cut-main"/>
        <text x="80" y="10" text-anchor="middle" id="cutLbl" class="cut-lbl">Power</text>
        <text x="20" y="40" class="cut-t">Intake</text><text x="140" y="40" text-anchor="end" class="cut-t">Exhaust</text>
      </svg>
      <ul class="v12-facts">
        <li><b>60° between the banks</b> gives even firing: 720° ÷ 12 = one power stroke every 60°.</li>
        <li><b>Each bank is an inline six</b>, which is perfectly balanced, so the engine needs no balance shafts.</li>
        <li><b>Six crank throws, 120° apart.</b> Two rods share each pin, one from each bank.</li>
        <li><b>Firing order 1-7-5-11-3-9-6-12-2-8-4-10</b> (bank A 1–6, bank B 7–12), as on the BMW N73. Lamborghini's L539 uses a different order.</li>
        <li><b>At 7,000 rpm</b> a cylinder fires every 1.43 ms.</li>
      </ul>
    </div>
    <div class="cadquiz"><div class="q">${esc(q[0])}</div><div class="dx-opts">${q[1].map((o,j)=>`<button data-a="v12-answer" data-id="${j}">${esc(o)}</button>`).join('')}</div><div class="qfb" id="v12Fb" aria-live="polite"></div></div>
  </div>`;
}
const V12_VIEWS = { iso:[-0.95,0.34], front:[-Math.PI/2,0.02], side:[0,0.02], top:[0,Math.PI/2] };
function v12Loop(ts){
  V12.raf = 0;
  if (!V12.vis || !document.getElementById('v12Canvas')) return;
  const dt = V12.last ? Math.min(0.05, (ts - V12.last)/1000) : 0; V12.last = ts;
  if (V12.run && !motionOff()) V12.theta += dt * V12.speed * 360;
  if (V12.tween){ const t = Math.min(1,(performance.now()-V12.tween.t0)/650), e = 1-Math.pow(1-t,3); V12.yaw = V12.tween.y0+(V12.tween.y1-V12.tween.y0)*e; V12.pitch = V12.tween.p0+(V12.tween.p1-V12.tween.p0)*e; if (t>=1) V12.tween = null; }
  v12Draw();
  V12.raf = requestAnimationFrame(v12Loop);
}
function v12Kick(){ V12.last = 0; if (!V12.raf) V12.raf = requestAnimationFrame(v12Loop); }
function v12SpeedTxt(){ const el = document.getElementById('v12SpeedTxt'); if (el) el.textContent = `one turn every ${(1/V12.speed).toFixed(1)} s`; }
function mountV12(root){
  const cv = root.querySelector('#v12Canvas'); if (!cv) return;
  cv.addEventListener('pointerdown', e=>{ V12.drag = { x:e.clientX, y:e.clientY }; V12.tween = null; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e=>{ if (!V12.drag) return; V12.yaw += (e.clientX-V12.drag.x)*0.012; V12.pitch = clamp(V12.pitch + (e.clientY-V12.drag.y)*0.01, -1.4, 1.55); V12.drag = { x:e.clientX, y:e.clientY }; if (motionOff()) v12Draw(); });
  const end = ()=>{ V12.drag = null; }; cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  const sp = root.querySelector('#v12Speed'); if (sp) sp.addEventListener('input', ()=>{ V12.speed = +sp.value; v12SpeedTxt(); });
  v12SpeedTxt();
  if (V12.io) V12.io.disconnect();
  V12.io = new IntersectionObserver(es=>{ V12.vis = es[0].isIntersecting; if (V12.vis) v12Kick(); });
  V12.io.observe(cv);
  v12Draw();
}
function v12Action(a, el){
  if (a==='v12-view'){ const [y,p] = V12_VIEWS[el.dataset.id]; const ny = y + Math.round((V12.yaw - y)/(Math.PI*2))*Math.PI*2;
    if (motionOff()){ V12.yaw = ny; V12.pitch = p; v12Draw(); } else { V12.tween = { t0:performance.now(), y0:V12.yaw, y1:ny, p0:V12.pitch, p1:p }; v12Kick(); } }
  else if (a==='v12-run'){ V12.run = !V12.run; el.textContent = V12.run ? 'Pause' : 'Play'; el.classList.toggle('on', V12.run); v12Kick(); }
  else if (a==='v12-answer'){
    const right = [1,1,0][V12.quiz % 3], whys = ['720° ÷ 12 cylinders = 60°, which is why the banks sit 60° apart.','7 sits opposite 1 on the same crank pin and fires 60° later.','An inline six is perfectly balanced; a V12 is two of them on one crank.'];
    const fb = document.getElementById('v12Fb');
    if (+el.dataset.id === right){ fb.innerHTML = `<span class="ok">Correct.</span> ${whys[V12.quiz % 3]}`; V12.quiz++; setTimeout(()=>{ const c = document.getElementById('v12Card'); if (c){ const p = c.parentNode; c.outerHTML = v12CardHTML(); mountV12(p); v12Kick(); } }, 1700); }
    else fb.innerHTML = `<span class="no">Not quite.</span> ${whys[V12.quiz % 3]}`;
  }
}
