/* ============================================================
   VIEW · TODAY
   ============================================================ */
let lap3d = true;
function all(d,t){ return t>0 && d>=t; }
function renderToday(){
  const k = dkey();
  const list = tasksForDay(k);
  const done = countDone(k), total = list.length;
  const pct = total ? done/total : 0;
  const streak = currentStreak();
  const next = upNext();
  const ws = startOfWeek();

  const weekCells = Array.from({length:7},(_,i)=>{
    const d = addDays(ws,i), key = dkey(d), n = countDone(key), tot = tasksForDay(key).length;
    const isToday = key === k, future = d > new Date() && !isToday;
    const st = future ? 'future' : (tot && n>=tot) ? 'best' : n>=4 ? 'pb' : n>0 ? 'slow' : 'none';
    return `<div class="wk ${st} ${isToday?'today':''}" aria-label="${DAYS[i]}: ${n} of ${tot}">
      <i style="--f:${tot? (n/tot).toFixed(2) : 0}"></i><span>${DAYS[i][0]}</span><b class="num">${d.getDate()}</b>
    </div>`;
  }).join('');

  const nextId = next ? next.id : null;
  const rows = list.map((t,i)=>{
    const isDone = taskDone(k,t.id), isNext = !isDone && t.id===nextId;
    return `<button class="task tt-row ${isDone?'done':''} ${isNext?'next':''}" data-a="task" data-id="${t.id}" aria-pressed="${isDone}" style="--i:${i}">
      <span class="pos num">P${i+1}</span>
      <span class="kind" style="background:${t.color}"></span>
      <span class="cbx" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M4 10.5l4 4L16 6"/></svg></span>
      <span class="tbody">
        <span class="tname">${esc(t.name)}</span>
        <span class="tmeta">${esc(t.meta)}</span>
      </span>
      <span class="sector" aria-hidden="true"><i></i><i></i><i></i></span>
      ${t.go && t.go!=='today' ? `<span class="tgo" data-a="go" data-go="${t.go}" aria-hidden="true">${ic('arrowRight',16)}</span>`:''}
    </button>`;
  }).join('');

  const head = done===total&&total ? 'Chequered flag.' : done===0 ? 'On the grid.' : `${total-done} to the flag`;
  const sub = done===total&&total ? 'Every task done. The day is yours.' : done>=4 ? 'Streak day secured. Push for the flag.' : `${Math.max(0,4-done)} more for a streak day.`;

  return `
  ${kmLauncherHTML()}
  ${typeof examCountHTML==='function' ? examCountHTML('today') : ''}
  ${typeof waveHTML==='function' ? waveHTML() : ''}
  ${daySystemHTML()}
  <div class="tcol a">
  <div class="glass pw-hero" data-tilt>
    <div class="glare"></div>
    <div class="revleds ${all(done,total)?'full':''}" aria-hidden="true">${Array.from({length:15},(_,i)=>`<i class="${i<5?'g':i<10?'r':'p'} ${i<Math.round((total?done/total:0)*15)?'on':''}"></i>`).join('')}</div>
    <div class="pw-top">
      ${revGauge(done,total)}
      <div class="pw-meta">
        <div class="big">${head}</div>
        <div class="tiny">${sub}</div>
        <div class="pw-streak"><span class="purple-dot"></span><b class="num">${streak}</b><span class="tiny">day streak · personal best in purple</span></div>
      </div>
    </div>
    <div class="pw-week">${weekCells}</div>
  </div>

  <div class="h2">Timing tower <span class="side num">${done}/${total}</span></div>
  <div class="glass tasks tower ${all(done,total)?'allclear':''}">${rows || '<div class="tiny" style="padding:14px">Rest day. Nothing scheduled.</div>'}</div>

  </div>
  <div class="tcol b">

  <div class="h2">Today’s lap <span class="side">${all(done,total)?'flag out':'one task, one stint'}</span></div>
  <div class="glass lapcard" data-tilt>
    <div class="glare"></div>
    <div class="lapart ${lap3d?'is3d':''}" id="lapArt">${lapArt(k)}
      <div class="lapmode"><button data-a="lap-mode" data-id="3d" class="${lap3d?'on':''}">3D</button><button data-a="lap-mode" data-id="map" class="${lap3d?'':'on'}">Map</button></div></div>
    <div class="tidefoot">
      <span class="legend"><i class="lg-trace"></i>each task drives a stint</span>
      <span class="legend"><i class="lg-pb"></i>sector cleared</span>
      <span class="legend"><i class="lg-best"></i>all done</span>
      <span class="legend"><i class="lg-chq"></i>flag = full day</span>
    </div>
  </div>

  <div class="h2">Time zones <span class="side">live</span></div>
  ${clocksHTML()}

  <div class="h2">Speaking · Part 2 <span class="side">cue card</span></div>
  <div id="cueMount">${cueCardHTML()}</div>

  <div class="h2">Quick log</div>
  <div class="glass card">
    <div class="row between" style="gap:14px">
      <div style="flex:1">
        <div class="h3">Steps today</div>
        <div class="tiny">Goal ${state.settings.stepsGoal.toLocaleString('en-GB')}</div>
      </div>
      <div class="row" style="gap:8px">
        <button class="btn btn-soft btn-sm" data-a="steps" data-d="-1000" aria-label="Remove 1000 steps">−1k</button>
        <b class="mono" style="font-size:19px;min-width:56px;text-align:center">${(dayRec(k).steps||0).toLocaleString('en-GB')}</b>
        <button class="btn btn-soft btn-sm" data-a="steps" data-d="1000" aria-label="Add 1000 steps">+1k</button>
      </div>
    </div>
    <div class="pbar" style="margin-top:12px"><i class="teal" style="width:${clamp(pctOf(dayRec(k).steps||0, state.settings.stepsGoal)*100,0,100)}%"></i></div>
  </div>
  </div>`;
}

