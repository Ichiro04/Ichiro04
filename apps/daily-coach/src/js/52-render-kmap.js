/* ============================================================
   KNOWLEDGE MAP — full-screen network view of everything Kyaw is
   learning, recreating the motion and layout of a policy-graph
   concept video: core ignition and node burst, glowing network with
   timeline and KPI ask bar, analysis panel, then a focus view where
   one topic becomes an orb, count tiles grow out, a list fans out on
   curves and a detail panel slides in.
   ============================================================ */
const KM_DOMAINS = [
  { id:'thermo', name:'Thermoforming and packaging', w:24, icon:'bolt', topics:[
    { n:'Thermoforming, sheet to part', pack:'thermo', kw:'thermo forming sheet huhtamaki mould' },
    { n:'Films and polymers', pack:'films', kw:'film polymer plastic pet pe' },
    { n:'Tray sealing and lidding', pack:'lidding', kw:'seal lidding tray' },
    { n:'Vacuum and modified atmosphere', pack:'micvac', kw:'vacuum map gas micvac' },
    { n:'Bagging lines (VFFS)', pack:'vffs', kw:'bagging vffs jaws' },
    { n:'Flow wrap and registration', pack:'flowwrap', kw:'flow wrap photo eye registration' } ] },
  { id:'mfg', name:'Manufacturing', w:16, icon:'gears', topics:[
    { n:'CNC machining and tolerance', pack:'cnc', kw:'cnc machining lathe mill' },
    { n:'Rotational moulding', pack:'rotomould', kw:'roto rotational moulding cooling' },
    { n:'Changeovers and SMED', pack:'smed', kw:'changeover smed' } ] },
  { id:'ops', name:'Quality and operations', w:12, icon:'chart', topics:[
    { n:'OEE that means something', pack:'oee', kw:'oee efficiency availability' },
    { n:'Root-cause analysis', pack:'rca', kw:'root cause rca fishbone why' },
    { n:'SPC and capability', kw:'spc cpk capability control chart', plan:true } ] },
  { id:'maint', name:'Maintenance', w:11, icon:'wrench', topics:[
    { n:'PPM and condition monitoring', pack:'ppm', kw:'ppm maintenance condition monitoring' },
    { n:'Engine fault diagnosis', lab:'v12', kw:'fault diagnosis misfire bearing knock twin' },
    { n:'Safe isolation (LOTO)', kw:'loto isolation lock safety', plan:true } ] },
  { id:'cad', name:'CAD and drawings', w:13, icon:'pen', topics:[
    { n:'3D CAD practice', lab:'cad', kw:'cad 3d model solidworks' },
    { n:'Reading technical drawings', lab:'dwg', kw:'drawing read views projection first angle' },
    { n:'Tolerances and ISO fits', lab:'dwg', kw:'tolerance fit h7 g6 limits' },
    { n:'GD&T frames and datums', lab:'dwg', kw:'gdt gd&t datum runout perpendicularity' } ] },
  { id:'machines', name:'Engines and machines', w:8, icon:'gauge', topics:[
    { n:'V12 engine layout', lab:'v12', kw:'v12 engine firing order crank' },
    { n:'Gears and drives', kw:'gear drive ratio torque', plan:true },
    { n:'Pneumatics', kw:'pneumatic cylinder air', plan:true } ] },
  { id:'mech', name:'Mechanics and materials', w:7, icon:'target', topics:[
    { n:'Stress and strain', kw:'stress strain hooke', plan:true },
    { n:'Beam bending', kw:'beam bending moment deflection', plan:true },
    { n:'Fatigue', kw:'fatigue crack endurance', plan:true } ] },
  { id:'career', name:'Career', w:5, icon:'flag', topics:[
    { n:'Huhtamaki application', learn:'career', kw:'huhtamaki job application interview assessment' },
    { n:'Interview story bank', learn:'career', kw:'interview star story' },
    { n:'Portfolio pieces', learn:'career', kw:'portfolio cv' } ] },
  { id:'english', name:'English (IELTS)', w:4, icon:'book', topics:[
    { n:'Task 2 essays', learn:'essay', kw:'ielts essay writing task' },
    { n:'Speaking part 2', learn:'speak', kw:'speaking cue card' },
    { n:'Academic vocabulary', learn:'words', kw:'vocabulary words' } ] }
];
const KM = { yaw:-.5, tilt:.95, vy:0, freeze:false, freezeT:0, open:false, view:'graph', layout:'radial', t0:0, nodes:[], edges:[], cam:{ x:0, y:0, z:1 }, tween:null, sel:null, hover:null,
  gaps:false, labels:true, raf:0, pulses:[], lastPulse:0, W:0, H:0, dpr:1, drag:null, ptr:new Map(), focus:null, tile:2, month:null, orbRaf:0, base:1 };

/* ---------- progress from the app's own data ---------- */
function kmPack(id){ return (typeof KNOWLEDGE_PACKS!=='undefined' && KNOWLEDGE_PACKS.find(p=>p.id===id)) || null; }
function kmMastery(t){
  try {
    if (t.pack) return state.knowledge && state.knowledge[t.pack] ? 100 : 0;
    if (t.lab==='dwg') return Math.round((typeof dxBest==='function' ? dxBest() : 0) / 8 * 100);
    if (t.lab==='v12') return V12 && V12.quiz ? Math.min(100, V12.quiz*34) : 0;
    if (t.lab==='cad') return cad && cad.quiz ? Math.min(100, cad.quiz*34) : 0;
    if (t.n==='Huhtamaki application'){ const h = Object.assign({applied:true}, (state.career||{}).huht||{}); return Math.round(HUHT_STAGES.filter(s=>h[s.id]).length/HUHT_STAGES.length*100); }
    if (t.n==='Portfolio pieces'){ const p = (state.career||{}).portfolio||{}; return Math.round(PORTFOLIO.filter(x=>p[x.id]).length/PORTFOLIO.length*100); }
    if (t.learn==='essay') return Math.min(100, ((state.ielts||{}).essays||[]).length*10);
  } catch(e){}
  return 0;
}
function kmLastDate(t){ try { if (t.pack && state.knowledge[t.pack]) return state.knowledge[t.pack]; } catch(e){} return null; }
const kmShort = (s, n=30) => { s = String(s).replace(/\s+/g,' ').trim(); const c = s.split(/[.:;—–]/)[0]; const x = c.length > 6 ? c : s; return x.length > n ? x.slice(0, n-1).trimEnd() + '…' : x; };
function kmItems(t){
  const p = t.pack ? kmPack(t.pack) : null, dom = KM_DOMAINS.find(d=>d.topics.includes(t));
  const points = p ? p.points.map(x=>kmShort(x)) : t.lab==='dwg' ? Object.values(DX_INFO).map(i=>kmShort(i.t)) : t.lab==='v12' ? ['60° between the banks','Each bank is an inline six','Six throws, 120° apart','Firing order 1-7-5-11','Slider-crank motion','Fires every 1.43 ms at 7,000'] : t.lab==='cad' ? Object.values(CAD_PARTS).map(x=>x.name).concat(['First-angle projection','Hidden lines dashed','Dimensions from datums']) : t.learn==='career' ? (t.n.startsWith('Huht') ? HUHT_STAGES.map(s=>kmShort(s.t)) : t.n.startsWith('Interview') ? STORIES.map(s=>kmShort(s.q)) : PORTFOLIO.map(x=>x.t)) : t.learn==='words' ? WORDS.slice(0,12).map(w=>w.w) : t.learn==='speak' ? CUE_CARDS.slice(0,8).map(c=>kmShort(c.q)) : t.learn==='essay' ? ESSAY_PROMPTS.slice(0,8).map(e=>kmShort(e.q||e.t||e.prompt||String(e))) : ['Read the key idea','Work one example','Explain it out loud','Find it on the shop floor'];
  const diagrams = [p && typeof PACK_DIAGRAMS!=='undefined' && PACK_DIAGRAMS[t.pack] ? 'Pack diagram: ' + kmShort(p.title, 22) : null, t.lab==='v12' ? 'V12 3D model' : null, t.lab==='v12' ? 'Cylinder 1 cut-away' : null, t.lab==='dwg' ? 'Shaft SH-20 drawing' : null, t.lab==='cad' ? '3D model and drawing sheet' : null, t.lab==='v12' ? 'Vibration trace' : null].filter(Boolean);
  const practice = [p ? kmShort(p.ask, 32) : null].concat(t.lab==='dwg' ? DX_Q.map(q=>kmShort(q.q, 32)) : t.lab==='v12' ? Object.values(V12_FAULTS).slice(1).map(f=>'Diagnose: ' + kmShort(f.name, 22)) : t.lab==='cad' ? ['Which letter is the plan?','Which is the front view?','Which is the end view?'] : QUESTION_BANK.filter(q=>new RegExp((t.kw||'').split(' ').slice(0,3).join('|'),'i').test(q.q)).map(q=>kmShort(q.q, 32))).filter(Boolean);
  const related = KM_DOMAINS.flatMap(d=>d.topics).filter(x=>x!==t && (dom.topics.includes(x) || (x.kw||'').split(' ').some(k=>k.length>3 && (t.kw||'').includes(k)))).map(x=>x.n);
  const floor = [p ? kmShort(p.new, 32) : null, 'Spot it on the warehouse tour', 'Explain it in one minute', 'Write one A4 page about it'].filter(Boolean);
  return [
    { k:'points', label:'Key points', icon:'book', list:points },
    { k:'diag', label:'Diagrams', icon:'pen', list:diagrams.length ? diagrams : ['Sketch it by hand first'] },
    { k:'practice', label:'Practice questions', icon:'target', list:practice.length ? practice : ['Explain it out loud', 'Teach it to a friend'] },
    { k:'related', label:'Related topics', icon:'gears', list:related },
    { k:'floor', label:'Shop-floor tasks', icon:'wrench', list:floor }
  ];
}

