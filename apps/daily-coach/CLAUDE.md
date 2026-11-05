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

0. A canvas `arc`/`ellipse` with a negative radius throws `IndexSizeError`. `00-core.js` clamps negative radii to 0 for the whole app (3 Nov 2026, after the coach orb threw while ~1 px wide); still guard tiny canvases (`orbPaint` skips anything under 8 px).

0b. `body` gets state classes (`km-open`, `ai-open`, `cws-open`, `set-open`). Never style a bare class with the same name: `.km-open{display:inline-flex…}` for the Orbit tip button also matched `<body>` and made the page 668 px wide on a phone (fixed 4 Nov 2026 as `button.km-open`). Scope such rules to the element.

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

- [x] The four project docs arrived (Nov 2026) and live in `docs/`: `instructions-context.md` (who Kyaw
      is, background, goals, how to coach him), `money-plan.md` (the real budget) and
      `build-references.md` (prompt patterns for visual builds). `daily-coach.md` is no longer needed:
      this `CLAUDE.md` replaces it. Money defaults now follow `money-plan.md`: income £2,500, budget
      £1,197 a month, so £1,303 saved (£15,636 a year; the £25k goal is short by about £780 a month).
      The budget keeps the existing item names, with "Shopping + personal" and "Learning + career"
      added. `load()` swaps in the new list once, only if a saved list is still the old £1,050
      placeholder. `feasiblePerMonth()` no longer takes 10% off (the budget already has a £50 buffer),
      so the Money tab shows £1,303 realistic and £780 short, matching the plan. The weight target stays 72 kg and the IELTS target 7.0.
- [x] IELTS countdown: `examCountHTML(where)` on Today (only when a date is set) and in Review (asks for a date when none is set).
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

## Sunset pit wall (current theme, November 2026)

Palette chosen from the two the user sent: the sunset reds — Asphalt #1C0A0A, Earth Brown #550D08,
Demonic Presence #7B1103, Red Prayer Flag #B81202, Gold Sand #F8ECAC. It gives a full dark ramp
for the race-day look plus a gold highlight; the cream palette lacked the deep reds. Light mode
uses warm Gold Sand tints, never plain white. Timing semantics: red = live/action, amber = next,
gold = done/best.

