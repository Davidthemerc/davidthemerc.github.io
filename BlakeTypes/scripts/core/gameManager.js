import { TypingEngine } from "./typingEngine.js";
import { DIFFICULTY_CONFIG, MODE_METADATA, BLAKE_QUOTES } from "./config.js";
import { LESSON_METADATA } from "./lessonConfig.js";
import { SMART_PRACTICE_MODES, getSmartPoolStats } from "./smartTypingContent.js";
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from "./achievementConfig.js";
import {
  BLAKE_PRODUCTIVITY_TIPS, HYPERSOFT_NOTICES, BLAKE_INCIDENTS,
  LOADING_MESSAGES, GAME_PERSONALITY, RESULT_COMPLIANCE_NOTES
} from "./personalityConfig.js";
import { ScrollingTypingExercise } from "./scrollingTypingExercise.js";
import { CreatureLabGame } from "../games/creatureLab.js";
import { FarOffAdventuresGame } from "../games/farOffAdventures.js";
import { CheckOutTimeGame } from "../games/checkOutTime.js";
import { RoadRaceGame } from "../games/roadRace.js";
import { ChameleonPicnicGame } from "../games/chameleonPicnic.js";
import { SpaceJunkGame } from "../games/spaceJunk.js";
import { SharkAttackGame } from "../games/sharkAttack.js";
import { PenguinCrossingGame } from "../games/penguinCrossing.js";

const STORAGE_KEYS = {
  profiles: "blakeBreacher.profiles.v1",
  activeProfile: "blakeBreacher.activeProfile.v1",
  legacySettings: "blakeBreacher.settings.v1",
  legacyScores: "blakeBreacher.scores.v1",
  legacyKeyStats: "blakeBreacher.keyStats.v1",
  legacyKeyHistory: "blakeBreacher.keyHistory.v1"
};

const DEFAULT_SETTINGS = {
  difficulty: "normal",
  wordList: "general",
  theme: "classic",
  sound: false,
  backupReminder: true
};

const BLAKE_ASSET = globalThis.__BLAKE_ASSET || "./assets/common/blake.png";

class GameManager {
  constructor() {
    this.ui = this.collectUI();
    this.profiles = this.loadOrMigrateProfiles();
    this.activeProfileId = this.resolveActiveProfileId();
    this.guestProfile = null;
    this.profileEditorMode = "create";
    this.editingProfileId = null;
    this.migrationMessage = this.consumeMigrationMessage();

    this.settings = this.loadSettings();
    this.applyTheme(this.settings.theme);
    this.scores = this.loadScores();
    this.keyStats = this.loadKeyStats();
    this.keyHistory = this.loadKeyHistory();
    this.pairStats = this.loadPairStats();
    this.achievements = this.loadAchievements();
    this.syncAchievements({ notify: false });
    this.pendingLessonId = null;
    this.pendingGameId = null;
    this.pendingGameOptions = {};
    this.loadingTimeoutId = null;
    this.currentHomeTipIndex = -1;
    this.currentHomeNoticeIndex = -1;
    this.activeMode = null;
    this.activeGame = null;
    this.activityKind = "game";
    this.lastActivity = null;
    this.tournament = null;
    this.arcadeChallenge = null;
    this.hudTimerId = null;

    this.engine = new TypingEngine({
      soundEnabled: this.settings.sound,
      hudAdapter: stats => this.renderHUD(stats)
    });

    this.gameClasses = {
      creatureLab: CreatureLabGame,
      farOffAdventures: FarOffAdventuresGame,
      checkOutTime: CheckOutTimeGame,
      roadRace: RoadRaceGame,
      chameleonPicnic: ChameleonPicnicGame,
      spaceJunk: SpaceJunkGame,
      sharkAttack: SharkAttackGame,
      penguinCrossing: PenguinCrossingGame
    };

    this.bindUI();
    this.renderMenu();
    this.renderLessons();
    this.renderSettings();
    this.renderScoreboard();
    this.renderAchievements();
    this.renderReports();
    this.renderOffice();
    this.renderProfiles();
    this.updateProfileChrome();
    this.rotateBlakeQuote();
  }

  collectUI() {
    return {
      screens: [...document.querySelectorAll(".screen")],
      titleScreen: document.getElementById("titleScreen"),
      officeScreen: document.getElementById("officeScreen"),
      profilesScreen: document.getElementById("profilesScreen"),
      lessonsScreen: document.getElementById("lessonsScreen"),
      menuScreen: document.getElementById("menuScreen"),
      gameScreen: document.getElementById("gameScreen"),
      progressScreen: document.getElementById("progressScreen"),
      achievementsScreen: document.getElementById("achievementsScreen"),
      reportsScreen: document.getElementById("reportsScreen"),
      scoreboardScreen: document.getElementById("scoreboardScreen"),
      settingsScreen: document.getElementById("settingsScreen"),
      profileGrid: document.getElementById("profileGrid"),
      profileMigrationNote: document.getElementById("profileMigrationNote"),
      profileQuickButton: document.getElementById("profileQuickButton"),
      profileQuickAvatar: document.getElementById("profileQuickAvatar"),
      profileQuickName: document.getElementById("profileQuickName"),
      activeProfileBanner: document.getElementById("activeProfileBanner"),
      activeProfileStatus: document.getElementById("activeProfileStatus"),
      profileDialog: document.getElementById("profileDialog"),
      profileDialogTitle: document.getElementById("profileDialogTitle"),
      profileForm: document.getElementById("profileForm"),
      profileNameInput: document.getElementById("profileNameInput"),
      profileAvatarSelect: document.getElementById("profileAvatarSelect"),
      profileSaveButton: document.getElementById("profileSaveButton"),
      profileEditorNote: document.getElementById("profileEditorNote"),
      officeContent: document.getElementById("officeContent"),
      homeBlakeTip: document.getElementById("homeBlakeTip"),
      homeComplianceReply: document.getElementById("homeComplianceReply"),
      homeNoticeTitle: document.getElementById("homeNoticeTitle"),
      homeNoticeBody: document.getElementById("homeNoticeBody"),
      homeNoticeDepartment: document.getElementById("homeNoticeDepartment"),
      loadingOverlay: document.getElementById("loadingOverlay"),
      loadingTitle: document.getElementById("loadingTitle"),
      loadingMessage: document.getElementById("loadingMessage"),
      loadingTip: document.getElementById("loadingTip"),
      loadingCompliance: document.getElementById("loadingCompliance"),
      lessonGrid: document.getElementById("lessonGrid"),
      lessonDifficultyChip: document.getElementById("lessonDifficultyChip"),
      weakKeySummary: document.getElementById("weakKeySummary"),
      smartPracticeLab: document.getElementById("smartPracticeLab"),
      gameGrid: document.getElementById("gameGrid"),
      arcadeDashboard: document.getElementById("arcadeDashboard"),
      tournamentDialog: document.getElementById("tournamentDialog"),
      tournamentFormatSelect: document.getElementById("tournamentFormatSelect"),
      tournamentOrderSelect: document.getElementById("tournamentOrderSelect"),
      stage: document.getElementById("gameStage"),
      activeGameTitle: document.getElementById("activeGameTitle"),
      activeGameSubtitle: document.getElementById("activeGameSubtitle"),
      menuDifficultyChip: document.getElementById("menuDifficultyChip"),
      backButton: document.getElementById("backToGamesButton"),
      guidedLinkButton: document.getElementById("guidedLinkButton"),
      hudWpm: document.getElementById("hudWpm"),
      hudAccuracy: document.getElementById("hudAccuracy"),
      hudTimer: document.getElementById("hudTimer"),
      hudScore: document.getElementById("hudScore"),
      hostDialog: document.getElementById("hostDialog"),
      hostEyebrow: document.getElementById("hostEyebrow"),
      hostTitle: document.getElementById("hostTitle"),
      hostMessage: document.getElementById("hostMessage"),
      hostTargets: document.getElementById("hostTargets"),
      hostOptions: document.getElementById("hostOptions"),
      hostComplianceMessage: document.getElementById("hostComplianceMessage"),
      guideDialog: document.getElementById("guideDialog"),
      guideTitle: document.getElementById("guideTitle"),
      guideBody: document.getElementById("guideBody"),
      resultDialog: document.getElementById("resultDialog"),
      resultTitle: document.getElementById("resultTitle"),
      resultMessage: document.getElementById("resultMessage"),
      resultHostPanel: document.getElementById("resultHostPanel"),
      resultHostMessage: document.getElementById("resultHostMessage"),
      resultComplianceMessage: document.getElementById("resultComplianceMessage"),
      resultStats: document.getElementById("resultStats"),
      resultHomeButton: document.getElementById("resultHomeButton"),
      progressContent: document.getElementById("progressContent"),
      achievementsContent: document.getElementById("achievementsContent"),
      reportsContent: document.getElementById("reportsContent"),
      reportPreviewShell: document.getElementById("reportPreviewShell"),
      reportPreview: document.getElementById("reportPreview"),
      reportPreviewLabel: document.getElementById("reportPreviewLabel"),
      achievementUnlockPanel: document.getElementById("achievementUnlockPanel"),
      achievementUnlockList: document.getElementById("achievementUnlockList"),
      scoreboardContent: document.getElementById("scoreboardContent"),
      settingsForm: document.getElementById("settingsForm"),
      settingsProfileContext: document.getElementById("settingsProfileContext"),
      backupReminderBanner: document.getElementById("backupReminderBanner"),
      backupStatus: document.getElementById("backupStatus"),
      profileImportInput: document.getElementById("profileImportInput"),
      backupImportInput: document.getElementById("backupImportInput"),
      difficultySelect: document.getElementById("difficultySelect"),
      wordListSelect: document.getElementById("wordListSelect"),
      themeSelect: document.getElementById("themeSelect"),
      soundToggle: document.getElementById("soundToggle"),
      backupReminderToggle: document.getElementById("backupReminderToggle"),
      difficultyPreview: document.getElementById("difficultyPreview"),
      titleQuote: document.getElementById("titleQuote")
    };
  }

