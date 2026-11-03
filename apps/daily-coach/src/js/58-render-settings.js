/* ============================================================
   SETTINGS + CHAT EVERYWHERE
   - Settings: a liquid-glass sheet (rail, the gear in the date
     strip) with profile, look and motion, goals, coach and voice,
     tips and data. Every change saves at once.
   - Chat: a floating glass orb button on every tab opens the
     coach; the mic button next to it starts voice input. In the
     chat: mic (speech-to-text where the browser allows it) and a
     speaker toggle that reads answers aloud.
   ============================================================ */
Object.assign(ICONS, {
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  volume:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  mute:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  palette:'<path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A4.7 4.7 0 0 0 22 9.7C22 6 17.5 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7" r="1.2"/>',
  bell:'<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"/>',
  shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'
});
const displayName = () => (state.profile && state.profile.display) || 'KsHan';
const displayInitials = () => (displayName().replace(/[^A-Za-z]/g,'').slice(0,2) || 'KS').toUpperCase();

/* ---------- settings sheet ---------- */
const SET = { open:false, sec:'profile' };
const SET_SECS = [['profile','user','Profile'],['look','palette','Look and motion'],['goals','target','Goals and money'],['coach','sparkle','Coach and voice'],['auto','robot','Autopilot'],['tips','bell','Tips'],['data','shield','Your data']];
function setField(label, key, val, type='text', extra=''){ return `<label class="set-f"><span>${label}</span><input type="${type}" data-set="${key}" value="${esc(val ?? '')}" ${extra}></label>`; }
function setToggle(label, key, on, note=''){ return `<div class="set-f row"><span>${label}${note?`<small>${note}</small>`:''}</span><button class="set-tg${on?' on':''}" data-set-tg="${key}" role="switch" aria-checked="${!!on}" aria-label="${label}"><i></i></button></div>`; }
function setSeg(label, key, cur, opts){ return `<div class="set-f row"><span>${label}</span><div class="set-seg" role="radiogroup" aria-label="${label}">${opts.map(([v,l])=>`<button role="radio" aria-checked="${cur===v}" class="${cur===v?'on':''}" data-set-seg="${key}" data-v="${v}">${l}</button>`).join('')}</div></div>`; }
function setBody(sec){
  const p = state.profile, s = state.settings;
  if (sec==='profile') return `<h3>Profile</h3><p class="set-note">How the app talks about you. The display name is the big title in Orbit.</p>
    ${setField('Display name','profile.display', displayName())}${setField('Full name','profile.name', p.name)}${setField('City','profile.city', p.city)}
    ${setField('Height (cm)','profile.heightCm', p.heightCm, 'number', 'inputmode="decimal"')}${setField('Starting weight (kg)','profile.weightStart', p.weightStart, 'number', 'step="0.1" inputmode="decimal"')}${setField('Target weight (kg)','profile.weightTarget', p.weightTarget, 'number', 'step="0.1" inputmode="decimal"')}`;
  if (sec==='look'){ const th = state.theme || 'auto'; return `<h3>Look and motion</h3><p class="set-note">Pick a style, then tune its glass. Every change saves at once and you can come back and edit it any time. Reduced motion stops every animation, the galaxy included.</p>
    ${typeof skinPickHTML==='function' ? `<div class="set-sub">Style</div>${skinPickHTML()}${skinTuneHTML()}<div class="set-sub">Mode</div>` : ''}
    ${setSeg('Theme','theme', th, [['auto','Auto'],['light','Light'],['dark','Dark']])}
    ${setToggle('Reduce motion','reduceMotion', state.reduceMotion, 'Also follows your device setting')}
    ${setToggle('Wide side menu','railOpen', state.railOpen, 'Show names next to the icons (screens 900px and wider)')}
    ${setToggle('Chat button on every tab','chatFab', state.chatFab !== false)}`; }
  if (sec==='goals') return `<h3>Goals and money</h3><p class="set-note">These drive the rings, the savings plan and the coach’s advice.</p>
    ${setField('Savings goal (£)','settings.goal', s.goal, 'number', 'inputmode="decimal"')}${setField('Monthly income (£)','settings.income', s.income, 'number', 'inputmode="decimal"')}${setField('Opening savings (£)','settings.opening', s.opening, 'number', 'inputmode="decimal"')}
    ${setField('Daily steps goal','settings.stepsGoal', s.stepsGoal, 'number', 'inputmode="numeric"')}${setField('IELTS target band','settings.ieltsTarget', s.ieltsTarget, 'number', 'step="0.5" min="4" max="9" inputmode="decimal"')}${setField('IELTS exam date','settings.examDate', s.examDate, 'date')}`;
  if (sec==='coach'){ const u = typeof aiUsage==='function' ? aiUsage() : { calls:0, tin:0, tout:0 }; return `<h3>Coach and voice</h3>
    <div class="set-meter"><div><b class="num">${u.calls}</b><small>Claude answers today</small></div><div><b class="num">≈ ${(u.tin + u.tout).toLocaleString('en-GB')}</b><small>tokens today</small></div><div><b class="num">${aiCap()}</b><small>daily limit</small></div></div>
    ${setSeg('AI usage','aiMode', state.aiMode || 'saver', [['saver','Saver'],['smart','Smart'],['off','Off']])}
    <p class="set-note">${{ saver:'<b>Saver</b> (lowest usage): the built-in coach answers from your own numbers. Claude is used only when you press “Ask Claude” under an answer, or for translation.', smart:'<b>Smart</b>: questions about today, money, training, IELTS or your job get the free built-in answer; other questions go to Claude.', off:'<b>Off</b>: Claude is never used. Everything is answered by the built-in coach.' }[state.aiMode || 'saver']}</p>
    ${setSeg('Daily Claude limit','aiCap', String(aiCap()), [['5','5'],['10','10'],['20','20'],['50','50']])}`
  + `<p class="set-note">Answers come from Claude when it is allowed here, otherwise from the built-in coach. Only a short summary of today’s numbers is sent, never your whole record.</p>
    ${setToggle('Deeper answers','aiDeep', typeof AI!=='undefined' && AI.deep, 'Slower, more thought through')}
    ${setToggle('Read answers aloud','voiceOut', state.voiceOut, 'Uses your device’s voice')}
    ${voicePickHTML()}
    ${setSeg('Voice speed','voiceRate', String(state.voiceRate || 1), [['0.85','Slow'],['1','Normal'],['1.15','Fast']])}
    ${setSeg('Voice input language','voiceLang', state.voiceLang || 'en-GB', [['en-GB','English'],['my-MM','Burmese']])}
    <button class="set-btn" data-set-act="voicetest">${ic('volume',16)} Test the voice</button>`; }
  if (sec==='auto'){ const a = apState(), s2 = ciStatus('2w'), s1 = ciStatus('1m'); return `<h3>Autopilot and check-ins</h3><p class="set-note">The autopilot runs inside this app: when you open it, when you come back to it and every 15 minutes while it is open. It builds today’s plan, works out tips from your numbers and prepares your check-ins. Nothing is sent anywhere.</p>
    ${setToggle('Autopilot','ap.on', a.on, 'Switch everything below on or off')}
    ${setToggle('Build today’s plan','ap.plan', a.plan, 'Tasks, day-plan blocks and your biggest gap, on the Coach tab')}
    ${setToggle('Prepare check-ins','ap.checkins', a.checkins, 'A ready draft and a reminder when one is due')}
    ${setToggle('Tips on the Coach tab','ap.tips', a.tips, 'Savings pace, best day, weakest habit, sleep, weight')}
    ${setToggle('Carry over my own to-dos','ap.carry', a.carry, 'Unfinished items you added move to tomorrow')}
    ${setField('2-week check-ins start from','autopilot.anchor', a.anchor, 'date')}
    <div class="set-meter"><div><b>${esc(ciLabel(s2))}</b><small>2-week check-in</small></div><div><b>${esc(ciLabel(s1))}</b><small>Monthly check-in</small></div><div><b class="num">${(state.reviews||[]).length}</b><small>check-ins done</small></div></div>
    <button class="set-btn" data-set-act="aprun">${ic('robot',16)} Run the autopilot now</button>
    <div class="set-sub">Recent runs</div><ul class="set-log">${(a.log||[]).slice(0,8).map(l=>{ const d = new Date(l.ts); return `<li><span class="num">${shortDate(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}</span>${esc(l.msg)}</li>`; }).join('') || '<li>Nothing yet.</li>'}</ul>
    <p class="set-note"><b>Cloud builder:</b> a scheduled Claude run works on the app’s code at night (new features, fixes, content), tests it and pushes it to GitHub. It cannot see your logged data, which stays in this browser.</p>`; }
  if (sec==='tips') { const off = ((state.tipsOff||{})[dkey()]) || []; return `<h3>Tips</h3><p class="set-note">Tips on Today come from your own numbers. Dismissed ones come back the next day.</p>
    ${setToggle('Show tips on Today','tipsShow', state.tipsShow !== false)}
    <div class="set-f row"><span>Hidden today<small>${off.includes('*') ? 'All tips' : off.length ? off.length + ' tip' + (off.length>1?'s':'') : 'None'}</small></span><button class="set-btn sm" data-set-act="tipsback">Bring them back</button></div>`; }
  return `<h3>Your data</h3><p class="set-note">Everything lives in this browser only. Export a backup before clearing site data or switching phones.</p>
    <div class="set-acts"><button class="set-btn" data-a="export">${ic('download',16)} Export backup</button><button class="set-btn" data-a="import">${ic('upload',16)} Import backup</button><button class="set-btn danger" data-a="reset">${ic('x',16)} Reset everything</button></div>`;
}
function voicePickHTML(){
  const vs = voiceList(), cur = pickVoice(), fem = vs.filter(voiceIsFemale), other = vs.filter(v => !voiceIsFemale(v) && !VOICE_M.test(v.name));
  if (!vs.length) return `<div class="set-f row" data-ico="speaker"><span>Voice<small>Your device has not loaded its voices yet. Open this page again in a moment.</small></span></div>`;
  const opt = v => `<option value="${esc(v.name)}" ${cur && cur.name === v.name ? 'selected' : ''}>${esc(v.name.replace(/^(Microsoft|Google) /, ''))} · ${esc(v.lang)}</option>`;
  return `<label class="set-f" data-ico="speaker"><span>Voice<small>${cur ? (voiceIsFemale(cur) ? 'Female voice' : 'Closest voice on this device') : 'Device default'}</small></span>
    <select class="set-sel" data-set-voice aria-label="Voice"><option value="">Automatic (female)</option>${fem.length ? `<optgroup label="Female voices">${fem.map(opt).join('')}</optgroup>` : ''}${other.length ? `<optgroup label="Other voices">${other.map(opt).join('')}</optgroup>` : ''}</select></label>`;
}
document.addEventListener('change', e => { const s = e.target.closest('[data-set-voice]'); if (!s) return; state.voiceName = s.value; save(); aiSpeak(`Hello ${displayName()}. This is your coach.`, true); });
function setHTML(){
  return `<div class="set-ov" id="setOv" role="dialog" aria-modal="true" aria-label="Settings">
    <div class="set-sheet">
      <aside class="set-nav"><div class="set-hd"><span class="set-av">${esc(displayInitials())}</span><div><b>${esc(displayName())}</b><small>Settings</small></div></div>
        ${SET_SECS.map(([k,i,l])=>`<button class="set-ni${k===SET.sec?' on':''}" data-set-sec="${k}">${ic(i,17)}<span>${l}</span></button>`).join('')}</aside>
      <section class="set-body" id="setBody">${setBody(SET.sec)}</section>
      <button class="set-x" data-set-close aria-label="Close settings">${ic('x',18)}</button>
    </div></div>`;
}
function setOpen(sec){ if (sec) SET.sec = sec; document.getElementById('setOv')?.remove(); document.body.insertAdjacentHTML('beforeend', setHTML()); document.body.classList.add('set-open'); SET.open = true; setTimeout(()=>document.querySelector('#setOv .set-ni.on')?.focus({ preventScroll:true }), 60); }
function setClose(){ const o = document.getElementById('setOv'); if (!o) return; o.classList.add('out'); document.body.classList.remove('set-open'); SET.open = false; setTimeout(()=>o.remove(), motionOff() ? 0 : 320); }
function setRefreshApp(){ try { renderView(activeTab); updateChrome(); if (typeof mountRail==='function') mountRail(); chatFab(); } catch(_){} }
document.addEventListener('click', e=>{
  if (e.target.closest('[data-set-open]')){ e.stopPropagation(); setOpen(); return; }
  const ov = e.target.closest('#setOv'); if (!ov) return;
  if (e.target === ov || e.target.closest('[data-set-close]')){ e.stopPropagation(); setClose(); return; }
  const sec = e.target.closest('[data-set-sec]'); if (sec){ e.stopPropagation(); SET.sec = sec.dataset.setSec; ov.querySelectorAll('.set-ni').forEach(b=>b.classList.toggle('on', b===sec)); const body = document.getElementById('setBody'); body.classList.remove('in'); void body.offsetWidth; body.innerHTML = setBody(SET.sec); body.classList.add('in'); return; }
  const tg = e.target.closest('[data-set-tg]'); if (tg){ e.stopPropagation(); const k = tg.dataset.setTg, on = !tg.classList.contains('on'); tg.classList.toggle('on', on); tg.setAttribute('aria-checked', String(on));
    if (k==='aiDeep'){ if (typeof AI!=='undefined') AI.deep = on; }
    else if (k==='gtSolid'){ skinSet('solid', on); }
    else if (k.startsWith('ap.')){ const ap = apState(); ap[k.slice(3)] = on; apLog(`${tg.getAttribute('aria-label')} ${on ? 'on' : 'off'}.`); save(); if (k==='ap.on' && on) apRun('manual'); if (activeTab==='coach') renderView('coach'); }
    else { state[k] = on; save(); if (k==='reduceMotion') applyMotion(); if (k==='railOpen' && typeof mountRail==='function') mountRail(); if (k==='chatFab') chatFab(); if (k==='tipsShow' && activeTab==='today') renderView('today'); }
    return; }
  const sg = e.target.closest('[data-set-seg]'); if (sg){ e.stopPropagation(); const k = sg.dataset.setSeg, v = sg.dataset.v; sg.parentNode.querySelectorAll('button').forEach(b=>{ const on = b===sg; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    if (k==='theme'){ state.theme = v; save(); applyTheme(); if (typeof mountRail==='function') mountRail(); }
    else if (k==='voiceRate'){ state.voiceRate = +v; save(); }
    else if (k==='aiCap'){ state.aiCap = +v; save(); document.getElementById('setBody').innerHTML = setBody('coach'); }
    else if (k==='aiMode'){ state.aiMode = v; save(); document.getElementById('setBody').innerHTML = setBody('coach'); toast({ saver:'Saver on: Claude only when you ask for it.', smart:'Smart: simple questions answered for free.', off:'Claude is off.' }[v], 'ok', 1800); }
    else { state[k] = v; save(); }
    return; }
  const act = e.target.closest('[data-set-act]'); if (act){ e.stopPropagation(); const a = act.dataset.setAct;
    if (a==='aprun'){ if (state.coachPlan) state.coachPlan.date = ''; apRun('manual'); apLog('Run by hand from Settings.'); save(); document.getElementById('setBody').innerHTML = setBody('auto'); if (activeTab==='coach' || activeTab==='review') renderView(activeTab); toast('Autopilot ran: plan, tips and check-ins are up to date.','ok',1800); return; }
    if (a==='voicetest') aiSpeak(`Hello ${displayName()}. This is how your coach sounds.`, true);
    else if (a==='tipsback'){ if (state.tipsOff) delete state.tipsOff[dkey()]; save(); document.getElementById('setBody').innerHTML = setBody('tips'); if (activeTab==='today') renderView('today'); toast('Tips are back on Today.','ok',1600); }
    return; }
}, true);
document.addEventListener('change', e=>{ const i = e.target.closest('#setOv [data-set]'); if (!i) return; setApply(i); });
document.addEventListener('input', e=>{ const i = e.target.closest('#setOv [data-set]'); if (!i || i.type==='date') return; setApply(i, true); });
function setApply(i, live){
  const [obj, key] = i.dataset.set.split('.'), tgt = state[obj]; if (!tgt) return;
  let v = i.value; if (i.type==='number'){ if (v === '') return; v = parseFloat(v); if (!isFinite(v)) return; }
  if (key==='display'){ v = String(v).trim().slice(0, 24); if (!v) return; }
  tgt[key] = v; save();
  if (!live || key==='display'){ const hd = document.querySelector('#setOv .set-hd b'), av = document.querySelector('#setOv .set-av'); if (hd) hd.textContent = displayName(); if (av) av.textContent = displayInitials(); }
  clearTimeout(SET.t); SET.t = setTimeout(setRefreshApp, live ? 450 : 0);
}
document.addEventListener('keydown', e=>{ if (e.key==='Escape' && SET.open){ e.stopPropagation(); setClose(); } }, true);

/* ---------- voice ----------
   The user asked for a woman's voice (like Siri, Gemini or Claude), never a man's.
   Browsers do not say a voice's gender, so known names are used: female names first,
   known male names never picked automatically. Settings → Coach and voice can pin one. */
const VOICE_F = /female|woman|samantha|serena|karen|moira|tessa|fiona|victoria|allison|\bava\b|susan|zoe|kate|stephanie|martha|catherine|emily|libby|sonia|hazel|zira|aria|jenny|emma|michelle|natasha|clara|sara|maisie|abbi|bella|hollie|olivia|amy|joanna|kendra|kimberly|salli|ivy|nicole|heather|siri|en-gb-x-gba|en-gb-x-gbc|en-gb-x-gbg|en-us-x-sfg|en-us-x-tpc|en-us-x-iob/i;
const VOICE_M = /\bmale\b|daniel|arthur|oliver|george|ryan|thomas|\balex\b|fred|aaron|gordon|rishi|david|\bmark\b|\bguy\b|christopher|eric|roger|brian|elliot|noah|ethan|alfie|\blee\b|james|william|ralph|albert|bruce|junior|en-gb-x-gbb|en-gb-x-gbd|en-gb-x-rjs|en-us-x-iol|en-us-x-iom|en-us-x-tpd/i;
function voiceList(){ try { return ('speechSynthesis' in window) ? speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)) : []; } catch(_){ return []; } }
function voiceIsFemale(v){ return VOICE_F.test(v.name + ' ' + (v.voiceURI || '')) && !/\bmale\b/i.test(v.name.replace(/female/i, '')); }
function pickVoice(){
  const vs = voiceList(); if (!vs.length) return null;
  if (state.voiceName){ const v = vs.find(x => x.name === state.voiceName); if (v) return v; }
  const gb = v => /en[-_]GB/i.test(v.lang), notM = v => !VOICE_M.test(v.name + ' ' + (v.voiceURI || ''));
  return vs.find(v => gb(v) && voiceIsFemale(v) && /natural|neural|online|enhanced|premium/i.test(v.name))
      || vs.find(v => gb(v) && voiceIsFemale(v)) || vs.find(v => voiceIsFemale(v))
      || vs.find(v => gb(v) && notM(v)) || vs.find(notM) || null;
}
function voiceSay(u){ const v = pickVoice(); if (v){ u.voice = v; u.lang = v.lang; } u.pitch = v && voiceIsFemale(v) ? 1 : 1.12; return u; }
if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', () => { if (SET.open && SET.sec === 'coach'){ const b = document.getElementById('setBody'); if (b) b.innerHTML = setBody('coach'); } }); } catch(_){} }
function aiSpeak(text, force){
  if (!('speechSynthesis' in window)){ if (force) toast('This browser cannot read text aloud.','warn',2400); return; }
  if (!force && !state.voiceOut) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(text).replace(/[*_#`>]/g,'').slice(0, 900)); u.lang = 'en-GB'; u.rate = state.voiceRate || 1; voiceSay(u);
    u.onstart = ()=>{ document.getElementById('aiChat')?.classList.add('voicing'); }; u.onend = u.onerror = ()=>{ document.getElementById('aiChat')?.classList.remove('voicing'); };
    speechSynthesis.speak(u); } catch(_){ }
}
/* can this page use the microphone at all? (inside the claude.ai viewer it is not given access) */
function micAllowed(){
  try { const pp = document.permissionsPolicy || document.featurePolicy; if (pp && typeof pp.allowsFeature === 'function') return pp.allowsFeature('microphone'); } catch(_){}
  return true;
}
function dictationTip(){
  const ua = navigator.userAgent, mobile = /Android|iPhone|iPad|iPod/i.test(ua), mac = /Mac/i.test(navigator.platform || ua) && !mobile, win = /Win/i.test(navigator.platform || ua);
  return mobile ? 'Tap the box below, then tap the 🎤 on your keyboard and speak. Your words type in; press send.'
    : win ? 'Click the box below and press <b>Windows key + H</b>, then speak. Windows types your words in; press Enter to send.'
    : mac ? 'Click the box below and press the <b>Fn key twice</b> (or the 🎤 key), then speak. macOS types your words in; press Enter.'
    : 'Click the box below and use your device’s dictation, then press Enter.';
}
function voiceHelp(reason){ // a clear card in the chat instead of a toast that is easy to miss
  const chat = document.getElementById('aiChat'), form = document.getElementById('aiForm'); if (!chat || !form) return;
  chat.querySelector('.ai-vhelp')?.remove();
  const msg = reason==='blocked' ? 'This page isn’t allowed to use the microphone (the claude.ai viewer blocks it), so I can’t record here.'
    : reason==='network' ? 'Voice typing needs the internet: Chrome sends the audio to Google to turn it into text.'
    : reason==='nomic' ? 'I can’t find a microphone. Check one is plugged in and allowed for Chrome.'
    : reason==='denied' ? 'The microphone permission was turned down. Allow it from the 🔒 icon in the address bar, then tap the mic again.'
    : 'Voice typing isn’t available in this browser.';
  form.insertAdjacentHTML('beforebegin', `<div class="ai-vhelp" role="status"><b>${ic('mic',16)} Voice</b><p>${msg}</p><p class="ai-vtip">${dictationTip()}</p><button class="ai-vx" aria-label="Close">${ic('x',14)}</button></div>`);
  chat.querySelector('.ai-vx').addEventListener('click', e=>{ e.stopPropagation(); chat.querySelector('.ai-vhelp')?.remove(); });
  const q = document.getElementById('aiQ'); if (q) q.focus();
}
function aiListen(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (AI.rec){ try { AI.rec.stop(); } catch(_){} return; }
  if (!SR){ voiceHelp('unsupported'); return; }
  if (!micAllowed()){ voiceHelp('blocked'); return; }
  const q = document.getElementById('aiQ'), mic = document.getElementById('aiMic'), chat = document.getElementById('aiChat'), hint = document.getElementById('aiHint'); if (!q) return;
  chat?.querySelector('.ai-vhelp')?.remove();
  let finalText = '', heard = false, failed = false, rec;
  try { rec = new SR(); } catch(_){ voiceHelp('unsupported'); return; }
  rec.lang = state.voiceLang || 'en-GB'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
  rec.onstart = ()=>{ if (hint) hint.textContent = 'Listening… speak now'; };
  rec.onresult = e=>{ let t = ''; for (let i=0;i<e.results.length;i++) t += e.results[i][0].transcript; heard = true; q.value = t; q.style.height = 'auto'; q.style.height = Math.min(120, q.scrollHeight) + 'px'; finalText = t; if (hint) hint.textContent = '“' + t.slice(-60) + '”'; };
  rec.onerror = e=>{ failed = true; const er = e.error;
    if (er==='not-allowed' || er==='service-not-allowed') voiceHelp(micAllowed() ? 'denied' : 'blocked');
    else if (er==='network') voiceHelp('network');
    else if (er==='audio-capture') voiceHelp('nomic');
    else if (er==='no-speech') toast('I didn’t hear anything. Tap the mic and speak straight away.','warn',2600);
    else if (er!=='aborted') toast('Voice stopped (' + er + '). Try again or type.','warn',2600); };
  rec.onend = ()=>{ AI.rec = null; mic?.classList.remove('on'); chat?.classList.remove('mic-on');
    if (finalText.trim()){ AI.voiceTurn = true; aiSend(); }
    else { AI.state = 'idle'; aiHint(); if (!failed && !heard) toast('I didn’t catch that. Tap the mic and try again.','warn',2400); } };
  try { rec.start(); } catch(e){ voiceHelp(micAllowed() ? 'denied' : 'blocked'); return; }
  AI.rec = rec; mic?.classList.add('on'); chat?.classList.add('mic-on'); AI.state = 'listening'; aiHint();
  if (hint) hint.textContent = 'Starting the microphone…';
}
/* decorate the chat with mic + speaker, and read answers aloud */
{ const _open = aiOpen; aiOpen = function(mode){ _open(mode); const chat = document.getElementById('aiChat'); if (!chat) return;
    const form = document.getElementById('aiForm'); form.classList.add('with-mic');
    form.insertAdjacentHTML('afterbegin', `<button type="button" class="ai-mic" id="aiMic" aria-label="Speak your question">${ic('mic',20)}<span class="ai-micw" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>`);
    const top = chat.querySelector('.ai-top'), menu = top.querySelector('[data-a="ai-menu"]');
    menu.insertAdjacentHTML('beforebegin', `<button class="ai-ib ai-spk${state.voiceOut?' on':''}" id="aiSpk" aria-label="${state.voiceOut?'Stop reading answers aloud':'Read answers aloud'}" aria-pressed="${!!state.voiceOut}">${ic(state.voiceOut?'volume':'mute',19)}</button>`);
    if (typeof KM!=='undefined' && KM.open){ chat.classList.add('over-map');
      const sel = KM.sel, nm = sel && sel.name, sugg = !sel ? ['What should I study next?', 'Explain my biggest gap in one minute', 'Plan my week from this map']
        : sel.type==='task' ? [`Give me a 2-minute way to start: ${nm}`, `Why does "${nm}" matter for my goals?`]
        : sel.type==='hole' ? [`How do I avoid: ${nm}?`, `Give me a real example of "${nm}" going wrong`]
        : sel.type==='neb' ? [`How am I doing on my ${nm} goal?`, `One step today towards ${nm}`]
        : sel.type==='domain' ? [`Explain ${nm} simply`, `Quiz me on ${nm}`, `How does ${nm} help at Huhtamaki?`]
        : nm ? [`Explain ${nm} simply`, `Quiz me with 3 questions on ${nm}`, `How would I use ${nm} on a production line?`] : ['What should I study next?'];
      form.insertAdjacentHTML('beforebegin', `<div class="ai-sugg" role="list" aria-label="Suggested questions">${sugg.map(t=>`<button role="listitem" data-sugg="${esc(t)}">${esc(t)}</button>`).join('')}</div>`);
      chat.querySelectorAll('[data-sugg]').forEach(b=>b.addEventListener('click', e=>{ e.stopPropagation(); aiSend(b.dataset.sugg); chat.querySelector('.ai-sugg')?.remove(); })); }
    document.getElementById('aiMic').addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); aiListen(); });
    document.getElementById('aiSpk').addEventListener('click', e=>{ e.stopPropagation(); state.voiceOut = !state.voiceOut; save(); const b = e.currentTarget; b.classList.toggle('on', state.voiceOut); b.innerHTML = ic(state.voiceOut?'volume':'mute',19); b.setAttribute('aria-pressed', String(state.voiceOut)); b.setAttribute('aria-label', state.voiceOut?'Stop reading answers aloud':'Read answers aloud'); if (!state.voiceOut && 'speechSynthesis' in window) speechSynthesis.cancel(); toast(state.voiceOut ? 'Answers will be read aloud.' : 'Voice off.', 'ok', 1500); });
  }; }
{ const _send = aiSend; aiSend = async function(p, o){ const n = state.chat.length, byVoice = !!AI.voiceTurn; AI.voiceTurn = false; await _send(p, o); const last = state.chat[state.chat.length-1]; if (AI.mode!=='translate' && state.chat.length > n && last && last.role==='coach') aiSpeak(last.text, byVoice); }; }
{ const _close = aiClose; aiClose = function(){ if (AI.rec){ try { AI.rec.abort(); } catch(_){} AI.rec = null; } if ('speechSynthesis' in window) speechSynthesis.cancel(); return _close(); }; }

