/* ============================================================
   COACH AI — assistant home + full-screen conversation
   Layout from an AI-assistant reference: greeting, orb card with
   "Start talking", quick tiles, recent activities, explore row;
   conversation view with a living liquid orb, the question in big
   type lighting up word by word, and the reply streaming in.
   Answers come from Claude through the artifact `sample` capability,
   fed only a short summary of Kyaw's numbers. Without it, the
   rule-based coach (generateReply) answers instead.
   ============================================================ */
Object.assign(ICONS, { back:'<path d="M15 5l-7 7 7 7"/>', list:'<path d="M8 7h11M8 12h11M8 17h7"/><circle cx="4.5" cy="7" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="17" r="1"/>', translate:'<path d="M4 6h9M8.5 4v2c0 4-2 7-5 8.5M6 10c1.5 2.5 3.5 4 6 5"/><path d="M13 20l4-9 4 9M14.5 17h5"/>' });
const AI = { sample:undefined, mode:'chat', state:'idle', ctl:null, deep:false, open:false, orbRaf:0, last:'' };
(async ()=>{ try { AI.sample = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('sample') : null; } catch(e){ AI.sample = null; } if (typeof activeTab!=='undefined' && activeTab==='coach') renderView('coach'); })();
const aiOnline = () => !!AI.sample && AI.sample !== 'denied';

function coachContext(){
  const k = dkey(), next = typeof upNext==='function' ? upNext() : null, ns = typeof nowState==='function' ? nowState(k) : null;
  const allowance = Math.max(0, freeAfterFixed()), spent = spentMonth(), saved = savedTotal(), goal = Number(state.settings.goal)||25000;
  const packs = KNOWLEDGE_PACKS.filter(p=>state.knowledge[p.id]).map(p=>p.title);
  const h = Object.assign({applied:true}, (state.career||{}).huht||{}), stage = HUHT_STAGES.filter(s=>h[s.id]).map(s=>s.t).pop();
  const f = (dayRec(k).feel)||{};
  return [
    `Today: ${prettyDate()}, ${new Date().toTimeString().slice(0,5)} UK time. Tasks done ${todayDone()} of ${todayTotal()}; streak ${currentStreak()} days (4 tasks = a streak day).`,
    next ? `Next task: ${next.name} (${next.meta}).` : 'All tasks for today are done.',
    ns && ns.b ? `Day plan: ${ns.kind==='now'?'now in':'next block'} "${ns.b.name}" at ${ns.b.t}.` : '',
    f.energy || f.mood ? `Energy ${f.energy||'?'}/5, mood ${f.mood||'not set'}.` : '',
    `Money: income ${money0(Number(state.settings.income)||0)}/month, flexible budget ${money0(allowance)}, spent ${money0(spent)} so far this month; saved ${money0(saved)} of the ${money0(goal)} goal.`,
    `Learning: ${packs.length} of ${KNOWLEDGE_PACKS.length} knowledge packs learned${packs.length?` (${packs.slice(0,4).join(', ')})`:''}; drawing test best ${typeof dxBest==='function'?dxBest():0}/8; IELTS essays logged ${((state.ielts||{}).essays||[]).length}.`,
    `Career: Huhtamaki thermo machine operator application, latest stage passed: ${stage||'applied'}.`
  ].filter(Boolean).join('\n');
}
const AI_RULES = `You are the coach inside Kyaw Soe Han's personal growth app. Kyaw is 22, a mechanical engineering graduate (BEng, Portsmouth, 2:2) living in Southsea, UK. He has applied (not yet hired) to Huhtamaki as a thermo machine operator and wants a design or manufacturing engineering job, IELTS Academic band 7+, a fitter body (no equipment) and £25,000 saved in a year. He has 1.5 to 2 hours a day. His past work: automated packaging lines at Barfoots, CNC programming at a plastics printer.
Style: British English, direct and warm, specific numbers instead of adjectives, no hype, never moralise about weight or money. Keep replies under 120 words unless he asks for more. End with one clear next step when it fits. Plain text only, no markdown headings; short lists are fine.
His numbers right now:
`;
const AI_TRANSLATE = `Translate between English and Burmese (Myanmar). If the text is English, reply with the Burmese translation; if it is Burmese, reply with natural British English. Then add one line in English starting "Note:" only if a word has no direct equivalent. No other commentary.`;

