import { hyperSoftShouldBypassTypingEvent } from "./accessibilityUtils.js";
export const REAL_WORLD_MODES = [
  {
    id: "emailDesk",
    number: "01",
    title: "Email Desk",
    subtitle: "Subjects, recipients, concise messages, punctuation, and professional sign-offs.",
    icon: "✉",
    tags: ["Email", "Punctuation", "Mixed Case"],
    targetWpm: 34,
    targetAccuracy: 97,
    skin: "email",
    guide: [
      "Type the highlighted email material exactly, including capitalization, punctuation, symbols, and line breaks.",
      "Enter produces a required line break when the highlight reaches the end of a line.",
      "Wrong keys count against first-attempt accuracy but do not move the document forward.",
      "This lab measures keyboard control, not the quality of the fictional message content."
    ],
    tasks: [
      {
        label: "Message 1",
        title: "Meeting Follow-Up",
        context: "Transcribe a short follow-up email.",
        text: "Subject: Follow-Up: Thursday Planning Meeting\nTo: jordan.lee@example.org\n\nHi Jordan,\n\nThanks for meeting this morning. I attached the revised timeline and marked the three items that need confirmation by 2:00 PM Friday.\n\nBest,\nMorgan"
      },
      {
        label: "Message 2",
        title: "Invoice Question",
        context: "Mixed punctuation, currency, and a reference number.",
        text: "Subject: Question on Invoice #4827\nTo: accounts@example.org\n\nHello,\n\nCould you confirm whether the $1,245.80 total includes the July service adjustment? The worksheet shows REF-26-0714 on line 8.\n\nThank you,\nAvery"
      },
      {
        label: "Message 3",
        title: "Schedule Update",
        context: "Dates, times, apostrophes, and clear sentence rhythm.",
        text: "Subject: Schedule Update for August 27\nTo: team@example.org\n\nThe 9:30 AM review moved to 10:15 AM. Please use the updated agenda in Shared/Planning/August and bring your team's final notes.\n\nRegards,\nCasey"
      }
    ]
  },
  {
    id: "memoDesk",
    number: "02",
    title: "Memo & Notes",
    subtitle: "Headers, short business prose, lists, dates, and structured internal notes.",
    icon: "▤",
    tags: ["Memos", "Headers", "Business Prose"],
    targetWpm: 36,
    targetAccuracy: 97,
    skin: "memo",
    guide: [
      "Treat line breaks as part of the document. Press Enter when HyperSoft highlights a newline.",
      "Keep a steady prose rhythm even when headers or numbered items interrupt the paragraph.",
      "Accuracy matters more than preserving your usual informal typing habits.",
      "These are fictional training documents and do not represent workplace policy."
    ],
    tasks: [
      {
        label: "Memo 1",
        title: "Internal Memo",
        context: "Formal headers followed by a short paragraph.",
        text: "MEMORANDUM\nDATE: August 20, 2026\nTO: Operations Team\nFROM: Training Services\nSUBJECT: File Review Schedule\n\nBeginning Monday, completed files should be placed in the review queue before 3:00 PM. Items received later will move to the next business day's queue."
      },
      {
        label: "Memo 2",
        title: "Action Notes",
        context: "Numbered actions with punctuation and deadlines.",
        text: "ACTION NOTES — PROJECT ORBIT\n1. Confirm vendor contact by Tuesday.\n2. Rename the draft file to Orbit_Status_v4.docx.\n3. Send the revised estimate before 4:30 PM.\n4. Record open questions in the shared tracker."
      },
      {
        label: "Memo 3",
        title: "Status Summary",
        context: "Natural office prose with commas and parenthetical detail.",
        text: "Status Summary: Testing is on schedule, but two configuration items remain open. The first affects account creation; the second affects the nightly export (currently scheduled for 11:45 PM). No production change is planned today."
      }
    ]
  },
  {
    id: "contactEntry",
    number: "03",
    title: "Contact & Address Entry",
    subtitle: "Names, street addresses, phone numbers, extensions, ZIP codes, and email addresses.",
    icon: "▦",
    tags: ["Addresses", "Email", "Data Entry"],
    targetWpm: 30,
    targetAccuracy: 98,
    skin: "contact",
    guide: [
      "Real-world contact entry rewards precision. A single digit or character can change the meaning of a record.",
      "Type punctuation and spacing exactly as shown.",
      "The fictional phone numbers and addresses are generated only for training.",
      "Slow down around digits and symbols if necessary; accuracy is the primary objective."
    ],
    tasks: [
      {
        label: "Record 1",
        title: "Contact Card",
        context: "A complete fictional contact record.",
        text: "Name: Elena Park\nAddress: 1842 Willow Crest Ave.\nCity/State/ZIP: Fairview, CA 93618\nPhone: (555) 014-7286 ext. 204\nEmail: elena.park@example.org"
      },
      {
        label: "Record 2",
        title: "Shipping Contact",
        context: "Suite number, hyphenated name, and mixed numeric entry.",
        text: "Name: Marcus Hill-Rivera\nAddress: 909 Northgate Blvd., Suite 310\nCity/State/ZIP: Cedar Glen, CA 93724\nPhone: (555) 016-4431\nEmail: m.hill-rivera@example.org"
      },
      {
        label: "Record 3",
        title: "Directory Entry",
        context: "Extension, department name, and email punctuation.",
        text: "Department: Records Coordination\nContact: Priya Shah\nDirect Line: (555) 019-8864\nExtension: 7312\nEmail: priya.shah+records@example.org\nOffice: Building C, Room 214"
      }
    ]
  },
  {
    id: "fileWeb",
    number: "04",
    title: "Files, Paths & Web",
    subtitle: "Filenames, folders, URLs, version strings, underscores, slashes, and mixed symbols.",
    icon: "⌘",
    tags: ["URLs", "Files", "Symbols"],
    targetWpm: 28,
    targetAccuracy: 98,
    skin: "file",
    guide: [
      "File paths and URLs punish small errors. Accuracy is intentionally weighted above raw speed here.",
      "Watch slashes, backslashes, dots, hyphens, underscores, numbers, and capitalization.",
      "These URLs use reserved example domains and are not intended as live destinations.",
      "Enter line breaks exactly where shown."
    ],
    tasks: [
      {
        label: "Task 1",
        title: "File Rename",
        context: "Windows-style paths and versioned filenames.",
        text: "C:\\Training\\August\\Drafts\\Keyboard_Report_v3.docx\nC:\\Training\\August\\Final\\Keyboard_Report_v4_FINAL.docx\nArchive_2026-08-20.zip"
      },
      {
        label: "Task 2",
        title: "Web References",
        context: "URLs, query strings, and mixed punctuation.",
        text: "https://example.org/training/keyboard-basics\nhttps://docs.example.org/view?id=4827&mode=review\nhttps://portal.example.org/account/reset-password"
      },
      {
        label: "Task 3",
        title: "Technical Notes",
        context: "Versions, hostnames, ports, and structured identifiers.",
        text: "ClientBuild=4.18.2\nServer=training-node-07.example.org:8443\nExport_File=usage_2026-08-20_1730.csv\nTicket=KB-10482"
      }
    ]
  },
  {
    id: "formsNumbers",
    number: "05",
    title: "Forms & Numeric Records",
    subtitle: "Dates, times, amounts, reference IDs, percentages, and structured form values.",
    icon: "#",
    tags: ["Numbers", "Forms", "Precision"],
    targetWpm: 29,
    targetAccuracy: 98,
    skin: "form",
    guide: [
      "Numeric and structured records are scored with a high accuracy target because transposition errors matter.",
      "Do not rush dates, decimals, reference numbers, percentages, or currency.",
      "Press Enter for highlighted line breaks between form fields.",
      "All names, identifiers, and amounts are fictional training data."
    ],
    tasks: [
      {
        label: "Form 1",
        title: "Service Record",
        context: "Dates, times, IDs, and decimal values.",
        text: "Service Date: 08/20/2026\nStart Time: 9:45 AM\nEnd Time: 11:10 AM\nReference ID: SR-826-1047\nUnits: 7.50\nRate: $86.25\nTotal: $646.88"
      },
      {
        label: "Form 2",
        title: "Budget Entry",
        context: "Currency, percentages, and account codes.",
        text: "Account: 4100-227-19\nBudget: $18,500.00\nCommitted: $12,764.35\nRemaining: $5,735.65\nVariance: 3.8%\nReview Date: 09/15/2026"
      },
      {
        label: "Form 3",
        title: "Inventory Record",
        context: "Model numbers, quantities, and serial-style identifiers.",
        text: "Item: USB Keyboard\nModel: HS-KB-104\nQuantity: 24\nUnit Cost: $17.95\nSerial Range: 260820-A001 to 260820-A024\nLocation: Shelf B-17"
      }
    ]
  },
  {
    id: "transcription",
    number: "06",
    title: "Document Transcription",
    subtitle: "Longer paragraphs that resemble ordinary reports, instructions, and written correspondence.",
    icon: "¶",
    tags: ["Prose", "Endurance", "Punctuation"],
    targetWpm: 40,
    targetAccuracy: 97,
    skin: "document",
    guide: [
      "This lab is the closest Real-World mode to sustained document transcription.",
      "Read slightly ahead of the highlight and maintain a pace that survives complete paragraphs.",
      "Punctuation and capitalization count exactly.",
      "The training text is original fictional material created for HyperSoft."
    ],
    tasks: [
      {
        label: "Page 1",
        title: "Procedure Note",
        context: "Sustained instructional prose.",
        text: "Before beginning the review, confirm that the working copy is clearly labeled and that the original remains unchanged. Read the entire section once before making corrections. When a change is necessary, use a short note that explains what was changed, why it was changed, and whether another person needs to verify the result."
      },
      {
        label: "Page 2",
        title: "Project Update",
        context: "A longer project-status paragraph.",
        text: "The pilot group completed its second week of testing on Wednesday. Most users reported that the revised navigation was easier to understand, although several still hesitated when moving between search results and detailed records. The team will review those comments, adjust the labels, and repeat the test with a new group next month."
      },
      {
        label: "Page 3",
        title: "Office Correspondence",
        context: "Natural correspondence with varied sentence length.",
        text: "Thank you for reviewing the draft and returning your comments so quickly. I incorporated the formatting changes, corrected the two figures on page three, and added a short explanation beneath the final table. If no additional revisions are needed, the document will be ready for distribution tomorrow morning."
      }
    ]
  }
];

