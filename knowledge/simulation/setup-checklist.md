# Simulation setup checklist

Fill in before running. Copy to the project folder.

## Goal
- What question is the simulation answering?
- What result would change a design decision?

## Geometry
- [ ] Simplified: removed small fillets, holes and threads that do not matter for this question
- [ ] Symmetry used where valid

## Material
- [ ] Properties from a documented source (record the source)
- [ ] Linear or nonlinear behaviour decided and justified
- [ ] Units consistent

## Loads
- [ ] Every load has a physical source
- [ ] Direction, magnitude and application area checked
- [ ] Load case combinations listed

## Boundary conditions
- [ ] Not over-constrained (no fake stiffness)
- [ ] Not under-constrained (no rigid-body motion)
- [ ] Reactions checked against applied loads

## Contacts and connections
- [ ] Contact types chosen on purpose
- [ ] Bolts and pins modelled at the right level of detail

## Mesh
- [ ] Finer mesh where stress changes quickly
- [ ] Mesh quality metrics checked
- [ ] Convergence study done on the result that matters

## Results review
- [ ] Reactions equal applied loads
- [ ] Deformation shape looks physically sensible
- [ ] Peak stress not at a singularity (point load, sharp corner, constraint edge)
- [ ] Compared with a hand calculation
- [ ] Safety factor computed against the correct failure criterion