/* ---------- graph ---------- */
function kmBuild(){
  const rnd = mulberry32(hashStr('kmap-v1')), nodes = [], edges = [];
  const core = { id:'core', type:'core', name:'Mechanical engineering', r:24, ph:0 }; nodes.push(core);
  const N = KM_DOMAINS.length;
  KM_DOMAINS.forEach((d,i)=>{
    const a = -Math.PI/2 + (i+.3)/N*Math.PI*2 + (rnd()-.5)*.22, R = 1 + (rnd()-.5)*.24;
    const dn = { id:d.id, type:'domain', name:d.name, w:d.w, dom:d, a, R, r:10, ph:rnd()*6 }; nodes.push(dn); edges.push({ a:core, b:dn, k:'beam' });
    d.topics.forEach((t,j)=>{
      const spread = (j-(d.topics.length-1)/2) * (1.15/Math.max(1,d.topics.length-1)) * 1.6;
      const tn = { id:d.id+':'+j, type:'topic', name:t.n, dom:d, topic:t, parent:dn, ta:a + spread + (rnd()-.5)*.25, tr:.42 + rnd()*.22, r:8.5, ph:rnd()*6, inner:rnd()<.3 };
      nodes.push(tn); edges.push({ a:dn, b:tn, k:'thin' }); if (rnd() < .3) edges.push({ a:core, b:tn, k:'teal' });
      const its = kmItems(t), q = its[2].list.length, pts = its[0].list.length;
      const pn = { id:tn.id+':q', type:'practice', n:q, parent:tn, ta:tn.ta + (rnd()-.5)*1.4, tr:.16 + rnd()*.08, r:4.5, ph:rnd()*6 }; nodes.push(pn); edges.push({ a:tn, b:pn, k:'dot' });
      if (rnd() < .6){ const sn = { id:tn.id+':s', type:'skill', n:pts, parent:tn, ta:tn.ta + (rnd()-.5)*1.8, tr:.13 + rnd()*.08, r:3.6, ph:rnd()*6 }; nodes.push(sn); edges.push({ a:tn, b:sn, k:'dot' }); }
    });
    for (let s=0;s<2;s++){ const sn = { id:d.id+':x'+s, type: s ? 'skill' : 'practice', n:Math.round(4 + rnd()*30), parent:dn, ta:a + (s ? .9 : -.9) + (rnd()-.5)*.6, tr:.2 + rnd()*.1, r: s ? 3.6 : 4.5, ph:rnd()*6, spark: rnd() < .3 }; nodes.push(sn); edges.push({ a:dn, b:sn, k:'dot' }); }
  });
  // cross links between related topics in neighbouring domains
  const topics = nodes.filter(n=>n.type==='topic');
  for (let i=0;i<7;i++){ const a = topics[Math.floor(rnd()*topics.length)], b = topics[Math.floor(rnd()*topics.length)]; if (a!==b && a.dom!==b.dom) edges.push({ a, b, k:'teal' }); }
  KM.nodes = nodes; KM.edges = edges;
  kmLayout(true);
}
function kmLayout(snap){
  const W = KM.W || 1200, H = KM.H || 800, N = KM_DOMAINS.length;
  KM.nodes.forEach(n=>{
    if (n.type==='domain'){ const i = KM_DOMAINS.indexOf(n.dom); n.orad = .26 + i/(N-1)*.66; n.oth = i*2.39 + (n.ph%1)*.4; }
    else if (n.type==='topic'){ const j = n.dom.topics.indexOf(n.topic), k = n.dom.topics.length; n.lr = .1 + (j%2)*.045; n.lth = j/k*Math.PI*2 + n.ph; }
    else if (n.type==='practice' || n.type==='skill'){ n.lr = .028 + (n.ph%1)*.02; n.lth = n.ph*2; }
  });
  const wide = W >= 1100, top = W < 760 ? 112 : 76;
  // no frame: the galaxy fills the screen like a mind map, between the side panels on wide screens
  const ct = Math.cos(.55); let R, cx = W/2, cy, hh;
  if (wide){ const bot = 170; R = Math.min((W - 2*290)/2*.92, (H - top - bot)/2/(ct*.98)); cy = top + (H - top - bot)/2 + 8; }
  else { const bot = W < 760 ? 186 : 176, mini = 70; R = Math.max(120, Math.min(W*.56, (H - top - bot - mini)/2/(ct*.98), 420)); const used = 2*R*ct*.98 + 18 + mini, free = H - top - bot - used; cy = top + R*ct*.98 + Math.max(0, free*.4); }
  hh = R*ct*.98; KM.orb = { cx, cy, r:R }; KM.R = R;
  const el = document.getElementById('km'); if (el){ el.style.setProperty('--ox', cx+'px'); el.style.setProperty('--oy', cy+'px'); el.style.setProperty('--or', Math.min(R, 380)+'px'); el.style.setProperty('--oh', hh+'px'); requestAnimationFrame(kmTitleBox); }
}
function kmPos(n){ return [n.wx||0, n.wz||0]; }
function kmIntroAt(n){ if (n.type==='core') return 0; const d = n.type==='domain' ? n : n.parent && n.parent.type==='domain' ? n.parent : n.parent && n.parent.parent ? n.parent.parent : n; return .9 + (d.orad||.5)*1.6 + (n.type==='domain'?0:.25) + ((n.ph*37)%1)*.15; }
function kmWorld(n, T){ // disc coordinates (x, z) for each node, with differential rotation
  if (n.type==='core') return [0,0];
  if (n.type==='domain'){ const th = n.oth + (KM.freeze ? KM.freezeT : GAL.spin(n.orad, T)*.55); return [Math.cos(th)*n.orad, Math.sin(th)*n.orad]; }
  const p = kmWorld(n.parent, T), sp = KM.freeze ? KM.freezeT : T; const th = n.lth + sp*(n.type==='topic' ? .12 : .3);
  return [p[0] + Math.cos(th)*n.lr, p[1] + Math.sin(th)*n.lr];
}
const KM_PLANET = { domain:null, topic:['#FFFFFF','#C9D6EC','#3C4A66'], practice:['#FFF3E2','#D9BC9C','#6A4E34'], skill:['#F6D9DE','#C2304A','#4A0D14'] };
function kmDraw(now){
  const cv = document.getElementById('kmCanvas'); if (!cv) return;
  const g = cv.getContext('2d'), W = KM.W, H = KM.H;
  g.setTransform(KM.dpr,0,0,KM.dpr,0,0); g.clearRect(0,0,W,H);
  const T = (now - KM.t0)/1000, still = motionOff(), TT = still ? 30 : T;
  if (KM.tween){ const k = Math.min(1,(now-KM.tween.t0)/KM.tween.d), e = 1-Math.pow(1-k,3); KM.cam.x = KM.tween.x0+(KM.tween.x1-KM.tween.x0)*e; KM.cam.y = KM.tween.y0+(KM.tween.y1-KM.tween.y0)*e; KM.cam.z = KM.tween.z0+(KM.tween.z1-KM.tween.z0)*e; if (KM.tween.t1!==undefined) KM.tilt = kmWrap(KM.tween.t0v+(KM.tween.t1-KM.tween.t0v)*e); if (k>=1) KM.tween = null; }
  if (!KM.drag && !still){ KM.yaw += KM.vy; KM.vy *= .94; if (!KM.tween){ KM.tilt = kmWrap(KM.tilt + (KM.vt||0)); } KM.vt = (KM.vt||0)*.94; }
  if (!KM.freeze) KM.freezeT = TT;
  { const want = KM.view==='graph' && !KM.sel && KM.cam.z < 1.3 && (still || T > 2.2) ? 1 : 0; KM.tA = (KM.tA||0) + (want - (KM.tA||0))*(still ? 1 : .12);
    const root = document.getElementById('km'); if (root){ const on = KM.tA > .5; if (root.classList.contains('titled') !== on) root.classList.toggle('titled', on); } }
  const intro = still ? 1 : clamp((T - .2)/2.2, 0, 1), ie = 1 - Math.pow(1-intro, 3);
  const O = KM.orb || { cx:W/2, cy:H/2, r:Math.min(W,H)*.4 }, R = (KM.R||300)*KM.cam.z, v = { cx: O.cx + KM.cam.x, cy: O.cy + KM.cam.y, R, yaw: KM.yaw, tilt: KM.tilt };
  const fade = KM.view==='leaving' ? clamp(1 - (now - KM.leaveT0)/600, 0, 1) : 1;
  // background stars (screen space, gentle parallax with yaw)
  if (!KM.stars){ const r = mulberry32(99); KM.stars = Array.from({length:260},()=>[r(), r(), r()*1.2+.3, r()*.6+.2, r()*6]); }
  KM.stars.forEach(([x,y,s,a,tw])=>{ g.globalAlpha = a*(.7+.3*Math.sin(TT*1.2+tw))*fade; g.fillStyle = '#F2EEE8'; g.fillRect(((x*W + KM.yaw*20) % W + W) % W, y*H, s, s); }); g.globalAlpha = 1;
  if (!KM.dust) KM.dust = GAL.dust(W < 760 ? 2600 : 4200, 77);
  const vD = Object.assign({}, v, { R: R*(1 + (1-ie)*1.4) });
  KM_DOMAINS.forEach((d,i)=>GAL.drawRing(g, .26 + i/(KM_DOMAINS.length-1)*.66, v, .09*ie*fade, TT));
  if (!KM.neb) KM.neb = GAL.nebula(); GAL.drawNebula(g, KM.neb, vD, TT, ie*fade);
  GAL.drawDust(g, KM.dust, vD, TT, ie*fade*.95);
  // project nodes
  const conn = KM.sel ? new Set([KM.sel, ...KM.edges.filter(e=>e.a===KM.sel||e.b===KM.sel).flatMap(e=>[e.a,e.b])]) : null;
  KM.nodes.forEach(n=>{ const w = kmWorld(n, TT), p = GAL.proj(w[0]*(1+(1-ie)*.6), w[1]*(1+(1-ie)*.6), 0, v); n.wx = w[0]; n.wz = w[1]; n.sx = p[0]; n.sy = p[1]; n.dz = p[2];
    let a = (still ? 1 : clamp((T - kmIntroAt(n))/.6, 0, 1)) * fade; if (conn && !conn.has(n)) a *= .25; if (KM.gaps && n.type==='topic' && kmMastery(n.topic) >= 100) a *= .25; n.va = a; });
  // links: soft, curved, low contrast
  g.lineCap = 'round';
  KM.edges.forEach(e=>{ const a = Math.min(e.a.va, e.b.va); if (a <= 0) return; const hot = KM.sel && (e.a===KM.sel || e.b===KM.sel);
    if (e.k==='beam'){ const gr = g.createLinearGradient(e.a.sx,e.a.sy,e.b.sx,e.b.sy); gr.addColorStop(0,`rgba(255,226,196,${(.32*a).toFixed(3)})`); gr.addColorStop(1,`rgba(201,168,130,${((hot?.5:.08)*a).toFixed(3)})`); g.strokeStyle = gr; g.lineWidth = hot ? 1.6 : 1; g.beginPath(); g.moveTo(e.a.sx,e.a.sy); g.lineTo(e.b.sx,e.b.sy); g.stroke(); return; }
    if (e.k==='teal'){ const mx = (e.a.sx+e.b.sx)/2, my = (e.a.sy+e.b.sy)/2, cx = v.cx + (mx - v.cx)*.55, cy = v.cy + (my - v.cy)*.55; g.strokeStyle = `rgba(214,184,150,${((hot?.55:.16)*a).toFixed(3)})`; g.lineWidth = .9; g.beginPath(); g.moveTo(e.a.sx,e.a.sy); g.quadraticCurveTo(cx,cy,e.b.sx,e.b.sy); g.stroke(); return; }
    g.strokeStyle = e.k==='thin' ? `rgba(226,232,242,${((hot?.7:.28)*a).toFixed(3)})` : `rgba(230,214,196,${(.2*a).toFixed(3)})`; g.lineWidth = e.k==='thin' ? .9 : .7;
    if (e.k==='dot') g.setLineDash([1.5,3]); g.beginPath(); g.moveTo(e.a.sx,e.a.sy); g.lineTo(e.b.sx,e.b.sy); g.stroke(); g.setLineDash([]); });
  // comets running out along the core links
  if (!still && T > 2.6 && KM.view==='graph'){
    if (now - KM.lastPulse > 420){ KM.lastPulse = now; const beams = KM.edges.filter(e=>e.k==='beam'); KM.pulses.push({ e:beams[Math.floor(Math.random()*beams.length)], t0:now, d:1800 + Math.random()*900 }); }
    KM.pulses = KM.pulses.filter(p=>now - p.t0 < p.d); g.globalCompositeOperation = 'lighter';
    KM.pulses.forEach(p=>{ const k = (now - p.t0)/p.d, a = p.e.a, b = p.e.b, x = a.sx+(b.sx-a.sx)*k, y = a.sy+(b.sy-a.sy)*k, al = Math.sin(k*Math.PI)*fade; const gr = g.createRadialGradient(x,y,0,x,y,7); gr.addColorStop(0,`rgba(255,240,220,${al.toFixed(2)})`); gr.addColorStop(1,'rgba(255,220,180,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x,y,7,0,7); g.fill(); });
    g.globalCompositeOperation = 'source-over';
  }
  // core
  const core = KM.nodes[0]; GAL.drawCore(g, core.sx, core.sy, R*.06*(still ? 1 : (T < 1.2 ? .4 + .9*Math.sin(clamp(T/1.2,0,1)*Math.PI/2) + (T>.7&&T<1.2? (1.2-T)*1.4 : 0) : 1)), fade);
  core.sr = R*.06;
  // nodes, far to near
  const list = KM.nodes.filter(n=>n.type!=='core' && n.va > 0).sort((a,b)=>a.dz-b.dz); KM.labs = [];
  // reserve label space front-to-back: domains first, then the nearest topics
  const labOK = new Set(); g.font = '600 13px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
  [...list].sort((a,b)=>(a.type==='domain'?0:a.type==='topic'?1:2)-(b.type==='domain'?0:b.type==='topic'?1:2) || (KM.sel===b)-(KM.sel===a) || b.dz-a.dz).forEach(n=>{ if (n.type==='practice'||n.type==='skill') return; const w = g.measureText(n.name).width*(n.type==='topic'?.93:1) + 6, r = n.type==='domain' ? (7.5 + n.w*.4)*Math.max(.7, Math.min(1.35, KM.cam.z)) : 4, h = n.type==='domain' ? 30 : 16, xr = n.sx + r + 6, xl = n.sx - r - 6 - w; n.lside = xr + w > W - 8 ? -1 : 1; if (kmLabelFree(n.lside > 0 ? xr : xl, n.sy - 10, w, h)) labOK.add(n); else if (n.type==='domain' && kmLabelFree(n.lside > 0 ? xl : xr, n.sy - 10, w, h)){ n.lside = -n.lside; labOK.add(n); } });
  const zs = Math.max(.7, Math.min(1.8, KM.cam.z));
  list.forEach(n=>{
    const depth = .8 + .25*(n.dz+1)/2, hov = KM.hover===n ? 1.25 : 1;
    if (n.type==='domain'){ const r = (7.5 + n.w*.4)*Math.min(zs,1.35)*depth*hov, col = GAL_PLANETS[KM_DOMAINS.indexOf(n.dom) % GAL_PLANETS.length];
      GAL.planet(g, n.sx, n.sy, r, col, core.sx-n.sx, core.sy-n.sy, n.va); n.sr = r;
      g.globalAlpha = n.va; g.font = '600 13px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; g.fillStyle = '#F4EFE8'; g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 8;
      const lab = W < 760 && n.name.length > 16 ? n.name.slice(0,15).trimEnd()+'…' : n.name, lw = g.measureText(lab).width, lx = n.lside < 0 ? n.sx - r - 9 - lw : n.sx + r + 9; if (!labOK.has(n)) g.globalAlpha = 0; else if (kmInTitle(lx, n.sy, lw)) g.globalAlpha = n.va*(1-KM.tA); g.fillText(lab, lx, n.sy + 1); g.shadowBlur = 0; if (labOK.has(n)) kmChip(g, lx, n.sy + 15, n.w + '%', n.va*.95*(kmInTitle(lx, n.sy, 40) ? 1-KM.tA : 1)); g.globalAlpha = 1; }
    else if (n.type==='topic'){ const r = 3.4*Math.min(zs,1.4)*depth*hov, m = kmMastery(n.topic);
      g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(n.sx,n.sy,0,n.sx,n.sy,r*3.4); gr.addColorStop(0,`rgba(${m>=100?'230,205,176':'200,216,240'},${(.3*n.va).toFixed(2)})`); gr.addColorStop(1,'rgba(180,200,240,0)'); g.fillStyle = gr; g.beginPath(); g.arc(n.sx,n.sy,r*3.4,0,7); g.fill(); g.globalCompositeOperation = 'source-over';
      GAL.planet(g, n.sx, n.sy, r, m>=100 ? KM_PLANET.practice : KM_PLANET.topic, core.sx-n.sx, core.sy-n.sy, n.va); n.sr = r + 4;
      if (KM.hover===n || KM.sel===n || (labOK.has(n) && ((KM.labels && KM.cam.z > 1.5) || (conn && conn.has(n))))){ g.globalAlpha = n.va; g.font = '600 12px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; g.fillStyle = '#E8EEF8'; g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 6; g.fillText(n.name, n.sx + r + 8, n.sy + 4); g.shadowBlur = 0; g.globalAlpha = 1; } }
    else { const r = (n.type==='practice' ? 2 : 1.6)*zs*depth; g.globalAlpha = n.va; g.fillStyle = n.type==='practice' ? '#E6CDB0' : '#D44A62'; g.beginPath(); g.arc(n.sx,n.sy,r,0,7); g.fill(); g.globalAlpha = 1; n.sr = r + 5;
      if (KM.labels && KM.cam.z > 2.2 && kmLabelFree(n.sx + r + 3, n.sy - 12, 18, 12)) kmChip(g, n.sx + r + 4, n.sy - 6, String(n.n), n.va*.85); }
  });
  // a soft dark band keeps the title readable over the core
  if (KM.tA > .01){ const tr = Math.min(O.r, 380), ty = O.cy - tr*.02, tv = g.createRadialGradient(O.cx, ty, 0, O.cx, ty, tr*.7); tv.addColorStop(0,`rgba(8,6,7,${(.55*KM.tA).toFixed(3)})`); tv.addColorStop(1,'rgba(8,6,7,0)'); g.fillStyle = tv; g.beginPath(); g.ellipse(O.cx, ty, tr*.74, tr*.3, 0, 0, 7); g.fill(); }
}
function kmTitleBox(){ // union of the title's text lines, in canvas coordinates
  const t = document.querySelector('.km-title'), cv = document.getElementById('kmCanvas'); if (!t || !cv) return; const c = cv.getBoundingClientRect(); let b = null;
  t.querySelectorAll('small,h1,span').forEach(el=>{ const r = el.getBoundingClientRect(), w = el.tagName==='H1' ? r.width : Math.min(r.width, el.scrollWidth); const x0 = r.left + (r.width - w)/2 - c.left; b = b ? [Math.min(b[0],x0), Math.min(b[1],r.top-c.top), Math.max(b[2],x0+w), Math.max(b[3],r.bottom-c.top)] : [x0, r.top-c.top, x0+w, r.bottom-c.top]; });
  KM.tBox = b; }
function kmInTitle(x, y, w=0){ const b = KM.tBox; return b && KM.tA > .3 && x < b[2] + 8 && x + w > b[0] - 8 && y + 18 > b[1] - 4 && y - 12 < b[3] + 4; }
function kmLabelFree(x, y, w, h){ // simple collision check so zoomed-in labels never pile up
  const L = KM.labs || (KM.labs = []); for (const b of L) if (x < b[0]+b[2] && x+w > b[0] && y < b[1]+b[3] && y+h > b[1]) return false; L.push([x, y, w, h]); return true; }
function kmToWorld(x,y){ return [x,y]; }
function kmWrap(a){ const P = Math.PI*2; return ((a + Math.PI) % P + P) % P - Math.PI; } // full 360° turns in both directions
function kmCamTo(x, y, z, d=700, raw, tilt){ KM.tween = { t0:performance.now(), d: motionOff() ? 1 : d, x0:KM.cam.x, y0:KM.cam.y, z0:KM.cam.z, x1:x, y1:y, z1:clamp(z,.5,4) }; if (tilt!==undefined){ KM.vt = 0; KM.tween.t0v = KM.tilt; KM.tween.t1 = tilt + Math.PI*2*Math.round((KM.tilt - tilt)/(Math.PI*2)); } }
function kmCenterOn(n, z){ const z1 = clamp(z,.5,4), f = z1/KM.cam.z, O = KM.orb || { cx:KM.W/2, cy:KM.H/2 }; const ox = n.sx - (O.cx + KM.cam.x), oy = n.sy - (O.cy + KM.cam.y); kmCamTo(-ox*f, -oy*f, z1); }

const KM_COL = {
  core:['#FFFFFA','#F0D2AE','#8A5A34'], domain:['#F6D9DE','#B3203A','#3A0710'], topic:['#FFFFFF','#C9D6EC','#3C4A66'],
  practice:['#FFF3E2','#E6CDB0','#6A4E34'], skill:['#F6D9DE','#D44A62','#4A0D14']
};
function kmSphere(g, x, y, r, col, a, glow){
  g.globalAlpha = a;
  if (glow){ g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(x,y,r*.4,x,y,r*glow); gr.addColorStop(0, col[1] + '66'); gr.addColorStop(1, col[1] + '00'); g.fillStyle = gr; g.beginPath(); g.arc(x,y,r*glow,0,7); g.fill(); g.globalCompositeOperation = 'source-over'; }
  const b = g.createRadialGradient(x-r*.35, y-r*.4, r*.1, x, y, r); b.addColorStop(0, col[0]); b.addColorStop(.55, col[1]); b.addColorStop(1, col[2]);
  g.fillStyle = b; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
  g.globalAlpha = a*.85; g.strokeStyle = col[0]; g.lineWidth = 1; g.beginPath(); g.arc(x,y,r+2.6,0,7); g.stroke();
  g.globalAlpha = a*.35; g.beginPath(); g.arc(x,y,r+5.5,0,7); g.stroke();
  g.globalAlpha = 1;
}
function kmChip(g, x, y, txt, a){
  g.globalAlpha = a; g.font = '700 10px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
  const w = g.measureText(txt).width + 10; g.fillStyle = 'rgba(22,17,17,.88)'; g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1;
  g.beginPath(); g.roundRect ? g.roundRect(x, y-8, w, 16, 5) : g.rect(x, y-8, w, 16); g.fill(); g.stroke();
  g.fillStyle = '#F2F1ED'; g.fillText(txt, x+5, y+3.6); g.globalAlpha = 1;
}
function kmOverall(){ const ts = KM_DOMAINS.flatMap(d=>d.topics); let w = 0, sum = 0; KM_DOMAINS.forEach(d=>d.topics.forEach(t=>{ w += d.w/d.topics.length; sum += d.w/d.topics.length*kmMastery(t)/100; })); return Math.round(sum/w*100); }
function kmLoop(now){
  KM.raf = 0; if (!KM.open) return;
  if (KM.view==='graph' || KM.view==='leaving') kmDraw(now);
  if (KM.view==='leaving' && now - KM.leaveT0 > 650){ KM.view = 'focus'; kmShowFocus(); }
  KM.raf = requestAnimationFrame(kmLoop);
}
function kmResize(){
  const cv = document.getElementById('kmCanvas'); if (!cv) return;
  KM.W = cv.clientWidth; KM.H = cv.clientHeight; KM.dpr = Math.min(2, window.devicePixelRatio||1);
  cv.width = Math.round(KM.W*KM.dpr); cv.height = Math.round(KM.H*KM.dpr); kmLayout(false);
  if (KM.view==='focus' && KM.focus) kmLines();
}

/* ---------- chrome ---------- */
function kmKpis(){
  const packs = typeof KNOWLEDGE_PACKS!=='undefined' ? KNOWLEDGE_PACKS.filter(p=>state.knowledge[p.id]).length : 0;
  const ws = startOfWeek(); let bd = 0; for (let i=0;i<7;i++){ const kk = dkey(addDays(ws,i)); if (addDays(ws,i) > new Date()) break; if (typeof dayBlocks==='function') bd += dayBlocks(kk).filter(b=>blockStatus(kk,b)==='done').length; }
  return [ ['book','Packs learned', packs, '/ 12'], ['target','Drawing test', typeof dxBest==='function' ? dxBest() : 0, '/ 8'], ['clock','Blocks this week', bd, ''], ['flame','Streak', currentStreak(), 'days'] ];
}
function kmTimeline(){
  const start = parseKey(state.createdAt || dkey()), months = [];
  for (let i=0;i<12;i++){ const d = new Date(start.getFullYear(), start.getMonth()+i, 1); months.push(d); }
  const cur = new Date(), sel = KM.month ?? months.findIndex(d=>d.getMonth()===cur.getMonth() && d.getFullYear()===cur.getFullYear());
  return months.map((d,i)=>`<button class="${i===sel?'on':''}" data-a="km-month" data-id="${i}">${i===sel ? `${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}` : MONTHS[d.getMonth()].slice(0,3)}</button>`).join('');
}
function kmLegend(){
  const c = t => KM.nodes.filter(n=>n.type===t).length, topics = KM_DOMAINS.flatMap(d=>d.topics), gap = Math.round(topics.filter(t=>kmMastery(t)<100).length/topics.length*100);
  const mo = dkey().slice(0,7), upd = Object.values(state.knowledge||{}).filter(d=>String(d).startsWith(mo)).length;
  return `<div class="km-legh">Legend</div>${[['core','Core',c('core')],['domain','Domains',c('domain')],['topic','Topics',c('topic')],['practice','Practice',c('practice')],['skill','Key points',c('skill')]].map(([k,l,n])=>`<div class="km-li"><i class="km-dot ${k}"></i><span class="km-cnt num">${n}</span>${l}</div>`).join('')}
    <div class="km-li sep"><span>Gaps</span><b class="num">${gap}%</b></div><div class="km-li"><span>Learned this month</span><b class="num">${upd}</b></div><div class="km-li tiny-note">% next to a domain = its weight in your plan</div>`;
}
const KM_ICONS = {
  radial:'<circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="6" r="1.8"/><circle cx="19" cy="6" r="1.8"/><circle cx="5" cy="18" r="1.8"/><circle cx="19" cy="18" r="1.8"/><path d="M10 10.5 6.4 7.2M14 10.5l3.6-3.3M10 13.5l-3.6 3.3M14 13.5l3.6 3.3"/>',
  tree:'<circle cx="12" cy="5" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M12 7v4M12 11H6v5M12 11h6v5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>', filter:'<path d="M4 5h16l-6 8v5l-4 2v-7z"/>', label:'<path d="M4 7h11l5 5-5 5H4z"/><circle cx="8" cy="12" r="1.2"/>', fit:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h10"/>', back:'<path d="M15 5l-7 7 7 7"/>', x:'<path d="M6 6l12 12M18 6 6 18"/>', send:'<path d="M5 12h12M12 6l6 6-6 6"/>', spark:'<path d="M4 18 9 12l3 3 7-8M15 7h4v4"/>', search:'<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>', agent:'<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 12h6M12 9v6"/>', hist:'<circle cx="12" cy="12" r="7"/><path d="M12 8v4l3 2"/>'
};
const kmi = (k, s=18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${KM_ICONS[k]}</svg>`;
function kmAskHTML(){
  return `<div class="km-ask glass-km" id="kmAsk">
    <div class="km-kpis">${kmKpis().map(([i,l,v,u])=>`<div class="km-kpi"><small>${l}</small><b><span class="km-ki">${ic(i,14)}</span><span class="num" data-count="${v}">${v}</span><em>${u}</em></b></div>`).join('')}</div>
    <form class="km-in" id="kmForm"><input id="kmQ" autocomplete="off" placeholder="Ask about a topic, e.g. thermoforming or tolerances" aria-label="Ask about a topic"><button type="submit" aria-label="Analyse">${kmi('send',18)}</button></form>
    <div class="km-row"><span class="km-pill">${ic('headset',14)} My coach</span><span class="km-pill">${kmi('hist',14)} +3</span><button class="km-ai" data-a="km-analyse">${kmi('spark',16)} Coach analysis</button></div>
  </div>`;
}
function kmShellHTML(){
  return `<div class="km" id="km" role="dialog" aria-modal="true" aria-label="Knowledge map">
    <canvas id="kmCanvas" aria-label="Network of everything you are learning. Drag or use the arrow keys to spin it all the way round, scroll to zoom, tap a node."></canvas>
    <div class="km-vign" aria-hidden="true"></div>
    <header class="km-top">
      <div class="km-brand"><button class="km-ib" data-a="km-back" aria-label="Close the map">${kmi('menu',18)}</button><span class="km-logo">${ic('gears',18)}</span><div><b>Knowledge map</b><small>KsHan's engineering plan</small></div></div>
      <div class="km-tools" role="toolbar" aria-label="Map tools">
        <span class="km-grp"><button data-a="km-layout" data-id="radial" class="${KM.layout==='radial'?'on':''}" aria-label="Network view">${kmi('radial')}</button><button data-a="km-layout" data-id="tree" class="${KM.layout==='tree'?'on':''}" aria-label="Tree view">${kmi('tree')}</button></span>
        <span class="km-grp"><button data-a="km-zoom" data-id="1" aria-label="Zoom in">${kmi('plus')}</button><button data-a="km-zoom" data-id="-1" aria-label="Zoom out">${kmi('minus')}</button></span>
        <span class="km-grp"><button data-a="km-gaps" class="${KM.gaps?'on':''}" aria-label="Show gaps only">${kmi('filter')}</button></span>
        <span class="km-grp"><button data-a="km-labels" class="${KM.labels?'on':''}" aria-label="Show labels">${kmi('label')}</button></span>
        <span class="km-grp"><button data-a="km-fit" aria-label="Fit to screen">${kmi('fit')}</button></span>
      </div>
      <div class="km-right"><button class="km-new" data-a="km-plan">${kmi('plus',15)} New study plan</button><button class="km-ib" data-a="km-search" aria-label="Search">${kmi('search',17)}</button><span class="km-av">KS</span><button class="km-ib" data-a="km-close" aria-label="Back to the app">${kmi('x',17)}</button></div>
    </header>
    <div class="km-title" aria-hidden="true"><small>Personal growth project</small><h1>KsHan</h1><span class="num">Day ${typeof planDay==='function'?planDay():1} of 365 · ${currentStreak()}-day streak</span></div>
    <span class="km-hint" aria-hidden="true">Drag to spin 360° · pinch or scroll to zoom · tap a planet</span>
    ${kmSidesHTML()}
    <div class="km-tip glass-km" id="kmTip" hidden></div>
    <div class="km-an glass-km" id="kmAn" hidden></div>
    ${kmAskHTML()}
    <section class="kmf" id="kmFocus" hidden></section>
  </div>`;
}
function kmWave(){
  const cv = document.getElementById('kmWave'); if (!cv) return;
  const W = cv.clientWidth, H = cv.clientHeight, d = Math.min(2, devicePixelRatio||1); cv.width = W*d; cv.height = H*d;
  const g = cv.getContext('2d'); g.setTransform(d,0,0,d,0,0);
  const start = parseKey(state.createdAt || dkey()), r = mulberry32(7);
  for (let y=0;y<H;y+=2){ const day = addDays(start, Math.floor(y/H*365)), v = day <= new Date() && typeof focusOf==='function' ? focusOf(dkey(day)) : 0;
    const w = 2 + r()*5 + Math.min(16, v/8); g.fillStyle = v > 0 ? 'rgba(255,214,150,.75)' : 'rgba(220,205,190,.25)'; g.fillRect(0, y, w, 1.2); }
}

/* ---------- interaction ---------- */
function kmHit(x,y){ let best = null, bd = 1e9; KM.nodes.forEach(n=>{ if (n.sx===undefined) return; const d = Math.hypot(n.sx-x, n.sy-y); if (d < Math.max(14, n.sr+8) && d < bd){ bd = d; best = n; } }); return best; }
function kmTip(n){
  const tip = document.getElementById('kmTip'); if (!tip) return;
  if (!n || n.type==='core'){ tip.hidden = true; return; }
  const t = n.type==='topic' ? n.topic : n.parent && n.parent.type==='topic' ? n.parent.topic : null, d = n.dom || (n.parent && n.parent.dom);
  if (n.type==='domain'){ const ts = n.dom.topics, m = Math.round(ts.reduce((a,x)=>a+kmMastery(x),0)/ts.length);
    tip.innerHTML = `<small>Domain · ${n.w}% of your plan</small><b>${esc(n.name)}</b><div class="km-tipr"><span>${ts.length} topics</span><span>${m}% mastered</span></div><div class="km-tipl">${ts.map(x=>`<button data-a="km-topic" data-id="${esc(x.n)}">${esc(x.n)}<span>${kmMastery(x)}%</span></button>`).join('')}</div>`;
  } else if (t){ const m = kmMastery(t);
    tip.innerHTML = `<small>${esc(d.name)}${t.plan?' · coming next':''}</small><b>${esc(t.n)}</b><div class="km-tipr"><span>Mastery ${m}%</span><span>${kmItems(t)[2].list.length} practice questions</span></div><button class="km-open" data-a="km-topic" data-id="${esc(t.n)}">Open topic ${kmi('send',14)}</button>`;
  } else { tip.hidden = true; return; }
  tip.hidden = false;
}
function kmFindTopic(name){ return KM_DOMAINS.flatMap(d=>d.topics).find(t=>t.n===name); }
function kmMatch(q){
  const words = q.toLowerCase().split(/[^a-z0-9&]+/).filter(w=>w.length>2); if (!words.length) return null;
  let best = null, bs = 0;
  KM_DOMAINS.forEach(d=>d.topics.forEach(t=>{ const hay = (t.n + ' ' + (t.kw||'') + ' ' + d.name + ' ' + (t.pack && kmPack(t.pack) ? kmPack(t.pack).title : '')).toLowerCase(); const sc = words.reduce((a,w)=>a + (hay.includes(w) ? 2 : 0) + (hay.split(/\s+/).some(h=>h.startsWith(w.slice(0,4))) ? 1 : 0), 0); if (sc > bs){ bs = sc; best = t; } }));
  return bs >= 2 ? best : null;
}
function kmGapOrder(){ const all = []; KM_DOMAINS.forEach(d=>d.topics.forEach(t=>all.push({ t, d, score:(100-kmMastery(t))*d.w/d.topics.length*(t.plan?.5:1) }))); return all.sort((a,b)=>b.score-a.score); }
function kmAnalyse(q){
  const an = document.getElementById('kmAn'); if (!an) return;
  const hit = q ? kmMatch(q) : null, gaps = kmGapOrder();
  const first = hit ? { t:hit, d:KM_DOMAINS.find(d=>d.topics.includes(hit)) } : gaps[0];
  const next = gaps.find(g=>g.t!==first.t && (g.d===first.d || !hit)) || gaps[1];
  const m = kmMastery(first.t), its = kmItems(first.t);
  const crit = m >= 100 ? `You have learned this. Keep it fresh: answer the ${its[2].list.length} practice questions again and explain it out loud.` : `Mastery ${m}%. It carries ${Math.round(first.d.w/first.d.topics.length)}% of your plan, and ${its[0].list.length} key points are still to study.`;
  an.innerHTML = `<div class="km-anh"><span><b>Coach</b> analysis${q?` · “${esc(q.slice(0,40))}”`:''}</span><span class="km-anr"><span class="km-pill sm">+3</span><button class="km-ib sm" data-a="km-an-close" aria-label="Close analysis">${kmi('x',14)}</button></span></div>
    <button class="km-ar crit" data-a="km-topic" data-id="${esc(first.t.n)}"><span class="km-ar1"><b>${hit ? (m>=100?'Revision':'Critical gap') : 'Critical gap'}</b><span>${esc(first.t.n)} ↗</span></span><small>${esc(crit)}</small></button>
    <button class="km-ar" data-a="km-topic" data-id="${esc(next.t.n)}"><span class="km-ar1"><b>Study next</b><span>${esc(next.t.n)} ↗</span></span><small>${esc(next.d.name)} · ${kmMastery(next.t)}% mastered${next.t.plan?' · pack coming next':''}.</small></button>
    ${!hit && q ? `<div class="km-anote">No topic matched “${esc(q.slice(0,30))}”. Showing your biggest gaps instead.</div>` : ''}`;
  an.hidden = false; an.classList.remove('in'); void an.offsetWidth; an.classList.add('in');
}
function kmTypeInto(text, done){
  const el = document.getElementById('kmQ'); if (!el) return; el.value = '';
  if (motionOff()){ el.value = text; done && done(); return; }
  let i = 0; const iv = setInterval(()=>{ el.value = text.slice(0, ++i); if (i >= text.length){ clearInterval(iv); done && setTimeout(done, 250); } }, 38);
}

/* ---------- focus view ---------- */
function kmFocus(t){
  const node = KM.nodes.find(n=>n.type==='topic' && n.topic===t);
  KM.focus = t; KM.sel = node || null; { const L = kmItems(t).map(x=>x.list.length); KM.tile = L.indexOf(Math.max(...L)); }
  document.getElementById('kmAn').hidden = true; document.getElementById('kmTip').hidden = true;
  if (node && !motionOff()){ KM.freeze = true; kmCenterOn(node, 3.4); KM.tween.d = 650; KM.view = 'leaving'; KM.leaveT0 = performance.now(); document.getElementById('km').classList.add('leaving'); }
  else { KM.view = 'focus'; kmShowFocus(); }
}
function kmShowFocus(){
  const t = KM.focus, d = KM_DOMAINS.find(x=>x.topics.includes(t)), its = kmItems(t), m = kmMastery(t), last = kmLastDate(t);
  const root = document.getElementById('km'); root.classList.remove('leaving'); root.classList.add('focus');
  const f = document.getElementById('kmFocus'); f.hidden = false;
  const words = t.n.split(' '), half = Math.ceil(words.length/2);
  const days = Array.from({length:30},(_,i)=>{ const k = dkey(addDays(new Date(), i-29)); return typeof focusOf==='function' ? focusOf(k) : 0; }), mx = Math.max(30, ...days);
  const status = m >= 100 ? ['Learned','good'] : m > 0 ? ['Studying','mid'] : t.plan ? ['Coming next','muted'] : ['Not started','muted'];
  const where = t.pack ? 'Learn · Packs' : t.lab ? 'Lab · ' + ({cad:'3D CAD',dwg:'Drawings',v12:'V12 engine'}[t.lab]) : 'Learn · ' + ({career:'Career',essay:'Essay',speak:'Speaking',words:'Words'}[t.learn]||'');
  f.innerHTML = `
    <div class="kmf-crumb glass-km">Map overview · ${esc(d.name)} · key points, practice and coach analysis</div>
    <div class="kmf-orb"><canvas id="kmOrb" aria-hidden="true"></canvas>
      <h2 class="kmf-title">${words.slice(0,half).map((w,i)=>`<span style="--i:${i}">${esc(w)}</span>`).join(' ')}<br>${words.slice(half).map((w,i)=>`<span class="g" style="--i:${i+half}">${esc(w)}</span>`).join(' ')}</h2>
      <div class="kmf-gap"><span class="km-chipm">MASTERY ${m}%</span><span class="kmf-bars"><i class="${m>0?'on':''}"></i><i class="${m>=50?'on':''}"></i><i class="${m>=100?'on':''}"></i></span></div></div>
    <svg class="kmf-lines" id="kmLines" aria-hidden="true"></svg>
    <div class="kmf-tiles">${its.map((x,i)=>`<button class="kmf-tile ${i===KM.tile?'sel':''}" data-a="km-tile" data-id="${i}" style="--i:${i}"><b><span class="kmf-ti">${ic(x.icon,14)}</span><span class="num" data-count="${x.list.length}">0</span></b><small>${x.label}</small></button>`).join('')}</div>
    <div class="kmf-list" id="kmList"></div>
    <section class="kmf-panel glass-km">
      <div class="kmf-ph"><span class="kmf-dom">${ic(d.icon,18)}</span>${esc(d.name)}</div>
      <h3>${esc(t.n)}</h3>
      <div class="kmf-stat"><div><span class="km-chip2 ${status[1]}">${status[0]}</span><p>${last ? `Last studied on ${esc(last)}` : t.plan ? 'This pack is planned. Study the related topics first.' : 'Not studied yet. Start with the key points.'}</p></div><button class="kmf-explore" data-a="km-explore">Explore in ${esc(where)} ${kmi('send',14)}</button></div>
      <div class="kmf-rate"><div><small>Mastery</small><b class="num"><span data-count="${m}">0</span>%</b><em class="${m>0?'up':''}">${m>0?'+'+m+' since you started':'start this week'}</em></div><span class="km-chip2 ${m>=70?'good':m>=30?'mid':'low'}">${m>=70?'Strong':m>=30?'Moderate':'Low'}</span>
        <svg viewBox="0 0 150 40" preserveAspectRatio="none" class="kmf-spark" aria-label="Study minutes, last 30 days">${days.map((v,i)=>{ const h = Math.max(2, v/mx*34); return `<rect x="${i*5}" y="${40-h}" width="3" height="${h.toFixed(1)}" rx="1" class="${i===29?'now':''}"/>`; }).join('')}</svg></div>
      <div class="kmf-grid">${[[0,'book'],[2,'target'],[1,'pen'],[4,'wrench']].map(([i,icn])=>`<button class="kmf-cell" data-a="km-tile" data-id="${i}"><span>${ic(icn,20)}</span><b class="num">${its[i].list.length}</b><small>${its[i].label}</small></button>`).join('')}</div>
      <div class="kmf-ai"><b>${kmi('spark',15)} Coach analysis</b><div class="kmf-note"><b>${m>=100?'Keep it fresh':'Next step'}</b><p>${esc(m>=100 ? `Answer the ${its[2].list.length} practice questions again in a week, then explain this to someone in one minute.` : t.pack && kmPack(t.pack) ? `Read the pack, study the diagram, then answer: ${kmPack(t.pack).ask}` : `Open ${where} and work through the first ${Math.min(3, its[0].list.length)} key points, then try the practice questions.`)}</p></div></div>
    </section>
    <button class="kmf-back km-ib" data-a="km-unfocus" aria-label="Back to the map">${kmi('back',18)}</button>`;
  kmList(); kmOrb(); requestAnimationFrame(()=>{ kmLines(); kmCountUp(f); });
  const ask = document.getElementById('kmAsk'); ask.classList.add('docked');
}
function kmList(){
  const its = kmItems(KM.focus)[KM.tile], box = document.getElementById('kmList'); if (!box) return;
  const learned = kmMastery(KM.focus) >= 100;
  box.innerHTML = its.list.map((x,i)=>`<div class="kmf-item" style="--i:${i}"><b>${esc(x)}</b><span class="kmf-itm"><span class="km-chipm">${KM.tile===3 ? (kmMastery(kmFindTopic(x)||{})||0)+'%' : learned ? 'DONE' : 'TO DO'}</span><span class="kmf-sq"><i class="${learned||i%3===0?'on':''}"></i><i class="${learned?'on':''}"></i><i class="${learned?'on':''}"></i></span></span></div>`).join('') || '<div class="kmf-item"><b>Nothing here yet</b></div>';
  document.querySelectorAll('.kmf-tile').forEach((b,i)=>b.classList.toggle('sel', i===KM.tile));
  requestAnimationFrame(kmLines);
}
function kmLines(){
  const f = document.getElementById('kmFocus'), svg = document.getElementById('kmLines'); if (!f || !svg || f.hidden) return;
  if (getComputedStyle(svg).display==='none'){ svg.innerHTML = ''; return; }
  const R = f.getBoundingClientRect(); svg.setAttribute('viewBox', `0 0 ${R.width} ${R.height}`);
  const box = el => { const r = el.getBoundingClientRect(); return { l:r.left-R.left, r:r.right-R.left, t:r.top-R.top, b:r.bottom-R.top, cy:(r.top+r.bottom)/2-R.top }; };
  const orb = document.getElementById('kmOrb'), o = box(orb), ox = o.r - 6, oy = (o.t+o.b)/2;
  const curve = (x1,y1,x2,y2) => { const mx = (x1+x2)/2; return `M${x1.toFixed(1)},${y1.toFixed(1)} C${mx.toFixed(1)},${y1.toFixed(1)} ${mx.toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`; };
  let h = '';
  document.querySelectorAll('.kmf-tile').forEach((el,i)=>{ const b = box(el); h += `<path d="${curve(ox,oy,b.l,b.cy)}" class="l1 ${i===KM.tile?'sel':''}" pathLength="1" style="--i:${i}"/>`; });
  const st = document.querySelectorAll('.kmf-tile')[KM.tile];
  if (st){ const s = box(st); document.querySelectorAll('.kmf-item').forEach((el,i)=>{ const b = box(el); h += `<path d="${curve(s.r, s.cy, b.l-4, b.cy)}" class="l2" pathLength="1" style="--i:${i}"/><circle cx="${(b.l-4).toFixed(1)}" cy="${b.cy.toFixed(1)}" r="2.6" class="end" style="--i:${i}"/>`; }); }
  svg.innerHTML = h;
}
function kmCountUp(root){
  root.querySelectorAll('[data-count]').forEach(el=>{ const to = +el.dataset.count; if (motionOff()){ el.textContent = to; return; } const t0 = performance.now(); const step = now=>{ const k = Math.min(1,(now-t0)/900); el.textContent = Math.round(to*(1-Math.pow(1-k,3))); if (k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
}
function kmOrb(){
  const cv = document.getElementById('kmOrb'); if (!cv) return;
  cancelAnimationFrame(KM.orbRaf);
  const draw = now=>{
    if (!cv.isConnected || !KM.open) return;
    const W = cv.clientWidth, H = cv.clientHeight, d = Math.min(2, devicePixelRatio||1); if (cv.width !== W*d){ cv.width = W*d; cv.height = H*d; }
    const g = cv.getContext('2d'); g.setTransform(d,0,0,d,0,0); g.clearRect(0,0,W,H);
    const cx = W/2, cy = H/2, r = Math.min(W,H)*.2, T = motionOff() ? 0 : now/1000;
    const halo = g.createRadialGradient(cx,cy,r,cx,cy,r*3.2); halo.addColorStop(0,'rgba(179,32,58,.2)'); halo.addColorStop(1,'rgba(60,20,24,0)'); g.fillStyle = halo; g.beginPath(); g.arc(cx,cy,r*3.2,0,7); g.fill();
    g.save(); g.translate(cx,cy); g.rotate(T*.15);
    for (let i=0;i<220;i++){ const a = i/220*Math.PI*2, w = Math.sin(i*1.7)*.5+.5, l = r*1.12 + w*r*.38 + (T ? Math.sin(T*2+i*.4)*2 : 0); g.strokeStyle = i%4===0 ? 'rgba(217,185,146,.55)' : i%3 ? 'rgba(194,48,74,.6)' : 'rgba(246,217,222,.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.cos(a)*r*1.08, Math.sin(a)*r*1.08); g.lineTo(Math.cos(a)*l, Math.sin(a)*l); g.stroke(); }
    g.restore();
    kmSphere(g, cx, cy, r, KM_COL.domain, 1, 2.4);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(cx-r*.3, cy-r*.38, r*.28, r*.16, -.6, 0, 7); g.fill();
    if (!motionOff()) KM.orbRaf = requestAnimationFrame(draw);
  };
  KM.orbRaf = requestAnimationFrame(draw);
}
function kmUnfocus(){
  const root = document.getElementById('km'); root.classList.remove('focus');
  document.getElementById('kmFocus').hidden = true; document.getElementById('kmAsk').classList.remove('docked');
  cancelAnimationFrame(KM.orbRaf); KM.view = 'graph'; KM.focus = null;
  const n = KM.sel; if (n){ KM.freeze = true; kmCenterOn(n, 1.6); } kmKick();
}

/* ---------- open / close ---------- */
function kmKick(){ if (!KM.raf) KM.raf = requestAnimationFrame(kmLoop); }
function kmOpen(){
  if (KM.open) return;
  KM.labels = window.innerWidth >= 760; KM.yaw = -.5; KM.tilt = .55; KM.tA = 0; KM.freeze = false; KM.layout = 'radial'; KM.dust = null;
  document.body.insertAdjacentHTML('beforeend', kmShellHTML());
  KM.labels = window.innerWidth >= 760;
  document.body.classList.add('km-open'); KM.open = true; KM.view = 'graph'; KM.sel = null; KM.focus = null; KM.cam = { x:0, y:0, z:1 }; KM.pulses = [];
  const cv = document.getElementById('kmCanvas');
  KM.W = cv.clientWidth; KM.H = cv.clientHeight; kmBuild(); kmResize(); kmWave();
  document.querySelector('.km-legend').innerHTML = kmLegend();
  KM.t0 = performance.now() - (motionOff() ? 10000 : 0);
  if (!motionOff()) document.getElementById('km').classList.add('intro');
  kmKick(); kmBind();
  try { if (location.hash !== '#map') history.replaceState(null, '', '#map'); } catch(e){}
  setTimeout(()=>{ const r = document.getElementById('km'); if (r) r.classList.remove('intro'); }, 3200);
}
function kmClose(){
  if (!KM.open) return; KM.open = false; cancelAnimationFrame(KM.raf); cancelAnimationFrame(KM.orbRaf); KM.raf = 0;
  const r = document.getElementById('km'); if (r){ r.classList.add('closing'); setTimeout(()=>r.remove(), motionOff() ? 0 : 320); }
  document.body.classList.remove('km-open');
  try { if (location.hash === '#map') history.replaceState(null, '', location.pathname + location.search); } catch(e){}
}
function kmBind(){
  const cv = document.getElementById('kmCanvas'), root = document.getElementById('km');
  cv.addEventListener('pointerdown', e=>{ KM.ptr.set(e.pointerId, { x:e.clientX, y:e.clientY }); cv.setPointerCapture(e.pointerId); if (KM.ptr.size===1) KM.drag = { x:e.clientX, y:e.clientY, moved:0 }; else KM.drag = null; KM.tween = null; });
  cv.addEventListener('pointermove', e=>{
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (KM.ptr.has(e.pointerId)){
      const prev = KM.ptr.get(e.pointerId); KM.ptr.set(e.pointerId, { x:e.clientX, y:e.clientY });
      if (KM.ptr.size===2){ const [a,b] = [...KM.ptr.values()], o = [...KM.ptr.entries()].find(([id])=>id!==e.pointerId)[1]; const d0 = Math.hypot(prev.x-o.x, prev.y-o.y), d1 = Math.hypot(a.x-b.x, a.y-b.y); if (d0 > 0){ const z = clamp(KM.cam.z*d1/d0, .5, 4), k = z/KM.cam.z; KM.cam.x *= k; KM.cam.y *= k; KM.cam.z = z; } return; }
      if (KM.drag){ const dx = e.clientX-prev.x, dy = e.clientY-prev.y; if (e.shiftKey){ KM.cam.x += dx; KM.cam.y += dy; } else { KM.yaw += dx*.007; KM.vy = dx*.0035; KM.tilt = kmWrap(KM.tilt - dy*.007); KM.vt = -dy*.0035; } KM.drag.moved += Math.abs(dx)+Math.abs(dy); }
      return;
    }
    const h = kmHit(x,y); if (h !== KM.hover){ KM.hover = h; cv.style.cursor = h ? 'pointer' : 'grab'; }
  });
  const up = e=>{
    const was = KM.drag; KM.ptr.delete(e.pointerId); if (KM.ptr.size===0) KM.drag = null;
    if (was && was.moved < 6 && e.type==='pointerup'){ const r = cv.getBoundingClientRect(), n = kmHit(e.clientX-r.left, e.clientY-r.top);
      if (!n){ KM.sel = null; KM.freeze = false; kmTip(null); return; }
      if (n.type==='topic' && KM.sel===n){ kmFocus(n.topic); return; }
      KM.sel = n; KM.freeze = n.type!=='core'; kmTip(n); if (n.type!=='core') kmCenterOn(n, Math.max(KM.cam.z, n.type==='domain' ? 1.5 : 1.9)); else kmCamTo(0,0,1,700,true);
    }
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e=>{ e.preventDefault(); KM.tween = null; const f = Math.exp(-e.deltaY*.0015), z = clamp(KM.cam.z*f, .5, 4); const k = z/KM.cam.z; KM.cam.x *= k; KM.cam.y *= k; KM.cam.z = z; }, { passive:false });
  document.getElementById('kmForm').addEventListener('submit', e=>{ e.preventDefault(); const q = document.getElementById('kmQ').value.trim(); if (KM.view!=='graph'){ const hit = kmMatch(q); if (hit){ kmUnfocus(); setTimeout(()=>kmFocus(hit), 300); } else { kmUnfocus(); setTimeout(()=>kmAnalyse(q), 300); } return; } kmAnalyse(q); });
  root.addEventListener('click', e=>{ const el = e.target.closest('[data-a]'); if (!el || !root.contains(el)) return; kmAction(el.dataset.a, el); e.stopPropagation(); });
  window.addEventListener('resize', kmResize);
}
function kmAction(a, el){
  if (a==='km-close') kmClose();
  else if (a==='km-back'){ if (KM.view!=='graph') kmUnfocus(); else kmClose(); }
  else if (a==='km-unfocus') kmUnfocus();
  else if (a==='km-zoom'){ { const f = +el.dataset.id > 0 ? 1.35 : 1/1.35, z = clamp(KM.cam.z*f,.5,4), k = z/KM.cam.z; kmCamTo(KM.cam.x*k, KM.cam.y*k, z, 300); } }
  else if (a==='km-fit'){ KM.sel = null; kmTip(null); KM.freeze = false; kmCamTo(0,0,1,700,true,.55); }
  else if (a==='km-layout'){ KM.layout = el.dataset.id; document.querySelectorAll('[data-a="km-layout"]').forEach(b=>b.classList.toggle('on', b===el)); kmCamTo(KM.cam.x, KM.cam.y, KM.cam.z, 900, true, KM.layout==='tree' ? .06 : .55); }
  else if (a==='km-gaps'){ KM.gaps = !KM.gaps; el.classList.toggle('on', KM.gaps); toast(KM.gaps ? 'Showing gaps only: learned topics are dimmed.' : 'Showing every topic.', 'ok', 1600); }
  else if (a==='km-labels'){ KM.labels = !KM.labels; el.classList.toggle('on', KM.labels); }
  else if (a==='km-search'){ document.getElementById('kmQ').focus(); }
  else if (a==='km-analyse'){ const q = document.getElementById('kmQ').value.trim(); if (KM.view!=='graph'){ kmUnfocus(); setTimeout(()=>kmAnalyse(q), 300); } else kmAnalyse(q); }
  else if (a==='km-an-close'){ document.getElementById('kmAn').hidden = true; }
  else if (a==='km-plan'){ if (KM.view!=='graph') kmUnfocus(); kmTypeInto('Plan my next week', ()=>kmAnalyse('')); }
  else if (a==='km-topic'){ const t = kmFindTopic(el.dataset.id); if (t) kmFocus(t); }
  else if (a==='km-tile'){ KM.tile = +el.dataset.id; kmList(); }
  else if (a==='km-month'){ KM.month = +el.dataset.id; document.querySelector('.km-months').innerHTML = kmTimeline(); }
  else if (a==='km-explore'){ const t = KM.focus; kmClose();
    if (t.pack){ window.knowPick = t.pack; learnTab = 'know'; setTab('learn', { force:true }); }
    else if (t.lab){ labPane = t.lab; setTab('lab', { force:true }); setTimeout(()=>showLabPane(t.lab), 60); }
    else if (t.learn){ learnTab = t.learn; setTab('learn', { force:true }); } }
}
document.addEventListener('keydown', e=>{ if (KM.open && KM.view==='graph' && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))){ const k = { ArrowLeft:[-.12,0], ArrowRight:[.12,0], ArrowUp:[0,-.12], ArrowDown:[0,.12] }[e.key]; if (k){ e.preventDefault(); KM.yaw += k[0]; KM.tilt = kmWrap(KM.tilt + k[1]); kmKick(); return; } }
  if (e.key==='Escape' && KM.open){ if (KM.view!=='graph') kmUnfocus(); else kmClose(); } });
window.addEventListener('hashchange', ()=>{ if (location.hash==='#map') kmOpen(); else if (KM.open) kmClose(); });
function kmLauncherHTML(){
  return `<button class="km-launch" data-a="km-open"><span class="km-lorb" aria-hidden="true"></span><span class="km-lt"><b>Knowledge map</b><small>Everything you are learning as one network. Tap a topic to dive in.</small></span><span class="km-lgo">${kmi('send',16)}</span></button>`;
}
