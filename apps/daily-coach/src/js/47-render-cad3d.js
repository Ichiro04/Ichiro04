/* ============================================================
   3D CAD PRACTICE — a small software 3D renderer (no library)
   Parts are built from extruded profiles with holes, shaded with
   back-face culling and a painter's sort, outlined with feature
   and silhouette edges. The same geometry produces a first-angle
   orthographic drawing (front, end, plan) with hidden lines.
   ============================================================ */
const V3 = {
  sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]],
  dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  norm:a=>{ const l = Math.hypot(a[0],a[1],a[2]) || 1; return [a[0]/l,a[1]/l,a[2]/l]; }
};
const circleLoop = (cx,cy,r,n=36) => Array.from({length:n},(_,i)=>{ const a = i/n*Math.PI*2; return [cx+Math.cos(a)*r, cy+Math.sin(a)*r]; });
const area2 = l => { let s = 0; for (let i=0;i<l.length;i++){ const a = l[i], b = l[(i+1)%l.length]; s += a[0]*b[1]-b[0]*a[1]; } return s/2; };
function newell(loop){ let n = [0,0,0]; for (let i=0;i<loop.length;i++){ const a = loop[i], b = loop[(i+1)%loop.length]; n[0] += (a[1]-b[1])*(a[2]+b[2]); n[1] += (a[2]-b[2])*(a[0]+b[0]); n[2] += (a[0]-b[0])*(a[1]+b[1]); } return V3.norm(n); }

