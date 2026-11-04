/* ============================================================
   SPEAKING EXAMINER + INTERVIEW COACH (4 Nov 2026, from the next-level list)
   - IELTS Speaking mock: Part 1 (4 short questions), Part 2 (cue card,
     1 minute to prepare, 2 minutes to talk), Part 3 (3 discussion
     questions). Interview mode: 5 questions for operator and engineering
     roles. Answers are typed or dictated (the claude.ai viewer blocks the
     page's own mic, so the phone keyboard mic or Win+H is used there).
   - Results on this device, no AI needed: speaking time, words per
     minute, filler words, word variety, linking words, short answers and
     a rough band from those numbers (clearly marked as rough).
   - "Score it with Claude": one Claude answer marks fluency and
     coherence, vocabulary, grammar (and interview structure) with the
     examiner's criteria, plus fixes and better versions. Pronunciation
     cannot be judged from text, and the app says so.
   - Saved to state.ielts.mocks (last 20) and shown as a history.
   ============================================================ */
const SPK_P1 = [
  'Do you work or are you a student?', 'What do you like most about your job?', 'Where do you live at the moment?', 'What do you like about living in Southsea?',
  'How do you usually spend your weekends?', 'Do you prefer mornings or evenings? Why?', 'How often do you use your phone each day?', 'What kind of food do you like to cook?',
  'Do you enjoy walking? Where do you go?', 'Is it easy to learn a new language? Why?', 'What did you study at university?', 'Do you like the weather where you live?',
  'How do you relax after a long shift?', 'Do you prefer to work alone or in a team?', 'What do you usually do in the evenings?', 'Have you ever learned to fix something yourself?'
];
const SPK_P3 = [
  'Why do some people find it hard to learn new skills as adults?', 'Should companies pay for their workers to keep learning?', 'How will automation change factory jobs in the next twenty years?',
  'Is practical experience more valuable than a degree? Why?', 'Do people today rely too much on technology?', 'What makes a good place to work?',
  'Should young people move abroad for work? What are the risks?', 'How can cities be made healthier places to live?', 'Why is it important to save money when you are young?'
];
const SPK_INT = [
  'Tell me about yourself and why you are applying for this role.', 'Describe a time you found a fault on a machine. What did you do?',
  'How do you make sure the quality is right during a shift?', 'Tell me about a time you worked under pressure to hit a target.',
  'What would you do if you saw a colleague ignoring a safety rule?', 'Why do you want to work in manufacturing?',
  'Describe a time you had to learn something technical quickly.', 'How do you handle a stoppage that you cannot fix yourself?',
  'Tell me about a mistake you made at work and what you learned.', 'Where do you see yourself in three years?'
];
const SPK_FILL = ['um', 'uh', 'er', 'erm', 'you know', 'i mean', 'basically', 'actually', 'kind of', 'sort of', 'like i said', 'and so on', 'stuff like that'];
const SPK_LINK = ['however', 'although', 'whereas', 'on the other hand', 'for example', 'for instance', 'because', 'therefore', 'as a result', 'in addition', 'moreover', 'firstly', 'secondly', 'finally', 'to be honest', 'in my opinion', 'i would say', 'that said', 'which means', 'so that', 'instead', 'while'];
const SP = { mode: 'ielts', steps: [], i: 0, t0: 0, prep: 0, timer: 0, rec: null, res: null, busy: false };
const spkPick = (arr, n, seed) => { const a = arr.slice(), out = []; let s = seed; while (out.length < n && a.length){ s = (s * 9301 + 49297) % 233280; out.push(a.splice(Math.floor(s / 233280 * a.length), 1)[0]); } return out; };
function spkMocks(){ state.ielts = state.ielts || {}; return state.ielts.mocks = state.ielts.mocks || []; }

