/* ============================================================
   PIT WALL — the race-day visual layer
   status bar · rev gauge · generated lap · start lights ·
   self-drawing pack diagrams · extra icons
   ============================================================ */
Object.assign(ICONS, {
  flag:'<path d="M5 21V4"/><path d="M5 4h11l-1.6 3.5L16 11H5"/><path d="M8 4v7M11 4v7M14 4v7" opacity=".55"/>',
  headset:'<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/><path d="M19 20c0 1.2-1.6 2-4 2h-2"/>',
  pound:'<circle cx="12" cy="12" r="9"/><path d="M14.6 8.6c-.4-1.2-1.4-1.9-2.7-1.9-1.6 0-2.7 1.2-2.7 2.8V15M8 12h5M8 15.8h7.5"/>',
  wrench:'<path d="M14.5 6.5a4 4 0 0 0-5.3 5.2L4 17l3 3 5.3-5.2a4 4 0 0 0 5.2-5.3l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  stopwatch:'<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5l3-3M10 2.5h4M12 2.5V6M18.5 6.5l1.5-1.5"/>',
  gauge:'<path d="M4.5 17a8.5 8.5 0 1 1 15 0"/><path d="M12 13l4-4"/><circle cx="12" cy="13" r="1.3"/>'
});

function planDay(){
  const a = parseKey(state.createdAt || dkey()), b = parseKey(dkey());
  return Math.max(1, Math.round((b - a) / 864e5) + 1);
}
function statusBar(){
  const k = dkey(), done = countDone(k), total = tasksForDay(k).length, streak = currentStreak();
  const flag = total && done >= total ? 'chequer' : done >= 4 ? 'green' : done > 0 ? 'yellow' : 'red';
  const msg = { chequer:'Chequered flag', green:'Streak day secured', yellow:'Racing', red:'Lights out soon' }[flag];
  return `<div class="statusbar" role="status">
    <span class="sb-flag ${flag}" aria-hidden="true"></span>
    <b>${esc(prettyDate())}</b>
    <span class="sb-sep" aria-hidden="true"></span><span class="sb-clock num" data-clock="Europe/London">${(()=>{ const t = tzParts('Europe/London'); return t.t + ' ' + t.abbr; })()}</span>
    <span class="sb-sep" aria-hidden="true"></span><span class="num">Day ${planDay()} of 365</span>
    <span class="sb-sep" aria-hidden="true"></span><span class="sb-streak num">${streak}-day streak</span>
    <span class="sb-msg">${msg}</span>
  </div>`;
}

