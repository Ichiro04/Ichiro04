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
const KM = { open:false, view:'graph', layout:'radial', t0:0, nodes:[], edges:[], cam:{ x:0, y:0, z:1 }, tween:null, sel:null, hover:null,
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
  const W = KM.W || 1200, H = KM.H || 800, asp = W/H;
  const ex = clamp(asp*.62, .5, 1.25)*560, ey = clamp(.62/asp*1.3, .62, 1.15)*360;
  const cols = KM_DOMAINS.length;
  KM.nodes.forEach(n=>{
    let rx = 0, ry = 0, tx = 0, ty = 0;
    if (n.type==='domain'){ rx = Math.cos(n.a)*ex*n.R; ry = Math.sin(n.a)*ey*n.R; const i = KM_DOMAINS.indexOf(n.dom); tx = (i - (cols-1)/2) * (ex*2/cols); ty = -ey*.35; }
    else if (n.type==='topic'){ const p = n.parent, pr = kmPos(p,'r'); const f = n.inner ? -.6 : 1; rx = pr[0] + Math.cos(n.ta)*ex*n.tr*f; ry = pr[1] + Math.sin(n.ta)*ey*n.tr*f; const j = n.dom.topics.indexOf(n.topic), pt = kmPos(p,'t'); tx = pt[0] + (j%2 ? 18 : -18); ty = pt[1] + 70 + j*58; }
    else if (n.type==='practice' || n.type==='skill'){ const p = n.parent, pr = kmPos(p,'r'), pt = kmPos(p,'t'); rx = pr[0] + Math.cos(n.ta)*ex*n.tr; ry = pr[1] + Math.sin(n.ta)*ey*n.tr; tx = pt[0] + (n.type==='practice' ? 30 : -30); ty = pt[1] + (p.type==='domain' ? (n.type==='practice' ? -44 : -64) : 14); }
    n.rx = rx; n.ry = ry; n.tx = tx; n.ty = ty;
    if (snap || n.x===undefined){ n.x = KM.layout==='tree' ? tx : rx; n.y = KM.layout==='tree' ? ty : ry; }
  });
  const pts = KM.nodes.filter(n=>n.rx!==undefined), xs = pts.map(n=>n.rx), ys = pts.map(n=>n.ry);
  const bw = Math.max(...xs) - Math.min(...xs) + (W < 760 ? 120 : 300), bh = Math.max(...ys) - Math.min(...ys) + 90, top = W < 760 ? 120 : 80, bot = W < 760 ? 200 : 60;
  KM.base = Math.max(W < 760 ? .38 : .5, Math.min(W/bw, (H-top-bot)/bh));
  KM.cx0 = (Math.max(...xs) + Math.min(...xs))/2 + (W < 760 ? 30 : 70); KM.cy0 = (Math.max(...ys) + Math.min(...ys))/2;
}
function kmPos(n, which){ return n.type==='core' ? [0,0] : which==='t' ? [n.tx, n.ty] : [n.rx, n.ry]; }
function kmIntroAt(n){ if (n.type==='core') return 0; const d = Math.hypot(n.rx, n.ry); return .95 + d/760*1.25 + ((n.ph*37)%1)*.18; }

