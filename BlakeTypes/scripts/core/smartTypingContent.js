import { WORD_LISTS } from "./config.js";

const LEFT_HAND = new Set("qwertasdfgzxcvb".split(""));
const RIGHT_HAND = new Set("yuiophjklnm".split(""));
const ROWS = {
  top: new Set("qwertyuiop".split("")),
  home: new Set("asdfghjkl".split("")),
  bottom: new Set("zxcvbnm".split(""))
};
const FINGERS = {
  q: "LP", a: "LP", z: "LP",
  w: "LR", s: "LR", x: "LR",
  e: "LM", d: "LM", c: "LM",
  r: "LI", f: "LI", v: "LI", t: "LI", g: "LI", b: "LI",
  y: "RI", h: "RI", n: "RI", u: "RI", j: "RI", m: "RI",
  i: "RM", k: "RM",
  o: "RR", l: "RR",
  p: "RP"
};

export const DEFAULT_TROUBLE_PAIRS = [
  "th", "he", "er", "re", "st", "tr", "pr", "br", "gr", "cl", "cr", "pl",
  "sp", "nt", "nd", "rt", "ty", "io", "ou", "ed", "de", "rf", "fr", "uj", "ju"
];

export const SMART_PRACTICE_MODES = [
  {
    id: "smartShortBurst",
    number: "Smart Drill",
    category: "Targeted Practice Lab",
    title: "Short-Word Burst",
    subtitle: "Fast three-to-five-letter vocabulary for rhythm, common reaches, and clean Space timing.",
    tags: ["Short Words", "Rhythm", "Speed"],
    source: "smart",
    smartStrategy: "short",
    baseWords: 92,
    targetWpm: 38,
    targetAccuracy: 95,
    isSmartPractice: true,
    guide: [
      "The generator favors alphabetic words between three and five letters.",
      "Short words make Space timing and transition rhythm more important than visual decoding.",
      "Keep your eyes one or two tokens ahead instead of staring at individual letters.",
      "The selected vocabulary family still influences which words are chosen.",
      "Smart Practice sessions are recorded separately from the 14-course curriculum targets."
    ]
  },
  {
    id: "smartLongControl",
    number: "Smart Drill",
    category: "Targeted Practice Lab",
    title: "Long-Word Control",
    subtitle: "Longer alphabetic words chosen for sustained reach accuracy instead of raw speed.",
    tags: ["Long Words", "Control", "Endurance"],
    source: "smart",
    smartStrategy: "long",
    baseWords: 72,
    targetWpm: 34,
    targetAccuracy: 96,
    isSmartPractice: true,
    guide: [
      "The generator strongly favors words nine letters or longer.",
      "Long words expose drifting hand position and rushed mid-word transitions.",
      "Prioritize a smooth cadence over an early speed burst.",
      "Hyphenated vocabulary is excluded so this remains a letter-control drill.",
      "Use Long-Word Control when speed is rising faster than accuracy."
    ]
  },
  {
    id: "smartDifficult",
    number: "Smart Drill",
    category: "Targeted Practice Lab",
    title: "Difficult-Word Clinic",
    subtitle: "Words ranked by keyboard complexity: length, row travel, and awkward finger transitions.",
    tags: ["Difficult Words", "Geometry", "Accuracy"],
    source: "smart",
    smartStrategy: "difficult",
    baseWords: 76,
    targetWpm: 32,
    targetAccuracy: 96,
    isSmartPractice: true,
    guide: [
      "This drill ranks words by typing difficulty rather than simply by character count.",
      "Longer words score higher, but row changes and same-finger transitions also raise keyboard complexity.",
      "A shorter awkward word can therefore outrank an easy long word.",
      "Slow down enough to preserve clean movement through the hardest transitions.",
      "The classifier is deterministic and runs entirely on the vocabulary already stored in the application."
    ]
  },
  {
    id: "smartLeftHand",
    number: "Smart Drill",
    category: "Targeted Practice Lab",
    title: "Left-Hand Isolation",
    subtitle: "Words composed almost entirely from the left side of a QWERTY keyboard.",
    tags: ["Left Hand", "Isolation", "Finger Control"],
    source: "smart",
    smartStrategy: "left",
    baseWords: 76,
    targetWpm: 28,
    targetAccuracy: 95,
    isSmartPractice: true,
    guide: [
      "The preferred pool uses only left-hand letters: QWERT, ASDFG, and ZXCVB.",
      "If the chosen vocabulary family has too few pure left-hand words, the generator falls back to strongly left-heavy words.",
      "Keep the right hand parked instead of letting it chase letters across the keyboard.",
      "This drill is useful when left-side heatmap keys lag behind the right side.",
      "Speed targets are deliberately lower because isolation vocabulary is more constrained."
    ]
  },
  {
    id: "smartRightHand",
    number: "Smart Drill",
    category: "Targeted Practice Lab",
    title: "Right-Hand Isolation",
    subtitle: "Words composed almost entirely from the right side of a QWERTY keyboard.",
    tags: ["Right Hand", "Isolation", "Finger Control"],
    source: "smart",
    smartStrategy: "right",
    baseWords: 76,
    targetWpm: 28,
    targetAccuracy: 95,
    isSmartPractice: true,
    guide: [
      "The preferred pool uses only right-hand letters: YUIOP, HJKL, and NM.",
      "If the vocabulary family is too restrictive, strongly right-heavy words are used instead.",
      "Keep the left hand anchored and resist compensating for an awkward reach with the wrong hand.",
      "Compare this drill with Left-Hand Isolation to spot a side-to-side imbalance.",
      "Accuracy matters more than forcing a high WPM in a constrained word pool."
    ]
  },
  {
    id: "smartAlternation",
    number: "Smart Drill",
    category: "Targeted Practice Lab",
    title: "Hand Alternation",
    subtitle: "Words with frequent left-right hand changes to build a smoother two-hand cadence.",
    tags: ["Alternating Hands", "Cadence", "Coordination"],
    source: "smart",
    smartStrategy: "alternating",
    baseWords: 84,
    targetWpm: 36,
    targetAccuracy: 95,
    isSmartPractice: true,
    guide: [
      "Words are scored by how often consecutive letters switch hands.",
      "The generator prefers words where at least roughly seventy percent of transitions alternate sides.",
      "Let the hands trade work instead of trying to make one hand lead every word.",
      "Alternating-hand vocabulary is especially useful for building a steady rhythm.",
      "The pool is generated from the vocabulary already shipped with the suite."
    ]
  },
  {
    id: "smartSameFinger",
    number: "Smart Drill",
    category: "Targeted Practice Lab",
    title: "Same-Finger Clinic",
    subtitle: "Words containing awkward consecutive reaches assigned to the same finger.",
    tags: ["Same Finger", "Transitions", "Accuracy"],
    source: "smart",
    smartStrategy: "sameFinger",
    baseWords: 78,
    targetWpm: 30,
    targetAccuracy: 96,
    isSmartPractice: true,
    guide: [
      "The analyzer maps QWERTY letters to their conventional touch-typing fingers.",
      "Words are favored when adjacent letters ask the same finger to move twice in succession.",
      "Do not compensate by using a neighboring finger simply to move faster.",
      "A clean same-finger transition is more valuable here than an inflated WPM.",
      "These transitions often feel slower even for otherwise strong typists."
    ]
  },
  {
    id: "smartRowHops",
    number: "Smart Drill",
    category: "Targeted Practice Lab",
    title: "Row-Hop Control",
    subtitle: "Vocabulary with frequent top/home/bottom-row changes to train return-to-home discipline.",
    tags: ["Row Changes", "Reach", "Control"],
    source: "smart",
    smartStrategy: "rowHops",
    baseWords: 82,
    targetWpm: 32,
    targetAccuracy: 95,
    isSmartPractice: true,
    guide: [
      "Words are scored by how often adjacent letters move between keyboard rows.",
      "Frequent row changes expose hands that drift instead of returning toward home position.",
      "Keep reaches small and deliberate rather than moving the entire wrist.",
      "The word itself may be ordinary; its keyboard geometry is what earned it a place here.",
      "Higher difficulty changes lesson length, not the underlying definition of a row hop."
    ]
  },
  {
    id: "smartTroublePairs",
    number: "Smart Drill",
    category: "Targeted Practice Lab",
    title: "Trouble-Pair Clinic",
    subtitle: "A word stream built around the two-letter transitions your own lesson history misses most often.",
    tags: ["Adaptive", "Key Pairs", "Personalized"],
    source: "smart",
    smartStrategy: "troublePairs",
    baseWords: 82,
    targetWpm: 30,
    targetAccuracy: 96,
    isSmartPractice: true,
    guide: [
      "The typing engine now records first-attempt accuracy for adjacent letter pairs during lesson-style exercises.",
      "Trouble-Pair Clinic favors words containing your weakest established transitions.",
      "A pair needs several observations before HyperSoft treats it as a persistent issue.",
      "If you do not have enough pair history yet, the drill uses a broad set of commonly awkward transitions.",
      "Pair statistics stay in the active local learner profile and are included in profile backups."
    ]
  }
];

