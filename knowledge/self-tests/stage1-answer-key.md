# Stage 1 answer key (do not open until you have tried the problems)

Written by the assistant. Each numeric answer was recomputed with a script. Directions: up positive for forces, counter-clockwise positive for moments unless stated.

## stage1-problems.md
S1. Ax = 0. Moments about A: By(5) - 20(2) = 0, so By = 8 kN up. Ay = 20 - 8 = 12 kN up.
S2. Resultant = 5 x 8 = 40 kN, acting at the middle (4 m from A). Ax = 0, Ay = By = 20 kN up.
S3. Ay = 15 kN up. Ax = 0. Moment at A: 15 x 3 = 45 kN.m, acting to oppose the load (counter-clockwise for a downward end load on a beam fixed on the left).
S4. By = (10(3) + 20(7))/10 = 17 kN up. Ay = 30 - 17 = 13 kN up. Check by moments about B: 13(10) = 130 and 10(7) + 20(3) = 130. OK.
S5. Unknowns: Ax, Ay, Bx, By = 4. Only 3 equations. Not determinate by statics alone. With only vertical loads the vertical reactions can be found, but the horizontal reactions cannot be separated (statically indeterminate to the first degree). Solving it needs an extra equation from deformation (compatibility).

M1. A = pi (0.010)^2 = 3.1416e-4 m^2. Stress = 50 000 / 3.1416e-4 = 159.15 MPa.
M2. Strain = 100e6 / 200e9 = 5.0e-4. Elongation = 5.0e-4 x 2000 mm = 1.0 mm.
M3. tau = 16 T / (pi d^3) = 16(500) / (pi (0.04)^3) = 39.79 MPa.
M4. sigma = 6 M / (b h^2) = 6(5000) / (0.050 x 0.100^2) = 60 MPa.
M5. A = pi (0.006)^2 = 1.131e-4 m^2. tau = 10 000 / 1.131e-4 = 88.42 MPa.

## Lesson self-tests

### stage1-01-statics
Q1. Ax = 0, Ay = 8 kN up, By = 4 kN up (By(6) = 12(2); Ay = 12 - 4).
Q2. Three independent equilibrium equations in 2D, so at most three unknowns can be solved. Four or more unknown reactions means the problem is statically indeterminate: you need extra equations (deformation compatibility).
Q3. A pin stops movement in both directions (x and y) but allows rotation, so two force components. A roller allows movement along the surface and rotation, so only the force perpendicular to the surface.

### stage1-03-mohrs-circle
Q1. Centre = 40 MPa. R = sqrt(60^2 + 40^2) = 72.11 MPa. sigma_1 = 112.11 MPa, sigma_2 = -32.11 MPa. tan(2 theta_p) = 80/120, so theta_p = 16.85 deg. Sum check: 112.11 - 32.11 = 80 = 100 + (-20). OK.
Q2. Principal planes are defined as the planes with no shear. On Mohr's circle, tau = 0 is the sigma axis, so principal stresses are where the circle crosses that axis.
Q3. Absolute max shear = max of |80-40|/2 = 20, |80-0|/2 = 40, |40-0|/2 = 20, so 40 MPa. The in-plane value of 20 MPa ignores the third principal stress (zero), which is the other end of the largest difference.

### stage1-04-failure-theories
Q1. Centre = 40, R = sqrt(80^2 + 30^2) = 85.44. sigma_1 = 125.44 MPa, sigma_2 = -45.44 MPa, sigma_3 = 0. von Mises = sqrt(120^2 - 120(-40) + 40^2 + 3(30)^2) = sqrt(23 500) = 153.30 MPa (check from principals: same). n(vM) = 300/153.30 = 1.96. Tresca: differences 170.88, 45.44, 125.44. Largest = 170.88. n(Tresca) = 300/170.88 = 1.76.
Q2. The von Mises stress is the uniaxial tensile stress that would carry the same distortion energy as the actual state. So you can compare it directly with the yield strength measured in a tension test.
Q3. Both give zero (all differences are zero). Equal all-round stress changes volume but does not distort the shape. Yielding of ductile metals is driven by shear or distortion, not by hydrostatic pressure.

### stage1-07-fatigue
Q1. sigma_a = (180 - (-60))/2 = 120 MPa. sigma_m = (180 + (-60))/2 = 60 MPa. R = -60/180 = -0.333. Goodman: 120/250 + 60/600 = 0.48 + 0.10 = 0.58, so n = 1.72.
Q2. Any four of: surface finish (rougher than the polished specimen), size (larger parts have more flaws), load type, temperature, required reliability, and other effects such as corrosion, residual stress, or coatings. Also stress concentration at notches.
Q3. A sharp fillet gives a high local stress (high Kt and Kf), and cracks start at the highest local stress. Nominal stress hides it, so the actual local amplitude can be much higher than the nominal.

### stage1-02-mechanics-of-materials
Q1. A = pi (0.0125)^2 = 4.909e-4 m^2. Stress = 80 000 / 4.909e-4 = 162.97 MPa. Elongation = sigma L / E = 162.97e6 x 1.5 / 200e9 = 1.22e-3 m = 1.22 mm.
Q2. tau = 16 T / (pi d^3) = 16(200) / (pi (0.03)^3) = 37.73 MPa, at the outer surface (zero at the centre).
Q3. Bending stress is largest at the outer fibres and near zero at the neutral axis, so material near the centre carries little. Moving the same mass outward (a tube) raises I, so the stress for a given moment falls.

### stage1-05-beam-deflection-buckling
Q1. I = 0.040 x 0.080^3 / 12 = 1.7067e-6 m^4. delta = P L^3 / (48 E I) = 5000 x 8 / (48 x 200e9 x 1.7067e-6) = 2.44 mm.
Q2. I = pi d^4 / 64 = pi (0.02)^4 / 64 = 7.854e-9 m^4. P_cr = pi^2 E I / (K L)^2 with K = 1: pi^2 x 200e9 x 7.854e-9 / 1.5^2 = 6890 N = 6.89 kN.
Q3. (a) Length doubles: P_cr falls to 1/4 of the value (1.72 kN). (b) Fixed-fixed, K = 0.5: P_cr rises by a factor of 4 (27.6 kN). Check K values in your textbook.

### stage1-06-stress-concentration
Q1. Net area = (100 - 20) x 10 = 800 mm^2. sigma_nom = 40 000 / 800 = 50 MPa. sigma_max = 2.5 x 50 = 125 MPa.
Q2. Any three of: larger fillet radius; a relief groove or undercut; a stepped (tapered) transition instead of one abrupt step; smaller diameter ratio between the two sections; move the feature away from the highest-stress location; shape or position holes to relieve the stress.
Q3. Ask whether the corner is a real feature with a real radius or a sharp model corner. A singular corner's stress increases with finer meshing, so it is not a valid result. Check mesh convergence away from the singularity, use a realistic radius, compare with Kt from a chart and a hand calculation.
