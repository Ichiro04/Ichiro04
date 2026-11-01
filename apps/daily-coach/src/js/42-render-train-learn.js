/* ============================================================
   VIEW · TRAIN
   ============================================================ */
let trainDayKey = dkey();
function renderTrain(){
  const k = trainDayKey;
  const d = parseKey(k);
  const sess = sessionFor(k);
  const rec = wrec(k);
  const pct = sessionDonePct(k);
  const isToday = k === dkey();

  const dayStrip = Array.from({length:7},(_,i)=>{
    const dd = addDays(startOfWeek(d), i), key = dkey(dd);
    const s = SESSIONS[WEEK_PLAN[i]];
    const donePct = sessionDonePct(key);
    return `<button class="dcell ${key===k?'today':''} ${donePct>=80?'done':''}" data-a="train-day" data-key="${key}" aria-pressed="${key===k}">
      <span class="dow">${DAYS[i][0]}</span>
      <span class="orb"><b>${s.id==='REST'?'–':s.id.charAt(0)}</b></span>
      <span class="dtag">${s.tag.charAt(0)}</span>
    </button>`;
  }).join('');

  const exRows = sess.blocks.map(b=>{
    const ex = EX[b.ex]; const arr = rec.sets[b.ex] || [];
    const nDone = Array.from({length:b.sets},(_,i)=>arr[i]).filter(Boolean).length;
    const chips = Array.from({length:b.sets},(_,i)=>`<button class="setchip ${arr[i]?'on':''}" data-a="set" data-key="${k}" data-ex="${b.ex}" data-i="${i}" data-n="${b.sets}" data-rest="${ex.rest}" aria-label="Set ${i+1}">${i+1}</button>`).join('');
    return `<div class="ex ${nDone===b.sets?'done':''}" data-exrow="${b.ex}">
      <div class="exhead">
        <div class="n">
          <div class="a">${esc(ex.name)}</div>
          <div class="b">${b.sets} × ${esc(ex.reps)}${ex.rest?` · rest ${ex.rest}s`:''}${nDone?` · ${nDone}/${b.sets} done`:''}</div>
        </div>
        <div class="exfig-slot">${exFigure(b.ex)}</div>
        <button class="tgo" data-a="ex-cue" aria-label="Show form cue" aria-expanded="false">${ic('info',18)}</button>
      </div>
      <div class="sets">${chips}</div>
      <div class="cue">${esc(ex.cue)}</div>
    </div>`;
  }).join('');

  const restButtons = [45,60,90,120].map(s=>`<button class="btn btn-soft btn-sm" data-a="rest" data-secs="${s}">${s}s</button>`).join('');

  return `
  <div class="glass card" data-tilt>
    <div class="glare"></div>
    <div class="row between" style="align-items:flex-start">
      <div>
        <div class="tiny" style="font-weight:650;color:var(--ink-3)">${isToday?'Today':DAYS_LONG[isoWeekday(d)]} · ${shortDate(d)}</div>
        <div class="h2" style="margin:3px 0 4px;font-size:22px">${esc(sess.day)}</div>
        <div class="tags"><span class="chip chip-teal">${esc(sess.tag)}</span>${sess.mins?`<span class="chip">${sess.mins} min</span>`:''}</div>
      </div>
      ${sess.blocks.length ? `<div style="text-align:right"><div class="mono" style="font-size:26px;font-weight:700;letter-spacing:-.04em">${pct}%</div><div class="tiny">logged</div></div>` : ''}
    </div>
    ${sess.blocks.length?`<div class="pbar" style="margin-top:14px"><i class="teal" style="width:${pct}%"></i></div>`:''}
    <div class="week" style="margin-top:14px">${dayStrip}</div>
  </div>

  ${sess.blocks.length ? `
  <div class="h2">Session <span class="side">tap a set to log it</span></div>
  <div class="glass card" style="padding:12px">
    <div class="exkey"><span class="k-hot"></span>Red: the muscles doing the work <span class="k-ghost"></span>Faint figure: start position</div>
    <div class="exlist">${exRows}</div>
    <div class="divider"></div>
    <div class="row between wrapflex" style="gap:8px">
      <div class="tiny" style="flex:1;min-width:120px">Rest timer</div>
      <div class="row" style="gap:6px">${restButtons}</div>
    </div>
    <div class="callout" style="margin-top:12px">${ic('info',14)} Tap the set numbers as you go. Logging an extra rep each week is the whole progression.</div>
  </div>

  <div class="h2">Warm-up <span class="side">5 min, never skip</span></div>
  <div class="glass card">
    <ul style="display:grid;gap:8px">
      <li class="row" style="gap:9px;font-size:14px"><span class="dot" style="background:var(--teal)"></span>2 min easy march or walk on the spot</li>
      <li class="row" style="gap:9px;font-size:14px"><span class="dot" style="background:var(--lteal)"></span>10 arm circles each way, 10 hip circles</li>
      <li class="row" style="gap:9px;font-size:14px"><span class="dot" style="background:var(--sky)"></span>10 bodyweight squats, 8 slow push-ups</li>
      <li class="row" style="gap:9px;font-size:14px"><span class="dot" style="background:var(--mid)"></span>30 s dead bug, 30 s hip hinge drill</li>
    </ul>
  </div>` : `
  <div class="h2">Recovery</div>
  <div class="glass card">
    <div class="h3">Sunday is doing its job</div>
    <p class="tiny" style="margin-top:6px">Walk 30–45 minutes, then 10 minutes of mobility: hips, ankles, upper back. Eat properly, sleep 8 hours. Muscle is built on this day, not the hard ones.</p>
    <div class="row" style="margin-top:12px;gap:8px">
      <button class="btn btn-soft btn-sm" data-a="timer" data-which="walk" data-secs="1800">${ic('play',14)} 30 min walk</button>
      <button class="btn btn-soft btn-sm" data-a="mobility-quick">${ic('yoga',14)} Mobility flow</button>
    </div>
  </div>`}

  <div class="h2">Progression rules</div>
  <div class="glass card">
    <div class="kv stack"><span>Reps before load</span><b>Top of range on all sets, twice, then make it harder</b></div>
    <div class="kv stack"><span>Make it harder</span><b>Slower down phase, pause, single leg, elevation</b></div>
    <div class="kv stack"><span>Deload</span><b>Every 4th week, half the sets</b></div>
    <div class="kv stack"><span>Protein</span><b>130–150 g a day, roughly 2 g per kg of target weight</b></div>
    <div class="kv stack"><span>Fat loss</span><b>0.5–0.7 kg a week. Faster than that costs muscle.</b></div>
    <div class="callout" style="margin-top:12px">${ic('lock',14)} No equipment, no gym, no excuses. Three strength sessions a week is enough to hold muscle while you lose fat — if the food is honest.</div>
  </div>

  <div class="h2">This week</div>
  <div class="glass list">
    ${WEEK_PLAN.map((id,i)=>{
      const s = SESSIONS[id]; const key = dkey(addDays(startOfWeek(),i)); const p = sessionDonePct(key);
      return `<div class="lrow">
        <span class="lic">${s.id==='REST'?ic('moon',18):ic(id==='WALK'?'yoga':id==='C'?'bolt':'dumbbell',18)}</span>
        <span class="lt"><span class="a">${DAYS_LONG[i]}</span><span class="b">${esc(s.day)}</span></span>
        <span class="lr">${p>=100?`<span class="chip chip-teal">done</span>`: p>0?`${p}%`:`<span class="tiny">—</span>`}</span>
      </div>`;
    }).join('')}
  </div>`;
}