function spkStart(mode){
  const seed = Date.now() % 233280, cue = CUE_CARDS[(seed >> 3) % CUE_CARDS.length];
  SP.mode = mode; SP.i = 0; SP.res = null; SP.busy = false;
  SP.steps = mode === 'ielts'
    ? [...spkPick(SPK_P1, 4, seed).map(q => ({ part: 1, q, target: [20, 60] })),
       { part: 2, q: cue.q, bullets: cue.bullets, prep: 60, talk: 120, target: [150, 260] },
       ...[cue.follow, ...spkPick(SPK_P3, 2, seed + 7)].map(q => ({ part: 3, q, target: [45, 120] }))]
    : spkPick(SPK_INT, 5, seed).map(q => ({ part: 'I', q, target: [90, 220] }));
  SP.steps.forEach(s => { s.a = ''; s.secs = 0; s.notes = ''; });
  document.getElementById('spkBox')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="srs-box spk-box" id="spkBox" role="dialog" aria-modal="true" aria-label="${mode === 'ielts' ? 'IELTS speaking test' : 'Interview practice'}"><div class="srs-in spk-in" id="spkIn"></div></div>`);
  document.body.classList.add('srs-open'); spkStep();
}
function spkClose(){ clearInterval(SP.timer); spkMicStop(); document.getElementById('spkBox')?.remove(); document.body.classList.remove('srs-open'); try { if (activeTab === 'learn') renderView('learn'); } catch(_){} }
const spkLabel = s => s.part === 'I' ? 'Interview' : `Part ${s.part}`;
function spkStep(){
  clearInterval(SP.timer); const box = document.getElementById('spkIn'); if (!box) return;
  const s = SP.steps[SP.i]; if (!s){ spkFinish(); return; }
  const prepping = s.part === 2 && !s.started, pct = Math.round(SP.i / SP.steps.length * 100);
  box.innerHTML = `<header class="srs-top"><span class="srs-src">${SP.mode === 'ielts' ? 'IELTS Speaking' : 'Interview practice'} · ${spkLabel(s)}</span><span>${SP.i + 1} of ${SP.steps.length}</span><button class="srs-x" data-spk-close aria-label="Stop the test">${ic('x', 18)}</button></header>
    <div class="srs-bar"><i style="width:${pct}%"></i></div>
    <div class="spk-q"><p>${esc(s.q)}</p><button class="srs-say" data-spk-say aria-label="Hear the question">${ic('wave', 16)}</button></div>
    ${s.bullets ? `<ul class="spk-bul">${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
    ${prepping ? `<div class="spk-prep"><b id="spkClock">1:00</b><span>to prepare. Write a few notes; you will not be marked on them.</span></div>
        <textarea id="spkNotes" class="spk-notes" rows="3" placeholder="Notes: 3 or 4 words for each point">${esc(s.notes)}</textarea>
        <button class="btn btn-deep" data-spk-talk>Start talking now</button>`
      : `<div class="spk-ans"><textarea id="spkA" rows="${s.part === 2 ? 8 : 5}" placeholder="Say your answer with your keyboard’s mic, or type it as you would say it.">${esc(s.a)}</textarea>
        <div class="spk-row"><span class="spk-clock"><i></i><b id="spkClock">0:00</b>${s.talk ? ` of ${Math.floor(s.talk / 60)}:00` : ''}</span><span class="spk-wc" id="spkWc">0 words</span>${spkMicOK() ? `<button class="btn btn-soft sm" data-spk-mic aria-pressed="false">${ic('mic', 14)} Mic</button>` : ''}
        <button class="btn btn-deep" data-spk-next>${SP.i === SP.steps.length - 1 ? 'Finish' : 'Next question'}</button></div>
        <p class="spk-tip">${s.part === 1 ? 'Aim for 2 to 4 sentences: answer, reason, example.' : s.part === 2 ? 'Cover every point. Keep going until the 2 minutes are up.' : s.part === 3 ? 'Give a view, explain why, compare two sides, give an example.' : 'Use STAR: situation, task, action, result. About 1 to 2 minutes.'}${spkMicOK() ? '' : ' On claude.ai use your phone keyboard’s mic, Win+H on Windows or Fn twice on a Mac.'}</p></div>`}`;
  const start = Date.now(), base = prepping ? 0 : s.secs;
  if (prepping){ let left = s.prep; SP.timer = setInterval(() => { left--; const c = document.getElementById('spkClock'); if (c) c.textContent = `0:${pad2(Math.max(0, left))}`; if (left <= 0){ s.notes = (document.getElementById('spkNotes') || {}).value || s.notes; s.started = true; spkStep(); } }, 1000); }
  else {
    const ta = document.getElementById('spkA'), wc = document.getElementById('spkWc'), upd = () => { const n = spkWords(ta.value).length; wc.textContent = `${n} word${n === 1 ? '' : 's'}`; s.a = ta.value; };
    ta.addEventListener('input', upd); upd(); setTimeout(() => ta.focus(), 50);
    SP.timer = setInterval(() => { s.secs = base + Math.round((Date.now() - start) / 1000); const c = document.getElementById('spkClock'); if (!c) return; c.textContent = `${Math.floor(s.secs / 60)}:${pad2(s.secs % 60)}`; if (s.talk && s.secs >= s.talk) c.parentElement.classList.add('over'); }, 1000);
    if (s.part !== 2 && !s.heard){ s.heard = true; aiSpeak(s.q, true); }
  }
}
const spkWords = t => (String(t).toLowerCase().match(/[a-z']+/g) || []);
function spkStats(steps){
  const all = steps.map(s => s.a || '').join(' '), w = spkWords(all), secs = steps.reduce((a, s) => a + (s.secs || 0), 0), low = ' ' + all.toLowerCase().replace(/[^a-z' ]+/g, ' ') + ' ';
  const fillers = {}; SPK_FILL.forEach(f => { const n = low.split(' ' + f + ' ').length - 1; if (n) fillers[f] = n; });
  const links = SPK_LINK.filter(l => low.includes(' ' + l + ' '));
  const uniq = new Set(w.filter(x => x.length > 3)).size, long = w.filter(x => x.length > 3).length;
  const short = steps.filter(s => spkWords(s.a).length < s.target[0]).map(s => spkLabel(s));
  const wpm = secs > 20 ? Math.round(w.length / (secs / 60)) : null, variety = long ? Math.round(uniq / long * 100) : 0, fN = Object.values(fillers).reduce((a, b) => a + b, 0);
  // rough band from text only: length, variety, linking, fillers
  let band = 5; if (w.length > 350) band += .5; if (w.length > 600) band += .5; if (variety > 55) band += .5; if (variety > 68) band += .5; if (links.length >= 5) band += .5; if (links.length >= 9) band += .5; if (fN > 6) band -= .5; if (short.length > 2) band -= .5;
  return { words: w.length, secs, wpm, variety, links, fillers, fN, short, band: Math.max(4, Math.min(8, band)) };
}
function spkFinish(){
  clearInterval(SP.timer); spkMicStop();
  const st = spkStats(SP.steps), rec = { id: Date.now().toString(36), date: dkey(), kind: SP.mode, local: st, band: SP.mode === 'ielts' ? st.band : null,
    qa: SP.steps.map(s => ({ part: s.part, q: s.q, a: String(s.a || '').slice(0, 2000), secs: s.secs })) };
  const m = spkMocks(); m.push(rec); state.ielts.mocks = m.slice(-20); save(); SP.res = rec; spkResults();
}
function spkResults(){
  const box = document.getElementById('spkIn'), r = SP.res; if (!box || !r) return;
  const st = r.local, c = r.claude, mmss = s => `${Math.floor(s / 60)}:${pad2(s % 60)}`;
  box.innerHTML = `<header class="srs-top"><span class="srs-src">${r.kind === 'ielts' ? 'IELTS Speaking' : 'Interview practice'} · results</span><button class="srs-x" data-spk-close aria-label="Close">${ic('x', 18)}</button></header>
    <div class="spk-score">${c && c.overall != null ? `<div class="spk-band"><b>${esc(String(c.overall))}</b><small>${r.kind === 'ielts' ? 'band, marked by Claude' : 'out of 5, marked by Claude'}</small></div>` : r.kind === 'ielts' ? `<div class="spk-band rough"><b>${st.band.toFixed(1)}</b><small>rough band from the text only</small></div>` : ''}
      <div class="spk-nums"><div><b>${st.words}</b><small>words</small></div><div><b>${mmss(st.secs)}</b><small>speaking time</small></div><div><b>${st.wpm || '–'}</b><small>words a minute</small></div><div><b>${st.variety}%</b><small>word variety</small></div><div><b>${st.links.length}</b><small>linking phrases</small></div><div class="${st.fN > 6 ? 'warn' : ''}"><b>${st.fN}</b><small>filler words</small></div></div></div>
    ${c ? `<div class="spk-crit">${(c.criteria || []).map(k => `<div><span>${esc(k.name || '')}</span><b>${esc(String(k.score ?? ''))}</b><p>${esc(k.note || '')}</p></div>`).join('')}</div>
      ${c.fixes && c.fixes.length ? `<h4>Fix these first</h4><ol class="spk-fix">${c.fixes.map(f => `<li>${esc(f)}</li>`).join('')}</ol>` : ''}
      ${c.better && c.better.length ? `<h4>Better versions</h4><ul class="spk-better">${c.better.map(b => `<li><small>${esc(b.q || '')}</small><p>${esc(b.answer || '')}</p></li>`).join('')}</ul>` : ''}
      <p class="spk-note">Pronunciation cannot be marked from text. Record yourself on your phone and listen for word endings and stress.</p>`
    : `<ul class="spk-local">${st.short.length ? `<li class="warn">Too short: ${esc(Object.entries(st.short.reduce((o, x) => (o[x] = (o[x] || 0) + 1, o), {})).map(([k, n]) => n > 1 ? `${n} answers in ${k}` : `1 answer in ${k}`).join(', '))}. Add a reason and an example.</li>` : '<li>Every answer was long enough.</li>'}
        ${st.fN ? `<li class="${st.fN > 6 ? 'warn' : ''}">Fillers: ${esc(Object.entries(st.fillers).map(([f, n]) => `“${f}” ×${n}`).join(', '))}. Pause instead.</li>` : '<li>No filler words. Good.</li>'}
        <li>${st.links.length ? `Linking phrases used: ${esc(st.links.slice(0, 8).join(', '))}.` : 'No linking phrases yet: try “for example”, “however”, “as a result”.'}</li>
        ${st.wpm ? `<li>${st.wpm < 90 ? 'Slow pace: aim for 110 to 150 words a minute.' : st.wpm > 170 ? 'Fast pace: slow down a little so every word is clear.' : 'Your pace is natural.'}</li>` : ''}</ul>
      <button class="btn btn-deep spk-ai" data-spk-ai ${SP.busy ? 'disabled' : ''}>${SP.busy ? 'Claude is marking…' : 'Score it with Claude'}</button><p class="spk-note">Uses one Claude answer. Claude marks the criteria, lists fixes and writes better versions of your weakest answers.</p>`}
    <details class="spk-tr"><summary>Your answers</summary>${r.qa.map(x => `<div><small>${x.part === 'I' ? 'Interview' : 'Part ' + x.part} · ${mmss(x.secs || 0)}</small><b>${esc(x.q)}</b><p>${esc(x.a || '(no answer)')}</p></div>`).join('')}</details>
    <div class="spk-acts"><button class="btn btn-soft" data-spk-start="${r.kind}">Try another</button><button class="btn btn-deep" data-spk-close>Done</button></div>`;
}
async function spkClaude(){
  const r = SP.res; if (!r || SP.busy) return;
  if (state.aiMode === 'off'){ toast('Claude is switched off in Settings → Coach and voice.', 'warn', 2400); return; }
  if (!aiOnline()){ toast('Claude marking works on the live claude.ai link. The numbers above are still yours.', 'warn', 3200); return; }
  const u = aiUsage(); if (u.calls >= aiCap()) toast(`Over today’s limit of ${aiCap()} Claude answers, but you asked for this one.`, 'warn', 2200);
  SP.busy = true; spkResults();
  const ielts = r.kind === 'ielts', tr = r.qa.map(x => `[${x.part === 'I' ? 'Q' : 'Part ' + x.part}] ${x.q}\nA (${x.secs}s): ${x.a || '(no answer)'}`).join('\n\n');
  const prompt = ielts
    ? `You are a strict but kind IELTS Speaking examiner. The candidate is a Burmese mechanical engineering graduate working in UK manufacturing, aiming for band 7. Answers were spoken and transcribed (or typed), so ignore spelling and punctuation. Mark only from what is written; do not guess pronunciation.\n\n${tr}\n\nReply with JSON only, no other text, in this shape:\n{"overall": band to the nearest 0.5, "criteria": [{"name":"Fluency and coherence","score":n,"note":"one sentence"},{"name":"Lexical resource","score":n,"note":"..."},{"name":"Grammatical range and accuracy","score":n,"note":"..."}], "fixes": ["3 to 5 specific fixes, quoting his words"], "better": [{"q":"the question","answer":"a band 7 version of HIS answer, same ideas, 60 to 120 words"}] (2 items, his weakest answers)}`
    : `You are an interviewer for a machine operator / manufacturing engineering role in the UK. The candidate is a mechanical engineering graduate (BEng, Portsmouth) with plant experience. Answers were spoken and transcribed, so ignore spelling. Mark structure (STAR), relevance, evidence and confidence.\n\n${tr}\n\nReply with JSON only, no other text, in this shape:\n{"overall": score out of 5 to one decimal, "criteria": [{"name":"Structure (STAR)","score":n out of 5,"note":"one sentence"},{"name":"Relevance to the role","score":n,"note":"..."},{"name":"Evidence and results","score":n,"note":"..."},{"name":"Clear English","score":n,"note":"..."}], "fixes": ["3 to 5 specific fixes"], "better": [{"q":"the question","answer":"a stronger version of HIS answer using his facts, 80 to 140 words"}] (2 items)}`;
  try {
    const res = await AI.sample([{ role: 'user', content: prompt }], { cache: false, modelTier: 'default' });
    u.calls++; u.tin += Math.round(prompt.length / 4); u.tout += Math.round((res.text || '').length / 4);
    const j = JSON.parse((res.text.match(/\{[\s\S]*\}/) || ['{}'])[0]);
    r.claude = { overall: j.overall, criteria: (j.criteria || []).slice(0, 5), fixes: (j.fixes || []).slice(0, 6), better: (j.better || []).slice(0, 3) };
    if (r.kind === 'ielts' && typeof j.overall === 'number') r.band = j.overall;
    const m = spkMocks(), k = m.findIndex(x => x.id === r.id); if (k >= 0) m[k] = r; save();
  } catch(e){ toast(e && e.code === 'rate_limited' ? 'Claude is busy or your usage limit is reached. Try again later.' : 'Claude could not mark this one. Try again in a moment.', 'warn', 2800); }
  SP.busy = false; spkResults();
}

/* ---------- mic (only where the page may use it: the offline copy in Chrome or Edge) ---------- */
function spkMicOK(){ const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return false; try { if (document.featurePolicy && !document.featurePolicy.allowsFeature('microphone')) return false; } catch(_){} return true; }
function spkMicStop(){ try { SP.rec && SP.rec.stop(); } catch(_){} SP.rec = null; }
function spkMic(btn){
  if (SP.rec){ spkMicStop(); btn.setAttribute('aria-pressed', 'false'); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = new SR(), ta = document.getElementById('spkA'); if (!ta) return;
  rec.lang = 'en-GB'; rec.continuous = true; rec.interimResults = false;
  rec.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal){ ta.value = (ta.value ? ta.value.trimEnd() + ' ' : '') + e.results[i][0].transcript.trim(); ta.dispatchEvent(new Event('input')); } };
  rec.onerror = () => { toast('The mic is not available here. Use your keyboard’s mic instead.', 'warn', 2600); spkMicStop(); btn.setAttribute('aria-pressed', 'false'); };
  rec.onend = () => { if (SP.rec === rec){ try { rec.start(); } catch(_){} } };
  try { rec.start(); SP.rec = rec; btn.setAttribute('aria-pressed', 'true'); } catch(_){ toast('The mic is not available here.', 'warn', 2200); }
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-spk-start],[data-spk-close],[data-spk-next],[data-spk-talk],[data-spk-say],[data-spk-ai],[data-spk-mic]'); if (!t) return; e.stopPropagation();
  if (t.dataset.spkStart) return spkStart(t.dataset.spkStart);
  if (t.hasAttribute('data-spk-close')){ if (SP.res || !SP.steps.some(s => s.a) || t.dataset.armed === '1') return spkClose(); t.dataset.armed = '1'; toast('Tap ✕ again to stop. Answers so far are not saved.', 'warn', 2200); return; }
  const s = SP.steps[SP.i];
  if (t.hasAttribute('data-spk-say')) return aiSpeak(s ? s.q : '', true);
  if (t.hasAttribute('data-spk-talk')){ s.notes = (document.getElementById('spkNotes') || {}).value || ''; s.started = true; return spkStep(); }
  if (t.hasAttribute('data-spk-next')){ spkMicStop(); s.a = (document.getElementById('spkA') || {}).value || s.a; SP.i++; return spkStep(); }
  if (t.hasAttribute('data-spk-ai')) return spkClaude();
  if (t.hasAttribute('data-spk-mic')) return spkMic(t);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('spkBox')){ const b = document.querySelector('#spkBox [data-spk-close]'); b && b.click(); } });

/* ---------- entry points and history ---------- */
function spkHistHTML(kind){
  const m = spkMocks().filter(x => x.kind === kind).slice(-6).reverse();
  if (!m.length) return '';
  return `<ul class="spk-hist">${m.map(x => `<li><span>${esc(x.date)}</span><b>${x.claude && x.claude.overall != null ? esc(String(x.claude.overall)) + (kind === 'ielts' ? ' band' : '/5') : kind === 'ielts' ? x.local.band.toFixed(1) + ' rough' : x.local.words + ' words'}</b><small>${x.local.wpm || '–'} wpm · ${x.local.fN} fillers</small></li>`).join('')}</ul>`;
}
function spkLaunchHTML(kind){
  const ielts = kind === 'ielts';
  return `<section class="card spk-launch"><div class="spk-lh"><span class="srs-ic">${ic(ielts ? 'mic' : 'target', 18)}</span><div><h3>${ielts ? 'Speaking examiner' : 'Interview coach'}</h3>
      <p class="muted">${ielts ? 'A full IELTS Speaking test: Part 1, a cue card with 1 minute to prepare and 2 to talk, then Part 3. About 12 minutes.' : 'Five questions for operator and engineering roles, answered out loud with STAR. About 10 minutes.'}</p></div>
      <button class="btn btn-deep" data-spk-start="${kind}">${ielts ? 'Start the test' : 'Start practice'}</button></div>${spkHistHTML(kind)}</section>`;
}
learnSpeakHTML = (orig => function(){ return spkLaunchHTML('ielts') + orig.apply(this, arguments); })(learnSpeakHTML);
learnCareerHTML = (orig => function(){ return spkLaunchHTML('interview') + orig.apply(this, arguments); })(learnCareerHTML);
