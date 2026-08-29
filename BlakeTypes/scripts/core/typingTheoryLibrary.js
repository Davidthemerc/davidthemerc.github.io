export const THEORY_CATEGORIES = [
  { id: "foundations", label: "Foundations", icon: "⌨" },
  { id: "measurement", label: "Measurement", icon: "↗" },
  { id: "technique", label: "Technique", icon: "✋" },
  { id: "special", label: "Special Skills", icon: "#" },
  { id: "practice", label: "Practice & Comfort", icon: "◌" },
  { id: "system", label: "Using HyperSoft", icon: "H" }
];

export const THEORY_TOPICS = [
  {
    id: "touchTyping", number: "01", category: "foundations", title: "Touch Typing & Home Position", icon: "FJ",
    summary: "Why touch typing is a location-and-movement skill rather than a memory contest.",
    why: "Looking away from the keyboard lets your visual attention stay on the source while your hands use a stable internal map. That reduces search time and makes errors easier to notice in context.",
    principles: [
      "Use F and J as tactile anchors. Their raised marks let the index fingers find home position without visual searching.",
      "Home row is a reference point, not a rule that every finger must remain planted between every keystroke.",
      "Return toward a neutral hand position after reaches so the next movement begins from a predictable place.",
      "Touch typing becomes reliable through repeated correct movements, not by forcing speed before the keyboard map feels stable."
    ],
    example: { label: "Movement example", body: "Typing the word “draft” uses several different reaches, but the useful habit is that each finger knows its zone and the hand returns toward a familiar center instead of drifting across the board." },
    mistake: "A common beginner trap is memorizing key names while still visually hunting for them. Knowing that R is on the top row is different from being able to reach R automatically.",
    connection: "Keyboard Trainee teaches the map first; formal Lessons then turn that map into progressively longer movement sequences.",
    related: [{ label: "Open Keyboard Trainee", screen: "trainee" }, { label: "Open Lessons", screen: "lessons" }],
    quiz: { question: "What is the main purpose of home row in touch typing?", options: ["It is the only row you should type from", "It gives the hands a repeatable reference position", "It is where the fastest letters are located"], answer: 1, explanation: "Home row is a positional reference. Fingers leave it constantly, but a stable reference makes those reaches repeatable." }
  },
  {
    id: "fingerZones", number: "02", category: "foundations", title: "Finger Zones & Keyboard Geography", icon: "✋",
    summary: "How consistent finger assignments reduce search, hand drift, and unnecessary motion.",
    why: "The value of finger zones is consistency. If the same key is reached by a different finger every time, the brain has to make a fresh movement decision instead of recalling a practiced pattern.",
    principles: [
      "The index fingers cover the widest letter zones; the little fingers handle many edge keys and modifiers.",
      "Use small finger and hand movements instead of lifting the entire arm for ordinary letter reaches.",
      "A repeated awkward key is usually better solved by improving its assigned movement than by inventing a new finger each time.",
      "Individual anatomy varies. Comfortable, repeatable movement matters more than rigidly forcing a painful reach."
    ],
    example: { label: "Why consistency helps", body: "If T is always reached with the left index finger, the T-to-R, T-to-H, and T-to-Y transitions can each become stored movement patterns. Randomly changing the finger breaks that learning." },
    mistake: "Using whichever finger happens to be closest can feel fast during easy words but often creates a ceiling when text becomes less predictable.",
    connection: "Smart Practice and Trouble-Pair Clinic analyze repeated transitions, which becomes much more meaningful when finger choices are consistent.",
    related: [{ label: "Finger-Zone Trainee Station", screen: "trainee" }, { label: "Open Smart Practice", screen: "smartPractice" }],
    quiz: { question: "Why does HyperSoft encourage consistent finger assignments?", options: ["To make every finger equally strong", "To build repeatable motor patterns", "To keep the hands completely still"], answer: 1, explanation: "The same key-to-finger mapping lets repeated transitions become automatic instead of being re-planned each time." }
  },
  {
    id: "accuracySpeed", number: "03", category: "measurement", title: "Accuracy Before Speed", icon: "✓",
    summary: "Why practicing clean movement usually raises sustainable speed better than rehearsing mistakes quickly.",
    why: "Motor practice is indifferent to whether the repeated sequence is correct. If you repeatedly mistype the same transition at high speed, you are rehearsing the error pattern too.",
    principles: [
      "First-attempt accuracy reveals whether the intended movement was correct before correction behavior hides it.",
      "Slow down enough to preserve the right movement, then let speed rise as hesitation falls.",
      "A fast burst followed by corrections may produce an impressive momentary pace but poor usable output.",
      "Accuracy targets are practice constraints, not moral judgments or lockouts."
    ],
    example: { label: "Two 50-WPM typists", body: "A typist at 50 WPM and 99% accuracy usually produces more usable text than one at 50 WPM and 92% accuracy because the second typist spends more attention repairing output." },
    mistake: "Trying to solve an accuracy problem by pushing harder on WPM usually increases tension and reinforces the exact errors that need remediation.",
    connection: "Accuracy Clinic isolates clean first attempts, substitution patterns, and controlled-speed work when ordinary WPM practice is not enough.",
    related: [{ label: "Open Accuracy Clinic", screen: "accuracyClinic" }, { label: "Open Technique Coach", screen: "technique" }],
    quiz: { question: "Why can slowing down temporarily improve long-term speed?", options: ["It reduces the number of keys on the keyboard", "It lets correct movement patterns repeat reliably", "It changes how WPM is calculated"], answer: 1, explanation: "Reliable repetitions reduce future hesitation. Sustainable speed is largely the result of less decision time between correct movements." }
  },
  {
    id: "wpmMath", number: "04", category: "measurement", title: "WPM, Gross WPM & Adjusted WPM", icon: "WPM",
    summary: "What common typing-speed numbers actually measure and why the formulas are not interchangeable.",
    why: "A speed number is only useful when you know what it represents. Different tests may report raw pace, pace after error penalties, or a simplified live estimate.",
    principles: [
      "Traditional WPM usually treats five typed characters as one standardized word.",
      "Gross WPM measures raw character production over time before an error penalty.",
      "Adjusted or Net WPM subtracts an error penalty from gross speed; exact formulas can vary by test provider.",
      "Accuracy is reported separately because two tests with the same adjusted WPM can still have very different error patterns."
    ],
    example: { label: "HyperSoft Timed Test example", body: "250 attempted characters in one minute equals 50 Gross WPM using the five-character convention. With five raw errors and HyperSoft’s current one-error-per-minute penalty, the result is 45 Adjusted WPM." },
    mistake: "Comparing a live lesson WPM estimate directly with another program’s certified net-WPM score can be misleading if their timing and error rules differ.",
    connection: "Timed Tests exposes Gross WPM, Adjusted WPM, raw errors, and accuracy together so the result is interpretable instead of being one unexplained number.",
    related: [{ label: "Open Timed Tests", screen: "certification" }, { label: "View Progress", screen: "progress" }],
    quiz: { question: "Using the five-character convention, 300 typed characters in 2 minutes equals what Gross WPM?", options: ["20", "30", "60"], answer: 1, explanation: "300 ÷ 5 = 60 standardized words; 60 ÷ 2 minutes = 30 Gross WPM." }
  },
  {
    id: "rhythm", number: "05", category: "technique", title: "Rhythm, Hesitation & Flow", icon: "♪",
    summary: "Why even timing often matters more than dramatic short bursts of speed.",
    why: "Typing is a sequence of small movements. A relatively even cadence reduces stop-start decision making and tends to survive longer passages better than repeated sprints and stalls.",
    principles: [
      "Rhythm does not mean every interval is identical; natural language creates small timing changes.",
      "Long pauses often reveal uncertainty about a key, transition, punctuation mark, or upcoming word shape.",
      "A sustainable pace should survive beyond the first easy sentence.",
      "Technique Coach compares timing evidence and sustained phases because peak speed alone can hide hesitation."
    ],
    example: { label: "Burst versus flow", body: "Typing six words extremely fast, pausing to locate punctuation, then sprinting again can produce the same average WPM as a smooth typist—but the second pattern is usually easier to sustain and correct." },
    mistake: "Treating every pause as failure can create tension. The goal is to identify repeated hesitation patterns, not eliminate normal variation in human movement.",
    connection: "Hand Alternation, Assessment rhythm scoring, and Technique Coach all look at cadence from different angles.",
    related: [{ label: "Open Technique Coach", screen: "technique" }, { label: "Open Smart Practice", screen: "smartPractice" }],
    quiz: { question: "What does a repeated long pause before the same punctuation key most likely indicate?", options: ["A useful hesitation pattern to investigate", "Proof that WPM is calculated incorrectly", "That punctuation should be ignored"], answer: 0, explanation: "Repeated hesitation around the same movement is useful diagnostic evidence and can guide targeted practice." }
  },
  {
    id: "muscleMemory", number: "06", category: "technique", title: "Motor Memory & Deliberate Practice", icon: "∞",
    summary: "What people casually call muscle memory, and how practice quality changes what becomes automatic.",
    why: "The fingers do not literally store a word. Repeated movement sequences become easier for the nervous system to plan and execute, reducing conscious attention for familiar patterns.",
    principles: [
      "Short, accurate repetitions are often more useful than long sessions performed while tired and sloppy.",
      "Practice should be difficult enough to require attention but not so difficult that nearly every attempt fails.",
      "Weak keys and trouble pairs benefit from focused repetition followed by normal mixed text so the movement transfers back into real typing.",
      "Rest matters. Learning is not proportional to the number of minutes spent hammering the same error."
    ],
    example: { label: "Target then transfer", body: "A learner might spend several minutes on TR and ER transitions, then finish with ordinary business prose. The targeted block builds the movement; the mixed block checks whether it survives outside the drill." },
    mistake: "Repeating a difficult sequence hundreds of times at a speed that produces constant errors can make the bad sequence more familiar rather than fixing it.",
    connection: "Daily Plan deliberately mixes remediation, curriculum, applied work, and benchmarks instead of prescribing one endless drill.",
    related: [{ label: "Open Daily Plan", screen: "dailyPlan" }, { label: "Open Practice Builder", screen: "customPractice" }],
    quiz: { question: "What is the best use of a targeted weak-key drill?", options: ["Repeat errors as fast as possible", "Practice the movement cleanly, then test it in mixed text", "Avoid the weak key afterward"], answer: 1, explanation: "Targeted repetition builds the movement; mixed practice confirms that the movement transfers into ordinary typing." }
  },
  {
    id: "shiftPunctuation", number: "07", category: "special", title: "Shift, Capitals & Punctuation", icon: "⇧",
    summary: "How modifiers and symbols become part of fluent touch typing instead of interruptions.",
    why: "A typist who can handle letters quickly but has to stop and search for Shift, apostrophes, quotation marks, slashes, or symbols will lose rhythm whenever real text becomes structured.",
    principles: [
      "When practical, use the Shift key opposite the hand typing the capital letter.",
      "Release Shift promptly after the capital or symbol instead of carrying it into the next character.",
      "Learn punctuation as physical movements within the keyboard map, not as visual exceptions.",
      "Business text, email addresses, paths, URLs, and numbers make symbol fluency part of ordinary typing skill."
    ],
    example: { label: "Opposite-hand Shift", body: "For a capital T, the left index finger reaches T while the right little finger can hold Shift. That lets the typing hand keep its normal letter movement." },
    mistake: "Using the same hand for Shift and the capital letter can force an awkward stretch and temporarily pull that hand away from its normal position.",
    connection: "Punctuation & Business Writing Lab measures symbol accuracy separately so strong letter accuracy cannot hide repeated symbol errors.",
    related: [{ label: "Open Punctuation Lab", screen: "punctuation" }, { label: "Open Real-World Lab", screen: "realWorld" }],
    quiz: { question: "For a capital typed with the left hand, which Shift is generally preferred when practical?", options: ["Left Shift", "Right Shift", "Caps Lock every time"], answer: 1, explanation: "Opposite-hand Shift lets the letter hand perform its normal reach while the other hand supplies the modifier." }
  },
  {
    id: "tenKeyTheory", number: "08", category: "special", title: "10-Key Theory & KPH", icon: "#",
    summary: "Why numeric-keypad training uses a different home position, finger map, and speed metric.",
    why: "Numeric entry is a specialized movement system. Treating it as ordinary top-row typing misses the advantage of a compact keypad designed for repetitive numbers.",
    principles: [
      "The conventional 10-key home row is 4-5-6, with the tactile marker commonly on 5.",
      "Index normally covers 1/4/7, middle covers 2/5/8, ring covers 3/6/9, and the thumb handles 0.",
      "KPH—keystrokes per hour—is commonly more meaningful for sustained numeric entry than prose WPM.",
      "Decimal placement and Enter rhythm deserve the same accuracy attention as digits."
    ],
    example: { label: "Why KPH stays separate", body: "A learner can become very fast at repetitive numeric entry without that number meaning they can write prose at an equivalent WPM. HyperSoft therefore keeps KPH out of ordinary WPM trends." },
    mistake: "Looking down for every number defeats much of the keypad’s efficiency. Use the 5-key marker and the 4-5-6 home position to re-orient by touch.",
    connection: "10-Key Academy tracks KPH, Numpad use, numeric-key reliability, decimal control, and a dedicated two-minute proficiency test.",
    related: [{ label: "Open 10-Key Academy", screen: "tenKey" }, { label: "Open Forms Lab", screen: "realWorld" }],
    quiz: { question: "What is the conventional numeric-keypad home row?", options: ["1-2-3", "4-5-6", "7-8-9"], answer: 1, explanation: "4-5-6 centers the right hand on the keypad; the 5 key often has a tactile marker for orientation." }
  },
  {
    id: "realWorld", number: "09", category: "special", title: "Real-World Typing & Transcription", icon: "▤",
    summary: "Why realistic structured material exposes weaknesses that word lists may not reveal.",
    why: "Everyday typing includes formatting decisions and awkward characters: names, dates, email addresses, reference numbers, file paths, punctuation, and line breaks. Those transitions can interrupt a typist who looks strong on simple prose.",
    principles: [
      "Exact-entry practice trains attention to structure as well as characters.",
      "Addresses, IDs, filenames, and numeric fields deserve extra precision because one character can change the meaning of a record.",
      "Sustained document transcription tests whether technique survives beyond short isolated drills.",
      "Practice data should be fictional or approved training material rather than unnecessary real confidential information."
    ],
    example: { label: "Structured-data example", body: "Typing `m.hill-rivera@example.org` requires letters, punctuation, Shift-independent symbols, and exact order. It tests a different skill mix than typing the word `river` repeatedly." },
    mistake: "Assuming a good WPM on easy prose guarantees equally fluent work with URLs, currency, dates, and form fields.",
    connection: "Real-World Lab provides fictional email, memo, contact, file/web, form, and transcription simulations while feeding adaptive error history.",
    related: [{ label: "Open Real-World Lab", screen: "realWorld" }, { label: "Open Practice Builder", screen: "customPractice" }],
    quiz: { question: "Why can realistic structured text be harder than ordinary prose at the same apparent length?", options: ["It contains more movement types and exact symbols", "It disables touch typing", "It always uses longer words"], answer: 0, explanation: "Structured text mixes letters with punctuation, digits, symbols, and formatting, creating more varied transitions." }
  },
  {
    id: "ergonomics", number: "10", category: "practice", title: "Ergonomics Fundamentals", icon: "▣",
    summary: "Comfortable keyboard setup, neutral movement, and practical limits of typing-posture advice.",
    why: "A neutral, comfortable setup reduces unnecessary strain and makes repeated movement easier to sustain. Ergonomics should support typing practice, not become a rigid posture contest.",
    principles: [
      "Keep shoulders relaxed and elbows reasonably close to the body.",
      "Position the keyboard so you are not continuously reaching, twisting, or sharply bending the wrists.",
      "Use light key pressure. Modern keyboards do not require forceful strikes.",
      "Change position and take breaks during long sessions. Persistent pain, numbness, or weakness is a reason to stop and seek appropriate professional guidance rather than train through it."
    ],
    example: { label: "Useful adjustment", body: "If the keyboard is so high that the shoulders remain shrugged during every session, lowering the keyboard or adjusting the chair can make neutral movement easier before any technique drill begins." },
    mistake: "Treating one exact wrist angle or chair position as universally correct. Body proportions, equipment, and accessibility needs vary.",
    connection: "Keyboard Trainee starts with workstation setup because speed practice is not useful if the physical setup makes ordinary movement uncomfortable.",
    related: [{ label: "Review Workstation Setup", screen: "trainee" }, { label: "Open Daily Plan", screen: "dailyPlan" }],
    quiz: { question: "Which is the best general ergonomics goal for typing?", options: ["A comfortable neutral setup with relaxed movement", "Keeping the wrists locked in one exact angle", "Striking every key firmly"], answer: 0, explanation: "Ergonomics should support comfortable, repeatable movement. There is no single rigid pose that fits every person and setup." }
  },
  {
    id: "practiceDesign", number: "11", category: "practice", title: "Practice Design, Rest & Progress", icon: "☷",
    summary: "How to combine targeted drills, formal progression, applied work, and benchmarks without overtraining one metric.",
    why: "Typing improves across several dimensions at once: keyboard coverage, precision, rhythm, endurance, symbols, numeric work, and real-world application. A good practice plan rotates those goals instead of chasing one number every day.",
    principles: [
      "Use remediation when the data shows a specific problem; otherwise continue broad curriculum and applied practice.",
      "Short daily sessions can be more sustainable than rare marathon sessions.",
      "Benchmarks measure progress; they are not a substitute for practice.",
      "When performance deteriorates sharply from fatigue, more repetitions may be less useful than stopping and returning later."
    ],
    example: { label: "Balanced 20-minute session", body: "Five minutes of accuracy repair, five minutes on the next formal lesson, five minutes of applied transcription, then a short benchmark provides more varied evidence than twenty minutes of repeatedly chasing a personal-best WPM." },
    mistake: "Retaking a speed test over and over can improve familiarity with testing without addressing the movement or accuracy problem that limits the result.",
    connection: "Daily Training Plan uses the learner profile to choose remediation, progression, application, numeric rotation, and benchmarking in proportion to current needs.",
    related: [{ label: "Open Daily Plan", screen: "dailyPlan" }, { label: "Open Timed Tests", screen: "certification" }],
    quiz: { question: "What is the best role for a timed benchmark in a training plan?", options: ["It should replace normal practice", "It should periodically measure what practice has produced", "It should be repeated until the score improves"], answer: 1, explanation: "Benchmarks are measurements. Improvement is usually built in lessons, drills, remediation, and applied work between tests." }
  },
  {
    id: "hyperSoftMap", number: "12", category: "system", title: "How HyperSoft Fits Together", icon: "H",
    summary: "A map of the suite: where to start, what each subsystem measures, and when to use it.",
    why: "HyperSoft has grown into a full training suite. Knowing which subsystem answers which question prevents random module-hopping and helps the learner use the data intentionally.",
    principles: [
      "Keyboard Trainee teaches fundamentals; Assessment estimates placement; Technique Coach interprets evidence.",
      "Lessons build progressive coverage; Smart Practice and Practice Builder target specific movements; Accuracy and Punctuation Labs remediate precision problems.",
      "10-Key Academy is a separate numeric branch; Real-World Lab checks applied typing; Timed Tests provide repeatable benchmarks.",
      "Daily Plan is the coordinator. Progress, Reports, Achievements, and Scoreboard document what happened rather than teaching the movement themselves."
    ],
    example: { label: "A sensible learner path", body: "New learner → Keyboard Trainee → Assessment → formal Lessons. As evidence accumulates, Technique Coach and Daily Plan can route specific problems into Smart Practice, Accuracy Clinic, Punctuation Lab, 10-Key, or Real-World work before a new Timed Test benchmark." },
    mistake: "Jumping only between Arcade and Timed Tests can be fun, but it provides less structured remediation than using the diagnostic and practice modules that explain why a score is stuck.",
    connection: "This Learning Center is the reference layer; the Daily Plan is the execution layer; Progress and Reports are the documentation layer.",
    related: [{ label: "Open Daily Plan", screen: "dailyPlan" }, { label: "Open Assessment", screen: "assessment" }, { label: "Open Progress", screen: "progress" }],
    quiz: { question: "Which HyperSoft module is intended to coordinate a personalized sequence across other modules?", options: ["Daily Training Plan", "Scoreboard", "Blake's Office"], answer: 0, explanation: "Daily Plan reads evidence from across the suite and assembles a guided sequence; the other modules have different roles." }
  }
];

