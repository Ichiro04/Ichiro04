/* ============================================================
   CONTENT · IELTS
   ============================================================ */
const CUE_CARDS = [
  { q:'Describe a skill you learned that changed how you work.', bullets:['what the skill is','when and how you learned it','how difficult it was at first','and explain how it changed the way you work'], follow:'Is it better to learn skills at school or on the job?' },
  { q:'Describe a piece of technology you use every day.', bullets:['what it is','how long you have used it','what you use it for','and explain why it matters to you'], follow:'Does technology make people more or less patient?' },
  { q:'Describe a place you go to think clearly.', bullets:['where it is','how often you go there','what you do there','and explain why it helps you think'], follow:'Why do cities need quiet spaces?' },
  { q:'Describe a person who taught you something practical.', bullets:['who they are','what they taught you','how they taught it','and explain why you remember it'], follow:'Are practical teachers valued enough in society?' },
  { q:'Describe a time you had to solve a problem quickly.', bullets:['what the situation was','what you decided to do','what the result was','and explain what you learned'], follow:'Should companies reward people who solve problems fast?' },
  { q:'Describe a goal you are working towards.', bullets:['what the goal is','when you started','what has been difficult','and explain why it matters to you'], follow:'Do written goals actually help people succeed?' },
  { q:'Describe a book or article that changed your mind.', bullets:['what it was about','why you read it','what changed in your thinking','and explain who you would recommend it to'], follow:'Is reading still as important as it was fifty years ago?' },
  { q:'Describe a machine or tool you find impressive.', bullets:['what it is','what it does','where you saw it','and explain why it impresses you'], follow:'Will machines replace most manual work?' },
  { q:'Describe a decision you made that was unpopular.', bullets:['what you decided','why you decided it','how others reacted','and explain whether you would decide the same again'], follow:'Should young people follow advice from older people?' },
  { q:'Describe a period when you were very busy.', bullets:['when it was','what you had to do','how you organised yourself','and explain how you felt afterwards'], follow:'Is being busy a modern status symbol?' },
  { q:'Describe a habit you want to build.', bullets:['what the habit is','what made you want it','how you are starting','and explain what will keep you going'], follow:'How long does it really take to form a habit?' },
  { q:'Describe a city you would like to work in.', bullets:['which city it is','what you know about it','what job you would want there','and explain why it appeals to you'], follow:'What makes a city good for young workers?' }
];
const ESSAY_PROMPTS = [
  { t:'Some people believe university education should be free for everyone. To what extent do you agree or disagree?', type:'Opinion' },
  { t:'In many countries, the number of people living alone is increasing. Why is this happening, and is it a positive or negative development?', type:'Two-part' },
  { t:'Some argue that automation in factories creates more problems than it solves. Discuss both views and give your own opinion.', type:'Discussion' },
  { t:'Cities should spend more money on cycle lanes than on roads for cars. To what extent do you agree or disagree?', type:'Opinion' },
  { t:'Many young people change jobs frequently. What are the causes of this, and what problems can it create?', type:'Cause / effect' },
  { t:'Some people think that governments should require young adults to do a year of national service. Discuss both views.', type:'Discussion' },
  { t:'The rise of distance learning has changed higher education. Do the advantages outweigh the disadvantages?', type:'Advantage' },
  { t:'Some believe that engineers and scientists are more important to society than artists and musicians. To what extent do you agree?', type:'Opinion' },
  { t:'Household waste is increasing in many countries. Why is this, and what can governments and individuals do?', type:'Problem / solution' },
  { t:'Many companies now allow staff to work from home permanently. Is this a positive or negative development?', type:'Positive / negative' }
];
const SPEAKING_PART1 = [
  'Where do you see yourself working in five years?',
  'Did you read much as a child?',
  'What kind of surroundings help you concentrate?',
  'Is there anything you would like to learn to do better?',
  'How do you usually travel around your city?',
  'Do you prefer to make plans or be spontaneous?'
];
const SPEAKING_PART3 = [
  'How has the way people learn new skills changed in your country?',
  'Should employers pay for training? Why?',
  'Is a degree still worth its cost?',
  'What kinds of work will disappear next?',
  'Should people stay in one career for life?',
  'Who should be responsible for reducing waste?'
];
const ESSAY_STRUCTURE = [
  { h:'Introduction', b:'Paraphrase the question. State a clear position in one sentence. Two to three sentences, nothing more.' },
  { h:'Body 1', b:'One central idea, explained and then supported with a specific example. Aim 90–110 words.' },
  { h:'Body 2', b:'A second reason, or the counter-argument you knock back. Acknowledge it, then disagree with reasons.' },
  { h:'Conclusion', b:'Restate your position in different words. No new ideas. Two sentences.' }
];
const BAND7_RULES = [
  'Answer the question that was asked — every paragraph must serve the prompt.',
  'One idea per paragraph, then explain it. Explanation is what examiners pay for.',
  'Use linkers with precision, not decoration: whereas, since, by contrast, as a result.',
  'Vary sentence length. A short sentence after two long ones is a band 7 move.',
  'Write 270–300 words. Below 250 loses marks automatically.',
  'Leave 3 minutes to check verb endings, plurals and articles — your two biggest error sources.',
  'Learn 5 topic-specific collocations per topic (thermal, moulding, membrane, cavity, tolerance).',
  'Never use a word you cannot spell or stress correctly. Accuracy beats ambition.'
];
const WORDS = [
  { w:'iterate', d:'to repeat a process to improve it', ex:'We iterate the design after each test.' },
  { w:'constraint', d:'a limitation that shapes a solution', ex:'Cost is the main constraint in this redesign.' },
  { w:'throughput', d:'the amount produced in a given time', ex:'Automation lifted throughput by 18%.' },
  { w:'tolerance', d:'the permitted variation from a spec', ex:'The bore must be machined to a tight tolerance.' },
  { w:'mitigate', d:'to make something less severe', ex:'Dust extraction mitigates a health risk.' },
  { w:'scalable', d:'able to grow without breaking', ex:'The process is scalable to three shifts.' },
  { w:'robust', d:'strong and reliable in adverse conditions', ex:'A robust design tolerates operator variation.' },
  { w:'adherence', d:'sticking closely to a standard', ex:'Adherence to the standard reduced scrap.' },
  { w:'yield', d:'the proportion of good parts produced', ex:'Yield improved after we cleaned the heater.' },
  { w:'redundancy', d:'backup capacity in case of failure', ex:'The sensor has redundancy built in.' },
  { w:'bottleneck', d:'the step that limits overall output', ex:'Cooling, not forming, is our bottleneck.' },
  { w:'defect', d:'a fault that makes a part non-conforming', ex:'Thinning at the corner caused the defect.' }
];
