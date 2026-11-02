/* ============================================================
   GALAXY + LANDSCAPE
   - paintLandscape(): a painted Chinese-landscape background (cream
     sky, pearl mist, gold-leaf ridges, crimson foothills), generated
     once per size/theme so it stays sharp and carries no third-party art.
   - GAL: shared galaxy helpers (spiral dust, differential rotation,
     tilted-disc projection, glowing core, orbit rings, shaded planets).
   - Command centre: the round, draggable galaxy at the top of Today
     with the main title in its core and panels around it.
   ============================================================ */
const isDarkUI = () => document.documentElement.getAttribute('data-theme') === 'dark';

/* ---------- painted landscape ---------- */
function paintLandscape(){
  let cv = document.getElementById('landscape');
  if (!cv){ cv = document.createElement('canvas'); cv.id = 'landscape'; cv.setAttribute('aria-hidden','true'); document.body.prepend(cv); }
  const W = innerWidth, H = innerHeight, d = Math.min(2, devicePixelRatio||1);
  cv.width = Math.round(W*d); cv.height = Math.round(H*d);
  const g = cv.getContext('2d'); g.setTransform(d,0,0,d,0,0);
  const dark = isDarkUI(), rnd = mulberry32(hashStr('shanshui'));
  const sky = g.createLinearGradient(0,0,0,H);
  if (dark){ sky.addColorStop(0,'#0D0D0E'); sky.addColorStop(.55,'#161314'); sky.addColorStop(1,'#1E1012'); }
  else { sky.addColorStop(0,'#F7F4EE'); sky.addColorStop(.55,'#F2EEE7'); sky.addColorStop(1,'#EFE6DB'); }
  g.fillStyle = sky; g.fillRect(0,0,W,H);
  // pale sun / moon
  const sx = W*.72, sy = H*.2, sr = Math.min(W,H)*.09;
  let gr = g.createRadialGradient(sx,sy,0,sx,sy,sr*3); gr.addColorStop(0, dark ? 'rgba(230,205,176,.22)' : 'rgba(201,148,110,.18)'); gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0,0,W,H);
  g.fillStyle = dark ? 'rgba(230,205,176,.16)' : 'rgba(138,10,30,.07)'; g.beginPath(); g.arc(sx,sy,sr*.55,0,7); g.fill();
  // ridge generator: midpoint displacement for sharp brush-like peaks
  const ridge = (base, amp, rough, seed) => {
    const r = mulberry32(seed), N = 129, pts = new Array(N).fill(0);
    pts[0] = (r()-.5)*amp; pts[N-1] = (r()-.5)*amp;
    for (let step = N-1, a = amp; step > 1; step >>= 1, a *= rough)
      for (let i = step/2; i < N; i += step) pts[i] = (pts[i-step/2] + pts[i+step/2])/2 + (r()-.5)*a;
    return pts.map((v,i)=>[i/(N-1)*W, base + v]);
  };
  const layers = dark ? [
    { base:.46, amp:.30, rough:.56, fill:['rgba(70,64,60,.55)','rgba(30,28,27,.2)'], gold:.25 },
    { base:.56, amp:.26, rough:.58, fill:['rgba(110,90,72,.55)','rgba(40,32,28,.3)'], gold:.55 },
    { base:.66, amp:.22, rough:.60, fill:['rgba(150,118,90,.5)','rgba(60,40,32,.4)'], gold:.8 },
    { base:.76, amp:.20, rough:.60, fill:['rgba(113,0,20,.75)','rgba(58,7,16,.9)'], gold:.6 },
    { base:.88, amp:.14, rough:.62, fill:['rgba(138,10,30,.85)','rgba(74,13,20,1)'], gold:.35 }
  ] : [
    { base:.44, amp:.30, rough:.56, fill:['rgba(226,222,216,.9)','rgba(242,238,231,.2)'], gold:.15 },
    { base:.54, amp:.26, rough:.58, fill:['rgba(214,196,176,.85)','rgba(240,234,226,.25)'], gold:.5 },
    { base:.64, amp:.22, rough:.60, fill:['rgba(201,168,130,.78)','rgba(236,226,214,.3)'], gold:.9 },
    { base:.76, amp:.20, rough:.60, fill:['rgba(176,32,52,.82)','rgba(214,140,140,.35)'], gold:.6 },
    { base:.88, amp:.14, rough:.62, fill:['rgba(138,10,30,.95)','rgba(113,0,20,.8)'], gold:.35 }
  ];
  layers.forEach((L,li)=>{
    const pts = ridge(L.base*H, L.amp*H, L.rough, 101+li*17);
    const path = () => { g.beginPath(); g.moveTo(0,H); pts.forEach(p=>g.lineTo(p[0],p[1])); g.lineTo(W,H); g.closePath(); };
    const top = Math.min(...pts.map(p=>p[1]));
    gr = g.createLinearGradient(0,top,0,H); gr.addColorStop(0,L.fill[0]); gr.addColorStop(1,L.fill[1]);
    g.save(); path(); g.fillStyle = gr; g.fill(); g.clip();
    // brush strokes following the slopes
    for (let i=0;i<pts.length-1;i++){
      const [x0,y0] = pts[i], [x1,y1] = pts[i+1], slope = Math.atan2(y1-y0, x1-x0);
      for (let k=0;k<6;k++){ const x = x0 + rnd()*(x1-x0), y = y0 + rnd()*H*.12, len = 18 + rnd()*60;
        g.strokeStyle = dark ? `rgba(255,240,220,${(.02+rnd()*.05).toFixed(3)})` : `rgba(255,255,255,${(.05+rnd()*.12).toFixed(3)})`;
        g.lineWidth = 1 + rnd()*3; g.beginPath(); g.moveTo(x,y); g.lineTo(x + Math.cos(slope+.9)*len, y + Math.sin(slope+.9)*len); g.stroke(); }
    }
    // gold leaf speckles under the crest
    g.globalCompositeOperation = dark ? 'lighter' : 'source-over';
    for (let i=0;i<pts.length-1;i++){ if (rnd() > L.gold) continue; const [x0,y0] = pts[i];
      for (let k=0;k<10;k++){ const x = x0 + rnd()*W/128*2, y = y0 + rnd()*rnd()*H*.08; g.fillStyle = `rgba(${dark?'230,196,140':'198,154,90'},${(.25+rnd()*.5).toFixed(2)})`; g.fillRect(x,y,1+rnd()*2.2,1+rnd()*2.2); } }
    g.globalCompositeOperation = 'source-over'; g.restore();
    // gold crest line
    g.strokeStyle = dark ? 'rgba(230,200,150,.45)' : 'rgba(190,146,84,.55)'; g.lineWidth = 1.1;
    g.beginPath(); pts.forEach((p,i)=>{ if (rnd() < L.gold*.9) i ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); else g.moveTo(p[0],p[1]); }); g.stroke();
    // mist above the next layer
    const my = (L.base + .07)*H; gr = g.createLinearGradient(0,my-H*.06,0,my+H*.06);
    gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(.5, dark ? 'rgba(30,26,26,.45)' : 'rgba(250,248,244,.6)'); gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0,my-H*.06,W,H*.12);
  });
}
let landT; addEventListener('resize', ()=>{ clearTimeout(landT); landT = setTimeout(paintLandscape, 180); });