  bindUI() {
    document.getElementById("startSuiteButton").addEventListener("click", () => this.showScreen("lessons"));
    document.getElementById("brandButton").addEventListener("click", () => this.exitTo("title"));
    this.ui.profileQuickButton.addEventListener("click", () => this.exitTo("profiles"));
    this.ui.activeProfileBanner.addEventListener("click", () => this.exitTo("profiles"));
    this.ui.backButton.addEventListener("click", () => {
      if (this.tournament?.active) {
        if (!confirm("Quit the current Typing Tournament? Completed rounds will remain in your arcade history, but the tournament itself will not be recorded.")) return;
        this.abortTournament({ keepScreen: true });
        this.exitTo("menu");
        return;
      }
      this.exitTo(this.activityKind === "lesson" ? "lessons" : "menu");
    });
    this.ui.guidedLinkButton.addEventListener("click", () => this.openGuide(this.activeMode?.id));
    document.getElementById("closeGuideButton").addEventListener("click", () => this.ui.guideDialog.close());
    document.getElementById("hostStartButton").addEventListener("click", () => {
      const lessonId = this.pendingLessonId;
      const gameId = this.pendingGameId;
      const title = lessonId
        ? this.getLessonDefinition(lessonId)?.title
        : MODE_METADATA.find(item => item.id === gameId)?.title;
      if (gameId) this.pendingGameOptions = this.readGameOptions(gameId);
      this.ui.hostDialog.close();
      if (lessonId) this.launchWithLoading(title || "Typing Lesson", () => this.beginLesson(lessonId));
      else if (gameId) this.launchWithLoading(title || "Typing Game", () => this.beginMode(gameId));
    });
    document.getElementById("hostCancelButton").addEventListener("click", () => {
      const destination = this.pendingLessonId ? "lessons" : this.pendingGameId ? "menu" : null;
      this.pendingLessonId = null;
      this.pendingGameId = null;
      this.ui.hostDialog.close();
      if (destination) this.showScreen(destination);
    });
    document.getElementById("progressLessonsButton").addEventListener("click", () => this.showScreen("lessons"));
    document.getElementById("achievementLessonsButton").addEventListener("click", () => this.showScreen("lessons"));
    document.getElementById("achievementGamesButton").addEventListener("click", () => this.showScreen("menu"));
    document.getElementById("reportsLessonsButton").addEventListener("click", () => this.showScreen("lessons"));
    document.getElementById("printReportButton").addEventListener("click", () => this.printCurrentReport());
    document.getElementById("closeReportPreviewButton").addEventListener("click", () => this.closeReportPreview());
    document.getElementById("newHomeTipButton").addEventListener("click", () => this.renderHomeTip());
    document.getElementById("newHomeNoticeButton").addEventListener("click", () => this.renderHomeNotice());
    document.getElementById("officeShuffleButton").addEventListener("click", () => this.renderOffice());
    document.getElementById("tournamentDialogClose").addEventListener("click", () => this.ui.tournamentDialog.close());
    document.getElementById("cancelTournamentButton").addEventListener("click", () => this.ui.tournamentDialog.close());
    document.getElementById("startTournamentButton").addEventListener("click", () => this.startTournamentFromDialog());

    document.querySelectorAll("[data-nav]").forEach(button => {
      button.addEventListener("click", () => this.exitTo(button.dataset.nav));
    });

    document.getElementById("createProfileButton").addEventListener("click", () => this.openProfileEditor("create"));
    document.getElementById("guestProfileButton").addEventListener("click", () => this.switchProfile("guest"));
    document.getElementById("profileDialogClose").addEventListener("click", () => this.ui.profileDialog.close());
    document.getElementById("profileCancelButton").addEventListener("click", () => this.ui.profileDialog.close());
    this.ui.profileForm.addEventListener("submit", event => { event.preventDefault(); this.saveProfileEditor(); });

    document.getElementById("exportProfileButton").addEventListener("click", () => this.exportActiveProfile());
    document.getElementById("importProfileButton").addEventListener("click", () => this.ui.profileImportInput.click());
    document.getElementById("exportAllProfilesButton").addEventListener("click", () => this.exportAllProfiles());
    document.getElementById("restoreBackupButton").addEventListener("click", () => this.ui.backupImportInput.click());
    document.getElementById("resetProfileDataButton").addEventListener("click", () => this.resetCurrentProfileData());
    document.getElementById("resetAllDataButton").addEventListener("click", () => this.resetAllLocalData());
    document.getElementById("backupReminderButton").addEventListener("click", () => this.exportActiveProfile());
    this.ui.profileImportInput.addEventListener("change", event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) this.importProfileFile(file); });
    this.ui.backupImportInput.addEventListener("change", event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) this.restoreBackupFile(file); });

    document.getElementById("playAgainButton").addEventListener("click", () => {
      this.ui.resultDialog.close();
      if (this.tournament?.active && this.tournament.awaitingContinue) {
        this.continueTournament();
        return;
      }
      if (this.lastActivity?.kind === "tournament") {
        this.openTournamentSetup();
        return;
      }
      if (this.arcadeChallenge?.completed) {
        this.arcadeChallenge = null;
        this.startRandomChallenge();
        return;
      }
      if (!this.lastActivity) return;
      if (this.lastActivity.kind === "lesson") {
        const lesson = this.getLessonDefinition(this.lastActivity.id);
        this.launchWithLoading(lesson?.title || "Typing Lesson", () => this.beginLesson(this.lastActivity.id));
      } else {
        const mode = MODE_METADATA.find(item => item.id === this.lastActivity.id);
        this.launchWithLoading(mode?.title || "Typing Game", () => this.beginMode(this.lastActivity.id));
      }
    });

    this.ui.resultHomeButton.addEventListener("click", () => {
      this.ui.resultDialog.close();
      if (this.tournament?.active) this.abortTournament({ keepScreen: true });
      this.arcadeChallenge = null;
      this.showScreen(this.activityKind === "lesson" ? "lessons" : "menu");
    });

    document.getElementById("resultReportsButton").addEventListener("click", () => {
      this.ui.resultDialog.close();
      if (this.tournament?.active) this.abortTournament({ keepScreen: true });
      this.arcadeChallenge = null;
      this.showScreen("reports");
    });

    document.getElementById("clearScoresButton").addEventListener("click", () => {
      if (confirm(`Clear all locally saved scores for ${this.getActiveProfile()?.name ?? "this profile"}?`)) {
        this.scores = [];
        this.persistActiveProfile();
        this.renderScoreboard();
        this.renderProgress();
        this.renderAchievements();
        this.renderProfiles();
        this.updateProfileChrome();
      }
    });

    this.ui.settingsForm.addEventListener("submit", event => {
      event.preventDefault();
      this.settings = {
        difficulty: this.ui.difficultySelect.value,
        wordList: this.ui.wordListSelect.value,
        theme: this.ui.themeSelect.value,
        sound: this.ui.soundToggle.checked,
        backupReminder: this.ui.backupReminderToggle.checked
      };
      this.persistActiveProfile();
      this.applyTheme(this.settings.theme);
      this.engine.setSound(this.settings.sound);
      this.renderMenu();
      this.renderLessons();
      this.renderDifficultyPreview();
      this.renderProfiles();
      this.updateProfileChrome();
      this.showScreen("lessons");
    });

    this.ui.difficultySelect.addEventListener("change", () => this.renderDifficultyPreview());
    this.ui.themeSelect.addEventListener("change", () => this.applyTheme(this.ui.themeSelect.value));

    document.getElementById("resetSettingsButton").addEventListener("click", () => {
      this.settings = { ...DEFAULT_SETTINGS };
      this.persistActiveProfile();
      this.engine.setSound(this.settings.sound);
      this.applyTheme(this.settings.theme);
      this.renderSettings();
      this.renderMenu();
      this.renderLessons();
      this.updateProfileChrome();
    });

    document.getElementById("resetAdaptiveButton").addEventListener("click", () => {
      if (!confirm("Reset the weak-key, key-pair, and adaptive typing profile for the active learner? Scores will be kept.")) return;
      this.keyStats = {};
      this.keyHistory = [];
      this.pairStats = {};
      this.persistActiveProfile();
      this.renderLessons();
      this.renderProgress();
      this.renderProfiles();
    });

    [this.ui.profileDialog, this.ui.tournamentDialog, this.ui.hostDialog, this.ui.guideDialog, this.ui.resultDialog].forEach(dialog => {
      dialog.addEventListener("click", event => {
        if (event.target !== dialog) return;
        if (dialog === this.ui.resultDialog && this.tournament?.active) return;
        dialog.close();
      });
    });
    this.ui.resultDialog.addEventListener("cancel", event => {
      if (this.tournament?.active) event.preventDefault();
    });
  }

  renderLessons() {
    const profile = DIFFICULTY_CONFIG[this.settings.difficulty];
    this.ui.lessonDifficultyChip.textContent = profile.label;
    const categories = [...new Set(LESSON_METADATA.map(lesson => lesson.category ?? "Lessons"))];

    this.ui.lessonGrid.innerHTML = categories.map(category => `
      <section class="lesson-category">
        <div class="lesson-category-heading">
          <span>${category}</span>
          <small>${LESSON_METADATA.filter(item => (item.category ?? "Lessons") === category).length} lessons</small>
        </div>
        <div class="lesson-category-grid">
          ${LESSON_METADATA.filter(item => (item.category ?? "Lessons") === category).map(lesson => `
            <article class="lesson-card ${lesson.source === "adaptive" ? "adaptive-card" : ""}">
              <div class="lesson-card-topline">
                <span class="mode-number">${lesson.number}</span>
                <span class="lesson-target-chip">${lesson.targetWpm} WPM • ${lesson.targetAccuracy}%</span>
              </div>
              <h3>${lesson.title}</h3>
              <p>${lesson.subtitle}</p>
              <div class="game-card-meta">
                ${lesson.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
              </div>
              ${this.renderLessonRecordLine(lesson)}
              <div class="card-spacer"></div>
              <button type="button" data-lesson="${lesson.id}">Start ${lesson.title}</button>
            </article>
          `).join("")}
        </div>
      </section>
    `).join("");

    this.renderWeakKeySummary();
    this.renderSmartPracticeLab();
    this.ui.lessonGrid.querySelectorAll("[data-lesson]").forEach(button => {
      button.addEventListener("click", () => this.startLesson(button.dataset.lesson));
    });
  }

  renderSmartPracticeLab() {
    if (!this.ui.smartPracticeLab) return;
    const weakPairs = this.getWeakPairs(5);
    const poolStats = getSmartPoolStats({
      listName: this.settings.wordList,
      focusPairs: weakPairs.map(item => item.pair)
    });
    const listLabel = ({ general: "General", office: "Office", technical: "Technical" }[this.settings.wordList] || this.settings.wordList);
    const pairNote = weakPairs.length
      ? `Current transition focus: ${weakPairs.slice(0, 4).map(item => `${item.pair.toUpperCase()} ${Math.round(item.accuracy)}%`).join(" · ")}`
      : "Transition focus will personalize after several lesson-style sessions.";

    this.ui.smartPracticeLab.innerHTML = `
      <section class="smart-practice-panel">
        <div class="smart-practice-heading">
          <div>
            <span class="eyebrow">New in v0.12 • keyboard-aware generation</span>
            <h3>Smart Practice Lab</h3>
            <p>These drills analyze the actual keyboard geometry of the ${this.escapeHtml(listLabel)} vocabulary pool instead of merely choosing random words by length.</p>
          </div>
          <div class="smart-pool-summary">
            <strong>${poolStats.total}</strong><span>analyzed words</span>
            <small>${this.escapeHtml(pairNote)}</small>
          </div>
        </div>
        <div class="smart-drill-grid">
          ${SMART_PRACTICE_MODES.map(mode => {
            const record = this.getLessonProgress(mode);
            const count = poolStats[mode.smartStrategy] ?? poolStats.total;
            return `<article class="smart-drill-card ${mode.smartStrategy === "troublePairs" ? "adaptive-card" : ""}">
              <div class="lesson-card-topline"><span class="mode-number">${this.escapeHtml(mode.number)}</span><span class="smart-pool-chip">~${count} matching words</span></div>
              <h4>${this.escapeHtml(mode.title)}</h4>
              <p>${this.escapeHtml(mode.subtitle)}</p>
              <div class="game-card-meta">${mode.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join("")}</div>
              <div class="lesson-record-line">${record.attempts ? `${record.attempts} runs • Best <strong>${record.bestWpm} WPM</strong> / <strong>${record.bestAccuracy}%</strong>` : `Not practiced yet • ${mode.targetWpm} WPM / ${mode.targetAccuracy}% reference`}</div>
              <button type="button" data-smart-drill="${mode.id}">Start ${this.escapeHtml(mode.title)}</button>
            </article>`;
          }).join("")}
        </div>
        <div class="smart-lab-note"><strong>Not curriculum gates:</strong> Smart Practice sessions are saved as Practice records and do not change the 14-lesson course-completion requirement.</div>
      </section>`;

    this.ui.smartPracticeLab.querySelectorAll("[data-smart-drill]").forEach(button => {
      button.addEventListener("click", () => this.startLesson(button.dataset.smartDrill));
    });
  }

  renderLessonRecordLine(lesson) {
    const record = this.getLessonProgress(lesson);
    if (!record.attempts) {
      return `<div class="lesson-record-line">Not started yet • Target ${lesson.targetWpm} WPM / ${lesson.targetAccuracy}%</div>`;
    }
    return `<div class="lesson-record-line">
      <strong>${record.attempts}</strong> ${record.attempts === 1 ? "attempt" : "attempts"} •
      Best <strong>${record.bestWpm} WPM</strong> / <strong>${record.bestAccuracy}%</strong>
      ${record.metTarget ? `<span class="lesson-mastered">Target met</span>` : ""}
    </div>`;
  }

  getLessonScores(lessonId) {
    return this.scores
      .filter(row => ["lesson", "practice"].includes(row.activityType) && row.modeId === lessonId)
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  }

  getLessonProgress(lesson) {
    const rows = this.getLessonScores(lesson.id);
    const bestWpm = rows.length ? Math.max(...rows.map(row => Number(row.wpm) || 0)) : 0;
    const bestAccuracy = rows.length ? Math.max(...rows.map(row => Number(row.accuracy) || 0)) : 0;
    const metTarget = rows.some(row => row.targetStatus === "Met" || ((Number(row.wpm) || 0) >= lesson.targetWpm && (Number(row.accuracy) || 0) >= lesson.targetAccuracy));
    const latest = rows.at(-1) ?? null;
    return {
      attempts: rows.length,
      bestWpm,
      bestAccuracy,
      metTarget,
      latest,
      trend: this.getMetricTrend(rows, "wpm", 1.5)
    };
  }

  getMetricTrend(rows, field, threshold = 1) {
    if (!rows || rows.length < 2) return { direction: "flat", delta: 0, label: "New" };
    const recent = rows.slice(-3);
    const prior = rows.slice(-6, -3);
    const recentAvg = recent.reduce((sum, row) => sum + (Number(row[field]) || 0), 0) / recent.length;
    const comparison = prior.length
      ? prior.reduce((sum, row) => sum + (Number(row[field]) || 0), 0) / prior.length
      : Number(rows[rows.length - 2][field]) || 0;
    const delta = recentAvg - comparison;
    if (delta > threshold) return { direction: "up", delta, label: `+${delta.toFixed(1)}` };
    if (delta < -threshold) return { direction: "down", delta, label: delta.toFixed(1) };
    return { direction: "flat", delta, label: "Steady" };
  }

  renderWeakKeySummary() {
    if (!this.ui.weakKeySummary) return;
    const weak = this.getWeakKeys(6);
    const pairs = this.getWeakPairs(4);
    if (!weak.length && !pairs.length) {
      this.ui.weakKeySummary.innerHTML = `
        <strong>Adaptive profile:</strong> Complete a few lessons and HyperSoft will begin identifying recurring weak keys and troublesome two-letter transitions locally on this computer.
      `;
      return;
    }

    this.ui.weakKeySummary.innerHTML = `
      <strong>Adaptive focus:</strong>
      ${weak.length ? weak.map(item => `<span class="weak-key-chip">${this.escapeHtml(this.formatKeyLabel(item.key))} ${Math.round(item.accuracy)}%</span>`).join("") : `<span class="adaptive-profile-note">No persistent single-key weakness</span>`}
      ${pairs.length ? `<span class="adaptive-separator">Transitions:</span>${pairs.map(item => `<span class="pair-focus-chip">${this.escapeHtml(item.pair.toUpperCase())} ${Math.round(item.accuracy)}%</span>`).join("")}` : ""}
      <span class="adaptive-profile-note">Weak-Key Workshop and Trouble-Pair Clinic use these results automatically.</span>
    `;
  }

  renderMenu() {
    const profile = DIFFICULTY_CONFIG[this.settings.difficulty];
    this.ui.menuDifficultyChip.textContent = profile.label;
    this.ui.gameGrid.innerHTML = MODE_METADATA.map((mode, index) => {
      const record = this.getModeArcadeRecord(mode.id);
      const current = record.byDifficulty[this.settings.difficulty];
      const recordLine = record.runs
        ? `<div class="game-record-strip"><span>${record.runs} runs · ${record.wins} wins</span><strong>Best ${record.bestScore} pts · ${record.bestWpm} WPM</strong><small>${DIFFICULTY_CONFIG[this.settings.difficulty]?.label ?? this.settings.difficulty}: ${current?.runs ? `${current.bestScore} pts / ${current.bestWpm} WPM` : "no record yet"}</small>${record.bestVariant ? `<small>Top variant: ${this.escapeHtml(record.bestVariant)}</small>` : ""}</div>`
        : `<div class="game-record-strip empty"><span>No arcade record yet</span><small>Current difficulty: ${DIFFICULTY_CONFIG[this.settings.difficulty]?.label ?? this.settings.difficulty}</small></div>`;
      return `
      <article class="game-card">
        <span class="mode-number">Mode ${index + 1}</span>
        <h3>${mode.title}</h3>
        <p>${mode.subtitle}</p>
        <div class="game-card-meta">
          ${mode.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
        </div>
        ${recordLine}
        <div class="card-spacer"></div>
        <button type="button" data-mode="${mode.id}">Play ${mode.title}</button>
      </article>`;
    }).join("");

    this.ui.gameGrid.querySelectorAll("[data-mode]").forEach(button => {
      button.addEventListener("click", () => this.startMode(button.dataset.mode));
    });
    this.renderArcadeDashboard();
  }

  isArcadeGameRow(row) {
    if (!row) return false;
    if (row.activityType === "game") return MODE_METADATA.some(mode => mode.id === row.modeId);
    if (row.activityType == null) return MODE_METADATA.some(mode => mode.id === row.modeId);
    return false;
  }

  getArcadeGameRows() {
    return [...(this.scores ?? [])]
      .filter(row => this.isArcadeGameRow(row))
      .sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));
  }

  getTournamentRows() {
    return [...(this.scores ?? [])]
      .filter(row => row.activityType === "tournament")
      .sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));
  }

  getModeArcadeRecord(modeId) {
    const rows = this.getArcadeGameRows().filter(row => row.modeId === modeId);
    const wins = rows.filter(row => row.success === true).length;
    const byDifficulty = {};
    Object.keys(DIFFICULTY_CONFIG).forEach(id => {
      const subset = rows.filter(row => row.difficulty === id);
      byDifficulty[id] = {
        runs: subset.length,
        wins: subset.filter(row => row.success === true).length,
        bestScore: subset.length ? Math.max(...subset.map(row => Number(row.score) || 0)) : 0,
        bestWpm: subset.length ? Math.max(...subset.map(row => Number(row.wpm) || 0)) : 0,
        bestAccuracy: subset.length ? Math.max(...subset.map(row => Number(row.accuracy) || 0)) : 0
      };
    });
    const bestRow = rows.length ? [...rows].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0) || (Number(b.wpm) || 0) - (Number(a.wpm) || 0))[0] : null;
    return {
      runs: rows.length,
      wins,
      bestScore: rows.length ? Math.max(...rows.map(row => Number(row.score) || 0)) : 0,
      bestWpm: rows.length ? Math.max(...rows.map(row => Number(row.wpm) || 0)) : 0,
      bestAccuracy: rows.length ? Math.max(...rows.map(row => Number(row.accuracy) || 0)) : 0,
      bestVariant: bestRow?.variant || "",
      byDifficulty
    };
  }

  getArcadeStreakMetrics(rows = this.getArcadeGameRows()) {
    let current = 0;
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      if (rows[i].success === true) current += 1;
      else break;
    }
    let best = 0;
    let running = 0;
    rows.forEach(row => {
      if (row.success === true) {
        running += 1;
        best = Math.max(best, running);
      } else running = 0;
    });
    const challengeRows = rows.filter(row => row.challengeType === "random");
    let challengeCurrent = 0;
    for (let i = challengeRows.length - 1; i >= 0; i -= 1) {
      if (challengeRows[i].success === true) challengeCurrent += 1;
      else break;
    }
    let challengeBest = 0;
    running = 0;
    challengeRows.forEach(row => {
      if (row.success === true) {
        running += 1;
        challengeBest = Math.max(challengeBest, running);
      } else running = 0;
    });
    return { current, best, challengeCurrent, challengeBest };
  }

  getTournamentRecordSummary() {
    const rows = this.getTournamentRows();
    const wins = rows.filter(row => row.success === true).length;
    const best = rows.length ? [...rows].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))[0] : null;
    const gold = rows.filter(row => row.tournamentMedal === "Gold").length;
    return { rows, tournaments: rows.length, wins, gold, bestScore: Number(best?.score) || 0, bestFormat: best?.tournamentFormat || null };
  }

  renderArcadeDashboard() {
    if (!this.ui.arcadeDashboard) return;
    const gameRows = this.getArcadeGameRows();
    const wins = gameRows.filter(row => row.success === true).length;
    const uniqueWins = new Set(gameRows.filter(row => row.success === true).map(row => row.modeId)).size;
    const streak = this.getArcadeStreakMetrics(gameRows);
    const challengeWins = gameRows.filter(row => row.challengeType === "random" && row.success === true).length;
    const tournaments = this.getTournamentRecordSummary();
    const difficulty = DIFFICULTY_CONFIG[this.settings.difficulty]?.label ?? this.settings.difficulty;
    const recordRows = MODE_METADATA.map(mode => {
      const record = this.getModeArcadeRecord(mode.id);
      const current = record.byDifficulty[this.settings.difficulty];
      return `<tr><td>${this.escapeHtml(mode.title)}</td><td>${record.runs}</td><td>${record.wins}</td><td>${record.bestScore || "—"}</td><td>${record.bestWpm || "—"}</td><td>${record.bestAccuracy ? `${record.bestAccuracy}%` : "—"}</td><td>${current?.runs ? `${current.bestScore} / ${current.bestWpm} WPM` : "—"}</td></tr>`;
    }).join("");

    this.ui.arcadeDashboard.innerHTML = `
      <section class="arcade-command-panel">
        <div class="arcade-command-copy">
          <span class="eyebrow">HyperSoft Arcade Control Desk</span>
          <h3>Tournaments &amp; Challenges</h3>
          <p><strong>Typing Tournament</strong> chains 3, 5, or all 8 games into one scored cup. <strong>Blake's Random Challenge</strong> immediately chooses a game and a randomized set of mode options.</p>
          <div class="button-row compact">
            <button class="primary" type="button" data-arcade-action="tournament">Start Typing Tournament</button>
            <button class="secondary" type="button" data-arcade-action="random">Blake's Random Challenge</button>
          </div>
        </div>
        <div class="arcade-command-stats">
          <div><span>Arcade wins</span><strong>${wins}</strong><small>${uniqueWins}/8 games won</small></div>
          <div><span>Win streak</span><strong>${streak.current}</strong><small>Best ${streak.best}</small></div>
          <div><span>Challenges won</span><strong>${challengeWins}</strong><small>Streak ${streak.challengeCurrent} · Best ${streak.challengeBest}</small></div>
          <div><span>Tournaments</span><strong>${tournaments.wins}/${tournaments.tournaments}</strong><small>${tournaments.gold} Gold · Best ${tournaments.bestScore || "—"}</small></div>
        </div>
      </section>
      <section class="arcade-record-panel">
        <div class="arcade-record-heading"><div><h3>Mode Records</h3><p>Overall records plus the current <strong>${this.escapeHtml(difficulty)}</strong> difficulty personal best.</p></div><span>${gameRows.length} recorded runs</span></div>
        <div class="arcade-record-scroll"><table class="arcade-record-table"><thead><tr><th>Game</th><th>Runs</th><th>Wins</th><th>Best Score</th><th>Best WPM</th><th>Best Accuracy</th><th>${this.escapeHtml(difficulty)} PB</th></tr></thead><tbody>${recordRows}</tbody></table></div>
      </section>`;

    this.ui.arcadeDashboard.querySelector('[data-arcade-action="tournament"]')?.addEventListener("click", () => this.openTournamentSetup());
    this.ui.arcadeDashboard.querySelector('[data-arcade-action="random"]')?.addEventListener("click", () => this.startRandomChallenge());
  }

  openTournamentSetup() {
    this.stopActiveGame();
    this.arcadeChallenge = null;
    if (!this.ui.tournamentDialog.open) this.ui.tournamentDialog.showModal();
    requestAnimationFrame(() => document.getElementById("startTournamentButton")?.focus());
  }

  shuffleArray(values = []) {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  randomPick(values = [], fallback = null) {
    return values.length ? values[Math.floor(Math.random() * values.length)] : fallback;
  }

  getRandomGameOptions(modeId, { tournament = false } = {}) {
    const pick = values => this.randomPick(values, values[0]);
    if (modeId === "creatureLab") return { labProgram: pick(["standard", "precision", "mutation"]), labBatchSize: tournament ? "standard" : pick(["standard", "extended"]) };
    if (modeId === "roadRace") return { roadTrack: pick(["city", "desert", "alpine", "night"]), roadOpponent: pick(["ledger", "quick", "closer", "bot"]), roadLength: tournament ? "sprint" : pick(["sprint", "standard"]), roadTextStyle: pick(["salad", "office", "technical", "sentences"]) };
    if (modeId === "checkOutTime") return { checkoutLane: pick(["standard", "express", "discount", "audit"]), checkoutInput: tournament ? "either" : pick(["either", "either", "either", "numpad"]) };
    if (modeId === "farOffAdventures") return { adventureRoute: pick(["valley", "ridge", "storm", "alpine"]), adventureLength: tournament ? "short" : pick(["short", "standard"]), adventureRhythm: pick(["steady", "shift", "mixed"]) };
    if (modeId === "chameleonPicnic") return { picnicProgram: pick(["classic", "case", "pairs", "festival"]), picnicSite: pick(["lawn", "garden", "evening", "office"]) };
    if (modeId === "spaceJunk") return { spaceStation: pick(["research", "relay", "cargo", "defense"]), spaceMission: pick(["patrol", "armor", "storm", "salvage"]), spaceDuration: tournament ? "short" : pick(["short", "standard"]) };
    if (modeId === "sharkAttack") return { sharkScenario: pick(["open", "reef", "storm", "night"]), sharkPredator: pick(["reef", "mako", "hammer", "white"]), sharkLength: tournament ? "sprint" : pick(["sprint", "standard"]) };
    if (modeId === "penguinCrossing") return { penguinRoute: pick(["channel", "fork", "shelf", "aurora"]), penguinFloeProgram: pick(["standard", "fragile", "bonus", "mixed"]) };
    return {};
  }

  startRandomChallenge() {
    if (this.tournament?.active) return;
    this.stopActiveGame();
    const mode = this.randomPick(MODE_METADATA);
    if (!mode) return;
    const options = this.getRandomGameOptions(mode.id, { tournament: false });
    this.arcadeChallenge = {
      active: true,
      completed: false,
      id: `challenge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      modeId: mode.id,
      options,
      startedAt: Date.now()
    };
    this.pendingGameOptions = { ...options };
    this.pendingGameId = null;
    this.launchWithLoading(`Random Challenge: ${mode.title}`, () => this.beginMode(mode.id));
  }

  startTournamentFromDialog() {
    const format = this.ui.tournamentFormatSelect?.value || "standard";
    const order = this.ui.tournamentOrderSelect?.value || "random";
    this.ui.tournamentDialog.close();
    this.startTournament(format, order);
  }

  startTournament(format = "standard", order = "random") {
    this.stopActiveGame();
    this.arcadeChallenge = null;
    const counts = { quick: 3, standard: 5, grand: 8 };
    const count = counts[format] || 5;
    let modes = MODE_METADATA.map(mode => mode.id);
    if (order === "random") modes = this.shuffleArray(modes);
    modes = modes.slice(0, count);
    this.tournament = {
      active: true,
      awaitingContinue: false,
      id: `tournament_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      format,
      order,
      rounds: modes,
      currentIndex: 0,
      results: [],
      startedAt: Date.now()
    };
    this.startTournamentRound();
  }

  startTournamentRound() {
    if (!this.tournament?.active) return;
    const modeId = this.tournament.rounds[this.tournament.currentIndex];
    const mode = MODE_METADATA.find(item => item.id === modeId);
    if (!mode) { this.abortTournament(); return; }
    this.tournament.awaitingContinue = false;
    this.pendingGameOptions = this.getRandomGameOptions(modeId, { tournament: true });
    this.pendingGameId = null;
    const round = this.tournament.currentIndex + 1;
    this.launchWithLoading(`Tournament ${round}/${this.tournament.rounds.length}: ${mode.title}`, () => this.beginMode(modeId));
  }

  continueTournament() {
    if (!this.tournament?.active) return;
    this.ui.resultDialog.close();
    this.tournament.awaitingContinue = false;
    this.tournament.currentIndex += 1;
    if (this.tournament.currentIndex >= this.tournament.rounds.length) {
      this.completeTournament();
      return;
    }
    this.startTournamentRound();
  }

  abortTournament({ keepScreen = false } = {}) {
    this.stopActiveGame();
    this.tournament = null;
    this.activityKind = "game";
    if (!keepScreen) this.showScreen("menu");
  }

  calculateCupPoints(result) {
    const completion = result.success !== false ? 1200 : 350;
    const speed = Math.min(150, Math.max(0, Number(result.wpm) || 0)) * 18;
    const accuracy = Math.max(0, Math.min(100, Number(result.accuracy) || 0)) * 11;
    const raw = Math.min(6000, Math.max(0, Number(result.score) || 0)) * 0.22;
    return Math.round(completion + speed + accuracy + raw);
  }

  getTournamentMedal(results = []) {
    if (!results.length) return "Completion";
    const wins = results.filter(row => row.success === true).length;
    const avgAccuracy = this.averageField(results, "accuracy");
    if (wins === results.length && avgAccuracy >= 95) return "Gold";
    if (wins >= Math.ceil(results.length * 0.75)) return "Silver";
    if (wins >= Math.ceil(results.length * 0.5)) return "Bronze";
    return "Completion";
  }


  completeTournament(roundUnlocks = []) {
    if (!this.tournament) return;
    const tournament = this.tournament;
    const results = tournament.results;
    const totalCupPoints = results.reduce((sum, row) => sum + (Number(row.cupPoints) || 0), 0);
    const totalDuration = results.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0);
    const avgWpm = Math.round(this.averageField(results, "wpm"));
    const avgAccuracy = Math.round(this.averageField(results, "accuracy"));
    const wins = results.filter(row => row.success === true).length;
    const medal = this.getTournamentMedal(results);
    const success = medal !== "Completion";
    const formatLabel = { quick: "Quick Cup", standard: "Standard Cup", grand: "Grand Tour" }[tournament.format] || "Typing Tournament";
    const summary = {
      title: `${formatLabel} Complete`,
      message: `${wins} of ${results.length} rounds won. HyperSoft awards a ${medal} result with ${totalCupPoints.toLocaleString()} Cup Points.`,
      score: totalCupPoints,
      wpm: avgWpm,
      accuracy: avgAccuracy,
      durationMs: totalDuration,
      success,
      variant: `${formatLabel} · ${medal}`,
      tournamentId: tournament.id,
      tournamentFormat: tournament.format,
      tournamentMedal: medal,
      tournamentWins: wins,
      tournamentRounds: results.length,
      extraStats: [
        ["Cup Points", totalCupPoints.toLocaleString()],
        ["Rounds won", `${wins}/${results.length}`],
        ["Medal", medal],
        ["Format", formatLabel]
      ]
    };
    this.tournament = null;
    this.activityKind = "tournament";
    this.activeMode = { id: "typingTournament", title: "Typing Tournament", subtitle: "HyperSoft multi-game arcade competition" };
    this.lastActivity = { kind: "tournament", id: "typingTournament" };
    this.saveScore(summary);
    const tournamentUnlocks = this.syncAchievements({ notify: true });
    const seenUnlocks = new Set();
    summary.newAchievements = [...roundUnlocks, ...tournamentUnlocks].filter(item => item && !seenUnlocks.has(item.id) && seenUnlocks.add(item.id));
    this.renderScoreboard();
    this.renderAchievements();
    this.renderMenu();
    this.showResult(summary);
  }

  getBlakeTournamentResultComment(result) {
    const medal = result.tournamentMedal || "Completion";
    if (medal === "Gold") return `Gold. Across an entire multi-game tournament. HyperSoft has asked me to stop referring to myself as the uncontested arcade standard until Legal determines what “uncontested” means.`;
    if (medal === "Silver") return `Silver is annoyingly credible. You stayed productive across different mechanics instead of relying on one favorite game, which is exactly the kind of versatility I usually claim without documentation.`;
    if (medal === "Bronze") return `Bronze. Respectable, measurable, and inconveniently printable. Clean up the weakest round and this could become a much more serious problem for my reputation.`;
    return `Tournament complete. The cup survived, you survived, and several individual games have now identified exactly where your typing falls apart under pressure. That's useful data, even if the trophy department is withholding metal.`;
  }

  renderSettings() {
    this.ui.difficultySelect.value = this.settings.difficulty;
    this.ui.wordListSelect.value = this.settings.wordList;
    this.ui.themeSelect.value = this.settings.theme;
    this.ui.soundToggle.checked = this.settings.sound;
    this.ui.backupReminderToggle.checked = this.settings.backupReminder !== false;
    const profile = this.getActiveProfile();
    this.ui.settingsProfileContext.textContent = this.activeProfileId === "guest"
      ? "Guest preferences are temporary and will not be saved."
      : `These preferences belong to ${profile?.name ?? "the active profile"}.`;
    this.renderDifficultyPreview();
  }

  renderDifficultyPreview() {
    const difficulty = this.ui.difficultySelect.value;
    const profile = DIFFICULTY_CONFIG[difficulty];
    this.ui.difficultyPreview.innerHTML = `
      <strong>${profile.label} profile</strong><br />
      Word range: ${profile.wordMin}–${profile.wordMax} letters ·
      Base spawn: ${(profile.spawnInterval / 1000).toFixed(2)}s ·
      Movement multiplier: ${profile.movementSpeed.toFixed(2)}× ·
      Error tolerance: ${profile.errorTolerance} ·
      10-key length: ${profile.numericLength} digits<br />
      <span class="settings-lesson-note">Lessons also use this setting to scale exercise length and generated word difficulty.</span>
    `;
  }

  getLessonDefinition(lessonId) {
    return LESSON_METADATA.find(item => item.id === lessonId)
      ?? SMART_PRACTICE_MODES.find(item => item.id === lessonId)
      ?? null;
  }

  startLesson(lessonId) {
    this.stopActiveGame();
    this.tournament = null;
    this.arcadeChallenge = null;
    const lesson = this.getLessonDefinition(lessonId);
    if (!lesson) return;

    this.pendingLessonId = lessonId;
    this.pendingGameId = null;
    const record = this.getLessonProgress(lesson);
    this.ui.hostEyebrow.textContent = lesson.isSmartPractice ? "A word from Blake • Smart Practice Briefing" : "A word from Blake • Lesson Briefing";
    this.ui.hostTitle.textContent = `${lesson.number}: ${lesson.title}`;
    this.ui.hostMessage.textContent = this.getBlakeLessonBriefing(lesson, record);
    this.ui.hostOptions.hidden = true;
    this.ui.hostOptions.innerHTML = "";
    this.ui.hostTargets.innerHTML = `
      <span>${lesson.targetWpm} WPM target</span>
      <span>${lesson.targetAccuracy}% accuracy</span>
      <span>${record.attempts ? `${record.attempts} prior ${record.attempts === 1 ? "attempt" : "attempts"}` : "First attempt"}</span>
      ${record.metTarget ? `<span>Target previously met</span>` : ""}
    `;
    this.ui.hostComplianceMessage.textContent = this.getLessonComplianceNote(lesson);
    document.getElementById("hostStartButton").textContent = lesson.isSmartPractice ? "Start Smart Drill" : "Start Lesson";
    if (!this.ui.hostDialog.open) this.ui.hostDialog.showModal();
    requestAnimationFrame(() => document.getElementById("hostStartButton")?.focus());
  }

  beginLesson(lessonId) {
    const lesson = this.getLessonDefinition(lessonId);
    if (!lesson) return;
    this.pendingLessonId = null;
    this.activityKind = "lesson";
    this.activeMode = lesson;
    this.lastActivity = { kind: "lesson", id: lessonId };
    this.ui.activeGameTitle.textContent = lesson.title;
    this.ui.activeGameSubtitle.textContent = lesson.subtitle;
    this.ui.backButton.textContent = "← Back to lessons";
    this.ui.guidedLinkButton.textContent = "Lesson Guide";
    this.ui.stage.innerHTML = "";
    this.showScreen("game");

    this.engine.startGame({
      difficulty: this.settings.difficulty,
      wordList: lesson.wordList ?? this.settings.wordList,
      modeId: `lesson:${lessonId}`
    });

    this.activeGame = new ScrollingTypingExercise({
      stage: this.ui.stage,
      engine: this.engine,
      settings: this.settings,
      finish: result => this.finishActivity(result),
      lesson,
      adaptiveProfile: this.getWeakKeys(8),
      pairProfile: this.getWeakPairs(8)
    });
    this.activeGame.start();
    this.startHudTimer();
    this.ui.stage.focus();
  }

  getBlakeLessonBriefing(lesson, record) {
    if (lesson.source === "smart") {
      const pairs = this.getWeakPairs(4);
      if (lesson.smartStrategy === "troublePairs") return pairs.length
        ? `HyperSoft found recurring transition trouble in ${pairs.map(item => item.pair.toUpperCase()).join(", ")}. This drill will keep feeding those letter pairs back to you until they become boring. I have requested the same technology for compliance training and was denied.`
        : `There isn't enough pair history yet, so HyperSoft is using its general awkward-transition pool. Type cleanly and the software will start learning which two-letter moves actually cost you accuracy.`;
      return `This is keyboard geometry, not random vocabulary. ${lesson.title} filters the current word family for a specific movement pattern, then keeps the normal continuous ribbon. Apparently "I type whatever looks fast" is not an accepted instructional model.`;
    }
    if (lesson.source === "adaptive") {
      const weak = this.getWeakKeys(4);
      return weak.length
        ? `I've reviewed the numbers. Your troublesome keys are ${weak.map(item => this.formatKeyLabel(item.key)).join(", ")}. I prefer to call those "opportunities for you to become slightly more like me." Keep the pace steady and make those keys boring.`
        : `The computer says you haven't established any weak keys yet. Obviously I understand what that's like. We'll use a broad mixed-keyboard workout until it has enough evidence.`;
    }
    if (lesson.source === "patterns") return `This is finger-position work, not literature. Keep your hands anchored, make the reaches clean, and don't chase speed until the keys start finding themselves. I learned this before anyone started making me lock my workstation.`;
    if (lesson.source === "capitalized") return `Today we add Shift. Use the opposite hand when practical and keep the rhythm intact. Capitalization is important; it makes an email look authoritative even when you accidentally send it to the wrong distribution list.`;
    if (lesson.source === "numbers") return `Number-row accuracy first, speed second. Return to home position after every reach. Procurement has assured me that changing one digit can have "financial consequences," which feels dramatic but apparently is true.`;
    if (lesson.source === "punctuation") return `Every mark on the ribbon counts. Commas, apostrophes, quotes, all of it. HyperSoft says punctuation improves clarity. Compliance says it also improves incident reports. I have extensive exposure to both.`;
    if (lesson.source === "mixed") return `This is where the keyboard stops being polite: words, capitals, numbers, punctuation. Don't let a change in character type break your cadence. Read ahead and keep the hands moving.`;
    if (lesson.category === "Speed & Endurance") return `Settle into a sustainable pace. Don't sprint the first fifteen words and then negotiate with your fingers. The ribbon is intentionally nonsense; your job is simply to keep it moving.`;
    if (record.attempts) return `You've been here ${record.attempts} ${record.attempts === 1 ? "time" : "times"} before. Your best is ${record.bestWpm} WPM at up to ${record.bestAccuracy}% accuracy. Beat one of those without wrecking the other and I'll consider it a productive use of company time.`;
    return `First attempt. Accuracy comes before speed, but don't stop after every token. Read slightly ahead, keep a steady rhythm, and remember: the keyboard is the one office asset I have never misplaced.`;
  }

  renderGameOptions(modeId) {
    if (!this.ui.hostOptions) return;
    this.ui.hostOptions.hidden = false;
    if (modeId === "creatureLab") {
      this.ui.hostOptions.innerHTML = `
        <div class="host-option-grid">
          <label><span>Lab program</span><select id="labProgramSelect">
            <option value="standard">Standard Batch</option>
            <option value="precision">Precision Study</option>
            <option value="mutation">Mutation Survey</option>
          </select><small>Changes objectives, bonuses, and rare-trait frequency.</small></label>
          <label><span>Batch length</span><select id="labBatchSizeSelect">
            <option value="standard">Standard</option>
            <option value="extended">Extended (+1 specimen)</option>
            <option value="marathon">Marathon (+2 specimens)</option>
          </select><small>Higher difficulty still starts with a larger base batch.</small></label>
        </div>`;
      return;
    }
    if (modeId === "roadRace") {
      this.ui.hostOptions.innerHTML = `
        <div class="host-option-grid road-options">
          <label><span>Track</span><select id="roadTrackSelect">
            <option value="city">Downtown Loop</option>
            <option value="desert">Desert Straight</option>
            <option value="alpine">Alpine Run</option>
            <option value="night">Night Freeway</option>
          </select></label>
          <label><span>Opponent</span><select id="roadOpponentSelect">
            <option value="ledger">Dana Ledger — steady</option>
            <option value="quick">Vic Quick — speed bursts</option>
            <option value="closer">Morgan Closer — late rush</option>
            <option value="bot">BLAKE-BOT 2000 — fast steady</option>
          </select></label>
          <label><span>Race length</span><select id="roadLengthSelect">
            <option value="sprint">Sprint</option>
            <option value="standard" selected>Standard</option>
            <option value="endurance">Endurance</option>
          </select></label>
          <label><span>Typing style</span><select id="roadTextStyleSelect">
            <option value="salad">Classic Word Salad</option>
            <option value="office">Office Stream</option>
            <option value="technical">Technical Stream</option>
            <option value="sentences">Sentence Run</option>
          </select></label>
        </div>`;
      return;
    }
    if (modeId === "checkOutTime") {
      this.ui.hostOptions.innerHTML = `
        <div class="host-option-grid checkout-options">
          <label><span>Register assignment</span><select id="checkoutLaneSelect">
            <option value="standard">Standard Lane</option>
            <option value="express">Express Rush</option>
            <option value="discount">Discount Desk</option>
            <option value="audit">Audit Lane</option>
          </select><small>Changes duration, conveyor pressure, calculation mix, and basket-total frequency.</small></label>
          <label><span>Keypad rule</span><select id="checkoutInputSelect">
            <option value="either">Number row or numpad</option>
            <option value="numpad">Numpad only</option>
          </select><small>Numpad Only rejects the keyboard number row for dedicated 10-key practice.</small></label>
        </div>`;
      return;
    }
    if (modeId === "farOffAdventures") {
      this.ui.hostOptions.innerHTML = `
        <div class="host-option-grid adventure-options">
          <label><span>Expedition route</span><select id="adventureRouteSelect">
            <option value="valley">Gentle Valley</option>
            <option value="ridge">Crosswind Ridge</option>
            <option value="storm">Storm Front</option>
            <option value="alpine">Alpine Expedition</option>
          </select><small>Routes change gravity, wind pressure, and weather patterns.</small></label>
          <label><span>Flight length</span><select id="adventureLengthSelect">
            <option value="short">Short Hop</option>
            <option value="standard" selected>Standard Flight</option>
            <option value="expedition">Long Expedition</option>
          </select></label>
          <label><span>Rhythm program</span><select id="adventureRhythmSelect">
            <option value="steady">Steady Rhythm</option>
            <option value="shift">Pace Shifts</option>
            <option value="mixed">Mixed Expedition</option>
          </select><small>Pace Shift modes periodically ask for a faster or slower cadence rather than one unchanging rhythm.</small></label>
        </div>`;
      return;
    }
    if (modeId === "chameleonPicnic") {
      this.ui.hostOptions.innerHTML = `
        <div class="host-option-grid picnic-options">
          <label><span>Feeding program</span><select id="picnicProgramSelect">
            <option value="classic">Classic Feeding</option>
            <option value="case">Case Crunch</option>
            <option value="pairs">Pair Panic</option>
            <option value="festival">Festival Mix</option>
          </select><small>Case Crunch adds Shift targets; Pair Panic adds two-letter targets; Festival Mix combines them with more golden bonus ants.</small></label>
          <label><span>Picnic site</span><select id="picnicSiteSelect">
            <option value="lawn">Sunny Lawn</option>
            <option value="garden">Garden Table</option>
            <option value="evening">Evening Picnic</option>
            <option value="office">Office Courtyard</option>
          </select><small>All sites use the same three-lane gameplay with a different visual setting.</small></label>
        </div>`;
      return;
    }
    if (modeId === "spaceJunk") {
      this.ui.hostOptions.innerHTML = `
        <div class="host-option-grid space-options">
          <label><span>Station</span><select id="spaceStationSelect">
            <option value="research">Research Platform — balanced</option>
            <option value="relay">Relay Array — low hull, strong shields</option>
            <option value="cargo">Cargo Hub — high hull, no shields</option>
            <option value="defense">Defense Node — score bonus, heavier pressure</option>
          </select></label>
          <label><span>Mission profile</span><select id="spaceMissionSelect">
            <option value="patrol">Standard Patrol</option>
            <option value="armor">Armored Field</option>
            <option value="storm">Storm Watch</option>
            <option value="salvage">Salvage Shift</option>
          </select><small>Mission profiles change armored-object frequency, storm pressure, and defense-pickup availability.</small></label>
          <label><span>Watch length</span><select id="spaceDurationSelect">
            <option value="short">Short Watch — 45 sec</option>
            <option value="standard" selected>Standard Watch — 65 sec</option>
            <option value="endurance">Endurance Watch — 90 sec</option>
          </select></label>
        </div>`;
      return;
    }
    if (modeId === "sharkAttack") {
      this.ui.hostOptions.innerHTML = `
        <div class="host-option-grid shark-options">
          <label><span>Escape scenario</span><select id="sharkScenarioSelect">
            <option value="open">Open Water</option>
            <option value="reef">Reef Run</option>
            <option value="storm">Storm Channel</option>
            <option value="night">Night Swim</option>
          </select><small>Reef and Storm routes add currents; Night Swim limits how far ahead the passage is visible.</small></label>
          <label><span>Predator</span><select id="sharkPredatorSelect">
            <option value="reef">Reef Shark — steady pursuit</option>
            <option value="mako">Mako — speed bursts</option>
            <option value="hammer">Hammerhead — gains on mistakes</option>
            <option value="white">Great White — late acceleration</option>
          </select></label>
          <label><span>Passage length</span><select id="sharkLengthSelect">
            <option value="sprint">Sprint</option>
            <option value="standard" selected>Standard</option>
            <option value="endurance">Endurance</option>
          </select><small>Longer swims add another checkpoint rather than silently increasing shark speed.</small></label>
        </div>`;
      return;
    }
    if (modeId === "penguinCrossing") {
      this.ui.hostOptions.innerHTML = `
        <div class="host-option-grid penguin-options">
          <label><span>Crossing route</span><select id="penguinRouteSelect">
            <option value="channel">Classic Channel</option>
            <option value="fork">Glacier Fork</option>
            <option value="shelf">Fragile Shelf</option>
            <option value="aurora">Aurora Crossing</option>
          </select><small>Glacier Fork adds route choices; Fragile Shelf adds timed fractures; Aurora Crossing favors bonus floes.</small></label>
          <label><span>Floe program</span><select id="penguinFloeProgramSelect">
            <option value="standard">Standard Ice</option>
            <option value="fragile">Fragile Ice</option>
            <option value="bonus">Rescue Markers</option>
            <option value="mixed">Mixed Field</option>
          </select><small>Changes special-floe frequency without increasing the game's established baseline movement speed.</small></label>
        </div>`;
      return;
    }
    this.ui.hostOptions.hidden = true;
    this.ui.hostOptions.innerHTML = "";
  }

  readGameOptions(modeId) {
    if (modeId === "creatureLab") return {
      labProgram: document.getElementById("labProgramSelect")?.value || "standard",
      labBatchSize: document.getElementById("labBatchSizeSelect")?.value || "standard"
    };
    if (modeId === "roadRace") return {
      roadTrack: document.getElementById("roadTrackSelect")?.value || "city",
      roadOpponent: document.getElementById("roadOpponentSelect")?.value || "ledger",
      roadLength: document.getElementById("roadLengthSelect")?.value || "standard",
      roadTextStyle: document.getElementById("roadTextStyleSelect")?.value || "salad"
    };
    if (modeId === "checkOutTime") return {
      checkoutLane: document.getElementById("checkoutLaneSelect")?.value || "standard",
      checkoutInput: document.getElementById("checkoutInputSelect")?.value || "either"
    };
    if (modeId === "farOffAdventures") return {
      adventureRoute: document.getElementById("adventureRouteSelect")?.value || "valley",
      adventureLength: document.getElementById("adventureLengthSelect")?.value || "standard",
      adventureRhythm: document.getElementById("adventureRhythmSelect")?.value || "steady"
    };
    if (modeId === "chameleonPicnic") return {
      picnicProgram: document.getElementById("picnicProgramSelect")?.value || "classic",
      picnicSite: document.getElementById("picnicSiteSelect")?.value || "lawn"
    };
    if (modeId === "spaceJunk") return {
      spaceStation: document.getElementById("spaceStationSelect")?.value || "research",
      spaceMission: document.getElementById("spaceMissionSelect")?.value || "patrol",
      spaceDuration: document.getElementById("spaceDurationSelect")?.value || "standard"
    };
    if (modeId === "sharkAttack") return {
      sharkScenario: document.getElementById("sharkScenarioSelect")?.value || "open",
      sharkPredator: document.getElementById("sharkPredatorSelect")?.value || "reef",
      sharkLength: document.getElementById("sharkLengthSelect")?.value || "standard"
    };
    if (modeId === "penguinCrossing") return {
      penguinRoute: document.getElementById("penguinRouteSelect")?.value || "channel",
      penguinFloeProgram: document.getElementById("penguinFloeProgramSelect")?.value || "standard"
    };
    return {};
  }

  startMode(modeId) {
    this.stopActiveGame();
    this.tournament = null;
    this.arcadeChallenge = null;
    const mode = MODE_METADATA.find(item => item.id === modeId);
    if (!mode || !this.gameClasses[modeId]) return;

    this.pendingLessonId = null;
    this.pendingGameId = modeId;
    const rows = this.getArcadeGameRows().filter(row => row.modeId === modeId);
    const bestScore = rows.length ? Math.max(...rows.map(row => Number(row.score) || 0)) : 0;
    const bestWpm = rows.length ? Math.max(...rows.map(row => Number(row.wpm) || 0)) : 0;
    const wins = rows.filter(row => row.success === true).length;
    const personality = GAME_PERSONALITY[modeId];

    this.ui.hostEyebrow.textContent = "A word from Blake • Arcade Briefing";
    this.ui.hostTitle.textContent = mode.title;
    this.ui.hostMessage.textContent = personality?.briefing || `Type accurately, stay ahead of the mechanic, and remember that I remain the benchmark. This is not arrogance if the leaderboard confirms it.`;
    this.ui.hostTargets.innerHTML = `
      <span>${DIFFICULTY_CONFIG[this.settings.difficulty]?.label ?? this.settings.difficulty} difficulty</span>
      <span>${mode.tags.join(" • ")}</span>
      <span>${rows.length ? `${rows.length} prior ${rows.length === 1 ? "run" : "runs"}` : "First run"}</span>
      ${bestScore ? `<span>Best score ${bestScore}</span>` : ""}
      ${bestWpm ? `<span>Best ${bestWpm} WPM</span>` : ""}
      ${wins ? `<span>${wins} successful ${wins === 1 ? "finish" : "finishes"}</span>` : ""}
    `;
    this.renderGameOptions(modeId);
    this.ui.hostComplianceMessage.textContent = personality?.compliance || "Typing-game performance is unrelated to access rights, records handling, or workstation-security requirements.";
    document.getElementById("hostStartButton").textContent = "Start Game";
    if (!this.ui.hostDialog.open) this.ui.hostDialog.showModal();
    requestAnimationFrame(() => document.getElementById("hostStartButton")?.focus());
  }

  beginMode(modeId) {
    const mode = MODE_METADATA.find(item => item.id === modeId);
    const GameClass = this.gameClasses[modeId];
    if (!mode || !GameClass) return;

    const gameOptions = { ...(this.pendingGameOptions || {}) };
    this.pendingGameId = null;
    this.pendingGameOptions = {};
    this.activityKind = "game";
    this.activeMode = mode;
    this.lastActivity = { kind: "game", id: modeId };
    const tournamentRound = this.tournament?.active ? this.tournament.currentIndex + 1 : null;
    const tournamentTotal = this.tournament?.active ? this.tournament.rounds.length : null;
    this.ui.activeGameTitle.textContent = this.tournament?.active ? `Tournament ${tournamentRound}/${tournamentTotal} — ${mode.title}` : this.arcadeChallenge?.active ? `Random Challenge — ${mode.title}` : mode.title;
    this.ui.activeGameSubtitle.textContent = this.tournament?.active
      ? `${mode.subtitle} • HyperSoft Cup Points are being tracked for this round.`
      : this.arcadeChallenge?.active
        ? `${mode.subtitle} • Blake randomized the mode options; no substitutions.`
        : mode.subtitle;
    this.ui.backButton.textContent = this.tournament?.active ? "← Quit tournament" : "← Back to games";
    this.ui.guidedLinkButton.textContent = "Guided Link: mode notes";
    this.ui.stage.innerHTML = "";
    this.showScreen("game");

    this.engine.startGame({
      difficulty: this.settings.difficulty,
      wordList: this.settings.wordList,
      modeId
    });

    this.activeGame = new GameClass({
      stage: this.ui.stage,
      engine: this.engine,
      settings: this.settings,
      finish: result => this.finishActivity(result),
      mode,
      gameOptions
    });
    this.activeGame.start();
    this.startHudTimer();
    this.ui.stage.focus();
  }

  startHudTimer() {
    this.hudTimerId = window.setInterval(() => {
      if (this.engine.running) {
        const timerMs = this.activeGame?.getHUDTime?.() ?? this.engine.getElapsedMs();
        this.engine.updateHUD({ timerMs });
      }
    }, 200);
  }

  finishActivity(activityResult = {}) {
    if (this.activeGame) {
      try { this.activeGame.stop(); }
      catch (error) { console.error("Activity cleanup error:", error); }
      this.activeGame = null;
    }

    const baseResult = this.engine.stopGame();
    window.clearInterval(this.hudTimerId);
    this.hudTimerId = null;
    const result = {
      ...baseResult,
      ...activityResult,
      score: Math.round(activityResult.score ?? baseResult.score)
    };
    if (this.activityKind === "lesson") {
      result.lessonComparison = this.compareLessonResult(result, this.activeMode);
      if (result.keyStats) {
        this.mergeKeyStats(result.keyStats);
        this.appendKeyHistory(result.keyStats, this.activeMode?.id);
      }
      if (result.pairStats) this.mergePairStats(result.pairStats);
      this.renderWeakKeySummary();
    }

    if (this.activityKind === "game" && this.arcadeChallenge?.active && this.arcadeChallenge.modeId === this.activeMode?.id) {
      result.challengeType = "random";
      result.challengeId = this.arcadeChallenge.id;
    }

    if (this.activityKind === "game" && this.tournament?.active) {
      const cupPoints = this.calculateCupPoints(result);
      result.cupPoints = cupPoints;
      result.tournamentId = this.tournament.id;
      result.tournamentFormat = this.tournament.format;
      result.tournamentRound = this.tournament.currentIndex + 1;
      this.tournament.results.push({
        modeId: this.activeMode?.id,
        modeTitle: this.activeMode?.title,
        score: Number(result.score) || 0,
        wpm: Number(result.wpm) || 0,
        accuracy: Number(result.accuracy) || 0,
        durationMs: Number(result.durationMs) || 0,
        success: result.success !== false,
        cupPoints,
        variant: result.variant || null
      });
    }

    this.saveScore(result);
    const newlyUnlocked = this.syncAchievements({ notify: true });
    this.renderScoreboard();
    this.renderAchievements();

    if (this.activityKind === "game" && this.tournament?.active) {
      const isLast = this.tournament.currentIndex >= this.tournament.rounds.length - 1;
      if (isLast) {
        this.completeTournament(newlyUnlocked);
        return;
      }
      this.tournament.awaitingContinue = true;
      const cupTotal = this.tournament.results.reduce((sum, row) => sum + (Number(row.cupPoints) || 0), 0);
      const nextMode = MODE_METADATA.find(item => item.id === this.tournament.rounds[this.tournament.currentIndex + 1]);
      result.extraStats = [...(result.extraStats ?? []), ["Cup points", result.cupPoints], ["Cup total", cupTotal.toLocaleString()], ["Tournament", `Round ${this.tournament.currentIndex + 1}/${this.tournament.rounds.length}`], ["Next", nextMode?.title ?? "Final results"]];
      result.newAchievements = newlyUnlocked;
      this.showResult(result);
      return;
    }

    if (this.activityKind === "game" && this.arcadeChallenge?.active) this.arcadeChallenge.completed = true;
    result.newAchievements = newlyUnlocked;
    this.showResult(result);
  }

  stopActiveGame() {
    window.clearInterval(this.hudTimerId);
    this.hudTimerId = null;
    if (this.activeGame) {
      try { this.activeGame.stop(); }
      catch (error) { console.error("Activity cleanup error:", error); }
    }
    this.activeGame = null;
    if (this.engine.running) this.engine.stopGame();
  }

  exitTo(screenName) {
    this.cancelLoadingInterlude();
    if (this.tournament?.active && this.activeGame && screenName !== "game") {
      if (!confirm("Quit the current Typing Tournament? Completed rounds remain in arcade history, but the unfinished cup will not be recorded.")) return;
      this.tournament = null;
    }
    if (this.arcadeChallenge?.active && this.activeGame && screenName !== "game") this.arcadeChallenge = null;
    this.stopActiveGame();
    if (this.ui.resultDialog.open) this.ui.resultDialog.close();
    if (this.ui.guideDialog.open) this.ui.guideDialog.close();
    this.showScreen(screenName);
  }

  showScreen(name) {
    const map = {
      title: this.ui.titleScreen,
      office: this.ui.officeScreen,
      profiles: this.ui.profilesScreen,
      lessons: this.ui.lessonsScreen,
      menu: this.ui.menuScreen,
      progress: this.ui.progressScreen,
      achievements: this.ui.achievementsScreen,
      reports: this.ui.reportsScreen,
      game: this.ui.gameScreen,
      scoreboard: this.ui.scoreboardScreen,
      settings: this.ui.settingsScreen
    };
    this.ui.screens.forEach(screen => screen.classList.remove("is-active"));
    map[name]?.classList.add("is-active");
    if (name === "office") this.renderOffice();
    if (name === "profiles") this.renderProfiles();
    if (name === "progress") this.renderProgress();
    if (name === "achievements") this.renderAchievements();
    if (name === "reports") this.renderReports();
    if (name === "scoreboard") this.renderScoreboard();
    if (name === "settings") this.renderSettings();
    if (name === "lessons") this.renderLessons();
    if (name === "menu") this.renderMenu();
    if (name === "title") { this.updateProfileChrome(); this.rotateBlakeQuote(); this.rotateHomePersonality(); }
  }

  openGuide(id) {
    const item = this.activityKind === "lesson"
      ? this.getLessonDefinition(id)
      : MODE_METADATA.find(entry => entry.id === id);
    if (!item) return;
    this.ui.guideTitle.textContent = item.title;
    this.ui.guideBody.innerHTML = `
      <p>${item.subtitle}</p>
      <ul class="guide-list">${item.guide.map(line => `<li>${line}</li>`).join("")}</ul>
      ${this.activityKind === "lesson"
        ? `<p><strong>Training target:</strong> ${item.targetWpm} WPM at ${item.targetAccuracy}% accuracy. Completing the lesson is always allowed even if the target is missed.</p>`
        : `<p><strong>Guided Link:</strong> use these notes as the quick-reference rules for the selected typing game.</p>`}
    `;
    this.ui.guideDialog.showModal();
  }

  renderHUD({ wpm, accuracy, timerMs, score }) {
    this.ui.hudWpm.textContent = String(wpm);
    this.ui.hudAccuracy.textContent = `${accuracy}%`;
    this.ui.hudTimer.textContent = this.formatTime(timerMs);
    this.ui.hudScore.textContent = String(score);
  }

  showResult(result) {
    const success = result.success !== false;
    const tournamentRound = this.tournament?.active && result.tournamentId === this.tournament.id;
    const tournamentSummary = this.activityKind === "tournament";
    const randomChallenge = result.challengeType === "random";
    if (tournamentRound) {
      this.ui.resultTitle.textContent = `Tournament Round ${result.tournamentRound}/${this.tournament.rounds.length} ${success ? "Complete" : "Ended"}`;
    } else if (tournamentSummary) {
      this.ui.resultTitle.textContent = result.title ?? "Typing Tournament Complete";
    } else if (randomChallenge) {
      this.ui.resultTitle.textContent = result.title ?? (success ? "Random Challenge Complete" : "Random Challenge Ended");
    } else {
      this.ui.resultTitle.textContent = result.title ?? (success ? "Session complete" : "Session ended");
    }

    this.ui.resultMessage.textContent = result.message ??
      (tournamentRound
        ? `${this.activeMode?.title ?? "Arcade round"} is recorded. ${Number(result.cupPoints) || 0} Cup Points have been added to the tournament total.`
        : randomChallenge
          ? (success ? "Blake's randomized assignment is complete. He is pretending the lack of preparation was a pedagogical strategy." : "The randomized assignment won this round. Blake has already selected 'unpredictable conditions' as the official explanation.")
          : success
            ? "Blake nods approvingly, then remembers he left a folder in the break room."
            : "Blake recommends another attempt and absolutely no discussion of the incident report.");

    this.ui.resultHostPanel.hidden = false;
    this.ui.resultHostMessage.textContent = this.activityKind === "lesson"
      ? this.getBlakeResultComment(result)
      : tournamentSummary
        ? this.getBlakeTournamentResultComment(result)
        : this.getBlakeGameResultComment(result);
    this.ui.resultComplianceMessage.textContent = tournamentSummary
      ? "Tournament medals and Cup Points are local training-game metrics. They do not represent certification, job classification, or authority to override ordinary workplace controls."
      : this.getComplianceResultComment(result);

    const stats = [
      [tournamentSummary ? "Cup Points" : "Score", result.score],
      ["WPM", result.wpm],
      ["Accuracy", `${result.accuracy}%`],
      ["Time", this.formatTime(result.durationMs)]
    ];
    if (tournamentRound && result.cupPoints != null) stats.push(["Cup Points", result.cupPoints]);
    if (randomChallenge) stats.push(["Challenge", "Randomized"]);
    if (result.wordsCompleted != null) stats.push(["Tokens", result.wordsCompleted]);
    if (result.targetStatus) stats.push(["Target", result.targetStatus]);
    if (result.weakKeys) stats.push(["Practice next", result.weakKeys]);
    if (result.variant) stats.push(["Variant", result.variant]);
    if (result.lessonComparison?.newBestWpm) stats.push(["Record", "Best WPM"]);
    if (Array.isArray(result.extraStats)) {
      result.extraStats.forEach(row => {
        if (Array.isArray(row) && row.length >= 2) stats.push([row[0], row[1]]);
      });
    }

    this.ui.resultStats.innerHTML = stats.map(([label, value]) => `
      <div class="result-stat"><span>${this.escapeHtml(String(label))}</span><strong>${this.escapeHtml(String(value))}</strong></div>
    `).join("");

    const unlocks = Array.isArray(result.newAchievements) ? result.newAchievements : [];
    this.ui.achievementUnlockPanel.hidden = !unlocks.length;
    this.ui.achievementUnlockList.innerHTML = unlocks.map(item => `
      <div class="achievement-unlock-item">
        <div class="achievement-badge-icon">${this.escapeHtml(item.icon)}</div>
        <div><strong>${this.escapeHtml(item.title)}</strong><span>${this.escapeHtml(item.description)}</span></div>
        <b>+${item.points}</b>
      </div>`).join("");

    const replayButton = document.getElementById("playAgainButton");
    if (tournamentRound) replayButton.textContent = "Continue Tournament";
    else if (tournamentSummary) replayButton.textContent = "New Tournament";
    else if (randomChallenge) replayButton.textContent = "New Random Challenge";
    else replayButton.textContent = "Play Again";
    this.ui.resultHomeButton.textContent = this.activityKind === "lesson" ? "Lessons" : "Arcade";
    const reportsButton = document.getElementById("resultReportsButton");
    if (reportsButton) reportsButton.hidden = Boolean(tournamentRound);
    if (!this.ui.resultDialog.open) this.ui.resultDialog.showModal();
  }

  compareLessonResult(result, lesson) {
    if (!lesson) return null;
    const prior = this.getLessonScores(lesson.id);
    const previous = prior.at(-1) ?? null;
    const bestWpm = prior.length ? Math.max(...prior.map(row => Number(row.wpm) || 0)) : 0;
    const bestAccuracy = prior.length ? Math.max(...prior.map(row => Number(row.accuracy) || 0)) : 0;
    return {
      previousWpm: previous?.wpm ?? null,
      previousAccuracy: previous?.accuracy ?? null,
      deltaWpm: previous ? (Number(result.wpm) || 0) - (Number(previous.wpm) || 0) : null,
      deltaAccuracy: previous ? (Number(result.accuracy) || 0) - (Number(previous.accuracy) || 0) : null,
      newBestWpm: !prior.length || (Number(result.wpm) || 0) > bestWpm,
      newBestAccuracy: !prior.length || (Number(result.accuracy) || 0) > bestAccuracy
    };
  }

  getBlakeResultComment(result) {
    const comparison = result.lessonComparison ?? {};
    const lesson = this.activeMode;
    if (lesson?.isSmartPractice && result.targetStatus === "Met") {
      return `${lesson.title} target met at ${result.wpm} WPM and ${result.accuracy}% accuracy. That's useful targeted practice: the generator picked the movement problem, and you made it less interesting. HyperSoft insists this is a compliment.`;
    }
    if (result.accuracy === 100) {
      return `One hundred percent accuracy. Fine. That's excellent. I still type faster, obviously, but HyperSoft says I'm supposed to acknowledge measurable achievement.`;
    }
    if (result.targetStatus === "Met" && comparison.newBestWpm) {
      return `${result.wpm} WPM and a new personal speed record. You're getting uncomfortably competent. Keep the accuracy at ${result.accuracy}% or better and we may need to revisit my job security narrative.`;
    }
    if (result.targetStatus === "Met") {
      return `Target met: ${result.wpm} WPM at ${result.accuracy}% accuracy. Repeatable performance is what matters. Apparently that's also true of locking your computer every single time, which seems excessive.`;
    }
    if (comparison.deltaWpm != null && comparison.deltaWpm >= 3 && result.accuracy >= (lesson?.targetAccuracy ?? 93) - 2) {
      return `You gained ${Math.round(comparison.deltaWpm)} WPM over your last attempt without giving away much accuracy. That's real improvement. Keep that rhythm instead of forcing the speed.`;
    }
    if (result.accuracy < (lesson?.targetAccuracy ?? 93) - 5) {
      return `You're moving, but ${result.accuracy}% accuracy is costing you too many corrections. Back the speed off slightly and make the problem keys boring before you accelerate again.`;
    }
    if (result.weakKeys && result.weakKeys !== "None") {
      return `Completed. Your next useful targets are ${result.weakKeys}. Weak-Key Workshop will remember them. I object to software remembering errors on principle, but it does appear to work.`;
    }
    return `Lesson complete. The target isn't a gate; it's a reference point. Run it again when you want a cleaner rhythm, or move on and let the progress screen tell you where the gaps are.`;
  }

  getLessonComplianceNote(lesson) {
    if (lesson.source === "numbers") return "Accurate numeric entry matters in real records and transactions. Verify values before submitting them.";
    if (lesson.source === "punctuation") return "Clear punctuation helps make professional records understandable. It does not make Blake's incident notes less concerning.";
    if (lesson.source === "adaptive") return "Adaptive statistics stay inside the active local learner profile unless you explicitly export a backup.";
    if (lesson.source === "smart") return "Smart Practice analyzes only the vocabulary and typing statistics stored locally in this application. It does not send learner performance anywhere.";
    return "Typing speed is a training metric. It does not replace privacy, security, access-control, or records-handling requirements.";
  }

  getBlakeGameResultComment(result) {
    const personality = GAME_PERSONALITY[this.activeMode?.id] ?? {};
    const success = result.success !== false;
    const base = success ? personality.success : personality.failure;
    const wpm = Number(result.wpm) || 0;
    const accuracy = Number(result.accuracy) || 0;

    if (success && accuracy === 100) return `${base || "Session complete."} Perfect accuracy. I dislike how little room that leaves me for constructive criticism.`;
    if (success && wpm >= 90 && accuracy >= 97) return `${base || "Session complete."} ${wpm} WPM at ${accuracy}% accuracy is serious typing. Management would like me to describe you as "promising" instead of "a developing threat."`;
    if (success && wpm >= 60 && accuracy >= 95) return `${base || "Session complete."} Strong pace, clean input. That's the combination that actually matters, despite everything I have said about raw speed.`;
    if (accuracy < 80) return `${base || (success ? "You finished." : "The run ended.")} Your ${accuracy}% accuracy is creating too much cleanup. Take a little speed off and stop donating keystrokes to the error counter.`;
    if (!success && accuracy >= 95) return `${base || "The run ended."} The accuracy was good; the mechanic beat your pace, not your keyboard control. That's a much easier problem to fix.`;
    return base || (success
      ? `Run complete. Solid work. I remain faster in my own official recollection of events.`
      : `Run ended. Good thing HyperSoft put the retry button somewhere I can find it.`);
  }

  getComplianceResultComment() {
    const modeNote = this.activityKind === "game" ? GAME_PERSONALITY[this.activeMode?.id]?.compliance : null;
    if (modeNote && Math.random() < 0.45) return modeNote;
    return RESULT_COMPLIANCE_NOTES[Math.floor(Math.random() * RESULT_COMPLIANCE_NOTES.length)];
  }

  launchWithLoading(title, callback) {
    this.cancelLoadingInterlude();
    if (!this.ui.loadingOverlay) { callback(); return; }
    const tip = BLAKE_PRODUCTIVITY_TIPS[Math.floor(Math.random() * BLAKE_PRODUCTIVITY_TIPS.length)];
    this.ui.loadingTitle.textContent = `Preparing ${title}`;
    this.ui.loadingMessage.textContent = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
    this.ui.loadingTip.textContent = tip.tip;
    this.ui.loadingCompliance.textContent = tip.compliance;
    this.ui.loadingOverlay.hidden = false;
    this.loadingTimeoutId = window.setTimeout(() => {
      this.ui.loadingOverlay.hidden = true;
      this.loadingTimeoutId = null;
      callback();
    }, 760 + Math.floor(Math.random() * 240));
  }

  cancelLoadingInterlude() {
    if (this.loadingTimeoutId) window.clearTimeout(this.loadingTimeoutId);
    this.loadingTimeoutId = null;
    if (this.ui.loadingOverlay) this.ui.loadingOverlay.hidden = true;
  }

  getNextIndex(length, current) {
    if (length <= 1) return 0;
    let next = Math.floor(Math.random() * length);
    if (next === current) next = (next + 1 + Math.floor(Math.random() * (length - 1))) % length;
    return next;
  }

  renderHomeTip() {
    if (!this.ui.homeBlakeTip) return;
    this.currentHomeTipIndex = this.getNextIndex(BLAKE_PRODUCTIVITY_TIPS.length, this.currentHomeTipIndex);
    const item = BLAKE_PRODUCTIVITY_TIPS[this.currentHomeTipIndex];
    this.ui.homeBlakeTip.textContent = `“${item.tip}”`;
    this.ui.homeComplianceReply.textContent = item.compliance;
  }

  renderHomeNotice() {
    if (!this.ui.homeNoticeTitle) return;
    this.currentHomeNoticeIndex = this.getNextIndex(HYPERSOFT_NOTICES.length, this.currentHomeNoticeIndex);
    const item = HYPERSOFT_NOTICES[this.currentHomeNoticeIndex];
    this.ui.homeNoticeTitle.textContent = item.title;
    this.ui.homeNoticeBody.textContent = item.body;
    this.ui.homeNoticeDepartment.textContent = `— ${item.department}`;
  }

  rotateHomePersonality() {
    this.renderHomeTip();
    this.renderHomeNotice();
  }

  renderOffice() {
    if (!this.ui.officeContent) return;
    const profile = this.getActiveProfile();
    const unlockedAchievements = Object.keys(this.achievements ?? {}).length;
    const unlockedQuoteCount = Math.min(BLAKE_QUOTES.length, 5 + Math.floor(unlockedAchievements / 3));
    const tip = BLAKE_PRODUCTIVITY_TIPS[Math.floor(Math.random() * BLAKE_PRODUCTIVITY_TIPS.length)];
    const shuffledNotices = [...HYPERSOFT_NOTICES].sort(() => Math.random() - 0.5).slice(0, 6);
    const shuffledIncidents = [...BLAKE_INCIDENTS].sort(() => Math.random() - 0.5).slice(0, 6);

    const quoteHtml = BLAKE_QUOTES.map((quote, index) => index < unlockedQuoteCount
      ? `<div class="quote-archive-item"><span>${String(index + 1).padStart(2, "0")}</span><p>${this.escapeHtml(quote)}</p></div>`
      : `<div class="quote-archive-item locked"><span>${String(index + 1).padStart(2, "0")}</span><p>Locked — earn more achievements to recover this Blake quote.</p></div>`).join("");

    this.ui.officeContent.innerHTML = `
      <section class="office-hero-card">
        <div class="office-portrait"><img src="${BLAKE_ASSET}" alt="Blake" /></div>
        <div>
          <span class="eyebrow">Employee spotlight</span>
          <h3>Blake Breacher, Typing Champion</h3>
          <p>HyperSoft's official typing instructor, unofficial efficiency consultant, and the reason every productivity tip in this application now requires a Compliance rebuttal.</p>
          <div class="office-stat-row">
            <span><strong>${this.escapeHtml(profile?.name ?? "Guest")}</strong> current learner</span>
            <span><strong>${unlockedAchievements}</strong> achievements</span>
            <span><strong>${unlockedQuoteCount}/${BLAKE_QUOTES.length}</strong> quotes recovered</span>
          </div>
        </div>
      </section>

      <div class="office-grid">
        <section class="office-panel featured-tip-panel">
          <div class="office-panel-heading"><span>Blake's Productivity Tip</span><small>Unofficial</small></div>
          <blockquote>“${this.escapeHtml(tip.tip)}”</blockquote>
          <div class="compliance-rebuttal"><strong>HyperSoft Compliance:</strong><span>${this.escapeHtml(tip.compliance)}</span></div>
        </section>

        <section class="office-panel notice-board-panel">
          <div class="office-panel-heading"><span>Corporate Bulletin Board</span><small>Current notices</small></div>
          <div class="notice-stack">${shuffledNotices.map(item => `
            <article class="corporate-notice"><small>${this.escapeHtml(item.department)}</small><strong>${this.escapeHtml(item.title)}</strong><p>${this.escapeHtml(item.body)}</p></article>`).join("")}</div>
        </section>

        <section class="office-panel incident-panel">
          <div class="office-panel-heading"><span>Selected Incident File</span><small>Fictional training archive</small></div>
          <div class="incident-stack">${shuffledIncidents.map(item => `
            <article class="incident-item"><span>${this.escapeHtml(item.code)}</span><div><strong>${this.escapeHtml(item.title)}</strong><p>${this.escapeHtml(item.summary)}</p><small>${this.escapeHtml(item.disposition)}</small></div></article>`).join("")}</div>
        </section>
      </div>

      <section class="office-panel quote-archive-panel">
        <div class="office-panel-heading"><span>Blake Quote Archive</span><small>${unlockedQuoteCount} of ${BLAKE_QUOTES.length} unlocked • earn achievements to recover more</small></div>
        <div class="quote-archive-grid">${quoteHtml}</div>
      </section>
    `;
  }

  saveScore(result) {
    this.scores.push({
      activityType: this.activeMode?.isSmartPractice ? "practice" : this.activityKind,
      modeId: this.activeMode?.id ?? this.lastActivity?.id,
      modeTitle: this.activeMode?.title ?? "Unknown Activity",
      difficulty: this.settings.difficulty,
      score: result.score,
      wpm: result.wpm,
      accuracy: result.accuracy,
      durationMs: result.durationMs ?? null,
      wordsCompleted: result.wordsCompleted ?? null,
      targetStatus: result.targetStatus ?? null,
      weakKeys: result.weakKeys ?? null,
      variant: result.variant ?? null,
      success: result.success !== false,
      challengeType: result.challengeType ?? null,
      challengeId: result.challengeId ?? null,
      cupPoints: result.cupPoints ?? null,
      tournamentId: result.tournamentId ?? null,
      tournamentRound: result.tournamentRound ?? null,
      tournamentFormat: result.tournamentFormat ?? null,
      tournamentMedal: result.tournamentMedal ?? null,
      tournamentWins: result.tournamentWins ?? null,
      tournamentRounds: result.tournamentRounds ?? null,
      timestamp: Date.now()
    });
    this.scores = this.scores
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
      .slice(-300);
    this.persistActiveProfile();
    this.updateProfileChrome();
  }

  loadAchievements() {
    const profile = this.getActiveProfile();
    const value = profile?.data?.achievements;
    return value && typeof value === "object" && !Array.isArray(value) ? this.cloneData(value) : {};
  }

  getAchievementMetrics() {
    const rows = this.scores ?? [];
    const lessonRows = rows.filter(row => row.activityType === "lesson");
    const gameRows = this.getArcadeGameRows();
    const tournamentRows = this.getTournamentRows();
    const sessionRows = rows.filter(row => ["lesson", "practice"].includes(row.activityType) || this.isArcadeGameRow(row));
    const lessonTargets = new Set(lessonRows.filter(row => row.targetStatus === "Met").map(row => row.modeId));
    const lessonsPlayed = new Set(lessonRows.map(row => row.modeId));
    const gamesPlayed = new Set(gameRows.map(row => row.modeId));
    const successfulGameRows = gameRows.filter(row => row.success === true);
    const successfulGames = new Set(successfulGameRows.map(row => row.modeId));
    const qualifiedRows = sessionRows.filter(row => (Number(row.durationMs) || 0) >= 15000 || (Number(row.wordsCompleted) || 0) >= 10);
    const perfectRows = qualifiedRows.filter(row => (Number(row.accuracy) || 0) >= 100);
    const streaks = this.getArcadeStreakMetrics(gameRows);
    const challengeRows = gameRows.filter(row => row.challengeType === "random");
    const tournamentSuccessRows = tournamentRows.filter(row => row.success === true);
    return {
      rows, sessionRows, lessonRows, gameRows, tournamentRows, lessonTargets, lessonsPlayed, gamesPlayed, successfulGames,
      sessions: sessionRows.length,
      lessonSessions: lessonRows.length,
      gameSessions: gameRows.length,
      gameWins: successfulGameRows.length,
      uniqueGameWins: successfulGames.size,
      gameWinStreak: streaks.best,
      challengeWins: challengeRows.filter(row => row.success === true).length,
      challengeStreak: streaks.challengeBest,
      tournamentSessions: tournamentRows.length,
      tournamentSuccesses: tournamentSuccessRows.length,
      tournamentFormatsWon: new Set(tournamentSuccessRows.map(row => row.tournamentFormat)),
      tournamentMedals: new Set(tournamentRows.map(row => row.tournamentMedal).filter(Boolean)),
      bestWpm: sessionRows.length ? Math.max(...sessionRows.map(row => Number(row.wpm) || 0)) : 0,
      practiceMinutes: sessionRows.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0) / 60000,
      bestQualifiedAccuracy: qualifiedRows.length ? Math.max(...qualifiedRows.map(row => Number(row.accuracy) || 0)) : 0,
      perfectSessions: perfectRows.length,
      cleanFastWins: gameRows.filter(row => row.success === true && (Number(row.wpm) || 0) >= 60 && (Number(row.accuracy) || 0) >= 95).length
    };
  }

  getAchievementProgress(item, metrics = this.getAchievementMetrics()) {
    const c = item.criterion ?? {};
    let current = 0;
    let target = Number(c.value) || 1;
    switch (c.type) {
      case "bestWpm": current = metrics.bestWpm; break;
      case "qualifiedAccuracy": current = metrics.bestQualifiedAccuracy; break;
      case "perfectSessions": current = metrics.perfectSessions; break;
      case "sessions": current = metrics.sessions; break;
      case "practiceMinutes": current = metrics.practiceMinutes; break;
      case "lessonSessions": current = metrics.lessonSessions; break;
      case "gameSessions": current = metrics.gameSessions; break;
      case "lessonTargets": current = metrics.lessonTargets.size; break;
      case "uniqueGames": current = metrics.gamesPlayed.size; break;
      case "gameWins": current = metrics.gameWins; break;
      case "uniqueGameWins": current = metrics.uniqueGameWins; break;
      case "gameWinStreak": current = metrics.gameWinStreak; break;
      case "challengeWins": current = metrics.challengeWins; break;
      case "challengeStreak": current = metrics.challengeStreak; break;
      case "tournamentSessions": current = metrics.tournamentSessions; break;
      case "tournamentSuccesses": current = metrics.tournamentSuccesses; break;
      case "tournamentFormatSuccess": current = metrics.tournamentFormatsWon.has(c.id) ? 1 : 0; target = 1; break;
      case "tournamentMedal": current = metrics.tournamentMedals.has(c.id) ? 1 : 0; target = 1; break;
      case "gameWinQuality": current = metrics.gameRows.some(row => row.success === true && (Number(row.wpm) || 0) >= (Number(c.wpm) || 0) && (Number(row.accuracy) || 0) >= (Number(c.accuracy) || 0)) ? 1 : 0; target = 1; break;
      case "lessonTarget": current = metrics.lessonTargets.has(c.id) ? 1 : 0; target = 1; break;
      case "lessonPlayed": current = metrics.lessonsPlayed.has(c.id) ? 1 : 0; target = 1; break;
      case "gamePlayed": current = metrics.gamesPlayed.has(c.id) ? 1 : 0; target = 1; break;
      case "gameSuccess": current = metrics.successfulGames.has(c.id) ? 1 : 0; target = 1; break;
      case "lessonSetTargets": {
        const ids = c.ids ?? [];
        current = ids.filter(id => metrics.lessonTargets.has(id)).length;
        target = ids.length || 1;
        break;
      }
      default: current = 0; target = 1;
    }
    return { current, target, complete: current >= target, ratio: Math.max(0, Math.min(1, target ? current / target : 0)) };
  }

  syncAchievements({ notify = false } = {}) {
    const metrics = this.getAchievementMetrics();
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach(item => {
      if (this.achievements[item.id]) return;
      const progress = this.getAchievementProgress(item, metrics);
      if (!progress.complete) return;
      this.achievements[item.id] = { unlockedAt: this.getAchievementEarnedAt(item) ?? Date.now(), version: "0.12" };
      if (notify) newlyUnlocked.push(item);
    });
    if (newlyUnlocked.length || Object.keys(this.achievements).length) this.persistActiveProfile();
    return newlyUnlocked;
  }

  getAchievementEarnedAt(item) {
    const rows = [...(this.scores ?? [])].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    const sessionRows = rows.filter(row => ["lesson", "practice"].includes(row.activityType) || this.isArcadeGameRow(row));
    const gameRows = rows.filter(row => this.isArcadeGameRow(row));
    const tournamentRows = rows.filter(row => row.activityType === "tournament");
    const c = item.criterion ?? {};
    const qualified = row => (Number(row.durationMs) || 0) >= 15000 || (Number(row.wordsCompleted) || 0) >= 10;
    const ts = row => Number(row?.timestamp) || null;
    const streakTimestamp = (sourceRows, target, predicate = row => row.success === true) => {
      let streak = 0;
      for (const row of sourceRows) {
        streak = predicate(row) ? streak + 1 : 0;
        if (streak >= target) return ts(row);
      }
      return null;
    };
    switch (c.type) {
      case "bestWpm": return ts(sessionRows.find(row => (Number(row.wpm) || 0) >= c.value));
      case "qualifiedAccuracy": return ts(sessionRows.find(row => qualified(row) && (Number(row.accuracy) || 0) >= c.value));
      case "perfectSessions": return ts(sessionRows.filter(row => qualified(row) && (Number(row.accuracy) || 0) >= 100)[c.value - 1]);
      case "sessions": return ts(sessionRows[c.value - 1]);
      case "practiceMinutes": {
        let total = 0;
        for (const row of sessionRows) { total += Number(row.durationMs) || 0; if (total / 60000 >= c.value) return ts(row); }
        return null;
      }
      case "lessonSessions": return ts(rows.filter(row => row.activityType === "lesson")[c.value - 1]);
      case "gameSessions": return ts(gameRows[c.value - 1]);
      case "gameWins": return ts(gameRows.filter(row => row.success === true)[c.value - 1]);
      case "uniqueGameWins": {
        const seen = new Set();
        for (const row of gameRows) {
          if (row.success === true) seen.add(row.modeId);
          if (seen.size >= c.value) return ts(row);
        }
        return null;
      }
      case "gameWinStreak": return streakTimestamp(gameRows, Number(c.value) || 1);
      case "challengeWins": return ts(gameRows.filter(row => row.challengeType === "random" && row.success === true)[c.value - 1]);
      case "challengeStreak": return streakTimestamp(gameRows.filter(row => row.challengeType === "random"), Number(c.value) || 1);
      case "tournamentSessions": return ts(tournamentRows[c.value - 1]);
      case "tournamentSuccesses": return ts(tournamentRows.filter(row => row.success === true)[c.value - 1]);
      case "tournamentFormatSuccess": return ts(tournamentRows.find(row => row.success === true && row.tournamentFormat === c.id));
      case "tournamentMedal": return ts(tournamentRows.find(row => row.tournamentMedal === c.id));
      case "gameWinQuality": return ts(gameRows.find(row => row.success === true && (Number(row.wpm) || 0) >= (Number(c.wpm) || 0) && (Number(row.accuracy) || 0) >= (Number(c.accuracy) || 0)));
      case "lessonTarget": return ts(rows.find(row => row.activityType === "lesson" && row.modeId === c.id && row.targetStatus === "Met"));
      case "lessonPlayed": return ts(rows.find(row => row.activityType === "lesson" && row.modeId === c.id));
      case "gamePlayed": return ts(gameRows.find(row => row.modeId === c.id));
      case "gameSuccess": return ts(gameRows.find(row => row.modeId === c.id && row.success === true));
      case "lessonSetTargets": {
        const firsts = (c.ids ?? []).map(id => rows.find(row => row.activityType === "lesson" && row.modeId === id && row.targetStatus === "Met")).filter(Boolean);
        return firsts.length === (c.ids ?? []).length ? Math.max(...firsts.map(row => Number(row.timestamp) || 0)) || null : null;
      }
      case "lessonTargets": {
        const seen = new Set();
        for (const row of rows) {
          if (row.activityType === "lesson" && row.targetStatus === "Met") seen.add(row.modeId);
          if (seen.size >= c.value) return ts(row);
        }
        return null;
      }
      case "uniqueGames": {
        const seen = new Set();
        for (const row of gameRows) {
          seen.add(row.modeId);
          if (seen.size >= c.value) return ts(row);
        }
        return null;
      }
      default: return null;
    }
  }

  renderAchievements() {
    if (!this.ui.achievementsContent) return;
    const metrics = this.getAchievementMetrics();
    const unlocked = ACHIEVEMENTS.filter(item => this.achievements[item.id]);
    const totalPoints = unlocked.reduce((sum, item) => sum + (item.points || 0), 0);
    const availablePoints = ACHIEVEMENTS.reduce((sum, item) => sum + (item.points || 0), 0);
    const percent = ACHIEVEMENTS.length ? Math.round((unlocked.length / ACHIEVEMENTS.length) * 100) : 0;
    const profile = this.getActiveProfile();
    const next = ACHIEVEMENTS
      .filter(item => !this.achievements[item.id])
      .map(item => ({ item, progress: this.getAchievementProgress(item, metrics) }))
      .sort((a, b) => b.progress.ratio - a.progress.ratio || a.progress.target - b.progress.target)
      .slice(0, 3);

    const categoryHtml = ACHIEVEMENT_CATEGORIES.map(category => {
      const items = ACHIEVEMENTS.filter(item => item.category === category.id);
      const categoryUnlocked = items.filter(item => this.achievements[item.id]).length;
      return `<section class="achievement-category">
        <div class="achievement-category-heading"><div><h3>${this.escapeHtml(category.label)}</h3><p>${this.escapeHtml(category.description)}</p></div><span>${categoryUnlocked}/${items.length}</span></div>
        <div class="achievement-grid">${items.map(item => this.renderAchievementCard(item, metrics)).join("")}</div>
      </section>`;
    }).join("");

    this.ui.achievementsContent.innerHTML = `
      <div class="blake-progress-note achievement-blake-note">
        <img src="${BLAKE_ASSET}" alt="Blake" />
        <div><strong>Blake's recognition cabinet</strong><p>${this.getAchievementBlakeComment(unlocked.length, ACHIEVEMENTS.length, totalPoints)}</p></div>
      </div>
      <div class="achievement-summary-grid">
        <div class="progress-stat-card"><span>Profile</span><strong>${this.escapeHtml(profile?.name ?? "Player")}</strong><small>${this.activeProfileId === "guest" ? "Temporary achievements" : "Local achievement file"}</small></div>
        <div class="progress-stat-card"><span>Unlocked</span><strong>${unlocked.length}/${ACHIEVEMENTS.length}</strong><small>${percent}% complete</small></div>
        <div class="progress-stat-card"><span>Badge points</span><strong>${totalPoints}</strong><small>${availablePoints} available</small></div>
      </div>
      <div class="progress-panel achievement-next-panel">
        <h3>Closest Milestones</h3>
        ${next.length ? `<div class="achievement-next-list">${next.map(({ item, progress }) => `<div><span class="achievement-badge-icon small">${this.escapeHtml(item.icon)}</span><span><strong>${this.escapeHtml(item.title)}</strong><small>${this.formatAchievementProgress(item, progress)}</small></span><div class="meter"><span style="width:${progress.ratio * 100}%"></span></div></div>`).join("")}</div>` : `<p>Everything unlocked. Blake is reviewing whether this was supposed to be possible.</p>`}
      </div>
      ${categoryHtml}`;
  }

  renderAchievementCard(item, metrics) {
    const earned = this.achievements[item.id];
    const progress = this.getAchievementProgress(item, metrics);
    return `<article class="achievement-card ${earned ? "unlocked" : "locked"}">
      <div class="achievement-badge-icon">${this.escapeHtml(item.icon)}</div>
      <div class="achievement-card-copy"><div class="achievement-title-line"><h4>${this.escapeHtml(item.title)}</h4><span>${item.points} pts</span></div><p>${this.escapeHtml(item.description)}</p>
      ${earned ? `<div class="achievement-earned">★ Earned ${this.formatPacificTimestamp(earned.unlockedAt)}</div>` : `<div class="achievement-progress-text">${this.formatAchievementProgress(item, progress)}</div><div class="achievement-mini-meter"><span style="width:${progress.ratio * 100}%"></span></div>`}</div>
    </article>`;
  }

  formatAchievementProgress(item, progress) {
    const c = item.criterion ?? {};
    const current = progress.current;
    const target = progress.target;
    if (["lessonTarget", "lessonPlayed", "gamePlayed", "gameSuccess", "tournamentFormatSuccess", "tournamentMedal", "gameWinQuality"].includes(c.type)) return current >= target ? "Complete" : "Not yet earned";
    if (c.type === "lessonSetTargets") return `${Math.floor(current)}/${Math.floor(target)} required lesson targets`;
    if (c.type === "practiceMinutes") return `${Math.min(target, current).toFixed(current < 10 ? 1 : 0)}/${target} minutes`;
    if (c.type === "qualifiedAccuracy") return `${Math.round(Math.min(target, current))}/${target}% best qualifying accuracy`;
    if (c.type === "bestWpm") return `${Math.round(Math.min(target, current))}/${target} WPM`;
    return `${Math.floor(Math.min(target, current))}/${Math.floor(target)}`;
  }

  getAchievementBlakeComment(unlocked, total, points) {
    if (!unlocked) return `No badges yet. Excellent: an uncluttered recognition cabinet. Complete a lesson or game and HyperSoft will immediately ruin that simplicity.`;
    if (unlocked === total) return `Every achievement unlocked. I have asked HyperSoft to verify the results because the phrase "Blake's Rearview Mirror" was never intended to describe an actual person.`;
    if (unlocked >= total * 0.75) return `${unlocked} badges and ${points} points. You're now collecting credentials at a rate that makes my position here feel needlessly competitive.`;
    if (unlocked >= total * 0.4) return `${unlocked} achievements unlocked. This is becoming a legitimate training record, which is considerably less funny than when we started.`;
    return `${unlocked} achievements unlocked for this profile. Keep the accuracy clean and the sessions consistent; HyperSoft apparently gives badges for things I simply call "doing my job quickly."`;
  }

  renderScoreboard() {
    if (!this.scores.length) {
      this.ui.scoreboardContent.innerHTML = `<div class="empty-state">No scores yet for this profile. Blake is technically undefeated.</div>`;
      return;
    }

    const top = [...this.scores]
      .sort((a, b) => b.score - a.score || b.wpm - a.wpm)
      .slice(0, 40);

    this.ui.scoreboardContent.innerHTML = `
      <div style="overflow-x:auto">
        <table class="score-table">
          <thead><tr>
            <th>Type</th><th>Activity</th><th>Difficulty</th><th>Score</th><th>WPM</th><th>Accuracy</th><th>Completed (Pacific)</th>
          </tr></thead>
          <tbody>${top.map(row => `
            <tr>
              <td>${row.activityType === "tournament"
                ? `<span class="score-type tournament">Tournament</span>`
                : row.activityType === "lesson"
                  ? `<span class="score-type lesson">Lesson</span>`
                  : row.activityType === "practice"
                    ? `<span class="score-type practice">Practice</span>`
                    : `<span class="score-type game">Game</span>`}</td>
              <td>${this.escapeHtml(row.modeTitle ?? "Activity")}${row.activityType === "tournament" && row.tournamentMedal
                ? `<small class="score-subline">${this.escapeHtml(row.tournamentMedal)} · ${this.escapeHtml(({ quick: "Quick Cup", standard: "Standard Cup", grand: "Grand Tour" }[row.tournamentFormat] || row.tournamentFormat || "Cup"))}</small>`
                : row.challengeType === "random"
                  ? `<small class="score-subline">Blake's Random Challenge</small>`
                  : row.tournamentId && row.tournamentRound
                    ? `<small class="score-subline">Tournament round ${row.tournamentRound}</small>`
                    : ""}</td>
              <td>${DIFFICULTY_CONFIG[row.difficulty]?.label ?? row.difficulty}</td>
              <td><strong>${row.score}</strong></td>
              <td>${row.wpm}</td>
              <td>${row.accuracy}%</td>
              <td>${this.formatPacificTimestamp(row.timestamp)}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>`;
  }

  renderProgress() {
    if (!this.ui.progressContent) return;
    const rows = [...this.scores]
      .filter(row => row.activityType !== "tournament" && Number.isFinite(Number(row.timestamp)))
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    const lessonRows = rows.filter(row => row.activityType === "lesson");
    const practiceRows = rows.filter(row => row.activityType === "practice");
    const gameRows = rows.filter(row => this.isArcadeGameRow(row));
    const avgWpm = this.averageField(rows, "wpm");
    const avgAccuracy = this.averageField(rows, "accuracy", 100);
    const bestWpm = rows.length ? Math.max(...rows.map(row => Number(row.wpm) || 0)) : 0;
    const totalTime = rows.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0);
    const mastered = LESSON_METADATA.filter(lesson => this.getLessonProgress(lesson).metTarget).length;
    const rating = this.getHyperSoftRating(bestWpm, Math.round(avgAccuracy), lessonRows.length);
    const weak = this.getWeakKeys(7);
    const weakPairs = this.getWeakPairs(7);
    const strong = this.getStrongKeys(5);
    const recent = [...rows].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).slice(0, 10);
    const comparison = this.getRecentSessionComparison(rows, 10);
    const difficultyStats = this.getDifficultyProgressStats(rows);
    const personalBests = this.getPersonalBestHistory(rows);
    const dailyPractice = this.getDailyPracticeData(rows, 14);

    const lessonRowsHtml = LESSON_METADATA.map(lesson => {
      const record = this.getLessonProgress(lesson);
      const trendClass = record.trend.direction === "up" ? "trend-up" : record.trend.direction === "down" ? "trend-down" : "trend-flat";
      const trendGlyph = record.trend.direction === "up" ? "▲" : record.trend.direction === "down" ? "▼" : "•";
      return `<div class="progress-lesson-row">
        <div><h4>${this.escapeHtml(lesson.number)} — ${this.escapeHtml(lesson.title)}</h4><small>${record.attempts ? `${record.attempts} ${record.attempts === 1 ? "attempt" : "attempts"}` : "Not started"}</small></div>
        <div class="progress-lesson-metrics">
          <span>Best ${record.bestWpm || "—"} WPM</span>
          <span>Accuracy ${record.bestAccuracy ? `${record.bestAccuracy}%` : "—"}</span>
          <span class="${trendClass}">${trendGlyph} ${record.trend.label}</span>
          <span class="progress-status ${record.metTarget ? "met" : "open"}">${record.metTarget ? "Target met" : "Open"}</span>
        </div>
        <button class="secondary progress-practice-btn" type="button" data-progress-lesson="${lesson.id}">${record.attempts ? "Practice" : "Start"}</button>
      </div>`;
    }).join("");

    const weakHtml = weak.length ? weak.map(item => {
      const trend = this.getKeyTrend(item.key);
      const cls = trend.direction === "up" ? "trend-up" : trend.direction === "down" ? "trend-down" : "trend-flat";
      const glyph = trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "•";
      return `<div class="key-progress-row">
        <div class="key-cap">${this.escapeHtml(this.formatKeyLabel(item.key))}</div>
        <div>
          <div class="key-progress-bar"><span style="width:${Math.max(2, Math.min(100, item.accuracy))}%"></span></div>
          <div class="key-progress-detail"><span>${Math.round(item.accuracy)}% • ${item.attempts} attempts</span><span class="${cls}">${glyph} ${trend.label}</span></div>
        </div>
        <strong>${item.errors}</strong>
      </div>`;
    }).join("") : `<div class="empty-state">No persistent weak keys yet. Complete more lessons to establish a pattern.</div>`;

    const pairHtml = weakPairs.length ? weakPairs.map(item => `
      <div class="pair-progress-row">
        <div class="pair-cap">${this.escapeHtml(item.pair.toUpperCase())}</div>
        <div><div class="key-progress-bar"><span style="width:${Math.max(2, Math.min(100, item.accuracy))}%"></span></div><small>${Math.round(item.accuracy)}% first-attempt accuracy • ${item.attempts} observations</small></div>
        <strong>${item.errors}</strong>
      </div>`).join("") : `<div class="empty-state">No persistent transition problems yet. Pair tracking begins automatically during lesson-style typing.</div>`;

    const strongHtml = strong.length
      ? strong.map(item => `<span class="weak-key-chip">${this.escapeHtml(this.formatKeyLabel(item.key))} ${Math.round(item.accuracy)}%</span>`).join(" ")
      : `<span class="adaptive-profile-note">More lesson data needed.</span>`;

    const lessonAverageWpm = this.averageField(lessonRows, "wpm");
    const practiceAverageWpm = this.averageField(practiceRows, "wpm");
    const gameAverageWpm = this.averageField(gameRows, "wpm");
    const lessonAverageAccuracy = this.averageField(lessonRows, "accuracy");
    const practiceAverageAccuracy = this.averageField(practiceRows, "accuracy");
    const gameAverageAccuracy = this.averageField(gameRows, "accuracy");
    const lessonTime = lessonRows.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0);
    const practiceTime = practiceRows.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0);
    const gameTime = gameRows.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0);

    const categoryMap = new Map();
    LESSON_METADATA.forEach(lesson => {
      const key = lesson.category || "Other";
      if (!categoryMap.has(key)) categoryMap.set(key, []);
      categoryMap.get(key).push(lesson);
    });
    const masteryByCategory = [...categoryMap.entries()].map(([category, lessons]) => {
      const met = lessons.filter(lesson => this.getLessonProgress(lesson).metTarget).length;
      const ratio = lessons.length ? met / lessons.length : 0;
      return `<div class="mastery-category-row"><div><strong>${this.escapeHtml(category)}</strong><small>${met}/${lessons.length} targets</small></div><div class="mastery-category-meter"><span style="width:${ratio * 100}%"></span></div><b>${Math.round(ratio * 100)}%</b></div>`;
    }).join("");

    const difficultyHtml = difficultyStats.map(item => `<tr>
      <td><strong>${this.escapeHtml(item.label)}</strong></td>
      <td>${item.sessions}</td>
      <td>${item.sessions ? item.bestWpm : "—"}</td>
      <td>${item.sessions ? `${Math.round(item.avgAccuracy)}%` : "—"}</td>
      <td>${item.sessions ? item.bestScore : "—"}</td>
      <td>${item.successfulGames}/${item.gameSessions}</td>
    </tr>`).join("");

    const personalBestHtml = personalBests.length ? personalBests.slice(-8).reverse().map(item => `<tr>
      <td><strong>${item.wpm} WPM</strong></td>
      <td>${this.escapeHtml(item.modeTitle)}</td>
      <td>${item.accuracy}%</td>
      <td>${this.formatPacificTimestamp(item.timestamp)}</td>
    </tr>`).join("") : `<tr><td colspan="4">Complete a recorded session to establish a personal best.</td></tr>`;

    this.ui.progressContent.innerHTML = `
      <div class="blake-progress-note">
        <img src="${BLAKE_ASSET}" alt="Blake" />
        <div><strong>Blake's progress desk</strong><p>${this.getProgressBlakeComment({ mastered, totalLessons: LESSON_METADATA.length, bestWpm, avgAccuracy: Math.round(avgAccuracy), lessonSessions: lessonRows.length })}</p></div>
      </div>

      <div class="progress-summary-grid">
        <div class="progress-stat-card progress-rating-card"><span>HyperSoft rating</span><strong>${rating}</strong><small>Based on current local training history</small></div>
        <div class="progress-stat-card"><span>Lessons</span><strong>${lessonRows.length}</strong><small>${mastered}/${LESSON_METADATA.length} targets met</small></div>
        <div class="progress-stat-card"><span>Games</span><strong>${gameRows.length}</strong><small>recorded sessions</small></div>
        <div class="progress-stat-card"><span>Achievements</span><strong>${Object.keys(this.achievements ?? {}).length}/${ACHIEVEMENTS.length}</strong><small>profile badges unlocked</small></div>
        <div class="progress-stat-card"><span>Best WPM</span><strong>${bestWpm || "—"}</strong><small>all recorded activities</small></div>
        <div class="progress-stat-card"><span>Avg. accuracy</span><strong>${rows.length ? `${Math.round(avgAccuracy)}%` : "—"}</strong><small>${rows.length} total sessions</small></div>
        <div class="progress-stat-card"><span>Practice time</span><strong>${this.formatDurationTotal(totalTime)}</strong><small>recorded timed history</small></div>
      </div>

      <div class="progress-panel progress-insight-panel">
        <div class="mastery-line"><h3>Recent Improvement</h3><span>Latest 10 sessions compared with the previous 10</span></div>
        ${comparison.hasPrevious ? `<div class="progress-comparison-grid">
          ${this.renderComparisonStat("WPM", comparison.currentWpm, comparison.previousWpm, comparison.deltaWpm, "")}
          ${this.renderComparisonStat("Accuracy", comparison.currentAccuracy, comparison.previousAccuracy, comparison.deltaAccuracy, "%")}
          ${this.renderComparisonStat("Practice / session", comparison.currentMinutes, comparison.previousMinutes, comparison.deltaMinutes, " min")}
          <div class="comparison-card"><span>Recent sessions</span><strong>${comparison.currentCount}</strong><small>${comparison.previousCount} in comparison window</small></div>
        </div>` : `<div class="empty-state compact">Record at least 11 sessions to unlock a meaningful recent-vs-previous comparison.</div>`}
      </div>

      <div class="progress-chart-grid">
        <div class="progress-panel chart-panel">
          <div class="mastery-line"><h3>WPM Over Time</h3><span>Last ${Math.min(30, rows.length)} sessions</span></div>
          ${this.buildLineChart(rows, "wpm", { ariaLabel: "Words per minute over time", unit: " WPM", maxPoints: 30, floorAtZero: true })}
        </div>
        <div class="progress-panel chart-panel">
          <div class="mastery-line"><h3>Accuracy Over Time</h3><span>Last ${Math.min(30, rows.length)} sessions</span></div>
          ${this.buildLineChart(rows, "accuracy", { ariaLabel: "Typing accuracy over time", unit: "%", maxPoints: 30, percent: true })}
        </div>
      </div>

      <div class="progress-chart-grid">
        <div class="progress-panel chart-panel">
          <div class="mastery-line"><h3>Daily Practice</h3><span>Last 14 Pacific calendar days</span></div>
          ${this.buildPracticeBarChart(dailyPractice)}
        </div>
        <div class="progress-panel">
          <div class="mastery-line"><h3>Lessons vs. Games</h3><span>Recorded activity comparison</span></div>
          <div class="activity-compare-grid">
            ${this.renderActivityComparison("Lessons", lessonRows.length, lessonAverageWpm, lessonAverageAccuracy, lessonTime)}
            ${this.renderActivityComparison("Smart Practice", practiceRows.length, practiceAverageWpm, practiceAverageAccuracy, practiceTime)}
            ${this.renderActivityComparison("Games", gameRows.length, gameAverageWpm, gameAverageAccuracy, gameTime)}
          </div>
          <p class="progress-panel-intro">WPM is shown exactly as each activity records it; single-key arcade modes are naturally less comparable to passage lessons.</p>
        </div>
      </div>

      <div class="progress-layout">
        <div class="progress-panel">
          <div class="mastery-line"><h3>Curriculum Mastery</h3><span>${mastered} of ${LESSON_METADATA.length} lesson targets met</span></div>
          <div class="meter"><span style="width:${(mastered / LESSON_METADATA.length) * 100}%"></span></div>
          <div class="mastery-category-list">${masteryByCategory}</div>
        </div>
        <div class="progress-panel">
          <div class="mastery-line"><h3>Keyboard Accuracy Heatmap</h3><span>Aggregate lesson key accuracy</span></div>
          <p class="progress-panel-intro">Keys become more reliable as more lesson attempts accumulate. Upper- and lowercase letter statistics are combined for this view.</p>
          ${this.renderKeyboardHeatmap()}
          <div class="heatmap-legend"><span class="heat no-data">No data</span><span class="heat weak">&lt;90%</span><span class="heat watch">90–94%</span><span class="heat good">95–97%</span><span class="heat excellent">98%+</span></div>
        </div>
      </div>

      <div class="progress-layout">
        <div class="progress-panel">
          <h3>Difficulty Records</h3>
          <p class="progress-panel-intro">Best speed, average accuracy, and best score grouped by the selected difficulty used for each session.</p>
          <div style="overflow-x:auto"><table class="recent-progress-table detailed-stats-table"><thead><tr><th>Difficulty</th><th>Sessions</th><th>Best WPM</th><th>Avg. Accuracy</th><th>Best Score</th><th>Game Wins</th></tr></thead><tbody>${difficultyHtml}</tbody></table></div>
        </div>
        <div class="progress-panel">
          <h3>Personal-Best Timeline</h3>
          <p class="progress-panel-intro">Every point where your all-activity WPM record moved higher. The latest eight record changes are shown.</p>
          <div style="overflow-x:auto"><table class="recent-progress-table detailed-stats-table"><thead><tr><th>Record</th><th>Activity</th><th>Accuracy</th><th>Reached</th></tr></thead><tbody>${personalBestHtml}</tbody></table></div>
        </div>
      </div>

      <div class="progress-layout">
        <div>
          <div class="progress-panel">
            <h3>Lesson History</h3>
            <p class="progress-panel-intro">Best results and recent WPM direction for every curriculum lesson. A target can be met on any difficulty.</p>
            <div class="progress-lesson-list">${lessonRowsHtml}</div>
          </div>
        </div>
        <div>
          <div class="progress-panel">
            <h3>Weak-Key Trends</h3>
            <p class="progress-panel-intro">Keys with enough recorded attempts to show a persistent accuracy problem. ▲ means recent accuracy is improving.</p>
            <div class="key-progress-list">${weakHtml}</div>
          </div>
          <div class="progress-panel">
            <h3>Troublesome Key Pairs</h3>
            <p class="progress-panel-intro">Adjacent letter transitions with repeated first-attempt misses. Trouble-Pair Clinic uses these directly.</p>
            <div class="pair-progress-list">${pairHtml}</div>
          </div>
          <div class="progress-panel">
            <h3>Reliable Keys</h3>
            <p class="progress-panel-intro">High-accuracy keys with at least ten recorded lesson attempts.</p>
            <div>${strongHtml}</div>
          </div>
        </div>
      </div>

      <div class="progress-panel">
        <h3>Recent Activity</h3>
        ${recent.length ? `<div style="overflow-x:auto"><table class="recent-progress-table"><thead><tr><th>Activity</th><th>Type</th><th>Difficulty</th><th>WPM</th><th>Accuracy</th><th>Completed (Pacific)</th></tr></thead><tbody>${recent.map(row => `<tr><td>${this.escapeHtml(row.modeTitle ?? "Activity")}</td><td>${row.activityType === "lesson" ? "Lesson" : row.activityType === "practice" ? "Practice" : "Game"}</td><td>${this.escapeHtml(DIFFICULTY_CONFIG[row.difficulty]?.label ?? row.difficulty ?? "—")}</td><td>${row.wpm ?? "—"}</td><td>${row.accuracy ?? "—"}%</td><td>${this.formatPacificTimestamp(row.timestamp)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No recorded activity yet.</div>`}
      </div>
    `;

    this.ui.progressContent.querySelectorAll("[data-progress-lesson]").forEach(button => {
      button.addEventListener("click", () => this.startLesson(button.dataset.progressLesson));
    });
  }


  getReportSnapshot() {
    const profile = this.getActiveProfile();
    const rows = [...(this.scores ?? [])]
      .filter(row => row.activityType !== "tournament" && Number.isFinite(Number(row.timestamp)))
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    const lessonRows = rows.filter(row => row.activityType === "lesson");
    const practiceRows = rows.filter(row => row.activityType === "practice");
    const gameRows = rows.filter(row => this.isArcadeGameRow(row));
    const bestRow = rows.length ? [...rows].sort((a, b) => (Number(b.wpm) || 0) - (Number(a.wpm) || 0) || (Number(b.accuracy) || 0) - (Number(a.accuracy) || 0))[0] : null;
    const avgWpm = this.averageField(rows, "wpm");
    const avgAccuracy = this.averageField(rows, "accuracy");
    const totalTime = rows.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0);
    const masteredLessons = LESSON_METADATA.filter(lesson => this.getLessonProgress(lesson).metTarget);
    const rating = this.getHyperSoftRating(Number(bestRow?.wpm) || 0, Math.round(avgAccuracy), lessonRows.length);
    const unlockedAchievements = ACHIEVEMENTS.filter(item => this.achievements?.[item.id]);
    const achievementPoints = unlockedAchievements.reduce((sum, item) => sum + (Number(item.points) || 0), 0);
    const recentComparison = this.getRecentSessionComparison(rows, 10);
    const weakKeys = this.getWeakKeys(8);
    const weakPairs = this.getWeakPairs(8);
    const strongKeys = this.getStrongKeys(8);
    const difficultyStats = this.getDifficultyProgressStats(rows);
    const personalBests = this.getPersonalBestHistory(rows);
    return {
      profile,
      rows,
      lessonRows,
      practiceRows,
      gameRows,
      bestRow,
      avgWpm,
      avgAccuracy,
      totalTime,
      masteredLessons,
      rating,
      unlockedAchievements,
      achievementPoints,
      recentComparison,
      weakKeys,
      weakPairs,
      strongKeys,
      difficultyStats,
      personalBests
    };
  }

  renderReports() {
    if (!this.ui.reportsContent) return;
    const stats = this.getReportSnapshot();
    const eligibleLessons = LESSON_METADATA.filter(lesson => this.getLessonProgress(lesson).metTarget);
    const curriculumComplete = stats.masteredLessons.length === LESSON_METADATA.length;
    const hasHistory = stats.rows.length > 0;
    const profileName = stats.profile?.name ?? "Player";

    const lessonOptions = eligibleLessons.length
      ? eligibleLessons.map(lesson => `<option value="${lesson.id}">${this.escapeHtml(lesson.number)} — ${this.escapeHtml(lesson.title)}</option>`).join("")
      : `<option value="">No lesson targets met yet</option>`;

    this.ui.reportsContent.innerHTML = `
      <div class="report-dashboard-intro">
        <img src="${BLAKE_ASSET}" alt="Blake" />
        <div><strong>Blake's document desk</strong><p>${hasHistory
          ? `${this.escapeHtml(profileName)} has enough recorded material for formal HyperSoft paperwork. This is the phase where a typing program starts producing documents with borders and taking itself very seriously.`
          : `There is currently nothing to certify. Complete a lesson or game first. HyperSoft refuses to issue a keyboarding credential based solely on confidence, which has affected me personally.`}</p></div>
      </div>

      <div class="report-summary-grid">
        <div class="report-summary-card"><span>Profile</span><strong>${this.escapeHtml(profileName)}</strong><small>${this.activeProfileId === "guest" ? "Temporary guest record" : "Local learner file"}</small></div>
        <div class="report-summary-card"><span>Best WPM</span><strong>${stats.bestRow ? Math.round(Number(stats.bestRow.wpm) || 0) : "—"}</strong><small>${stats.bestRow ? `${Math.round(Number(stats.bestRow.accuracy) || 0)}% accuracy` : "No recorded session"}</small></div>
        <div class="report-summary-card"><span>Curriculum</span><strong>${stats.masteredLessons.length}/${LESSON_METADATA.length}</strong><small>lesson targets met</small></div>
        <div class="report-summary-card"><span>Achievements</span><strong>${stats.unlockedAchievements.length}</strong><small>${stats.achievementPoints} badge points</small></div>
        <div class="report-summary-card"><span>Practice</span><strong>${this.formatDurationTotal(stats.totalTime)}</strong><small>${stats.rows.length} recorded sessions</small></div>
      </div>

      <div class="document-section-heading"><h3>Certificates</h3><span>Formal recognition, in the most HyperSoft sense possible.</span></div>
      <div class="document-card-grid">
        <article class="document-card ${hasHistory ? "" : "locked"}">
          <div class="document-icon">WPM</div><h4>Keyboarding Achievement</h4>
          <p>Recognizes the learner's best recorded typing speed and associated accuracy, with their current HyperSoft rating.</p>
          <div class="document-status">${hasHistory ? `Available • Best ${Math.round(Number(stats.bestRow?.wpm) || 0)} WPM` : "Locked • Complete one recorded activity"}</div>
          <button class="${hasHistory ? "primary" : "secondary"}" type="button" data-report-type="typingCertificate" ${hasHistory ? "" : "disabled"}>Preview Certificate</button>
        </article>
        <article class="document-card ${curriculumComplete ? "" : "locked"}">
          <div class="document-icon">14</div><h4>Curriculum Completion</h4>
          <p>Certifies that all fourteen HyperSoft typing lesson targets have been met at least once.</p>
          <div class="document-status">${curriculumComplete ? "Available • Curriculum complete" : `Locked • ${stats.masteredLessons.length}/${LESSON_METADATA.length} targets met`}</div>
          <button class="${curriculumComplete ? "primary" : "secondary"}" type="button" data-report-type="curriculumCertificate" ${curriculumComplete ? "" : "disabled"}>Preview Certificate</button>
        </article>
        <article class="document-card ${eligibleLessons.length ? "" : "locked"}">
          <div class="document-icon">L</div><h4>Lesson Mastery</h4>
          <p>Creates a certificate for any individual lesson whose speed and accuracy target has been achieved.</p>
          <select id="lessonCertificateSelect" ${eligibleLessons.length ? "" : "disabled"}>${lessonOptions}</select>
          <div class="document-status">${eligibleLessons.length ? `${eligibleLessons.length} mastered ${eligibleLessons.length === 1 ? "lesson" : "lessons"} available` : "Locked • Meet a lesson target"}</div>
          <button class="${eligibleLessons.length ? "primary" : "secondary"}" id="lessonCertificateButton" type="button" ${eligibleLessons.length ? "" : "disabled"}>Preview Lesson Certificate</button>
        </article>
      </div>

      <div class="document-section-heading"><h3>Reports</h3><span>Printable learner records generated from the active profile.</span></div>
      <div class="document-card-grid">
        <article class="document-card ${hasHistory ? "" : "locked"}">
          <div class="document-icon">A</div><h4>Typing Assessment Report</h4>
          <p>A concise assessment of speed, accuracy, practice time, curriculum mastery, adaptive weak keys, achievements, and recent direction.</p>
          <div class="document-status">${hasHistory ? `Available • ${stats.rows.length} sessions analyzed` : "Locked • Record activity first"}</div>
          <button class="${hasHistory ? "primary" : "secondary"}" type="button" data-report-type="assessmentReport" ${hasHistory ? "" : "disabled"}>Preview Assessment</button>
        </article>
        <article class="document-card ${hasHistory ? "" : "locked"}">
          <div class="document-icon">PR</div><h4>Detailed Progress Report</h4>
          <p>A longer report with every lesson record, difficulty breakdown, personal-best timeline, recent activity, and achievement summary.</p>
          <div class="document-status">${hasHistory ? "Available • Detailed learner file" : "Locked • Record activity first"}</div>
          <button class="${hasHistory ? "primary" : "secondary"}" type="button" data-report-type="progressReport" ${hasHistory ? "" : "disabled"}>Preview Progress Report</button>
        </article>
        <article class="document-card">
          <div class="document-icon">PDF</div><h4>Printing &amp; PDF</h4>
          <p>Every preview is print-formatted. Choose Print / Save PDF, then use your browser's printer destination or Save as PDF option.</p>
          <div class="document-status">Local only • No upload required</div>
          <button class="secondary" type="button" data-report-type="help">How It Works</button>
        </article>
      </div>`;

    this.ui.reportsContent.querySelectorAll("[data-report-type]").forEach(button => {
      button.addEventListener("click", () => {
        const type = button.dataset.reportType;
        if (type === "help") {
          alert("Choose a certificate or report, review the on-screen preview, then click Print / Save PDF. In the browser print dialog you can print to paper or choose a PDF destination. HyperSoft does not transmit the document anywhere.");
          return;
        }
        this.openReportPreview(type);
      });
    });
    const lessonButton = this.ui.reportsContent.querySelector("#lessonCertificateButton");
    lessonButton?.addEventListener("click", () => {
      const select = this.ui.reportsContent.querySelector("#lessonCertificateSelect");
      if (select?.value) this.openReportPreview("lessonCertificate", select.value);
    });
  }

  openReportPreview(type, lessonId = null) {
    if (!this.ui.reportPreview || !this.ui.reportPreviewShell) return;
    const stats = this.getReportSnapshot();
    let html = "";
    let label = "Document Preview";
    if (type === "typingCertificate") { html = this.buildTypingCertificate(stats); label = "Keyboarding Achievement Certificate"; }
    else if (type === "curriculumCertificate") { html = this.buildCurriculumCertificate(stats); label = "Curriculum Completion Certificate"; }
    else if (type === "lessonCertificate") { html = this.buildLessonCertificate(stats, lessonId); label = "Lesson Mastery Certificate"; }
    else if (type === "assessmentReport") { html = this.buildAssessmentReport(stats); label = "Typing Assessment Report"; }
    else if (type === "progressReport") { html = this.buildDetailedProgressReport(stats); label = "Detailed Progress Report"; }
    if (!html) return;
    this.ui.reportPreview.innerHTML = html;
    this.ui.reportPreviewLabel.textContent = label;
    this.ui.reportPreviewShell.hidden = false;
    this.currentReportTitle = `${this.getActiveProfile()?.name ?? "Player"} — ${label}`;
    window.setTimeout(() => this.ui.reportPreviewShell.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  }

  closeReportPreview() {
    if (!this.ui.reportPreviewShell) return;
    this.ui.reportPreviewShell.hidden = true;
    if (this.ui.reportPreview) this.ui.reportPreview.innerHTML = "";
    this.currentReportTitle = null;
  }

  printCurrentReport() {
    if (!this.ui.reportPreviewShell || this.ui.reportPreviewShell.hidden || !this.ui.reportPreview?.innerHTML.trim()) return;
    const oldTitle = document.title;
    document.title = this.currentReportTitle || oldTitle;
    window.print();
    window.setTimeout(() => { document.title = oldTitle; }, 100);
  }

  getCertificateSerial(type = "CERT") {
    const profile = this.getActiveProfile();
    const source = `${profile?.id ?? "guest"}|${type}|v0.12`;
    let hash = 0;
    for (let i = 0; i < source.length; i += 1) hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
    return `HS-${String(type).replace(/[^A-Z0-9]/gi, "").slice(0, 5).toUpperCase()}-${Math.abs(hash).toString(36).toUpperCase().padStart(6, "0").slice(0, 8)}`;
  }

  formatPacificDateLong(timestamp = Date.now()) {
    return new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "long", day: "numeric", year: "numeric" }).format(new Date(timestamp));
  }

  certificateFrame({ title, name, body, metrics = [], serialType = "CERT", seal = "Verified Achievement", issuedAt = Date.now() }) {
    const metricsHtml = metrics.map(item => `<div class="certificate-metric"><span>${this.escapeHtml(item.label)}</span><strong>${this.escapeHtml(String(item.value))}</strong></div>`).join("");
    return `<div class="certificate-document"><div class="certificate-border">
      <div class="certificate-kicker">HyperSoft Learning Suite • Typing Division</div>
      <div class="certificate-logo">HB</div>
      <h1>${this.escapeHtml(title)}</h1>
      <div class="certificate-presented">This certificate is proudly presented to</div>
      <div class="certificate-name">${this.escapeHtml(name)}</div>
      <div class="certificate-body">${body}</div>
      <div class="certificate-metrics">${metricsHtml}</div>
      <span class="certificate-seal-text">${this.escapeHtml(seal)}</span>
      <div class="certificate-footer">
        <div class="certificate-footer-block"><strong>${this.escapeHtml(this.formatPacificDateLong(issuedAt))}</strong><br />Date issued • Pacific Time</div>
        <div class="certificate-footer-block"><div class="blake-signature">Blake Breacher</div><strong>Blake Breacher</strong><br />Lead Typing Champion</div>
        <div class="certificate-footer-block"><strong>HyperSoft Typing Division</strong><br />Deluxe Training Suite v0.12</div>
      </div>
      <div class="certificate-serial">Certificate ${this.escapeHtml(this.getCertificateSerial(serialType))}</div>
    </div></div>`;
  }

  buildTypingCertificate(stats) {
    if (!stats.bestRow) return "";
    const name = stats.profile?.name ?? "Player";
    const bestWpm = Math.round(Number(stats.bestRow.wpm) || 0);
    const bestAccuracy = Math.round(Number(stats.bestRow.accuracy) || 0);
    const activity = this.escapeHtml(stats.bestRow.modeTitle ?? "recorded typing activity");
    return this.certificateFrame({
      title: "Certificate of Keyboarding Achievement",
      name,
      body: `for demonstrating measurable keyboarding proficiency in the HyperSoft training system, including a personal best of <strong>${bestWpm} words per minute</strong> at <strong>${bestAccuracy}% accuracy</strong> during ${activity}.`,
      metrics: [
        { label: "Personal Best", value: `${bestWpm} WPM` },
        { label: "Accuracy", value: `${bestAccuracy}%` },
        { label: "HyperSoft Rating", value: stats.rating }
      ],
      serialType: "WPM",
      seal: "Keyboarding Achievement"
    });
  }

  buildCurriculumCertificate(stats) {
    if (stats.masteredLessons.length !== LESSON_METADATA.length) return "";
    const name = stats.profile?.name ?? "Player";
    return this.certificateFrame({
      title: "Certificate of Curriculum Completion",
      name,
      body: `for successfully meeting the speed and accuracy targets across all <strong>${LESSON_METADATA.length} HyperSoft typing lessons</strong>, from home-row foundations through full-keyboard and adaptive practice.`,
      metrics: [
        { label: "Lesson Targets", value: `${LESSON_METADATA.length}/${LESSON_METADATA.length}` },
        { label: "Best WPM", value: `${Math.round(Number(stats.bestRow?.wpm) || 0)} WPM` },
        { label: "Overall Rating", value: stats.rating }
      ],
      serialType: "CURR",
      seal: "Curriculum Complete"
    });
  }

  buildLessonCertificate(stats, lessonId) {
    const lesson = LESSON_METADATA.find(item => item.id === lessonId);
    if (!lesson) return "";
    const record = this.getLessonProgress(lesson);
    if (!record.metTarget) return "";
    const name = stats.profile?.name ?? "Player";
    return this.certificateFrame({
      title: "Certificate of Lesson Mastery",
      name,
      body: `for meeting the HyperSoft target for <strong>${this.escapeHtml(lesson.number)} — ${this.escapeHtml(lesson.title)}</strong>, demonstrating the required combination of typing speed and accuracy.`,
      metrics: [
        { label: "Best Speed", value: `${record.bestWpm} WPM` },
        { label: "Best Accuracy", value: `${record.bestAccuracy}%` },
        { label: "Lesson Target", value: `${lesson.targetWpm} WPM / ${lesson.targetAccuracy}%` }
      ],
      serialType: `L${LESSON_METADATA.indexOf(lesson) + 1}`,
      seal: "Lesson Target Met",
      issuedAt: record.latest?.timestamp ?? Date.now()
    });
  }

  getReportHeader(title, subtitle, stats) {
    const profileName = stats.profile?.name ?? "Player";
    return `<div class="report-document-header"><div><div class="report-doc-brand">HyperSoft Learning Suite • Typing Division</div><h1>${this.escapeHtml(title)}</h1><p>${this.escapeHtml(subtitle)}</p></div><div class="report-doc-stamp">${this.escapeHtml(profileName)}<br />${this.escapeHtml(this.formatPacificDateLong())}</div></div>`;
  }

  getReportSummaryHtml(stats) {
    return `<div class="report-doc-summary">
      <div class="report-doc-stat"><span>Sessions</span><strong>${stats.rows.length}</strong></div>
      <div class="report-doc-stat"><span>Best WPM</span><strong>${stats.bestRow ? Math.round(Number(stats.bestRow.wpm) || 0) : "—"}</strong></div>
      <div class="report-doc-stat"><span>Avg Accuracy</span><strong>${stats.rows.length ? `${Math.round(stats.avgAccuracy)}%` : "—"}</strong></div>
      <div class="report-doc-stat"><span>Practice Time</span><strong>${this.formatDurationTotal(stats.totalTime)}</strong></div>
      <div class="report-doc-stat"><span>Rating</span><strong>${this.escapeHtml(stats.rating)}</strong></div>
    </div>`;
  }

  getReportBlakeSignoff(stats) {
    const comment = this.getProgressBlakeComment({ mastered: stats.masteredLessons.length, totalLessons: LESSON_METADATA.length, bestWpm: Math.round(Number(stats.bestRow?.wpm) || 0), avgAccuracy: Math.round(stats.avgAccuracy), lessonSessions: stats.lessonRows.length });
    return `<div class="report-blake-signoff"><img src="${BLAKE_ASSET}" alt="Blake" /><div><strong>Instructor comment</strong><p>${this.escapeHtml(comment)}</p><div class="blake-signature">Blake Breacher</div><small>Lead Typing Champion • HyperSoft</small></div></div>`;
  }

  getReportFooter() {
    return `<div class="report-doc-footer"><span>Blake Breacher Teaches Typing v0.12</span><span>Generated locally • Pacific Time • HyperSoft Learning Suite</span></div>`;
  }

  buildAssessmentReport(stats) {
    if (!stats.rows.length) return "";
    const comp = stats.recentComparison;
    const weakHtml = stats.weakKeys.length ? stats.weakKeys.map(item => `<span class="report-key-chip">${this.escapeHtml(this.formatKeyLabel(item.key))} ${Math.round(item.accuracy)}%</span>`).join("") : "No persistent weak keys established.";
    const strongHtml = stats.strongKeys.length ? stats.strongKeys.map(item => `<span class="report-key-chip">${this.escapeHtml(this.formatKeyLabel(item.key))} ${Math.round(item.accuracy)}%</span>`).join("") : "More lesson data needed.";
    const pairHtml = stats.weakPairs.length ? stats.weakPairs.map(item => `<span class="report-key-chip">${this.escapeHtml(item.pair.toUpperCase())} ${Math.round(item.accuracy)}%</span>`).join("") : "No persistent key-pair problems established.";
    const categories = [...new Set(LESSON_METADATA.map(item => item.category))].map(category => {
      const lessons = LESSON_METADATA.filter(item => item.category === category);
      const met = lessons.filter(item => this.getLessonProgress(item).metTarget).length;
      return `<tr><td>${this.escapeHtml(category)}</td><td>${met}/${lessons.length}</td><td>${Math.round((met / lessons.length) * 100)}%</td></tr>`;
    }).join("");
    const topAchievements = stats.unlockedAchievements.slice().sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0)).slice(0, 8);
    return `<div class="report-document">
      ${this.getReportHeader("Typing Assessment Report", "Concise learner assessment based on the active HyperSoft profile.", stats)}
      ${this.getReportSummaryHtml(stats)}
      ${this.getReportBlakeSignoff(stats)}
      <div class="report-doc-two-col">
        <div><h2>Curriculum Status</h2><table class="report-doc-table"><thead><tr><th>Area</th><th>Targets</th><th>Mastery</th></tr></thead><tbody>${categories}</tbody></table></div>
        <div><h2>Recent Direction</h2>${comp.hasPrevious ? `<table class="report-doc-table"><tbody><tr><th>Average WPM</th><td>${comp.currentWpm.toFixed(1)}</td><td>${comp.deltaWpm >= 0 ? "+" : ""}${comp.deltaWpm.toFixed(1)} vs prior</td></tr><tr><th>Accuracy</th><td>${comp.currentAccuracy.toFixed(1)}%</td><td>${comp.deltaAccuracy >= 0 ? "+" : ""}${comp.deltaAccuracy.toFixed(1)} pts</td></tr><tr><th>Practice/session</th><td>${comp.currentMinutes.toFixed(1)} min</td><td>${comp.deltaMinutes >= 0 ? "+" : ""}${comp.deltaMinutes.toFixed(1)} min</td></tr></tbody></table>` : `<p>At least eleven sessions are needed for a recent-vs-previous trend comparison.</p>`}</div>
      </div>
      <div class="report-doc-two-col">
        <div><h2>Adaptive Focus</h2><p><strong>Keys needing attention:</strong><br />${weakHtml}</p><p><strong>Troublesome transitions:</strong><br />${pairHtml}</p><p><strong>Reliable keys:</strong><br />${strongHtml}</p></div>
        <div><h2>Recognition</h2><p><strong>${stats.unlockedAchievements.length}/${ACHIEVEMENTS.length} achievements • ${stats.achievementPoints} points</strong></p><p>${topAchievements.length ? topAchievements.map(item => `<span class="report-key-chip">${this.escapeHtml(item.title)}</span>`).join("") : "No achievements unlocked yet."}</p></div>
      </div>
      <div class="report-doc-callout"><strong>Assessment note</strong>This report reflects locally recorded practice in Blake Breacher Teaches Typing. Single-key and arcade modes are included in overall history but are not interchangeable with sustained passage-typing assessments.</div>
      ${this.getReportFooter()}
    </div>`;
  }

  buildDetailedProgressReport(stats) {
    if (!stats.rows.length) return "";
    const lessonTable = LESSON_METADATA.map(lesson => {
      const record = this.getLessonProgress(lesson);
      return `<tr><td>${this.escapeHtml(lesson.number)}</td><td>${this.escapeHtml(lesson.title)}</td><td>${record.attempts}</td><td>${record.bestWpm || "—"}</td><td>${record.bestAccuracy ? `${record.bestAccuracy}%` : "—"}</td><td>${record.metTarget ? "Met" : "Open"}</td></tr>`;
    }).join("");
    const difficultyTable = stats.difficultyStats.map(item => `<tr><td>${this.escapeHtml(item.label)}</td><td>${item.sessions}</td><td>${item.sessions ? item.bestWpm : "—"}</td><td>${item.sessions ? `${Math.round(item.avgAccuracy)}%` : "—"}</td><td>${item.sessions ? item.bestScore : "—"}</td><td>${item.successfulGames}/${item.gameSessions}</td></tr>`).join("");
    const bestTable = stats.personalBests.slice(-10).reverse().map(item => `<tr><td>${item.wpm} WPM</td><td>${this.escapeHtml(item.modeTitle)}</td><td>${item.accuracy}%</td><td>${this.formatPacificTimestamp(item.timestamp)}</td></tr>`).join("") || `<tr><td colspan="4">No personal-best history yet.</td></tr>`;
    const recent = [...stats.rows].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).slice(0, 15);
    const recentTable = recent.map(row => `<tr><td>${this.escapeHtml(row.modeTitle ?? "Activity")}</td><td>${row.activityType === "lesson" ? "Lesson" : row.activityType === "practice" ? "Practice" : "Game"}</td><td>${this.escapeHtml(DIFFICULTY_CONFIG[row.difficulty]?.label ?? row.difficulty ?? "—")}</td><td>${row.wpm ?? "—"}</td><td>${row.accuracy ?? "—"}%</td><td>${this.formatPacificTimestamp(row.timestamp)}</td></tr>`).join("");
    const achievements = stats.unlockedAchievements.slice().sort((a,b) => (this.achievements?.[a.id]?.unlockedAt ?? 0) - (this.achievements?.[b.id]?.unlockedAt ?? 0));
    const achievementRows = achievements.length ? achievements.map(item => `<tr><td>${this.escapeHtml(item.title)}</td><td>${this.escapeHtml(item.description)}</td><td>${item.points}</td><td>${this.formatPacificTimestamp(this.achievements[item.id]?.unlockedAt)}</td></tr>`).join("") : `<tr><td colspan="4">No achievements unlocked.</td></tr>`;
    return `<div class="report-document">
      ${this.getReportHeader("Detailed Typing Progress Report", "Extended curriculum, activity, difficulty, and recognition history.", stats)}
      ${this.getReportSummaryHtml(stats)}
      <h2>Curriculum Detail</h2><table class="report-doc-table"><thead><tr><th>Lesson</th><th>Title</th><th>Attempts</th><th>Best WPM</th><th>Best Accuracy</th><th>Target</th></tr></thead><tbody>${lessonTable}</tbody></table>
      <h2>Difficulty Records</h2><table class="report-doc-table"><thead><tr><th>Difficulty</th><th>Sessions</th><th>Best WPM</th><th>Avg Accuracy</th><th>Best Score</th><th>Game Wins</th></tr></thead><tbody>${difficultyTable}</tbody></table>
      <div class="report-break-before"></div>
      <h2>Personal-Best Timeline</h2><table class="report-doc-table"><thead><tr><th>Record</th><th>Activity</th><th>Accuracy</th><th>Reached</th></tr></thead><tbody>${bestTable}</tbody></table>
      <h2>Recent Activity</h2><table class="report-doc-table"><thead><tr><th>Activity</th><th>Type</th><th>Difficulty</th><th>WPM</th><th>Accuracy</th><th>Completed</th></tr></thead><tbody>${recentTable}</tbody></table>
      <h2>Achievements</h2><table class="report-doc-table"><thead><tr><th>Achievement</th><th>Description</th><th>Points</th><th>Earned</th></tr></thead><tbody>${achievementRows}</tbody></table>
      ${this.getReportBlakeSignoff(stats)}
      ${this.getReportFooter()}
    </div>`;
  }

  averageField(rows, field, emptyValue = 0) {
    if (!rows.length) return emptyValue;
    return rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0) / rows.length;
  }

  getRecentSessionComparison(rows, size = 10) {
    const ordered = [...rows].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    const current = ordered.slice(-size);
    const previous = ordered.slice(-(size * 2), -size);
    const avgMinutes = list => list.length ? list.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0) / list.length / 60000 : 0;
    const currentWpm = this.averageField(current, "wpm");
    const previousWpm = this.averageField(previous, "wpm");
    const currentAccuracy = this.averageField(current, "accuracy");
    const previousAccuracy = this.averageField(previous, "accuracy");
    const currentMinutes = avgMinutes(current);
    const previousMinutes = avgMinutes(previous);
    return {
      hasPrevious: previous.length > 0 && current.length > 0,
      currentCount: current.length,
      previousCount: previous.length,
      currentWpm, previousWpm, deltaWpm: currentWpm - previousWpm,
      currentAccuracy, previousAccuracy, deltaAccuracy: currentAccuracy - previousAccuracy,
      currentMinutes, previousMinutes, deltaMinutes: currentMinutes - previousMinutes
    };
  }

  renderComparisonStat(label, current, previous, delta, suffix = "") {
    const direction = delta > 0.15 ? "up" : delta < -0.15 ? "down" : "flat";
    const glyph = direction === "up" ? "▲" : direction === "down" ? "▼" : "•";
    const formattedCurrent = suffix.includes("min") ? current.toFixed(1) : Math.round(current * 10) / 10;
    const formattedPrevious = suffix.includes("min") ? previous.toFixed(1) : Math.round(previous * 10) / 10;
    const formattedDelta = suffix.includes("min") ? Math.abs(delta).toFixed(1) : Math.round(Math.abs(delta) * 10) / 10;
    return `<div class="comparison-card"><span>${this.escapeHtml(label)}</span><strong>${formattedCurrent}${suffix}</strong><small class="trend-${direction}">${glyph} ${formattedDelta}${suffix} vs ${formattedPrevious}${suffix}</small></div>`;
  }

  buildLineChart(rows, field, options = {}) {
    const maxPoints = options.maxPoints ?? 30;
    const points = [...rows].slice(-maxPoints).map(row => ({
      timestamp: Number(row.timestamp),
      value: Number(row[field]) || 0,
      title: row.modeTitle ?? "Activity"
    }));
    if (points.length < 2) return `<div class="chart-empty">Complete at least two recorded sessions to draw this graph.</div>`;

    const width = 760, height = 230, left = 48, right = 18, top = 18, bottom = 38;
    const values = points.map(point => point.value);
    let minValue = options.percent ? Math.max(0, Math.floor((Math.min(...values) - 5) / 5) * 5) : (options.floorAtZero ? 0 : Math.min(...values));
    let maxValue = options.percent ? 100 : Math.max(10, Math.ceil((Math.max(...values) * 1.12) / 10) * 10);
    if (maxValue <= minValue) maxValue = minValue + 10;
    const plotW = width - left - right, plotH = height - top - bottom;
    const xFor = index => left + (points.length === 1 ? plotW / 2 : (index / (points.length - 1)) * plotW);
    const yFor = value => top + (1 - (value - minValue) / (maxValue - minValue)) * plotH;
    const coords = points.map((point, index) => `${xFor(index).toFixed(1)},${yFor(point.value).toFixed(1)}`);
    const ticks = 4;
    const grid = Array.from({ length: ticks + 1 }, (_, i) => {
      const ratio = i / ticks;
      const y = top + ratio * plotH;
      const value = maxValue - ratio * (maxValue - minValue);
      return `<line class="chart-grid-line" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"></line><text class="chart-axis-label" x="${left - 8}" y="${y + 4}" text-anchor="end">${Math.round(value)}${options.percent ? "%" : ""}</text>`;
    }).join("");
    const markerIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
    const xLabels = markerIndexes.map(index => `<text class="chart-axis-label" x="${xFor(index)}" y="${height - 10}" text-anchor="middle">${this.formatPacificShortDate(points[index].timestamp)}</text>`).join("");
    const dots = points.map((point, index) => `<circle class="chart-point" cx="${xFor(index)}" cy="${yFor(point.value)}" r="4"><title>${this.escapeHtml(point.title)} — ${point.value}${options.unit ?? ""} — ${this.formatPacificTimestamp(point.timestamp)}</title></circle>`).join("");
    return `<div class="svg-chart-wrap"><svg class="progress-svg-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${this.escapeHtml(options.ariaLabel ?? `${field} over time`)}">${grid}<polyline class="chart-line" points="${coords.join(" ")}"></polyline>${dots}${xLabels}</svg></div>`;
  }

  getDailyPracticeData(rows, days = 14) {
    const keyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" });
    const labelFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "numeric", day: "numeric" });
    const totals = new Map();
    rows.forEach(row => {
      const key = keyFormatter.format(new Date(Number(row.timestamp)));
      totals.set(key, (totals.get(key) || 0) + (Number(row.durationMs) || 0));
    });
    const result = [];
    const now = Date.now();
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date(now - offset * 86400000);
      const key = keyFormatter.format(date);
      result.push({ key, label: labelFormatter.format(date), minutes: (totals.get(key) || 0) / 60000 });
    }
    return result;
  }

  buildPracticeBarChart(days) {
    if (!days.some(day => day.minutes > 0)) return `<div class="chart-empty">Timed practice will appear here after you complete recorded activities.</div>`;
    const width = 760, height = 230, left = 42, right = 16, top = 18, bottom = 42;
    const plotW = width - left - right, plotH = height - top - bottom;
    const maxMinutes = Math.max(5, Math.ceil(Math.max(...days.map(day => day.minutes)) / 5) * 5);
    const slot = plotW / days.length;
    const barWidth = Math.max(7, slot * 0.62);
    const bars = days.map((day, index) => {
      const h = (day.minutes / maxMinutes) * plotH;
      const x = left + index * slot + (slot - barWidth) / 2;
      const y = top + plotH - h;
      const label = index % 2 === 0 || index === days.length - 1 ? `<text class="chart-axis-label" x="${x + barWidth / 2}" y="${height - 12}" text-anchor="middle">${day.label}</text>` : "";
      return `<rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${Math.max(1, h)}" rx="3"><title>${day.label}: ${day.minutes.toFixed(1)} minutes</title></rect>${label}`;
    }).join("");
    const grid = [0, .5, 1].map(ratio => {
      const y = top + (1 - ratio) * plotH;
      return `<line class="chart-grid-line" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"></line><text class="chart-axis-label" x="${left - 7}" y="${y + 4}" text-anchor="end">${Math.round(maxMinutes * ratio)}m</text>`;
    }).join("");
    return `<div class="svg-chart-wrap"><svg class="progress-svg-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Daily practice minutes for the last fourteen days">${grid}${bars}</svg></div>`;
  }

  renderActivityComparison(label, sessions, avgWpm, avgAccuracy, durationMs) {
    return `<div class="activity-compare-card"><span>${this.escapeHtml(label)}</span><strong>${sessions}</strong><small>sessions</small><dl><div><dt>Avg WPM</dt><dd>${sessions ? Math.round(avgWpm) : "—"}</dd></div><div><dt>Avg accuracy</dt><dd>${sessions ? `${Math.round(avgAccuracy)}%` : "—"}</dd></div><div><dt>Time</dt><dd>${this.formatDurationTotal(durationMs)}</dd></div></dl></div>`;
  }

  getDifficultyProgressStats(rows) {
    return Object.entries(DIFFICULTY_CONFIG).map(([id, config]) => {
      const subset = rows.filter(row => row.difficulty === id);
      const games = subset.filter(row => this.isArcadeGameRow(row));
      return {
        id,
        label: config.label,
        sessions: subset.length,
        bestWpm: subset.length ? Math.max(...subset.map(row => Number(row.wpm) || 0)) : 0,
        avgAccuracy: this.averageField(subset, "accuracy"),
        bestScore: subset.length ? Math.max(...subset.map(row => Number(row.score) || 0)) : 0,
        gameSessions: games.length,
        successfulGames: games.filter(row => row.success === true).length
      };
    });
  }

  getPersonalBestHistory(rows) {
    let best = -1;
    const records = [];
    [...rows].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)).forEach(row => {
      const wpm = Number(row.wpm) || 0;
      if (wpm > best) {
        best = wpm;
        records.push({ wpm, accuracy: Number(row.accuracy) || 0, modeTitle: row.modeTitle ?? "Activity", timestamp: row.timestamp });
      }
    });
    return records;
  }

  renderKeyboardHeatmap() {
    const rows = [
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
      ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"]
    ];
    const getStats = key => {
      const keys = /^[a-z]$/.test(key) ? [key, key.toUpperCase()] : [key];
      const combined = keys.reduce((acc, item) => {
        const stats = this.keyStats[item];
        if (stats) { acc.attempts += Number(stats.attempts) || 0; acc.correct += Number(stats.correct) || 0; acc.errors += Number(stats.errors) || 0; }
        return acc;
      }, { attempts: 0, correct: 0, errors: 0 });
      combined.accuracy = combined.attempts ? (combined.correct / combined.attempts) * 100 : null;
      return combined;
    };
    const classFor = stats => {
      if (stats.attempts < 5 || stats.accuracy == null) return "no-data";
      if (stats.accuracy < 90) return "weak";
      if (stats.accuracy < 95) return "watch";
      if (stats.accuracy < 98) return "good";
      return "excellent";
    };
    const keyboard = rows.map((row, rowIndex) => `<div class="keyboard-heat-row heat-row-${rowIndex}">${row.map(key => {
      const stats = getStats(key);
      const title = stats.attempts ? `${key.toUpperCase()}: ${stats.accuracy.toFixed(1)}% accuracy over ${stats.attempts} attempts` : `${key.toUpperCase()}: no lesson data yet`;
      return `<div class="heat-key ${classFor(stats)}" title="${this.escapeHtml(title)}"><strong>${this.escapeHtml(key.toUpperCase())}</strong><small>${stats.attempts >= 5 ? `${Math.round(stats.accuracy)}%` : "—"}</small></div>`;
    }).join("")}</div>`).join("");
    const space = getStats(" ");
    return `<div class="keyboard-heatmap">${keyboard}<div class="keyboard-heat-row heat-space-row"><div class="heat-key space-key ${classFor(space)}" title="${space.attempts ? `Space: ${space.accuracy.toFixed(1)}% accuracy over ${space.attempts} attempts` : "Space: no lesson data yet"}"><strong>SPACE</strong><small>${space.attempts >= 5 ? `${Math.round(space.accuracy)}%` : "—"}</small></div></div></div>`;
  }

  formatPacificShortDate(timestamp) {
    return new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "numeric", day: "numeric" }).format(new Date(timestamp));
  }

  getStrongKeys(limit = 5) {
    return Object.entries(this.keyStats)
      .map(([key, stats]) => ({ key, ...stats, accuracy: stats.attempts ? (stats.correct / stats.attempts) * 100 : 0 }))
      .filter(item => item.attempts >= 10)
      .sort((a, b) => b.accuracy - a.accuracy || b.attempts - a.attempts)
      .slice(0, limit);
  }

  appendKeyHistory(sessionStats, lessonId) {
    const cleaned = {};
    Object.entries(sessionStats ?? {}).forEach(([key, stats]) => {
      if (!stats || !Number.isFinite(stats.attempts) || stats.attempts <= 0) return;
      cleaned[key] = { attempts: stats.attempts, correct: stats.correct ?? 0, errors: stats.errors ?? 0 };
    });
    this.keyHistory.push({ timestamp: Date.now(), lessonId: lessonId ?? null, keys: cleaned });
    this.keyHistory = this.keyHistory.slice(-80);
    this.persistActiveProfile();
  }

  loadKeyHistory() {
    const profile = this.getActiveProfile();
    return Array.isArray(profile?.data?.keyHistory) ? this.cloneData(profile.data.keyHistory) : [];
  }

  getKeyTrend(key) {
    const points = this.keyHistory
      .map(session => {
        const stats = session.keys?.[key];
        if (!stats?.attempts) return null;
        return { timestamp: session.timestamp, accuracy: (stats.correct / stats.attempts) * 100 };
      })
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp);
    if (points.length < 2) return { direction: "flat", label: "New" };
    const recent = points.slice(-3);
    const earlier = points.slice(-6, -3);
    const recentAvg = recent.reduce((sum, point) => sum + point.accuracy, 0) / recent.length;
    const baseline = earlier.length
      ? earlier.reduce((sum, point) => sum + point.accuracy, 0) / earlier.length
      : points[points.length - 2].accuracy;
    const delta = recentAvg - baseline;
    if (delta >= 2) return { direction: "up", label: `+${delta.toFixed(1)}%` };
    if (delta <= -2) return { direction: "down", label: `${delta.toFixed(1)}%` };
    return { direction: "flat", label: "Steady" };
  }

  getHyperSoftRating(bestWpm, accuracy, lessonSessions) {
    if (!lessonSessions) return "Unrated";
    if (bestWpm >= 90 && accuracy >= 96) return "Blake Threat";
    if (bestWpm >= 70 && accuracy >= 95) return "Typing Ace";
    if (bestWpm >= 55 && accuracy >= 94) return "Advanced";
    if (bestWpm >= 40 && accuracy >= 92) return "Proficient";
    if (bestWpm >= 28 && accuracy >= 90) return "Developing";
    return "Starter";
  }

  getProgressBlakeComment({ mastered, totalLessons, bestWpm, avgAccuracy, lessonSessions }) {
    if (!lessonSessions) return `No lesson records yet. A pristine file. I usually only see those immediately before someone discovers where I left the paperwork.`;
    if (mastered === totalLessons) return `Every lesson target met. Excellent. HyperSoft has asked me to stop referring to you as "the trainee," which I consider premature until you beat my WPM.`;
    if (bestWpm >= 80 && avgAccuracy >= 95) return `${bestWpm} WPM with ${avgAccuracy}% average accuracy. That's annoyingly credible. Keep working the weak keys and do not interpret this as permission to use my keyboard.`;
    if (avgAccuracy < 90) return `Your speed is developing, but accuracy is the obvious opportunity. Slow down just enough to stop repeating the same misses; the adaptive workshop is already keeping notes.`;
    return `${mastered} of ${totalLessons} lesson targets met, with a best of ${bestWpm} WPM. The useful part now is repetition: improve the weak keys without sacrificing the accuracy you've already built.`;
  }

  formatDurationTotal(ms) {
    if (!ms) return "—";
    const totalMinutes = Math.round(ms / 60000);
    if (totalMinutes < 60) return `${Math.max(1, totalMinutes)}m`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  cloneData(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  createProfileRecord(name, avatar = "initials", data = null) {
    const now = Date.now();
    return {
      id: `profile_${now}_${Math.random().toString(36).slice(2, 8)}`,
      name: String(name || "Player").trim().slice(0, 28) || "Player",
      avatar,
      createdAt: now,
      updatedAt: now,
      data: data ? this.cloneData(data) : { settings: { ...DEFAULT_SETTINGS }, scores: [], keyStats: {}, keyHistory: [], pairStats: {}, achievements: {} }
    };
  }

  normalizeProfile(profile) {
    const normalized = { ...profile };
    normalized.id ||= `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    normalized.name = String(normalized.name || "Player").trim().slice(0, 28) || "Player";
    normalized.avatar ||= "initials";
    normalized.createdAt ||= Date.now();
    normalized.updatedAt ||= normalized.createdAt;
    normalized.lastBackupAt = Number(normalized.lastBackupAt) || null;
    normalized.data ||= {};
    normalized.data.settings = { ...DEFAULT_SETTINGS, ...(normalized.data.settings ?? {}) };
    normalized.data.scores = Array.isArray(normalized.data.scores) ? normalized.data.scores : [];
    normalized.data.keyStats = normalized.data.keyStats && typeof normalized.data.keyStats === "object" && !Array.isArray(normalized.data.keyStats) ? normalized.data.keyStats : {};
    normalized.data.keyHistory = Array.isArray(normalized.data.keyHistory) ? normalized.data.keyHistory : [];
    normalized.data.pairStats = normalized.data.pairStats && typeof normalized.data.pairStats === "object" && !Array.isArray(normalized.data.pairStats) ? normalized.data.pairStats : {};
    normalized.data.achievements = normalized.data.achievements && typeof normalized.data.achievements === "object" && !Array.isArray(normalized.data.achievements) ? normalized.data.achievements : {};
    return normalized;
  }

  loadOrMigrateProfiles() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.profiles));
      if (Array.isArray(stored) && stored.length) return stored.map(profile => this.normalizeProfile(profile));
    } catch {}

    let legacySettings = { ...DEFAULT_SETTINGS };
    let legacyScores = [];
    let legacyKeyStats = {};
    let legacyKeyHistory = [];
    let hadLegacyData = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.legacySettings);
      if (raw) { legacySettings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }; hadLegacyData = true; }
    } catch {}
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.legacyScores));
      if (Array.isArray(parsed) && parsed.length) { legacyScores = parsed; hadLegacyData = true; }
    } catch {}
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.legacyKeyStats));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length) { legacyKeyStats = parsed; hadLegacyData = true; }
    } catch {}
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.legacyKeyHistory));
      if (Array.isArray(parsed) && parsed.length) { legacyKeyHistory = parsed; hadLegacyData = true; }
    } catch {}

    const profile = this.createProfileRecord("Player 1", "initials", {
      settings: legacySettings, scores: legacyScores, keyStats: legacyKeyStats, keyHistory: legacyKeyHistory, pairStats: {}, achievements: {}
    });
    const profiles = [profile];
    localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(profiles));
    localStorage.setItem(STORAGE_KEYS.activeProfile, profile.id);
    if (hadLegacyData) localStorage.setItem("blakeBreacher.profileMigrationNotice.v1", "1");
    return profiles;
  }

  consumeMigrationMessage() {
    const key = "blakeBreacher.profileMigrationNotice.v1";
    if (localStorage.getItem(key) !== "1") return "";
    localStorage.removeItem(key);
    return "Your existing v0.8.3 scores, settings, and adaptive typing history were migrated into Player 1. The original legacy data was left untouched as a fallback.";
  }

  resolveActiveProfileId() {
    const stored = localStorage.getItem(STORAGE_KEYS.activeProfile);
    if (stored && this.profiles.some(profile => profile.id === stored)) return stored;
    const fallback = this.profiles[0]?.id;
    if (fallback) localStorage.setItem(STORAGE_KEYS.activeProfile, fallback);
    return fallback;
  }

  getActiveProfile() {
    if (this.activeProfileId === "guest") return this.guestProfile;
    return this.profiles.find(profile => profile.id === this.activeProfileId) ?? this.profiles[0] ?? null;
  }

  persistProfiles() {
    localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(this.profiles));
  }

  persistActiveProfile() {
    const profile = this.getActiveProfile();
    if (!profile) return;
    profile.data = {
      settings: this.cloneData(this.settings),
      scores: this.cloneData(this.scores),
      keyStats: this.cloneData(this.keyStats),
      keyHistory: this.cloneData(this.keyHistory),
      pairStats: this.cloneData(this.pairStats),
      achievements: this.cloneData(this.achievements)
    };
    profile.updatedAt = Date.now();
    if (this.activeProfileId !== "guest") this.persistProfiles();
  }

  loadActiveProfileState() {
    this.settings = this.loadSettings();
    this.scores = this.loadScores();
    this.keyStats = this.loadKeyStats();
    this.keyHistory = this.loadKeyHistory();
    this.pairStats = this.loadPairStats();
    this.achievements = this.loadAchievements();
    this.syncAchievements({ notify: false });
  }

  switchProfile(profileId) {
    this.stopActiveGame();
    this.tournament = null;
    this.arcadeChallenge = null;
    if (this.activeProfileId !== "guest") this.persistActiveProfile();

    if (profileId === "guest") {
      this.guestProfile = this.createProfileRecord("Guest", "guest", {
        settings: { ...DEFAULT_SETTINGS, theme: this.settings?.theme ?? "classic" },
        scores: [], keyStats: {}, keyHistory: [], pairStats: {}, achievements: {}
      });
      this.guestProfile.id = "guest";
      this.activeProfileId = "guest";
    } else {
      const target = this.profiles.find(profile => profile.id === profileId);
      if (!target) return;
      this.guestProfile = null;
      this.activeProfileId = target.id;
      localStorage.setItem(STORAGE_KEYS.activeProfile, target.id);
    }

    this.loadActiveProfileState();
    this.applyTheme(this.settings.theme);
    this.engine?.setSound(this.settings.sound);
    this.lastActivity = null;
    this.pendingLessonId = null;
    this.renderMenu();
    this.renderLessons();
    this.renderSettings();
    this.renderScoreboard();
    this.renderProgress();
    this.renderAchievements();
    this.renderReports();
    this.renderProfiles();
    this.updateProfileChrome();
    this.showScreen("title");
  }

  openProfileEditor(mode, profileId = null) {
    this.profileEditorMode = mode;
    this.editingProfileId = profileId;
    const profile = mode === "rename" ? this.profiles.find(item => item.id === profileId) : null;
    this.ui.profileDialogTitle.textContent = mode === "rename" ? "Edit Profile" : "Create Profile";
    this.ui.profileSaveButton.textContent = mode === "rename" ? "Save Profile" : "Create Profile";
    this.ui.profileNameInput.value = profile?.name ?? "";
    this.ui.profileAvatarSelect.value = profile?.avatar ?? "initials";
    this.ui.profileEditorNote.textContent = mode === "rename"
      ? "Renaming or changing the icon does not affect this learner's history."
      : "A new profile starts with fresh scores and adaptive data. Current interface preferences are copied as a starting point.";
    this.ui.profileDialog.showModal();
    requestAnimationFrame(() => { this.ui.profileNameInput.focus(); this.ui.profileNameInput.select(); });
  }

  saveProfileEditor() {
    const name = this.ui.profileNameInput.value.trim();
    if (!name) return;
    const duplicate = this.profiles.some(profile => profile.id !== this.editingProfileId && profile.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      this.ui.profileEditorNote.textContent = "That profile name is already in use. Choose another name.";
      this.ui.profileNameInput.focus();
      return;
    }
    const avatar = this.ui.profileAvatarSelect.value;
    if (this.profileEditorMode === "rename") {
      const profile = this.profiles.find(item => item.id === this.editingProfileId);
      if (!profile) return;
      profile.name = name.slice(0, 28);
      profile.avatar = avatar;
      profile.updatedAt = Date.now();
      this.persistProfiles();
      this.ui.profileDialog.close();
      this.renderProfiles();
      this.updateProfileChrome();
      return;
    }

    const profile = this.createProfileRecord(name, avatar, {
      settings: { ...DEFAULT_SETTINGS, ...this.settings },
      scores: [], keyStats: {}, keyHistory: [], pairStats: {}, achievements: {}
    });
    this.profiles.push(profile);
    this.persistProfiles();
    this.ui.profileDialog.close();
    this.switchProfile(profile.id);
  }

  deleteProfile(profileId) {
    const profile = this.profiles.find(item => item.id === profileId);
    if (!profile) return;
    if (!confirm(`Delete ${profile.name} and all of that profile's local scores, progress, and adaptive data? This cannot be undone.`)) return;
    const wasActive = this.activeProfileId === profileId;
    this.profiles = this.profiles.filter(item => item.id !== profileId);
    if (!this.profiles.length) this.profiles.push(this.createProfileRecord("Player 1", "initials"));
    this.persistProfiles();
    if (wasActive) {
      this.activeProfileId = this.profiles[0].id;
      localStorage.setItem(STORAGE_KEYS.activeProfile, this.activeProfileId);
      this.loadActiveProfileState();
      this.applyTheme(this.settings.theme);
      this.engine?.setSound(this.settings.sound);
    }
    this.renderMenu();
    this.renderLessons();
    this.renderScoreboard();
    this.renderProgress();
    this.renderAchievements();
    this.renderReports();
    this.renderProfiles();
    this.updateProfileChrome();
  }

  getSaveEnvelope(format, payload = {}) {
    return {
      app: "Blake Breacher Teaches Typing",
      appVersion: "0.12",
      schemaVersion: 1,
      format,
      exportedAt: new Date().toISOString(),
      ...payload
    };
  }

  sanitizeFilename(value = "profile") {
    return String(value).trim().replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "profile";
  }

  downloadJson(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  setBackupStatus(message, kind = "") {
    if (!this.ui.backupStatus) return;
    this.ui.backupStatus.textContent = message;
    this.ui.backupStatus.className = `backup-status ${kind}`.trim();
  }

  markBackupCreated(scope = "active") {
    const now = Date.now();
    if (scope === "all") {
      this.profiles.forEach(profile => { profile.lastBackupAt = now; });
      this.persistProfiles();
    } else if (this.activeProfileId !== "guest") {
      const profile = this.getActiveProfile();
      if (profile) { profile.lastBackupAt = now; this.persistProfiles(); }
    }
    this.renderBackupReminder();
  }

  renderBackupReminder() {
    const banner = this.ui.backupReminderBanner;
    if (!banner) return;
    if (this.activeProfileId === "guest" || this.settings?.backupReminder === false) {
      banner.hidden = true;
      return;
    }
    const sessions = this.scores?.length ?? 0;
    const profile = this.getActiveProfile();
    const last = Number(profile?.lastBackupAt) || 0;
    const age = last ? Date.now() - last : Infinity;
    const due = sessions >= 10 && age >= 14 * 24 * 60 * 60 * 1000;
    banner.hidden = !due;
  }

  exportActiveProfile() {
    if (this.activeProfileId !== "guest") this.persistActiveProfile();
    const profile = this.getActiveProfile();
    if (!profile) return;
    const exported = this.cloneData(profile);
    const payload = this.getSaveEnvelope("hyperSoftProfile", { profile: exported });
    const date = new Date().toISOString().slice(0, 10);
    this.downloadJson(payload, `BlakeBreacher-${this.sanitizeFilename(profile.name)}-${date}.json`);
    this.markBackupCreated();
    this.setBackupStatus(`${profile.name} exported successfully. Keep the JSON file somewhere safer than Blake keeps work devices.`, "good");
  }

  exportAllProfiles() {
    if (this.activeProfileId !== "guest") this.persistActiveProfile();
    const payload = this.getSaveEnvelope("hyperSoftBackup", {
      activeProfileId: this.activeProfileId === "guest" ? (this.profiles[0]?.id ?? null) : this.activeProfileId,
      profiles: this.cloneData(this.profiles)
    });
    const date = new Date().toISOString().slice(0, 10);
    this.downloadJson(payload, `BlakeBreacher-All-Profiles-${date}.json`);
    this.markBackupCreated("all");
    this.setBackupStatus(`Exported ${this.profiles.length} persistent ${this.profiles.length === 1 ? "profile" : "profiles"} in one backup.`, "good");
  }

  readJsonFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || file.size > 12 * 1024 * 1024) {
        reject(new Error("That file is missing or exceeds the 12 MB import limit."));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try { resolve(JSON.parse(String(reader.result ?? ""))); }
        catch { reject(new Error("The selected file is not valid JSON.")); }
      };
      reader.onerror = () => reject(new Error("The selected file could not be read."));
      reader.readAsText(file);
    });
  }

  unwrapImportedProfile(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("This is not a HyperSoft profile file.");
    if (Number(payload.schemaVersion || 1) > 1) throw new Error("This save was created by a newer HyperSoft save format and cannot be imported by v0.12.");
    const raw = payload.format === "hyperSoftProfile" ? payload.profile : payload;
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || !raw.data) throw new Error("No learner profile was found in that file.");
    const imported = this.normalizeProfile(this.cloneData(raw));
    imported.id = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    imported.createdAt = Number(imported.createdAt) || Date.now();
    imported.updatedAt = Date.now();
    imported.name = this.getUniqueImportedName(imported.name);
    return imported;
  }

  getUniqueImportedName(name) {
    const base = String(name || "Imported Player").trim().slice(0, 24) || "Imported Player";
    const used = new Set(this.profiles.map(profile => profile.name.toLowerCase()));
    if (!used.has(base.toLowerCase())) return base;
    let index = 2;
    while (used.has(`${base} (${index})`.toLowerCase())) index += 1;
    return `${base} (${index})`.slice(0, 28);
  }

  async importProfileFile(file) {
    try {
      const payload = await this.readJsonFile(file);
      const profile = this.unwrapImportedProfile(payload);
      this.profiles.push(profile);
      this.persistProfiles();
      this.setBackupStatus(`Imported ${profile.name}. Its scores, achievements, settings, and adaptive history are intact.`, "good");
      this.renderProfiles();
      if (confirm(`${profile.name} was imported successfully. Switch to that profile now?`)) this.switchProfile(profile.id);
    } catch (error) {
      this.setBackupStatus(error.message || "The profile could not be imported.", "bad");
    }
  }

  unwrapFullBackup(payload) {
    if (Array.isArray(payload)) payload = { format: "hyperSoftBackup", schemaVersion: 1, profiles: payload };
    if (!payload || typeof payload !== "object" || payload.format !== "hyperSoftBackup" || !Array.isArray(payload.profiles) || !payload.profiles.length) {
      throw new Error("This file is not a complete HyperSoft profile backup.");
    }
    if (Number(payload.schemaVersion || 1) > 1) throw new Error("This backup uses a newer save format than v0.12 supports.");
    const seen = new Set();
    const profiles = payload.profiles.map(raw => {
      const profile = this.normalizeProfile(this.cloneData(raw));
      if (!profile.id || seen.has(profile.id)) profile.id = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      seen.add(profile.id);
      return profile;
    });
    return { profiles, activeProfileId: payload.activeProfileId };
  }

  async restoreBackupFile(file) {
    try {
      const payload = await this.readJsonFile(file);
      const restored = this.unwrapFullBackup(payload);
      const count = restored.profiles.length;
      if (!confirm(`Restore ${count} ${count === 1 ? "profile" : "profiles"} from this backup? This will replace all current persistent profiles on this browser.`)) return;
      if (!confirm("Final confirmation: current persistent profiles will be replaced. Guest data, if any, will also be discarded.")) return;
      this.stopActiveGame();
      this.profiles = restored.profiles;
      this.guestProfile = null;
      const preferred = this.profiles.some(profile => profile.id === restored.activeProfileId) ? restored.activeProfileId : this.profiles[0].id;
      this.activeProfileId = preferred;
      this.persistProfiles();
      localStorage.setItem(STORAGE_KEYS.activeProfile, preferred);
      this.loadActiveProfileState();
      this.applyTheme(this.settings.theme);
      this.engine?.setSound(this.settings.sound);
      this.syncAchievements({ notify: false });
      this.renderMenu(); this.renderLessons(); this.renderSettings(); this.renderScoreboard(); this.renderProgress(); this.renderAchievements(); this.renderReports(); this.renderProfiles(); this.updateProfileChrome();
      this.setBackupStatus(`Full backup restored. ${count} ${count === 1 ? "profile is" : "profiles are"} available.`, "good");
      this.showScreen("profiles");
    } catch (error) {
      this.setBackupStatus(error.message || "The backup could not be restored.", "bad");
    }
  }

  resetCurrentProfileData() {
    const profile = this.getActiveProfile();
    if (!profile) return;
    if (!confirm(`Reset all progress for ${profile.name}? Scores, achievements, adaptive history, and settings will be cleared. The profile name/icon will remain.`)) return;
    if (this.activeProfileId === "guest") {
      this.guestProfile.data = { settings: { ...DEFAULT_SETTINGS }, scores: [], keyStats: {}, keyHistory: [], pairStats: {}, achievements: {} };
    } else {
      profile.data = { settings: { ...DEFAULT_SETTINGS }, scores: [], keyStats: {}, keyHistory: [], pairStats: {}, achievements: {} };
      profile.updatedAt = Date.now();
      this.persistProfiles();
    }
    this.loadActiveProfileState();
    this.applyTheme(this.settings.theme);
    this.engine?.setSound(this.settings.sound);
    this.renderMenu(); this.renderLessons(); this.renderSettings(); this.renderScoreboard(); this.renderProgress(); this.renderAchievements(); this.renderReports(); this.renderProfiles(); this.updateProfileChrome();
    this.setBackupStatus(`${profile.name} was reset to a fresh learner file.`, "good");
  }

  resetAllLocalData() {
    if (!confirm("Reset ALL Blake Breacher local data? This removes every profile, score, achievement, adaptive record, and preference in this browser.")) return;
    if (!confirm("This cannot be undone unless you exported a backup. Erase everything now?")) return;
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem("blakeBreacher.profileMigrationNotice.v1");
    location.reload();
  }

  getProfileAvatar(profile, compact = false) {
    if (!profile) return "?";
    if (profile.id === "guest" || profile.avatar === "guest") return compact ? "G" : "GUEST";
    const symbols = { keyboard: "⌨", star: "★", briefcase: "▣", diamond: "◆", bolt: "ϟ" };
    if (symbols[profile.avatar]) return symbols[profile.avatar];
    const initials = profile.name.split(/\\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("");
    return initials || "P";
  }

  getProfileStats(profile) {
    const rows = profile?.data?.scores ?? [];
    const sessionRows = rows.filter(row => row.activityType !== "tournament");
    const lessons = sessionRows.filter(row => row.activityType === "lesson");
    const bestWpm = sessionRows.length ? Math.max(...sessionRows.map(row => Number(row.wpm) || 0)) : 0;
    const avgAccuracy = sessionRows.length ? Math.round(sessionRows.reduce((sum, row) => sum + (Number(row.accuracy) || 0), 0) / sessionRows.length) : 0;
    const achievements = Object.keys(profile?.data?.achievements ?? {}).length;
    const tournaments = rows.filter(row => row.activityType === "tournament").length;
    return { sessions: sessionRows.length, lessons: lessons.length, bestWpm, avgAccuracy, achievements, tournaments };
  }

  renderProfiles() {
    if (!this.ui.profileGrid) return;
    this.ui.profileMigrationNote.textContent = this.migrationMessage || "";
    const cards = this.profiles.map(profile => {
      const stats = this.getProfileStats(profile);
      const active = this.activeProfileId === profile.id;
      return `<article class="profile-card ${active ? "active" : ""}">
        <div class="profile-card-head">
          <div class="profile-avatar">${this.escapeHtml(this.getProfileAvatar(profile))}</div>
          <div><h3>${this.escapeHtml(profile.name)}</h3><div class="profile-subline">Local learner profile</div>${active ? `<span class="profile-active-tag">Active</span>` : ""}</div>
        </div>
        <div class="profile-card-stats">
          <div class="profile-mini-stat"><span>Sessions</span><strong>${stats.sessions}</strong></div>
          <div class="profile-mini-stat"><span>Best WPM</span><strong>${stats.bestWpm || "—"}</strong></div>
          <div class="profile-mini-stat"><span>Accuracy</span><strong>${stats.sessions ? `${stats.avgAccuracy}%` : "—"}</strong></div>
          <div class="profile-mini-stat"><span>Badges</span><strong>${stats.achievements}</strong></div>
        </div>
        <div class="profile-card-actions">
          ${active ? "" : `<button class="primary" type="button" data-profile-switch="${profile.id}">Use Profile</button>`}
          <button class="secondary" type="button" data-profile-edit="${profile.id}">Rename / Icon</button>
          <button class="danger-ghost" type="button" data-profile-delete="${profile.id}">Delete</button>
        </div>
      </article>`;
    }).join("");

    const guestActive = this.activeProfileId === "guest";
    const guestStats = guestActive ? this.getProfileStats(this.guestProfile) : { sessions: 0, bestWpm: 0, avgAccuracy: 0 };
    this.ui.profileGrid.innerHTML = cards + `<article class="profile-card guest ${guestActive ? "active" : ""}">
      <div class="profile-card-head"><div class="profile-avatar">GUEST</div><div><h3>Guest</h3><div class="profile-subline">Temporary training session</div><span class="profile-guest-tag">Not saved</span></div></div>
      <div class="profile-card-stats">
        <div class="profile-mini-stat"><span>Sessions</span><strong>${guestStats.sessions}</strong></div>
        <div class="profile-mini-stat"><span>Best WPM</span><strong>${guestStats.bestWpm || "—"}</strong></div>
        <div class="profile-mini-stat"><span>Saved</span><strong>No</strong></div>
      </div>
      <div class="profile-card-actions">${guestActive ? `<button class="secondary" type="button" data-profile-switch="${this.profiles[0]?.id ?? ""}">Exit Guest</button>` : `<button class="secondary" type="button" data-profile-switch="guest">Use Guest Mode</button>`}</div>
    </article>`;

    this.ui.profileGrid.querySelectorAll("[data-profile-switch]").forEach(button => button.addEventListener("click", () => this.switchProfile(button.dataset.profileSwitch)));
    this.ui.profileGrid.querySelectorAll("[data-profile-edit]").forEach(button => button.addEventListener("click", () => this.openProfileEditor("rename", button.dataset.profileEdit)));
    this.ui.profileGrid.querySelectorAll("[data-profile-delete]").forEach(button => button.addEventListener("click", () => this.deleteProfile(button.dataset.profileDelete)));
  }

  updateProfileChrome() {
    const profile = this.getActiveProfile();
    if (!profile) return;
    const stats = this.getProfileStats(profile);
    const avatar = this.getProfileAvatar(profile, true);
    this.ui.profileQuickAvatar.textContent = avatar;
    this.ui.profileQuickName.textContent = profile.name;
    this.ui.activeProfileStatus.textContent = this.activeProfileId === "guest" ? "Profile: Guest • not saved" : `Profile: ${profile.name}`;
    this.ui.activeProfileBanner.innerHTML = `<span class="profile-banner-avatar">${this.escapeHtml(avatar)}</span><span><strong>${this.escapeHtml(profile.name)}</strong><small>${this.activeProfileId === "guest" ? "Guest mode — progress disappears when you leave" : `${stats.sessions} sessions • ${stats.achievements} badges • Best ${stats.bestWpm || "—"} WPM • Open Profiles to switch learner`}</small></span>`;
    this.renderBackupReminder();
  }

  loadSettings() {
    const profile = this.getActiveProfile();
    return { ...DEFAULT_SETTINGS, ...(profile?.data?.settings ?? {}) };
  }

  loadScores() {
    const profile = this.getActiveProfile();
    return Array.isArray(profile?.data?.scores) ? this.cloneData(profile.data.scores) : [];
  }

  loadKeyStats() {
    const profile = this.getActiveProfile();
    const value = profile?.data?.keyStats;
    return value && typeof value === "object" && !Array.isArray(value) ? this.cloneData(value) : {};
  }

  loadPairStats() {
    const profile = this.getActiveProfile();
    const value = profile?.data?.pairStats;
    return value && typeof value === "object" && !Array.isArray(value) ? this.cloneData(value) : {};
  }

  mergePairStats(sessionStats = {}) {
    Object.entries(sessionStats).forEach(([pair, stats]) => {
      if (!/^[a-z]{2}$/.test(pair) || !stats || !Number.isFinite(stats.attempts)) return;
      const current = this.pairStats[pair] ?? { attempts: 0, correct: 0, errors: 0 };
      current.attempts += stats.attempts ?? 0;
      current.correct += stats.correct ?? 0;
      current.errors += stats.errors ?? 0;
      this.pairStats[pair] = current;
    });
    this.persistActiveProfile();
  }

  getWeakPairs(limit = 6) {
    return Object.entries(this.pairStats ?? {})
      .map(([pair, stats]) => ({
        pair,
        ...stats,
        accuracy: stats.attempts ? (stats.correct / stats.attempts) * 100 : 100
      }))
      .filter(item => item.attempts >= 3 && item.errors > 0)
      .sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors || b.attempts - a.attempts)
      .slice(0, limit);
  }

  mergeKeyStats(sessionStats = {}) {
    Object.entries(sessionStats).forEach(([key, stats]) => {
      if (!stats || !Number.isFinite(stats.attempts)) return;
      const current = this.keyStats[key] ?? { attempts: 0, correct: 0, errors: 0 };
      current.attempts += stats.attempts ?? 0;
      current.correct += stats.correct ?? 0;
      current.errors += stats.errors ?? 0;
      this.keyStats[key] = current;
    });
    this.persistActiveProfile();
  }

  getWeakKeys(limit = 6) {
    return Object.entries(this.keyStats)
      .map(([key, stats]) => ({
        key,
        ...stats,
        accuracy: stats.attempts ? (stats.correct / stats.attempts) * 100 : 100
      }))
      .filter(item => item.attempts >= 5 && item.errors > 0)
      .sort((a, b) => a.accuracy - b.accuracy || b.errors - a.errors || b.attempts - a.attempts)
      .slice(0, limit);
  }

  formatKeyLabel(key) {
    if (/^[A-Z]$/.test(key)) return `${key} (Shift)`;
    if (key === " ") return "Space";
    return key;
  }

  escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  applyTheme(theme = "classic") {
    const validThemes = new Set(["classic", "teal98", "officeBeige", "midnight", "plumDeluxe"]);
    document.documentElement.dataset.theme = validThemes.has(theme) ? theme : "classic";
  }

  formatPacificTimestamp(timestamp) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", second: "2-digit",
      hour12: true, timeZoneName: "short"
    }).format(new Date(timestamp));
  }

  rotateBlakeQuote() {
    this.ui.titleQuote.textContent = BLAKE_QUOTES[Math.floor(Math.random() * BLAKE_QUOTES.length)];
    if (!this.ui.homeBlakeTip?.textContent) this.rotateHomePersonality();
  }

  formatTime(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
}

window.addEventListener("DOMContentLoaded", () => new GameManager());
