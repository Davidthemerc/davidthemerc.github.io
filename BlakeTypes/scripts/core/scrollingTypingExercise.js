import { hyperSoftShouldBypassTypingEvent } from "./accessibilityUtils.js";
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
    this.instrumentPulseId = null;
    this.durationTimerId = null;
    this.targetDurationMs = 0;
    this.totalErrors = 0;
    this.tokenErrors = 0;
    this.lastWrongKey = "";
    this.keyboardCoachVisible = this.settings.lessonKeyboardCoach !== false;
    this.handleKeydown = this.handleKeydown.bind(this);
    this.toggleKeyboardCoach = this.toggleKeyboardCoach.bind(this);
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
    this.targetDurationMs = Math.max(0, Number(this.lesson.targetDurationMs) || 0);
    const scaledWords = Math.max(28, Math.round(
      this.lesson.baseWords * (lengthFactors[this.settings.difficulty] ?? 1)
    ));
    this.targetWords = this.targetDurationMs
      ? Math.max(scaledWords, Math.ceil((this.targetDurationMs / 60000) * Math.max(90, this.lesson.targetWpm * 2.4)))
      : scaledWords;

    const label = this.getUnitLabel();
    const adaptiveFocus = ["adaptive", "smart"].includes(this.lesson.source)
      ? this.renderAdaptiveFocus()
      : "";

    const practiceClass = this.lesson.isCustomPractice ? "custom-practice-workstation" : this.lesson.isSmartPractice ? "smart-practice-workstation" : "curriculum-workstation";
    const stationName = this.lesson.isCustomPractice ? "PRACTICE BUILDER" : this.lesson.isSmartPractice ? "SMART PRACTICE LAB" : "CURRICULUM WORKSTATION";
    const difficultyLabel = this.settings.difficulty ? this.settings.difficulty.charAt(0).toUpperCase() + this.settings.difficulty.slice(1) : "Normal";
    const wordFamily = (this.lesson.wordList ?? this.settings.wordList ?? "general");

    this.stage.innerHTML = `
      <div class="lesson-stage stage-pad ${practiceClass}">
        <div class="lesson-console-titlebar">
          <div class="lesson-console-lamps" aria-hidden="true"><span></span><span></span><span></span></div>
          <div class="lesson-console-name"><small>HyperSoft Deluxe Training Console</small><strong>${stationName}</strong></div>
          <div class="lesson-console-session"><span>${difficultyLabel}</span><span>${this.escape(wordFamily.charAt(0).toUpperCase() + wordFamily.slice(1))} Words</span></div>
        </div>

        <div class="lesson-overview-panel">
          <div>
            <span class="eyebrow">${this.lesson.isSmartPractice ? "Targeted drill" : this.lesson.number}</span>
            <h3>${this.lesson.title}</h3>
            <p>${this.lesson.subtitle}</p>
            ${adaptiveFocus}
          </div>
          <div class="lesson-targets">
            <span><strong>${this.lesson.targetWpm}</strong> WPM target</span>
            <span><strong>${this.lesson.targetAccuracy}%</strong> accuracy target</span>
            <span><strong>${this.targetDurationMs ? `${Math.round(this.targetDurationMs / 60000)} min` : this.targetWords}</strong> ${this.targetDurationMs ? "timed session" : label}</span>
          </div>
        </div>

        <div class="lesson-instrument-deck" aria-label="Live lesson instruments">
          <div class="lesson-instrument" id="lessonWpmInstrument">
            <span>Live WPM</span><strong id="lessonLiveWpm">0</strong><small>Target ${this.lesson.targetWpm}</small>
            <div class="lesson-gauge"><span id="lessonWpmGauge"></span><i style="left:83%" aria-hidden="true"></i></div>
          </div>
          <div class="lesson-instrument" id="lessonAccuracyInstrument">
            <span>Accuracy</span><strong id="lessonLiveAccuracy">100%</strong><small>Target ${this.lesson.targetAccuracy}%</small>
            <div class="lesson-gauge"><span id="lessonAccuracyGauge"></span><i style="left:${this.lesson.targetAccuracy}%" aria-hidden="true"></i></div>
          </div>
          <div class="lesson-instrument">
            <span>Progress</span><strong id="lessonLiveProgress">${this.targetDurationMs ? "0:00" : `0/${this.targetWords}`}</strong><small>${this.targetDurationMs ? "timed session" : `${label} cleared`}</small>
            <div class="lesson-gauge"><span id="lessonProgressGauge"></span></div>
          </div>
          <div class="lesson-instrument" id="lessonErrorInstrument">
            <span>Input Errors</span><strong id="lessonLiveErrors">0</strong><small id="lessonErrorDetail">Current token: clean</small>
            <div class="lesson-error-lights" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          </div>
        </div>

        <div class="lesson-ribbon-card">
          <div class="lesson-ribbon-heading">
            <span>Continuous typing ribbon</span>
            <strong id="lessonCounter">${this.targetDurationMs ? `0:00 / ${Math.round(this.targetDurationMs / 60000)}:00` : `0 / ${this.targetWords} ${label}`}</strong>
          </div>
          <div class="lesson-stream-viewport" id="lessonStreamViewport" aria-label="Scrolling typing exercise">
            <div class="lesson-stream-track" id="lessonStreamTrack"></div>
          </div>
          <div class="lesson-monitor-row">
            <div class="lesson-typed-readout"><span class="lesson-readout-label">Input monitor</span><span id="lessonTypedReadout">Ready — just start typing.</span></div>
            <div class="lesson-next-key-readout"><span>Next key</span><strong id="lessonNextKeyReadout">—</strong></div>
          </div>
          <div class="lesson-progress-line">
            <div class="meter lesson-progress-meter"><span id="lessonProgressBar"></span><i style="left:25%"></i><i style="left:50%"></i><i style="left:75%"></i></div>
          </div>
          <div class="status-line" id="lessonStatus" aria-live="polite">
            No click required. Type the highlighted ${label === "words" ? "word" : "token"} and press Space to continue.
          </div>
        </div>

        <section class="lesson-coach-shell ${this.keyboardCoachVisible ? "" : "is-collapsed"}" id="lessonCoachShell" aria-label="Visual keyboard coach">
          <div class="lesson-coach-toolbar">
            <div><span class="lesson-panel-kicker">HyperSoft Keyboard Coach</span><strong>Next-key & finger guidance</strong></div>
            <button class="secondary lesson-coach-toggle" id="lessonCoachToggle" type="button" aria-pressed="${this.keyboardCoachVisible ? "true" : "false"}">${this.keyboardCoachVisible ? "Keyboard Coach: On" : "Keyboard Coach: Off"}</button>
          </div>
          <div class="lesson-coach-body">
            <div class="lesson-keyboard" id="lessonVisualKeyboard">${this.renderKeyboardHTML()}</div>
            <aside class="lesson-finger-guide">
              <div class="lesson-hand-pair" aria-hidden="true">
                <div class="lesson-hand left" id="lessonLeftHand"><span>LEFT</span><i></i><i></i><i></i><i></i><i class="thumb"></i></div>
                <div class="lesson-hand right" id="lessonRightHand"><span>RIGHT</span><i></i><i></i><i></i><i></i><i class="thumb"></i></div>
              </div>
              <div class="lesson-finger-readout">
                <span>Recommended movement</span>
                <strong id="lessonFingerName">Hands ready</strong>
                <small id="lessonFingerDetail">Home row • eyes on the ribbon</small>
              </div>
              <div class="lesson-shift-readout" id="lessonShiftReadout">No Shift required</div>
            </aside>
          </div>
        </section>

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
    this.liveWpm = this.stage.querySelector("#lessonLiveWpm");
    this.liveAccuracy = this.stage.querySelector("#lessonLiveAccuracy");
    this.liveProgress = this.stage.querySelector("#lessonLiveProgress");
    this.liveErrors = this.stage.querySelector("#lessonLiveErrors");
    this.errorDetail = this.stage.querySelector("#lessonErrorDetail");
    this.wpmGauge = this.stage.querySelector("#lessonWpmGauge");
    this.accuracyGauge = this.stage.querySelector("#lessonAccuracyGauge");
    this.progressGauge = this.stage.querySelector("#lessonProgressGauge");
    this.wpmInstrument = this.stage.querySelector("#lessonWpmInstrument");
    this.accuracyInstrument = this.stage.querySelector("#lessonAccuracyInstrument");
    this.errorInstrument = this.stage.querySelector("#lessonErrorInstrument");
    this.coachShell = this.stage.querySelector("#lessonCoachShell");
    this.coachToggle = this.stage.querySelector("#lessonCoachToggle");
    this.nextKeyReadout = this.stage.querySelector("#lessonNextKeyReadout");
    this.fingerName = this.stage.querySelector("#lessonFingerName");
    this.fingerDetail = this.stage.querySelector("#lessonFingerDetail");
    this.shiftReadout = this.stage.querySelector("#lessonShiftReadout");
    this.leftHand = this.stage.querySelector("#lessonLeftHand");
    this.rightHand = this.stage.querySelector("#lessonRightHand");
    this.coachToggle?.addEventListener("click", this.toggleKeyboardCoach);

    this.buildWords();
    this.renderWordStates();
    this.scrollToCurrent(false);
    window.addEventListener("keydown", this.handleKeydown);
    this.engine.updateHUD();
    if (this.targetDurationMs) {
      this.durationTimerId = window.setInterval(() => {
        if (!this.running) return;
        this.updateLiveInstrumentation();
        if (this.engine.getElapsedMs() >= this.targetDurationMs) this.completeLesson({ timed: true });
      }, 200);
    }
  }

  getUnitLabel() {
    return ["patterns", "numbers", "punctuation", "mixed", "adaptive", "custom"].includes(this.lesson.source)
      ? "tokens"
      : "words";
  }

  getBlakeTip() {
    if (this.lesson.isCustomPractice) {
      return `“You configured the drill yourself. If this goes badly, HyperSoft has finally found a process where I cannot be listed as the root cause.”`;
    }
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
      `<span class="weak-key-chip key-metric-chip"><strong class="key-metric-glyph">${this.escape(this.formatKey(item.key))}</strong><span class="key-metric-value">${Math.round(item.accuracy)}%</span></span>`
    ).join("");
    const pairChips = this.pairProfile.slice(0, 4).map(item =>
      `<span class="pair-focus-chip key-metric-chip"><strong class="key-metric-glyph">${this.escape(item.pair)}</strong><span class="key-metric-value">${Math.round(item.accuracy)}%</span></span>`
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
    // v0.16.8 balance pass: suppress short-range repetition, not just exact back-to-back duplicates.
    // Small specialized pools can still repeat later, preserving the deliberate practice effect.
    const recentWindow = [];
    for (let i = 0; i < this.targetWords; i += 1) {
      const progress = i / Math.max(1, this.targetWords - 1);
      let word = this.generateLessonWord(progress);
      let safety = 0;
      while (recentWindow.includes(word) && safety < 12) {
        word = this.generateLessonWord(progress);
        safety += 1;
      }
      recentWindow.push(word);
      if (recentWindow.length > 4) recentWindow.shift();
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
    if (hyperSoftShouldBypassTypingEvent(event)) return;

    if (event.key === "Backspace") {
      event.preventDefault();
      if (this.typedBuffer.length) {
        this.typedBuffer = this.typedBuffer.slice(0, -1);
        this.lastWrongKey = "";
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
      this.lastWrongKey = "";
      this.typedBuffer += typedChar;
      this.status.textContent = this.typedBuffer.length === currentWord.length
        ? "Token complete — press Space and keep the ribbon moving."
        : "Good. Keep your eyes slightly ahead of the current token.";
      this.status.className = "status-line good";
    } else {
      this.totalErrors += 1;
      this.tokenErrors += 1;
      this.lastWrongKey = typedChar;
      this.engine.addScore(-2);
      this.status.textContent = `Expected ${this.describeExpected(expectedChar)} — received ${this.describeExpected(typedChar)}. Type the correct key to continue.`;
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
      this.totalErrors += 1;
      this.tokenErrors += 1;
      this.lastWrongKey = " ";
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
    this.tokenErrors = 0;
    this.lastWrongKey = "";

    const label = this.getUnitLabel();
    if (this.targetDurationMs) {
      const elapsed = Math.min(this.targetDurationMs, this.engine.getElapsedMs());
      this.counter.textContent = `${this.formatTime(elapsed)} / ${this.formatTime(this.targetDurationMs)}`;
      this.progressBar.style.width = `${Math.min(100, (elapsed / this.targetDurationMs) * 100)}%`;
    } else {
      this.counter.textContent = `${this.wordsCompleted} / ${this.targetWords} ${label}`;
      this.progressBar.style.width = `${Math.min(100, (this.wordsCompleted / this.targetWords) * 100)}%`;
    }
    this.status.textContent = "Clean token. Continue without stopping.";
    this.status.className = "status-line good";

    if (!this.targetDurationMs && this.wordsCompleted >= this.targetWords) {
      this.completeLesson();
      return;
    }
    if (this.targetDurationMs && this.wordsCompleted >= this.targetWords) {
      this.appendTimedWords();
    }

    this.renderWordStates();
    this.scrollToCurrent(true);
    this.engine.updateHUD();
  }

  appendTimedWords() {
    const addCount = 80;
    let previous = this.words.at(-1) ?? "";
    for (let i = 0; i < addCount; i += 1) {
      const progress = this.targetDurationMs ? Math.min(1, this.engine.getElapsedMs() / this.targetDurationMs) : 0.5;
      let word = this.generateLessonWord(progress);
      let safety = 0;
      while (word === previous && safety < 8) {
        word = this.generateLessonWord(progress);
        safety += 1;
      }
      previous = word;
      this.words.push(word);
      const token = document.createElement("span");
      token.className = "lesson-stream-word upcoming";
      token.dataset.index = String(this.words.length - 1);
      token.textContent = word;
      this.track.appendChild(token);
      this.wordElements.push(token);
    }
    this.targetWords = this.words.length;
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
        const next = this.escape(word[this.typedBuffer.length] ?? "");
        const rest = this.escape(word.slice(this.typedBuffer.length + (next ? 1 : 0)));
        element.innerHTML = `<span class="lesson-typed-prefix">${typed}</span>${next ? `<span class="lesson-next-char">${next}</span>` : ""}<span>${rest}</span>`;
      } else {
        element.className = "lesson-stream-word upcoming";
        element.textContent = this.words[index];
      }
    });

    const current = this.words[this.currentWordIndex] ?? "";
    const awaitingSpace = Boolean(current) && this.typedBuffer === current;
    this.readout.innerHTML = current
      ? `Typed <strong>${this.escape(this.typedBuffer) || "—"}</strong> <span class="lesson-monitor-divider">|</span> Target <strong>${this.escape(current)}</strong>${awaitingSpace ? ` <span class="lesson-space-prompt">SPACE to advance</span>` : ""}`
      : "Exercise complete.";
    this.updateKeyboardCoach();
    this.updateLiveInstrumentation();
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

  completeLesson({ timed = false } = {}) {
    if (!this.running) return;
    this.running = false;
    window.clearInterval(this.durationTimerId);
    this.durationTimerId = null;
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
      title: met ? "Training target met" : "Practice complete",
      message: timed
        ? (met
          ? `Timed practice complete: ${this.wordsCompleted} ${this.getUnitLabel()} with both targets met. Blake has begun checking whether the timer was calibrated correctly.`
          : `Timed practice complete after ${this.formatTime(this.targetDurationMs)}. You cleared ${this.wordsCompleted} ${this.getUnitLabel()}. Target: ${this.lesson.targetWpm} WPM at ${this.lesson.targetAccuracy}% accuracy.`)
        : (met
          ? `You cleared ${this.wordsCompleted} ${this.getUnitLabel()} and met both training targets. Blake is visibly trying not to look threatened.`
          : `You cleared all ${this.wordsCompleted} ${this.getUnitLabel()}. Target: ${this.lesson.targetWpm} WPM at ${this.lesson.targetAccuracy}% accuracy. This is practice, not a lockout.`),
      wordsCompleted: this.wordsCompleted,
      targetStatus: met ? "Met" : "Practice",
      weakKeys: sessionWeak || "None",
      variant: this.lesson.variant ?? null,
      extraStats: [
        ...(timed ? [["Session length", this.formatTime(this.targetDurationMs)]] : []),
        ...(sessionPairs ? [["Trouble pairs", sessionPairs]] : [])
      ]
    });
  }

  getHUDTime() {
    this.updateLiveInstrumentation();
    return this.engine.getElapsedMs();
  }

  stop() {
    this.running = false;
    window.clearTimeout(this.errorFlashId);
    window.clearTimeout(this.instrumentPulseId);
    window.clearInterval(this.durationTimerId);
    this.durationTimerId = null;
    this.coachToggle?.removeEventListener("click", this.toggleKeyboardCoach);
    window.removeEventListener("keydown", this.handleKeydown);
  }

  toggleKeyboardCoach() {
    this.keyboardCoachVisible = !this.keyboardCoachVisible;
    this.coachShell?.classList.toggle("is-collapsed", !this.keyboardCoachVisible);
    if (this.coachToggle) {
      this.coachToggle.textContent = this.keyboardCoachVisible ? "Keyboard Coach: On" : "Keyboard Coach: Off";
      this.coachToggle.setAttribute("aria-pressed", this.keyboardCoachVisible ? "true" : "false");
    }
    if (this.keyboardCoachVisible) this.updateKeyboardCoach();
  }

  renderKeyboardHTML() {
    const rows = [
      [
        ["`", "`", "~"], ["1", "1", "!"], ["2", "2", "@"], ["3", "3", "#"], ["4", "4", "$"], ["5", "5", "%"], ["6", "6", "^"], ["7", "7", "&"], ["8", "8", "*"], ["9", "9", "("], ["0", "0", ")"], ["-", "-", "_"], ["=", "=", "+"], ["backspace", "Backspace", ""]
      ],
      [["tab", "Tab", ""], ..."qwertyuiop".split("").map(key => [key, key.toUpperCase(), ""]), ["[", "[", "{"], ["]", "]", "}"], ["\\", "\\", "|"]],
      [["caps", "Caps", ""], ..."asdfghjkl".split("").map(key => [key, key.toUpperCase(), ""]), [";", ";", ":"], ["'", "'", '"'], ["enter", "Enter", ""]],
      [["shift-left", "Shift", ""], ..."zxcvbnm".split("").map(key => [key, key.toUpperCase(), ""]), [",", ",", "<"], [".", ".", ">"], ["/", "/", "?"], ["shift-right", "Shift", ""]],
      [["ctrl-left", "Ctrl", ""], ["alt-left", "Alt", ""], ["space", "Space", ""], ["alt-right", "Alt", ""], ["ctrl-right", "Ctrl", ""]]
    ];
    return rows.map((row, rowIndex) => `<div class="lesson-keyboard-row row-${rowIndex}">${row.map(([key, label, shift]) => {
      const classes = ["lesson-key"];
      if (["backspace", "tab", "caps", "enter", "shift-left", "shift-right", "ctrl-left", "ctrl-right", "alt-left", "alt-right"].includes(key)) classes.push("wide-key");
      if (key === "space") classes.push("space-key");
      return `<div class="${classes.join(" ")}" data-key="${this.escapeAttr(key)}"><span>${this.escape(label)}</span>${shift ? `<small>${this.escape(shift)}</small>` : ""}</div>`;
    }).join("")}</div>`).join("");
  }

  getKeyInfo(char) {
    if (char === " ") return { base: "space", display: "Space", hand: "Both hands", handCode: "B", finger: "Thumb", shift: false, shiftSide: null };
    const shifted = {
      "~":"`", "!":"1", "@":"2", "#":"3", "$":"4", "%":"5", "^":"6", "&":"7", "*":"8", "(":"9", ")":"0",
      "_":"-", "+":"=", "{":"[", "}":"]", "|":"\\", ":":";", '"':"'", "<":",", ">":".", "?":"/"
    };
    let base = String(char ?? "");
    let needsShift = false;
    if (/^[A-Z]$/.test(base)) { base = base.toLowerCase(); needsShift = true; }
    else if (Object.prototype.hasOwnProperty.call(shifted, base)) { base = shifted[base]; needsShift = true; }

    const leftPinky = new Set(["`", "1", "q", "a", "z"]);
    const leftRing = new Set(["2", "w", "s", "x"]);
    const leftMiddle = new Set(["3", "e", "d", "c"]);
    const leftIndex = new Set(["4", "5", "r", "t", "f", "g", "v", "b"]);
    const rightIndex = new Set(["6", "7", "y", "u", "h", "j", "n", "m"]);
    const rightMiddle = new Set(["8", "i", "k", ","]);
    const rightRing = new Set(["9", "o", "l", "."]);
    const rightPinky = new Set(["0", "-", "=", "p", "[", "]", "\\", ";", "'", "/"]);
    let hand = "Center";
    let handCode = "C";
    let finger = "Key";
    if (leftPinky.has(base)) { hand = "Left hand"; handCode = "L"; finger = "Pinky"; }
    else if (leftRing.has(base)) { hand = "Left hand"; handCode = "L"; finger = "Ring finger"; }
    else if (leftMiddle.has(base)) { hand = "Left hand"; handCode = "L"; finger = "Middle finger"; }
    else if (leftIndex.has(base)) { hand = "Left hand"; handCode = "L"; finger = "Index finger"; }
    else if (rightIndex.has(base)) { hand = "Right hand"; handCode = "R"; finger = "Index finger"; }
    else if (rightMiddle.has(base)) { hand = "Right hand"; handCode = "R"; finger = "Middle finger"; }
    else if (rightRing.has(base)) { hand = "Right hand"; handCode = "R"; finger = "Ring finger"; }
    else if (rightPinky.has(base)) { hand = "Right hand"; handCode = "R"; finger = "Pinky"; }
    const shiftSide = needsShift ? (handCode === "L" ? "right" : handCode === "R" ? "left" : "left") : null;
    return { base, display: String(char ?? ""), hand, handCode, finger, shift: needsShift, shiftSide };
  }

  updateKeyboardCoach() {
    const currentWord = this.words[this.currentWordIndex] ?? "";
    let expected = currentWord[this.typedBuffer.length];
    if (currentWord && this.typedBuffer === currentWord) expected = " ";
    if (!currentWord) expected = null;
    const info = expected == null ? null : this.getKeyInfo(expected);

    this.stage.querySelectorAll(".lesson-key").forEach(key => key.classList.remove("is-next", "is-shift", "is-error"));
    this.leftHand?.classList.remove("is-active");
    this.rightHand?.classList.remove("is-active");

    if (!info) {
      if (this.nextKeyReadout) this.nextKeyReadout.textContent = "Complete";
      if (this.fingerName) this.fingerName.textContent = "Exercise complete";
      if (this.fingerDetail) this.fingerDetail.textContent = "Keyboard coach standing by";
      if (this.shiftReadout) this.shiftReadout.textContent = "No Shift required";
      return;
    }

    const key = [...this.stage.querySelectorAll(".lesson-key")].find(element => element.dataset.key === info.base);
    key?.classList.add("is-next");
    if (info.shift) this.stage.querySelector(`.lesson-key[data-key="shift-${info.shiftSide}"]`)?.classList.add("is-shift");
    if (this.lastWrongKey) {
      const wrong = this.getKeyInfo(this.lastWrongKey);
      [...this.stage.querySelectorAll(".lesson-key")].find(element => element.dataset.key === wrong.base)?.classList.add("is-error");
    }
    if (info.handCode === "L") this.leftHand?.classList.add("is-active");
    if (info.handCode === "R") this.rightHand?.classList.add("is-active");
    if (info.handCode === "B") { this.leftHand?.classList.add("is-active"); this.rightHand?.classList.add("is-active"); }

    if (this.nextKeyReadout) this.nextKeyReadout.textContent = info.shift ? `Shift + ${info.display}` : info.display === " " ? "Space" : info.display;
    if (this.fingerName) this.fingerName.textContent = `${info.hand} • ${info.finger}`;
    if (this.fingerDetail) this.fingerDetail.textContent = info.base === "space" ? "Use a thumb and keep the rhythm moving." : `Target key: ${info.display === " " ? "Space" : info.display}`;
    if (this.shiftReadout) this.shiftReadout.textContent = info.shift ? `Hold ${info.shiftSide === "left" ? "LEFT" : "RIGHT"} Shift with the opposite hand.` : "No Shift required";
  }

  updateLiveInstrumentation() {
    if (!this.running) return;
    const wpm = Math.round(this.engine.calculateWPM());
    const accuracy = Math.round(this.engine.calculateAccuracy());
    const elapsed = this.engine.getElapsedMs();
    const progress = this.targetDurationMs
      ? Math.min(1, elapsed / this.targetDurationMs)
      : this.targetWords ? this.wordsCompleted / this.targetWords : 0;
    if (this.liveWpm) this.liveWpm.textContent = String(wpm);
    if (this.liveAccuracy) this.liveAccuracy.textContent = `${accuracy}%`;
    if (this.liveProgress) this.liveProgress.textContent = this.targetDurationMs
      ? `${this.formatTime(Math.min(elapsed, this.targetDurationMs))}`
      : `${this.wordsCompleted}/${this.targetWords}`;
    if (this.targetDurationMs && this.counter) {
      this.counter.textContent = `${this.formatTime(Math.min(elapsed, this.targetDurationMs))} / ${this.formatTime(this.targetDurationMs)}`;
      if (this.progressBar) this.progressBar.style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;
    }
    if (this.liveErrors) this.liveErrors.textContent = String(this.totalErrors);
    if (this.errorDetail) this.errorDetail.textContent = this.tokenErrors ? `Current token: ${this.tokenErrors} ${this.tokenErrors === 1 ? "error" : "errors"}` : "Current token: clean";
    if (this.wpmGauge) this.wpmGauge.style.width = `${Math.min(100, (wpm / Math.max(1, this.lesson.targetWpm * 1.2)) * 100)}%`;
    if (this.accuracyGauge) this.accuracyGauge.style.width = `${Math.max(0, Math.min(100, accuracy))}%`;
    if (this.progressGauge) this.progressGauge.style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;
    this.wpmInstrument?.classList.toggle("target-met", wpm >= this.lesson.targetWpm && this.engine.totalChars >= 10);
    this.accuracyInstrument?.classList.toggle("target-met", accuracy >= this.lesson.targetAccuracy);
    this.errorInstrument?.classList.toggle("has-errors", this.tokenErrors > 0);
  }

  formatTime(ms = 0) {
    const seconds = Math.max(0, Math.round(Number(ms) / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  escapeAttr(value = "") {
    return this.escape(value).replaceAll('"', "&quot;");
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
