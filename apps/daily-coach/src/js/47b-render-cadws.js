/* ============================================================
   CAD WORKSPACE — SolidWorks-style part modelling, no library.
   Features (extruded boss, extruded cut, rib, fillet) rebuild a
   mesh live; a small WebGL renderer draws it with a depth buffer,
   smooth shading, black feature edges and live silhouettes.
   Exercises start with the right feature tree but wrong sizes:
   read the drawing, edit each feature until it matches.
   ============================================================ */

/* ---------- geometry ---------- */
const WS_PLANES = { top:[[1,0,0],[0,1,0],[0,0,1]], front:[[1,0,0],[0,0,1],[0,1,0]], right:[[0,1,0],[0,0,1],[1,0,0]] };
const WS_PLANE_NAME = { top:'Top Plane', front:'Front Plane', right:'Right Plane' };
function wsBasis(plane, angle){
  const [eu,ev,ew] = WS_PLANES[plane] || WS_PLANES.top, a = (angle||0)*Math.PI/180, c = Math.cos(a), s = Math.sin(a);
  return [eu, [ev[0]*c+ew[0]*s, ev[1]*c+ew[1]*s, ev[2]*c+ew[2]*s], [-ev[0]*s+ew[0]*c, -ev[1]*s+ew[1]*c, -ev[2]*s+ew[2]*c]];
}
const wsArea = l => { let s = 0; for (let i=0;i<l.length;i++){ const a = l[i], b = l[(i+1)%l.length]; s += a[0]*b[1]-b[0]*a[1]; } return s/2; };
const wsCircle = (cx,cy,r,n=40) => Array.from({length:n},(_,i)=>{ const a = i/n*Math.PI*2; return [cx+Math.cos(a)*r, cy+Math.sin(a)*r]; });
function wsRoundRect(cx,cy,w,d,r,seg=6){
  r = Math.max(0, Math.min(r||0, w/2-.01, d/2-.01));
  if (r < .05) return [[cx-w/2,cy-d/2],[cx+w/2,cy-d/2],[cx+w/2,cy+d/2],[cx-w/2,cy+d/2]];
  const pts = [];
  [[cx+w/2-r,cy-d/2+r,-Math.PI/2],[cx+w/2-r,cy+d/2-r,0],[cx-w/2+r,cy+d/2-r,Math.PI/2],[cx-w/2+r,cy-d/2+r,Math.PI]].forEach(([x,y,a0])=>{ for (let i=0;i<=seg;i++){ const a = a0+i/seg*Math.PI/2; pts.push([x+Math.cos(a)*r, y+Math.sin(a)*r]); } });
  return pts;
}
function wsProfile(f){
  const w = Math.max(1, +f.w||1), d = Math.max(1, +f.d||1), x = +f.x||0, y = +f.y||0;
  if (f.shape==='circle') return wsCircle(x, y, Math.max(.5, (+f.dia||1)/2));
  if (f.shape==='tri') return [[x,y],[x,y+d],[x-w,y]];
  if (f.shape==='case'){ const h = Math.max(1, +f.h||1); return [[x-w/2,y-h*2/3],[x+w/2,y-h*2/3],[x+w/2,y-h*.1],[x+w*.37,y+h/3],[x-w*.37,y+h/3],[x-w/2,y-h*.1]]; }
  return wsRoundRect(x, y, w, d, +f.r||0);
}
function wsInside(p, poly){ let c = false; for (let i=0,j=poly.length-1;i<poly.length;j=i++){ const a = poly[i], b = poly[j]; if ((a[1]>p[1]) !== (b[1]>p[1]) && p[0] < (b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1]) + a[0]) c = !c; } return c; }
function wsSegDist(p,a,b){ const dx = b[0]-a[0], dy = b[1]-a[1], l = dx*dx+dy*dy || 1; const t = Math.max(0, Math.min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l)); return Math.hypot(p[0]-a[0]-t*dx, p[1]-a[1]-t*dy); }
function wsHoleFits(c, r, poly, others){
  if (!wsInside(c, poly)) return false;
  for (let i=0;i<poly.length;i++) if (wsSegDist(c, poly[i], poly[(i+1)%poly.length]) < r + .5) return false;
  return others.every(o=>Math.hypot(o.c[0]-c[0], o.c[1]-c[1]) > o.r + r + .5);
}

/* polygon with holes -> triangles (hole bridging + ear clipping) */
function wsTriangulate(outer, holes){
  const pts = [], add = l => l.map(p=>{ pts.push(p); return pts.length-1; });
  let ring = add(wsArea(outer) < 0 ? outer.slice().reverse() : outer);
  const hs = holes.map(h=>add(wsArea(h) > 0 ? h.slice().reverse() : h)).sort((a,b)=>Math.max(...b.map(i=>pts[i][0])) - Math.max(...a.map(i=>pts[i][0])));
  const segX = (p,q,a,b) => { const d = (q[0]-p[0])*(b[1]-a[1]) - (q[1]-p[1])*(b[0]-a[0]); if (Math.abs(d) < 1e-12) return false;
    const t = ((a[0]-p[0])*(b[1]-a[1]) - (a[1]-p[1])*(b[0]-a[0]))/d, u = ((a[0]-p[0])*(q[1]-p[1]) - (a[1]-p[1])*(q[0]-p[0]))/d;
    return t > 1e-7 && t < 1-1e-7 && u > 1e-7 && u < 1-1e-7; };
  hs.forEach((h, hi)=>{
    let m = 0; h.forEach((idx,k)=>{ if (pts[idx][0] > pts[h[m]][0]) m = k; });
    const P = pts[h[m]], edges = [], addE = r => r.forEach((a,k)=>edges.push([pts[a], pts[r[(k+1)%r.length]]]));
    addE(ring); hs.slice(hi).forEach(addE);
    let best = -1, bd = 1e18;
    ring.forEach((ri,k)=>{ const Q = pts[ri], d = (Q[0]-P[0])**2 + (Q[1]-P[1])**2; if (d >= bd) return; if (edges.some(([a,b])=>segX(P,Q,a,b))) return; bd = d; best = k; });
    if (best < 0) best = 0;
    const hr = h.slice(m).concat(h.slice(0,m));
    ring = ring.slice(0, best+1).concat(hr, [hr[0]], ring.slice(best));
  });
  const tris = [], V = ring.slice(), cross = (a,b,c) => (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
  const same = (p,q) => p[0]===q[0] && p[1]===q[1];
  const inTri = (p,a,b,c) => cross(a,b,p) > 1e-9 && cross(b,c,p) > 1e-9 && cross(c,a,p) > 1e-9;
  let i = 0, fails = 0;
  while (V.length > 3){
    const n = V.length; i %= n;
    const ia = V[(i-1+n)%n], ib = V[i], ic = V[(i+1)%n], a = pts[ia], b = pts[ib], c = pts[ic];
    let ear = cross(a,b,c) > 1e-9;
    if (ear) for (let j=0;j<n;j++){ const iv = V[j]; if (iv===ia || iv===ib || iv===ic) continue; const p = pts[iv]; if (same(p,a) || same(p,b) || same(p,c)) continue; if (inTri(p,a,b,c)){ ear = false; break; } }
    if (ear){ tris.push(ia, ib, ic); V.splice(i,1); fails = 0; }
    else { i++; if (++fails > n){ tris.push(ia, ib, ic); V.splice(i % V.length, 1); fails = 0; } }
  }
  if (V.length === 3) tris.push(V[0], V[1], V[2]);
  return { pts, tris };
}

/* one extruded solid: caps, smooth-shaded sides, feature edges and silhouette candidates */
function wsSolid(outer, holes, w0, w1, B, out){
  const [eu,ev,ew] = B;
  const P = (u,v,w) => [u*eu[0]+v*ev[0]+w*ew[0], u*eu[1]+v*ev[1]+w*ew[1], u*eu[2]+v*ev[2]+w*ew[2]];
  const N2 = (nu,nv) => [nu*eu[0]+nv*ev[0], nu*eu[1]+nv*ev[1], nu*eu[2]+nv*ev[2]];
  const tri = (a,b,c,na,nb,nc) => { out.pos.push(...a,...b,...c); out.nrm.push(...na,...nb,...nc); };
  const T = wsTriangulate(outer, holes), up = ew, dn = [-ew[0],-ew[1],-ew[2]];
  for (let k=0;k<T.tris.length;k+=3){ const a = T.pts[T.tris[k]], b = T.pts[T.tris[k+1]], c = T.pts[T.tris[k+2]];
    tri(P(a[0],a[1],w1), P(b[0],b[1],w1), P(c[0],c[1],w1), up,up,up); tri(P(a[0],a[1],w0), P(c[0],c[1],w0), P(b[0],b[1],w0), dn,dn,dn); }
  const loops = [wsArea(outer) < 0 ? outer.slice().reverse() : outer, ...holes.map(h=>wsArea(h) > 0 ? h.slice().reverse() : h)];
  loops.forEach(l=>{
    const n = l.length, en = [];
    for (let i=0;i<n;i++){ const a = l[i], b = l[(i+1)%n], dx = b[0]-a[0], dy = b[1]-a[1], L = Math.hypot(dx,dy) || 1; en.push([dy/L, -dx/L]); }
    const vn = i => { const p = en[(i-1+n)%n], q = en[i]; return Math.acos(Math.max(-1, Math.min(1, p[0]*q[0]+p[1]*q[1]))) > .5 ? null : V3.norm(N2(p[0]+q[0], p[1]+q[1])); };
    const sm = l.map((_,i)=>vn(i));
    for (let i=0;i<n;i++){ const j = (i+1)%n, a = l[i], b = l[j], fn = N2(en[i][0], en[i][1]);
      const na = sm[i] || fn, nb = sm[j] || fn;
      const a0 = P(a[0],a[1],w0), b0 = P(b[0],b[1],w0), a1 = P(a[0],a[1],w1), b1 = P(b[0],b[1],w1);
      tri(a0,b0,b1,na,nb,nb); tri(a0,b1,a1,na,nb,na);
      out.edges.push(...a0,...b0,...a1,...b1);
      if (!sm[i]) out.edges.push(...a0,...a1); else out.sil.push([a0, a1, N2(en[(i-1+n)%n][0], en[(i-1+n)%n][1]), fn]);
    }
  });
}

/* feature tree -> model */
function wsBuild(feats){
  const warn = {}, holesFor = {}, parts = [];
  feats.forEach((c, ci)=>{
    if (c.type!=='cut' || c.sup) return;
    const centres = [], n = Math.max(1, Math.round(+c.n||1)), rows = Math.max(1, Math.round(+c.rows||1)), r = Math.max(.5, (+c.dia||1)/2);
    for (let j=0;j<rows;j++) for (let k=0;k<n;k++){ const du = k*(+c.pitch||0), dv = j*(+c.rpitch||0); centres.push(c.dir==='v' ? [(+c.x||0)+dv, (+c.y||0)+du] : [(+c.x||0)+du, (+c.y||0)+dv]); }
    let used = 0;
    feats.slice(0, ci).forEach(b=>{ if (b.type==='cut' || b.sup || b.plane!==c.plane || (+b.angle||0)!==(+c.angle||0)) return;
      const prof = wsProfile(b), list = holesFor[b.id] || (holesFor[b.id] = []);
      centres.forEach(ct=>{ if (wsHoleFits(ct, r, prof, list)){ list.push({ c:ct, r }); used++; } }); });
    if (!used) warn[c.id] = 'These holes miss every solid on this plane. Check the plane, tilt and positions.';
    else if (used < centres.length) warn[c.id] = 'Some holes break through an edge, so they were left out.';
  });
  let vol = 0;
  feats.forEach(f=>{
    if (f.type==='cut' || f.sup) return;
    const prof = wsProfile(f), holes = (holesFor[f.id] || []).map(h=>wsCircle(h.c[0], h.c[1], h.r, h.r > 30 ? 56 : 36));
    const D = Math.max(.5, +f.depth||1), w0 = f.mid ? -D/2 : (+f.off||0), w1 = w0 + D;
    const out = { fid:f.id, pos:[], nrm:[], edges:[], sil:[] };
    try { wsSolid(prof, holes, w0, w1, wsBasis(f.plane, f.angle), out); } catch(e){ warn[f.id] = 'This profile could not be built.'; return; }
    vol += (Math.abs(wsArea(prof)) - (holesFor[f.id]||[]).reduce((s,h)=>s+Math.PI*h.r*h.r, 0)) * D;
    out.pos = new Float32Array(out.pos); out.nrm = new Float32Array(out.nrm); out.edges = new Float32Array(out.edges);
    parts.push(out);
  });
  const mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9];
  parts.forEach(p=>{ for (let i=0;i<p.pos.length;i+=3) for (let k=0;k<3;k++){ mn[k] = Math.min(mn[k], p.pos[i+k]); mx[k] = Math.max(mx[k], p.pos[i+k]); } });
  if (!parts.length){ mn.fill(-50); mx.fill(50); }
  return { parts, warn, vol, b:{ mn, mx, c:[(mn[0]+mx[0])/2,(mn[1]+mx[1])/2,(mn[2]+mx[2])/2], r:Math.max(20, Math.hypot(mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2])/2) } };
}

