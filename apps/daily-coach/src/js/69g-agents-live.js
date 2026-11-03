/* ============================================================
   AGENTS · watch them work (3 Nov 2026, user: "I want to see their
   movements and activities … I want to see their real work")
   - "Watch them work" replays a real run on the Team hub: each agent
     takes a packet of your data from KsHan, reads it, measures, reports
     what it found, then sends its score back. Every line is the agent's
     actual result (sources, KPIs, findings, score), not decoration.
   - Work feed: the live run, or the selected agent's last work.
   - Work lanes: what each agent did on each of the last 14 days
     (daily snapshots: score and findings).
   ============================================================ */
const AG_SRC = {
  chief: ['every agent’s results and your Coach plan', 0],
  fit: ['day plan (strength, mobility), steps and weigh-ins', 7],
  ielts: ['essay, speaking and vocab blocks, saved essays and your exam date', 14],
  eng: ['knowledge and Lab blocks and your Orbit topics', 14],
  career: ['job-search and career blocks and your interview stories', 14],
  money: ['savings, expenses and your budget lines', 30],
  health: ['sleep times, plan done and your streak', 7],
  review: ['check-in dates and your past reviews', 0]
};
const AGW = { play: false, timers: [], lines: [], step: 0, of: 0 };

function agDaysWithData(n){ let c = 0; for (let i = 0; i < n; i++){ const d = state.days && state.days[dkey(addDays(new Date(), -i))]; if (d && Object.keys(d).length) c++; } return c; }
function agReadLine(id){
  const [src, n] = AG_SRC[id] || ['your data', 0];
  if (id === 'money'){ const from = dkey(addDays(new Date(), -29)), k = dkey(), cnt = (state.expenses || []).filter(e => e.date >= from && e.date <= k).length + (state.savings || []).filter(e => e.date >= from && e.date <= k).length; return `Read ${cnt} money entries from 30 days: ${src}`; }
  if (id === 'review') return `Read ${(state.reviews || []).length} past check-ins: ${src}`;
  if (id === 'chief') return `Read ${AGENTS.filter(a => a.id !== 'chief' && agOn(a.id)).length} agents’ results and ${((state.coachPlan && state.coachPlan.items) || []).length} plan items`;
  return `Read ${agDaysWithData(n)} of ${n} days: ${src}`;
}
/* the real steps of one agent's run */
function agTrace(id){
  const r = agResult(id); if (!r) return [];
  const [st, stl] = agStatus(r), open = r.findings.filter(f => !f.done);
  return [
    ['read', agReadLine(id)],
    ...(r.kpis || []).map(([l, v, s]) => ['measure', `${l}: ${v}${s ? ` · ${s}` : ''}`]),
    ...(r.findings.length ? r.findings.map(f => ['find', f.t + (f.done ? ' · done' : ''), f.done ? 0 : f.sev]) : [['find', 'Nothing needs you here today', 0]]),
    ['score', `Score ${r.score} · ${stl}${open.length ? ` · ${open.length} open` : ''}`, st]
  ];
}
const agLineHTML = (id, [k, t, x], live) => { const a = AGENTS.find(q => q.id === id) || {};
  return `<li class="agw-l ${k}${k === 'find' && x >= 3 ? ' hi' : ''}${k === 'score' ? ' ' + x : ''}${live ? ' in' : ''}" style="--c:${AG_COLORS[id]}">${live ? `<em>${esc(a.area || '')}</em>` : ''}<i>${({ read: '↓', measure: '≡', find: '!', score: '↑' })[k]}</i><span>${esc(t)}</span></li>`; };

