const SHARK_SCENARIOS = {
  open: {
    name: "Open Water",
    className: "scenario-open",
    wordFactor: 1,
    graceMs: 2800,
    checkpoints: 3,
    checkpointRelief: 5.2,
    visibility: 190,
    currentInterval: 0,
    currentSharkPush: 0,
    currentSwimmerDrag: 0,
    pace: 1
  },
  reef: {
    name: "Reef Run",
    className: "scenario-reef",
    wordFactor: 1.05,
    graceMs: 3000,
    checkpoints: 4,
    checkpointRelief: 6.1,
    visibility: 145,
    currentInterval: 12600,
    currentSharkPush: 0.55,
    currentSwimmerDrag: 0.7,
    pace: 0.98
  },
  storm: {
    name: "Storm Channel",
    className: "scenario-storm",
    wordFactor: 1.03,
    graceMs: 3100,
    checkpoints: 3,
    checkpointRelief: 5,
    visibility: 150,
    currentInterval: 7600,
    currentSharkPush: 1.25,
    currentSwimmerDrag: 1.05,
    pace: 0.98
  },
  night: {
    name: "Night Swim",
    className: "scenario-night",
    wordFactor: 0.96,
    graceMs: 3300,
    checkpoints: 3,
    checkpointRelief: 5.5,
    visibility: 72,
    currentInterval: 0,
    currentSharkPush: 0,
    currentSwimmerDrag: 0,
    pace: 0.94
  }
};

const SHARK_PREDATORS = {
  reef: {
    name: "Reef Shark",
    className: "predator-reef",
    pace: 0.91,
    description: "steady pursuit",
    mistakeAdvance: 0,
    burstEvery: 0,
    burstDuration: 0,
    burstMultiplier: 1
  },
  mako: {
    name: "Mako",
    className: "predator-mako",
    pace: 0.86,
    description: "periodic speed bursts",
    mistakeAdvance: 0,
    burstEvery: 6900,
    burstDuration: 1850,
    burstMultiplier: 1.72
  },
  hammer: {
    name: "Hammerhead",
    className: "predator-hammer",
    pace: 0.9,
    description: "punishes mistakes",
    mistakeAdvance: 1.45,
    burstEvery: 0,
    burstDuration: 0,
    burstMultiplier: 1
  },
  white: {
    name: "Great White",
    className: "predator-white",
    pace: 0.78,
    description: "accelerates late",
    mistakeAdvance: 0.45,
    burstEvery: 0,
    burstDuration: 0,
    burstMultiplier: 1
  }
};

const SHARK_LENGTHS = {
  sprint: { name: "Sprint", factor: 0.7, checkpointDelta: -1 },
  standard: { name: "Standard", factor: 1, checkpointDelta: 0 },
  endurance: { name: "Endurance", factor: 1.45, checkpointDelta: 1 }
};

