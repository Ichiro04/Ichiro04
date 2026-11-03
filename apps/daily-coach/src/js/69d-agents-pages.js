/* ============================================================
   AGENTS · pages (3 Nov 2026, user: "build like this but change theme",
   reference: a two-screen control platform with an angled title plate,
   page tabs, gold figures, ranked bars, a 3D centre piece, trend charts
   with a dashed forecast, and an alert screen with a beacon).
   Pages: Overview · Alerts · Team (the first version). Themes:
   Crimson (default, the app's palette), Teal (the reference), Blue.
   ============================================================ */
const AG_PAGES = [['overview', 'Overview'], ['alerts', 'Alerts'], ['team', 'Team']];
const AG_THEMES = [['crimson', 'Crimson'], ['teal', 'Teal'], ['blue', 'Blue']];
const AG_AREAS = [['all', 'All', null], ['English', 'English', ['English']], ['Engineering', 'Engineering', ['Engineering']], ['Career', 'Career', ['Career']], ['Training', 'Training', ['Training', 'Walking']], ['Routine', 'Routine', ['Routine']]];
const AGP = { trend: 'all', weeks: 'all' };
const agPage = () => state.agPage || 'overview';
const agTheme = () => state.agTheme || 'crimson';

/* ---------- numbers from the day plan (works for past days too) ---------- */
function agDay(k, cats){ const B = dayBlocks(k).filter(b => !b.skip && (!cats || cats.includes(b.cat))); let n = 0, min = 0; B.forEach(b => { if (blockStatus(k, b) === 'done'){ n++; min += b.dur; } }); return { n, of: B.length, min }; }
function agSum(from, days, cats){ let n = 0, of = 0, min = 0; for (let i = 0; i < days; i++){ const d = agDay(dkey(addDays(from, i)), cats); n += d.n; of += d.of; min += d.min; } return { n, of, min }; }
const agCats = id => (AG_AREAS.find(a => a[0] === id) || AG_AREAS[0])[2];
const agFmt = n => Math.round(n).toLocaleString('en-GB');
function agCmp(now, before){ const d = now - before; return `<em class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? '▲' : d < 0 ? '▼' : '■'} ${agFmt(Math.abs(d))}</em>`; }

