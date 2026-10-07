/* Engineering tools for the vault viewer. No dependencies. Plain styling.
   Every formula is shown on its page. Input values are examples: replace them with your own,
   and take material values from a datasheet (the vault rule is never to guess numbers). */

/* ---------- Pure maths (tested in Node, see site/test-tools.js) ---------- */
const MATH = {
  beam(kind, L, load, a, EI) {
    // L in m, load in N (point) or N/m (UDL), a in m, EI in N.m^2. Returns reactions, Mmax, deflection and V/M functions.
    let V, M, defl, R = {}, Mmax;
    if (kind === "ss-point") {
      const b = L - a, RA = load * b / L, RB = load * a / L;
      V = x => (x < a ? RA : RA - load);
      M = x => (x < a ? RA * x : RA * x - load * (x - a));
      const s = Math.min(a, b); // shorter distance; maximum deflection lies in the longer segment
      defl = load * s * Math.pow(L * L - s * s, 1.5) / (9 * Math.sqrt(3) * EI * L);
      R = { RA, RB }; Mmax = load * a * b / L;
    } else if (kind === "ss-udl") {
      const RA = load * L / 2;
      V = x => RA - load * x; M = x => RA * x - load * x * x / 2;
      defl = 5 * load * Math.pow(L, 4) / (384 * EI); R = { RA, RB: RA }; Mmax = load * L * L / 8;
    } else if (kind === "cant-point") {
      V = () => load; M = x => -load * (L - x);
      defl = load * Math.pow(L, 3) / (3 * EI); R = { RA: load, MA: load * L }; Mmax = load * L;
    } else {
      V = x => load * (L - x); M = x => -load * (L - x) * (L - x) / 2;
      defl = load * Math.pow(L, 4) / (8 * EI); R = { RA: load * L, MA: load * L * L / 2 }; Mmax = load * L * L / 2;
    }
    return { V, M, defl, R, Mmax };
  },
  mohr(sx, sy, txy) {
    const c = (sx + sy) / 2, R = Math.hypot((sx - sy) / 2, txy);
    const s1 = c + R, s2 = c - R;
    const th = 0.5 * Math.atan2(2 * txy, sx - sy); // principal angle from x axis, rad
    const vm = Math.sqrt(s1 * s1 - s1 * s2 + s2 * s2); // plane stress von Mises
    return { c, R, s1, s2, th, tmax: R, vm };
  },
  euler(E, I, L, K) { return Math.PI * Math.PI * E * I / Math.pow(K * L, 2); },
  spring(G, d, D, N, F) {
    const k = G * Math.pow(d, 4) / (8 * Math.pow(D, 3) * N), C = D / d;
    const Kw = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
    return { k, C, Kw, tau: Kw * 8 * F * D / (Math.PI * Math.pow(d, 3)), defl: F / k };
  },
  section(type, p) {
    let A, I, c;
    if (type === "rect") { A = p.b * p.h; I = p.b * Math.pow(p.h, 3) / 12; c = p.h / 2; }
    else if (type === "circle") { A = Math.PI * p.d * p.d / 4; I = Math.PI * Math.pow(p.d, 4) / 64; c = p.d / 2; }
    else if (type === "tube") { A = Math.PI * (p.d * p.d - p.di * p.di) / 4; I = Math.PI * (Math.pow(p.d, 4) - Math.pow(p.di, 4)) / 64; c = p.d / 2; }
    else if (type === "hrect") { A = p.b * p.h - p.bi * p.hi; I = (p.b * Math.pow(p.h, 3) - p.bi * Math.pow(p.hi, 3)) / 12; c = p.h / 2; }
    else { A = 2 * p.b * p.tf + (p.h - 2 * p.tf) * p.tw; I = (p.b * Math.pow(p.h, 3) - (p.b - p.tw) * Math.pow(p.h - 2 * p.tf, 3)) / 12; c = p.h / 2; }
    return { A, I, c, S: I / c, r: Math.sqrt(I / A) };
  },
  gear(N1, N2, m, n1, T1, eta) {
    const ratio = N2 / N1;
    return { ratio, n2: n1 / ratio, T2: T1 * ratio * eta, center: m * (N1 + N2) / 2, d1: m * N1, d2: m * N2 };
  }
};

