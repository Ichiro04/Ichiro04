# Stress concentration

Roadmap: Stage 1, topic 6. Status: not started (draft by the assistant; verify against your textbook).
Prerequisites: stage1-02. Kt values come from charts (for example Peterson's). Look them up; do not estimate. Numbers below are practice inputs.

## Concept
Nominal stress formulas (F/A, M c/I, T r/J) assume smooth, uniform geometry. Holes, notches, sharp fillets, keyways and shoulders disturb the flow of force, and the stress near the feature is higher than the nominal value.

Stress concentration factor: Kt = sigma_max / sigma_nominal.
Kt depends on geometry only (ratios like hole diameter to width, fillet radius to shaft diameter), in linear elastic behaviour. Read which nominal stress the chart uses (gross section or net section, bending or tension) before applying it.

Effects fade away from the feature (Saint-Venant's principle): about a feature size away, stress is back to nominal.

## Diagram: plate with a central hole in tension
```
        sigma_nom (far away)
          | | | | | |
     +----v-v-v-v-v-v----+
     |                   |
     |      .-----.      |   stress along the section through the hole:
 --> |     (  hole )     | <--
     |      '-----'      |      sigma_max at the hole edge
     |                   |         ^
     +----^-^-^-^-^-^----+         |  .
          | | | | | |             |    .   .   .   (back toward nominal)
          sigma_nom               +-------------------> distance from hole
```
Textbook result for a small circular hole in a wide plate under uniform tension: Kt = 3 at the hole edge, based on the stress far from the hole. For a finite-width plate, use the chart, which usually bases the stress on the net section.

## Diagram: why fillet radius matters
```
 sharp shoulder: force flow bunches up      generous fillet: smoother flow
      ______                                     ______
     |                                          |
  ===+                                       ===(  <- larger radius r
     |______                                    |______
 Kt high                                     Kt lower (grows as r/d falls)
```
Rule: Kt rises as r/d falls. A bigger radius is almost always the cheapest fix.

## When to use Kt
- Brittle material under static load: use Kt.
- Ductile material under static load: local yielding often relieves the peak; many textbooks do not apply Kt to the static yield check. State which rule you follow.
- Fatigue: always consider the concentration. Use the fatigue factor Kf = 1 + q(Kt - 1) from stage1-07, with q from charts.

## FEA warning
A sharp internal corner in a model has a theoretical infinite stress. Refining the mesh makes the maximum stress climb without end. Do not quote that number. Use a realistic radius, or evaluate stress away from the singular point (knowledge/simulation/).

## Worked example (inputs given)
Plate: width w = 100 mm, thickness t = 10 mm, central hole d = 20 mm, axial force F = 40 kN. Assume the chart Kt (net-section basis) = 2.5 for this ratio (practice value, not from a chart).
1. Net area = (100 - 20) x 10 mm^2 = 800 mm^2.
2. sigma_nom (net) = 40 000 N / 800 mm^2 = 50 MPa.
3. sigma_max = Kt sigma_nom = 2.5 x 50 = 125 MPa.
Check: the gross-section stress is 40 000/1000 = 40 MPa, lower than the net value, as it should be.

## Common mistakes
- Using Kt with the wrong nominal stress (gross vs net).
- Estimating Kt instead of reading the chart.
- Applying Kt in a ductile static case without stating the rule.
- Forgetting Kf in fatigue.
- Trusting a mesh-dependent stress at a sharp corner.

## Self-test (key in knowledge/self-tests/stage1-answer-key.md)
Q1. Plate 100 mm wide, 10 mm thick, hole d = 20 mm, F = 40 kN, chart Kt = 2.5 on the net section (practice). Find sigma_nom (net) and sigma_max.
Q2. Give three design changes that reduce Kt at a shaft shoulder.
Q3. A colleague quotes the peak von Mises stress at a sharp corner in an FEA model and says the part fails. What do you answer and what do you check?

## My answers
(write here)

## Result
Not yet answered.
