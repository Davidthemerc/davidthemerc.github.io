export class CheckOutTimeGame {
  constructor({ stage, engine, finish, gameOptions = {} }) {
    this.stage = stage;
    this.engine = engine;
    this.finish = finish;
    this.options = gameOptions;
    this.running = false;
    this.items = [];
    this.buffer = "";
    this.spawnAccumulator = 0;
    this.lastFrame = 0;
    this.animationId = null;
    this.missed = 0;
    this.scanned = 0;
    this.normalScans = 0;
    this.rushes = 0;
    this.basketSubtotalCents = 0;
    this.needsTotal = false;
    this.totalPending = false;
    this.nextRushAt = 12000;
    this.rushEndsAt = 0;
    this.handleKeydown = this.handleKeydown.bind(this);

    this.laneId = this.options.checkoutLane || "standard";
    this.inputMode = this.options.checkoutInput || "either";
    this.lanes = {
      standard: { label: "Standard Lane", durationMs: 60000, spawnFactor: 1, speedFactor: 1, modifierRate: 0.22, totalEvery: 7, capacity: 7, missLimit: 13 },
      express: { label: "Express Rush", durationMs: 45000, spawnFactor: 0.72, speedFactor: 1.18, modifierRate: 0.16, totalEvery: 0, capacity: 8, missLimit: 11 },
      discount: { label: "Discount Desk", durationMs: 65000, spawnFactor: 0.92, speedFactor: 0.95, modifierRate: 0.55, totalEvery: 6, capacity: 7, missLimit: 12 },
      audit: { label: "Audit Lane", durationMs: 70000, spawnFactor: 1.08, speedFactor: 0.9, modifierRate: 0.48, totalEvery: 4, capacity: 6, missLimit: 10 }
    };
    this.lane = this.lanes[this.laneId] || this.lanes.standard;
    this.durationMs = this.lane.durationMs;
  }

  start() {
    this.running = true;
    this.stage.innerHTML = `
      <div class="conveyor-stage" id="conveyorStage">
        <div class="checkout-store-sign">HYPERSOFT MARKET • ${this.lane.label}</div>
        <div class="checkout-rush-banner" id="checkoutRushBanner" hidden>RUSH PERIOD</div>
        <div class="conveyor-belt"></div>
        <div class="scanner"></div>
        <div class="checkout-input-panel">
          <span class="eyebrow">${this.inputMode === "numpad" ? "Numpad-only entry" : "10-key entry"}</span>
          <div class="typing-prompt" id="priceBuffer">—</div>
          <div class="status-line" id="checkoutStatus">Type any visible amount exactly.</div>
          <div class="checkout-mini-grid">
            <strong id="checkoutStats">Scanned 0 · Missed 0</strong>
            <span id="checkoutBasket">Basket $0.00</span>
          </div>
        </div>
      </div>
    `;

    this.playfield = this.stage.querySelector("#conveyorStage");
    this.bufferEl = this.stage.querySelector("#priceBuffer");
    this.status = this.stage.querySelector("#checkoutStatus");
    this.stats = this.stage.querySelector("#checkoutStats");
    this.basket = this.stage.querySelector("#checkoutBasket");
    this.rushBanner = this.stage.querySelector("#checkoutRushBanner");

    window.addEventListener("keydown", this.handleKeydown);
    this.lastFrame = performance.now();
    this.spawnItem();
    this.spawnItem();
    this.animationId = requestAnimationFrame(time => this.frame(time));
  }

  money(cents) { return (Math.max(0, cents) / 100).toFixed(2); }

  randomPriceCents(progress = 0) {
    const profile = this.engine.getScaledDifficulty(progress);
    const maxDollars = Math.min(199, 18 + profile.numericLength * 14 + Math.round(progress * 55));
    return 100 + Math.floor(Math.random() * Math.max(100, maxDollars * 100 - 99));
  }

  createTask(progress) {
    if (this.needsTotal && !this.totalPending) {
      this.totalPending = true;
      return {
        kind: "total",
        product: "Basket Total",
        prompt: `TOTAL $${this.money(this.basketSubtotalCents)}`,
        expected: this.money(this.basketSubtotalCents),
        finalCents: 0,
        badge: "TOTAL"
      };
    }

    const products = ["Cereal", "Notebook", "Coffee", "Cable", "Soap", "Batteries", "Socks", "Juice", "Folder", "Cookies", "Adapter", "Towels"];
    const baseCents = this.randomPriceCents(progress);
    const roll = Math.random();
    const useModifier = roll < this.lane.modifierRate;

    if (useModifier && (this.laneId === "discount" || roll < this.lane.modifierRate * 0.65)) {
      const discounts = [10, 20, 25, 50];
      const discount = discounts[Math.floor(Math.random() * discounts.length)];
      const discountBase = Math.max(200, Math.round(baseCents / 100) * 100);
      const finalCents = Math.round(discountBase * (100 - discount) / 100);
      return {
        kind: "discount",
        product: products[Math.floor(Math.random() * products.length)],
        prompt: `$${this.money(discountBase)} − ${discount}%`,
        expected: this.money(finalCents),
        finalCents,
        badge: "DISCOUNT"
      };
    }

    if (useModifier) {
      const taxCents = Math.max(1, Math.round(baseCents * 0.08));
      const finalCents = baseCents + taxCents;
      return {
        kind: "tax",
        product: products[Math.floor(Math.random() * products.length)],
        prompt: `$${this.money(baseCents)} + $${this.money(taxCents)}`,
        expected: this.money(finalCents),
        finalCents,
        badge: "TOTAL"
      };
    }

    return {
      kind: "price",
      product: products[Math.floor(Math.random() * products.length)],
      prompt: `$${this.money(baseCents)}`,
      expected: this.money(baseCents),
      finalCents: baseCents,
      badge: "PRICE"
    };
  }

  spawnItem() {
    const progress = Math.min(1, this.engine.getElapsedMs() / this.durationMs);
    const task = this.createTask(progress);
    const entity = this.engine.spawnEntity(this.playfield, {
      className: `checkout-item checkout-${task.kind}`,
      html: `<span class="checkout-task-badge">${task.badge}</span><b>${task.product}</b><strong>${task.prompt}</strong><small>${task.kind === "discount" ? "Enter discounted price" : task.kind === "tax" ? "Add the shown amounts" : task.kind === "total" ? "Enter the displayed basket total" : "Enter exact price"}</small>`,
      x: 106,
      y: 61,
      dataset: { value: task.expected, kind: task.kind }
    });
    Object.assign(entity, task, { value: task.expected, x: 106 });
    entity.element.style.left = `${entity.x}%`;
    entity.element.style.bottom = "36%";
    this.items.push(entity);
  }

  isAllowedEntryKey(event) {
    const numeric = /^\d$/.test(event.key);
    const decimal = event.key === "." || event.code === "NumpadDecimal";
    if (!numeric && !decimal) return null;
    if (this.inputMode === "numpad" && !String(event.code).startsWith("Numpad")) return "blocked";
    return decimal ? "." : event.key;
  }

  handleKeydown(event) {
    if (!this.running) return;
    const entry = this.isAllowedEntryKey(event);
    if (entry === "blocked") {
      event.preventDefault();
      this.engine.recordKeystroke(false);
      this.engine.addScore(-2);
      this.status.textContent = "Numpad-only mode: use the keypad, including its decimal key.";
      this.status.className = "status-line bad";
      return;
    }
    if (entry != null) {
      event.preventDefault();
      const proposed = this.buffer + entry;
      const possible = this.items.some(item => item.value.startsWith(proposed));
      this.engine.recordKeystroke(possible, possible ? 1 : 0);
      if (!possible) {
        this.engine.addScore(-10);
        this.buffer = "";
        this.status.textContent = "No visible amount matches that sequence. Entry cleared.";
        this.status.className = "status-line bad";
      } else {
        this.buffer = proposed;
        this.checkBuffer();
      }
      this.renderBuffer();
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      this.buffer = this.buffer.slice(0, -1);
      this.renderBuffer();
      return;
    }
    if (event.key === "Escape") {
      this.buffer = "";
      this.renderBuffer();
    }
  }

  checkBuffer() {
    const exactItem = this.items.find(item => item.value === this.buffer);
    if (!exactItem) return;
    exactItem.remove();
    this.items = this.items.filter(item => item !== exactItem);
    this.scanned += 1;
    this.engine.correctTargets += 1;
    this.engine.totalTargets += 1;
    this.engine.addScore(95 + exactItem.value.length * 12 + (exactItem.kind === "total" ? 120 : 0));

    if (exactItem.kind === "total") {
      this.basketSubtotalCents = 0;
      this.needsTotal = false;
      this.totalPending = false;
      this.status.textContent = "Basket total verified. Finance briefly relaxes.";
    } else {
      this.normalScans += 1;
      this.basketSubtotalCents += exactItem.finalCents || 0;
      if (this.lane.totalEvery && this.normalScans % this.lane.totalEvery === 0) this.needsTotal = true;
      this.status.textContent = exactItem.kind === "discount"
        ? "Discount applied correctly. Blake had planned to round." : exactItem.kind === "tax"
          ? "Calculated total accepted. The decimal survived." : "Scanned. Register entry accepted.";
    }
    this.status.className = "status-line good";
    this.buffer = "";
    this.updateStats();
  }

  renderBuffer() { this.bufferEl.textContent = this.buffer || "—"; }

  updateStats() {
    this.stats.textContent = `Scanned ${this.scanned} · Missed ${this.missed} · Rushes ${this.rushes}`;
    this.basket.textContent = `Basket $${this.money(this.basketSubtotalCents)}`;
  }

  updateRush(elapsed) {
    if (elapsed >= this.nextRushAt && elapsed >= this.rushEndsAt) {
      this.rushes += 1;
      this.rushEndsAt = elapsed + (this.laneId === "express" ? 6500 : 5000);
      this.nextRushAt = elapsed + 13000 + Math.random() * 5000;
      this.rushBanner.hidden = false;
      this.playfield.classList.add("is-checkout-rush");
      this.status.textContent = "Rush period! Conveyor pressure increased.";
      this.status.className = "status-line bad";
    }
    if (this.rushEndsAt && elapsed >= this.rushEndsAt) {
      this.rushEndsAt = 0;
      this.rushBanner.hidden = true;
      this.playfield.classList.remove("is-checkout-rush");
    }
  }

  frame(time) {
    if (!this.running) return;
    const dt = Math.min(50, time - this.lastFrame);
    this.lastFrame = time;
    const elapsed = this.engine.getElapsedMs();
    const progress = Math.min(1, elapsed / this.durationMs);
    const profile = this.engine.getScaledDifficulty(progress);
    this.updateRush(elapsed);
    const inRush = this.rushEndsAt > elapsed;

    this.spawnAccumulator += dt;
    const spawnInterval = profile.spawnInterval * this.lane.spawnFactor * (inRush ? 0.58 : 1);
    if (this.spawnAccumulator >= spawnInterval) {
      this.spawnAccumulator = 0;
      if (this.items.length < this.lane.capacity) this.spawnItem();
    }

    const speed = 0.009 * profile.movementSpeed * this.lane.speedFactor * (inRush ? 1.48 : 1);
    this.items.forEach(item => {
      item.x -= speed * dt;
      item.element.style.left = `${item.x}%`;
    });

    const missed = this.items.filter(item => item.x <= 9);
    missed.forEach(item => {
      item.remove();
      this.missed += 1;
      this.engine.totalTargets += 1;
      this.engine.totalChars += item.value.length;
      this.engine.addScore(item.kind === "total" ? -75 : -35);
      if (item.kind === "total") {
        this.totalPending = false;
        this.needsTotal = false;
        this.basketSubtotalCents = 0;
      }
    });
    if (missed.length) {
      this.items = this.items.filter(item => item.alive);
      this.status.textContent = "Missed entry. The scanner has filed a strongly worded opinion.";
      this.status.className = "status-line bad";
      this.updateStats();
    }

    const remaining = Math.max(0, this.durationMs - elapsed);
    this.engine.updateHUD({ timerMs: remaining });

    if (this.missed >= this.lane.missLimit) {
      this.finish({
        success: false,
        score: this.engine.score,
        variant: `${this.lane.label} / ${this.inputMode === "numpad" ? "Numpad Only" : "Any Numeric Keys"}`,
        title: "Lane overwhelmed",
        message: `The register accumulated ${this.missed} missed entries. Blake has suggested hiding the receipt printer, which does not solve this.` ,
        extraStats: [["Lane", this.lane.label], ["Scanned", this.scanned], ["Rush periods", this.rushes]]
      });
      return;
    }

    if (remaining <= 0) {
      this.engine.addScore(this.scanned * 8 + Math.max(0, (this.lane.missLimit - this.missed) * 5));
      this.finish({
        success: true,
        score: this.engine.score,
        variant: `${this.lane.label} / ${this.inputMode === "numpad" ? "Numpad Only" : "Any Numeric Keys"}`,
        title: "Register closed",
        message: `You cleared ${this.scanned} entries, survived ${this.rushes} rush periods, and missed ${this.missed}. Finance has not yet called.`,
        extraStats: [["Lane", this.lane.label], ["Scanned", this.scanned], ["Missed", this.missed], ["Rush periods", this.rushes]]
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
    this.items.forEach(item => item.remove());
    this.items = [];
  }
}