/* extrude 2D loops (first = outline, rest = holes) from w0 to w1 along basis [eu, ev, ew] */
function extrude(loops, w0, w1, basis, origin=[0,0,0], mat='steel'){
  const [eu,ev,ew] = basis, det = V3.dot(eu, V3.cross(ev,ew));
  let L = loops.map((lp,i)=>{ const ccw = area2(lp) > 0; return (ccw === (i===0)) ? lp : lp.slice().reverse(); });
  if (det < 0) L = L.map(l=>l.slice().reverse());
  const P = (u,v,w) => [origin[0]+u*eu[0]+v*ev[0]+w*ew[0], origin[1]+u*eu[1]+v*ev[1]+w*ew[1], origin[2]+u*eu[2]+v*ev[2]+w*ew[2]];
  const faces = [];
  faces.push({ loops:L.map(l=>l.map(([u,v])=>P(u,v,w1))), cap:true, mat });
  faces.push({ loops:L.map(l=>l.slice().reverse().map(([u,v])=>P(u,v,w0))), cap:true, mat });
  L.forEach((l,li)=>{
    const n = l.length, strip = [];
    for (let i=0;i<n;i++){
      const a = l[i], b = l[(i+1)%n];
      strip.push({ loops:[[P(a[0],a[1],w0),P(b[0],b[1],w0),P(b[0],b[1],w1),P(a[0],a[1],w1)]], side:true, hole:li>0, mat });
    }
    for (let i=0;i<n;i++){
      const prev = l[(i-1+n)%n], a = l[i], b = l[(i+1)%n];
      const d1 = Math.atan2(a[1]-prev[1], a[0]-prev[0]), d2 = Math.atan2(b[1]-a[1], b[0]-a[0]);
      let turn = Math.abs(d2-d1); if (turn > Math.PI) turn = 2*Math.PI - turn;
      strip[i].sharp = turn > 0.45;                        // vertical edge at the start of this quad
      strip[i].prev = strip[(i-1+n)%n]; strip[i].next = strip[(i+1)%n];
    }
    faces.push(...strip);
  });
  faces.forEach(f=>{ f.n = newell(f.loops[0]); const o = f.loops[0]; f.c = o.reduce((s,p)=>[s[0]+p[0]/o.length,s[1]+p[1]/o.length,s[2]+p[2]/o.length],[0,0,0]); });
  return faces;
}
const X=[1,0,0], Y=[0,1,0], Z=[0,0,1];
const rect = (x0,y0,x1,y1) => [[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
function gearLoop(N=16, rf=27, ra=36){
  const pts = [], p = Math.PI*2/N;
  for (let k=0;k<N;k++){ const a = k*p; [[rf,0],[rf,.16],[ra,.33],[ra,.53],[rf,.70]].forEach(([r,f])=>pts.push([Math.cos(a+f*p)*r, Math.sin(a+f*p)*r])); }
  return pts;
}
const CAD_PARTS = {
  bracket:{ name:'L-bracket MB-01', info:'8 mm plate. Two Ø12 fixing holes in the base, two Ø12 holes in the upright, and a centre gusset in front of the upright that stiffens the corner. In the front view the base holes are hidden, so they are drawn dashed.',
    build:()=>[
      ...extrude([rect(0,0,120,60), circleLoop(25,24,6,28), circleLoop(95,24,6,28)], 0, 8, [X,Y,Z]),
      ...extrude([rect(0,8,120,58), circleLoop(30,40,6,28), circleLoop(90,40,6,28)], 52, 60, [X,Z,Y]),
      ...extrude([[[52,8],[20,8],[52,40]]], 56, 64, [Y,Z,X], [0,0,0], 'red') ] },
  bush:{ name:'Flanged bush', info:'Ø60 flange, Ø36 body, Ø20 bore. A typical turned part: the bore is the critical fit, so it carries the tightest tolerance.',
    build:()=>[ ...extrude([circleLoop(0,0,30,40), circleLoop(0,0,10,28)], 0, 8, [X,Y,Z]),
      ...extrude([circleLoop(0,0,18,36), circleLoop(0,0,10,28)], 8, 40, [X,Y,Z], [0,0,0], 'red') ] },
  shaft:{ name:'Stepped shaft', info:'Ø24, Ø32 and Ø20 steps. The shoulders locate a bearing on each side; the larger step carries a gear.',
    build:()=>[ ...extrude([circleLoop(0,0,12,32)], 0, 60, [Y,Z,X]),
      ...extrude([circleLoop(0,0,16,32)], 60, 110, [Y,Z,X], [0,0,0], 'red'),
      ...extrude([circleLoop(0,0,10,32)], 110, 150, [Y,Z,X]) ] },
  gear:{ name:'Spur gear', info:'16 teeth, module 4 (pitch circle Ø64), 12 mm face width, Ø16 bore. Count the teeth in the plan view.',
    build:()=>[ ...extrude([gearLoop(), circleLoop(0,0,8,28)], 0, 12, [X,Y,Z], [0,0,0], 'red') ] }
};
const CAD_VIEWS = { iso:[-0.62,0.52], front:[0,0], top:[0,Math.PI/2], left:[Math.PI/2,0] };
const cad = { part:'bracket', faces:null, yaw:-0.62, pitch:0.52, spin:true, drag:null, raf:0, tween:null, vis:false, io:null, quiz:0, hidden:false, idle:0 };

function camXf(p, yaw, pitch){
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x = p[0]*cy - p[1]*sy, y = p[0]*sy + p[1]*cy, z = p[2];
  return [x, y*cp - z*sp, y*sp + z*cp];   // [screen x, depth (away), screen up]
}
function cadBounds(faces){
  const mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9];
  faces.forEach(f=>f.loops.forEach(l=>l.forEach(p=>{ for (let i=0;i<3;i++){ mn[i] = Math.min(mn[i],p[i]); mx[i] = Math.max(mx[i],p[i]); } })));
  return { mn, mx, c:[(mn[0]+mx[0])/2,(mn[1]+mx[1])/2,(mn[2]+mx[2])/2], r:Math.hypot(mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2])/2 };
}
function cadDraw(){
  const cv = document.getElementById('cadCanvas'); if (!cv || !cad.faces) return;
  const dpr = Math.min(2, window.devicePixelRatio||1), W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W*dpr)){ cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr); }
  const g = cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const b = cad.b, s = Math.min(W,H)*0.40/b.r, cx = W/2, cy = H/2 + 6;
  const tp = p => { const q = camXf([p[0]-b.c[0],p[1]-b.c[1],p[2]-b.c[2]], cad.yaw, cad.pitch); return [cx+q[0]*s, cy-q[2]*s, q[1]]; };
  // floor shadow
  const fl = tp([b.c[0], b.c[1], b.mn[2]]);
  const sh = g.createRadialGradient(fl[0], fl[1]+4, 2, fl[0], fl[1]+4, b.r*s*1.1);
  sh.addColorStop(0, dark?'rgba(224,48,28,.22)':'rgba(28,10,10,.20)'); sh.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle = sh; g.beginPath(); g.ellipse(fl[0], fl[1]+4, b.r*s*1.1, b.r*s*0.32*(0.4+Math.abs(Math.sin(cad.pitch))), 0, 0, Math.PI*2); g.fill();
  const light = V3.norm([-0.45,-0.7,0.6]);
  const vis = f => { const n = camXf(f.n, cad.yaw, cad.pitch); f._n = n; return n[1] < -1e-4; };
  const list = cad.faces.filter(vis);
  list.forEach(f=>{ f._d = camXf(V3.sub(f.c,b.c), cad.yaw, cad.pitch)[1]; });
  list.sort((a,c)=>c._d - a._d);
  const base = { steel: dark?[150,128,116]:[214,200,180], red:[200,30,14] };
  const edge = dark ? 'rgba(255,255,255,.55)' : 'rgba(14,14,20,.75)';
  list.forEach(f=>{
    const lam = Math.max(0, V3.dot(f._n, light)), k = 0.42 + 0.62*lam;
    const c = base[f.mat] || base.steel, spec = Math.pow(lam, 18)*60;
    g.fillStyle = `rgb(${Math.min(255,c[0]*k+spec)|0},${Math.min(255,c[1]*k+spec)|0},${Math.min(255,c[2]*k+spec)|0})`;
    g.beginPath();
    f.loops.forEach(l=>{ l.forEach((p,i)=>{ const q = tp(p); i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); }); g.closePath(); });
    g.fill('evenodd');
    g.strokeStyle = edge; g.lineWidth = 1.1; g.beginPath();
    if (f.cap){ f.loops.forEach(l=>{ l.forEach((p,i)=>{ const q = tp(p); i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); }); g.closePath(); }); }
    else {
      const [p0,p1,p2,p3] = f.loops[0];
      const startEdge = f.sharp || (f.prev && !(f.prev._n && f.prev._n[1] < -1e-4) );
      const endEdge = f.next && (f.next.sharp || !(f.next._n && f.next._n[1] < -1e-4));
      if (startEdge){ const a = tp(p0), c2 = tp(p3); g.moveTo(a[0],a[1]); g.lineTo(c2[0],c2[1]); }
      if (endEdge){ const a = tp(p1), c2 = tp(p2); g.moveTo(a[0],a[1]); g.lineTo(c2[0],c2[1]); }
    }
    g.stroke();
  });
}
/* first-angle orthographic sheet as SVG */
function cadSheet(){
  const faces = cad.faces, b = cad.b, labels = cadLabels();
  const views = [ { key:'front', yaw:0, pitch:0, name:'Front view' }, { key:'end', yaw:Math.PI/2, pitch:0, name:'End view (from left)' }, { key:'plan', yaw:0, pitch:Math.PI/2, name:'Plan' } ];
  const proj = (v,p) => { const q = camXf([p[0]-b.c[0],p[1]-b.c[1],p[2]-b.c[2]], v.yaw, v.pitch); return [q[0], -q[2]]; };
  views.forEach(v=>{
    const segs = [], hid = [];
    faces.forEach(f=>{
      if (f.cap){ f.loops.forEach(l=>{ for (let i=0;i<l.length;i++) segs.push([proj(v,l[i]), proj(v,l[(i+1)%l.length])]); }); }
      else {
        const fac = x => camXf(x.n, v.yaw, v.pitch)[1];
        const me = fac(f), pr = f.prev ? fac(f.prev) : me;
        const sil = (me < -1e-6 && pr > 1e-6) || (me > 1e-6 && pr < -1e-6);
        if (f.sharp || sil){ const [p0,,,p3] = f.loops[0]; (f.hole && sil && !f.sharp ? hid : segs).push([proj(v,p0), proj(v,p3)]); }
      }
    });
    const xs = segs.concat(hid).flat().map(p=>p[0]), ys = segs.concat(hid).flat().map(p=>p[1]);
    v.segs = segs; v.hid = hid; v.mnx = Math.min(...xs); v.mxx = Math.max(...xs); v.mny = Math.min(...ys); v.mxy = Math.max(...ys);
    v.w = v.mxx - v.mnx; v.h = v.mxy - v.mny;
  });
  const [F,E,P] = views, gap = 40, Wd = 340, Hd = 270, pad = 30;
  const s = Math.min((Wd - 2*pad - gap)/(F.w + E.w), (Hd - 2*pad - gap)/(F.h + P.h));
  const fx = pad + 10, fy = pad;
  F.ox = fx - F.mnx*s; F.oy = fy - F.mny*s;
  E.ox = fx + F.w*s + gap - E.mnx*s; E.oy = fy + (F.h*s - E.h*s)/2 - E.mny*s;
  P.ox = fx + (F.w*s - P.w*s)/2 - P.mnx*s; P.oy = fy + F.h*s + gap - P.mny*s;
  const seg = (v,[a,c],cls) => `<line x1="${(v.ox+a[0]*s).toFixed(1)}" y1="${(v.oy+a[1]*s).toFixed(1)}" x2="${(v.ox+c[0]*s).toFixed(1)}" y2="${(v.oy+c[1]*s).toFixed(1)}" class="${cls}"/>`;
  const dims = (()=>{
    const x0 = F.ox+F.mnx*s, x1 = F.ox+F.mxx*s, y0 = F.oy+F.mny*s, y1 = F.oy+F.mxy*s, ex1 = E.ox+E.mnx*s, ex2 = E.ox+E.mxx*s, ey0 = E.oy+E.mny*s;
    const W = Math.round(b.mx[0]-b.mn[0]), Hh = Math.round(b.mx[2]-b.mn[2]), D = Math.round(b.mx[1]-b.mn[1]);
    return `<g class="dim"><line x1="${x0}" y1="${y0-12}" x2="${x1}" y2="${y0-12}" marker-start="url(#dimA)" marker-end="url(#dimA)"/><text x="${(x0+x1)/2}" y="${y0-16}" text-anchor="middle">${W}</text>
      <line x1="${x0-12}" y1="${y0}" x2="${x0-12}" y2="${y1}" marker-start="url(#dimA)" marker-end="url(#dimA)"/><text x="${x0-16}" y="${(y0+y1)/2}" text-anchor="middle" transform="rotate(-90 ${x0-16} ${(y0+y1)/2})">${Hh}</text>
      <line x1="${ex1}" y1="${ey0-12}" x2="${ex2}" y2="${ey0-12}" marker-start="url(#dimA)" marker-end="url(#dimA)"/><text x="${(ex1+ex2)/2}" y="${ey0-16}" text-anchor="middle">${D}</text></g>`;
  })();
  const tag = (v,i) => `<g class="vtag"><rect x="${(v.ox+v.mnx*s-2).toFixed(1)}" y="${(v.oy+v.mxy*s+6).toFixed(1)}" width="18" height="16" rx="4"/><text x="${(v.ox+v.mnx*s+7).toFixed(1)}" y="${(v.oy+v.mxy*s+18).toFixed(1)}" text-anchor="middle">${labels[i]}</text></g>`;
  const sym = `<g class="fa-sym" transform="translate(272,232)"><path d="M0,-9 L18,-5 L18,5 L0,9 Z"/><circle cx="36" cy="0" r="9"/><circle cx="36" cy="0" r="4"/><text x="18" y="24" text-anchor="middle">First angle</text></g>`;
  return `<svg viewBox="0 0 ${Wd} ${Hd}" class="dwg" role="img" aria-label="First-angle orthographic drawing of the ${esc(CAD_PARTS[cad.part].name)}">
    <defs><marker id="dimA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z"/></marker></defs>
    <rect x="4" y="4" width="${Wd-8}" height="${Hd-8}" rx="6" class="dwg-frame"/>
    ${views.map(v=>v.segs.map(sg=>seg(v,sg,'vis')).join('') + v.hid.map(sg=>seg(v,sg,'hid')).join('')).join('')}
    ${dims}${views.map((v,i)=>tag(v,i)).join('')}${sym}
  </svg>`;
}
function cadLabels(){ const seed = hashStr(dkey()+cad.part) % 6; return [['A','B','C'],['B','C','A'],['C','A','B'],['A','C','B'],['B','A','C'],['C','B','A']][seed]; }
const CAD_QS = [ ['plan', 'Which letter is the plan, the view from above?', 2], ['front','Which letter is the front view?', 0], ['end','Which letter is the end view, seen from the left?', 1] ];
function cadCardHTML(){
  if (!cad.faces) cadSetPart(cad.part);
  const p = CAD_PARTS[cad.part], q = CAD_QS[cad.quiz % 3];
  return `<div class="glass cadcard" id="cadCard">
    <div class="cadhead"><div><div class="h3">3D CAD practice</div><div class="tiny">Drag to rotate. Then read the drawing and answer.</div></div>
      <span class="chip-live">3D</span></div>
    <div class="cadparts">${Object.entries(CAD_PARTS).map(([k,v])=>`<button class="${k===cad.part?'on':''}" data-a="cad-part" data-id="${k}">${esc(v.name)}</button>`).join('')}</div>
    <div class="cadstage"><canvas id="cadCanvas" aria-label="3D model of the ${esc(p.name)}. Drag to rotate."></canvas>
      <div class="cadviews">${[['iso','Iso'],['front','Front'],['top','Top'],['left','Left']].map(([k,l])=>`<button data-a="cad-view" data-id="${k}">${l}</button>`).join('')}<button data-a="cad-spin" class="${cad.spin?'on':''}">Spin</button></div></div>
    <p class="cadinfo"><b>${esc(p.name)}.</b> ${esc(p.info)}</p>
    <div class="h3" style="margin-top:12px">First-angle drawing</div>
    <div class="tiny">UK convention: plan below the front view, end view from the left drawn on the right. Solid = visible edge, dashed = hidden edge.</div>
    <div class="sheetwrap ${cad.hidden?'hide':''}" id="cadSheet">${cadSheet()}</div>
    <div class="cadquiz"><div class="q">${esc(q[1])}</div>
      <div class="row" style="gap:8px">${['A','B','C'].map(L=>`<button class="qbtn" data-a="cad-answer" data-id="${L}">${L}</button>`).join('')}
      <button class="btn btn-soft btn-sm" data-a="cad-hide">${cad.hidden?'Show drawing':'Sketch it first'}</button></div>
      <div class="qfb" id="cadFb" aria-live="polite"></div></div>
  </div>`;
}
function cadSetPart(id){ cad.part = id; cad.faces = CAD_PARTS[id].build(); cad.b = cadBounds(cad.faces); }
function cadLoop(){
  cad.raf = 0;
  if (!cad.vis || !document.getElementById('cadCanvas')) return;
  if (cad.tween){
    const t = Math.min(1, (performance.now()-cad.tween.t0)/650), e = 1 - Math.pow(1-t,3);
    cad.yaw = cad.tween.y0 + (cad.tween.y1-cad.tween.y0)*e; cad.pitch = cad.tween.p0 + (cad.tween.p1-cad.tween.p0)*e;
    if (t >= 1) cad.tween = null;
  } else if (cad.spin && !cad.drag && !motionOff() && performance.now() > cad.idle) cad.yaw += 0.006;
  cadDraw();
  cad.raf = requestAnimationFrame(cadLoop);
}
function cadKick(){ if (!cad.raf) cad.raf = requestAnimationFrame(cadLoop); }
function mountCad(root){
  const cv = root.querySelector('#cadCanvas'); if (!cv) return;
  if (!cad.faces) cadSetPart(cad.part);
  cv.addEventListener('pointerdown', e=>{ cad.drag = { x:e.clientX, y:e.clientY }; cad.tween = null; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e=>{ if (!cad.drag) return; cad.yaw += (e.clientX-cad.drag.x)*0.012; cad.pitch = clamp(cad.pitch + (e.clientY-cad.drag.y)*0.01, -1.45, 1.55); cad.drag = { x:e.clientX, y:e.clientY }; if (motionOff()) cadDraw(); });
  const end = ()=>{ cad.drag = null; cad.idle = performance.now() + 3500; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  if (cad.io) cad.io.disconnect();
  cad.io = new IntersectionObserver(es=>{ cad.vis = es[0].isIntersecting; if (cad.vis) cadKick(); });
  cad.io.observe(cv);
  cadDraw();
}
function cadRefresh(){ const card = document.getElementById('cadCard'); if (!card) return; card.outerHTML = cadCardHTML(); mountCad(document.getElementById('cadCard').parentNode); cadKick(); }
function cadAction(a, el){
  if (a==='cad-part'){ cadSetPart(el.dataset.id); cadRefresh(); }
  else if (a==='cad-view'){ const [y,p] = CAD_VIEWS[el.dataset.id]; const ny = y + Math.round((cad.yaw - y)/(Math.PI*2))*Math.PI*2;
    if (motionOff()){ cad.yaw = ny; cad.pitch = p; cadDraw(); } else { cad.tween = { t0:performance.now(), y0:cad.yaw, y1:ny, p0:cad.pitch, p1:p }; cad.spin = false; document.querySelector('[data-a="cad-spin"]')?.classList.remove('on'); cadKick(); } }
  else if (a==='cad-spin'){ cad.spin = !cad.spin; el.classList.toggle('on', cad.spin); cadKick(); }
  else if (a==='cad-hide'){ cad.hidden = !cad.hidden; document.getElementById('cadSheet').classList.toggle('hide', cad.hidden); el.textContent = cad.hidden ? 'Show drawing' : 'Sketch it first'; }
  else if (a==='cad-answer'){
    const q = CAD_QS[cad.quiz % 3], right = cadLabels()[q[2]], fb = document.getElementById('cadFb');
    if (el.dataset.id === right){ fb.innerHTML = `<span class="ok">Correct: ${right} is the ${q[0]==='end'?'end view':q[0]==='plan'?'plan':'front view'}.</span> Next question loads in a moment.`; cad.quiz++; setTimeout(cadRefresh, 1600); }
    else fb.innerHTML = `<span class="no">Not quite.</span> ${q[0]==='plan'?'In first angle the plan sits below the front view.':q[0]==='end'?'In first angle the view from the left is drawn on the right.':'The front view is the top-left one; the others are projected from it.'}`;
  }
}
