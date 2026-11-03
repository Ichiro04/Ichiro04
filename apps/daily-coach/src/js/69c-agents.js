/* ============================================================
   AGENTS · control centre (3 Nov 2026, user: "build my agents and a
   dashboard to check and track them; which agents are best for me;
   build it so they can spread in the future")
   - Each agent watches one part of the user's own data, scores it,
     finds what needs doing and records a daily snapshot.
   - Everything runs in this browser, with the autopilot (on open, on
     return, every 15 minutes). Nothing is sent anywhere.
   - To add an agent later: add one entry to AGENTS with a run(ctx)
     that returns { score, headline, kpis, findings }. The dashboard,
     history, ranking, pipeline and log pick it up by themselves.
   ============================================================ */
const AG_W = { english:.22, career:.22, money:.2, engineering:.16, training:.1, routine:.1 }; // how much each area matters to his goals
const AG_COLORS = { chief:'var(--ag-cy)', fit:'#FF6B81', ielts:'#B79BFF', eng:'#2EE6C5', career:'#FFC24D', money:'#7DDB6A', health:'#6FA8FF', review:'#FF9A5C' };

function agCtx(){
  if (AG.ctx && AG.ctx.at > Date.now() - 4000) return AG.ctx;
  const k = dkey(), s7 = periodStats(dkey(addDays(new Date(), -6)), k), s14 = periodStats(dkey(addDays(new Date(), -13)), k), s30 = periodStats(dkey(addDays(new Date(), -29)), k);
  const blocksDone = (id, days) => { let n = 0, of = 0; for (let i = 0; i < days; i++){ const kk = dkey(addDays(new Date(), -i)), b = dayBlocks(kk).find(x => x.id === id); if (b && !b.skip){ of++; if (blockStatus(kk, b) === 'done') n++; } } return { n, of }; };
  const todayBlock = id => { const b = dayBlocks(k).find(x => x.id === id && !x.skip); return b ? { b, s: blockStatus(k, b) } : null; };
  return AG.ctx = { at: Date.now(), k, s7, s14, s30, a14: areaScores(s14), blocksDone, todayBlock };
}
const agPct = (n, of) => of ? Math.round(Math.min(1, n / of) * 100) : 0;
const fnd = (id, t, why, go, sev = 2) => ({ id, t, why, go, sev });

