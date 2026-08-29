import { hyperSoftShouldBypassTypingEvent } from "./accessibilityUtils.js";
export class TypingAssessmentExercise {
  constructor({ stage, engine, finish }) {
    this.stage = stage;
    this.engine = engine;
    this.finish = finish;
    this.running = false;
    this.finished = false;
    this.phaseIndex = 0;
    this.cursor = 0;
    this.errors = 0;
    this.backspaces = 0;
    this.correctKeyTimes = [];
    this.lastCorrectAt = null;
    this.pairAttemptedPositions = new Set();
    this.phaseStats = [];
    this.phaseStartAt = 0;
    this.phaseStartErrors = 0;
    this.handleKeydown = this.handleKeydown.bind(this);
    this.phases = [
      {
        id: "foundation",
        label: "Phase 1 of 3",
        title: "Foundational Control",
        subtitle: "Common words and steady spacing. Establish a natural baseline without trying to sprint.",
        text: "steady hands return to the home row after each reach. accurate typing grows from calm movement, light keystrokes, and a rhythm that can continue without strain. keep your eyes on the screen and let each finger return toward its usual position before the next reach."
      },
      {
        id: "mixed",
        label: "Phase 2 of 3",
        title: "Mixed Keyboard Control",
        subtitle: "Capitalization, punctuation, apostrophes, numbers, and symbols expose hesitation outside ordinary words.",
        text: "At 9:30 AM, Jordan typed: \"Review invoice #4827, then email Blake's notes.\" The file was named Q3_Report-2026.txt, and the total was $1,245.80. Clean Shift use, punctuation, and number-row reaches matter more than a brief burst of speed."
      },
      {
        id: "sustained",
        label: "Phase 3 of 3",
        title: "Sustained Passage",
        subtitle: "A longer passage measures sustainable pace, accuracy, rhythm, and hesitation under ordinary prose.",
        text: "Strong typists do not simply move fast for a few seconds. They maintain a pace that survives complete sentences, unfamiliar words, punctuation, and small changes in rhythm. When a mistake occurs, the useful response is controlled correction rather than tension or panic. A reliable typist reads slightly ahead, keeps the hands close to home position, and allows speed to come from reduced hesitation. HyperSoft uses this final passage to compare raw pace with accuracy and consistency. Blake uses it to remind everyone that his personal record was achieved under conditions that cannot be independently verified."
      }
    ];
  }

  start() {
    this.running = true;
    this.stage.innerHTML = `
      <div class="assessment-workstation">
        <div class="assessment-console-titlebar">
          <div><small>HyperSoft Placement Center</small><strong>Typing Assessment</strong></div>
          <span>Diagnostic Session</span>
        </div>
        <div class="assessment-phase-tabs" id="assessmentPhaseTabs"></div>
        <div class="assessment-live-grid" aria-label="Live assessment metrics">
          <div><span>WPM</span><strong id="assessmentLiveWpm">0</strong></div>
          <div><span>Accuracy</span><strong id="assessmentLiveAccuracy">100%</strong></div>
          <div><span>Rhythm</span><strong id="assessmentLiveRhythm">—</strong></div>
          <div><span>Errors</span><strong id="assessmentLiveErrors">0</strong></div>
        </div>
        <section class="assessment-passage-panel">
          <div class="assessment-passage-heading"><div><span id="assessmentPhaseLabel"></span><h3 id="assessmentPhaseTitle"></h3></div><span id="assessmentPhaseProgress">0%</span></div>
          <p id="assessmentPhaseSubtitle"></p>
          <div class="assessment-passage" id="assessmentPassage" tabindex="-1" aria-label="Assessment passage"></div>
          <div class="assessment-next-row"><span>Next key</span><strong id="assessmentNextKey">—</strong><small id="assessmentStatus" aria-live="polite">Just start typing. No click is required.</small></div>
          <div class="assessment-progress-track" aria-hidden="true"><span id="assessmentProgressFill"></span></div>
        </section>
        <div class="assessment-note"><strong>How HyperSoft scores this</strong><span>Wrong keys count against first-attempt accuracy but do not move the passage forward. Rhythm is based on the consistency of correct-key timing, with long hesitations penalized. This is a placement diagnostic, not a certification exam.</span></div>
      </div>`;
    this.tabs = this.stage.querySelector("#assessmentPhaseTabs");
    this.liveWpm = this.stage.querySelector("#assessmentLiveWpm");
    this.liveAccuracy = this.stage.querySelector("#assessmentLiveAccuracy");
    this.liveRhythm = this.stage.querySelector("#assessmentLiveRhythm");
    this.liveErrors = this.stage.querySelector("#assessmentLiveErrors");
    this.phaseLabel = this.stage.querySelector("#assessmentPhaseLabel");
    this.phaseTitle = this.stage.querySelector("#assessmentPhaseTitle");
    this.phaseSubtitle = this.stage.querySelector("#assessmentPhaseSubtitle");
    this.passage = this.stage.querySelector("#assessmentPassage");
    this.nextKey = this.stage.querySelector("#assessmentNextKey");
    this.status = this.stage.querySelector("#assessmentStatus");
    this.progressFill = this.stage.querySelector("#assessmentProgressFill");
    this.phaseProgress = this.stage.querySelector("#assessmentPhaseProgress");
    this.renderTabs();
    this.startPhase(0);
    window.addEventListener("keydown", this.handleKeydown);
    this.engine.updateHUD();
  }

