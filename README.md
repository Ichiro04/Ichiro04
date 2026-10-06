# Life Vault

A plain-text memory for my engineering studies and career. Everything is Markdown so it can be read by any tool, now or in 20 years.

## Rules
1. Raw notes are never deleted or rewritten by the agent. It may add summaries and links next to them.
2. Everything lives in files in this repo. No notes are locked inside an app.
3. No passwords, ID numbers or medical data in here.
4. Commit often. Git is the undo button and the backup.

## Layout
| Folder | Purpose |
|---|---|
| `inbox/` | Quick capture. Dump anything here, sort it later. |
| `daily/` | One note per day (`YYYY-MM-DD.md`). |
| `courses/` | One folder per course: lectures, assignments, exam prep. |
| `ideas/` | Ideas and inventions, one file each. |
| `projects/` | One folder per project. Copy `projects/_template`. |
| `knowledge/` | Long-lived reference: `roadmap/` (study plan), `simulation/`, `design-rules/`, `cad-practice/`, formulas, materials, lessons learned. |
| `cad/` | Notes and scripts for SolidWorks and AutoCAD. Keep large CAD files outside Git. |
| `career/` | Goals, skills, internships, contacts, reading list. `portfolio/` holds finished projects. |
| `reference/` | Standards, datasheets, links. |
| `templates/` | Note templates. |
| `agent/` | Instructions and permission rules for the AI companion. |
| `log/` | Record of actions the agent took. |

## Daily routine
1. Open `templates/daily.md`, copy it to `daily/<date>.md`.
2. Capture thoughts in `inbox/` during the day.
3. Once a week, run the weekly review (`templates/weekly-review.md`).
4. Study from `knowledge/roadmap/README.md` using `templates/study-session.md`.
5. Log each simulation with `templates/simulation-log.md` and review designs with `templates/design-review.md`.
