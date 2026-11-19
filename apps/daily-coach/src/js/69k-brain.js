/* ============================================================
   BRAIN (19 Nov 2026, from the user's "second brain" video: one map,
   three lanes around it, one topic per file, and every answer comes from
   the file the map points to, named, or an honest "never stored").
   - Lanes: notes (facts, engineering), people (contacts), projects (what
     is shipping). Pinned to the map: memory, lessons, decision log.
   - Library: his knowledge packs and the engineering glossary, read-only,
     so the brain can answer from day one.
   - Ask: local search only. The answer quotes the best file and names it
     (lane/slug.md). Nothing matched: "Never stored." with "Add it".
     "Ask Claude about this note" sends only that one file (daily limit).
   - Data: state.brain (synced with everything else). Export = one .md.
   ============================================================ */
const BR_LANES = [
  ['notes', 'Notes', 'facts, how things work, what you learned', 'book'],
  ['people', 'People', 'contacts: who, where you met, what next', 'target'],
  ['projects', 'Projects', 'what you are building or chasing, and its next step', 'bolt'],
  ['memory', 'Memory', 'things about you that should never be forgotten', 'lock'],
  ['lessons', 'Lessons', 'mistakes and what you do differently now', 'flame'],
  ['decisions', 'Decisions', 'what you decided, when, and why', 'check'],
  ['library', 'Library', 'your knowledge packs and engineering words (read-only)', 'gears']
];
const BR_FIELDS = { people: [['role', 'Role'], ['org', 'Company'], ['where', 'Where you met'], ['next', 'Next step']], projects: [['status', 'Status'], ['next', 'Next step'], ['due', 'Due']] };
const BR = { lane: 'notes', edit: null, q: '', res: null, step: -1, del: '' };
const brSlug = t => String(t || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'untitled';
const BR_STOP = new Set('a an the and or of to in on at for with is are was were be been it this that what who when where why how do does did i me my you your we our about from by as can could should would will just any some there their them his her has have had which into than then so if not no yes please tell show give find'.split(' '));
const brStem = w => w.replace(/(ings?|edly|ed|ly|es|s)$/,'');
const BR_SYN = { met: 'meet', meeting: 'meet', bought: 'buy', paid: 'pay', spent: 'spend', chose: 'choose', decided: 'decide', learnt: 'learn', learned: 'learn' };
const brTok = s => String(s || '').toLowerCase().replace(/[^a-z0-9£ ]+/g, ' ').split(/\s+/).filter(w => w.length > 1 && !BR_STOP.has(w)).map(w => BR_SYN[w] || w).map(brStem);

function brState(){ if (!state.brain || typeof state.brain !== 'object') state.brain = {}; BR_LANES.forEach(([id]) => { if (id !== 'library' && !Array.isArray(state.brain[id])) state.brain[id] = []; }); if (!state.brain.seeded){ brSeed(); } return state.brain; }
function brSeed(){
  const b = state.brain, now = Date.now(), s = state.settings || {}, p = state.profile || {}, mk = (t, body, extra = {}) => ({ id: 'b' + Math.random().toString(36).slice(2, 9), slug: brSlug(t), title: t, body, at: now, ...extra });
  b.memory.push(mk('My goals this year', `Save ${money0(+s.goal || 25000)} in a year. IELTS Academic band ${s.ieltsTarget || 7}. Get into a manufacturing or design engineering role and build the practical side of the job.`));
  if (p.degree) b.memory.push(mk('My degree', String(p.degree)));
  b.projects.push(mk('Daily Coach app', 'My own app that runs my day: training, English, engineering, money and agents.', { status: 'Building', next: 'Use it every day and log honestly' }));
  b.projects.push(mk('IELTS band 7', 'Writing, speaking and vocabulary practice in Learn.', { status: 'In progress', next: s.examDate ? `Exam on ${s.examDate}` : 'Book the exam date' }));
  b.decisions.push(mk('Keep my data private', 'My data stays in my browser and my own private cloud copy. Never put ID documents or my CV PDF in the app.'));
  b.seeded = 1;
}
function brLibrary(){
  const out = [];
  try { (KNOWLEDGE_PACKS || []).forEach(k => out.push({ id: 'pk-' + k.id, slug: brSlug(k.title), title: k.title, body: (k.points || []).join(' ') + (k.ask ? ' Ask yourself: ' + k.ask : ''), tags: k.tag, lib: 'pack', ref: k.id })); } catch(_){}
  try { (GLOSS || []).forEach(g => out.push({ id: 'gx-' + brSlug(g[0]), slug: brSlug(g[0]), title: g[0], body: `${g[2]} In Burmese: ${g[1]}.`, tags: g[3], lib: 'word' })); } catch(_){}
  return out;
}
function brAll(){ const b = brState(), all = []; BR_LANES.forEach(([id]) => { (id === 'library' ? brLibrary() : b[id]).forEach(e => all.push({ ...e, lane: id })); }); return all; }
const brText = e => [e.title, e.title, e.title, e.tags, e.tags, e.body, ...Object.keys(BR_FIELDS[e.lane] ? Object.fromEntries(BR_FIELDS[e.lane]) : {}).map(f => e[f])].filter(Boolean).join(' ');
const brPath = e => `${e.lane}/${e.slug}.md`;

function brAsk(q){
  const qt = [...new Set(brTok(q))]; if (!qt.length) return { q, hits: [], qt };
  const hits = brAll().map(e => { const tt = brTok(e.title), bt = brTok(brText(e)); let sc = 0, hit = 0;
    qt.forEach(w => { const inT = tt.some(x => x === w || (w.length > 3 && x.startsWith(w))), inB = bt.filter(x => x === w || (w.length > 3 && x.startsWith(w))).length; if (inT || inB) hit++; sc += (inT ? 4 : 0) + Math.min(3, inB); });
    sc *= .5 + .5 * hit / qt.length; if (e.lane === 'library') sc *= .85; return { e, sc, hit }; })
    .filter(h => h.sc >= 1.5 && h.hit / qt.length >= .5).sort((a, b) => b.sc - a.sc).slice(0, 3);
  return { q, qt, hits };
}
function brAnswer(h, qt){
  const e = h.e, f = BR_FIELDS[e.lane];
  if (e.lane === 'people') return `${e.title}${e.role ? `, ${e.role}` : ''}${e.org ? ` at ${e.org}` : ''}. ${e.where ? `Met: ${e.where}. ` : ''}${e.next ? `Next: ${e.next}. ` : ''}${e.body || ''}`.trim();
  const sent = String(e.body || '').split(/(?<=[.!?])\s+/).filter(Boolean);
  const best = sent.map(s => ({ s, n: brTok(s).filter(w => qt.includes(w)).length })).filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 2).map(x => x.s);
  const extra = f ? f.map(([k, l]) => e[k] ? `${l}: ${e[k]}.` : '').filter(Boolean).join(' ') : '';
  return ((best.length ? best.join(' ') : sent.slice(0, 2).join(' ')) + (extra ? ' ' + extra : '')).trim() || e.title;
}

