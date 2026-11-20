/* ============================================================
   CONTENT · training plan (no equipment, full body)
   ============================================================ */
const EX = {
  squat:      { name:'Bodyweight squat',        reps:'12–15',  rest:60, cue:'Feet shoulder-width, toes out slightly. Sit between your heels, chest tall, knees track over the toes. Slow down (3s), normal up.' },
  splitSquat: { name:'Split squat',             reps:'8–10 /leg', rest:60, cue:'Long stance, back heel lifted. Drop straight down until the back knee nearly touches. Hold a wall for balance if needed.' },
  rfess:      { name:'Rear-foot-elevated squat',reps:'8–10 /leg', rest:75, cue:'Back foot on a chair or bed edge. Front shin vertical, torso slightly forward. This is your hardest leg move — stay controlled.' },
  pushup:     { name:'Push-up',                 reps:'6–12',   rest:60, cue:'Hands under shoulders, body one straight line, elbows at 45°. Too hard? Hands on a worktop. Too easy? Feet on a chair.' },
  invert:     { name:'Incline push-up',         reps:'10–15',  rest:45, cue:'Hands on the kitchen counter. Squeeze glutes so the hips do not sag. Lower chest to the counter, then push the floor away.' },
  pike:       { name:'Pike push-up',            reps:'6–10',   rest:75, cue:'Hips high in an inverted V. Lower the crown of your head toward the floor between your hands. Builds shoulders for overhead work.' },
  row:        { name:'Towel row under a table', reps:'8–12',   rest:60, cue:'Lie under a sturdy table, grip the edge, pull your chest to it. Squeeze shoulder blades, do not shrug. Use a table that cannot tip.' },
  bridge:     { name:'Glute bridge',            reps:'15–20',  rest:45, cue:'Heels close to your backside. Drive through the heels, squeeze glutes at the top for 2 seconds. Ribs down, do not arch the lower back.' },
  hinge:      { name:'Single-leg hip hinge',    reps:'10 /leg', rest:45, cue:'Soft knees, push the hips back, back flat. Feel the hamstring stretch, then stand up by squeezing the glute.' },
  superman:   { name:'Superman hold',           reps:'3 × 20s', rest:45, cue:'Face down, lift chest and thighs. Squeeze glutes, keep the neck long. Strengthens the whole back chain.' },
  hollow:     { name:'Hollow hold',             reps:'20–30s', rest:45, cue:'Lower back pressed to the floor, ribs down, legs straight and lifted. Shake = working. Back pain = stop and tuck your knees.' },
  plank:      { name:'Plank',                   reps:'30–45s', rest:45, cue:'Elbows under shoulders, glutes and abs tight, no sagging hips. Breathe through it, do not hold your breath.' },
  wallsit:    { name:'Wall sit',                reps:'30–45s', rest:45, cue:'Thighs parallel to the floor, back flat on the wall. Finisher — this is where the legs actually grow.' },
  climbers:   { name:'Mountain climbers',       reps:'30s',    rest:40, cue:'Slow and controlled beats fast and sloppy. Hips low, drive one knee at a time.' },
  burpee:     { name:'Burpee (step-back)',      reps:'8–10',   rest:60, cue:'Step back instead of jumping to keep the knees happy. Add a jump at the top only when you feel fresh.' },
  jumpSquat:  { name:'Squat jump',              reps:'10',     rest:60, cue:'Land soft, knees bent, chest up. Quality over height — stop the set when the landings get loud.' },
  taps:       { name:'Plank shoulder taps',     reps:'20 total', rest:40, cue:'Feet wide for stability. Tap slowly, resist the hips twisting.' },
  carry:      { name:'Loaded bag carry',        reps:'2 × 40s', rest:60, cue:'A rucksack with books or shopping. Walk tall, ribs stacked over hips, grip hard.' },
  deadbug:    { name:'Dead bug',                reps:'10 /side', rest:40, cue:'Lower back glued to the floor. Opposite arm and leg extend slowly. Exhale as you reach.' },
  catcow:     { name:'Cat–cow + thread the needle', reps:'2 min', rest:0, cue:'Breathe into your ribs. Move slowly, that is the whole point.' },
  hips:       { name:'90/90 hip switch',        reps:'2 min',  rest:0, cue:'Both knees at 90°. Rock side to side without using your hands.' },
  calf:       { name:'Calf + ankle rocks',      reps:'2 min',  rest:0, cue:'Knee over toes, heel down. Ankles are what give you a deeper squat.' }
};

const SESSIONS = {
  A: { id:'A', day:'Full body A · legs + pull', tag:'Strength', mins:40, blocks:[
        { ex:'squat', sets:3 }, { ex:'splitSquat', sets:3 }, { ex:'row', sets:3 },
        { ex:'invert', sets:3 }, { ex:'bridge', sets:3 }, { ex:'hollow', sets:3 }, { ex:'wallsit', sets:2 } ] },
  B: { id:'B', day:'Full body B · push + hinge', tag:'Strength', mins:40, blocks:[
        { ex:'pushup', sets:3 }, { ex:'pike', sets:3 }, { ex:'hinge', sets:3 },
        { ex:'rfess', sets:3 }, { ex:'superman', sets:3 }, { ex:'plank', sets:3 }, { ex:'calf', sets:1 } ] },
  C: { id:'C', day:'Conditioning circuit', tag:'Conditioning', mins:30, blocks:[
        { ex:'jumpSquat', sets:3 }, { ex:'pushup', sets:3 }, { ex:'splitSquat', sets:3 },
        { ex:'taps', sets:3 }, { ex:'climbers', sets:3 }, { ex:'burpee', sets:2 }, { ex:'carry', sets:2 } ] },
  WALK: { id:'WALK', day:'Walk + mobility', tag:'Recovery', mins:25, blocks:[
        { ex:'catcow', sets:1 }, { ex:'hips', sets:1 }, { ex:'calf', sets:1 }, { ex:'deadbug', sets:2 } ] },
  REST: { id:'REST', day:'Full rest', tag:'Rest', mins:0, blocks:[] }
};
const WEEK_PLAN = ['A','B','WALK','A','B','C','REST']; // Mon..Sun
function todaysSession(d=new Date()){
  const id = WEEK_PLAN[isoWeekday(d)];
  return SESSIONS[id] || SESSIONS.REST;
}

