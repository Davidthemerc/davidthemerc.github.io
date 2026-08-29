import { DIFFICULTY_CONFIG, WORD_LISTS } from "./config.js";

export class TypingEngine {
  constructor({ hudAdapter = null, soundEnabled = false, soundVolume = "normal" } = {}) {
    this.hudAdapter = hudAdapter;
    this.soundEnabled = soundEnabled;
    this.soundVolume = soundVolume;
    this.running = false;
    this.startedAt = 0;
    this.stoppedAt = 0;
    this.correctChars = 0;
    this.totalChars = 0;
    this.correctTargets = 0;
    this.totalTargets = 0;
    this.score = 0;
    this.difficultyName = "normal";
    this.wordListName = "general";
    this.modeId = null;
    this.audioContext = null;
    this.sessionKeyStats = {};
    this.sessionPairStats = {};
  }

  /**
   * Shared session start utility used by every game.
   */
  startGame({ difficulty = "normal", wordList = "general", modeId = "" } = {}) {
    this.running = true;
    this.startedAt = performance.now();
    this.stoppedAt = 0;
    this.correctChars = 0;
    this.totalChars = 0;
    this.correctTargets = 0;
    this.totalTargets = 0;
    this.score = 0;
    this.difficultyName = difficulty;
    this.wordListName = wordList;
    this.modeId = modeId;
    this.sessionKeyStats = {};
    this.sessionPairStats = {};
    this.updateHUD();
  }

  /**
   * Shared session stop utility. Returns a normalized result object.
   */
  stopGame() {
    if (this.running) {
      this.stoppedAt = performance.now();
    }
    this.running = false;

    return {
      score: Math.round(this.score),
      wpm: Math.round(this.calculateWPM()),
      accuracy: Math.round(this.calculateAccuracy()),
      durationMs: this.getElapsedMs(),
      correctTargets: this.correctTargets,
      totalTargets: this.totalTargets,
      keyStats: typeof structuredClone === "function" ? structuredClone(this.sessionKeyStats) : JSON.parse(JSON.stringify(this.sessionKeyStats)),
      pairStats: typeof structuredClone === "function" ? structuredClone(this.sessionPairStats) : JSON.parse(JSON.stringify(this.sessionPairStats))
    };
  }

  generateWord(listName = this.wordListName, overrides = {}) {
    const profile = this.getScaledDifficulty(overrides.progress ?? 0);
    const list = WORD_LISTS[listName] ?? WORD_LISTS.general;
    const min = overrides.min ?? profile.wordMin;
    const max = overrides.max ?? profile.wordMax;
    const candidates = list.filter(word => word.length >= min && word.length <= max);
    const pool = candidates.length ? candidates : list;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  generateLetter() {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    return alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  generateNumber(length = null, progress = 0) {
    const profile = this.getScaledDifficulty(progress);
    const digits = length ?? profile.numericLength;
    let value = "";
    for (let i = 0; i < digits; i += 1) {
      value += Math.floor(Math.random() * 10);
    }
    return value;
  }

  /**
   * Words per minute uses the conventional five-character "word".
   */
  calculateWPM() {
    const minutes = Math.max(this.getElapsedMs() / 60000, 1 / 60000);
    return (this.correctChars / 5) / minutes;
  }

  calculateAccuracy() {
    if (this.totalChars === 0) return 100;
    return (this.correctChars / this.totalChars) * 100;
  }

  /**
   * Record a single physical typing attempt.
   */
  recordKeystroke(isCorrect, points = 0, expectedKey = null) {
    this.totalChars += 1;
    if (isCorrect) {
      this.correctChars += 1;
      this.score += points;
    }

    if (expectedKey != null && expectedKey !== " ") {
      const key = String(expectedKey);
      const record = this.sessionKeyStats[key] ?? { attempts: 0, correct: 0, errors: 0 };
      record.attempts += 1;
      if (isCorrect) record.correct += 1;
      else record.errors += 1;
      this.sessionKeyStats[key] = record;
    }

    this.playFeedback(isCorrect);
  }

  recordPairAttempt(isCorrect, previousExpected, expectedKey) {
    const previous = String(previousExpected ?? "").toLowerCase();
    const current = String(expectedKey ?? "").toLowerCase();
    if (!/^[a-z]$/.test(previous) || !/^[a-z]$/.test(current)) return;
    const pair = previous + current;
    const record = this.sessionPairStats[pair] ?? { attempts: 0, correct: 0, errors: 0 };
    record.attempts += 1;
    if (isCorrect) record.correct += 1;
    else record.errors += 1;
    this.sessionPairStats[pair] = record;
  }

  getSessionWeakPairs(limit = 5) {
    return Object.entries(this.sessionPairStats)
      .map(([pair, stats]) => ({
        pair,
        ...stats,
        accuracy: stats.attempts ? (stats.correct / stats.attempts) * 100 : 100
      }))
      .filter(item => item.attempts >= 2 && item.errors > 0)
      .sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors || b.attempts - a.attempts)
      .slice(0, limit);
  }

  getSessionWeakKeys(limit = 5) {
    return Object.entries(this.sessionKeyStats)
      .map(([key, stats]) => ({
        key,
        ...stats,
        accuracy: stats.attempts ? (stats.correct / stats.attempts) * 100 : 100
      }))
      .filter(item => item.attempts >= 2 && item.errors > 0)
      .sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors || b.attempts - a.attempts)
      .slice(0, limit);
  }

