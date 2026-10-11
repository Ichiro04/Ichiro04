# Open items (collected 2026-10-11)

From HUB.md, the setup session log, and this session. Tick when done.

## Study
- [ ] 1. Answer the statics self-test Q1-Q3 (in [stage1-01-statics.md](../knowledge/roadmap/lessons/stage1-01-statics.md)). Do this first. Nothing else needs it before it.
- [ ] Fill Stage 2-5 progress in the roadmap if you already know some of it.

## Software decision
- [ ] 2. Decide simulation software. Read [software-comparison.md](../knowledge/simulation/software-comparison.md). First check: are you still eligible for student licences after graduating, and what does your SolidWorks licence include?

## OmniRoute (Route D), on your PC
- [ ] 3. Confirm the dashboard password was changed since the screenshot exposure. Never paste it in chat.
- [ ] Confirm `C:\Users\henry\.omniroute\.env` has these two lines:
  - `OMNIROUTE_SERVER_HOST=127.0.0.1`
  - `REQUIRE_API_KEY=true`
- [ ] Back up that `.env` file later (it holds the key that encrypts saved provider keys). Store the backup outside this repo.
- [ ] Do not add provider keys or main accounts yet.
- [ ] To let an AI use it, run Claude on your PC in the LifeVault folder (a cloud session cannot reach localhost). Do not open the port to the internet.

## Vault
- [ ] 5. Start the first daily note: copy `templates/daily.md` to `daily/2026-10-12.md`.
- [ ] Fill in [career/skills.md](../career/skills.md).
- [ ] Review the new draft lessons and note any corrections.
- [ ] Later: search tool over the vault, SolidWorks/AutoCAD scripts, voice layer.

## Git (Windows, one step at a time)
To get this session's work onto your PC, in PowerShell:
1. `cd $HOME\Documents\LifeVault`
2. `git fetch origin claude/cool-edison-jcrkmq`
3. `git switch claude/cool-edison-jcrkmq`
Then open the files. To go back to your usual branch, `git switch <name>`.
