/* ============================================================
   TODAY'S WAVE + TIPS — the day plan drawn as a flowing wave
   (planned effort vs done so far, a "now" marker riding it),
   and up to three tips worked out from his own data. Each tip
   can be dismissed for today; "Hide all" clears the row.
   ============================================================ */
const WV_CAT = { Training:1, Engineering:.9, English:.85, Career:.8, Walking:.55, Routine:.35 };
const WV = { raf:0, io:null, vis:false, t0:0, pick:null };
const WV_X0 = 6*60, WV_X1 = 23.5*60;

function waveData(){
  const k = dkey(), blocks = typeof dayBlocks==='function' ? dayBlocks(k).filter(b=>!b.skip && b.dur > 0) : [];
  return blocks.map(b=>({ b, c:b.start + b.dur/2, w:Math.max(18, b.dur*.55 + 12), a:(WV_CAT[b.cat] || .6)*Math.sqrt(Math.min(60, b.dur)/60), st:blockStatus(k, b) }));
}
function waveHTML(){
  const k = dkey(), D = waveData(), done = D.filter(d=>d.st==='done').length, foc = typeof focusOf==='function' ? focusOf(k) : 0;
  return `<section class="wv lg" aria-label="Today's wave">
    <div class="wv-h"><div><div class="h3">Today's wave</div><div class="tiny">Your day plan as one line: ${done} of ${D.length} blocks done · ${typeof fmtHM==='function' ? fmtHM(foc) : Math.round(foc)+' min'} focused</div></div>
      <div class="wv-leg"><span><i class="a"></i>Planned</span><span><i class="b"></i>Done</span></div></div>
    <div class="wv-stage"><canvas id="wvCanvas" aria-label="Wave of today's planned effort from 6 am to 11.30 pm, with what you have done so far filled in. Tap a dot to see the block."></canvas></div>
    <div class="wv-axis" aria-hidden="true">${[6,9,12,15,18,21].map(h=>`<span style="left:${((h*60-WV_X0)/(WV_X1-WV_X0)*100).toFixed(2)}%">${String(h).padStart(2,'0')}:00</span>`).join('')}</div>
    <div class="wv-pick tiny" id="wvPick" aria-live="polite">Tap a dot on the wave to see that block.</div>
    <div id="wvTips">${tipsHTML()}</div>
  </section>`;
}

