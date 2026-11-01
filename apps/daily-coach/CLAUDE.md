# Daily Coach

A personal coaching app for **Kyaw Soe Han** — 22, mechanical engineering graduate (BEng Portsmouth),
based in Southsea. It runs his day: training, IELTS/English, engineering knowledge, a £25,000 savings
plan, and a rule-based coach that reads his own logged numbers back to him.

Everything ships as **one self-contained HTML file**. No framework, no dependencies, no network calls,
no accounts. Data lives in `localStorage` under the key `dailycoach.v1`.

---

## Commands

```bash
npm run dev      # serve at http://localhost:4173 (any static server works)
npm run build    # inline everything -> dist/daily-coach.html   <- the deliverable
open index.html  # also fine: the page works straight off disk with file://
```

`build.mjs` is ~50 lines of plain Node (no bundler). It inlines `src/css/*.css` and `src/js/*.js`
into `dist/daily-coach.html` and fails the build if an external reference survives.

**After any change: run `npm run build` and re-test `dist/daily-coach.html`.** The single file is the
product; `index.html` + `src/` are just the editable form of it.

---

## Architecture

Classic `<script>` tags in load order — deliberately **not** ES modules, so `index.html` keeps working
from `file://` with no server and no build step. All files share one global scope, in the order
`index.html` lists them. Order matters:

| File | Responsibility |
|---|---|
| `src/js/00-core.js` | utils, date helpers (week starts Monday), seeded RNG, storage load/save, `state`, task definitions, streaks |
| `src/js/10-content-training.js` | `EX` (exercises + cues), `SESSIONS` (A/B/C/walk/rest), `WEEK_PLAN` |
| `src/js/20-content-learn.js` | cue cards, essay prompts, band-7 rules, word bank |
| `src/js/25-content-packs.js` | `KNOWLEDGE_PACKS` — 12 engineering packs written around his actual plant work |
| `src/js/26-content-career.js` | `TIMELINE`, `CV_STRENGTHS`, `CV_FIXES`, `STORIES`, `QUESTION_BANK`, `PORTFOLIO` |
| `src/js/30-content-money.js` | categories, savings/spend maths, milestone helpers |
| `src/js/40-render-icons.js` | `ICONS` + `ic()`, ring/sparkline helpers, the generative tide art |
| `src/js/41-render-today.js` | Today view + shared cue card markup |
| `src/js/42-render-train-learn.js` | Train view, Learn view (essay/speaking/packs/words/career) |
| `src/js/44-render-money-progress.js` | Money and Progress views |
| `src/js/46-render-coach.js` | Coach view, chat bubbles, the one-line daily read |
| `src/js/50-app.js` | theme, tab bar + lens, condensed title bar, bloom, tilt, sheet, timers, all click actions, forms |
| `src/js/60-coach-engine.js` | `generateReply()` — the rule-based coach (money / training / English / career / stuck / plan / review) |
| `src/js/70-boot.js` | ambient motes, `boot()` |

CSS is split by layer, loaded in this order: `tokens → components → views → responsive → motion`.

### Rendering model

No virtual DOM, no reactivity. Each tab is a pure function returning an HTML string
(`renderToday()`, `renderTrain()`, …). `renderView(tab)` sets `innerHTML`, then:
- stamps `--ci` (0…11) on each section so CSS can stagger the section cascade,
- re-runs `moveLens()` for the tab bar.

Every interaction goes through **one delegated click listener** in `50-app.js` keyed on `data-a="…"`.
After mutating state: `save()` then `renderView(activeTab)` + `updateChrome()`. Anything that must
survive a re-render belongs in `state`, never in the DOM.

---

## Design system

Palette (also the CSS custom properties in `tokens.css`):

```
--cream #FFF0C5   --deep #086288   --mid #4D8DBA   --sky #97D7FF
--teal  #359FA0   --lteal #8AD6D1  --orange #FF8C52   (orange = targets + warnings)
```

Rules that must not drift:
- **Native system font only.** `-apple-system, "SF Pro", "Segoe UI", …` — no web fonts.
- **Sentence case everywhere.** No all-caps labels, no condensed faces, no letter-spaced caps.
- **Light and dark.** Dark is deep navy with glowing light and cream text; never pure black or grey.
- **Depth layers:** (1) drifting palette light behind everything, scroll-parallaxed via `--sy`;
  (2) frosted glass panels with a rim of light (`::before`) and a top sheen (`::after`);
  (3) floating chrome — condensed title bar on scroll, floating glass tab bar with a spring lens.