/* ---------- galaxy helpers ---------- */
const GAL = {
  // Milky Way: a central bar, two bright arms from its ends, two fainter arms, a warm bulge and a thin halo.
  // Particles are grouped into colour/brightness buckets so each frame sets fillStyle ~24 times, not once per star.
  MW_COLS: [[226,234,255],[200,214,255],[255,238,214],[255,214,170],[255,132,160],[214,60,86]],
  dust(n, seed){
    const r = mulberry32(seed), out = [], g = () => (r()+r()+r()-1.5)/1.5;
    const push = (rad, th, y, s, a, ci) => out.push({ r:rad, th, y, s, a, ci, b: ci*4 + Math.min(3, Math.floor(a*4)) });
    for (let i=0;i<n;i++){
      const main = i % 4 < 3, arm = main ? (i % 2)*Math.PI : Math.PI/2 + (i % 2)*Math.PI, t = Math.pow(r(), .75), rad = .16 + t*.84;
      const th = arm + Math.log(rad*5+1)*2.1 + g()*(main ? .3 : .42)*(1 - t*.25), c = r();
      const ci = rad < .35 ? (c < .6 ? 2 : 3) : c < .5 ? 0 : c < .82 ? 1 : c < .9 ? 2 : c < .97 ? 4 : 5;
      push(rad, th, g()*.03*(1-t), .5 + r()*1.3, (main ? .35 : .22) + r()*.6, ci);
    }
    for (let i=0;i<n*.3;i++){ const u = g()*.3, w = g()*.06, rad = Math.hypot(u,w), th = Math.atan2(w,u) + .5; push(rad, th, g()*.05, .5 + r(), .45 + r()*.5, r() < .7 ? 2 : 3); }
    for (let i=0;i<n*.18;i++){ const rad = Math.sqrt(r())*1.05, th = r()*Math.PI*2; push(rad, th, g()*.04, .4 + r()*.8, .12 + r()*.3, r() < .6 ? 0 : 2); }
    out.sort((a,b)=>a.b-b.b); return out;
  },
  nebula(){ // face-on glow texture (radius 1 = 380px), painted once: diffuse disc, bar, arms, pink knots, dust lanes
    const S = 768, H = S/2, K = 380, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), r = mulberry32(31);
    g.translate(H,H); g.globalCompositeOperation = 'lighter';
    let gr = g.createRadialGradient(0,0,0,0,0,K); gr.addColorStop(0,'rgba(255,226,186,.22)'); gr.addColorStop(.3,'rgba(190,190,220,.08)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0,0,K,0,7); g.fill();
    const blob = (x,y,br,col) => { const q = g.createRadialGradient(x,y,0,x,y,br); q.addColorStop(0,col); q.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = q; g.beginPath(); g.arc(x,y,br,0,7); g.fill(); };
    for (let arm=0; arm<4; arm++){ const main = arm < 2, a0 = main ? arm*Math.PI : Math.PI/2 + (arm-2)*Math.PI;
      for (let i=0;i<150;i++){ const rad = .16 + Math.pow(i/150,.9)*.84, th = a0 + Math.log(rad*5+1)*2.1 + (r()-.5)*.12, x = Math.cos(th)*rad*K, y = Math.sin(th)*rad*K;
        blob(x, y, 14 + rad*46, rad < .35 ? `rgba(255,222,180,${main?.09:.05})` : `rgba(176,196,255,${main?.08:.045})`);
        if (rad > .3 && r() < (main ? .22 : .1)) blob(x + (r()-.5)*20, y + (r()-.5)*20, 4 + r()*7, 'rgba(255,110,140,.35)'); } }
    g.save(); g.rotate(.5); g.scale(1,.36); blob(0,0,K*.36,'rgba(255,226,180,.75)'); g.restore();
    blob(0,0,K*.2,'rgba(255,240,215,.8)'); blob(0,0,K*.07,'rgba(255,250,240,.9)');
    g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round';
    for (let arm=0; arm<2; arm++){ g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 7; g.beginPath();
      for (let i=0;i<=120;i++){ const rad = .2 + i/120*.75, th = arm*Math.PI + Math.log(rad*5+1)*2.1 - .16, x = Math.cos(th)*rad*K, y = Math.sin(th)*rad*K; i ? g.lineTo(x,y) : g.moveTo(x,y); } g.stroke(); }
    return c;
  },
  drawNebula(g, neb, v, T, alpha){
    if (alpha <= 0) return; const k = v.R/380;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha; g.translate(v.cx, v.cy); g.scale(1, Math.cos(v.tilt)); g.rotate(v.yaw + GAL.spin(.42, T));
    g.drawImage(neb, -384*k, -384*k, 768*k, 768*k); g.restore();
  },
  proj(rad, th, y, v){ // v: {cx, cy, R, yaw, tilt}
    const x = rad*Math.cos(th + v.yaw), z = rad*Math.sin(th + v.yaw);
    return [v.cx + x*v.R, v.cy + (z*Math.cos(v.tilt) - y*Math.sin(v.tilt))*v.R, z*Math.sin(v.tilt) + y*Math.cos(v.tilt)];
  },
  spin(rad, T){ return T * .06 / Math.sqrt(rad + .05); },
  drawDust(g, dust, v, T, alpha=1){
    g.globalCompositeOperation = 'lighter'; let cur = -1; const sc = Math.min(1.25, v.R/420);
    for (const p of dust){
      if (p.b !== cur){ cur = p.b; const c = GAL.MW_COLS[p.ci], lv = (p.b % 4 + .6)/4; g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(lv*alpha*.9).toFixed(3)})`; }
      const [x,y] = GAL.proj(p.r, p.th + GAL.spin(p.r,T), p.y, v), s = Math.max(.6, Math.min(1.8, p.s*sc)); g.fillRect(x - s/2, y - s/2, s, s);
    }
    g.globalCompositeOperation = 'source-over';
  },
  drawCore(g, x, y, r, a=1){
    g.globalCompositeOperation = 'lighter';
    let gr = g.createRadialGradient(x,y,0,x,y,r*6); gr.addColorStop(0,`rgba(255,236,210,${.75*a})`); gr.addColorStop(.18,`rgba(230,190,150,${.35*a})`); gr.addColorStop(.5,`rgba(140,30,50,${.12*a})`); gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x,y,r*6,0,7); g.fill();
    gr = g.createLinearGradient(x-r*9,y,x+r*9,y); gr.addColorStop(0,'rgba(255,230,200,0)'); gr.addColorStop(.5,`rgba(255,240,220,${.55*a})`); gr.addColorStop(1,'rgba(255,230,200,0)');
    g.fillStyle = gr; g.fillRect(x-r*9, y-.8, r*18, 1.6);
    gr = g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(255,255,250,${a})`); gr.addColorStop(.6,`rgba(255,226,190,${.8*a})`); gr.addColorStop(1,'rgba(255,200,160,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
    g.globalCompositeOperation = 'source-over';
  },
  drawRing(g, rad, v, alpha, T){
    g.strokeStyle = `rgba(226,214,198,${alpha})`; g.lineWidth = 1; g.beginPath();
    for (let i=0;i<=72;i++){ const [x,y] = GAL.proj(rad, i/72*Math.PI*2, 0, v); i ? g.lineTo(x,y) : g.moveTo(x,y); } g.stroke();
    // a bright arc travelling round the orbit
    const a0 = T*.25 + rad*7; g.strokeStyle = `rgba(240,220,195,${Math.min(1,alpha*3)})`; g.lineWidth = 1.6; g.beginPath();
    for (let i=0;i<=14;i++){ const [x,y] = GAL.proj(rad, a0 + i/14*.9, 0, v); i ? g.lineTo(x,y) : g.moveTo(x,y); } g.stroke();
  },
  planet(g, x, y, r, col, lx, ly, a=1){ // col: [light, mid, dark]; (lx,ly) = direction to the core
    g.globalAlpha = a;
    const gl = g.createRadialGradient(x,y,r*.5,x,y,r*2.6); gl.addColorStop(0, col[1]+'38'); gl.addColorStop(1, col[1]+'00'); g.fillStyle = gl; g.beginPath(); g.arc(x,y,r*2.6,0,7); g.fill();
    const L = Math.hypot(lx,ly)||1, ox = lx/L*r*.45, oy = ly/L*r*.45;
    const b = g.createRadialGradient(x+ox, y+oy, r*.1, x, y, r*1.05); b.addColorStop(0, col[0]); b.addColorStop(.5, col[1]); b.addColorStop(1, col[2]);
    g.fillStyle = b; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
    g.strokeStyle = 'rgba(255,240,225,.35)'; g.lineWidth = .8; g.beginPath(); g.arc(x,y,r+.6, Math.atan2(ly,lx)-1.2, Math.atan2(ly,lx)+1.2); g.stroke();
    g.globalAlpha = 1;
  }
};
const GAL_PLANETS = [['#F6D9DE','#B3203A','#3A0710'],['#F3E6D6','#C9A882','#5A4430'],['#FFFFFF','#DAD4C8','#4E4A44'],['#E9D5E0','#8E5A7A','#2A1624'],['#E2ECF6','#8FA7C8','#1E2A3C']];

