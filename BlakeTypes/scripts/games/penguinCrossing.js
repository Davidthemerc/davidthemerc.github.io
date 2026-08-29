import { hyperSoftShouldBypassTypingEvent } from "../core/accessibilityUtils.js";
const PENGUIN_ROUTES = {
  channel: {
    name: "Classic Channel",
    className: "route-channel",
    fragileChance: 0,
    bonusChance: 0,
    forkEvery: 0,
    fragileDelay: 3400
  },
  fork: {
    name: "Glacier Fork",
    className: "route-fork",
    fragileChance: 0.06,
    bonusChance: 0.06,
    forkEvery: 5,
    fragileDelay: 3400
  },
  shelf: {
    name: "Fragile Shelf",
    className: "route-shelf",
    fragileChance: 0.34,
    bonusChance: 0.04,
    forkEvery: 0,
    fragileDelay: 3100
  },
  aurora: {
    name: "Aurora Crossing",
    className: "route-aurora",
    fragileChance: 0.06,
    bonusChance: 0.27,
    forkEvery: 0,
    fragileDelay: 3500
  }
};

const FLOE_PROGRAMS = {
  standard: { name: "Standard Ice", fragileBonus: 0, bonusBonus: 0 },
  fragile: { name: "Fragile Ice", fragileBonus: 0.25, bonusBonus: 0 },
  bonus: { name: "Rescue Markers", fragileBonus: 0, bonusBonus: 0.22 },
  mixed: { name: "Mixed Field", fragileBonus: 0.15, bonusBonus: 0.14 }
};

export class PenguinCrossingGame {
  constructor({ stage, engine, finish, gameOptions = {} }) {
    this.stage = stage;
    this.engine = engine;
    this.finish = finish;
    this.options = gameOptions;
    this.route = PENGUIN_ROUTES[gameOptions.penguinRoute] || PENGUIN_ROUTES.channel;
    this.floeProgram = FLOE_PROGRAMS[gameOptions.penguinFloeProgram] || FLOE_PROGRAMS.standard;
    this.running = false;
    this.finished = false;
    this.floes = [];
    this.current = null;
    this.routeChoices = null;
    this.buffer = "";
    this.completed = 0;
    this.targetCount = {
      novice: 24,
      easy: 26,
      normal: 28,
      challenging: 30,
      hard: 34,
      expert: 38
    }[engine.difficultyName] ?? 28;
    this.dangerEdge = 13;
    this.openingGraceMs = 1800;
    this.nextGustAt = 7000;
    this.nextCrackAt = 5900;
    this.nextSurgeAt = 12600;
    this.surgeUntil = 0;
    this.calmUntil = 0;
    this.gustNumber = 0;
    this.crackNumber = 0;
    this.surgeNumber = 0;
    this.fragileBreaks = 0;
    this.bonusFloes = 0;
    this.forksChosen = 0;
    this.forksForced = 0;
    this.currentTargetSince = 0;
    this.lastFrame = 0;
    this.animationId = null;
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  start() {
    this.running = true;
    this.finished = false;
    this.stage.innerHTML = `
      <div class="penguin-stage ${this.route.className}" id="penguinStage">
        <div class="penguin-route-label">${this.route.name} · ${this.floeProgram.name}</div>
        <div class="penguin" id="penguin"></div>
        <div class="penguin-input-panel">
          <span class="eyebrow" id="penguinPromptEyebrow">Current floe</span>
          <div class="typing-prompt" id="floePrompt" style="font-size:1.7rem"></div>
          <div class="typing-prompt" id="penguinBuffer" style="font-size:1.25rem;color:var(--muted)">—</div>
          <div class="status-line" id="penguinStatus">Start typing now — the ice starts moving in 1.8 seconds.</div>
          <strong id="penguinStats">Jump 0/${this.targetCount} · Gust 0 · Crack 0 · Surge 0</strong>
        </div>
      </div>
    `;

    this.playfield = this.stage.querySelector("#penguinStage");
    this.penguin = this.stage.querySelector("#penguin");
    this.prompt = this.stage.querySelector("#floePrompt");
    this.promptEyebrow = this.stage.querySelector("#penguinPromptEyebrow");
    this.bufferEl = this.stage.querySelector("#penguinBuffer");
    this.status = this.stage.querySelector("#penguinStatus");
    this.stats = this.stage.querySelector("#penguinStats");

    for (let i = 0; i < 8; i += 1) this.spawnFloe(39 + i * 14.2);
    this.selectTarget();

    window.addEventListener("keydown", this.handleKeydown);
    this.lastFrame = performance.now();
    this.animationId = requestAnimationFrame(time => this.frame(time));
  }

  spawnFloe(x = 110) {
    const progress = this.completed / this.targetCount;
    const word = this.generateFloeWord(progress);
    const fast = Math.random() < 0.29;
    const kind = this.pickFloeKind();
    const classes = ["floe", fast ? "fast-floe" : "", kind === "fragile" ? "fragile-floe" : "", kind === "bonus" ? "bonus-floe" : ""]
      .filter(Boolean)
      .join(" ");
    const entity = this.engine.spawnEntity(this.playfield, {
      className: classes,
      text: word,
      x,
      y: 0,
      dataset: { value: word, kind }
    });

    entity.value = word;
    entity.x = x;
    entity.kind = kind;
    entity.fragileCracked = false;
    entity.speedFactor = fast ? 1.28 + Math.random() * 0.27 : 0.88 + Math.random() * 0.38;
    entity.element.style.left = `${x}%`;
    entity.element.style.bottom = `${102 + Math.round(Math.random() * 28)}px`;
    this.floes.push(entity);
  }

  generateFloeWord(progress) {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const candidate = this.engine.generateWord(undefined, { progress });
      if (/^[a-zA-Z]+$/.test(candidate)) return candidate.toLowerCase();
    }
    const fallback = this.engine.generateWord("general", { progress }).replace(/[^a-zA-Z]/g, "").toLowerCase();
    return fallback || "ice";
  }

