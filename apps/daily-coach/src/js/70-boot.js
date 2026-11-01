/* ============================================================
   AMBIENT MOTES — a few slow flakes of light in the field
   ============================================================ */
function lowPower(){
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  return cores <= 4 || mem <= 4;
}
function buildMotes(){
  const host = $('#motes');
  if (!host || motionOff() || lowPower()) return;
  host.innerHTML = '';
  const n = window.innerWidth < 480 ? 7 : 11;
  for (let i=0;i<n;i++){
    const m = document.createElement('i');
    const size = 1.6 + Math.random()*2.6;
    m.style.left = (Math.random()*100).toFixed(1)+'%';
    m.style.width = size.toFixed(1)+'px';
    m.style.height = size.toFixed(1)+'px';
    m.style.animationDuration = (26 + Math.random()*30).toFixed(0)+'s';
    m.style.animationDelay = (-Math.random()*40).toFixed(0)+'s';
    m.style.setProperty('--mx2', (Math.random()*60-30).toFixed(0)+'px');
    host.appendChild(m);
  }
}

/* ============================================================
   BOOT
   ============================================================ */
function boot(){
  applyTheme(); applyMotion();
  buildTabbar();
  // hydrate any static icon slots written as <span data-ic="name">
  $$('[data-ic]').forEach(el=>{ el.innerHTML = ic(el.dataset.ic, 15); });
  $('#hero').innerHTML = heroHTML(activeTab);
  renderView(activeTab);
  $('#fabwrap').style.display = 'none';
  buildMotes();
  requestAnimationFrame(()=>{ moveLens(); });
  updateChrome();
  onScroll();
  // keep the view fresh across midnight
  let dayAtBoot = dkey();
  setInterval(()=>{
    if (dkey() !== dayAtBoot){ dayAtBoot = dkey(); setTab(activeTab,{force:true}); }
    updateChrome();
  }, 60000);
  window.addEventListener('resize', ()=>moveLens());
  if (!storageOK){
    setTimeout(()=>toast('Preview mode: this frame blocks saving. Download the file and open it normally to keep your data.','warn',7000), 900);
  }
  // gentle first-run nudge
  if (!state.seen.coach && storageOK){
    state.seen.coach = true; save();
    setTimeout(()=>toast('Tap any task to tick it. Four tasks makes a streak day.','ok',4200), 1400);
  }
}
boot();

