# Personal Growth Project — project brief

A one-page overview for chats in the Claude Project. The full technical notes are in `CLAUDE.md`.

## Where things are

| What | Where |
|---|---|
| Live app (private) | https://claude.ai/artifact/ABK7Raj2rTqfmzUD5LiVgF |
| Offline app | `dist/daily-coach.html`. Open it in Chrome; Chrome can create a shortcut with the galaxy icon. |
| Code | GitHub `ichiro04/ichiro04`, branch `claude/affectionate-hopper-zzk39m`, folder `apps/daily-coach` |
| Build | `node build.mjs` turns `src/` into `dist/daily-coach.html` and `dist/artifact.html` |
| Icon | `icons/` (SVG source, PNG sizes, Windows `.ico`) |

## What the app does

**Navigation.** On laptops and desktops a side rail on the left works in two states: slim with icons only, or wide with names (the small arrow at the bottom switches). Its menu scrolls up and down, so more tabs can be added. Phones use a bottom tab bar. The tabs are Today, Train, Learn, Lab, Money, Progress, Review, Coach and Agents (the phone tab bar scrolls sideways). Settings opens from the gear in the date strip or from the rail.

**Today.**
- The daily system: the now card with a ring timer and Done / Partly / Missed, an up-next countdown, the 3 that matter and a feel strip.
- **Day plan** in three views: a Board (To do / In progress / Done / Missed; drag cards or tap to move them), a Timeline on an hour grid with a now line, and a List with All / Open / Done / Missed filters.
- **Today's wave:** the day plan drawn as an animated wave, with done blocks filled in crimson and a "Now" marker.
- **Tips** worked out from the data, up to 3 at a time, each dismissible for today.
- The task list: four tasks makes a streak day. The **streak saver** forgives one missed day a week (never two in a row); switch it off in Settings → Goals.
- **Morning letter** (the first thing on Today): a quote of the day (keep it with the heart, or tap for another) and a short letter from "you, one year from now" written from today's numbers: tasks left, streak, savings, IELTS countdown and your quietest area. "Read it to me" reads it aloud, and "Your lines" adds your own lines to the quotes.

**Orbit (the knowledge map / galaxy).** It opens from the launcher card. It's a 3D cinematic space scene built from real data:
- Sun = KsHan.
- Stars = the 9 big areas (Thermoforming 24%, Manufacturing 16%, CAD 13%, Quality 12%, Maintenance 11%, Engines 8%, Mechanics 7%, Career 5%, English 4%).
- Planets = today's tasks; tap one to tick it off.
- Moons = topics at 50% mastery or more; asteroids = topics under 50%.
- Black holes = 6 mistakes to avoid.
- Satellites = the next 3 day-plan blocks; nebulae = big goals (£25k, IELTS, target weight); pulsar = the streak; constellation = the last 14 days.

The map's controls:
- Drag moves the view; the orbit toggle or right-drag spins it. Zoom goes up to 24×.
- The panels tuck away while you explore and come back from the "Panels" button.
- + and − zoom, and the number between them (e.g. 1.0×) shows the zoom; tap it to go back to 1×.
- The KsHan title moves with the galaxy, and labels never hide under the panels.
- "Ask AI" opens the chat over the map with suggested questions.

**Wide screens.** Every tab uses the full width. Train, Learn, Money and Progress have an extra column of charts and trackers, Progress starts with number tiles and a statistics chart, and Coach and Review are laid out in columns. There are no side bars.

**Review.**
- Check-ins every 2 weeks and every month. Each one fills in the numbers itself, gives the coach's read, asks for 1–5 ratings in six areas and three short questions, and sets a focus area for the next period.
- Calendar with each day coloured by tasks done and dots for training, English, savings and weight; tap a day to see it and write a note.
- Charts: this fortnight against the last (wave), daily focused time, balance wheel, fortnight trend and past check-ins.
- IELTS countdown (also on Today once an exam date is set), a Money month panel in the monthly check-in, and "Copy as text" on finished check-ins.
- Past days in the calendar: tap a task to fix a missed log.
- "Edit layout" moves or hides sections.

**Lab.**
- **CAD workspace:** SolidWorks-style WebGL modeller with a feature tree, editable boss / cut / rib / fillet features, zoom / pan / rotate, display styles and full screen. Its exercises are the L-bracket, flanged bush, pillow block and V4 engine block, each checked against a generated drawing.
- The older 3D CAD quiz, the drawings explorer and 8-question test, the V12 engine digital twin with a fault simulator, and the test bench.