export function getRealWorldMode(id) {
  return REAL_WORLD_MODES.find(mode => mode.id === id) ?? null;
}

export class RealWorldTypingExercise {
  constructor({ stage, engine, finish, mode, difficulty = "normal" }) {
    this.stage = stage;
    this.engine = engine;
    this.finish = finish;
    this.mode = mode;
    this.difficulty = difficulty;
    this.running = false;
    this.finished = false;
    this.taskIndex = 0;
    this.cursor = 0;
    this.errors = 0;
    this.backspaces = 0;
    this.taskErrors = 0;
    this.taskStartedAt = 0;
    this.taskStats = [];
    this.pairAttemptedPositions = new Set();
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  getTargets() {
    const speedFactor = {
      novice: .68, easy: .82, normal: 1, challenging: 1.13, hard: 1.27, expert: 1.42
    }[this.difficulty] ?? 1;
    const accuracyDelta = {
      novice: -4, easy: -2, normal: 0, challenging: 0, hard: 1, expert: 1
    }[this.difficulty] ?? 0;
    return {
      wpm: Math.max(15, Math.round(this.mode.targetWpm * speedFactor)),
      accuracy: Math.max(90, Math.min(100, this.mode.targetAccuracy + accuracyDelta))
    };
  }

  start() {
    this.running = true;
    const targets = this.getTargets();
    this.stage.innerHTML = `
      <div class="realworld-workstation realworld-${this.mode.skin}">
        <div class="realworld-titlebar">
          <div><small>HyperSoft Applied Keyboarding Lab</small><strong>${this.escape(this.mode.title)}</strong></div>
          <span>REAL-WORLD SIMULATION</span>
        </div>
        <div class="realworld-task-tabs" id="realWorldTaskTabs"></div>
        <div class="realworld-live-grid" aria-label="Live Real-World Typing metrics">
          <div><span>WPM</span><strong id="realWorldWpm">0</strong><small>Target ${targets.wpm}</small></div>
          <div><span>Accuracy</span><strong id="realWorldAccuracy">100%</strong><small>Target ${targets.accuracy}%</small></div>
          <div><span>Errors</span><strong id="realWorldErrors">0</strong><small>First-attempt misses</small></div>
          <div><span>Task</span><strong id="realWorldTaskCounter">1/${this.mode.tasks.length}</strong><small>Complete all records</small></div>
        </div>
        <div class="realworld-desktop">
          <aside class="realworld-context-panel">
            <span class="realworld-app-icon">${this.escape(this.mode.icon)}</span>
            <small id="realWorldTaskLabel">Task</small>
            <h3 id="realWorldTaskTitle"></h3>
            <p id="realWorldTaskContext"></p>
            <div class="realworld-target-box"><span>Session standard</span><strong>${targets.wpm} WPM / ${targets.accuracy}%</strong></div>
            <p class="realworld-context-note">Type the highlighted document exactly. Press Enter when a line break is highlighted.</p>
          </aside>
          <section class="realworld-document-shell">
            <div class="realworld-document-toolbar" id="realWorldToolbar"></div>
            <div class="realworld-document-pane" id="realWorldDocument" tabindex="-1" aria-label="Real-world typing document"></div>
            <div class="realworld-status-row"><span>Next key</span><strong id="realWorldNextKey">—</strong><small id="realWorldStatus" aria-live="polite">Start typing. No click is required.</small></div>
            <div class="realworld-progress-track" aria-hidden="true"><span id="realWorldProgressFill"></span></div>
          </section>
        </div>
        <div class="realworld-training-note"><strong>Applied typing rule</strong><span>Accuracy is based on the first key attempted for each highlighted position. Wrong keys stay on the current character so the fictional record itself is never corrupted.</span></div>
      </div>`;

    this.tabs = this.stage.querySelector("#realWorldTaskTabs");
    this.liveWpm = this.stage.querySelector("#realWorldWpm");
    this.liveAccuracy = this.stage.querySelector("#realWorldAccuracy");
    this.liveErrors = this.stage.querySelector("#realWorldErrors");
    this.taskCounter = this.stage.querySelector("#realWorldTaskCounter");
    this.taskLabel = this.stage.querySelector("#realWorldTaskLabel");
    this.taskTitle = this.stage.querySelector("#realWorldTaskTitle");
    this.taskContext = this.stage.querySelector("#realWorldTaskContext");
    this.toolbar = this.stage.querySelector("#realWorldToolbar");
    this.document = this.stage.querySelector("#realWorldDocument");
    this.nextKey = this.stage.querySelector("#realWorldNextKey");
    this.status = this.stage.querySelector("#realWorldStatus");
    this.progressFill = this.stage.querySelector("#realWorldProgressFill");
    this.startTask(0);
    window.addEventListener("keydown", this.handleKeydown);
    this.engine.updateHUD();
  }

  startTask(index) {
    this.taskIndex = index;
    this.cursor = 0;
    this.taskErrors = 0;
    this.taskStartedAt = performance.now();
    this.pairAttemptedPositions.clear();
    const task = this.mode.tasks[index];
    this.taskLabel.textContent = task.label;
    this.taskTitle.textContent = task.title;
    this.taskContext.textContent = task.context;
    this.taskCounter.textContent = `${index + 1}/${this.mode.tasks.length}`;
    this.status.textContent = index ? "Next record loaded. Continue when ready." : "Start typing. No click is required.";
    this.status.className = "";
    this.renderToolbar(task);
    this.renderTabs();
    this.renderDocument();
    this.updateMetrics();
  }

  renderToolbar(task) {
    const bars = {
      email: ["Inbox", "New Message", task.title],
      memo: ["Document", "Internal Memo", task.title],
      contact: ["Directory", "Contact Record", task.title],
      file: ["File Manager", "Location / Reference", task.title],
      form: ["Data Entry", "Record Form", task.title],
      document: ["Document Viewer", "Transcription", task.title]
    };
    const row = bars[this.mode.skin] ?? ["HyperSoft", "Applied Typing", task.title];
    this.toolbar.innerHTML = row.map((item, index) => `<span class="${index === row.length - 1 ? "active" : ""}">${this.escape(item)}</span>`).join("");
  }

  renderTabs() {
    this.tabs.innerHTML = this.mode.tasks.map((task, index) =>
      `<span class="${index < this.taskIndex ? "complete" : index === this.taskIndex ? "current" : ""}">${index < this.taskIndex ? "✓" : index + 1} ${this.escape(task.label)}</span>`
    ).join("");
  }

  expectedKey() {
    return this.mode.tasks[this.taskIndex]?.text?.[this.cursor] ?? null;
  }

  handleKeydown(event) {
    if (!this.running || event.ctrlKey || event.metaKey || event.altKey) return;
    if (hyperSoftShouldBypassTypingEvent(event)) return;

    let typed = event.key;
    if (typed === "Enter") typed = "\n";
    else if (typed === "Backspace") {
      event.preventDefault();
      this.backspaces += 1;
      this.errors += 1;
      this.taskErrors += 1;
      const expected = this.expectedKey();
      this.engine.recordKeystroke(false, 0, expected === "\n" ? null : (expected ?? ""));
      this.status.textContent = "Backspace is counted as a correction attempt. Type the highlighted character to continue.";
      this.status.className = "bad";
      this.updateMetrics();
      return;
    } else if (typed === "Tab") {
      typed = "\t";
    } else if (typed.length !== 1) {
      return;
    }

    event.preventDefault();
    const expected = this.expectedKey();
    if (expected == null) return;
    const correct = typed === expected;
    const task = this.mode.tasks[this.taskIndex];
    const pairPosition = `${this.taskIndex}:${this.cursor}`;
    if (this.cursor > 0 && !this.pairAttemptedPositions.has(pairPosition)) {
      const previous = task.text[this.cursor - 1];
      this.engine.recordPairAttempt(correct, previous, expected);
      this.pairAttemptedPositions.add(pairPosition);
    }
    this.engine.recordKeystroke(correct, correct ? .55 : 0, expected === "\n" ? null : expected);

    if (correct) {
      this.cursor += 1;
      this.status.textContent = expected === "\n"
        ? "Line break accepted. Keep the record structure intact."
        : "Correct. Keep moving through the record.";
      this.status.className = "good";
      if (this.cursor >= task.text.length) {
        this.completeTask();
        return;
      }
    } else {
      this.errors += 1;
      this.taskErrors += 1;
      this.status.textContent = `Expected ${this.describeKey(expected)} — received ${this.describeKey(typed)}.`;
      this.status.className = "bad";
      this.stage.classList.remove("realworld-error-flash");
      void this.stage.offsetWidth;
      this.stage.classList.add("realworld-error-flash");
    }
    this.renderDocument();
    this.updateMetrics();
    this.engine.updateHUD();
  }

  completeTask() {
    const task = this.mode.tasks[this.taskIndex];
    const durationMs = Math.max(1, performance.now() - this.taskStartedAt);
    this.taskStats.push({
      title: task.title,
      chars: task.text.length,
      durationMs: Math.round(durationMs),
      errors: this.taskErrors,
      grossWpm: Math.round(((task.text.length / 5) / (durationMs / 60000)) * 10) / 10
    });
    if (this.taskIndex < this.mode.tasks.length - 1) {
      this.startTask(this.taskIndex + 1);
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
    const accuracy = Math.round(this.engine.calculateAccuracy());
    const met = wpm >= targets.wpm && accuracy >= targets.accuracy;
    if (met) this.engine.addScore(450);
    const sessionWeak = this.engine.getSessionWeakKeys(5).map(item => `${this.formatKey(item.key)} ${Math.round(item.accuracy)}%`);
    const pairWeak = this.engine.getSessionWeakPairs(5).map(item => `${item.pair.toUpperCase()} ${Math.round(item.accuracy)}%`);
    const slowest = [...this.taskStats].sort((a,b)=>a.grossWpm-b.grossWpm)[0];
    this.finish({
      success: true,
      score: this.engine.score,
      title: met ? `${this.mode.title}: Applied target met` : `${this.mode.title}: Lab complete`,
      message: met
        ? `All ${this.mode.tasks.length} real-world records were completed at or above the applied training standard.`
        : `All ${this.mode.tasks.length} records were completed. Applied target: ${targets.wpm} WPM at ${targets.accuracy}% accuracy.`,
      targetStatus: met ? "Met" : "Practice",
      variant: this.mode.title,
      weakKeys: sessionWeak.length ? sessionWeak.join(", ") : "None",
      realWorldTasks: this.taskStats,
      realWorldErrors: this.errors,
      realWorldBackspaces: this.backspaces,
      extraStats: [
        ["Records completed", this.mode.tasks.length],
        ["First-attempt errors", this.errors],
        ["Correction attempts", this.backspaces],
        ...(slowest ? [["Slowest record", `${slowest.title} · ${slowest.grossWpm} WPM`]] : []),
        ...(pairWeak.length ? [["Trouble pairs", pairWeak.join(", ")]] : [])
      ]
    });
  }

  renderDocument() {
    const task = this.mode.tasks[this.taskIndex];
    const before = task.text.slice(0, this.cursor);
    const current = task.text[this.cursor] ?? "";
    const after = task.text.slice(this.cursor + (current ? 1 : 0));
    const currentHtml = current
      ? current === "\n"
        ? `<span class="realworld-current-char realworld-newline-char">↵</span><br>`
        : `<span class="realworld-current-char">${this.formatText(current)}</span>`
      : "";
    this.document.innerHTML = `<span class="realworld-complete-text">${this.formatText(before)}</span>${currentHtml}<span class="realworld-upcoming-text">${this.formatText(after)}</span>`;
    this.nextKey.textContent = this.displayKey(current);
    const overallChars = this.mode.tasks.reduce((sum, item) => sum + item.text.length, 0);
    const previousChars = this.mode.tasks.slice(0, this.taskIndex).reduce((sum, item) => sum + item.text.length, 0);
    const completed = previousChars + this.cursor;
    this.progressFill.style.width = `${overallChars ? Math.min(100, (completed / overallChars) * 100) : 0}%`;
    requestAnimationFrame(() => {
      const currentNode = this.document.querySelector(".realworld-current-char");
      currentNode?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
  }

  updateMetrics() {
    if (!this.running) return;
    if (this.liveWpm) this.liveWpm.textContent = String(Math.round(this.engine.calculateWPM()));
    if (this.liveAccuracy) this.liveAccuracy.textContent = `${Math.round(this.engine.calculateAccuracy())}%`;
    if (this.liveErrors) this.liveErrors.textContent = String(this.errors);
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
    if (value === "\t") return "Tab";
    if (value === " ") return "Space";
    return value || "Complete";
  }

  describeKey(value) {
    if (value === "\n") return "Enter";
    if (value === "\t") return "Tab";
    if (value === " ") return "Space";
    return value ? `“${value}”` : "the end of the document";
  }

  formatKey(value) {
    if (value === " ") return "Space";
    if (value === "\n") return "Enter";
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