- `src/css/sunset.css` loads last: tokens, sunset sky (stitched noise clouds drifting over a red
  gradient with a low sun glow), warm glass panels, gold edge glow and stacked glass plates on
  the highlight cards (from the weather-card and glass-component references), holographic halo
  on the now ring, neon-edged buttons and tabs, the desktop side notch (≥1180px, ring gauges with
  pop-out cards; removed 3 Nov 2026 at the user's request: no side bars), and the V12 digital-twin panel.
- V12 digital twin: fault simulator (misfire on 5, worn big-end on 3, cam timing one tooth out)
  with health ring, alert, causes, suggestion, urgency and a live vibration trace. The model now
  has camshafts, valves that open on the right strokes, a flywheel and a belt drive.
- `build.mjs` also writes `dist/artifact.html` (no doctype/html/head/body) for the Artifact tool.

## Knowledge map (full-screen, from the user's reference video)

`src/js/52-render-kmap.js` + `src/css/kmap.css`. A recreation of the motion and layout of a
policy-graph concept video the user sent (frames extracted with ffmpeg), rebuilt on Kyaw's own
content; none of the original product's name, branding or data is used.
- Open from the launcher at the top of Lab and Learn → Packs/Career, or `#map`. Esc / X closes.
- Scenes: gold dust → core ignition → blue streaks shoot to each node, which pop with a cyan
  flare → settled network (canvas): tapered gold beams core→domain with travelling light pulses,
  teal cross-links, dotted links to number nodes, drift, sparkles. Chrome fades in at 2.1 s.
- Data: `KM_DOMAINS` (9 domains, % = weight in the plan) → topics linked to knowledge packs, Lab
  panes or Learn sub-tabs. Mastery comes from real progress (`kmMastery`).
- Ask bar with live KPIs → coach analysis panel (red "Critical gap" + "Study next") → focus view:
  orb with fuzzy ring, five count tiles grow out on curves, the biggest list fans out from the gold
  tile, detail panel slides in. "Explore in …" deep-links into the app (`window.knowPick`).
- Single dark teal world by design (matches the video); narrow screens stack the focus view.

## Coach AI (assistant redesign)

`src/js/46a-render-assistant.js` + `src/css/ai.css` replace the Coach view (settings kept via
`coachSettingsHTML()`). Layout from the user's AI-assistant reference, in sunset colours: home
(greeting, orb card "Start talking", new chat, English ⇄ Burmese translation, recent activities,
explore presets) and a full-screen conversation (liquid canvas orb that breathes / swirls while
thinking / pulses while answering, question in big type lighting up word by word, streamed reply,
dock with history, send/stop, new chat).
- Answers come from Claude via the artifact `sample` capability (publish with
  `capabilities: {sample: {}}`); quick tier by default, "Deeper answers" switches to default tier.
- Only `coachContext()` (a short summary of today's numbers) plus the recent chat is sent; the
  JSON store never leaves the browser. Without `sample` (or if declined) the rule-based
  `generateReply` answers. No microphone: artifacts cannot use it, so input is typed.
- `state.chatArchive` keeps up to 10 earlier chats for "Recent activities".

## Crimson pearl (current theme) and the galaxy map

- **Palette** (from the user's reference): Crimson Depth #710014, Warm Sand #B38F6F, Soft Pearl
  #F2F1ED, Obsidian #161616. `src/css/crimson.css` loads last: tokens for pearl (light) and
  obsidian (dark), serif hero title, neumorphic icon tiles, crimson pill buttons.
- **Background:** `paintLandscape()` in `54-render-galaxy.js` paints a procedural red/gold/cream
  mountain landscape (ink ridges, mist, gold-leaf specks) on a fixed canvas, repainted on resize and
  theme change. No third-party art is embedded.
- **Knowledge map = galaxy dashboard.** Opening the map (launcher card on Today, Lab, Learn, or `#map`)
  shows a full-screen galaxy mind map (no frame or circle: the user rejected it), with the main
  title **"KsHan"** (the user's chosen name, keep it) over the core. The left column has Today, Legend
  and 14 days; the right column has Next block, £25k goal and Upcoming; the ask bar sits underneath.
  Below 1100px the columns collapse into a three-chip strip.
  - `kmLayout` computes `KM.orb {cx, cy, r}` and sets `--ox/--oy/--or` on `#km` for the HTML title.
  - `kmDraw` draws, with no clip,
    then draws the nebula texture (`GAL.nebula`, painted once), spiral dust, orbit rings, links and
    planets.
  - Spin a full 360° both ways: drag (with inertia) or the arrow keys. `KM.tilt` is wrapped by
    `kmWrap`, not clamped. Wheel or pinch zooms; Shift+drag pans.
  - The title fades out (`KM.tA`, `.km.titled`) when a node is selected, when zoomed past 1.3× or
    in focus view. Labels that overlap the title text (`kmTitleBox`) fade with it, and
    `kmLabelFree` stops zoomed labels from piling up.
- The user asked that the view changes **without renaming things**: keep existing labels and names.

## CAD workspace (SolidWorks-style, top of Lab → 3D CAD)

`src/js/47b-render-cadws.js` + `src/css/cadws.css`. The user asked for exercises in a real 3D CAD
view (zoom, edit, extrude) like their SolidWorks screenshot and engine-block drawing.
- **Features:** `boss` / `rib` (sketch plane top/front/right, optional tilt, profile rect with
  corner fillet R, circle, triangle or crankcase; Blind with start offset, or Mid Plane) and `cut`
  (a Through All hole pattern: diameter, first hole, count, pitch, direction, rows). A cut affects every
  earlier solid on the same plane and tilt, and skips holes that would break an edge (the tree shows a "!").
- **Geometry:** `wsBuild` → `wsSolid` per boss. Caps are triangulated with `wsTriangulate`
  (hole bridging + ear clipping). Sides get smooth normals on curves, and the
  feature edges and silhouette candidates are kept separately.
- **Renderer:** `wsRenderer(canvas)` is plain WebGL with a depth buffer, polygon offset so edges
  win, live silhouettes and a soft floor shadow. Display modes are shaded with edges, shaded,
  hidden lines visible and wireframe. The camera is orthographic. Drag rotates with eased
  follow and inertia; right-drag or Shift-drag pans; the wheel or a pinch zooms at the
  cursor; the arrow keys, + / -, F, Delete and Ctrl+Z / Ctrl+Y work too.
- **UI:**
  - The command bar has Boss, Cut, Rib, Fillet, Undo, Redo, Check and Show answer.
  - The FeatureManager tree selects, edits, suppresses and deletes features. Its PropertyManager
    applies edits live, with ✓ to keep and ✗ to undo, and the viewport shows dimensions as you edit.
  - Tapping a face selects its feature; a double tap opens it for editing.
  - Full screen lifts the window to `<body>`, because ancestor transforms would trap `position: fixed`.
- **Exercises (`WS_EX`):** L-bracket, flanged bush, pillow block, the V4 engine block (from the user's
  drawing) and free model. Each starts with the right tree but wrong sizes (`wsRough`). The drawing sheet
  (`wsSheet`) renders the target in hidden-line mode on a second WebGL canvas into four views with
  balloons and a size table. `wsMatch` ticks features within ±0.6 mm.
- **State:** `state.cadws = { ex, models:{ex:[features]}, done:{ex:true} }`.
- **Galaxy effects (Nov 2026):**
  - Zoom runs from 0.4× to 24×, eases towards `KM.camT` and centres on the cursor (`kmZoomAt`). Orbital time `KM.st` slows as you zoom in, so the target stays in view.
  - Solar-system detail: `kmSun` (corona rays, glow, lens flare when off-centre), moon orbit rings round each planet past 1.3× or when selected, Saturn rings (`kmPlanetRing`, every third domain), cloud bands and a terminator on big planets (`kmBands`). Planets grow with zoom.
  - Effects: `kmSky` (nebula clouds with parallax, spiked twinkling stars, shooting stars), `kmNovae` (a rare supernova flash) and `kmComets` (tails point away from the sun).
  - All effects are skipped with reduced motion.
- **Cosmos redesign (from the user's cinematic space references):**
  - Mapping: sun = KsHan; stars = domains (`kmStar`); planets = today's tasks on the inner orbits (`kmGloss`; tapping one gives Mark as done through `setTask`); moons = topics at 50% mastery or more; asteroids = topics under 50% (`kmRock`) plus a decorative belt (`KM.belt`); black holes = `KM_HOLES` mistakes to avoid (`kmHole`: horizon, photon ring, lensed accretion disc, infalling matter).
  - Look: deep-blue background, glowing orbit trails with running light (`kmStreaks`), a warm sun bloom and anamorphic streak, and out-of-focus bokeh in front (`kmBokeh`).
  - Camera: `GAL.proj` takes `v.persp` for real perspective (near is bigger), the default tilt is a low 1.0 rad, and opening plays a 3-second top-down fly-in (`tween.io` ease).

## Navigation, Today's wave, settings, chat everywhere (liquid glass)

- **Side rail** (`56-render-rail.js`, `rail.css`; loads after `50-app.js` because it wraps `setTab` and `updateChrome`). Screens 900px and wider: a slim icon rail with tooltips, or wide with names and sections (`state.railOpen`, round arrow toggle). A liquid lens slides between items and stretches as it moves. Phones keep the bottom tab bar.
- **Knowledge map chrome (Orbit):** Dragging, zooming or pinching undocks the panels: they slide out left, right and down, and a centre "Panels" glass pill brings them back (`kmDock`).
- **Today's wave** (`41b-render-wave.js`): a canvas wave of planned effort from the day-plan blocks, with done blocks filled in crimson. It has a "now" marker riding the wave, tappable block dots and a sweeping highlight. Underneath sit tips from his own data (`waveTips`), up to three at a time; ✕ hides one for today and "Hide all for today" hides the rest (`state.tipsOff`).
- **Settings** (`58-render-settings.js`, `settings.css`): a glass sheet opened from the rail or the gear in the date strip. Sections are profile (`profile.display` is the big map title; default "KsHan"), look and motion, goals and money, coach and voice, tips, and data (export, import and reset reuse the app's actions). Changes save at once.
- **Chat everywhere:** the floating "Ask coach" orb pill and its mic sit bottom right on every tab (`chatFab`, `state.chatFab`). The chat has a mic using browser speech recognition. `micAllowed()` checks the permissions policy first: the claude.ai viewer gives artifacts no microphone, so there (and on any error) `voiceHelp()` shows a card in the chat with device dictation steps (phone keyboard mic, Win+H, Mac Fn Fn) instead of a toast. The mic starts inside the tap (no delay), and answers to voice questions are read aloud (`AI.voiceTurn`), plus a speaker toggle that reads answers aloud with `speechSynthesis` (`state.voiceOut`, `voiceRate`, `voiceLang`).
- **Liquid glass** (`liquid.css`): `.lg` and `.lg-chip` surfaces (blur, saturate, light rim, specular arc, slow sheen), spring easing `--lq-spring`, `lqIn` and `lqOut` jelly enter and exit. All of it is off with reduced motion.
- **Map controls (Nov 2026 update):**
  - Drag pans by default (`KM.mode = 'move'`, hand button), with a short glide. The orbit button, right-drag or Shift-drag spins instead. In move mode the arrow keys pan.
  - Orbits freeze while you pan and past 2.6× zoom, so nothing slides away.
  - Fixed: nodes were projected with cartesian coords passed as polar; they now go through `hypot` / `atan2` (+ `n.el` elevation) and sit on their rings.
  - New items: satellites = the next 3 day-plan blocks (`kmSat`); nebulae = the big goals (£25k, IELTS, target weight) with progress arcs (`kmNeb`); pulsar = the streak, which spins faster with the streak (`kmPulsar`); constellation = the last 14 days (`kmConst`).
  - New effects: tap ripples, warp streaks on long camera flights, meteor showers and a hover ring.
  - "Ask AI" and a mic sit in the map's top bar. The chat opens over the map (`.over-map`) with suggested questions about the selected item.
- **Token saver (Claude usage):**
  - `state.aiMode` decides when Claude is called: `saver` (the default) means the built-in `generateReply` answers everything and Claude is called only from the "Ask Claude for a fuller answer" button; `smart` keeps questions matching `AI_LOCAL` local and sends the rest to Claude; `off` never calls Claude.
  - The routing is in `aiRoute`. `state.aiCap` (default 20) is a daily limit on Claude calls, and `state.aiUsage` counts calls and estimated tokens (chars / 4), shown in Settings → Coach and voice.
  - `state.aiCache` reuses same-day answers to the same question.
  - `aiTurns` is kept small: about 70 words of rules, today's numbers, and the last 2 exchanges clipped to 320 characters each. It no longer repeats the question, which it used to send twice.
  - Keep any new AI feature behind `aiRoute` so it respects these settings.
- **Star nebulae (galaxy plan step 1, add-only):**
  - Each domain star gets a nebula drawn additively behind the links, stars and labels (`kmStarNebulae`).
  - Textures: `GAL.snebField` builds 4 domain-warped value-noise fields (cloud) with ridged-noise filaments at 192 px, one per frame during the fly-in; `GAL.snebTint` makes one tinted canvas per domain (`KM.sneb`).
  - Size and brightness follow `KM.study[domain]` (`kmStudyScores`: 55% topic mastery + 45% done day-plan minutes in that area, 1 − e^(−min/1800)), from a faint wisp at 0 to a bright cloud near 1. Size is capped at 36% of the shorter screen side and dimmed by √(cap/raw) when capped.
  - `kmDustLanes`: four thin dark lanes on the inner edges of the spiral arms.
  - Legend row "Star nebulae · study time" shows the average. The goal nebulae (`kmNeb`) are unchanged.
  - Still with reduced motion. Frame time paid for by cached bokeh sprites (`kmBokehSprite`) and adaptive orbit-trail point counts: median 4.39 ms vs 4.85 ms before at 1440×900.
- **Orbit (Nov 2026 tidy-up):**
  - The knowledge map is now called **Orbit** (header "Orbit · KsHan's growth galaxy", launcher card, rail item, dialog label). Code names (`km*`, `#map`) are unchanged.
  - The right-edge notch and the short-lived Camera Control-style edge control are both gone (the user did not want a side bar). `kmNotchHTML` no longer exists; the right panels sit at the normal 16 px edge again. Today, savings and streak still show in the side panels, legend and KPI strip.
  - No text selection anywhere in `.km` (inputs excepted): a drag over the title used to paint the crimson `::selection` box over "KsHan".
  - The HTML title follows the pan: `kmDraw` sets `--tx/--ty` on `#km` from `KM.cam` and `.km-title` uses `translate: var(--tx) var(--ty)`; the dark band under it and `kmInTitle` (via `KM.tBoxCam`) follow too.
  - Labels avoid the HTML panels: `kmPanels()` collects the boxes of `.km-top/.km-side/.km-ask/.km-tip/.km-an` (refreshed 5× a second) and seeds `KM.labs`, so a domain label flips to the free side or hides; free-standing labels (goal nebulae, tasks, satellites, pulsar, black holes) fade out under a panel (`kmOverPanel`).
  - Zoom readout `#kmZr` between + and − (e.g. "1.3×"); tapping it eases back to 1× (`km-z1`).

## Review tab, autopilot and glass skins (Nov 2026)

- **Review tab** (`62-render-review.js`, `review.css`; 8th tab, icon calendar, after Progress):
  - Check-ins every 2 weeks (Mon–Sun fortnights from `state.autopilot.anchor`, default the Monday of `createdAt`) and every calendar month. `ciPeriod`, `ciPrev`, `ciStatus` (open / due ≤2 days / done / late up to 7 days after) live in `61-autopilot.js`.
  - The form (sheet) fills the period's numbers (`periodStats(from,to)`), a rule-based read (`ciRead`), 1–5 ratings for six `AREAS`, three questions and a focus area. Saved to `state.reviews[]`; drafts in `state.reviewDraft[type+to]`. The focus area becomes `state.focusArea` and adds a daily plan item.
  - Sections: check-in cards with countdown rings, this fortnight (wave chart against the last fortnight, daily balance bars, deltas), calendar (heat by tasks, dots for training / English / saved / weight, check-in days dashed, tap a day for details and an editable note), balance wheel (`areaScores` from data, last ratings dashed), fortnight trend, history, quote.
  - A red dot on the Review tab when a check-in is due (`reviewBadge`).
- **Autopilot** (`61-autopilot.js`): `apRun` on boot, on `visibilitychange` and every 15 minutes. Builds `state.coachPlan` once a day (`apBuildPlan`: scheduled tasks, day-plan blocks without a task, the weakest Orbit topic, due check-ins, sleep, IELTS inside 60 days, focus area; own items carry over), prepares check-in drafts with a toast, logs to `state.autopilot.log` (30 entries). Settings → Autopilot has the switches, the fortnight start date, the log and "Run now". Nothing leaves the browser.
- **Coach tab** now wraps the old `renderCoach` (kept as `renderCoachChat`): Today's plan (tick, open, add, delete, rebuild), tips from numbers (`apTips`, 4 shown, more on tap), this week's wave, autopilot card, then the chat.
- **Editable layouts:** `sectionsHTML(tab, defs)` gives Review and Coach an "Edit layout" mode (move up/down, hide/show, reset) stored in `state.layout[tab]`.
- **Glass skins** (`63-skins.js`, `glass-themes.css`, loaded last): `state.skin` = `crimson` (default) | `neuglass` | `frost`, from the user's two reference posters. `state.skinTune[skin]` holds tint, accent, transparency, blur (max 20px), soft depth, roundness and a solid switch; they become `--gt-*` properties on `<html>`. Skins override the `--pw-*`, `--cr-*` and `--neu-*` tokens, so most of the app follows automatically. The landscape canvas is cleared and used as the backdrop. Orbit keeps its own deep-space look.
- `waveSVG(vals, labels, id, prev)` is a shared smooth wave chart with a drifting swell (fixed-number keyframes).
- Cloud builder: a scheduled Claude run works through `AUTOPILOT.md` one item per night and pushes to this branch.
- Removed dead code: `weighIns`, `setKeyDone`, `tideArt` (+ `TIDE_COLORS`, `.tide-wave`), `markTaskAuto`, `kmPos`, `kmBands`, `kmToWorld`, `kmOverall`; later `cueIndex`, `sheetResolve`, `GAL_PLANETS` and Money's `monthsLeft`.
- Money's "days left" in the £25k year is `366 - planDay()` (counts from `createdAt`, same as "Day N of 365").
- The embedded Lab works offline (3 Nov 2026): `lab/embed.mjs` inlines `lab/vendor/three.min.js` (three.js r128, MIT, licence in `lab/vendor/three-LICENSE.txt`) and `lab/vendor/OrbitControls.js` in place of the cdnjs and jsDelivr script tags. The build has no network references. Adds about 600 KB.
- **3 Nov 2026 additions:** IELTS countdown (`examCountHTML`), "Copy as text" on finished check-ins (`ciText`), a spending-by-category tip (`apSpendTip`; expense categories map to budget lines through `CAT_BUDGET`), "Money month" panel in monthly check-ins (`moneyMonthHTML`), tappable task chips on past calendar days (fix a missed log), packs `trim`, `spc`, `loto` with diagrams and Orbit links, 5 more interview questions, darker `--pw-ink-2/-3` in both glass skins (≥ 4.5:1 on the palest panel), and `glassWatch` (`.gl-off` drops the blur on panels that are off screen).

## Wide screens and dashboards (3 Nov 2026)

- **No empty landscape beside the content.** From 1400px the page uses the full width beside the rail (`wide.css`, up to 1760px). The desktop ring "notch" on the right edge is deleted (`notchHTML`, `mountNotch`, `.notch/.nring/.npop`): the user asked twice for no side bars.
- **Insight column** (`64-render-wide.js`): `renderView` is wrapped so Train, Learn, Money and Progress move their content into `.xl-main` (`.xl-flex` keeps the two-column `tcol` layout of wide views) and add an `.xl-side` column (beside the content from 1400px, a card grid under it below that):
  - Train: this week's sessions, tomorrow's session, last 8 weeks heat, bodyweight wave.
  - Learn: IELTS countdown, English last 30 days (+ heat), all knowledge packs as tiles (tap opens one), today's pack.
  - Money: spending this month against the flexible budget, where it went (donut), last 6 months, savings over time.
  - Progress: habit strength per task, week by week, focus and sleep.
- **Progress dashboard** (from the user's dark dashboard reference): 4 KPI tiles and a 30-day statistics area chart with Tasks / Focus / Money / Steps tabs and a hover tooltip (`progressDashHTML`, `stxChartHTML`, `stxMount`).
- **Coach extras** (from the schedule and player-panel references): `schedHTML` (calendar: month, week strip with prev/next/today, the chosen day's blocks on a timeline with status and the current block's steps), `quickHTML` (8 quick actions) and `statusHTML` (energy, sleep, steps, tasks, focus bars). Coach lays out in 2 columns from 1180px and 3 from 1600px; Review in 3 from 1600px.
- The Epic Pro font from a reference was not used: native fonts only, no web fonts.
- **No gaps beside short columns** (`65-fill.js`, 3 Nov 2026, the user asked for every space filled): after each render and on resize (≥900px only), every side-by-side pair (Learn `.lcol` a/b, Money `.grid2`, Today/Progress `.tcol` a/b, then `.xl-main`/`.xl-side`) is balanced (sections = a `.h2` plus what follows, split between the two columns in reading order) and any gap over 140px is filled with `.fill-card`s from a per-tab pool (`fillPool`: status, quick actions, today's plan, schedule, tips, calendar, countdown, wheel, quote, plus small cards: word of the day, interview question, form cue, mistake to avoid, next milestone). Three passes, since filling one pair can open a gap in another. Learn's Packs and Career, whose cards used to become thin flex columns, are wrapped into `.lcol` a/b. The CAD sheet's size table stretches to the drawing's height with a "How to use this sheet" note. Audit script idea: compare bottoms of side-by-side siblings; none over 140px at 1100, 1280, 1440, 1890 and 2400px.
- **Check routine (the user's standing rule, updated 3 Nov 2026):** small changes: test only the changed part at 390 and 1440. Run the full check only for important changes (layout, data, several tabs) or when the user asks; one round (a second only if the first finds problems) (light, dark, empty app; plus reduce motion with a glass skin) at 390, 1180, 1440 and 1890 wide over every tab and Learn section and Orbit: page and console errors, column gaps over 110px, page or card overflow, zero-size cards. Then research ideas on the web and ask the user before building them. Coach and Review are columnized (`columnize` in `65-fill.js`): sections go into real stacked columns (shortest first, in layout order) and the columns are topped up with filler cards; edit-layout mode keeps the plain list. Fixed in the first round: the Progress bodyweight sparkline shared the `.spark` class with the tap-spark particles (it animated away and vanished with reduce motion); it is now `.spkl`.
- **Extras** (`66-extras.js`, 3 Nov 2026, from the researched list the user approved):
  - Streak saver (`state.streakSaver`, on by default, toggle in Settings → Goals): one missed day a week is forgiven, never two in a row; `currentStreak` and `bestStreak` are wrapped.
  - "Savings year started" date (`settings.planStart`, falls back to `createdAt`) drives `planDay`.
  - IELTS plan to the exam date (four phases, this week's focus) at the top of Learn's insight column; with no date it offers "Set exam date".
  - Essay writer in Learn → Essay: timer, word count, linking words, self-score on the four criteria (TR, CC, LR, GRA, 5–8) giving a band rounded the IELTS way, band trend and weakest criterion. Saves into `state.ielts.essays` with `crit` and the text; draft in `state.ielts.draft`. "Or log a paper essay" keeps the old form.
  - Weekly backup in Settings → Your data: pick a folder (File System Access API, handle in IndexedDB `dailycoach-backup`); writes `daily-coach-backup-YYYY-MM-DD.json` on open when 7+ days old and permission holds; download fallback. A tip appears when a backup is due.
- **Phone reminders**: the day plan is also in the user's Google Calendar as recurring "Daily Coach · …" events (UK time, popup reminders), created from chat on 3 Nov 2026. If the day plan times change, update those events too.
- **Morning letter** (`67-motivation.js`, 3 Nov 2026, the user asked for life quotes or a motivation letter on Today, then asked for it at the top): the first thing on Today (`.mv-top`, full width). From 900px the quote sits on the left with three small numbers under it (streak, tasks today, % of the savings goal) and the letter on the right; phones stack them. Quote of the day from `MV_QUOTES` (52 original lines in six themes; no famous quotes, so nothing to misattribute), heart keeps a line (`state.motivation.favs`, comes back more often), refresh shows another. A letter "from you, one year from now" written from today's numbers: tasks left and next task, streak, savings against the target, IELTS countdown, quietest area of the last 14 days; two of those rotate each day. "Read it to me" uses speechSynthesis (en-GB). "Your lines" adds his own lines (`state.motivation.mine`, up to 60, shown twice as often; remove needs a second tap). `quoteHTML` now uses the same pool, so Review and the filler cards get the bigger set; the filler skips its quote card when `.mv` is on the page.

## Plan tracking, settings redesign, female voice (3 Nov 2026)

- **Plan tracking** (`68-plan.js`, `plan.css`, from the user's task-board references: kanban boards, a gantt calendar with a now line, a "Today's task" list with filters, a weekly schedule grid):
  - Today → Day plan (`planBoardHTML`, inside `daySystemHTML`) has three views, kept in `state.planView`: **Board** (To do / In progress / Done / Missed; cards show category tag, note, 3 step dots, time and a due chip such as "in 2 h", "Now", "Late"; drag with the mouse, press and hold on touch, or tap a card for a move menu; only the next two To do cards are full size, the rest are compact), **Timeline** (one row per block on a 06:00–23:00 hour grid with a now line; tap a bar to cycle the status) and **List** (All / Open / Done / Missed filters, a check circle per row). All three write the same `dayRec(k).plan[blockId]` values through `dsAction('ds-status')`, so tasks, the now card and charts stay in step. The old Day plan list (`planHTML`, `STATUS_TAG`, `.ds-way/.ds-wp` styles) is deleted; Focus and "Where the time went" now share the row under the board.
  - Learn → "Study plan" (`studyBoardHTML`, above every Learn section; the user asked for Day / Week / Month / Finished and for English, Engineering and Career kept apart): one column per area (`SB_AREAS`), each with a progress bar; cards per plan block (essay, speaking, vocab · knowledge, labpractice · jobs, career) count the blocks the day plan schedules in the period and how many are done, with a chip (Done / On track / Behind / To do). Finished lists what was completed this month, newest first (essay band and pack title where known). View in `state.studyView`.
  - Progress → "Week schedule" (`weekGridHTML`, under the dashboard): areas × Mon–Sun, every block as a chip with Done / Partly / Missed / Not logged / Planned, previous and next week.
  - Not added to Train, Money, Review, Coach or Lab: they already have their own week views or nothing to track as blocks.
- **Settings redesign** (`69-settings2.js`, styles in `plan.css`; research: profile card on top, grouped menu with coloured icon tiles and each item's current value, search, list → page on phones, destructive action apart): a "Me" card (avatar, name, day and streak) opens the Me page (profile card with day, streak, saved and essays, then the fields); groups You / App / Data; every row gets an icon (`SET_ICO` by key, or `data-ico`); search filters rows across all pages; phones show the menu first and a Back button on each page; "Reset everything" sits in a Danger zone.
- **Voice** (`58-render-settings.js`): the user wants a woman's voice, never a man's. `pickVoice()` prefers a chosen voice (`state.voiceName`), then female en-GB voices by known name (`VOICE_F`), never known male names (`VOICE_M`, e.g. Daniel, which was the old first choice). `voiceSay(u)` is used by the coach read-aloud and the Morning letter. Settings → Coach and voice has a voice picker (female voices first).
- **Rail fixes** (3 Nov 2026, user): the expand button is a small arrow at the bottom of the rail (no longer a circle floating on its edge); in the slim rail the hidden label takes no width, and keyboard focus is a sand ring round the icon (the forced red `:focus-visible` outline from `f1.css` used to draw a big box). The menu lists sit in `.rail-mid`, which scrolls up and down (fades at the edges) so more tabs and icons can be added; tooltips are one floating `.rail-ftip`; `railFit` re-measures the lens (a ResizeObserver too) and scrolls the active tab into view.

## Agents tab · control centre (3 Nov 2026)

The user asked for his own agents and a dashboard to check and track them, which agents suit him best from his data, built to grow over time. References: dark sci-fi control-centre dashboards (navy panels, cyan glow, a central hub with nodes, stat strips). Like Orbit, the tab keeps its own dark look in light and dark mode.

- **Files:** `src/js/69c-agents.js`, `src/css/agents.css`; `index.html` has `#view-agents`. The file pushes `{ id:'agents', … }` into `TABS` (so the tab bar and rail pick it up) and wraps `renderView` for `agents`.
- **Agents (`AGENTS` registry):** Chief of staff (team score weighted by goals, top open findings across agents), Fitness, IELTS, Engineering, Career, Money, Sleep and routine, Review. Each has `run(ctx)` returning `{ score 0–100, headline, kpis:[[label, value, sub]], findings:[{ id, t, why, go, sev 1–3 }] }`. `agCtx()` gives 7/14/30-day `periodStats`, area scores and helpers (`blocksDone(id, days)`, `todayBlock(id)`).
- **To add an agent:** add one entry to `AGENTS` (id, name, area, `wkey` for its goal weight in `AG_W`, icon, role, `run`), and a colour in `AG_COLORS`. The hub, roster, health bars, ranking, history, pipeline and log need no other change. `AGENTS_LATER` lists future agents shown as "Later" slots, each with what it needs (job-site connection, Calendar inside the app, food logging, voice practice; the Builder agent runs in the cloud).
- **Running:** `agentsRun()` runs with the autopilot (`apRun` is wrapped: on open, on return, every 15 minutes) and when the tab opens. It upserts one snapshot a day per agent in `state.agents[id].hist` (`{ d, s, f }`, 120 kept), logs daily runs and score moves of 5+ in `state.agentLog` (60 kept). `state.agents[id].on` pauses an agent; `done[YYYY-MM-DD]` holds findings ticked off (30 days kept). Nothing leaves the browser.
- **"Best for you right now":** `agRanking()` = goal weight (`AG_W`: English and career .22, money .2, engineering .16, training and routine .1) × (100 − score) plus open findings, so the agent that can move his goals most this week comes first.
- **Layout:** top strip (agents on, need you, open tasks, done today, clock); left: Team health ring with per-area bars and 14-day trend, Best for you ranking, Activity log; centre: hub (KsHan core, agents on an orbit, rings show scores, links coloured by status: needs you / watching / on track), Process (watch → find → act → done → review counts), Roster with "Later" slots; right: the selected agent (score ring, role, headline, 4 KPIs, findings with Open and Done, Run all, Pause) and its score trend against the team. Three columns from 1500px, two from 1100px, one below; the last panel in each column stretches so columns end level.
- **Phone tab bar** now scrolls sideways, so more tabs fit (the user plans to add more).
- **Pages and themes** (`69d-agents-pages.js`, same day; the user sent a two-screen logistics control platform and said "build like this but change theme"): an angled title plate, page tabs (Overview · Alerts · Team), a theme switch and a clock, then a breadcrumb.
  - **Overview:** plan blocks done this week and month in gold figures against last week and the same days last month, a striped bar of where the done blocks went, a donut of focused hours by area, three headline figures (team score, saved, streak), an isometric tower (`agTowerHTML`: hex prisms with a scanning ring, KsHan above, one tag per agent, tap a tag to open it on Team), an agent ranking (No.1…), and three charts. The day-by-day % done this month has a dashed forecast at the 7-day average, the last 6 weeks of blocks are bars, and spending this month is drawn against the budget line. The two charts filter by area.
  - **Alerts:** red / yellow / blue counts of open findings, today's stats, missed blocks per week, a beacon scene (agents with open findings on a ring, three pedestals: Day plan, Agents, Money), a handling ring, open findings by agent (peaks and a table), and the open list with Open and Done.
  - **Team:** the first version (hub, roster, detail, ranking, health, activity). The hub was redrawn on 3 Nov 2026 as an exact copy of the style of the user's "creative neural dashboard" neumorphism reference (the user rejected a dark version: he wants that exact style): the hub panel is light grey neumorphism (`.ag-p.agn-p`, same in every agents theme). `agHubHTML` + `agMesh`: a grey glass sphere with a red-lit geodesic mesh for KsHan (tap = chief) in a raised white well, a red arc per agent whose length is its score, white tube links with a red pill travelling along each (`animateMotion`; still with reduced motion; red = needs you, amber = watching, pale = on track), dark metal agent spheres with a fiery glow sized by score, white cards with a red icon chip, score, status dot, "Area agent" and open count. From 860px wide the panel also shows a title block (top left) and a Legend (top right, tap to select); underneath, a numbers bar (agents on, open tasks, team score, done today), an "Ask about your team…" bar and three question chips that open the chat (`data-ag-ask`, routed like any chat question). Phones (<700px) get a taller layout. Class names are `agn-*` because short ones like `.chip` and `.spark` clash with app styles.
  - **Watch them work** (`69g-agents-live.js`, 3 Nov 2026; the user wanted to see the agents' movements and real work). Under the Team hub: a work feed and work lanes. "Watch them work" runs every agent for real (`agentsRun`), then replays each run on the hub: a white data packet travels from KsHan to the agent along its link (`agPacket`, SVG `animateMotion` started with `beginElement`), the agent glows as busy (`.agn-busy`), its real steps appear in the feed one by one (`agTrace`: what it read with counts from `AG_SRC`, each KPI, each finding, the score), and a coloured packet returns (red needs you, amber watching, green on track). Finally every agent sends a packet to the Chief of staff, which writes its summary. "Skip to the end" fills the whole log at once; reduced motion shows the log without packets. When idle, the feed shows the selected agent's last work. Work lanes: one row per agent, one dot per day for the last 14 days from `hist` (darker = higher score, bigger = more findings, hollow = did not run); tap a row to select. Lanes fill in day by day, since snapshots only exist from the day the tab was first used.
  - Numbers come from the day plan (`agDay` / `agSum`), so past days count.
  - Themes (`state.agTheme`): **pearl** (default since 3 Nov 2026; existing saves switched once via `state.agThemeV2`), **crimson** (the app's crimson and sand on dark), **teal** (the reference), **blue** (the first version). Pearl is white neumorphism in the user's own palette (Soft Pearl #F2F1ED, Crimson Depth #710014, Warm Sand #B38F6F, obsidian ink): raised panels and cards, pressed-in active tabs and chips, no glows. It applies only inside the Agents tab (`.ag[data-agtheme="pearl"]`, end of `agents.css`); the rest of the app keeps its theme, as the user asked. White text from the dark themes is turned into ink by a generated block at the end of the file. Agent and area colours go through `--agc-*` variables (`AG_COLORS`, `AREA_COL`) so pearl can use deeper, readable tones; the hub's light-panel colours are `--agn-*` variables (reference grey and red in the dark themes, pearl and crimson in pearl). All colours come from `--ag-*` variables with `--ag-rgb` for tints. The page is `state.agPage`.
  - Layout follows the panel's own width (`container-type:inline-size`, `@container agx`): three columns from 1300px wide, two from 1060px, one below 700px.

## Chat languages: Burmese and Japanese (3 Nov 2026)

- **Chat language** (`state.aiLang`: `en` | `my` | `ja`; `AI_LANGS` in `46a-render-assistant.js`): a switch (English · မြန်မာ · 日本語) on the Coach home, in the chat overlay and in Settings → Coach and voice. Choosing one also sets the mic language (`voiceLang` en-GB / my-MM / ja-JP) and changes the chat hint, placeholder and empty text.
- **Answers:** for Burmese or Japanese, `aiTurns` adds a "reply in Burmese / polite Japanese, keep numbers, £ and technical terms in English" line, and `aiRoute` sends the question to Claude even in Saver mode, because the built-in coach only speaks English. The daily limit and "Off" still apply. When Claude can't answer, the built-in English answer comes with a note saying why. The answer cache is keyed by language.
- **Translate** now works between English, Burmese and Japanese: "into" buttons (`state.aiTrTo`) and `aiTranslatePrompt()` (Japanese answers include a rōmaji line). Text already in the target language comes back in English.
- **Voice:** `textLang(text)` detects Myanmar script or Japanese kana/kanji. `voiceSay(u)` then picks a voice for that language, female first (Kyoko, O-ren, Haruka, Ayumi, Nanami, Nilar…), never known male ones (Ichiro, Keita, Otoya, Thiha…). Burmese voices exist only on some devices (e.g. Microsoft Nilar on Windows); otherwise the browser falls back.
- **Fonts:** bubbles get a `lang` attribute; `[lang="my"]` uses the device's Myanmar font with extra line height, and `[lang="ja"]` uses the device's Japanese font. No web fonts.
- **Understands every language, answers in the chosen one** (`69e-lang.js`, same day, the user asked for this): `aiRoute` sends any Burmese or Japanese message to Claude (unless AI is Off or over the daily limit), and `aiTurns` tells Claude the user may write or speak English, Burmese or Japanese and to always reply in the chat language. Without Claude, `generateReply` answers in the chosen language that the built-in coach only reads English. A button next to the mic (`#aiMicLang`, EN / မြန် / 日本) picks the language the mic listens for, because browsers listen for one language at a time. `aiSpeak` warns once per language when the device has no voice for it, with a tip (Edge: Microsoft Nilar Online; Android: SM Myanmar TTS, or Google Japanese voice data; iPhone: Spoken Content → Voices). Settings → Coach and voice lists the English, Burmese and Japanese voices found on the device.
- **Agents: no comment box on tap** (`agents.css`): text in the dashboards can't be selected (`user-select:none`, SVG text ignores the pointer). Selecting a label made the claude.ai viewer open its "Add a comment" box.
- **Load check (3 Nov 2026, a year of sample data):** opens in about 0.5 s, each tab renders in 24–72 ms, saved data about 190 KB of the browser's 5 MB, JS heap about 10 MB, build about 2 MB. No splitting needed.
- **English ⇄ Burmese engineering glossary** (`69f-glossary.js`, styles in `plan.css`, 3 Nov 2026). The user asked about a Burmese microbiology dataset on Hugging Face (CC BY-SA 4.0, about 1,260 Q&A pairs). It was not used: it is off his goals and can only help by training a model, not Claude.
  - `GLOSS` has 74 words from his field in 8 areas (thermoforming, manufacturing, quality, maintenance, safety, CAD and drawings, mechanics and engines), each as English, Burmese and a simple English meaning. The Burmese was written by Claude, and the app says so.
  - The list sits at the top of Learn → Words. It has search (English or Burmese), area chips, hear English or Burmese (`aiSpeak`), "I know it" (`state.glossKnown`) and "Explain".
  - **Explain** asks Claude in simple Burmese for one turn (`gxExplain`, which sets the chat language to Burmese and puts it back afterwards).
  - Today's pack in Learn → Packs shows its key words with Burmese (`gxPackWords`) and an "Explain in Burmese" button for the whole pack.

## Next level: review, speaking, sync, morning briefing (4 Nov 2026)

The user asked to take the project "to the next level" and chose all four researched ideas, with his data stored privately.

- **Spaced review** (`69h-srs.js`, styles in `plan.css`): one deck from the 74 engineering words (English → Burmese + meaning), IELTS band-7 words (`WORDS` + `SRS_IELTS`, 36 more) and his own cards (mistakes or new words, added in Learn → Words). Light SM-2 scheduling (`srsNext`: Again / Hard / Good / Easy, ease and interval per card; an "Again" card comes back at the end of the session). `state.srs = { c:{id:{e,i,r,l,d}}, mine:[…], log:{date:{n,ok,nw}}, newPerDay }` (5 / 10 / 20 new a day; his own cards are never held back). Today: a review strip right under the Morning letter (`mvHTML` wrapped in this file, which loads before the first draw); the review is a full-screen card (Space shows the answer, 1–4 grade, Esc closes, hear English or Burmese). Learn → Words: deck numbers, new-per-day and "Add your own card". The IELTS agent lists due cards as a finding.
- **Speaking examiner and interview coach** (`69i-speak.js`): an IELTS Speaking mock (Part 1 four questions, Part 2 cue card with 1 minute to prepare and 2 to talk, Part 3 the card's follow-up plus two) and an interview practice (5 questions from `SPK_INT`, STAR). Answers are typed or dictated (page mic only where allowed: `spkMicOK`; on claude.ai the phone keyboard mic or Win+H). Local results with no AI: words, speaking time, words a minute, word variety, linking phrases, filler words, short answers and a rough band (clearly labelled). "Score it with Claude" sends the transcript once (default tier) for examiner-style marks per criterion, fixes and better versions; pronunciation is never claimed. Saved in `state.ielts.mocks` (last 20), history under the launchers in Learn → Speaking and Learn → Career. The Interview coach slot was removed from `AGENTS_LATER`.
- **Sync on every device** (`71-sync.js`, loads after boot): on the live link the state is also stored in the artifact's own database, declared owner-only (`db.rules: [{path:"", read:"owner", write:"owner"}]`, with `sample`). Collection `s`: one document per top-level key, big keys split (days by month, long arrays in chunks) under 256 KiB. Each device has its own note `m/<device>` (`{ ts, parts }`) and remembers what it has seen of others (`state._sy.seen`); a single shared meta doc was tried first and lost a save when two devices pushed 15 ms apart. Every push first pulls any newer device's changes; a change that arrives during a push is pulled when the push ends. Pull = three-way merge per part against the last synced hash: unchanged side takes the other, both changed → objects merged and lists with ids joined (`syMergeVal`), the side the person edited last wins on a clash (`state._lastEdit`, set on clicks and changes). Device-only keys: `aiCache`, `agThemeV2`, `_lastEdit`. Settings → Your data shows the sync chip, this device's id and "Sync now". The offline file has no database and works as before. Tested with two browsers sharing a fake database (3 runs: both sides' edits survive).
- **Morning briefing**: the app writes `cloud/digest` (agents' scores, headlines, KPIs and open findings, today's and tomorrow's plan, week numbers, review cards due, exam date, last speaking bands; no raw records) at most every 5 minutes after a push. The scheduled task "Daily Coach morning briefing" (06:01 London, cloud, automatic approval) reads only that document and writes `cloud/briefing` `{ date, time, headline, top3[3], verdicts[{agent,text}], note }`, which Today shows under the Morning letter (`briefingHTML`, live via `onSnapshot`; an older one is marked with its date). It needs the new code on the live link first, and the first real run is the morning after.
- **Buttons:** new screens use the app's `btn btn-deep` / `btn btn-soft` (a bare `.btn` has no colour here) and `.btn.sm`.
- **File saves on the live link (4 Nov 2026):** the claude.ai viewer blocks plain download links, so the artifact declares the `downloads` capability (with `sample` and the owner-only `db`; a publish with `capabilities` must restate all three). `dcSave(filename, data, what)` in `66-extras.js` uses `claude.use('downloads').save()` (the viewer confirms the save; `declined` shows "Save cancelled") and falls back to a normal `<a download>` in the offline file. "Download a backup" uses it and only marks `state.backup.last` when the save happened. The embedded Lab gets `window.claude = parent.claude` in its injected start script, so its own "Save backup" / "Save test log" buttons work there too. Allowed extensions include json, csv, txt, md, png and pdf.
- **Steps entry** (5 Nov 2026, the user "can't do my step count" just after midnight): Today → Quick log steps card (`stepsCardInner` in `41-render-today.js`). Tap the number to type the exact count (`steps-edit` → `#stepsIn`, Enter or Save → `stepsSave`, 0–100,000); −1k / +1k stay. A Today / Yesterday switch (`STEPS.day`, not saved) picks the day; from 00:00 to 04:00 it starts on Yesterday (`stepsKey`). `syncAutoTasks(k)` ticks the walk task for that day, and the toast uses the real goal instead of a hard-coded 8,000.
