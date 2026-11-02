/* ============================================================
   SKINS · Crimson pearl (default), Neumorphic glass and
   Glassmorphism (from the user's two reference posters).
   Every glass value can be edited later in Settings → Look:
   tint, accent, transparency, blur, soft depth, roundness and a
   solid-surface switch for contrast. Values live in
   state.skinTune[skin] and become CSS custom properties.
   ============================================================ */
const SKINS = {
  crimson:  { name:'Crimson pearl', note:'Crimson, sand and pearl over the painted mountains.' },
  neuglass: { name:'Neumorphic glass', note:'Warm stone glass with soft raised depth: tactile, calm.', def:{ tint:'#D9D1C7', accent:'#8C7B6B', alpha:42, blur:14, depth:70, radius:22, solid:false } },
  frost:    { name:'Glassmorphism', note:'White frosted layers over a cool blue haze: light and airy.', def:{ tint:'#EAF0F6', accent:'#6E93B3', alpha:50, blur:18, depth:45, radius:24, solid:false } }
};
const hexRgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return '200,200,200'; const n = parseInt(m[1], 16); return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`; };
function skinTune(sk = state.skin){ const d = (SKINS[sk] || {}).def; if (!d) return null; return { ...d, ...((state.skinTune || {})[sk] || {}) }; }
function applySkin(){
  const sk = SKINS[state.skin] ? state.skin : 'crimson', root = document.documentElement;
  if (sk === 'crimson'){ root.removeAttribute('data-skin'); root.classList.remove('gt-solid'); return; }
  const t = skinTune(sk);
  root.setAttribute('data-skin', sk);
  let cv = document.getElementById('landscape');
  if (!cv && document.body){ cv = document.createElement('canvas'); cv.id = 'landscape'; cv.setAttribute('aria-hidden','true'); document.body.prepend(cv); }
  if (cv && cv.getContext){ try { cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); } catch(_){} }
  root.style.setProperty('--gt-tint', t.tint); root.style.setProperty('--gt-tint-rgb', hexRgb(t.tint));
  root.style.setProperty('--gt-accent', t.accent); root.style.setProperty('--gt-accent-rgb', hexRgb(t.accent));
  root.style.setProperty('--gt-alpha', (t.solid ? 88 : t.alpha) / 100); root.style.setProperty('--gt-blur', (t.solid ? 0 : t.blur) + 'px');
  root.style.setProperty('--gt-depth', t.depth / 100); root.style.setProperty('--gt-radius', t.radius + 'px');
  root.classList.toggle('gt-solid', !!t.solid);
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta && root.getAttribute('data-theme') !== 'dark') meta.setAttribute('content', t.tint);
}
applyTheme = (orig => function(){ orig(); applySkin(); })(applyTheme);
paintLandscape = (orig => function(){ if (state.skin && state.skin !== 'crimson') return; orig(); })(paintLandscape);

/* ---------- settings controls in the style of the reference poster ---------- */
function skinPickHTML(){
  const cur = SKINS[state.skin] ? state.skin : 'crimson';
  return `<div class="sk-pick" role="radiogroup" aria-label="Style">${Object.entries(SKINS).map(([id, s]) => `<button role="radio" aria-checked="${cur === id}" class="sk-opt sk-${id}${cur === id ? ' on' : ''}" data-sk="pick" data-id="${id}"><span class="sk-sw"><i></i><i></i><i></i></span><b>${s.name}</b><small>${s.note}</small></button>`).join('')}</div>`;
}
function skinSlider(icon, label, key, val, min, max, unit){
  const pct = (val - min) / (max - min);
  return `<label class="sk-sl"><span class="sk-ic">${ic(icon, 18)}</span><span class="sk-lb">${label}</span><b class="num" data-sk-val="${key}">${val}${unit}</b>
    <input type="range" min="${min}" max="${max}" value="${val}" data-sk-r="${key}" data-unit="${unit}" style="--v:${pct.toFixed(3)}" aria-label="${label}"></label>`;
}
function skinTuneHTML(){
  const sk = SKINS[state.skin] ? state.skin : 'crimson', t = skinTune(sk);
  if (!t) return `<p class="set-note">Pick Neumorphic glass or Glassmorphism to tune the glass. Crimson pearl keeps its painted landscape.</p>`;
  return `<div class="sk-tune">
    <div class="sk-colors"><label><input type="color" value="${t.tint}" data-sk-c="tint" aria-label="Glass tint"><span>Background tint</span></label><label><input type="color" value="${t.accent}" data-sk-c="accent" aria-label="Accent colour"><span>Accent</span></label></div>
    ${skinSlider('sun', 'Transparency', 'alpha', t.alpha, 10, 90, '%')}
    ${skinSlider('wave', 'Blur', 'blur', t.blur, 0, 20, 'px')}
    ${skinSlider('cube', 'Soft depth', 'depth', t.depth, 0, 100, '%')}
    ${skinSlider('radial', 'Roundness', 'radius', t.radius, 10, 32, 'px')}
    ${setToggle('Solid surfaces', 'gtSolid', t.solid, 'More contrast: removes the see-through and blur')}
    <div class="sk-prev glass"><small>Preview</small><b class="num">${(() => { try { const s = periodStats(dkey(addDays(new Date(), -6)), dkey()); return s.pct + '%'; } catch(_){ return '–'; } })()}</b><span class="tiny">tasks done this week</span><div class="sk-bars">${[.3,.45,.55,.4,.7,.62,.9].map(h => `<i style="--h:${h}"></i>`).join('')}</div></div>
    <button class="set-btn sm" data-sk="reset">${ic('rotate', 14)} Reset ${SKINS[sk].name.toLowerCase()}</button>
  </div>`;
}
function skinSet(key, v){ const sk = state.skin; state.skinTune = state.skinTune || {}; state.skinTune[sk] = { ...(state.skinTune[sk] || {}), [key]: v }; save(); applySkin(); }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sk]'); if (!b) return; e.stopPropagation();
  if (b.dataset.sk === 'pick'){ state.skin = b.dataset.id; save(); applyTheme(); const body = document.getElementById('setBody'); if (body) body.innerHTML = setBody('look'); if (typeof mountRail === 'function') mountRail(); toast(`${SKINS[state.skin].name} on.`, 'ok', 1400); }
  if (b.dataset.sk === 'reset'){ if (state.skinTune) delete state.skinTune[state.skin]; save(); applySkin(); const body = document.getElementById('setBody'); if (body) body.innerHTML = setBody('look'); }
}, true);
document.addEventListener('input', e => {
  const r = e.target.closest('[data-sk-r]'); if (r){ const v = +r.value, k = r.dataset.skR; r.style.setProperty('--v', ((v - r.min) / (r.max - r.min)).toFixed(3)); const out = document.querySelector(`[data-sk-val="${k}"]`); if (out) out.textContent = v + r.dataset.unit; skinSet(k, v); return; }
  const c = e.target.closest('[data-sk-c]'); if (c) skinSet(c.dataset.skC, c.value);
}, true);
