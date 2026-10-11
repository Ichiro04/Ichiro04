# Stage 1 diagrams (plain text)

Text diagrams for the Stage 1 topics. Drawn by the assistant, not to scale. They match the worked examples in the lessons.

## 1. Free-body diagram: statics worked example
Beam 4 m, pin at A, roller at B, 10 kN down at 1 m from A. Answer from the lesson: Ax = 0, Ay = 7.5 kN, By = 2.5 kN.
```
 Step 1: the real situation        Step 2: the free body (supports replaced by forces)

        10 kN                              10 kN
          |                                  |
 A========v=========B              Ay=7.5 ^    v      ^ By=2.5
 ^ pin         roller ^                   |    |      |
                                  A=======*====v=====*=======B
                                  Ax=0    1 m          3 m
```

## 2. Support types
```
 Roller (1 unknown)      Pin (2 unknowns)        Fixed (3 unknowns)
        |                       |                  ||
   ----(o)----             ----/\----             ||=======
        ^ force normal      -> and ^ forces       ||  forces x, y and a moment
```

## 3. Shear force and bending moment diagrams (same beam)
Cut at x from A. V = shear force, M = bending moment (sagging positive).
```
 Load:       10 kN
              v
 A==========================B     x: 0 ... 1 ... 4 (m)
 Ay=7.5                    By=2.5

 V (kN)
  +7.5 |-------+
       |       |
     0 +-------+-----------------+-> x
       |       |
  -2.5 |       +-----------------+
 jump of 10 kN at the load (7.5 - 10 = -2.5)

 M (kN.m)
  7.5  |       /\ peak at x = 1 m
       |      /  \
       |     /    \
     0 +----+------\------------+-> x
       0           1             4
 M(1) = 7.5 x 1 = 7.5 kN.m; slope of M = V (+7.5, then -2.5); M(4) = 7.5 - 2.5 x 3 = 0
```
Rule: M is largest where V changes sign. Use that to find where to check bending stress.

## 4. Stress state on an element (plane stress)
```
              sigma_y
               |
          +----v----+
          |         |
 tau_xy -> |  point  | <- tau_xy ... (shear acts on all four faces)
 sigma_x <-|         |-> sigma_x
          +----^----+
               |
             sigma_y
```

## 5. Mohr's circle (stage1-03 example, not to scale)
sigma_x = 80, sigma_y = 20, tau_xy = 30 MPa. Centre 50, R = 42.43. Plotting direction of tau depends on your textbook's sign convention.
```
 tau
  ^                 X (80, 30)
  |             .--*--.
  |          .'    |    '.
  |         /      |      \
  +---(s2)---------C---------(s1)---------> sigma
  0   7.57         50        92.43
  |         \      |      /
  |          '.    |    .'
  |             '--*--'
                 Y (20, -30)
 s1 = C + R = 92.43   s2 = C - R = 7.57   (both on the sigma axis, where tau = 0)
 Angle on the circle from X to s1 = 2 theta_p = 45 deg -> plane rotated 22.5 deg
```

## 6. von Mises and Tresca yield envelopes (plane stress, idea only)
```
 sigma_2
    ^        Tresca: hexagon (inside the ellipse)
    |      __________
    |     /          \          von Mises: ellipse (around it)
    |    /    safe    \
 ---+---+-------------+---> sigma_1
    |    \            /
    |     \__________/
 Points inside the shape: no yield. Tresca is the more conservative of the two.
```

## 7. S-N curve and the mean stress line
```
 stress amplitude Sa              Goodman (sigma_a vs sigma_m)
   ^                                sigma_a ^
   |  .                                  Se |\
   |    .                                   | \  Goodman line
   |       .____________ Se                 |  \   (inside = safe)
   |   (endurance limit, some steels)       |   \
   +------------------------> N (log)      +----\--------> sigma_m
                                                  Sut
```