const AGENTS = [
  { id:'chief', name:'Chief of staff', area:'All areas', icon:'robot', role:'Runs the team, builds today’s plan and tells you what needs you first.',
    run(c){ const res = AGENTS.filter(a => a.id !== 'chief' && agOn(a.id)).map(a => agResult(a.id)).filter(Boolean);
      const score = res.length ? Math.round(res.reduce((s, r) => s + r.score * (AG_W[r.wkey] || .1), 0) / res.reduce((s, r) => s + (AG_W[r.wkey] || .1), 0)) : 0;
      const top = res.flatMap(r => r.findings.map(f => ({ ...f, id: r.id + ':' + f.id, from: r.name }))).filter(f => !agDone(f.id)).sort((a, b) => b.sev - a.sev).slice(0, 4);
      const plan = (state.coachPlan && state.coachPlan.items) || [];
      return { score, headline: top.length ? `${top.length} things need you today. Start with: ${top[0].t.toLowerCase()}.` : 'The team has nothing urgent for you. Keep the plan going.',
        kpis: [['Team score', score, 'weighted by your goals'], ['Agents on', `${AGENTS.filter(a => agOn(a.id)).length}/${AGENTS.length}`, 'working for you'], ['Plan items', plan.length, 'on the Coach tab'], ['Streak', currentStreak(), 'days']],
        findings: top.map(f => ({ ...f, why: `${f.from} · ${f.why}` })) }; } },
  { id:'fit', name:'Fitness agent', area:'Training', wkey:'training', icon:'dumbbell', role:'Watches your sessions, steps and weight, and keeps you training four days a week.',
    run(c){ const tr = c.blocksDone('train', 7), stepsAvg = c.s7.stepsAvg || 0, goal = +state.settings.stepsGoal || 8000, wch = c.s30.weightChange;
      const score = Math.round(agPct(tr.n, Math.max(1, tr.of)) * .55 + agPct(stepsAvg, goal) * .3 + (c.s7.weighN ? 15 : 0));
      const f = [], t = c.todayBlock('train') || c.todayBlock('mobility');
      if (t && t.s !== 'done') f.push(fnd('today', `${t.b.name} at ${t.b.t}`, t.b.note, 'train', 3));
      if (tr.of && tr.n < tr.of - 1) f.push(fnd('miss', `${tr.of - tr.n} strength sessions missed this week`, 'Do the next one in full rather than catching up', 'train', 2));
      if (stepsAvg < goal * .8) f.push(fnd('steps', `Steps average ${stepsAvg.toLocaleString('en-GB')} a day`, `Goal is ${goal.toLocaleString('en-GB')}: add a 20-minute walk`, 'today', 2));
      if (!c.s7.weighN) f.push(fnd('weigh', 'No weigh-in this week', 'Monday morning, before food', 'progress', 1));
      return { score, headline: `${tr.n} of ${tr.of} strength sessions this week, ${stepsAvg.toLocaleString('en-GB')} steps a day.`,
        kpis: [['Sessions', `${tr.n}/${tr.of}`, 'this week'], ['Steps', stepsAvg.toLocaleString('en-GB'), 'a day, 7 days'], ['Weight', wch == null ? '–' : (wch > 0 ? '+' : '') + wch.toFixed(1) + ' kg', '30 days'], ['Target', (state.profile.weightTarget || 72) + ' kg', 'body weight']], findings: f }; } },
  { id:'ielts', name:'IELTS agent', area:'English', wkey:'english', icon:'pen', role:'Plans essays, speaking and vocabulary towards band 7 and your exam date.',
    run(c){ const es = c.blocksDone('essay', 14), sp = c.blocksDone('speaking', 14), vo = c.blocksDone('vocab', 7), essays = (state.ielts && state.ielts.essays) || [];
      const banded = essays.filter(e => e.band).slice(-5), band = banded.length ? banded.reduce((s, e) => s + +e.band, 0) / banded.length : null, ex = state.settings.examDate, dl = ex ? daysBetween(c.k, ex) : null;
      const crit = essays.filter(e => e.crit).slice(-5), weak = crit.length ? ['tr', 'cc', 'lr', 'gra'].map(id => [id, crit.reduce((s, e) => s + (+e.crit[id] || 0), 0) / crit.length]).sort((a, b) => a[1] - b[1])[0] : null;
      const score = Math.round(agPct(es.n, es.of) * .4 + agPct(sp.n, sp.of) * .3 + agPct(vo.n, vo.of) * .3);
      const f = [], te = c.todayBlock('essay'), ts = c.todayBlock('speaking');
      if (te && te.s !== 'done') f.push(fnd('essay', `Task 2 essay at ${te.b.t}`, 'Write it in Learn → Essay and score it', 'learn', 3));
      if (ts && ts.s !== 'done') f.push(fnd('speak', `Speaking cue card at ${ts.b.t}`, '1 minute to plan, 2 to talk', 'learn', 2));
      if (weak) f.push(fnd('weak', `Weakest area: ${({ tr:'task response', cc:'coherence', lr:'vocabulary', gra:'grammar' })[weak[0]]}`, `Average ${weak[1].toFixed(1)} in your last essays`, 'learn', 2));
      if (!ex) f.push(fnd('date', 'Set your IELTS exam date', 'A date turns practice into a plan', 'learn', 1));
      return { score, headline: `${es.n} essays and ${sp.n} speaking cards in 14 days${band ? `, essays averaging band ${band.toFixed(1)}` : ''}.`,
        kpis: [['Essays', `${es.n}/${es.of}`, '14 days'], ['Speaking', `${sp.n}/${sp.of}`, '14 days'], ['Band', band ? band.toFixed(1) : '–', `target ${state.settings.ieltsTarget || 7}`], ['Exam', dl == null ? 'no date' : dl + ' days', 'to go']], findings: f }; } },
  { id:'eng', name:'Engineering agent', area:'Engineering', wkey:'engineering', icon:'gears', role:'Picks your next knowledge pack and Lab practice from your weakest Orbit topics.',
    run(c){ const pk = c.blocksDone('knowledge', 14), lab = c.blocksDone('labpractice', 14), w = typeof weakestTopic === 'function' ? weakestTopic() : null, mast = typeof apStudyAvg === 'function' ? Math.round(apStudyAvg() * 100) : 0;
      const score = Math.round(agPct(pk.n, pk.of) * .55 + agPct(lab.n, lab.of || 1) * .2 + mast * .25);
      const f = [], tk = c.todayBlock('knowledge') || c.todayBlock('labpractice');
      if (tk && tk.s !== 'done') f.push(fnd('today', `${tk.b.name} at ${tk.b.t}`, tk.b.note, tk.b.id === 'labpractice' ? 'lab' : 'learn', 3));
      if (w && w.t) f.push(fnd('weak', `Study next: ${w.t.n || w.t.name || ''}`, `${w.d.name || w.d.title} is your biggest gap`, 'learn', 2));
      if (pk.of && pk.n < pk.of / 2) f.push(fnd('packs', `${pk.of - pk.n} packs missed in 14 days`, 'One pack a day, 20 minutes', 'learn', 1));
      return { score, headline: `${pk.n} of ${pk.of} packs in 14 days; Orbit study level ${mast}%.`,
        kpis: [['Packs', `${pk.n}/${pk.of}`, '14 days'], ['Lab', `${lab.n}/${lab.of}`, '14 days'], ['Mastery', mast + '%', 'Orbit'], ['Gap', w && w.d ? (w.d.name || w.d.title) : '–', 'biggest']], findings: f }; } },
  { id:'career', name:'Career agent', area:'Career', wkey:'career', icon:'target', role:'Keeps the job search moving: applications, follow-ups and interview practice.',
    run(c){ const jb = c.blocksDone('jobs', 14), cr = c.blocksDone('career', 14), score = Math.round(agPct(jb.n, jb.of) * .75 + agPct(cr.n, cr.of || 1) * .25);
      const f = [], tj = c.todayBlock('jobs') || c.todayBlock('career');
      if (tj && tj.s !== 'done') f.push(fnd('today', `${tj.b.name} at ${tj.b.t}`, tj.b.note, 'learn', 3));
      if (jb.of && jb.n < jb.of / 2) f.push(fnd('pace', `${jb.n} job-search blocks in 14 days`, 'Aim for two applications or one follow-up a day', 'learn', 2));
      f.push(fnd('story', 'Practise one interview story out loud', 'Learn → Career → Stories, 60 seconds each', 'learn', 1));
      return { score, headline: `${jb.n} of ${jb.of} job-search blocks done in 14 days.`,
        kpis: [['Job search', `${jb.n}/${jb.of}`, '14 days'], ['Career 15', `${cr.n}/${cr.of}`, '14 days'], ['Target role', 'Design / mfg', 'engineer'], ['Stories', (typeof STORIES !== 'undefined' ? STORIES.length : 0), 'ready']], findings: f }; } },
  { id:'money', name:'Money agent', area:'Money', wkey:'money', icon:'pound', role:'Tracks spending against your budget and the pace to £25,000.',
    run(c){ const goal = +state.settings.goal || 25000, saved = savedTotal(), day = typeof planDay === 'function' ? planDay() : 1, pace = goal * day / 365, budget = c.s30.budget || 1, spent = c.s30.spent;
      const logged = (state.expenses || []).filter(e => e.date === c.k).length, score = Math.round(Math.min(1, saved / Math.max(1, pace)) * 55 + Math.max(0, 1 - Math.max(0, spent - budget) / budget) * 30 + (c.s7.spent > 0 ? 15 : 0));
      const f = [];
      if (saved < pace) f.push(fnd('pace', `${money0(pace - saved)} behind the savings pace`, `Day ${day}: on pace would be ${money0(pace)}`, 'money', 3));
      if (spent > budget) f.push(fnd('over', `${money0(spent - budget)} over budget in 30 days`, 'Check the biggest category on Money', 'money', 2));
      if (!logged) f.push(fnd('log', 'Log today’s spending', 'Every spend, even a coffee, before bed', 'money', 1));
      return { score, headline: `${money0(saved)} saved of ${money0(goal)}; ${money0(spent)} spent in 30 days.`,
        kpis: [['Saved', money0(saved), `of ${money0(goal)}`], ['Pace', money0(pace), `day ${day}`], ['Spent', money0(spent), '30 days'], ['Budget', money0(budget), '30 days']], findings: f }; } },
  { id:'health', name:'Sleep and routine agent', area:'Routine', wkey:'routine', icon:'moon', role:'Protects sleep, the streak and the shape of your day.',
    run(c){ const sl = c.s7.sleepAvg, done = c.s7.pct, st = currentStreak(), score = Math.round((sl ? Math.max(0, 1 - Math.abs(sl - 465) / 180) : .5) * 40 + done * .45 + Math.min(15, st));
      const f = [];
      if (!sl) f.push(fnd('sleep', 'Log your sleep times', 'The feel strip on Today, bed and up', 'today', 1));
      else if (sl < 420) f.push(fnd('sleep', `Sleeping ${Math.floor(sl / 60)} h ${Math.round(sl % 60)} min on average`, 'Lights out by 22:45 for a 06:15 start', 'today', 2));
      if (done < 60) f.push(fnd('plan', `${done}% of the plan done this week`, 'Use a Short day rather than skipping', 'today', 2));
      if (countDone(c.k) < 4) f.push(fnd('streak', `${Math.max(0, 4 - countDone(c.k))} more tasks keep the streak`, `Streak is ${st} days`, 'today', 2));
      return { score, headline: `${done}% of the plan done this week${sl ? `, ${Math.floor(sl / 60)} h ${Math.round(sl % 60)} min sleep` : ''}, ${st}-day streak.`,
        kpis: [['Plan done', done + '%', '7 days'], ['Sleep', sl ? `${Math.floor(sl / 60)}h ${Math.round(sl % 60)}m` : '–', 'average'], ['Streak', st, `best ${bestStreak()}`], ['Focus', Math.round(c.s7.focus / 60) + ' h', '7 days']], findings: f }; } },
  { id:'review', name:'Review agent', area:'Review', wkey:'routine', icon:'calendar', role:'Prepares your 2-week and monthly check-ins and turns them into a new focus.',
    run(c){ const a = ciStatus('2w'), b = ciStatus('1m'), n = (state.reviews || []).length, f = [];
      [[a, '2-week'], [b, 'Monthly']].forEach(([s, l]) => { if (s.state === 'late') f.push(fnd(l, `${l} check-in is overdue`, 'The numbers are already filled in', 'review', 3)); else if (s.state === 'due') f.push(fnd(l, `${l} check-in ${ciLabel(s)}`, 'Ten minutes in the Review tab', 'review', 2)); });
      const score = Math.max(0, 100 - f.reduce((s, x) => s + x.sev * 15, 0));
      return { score, headline: `2-week check-in ${ciLabel(a)}; monthly ${ciLabel(b)}. ${n} done so far.`,
        kpis: [['2-week', ciLabel(a), 'check-in'], ['Monthly', ciLabel(b), 'check-in'], ['Done', n, 'check-ins'], ['Focus', state.focusArea ? areaLow((AREAS.find(x => x[0] === state.focusArea) || [, state.focusArea])[1]) : 'none', 'current']], findings: f }; } }
];
/* agents that need something the app does not have yet: shown as slots for later */
const AGENTS_LATER = [
  ['Job board scout', 'target', 'Reads new engineering jobs near Portsmouth every morning', 'needs a job-site connection'],
  ['Calendar agent', 'calendar', 'Moves your plan blocks when your calendar changes', 'needs Google Calendar inside the app'],
  ['Nutrition agent', 'cart', 'Checks protein and spending on food together', 'needs food logging'],
  ['Interview coach', 'mic', 'Asks interview questions out loud and scores your answers', 'needs voice practice mode'],
  ['Builder agent', 'wrench', 'Improves this app at night and pushes to GitHub', 'runs in the cloud, not in the app']
];

