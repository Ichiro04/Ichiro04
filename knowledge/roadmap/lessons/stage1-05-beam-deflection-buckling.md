# Beam deflection and column buckling

Roadmap: Stage 1, topic 5. Status: not started (draft by the assistant; verify against your textbook).
Prerequisites: stage1-01 and stage1-02. E and section values must be looked up for real work. Numbers are practice inputs.

## Concept
Strength asks "does it break?". Stiffness asks "how much does it bend?". A beam can be strong enough and still too flexible. A slender column can fail by buckling long before the material yields.

Deflection depends on E I (bending stiffness), the load, and the span. Span enters as L^3 or L^4, so a small increase in length costs a lot of stiffness.

Buckling is a stability failure: past a critical load the straight shape is no longer stable, and the column bows sideways suddenly. It depends on E I and length, not on yield strength.

## Diagram: standard beam cases
```
Simply supported, centre load P       Simply supported, uniform load w
       P                              w w w w w w w w
       |                              | | | | | | | |
  A----v----B                         A---------------B
  ^         ^   delta_max at centre   ^               ^
  |<---L--->|                         |<------L------>|

Cantilever, end load P                Cantilever, uniform load w
 fixed |=======================        fixed |=======================
       |                  |                 | w w w w w w w w
       |                  v P              | | | | | | | | |
       |<-------L-------->|                 |<-------L------>|
 delta_max at the free end
```
Maximum deflection (ideal, linear elastic, small deflection):
- Simply supported, centre load: delta = P L^3/(48 E I)
- Simply supported, uniform load: delta = 5 w L^4/(384 E I)
- Cantilever, end load: delta = P L^3/(3 E I)
- Cantilever, uniform load: delta = w L^4/(8 E I)
Superposition: for several loads, add the deflections of each load alone.

Where they come from: E I d2v/dx2 = M(x). Integrate twice and use the boundary conditions (v = 0 at pins, v = 0 and slope = 0 at a fixed end). Derive one case by hand to see where the constants come from.

## Euler buckling (slender columns)
P_cr = pi^2 E I / (K L)^2, with I the smaller principal moment of the section.

Diagram: effective length factor K (check values in your textbook)
```
 pinned-pinned   fixed-fixed    fixed-pinned    fixed-free
    ( )            |  |            |  )            |
   /   \          /    \          /    \           |
  |     |        |      |        |      |          |  (free end moves)
  K = 1.0        K = 0.5        K about 0.7        K = 2.0
```
Fixing the ends raises P_cr a lot. Doubling the length divides P_cr by 4.

Validity: Euler's formula is for slender columns (high slenderness ratio L/r, r = sqrt(I/A)). Check the limit in your textbook. For short or intermediate columns use the method your textbook gives (for example Johnson).

## Worked example (inputs given)
Simply supported beam, L = 2 m, centre load P = 3 kN, rectangular section 40 mm wide x 80 mm deep (80 mm vertical), E = 200 GPa (practice value).
1. I = b h^3/12 = 0.040 x 0.080^3 / 12 = 1.7067e-6 m^4.
2. E I = 200e9 x 1.7067e-6 = 3.4133e5 N.m^2.
3. delta = P L^3/(48 E I) = 3000 x 8 / (48 x 3.4133e5) = 24 000 / 1.6384e7 = 1.465e-3 m = 1.46 mm.
Sanity: deflection is small vs the span (L/1000 is about 2 mm), consistent with the small-deflection assumption.

## Common mistakes
- Using the strong-axis I when the beam is loaded about the weak axis (or the reverse).
- Using h and b the wrong way round in I = b h^3/12 (h is the depth in the bending direction).
- Applying beam formulas to large deflections.
- Using Euler for a short, stocky column.
- Forgetting that the column buckles about its weakest axis.

## Self-test (key in knowledge/self-tests/stage1-answer-key.md)
Q1. Simply supported beam, L = 2 m, centre load 5 kN, section 40 x 80 mm (80 vertical), E = 200 GPa (practice). Find I and the maximum deflection in mm.
Q2. Pinned-pinned round column, d = 20 mm, L = 1.5 m, E = 200 GPa (practice). Find P_cr in kN.
Q3. For the column in Q2, what happens to P_cr if (a) the length doubles, (b) both ends become fixed? Give the factors.

## My answers
(write here)

## Result
Not yet answered.
