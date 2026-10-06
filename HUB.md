# HUB: everything in one place

Master file for the Life Vault. Each section is a "route": copy only the section you need into a new chat, or tell the assistant to read this file and work on one route.

Last updated: 2026-10-06
Repo: Ichiro04/Ichiro04 (branch claude/capabilities-overview-83xgc2)

## Routes (pick one per chat)
| Route | Use it for | Starter message |
|---|---|---|
| A. Vault and companion | Notes, memory, organising the vault | "Read HUB.md route A, then help me with the vault." |
| B. Study | Roadmap lessons and self-tests | "Read HUB.md route B and knowledge/roadmap/README.md, then continue my lesson." |
| C. CAD and simulation | SolidWorks, AutoCAD, FEA/CFD work | "Read HUB.md route C, then help me with CAD or simulation." |
| D. OmniRoute | The AI gateway on my PC | "Read HUB.md route D, then help me with OmniRoute." |
| E. Career and portfolio | Goals, projects, portfolio | "Read HUB.md route E, then help me with my portfolio." |

For any chat, first say: "Also read README.md and agent/INSTRUCTIONS.md."

---

## About me (shared by every route)
- Mechanical engineering, 4th year (graduated, bachelor's degree).
- Focus: mechanical design and simulations.
- Goal: be a well-known mechanical engineer.
- Learning style: systematic.
- Computer: Windows. Software: SolidWorks, AutoCAD. Simulation software: not decided yet.
- I am a beginner with terminals and Git: explain steps one at a time, with exact commands.
- No decorative or generated design in the vault. Plain text only.

## Rules for the assistant (shared)
- Raw notes are never deleted or rewritten. Add summaries and links beside them.
- Never guess numbers (material values, standards, factors). Give the source or say it must be looked up.
- Ask before deleting, moving, installing, sending, or spending.
- Never store or repeat passwords or secrets. I must never paste a password in chat.
- Teach: concept, equations, worked example, self-test. Hint before answers on my own design or homework.
- A simulation result is only a claim until checked against a hand calculation or known case.

---

## Route A: Vault and companion
Goal: a lifelong memory I own, in plain Markdown, backed up on GitHub, readable by any future AI.

Folders: `inbox/ daily/ courses/ ideas/ projects/ knowledge/ cad/ career/ reference/ templates/ agent/ log/`
Key files: `README.md`, `agent/INSTRUCTIONS.md`, `agent/PERMISSIONS.md`.
Permission levels: free (read, write to inbox/daily/ideas/log), ask first (delete, move, run scripts, send, touch CAD files), never (password managers, banking, system folders).

Daily routine: copy `templates/daily.md` to `daily/<date>.md`, capture in `inbox/`, weekly review with `templates/weekly-review.md`.

Build plan:
1. Vault (done).
2. Search and Q&A over the vault.
3. Voice capture, calendar and Drive links, scheduled weekly reviews.
4. Always-on Windows agent with voice, then engineering tools.

Open-source Jarvis projects considered (not installed): ethanplusai/jarvis (macOS, Claude Code voice), eadmin2/jarvis_ai, Likhithsai2580/JARVIS, omnigentx/jarvis, Shaan-alpha/jarvis-py (offline). Review code before running any.

On my PC: clone is at `$HOME\Documents\LifeVault`. Update with `git pull`. Save changes with `git add -A`, `git commit -m "message"`, `git push`.

## Route B: Study
Roadmap: `knowledge/roadmap/README.md` (5 stages, checkboxes: [ ] not started, [~] in progress, [x] can explain and solve).

Stage 1 progress:
- [x] Material properties and selection
- [~] Statics, Mechanics of materials, Beam deflection and buckling, Stress concentration
- [ ] Stress transformation and Mohr's circle, Failure theories, Fatigue basics

Current lesson: `knowledge/roadmap/lessons/stage1-01-statics.md` (statics, free-body diagrams, equilibrium). Self-test Q1-Q3 are waiting for my answers.
Suggested order: statics, mechanics of materials, Mohr's circle, failure theories, beam deflection and buckling, stress concentration, fatigue.
Each topic: learn, write a note in my own words, solve a hand problem, link to a project. Study log: `templates/study-session.md`.

## Route C: CAD and simulation
Files: `knowledge/simulation/setup-checklist.md`, `knowledge/design-rules/design-checklist.md`, `knowledge/cad-practice/README.md`, `templates/simulation-log.md`, `templates/design-review.md`, `cad/solidworks/`, `cad/autocad/`.
Plan: SolidWorks and AutoCAD can be scripted (SolidWorks API, AutoCAD scripting/AutoLISP). Start with small safe tasks like batch-exporting drawings to PDF. Always work on copies. Keep large CAD files outside Git (.gitignore blocks .sldprt, .sldasm, .dwg and similar).
Simulation habits: define the question, check boundary conditions, run a mesh convergence study, check reactions, avoid trusting stress at singularities, compare to a hand calculation.

## Route D: OmniRoute (open-source AI gateway)
Repo: github.com/diegosouzapw/OmniRoute (MIT). Installed on my PC: v3.8.51, Node v24.21.0.
- Install: `npm install -g omniroute`. Start: `omniroute`. Stop: Ctrl+C. Dashboard and API: http://localhost:20128 (API base /v1).
- Keep it local-only. Put these lines in `C:\Users\henry\.omniroute\.env`:
  `OMNIROUTE_SERVER_HOST=127.0.0.1` and `REQUIRE_API_KEY=true`
- In PowerShell, set a variable for one window with `$env:NAME="value"` (needs `$env:`).
- Reset dashboard password: stop it, run `omniroute reset-password`, then restart. My earlier password was shown in a screenshot; keep it changed and never share a new one.
- Diagnose problems: `omniroute doctor`. First start can be slow (it may say it did not respond in 60s while still starting).
- Cautions: no main accounts or provider keys yet, no vault connection yet, do not enable TLS stealth or MITM/TPROXY features, "free" providers may break provider terms or log data. Back up `.env` later (holds the key that encrypts saved provider keys).
- Why it may matter: later, my own assistant app could use it to switch between models. Not needed for the vault.

## Route E: Career and portfolio
Folder: `career/portfolio/`. One folder per finished project: problem and constraints, approach and decisions, analysis (calculated, simulated, how checked), result with units, what went wrong, images or drawings (stored outside Git if large).
Aim: 3-5 well-explained projects beat many shallow ones.
Long-term: a "life company" for me, not a social platform, a real companion that holds my memos and helps with tips, ways, creations and ideas.

---

## Open items
1. Answer statics self-test Q1-Q3.
2. Decide simulation software (SolidWorks Simulation, ANSYS, Abaqus, COMSOL).
3. Confirm OmniRoute password is changed and the two security lines are in `.env`.
4. Fill roadmap Stage 2-5 progress.
5. Start the first daily note.

## Change log
- 2026-10-06: vault created, profile added, roadmap and templates added, session notes saved, HUB created.