function aiTurns(userText){
  const hist = state.chat.slice(-12).map(m=>({ role: m.role==='user' ? 'user' : 'assistant', content: m.text })).filter(m=>m.content);
  while (hist.length && hist[0].role !== 'user') hist.shift();
  const rules = AI.mode==='translate' ? AI_TRANSLATE : AI_RULES + coachContext();
  if (AI.mode==='translate') return [{ role:'user', content: rules + '\n\nText:\n' + userText }];
  return [{ role:'user', content: rules }, ...hist, { role:'user', content: userText }];
}

/* ---------- liquid orb ---------- */
function orbPaint(cv, mode){
  const W = cv.clientWidth, H = cv.clientHeight, d = Math.min(2, devicePixelRatio||1); if (!W || !H) return;
  if (cv.width !== Math.round(W*d) || cv.height !== Math.round(H*d)){ cv.width = Math.round(W*d); cv.height = Math.round(H*d); }
  const g = cv.getContext('2d'); g.setTransform(d,0,0,d,0,0); g.clearRect(0,0,W,H);
  const T = motionOff() ? 1.2 : performance.now()/1000, st = AI.state, sp = st==='thinking' ? 2.6 : st==='speaking' ? 1.6 : 0.7;
  const beat = st==='speaking' ? .04*Math.sin(T*9) : st==='listening' ? .025*Math.sin(T*5) : .015*Math.sin(T*1.6);
  const cx = W/2, cy = H/2, r = Math.min(W,H)*.36*(1+beat), dark = document.documentElement.getAttribute('data-theme')==='dark';
  // outer glow
  const gR = Math.min(W,H)/2 - 1;
  let gr = g.createRadialGradient(cx,cy,r*.6,cx,cy,gR); gr.addColorStop(0,'rgba(179,143,111,.42)'); gr.addColorStop(.55,'rgba(113,0,20,.14)'); gr.addColorStop(1,'rgba(113,0,20,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(cx,cy,gR,0,7); g.fill();
  g.save(); g.beginPath(); g.arc(cx,cy,r,0,7); g.clip();
  gr = g.createRadialGradient(cx-r*.3,cy-r*.35,r*.1,cx,cy,r); gr.addColorStop(0,'#F3E6D6'); gr.addColorStop(.35,'#C9A27E'); gr.addColorStop(.75,'#8A0A1E'); gr.addColorStop(1,'#3A0710');
  g.fillStyle = gr; g.fillRect(cx-r,cy-r,r*2,r*2);
  // moving liquid blobs
  g.globalCompositeOperation = 'lighter';
  const blobs = [['rgba(230,205,176,.55)',.55,.9,1.3],['rgba(196,140,110,.45)',.7,-.7,1.7],['rgba(214,170,180,.32)',.6,1.1,2.1],['rgba(230,205,176,.4)',.45,-1.3,1.1]];
  blobs.forEach(([c,s,ph,f],i)=>{ const a = T*sp*.35*f + ph*3, bx = cx + Math.cos(a)*r*.42, by = cy + Math.sin(a*1.3+i)*r*.38, br = r*s*(1+.12*Math.sin(T*sp+i));
    const b = g.createRadialGradient(bx,by,0,bx,by,br); b.addColorStop(0,c); b.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = b; g.beginPath(); g.arc(bx,by,br,0,7); g.fill(); });
  // caustic ribbons
  g.lineWidth = r*.06; g.lineCap = 'round';
  for (let i=0;i<3;i++){ g.strokeStyle = `rgba(255,240,210,${.12+i*.04})`; g.beginPath(); for (let x=-1;x<=1;x+=.05){ const y = Math.sin(x*3 + T*sp*.8 + i*2)*.18 + (i-1)*.32; const px = cx + x*r, py = cy + y*r; x===-1 ? g.moveTo(px,py) : g.lineTo(px,py); } g.stroke(); }
  g.globalCompositeOperation = 'source-over'; g.restore();
  // holographic rim + specular
  g.save(); g.translate(cx,cy); g.rotate(T*.3);
  const rim = g.createConicGradient ? g.createConicGradient(0,0,0) : null;
  if (rim){ [[0,'rgba(230,205,176,.9)'],[.25,'rgba(214,170,180,.7)'],[.5,'rgba(179,143,111,.85)'],[.75,'rgba(230,205,176,.8)'],[1,'rgba(230,205,176,.9)']].forEach(([o,c])=>rim.addColorStop(o,c)); g.strokeStyle = rim; }
  else g.strokeStyle = 'rgba(230,205,176,.7)';
  g.lineWidth = Math.max(1.5, r*.025); g.beginPath(); g.arc(0,0,r-1,0,7); g.stroke(); g.restore();
  g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(cx-r*.32, cy-r*.42, r*.26, r*.12, -.55, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(cx+r*.35, cy+r*.45, r*.18, r*.07, -.6, 0, 7); g.fill();
  if (st==='thinking' && !motionOff()){ g.strokeStyle = 'rgba(230,205,176,.55)'; g.lineWidth = 2; g.beginPath(); g.arc(cx,cy,r*1.14,T*3,T*3+1.4); g.stroke(); g.beginPath(); g.arc(cx,cy,r*1.14,T*3+Math.PI,T*3+Math.PI+1.4); g.stroke(); }
}
function orbLoop(){
  cancelAnimationFrame(AI.orbRaf);
  const tick = ()=>{ const cvs = document.querySelectorAll('canvas.ai-orb'); if (!cvs.length) return; cvs.forEach(c=>orbPaint(c)); if (!motionOff()) AI.orbRaf = requestAnimationFrame(tick); };
  AI.orbRaf = requestAnimationFrame(tick);
}

/* ---------- home ---------- */
const AI_EXPLORE = [
  ['pen','Mark my essay','Paste a Task 2 essay and get a band estimate with three fixes.', 'I will paste an IELTS Task 2 essay. Give a band estimate for each criterion and the three changes that would raise it most. Here it is:\n\n'],
  ['mic','Interview practice','One Huhtamaki question at a time, then feedback.', 'Interview me for the Huhtamaki thermo machine operator role. Ask one question, wait for my answer, then give short feedback before the next.'],
  ['gears','Explain a topic','Any engineering idea, at shop-floor level.', 'Explain how vacuum forming pulls a heated sheet onto a mould, with one worked number and one common fault.'],
  ['calendar','Plan my week','Seven days built from your real numbers.', 'Plan my next 7 days around my numbers: training, IELTS, one knowledge pack a day, and the Huhtamaki process. Keep it to one line per day.'],
  ['wallet','Money check','Where the month stands and what to change.', 'Check my money this month against the £25,000 goal and tell me the one change that matters most.']
];
function renderCoach(){
  const h = new Date().getHours(), greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const recent = [...(state.chatArchive||[]).flatMap(c=>c.filter(m=>m.role==='user').slice(0,1)), ...state.chat.filter(m=>m.role==='user')].slice(-3).reverse();
  const online = aiOnline();
  setTimeout(orbLoop, 30);
  return `<section class="ai-home">
    <div class="ai-hello"><span class="tiny">${greet}, Kyaw ✦</span><h2>What can I do for you today?</h2>
      <span class="ai-status ${online?'on':''}"><i></i>${online ? 'Coach AI · powered by Claude' : AI.sample===undefined ? 'Connecting…' : 'Offline coach · rule-based answers'}</span></div>
    <div class="ai-grid">
      <button class="ai-hero" data-a="ai-open" data-id="chat" data-tilt>
        <canvas class="ai-orb" aria-hidden="true"></canvas>
        <b>Let’s talk with your personal coach</b>
        <span class="ai-start">Start talking</span>
      </button>
      <button class="ai-tile" data-a="ai-new"><span class="ai-ti">${ic('edit',18)}</span><b>Start new chat</b><span class="ai-arrow">${ic('arrowRight',16)}</span></button>
      <button class="ai-tile" data-a="ai-open" data-id="translate"><span class="ai-ti">${ic('translate',18)}</span><b>English ⇄ Burmese translation</b><span class="ai-arrow">${ic('arrowRight',16)}</span></button>
    </div>
    <div class="h2">Recent activities <span class="side">${recent.length ? '' : 'none yet'}</span></div>
    <div class="glass ai-recent">${recent.length ? recent.map(m=>`<button class="ai-rrow" data-a="ai-open" data-id="chat"><span class="ai-ti sm">${ic(/\?$/.test(m.text)?'mic':'edit',16)}</span><span class="ai-rt">${esc(m.text.slice(0,90))}</span>${ic('arrowRight',16)}</button>`).join('') : `<div class="tiny" style="padding:14px">Your questions will appear here. Try “Plan my day” or “Explain OEE”.</div>`}</div>
    <div class="h2">Explore more features <span class="side">tap to start</span></div>
    <div class="ai-explore">${AI_EXPLORE.map(([i,t,d],n)=>`<button class="ai-ex" data-a="ai-preset" data-id="${n}"><span class="ai-ti">${ic(i,18)}</span><b>${t}</b><small>${d}</small></button>`).join('')}</div>
    <div class="tiny ai-privacy">When you ask, Coach AI sends Claude your question, the recent chat and a short summary of today’s numbers (tasks, streak, money totals, learning progress). Everything else stays in this browser.</div>
  </section>
  ${coachSettingsHTML()}`;
}

/* ---------- conversation overlay ---------- */
function aiWords(text, lit){ return esc(text).split(/(\s+)/).map((w,i)=>/\s+/.test(w) ? w : `<span class="${i/2 < lit ? 'lit' : ''}">${w}</span>`).join(''); }
function aiShellHTML(){
  const tr = AI.mode==='translate';
  return `<div class="ai-chat" id="aiChat" role="dialog" aria-modal="true" aria-label="${tr?'Translation':'Coach chat'}">
    <header class="ai-top"><button class="ai-ib" data-a="ai-close" aria-label="Back">${ic('back',20)}</button>
      <span class="ai-pill"><i class="${aiOnline()?'on':''}"></i>${tr ? 'Translate · English ⇄ Burmese' : aiOnline() ? 'Coach AI · Claude' : 'Offline coach'}</span>
      <button class="ai-ib" data-a="ai-menu" aria-label="More options" aria-expanded="false"><span class="ai-dots"><i></i><i></i><i></i></span></button>
      <div class="ai-menu" id="aiMenu" hidden>${tr?'':`<button data-a="ai-deep">${AI.deep?'✓ ':''}Deeper answers (slower)</button>`}<button data-a="ai-new">New chat</button><button data-a="ai-clear">Clear this chat</button></div></header>
    <p class="ai-hint" id="aiHint">${tr ? 'Type English or Burmese' : 'Go ahead! I’m listening'}</p>
    <canvas class="ai-orb ai-big" aria-hidden="true"></canvas>
    <div class="ai-log" id="aiLog" aria-live="polite">${aiLogHTML()}</div>
    <form class="ai-input" id="aiForm"><textarea id="aiQ" rows="1" placeholder="${tr ? 'Text to translate…' : 'Ask your coach…'}" aria-label="Message"></textarea></form>
    <div class="ai-dock">
      <button class="ai-side" data-a="ai-history" aria-label="Show the whole chat">${ic('list',20)}</button>
      <button class="ai-main" id="aiMain" data-a="ai-send" aria-label="Send">${ic('arrowRight',26)}</button>
      <button class="ai-side" data-a="${tr?'ai-open':'ai-new'}" data-id="chat" aria-label="${tr?'Back to chat':'New chat'}">${ic(tr?'edit':'plus',20)}</button>
    </div>
  </div>`;
}
function aiLogHTML(){
  const msgs = AI.mode==='translate' ? (AI.tr||[]) : state.chat;
  if (!msgs.length) return `<div class="ai-empty">${AI.mode==='translate' ? 'Write a sentence and it comes back in the other language.' : 'Ask anything: your plan, an engineering idea, an IELTS question, your money.'}</div>`;
  const older = msgs.slice(0,-2), lastQ = msgs.slice(-2);
  return `${older.length ? `<div class="ai-older">${older.map(m=>`<div class="ai-b ${m.role==='user'?'me':''}">${esc(m.text)}</div>`).join('')}</div>` : ''}
    ${lastQ.map(m=> m.role==='user' ? `<p class="ai-q">${aiWords(m.text, 999)}</p>` : `<div class="ai-a">${esc(m.text)}</div>`).join('')}`;
}
function aiOpen(mode){
  AI.mode = mode || 'chat'; if (AI.mode==='translate') AI.tr = AI.tr || [];
  document.getElementById('aiChat')?.remove();
  document.body.insertAdjacentHTML('beforeend', aiShellHTML()); document.body.classList.add('ai-open'); AI.open = true; AI.state = 'idle';
  const q = document.getElementById('aiQ');
  q.addEventListener('input', ()=>{ q.style.height = 'auto'; q.style.height = Math.min(120, q.scrollHeight) + 'px'; AI.state = q.value.trim() ? 'listening' : 'idle'; aiHint(); });
  q.addEventListener('keydown', e=>{ if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); aiSend(); } });
  document.getElementById('aiForm').addEventListener('submit', e=>{ e.preventDefault(); aiSend(); });
  if ((AI.mode==='translate' ? AI.tr : state.chat).length) document.getElementById('aiChat').classList.add('has-log');
  aiScroll(); orbLoop(); setTimeout(()=>q.focus({preventScroll:true}), 250);
}
function aiClose(){ AI.ctl?.abort(); document.getElementById('aiChat')?.classList.add('out'); setTimeout(()=>document.getElementById('aiChat')?.remove(), motionOff()?0:260); document.body.classList.remove('ai-open'); AI.open = false; if (activeTab==='coach') renderView('coach'); }
function aiHint(){ const h = document.getElementById('aiHint'); if (!h) return; h.textContent = AI.state==='thinking' ? 'Thinking…' : AI.state==='speaking' ? (AI.mode==='translate'?'Translating':'Answering') : AI.state==='listening' ? 'I’m listening…' : AI.mode==='translate' ? 'Type English or Burmese' : 'Go ahead! I’m listening'; document.getElementById('aiChat')?.setAttribute('data-state', AI.state);
  const m = document.getElementById('aiMain'); if (m){ m.innerHTML = AI.state==='thinking'||AI.state==='speaking' ? '<span class="ai-stop"></span>' : ic('arrowRight',26); m.setAttribute('aria-label', AI.state==='thinking'||AI.state==='speaking' ? 'Stop' : 'Send'); } }
