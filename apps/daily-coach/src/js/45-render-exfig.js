/* ============================================================
   EXERCISE FIGURES — side-view movement diagrams
   Each exercise has a start pose (A) and an end pose (B).
   The figure moves between them; a faint ghost shows the start.
   Red limbs = the muscles doing the work.
   Points: H head, S shoulder, M mid-back, E elbow, W wrist, P hip,
   K knee, A ankle, T toe; *2 = far-side limb (drawn fainter).
   ============================================================ */
const STAND = { H:[60,14],S:[60,24],E:[60,38],W:[60,50],P:[60,50],K:[60,66],A:[60,81],T:[67,82] };
const SQUAT_LOW = { H:[66,34],S:[62,42],E:[74,46],W:[86,46],P:[44,62],K:[62,62],A:[60,81],T:[67,82] };
const PLANK_HI  = { H:[92,44],S:[84,51],E:[84,66],W:[84,81],P:[56,62],K:[38,70],A:[19,77],T:[15,82] };
const PUSH_LOW  = { H:[93,57],S:[84,64],E:[72,74],W:[84,81],P:[54,68],K:[35,73],A:[17,78],T:[14,82] };
const up = (p, dy) => Object.fromEntries(Object.entries(p).map(([k,v])=>[k,[v[0],v[1]+dy]]));
const EXFIG = {
  squat:      { A:STAND, B:SQUAT_LOW, hl:['thigh','glute'] },
  jumpSquat:  { A:SQUAT_LOW, B:{...up(STAND,-9), A:[61,73], T:[64,79]}, hl:['thigh','shin'] },
  wallsit:    { A:{ H:[42,32],S:[42,42],E:[46,54],W:[50,62],P:[42,62],K:[60,62],A:[60,81],T:[67,82] }, B:{ H:[42,31],S:[42,41],E:[46,53],W:[50,61],P:[42,62],K:[60,62],A:[60,81],T:[67,82] }, hl:['thigh'], prop:'wall' },
  splitSquat: { A:{...STAND, K:[68,65],A:[73,81],T:[80,82], K2:[54,65],A2:[46,79],T2:[41,82]}, B:{ H:[60,30],S:[60,40],E:[60,53],W:[60,64],P:[60,64],K:[78,66],A:[76,81],T:[83,82],K2:[56,80],A2:[41,79],T2:[36,82] }, hl:['thigh','glute'] },
  rfess:      { A:{ H:[62,12],S:[62,22],E:[62,36],W:[62,48],P:[62,48],K:[72,64],A:[74,81],T:[81,82],K2:[50,62],A2:[34,64],T2:[28,64] }, B:{ H:[66,28],S:[64,37],E:[64,50],W:[64,61],P:[62,62],K:[80,64],A:[76,81],T:[83,82],K2:[48,78],A2:[34,66],T2:[28,64] }, hl:['thigh','glute'], prop:'bench' },
  pushup:     { A:PLANK_HI, B:PUSH_LOW, hl:['upper','fore','torso'] },
  invert:     { A:{ H:[92,26],S:[84,34],E:[84,48],W:[84,62],P:[59,51],K:[43,63],A:[27,74],T:[23,80] }, B:{ H:[94,38],S:[85,46],E:[73,54],W:[84,62],P:[57,60],K:[40,70],A:[23,79],T:[20,82] }, hl:['upper','fore','torso'], prop:'counter' },
  pike:       { A:{ H:[85,65],S:[78,60],E:[82,70],W:[86,81],P:[58,36],K:[48,58],A:[38,80],T:[34,82] }, B:{ H:[90,76],S:[80,68],E:[74,74],W:[86,81],P:[58,40],K:[48,60],A:[38,80],T:[34,82] }, hl:['upper','fore'] },
  row:        { A:{ H:[90,72],S:[80,72],E:[80,58],W:[80,42],P:[48,76],K:[32,78],A:[16,80],T:[14,74] }, B:{ H:[90,48],S:[80,50],E:[70,44],W:[80,42],P:[50,62],K:[32,72],A:[16,80],T:[14,74] }, hl:['upper','fore','torso'], prop:'table' },
  bridge:     { A:{ H:[92,76],S:[82,77],E:[70,80],W:[58,81],P:[56,78],K:[44,62],A:[32,80],T:[26,81] }, B:{ H:[92,76],S:[82,76],E:[70,80],W:[58,81],P:[58,61],K:[42,59],A:[32,80],T:[26,81] }, hl:['glute','thigh'] },
  hinge:      { A:{...STAND, K2:[58,66],A2:[55,80],T2:[61,81]}, B:{ H:[90,44],S:[80,46],M:[68,48],E:[80,58],W:[80,70],P:[56,50],K:[58,66],A:[58,81],T:[65,82],K2:[36,50],A2:[18,52],T2:[16,47] }, hl:['glute','thigh'] },
  superman:   { A:{ H:[94,76],S:[84,77],E:[96,78],W:[108,78],P:[58,78],K:[38,79],A:[20,80],T:[14,81] }, B:{ H:[96,68],S:[84,72],E:[97,66],W:[108,62],P:[58,78],K:[38,74],A:[20,70],T:[15,70] }, hl:['torso','glute'] },
  hollow:     { A:{ H:[90,70],S:[80,74],E:[92,68],W:[104,64],P:[56,79],K:[36,74],A:[18,70],T:[14,66] }, B:{ H:[89,68],S:[80,72],E:[92,66],W:[104,62],P:[56,79],K:[36,72],A:[18,67],T:[14,63] }, hl:['torso'] },
  plank:      { A:{ H:[92,56],S:[84,62],E:[84,80],W:[98,80],P:[56,66],K:[38,72],A:[19,77],T:[15,82] }, B:{ H:[92,55],S:[84,61],E:[84,80],W:[98,80],P:[56,64],K:[38,71],A:[19,77],T:[15,82] }, hl:['torso'] },
  taps:       { A:PLANK_HI, B:{...PLANK_HI, E:[92,62], W:[86,54]}, hl:['torso','upper'] },
  climbers:   { A:PLANK_HI, B:{...PLANK_HI, K:[68,70],A:[56,77],T:[52,81], K2:[38,70],A2:[19,77],T2:[15,82]}, hl:['torso','thigh'] },
  burpee:     { A:STAND, B:{ H:[76,50],S:[68,54],E:[74,66],W:[78,81],P:[52,62],K:[64,64],A:[58,81],T:[65,82] }, hl:['thigh','upper'] },
  carry:      { A:{...STAND, K:[64,65],A:[68,81],T:[75,82],K2:[56,65],A2:[52,81],T2:[58,82]}, B:{...STAND, K:[56,65],A:[52,81],T:[58,82],K2:[64,65],A2:[68,81],T2:[75,82]}, hl:['fore','torso'], prop:'bag' },
  deadbug:    { A:{ H:[92,76],S:[82,76],E:[82,64],W:[82,52],P:[56,78],K:[56,62],A:[44,62],T:[40,59] }, B:{ H:[92,76],S:[82,76],E:[93,70],W:[105,72],P:[56,78],K:[56,62],A:[44,62],T:[40,59],K2:[40,72],A2:[22,75],T2:[18,72] }, hl:['torso'] },
  catcow:     { A:{ H:[92,52],S:[84,56],M:[70,64],E:[84,68],W:[84,81],P:[56,58],K:[56,72],A:[40,81],T:[36,82] }, B:{ H:[92,64],S:[84,58],M:[70,46],E:[84,69],W:[84,81],P:[56,58],K:[56,72],A:[40,81],T:[36,82] }, hl:['torso'] },
  hips:       { A:{ H:[59,38],S:[58,48],E:[60,60],W:[66,70],P:[56,74],K:[76,72],A:[76,81],T:[80,82],K2:[40,70],A2:[34,80],T2:[30,82] }, B:{ H:[57,38],S:[56,48],E:[54,60],W:[48,70],P:[56,74],K:[72,64],A:[78,81],T:[82,82],K2:[44,64],A2:[34,80],T2:[30,82] }, hl:['glute'] },
  calf:       { A:STAND, B:{...up(STAND,-5), A:[61,77], T:[67,82]}, hl:['shin'] }
};
const PROPS = {
  wall:'<line x1="35" y1="10" x2="35" y2="82" class="xf-prop"/>',
  bench:'<rect x="16" y="64" width="26" height="18" rx="2" class="xf-prop"/>',
  counter:'<rect x="78" y="62" width="30" height="20" rx="2" class="xf-prop"/>',
  table:'<path d="M46,40 H108 M52,40 V82 M102,40 V82" class="xf-prop"/>',
  bag:'<rect class="xf-prop xf-bag" x="56" y="50" width="10" height="13" rx="2"/>'
};
function poseFull(p){
  const q = {...p};
  q.M = q.M || [(q.S[0]+q.P[0])/2, (q.S[1]+q.P[1])/2];
  q.E2 = q.E2 || q.E; q.W2 = q.W2 || q.W; q.K2 = q.K2 || q.K; q.A2 = q.A2 || q.A; q.T2 = q.T2 || q.T;
  return q;
}
function figPaths(q, hl){
  const L = (a,b,cls) => `M${q[a][0].toFixed(1)},${q[a][1].toFixed(1)} L${q[b][0].toFixed(1)},${q[b][1].toFixed(1)}`;
  return {
    far:   `${L('S','E2')} ${L('E2','W2')} ${L('P','K2')} ${L('K2','A2')} ${L('A2','T2')}`,
    torso: `M${q.S[0].toFixed(1)},${q.S[1].toFixed(1)} Q${q.M[0].toFixed(1)},${q.M[1].toFixed(1)} ${q.P[0].toFixed(1)},${q.P[1].toFixed(1)}`,
    upper: L('S','E'), fore: L('E','W'), thigh: L('P','K'), shin: L('K','A'), foot: L('A','T'),
    glute: L('P','K')
  };
}
function exFigure(id){
  const f = EXFIG[id]; if (!f) return '';
  const A = poseFull(f.A), B = poseFull(f.B), pa = figPaths(A), pb = figPaths(B);
  const hl = new Set(f.hl || []);
  const seg = (name) => `<path data-s="${name}" d="${pb[name]}" class="xf-seg ${hl.has(name)||(name==='thigh'&&hl.has('glute'))?'hot':''}"/>`;
  return `<svg class="exfig" viewBox="0 0 120 90" data-fig="${id}" role="img" aria-label="Movement diagram for ${esc(EX[id]?EX[id].name:id)}">
    <line x1="4" y1="82.5" x2="116" y2="82.5" class="xf-floor"/>
    ${f.prop ? PROPS[f.prop] : ''}
    <g class="xf-ghost"><path d="${pa.far}"/><path d="${pa.torso}"/><path d="${pa.upper} ${pa.fore} ${pa.thigh} ${pa.shin} ${pa.foot}"/><circle cx="${A.H[0]}" cy="${A.H[1]}" r="6"/></g>
    <path data-s="far" d="${pb.far}" class="xf-far"/>
    <path data-s="torso" d="${pb.torso}" class="xf-seg ${hl.has('torso')?'hot':''}"/>
    ${seg('thigh')}${seg('shin')}${seg('foot')}${seg('upper')}${seg('fore')}
    <circle data-s="head" cx="${B.H[0]}" cy="${B.H[1]}" r="6" class="xf-head"/>
    <circle data-s="hip" cx="${B.P[0]}" cy="${B.P[1]}" r="2.2" class="xf-joint"/>
    <circle data-s="knee" cx="${B.K[0]}" cy="${B.K[1]}" r="2" class="xf-joint"/>
  </svg>`;
}
/* animate every visible figure between its two poses */
const exAnim = { raf:0, vis:new Set(), io:null };
function exAnimTick(ts){
  exAnim.raf = 0;
  if (motionOff() || !exAnim.vis.size) return;
  const t = (Math.sin(ts/1000 * Math.PI * 2 / 2.6) + 1) / 2, e = t*t*(3-2*t);
  exAnim.vis.forEach(svg=>{
    if (!svg.isConnected){ exAnim.vis.delete(svg); return; }
    const f = EXFIG[svg.dataset.fig]; if (!f) return;
    const A = poseFull(f.A), B = poseFull(f.B), q = {};
    for (const k in A) q[k] = [A[k][0] + (B[k][0]-A[k][0])*e, A[k][1] + (B[k][1]-A[k][1])*e];
    const p = figPaths(q);
    svg.querySelectorAll('[data-s]').forEach(el=>{
      const s = el.dataset.s;
      if (s==='head'){ el.setAttribute('cx', q.H[0].toFixed(1)); el.setAttribute('cy', q.H[1].toFixed(1)); }
      else if (s==='hip'){ el.setAttribute('cx', q.P[0].toFixed(1)); el.setAttribute('cy', q.P[1].toFixed(1)); }
      else if (s==='knee'){ el.setAttribute('cx', q.K[0].toFixed(1)); el.setAttribute('cy', q.K[1].toFixed(1)); }
      else if (p[s]) el.setAttribute('d', p[s]);
    });
    const bag = svg.querySelector('.xf-bag'); if (bag){ bag.setAttribute('x', (q.W[0]-5).toFixed(1)); bag.setAttribute('y', q.W[1].toFixed(1)); }
  });
  exAnim.raf = requestAnimationFrame(exAnimTick);
}
function mountExFigures(root=document){
  if (!('IntersectionObserver' in window)) return;
  if (!exAnim.io) exAnim.io = new IntersectionObserver(es=>{
    es.forEach(en=>{ if (en.isIntersecting) exAnim.vis.add(en.target); else exAnim.vis.delete(en.target); });
    if (exAnim.vis.size && !exAnim.raf && !motionOff()) exAnim.raf = requestAnimationFrame(exAnimTick);
  }, { rootMargin:'60px' });
  root.querySelectorAll('svg.exfig').forEach(s=>exAnim.io.observe(s));
}
