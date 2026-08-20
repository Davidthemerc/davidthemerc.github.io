const LAB_FAMILIES = [
  { id: "mossback", name: "Mossback", glyph: "M", note: "Broad-bodied and suspiciously comfortable in filing cabinets." },
  { id: "skyfin", name: "Skyfin", glyph: "S", note: "Long-limbed specimen with an aerodynamic interpretation of anatomy." },
  { id: "bulbkin", name: "Bulbkin", glyph: "B", note: "Round, bright-eyed, and probably not approved for the break room." },
  { id: "needlefoot", name: "Needlefoot", glyph: "N", note: "Tall, narrow, and built like it has somewhere else to be." }
];

const LAB_GOALS = {
  stability: { label: "Stability Build", describe: () => "Reach at least 7/8 correct strands." },
  precision: { label: "Precision Build", describe: () => "Complete all 8 strands correctly." },
  speed: { label: "Rapid Assembly", describe: limit => `Reach 7/8 correct with an average strand time under ${limit.toFixed(1)}s.` },
  research: { label: "Research Build", describe: () => "Reach at least 6/8 correct and complete the bonus DNA sequence." }
};

export class CreatureLabGame {
  constructor({ stage, engine, finish, gameOptions = {} }) {
    this.stage = stage;
    this.engine = engine;
    this.finish = finish;
    this.running = false;
    this.gameOptions = gameOptions;

    this.program = gameOptions.labProgram || "standard";
    this.batchSize = gameOptions.labBatchSize || "standard";
    this.strandsPerSpecimen = 8;

    const baseCount = ["challenging", "hard", "expert"].includes(engine.difficultyName) ? 4 : 3;
    const extra = this.batchSize === "extended" ? 1 : this.batchSize === "marathon" ? 2 : 0;
    this.specimenCount = baseCount + extra;

    this.specimenIndex = 0;
    this.currentIndex = 0;
    this.totalResolved = 0;
    this.correctThisSpecimen = 0;
    this.specimenResults = [];
    this.specimenTimes = [];
    this.currentFamily = null;
    this.currentGoal = null;
    this.currentGoalSpeedLimit = 4.5;
    this.currentRareTraits = 0;
    this.totalRareTraits = 0;
    this.bonusMode = false;
    this.bonusCompleted = false;
    this.goalsMet = 0;

    this.currentWord = "";
    this.strandStartedAt = 0;
    this.strandLimitMs = 9000;
    this.timerId = null;
    this.resolving = false;

    this.parts = [
      ["creature-body", ""],
      ["creature-head", ""],
      ["creature-eye", "left"],
      ["creature-eye", "right"],
      ["creature-leg", "left"],
      ["creature-leg", "right"],
      ["creature-arm", "left"],
      ["creature-tail", ""]
    ];

    this.handleKeydown = this.handleKeydown.bind(this);
  }

  start() {
    this.running = true;
    const profile = this.engine.getScaledDifficulty(0);
    this.strandLimitMs = 7600 * profile.timerFactor;

    this.stage.innerHTML = `
      <div class="stage-pad creature-layout">
        <div>
          <div class="mode-title-row">
            <div>
              <h3>Specimen assembly vat</h3>
              <div class="lab-batch-label" id="specimenLabel"></div>
            </div>
            <strong id="creatureTimer"></strong>
          </div>
          <div class="lab-goal-card" id="labGoalCard"></div>
          <div class="creature-vat" id="creatureVat" aria-label="Creature assembly area"></div>
          <div class="creature-parts-counter" id="strandCounter"></div>
          <div class="lab-specimen-results" id="specimenResults"></div>
        </div>
        <div>
          <div class="prompt-card">
            <span class="eyebrow" id="strandEyebrow">DNA strand</span>
            <div class="typing-prompt" id="strandPrompt"></div>
            <input
              id="strandInput"
              class="typing-input"
              autocomplete="off"
              spellcheck="false"
              aria-label="Typed DNA strand display"
              readonly
              tabindex="-1"
            />
            <div class="status-line" id="strandStatus">Just start typing — no click required. Enter submits early.</div>
          </div>
          <div class="lab-readout">
            <strong id="batchReadout"></strong>
            <span id="labProgramReadout"></span>
          </div>
          <p style="margin-top:1rem;color:var(--muted)">
            Each specimen belongs to a different family and receives a performance goal. Every archived build is followed by a short bonus DNA sequence, and rare spontaneous traits can appear without warning.
          </p>
        </div>
      </div>
    `;

    this.vat = this.stage.querySelector("#creatureVat");
    this.input = this.stage.querySelector("#strandInput");
    this.prompt = this.stage.querySelector("#strandPrompt");
    this.status = this.stage.querySelector("#strandStatus");
    this.timer = this.stage.querySelector("#creatureTimer");
    this.counter = this.stage.querySelector("#strandCounter");
    this.specimenLabel = this.stage.querySelector("#specimenLabel");
    this.specimenResultsEl = this.stage.querySelector("#specimenResults");
    this.batchReadout = this.stage.querySelector("#batchReadout");
    this.goalCard = this.stage.querySelector("#labGoalCard");
    this.eyebrow = this.stage.querySelector("#strandEyebrow");
    this.programReadout = this.stage.querySelector("#labProgramReadout");

    const programNames = {
      standard: "Standard Batch — balanced goals and ordinary mutation probability.",
      precision: "Precision Study — stricter goals, larger clean-build bonuses, fewer spontaneous traits.",
      mutation: "Mutation Survey — more spontaneous rare traits and more forgiving research goals."
    };
    this.programReadout.textContent = programNames[this.program] || programNames.standard;

    window.addEventListener("keydown", this.handleKeydown);
    this.prepareSpecimen();
    this.timerId = window.setInterval(() => this.tick(), 100);
  }