/* ---------- shared pieces ---------- */
const agSec = (title, side, body, cls = '') => `<section class="agx-p ${cls}"><header class="agx-h"><b>${title}</b>${side ? `<span>${side}</span>` : ''}</header>${body}</section>`;
function agChips(key, cur){ return `<div class="agx-chips" role="tablist">${AG_AREAS.map(([id, l]) => `<button role="tab" aria-selected="${cur === id}" class="${cur === id ? 'on' : ''}" data-agf="${key}:${id}">${l}</button>`).join('')}</div>`; }
function agArea(vals, opts = {}){
  const W = opts.w || 520, H = opts.h || 150, n = vals.length, mx = Math.max(opts.max || 0, ...vals.map(v => v == null ? 0 : v), 1), cut = opts.cut == null ? n : opts.cut;
  const x = i => n <= 1 ? W / 2 : i / (n - 1) * (W - 34) + 30, y = v => H - 22 - v / mx * (H - 34), id = 'ag' + Math.random().toString(36).slice(2, 7);
  const sm = pts => pts.map((p, i) => i ? ` C ${(pts[i - 1][0] + p[0]) / 2} ${pts[i - 1][1]}, ${(pts[i - 1][0] + p[0]) / 2} ${p[1]}, ${p[0]} ${p[1]}` : `M ${p[0]} ${p[1]}`).join('');
  const past = vals.slice(0, cut).map((v, i) => [x(i), y(v || 0)]), fut = vals.slice(cut - 1).map((v, i) => [x(i + cut - 1), y(v || 0)]);
  const grid = [0, .25, .5, .75, 1].map(f => `<line x1="30" x2="${W - 4}" y1="${y(mx * f)}" y2="${y(mx * f)}" class="g"/><text x="24" y="${y(mx * f) + 3}" class="yl">${Math.round(mx * f)}${opts.unit || ''}</text>`).join('');
  const labs = (opts.labels || []).map((l, i) => l ? `<text x="${x(i)}" y="${H - 6}" class="xl${i === cut - 1 ? ' now' : ''}">${l}</text>` : '').join('');
  const base = opts.base != null ? `<line x1="30" x2="${W - 4}" y1="${y(opts.base)}" y2="${y(opts.base)}" class="budget"/><text x="${W - 6}" y="${y(opts.base) - 5}" class="bl">${esc(opts.baseLabel || '')}</text>` : '';
  return `<svg class="agx-area" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(opts.label || 'trend')}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--ag-gold);stop-opacity:.42"/><stop offset="1" style="stop-color:var(--ag-gold);stop-opacity:0"/></linearGradient></defs>
    ${grid}${base}${cut < n ? `<rect x="${x(cut - 1)}" y="8" width="${W - 4 - x(cut - 1)}" height="${H - 30}" class="fut-bg"/>` : ''}
    ${past.length > 1 ? `<path d="${sm(past)} L ${past[past.length - 1][0]} ${H - 22} L ${past[0][0]} ${H - 22} Z" fill="url(#${id})"/><path d="${sm(past)}" class="ln"/>` : ''}
    ${fut.length > 1 ? `<path d="${sm(fut)}" class="ln dash"/>` : ''}${past.length ? `<circle cx="${past[past.length - 1][0]}" cy="${past[past.length - 1][1]}" r="4" class="dot"/>` : ''}${labs}</svg>`;
}
function agBars(vals, labels, opts = {}){
  const W = opts.w || 420, H = opts.h || 150, n = vals.length, mx = Math.max(1, ...vals), bw = Math.min(26, (W - 40) / n * .45), y = v => H - 22 - v / mx * (H - 36);
  return `<svg class="agx-bars" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(opts.label || 'bars')}">
    ${[0, .5, 1].map(f => `<line x1="30" x2="${W - 4}" y1="${y(mx * f)}" y2="${y(mx * f)}" class="g"/><text x="24" y="${y(mx * f) + 3}" class="yl">${Math.round(mx * f)}</text>`).join('')}
    ${vals.map((v, i) => { const cx = 30 + (i + .5) * (W - 34) / n; return `<rect x="${cx - bw / 2}" y="${y(v)}" width="${bw}" height="${H - 22 - y(v)}" class="bar${i === n - 1 ? ' cur' : ''}" rx="2"/><rect x="${cx - bw / 2}" y="${y(v) - 3}" width="${bw}" height="3" class="cap"/><text x="${cx}" y="${y(v) - 7}" class="bv">${v}</text><text x="${cx}" y="${H - 6}" class="xl">${esc(labels[i])}</text>`; }).join('')}</svg>`;
}
function agDonut(parts, size = 132){
  const tot = parts.reduce((s, p) => s + p[1], 0) || 1, r = size / 2 - 14, c = 2 * Math.PI * r; let off = 0;
  const top = parts.slice().sort((a, b) => b[1] - a[1])[0] || ['–', 0];
  return `<div class="agx-donut"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="tr"/>
    ${parts.map(([l, v, col]) => { const len = v / tot * c, s = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="seg" style="stroke:${col}" stroke-dasharray="${Math.max(0, len - 2).toFixed(1)} ${c.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>`; off += len; return s; }).join('')}
    <circle cx="${size / 2}" cy="${size / 2}" r="${r - 16}" class="in"/></svg><div class="c"><b class="num">${Math.round(top[1] / tot * 1000) / 10}%</b><small>${esc(top[0])}</small></div></div>`;
}
const AREA_COL = { English:'#B79BFF', Engineering:'#2EE6C5', Career:'#FFC24D', Training:'#FF6B81', Walking:'#FF9AA8', Routine:'#6FA8FF' };

/* ---------- header: angled title plate, page tabs, theme, clock ---------- */
function agHeadHTML(){
  const now = new Date(), p = agPage();
  return `<header class="agx-top">
    <div class="agx-plate"><span class="ag-logo">${ic('robot', 18)}</span><b>Agent control centre</b><i></i></div>
    <nav class="agx-nav" role="tablist" aria-label="Agent pages">${AG_PAGES.map(([id, l]) => `<button role="tab" aria-selected="${p === id}" class="${p === id ? 'on' : ''}" data-agp="${id}">${l}</button>`).join('')}</nav>
    <div class="agx-right"><div class="agx-theme" role="radiogroup" aria-label="Theme">${AG_THEMES.map(([id, l]) => `<button role="radio" aria-checked="${agTheme() === id}" class="t-${id}${agTheme() === id ? ' on' : ''}" data-agt="${id}" title="${l} theme" aria-label="${l} theme"></button>`).join('')}</div>
      <div class="agx-clock"><b class="num" id="agClock">${pad2(now.getHours())}:${pad2(now.getMinutes())}</b><span>${esc(now.toLocaleDateString('en-GB', { weekday: 'long' }))}<br>${esc(now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))}</span></div></div>
  </header>
  <div class="agx-crumb"><button data-agp="overview">${ic('arrowRight', 13)} Home</button><span>${esc((AG_PAGES.find(x => x[0] === p) || [])[1] || '')}</span><em>${p === 'alerts' ? 'what your agents flagged today' : p === 'team' ? 'every agent, its score and what it found' : 'your progress across every area, from your own data'}</em></div>`;
}

/* ---------- the 3D centre piece: an isometric tower with the team around it ---------- */
function agTowerHTML(){
  const W = 640, H = 430, cx = W / 2, cy = 252, S = Math.sin(Math.PI / 6), C = Math.cos(Math.PI / 6);
  const iso = (x, y, z) => [cx + (x - y) * C, cy + (x + y) * S - z];
  const hex = (r, z) => Array.from({ length: 6 }, (_, i) => { const t = Math.PI / 6 + i * Math.PI / 3; return iso(Math.cos(t) * r, Math.sin(t) * r, z); });
  const pts = a => a.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
  const prism = (r, z0, z1, cls) => { const b = hex(r, z0), t = hex(r, z1); let s = ''; for (let i = 0; i < 6; i++){ const j = (i + 1) % 6; s += `<polygon points="${pts([b[i], b[j], t[j], t[i]])}" class="${cls} side s${i}"/>`; } return s + `<polygon points="${pts(t)}" class="${cls} top"/>`; };
  const chief = agResult('chief'), list = AGENTS.filter(a => a.id !== 'chief');
  const tags = list.map((a, i) => { const t = -Math.PI / 2 + (i + .5) / list.length * Math.PI * 2, r = agResult(a.id), on = agOn(a.id);
    const ax = Math.cos(t) * 150, ay = Math.sin(t) * 150, [px, py] = iso(ax, ay, 40), lx = cx + Math.cos(t) * 285, ly = cy - 70 + Math.sin(t) * 150;
    return `<g class="agx-tag ${on ? agStatus(r)[0] : 'off'}" data-ag-sel="${a.id}" data-agp="team" role="button" tabindex="0" aria-label="${esc(a.name)} ${r.score}" style="--c:${AG_COLORS[a.id]}">
      <polyline points="${px.toFixed(1)},${py.toFixed(1)} ${(px + lx) / 2},${ly.toFixed(1)} ${lx.toFixed(1)},${ly.toFixed(1)}" class="lead"/><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5" class="pin"/>
      <rect x="${(lx - 58).toFixed(1)}" y="${(ly - 17).toFixed(1)}" width="116" height="34" rx="4" class="box"/><rect x="${(lx - 58).toFixed(1)}" y="${(ly - 17).toFixed(1)}" width="4" height="34" class="bar"/>
      <text x="${(lx - 46).toFixed(1)}" y="${(ly - 2).toFixed(1)}" class="n">${esc(a.area)}</text><text x="${(lx - 46).toFixed(1)}" y="${(ly + 11).toFixed(1)}" class="s">${on ? esc(agStatus(r)[1]) : 'Paused'}</text><text x="${(lx + 50).toFixed(1)}" y="${(ly + 6).toFixed(1)}" class="v">${on ? r.score : '–'}</text></g>`; }).join('');
  const ring = (r, z, cls) => { const h = hex(r, z); return `<polygon points="${pts(h)}" class="${cls}"/>`; };
  return `<div class="agx-tower"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Your team around you, team score ${chief.score}">
    <defs><radialGradient id="agxGlow"><stop offset="0" style="stop-color:var(--ag-core1);stop-opacity:.9"/><stop offset=".5" style="stop-color:var(--ag-core2);stop-opacity:.35"/><stop offset="1" style="stop-color:var(--ag-core3);stop-opacity:0"/></radialGradient>
      <linearGradient id="agxBeam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--ag-cy);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--ag-cy);stop-opacity:0"/></linearGradient></defs>
    ${ring(230, 0, 'agx-floor o3')}${ring(190, 0, 'agx-floor o2')}${ring(150, 0, 'agx-floor o1')}
    ${Array.from({ length: 6 }, (_, i) => { const t = Math.PI / 6 + i * Math.PI / 3, a = iso(Math.cos(t) * 150, Math.sin(t) * 150, 0), b = iso(Math.cos(t) * 230, Math.sin(t) * 230, 0); return `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" class="agx-spoke"/>`; }).join('')}
    <ellipse cx="${cx}" cy="${cy - 40}" rx="200" ry="110" fill="url(#agxGlow)" opacity=".45"/>
    ${prism(150, 0, 14, 'agx-base')}${prism(112, 14, 66, 'agx-body')}${prism(74, 66, 96, 'agx-crown')}
    <g class="agx-scan">${ring(118, 40, 'agx-scanring')}</g>
    <polygon points="${(() => { const t = hex(30, 96), b2 = hex(30, 170); return pts([t[1], t[2], b2[2], b2[1]]); })()}" fill="url(#agxBeam)" class="agx-beam"/>
    <text x="${cx}" y="${cy - 168}" class="agx-core-t">${esc(displayName())}</text><text x="${cx}" y="${cy - 150}" class="agx-core-s">team score ${chief.score}</text>
    ${tags}
    <text x="${cx}" y="${H - 10}" class="agx-cap">Agent overview · tap a tag to open that agent</text></svg></div>`;
}

/* ---------- Overview page ---------- */
function agOverviewHTML(){
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const w0 = addDays(t, -6), w1 = addDays(t, -13), wk = agSum(w0, 7), wkPrev = agSum(w1, 7);
  const mStart = new Date(t.getFullYear(), t.getMonth(), 1), mDays = t.getDate(), mo = agSum(mStart, mDays), lmStart = new Date(t.getFullYear(), t.getMonth() - 1, 1), moPrev = agSum(lmStart, Math.min(mDays, new Date(t.getFullYear(), t.getMonth(), 0).getDate()));
  const cats = ['English', 'Engineering', 'Career', 'Training', 'Walking', 'Routine'], byCat = cats.map(c => [c, agSum(mStart, mDays, [c])]);
  const totN = byCat.reduce((s, x) => s + x[1].n, 0) || 1;
  const rank = AGENTS.filter(a => a.id !== 'chief').map(a => ({ a, r: agResult(a.id) })).sort((x, y) => y.r.score - x.r.score);
  // month trend: % of blocks done per day, dashed forecast at the 7-day average
  const dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(), tc = agCats(AGP.trend), vals = [], labels = [];
  for (let d = 1; d <= dim; d++){ const day = new Date(t.getFullYear(), t.getMonth(), d); if (d <= mDays){ const x = agDay(dkey(day), tc); vals.push(x.of ? Math.round(x.n / x.of * 100) : 0); } else vals.push(null); labels.push(d === 1 || d % 5 === 0 || d === mDays ? String(d) : ''); }
  const last7 = vals.slice(Math.max(0, mDays - 7), mDays), avg = last7.length ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length) : 0;
  for (let d = mDays; d < dim; d++) vals[d] = avg;
  // last 6 weeks
  const wc = agCats(AGP.weeks), ws = startOfWeek(), wv = [], wl = [];
  for (let i = 5; i >= 0; i--){ const s0 = addDays(ws, -7 * i); wv.push(agSum(s0, i === 0 ? isoWeekday(t) + 1 : 7, wc).n); wl.push(i === 0 ? 'This wk' : `${s0.getDate()} ${MONTHS[s0.getMonth()].slice(0, 3)}`); }
  // money: cumulative spend this month against the flexible budget
  const budget = Math.round(fixedTotal() * dim / 30.4), spend = [], sl = []; let cum = 0;
  for (let d = 1; d <= dim; d++){ const k = dkey(new Date(t.getFullYear(), t.getMonth(), d)); if (d <= mDays){ cum += (state.expenses || []).filter(e => e.date === k).reduce((a, e) => a + (+e.amount || 0), 0); spend.push(Math.round(cum)); } else spend.push(null); sl.push(d === 1 || d % 5 === 0 ? String(d) : ''); }
  const pace = mDays ? cum / mDays : 0; for (let d = mDays; d < dim; d++) spend[d] = Math.round(cum + pace * (d - mDays + 1));
  const saved = savedTotal(), goal = +state.settings.goal || 25000;
  return `<div class="agx-ov">
    <div class="agx-col">
      ${agSec('Plan blocks done', '', `<div class="agx-kpi2">
          <div><small>This week</small><b class="num">${agFmt(wk.n)}</b><span>of ${wk.of}</span></div><div><small>vs last week</small><b class="num dim">${agFmt(wkPrev.n)}</b>${agCmp(wk.n, wkPrev.n)}</div>
          <div><small>This month</small><b class="num">${agFmt(mo.n)}</b><span>of ${mo.of}</span></div><div><small>vs same days last month</small><b class="num dim">${agFmt(moPrev.n)}</b>${agCmp(mo.n, moPrev.n)}</div></div>
        <div class="agx-sub">Where it went this month</div>
        <div class="agx-stripe">${byCat.filter(x => x[1].n).map(([c, x]) => `<i style="flex:${x.n};--c:${AREA_COL[c]}" title="${c} ${x.n}"></i>`).join('') || '<i class="none"></i>'}</div>
        <div class="agx-legend">${byCat.filter(x => x[1].n).map(([c, x]) => `<span><i style="background:${AREA_COL[c]}"></i>${c} ${Math.round(x.n / totN * 100)}%</span>`).join('') || '<span>Nothing done yet this month.</span>'}</div>
        <div class="agx-sub">Focused time by area</div>
        <div class="agx-dwrap">${agDonut(byCat.filter(x => x[1].min).map(([c, x]) => [c, x.min, AREA_COL[c]]))}<ul class="agx-dl">${byCat.filter(x => x[1].min).map(([c, x]) => `<li><i style="background:${AREA_COL[c]}"></i>${c}<b class="num">${Math.round(x.min / 60 * 10) / 10} h</b></li>`).join('') || '<li class="none">Mark plan blocks as done to see where your time goes.</li>'}</ul></div>`)}
    </div>
    <div class="agx-mid">
      <div class="agx-figs">
        <div><small>Team score</small><b class="num">${agResult('chief').score}</b><span>weighted by your goals</span></div>
        <div><small>Saved</small><b class="num">${money0(saved)}</b><span>${Math.round(saved / goal * 100)}% of ${money0(goal)}</span></div>
        <div><small>Streak</small><b class="num">${currentStreak()}</b><span>best ${bestStreak()}</span></div>
      </div>
      ${agTowerHTML()}
    </div>
    <div class="agx-rcol">
      ${agSec('Agent ranking', 'by score', `<ol class="agx-rank">${rank.map(({ a, r }, i) => `<li data-ag-sel="${a.id}" data-agp="team" role="button" tabindex="0"><span class="no">No.${i + 1}</span><span class="nm">${esc(a.area)}</span><span class="bar"><i style="width:${agOn(a.id) ? r.score : 0}%"></i></span><b class="num">${agOn(a.id) ? r.score : '–'}</b></li>`).join('')}</ol>`)}
    </div>
    <div class="agx-bottom">
      ${agSec('This month, day by day', '% of plan blocks done · dashed = forecast at your 7-day average', agChips('trend', AGP.trend) + agArea(vals, { labels, cut: mDays, max: 100, unit: '%', label: 'Plan done per day this month' }), 'wide')}
      ${agSec('Last 6 weeks', 'plan blocks done', agChips('weeks', AGP.weeks) + agBars(wv, wl, { label: 'Blocks done per week' }))}
      ${agSec('Spending this month', `budget ${money0(budget)}`, `<div class="agx-kpi1"><div><small>Spent so far</small><b class="num">${money0(cum)}</b></div><div><small>At this pace</small><b class="num ${cum + pace * (dim - mDays) > budget ? 'bad' : ''}">${money0(cum + pace * (dim - mDays))}</b></div></div>${agArea(spend, { labels: sl, cut: mDays, max: Math.max(budget * 1.1, 10), unit: '', base: budget, baseLabel: 'budget', label: 'Spending this month' })}`)}
    </div>
  </div>`;
}

/* ---------- Alerts page ---------- */
function agAlertsHTML(){
  const res = AGENTS.filter(a => a.id !== 'chief' && agOn(a.id)).map(a => ({ a, r: agResult(a.id) }));
  const all = res.flatMap(x => x.r.findings.map(f => ({ ...f, a: x.a })));
  const open = all.filter(f => !f.done), red = open.filter(f => f.sev >= 3).length, yel = open.filter(f => f.sev === 2).length, blu = open.filter(f => f.sev <= 1).length, done = all.filter(f => f.done).length, tot = all.length || 1;
  const k = dkey(), m = nowMin(), late = dayBlocks(k).filter(b => !b.skip && !blockStatus(k, b) && b.start + b.dur < m).length;
  let missed7 = 0; for (let i = 1; i <= 7; i++){ const kk = dkey(addDays(new Date(), -i)); dayBlocks(kk).forEach(b => { if (!b.skip && blockStatus(kk, b) !== 'done') missed7++; }); }
  const s30 = periodStats(dkey(addDays(new Date(), -29)), k), over = Math.max(0, s30.spent - s30.budget), ci = ['2w', '1m'].map(ciStatus).filter(s => s.state === 'late' || s.state === 'due').length;
  const weeks = [], wl = []; const ws = startOfWeek(); for (let i = 11; i >= 0; i--){ const s0 = addDays(ws, -7 * i); const x = agSum(s0, i === 0 ? isoWeekday(new Date()) + 1 : 7); weeks.push(x.of - x.n); wl.push(i % 3 === 0 ? `${s0.getDate()}/${s0.getMonth() + 1}` : ''); }
  const stat = (icon, v, l) => `<div class="agx-stat">${ic(icon, 16)}<span><small>${l}</small><b class="num">${v}</b></span></div>`;
  // beacon scene
  const W = 640, H = 420, cx = W / 2, cy = 200, nodes = res.filter(x => x.r.findings.some(f => !f.done)).slice(0, 7);
  const ring = nodes.map((x, i) => { const t = Math.PI * .88 + (i + .5) / nodes.length * Math.PI * 1.24, nx = cx + Math.cos(t) * 262, ny = cy - 10 + Math.sin(t) * 150, o = x.r.findings.filter(f => !f.done), hi = o.some(f => f.sev >= 3);
    return `<g class="agx-an ${hi ? 'hi' : ''}" data-ag-sel="${x.a.id}" data-agp="team" role="button" tabindex="0" aria-label="${esc(x.a.name)}: ${o.length} open" style="--c:${AG_COLORS[x.a.id]}">
      <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" class="ln"/><circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="20" class="nb"/>
      <text x="${nx.toFixed(1)}" y="${(ny + 5).toFixed(1)}" class="nv">${o.length}</text>
      <rect x="${(nx - 52).toFixed(1)}" y="${(ny + 26).toFixed(1)}" width="104" height="22" rx="3" class="lb"/><text x="${nx.toFixed(1)}" y="${(ny + 41).toFixed(1)}" class="lt">${esc(x.a.area)}</text></g>`; }).join('');
  const ped = (x, y, label, sub, icon) => `<g class="agx-ped" transform="translate(${x},${y})"><polygon points="0,-18 54,8 0,34 -54,8" class="t"/><polygon points="-54,8 0,34 0,46 -54,20" class="l"/><polygon points="54,8 0,34 0,46 54,20" class="r"/>
    <foreignObject x="-14" y="-16" width="28" height="28"><div xmlns="http://www.w3.org/1999/xhtml" class="agx-pi">${ic(icon, 18)}</div></foreignObject>
    <text x="0" y="66" class="pl">${label}</text><text x="0" y="80" class="ps">${sub}</text></g>`;
  const scene = `<svg viewBox="0 0 ${W} ${H}" class="agx-beacon" role="img" aria-label="${open.length} open findings">
    <defs><radialGradient id="agxB"><stop offset="0" style="stop-color:var(--ag-core1);stop-opacity:.95"/><stop offset=".6" style="stop-color:var(--ag-core2);stop-opacity:.35"/><stop offset="1" style="stop-color:var(--ag-core3);stop-opacity:0"/></radialGradient></defs>
    <ellipse cx="${cx}" cy="${cy + 20}" rx="270" ry="120" class="o1"/><ellipse cx="${cx}" cy="${cy + 20}" rx="190" ry="84" class="o2"/><ellipse cx="${cx}" cy="${cy + 20}" rx="110" ry="48" class="o3"/>
    ${ring}
    <ellipse cx="${cx}" cy="${cy + 20}" rx="120" ry="60" fill="url(#agxB)" opacity=".7"/>
    <g class="agx-disc">${[0, 1, 2].map(i => `<ellipse cx="${cx}" cy="${cy + 26 - i * 14}" rx="${62 - i * 6}" ry="${20 - i * 2}" class="d${i}"/>`).join('')}</g>
    <path d="M ${cx - 24} ${cy - 2} a 24 24 0 0 1 48 0 v 10 h -48 z" class="bell"/><path d="M ${cx + 3} ${cy - 22} l -9 16 h 8 l -4 13 l 12 -18 h -8 z" class="bolt"/>
    <text x="${cx}" y="${cy + 64}" class="cap">${open.length} open · ${done} done today</text>
    <path d="M ${cx - 190} ${H - 92} Q ${cx - 110} ${cy + 70} ${cx - 30} ${cy + 40}" class="flow"/><path d="M ${cx + 190} ${H - 92} Q ${cx + 110} ${cy + 70} ${cx + 30} ${cy + 40}" class="flow"/><path d="M ${cx} ${H - 92} L ${cx} ${cy + 62}" class="flow"/>
    ${ped(cx - 200, H - 104, 'Day plan', `${late} late today`, 'checklist')}${ped(cx, H - 104, 'Agents', `${res.length} watching`, 'robot')}${ped(cx + 200, H - 104, 'Money', over ? `${money0(over)} over` : 'on budget', 'pound')}
  </svg>`;
  // processing ring and peaks
  const pr = [[red, 'Needs you now', 'var(--ag-bad)'], [yel + blu, 'To watch', 'var(--ag-warn)'], [done, 'Done today', 'var(--ag-ok)']], rr = 52, rc = 2 * Math.PI * rr; let off = 0;
  const ringSvg = `<svg viewBox="0 0 140 140" width="140" height="140" aria-hidden="true"><circle cx="70" cy="70" r="${rr}" class="tr"/>${pr.map(([v, , col]) => { const len = v / tot * rc, s = `<circle cx="70" cy="70" r="${rr}" class="seg" style="stroke:${col}" stroke-dasharray="${Math.max(0, len - 3).toFixed(1)} ${rc.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 70 70)"/>`; off += len; return s; }).join('')}<circle cx="70" cy="70" r="38" class="in"/></svg>`;
  const PW = 360, PH = 120, mx = Math.max(1, ...res.map(x => x.r.findings.filter(f => !f.done).length));
  const peaks = `<svg viewBox="0 0 ${PW} ${PH}" class="agx-peaks" preserveAspectRatio="none" role="img" aria-label="Open findings by agent">${[0, .5, 1].map(f => `<line x1="20" x2="${PW}" y1="${PH - 20 - f * (PH - 34)}" y2="${PH - 20 - f * (PH - 34)}" class="g"/>`).join('')}
    ${res.map((x, i) => { const v = x.r.findings.filter(f => !f.done).length, px = 30 + (i + .5) * (PW - 40) / res.length, h = v / mx * (PH - 34), w = (PW - 40) / res.length * .9; return `<path d="M ${px - w / 2} ${PH - 20} Q ${px - w / 6} ${PH - 22} ${px} ${PH - 20 - h} Q ${px + w / 6} ${PH - 22} ${px + w / 2} ${PH - 20} Z" class="pk" style="--c:${AG_COLORS[x.a.id]}"/><text x="${px}" y="${PH - 6}" class="xl">${esc(x.a.area.slice(0, 5))}</text>`; }).join('')}</svg>`;
  return `<div class="agx-al">
    <div class="agx-sev">
      <div class="red"><span class="ico">${ic('bell', 18)}</span><span><small>Needs you now</small><b class="num">${red}</b></span></div>
      <div class="yel"><span class="ico">${ic('bell', 18)}</span><span><small>To watch</small><b class="num">${yel}</b></span></div>
      <div class="blu"><span class="ico">${ic('bell', 18)}</span><span><small>Good to know</small><b class="num">${blu}</b></span></div>
    </div>
    <div class="agx-col">
      ${agSec('Today', 'from your plan and money', `<div class="agx-stats">${stat('flag', open.length, 'Open findings')}${stat('check', done, 'Done today')}${stat('clock', late, 'Late blocks today')}${stat('calendar', missed7, 'Missed blocks, 7 days')}${stat('bell', ci, 'Check-ins due')}${stat('pound', money0(over), 'Over budget, 30 days')}</div>`)}
      ${agSec('Missed blocks', 'per week, last 12 weeks', agArea(weeks, { labels: wl, w: 360, h: 140, label: 'Missed blocks per week' }))}
    </div>
    <div class="agx-mid">${scene}</div>
    <div class="agx-col">
      ${agSec('Handling', 'today', `<div class="agx-proc"><div class="agx-pr">${ringSvg}<div class="c"><small>Findings</small><b class="num">${all.length}</b></div></div>
        <ul>${pr.map(([v, l, col]) => `<li><i style="background:${col}"></i>${l}<b class="num">${v}</b><em>${Math.round(v / tot * 100)}%</em></li>`).join('')}</ul></div>`)}
      ${agSec('By agent', 'open findings', `${peaks}<table class="agx-tbl"><thead><tr><th>Agent</th><th>Open</th><th>Done</th><th>Rate</th></tr></thead><tbody>${res.map(x => { const o = x.r.findings.filter(f => !f.done).length, d = x.r.findings.length - o; return `<tr data-ag-sel="${x.a.id}" data-agp="team" role="button" tabindex="0"><td><i style="background:${AG_COLORS[x.a.id]}"></i>${esc(x.a.area)}</td><td class="num">${o}</td><td class="num">${d}</td><td class="num">${x.r.findings.length ? Math.round(d / x.r.findings.length * 100) : 100}%</td></tr>`; }).join('')}</tbody></table>`)}
    </div>
    ${agSec('Open list', 'highest first', `<ul class="agx-list">${open.sort((a, b) => b.sev - a.sev).map(f => `<li class="sev${f.sev}"><i></i><span class="ag">${esc(f.a.area)}</span><b>${esc(f.t)}</b><small>${esc(f.why || '')}</small>${f.go ? `<button class="ag-btn" data-ag-go="${f.go}">Open</button>` : ''}<button class="ag-btn" data-ag-done="${f.a.id}:${f.id}">Done</button></li>`).join('') || '<li class="none">Nothing open. Every agent is happy.</li>'}</ul>`, 'full')}
  </div>`;
}

/* ---------- the tab ---------- */
renderAgents = function(){
  agentsRun(); const p = agPage();
  return `<div class="ag agx" id="agRoot" data-agtheme="${agTheme()}">${agHeadHTML()}${p === 'alerts' ? agAlertsHTML() : p === 'team' ? agTeamHTML() : agOverviewHTML()}</div>`;
};
document.addEventListener('click', e => {
  const b = e.target.closest('#agRoot [data-agp], #agRoot [data-agt], #agRoot [data-agf]'); if (!b) return;
  if (b.dataset.agt){ e.stopPropagation(); state.agTheme = b.dataset.agt; save(); const r = document.getElementById('agRoot'); if (r) r.dataset.agtheme = state.agTheme; document.querySelectorAll('#agRoot [data-agt]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(on)); }); return; }
  if (b.dataset.agf){ e.stopPropagation(); const [key, id] = b.dataset.agf.split(':'); AGP[key] = id; agRedraw(); return; }
  if (b.dataset.agp){ if (b.dataset.agSel) AG.sel = b.dataset.agSel; e.stopPropagation(); state.agPage = b.dataset.agp; save(); agRedraw(); window.scrollTo({ top: Math.min(window.scrollY, (document.getElementById('agRoot')?.getBoundingClientRect().top || 0) + window.scrollY - 70), behavior: 'auto' }); }
}, true);
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('#agRoot [data-agp][role="button"]')){ e.preventDefault(); e.target.closest('[data-agp]').click(); } });