  startPhase(index) {
    this.phaseIndex = index;
    this.cursor = 0;
    this.phaseStartAt = performance.now();
    this.phaseStartErrors = this.errors;
    this.lastCorrectAt = null;
    this.pairAttemptedPositions.clear();
    const phase = this.phases[index];
    this.phaseLabel.textContent = phase.label;
    this.phaseTitle.textContent = phase.title;
    this.phaseSubtitle.textContent = phase.subtitle;
    this.status.textContent = index === 0 ? "Just start typing. No click is required." : "Next phase loaded. Continue when ready.";
    this.status.className = "";
    this.renderTabs();
    this.renderPassage();
    this.updateLiveMetrics();
  }

  renderTabs() {
    if (!this.tabs) return;
    this.tabs.innerHTML = this.phases.map((phase, index) => `<span class="${index < this.phaseIndex ? "complete" : index === this.phaseIndex ? "current" : ""}">${index < this.phaseIndex ? "✓" : index + 1} ${phase.title}</span>`).join("");
  }

  handleKeydown(event) {
    if (!this.running || event.ctrlKey || event.metaKey || event.altKey) return;
    if (hyperSoftShouldBypassTypingEvent(event)) return;
    if (event.key === "Backspace") {
      event.preventDefault();
      this.backspaces += 1;
      this.errors += 1;
      this.engine.recordKeystroke(false, 0, this.currentExpected());
      this.status.textContent = "Backspace is recorded as hesitation/correction behavior here. Type the highlighted expected key to continue.";
      this.status.className = "bad";
      this.updateLiveMetrics();
      return;
    }
    if (event.key.length !== 1) return;
    event.preventDefault();
    const expected = this.currentExpected();
    if (expected == null) return;
    const typed = event.key;
    const correct = typed === expected;
    const phase = this.phases[this.phaseIndex];
    const pairPosition = `${this.phaseIndex}:${this.cursor}`;
    if (this.cursor > 0 && !this.pairAttemptedPositions.has(pairPosition)) {
      this.engine.recordPairAttempt(correct, phase.text[this.cursor - 1], expected);
      this.pairAttemptedPositions.add(pairPosition);
    }
    this.engine.recordKeystroke(correct, correct ? 0.5 : 0, expected);

    if (correct) {
      const now = performance.now();
      if (this.lastCorrectAt != null) this.correctKeyTimes.push(now - this.lastCorrectAt);
      this.lastCorrectAt = now;
      this.cursor += 1;
      this.status.textContent = "Good. Keep a sustainable pace and stay slightly ahead of the highlight.";
      this.status.className = "good";
      if (this.cursor >= phase.text.length) {
        this.completePhase();
        return;
      }
    } else {
      this.errors += 1;
      this.status.textContent = `Expected ${this.describeKey(expected)} — received ${this.describeKey(typed)}. Type the expected key to continue.`;
      this.status.className = "bad";
      this.stage.classList.remove("assessment-error-flash");
      void this.stage.offsetWidth;
      this.stage.classList.add("assessment-error-flash");
    }
    this.renderPassage();
    this.updateLiveMetrics();
    this.engine.updateHUD();
  }

  completePhase() {
    const phase = this.phases[this.phaseIndex];
    const durationMs = Math.max(1, performance.now() - this.phaseStartAt);
    this.phaseStats.push({
      id: phase.id,
      title: phase.title,
      durationMs: Math.round(durationMs),
      chars: phase.text.length,
      errors: this.errors - this.phaseStartErrors,
      grossWpm: Math.round(((phase.text.length / 5) / (durationMs / 60000)) * 10) / 10
    });
    if (this.phaseIndex < this.phases.length - 1) {
      this.startPhase(this.phaseIndex + 1);
      return;
    }
    this.completeAssessment();
  }