/* Exact conversion factors to SI base. */
const UNITS = {
  Length: { base: "m", u: { m: 1, mm: 0.001, cm: 0.01, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 } },
  Force: { base: "N", u: { N: 1, kN: 1000, MN: 1e6, lbf: 4.4482216152605, kgf: 9.80665, kip: 4448.2216152605 } },
  "Pressure and stress": { base: "Pa", u: { Pa: 1, kPa: 1e3, MPa: 1e6, GPa: 1e9, bar: 1e5, atm: 101325, psi: 6894.757293168, ksi: 6894757.293168 } },
  Torque: { base: "N.m", u: { "N.m": 1, "N.mm": 0.001, "kN.m": 1000, "lbf.ft": 1.3558179483314004, "lbf.in": 0.1129848290276167, "kgf.m": 9.80665 } },
  Mass: { base: "kg", u: { kg: 1, g: 0.001, t: 1000, lb: 0.45359237, oz: 0.028349523125 } },
  Area: { base: "m2", u: { "m2": 1, "mm2": 1e-6, "cm2": 1e-4, "in2": 0.00064516, "ft2": 0.09290304 } },
  Energy: { base: "J", u: { J: 1, kJ: 1000, "N.m": 1, Wh: 3600, kWh: 3.6e6, "ft.lbf": 1.3558179483314004, BTU: 1055.05585262 } },
  Power: { base: "W", u: { W: 1, kW: 1000, hp: 745.6998715822702, "ft.lbf/s": 1.3558179483314004 } },
  "Speed": { base: "rad/s", u: { "rad/s": 1, rpm: Math.PI / 30, "Hz": 2 * Math.PI } }
};

/* ---------- Small UI helpers ---------- */
const $t = (tag, attrs = {}, html = "") => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); e.innerHTML = html; return e; };
const fmt = (v, d = 4) => (typeof v !== "number" ? v : !isFinite(v) ? "n/a" : Math.abs(v) >= 1e6 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(3) : String(+v.toPrecision(d)));
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function form(root, fields, compute, outputs) {
  const box = $t("div", { class: "tool-form" });
  const inputs = {};
  for (const f of fields) {
    const row = $t("label", { class: "tool-field" });
    row.append(document.createTextNode(f.label + (f.unit ? " (" + f.unit + ")" : "") + " "));
    let el;
    if (f.options) { el = $t("select"); el.innerHTML = f.options.map(o => `<option value="${o[0]}">${o[1]}</option>`).join(""); el.value = f.value; }
    else { el = $t("input", { type: "number", step: "any", value: f.value }); }
    el.id = "f-" + f.id; inputs[f.id] = el; row.append(el); box.append(row);
  }
  const out = $t("div", { class: "tool-out", "aria-live": "polite" });
  root.append(box, out);
  const run = () => {
    const v = {}; for (const f of fields) v[f.id] = f.options ? inputs[f.id].value : parseFloat(inputs[f.id].value);
    let res; try { res = compute(v); } catch (e) { res = null; }
    if (!res) { out.innerHTML = "<p>Enter valid numbers.</p>"; return; }
    out.innerHTML = '<div class="tbl"><table><thead><tr><th>Result</th><th>Value</th><th>Unit</th></tr></thead><tbody>' +
      res.rows.map(r => `<tr><td>${r[0]}</td><td>${fmt(r[1])}</td><td>${r[2] || ""}</td></tr>`).join("") + "</tbody></table></div>";
    if (res.draw) res.draw(out);
  };
  box.addEventListener("input", run); run();
}
function canvasPlot(parent, w, h) { const c = $t("canvas", { width: w, height: h }); c.style.maxWidth = "100%"; c.style.height = "auto"; c.style.border = "1px solid " + css("--rule"); parent.append(c); return c.getContext("2d"); }
function chart(ctx, W, H, xs, ys, title) {
  const fg = css("--fg"), mu = css("--muted");
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = css("--bg"); ctx.fillRect(0, 0, W, H);
  const pad = 36, lo = Math.min(0, ...ys), hi = Math.max(0, ...ys), span = (hi - lo) || 1;
  const X = x => pad + (x - xs[0]) / (xs[xs.length - 1] - xs[0]) * (W - 2 * pad), Y = y => H - pad - (y - lo) / span * (H - 2 * pad);
  ctx.strokeStyle = mu; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, Y(0)); ctx.lineTo(W - pad, Y(0)); ctx.stroke();
  ctx.strokeStyle = fg; ctx.lineWidth = 2; ctx.beginPath(); xs.forEach((x, i) => i ? ctx.lineTo(X(x), Y(ys[i])) : ctx.moveTo(X(x), Y(ys[i]))); ctx.stroke();
  ctx.fillStyle = fg; ctx.font = "13px system-ui"; ctx.fillText(title, pad, 16);
  ctx.fillStyle = mu; ctx.fillText(fmt(hi, 3), 2, Y(hi) + 4); ctx.fillText(fmt(lo, 3), 2, Y(lo) + 4);
}

/* ---------- Tools ---------- */
const TOOLS = {};

