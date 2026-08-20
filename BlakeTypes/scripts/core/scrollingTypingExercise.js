import { selectSmartWord } from "./smartTypingContent.js";

export class ScrollingTypingExercise {
  constructor({ stage, engine, settings, finish, lesson, adaptiveProfile = [], pairProfile = [] }) {
    this.stage = stage;
    this.engine = engine;
    this.settings = settings;
    this.finish = finish;
    this.lesson = lesson;
    this.adaptiveProfile = Array.isArray(adaptiveProfile) ? adaptiveProfile : [];
    this.pairProfile = Array.isArray(pairProfile) ? pairProfile : [];
    this.pairAttemptedPositions = new Set();
    this.running = false;
    this.words = [];
    this.wordElements = [];
    this.currentWordIndex = 0;
    this.typedBuffer = "";
    this.wordsCompleted = 0;
    this.targetWords = 0;
    this.errorFlashId = null;
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  start() {
    this.running = true;
    const lengthFactors = {
      novice: 0.78,
      easy: 0.88,
      normal: 1,
      challenging: 1.1,
      hard: 1.2,
      expert: 1.3
    };
    this.targetWords = Math.max(28, Math.round(
      this.lesson.baseWords * (lengthFactors[this.settings.difficulty] ?? 1)
    ));

    const label = this.getUnitLabel();
    const adaptiveFocus = ["adaptive", "smart"].includes(this.lesson.source)
      ? this.renderAdaptiveFocus()
      : "";

    this.stage.innerHTML = `
      <div class="lesson-stage stage-pad">
        <div class="lesson-overview-panel">
          <div>
            <span class="eyebrow">${this.lesson.number}</span>
            <h3>${this.lesson.title}</h3>
            <p>${this.lesson.subtitle}</p>
            ${adaptiveFocus}
          </div>
          <div class="lesson-targets">
            <span><strong>${this.lesson.targetWpm}</strong> WPM target</span>
            <span><strong>${this.lesson.targetAccuracy}%</strong> accuracy target</span>
            <span><strong>${this.targetWords}</strong> ${label}</span>
          </div>
        </div>

        <div class="lesson-ribbon-card">
          <div class="lesson-ribbon-heading">
            <span>Continuous typing ribbon</span>
            <strong id="lessonCounter">0 / ${this.targetWords} ${label}</strong>
          </div>
          <div class="lesson-stream-viewport" id="lessonStreamViewport" aria-label="Scrolling typing exercise">
            <div class="lesson-stream-track" id="lessonStreamTrack"></div>
          </div>
          <div class="lesson-typed-readout" id="lessonTypedReadout">Ready — just start typing.</div>
          <div class="lesson-progress-line">
            <div class="meter"><span id="lessonProgressBar"></span></div>
          </div>
          <div class="status-line" id="lessonStatus">
            No click required. Type the highlighted ${label === "words" ? "word" : "token"} and press Space to continue.
          </div>
        </div>

        <div class="lesson-tip-panel">
          <div class="lesson-blake-mini">B</div>
          <div>
            <strong>Blake's instructional technique</strong>
            <p>${this.getBlakeTip()}</p>
          </div>
        </div>
      </div>
    `;

    this.viewport = this.stage.querySelector("#lessonStreamViewport");
    this.track = this.stage.querySelector("#lessonStreamTrack");
    this.readout = this.stage.querySelector("#lessonTypedReadout");
    this.status = this.stage.querySelector("#lessonStatus");
    this.counter = this.stage.querySelector("#lessonCounter");
    this.progressBar = this.stage.querySelector("#lessonProgressBar");

    this.buildWords();
    this.renderWordStates();
    this.scrollToCurrent(false);
    window.addEventListener("keydown", this.handleKeydown);
    this.engine.updateHUD();
  }

  getUnitLabel() {
    return ["patterns", "numbers", "punctuation", "mixed", "adaptive"].includes(this.lesson.source)
      ? "tokens"
      : "words";
  }

  getBlakeTip() {
    if (this.lesson.source === "smart") {
      return `“HyperSoft says this drill was selected by keyboard geometry. I usually select training material by whether I can type it quickly, but apparently that is not considered methodology.”`;
    }
    if (this.lesson.source === "adaptive") {
      return this.adaptiveProfile.length
        ? `“Apparently the computer remembers mistakes now. Concerning precedent, but useful for typing.”`
        : `“No weak keys yet. This is exactly what my annual review says if you only read the typing section.”`;
    }
    if (this.lesson.source === "numbers") return `“Numbers are just letters that Procurement uses to make everything more complicated.”`;
    if (this.lesson.source === "punctuation") return `“Punctuation matters. Without it, my incident reports read even worse.”`;
    if (this.lesson.source === "capitalized") return `“Shift is easy. Hold it down confidently, like a secure-area door you definitely belong behind.”`;
    return `“Read ahead, keep moving, and whatever you do, don't ask Compliance why my workstation is still unlocked.”`;
  }

  renderAdaptiveFocus() {
    const keyChips = this.adaptiveProfile.slice(0, 6).map(item =>
      `<span class="weak-key-chip">${this.escape(this.formatKey(item.key))} ${Math.round(item.accuracy)}%</span>`
    ).join("");
    const pairChips = this.pairProfile.slice(0, 4).map(item =>
      `<span class="pair-focus-chip">${this.escape(item.pair)} ${Math.round(item.accuracy)}%</span>`
    ).join("");

    if (this.lesson.source === "smart") {
      const strategy = this.lesson.smartStrategy ?? "targeted";
      if (strategy === "troublePairs") {
        return `<div class="adaptive-focus-note"><strong>Pair focus:</strong> ${pairChips || "Not enough pair history yet — using HyperSoft's general transition clinic."}</div>`;
      }
      return `<div class="adaptive-focus-note"><strong>Smart pool:</strong> ${this.escape(this.lesson.smartPoolLabel ?? this.lesson.title)}${keyChips ? ` &nbsp; <strong>Weak keys:</strong> ${keyChips}` : ""}</div>`;
    }

    if (!this.adaptiveProfile.length && !this.pairProfile.length) {
      return `<div class="adaptive-focus-note">No established weak keys or key-pair problems yet — using a broad mixed-keyboard workout until more lesson history exists.</div>`;
    }
    return `<div class="adaptive-focus-note"><strong>Current focus:</strong> ${keyChips || "No key weakness established"}${pairChips ? ` &nbsp; <strong>Transitions:</strong> ${pairChips}` : ""}</div>`;
  }

  buildWords() {
    let previous = "";
    for (let i = 0; i < this.targetWords; i += 1) {
      const progress = i / Math.max(1, this.targetWords - 1);
      let word = this.generateLessonWord(progress);
      let safety = 0;
      while (word === previous && safety < 10) {
        word = this.generateLessonWord(progress);
        safety += 1;
      }
      previous = word;
      this.words.push(word);

      const token = document.createElement("span");
      token.className = "lesson-stream-word upcoming";
      token.dataset.index = String(i);
      token.textContent = word;
      this.track.appendChild(token);
      this.wordElements.push(token);
    }
  }

  generateLessonWord(progress) {
    switch (this.lesson.source) {
      case "custom":
        return this.randomFrom(this.lesson.tokens ?? this.lesson.words ?? ["type"]);
      case "patterns":
        return this.generatePattern(progress);
      case "capitalized":
        return this.generateCapitalized(progress);
      case "numbers":
        return this.generateNumberToken(progress);
      case "punctuation":
        return this.generatePunctuationToken(progress);
      case "mixed":
        return this.generateMixedToken(progress);
      case "adaptive":
        return this.generateAdaptiveToken(progress);
      case "smart":
        return this.generateSmartToken(progress);
      default:
        return this.generateWordListToken(progress);
    }
  }

  generateWordListToken(progress, overrides = {}) {
    const profile = this.engine.getScaledDifficulty(progress);
    const min = Math.max(overrides.min ?? this.lesson.minLength ?? 2, Math.min(profile.wordMin, overrides.min ?? this.lesson.minLength ?? profile.wordMin));
    const configuredMax = overrides.max ?? this.lesson.maxLength ?? profile.wordMax;
    const max = Math.max(min, Math.min(configuredMax, profile.wordMax + 2));
    return this.engine.generateWord(overrides.wordList ?? this.lesson.wordList ?? this.settings.wordList, { min, max, progress });
  }

  generatePattern(progress) {
    const profile = this.engine.getScaledDifficulty(progress);
    const min = this.lesson.patternMin ?? 2;
    const configuredMax = this.lesson.patternMax ?? 5;
    const extra = progress > 0.55 && profile.movementSpeed > 1 ? 1 : 0;
    const max = Math.max(min, configuredMax + extra);
    const length = min + Math.floor(Math.random() * (max - min + 1));
    const primary = this.lesson.keys ?? "asdfjkl;";
    const support = this.lesson.supportKeys ?? "";
    const supportChance = this.lesson.supportChance ?? 0;
    let token = "";
    for (let i = 0; i < length; i += 1) {
      const pool = support && Math.random() < supportChance ? support : primary;
      token += pool[Math.floor(Math.random() * pool.length)];
    }
    return token;
  }

  generateCapitalized(progress) {
    const word = this.generateWordListToken(progress);
    const difficultyWeight = {
      novice: 0.08, easy: 0.12, normal: 0.18, challenging: 0.25, hard: 0.34, expert: 0.42
    }[this.settings.difficulty] ?? 0.18;
    if (Math.random() < difficultyWeight * (0.65 + progress)) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  generateNumberToken(progress) {
    const profile = this.engine.getScaledDifficulty(progress);
    const min = this.lesson.numberMin ?? 2;
    const configuredMax = this.lesson.numberMax ?? 7;
    const scaledMax = Math.min(configuredMax, Math.max(min, profile.numericLength + (progress > 0.6 ? 1 : 0)));
    const length = min + Math.floor(Math.random() * (scaledMax - min + 1));
    return this.engine.generateNumber(length, progress);
  }

  generatePunctuationToken(progress) {
    const contractions = ["can't", "don't", "won't", "it's", "we're", "they're", "you're", "isn't", "hasn't", "Blake's"];
    if (Math.random() < 0.17) return this.randomFrom(contractions);

    const word = this.generateWordListToken(progress);
    const simple = [",", ".", ";", ":", "?", "!"];
    const shifted = this.settings.difficulty === "novice" ? [",", ".", ";"] : simple;
    const formRoll = Math.random();
    if (formRoll < 0.14) return `"${word}"`;
    if (formRoll < 0.24) return `(${word})`;
    return `${word}${this.randomFrom(shifted)}`;
  }

  generateMixedToken(progress) {
    const pressure = {
      novice: 0.55, easy: 0.65, normal: 0.78, challenging: 0.9, hard: 1, expert: 1.12
    }[this.settings.difficulty] ?? 0.78;
    const roll = Math.random();
    if (roll < 0.13 * pressure) return this.generateNumberToken(progress);
    if (roll < 0.28 * pressure) return this.generatePunctuationToken(progress);
    if (roll < 0.42 * pressure) return this.generateCapitalized(progress);
    return this.generateWordListToken(progress);
  }

  generateSmartToken(progress) {
    const profile = this.engine.getScaledDifficulty(progress);
    const min = Math.max(this.lesson.minLength ?? 3, Math.min(profile.wordMin, this.lesson.minLength ?? profile.wordMin));
    const configuredMax = this.lesson.maxLength ?? (this.lesson.smartStrategy === "long" ? 18 : 14);
    const max = Math.max(min, Math.min(configuredMax, profile.wordMax + (this.lesson.smartStrategy === "long" ? 7 : 3)));
    return selectSmartWord({
      strategy: this.lesson.smartStrategy ?? "adaptive",
      listName: this.lesson.wordList ?? this.settings.wordList,
      min,
      max,
      focusKeys: this.adaptiveProfile.slice(0, 8).map(item => item.key),
      focusPairs: this.pairProfile.slice(0, 8).map(item => item.pair)
    });
  }

  generateAdaptiveToken(progress) {
    if (!this.adaptiveProfile.length) return this.generateMixedToken(progress);

    // Most tokens deliberately contain one of the weakest stored keys; occasional
    // broad tokens prevent the drill from degenerating into a single-key loop.
    if (Math.random() < 0.18) return this.generateMixedToken(progress);
    const weightedPool = this.adaptiveProfile.slice(0, 8);
    const focus = weightedPool[Math.floor(Math.random() * weightedPool.length)]?.key ?? "a";

    if (/^[0-9]$/.test(focus)) {
      const length = 3 + Math.floor(Math.random() * 4);
      const chars = Array.from({ length }, () => String(Math.floor(Math.random() * 10)));
      chars[Math.floor(Math.random() * chars.length)] = focus;
      return chars.join("");
    }

    if (/^[A-Z]$/.test(focus)) {
      let candidate = "";
      for (let attempt = 0; attempt < 45; attempt += 1) {
        candidate = this.generateWordListToken(progress);
        if (candidate.toLowerCase().includes(focus.toLowerCase())) break;
      }
      const lower = candidate || this.generateWordListToken(progress);
      const index = lower.toLowerCase().indexOf(focus.toLowerCase());
      return index >= 0
        ? lower.slice(0, index) + lower[index].toUpperCase() + lower.slice(index + 1)
        : focus + lower;
    }

    if (/^[a-z]$/.test(focus)) {
      return selectSmartWord({
        strategy: "adaptive",
        listName: this.lesson.wordList ?? this.settings.wordList,
        min: this.lesson.minLength ?? 3,
        max: this.lesson.maxLength ?? 12,
        focusKeys: this.adaptiveProfile.slice(0, 8).map(item => item.key),
        focusPairs: this.pairProfile.slice(0, 6).map(item => item.pair)
      });
    }

    const punctuationSamples = {
      ",": ["report,", "file,", "desk,", "type,"],
      ".": ["done.", "again.", "ready.", "type."],
      ";": ["file;", "desk;", "again;"],
      ":": ["note:", "status:", "result:"],
      "?": ["ready?", "again?", "why?"],
      "!": ["type!", "go!", "again!"],
      "'": ["can't", "it's", "Blake's", "we're"],
      '"': ['"type"', '"report"', '"ready"'],
      "(": ["(file)", "(desk)", "(note)"],
      ")": ["(file)", "(desk)", "(note)"]
    };
    return this.randomFrom(punctuationSamples[focus] ?? [focus + "type"]);
  }

  handleKeydown(event) {
    if (!this.running || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof HTMLElement &&
        event.target.matches("button, select, textarea, a[href], input")) return;

    if (event.key === "Backspace") {
      event.preventDefault();
      if (this.typedBuffer.length) {
        this.typedBuffer = this.typedBuffer.slice(0, -1);
        this.renderWordStates();
      }
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
      this.handleSpace();
      return;
    }

    if (event.key.length !== 1) return;
    const currentWord = this.words[this.currentWordIndex];
    if (!currentWord) return;

    const typedChar = event.key;
    const expectedChar = currentWord[this.typedBuffer.length];
    const correct = typedChar === expectedChar;
    const pairPosition = `${this.currentWordIndex}:${this.typedBuffer.length}`;
    if (this.typedBuffer.length > 0 && !this.pairAttemptedPositions.has(pairPosition)) {
      const previousExpected = currentWord[this.typedBuffer.length - 1];
      this.engine.recordPairAttempt(correct, previousExpected, expectedChar);
      this.pairAttemptedPositions.add(pairPosition);
    }
    this.engine.recordKeystroke(correct, correct ? 0.55 : 0, expectedChar);

    if (correct) {
      this.typedBuffer += typedChar;
      this.status.textContent = this.typedBuffer.length === currentWord.length
        ? "Token complete — press Space and keep the ribbon moving."
        : "Good. Keep your eyes slightly ahead of the current token.";
      this.status.className = "status-line good";
    } else {
      this.engine.addScore(-2);
      this.status.textContent = `Expected ${this.describeExpected(expectedChar)}. Type the correct key to continue.`;
      this.status.className = "status-line bad";
      this.flashError();
    }

    this.renderWordStates();
    this.engine.updateHUD();
  }

  handleSpace() {
    const currentWord = this.words[this.currentWordIndex];
    if (!currentWord) return;
    const complete = this.typedBuffer === currentWord;
    this.engine.recordKeystroke(complete, complete ? 0.75 : 0);

    if (!complete) {
      this.engine.addScore(-4);
      this.status.textContent = "Finish the highlighted token before pressing Space.";
      this.status.className = "status-line bad";
      this.flashError();
      this.engine.updateHUD();
      return;
    }

    this.engine.correctTargets += 1;
    this.engine.totalTargets += 1;
    this.engine.addScore(28 + currentWord.length * 3);
    this.wordsCompleted += 1;
    this.currentWordIndex += 1;
    this.typedBuffer = "";

    const label = this.getUnitLabel();
    this.counter.textContent = `${this.wordsCompleted} / ${this.targetWords} ${label}`;
    this.progressBar.style.width = `${Math.min(100, (this.wordsCompleted / this.targetWords) * 100)}%`;
    this.status.textContent = "Clean token. Continue without stopping.";
    this.status.className = "status-line good";

    if (this.wordsCompleted >= this.targetWords) {
      this.completeLesson();
      return;
    }

    this.renderWordStates();
    this.scrollToCurrent(true);
    this.engine.updateHUD();
  }

  renderWordStates() {
    this.wordElements.forEach((element, index) => {
      if (index < this.currentWordIndex) {
        element.className = "lesson-stream-word done";
        element.textContent = this.words[index];
      } else if (index === this.currentWordIndex) {
        element.className = "lesson-stream-word current";
        const word = this.words[index];
        const typed = this.escape(this.typedBuffer);
        const rest = this.escape(word.slice(this.typedBuffer.length));
        element.innerHTML = `<span class="lesson-typed-prefix">${typed}</span><span>${rest}</span>`;
      } else {
        element.className = "lesson-stream-word upcoming";
        element.textContent = this.words[index];
      }
    });

    const current = this.words[this.currentWordIndex] ?? "";
    this.readout.innerHTML = current
      ? `Typed: <strong>${this.escape(this.typedBuffer) || "—"}</strong> &nbsp; Target: <strong>${this.escape(current)}</strong>`
      : "Exercise complete.";
  }

  scrollToCurrent(smooth = true) {
    const current = this.wordElements[this.currentWordIndex];
    if (!current || !this.viewport) return;
    requestAnimationFrame(() => {
      const targetLeft = Math.max(0, current.offsetLeft - this.viewport.clientWidth * 0.28);
      this.viewport.scrollTo({ left: targetLeft, behavior: smooth ? "smooth" : "auto" });
    });
  }

  flashError() {
    this.stage.classList.remove("lesson-error-flash");
    void this.stage.offsetWidth;
    this.stage.classList.add("lesson-error-flash");
    window.clearTimeout(this.errorFlashId);
    this.errorFlashId = window.setTimeout(() => this.stage.classList.remove("lesson-error-flash"), 180);
  }

  completeLesson() {
    const wpm = Math.round(this.engine.calculateWPM());
    const accuracy = Math.round(this.engine.calculateAccuracy());
    const metWpm = wpm >= this.lesson.targetWpm;
    const metAccuracy = accuracy >= this.lesson.targetAccuracy;
    const met = metWpm && metAccuracy;
    if (met) this.engine.addScore(350);

    const sessionWeak = this.engine.getSessionWeakKeys(4)
      .map(item => this.formatKey(item.key))
      .join(", ");
    const sessionPairs = this.engine.getSessionWeakPairs(4)
      .map(item => item.pair.toUpperCase())
      .join(", ");

    this.finish({
      success: true,
      score: this.engine.score,
      title: met ? "Lesson target met" : "Lesson complete",
      message: met
        ? `You cleared ${this.wordsCompleted} ${this.getUnitLabel()} and met both training targets. Blake is visibly trying not to look threatened.`
        : `You cleared all ${this.wordsCompleted} ${this.getUnitLabel()}. Target: ${this.lesson.targetWpm} WPM at ${this.lesson.targetAccuracy}% accuracy. This is practice, not a lockout.`,
      wordsCompleted: this.wordsCompleted,
      targetStatus: met ? "Met" : "Practice",
      weakKeys: sessionWeak || "None",
      extraStats: sessionPairs ? [["Trouble pairs", sessionPairs]] : []
    });
  }

  getHUDTime() {
    return this.engine.getElapsedMs();
  }

  stop() {
    this.running = false;
    window.clearTimeout(this.errorFlashId);
    window.removeEventListener("keydown", this.handleKeydown);
  }

  describeExpected(value) {
    if (value === undefined) return "the end of the token";
    if (value === " ") return "Space";
    return `“${value}”`;
  }

  formatKey(key) {
    if (key === " ") return "Space";
    if (key === ";") return ";";
    if (key === '"') return '"';
    if (/^[A-Z]$/.test(key)) return `${key} (Shift)`;
    return key;
  }

  randomFrom(values) {
    return values[Math.floor(Math.random() * values.length)];
  }

  escape(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
}
