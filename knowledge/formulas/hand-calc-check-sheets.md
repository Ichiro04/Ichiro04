# Hand-calculation check sheets

Purpose: every simulation result is only a claim until it is checked against a hand calculation or known case (agent/INSTRUCTIONS.md). Use these before and after a run.

Written by the assistant from standard textbook formulas (for example Gere, Beer and Johnston, Shigley). Verify each formula in your textbook before using it in real work. Formulas are for the stated ideal case only (linear elastic, small deflection, prismatic beam).

## How to use
1. Pick the sheet closest to your model.
2. Fill in inputs with units. Convert to SI (N, m, Pa) before computing.
3. Compute by hand. Then compare with the simulation. Record in `templates/simulation-log.md`.
4. If they differ by more than a few percent, find out why before trusting either. Reasons: boundary conditions, load application, mesh too coarse, stress singularity, or a wrong hand assumption.

## Sheet 1: Beam bending (stress)
- Maximum bending stress: sigma = M c / I
- Rectangle (b wide, h deep): I = b h^3 / 12, c = h/2, so sigma = 6 M / (b h^2)
- Solid circle (diameter d): I = pi d^4 / 64, c = d/2, so sigma = 32 M / (pi d^3)
- Maximum moment M:
  - Simply supported, centre point load P, span L: M = P L / 4
  - Simply supported, uniform load w over L: M = w L^2 / 8
  - Cantilever, end point load P: M = P L (at the fixed end)
  - Cantilever, uniform load w: M = w L^2 / 2 (at the fixed end)

## Sheet 2: Beam deflection (max)
E I is the bending stiffness.
- Simply supported, centre point load: delta = P L^3 / (48 E I)
- Simply supported, uniform load: delta = 5 w L^4 / (384 E I)
- Cantilever, end point load: delta = P L^3 / (3 E I)
- Cantilever, uniform load: delta = w L^4 / (8 E I)

## Sheet 3: Axial, torsion, direct shear
- Axial stress: sigma = F / A. Elongation: delta = F L / (A E)
- Torsion, solid circle: tau = 16 T / (pi d^3). Angle of twist: phi = T L / (G J), J = pi d^4 / 32
- Direct shear: tau = F / A (average)

## Sheet 4: Combined bending and torsion on a round shaft (solid, no axial)
- Bending stress: sigma = 32 M / (pi d^3)
- Shear stress: tau = 16 T / (pi d^3)
- von Mises: sigma' = sqrt( sigma^2 + 3 tau^2 )
- Factor of safety (yield): n = Sy / sigma'  (Sy must be looked up)

## Sheet 5: Column buckling (Euler)
- Critical load: P_cr = pi^2 E I / (K L)^2, with I the smaller section I.
- Effective length factor K (check your textbook): pinned-pinned 1.0, fixed-fixed 0.5, fixed-pinned about 0.7, fixed-free 2.0.
- Valid for slender columns only. Check the slenderness ratio against your textbook limit; for short columns use a different method (Johnson).

## Sheet 6: Stress concentration
- sigma_max = Kt x sigma_nominal. Kt comes from charts (for example Peterson) and depends on the geometry ratios. Look it up; do not estimate.
- In FEA, a sharp re-entrant corner has a theoretically infinite stress. The value keeps rising as you refine the mesh. Do not quote it as a result. See knowledge/simulation/.

## Template (copy for each check)
```
Model / part:
Date:
Loads (value, unit):
Supports:
Material (E, Sy: source):
Hand calc formula used:
Hand result (value, unit):
Simulation result (value, unit):
Difference (%):
Explanation of the difference:
```