/* ---------- camera ---------- */
function wsRows(v){ const cy = Math.cos(v.yaw), sy = Math.sin(v.yaw), cp = Math.cos(v.pitch), sp = Math.sin(v.pitch); return [[cy,-sy,0],[sy*sp,cy*sp,cp],[sy*cp,cy*cp,-sp]]; }
function wsMat(v, C, s, W, H, kz){
  const R = wsRows(v), kx = 2*s/W, ky = 2*s/H, d = r => r[0]*C[0]+r[1]*C[1]+r[2]*C[2];
  return new Float32Array([R[0][0]*kx, R[1][0]*ky, R[2][0]*kz, 0, R[0][1]*kx, R[1][1]*ky, R[2][1]*kz, 0, R[0][2]*kx, R[1][2]*ky, R[2][2]*kz, 0,
    -d(R[0])*kx + 2*(v.panX||0)/W, -d(R[1])*ky + 2*(v.panY||0)/H, -d(R[2])*kz, 1]);
}
const wsR3 = R => new Float32Array([R[0][0],R[1][0],R[2][0], R[0][1],R[1][1],R[2][1], R[0][2],R[1][2],R[2][2]]);

/* ---------- WebGL renderer (one per canvas) ---------- */
const WS_VS = 'attribute vec3 p;attribute vec3 n;uniform mat4 M;uniform mat3 R;varying vec3 vn;void main(){gl_Position=M*vec4(p,1.);vn=R*n;}';
const WS_FS = 'precision mediump float;varying vec3 vn;uniform vec3 col;uniform float flat_;uniform float a;void main(){vec3 N=normalize(vn);if(N.z>0.)N=-N;vec3 L=normalize(vec3(-.45,.62,-.64));vec3 L2=normalize(vec3(.7,-.15,-.5));vec3 H=normalize(L+vec3(0.,0.,-1.));float d=max(dot(N,L),0.);float d2=max(dot(N,L2),0.);float s=pow(max(dot(N,H),0.),40.);float rim=pow(1.-abs(N.z),3.);vec3 c=col*(.36+.56*d+.2*d2)+vec3(.3)*s+vec3(.06)*rim;if(flat_>.5)c=col;gl_FragColor=vec4(c,a);}';
const WS_LVS = 'attribute vec3 p;uniform mat4 M;void main(){gl_Position=M*vec4(p,1.);}';
const WS_LFS = 'precision mediump float;uniform vec4 col;void main(){gl_FragColor=col;}';
const WS_FVS = 'attribute vec3 p;attribute vec2 q;uniform mat4 M;varying vec2 u;void main(){gl_Position=M*vec4(p,1.);u=q;}';
const WS_FFS = 'precision mediump float;varying vec2 u;uniform float a;void main(){float r=length(u);gl_FragColor=vec4(0.,0.,0.,a*(1.-smoothstep(.1,1.,r)));}';
function wsRenderer(cv){
  let gl = null; try { gl = cv.getContext('webgl', { antialias:true, alpha:true, premultipliedAlpha:false, preserveDrawingBuffer:true }); } catch(e){}
  if (!gl) return null;
  const sh = (t,src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = (vs,fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    const u = {}; ['M','R','col','flat_','a'].forEach(k=>u[k] = gl.getUniformLocation(p, k)); return { p, u, ap:gl.getAttribLocation(p,'p'), an:gl.getAttribLocation(p,'n'), aq:gl.getAttribLocation(p,'q') }; };
  const F = prog(WS_VS, WS_FS), L = prog(WS_LVS, WS_LFS), FL = prog(WS_FVS, WS_FFS);
  const buf = data => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; };
  const silBuf = gl.createBuffer(), floorBuf = gl.createBuffer();
  let parts = [], model = null;
  const R = {
    gl,
    upload(m){ parts.forEach(p=>{ gl.deleteBuffer(p.bp); gl.deleteBuffer(p.bn); gl.deleteBuffer(p.be); }); model = m;
      parts = m.parts.map(p=>({ fid:p.fid, bp:buf(p.pos), bn:buf(p.nrm), be:buf(p.edges), n:p.pos.length/3, ne:p.edges.length/3, sil:p.sil, src:p })); },
    draw(o){ // o: { v, C, s, W, H, mode, colOf(fid), edgeOf(fid), dpr }
      const W = o.W, H = o.H; cv.width !== Math.round(W*o.dpr) && (cv.width = Math.round(W*o.dpr), cv.height = Math.round(H*o.dpr));
      gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (!model) return;
      const b = model.b, kz = 1/(Math.max(b.r, 50)*6), M = wsMat(o.v, o.C, o.s, W, H, kz), Rw = wsRows(o.v), R3 = wsR3(Rw);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      // soft floor shadow
      if (o.shadow !== false && o.mode !== 'wire'){
        const z = b.mn[2] - .5, e = b.r*1.25, cx = b.c[0], cy = b.c[1];
        gl.bindBuffer(gl.ARRAY_BUFFER, floorBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([cx-e,cy-e,z,-1,-1, cx+e,cy-e,z,1,-1, cx+e,cy+e,z,1,1, cx-e,cy-e,z,-1,-1, cx+e,cy+e,z,1,1, cx-e,cy+e,z,-1,1]), gl.DYNAMIC_DRAW);
        gl.useProgram(FL.p); gl.uniformMatrix4fv(FL.u.M, false, M); gl.uniform1f(FL.u.a, o.dark ? .55 : .22); gl.disable(gl.DEPTH_TEST);
        gl.enableVertexAttribArray(FL.ap); gl.vertexAttribPointer(FL.ap, 3, gl.FLOAT, false, 20, 0); gl.enableVertexAttribArray(FL.aq); gl.vertexAttribPointer(FL.aq, 2, gl.FLOAT, false, 20, 12);
        gl.drawArrays(gl.TRIANGLES, 0, 6); gl.disableVertexAttribArray(FL.aq);
      }
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
      if (o.mode !== 'wire'){
        gl.useProgram(F.p); gl.uniformMatrix4fv(F.u.M, false, M); gl.uniformMatrix3fv(F.u.R, false, R3); gl.uniform1f(F.u.a, 1); gl.uniform1f(F.u.flat_, o.mode==='hlv' ? 1 : 0);
        gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.2, 1.2);
        parts.forEach(p=>{ gl.uniform3fv(F.u.col, o.mode==='hlv' ? (o.dark ? [.16,.15,.15] : [1,1,1]) : o.colOf(p.fid));
          gl.bindBuffer(gl.ARRAY_BUFFER, p.bp); gl.enableVertexAttribArray(F.ap); gl.vertexAttribPointer(F.ap, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, p.bn); gl.enableVertexAttribArray(F.an); gl.vertexAttribPointer(F.an, 3, gl.FLOAT, false, 0, 0);
          gl.drawArrays(gl.TRIANGLES, 0, p.n); });
        gl.disableVertexAttribArray(F.an); gl.disable(gl.POLYGON_OFFSET_FILL);
      }
      if (o.mode === 'shaded' && !o.edgesAlways) return;
      // edges + live silhouettes
      gl.useProgram(L.p); gl.uniformMatrix4fv(L.u.M, false, M);
      const sil = []; const vd = Rw[2];
      parts.forEach(p=>{ const s = []; p.sil.forEach(([a,c,n1,n2])=>{ const s1 = n1[0]*vd[0]+n1[1]*vd[1]+n1[2]*vd[2], s2 = n2[0]*vd[0]+n2[1]*vd[1]+n2[2]*vd[2]; if (s1*s2 < 0) s.push(...a,...c); }); sil.push(s); });
      const pass = (hidden) => {
        parts.forEach((p,i)=>{ const ec = hidden ? (o.dark ? [.7,.66,.62,.35] : [.45,.45,.48,.45]) : o.edgeOf(p.fid); gl.uniform4fv(L.u.col, ec);
          gl.bindBuffer(gl.ARRAY_BUFFER, p.be); gl.enableVertexAttribArray(L.ap); gl.vertexAttribPointer(L.ap, 3, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.LINES, 0, p.ne);
          if (sil[i].length){ gl.bindBuffer(gl.ARRAY_BUFFER, silBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sil[i]), gl.DYNAMIC_DRAW); gl.vertexAttribPointer(L.ap, 3, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.LINES, 0, sil[i].length/3); } });
      };
      if (o.mode === 'wire'){ gl.disable(gl.DEPTH_TEST); pass(false); return; }
      if (o.mode === 'hlv'){ gl.depthFunc(gl.GREATER); gl.depthMask(false); pass(true); gl.depthMask(true); gl.depthFunc(gl.LEQUAL); }
      pass(false);
    }
  };
  return R;
}

