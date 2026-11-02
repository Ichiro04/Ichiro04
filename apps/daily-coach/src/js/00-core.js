/* ============================================================
   DAILY COACH · core — utils, storage, state, content model
   ============================================================ */
'use strict';

/* ---------- tiny utils ---------- */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const uid = () => Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);
const esc = (s='') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => '£' + (Math.round(n*100)/100).toLocaleString('en-GB',{minimumFractionDigits: (Math.abs(n%1)>0.004?2:0), maximumFractionDigits:2});
const money0 = n => '£' + Math.round(n).toLocaleString('en-GB');
const num = n => (Math.round(n*10)/10).toLocaleString('en-GB');

const REDUCE_QUERY = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- dates (local, week starts Monday) ---------- */
const pad2 = n => String(n).padStart(2,'0');
const dkey = (d=new Date()) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const parseKey = k => { const [y,m,d] = k.split('-').map(Number); return new Date(y, m-1, d); };
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const startOfWeek = (d=new Date()) => { const x = new Date(d); const i = (x.getDay()+6)%7; x.setDate(x.getDate()-i); x.setHours(0,0,0,0); return x; };
const isoWeekday = (d=new Date()) => (d.getDay()+6)%7; // 0 = Monday
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAYS_LONG = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const prettyDate = (d=new Date()) => `${DAYS_LONG[isoWeekday(d)]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
const shortDate = (d=new Date()) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}`;
const daysBetween = (a,b) => Math.round((parseKey(b)-parseKey(a))/864e5);

/* ---------- deterministic seeded RNG ---------- */
function hashStr(s){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

/* ---------- storage ---------- */
const KEY = 'dailycoach.v1';
const DEFAULT_STATE = {
  v: 1,
  theme: 'auto',            // auto | light | dark
  reduceMotion: false,
  createdAt: dkey(),
  profile: { name:'Kyaw Soe Han', heightCm:170, weightStart:81, weightTarget:72, city:'Southsea, Portsmouth', degree:'BEng Mechanical Engineering, Portsmouth 2025' },
  settings: {
    income: 2500, goal: 25000, opening: 0,
    fixed: [
      { id:'rent',  name:'Rent + bills',        amount: 650 },
      { id:'food',  name:'Food shop',           amount: 180 },
      { id:'trans', name:'Transport',           amount: 60  },
      { id:'phone', name:'Phone + subscriptions', amount: 25 },
      { id:'fun',   name:'Fun + eating out',    amount: 90  },
      { id:'misc',  name:'Everything else',     amount: 45  }
    ],
    stepsGoal: 8000,
    ieltsTarget: 7.0,
    examDate: ''
  },
  cadws: { ex:'bracket', models:{}, done:{} },   // CAD workspace: current exercise, saved feature trees, finished exercises
  days: {},        // dateKey -> { tasks:{id:true}, steps, note, weight }
  expenses: [],    // {id,date,amount,cat,note}
  savings: [],     // {id,date,amount,note}
  workouts: {},    // dateKey -> { sessionId, sets:{exId:[true...]} }
  ielts: { essays: [], speaking: {}, cueSeen: {}, quick: [] },
  knowledge: {},   // packId -> dateKey completed
  chat: [],        // {role:'user'|'coach', text, ts}
  career: { portfolio:{}, openQ:{}, huht:{} },
  seen: { coach: false }
};

function deepMerge(base, patch){
  if (Array.isArray(base)) return Array.isArray(patch) ? patch : base;
  if (typeof base === 'object' && base && typeof patch === 'object' && patch){
    const out = {...base};
    for (const k of Object.keys(patch)) out[k] = (k in base) ? deepMerge(base[k], patch[k]) : patch[k];
    return out;
  }
  return patch === undefined ? base : patch;
}

/* storage availability (sandboxed previews and private modes can block it) */
let storageOK = true;
try { localStorage.setItem('__dc_probe','1'); localStorage.removeItem('__dc_probe'); }
catch(e){ storageOK = false; }

let state = load();
function load(){
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){ raw = null; }
  const s = deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), raw || {});
  return s;
}
let saveWarned = false;
function save(){
  if (!storageOK) return;                       // memory-only session, handled at boot
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch(e){
    if (!saveWarned){ saveWarned = true; storageOK = false; toast('Storage is full — this session is memory only. Export a backup.','warn',5000); }
  }
}