  prepareSpecimen() {
    if (!this.running) return;

    this.currentIndex = 0;
    this.correctThisSpecimen = 0;
    this.specimenTimes = [];
    this.currentRareTraits = 0;
    this.bonusMode = false;
    this.bonusCompleted = false;
    this.vat.innerHTML = "";
    this.input.disabled = false;

    this.currentFamily = this.pickFamily();
    this.currentGoal = this.pickGoal();
    const difficulty = this.engine.getScaledDifficulty(this.totalResolved / Math.max(1, this.specimenCount * this.strandsPerSpecimen));
    this.currentGoalSpeedLimit = Math.max(2.8, 4.7 * difficulty.timerFactor);

    this.vat.dataset.family = this.currentFamily.id;
    this.specimenLabel.textContent = `Specimen ${this.specimenIndex + 1} of ${this.specimenCount} • ${this.currentFamily.name}`;
    this.batchReadout.textContent = `Batch progress: ${this.specimenIndex}/${this.specimenCount} archived • ${this.totalRareTraits} rare traits found`;
    this.goalCard.innerHTML = `
      <div><span class="eyebrow">Build objective</span><strong>${LAB_GOALS[this.currentGoal].label}</strong></div>
      <span>${LAB_GOALS[this.currentGoal].describe(this.currentGoalSpeedLimit)}</span>
      <small>${this.currentFamily.note}</small>
    `;
    this.counter.innerHTML = Array.from({ length: this.strandsPerSpecimen }, (_, i) =>
      `<span class="strand-dot" data-dot="${i}"></span>`
    ).join("");

    this.nextStrand();
  }

  pickFamily() {
    const previous = this.specimenResults.at(-1)?.familyId;
    const pool = LAB_FAMILIES.filter(item => item.id !== previous);
    return pool[Math.floor(Math.random() * pool.length)] || LAB_FAMILIES[0];
  }

