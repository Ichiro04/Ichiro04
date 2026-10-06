# Statics: free-body diagrams and equilibrium

Roadmap: Stage 1, topic 1. Status: in progress.

## Concept
Statics asks: if a body is not moving, what forces must act on it? A body at rest (or constant velocity) is in equilibrium: forces and moments balance.

Free-body diagram (FBD):
1. Isolate the body.
2. Draw it alone.
3. Replace everything removed with the forces and moments it applied.
4. Add axes and dimensions.

Most statics mistakes are FBD mistakes, not algebra mistakes.

## Equations (2D)
- Sum Fx = 0
- Sum Fy = 0
- Sum M = 0 (about any point)

Three independent equations, so at most 3 unknowns by statics alone.

Moment = force x perpendicular distance (N.m). Take moments about a point where unknown forces pass through, so they drop out.

## Support reactions
| Support | Reactions | Unknowns |
|---|---|---|
| Roller | one force, perpendicular to surface | 1 |
| Pin | two force components (x, y) | 2 |
| Fixed | two force components and a moment | 3 |

## Worked example
Simply supported beam, 4 m long. Pin at A (left), roller at B (right). Downward 10 kN load 1 m from A.

1. Sum Fx = 0 gives Ax = 0.
2. Moments about A (counter-clockwise positive): By(4) - 10(1) = 0, so By = 2.5 kN up.
3. Sum Fy = 0: Ay + By - 10 = 0, so Ay = 7.5 kN up.
4. Check with moments about B: -Ay(4) + 10(3) = 0, so Ay = 7.5 kN. OK.

Sanity check: load is closer to A, so A carries more.

## Common mistakes
- Forgetting a reaction at a support.
- Mixing up signs. Pick a positive direction and keep it.
- Using distance along the beam instead of the perpendicular distance.
- Skipping units.

## Self-test (my answers go below; do not look anything up first)
Q1. Simply supported beam, 6 m long, pin at A (left), roller at B (right), downward 12 kN load 2 m from A. Find Ay, Ax, By with equations and units.
Q2. Why at most 3 unknowns in a 2D statics problem? What does it mean if the FBD has 4 unknown reactions?
Q3. Why does a pin give 2 reaction components while a roller gives 1?

## My answers
(write here)

## Result
Not yet answered.
