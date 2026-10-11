# Mechanics of materials: stress, strain, axial, torsion, bending, shear

Roadmap: Stage 1, topic 2. Status: not started (draft by the assistant; verify against your textbook).
Prerequisite: stage1-01 statics. Material values (E, G, Sy) must be looked up. Numbers below are practice inputs.

## Concept
Statics finds the forces. Mechanics of materials finds what the material feels (stress) and how much it deforms (strain).

- Stress = force / area (Pa = N/m^2; 1 MPa = 1 N/mm^2).
- Normal stress sigma acts perpendicular to a cut. Shear stress tau acts along it.
- Strain = change in length / original length (no units). Shear strain gamma is an angle change (rad).
- Hooke's law (elastic range): sigma = E epsilon, tau = G gamma.
- Poisson's ratio nu: lateral strain = -nu x axial strain.

Method for every problem: cut the part (section method) -> internal force or moment from equilibrium -> stress from the formula -> compare with allowable.

## Diagram: stress-strain curve (tension test, ductile metal, not to scale)
```
 stress
   ^
   |              UTS
   |            ___x___
   |           /       \___
   |   Sy     /            x  fracture
   |    x----'
   |   /
   |  /   slope = E (elastic)
   | /
   +-------------------------> strain
   0  (unloading parallel to the elastic line leaves permanent strain)
```
Sy = yield strength. UTS = ultimate tensile strength. Stay below Sy in normal service.

## Equations (linear elastic, simple cases)
| Load | Stress | Deformation | Valid when |
|---|---|---|---|
| Axial force F | sigma = F/A | delta = F L / (A E) | uniform section, away from the ends and holes |
| Torque T, solid round shaft | tau_max = 16 T/(pi d^3) = T r / J | phi = T L/(G J), J = pi d^4/32 | circular sections only |
| Bending moment M | sigma = M y / I | see stage1-05 | plane sections stay plane |
| Direct shear force V | tau_avg = V/A | | average only; true shear is not uniform |
| Transverse shear in beam | tau = V Q/(I b) | | look up Q and b in your textbook |

## Diagram: bending stress across a beam section
```
 section            stress (side view)
 +-------+ top      compression (-)
 |       |          <----|
 |   +   | neutral  ------+---- sigma = 0 at the neutral axis
 |       |          |---->
 +-------+ bottom   tension (+)
        sigma = M y / I, linear in y, largest at the outer fibres
```
Moment of inertia: rectangle I = b h^3/12; circle I = pi d^4/64. Depth h counts to the third power, which is why deep beams are stiff.

## Diagram: torsion of a round shaft
```
   T  ->  ============================  <- T
          |<-----------L------------>|
 cross-section: shear stress grows linearly with radius
          tau = 0 at the centre, tau_max at the surface
```

## Worked example (inputs given)
Steel rod: d = 20 mm, L = 2 m, F = 30 kN axial, E = 200 GPa (practice value).
1. A = pi (0.010)^2 = 3.1416e-4 m^2.
2. sigma = 30 000 / 3.1416e-4 = 95.49 MPa.
3. epsilon = 95.49e6 / 200e9 = 4.77e-4.
4. delta = epsilon L = 4.77e-4 x 2 m = 0.955 mm.
Check units: N / m^2 = Pa; (Pa/Pa) = no units; strain x m = m.

## Common mistakes
- mm vs m in areas and lengths. Convert to SI first.
- Using the diameter as the radius (or the reverse) in J and A.
- Treating average shear stress as the maximum.
- Using the torsion formula for a non-circular section.
- Applying sigma = F/A at a hole or a sharp change in section (see stage1-06).

## Self-test (key in knowledge/self-tests/stage1-answer-key.md)
Q1. Steel bar, d = 25 mm, L = 1.5 m, axial tension 80 kN, E = 200 GPa (practice). Find the stress in MPa and the elongation in mm.
Q2. Solid shaft, d = 30 mm, T = 200 N.m. Find the maximum shear stress in MPa. Where on the section does it occur?
Q3. Explain in two sentences why a hollow tube resists bending better per kg than a solid bar of the same material and mass.

## My answers
(write here)

## Result
Not yet answered.
