/* ============================================================
   VIEW · TODAY
   ============================================================ */
function renderToday(){
  const k = dkey();
  const list = tasksForDay(k);
  const done = countDone(k), total = list.length;
  const pct = total ? done/total : 0;
  const streak = currentStreak();
  const next = upNext();
  const ws = startOfWeek();

  const weekCells = Array.from({length:7},(_,i)=>{
    const d = addDays(ws,i), key = dkey(d), sc = dayScore(key), n = countDone(key);
    const isToday = key === k, future = d > new Date() && !isToday;
    const cls = [n>0 && n>=tasksForDay(key).length ? 'done' : (n>0?'part':''), isToday?'today':'', future?'future':''].filter(Boolean).join(' ');
    return `<div class="dcell ${cls}">
      <span class="dow">${DAYS[i][0]}</span>
      <span class="orb"><b>${d.getDate()}</b></span>
    </div>`;
  }).join('');

  const last7 = Array.from({length:7},(_,i)=>isStreakDay(dkey(addDays(new Date(), i-6))));

  const rows = list.map((t,i)=>{
    const isDone = taskDone(k,t.id);
    return `<button class="task ${isDone?'done':''}" data-a="task" data-id="${t.id}" aria-pressed="${isDone}" style="--i:${i}">
      <span class="kind" style="background:${t.color}"></span>
      <span class="cbx" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M4 10.5l4 4L16 6"/></svg></span>
      <span class="tbody">
        <span class="tname">${esc(t.name)}</span>
        <span class="tmeta">${esc(t.meta)}</span>
      </span>
      ${t.go && t.go!=='today' ? `<span class="tgo" data-a="go" data-go="${t.go}" aria-hidden="true">${ic('arrowRight',16)}</span>`:''}
    </button>`;
  }).join('');

  return `
  <div class="tcol a">
  <div class="glass ringcard" data-tilt>
    <div class="glare"></div>
    <div class="ringrow">
      ${ring(pct,112,9,{label:Math.round(pct*100), sub:`${done} of ${total}`, fromTo:true})}
      <div class="ringmeta">
        <div class="big">${done===total&&total? 'Day cleared.' : done===0 ? 'Nothing done yet.' : `${total-done} left today`}</div>
        <div class="tiny">${done===total&&total? 'Sun is up. Rest is earned.' : 'Four tasks counts as a streak day.'}</div>
        <div class="lines">
          <div class="row" style="gap:6px">${ic('flame',15)}<b class="mono" style="font-size:14px">${streak}</b><span class="tiny">day streak${streak===1?'':'s'}</span></div>
          <div class="streakpips">${last7.map(on=>`<i class="${on?'on':''}"></i>`).join('')}</div>
        </div>
      </div>
    </div>
    <div class="week">${weekCells}</div>
  </div>

  ${next ? `<div class="h2">Up next <span class="side">${esc(next.meta)}</span></div>
  <div class="upnext" data-tilt>
    <div class="glare"></div>
    <div class="upic">${ic(next.icon,22)}</div>
    <div class="uptext">
      <div class="lbl">${done===0?'Start here':'Next'}</div>
      <div class="name">${esc(next.name)}</div>
      <div class="meta">${esc(next.meta)}</div>
    </div>
    <button class="btn btn-primary btn-sm" data-a="start" data-id="${next.id}" data-go="${next.go||'today'}">Start</button>
  </div>`:''}
  <div class="h2">Checklist <span class="side">${done}/${total}</span></div>
  <div class="glass tasks">${rows || '<div class="tiny" style="padding:14px">Rest day. Nothing scheduled.</div>'}</div>

  </div>
  <div class="tcol b">

  <div class="h2">Today’s tide <span class="side">${done}/${total} tides</span></div>
  <div class="glass tidecard" data-tilt>
    <div class="glare"></div>
    <div class="tidehead">
      <div>
        <div class="h3">Tidal accretion</div>
        <div class="tiny">${done===0?'The sea is flat. Complete a task to raise a tide.':done===total?'The sun has risen on a finished day.':`${done} tide${done===1?'':'s'} raised · ${streak} seabed layer${streak===1?'':'s'}`}</div>
      </div>
      ${done===total&&total?`<span class="chip chip-orange">${ic('flame',13)} Full day</span>`:`<span class="chip chip-teal">${ic('wave',13)} ${total-done} to sun</span>`}
    </div>
    <div class="tideart">${tideArt(k)}<div class="glow"></div></div>
    <div class="tidefoot">
      <span class="legend"><i style="background:#C00418"></i>tides = tasks</span>
      <span class="legend"><i style="background:#E1061B"></i>seabed = streak days</span>
      <span class="legend"><i style="background:#FFC700"></i>sun = all done</span>
    </div>
  </div>

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