TOOLS.beam = {
  title: "Beam: reactions, shear, moment, deflection",
  render(root) {
    root.append($t("p", {}, "Statically determinate beams. Matches the worked example in the statics lesson: 4 m beam, 10 kN load 1 m from A gives Ay = 7.5 kN and By = 2.5 kN. Get I from the Section tool (convert to cm<sup>4</sup>). Check any result against a hand calculation before using it."));
    form(root, [
      { id: "kind", label: "Case", value: "ss-point", options: [["ss-point", "Simply supported, point load"], ["ss-udl", "Simply supported, uniform load"], ["cant-point", "Cantilever, end point load"], ["cant-udl", "Cantilever, uniform load"]] },
      { id: "L", label: "Length L", unit: "m", value: 4 },
      { id: "P", label: "Load: point P (kN) or uniform w (kN/m)", value: 10 },
      { id: "a", label: "Point load distance a from A (point case only)", unit: "m", value: 1 },
      { id: "E", label: "Elastic modulus E (example value, use your datasheet)", unit: "GPa", value: 200 },
      { id: "I", label: "Second moment of area I", unit: "cm4", value: 8000 }
    ], v => {
      if (!(v.L > 0) || !(v.E > 0) || !(v.I > 0)) return null;
      const point = v.kind.endsWith("point"), a = point && v.kind === "ss-point" ? v.a : v.L;
      if (v.kind === "ss-point" && !(a > 0 && a < v.L)) return null;
      const EI = v.E * v.I * 10, load = v.P * 1000, r = MATH.beam(v.kind, v.L, load, a, EI);
      const rows = [["Reaction at A (vertical)", r.R.RA / 1000, "kN"]];
      if (r.R.RB !== undefined) rows.push(["Reaction at B (vertical)", r.R.RB / 1000, "kN"]);
      if (r.R.MA !== undefined) rows.push(["Fixed-end moment", r.R.MA / 1000, "kN.m"]);
      rows.push(["Maximum bending moment", r.Mmax / 1000, "kN.m"], ["Maximum deflection", r.defl * 1000, "mm"]);
      rows.push(["Formula", "", { "ss-point": "d = P s (L^2 - s^2)^1.5 / (9 sqrt(3) E I L), s = shorter distance", "ss-udl": "d = 5 w L^4 / (384 E I)", "cant-point": "d = P L^3 / (3 E I)", "cant-udl": "d = w L^4 / (8 E I)" }[v.kind]]);
      return { rows, draw(out) {
        const xs = Array.from({ length: 241 }, (_, i) => v.L * i / 240);
        const W = 640, H = 170, c1 = canvasPlot(out, W, H), c2 = canvasPlot(out, W, H);
        chart(c1, W, H, xs, xs.map(x => r.V(x) / 1000), "Shear force V (kN)");
        chart(c2, W, H, xs, xs.map(x => r.M(x) / 1000), "Bending moment M (kN.m)");
      } };
    });
  }
};

TOOLS.section = {
  title: "Section properties",
  render(root) {
    root.append($t("p", {}, "Area, second moment of area about the horizontal centroidal axis, section modulus S = I / c, radius of gyration r = sqrt(I / A). Dimensions in mm."));
    const sel = $t("select", { id: "sec-type" }, `<option value="rect">Solid rectangle</option><option value="circle">Solid circle</option><option value="tube">Hollow circle (tube)</option><option value="hrect">Hollow rectangle</option><option value="ibeam">I-section (symmetric)</option>`);
    const holder = $t("div"), shapeLab = $t("label", { class: "tool-field" }, "Shape ");
    shapeLab.append(sel); root.append(shapeLab, holder);
    const defs = { rect: [["b", "Width b", 50], ["h", "Height h", 100]], circle: [["d", "Diameter d", 50]], tube: [["d", "Outer diameter", 60], ["di", "Inner diameter", 50]], hrect: [["b", "Outer width B", 60], ["h", "Outer height H", 100], ["bi", "Inner width b", 50], ["hi", "Inner height h", 90]], ibeam: [["h", "Total height h", 200], ["b", "Flange width b", 100], ["tf", "Flange thickness tf", 10], ["tw", "Web thickness tw", 6]] };
    const build = () => { holder.innerHTML = ""; const t = sel.value;
      form(holder, defs[t].map(d => ({ id: d[0], label: d[1], unit: "mm", value: d[2] })), v => {
        for (const k in v) if (!(v[k] > 0)) return null;
        if ((t === "tube" && v.di >= v.d) || (t === "hrect" && (v.bi >= v.b || v.hi >= v.h)) || (t === "ibeam" && (2 * v.tf >= v.h || v.tw >= v.b))) return null;
        const r = MATH.section(t, v);
        return { rows: [["Area A", r.A, "mm2"], ["Second moment I", r.I, "mm4"], ["Second moment I", r.I / 1e4, "cm4"], ["Distance to extreme fibre c", r.c, "mm"], ["Section modulus S = I/c", r.S, "mm3"], ["Radius of gyration r", r.r, "mm"]] };
      }); };
    sel.addEventListener("change", build); build();
  }
};