/* ---------- floating chat button on every tab ---------- */
function chatFab(){
  document.getElementById('cfab')?.remove(); if (state.chatFab === false) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="cfab" id="cfab">
    <button class="cfab-mic" data-cfab="voice" aria-label="Ask the coach by voice">${ic('mic',19)}</button>
    <button class="cfab-main" data-cfab="chat" aria-label="Open the coach chat"><span class="cfab-orb" aria-hidden="true"><i></i></span><span class="cfab-t"><b>Ask coach</b><small>${typeof aiOnline==='function' && aiOnline() ? 'Claude' : 'Text or voice'}</small></span></button>
  </div>`);
}
document.addEventListener('click', e=>{ const b = e.target.closest('[data-cfab]'); if (!b) return; e.stopPropagation(); aiOpen('chat'); if (b.dataset.cfab==='voice') aiListen(); }, true);
/* gear in the date strip and a Settings entry in the rail */
{ const _sb = statusBar; statusBar = function(){ return _sb().replace(/<\/div>\s*$/, `<button class="sb-gear" data-set-open aria-label="Settings">${ic('gear',16)}</button></div>`); }; }
if (typeof railHTML === 'function'){ const _rh = railHTML; railHTML = function(){ return _rh().replace('<div class="rail-foot">', `<div class="rail-list rail-set"><button class="rail-i" data-set-open aria-label="Settings"><span class="rail-ic">${ic('gear',19)}</span><span class="rail-n">Settings</span><span class="rail-tip" aria-hidden="true">Settings</span></button></div><div class="rail-foot">`).replace(/<b>KsHan<\/b>/g, `<b>${esc(displayName())}</b>`).replace('<span class="rail-av">KS</span>', `<span class="rail-av">${esc(displayInitials())}</span>`); }; }
/* tips can be switched off completely */
if (typeof waveTips === 'function'){ const _wt = waveTips; waveTips = function(){ return state.tipsShow === false ? [] : _wt(); }; }