function cleanLetters(word) {
  return String(word || "").toLowerCase().replace(/[^a-z]/g, "");
}

function handFor(letter) {
  if (LEFT_HAND.has(letter)) return "L";
  if (RIGHT_HAND.has(letter)) return "R";
  return null;
}

function rowFor(letter) {
  if (ROWS.top.has(letter)) return "top";
  if (ROWS.home.has(letter)) return "home";
  if (ROWS.bottom.has(letter)) return "bottom";
  return null;
}

export function analyzeWord(word) {
  const letters = cleanLetters(word);
  let left = 0;
  let right = 0;
  let alternating = 0;
  let handTransitions = 0;
  let rowChanges = 0;
  let rowTransitions = 0;
  let sameFingerTransitions = 0;
  const pairs = [];

  for (let i = 0; i < letters.length; i += 1) {
    const letter = letters[i];
    const hand = handFor(letter);
    if (hand === "L") left += 1;
    else if (hand === "R") right += 1;

    if (i > 0) {
      const previous = letters[i - 1];
      pairs.push(previous + letter);
      const prevHand = handFor(previous);
      if (prevHand && hand) {
        handTransitions += 1;
        if (prevHand !== hand) alternating += 1;
      }
      const prevRow = rowFor(previous);
      const row = rowFor(letter);
      if (prevRow && row) {
        rowTransitions += 1;
        if (prevRow !== row) rowChanges += 1;
      }
      if (FINGERS[previous] && FINGERS[previous] === FINGERS[letter]) sameFingerTransitions += 1;
    }
  }

  const handLetters = left + right;
  return {
    word,
    letters,
    length: letters.length,
    isAlphabetic: /^[a-z]+$/i.test(String(word || "")),
    leftRatio: handLetters ? left / handLetters : 0,
    rightRatio: handLetters ? right / handLetters : 0,
    alternationRatio: handTransitions ? alternating / handTransitions : 0,
    rowChangeRatio: rowTransitions ? rowChanges / rowTransitions : 0,
    sameFingerTransitions,
    pairs,
    complexity: letters.length * 0.45 + sameFingerTransitions * 1.35 + (rowTransitions ? (rowChanges / rowTransitions) * 2.2 : 0) + (handTransitions ? (1 - alternating / handTransitions) * 0.8 : 0)
  };
}

