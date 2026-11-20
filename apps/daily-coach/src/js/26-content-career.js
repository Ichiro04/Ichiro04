/* ============================================================
   CAREER · built from Kyaw's CV
   ============================================================ */
const TIMELINE = [
  { when:'Applied', role:'Thermo machine operator', org:'Huhtamaki, Gosport', detail:'Application sent. Next come a 30-minute technical assessment, a warehouse tour and a final interview. Prepare for each one below.', now:true },
  { when:'Sep 2025 – Jul 2026', role:'Skilled production operator and engineering assistant', org:'Barfoots of Botley', detail:'Automated packaging lines: bagging, flow wrap, mic-vac, lidding. 98%+ line efficiency, precision changeovers, root-cause analysis with the site engineering team, CI projects on bottlenecks.' },
  { when:'2024 – 2025', role:'BEng Mechanical Engineering', org:'University of Portsmouth', detail:'CAD modelling, FEA, design for manufacture. Final project: how cooling rates change the mechanical properties of rotationally moulded plastics.' },
  { when:'2023 – 2024', role:'CNC specialist and maintenance coordinator', org:'Great One Plastic Printing', detail:'CNC programming for high-volume plastic packaging, parameter calibration (temperature, pressure, cycle time) cutting material waste, PPM on CNC machines, trained junior operators on safety and QA.' },
  { when:'2021 – 2023', role:'Diploma of Mechanical Engineering', org:'Chindwin Technological University', detail:'Foundation in mechanics, materials and drawing practice.' }
];

const CV_STRENGTHS = [
  'You have kept high-speed lines running to specification. Most graduates have never touched a production line.',
  'You can hold a tolerance and programme a machine — CNC at Great One, not just coursework.',
  'You have done materials testing end to end: cooling rate in, tensile results out.',
  'You have trained people. That is evidence of judgement, which is rare in a graduate CV.',
  'You speak both languages: the drawing and the shop floor.'
];

const CV_FIXES = [
  'Lead with numbers you own. "98%+ line efficiency" is strong — add scrap %, downtime minutes saved, changeover time cut.',
  'Put your target in the first line, for example "Seeking a design or manufacturing engineering role". Keep the Huhtamaki application off the CV until you have an offer.',
  'Cut "developed through coursework" from the summary — it undersells four years of real plant work.',
  'Say SolidWorks, Inventor and ANSYS once each, then say what you did with them. Software lists do not interview well.',
  'Keep it to one page. Two roles plus a degree does not need two.',
  'Replace "Collaborate with…" with a specific thing you changed and its effect.'
];

const STORIES = [
  { q:'Tell me about a fault you diagnosed.',
    hook:'A seal integrity failure that came back every few hours.',
    body:'Contain — stop and quarantine the suspect packs. Then work the machine in order: jaws, film path, then fill timing. The seal was being contaminated by product at the jaw line, so the fix was upstream, not the sealing head.',
    close:'What I learned: a seal failure is almost never a sealing problem. Since then I check the fill and the film path first.' },
  { q:'Show me a time you used data to change a decision.',
    hook:'My rotational moulding study on cooling rate.',
    body:'I ran the same material through different cooling profiles and measured tensile strength, flexibility and durability. The data showed irregular cooling was degrading mechanical performance — not just cosmetic warping.',
    close:'That taught me to recommend a process change with evidence, which is what I would do on the floor rather than argue from opinion.' },
  { q:'Describe an improvement you made to a process.',
    hook:'Changeovers on automated packing lines.',
    body:'The downtime was mostly preparation done after the machine stopped. I moved film, trays and tooling staging to before the last pack, and standardised the sequence so other operators could repeat it.',
    close:'Changeover time fell and, more importantly, it stopped depending on who was on the line.' },
  { q:'Tell me about a time you trained or supported someone.',
    hook:'Junior operators at Great One.',
    body:'I ran the safety and quality induction for new operators and stayed on the line with them for their first shift, rather than handing them a booklet.',
    close:'It cut the repeat mistakes early, and it taught me that a standard only works if the person doing the job helped write it.' }
];