export class SharkAttackGame {
  constructor({ stage, engine, finish, settings, gameOptions = {} }) {
    this.stage = stage;
    this.engine = engine;
    this.finish = finish;
    this.settings = settings;
    this.options = gameOptions;
    this.scenario = SHARK_SCENARIOS[gameOptions.sharkScenario] || SHARK_SCENARIOS.open;
    this.predator = SHARK_PREDATORS[gameOptions.sharkPredator] || SHARK_PREDATORS.reef;
    this.length = SHARK_LENGTHS[gameOptions.sharkLength] || SHARK_LENGTHS.standard;
    this.running = false;
    this.text = "";
    this.index = 0;
    this.mistakes = new Set();

    this.swimmerStart = 24;
    this.swimmerEnd = 96;
    this.swimmerProgress = this.swimmerStart;
    this.sharkProgress = 3;
    this.catchDistance = 4.5;
    this.gracePeriodMs = this.scenario.graceMs;

    this.checkpointCount = Math.max(1, this.scenario.checkpoints + this.length.checkpointDelta);
    this.checkpointIndexes = [];
    this.checkpointsReached = 0;
    this.currentEvents = 0;
    this.predatorSurges = 0;
    this.nextCurrentAt = this.scenario.currentInterval ? this.gracePeriodMs + this.scenario.currentInterval : Infinity;
    this.nextPredatorBurstAt = this.predator.burstEvery ? this.gracePeriodMs + this.predator.burstEvery : Infinity;
    this.predatorBurstUntil = 0;

    this.lastFrame = 0;
    this.animationId = null;
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  start() {
    this.running = true;
    this.text = this.buildParagraph();
    this.checkpointIndexes = Array.from({ length: this.checkpointCount }, (_, index) =>
      Math.max(1, Math.floor(this.text.length * ((index + 1) / (this.checkpointCount + 1))))
    );

    this.stage.innerHTML = `
      <div class="shark-stage ${this.scenario.className}">
        <div class="shark-water">
          <div class="shark-course-label">${this.scenario.name} · ${this.predator.name} · ${this.length.name}</div>
          <div class="shark-buoys" id="sharkBuoys"></div>
          <div class="swimmer" id="swimmer"></div>
          <div class="shark ${this.predator.className}" id="shark"></div>
        </div>
        <div class="paragraph-panel">
          <div class="shark-passage-header">
            <span class="eyebrow">Escape passage</span>
            <strong id="sharkChaseStats">Buoys 0/${this.checkpointCount} · Surges 0 · Currents 0</strong>
          </div>
          <div class="paragraph-text" id="sharkText"></div>
          <div class="status-line" id="sharkStatus">Type exactly. You have ${(this.gracePeriodMs / 1000).toFixed(1)} seconds before ${this.predator.name} begins the chase.</div>
        </div>
      </div>
    `;

    this.swimmer = this.stage.querySelector("#swimmer");
    this.shark = this.stage.querySelector("#shark");
    this.textEl = this.stage.querySelector("#sharkText");
    this.status = this.stage.querySelector("#sharkStatus");
    this.stats = this.stage.querySelector("#sharkChaseStats");
    this.buoys = this.stage.querySelector("#sharkBuoys");
    this.renderBuoys();

    window.addEventListener("keydown", this.handleKeydown);
    this.renderText();
    this.renderRace();

    this.lastFrame = performance.now();
    this.animationId = requestAnimationFrame(time => this.frame(time));
  }

  buildParagraph() {
    const profile = this.engine.getScaledDifficulty(0);
    const baseCount = 22 + profile.movementSpeed * 14;
    const wordCount = Math.max(15, Math.round(baseCount * this.length.factor * this.scenario.wordFactor));
    const words = Array.from({ length: wordCount }, () => this.engine.generateWord(this.settings.wordList));
    const sentences = [];

    while (words.length) {
      const take = Math.min(words.length, 7 + Math.floor(Math.random() * 5));
      const sentenceWords = words.splice(0, take);
      let sentence = sentenceWords.join(" ");
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
      sentences.push(sentence);
    }

    return sentences.join(" ");
  }

  handleKeydown(event) {
    if (!this.running || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;

    if (event.key === " ") event.preventDefault();
    const expected = this.text[this.index];
    const actual = event.key;
    const correct = actual === expected;

    this.engine.recordKeystroke(correct, correct ? 1.7 : 0);

    if (correct) {
      this.index += 1;
      const passageProgress = this.index / this.text.length;
      this.swimmerProgress = Math.min(
        this.swimmerEnd,
        this.swimmerStart + passageProgress * (this.swimmerEnd - this.swimmerStart)
      );

      const checkpointReached = this.processCheckpoints();
      if (!checkpointReached) {
        this.status.textContent = "Correct. Keep moving.";
        this.status.className = "status-line good";
      }
    } else {
      this.mistakes.add(this.index);
      this.swimmerProgress = Math.max(this.swimmerStart - 3, this.swimmerProgress - 1.15);
      if (this.predator.mistakeAdvance) {
        this.sharkProgress = Math.min(98, this.sharkProgress + this.predator.mistakeAdvance);
      }
      this.engine.addScore(-3);
      const predatorWarning = this.predator.mistakeAdvance
        ? ` ${this.predator.name} gains ${this.predator.mistakeAdvance.toFixed(1)}% on mistakes.`
        : "";
      this.status.textContent = `Expected “${expected === " " ? "space" : expected}”. Mistake slows the swimmer.${predatorWarning}`;
      this.status.className = "status-line bad";
    }

    this.renderText();
    this.renderRace();
    this.updateStats();
    this.engine.updateHUD();

    if (this.index >= this.text.length) this.completeEscape();
  }

  processCheckpoints() {
    let reachedNow = false;
    while (
      this.checkpointsReached < this.checkpointIndexes.length &&
      this.index >= this.checkpointIndexes[this.checkpointsReached]
    ) {
      this.checkpointsReached += 1;
      reachedNow = true;
      this.sharkProgress = Math.max(1, this.sharkProgress - this.scenario.checkpointRelief);
      this.engine.addScore(120 + this.checkpointsReached * 20);
      const buoy = this.buoys?.querySelector(`[data-buoy="${this.checkpointsReached}"]`);
      buoy?.classList.add("reached");
      this.status.textContent = `Buoy ${this.checkpointsReached}/${this.checkpointCount}! ${this.predator.name} loses some ground.`;
      this.status.className = "status-line good";
    }
    return reachedNow;
  }

  triggerCurrent() {
    this.currentEvents += 1;
    this.sharkProgress = Math.min(98, this.sharkProgress + this.scenario.currentSharkPush);
    this.swimmerProgress = Math.max(this.swimmerStart - 3, this.swimmerProgress - this.scenario.currentSwimmerDrag);
    this.status.textContent = this.scenario === SHARK_SCENARIOS.storm
      ? `Storm current ${this.currentEvents}! The channel drags you back while the shark gains water.`
      : `Reef current ${this.currentEvents}! Hold the typing rhythm through the sideways pull.`;
    this.status.className = "status-line bad";
    this.stage.querySelector(".shark-water")?.classList.add("current-hit");
    window.setTimeout(() => this.stage.querySelector(".shark-water")?.classList.remove("current-hit"), 420);
    this.updateStats();
  }

  beginPredatorBurst(elapsed) {
    this.predatorSurges += 1;
    this.predatorBurstUntil = elapsed + this.predator.burstDuration;
    this.nextPredatorBurstAt = elapsed + this.predator.burstEvery + Math.round(Math.random() * 1400);
    this.status.textContent = `MAKO SURGE ${this.predatorSurges}! Keep the passage moving until the burst passes.`;
    this.status.className = "status-line bad";
    this.shark.classList.add("surging");
    this.updateStats();
  }

  completeEscape() {
    if (!this.running) return;
    this.engine.correctTargets += 1;
    this.engine.totalTargets += 1;
    this.engine.addScore(650 + this.checkpointsReached * 70);
    this.finish({
      success: true,
      score: this.engine.score,
      title: "Shore reached",
      message: `${this.scenario.name} cleared ahead of ${this.predator.name}. Blake has classified this as a successful aquatic typing deployment.`,
      variant: `${this.scenario.name} · ${this.predator.name} · ${this.length.name}`,
      extraStats: [
        ["Buoys", `${this.checkpointsReached}/${this.checkpointCount}`],
        ["Predator surges", this.predatorSurges],
        ["Current events", this.currentEvents],
        ["Mistake positions", this.mistakes.size]
      ]
    });
  }

  renderText() {
    const behind = 80;
    const ahead = this.scenario.visibility;
    const start = Math.max(0, this.index - behind);
    const end = Math.min(this.text.length, this.index + ahead);
    let html = "";

    for (let i = start; i < end; i += 1) {
      const char = this.escape(this.text[i]);
      if (i < this.index) html += `<span class="typed-good">${char}</span>`;
      else if (i === this.index) html += `<span class="cursor-char">${char}</span>`;
      else html += `<span class="pending">${char}</span>`;
    }

    if (this.scenario === SHARK_SCENARIOS.night && end < this.text.length) html += `<span class="night-fade"> …</span>`;
    this.textEl.innerHTML = html;
  }

  renderBuoys() {
    if (!this.buoys) return;
    this.buoys.innerHTML = this.checkpointIndexes.map((_, index) => {
      const fraction = (index + 1) / (this.checkpointCount + 1);
      const left = this.swimmerStart + fraction * (this.swimmerEnd - this.swimmerStart);
      return `<span class="shark-buoy" data-buoy="${index + 1}" style="left:${left}%"><b>${index + 1}</b></span>`;
    }).join("");
  }

  updateStats() {
    if (!this.stats) return;
    this.stats.textContent = `Buoys ${this.checkpointsReached}/${this.checkpointCount} · Surges ${this.predatorSurges} · Currents ${this.currentEvents}`;
  }

  frame(time) {
    if (!this.running) return;

    const dt = Math.min(50, time - this.lastFrame);
    this.lastFrame = time;
    const elapsed = this.engine.getElapsedMs();
    const passageProgress = this.text.length ? this.index / this.text.length : 0;
    const profile = this.engine.getScaledDifficulty(passageProgress);

    if (elapsed >= this.gracePeriodMs) {
      if (elapsed >= this.nextPredatorBurstAt && this.predator.burstEvery) this.beginPredatorBurst(elapsed);
      if (elapsed >= this.predatorBurstUntil) this.shark.classList.remove("surging");

      let predatorDynamic = 1;
      if (this.predator === SHARK_PREDATORS.white) predatorDynamic = 0.88 + passageProgress * 0.86;
      const burstMultiplier = elapsed < this.predatorBurstUntil ? this.predator.burstMultiplier : 1;
      this.sharkProgress = Math.min(
        98,
        this.sharkProgress + dt * 0.00132 * profile.opponentPace * this.scenario.pace * this.predator.pace * predatorDynamic * burstMultiplier
      );

      if (elapsed >= this.nextCurrentAt && this.scenario.currentInterval) {
        this.triggerCurrent();
        this.nextCurrentAt = elapsed + this.scenario.currentInterval + Math.round(Math.random() * 2200);
      }
    }

    this.renderRace();
    this.engine.updateHUD();

    if (
      elapsed >= this.gracePeriodMs &&
      this.sharkProgress + this.catchDistance >= this.swimmerProgress
    ) {
      this.finish({
        success: false,
        score: this.engine.score,
        title: `${this.predator.name} catches up`,
        message: `${this.scenario.name} ended after ${this.checkpointsReached} buoy${this.checkpointsReached === 1 ? "" : "s"}. The next attempt begins with the same fair head start.`,
        variant: `${this.scenario.name} · ${this.predator.name} · ${this.length.name}`,
        extraStats: [
          ["Buoys", `${this.checkpointsReached}/${this.checkpointCount}`],
          ["Predator surges", this.predatorSurges],
          ["Current events", this.currentEvents],
          ["Passage", `${Math.round(passageProgress * 100)}%`]
        ]
      });
      return;
    }

    this.animationId = requestAnimationFrame(next => this.frame(next));
  }

  renderRace() {
    if (this.swimmer) this.swimmer.style.left = `${this.swimmerProgress}%`;
    if (this.shark) this.shark.style.left = `${this.sharkProgress}%`;
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener("keydown", this.handleKeydown);
  }

  escape(value = "") {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll(" ", "&nbsp;");
  }
}
