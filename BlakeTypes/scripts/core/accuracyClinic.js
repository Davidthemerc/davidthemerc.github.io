import { hyperSoftShouldBypassTypingEvent } from "./accessibilityUtils.js";
export const ACCURACY_CLINIC_PROTOCOLS = [
  {
    id: "cleanSlate",
    number: "01",
    title: "Clean Slate",
    subtitle: "Short, familiar prose with a 100% first-attempt accuracy gate.",
    icon: "✓",
    tags: ["100% Gate", "Common Prose", "Control"],
    baseWpm: 24,
    accuracyGate: 100,
    rounds: [
      "Calm hands make clean work. Keep each movement small, return toward home position, and let accuracy set the pace.",
      "Reliable typing feels almost boring. Read ahead, press each key once, and protect the clean streak from beginning to end."
    ],
    guide: [
      "Clean Slate is deliberately unforgiving: the first-attempt accuracy target is 100%.",
      "A wrong key stays on the current character and breaks the clean streak, but it never locks or ends the session.",
      "The goal is controlled movement, not a personal speed record.",
      "Use this protocol when you need to prove that you can type cleanly before trying to type faster."
    ]
  },
  {
    id: "controlledPace",
    number: "02",
    title: "Controlled Pace",
    subtitle: "Hold useful speed without letting accuracy collapse during longer sentences.",
    icon: "≈",
    tags: ["99% Gate", "Pace Zone", "Rhythm"],
    baseWpm: 32,
    accuracyGate: 99,
    paceCeilingFactor: 1.38,
    rounds: [
      "A controlled typist does not race the first sentence and survive the second by luck. Build a pace that stays accurate when the wording changes and the line keeps moving.",
      "Speed is useful only when it remains dependable. Keep the shoulders relaxed, watch the next few words, and resist the urge to accelerate after an easy phrase.",
      "The strongest pace is the one you can repeat. Let clean transitions produce speed instead of forcing the hands to move faster than the eyes can supervise."
    ],
    guide: [
      "Controlled Pace uses a 99% accuracy gate and watches for speed bursts far above the protocol's recommended zone.",
      "A pace alert is coaching, not a penalty. It means your current speed is outrunning the precision objective.",
      "Try to keep WPM near the displayed target rather than treating every drill as a race.",
      "The final result shows both accuracy and how often HyperSoft detected an unnecessary pace surge."
    ]
  },
  {
    id: "punctuationPrecision",
    number: "03",
    title: "Punctuation Precision",
    subtitle: "Quotes, apostrophes, parentheses, numbers, symbols, and Shift work under a 99% gate.",
    icon: ";",
    tags: ["99% Gate", "Punctuation", "Shift"],
    baseWpm: 27,
    accuracyGate: 99,
    rounds: [
      "At 10:45 AM, Casey wrote: \"Please review file Q4_Report-2026.txt before 2:00 PM.\" The total was $842.75, not $824.75.",
      "Blake's note said, \"Use folder C:\\Training\\Final (not C:\\Training\\Drafts).\" HyperSoft Compliance added: \"And lock the workstation first.\"",
      "Status: 98% complete; 2 items remain. Email training+review@example.org, then record REF-26/0814 in the tracker."
    ],
    guide: [
      "Punctuation Precision targets the places where otherwise strong typists often lose rhythm.",
      "Every Shifted letter, quote, apostrophe, slash, backslash, colon, percentage sign, digit, and decimal point counts exactly.",
      "Slow down briefly around a difficult symbol if that protects first-attempt accuracy.",
      "This protocol is especially useful after Technique Coach reports a large mixed-key slowdown."
    ]
  },
  {
    id: "weaknessRepair",
    number: "04",
    title: "Weakness Repair",
    subtitle: "Builds a precision passage around this learner's established weak keys and trouble pairs.",
    icon: "◇",
    tags: ["Adaptive", "98% Gate", "Remediation"],
    baseWpm: 28,
    accuracyGate: 98,
    adaptive: true,
    rounds: [],
    guide: [
      "Weakness Repair reads the active profile's established weak keys and troublesome two-letter transitions.",
      "It generates an exact-entry passage weighted toward those movements while still mixing in normal language.",
      "If the profile does not yet have enough adaptive evidence, HyperSoft falls back to a broad precision passage.",
      "Repeat the protocol after more training to see whether the same errors remain dominant."
    ]
  },
  {
    id: "nearPerfectEndurance",
    number: "05",
    title: "Near-Perfect Endurance",
    subtitle: "A longer sustained passage with a 99% gate and no excuse for late-session sloppiness.",
    icon: "★",
    tags: ["99% Gate", "Endurance", "Sustained Prose"],
    baseWpm: 38,
    accuracyGate: 99,
    rounds: [
      "Accurate typing over a short burst is useful, but professional reliability depends on maintaining control after the easy opening has passed. The hands should remain relaxed while the eyes continue reading slightly ahead of the current character. When unfamiliar wording appears, preserve the rhythm rather than stabbing at the keyboard and hoping the correction key can repair the result later.",
      "A sustained accuracy standard changes the objective. Instead of chasing the highest momentary speed, the typist protects each transition, notices punctuation before reaching it, and lets difficult words pass at a slightly slower pace. This approach usually produces better net speed because fewer mistakes interrupt the flow and less time is spent recovering from avoidable errors.",
      "HyperSoft considers this protocol complete when the entire passage has been typed. The accuracy gate is intentionally strict because the exercise is designed for learners who already possess usable speed. Blake considers it complete when nobody asks to audit the conditions under which his own historical typing records were produced."
    ],
    guide: [
      "Near-Perfect Endurance is the clinic's longest precision protocol.",
      "The 99% gate applies across the entire sustained passage, including late-session errors.",
      "Do not sprint the first paragraph. HyperSoft is looking for precision that survives the whole session.",
      "Use this after Clean Slate or Controlled Pace when you want to test whether improved accuracy holds under endurance."
    ]
  }
];

