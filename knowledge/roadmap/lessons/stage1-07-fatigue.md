# Fatigue basics: S-N curve, endurance limit, mean stress

Roadmap: Stage 1, topic 7. Status: not started.
Prerequisites: stage1-03 and stage1-04. Draft written by the assistant. Fatigue factors and strength estimates come from charts and tables in your textbook (for example Shigley's Mechanical Engineering Design). Look them up; do not rely on this note for values. Numbers in the examples are practice inputs.

## Concept
Parts can fail at stresses well below yield if the stress repeats many times. The crack starts at a stress raiser, grows each cycle, and the part breaks suddenly at the end.

S-N curve: stress amplitude (S) against cycles to failure (N), usually log scale. For some steels the curve flattens at a stress called the endurance limit. Many other materials (for example aluminium) show no flat limit, so a fatigue strength at a stated life (such as 10^7 or 5x10^8 cycles) is used instead. Confirm which applies to your material.

## Loading terms
- sigma_max, sigma_min
- Amplitude: sigma_a = (sigma_max - sigma_min)/2
- Mean: sigma_m = (sigma_max + sigma_min)/2
- Stress ratio: R = sigma_min / sigma_max
Fully reversed: sigma_m = 0, R = -1.

## Endurance limit of the real part
Test specimens are small, polished and tested under ideal conditions. The part is not. Textbook form:
Se = ka kb kc kd ke kf * Se'
where Se' is the specimen limit and the k factors adjust for surface finish, size, load type, temperature, reliability and other effects. Look up Se' for your material (a common textbook rule for steels relates Se' to ultimate strength up to a stated strength range; check the rule and its range in your edition) and each k factor from the tables.

Stress concentration: fatigue is sensitive to notches. Kf = 1 + q (Kt - 1) where Kt is the theoretical factor from charts and q is notch sensitivity from charts. Apply Kf to the stress, per your textbook.

## Mean stress: failure criteria (sigma_a vs sigma_m)
With Se (endurance limit), Sut (ultimate) and Sy (yield):
- Goodman: sigma_a/Se + sigma_m/Sut = 1/n
- Soderberg: sigma_a/Se + sigma_m/Sy = 1/n (more conservative)
- Gerber: n sigma_a/Se + (n sigma_m/Sut)^2 = 1
Always also check yield on the first cycle: sigma_max below Sy (with factor of safety).
Goodman is a common conservative design line; your textbook or company standard decides.

## Worked example (all inputs given)
sigma_a = 60 MPa, sigma_m = 40 MPa, Se = 200 MPa, Sut = 500 MPa (practice values).

1. Goodman: 60/200 + 40/500 = 0.30 + 0.08 = 0.38.
2. n = 1/0.38 = 2.63.
3. Interpretation: both amplitude and mean must be scaled by 2.63 to reach the line. Also check yield separately.

## Common mistakes
- Using the specimen endurance limit for a real machined part with no k factors.
- Forgetting stress concentration (Kf) at notches, holes, fillets, keyways.
- Applying the endurance limit to a material that has none.
- Skipping the yield check.
- Mixing stress range with amplitude (range = 2 x amplitude).

## Self-test (key in knowledge/self-tests/)
Q1. sigma_max = 180 MPa, sigma_min = -60 MPa. Find sigma_a, sigma_m and R. With Se = 250 MPa and Sut = 600 MPa (practice values), find the Goodman factor of safety.
Q2. Name four reasons the part endurance limit is lower than the specimen value.
Q3. Why is a sharp fillet on a shaft dangerous for fatigue even when the nominal stress is low?

## My answers
(write here)

## Result
Not yet answered.
