/* ============================================================
   FLOW · motion inside a tab (20 Nov 2026)
   He said the app felt "too solid": every tap redrew the whole tab and
   replayed the section fade-in from blank, like a reload. Now:
   - Opening a tab still cascades the sections in (renderView as before).
   - Redrawing the tab you are on (after a tick, a move, an add) keeps the
     page still and animates only what changed: items that moved glide to
     their new place (FLIP, spring easing), items whose state changed give
     a small pop, new items rise in.
   - Anything pressable sinks a little under the finger and springs back.
   All of it uses the Web Animations API on the `scale` / `translate`
   properties, so it never fights the elements' own CSS transitions, and
   it is skipped when motion is reduced (motionOff()).
   ============================================================ */
const FLOW = { tab: null, ease: 'cubic-bezier(.22,1.25,.36,1)' };

function flowKey(el){
  if (el.id) return '#' + el.id;
  const d = el.dataset; if (d.flip) return 'f:' + d.flip;
  const id = d.id || d.k || d.key || d.blk || d.pbCard || d.lk || d.brOpen;
  if (!id) return null;
  return (d.a || d.ds || d.pb || '') + '|' + (el.classList[0] || el.tagName) + '|' + id;
}
function flowSnap(root){
  const out = new Map(), H = innerHeight;
  root.querySelectorAll('[id],[data-id],[data-k],[data-key],[data-flip],[data-blk],[data-pb-card],[data-lk],[data-br-open]').forEach(el => {
    const k = flowKey(el); if (!k || out.has(k)) return;
    const r = el.getBoundingClientRect(); if (r.bottom < -150 || r.top > H + 150 || !r.width) return;
    out.set(k, { x: r.left, y: r.top, c: el.className, t: el.textContent.length > 400 ? '' : el.textContent });
  });
  return out;
}
function flowPlay(root, before){
  const H = innerHeight, seen = new Set(); let n = 0;
  root.querySelectorAll('[id],[data-id],[data-k],[data-key],[data-flip],[data-blk],[data-pb-card],[data-lk],[data-br-open]').forEach(el => {
    if (n > 60) return; const k = flowKey(el); if (!k || seen.has(k)) return; seen.add(k);
    // only the outermost keyed element moves, so children do not double up
    if (el.parentElement && el.parentElement.closest('[data-flowing]') ) return;
    const r = el.getBoundingClientRect(); if (r.bottom < -100 || r.top > H + 100 || !r.width) return;
    const b = before.get(k);
    if (!b){ if (before.size){ el.animate([{ opacity: 0, translate: '0 10px', scale: '.97' }, { opacity: 1, translate: '0 0', scale: '1' }], { duration: 380, easing: FLOW.ease, delay: Math.min(n, 8) * 22 }); n++; } return; }
    const dx = b.x - r.left, dy = b.y - r.top;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2){
      el.setAttribute('data-flowing', ''); n++;
      const a = el.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], { duration: 520, easing: FLOW.ease });
      a.onfinish = a.oncancel = () => el.removeAttribute('data-flowing');
    } else if (b.c !== el.className || (b.t && b.t !== el.textContent)){
      n++; el.animate([{ scale: '1' }, { scale: '1.045' }, { scale: '1' }], { duration: 360, easing: 'cubic-bezier(.3,1.5,.5,1)' });
    }
  });
}
renderView = (orig => function(tab){
  const el = document.getElementById('view-' + tab);
  const again = el && FLOW.tab === tab && el.childElementCount > 0 && !motionOff() && !el.hidden;
  FLOW.tab = tab;
  if (!again) return orig.apply(this, arguments);
  const before = flowSnap(el), y = scrollY;
  const r = orig.apply(this, arguments);
  el.classList.remove('cascade');                    // no reload-style replay inside the tab
  if (Math.abs(scrollY - y) > 1) scrollTo(0, y);
  try { flowPlay(el, before); } catch(_){ }
  return r;
})(renderView);
// switching tabs always enters with the cascade
setTab = (orig => function(tab, opts){ if (tab !== activeTab) FLOW.tab = null; return orig.apply(this, arguments); })(setTab);

/* press feedback: sink under the finger, spring back on release */
const FLOW_PRESS = 'button, [data-a], [role="button"], [role="tab"], [role="radio"], .btn, .chip, .pb-card, .wg-chip, .task, a[href]';
let flowPressed = null;
document.addEventListener('pointerdown', e => {
  if (motionOff() || e.button > 0) return;
  const el = e.target.closest(FLOW_PRESS); if (!el || el.disabled || el.closest('input, textarea, select, canvas, .km')) return;
  const r = el.getBoundingClientRect(), big = r.width * r.height > innerWidth * 160;
  flowPressed = { el, a: el.animate([{ scale: '1' }, { scale: big ? '.985' : '.95' }], { duration: 110, easing: 'ease-out', fill: 'forwards' }) };
}, { passive: true, capture: true });
const flowRelease = () => { const p = flowPressed; if (!p) return; flowPressed = null;
  const from = getComputedStyle(p.el).scale; p.a.cancel();
  if (p.el.isConnected) p.el.animate([{ scale: from === 'none' ? '1' : from }, { scale: '1' }], { duration: 420, easing: 'cubic-bezier(.3,1.6,.5,1)' }); };
['pointerup', 'pointercancel', 'pointerleave', 'dragstart'].forEach(t => document.addEventListener(t, e => { if (t === 'pointerleave' && e.target !== document.documentElement) return; flowRelease(); }, { passive: true, capture: true }));
window.addEventListener('blur', flowRelease);