const KM_COL = {
  core:['#FFF3D6','#E2AE63','#7C4A1C'], domain:['#FFE3EC','#E58AA6','#8E3456'], topic:['#E6E0FF','#9C8BF0','#4A3BA8'],
  practice:['#D9FFF0','#56CF9C','#1C6B4E'], skill:['#FFE7C2','#E0A050','#7A4A14']
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
  const w = g.measureText(txt).width + 10; g.fillStyle = 'rgba(16,24,26,.86)'; g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1;
  g.beginPath(); g.roundRect ? g.roundRect(x, y-8, w, 16, 5) : g.rect(x, y-8, w, 16); g.fill(); g.stroke();
  g.fillStyle = '#E8EFEE'; g.fillText(txt, x+5, y+3.6); g.globalAlpha = 1;
}
function kmDraw(now){
  const cv = document.getElementById('kmCanvas'); if (!cv) return;
  const g = cv.getContext('2d'), W = KM.W, H = KM.H;
  g.setTransform(KM.dpr,0,0,KM.dpr,0,0); g.clearRect(0,0,W,H);
  const T = (now - KM.t0)/1000, still = motionOff();
  // camera tween
  if (KM.tween){ const k = Math.min(1,(now-KM.tween.t0)/KM.tween.d), e = 1-Math.pow(1-k,3); KM.cam.x = KM.tween.x0+(KM.tween.x1-KM.tween.x0)*e; KM.cam.y = KM.tween.y0+(KM.tween.y1-KM.tween.y0)*e; KM.cam.z = KM.tween.z0+(KM.tween.z1-KM.tween.z0)*e; if (k>=1) KM.tween = null; }
  // layout tween toward radial or tree positions
  KM.nodes.forEach(n=>{ const p = kmPos(n, KM.layout==='tree' ? 't' : 'r'); n.x += (p[0]-n.x)*(still ? 1 : .12); n.y += (p[1]-n.y)*(still ? 1 : .12); });
  const s = KM.base*KM.cam.z, ox = W/2 - (KM.cam.x + (KM.cx0||0))*s, oy = H/2 - (KM.cam.y + (KM.cy0||0))*s + (W<760 ? -30 : -10);
  const drift = n => still ? [0,0] : [Math.sin(T*.35 + n.ph)*2.2, Math.cos(T*.3 + n.ph*1.3)*2.2];
  const P = n => { const d = drift(n); return [ox + (n.x + d[0])*s, oy + (n.y + d[1])*s]; };
  const vis = n => still ? 1 : clamp((T - kmIntroAt(n))/.35, 0, 1);
  const fade = KM.view==='leaving' ? clamp(1 - (now - KM.leaveT0)/600, 0, 1) : 1;
  const conn = KM.sel ? new Set([KM.sel, ...KM.edges.filter(e=>e.a===KM.sel||e.b===KM.sel).flatMap(e=>[e.a,e.b])]) : null;
  const dim = n => { let a = fade; if (conn && !conn.has(n)) a *= .22; if (KM.gaps && n.type==='topic' && kmMastery(n.topic) >= 100) a *= .25; return a; };
  const core = KM.nodes[0], C = P(core);
  // ---- intro: gold dust, ignition flash, blue streaks
  if (!still && T < 1.4){
    g.globalCompositeOperation = 'lighter';
    const k = clamp(T/1, 0, 1);
    for (let i=0;i<180;i++){ const a = i*2.399 + T*1.8, rr = (60*(1-k) + 8) * (0.4 + ((i*13)%10)/10) * (1 + .3*Math.sin(i+T*3)); g.fillStyle = `rgba(255,${190+(i%40)},${110+(i%60)},${(.55*(1-clamp((T-.9)/.5,0,1))).toFixed(2)})`; g.fillRect(C[0]+Math.cos(a)*rr*s*1.6, C[1]+Math.sin(a)*rr*s*1.6, 1.6, 1.6); }
    if (T > .7){ const f = 1 - clamp((T-.7)/.7, 0, 1), rr = (40 + 140*(1-f))*s*1.4; const gr = g.createRadialGradient(C[0],C[1],0,C[0],C[1],rr); gr.addColorStop(0,`rgba(255,250,230,${(.9*f).toFixed(2)})`); gr.addColorStop(.35,`rgba(120,200,255,${(.5*f).toFixed(2)})`); gr.addColorStop(1,'rgba(80,160,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(C[0],C[1],rr,0,7); g.fill(); }
    g.globalCompositeOperation = 'source-over';
  }
  if (!still){
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    KM.nodes.forEach(n=>{ if (n.type==='core') return; const at = kmIntroAt(n), k = (T - (at - .5))/.5; if (k <= 0 || k >= 1.25) return; const p = P(n), e = 1-Math.pow(1-clamp(k,0,1),3), t0 = Math.max(0, e - .28);
      const hx = C[0] + (p[0]-C[0])*e, hy = C[1] + (p[1]-C[1])*e, tx = C[0] + (p[0]-C[0])*t0, ty = C[1] + (p[1]-C[1])*t0, al = k > 1 ? 1 - (k-1)/.25 : 1;
      const gr = g.createLinearGradient(tx,ty,hx,hy); gr.addColorStop(0,'rgba(90,170,255,0)'); gr.addColorStop(1,`rgba(140,210,255,${(.95*al).toFixed(2)})`);
      g.strokeStyle = gr; g.lineWidth = n.type==='domain' ? 2.6 : 1.6; g.beginPath(); g.moveTo(tx,ty); g.lineTo(hx,hy); g.stroke();
      g.fillStyle = `rgba(200,235,255,${al.toFixed(2)})`; g.beginPath(); g.arc(hx,hy,n.type==='domain'?3.4:2,0,7); g.fill(); });
    g.globalCompositeOperation = 'source-over';
  }
  // ---- edges
  KM.edges.forEach(e=>{
    const va = Math.min(vis(e.a), vis(e.b)); if (va <= 0) return;
    const a = P(e.a), b = P(e.b), al = Math.min(dim(e.a), dim(e.b)) * va, hot = KM.sel && (e.a===KM.sel || e.b===KM.sel);
    if (e.k==='beam'){
      const dx = b[0]-a[0], dy = b[1]-a[1], L = Math.hypot(dx,dy)||1, nx = -dy/L, ny = dx/L, w0 = 11*Math.min(1.4,s*1.6), w1 = 1.4;
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = al;
      const gr = g.createLinearGradient(a[0],a[1],b[0],b[1]); gr.addColorStop(0,'rgba(255,214,150,.55)'); gr.addColorStop(.6,'rgba(232,170,110,.22)'); gr.addColorStop(1,'rgba(232,170,110,.08)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(a[0]+nx*w0, a[1]+ny*w0); g.lineTo(b[0]+nx*w1, b[1]+ny*w1); g.lineTo(b[0]-nx*w1, b[1]-ny*w1); g.lineTo(a[0]-nx*w0, a[1]-ny*w0); g.closePath(); g.fill();
      g.strokeStyle = hot ? 'rgba(255,240,210,.95)' : 'rgba(255,226,180,.7)'; g.lineWidth = hot ? 1.8 : 1.1; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke();
      const ux = dx/L, uy = dy/L, tipx = b[0] - ux*(e.b.r*s*1.4+9), tipy = b[1] - uy*(e.b.r*s*1.4+9);
      g.fillStyle = 'rgba(255,230,190,.85)'; g.beginPath(); g.moveTo(tipx+ux*7, tipy+uy*7); g.lineTo(tipx+nx*3.5, tipy+ny*3.5); g.lineTo(tipx-nx*3.5, tipy-ny*3.5); g.closePath(); g.fill();
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    } else {
      g.globalAlpha = al; g.lineWidth = e.k==='teal' ? 1.1 : .9;
      g.strokeStyle = e.k==='teal' ? 'rgba(111,211,199,.6)' : e.k==='thin' ? 'rgba(232,215,225,.42)' : 'rgba(220,230,228,.32)';
      if (e.k==='dot') g.setLineDash([2,3]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    }
  });
  // ---- light pulses travelling out along the beams
  if (!still && T > 2.4 && KM.view==='graph'){
    if (now - KM.lastPulse > 260){ KM.lastPulse = now; const beams = KM.edges.filter(e=>e.k==='beam'||e.k==='teal'); KM.pulses.push({ e:beams[Math.floor(Math.random()*beams.length)], t0:now, d:1400 + Math.random()*900 }); }
    g.globalCompositeOperation = 'lighter';
    KM.pulses = KM.pulses.filter(p=>now - p.t0 < p.d);
    KM.pulses.forEach(p=>{ const k = (now - p.t0)/p.d, a = P(p.e.a), b = P(p.e.b), x = a[0]+(b[0]-a[0])*k, y = a[1]+(b[1]-a[1])*k, al = Math.sin(k*Math.PI)*fade;
      const gr = g.createRadialGradient(x,y,0,x,y,9); gr.addColorStop(0,`rgba(255,248,225,${al.toFixed(2)})`); gr.addColorStop(1,'rgba(255,210,150,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x,y,9,0,7); g.fill(); });
    g.globalCompositeOperation = 'source-over';
  }
  // ---- nodes
  const order = ['practice','skill','topic','domain','core'];
  order.forEach(type=>KM.nodes.filter(n=>n.type===type).forEach(n=>{
    const v = vis(n); if (v <= 0) return;
    const p = P(n), pop = still ? 1 : (v < 1 ? .6 + .55*Math.sin(v*Math.PI*.82) : 1), a = dim(n) * Math.min(1, v*1.4);
    const rr = n.r * Math.max(.8, Math.min(1.6, s*1.35)) * pop * (KM.hover===n ? 1.18 : 1);
    if (!still){ const k = (T - kmIntroAt(n))/.6; if (k > 0 && k < 1){ g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(p[0],p[1],0,p[0],p[1],rr*5); gr.addColorStop(0,`rgba(150,215,255,${(.8*(1-k)).toFixed(2)})`); gr.addColorStop(1,'rgba(150,215,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(p[0],p[1],rr*5,0,7); g.fill(); g.globalCompositeOperation = 'source-over'; } }
    if (n.type==='core'){
      g.save(); g.translate(p[0],p[1]); g.rotate(still ? 0 : T*.08); g.globalAlpha = a;
      for (let i=0;i<120;i++){ const an = i/120*Math.PI*2, l = rr+3 + ((i*7)%9) + (still ? 0 : Math.sin(T*2+i)*1.5); g.strokeStyle = i%3 ? 'rgba(232,180,110,.75)' : 'rgba(255,236,200,.9)'; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.cos(an)*(rr+1), Math.sin(an)*(rr+1)); g.lineTo(Math.cos(an)*l, Math.sin(an)*l); g.stroke(); }
      g.restore();
      kmSphere(g, p[0], p[1], rr, KM_COL.core, a, 4.2);
      g.globalAlpha = a; g.strokeStyle = 'rgba(255,230,190,.35)'; g.setLineDash([1.5,3]); g.beginPath(); g.arc(p[0],p[1],rr+18,0,7); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    } else kmSphere(g, p[0], p[1], rr, KM_COL[n.type], a, n.type==='domain' ? 3 : n.type==='topic' ? 2.2 : 2.6);
    if (n.spark && !still){ const tw = .5 + .5*Math.sin(T*2.4 + n.ph*3); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(p[0],p[1],0,p[0],p[1],rr*6); gr.addColorStop(0,`rgba(255,255,230,${(.9*tw*a).toFixed(2)})`); gr.addColorStop(1,'rgba(255,255,200,0)'); g.fillStyle = gr; g.beginPath(); g.arc(p[0],p[1],rr*6,0,7); g.fill(); g.globalCompositeOperation = 'source-over'; }
    // labels
    g.textBaseline = 'alphabetic';
    if (n.type==='core' || n.type==='domain'){
      const lab = n.type==='core' ? n.name : n.name, pct = n.type==='core' ? kmOverall() + '%' : n.w + '%';
      g.globalAlpha = a; g.font = `${n.type==='core'?650:600} ${n.type==='core'?15:13}px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif`;
      g.fillStyle = '#F2F6F5'; g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 6;
      const short = W < 760 && lab.length > 14 ? lab.slice(0,13).trimEnd()+'…' : lab;
      g.fillText(short, p[0] + rr + 12, p[1] + 2); g.shadowBlur = 0; kmChip(g, p[0] + rr + 12, p[1] + 16, pct, a*.95);
    } else if ((n.type==='practice' || n.type==='skill') && KM.labels){ kmChip(g, p[0] + rr + 4, p[1] - 6, String(n.n), a*.9); }
    else if (n.type==='topic' && (KM.hover===n || KM.sel===n || (KM.labels && KM.cam.z > 1.45) || (conn && conn.has(n)))){
      g.globalAlpha = a; g.font = '600 12px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; g.fillStyle = '#E9E4FF'; g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 6;
      g.fillText(n.name, p[0] + rr + 10, p[1] + 4); g.shadowBlur = 0; g.globalAlpha = 1;
    }
    n.sx = p[0]; n.sy = p[1]; n.sr = rr;
  }));
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
    <canvas id="kmCanvas" aria-label="Network of everything you are learning. Drag to move, scroll to zoom, tap a node."></canvas>
    <div class="km-vign" aria-hidden="true"></div>
    <header class="km-top">
      <div class="km-brand"><button class="km-ib" data-a="km-back" aria-label="Close the map">${kmi('menu',18)}</button><span class="km-logo">${ic('gears',18)}</span><div><b>Knowledge map</b><small>Kyaw's engineering plan</small></div></div>
      <div class="km-tools" role="toolbar" aria-label="Map tools">
        <span class="km-grp"><button data-a="km-layout" data-id="radial" class="${KM.layout==='radial'?'on':''}" aria-label="Network view">${kmi('radial')}</button><button data-a="km-layout" data-id="tree" class="${KM.layout==='tree'?'on':''}" aria-label="Tree view">${kmi('tree')}</button></span>
        <span class="km-grp"><button data-a="km-zoom" data-id="1" aria-label="Zoom in">${kmi('plus')}</button><button data-a="km-zoom" data-id="-1" aria-label="Zoom out">${kmi('minus')}</button></span>
        <span class="km-grp"><button data-a="km-gaps" class="${KM.gaps?'on':''}" aria-label="Show gaps only">${kmi('filter')}</button></span>
        <span class="km-grp"><button data-a="km-labels" class="${KM.labels?'on':''}" aria-label="Show labels">${kmi('label')}</button></span>
        <span class="km-grp"><button data-a="km-fit" aria-label="Fit to screen">${kmi('fit')}</button></span>
      </div>
      <div class="km-right"><button class="km-new" data-a="km-plan">${kmi('plus',15)} New study plan</button><button class="km-ib" data-a="km-search" aria-label="Search">${kmi('search',17)}</button><span class="km-av">KS</span><button class="km-ib" data-a="km-close" aria-label="Back to the app">${kmi('x',17)}</button></div>
    </header>
    <aside class="km-time" aria-label="Plan months"><canvas id="kmWave" aria-hidden="true"></canvas><div class="km-months">${kmTimeline()}</div></aside>
    <div class="km-legend glass-km">${kmLegend()}</div>
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
    const w = 2 + r()*5 + Math.min(16, v/8); g.fillStyle = v > 0 ? 'rgba(255,214,150,.75)' : 'rgba(200,215,212,.28)'; g.fillRect(0, y, w, 1.2); }
}

/* ---------- interaction ---------- */
function kmToWorld(x,y){ const s = KM.base*KM.cam.z; return [(x - KM.W/2)/s + KM.cam.x + (KM.cx0||0), (y - KM.H/2 - (KM.W<760?-30:-10))/s + KM.cam.y + (KM.cy0||0)]; }
function kmHit(x,y){ let best = null, bd = 1e9; KM.nodes.forEach(n=>{ if (n.sx===undefined) return; const d = Math.hypot(n.sx-x, n.sy-y); if (d < Math.max(14, n.sr+8) && d < bd){ bd = d; best = n; } }); return best; }
function kmCamTo(x, y, z, d=700, raw){ const x1 = raw ? x : x - (KM.cx0||0), y1 = raw ? y : y - (KM.cy0||0); KM.tween = { t0:performance.now(), d: motionOff() ? 1 : d, x0:KM.cam.x, y0:KM.cam.y, z0:KM.cam.z, x1, y1, z1:clamp(z,.5,4) }; }
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
  if (node && !motionOff()){ kmCamTo(node.x, node.y, 3.2, 650); KM.view = 'leaving'; KM.leaveT0 = performance.now(); document.getElementById('km').classList.add('leaving'); }
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
    const halo = g.createRadialGradient(cx,cy,r,cx,cy,r*3.2); halo.addColorStop(0,'rgba(120,110,230,.18)'); halo.addColorStop(1,'rgba(40,60,70,0)'); g.fillStyle = halo; g.beginPath(); g.arc(cx,cy,r*3.2,0,7); g.fill();
    g.save(); g.translate(cx,cy); g.rotate(T*.15);
    for (let i=0;i<220;i++){ const a = i/220*Math.PI*2, w = Math.sin(i*1.7)*.5+.5, l = r*1.12 + w*r*.38 + (T ? Math.sin(T*2+i*.4)*2 : 0); g.strokeStyle = i%4===0 ? 'rgba(111,211,199,.55)' : i%3 ? 'rgba(150,135,240,.6)' : 'rgba(225,215,255,.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.cos(a)*r*1.08, Math.sin(a)*r*1.08); g.lineTo(Math.cos(a)*l, Math.sin(a)*l); g.stroke(); }
    g.restore();
    kmSphere(g, cx, cy, r, KM_COL.topic, 1, 2.4);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(cx-r*.3, cy-r*.38, r*.28, r*.16, -.6, 0, 7); g.fill();
    if (!motionOff()) KM.orbRaf = requestAnimationFrame(draw);
  };
  KM.orbRaf = requestAnimationFrame(draw);
}
function kmUnfocus(){
  const root = document.getElementById('km'); root.classList.remove('focus');
  document.getElementById('kmFocus').hidden = true; document.getElementById('kmAsk').classList.remove('docked');
  cancelAnimationFrame(KM.orbRaf); KM.view = 'graph'; KM.focus = null;
  const n = KM.sel; if (n) kmCamTo(n.x, n.y, 1.5, 700); kmKick();
}

/* ---------- open / close ---------- */
function kmKick(){ if (!KM.raf) KM.raf = requestAnimationFrame(kmLoop); }
function kmOpen(){
  if (KM.open) return;
  KM.labels = window.innerWidth >= 760;
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
      if (KM.ptr.size===2){ const [a,b] = [...KM.ptr.values()], o = [...KM.ptr.entries()].find(([id])=>id!==e.pointerId)[1]; const d0 = Math.hypot(prev.x-o.x, prev.y-o.y), d1 = Math.hypot(a.x-b.x, a.y-b.y); if (d0 > 0) KM.cam.z = clamp(KM.cam.z*d1/d0, .5, 4); return; }
      if (KM.drag){ const s = KM.base*KM.cam.z; KM.cam.x -= (e.clientX-prev.x)/s; KM.cam.y -= (e.clientY-prev.y)/s; KM.drag.moved += Math.abs(e.clientX-prev.x)+Math.abs(e.clientY-prev.y); }
      return;
    }
    const h = kmHit(x,y); if (h !== KM.hover){ KM.hover = h; cv.style.cursor = h ? 'pointer' : 'grab'; }
  });
  const up = e=>{
    const was = KM.drag; KM.ptr.delete(e.pointerId); if (KM.ptr.size===0) KM.drag = null;
    if (was && was.moved < 6 && e.type==='pointerup'){ const r = cv.getBoundingClientRect(), n = kmHit(e.clientX-r.left, e.clientY-r.top);
      if (!n){ KM.sel = null; kmTip(null); return; }
      if (n.type==='topic' && KM.sel===n){ kmFocus(n.topic); return; }
      KM.sel = n; kmTip(n); if (n.type!=='core') kmCamTo(n.x, n.y, Math.max(KM.cam.z, n.type==='domain' ? 1.5 : 1.8)); else kmCamTo(0,0,1,700,true);
    }
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e=>{ e.preventDefault(); const r = cv.getBoundingClientRect(), x = e.clientX-r.left, y = e.clientY-r.top, w0 = kmToWorld(x,y); KM.tween = null; KM.cam.z = clamp(KM.cam.z * Math.exp(-e.deltaY*.0015), .5, 4); const w1 = kmToWorld(x,y); KM.cam.x += w0[0]-w1[0]; KM.cam.y += w0[1]-w1[1]; }, { passive:false });
  document.getElementById('kmForm').addEventListener('submit', e=>{ e.preventDefault(); const q = document.getElementById('kmQ').value.trim(); if (KM.view!=='graph'){ const hit = kmMatch(q); if (hit){ kmUnfocus(); setTimeout(()=>kmFocus(hit), 300); } else { kmUnfocus(); setTimeout(()=>kmAnalyse(q), 300); } return; } kmAnalyse(q); });
  root.addEventListener('click', e=>{ const el = e.target.closest('[data-a]'); if (!el || !root.contains(el)) return; kmAction(el.dataset.a, el); e.stopPropagation(); });
  window.addEventListener('resize', kmResize);
}
function kmAction(a, el){
  if (a==='km-close') kmClose();
  else if (a==='km-back'){ if (KM.view!=='graph') kmUnfocus(); else kmClose(); }
  else if (a==='km-unfocus') kmUnfocus();
  else if (a==='km-zoom'){ kmCamTo(KM.cam.x, KM.cam.y, KM.cam.z * (+el.dataset.id > 0 ? 1.35 : 1/1.35), 300, true); }
  else if (a==='km-fit'){ KM.sel = null; kmTip(null); kmCamTo(0,0,1,700,true); }
  else if (a==='km-layout'){ KM.layout = el.dataset.id; document.querySelectorAll('[data-a="km-layout"]').forEach(b=>b.classList.toggle('on', b===el)); kmCamTo(0, KM.layout==='tree' ? 80 : 0, 1, 700, true); }
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
document.addEventListener('keydown', e=>{ if (e.key==='Escape' && KM.open){ if (KM.view!=='graph') kmUnfocus(); else kmClose(); } });
window.addEventListener('hashchange', ()=>{ if (location.hash==='#map') kmOpen(); else if (KM.open) kmClose(); });
function kmLauncherHTML(){
  return `<button class="km-launch" data-a="km-open"><span class="km-lorb" aria-hidden="true"></span><span class="km-lt"><b>Knowledge map</b><small>Everything you are learning as one network. Tap a topic to dive in.</small></span><span class="km-lgo">${kmi('send',16)}</span></button>`;
}