function agWorkHTML(){
  const sel = AGENTS.find(a => a.id === AG.sel) || AGENTS[0], rec = agRec(sel.id), last = rec.last ? new Date(rec.last) : null;
  const days = []; for (let i = 13; i >= 0; i--) days.push(dkey(addDays(new Date(), -i)));
  const list = AGENTS;
  const lanes = `<div class="agw-lanes" role="table" aria-label="What each agent did in the last 14 days">
    <div class="agw-row agw-hd" role="row"><span></span>${days.map((d, i) => `<b role="columnheader" class="${i === 13 ? 'now' : ''}">${i === 13 ? 'Today' : (i % 2 ? '' : +d.slice(8))}</b>`).join('')}</div>
    ${list.map(a => { const h = agRec(a.id).hist || [], on = agOn(a.id);
      return `<div class="agw-row${AG.sel === a.id ? ' sel' : ''}${on ? '' : ' off'}" role="row" data-ag-sel="${a.id}" style="--c:${AG_COLORS[a.id]}"><span role="rowheader">${esc(a.area)}</span>${days.map((d, i) => { const e = h.find(x => x.d === d);
        return e ? `<i role="cell" class="did${i === 13 ? ' now' : ''}" style="--s:${(.25 + .75 * e.s / 100).toFixed(2)};--r:${Math.min(1, .45 + e.f * .14).toFixed(2)}" title="${esc(a.name)} · ${d}: score ${e.s}, ${e.f} finding${e.f === 1 ? '' : 's'}"></i>` : `<i role="cell" class="no" title="${esc(a.name)} · ${d}: did not run"></i>`; }).join('')}</div>`; }).join('')}
    <p class="agw-key"><span><i class="did" style="--s:1;--r:.6"></i>ran · darker = higher score, bigger = more found</span><span><i class="no"></i>did not run</span></p></div>`;
  const feed = AGW.play || AGW.lines.length
    ? AGW.lines.map(([id, l]) => agLineHTML(id, l, true)).join('')
    : agTrace(sel.id).map(l => agLineHTML(sel.id, l)).join('');
  return `<div class="agn-work">
    <section class="agw-card"><header><b>${AGW.play ? 'Live run' : AGW.lines.length ? 'Last live run' : `What ${esc(sel.name)} did`}</b><span id="agwWhen">${AGW.play ? `${AGW.step} of ${AGW.of}` : AGW.lines.length ? 'just now' : last ? `ran at ${pad2(last.getHours())}:${pad2(last.getMinutes())}` : 'not run yet'}</span></header>
      <ol class="agw-feed" id="agwFeed" aria-live="polite">${feed}</ol>
      <div class="agw-acts"><button class="agn-watch" data-ag-watch ${AGW.play ? 'aria-pressed="true"' : ''}>${AGW.play ? 'Skip to the end' : 'Watch them work'}</button>${AGW.lines.length && !AGW.play ? '<button class="agw-clear" data-ag-wclear>Show the selected agent</button>' : ''}</div></section>
    <section class="agw-card"><header><b>Work lanes</b><span>last 14 days · tap a row</span></header>${lanes}</section></div>`;
}
agHubHTML = (orig => function(){ const h = orig.apply(this, arguments); return h.replace(/<\/div>\s*$/, agWorkHTML() + '</div>'); })(agHubHTML);

/* ---------- the live run ---------- */
function agPacket(i, back, cls){
  const svg = document.querySelector('#agRoot .agn svg.ag-hub-svg'); if (!svg || !svg.querySelector('#agl' + i)) return;
  const NS = 'http://www.w3.org/2000/svg', c = document.createElementNS(NS, 'circle'), m = document.createElementNS(NS, 'animateMotion'), mp = document.createElementNS(NS, 'mpath');
  c.setAttribute('r', back ? '5.5' : '4.5'); c.setAttribute('class', 'agn-pkt ' + (back ? 'back ' : '') + (cls || ''));
  m.setAttribute('dur', '.75s'); m.setAttribute('begin', 'indefinite'); m.setAttribute('fill', 'freeze'); m.setAttribute('calcMode', 'linear');
  if (back){ m.setAttribute('keyPoints', '1;0'); m.setAttribute('keyTimes', '0;1'); }
  mp.setAttribute('href', '#agl' + i); m.appendChild(mp); c.appendChild(m);
  svg.insertBefore(c, svg.querySelector('g.node')); try { m.beginElement(); } catch(e){}
  setTimeout(() => c.remove(), 800);
}
function agwStop(){ AGW.timers.forEach(clearTimeout); AGW.timers = []; AGW.play = false; document.querySelectorAll('#agRoot .agn-busy').forEach(n => n.classList.remove('agn-busy')); }
function agwAt(ms, fn){ AGW.timers.push(setTimeout(() => { if (!document.getElementById('agwFeed')){ agwStop(); return; } fn(); }, ms)); }
function agwPush(id, line){
  AGW.lines.push([id, line]); AGW.lines = AGW.lines.slice(-80);
  const f = document.getElementById('agwFeed'); if (!f) return;
  f.insertAdjacentHTML('beforeend', agLineHTML(id, line, true)); f.scrollTop = f.scrollHeight;
}
function agwHead(){ const w = document.getElementById('agwWhen'); if (w) w.textContent = `${AGW.step} of ${AGW.of}`; }
function agwButtons(){ const b = document.querySelector('#agRoot [data-ag-watch]'); if (b){ b.textContent = AGW.play ? 'Skip to the end' : 'Watch them work'; b.setAttribute('aria-pressed', String(AGW.play)); } const h = document.querySelector('#agRoot .agw-card header b'); if (h) h.textContent = AGW.play ? 'Live run' : 'Last live run';
  const acts = document.querySelector('#agRoot .agw-acts'), cl = acts && acts.querySelector('[data-ag-wclear]');
  if (acts && !AGW.play && AGW.lines.length && !cl) acts.insertAdjacentHTML('beforeend', '<button class="agw-clear" data-ag-wclear>Show the selected agent</button>'); else if (cl && AGW.play) cl.remove(); }