const ACCURACY_FALLBACK_WORDS = [
  "steady","return","reach","screen","typing","accurate","control","practice","rhythm","finger","position","light","movement","clean","repeat","reliable","focus","review","report","office","record","system","update","simple","careful","letter","transition","keyboard","balance","current","future","project","training","result","correct","method","detail","document","confirm","support","complete","standard","session","improve","target","quality","direct","number","account","people","process","before","after","between","without","through","because","important","another","however","during","should","would","could","their","there","where","which","while","every","first","second","final","change","small","strong","smooth","normal","problem","solution","status","message","folder","reviewed","prepared","available","continue","practice","accuracy","precision"
];

function accuracyClinicRandom(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function accuracyClinicNormalizeKey(value) {
  const key = String(value ?? "");
  return /^[a-z]$/i.test(key) ? key.toLowerCase() : key;
}

export function getAccuracyClinicProtocol(id) {
  return ACCURACY_CLINIC_PROTOCOLS.find(item => item.id === id) ?? null;
}

export function buildAccuracyClinicProtocol(id, { weakKeys = [], weakPairs = [] } = {}) {
  const base = getAccuracyClinicProtocol(id);
  if (!base) return null;
  if (!base.adaptive) return { ...base, rounds: [...base.rounds] };

  const keys = weakKeys
    .map(item => accuracyClinicNormalizeKey(item?.key))
    .filter(key => /^[a-z]$/.test(key))
    .slice(0, 6);
  const pairs = weakPairs
    .map(item => String(item?.pair ?? "").toLowerCase())
    .filter(pair => /^[a-z]{2}$/.test(pair))
    .slice(0, 5);

  const weighted = ACCURACY_FALLBACK_WORDS.filter(word =>
    keys.some(key => word.includes(key)) || pairs.some(pair => word.includes(pair))
  );
  const pool = weighted.length >= 12 ? weighted : ACCURACY_FALLBACK_WORDS;
  const generated = [];
  for (let round = 0; round < 3; round += 1) {
    const words = [];
    for (let i = 0; i < 34; i += 1) {
      let word = accuracyClinicRandom(pool);
      if (pairs.length && i % 7 === 0) {
        const pair = accuracyClinicRandom(pairs);
        const pairWord = pool.find(item => item.includes(pair));
        if (pairWord) word = pairWord;
      }
      words.push(word);
    }
    generated.push(words.join(" ") + ".");
  }
  const focus = [
    keys.length ? `keys ${keys.map(key => key.toUpperCase()).join(" ")}` : null,
    pairs.length ? `pairs ${pairs.map(pair => pair.toUpperCase()).join(" ")}` : null
  ].filter(Boolean).join(" · ") || "broad accuracy coverage";
  return { ...base, rounds: generated, adaptiveFocus: focus };
}

export class AccuracyClinicExercise {
  constructor({ stage, engine, finish, protocol, difficulty = "normal" }) {
    this.stage = stage;
    this.engine = engine;
    this.finish = finish;
    this.protocol = protocol;
    this.difficulty = difficulty;
    this.running = false;
    this.finished = false;
    this.roundIndex = 0;
    this.cursor = 0;
    this.errors = 0;
    this.backspaces = 0;
    this.cleanStreak = 0;
    this.bestCleanStreak = 0;
    this.paceAlerts = 0;
    this.roundErrors = 0;
    this.roundStartedAt = 0;
    this.roundStats = [];
    this.mistakeMap = new Map();
    this.pairAttemptedPositions = new Set();
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  getTargets() {
    const speedFactor = { novice:.72, easy:.86, normal:1, challenging:1.12, hard:1.24, expert:1.36 }[this.difficulty] ?? 1;
    return {
      wpm: Math.max(15, Math.round(this.protocol.baseWpm * speedFactor)),
      accuracy: this.protocol.accuracyGate
    };
  }

  start() {
    this.running = true;
    const targets = this.getTargets();
    this.stage.innerHTML = `
      <div class="accuracy-clinic-workstation">
        <div class="accuracy-clinic-titlebar">
          <div><small>HyperSoft Precision Services</small><strong>${this.escape(this.protocol.title)}</strong></div>
          <span>ACCURACY CLINIC</span>
        </div>
        <div class="accuracy-clinic-tabs" id="accuracyClinicTabs"></div>
        <div class="accuracy-clinic-live-grid">
          <div><span>WPM</span><strong id="accuracyClinicWpm">0</strong><small>Target ${targets.wpm}</small></div>
          <div><span>Accuracy</span><strong id="accuracyClinicAccuracy">100%</strong><small>Gate ${targets.accuracy}%</small></div>
          <div><span>Clean Streak</span><strong id="accuracyClinicStreak">0</strong><small>Best 0</small></div>
          <div><span>Errors</span><strong id="accuracyClinicErrors">0</strong><small>First-attempt misses</small></div>
        </div>
        <div class="accuracy-clinic-gate-row">
          <div><span>Precision Gate</span><strong>${targets.accuracy}%</strong></div>
          <div class="accuracy-clinic-gate-track"><span id="accuracyClinicGateFill"></span></div>
          <div id="accuracyClinicGateStatus">Gate currently protected</div>
        </div>
        <section class="accuracy-clinic-passage-panel">
          <div class="accuracy-clinic-passage-heading"><div><small id="accuracyClinicRoundLabel"></small><h3 id="accuracyClinicRoundTitle"></h3></div><span id="accuracyClinicRoundProgress">0%</span></div>
          <p id="accuracyClinicRoundNote"></p>
          <div class="accuracy-clinic-passage" id="accuracyClinicPassage" tabindex="-1"></div>
          <div class="accuracy-clinic-next-row"><span>Next key</span><strong id="accuracyClinicNextKey">—</strong><small id="accuracyClinicStatus" aria-live="polite">Start typing. Protect the clean streak.</small></div>
          <div class="accuracy-clinic-progress"><span id="accuracyClinicProgressFill"></span></div>
        </section>
        <div class="accuracy-clinic-note"><strong>Clinic rule</strong><span>Wrong keys never advance the text. HyperSoft records the first miss, leaves the expected character highlighted, and uses the pattern for remediation.</span></div>
      </div>`;
    this.tabs = this.stage.querySelector("#accuracyClinicTabs");
    this.liveWpm = this.stage.querySelector("#accuracyClinicWpm");
    this.liveAccuracy = this.stage.querySelector("#accuracyClinicAccuracy");
    this.liveStreak = this.stage.querySelector("#accuracyClinicStreak");
    this.liveErrors = this.stage.querySelector("#accuracyClinicErrors");
    this.gateFill = this.stage.querySelector("#accuracyClinicGateFill");
    this.gateStatus = this.stage.querySelector("#accuracyClinicGateStatus");
    this.roundLabel = this.stage.querySelector("#accuracyClinicRoundLabel");
    this.roundTitle = this.stage.querySelector("#accuracyClinicRoundTitle");
    this.roundNote = this.stage.querySelector("#accuracyClinicRoundNote");
    this.roundProgress = this.stage.querySelector("#accuracyClinicRoundProgress");
    this.passage = this.stage.querySelector("#accuracyClinicPassage");
    this.nextKey = this.stage.querySelector("#accuracyClinicNextKey");
    this.status = this.stage.querySelector("#accuracyClinicStatus");
    this.progressFill = this.stage.querySelector("#accuracyClinicProgressFill");
    this.startRound(0);
    window.addEventListener("keydown", this.handleKeydown);
    this.engine.updateHUD();
  }

  startRound(index) {
    this.roundIndex = index;
    this.cursor = 0;
    this.roundErrors = 0;
    this.roundStartedAt = performance.now();
    this.pairAttemptedPositions.clear();
    this.roundLabel.textContent = `Round ${index + 1} of ${this.protocol.rounds.length}`;
    this.roundTitle.textContent = this.protocol.adaptive && this.protocol.adaptiveFocus ? `Adaptive focus: ${this.protocol.adaptiveFocus}` : this.protocol.title;
    this.roundNote.textContent = this.getRoundCoaching(index);
    this.status.textContent = index ? "Next precision round loaded. Keep the reset clean." : "Start typing. Protect the clean streak.";
    this.status.className = "";
    this.renderTabs();
    this.renderPassage();
    this.updateMetrics();
  }

  getRoundCoaching(index) {
    if (this.protocol.id === "cleanSlate") return index === 0 ? "Do not chase speed. Every first attempt matters." : "Second pass: keep the same calm movement after the novelty is gone.";
    if (this.protocol.id === "controlledPace") return "Stay near the target pace. A speed burst that damages accuracy defeats the protocol.";
    if (this.protocol.id === "punctuationPrecision") return "Read one symbol ahead. Let Shift and punctuation fit into the rhythm instead of interrupting it.";
    if (this.protocol.id === "weaknessRepair") return "This passage is weighted toward movements already identified in your learner profile.";
    return index === 0 ? "Set a pace you can sustain for the entire protocol." : "Late-session precision counts just as much as the opening line.";
  }

  renderTabs() {
    this.tabs.innerHTML = this.protocol.rounds.map((_, index) => `<span class="${index < this.roundIndex ? "complete" : index === this.roundIndex ? "current" : ""}">${index < this.roundIndex ? "✓" : index + 1} Round ${index + 1}</span>`).join("");
  }

  currentText() {
    return this.protocol.rounds[this.roundIndex] ?? "";
  }

  expectedKey() {
    return this.currentText()[this.cursor] ?? null;
  }

  handleKeydown(event) {
    if (!this.running || event.ctrlKey || event.metaKey || event.altKey) return;
    if (hyperSoftShouldBypassTypingEvent(event)) return;
    if (event.key === "Backspace") {
      event.preventDefault();
      const expected = this.expectedKey();
      this.backspaces += 1;
      this.errors += 1;
      this.roundErrors += 1;
      this.cleanStreak = 0;
      this.engine.recordKeystroke(false, 0, expected === "\n" ? null : expected);
      this.recordMistake(expected, "Backspace");
      this.status.textContent = "Correction attempt recorded. The clean streak has reset; type the highlighted key to continue.";
      this.status.className = "bad";
      this.updateMetrics();
      return;
    }
    let typed = event.key;
    if (typed === "Enter") typed = "\n";
    else if (typed.length !== 1) return;
    event.preventDefault();
    const expected = this.expectedKey();
    if (expected == null) return;
    const correct = typed === expected;
    const pairPosition = `${this.roundIndex}:${this.cursor}`;
    if (this.cursor > 0 && !this.pairAttemptedPositions.has(pairPosition)) {
      this.engine.recordPairAttempt(correct, this.currentText()[this.cursor - 1], expected);
      this.pairAttemptedPositions.add(pairPosition);
    }
    this.engine.recordKeystroke(correct, correct ? .45 : 0, expected === "\n" ? null : expected);

    if (correct) {
      this.cursor += 1;
      this.cleanStreak += 1;
      this.bestCleanStreak = Math.max(this.bestCleanStreak, this.cleanStreak);
      this.status.textContent = this.cleanStreak >= 40 ? `Clean streak ${this.cleanStreak}. Do not speed up just because it feels easy.` : "Correct. Keep the movement quiet and repeatable.";
      this.status.className = "good";
      this.checkPace();
      if (this.cursor >= this.currentText().length) {
        this.completeRound();
        return;
      }
    } else {
      this.errors += 1;
      this.roundErrors += 1;
      this.cleanStreak = 0;
      this.recordMistake(expected, typed);
      this.status.textContent = `Expected ${this.describeKey(expected)} — received ${this.describeKey(typed)}. Accuracy gate remains open to recovery, but the clean streak reset.`;
      this.status.className = "bad";
      this.stage.classList.remove("accuracy-clinic-error-flash");
      void this.stage.offsetWidth;
      this.stage.classList.add("accuracy-clinic-error-flash");
    }
    this.renderPassage();
    this.updateMetrics();
    this.engine.updateHUD();
  }

  checkPace() {
    if (!this.protocol.paceCeilingFactor || this.cursor < 30) return;
    const target = this.getTargets().wpm;
    const wpm = this.engine.calculateWPM();
    if (wpm > target * this.protocol.paceCeilingFactor && this.cursor % 18 === 0) {
      this.paceAlerts += 1;
      this.status.textContent = `Pace alert: ${Math.round(wpm)} WPM is above this protocol's precision zone. Protect accuracy before adding speed.`;
      this.status.className = "watch";
    }
  }

  recordMistake(expected, typed) {
    if (expected == null) return;
    const key = `${this.displayKey(expected)}←${this.displayKey(typed)}`;
    this.mistakeMap.set(key, (this.mistakeMap.get(key) || 0) + 1);
  }

  completeRound() {
    const durationMs = Math.max(1, performance.now() - this.roundStartedAt);
    const text = this.currentText();
    this.roundStats.push({
      round: this.roundIndex + 1,
      chars: text.length,
      errors: this.roundErrors,
      durationMs: Math.round(durationMs),
      grossWpm: Math.round(((text.length / 5) / (durationMs / 60000)) * 10) / 10
    });
    if (this.roundIndex < this.protocol.rounds.length - 1) {
      this.startRound(this.roundIndex + 1);
      return;
    }
    this.completeSession();
  }

  completeSession() {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    window.removeEventListener("keydown", this.handleKeydown);
    const targets = this.getTargets();
    const wpm = Math.round(this.engine.calculateWPM());
    const accuracy = Math.round(this.engine.calculateAccuracy() * 10) / 10;
    const met = accuracy >= targets.accuracy && wpm >= targets.wpm;
    if (met) this.engine.addScore(500 + Math.round(this.bestCleanStreak * .6));
    const mistakes = [...this.mistakeMap.entries()]
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a,b)=>b.count-a.count || a.pattern.localeCompare(b.pattern))
      .slice(0, 8);
    const weakKeys = this.engine.getSessionWeakKeys(6).map(item => `${this.formatKey(item.key)} ${Math.round(item.accuracy)}%`);
    const weakPairs = this.engine.getSessionWeakPairs(5).map(item => `${item.pair.toUpperCase()} ${Math.round(item.accuracy)}%`);
    this.finish({
      success: true,
      score: this.engine.score,
      title: met ? `${this.protocol.title}: Precision gate cleared` : `${this.protocol.title}: Clinic session complete`,
      message: met
        ? `Accuracy gate cleared at ${accuracy}% with ${wpm} WPM. The objective was controlled, repeatable precision.`
        : `Session complete at ${accuracy}% accuracy and ${wpm} WPM. Gate: ${targets.accuracy}% accuracy at ${targets.wpm} WPM.`,
      targetStatus: met ? "Met" : "Practice",
      variant: this.protocol.title,
      weakKeys: weakKeys.length ? weakKeys.join(", ") : "None",
      accuracyClinicProtocol: this.protocol.id,
      accuracyClinicMistakes: mistakes,
      accuracyClinicBestStreak: this.bestCleanStreak,
      accuracyClinicPaceAlerts: this.paceAlerts,
      accuracyClinicErrors: this.errors,
      accuracyClinicRounds: this.roundStats,
      accuracyClinicGate: targets.accuracy,
      extraStats: [
        ["Precision gate", `${targets.accuracy}%`],
        ["Best clean streak", `${this.bestCleanStreak} characters`],
        ["First-attempt errors", this.errors],
        ["Correction attempts", this.backspaces],
        ...(this.paceAlerts ? [["Pace alerts", this.paceAlerts]] : []),
        ...(mistakes.length ? [["Top error pattern", `${mistakes[0].pattern} ×${mistakes[0].count}`]] : []),
        ...(weakPairs.length ? [["Trouble pairs", weakPairs.join(", ")]] : [])
      ]
    });
  }

  renderPassage() {
    const text = this.currentText();
    const before = text.slice(0, this.cursor);
    const current = text[this.cursor] ?? "";
    const after = text.slice(this.cursor + (current ? 1 : 0));
    const currentHtml = current === "\n"
      ? `<span class="accuracy-clinic-current accuracy-clinic-newline">↵</span><br>`
      : current ? `<span class="accuracy-clinic-current">${this.escape(current)}</span>` : "";
    this.passage.innerHTML = `<span class="accuracy-clinic-done">${this.formatText(before)}</span>${currentHtml}<span class="accuracy-clinic-upcoming">${this.formatText(after)}</span>`;
    this.nextKey.textContent = this.displayKey(current);
    const progress = text.length ? this.cursor / text.length : 0;
    this.roundProgress.textContent = `${Math.round(progress * 100)}%`;
    const totalChars = this.protocol.rounds.reduce((sum,row)=>sum+row.length,0);
    const previousChars = this.protocol.rounds.slice(0,this.roundIndex).reduce((sum,row)=>sum+row.length,0);
    this.progressFill.style.width = `${Math.min(100, ((previousChars + this.cursor) / totalChars) * 100)}%`;
    requestAnimationFrame(()=>this.passage.querySelector(".accuracy-clinic-current")?.scrollIntoView?.({block:"nearest",inline:"nearest"}));
  }

  updateMetrics() {
    if (!this.running) return;
    const accuracy = this.engine.calculateAccuracy();
    const targets = this.getTargets();
    if (this.liveWpm) this.liveWpm.textContent = String(Math.round(this.engine.calculateWPM()));
    if (this.liveAccuracy) this.liveAccuracy.textContent = `${Math.round(accuracy * 10) / 10}%`;
    if (this.liveStreak) {
      this.liveStreak.textContent = String(this.cleanStreak);
      const small = this.liveStreak.parentElement?.querySelector("small");
      if (small) small.textContent = `Best ${this.bestCleanStreak}`;
    }
    if (this.liveErrors) this.liveErrors.textContent = String(this.errors);
    const gateRatio = Math.max(0, Math.min(1, accuracy / targets.accuracy));
    if (this.gateFill) this.gateFill.style.width = `${gateRatio * 100}%`;
    if (this.gateStatus) {
      this.gateStatus.textContent = accuracy >= targets.accuracy ? "Gate currently protected" : `${Math.round((targets.accuracy - accuracy) * 10) / 10} points below gate`;
      this.gateStatus.className = accuracy >= targets.accuracy ? "good" : "bad";
    }
  }

  getHUDTime() {
    this.updateMetrics();
    return this.engine.getElapsedMs();
  }

  stop() {
    this.running = false;
    window.removeEventListener("keydown", this.handleKeydown);
  }

  displayKey(value) {
    if (value === "\n") return "Enter";
    if (value === " ") return "Space";
    if (value === "Backspace") return "Backspace";
    return value || "Complete";
  }

  describeKey(value) {
    if (value === "\n") return "Enter";
    if (value === " ") return "Space";
    if (value === "Backspace") return "Backspace";
    return value ? `“${value}”` : "the end of the passage";
  }

  formatKey(value) {
    if (value === " ") return "Space";
    if (/^[A-Z]$/.test(value)) return `${value} (Shift)`;
    return value;
  }

  formatText(value = "") {
    return this.escape(value).replaceAll("\n", "<br>");
  }

  escape(value = "") {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }
}
