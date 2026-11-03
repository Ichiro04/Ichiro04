/* ============================================================
   EXTRAS (3 Nov 2026, chosen by the user from researched ideas)
   1. Savings year start date (Settings → Goals).
   2. Streak saver: one missed day a week is forgiven if the next
      day is a streak day ("never miss twice").
   3. IELTS plan to exam: phases and this week day by day.
   4. Essay writer: timed box, live word count, paragraph and
      linker counts, self-score on the 4 official criteria,
      band trend and weakest criterion.
   5. Weekly backup: to a folder you choose (e.g. your Google
      Drive folder) where the browser allows it, otherwise a
      weekly reminder with a one-tap download.
   ============================================================ */

/* ---------- 1. savings year start ---------- */
planDay = function(){ const a = parseKey(state.settings.planStart || state.createdAt || dkey()), b = parseKey(dkey()); return Math.max(1, Math.round((b - a) / 864e5) + 1); };

/* ---------- 2. streak saver ---------- */
const weekId = k => dkey(startOfWeek(parseKey(k)));
const saverOn = () => state.streakSaver !== false;
function streakWalk(from = new Date()){ // walking back from today: { n streak days, saved: [forgiven miss days] }
  const today = dkey(from), saved = [], used = new Set(); let d = new Date(from), n = 0, afterOk = true;
  if (!isStreakDay(today)) d = addDays(d, -1);            // today is still open
  for (let i = 0; i < 400; i++){
    const k = dkey(d); if (state.createdAt && k < state.createdAt) break;
    if (isStreakDay(k)){ n++; afterOk = true; d = addDays(d, -1); continue; }
    // a miss: forgiven once per week, never two in a row, and only if the chain carries on before it
    if (saverOn() && afterOk && !used.has(weekId(k)) && isStreakDay(dkey(addDays(d, -1)))){ used.add(weekId(k)); saved.push(k); afterOk = false; d = addDays(d, -1); continue; }
    break;
  }
  return { n, saved };
}
currentStreak = function(from = new Date()){ return streakWalk(from).n; };
bestStreak = function(){
  const keys = Object.keys(state.days).sort(); if (!keys.length) return 0;
  let best = 0, run = 0; const used = new Set(); let d = parseKey(keys[0]); const end = new Date();
  while (d <= end){
    const k = dkey(d);
    if (isStreakDay(k)) { run++; best = Math.max(best, run); }
    else if (saverOn() && !used.has(weekId(k)) && isStreakDay(dkey(addDays(d, 1))) && run > 0) used.add(weekId(k));
    else if (k !== dkey()) { run = 0; used.clear(); }
    d = addDays(d, 1);
  }
  return best;
};
function streakSaverNote(){
  const w = streakWalk(); if (!w.saved.length) return null;
  const k = w.saved[0], yest = dkey(addDays(new Date(), -1));
  return k === yest && !isStreakDay(dkey())
    ? { id:'saver', icon:'flame', t:`Streak saver used for yesterday. Do ${STREAK_TARGET} tasks today or the streak resets: never miss twice.`, go:'today', b:'Show tasks' }
    : { id:'saver', icon:'flame', t:`Streak saver covered ${DAYS_LONG[isoWeekday(parseKey(k))]}. You get one per week.`, b:'' };
}
apTips = (orig => function(){ const t = orig.apply(this, arguments), s = streakSaverNote(); if (s) t.unshift(s); return t; })(apTips);

