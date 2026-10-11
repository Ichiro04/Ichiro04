# Stress transformation and Mohr's circle

Roadmap: Stage 1, topic 3. Status: not started.
Prerequisite: mechanics of materials (stress, shear stress). Draft written by the assistant; check every equation and the sign convention against your textbook before relying on it.

## Concept
The stress at a point depends on the plane you cut through it. The same point carries different normal and shear stresses on differently tilted planes. Stress transformation gives the stress on any plane from the stress on one known pair of planes.

Principal planes are the planes where shear stress is zero. The normal stresses on them are the principal stresses (sigma 1 >= sigma 2). The largest and smallest normal stresses at the point are principal stresses.

Why it matters: failure theories (next lesson) use principal stresses, and FEA output often reports principal or equivalent stress.

## Equations (2D plane stress)
Known state: sigma_x, sigma_y, tau_xy on the x and y faces. Angle theta is measured from the x axis to the new plane.

- sigma_theta = (sigma_x + sigma_y)/2 + (sigma_x - sigma_y)/2 * cos(2 theta) + tau_xy * sin(2 theta)
- tau_theta = -(sigma_x - sigma_y)/2 * sin(2 theta) + tau_xy * cos(2 theta)
- Principal stresses: sigma_1,2 = (sigma_x + sigma_y)/2 +/- R
- R = sqrt( ((sigma_x - sigma_y)/2)^2 + tau_xy^2 )
- Principal plane angle: tan(2 theta_p) = 2 tau_xy / (sigma_x - sigma_y)
- Maximum in-plane shear: tau_max,in-plane = R = (sigma_1 - sigma_2)/2

Mohr's circle is the same equations drawn: centre C = (sigma_x + sigma_y)/2 on the normal-stress axis, radius R. Points on the circle are the (sigma, tau) pairs for every plane. A plane rotated by theta in the body is rotated by 2 theta on the circle.

Sign convention: textbooks differ (for example which way positive shear is plotted). Pick your textbook's convention and keep it. Look it up and write it here: ______

Absolute maximum shear: in 3D, tau_max,abs = max of |sigma_i - sigma_j|/2 over all pairs of the three principal stresses, including sigma_3 = 0 in plane stress. If sigma_1 and sigma_2 have the same sign, the absolute maximum is larger than the in-plane value.

## Worked example (inputs are given for the example)
sigma_x = 80 MPa, sigma_y = 20 MPa, tau_xy = 30 MPa.

1. Centre C = (80 + 20)/2 = 50 MPa.
2. Half-difference = (80 - 20)/2 = 30 MPa.
3. R = sqrt(30^2 + 30^2) = 42.43 MPa.
4. sigma_1 = 50 + 42.43 = 92.43 MPa. sigma_2 = 50 - 42.43 = 7.57 MPa.
5. tan(2 theta_p) = 2(30)/(80 - 20) = 1, so 2 theta_p = 45 deg, theta_p = 22.5 deg.
6. tau_max,in-plane = R = 42.43 MPa.
7. Absolute max shear (sigma_3 = 0): largest of |92.43 - 7.57|/2 = 42.43, |92.43 - 0|/2 = 46.2, |7.57 - 0|/2 = 3.8. So 46.2 MPa, larger than the in-plane value.

Check: sigma_1 + sigma_2 = 100 MPa = sigma_x + sigma_y. The sum of normal stresses does not change with angle. Always use this check.

## Common mistakes
- Using theta where the circle needs 2 theta.
- Rotating the wrong way because of the sign convention.
- Reporting only the in-plane maximum shear when both principal stresses have the same sign.
- Forgetting sigma_3 = 0 in plane stress.
- Dropping units.

## Self-test (answer before checking anything; the key is in knowledge/self-tests/)
Q1. sigma_x = 100 MPa, sigma_y = -20 MPa, tau_xy = 40 MPa. Find the centre, R, sigma_1, sigma_2 and theta_p. Do the sum check.
Q2. Why is shear stress zero on a principal plane? What does that say about where the circle crosses the sigma axis?
Q3. sigma_1 = 80 MPa, sigma_2 = 40 MPa, sigma_3 = 0. What is the absolute maximum shear stress, and why is it not (80 - 40)/2?

## My answers
(write here)

## Result
Not yet answered.
