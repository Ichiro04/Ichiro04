/* ============================================================
   ENGINEERING GLOSSARY · English ⇄ မြန်မာ (3 Nov 2026)
   The user asked whether a Burmese microbiology dataset could help; it
   is off-topic for his goals and cannot teach Claude anything, so this
   is the useful version: his own field's words in English and Burmese.
   - Learn → Words: searchable glossary by area, hear English or Burmese,
     tick words you know, "Explain" asks Claude in simple Burmese.
   - Learn → Packs: key words of today's pack with their Burmese, and an
     "Explain in မြန်မာ" button for the whole pack.
   The Burmese was written by Claude: if a word sounds wrong, tell Claude
   in the chat and it will be corrected here.
   ============================================================ */
const GLOSS = [
  // [English, Burmese, simple meaning, area]
  ['thermoforming', 'အပူပေး ပုံသွင်းခြင်း', 'Heating a plastic sheet until soft, then shaping it over a mould.', 'Thermoforming'],
  ['mould', 'ပုံစံခွက်', 'The shaped tool that gives a part its form.', 'Thermoforming'],
  ['plastic sheet', 'ပလတ်စတစ်ပြား', 'Flat plastic before it is formed.', 'Thermoforming'],
  ['vacuum', 'လေဟာနယ်', 'Air pulled out of a space; it sucks the sheet onto the mould.', 'Thermoforming'],
  ['heater', 'အပူပေးကိရိယာ', 'The part that warms the sheet before forming.', 'Thermoforming'],
  ['cooling', 'အအေးခံခြင်း', 'Letting a part lose heat so it keeps its shape.', 'Thermoforming'],
  ['trim press', 'အနားသတ် ဖြတ်စက်', 'The press that cuts formed parts out of the sheet.', 'Thermoforming'],
  ['cycle time', 'တစ်ပတ်လည် ကြာချိန်', 'Time taken to make one cycle of parts.', 'Thermoforming'],
  ['film', 'ဖလင်', 'Very thin plastic used to wrap or seal food.', 'Thermoforming'],
  ['seal', 'လုံအောင် ပိတ်ခြင်း', 'Closing a pack so air cannot get in.', 'Thermoforming'],
  ['packaging', 'ထုပ်ပိုးမှု', 'The material and work that protects a product.', 'Thermoforming'],
  ['thickness', 'အထူ', 'How thick something is, often in millimetres or microns.', 'Thermoforming'],
  ['production line', 'ထုတ်လုပ်ရေး လိုင်း', 'Machines in order that make a product step by step.', 'Manufacturing'],
  ['changeover', 'ထုတ်ကုန် အပြောင်းအလဲ', 'Setting a line up to make a different product.', 'Manufacturing'],
  ['downtime', 'စက်ရပ်ချိန်', 'Time a machine is stopped and not making parts.', 'Manufacturing'],
  ['efficiency', 'စွမ်းဆောင်ရည်', 'How much useful output you get for what you put in.', 'Manufacturing'],
  ['output', 'ထွက်ကုန်', 'What a machine or line produces.', 'Manufacturing'],
  ['capacity', 'ထုတ်လုပ်နိုင်စွမ်း', 'The most a line can make in a set time.', 'Manufacturing'],
  ['raw material', 'ကုန်ကြမ်း', 'Material before it is made into a product.', 'Manufacturing'],
  ['scrap', 'စွန့်ပစ်ပစ္စည်း', 'Material or parts that cannot be used and are thrown away.', 'Manufacturing'],
  ['batch', 'အသုတ်', 'A group of products made together.', 'Manufacturing'],
  ['shift', 'အလုပ်အဆိုင်း', 'A set period of work, such as days or nights.', 'Manufacturing'],
  ['operator', 'စက်ကိုင် ဝန်ထမ်း', 'The person who runs a machine.', 'Manufacturing'],
  ['conveyor', 'ကွန်ဗေယာ (သယ်ယူခါးပတ်)', 'A moving belt that carries products along the line.', 'Manufacturing'],
  ['quality', 'အရည်အသွေး', 'How well a product meets what it should be.', 'Quality'],
  ['defect', 'ချို့ယွင်းချက်', 'A fault that makes a part not good enough.', 'Quality'],
  ['inspection', 'စစ်ဆေးခြင်း', 'Checking parts against the standard.', 'Quality'],
  ['tolerance', 'ခွင့်ပြု အတိုင်းအတာ', 'How far a size may be from the target and still pass.', 'Quality'],
  ['measurement', 'တိုင်းတာခြင်း', 'Finding a size, weight or value with a tool.', 'Quality'],
  ['calibration', 'ချိန်ညှိခြင်း', 'Checking a measuring tool against a known standard.', 'Quality'],
  ['specification', 'သတ်မှတ်ချက်', 'The written requirements a product must meet.', 'Quality'],
  ['sample', 'နမူနာ', 'A few parts taken to check the whole batch.', 'Quality'],
  ['average', 'ပျမ်းမျှ', 'The total divided by how many there are.', 'Quality'],
  ['root cause', 'အရင်းခံ အကြောင်းရင်း', 'The real reason a problem happened.', 'Quality'],
  ['complaint', 'တိုင်ကြားချက်', 'A report from a customer that something was wrong.', 'Quality'],
  ['maintenance', 'ပြုပြင် ထိန်းသိမ်းခြင်း', 'Work that keeps machines running well.', 'Maintenance'],
  ['preventive maintenance', 'ကြိုတင်ကာကွယ် ပြုပြင်ထိန်းသိမ်းခြင်း', 'Planned checks and fixes before something breaks.', 'Maintenance'],
  ['breakdown', 'စက်ပျက်ခြင်း', 'When a machine stops working because of a fault.', 'Maintenance'],
  ['lubrication', 'ချောဆီ ထည့်ခြင်း', 'Adding oil or grease to reduce friction and wear.', 'Maintenance'],
  ['bearing', 'ဘယ်ရင်', 'A part that lets a shaft turn smoothly.', 'Maintenance'],
  ['wear', 'ပွန်းစားမှု', 'Slow damage from rubbing and use.', 'Maintenance'],
  ['vibration', 'တုန်ခါမှု', 'Shaking that can show a machine has a problem.', 'Maintenance'],
  ['spare part', 'အပိုပစ္စည်း', 'A part kept ready to replace a broken one.', 'Maintenance'],
  ['sensor', 'အာရုံခံ ကိရိယာ', 'A device that detects something, such as heat or position.', 'Maintenance'],
  ['safety', 'ဘေးကင်းရေး', 'Keeping people from harm at work.', 'Safety'],
  ['hazard', 'အန္တရာယ်', 'Something that could cause harm.', 'Safety'],
  ['lock out', 'ဓာတ်အားဖြတ်ပြီး သော့ခတ်ခြင်း', 'Switching off power and locking it so no one can turn it on.', 'Safety'],
  ['guard', 'အကာအရံ', 'A cover that stops hands reaching moving parts.', 'Safety'],
  ['technical drawing', 'အင်ဂျင်နီယာ ပုံဆွဲချက်', 'An exact drawing that shows how to make a part.', 'CAD and drawings'],
  ['dimension', 'အတိုင်းအတာ', 'A size shown on a drawing.', 'CAD and drawings'],
  ['scale', 'အချိုး', 'How big the drawing is compared with the real part.', 'CAD and drawings'],
  ['section view', 'ဖြတ်ပိုင်းပုံ', 'A view as if the part were cut open.', 'CAD and drawings'],
  ['assembly', 'တပ်ဆင်ခြင်း', 'Putting parts together into one product.', 'CAD and drawings'],
  ['thread', 'ဝက်အူရစ်', 'The spiral ridge on a screw or bolt.', 'CAD and drawings'],
  ['fillet', 'ထောင့်ဝိုင်း', 'A rounded inside corner.', 'CAD and drawings'],
  ['hole', 'အပေါက်', 'A round opening through or into a part.', 'CAD and drawings'],
  ['force', 'အား', 'A push or pull, measured in newtons.', 'Mechanics and engines'],
  ['pressure', 'ဖိအား', 'Force spread over an area.', 'Mechanics and engines'],
  ['temperature', 'အပူချိန်', 'How hot or cold something is.', 'Mechanics and engines'],
  ['torque', 'လှည့်အား', 'A turning force, such as on a bolt or shaft.', 'Mechanics and engines'],
  ['friction', 'ပွတ်တိုက်မှု', 'The force that resists two surfaces sliding.', 'Mechanics and engines'],
  ['stress', 'ဖိစီးမှု', 'Force inside a material per unit of area.', 'Mechanics and engines'],
  ['energy', 'စွမ်းအင်', 'The ability to do work.', 'Mechanics and engines'],
  ['power', 'ပါဝါ (စွမ်းအား)', 'How fast work is done, measured in watts.', 'Mechanics and engines'],
  ['speed', 'အမြန်နှုန်း', 'How fast something moves.', 'Mechanics and engines'],
  ['shaft', 'ဝင်ရိုး', 'A rotating bar that carries power.', 'Mechanics and engines'],
  ['gear', 'ဂီယာ', 'A toothed wheel that passes motion to another.', 'Mechanics and engines'],
  ['engine', 'အင်ဂျင်', 'A machine that turns fuel into movement.', 'Mechanics and engines'],
  ['piston', 'ပစ္စတင်', 'The part that moves up and down inside a cylinder.', 'Mechanics and engines'],
  ['cylinder', 'ဆလင်ဒါ', 'The tube a piston moves in.', 'Mechanics and engines'],
  ['crankshaft', 'ခရန့်ရှပ်', 'The shaft that turns the pistons’ up-and-down motion into rotation.', 'Mechanics and engines'],
  ['valve', 'အဆို့ရှင်', 'A part that opens and closes to control flow.', 'Mechanics and engines'],
  ['fuel', 'လောင်စာ', 'What an engine burns for energy.', 'Mechanics and engines'],
  ['combustion', 'လောင်ကျွမ်းခြင်း', 'Burning fuel with air to release energy.', 'Mechanics and engines']
];
const GX = { q: '', area: 'All' };
const GX_AREAS = ['All', ...new Set(GLOSS.map(g => g[3]))];
const gxKnown = () => (state.glossKnown = state.glossKnown || {});