/* ---------- the map: a loop of three lanes around one map file (SVG) ---------- */
function brMapSVG(){
  const b = brState(), W = 560, H = 330, cx = W / 2, cy = H / 2, hitId = BR.res && BR.res.hits[0] && BR.res.hits[0].e.id;
  const rings = [['notes', 150, 52, -8], ['people', 205, 88, 6], ['projects', 258, 124, -4]], lib = brLibrary().length;
  const pos = (rx, ry, rot, i, n) => { const a = -Math.PI / 2 + (i + .5) / Math.max(1, n) * Math.PI * 2, r = rot * Math.PI / 180, x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]; };
  let hitXY = null;
  const dots = rings.map(([lane, rx, ry, rot]) => { const es = b[lane].slice(0, 40);
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" class="br-lane ${lane}"/>` + es.map((e, i) => { const [x, y] = pos(rx, ry, rot, i, es.length), on = e.id === hitId; if (on) hitXY = [x, y];
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on ? 6 : 3.6}" class="br-dot ${lane}${on ? ' hit' : ''}" data-br-open="${e.id}"><title>${esc(lane + '/' + e.slug)}.md</title></circle>`; }).join('')
      + `<text x="${(cx + rx * .72).toFixed(0)}" y="${(cy - ry - 6).toFixed(0)}" class="br-ll">${lane} · ${b[lane].length}</text>`; }).join('');
  const pins = [['memory', -78], ['lessons', 0], ['decisions', 78]].map(([l, dx]) => `<g class="br-pin" data-br-lane="${l}"><rect x="${cx + dx - 34}" y="${cy + 26}" width="68" height="18" rx="9"/><text x="${cx + dx}" y="${cy + 38.5}">${l} ${b[l].length}</text></g>`).join('');
  const path = hitXY ? `<path id="brPath" d="M${cx} ${cy} Q${((cx + hitXY[0]) / 2).toFixed(0)} ${(Math.min(cy, hitXY[1]) - 40).toFixed(0)} ${hitXY[0].toFixed(1)} ${hitXY[1].toFixed(1)}" class="br-route"/>${motionOff() ? '' : `<circle r="4" class="br-pulse"><animateMotion dur="1.4s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#brPath"/></animateMotion></circle>`}` : '';
  return `<svg viewBox="0 0 ${W} ${H}" class="br-map" role="img" aria-label="Your brain: one map with notes, people and projects around it">
    <ellipse cx="${cx}" cy="${cy}" rx="272" ry="150" class="br-libring"/><text x="${cx}" y="${cy + 146}" class="br-ll lib">library · ${lib} files, read-only</text>
    ${dots}${path}<g class="br-core" data-br-lane="map"><rect x="${cx - 46}" y="${cy - 16}" width="92" height="32" rx="16"/><text x="${cx}" y="${cy + 5}">map.md</text></g>${pins}</svg>`;
}
const BR_STEPS = ['Load map', 'Parse', 'Locate', 'Open', 'Cited'];
function brResHTML(){
  const r = BR.res; if (!r) return `<p class="br-hint">Ask anything you have saved: “who did I meet at the interview?”, “what is mould shrinkage?”, “why did I pick this budget?”</p>`;
  const steps = BR_STEPS.map((s, i) => { const done = BR.step < 0 || i <= BR.step, last = i === 4; return `<span class="br-st ${done ? 'on' : ''}${last && !r.hits.length && done ? ' miss' : ''}">${last && !r.hits.length ? 'Not found' : s}</span>`; }).join('<i></i>');
  if (BR.step >= 0 && BR.step < 4) return `<div class="br-steps">${steps}</div>`;
  if (!r.hits.length) return `<div class="br-steps">${steps}</div><div class="br-ans miss"><b>Never stored.</b><p>Nothing in your map answers “${esc(r.q)}”. I won’t guess.</p><button class="btn btn-deep sm" data-br-new="notes" data-br-title="${esc(r.q.slice(0, 60))}">Add it as a note</button></div>`;
  const h = r.hits[0], e = h.e;
  return `<div class="br-steps">${steps}</div><div class="br-ans"><p>${esc(brAnswer(h, r.qt))}</p>
    <div class="br-cite"><button class="br-file" data-br-open="${e.id}">${ic(BR_LANES.find(l => l[0] === e.lane)[3], 13)} ${esc(brPath(e))}</button>${e.lib === 'pack' ? '<span>from your knowledge packs</span>' : e.lib === 'word' ? '<span>from your engineering words</span>' : ''}</div>
    ${r.hits.length > 1 ? `<div class="br-also">Also: ${r.hits.slice(1).map(x => `<button class="br-file sm" data-br-open="${x.e.id}">${esc(brPath(x.e))}</button>`).join(' ')}</div>` : ''}
    <button class="btn btn-soft sm" data-br-claude="${e.id}">Ask Claude about this note only</button></div>`;
}
function brEditHTML(){
  const ed = BR.edit; if (!ed) return '';
  const e = ed.id ? brAll().find(x => x.id === ed.id) : { lane: ed.lane, title: ed.title || '', body: '' }, ro = e.lane === 'library', f = BR_FIELDS[e.lane] || [];
  return `<div class="br-ed" role="dialog" aria-label="${ro ? 'Library file' : 'Edit file'}"><div class="br-edh"><b>${esc(e.lane)}/${esc(brSlug(e.title) || 'new-file')}.md</b><button class="br-x" data-br-close aria-label="Close">${ic('x', 16)}</button></div>
    ${ro ? `<h4>${esc(e.title)}</h4><p class="br-ro">${esc(e.body)}</p>${e.lib === 'pack' ? `<button class="btn btn-soft sm" data-a="go" data-go="learn">Open in Learn</button>` : ''}`
      : `<label>Title<input id="brT" maxlength="80" value="${esc(e.title)}" placeholder="${e.lane === 'people' ? 'Full name' : 'One topic, e.g. Mould shrinkage on PP trays'}"></label>
        ${f.map(([k, l]) => `<label>${l}<input id="brF-${k}" maxlength="120" value="${esc(e[k] || '')}"></label>`).join('')}
        <label>${e.lane === 'decisions' ? 'What and why' : 'Text'}<textarea id="brB" rows="6" maxlength="4000" placeholder="Write it the way you would say it to a friend.">${esc(e.body || '')}</textarea></label>
        <label>Tags<input id="brG" maxlength="80" value="${esc(e.tags || '')}" placeholder="e.g. thermoforming, quality"></label>
        <div class="br-edf"><button class="btn btn-deep" data-br-save="${esc(ed.id || '')}" data-br-lane2="${e.lane}">Save</button>${ed.id ? `<button class="btn btn-soft" data-br-del="${ed.id}">${BR.del === ed.id ? 'Tap again to delete' : 'Delete'}</button>` : ''}</div>`}</div>`;
}
function renderBrain(){
  const b = brState(), lane = BR.lane, list = lane === 'library' ? brLibrary() : b[lane].slice().sort((x, y) => y.at - x.at), total = BR_LANES.slice(0, 6).reduce((a, [id]) => a + b[id].length, 0);
  const mapMd = `# map.md · what lives where\n${BR_LANES.map(([id, n, d]) => `${id}/  ${n.toLowerCase()}: ${d} (${id === 'library' ? brLibrary().length : b[id].length})`).join('\n')}\nRule: answer only from the file this map points to, and name it. Never stored? Say so.`;
  return `<div class="br" id="brRoot">
    <header class="br-top"><div><small>${total} files · one map · nothing invented</small><h2>Brain</h2><p>Every answer comes from one of your files, named, or it says “never stored”.</p></div>
      <div class="br-acts"><button class="btn btn-soft sm" data-br-export>${ic('download', 14)} Download as Markdown</button></div></header>
    <form class="br-ask" data-br-ask><input id="brQ" value="${esc(BR.q)}" placeholder="Ask your brain…" aria-label="Ask your brain" autocomplete="off"><button class="btn btn-deep" type="submit">Ask</button></form>
    <div class="br-res" id="brRes" aria-live="polite">${brResHTML()}</div>
    <div class="br-grid"><section class="br-mapw">${brMapSVG()}<pre class="br-md">${esc(mapMd)}</pre></section>
      <section class="br-files"><div class="br-tabs" role="tablist">${BR_LANES.map(([id, n, , icn]) => `<button role="tab" aria-selected="${lane === id}" class="${lane === id ? 'on' : ''}" data-br-lane="${id}">${ic(icn, 13)} ${n} <em>${id === 'library' ? brLibrary().length : b[id].length}</em></button>`).join('')}</div>
        <p class="br-ld">${esc(BR_LANES.find(l => l[0] === lane)[2])}</p>
        ${lane !== 'library' ? `<button class="br-add" data-br-new="${lane}">${ic('plus', 14)} New ${lane === 'people' ? 'person' : lane.replace(/s$/, '')}</button>` : ''}
        <ul class="br-list">${list.slice(0, lane === 'library' ? 60 : 200).map(e => `<li><button data-br-open="${e.id}"><b>${esc(e.title)}</b><small>${esc(lane)}/${esc(e.slug)}.md${e.at ? ' · ' + new Date(e.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</small><span>${esc(String(e.lane === 'people' ? [e.role, e.org].filter(Boolean).join(' at ') || e.body || '' : e.body || '').slice(0, 110))}</span></button></li>`).join('') || `<li class="br-empty">Nothing here yet. One topic per file: small and easy to find.</li>`}</ul></section></div>
    ${brEditHTML()}</div>`;
}

function brRun(q){
  BR.q = q; BR.res = brAsk(q); BR.edit = null;
  const out = document.getElementById('brRes'), paint = () => { const o = document.getElementById('brRes'); if (o) o.innerHTML = brResHTML(); };
  if (motionOff() || !out){ BR.step = -1; renderView('brain'); return; }
  BR.step = 0; paint(); let i = 0; const t = setInterval(() => { i++; BR.step = i; paint(); if (i >= 4){ clearInterval(t); BR.step = -1; renderView('brain'); const qi = document.getElementById('brQ'); } }, 260);
}
function brSave(id, lane){
  const b = brState(), v = s => (document.getElementById(s) || {}).value || '', title = v('brT').trim();
  if (!title){ toast('Give it a title: one topic per file.', 'warn', 1800); return; }
  const rec = id ? b[lane].find(e => e.id === id) : { id: 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) };
  Object.assign(rec, { title, slug: brSlug(title), body: v('brB').trim(), tags: v('brG').trim(), at: Date.now() });
  (BR_FIELDS[lane] || []).forEach(([k]) => { rec[k] = v('brF-' + k).trim(); });
  if (!id) b[lane].push(rec);
  const dup = b[lane].filter(e => e.slug === rec.slug && e.id !== rec.id).length; if (dup) rec.slug += '-' + (dup + 1);
  BR.edit = null; BR.lane = lane; save(); renderView('brain'); toast(`Saved as ${lane}/${rec.slug}.md`, 'ok', 1800);
}
async function brClaude(id){
  const e = brAll().find(x => x.id === id); if (!e) return;
  aiOpen('chat');
  const prompt = `Answer my question using ONLY this one file from my notes. Cite it as ${brPath(e)}. If the file does not answer it, say "Never stored." and nothing else.\n\nQuestion: ${BR.q}\n\n--- ${brPath(e)} ---\n${e.title}\n${brText(e).slice(0, 2500)}`;
  try { await aiSend(prompt); } catch(_){}
}

document.addEventListener('submit', ev => { const f = ev.target.closest('[data-br-ask]'); if (!f) return; ev.preventDefault(); const q = (document.getElementById('brQ') || {}).value || ''; if (q.trim()) brRun(q.trim()); }, true);
document.addEventListener('click', ev => {
  const t = ev.target.closest('#brRoot [data-br-lane], #brRoot [data-br-open], #brRoot [data-br-new], #brRoot [data-br-close], #brRoot [data-br-save], #brRoot [data-br-del], #brRoot [data-br-export], #brRoot [data-br-claude]'); if (!t) return;
  ev.stopPropagation(); state._lastEdit = Date.now();
  if (t.dataset.brLane){ if (t.dataset.brLane !== 'map'){ BR.lane = t.dataset.brLane; BR.edit = null; } renderView('brain'); return; }
  if (t.dataset.brOpen){ const e = brAll().find(x => x.id === t.dataset.brOpen); if (e){ BR.lane = e.lane; BR.edit = { id: e.id }; BR.del = ''; renderView('brain'); setTimeout(() => document.querySelector('#brRoot .br-ed')?.scrollIntoView({ block: 'nearest', behavior: motionOff() ? 'auto' : 'smooth' }), 30); } return; }
  if (t.dataset.brNew){ BR.lane = t.dataset.brNew; BR.edit = { lane: t.dataset.brNew, title: t.dataset.brTitle || '' }; renderView('brain'); setTimeout(() => document.getElementById('brT')?.focus(), 30); return; }
  if (t.hasAttribute('data-br-close')){ BR.edit = null; renderView('brain'); return; }
  if (t.hasAttribute('data-br-save')){ brSave(t.dataset.brSave, t.dataset.brLane2); return; }
  if (t.dataset.brDel){ if (BR.del !== t.dataset.brDel){ BR.del = t.dataset.brDel; renderView('brain'); return; } const b = brState(); BR_LANES.forEach(([l]) => { if (Array.isArray(b[l])) b[l] = b[l].filter(e => e.id !== t.dataset.brDel); }); BR.edit = null; BR.del = ''; save(); renderView('brain'); toast('Deleted.', 'ok', 1400); return; }
  if (t.hasAttribute('data-br-export')){ const b = brState(), md = ['# My brain · exported ' + dkey(), '', ...BR_LANES.slice(0, 6).flatMap(([l]) => b[l].map(e => `## ${l}/${e.slug}.md\n# ${e.title}\n${(BR_FIELDS[l] || []).map(([k, n]) => e[k] ? `- ${n}: ${e[k]}` : '').filter(Boolean).join('\n')}\n${e.body || ''}${e.tags ? `\n\nTags: ${e.tags}` : ''}\n`))].join('\n'); dcSave(`brain-${dkey()}.md`, md, 'Brain'); return; }
  if (t.dataset.brClaude){ brClaude(t.dataset.brClaude); return; }
}, true);

/* register the tab */
if (typeof TABS !== 'undefined' && !TABS.find(t => t.id === 'brain')) TABS.push({ id: 'brain', name: 'Brain', icon: 'book', title: 'Brain', sub: 'One map of your notes, people and projects. Answers name their file, or say never stored.' });
renderView = (orig => function(tab){
  if (tab !== 'brain') return orig.apply(this, arguments);
  const el = document.getElementById('view-brain'); if (el){ el.innerHTML = renderBrain(); try { if (typeof glassWatch === 'function') glassWatch(el); } catch(_){} }
})(renderView);
