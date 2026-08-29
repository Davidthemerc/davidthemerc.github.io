import { hyperSoftShouldBypassTypingEvent } from "../core/accessibilityUtils.js";
import { PREFIX_SUFFIX_CHUNKS } from "../core/config.js";

const STATIONS = {
  research: { label: "Research Platform", maxHull: 7, maxShield: 1, scoreFactor: 1, spawnFactor: 1 },
  relay: { label: "Relay Array", maxHull: 5, maxShield: 3, scoreFactor: 1.08, spawnFactor: 1 },
  cargo: { label: "Cargo Hub", maxHull: 9, maxShield: 0, scoreFactor: 0.95, spawnFactor: 1.04 },
  defense: { label: "Defense Node", maxHull: 6, maxShield: 2, scoreFactor: 1.16, spawnFactor: 0.94 }
};

const MISSIONS = {
  patrol: { label: "Standard Patrol", armorChance: 0.14, stormFactor: 1, powerChance: 0.08 },
  armor: { label: "Armored Field", armorChance: 0.36, stormFactor: 1.05, powerChance: 0.07 },
  storm: { label: "Storm Watch", armorChance: 0.16, stormFactor: 1.35, powerChance: 0.07 },
  salvage: { label: "Salvage Shift", armorChance: 0.18, stormFactor: 0.95, powerChance: 0.16 }
};

const DURATIONS = {
  short: { label: "Short Watch", ms: 45000 },
  standard: { label: "Standard Watch", ms: 65000 },
  endurance: { label: "Endurance Watch", ms: 90000 }
};