/* ---------- exercises ---------- */
const WS_EX = {
  bracket:{ name:'L-bracket', part:'MB-01 L-bracket', mat:'Steel', rho:7.85, about:'A bent-plate bracket with a stiffening gusset. Start with the base, then the upright, the rib and the two hole patterns.',
    feats:[
      { id:'f1', type:'boss', name:'Base plate', plane:'top', shape:'rect', x:60, y:30, w:120, d:60, r:0, off:0, depth:8 },
      { id:'f2', type:'boss', name:'Upright', plane:'front', shape:'rect', x:60, y:34, w:120, d:52, r:0, off:52, depth:8 },
      { id:'f3', type:'rib', name:'Gusset', plane:'right', shape:'tri', x:52, y:8, w:32, d:32, off:56, depth:8 },
      { id:'f4', type:'cut', name:'Base holes', plane:'top', dia:12, x:25, y:24, n:2, pitch:70, dir:'u' },
      { id:'f5', type:'cut', name:'Upright holes', plane:'front', dia:12, x:30, y:40, n:2, pitch:60, dir:'u' } ] },
  bush:{ name:'Flanged bush', part:'FB-20 flanged bush', mat:'Bronze', rho:8.8, about:'A turned bush: flange, body, a through bore and two fixing holes in the flange.',
    feats:[
      { id:'f1', type:'boss', name:'Flange', plane:'top', shape:'circle', x:0, y:0, dia:60, off:0, depth:8 },
      { id:'f2', type:'boss', name:'Body', plane:'top', shape:'circle', x:0, y:0, dia:36, off:8, depth:32 },
      { id:'f3', type:'cut', name:'Bore', plane:'top', dia:20, x:0, y:0, n:1, pitch:0, dir:'u' },
      { id:'f4', type:'cut', name:'Flange holes', plane:'top', dia:6, x:-24, y:0, n:2, pitch:48, dir:'u' } ] },
  pillow:{ name:'Pillow block', part:'PB-40 bearing housing', mat:'Cast iron', rho:7.2, about:'A bearing housing: base with rounded corners, pedestal, round housing, the bearing bore and two fixing holes.',
    feats:[
      { id:'f1', type:'boss', name:'Base', plane:'top', shape:'rect', x:0, y:0, w:140, d:40, r:6, off:0, depth:12 },
      { id:'f2', type:'boss', name:'Pedestal', plane:'front', shape:'rect', x:0, y:19, w:70, d:18, r:0, off:-20, depth:40 },
      { id:'f3', type:'boss', name:'Housing', plane:'front', shape:'circle', x:0, y:50, dia:70, off:-20, depth:40 },
      { id:'f4', type:'cut', name:'Bearing bore', plane:'front', dia:40, x:0, y:50, n:1, pitch:0, dir:'u' },
      { id:'f5', type:'cut', name:'Fixing holes', plane:'top', dia:11, x:-55, y:0, n:2, pitch:110, dir:'u' } ] },
  vblock:{ name:'V4 engine block', part:'V4-90 cylinder block', mat:'Cast iron', rho:7.2, about:'From your engine-block drawing: crankcase extruded mid-plane, crank bore, two banks on planes tilted ±45° (a 90° V), four bores per bank and a sump flange.',
    feats:[
      { id:'f1', type:'boss', name:'Crankcase', plane:'right', shape:'case', x:0, y:0, w:300, h:210, mid:true, depth:480 },
      { id:'f2', type:'cut', name:'Crank bore', plane:'right', dia:110, x:0, y:0, n:1, pitch:0, dir:'u' },
      { id:'f3', type:'boss', name:'Left bank', plane:'top', angle:45, shape:'rect', x:0, y:0, w:470, d:150, r:0, off:40, depth:170 },
      { id:'f4', type:'boss', name:'Right bank', plane:'top', angle:-45, shape:'rect', x:0, y:0, w:470, d:150, r:0, off:40, depth:170 },
      { id:'f5', type:'cut', name:'Left bores', plane:'top', angle:45, dia:90, x:-165, y:0, n:4, pitch:110, dir:'u' },
      { id:'f6', type:'cut', name:'Right bores', plane:'top', angle:-45, dia:90, x:-165, y:0, n:4, pitch:110, dir:'u' },
      { id:'f7', type:'boss', name:'Sump flange', plane:'top', shape:'rect', x:0, y:0, w:520, d:320, r:20, off:-154, depth:14 } ] },
  free:{ name:'Free model', part:'Part1', mat:'Steel', rho:7.85, about:'A blank part. Add bosses, cuts and ribs from the toolbar and edit them however you like.', free:true,
    feats:[ { id:'f1', type:'boss', name:'Boss-Extrude1', plane:'top', shape:'rect', x:0, y:0, w:100, d:60, r:0, off:0, depth:20 } ] }
};
const WS_KEYS = { boss:{ rect:['w','d','r','depth','off'], circle:['dia','depth','off'], case:['w','h','depth'], tri:['w','d','depth','off'] }, cut:['dia','x','y','n','pitch'] };
function wsKeys(f){ if (f.type==='cut') return WS_KEYS.cut; const k = (WS_KEYS.boss[f.shape] || WS_KEYS.boss.rect).slice(); if (f.mid) return k.filter(x=>x!=='off'); return k; }
function wsRough(f, i){ // the starting model: right features, wrong sizes
  const g = JSON.parse(JSON.stringify(f));
  wsKeys(f).forEach((k,j)=>{ if (k==='x' || k==='y' || k==='n' || k==='off' || (k==='r' && !f.r)) return;
    const up = (i + j) % 2 === 0, v = +f[k]; if (!v) return;
    let nv = k==='dia' && f.type==='cut' ? v*.75 : k==='pitch' ? v*(up ? 1.08 : .92) : v*(up ? 1.18 : .86);
    nv = v >= 40 ? Math.round(nv/5)*5 : Math.round(nv); if (nv === v) nv = v + (up ? 2 : -2); g[k] = Math.max(1, nv); });
  return g;
}
const wsClone = o => JSON.parse(JSON.stringify(o));

/* ---------- state ---------- */
const WS = { ex:'bracket', feats:[], model:null, sel:null, edit:null, snap:null, undo:[], redo:[], mode:'se', full:false,
  v:{ yaw:-.75, pitch:.5, zoom:1, panX:0, panY:0 }, t:{ yaw:-.75, pitch:.5, zoom:1, panX:0, panY:0 }, fitC:[0,0,0], fitR:100,
  R:null, raf:0, vis:false, io:null, drag:null, ptr:new Map(), dirty:true, sheetR:null };