/* ---------- 3. IELTS plan to the exam ---------- */
function ieltsPhase(dl){ return dl <= 7 ? ['Taper','One light mock early in the week, then review only. Sleep 8 hours.'] : dl <= 28 ? ['Mock tests','A full timed mock every Saturday; essays every other day.'] : dl <= 56 ? ['Build','Timed sections and band-7 language; 3 essays and 4 speaking cards a week.'] : ['Foundation','Grammar, linkers and vocabulary; 3 essays and 3 speaking cards a week.']; }
function ieltsWeek(dl){ // Mon..Sun plan for this week
  const mock = dl <= 28, taper = dl <= 7;
  return [
    ['Essay Task 2 (40 min)', 'Reading: 1 passage, 20 min'],
    ['Speaking card', 'Listening: 1 section'],
    [taper ? 'Read model answers' : 'Essay Task 2 (40 min)', 'Vocabulary: 10 words'],
    ['Speaking card', 'Task 1 report (20 min)'],
    [taper ? 'Speaking card' : 'Essay Task 2 (40 min)', 'Reading: 1 passage, 20 min'],
    [mock ? (taper ? 'Rest and light review' : 'Full mock test (2 h 45 min)') : 'Speaking card', mock ? 'Mark it, list 3 errors' : 'Listening: 1 section'],
    ['Weekly review', 'Rewrite your weakest paragraph']
  ];
}
function ieltsPlanHTML(){
  const ex = state.settings.examDate, target = +state.settings.ieltsTarget || 7;
  if (!ex) return `<section class="glass xs-card ip"><div class="xs-h"><b>IELTS plan to the exam</b><small>Set your exam date to get a day-by-day plan</small></div><button class="lay-btn" data-ex="set">${ic('calendar', 14)} Set exam date</button></section>`;
  const dl = daysBetween(dkey(), ex); if (dl < 0) return '';
  const [ph, phNote] = ieltsPhase(dl), ws = startOfWeek(), wk = ieltsWeek(dl), today = isoWeekday(new Date());
  const bands = ((state.ielts || {}).essays || []).filter(e => e.band).slice(-5).map(e => +e.band), now = bands.length ? bands.reduce((a, b) => a + b, 0) / bands.length : null;
  const gap = now === null ? null : target - now;
  return `<section class="glass xs-card ip"><div class="xs-h"><b>IELTS plan to the exam</b><small>${dl} days · phase: ${ph} · target ${num(target)}${now !== null ? ` · essays now ${num(now)}` : ''}</small></div>
    <p class="fl-q" style="margin-top:0">${esc(phNote)}${gap !== null && gap > 0.25 ? ` You need about ${num(gap)} more band: focus on your weakest criterion below.` : ''}</p>
    <ul class="ip-wk">${wk.map(([a, b], i) => { const k = dkey(addDays(ws, i)), done = taskDone(k, 'essay') || taskDone(k, 'speaking'); return `<li class="${i === today ? 'today' : ''}${k < dkey() ? ' past' : ''}${done ? ' done' : ''}"><span>${DAYS[i]}</span><div><b>${esc(a)}</b><small>${esc(b)}</small></div>${done ? ic('check', 14) : ''}</li>`; }).join('')}</ul></section>`;
}