- **Motion from transitions.dev patterns:** tab lens slide, page blur-slide, checkbox stroke-draw,
  modal, toast, thinking dots, streaming text, plus→menu morph, card tilt + glare, text reveal,
  morphing gapped donut.
- **Respect reduced motion twice:** the media query *and* the in-app toggle (`state.reduceMotion`).
  Both add `html.reduce`, which kills every animation. `motionOff()` in `50-app.js` is the JS gate.

### Gotchas worth knowing

1. **Never put `var()` inside a keyframe that animates `transform`.** CSS won't interpolate it and the
   value snaps to the end state — this is exactly what once made the tap light flare across a whole
   card. Pattern in use: a wrapper holds the final size (`--bs`), inner layers animate with fixed
   numbers.
2. `backdrop-filter: url(#liquidRefract)` (edge refraction) is applied to **floating chrome only** —
   tab bar and title bar. Cards stay on the plain frosted fallback so Safari degrades cleanly.
3. `.view[hidden]{display:none !important}` exists because a `display:flex` rule once beat `[hidden]`
   and every tab rendered at once. Keep that guard.
4. Wide layouts use `display:flex` columns rather than CSS grid `display:contents`, so column A and B
   each stack their own sections (grid left visible holes under short cards).
5. The full-screen ambient blur was removed for performance (≈142 ms → ≈90 ms per frame in headless
   Chromium under the 26 frosted layers). Softness now comes from multi-stop radial gradients.
   Don't reintroduce a viewport-wide `filter`.

---

## Data model

`localStorage['dailycoach.v1']` — one JSON object, deep-merged over `DEFAULT_STATE` on load so new
fields never break old saves.

```js
{
  theme: 'auto'|'light'|'dark', reduceMotion: bool, createdAt: 'YYYY-MM-DD',
  profile: { name, heightCm, weightStart, weightTarget, city, degree },
  settings: { income, goal, opening, fixed:[{id,name,amount}], stepsGoal, ieltsTarget, examDate },
  days:      { 'YYYY-MM-DD': { tasks:{id:true}, steps, weight, note } },
  expenses:  [{ id, date, amount, cat, note }],
  savings:   [{ id, date, amount, note }],
  workouts:  { 'YYYY-MM-DD': { sessionId, sets:{ exId:[bool,…] } } },
  ielts:     { essays:[{date,prompt,words,mins,band}], speaking:{date:true}, cueSeen:{}, quick:[] },
  knowledge: { packId: 'YYYY-MM-DD' },
  career:    { portfolio:{ id:true } },
  chat:      [{ role:'user'|'coach', text, ts }],
  seen:      { coach: bool }
}
```

**Storage safety:** if `localStorage` is blocked (sandboxed iframe, private mode) the app detects it at
boot, sets `storageOK = false`, runs memory-only and tells the user to download the file — it must never
throw or lose the session silently. Keep that guard when adding persistence.

---

## Content recipes

**Add a daily task** → `TASK_DEFS` in `00-core.js`:
`{ id, name, meta, icon, color, days:[0=Mon…6=Sun], go:'train'|'learn'|'money'|'progress'|'coach', sub? }`
`go` deep-links to a tab; `sub` opens a Learn sub-tab.

**Add a knowledge pack** → `KNOWLEDGE_PACKS` in `25-content-packs.js`:
`{ id, title, tag, points:[5 bullets], ask, new }` — one pack is picked per day by day-of-year.
Write them about *his* machines (bagging, flow wrap, mic-vac, lidding, thermoforming, CNC), not textbook
generics, and keep the bullets specific enough to use on a shift.

**Add an interview question** → `QUESTION_BANK` in `26-content-career.js`: `{ q, a }`.
**Add a behavioural story** → `STORIES`: `{ q, hook, body, close }` — hook/body/close must be sayable in 60 s.
**Add an exercise** → `EX` in `10-content-training.js`: `{ name, reps, rest, cue }`, then reference the
key from `SESSIONS`.

Voice: direct, specific, British English, no hype. Numbers instead of adjectives. Never moralise about
his weight or his money — state the number and the next action.

---

## Known TODOs

