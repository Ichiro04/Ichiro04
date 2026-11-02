/* ============================================================
   VIEW · MONEY
   ============================================================ */
function renderMoney(){
  const now = new Date();
  const saved = savedTotal(), goal = Number(state.settings.goal)||25000;
  const pct = clamp(saved/goal,0,1);
  const spend = spentMonth(now);
  const { day, dim, frac } = monthProgress(now);
  const allowance = Math.max(0, freeAfterFixed()/dim);
  const proj = day ? spend/day*dim : 0;
  const onPace = proj <= allowance;
  const need = needPerMonth(), feasible = feasiblePerMonth();
  const gap = Math.max(0, need - feasible);
  const monthsLeft = Math.max(0, 12 - (now.getMonth() - new Date(state.createdAt).getMonth() + 12*0)%12);
  const daysLeft = Math.max(1, Math.ceil((new Date(now.getFullYear()+1, now.getMonth(), now.getDate()) - now)/864e5));
  const perDay = Math.max(0,(goal - saved)/daysLeft);

  const byCat = CATS.map(c=>({ ...c, total: state.expenses.filter(e=>(e.date||'').startsWith(monthKey(now)) && e.cat===c.id).reduce((a,e)=>a+Number(e.amount||0),0) })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
  const maxCat = Math.max(1, ...byCat.map(c=>c.total));
  const recent = state.expenses.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,8);
  const savingsRecent = state.savings.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,4);
  const fixed = state.settings.fixed;

  const levers = [
    { n:'Extra shift or overtime, once a month', v:150 },
    { n:'Tutoring or CAD side work, two evenings', v:200 },
    { n:'Halve eating out and takeaways', v:45 },
    { n:'Cook five batch meals on Sunday', v:40 },
    { n:'Bike or walk instead of the bus, three days', v:25 },
    { n:'Cancel one unused subscription', v:12 }
  ];
  const leverTotal = levers.reduce((a,l)=>a+l.v,0);

  return `
  <div class="glass ringcard" data-tilt>
    <div class="glare"></div>
    <div class="ringrow">
      ${ring(pct,112,9,{label:Math.round(pct*100), sub:`of ${money0(goal)}`, c1:'#B38F6F', c2:'#E6CDB0', c3:'#C9946E', fromTo:true})}
      <div class="ringmeta">
        <div class="big">${money0(saved)} <span class="tiny" style="font-weight:600">of ${money0(goal)}</span></div>
        <div class="tiny">The £25,000 year · ${daysLeft} days left</div>
        <div class="lines">
          <div class="row" style="gap:6px">${ic('target',14)}<span class="tiny">Needed</span><b class="mono" style="font-size:13.5px">${money0(need)}/mo</b></div>
          <div class="row" style="gap:6px">${ic('trend',14)}<span class="tiny">Realistic</span><b class="mono" style="font-size:13.5px">${money0(feasible)}/mo</b></div>
        </div>
      </div>
    </div>
    ${gap>0.5?`<div class="callout warn" style="margin-top:14px">${ic('info',14)} You are ${money0(gap)} a month short of the headline number. The plan below closes ${money0(leverTotal)} of it — that is the honest version.</div>`
      :`<div class="callout" style="margin-top:14px">${ic('check',14)} Your fixed costs leave enough room. Save ${money0(need)} on the 1st of each month and the year takes care of itself.</div>`}
    <div class="pbar" style="margin-top:12px"><i class="orange" style="width:${(pct*100).toFixed(1)}%"></i></div>
    <div class="row between" style="margin-top:8px"><span class="tiny">${money0(saved)} banked</span><span class="tiny">${money0(perDay)} per day from here</span></div>
  </div>

  <div class="h2">Log spending</div>
  <div class="glass card">
    <form data-form="expense" style="display:grid;gap:10px">
      <div class="row" style="gap:10px">
        <div class="input-prefix" style="flex:1"><span class="pfx">£</span><input class="input" name="amount" type="number" inputmode="decimal" step="0.01" min="0" placeholder="0.00" required aria-label="Amount"></div>
        <input class="input" name="note" placeholder="What was it?" style="flex:1.4" aria-label="Note">
      </div>
      <div class="tags" style="gap:6px">
        ${CATS.map((c,i)=>`<button type="button" class="chip ${i===0?'chip-deep':''}" data-a="pick-cat" data-id="${c.id}" aria-pressed="${i===0}">${c.name}</button>`).join('')}
      </div>
      <input type="hidden" name="cat" value="food">
      <button class="btn btn-primary btn-sm" type="submit" style="justify-self:start">${ic('cart',15)} Add expense</button>
    </form>
  </div>

  <div class="grid2 gap">
    <div>
      <div class="h2">This month <span class="side">${monthLabel(monthKey(now))}</span></div>
      <div class="glass card">
        <div class="row between" style="align-items:flex-end">
          <div><div class="mono" style="font-size:26px;font-weight:700;letter-spacing:-.04em">${money0(spend)}</div><div class="tiny">of ${money0(allowance*dim)} flexible</div></div>
          <span class="chip ${onPace?'chip-teal':'chip-orange'}">${onPace?'On pace':'Over pace'}</span>
        </div>
        <div class="pbar" style="margin-top:12px"><i class="${onPace?'teal':'orange'}" style="width:${clamp(spend/Math.max(1,allowance*dim)*100,0,100)}%"></i></div>
        <div class="row between" style="margin-top:8px"><span class="tiny">Day ${day} of ${dim}</span><span class="tiny">${money0(allowance)} a day left</span></div>
        ${byCat.length?`<div class="divider"></div><div style="display:grid;gap:9px">
          ${byCat.map(c=>`<div>
            <div class="row between" style="font-size:13px"><span class="row" style="gap:6px"><i class="dot" style="background:${c.color}"></i>${c.name}</span><b class="mono">${money0(c.total)}</b></div>
            <div class="pbar" style="height:5px;margin-top:4px"><i style="width:${(c.total/maxCat*100).toFixed(0)}%;background:${c.color}"></i></div>
          </div>`).join('')}
        </div>`:`<div class="tiny" style="margin-top:12px">Nothing logged this month yet. Log the little things — they are the whole story.</div>`}
      </div>

      <div class="h2">Recent</div>
      <div class="glass list">
        ${recent.length?recent.map(e=>`<div class="lrow">
          <span class="lic" style="color:${catOf(e.cat).color}">${ic('cart',17)}</span>
          <span class="lt"><span class="a" style="font-size:14px">${esc(e.note||catOf(e.cat).name)}</span><span class="b">${shortDate(parseKey(e.date))} · ${catOf(e.cat).name}</span></span>
          <span class="lr">${money(e.amount)}</span>
          <button class="tgo" data-a="del-expense" data-id="${e.id}" aria-label="Delete expense">${ic('x',16)}</button>
        </div>`).join(''):`<div class="lrow"><span class="lt"><span class="a" style="font-size:14px;color:var(--ink-3)">No expenses logged yet</span><span class="b">Tap ＋ or use the form above</span></span></div>`}
      </div>
    </div>

    <div>
      <div class="h2">The plan</div>
      <div class="glass card">
        <div class="kv"><span>Income, take-home</span><b>${money0(state.settings.income)}</b></div>
        ${fixed.map(f=>`<button class="kv" data-a="edit-fixed" data-id="${f.id}" style="width:100%;text-align:left;background:none">
          <span class="row" style="gap:6px;color:var(--ink-2)">${esc(f.name)}<span class="tiny">${ic('edit',12)}</span></span><b>−${money0(f.amount)}</b>
        </button>`).join('')}
        <div class="divider" style="margin:10px 0"></div>
        <div class="kv"><span>Free every month</span><b style="color:var(--deep)">${money0(freeAfterFixed())}</b></div>
        <div class="kv"><span>Target saving</span><b>${money0(need)}</b></div>
        <div class="kv"><span>Comfortable saving</span><b>${money0(feasible)}</b></div>
        <div class="kv"><span>Gap</span><b style="color:#A0560E">${gap>0?money0(gap):'none'}</b></div>
        <div class="row" style="margin-top:12px;gap:8px">
          <button class="btn btn-deep btn-sm" data-a="add-saving">${ic('piggy',15)} Add to savings</button>
          <button class="btn btn-ghost btn-sm" data-a="edit-plan">Edit plan</button>
        </div>
      </div>

      <div class="h2">Close the gap <span class="side">${money0(leverTotal)} available</span></div>
      <div class="glass list">
        ${levers.map(l=>`<div class="lrow"><span class="lic" style="color:#710014">${ic('bolt',16)}</span><span class="lt"><span class="a" style="font-size:14px">${esc(l.n)}</span></span><span class="lr" style="color:#710014">+${money0(l.v)}</span></div>`).join('')}
      </div>

      <div class="h2">Milestones</div>
      <div class="glass card">
        ${milestoneList.map(m=>{
          const hit = saved >= m.v;
          return `<div class="goal" style="margin-bottom:8px">
            <div class="gt"><span class="row" style="gap:7px">${hit?`<span style="color:#710014">${ic('check',15)}</span>`:`<span class="dot" style="background:var(--track)"></span>`}${money0(m.v)}</span><span>${hit?'banked':money0(m.v-saved)+' to go'}</span></div>
            <div class="pbar"><i class="${hit?'teal':''}" style="width:${clamp(saved/m.v*100,0,100)}%"></i></div>
          </div>`;
        }).join('')}
        ${savingsRecent.length?`<div class="divider"></div><div style="display:grid;gap:6px">
          ${savingsRecent.map(s=>`<div class="row between" style="font-size:13px"><span class="tiny">${shortDate(parseKey(s.date))} · ${esc(s.note||'deposit')}</span><b class="mono" style="color:#710014">+${money0(s.amount)}</b></div>`).join('')}
        </div>`:''}
      </div>
    </div>
  </div>`;
}