function wsStore(){ if (!state.cadws || typeof state.cadws !== 'object') state.cadws = { ex:'bracket', models:{}, done:{} }; state.cadws.models = state.cadws.models || {}; state.cadws.done = state.cadws.done || {}; return state.cadws; }
function wsLoad(ex){
  const st = wsStore(); WS.ex = WS_EX[ex] ? ex : 'bracket'; st.ex = WS.ex;
  const saved = st.models[WS.ex];
  WS.feats = saved && saved.length ? wsClone(saved) : WS_EX[WS.ex].feats.map((f,i)=>WS_EX[WS.ex].free ? wsClone(f) : wsRough(f, i));
  WS.sel = null; WS.edit = null; WS.snap = null; WS.undo = []; WS.redo = [];
  wsRebuild(); wsFit(true);
}
function wsSave(){ const st = wsStore(); st.models[WS.ex] = wsClone(WS.feats); save(); }
function wsRebuild(){ WS.model = wsBuild(WS.feats); if (WS.R) WS.R.upload(WS.model); WS.dirty = true; wsKick(); }
function wsPush(){ WS.undo.push(wsClone(WS.feats)); if (WS.undo.length > 40) WS.undo.shift(); WS.redo = []; }
function wsFeat(id){ return WS.feats.find(f=>f.id===id); }
function wsFit(now){ const b = WS.model.b; WS.fitC = b.c.slice(); WS.fitR = b.r; Object.assign(WS.t, { zoom:1, panX:0, panY:0 }); if (now) Object.assign(WS.v, { zoom:1, panX:0, panY:0 }); WS.dirty = true; wsKick(); }

/* ---------- matching against the drawing ---------- */
function wsMatch(){
  const ex = WS_EX[WS.ex]; if (ex.free) return null;
  const res = {}; let ok = 0;
  ex.feats.forEach(tf=>{ const uf = wsFeat(tf.id); const good = !!uf && !uf.sup && uf.plane===tf.plane && (+uf.angle||0)===(+tf.angle||0) && (uf.shape||'')===(tf.shape||'') && wsKeys(tf).every(k=>Math.abs((+uf[k]||0) - (+tf[k]||0)) <= .6); res[tf.id] = good; if (good) ok++; });
  const extra = WS.feats.filter(f=>!f.sup && !ex.feats.some(t=>t.id===f.id)).length;
  return { res, ok, total:ex.feats.length, extra, done: ok===ex.feats.length && !extra };
}