/* ============================================================
   VIEW · LEARN
   ============================================================ */
let learnTab = 'essay';
function renderLearn(){
  const seg = [['essay','Essay'],['speak','Speaking'],['know','Packs'],['words','Words'],['career','Career']];
  let body = '';
  if (learnTab==='essay') body = learnEssayHTML();
  if (learnTab==='speak') body = learnSpeakHTML();
  if (learnTab==='know') body = learnKnowHTML();
  if (learnTab==='words') body = learnWordsHTML();
  if (learnTab==='career') body = learnCareerHTML();
  if (learnTab==='know' || learnTab==='career') body = labCardHTML() + body;
  return `<div class="learnwrap">
    <div class="seg" role="tablist" aria-label="Learning modes">
      ${seg.map(([id,label])=>`<button role="tab" class="${learnTab===id?'on':''}" aria-selected="${learnTab===id}" data-a="learn-tab" data-id="${id}">${label}</button>`).join('')}
    </div>
    <div class="learngrid">${body}</div>
  </div>`;
}
function essayPromptToday(){
  const doy = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0))/864e5);
  return ESSAY_PROMPTS[doy % ESSAY_PROMPTS.length];
}
let essayPrompt = null;
function learnEssayHTML(){
  const p = essayPrompt || (essayPrompt = essayPromptToday());
  const essays = state.ielts.essays.slice().reverse();
  const bands = essays.filter(e=>e.band).map(e=>Number(e.band));
  const avgBand = bands.length ? (bands.reduce((a,b)=>a+b,0)/bands.length) : null;
  return `<div class="lcol a">
  <div class="glass kp" data-tilt>
    <div class="glare"></div>
    <div class="kptop"><span class="badge">Task 2 · ${p.type}</span><span class="tiny" style="margin-left:auto">40 minutes</span></div>
    <div style="font-size:16.5px;font-weight:640;letter-spacing:-.018em;line-height:1.36">${esc(p.t)}</div>
    <div class="row" style="margin-top:12px;gap:8px">
      <button class="btn btn-deep btn-sm" data-a="essay-new">${ic('rotate',14)} New prompt</button>
      <button class="btn btn-soft btn-sm" data-a="essay-start">${ic('pen',14)} Start 40 min</button>
    </div>
  </div>

  <div class="h2">Log the essay <span class="side">${essays.length} written</span></div>
  <div class="glass card">
    <form data-form="essay" style="display:grid;gap:10px">
      <div class="row" style="gap:10px">
        <div class="field" style="flex:1"><label for="ew">Words</label><input class="input" id="ew" name="words" type="number" inputmode="numeric" min="0" placeholder="270" required></div>
        <div class="field" style="flex:1"><label for="em">Minutes</label><input class="input" id="em" name="mins" type="number" inputmode="numeric" min="0" placeholder="40"></div>
      </div>
      <div class="field"><label for="eb">Self-assessed band</label>
        <select class="input" id="eb" name="band">
          <option value="">Not sure yet</option>
          <option>5.5</option><option>6.0</option><option>6.5</option><option>7.0</option><option>7.5</option><option>8.0</option>
        </select>
      </div>
      <div class="row" style="gap:8px">
        <button class="btn btn-primary btn-sm" type="submit">${ic('check',15)} Save essay</button>
        <span class="tiny" style="flex:1">${avgBand?`Average band ${num(avgBand)}`:'Add a band to track the trend'}</span>
      </div>
    </form>
    ${essays.length?`<div class="divider"></div><div style="display:grid;gap:2px">
      ${essays.slice(0,5).map(e=>`<div class="row between" style="gap:10px;padding:6px 0">
        <span class="tiny" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.prompt)}</span>
        <span class="chip ${e.band>=7?'chip-teal':'chip-orange'}">${e.words}w${e.band?' · '+e.band:''}</span>
      </div>`).join('')}
    </div>`:''}
  </div>

  </div>
  <div class="lcol b">
  <div class="h2">Structure that scores</div>
  <div class="glass card" style="display:grid;gap:12px">
    ${ESSAY_STRUCTURE.map(s=>`<div><div class="h3" style="font-size:14.5px">${s.h}</div><div class="tiny" style="margin-top:2px">${esc(s.b)}</div></div>`).join('')}
  </div>

  <div class="h2">Band 7 non-negotiables</div>
  <div class="glass list">
    ${BAND7_RULES.map(r=>`<div class="lrow"><span class="lic" style="color:#B00515;background:rgba(192,4,24,.16)">${ic('check',16)}</span><span class="lt"><span class="a" style="font-weight:520;font-size:14px">${esc(r)}</span></span></div>`).join('')}
  </div>
  </div>`;
}
function learnSpeakHTML(){
  const ws = startOfWeek();
  const days = Array.from({length:7},(_,i)=>dkey(addDays(ws,i)));
  const spoken = days.filter(k=>state.ielts.speaking[k]);
  return `
  ${cueCardHTML()}
  <div class="h2">This week <span class="side">${spoken.length}/7 days spoken</span></div>
  <div class="glass card">
    <div class="week">${days.map((k,i)=>{
      const d = parseKey(k), isT = k===dkey(), on = !!state.ielts.speaking[k];
      return `<div class="dcell ${isT?'today':''}"><span class="dow">${DAYS[i][0]}</span><span class="orb ${on?'':''}" style="${on?'background:linear-gradient(150deg,#C00418,#D5D9E0)':''}"><b style="${on?'color:#fff':''}">${on?'✓':d.getDate()}</b></span></div>`;
    }).join('')}</div>
    <div class="tiny" style="margin-top:14px">Speaking improves by being recorded. Use your phone’s voice memo, play it back once, then name one thing to fix — speed, verb endings, or filler words.</div>
  </div>

  <div class="h2">Part 1 · quick answers</div>
  <div class="glass card" style="display:grid;gap:10px">
    ${SPEAKING_PART1.map(q=>`<div style="font-size:14px;color:var(--ink-2);padding-left:14px;position:relative"><span class="dot" style="background:var(--sky);position:absolute;left:0;top:7px"></span>${esc(q)}</div>`).join('')}
    <div class="tiny">Answer in two or three sentences: direct answer, reason, small example. Never one word.</div>
  </div>

  <div class="h2">Part 3 · discuss</div>
  <div class="glass card" style="display:grid;gap:10px">
    ${SPEAKING_PART3.map(q=>`<div style="font-size:14px;color:var(--ink-2);padding-left:14px;position:relative"><span class="dot" style="background:var(--orange);position:absolute;left:0;top:7px"></span>${esc(q)}</div>`).join('')}
    <div class="tiny">Structure: position, reason, consequence, exception. Hedged language scores: “on balance”, “it depends on”, “the evidence suggests”.</div>
  </div>`;
}
function learnKnowHTML(){
  const doy = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0))/864e5);
  const pack = KNOWLEDGE_PACKS[doy % KNOWLEDGE_PACKS.length];
  const doneToday = state.knowledge[pack.id] === dkey();
  const learned = Object.keys(state.knowledge).length;
  return `
  <div class="glass kp" data-tilt>
    <div class="glare"></div>
    <div class="kptop"><span class="badge">${esc(pack.tag.charAt(0).toUpperCase()+pack.tag.slice(1).toLowerCase())}</span><span class="tiny" style="margin-left:auto">Today’s pack</span></div>
    <div class="h2" style="margin:2px 0 0;font-size:20px">${esc(pack.title)}</div>
    ${packDiagram(pack.id)}
    <ul>${pack.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>
    <div class="sf"><b>Ask yourself:</b> ${esc(pack.ask)}</div>
    <div class="row" style="margin-top:12px;gap:8px">
      <button class="btn ${doneToday?'btn-soft':'btn-primary'} btn-sm" data-a="know-done" data-id="${pack.id}">${ic('check',15)} ${doneToday?'Done today':'Mark as learned'}</button>
      <span class="tiny" style="flex:1">${learned} of ${KNOWLEDGE_PACKS.length} packs started</span>
    </div>
  </div>
  <div class="h2">Bring this to the shop floor</div>
  <div class="glass card">
    <div class="row" style="gap:10px;align-items:flex-start">
      <span class="lic" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:rgba(255,199,0,.16);color:#8A6400;flex:0 0 auto">${ic('bolt',18)}</span>
      <div><div class="h3" style="font-size:14.5px">One question for the floor</div><div class="tiny" style="margin-top:3px">${esc(pack.new)}</div></div>
    </div>
    <div class="callout" style="margin-top:12px">${ic('info',14)} You are not learning this for an exam. You are learning it so that on the floor, when something goes wrong, you have a second explanation before anyone speaks.</div>
  </div>
  <div class="h2">All packs</div>
  <div class="glass list">
    ${KNOWLEDGE_PACKS.map(p=>{
      const last = state.knowledge[p.id];
      const wasToday = last === dkey();
      return `<div class="lrow">
        <span class="lic">${ic('gears',17)}</span>
        <span class="lt"><span class="a" style="font-size:14.5px">${esc(p.title)}</span><span class="b">${p.tag}</span></span>
        <span class="lr">${wasToday?'<span class="chip chip-teal">today</span>': (last? `<span class="chip">${shortDate(parseKey(last))}</span>` : `<span class="tiny">new</span>`)}</span>
      </div>`;
    }).join('')}
  </div>`;
}
let wordsShow = false;
function learnWordsHTML(){
  const learned = state.ielts.quick ? state.ielts.quick.length : 0;
  return `
  <div class="glass card">
    <div class="row between">
      <div><div class="h3">Academic word bank</div><div class="tiny">${WORDS.length} words · say each one out loud in a sentence</div></div>
      <button class="btn btn-soft btn-sm" data-a="words-toggle">${wordsShow?'Hide meanings':'Reveal meanings'}</button>
    </div>
    <div class="divider"></div>
    <div style="display:grid;gap:10px">
      ${WORDS.map(w=>`<div>
        <div class="row" style="gap:8px"><b style="font-size:15px;letter-spacing:-.01em">${w.w}</b>
        <span class="tiny" style="flex:1">${wordsShow?esc(w.d):'· · ·'}</span></div>
        ${wordsShow?`<div class="tiny" style="margin-top:2px;font-style:italic">“${esc(w.ex)}”</div>`:''}
      </div>`).join('')}
    </div>
  </div>
  <div class="h2">How to drill it</div>
  <div class="glass card">
    <div class="kv"><span>Step 1</span><b>Read the word, cover the meaning, say a definition</b></div>
    <div class="kv"><span>Step 2</span><b>Write one sentence about engineering using it</b></div>
    <div class="kv"><span>Step 3</span><b>Say the sentence aloud — pronunciation counts</b></div>
    <div class="kv"><span>Step 4</span><b>Come back tomorrow and only revise the misses</b></div>
  </div>`;
}

