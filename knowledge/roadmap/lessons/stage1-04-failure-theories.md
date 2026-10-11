# Failure theories: max normal stress, Tresca, von Mises

Roadmap: Stage 1, topic 4. Status: not started.
Prerequisite: stage1-03 (principal stresses). Draft written by the assistant; verify against your textbook. Material strengths (Sy, Sut) must be looked up for your actual material and condition. The numbers in the examples are inputs for practice only, not material data.

## Concept
Test data gives yield strength from a simple tension test (one stress). Real parts have combined stress. A failure theory converts a combined stress state into one number you can compare with the test result.

- Ductile materials usually yield: use Tresca or von Mises.
- Brittle materials usually fracture: use maximum normal stress (or Mohr-Coulomb type theories). Your textbook states the rules for tension vs compression.

## Equations
Principal stresses sigma_1 >= sigma_2 >= sigma_3 (sigma_3 = 0 in plane stress, but order them with the zero included).

Maximum shear stress (Tresca): yielding begins when the largest of |sigma_1 - sigma_2|, |sigma_2 - sigma_3|, |sigma_1 - sigma_3| equals Sy.

von Mises (distortion energy): equivalent stress
sigma' = sqrt( 1/2 [ (sigma_1 - sigma_2)^2 + (sigma_2 - sigma_3)^2 + (sigma_3 - sigma_1)^2 ] )
Plane stress: sigma' = sqrt( sigma_1^2 - sigma_1 sigma_2 + sigma_2^2 )
From components: sigma' = sqrt( sigma_x^2 - sigma_x sigma_y + sigma_y^2 + 3 tau_xy^2 )
Yield predicted when sigma' = Sy.

Maximum normal stress: failure when sigma_1 reaches the strength in tension, or |sigma_3| reaches the strength in compression.

Factor of safety (yield): n = Sy / sigma' (von Mises) or n = Sy / (largest Tresca difference).

Tresca is never less conservative than von Mises. They agree in simple tension, and differ most in pure shear.

## Worked example (inputs given)
sigma_1 = 100 MPa, sigma_2 = 40 MPa, sigma_3 = 0. Assume Sy = 250 MPa for this exercise.

1. von Mises: sigma' = sqrt(100^2 - 100(40) + 40^2) = sqrt(7600) = 87.18 MPa.
2. n(von Mises) = 250 / 87.18 = 2.87.
3. Tresca: differences are |100 - 40| = 60, |40 - 0| = 40, |100 - 0| = 100. Largest = 100 MPa.
4. n(Tresca) = 250 / 100 = 2.50.

Tresca gives the smaller n, as expected. Neither is "the true answer": they are models. Which one your company, code, or textbook uses should be written down in the project.

## Reading FEA with this
FEA programs report von Mises stress by default. It is a single scalar with no sign, so it hides whether the stress is tension or compression. Check principal stresses too, and use the right theory for brittle materials.

## Common mistakes
- Comparing sigma_1 alone with Sy for a ductile material in a biaxial state.
- Leaving sigma_3 = 0 out of the Tresca differences.
- Using a yield-based theory for a brittle material.
- Using von Mises on a stress singularity (see knowledge/simulation/).

## Self-test (key in knowledge/self-tests/)
Q1. sigma_x = 120 MPa, sigma_y = -40 MPa, tau_xy = 30 MPa, Sy = 300 MPa (practice value). Find the principal stresses, the von Mises stress, and n for von Mises and Tresca.
Q2. Why does von Mises make it possible to compare a combined stress state with a simple tension test? Say it in two sentences.
Q3. Hydrostatic state: sigma_1 = sigma_2 = sigma_3 = 100 MPa. What do von Mises and Tresca predict? What does that tell you about what causes yielding?

## My answers
(write here)

## Result
Not yet answered.