  pickFloeKind() {
    const fragileChance = Math.min(0.58, this.route.fragileChance + this.floeProgram.fragileBonus);
    const bonusChance = Math.min(0.45, this.route.bonusChance + this.floeProgram.bonusBonus);
    const roll = Math.random();
    if (roll < bonusChance) return "bonus";
    if (roll < bonusChance + fragileChance) return "fragile";
    return "standard";
  }

  selectTarget() {
    this.clearRouteChoices();
    this.floes.sort((a, b) => a.x - b.x);
    this.floes.forEach(floe => floe.element.classList.remove("target", "route-choice", "route-selected"));
    this.current = this.floes.find(floe => floe.x > this.dangerEdge) ?? this.floes[0];
    this.buffer = "";
    this.currentTargetSince = this.engine.getElapsedMs();
    this.promptEyebrow.textContent = "Current floe";

    if (this.current) {
      this.current.element.classList.add("target");
      this.prompt.textContent = this.current.value;
      this.renderBuffer();
    }
  }

  beginRouteFork() {
    this.floes.sort((a, b) => a.x - b.x);
    const choices = this.floes.filter(floe => floe.x > this.dangerEdge + 2).slice(0, 2);
    if (choices.length < 2) {
      this.selectTarget();
      return;
    }

    this.current = null;
    this.routeChoices = choices;
    this.buffer = "";
    this.currentTargetSince = this.engine.getElapsedMs();
    this.floes.forEach(floe => floe.element.classList.remove("target", "route-choice", "route-selected"));
    choices.forEach(floe => floe.element.classList.add("route-choice"));
    this.promptEyebrow.textContent = "Route fork — type either floe";
    this.prompt.textContent = `${choices[0].value}  /  ${choices[1].value}`;
    this.status.textContent = "Glacier fork! Type either highlighted word to choose the next route.";
    this.status.className = "status-line good";
    this.renderBuffer();
  }

  clearRouteChoices() {
    if (this.routeChoices) this.routeChoices.forEach(floe => floe.element?.classList.remove("route-choice", "route-selected"));
    this.routeChoices = null;
  }