const CATALOGS = Object.fromEntries(
  Object.entries(WORD_LISTS).map(([name, words]) => [name, words.map(analyzeWord)])
);
const ALL_CATALOG = Object.values(CATALOGS).flat();

function basePool(listName, min, max) {
  const source = CATALOGS[listName] ?? CATALOGS.general ?? ALL_CATALOG;
  const alpha = source.filter(item => item.isAlphabetic && item.length >= min && item.length <= max);
  if (alpha.length >= 10) return alpha;
  return ALL_CATALOG.filter(item => item.isAlphabetic && item.length >= min && item.length <= max);
}

function containsFocusPair(item, pairs) {
  return pairs.some(pair => item.letters.includes(pair.toLowerCase()));
}

function weightedPick(items, scoreFn = () => 1) {
  if (!items.length) return null;
  const weighted = items.map(item => ({ item, weight: Math.max(0.05, Number(scoreFn(item)) || 0.05) }));
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }
  return weighted.at(-1)?.item ?? items[0];
}

function strategyCandidates(pool, strategy, focusPairs) {
  switch (strategy) {
    case "short": return pool.filter(item => item.length >= 3 && item.length <= 5);
    case "long": return pool.filter(item => item.length >= 9);
    case "difficult": {
      const ranked = [...pool].sort((a, b) => b.complexity - a.complexity);
      return ranked.slice(0, Math.max(8, Math.ceil(ranked.length * 0.35)));
    }
    case "left": {
      const pure = pool.filter(item => item.leftRatio >= 0.999);
      return pure.length >= 6 ? pure : pool.filter(item => item.leftRatio >= 0.68);
    }
    case "right": {
      const pure = pool.filter(item => item.rightRatio >= 0.999);
      return pure.length >= 6 ? pure : pool.filter(item => item.rightRatio >= 0.68);
    }
    case "alternating": return pool.filter(item => item.length >= 4 && item.alternationRatio >= 0.7);
    case "sameFinger": return pool.filter(item => item.sameFingerTransitions >= 1);
    case "rowHops": return pool.filter(item => item.length >= 4 && item.rowChangeRatio >= 0.6);
    case "troublePairs": return pool.filter(item => containsFocusPair(item, focusPairs.length ? focusPairs : DEFAULT_TROUBLE_PAIRS));
    default: return pool;
  }
}