TOOLS.mohr = {
  title: "Stress transformation and Mohr's circle",
  render(root) {
    root.append($t("p", {}, "Plane stress. Tension positive. The plot shows the circle with tau plotted upward for positive tau on the x face. Principal angle is measured from the x axis: tan(2 theta) = 2 tau / (sx - sy). Von Mises (plane stress) = sqrt(s1^2 - s1 s2 + s2^2). Compare with yield strength from your material datasheet."));
    form(root, [
      { id: "sx", label: "Normal stress sx", unit: "MPa", value: 80 },
      { id: "sy", label: "Normal stress sy", unit: "MPa", value: -20 },
      { id: "t", label: "Shear stress txy", unit: "MPa", value: 30 },
      { id: "Sy", label: "Yield strength (optional, for factor of safety)", unit: "MPa", value: 250 }
    ], v => {
      const m = MATH.mohr(v.sx, v.sy, v.t);
      const rows = [["Centre of circle", m.c, "MPa"], ["Radius = max in-plane shear", m.R, "MPa"], ["Principal stress s1", m.s1, "MPa"], ["Principal stress s2", m.s2, "MPa"], ["Principal angle", m.th * 180 / Math.PI, "deg"], ["Von Mises stress", m.vm, "MPa"]];
      if (v.Sy > 0) rows.push(["Factor of safety (von Mises, yield)", v.Sy / m.vm, ""]);
      return { rows, draw(out) {
        const W = 420, H = 300, ctx = canvasPlot(out, W, H), fg = css("--fg"), mu = css("--muted");
        ctx.fillStyle = css("--bg"); ctx.fillRect(0, 0, W, H);
        const sc = Math.min(W / 2 - 50, H / 2 - 30) / (m.R || 1) * 0.9, ox = W / 2 - m.c * sc, oy = H / 2;
        const X = s => ox + s * sc, Y = t => oy - t * sc;
        ctx.strokeStyle = mu; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10, oy); ctx.lineTo(W - 10, oy); ctx.moveTo(X(0), 10); ctx.lineTo(X(0), H - 10); ctx.stroke();
        ctx.strokeStyle = fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(m.c), oy, m.R * sc, 0, 2 * Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(X(v.sx), Y(v.t)); ctx.lineTo(X(v.sy), Y(-v.t)); ctx.stroke();
        ctx.fillStyle = fg; ctx.font = "12px system-ui";
        for (const [lab, s, t] of [["x", v.sx, v.t], ["y", v.sy, -v.t], ["s1", m.s1, 0], ["s2", m.s2, 0]]) { ctx.beginPath(); ctx.arc(X(s), Y(t), 3.5, 0, 7); ctx.fill(); ctx.fillText(lab, X(s) + 6, Y(t) - 6); }
        ctx.fillStyle = mu; ctx.fillText("sigma", W - 46, oy - 6); ctx.fillText("tau", X(0) + 6, 20);
      } };
    });
  }
};

TOOLS.buckling = {
  title: "Euler column buckling",
  render(root) {
    root.append($t("p", {}, "Critical load P = pi^2 E I / (K L)^2. K is the effective length factor: pinned-pinned 1.0, fixed-free 2.0, fixed-pinned about 0.7, fixed-fixed 0.5. Valid only for slender columns. Check slenderness, and apply a factor of safety."));
    form(root, [
      { id: "K", label: "End conditions", value: "1", options: [["1", "Pinned-pinned (K = 1.0)"], ["2", "Fixed-free (K = 2.0)"], ["0.7", "Fixed-pinned (K = 0.7)"], ["0.5", "Fixed-fixed (K = 0.5)"]] },
      { id: "E", label: "Elastic modulus E (example, use your datasheet)", unit: "GPa", value: 200 },
      { id: "I", label: "Smallest second moment of area I", unit: "cm4", value: 100 },
      { id: "A", label: "Area A (for slenderness)", unit: "cm2", value: 20 },
      { id: "L", label: "Length L", unit: "m", value: 2 }
    ], v => {
      if (!(v.E > 0 && v.I > 0 && v.L > 0 && v.A > 0)) return null;
      const K = parseFloat(v.K), P = MATH.euler(v.E * 1e9, v.I * 1e-8, v.L, K), r = Math.sqrt(v.I / v.A) / 100;
      return { rows: [["Critical load Pcr", P / 1000, "kN"], ["Radius of gyration r", r * 1000, "mm"], ["Slenderness KL/r", K * v.L / r, ""], ["Critical stress Pcr/A", P / (v.A * 1e-4) / 1e6, "MPa"]] };
    });
  }
};

TOOLS.spring = {
  title: "Helical compression spring",
  render(root) {
    root.append($t("p", {}, "Rate k = G d^4 / (8 D^3 N). Shear stress = Kw 8 F D / (pi d^3) with Wahl factor Kw = (4C - 1)/(4C - 4) + 0.615/C, C = D/d. N is the number of active coils. Take G from your wire material datasheet."));
    form(root, [
      { id: "G", label: "Shear modulus G (example, use your datasheet)", unit: "GPa", value: 79 },
      { id: "d", label: "Wire diameter d", unit: "mm", value: 3 },
      { id: "D", label: "Mean coil diameter D", unit: "mm", value: 24 },
      { id: "N", label: "Active coils N", value: 8 },
      { id: "F", label: "Axial force F", unit: "N", value: 150 }
    ], v => {
      if (!(v.G > 0 && v.d > 0 && v.D > v.d && v.N > 0)) return null;
      const r = MATH.spring(v.G * 1e3, v.d, v.D, v.N, v.F);
      return { rows: [["Spring rate k", r.k, "N/mm"], ["Spring index C", r.C, ""], ["Wahl factor Kw", r.Kw, ""], ["Deflection at F", r.defl, "mm"], ["Corrected shear stress", r.tau, "MPa"]] };
    });
  }
};