/* ---------- 4. essay writer and scoring ---------- */
const CRIT = [['tr','Task response','Answer every part of the question with a clear position all the way through.'],['cc','Coherence and cohesion','One idea per paragraph; linkers with precision; refer back with "this", "these".'],['lr','Lexical resource','Topic words and collocations; no repeated words; spell every word right.'],['gra','Grammar range and accuracy','Mix simple and complex sentences; check articles, plurals and verb endings.']];
const LINKERS = ['however','moreover','furthermore','therefore','consequently','whereas','although','in contrast','as a result','for example','for instance','on the other hand','in addition','nevertheless','thus','overall','to conclude','in conclusion','firstly','secondly','finally'];
const EW = { t0:0, acc:0, timer:0 };
const ieltsBand = x => { const f = Math.floor(x), r = x - f; return r < 0.25 ? f : r < 0.75 ? f + 0.5 : f + 1; };
function essayStats(text){
  const words = (text.match(/[A-Za-z’'-]+/g) || []).length, paras = text.split(/\n\s*\n|\n/).filter(p => p.trim().length > 20).length;
  const sents = text.split(/[.!?]+\s/).filter(s => s.trim().length > 3), avg = sents.length ? Math.round(words / sents.length) : 0, low = text.toLowerCase();
  const linkers = LINKERS.filter(l => low.includes(l)).length;
  return { words, paras, avg, linkers, sents: sents.length };
}
function essayWriterHTML(){
  const d = (state.ielts.draft = state.ielts.draft || { text:'', crit:{}, secs:0 }), st = essayStats(d.text), mins = Math.floor((EW.acc + (EW.t0 ? (Date.now() - EW.t0) / 1000 : 0) + (d.secs || 0)) / 60);
  const scores = CRIT.map(c => d.crit[c[0]]).filter(Boolean), overall = scores.length === 4 ? ieltsBand(scores.reduce((a, b) => a + b, 0) / 4) : null;
  return `<div class="glass card ew" id="ew">
    <div class="ew-h"><div><b>Write it here</b><small>Your draft saves as you type</small></div><button class="lay-btn${EW.t0 ? ' on' : ''}" data-ew="timer">${ic(EW.t0 ? 'pause' : 'play', 14)} <span id="ewClock" class="num">${EW.t0 ? 'Pause' : 'Start 40:00'}</span></button></div>
    <textarea id="ewText" rows="9" placeholder="Paragraph 1: paraphrase the question and give your position…">${esc(d.text)}</textarea>
    <div class="ew-stats" id="ewStats">${ewStatsHTML(st)}</div>
    <div class="ew-crit"><b>Score it on the 4 official criteria</b><small>Be strict: the examiner will be.</small>
      ${CRIT.map(([id, name, tip]) => `<div class="ew-c"><span title="${esc(tip)}">${name}</span><div class="ew-b">${[5,5.5,6,6.5,7,7.5,8].map(v => `<button class="${d.crit[id] === v ? 'on' : ''}" data-ew="crit" data-id="${id}" data-v="${v}">${v}</button>`).join('')}</div></div>`).join('')}</div>
    <div class="ew-foot"><span class="ew-band">${overall !== null ? `Band <b class="num">${num(overall)}</b>` : 'Pick a score for each criterion'}</span><button class="btn btn-primary btn-sm" data-ew="save" ${st.words < 50 ? 'disabled' : ''}>${ic('check', 15)} Save essay</button><button class="btn btn-soft btn-sm" data-ew="clear">${ic('x', 14)} Clear</button></div>
  </div>`;
}
function ewStatsHTML(st){
  const w = st.words, wc = w >= 250 ? (w > 320 ? 'warn' : 'ok') : 'low';
  return `<span class="${wc}"><b class="num">${w}</b> words${w < 250 ? ` · ${250 - w} to go` : ''}</span><span><b class="num">${st.paras}</b> paragraphs</span><span><b class="num">${st.linkers}</b> linkers</span><span><b class="num">${st.avg}</b> words a sentence</span>`;
}
function essayTrendHTML(){
  const es = ((state.ielts || {}).essays || []).filter(e => e.band).slice(-10);
  if (es.length < 2) return '';
  const crit = {}; CRIT.forEach(([id]) => { const v = es.map(e => e.crit && e.crit[id]).filter(Boolean); if (v.length) crit[id] = v.reduce((a, b) => a + b, 0) / v.length; });
  const weak = Object.keys(crit).sort((a, b) => crit[a] - crit[b])[0], wc = CRIT.find(c => c[0] === weak);
  return `<div class="ew-trend"><div class="xs-h"><b>Band trend</b><small>last ${es.length} essays · target ${num(+state.settings.ieltsTarget || 7)}</small></div>${waveSVG(es.map(e => (e.band - 4) / 5), es.map(e => shortDate(parseKey(e.date)).split(' ')[0]), 'ewt')}
    ${Object.keys(crit).length ? `<div class="ew-cbars">${CRIT.map(([id, name]) => crit[id] ? `<div><span>${name}</span><i><b style="--w:${((crit[id] - 4) / 5).toFixed(3)}" class="${id === weak ? 'weak' : ''}"></b></i><em class="num">${num(crit[id])}</em></div>` : '').join('')}</div>${wc ? `<p class="fl-q"><b>Weakest: ${wc[1]}.</b> ${esc(wc[2])}</p>` : ''}` : ''}</div>`;
}
learnEssayHTML = (orig => function(){
  const h = orig.apply(this, arguments), i = h.indexOf('<div class="h2">Log the essay');
  return i < 0 ? h : h.slice(0, i) + `<div class="h2">Write and score</div>${essayWriterHTML()}${essayTrendHTML() ? `<div class="glass card">${essayTrendHTML()}</div>` : ''}` + h.slice(i).replace('Log the essay', 'Or log a paper essay');
})(learnEssayHTML);
function ewSaveDraft(){ clearTimeout(EW.sv); EW.sv = setTimeout(save, 500); }
function ewTick(){ const c = document.getElementById('ewClock'); if (!c || !EW.t0) return; const used = EW.acc + (Date.now() - EW.t0) / 1000 + (state.ielts.draft.secs || 0), left = Math.max(0, 2400 - used);
  c.textContent = `${Math.floor(left / 60)}:${pad2(Math.floor(left % 60))}`; if (left <= 0){ EW.acc = used; EW.t0 = 0; toast('40 minutes are up. Finish the sentence and check articles and plurals.', 'warn', 3600); } }
document.addEventListener('input', e => { if (e.target.id !== 'ewText') return; state.ielts.draft.text = e.target.value.slice(0, 6000); const s = document.getElementById('ewStats'); if (s) s.innerHTML = ewStatsHTML(essayStats(e.target.value)); const sv = document.querySelector('[data-ew="save"]'); if (sv) sv.disabled = essayStats(e.target.value).words < 50; ewSaveDraft(); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ew]'); if (!b) return; e.stopPropagation(); const a = b.dataset.ew, d = state.ielts.draft;
  if (a === 'timer'){ if (EW.t0){ d.secs = (d.secs || 0) + EW.acc + (Date.now() - EW.t0) / 1000; EW.acc = 0; EW.t0 = 0; clearInterval(EW.timer); } else { EW.t0 = Date.now(); clearInterval(EW.timer); EW.timer = setInterval(ewTick, 1000); } save(); }
  else if (a === 'crit'){ d.crit[b.dataset.id] = +b.dataset.v; save(); }
  else if (a === 'clear'){ if (d.text && b.dataset.arm !== '1'){ b.dataset.arm = '1'; b.innerHTML = ic('x', 14) + ' Tap again to clear'; setTimeout(() => { if (b.isConnected){ b.dataset.arm = ''; b.innerHTML = ic('x', 14) + ' Clear'; } }, 3000); return; }
    state.ielts.draft = { text:'', crit:{}, secs:0 }; EW.t0 = 0; EW.acc = 0; clearInterval(EW.timer); save(); }
  else if (a === 'save'){
    const st = essayStats(d.text), sc = CRIT.map(c => d.crit[c[0]]).filter(Boolean), band = sc.length === 4 ? ieltsBand(sc.reduce((x, y) => x + y, 0) / 4) : null, secs = (d.secs || 0) + EW.acc + (EW.t0 ? (Date.now() - EW.t0) / 1000 : 0);
    state.ielts.essays.push({ id:uid(), date:dkey(), prompt:(essayPrompt || essayPromptToday()).t, words:st.words, mins:Math.round(secs / 60) || null, band, crit: sc.length ? { ...d.crit } : null, text: d.text.slice(0, 6000) });
    setTask(dkey(), 'essay', true); state.ielts.draft = { text:'', crit:{}, secs:0 }; EW.t0 = 0; EW.acc = 0; clearInterval(EW.timer); save(); updateChrome();
    toast(st.words < 250 ? `Saved: ${st.words} words. Under 250 loses marks, so aim for 270+.` : band ? `Saved: band ${num(band)}. Read your weakest paragraph out loud.` : 'Essay saved.', 'ok', 3000);
  }
  renderView('learn'); setTimeout(() => document.getElementById('ew')?.scrollIntoView({ block:'nearest' }), 60);
}, true);

/* ---------- 5. weekly backup ---------- */
const BK = { handle:null };
const bkDB = () => new Promise((res, rej) => { try { const r = indexedDB.open('dailycoach-backup', 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch(e){ rej(e); } });
async function bkGet(){ try { const db = await bkDB(); return await new Promise(r => { const q = db.transaction('h').objectStore('h').get('dir'); q.onsuccess = () => r(q.result || null); q.onerror = () => r(null); }); } catch(_){ return null; } }
async function bkPut(h){ try { const db = await bkDB(); db.transaction('h', 'readwrite').objectStore('h').put(h, 'dir'); } catch(_){} }
const bkCanFolder = () => typeof window.showDirectoryPicker === 'function' && (() => { try { return window.self === window.top; } catch(_){ return false; } })();
const bkDue = () => { const l = (state.backup || {}).last; return !l || daysBetween(l, dkey()) >= 7; };
async function bkWrite(handle, quiet){
  const name = `daily-coach-backup-${dkey()}.json`, f = await handle.getFileHandle(name, { create:true }), w = await f.createWritable();
  await w.write(JSON.stringify(state, null, 2)); await w.close();
  state.backup = { ...(state.backup || {}), last: dkey(), folder: handle.name }; save();
  if (!quiet) toast(`Backup saved to ${handle.name}/${name}`, 'ok', 2600);
}
async function bkChoose(){ try { const h = await window.showDirectoryPicker({ id:'dailycoach', mode:'readwrite' }); await bkPut(h); BK.handle = h; await bkWrite(h); renderSetData(); } catch(e){ if (e && e.name !== 'AbortError') toast('Could not use that folder. Try another one.', 'warn', 2400); } }
async function bkNow(){ const h = BK.handle || await bkGet(); if (!h){ return bkChoose(); } try { const p = await h.requestPermission({ mode:'readwrite' }); if (p !== 'granted') return; BK.handle = h; await bkWrite(h); renderSetData(); } catch(_){ bkChoose(); } }
async function bkAuto(){ // on open: write silently if the folder is still allowed and a week has passed
  if (!bkDue() || !bkCanFolder() || state.backupAuto === false) return;
  const h = await bkGet(); if (!h) return; BK.handle = h;
  try { if (await h.queryPermission({ mode:'readwrite' }) === 'granted') await bkWrite(h, true); } catch(_){}
}
function bkDownload(){ const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `daily-coach-backup-${dkey()}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); state.backup = { ...(state.backup || {}), last: dkey() }; save(); toast('Backup downloaded. Keep it in your Google Drive or email it to yourself.', 'ok', 3200); renderSetData(); }
function backupHTML(){
  const b = state.backup || {}, last = b.last ? `${shortDate(parseKey(b.last))} (${daysBetween(b.last, dkey())} days ago)` : 'never';
  return `<div class="set-sub">Weekly backup</div>
    <div class="set-meter"><div><b>${esc(last)}</b><small>last backup</small></div><div><b>${esc(b.folder || (bkCanFolder() ? 'not chosen' : 'download'))}</b><small>${bkCanFolder() ? 'backup folder' : 'how it saves here'}</small></div></div>
    <p class="set-note">${bkCanFolder() ? 'Choose a folder once, for example your Google Drive folder on this computer. The app then saves a dated backup there each week when you open it.' : 'This page cannot save to a folder (the claude.ai viewer and some browsers block it), so the app reminds you each week and the button downloads a backup file. Put it in your Google Drive.'}</p>
    <div class="set-acts">${bkCanFolder() ? `<button class="set-btn" data-bk="choose">${ic('upload', 16)} ${b.folder ? 'Change folder' : 'Choose a folder'}</button><button class="set-btn" data-bk="now">${ic('check', 16)} Back up now</button>` : ''}<button class="set-btn" data-bk="download">${ic('download', 16)} Download a backup</button></div>
    ${setToggle('Weekly reminder and auto backup', 'backupAuto', state.backupAuto !== false, 'On Sundays and whenever a week has passed')}`;
}
function renderSetData(){ const b = document.getElementById('setBody'); if (b && SET.sec === 'data') b.innerHTML = setBody('data'); }
setBody = (orig => function(sec){ const h = orig.apply(this, arguments); return sec === 'data' ? h + backupHTML() : sec === 'goals' ? h.replace(/(<\/p>)/, `$1${setField('Savings year started', 'settings.planStart', state.settings.planStart || state.createdAt || dkey(), 'date')}${setToggle('Streak saver', 'streakSaver', saverOn(), 'One missed day a week does not break the streak, if you do the next day')}`) : h; })(setBody);
document.addEventListener('click', e => { const b = e.target.closest('[data-bk]'); if (!b) return; e.stopPropagation(); const a = b.dataset.bk; if (a === 'choose') bkChoose(); else if (a === 'now') bkNow(); else bkDownload(); }, true);
apTips = (orig => function(){ const t = orig.apply(this, arguments); if (state.backupAuto !== false && bkDue() && (!bkCanFolder() || !(state.backup || {}).folder)) t.push({ id:'backup', icon:'download', t:`Your data lives only in this browser. ${(state.backup || {}).last ? 'Last backup was ' + daysBetween(state.backup.last, dkey()) + ' days ago.' : 'You have never backed it up.'} Save a copy to Google Drive.`, go:'', b:'' }); return t; })(apTips);
setTimeout(() => { try { bkAuto(); } catch(_){} }, 2500);

/* the IELTS plan joins the Learn insight column and the filler pools */
learnSideHTML = (orig => function(){ return ieltsPlanHTML() + orig.apply(this, arguments); })(learnSideHTML);
SIDE_TABS.learn = learnSideHTML;