/* rev counter: 270° sweep, needle springs to today's progress, purple mark at the streak line */
function revGauge(done, total, size=148){
  const pct = total ? clamp(done/total,0,1) : 0, cx = size/2, cy = size/2, r = size/2 - 12;
  const ang = d => (d - 225) * Math.PI/180;            // 0 → 270 sweep, starting bottom-left
  const pt = (d, rr) => [cx + Math.cos(ang(d))*rr, cy + Math.sin(ang(d))*rr];
  const [sx,sy] = pt(0,r), [ex,ey] = pt(270,r);
  const arc = `M${sx.toFixed(1)},${sy.toFixed(1)} A${r},${r} 0 1 1 ${ex.toFixed(1)},${ey.toFixed(1)}`;
  let ticks = '';
  for (let i=0;i<=total;i++){
    const d = total ? 270*i/total : 0, [x1,y1] = pt(d, r-9), [x2,y2] = pt(d, r-17);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="g-tick ${i<=done?'on':''}"/>`;
  }
  const sl = total ? 270*Math.min(4,total)/total : 0, [s1,s2] = pt(sl, r+4), [s3,s4] = pt(sl, r-6);
  const needle = -135 + 270*pct;
  return `<div class="gauge" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
      <path d="${arc}" class="g-track"/>
      <path d="${arc}" class="g-fill" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:${(1-pct).toFixed(3)}"/>
      ${ticks}
      <line x1="${s1.toFixed(1)}" y1="${s2.toFixed(1)}" x2="${s3.toFixed(1)}" y2="${s4.toFixed(1)}" class="g-streak"/>
      <g class="g-needle" style="transform:rotate(${needle.toFixed(1)}deg);transform-origin:${cx}px ${cy}px">
        <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${(cy - r + 22).toFixed(1)}"/>
      </g>
      <circle cx="${cx}" cy="${cy}" r="6" class="g-hub"/>
    </svg>
    <div class="g-read"><b class="num">${done}<span>/${total}</span></b><small>tasks</small></div>
  </div>`;
}

/* today's lap: a circuit generated from the date; each finished task drives further round it */
let lapSeq = 0;
function lapArt(k){
  const total = tasksForDay(k).length || 1, done = countDone(k), p = clamp(done/total,0,1), all = done >= total;
  const streak = currentStreak(parseKey(k));
  const rnd = mulberry32(hashStr('lap:' + k));
  const W = 360, H = 210, cx = 180, cy = 104, rx = 138, ry = 74, N = 9, uid = 'lp' + (++lapSeq);
  const ctrl = [];
  for (let i=0;i<N;i++){ const a = i/N*Math.PI*2 - Math.PI/2, rr = 0.66 + rnd()*0.42; ctrl.push([cx+Math.cos(a)*rx*rr, cy+Math.sin(a)*ry*rr]); }
  const pts = [], S = 26;
  for (let i=0;i<N;i++){
    const p0 = ctrl[(i-1+N)%N], p1 = ctrl[i], p2 = ctrl[(i+1)%N], p3 = ctrl[(i+2)%N];
    for (let s=0;s<S;s++){
      const t = s/S, t2 = t*t, t3 = t2*t, f = (a,b,c,d)=>0.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);
      pts.push([f(p0[0],p1[0],p2[0],p3[0]), f(p0[1],p1[1],p2[1],p3[1])]);
    }
  }
  const d = 'M' + pts.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' L') + ' Z';
  const L = [0];
  for (let i=1;i<=pts.length;i++){ const a = pts[i-1], b = pts[i%pts.length]; L.push(L[i-1] + Math.hypot(b[0]-a[0], b[1]-a[1])); }
  const tot = L[L.length-1];
  const at = f => { const tg = f*tot; let i = 1; while (i < L.length-1 && L[i] < tg) i++; const a = pts[i-1], b = pts[i%pts.length], u = (tg-L[i-1])/((L[i]-L[i-1])||1); return [a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u, Math.atan2(b[1]-a[1], b[0]-a[0])]; };
  const mark = (f, cls, len=11) => { const [x,y,a] = at(f), nx = Math.cos(a+Math.PI/2)*len, ny = Math.sin(a+Math.PI/2)*len; return `<line x1="${(x-nx).toFixed(1)}" y1="${(y-ny).toFixed(1)}" x2="${(x+nx).toFixed(1)}" y2="${(y+ny).toFixed(1)}" class="${cls}"/>`; };
  const [carX, carY] = at(all ? 0 : p);
  const [stX, stY, stA] = at(0);
  let grid = '';
  for (let x=20;x<W;x+=20) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
  for (let y=20;y<H;y+=20) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  const sec = f => p >= f ? (all ? 'lap-sec best' : 'lap-sec pb') : 'lap-sec';
  const flag = all ? `<g class="lap-flag" transform="translate(${(stX+14).toFixed(1)},${(stY-40).toFixed(1)})">
      <line x1="0" y1="0" x2="0" y2="38" class="lap-pole"/>
      <g class="lap-cloth"><rect x="0" y="0" width="30" height="20" fill="url(#${uid}c)" stroke="currentColor" stroke-width=".8"/></g></g>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Today's lap: ${done} of ${total} tasks done, ${streak}-day streak${all?', chequered flag':''}">
    <defs>
      <pattern id="${uid}c" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#fff"/><rect width="5" height="5" fill="#111"/><rect x="5" y="5" width="5" height="5" fill="#111"/></pattern>
      <pattern id="${uid}k" width="8" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(${(stA*180/Math.PI+90).toFixed(1)})"><rect width="4" height="4" fill="#fff"/><rect x="4" width="4" height="4" fill="#111"/></pattern>
    </defs>
    <g class="lap-grid">${grid}</g>
    <path d="${d}" class="lap-wall" transform="translate(0,7)"/>
    <path d="${d}" class="lap-kerb"/>
    <path d="${d}" class="lap-road"/>
    <path d="${d}" class="lap-centre"/>
    ${p > 0 ? `<path d="${d}" class="lap-trace" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:${(1-p).toFixed(3)}"/>` : ''}
    ${mark(1/3, sec(1/3))}${mark(2/3, sec(2/3))}
    <g transform="translate(${stX.toFixed(1)},${stY.toFixed(1)}) rotate(${(stA*180/Math.PI+90).toFixed(1)})"><rect x="-12" y="-3" width="24" height="6" fill="url(#${uid}k)"/></g>
    <text x="14" y="22" class="lap-label">Lap ${streak + (all?1:0)}</text>
    <text x="${W-14}" y="22" class="lap-label" text-anchor="end">S1 · S2 · S3</text>
    ${flag}
    <g class="lap-car" transform="translate(${carX.toFixed(1)},${carY.toFixed(1)})"><circle r="11" class="lap-halo"/><circle r="5.5" class="lap-dot"/></g>
  </svg>`;
}

/* lights out, once per session */
function startLights(){
  if (motionOff()) return;
  try { if (sessionStorage.getItem('dc.lights')) return; sessionStorage.setItem('dc.lights','1'); } catch(e){}
  const o = document.createElement('div');
  o.className = 'lights'; o.setAttribute('aria-hidden','true');
  o.innerHTML = '<div class="lights-gantry">' + '<span><i></i><i></i></span>'.repeat(5) + '</div><div class="lights-cap">Lights out and away we go</div>';
  document.body.appendChild(o);
  const pods = o.querySelectorAll('.lights-gantry span');
  const step = 240, t0 = 180;
  pods.forEach((x,i)=>setTimeout(()=>x.classList.add('on'), t0 + i*step));
  const outAt = t0 + 5*step + 420;
  setTimeout(()=>{ pods.forEach(x=>x.classList.remove('on')); o.classList.add('go'); }, outAt);
  const end = ()=>{ if (!o.isConnected) return; o.classList.add('out'); setTimeout(()=>o.remove(), 520); };
  setTimeout(end, outAt + 700);
  o.addEventListener('click', end);
}

/* ---------- self-drawing diagrams for knowledge packs ---------- */
const DG = {
  box:(x,y,w,h,t='',c='')=>`<rect class="dg-box ${c}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6" pathLength="1"/>${t?`<text class="dg-txt" x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle">${t}</text>`:''}`,
  line:(d,c='')=>`<path class="dg-line ${c}" d="${d}" pathLength="1"/>`,
  arrow:(x1,y1,x2,y2,c='')=>`<path class="dg-line ${c}" d="M${x1},${y1} L${x2},${y2}" pathLength="1" marker-end="url(#dgArrow)"/>`,
  t:(x,y,s,c='',a='middle')=>`<text class="dg-txt ${c}" x="${x}" y="${y}" text-anchor="${a}">${s}</text>`,
  circ:(x,y,r,c='')=>`<circle class="dg-box ${c}" cx="${x}" cy="${y}" r="${r}" pathLength="1"/>`
};
const PACK_DIAGRAMS = {
  vffs:()=>[DG.circ(44,44,22),DG.t(44,82,'Film roll'),DG.line('M66,44 L104,44'),DG.circ(110,44,6),DG.circ(128,62,6),DG.line('M134,62 L150,62'),
    DG.line('M150,30 L206,30 L190,64 L166,64 Z','acc'),DG.t(178,22,'Forming shoulder'),DG.box(170,64,16,52),
    DG.box(150,118,16,20,'','acc'),DG.box(190,118,16,20,'','acc'),DG.t(178,154,'Seal jaws'),
    DG.t(232,100,'Temperature: seal strength','sm','start'),DG.t(232,116,'Dwell: film thickness','sm','start'),DG.t(232,132,'Pressure: wrinkles','sm','start'),
    DG.arrow(60,104,96,104),DG.t(78,122,'Trace faults','sm'),DG.t(78,135,'roll forward','sm')],
  flowwrap:()=>[DG.line('M14,124 L326,124'),DG.box(26,100,22,22),DG.box(60,100,22,22),DG.line('M104,92 L236,92 M104,124 L236,124','dash'),
    DG.line('M112,132 L228,132','acc'),DG.t(170,150,'Fin seal underneath'),DG.circ(170,48,8),DG.line('M170,56 L170,90','dash'),DG.t(170,30,'Photo-eye reads the print mark'),
    DG.circ(262,92,14,'acc'),DG.circ(262,130,14,'acc'),DG.t(262,66,'End seal and cut'),DG.box(292,104,26,20),DG.t(48,92,'Infeed'),DG.arrow(84,111,100,111)],
  micvac:()=>[DG.line('M30,84 L52,132 L178,132 L200,84'),DG.line('M24,82 L206,82','acc'),DG.circ(115,76,7,'acc'),DG.t(115,58,'Valve opens with steam'),
    DG.arrow(115,68,115,40),DG.t(115,150,'Sealed tray'),DG.box(236,34,84,28,'CO₂ 30%','acc'),DG.box(236,66,84,56,'N₂ 70%'),DG.t(278,140,'Example gas mix')],
  lidding:()=>[DG.box(26,24,190,24,'Heated seal head','acc'),DG.arrow(60,50,60,80),DG.arrow(182,50,182,80),DG.line('M22,86 L220,86','acc'),
    DG.line('M30,88 L52,136 L190,136 L212,88'),DG.t(121,154,'Tray flange seals to film'),
    DG.t(246,52,'Temperature','sm','start'),DG.box(246,58,70,8),DG.t(246,88,'Pressure','sm','start'),DG.box(246,94,52,8),DG.t(246,124,'Time','sm','start'),DG.box(246,130,36,8)],
  thermo:()=>[DG.box(8,30,56,30,'Sheet'),DG.arrow(64,45,74,45),DG.box(74,30,56,30,'Heat','acc'),DG.arrow(130,45,140,45),DG.box(140,30,56,30,'Form','acc'),
    DG.arrow(196,45,206,45),DG.box(206,30,56,30,'Trim'),DG.arrow(262,45,272,45),DG.box(272,30,60,30,'Stack'),
    DG.line('M78,80 l8,-8 l8,8 l8,-8 l8,8 l8,-8 l8,8','acc'),DG.t(102,104,'Infrared heaters','sm'),
    DG.line('M146,80 L190,80 L182,116 L154,116 Z'),DG.arrow(160,140,160,120),DG.arrow(176,140,176,120),DG.t(168,156,'Vacuum or pressure','sm'),
    DG.t(240,96,'Watch sheet temp,','sm','start'),DG.t(240,110,'cycle time, scrap','sm','start')],
  cnc:()=>[DG.line('M30,140 L326,140 M30,140 L30,18'),DG.box(30,56,296,48,'','band'),DG.line('M30,80 L326,80','dash'),
    DG.t(36,50,'Upper limit','sm','start'),DG.t(36,98,'Nominal','sm','start'),DG.t(36,120,'Lower limit','sm','start'),
    ...[[60,84],[100,82],[140,79],[180,74],[220,70],[260,64],[300,50]].map(([x,y],i)=>DG.circ(x,y,4,i===6?'acc':'')),DG.line('M60,84 Q200,78 300,50','acc'),DG.t(250,30,'Tool wear drift','acc')],
  rotomould:()=>[DG.line('M34,142 L326,142 M34,142 L34,18'),DG.t(40,30,'Temperature','sm','start'),DG.t(320,158,'Time','sm','end'),
    DG.line('M40,32 C80,40 100,124 300,132','acc'),DG.line('M40,32 C160,36 210,92 300,120'),DG.t(118,86,'Fast cool: warp risk','acc','start'),DG.t(196,70,'Slow cool: stronger, longer cycle','sm','start')],
  oee:()=>{ const bar=(x,v,l,c='')=>DG.box(x,140-v,46,v,'',c)+DG.t(x+23,154,l,'sm')+DG.t(x+23,132-v,Math.round(v)+'%','sm'); return [DG.line('M20,140 L326,140'),bar(30,90,'Availability'),DG.t(96,100,'×'),bar(110,89,'Performance'),DG.t(176,100,'×'),bar(190,97,'Quality'),DG.t(256,100,'='),bar(270,78,'OEE','acc')]; },
  smed:()=>[DG.t(20,44,'Before','sm','start'),DG.box(80,30,236,22,'Machine stopped: all steps','acc'),DG.t(20,104,'After','sm','start'),DG.box(80,90,90,22,'Prepare while running'),DG.box(176,90,90,22,'Stopped','acc'),DG.arrow(266,140,176,140),DG.t(220,156,'Downtime saved','sm')],
  rca:()=>[DG.line('M30,84 L280,84','acc'),DG.box(280,66,48,36,'Effect','acc'),...[['People',70,28],['Machine',170,28],['Method',70,140],['Material',170,140]].map(([l,x,y])=>DG.line(`M${x},${y} L${x+50},84`)+DG.t(x,y<84?y-8:y+16,l,'sm')),DG.t(150,160,'Ask why five times on each bone','sm')],
  ppm:()=>[DG.line('M30,140 L326,140 M30,140 L30,18'),DG.t(36,30,'Condition','sm','start'),DG.t(320,158,'Time','sm','end'),DG.line('M36,40 C170,42 230,62 300,136','acc'),
    DG.circ(206,56,5,'acc'),DG.t(206,46,'P: failure detectable','sm'),DG.circ(294,128,5,'acc'),DG.t(266,118,'F: it fails','sm','end'),DG.line('M206,74 L294,74','dash'),DG.t(250,90,'Inspect inside the P–F gap','sm')],
  films:()=>[DG.box(30,30,170,24,'PET: stiffness, print'),DG.box(30,58,170,10,''),DG.t(210,67,'Adhesive','sm','start'),DG.box(30,72,170,40,'PE: the seal layer','acc'),DG.t(210,96,'Melts first, seals','sm','start'),DG.t(115,140,'Cross-section of a lidding film','sm')]
};
function packDiagram(id){
  const f = PACK_DIAGRAMS[id]; if (!f) return '';
  return `<figure class="dg" aria-label="Diagram">
    <svg viewBox="0 0 340 166" role="img"><defs><marker id="dgArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="dg-head"/></marker></defs>${f().join('')}</svg>
  </figure>`;
}

/* ---------- time zones ---------- */
const CLOCKS = [
  { zone:'Europe/London', city:'UK',      note:'Southsea' },
  { zone:'Asia/Yangon',   city:'Myanmar', note:'Yangon' },
  { zone:'Asia/Tokyo',    city:'Japan',   note:'Tokyo' }
];
function tzOffsetMin(zone, d=new Date()){
  const local = new Date(d.toLocaleString('en-US', { timeZone:zone }));
  const utc = new Date(d.toLocaleString('en-US', { timeZone:'UTC' }));
  return Math.round((local - utc) / 60000);
}
function tzParts(zone, d=new Date()){
  const t = new Intl.DateTimeFormat('en-GB', { timeZone:zone, hour:'2-digit', minute:'2-digit', hour12:false }).format(d);
  const date = new Intl.DateTimeFormat('en-GB', { timeZone:zone, weekday:'short', day:'numeric', month:'short' }).format(d);
  let abbr = 'UTC';
  try { abbr = new Intl.DateTimeFormat('en-GB', { timeZone:zone, timeZoneName:'short' }).formatToParts(d).find(p=>p.type==='timeZoneName').value; } catch(e){}
  const off = tzOffsetMin(zone, d), sign = off >= 0 ? '+' : '−', a = Math.abs(off);
  const offTxt = 'UTC' + sign + Math.floor(a/60) + (a % 60 ? ':' + pad2(a % 60) : '');
  const h = +new Intl.DateTimeFormat('en-GB', { timeZone:zone, hour:'numeric', hour12:false }).format(d) % 24;
  const m = +new Intl.DateTimeFormat('en-GB', { timeZone:zone, minute:'numeric' }).format(d);
  const named = { 'Asia/Yangon':'MMT', 'Asia/Tokyo':'JST' }[zone];
  return { t, date, abbr: named || (abbr.startsWith('GMT+') || abbr.startsWith('GMT-') ? offTxt : abbr), offTxt, h, m, s:d.getSeconds(), off };
}
function fmtDiff(min){ const a = Math.abs(min), h = Math.floor(a/60), m = a % 60; return `${h} h${m ? ' ' + m + ' min' : ''}`; }
function dialSVG(p){
  const hr = ((p.h % 12) + p.m/60) * 30, mn = (p.m + p.s/60) * 6, sc = p.s * 6, night = p.h < 6 || p.h >= 19;
  let ticks = '';
  for (let i=0;i<12;i++){ const a = i*30*Math.PI/180, r1 = i%3 ? 19 : 17; ticks += `<line x1="${(24+Math.sin(a)*r1).toFixed(1)}" y1="${(24-Math.cos(a)*r1).toFixed(1)}" x2="${(24+Math.sin(a)*21).toFixed(1)}" y2="${(24-Math.cos(a)*21).toFixed(1)}"/>`; }
  return `<svg viewBox="0 0 48 48" class="dial ${night?'night':''}" aria-hidden="true"><circle cx="24" cy="24" r="23" class="d-face"/><g class="d-ticks">${ticks}</g>
    <line x1="24" y1="24" x2="24" y2="12" class="d-h" style="transform:rotate(${hr}deg)"/><line x1="24" y1="24" x2="24" y2="7" class="d-m" style="transform:rotate(${mn}deg)"/>
    <line x1="24" y1="27" x2="24" y2="5" class="d-s" style="transform:rotate(${sc}deg)"/><circle cx="24" cy="24" r="2" class="d-hub"/></svg>`;
}
function clocksHTML(){
  const now = new Date(), home = tzParts(CLOCKS[0].zone, now);
  return `<div class="glass clockcard" id="clockCard" data-tilt>
    <div class="clockrow">${CLOCKS.map((c,i)=>{ const p = tzParts(c.zone, now);
      return `<div class="clk" data-zone="${c.zone}">${dialSVG(p)}<div class="clk-txt"><b class="num">${p.t}</b><span class="clk-city">${esc(c.city)} <em>${esc(p.abbr)}</em></span><span class="clk-date">${esc(c.note)}</span><span class="clk-date">${esc(p.date)}</span></div></div>`; }).join('')}</div>
    <div class="clocknote">${(()=>{ const y = tzParts('Asia/Yangon', now), j = tzParts('Asia/Tokyo', now); return `Myanmar is <b>${fmtDiff(y.off-home.off)}</b> and Japan <b>${fmtDiff(j.off-home.off)}</b> ahead of the UK today (${home.abbr==='BST'?'British Summer Time':'Greenwich Mean Time'}). The UK changes its clocks in late March and late October; Myanmar and Japan never do.`; })()}</div>
  </div>`;
}
function tickClocks(){
  const now = new Date();
  document.querySelectorAll('.clk[data-zone]').forEach(el=>{
    const p = tzParts(el.dataset.zone, now), svg = el.querySelector('svg');
    if (svg) svg.outerHTML = dialSVG(p);
    const b = el.querySelector('b'); if (b) b.textContent = p.t;
  });
  document.querySelectorAll('[data-clock]').forEach(el=>{ const p = tzParts(el.dataset.clock, now); el.textContent = `${p.t} ${p.abbr}`; });
}
setInterval(()=>{ if (!document.hidden) tickClocks(); }, 1000);
