/* ============================================================
   READ A TECHNICAL DRAWING — explore + test
   One realistic shaft drawing (BS 8888 / ISO conventions):
   fit tolerance, bilateral and limit dimensions, general
   tolerance, centre and hidden lines, surface finish, GD&T
   (runout, perpendicularity), datum, section with hatching,
   title block. Tap a balloon to learn it; test mode scores you.
   ============================================================ */
const DX_INFO = {
  fit:   { n:1,  t:'Ø20 g6: an ISO fit tolerance', b:'The letter and number come from ISO 286. For a Ø20 shaft, g6 means −0.007 to −0.020 mm, so the shaft must measure between 19.980 and 19.993 mm. It is made to suit an H7 hole (20.000 to 20.021 mm), which gives a small clearance of 0.007 to 0.041 mm: a sliding or bearing fit.', c:'Check with a 0–25 mm micrometer reading to 0.001 mm. Measure twice at 90° to catch ovality.' },
  bi:    { n:2,  t:'Ø30 ±0.05: a bilateral tolerance', b:'The size may go 0.05 mm either side of nominal: smallest 29.95, largest 30.05. The total tolerance band is 0.10 mm.', c:'Rule of thumb: the instrument should be about ten times finer than the tolerance, so use a micrometer, not a ruler.' },
  lim:   { n:3,  t:'30.00 over 29.90: limit dimensions', b:'Instead of a nominal and ±, the two limits are written directly: the largest allowed size on top, the smallest underneath. Tolerance = 30.00 − 29.90 = 0.10 mm.', c:'Use limits when the designer cares about the exact boundaries, for example a length that sets a bearing position.' },
  gen:   { n:4,  t:'100: covered by the general tolerance', b:'A dimension with no tolerance of its own uses the general tolerance in the title block, here ±0.1, so 99.9 to 100.1. Many companies quote ISO 2768 instead, where the allowance grows with size.', c:'Always read the title block before you measure anything without a tolerance.' },
  cl:    { n:5,  t:'Thin chain line: a centre line', b:'Long dash, short dash. It marks an axis of symmetry or the centre of a hole. It is not an edge, so you never measure to it directly: you measure the features around it.', c:'BS 8888 line types: thick continuous = visible edge, thin continuous = dimensions and hatching, thin dashed = hidden edge, thin chain = centre line.' },
  hid:   { n:6,  t:'Thin dashed line: a hidden edge', b:'These are the walls of the Ø6 cross hole, which you cannot see from this direction. Hidden lines tell you something is inside the part.', c:'If a hidden feature matters, the drawing usually adds a section view to show it clearly, as here.' },
  ra:    { n:7,  t:'Ra 0.8: surface finish', b:'Ra is the average roughness in micrometres. 0.8 µm is a smooth ground finish, needed where a bearing sits. A normal turned surface is about Ra 3.2. The bar on the symbol means material must be removed (machined) to get it.', c:'Checked with a surface roughness tester, or compared against a finish comparison plate on the shop floor.' },
  run:   { n:8,  t:'Circular runout 0.02 to datum A', b:'Turn the shaft on its datum axis A. A dial indicator on the Ø20 seat must not move more than 0.02 mm (total indicator reading) at any section. It controls wobble and roundness together.', c:'Hold the shaft in V-blocks or between centres on the Ø30 collar, rotate one turn, read the needle.' },
  perp:  { n:9,  t:'Perpendicularity 0.03 to datum A', b:'The shoulder face must lie between two parallel planes 0.03 mm apart that are exactly square to datum axis A. That makes a bearing or gear sit square against it.', c:'Rotate on the datum and indicate across the face, or use a square and feeler gauges for a rough check.' },
  dat:   { n:10, t:'Datum A', b:'The triangle and the boxed letter mark a datum feature. Here it is the axis of the Ø30 collar. Every geometric tolerance that says "A" is measured from this axis, so the collar is where you hold the part when you inspect it.', c:'Datums should be functional surfaces: the ones the part actually locates on in the machine.' },
  sec:   { n:11, t:'Section A–A and hatching', b:'The thick-ended chain line marked A–A is a cutting plane; the arrows show which way you look. The section view shows the part cut open there. Hatching (thin lines at 45°) shows solid material that the plane cuts through; the clear slot is the Ø6 hole.', c:'Never hatch a hole or empty space. Two parts cut together are hatched in opposite directions.' },
  tb:    { n:12, t:'Title block', b:'Part name and number, material (080M40, also known as EN8), scale, units, projection method, general tolerance, who drew it and the revision letter.', c:'Check the revision letter matches the job sheet before you make anything: machining from an old revision is a classic expensive mistake.' }
};
const DX_Q = [
  { q:'Ø30 ±0.05: a collar measures 30.06 mm. What happens to it?', o:['Accept','Reject: it is 0.01 oversize','Accept: it is within 0.1'], a:1, w:'The largest allowed is 30.05, so 30.06 is out by 0.01 mm.', f:'bi' },
  { q:'Which reading passes for Ø20 g6 (19.980 to 19.993)?', o:['19.995','19.985','19.975'], a:1, w:'Only 19.985 sits between 19.980 and 19.993.', f:'fit' },
  { q:'An H7 hole with a g6 shaft gives which kind of fit?', o:['Interference (press) fit','Clearance fit','Transition fit'], a:1, w:'The shaft is always slightly smaller than the hole: 0.007 to 0.041 mm clearance.', f:'fit' },
  { q:'What does a thin dashed line show?', o:['A centre line','A hidden edge','A dimension line'], a:1, w:'Thin dashed = hidden edge, like the walls of the cross hole.', f:'hid' },
  { q:'What does a thin chain line (long dash, short dash) show?', o:['A centre line or axis','A cutting plane','A visible edge'], a:0, w:'Thin chain is a centre line. A cutting plane is chain that is thick at the ends.', f:'cl' },
  { q:'Which surface is smoother?', o:['Ra 3.2','Ra 0.8','They are the same'], a:1, w:'Ra is average roughness in µm: the smaller the number, the smoother the surface.', f:'ra' },
  { q:'The length is written 30.00 over 29.90. What is the tolerance?', o:['0.05 mm','0.10 mm','30 mm'], a:1, w:'30.00 − 29.90 = 0.10 mm.', f:'lim' },
  { q:'The 100 mm length has no tolerance written next to it. Which range is allowed?', o:['Exactly 100.0','99.9 to 100.1, from the title block','Anything, it is for reference'], a:1, w:'Untoleranced dimensions take the general tolerance in the title block: ±0.1.', f:'gen' },
  { q:'Runout 0.02 to A: the dial reads 0.015 mm over one turn. Result?', o:['Pass','Fail','You need a micrometer instead'], a:0, w:'0.015 is less than the 0.02 allowed total indicator reading.', f:'run' },
  { q:'What is datum A on this drawing?', o:['The left end face','The axis of the Ø30 collar','The cross hole'], a:1, w:'The datum triangle sits on the Ø30 dimension, so the datum is that feature’s axis.', f:'dat' },
  { q:'In the section view, what does the hatching show?', o:['Material cut by the section plane','A knurled surface','Hidden detail'], a:0, w:'Hatching marks solid material where the cutting plane passes through it.', f:'sec' },
  { q:'Perpendicularity 0.03 to A on a shoulder face controls…', o:['The shoulder diameter','How square the face is to the axis','The surface roughness'], a:1, w:'It keeps the face within 0.03 mm of being exactly square to datum axis A.', f:'perp' },
  { q:'Before machining, what should you check in the title block first?', o:['The revision letter matches your job','The drawer’s initials','The paper size'], a:0, w:'Making a part to an old revision is a common and expensive mistake.', f:'tb' },
  { q:'Scale 1:2 on a drawing means…', o:['Drawn twice real size','Drawn half real size','Two views per sheet'], a:1, w:'1:2 means 1 mm on paper is 2 mm on the real part, so the drawing is half size.', f:'tb' }
];
const dx = { mode:'explore', sel:'fit', order:[], i:0, score:0, done:false, picked:null };
function dxBest(){ try { return +localStorage.getItem('dc.dwgBest') || 0; } catch(e){ return 0; } }
function dxSetBest(v){ try { if (v > dxBest()) localStorage.setItem('dc.dwgBest', String(v)); } catch(e){} }
function dxDrawing(hl){
  const H = k => `data-f="${k}" class="f ${hl===k?'hl':''}"`;
  const B = (k,x,y) => `<g class="ball ${hl===k?'on':''}" data-a="dx-pick" data-id="${k}" role="button" tabindex="0" aria-label="${DX_INFO[k].t}"><circle cx="${x}" cy="${y}" r="13" class="hit"/><circle cx="${x}" cy="${y}" r="7.5"/><text x="${x}" y="${y+3.3}" text-anchor="middle">${DX_INFO[k].n}</text></g>`;
  let hatch = ''; for (let i=-70;i<=70;i+=6) hatch += `<line x1="${300+i-40}" y1="245" x2="${300+i+40}" y2="165"/>`;
  return `<svg viewBox="0 0 360 252" class="dwg dx" role="img" aria-label="Technical drawing of shaft SH-20 with numbered features">
  <defs>
    <marker id="dxA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1.5 L10,5 L0,8.5 z" class="dx-ah"/></marker>
    <clipPath id="dxClip"><circle cx="300" cy="205" r="30"/></clipPath>
  </defs>
  <rect x="3" y="3" width="354" height="246" rx="6" class="dwg-frame"/>
  <!-- part outline -->
  <path d="M42.5,80 L115,80 L115,67.5 L190,67.5 L190,75 L290,75 L290,135 L190,135 L190,142.5 L115,142.5 L115,130 L42.5,130 L40,127.5 L40,82.5 Z M42.5,80 L42.5,130" class="vis"/>
  <g ${H('cl')}><path d="M26,105 L304,105" class="cl"/><path d="M250,64 L250,146" class="cl"/></g>
  <g ${H('hid')}><path d="M242.5,75 L242.5,135 M257.5,75 L257.5,135" class="hid"/></g>
  <!-- dimensions -->
  <g ${H('fit')}><line x1="70" y1="80" x2="70" y2="130" class="dm" marker-start="url(#dxA)" marker-end="url(#dxA)"/><text x="64" y="105" transform="rotate(-90 64 105)" text-anchor="middle" class="dt">Ø20 g6</text></g>
  <g ${H('bi')}><line x1="165" y1="67.5" x2="165" y2="142.5" class="dm" marker-start="url(#dxA)" marker-end="url(#dxA)"/><text x="159" y="105" transform="rotate(-90 159 105)" text-anchor="middle" class="dt">Ø30 ±0.05</text></g>
  <line x1="222" y1="75" x2="222" y2="135" class="dm" marker-start="url(#dxA)" marker-end="url(#dxA)"/><text x="216" y="105" transform="rotate(-90 216 105)" text-anchor="middle" class="dt">Ø24</text>
  <g ${H('lim')}><path d="M115,64 L115,24 M190,64 L190,24" class="ext"/><line x1="115" y1="30" x2="190" y2="30" class="dm" marker-start="url(#dxA)" marker-end="url(#dxA)"/><text x="152.5" y="18" text-anchor="middle" class="dt sm">30.00</text><text x="152.5" y="27" text-anchor="middle" class="dt sm">29.90</text></g>
  <g ${H('gen')}><path d="M40,132 L40,165 M290,138 L290,165" class="ext"/><line x1="40" y1="160" x2="290" y2="160" class="dm" marker-start="url(#dxA)" marker-end="url(#dxA)"/><text x="165" y="156" text-anchor="middle" class="dt">100</text>
    <path d="M41,129 L28,146 L12,146" class="dm"/><text x="12" y="143" class="dt sm">1 × 45°</text></g>
  <!-- surface finish -->
  <g ${H('ra')}><path d="M84,73 L88,80 L97,62 L113,62" class="sym"/><text x="99" y="59" class="dt sm">Ra 0.8</text></g>
  <!-- GD&T frames -->
  <g ${H('run')}><rect x="45" y="38" width="56" height="14" class="fcf"/><path d="M59,38 V52 M85,38 V52" class="fcf"/><path d="M48.5,49 L55.5,41" class="sym" marker-end="url(#dxA)"/><text x="72" y="48.5" text-anchor="middle" class="dt sm">0.02</text><text x="93" y="48.5" text-anchor="middle" class="dt sm">A</text><path d="M60,52 L60,79" class="dm" marker-end="url(#dxA)"/></g>
  <g ${H('perp')}><rect x="196" y="38" width="56" height="14" class="fcf"/><path d="M210,38 V52 M236,38 V52" class="fcf"/><path d="M199,49 H207 M203,49 V41" class="sym"/><text x="223" y="48.5" text-anchor="middle" class="dt sm">0.03</text><text x="244" y="48.5" text-anchor="middle" class="dt sm">A</text><path d="M200,52 L191,70" class="dm" marker-end="url(#dxA)"/></g>
  <g ${H('dat')}><rect x="159" y="44" width="12" height="12" class="fcf"/><text x="165" y="53.5" text-anchor="middle" class="dt sm">A</text><path d="M165,56 V63" class="dm"/><path d="M161,67.5 L169,67.5 L165,62.5 Z" class="datum"/></g>
  <!-- cutting plane and section -->
  <g ${H('sec')}>
    <path d="M250,52 V62 M250,148 V158" class="cut"/><path d="M250,54 H262 M250,156 H262" class="dm" marker-end="url(#dxA)"/><text x="266" y="57" class="dt sm">A</text><text x="266" y="159" class="dt sm">A</text>
    <g clip-path="url(#dxClip)" class="hatch">${hatch}</g>
    <rect x="292.5" y="170" width="15" height="70" class="slot"/>
    <circle cx="300" cy="205" r="30" class="vis"/><path d="M292.5,176 V234 M307.5,176 V234" class="vis"/>
    <path d="M264,205 H336 M300,169 V241" class="cl"/>
    <text x="300" y="249" text-anchor="middle" class="dt sm">Section A–A</text>
  </g>
  <!-- title block -->
  <g ${H('tb')}><rect x="10" y="178" width="196" height="64" class="tb"/><path d="M10,191 H206 M10,204 H206 M10,217 H206 M10,230 H206" class="tbl"/>
    <text x="15" y="188" class="dt tbt">Shaft SH-20</text><text x="15" y="201" class="dt sm">Material: 080M40 (EN8) steel</text>
    <text x="15" y="214" class="dt sm">Scale 1:1 · Units mm · First angle</text><text x="15" y="227" class="dt sm">General tolerance ±0.1 unless stated</text>
    <text x="15" y="240" class="dt sm">Drawn: K. S. Han · Rev B</text>
    <g transform="translate(176,211)" class="fa"><path d="M0,-4 L9,-2.5 L9,2.5 L0,4 Z"/><circle cx="17" cy="0" r="4"/><circle cx="17" cy="0" r="1.8"/></g></g>
  ${B('fit',55,147)}${B('bi',145,149)}${B('lim',206,22)}${B('gen',303,160)}${B('cl',316,105)}${B('hid',274,120)}${B('ra',138,60)}${B('run',30,45)}${B('perp',266,45)}${B('dat',182,60)}${B('sec',342,178)}${B('tb',218,192)}
</svg>`;
}
function dwgCardHTML(){
  const best = dxBest();
  let body = '';
  if (dx.mode === 'explore'){
    const k = dx.sel, i = DX_INFO[k];
    body = `${dxDrawing(k)}
      <div class="dx-info"><div class="dx-n">${i.n}</div><div><div class="h3">${esc(i.t)}</div><p>${esc(i.b)}</p><p class="dx-check"><b>On the shop floor:</b> ${esc(i.c)}</p></div></div>
      <div class="row" style="gap:8px;margin-top:10px"><button class="btn btn-soft btn-sm" data-a="dx-step" data-id="-1">Previous</button><button class="btn btn-soft btn-sm" data-a="dx-step" data-id="1">Next feature</button></div>`;
  } else if (!dx.done){
    const Q = DX_Q[dx.order[dx.i]];
    body = `${dxDrawing(dx.picked!=null ? Q.f : null)}
      <div class="dx-test"><div class="dx-prog"><span class="num">Question ${dx.i+1} of ${dx.order.length}</span><span class="num">Score ${dx.score}</span></div>
      <div class="dx-bar"><i style="width:${(dx.i/dx.order.length*100).toFixed(0)}%"></i></div>
      <div class="dx-q">${esc(Q.q)}</div>
      <div class="dx-opts">${Q.o.map((o,j)=>`<button data-a="dx-answer" data-id="${j}" class="${dx.picked==null?'':(j===Q.a?'right':(j===dx.picked?'wrong':''))}" ${dx.picked!=null?'disabled':''}>${esc(o)}</button>`).join('')}</div>
      ${dx.picked!=null ? `<div class="dx-why ${dx.picked===Q.a?'ok':'no'}"><b>${dx.picked===Q.a?'Correct.':'Not quite.'}</b> ${esc(Q.w)} The feature is highlighted on the drawing.</div>
      <button class="btn btn-primary btn-sm" data-a="dx-next" style="margin-top:10px">${dx.i+1<dx.order.length?'Next question':'See result'}</button>` : ''}</div>`;
  } else {
    const n = dx.order.length, pct = Math.round(dx.score/n*100);
    body = `<div class="dx-result"><div class="dx-score num">${dx.score}<span>/${n}</span></div>
      <div class="h3">${pct>=88?'Drawing reader. Ready for the shop floor.':pct>=63?'Solid. Review the ones you missed in Explore.':'Keep going: explore each balloon, then retake.'}</div>
      <div class="tiny">Best score: ${Math.max(best, dx.score)}/${n}</div>
      <div class="row" style="gap:8px;margin-top:12px"><button class="btn btn-primary btn-sm" data-a="dx-start">Retake test</button><button class="btn btn-soft btn-sm" data-a="dx-mode" data-id="explore">Back to explore</button></div></div>`;
  }
  return `<div class="glass dxcard" id="dxCard">
    <div class="cadhead"><div><div class="h3">Read a technical drawing</div><div class="tiny">${dx.mode==='explore'?'Tap a numbered balloon to learn that feature.':'Eight questions from the drawing. Explanations after each one.'}</div></div>
      <span class="chip-live">${best?`Best ${best}/8`:'New'}</span></div>
    <div class="cadparts"><button class="${dx.mode==='explore'?'on':''}" data-a="dx-mode" data-id="explore">Explore</button><button class="${dx.mode==='test'?'on':''}" data-a="dx-start">Test me</button></div>
    ${body}
  </div>`;
}
function dxRefresh(){ const c = document.getElementById('dxCard'); if (c) c.outerHTML = dwgCardHTML(); }
function dxAction(a, el){
  const keys = Object.keys(DX_INFO);
  if (a==='dx-pick'){ dx.mode = 'explore'; dx.sel = el.dataset.id; dxRefresh(); }
  else if (a==='dx-step'){ const i = keys.indexOf(dx.sel); dx.sel = keys[(i + (+el.dataset.id) + keys.length) % keys.length]; dxRefresh(); }
  else if (a==='dx-mode'){ dx.mode = el.dataset.id; dx.done = false; dxRefresh(); }
  else if (a==='dx-start'){ const idx = DX_Q.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,8); Object.assign(dx, { mode:'test', order:idx, i:0, score:0, done:false, picked:null }); dxRefresh(); }
  else if (a==='dx-answer'){ if (dx.picked!=null) return; dx.picked = +el.dataset.id; if (dx.picked === DX_Q[dx.order[dx.i]].a) dx.score++; dxRefresh(); }
  else if (a==='dx-next'){ dx.picked = null; if (dx.i+1 < dx.order.length) dx.i++; else { dx.done = true; dxSetBest(dx.score); } dxRefresh(); }
}
