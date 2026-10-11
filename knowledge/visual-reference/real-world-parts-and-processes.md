# Real parts, processes and methods: where to see them

Created 2026-10-11 by the assistant from web searches. This is a map to real material, not a copy of it. Photos and videos are not stored in the vault (plain-text rule, and large files stay out of Git). I could not open every page, so "what the source says" is taken from search summaries. Open the link and check before relying on it.

## 1. Links found
| Topic | Source | What it offers (from search results) |
|---|---|---|
| Overview of all manufacturing processes | [The Efficient Engineer, "How Things Are Made" (YouTube; search the title)](https://www.youtube.com/results?search_query=efficient+engineer+how+things+are+made) | Animated video on forming, casting, molding, machining, joining, additive. |
| Casting vs forging | Video "Forging vs. Casting: Which Metal Would You Trust?" (about 8 min, search the title on YouTube) | Strength differences between the two processes. |
| Process families in text | [Cleverence guide to manufacturing processes](https://www.cleverence.com/articles/for-business/what-are-the-various-manufacturing-processes-4821/) | Casting/molding, deformation (forging, rolling, extrusion, drawing, sheet metal), material removal (machining). |
| Machine elements: gears, bolted joints | [Jonkoping University, Machine Elements](https://mechanics.ju.se/MachineElements/) | Course material built around lab and workshop practice, starting with spur gears and bolted joints. |
| Machine elements in a book | [Mechanical Design Engineering Handbook, Childs and Masen (Elsevier)](https://educate.elsevier.com/book/details/9780443220777) | Bearings, gears, shafts, clutches, brakes, belts, chains; reported 600+ images. Also Shigley's Mechanical Engineering Design. |
| Tensile test, necking | [COMSOL, necking of an elastoplastic bar](https://www.comsol.com/blogs/evaluating-the-necking-of-an-elastoplastic-metal-bar-benchmark-model) | Includes a photo of a ductile specimen with local necking (image credited and licensed; check terms before reuse). |
| Tensile test machine | [TU Darmstadt, 1000 kN universal testing machine](https://www.stahlbau.tu-darmstadt.de/fachgebiet/forschungslabor/universalpruefmaschine_max___1000_kn_zug___druck_1.en.jsp) | A real lab machine page. |
| Welds and defects | [Xiris, Welding Defects Guide](https://blog.xiris.com/welding-defects-guide), [ESAB, Welder's Guide to Defects](https://esab.com/bd/ind_en/esab-university/blogs/the-welders-guide-to-defects-and-remedies/), [Fabrico weld defects](https://www.fabrico.io/blog/weld-defects/), [SD DOT welding chapter](https://dot.sd.gov/media/8758fbc5/Chapter10Welding.pdf) | Defect types and causes (undercut, porosity, overlap, lack of fusion, cracks). The SD DOT chapter shows fillet weld profiles and gauging. Photos in these pages: not confirmed. |
| Fatigue fracture surfaces | [ASM International](https://static.asminternational.org/amp/201909/24), [Corrosionpedia](https://www.corrosionpedia.com/?p=77010) | Beach marks (also "clamshell marks"): curved concentric arcs showing crack front positions. |

Not found: a ready Wikimedia Commons category for fatigue fractures. Search Commons yourself with "beach marks", "clamshell marks", "fatigue fracture". Same for strain gauges, bolted flanges, gears and bearings: search the name plus "Wikimedia Commons" or "video". Look at licences before reuse.

## 2. What to look for, by roadmap topic
Use this as a viewing checklist. For each real item, tie what you see to a concept in your notes.

| Roadmap topic | Real item to find | What to see and ask |
|---|---|---|
| Statics, reactions | Bridge bearings, a bolted pipe support, a crane base plate | Which support type is it (roller, pin, fixed)? Where would the reaction act? |
| Mechanics of materials | A tensile test specimen before and after | Where does it neck? Compare the gauge length before and after. |
| Stress concentration | A broken shaft at a shoulder, a plate with a hole | Where did it crack? Fillet radius? |
| Failure theories | Ductile cup-and-cone fracture vs a brittle flat fracture | Which failure theory suits each? |
| Fatigue | A fractured shaft with beach marks | Locate the origin. Is the final fracture small (low load) or large? |
| Bolted joints | A flange with bolts, a car wheel | Number, size, preload method, washer, nut locking. |
| Welds | Fillet and butt welds on a frame | Weld size, undercut, porosity, toe position relative to load. |
| Shafts, keys, bearings | A gearbox cut-away | Shoulders, keyways, snap rings, bearing fits. |
| Gears | A gear pair | Tooth form, contact pattern, wear. |
| Springs | Coil spring, leaf spring | Wire diameter, number of coils, end type. |
| Manufacturing | A cast part, a forged part, a machined part, a sheet-metal bracket, a 3D-printed part | Parting line, grain flow, tool marks, bends, layer lines. How would you design it for that process? |

## 3. A method for observing real parts (do this, and save notes)
1. Find a real item: a workshop, a scrapyard, a lab, a bicycle, a car part, a tool, a hinge.
2. Take photos from several angles with something for scale (a ruler). Keep the photos outside Git (large files), in a folder such as `LifeVault-media/` next to the repo.
3. Write a note using the template below in `inbox/`.
4. Measure what you can (caliper). Estimate loads. Do one hand calculation from your check sheets. Compare to what you see.
5. Ask: if I were designing this, what would I change, and why?

Template:
```
Item:
Where found / date:
Photo files (outside Git):
Function:
Material (if known, how known):
Process used to make it (casting, forging, machining, sheet metal, welded, printed):
Loads I think it sees:
Failure risk (yielding, fatigue, buckling, wear):
Dimensions measured (units):
Hand calculation (link to a check sheet):
What I would change:
Questions:
```

## 4. If you want generated or CAD visuals instead
- Your SolidWorks models of the same parts give accurate shape; use them for your own sections and exploded views.
- AI-generated pictures are possible with the connected image tool, but they can show wrong or impossible parts, cost credits, and go against the vault's "no generated design" rule. I will not make them without your yes.
