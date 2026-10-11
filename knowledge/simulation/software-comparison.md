# Simulation software comparison (open item 2)

Written 2026-10-11 by the assistant from web searches. Limits and prices change with each release: check the vendor page before deciding. Where I did not research something it says so.

## The decision to make
Which tool should you learn FEA on, given that you use SolidWorks and AutoCAD on Windows, you are on a design and simulation path, and your rule is "verify against a hand calculation".

## Findings
| Tool | What I found | Source |
|---|---|---|
| SolidWorks Simulation | Described as one of the simplest to learn because it lives inside SolidWorks. Positioned as the tool for early design stages (linear static, fatigue, thermal checks). Which Simulation package your licence includes: not researched. Ask your reseller or check your SolidWorks licence. | [OhMyCAD overview](https://ohmycad.com/en/solidworks-simulation-analysis-of-the-leading-mechanical-simulation-software-on-the-market-strengths-and-weaknesses/), [GoEngineer (SolidWorks reseller)](https://www.goengineer.com/en-us/blog/solidworks-simulation-vs-abaqus) |
| Abaqus | Higher fidelity: finer mesh control, many element formulations and material models, advanced nonlinear contact and explicit dynamics. Steeper learning curve. Free Learning Edition is limited to 1000 nodes for structural models, which is small. Windows only. Other restrictions reported (no user subroutines, no parallel runs). | [3DS Abaqus Learning Edition](https://www.3ds.com/edu/education/students/solutions/abaqus-le), [CAE Assistant](https://caeassistant.com/blog/abaqus-software-editions/), [University of Patras](https://my.upatras.gr/en/software-cloud/abaqus-student-edition/) |
| Ansys (Mechanical) | Ansys Student: structural limit 128K nodes/elements, fluid 1 million cells/nodes (official page, 2026 R1). Limits were lower in older releases. Users report the solver can hit "problem size" errors even under the cap, because contact elements created at solve time count. | [Ansys Student (official)](https://www.ansys.com/en-in/academic/students/ansys-student), [Ansys forum](https://innovationspace.ansys.com/forum/?p=37313) |
| COMSOL | Often chosen for multiphysics-heavy problems. I did not find a reliable independent source in this search, so I make no claims on limits or cost. Look up. | not researched |

User ratings (G2): SolidWorks Simulation 4.4, Abaqus 4.3, Ansys Mechanical 4.4, with small samples, so treat as weak evidence. [G2 comparison](https://www.g2.com/compare/abaqus-vs-solidworks-solidworks-simulation-vs-simulink-vs-ansys-mechanical).

Caution: several sources are Dassault or reseller material and favour their own products.

## Things to check yourself before choosing
1. Student eligibility. Ansys Student and the Abaqus Learning Edition are aimed at students. You have graduated, so read the licence terms to see whether you still qualify, and what the terms say about use for a portfolio or commercial work. I did not verify this.
2. What your SolidWorks licence already includes (Simulation package level).
3. Your target jobs. Look at 10 job posts in the field you want and count which tools appear. That is a better guide than any ranking.
4. Whether you will use it on Windows only.

## Suggested path (my inference, not a researched fact)
- Learn the theory first (Stage 1 and Stage 4 of the roadmap). The software matters less than the habits: boundary conditions, mesh convergence, hand-calc check.
- If your SolidWorks licence includes Simulation, use it for your first validated studies, since it needs no new setup.
- Try the free Ansys Student (if eligible) to learn a second, more general workflow with a node limit large enough for real parts.
- Skip Abaqus Learning Edition for now unless a target employer uses it: 1000 nodes is too small for most real geometry.

Decision: not made yet. Record it here when you choose.
