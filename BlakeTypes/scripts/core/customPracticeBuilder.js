import { WORD_LISTS } from "./config.js";
import { selectSmartWord } from "./smartTypingContent.js";

export const CUSTOM_PRACTICE_DEFAULTS = {
  focus: "balanced",
  wordList: "profile",
  minLength: 3,
  maxLength: 10,
  customKeys: "",
  customPairs: "",
  capitals: true,
  punctuation: false,
  numberRow: false,
  durationMinutes: 3,
  targetWpm: 35,
  targetAccuracy: 95
};

const PUNCTUATION = [",", ".", ";", ":", "?", "!", "'", "-", "/", "(", ")"];
const SHIFTED_NUMBER_SYMBOLS = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"];

function customPracticeClamp(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

export function parseCustomKeys(value = "") {
  const text = String(value || "");
  const seen = new Set();
  const result = [];
  for (const char of text) {
    if (/\s|,/.test(char)) continue;
    if (seen.has(char)) continue;
    seen.add(char);
    result.push(char);
  }
  return result.slice(0, 20);
}

export function parseCustomPairs(value = "") {
  const seen = new Set();
  return String(value || "")
    .split(/[\s,;]+/)
    .map(value => value.trim().toLowerCase())
    .filter(value => /^[a-z]{2}$/.test(value))
    .filter(value => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .slice(0, 12);
}

export function normalizeCustomPracticeConfig(config = {}) {
  const raw = config && typeof config === "object" && !Array.isArray(config) ? config : {};
  const focuses = new Set(["balanced", "weakKeys", "troublePairs", "custom"]);
  const lists = new Set(["profile", "general", "office", "technical"]);
  const minLength = Math.round(customPracticeClamp(raw.minLength, 2, 15, CUSTOM_PRACTICE_DEFAULTS.minLength));
  const maxLength = Math.round(customPracticeClamp(raw.maxLength, minLength, 18, Math.max(minLength, CUSTOM_PRACTICE_DEFAULTS.maxLength)));
  return {
    focus: focuses.has(raw.focus) ? raw.focus : CUSTOM_PRACTICE_DEFAULTS.focus,
    wordList: lists.has(raw.wordList) ? raw.wordList : CUSTOM_PRACTICE_DEFAULTS.wordList,
    minLength,
    maxLength,
    customKeys: String(raw.customKeys || "").slice(0, 80),
    customPairs: String(raw.customPairs || "").slice(0, 120),
    capitals: raw.capitals !== false,
    punctuation: raw.punctuation === true,
    numberRow: raw.numberRow === true,
    durationMinutes: Math.round(customPracticeClamp(raw.durationMinutes, 1, 10, CUSTOM_PRACTICE_DEFAULTS.durationMinutes)),
    targetWpm: Math.round(customPracticeClamp(raw.targetWpm, 10, 140, CUSTOM_PRACTICE_DEFAULTS.targetWpm)),
    targetAccuracy: Math.round(customPracticeClamp(raw.targetAccuracy, 85, 100, CUSTOM_PRACTICE_DEFAULTS.targetAccuracy))
  };
}

function randomFrom(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function numberToken() {
  const forms = [
    () => String(Math.floor(10 + Math.random() * 989)),
    () => String(Math.floor(1000 + Math.random() * 8999)),
    () => `${Math.floor(1 + Math.random() * 99)}.${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`,
    () => `$${Math.floor(5 + Math.random() * 1999)}.${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`,
    () => `${Math.floor(1 + Math.random() * 12)}/${Math.floor(1 + Math.random() * 28)}/${String(24 + Math.floor(Math.random() * 8)).padStart(2, "0")}`,
    () => `${Math.floor(100 + Math.random() * 899)}-${Math.floor(10 + Math.random() * 89)}`
  ];
  return randomFrom(forms)();
}

function applyCapitalization(word) {
  if (!word) return word;
  return Math.random() < .22 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1);
}

function applyPunctuation(word) {
  if (!word) return word;
  const mark = randomFrom(PUNCTUATION);
  if (mark === "'") {
    const contractions = ["can't", "don't", "we're", "it's", "Blake's", "you're"];
    return randomFrom(contractions);
  }
  if (mark === "(") return `(${word})`;
  if (mark === ")") return `(${word})`;
  if (mark === "/") return `${word}/${randomFrom(["file", "desk", "report", "data"])}`;
  return `${word}${mark}`;
}

function dedicatedFocusToken(keys = []) {
  if (!keys.length) return null;
  const key = randomFrom(keys);
  if (/^[0-9]$/.test(key)) {
    const chars = Array.from({ length: 4 }, () => String(Math.floor(Math.random() * 10)));
    chars[Math.floor(Math.random() * chars.length)] = key;
    return chars.join("");
  }
  if (PUNCTUATION.includes(key) || SHIFTED_NUMBER_SYMBOLS.includes(key)) {
    const stem = randomFrom(["type", "report", "ready", "office", "file"]);
    if (key === "(" || key === ")") return `(${stem})`;
    if (key === "'") return randomFrom(["can't", "it's", "Blake's"]);
    return `${stem}${key}`;
  }
  return null;
}

export function getCustomPracticePreset(id, { weakKeys = [], weakPairs = [] } = {}) {
  const presets = {
    weakKeys: {
      ...CUSTOM_PRACTICE_DEFAULTS,
      focus: "weakKeys",
      targetAccuracy: 97,
      durationMinutes: 3
    },
    troublePairs: {
      ...CUSTOM_PRACTICE_DEFAULTS,
      focus: "troublePairs",
      targetAccuracy: 97,
      durationMinutes: 3
    },
    punctuation: {
      ...CUSTOM_PRACTICE_DEFAULTS,
      focus: "balanced",
      punctuation: true,
      capitals: true,
      targetAccuracy: 97
    },
    numberRow: {
      ...CUSTOM_PRACTICE_DEFAULTS,
      focus: "balanced",
      numberRow: true,
      capitals: false,
      targetAccuracy: 96
    },
    accuracy: {
      ...CUSTOM_PRACTICE_DEFAULTS,
      focus: weakKeys.length ? "weakKeys" : "balanced",
      targetWpm: 25,
      targetAccuracy: 99,
      durationMinutes: 4
    },
    mixed: {
      ...CUSTOM_PRACTICE_DEFAULTS,
      punctuation: true,
      numberRow: true,
      capitals: true,
      targetAccuracy: 96,
      durationMinutes: 5
    }
  };
  const preset = presets[id] ?? CUSTOM_PRACTICE_DEFAULTS;
  return normalizeCustomPracticeConfig(preset);
}

export function buildCustomPracticeLesson(config, {
  weakKeys = [],
  weakPairs = [],
  difficulty = "normal",
  defaultWordList = "general",
  title = "Custom Practice Session"
} = {}) {
  const c = normalizeCustomPracticeConfig(config);
  const listName = c.wordList === "profile" ? defaultWordList : c.wordList;
  const sourceWords = WORD_LISTS[listName] ?? WORD_LISTS.general;
  const userKeys = parseCustomKeys(c.customKeys);
  const userPairs = parseCustomPairs(c.customPairs);
  const storedKeys = weakKeys.map(item => String(item?.key ?? "")).filter(Boolean);
  const storedPairs = weakPairs.map(item => String(item?.pair ?? "").toLowerCase()).filter(value => /^[a-z]{2}$/.test(value));

  const focusKeys = c.focus === "weakKeys" ? storedKeys
    : c.focus === "custom" ? userKeys
    : [];
  const focusPairs = c.focus === "troublePairs" ? storedPairs
    : c.focus === "custom" ? userPairs
    : [];

  const alphaFocusKeys = focusKeys.map(value => value.toLowerCase()).filter(value => /^[a-z]$/.test(value));
  const strategy = focusPairs.length ? "troublePairs" : alphaFocusKeys.length ? "adaptive" : "balanced";
  const tokens = [];
  const tokenCount = Math.max(180, c.durationMinutes * 95);

  for (let i = 0; i < tokenCount; i += 1) {
    const roll = Math.random();
    const dedicated = focusKeys.length && roll < .14 ? dedicatedFocusToken(focusKeys) : null;
    if (dedicated) {
      tokens.push(dedicated);
      continue;
    }
    if (c.numberRow && roll < .14) {
      tokens.push(numberToken());
      continue;
    }

    let word = selectSmartWord({
      strategy,
      listName,
      min: c.minLength,
      max: c.maxLength,
      focusKeys: alphaFocusKeys,
      focusPairs
    });

    // Backstop for extremely narrow catalogs.
    if (!word) {
      const pool = sourceWords.filter(item => item.length >= c.minLength && item.length <= c.maxLength);
      word = randomFrom(pool.length ? pool : sourceWords);
    }

    if (c.capitals && Math.random() < .16) word = applyCapitalization(word);
    if (c.punctuation && Math.random() < .19) word = applyPunctuation(word);
    tokens.push(word);
  }

  const focusLabel = {
    balanced: "Balanced keyboard",
    weakKeys: storedKeys.length ? `Weak keys: ${storedKeys.slice(0, 6).join(" ")}` : "Weak-key fallback",
    troublePairs: storedPairs.length ? `Trouble pairs: ${storedPairs.slice(0, 5).map(value => value.toUpperCase()).join(" ")}` : "Pair-training fallback",
    custom: `Custom focus${userKeys.length ? ` keys ${userKeys.join(" ")}` : ""}${userPairs.length ? ` pairs ${userPairs.map(value => value.toUpperCase()).join(" ")}` : ""}`
  }[c.focus];

  const extras = [
    c.capitals ? "Capitals" : null,
    c.punctuation ? "Punctuation" : null,
    c.numberRow ? "Number row" : null
  ].filter(Boolean);

  return {
    id: "customPracticeBuilder",
    number: "CUSTOM",
    title: String(title || "Custom Practice Session").slice(0, 44),
    subtitle: `${focusLabel} • ${c.durationMinutes}-minute timed session • ${listName} vocabulary`,
    category: "Custom Practice",
    tags: [focusLabel, `${c.minLength}–${c.maxLength} letters`, ...extras].slice(0, 5),
    source: "custom",
    wordList: listName,
    minLength: c.minLength,
    maxLength: c.maxLength,
    baseWords: tokenCount,
    targetDurationMs: c.durationMinutes * 60 * 1000,
    targetWpm: c.targetWpm,
    targetAccuracy: c.targetAccuracy,
    isSmartPractice: true,
    isCustomPractice: true,
    tokens,
    variant: `${focusLabel} · ${c.durationMinutes} min · ${c.targetAccuracy}% accuracy`,
    config: c,
    guide: [
      "This session was generated by Practice Builder from the settings you selected.",
      `The session runs for ${c.durationMinutes} minute${c.durationMinutes === 1 ? "" : "s"} rather than ending after a fixed number of words.`,
      `Your targets are ${c.targetWpm} WPM and ${c.targetAccuracy}% accuracy. Missing a target never locks you out.`,
      focusKeys.length || focusPairs.length ? "Focus material is weighted toward the selected keys or transitions, with some broader vocabulary mixed in to preserve natural movement." : "Balanced mode samples broadly from the selected vocabulary family.",
      "Custom Practice contributes to adaptive weak-key and pair history but does not count as a formal curriculum lesson."
    ]
  };
}
