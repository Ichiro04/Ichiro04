/* ============================================================
   PULSE · top of the Progress tab (19 Nov 2026)
   From the "data-visualization" skill reel: one day score ring,
   three activity rings and a sleep card, all from his own data.
   Replaces the four KPI tiles that used to sit above Statistics.
   - Day score 0–100 = tasks 40% + steps 20% + sleep 20% + training 20%.
   - Compared with the average of the 7 days before today.
   - Ring colours passed the dataviz palette check on #F2F1ED:
     crimson #A3122A (steps), amber #C2742A (training), blue #3B6FB0 (focus).
   ============================================================ */
const PU_SLEEP_GOAL = 450; // minutes (7 h 30 m)

function puTrain(k){
  const ids = tasksForDay(k).map(t => t.id);
  if (ids.includes('train')) return Math.max(sessionDonePct(k) / 100, taskDone(k, 'train') ? 1 : 0);
  if (ids.includes('mobility')) return taskDone(k, 'mobility') ? 1 : 0;
  return 1;
}
function puFocus(k){
  const plan = dayBlocks(k).filter(b => !b.skip).reduce((a, b) => a + (b.dur || 0), 0), done = focusOf(k);
  return { done, plan, pct: plan ? Math.min(1, done / plan) : 0 };
}
function puParts(k){
  const r = dayRec(k), goal = +state.settings.stepsGoal || 8000, sl = sleepMins(r);
  return { tasks: dayScore(k), done: countDone(k), tot: tasksForDay(k).length, steps: +r.steps || 0, stepsP: Math.min(1, (+r.steps || 0) / goal), goal,
    sleep: sl, sleepP: sl ? Math.min(1, sl / PU_SLEEP_GOAL) : 0, train: puTrain(k) };
}
function puScore(k){ const p = puParts(k); return Math.round(100 * (.4 * p.tasks + .2 * p.stepsP + .2 * p.sleepP + .2 * p.train)); }

