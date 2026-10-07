// Run: node site/test-tools.js  (checks the tool maths against hand calculations)
const { MATH, UNITS } = require("./tools.js");
const assert = require("assert");
const near = (a, b, tol = 1e-6) => assert(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} != ${b}`);
// Vault statics worked example: 4 m beam, 10 kN at 1 m from A -> Ay 7.5, By 2.5, Mmax 7.5 kN.m
let r = MATH.beam("ss-point", 4, 10000, 1, 1e6);
near(r.R.RA, 7500); near(r.R.RB, 2500); near(r.Mmax, 7500);
near(r.V(0.5), 7500); near(r.V(2), -2500); near(r.M(1), 7500);
// Centre load: delta = P L^3 / (48 EI)
r = MATH.beam("ss-point", 4, 10000, 2, 1e6); near(r.defl, 10000 * 64 / (48 * 1e6));
// Off-centre load vs numeric double integration of M/EI
{ const L = 4, P = 10000, a = 1, EI = 1e6, n = 40000, h = L / n, f = MATH.beam("ss-point", L, P, a, EI);
  let th = 0, y = 0; const ys = [], ths = []; for (let i = 0; i <= n; i++) { ths.push(th); th += f.M(i * h) / EI * h; }
  let yy = 0; for (let i = 0; i <= n; i++) { ys.push(yy); yy += ths[i] * h; }
  const slope = ys[n] / L; let mx = 0; for (let i = 0; i <= n; i++) mx = Math.max(mx, Math.abs(ys[i] - slope * i * h));
  near(f.defl, mx, 1e-3); }
near(MATH.beam("ss-udl", 4, 1000, 0, 1e6).defl, 5 * 1000 * 256 / (384 * 1e6));
near(MATH.beam("cant-point", 2, 1000, 0, 1e6).defl, 1000 * 8 / (3 * 1e6));
near(MATH.beam("cant-udl", 2, 1000, 0, 1e6).defl, 1000 * 16 / (8 * 1e6));
// Mohr: sx=80, sy=-20, txy=30 -> c=30, R=58.31
let m = MATH.mohr(80, -20, 30); near(m.c, 30); near(m.R, Math.hypot(50, 30)); near(m.s1 + m.s2, 60);
// pure shear: s1 = t, s2 = -t, 45 deg, von Mises = sqrt(3) t
m = MATH.mohr(0, 0, 10); near(m.s1, 10); near(m.s2, -10); near(m.th, Math.PI / 4); near(m.vm, Math.sqrt(3) * 10);
// Uniaxial: von Mises equals the stress
near(MATH.mohr(100, 0, 0).vm, 100);
// Euler: pinned-pinned, E=200 GPa, I=1e-6 m4, L=2 m -> pi^2*200e9*1e-6/4
near(MATH.euler(200e9, 1e-6, 2, 1), Math.PI ** 2 * 200e9 * 1e-6 / 4);
// Section: 50x100 rectangle I=4166666.67, circle d=50 I=pi d^4/64
near(MATH.section("rect", { b: 50, h: 100 }).I, 50 * 1e6 / 12);
near(MATH.section("circle", { d: 50 }).I, Math.PI * 50 ** 4 / 64);
near(MATH.section("ibeam", { h: 100, b: 100, tf: 10, tw: 10 }).I, (100 * 1e6 - 90 * 80 ** 3) / 12);
// Spring: G=79e3 N/mm2, d=3, D=24, N=8 -> k = 79e3*81/(8*13824*8)
near(MATH.spring(79e3, 3, 24, 8, 100).k, 79e3 * 81 / (8 * 13824 * 8));
// Gear
const g = MATH.gear(20, 60, 2, 1500, 10, 1); near(g.ratio, 3); near(g.n2, 500); near(g.T2, 30); near(g.center, 80);
// Units
near(UNITS.Length.u.in, 0.0254); near(1 * UNITS["Pressure and stress"].u.psi / UNITS["Pressure and stress"].u.kPa, 6.894757293168);
console.log("All tool checks passed");
