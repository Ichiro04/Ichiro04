/* ============================================================
   ICONS
   ============================================================ */
const ICONS = {
  today:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"/>',
  dumbbell:'<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
  book:'<path d="M12 6.5C10.5 5 8.6 4.4 5 4.5v13c3.6-.1 5.5.5 7 2 1.5-1.5 3.4-2.1 7-2v-13c-3.6-.1-5.5.5-7 2Z"/><path d="M12 6.5v13"/>',
  wallet:'<path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h11.5a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17.5 18H6a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M3.5 9.5h13.2A2.3 2.3 0 0 1 19 11.8v.4a2.3 2.3 0 0 1-2.3 2.3H3.5"/>',
  chart:'<path d="M4 20V9M10 20V4M16 20v-7M22 20H2"/>',
  sparkles:'<path d="M12 3.5l1.5 4.2 4.2 1.5-4.2 1.5L12 15l-1.5-4.3L6.3 9.2l4.2-1.5L12 3.5Z"/><path d="M18.6 15.2l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/><path d="M5 16.4l.6 1.6 1.6.6-1.6.6L5 20.8l-.6-1.6L2.8 17l1.6-.6L5 16.4Z"/>',
  check:'<path d="M4.5 12.6l4.6 4.6L19.5 6.8"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  chevron:'<path d="M6 9.5l6 6 6-6"/>',
  arrowRight:'<path d="M5 12h13M12.5 5.5L19 12l-6.5 6.5"/>',
  flame:'<path d="M12 3s4.5 3.6 4.5 8.2a4.5 4.5 0 0 1-9 0c0-1.6.6-2.8 1.4-3.8.5 1.2 1.3 1.9 2.2 2.1-.3-2.4-.2-4.4.9-6.5Z"/>',
  clock:'<circle cx="12" cy="12" r="8.3"/><path d="M12 7.4V12l3.2 2"/>',
  play:'<path d="M8 5.6l10 6.4-10 6.4V5.6Z"/>',
  pause:'<path d="M9 5.5v13M15 5.5v13"/>',
  rotate:'<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v4.5h-4.5"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  trash:'<path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l1 12.2h9l1-12.2"/>',
  download:'<path d="M12 3.5v11M7.5 10.5l4.5 4.5 4.5-4.5M4.5 19.5h15"/>',
  upload:'<path d="M12 15.5v-11M7.5 8.5L12 4l4.5 4.5M4.5 19.5h15"/>',
  sliders:'<path d="M4 8h9M17 8h3M4 16h3M11 16h9"/><circle cx="15" cy="8" r="2.1"/><circle cx="9" cy="16" r="2.1"/>',
  edit:'<path d="M4.5 19.5l.7-3.9L15.9 4.9a2 2 0 0 1 2.9 0l.3.3a2 2 0 0 1 0 2.9L8.4 18.8l-3.9.7Z"/><path d="M14.5 6.3l3.2 3.2"/>',
  scale:'<path d="M4 18.5h16M6.5 18.5V9.2a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v9.3"/><path d="M12 11.5l2.2-2"/>',
  steps:'<path d="M8.5 4.2c1.6 0 2.4 1.3 2.4 3 0 1.6-.5 2.6-.5 4.2 0 1.1.4 1.7.4 2.7 0 1.6-1 2.4-2.3 2.4-1.5 0-2.6-1-2.6-2.7 0-1.6 1-2.6 1-4.4 0-1.9.2-5.2 1.6-5.2Z"/><path d="M16.6 9.4c1.3 0 2 1.1 2 2.5s-.4 2.1-.4 3.4c0 .9.3 1.4.3 2.2 0 1.3-.8 2-1.9 2-1.2 0-2.1-.8-2.1-2.2 0-1.3.8-2.1.8-3.6 0-1.5.1-4.3 1.3-4.3Z"/>',
  pen:'<path d="M4 20l4.2-1L20 7.2a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z"/><path d="M15.5 5.5l3 3"/>',
  mic:'<rect x="9" y="3" width="6" height="10" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7"/>',
  gears:'<circle cx="12" cy="12" r="3.1"/><path d="M12 3.2v2.4M12 18.4v2.4M4.6 7.6l2 1.2M17.4 15.2l2 1.2M4.6 16.4l2-1.2M17.4 8.8l2-1.2"/>',
  cart:'<path d="M3 4.5h2.2l2.4 11.2h10.6"/><path d="M6.6 8.4h13.1l-1.3 5.5H8"/><circle cx="9.4" cy="19.2" r="1.5"/><circle cx="17.6" cy="19.2" r="1.5"/>',
  compass:'<circle cx="12" cy="12" r="8.4"/><path d="M15.2 8.8l-1.9 4.5-4.5 1.9 1.9-4.5 4.5-1.9Z"/>',
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  calendar:'<rect x="3.5" y="5.5" width="17" height="15" rx="3"/><path d="M3.5 10.2h17M8 3.5v3.4M16 3.5v3.4"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.6 5.6L7.2 7.2M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>',
  moon:'<path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.6 8.6 0 1 0 20 14.2Z"/>',
  monitor:'<rect x="3" y="4.5" width="18" height="12" rx="2.5"/><path d="M9 20.5h6M12 16.5v4"/>',
  info:'<circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.2M12 8.2v.2"/>',
  piggy:'<path d="M4 13.2c0-3 2.9-5.4 6.6-5.4 1 0 2 .2 2.8.6L16.8 7v2.6c1.4.9 2.2 2.2 2.2 3.6 0 1.2-.6 2.3-1.7 3.1V20h-2.6v-1.6c-.6.2-1.3.3-2 .3h-1l-2 1.9v-2.2C5.6 17.3 4 15.5 4 13.2Z"/><circle cx="14.6" cy="12" r=".9" fill="currentColor" stroke="none"/>',
  yoga:'<circle cx="12" cy="5.2" r="2"/><path d="M12 8v4.2M12 12.2l-4 3.4M12 12.2l4 3.4M6 20h12M8 20l1-3M16 20l-1-3"/>',
  wave:'<path d="M2.5 9.5c2-2.6 4-2.6 6 0s4 2.6 6 0 4-2.6 6 0M2.5 15.5c2-2.6 4-2.6 6 0s4 2.6 6 0 4-2.6 6 0"/>',
  trend:'<path d="M3.5 17l5.5-5.5 3.5 3.2 6-6.2"/><path d="M14 8.5h4.5V13"/>',
  lock:'<rect x="5" y="10.5" width="14" height="9.5" rx="3"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  bolt:'<path d="M13.2 3L5.5 13.4h5L9.8 21l7.7-10.4h-5L13.2 3Z"/>'
};
function ic(name, size=20, cls=''){
  const p = ICONS[name] || ICONS.info;
  return `<svg class="${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

/* ============================================================
   RING + small chart helpers
   ============================================================ */
let gradSeq = 0;
function ring(pct, size=112, sw=9, opts={}){
  const r = (size - sw)/2, c = 2*Math.PI*r, id = 'rg'+(++gradSeq);
  const dash = c * clamp(pct,0,1);
  const from = opts.fromTo ? c : dash;
  const label = opts.label ?? Math.round(pct*100);
  const sub = opts.sub ?? '';
  return `<div class="ringwrap" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${opts.c1||'#710014'}"/><stop offset="55%" stop-color="${opts.c2||'#E8D7A6'}"/><stop offset="100%" stop-color="${opts.c3||'#C9946E'}"/>
      </linearGradient></defs>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${sw}"/>
      <circle class="ringfg" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${sw}"
        stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${dash.toFixed(1)}"
        style="--full:${from.toFixed(1)}px;--dash:${dash.toFixed(1)}px;filter:drop-shadow(0 3px 6px rgba(113,0,20,.35))"/>
    </svg>
    <div class="ringmid"><b>${label}${opts.pct!==false?'%':''}</b>${sub?`<span>${sub}</span>`:''}</div>
  </div>`;
}
const pctOf = (a,b)=> b ? a/b : 0;

function sparkline(points, opts={}){
  const w = 300, h = opts.h || 64, pad = 6;
  if (!points.length) return `<div class="tiny" style="padding:14px 0">No data yet.</div>`;
  const vals = points.map(p=>p.kg ?? p);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = Math.max(max-min, 0.6);
  const lo = min - span*0.25, hi = max + span*0.25;
  const X = i => pad + (points.length===1 ? (w-2*pad)/2 : i*(w-2*pad)/(points.length-1));
  const Y = v => h - pad - ((v-lo)/(hi-lo))*(h-2*pad);
  const line = vals.map((v,i)=>`${i?'L':'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${X(vals.length-1).toFixed(1)},${h} L${X(0).toFixed(1)},${h} Z`;
  const target = opts.target;
  const gid = 'sg'+(++gradSeq);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8C8278" stop-opacity=".32"/><stop offset="100%" stop-color="#8C8278" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${area}" fill="url(#${gid})"/>
    ${target?`<line x1="0" x2="${w}" y1="${Y(target).toFixed(1)}" y2="${Y(target).toFixed(1)}" stroke="#B38F6F" stroke-width="1.4" stroke-dasharray="5 5" opacity=".8"/>`:''}
    <path d="${line}" fill="none" stroke="#8A0A1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    ${vals.map((v,i)=> i===vals.length-1 ? `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="4" fill="#710014" stroke="#fff" stroke-width="2"/>` : '').join('')}
  </svg>`;
}

/* ============================================================
   TODAY'S TIDE — generative art
   one tide per finished task · one seabed layer per streak day
   all tasks done = orange sun · seeded by date
   ============================================================ */
const TIDE_COLORS = ['#710014','#8C8278','#C9946E','#E8D7A6','#8A0A1E','#B38F6F','#E6CDB0','#E8D7A6'];
function tideArt(k){
  const done = countDone(k);
  const total = tasksForDay(k).length || 1;
  const streak = currentStreak(parseKey(k));
  const all = done >= total;
  const rnd = mulberry32(hashStr(k + ':' + done + ':' + streak));
  const W = 360, H = 216, base = H - 10;

  const wavePath = (y0, amp, wl, ph) => {
    let d = `M0,${(y0 + Math.sin(ph)*amp).toFixed(1)}`;
    for (let x=8; x<=W; x+=8) d += ` L${x},${(y0 + Math.sin((x/wl)*Math.PI*2 + ph)*amp).toFixed(1)}`;
    return d;
  };

  // seabed: streak layers
  let seabed = '';
  const layers = Math.min(streak, 12);
  for (let i=0;i<layers;i++){
    const y = base - 4 - i*6.2;
    const amp = 2.4 + rnd()*3.2, wl = 70 + rnd()*90, ph = rnd()*6.28;
    const col = ['#8A0A1E','#710014','#8C8278','#4A0D14'][i%4];
    const op = 0.14 + (i/layers)*0.4;
    seabed += `<path d="${wavePath(y,amp,wl,ph)} L${W},${H} L0,${H} Z" fill="${col}" opacity="${(op*0.5).toFixed(2)}"/>`;
    seabed += `<path d="${wavePath(y,amp,wl,ph)}" fill="none" stroke="${col}" stroke-width="1.1" opacity="${op.toFixed(2)}"/>`;
  }

  // tides: one per done task
  let tides = '';
  const n = Math.min(done, 12);
  for (let i=0;i<n;i++){
    const y = base - 10 - i*8.4;
    const amp = 4 + rnd()*6.5, wl = 55 + rnd()*70, ph = rnd()*6.28;
    const col = TIDE_COLORS[i % TIDE_COLORS.length];
    const p = wavePath(y, amp, wl, ph);
    tides += `<g class="tide-wave" style="animation-delay:${(i*0.7).toFixed(1)}s;animation-duration:${(8+i*0.8).toFixed(1)}s">`;
    tides += `<path d="${p} L${W},${H} L0,${H} Z" fill="${col}" opacity="0.10"/>`;
    tides += `<path d="${p}" fill="none" stroke="${col}" stroke-width="1.9" stroke-linecap="round" opacity="0.85"/>`;
    tides += `</g>`;
  }

  // resting swell — the sea is never completely dead
  let swell = '';
  for (let i=0;i<3;i++){
    const y = base - 2 - i*3.4;
    const amp = 1.6 + rnd()*2.0, wl = 110 + rnd()*80, ph = rnd()*6.28;
    swell += `<path d="${wavePath(y,amp,wl,ph)}" fill="none" stroke="#F2F1ED" stroke-width="1" opacity="${(0.16 - i*0.04).toFixed(2)}"/>`;
  }

  // sun when everything is done
  let sun = '';
  if (all){
    sun = `<g class="tide-sun">
      <circle cx="292" cy="46" r="46" fill="url(#sunGlow)" opacity=".85"/>
      <circle cx="292" cy="46" r="19" fill="url(#sunCore)"/>
      ${Array.from({length:12},(_,i)=>{ const a = i*Math.PI/6; const x1=292+Math.cos(a)*25, y1=46+Math.sin(a)*25, x2=292+Math.cos(a)*33, y2=46+Math.sin(a)*33;
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#B38F6F" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`; }).join('')}
    </g>`;
  } else {
    sun = `<circle cx="292" cy="46" r="13" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.4" stroke-dasharray="3 5" opacity=".7"/>`;
  }

  // motes for finished tasks
  let motes = '';
  for (let i=0;i<done*3;i++){
    const x = 14 + rnd()*(W-28), y = 12 + rnd()*(H*0.6), r = 0.8 + rnd()*1.5;
    motes += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#F2F1ED" opacity="${(0.25+rnd()*0.5).toFixed(2)}"/>`;
  }

  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Tide art: ${done} of ${total} tasks complete, ${streak} day streak${all?', sun risen':''}">
    <defs>
      <linearGradient id="tideSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#C9946E" stop-opacity=".55"/>
        <stop offset="55%" stop-color="#8C8278" stop-opacity=".30"/>
        <stop offset="100%" stop-color="#8A0A1E" stop-opacity=".50"/>
      </linearGradient>
      <radialGradient id="sunGlow"><stop offset="0%" stop-color="#B38F6F" stop-opacity=".85"/><stop offset="60%" stop-color="#B38F6F" stop-opacity=".22"/><stop offset="100%" stop-color="#B38F6F" stop-opacity="0"/></radialGradient>
      <radialGradient id="sunCore"><stop offset="0%" stop-color="#F2F1ED"/><stop offset="55%" stop-color="#E6CDB0"/><stop offset="100%" stop-color="#B38F6F"/></radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#tideSky)"/>
    <path d="M0,${base-2} C60,${base-8} 120,${base+4} 180,${base-3} S300,${base-9} 360,${base-1}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1"/>
    ${sun}${swell}${seabed}${tides}${motes}
  </svg>`;
}