const AG = { sel: 'chief', res: {}, ctx: null };
function agState(){ if (!state.agents || typeof state.agents !== 'object') state.agents = {}; if (!Array.isArray(state.agentLog)) state.agentLog = []; return state.agents; }
function agRec(id){ const s = agState(); if (!s[id]) s[id] = { on: true, hist: [], done: {} }; return s[id]; }
const agOn = id => agRec(id).on !== false;
function agDone(fid){ const [id, f] = fid.includes(':') ? fid.split(':') : [AG.sel, fid]; const d = agRec(id).done[dkey()] || []; return d.includes(f); }
function agLog(id, msg){ agState(); state.agentLog.unshift({ ts: Date.now(), id, msg }); state.agentLog = state.agentLog.slice(0, 60); }
function agResult(id){
  const a = AGENTS.find(x => x.id === id); if (!a) return null;
  if (AG.res[id] && AG.res[id].at > Date.now() - 4000) return AG.res[id];
  let r; try { r = a.run(agCtx()); } catch(err){ console.warn('agent', id, err); r = { score: 0, headline: 'This agent hit a problem reading your data.', kpis: [], findings: [] }; }
  r.score = Math.max(0, Math.min(100, Math.round(r.score || 0))); r.findings = (r.findings || []).map(f => ({ ...f, done: id === 'chief' ? false : (agRec(id).done[dkey()] || []).includes(f.id) }));
  return AG.res[id] = { ...r, id, name: a.name, wkey: a.wkey, at: Date.now() };
}
function agStatus(r){ const open = r.findings.filter(f => !f.done), hi = open.some(f => f.sev >= 3); return hi ? ['needs', 'Needs you'] : r.score >= 70 ? ['ok', 'On track'] : open.length ? ['watch', 'Watching'] : ['ok', 'On track']; }

