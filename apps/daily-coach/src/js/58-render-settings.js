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
const SET_SECS = [['profile','user','Profile'],['look','palette','Look and motion'],['goals','target','Goals and money'],['coach','sparkle','Coach and voice'],['tips','bell','Tips'],['data','shield','Your data']];
function setField(label, key, val, type='text', extra=''){ return `<label class="set-f"><span>${label}</span><input type="${type}" data-set="${key}" value="${esc(val ?? '')}" ${extra}></label>`; }
function setToggle(label, key, on, note=''){ return `<div class="set-f row"><span>${label}${note?`<small>${note}</small>`:''}</span><button class="set-tg${on?' on':''}" data-set-tg="${key}" role="switch" aria-checked="${!!on}" aria-label="${label}"><i></i></button></div>`; }
function setSeg(label, key, cur, opts){ return `<div class="set-f row"><span>${label}</span><div class="set-seg" role="radiogroup" aria-label="${label}">${opts.map(([v,l])=>`<button role="radio" aria-checked="${cur===v}" class="${cur===v?'on':''}" data-set-seg="${key}" data-v="${v}">${l}</button>`).join('')}</div></div>`; }
function setBody(sec){
  const p = state.profile, s = state.settings;
  if (sec==='profile') return `<h3>Profile</h3><p class="set-note">How the app talks about you. The display name is the big title in the knowledge map.</p>
    ${setField('Display name','profile.display', displayName())}${setField('Full name','profile.name', p.name)}${setField('City','profile.city', p.city)}
    ${setField('Height (cm)','profile.heightCm', p.heightCm, 'number', 'inputmode="decimal"')}${setField('Starting weight (kg)','profile.weightStart', p.weightStart, 'number', 'step="0.1" inputmode="decimal"')}${setField('Target weight (kg)','profile.weightTarget', p.weightTarget, 'number', 'step="0.1" inputmode="decimal"')}`;
  if (sec==='look'){ const th = state.theme || 'auto'; return `<h3>Look and motion</h3><p class="set-note">Light is soft pearl, dark is obsidian. Reduced motion stops every animation, the galaxy included.</p>
    ${setSeg('Theme','theme', th, [['auto','Auto'],['light','Light'],['dark','Dark']])}
    ${setToggle('Reduce motion','reduceMotion', state.reduceMotion, 'Also follows your device setting')}
    ${setToggle('Wide side menu','railOpen', state.railOpen, 'Show names next to the icons (screens 900px and wider)')}
    ${setToggle('Chat button on every tab','chatFab', state.chatFab !== false)}`; }
  if (sec==='goals') return `<h3>Goals and money</h3><p class="set-note">These drive the rings, the savings plan and the coach’s advice.</p>
    ${setField('Savings goal (£)','settings.goal', s.goal, 'number', 'inputmode="decimal"')}${setField('Monthly income (£)','settings.income', s.income, 'number', 'inputmode="decimal"')}${setField('Opening savings (£)','settings.opening', s.opening, 'number', 'inputmode="decimal"')}
    ${setField('Daily steps goal','settings.stepsGoal', s.stepsGoal, 'number', 'inputmode="numeric"')}${setField('IELTS target band','settings.ieltsTarget', s.ieltsTarget, 'number', 'step="0.5" min="4" max="9" inputmode="decimal"')}${setField('IELTS exam date','settings.examDate', s.examDate, 'date')}`;
  if (sec==='coach') return `<h3>Coach and voice</h3><p class="set-note">Answers come from Claude when it is allowed here, otherwise from the built-in coach. Only a short summary of today’s numbers is sent, never your whole record.</p>
    ${setToggle('Deeper answers','aiDeep', typeof AI!=='undefined' && AI.deep, 'Slower, more thought through')}
    ${setToggle('Read answers aloud','voiceOut', state.voiceOut, 'Uses your device’s voice')}
    ${setSeg('Voice speed','voiceRate', String(state.voiceRate || 1), [['0.85','Slow'],['1','Normal'],['1.15','Fast']])}
    ${setSeg('Voice input language','voiceLang', state.voiceLang || 'en-GB', [['en-GB','English'],['my-MM','Burmese']])}
    <button class="set-btn" data-set-act="voicetest">${ic('volume',16)} Test the voice</button>`;
  if (sec==='tips') { const off = ((state.tipsOff||{})[dkey()]) || []; return `<h3>Tips</h3><p class="set-note">Tips on Today come from your own numbers. Dismissed ones come back the next day.</p>
    ${setToggle('Show tips on Today','tipsShow', state.tipsShow !== false)}
    <div class="set-f row"><span>Hidden today<small>${off.includes('*') ? 'All tips' : off.length ? off.length + ' tip' + (off.length>1?'s':'') : 'None'}</small></span><button class="set-btn sm" data-set-act="tipsback">Bring them back</button></div>`; }
  return `<h3>Your data</h3><p class="set-note">Everything lives in this browser only. Export a backup before clearing site data or switching phones.</p>
    <div class="set-acts"><button class="set-btn" data-a="export">${ic('download',16)} Export backup</button><button class="set-btn" data-a="import">${ic('upload',16)} Import backup</button><button class="set-btn danger" data-a="reset">${ic('x',16)} Reset everything</button></div>`;
}
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
    else { state[k] = on; save(); if (k==='reduceMotion') applyMotion(); if (k==='railOpen' && typeof mountRail==='function') mountRail(); if (k==='chatFab') chatFab(); if (k==='tipsShow' && activeTab==='today') renderView('today'); }
    return; }
  const sg = e.target.closest('[data-set-seg]'); if (sg){ e.stopPropagation(); const k = sg.dataset.setSeg, v = sg.dataset.v; sg.parentNode.querySelectorAll('button').forEach(b=>{ const on = b===sg; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    if (k==='theme'){ state.theme = v; save(); applyTheme(); if (typeof mountRail==='function') mountRail(); }
    else if (k==='voiceRate'){ state.voiceRate = +v; save(); }
    else { state[k] = v; save(); }
    return; }
  const act = e.target.closest('[data-set-act]'); if (act){ e.stopPropagation(); const a = act.dataset.setAct;
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

/* ---------- voice ---------- */
function aiSpeak(text, force){
  if (!('speechSynthesis' in window)){ if (force) toast('This browser cannot read text aloud.','warn',2400); return; }
  if (!force && !state.voiceOut) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(text).replace(/[*_#`>]/g,'').slice(0, 900)); u.lang = 'en-GB'; u.rate = state.voiceRate || 1;
    const vs = speechSynthesis.getVoices(); const v = vs.find(x=>/en-GB/i.test(x.lang) && /Daniel|Serena|Google UK|Natural|Neural/i.test(x.name)) || vs.find(x=>/en-GB/i.test(x.lang)); if (v) u.voice = v;
    u.onstart = ()=>{ document.getElementById('aiChat')?.classList.add('voicing'); }; u.onend = u.onerror = ()=>{ document.getElementById('aiChat')?.classList.remove('voicing'); };
    speechSynthesis.speak(u); } catch(_){ }
}
function aiListen(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR){ toast('Voice typing is not available in this browser. Type your question instead.','warn',3000); document.getElementById('aiQ')?.focus(); return; }
  if (AI.rec){ try { AI.rec.stop(); } catch(_){} return; }
  const q = document.getElementById('aiQ'), mic = document.getElementById('aiMic'); if (!q) return;
  let finalText = '', rec;
  try { rec = new SR(); } catch(_){ toast('Voice typing could not start here. Type your question instead.','warn',3000); return; }
  rec.lang = state.voiceLang || 'en-GB'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
  rec.onresult = e=>{ let t = ''; for (let i=0;i<e.results.length;i++) t += e.results[i][0].transcript; q.value = t; q.dispatchEvent(new Event('input')); finalText = t; };
  rec.onerror = e=>{ const blocked = e.error==='not-allowed' || e.error==='service-not-allowed'; toast(blocked ? 'The microphone is blocked in this view. Allow it in your browser, or type instead.' : e.error==='no-speech' ? 'I did not hear anything. Tap the mic and try again.' : 'Voice stopped (' + e.error + ').', 'warn', 3200); };
  rec.onend = ()=>{ AI.rec = null; mic?.classList.remove('on'); document.getElementById('aiChat')?.classList.remove('mic-on'); if (finalText.trim()) aiSend(); else { AI.state = 'idle'; aiHint(); } };
  try { rec.start(); } catch(_){ toast('Voice typing could not start. Type instead.','warn',2600); return; }
  AI.rec = rec; mic?.classList.add('on'); document.getElementById('aiChat')?.classList.add('mic-on'); AI.state = 'listening'; aiHint();
  const h = document.getElementById('aiHint'); if (h) h.textContent = 'Listening… speak now';
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
{ const _send = aiSend; aiSend = async function(p){ const n = state.chat.length; await _send(p); const last = state.chat[state.chat.length-1]; if (AI.mode!=='translate' && state.chat.length > n && last && last.role==='coach') aiSpeak(last.text); }; }
{ const _close = aiClose; aiClose = function(){ if (AI.rec){ try { AI.rec.abort(); } catch(_){} AI.rec = null; } if ('speechSynthesis' in window) speechSynthesis.cancel(); return _close(); }; }

/* ---------- floating chat button on every tab ---------- */
function chatFab(){
  document.getElementById('cfab')?.remove(); if (state.chatFab === false) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="cfab" id="cfab">
    <button class="cfab-mic" data-cfab="voice" aria-label="Ask the coach by voice">${ic('mic',19)}</button>
    <button class="cfab-main" data-cfab="chat" aria-label="Open the coach chat"><span class="cfab-orb" aria-hidden="true"><i></i></span><span class="cfab-t"><b>Ask coach</b><small>${typeof aiOnline==='function' && aiOnline() ? 'Claude' : 'Text or voice'}</small></span></button>
  </div>`);
}
document.addEventListener('click', e=>{ const b = e.target.closest('[data-cfab]'); if (!b) return; e.stopPropagation(); aiOpen('chat'); if (b.dataset.cfab==='voice') setTimeout(aiListen, 300); }, true);
/* gear in the date strip and a Settings entry in the rail */
{ const _sb = statusBar; statusBar = function(){ return _sb().replace(/<\/div>\s*$/, `<button class="sb-gear" data-set-open aria-label="Settings">${ic('gear',16)}</button></div>`); }; }
if (typeof railHTML === 'function'){ const _rh = railHTML; railHTML = function(){ return _rh().replace('<div class="rail-foot">', `<div class="rail-list rail-set"><button class="rail-i" data-set-open aria-label="Settings"><span class="rail-ic">${ic('gear',19)}</span><span class="rail-n">Settings</span><span class="rail-tip" aria-hidden="true">Settings</span></button></div><div class="rail-foot">`).replace(/<b>KsHan<\/b>/g, `<b>${esc(displayName())}</b>`).replace('<span class="rail-av">KS</span>', `<span class="rail-av">${esc(displayInitials())}</span>`); }; }
/* tips can be switched off completely */
if (typeof waveTips === 'function'){ const _wt = waveTips; waveTips = function(){ return state.tipsShow === false ? [] : _wt(); }; }