function aiScroll(){ const l = document.getElementById('aiLog'); if (l) l.scrollTop = l.scrollHeight; }
async function aiSend(preset){
  if (AI.state==='thinking' || AI.state==='speaking'){ AI.ctl?.abort(); return; }
  const q = document.getElementById('aiQ'), text = (preset ?? q.value).trim(); if (!text) { q.focus(); return; }
  q.value = ''; q.style.height = 'auto';
  const list = AI.mode==='translate' ? AI.tr : state.chat;
  list.push({ role:'user', text, ts:Date.now() }); if (AI.mode!=='translate') save();
  document.getElementById('aiChat').classList.add('has-log');
  const log = document.getElementById('aiLog'); log.innerHTML = aiLogHTML();
  // light the question up word by word
  const qEl = log.querySelector('.ai-q:last-of-type'); if (qEl && !motionOff()){ const n = text.split(/\s+/).length; qEl.innerHTML = aiWords(text, 0); let i = 0; const iv = setInterval(()=>{ qEl.innerHTML = aiWords(text, ++i); if (i >= n) clearInterval(iv); }, 70); }
  const ans = document.createElement('div'); ans.className = 'ai-a live'; ans.innerHTML = '<span class="ai-think"><i></i><i></i><i></i></span>'; log.appendChild(ans); aiScroll();
  AI.state = 'thinking'; aiHint();
  let reply = '';
  if (aiOnline()){
    AI.ctl = new AbortController();
    try {
      const r = await AI.sample(aiTurns(text), { cache:false, signal:AI.ctl.signal, modelTier: AI.deep && AI.mode!=='translate' ? 'default' : 'quick',
        onText: ({ text:t })=>{ if (AI.state!=='speaking'){ AI.state = 'speaking'; aiHint(); } ans.textContent = t; aiScroll(); } });
      reply = r.text + (r.truncated ? '\n\n(Cut short. Ask for less at a time.)' : '');
    } catch(e){
      reply = e.text || '';
      if (e.code==='not_granted' || e.code==='sampling_disabled' || e.code==='not_declared' || e.code==='capability_disabled'){ AI.sample = 'denied'; toast('Claude is not allowed here, so the offline coach answered.','warn',3200); }
      else if (e.code==='rate_limited') toast('Claude is busy or your usage limit is reached. Try again in a while.','warn',3200);
      else if (e.code==='refused'){ reply = ''; toast('Claude declined that one. Try rewording it.','warn',2600); }
      else if (e.code!=='cancelled') toast('The connection dropped. Send it again to retry.','warn',2600);
      if (e.code==='cancelled' && reply) reply += ' …';
    }
  }
  if (!reply && AI.mode!=='translate' && (!aiOnline() || AI.sample==='denied')){
    AI.state = 'speaking'; aiHint(); const full = generateReply(text);
    if (motionOff()) reply = full; else { for (let i=0;i<=full.length;i+=3){ ans.textContent = full.slice(0,i); aiScroll(); await new Promise(r=>setTimeout(r,12)); } reply = full; }
  }
  if (!reply && AI.mode==='translate' && !aiOnline()) reply = 'Translation needs Coach AI (Claude), which is not available in this view.';
  ans.classList.remove('live');
  if (reply){ ans.textContent = reply; list.push({ role: AI.mode==='translate' ? 'assistant' : 'coach', text:reply, ts:Date.now() }); if (AI.mode!=='translate') save(); }
  else ans.remove();
  AI.state = 'idle'; AI.ctl = null; aiHint(); aiScroll();
}
function aiAction(a, el){
  if (a==='ai-open') aiOpen(el.dataset.id);
  else if (a==='ai-close') aiClose();
  else if (a==='ai-send') aiSend();
  else if (a==='ai-new'){ if (state.chat.length){ state.chatArchive = [...(state.chatArchive||[]), state.chat].slice(-10); state.chat = []; save(); } if (AI.mode==='translate') AI.tr = []; aiOpen(AI.open && AI.mode==='translate' ? 'translate' : 'chat'); }
  else if (a==='ai-clear'){ if (AI.mode==='translate') AI.tr = []; else { state.chat = []; save(); } document.getElementById('aiLog').innerHTML = aiLogHTML(); document.getElementById('aiMenu').hidden = true; }
  else if (a==='ai-menu'){ const m = document.getElementById('aiMenu'); m.hidden = !m.hidden; el.setAttribute('aria-expanded', String(!m.hidden)); }
  else if (a==='ai-deep'){ AI.deep = !AI.deep; el.textContent = (AI.deep?'✓ ':'') + 'Deeper answers (slower)'; toast(AI.deep ? 'Deeper answers on: Claude thinks first, so replies take longer.' : 'Quick answers on.','ok',2000); }
  else if (a==='ai-history'){ document.getElementById('aiChat').classList.toggle('full'); aiScroll(); }
  else if (a==='ai-preset'){ const p = AI_EXPLORE[+el.dataset.id]; aiOpen('chat'); const q = document.getElementById('aiQ'); if (p[3].endsWith('\n\n')){ q.value = p[3]; q.focus(); q.dispatchEvent(new Event('input')); } else aiSend(p[3]); }
}
document.addEventListener('click', e=>{ const el = e.target.closest('[data-a^="ai-"]'); if (!el) return; e.stopPropagation(); aiAction(el.dataset.a, el); }, true);
document.addEventListener('keydown', e=>{ if (e.key==='Escape' && AI.open) aiClose(); });