  handleKeydown(event) {
    if (hyperSoftShouldBypassTypingEvent(event)) return;
    if (!this.running || event.ctrlKey || event.metaKey || event.altKey) return;

    if (/^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault();
      if (this.routeChoices?.length) {
        this.handleRouteChoiceKey(event.key.toLowerCase());
        return;
      }

      if (!this.current) return;
      const nextBuffer = this.buffer + event.key.toLowerCase();
      const expectedPrefix = this.current.value.slice(0, nextBuffer.length);

      if (nextBuffer === expectedPrefix) {
        this.buffer = nextBuffer;
        this.engine.recordKeystroke(true, 1);
      } else {
        this.engine.recordKeystroke(false);
        this.engine.addScore(-10);
        const profile = this.engine.getScaledDifficulty(this.completed / this.targetCount);
        const slip = 2.8 + profile.movementSpeed * 1.1;
        this.current.x -= slip;
        this.current.element.style.left = `${this.current.x}%`;
        this.status.textContent = "Wrong letter — the target floe lurches hard toward open water.";
        this.status.className = "status-line bad";
        return;
      }

      if (this.buffer === this.current.value) this.completeFloe();
      this.renderBuffer();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      this.buffer = this.buffer.slice(0, -1);
      this.updateRouteChoiceHighlight();
      this.renderBuffer();
    }
  }

  handleRouteChoiceKey(key) {
    const nextBuffer = this.buffer + key;
    const matches = this.routeChoices.filter(floe => floe.value.startsWith(nextBuffer));

    if (!matches.length) {
      this.engine.recordKeystroke(false);
      this.engine.addScore(-10);
      this.routeChoices.forEach(floe => {
        floe.x -= 1.7;
        floe.element.style.left = `${floe.x}%`;
      });
      this.status.textContent = "That letter matches neither route. Both fork floes slip toward open water.";
      this.status.className = "status-line bad";
      return;
    }

    this.buffer = nextBuffer;
    this.engine.recordKeystroke(true, 1);
    this.updateRouteChoiceHighlight();
    const completedChoice = matches.find(floe => floe.value === this.buffer);
    if (completedChoice) this.chooseForkRoute(completedChoice);
    this.renderBuffer();
  }

  updateRouteChoiceHighlight() {
    if (!this.routeChoices) return;
    this.routeChoices.forEach(floe => {
      floe.element.classList.toggle("route-selected", Boolean(this.buffer) && floe.value.startsWith(this.buffer));
    });
  }

  chooseForkRoute(choice) {
    const otherChoices = this.routeChoices.filter(floe => floe !== choice);
    otherChoices.forEach(floe => floe.remove());
    this.floes = this.floes.filter(floe => !otherChoices.includes(floe));
    this.routeChoices = null;
    this.forksChosen += 1;

    const rightmost = Math.max(91, ...this.floes.map(floe => floe.x));
    this.spawnFloe(rightmost + 11 + Math.random() * 5.5);

    this.current = choice;
    choice.element.classList.remove("route-choice", "route-selected");
    choice.element.classList.add("target");
    this.status.textContent = `Route ${this.forksChosen} selected. The penguin commits to ${choice.value}.`;
    this.status.className = "status-line good";
    this.completeFloe();
  }

  completeFloe() {
    if (!this.current) return;

    const completedFloe = this.current;
    this.engine.correctTargets += 1;
    this.engine.totalTargets += 1;
    let points = 100 + completedFloe.value.length * 11;
    if (completedFloe.kind === "bonus") {
      points += 180;
      this.bonusFloes += 1;
      const delay = 1250;
      this.calmUntil = this.engine.getElapsedMs() + delay;
      this.nextGustAt += delay;
      this.nextCrackAt += delay;
      this.nextSurgeAt += delay;
    }
    this.engine.addScore(points);
    this.completed += 1;

    this.penguin.classList.remove("jump");
    void this.penguin.offsetWidth;
    this.penguin.classList.add("jump");

    completedFloe.remove();
    this.floes = this.floes.filter(floe => floe !== completedFloe);
    this.current = null;
    this.buffer = "";
    this.status.textContent = completedFloe.kind === "bonus"
      ? `Bonus floe! +180 and a brief calm window. Jump ${this.completed}/${this.targetCount}.`
      : `Jump ${this.completed}/${this.targetCount} complete. Everything else kept moving.`;
    this.status.className = "status-line good";
    this.updateStats();

    if (this.completed >= this.targetCount) {
      this.engine.addScore(650);
      this.complete({
        success: true,
        score: this.engine.score,
        title: "Crossing complete",
        message: `${this.route.name} cleared in ${this.targetCount} jumps without increasing the original baseline ice speed.`,
        variant: `${this.route.name} · ${this.floeProgram.name}`,
        extraStats: [
          ["Route forks", this.forksChosen],
          ["Fragile breaks", this.fragileBreaks],
          ["Bonus floes", this.bonusFloes],
          ["Weather events", this.gustNumber + this.crackNumber + this.surgeNumber]
        ]
      });
      return;
    }

    const rightmost = Math.max(91, ...this.floes.map(floe => floe.x));
    this.spawnFloe(rightmost + 11 + Math.random() * 5.5);

    if (this.route.forkEvery && this.completed % this.route.forkEvery === 0) this.beginRouteFork();
    else this.selectTarget();
  }

