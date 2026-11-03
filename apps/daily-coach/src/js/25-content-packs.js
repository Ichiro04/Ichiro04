const KNOWLEDGE_PACKS = [
  { id:'vffs', title:'Bagging lines: vertical form, fill, seal', tag:'Your lines',
    points:[
      'The film path is the whole machine: roll, tension rollers, forming shoulder, tube, vertical seal, jaws. Track a fault from the roll forward, never from the HMI backwards.',
      'The forming shoulder turns flat film into a tube. Wrinkles start here — a shoulder that is dirty, worn or slightly misaligned will show up two metres later as a leaking vertical seal.',
      'Jaw temperature, dwell and pressure do three different jobs. Cold jaws give peelable, weak seals; too hot gives burn-through and film stuck to the jaws. Dwell fixes thickness; pressure fixes wrinkles.',
      'Product in the seal area is contamination. Every seal failure you find with a crumb in it is a filling or timing problem, not a sealing problem.',
      'Two tests, done properly: a squeeze test on every start-up, and a peel or dye-penetration test on the first bag of each changeover. Write the number down.'
    ],
    ask:'A bagging line loses seal integrity once an hour for three bags, then recovers. What are your first three checks, in order?',
    new:'On the warehouse tour or in your first week, ask which seal parameters are on the changeover sheet and which are actually set. If they differ, you have found a first improvement.' },
  { id:'flowwrap', title:'Flow wrap and photo-eye registration', tag:'Your lines',
    points:[
      'Flow wrap is a horizontal tube: product is pushed into film, the fin seal closes the tube underneath, then rotary end-seal jaws seal and cut. Every fault belongs to one of those three stages.',
      'Print registration is a photo-eye reading a mark, not a person reading the film. If the eye is dirty, the print drifts and the jaws cut through artwork — clean before you adjust.',
      'The fin seal folds film onto itself. A worn or contaminated folding plough makes a seal that looks fine and fails in transit.',
      'End-seal jaws cut and seal in the same instant. A nicked blade gives a ragged tail; a chip in the jaw gives a leak on every tenth pack.',
      'Belt speed, jaw speed and film speed must agree. When they do not, you get concertina at the infeed and stretched print at the outfeed.'
    ],
    ask:'Film is tracking off-centre only at high speed. Would you adjust the eye, the forming plough, or the belts, and why?',
    new:'Time one changeover from last good pack to first good pack, and write down each step. That number is the start of your SMED project.' },
  { id:'micvac', title:'Mic-vac, vacuum and modified atmosphere', tag:'Your lines',
    points:[
      'Vacuum packaging removes oxygen; modified atmosphere replaces it with a chosen mix — usually nitrogen to protect structure, carbon dioxide to suppress microbes.',
      'Fresh produce is alive and respiring. Too little oxygen and it ferments; too much and it ages fast. That balance is why micro-perforated film exists.',
      'Residual oxygen is the number that matters. A headspace analyser on the first packs of a run tells you more than any visual check.',
      'Seal integrity is a separate failure from gas mix. Test them separately: a dye or water-immersion test for leaks, an analyser for gas.',
      'Vacuum pulls liquid and debris into the seal path. On wet product, seal failures are usually a fill-height or draining problem.'
    ],
    ask:'Packs look tight and pass visual, but shelf life is short. What do you measure, and in what order?',
    new:'Find out what the target gas mix is for your biggest product, then find out what the analyser actually reads on a normal run.' },
  { id:'lidding', title:'Tray sealing and lidding film', tag:'Your lines',
    points:[
      'A tray seal has three variables: platen temperature, dwell time and pressure. Change one at a time, and give the machine a minute to settle before you judge it.',
      'Peelable and weld seals are different products, not different settings. A peel seal that will not peel has been run too hot.',
      'Film tension decides wrinkles. Loose film bridges over the tray rim and leaks; tight film tears at the corners where the tooling grips.',
      'Condensation on chilled trays sits in the seal path. That is why a line can run all morning and fail after the first defrost.',
      'Leak detection after sealing is not optional on ambient-stable product. One pinhole resets the whole shelf life.'
    ],
    ask:'Every twentieth lid wrinkles at the same corner. Tooling, film or product — how would you prove which?',
    new:'Ask to see the seal-integrity reject rate for last month. If nobody knows the number, that is a finding in itself.' },
  { id:'thermo', title:'Thermoforming, from sheet to part', tag:'Your application',
    points:[
      'Heat, form, cool. Most of the cycle is cooling, so the cooling system is usually the bottleneck — not the heater.',
      'Stretching thins the sheet. Draw ratios above roughly 2:1 need planning: plug assists, pre-stretch, generous corner radii.',
      'PP is cheap, food-safe and tough but low in stiffness with high shrinkage, so temperature control is everything. PET gives clarity but needs drying and careful heat.',
      'Blistering, webbing and mark-off map to heat profile, vacuum timing and mould temperature — in that order, every time.',
      'Wall thickness distribution, not average thickness, decides whether the part survives the pallet. Cut a part in half and measure it.'
    ],
    ask:'A corner keeps thinning until it splits. Name three process changes you would try, in order.',
    new:'Ask to see a rejected part and its cross-section. Learn where your process is thin before you propose anything.' },
  { id:'trim', title:'Thermoforming trim press: faults and first checks', tag:'Your application',
    points:[
      'The trim press cuts the formed web into parts. Most trim faults are registration faults: if the web arrives in the wrong place, a perfect tool still cuts in the wrong place. Check the index length and the chain or pin grip first.',
      'Angel hair and plastic dust mean a blunt or badly set steel-rule die, or a cut that is too fast for a cold web. Look at the cut edge under a light: clean and shiny is good, white and fibrous is a worn or mis-set edge.',
      'Hanging parts (not fully cut) come from uneven die height, a worn cutting plate or low tonnage on one side. Check the same cavity every time before you touch the settings: a pattern points at the tool, random points at the machine.',
      'Web temperature at the press matters. A web that has cooled too far cracks at the cut; one that is still warm stretches and leaves burrs. Note the time from forming to trim when the fault starts.',
      'Never clear a jam with the guard open or the press live. Isolate, lock off, prove dead, then clear. Most trim press injuries happen during a "quick" jam.'
    ],
    ask:'Cavity 3 of 8 keeps leaving a hanging corner. What do you check first, and why that before the press settings?',
    new:'On a line walk, ask how often the trim tools are sharpened or shimmed and where that is recorded. A missing record is a good first improvement.' },
  { id:'spc', title:'SPC and process capability (Cp, Cpk)', tag:'Quality',
    points:[
      'A control chart answers one question: is the process doing anything unusual? Points inside the limits with no pattern mean leave it alone. Adjusting a stable process makes it worse.',
      'Control limits come from the process (about ±3 standard deviations of the data). Specification limits come from the customer. Never draw one and call it the other.',
      'Act on a signal: one point outside a limit, seven points in a row on one side of the centre line, or six rising or falling in a row. Write down what changed at that time.',
      'Cp compares the spec width with the process spread. Cpk also checks centring: it uses the nearer spec limit. Cpk of 1.33 or more is the usual target; under 1.0 means you are making scrap.',
      'Measure before you trust: a gauge that varies more than about 10% of the tolerance hides the real process. Check the gauge, then the chart.'
    ],
    ask:'Wall thickness has Cp 1.6 but Cpk 0.9. What does that tell you, and what is the one change you would make?',
    new:'Ask which dimensions on your line are charted, who looks at the charts, and what happens when a point goes out. If nobody knows, that is the finding.' },
  { id:'loto', title:'Safe isolation: lock out, tag out, prove dead', tag:'Safety',
    points:[
      'Isolation is a sequence, not a switch: tell people, stop the machine normally, isolate every energy source, lock and tag each one with your own lock, then prove it is dead before you touch anything.',
      'Count the energies: electrical, pneumatic, hydraulic, gravity, springs, heat and stored pressure. A packaging line often has electrical plus compressed air plus hot jaws, so one lock is rarely enough.',
      'Prove dead means try to start it, check the air gauge reads zero, bleed stored pressure and support anything that could drop. Only then is it safe.',
      'Your lock, your key, your body. Never let someone else remove your lock and never work under someone else\'s isolation.',
      'Restarting is part of isolation: tools out, guards on, people clear, then remove locks in reverse order and tell everyone before the first cycle.'
    ],
    ask:'You are asked to clear a film jam on a flow wrap "quickly, it\'s only stopped". Walk through exactly what you do.',
    new:'In your first week, ask to be shown the isolation points for your line and practise them once with a supervisor. It also shows you take safety seriously.' },
  { id:'cnc', title:'CNC machining and holding tolerance', tag:'Your experience',
    points:[
      'Cutting speed, feed per tooth, depth of cut. Chipload too small rubs and work-hardens; too large chatters. Listen to the cut before you touch the screen.',
      'Rough to remove material, finish to hit tolerance. Never chase a tolerance with a roughing pass.',
      'Tool wear is gradual until it is sudden. Track part count per tool; a mid-run size drift is nearly always an edge going away.',
      'Calibrate the machine, not just the part: temperature, pressure, cycle time and offsets all drift across a shift.',
      'Measurement itself has error. A micrometer and a calliper disagreeing by 20 microns is information, not a problem.'
    ],
    ask:'A batch runs 30 microns over size after four hours. What are the three most likely causes?',
    new:'Ask which tolerances on your drawings actually matter to function, and which are just habit.' },
  { id:'rotomould', title:'Rotational moulding and cooling', tag:'Your project',
    points:[
      'Powder melts on a hot mould, coats the wall, then the mould cools while still rotating. Cooling is the part of the cycle that decides the properties.',
      'Cooling rate drives crystallinity. Fast cooling gives finer structure and different shrinkage, impact and warpage than slow cooling.',
      'Uneven cooling means uneven shrinkage, and uneven shrinkage means warp. That is why a mould can be perfect and the part still banana.',
      'Your study compared irregular cooling rates against tensile strength, flexibility and durability. That is a process–property link, which is exactly what manufacturing employers want to see.',
      'The write-up matters as much as the test: hypothesis, method, data, conclusion, recommendation. Interviewers ask about the recommendation.'
    ],
    ask:'Explain in 30 seconds why a rotational moulder should care about cooling rate, using your own results.',
    new:'Turn the project into one A4 page: aim, method, one graph, three findings, one recommendation. That page is portfolio item one.' },
  { id:'oee', title:'Line efficiency and OEE that means something', tag:'Operations',
    points:[
      'OEE = availability × performance × quality. One number, three directions to look — never quote it without saying which factor moved.',
      'Availability losses: breakdowns and changeovers. Performance losses: micro-stops and running below rated speed. Quality losses: scrap and rework.',
      'Micro-stops are the invisible majority on packaging lines: jams cleared in under five minutes that nobody records. Start a tally for one shift.',
      '98% line efficiency is a strong claim. Be ready to say exactly how it was measured, over what period, and what counted as downtime.',
      'Improvement order: stop the biggest loss you can measure, not the one that feels most annoying.'
    ],
    ask:'Your line runs at 98% but output is below plan. What is the most likely explanation?',
    new:'Next time you are on a line, write down every stop over two minutes with time and reason. Total it. Bring the number, not the impression.' },
  { id:'smed', title:'Changeovers and SMED', tag:'Operations',
    points:[
      'Split every task into internal (machine stopped) and external (can be done while running). Most changeover time is external work done at the wrong moment.',
      'Prepare the next film, trays and tooling before the last pack. That single habit is usually worth 30–40% of a changeover.',
      'Standardise the sequence and photograph it. A changeover that lives in one person’s head cannot be improved or taught.',
      'Measure from last good pack to first good pack, including the first-pack checks. Anything else flatters the number.',
      'After every changeover, one line in the log: what went wrong. Twelve weeks of that becomes a training document.'
    ],
    ask:'Which three steps of your changeover could be done while the line is still running?',
    new:'Write down each step of the next changeover you watch (no photos unless the site allows them). The list will show you two steps that could be done earlier.' },
  { id:'rca', title:'Root-cause analysis that actually lands', tag:'Engineering practice',
    points:[
      'Contain, correct, prevent — in that order. Stop the bad product first, fix the machine second, change the system third.',
      'Five whys must end at a process cause: no standard, no check, no training, no spare. If it ends at a person, keep going.',
      'Ishikawa’s six branches: machine, method, material, measurement, man, environment. Walk all six before you commit.',
      'Ask the operator who was there, without blame in your voice. The best failure data in any plant is in their memory, not the CMMS.',
      'Close the loop visibly. A fix nobody hears about teaches nobody.'
    ],
    ask:'A fault recurs every Monday morning. Give three hypotheses that are not "operator error".',
    new:'Take one recurring fault from last month and write a one-page A3: what happened, why, what changed, how you will know it worked.' },
  { id:'ppm', title:'PPM and condition monitoring', tag:'Maintenance',
    points:[
      'Reactive, preventive, predictive. The jump to predictive is condition monitoring: vibration, thermography, oil, ultrasonics.',
      'Critical spares are the parts that would stop the line for more than a shift — not every part you have ever replaced.',
      'Ask for the downtime cost per hour. It is the single most useful number a new engineer can learn, because it prices every argument.',
      'Most "electrical faults" are mechanical or human: a loose guard, a worn bearing, a sensor knocked out of line.',
      'A repair that is not recorded is a repair you will make again from scratch. Log it, even badly.'
    ],
    ask:'What would you check first on a bearing that runs hot only on afternoon shift?',
    new:'Ask maintenance for the top three failures last month, with hours lost. Write down the numbers.' },
  { id:'films', title:'Films and polymers for food packaging', tag:'Materials',
    points:[
      'A packaging film is a stack: seal layer, bulk layer, barrier layer, print layer. Each layer does one job, and the seal layer decides your seal window.',
      'Seal initiation temperature, hot-tack and peel strength are three different properties. Buying on price alone usually changes all three.',
      'PET gives strength and clarity, PE gives sealability and toughness, PP gives heat resistance, metallised or EVOH layers give barrier.',
      'Food contact is regulated. Know that migration limits exist and that "it is only packaging" is not a defence.',
      'Sustainability in practice: downgauging, mono-material structures for recyclability, and PCR content — each one changes the seal window.'
    ],
    ask:'Why can a cheaper film cost more per pack than the one you use now?',
    new:'Find out the structure of your main film: layers, thickness, seal layer. Write it on one line.' }
];