function learnCareerHTML(){
  const pf = state.career.portfolio || {};
  const hs = Object.assign({applied:true}, state.career.huht || {});
  const hDone = HUHT_STAGES.filter(x=>hs[x.id]).length;
  const hNext = HUHT_STAGES.find(x=>!hs[x.id]);
  const doneCount = PORTFOLIO.filter(p=>pf[p.id]).length;
  return `
  <div class="h2">Huhtamaki application <span class="side">${hDone} of ${HUHT_STAGES.length} stages</span></div>
  <div class="glass list">
    ${HUHT_STAGES.map(x=>`<button class="lrow" data-a="huht" data-id="${x.id}" aria-pressed="${!!hs[x.id]}">
      <span class="lic" style="${hs[x.id]?'background:linear-gradient(150deg,var(--teal),var(--lteal));color:#FFFFFF':''}">${hs[x.id]?ic('check',17):ic('bolt',17)}</span>
      <span class="lt"><span class="a" style="font-size:14.5px;${hs[x.id]?'color:var(--ink-3)':''}">${esc(x.t)}</span><span class="b">${esc(x.d)}</span></span>
    </button>`).join('')}
    <div class="callout" style="margin:0 12px 12px">${hNext?'Next: '+esc(hNext.t.toLowerCase())+'. Tap a stage when you pass it.':'Offer received. Well done.'}</div>
  </div>

  <div class="glass kp" data-tilt>
    <div class="glare"></div>
    <div class="kptop"><span class="badge">Where you stand</span><span class="tiny" style="margin-left:auto">${doneCount}/${PORTFOLIO.length} portfolio pieces</span></div>
    <div class="h2" style="margin:2px 0 10px;font-size:19px">Two years of plant experience most graduates do not have</div>
    <div class="tl">
      ${TIMELINE.map(t=>`<div class="tlrow ${t.now?'now':''}">
        <span class="tldot"></span>
        <div class="tlbody">
          <div class="tlwhen">${esc(t.when)}</div>
          <div class="tlrole">${esc(t.role)}</div>
          <div class="tlor">${esc(t.org)}</div>
          <div class="tldesc">${esc(t.detail)}</div>
        </div>
      </div>`).join('')}
    </div>
  </div>

  <div class="h2">Portfolio <span class="side">tap to tick</span></div>
  <div class="glass list">
    ${PORTFOLIO.map(p=>`<button class="lrow" data-a="pf" data-id="${p.id}" aria-pressed="${!!pf[p.id]}">
      <span class="lic" style="${pf[p.id]?'background:linear-gradient(150deg,var(--teal),var(--lteal));color:#FFFFFF':''}">${pf[p.id]?ic('check',17):ic('edit',17)}</span>
      <span class="lt"><span class="a" style="font-size:14.5px;${pf[p.id]?'color:var(--ink-3)':''}">${esc(p.t)}</span><span class="b">${esc(p.d)}</span></span>
    </button>`).join('')}
  </div>

  <div class="h2">Story bank <span class="side">say these out loud</span></div>
  <div class="glass list">
    ${STORIES.map((st,i)=>`<div class="story">
      <button class="lrow" data-a="story" data-i="${i}" aria-expanded="false">
        <span class="lic">${ic('mic',17)}</span>
        <span class="lt"><span class="a" style="font-size:14.5px">${esc(st.q)}</span><span class="b">${esc(st.hook)}</span></span>
        <span class="tgo">${ic('chevron',17)}</span>
      </button>
      <div class="storybody"><div>
        <div class="callout" style="margin:0 12px 12px">${esc(st.body)}</div>
        <div class="tiny" style="margin:0 12px 14px">${esc(st.close)}</div>
      </div></div>
    </div>`).join('')}
  </div>

  <div class="h2">Interview bank <span class="side">${QUESTION_BANK.length} questions</span></div>
  <div class="glass list">
    ${QUESTION_BANK.map((q,i)=>`<div class="story">
      <button class="lrow" data-a="qa" data-i="${i}" aria-expanded="false">
        <span class="lic">${ic('compass',17)}</span>
        <span class="lt"><span class="a" style="font-size:14.5px">${esc(q.q)}</span></span>
        <span class="tgo">${ic('chevron',17)}</span>
      </button>
      <div class="storybody"><div><div class="tiny" style="margin:0 12px 14px">${esc(q.a)}</div></div></div>
    </div>`).join('')}
  </div>

  <div class="h2">What is already strong</div>
  <div class="glass list">
    ${CV_STRENGTHS.map(x=>`<div class="lrow"><span class="lic" style="color:#B00515;background:rgba(192,4,24,.16)">${ic('check',16)}</span><span class="lt"><span class="a" style="font-weight:520;font-size:14px">${esc(x)}</span></span></div>`).join('')}
  </div>

  <div class="h2">Fix these on the CV <span class="side">before the next application</span></div>
  <div class="glass list">
    ${CV_FIXES.map(x=>`<div class="lrow"><span class="lic" style="color:#8A6400;background:rgba(255,199,0,.16)">${ic('bolt',16)}</span><span class="lt"><span class="a" style="font-weight:520;font-size:14px">${esc(x)}</span></span></div>`).join('')}
  </div>

  <div class="glass card" style="margin-top:12px">
    <div class="callout warn">${ic('info',14)} The one line that gets you an interview: “I have kept automated packaging lines running at 98% efficiency and I can show you the changeover data.” Everything else on the page is supporting evidence.</div>
  </div>`;
}


function labCardHTML(){
  const s = [['trends','Trends'],['path','Path'],['cad','CAD theory'],['tests','Test bench'],['career','Licences'],['data','Data']];
  return `<div class="glass labcard" data-tilt>
    <div class="labtop"><span class="labic">${ic('gears',20)}</span>
      <div style="flex:1;min-width:0"><div class="h3" style="font-size:16px">Mechanical engineering lab</div>
      <div class="tiny" style="margin-top:2px">3D CAD walkthrough, a test bench with real load cases, and a Beginner to Advanced path, in the Lab tab.</div></div></div>
    <div class="labchips"><button class="go" data-a="lab-open" data-id="tests">Open the lab</button>${s.map(([h,l])=>`<button data-a="lab-open" data-id="${h}">${l}</button>`).join('')}</div>
  </div>`;
}
