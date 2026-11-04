# QA checklist

Ten minutes. Do it after every build. Test **`dist/daily-coach.html`**, not `index.html`.

## Boot
- [ ] Opens with no console errors (DevTools → Console).
- [ ] Hero title reads the tab name; the subtitle words reveal in.
- [ ] Ambient background drifts; no hard band edges if you removed the blur.

## Today
- [ ] Ring fills from zero on load; the number matches "n of m".
- [ ] Ticking a task: checkbox stroke draws, sparks leave the box, the ring and "x left today" update.
- [ ] Four ticks = streak day; the toast says so and the week strip orb fills.
- [ ] Ticking everything shows the orange sun in the tide art.
- [ ] Steps +1k ×8 auto-completes the 8,000 steps task.
- [ ] Cue card expands; 1-min and 2-min timers count down and toast at zero.

## Train
- [ ] Today's session matches the weekday (Mon A / Tue B / Wed walk / Thu A / Fri B / Sat circuit / Sun rest).
- [ ] Tapping a day in the strip shows that day's session.
- [ ] Tapping a set chip fills it, starts the rest timer, and the bar can be skipped.
- [ ] Rest bar sits above the tab bar and does **not** block taps when idle.

## Learn
- [ ] All five segments render: Essay, Speaking, Packs, Words, Career.
- [ ] Learning a pack ticks the day's knowledge task.
- [ ] Career: timeline, portfolio ticks persist, story and question accordions open.
- [ ] "Career 15 minutes" on Today deep-links to Learn → Career.

## Money
- [ ] Adding an expense updates this month, the category bars and the projection.
- [ ] Over-budget projection shows the orange warning toast.
- [ ] Editing a fixed cost changes "Free every month", "Gap" and the milestone maths.
- [ ] FAB morphs to a menu, both actions open the sheet, the sheet closes on submit.
- [ ] Adding a saving moves the ring and the milestone bars.

## Progress / Coach
- [ ] Weigh-in appends to the sparkline and updates the week delta.
- [ ] Heatmap shows today; 14-day bars show orange for today.
- [ ] Coach answers all six quick prompts with numbers from the app, streaming.
- [ ] Settings: theme switching, reduce motion, income/goal save, export downloads, import merges.

## Motion and degradation
- [ ] Tap light is a small coin-sized glow that scales with the control — never a full-card flare.
- [ ] With reduced motion (OS setting **or** the in-app toggle): no bloom, no sparks, no motes,
      no cascade, timers still work.
- [ ] Dark mode: no grey-on-grey, the tap light has a luminous rim.
- [ ] 360×740 and 1280×900 both look composed; nothing overflows horizontally.
- [ ] Storage blocked (open in a sandboxed iframe): app still runs, warns, loses nothing else.
