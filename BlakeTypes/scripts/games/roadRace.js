const ROAD_TRACKS = {
  city: { name: "Downtown Loop", className: "city" },
  desert: { name: "Desert Straight", className: "desert" },
  alpine: { name: "Alpine Run", className: "alpine" },
  night: { name: "Night Freeway", className: "night" }
};

const ROAD_OPPONENTS = {
  ledger: { name: "Dana Ledger", pace: 0.90, behavior: "steady", color: "#a34b4b", note: "Steady pace, very few surprises." },
  quick: { name: "Vic Quick", pace: 1.05, behavior: "burst", color: "#bf6a3f", note: "Periodic bursts of speed." },
  closer: { name: "Morgan Closer", pace: 0.93, behavior: "lateRush", color: "#7a579c", note: "Starts manageable, finishes aggressively." },
  bot: { name: "BLAKE-BOT 2000", pace: 1.12, behavior: "steady", color: "#4f718b", note: "HyperSoft's questionable attempt to automate Blake." }
};

const ROAD_LENGTHS = {
  sprint: { name: "Sprint", factor: 0.70 },
  standard: { name: "Standard", factor: 1 },
  endurance: { name: "Endurance", factor: 1.48 }
};

const SENTENCE_STARTERS = ["The", "A", "Every", "Some", "This", "That", "One", "Several", "Another"];
const SENTENCE_CONNECTORS = ["while", "because", "although", "before", "after", "when", "and", "but", "so"];