const QUESTION_BANK = [
  { q:'What would you check first if a thermoformer starts making thin corners?', a:'Heat first: the sheet temperature profile, especially the heater zones over those corners. Then the plug assist timing and depth, then vacuum timing. Change one thing at a time and cut a part in half to measure the wall, before and after.' },
  { q:'How do you make sure a machine is safe before you clear a jam?', a:'Stop it normally, isolate every energy source (electric, air, heat), put my own lock and tag on, then prove it is dead by trying to start it and checking the air gauge reads zero. Only then do I reach in. A jam is never too quick for that.' },
  { q:'Tell me about a time you followed a procedure you thought could be better.', a:'Use a real example (STAR): follow it first, note the step that costs time or causes errors, bring it to the supervisor with a number (minutes, scrap), and suggest a small trial. Show that you improve things through the system, not around it.' },
  { q:'Your line is running but scrap has doubled since the start of the shift. What do you do?', a:'Contain first: separate the bad parts and tell the shift lead. Then look at what changed at the time it started: material batch, settings, temperature, a changeover. Check the process sheet against the machine, change one thing, and measure the next parts.' },
  { q:'How would you handle working night shifts and a 12-hour pattern?', a:'Be honest and practical: fixed sleep times on nights, blackout curtains, meals planned, no long drives tired. Mention that you already run your day on a written plan and track sleep, so you know how to protect your energy.' },
  { q:'Walk me through how a thermoforming cycle actually works.', a:'Heat the sheet, form it, cool it under pressure or vacuum, eject and trim. The engineering is in the cooling: it is most of the cycle and it sets the shrinkage and the wall distribution. Then say what your plant measures to control it.' },
  { q:'Why does a part warp after it has been made?', a:'Residual stress and uneven shrinkage. Fast or uneven cooling locks in differential contraction. Mention mould temperature uniformity, cooling time, and that the part tells you where the stress is.' },
  { q:'What is OEE and what would you do with it?', a:'Availability × performance × quality. Use it to decide where to look first, then stop quoting it and start fixing the biggest loss — usually micro-stops on a packaging line.' },
  { q:'How would you reduce changeover time on a line you have never seen?', a:'Watch it once, time every step, split internal from external, move the external ones before the stop, then standardise and photograph the sequence. Small, boring, repeatable.' },
  { q:'A tolerance cannot be held. What do you say to the designer?', a:'Ask what the tolerance does for the function. If it is not functional, widen it. If it is, then the conversation is about process capability, and I would bring the data rather than the complaint.' },
  { q:'What do you do when nobody knows why a fault keeps happening?', a:'Look at when it happens, not just where. Shift patterns, temperature, product changes. Then five whys to a system cause and one controlled change at a time.' },
  { q:'Tell me about your FEA experience.', a:'Be honest about scope: coursework-level with SolidWorks and ANSYS, including mesh convergence and sanity checks against hand calculations. Then say what you would need help with.' },
  { q:'Why move from operator to engineer here?', a:'Because you have been the person the engineer calls at 2am, and you want to be the person who designs the fix so nobody gets called again.' },
  { q:'How do you handle an operator who says the machine "just does that"?', a:'Believe them, then time it. Their description is data, even when it is not a diagnosis. A tally sheet for one shift usually settles it without an argument.' },
  { q:'What is the difference between a corrective and a preventive action?', a:'Corrective fixes this machine this time. Preventive changes the system so the class of fault cannot recur — the standard, the check, the spare, the training.' },
  { q:'Where do you want to be in three years?', a:'Design or manufacturing engineer, owning a line or a product family, strong enough in CAD and FEA to defend a design and practical enough to know when the drawing is a lie.' },
  { q:'What would you do in your first month here?', a:'Learn the process from the operators, map one line end to end, learn the downtime numbers, and fix one small thing properly so people see that engineering changes something.' }
];

const PORTFOLIO = [
  { id:'drawing',  t:'Drawing pack', d:'Three parts you have modelled and drawn properly: datums, tolerances, no double dimensioning.' },
  { id:'thermoP',  t:'Thermoforming case study', d:'One A4: a defect from your plant, the process cause, the fix, the evidence.' },
  { id:'cooling',  t:'Cooling-rate study, one page', d:'Aim, method, one graph, three findings, one recommendation. From your Portsmouth project.' },
  { id:'fea',      t:'FEA comparison', d:'One bracket, mesh convergence shown, hand calculation as a sanity check.' },
  { id:'oee',      t:'OEE improvement write-up', d:'One shift of stops, the biggest loss, what you changed, before and after.' },
  { id:'cv',       t:'CV rewritten to one page', d:'Numbers first, coursework language gone, current role at the top.' }
];


const HUHT_STAGES = [
  { id:'applied', t:'Applied', d:'Application sent for the thermo machine operator role.' },
  { id:'assess',  t:'Technical assessment, 30 minutes', d:'Likely areas: numeracy, mechanical reasoning, reading instructions, safety. Ask the recruiter exactly what it covers. Practise with a knowledge pack each day.' },
  { id:'tour',    t:'Warehouse tour', d:'Notice guarding, floor markings, PPE and housekeeping. Prepare two good questions about training and quality checks.' },
  { id:'final',   t:'Final interview', d:'Rehearse four stories from the story bank out loud, one minute each.' },
  { id:'offer',   t:'Offer', d:'Ask about shifts, training, and how pay progresses.' }
];
