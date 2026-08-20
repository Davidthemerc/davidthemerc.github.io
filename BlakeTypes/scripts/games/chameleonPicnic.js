const PICNIC_PROGRAMS = {
  classic: {
    label: "Classic Feeding",
    uppercaseChance: 0,
    pairChance: 0,
    goldenChance: 0.07,
    spawnFactor: 1,
    escapeBonus: 0
  },
  case: {
    label: "Case Crunch",
    uppercaseChance: 0.48,
    pairChance: 0,
    goldenChance: 0.09,
    spawnFactor: 0.94,
    escapeBonus: 1
  },
  pairs: {
    label: "Pair Panic",
    uppercaseChance: 0.08,
    pairChance: 0.6,
    goldenChance: 0.1,
    spawnFactor: 0.82,
    escapeBonus: 2
  },
  festival: {
    label: "Festival Mix",
    uppercaseChance: 0.28,
    pairChance: 0.34,
    goldenChance: 0.14,
    spawnFactor: 0.88,
    escapeBonus: 1
  }
};

const PICNIC_SITES = {
  lawn: { label: "Sunny Lawn", className: "picnic-lawn" },
  garden: { label: "Garden Table", className: "picnic-garden" },
  evening: { label: "Evening Picnic", className: "picnic-evening" },
  office: { label: "Office Courtyard", className: "picnic-office" }
};

const LANE_NAMES = ["Blanket", "Basket", "Drinks"];
const LANE_Y = [37, 57, 77];

