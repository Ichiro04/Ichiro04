# Daily Coach

One self-contained HTML file that runs my day: training, IELTS, engineering knowledge, a £25,000
savings plan, and a coach that reads my own numbers back to me.

- **Product:** `dist/daily-coach.html` — 221 KB, no dependencies, no network, works offline.
- **Source:** `index.html` + `src/css/*` + `src/js/*` — plain files in load order, no bundler.
- **Context for Claude Code:** `CLAUDE.md`.
- **Kickoff prompt:** `PROMPT.md`.

```bash
npm run dev      # http://localhost:4173
npm run build    # dist/daily-coach.html
```

Opening `index.html` directly also works — that's the point of the no-modules design.

Data is stored in the browser's `localStorage` (`dailycoach.v1`). Nothing leaves the device.
Use **Coach → Export backup** before clearing site data. If the page is opened somewhere storage is
blocked (a sandboxed preview frame, private mode), it runs in memory and says so.

## Structure

```
index.html                 shell: links + script order
build.mjs                  inlines everything into dist/
src/css/                   tokens, components, views, responsive, motion
src/js/                    core, content (train/learn/packs/career/money), render, app, coach, boot
dist/daily-coach.html      the deliverable
CLAUDE.md                  architecture, design system, data model, recipes, TODOs
PROMPT.md                  what to paste into Claude Code, plus follow-up prompt patterns
docs/QA-CHECKLIST.md       ten-minute manual test pass
```
