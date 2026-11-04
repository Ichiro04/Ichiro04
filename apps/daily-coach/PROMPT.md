# Paste this into Claude Code

Open Claude Code in this folder (`daily-coach-app/`), then paste the block below as your first message.
`CLAUDE.md` is picked up automatically, so the prompt only needs to set intent and the first job.

---

```
This repo is Daily Coach, my personal coaching app. Read CLAUDE.md first — it explains the
architecture, the design system, the data model and the gotchas. Then run `npm run build` and
open dist/daily-coach.html so you can see what you're changing.

Ground rules: no dependencies, no frameworks, no web fonts, no network calls. It stays one
self-contained HTML file. Sentence case. Light and dark. Everything must respect reduced motion.
After every change, rebuild and check the single file on a 390×844 viewport.

Work in small steps: one change, build, screenshot, then move on. Ask me before touching
00-core.js state shape or the storage schema.

My situation, so you don't guess: I'm 22, BEng Mechanical Engineering from Portsmouth, living in
Southsea. I work in thermoforming at Huhtamaki now, and before that I ran automated packaging lines
at Barfoots (bagging, flow wrap, mic-vac, lidding) and did CNC programming and maintenance at Great
One Plastics. I want a design or manufacturing engineering job in the next two years, IELTS band 7+,
a leaner stronger body, and £25,000 saved. I have 1.5–2 hours a day.

Start with these, in order:

1. Rebuild and confirm dist/daily-coach.html matches what index.html produces. Tell me anything
   that looks broken on mobile before you change anything.
2. Rewrite the money plan with my real numbers instead of the placeholders. Ask me for my actual
   rent, bills, food, transport and subscriptions, then make the plan honest about the gap between
   £2,500 a month and £25,000 a year, and show me the levers that close it.
3. Add a countdown to my IELTS test date (state.settings.examDate) on the Today view and in Progress.
4. Add a minimal service worker and web app manifest so I can install it on my phone and it works
   offline. Keep the build single-file — the service worker can cache the one HTML file.
5. Then propose the next three improvements yourself, ranked by how much they'd actually help me,
   and ask which one to do.

When you finish something, tell me exactly which files changed and what I should look at on screen
to judge it.
```

---

## After the first session

Keep the loop tight:

- **One concern per request.** "Fix the weight chart" beats "improve Progress".
- **Point at the file.** e.g. "*in `41-render-today.js`, the streak pips are wrong when…*"
- **Give it a screenshot or a number.** Layout bugs are much faster to fix with an image than a sentence.
- **Ask it to rebuild and confirm** `dist/daily-coach.html` still works — the split source and the single
  file can drift if you only ever look at `index.html`.

## Handy prompts

| Want | Say |
|---|---|
| New content | "Add three knowledge packs about my lidding line to `25-content-packs.js`, same voice as the existing ones." |
| Design change | "The tide art needs more depth in dark mode. Only touch `40-render-icons.js` and `motion.css`." |
| Bug | "On a 360px screen the Train day strip overflows. Reproduce it, fix it, rebuild, screenshot it." |
| Money | "Here are my real costs: … Update `settings.fixed` defaults and the plan copy in `44-render-money-progress.js`." |
| Review | "Read the last week of my logged data in the app's JSON export, then tell me what to change next week." |
