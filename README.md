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
| `knowledge/` | Long-lived reference: formulas, materials, design rules, lessons learned. |
| `cad/` | Notes and scripts for SolidWorks and AutoCAD. Keep large CAD files outside Git. |
| `career/` | Goals, skills, internships, contacts, reading list. |
| `reference/` | Standards, datasheets, links. |
| `templates/` | Note templates. |
| `agent/` | Instructions and permission rules for the AI companion. |
| `log/` | Record of actions the agent took. |

## Daily routine
1. Open `templates/daily.md`, copy it to `daily/<date>.md`.
2. Capture thoughts in `inbox/` during the day.
3. Once a week, run the weekly review (`templates/weekly-review.md`).
