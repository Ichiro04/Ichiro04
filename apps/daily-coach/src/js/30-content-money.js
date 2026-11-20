/* ============================================================
   MONEY
   ============================================================ */
const CATS = [
  { id:'food',      name:'Food',        color:'var(--teal)' },
  { id:'transport', name:'Transport',   color:'var(--mid)' },
  { id:'home',      name:'Home',        color:'var(--deep)' },
  { id:'fun',       name:'Fun',         color:'var(--orange)' },
  { id:'gear',      name:'Gear + books',color:'var(--lteal)' },
  { id:'life',      name:'Other',       color:'var(--sky)' }
];
const catOf = id => CATS.find(c=>c.id===id) || CATS[5];
const fixedTotal = () => state.settings.fixed.reduce((a,f)=>a+Number(f.amount||0),0);
const savedTotal = () => state.savings.reduce((a,s)=>a+Number(s.amount||0),0) + Number(state.settings.opening||0);
const spentMonth = (m = new Date()) => {
  const p = `${m.getFullYear()}-${pad2(m.getMonth()+1)}`;
  return state.expenses.filter(e=>(e.date||'').startsWith(p)).reduce((a,e)=>a+Number(e.amount||0),0);
};
const monthKey = (d=new Date()) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
function monthLabel(k){ const [y,m]=k.split('-').map(Number); return `${MONTHS[m-1].slice(0,3)} ${String(y).slice(2)}`; }
function monthProgress(d=new Date()){ const dim = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); return { day:d.getDate(), dim, frac:d.getDate()/dim }; }
const planMonths = 12;
const needPerMonth = () => Math.max(0, (Number(state.settings.goal) - Number(state.settings.opening||0)) / planMonths);
const freeAfterFixed = () => Number(state.settings.income||0) - fixedTotal();
// the budget in docs/money-plan.md already carries a £50 buffer, so no extra haircut: £2,500 − £1,197 = £1,303/month
const feasiblePerMonth = () => Math.max(0, freeAfterFixed());
// the spending money: every budget line except rent + bills (that leaves the account on its own), £597 with the default plan
const flexMonth = () => Math.max(0, fixedTotal() - state.settings.fixed.filter(f => f.id === 'rent').reduce((a, f) => a + Number(f.amount||0), 0));
// spending pace: in the first week one shop can't fairly be projected over the month, so judge it against a week's share instead
function spendPace(now = new Date()){
  const spend = spentMonth(now), { day, dim } = monthProgress(now), flex = flexMonth(), early = day < 7;
  const proj = day ? spend / day * dim : 0;
  const onPace = early ? spend <= flex * 7 / dim : proj <= flex;
  return { spend, day, dim, flex, early, proj, onPace, left: Math.max(0, flex - spend) };
}
const milestoneList = (() => {
  const goal = 25000; return [5000,10000,15000,20000,25000].map(v=>({ v, pct:v/goal }));
})();

/* ---------- weight ---------- */
function weightSeries(){
  return Object.keys(state.days).sort()
    .filter(k=>Number(state.days[k].weight) > 0)
    .map(k=>({ date:k, kg:Number(state.days[k].weight) }));
}
function lastWeight(){
  const s = weightSeries();
  return s.length ? s[s.length-1].kg : Number(state.profile.weightStart);
}
function weightChangeWeek(){
  const s = weightSeries(); if (s.length < 2) return null;
  const last = s[s.length-1], weekAgo = addDays(parseKey(last.date), -7);
  const prev = s.filter(p=>parseKey(p.date) <= weekAgo).pop() || s[0];
  return last.kg - prev.kg;
}

/* ---------- workouts ---------- */
function wrec(k=dkey(), create=false){
  if (!state.workouts[k] && create) state.workouts[k] = { sessionId: todaysSession(parseKey(k)).id, sets:{} };
  return state.workouts[k] || { sessionId: todaysSession(parseKey(k)).id, sets:{} };
}
function sessionFor(k=dkey()){
  const r = state.workouts[k];
  return SESSIONS[r && r.sessionId] || todaysSession(parseKey(k));
}
function toggleSet(k, exId, i, setsCount){
  const r = wrec(k, true);
  const arr = r.sets[exId] && r.sets[exId].length === setsCount ? r.sets[exId].slice() : new Array(setsCount).fill(false);
  arr[i] = !arr[i];
  r.sets[exId] = arr;
  save();
  return arr[i];
}
function sessionDonePct(k=dkey()){
  const s = sessionFor(k); const r = wrec(k);
  let total = 0, done = 0;
  s.blocks.forEach(b=>{ total += b.sets; const arr = r.sets[b.ex] || []; for (let i=0;i<b.sets;i++) if (arr[i]) done++; });
  return total ? Math.round(done/total*100) : 0;
}
// a strength session counts when its sets are logged or the day plan / task list marks it done (the day plan used to count as 0)
function workoutsThisWeek(ws = startOfWeek()){
  let n = 0;
  for (let i=0;i<7;i++){ const k = dkey(addDays(ws,i)); if (sessionDonePct(k) >= 80 || taskDone(k, 'train')) n++; }
  return n;
}
// strength sessions the plan asks for in that week (3 with the default plan)
function sessionsPlanned(ws = startOfWeek()){ let n = 0; for (let i=0;i<7;i++) if (tasksForDay(dkey(addDays(ws,i))).some(t => t.id === 'train')) n++; return n || 3; }

/* ---------- IELTS progress ---------- */
const essaysThisWeek = (ws = startOfWeek()) => { const we = addDays(ws, 7); return state.ielts.essays.filter(e=>{ const d = parseKey(e.date); return d >= ws && d < we; }).length; };
// speaking days: the speaking log or the speaking task ticked that day
const speakingThisWeek = (ws = startOfWeek()) => { let n = 0; for (let i=0;i<7;i++){ const k = dkey(addDays(ws,i)); if (state.ielts.speaking[k] || taskDone(k, 'speaking')) n++; } return n; };

/* ---------- derived summaries ---------- */
function todayDone(){ return countDone(dkey()); }
function todayTotal(){ return tasksForDay(dkey()).length; }
function upNext(){
  const k = dkey();
  const list = tasksForDay(k).filter(t=>!taskDone(k,t.id));
  return list[0] || null;
}
function avgScoreLast(n=7){
  let sum = 0, count = 0;
  for (let i=0;i<n;i++){ const k = dkey(addDays(new Date(), -i)); sum += dayScore(k); count++; }
  return count ? sum/count : 0;
}