/* one pass over every agent: daily snapshot + a log line when something changes */
function agentsRun(reason){
  AG.ctx = null; AG.res = {}; const k = dkey();
  AGENTS.forEach(a => { const rec = agRec(a.id); if (!agOn(a.id)) return; const r = agResult(a.id), last = rec.hist[rec.hist.length - 1];
    if (!last || last.d !== k){ rec.hist.push({ d: k, s: r.score, f: r.findings.length }); agLog(a.id, `Daily run: score ${r.score}, ${r.findings.length} finding${r.findings.length === 1 ? '' : 's'}.`); }
    else { if (Math.abs(last.s - r.score) >= 5) agLog(a.id, `Score ${last.s} → ${r.score}.`); last.s = r.score; last.f = r.findings.length; }
    rec.hist = rec.hist.slice(-120); rec.last = Date.now();
    Object.keys(rec.done).forEach(d => { if (daysBetween(d, k) > 30) delete rec.done[d]; }); });
  if (reason === 'manual') agLog('chief', 'You ran every agent by hand.');
  save();
}
if (typeof apRun === 'function') apRun = (orig => function(){ const r = orig.apply(this, arguments); try { agentsRun(); } catch(err){ console.warn('agents', err); } return r; })(apRun);

/* which agents matter most for him right now: goal weight × gap */
function agRanking(){
  return AGENTS.filter(a => a.id !== 'chief').map(a => { const r = agResult(a.id), w = AG_W[a.wkey] || .1, open = r.findings.filter(f => !f.done);
    return { a, r, fit: Math.round(Math.min(99, (w / .22) * (100 - r.score) * .9 + open.length * 4)), why: open.length ? open[0].t : r.headline }; }).sort((x, y) => y.fit - x.fit);
}