- [ ] The four project docs (`instructions-context.md`, `daily-coach.md`, `money-plan.md`,
      `build-references.md`) never arrived. The app runs on the original brief plus assumptions that
      should be replaced: income £2,500/mo, fixed costs £1,050, weight target 72 kg, IELTS target 7.0,
      no spend history.
- [ ] `state.settings.examDate` is stored but nothing counts down to it yet.
- [ ] The Coach is deterministic (`generateReply`). If it is ever wired to a real model, keep the
      grounded-data-first behaviour and never send the JSON store to a server without asking.
- [ ] No service worker / install prompt. A trivial one would make it work offline on his phone.

## Don't

- Don't add npm dependencies, CSS frameworks, web fonts, CDNs or analytics.
- Don't split `state` — one store, one save function.
- Don't ship a change without building `dist/` and testing that file on a 390×844 viewport.
- Don't put identity documents, passport/licence numbers or the CV PDF into this repo.

---

## Pit wall design layer (current look, November 2026)

The liquid-glass cream and blue look has been replaced. Two stylesheets load last and win:
`src/css/f1.css` (colour remap) then `src/css/pitwall.css` (surfaces, components, motion).

- **Language:** F1 broadcast graphics. Layered carbon panels (no backdrop blur on cards), white
  figures with tabular numerals, grey labels, a short red line on each panel's top-left corner,
  skewed red bar before section headings, red-and-white kerb stripe on the tab bar and hero title.
- **Timing colours mean something:** purple = best / streak, green = personal best / done,
  yellow = slower / up next, red = live / action. Do not use them decoratively.
- **Today:** rev-counter gauge (`revGauge`), week as sector bars, race-control strip (up next),
  timing tower (task list), and Today's lap (`lapArt`) — a circuit generated from the date where
  each finished task drives a stint and all done shows the chequered flag. It replaces the tide art.
- **Atmosphere:** asphalt grid background, floodlight glow, occasional speed streaks, start lights
  once per session (`startLights`, skipped with reduced motion).
- **Diagrams:** `PACK_DIAGRAMS` in `43-render-pitwall.js` draws one schematic per knowledge pack;
  lines use `pathLength="1"` and draw in with a stagger.
- **Coach** is styled as team radio (`radioHead`, `.radio`).
- **Lab tab:** the engineering lab (`lab/lab.html`) is embedded at build time by `lab/embed.mjs`.
- **Exercise figures:** `45-render-exfig.js` — side-view poses A and B per exercise (`EXFIG`),
  animated with one rAF loop for visible figures only; red segments = working muscles.
- **3D CAD practice:** `47-render-cad3d.js` — software renderer (extrusions with holes, painter's
  sort, back-face culling, silhouette edges) plus a first-angle orthographic sheet generated from
  the same geometry (hidden hole edges dashed) and a "which view is which" quiz. Lives at the top
  of the Lab tab. Class names `.dwg*` (not `.sheet`, which is the app's bottom sheet).
- **3D and colour:** rev-light strip (green, red, purple), gauge bezel, keycap buttons, tilt
  depth via `translateZ`, Today's lap 3D/Map toggle (`lap3d`).
- **Time zones:** `CLOCKS` + `tzParts()` in `43-render-pitwall.js` (Southsea, Yangon, UTC); live
  clock in the status bar and the top strip via `[data-clock]`, ticked every second.
- **Top strip:** flush full-width bar that fades in on scroll with a red scroll-progress line
  (`--sp`); no floating card, no bounce, and the hero no longer blurs away.
- **Lab tab sections:** 3D CAD · Drawings (`48-render-dwg.js`, explore 12 features + 8-question
  test, best score in `localStorage['dc.dwgBest']`) · V12 engine (`49-render-v12.js`, real
  slider-crank geometry, firing order 1-7-5-11-3-9-6-12-2-8-4-10) · Test bench (embedded lab,
  created on first open).
- **Daily system (from the Daily System V104 template, structure only):** `44a-render-daysys.js`
  renders at the top of Today: now card (ring timer, 3-step stepper, Done/Partly/Missed), up-next
  countdown, the 3 that matter, feel strip (energy, mood, phone, sleep, day shape), number cards,
  day-plan timeline, 14-day focus chart and time-by-category bars. Blocks link to tasks via
  `task`. Day record fields: `plan`, `pstep`, `feel`, `sleep`, `shape`. Wide screens (≥980px) put
  the tab bar in the top strip and use 12-column rows. The template's violet palette and web
  fonts were deliberately not adopted: the F1 look and native fonts stay.