**Coach AI.**
- Top of the Coach tab: today's plan (a to-do list the autopilot builds each morning, plus your own items), a Schedule calendar (week strip and the day's timeline), quick actions, a status card, tips from your numbers, this week's wave and the autopilot card. "Edit layout" moves or hides these.
- **Autopilot** runs inside the app (on opening, on coming back and every 15 minutes): plan, tips and check-in drafts. Switches in Settings → Autopilot. A cloud builder also works through `AUTOPILOT.md` at night and pushes code changes to GitHub.
- A floating "Ask coach" button sits on every tab, with a mic.
- In the chat:
  - The text box.
  - A mic. Voice works in the Chrome app; the claude.ai viewer blocks the microphone, so device dictation is the fallback.
  - Read-aloud answers.
  - English ⇄ Burmese translation.
- **Token saver:** Saver (the default) gives built-in answers and calls Claude only on "Ask Claude"; Smart sends only open questions to Claude; Off never calls it. There's a daily limit (default 20), a same-day answer cache and a usage meter in Settings.

**Agents.** A dark control centre for your team of agents: Chief of staff, Fitness, IELTS, Engineering, Career, Money, Sleep and routine, and Review. Each one watches its part of your data, gives a score out of 100, lists what needs doing (Open goes there, Done ticks it off) and keeps a daily score history. You'll see:
- Team health, with a score per area.
- "Best for you right now": the agents that can move your goals most this week (your goals weigh English and career highest, then money).
- A hub with you in the middle.
- The process: watch → find → act → done → review.
- An activity log.
- Run all and pause switches.
- Slots for future agents (job board scout, calendar, nutrition, interview coach, builder).

They run inside the app with the autopilot; nothing is sent anywhere. New agents are one entry in the code.

**Money / Progress / Train / Learn.**
- Train: sessions with animated exercise figures.
- Learn: IELTS essays (write in the app with a timer, word count and linking words, then score yourself on the four criteria to get a band and a trend), an IELTS plan counting down to the exam date, a Study plan with Day / Week / Month / Finished views and separate English, Engineering and Career columns, speaking cue cards, 15 engineering knowledge packs (new: trim press faults, SPC, safe isolation), words and career prep (Huhtamaki stages, stories, portfolio).
- Money: the £25k savings plan and spending log. The savings year starts on the date set in Settings → Goals.
- Progress: streaks and charts, and a week schedule grid (areas × days, every block marked Done, Partly, Missed, Not logged or Planned).

**Settings.** A "Me" card at the top (your profile page with day, streak, savings and essays), groups You / App / Data with an icon and the current value on each item, search, and an icon on every row. On a phone the menu comes first and each page has a Back button. Read-aloud uses a female voice; pick another in Coach and voice.

**Backup and reminders.** Settings → Your data saves a backup file to a folder you pick once a week (or downloads one). The day plan is also in Google Calendar as "Daily Coach · …" events with phone reminders. The Lab works offline.

## Look
- Three styles in Settings → Look: Crimson pearl (default), Neumorphic glass and Glassmorphism. The glass styles can be tuned there: tint, accent, transparency, blur, soft depth, roundness, solid surfaces.
- Palette: Crimson Depth #710014, Warm Sand #B38F6F, Soft Pearl #F2F1ED, Obsidian #161616.
- Background: a procedural red / gold / cream mountain landscape.
- The galaxy is deep blue space.
- Surfaces are liquid glass with springy motion, and every animation stops when reduced motion is on.

## Data
Everything is stored in the browser under `localStorage['dailycoach.v1']`. The claude.ai link and the offline file keep separate copies; Settings → Your data → Export / Import moves data between them. Reset clears only the logged data, not the app.

## Money and targets
The real budget is in `docs/money-plan.md`: income £2,500 a month, budget £1,197, so £1,303 saved a month (£15,636 a year). The £25k goal needs £2,083 a month, so it is short by about £780 a month. Commuting to Huhtamaki in Gosport would cost about £206 a month. The target weight is 72 kg and the IELTS target 7.0. All of these can be changed in Settings → Goals and money. Background about Kyaw is in `docs/instructions-context.md`.

## Asking for changes
- Questions, plans, coaching, study help and small text changes can happen in the Project chat.
- New features and redesigns are also done in the Project chat, straight on the repository and branch above (build, test, commit, push). Claude Code is only needed to republish the live claude.ai link. Start there with: "Edit my Daily Coach app in ichiro04/ichiro04, branch claude/affectionate-hopper-zzk39m, folder apps/daily-coach. Read CLAUDE.md first." After a change the live link is republished, and the offline file needs replacing with the new `dist/daily-coach.html`.