/* ---------- small drawing helpers ---------- */
function agRing(v, size, col, label){
  const r = size / 2 - 6, c = 2 * Math.PI * r;
  return `<svg class="ag-ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="tr"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="fg" style="stroke:${col}" stroke-dasharray="${(v / 100 * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r - 9}" class="in"/></svg><div class="ag-ring-t"><b class="num">${v}</b>${label ? `<small>${label}</small>` : ''}</div>`;
}
function agSpark(vals, col, w = 240, h = 60, base){
  if (!vals.length) return `<div class="ag-empty">The trend fills in day by day.</div>`;
  const mx = 100, x = i => vals.length === 1 ? w / 2 : i / (vals.length - 1) * w, y = v => h - 4 - v / mx * (h - 10);
  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '), id = 'g' + Math.random().toString(36).slice(2, 7);
  return `<svg class="ag-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${col};stop-opacity:.45"/><stop offset="1" style="stop-color:${col};stop-opacity:0"/></linearGradient></defs>
    ${[25, 50, 75].map(g => `<line x1="0" x2="${w}" y1="${y(g)}" y2="${y(g)}" class="gl"/>`).join('')}
    ${base && base.length > 1 ? `<polyline points="${base.map((v, i) => `${(i / (base.length - 1) * w).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}" class="base"/>` : ''}
    <polygon points="0,${h} ${pts} ${w},${h}" fill="url(#${id})"/><polyline points="${pts}" fill="none" style="stroke:${col}" stroke-width="2"/>${vals.length ? `<circle cx="${x(vals.length - 1)}" cy="${y(vals[vals.length - 1])}" r="3.5" style="fill:${col}"/>` : ''}</svg>`;
}
function agHist(id, days = 14){ const h = agRec(id).hist, out = []; for (let i = days - 1; i >= 0; i--){ const d = dkey(addDays(new Date(), -i)), e = h.find(x => x.d === d); if (e) out.push(e.s); } return out; }
const agPanel = (title, side, body, cls = '') => `<section class="ag-p ${cls}"><header class="ag-ph"><b>${title}</b>${side ? `<span>${side}</span>` : ''}</header>${body}</section>`;