export class ChameleonPicnicGame {
  constructor({ stage, engine, finish, gameOptions = {} }) {
    this.stage = stage;
    this.engine = engine;
    this.finish = finish;
    this.gameOptions = gameOptions;
    this.program = PICNIC_PROGRAMS[gameOptions.picnicProgram] ?? PICNIC_PROGRAMS.classic;
    this.site = PICNIC_SITES[gameOptions.picnicSite] ?? PICNIC_SITES.lawn;
    this.running = false;
    this.durationMs = 65000;
    this.ants = [];
    this.buffer = "";
    this.spawnAccumulator = 0;
    this.lastFrame = 0;
    this.animationId = null;
    this.eaten = 0;
    this.missed = 0;
    this.goldenEaten = 0;
    this.goldenMissed = 0;
    this.pairsEaten = 0;
    this.uppercaseEaten = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.waveNumber = 0;
    this.swarmNumber = 0;
    this.nextWaveAt = 5500;
    this.nextSwarmAt = 14500;
    this.swarmUntil = 0;
    const baseLimit = {
      novice: 14,
      easy: 12,
      normal: 10,
      challenging: 9,
      hard: 8,
      expert: 7
    }[engine.difficultyName] ?? 10;
    this.escapeLimit = baseLimit + this.program.escapeBonus;
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  start() {
    this.running = true;
    this.stage.innerHTML = `
      <div class="picnic-stage ${this.site.className}" id="picnicStage">
        <div class="picnic-lane lane-0"><span>${LANE_NAMES[0]}</span></div>
        <div class="picnic-lane lane-1"><span>${LANE_NAMES[1]}</span></div>
        <div class="picnic-lane lane-2"><span>${LANE_NAMES[2]}</span></div>
        <div class="chameleon" id="chameleon"></div>
        <div class="prompt-card picnic-panel">
          <span class="eyebrow">${this.program.label} • ${this.site.label}</span>
          <div class="typing-prompt picnic-buffer" id="picnicBuffer">—</div>
          <div class="status-line" id="picnicStatus">Eight ants are already moving across three lanes. Scan the whole picnic.</div>
          <strong id="picnicStats">Eaten 0 · Escaped 0/${this.escapeLimit} · Combo 0 · Gold 0</strong>
          <div class="picnic-lane-readout" id="picnicLaneReadout">Blanket 0 · Basket 0 · Drinks 0</div>
        </div>
      </div>
    `;

    this.playfield = this.stage.querySelector("#picnicStage");
    this.chameleon = this.stage.querySelector("#chameleon");
    this.status = this.stage.querySelector("#picnicStatus");
    this.stats = this.stage.querySelector("#picnicStats");
    this.bufferEl = this.stage.querySelector("#picnicBuffer");
    this.laneReadout = this.stage.querySelector("#picnicLaneReadout");

    window.addEventListener("keydown", this.handleKeydown);
    this.lastFrame = performance.now();

    for (let i = 0; i < 8; i += 1) this.spawnAnt(72 + i * 5.4, i < 2);
    this.updateStats();
    this.animationId = requestAnimationFrame(time => this.frame(time));
  }

  makeTarget() {
    const first = this.engine.generateLetter().toLowerCase();
    const makePair = Math.random() < this.program.pairChance;
    let target = makePair ? `${first}${this.engine.generateLetter().toLowerCase()}` : first;
    if (Math.random() < this.program.uppercaseChance) {
      if (target.length === 1) target = target.toUpperCase();
      else {
        const index = Math.random() < 0.5 ? 0 : 1;
        target = target.split("").map((ch, i) => i === index ? ch.toUpperCase() : ch).join("");
      }
    }
    return target;
  }

  spawnAnt(startX = 104, urgent = false, forced = {}) {
    const value = forced.value ?? this.makeTarget();
    const lane = Number.isInteger(forced.lane) ? forced.lane : Math.floor(Math.random() * LANE_Y.length);
    const golden = forced.golden ?? (Math.random() < this.program.goldenChance);
    const speedFactor = urgent
      ? 1.42 + Math.random() * 0.55
      : 0.96 + Math.random() * 0.58;

    const entity = this.engine.spawnEntity(this.playfield, {
      className: `ant-letter lane-ant ${urgent ? "urgent" : ""} ${golden ? "golden-ant" : ""} ${value.length > 1 ? "pair-ant" : ""}`,
      html: `<span>${value}</span>${golden ? '<b class="gold-star">★</b>' : ""}`,
      x: startX,
      y: LANE_Y[lane],
      dataset: { value, lane, golden: golden ? "true" : "false" }
    });

    entity.value = value;
    entity.x = startX;
    entity.y = LANE_Y[lane];
    entity.lane = lane;
    entity.golden = golden;
    entity.speedFactor = speedFactor * (golden ? 1.08 : 1);
    entity.element.style.left = `${entity.x}%`;
    entity.element.style.top = `${entity.y}%`;
    this.ants.push(entity);
  }

  spawnRush(profile) {
    this.waveNumber += 1;
    const count = 4 + Math.min(5, Math.floor(profile.movementSpeed * 2.2));
    const cap = 16 + Math.round(profile.movementSpeed * 3.4);

    for (let i = 0; i < count && this.ants.length < cap; i += 1) {
      this.spawnAnt(96 + i * 3.4, true);
    }

    this.status.textContent = `Picnic rush ${this.waveNumber}! ${count} fast targets joined across the lanes.`;
    this.status.className = "status-line bad";
  }

  startSwarm(profile, elapsed) {
    this.swarmNumber += 1;
    this.swarmUntil = elapsed + 2800;
    const openingBurst = 3 + Math.floor(profile.movementSpeed * 1.3);
    for (let i = 0; i < openingBurst; i += 1) this.spawnAnt(99 + i * 2.4, true);
    this.status.textContent = `SWARM ${this.swarmNumber}! Targets will arrive almost continuously for a few seconds.`;
    this.status.className = "status-line bad";
  }

  handleKeydown(event) {
    if (!this.running || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Escape") {
      this.buffer = "";
      this.renderBuffer();
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      this.buffer = this.buffer.slice(0, -1);
      this.renderBuffer();
      return;
    }
    if (!/^[a-zA-Z]$/.test(event.key)) return;

    event.preventDefault();
    const typed = event.key;
    let attempt = this.buffer + typed;
    let possible = this.ants.filter(ant => ant.value.startsWith(attempt));

    // If the current pair prefix no longer makes sense, permit the new key to begin a fresh target.
    if (!possible.length && this.buffer) {
      attempt = typed;
      possible = this.ants.filter(ant => ant.value.startsWith(attempt));
    }

    if (!possible.length) {
      this.buffer = "";
      this.registerWrongKey(typed);
      this.renderBuffer();
      return;
    }

    this.buffer = attempt;
    this.engine.recordKeystroke(true, 0, typed);

    const exact = possible
      .filter(ant => ant.value === this.buffer)
      .sort((a, b) => a.x - b.x)[0];

    if (exact) this.consumeAnt(exact);
    this.renderBuffer();
  }

  consumeAnt(target) {
    target.remove();
    this.ants = this.ants.filter(ant => ant !== target);
    this.eaten += 1;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    if (target.value.length > 1) this.pairsEaten += 1;
    if (/[A-Z]/.test(target.value)) this.uppercaseEaten += 1;
    if (target.golden) this.goldenEaten += 1;

    const base = target.speedFactor > 1.4 ? 42 : 28;
    const lengthBonus = Math.max(0, target.value.length - 1) * 28;
    const goldBonus = target.golden ? 95 : 0;
    const comboBonus = Math.min(50, Math.floor(this.combo / 5) * 10);
    this.engine.correctTargets += 1;
    this.engine.totalTargets += 1;
    this.engine.addScore(base + lengthBonus + goldBonus + comboBonus);

    const comboText = this.combo >= 5 ? ` · ${this.combo} combo!` : "";
    this.status.textContent = `${target.value} eaten from ${LANE_NAMES[target.lane]}.${target.golden ? " Golden bonus!" : ""}${comboText}`;
    this.status.className = "status-line good";
    this.buffer = "";
    this.chameleon.classList.remove("eating");
    void this.chameleon.offsetWidth;
    this.chameleon.classList.add("eating");
    this.updateStats();
  }

  registerWrongKey(key) {
    this.engine.recordKeystroke(false, 0, null);
    this.engine.addScore(-14);
    this.combo = 0;

    const profile = this.engine.getScaledDifficulty(this.engine.getElapsedMs() / this.durationMs);
    const surge = 0.9 + profile.movementSpeed * 0.75;
    this.ants.forEach(ant => {
      ant.x -= surge;
      ant.element.style.left = `${ant.x}%`;
    });

    this.status.textContent = `${key} does not begin a visible target — the entire swarm advances ${surge.toFixed(1)}%.`;
    this.status.className = "status-line bad";
    this.updateStats();
  }

  renderBuffer() {
    this.bufferEl.textContent = this.buffer || "—";
  }

  updateStats() {
    const laneCounts = [0, 1, 2].map(lane => this.ants.filter(ant => ant.lane === lane).length);
    const dangerLane = laneCounts.findIndex((count, lane) => count >= 4 && this.ants.some(ant => ant.lane === lane && ant.x < 32));
    this.stats.textContent = `Eaten ${this.eaten} · Escaped ${this.missed}/${this.escapeLimit} · Combo ${this.combo} (best ${this.bestCombo}) · Gold ${this.goldenEaten}`;
    this.laneReadout.textContent = `${LANE_NAMES[0]} ${laneCounts[0]} · ${LANE_NAMES[1]} ${laneCounts[1]} · ${LANE_NAMES[2]} ${laneCounts[2]}${dangerLane >= 0 ? ` · ⚠ ${LANE_NAMES[dangerLane]} danger` : ""}`;
  }

  frame(time) {
    if (!this.running) return;

    const dt = Math.min(50, time - this.lastFrame);
    this.lastFrame = time;
    const elapsed = this.engine.getElapsedMs();
    const progress = Math.min(1, elapsed / this.durationMs);
    const profile = this.engine.getScaledDifficulty(progress);

    if (elapsed >= this.nextSwarmAt) {
      this.startSwarm(profile, elapsed);
      this.nextSwarmAt += Math.max(10500, 14500 - progress * 2600);
    }

    this.spawnAccumulator += dt;
    const inSwarm = elapsed < this.swarmUntil;
    const spawnInterval = (inSwarm
      ? Math.max(170, 285 / profile.movementSpeed)
      : profile.spawnInterval * 0.27) / this.program.spawnFactor;

    if (this.spawnAccumulator >= spawnInterval) {
      this.spawnAccumulator = 0;
      const cap = 15 + Math.round(profile.movementSpeed * 4.2);
      const burstChance = inSwarm ? 0.48 : 0.34 + progress * 0.24;
      const burst = Math.random() < burstChance ? (Math.random() < 0.22 ? 3 : 2) : 1;
      for (let i = 0; i < burst && this.ants.length < cap; i += 1) {
        this.spawnAnt(102 + i * 2.7, inSwarm || Math.random() < 0.2);
      }
    }

    if (elapsed >= this.nextWaveAt) {
      this.spawnRush(profile);
      this.nextWaveAt += Math.max(4300, 6100 - progress * 1200);
    }

    const baseSpeed = 0.0148 * profile.movementSpeed;
    this.ants.forEach(ant => {
      ant.x -= baseSpeed * ant.speedFactor * dt;
      ant.element.style.left = `${ant.x}%`;
    });

    const escaped = this.ants.filter(ant => ant.x <= 7);
    escaped.forEach(ant => {
      ant.remove();
      this.engine.totalTargets += 1;
      this.engine.totalChars += ant.value.length;
      if (ant.golden) {
        this.goldenMissed += 1;
        this.engine.addScore(-8);
      } else {
        this.missed += 1;
        this.engine.addScore(-20);
      }
    });

    if (escaped.length) {
      this.combo = 0;
      this.buffer = "";
      this.renderBuffer();
      this.ants = this.ants.filter(ant => ant.alive);
      const normalEscapes = escaped.filter(ant => !ant.golden).length;
      const goldEscapes = escaped.length - normalEscapes;
      this.status.textContent = `${normalEscapes ? `${normalEscapes} ant${normalEscapes === 1 ? "" : "s"} escaped. ` : ""}${goldEscapes ? `${goldEscapes} golden bonus passed by. ` : ""}${Math.max(0, this.escapeLimit - this.missed)} regular escapes remain.`;
      this.status.className = "status-line bad";
      this.updateStats();
    } else if (Math.floor(elapsed / 650) !== Math.floor((elapsed - dt) / 650)) {
      this.updateStats();
    }

    const remaining = Math.max(0, this.durationMs - elapsed);
    this.engine.updateHUD({ timerMs: remaining });

    if (this.missed >= this.escapeLimit) {
      this.finish({
        success: false,
        score: this.engine.score,
        title: "Picnic overrun",
        variant: `${this.program.label} · ${this.site.label}`,
        extraStats: [
          ["Targets eaten", this.eaten],
          ["Best combo", this.bestCombo],
          ["Golden ants", this.goldenEaten],
          ["Pair targets", this.pairsEaten]
        ],
        message: `${this.missed} regular ants escaped. You cleared ${this.eaten} targets across three active picnic lanes.`
      });
      return;
    }

    if (remaining <= 0) {
      this.engine.addScore(Math.max(0, this.escapeLimit - this.missed) * 35 + this.bestCombo * 3);
      this.finish({
        success: true,
        score: this.engine.score,
        title: "Picnic complete",
        variant: `${this.program.label} · ${this.site.label}`,
        extraStats: [
          ["Targets eaten", this.eaten],
          ["Best combo", this.bestCombo],
          ["Golden ants", this.goldenEaten],
          ["Pair targets", this.pairsEaten],
          ["Shift targets", this.uppercaseEaten]
        ],
        message: `The chameleon ate ${this.eaten} targets while ${this.missed} regular ants escaped through ${this.waveNumber} rushes and ${this.swarmNumber} swarms.`
      });
      return;
    }

    this.animationId = requestAnimationFrame(next => this.frame(next));
  }

  getHUDTime() {
    return Math.max(0, this.durationMs - this.engine.getElapsedMs());
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener("keydown", this.handleKeydown);
    this.ants.forEach(ant => ant.remove());
    this.ants = [];
  }
}