function puRing(cx, cy, r, w, pct, col, track = 'rgba(113,0,20,.08)'){
  const c = 2 * Math.PI * r, d = Math.max(0, Math.min(1, pct)) * c;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${track}" stroke-width="${w}"/>
    ${d < .5 ? '' : `<circle class="pu-arc" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${d.toFixed(1)} ${c.toFixed(1)}" style="--c:${c.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`}`;
}

function dayPulseHTML(){
  const k = dkey(), p = puParts(k), sc = puScore(k), h = new Date().getHours();
  const prev = Array.from({ length: 7 }, (_, i) => puScore(dkey(addDays(new Date(), -1 - i)))), avg = Math.round(prev.reduce((a, b) => a + b, 0) / 7), diff = sc - avg;
  const hello = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const head = sc >= 85 ? 'Strong day.' : sc >= 60 ? 'On track.' : sc >= 30 ? 'Keep going.' : h < 11 ? 'Day just started.' : 'Quiet day so far.';
  const saved = savedTotal(), goalM = +state.settings.goal || 25000, fo = puFocus(k);
  const bar = (label, val, pct) => `<div class="pu-sb"><small>${label}</small><b class="num">${val}</b><i><em style="width:${Math.round(pct * 100)}%"></em></i></div>`;
  const ringsT = `Steps ${p.steps.toLocaleString('en-GB')} of ${p.goal.toLocaleString('en-GB')}, training ${Math.round(p.train * 100)}%, focus ${fmtHM(fo.done)} of ${fmtHM(fo.plan)}`;
  // sleep: last 7 nights
  const nights = Array.from({ length: 7 }, (_, i) => { const kk = dkey(addDays(new Date(), i - 6)); return { k: kk, m: sleepMins(dayRec(kk)) || 0 }; });
  const logged = nights.filter(n => n.m), sAvg = logged.length ? Math.round(logged.reduce((a, n) => a + n.m, 0) / logged.length) : 0, sMax = Math.max(PU_SLEEP_GOAL, ...nights.map(n => n.m));
  const f = dayRec(k).feel || {};
  return `<div class="pu" id="puRoot">
    <section class="pu-score" aria-label="Day score">
      <div class="pu-hi"><div><small>${DAYS_LONG[isoWeekday()]}, ${new Date().getDate()} ${MONTHS[new Date().getMonth()]}</small><b>${hello}, ${esc(mvFirstName())}</b></div>
        <div class="pu-chips"><span>${ic('flame', 13)} ${currentStreak()}-day streak</span><span>${ic('piggy', 13)} ${Math.round(saved / goalM * 100)}% saved</span></div></div>
      <div class="pu-main">
        <svg class="pu-big" viewBox="0 0 132 132" role="img" aria-label="Day score ${sc} out of 100">${puRing(66, 66, 54, 12, sc / 100, 'url(#puG)', 'rgba(255,255,255,.14)')}
          <defs><linearGradient id="puG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD7A8"/><stop offset=".55" stop-color="#F08A4B"/><stop offset="1" stop-color="#FF4D63"/></linearGradient></defs>
          <text x="66" y="68" class="pu-n">${sc}</text><text x="66" y="88" class="pu-of">out of 100</text></svg>
        <div class="pu-say"><b>${head}</b><span class="pu-d ${diff >= 0 ? 'up' : 'down'}">${diff >= 0 ? '↑' : '↓'} ${Math.abs(diff)} ${diff >= 0 ? 'above' : 'below'} your 7-day average (${avg})</span>
          <small>Tasks 40% · steps 20% · sleep 20% · training 20%</small></div></div>
      <div class="pu-sbs">${bar('Tasks', `${p.done}/${p.tot}`, p.tasks)}${bar('Steps', p.steps.toLocaleString('en-GB'), p.stepsP)}${bar('Sleep', p.sleep ? fmtHM(p.sleep) : '–', p.sleepP)}${bar('Training', Math.round(p.train * 100) + '%', p.train)}</div>
    </section>
    <section class="pu-card pu-act" aria-label="Activity rings">
      <div class="pu-ch"><b>Activity</b><small>Today</small></div>
      <div class="pu-actb"><svg viewBox="0 0 120 120" role="img" aria-label="${esc(ringsT)}">${puRing(60, 60, 50, 11, p.stepsP, '#A3122A')}${puRing(60, 60, 36, 11, p.train, '#C2742A')}${puRing(60, 60, 22, 11, fo.pct, '#3B6FB0')}</svg>
        <ul class="pu-leg">
          <li><i style="background:#A3122A"></i><span>Steps</span><b class="num">${p.steps.toLocaleString('en-GB')}</b><small>of ${p.goal.toLocaleString('en-GB')}</small></li>
          <li><i style="background:#C2742A"></i><span>Training</span><b class="num">${Math.round(p.train * 100)}%</b><small>${tasksForDay(k).some(t => t.id === 'train') ? 'strength session' : tasksForDay(k).some(t => t.id === 'mobility') ? 'mobility day' : 'rest day'}</small></li>
          <li><i style="background:#3B6FB0"></i><span>Focus</span><b class="num">${fmtHM(fo.done)}</b><small>of ${fmtHM(fo.plan)} planned</small></li></ul></div>
    </section>
    <section class="pu-card pu-sleep" aria-label="Sleep">
      <div class="pu-ch"><b>Sleep</b><small>Last night</small></div>
      ${p.sleep ? `<div class="pu-sl"><b class="num">${Math.floor(p.sleep / 60)}<small>h</small> ${p.sleep % 60}<small>m</small></b><span>${Math.round(p.sleep / PU_SLEEP_GOAL * 100)}% of your 7h 30m goal</span></div>`
        : `<div class="pu-sl"><b class="num">–</b><button class="btn btn-soft sm" data-pu-go="today">Add last night</button></div>`}
      <div class="pu-bars" role="img" aria-label="Sleep, last 7 nights: ${nights.map(n => `${shortDate(parseKey(n.k))} ${n.m ? fmtHM(n.m) : 'not logged'}`).join(', ')}">
        ${nights.map(n => `<div title="${esc(shortDate(parseKey(n.k)))} · ${n.m ? fmtHM(n.m) : 'not logged'}"><i style="height:${n.m ? Math.max(4, Math.round(n.m / sMax * 56)) : 3}px" class="${n.m ? (n.m >= PU_SLEEP_GOAL ? 'ok' : '') : 'no'}"></i><small>${DAYS[isoWeekday(parseKey(n.k))].slice(0, 1)}</small></div>`).join('')}
        <em style="bottom:${17 + Math.round(PU_SLEEP_GOAL / sMax * 56)}px" title="Goal 7 h 30 min" aria-hidden="true"></em></div>
      <div class="pu-sf"><span>7-night average <b class="num">${sAvg ? fmtHM(sAvg) : '–'}</b></span><span>Energy <b class="num">${f.energy || '–'}/5</b></span></div>
    </section>
  </div>`;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-pu-go]'); if (!b) return; e.stopPropagation(); setTab(b.dataset.puGo, { force: true }); }, true);