TOOLS.gears = {
  title: "Gear pair",
  render(root) {
    root.append($t("p", {}, "Spur gear pair with module m. Pitch diameter = m N. Centre distance = m (N1 + N2) / 2. Ratio = N2 / N1. Output torque = input torque x ratio x efficiency."));
    form(root, [
      { id: "N1", label: "Driver teeth N1", value: 20 }, { id: "N2", label: "Driven teeth N2", value: 60 },
      { id: "m", label: "Module m", unit: "mm", value: 2 }, { id: "n1", label: "Input speed", unit: "rpm", value: 1500 },
      { id: "T1", label: "Input torque", unit: "N.m", value: 10 }, { id: "eta", label: "Efficiency (0 to 1, your estimate)", value: 0.97 }
    ], v => {
      if (!(v.N1 > 0 && v.N2 > 0 && v.m > 0)) return null;
      const g = MATH.gear(v.N1, v.N2, v.m, v.n1, v.T1, v.eta);
      return { rows: [["Gear ratio N2/N1", g.ratio, ""], ["Output speed", g.n2, "rpm"], ["Output torque", g.T2, "N.m"], ["Pitch diameter 1", g.d1, "mm"], ["Pitch diameter 2", g.d2, "mm"], ["Centre distance", g.center, "mm"]] };
    });
  }
};

TOOLS.units = {
  title: "Unit converter",
  render(root) {
    root.append($t("p", {}, "Exact factors to SI. Pick a quantity, enter a value, read every unit."));
    const sel = $t("select", { id: "uc-q" }, Object.keys(UNITS).map(k => `<option>${k}</option>`).join(""));
    const lab = $t("label", { class: "tool-field" }, "Quantity "); lab.append(sel); root.append(lab);
    const holder = $t("div"); root.append(holder);
    const build = () => { holder.innerHTML = ""; const q = UNITS[sel.value], names = Object.keys(q.u);
      form(holder, [{ id: "val", label: "Value", value: 1 }, { id: "from", label: "From", value: names[0], options: names.map(n => [n, n]) }],
        v => ({ rows: names.map(n => [n, v.val * q.u[v.from] / q.u[n], ""]) })); };
    sel.addEventListener("change", build); build();
    const t = $t("p", {}, "Temperature: K = C + 273.15. F = C x 9/5 + 32."); root.append(t);
  }
};