  completeAssessment() {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    window.removeEventListener("keydown", this.handleKeydown);
    const rhythm = this.getRhythmMetrics();
    const weakKeyMetrics = this.engine.getSessionWeakKeys(6).map(item => ({
      key: this.formatKey(item.key),
      accuracy: Math.round(item.accuracy)
    }));
    const weakKeys = weakKeyMetrics.map(item => `${item.key} ${item.accuracy}%`);
    const weakPairs = this.engine.getSessionWeakPairs(5).map(item => `${item.pair.toUpperCase()} ${Math.round(item.accuracy)}%`);
    const wpm = Math.round(this.engine.calculateWPM());
    const accuracy = Math.round(this.engine.calculateAccuracy());
    const score = Math.max(0, Math.round(wpm * 12 + accuracy * 8 + rhythm.score * 4 - this.errors * 2));
    this.finish({
      success: true,
      score,
      title: "Placement Assessment Complete",
      message: "HyperSoft has enough sustained typing data to recommend a starting path.",
      rhythmScore: rhythm.score,
      medianIntervalMs: rhythm.median,
      hesitations: rhythm.hesitations,
      backspaces: this.backspaces,
      weakKeys: weakKeys.length ? weakKeys.join(", ") : "No clear weak key in this sample",
      assessmentWeakKeyMetrics: weakKeyMetrics,
      assessmentWeakPairs: weakPairs.join(", "),
      assessmentPhaseStats: this.phaseStats,
      extraStats: [
        ["Rhythm consistency", `${rhythm.score}%`],
        ["Long hesitations", rhythm.hesitations],
        ["Backspace attempts", this.backspaces],
        ["Trouble pairs", weakPairs.length ? weakPairs.join(", ") : "None established"]
      ]
    });
  }

  currentExpected() {
    return this.phases[this.phaseIndex]?.text[this.cursor] ?? null;
  }

  renderPassage() {
    const phase = this.phases[this.phaseIndex];
    if (!phase || !this.passage) return;
    const before = this.escape(phase.text.slice(0, this.cursor));
    const next = this.escape(phase.text[this.cursor] ?? "");
    const after = this.escape(phase.text.slice(this.cursor + (this.cursor < phase.text.length ? 1 : 0)));
    this.passage.innerHTML = `<span class="typed">${before}</span>${next ? `<mark>${next}</mark>` : ""}<span>${after}</span>`;
    const progress = phase.text.length ? this.cursor / phase.text.length : 1;
    const overallBefore = this.phases.slice(0, this.phaseIndex).reduce((sum, item) => sum + item.text.length, 0);
    const total = this.phases.reduce((sum, item) => sum + item.text.length, 0);
    const overall = total ? (overallBefore + this.cursor) / total : 1;
    this.phaseProgress.textContent = `${Math.round(progress * 100)}%`;
    this.progressFill.style.width = `${Math.round(overall * 100)}%`;
    this.nextKey.textContent = this.describeKey(this.currentExpected(), true);
  }

  updateLiveMetrics() {
    if (this.liveWpm) this.liveWpm.textContent = String(Math.round(this.engine.calculateWPM()));
    if (this.liveAccuracy) this.liveAccuracy.textContent = `${Math.round(this.engine.calculateAccuracy())}%`;
    if (this.liveErrors) this.liveErrors.textContent = String(this.errors);
    if (this.liveRhythm) {
      const rhythm = this.getRhythmMetrics();
      this.liveRhythm.textContent = this.correctKeyTimes.length >= 12 ? `${rhythm.score}%` : "Collecting…";
    }
  }

  getRhythmMetrics() {
    const values = this.correctKeyTimes.filter(value => Number.isFinite(value) && value >= 20 && value <= 5000);
    if (values.length < 3) return { score: 100, median: 0, hesitations: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] || 1;
    const deviations = values.map(value => Math.abs(value - median));
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    const hesitations = values.filter(value => value > Math.max(1100, median * 3.2)).length;
    const hesitationRate = hesitations / values.length;
    const variabilityPenalty = Math.min(75, (avgDeviation / Math.max(1, median)) * 72);
    const hesitationPenalty = Math.min(30, hesitationRate * 180);
    return {
      score: Math.max(0, Math.min(100, Math.round(100 - variabilityPenalty - hesitationPenalty))),
      median: Math.round(median),
      hesitations
    };
  }

  getHUDTime() {
    this.updateLiveMetrics();
    return this.engine.getElapsedMs();
  }

  stop() {
    this.running = false;
    window.removeEventListener("keydown", this.handleKeydown);
  }

  describeKey(value, compact = false) {
    if (value == null) return "Complete";
    if (value === " ") return "Space";
    if (value === "\n") return "Enter";
    if (compact) return value;
    return `“${value}”`;
  }

  formatKey(value) {
    if (value === " ") return "Space";
    if (/^[A-Z]$/.test(value)) return `${value} (Shift)`;
    return value;
  }

  escape(value = "") {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }
}