export function selectSmartWord({
  strategy = "adaptive",
  listName = "general",
  min = 3,
  max = 14,
  focusKeys = [],
  focusPairs = []
} = {}) {
  const safeMin = Math.max(2, Number(min) || 3);
  const safeMax = Math.max(safeMin, Number(max) || 14);
  const pool = basePool(listName, safeMin, safeMax);
  const normalizedPairs = (focusPairs ?? []).map(value => String(value).toLowerCase()).filter(value => /^[a-z]{2}$/.test(value));
  let candidates = strategyCandidates(pool, strategy, normalizedPairs);
  if (candidates.length < 5) candidates = pool;

  if (strategy === "adaptive") {
    const keys = (focusKeys ?? []).map(value => String(value).toLowerCase()).filter(value => /^[a-z]$/.test(value));
    const pairs = normalizedPairs;
    return weightedPick(candidates, item => {
      let score = 1;
      keys.forEach(key => { score += item.letters.split(key).length - 1; });
      pairs.forEach(pair => { if (item.letters.includes(pair)) score += 3; });
      score += item.sameFingerTransitions * 0.25;
      score += item.rowChangeRatio * 0.35;
      return score;
    })?.word ?? pool[0]?.word ?? "typing";
  }

  if (strategy === "troublePairs") {
    const pairs = normalizedPairs.length ? normalizedPairs : DEFAULT_TROUBLE_PAIRS;
    return weightedPick(candidates, item => 1 + pairs.reduce((sum, pair) => sum + (item.letters.includes(pair) ? 2 : 0), 0))?.word
      ?? pool[0]?.word ?? "typing";
  }

  const weights = {
    short: item => 1 + (6 - Math.min(5, item.length)) * 0.1,
    long: item => 1 + Math.min(8, item.length - 8) * 0.08,
    difficult: item => 0.5 + item.complexity,
    left: item => 0.5 + item.leftRatio * 2,
    right: item => 0.5 + item.rightRatio * 2,
    alternating: item => 0.5 + item.alternationRatio * 2.5,
    sameFinger: item => 1 + item.sameFingerTransitions * 1.5,
    rowHops: item => 0.5 + item.rowChangeRatio * 2.5
  };
  return weightedPick(candidates, weights[strategy] ?? (() => 1))?.word ?? pool[0]?.word ?? "typing";
}

export function getSmartPoolStats({ listName = "general", focusPairs = [] } = {}) {
  const source = basePool(listName, 2, 18);
  const pairs = (focusPairs ?? []).map(value => String(value).toLowerCase()).filter(value => /^[a-z]{2}$/.test(value));
  return {
    total: source.length,
    short: strategyCandidates(source, "short", pairs).length,
    long: strategyCandidates(source, "long", pairs).length,
    difficult: strategyCandidates(source, "difficult", pairs).length,
    left: strategyCandidates(source, "left", pairs).length,
    right: strategyCandidates(source, "right", pairs).length,
    alternating: strategyCandidates(source, "alternating", pairs).length,
    sameFinger: strategyCandidates(source, "sameFinger", pairs).length,
    rowHops: strategyCandidates(source, "rowHops", pairs).length,
    troublePairs: strategyCandidates(source, "troublePairs", pairs).length
  };
}
