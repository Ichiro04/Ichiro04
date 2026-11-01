/* ============================================================
   COACH ENGINE — rule-based, reads your own numbers
   ============================================================ */
function moneyRead(){
  const spend = spentMonth(), free = freeAfterFixed(), dim = monthProgress().dim, day = monthProgress().day;
  const proj = day ? spend/day*dim : 0;
  const gap = Math.max(0, needPerMonth()-feasiblePerMonth());
  const lines = [];
  lines.push(`Money, honestly: ${money0(spend)} spent in ${monthProgress().day} days, which projects to ${money0(proj)} by month end.`);
  lines.push(`Flexible budget is ${money0(free)} a month, so you are ${proj>free?'over by '+money0(proj-free):'inside it by '+money0(free-proj)}.`);
  if (gap > 0){
    lines.push(`The £25,000 target needs ${money0(needPerMonth())} a month. Your fixed costs leave ${money0(free)}, and a survivable save rate is ${money0(feasiblePerMonth())}.`);
    lines.push(`Gap: ${money0(gap)} a month, or ${money0(gap*12)} a year.`);
    lines.push(`Fix: one extra shift a month (~£150), one paid piece of CAD or tutoring work a month (~£200), and halve the eating out (~£45). That is ${money0(395)} before touching your food shop.`);
  } else {
    lines.push(`You are on track. Set a standing order for ${money0(needPerMonth())} on payday and treat your current account as the spending account only.`);
  }
  lines.push(`Next action: log tonight's spending before you sleep — including the small ones.`);
  return lines.join('\n\n');
}
function trainRead(){
  const sess = todaysSession();
  const pct = sessionDonePct();
  const wk = workoutsThisWeek();
  const w = lastWeight(), ch = weightChangeWeek();
  const lines = [];
  lines.push(`Training: ${wk} of 6 sessions logged this week, today's ${sess.id==='REST'?'rest day':sess.day.toLowerCase()} is ${pct}% complete.`);
  if (pct < 100 && sess.blocks.length) lines.push(`Unfinished sets: ${sess.blocks.length} movements. Start with ${EX[sess.blocks[0].ex].name.toLowerCase()} — three sets, two minutes rest, done inside 15 minutes.`);
  lines.push(`Bodyweight is ${num(w)} kg${ch!==null?` (${ch>0?'+':''}${num(ch)} kg this week)`:''}. Target ${state.profile.weightTarget} kg.`);
  if (ch !== null && ch > 0.4) lines.push(`A gain of ${num(ch)} kg in a week is usually water, salt or a missed walk, not fat. Keep the food log honest and the steps at 8,000.`);
  lines.push(`At this bodyweight, hold protein near ${Math.round(150)} g and keep the walking daily. The plan builds strength while the fat comes off slowly — that is the point.`);
  return lines.join('\n\n');
}
function ieltsRead(){
  const e = essaysThisWeek(), s = speakingThisWeek();
  const avg = avgEssayBand();
  const lines = [];
  lines.push(`English: ${e} essay${e===1?'':'s'} this week, ${s} speaking day${s===1?'':'s'}. Target band ${num(state.settings.ieltsTarget)}.`);
  if (e < 2) lines.push(`You need two timed essays a week minimum. Forty minutes, 270 words, one clear position. Writing without a timer teaches you nothing about exam performance.`);
  if (s < 3) lines.push(`Speaking is the cheapest mark to move. One cue card a day, recorded, two minutes without stopping. Do it while you walk.`);
  if (avg) lines.push(`Average self-assessed band ${num(avg)}. The usual ceiling at this stage is Task Response and lexical range — not grammar. Answer the exact question, then explain why.`);
  lines.push(`Next action: today's prompt is about ${essayPromptToday().type.toLowerCase()}. Open Learn, start the timer, write the position sentence before anything else.`);
  return lines.join('\n\n');
}
function stuckRead(){
  const done = todayDone(), total = todayTotal(), next = upNext();
  const lines = [];
  lines.push(`Stuck is usually too big a first step, not too little discipline.`);
  lines.push(`Right now you have done ${done} of ${total} today, and your streak is ${currentStreak()} days.`);
  if (next) lines.push(`Do only this: ${next.name.toLowerCase()}. Not the whole list. Set a five minute timer on it and stop when it rings.`);
  lines.push(`Then tick it. A ticked box at 9pm is worth more than a perfect plan at 9am.`);
  lines.push(`If it is the money part that is worrying you, that is a different problem — say "money" and I will show you the numbers instead of the fog.`);
  return lines.join('\n\n');
}
function planRead(){
  const k = dkey();
  const list = tasksForDay(k);
  const next = upNext();
  const lines = [`Here is today, in order. You have 1.5–2 hours.`];
  lines.push(list.map((t,i)=>`${i+1}. ${t.name} — ${t.meta}${taskDone(k,t.id)?' ✓':''}`).join('\n'));
  if (next) lines.push(`Start with ${next.name.toLowerCase()}. ${next.go==='train'?'Warm up for five minutes first, then the first three movements only.':next.go==='learn'?'Timer on, phone face down, one task only.':next.go==='money'?'Sixty seconds of admin, then done.':'Set a timer and stop when it rings.'}`);
  lines.push(`Non-negotiables: 8,000 steps, 130g+ protein, lights out by 11. Everything else is negotiable.`);
  return lines.join('\n\n');
}
function weeklyReview(){
  const days = Array.from({length:7},(_,i)=>dkey(addDays(startOfWeek(),i)));
  const doneDays = days.filter(d=>isStreakDay(d)).length;
  const tasks = days.reduce((a,d)=>a+countDone(d),0);
  const sess = workoutsThisWeek();
  const spend = spentMonth();
  const essays = essaysThisWeek();
  const wch = weightChangeWeek();
  const wins = [], fixes = [];
  if (doneDays >= 4) wins.push(`${doneDays} streak days out of 7 — the habit is holding.`); else fixes.push(`Only ${doneDays} streak days. Pick two fixed times in the day and defend them.`);
  if (sess >= 3) wins.push(`${sess} sessions logged: you are actually training, not just reading about training.`); else fixes.push(`${sess} sessions. Put Monday, Tuesday and Thursday in the calendar like shifts.`);
  if (essays >= 2) wins.push(`${essays} essays written.`); else fixes.push(`${essays} essays — write one before Thursday.`);
  if (spend <= freeAfterFixed()) wins.push(`Spending is inside the flexible budget at ${money0(spend)}.`); else fixes.push(`Spending is ${money0(spend - freeAfterFixed())} past your flexible budget.`);
  if (wch !== null) (wch <= 0 ? wins : fixes).push(`Bodyweight ${wch>0?'+':''}${num(wch)} kg this week.`);
  const lines = [`Weekly review · ${shortDate(startOfWeek())} to ${shortDate(addDays(startOfWeek(),6))}`];
  lines.push(`${tasks} tasks completed, ${doneDays}/7 streak days, ${sess}/6 sessions, ${essays} essays, ${money0(spend)} spent.`);
  if (wins.length) lines.push(`Held:\n${wins.map(w=>'· '+w).join('\n')}`);
  if (fixes.length) lines.push(`Slipped:\n${fixes.map(f=>'· '+f).join('\n')}`);
  lines.push(`Next week's single focus: ${doneDays < 4 ? 'hit four tasks a day, no exceptions' : sess < 3 ? 'three strength sessions, minimum' : essays < 2 ? 'two timed essays' : 'raise the money gap by £150'}.`);
  return lines.join('\n\n');
}
function careerRead(){
  const learned = Object.keys(state.knowledge).length;
  const pf = (state.career && state.career.portfolio) || {};
  const pfDone = PORTFOLIO.filter(p=>pf[p.id]).length;
  const lines = [];
  lines.push(`Career, honestly: you are not a fresh graduate. You have run automated packaging lines, held CNC tolerances, done materials testing and trained operators. That is two years of plant experience most people on your course do not have.`);
  lines.push(`You have applied to Huhtamaki as a thermo machine operator. Whatever happens, start now: learn the cooling cycle, the tooling and the scrap numbers, and prepare for the 30-minute technical assessment, the warehouse tour and the final interview.`);
  const nb = KNOWLEDGE_PACKS.find(p=>!state.knowledge[p.id]);
  lines.push(`Knowledge: ${learned} of ${KNOWLEDGE_PACKS.length} packs started. Next best subject: ${nb ? nb.title.toLowerCase() : 'a revision pass over what you have already read'}.`);
  lines.push(`Portfolio: ${pfDone} of ${PORTFOLIO.length} pieces done. The one that moves you fastest is the cooling-rate study on a single page — you already have the data from Portsmouth, and it is the story that connects your degree to their process.`);
  lines.push(`CV: numbers first, coursework language out, target role in the first line, Huhtamaki application kept off until you have an offer. Then give it to someone who will tell you the truth.`);
  lines.push(`Next action: rehearse the answer to "tell me about a fault you diagnosed". One minute, out loud, no notes. Your seal-integrity story is the strongest thing you own.`);
  return lines.join('\n\n');
}
function sleepRead(){
  return [
    `Sleep is not a soft goal, it is the input to every other number.`,
    `Under seven hours and your training volume drops, your appetite for sugar rises, and your essay errors double.`,
    `Tonight: screens off 30 minutes before bed, room dark and cool, alarm at a fixed time even at weekends.`,
    `If you genuinely cannot sleep, the answer is usually the last coffee, not the last thought.`
  ].join('\n\n');
}
function fallbackRead(){
  const done = todayDone(), total = todayTotal();
  const spend = spentMonth(), free = freeAfterFixed();
  return [
    `Here is the state of things.`,
    `${done}/${total} tasks today, ${currentStreak()} day streak, ${workoutsThisWeek()}/6 sessions this week, ${essaysThisWeek()} essays.`,
    `Saved ${money0(savedTotal())} of ${money0(state.settings.goal)}; ${money0(spend)} spent this month against ${money0(free)} flexible.`,
    `The one thing that would move the most in the next hour: ${upNext() ? upNext().name.toLowerCase() : 'go outside and walk'}.`,
    `Ask me for a plan, a review, money, training, English or career — I read your own numbers, not generic advice.`
  ].join('\n\n');
}
function generateReply(text){
  const q = text.toLowerCase();
  if (/review|week(ly)?/.test(q)) return weeklyReview();
  if (/money|spend|save|saving|budget|£|rent|pay/.test(q)) return moneyRead();
  if (/train|workout|gym|strength|exercise|body|weight|muscle|kg|run/.test(q)) return trainRead();
  if (/ielts|essay|speak|english|band|writing|vocab/.test(q)) return ieltsRead();
  if (/career|job|engineer|learn|knowledge|interview|cv/.test(q)) return careerRead();
  if (/stuck|motivat|tired|lazy|can'?t|give up|overwhelm|anxious/.test(q)) return stuckRead();
  if (/sleep|rest|recover|energy/.test(q)) return sleepRead();
  if (/plan|today|next|should i|start|day/.test(q)) return planRead();
  return fallbackRead();
}

/* streaming chat */
function mountChatScroll(){
  const log = $('#chatLog'); if (log) log.scrollTop = log.scrollHeight;
}
async function sendMessage(text){
  if (coachBusy) return;
  coachBusy = true;
  state.chat.push({ role:'user', text, ts:Date.now() });
  save();
  const log = $('#chatLog');
  const tpl = document.createElement('div');
  tpl.style.justifyContent = 'flex-end';
  tpl.innerHTML = chatBubble({ role:'user', text });
  log.insertBefore(tpl, $('#chatStreamMount'));
  log.scrollTop = log.scrollHeight;

  const slot = document.createElement('div');
  slot.innerHTML = `<div class="thinking"><span class="dots"><i></i><i></i><i></i></span><span>Reading your numbers…</span></div>`;
  $('#chatStreamMount').before(slot);
  log.scrollTop = log.scrollHeight;

  await new Promise(r=>setTimeout(r, REDUCE_QUERY.matches ? 0 : 520));
  const reply = generateReply(text);
  slot.innerHTML = `<div style="display:flex"><div class="stream" id="liveStream" style="max-width:92%;padding:11px 13px;border-radius:16px 16px 16px 5px;background:rgba(255,255,255,.55);box-shadow:inset 0 0 0 1px rgba(255,255,255,.7)"><span id="liveText"></span><span class="cursor" id="liveCursor"></span></div></div>`;
  const liveText = slot.querySelector('#liveText');
  const cursor = slot.querySelector('#liveCursor');
  if (REDUCE_QUERY.matches || state.reduceMotion){
    liveText.textContent = reply; cursor.remove();
  } else {
    for (let i=0; i<reply.length; i+=2){
      liveText.textContent = reply.slice(0, i+2);
      if (i % 40 === 0) log.scrollTop = log.scrollHeight;
      await new Promise(r=>setTimeout(r, 12));
    }
    liveText.textContent = reply; cursor.remove();
  }
  state.chat.push({ role:'coach', text:reply, ts:Date.now() });
  save();
  log.scrollTop = log.scrollHeight;
  coachBusy = false;
}