/* ---------- tips from his data ---------- */
function waveTips(){
  const k = dkey(), r = dayRec(k), tips = [], now = new Date();
  const lastW = (()=>{ for (let i=0;i<14;i++){ if (dayRec(dkey(addDays(now, -i))).weight) return i; } return null; })();
  if (lastW === null || lastW > 6) tips.push({ id:'weigh', icon:'scale', t:'No weight logged this week. Weigh on Monday morning, after the toilet and before food.', go:'progress', b:'Log weight' });
  const tf = tasksForDay(k);
  if (tf.some(t=>t.id==='essay') && !taskDone(k,'essay')) tips.push({ id:'essay', icon:'pen', t:'Essay day: plan for 5 minutes, write for 30, check for 5. Aim for 280 words.', go:'learn', b:'Open essay' });
  if (!(state.savings||[]).length) tips.push({ id:'save', icon:'pound', t:'Log your opening balance so the £25k ring starts moving.', go:'money', b:'Open money' });
  if (currentStreak() === 0 && countDone(k) < 4) tips.push({ id:'streak', icon:'flame', t:`Four tasks makes a streak day. You have ${countDone(k)}: start with the two-minute ones.`, act:'tasks', b:'Show tasks' });
  if (!(r.sleep && r.sleep.bed)) tips.push({ id:'sleep', icon:'moon', t:'Add last night’s sleep. It is the first thing to check when energy dips.', act:'sleep', b:'Add sleep' });
  if (!Object.keys(state.knowledge||{}).length) tips.push({ id:'pack', icon:'book', t:'Read today’s knowledge pack: five points, five minutes.', go:'learn', b:'Read pack' });
  const dx = typeof dxBest==='function' ? dxBest() : 0; if (dx < 6) tips.push({ id:'dwg', icon:'target', t:`Drawing test best: ${dx}/8. Two more tries this week should get you to 6.`, lab:'dwg', b:'Take the test' });
  if (!(state.cadws && state.cadws.done && state.cadws.done.bracket)) tips.push({ id:'cad', icon:'wrench', t:'Model the L-bracket in the CAD workspace. It takes about 10 minutes.', lab:'cad', b:'Open CAD' });
  const off = ((state.tipsOff||{})[k]) || [];
  return off.includes('*') ? [] : tips.filter(t=>!off.includes(t.id));
}
function tipsHTML(){
  const all = waveTips(); if (!all.length) return '';
  const show = all.slice(0, 3);
  return `<div class="wv-tips">
    <div class="wv-tiph"><b>Tips for you</b><span class="tiny">from your own numbers${all.length > 3 ? ` · ${all.length - 3} more after these` : ''}</span><button class="wv-hideall" data-wv="hideall">Hide all for today</button></div>
    <div class="wv-tipr">${show.map((t,i)=>`<div class="wv-tip lg-chip" style="--i:${i}" data-tip="${t.id}">
      <span class="wv-ti">${ic(t.icon,16)}</span><p>${esc(t.t)}</p>
      <div class="wv-ta"><button class="wv-go" data-wv="go" data-id="${t.id}">${esc(t.b)}</button><button class="wv-x" data-wv="x" data-id="${t.id}" aria-label="Dismiss this tip for today">${ic('x',14)}</button></div>
    </div>`).join('')}</div>
  </div>`;
}
function tipOff(id){
  const k = dkey(); state.tipsOff = state.tipsOff || {}; Object.keys(state.tipsOff).forEach(d=>{ if (d !== k) delete state.tipsOff[d]; });
  const list = state.tipsOff[k] || (state.tipsOff[k] = []); if (!list.includes(id)) list.push(id); save();
}
document.addEventListener('click', e=>{
  const b = e.target.closest('[data-wv]'); if (!b) return; e.stopPropagation();
  const a = b.dataset.wv, id = b.dataset.id, box = document.getElementById('wvTips');
  const refresh = () => { if (!box) return; box.innerHTML = tipsHTML(); };
  if (a==='x'){ const card = b.closest('.wv-tip'); tipOff(id); if (card && !motionOff()){ card.classList.add('out'); setTimeout(refresh, 380); } else refresh(); }
  else if (a==='hideall'){ tipOff('*'); const row = box && box.querySelector('.wv-tips'); if (row && !motionOff()){ row.classList.add('out'); setTimeout(refresh, 420); } else refresh(); toast('Tips hidden for today. They come back tomorrow.', 'ok', 2000); }
  else if (a==='go'){ const t = waveTips().find(x=>x.id===id); if (!t) return;
    if (t.go) setTab(t.go);
    else if (t.lab){ labPane = t.lab; setTab('lab', { force:true }); setTimeout(()=>{ try { showLabPane(t.lab); } catch(_){} }, 80); }
    else if (t.act==='sleep'){ const i = document.querySelector('#view-today .ds-sleep input'); if (i){ i.scrollIntoView({ behavior: motionOff() ? 'auto' : 'smooth', block:'center' }); setTimeout(()=>i.focus(), 350); } }
    else if (t.act==='tasks'){ const el = document.querySelector('#view-today .tt-row, #view-today .ds-three'); if (el) el.scrollIntoView({ behavior: motionOff() ? 'auto' : 'smooth', block:'center' }); } }
}, true);