export const THEORY_GLOSSARY = [
  ["Accuracy", "Correct first-attempt keystrokes divided by total first-attempt keystrokes, expressed as a percentage."],
  ["Adjusted WPM", "A timed-test speed after the test's defined error penalty is subtracted from Gross WPM."],
  ["Clean Streak", "Consecutive correct first-attempt characters before the next error or correction attempt."],
  ["Gross WPM", "Raw typing rate using the conventional five-character standardized word before error deductions."],
  ["Home Row", "The reference position ASDF / JKL; for letters, and 4-5-6 for conventional numeric-keypad technique."],
  ["KPH", "Keystrokes Per Hour, a common numeric data-entry speed metric kept separate from prose WPM in HyperSoft."],
  ["Motor Memory", "A shorthand for movement patterns becoming easier to plan and execute through repeated practice."],
  ["Trouble Pair", "A repeated two-letter transition whose first-attempt accuracy is weaker than the learner's surrounding performance."],
  ["Weak Key", "A key with enough recorded attempts to show a repeatable accuracy problem rather than a single isolated miss."],
  ["WPM", "Words Per Minute; commonly standardized as typed characters divided by five and then divided by elapsed minutes."]
];

export function normalizeTheoryProgress(value) {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const validIds = new Set(THEORY_TOPICS.map(topic => topic.id));
  const clean = {};
  Object.entries(raw).forEach(([id, row]) => {
    if (!validIds.has(id) || !row || typeof row !== "object" || Array.isArray(row)) return;
    clean[id] = {
      reviewed: row.reviewed === true,
      quizCorrect: row.quizCorrect === true,
      quizAttempts: Math.max(0, Math.min(99, Math.floor(Number(row.quizAttempts) || 0))),
      lastReviewedAt: Math.max(0, Number(row.lastReviewedAt) || 0)
    };
  });
  return clean;
}

export function getTheoryProgressSummary(progress) {
  const clean = normalizeTheoryProgress(progress);
  const reviewed = THEORY_TOPICS.filter(topic => clean[topic.id]?.reviewed).length;
  const quizCorrect = THEORY_TOPICS.filter(topic => clean[topic.id]?.quizCorrect).length;
  return {
    total: THEORY_TOPICS.length,
    reviewed,
    quizCorrect,
    reviewedPercent: THEORY_TOPICS.length ? Math.round((reviewed / THEORY_TOPICS.length) * 100) : 0,
    complete: reviewed === THEORY_TOPICS.length
  };
}