/* ============================================================
   VIEW · PROGRESS
   ============================================================ */
function renderProgress(){
  const weeks = 13;
  const start = addDays(startOfWeek(), -7*(weeks-1));
  let cells = '';
  for (let w=0; w<weeks; w++){
    for (let d=0; d<7; d++){
      const k = dkey(addDays(start, w*7+d));
      const n = countDone(k), tot = tasksForDay(k).length;
      const future = parseKey(k) > new Date();
      let lvl = 0;
      if (n>0) lvl = 1;
      if (n>=3) lvl = 2;
      if (n>=5) lvl = 3;
      if (n>=7) lvl = 4;
      if (tot && n>=tot) lvl = 5;
      cells += `<i class="l${lvl} ${future?'fut':''}" title="${shortDate(parseKey(k))}: ${n}/${tot} tasks"></i>`;
    }
  }
  const weight = weightSeries();
  const wChange = weightChangeWeek();
  const wAvg7 = weight.length ? weight.slice(-7).reduce((a,b)=>a+b.kg,0)/Math.min(7,weight.length) : null;
  const startKg = Number(state.profile.weightStart)||81;
  const targetKg = Number(state.profile.weightTarget)||72;
  const weightPct = clamp((startKg - lastWeight())/(startKg-targetKg),0,1);

  const stats = [
    { k:'Streak', v:currentStreak(), s:'days', d:`Best ${bestStreak()}`, ic:'flame', cls:'' },
    { k:'7-day completion', v:Math.round(avgScoreLast(7)*100), s:'%', d:'of scheduled tasks', ic:'target', cls:'teal' },
    { k:'Sessions this week', v:workoutsThisWeek(), s:'/6', d:'strength + conditioning', ic:'dumbbell', cls:'' },
    { k:'Weight', v:num(lastWeight()), s:'kg', d:wChange===null?'first weigh-in':`${wChange>0?'+':''}${num(wChange)} kg this week`, ic:'scale', cls:'orange' }
  ];

  return `<div class="tcol a">
  <div class="glass card" data-tilt>
    <div class="glare"></div>
    <div class="row between" style="align-items:flex-start;margin-bottom:14px">
      <div><div class="h3">Consistency</div><div class="tiny">Last ${weeks} weeks · ${STREAK_TARGET}+ tasks makes a day</div></div>
      <span class="chip chip-teal">${ic('flame',13)} ${currentStreak()}d</span>
    </div>
    <div class="heat">${cells}</div>
    <div class="row between" style="margin-top:12px">
      <span class="tiny">Each column is a week</span>
      <span class="row" style="gap:5px;align-items:center"><span class="tiny">less</span>
        <span class="heat-legend"><i class="a"></i><i class="b"></i><i class="c"></i><i class="d"></i><i class="e"></i><i class="f"></i></span>
      <span class="tiny">more</span></span>
    </div>
  </div>

  <div class="h2">Numbers</div>
  <div class="stats">
    ${stats.map(s=>`<div class="glass stat ${s.cls}">
      <div class="k">${ic(s.ic,13)} ${s.k}</div>
      <div class="v">${s.v}<small>${s.s}</small></div>
      <div class="d">${esc(s.d)}</div>
    </div>`).join('')}
  </div>

  <div class="h2">Bodyweight <span class="side">${startKg} kg → ${targetKg} kg</span></div>
  <div class="glass card">
    <div class="row between" style="align-items:flex-end">
      <div><div class="mono" style="font-size:26px;font-weight:700;letter-spacing:-.04em">${num(lastWeight())}<span class="tiny" style="font-size:13px"> kg</span></div>
        <div class="tiny">${wAvg7?`7-day average ${num(wAvg7)} kg`:'Log a few mornings to see the trend'}</div></div>
      <span class="chip ${(wChange||0)<=0?'chip-teal':'chip-orange'}">${wChange===null?'—':`${wChange>0?'+':''}${num(wChange)} kg`}</span>
    </div>
    <div style="margin-top:10px">${sparkline(weight.map(p=>({kg:p.kg})), {target:targetKg, h:70})}</div>
    <div class="pbar" style="margin-top:10px"><i class="teal" style="width:${(weightPct*100).toFixed(1)}%"></i></div>
    <div class="row between" style="margin-top:8px"><span class="tiny">${num(Math.max(0,startKg-lastWeight()))} kg down</span><span class="tiny">${num(Math.max(0,lastWeight()-targetKg))} kg to target</span></div>
    <form data-form="weight" class="row" style="margin-top:14px;gap:8px">
      <div class="input-prefix" style="flex:1"><span class="pfx">kg</span><input class="input" name="kg" type="number" step="0.1" min="30" max="250" placeholder="${num(lastWeight())}" required aria-label="Weight today"></div>
      <button class="btn btn-primary btn-sm" type="submit">${ic('scale',15)} Log weight</button>
    </form>
  </div>

  </div>
  <div class="tcol b">
      <div class="h2">IELTS</div>
      <div class="glass card">
        <div class="kv"><span>Essays this week</span><b>${essaysThisWeek()}</b></div>
        <div class="kv"><span>Essays all time</span><b>${state.ielts.essays.length}</b></div>
        <div class="kv"><span>Speaking days this week</span><b>${speakingThisWeek()}/7</b></div>
        <div class="kv"><span>Knowledge packs started</span><b>${Object.keys(state.knowledge).length}/${KNOWLEDGE_PACKS.length}</b></div>
        <div class="kv"><span>Target band</span><b>${num(state.settings.ieltsTarget)}</b></div>
        <div class="pbar" style="margin-top:10px"><i style="width:${clamp(avgEssayBand()/9*100,0,100)}%"></i></div>
        <div class="tiny" style="margin-top:6px">${avgEssayBand()?`Average self-assessed band ${num(avgEssayBand())}`:'No bands logged yet'}</div>
      </div>
      <div class="h2">Money</div>
      <div class="glass card">
        <div class="kv"><span>Saved</span><b>${money0(savedTotal())}</b></div>
        <div class="kv"><span>Goal</span><b>${money0(state.settings.goal)}</b></div>
        <div class="kv"><span>Spent this month</span><b>${money0(spentMonth())}</b></div>
        <div class="pbar" style="margin-top:10px"><i class="orange" style="width:${clamp(savedTotal()/state.settings.goal*100,0,100)}%"></i></div>
      </div>
      <div class="h2">Last 14 days</div>
      <div class="glass card">
        <div class="bars">
          ${Array.from({length:14},(_,i)=>{
            const k = dkey(addDays(new Date(), -13+i));
            const sc = dayScore(k);
            return `<div class="b ${i===13?'now':''}" style="height:${Math.max(6,sc*100)}%"><span>${parseKey(k).getDate()}</span></div>`;
          }).join('')}
        </div>
        <div style="height:20px"></div>
        <div class="tiny">Grey-blue is the past, orange is today. Heights are the share of scheduled tasks completed.</div>
      </div>
      <div class="h2">Records</div>
      <div class="glass card">
        <div class="kv"><span>Best streak</span><b>${bestStreak()} days</b></div>
        <div class="kv"><span>Days logged</span><b>${Object.keys(state.days).length}</b></div>
        <div class="kv"><span>Expenses logged</span><b>${state.expenses.length}</b></div>
        <div class="kv"><span>Sets completed</span><b>${totalSetsDone()}</b></div>
        <div class="kv"><span>Since</span><b>${shortDate(parseKey(state.createdAt))}</b></div>
      </div>
  </div>`;
}
function avgEssayBand(){
  const b = state.ielts.essays.filter(e=>e.band).map(e=>Number(e.band));
  return b.length ? b.reduce((a,c)=>a+c,0)/b.length : 0;
}
function totalSetsDone(){
  let n = 0;
  Object.values(state.workouts).forEach(w=>{ Object.values(w.sets||{}).forEach(arr=>{ n += arr.filter(Boolean).length; }); });
  return n;
}

