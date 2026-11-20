# Build References — Animation, Explainer & Simulation Prompts

Claude: when I ask for a visual build (explainer video, animation, interactive simulation, 3D model, mini-game), use this library as inspiration and as a source of proven prompt patterns.

## Source
- **awesome-opus5-5-videos** — https://github.com/yihui-dev/awesome-opus5-5-videos
- 703 prompts for videos and builds made with Claude Opus 5.5, all written as code (HTML, Canvas, SVG, GSAP, Three.js, shaders, Web Audio).
- Categories: motion graphics (369), 3D (117), explainers (116), interactive and games (101).
- Data lives in `data/videos.json` (fields: slug, category, tech_tags, prompt, prompt_partial) and in `prompts/`. Clone it with `git clone --depth 1` and filter by category or keyword.

## Caveats
- It's a promotional repo. Nearly every link goes to Skillry (with tracking). Use the prompts and ignore the funnel.
- Entries marked `prompt_partial: true` are only the creator's social post, not the real prompt. Treat them as ideas, not templates.
- "Viral" claims and results aren't verified. Judge each build by what it actually produces.

## Most relevant to me (engineering and learning)
Ideas from the collection worth reusing or adapting:
- **Engine you can take apart in the browser.** Pistons, crank, RPM control, cut-away cylinders, slow motion. (stefanostraus-971191)
- **Rocket engine teardown.** Follow the propellant through the turbopumps, then throttle it. (konstantinsaifo-501736)
- **Fusion reactor lab.** Drag plasma temperature and watch the output change. (konstantinsaifo-587629)
- **How a mechanical keyboard works.** 3D build with sound synced to the cuts. (iniyanai-856596)
- **Earthquake physics.** Animated strain profile. (kureshirfan-386691)
- **Fourier series explainer.** (miguel07code-091611)
- **GPU fire simulation** with blackbody colour physics. (nathanwilbanks-981110)
- **3D water simulation** built from an empty repo, with tests. (stephanferraro-224281)
- **House as code.** Drawings, engineering calculations, 3D viewer and CAD export, concept only. (ajthemongol-318512)
- **Token-bucket explainer.** Canvas only, every frame a pure function of time so it can be rendered to video. A good technique for any build. (parkerrex-701462)

## Reusable prompt patterns
- **One file, one canvas, one `draw(t)` function.** Make every frame a pure function of time, so the build can be scrubbed, screenshotted and exported to MP4.
- **Five-scene explainer:** the problem → what it is → how it works in 3 steps → one proof point or real example → close.
- **Take-apart interactive:** a 3D model with exploded view, labels, sliders for the key variable (RPM, temperature, pressure) and a slow-motion toggle.
- **Autonomous build:** "Work end to end without stopping to ask; make the calls yourself and tell me what you decided at the end."
- **Learn-it explainer:** "Explain [concept] as an animation, physically accurate, with a worked example and a question that makes me think."

## Starter prompts for my builds
**Thermoforming explainer** (ties to the Huhtamaki operator role):
```
Build a 60-second explainer animation as a single self-contained HTML file (Canvas, every frame a pure function of time). Topic: how thermoforming works on a production line. Show the plastic sheet feeding in, the heating zone (with temperature rising), forming over the mould with vacuum/pressure, cooling, trimming and stacking. Label each stage, show the key variables (sheet temperature, forming pressure, cycle time) and one common fault for each stage with its cause. Clean engineering-diagram style, UK English.
```

**Engineering concept lab** (for my first-class study plan):
```
Build an interactive browser lab that teaches [topic, e.g. the Rankine cycle / beam bending / heat exchangers]. Include a labelled diagram, sliders for the main variables, live-updating equations and graphs, and a worked exam-style example. Make it physically accurate and state the assumptions. Single HTML file, no external assets.
```
