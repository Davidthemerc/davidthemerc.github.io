export class FarOffAdventuresGame {
  constructor({ stage, engine, finish, gameOptions = {} }) {
    this.stage = stage;
    this.engine = engine;
    this.finish = finish;
    this.options = gameOptions;
    this.running = false;
    this.altitude = 48;
    this.sequence = "";
    this.index = 0;
    this.lastKeyAt = 0;
    this.recentIntervals = [];
    this.lastFrame = 0;
    this.animationId = null;
    this.weatherIndex = 0;
    this.nextWeatherAt = 8500;
    this.weather = null;
    this.checkpoints = [0.25, 0.5, 0.75];
    this.checkpointResults = [];
    this.nextCheckpoint = 0;
    this.windOffset = 0;
    this.turbulenceCooldown = 0;
    this.handleKeydown = this.handleKeydown.bind(this);

    this.routeId = this.options.adventureRoute || "valley";
    this.lengthId = this.options.adventureLength || "standard";
    this.rhythmMode = this.options.adventureRhythm || "steady";
    this.routes = {
      valley: { label: "Gentle Valley", gravity: 0.88, wind: 0.55, weather: ["clear", "breeze", "clear", "cloud"] },
      ridge: { label: "Crosswind Ridge", gravity: 1, wind: 1.05, weather: ["breeze", "crosswind", "clear", "gust"] },
      storm: { label: "Storm Front", gravity: 1.08, wind: 1.25, weather: ["rain", "gust", "turbulence", "crosswind"] },
      alpine: { label: "Alpine Expedition", gravity: 1.12, wind: 1.12, weather: ["clear", "thinair", "crosswind", "turbulence"] }
    };
    this.route = this.routes[this.routeId] || this.routes.valley;
    const lengths = { short: 40000, standard: 55000, expedition: 80000 };
    this.durationMs = lengths[this.lengthId] || lengths.standard;
  }

  start() {
    this.running = true;
    this.sequence = Array.from({ length: 18 }, () => this.engine.generateWord()).join(" ");
    this.weather = this.route.weather[0];
    this.stage.innerHTML = `
      <div class="sky-stage route-${this.routeId}" id="skyStage">
        <div class="weather-layer" id="weatherLayer"></div>
        <div class="flight-zone-label" id="flightZoneLabel">LOWLANDS</div>
        <div class="flight-checkpoints" id="flightCheckpoints">
          ${this.checkpoints.map((_, i) => `<span data-checkpoint="${i}">CP${i + 1}</span>`).join("")}
        </div>
        <div class="balloon" id="balloon"><div class="balloon-body"></div><div class="balloon-basket"></div></div>
        <div class="rhythm-panel">
          <span class="eyebrow">${this.route.label} • ${this.getRhythmLabel()}</span>
          <div class="flight-instruments"><span id="weatherReadout">Weather: Clear</span><span id="cadenceReadout">Cadence: Steady</span></div>
          <div class="rhythm-text" id="rhythmText"></div>
          <div class="status-line" id="rhythmStatus">Type steadily and keep the balloon above the terrain.</div>
          <div class="meter"><span id="altitudeMeter"></span></div>
        </div>
      </div>
    `;
    this.sky = this.stage.querySelector("#skyStage");
    this.balloon = this.stage.querySelector("#balloon");
    this.rhythmText = this.stage.querySelector("#rhythmText");
    this.status = this.stage.querySelector("#rhythmStatus");
    this.meter = this.stage.querySelector("#altitudeMeter");
    this.weatherLayer = this.stage.querySelector("#weatherLayer");
    this.weatherReadout = this.stage.querySelector("#weatherReadout");
    this.cadenceReadout = this.stage.querySelector("#cadenceReadout");
    this.zoneLabel = this.stage.querySelector("#flightZoneLabel");
    this.checkpointEl = this.stage.querySelector("#flightCheckpoints");

    window.addEventListener("keydown", this.handleKeydown);
    this.lastFrame = performance.now();
    this.applyWeather(this.weather);
    this.renderText();
    this.animationId = requestAnimationFrame(time => this.frame(time));
  }

  getRhythmLabel() {
    return { steady: "Steady Rhythm", shift: "Pace Shifts", mixed: "Mixed Expedition" }[this.rhythmMode] || "Steady Rhythm";
  }

  getPaceTarget(progress) {
    const bands = [480, 360, 285, 410, 245];
    const idx = Math.floor(progress * bands.length) % bands.length;
    return bands[idx];
  }

  handleKeydown(event) {
    if (!this.running || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
    event.preventDefault();
    const expected = this.sequence[this.index];
    const actual = event.key.toLowerCase();
    const match = actual === expected;
    const now = performance.now();
    const interval = this.lastKeyAt ? now - this.lastKeyAt : 0;
    this.lastKeyAt = now;
    const progress = Math.min(1, this.engine.getElapsedMs() / this.durationMs);
    const profile = this.engine.getScaledDifficulty(progress);

    if (match) {
      this.engine.recordKeystroke(true, 2, expected);
      this.index += 1;
      let quality = 0.75;
      if (interval > 0) {
        this.recentIntervals.push(interval);
        if (this.recentIntervals.length > 8) this.recentIntervals.shift();
        if (this.rhythmMode === "steady" || (this.rhythmMode === "mixed" && this.weather !== "gust" && this.weather !== "turbulence")) {
          const avg = this.recentIntervals.reduce((sum, value) => sum + value, 0) / this.recentIntervals.length;
          const deviation = Math.abs(interval - avg) / Math.max(avg, 1);
          quality = Math.max(0, 1 - deviation / Math.max(0.12, profile.rhythmTolerance * 1.65));
          this.cadenceReadout.textContent = `Cadence: keep it even (${Math.round(avg)} ms)`;
        } else {
          const target = this.getPaceTarget(progress);
          const deviation = Math.abs(interval - target) / target;
          const tolerance = Math.max(0.18, profile.rhythmTolerance * 1.55);
          quality = Math.max(0, 1 - deviation / tolerance);
          this.cadenceReadout.textContent = `Cadence target: about ${target} ms/key`;
        }
      }

      const weatherPenalty = this.weather === "thinair" ? 0.82 : this.weather === "rain" ? 0.9 : 1;
      if (quality >= 0.55) {
        this.altitude = Math.min(96, this.altitude + (2.1 + quality * 2.8) * weatherPenalty);
        this.status.textContent = quality > 0.82 ? "Excellent cadence. The balloon climbs cleanly." : "Rhythm holding. Altitude improving.";
        this.status.className = "status-line good";
      } else {
        this.altitude = Math.max(0, this.altitude - 1.5);
        this.status.textContent = this.rhythmMode === "steady" ? "Correct key, uneven rhythm. Altitude slips." : "Correct key, wrong pace for this leg.";
        this.status.className = "status-line";
      }
    } else {
      this.engine.recordKeystroke(false, 0, expected);
      this.engine.addScore(-4);
      this.altitude = Math.max(0, this.altitude - 6.5);
      this.status.textContent = "Wrong key. Blake's balloon insurance premium rises.";
      this.status.className = "status-line bad";
    }

    if (this.index >= this.sequence.length - 30) this.sequence += " " + Array.from({ length: 8 }, () => this.engine.generateWord()).join(" ");
    this.renderText();
  }

  applyWeather(weather) {
    const labels = { clear: "Clear", breeze: "Light breeze", cloud: "Cloud layer", crosswind: "Crosswind", gust: "Strong gusts", rain: "Rain", turbulence: "Turbulence", thinair: "Thin air" };
    this.weather = weather;
    this.weatherReadout.textContent = `Weather: ${labels[weather] || weather}`;
    this.sky.dataset.weather = weather;
    this.weatherLayer.className = `weather-layer weather-${weather}`;
  }

  rotateWeather(elapsed) {
    if (elapsed < this.nextWeatherAt) return;
    this.weatherIndex = (this.weatherIndex + 1) % this.route.weather.length;
    this.applyWeather(this.route.weather[this.weatherIndex]);
    this.nextWeatherAt = elapsed + 8500 + Math.random() * 4500;
    this.status.textContent = `Weather change: ${this.weatherReadout.textContent.replace("Weather: ", "")}. Adjust without losing your rhythm.`;
    this.status.className = "status-line";
  }

  updateCheckpoint(progress) {
    if (this.nextCheckpoint >= this.checkpoints.length || progress < this.checkpoints[this.nextCheckpoint]) return;
    const passed = this.altitude >= 36 + this.nextCheckpoint * 7;
    this.checkpointResults.push(passed);
    const marker = this.checkpointEl.querySelector(`[data-checkpoint="${this.nextCheckpoint}"]`);
    if (marker) marker.classList.add(passed ? "passed" : "missed");
    if (passed) {
      this.engine.addScore(125 + this.nextCheckpoint * 50);
      this.altitude = Math.min(96, this.altitude + 5);
      this.status.textContent = `Checkpoint ${this.nextCheckpoint + 1} cleared. Bonus altitude awarded.`;
      this.status.className = "status-line good";
    } else {
      this.status.textContent = `Checkpoint ${this.nextCheckpoint + 1} reached too low. No checkpoint bonus.`;
      this.status.className = "status-line bad";
    }
    this.nextCheckpoint += 1;
  }

  updateZone() {
    let zone = "LOWLANDS";
    if (this.altitude >= 72) zone = "HIGH AIR";
    else if (this.altitude >= 48) zone = "CLOUD LAYER";
    else if (this.altitude >= 26) zone = "MID ALTITUDE";
    this.zoneLabel.textContent = zone;
  }

  renderText() {
    const start = Math.max(0, this.index - 18);
    const end = Math.min(this.sequence.length, this.index + 72);
    const before = this.escape(this.sequence.slice(start, this.index));
    const current = this.escape(this.sequence[this.index] ?? "");
    const after = this.escape(this.sequence.slice(this.index + 1, end));
    this.rhythmText.innerHTML = `<span class="done">${before}</span><span class="current">${current || " "}</span><span class="future">${after}</span>`;
  }

  frame(time) {
    if (!this.running) return;
    const dt = Math.min(50, time - this.lastFrame);
    this.lastFrame = time;
    const elapsed = this.engine.getElapsedMs();
    const progress = Math.min(1, elapsed / this.durationMs);
    const profile = this.engine.getScaledDifficulty(progress);
    this.rotateWeather(elapsed);
    this.updateCheckpoint(progress);
    this.updateZone();

    const sinceKey = this.lastKeyAt ? time - this.lastKeyAt : 0;
    const weatherGravity = { clear: 1, breeze: 1.02, cloud: 1.05, crosswind: 1.08, gust: 1.12, rain: 1.12, turbulence: 1.18, thinair: 1.22 }[this.weather] || 1;
    const idlePenalty = sinceKey > 900 ? (0.012 * profile.movementSpeed) : 0;
    const gravity = 0.0048 * profile.movementSpeed * this.route.gravity * weatherGravity;
    this.altitude = Math.max(0, this.altitude - (gravity + idlePenalty) * dt);

    const windDirection = Math.sin(elapsed / 1800 + this.weatherIndex) * this.route.wind;
    const windMultiplier = this.weather === "crosswind" ? 2.4 : this.weather === "gust" ? 3.2 : this.weather === "turbulence" ? 2.1 : 1;
    this.windOffset = Math.max(-8, Math.min(8, windDirection * windMultiplier));
    if (this.weather === "turbulence" && elapsed > this.turbulenceCooldown && Math.random() < 0.008) {
      this.altitude = Math.max(0, this.altitude - 4);
      this.turbulenceCooldown = elapsed + 1800;
      this.status.textContent = "Turbulence jolt! Keep typing through it.";
      this.status.className = "status-line bad";
    }

    this.balloon.style.bottom = `${6 + this.altitude * 0.76}%`;
    this.balloon.style.transform = `translateX(${this.windOffset * 10}px) rotate(${this.windOffset * 0.7}deg)`;
    this.meter.style.width = `${this.altitude}%`;

    const remaining = Math.max(0, this.durationMs - elapsed);
    this.engine.updateHUD({ timerMs: remaining });
    if (this.altitude <= 0) {
      this.finish({
        success: false,
        score: this.engine.score,
        variant: `${this.route.label} / ${this.getRhythmLabel()}`,
        title: "Balloon down",
        message: "The expedition reached the ground before the itinerary said it should. Weather has declined to comment.",
        extraStats: [["Route", this.route.label], ["Checkpoints", `${this.checkpointResults.filter(Boolean).length}/${this.checkpoints.length}`], ["Rhythm", this.getRhythmLabel()]]
      });
      return;
    }
    if (remaining <= 0) {
      const cleared = this.checkpointResults.filter(Boolean).length;
      this.engine.addScore(Math.round(this.altitude * 4 + cleared * 90));
      this.finish({
        success: true,
        score: this.engine.score,
        variant: `${this.route.label} / ${this.getRhythmLabel()}`,
        title: "Expedition complete",
        message: `You finished at ${Math.round(this.altitude)}% altitude and cleared ${cleared} of ${this.checkpoints.length} checkpoints. Blake is calling this aviation certification.`,
        extraStats: [["Route", this.route.label], ["Final altitude", `${Math.round(this.altitude)}%`], ["Checkpoints", `${cleared}/${this.checkpoints.length}`], ["Rhythm", this.getRhythmLabel()]]
      });
      return;
    }
    this.animationId = requestAnimationFrame(next => this.frame(next));
  }

  getHUDTime() { return Math.max(0, this.durationMs - this.engine.getElapsedMs()); }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener("keydown", this.handleKeydown);
  }

  escape(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }
}