  triggerGust(profile) {
    this.gustNumber += 1;
    const shove = 4.8 + profile.movementSpeed * 2.1;
    this.floes.forEach(floe => {
      floe.x -= shove;
      floe.element.style.left = `${floe.x}%`;
    });
    this.status.textContent = `Wind gust ${this.gustNumber}! The whole field jumps ${shove.toFixed(1)}% toward danger.`;
    this.status.className = "status-line bad";
    this.updateStats();
  }

  triggerCrack(profile) {
    const target = this.current || this.routeChoices?.slice().sort((a, b) => a.x - b.x)[0];
    if (!target) return;
    this.crackNumber += 1;
    const slip = 2.3 + profile.movementSpeed * 1.25;
    target.x -= slip;
    target.element.style.left = `${target.x}%`;
    target.element.classList.remove("cracked");
    void target.element.offsetWidth;
    target.element.classList.add("cracked");
    this.status.textContent = `Crack ${this.crackNumber}! ${this.routeChoices ? "A route floe" : "Your current floe"} just lost ${slip.toFixed(1)}% of its margin.`;
    this.status.className = "status-line bad";
    this.updateStats();
  }

  triggerFragileBreak(profile) {
    if (!this.current || this.current.kind !== "fragile" || this.current.fragileCracked) return;
    this.current.fragileCracked = true;
    this.fragileBreaks += 1;
    const slip = 3.1 + profile.movementSpeed * 0.85;
    this.current.x -= slip;
    this.current.element.style.left = `${this.current.x}%`;
    this.current.element.classList.add("fragile-warning", "cracked");
    this.status.textContent = `Fragile floe fracture! Finish “${this.current.value}” before the damaged ice drifts away.`;
    this.status.className = "status-line bad";
    this.updateStats();
  }

  triggerSurge(elapsed) {
    this.surgeNumber += 1;
    this.surgeUntil = elapsed + 1900;
    this.status.textContent = `CURRENT SURGE ${this.surgeNumber}! All floes accelerate for two seconds.`;
    this.status.className = "status-line bad";
    this.updateStats();
  }

  cleanupLostFutureFloes() {
    const choices = new Set(this.routeChoices || []);
    const lost = this.floes.filter(floe => floe !== this.current && !choices.has(floe) && floe.x <= this.dangerEdge);
    if (!lost.length) return;

    lost.forEach(floe => floe.remove());
    this.floes = this.floes.filter(floe => floe.alive);
    let rightmost = Math.max(91, ...this.floes.map(floe => floe.x));
    lost.forEach(() => {
      rightmost += 11 + Math.random() * 5.5;
      this.spawnFloe(rightmost);
    });
  }

