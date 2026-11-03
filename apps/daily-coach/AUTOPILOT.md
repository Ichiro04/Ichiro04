# Autopilot backlog (cloud builder)

A scheduled Claude run works through this list at night: **one item per run**. The in-app autopilot (plan, tips, check-ins) is separate and runs in the browser.

## Rules for every run
1. Read `CLAUDE.md` first. Follow its "Don't" list: no npm dependencies, frameworks, web fonts, CDNs or analytics; one `state`, one save.
2. Pick the **first unticked item** below. If it is unclear or risky, skip it and pick the next one.
3. Add, don't take away: never delete a feature, rename the user's things ("KsHan", "Orbit", tab names) or change the look he chose. Keep "Saver" as the coach default.
4. Never put personal data into the repo: no identity documents, passport or licence numbers, CV PDF, address or birth date. Logged data lives only in his browser and is never needed.
5. Run `node build.mjs`, then test `dist/daily-coach.html` with Playwright (Chromium is pre-installed) at 390×844 and 1440×900: open every tab, open Orbit (`#map`), and check there are no page errors.
6. Tick the item here with the date, add a line to `log/YYYY-MM.md` in the repo root, update `CLAUDE.md` if the code changed shape, commit with a clear message and push to `claude/affectionate-hopper-zzk39m`.
7. If every item is ticked, do a bug hunt instead (console errors, layout at 390×844, dead code) and log what you found. Add 3 new ideas to the list for the user to approve (marked "idea, needs OK") and do not build those.

## Backlog
- [x] (3 Nov, chat) IELTS exam countdown on Today and in the Review tab, from `state.settings.examDate` (known TODO in CLAUDE.md).
- [x] (3 Nov, chat) Review: "Copy as text" button on a finished check-in so it can be pasted into notes.
- [x] (3 Nov, chat) Coach tips: spending by category this month against the budget lines in `state.settings.fixed`.
- [x] (3 Nov, chat) Knowledge packs with diagrams: trim press faults, SPC and capability, safe isolation (LOTO); SMED already existed. SPC and LOTO were planned topics in Orbit and are now linked.
- [x] (3 Nov, chat) Five more interview questions with answers in `QUESTION_BANK` for a thermo machine operator role.
- [x] (3 Nov, chat) Glass skins: contrast pass at 390×844 for every tab (text at least 4.5:1 on panels); fix any that fail.
- [x] (3 Nov, chat) Calendar: tap a past day's task chip to tick or untick it (with a toast), so missed logs can be fixed.
- [x] (3 Nov, chat) Monthly check-in: a "Money month" panel (saved, spent, top 3 categories, pace to £25k).
- [x] (3 Nov, chat) Performance: main-thread work is 0.1–7.8 ms per frame on Today, Review and Coach at 390 and 1440. Headless frames are 50–66 ms only because blur is drawn in software (no GPU); panels off screen now skip the blur (`glassWatch`).

## Ideas (need the user's OK before building)
- idea, needs OK: Today's right-edge ring panel (desktop "notch") looks like the side bar he removed from Orbit. Remove it or move its rings into the date strip?
- idea, needs OK: install as a phone app (service worker + manifest) so it works offline from the home screen.
- idea, needs OK: weekly "export my check-ins" as a Google Doc through the connected Google Drive.
