# Learning roadmap: Mechanical Design and Simulation

Work through the stages in order. Each stage ends with a self-test. Do not move on until you can explain the stage in your own words and solve a problem by hand.

Mark each topic: `[ ]` not started, `[~]` in progress, `[x]` can explain and solve.

## Stage 1: Fundamentals (hand calculation first)
- [ ] Statics: free-body diagrams, equilibrium, reactions
- [ ] Mechanics of materials: stress, strain, axial, torsion, bending, shear
- [ ] Stress transformation, Mohr's circle, principal stresses
- [ ] Failure theories: von Mises, Tresca, max normal stress
- [ ] Beam deflection, buckling
- [ ] Stress concentration
- [ ] Fatigue basics: S-N curves, endurance limit, mean stress
- [ ] Material properties and selection basics
- Self-test: size a shaft or bracket by hand, with units and a safety factor.

## Stage 2: Machine design
- [ ] Fasteners and bolted joints
- [ ] Welds
- [ ] Shafts, keys, couplings
- [ ] Bearings
- [ ] Gears
- [ ] Springs
- [ ] Tolerances, fits, GD&T
- [ ] Manufacturing processes and design for manufacture
- Self-test: design a small assembly with a calculation sheet for each critical part.

## Stage 3: CAD discipline (SolidWorks, AutoCAD)
- [ ] Sketch rules: fully defined sketches, sensible constraints
- [ ] Feature order and design intent
- [ ] Assemblies and mates
- [ ] Configurations and design tables
- [ ] Drawings: views, dimensions, tolerances, notes
- [ ] AutoCAD 2D drafting standards
- Self-test: a part that survives a dimension change without rebuild errors.

## Stage 4: Simulation theory
- [ ] Finite element method: elements, nodes, shape functions, stiffness idea
- [ ] Linear static analysis
- [ ] Boundary conditions and loads: what is physically realistic
- [ ] Mesh quality, convergence, mesh refinement study
- [ ] Contacts and connections
- [ ] Singularities and how to read stress hot spots
- [ ] Modal (natural frequency) analysis
- [ ] Thermal and thermal-stress analysis
- [ ] Buckling analysis
- [ ] Nonlinear basics: material, geometric, contact
- [ ] CFD basics: governing equations, meshing, turbulence models, y+
- Self-test: validate a simulation against a hand calculation and explain any difference.

## Stage 5: Verification and practice
- [ ] Verification vs validation
- [ ] Sanity checks for every result
- [ ] Writing a clear analysis report
- [ ] Design review habit
- [ ] Building a portfolio piece from a finished project

## Rule for every topic
1. Learn it from a textbook or course.
2. Write a short note in your own words in `knowledge/`.
3. Solve a hand problem. Record it.
4. Link the note to any project that used it.