  cleanupRouteChoices() {
    if (!this.routeChoices?.length) return;
    const lost = this.routeChoices.filter(floe => floe.x <= this.dangerEdge);
    if (!lost.length) return;

    lost.forEach(floe => floe.remove());
    this.floes = this.floes.filter(floe => floe.alive);
    this.routeChoices = this.routeChoices.filter(floe => floe.alive);
    let rightmost = Math.max(91, ...this.floes.map(floe => floe.x));
    lost.forEach(() => {
      rightmost += 11 + Math.random() * 5.5;
      this.spawnFloe(rightmost);
    });

    if (this.routeChoices.length === 1) {
      this.forksForced += 1;
      this.current = this.routeChoices[0];
      this.current.element.classList.remove("route-choice", "route-selected");
      this.current.element.classList.add("target");
      this.routeChoices = null;
      this.buffer = "";
      this.currentTargetSince = this.engine.getElapsedMs();
      this.promptEyebrow.textContent = "Fork narrowed — remaining floe";
      this.prompt.textContent = this.current.value;
      this.status.textContent = "One fork drifted away. The remaining route is now mandatory.";
      this.status.className = "status-line bad";
      this.renderBuffer();
    }
    else if (this.routeChoices.length === 0) {
      this.forksForced += 1;
      this.routeChoices = null;
      this.selectTarget();
      this.status.textContent = "Both fork choices drifted away. The penguin takes the nearest emergency route.";
      this.status.className = "status-line bad";
    }
  }

  updateStats() {
    this.stats.textContent = `Jump ${this.completed}/${this.targetCount} · Gust ${this.gustNumber} · Crack ${this.crackNumber} · Surge ${this.surgeNumber} · ★ ${this.bonusFloes}`;
  }

  renderBuffer() {
    this.bufferEl.textContent = this.buffer || "—";
  }

  frame(time) {
    if (!this.running) return;

    const dt = Math.min(50, time - this.lastFrame);
    this.lastFrame = time;

    const elapsed = this.engine.getElapsedMs();
    const progress = this.completed / this.targetCount;
    const profile = this.engine.getScaledDifficulty(progress);
    const baseSpeed = 0.0102 * profile.movementSpeed;
    const surgeMultiplier = elapsed < this.surgeUntil ? 1.58 : 1;

    if (elapsed >= this.openingGraceMs) {
      this.floes.forEach(floe => {
        floe.x -= baseSpeed * floe.speedFactor * surgeMultiplier * dt;
        floe.element.style.left = `${floe.x}%`;
      });
    }

    const eventWindowOpen = elapsed >= this.calmUntil;
    if (eventWindowOpen && elapsed >= this.nextGustAt) {
      this.triggerGust(profile);
      this.nextGustAt += Math.max(4400, 5900 - progress * 900);
    }

    if (eventWindowOpen && elapsed >= this.nextCrackAt) {
      this.triggerCrack(profile);
      this.nextCrackAt += Math.max(3300, 4550 - progress * 650);
    }

    if (eventWindowOpen && elapsed >= this.nextSurgeAt) {
      this.triggerSurge(elapsed);
      this.nextSurgeAt += Math.max(8500, 10800 - progress * 1300);
    }

    if (
      this.current?.kind === "fragile" &&
      !this.current.fragileCracked &&
      elapsed >= this.openingGraceMs &&
      elapsed - this.currentTargetSince >= this.route.fragileDelay
    ) {
      this.triggerFragileBreak(profile);
    }

    this.cleanupLostFutureFloes();
    this.cleanupRouteChoices();

    if (this.current && this.current.x <= this.dangerEdge) {
      this.engine.totalTargets += 1;
      this.engine.totalChars += this.current.value.length;
      this.complete({
        success: false,
        score: this.engine.score,
        title: "Penguin down",
        message: `${this.route.name} ended after ${this.completed} successful jumps. The original 1.8-second opening grace and baseline movement speed remain unchanged.`,
        variant: `${this.route.name} · ${this.floeProgram.name}`,
        extraStats: [
          ["Route forks", this.forksChosen],
          ["Fragile breaks", this.fragileBreaks],
          ["Bonus floes", this.bonusFloes],
          ["Weather events", this.gustNumber + this.crackNumber + this.surgeNumber]
        ]
      });
      return;
    }

    this.engine.updateHUD();
    this.animationId = requestAnimationFrame(next => this.frame(next));
  }

  complete(result) {
    if (!this.running || this.finished) return false;
    this.finished = true;
    this.running = false;
    this.finish(result);
    return true;
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener("keydown", this.handleKeydown);
    this.floes.forEach(floe => floe.remove());
    this.floes = [];
    this.routeChoices = null;
  }
}