/* ---------- 3D shapes ---------- */
const GEO = (() => {
  const P = Math.PI, T = [];
  const tri = (a, b, c) => T.push([a, b, c]);
  const quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
  const area2 = p => p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]; return s + q[0] * r[1] - r[0] * q[1]; }, 0);
  function ears(poly) { // ear clipping for a simple counter-clockwise polygon; returns index triples
    const idx = poly.map((_, i) => i), out = []; let guard = 0;
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const inside = (p, a, b, c) => cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0;
    while (idx.length > 3 && guard++ < 5000) {
      let cut = false;
      for (let i = 0; i < idx.length; i++) {
        const i0 = idx[(i + idx.length - 1) % idx.length], i1 = idx[i], i2 = idx[(i + 1) % idx.length];
        const a = poly[i0], b = poly[i1], c = poly[i2];
        if (cross(a, b, c) <= 1e-12) continue;
        if (idx.some(j => j !== i0 && j !== i1 && j !== i2 && inside(poly[j], a, b, c))) continue;
        out.push([i0, i1, i2]); idx.splice(i, 1); cut = true; break;
      }
      if (!cut) break;
    }
    if (idx.length === 3) out.push([idx[0], idx[1], idx[2]]);
    return out;
  }
  function extrude(poly, depth) { // along z, centred
    if (area2(poly) < 0) poly = poly.slice().reverse();
    const z0 = -depth / 2, z1 = depth / 2, n = poly.length;
    for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; quad([a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]); }
    for (const [i, j, k] of ears(poly)) { tri([...poly[i], z1], [...poly[j], z1], [...poly[k], z1]); tri([...poly[i], z0], [...poly[k], z0], [...poly[j], z0]); }
    return Math.abs(area2(poly)) / 2 * depth;
  }
  const ring = (r, n, y) => Array.from({ length: n }, (_, i) => [r * Math.cos(2 * P * i / n), y, r * Math.sin(2 * P * i / n)]);
  function lathe(profile, n) { // profile: [[r,y],...] open polyline revolved about y
    for (let k = 0; k < profile.length - 1; k++) { const A = ring(profile[k][0], n, profile[k][1]), B = ring(profile[k + 1][0], n, profile[k + 1][1]);
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; quad(A[i], A[j], B[j], B[i]); } }
  }
  return {
    box(p) { const [w, h, d] = [p.w / 2, p.h / 2, p.d / 2]; const s = [[-w, -h, -d], [w, -h, -d], [w, h, -d], [-w, h, -d], [-w, -h, d], [w, -h, d], [w, h, d], [-w, h, d]];
      for (const f of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]]) quad(...f.map(i => s[i])); return p.w * p.h * p.d; },
    cylinder(p) { lathe([[0, -p.h / 2], [p.r, -p.h / 2], [p.r, p.h / 2], [0, p.h / 2]], 56); return P * p.r * p.r * p.h; },
    tube(p) { lathe([[p.ri, -p.h / 2], [p.ro, -p.h / 2], [p.ro, p.h / 2], [p.ri, p.h / 2], [p.ri, -p.h / 2]], 56); return P * (p.ro * p.ro - p.ri * p.ri) * p.h; },
    cone(p) { lathe([[0, -p.h / 2], [p.r, -p.h / 2], [0, p.h / 2]], 56); return P * p.r * p.r * p.h / 3; },
    sphere(p) { const pr = Array.from({ length: 25 }, (_, i) => { const a = -P / 2 + P * i / 24; return [p.r * Math.cos(a), p.r * Math.sin(a)]; }); lathe(pr, 48); return 4 / 3 * P * Math.pow(p.r, 3); },
    torus(p) { const M = 40, N = 20; const pt = (i, j) => { const u = 2 * P * i / M, v = 2 * P * j / N; return [(p.R + p.r * Math.cos(v)) * Math.cos(u), p.r * Math.sin(v), (p.R + p.r * Math.cos(v)) * Math.sin(u)]; };
      for (let i = 0; i < M; i++) for (let j = 0; j < N; j++) quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)); return 2 * P * P * p.R * p.r * p.r; },
    ibeam(p) { const h = p.h / 2, b = p.b / 2, w = p.tw / 2, f = p.h / 2 - p.tf; return extrude([[-b, -h], [b, -h], [b, -f], [w, -f], [w, f], [b, f], [b, h], [-b, h], [-b, f], [-w, f], [-w, -f], [-b, -f]], p.L); },
    lbracket(p) { return extrude([[0, 0], [p.a, 0], [p.a, p.t], [p.t, p.t], [p.t, p.b], [0, p.b]].map(q => [q[0] - p.a / 2, q[1] - p.b / 2]), p.L); },
    gear(p) { const r = p.m * p.N / 2, ro = r + p.m, rr = r - 1.25 * p.m, pts = [], pitch = 2 * P / p.N;
      for (let i = 0; i < p.N; i++) { const a = i * pitch; for (const [da, rad] of [[0.00, rr], [0.18, rr], [0.30, ro], [0.52, ro], [0.64, rr]]) pts.push([rad * Math.cos(a + da * pitch), rad * Math.sin(a + da * pitch)]); }
      return extrude(pts, p.t); },
    spring(p) { const seg = 24, steps = Math.round(p.N * seg), rr = p.d / 2, ring6 = 10; const centre = i => { const a = 2 * P * i / seg; return [p.D / 2 * Math.cos(a), p.pitch * i / seg - p.pitch * p.N / 2, p.D / 2 * Math.sin(a)]; };
      const sect = i => { const c = centre(i), a = 2 * P * i / seg, rad = [Math.cos(a), 0, Math.sin(a)]; return Array.from({ length: ring6 }, (_, k) => { const t = 2 * P * k / ring6; return [c[0] + rr * (Math.cos(t) * rad[0]), c[1] + rr * Math.sin(t), c[2] + rr * (Math.cos(t) * rad[2])]; }); };
      let prev = sect(0); for (let i = 1; i <= steps; i++) { const cur = sect(i); for (let k = 0; k < ring6; k++) quad(prev[k], prev[(k + 1) % ring6], cur[(k + 1) % ring6], cur[k]); prev = cur; }
      const turn = Math.sqrt(Math.pow(P * p.D, 2) + p.pitch * p.pitch); return P * rr * rr * turn * p.N; },
    bolt(p) { const hex = Array.from({ length: 6 }, (_, i) => [p.s / Math.sqrt(3) * Math.cos(P / 3 * i), p.s / Math.sqrt(3) * Math.sin(P / 3 * i)]);
      const before = T.length; extrude(hex, p.k); const head = T.splice(before); for (const t of head) T.push(t.map(q => [q[0], q[2] + p.k / 2, q[1]]));
      lathe([[0, 0], [p.d / 2, 0], [p.d / 2, -p.L], [0, -p.L]], 40);
      return 3 * Math.sqrt(3) / 2 * Math.pow(p.s / Math.sqrt(3), 2) * p.k + P * p.d * p.d / 4 * p.L; },
    take() { const out = T.splice(0); return out; }
  };
})();

