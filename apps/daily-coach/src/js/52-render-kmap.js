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
const KM_HOLES = [ // black holes: the mistakes that pull you backwards
  { n:'Reading the wrong projection', dom:'cad', tip:'Check the projection symbol in the title block before you read any view. First angle puts the plan below the front view.' },
  { n:'Skipping isolation (LOTO)', dom:'maint', tip:'Never reach into a machine that is not locked off, tagged and proven dead. Every time, even for a quick jam.' },
  { n:'Changing two settings at once', dom:'ops', tip:'On a line problem change one thing, wait for it to settle, measure, then decide the next change.' },
  { n:'Short IELTS essays', dom:'english', tip:'Task 2 needs at least 250 words. Plan for 280 in 40 minutes and leave 3 minutes to check.' },
  { n:'Spending before saving', dom:null, tip:'Move the savings on payday first and live on what is left. The £25k plan only works in that order.' },
  { n:'Missing two days in a row', dom:null, tip:'One missed day is life. Two in a row starts a new habit. Do the smallest task to keep the chain.' }
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
  // planets = today's tasks on the inner orbits round the sun
  const tasks = typeof tasksForDay==='function' ? tasksForDay(dkey()) : [];
  tasks.forEach((t,i)=>nodes.push({ id:'task:'+t.id, type:'task', name:t.name, task:t, orad:.085 + i*(.19/Math.max(1, tasks.length-1)), oth:i*2.39 + rnd()*.6, r:6, ph:rnd()*6, ringed:i % 3 === 2 }));
  // black holes = mistakes to avoid, out past the stars
  KM_HOLES.forEach((h,i)=>nodes.push({ id:'hole:'+i, type:'hole', name:h.n, hole:h, orad:1.02 + (i % 2)*.09, oth:i/KM_HOLES.length*Math.PI*2 + .6, r:10, ph:rnd()*6 }));
  // satellites = your next day-plan blocks, floating just above the disc
  const nmn = typeof nowMin==='function' ? nowMin() : 0, upb = (typeof dayBlocks==='function' ? dayBlocks(dkey()) : []).filter(b=>!b.skip && b.dur > 0 && b.start + b.dur > nmn).slice(0,3);
  upb.forEach((b,i)=>nodes.push({ id:'sat:'+b.id, type:'sat', name:b.name, block:b, orad:.16 + i*.055, oth:i*2.1 + 1, el:.05 + i*.012, r:5, ph:rnd()*6 }));
  // nebulae = the big goals, glowing brighter as they fill
  const goalV = Number(state.settings.goal)||25000, savedV = typeof savedTotal==='function' ? savedTotal() : 0;
  const wts = Object.keys(state.days||{}).sort().map(k=>state.days[k].weight).filter(Boolean), wNow = wts.length ? wts[wts.length-1] : state.profile.weightStart;
  const wP = clamp((state.profile.weightStart - wNow)/Math.max(1, state.profile.weightStart - state.profile.weightTarget), 0, 1);
  const engD = KM_DOMAINS.find(d=>d.id==='english'), eP = engD ? engD.topics.reduce((a2,t)=>a2+kmMastery(t),0)/engD.topics.length/100 : 0;
  [['£25k savings', savedV/goalV, '230,205,176', `${money0(savedV)} of ${money0(goalV)} saved`], [`IELTS ${state.settings.ieltsTarget||7}+`, eP, '150,190,255', `English practice ${Math.round(eP*100)}% done`], [`${state.profile.weightTarget} kg target`, wP, '255,140,165', `${wNow} kg now · target ${state.profile.weightTarget} kg`]]
    .forEach(([n,pr,c,d],i)=>nodes.push({ id:'neb:'+i, type:'neb', name:n, prog:clamp(pr,0,1), col:c, desc:d, orad:1.2 + i*.05, oth:i*2.1 + 2.4, el:-.02, r:20, ph:rnd()*6 }));
  // pulsar = your streak (it spins faster the longer the streak)
  nodes.push({ id:'pulsar', type:'pulsar', name:'Streak pulsar', orad:.9, oth:4.1, el:.03, r:6, ph:rnd()*6 });
  // constellation = the last 14 days, high above the disc
  KM.days14 = Array.from({length:14},(_,i)=>{ const k = dkey(addDays(new Date(), i-13)); return { k, n:countDone(k) }; });
  nodes.push({ id:'const', type:'const', name:'Last 14 days', orad:1.15, oth:.5, el:.4, r:10, ph:0 });
  // a thin asteroid belt between the planets and the stars
  KM.belt = Array.from({length:220},()=>({ r:.3 + rnd()*.04, th:rnd()*Math.PI*2, y:(rnd()-.5)*.012, s:.6 + rnd()*1.4, c:rnd() }));
  KM.nodes = nodes; KM.edges = edges;
  kmLayout(true);
}
function kmLayout(snap){
  const W = KM.W || 1200, H = KM.H || 800, N = KM_DOMAINS.length;
  KM.nodes.forEach(n=>{
    if (n.type==='domain'){ const i = KM_DOMAINS.indexOf(n.dom); n.orad = .38 + i/(N-1)*.58; n.oth = i*2.39 + (n.ph%1)*.4; }
    else if (n.type==='topic'){ const j = n.dom.topics.indexOf(n.topic), k = n.dom.topics.length; n.lr = .1 + (j%2)*.045; n.lth = j/k*Math.PI*2 + n.ph; }
    else if (n.type==='practice' || n.type==='skill'){ n.lr = .028 + (n.ph%1)*.02; n.lth = n.ph*2; }
  });
  const wide = W >= 1100, top = W < 760 ? 112 : 76;
  // no frame: the galaxy fills the screen like a mind map, between the side panels on wide screens
  const ct = Math.cos(1.0); let R, cx = W/2, cy, hh;
  if (wide){ const bot = 170; R = Math.min((W - 2*290 - 70)/2*.92, (H - top - bot)/2/(ct*.98)); cy = top + (H - top - bot)/2 + 8; }
  else { const bot = W < 760 ? 186 : 176, mini = 0; R = Math.max(120, Math.min(W*.56, (H - top - bot - mini)/2/(ct*.98), 420)); const used = 2*R*ct*.98 + 18 + mini, free = H - top - bot - used; cy = top + R*ct*.98 + Math.max(0, free*.4); }
  hh = R*ct*.98; KM.orb = { cx, cy, r:R }; KM.R = R;
  const el = document.getElementById('km'); if (el){ el.style.setProperty('--ox', cx+'px'); el.style.setProperty('--oy', cy+'px'); el.style.setProperty('--or', Math.min(R, 380)+'px'); el.style.setProperty('--oh', hh+'px'); requestAnimationFrame(kmTitleBox); }
}
function kmIntroAt(n){ if (n.type==='core') return 0; const d = n.type==='domain' ? n : n.parent && n.parent.type==='domain' ? n.parent : n.parent && n.parent.parent ? n.parent.parent : n; return .9 + (d.orad||.5)*1.6 + (n.type==='domain'?0:.25) + ((n.ph*37)%1)*.15; }
function kmWorld(n, T){ // disc coordinates (x, z) for each node, with differential rotation
  if (n.type==='core') return [0,0];
  if (n.orad !== undefined && !n.parent){ const th = n.oth + GAL.spin(n.orad, KM.freeze ? KM.freezeT : T)*({ task:.9, sat:1.1, hole:.3, neb:.12, pulsar:.4, const:.06 }[n.type] ?? .55); return [Math.cos(th)*n.orad, Math.sin(th)*n.orad]; }
  const p = kmWorld(n.parent, T), sp = KM.freeze ? KM.freezeT : T; const th = n.lth + sp*(n.type==='topic' ? .12 : .3);
  return [p[0] + Math.cos(th)*n.lr, p[1] + Math.sin(th)*n.lr];
}
const KM_PLANET = { domain:null, topic:['#FFFFFF','#C9D6EC','#3C4A66'], practice:['#FFF3E2','#D9BC9C','#6A4E34'], skill:['#F6D9DE','#C2304A','#4A0D14'] };
function kmDraw(now){
  const cv = document.getElementById('kmCanvas'); if (!cv) return;
  const g = cv.getContext('2d'), W = KM.W, H = KM.H;
  g.setTransform(KM.dpr,0,0,KM.dpr,0,0); g.clearRect(0,0,W,H);
  const T = (now - KM.t0)/1000, still = motionOff(), dt = Math.min(.05, Math.max(0, (now - (KM.lastNow||now))/1000)); KM.lastNow = now;
  // orbital time slows as you zoom in, so whatever you zoom towards stays in view
  KM.st = (KM.st||0) + dt*((KM.drag && KM.mode!=='rotate') || KM.panning ? 0 : KM.cam.z > 2.6 ? 0 : clamp(Math.pow(1.4/KM.cam.z, 1.6), .02, 1)*(KM.orbits===false ? 0 : 1)); const TT = still ? 30 : (T < 3 ? T : KM.st + (KM.stOff ?? (KM.stOff = T - KM.st)));
  if (KM.tween){ const k = Math.min(1,(now-KM.tween.t0)/KM.tween.d), e = KM.tween.io ? (k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3)/2) : 1-Math.pow(1-k,3); KM.cam.x = KM.tween.x0+(KM.tween.x1-KM.tween.x0)*e; KM.cam.y = KM.tween.y0+(KM.tween.y1-KM.tween.y0)*e; KM.cam.z = KM.tween.z0+(KM.tween.z1-KM.tween.z0)*e; if (KM.tween.t1!==undefined) KM.tilt = kmWrap(KM.tween.t0v+(KM.tween.t1-KM.tween.t0v)*e); if (k>=1) KM.tween = null; }
  if (KM.yawT === undefined){ KM.yawT = KM.yaw; KM.tiltT = KM.tilt; }
  if (KM.tween || still){ if (still && !KM.tween){ KM.yaw = KM.yawT; KM.tilt = KM.tiltT; } KM.yawT = KM.yaw; KM.tiltT = KM.tilt; }
  else { // smooth follow: drags move a target and the view eases toward it every frame, then glides on with inertia
    if (!KM.drag){ KM.yawT += KM.vy; KM.vy *= .955; KM.tiltT = kmWrap(KM.tiltT + (KM.vt||0)); KM.vt = (KM.vt||0)*.955; }
    KM.yaw += (KM.yawT - KM.yaw)*.18; KM.tilt = kmWrap(KM.tilt + kmWrap(KM.tiltT - KM.tilt)*.18); }
  if (!KM.freeze) KM.freezeT = TT;
  if (!KM.drag && KM.pv && KM.camT && !still){ KM.camT.x += KM.pv.x; KM.camT.y += KM.pv.y; KM.pv.x *= .86; KM.pv.y *= .86; if (Math.abs(KM.pv.x) + Math.abs(KM.pv.y) < .1) KM.pv = null; }
  if (KM.tween || !KM.camT) KM.camT = { x:KM.cam.x, y:KM.cam.y, z:KM.cam.z };
  else { const e = still ? 1 : .16; KM.cam.x += (KM.camT.x - KM.cam.x)*e; KM.cam.y += (KM.camT.y - KM.cam.y)*e; KM.cam.z *= Math.pow(KM.camT.z/KM.cam.z, e); }
  { const zr = document.getElementById('kmZr'), z = KM.cam.z, zt = (z < 10 ? (Math.round(z*10)/10).toFixed(1) : Math.round(z)) + '×'; if (zr && zr.textContent !== zt){ zr.textContent = zt; zr.setAttribute('aria-label', `Zoom ${zt}. Tap to reset`); } }
  { const root = document.getElementById('km'), tx = Math.round(KM.cam.x), ty = Math.round(KM.cam.y); if (root && (KM.ttx !== tx || KM.tty !== ty)){ KM.ttx = tx; KM.tty = ty; root.style.setProperty('--tx', tx+'px'); root.style.setProperty('--ty', ty+'px'); } }
  { const want = KM.view==='graph' && !KM.sel && KM.cam.z < 1.3 && (still || T > 2.2) ? 1 : 0; KM.tA = (KM.tA||0) + (want - (KM.tA||0))*(still ? 1 : .12);
    const root = document.getElementById('km'); if (root){ const on = KM.tA > .5; if (root.classList.contains('titled') !== on) root.classList.toggle('titled', on); } }
  const intro = still ? 1 : clamp((T - .2)/2.2, 0, 1), ie = 1 - Math.pow(1-intro, 3);
  const O = KM.orb || { cx:W/2, cy:H/2, r:Math.min(W,H)*.4 }, R = (KM.R||300)*KM.cam.z, v = { cx: O.cx + KM.cam.x, cy: O.cy + KM.cam.y, R, yaw: KM.yaw, tilt: KM.tilt, persp:.3/Math.max(1, Math.sqrt(KM.cam.z)) };
  const fade = KM.view==='leaving' ? clamp(1 - (now - KM.leaveT0)/600, 0, 1) : 1;
  kmSky(g, W, H, TT, now, fade, still);
  if (!KM.dust) KM.dust = GAL.dust(W < 760 ? 3200 : 5200, 77);
  const vD = Object.assign({}, v, { R: R*(1 + (1-ie)*1.4) });
  KM_DOMAINS.forEach((d,i)=>GAL.drawRing(g, .26 + i/(KM_DOMAINS.length-1)*.66, v, .09*ie*fade, TT));
  if (!KM.neb) KM.neb = GAL.nebula(); GAL.drawNebula(g, KM.neb, vD, TT, ie*fade);
  kmStreaks(g, v, TT, ie*fade, still);
  GAL.drawDust(g, KM.dust, vD, TT, ie*fade*.95);
  kmBelt(g, v, TT, ie*fade);
  kmDustLanes(g, v, TT, ie*fade);
  if (!still && ie > .9) kmNovae(g, vD, TT, now, fade);
  // project nodes
  const conn = KM.sel ? new Set([KM.sel, ...KM.edges.filter(e=>e.a===KM.sel||e.b===KM.sel).flatMap(e=>[e.a,e.b])]) : null;
  KM.nodes.forEach(n=>{ const w = kmWorld(n, TT), sc = 1+(1-ie)*.6, p = GAL.proj(Math.hypot(w[0],w[1])*sc, Math.atan2(w[1],w[0]), n.el||0, v); n.wx = w[0]; n.wz = w[1]; n.sx = p[0]; n.sy = p[1]; n.dz = p[2]; n.pk = p[3] || 1;
    let a = (still ? 1 : clamp((T - kmIntroAt(n))/.6, 0, 1)) * fade; if (conn && !conn.has(n)) a *= .25; if (KM.gaps && n.type==='topic' && kmMastery(n.topic) >= 100) a *= .25; n.va = a; });
  kmStarNebulae(g, W, H, TT, still, fade);
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
  const core = KM.nodes[0], sunR = (KM.R||300)*.06*clamp(Math.pow(KM.cam.z,.8), .5, 9);
  kmSun(g, core.sx, core.sy, sunR*(still ? 1 : (T < 1.2 ? .4 + .9*Math.sin(clamp(T/1.2,0,1)*Math.PI/2) + (T>.7&&T<1.2? (1.2-T)*1.4 : 0) : 1)), TT, fade, still);
  core.sr = sunR;
  if (!still && ie > .9) kmComets(g, v, TT, core, fade);
  const gz = clamp(Math.pow(KM.cam.z,.75), .75, 10), gt = clamp(Math.pow(KM.cam.z,.8), .8, 12), gd = clamp(Math.pow(KM.cam.z,.7), .7, 8);
  // moon orbits round each planet once you zoom in (or select it)
  { const oa = clamp((KM.cam.z - 1.3)/1.2, 0, 1); KM.nodes.forEach(n=>{ if (n.type!=='domain' || n.va <= 0) return; const a = Math.max(oa, KM.sel===n ? 1 : 0)*n.va; if (a <= .02) return;
      const lrs = [...new Set(KM.nodes.filter(t=>t.parent===n && t.type==='topic').map(t=>t.lr))]; g.strokeStyle = `rgba(214,200,186,${(.22*a).toFixed(3)})`; g.lineWidth = .8;
      lrs.forEach(lr=>{ g.beginPath(); for (let i=0;i<=48;i++){ const th = i/48*Math.PI*2, x = n.wx + Math.cos(th)*lr, z = n.wz + Math.sin(th)*lr, p = GAL.proj(Math.hypot(x,z), Math.atan2(z,x), 0, v); i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); } g.stroke(); }); }); }
  // nodes, far to near
  const list = KM.nodes.filter(n=>n.type!=='core' && n.va > 0).sort((a,b)=>a.dz-b.dz); KM.labs = kmPanels().map(p=>p.slice());
  // reserve label space front-to-back: domains first, then the nearest topics
  const labOK = new Set(); g.font = '600 13px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
  [...list].sort((a,b)=>(a.type==='domain'?0:a.type==='topic'?1:2)-(b.type==='domain'?0:b.type==='topic'?1:2) || (KM.sel===b)-(KM.sel===a) || b.dz-a.dz).forEach(n=>{ if (n.type==='practice'||n.type==='skill'||n.type==='task'||n.type==='hole') return; const w = g.measureText(n.name).width*(n.type==='topic'?.93:1) + 6, r = n.type==='domain' ? (5 + n.w*.28)*1.6*clamp(Math.pow(KM.cam.z,.75), .75, 10) : 3.4*clamp(Math.pow(KM.cam.z,.8), .8, 12), h = n.type==='domain' ? 30 : 16, xr = n.sx + r + 6, xl = n.sx - r - 6 - w; n.lside = xr + w > W - 8 ? -1 : 1; if (kmLabelFree(n.lside > 0 ? xr : xl, n.sy - 10, w, h)) labOK.add(n); else if (n.type==='domain' && kmLabelFree(n.lside > 0 ? xl : xr, n.sy - 10, w, h)){ n.lside = -n.lside; labOK.add(n); } });
  const zs = Math.max(.7, Math.min(1.8, KM.cam.z));
  list.forEach(n=>{
    const depth = n.pk || 1, hov = KM.hover===n ? 1.25 : 1, blur = clamp(-(n.dz||0) - .35, 0, 1)*(KM.cam.z < 2 ? 1 : 0);
    if (n.type==='domain'){ const di = KM_DOMAINS.indexOf(n.dom), r = (5 + n.w*.28)*gz*depth*hov;
      kmStar(g, n.sx, n.sy, r, KM_STAR_COLS[di % KM_STAR_COLS.length], TT, n.va*(1 - blur*.35), n.ph, still); n.sr = r*1.6;
      g.globalAlpha = n.va; g.font = '600 13px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; g.fillStyle = '#F4EFE8'; g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 8;
      const lab = W < 760 && n.name.length > 16 ? n.name.slice(0,15).trimEnd()+'…' : n.name, lw = g.measureText(lab).width, lx = n.lside < 0 ? n.sx - r*1.6 - 9 - lw : n.sx + r*1.6 + 9; if (!labOK.has(n)) g.globalAlpha = 0; else if (kmInTitle(lx, n.sy, lw)) g.globalAlpha = n.va*(1-KM.tA); g.fillText(lab, lx, n.sy + 1); g.shadowBlur = 0; if (labOK.has(n)) kmChip(g, lx, n.sy + 15, n.w + '%', n.va*.95*(kmInTitle(lx, n.sy, 40) ? 1-KM.tA : 1)); g.globalAlpha = 1; }
    else if (n.type==='task'){ const r = (5.2 + (n.task.go==='train' ? 1.5 : 0))*gt*depth*hov, done = taskDone(dkey(), n.task.id), col = KM_TASK_COLS[n.task.go] || KM_TASK_COLS.def;
      if (n.ringed) kmPlanetRing(g, n.sx, n.sy, r, col, v.tilt, n.va, true);
      kmGloss(g, n.sx, n.sy, r, col, core.sx-n.sx, core.sy-n.sy, n.va*(1 - blur*.4), done, TT);
      if (n.ringed) kmPlanetRing(g, n.sx, n.sy, r, col, v.tilt, n.va, false); n.sr = r + 5;
      if (KM.hover===n || KM.sel===n || (KM.labels && (KM.cam.z > 1.35 || W >= 1100) && !kmInTitle(n.sx + r + 6, n.sy, 90))){ g.globalAlpha = kmOverPanel(n.sx + r + 6, n.sy - 10, 110, 16) ? 0 : n.va*(KM.hover===n || KM.sel===n ? 1 : .8); g.font = '600 11.5px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; g.fillStyle = done ? '#F3DDBA' : '#D9E6F2'; g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 6; g.fillText((done ? '✓ ' : '') + n.name, n.sx + r + 6, n.sy + 4); g.shadowBlur = 0; g.globalAlpha = 1; } }
    else if (n.type==='sat'){ const r = 4.5*gt*depth*hov; kmSat(g, n.sx, n.sy, r, TT, n.va, n.ph, still); n.sr = r*2.4;
      if (KM.hover===n || KM.sel===n || (KM.labels && KM.cam.z > 1.3)){ g.globalAlpha = kmOverPanel(n.sx + r*2.6, n.sy - 10, 130, 16) ? 0 : n.va*.9; g.font = '600 11px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; g.fillStyle = '#BFE0FF'; g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 6; g.fillText(`${n.block.t} ${n.name}`, n.sx + r*2.6, n.sy + 4); g.shadowBlur = 0; g.globalAlpha = 1; } }
    else if (n.type==='neb'){ const r = 26*gz*depth*hov; kmNeb(g, n.sx, n.sy, r, n.col, n.prog, TT, n.va, n.ph, still); n.sr = r*.8;
      { const t = `${n.name} · ${Math.round(n.prog*100)}%`; g.font = '650 12px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; const tw = g.measureText(t).width; g.globalAlpha = kmOverPanel(n.sx - tw/2, n.sy + r*1.05, tw, 16) ? 0 : n.va*.9; } g.fillStyle = `rgb(${n.col})`; g.shadowColor = 'rgba(0,0,0,.95)'; g.shadowBlur = 8; g.textAlign = 'center'; g.fillText(`${n.name} · ${Math.round(n.prog*100)}%`, n.sx, n.sy + r*1.05 + 12); g.textAlign = 'start'; g.shadowBlur = 0; g.globalAlpha = 1; }
    else if (n.type==='pulsar'){ const r = 4*gz*depth*hov; kmPulsar(g, n.sx, n.sy, r, TT, n.va, still); n.sr = r*3;
      if (KM.hover===n || KM.sel===n || (KM.labels && KM.cam.z > 1.1)){ g.globalAlpha = kmOverPanel(n.sx + r*3, n.sy - r*2 - 12, 110, 16) ? 0 : n.va*.85; g.font = '600 11px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; g.fillStyle = '#CFE6FF'; g.fillText(`Streak · ${currentStreak()} days`, n.sx + r*3, n.sy - r*2); g.globalAlpha = 1; } }
    else if (n.type==='const'){ const r = 12*gz*depth; kmConst(g, n.sx, n.sy, r, TT, n.va); n.sr = r*3; }
    else if (n.type==='hole'){ const r = 9*gz*depth*hov; kmHole(g, n.sx, n.sy, r, TT, n.va, n.ph, still); n.sr = r*1.8;
      if (KM.hover===n || KM.sel===n || (KM.labels && KM.cam.z > 1.2)){ g.globalAlpha = kmOverPanel(n.sx + r*2.2 + 4, n.sy - 10, 140, 16) ? 0 : n.va*.85; g.font = '600 11.5px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; g.fillStyle = '#F2B7A8'; g.shadowColor = 'rgba(0,0,0,.95)'; g.shadowBlur = 6; g.fillText(n.name, n.sx + r*2.2 + 4, n.sy + 4); g.shadowBlur = 0; g.globalAlpha = 1; } }
    else if (n.type==='topic' && kmMastery(n.topic) < 50){ const r = 3.6*gt*depth*hov; kmRock(g, n.sx, n.sy, r, n.ph, TT, core.sx-n.sx, core.sy-n.sy, n.va); n.sr = r + 5;
      if (KM.hover===n || KM.sel===n || (labOK.has(n) && ((KM.labels && KM.cam.z > 1.5) || (conn && conn.has(n))))){ g.globalAlpha = n.va; g.font = '600 12px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; g.fillStyle = '#D8CBBE'; g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 6; g.fillText(n.name, n.sx + r + 8, n.sy + 4); g.shadowBlur = 0; g.globalAlpha = 1; } }
    else if (n.type==='topic'){ const r = 3.4*gt*depth*hov, m = kmMastery(n.topic);
      g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(n.sx,n.sy,0,n.sx,n.sy,r*3.4); gr.addColorStop(0,`rgba(${m>=100?'230,205,176':'200,216,240'},${(.3*n.va).toFixed(2)})`); gr.addColorStop(1,'rgba(180,200,240,0)'); g.fillStyle = gr; g.beginPath(); g.arc(n.sx,n.sy,r*3.4,0,7); g.fill(); g.globalCompositeOperation = 'source-over';
      GAL.planet(g, n.sx, n.sy, r, m>=100 ? KM_PLANET.practice : KM_PLANET.topic, core.sx-n.sx, core.sy-n.sy, n.va); n.sr = r + 4;
      if (KM.hover===n || KM.sel===n || (labOK.has(n) && ((KM.labels && KM.cam.z > 1.5) || (conn && conn.has(n))))){ g.globalAlpha = n.va; g.font = '600 12px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; g.fillStyle = '#E8EEF8'; g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 6; g.fillText(n.name, n.sx + r + 8, n.sy + 4); g.shadowBlur = 0; g.globalAlpha = 1; } }
    else { const r = (n.type==='practice' ? 2 : 1.6)*gd*depth; g.globalAlpha = n.va; g.fillStyle = n.type==='practice' ? '#E6CDB0' : '#D44A62'; g.beginPath(); g.arc(n.sx,n.sy,r,0,7); g.fill(); g.globalAlpha = 1; n.sr = r + 5;
      if (KM.labels && KM.cam.z > 2.2 && kmLabelFree(n.sx + r + 3, n.sy - 12, 18, 12)) kmChip(g, n.sx + r + 4, n.sy - 6, String(n.n), n.va*.85); }
  });
  if (KM.hover && KM.hover.sr && KM.hover.va > 0 && !still){ const h = KM.hover; g.save(); g.strokeStyle = 'rgba(230,205,176,.75)'; g.lineWidth = 1.2; g.setLineDash([4,5]); g.lineDashOffset = -TT*20; g.beginPath(); g.arc(h.sx, h.sy, h.sr + 7, 0, 7); g.stroke(); g.restore(); }
  if (KM.fx && KM.fx.rip){ KM.fx.rip = KM.fx.rip.filter(r0=>now - r0.t0 < 900); g.globalCompositeOperation = 'lighter'; KM.fx.rip.forEach(r0=>{ const k = (now - r0.t0)/900; [0,.18].forEach(dk=>{ const kk = clamp(k - dk, 0, 1); if (!kk) return; g.strokeStyle = `rgba(200,225,255,${((1-kk)*.6).toFixed(3)})`; g.lineWidth = 2*(1-kk) + .5; g.beginPath(); g.ellipse(r0.x, r0.y, 8 + kk*70, (8 + kk*70)*.55, 0, 0, 7); g.stroke(); }); }); g.globalCompositeOperation = 'source-over'; }
  if (KM.tween && KM.tween.d >= 600 && !still){ const k = Math.min(1, (now - KM.tween.t0)/KM.tween.d), al = Math.sin(k*Math.PI)*.32; if (al > .01){ if (!KM.warp){ const r1 = mulberry32(5); KM.warp = Array.from({length:80},()=>[r1()*Math.PI*2, .15 + r1()*.85, .5 + r1()]); }
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; const cx0 = W/2, cy0 = H/2, M = Math.hypot(W,H)/2; KM.warp.forEach(([a0, d0, w0])=>{ const r1 = M*d0*(.6 + k*.5), r2 = r1 + M*.18*w0*Math.sin(k*Math.PI); const gr = g.createLinearGradient(cx0 + Math.cos(a0)*r1, cy0 + Math.sin(a0)*r1, cx0 + Math.cos(a0)*r2, cy0 + Math.sin(a0)*r2); gr.addColorStop(0,'rgba(200,225,255,0)'); gr.addColorStop(1,`rgba(220,235,255,${al.toFixed(3)})`); g.strokeStyle = gr; g.lineWidth = w0*1.2; g.beginPath(); g.moveTo(cx0 + Math.cos(a0)*r1, cy0 + Math.sin(a0)*r1); g.lineTo(cx0 + Math.cos(a0)*r2, cy0 + Math.sin(a0)*r2); g.stroke(); }); g.globalCompositeOperation = 'source-over'; } }
  if (!still) kmBokeh(g, W, H, TT, fade);
  // a soft dark band keeps the title readable over the core
  if (KM.tA > .01){ const tr = Math.min(O.r, 380), tcx = O.cx + KM.cam.x, ty = O.cy + KM.cam.y - tr*.02, tv = g.createRadialGradient(tcx, ty, 0, tcx, ty, tr*.7); tv.addColorStop(0,`rgba(8,6,7,${(.38*KM.tA).toFixed(3)})`); tv.addColorStop(1,'rgba(8,6,7,0)'); g.fillStyle = tv; g.beginPath(); g.ellipse(tcx, ty, tr*.74, tr*.3, 0, 0, 7); g.fill(); }
}
function kmTitleBox(){ // union of the title's text lines, in canvas coordinates
  const t = document.querySelector('.km-title'), cv = document.getElementById('kmCanvas'); if (!t || !cv) return; const c = cv.getBoundingClientRect(); let b = null;
  t.querySelectorAll('small,h1,span').forEach(el=>{ const r = el.getBoundingClientRect(), w = el.tagName==='H1' ? r.width : Math.min(r.width, el.scrollWidth); const x0 = r.left + (r.width - w)/2 - c.left; b = b ? [Math.min(b[0],x0), Math.min(b[1],r.top-c.top), Math.max(b[2],x0+w), Math.max(b[3],r.bottom-c.top)] : [x0, r.top-c.top, x0+w, r.bottom-c.top]; });
  KM.tBox = b; KM.tBoxCam = [KM.cam.x, KM.cam.y]; }
/* ---------- cosmic objects ---------- */
const KM_STAR_COLS = ['255,214,170','190,215,255','255,190,140','236,240,255','255,166,140','200,225,255','255,232,196','176,200,255','255,205,160'];
const KM_TASK_COLS = { train:['#F3D3C2','#C2603E','#3E1A10'], learn:['#DCE8F6','#6F93C2','#1B2A40'], money:['#F2E4C8','#B8955E','#3E2E14'], progress:['#E4F0E6','#7FA68A','#1E3326'], coach:['#EADCF2','#9A7BB5','#2C1E3A'], today:['#E8EEF2','#8EA4B4','#22303A'], def:['#E8E4DE','#A49A8E','#2E2A26'] };
function kmStar(g, x, y, r, c, T, a, ph, still){ // a big name: hot core, coloured halo, soft cross spikes that breathe
  const tw = still ? 1 : .85 + .15*Math.sin(T*1.7 + ph*3);
  g.globalCompositeOperation = 'lighter';
  let gr = g.createRadialGradient(x,y,0,x,y,r*5*tw); gr.addColorStop(0,`rgba(${c},${(.5*a).toFixed(3)})`); gr.addColorStop(.25,`rgba(${c},${(.16*a).toFixed(3)})`); gr.addColorStop(1,`rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x,y,r*5*tw,0,7); g.fill();
  const L = r*(4.2 + 1.2*tw); g.lineCap = 'round';
  [[0,1],[Math.PI/2,1],[Math.PI/4,.45],[-Math.PI/4,.45]].forEach(([ang,k])=>{ const dx = Math.cos(ang)*L*k, dy = Math.sin(ang)*L*k, sg = g.createLinearGradient(x-dx,y-dy,x+dx,y+dy); sg.addColorStop(0,`rgba(${c},0)`); sg.addColorStop(.5,`rgba(255,255,255,${(.7*a*k).toFixed(3)})`); sg.addColorStop(1,`rgba(${c},0)`); g.strokeStyle = sg; g.lineWidth = Math.max(.8, r*.12); g.beginPath(); g.moveTo(x-dx,y-dy); g.lineTo(x+dx,y+dy); g.stroke(); });
  gr = g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(255,255,255,${a})`); gr.addColorStop(.45,`rgba(${c},${(.9*a).toFixed(3)})`); gr.addColorStop(1,`rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
  g.globalCompositeOperation = 'source-over';
}
function kmGloss(g, x, y, r, col, lx, ly, a, done, T){ // a task as a glossy planet, rim-lit by the sun; done planets glow warm
  if (done){ g.globalCompositeOperation = 'lighter'; const h = g.createRadialGradient(x,y,r*.8,x,y,r*2.4); h.addColorStop(0,`rgba(255,200,140,${(.35*a).toFixed(3)})`); h.addColorStop(1,'rgba(255,170,110,0)'); g.fillStyle = h; g.beginPath(); g.arc(x,y,r*2.4,0,7); g.fill(); g.globalCompositeOperation = 'source-over'; }
  GAL.planet(g, x, y, r, col, lx, ly, a*(done ? 1 : .85));
  const L = Math.hypot(lx,ly) || 1, ux = lx/L, uy = ly/L, ang = Math.atan2(uy, ux);
  g.globalAlpha = a; g.strokeStyle = done ? 'rgba(255,226,186,.95)' : 'rgba(190,220,255,.75)'; g.lineWidth = Math.max(1, r*.14); g.beginPath(); g.arc(x, y, r*.98, ang - 1.1, ang + 1.1); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(x + ux*r*.42 - uy*r*.2, y + uy*r*.42 + ux*r*.2, r*.2, r*.11, ang, 0, 7); g.fill();
  const sh = g.createRadialGradient(x - ux*r*.5, y - uy*r*.5, r*.2, x - ux*r*.3, y - uy*r*.3, r*1.1); sh.addColorStop(0,'rgba(0,0,0,.55)'); sh.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = sh; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
  g.globalAlpha = 1;
}
function kmRock(g, x, y, r, seed, T, lx, ly, a){ // a topic that needs more training: a tumbling, lumpy asteroid
  const rr = mulberry32(Math.floor(seed*1e4)), n = 9, rot = T*(.3 + (seed % 1)*.5) + seed, pts = [];
  for (let i=0;i<n;i++){ const ang = rot + i/n*Math.PI*2, k = .7 + rr()*.45; pts.push([x + Math.cos(ang)*r*k, y + Math.sin(ang)*r*k*.85]); }
  const L = Math.hypot(lx,ly) || 1, gr = g.createLinearGradient(x + lx/L*r, y + ly/L*r, x - lx/L*r, y - ly/L*r); gr.addColorStop(0,'#B9A898'); gr.addColorStop(.5,'#6E6158'); gr.addColorStop(1,'#231D1A');
  g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); pts.forEach((p,i)=>i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1])); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(220,200,180,.35)'; g.lineWidth = .7; g.stroke();
  g.fillStyle = 'rgba(30,24,20,.5)'; for (let i=0;i<2;i++){ g.beginPath(); g.arc(x + (rr()-.5)*r, y + (rr()-.5)*r*.8, r*(.12 + rr()*.12), 0, 7); g.fill(); }
  g.globalAlpha = 1;
}
function kmHole(g, x, y, r, T, a, ph, still){ // a mistake to avoid: event horizon, photon ring, lensed hot accretion disc, matter spiralling in
  const rot = still ? 0 : T*.6, tilt = .28;
  const disc = (front) => { g.save(); g.beginPath(); front ? g.rect(x - r*4, y, r*8, r*4) : g.rect(x - r*4, y - r*4, r*8, r*4); g.clip(); g.globalCompositeOperation = 'lighter';
    for (let k=0;k<5;k++){ const rk = r*(1.35 + k*.38), al = (.5 - k*.08)*a; const gr = g.createLinearGradient(x - rk, y, x + rk, y); gr.addColorStop(0,`rgba(255,150,90,${(al*.45).toFixed(3)})`); gr.addColorStop(.5,`rgba(255,226,190,${al.toFixed(3)})`); gr.addColorStop(1,`rgba(255,120,70,${(al*1.4).toFixed(3)})`);
      g.strokeStyle = gr; g.lineWidth = r*(.32 - k*.04); g.beginPath(); g.ellipse(x, y, rk, rk*tilt, -.08, 0, 7); g.stroke(); }
    g.restore(); };
  // lensed back of the disc arching over the top and under the bottom
  g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,200,150,${(.35*a).toFixed(3)})`; g.lineWidth = r*.22; g.beginPath(); g.ellipse(x, y, r*1.32, r*1.2, 0, Math.PI*1.04, Math.PI*1.96); g.stroke(); g.strokeStyle = `rgba(255,170,120,${(.16*a).toFixed(3)})`; g.beginPath(); g.ellipse(x, y, r*1.25, r*1.1, 0, Math.PI*.06, Math.PI*.94); g.stroke(); g.restore();
  disc(false);
  const hz = g.createRadialGradient(x,y,r*.75,x,y,r*1.05); hz.addColorStop(0,'rgba(0,0,0,1)'); hz.addColorStop(1,'rgba(0,0,0,.9)'); g.globalAlpha = a; g.fillStyle = hz; g.beginPath(); g.arc(x,y,r*1.02,0,7); g.fill(); g.globalAlpha = 1;
  g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,236,210,${(.85*a).toFixed(3)})`; g.lineWidth = Math.max(1, r*.07); g.beginPath(); g.arc(x,y,r*1.06,0,7); g.stroke(); g.globalCompositeOperation = 'source-over';
  disc(true);
  if (!still){ g.globalCompositeOperation = 'lighter'; for (let i=0;i<10;i++){ const life = ((T*.35 + i/10 + ph) % 1), rad = r*(3.6 - life*2.5), ang = rot*1.5 + i*2.4 + life*5; g.fillStyle = `rgba(255,214,170,${(a*life*.8).toFixed(3)})`; g.beginPath(); g.arc(x + Math.cos(ang)*rad, y + Math.sin(ang)*rad*tilt*1.4, 1 + life, 0, 7); g.fill(); } g.globalCompositeOperation = 'source-over'; }
}
function kmSat(g, x, y, r, T, a, ph, still){ // a satellite: body, two solar panels, a blinking light
  const ang = (still ? 0 : T*.6) + ph; g.save(); g.globalAlpha = a; g.translate(x,y); g.rotate(ang);
  g.fillStyle = '#2B4A6E'; g.strokeStyle = 'rgba(170,210,255,.8)'; g.lineWidth = .8;
  [-1,1].forEach(sd=>{ g.fillRect(sd*r*1.1 - (sd<0 ? r*1.4 : 0), -r*.45, r*1.4, r*.9); g.strokeRect(sd*r*1.1 - (sd<0 ? r*1.4 : 0), -r*.45, r*1.4, r*.9); g.beginPath(); g.moveTo(sd*r*.5, 0); g.lineTo(sd*r*1.1, 0); g.stroke(); });
  const gr = g.createLinearGradient(-r*.5, -r*.5, r*.5, r*.5); gr.addColorStop(0,'#F2F1ED'); gr.addColorStop(1,'#8C99A8'); g.fillStyle = gr; g.beginPath(); g.rect(-r*.5, -r*.5, r, r); g.fill();
  g.restore(); if (!still && Math.sin(T*4 + ph*5) > .6){ g.globalCompositeOperation = 'lighter'; const b = g.createRadialGradient(x,y,0,x,y,r*1.6); b.addColorStop(0,'rgba(255,90,110,.9)'); b.addColorStop(1,'rgba(255,90,110,0)'); g.fillStyle = b; g.beginPath(); g.arc(x,y,r*1.6,0,7); g.fill(); g.globalCompositeOperation = 'source-over'; }
}
function kmNeb(g, x, y, r, c, prog, T, a, ph, still){ // a goal nebula: soft drifting clouds, brighter as the goal fills, with a progress arc
  g.globalCompositeOperation = 'lighter'; const k = .35 + .65*prog;
  for (let i=0;i<5;i++){ const an = ph + i*1.26 + (still ? 0 : T*.05*(i%2 ? 1 : -1)), d = r*(.25 + .2*(i%3)), bx = x + Math.cos(an)*d, by = y + Math.sin(an)*d*.6, br = r*(.55 + .15*(i%2));
    const gr = g.createRadialGradient(bx,by,0,bx,by,br); gr.addColorStop(0,`rgba(${c},${(.16*k*a).toFixed(3)})`); gr.addColorStop(1,`rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(bx,by,br,0,7); g.fill(); }
  const core = g.createRadialGradient(x,y,0,x,y,r*.25); core.addColorStop(0,`rgba(255,255,255,${(.5*k*a).toFixed(3)})`); core.addColorStop(1,`rgba(${c},0)`); g.fillStyle = core; g.beginPath(); g.arc(x,y,r*.25,0,7); g.fill();
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = a; g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r*.62, 0, 7); g.stroke();
  if (prog > 0){ g.strokeStyle = `rgb(${c})`; g.lineWidth = 2.4; g.beginPath(); g.arc(x, y, r*.62, -Math.PI/2, -Math.PI/2 + prog*Math.PI*2); g.stroke(); }
  g.globalAlpha = 1;
}
function kmPulsar(g, x, y, r, T, a, still){ // the streak: a neutron star sweeping two beams round
  const st = currentStreak(), sp = .6 + Math.min(4, st*.25), ang = still ? .6 : T*sp, L = r*14;
  g.globalCompositeOperation = 'lighter';
  [0, Math.PI].forEach(o=>{ const an = ang + o, ex = x + Math.cos(an)*L, ey = y + Math.sin(an)*L*.5, gr = g.createLinearGradient(x,y,ex,ey); gr.addColorStop(0,`rgba(190,220,255,${(.55*a).toFixed(3)})`); gr.addColorStop(1,'rgba(190,220,255,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x,y); g.lineTo(ex + Math.cos(an+Math.PI/2)*r*1.6, ey + Math.sin(an+Math.PI/2)*r*.8); g.lineTo(ex - Math.cos(an+Math.PI/2)*r*1.6, ey - Math.sin(an+Math.PI/2)*r*.8); g.closePath(); g.fill(); });
  const c = g.createRadialGradient(x,y,0,x,y,r*2.4); c.addColorStop(0,`rgba(255,255,255,${a})`); c.addColorStop(.4,`rgba(170,210,255,${(.6*a).toFixed(3)})`); c.addColorStop(1,'rgba(170,210,255,0)'); g.fillStyle = c; g.beginPath(); g.arc(x,y,r*2.4,0,7); g.fill();
  g.globalCompositeOperation = 'source-over';
}
function kmConst(g, x, y, r, T, a){ // last 14 days as a constellation: bright stars = streak days, lines join days in a row
  const d = KM.days14 || []; if (!d.length) return; const pts = d.map((day,i)=>{ const t = i/13, ang = -2.4 + t*2.2; return [x + Math.cos(ang)*r*2.4 + Math.sin(i*1.7)*r*.25, y + Math.sin(ang)*r*1.1 + Math.cos(i*2.3)*r*.3, day.n >= 4, day.n]; });
  g.globalAlpha = a; g.strokeStyle = 'rgba(200,225,255,.45)'; g.lineWidth = .9;
  for (let i=1;i<pts.length;i++) if (pts[i][2] && pts[i-1][2]){ g.beginPath(); g.moveTo(pts[i-1][0], pts[i-1][1]); g.lineTo(pts[i][0], pts[i][1]); g.stroke(); }
  g.globalCompositeOperation = 'lighter';
  pts.forEach(([px,py,on,n],i)=>{ const s = on ? 3 : n > 0 ? 1.8 : 1.1, tw = .75 + .25*Math.sin(T*2 + i); const gr = g.createRadialGradient(px,py,0,px,py,s*3); gr.addColorStop(0,`rgba(235,245,255,${((on ? .95 : .5)*tw*a).toFixed(3)})`); gr.addColorStop(1,'rgba(200,225,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(px,py,s*3,0,7); g.fill(); });
  g.globalCompositeOperation = 'source-over'; g.font = '600 11px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; g.fillStyle = 'rgba(200,225,255,.75)'; g.textAlign = 'center'; g.fillText('Last 14 days', x, y + r*1.9); g.textAlign = 'start'; g.globalAlpha = 1;
}
function kmStreaks(g, v, T, a, still){ // glowing orbit trails round the sun, with light running along them
  if (a <= 0) return; if (!KM.streaks){ const r = mulberry32(17); KM.streaks = Array.from({length:30},(_,i)=>({ rad:.06 + Math.pow(i/30, 1.15)*1.05 + r()*.012, al:.03 + r()*.05, runs:Array.from({length:1 + (r() < .6 ? 1 : 0)},()=>({ ph:r()*7, len:.35 + r()*.9, sp:(.25 + r()*.5)*(r() < .15 ? -1 : 1) })), c:r() < .18 ? '255,190,140' : '170,210,255' })); }
  g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  KM.streaks.forEach(s=>{ g.strokeStyle = `rgba(${s.c},${(s.al*a).toFixed(3)})`; g.lineWidth = .8; g.beginPath(); const np = Math.round(clamp(s.rad*v.R*.12, 28, 64)); for (let i=0;i<=np;i++){ const p = GAL.proj(s.rad, i/np*Math.PI*2, 0, v); i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); } g.stroke();
    if (still) return;
    s.runs.forEach(rn=>{ const a0 = rn.ph + T*rn.sp*GAL.spin(s.rad, 1)*6, seg = 9; let prev = null;
      for (let i=0;i<=seg;i++){ const t = i/seg, p = GAL.proj(s.rad, a0 - t*rn.len*Math.sign(rn.sp), 0, v); if (prev){ g.strokeStyle = `rgba(${s.c},${((1-t)*.55*a).toFixed(3)})`; g.lineWidth = 1.6*(1-t) + .4; g.beginPath(); g.moveTo(prev[0],prev[1]); g.lineTo(p[0],p[1]); g.stroke(); } prev = p; } }); });
  g.globalCompositeOperation = 'source-over';
}
function kmBelt(g, v, T, a){ if (!KM.belt || a <= 0) return; g.globalAlpha = a*.8;
  KM.belt.forEach(b=>{ const p = GAL.proj(b.r, b.th + GAL.spin(b.r, T)*.7, b.y, v), s = b.s*Math.min(1.6, v.R/420)*p[3]; g.fillStyle = b.c < .5 ? '#8C7D70' : b.c < .85 ? '#5E544C' : '#C9B8A6'; g.fillRect(p[0]-s/2, p[1]-s/2, s, s*.8); });
  g.globalAlpha = 1; }
function kmBokehSprite(c){ // one cached disc per colour (same look as the old per-frame gradient, drawn at alpha 0.1 then scaled by globalAlpha)
  KM.bokehSpr = KM.bokehSpr || {}; if (KM.bokehSpr[c]) return KM.bokehSpr[c];
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32,32,32*.55,32,32,32);
  gr.addColorStop(0,`rgba(${c},.1)`); gr.addColorStop(.85,`rgba(${c},.15)`); gr.addColorStop(1,`rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(32,32,32,0,7); g.fill();
  return (KM.bokehSpr[c] = cv);
}
function kmBokeh(g, W, H, T, fade){ // out-of-focus specks drifting in front of the camera (depth of field)
  if (!KM.bokeh){ const r = mulberry32(73); KM.bokeh = Array.from({length:34},()=>({ x:r(), y:r(), z:.3 + r()*.7, s:6 + r()*22, c:r() < .35 ? '255,196,150' : '170,205,240', ph:r()*6 })); }
  g.globalCompositeOperation = 'lighter';
  KM.bokeh.forEach(b=>{ const x = ((b.x*W + KM.yaw*90*b.z + Math.sin(T*.1 + b.ph)*14) % W + W) % W, y = b.y*H + Math.cos(T*.12 + b.ph)*10 + (KM.tilt - 1)*60*b.z, r = b.s*b.z, al = (.05 + .05*b.z)*fade*(.7 + .3*Math.sin(T*.6 + b.ph));
    const spr = kmBokehSprite(b.c); g.globalAlpha = Math.min(1, al/.1); g.drawImage(spr, x - r, y - r, r*2, r*2); });
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
}
/* ---------- star nebulae: a cloud round each domain star that grows with real study time ---------- */
function kmStudyScores(){ // 0..1 per domain: mastery (packs, tests) plus minutes of done day-plan blocks in that area
  const mins = { English:0, Career:0, Engineering:0 };
  try { Object.keys(state.days||{}).forEach(k=>{ dayBlocks(k).forEach(b=>{ if (mins[b.cat] === undefined) return; const st = blockStatus(k, b); mins[b.cat] += st==='done' ? b.dur : st==='partly' ? b.dur/2 : 0; }); }); } catch(_){}
  const nEng = KM_DOMAINS.filter(d=>d.id!=='english' && d.id!=='career').length || 1;
  KM.study = {}; KM_DOMAINS.forEach(d=>{ const mast = d.topics.reduce((a,t)=>a + kmMastery(t), 0)/d.topics.length/100;
    const m = d.id==='english' ? mins.English : d.id==='career' ? mins.Career : mins.Engineering/nEng;
    KM.study[d.id] = clamp(.55*mast + .45*(1 - Math.exp(-m/1800)), 0, 1); }); // ~30 h logged in an area gets the time half most of the way
}
function kmStudyAvg(){ const v = Object.values(KM.study || {}); return v.length ? v.reduce((a,b)=>a+b,0)/v.length : 0; }
function kmSnebPrep(still){ // four base fields, built one per frame during the fly-in (all at once with reduced motion), tinted per domain
  if (!KM.sneb) KM.sneb = { fields:[], tex:{} };
  const S = KM.sneb; let budget = still ? 4 : 1;
  while (S.fields.length < 4 && budget-- > 0) S.fields.push(GAL.snebField(31 + S.fields.length*17));
  KM_DOMAINS.forEach((d,i)=>{ const f = S.fields[i % 4]; if (f && !S.tex[d.id]) S.tex[d.id] = GAL.snebTint(f, KM_STAR_COLS[i % KM_STAR_COLS.length]); });
}
function kmStarNebulae(g, W, H, T, still, fade){
  kmSnebPrep(still); if (!KM.study) kmStudyScores();
  const cap = Math.min(W, H)*.36, tilt = .74 + .26*Math.abs(Math.cos(KM.tilt));
  g.save(); g.globalCompositeOperation = 'lighter';
  KM.nodes.forEach(n=>{
    if (n.type!=='domain' || !(n.va > 0)) return; const tex = KM.sneb.tex[n.id]; if (!tex) return;
    const st = KM.study[n.id] || 0, raw = (KM.R||300)*KM.cam.z*(.06 + .2*st)*(n.pk || 1), size = Math.min(raw, cap);
    if (n.sx + size < 0 || n.sx - size > W || n.sy + size < 0 || n.sy - size > H) return;
    const blur = clamp(-(n.dz||0) - .35, 0, 1), wash = raw > cap ? Math.sqrt(cap/raw) : 1;   // dimmer when capped, so zooming in never floods the screen
    g.globalAlpha = (.14 + .5*st)*n.va*fade*wash*(1 - blur*.4);
    g.setTransform(1,0,0,1,0,0); g.translate(n.sx*KM.dpr, n.sy*KM.dpr); g.scale(KM.dpr, KM.dpr); g.rotate(n.ph + (still ? 0 : T*.012)); g.scale(1, tilt);
    g.drawImage(tex, -size, -size, size*2, size*2);
  });
  g.restore();
}
function kmDustLanes(g, v, T, a){ // a few thin dark lanes hugging the inner edge of the spiral arms
  if (a <= 0) return;
  const lanes = [[0, -.2, .24, .96], [Math.PI, -.2, .26, .92], [0, .24, .46, .82], [Math.PI, .2, .5, .78]], wMax = clamp(v.R/320, .8, 3.2);
  g.save(); g.lineCap = 'round'; g.globalCompositeOperation = 'source-over';
  lanes.forEach(([arm, off, r0, r1], li)=>{ let prev = null; const n = 22;
    for (let i=0;i<=n;i++){ const t = i/n, rad = r0 + (r1 - r0)*t, th = arm + Math.log(rad*5 + 1)*2.1 + off + GAL.spin(rad, T), p = GAL.proj(rad, th, 0, v);
      if (prev){ const env = Math.sin(t*Math.PI); g.strokeStyle = `rgba(3,6,10,${(.42*env*a).toFixed(3)})`; g.lineWidth = wMax*(.4 + .6*env)*(li > 1 ? .7 : 1)*(p[3] || 1); g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(p[0], p[1]); g.stroke(); }
      prev = p; } });
  g.restore();
}
/* ---------- galaxy effects ---------- */
function kmSky(g, W, H, T, now, fade, still){
  // faint coloured nebula clouds far behind the galaxy, painted once per size, gentle parallax
  if (!KM.sky || KM.sky.w !== W || KM.sky.h !== H){ const c = document.createElement('canvas'); c.width = Math.ceil(W*.6); c.height = Math.ceil(H/2); const q = c.getContext('2d'), r = mulberry32(404);
    [[24,60,96],[18,44,80],[50,100,140],[200,140,90],[30,80,110]].forEach((col,i)=>{ for (let k=0;k<3;k++){ const x = r()*c.width, y = r()*c.height, rad = (.25 + r()*.35)*Math.max(c.width,c.height), gr = q.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0,`rgba(${col},${.045 + r()*.035})`); gr.addColorStop(1,`rgba(${col},0)`); q.fillStyle = gr; q.fillRect(0,0,c.width,c.height); } });
    KM.sky = { c, w:W, h:H }; }
  g.globalAlpha = fade; const ox = W*.1 + Math.sin(KM.yaw*.5)*W*.09; g.drawImage(KM.sky.c, -ox, 0, W*1.2, H); g.globalAlpha = 1;
  // background stars, a few with diffraction spikes that twinkle
  if (!KM.stars){ const r = mulberry32(99); KM.stars = Array.from({length:340},(_,i)=>[r(), r(), r()*1.2+.3, r()*.6+.2, r()*6, i < 16]); }
  g.fillStyle = '#F2EEE8';
  KM.stars.forEach(([x,y,s,a,tw,big])=>{ const px = ((x*W + KM.yaw*20) % W + W) % W, py = y*H, al = a*(.65+.35*Math.sin(T*1.3+tw))*fade;
    if (!big){ g.globalAlpha = al; g.fillRect(px, py, s, s); return; }
    const L = 5 + 7*(.5+.5*Math.sin(T*.9+tw)); g.globalAlpha = Math.min(1, al*1.6); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(px,py,0,px,py,L*.8); gr.addColorStop(0,'rgba(255,248,236,.9)'); gr.addColorStop(1,'rgba(255,248,236,0)'); g.fillStyle = gr; g.beginPath(); g.arc(px,py,L*.8,0,7); g.fill();
    g.strokeStyle = 'rgba(255,244,230,.55)'; g.lineWidth = .8; g.beginPath(); g.moveTo(px-L,py); g.lineTo(px+L,py); g.moveTo(px,py-L); g.lineTo(px,py+L); g.stroke(); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#F2EEE8'; });
  g.globalAlpha = 1;
  if (still || !KM.fx) return;
  // shooting stars
  const fx = KM.fx; if (!fx.nextShower) fx.nextShower = now + 9000; if (now > fx.nextShower){ fx.nextShower = now + 18000 + Math.random()*14000; const a = Math.PI*(.2 + Math.random()*.15), sx0 = Math.random()*W*.6; for (let i=0;i<7;i++) fx.shoot.push({ x:sx0 + i*40 + Math.random()*60, y:Math.random()*H*.35, dx:Math.cos(a), dy:Math.sin(a), t0:now + i*110 + Math.random()*120, d:800 + Math.random()*400, sp:.8 + Math.random()*.3 }); }
  if (now > fx.nextShoot){ fx.nextShoot = now + 2200 + Math.random()*3800; const a = Math.PI*(.15 + Math.random()*.25)*(Math.random() < .5 ? 1 : -1) + (Math.random() < .5 ? 0 : Math.PI);
    fx.shoot.push({ x:Math.random()*W, y:Math.random()*H*.6, dx:Math.cos(a), dy:Math.abs(Math.sin(a)), t0:now, d:900 + Math.random()*500, sp:.55 + Math.random()*.4 }); }
  fx.shoot = fx.shoot.filter(s=>now - s.t0 < s.d && (now >= s.t0 || true)); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  fx.shoot.forEach(s=>{ if (now < s.t0) return; const k = (now - s.t0)/s.d, dist = k*s.d*s.sp, x = s.x + s.dx*dist, y = s.y + s.dy*dist, len = 90*Math.sin(k*Math.PI), al = Math.sin(k*Math.PI)*fade;
    const gr = g.createLinearGradient(x, y, x - s.dx*len, y - s.dy*len); gr.addColorStop(0,`rgba(255,250,240,${al.toFixed(2)})`); gr.addColorStop(1,'rgba(255,220,200,0)'); g.strokeStyle = gr; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x,y); g.lineTo(x - s.dx*len, y - s.dy*len); g.stroke(); });
  g.globalCompositeOperation = 'source-over';
}
function kmNovae(g, v, T, now, fade){ // a rare star flares up somewhere in the arms, rings out and fades
  const fx = KM.fx; if (!fx || !KM.dust) return;
  if (now > fx.nextNova){ fx.nextNova = now + 6000 + Math.random()*8000; const p = KM.dust[Math.floor(Math.random()*KM.dust.length)]; fx.nova.push({ p, t0:now, d:2200 }); }
  fx.nova = fx.nova.filter(n=>now - n.t0 < n.d); g.globalCompositeOperation = 'lighter';
  fx.nova.forEach(n=>{ const k = (now - n.t0)/n.d, [x,y] = GAL.proj(n.p.r, n.p.th + GAL.spin(n.p.r,T), n.p.y, v), fl = Math.pow(1-k, 2)*fade, rr = 4 + 26*Math.sqrt(k);
    let gr = g.createRadialGradient(x,y,0,x,y,rr*1.4); gr.addColorStop(0,`rgba(255,255,250,${(.95*fl).toFixed(3)})`); gr.addColorStop(.25,`rgba(200,220,255,${(.4*fl).toFixed(3)})`); gr.addColorStop(1,'rgba(160,190,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x,y,rr*1.4,0,7); g.fill();
    g.strokeStyle = `rgba(255,170,190,${(.5*fl).toFixed(3)})`; g.lineWidth = 1.2; g.beginPath(); g.arc(x,y,rr*1.8,0,7); g.stroke();
    g.strokeStyle = `rgba(255,250,240,${(.7*fl).toFixed(3)})`; g.lineWidth = .9; g.beginPath(); g.moveTo(x-rr*1.6,y); g.lineTo(x+rr*1.6,y); g.moveTo(x,y-rr*1.6); g.lineTo(x,y+rr*1.6); g.stroke(); });
  g.globalCompositeOperation = 'source-over';
}
function kmSun(g, x, y, r, T, a, still){ // the core as a star: corona, slow rays, glow and a lens flare when it sits off-centre
  g.globalCompositeOperation = 'lighter';
  if (!still){ g.save(); g.translate(x,y); g.rotate(T*.05); for (let i=0;i<12;i++){ g.rotate(Math.PI/6); const L = r*(3.2 + .8*Math.sin(T*.8 + i*1.7)); const gr = g.createLinearGradient(0,0,L,0); gr.addColorStop(0,`rgba(255,226,180,${(.16*a).toFixed(3)})`); gr.addColorStop(1,'rgba(255,200,150,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(0,-r*.18); g.lineTo(L,0); g.lineTo(0,r*.18); g.fill(); } g.restore(); }
  const pul = still ? 1 : 1 + .05*Math.sin(T*1.6); const gr = g.createRadialGradient(x,y,r*.6,x,y,r*2.4*pul); gr.addColorStop(0,`rgba(255,214,160,${(.38*a).toFixed(3)})`); gr.addColorStop(1,'rgba(200,80,60,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x,y,r*2.4*pul,0,7); g.fill();
  { const bl = g.createRadialGradient(x,y,0,x,y,r*9); bl.addColorStop(0,`rgba(255,170,90,${(.22*a).toFixed(3)})`); bl.addColorStop(.4,`rgba(255,120,60,${(.06*a).toFixed(3)})`); bl.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = bl; g.beginPath(); g.arc(x,y,r*9,0,7); g.fill();
    const AL = Math.min(r*16, 380), AH = Math.min(r*.1, 3), an = g.createLinearGradient(x - AL, y, x + AL, y); an.addColorStop(0,'rgba(255,190,130,0)'); an.addColorStop(.5,`rgba(255,226,190,${(.3*a).toFixed(3)})`); an.addColorStop(1,'rgba(255,190,130,0)'); g.fillStyle = an; g.fillRect(x - AL, y - AH, AL*2, AH*2); }
  g.globalCompositeOperation = 'source-over';
  GAL.drawCore(g, x, y, r, a);
  const O = KM.orb; if (O && !still){ const dx = O.cx - x, dy = O.cy - y, d = Math.hypot(dx,dy); if (d > 40){ g.globalCompositeOperation = 'lighter';
    [[.55,10,'255,190,150',.12],[1.1,22,'190,200,255',.08],[1.6,7,'255,150,170',.14],[2.1,34,'230,205,176',.05]].forEach(([t,s,c,al])=>{ const fx = x + dx*t, fy = y + dy*t, q = g.createRadialGradient(fx,fy,0,fx,fy,s); q.addColorStop(0,`rgba(${c},${(al*a*Math.min(1,d/200)).toFixed(3)})`); q.addColorStop(1,`rgba(${c},0)`); g.fillStyle = q; g.beginPath(); g.arc(fx,fy,s,0,7); g.fill(); });
    g.globalCompositeOperation = 'source-over'; } }
}
function kmComets(g, v, T, core, fade){ // two comets on long orbits, tails always pointing away from the sun
  [[.6, .21, 0], [.82, .14, 2.6]].forEach(([rad, sp, ph])=>{
    const th = ph + T*sp, p = GAL.proj(rad, th, 0, v); if (p[2] < -.2) return;
    const dx = p[0] - core.sx, dy = p[1] - core.sy, d = Math.hypot(dx,dy) || 1, L = 26 + 40*(1 - rad);
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(214,200,186,.12)'; g.lineWidth = 1.2; g.beginPath(); for (let i=0;i<=16;i++){ const q = GAL.proj(rad, th - i*.03, 0, v); i ? g.lineTo(q[0],q[1]) : g.moveTo(q[0],q[1]); } g.stroke();
    const gr = g.createLinearGradient(p[0], p[1], p[0] + dx/d*L, p[1] + dy/d*L); gr.addColorStop(0,`rgba(200,225,255,${(.7*fade).toFixed(2)})`); gr.addColorStop(1,'rgba(160,190,255,0)');
    g.strokeStyle = gr; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(p[0] + dx/d*L, p[1] + dy/d*L); g.stroke();
    const h = g.createRadialGradient(p[0],p[1],0,p[0],p[1],5); h.addColorStop(0,`rgba(255,255,255,${fade})`); h.addColorStop(1,'rgba(200,220,255,0)'); g.fillStyle = h; g.beginPath(); g.arc(p[0],p[1],5,0,7); g.fill();
    g.globalCompositeOperation = 'source-over'; });
}
function kmPlanetRing(g, x, y, r, col, tilt, a, back){ // Saturn-style ring: back half before the planet, front half after
  const rx = r*2.1, ry = Math.max(r*.18, r*2.1*Math.abs(Math.cos(tilt))*.42);
  g.save(); g.globalAlpha = a*.85; g.beginPath(); back ? g.rect(x - rx*1.2, y - ry*1.4, rx*2.4, ry*1.4) : g.rect(x - rx*1.2, y, rx*2.4, ry*1.4); g.clip();
  [[1, .55, 2.2],[.86, .35, 1.4],[.74, .5, 1.6]].forEach(([k, al, w])=>{ g.strokeStyle = col[0]; g.globalAlpha = a*al; g.lineWidth = w*Math.max(1, r/12); g.beginPath(); g.ellipse(x, y, rx*k, ry*k, -.12, 0, 7); g.stroke(); });
  g.restore();
}
function kmInTitle(x, y, w=0){ const b0 = KM.tBox, c0 = KM.tBoxCam || [0,0], b = b0 && [b0[0] + KM.cam.x - c0[0], b0[1] + KM.cam.y - c0[1], b0[2] + KM.cam.x - c0[0], b0[3] + KM.cam.y - c0[1]]; return b && KM.tA > .3 && x < b[2] + 8 && x + w > b[0] - 8 && y + 18 > b[1] - 4 && y - 12 < b[3] + 4; }
function kmPanels(){ // screen boxes of the HTML panels over the canvas (canvas coords), refreshed 5× a second
  const now = performance.now(); if (KM.pnl && now - KM.pnlT < 200) return KM.pnl; KM.pnlT = now;
  const cv = document.getElementById('kmCanvas'), root = document.getElementById('km'); if (!cv || !root) return (KM.pnl = []);
  const c = cv.getBoundingClientRect(), out = [];
  root.querySelectorAll('.km-top,.km-side,.km-ask,.km-tip:not([hidden]),.km-an:not([hidden])').forEach(el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (r.width < 4 || r.height < 4 || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .2) return;
    out.push([r.left - c.left - 6, r.top - c.top - 4, r.width + 12, r.height + 8]); });
  return (KM.pnl = out); }
function kmOverPanel(x, y, w, h){ for (const b of kmPanels()) if (x < b[0]+b[2] && x+w > b[0] && y < b[1]+b[3] && y+h > b[1]) return true; return false; }
function kmLabelFree(x, y, w, h){ // simple collision check so zoomed-in labels never pile up
  const L = KM.labs || (KM.labs = []); for (const b of L) if (x < b[0]+b[2] && x+w > b[0] && y < b[1]+b[3] && y+h > b[1]) return false; L.push([x, y, w, h]); return true; }
function kmDock(on){ // panels tuck away while you explore and come back from the centre button
  const root = document.getElementById('km'); if (!root || KM.view!=='graph') return; if (root.classList.contains('undocked') === !on) return;
  root.classList.toggle('undocked', !on); }
function kmZoomAt(f, mx, my){ // zoom towards the cursor: the point under it stays put
  const O = KM.orb || { cx:KM.W/2, cy:KM.H/2 }, c = KM.camT || { ...KM.cam }, z = clamp(c.z*f, .4, 24), k = z/c.z;
  KM.camT = { x: mx - O.cx - (mx - O.cx - c.x)*k, y: my - O.cy - (my - O.cy - c.y)*k, z }; kmKick(); }
function kmWrap(a){ const P = Math.PI*2; return ((a + Math.PI) % P + P) % P - Math.PI; } // full 360° turns in both directions
function kmCamTo(x, y, z, d=700, raw, tilt){ KM.tween = { t0:performance.now(), d: motionOff() ? 1 : d, x0:KM.cam.x, y0:KM.cam.y, z0:KM.cam.z, x1:x, y1:y, z1:clamp(z,.4,24) }; if (tilt!==undefined){ KM.vt = 0; KM.tween.t0v = KM.tilt; KM.tween.t1 = tilt + Math.PI*2*Math.round((KM.tilt - tilt)/(Math.PI*2)); } }
function kmCenterOn(n, z){ const z1 = clamp(z,.4,24), f = z1/KM.cam.z, O = KM.orb || { cx:KM.W/2, cy:KM.H/2 }; const ox = n.sx - (O.cx + KM.cam.x), oy = n.sy - (O.cy + KM.cam.y); kmCamTo(-ox*f, -oy*f, z1); }

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
  const c = t => KM.nodes.filter(n=>n.type===t).length, weak = KM.nodes.filter(n=>n.type==='topic' && kmMastery(n.topic) < 50).length, done = KM.nodes.filter(n=>n.type==='task' && taskDone(dkey(), n.task.id)).length;
  return `<div class="km-legh">Your universe</div>${[['sun','Sun','you','1'],['star','Stars','big areas', c('domain')],['planet','Planets','today\'s tasks', `${done}/${c('task')}`],['moon','Moons','topics you know', c('topic') - weak],['rock','Asteroids','need more training', weak],['hole','Black holes','mistakes to avoid', c('hole')],['sat','Satellites','coming up today', c('sat')],['neb','Nebulae','big goals', c('neb')],['pulsar','Pulsar','your streak', currentStreak()+'d'],['sneb','Star nebulae','study time', Math.round(kmStudyAvg()*100)+'%']].map(([k,l,d,n])=>`<div class="km-li"><i class="km-dot ${k}"></i><span class="km-cnt num">${n}</span>${l}<small>${d}</small></div>`).join('')}
    <div class="km-li tiny-note">Tap anything to read it. Tap a planet to tick the task off.</div>`;
}
const KM_ICONS = {
  radial:'<circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="6" r="1.8"/><circle cx="19" cy="6" r="1.8"/><circle cx="5" cy="18" r="1.8"/><circle cx="19" cy="18" r="1.8"/><path d="M10 10.5 6.4 7.2M14 10.5l3.6-3.3M10 13.5l-3.6 3.3M14 13.5l3.6 3.3"/>',
  tree:'<circle cx="12" cy="5" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M12 7v4M12 11H6v5M12 11h6v5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>', filter:'<path d="M4 5h16l-6 8v5l-4 2v-7z"/>', label:'<path d="M4 7h11l5 5-5 5H4z"/><circle cx="8" cy="12" r="1.2"/>', fit:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h10"/>', hand:'<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7-2.5 0-4-1.2-5.5-3.5L3.8 13.6a1.4 1.4 0 0 1 2.3-1.6L8 14"/>', orbit:'<circle cx="12" cy="12" r="2.5"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-25 12 12)"/><path d="M19 5l1.5-1.5M20 8h2"/>', back:'<path d="M15 5l-7 7 7 7"/>', x:'<path d="M6 6l12 12M18 6 6 18"/>', send:'<path d="M5 12h12M12 6l6 6-6 6"/>', spark:'<path d="M4 18 9 12l3 3 7-8M15 7h4v4"/>', search:'<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>', agent:'<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 12h6M12 9v6"/>', hist:'<circle cx="12" cy="12" r="7"/><path d="M12 8v4l3 2"/>'
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
  return `<div class="km" id="km" role="dialog" aria-modal="true" aria-label="Orbit, your growth galaxy">
    <canvas id="kmCanvas" aria-label="Network of everything you are learning. Drag or use the arrow keys to spin it all the way round, scroll to zoom, tap a node."></canvas>
    <div class="km-vign" aria-hidden="true"></div>
    <header class="km-top">
      <div class="km-brand"><button class="km-ib" data-a="km-back" aria-label="Close the map">${kmi('menu',18)}</button><span class="km-logo">${ic('gears',18)}</span><div><b>Orbit</b><small>${esc(typeof displayName==='function' ? displayName() : 'KsHan')}'s growth galaxy</small></div></div>
      <div class="km-tools" role="toolbar" aria-label="Map tools">
        <span class="km-grp" role="radiogroup" aria-label="Drag mode"><button data-a="km-mode" data-id="move" class="${KM.mode!=='rotate'?'on':''}" role="radio" aria-checked="${KM.mode!=='rotate'}" aria-label="Drag to move" title="Drag to move (pan)">${kmi('hand')}</button><button data-a="km-mode" data-id="rotate" class="${KM.mode==='rotate'?'on':''}" role="radio" aria-checked="${KM.mode==='rotate'}" aria-label="Drag to spin" title="Drag to spin 360°">${kmi('orbit')}</button></span>
        <span class="km-grp"><button data-a="km-layout" data-id="radial" class="${KM.layout==='radial'?'on':''}" aria-label="Network view">${kmi('radial')}</button><button data-a="km-layout" data-id="tree" class="${KM.layout==='tree'?'on':''}" aria-label="Tree view">${kmi('tree')}</button></span>
        <span class="km-grp"><button data-a="km-zoom" data-id="1" aria-label="Zoom in">${kmi('plus')}</button><button class="km-zr num" id="kmZr" data-a="km-z1" aria-label="Zoom 1×. Tap to reset">1×</button><button data-a="km-zoom" data-id="-1" aria-label="Zoom out">${kmi('minus')}</button></span>
        <span class="km-grp"><button data-a="km-gaps" class="${KM.gaps?'on':''}" aria-label="Show gaps only">${kmi('filter')}</button></span>
        <span class="km-grp"><button data-a="km-labels" class="${KM.labels?'on':''}" aria-label="Show labels">${kmi('label')}</button></span>
        <span class="km-grp"><button data-a="km-fit" aria-label="Fit to screen">${kmi('fit')}</button></span>
      </div>
      <div class="km-right"><button class="km-ai2" data-a="km-chat" aria-label="Ask AI about the map"><span class="cfab-orb sm" aria-hidden="true"><i></i></span><span>Ask AI</span></button><button class="km-ib km-mic" data-a="km-voice" aria-label="Ask by voice">${ic('mic',17)}</button><button class="km-new" data-a="km-plan">${kmi('plus',15)} New study plan</button><button class="km-ib" data-a="km-search" aria-label="Search">${kmi('search',17)}</button><span class="km-av">KS</span><button class="km-ib" data-a="km-close" aria-label="Back to the app">${kmi('x',17)}</button></div>
    </header>
    <div class="km-title" aria-hidden="true"><small>Personal growth project</small><h1>${esc(typeof displayName==='function' ? displayName() : 'KsHan')}</h1><span class="num">Day ${typeof planDay==='function'?planDay():1} of 365 · ${currentStreak()}-day streak</span></div>
    <span class="km-hint" aria-hidden="true">Drag to move · pinch or scroll to zoom · tap anything</span>
    ${kmSidesHTML()}
    <button class="km-dockbtn" data-a="km-dock" aria-label="Show the panels again"><span class="km-dockg" aria-hidden="true"><i></i><i></i><i></i></span><span>Panels</span></button>
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
  if (n.type==='task'){ const done = taskDone(dkey(), n.task.id); tip.innerHTML = `<small>Planet · today's task</small><b>${esc(n.name)}</b><div class="km-tipr"><span>${esc(n.task.meta||'')}</span><span>${done?'Done':'To do'}</span></div><button class="km-open" data-a="km-task" data-id="${esc(n.task.id)}">${done?'Mark as not done':'Mark as done'} ${kmi('send',14)}</button>`; tip.hidden = false; return; }
  if (n.type==='sat'){ const b = n.block; tip.innerHTML = `<small class="sat">Satellite · coming up today</small><b>${esc(b.name)}</b><div class="km-tipr"><span>${esc(b.t)} · ${b.dur} min</span><span>${esc(b.cat)}</span></div><p class="km-tipp">${esc(b.note||'')}</p>`; tip.hidden = false; return; }
  if (n.type==='neb'){ tip.innerHTML = `<small>Nebula · big goal</small><b>${esc(n.name)}</b><div class="km-tipr"><span>${esc(n.desc)}</span><span>${Math.round(n.prog*100)}%</span></div><div class="km-npb" style="margin-top:4px"><i style="width:${Math.round(n.prog*100)}%;background:rgb(${n.col})"></i></div>`; tip.hidden = false; return; }
  if (n.type==='pulsar'){ const st = currentStreak(); tip.innerHTML = `<small>Pulsar · your streak</small><b>${st} day${st===1?'':'s'} in a row</b><p class="km-tipp">It spins faster the longer the streak runs. Four tasks a day keeps it going.</p>`; tip.hidden = false; return; }
  if (n.type==='const'){ const d = KM.days14 || [], good = d.filter(x=>x.n >= 4).length; tip.innerHTML = `<small>Constellation · last 14 days</small><b>${good} streak day${good===1?'':'s'} of 14</b><p class="km-tipp">Each star is a day. Bright stars are days with four or more tasks done; lines join days in a row.</p>`; tip.hidden = false; return; }
  if (n.type==='hole'){ tip.innerHTML = `<small class="hole">Black hole · mistake to avoid</small><b>${esc(n.name)}</b><p class="km-tipp">${esc(n.hole.tip)}</p>`; tip.hidden = false; return; }
  const t = n.type==='topic' ? n.topic : n.parent && n.parent.type==='topic' ? n.parent.topic : null, d = n.dom || (n.parent && n.parent.dom);
  if (n.type==='domain'){ const ts = n.dom.topics, m = Math.round(ts.reduce((a,x)=>a+kmMastery(x),0)/ts.length);
    tip.innerHTML = `<small>Domain · ${n.w}% of your plan</small><b>${esc(n.name)}</b><div class="km-tipr"><span>${ts.length} topics</span><span>${m}% mastered</span></div><div class="km-tipl">${ts.map(x=>`<button data-a="km-topic" data-id="${esc(x.n)}">${esc(x.n)}<span>${kmMastery(x)}%</span></button>`).join('')}</div>`;
  } else if (t){ const m = kmMastery(t);
    tip.innerHTML = `<small>${m < 50 ? 'Asteroid · needs more training · ' : 'Moon · '}${esc(d.name)}${t.plan?' · coming next':''}</small><b>${esc(t.n)}</b><div class="km-tipr"><span>Mastery ${m}%</span><span>${kmItems(t)[2].list.length} practice questions</span></div><button class="km-open" data-a="km-topic" data-id="${esc(t.n)}">Open topic ${kmi('send',14)}</button>`;
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
  KM.labels = window.innerWidth >= 760; KM.yaw = KM.yawT = -.5; KM.tilt = KM.tiltT = .2; KM.vy = KM.vt = 0; KM.tA = 0; KM.neb = null; KM.freeze = false; KM.layout = 'radial'; KM.dust = null;
  document.body.insertAdjacentHTML('beforeend', kmShellHTML());
  KM.labels = window.innerWidth >= 760;
  document.body.classList.add('km-open'); KM.open = true; KM.view = 'graph'; KM.sel = null; KM.focus = null; KM.cam = { x:0, y:0, z:1 }; KM.camT = { x:0, y:0, z:1 }; KM.st = 0; KM.stOff = undefined; KM.lastNow = 0; KM.pulses = []; KM.fx = { shoot:[], nova:[], nextShoot:0, nextNova:0 };
  const cv = document.getElementById('kmCanvas');
  KM.W = cv.clientWidth; KM.H = cv.clientHeight; kmBuild(); kmStudyScores(); kmResize(); kmWave();
  document.querySelector('.km-legend').innerHTML = kmLegend();
  KM.t0 = performance.now() - (motionOff() ? 10000 : 0);
  // fly-in: start high and far, sweep down to the low cinematic angle
  if (motionOff()){ KM.tilt = KM.tiltT = 1.0; } else { KM.cam = { x:0, y:0, z:.42 }; KM.camT = null; kmCamTo(0, 0, 1, 3000, true, 1.0); KM.tween.io = true; KM.yawT = KM.yaw = -1.4; KM.vy = 0; }
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
  cv.addEventListener('pointerdown', e=>{ KM.ptr.set(e.pointerId, { x:e.clientX, y:e.clientY }); cv.setPointerCapture(e.pointerId); if (KM.ptr.size===1) KM.drag = { x:e.clientX, y:e.clientY, moved:0, btn:e.button }; else KM.drag = null; KM.tween = null; KM.vy = KM.vt = 0; KM.pv = null; });
  cv.addEventListener('contextmenu', e=>e.preventDefault());
  cv.addEventListener('pointermove', e=>{
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (KM.ptr.has(e.pointerId)){
      const prev = KM.ptr.get(e.pointerId); KM.ptr.set(e.pointerId, { x:e.clientX, y:e.clientY });
      if (KM.ptr.size===2){ const [a,b] = [...KM.ptr.values()], o = [...KM.ptr.entries()].find(([id])=>id!==e.pointerId)[1]; const d0 = Math.hypot(prev.x-o.x, prev.y-o.y), d1 = Math.hypot(a.x-b.x, a.y-b.y); const r = cv.getBoundingClientRect(); KM.tween = null; if (d0 > 0) kmZoomAt(d1/d0, (a.x+b.x)/2 - r.left, (a.y+b.y)/2 - r.top); kmDock(false); return; }
      if (KM.drag){ const dx = e.clientX-prev.x, dy = e.clientY-prev.y, rot = (KM.mode==='rotate') !== !!(e.shiftKey || KM.drag.btn===2);
        if (!rot){ if (!KM.camT) KM.camT = { ...KM.cam }; KM.camT.x += dx; KM.camT.y += dy; KM.pv = { x:(KM.pv ? KM.pv.x*.5 : 0) + dx*.5, y:(KM.pv ? KM.pv.y*.5 : 0) + dy*.5 }; KM.vy = KM.vt = 0; } else { KM.yawT += dx*.007; KM.vy = KM.vy*.5 + dx*.0016; KM.tiltT = kmWrap(KM.tiltT - dy*.007); KM.vt = (KM.vt||0)*.5 - dy*.0016; } KM.drag.moved += Math.abs(dx)+Math.abs(dy); if (KM.drag.moved > 18) kmDock(false); }
      return;
    }
    const h = kmHit(x,y); if (h !== KM.hover){ KM.hover = h; cv.style.cursor = h ? 'pointer' : 'grab'; }
  });
  const up = e=>{
    const was = KM.drag; KM.ptr.delete(e.pointerId); if (KM.ptr.size===0) KM.drag = null;
    if (was && was.moved < 6 && e.type==='pointerup'){ const r = cv.getBoundingClientRect(), n = kmHit(e.clientX-r.left, e.clientY-r.top); if (KM.fx){ (KM.fx.rip = KM.fx.rip || []).push({ x:e.clientX-r.left, y:e.clientY-r.top, t0:performance.now() }); }
      if (!n){ KM.sel = null; KM.freeze = false; kmTip(null); return; }
      if (n.type==='topic' && KM.sel===n){ kmFocus(n.topic); return; }
      KM.sel = n; KM.freeze = n.type!=='core'; kmTip(n); if (n.type!=='core') kmCenterOn(n, Math.max(KM.cam.z, n.type==='domain' ? 1.5 : 1.9)); else kmCamTo(0,0,1,700,true);
    }
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e=>{ e.preventDefault(); KM.tween = null; const r = cv.getBoundingClientRect(); kmZoomAt(Math.exp(-e.deltaY*.0011), e.clientX - r.left, e.clientY - r.top); kmDock(false); }, { passive:false });
  document.getElementById('kmForm').addEventListener('submit', e=>{ e.preventDefault(); const q = document.getElementById('kmQ').value.trim(); if (KM.view!=='graph'){ const hit = kmMatch(q); if (hit){ kmUnfocus(); setTimeout(()=>kmFocus(hit), 300); } else { kmUnfocus(); setTimeout(()=>kmAnalyse(q), 300); } return; } kmAnalyse(q); });
  root.addEventListener('click', e=>{ const el = e.target.closest('[data-a]'); if (!el || !root.contains(el)) return; kmAction(el.dataset.a, el); e.stopPropagation(); });
  window.addEventListener('resize', kmResize);
}
function kmAction(a, el){
  if (a==='km-task'){ const id = el.dataset.id, k = dkey(), now = !taskDone(k, id); setTask(k, id, now); const n = KM.nodes.find(x=>x.id==='task:'+id); if (n) kmTip(n);
    const leg = document.querySelector('.km-legend'); if (leg) leg.innerHTML = kmLegend(); toast(now ? `${n ? n.name : 'Task'} done · ${countDone(k)}/${tasksForDay(k).length}` : 'Marked as not done', 'ok', 1600); try { if (typeof renderView==='function') renderView(activeTab); updateChrome(); } catch(e){} return; }
  if (a==='km-dock'){ kmDock(true); return; }
  if (a==='km-mode'){ KM.mode = el.dataset.id; document.querySelectorAll('[data-a="km-mode"]').forEach(b=>{ const on = b===el; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }); KM.vy = KM.vt = 0; const h = document.querySelector('.km-hint'); if (h) h.textContent = KM.mode==='rotate' ? 'Drag to spin 360° · pinch or scroll to zoom · tap anything' : 'Drag to move · pinch or scroll to zoom · tap anything'; toast(KM.mode==='rotate' ? 'Drag now spins the galaxy.' : 'Drag now moves around. Right-drag or Shift-drag still spins.', 'ok', 1800); return; }
  if (a==='km-chat' || a==='km-voice'){ aiOpen('chat'); if (a==='km-voice' && typeof aiListen==='function') aiListen(); return; }
  if (a==='km-close') kmClose();
  else if (a==='km-back'){ if (KM.view!=='graph') kmUnfocus(); else kmClose(); }
  else if (a==='km-unfocus') kmUnfocus();
  else if (a==='km-z1'){ kmCamTo(KM.cam.x/KM.cam.z, KM.cam.y/KM.cam.z, 1, 420); }
  else if (a==='km-zoom'){ { const f = +el.dataset.id > 0 ? 1.35 : 1/1.35, z = clamp(KM.cam.z*f,.4,24), k = z/KM.cam.z; kmCamTo(KM.cam.x*k, KM.cam.y*k, z, 420); } }
  else if (a==='km-fit'){ KM.sel = null; kmTip(null); KM.freeze = false; kmCamTo(0,0,1,900,true,1.0); KM.tween.io = true; KM.camT = null; }
  else if (a==='km-layout'){ KM.layout = el.dataset.id; document.querySelectorAll('[data-a="km-layout"]').forEach(b=>b.classList.toggle('on', b===el)); kmCamTo(KM.cam.x, KM.cam.y, KM.cam.z, 900, true, KM.layout==='tree' ? .06 : 1.0); }
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
document.addEventListener('keydown', e=>{ if (KM.open && KM.view==='graph' && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))){ const k = { ArrowLeft:[-.12,0], ArrowRight:[.12,0], ArrowUp:[0,-.12], ArrowDown:[0,.12] }[e.key]; if (k && KM.mode!=='rotate'){ e.preventDefault(); if (!KM.camT) KM.camT = { ...KM.cam }; KM.camT.x -= k[0]*400; KM.camT.y -= k[1]*400; kmKick(); return; } if (k){ e.preventDefault(); KM.yawT += k[0]; KM.tiltT = kmWrap(KM.tiltT + k[1]); kmKick(); return; } }
  if (e.key==='Escape' && KM.open){ if (KM.view!=='graph') kmUnfocus(); else kmClose(); } });
window.addEventListener('hashchange', ()=>{ if (location.hash==='#map') kmOpen(); else if (KM.open) kmClose(); });
function kmLauncherHTML(){
  return `<button class="km-launch" data-a="km-open"><span class="km-lorb" aria-hidden="true"></span><span class="km-lt"><b>Orbit</b><small>Everything you are growing, circling you. Tap a star to dive in.</small></span><span class="km-lgo">${kmi('send',16)}</span></button>`;
}
