/* ============================================================
   MULTILINGUAL CHAT (3 Nov 2026, user: "I want my AI to understand all
   of my languages in speech and text, and talk back in my selected
   language")
   - Any message in Burmese or Japanese goes to Claude (the built-in
     coach only reads English), whatever the chat language is.
   - Claude is told the user may write or speak English, Burmese or
     Japanese, and always answers in the chosen chat language.
   - A small button next to the mic picks the language the mic listens
     for (browsers listen for one language at a time).
   - Settings → Coach and voice lists which voices this device has, and
     a one-off tip appears when a language has no voice here.
   ============================================================ */
const MIC_LANGS = [['en-GB', 'EN', 'English'], ['my-MM', 'မြန်', 'Burmese'], ['ja-JP', '日本', 'Japanese']];

/* understand everything, answer in the chosen language */
aiRoute = (orig => function(text, force){
  if (AI.mode !== 'translate' && textLang(text) !== 'en' && (state.aiMode || 'saver') !== 'off' && aiUsage().calls < aiCap()) return 'claude';
  return orig.apply(this, arguments);
})(aiRoute);
aiTurns = (orig => function(userText){
  const t = orig.apply(this, arguments); if (AI.mode === 'translate' || !t[0]) return t;
  const name = aiLang() === 'en' ? 'British English' : AI_LANGS[aiLang()].name;
  t[0] = { ...t[0], content: t[0].content.replace('Now:\n', `The user may write or speak in English, Burmese or Japanese, or mix them. Understand any of them and always reply in ${name}.\nNow:\n`) };
  return t;
})(aiTurns);
/* without Claude, say so in the language he chose instead of guessing at English rules */
generateReply = (orig => function(text){
  const l = textLang(text); if (l === 'en') return orig.apply(this, arguments);
  const said = l === 'my' ? 'Burmese' : 'Japanese';
  return { en: `I can see you wrote in ${said}. Without Claude, the built-in coach only reads English, so please ask again in English, or open the app on claude.ai where Claude can answer in any of your languages.`,
    my: 'ဒီ စာကို နားလည်ဖို့ Claude လိုပါတယ်။ Claude မရရင် အင်္ဂလိပ်လို မေးပါ (built-in coach က အင်္ဂလိပ်ပဲ ဖတ်နိုင်ပါတယ်)။',
    ja: 'このメッセージを理解するには Claude が必要です。Claude が使えないときは、英語で質問してください（内蔵コーチは英語だけ読めます）。' }[aiLang()];
})(generateReply);

/* the mic language button next to the mic */
function micLang(){ return MIC_LANGS.find(m => m[0] === state.voiceLang) || MIC_LANGS[0]; }
aiOpen = (orig => function(){
  const r = orig.apply(this, arguments), mic = document.getElementById('aiMic');
  if (mic && !document.getElementById('aiMicLang')){ const m = micLang();
    mic.insertAdjacentHTML('afterend', `<button type="button" class="ai-mlang" id="aiMicLang" lang="${m[0]}" aria-label="The mic listens for ${m[2]}. Tap to change">${m[1]}</button>`); }
  return r;
})(aiOpen);
document.addEventListener('click', e => {
  const b = e.target.closest('#aiMicLang'); if (!b) return; e.stopPropagation();
  const i = MIC_LANGS.findIndex(m => m[0] === state.voiceLang), n = MIC_LANGS[(i + 1) % MIC_LANGS.length];
  state.voiceLang = n[0]; save(); b.textContent = n[1]; b.lang = n[0]; b.setAttribute('aria-label', `The mic listens for ${n[2]}. Tap to change`);
  toast(`The mic now listens for ${n[2]}. Answers still come in ${AI_LANGS[aiLang()].name}.`, 'ok', 2200);
}, true);

/* voices: warn once when a language has no voice on this device */
const VOICE_WARNED = {};
function voiceTip(l){ const ua = navigator.userAgent, android = /Android/i.test(ua), ios = /iPhone|iPad|iPod/i.test(ua), edge = /Edg\//.test(ua);
  if (l === 'my') return android ? 'Install “SM Myanmar TTS” from Google Play and choose it as the text-to-speech engine in Android settings.' : edge ? 'In Edge the voice “Microsoft Nilar Online” should appear after a moment; check your internet connection.' : 'Open the app in Microsoft Edge, which has a Burmese voice (“Microsoft Nilar Online”), or on Android install “SM Myanmar TTS”.';
  return ios ? 'Add a Japanese voice in Settings → Accessibility → Spoken Content → Voices → Japanese.' : android ? 'Install the Japanese voice data in Android settings → Text-to-speech → Google speech services.' : 'Chrome and Edge include Japanese voices; on Windows you can also add Japanese in Settings → Time and language → Speech.'; }
aiSpeak = (orig => function(text){
  const l = textLang(text);
  if (l !== 'en' && voiceList('').length && !pickVoice(l) && !VOICE_WARNED[l]){ VOICE_WARNED[l] = 1; toast(`This device has no ${l === 'my' ? 'Burmese' : 'Japanese'} voice yet, so it can't read this aloud. ${voiceTip(l)}`, 'warn', 6500); }
  return orig.apply(this, arguments);
})(aiSpeak);

/* Settings → Coach and voice: which voices this device has */
setBody = (orig => function(sec){
  const h = orig.apply(this, arguments); if (sec !== 'coach') return h;
  const all = voiceList('');
  const row = (l, name) => { const v = pickVoice(l); return `<div class="set-f row" data-ico="speaker"><span>${name} voice<small>${!all.length ? 'Voices are still loading' : v ? esc(v.name) + (voiceIsFemale(v) ? ' · female' : '') : esc(voiceTip(l))}</small></span><b class="set-ok ${v ? 'on' : ''}">${!all.length ? 'Loading' : v ? 'Ready' : 'Missing'}</b></div>`; };
  return h + `<div class="set-sub">Voices on this device</div>${row('en', 'English')}${row('my', 'Burmese')}${row('ja', 'Japanese')}
    <p class="set-note">The coach understands English, Burmese and Japanese, typed or spoken, and answers in the chat language you choose. The mic listens for one language at a time: change it with the small button next to the mic. Inside the claude.ai viewer the mic is blocked, so use your keyboard’s voice typing in any language instead.</p>`;
})(setBody);
aiSetLang = (orig => function(){ const r = orig.apply(this, arguments), b = document.getElementById('aiMicLang'), m = micLang(); if (b){ b.textContent = m[1]; b.lang = m[0]; b.setAttribute('aria-label', `The mic listens for ${m[2]}. Tap to change`); } return r; })(aiSetLang);
