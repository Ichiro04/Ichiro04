/* ============================================================
   DAILY SYSTEM — adapted from the Daily System V104 template
   (structure only; colours and type stay F1 pit wall)
   now card · up next · the 3 that matter · feel strip ·
   day plan timeline · number cards · focus chart · time bars
   Day records gain: plan{id:status}, pstep{id:n}, feel{}, sleep{}, shape
   ============================================================ */
const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
const fmtHM = m => { m = Math.max(0, Math.round(m)); const h = Math.floor(m/60), r = m%60; return h ? `${h} h${r?` ${r} min`:''}` : `${r} min`; };
const hhmm = m => `${pad2(Math.floor(m/60)%24)}:${pad2(Math.round(m)%60)}`;
function dayBlocks(k){
  const wd = isoWeekday(parseKey(k)), B = [];
  B.push({ id:'start', t:'07:00', min:10, name:'Morning start', note:'Water, stretch, read the plan', cat:'Routine', steps:['Glass of water','Two-minute stretch','Read today’s plan'] });
  if (wd===0) B.push({ id:'weigh', t:'07:12', min:5, name:'Monday weigh-in', note:'After the toilet, before food', cat:'Routine', task:'weigh', steps:['Scales on a hard floor','Weigh once','Log it in Progress'], go:'progress' });
  const strength = [0,1,3,4].includes(wd);
  B.push(strength ? { id:'train', t:'07:30', min:40, name:'Strength session', note:todaysSession(parseKey(k)).day, cat:'Training', task:'train', steps:['Warm up for 5 minutes','Work every set','Log the sets in Train'], go:'train', top:true }
                  : { id:'mobility', t:'07:30', min:25, name:'Mobility and easy walk', note:'Loose hips and shoulders', cat:'Training', task:'mobility', steps:['Cat–cow and hips','Easy walk outside','Tick it off'], go:'train', top:true });
  B.push(wd===6 ? { id:'career', t:'09:30', min:20, name:'Career 15 minutes', note:'Portfolio, drawing or interview questions', cat:'Career', task:'career', steps:['Pick one piece','Work for 15 minutes','Note the next step'], go:'learn', top:true }
                : { id:'jobs', t:'09:30', min:30, name:'Job search', note:'Two applications or one follow-up', cat:'Career', steps:['Pick two roles','Tailor the first lines','Send and note it'], top:true });
  if ([0,2,4].includes(wd)) B.push({ id:'essay', t:'12:30', min:40, name:'IELTS essay', note:'Task 2, 270+ words', cat:'English', task:'essay', steps:['Plan for 5 minutes','Write for 30 minutes','Check for 5 minutes'], go:'learn', top:true });
  else if ([1,3,5].includes(wd)) B.push({ id:'speaking', t:'12:30', min:15, name:'Speaking cue card', note:'1 minute to plan, 2 to talk', cat:'English', task:'speaking', steps:['Read the card','Plan for 1 minute','Talk for 2 minutes'], go:'learn', top:true });
  B.push({ id:'vocab', t:'13:15', min:15, name:'Vocabulary drill', note:'10 words in your own sentences', cat:'English', task:'vocab', steps:['Read the words','Write a sentence each','Say them out loud'], go:'learn' });
  B.push(wd<=4 ? { id:'knowledge', t:'15:00', min:20, name:'Knowledge pack', note:'Read, then recall out loud', cat:'Engineering', task:'knowledge', steps:['Read the pack','Study the diagram','Answer the question'], go:'learn' }
               : { id:'labpractice', t:'15:00', min:20, name:'Lab practice', note:'3D CAD or the drawing test', cat:'Engineering', steps:['Open the Lab','One drawing test','Note what you missed'], go:'lab' });
  B.push({ id:'walk', t:'18:00', min:30, name:'Walk', note:'Towards 8,000 steps', cat:'Walking', task:'walk', steps:['Shoes on','Walk 30 minutes','Log your steps'] });
  if (wd===6) B.push({ id:'review', t:'19:30', min:10, name:'Weekly review', note:'Pick next week’s focus', cat:'Routine', task:'review', steps:['Look at the week','Pick one focus','Ask the coach'], go:'coach', top:false });
  B.push({ id:'close', t:'21:30', min:10, name:'Log and close the day', note:'Spending, three lines, phone away', cat:'Routine', task:'log', steps:['Log every spend','Write three lines','Phone away'], go:'money' });
  const shape = dayRec(k).shape || 'full';
  B.forEach(b=>{ b.start = toMin(b.t); b.skip = shape==='minimum' && !b.top; b.dur = shape==='short' ? Math.max(5, Math.round(b.min*0.6/5)*5) : shape==='minimum' ? (b.top ? Math.min(b.min,15) : 0) : b.min; });
  return B;
}
function blockStatus(k, b){ const r = dayRec(k); return (r.plan && r.plan[b.id]) || (b.task && taskDone(k, b.task) ? 'done' : ''); }
function nowMin(){ const d = new Date(); return d.getHours()*60 + d.getMinutes() + d.getSeconds()/60; }
function nowState(k){
  const B = dayBlocks(k).filter(b=>!b.skip), m = nowMin();
  const cur = B.find(b=>m >= b.start && m < b.start + b.dur && blockStatus(k,b) !== 'done');
  if (cur) return { kind:'now', b:cur, B };
  const next = B.find(b=>b.start > m && !blockStatus(k,b));
  if (next) return { kind:'next', b:next, B };
  const missed = B.find(b=>!blockStatus(k,b));
  if (missed) return { kind:'late', b:missed, B };
  return { kind:'clear', b:null, B };
}
function ringSVG(pct, size, label, sub, cls=''){
  const r = size/2 - 7, C = 2*Math.PI*r;
  return `<div class="ds-ring ${cls}" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" class="rt"/><circle cx="${size/2}" cy="${size/2}" r="${r}" class="rf" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C*(1-clamp(pct,0,1))).toFixed(1)}"/></svg><div class="ds-rl"><b class="num">${label}</b>${sub?`<small>${sub}</small>`:''}</div></div>`;
}
function nowCardHTML(){
  const k = dkey(), S = nowState(k), m = nowMin();
  if (S.kind === 'clear') return `<div class="glass ds-now" id="nowCard"><div class="ds-now-in">${ringSVG(1,104,'✓','day done','good')}<div class="ds-mid"><div class="ds-pills"><span class="pw-tag good">Chequered flag</span></div><h2>Every block is done.</h2><p>Eat well, phone away by 22:15, lights out at 22:45.</p></div></div></div>`;
  const b = S.b, i = S.B.indexOf(b) + 1, step = (dayRec(k).pstep || {})[b.id] || 0;
  let pct, label, sub, tag;
  if (S.kind === 'now'){ const el = m - b.start; pct = el / b.dur; label = (b.dur - el) < 1 ? '<1′' : fmtHM(b.dur - el).replace(' min','′'); sub = 'left'; tag = `<span class="pw-tag live">Now · ${b.t} – ${hhmm(b.start+b.dur)}</span>`; }
  else if (S.kind === 'next'){ const wait = b.start - m; pct = 1 - Math.min(1, wait/120); label = wait < 60 ? Math.ceil(wait) + '′' : fmtHM(wait).replace(' min','′'); sub = 'to start'; tag = `<span class="pw-tag next">Next · starts at ${b.t}</span>`; }
  else { pct = 0; label = '!'; sub = 'catch up'; tag = `<span class="pw-tag late">Still open · was ${b.t}</span>`; }
  return `<div class="glass ds-now" id="nowCard">
    <div class="ds-now-in">
      ${ringSVG(pct, 104, label, sub, S.kind)}
      <div class="ds-mid">
        <div class="ds-pills">${tag}<span class="tiny num">block ${i} of ${S.B.length} · ${esc(b.cat)} · ${b.dur} min</span></div>
        <h2>${esc(b.name)}</h2>
        <p><b>Step ${Math.min(step+1,3)}:</b> ${esc(b.steps[Math.min(step,2)])}. <span class="tiny">${esc(b.note)}</span></p>
        <ol class="ds-steps">${b.steps.map((s,j)=>`<li class="${j<step?'ok':j===step?'cur':''}"><button data-a="ds-step" data-id="${b.id}" data-n="${j<step?j:j+1}" aria-label="${esc(s)}"><span class="num">${j<step?'✓':j+1}</span><b>${esc(s.split(' ')[0])}</b></button></li>`).join('')}</ol>
      </div>
      <div class="ds-acts">
        <div class="ds-st3">${[['done','Done'],['partly','Partly'],['missed','Missed']].map(([v,l])=>`<button class="ds-st ${v}" data-a="ds-status" data-id="${b.id}" data-v="${v}">${l}</button>`).join('')}</div>
        ${b.go ? `<button class="btn btn-primary btn-sm" data-a="go" data-go="${b.go}">Open ${b.go==='learn'?'Learn':b.go==='train'?'Train':b.go==='lab'?'the Lab':b.go==='money'?'Money':b.go==='coach'?'Coach':'Progress'}</button>` : ''}
      </div>
    </div>
  </div>`;
}
function upNextStrip(){
  const k = dkey(), B = dayBlocks(k).filter(b=>!b.skip), m = nowMin(), cur = nowState(k);
  const nx = B.find(b=>b.start > m && !blockStatus(k,b) && (!cur.b || b.id !== cur.b.id));
  if (!nx) return `<div class="racectl" id="upStrip"><span class="rc-tag">${ic('flag',14)} Up next</span><span class="rc-msg"><b>Lights out at 22:45</b><span>Phone away by 22:15 · aim for 7 h 30 of sleep</span></span></div>`;
  return `<div class="racectl" id="upStrip"><span class="rc-tag">${ic('flag',14)} Up next</span><span class="rc-msg"><b class="num">Starts in ${fmtHM(nx.start - m)}</b><span>${nx.t} · ${esc(nx.name)} · ${nx.dur} min</span></span></div>`;
}
function threeHTML(){
  const k = dkey(), all = dayBlocks(k).filter(b=>!b.skip), m = nowMin();
  let top = all.filter(b=>b.top);
  all.filter(b=>!b.top && b.cat!=='Routine').forEach(b=>{ if (top.length < 3) top.push(b); });
  top = top.slice(0,3).sort((a,b)=>a.start-b.start);
  const st = top.map(b=>blockStatus(k,b)), done = st.filter(s=>s==='done').length, n3 = top.length;
  const firstOpen = top.findIndex((b,i)=>st[i]!=='done');
  return `<div class="glass ds-three">
    <div class="ds-3sum"><div class="h3">The 3 that matter</div>
      <div class="row" style="gap:12px">${ringSVG(n3?done/n3:0, 70, `${done}/${n3}`, '', 'good')}<div class="tiny"><b class="num" style="font-size:15px;color:var(--pw-ink)">${done} of ${n3}</b> done<br>${n3-done} still ahead</div></div>
      <div class="tiny">Tap a tile to mark it</div></div>
    ${top.map((b,i)=>{ const s = st[i], cls = s==='done' ? 'done' : i===firstOpen ? 'next' : 'later', run = m >= b.start && m < b.start+b.dur ? (m-b.start)/b.dur : s==='done' ? 1 : 0;
      return `<button class="ds-tile ${cls}" data-a="ds-status" data-id="${b.id}" data-v="${s==='done'?'':'done'}">
        <span class="ds-ttop"><span class="ds-ttag">${cls==='done'?'Done':cls==='next'?'Next':'Later'}</span><span class="tiny num">${b.t}</span></span>
        <span class="ds-tname">${esc(b.name)}</span>
        <span class="ds-bar"><i style="width:${Math.round(run*100)}%"></i></span>
        <span class="ds-tfoot"><span class="num">${b.dur} min</span><span>${s==='done'?'✓':cls==='next'?'up next':esc(b.cat)}</span></span></button>`; }).join('')}
  </div>`;
}
function sleepMins(r){ const s = r.sleep || {}; if (!s.bed || !s.up) return null; let d = toMin(s.up) - toMin(s.bed); if (d <= 0) d += 1440; return d; }
function feelHTML(){
  const k = dkey(), r = dayRec(k), f = r.feel || {}, s = r.sleep || {}, sl = sleepMins(r), shape = r.shape || 'full';
  return `<div class="glass ds-feel">
    <div class="ds-fi"><span class="ds-it t-ye">${ic('bolt',16)}</span><div><small>Energy</small><div class="ds-dots">${[1,2,3,4,5].map(n=>`<button class="${(f.energy||0)>=n?'on':''}" data-a="ds-feel" data-id="energy" data-v="${n}" aria-label="Energy ${n} of 5"></button>`).join('')}<b class="num">${f.energy||'–'}/5</b></div></div></div>
    <div class="ds-fi"><span class="ds-it t-rd">${ic('flame',16)}</span><div><small>Mood</small><div class="ds-seg">${['Low','OK','Good','Great'].map(v=>`<button class="${f.mood===v?'on':''}" data-a="ds-feel" data-id="mood" data-v="${v}">${v}</button>`).join('')}</div></div></div>
    <div class="ds-fi"><span class="ds-it t-gr">${ic('lock',16)}</span><div><small>Phone</small><button class="ds-sw ${f.phone?'on':''}" data-a="ds-feel" data-id="phone" data-v="${f.phone?'':'1'}" role="switch" aria-checked="${!!f.phone}"><i></i></button><span class="tiny">${f.phone?`Away ✓${f.phoneAt?' since '+f.phoneAt:''}`:'On the desk'}</span></div></div>
    <div class="ds-fi"><span class="ds-it t-pu">${ic('moon',16)}</span><div><small>Sleep</small><div class="ds-sleep"><input type="time" value="${s.bed||''}" data-sleep="bed" aria-label="Asleep at"><span>to</span><input type="time" value="${s.up||''}" data-sleep="up" aria-label="Woke at"></div><span class="tiny num">${sl!=null?`slept ${fmtHM(sl)}`:'add last night'}</span></div></div>
    <div class="ds-fi ds-shape"><small>Day shape</small><div class="ds-seg">${[['full','Full'],['short','Short'],['minimum','Minimum']].map(([v,l])=>`<button class="${shape===v?'on':''}" data-a="ds-shape" data-v="${v}">${l}</button>`).join('')}</div><span class="tiny">${shape==='full'?'Every block at full length':shape==='short'?'Blocks cut to 60%':'Only the 3 that matter, 15 min each'}</span></div>
  </div>`;
}
const STATUS_TAG = { done:['Done','good'], partly:['Partly','next'], missed:['Missed','late'], now:['Now','live'], '':['Open','muted'], skip:['Skipped','muted'] };
function planHTML(){
  const k = dkey(), B = dayBlocks(k), S = nowState(k), m = nowMin();
  return `<div class="glass ds-plan"><ol class="ds-way">${B.map(b=>{
    const s = blockStatus(k,b), isNow = S.kind==='now' && S.b && S.b.id===b.id, key = b.skip ? 'skip' : isNow && !s ? 'now' : s, [lbl,tone] = STATUS_TAG[key];
    const next = s==='' ? 'done' : s==='done' ? 'partly' : s==='partly' ? 'missed' : '';
    return `<li class="ds-wp ${key||'open'} ${b.start+b.dur < m && !s && !b.skip ? 'overdue':''}"><span class="ds-wt num">${b.t}</span><span class="ds-wn"></span>
      <span class="ds-wb"><b>${esc(b.name)}</b><small>${b.skip?'skipped on a minimum day':`${esc(b.note)} · ${b.dur} min`}</small></span>
      ${b.skip?`<span class="pw-tag muted">Skipped</span>`:`<button class="pw-tag ${tone}" data-a="ds-status" data-id="${b.id}" data-v="${next}" aria-label="${esc(b.name)}: ${lbl}. Tap to change">${lbl}</button>`}</li>`; }).join('')}
    <li class="ds-wp sleep"><span class="ds-wt num">22:45</span><span class="ds-wn"></span><span class="ds-wb"><b>Lights out</b><small>Aim for 7 h 30 before a 06:15 start</small></span><span class="pw-tag muted">Sleep</span></li>
  </ol><div class="tiny" style="margin-top:8px">Tap a tag to cycle Done → Partly → Missed → Open. Done also ticks the matching task.</div></div>`;
}
function focusOf(k){ return dayBlocks(k).reduce((s,b)=>{ const st = blockStatus(k,b); return s + (st==='done' ? b.dur : st==='partly' ? b.dur/2 : 0); }, 0); }
function numbersHTML(){
  const k = dkey(), f = focusOf(k), sl = sleepMins(dayRec(k));
  const ws = startOfWeek(); let tot = 0, dn = 0, best = 0;
  const since = state.createdAt || dkey();
  for (let i=0;i<7;i++){ const kk = dkey(addDays(ws,i)); if (addDays(ws,i) > new Date()) break; if (kk < since) continue; const B = dayBlocks(kk).filter(b=>!b.skip); tot += B.length; dn += B.filter(b=>blockStatus(kk,b)==='done').length; best = Math.max(best, focusOf(kk)); }
  const tile = (icon,tone,lbl,val,unit,ctx) => `<div class="glass ds-num"><div class="ds-kh"><span class="ds-it ${tone}">${ic(icon,16)}</span><span>${lbl}</span></div><div class="ds-kv num">${val}<small>${unit}</small></div><div class="tiny">${ctx}</div></div>`;
  return `<div class="ds-nums">
    ${tile('clock','t-rd','Focus today', f>=60?Math.floor(f/60):Math.round(f), f>=60?` h ${pad2(Math.round(f)%60)}`:' min', `best this week <b class="num">${fmtHM(best)}</b>`)}
    ${tile('moon','t-pu','Sleep last night', sl!=null?Math.floor(sl/60):'–', sl!=null?` h ${pad2(sl%60)}`:'', sl!=null?`bed ${(dayRec(k).sleep||{}).bed} · up ${(dayRec(k).sleep||{}).up}`:'add times in the strip above')}
    ${tile('target','t-gr','Blocks this week', `${dn}`, ` of ${tot}`, `<b class="num">${tot?Math.round(dn/tot*100):0}%</b> of the plan so far`)}
    ${tile('flame','t-pu','Streak', currentStreak(), ' days', 'four tasks a day keeps it alive')}
  </div>`;
}
function focusChartHTML(){
  const days = Array.from({length:14},(_,i)=>{ const d = addDays(new Date(), i-13), k = dkey(d); return { k, d, v: focusOf(k) }; });
  const mx = Math.max(60, ...days.map(x=>x.v)), W = 340, H = 120, bw = W/14, best = Math.max(...days.map(x=>x.v));
  const avg = days.reduce((s,x)=>s+x.v,0)/14;
  return `<div class="glass ds-chart"><div class="ds-ch"><div class="h3">Focus minutes · last 14 days</div><span class="tiny num">${Math.round(days[13].v)} min today</span></div>
    <svg viewBox="0 0 ${W} ${H+18}" class="ds-bars14" role="img" aria-label="Focus minutes for the last 14 days">
      ${[0.25,0.5,0.75,1].map(f=>`<line x1="0" x2="${W}" y1="${(H - H*f).toFixed(1)}" y2="${(H - H*f).toFixed(1)}" class="gl"/>`).join('')}
      ${days.map((x,i)=>{ const h = Math.max(2, x.v/mx*(H-8)); return `<rect x="${(i*bw+3).toFixed(1)}" y="${(H-h).toFixed(1)}" width="${(bw-6).toFixed(1)}" height="${h.toFixed(1)}" rx="3" class="${i===13?'today':x.v===best&&best>0?'best':''}" style="animation-delay:${i*30}ms"/><text x="${(i*bw+bw/2).toFixed(1)}" y="${H+13}" text-anchor="middle">${'MTWTFSS'[isoWeekday(x.d)]}</text>`; }).join('')}
      <line x1="0" x2="${W}" y1="${(H - avg/mx*(H-8)).toFixed(1)}" y2="${(H - avg/mx*(H-8)).toFixed(1)}" class="avg"/>
      ${(()=>{ const P = days.map((x,i)=>[i*bw+bw/2, H - Math.max(2, x.v/mx*(H-8)) - 4]); let dd = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`; for (let i=1;i<P.length;i++){ const a = P[i-1], b = P[i], cx = (a[0]+b[0])/2; dd += ` C${cx.toFixed(1)},${a[1].toFixed(1)} ${cx.toFixed(1)},${b[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`; } return `<path d="${dd}" class="wave"/><circle cx="${P[13][0].toFixed(1)}" cy="${P[13][1].toFixed(1)}" r="4" class="wave-end"/>`; })()}
    </svg><div class="tidefoot"><span class="legend"><i class="lg-trace"></i>today</span><span class="legend"><i class="lg-best"></i>best day</span><span class="legend"><i style="background:var(--pw-yellow)"></i>average ${Math.round(avg)} min</span></div></div>`;
}
function timeBarsHTML(){
  const ws = startOfWeek(), cats = {};
  for (let i=0;i<7;i++){ const kk = dkey(addDays(ws,i)); dayBlocks(kk).forEach(b=>{ const st = blockStatus(kk,b); const v = st==='done' ? b.dur : st==='partly' ? b.dur/2 : 0; cats[b.cat] = (cats[b.cat]||0) + v; }); }
  const order = [['Training','f-rd'],['English','f-bl'],['Engineering','f-pu'],['Career','f-ye'],['Walking','f-gr'],['Routine','f-mu']], mx = Math.max(30, ...Object.values(cats));
  return `<div class="glass ds-tbars"><div class="ds-ch"><div class="h3">Where the time went</div><span class="tiny">this week</span></div>
    ${order.map(([c,cl])=>`<div class="ds-brow"><span>${c}</span><span class="ds-bar"><i class="${cl}" style="width:${((cats[c]||0)/mx*100).toFixed(0)}%"></i></span><b class="num">${fmtHM(cats[c]||0).replace(' min','m').replace(' h','h')}</b></div>`).join('')}</div>`;
}
function daySystemHTML(){
  return `<section class="ds">
    ${nowCardHTML()}
    ${upNextStrip()}
    <div class="ds-row2">${threeHTML()}${feelHTML()}</div>
    ${numbersHTML()}
    <div class="ds-row3"><div><div class="h2">Day plan <span class="side num">${dayBlocks(dkey()).filter(b=>!b.skip).length} blocks</span></div>${planHTML()}</div>
      <div><div class="h2">Focus <span class="side">and where it went</span></div>${focusChartHTML()}${timeBarsHTML()}</div></div>
  </section>`;
}
function dsAction(a, el){
  const k = dkey(), r = dayRec(k, true);
  if (a==='ds-status'){
    r.plan = r.plan || {}; const id = el.dataset.id, v = el.dataset.v, b = dayBlocks(k).find(x=>x.id===id);
    if (v) r.plan[id] = v; else delete r.plan[id];
    if (b && b.task){ if (v==='done') setTask(k, b.task, true); else if (taskDone(k, b.task)) setTask(k, b.task, false); }
    save(); if (v==='done') toast(`${b ? b.name : 'Block'} done.`, 'ok', 1600);
  } else if (a==='ds-step'){ r.pstep = r.pstep || {}; r.pstep[el.dataset.id] = clamp(+el.dataset.n, 0, 3); if (+el.dataset.n >= 3){ r.plan = r.plan || {}; r.plan[el.dataset.id] = 'done'; const b = dayBlocks(k).find(x=>x.id===el.dataset.id); if (b && b.task) setTask(k, b.task, true); toast('All three steps done.','ok',1600); } save(); }
  else if (a==='ds-feel'){ r.feel = r.feel || {}; const id = el.dataset.id, v = el.dataset.v; if (id==='energy') r.feel.energy = +v; else if (id==='mood') r.feel.mood = v; else { r.feel.phone = !!v; r.feel.phoneAt = v ? hhmm(nowMin()) : ''; } save(); }
  else if (a==='ds-shape'){ r.shape = el.dataset.v; save(); }
  renderView('today'); updateChrome();
}
document.addEventListener('change', e=>{ const t = e.target; if (!t.dataset || !t.dataset.sleep) return; const r = dayRec(dkey(), true); r.sleep = r.sleep || {}; r.sleep[t.dataset.sleep] = t.value; save(); if (activeTab==='today') renderView('today'); });
setInterval(()=>{ if (document.hidden || typeof activeTab === 'undefined' || activeTab !== 'today') return; const n = document.getElementById('nowCard'); if (n) n.outerHTML = nowCardHTML(); const u = document.getElementById('upStrip'); if (u) u.outerHTML = upNextStrip(); }, 30000);

/* ---------- desktop side notch: ring gauges with pop-out cards ---------- */
function notchHTML(){
  const k = dkey(), tot = tasksForDay(k).length || 1, dn = countDone(k);
  const ws = startOfWeek(), since = state.createdAt || dkey(); let bt = 0, bd = 0;
  for (let i=0;i<7;i++){ const kk = dkey(addDays(ws,i)); if (addDays(ws,i) > new Date()) break; if (kk < since) continue; const B = dayBlocks(kk).filter(b=>!b.skip); bt += B.length; bd += B.filter(b=>blockStatus(kk,b)==='done').length; }
  const saved = typeof savedTotal==='function' ? savedTotal() : 0, goal = Number(state.settings.goal) || 25000;
  const ring = (pct,col,icon,label,pop) => { const r = 18, C = 2*Math.PI*r; return `<div class="nring" tabindex="0" aria-label="${label}">
    <svg viewBox="0 0 46 46"><circle cx="23" cy="23" r="${r}" class="t"/><circle cx="23" cy="23" r="${r}" class="f" style="stroke:${col};stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C*(1-clamp(pct,0,1))).toFixed(1)};filter:drop-shadow(0 0 4px ${col})"/></svg>
    <span class="ic">${ic(icon,18)}</span><span>${Math.round(pct*100)}%</span><div class="npop" role="tooltip">${pop}</div></div>`; };
  const bar = (p,col) => `<div class="nb"><i style="width:${Math.round(clamp(p,0,1)*100)}%;background:${col}"></i></div>`;
  const midnight = (()=>{ const n = new Date(), m = 1440 - (n.getHours()*60+n.getMinutes()); return fmtHM(m); })();
  return `<aside class="notch" id="notch" aria-label="Progress gauges">
    ${ring(dn/tot,'#E0301C','flag','Today',`<b>Today</b><div class="nl"><span>Tasks</span><span>Resets in ${midnight}</span></div>${bar(dn/tot,'#E0301C')}<div class="nl"><span>${dn} of ${tot} done</span><span>${dn>=4?'streak day ✓':(4-dn)+' to streak'}</span></div>`)}
    ${ring(bt?bd/bt:0,'#F8ECAC','target','This week',`<b>This week</b><div class="nl"><span>Day-plan blocks</span><span>Resets Monday</span></div>${bar(bt?bd/bt:0,'#F8ECAC')}<div class="nl"><span>${bd} of ${bt} blocks</span><span>${fmtHM(focusOf(k))} focus today</span></div>`)}
    ${ring(saved/goal,'#F08A3C','pound','Savings',`<b>Savings goal</b><div class="nl"><span>${money0(saved)} of ${money0(goal)}</span><span>${Math.round(saved/goal*100)}%</span></div>${bar(saved/goal,'#F08A3C')}<div class="nl"><span>Plan year</span><span>${money0(Math.max(0,goal-saved))} to go</span></div>`)}
  </aside>`;
}
function mountNotch(){ const old = document.getElementById('notch'); const html = notchHTML(); if (old) old.outerHTML = html; else document.body.insertAdjacentHTML('beforeend', html); }