/* ---------- day helpers ---------- */
function dayRec(k = dkey(), create=false){
  if (!state.days[k] && create) state.days[k] = { tasks:{}, steps:0, note:'' };
  return state.days[k] || { tasks:{}, steps:0, note:'' };
}
function setTask(k, id, val){
  const d = dayRec(k, true);
  if (val) d.tasks[id] = true; else delete d.tasks[id];
  save();
}
function taskDone(k, id){ return !!dayRec(k).tasks[id]; }
function countDone(k){ return Object.keys(dayRec(k).tasks).filter(id=>dayRec(k).tasks[id]).length; }

/* ============================================================
   CONTENT · daily tasks
   days: ISO weekday index 0=Mon .. 6=Sun
   ============================================================ */
const TASK_DEFS = [
  { id:'train',    name:'Strength session',   meta:'Bodyweight · 40 min',            icon:'dumbbell', color:'var(--teal)',   days:[0,1,3,4], go:'train' },
  { id:'mobility', name:'Mobility + easy walk', meta:'25 min, loose hips and shoulders', icon:'yoga',  color:'var(--lteal)', days:[2,5,6], go:'train' },
  { id:'walk',     name:'8,000 steps',        meta:'Outdoors, phone in pocket',      icon:'steps',    color:'var(--sky)',    days:[0,1,2,3,4,5,6], go:'today' },
  { id:'essay',    name:'IELTS Task 2 essay', meta:'40 min · 270+ words',            icon:'pen',      color:'var(--orange)', days:[0,2,4], go:'learn' },
  { id:'speaking', name:'Speaking cue card',  meta:'1 min prep · 2 min talk',        icon:'mic',      color:'var(--mid)',    days:[1,3,5], go:'learn' },
  { id:'vocab',    name:'Vocabulary drill',   meta:'15 min · 10 words in sentences', icon:'book',     color:'var(--lteal)', days:[0,1,2,3,4,5,6], go:'learn' },
  { id:'knowledge',name:'Knowledge pack',     meta:'20 min read, then recall out loud', icon:'gears', color:'var(--deep)',  days:[0,1,2,3,4], go:'learn' },
  { id:'log',      name:'Log every spend',    meta:'Same day, no catching up',        icon:'cart',     color:'var(--teal)',   days:[0,1,2,3,4,5,6], go:'money' },
  { id:'weigh',    name:'Monday weigh-in',    meta:'Morning, after toilet, before food', icon:'scale', color:'var(--orange)', days:[0], go:'progress' },
  { id:'career',   name:'Career 15 minutes',  meta:'Portfolio, drawing or question bank', icon:'bolt',   color:'var(--orange)', days:[6], go:'learn', sub:'career' },
  { id:'review',   name:'Weekly review',      meta:'5 min · pick next week’s focus',  icon:'compass',  color:'var(--mid)',    days:[6], go:'coach' }
];
const STREAK_TARGET = 4;

function tasksFor(d = new Date()){
  const wd = isoWeekday(d);
  return TASK_DEFS.filter(t=>t.days.includes(wd));
}
function tasksForDay(k){
  const list = tasksFor(parseKey(k)).slice();
  // keep checked tasks visible even if the schedule changed
  const extra = Object.keys(dayRec(k).tasks).filter(id=>!list.some(t=>t.id===id));
  extra.forEach(id=>{ const def = TASK_DEFS.find(t=>t.id===id); if(def) list.push(def); });
  return list;
}
function dayScore(k){
  const list = tasksForDay(k);
  if (!list.length) return 0;
  return countDone(k)/list.length;
}
function isStreakDay(k){ return countDone(k) >= STREAK_TARGET; }
function currentStreak(from = new Date()){
  let n = 0, d = new Date(from);
  // today only counts once it has hit the threshold
  if (!isStreakDay(dkey(d))) d = addDays(d,-1);
  for (let i=0;i<400;i++){
    if (isStreakDay(dkey(d))) { n++; d = addDays(d,-1); } else break;
  }
  return n;
}
function bestStreak(){
  const keys = Object.keys(state.days).filter(k=>isStreakDay(k)).sort();
  let bestN = 0, run = 0, prev = null;
  for (const k of keys){
    run = (prev && daysBetween(prev,k)===1) ? run+1 : 1;
    bestN = Math.max(bestN, run); prev = k;
  }
  return bestN;
}