/* ---------- galaxy dashboard panels (shown inside the knowledge map) ---------- */
function kmRing(p, sz, col){ const r = sz/2-5, C = 2*Math.PI*r; return `<svg viewBox="0 0 ${sz} ${sz}" width="${sz}" height="${sz}" class="cc-ring" aria-hidden="true"><circle cx="${sz/2}" cy="${sz/2}" r="${r}" class="t"/><circle cx="${sz/2}" cy="${sz/2}" r="${r}" class="f" style="stroke:${col};stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C*(1-clamp(p,0,1))).toFixed(1)}"/></svg>`; }
function kmSidesHTML(){
  const k = dkey(), done = todayDone(), total = todayTotal(), ns = typeof nowState==='function' ? nowState(k) : null;
  const saved = savedTotal(), goal = Number(state.settings.goal)||25000;
  const days = Array.from({length:14},(_,i)=>{ const kk = dkey(addDays(new Date(), i-13)); return { f: typeof focusOf==='function' ? focusOf(kk) : 0, t: countDone(kk) }; });
  const W = 300, H = 80, mx = Math.max(30, ...days.map(x=>x.f)), mt = Math.max(4, ...days.map(x=>x.t));
  const line = (key, m) => days.map((x,i)=>`${i?'L':'M'}${(i/13*W).toFixed(1)},${(H-6 - x[key]/m*(H-16)).toFixed(1)}`).join(' ');
  const blocks = typeof dayBlocks==='function' ? dayBlocks(k).filter(b=>!b.skip) : [], m = typeof nowMin==='function' ? nowMin() : 0;
  const upcoming = blocks.filter(b=>b.start + b.dur > m).slice(0,4);
  const todayP = `<div class="glass-km cc-panel"><div class="cc-ph"><span class="cc-ic">${ic('flag',16)}</span>Today</div>
      <div class="cc-row">${kmRing(total?done/total:0, 60, 'var(--cr-accent)')}<div><b class="num cc-big">${done}<small>/${total}</small></b><span class="tiny">${done>=4?'Streak day secured':`${Math.max(0,4-done)} more for a streak day`}</span></div></div></div>`;
  const goalP = `<div class="glass-km cc-panel"><div class="cc-ph"><span class="cc-ic">${ic('pound',16)}</span>£25k goal</div>
      <div class="cc-row">${kmRing(saved/goal, 60, 'var(--cr-sand)')}<div><b class="num cc-big">${money0(saved)}</b><span class="tiny">${Math.round(saved/goal*100)}% · ${money0(Math.max(0,goal-saved))} to go</span></div></div></div>`;
  return `<aside class="km-side l" aria-label="Today and layers">
      ${todayP}
      <div class="glass-km cc-panel km-legend">${kmLegend()}</div>
      <div class="glass-km cc-panel"><div class="cc-ph"><span class="cc-ic">${ic('chart',16)}</span>Last 14 days<span class="cc-leg"><i class="a"></i>focus <i class="b"></i>tasks</span></div>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="cc-svg" aria-label="Focus minutes and tasks for the last 14 days">
          ${[.25,.5,.75].map(f=>`<line x1="0" x2="${W}" y1="${H*f}" y2="${H*f}" class="gl"/>`).join('')}
          <path d="${line('f',mx)} L${W},${H} L0,${H}Z" class="fa"/><path d="${line('f',mx)}" class="la"/><path d="${line('t',mt)}" class="lb"/>
        </svg></div>
    </aside>
    <aside class="km-side r" aria-label="Next block and savings">
      <div class="glass-km cc-panel cc-float"><div class="cc-ph"><span class="cc-ic">${ic('clock',16)}</span>${ns && ns.kind==='now' ? 'Now' : 'Next block'}</div>
        ${ns && ns.b ? `<b class="cc-name">${esc(ns.b.name)}</b><span class="tiny">${ns.b.t} · ${ns.b.dur} min · ${esc(ns.b.cat)}</span>` : `<b class="cc-name">Day cleared</b><span class="tiny">Lights out at 22:45</span>`}</div>
      ${goalP}
      <div class="glass-km cc-panel"><div class="cc-ph"><span class="cc-ic">${ic('list',16)}</span>Upcoming</div>
        ${upcoming.length ? upcoming.map(b=>`<div class="cc-tr"><span class="num">${b.t}</span><b>${esc(b.name)}</b><span class="cc-tag">${esc(b.cat)}</span></div>`).join('') : '<div class="tiny">Nothing left today.</div>'}</div>
    </aside>
    <div class="km-mini" aria-label="Today at a glance">
      <div class="glass-km km-mi">${kmRing(total?done/total:0, 40, 'var(--cr-accent)')}<div><b class="num">${done}/${total}</b><small>today</small></div></div>
      <div class="glass-km km-mi">${kmRing(saved/goal, 40, 'var(--cr-sand)')}<div><b class="num">${money0(saved)}</b><small>of £25k</small></div></div>
      <div class="glass-km km-mi"><span class="cc-ic sm">${ic('flame',14)}</span><div><b class="num">${currentStreak()}</b><small>day streak</small></div></div>
    </div>`;
}