/* cue card (shared with Learn tab) */
let cueIndex = 0;
function currentCue(){
  if (!state.ielts.cueSeen.__idx) state.ielts.cueSeen.__idx = (new Date().getDate() + new Date().getMonth()*31) % CUE_CARDS.length;
  return CUE_CARDS[state.ielts.cueSeen.__idx % CUE_CARDS.length];
}
function cueCardHTML(){
  const c = currentCue();
  return `<div class="glass cue" id="cue">
    <button class="cuehead" data-a="cue-toggle" aria-expanded="false" aria-controls="cueBody">
      <span class="ico">${ic('mic',20)}</span>
      <span class="ct"><span class="t">Describe it out loud</span><span class="s">1 min prep, then 2 min talking</span></span>
      <span class="chev">${ic('chevron',18)}</span>
    </button>
    <div class="cuebody" id="cueBody"><div><div class="cueinner">
      <div class="cuecard-paper">
        <div class="q">${esc(c.q)}</div>
        <div class="bl">${c.bullets.map(b=>`<div>${esc(b)}</div>`).join('')}</div>
      </div>
      <div class="timers">
        <button class="timer" data-a="timer" data-which="prep" data-secs="60">
          <div class="tlabel">${ic('clock',13)} Prep (1 min)</div>
          <div class="tval" data-tv="prep">1:00</div>
          <div class="tbar"><i data-tb="prep"></i></div>
        </button>
        <button class="timer" data-a="timer" data-which="talk" data-secs="120">
          <div class="tlabel">${ic('mic',13)} Talk (2 min)</div>
          <div class="tval" data-tv="talk">2:00</div>
          <div class="tbar"><i data-tb="talk"></i></div>
        </button>
      </div>
      <div class="row" style="margin-top:12px">
        <button class="btn btn-deep btn-sm" data-a="cue-done">${ic('check',15)} I spoke today</button>
        <button class="btn btn-ghost btn-sm" data-a="cue-next">Next card ${ic('arrowRight',15)}</button>
      </div>
      <div class="tiny" style="margin-top:10px">Follow-up: ${esc(c.follow)}</div>
    </div></div></div>
  </div>`;
}