export class RoadRaceGame {
  constructor({ stage, engine, finish, gameOptions = {} }) {
    this.stage = stage;
    this.engine = engine;
    this.finish = finish;
    this.running = false;
    this.gameOptions = gameOptions;

    this.trackConfig = ROAD_TRACKS[gameOptions.roadTrack] || ROAD_TRACKS.city;
    this.opponent = ROAD_OPPONENTS[gameOptions.roadOpponent] || ROAD_OPPONENTS.ledger;
    this.lengthConfig = ROAD_LENGTHS[gameOptions.roadLength] || ROAD_LENGTHS.standard;
    this.textStyle = gameOptions.roadTextStyle || "salad";

    this.playerProgress = 4;
    this.opponentProgress = 4;
    this.words = [];
    this.wordElements = [];
    this.currentWordIndex = 0;
    this.typedBuffer = "";
    this.wordsCompleted = 0;
    this.lastFrame = 0;
    this.animationId = null;
    this.burstUntil = 0;
    this.nextBurstAt = 4500 + Math.random() * 3500;
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  start() {
    this.running = true;
    this.stage.innerHTML = `
      <div class="race-stage" data-track="${this.trackConfig.className}">
        <div class="road-marking"></div>
        <div class="race-track-sign"><strong>${this.trackConfig.name}</strong><span>${this.lengthConfig.name} • ${this.textStyleLabel()}</span></div>
        <div class="race-car player-car" id="playerCar"><span class="race-car-label">YOU</span></div>
        <div class="race-car opponent-car" id="opponentCar"><span class="race-car-label">${this.opponent.name}</span></div>
        <div class="race-dashboard">
          <div class="race-dashboard-heading">
            <span class="eyebrow" style="color:#8fd0e4">${this.textStyleLabel()}</span>
            <span id="raceWordCount">0 tokens cleared</span>
          </div>
          <div class="race-opponent-readout"><strong>${this.opponent.name}</strong><span>${this.opponent.note}</span></div>
          <div class="race-stream-viewport" id="raceStreamViewport" aria-label="Scrolling typing passage">
            <div class="race-stream-track" id="raceStreamTrack"></div>
          </div>
          <input
            id="raceInput"
            class="typing-input race-capture-input"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            aria-label="Typed word stream display"
            readonly
            tabindex="-1"
          />
          <div class="status-line" id="raceStatus" style="color:#bdc9ce">
            Just start typing — no click required. Press Space after each completed token.
          </div>
        </div>
      </div>
    `;

    this.playerCar = this.stage.querySelector("#playerCar");
    this.opponentCar = this.stage.querySelector("#opponentCar");
    this.viewport = this.stage.querySelector("#raceStreamViewport");
    this.track = this.stage.querySelector("#raceStreamTrack");
    this.input = this.stage.querySelector("#raceInput");
    this.status = this.stage.querySelector("#raceStatus");
    this.wordCount = this.stage.querySelector("#raceWordCount");
    this.opponentCar.style.background = this.opponent.color;

    window.addEventListener("keydown", this.handleKeydown);
    this.appendWords(this.textStyle === "sentences" ? 110 : 150);
    this.renderCurrentWord();
    this.renderCars();
    this.scrollToCurrent(false);
    this.lastFrame = performance.now();
    this.animationId = requestAnimationFrame(time => this.frame(time));
  }

  textStyleLabel() {
    return {
      salad: "Classic Word Salad",
      office: "Office Stream",
      technical: "Technical Stream",
      sentences: "Sentence Run"
    }[this.textStyle] || "Classic Word Salad";
  }

  appendWords(count) {
    const generated = this.textStyle === "sentences"
      ? this.generateSentenceTokens(count)
      : Array.from({ length: count }, () => this.generateStreamWord());

    generated.forEach(word => this.pushToken(word));
  }

  generateStreamWord() {
    const progress = Math.min(1, this.playerProgress / 100);
    const list = this.textStyle === "office" ? "office" : this.textStyle === "technical" ? "technical" : undefined;
    let word = this.engine.generateWord(list, { progress });
    const previous = this.words.at(-1) ?? "";
    let safety = 0;
    while (word === previous && safety < 6) {
      word = this.engine.generateWord(list, { progress });
      safety += 1;
    }
    return word;
  }

  generateSentenceTokens(targetCount) {
    const tokens = [];
    while (tokens.length < targetCount) {
      const length = 7 + Math.floor(Math.random() * 7);
      const sentence = [];
      for (let i = 0; i < length; i += 1) {
        let word = this.engine.generateWord(undefined, { progress: Math.min(1, this.playerProgress / 100) });
        if (i === 0) {
          word = `${SENTENCE_STARTERS[Math.floor(Math.random() * SENTENCE_STARTERS.length)]} ${word}`;
          sentence.push(...word.split(" "));
          continue;
        }
        if (i === Math.floor(length / 2) && Math.random() < 0.55) {
          sentence.push(`${word},`);
          sentence.push(SENTENCE_CONNECTORS[Math.floor(Math.random() * SENTENCE_CONNECTORS.length)]);
        } else {
          sentence.push(word);
        }
      }
      if (sentence.length) {
        const lastIndex = sentence.length - 1;
        const punctuation = Math.random() < 0.18 ? "!" : Math.random() < 0.16 ? "?" : ".";
        sentence[lastIndex] = `${sentence[lastIndex]}${punctuation}`;
      }
      tokens.push(...sentence);
    }
    return tokens.slice(0, targetCount);
  }

  pushToken(word) {
    const index = this.words.length;
    this.words.push(word);
    const token = document.createElement("span");
    token.className = "race-stream-word upcoming";
    token.dataset.index = String(index);
    token.textContent = word;
    this.track.appendChild(token);
    this.wordElements.push(token);
  }

  handleKeydown(event) {
    if (!this.running || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof HTMLElement &&
        event.target.matches("button, select, textarea, a[href], input:not(#raceInput)")) return;

    if (event.key === "Backspace") {
      event.preventDefault();
      if (this.typedBuffer.length) {
        this.typedBuffer = this.typedBuffer.slice(0, -1);
        this.renderCurrentWord();
      }
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
      this.handleSpace();
      return;
    }

    if (event.key.length !== 1) return;
    event.preventDefault();

    const currentWord = this.words[this.currentWordIndex];
    if (!currentWord) return;
    const expectedChar = currentWord[this.typedBuffer.length];
    if (expectedChar === undefined) return;

    const typedChar = this.textStyle === "sentences" ? event.key : event.key.toLowerCase();
    const expected = this.textStyle === "sentences" ? expectedChar : expectedChar.toLowerCase();
    const correct = typedChar === expected;
    this.engine.recordKeystroke(correct, correct ? 0.8 : 0);

    if (correct) {
      this.typedBuffer += this.textStyle === "sentences" ? event.key : event.key.toLowerCase();
      this.status.textContent = this.typedBuffer.length === currentWord.length
        ? "Token complete — press Space and keep the ribbon moving."
        : "Keep typing. Blake is gaining ground.";
      this.status.className = "status-line good";
    } else {
      this.engine.addScore(-4);
      this.playerProgress = Math.max(0, this.playerProgress - 0.18);
      this.status.textContent = `Expected “${expectedChar}”. The stream waits for the correct key.`;
      this.status.className = "status-line bad";
    }

    this.renderCurrentWord();
    this.renderCars();
    this.engine.updateHUD();
  }

  handleSpace() {
    const currentWord = this.words[this.currentWordIndex];
    if (!currentWord) return;
    const complete = this.typedBuffer === currentWord;
    this.engine.recordKeystroke(complete, complete ? 1 : 0);

    if (!complete) {
      this.engine.addScore(-7);
      this.playerProgress = Math.max(0, this.playerProgress - 0.35);
      this.status.textContent = "Finish the highlighted token before pressing Space.";
      this.status.className = "status-line bad";
      this.renderCars();
      this.engine.updateHUD();
      return;
    }

    const finishedElement = this.wordElements[this.currentWordIndex];
    finishedElement?.classList.remove("current", "upcoming");
    finishedElement?.classList.add("done");
    finishedElement.textContent = currentWord;

    this.engine.correctTargets += 1;
    this.engine.totalTargets += 1;
    this.engine.addScore(72 + currentWord.length * 9);
    this.wordsCompleted += 1;

    const profile = this.engine.getScaledDifficulty(this.playerProgress / 100);
    const lengthFactor = this.lengthConfig.factor;
    const tokenAdvance = ((2.05 + currentWord.length * 0.11) / (0.88 + profile.movementSpeed * 0.12)) / lengthFactor;
    this.playerProgress = Math.min(100, this.playerProgress + tokenAdvance);

    this.currentWordIndex += 1;
    this.typedBuffer = "";
    this.input.value = "";
    this.wordCount.textContent = `${this.wordsCompleted} token${this.wordsCompleted === 1 ? "" : "s"} cleared`;
    this.status.textContent = "Clean token. Keep the run moving.";
    this.status.className = "status-line good";

    if (this.currentWordIndex > this.words.length - 40) this.appendWords(90);
    this.renderCurrentWord();
    this.scrollToCurrent(true);
    this.renderCars();
    this.engine.updateHUD();
    this.checkFinish();
  }

  renderCurrentWord() {
    const currentWord = this.words[this.currentWordIndex];
    const currentElement = this.wordElements[this.currentWordIndex];
    if (!currentWord || !currentElement) return;

    this.wordElements.forEach((element, index) => {
      if (index < this.currentWordIndex) {
        element.classList.remove("current", "upcoming");
        element.classList.add("done");
      } else if (index === this.currentWordIndex) {
        element.classList.remove("done", "upcoming");
        element.classList.add("current");
      } else {
        element.classList.remove("done", "current");
        element.classList.add("upcoming");
      }
    });

    const typed = this.escape(this.typedBuffer);
    const remaining = this.escape(currentWord.slice(this.typedBuffer.length));
    currentElement.innerHTML = `<span class="race-typed-prefix">${typed}</span><span>${remaining}</span>`;
    this.input.value = this.typedBuffer;
  }

  scrollToCurrent(smooth = true) {
    const currentElement = this.wordElements[this.currentWordIndex];
    if (!currentElement || !this.viewport) return;
    requestAnimationFrame(() => {
      const targetLeft = Math.max(0, currentElement.offsetLeft - this.viewport.clientWidth * 0.28);
      this.viewport.scrollTo({ left: targetLeft, behavior: smooth ? "smooth" : "auto" });
    });
  }

  frame(time) {
    if (!this.running) return;
    const dt = Math.min(50, time - this.lastFrame);
    this.lastFrame = time;
    const profile = this.engine.getScaledDifficulty(this.opponentProgress / 100);
    const elapsed = this.engine.getElapsedMs();
    let behaviorMultiplier = 1;

    if (this.opponent.behavior === "lateRush") {
      behaviorMultiplier = 0.78 + (this.opponentProgress / 100) * 0.58;
    } else if (this.opponent.behavior === "burst") {
      if (elapsed >= this.nextBurstAt && time >= this.burstUntil) {
        this.burstUntil = time + 1500 + Math.random() * 900;
        this.nextBurstAt = elapsed + 5200 + Math.random() * 4200;
        this.status.textContent = `${this.opponent.name} is on a speed burst — keep the stream clean.`;
        this.status.className = "status-line bad";
      }
      if (time < this.burstUntil) behaviorMultiplier = 1.42;
    }

    const lengthFactor = this.lengthConfig.factor;
    this.opponentProgress = Math.min(
      100,
      this.opponentProgress + (dt * 0.00108 * profile.opponentPace * this.opponent.pace * behaviorMultiplier) / lengthFactor
    );

    this.renderCars();
    this.engine.updateHUD();
    if (this.checkFinish()) return;
    this.animationId = requestAnimationFrame(next => this.frame(next));
  }

  renderCars() {
    this.playerCar.style.bottom = `${6 + this.playerProgress * 0.78}%`;
    this.opponentCar.style.bottom = `${6 + this.opponentProgress * 0.78}%`;
  }

  checkFinish() {
    if (this.playerProgress >= 100) {
      this.engine.addScore(this.lengthConfig.name === "Endurance" ? 800 : this.lengthConfig.name === "Sprint" ? 350 : 500);
      this.finish({
        success: true,
        score: this.engine.score,
        title: `Victory on ${this.trackConfig.name}`,
        message: `You cleared ${this.wordsCompleted} tokens in a ${this.lengthConfig.name.toLowerCase()} ${this.textStyleLabel().toLowerCase()} race and beat ${this.opponent.name}.`,
        wordsCompleted: this.wordsCompleted,
        variant: `${this.trackConfig.name} • ${this.opponent.name} • ${this.lengthConfig.name} • ${this.textStyleLabel()}`
      });
      return true;
    }

    if (this.opponentProgress >= 100) {
      this.finish({
        success: false,
        score: this.engine.score,
        title: `${this.opponent.name} wins`,
        message: `You cleared ${this.wordsCompleted} tokens before ${this.opponent.name} finished the ${this.trackConfig.name}. Blake has requested a keyboard inspection and one formal recount.`,
        wordsCompleted: this.wordsCompleted,
        variant: `${this.trackConfig.name} • ${this.opponent.name} • ${this.lengthConfig.name} • ${this.textStyleLabel()}`
      });
      return true;
    }
    return false;
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener("keydown", this.handleKeydown);
  }

  escape(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
}