/* ---------- the hub: KsHan in the middle, the team around ---------- */
function agHubHTML(){
  const list = AGENTS.filter(a => a.id !== 'chief'), W = 560, H = 360, cx = W / 2, cy = H / 2 + 6, rx = 220, ry = 128;
  const nodes = list.map((a, i) => { const t = -Math.PI / 2 + i / list.length * Math.PI * 2, x = cx + Math.cos(t) * rx, y = cy + Math.sin(t) * ry, r = agResult(a.id), [st] = agStatus(r), on = agOn(a.id);
    return { a, x, y, r, st, on }; });
  const chief = agResult('chief');
  return `<div class="ag-hub"><svg viewBox="0 0 ${W} ${H}" class="ag-hub-svg" role="img" aria-label="Your agent team around you">
    <defs><radialGradient id="agCore"><stop offset="0" style="stop-color:var(--ag-core1)"/><stop offset=".45" style="stop-color:var(--ag-core2)"/><stop offset="1" style="stop-color:var(--ag-core3);stop-opacity:0"/></radialGradient></defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" class="orb"/><ellipse cx="${cx}" cy="${cy}" rx="${rx * .62}" ry="${ry * .62}" class="orb in"/><ellipse cx="${cx}" cy="${cy}" rx="${rx * 1.18}" ry="${ry * 1.18}" class="orb out"/>
    ${nodes.map(n => `<line x1="${cx}" y1="${cy}" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}" class="link ${n.on ? n.st : 'off'}"/>`).join('')}
    <circle cx="${cx}" cy="${cy}" r="70" fill="url(#agCore)" opacity=".55"/>
    <g class="core" data-ag-sel="chief" tabindex="0" role="button" aria-label="Chief of staff">
      <circle cx="${cx}" cy="${cy}" r="44" class="core-c${AG.sel === 'chief' ? ' sel' : ''}"/><circle cx="${cx}" cy="${cy}" r="52" class="core-r"/>
      <text x="${cx}" y="${cy - 4}" class="core-t">${esc(displayName())}</text><text x="${cx}" y="${cy + 15}" class="core-s">team ${chief.score}</text></g>
    ${nodes.map(n => `<g class="node ${n.on ? n.st : 'off'}${AG.sel === n.a.id ? ' sel' : ''}" data-ag-sel="${n.a.id}" tabindex="0" role="button" aria-label="${esc(n.a.name)}, score ${n.r.score}" style="--c:${AG_COLORS[n.a.id]}">
      <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="27" class="nb"/><circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="27" class="nr" stroke-dasharray="${(n.r.score / 100 * 169.6).toFixed(1)} 169.6" transform="rotate(-90 ${n.x.toFixed(1)} ${n.y.toFixed(1)})"/>
      <text x="${n.x.toFixed(1)}" y="${(n.y + 5).toFixed(1)}" class="nv">${n.on ? n.r.score : 'off'}</text>
      <text x="${n.x.toFixed(1)}" y="${(n.y + (n.y > cy ? 44 : -36)).toFixed(1)}" class="nl">${esc(n.a.area)}</text></g>`).join('')}
  </svg></div>`;
}

/* ---------- the selected agent ---------- */
function agDetailHTML(){
  const a = AGENTS.find(x => x.id === AG.sel) || AGENTS[0], r = agResult(a.id), [st, stl] = agStatus(r), on = agOn(a.id), col = AG_COLORS[a.id], rec = agRec(a.id);
  const last = rec.last ? new Date(rec.last) : null;
  return agPanel(`${ic(a.icon, 16)} ${esc(a.name)}`, `<span class="ag-st ${on ? st : 'off'}"><i></i>${on ? stl : 'Paused'}</span>`, `
    <div class="ag-d-top" style="--c:${col}"><div class="ag-ringw">${agRing(on ? r.score : 0, 104, col, 'score')}</div>
      <div class="ag-d-t"><p>${esc(a.role)}</p><p class="ag-head">${esc(on ? r.headline : 'This agent is paused. Switch it on to let it watch this area again.')}</p>
        <small>${last ? `Last run ${pad2(last.getHours())}:${pad2(last.getMinutes())}` : 'Not run yet'} · area: ${esc(a.area)}</small></div></div>
    <div class="ag-kpis">${(r.kpis || []).map(([l, v, s]) => `<div><small>${esc(l)}</small><b class="num">${esc(String(v))}</b><span>${esc(s || '')}</span></div>`).join('')}</div>
    <div class="ag-sub">What it found <span>${r.findings.filter(f => !f.done).length} open</span></div>
    <ul class="ag-find">${r.findings.map(f => `<li class="sev${f.sev}${f.done ? ' done' : ''}"><i></i><span><b>${esc(f.t)}</b><small>${esc(f.why || '')}</small></span>
      ${f.go ? `<button class="ag-btn" data-ag-go="${f.go}">Open</button>` : ''}${a.id !== 'chief' ? `<button class="ag-btn ${f.done ? 'on' : ''}" data-ag-done="${a.id}:${f.id}" aria-pressed="${!!f.done}">${f.done ? 'Done ✓' : 'Done'}</button>` : ''}</li>`).join('') || '<li class="none">Nothing to do here today.</li>'}</ul>
    <div class="ag-acts"><button class="ag-btn big" data-ag-run>${ic('rotate', 14)} Run all agents now</button>${a.id !== 'chief' ? `<button class="ag-btn big ${on ? '' : 'on'}" data-ag-toggle="${a.id}">${on ? 'Pause this agent' : 'Switch it on'}</button>` : ''}</div>`, 'ag-detail');
}

function agTeamHTML(){
  const chief = agResult('chief'), rank = agRanking(), all = AGENTS.filter(a => agOn(a.id)), now = new Date();
  const needs = AGENTS.filter(a => a.id !== 'chief' && agOn(a.id) && agStatus(agResult(a.id))[0] === 'needs').length;
  const open = AGENTS.filter(a => a.id !== 'chief' && agOn(a.id)).reduce((s, a) => s + agResult(a.id).findings.filter(f => !f.done).length, 0);
  const doneToday = AGENTS.reduce((s, a) => s + ((agRec(a.id).done[dkey()] || []).length), 0);
  const teamHist = (() => { const days = []; for (let i = 13; i >= 0; i--){ const d = dkey(addDays(now, -i)), xs = AGENTS.filter(a => a.id !== 'chief').map(a => (agRec(a.id).hist.find(h => h.d === d) || {}).s).filter(v => v != null); if (xs.length) days.push(Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)); } return days; })();
  const watched = AGENTS.filter(a => a.id !== 'chief' && agOn(a.id)).length, found = open + doneToday;
  const pipe = [['Watch', watched, 'agents reading your data'], ['Find', found, 'things found today'], ['Act', open, 'waiting for you'], ['Done', doneToday, 'done today'], ['Review', AGENTS.reduce((s, a) => s + agRec(a.id).hist.length, 0), 'daily snapshots kept']];
  const log = (state.agentLog || []).slice(0, 8);
  return `<div class="ag-top ag-top2">
      <div class="ag-stats">
        <div><b class="num">${all.length}<small>/${AGENTS.length}</small></b><span>agents on</span></div>
        <div class="${needs ? 'warn' : ''}"><b class="num">${needs}</b><span>need you</span></div>
        <div><b class="num">${open}</b><span>open tasks</span></div>
        <div><b class="num">${doneToday}</b><span>done today</span></div>
      </div>
    </div>
    <div class="ag-grid">
      <div class="ag-col l">
        ${agPanel('Team health', 'weighted by your goals', `<div class="ag-health"><div class="ag-ringw">${agRing(chief.score, 128, 'var(--ag-cy)', 'team score')}</div>
          <div class="ag-bars">${AGENTS.filter(a => a.id !== 'chief').map(a => { const r = agResult(a.id); return `<button class="ag-bar" data-ag-sel="${a.id}" style="--c:${AG_COLORS[a.id]}"><span>${esc(a.area)}</span><i><em style="width:${agOn(a.id) ? r.score : 0}%"></em></i><b class="num">${agOn(a.id) ? r.score : '–'}</b></button>`; }).join('')}</div></div>
          <div class="ag-sub">Last 14 days</div>${agSpark(teamHist, 'var(--ag-cy)', 260, 56)}`)}
        ${agPanel('Best for you right now', 'goal weight × gap', `<ol class="ag-rank">${rank.slice(0, 5).map((x, i) => `<li data-ag-sel="${x.a.id}" style="--c:${AG_COLORS[x.a.id]}"><span class="n num">${i + 1}</span><span class="t"><b>${esc(x.a.name)}</b><small>${esc(x.why)}</small></span><span class="fit num">${x.fit}%</span></li>`).join('')}</ol>
          <p class="ag-note">The higher the fit, the more this agent can move your goals this week. Your goals weigh English and career highest, then money.</p>`)}
        ${agPanel('Activity', 'latest first', `<ul class="ag-log">${log.map(l => { const d = new Date(l.ts), a = AGENTS.find(x => x.id === l.id); return `<li><span class="num">${pad2(d.getHours())}:${pad2(d.getMinutes())}</span><span>${esc(l.msg)}</span><em style="color:${AG_COLORS[l.id] || 'var(--ag-cy)'}">${esc(a ? a.area : '')}</em></li>`; }).join('') || '<li class="none">The log fills in as agents run.</li>'}</ul>`)}
      </div>
      <div class="ag-col c">
        ${agPanel('Your team', 'tap an agent', agHubHTML(), 'ag-hubp')}
        ${agPanel('Process', 'watch → find → act → done → review', `<div class="ag-pipe">${pipe.map(([l, v, s], i) => `<div class="ag-stage"><b class="num">${v}</b><span>${l}</span><small>${s}</small>${i < pipe.length - 1 ? '<i></i>' : ''}</div>`).join('')}</div>`)}
        ${agPanel('Roster', `${AGENTS.length} agents · ${AGENTS_LATER.length} slots for later`, `<div class="ag-roster">${AGENTS.map(a => { const r = agResult(a.id), [st, stl] = agStatus(r), on = agOn(a.id);
          return `<button class="ag-card${AG.sel === a.id ? ' sel' : ''}${on ? '' : ' off'}" data-ag-sel="${a.id}" style="--c:${AG_COLORS[a.id]}"><span class="ic">${ic(a.icon, 18)}</span><span class="t"><b>${esc(a.name)}</b><small>${esc(a.area)}</small></span><span class="ag-st ${on ? st : 'off'}"><i></i>${on ? stl : 'Paused'}</span>
            <span class="sc"><i><em style="width:${on ? r.score : 0}%"></em></i><b class="num">${on ? r.score : '–'}</b></span></button>`; }).join('')}
          ${AGENTS_LATER.map(([n, i, d, need]) => `<div class="ag-card later"><span class="ic">${ic(i, 18)}</span><span class="t"><b>${esc(n)}</b><small>${esc(d)}</small></span><span class="ag-st off"><i></i>Later</span><span class="need">${esc(need)}</span></div>`).join('')}</div>`)}
      </div>
      <div class="ag-col r">
        ${agDetailHTML()}
        ${agPanel('Score trend', esc((AGENTS.find(a => a.id === AG.sel) || {}).name || ''), `${agSpark(agHist(AG.sel), AG_COLORS[AG.sel] || 'var(--ag-cy)', 300, 80, AG.sel !== 'chief' ? teamHist : null)}<div class="ag-legend"><span><i style="background:${AG_COLORS[AG.sel]}"></i>this agent</span>${AG.sel !== 'chief' ? '<span><i class="dash"></i>team</span>' : ''}</div>`)}

      </div>
    </div>`;
}
function agRedraw(){ const el = document.getElementById('view-agents'); if (!el || activeTab !== 'agents') return; const y = window.scrollY; el.innerHTML = renderAgents(); window.scrollTo(0, y); }

document.addEventListener('click', e => {
  const t = e.target.closest('#agRoot [data-ag-sel], #agRoot [data-ag-go], #agRoot [data-ag-done], #agRoot [data-ag-run], #agRoot [data-ag-toggle]'); if (!t) return; e.stopPropagation();
  if (t.dataset.agGo){ setTab(t.dataset.agGo, { force: true }); window.scrollTo(0, 0); return; }
  if (t.dataset.agDone){ const [id, f] = t.dataset.agDone.split(':'), rec = agRec(id), k = dkey(), d = rec.done[k] = rec.done[k] || [], i = d.indexOf(f);
    if (i >= 0) d.splice(i, 1); else { d.push(f); agLog(id, `You finished: ${(agResult(id).findings.find(x => x.id === f) || {}).t || f}.`); } AG.res = {}; save(); agRedraw(); return; }
  if (t.hasAttribute('data-ag-run')){ agentsRun('manual'); toast('Every agent ran on your latest numbers.', 'ok', 1600); agRedraw(); return; }
  if (t.dataset.agToggle){ const rec = agRec(t.dataset.agToggle); rec.on = !agOn(t.dataset.agToggle); agLog(t.dataset.agToggle, rec.on ? 'Switched on.' : 'Paused.'); AG.res = {}; save(); agRedraw(); return; }
  if (t.dataset.agSel){ AG.sel = t.dataset.agSel; agRedraw(); if (innerWidth < 1180) setTimeout(() => document.querySelector('#agRoot .ag-detail')?.scrollIntoView({ behavior: motionOff() ? 'auto' : 'smooth', block: 'start' }), 30); }
}, true);
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('#agRoot g[data-ag-sel]')){ e.preventDefault(); e.target.closest('g[data-ag-sel]').dispatchEvent(new MouseEvent('click', { bubbles: true })); } });

/* register the tab (the tab list, view panel and renderer) */
if (typeof TABS !== 'undefined' && !TABS.find(t => t.id === 'agents')) TABS.push({ id:'agents', name:'Agents', icon:'robot', title:'Agents', sub:'Your team of agents: each one watches part of your life and reports back.' });
renderView = (orig => function(tab){
  if (tab !== 'agents') return orig.apply(this, arguments);
  const el = document.getElementById('view-agents'); if (el){ el.innerHTML = renderAgents(); try { if (typeof glassWatch === 'function') glassWatch(el); } catch(_){} }
})(renderView);
setInterval(() => { const c = document.getElementById('agClock'); if (!c || document.hidden) return; const d = new Date(); c.textContent = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }, 15000);
