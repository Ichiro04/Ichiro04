/* ============================================================
   VIEW · COACH
   ============================================================ */
let coachBusy = false;
function renderCoach(){
  const quick = ['Plan my day','Weekly review','Where is my money leaking?','I feel stuck','Training check-in','What should I learn next?'];
  return `
  <div class="glass card" data-tilt>
    <div class="glare"></div>
    <div class="row" style="gap:12px">
      <div class="upic" style="width:46px;height:46px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(150deg,var(--sky),var(--lteal));color:#1A0A0C;box-shadow:0 10px 22px -12px rgba(225,6,27,.7)">${ic('sparkles',24)}</div>
      <div style="flex:1"><div class="h3">Daily Coach</div><div class="tiny">Reads your numbers, tells you the next move</div></div>
    </div>
    <div class="divider"></div>
    <div class="stream" id="coachRead" style="min-height:56px">${coachRead()}</div>
  </div>

  <div class="h2">Ask</div>
  <div class="tags" style="gap:6px">
    ${quick.map(q=>`<button class="chip chip-deep" data-a="quick" data-q="${esc(q)}">${esc(q)}</button>`).join('')}
  </div>

  <div class="h2">Conversation <span class="side">${state.chat.length?state.chat.length+' messages':'new'}</span></div>
  <div class="glass card" id="chatCard" style="padding:14px">
    <div id="chatLog" style="display:grid;gap:12px;max-height:420px;overflow:auto;overscroll-behavior:contain">
      ${state.chat.length ? state.chat.map(m=>chatBubble(m)).join('') : `<div class="tiny">Nothing here yet. Ask for a plan, a review, or the truth about your spending.</div>`}
      <div id="chatStreamMount"></div>
    </div>
    <form data-form="chat" class="row" style="margin-top:14px;gap:8px">
      <input class="input" name="msg" placeholder="Ask your coach…" aria-label="Message" autocomplete="off" style="flex:1">
      <button class="btn btn-primary" type="submit" aria-label="Send">${ic('arrowRight',18)}</button>
    </form>
    <div class="row between" style="margin-top:8px">
      <span class="tiny">Grounded in your own logged data only.</span>
      <button class="btn btn-ghost btn-sm" data-a="clear-chat">Clear</button>
    </div>
  </div>

  <div class="h2">Settings</div>
  <div class="glass card">
    <div class="row between" style="gap:12px">
      <div><div class="h3" style="font-size:14.5px">Appearance</div><div class="tiny">Light, dark, or follow the system</div></div>
    </div>
    <div class="seg" style="margin-top:10px">
      ${['auto','light','dark'].map(t=>`<button class="${state.theme===t?'on':''}" data-a="theme" data-id="${t}">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}
    </div>
    <div class="divider"></div>
    <button class="row between" data-a="reduce-toggle" style="width:100%;text-align:left" aria-pressed="${state.reduceMotion}">
      <span><span class="h3" style="font-size:14.5px;display:block">Reduce motion</span><span class="tiny">Calms the light field and all transitions</span></span>
      <span class="switch ${state.reduceMotion?'on':''}" aria-hidden="true"><i></i></span>
    </button>
    <div class="divider"></div>
    <form data-form="settings" style="display:grid;gap:10px">
      <div class="row" style="gap:10px">
        <div class="field" style="flex:1"><label for="sIncome">Monthly take-home</label><input class="input" id="sIncome" name="income" type="number" inputmode="numeric" value="${state.settings.income}"></div>
        <div class="field" style="flex:1"><label for="sGoal">Savings goal</label><input class="input" id="sGoal" name="goal" type="number" inputmode="numeric" value="${state.settings.goal}"></div>
      </div>
      <div class="row" style="gap:10px">
        <div class="field" style="flex:1"><label for="sExam">IELTS test date</label><input class="input" id="sExam" name="exam" type="date" value="${state.settings.examDate||''}"></div>
        <div class="field" style="flex:1"><label for="sSteps">Daily steps goal</label><input class="input" id="sSteps" name="steps" type="number" inputmode="numeric" value="${state.settings.stepsGoal}"></div>
      </div>
      <button class="btn btn-deep btn-sm" type="submit" style="justify-self:start">${ic('check',15)} Save settings</button>
    </form>
    <div class="divider"></div>
    <div class="row wrapflex" style="gap:8px">
      <button class="btn btn-soft btn-sm" data-a="export">${ic('download',15)} Copy backup</button>
      <button class="btn btn-soft btn-sm" data-a="import">${ic('upload',15)} Import</button>
      <button class="btn btn-soft btn-sm" data-a="reset" style="color:#8A6400">${ic('trash',15)} Reset all</button>
    </div>
    <div class="tiny" style="margin-top:10px">Everything lives in this browser only. No accounts, no servers, no tracking. Export a backup before you clear site data.</div>
  </div>`;
}
function chatBubble(m){
  const me = m.role === 'user';
  return `<div style="display:flex;justify-content:${me?'flex-end':'flex-start'}">
    <div style="max-width:88%;padding:10px 13px;border-radius:${me?'16px 16px 5px 16px':'16px 16px 16px 5px'};
      font-size:14px;line-height:1.5;white-space:pre-wrap;
      background:${me?'linear-gradient(155deg,var(--sky),var(--lteal))':'rgba(255,255,255,.55)'};
      color:${me?'#1A0A0C':'var(--ink)'};
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.7),0 8px 18px -14px rgba(225,6,27,.6)">${esc(m.text)}</div>
  </div>`;
}
function coachRead(){
  const done = todayDone(), total = todayTotal(), next = upNext();
  const spend = spentMonth(), allowance = Math.max(0, freeAfterFixed());
  const bits = [];
  bits.push(done===0?`Nothing logged yet today — ${total} tasks are waiting.`:`${done} of ${total} done today.`);
  if (next) bits.push(`Next best move: ${next.name.toLowerCase()}.`);
  else if (total) bits.push('Everything is ticked. Go and eat properly.');
  if (spend > allowance) bits.push(`You are £${Math.round(spend-allowance)} past your flexible budget this month — pause the small buys.`);
  const gap = needPerMonth() - feasiblePerMonth();
  if (gap > 0) bits.push(`Savings gap is £${Math.round(gap)}/month against the £25k target.`);
  return esc(bits.join(' '));
}