function gxListHTML(){
  const q = GX.q.trim().toLowerCase(), known = gxKnown();
  const list = GLOSS.filter(g => (GX.area === 'All' || g[3] === GX.area) && (!q || g[0].includes(q) || g[1].includes(GX.q.trim()) || g[2].toLowerCase().includes(q)));
  return list.map(([en, my, d, area]) => `<li class="gx-row${known[en] ? ' known' : ''}">
      <div class="gx-t"><b>${esc(en)}</b><span lang="my">${esc(my)}</span><small>${esc(d)}</small></div>
      <div class="gx-b"><button class="gx-ib" data-gx="say" data-t="${esc(en)}" aria-label="Hear ${esc(en)} in English">EN ${ic('volume', 13)}</button><button class="gx-ib" data-gx="say" data-t="${esc(my)}" lang="my" aria-label="Hear it in Burmese">မြန် ${ic('volume', 13)}</button>
        <button class="gx-ib" data-gx="ask" data-t="${esc(en)}" aria-label="Ask Claude to explain ${esc(en)} in Burmese">Explain</button>
        <button class="gx-ib k${known[en] ? ' on' : ''}" data-gx="known" data-t="${esc(en)}" aria-pressed="${!!known[en]}">${known[en] ? ic('check', 13) + ' Known' : 'I know it'}</button></div></li>`).join('') || '<li class="gx-none">No word matches. Try a shorter search.</li>';
}
function glossaryHTML(){
  const n = Object.keys(gxKnown()).filter(k => GLOSS.some(g => g[0] === k)).length;
  return `<div class="glass card gx" id="gxCard">
    <div class="row between" style="gap:10px;flex-wrap:wrap"><div><div class="h3">Engineering words · English and <span lang="my">မြန်မာ</span></div><div class="tiny">${GLOSS.length} words from your field · ${n} known</div></div>
      <div class="gx-prog" aria-label="${n} of ${GLOSS.length} known"><i style="width:${Math.round(n / GLOSS.length * 100)}%"></i></div></div>
    <div class="gx-tools"><input id="gxQ" type="search" placeholder="Search in English or Burmese" value="${esc(GX.q)}" aria-label="Search the glossary">
      <div class="gx-chips">${GX_AREAS.map(a => `<button class="${GX.area === a ? 'on' : ''}" data-gx="area" data-t="${esc(a)}" aria-pressed="${GX.area === a}">${esc(a)}</button>`).join('')}</div></div>
    <ul class="gx-list" id="gxList">${gxListHTML()}</ul>
    <p class="tiny gx-note">The Burmese was written by Claude. If a word sounds wrong to you, tell the coach in the chat and it will be fixed here.</p></div>`;
}
learnWordsHTML = (orig => function(){ return glossaryHTML() + orig.apply(this, arguments); })(learnWordsHTML);