  pickGoal() {
    const pools = {
      standard: ["stability", "stability", "precision", "speed", "research"],
      precision: ["precision", "precision", "speed", "stability"],
      mutation: ["research", "research", "stability", "speed"]
    };
    const pool = pools[this.program] || pools.standard;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  nextStrand() {
    this.resolving = false;
    this.bonusMode = false;
    const totalStrands = this.specimenCount * this.strandsPerSpecimen;
    const progress = this.totalResolved / totalStrands;
    const profile = this.engine.getScaledDifficulty(progress);
    this.strandLimitMs = 7600 * profile.timerFactor;
    this.currentWord = this.engine.generateWord(undefined, { progress });
    this.strandStartedAt = performance.now();
    this.eyebrow.textContent = "DNA strand";
    this.prompt.textContent = this.currentWord;
    this.input.value = "";
    this.status.textContent = `Strand ${this.currentIndex + 1}/${this.strandsPerSpecimen} — just type; no click required.`;
    this.status.className = "status-line";
  }

  startBonusRound() {
    if (!this.running) return;
    this.resolving = false;
    this.bonusMode = true;
    this.input.disabled = false;
    const progress = this.totalResolved / Math.max(1, this.specimenCount * this.strandsPerSpecimen);
    const profile = this.engine.getScaledDifficulty(progress);
    this.strandLimitMs = Math.max(2600, 4700 * profile.timerFactor);
    this.currentWord = this.engine.generateWord(undefined, {
      progress,
      min: Math.max(5, profile.wordMin + 1),
      max: Math.min(15, profile.wordMax + 2)
    });
    this.strandStartedAt = performance.now();
    this.eyebrow.textContent = "Bonus DNA sequence";
    this.prompt.textContent = this.currentWord;
    this.input.value = "";
    this.status.textContent = "Bonus sequence: type it before the short research timer expires for extra points.";
    this.status.className = "status-line";
  }

  handleKeydown(event) {
    if (!this.running || this.resolving || this.input?.disabled) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.target instanceof HTMLElement &&
        event.target.matches("button, select, textarea, a[href], input:not(#strandInput)")) return;

    if (event.key === "Backspace") {
      event.preventDefault();
      this.input.value = this.input.value.slice(0, -1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.input.value = "";
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      this.resolveCurrent(this.input.value.toLowerCase() === this.currentWord);
      return;
    }

    if (!/^[a-zA-Z]$/.test(event.key)) return;
    event.preventDefault();
    this.input.value += event.key.toLowerCase();
    const value = this.input.value.toLowerCase();

    if (value === this.currentWord) this.resolveCurrent(true);
    else if (!this.currentWord.startsWith(value)) {
      this.status.textContent = this.bonusMode
        ? "Bonus sequence diverged. Backspace quickly or submit the failed research sample."
        : "That strand has diverged. Backspace to correct it, or press Enter to submit the mutation.";
      this.status.className = "status-line bad";
    }
  }

  resolveCurrent(correct) {
    if (this.bonusMode) this.resolveBonus(correct);
    else this.resolveStrand(correct);
  }

  resolveStrand(correct) {
    if (!this.running || this.resolving) return;
    this.resolving = true;

    const elapsed = performance.now() - this.strandStartedAt;
    this.specimenTimes.push(elapsed);
    const typed = this.input.value.toLowerCase();
    this.engine.recordTextAttempt(typed, this.currentWord, {
      correctPoints: 125 + this.currentWord.length * 8,
      wrongPenalty: 20
    });

    const [baseClass, side] = this.parts[this.currentIndex];
    const part = document.createElement("div");
    part.className = `creature-part ${baseClass} ${side} ${correct ? "" : "mismatch"}`;

    const rareChance = this.program === "mutation" ? 0.18 : this.program === "precision" ? 0.035 : 0.075;
    const rare = Math.random() < rareChance;
    if (rare) {
      part.classList.add("rare-mutation");
      this.currentRareTraits += 1;
      this.totalRareTraits += 1;
      this.engine.addScore(70);
      this.spawnRareTrait();
    }

    const hue = (this.specimenIndex * 43) % 140;
    part.style.filter = correct ? `hue-rotate(${hue}deg)` : `hue-rotate(${hue + 120}deg) saturate(1.7)`;
    this.vat.appendChild(part);

    const dot = this.counter.querySelector(`[data-dot="${this.currentIndex}"]`);
    dot?.classList.add(correct ? "correct" : "wrong");
    if (rare) dot?.classList.add("rare");
    if (correct) this.correctThisSpecimen += 1;

    this.status.textContent = rare
      ? "Rare spontaneous trait detected. HyperSoft has increased its projected resale value."
      : correct
        ? "Sequence accepted. That anatomy looks alarmingly intentional."
        : "Sequence mismatch. HyperSoft has decided to classify it as a feature.";
    this.status.className = `status-line ${correct ? "good" : "bad"}`;

    this.currentIndex += 1;
    this.totalResolved += 1;
    this.engine.updateHUD();

    if (this.currentIndex >= this.strandsPerSpecimen) {
      this.completeSpecimenCore();
      return;
    }

    window.setTimeout(() => { if (this.running) this.nextStrand(); }, 400);
  }

  spawnRareTrait() {
    const trait = document.createElement("div");
    trait.className = "creature-rare-marker";
    trait.textContent = "✦";
    trait.style.left = `${30 + Math.random() * 40}%`;
    trait.style.top = `${20 + Math.random() * 48}%`;
    this.vat.appendChild(trait);
  }

  completeSpecimenCore() {
    this.input.disabled = true;
    const correct = this.correctThisSpecimen;
    const stability = Math.round((correct / this.strandsPerSpecimen) * 100);
    const averageMs = this.specimenTimes.length
      ? this.specimenTimes.reduce((sum, value) => sum + value, 0) / this.specimenTimes.length
      : 99999;
    const stableThreshold = this.program === "mutation" ? 6 : 7;
    const stable = correct >= stableThreshold;

    this.pendingSpecimen = { correct, stability, stable, averageMs };
    this.status.textContent = `Core assembly complete: ${stability}% stable. Bonus DNA sequence incoming…`;
    this.status.className = `status-line ${stable ? "good" : "bad"}`;
    this.prompt.textContent = "BONUS DNA…";

    window.setTimeout(() => { if (this.running) this.startBonusRound(); }, 650);
  }

  resolveBonus(correct) {
    if (!this.running || this.resolving) return;
    this.resolving = true;
    const typed = this.input.value.toLowerCase();
    this.engine.recordTextAttempt(typed, this.currentWord, {
      correctPoints: correct ? 260 + this.currentWord.length * 10 : 0,
      wrongPenalty: 0
    });
    this.bonusCompleted = correct;
    this.status.textContent = correct
      ? "Bonus DNA captured. Research grant probability increases by an imaginary amount."
      : "Bonus DNA lost. The main specimen remains archived anyway.";
    this.status.className = `status-line ${correct ? "good" : "bad"}`;
    this.archiveSpecimen();
  }

  archiveSpecimen() {
    const core = this.pendingSpecimen;
    const averageSeconds = core.averageMs / 1000;
    const goalMet = this.evaluateGoal(core, this.bonusCompleted);
    if (goalMet) {
      this.goalsMet += 1;
      this.engine.addScore(this.program === "precision" ? 260 : 190);
    }
    this.engine.addScore(core.stable ? 175 : Math.round(core.stability));

    const record = {
      correct: core.correct,
      stability: core.stability,
      stable: core.stable,
      averageSeconds,
      familyId: this.currentFamily.id,
      familyName: this.currentFamily.name,
      familyGlyph: this.currentFamily.glyph,
      goal: this.currentGoal,
      goalMet,
      rareTraits: this.currentRareTraits,
      bonus: this.bonusCompleted
    };
    this.specimenResults.push(record);

    const card = document.createElement("div");
    card.className = `lab-specimen-card ${core.stable ? "stable" : "mutated"} ${goalMet ? "goal-met" : ""}`;
    card.innerHTML = `
      <strong><span class="lab-family-glyph">${record.familyGlyph}</span>#${this.specimenIndex + 1} ${record.familyName}</strong>
      <span>${record.stability}% stable</span>
      <span>${goalMet ? "Objective met" : "Objective missed"}${record.bonus ? " • Bonus ✓" : ""}</span>
      ${record.rareTraits ? `<em>${record.rareTraits} rare trait${record.rareTraits === 1 ? "" : "s"}</em>` : ""}
    `;
    this.specimenResultsEl.appendChild(card);

    this.status.textContent = goalMet
      ? `${record.familyName} archived with its build objective satisfied.`
      : `${record.familyName} archived. HyperSoft has quietly moved the objective into next quarter.`;
    this.status.className = `status-line ${goalMet ? "good" : "bad"}`;

    if (this.specimenIndex + 1 >= this.specimenCount) {
      const stableCount = this.specimenResults.filter(item => item.stable).length;
      const bonusCount = this.specimenResults.filter(item => item.bonus).length;
      window.setTimeout(() => {
        if (!this.running) return;
        this.finish({
          success: true,
          score: this.engine.score,
          title: "Lab program complete",
          message: `${this.specimenCount} specimens archived: ${stableCount} stable, ${this.goalsMet} objectives met, ${bonusCount} bonus sequences captured, and ${this.totalRareTraits} rare traits discovered.`,
          variant: `Creature Lab • ${this.program} • ${this.batchSize}`
        });
      }, 900);
      return;
    }

    this.prompt.textContent = "ARCHIVING…";
    this.batchReadout.textContent = `Batch progress: ${this.specimenIndex + 1}/${this.specimenCount} archived • ${this.totalRareTraits} rare traits found`;
    window.setTimeout(() => {
      if (!this.running) return;
      this.specimenIndex += 1;
      this.prepareSpecimen();
    }, 850);
  }

  evaluateGoal(core, bonusCompleted) {
    switch (this.currentGoal) {
      case "precision": return core.correct === this.strandsPerSpecimen;
      case "speed": return core.correct >= 7 && core.averageMs <= this.currentGoalSpeedLimit * 1000;
      case "research": return core.correct >= 6 && bonusCompleted;
      case "stability":
      default: return core.correct >= 7;
    }
  }

  tick() {
    if (!this.running || this.resolving || !this.currentWord) return;
    const remaining = Math.max(0, this.strandLimitMs - (performance.now() - this.strandStartedAt));
    this.timer.textContent = `${(remaining / 1000).toFixed(1)}s`;
    this.engine.updateHUD({ timerMs: remaining });
    if (remaining <= 0) {
      this.input.value = "";
      this.resolveCurrent(false);
    }
  }

  getHUDTime() {
    if (this.resolving) return 0;
    return Math.max(0, this.strandLimitMs - (performance.now() - this.strandStartedAt));
  }

  stop() {
    this.running = false;
    window.clearInterval(this.timerId);
    window.removeEventListener("keydown", this.handleKeydown);
  }
}