/* ---------- the wave ---------- */
function waveDraw(now){
  const cv = document.getElementById('wvCanvas'); if (!cv) return;
  const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio||1); if (!W) return;
  if (cv.width !== Math.round(W*dpr)){ cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr); }
  const g = cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
  const dark = document.documentElement.getAttribute('data-theme') === 'dark', still = motionOff(), T = still ? 0 : (now - WV.t0)/1000;
  const D = WV.data || (WV.data = waveData()), N = 140, base = H - 14, top = 16, X = m => (m - WV_X0)/(WV_X1 - WV_X0)*W;
  const amp = (m, onlyDone) => D.reduce((s,d)=>{ if (onlyDone && d.st!=='done' && d.st!=='partly') return s; const k = onlyDone && d.st==='partly' ? .5 : 1; return s + d.a*k*Math.exp(-Math.pow((m - d.c)/d.w, 2)); }, 0);
  let mx = .4; for (let i=0;i<=N;i++){ mx = Math.max(mx, amp(WV_X0 + i/N*(WV_X1-WV_X0))); }
  const Y = (v, i, ph) => base - (v/mx)*(base - top)*.86 - (still ? 0 : Math.sin(i*.17 + T*1.4 + ph)*2.4 + Math.sin(i*.07 - T*.9 + ph)*1.6);
  const curve = (onlyDone, ph) => { const pts = []; for (let i=0;i<=N;i++){ const m = WV_X0 + i/N*(WV_X1-WV_X0); pts.push([i/N*W, Y(amp(m, onlyDone), i, ph)]); } return pts; };
  const path = (pts, close) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i=1;i<pts.length-1;i++){ const xc = (pts[i][0]+pts[i+1][0])/2, yc = (pts[i][1]+pts[i+1][1])/2; g.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc); } g.lineTo(pts[pts.length-1][0], pts[pts.length-1][1]); if (close){ g.lineTo(W, H); g.lineTo(0, H); g.closePath(); } };
  // grid
  g.strokeStyle = dark ? 'rgba(242,241,237,.06)' : 'rgba(22,22,22,.06)'; g.lineWidth = 1; [6,9,12,15,18,21].forEach(h=>{ const x = X(h*60); g.beginPath(); g.moveTo(x, top); g.lineTo(x, H); g.stroke(); });
  // planned: two offset glassy layers for depth
  [[.9, .5], [0, 1]].forEach(([ph, k])=>{ const pts = curve(false, ph); path(pts, true); const gr = g.createLinearGradient(0, top, 0, H); gr.addColorStop(0, dark ? `rgba(201,168,130,${.34*k})` : `rgba(179,143,111,${.3*k})`); gr.addColorStop(1, 'rgba(179,143,111,0)'); g.fillStyle = gr; g.fill();
    if (k === 1){ path(pts, false); g.strokeStyle = dark ? '#D9BC9C' : '#B38F6F'; g.lineWidth = 2; g.stroke(); WV.pts = pts; } });
  // done so far: crimson wave clipped to the time already passed
  const nm = typeof nowMin==='function' ? nowMin() : 0, nx = clamp(X(nm), 0, W);
  const dp = curve(true, 0); g.save(); path(dp, true); const dg = g.createLinearGradient(0, top, 0, H); dg.addColorStop(0, dark ? 'rgba(194,48,74,.75)' : 'rgba(138,10,30,.62)'); dg.addColorStop(1, 'rgba(113,0,20,.04)'); g.fillStyle = dg; g.fill();
  path(dp, false); g.strokeStyle = dark ? '#E05A72' : '#8A0A1E'; g.lineWidth = 2.2; g.stroke(); g.restore();
  // liquid highlight sweeping along the planned line
  if (!still && WV.pts){ const sx = ((T*.08) % 1.3 - .15)*W; const hl = g.createLinearGradient(sx - 60, 0, sx + 60, 0); hl.addColorStop(0,'rgba(255,255,255,0)'); hl.addColorStop(.5, dark ? 'rgba(255,244,230,.55)' : 'rgba(255,255,255,.9)'); hl.addColorStop(1,'rgba(255,255,255,0)'); path(WV.pts, false); g.strokeStyle = hl; g.lineWidth = 3; g.stroke(); }
  // block dots
  WV.dots = D.map(d=>{ const i = Math.round((d.c - WV_X0)/(WV_X1-WV_X0)*N), p = WV.pts && WV.pts[clamp(i,0,N)]; if (!p) return null; const r = WV.pick===d ? 6 : 4.2;
    g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fillStyle = d.st==='done' ? (dark ? '#E05A72' : '#8A0A1E') : d.st==='missed' ? (dark ? '#2A1A1C' : '#fff') : (dark ? '#1C1A19' : '#FBFAF7'); g.fill();
    g.lineWidth = 1.8; g.strokeStyle = d.st==='missed' ? '#C2304A' : d.st==='done' ? 'rgba(255,255,255,.8)' : (dark ? '#D9BC9C' : '#B38F6F'); g.stroke(); return { d, x:p[0], y:p[1] }; }).filter(Boolean);
  // now marker riding the wave
  if (nm >= WV_X0 && nm <= WV_X1 && WV.pts){ const i = clamp(Math.round(nx/W*N), 0, N), py = WV.pts[i][1];
    g.setLineDash([3,4]); g.strokeStyle = dark ? 'rgba(242,241,237,.35)' : 'rgba(22,22,22,.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(nx, top - 6); g.lineTo(nx, H); g.stroke(); g.setLineDash([]);
    const pul = still ? 0 : (Math.sin(T*2.4)+1)/2; g.beginPath(); g.arc(nx, py, 9 + pul*5, 0, 7); g.fillStyle = dark ? `rgba(224,90,114,${.25 - pul*.15})` : `rgba(138,10,30,${.18 - pul*.1})`; g.fill();
    g.beginPath(); g.arc(nx, py, 5, 0, 7); g.fillStyle = dark ? '#E05A72' : '#8A0A1E'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
    g.font = '700 11px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; const lab = 'Now ' + new Date().toTimeString().slice(0,5), tw = g.measureText(lab).width + 12, lx = clamp(nx - tw/2, 2, W - tw - 2);
    g.fillStyle = dark ? 'rgba(30,28,27,.9)' : 'rgba(255,255,255,.92)'; g.beginPath(); g.roundRect ? g.roundRect(lx, 1, tw, 18, 9) : g.rect(lx, 1, tw, 18); g.fill(); g.fillStyle = dark ? '#F2F1ED' : '#161616'; g.fillText(lab, lx + 6, 14); }
}
function waveLoop(now){ WV.raf = 0; if (!WV.vis || !document.getElementById('wvCanvas')) return; waveDraw(now); if (!motionOff()) WV.raf = requestAnimationFrame(waveLoop); }
function waveMount(){
  const cv = document.getElementById('wvCanvas'); if (!cv) return; WV.data = null; WV.t0 = performance.now();
  cv.addEventListener('click', e=>{ const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let best = null, bd = 26;
    (WV.dots||[]).forEach(o=>{ const d = Math.hypot(o.x - x, o.y - y); if (d < bd){ bd = d; best = o; } });
    if (!best) (WV.dots||[]).forEach(o=>{ const d = Math.abs(o.x - x); if (d < bd){ bd = d; best = o; } });
    WV.pick = best ? best.d : null; const p = document.getElementById('wvPick');
    if (p) p.innerHTML = best ? `<b>${esc(best.d.b.t)} · ${esc(best.d.b.name)}</b> · ${best.d.b.dur} min · ${esc(best.d.b.cat)} · ${best.d.st ? ({done:'done',partly:'partly done',missed:'missed'}[best.d.st]||best.d.st) : 'not done yet'}` : 'Tap a dot on the wave to see that block.';
    if (motionOff()) waveDraw(performance.now()); });
  if (WV.io) WV.io.disconnect();
  WV.io = new IntersectionObserver(es=>{ WV.vis = es[0].isIntersecting; if (WV.vis && !WV.raf) WV.raf = requestAnimationFrame(waveLoop); }); WV.io.observe(cv);
  waveDraw(performance.now());
}