const SHAPES = {
  box: { name: "Block", f: "box", p: [["w", "Width", 60], ["h", "Height", 40], ["d", "Depth", 30]], info: "V = w h d" },
  cylinder: { name: "Cylinder (shaft)", f: "cylinder", p: [["r", "Radius", 20], ["h", "Length", 80]], info: "V = pi r^2 L" },
  tube: { name: "Tube", f: "tube", p: [["ro", "Outer radius", 25], ["ri", "Inner radius", 20], ["h", "Length", 80]], info: "V = pi (ro^2 - ri^2) L" },
  cone: { name: "Cone", f: "cone", p: [["r", "Base radius", 25], ["h", "Height", 60]], info: "V = pi r^2 h / 3" },
  sphere: { name: "Sphere", f: "sphere", p: [["r", "Radius", 30]], info: "V = 4 pi r^3 / 3" },
  torus: { name: "Torus (O-ring)", f: "torus", p: [["R", "Ring radius R", 30], ["r", "Tube radius r", 8]], info: "V = 2 pi^2 R r^2" },
  ibeam: { name: "I-beam", f: "ibeam", p: [["h", "Height", 100], ["b", "Flange width", 60], ["tf", "Flange thickness", 8], ["tw", "Web thickness", 5], ["L", "Length", 120]], info: "V = section area x length" },
  lbracket: { name: "L-bracket", f: "lbracket", p: [["a", "Leg A", 60], ["b", "Leg B", 50], ["t", "Thickness", 6], ["L", "Width", 40]], info: "V = section area x width" },
  gear: { name: "Spur gear", f: "gear", p: [["N", "Teeth", 18], ["m", "Module", 3], ["t", "Face width", 12]], info: "Pitch diameter = m N, outside diameter = m (N + 2). Simplified trapezoid teeth, not an involute profile. Volume is of the toothed outline." },
  spring: { name: "Compression spring", f: "spring", p: [["d", "Wire diameter", 3], ["D", "Mean coil diameter", 24], ["N", "Coils", 6], ["pitch", "Pitch", 9]], info: "V = wire area x wire length (approximate)" },
  bolt: { name: "Hex bolt", f: "bolt", p: [["d", "Shank diameter", 10], ["L", "Shank length", 40], ["s", "Width across flats", 17], ["k", "Head height", 6.4]], info: "Head plus shank. Look up thread and head dimensions in the standard (for example ISO 4014) before drawing." }
};