/* ---------- icons ---------- */
const WS_IC = {
  boss:'<path d="M4 15l8 4 8-4M4 15V9l8-4 8 4v6M4 9l8 4 8-4M12 13v6"/><path d="M12 2v5M10 4l2-2 2 2" stroke-width="1.6"/>',
  cut:'<path d="M4 9l8-4 8 4v6l-8 4-8-4z"/><ellipse cx="12" cy="9.5" rx="3" ry="1.6"/><path d="M12 9.5v6" stroke-dasharray="1.5 1.5"/>',
  rib:'<path d="M4 19h16M6 19V6M6 6l11 13"/><path d="M8 19v-3"/>',
  fillet:'<path d="M5 19V11a6 6 0 0 1 6-6h8"/><path d="M5 19h14" stroke-dasharray="2 2"/>',
  undo:'<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12" transform="translate(0 -6)"/>',
  redo:'<path d="M15 7l5 5-5 5"/><path d="M20 12H10a6 6 0 0 0 0 12" transform="translate(0 -6)"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', x:'<path d="M6 6l12 12M18 6 6 18"/>',
  fit:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><circle cx="12" cy="12" r="3"/>', zin:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8v6M8 11h6"/>', zout:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M8 11h6"/>',
  cube:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  se:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" fill="currentColor" fill-opacity=".25"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  shaded:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" fill="currentColor" fill-opacity=".45" stroke="none"/>',
  hlv:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" stroke-dasharray="2 2"/>',
  wire:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5M12 3v9M4 16.5l8-4.5 8 4.5"/>',
  expand:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', shrink:'<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  eye:'<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>', eyeoff:'<path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.2 7.4C3.6 9.2 2 12 2 12s3.5 6 10 6a9.6 9.6 0 0 0 4.1-.9"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  plane:'<path d="M3 16l5-9h13l-5 9z"/>', origin:'<path d="M12 4v16M4 12h16"/><circle cx="12" cy="12" r="2.5"/>', part:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/>',
  sheet:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>', answer:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2h5c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>'
};
const wsi = (k, s=17) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${WS_IC[k]||''}</svg>`;
const WS_TYPE_ICON = { boss:'boss', cut:'cut', rib:'rib' };
const wsFeatLabel = f => ({ boss:'Boss-Extrude', cut:'Cut-Extrude', rib:'Rib' }[f.type] || 'Feature') + (WS.feats.filter(x=>x.type===f.type).indexOf(f) + 1);

/* ---------- HTML ---------- */
function cwsHTML(){
  if (!WS.model) wsLoad(wsStore().ex || 'bracket');
  const ex = WS_EX[WS.ex], st = wsStore();
  return `<div class="glass cws${WS.full?' full':''}" id="cws">
    <div class="cws-head"><div><div class="h3">CAD workspace</div><div class="tiny">Model parts like in SolidWorks: rotate, pan, zoom, edit every feature, then check it against the drawing.</div></div><span class="chip-live">3D</span></div>
    <div class="cws-exs" role="tablist" aria-label="Exercises">${Object.entries(WS_EX).map(([k,v])=>`<button role="tab" aria-selected="${k===WS.ex}" data-w="ex" data-id="${k}">${st.done[k]?`<i class="cws-done">${wsi('check',12)}</i>`:''}${esc(v.name)}</button>`).join('')}</div>
    <div class="cws-app" id="cwsApp">
      <div class="cws-cmd" role="toolbar" aria-label="Features">
        <span class="cws-tab">Features</span>
        <button data-w="add" data-id="boss" title="Extruded Boss/Base">${wsi('boss',20)}<span>Extruded<br>Boss/Base</span></button>
        <button data-w="add" data-id="cut" title="Extruded Cut">${wsi('cut',20)}<span>Extruded<br>Cut</span></button>
        <button data-w="add" data-id="rib" title="Rib">${wsi('rib',20)}<span>Rib</span></button>
        <button data-w="fillet" title="Fillet the corners of the selected boss">${wsi('fillet',20)}<span>Fillet</span></button>
        <i class="cws-sep"></i>
        <button data-w="undo" title="Undo (Ctrl+Z)">${wsi('undo',18)}<span>Undo</span></button>
        <button data-w="redo" title="Redo (Ctrl+Y)">${wsi('redo',18)}<span>Redo</span></button>
        ${ex.free ? '' : `<i class="cws-sep"></i><button data-w="check" class="cws-checkb" title="Check the model against the drawing">${wsi('sheet',18)}<span>Check vs<br>drawing</span></button><button data-w="answer" title="Show the answer">${wsi('answer',18)}<span>Show<br>answer</span></button>`}
      </div>
      <div class="cws-main">
        <aside class="cws-side" id="cwsSide">${cwsSideHTML()}</aside>
        <div class="cws-vp" id="cwsVp" tabindex="0" aria-label="3D viewport. Drag to rotate, right-drag or Shift-drag to pan, scroll or pinch to zoom, tap a face to select its feature, double-tap to edit it. Arrow keys rotate, plus and minus zoom, F fits.">
          <canvas id="cwsGL"></canvas><canvas id="cwsOv" aria-hidden="true"></canvas>
          <div class="cws-hud" role="toolbar" aria-label="View">
            <button data-w="fit" title="Zoom to fit (F)">${wsi('fit')}</button><button data-w="zoom" data-id="1" title="Zoom in">${wsi('zin')}</button><button data-w="zoom" data-id="-1" title="Zoom out">${wsi('zout')}</button>
            <i></i>${[['front','Front'],['top','Top'],['right','Right'],['iso','Isometric']].map(([k,l])=>`<button data-w="view" data-id="${k}" title="${l}" class="txt">${l==='Isometric'?'Iso':l}</button>`).join('')}
            <i></i>${[['se','Shaded with edges'],['shaded','Shaded'],['hlv','Hidden lines visible'],['wire','Wireframe']].map(([k,l])=>`<button data-w="mode" data-id="${k}" title="${l}" class="${WS.mode===k?'on':''}">${wsi(k)}</button>`).join('')}
            <i></i><button data-w="full" title="${WS.full?'Exit full screen':'Full screen'}">${wsi(WS.full?'shrink':'expand')}</button>
          </div>
          <div class="cws-status" id="cwsStatus"></div>
        </div>
      </div>
    </div>
    ${ex.free ? `<p class="cws-about">${esc(ex.about)}</p>` : `<div class="cws-dwg"><div class="cws-dwgh"><div><div class="h3">Drawing · ${esc(ex.part)}</div><div class="tiny">${esc(ex.about)} First-angle projection, millimetres.</div></div><div class="cws-score" id="cwsScore"></div></div>
      <div class="cws-sheet" id="cwsSheet"><div class="tiny">Drawing loads with the 3D view.</div></div></div>`}
  </div>`;
}
function cwsSideHTML(){
  if (WS.edit) return cwsPMHTML();
  const ex = WS_EX[WS.ex], m = wsMatch(), warn = WS.model ? WS.model.warn : {};
  const row = (f) => { const ok = m && m.res[f.id], w = warn[f.id];
    return `<div class="cws-fi${WS.sel===f.id?' sel':''}${f.sup?' sup':''}" data-w="sel" data-id="${f.id}" role="treeitem" aria-selected="${WS.sel===f.id}" tabindex="0">
      <span class="cws-fic">${wsi(WS_TYPE_ICON[f.type],16)}</span><span class="cws-fn"><b>${esc(f.name || wsFeatLabel(f))}</b><small>${wsFeatLabel(f)}${w?' · <em>check</em>':''}</small></span>
      ${w ? `<span class="cws-warn" title="${esc(w)}">!</span>` : m ? `<span class="cws-ok ${ok?'y':''}" title="${ok?'Matches the drawing':'Not matching yet'}">${ok?wsi('check',12):''}</span>` : ''}
      <span class="cws-fa"><button data-w="edit" data-id="${f.id}" title="Edit feature" aria-label="Edit ${esc(f.name||'')}">${wsi('edit',14)}</button><button data-w="sup" data-id="${f.id}" title="${f.sup?'Unsuppress':'Suppress'}" aria-label="${f.sup?'Unsuppress':'Suppress'}">${wsi(f.sup?'eyeoff':'eye',14)}</button><button data-w="del" data-id="${f.id}" title="Delete" aria-label="Delete">${wsi('trash',14)}</button></span>
    </div>`; };
  return `<div class="cws-tree" role="tree" aria-label="FeatureManager design tree">
    <div class="cws-ti root">${wsi('part',16)}<b>${esc(ex.part)}</b><small>(Default)</small></div>
    <div class="cws-ti">${wsi('sheet',15)}<span>Material: ${esc(ex.mat)}</span></div>
    ${['front','top','right'].map(p=>`<div class="cws-ti">${wsi('plane',15)}<span>${WS_PLANE_NAME[p]}</span></div>`).join('')}
    <div class="cws-ti">${wsi('origin',15)}<span>Origin</span></div>
    ${WS.feats.map(row).join('')}
    <div class="cws-hint tiny">${m ? (m.done ? 'Every feature matches the drawing.' : `Tap a feature and press the pencil to edit it. ${m.ok} of ${m.total} match the drawing.`) : 'Tap a feature to select it; the pencil edits it.'}</div>
  </div>`;
}
function cwsPMHTML(){
  const f = wsFeat(WS.edit); if (!f) return '';
  const num = (k, label, step=1, min) => `<label class="cws-pf"><span>${label}</span><input type="number" inputmode="decimal" step="${step}" ${min!==undefined?`min="${min}"`:''} data-f="${k}" value="${f[k] ?? 0}"></label>`;
  const sel = (k, label, opts) => `<label class="cws-pf"><span>${label}</span><select data-f="${k}">${opts.map(([v,l])=>`<option value="${v}" ${String(f[k]??'')===String(v)?'selected':''}>${l}</option>`).join('')}</select></label>`;
  const planeSel = sel('plane','Sketch plane', [['front','Front Plane'],['top','Top Plane'],['right','Right Plane']]);
  let body = '';
  if (f.type==='cut'){
    body = `<div class="cws-pg"><b>Sketch</b>${planeSel}${num('angle','Plane tilt (°)',5)}</div>
      <div class="cws-pg"><b>Holes</b>${num('dia','Diameter Ø',1,.5)}${num('x','First hole x',1)}${num('y','First hole y',1)}${num('n','Count',1,1)}${num('pitch','Pitch',1,0)}${sel('dir','Pattern direction',[['u','Along sketch x'],['v','Along sketch y']])}${num('rows','Rows',1,1)}${num('rpitch','Row pitch',1,0)}</div>
      <div class="cws-pg"><b>Direction 1</b><div class="cws-pnote">Through All: cuts every earlier solid on this sketch plane.</div></div>`;
  } else {
    const shapes = f.type==='rib' ? [['tri','Triangle']] : [['rect','Rectangle'],['circle','Circle'],['case','Crankcase profile'],['tri','Triangle']];
    const dims = f.shape==='circle' ? num('dia','Diameter Ø',1,1) : f.shape==='case' ? num('w','Width',5,1) + num('h','Height',5,1) : f.shape==='tri' ? num('w','Leg along x',1,1) + num('d','Leg along y',1,1) : num('w','Width',1,1) + num('d','Length',1,1) + num('r','Corner fillet R',1,0);
    body = `<div class="cws-pg"><b>Sketch</b>${planeSel}${num('angle','Plane tilt (°)',5)}${sel('shape','Profile',shapes)}${dims}${num('x','Centre x',1)}${num('y','Centre y',1)}</div>
      <div class="cws-pg"><b>Direction 1</b>${sel('mid','End condition',[['','Blind'],['1','Mid Plane']])}${f.mid?'':num('off','Start offset',1)}${num('depth','Depth D1',1,.5)}</div>`;
  }
  return `<div class="cws-pm" role="form" aria-label="Edit ${esc(f.name||'')}">
    <div class="cws-pmh">${wsi(WS_TYPE_ICON[f.type],18)}<b>${wsFeatLabel(f)}</b><span class="cws-pmb"><button data-w="ok" class="ok" title="OK" aria-label="OK">${wsi('check',18)}</button><button data-w="cancel" class="no" title="Cancel" aria-label="Cancel">${wsi('x',18)}</button></span></div>
    <label class="cws-pf name"><span>Name</span><input type="text" data-f="name" value="${esc(f.name||'')}"></label>
    ${body}
    ${WS.model && WS.model.warn[f.id] ? `<div class="cws-pwarn">${esc(WS.model.warn[f.id])}</div>` : ''}
  </div>`;
}

/* ---------- drawing sheet (rendered from the target model) ---------- */
function wsDims(f){
  const n = Math.max(1, +f.n||1)*Math.max(1, +f.rows||1);
  if (f.type==='cut') return `${n} × Ø${f.dia} through all${n>1?`, pitch ${f.pitch}`:''}`;
  const tilt = f.angle ? `, plane tilted ${f.angle}°` : '';
  if (f.shape==='circle') return `Ø${f.dia}, depth ${f.depth}${f.off?`, starts ${f.off} from the ${WS_PLANE_NAME[f.plane].toLowerCase()}`:''}`;
  if (f.shape==='case') return `width ${f.w}, height ${f.h}, length ${f.depth} (mid-plane)`;
  if (f.shape==='tri') return `legs ${f.w} × ${f.d}, thickness ${f.depth}`;
  return `${f.w} × ${f.d}${f.r?`, R${f.r} corners`:''}, depth ${f.depth}${f.mid?' mid-plane':f.off?`, starts ${f.off} from the ${WS_PLANE_NAME[f.plane].toLowerCase()}`:''}${tilt}`;
}
function wsSheet(){
  const el = document.getElementById('cwsSheet'), ex = WS_EX[WS.ex]; if (!el || ex.free) return;
  const tgt = wsBuild(ex.feats), b = tgt.b;
  const cv = document.createElement('canvas'); const R = WS.sheetR && WS.sheetR.cv === cv ? WS.sheetR.R : wsRenderer(cv);
  if (!R){ el.innerHTML = '<div class="tiny">This browser cannot draw the sheet (WebGL is off).</div>'; return; }
  R.upload(tgt);
  const views = [ { k:'front', name:'Front view', v:{ yaw:0, pitch:0 } }, { k:'end', name:'End view (from left)', v:{ yaw:Math.PI/2, pitch:0 } }, { k:'plan', name:'Plan', v:{ yaw:0, pitch:Math.PI/2 } }, { k:'iso', name:'Isometric', v:{ yaw:-.75, pitch:.6 } } ];
  const ext = v => { const Rw = wsRows(v), xs = [], ys = []; for (const i of [0,1]) for (const j of [0,1]) for (const k of [0,1]){ const p = [i?b.mx[0]:b.mn[0], j?b.mx[1]:b.mn[1], k?b.mx[2]:b.mn[2]]; xs.push(Rw[0][0]*(p[0]-b.c[0])+Rw[0][1]*(p[1]-b.c[1])+Rw[0][2]*(p[2]-b.c[2])); ys.push(Rw[1][0]*(p[0]-b.c[0])+Rw[1][1]*(p[1]-b.c[1])+Rw[1][2]*(p[2]-b.c[2])); } return [Math.max(...xs)-Math.min(...xs), Math.max(...ys)-Math.min(...ys)]; };
  const cell = 260, s = Math.min(...views.slice(0,3).map(vw=>{ const [w,h] = ext(vw.v); return Math.min((cell-40)/w, (cell-50)/h); }));
  const dark = document.documentElement.getAttribute('data-theme')==='dark';
  const imgs = views.map(vw=>{ const sc = vw.k==='iso' ? s*.9 : s; R.draw({ v:Object.assign({ panX:0, panY:0 }, vw.v), C:b.c, s:sc, W:cell, H:cell, dpr:2, mode:'hlv', dark:false, shadow:false, colOf:()=>[1,1,1], edgeOf:()=>[.08,.08,.1,1] }); return cv.toDataURL('image/png'); });
  // balloons: feature centroids projected into the front view and the plan
  const bal = []; const letters = 'ABCDEFGHIJ';
  tgt.parts.forEach(p=>{ const f = ex.feats.find(x=>x.id===p.fid); let c = [0,0,0]; const n = p.pos.length/3; for (let i=0;i<p.pos.length;i+=3){ c[0]+=p.pos[i]; c[1]+=p.pos[i+1]; c[2]+=p.pos[i+2]; } c = c.map(x=>x/n); bal.push({ f, c }); });
  ex.feats.filter(f=>f.type==='cut').forEach(f=>{ const B = wsBasis(f.plane, f.angle), x = +f.x, y = +f.y; bal.push({ f, c:[x*B[0][0]+y*B[1][0], x*B[0][1]+y*B[1][1], x*B[0][2]+y*B[1][2]] }); });
  const toCell = (vw, p) => { const Rw = wsRows(vw.v), q = [p[0]-b.c[0], p[1]-b.c[1], p[2]-b.c[2]]; return [cell/2 + (Rw[0][0]*q[0]+Rw[0][1]*q[1]+Rw[0][2]*q[2])*s, cell/2 - (Rw[1][0]*q[0]+Rw[1][1]*q[1]+Rw[1][2]*q[2])*s]; };
  const pos = [[0,0],[cell,0],[0,cell],[cell,cell]];
  const order = ex.feats.map(f=>f.id), balloons = bal.sort((a,c)=>order.indexOf(a.f.id)-order.indexOf(c.f.id)).map((x,i)=>{ const vw = x.f.type==='cut' && (x.f.plane==='top') ? views[2] : x.f.plane==='right' ? views[1] : views[0], vi = views.indexOf(vw), [px,py] = toCell(vw, x.c);
    const L = letters[order.indexOf(x.f.id)], bx = pos[vi][0] + Math.min(cell-14, Math.max(14, px + 26)), by = pos[vi][1] + Math.min(cell-14, Math.max(14, py - 24));
    return `<g class="bal"><line x1="${pos[vi][0]+px}" y1="${pos[vi][1]+py}" x2="${bx}" y2="${by}"/><circle cx="${pos[vi][0]+px}" cy="${pos[vi][1]+py}" r="1.8"/><circle cx="${bx}" cy="${by}" r="9"/><text x="${bx}" y="${by+3.6}" text-anchor="middle">${L}</text></g>`; }).join('');
  const W = cell*2, H = cell*2, [fw,fh] = ext(views[0].v), [ew] = ext(views[1].v);
  const ov = (i, d, x0, y0) => `<g class="vdim"><line x1="${x0 - d*s/2}" y1="${y0}" x2="${x0 + d*s/2}" y2="${y0}" marker-start="url(#wsA)" marker-end="url(#wsA)"/><text x="${x0}" y="${y0-4}" text-anchor="middle">${Math.round(d)}</text></g>`;
  const ovv = (d, x0, y0) => `<g class="vdim"><line x1="${x0}" y1="${y0 - d*s/2}" x2="${x0}" y2="${y0 + d*s/2}" marker-start="url(#wsA)" marker-end="url(#wsA)"/><text x="${x0-5}" y="${y0}" text-anchor="middle" transform="rotate(-90 ${x0-5} ${y0})">${Math.round(d)}</text></g>`;
  el.innerHTML = `<div class="cws-sheetin"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Drawing of the ${esc(ex.part)} in first-angle projection with feature balloons">
      <defs><marker id="wsA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z"/></marker></defs>
      <rect x="1" y="1" width="${W-2}" height="${H-2}" class="frame"/>
      ${imgs.map((src,i)=>`<image href="${src}" x="${pos[i][0]}" y="${pos[i][1]}" width="${cell}" height="${cell}"/><text class="vname" x="${pos[i][0]+cell/2}" y="${pos[i][1]+cell-8}" text-anchor="middle">${views[i].name}</text>`).join('')}
      ${ov(0, fw, cell/2, cell/2 - fh*s/2 - 12)}${ovv(fh, cell/2 - fw*s/2 - 12, cell/2)}${ov(1, ew, cell*1.5, cell/2 - fh*s/2 - 12)}
      ${balloons}
    </svg></div>
    <div class="cws-tbl"><div class="cws-tbh"><span>Item</span><span>Feature</span><span>Size</span></div>${ex.feats.map((f,i)=>`<div class="cws-tbr" data-w="sel" data-id="${f.id}"><b>${letters[i]}</b><span>${esc(f.name)}<small>${{boss:'Extruded boss',cut:'Extruded cut',rib:'Rib'}[f.type]} · ${WS_PLANE_NAME[f.plane]}${f.angle?` tilted ${f.angle}°`:''}</small></span><span class="num">${esc(wsDims(f))}</span></div>`).join('')}
      <div class="cws-title"><div><small>Part</small><b>${esc(ex.part)}</b></div><div><small>Material</small><b>${esc(ex.mat)}</b></div><div><small>Units</small><b>mm</b></div><div><small>Projection</small><b>First angle</b></div></div></div>`;
}

/* ---------- drawing the viewport ---------- */
function wsScale(W,H){ return Math.min(W,H)*.4/WS.fitR*WS.v.zoom; }
function wsColOf(fid){ if (WS.edit===fid) return [.88,.74,.52]; if (WS.sel===fid) return [.80,.30,.38]; return document.documentElement.getAttribute('data-theme')==='dark' ? [.74,.73,.75] : [.80,.80,.83]; }
function wsEdgeOf(fid){ return WS.sel===fid || WS.edit===fid ? [.52,.04,.12,1] : [.06,.06,.08,.9]; }
function wsDraw(){
  const vp = document.getElementById('cwsVp'), gc = document.getElementById('cwsGL'), oc = document.getElementById('cwsOv'); if (!vp || !gc) return;
  const W = vp.clientWidth, H = vp.clientHeight, dpr = Math.min(2, window.devicePixelRatio||1); if (!W || !H) return;
  if (!WS.R){ WS.R = wsRenderer(gc); if (!WS.R){ vp.classList.add('nogl'); return; } WS.R.upload(WS.model); }
  const dark = document.documentElement.getAttribute('data-theme')==='dark', s = wsScale(W,H);
  WS.R.draw({ v:WS.v, C:WS.fitC, s, W, H, dpr, mode:WS.mode, dark, colOf:wsColOf, edgeOf:wsEdgeOf });
  // overlay: triad, editing dimensions, part name
  if (oc.width !== Math.round(W*dpr)){ oc.width = Math.round(W*dpr); oc.height = Math.round(H*dpr); }
  const g = oc.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
  const Rw = wsRows(WS.v), tx = 42, ty = H - 40;
  [[[1,0,0],'#D13B3B','X'],[[0,1,0],'#3E9B4F','Y'],[[0,0,1],'#3B6FD1','Z']].map(([a,c,l])=>({ a, c, l, d:Rw[2][0]*a[0]+Rw[2][1]*a[1]+Rw[2][2]*a[2] })).sort((p,q)=>q.d-p.d).forEach(({a,c,l})=>{
    const x = (Rw[0][0]*a[0]+Rw[0][1]*a[1]+Rw[0][2]*a[2])*24, y = -(Rw[1][0]*a[0]+Rw[1][1]*a[1]+Rw[1][2]*a[2])*24;
    g.strokeStyle = c; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx,ty); g.lineTo(tx+x, ty+y); g.stroke();
    g.fillStyle = c; g.font = '700 11px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; g.fillText(l, tx + x*1.25 - 3, ty + y*1.25 + 4); });
  const ex = WS_EX[WS.ex];
  g.fillStyle = dark ? 'rgba(242,241,237,.7)' : 'rgba(22,22,22,.62)'; g.font = '600 12px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
  g.fillText(`${ex.part}${WS.edit ? '  ›  Editing ' + wsFeatLabel(wsFeat(WS.edit)) : ''}`, 12, 20);
  const f = WS.edit && wsFeat(WS.edit); if (f && f.type!=='cut') wsDimOverlay(g, f, W, H, s, dark);
  const st = document.getElementById('cwsStatus');
  if (st){ const kg = WS.model.vol/1e6*ex.rho; const txt = `Mass ≈ ${kg >= 1 ? kg.toFixed(2)+' kg' : Math.round(kg*1000)+' g'} · ${ex.mat} · ${WS.feats.filter(x=>!x.sup).length} features · MMGS (mm)`; if (st.textContent !== txt) st.textContent = txt; }
}
function wsProjector(W,H,s){ const Rw = wsRows(WS.v), C = WS.fitC; return p => { const q = [p[0]-C[0], p[1]-C[1], p[2]-C[2]]; return [W/2 + (Rw[0][0]*q[0]+Rw[0][1]*q[1]+Rw[0][2]*q[2])*s + WS.v.panX, H/2 - ((Rw[1][0]*q[0]+Rw[1][1]*q[1]+Rw[1][2]*q[2])*s + WS.v.panY), Rw[2][0]*q[0]+Rw[2][1]*q[1]+Rw[2][2]*q[2]]; }; }
function wsDimOverlay(g, f, W, H, s, dark){ // SolidWorks-style live dimensions while a boss is being edited
  const pr = wsProjector(W,H,s), B = wsBasis(f.plane, f.angle), D = Math.max(.5, +f.depth||1), w0 = f.mid ? -D/2 : (+f.off||0), w1 = w0 + D;
  const P = (u,v,w) => pr([u*B[0][0]+v*B[1][0]+w*B[2][0], u*B[0][1]+v*B[1][1]+w*B[2][1], u*B[0][2]+v*B[1][2]+w*B[2][2]]);
  const prof = wsProfile(f); let best = prof[0], bs = -1e9; prof.forEach(p=>{ const q = P(p[0],p[1],w1); if (q[0] - q[1]*.3 > bs){ bs = q[0] - q[1]*.3; best = p; } });
  const dim = (a, c, txt) => { const dx = c[0]-a[0], dy = c[1]-a[1], L = Math.hypot(dx,dy); if (L < 18) return; const nx = -dy/L*16, ny = dx/L*16, A = [a[0]+nx, a[1]+ny], Cc = [c[0]+nx, c[1]+ny];
    g.strokeStyle = dark ? '#E6CDB0' : '#710014'; g.fillStyle = g.strokeStyle; g.lineWidth = 1.2; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(A[0]+nx*.25, A[1]+ny*.25); g.moveTo(c[0],c[1]); g.lineTo(Cc[0]+nx*.25, Cc[1]+ny*.25); g.moveTo(A[0],A[1]); g.lineTo(Cc[0],Cc[1]); g.stroke();
    [[A,Cc],[Cc,A]].forEach(([p,q])=>{ const ux = (q[0]-p[0])/L, uy = (q[1]-p[1])/L; g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(p[0]+ux*8-uy*3, p[1]+uy*8+ux*3); g.lineTo(p[0]+ux*8+uy*3, p[1]+uy*8-ux*3); g.fill(); });
    const mx = (A[0]+Cc[0])/2, my = (A[1]+Cc[1])/2; g.font = '700 12px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; const tw = g.measureText(txt).width + 10;
    g.fillStyle = dark ? 'rgba(22,20,20,.92)' : 'rgba(255,255,255,.94)'; g.fillRect(mx - tw/2, my - 9, tw, 18); g.strokeRect(mx - tw/2, my - 9, tw, 18); g.fillStyle = dark ? '#E6CDB0' : '#710014'; g.textAlign = 'center'; g.fillText(txt, mx, my + 4); g.textAlign = 'start'; };
  dim(P(best[0],best[1],w0), P(best[0],best[1],w1), `D1 ${D}`);
  const x = +f.x||0, y = +f.y||0;
  if (f.shape==='rect' || !f.shape){ dim(P(x-f.w/2, y-f.d/2, w1), P(x+f.w/2, y-f.d/2, w1), String(f.w)); dim(P(x+f.w/2, y-f.d/2, w1), P(x+f.w/2, y+f.d/2, w1), String(f.d)); }
  else if (f.shape==='circle'){ const r = f.dia/2; dim(P(x-r, y, w1), P(x+r, y, w1), 'Ø' + f.dia); }
  else if (f.shape==='case'){ dim(P(x-f.w/2, y-f.h*2/3, w0), P(x+f.w/2, y-f.h*2/3, w0), String(f.w)); }
  else if (f.shape==='tri'){ dim(P(x-f.w, y, w1), P(x, y, w1), String(f.w)); dim(P(x, y, w1), P(x, y+f.d, w1), String(f.d)); }
}
function wsLoop(){
  WS.raf = 0; if (!document.getElementById('cwsGL') || (!WS.vis && !WS.full)) return;
  const v = WS.v, t = WS.t, k = motionOff() ? 1 : .22;
  let moving = false; ['yaw','pitch','zoom','panX','panY'].forEach(key=>{ const d = t[key] - v[key]; if (Math.abs(d) > (key==='zoom' ? 1e-4 : key.startsWith('pan') ? .05 : 1e-4)){ v[key] += d*k; moving = true; } else v[key] = t[key]; });
  if (!WS.drag && (Math.abs(WS.vy||0) > 1e-4 || Math.abs(WS.vp||0) > 1e-4) && !motionOff()){ t.yaw += WS.vy; t.pitch += WS.vp; WS.vy *= .93; WS.vp *= .93; moving = true; }
  if (moving || WS.dirty){ WS.dirty = false; wsDraw(); }
  if (moving || WS.drag) WS.raf = requestAnimationFrame(wsLoop);
}
function wsKick(){ WS.dirty = true; if (!WS.raf) WS.raf = requestAnimationFrame(wsLoop); }

/* ---------- picking ---------- */
function wsPick(mx, my){
  const vp = document.getElementById('cwsVp'), W = vp.clientWidth, H = vp.clientHeight, pr = wsProjector(W, H, wsScale(W,H));
  let best = null, bd = 1e18;
  WS.model.parts.forEach(p=>{ const a = p.pos;
    for (let i=0;i<a.length;i+=9){ const A = pr([a[i],a[i+1],a[i+2]]), B = pr([a[i+3],a[i+4],a[i+5]]), C = pr([a[i+6],a[i+7],a[i+8]]);
      const d = (B[1]-C[1])*(A[0]-C[0]) + (C[0]-B[0])*(A[1]-C[1]); if (Math.abs(d) < 1e-9) continue;
      const l1 = ((B[1]-C[1])*(mx-C[0]) + (C[0]-B[0])*(my-C[1]))/d, l2 = ((C[1]-A[1])*(mx-C[0]) + (A[0]-C[0])*(my-C[1]))/d, l3 = 1-l1-l2;
      if (l1 < 0 || l2 < 0 || l3 < 0) continue; const z = l1*A[2] + l2*B[2] + l3*C[2]; if (z < bd){ bd = z; best = p.fid; } } });
  return best;
}

/* ---------- actions ---------- */
function wsSide(){ const el = document.getElementById('cwsSide'); if (el) el.innerHTML = cwsSideHTML(); wsScore(); }
function wsScore(){ const el = document.getElementById('cwsScore'), m = wsMatch(); if (!el || !m) return; el.innerHTML = `<b class="num">${m.ok}/${m.total}</b><small>${m.done ? 'matches the drawing' : 'features match'}</small>`; el.classList.toggle('done', m.done); }
function wsSelect(id){ WS.sel = id; wsSide(); wsKick(); }
function wsEdit(id){ const f = wsFeat(id); if (!f) return; WS.snap = wsClone(WS.feats); WS.edit = id; WS.sel = id; wsSide(); wsKick(); setTimeout(()=>{ const i = document.querySelector('#cwsSide input[type="number"]'); if (i && window.innerWidth > 760) i.focus(); }, 30); }
function wsCommit(){ if (!WS.edit) return; if (WS.snap && JSON.stringify(WS.snap) !== JSON.stringify(WS.feats)){ WS.undo.push(WS.snap); WS.redo = []; } WS.edit = null; WS.snap = null; wsSave(); wsSide(); wsKick(); wsCheck(true); }
function wsCancel(){ if (!WS.edit) return; if (WS.snap){ WS.feats = WS.snap; } WS.edit = null; WS.snap = null; wsRebuild(); wsSide(); }
function wsCheck(quiet){
  const m = wsMatch(); if (!m) return;
  if (m.done){ const st = wsStore(); const first = !st.done[WS.ex]; st.done[WS.ex] = true; save(); if (first || !quiet){ toast(`${WS_EX[WS.ex].name}: your model matches the drawing.`, 'ok', 2600); const t = document.querySelector(`.cws-exs [data-id="${WS.ex}"]`); if (t && !t.querySelector('.cws-done')) t.insertAdjacentHTML('afterbegin', `<i class="cws-done">${wsi('check',12)}</i>`); } }
  else if (!quiet){ const bad = WS_EX[WS.ex].feats.filter(f=>!m.res[f.id]).map(f=>f.name); toast(`${m.ok} of ${m.total} match. Still off: ${bad.slice(0,3).join(', ')}${bad.length>3?'…':''}${m.extra?' · remove the extra features':''}`, 'warn', 3200); }
  wsSide();
}
let wsUid = 100;
function wsAdd(type){
  if (WS.edit) wsCommit();
  const b = WS.model.b, sel = WS.sel && wsFeat(WS.sel), id = 'n' + (wsUid++);
  let f;
  if (type==='boss') f = { id, type:'boss', name:'', plane:'top', shape:'rect', x:Math.round(b.c[0]), y:Math.round(b.c[1]), w:40, d:40, r:0, off:Math.round(b.mx[2]), depth:20 };
  else if (type==='cut'){ const t = sel && sel.type!=='cut' ? sel : WS.feats.find(x=>x.type!=='cut' && !x.sup) || {}; f = { id, type:'cut', name:'', plane:t.plane||'top', angle:t.angle||0, dia:10, x:+t.x||0, y:+t.y||0, n:1, pitch:20, dir:'u', rows:1, rpitch:20 }; }
  else f = { id, type:'rib', name:'', plane:'right', shape:'tri', x:Math.round(b.c[1]), y:Math.round(b.mx[2]), w:30, d:30, off:Math.round(b.c[0]) - 4, depth:8 };
  WS.snap = wsClone(WS.feats); WS.feats.push(f); f.name = wsFeatLabel(f); WS.edit = id; WS.sel = id; wsRebuild(); wsSide();
}
function wsSetView(k){
  const V = { front:[0,0], top:[0,Math.PI/2], right:[-Math.PI/2,0], iso:[-.75,.6] }[k]; if (!V) return;
  const tw = Math.PI*2; WS.t.yaw = V[0] + Math.round((WS.v.yaw - V[0])/tw)*tw; WS.t.pitch = V[1] + Math.round((WS.v.pitch - V[1])/tw)*tw; WS.vy = WS.vp = 0; wsKick();
}
function wsZoomAt(f, mx, my){ const vp = document.getElementById('cwsVp'); const W = vp.clientWidth, H = vp.clientHeight; const dx = mx - W/2, dy = H/2 - my;
  const z = clamp(WS.t.zoom*f, .15, 30), k = z/WS.t.zoom; WS.t.panX = dx - (dx - WS.t.panX)*k; WS.t.panY = dy - (dy - WS.t.panY)*k; WS.t.zoom = z; wsKick(); }
function wsFull(on){
  WS.full = on; const el = document.getElementById('cws'); if (!el) return;
  // lift the window to <body> while full screen (an ancestor's transform would trap position:fixed), then put it back
  if (on && el.parentNode !== document.body){ WS.home = document.createComment('cws'); el.parentNode.insertBefore(WS.home, el); document.body.appendChild(el); }
  else if (!on && WS.home && WS.home.parentNode){ WS.home.parentNode.insertBefore(el, WS.home); WS.home.remove(); WS.home = null; }
  el.classList.toggle('full', on); document.body.classList.toggle('cws-open', on);
  const b = el.querySelector('[data-w="full"]'); if (b){ b.innerHTML = wsi(on ? 'shrink' : 'expand'); b.title = on ? 'Exit full screen' : 'Full screen'; }
  setTimeout(()=>{ WS.dirty = true; wsKick(); }, 30);
}
function wsAct(a, el){
  const id = el.dataset.id;
  if (a==='ex'){ wsCommit(); const full = WS.full; if (full) wsFull(false); wsLoad(id); const root = document.getElementById('cws'); root.outerHTML = cwsHTML(); WS.R = null; mountCws(document.getElementById('cws').parentNode); if (full) wsFull(true); }
  else if (a==='sel'){ if (WS.edit && WS.edit !== id) return; wsSelect(id); }
  else if (a==='edit') wsEdit(id);
  else if (a==='ok') wsCommit();
  else if (a==='cancel') wsCancel();
  else if (a==='sup'){ wsPush(); const f = wsFeat(id); f.sup = !f.sup; wsRebuild(); wsSave(); wsSide(); }
  else if (a==='del'){ wsPush(); WS.feats = WS.feats.filter(f=>f.id!==id); if (WS.sel===id) WS.sel = null; wsRebuild(); wsSave(); wsSide(); }
  else if (a==='add') wsAdd(id);
  else if (a==='fillet'){ const f = WS.sel && wsFeat(WS.sel); if (!f || f.type!=='boss' || (f.shape && f.shape!=='rect')){ toast('Select a rectangular boss first, then Fillet rounds its corners.', 'warn', 2400); return; } wsEdit(f.id); if (!f.r){ f.r = Math.round(Math.min(f.w, f.d)/8) || 2; wsRebuild(); wsSide(); } setTimeout(()=>{ const i = document.querySelector('#cwsSide [data-f="r"]'); if (i){ i.focus(); i.select(); } }, 40); }
  else if (a==='undo'){ if (WS.edit) wsCancel(); if (!WS.undo.length) return; WS.redo.push(wsClone(WS.feats)); WS.feats = WS.undo.pop(); wsRebuild(); wsSave(); wsSide(); }
  else if (a==='redo'){ if (!WS.redo.length) return; WS.undo.push(wsClone(WS.feats)); WS.feats = WS.redo.pop(); wsRebuild(); wsSave(); wsSide(); }
  else if (a==='check'){ if (WS.edit) wsCommit(); wsCheck(false); }
  else if (a==='answer'){ wsPush(); WS.edit = null; WS.feats = wsClone(WS_EX[WS.ex].feats); wsRebuild(); wsSave(); wsSide(); toast('Answer loaded. Compare it with the drawing, then press Undo to go back to yours.', 'ok', 3000); }
  else if (a==='fit') wsFit(false);
  else if (a==='zoom'){ const vp = document.getElementById('cwsVp'); wsZoomAt(+id > 0 ? 1.3 : 1/1.3, vp.clientWidth/2, vp.clientHeight/2); }
  else if (a==='view') wsSetView(id);
  else if (a==='mode'){ WS.mode = id; document.querySelectorAll('.cws-hud [data-w="mode"]').forEach(b=>b.classList.toggle('on', b===el)); wsKick(); }
  else if (a==='full') wsFull(!WS.full);
}
function mountCws(root){
  const el = (root || document).querySelector('#cws'); if (!el) return;
  if (!WS.model) wsLoad(wsStore().ex || 'bracket');
  WS.R = null;
  el.addEventListener('click', e=>{ const b = e.target.closest('[data-w]'); if (!b || !el.contains(b)) return; e.stopPropagation(); wsAct(b.dataset.w, b); });
  el.addEventListener('dblclick', e=>{ const b = e.target.closest('.cws-fi'); if (b){ e.stopPropagation(); wsEdit(b.dataset.id); } });
  el.addEventListener('keydown', e=>{ const b = e.target.closest('.cws-fi'); if (b && (e.key==='Enter' || e.key===' ')){ e.preventDefault(); wsSelect(b.dataset.id); } });
  el.addEventListener('input', e=>{ const i = e.target.closest('[data-f]'); if (!i || !WS.edit) return; const f = wsFeat(WS.edit), k = i.dataset.f;
    if (k==='name') f.name = i.value;
    else if (k==='plane' || k==='shape' || k==='dir') { f[k] = i.value; if (k==='shape'){ if (i.value==='circle' && !f.dia) f.dia = Math.min(f.w||40, f.d||40); if (i.value==='case' && !f.h) f.h = f.d || 100; } }
    else if (k==='mid') f.mid = !!i.value;
    else { const v = parseFloat(i.value); if (!isFinite(v)) return; f[k] = (k==='n' || k==='rows') ? Math.max(1, Math.round(v)) : v; }
    wsRebuild(); if (k==='shape' || k==='mid' || k==='plane') wsSide(); else { const tr = document.querySelector('.cws-pwarn'); const w = WS.model.warn[f.id]; if (tr && !w) tr.remove(); else if (w && !tr){ const pm = document.querySelector('.cws-pm'); if (pm) pm.insertAdjacentHTML('beforeend', `<div class="cws-pwarn">${esc(w)}</div>`); } else if (tr) tr.textContent = w; } });
  el.addEventListener('keydown', e=>{ if (e.target.closest('.cws-pm')){ if (e.key==='Enter'){ e.preventDefault(); wsCommit(); } else if (e.key==='Escape'){ e.preventDefault(); wsCancel(); } } });
  const vp = el.querySelector('#cwsVp'), cv = el.querySelector('#cwsGL');
  vp.addEventListener('contextmenu', e=>e.preventDefault());
  vp.addEventListener('pointerdown', e=>{ if (e.target.closest('.cws-hud')) return; vp.setPointerCapture(e.pointerId); WS.ptr.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if (WS.ptr.size===1) WS.drag = { x:e.clientX, y:e.clientY, moved:0, pan: e.button===2 || e.button===1 || e.shiftKey || e.ctrlKey, t:performance.now() }; else WS.drag = { pinch:true, moved:99 };
    WS.vy = WS.vp = 0; vp.focus({ preventScroll:true }); wsKick(); });
  vp.addEventListener('pointermove', e=>{ if (!WS.ptr.has(e.pointerId)) return; const prev = WS.ptr.get(e.pointerId); WS.ptr.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if (WS.ptr.size===2){ const [a,b] = [...WS.ptr.values()], o = [...WS.ptr.entries()].find(([k])=>k!==e.pointerId)[1]; const d0 = Math.hypot(prev.x-o.x, prev.y-o.y), d1 = Math.hypot(a.x-b.x, a.y-b.y);
      const r = vp.getBoundingClientRect(), mx = (a.x+b.x)/2 - r.left, my = (a.y+b.y)/2 - r.top; if (d0 > 0) wsZoomAt(d1/d0, mx, my); WS.t.panX += (e.clientX-prev.x)/2; WS.t.panY -= (e.clientY-prev.y)/2; return; }
    if (!WS.drag) return; const dx = e.clientX-prev.x, dy = e.clientY-prev.y; WS.drag.moved += Math.abs(dx)+Math.abs(dy);
    if (WS.drag.pan){ WS.t.panX += dx; WS.t.panY -= dy; } else { WS.t.yaw += dx*.009; WS.t.pitch += dy*.009; WS.vy = WS.vy*.5 + dx*.0022; WS.vp = WS.vp*.5 + dy*.0022; }
    wsKick(); });
  let lastTap = 0;
  const up = e=>{ const d = WS.drag; WS.ptr.delete(e.pointerId); if (WS.ptr.size) return; WS.drag = null; if (d && d.pan){ WS.vy = WS.vp = 0; }
    if (d && !d.pinch && d.moved < 6 && e.type==='pointerup'){ const r = vp.getBoundingClientRect(), id = wsPick(e.clientX - r.left, e.clientY - r.top), now = performance.now(); WS.vy = WS.vp = 0;
      if (now - lastTap < 320 && id){ wsEdit(id); } else if (!WS.edit) wsSelect(id); lastTap = now; }
    wsKick(); };
  vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
  vp.addEventListener('wheel', e=>{ e.preventDefault(); const r = vp.getBoundingClientRect(); wsZoomAt(Math.exp(-e.deltaY*.0016), e.clientX - r.left, e.clientY - r.top); }, { passive:false });
  vp.addEventListener('keydown', e=>{ const k = e.key; let used = true;
    if (k==='ArrowLeft') WS.t.yaw -= .15; else if (k==='ArrowRight') WS.t.yaw += .15; else if (k==='ArrowUp') WS.t.pitch -= .15; else if (k==='ArrowDown') WS.t.pitch += .15;
    else if (k==='+' || k==='=') wsZoomAt(1.25, vp.clientWidth/2, vp.clientHeight/2); else if (k==='-') wsZoomAt(.8, vp.clientWidth/2, vp.clientHeight/2);
    else if (k==='f' || k==='F') wsFit(false); else if ((k==='Delete' || k==='Backspace') && WS.sel && !WS.edit) wsAct('del', { dataset:{ id:WS.sel } });
    else if ((e.ctrlKey || e.metaKey) && (k==='z' || k==='Z')) wsAct('undo', { dataset:{} }); else if ((e.ctrlKey || e.metaKey) && (k==='y' || k==='Y')) wsAct('redo', { dataset:{} });
    else if (k==='Escape' && WS.full) wsFull(false); else used = false;
    if (used){ e.preventDefault(); wsKick(); } });
  if (WS.io) WS.io.disconnect();
  WS.io = new IntersectionObserver(es=>{ WS.vis = es[0].isIntersecting; if (WS.vis) wsKick(); }); WS.io.observe(vp);
  new ResizeObserver(()=>wsKick()).observe(vp);
  wsSide(); setTimeout(()=>{ wsDraw(); wsSheet(); }, 30);
}
document.addEventListener('keydown', e=>{ if (e.key==='Escape' && WS.full && !e.target.closest('.cws-pm')) wsFull(false); });
