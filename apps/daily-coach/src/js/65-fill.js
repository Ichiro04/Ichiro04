/* ============================================================
   FILL · no empty space beside a short column (desktop)
   After a tab renders, every pair of side-by-side columns is
   1) balanced: sections (a heading and what follows it) are
      shared between the two columns in their reading order so
      both end at about the same height, then
   2) filled: if one column is still clearly shorter, useful
      cards for that tab (schedule, status, quick actions, tips,
      calendar, countdown…) are added to it until it lines up.
   Runs again on resize. Phones (one column) are left alone.
   ============================================================ */
const FILL = { t:0, busy:false };
const FILL_MIN = 100;               // gaps smaller than this are fine
const fillOn = () => window.innerWidth >= 900;

function fillUnits(cols){ // [[el,...], ...] groups in reading order; a .h2 starts a new group
  const units = [];
  cols.forEach(c => [...c.children].forEach(el => {
    if (el.classList.contains('fill-card')) { el.remove(); return; }
    if (el.classList.contains('h2') || !units.length || !units[units.length-1].open) units.push({ els:[el], open: el.classList.contains('h2') });
    else { units[units.length-1].els.push(el); units[units.length-1].open = false; }
  }));
  return units;
}
const outerH = el => { const cs = getComputedStyle(el); return el.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0); };
function fillBalance(a, b){
  const units = fillUnits([a, b]); if (units.length < 2) return;
  const hs = units.map(u => u.els.reduce((s, e) => s + outerH(e), 0)), tot = hs.reduce((s, h) => s + h, 0);
  let best = 1, bestD = Infinity, run = 0;
  for (let k = 1; k < units.length; k++){ run += hs[k-1]; const d = Math.abs(run - (tot - run)); if (d < bestD){ bestD = d; best = k; } }
  units.forEach((u, i) => u.els.forEach(e => (i < best ? a : b).appendChild(e)));
}
/* cards that can fill a gap, best first for each tab */
function fillPool(tab){
  const has = s => document.querySelector(`#view-${tab} ${s}`);
  const tips = (n) => { try { const t = apTips().slice(n, n + 3); return t.length ? `<section class="glass xs-card"><div class="xs-h"><b>Tips from your numbers</b><small>worked out from your own logs</small></div>${t.map(x => `<div class="fl-tip"><span class="ds-it">${ic(x.icon, 15)}</span><p>${esc(x.t)}</p></div>`).join('')}</section>` : ''; } catch(_){ return ''; } };
  const plan = () => { try { const k = dkey(), it = apPlan().items.slice(0, 8); return `<section class="glass xs-card"><div class="xs-h"><b>Today’s plan</b><small>${it.filter(i => apItemDone(k, i)).length} of ${apPlan().items.length} done · full list on Coach</small></div><ul class="fl-plan">${it.map(i => `<li class="${apItemDone(k, i) ? 'on' : ''}"><span class="num">${esc(i.time || '')}</span>${esc(i.t)}</li>`).join('')}</ul><button class="lay-btn" data-xs="go" data-go="coach">${ic('arrowRight', 14)} Open the coach</button></section>`; } catch(_){ return ''; } };
  const orbit = () => typeof kmLauncherHTML === 'function' && !has('.km-launch') ? kmLauncherHTML() : '';
  const exam = () => typeof examCountHTML === 'function' && !has('.ex-cd') ? examCountHTML('review') : '';
  const quote = () => typeof quoteHTML === 'function' && !has('.qt, .mv') ? quoteHTML() : '';
  const wheel = () => typeof wheelHTML === 'function' && !has('.wh') ? wheelHTML() : '';
  const cal = () => typeof calHTML === 'function' && !has('.cal') ? calHTML() : '';
  const sched = () => typeof schedHTML === 'function' && !has('.sch') ? schedHTML() : '';
  const status = () => typeof statusHTML === 'function' && !has('.stt') ? statusHTML() : '';
  const quick = () => typeof quickHTML === 'function' && !has('.qa') ? quickHTML() : '';
  const due = () => typeof ciCardHTML === 'function' && !has('.ci-card') ? ciCardHTML('2w') : '';
  const week = () => typeof apWeekHTML === 'function' && !has('.cp-week') ? apWeekHTML() : '';
  const doy = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  const small = (title, sub, body) => `<section class="glass xs-card fl-small"><div class="xs-h"><b>${title}</b><small>${sub}</small></div>${body}</section>`;
  const word = () => { if (typeof WORDS === 'undefined') return ''; const w = WORDS[doy % WORDS.length]; return small('Word of the day', 'Use it in a sentence today', `<p class="fl-big">${esc(w.w)}</p><p class="tiny">${esc(w.d)}</p><p class="fl-ex">“${esc(w.ex)}”</p>`); };
  const word2 = () => { if (typeof WORDS === 'undefined') return ''; const w = WORDS[(doy + 7) % WORDS.length]; return small('One more word', 'For speaking practice', `<p class="fl-big">${esc(w.w)}</p><p class="tiny">${esc(w.d)}</p>`); };
  const iq = () => { if (typeof QUESTION_BANK === 'undefined') return ''; const q = QUESTION_BANK[doy % QUESTION_BANK.length]; return small('Interview question', 'Say your answer out loud in 60 seconds', `<p class="fl-q">${esc(q.q)}</p><details class="fl-d"><summary>Show a strong answer</summary><p class="tiny">${esc(q.a)}</p></details>`); };
  const cue = () => { try { const s = todaysSession(), b = (s.blocks || [])[doy % Math.max(1, (s.blocks || []).length)]; const e = b && EX[b.ex]; return e ? small('Form cue', `${esc(e.name)} · today’s session`, `<p class="fl-q">${esc(e.cue || '')}</p>`) : ''; } catch(_){ return ''; } };
  const hole = () => { if (typeof KM_HOLES === 'undefined') return ''; const h = KM_HOLES[doy % KM_HOLES.length]; return small('Mistake to avoid', esc(h.n), `<p class="fl-q">${esc(h.tip)}</p>`); };
  const mile = () => { try { const sv = savedTotal(), m = milestoneList.find(x => x.v > sv); return m ? small('Next milestone', `${money0(m.v)} saved`, `<div class="pbar"><i style="width:${Math.min(100, sv / m.v * 100).toFixed(0)}%"></i></div><p class="tiny" style="margin-top:6px">${money0(m.v - sv)} to go · about ${Math.max(1, Math.ceil((m.v - sv) / Math.max(1, feasiblePerMonth())))} month(s) at ${money0(feasiblePerMonth())} a month</p>`) : ''; } catch(_){ return ''; } };
  const smalls = [word, iq, hole, cue, mile, word2];
  const pools = {
    today:   [status, quick, tips.bind(null, 0), exam, due, week, quote, wheel, tips.bind(null, 3), cal],
    train:   [status, plan, week, quick, sched, tips.bind(null, 0), quote, cal],
    learn:   [exam, plan, sched, tips.bind(null, 0), quick, orbit, status, quote, cal, wheel],
    money:   [quick, tips.bind(null, 0), plan, status, due, cal, quote, sched],
    progress:[wheel, due, status, cal, quick, tips.bind(null, 0), quote, sched],
    review:  [status, quick, plan, tips.bind(null, 0), week, orbit, tips.bind(null, 3), sched],
    coach:   [cal, wheel, due, exam, quote, orbit, tips.bind(null, 4)]
  };
  return [...(pools[tab] || [status, quick, quote]), ...smalls];
}
function fillGap(chooseCol, gapFn, pool, used){
  for (const f of pool){
    if (gapFn() < FILL_MIN) break; if (used.has(f)) continue;
    let html = ''; try { html = f(); } catch(_){} if (!html) { used.add(f); continue; }
    const wrap = document.createElement('div'); wrap.className = 'fill-card'; wrap.innerHTML = html; chooseCol().appendChild(wrap);
    if (gapFn() < -90){ wrap.remove(); continue; }   // too tall: try the next card
    used.add(f);
  }
}
function fillPairs(v){ // side-by-side column pairs inside a view, innermost first
  const pairs = [];
  v.querySelectorAll('.learngrid').forEach(g => {
    if (!g.querySelector(':scope > .lcol') && g.children.length > 1){ const a = document.createElement('div'), b = document.createElement('div'); a.className = 'lcol a'; b.className = 'lcol b'; while (g.firstChild) a.appendChild(g.firstChild); g.append(a, b); }
  });
  const two = (sel) => v.querySelectorAll(sel).forEach(c => { const k = [...c.children].filter(x => !x.classList.contains('fill-card')); if (k.length === 2) pairs.push([k[0], k[1], true]); });
  two('.learngrid'); two('.grid2.gap');
  if (v.querySelector(':scope > .tcol.a, :scope > .xl-main > .tcol.a')){ const p = v.querySelector('.tcol.a').parentNode; pairs.push([p.querySelector(':scope > .tcol.a'), p.querySelector(':scope > .tcol.b'), true]); }
  if (v.querySelector(':scope > .xl-main')) pairs.push([v.querySelector(':scope > .xl-main'), v.querySelector(':scope > .xl-side'), false]);
  return pairs;
}
const sideBySide = (a, b) => { const r1 = a.getBoundingClientRect(), r2 = b.getBoundingClientRect(); return r1.width > 0 && r2.width > 0 && (r1.right <= r2.left + 6 || r2.right <= r1.left + 6); };
/* Coach and Review: sections become real stacked columns (each goes to the shortest column, in order), then the columns are topped up */
const GRID_TABS = { coach: { box:'.cv', top:[], bottom:['chat'] }, review: { box:'.rv', top:['due','exam','pulse'], bottom:[] } };
function columnize(tab, v, pool, used){
  const g = GRID_TABS[tab], box = g && v.querySelector(g.box); if (!box || LAYOUT_EDIT[tab]) return false;
  const w = box.clientWidth, n = w >= 1180 ? 3 : w >= 720 ? 2 : 1; if (n < 2) return false;
  const secs = [...box.querySelectorAll(':scope > .lay-sec')], mid = secs.filter(s => !g.top.includes(s.dataset.sec) && !g.bottom.includes(s.dataset.sec) && s.offsetHeight > 0);
  if (mid.length < 2) return false;
  const wrap = document.createElement('div'); wrap.className = 'gcols'; wrap.style.setProperty('--n', n);
  const cols = Array.from({ length:n }, () => { const c = document.createElement('div'); c.className = 'gcol'; wrap.appendChild(c); return c; });
  mid[0].before(wrap); box.classList.add('columnized');
  mid.forEach(s => cols.reduce((m, c) => c.offsetHeight < m.offsetHeight ? c : m).appendChild(s));
  const bottoms = secs.filter(s => g.bottom.includes(s.dataset.sec)); bottoms.forEach(s => wrap.after(s));
  for (let pass = 0; pass < 2; pass++) cols.forEach(c => { const tall = () => Math.max(...cols.map(x => x.offsetHeight)); fillGap(() => c, () => tall() - c.offsetHeight, pool, used); });
  return true;
}
function fillView(tab){
  const v = document.getElementById('view-' + tab); if (!v || v.hidden || FILL.busy) return;
  FILL.busy = true;
  try {
    v.querySelectorAll('.fill-card').forEach(x => x.remove());
    if (!fillOn()) return;
    if (GRID_TABS[tab]){ if (!v.querySelector('.gcols')) columnize(tab, v, fillPool(tab), new Set()); return; }
    const used = new Set(), pool = fillPool(tab), pairs = fillPairs(v);
    for (let pass = 0; pass < 3; pass++) for (const [a, b, balance] of pairs){   // adding to one pair can open a gap in another, so go round again
      if (!a || !b || !sideBySide(a, b)) continue;
      if (balance && pass === 0) fillBalance(a, b);
      const isOuter = a.classList.contains('xl-main');
      if (isOuter){
        const main = a, side = b, inner = [...main.querySelectorAll(':scope > .tcol, :scope > .learnwrap .learngrid > .lcol, :scope > .grid2 > div')].filter(x => x.offsetHeight > 0);
        if (main.offsetHeight < side.offsetHeight){
          const pick = () => inner.length >= 2 ? inner.reduce((m, c) => c.offsetHeight < m.offsetHeight ? c : m) : main;
          fillGap(pick, () => side.offsetHeight - main.offsetHeight, pool, used);
        } else fillGap(() => side, () => main.offsetHeight - side.offsetHeight, pool, used);
      } else {
        const s0 = a.offsetHeight <= b.offsetHeight ? a : b, t0 = s0 === a ? b : a;
        fillGap(() => s0, () => t0.offsetHeight - s0.offsetHeight, pool, used);
      }
    }
    if (typeof glassWatch === 'function') glassWatch(v);
  } finally { FILL.busy = false; }
}
renderView = (orig => function(tab){
  const r = orig.apply(this, arguments);
  cancelAnimationFrame(FILL.raf); FILL.raf = requestAnimationFrame(() => setTimeout(() => fillView(tab), 40));
  return r;
})(renderView);
window.addEventListener('resize', () => { clearTimeout(FILL.t); FILL.t = setTimeout(() => { try { if (GRID_TABS[activeTab] && !document.activeElement?.matches('input,textarea')) renderView(activeTab); else fillView(activeTab); } catch(_){} }, 260); });