/* today's pack: its key words in Burmese, and an explain button */
function gxPackWords(p){ const text = (p.title + ' ' + p.points.join(' ') + ' ' + p.ask).toLowerCase(); return GLOSS.filter(g => new RegExp('\\b' + g[0].replace(/ /g, '\\s') + 's?\\b').test(text)).slice(0, 8); }
learnKnowHTML = (orig => function(){
  const h = orig.apply(this, arguments), id = (h.match(/data-a="know-done" data-id="([^"]+)"/) || [])[1], p = id && KNOWLEDGE_PACKS.find(x => x.id === id); if (!p) return h;
  const w = gxPackWords(p);
  const extra = `${w.length ? `<div class="gx-kw"><span class="tiny">Key words</span>${w.map(g => `<span class="gx-chip"><b>${esc(g[0])}</b><i lang="my">${esc(g[1])}</i></span>`).join('')}</div>` : ''}`;
  return h.replace('<div class="sf"><b>Ask yourself:</b>', extra + '<div class="sf"><b>Ask yourself:</b>')
          .replace(/(<button class="btn [^"]*btn-sm" data-a="know-done"[^>]*>[^]*?<\/button>)/, `$1<button class="btn btn-soft btn-sm" data-gx="pack" data-t="${esc(id)}"><span lang="my">မြန်မာ</span> Explain in Burmese</button>`);
})(learnKnowHTML);

/* ask Claude in Burmese for one turn, then go back to the chat language he chose */
function gxExplain(prompt){
  const prev = state.aiLang || 'en'; state.aiLang = 'my';
  aiOpen('chat'); Promise.resolve(aiSend(prompt)).finally(() => { state.aiLang = prev; save(); });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-gx]'); if (!b) return; e.stopPropagation();
  const a = b.dataset.gx, t = b.dataset.t;
  if (a === 'say') aiSpeak(t, true);
  else if (a === 'known'){ const k = gxKnown(); if (k[t]) delete k[t]; else k[t] = dkey(); save(); const c = document.getElementById('gxCard'); if (c) c.outerHTML = glossaryHTML(); }
  else if (a === 'area'){ GX.area = t; const l = document.getElementById('gxList'); if (l) l.innerHTML = gxListHTML(); document.querySelectorAll('[data-gx="area"]').forEach(x => { const on = x.dataset.t === t; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); }
  else if (a === 'ask'){ const g = GLOSS.find(x => x[0] === t); gxExplain(`Explain the engineering word "${t}"${g ? ` (${g[1]})` : ''} in simple Burmese, with one example from a food-packaging factory. Keep "${t}" in English.`); }
  else if (a === 'pack'){ const p = KNOWLEDGE_PACKS.find(x => x.id === t); if (p) gxExplain(`Explain this engineering topic in simple Burmese for a new operator. Keep technical words in English. Topic: ${p.title}. Points: ${p.points.join(' ')}`); }
}, true);
document.addEventListener('input', e => { if (e.target.id !== 'gxQ') return; GX.q = e.target.value; const l = document.getElementById('gxList'); if (l) l.innerHTML = gxListHTML(); });
