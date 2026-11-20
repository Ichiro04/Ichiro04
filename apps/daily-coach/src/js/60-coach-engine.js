/* ============================================================
   COACH ENGINE — rule-based, reads your own numbers
   ============================================================ */
function moneyRead(){
  // the budget list is the whole month (rent included); logged spends count against everything except rent
  const spend = spentMonth(), { dim, day } = monthProgress();
  const proj = day ? spend/day*dim : 0;
  const flex = flexMonth();
  const mk = monthKey(), savedM = state.savings.filter(x => (x.date||'').startsWith(mk)).reduce((a, x) => a + Number(x.amount||0), 0);
  const plan = feasiblePerMonth(), need = needPerMonth(), gap = Math.max(0, need - plan);
  const lines = [];
  lines.push(`Saved this month: ${money0(savedM)} of the ${money0(plan)} your budget allows. In total: ${money0(savedTotal())} of ${money0(state.settings.goal)}.`);
  lines.push(day < 7 ? `Spent: ${money0(spend)} in ${day} day${day===1?'':'s'}, ${money0(Math.max(0, flex - spend))} left of your ${money0(flex)} budget without rent. Too early in the month to project.` : `Spent: ${money0(spend)} in ${day} days, about ${money0(proj)} by month end. Your budget without rent is ${money0(flex)}, so you are ${proj>flex?'over by '+money0(proj-flex):'inside it by '+money0(flex-proj)}.`);
  if (gap > 0){
    lines.push(`The £25k goal needs ${money0(need)} a month. Your budget saves ${money0(plan)}, so the gap is ${money0(gap)} a month (${money0(gap*12)} a year).`);
    lines.push(`To close it: extra paid hours or a paid CAD job (about £200 to £350 a month), and the leaks on the Money tab.`);
  } else {
    lines.push(`You are on track. Set a standing order for ${money0(need)} on payday and treat your current account as the spending account only.`);
  }
  lines.push(`Next step: log today's spending before you sleep, small ones too.`);
  return lines.join('\n\n');
}
function trainRead(){
  const sess = todaysSession();
  const pct = sessionDonePct();
  const wk = workoutsThisWeek();
  const w = lastWeight(), ch = weightChangeWeek();
  const lines = [];
  lines.push(`Training: ${wk} of ${sessionsPlanned()} strength sessions done this week, today's ${sess.id==='REST'?'rest day':sess.day.toLowerCase()} is ${pct}% complete.`);
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
function planRead(q = ''){
  // "tomorrow", or asking after 8 pm, plans the next day instead of listing today's ticks
  const tmr = /tomorrow|tmr|tonight.*plan/.test(q) || new Date().getHours() >= 20;
  const k = tmr ? dkey(addDays(new Date(), 1)) : dkey();
  const blocks = (typeof dayBlocks === 'function' ? dayBlocks(k) : []).filter(b => !b.skip), at = t => { const b = blocks.find(x => x.task === t.id); return b ? b.start : 9999; };
  const list = tasksForDay(k).slice().sort((a, b) => at(a) - at(b));   // in time order
  const next = tmr ? list[0] : upNext();
  const lines = [tmr ? `Here is tomorrow (${shortDate(parseKey(k))}), in order. You have 1.5–2 hours.` : `Here is today, in order. You have 1.5–2 hours.`];
  lines.push(list.map((t,i)=>{ const b = blocks.find(x => x.task === t.id); return `${i+1}. ${b ? b.t + ' · ' : ''}${t.name} — ${t.meta}${!tmr && taskDone(k,t.id)?' ✓':''}`; }).join('\n'));
  if (next) lines.push(`${tmr ? 'First thing' : 'Start with'}: ${next.name.toLowerCase()}. ${next.go==='train'?'Warm up for five minutes first, then the first three movements only.':next.go==='learn'?'Timer on, phone face down, one task only.':next.go==='money'?'Sixty seconds of admin, then done.':'Set a timer and stop when it rings.'}`);
  if (tmr) lines.push(`Tonight: lay out what the first block needs, log today's spending, lights out by 11.`);
  else lines.push(`Non-negotiables: 8,000 steps, 130g+ protein, lights out by 11. Everything else is negotiable.`);
  return lines.join('\n\n');
}
function weeklyReview(){
  // on Monday the new week has barely started, so review the week that just ended
  const ws = isoWeekday() === 0 ? addDays(startOfWeek(), -7) : startOfWeek(), we = addDays(ws, 6), past = isoWeekday() === 0;
  const days = Array.from({length:7},(_,i)=>dkey(addDays(ws,i))).filter(d => d <= dkey());
  const doneDays = days.filter(d=>isStreakDay(d)).length;
  const tasks = days.reduce((a,d)=>a+countDone(d),0);
  const sess = workoutsThisWeek(ws), plan = sessionsPlanned(ws);
  const spend = state.expenses.filter(e => e.date >= dkey(ws) && e.date <= dkey(we)).reduce((a, e) => a + Number(e.amount||0), 0), wkBudget = flexMonth() * 7 / 30.4;
  const essays = essaysThisWeek(ws), spk = speakingThisWeek(ws);
  const wch = weightChangeWeek();
  const wins = [], fixes = [];
  if (doneDays >= Math.min(4, days.length)) wins.push(`${doneDays} streak days out of ${days.length} — the habit is holding.`); else fixes.push(`Only ${doneDays} streak days out of ${days.length}. Pick two fixed times in the day and defend them.`);
  if (sess >= plan) wins.push(`${sess} of ${plan} strength sessions done.`); else fixes.push(`${sess} of ${plan} strength sessions. Treat the next one like a shift.`);
  if (essays >= 2) wins.push(`${essays} essays written.`); else fixes.push(`${essays} essay${essays===1?'':'s'} — ${past ? 'two this week' : 'write one before Thursday'}.`);
  if (spk >= 3) wins.push(`${spk} speaking days.`); else fixes.push(`${spk} speaking day${spk===1?'':'s'}. One cue card on a walk counts.`);
  if (spend <= wkBudget) wins.push(`Spending ${money0(spend)}, inside the week's share (${money0(wkBudget)}).`); else fixes.push(`Spending ${money0(spend)}, ${money0(spend - wkBudget)} over the week's share.`);
  if (wch !== null) (wch <= 0 ? wins : fixes).push(`Bodyweight ${wch>0?'+':''}${num(wch)} kg this week.`);
  const lines = [`Weekly review · ${shortDate(ws)} to ${shortDate(we)}${past ? ' (last week)' : ''}`];
  lines.push(`${tasks} tasks completed, ${doneDays} streak days, ${sess}/${plan} sessions, ${essays} essays, ${spk} speaking days, ${money0(spend)} spent.`);
  if (wins.length) lines.push(`Held:\n${wins.map(w=>'· '+w).join('\n')}`);
  if (fixes.length) lines.push(`Slipped:\n${fixes.map(f=>'· '+f).join('\n')}`);
  lines.push(`Next week's single focus: ${doneDays < Math.min(4, days.length) ? 'hit four tasks a day, no exceptions' : sess < plan ? `${plan} strength sessions` : essays < 2 ? 'two timed essays' : spk < 3 ? 'three speaking days' : 'raise the money gap by £150'}.`);
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
  const spend = spentMonth(), free = flexMonth();
  return [
    `Here is the state of things.`,
    `${done}/${total} tasks today, ${currentStreak()} day streak, ${workoutsThisWeek()}/${sessionsPlanned()} sessions this week, ${essaysThisWeek()} essays.`,
    `Saved ${money0(savedTotal())} of ${money0(state.settings.goal)}; ${money0(spend)} spent this month against ${money0(free)} to spend (budget without rent).`,
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
  if (/plan|today|tomorrow|next|should i|start|day/.test(q)) return planRead(q);
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
  slot.innerHTML = `<div class="thinking"><span class="dots"><i></i><i></i><i></i></span><span>Engineer is checking the data…</span></div>`;
  $('#chatStreamMount').before(slot);
  log.scrollTop = log.scrollHeight;

  await new Promise(r=>setTimeout(r, motionOff() ? 0 : 520));
  const reply = generateReply(text);
  slot.innerHTML = `<div class="radio-row"><div class="radio eng">${radioHead(false)}<div class="radio-body stream" id="liveStream"><span id="liveText"></span><span class="caret" id="liveCursor"></span></div></div></div>`;
  const liveText = slot.querySelector('#liveText');
  const cursor = slot.querySelector('#liveCursor');
  if (motionOff()){
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