function agWatch(){
  if (AGW.play){ // skip: finish instantly with the full real log
    agwStop(); AGW.lines = []; AGENTS.filter(a => a.id !== 'chief' && agOn(a.id)).concat(AGENTS[0]).forEach(a => agTrace(a.id).forEach(l => AGW.lines.push([a.id, l])));
    agRedraw(); return;
  }
  agentsRun(); agLog('chief', 'You watched every agent work.'); save();
  const team = AGENTS.filter(a => a.id !== 'chief' && agOn(a.id)), idx = id => AGENTS.filter(a => a.id !== 'chief').findIndex(a => a.id === id);
  AGW.lines = []; AGW.play = true; AGW.step = 0; AGW.of = team.length + 1;
  const f = document.getElementById('agwFeed'); if (f) f.innerHTML = '';
  agwButtons(); agwHead();
  if (motionOff()){ team.concat(AGENTS[0]).forEach(a => agTrace(a.id).forEach(l => agwPush(a.id, l))); AGW.step = AGW.of; AGW.play = false; agwButtons(); agwHead(); return; }
  let t = 200;
  team.forEach(a => {
    const i = idx(a.id), tr = agTrace(a.id).slice(0, 7), node = () => document.querySelector(`#agRoot .agn g.node[data-ag-sel="${a.id}"]`);
    agwAt(t, () => { AGW.step++; agwHead(); node()?.classList.add('agn-busy'); agPacket(i, false); });
    t += 700;
    tr.forEach((l, j) => { agwAt(t + j * 210, () => agwPush(a.id, l)); });
    t += tr.length * 210 + 150;
    const st = (tr[tr.length - 1] || [])[2] || 'ok';
    agwAt(t, () => { agPacket(i, true, st); });
    t += 650;
    agwAt(t, () => { node()?.classList.remove('agn-busy'); });
  });
  // the chief of staff collects every result
  agwAt(t, () => { AGW.step++; agwHead(); team.forEach(a => agPacket(idx(a.id), true, 'gather')); document.querySelector('#agRoot .agn g.core')?.classList.add('agn-busy'); });
  t += 800;
  agTrace('chief').slice(0, 8).forEach((l, j) => agwAt(t + j * 220, () => agwPush('chief', l)));
  t += 8 * 220 + 200;
  agwAt(t, () => { document.querySelector('#agRoot .agn g.core')?.classList.remove('agn-busy'); AGW.play = false; AGW.timers = []; agwButtons(); const w = document.getElementById('agwWhen'); if (w) w.textContent = 'just now'; });
}

document.addEventListener('click', e => {
  const b = e.target.closest('#agRoot [data-ag-watch], #agRoot [data-ag-wclear]'); if (!b) return; e.stopPropagation();
  if (b.hasAttribute('data-ag-wclear')){ AGW.lines = []; agRedraw(); return; }
  agWatch();
});
/* a re-render (selecting an agent, switching page) ends a run cleanly */
renderAgents = (orig => function(){ if (AGW.play) agwStop(); return orig.apply(this, arguments); })(renderAgents);