  /**
   * Record a completed word/number/chunk submission without double-counting
   * individual keypresses. Games that score key-by-key should call recordKeystroke instead.
   */
  recordTextAttempt(typed, expected, { correctPoints = 0, wrongPenalty = 0 } = {}) {
    const typedText = String(typed);
    const expectedText = String(expected);
    const comparisonLength = Math.max(typedText.length, expectedText.length);
    let localCorrect = 0;

    for (let i = 0; i < comparisonLength; i += 1) {
      const match = typedText[i] === expectedText[i];
      if (match) localCorrect += 1;
    }

    this.correctChars += localCorrect;
    this.totalChars += comparisonLength || 1;
    this.totalTargets += 1;

    const exact = typedText === expectedText;
    if (exact) {
      this.correctTargets += 1;
      this.score += correctPoints;
    } else {
      this.score = Math.max(0, this.score - wrongPenalty);
    }

    this.playFeedback(exact);
    return exact;
  }

  addScore(points) {
    this.score = Math.max(0, this.score + points);
  }

  updateHUD({ timerMs = null, score = null } = {}) {
    if (!this.hudAdapter) return;
    this.hudAdapter({
      wpm: Math.round(this.calculateWPM()),
      accuracy: Math.round(this.calculateAccuracy()),
      timerMs: timerMs ?? this.getElapsedMs(),
      score: Math.round(score ?? this.score)
    });
  }

  /**
   * Unified entity helper for requestAnimationFrame games.
   * It creates an element and returns a small state object for the game module.
   */
  spawnEntity(container, {
    className = "",
    text = "",
    x = 0,
    y = 0,
    dataset = {},
    html = ""
  } = {}) {
    const element = document.createElement("div");
    element.className = className;
    if (html) element.innerHTML = html;
    else element.textContent = text;

    Object.entries(dataset).forEach(([key, value]) => {
      element.dataset[key] = value;
    });

    container.appendChild(element);

    return {
      element,
      x,
      y,
      alive: true,
      remove() {
        this.alive = false;
        element.remove();
      }
    };
  }

  /**
   * Difficulty combines a selected preset with session progress.
   * progress should be 0..1. Scaling raises movement/spawn pressure while
   * keeping the chosen preset recognizable.
   */
  getScaledDifficulty(progress = 0) {
    const base = DIFFICULTY_CONFIG[this.difficultyName] ?? DIFFICULTY_CONFIG.normal;
    const p = Math.min(1, Math.max(0, progress));

    return {
      ...base,
      wordMin: base.wordMin,
      wordMax: Math.min(15, Math.round(base.wordMax + p * 2)),
      spawnInterval: Math.max(650, base.spawnInterval * (1 - p * 0.24)),
      movementSpeed: base.movementSpeed * (1 + p * 0.32),
      errorTolerance: Math.max(0, Math.round(base.errorTolerance - p)),
      rhythmTolerance: Math.max(0.1, base.rhythmTolerance * (1 - p * 0.25)),
      numericLength: Math.min(7, base.numericLength + (p > 0.7 ? 1 : 0)),
      timerFactor: Math.max(0.55, base.timerFactor * (1 - p * 0.12)),
      opponentPace: base.opponentPace * (1 + p * 0.12)
    };
  }

  getElapsedMs() {
    if (!this.startedAt) return 0;
    const end = this.running ? performance.now() : (this.stoppedAt || performance.now());
    return Math.max(0, end - this.startedAt);
  }

  setSound(enabled) {
    this.soundEnabled = Boolean(enabled);
  }

  setSoundVolume(level = "normal") {
    this.soundVolume = ["low", "normal", "high"].includes(level) ? level : "normal";
  }

  playFeedback(correct) {
    if (!this.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext ??= new AudioCtx();
      if (this.audioContext.state === "suspended") this.audioContext.resume?.().catch(() => {});
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const now = this.audioContext.currentTime + 0.005;
      const peak = { low: 0.025, normal: 0.055, high: 0.095 }[this.soundVolume] ?? 0.055;
      oscillator.type = correct ? "triangle" : "sawtooth";
      oscillator.frequency.value = correct ? 620 : 175;
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + .007);
      gain.gain.exponentialRampToValueAtTime(.0001, now + (correct ? .065 : .09));
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + (correct ? .075 : .105));
    } catch {
      // Sound is optional; unsupported or blocked audio should never stop gameplay.
    }
  }
}