TOOLS.shapes = {
  title: "3D shapes",
  render(root) {
    root.append($t("p", {}, "Parametric solids. Drag to rotate, scroll or use the zoom buttons to zoom, tick Wireframe for edges. Dimensions in mm. Volume is computed from the dimensions; enter a density from your material datasheet to get mass."));
    const bar = $t("div", { class: "tool-form" });
    const sel = $t("select", { id: "shape-sel" }, Object.keys(SHAPES).map(k => `<option value="${k}">${SHAPES[k].name}</option>`).join(""));
    const lab = $t("label", { class: "tool-field" }, "Shape "); lab.append(sel); bar.append(lab);
    const wf = $t("input", { type: "checkbox", id: "shape-wf" }), wl = $t("label", { class: "tool-field" }); wl.append(wf, document.createTextNode(" Wireframe")); bar.append(wl);
    const zi = $t("button", { type: "button", class: "icon-btn" }, "Zoom in"), zo = $t("button", { type: "button", class: "icon-btn" }, "Zoom out"), rs = $t("button", { type: "button", class: "icon-btn" }, "Reset view");
    bar.append(zi, zo, rs); root.append(bar);
    const cv = $t("canvas", { width: 720, height: 460, "aria-label": "3D view of the selected shape" }); cv.style.cssText = "max-width:100%;height:auto;border:1px solid var(--rule);touch-action:none;cursor:grab;display:block;margin:.8rem 0";
    root.append(cv);
    const params = $t("div", { class: "tool-form" }), out = $t("div", { class: "tool-out" }); root.append(params, out);
    const ctx = cv.getContext("2d"); let tris = [], ry = 0.7, rx = -0.5, zoom = 1, vol = 0, ext = 1, S, vals = {}, den = 7850;
    const rebuild = () => {
      for (const k in vals) vals[k] = parseFloat(document.getElementById("p-" + k).value);
      const bad = Object.values(vals).some(x => !(x > 0)) || (S.f === "tube" && vals.ri >= vals.ro) || (S.f === "ibeam" && (2 * vals.tf >= vals.h || vals.tw >= vals.b)) || (S.f === "gear" && vals.N < 6) || (S.f === "bolt" && vals.s < vals.d);
      if (bad) { out.innerHTML = "<p>Enter valid dimensions (all positive, inner smaller than outer, at least 6 teeth).</p>"; return; }
      GEO.take(); vol = GEO[S.f](vals); tris = GEO.take();
      let m = 0; for (const t of tris) for (const q of t) m = Math.max(m, Math.abs(q[0]), Math.abs(q[1]), Math.abs(q[2])); ext = m || 1;
      const d = parseFloat(document.getElementById("p-density")?.value) || 0;
      out.innerHTML = `<div class="tbl"><table><thead><tr><th>Result</th><th>Value</th><th>Unit</th></tr></thead><tbody><tr><td>Volume</td><td>${fmt(vol)}</td><td>mm3</td></tr><tr><td>Volume</td><td>${fmt(vol / 1000)}</td><td>cm3</td></tr><tr><td>Mass at density above</td><td>${fmt(vol * 1e-9 * d)}</td><td>kg</td></tr></tbody></table></div><p>${S.info}</p>`;
      draw();
    };
    const setup = () => {
      S = SHAPES[sel.value]; vals = {}; params.innerHTML = "";
      for (const [k, l, v] of S.p) { vals[k] = v; const r = $t("label", { class: "tool-field" }, l + " (" + (k === "N" && S.f === "gear" || (k === "N" && S.f === "spring") ? "count" : "mm") + ") "); r.append($t("input", { type: "number", step: "any", id: "p-" + k, value: v })); params.append(r); }
      const dr = $t("label", { class: "tool-field" }, "Density for mass (kg/m3, example value, use your datasheet) "); dr.append($t("input", { type: "number", step: "any", id: "p-density", value: den })); params.append(dr);
      rebuild();
    };
    function draw() {
      const W = cv.width, H = cv.height, sc = Math.min(W, H) / (2.6 * ext) * zoom, cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx), cam = 5 * ext;
      const proj = q => { let x = q[0] * cy + q[2] * sy, z = -q[0] * sy + q[2] * cy, y = q[1] * cx - z * sx; z = q[1] * sx + z * cx; const k = cam / (cam + z); return [W / 2 + x * sc * k, H / 2 - y * sc * k, z]; };
      const L = [0.35, 0.65, 0.55], ln = Math.hypot(...L), light = L.map(x => x / ln);
      const rot = q => { let x = q[0] * cy + q[2] * sy, z = -q[0] * sy + q[2] * cy, y = q[1] * cx - z * sx; z = q[1] * sx + z * cx; return [x, y, z]; };
      const list = tris.map(t => { const a = rot(t[0]), b = rot(t[1]), c = rot(t[2]); const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const nl = Math.hypot(...n) || 1; n = n.map(x => x / nl);
        return { p: [proj(t[0]), proj(t[1]), proj(t[2])], z: (a[2] + b[2] + c[2]) / 3, s: Math.abs(n[0] * light[0] + n[1] * light[1] + n[2] * light[2]) }; }).sort((a, b) => b.z - a.z);
      const dark = getComputedStyle(document.documentElement).colorScheme.includes("dark") || matchMedia("(prefers-color-scheme: dark)").matches && document.documentElement.dataset.theme !== "light";
      ctx.fillStyle = css("--bg"); ctx.fillRect(0, 0, W, H);
      const wire = wf.checked;
      for (const t of list) {
        const g = Math.round((dark ? 60 : 90) + t.s * (dark ? 150 : 140)), col = `rgb(${g},${g},${g})`;
        ctx.beginPath(); ctx.moveTo(t.p[0][0], t.p[0][1]); ctx.lineTo(t.p[1][0], t.p[1][1]); ctx.lineTo(t.p[2][0], t.p[2][1]); ctx.closePath();
        if (!wire) { ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 0.6; ctx.stroke(); }
        else { ctx.strokeStyle = css("--fg"); ctx.lineWidth = 0.5; ctx.stroke(); }
      }
    }
    let drag = null;
    cv.addEventListener("pointerdown", e => { drag = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing"; });
    cv.addEventListener("pointermove", e => { if (!drag) return; ry += (e.clientX - drag[0]) * 0.01; rx = Math.max(-1.5, Math.min(1.5, rx + (e.clientY - drag[1]) * 0.01)); drag = [e.clientX, e.clientY]; draw(); });
    cv.addEventListener("pointerup", () => { drag = null; cv.style.cursor = "grab"; });
    cv.addEventListener("wheel", e => { e.preventDefault(); zoom = Math.max(0.3, Math.min(4, zoom * (e.deltaY < 0 ? 1.1 : 0.9))); draw(); }, { passive: false });
    zi.onclick = () => { zoom = Math.min(4, zoom * 1.2); draw(); }; zo.onclick = () => { zoom = Math.max(0.3, zoom / 1.2); draw(); }; rs.onclick = () => { ry = 0.7; rx = -0.5; zoom = 1; draw(); };
    wf.addEventListener("change", draw); sel.addEventListener("change", setup);
    params.addEventListener("input", e => { if (e.target.id === "p-density") den = parseFloat(e.target.value) || 0; rebuild(); });
    setup();
  }
};

const TOOL_ORDER = ["shapes", "beam", "section", "mohr", "buckling", "spring", "gears", "units"];
if (typeof module !== "undefined") module.exports = { MATH, UNITS };