export class SpaceJunkGame {
  constructor({ stage, engine, finish, gameOptions = {} }) {
    this.stage = stage;
    this.engine = engine;
    this.finish = finish;
    this.gameOptions = gameOptions;
    this.stationProfile = STATIONS[gameOptions.spaceStation] ?? STATIONS.research;
    this.mission = MISSIONS[gameOptions.spaceMission] ?? MISSIONS.patrol;
    this.watch = DURATIONS[gameOptions.spaceDuration] ?? DURATIONS.standard;
    this.running = false;
    this.finished = false;
    this.durationMs = this.watch.ms;
    this.debris = [];
    this.buffer = "";
    this.spawnAccumulator = 0;
    this.lastFrame = 0;
    this.animationId = null;
    this.maxHull = this.stationProfile.maxHull;
    this.hull = this.maxHull;
    this.maxShield = this.stationProfile.maxShield;
    this.shield = this.maxShield;
    this.destroyed = 0;
    this.fragmentsCleared = 0;
    this.armoredDestroyed = 0;
    this.powerupsCollected = 0;
    this.shieldAbsorptions = 0;
    this.waveNumber = 0;
    this.nextWaveAt = 7800;
    this.currentWave = "Approach traffic";
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  start() {
    this.running = true;
    this.finished = false;
    this.stage.innerHTML = `
      <div class="space-stage space-defense-stage" id="spaceStage">
        <div class="station ${this.maxShield ? "station-shielded" : ""}" id="spaceStation">
          <div class="shield-ring" id="shieldRing"></div>
        </div>
        <div class="space-wave-banner" id="spaceWaveBanner">WAVE 0 · Approach Traffic</div>
        <div class="space-input-panel space-defense-panel">
          <span class="eyebrow">${this.stationProfile.label} • ${this.mission.label}</span>
          <div class="typing-prompt" id="spaceBuffer" style="font-size:1.5rem">—</div>
          <div class="status-line" id="spaceStatus">Multiple objects inbound. Armored targets require more than one fragment.</div>
          <strong id="hullStatus">Hull ${this.hull}/${this.maxHull} · Shield ${this.shield}/${this.maxShield} · Destroyed 0</strong>
          <div class="space-defense-readout" id="spaceDefenseReadout">Wave 0 · Fragments 0 · Armored 0 · Defense pickups 0</div>
        </div>
      </div>
    `;

    this.playfield = this.stage.querySelector("#spaceStage");
    this.bufferEl = this.stage.querySelector("#spaceBuffer");
    this.status = this.stage.querySelector("#spaceStatus");
    this.hullStatus = this.stage.querySelector("#hullStatus");
    this.defenseReadout = this.stage.querySelector("#spaceDefenseReadout");
    this.waveBanner = this.stage.querySelector("#spaceWaveBanner");
    this.stationEl = this.stage.querySelector("#spaceStation");
    this.shieldRing = this.stage.querySelector("#shieldRing");

    window.addEventListener("keydown", this.handleKeydown);
    this.lastFrame = performance.now();

    this.spawnDebris(-5);
    this.spawnDebris(4);
    this.spawnDebris(13, false, { armored: this.mission === MISSIONS.armor });
    this.updateDefense();
    this.animationId = requestAnimationFrame(time => this.frame(time));
  }

  pickChunk(progress, avoid = null) {
    const profile = this.engine.getScaledDifficulty(progress);
    const maxLength = Math.min(7, Math.max(4, profile.wordMax - 2));
    const minLength = progress > 0.55 ? 3 : 2;
    let filtered = PREFIX_SUFFIX_CHUNKS.filter(chunk => chunk.length >= minLength && chunk.length <= maxLength);
    if (avoid) filtered = filtered.filter(chunk => chunk !== avoid);
    const pool = filtered.length ? filtered : PREFIX_SUFFIX_CHUNKS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  buildFragments(progress, armored) {
    const first = this.pickChunk(progress);
    if (!armored) return [first];
    return [first, this.pickChunk(progress, first)];
  }

  spawnDebris(startY = -8, storm = false, forced = {}) {
    const progress = Math.min(1, this.engine.getElapsedMs() / this.durationMs);
    const armored = forced.armored ?? (Math.random() < (this.mission.armorChance + progress * 0.08));
    const powerup = forced.powerup ?? (!armored && Math.random() < this.mission.powerChance);
    const fragments = powerup ? [this.pickChunk(progress)] : this.buildFragments(progress, armored);
    const x = forced.x ?? (9 + Math.random() * 82);
    const entity = this.engine.spawnEntity(this.playfield, {
      className: `debris ${storm ? "storm-debris" : ""} ${armored ? "armored-debris" : ""} ${powerup ? "defense-pickup" : ""}`,
      html: this.debrisHtml(fragments[0], armored ? fragments.length : 0, powerup),
      x,
      y: startY,
      dataset: { value: fragments[0] }
    });

    entity.fragments = fragments;
    entity.fragmentIndex = 0;
    entity.value = fragments[0];
    entity.armored = armored;
    entity.powerup = powerup;
    entity.powerType = powerup ? (Math.random() < 0.58 ? "shield" : "patch") : null;
    entity.x = x;
    entity.y = startY;
    entity.speedFactor = storm ? 1.18 + Math.random() * 0.38 : 0.78 + Math.random() * 0.58;
    if (armored) entity.speedFactor *= 0.9;
    if (powerup) entity.speedFactor *= 0.86;
    entity.drift = forced.drift ?? ((Math.random() - 0.5) * (storm ? 0.0024 : 0.0015));
    entity.element.style.left = `${entity.x}%`;
    entity.element.style.top = `${entity.y}%`;
    this.debris.push(entity);
  }

  debrisHtml(value, armorRemaining = 0, powerup = false) {
    if (powerup) return `<span class="debris-token">${value}</span><small>DEFENSE</small>`;
    const pips = armorRemaining > 1 ? `<small class="armor-pips">ARMOR ${"◆".repeat(armorRemaining)}</small>` : "";
    return `<span class="debris-token">${value}</span>${pips}`;
  }

  spawnWave(profile) {
    this.waveNumber += 1;
    const cycle = this.waveNumber % 5;
    let name = "Cluster";
    let count = 4;
    let factory = i => ({ startY: -10 - i * 4, storm: false, forced: {} });

    if (this.mission === MISSIONS.storm || cycle === 1) {
      name = "Velocity Storm";
      count = 4 + (profile.movementSpeed >= 1.15 ? 1 : 0);
      factory = i => ({ startY: -10 - i * 4, storm: true, forced: {} });
    } else if (this.mission === MISSIONS.armor || cycle === 2) {
      name = "Armored Convoy";
      count = 3 + (profile.movementSpeed >= 1.3 ? 1 : 0);
      factory = i => ({ startY: -12 - i * 5, storm: false, forced: { armored: true } });
    } else if (cycle === 3) {
      name = "Crossfire";
      count = 5;
      factory = i => ({
        startY: -8 - (i % 2) * 5,
        storm: i % 2 === 0,
        forced: { x: 14 + i * 18, drift: (i % 2 ? -1 : 1) * 0.0022 }
      });
    } else if (this.mission === MISSIONS.salvage || cycle === 4) {
      name = "Salvage Window";
      count = 4;
      factory = i => ({ startY: -10 - i * 4, storm: false, forced: { powerup: i < 2, armored: false } });
    }

    const cap = 12 + Math.round(profile.movementSpeed * 3.2);
    for (let i = 0; i < count && this.debris.length < cap; i += 1) {
      const spec = factory(i);
      this.spawnDebris(spec.startY, spec.storm, spec.forced);
    }

    this.currentWave = name;
    this.waveBanner.textContent = `WAVE ${this.waveNumber} · ${name.toUpperCase()}`;
    this.waveBanner.classList.remove("flash");
    void this.waveBanner.offsetWidth;
    this.waveBanner.classList.add("flash");
    this.status.textContent = `${name} wave ${this.waveNumber}! ${count} contacts entered the approach corridor.`;
    this.status.className = "status-line bad";
    this.updateDefense();
  }

  handleKeydown(event) {
    if (hyperSoftShouldBypassTypingEvent(event)) return;
    if (!this.running || event.ctrlKey || event.metaKey || event.altKey) return;

    if (/^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault();
      const key = event.key.toLowerCase();
      let attempt = this.buffer + key;
      let possible = this.debris.filter(item => item.value.startsWith(attempt));
      if (!possible.length && this.buffer) {
        attempt = key;
        possible = this.debris.filter(item => item.value.startsWith(attempt));
      }
      if (!possible.length) {
        this.buffer = "";
        this.engine.recordKeystroke(false);
        this.engine.addScore(-10);
        this.status.textContent = "No tracked fragment matches that sequence. Terminal cleared.";
        this.status.className = "status-line bad";
        this.renderBuffer();
        return;
      }

      this.buffer = attempt;
      this.engine.recordKeystroke(true, 0, key);
      this.checkBuffer();
      this.renderBuffer();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      this.buffer = this.buffer.slice(0, -1);
      this.renderBuffer();
    } else if (event.key === "Escape") {
      this.buffer = "";
      this.renderBuffer();
    }
  }

  checkBuffer() {
    const exact = this.debris
      .filter(item => item.value === this.buffer)
      .sort((a, b) => b.y - a.y)[0];

    if (!exact) return;

    this.fragmentsCleared += 1;
    this.engine.correctTargets += 1;
    this.engine.totalTargets += 1;
    const fragmentScore = (70 + exact.value.length * 14 + (exact.speedFactor > 1.14 ? 22 : 0)) * this.stationProfile.scoreFactor;
    this.engine.addScore(Math.round(fragmentScore));
    this.buffer = "";

    if (exact.powerup) {
      this.collectPowerup(exact);
      return;
    }

    if (exact.fragmentIndex < exact.fragments.length - 1) {
      exact.fragmentIndex += 1;
      exact.value = exact.fragments[exact.fragmentIndex];
      exact.element.dataset.value = exact.value;
      exact.element.innerHTML = this.debrisHtml(exact.value, exact.fragments.length - exact.fragmentIndex, false);
      exact.element.classList.add("armor-hit");
      window.setTimeout(() => exact.element?.classList.remove("armor-hit"), 240);
      exact.y = Math.max(-4, exact.y - 7);
      this.status.textContent = `Armor cracked. New fragment ${exact.value} exposed; the object was pushed back.`;
      this.status.className = "status-line good";
      this.updateDefense();
      return;
    }

    this.destroyObject(exact);
  }

  destroyObject(exact) {
    exact.remove();
    this.debris = this.debris.filter(item => item !== exact);
    this.destroyed += 1;
    if (exact.armored) {
      this.armoredDestroyed += 1;
      this.engine.addScore(55);
    }
    this.status.textContent = `${exact.armored ? "Armored contact" : exact.value} neutralized. ${this.debris.length} tracked objects remain.`;
    this.status.className = "status-line good";

    if (this.destroyed > 0 && this.destroyed % 11 === 0) {
      if (this.shield < this.maxShield) {
        this.shield += 1;
        this.status.textContent += " Defense capacitor restored one shield charge.";
      } else if (this.hull < this.maxHull) {
        this.hull += 1;
        this.status.textContent += " Emergency patch restored one hull point.";
      }
    }

    this.updateDefense();
  }

  collectPowerup(item) {
    item.remove();
    this.debris = this.debris.filter(entry => entry !== item);
    this.powerupsCollected += 1;
    this.engine.addScore(45);

    if (item.powerType === "shield" && this.maxShield > 0) {
      const before = this.shield;
      this.shield = Math.min(this.maxShield, this.shield + 1);
      if (this.shield > before) {
        this.status.textContent = "Defense pickup acquired: one shield charge restored.";
      } else if (this.hull < this.maxHull) {
        this.hull += 1;
        this.status.textContent = "Shield bank was full, so the pickup patched one hull point instead.";
      } else {
        this.engine.addScore(80);
        this.status.textContent = "Defense systems already full. Pickup converted to bonus score.";
      }
    } else if (this.hull < this.maxHull) {
      this.hull += 1;
      this.status.textContent = "Repair pickup acquired: one hull point restored.";
    } else if (this.maxShield > 0 && this.shield < this.maxShield) {
      this.shield += 1;
      this.status.textContent = "Hull already full. Repair pickup charged the shield bank instead.";
    } else {
      this.engine.addScore(80);
      this.status.textContent = "Defense systems already full. Pickup converted to bonus score.";
    }
    this.status.className = "status-line good";
    this.updateDefense();
  }

  renderBuffer() {
    this.bufferEl.textContent = this.buffer || "—";
  }

  updateDefense() {
    this.hullStatus.textContent = `Hull ${this.hull}/${this.maxHull} · Shield ${this.shield}/${this.maxShield} · Destroyed ${this.destroyed}`;
    this.defenseReadout.textContent = `Wave ${this.waveNumber} ${this.currentWave ? `· ${this.currentWave}` : ""} · Fragments ${this.fragmentsCleared} · Armored ${this.armoredDestroyed} · Defense pickups ${this.powerupsCollected}`;
    if (this.stationEl) this.stationEl.classList.toggle("station-shielded", this.shield > 0);
    if (this.shieldRing) this.shieldRing.dataset.charges = String(this.shield);
  }

  frame(time) {
    if (!this.running) return;

    const dt = Math.min(50, time - this.lastFrame);
    this.lastFrame = time;
    const elapsed = this.engine.getElapsedMs();
    const progress = Math.min(1, elapsed / this.durationMs);
    const profile = this.engine.getScaledDifficulty(progress);

    this.spawnAccumulator += dt;
    const spawnInterval = profile.spawnInterval * 0.56 * this.stationProfile.spawnFactor / this.mission.stormFactor;
    if (this.spawnAccumulator >= spawnInterval) {
      this.spawnAccumulator = 0;
      const cap = 11 + Math.round(profile.movementSpeed * 3.2);
      const burst = Math.random() < (0.25 + progress * 0.16) ? 2 : 1;
      for (let i = 0; i < burst && this.debris.length < cap; i += 1) {
        this.spawnDebris(-8 - i * 5, this.mission === MISSIONS.storm && Math.random() < 0.22);
      }
    }

    if (elapsed >= this.nextWaveAt) {
      this.spawnWave(profile);
      const baseGap = this.mission === MISSIONS.storm ? 7200 : 8500;
      this.nextWaveAt += Math.max(6100, baseGap - progress * 1700);
    }

    const baseSpeed = 0.0115 * profile.movementSpeed * this.mission.stormFactor;
    this.debris.forEach(item => {
      item.y += baseSpeed * item.speedFactor * dt;
      item.x += item.drift * dt;
      if (item.x < 7 || item.x > 93) item.drift *= -1;
      item.element.style.top = `${item.y}%`;
      item.element.style.left = `${item.x}%`;
    });

    const collided = this.debris.filter(item => item.y >= 85);
    let hullDamage = 0;
    let absorbed = 0;
    collided.forEach(item => {
      item.remove();
      const damage = item.armored ? 2 : 1;
      if (item.powerup) {
        this.engine.addScore(-8);
        return;
      }
      if (this.shield > 0) {
        this.shield -= 1;
        this.shieldAbsorptions += 1;
        absorbed += 1;
      } else {
        this.hull -= damage;
        hullDamage += damage;
      }
      this.engine.totalTargets += 1;
      this.engine.totalChars += item.value.length;
      this.engine.addScore(item.armored ? -50 : -35);
    });

    if (collided.length) {
      this.debris = this.debris.filter(item => item.alive);
      this.buffer = "";
      this.renderBuffer();
      this.status.textContent = `${collided.length} contact${collided.length === 1 ? "" : "s"} reached the station.${absorbed ? ` Shield absorbed ${absorbed}.` : ""}${hullDamage ? ` Hull lost ${hullDamage}.` : ""}`;
      this.status.className = "status-line bad";
      this.updateDefense();
    }

    const remaining = Math.max(0, this.durationMs - elapsed);
    this.engine.updateHUD({ timerMs: remaining });

    if (this.hull <= 0) {
      this.complete({
        success: false,
        score: this.engine.score,
        title: "Station disabled",
        variant: `${this.stationProfile.label} · ${this.mission.label} · ${this.watch.label}`,
        extraStats: [
          ["Waves survived", this.waveNumber],
          ["Objects destroyed", this.destroyed],
          ["Armored destroyed", this.armoredDestroyed],
          ["Shield saves", this.shieldAbsorptions],
          ["Defense pickups", this.powerupsCollected]
        ],
        message: `The ${this.stationProfile.label.toLowerCase()} survived ${this.waveNumber} structured waves before orbital debris disabled it.`
      });
      return;
    }

    if (remaining <= 0) {
      this.engine.addScore(this.hull * 100 + this.shield * 70 + this.waveNumber * 30);
      this.complete({
        success: true,
        score: this.engine.score,
        title: "Orbit secured",
        variant: `${this.stationProfile.label} · ${this.mission.label} · ${this.watch.label}`,
        extraStats: [
          ["Waves cleared", this.waveNumber],
          ["Objects destroyed", this.destroyed],
          ["Armored destroyed", this.armoredDestroyed],
          ["Shield saves", this.shieldAbsorptions],
          ["Defense pickups", this.powerupsCollected]
        ],
        message: `You completed ${this.mission.label} with ${this.hull}/${this.maxHull} hull, ${this.shield}/${this.maxShield} shield, and ${this.destroyed} objects destroyed.`
      });
      return;
    }

    this.animationId = requestAnimationFrame(next => this.frame(next));
  }

  getHUDTime() {
    return Math.max(0, this.durationMs - this.engine.getElapsedMs());
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
    this.debris.forEach(item => item.remove());
    this.debris = [];
  }
}
