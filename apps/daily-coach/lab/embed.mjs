/**
 * Turns lab/lab.html (the standalone Mechanical Engineering Lab page) into the
 * version that runs inside the Daily Coach "Lab" tab, in an iframe (srcdoc).
 * Each patch must apply exactly once or the build fails.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const vendor = f => readFileSync(resolve(here, 'vendor', f), 'utf8');

export function embedLab(src){
  let s = src;
  const rep = (from, to) => {
    const n = s.split(from).length - 1;
    if (n !== 1) throw new Error(`lab embed: expected 1 match, found ${n}: ${from.slice(0,70)}`);
    s = s.replace(from, typeof to === 'function' ? to : to);
  };
  // no link back to the coach: we are inside it
  s = s.replace(/<a class="levelchip coachlink"[^>]*>[^<]*<\/a>/, '');
  // let the coach's background show through the frame
  rep('</style>', 'html,body{background:transparent!important}\n</style>');
  // save to this browser (same storage as the coach) when there is no artifact database
  rep('/* ============================== STORAGE ============================== */', `/* ============================== STORAGE ============================== */
const LKEY="dailycoach.lab.v1"; let LOCAL_OK=false;
try{ localStorage.setItem(LKEY+".t","1"); localStorage.removeItem(LKEY+".t"); LOCAL_OK=true; }catch(e){}
function localSave(){ if(!LOCAL_OK) return; try{ localStorage.setItem(LKEY, JSON.stringify({userMaterials:S.userMaterials,userTrends:S.userTrends,runs:S.runs,userCerts:S.userCerts,careerStatus:S.careerStatus,hireStatus:S.hireStatus,progress:{done:P.done,quiz:P.quiz,free:P.free}})); }catch(e){} }
function localLoad(){ if(!LOCAL_OK) return; let d=null; try{ d=JSON.parse(localStorage.getItem(LKEY)||"null"); }catch(e){} if(!d) return;
  const before=level(); ["userMaterials","userTrends","runs","userCerts"].forEach(k=>{ if(Array.isArray(d[k])) S[k]=d[k]; });
  if(d.careerStatus) S.careerStatus=d.careerStatus; if(d.hireStatus) S.hireStatus=d.hireStatus;
  if(d.progress){ P.done=d.progress.done||{}; P.quiz=d.progress.quiz||{}; P.free=!!d.progress.free; const fm=$("#freeMode"); if(fm) fm.checked=P.free; }
  afterProgress(before); renderAllData(); renderCareer(); if(S.tab==="tests") renderTests(); }`);
  rep('const dot=$("#storeDot"), t=$("#storeText");', 'const dot=$("#storeDot"), t=$("#storeText");\n  if(kind==="local"){ dot.className="dot ok"; t.textContent="Saved in this browser, with your coach data"; $("#tbData").textContent="Saved on this device"; return; }');
  rep('if(!db){ setStore("none"); }', 'if(!db){ localLoad(); setStore(LOCAL_OK?"local":"none"); }');
  rep('S[key]=S[key].concat([{...rec, id:localId()}]); renderAllData(); return true;', 'S[key]=S[key].concat([{...rec, id:localId()}]); localSave(); renderAllData(); return true;');
  rep('else { S[key]=S[key].filter(x=>x.id!==id); renderAllData(); }', 'else { S[key]=S[key].filter(x=>x.id!==id); localSave(); renderAllData(); }');
  rep('function saveCareer(){\n  if(!S.db) return;', 'function saveCareer(){\n  if(!S.db){ localSave(); return; }');
  rep('function saveProgress(){\n  if(!S.db) return;', 'function saveProgress(){\n  if(!S.db){ localSave(); return; }');
  // keep section links inside the frame; open outside links in a new tab
  rep('if(location.hash!=="#"+tab){ try{ history.replaceState(null,"","#"+tab); }catch(e){ location.hash=tab; } }', 'try{ parent.postMessage({labTab:tab},"*"); }catch(e){}');
  rep('window.addEventListener("hashchange", ()=>go(location.hash.slice(1)));', 'document.addEventListener("click",e=>{ const a=e.target.closest&&e.target.closest("a[href]"); if(!a) return; const h=a.getAttribute("href")||""; if(h.startsWith("#")){ e.preventDefault(); go(h.slice(1)); window.scrollTo(0,0); } else if(/^https?:/i.test(h)){ a.target="_blank"; a.rel="noopener"; } });');
  rep('go(location.hash.slice(1) || "trends");', 'go(window.LAB_START || "trends");');
  // three.js r128 (MIT, lab/vendor) is bundled so the 3D bench works offline; no CDN
  rep('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>', () => '<script>' + vendor('three.min.js') + '</script>');
  rep('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>', () => '<script>' + vendor('OrbitControls.js') + '</script>');
  return s;
}
