import { TypingEngine } from "./typingEngine.js";
import { APP_VERSION, RELEASE_NAME, DIFFICULTY_CONFIG, MODE_METADATA, BLAKE_QUOTES } from "./config.js";
import { LESSON_METADATA } from "./lessonConfig.js";
import { SMART_PRACTICE_MODES, getSmartPoolStats } from "./smartTypingContent.js";
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from "./achievementConfig.js";
import {
  BLAKE_PRODUCTIVITY_TIPS, HYPERSOFT_NOTICES, BLAKE_INCIDENTS,
  LOADING_MESSAGES, GAME_PERSONALITY, RESULT_COMPLIANCE_NOTES
} from "./personalityConfig.js";
import { ScrollingTypingExercise } from "./scrollingTypingExercise.js";
import { TypingAssessmentExercise } from "./typingAssessment.js";
import { analyzeTechniqueProfile } from "./techniqueCoach.js";
import { CUSTOM_PRACTICE_DEFAULTS, normalizeCustomPracticeConfig, getCustomPracticePreset, buildCustomPracticeLesson } from "./customPracticeBuilder.js";
import { REAL_WORLD_MODES, getRealWorldMode, RealWorldTypingExercise } from "./realWorldTypingLab.js";
import { ACCURACY_CLINIC_PROTOCOLS, getAccuracyClinicProtocol, buildAccuracyClinicProtocol, AccuracyClinicExercise } from "./accuracyClinic.js";
import { TEN_KEY_PROTOCOLS, getTenKeyProtocol, TenKeyExercise } from "./tenKeyAcademy.js";
import { PUNCTUATION_BUSINESS_PROTOCOLS, getPunctuationBusinessProtocol, PunctuationBusinessExercise } from "./punctuationBusinessLab.js";
import { CERTIFICATION_DURATIONS, CERTIFICATION_STANDARDS, CERTIFICATION_CONTENT, getCertificationDuration, getCertificationStandard, getCertificationContent, TimedCertificationExercise } from "./timedCertification.js";
import { DAILY_PLAN_DURATIONS, getPacificDayKey, normalizeDailyPlanState, buildDailyTrainingPlan, getDailyPlanCompletion } from "./dailyTrainingPlan.js";
import { THEORY_CATEGORIES, THEORY_TOPICS, THEORY_GLOSSARY, normalizeTheoryProgress, getTheoryProgressSummary } from "./typingTheoryLibrary.js";
import { SUITE_MODULE_CATALOG, ONBOARDING_DEFAULTS, NAVIGATION_DEFAULTS, normalizeOnboardingState, normalizeNavigationState, recordSuiteModuleVisit, toggleSuiteModuleFavorite, getSuiteModule, buildSuiteRecommendedPath, getModuleCatalogGroups, filterModuleCatalog, getSmartContinueModule, buildDiagnosticsSummary } from "./suiteIntegration.js";
import { hyperSoftGetFocusableElements, hyperSoftElementCanReceiveFocus } from "./accessibilityUtils.js";
import { SYSTEM_ROUTE_MAP, SYSTEM_REPORT_TYPES, runHyperSoftSystemTortureTest } from "./systemTortureTest.js";
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
  hyper98Palette: "blue",
  sound: false,
  soundVolume: "normal",
  multimedia: "standard",
  backupReminder: true,
  startup: true,
  lessonKeyboardCoach: true,
  motionPreference: "system"
};

const BLAKE_ASSET = globalThis.__BLAKE_ASSET || "./assets/common/blake.png";

const TRAINEE_MODULES = [
  {
    id: "workstation", number: 1, title: "Workstation Setup", icon: "▣", type: "quiz",
    summary: "Posture, chair height, wrists, and where the keyboard belongs.",
    theory: [
      "Sit back in the chair with shoulders relaxed and elbows close to your sides.",
      "Keep forearms roughly level with the keyboard. Your wrists should float neutrally rather than bending sharply upward or resting heavily on the desk while typing.",
      "Place the keyboard directly in front of you. If you constantly reach or twist, speed practice will reinforce a bad movement pattern."
    ],
    principle: "Comfortable neutral posture makes repeatable movement possible. Typing speed is a coordination skill, not a test of how hard you can press keys.",
    question: "Which setup is best for sustained touch typing?",
    options: ["Wrists sharply bent upward", "Keyboard off to one side", "Relaxed shoulders with neutral wrists"], answer: 2
  },
  {
    id: "keyboardMap", number: 2, title: "Keyboard Map", icon: "⌨", type: "quiz",
    summary: "Rows, anchor keys, modifiers, and why F and J have bumps.",
    theory: [
      "The letter area is organized into top, home, and bottom rows. The home row is your reference position.",
      "The raised marks on F and J let your index fingers relocate home position without looking down.",
      "Shift, Tab, Enter, Backspace, and Space are movement/command keys. Touch typing treats them as part of the keyboard map, not interruptions to it."
    ],
    principle: "You should be able to re-orient your hands by touch. Looking down breaks the visual-to-motor loop you are trying to build.",
    question: "What are the raised marks on F and J primarily for?",
    options: ["Decoration", "Finding home position by touch", "Marking the fastest keys"], answer: 1
  },
  {
    id: "homeRow", number: 3, title: "Home Row Anchors", icon: "A", type: "typing",
    summary: "ASDF and JKL; as the neutral launch position.",
    theory: [
      "Left hand rests on A S D F. Right hand rests on J K L ;. Index fingers sit on the F and J guide bumps.",
      "After reaching for another key, return toward home instead of letting your hands drift across the keyboard.",
      "Space is normally struck with a thumb. Keep the other fingers available for their zones."
    ],
    principle: "Home row is not where every keystroke happens; it is the reference point your hands repeatedly return toward.",
    target: "asdf jkl; asdf jkl;"
  },
  {
    id: "fingerZones", number: 4, title: "Finger Zones", icon: "✋", type: "quiz",
    summary: "Assign keys to fingers so movement becomes consistent instead of improvised.",
    theory: [
      "Each finger owns a vertical or diagonal zone. Index fingers cover the widest zones; pinkies handle edge keys and many modifiers.",
      "Using the same finger for the same key builds predictable motor memory. Random finger choice can feel fast at first but becomes a ceiling later.",
      "Do not over-stretch. Move the assigned finger, strike the key lightly, then recover your hand position."
    ],
    principle: "Consistency matters more than what feels fastest on one isolated word.",
    question: "Why assign keys to specific fingers?",
    options: ["To make the keyboard harder", "To build repeatable motor memory", "Because every key must be hit equally hard"], answer: 1
  },
  {
    id: "eyesUp", number: 5, title: "Eyes Up", icon: "◉", type: "quiz",
    summary: "Touch typing, visual attention, and breaking the hunt-and-peck loop.",
    theory: [
      "Keep your eyes on the source text or screen whenever practical. Occasional orientation is normal for a beginner; constant checking is the habit to eliminate.",
      "When you look down, your brain stops predicting finger movement and starts visually searching for keys.",
      "Accuracy may temporarily fall when you stop looking. That is expected. Slow down enough to preserve deliberate finger choices."
    ],
    principle: "The goal is not 'never make a mistake.' The goal is to know where the key should be before your eyes verify it.",
    question: "What should you usually do when accuracy drops after you stop looking at the keyboard?",
    options: ["Immediately return to hunt-and-peck", "Slow down and preserve correct finger movement", "Type harder"], answer: 1
  },
  {
    id: "rhythm", number: 6, title: "Rhythm Before Speed", icon: "♪", type: "typing",
    summary: "Even cadence, accuracy, and why bursts are not the same thing as sustainable WPM.",
    theory: [
      "A smooth cadence is easier to sustain than alternating between frantic bursts and long pauses.",
      "Speed grows from accurate repetitions. Practicing errors at high speed teaches the wrong sequence just as effectively as practicing the right one.",
      "Use WPM as a measurement, not as an instruction to tense up."
    ],
    principle: "Aim for an even stream of deliberate keystrokes. Speed is the result of reduced hesitation.",
    target: "slow is smooth smooth becomes fast"
  },
  {
    id: "controlKeys", number: 7, title: "Control Keys", icon: "⇧", type: "typing",
    summary: "Space, Shift, Enter, Backspace, and clean transitions between words.",
    theory: [
      "Use the Shift key opposite the hand typing the capital letter when possible. This keeps the letter hand available for its normal reach.",
      "Strike Space once and move on. Double spaces and hesitant spaces are rhythm errors just like letter errors.",
      "Backspace is a correction tool, not a reason to stare at the keyboard. Correct the mistake and rejoin the text."
    ],
    principle: "Modifiers are part of touch typing. A typist who knows the letters but has to search for punctuation and Shift is not yet fluent across the keyboard.",
    target: "Blake Types Fast."
  },
  {
    id: "readiness", number: 8, title: "Readiness Check", icon: "✓", type: "typing",
    summary: "A short no-pressure check before entering the formal curriculum.",
    theory: [
      "This is not a speed test. Sit correctly, place your fingers deliberately, keep your eyes up, and type the line cleanly.",
      "If you need to slow down, slow down. Formal Lessons will build speed progressively.",
      "Passing simply means you can follow the basic technique without treating the keyboard as a visual search puzzle."
    ],
    principle: "Accuracy and repeatable technique first. WPM comes after the movement pattern is trustworthy.",
    target: "accuracy first rhythm second speed follows"
  }
];


const ASSESSMENT_METADATA = {
  id: "placementAssessment",
  title: "Typing Assessment",
  subtitle: "Three-phase placement diagnostic for sustainable speed, first-attempt accuracy, keyboard range, and rhythm.",
  guide: [
    "The assessment contains three phases: foundational prose, mixed keyboard control, and a sustained passage.",
    "Wrong keys count against accuracy but do not advance the passage. Type the highlighted expected key to continue.",
    "Backspace is recorded as correction/hesitation behavior during this diagnostic; it does not rewind the passage.",
    "HyperSoft combines WPM, accuracy, rhythm consistency, hesitations, and weak-key evidence to recommend a starting path.",
    "Placement is guidance, not a lockout. Every training module remains available afterward."
  ]
};


class GameManager {
  constructor() {
    this.ui = this.collectUI();
    this.storageWarning = "";
    this.storageVolatile = false;
    this.profiles = this.loadOrMigrateProfiles();
    this.activeProfileId = this.resolveActiveProfileId();
    this.guestProfile = null;
    this.profileEditorMode = "create";
    this.editingProfileId = null;
    this.migrationMessage = this.consumeMigrationMessage();

    this.settings = this.loadSettings();
    this.applyTheme(this.settings.theme, this.settings.hyper98Palette);
    this.applyMotionPreference();
    this.scores = this.loadScores();
    this.keyStats = this.loadKeyStats();
    this.keyHistory = this.loadKeyHistory();
    this.pairStats = this.loadPairStats();
    this.achievements = this.loadAchievements();
    this.traineeProgress = this.loadTraineeProgress();
    this.customPracticePresets = this.loadCustomPracticePresets();
    this.customPracticeLastConfig = this.loadCustomPracticeLastConfig();
    this.customPracticeDefinition = null;
    this.certificationConfig = { standardId: "general", contentId: "general", customWpm: 40, customAccuracy: 97 };
    this.dailyPlanState = this.loadDailyPlanState();
    this.dailyPlanHistory = this.loadDailyPlanHistory();
    this.dailyPlanReturnPending = false;
    this.theoryProgress = this.loadTheoryProgress();
    this.onboardingState = this.loadOnboardingState();
    this.navigationState = this.loadNavigationState();
    this.moduleExplorerQuery = "";
    this.moduleExplorerView = "all";
    this.currentTheoryTopicId = THEORY_TOPICS.find(topic => !this.theoryProgress[topic.id]?.reviewed)?.id ?? THEORY_TOPICS[0].id;
    this.theoryCategory = "all";
    this.theorySearch = "";
    this.theoryFeedback = "";
    this.currentTraineeStepId = TRAINEE_MODULES.find(item => !this.traineeProgress[item.id])?.id ?? TRAINEE_MODULES[0].id;
    this.syncAchievements({ notify: false });
    this.pendingLessonId = null;
    this.pendingGameId = null;
    this.pendingGameOptions = {};
    this.loadingTimeoutId = null;
    this.startupTimeoutIds = [];
    this.currentScreenName = "title";
    this.currentHomeTipIndex = -1;
    this.currentHomeNoticeIndex = -1;
    this.activeMode = null;
    this.activeGame = null;
    this.activityKind = "game";
    this.lastActivity = null;
    this.tournament = null;
    this.arcadeChallenge = null;
    this.hudTimerId = null;
    this.audioContext = null;
    this.notificationTimer = null;
    this.finishingActivity = false;
    // Monotonic activity token: stale timers/callbacks from an older game or lesson
    // can never finish or score a newer activity.
    this.activitySessionId = 0;
    this.dialogFocusReturn = new WeakMap();
    this.lastNonDialogFocus = null;
    this.lastInputModality = "pointer";

    this.engine = new TypingEngine({
      soundEnabled: this.settings.sound,
      soundVolume: this.settings.soundVolume,
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
    this.renderTrainee();
    this.renderTechniqueCoach();
    this.renderCustomPracticeBuilder();
    this.renderRealWorldLab();
    this.renderAccuracyClinic();
    this.renderTenKeyAcademy();
    this.renderPunctuationLab();
    this.renderCertificationTests();
    this.renderDailyPlan();
    this.renderTheoryLibrary();
    this.renderLessons(); this.renderSmartPracticeLab(); this.renderSmartPracticeWeakKeySummary();
    this.renderSettings();
    this.renderScoreboard();
    this.renderAchievements();
    this.renderReports();
    this.renderOffice();
    this.renderProfiles();
    this.renderHomeIntegration();
    this.renderDiagnostics();
    this.updateProfileChrome();
    this.rotateBlakeQuote();
    this.updateWorkspaceChrome("title");
    this.initializeStartupSequence();
  }

  collectUI() {
    return {
      screens: [...document.querySelectorAll(".screen")],
      titleScreen: document.getElementById("titleScreen"),
      appMain: document.getElementById("appMain"),
      screenChangeAnnouncer: document.getElementById("screenChangeAnnouncer"),
      homeRecommendedPath: document.getElementById("homeRecommendedPath"),
      homeContinuePanel: document.getElementById("homeContinuePanel"),
      homeFavoriteModules: document.getElementById("homeFavoriteModules"),
      homeRecentModules: document.getElementById("homeRecentModules"),
      navigationQuickAccess: document.getElementById("navigationQuickAccess"),
      moduleExplorerSearch: document.getElementById("moduleExplorerSearch"),
      moduleExplorerControls: document.getElementById("moduleExplorerControls"),
      moduleExplorerContent: document.getElementById("moduleExplorerContent"),
      onboardingDialog: document.getElementById("onboardingDialog"),
      onboardingForm: document.getElementById("onboardingForm"),
      onboardingGoalSelect: document.getElementById("onboardingGoalSelect"),
      onboardingPreview: document.getElementById("onboardingPreview"),
      diagnosticsResults: document.getElementById("diagnosticsResults"),
      tortureTestResults: document.getElementById("tortureTestResults"),
      officeScreen: document.getElementById("officeScreen"),
      profilesScreen: document.getElementById("profilesScreen"),
      traineeScreen: document.getElementById("traineeScreen"),
      assessmentScreen: document.getElementById("assessmentScreen"),
      traineeStationList: document.getElementById("traineeStationList"),
      traineeWorkstation: document.getElementById("traineeWorkstation"),
      assessmentLatest: document.getElementById("assessmentLatest"),
      assessmentHistory: document.getElementById("assessmentHistory"),
      assessmentStartButton: document.getElementById("assessmentStartButton"),
      assessmentRecommendedButton: document.getElementById("assessmentRecommendedButton"),
      techniqueScreen: document.getElementById("techniqueScreen"),
      techniqueSummary: document.getElementById("techniqueSummary"),
      techniqueMetrics: document.getElementById("techniqueMetrics"),
      techniquePlan: document.getElementById("techniquePlan"),
      techniqueWeaknesses: document.getElementById("techniqueWeaknesses"),
      techniqueAssessmentButton: document.getElementById("techniqueAssessmentButton"),
      techniquePrimaryActionButton: document.getElementById("techniquePrimaryActionButton"),
      customPracticeScreen: document.getElementById("customPracticeScreen"),
      customPracticeForm: document.getElementById("customPracticeForm"),
      customPracticeFocusSelect: document.getElementById("customPracticeFocusSelect"),
      customPracticeWordListSelect: document.getElementById("customPracticeWordListSelect"),
      customPracticeMinLength: document.getElementById("customPracticeMinLength"),
      customPracticeMaxLength: document.getElementById("customPracticeMaxLength"),
      customPracticeKeysInput: document.getElementById("customPracticeKeysInput"),
      customPracticePairsInput: document.getElementById("customPracticePairsInput"),
      customPracticeCapitalsToggle: document.getElementById("customPracticeCapitalsToggle"),
      customPracticePunctuationToggle: document.getElementById("customPracticePunctuationToggle"),
      customPracticeNumberRowToggle: document.getElementById("customPracticeNumberRowToggle"),
      customPracticeDurationSelect: document.getElementById("customPracticeDurationSelect"),
      customPracticeTargetWpm: document.getElementById("customPracticeTargetWpm"),
      customPracticeAccuracySelect: document.getElementById("customPracticeAccuracySelect"),
      customPracticePresetName: document.getElementById("customPracticePresetName"),
      customPracticePreview: document.getElementById("customPracticePreview"),
      customPracticeSavedPresets: document.getElementById("customPracticeSavedPresets"),
      customWeakKeyCount: document.getElementById("customWeakKeyCount"),
      customPairCount: document.getElementById("customPairCount"),
      customPracticeSavePresetButton: document.getElementById("customPracticeSavePresetButton"),
      customPracticeResetButton: document.getElementById("customPracticeResetButton"),
      realWorldScreen: document.getElementById("realWorldScreen"),
      realWorldGrid: document.getElementById("realWorldGrid"),
      realWorldSummary: document.getElementById("realWorldSummary"),
      realWorldHistory: document.getElementById("realWorldHistory"),
      accuracyClinicScreen: document.getElementById("accuracyClinicScreen"),
      accuracyClinicSummary: document.getElementById("accuracyClinicSummary"),
      accuracyClinicGrid: document.getElementById("accuracyClinicGrid"),
      accuracyClinicReview: document.getElementById("accuracyClinicReview"),
      accuracyClinicHistory: document.getElementById("accuracyClinicHistory"),
      tenKeyScreen: document.getElementById("tenKeyScreen"),
      tenKeySummary: document.getElementById("tenKeySummary"),
      tenKeyGrid: document.getElementById("tenKeyGrid"),
      tenKeyKeyMap: document.getElementById("tenKeyKeyMap"),
      tenKeyHistory: document.getElementById("tenKeyHistory"),
      punctuationScreen: document.getElementById("punctuationScreen"),
      punctuationSummary: document.getElementById("punctuationSummary"),
      punctuationGrid: document.getElementById("punctuationGrid"),
      punctuationReview: document.getElementById("punctuationReview"),
      punctuationHistory: document.getElementById("punctuationHistory"),
      certificationScreen: document.getElementById("certificationScreen"),
      certificationSummary: document.getElementById("certificationSummary"),
      certificationGrid: document.getElementById("certificationGrid"),
      certificationHistory: document.getElementById("certificationHistory"),
      certificationStandardSelect: document.getElementById("certificationStandardSelect"),
      certificationContentSelect: document.getElementById("certificationContentSelect"),
      certificationCustomFields: document.getElementById("certificationCustomFields"),
      certificationCustomWpm: document.getElementById("certificationCustomWpm"),
      certificationCustomAccuracy: document.getElementById("certificationCustomAccuracy"),
      dailyPlanScreen: document.getElementById("dailyPlanScreen"),
      dailyPlanDurationSelect: document.getElementById("dailyPlanDurationSelect"),
      dailyPlanGenerateButton: document.getElementById("dailyPlanGenerateButton"),
      dailyPlanStartNextButton: document.getElementById("dailyPlanStartNextButton"),
      dailyPlanSummary: document.getElementById("dailyPlanSummary"),
      dailyPlanSteps: document.getElementById("dailyPlanSteps"),
      dailyPlanEvidence: document.getElementById("dailyPlanEvidence"),
      dailyPlanHistory: document.getElementById("dailyPlanHistory"),
      theoryScreen: document.getElementById("theoryScreen"),
      theorySummary: document.getElementById("theorySummary"),
      theoryCategorySelect: document.getElementById("theoryCategorySelect"),
      theorySearchInput: document.getElementById("theorySearchInput"),
      theoryTopicList: document.getElementById("theoryTopicList"),
      theoryArticle: document.getElementById("theoryArticle"),
      theoryGlossary: document.getElementById("theoryGlossary"),
      traineeProgressText: document.getElementById("traineeProgressText"),
      traineeProgressFill: document.getElementById("traineeProgressFill"),
      traineeReadinessText: document.getElementById("traineeReadinessText"),
      lessonsScreen: document.getElementById("lessonsScreen"),
      smartPracticeScreen: document.getElementById("smartPracticeScreen"),
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
      startupOverlay: document.getElementById("startupOverlay"),
      startupStatus: document.getElementById("startupStatus"),
      startupProgressFill: document.getElementById("startupProgressFill"),
      startupSkipButton: document.getElementById("startupSkipButton"),
      currentScreenLabel: document.getElementById("currentScreenLabel"),
      currentScreenDetail: document.getElementById("currentScreenDetail"),
      workspaceDifficulty: document.getElementById("workspaceDifficulty"),
      workspaceWordList: document.getElementById("workspaceWordList"),
      hyper98ModuleIcon: document.getElementById("hyper98ModuleIcon"),
      hyper98CurriculumToggle: document.getElementById("hyper98CurriculumToggle"),
      hyper98CurriculumState: document.getElementById("hyper98CurriculumState"),
      hyper98HowButton: document.getElementById("hyper98HowButton"),
      hyper98BlakeTipsButton: document.getElementById("hyper98BlakeTipsButton"),
      hyper98WelcomeName: document.getElementById("hyper98WelcomeName"),
      helpDialog: document.getElementById("helpDialog"),
      helpDialogTitle: document.getElementById("helpDialogTitle"),
      helpModuleName: document.getElementById("helpModuleName"),
      helpDialogIntro: document.getElementById("helpDialogIntro"),
      helpTopicList: document.getElementById("helpTopicList"),
      helpReferenceNav: document.getElementById("helpReferenceNav"),
      helpReferencePanel: document.getElementById("helpReferencePanel"),
      lessonGrid: document.getElementById("lessonGrid"),
      lessonDifficultyChip: document.getElementById("lessonDifficultyChip"),
      weakKeySummary: document.getElementById("weakKeySummary"),
      smartPracticeWeakKeySummary: document.getElementById("smartPracticeWeakKeySummary"),
      smartPracticeLab: document.getElementById("smartPracticeLab"),
      gameGrid: document.getElementById("gameGrid"),
      arcadeDashboard: document.getElementById("arcadeDashboard"),
      tournamentDialog: document.getElementById("tournamentDialog"),
      tournamentFormatSelect: document.getElementById("tournamentFormatSelect"),
      tournamentOrderSelect: document.getElementById("tournamentOrderSelect"),
      stage: document.getElementById("gameStage"),
      arcadeStageShell: document.getElementById("arcadeStageShell"),
      arcadeConsoleMode: document.getElementById("arcadeConsoleMode"),
      arcadeConsoleStatus: document.getElementById("arcadeConsoleStatus"),
      arcadeStageReadout: document.getElementById("arcadeStageReadout"),
      arcadeInputHint: document.getElementById("arcadeInputHint"),
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
      hyper98PaletteField: document.getElementById("hyper98PaletteField"),
      hyper98PaletteSelect: document.getElementById("hyper98PaletteSelect"),
      soundToggle: document.getElementById("soundToggle"),
      soundVolumeSelect: document.getElementById("soundVolumeSelect"),
      soundTestButton: document.getElementById("soundTestButton"),
      soundTestStatus: document.getElementById("soundTestStatus"),
      multimediaSelect: document.getElementById("multimediaSelect"),
      aboutDialog: document.getElementById("aboutDialog"),
      aboutTip: document.getElementById("aboutTip"),
      blakeNotification: document.getElementById("blakeNotification"),
      blakeNotificationTitle: document.getElementById("blakeNotificationTitle"),
      blakeNotificationText: document.getElementById("blakeNotificationText"),
      backupReminderToggle: document.getElementById("backupReminderToggle"),
      startupToggle: document.getElementById("startupToggle"),
      motionPreferenceSelect: document.getElementById("motionPreferenceSelect"),
      lessonKeyboardCoachToggle: document.getElementById("lessonKeyboardCoachToggle"),
      difficultyPreview: document.getElementById("difficultyPreview"),
      titleQuote: document.getElementById("titleQuote")
    };
  }

  bindUI() {
    document.getElementById("startSuiteButton").addEventListener("click", () => this.showScreen("trainee"));
    document.getElementById("homeDailyPlanButton")?.addEventListener("click", () => this.exitTo("dailyPlan"));
    document.getElementById("homeAssessmentButton")?.addEventListener("click", () => this.exitTo("assessment"));
    document.getElementById("onboardingLaunchButton")?.addEventListener("click", () => this.openOnboarding());
    document.getElementById("onboardingCloseButton")?.addEventListener("click", () => this.ui.onboardingDialog?.close());
    document.getElementById("onboardingSkipButton")?.addEventListener("click", () => this.skipOnboarding());
    this.ui.onboardingForm?.addEventListener("submit", event => { event.preventDefault(); this.saveOnboarding(); });
    this.ui.onboardingForm?.addEventListener("change", () => this.renderOnboardingPreview());
    this.ui.moduleExplorerSearch?.addEventListener("input", () => { this.moduleExplorerQuery = this.ui.moduleExplorerSearch.value; this.renderModuleExplorer(); });
    document.addEventListener("keydown", event => { const tag=String(event.target?.tagName||"").toLowerCase(); const typing=tag==="input"||tag==="textarea"||event.target?.isContentEditable; if(event.key==="/"&&!typing&&this.currentScreen==="title"){event.preventDefault();this.ui.moduleExplorerSearch?.focus();this.ui.moduleExplorerSearch?.select();} if(event.key==="Escape"&&document.activeElement===this.ui.moduleExplorerSearch&&this.moduleExplorerQuery){this.moduleExplorerQuery="";this.ui.moduleExplorerSearch.value="";this.renderModuleExplorer();} });
    this.ui.moduleExplorerControls?.addEventListener("click", event => {
      const button=event.target.closest("[data-module-view]");
      if (!button) return;
      this.moduleExplorerView=new Set(["all","recommended","favorites","recent"]).has(button.dataset.moduleView)?button.dataset.moduleView:"all";
      this.renderModuleExplorer();
    });
    this.ui.moduleExplorerContent?.addEventListener("click", event => {
      const favorite=event.target.closest("[data-module-favorite]");
      if (favorite) { this.toggleModuleFavorite(favorite.dataset.moduleFavorite); return; }
      const button=event.target.closest("[data-module-open]");
      if (button) this.exitTo(button.dataset.moduleOpen, { focusHeading: event.detail === 0 });
    });
    this.ui.navigationQuickAccess?.addEventListener("click", event => {
      const viewJump=event.target.closest("[data-module-view-jump]");
      if (viewJump) {
        this.moduleExplorerView=new Set(["favorites","recent"]).has(viewJump.dataset.moduleViewJump)?viewJump.dataset.moduleViewJump:"all";
        this.renderModuleExplorer();
        this.ui.moduleExplorerSearch?.focus();
        this.ui.moduleExplorerControls?.scrollIntoView({behavior:this.shouldReduceMotion()?"auto":"smooth",block:"center"});
        return;
      }
      const favorite=event.target.closest("[data-module-favorite]");
      if (favorite) { this.toggleModuleFavorite(favorite.dataset.moduleFavorite); return; }
      const button=event.target.closest("[data-module-open]");
      if (button) this.exitTo(button.dataset.moduleOpen, { focusHeading: event.detail === 0 });
    });
    this.ui.homeRecommendedPath?.addEventListener("click", event => { const button=event.target.closest("[data-path-open]"); if (button) this.exitTo(button.dataset.pathOpen, { focusHeading: event.detail === 0 }); });
    document.getElementById("runDiagnosticsButton")?.addEventListener("click", () => this.renderDiagnostics(true));
    document.getElementById("runTortureTestButton")?.addEventListener("click", () => this.renderSystemTortureTest(true));
    document.getElementById("traineeLessonsButton")?.addEventListener("click", () => this.showScreen("lessons"));
    document.getElementById("traineeResetButton")?.addEventListener("click", () => this.resetTraineeProgress());
    this.ui.assessmentStartButton?.addEventListener("click", () => this.startAssessment());
    this.ui.techniqueAssessmentButton?.addEventListener("click", () => this.exitTo("assessment"));
    this.ui.techniquePrimaryActionButton?.addEventListener("click", () => {
      const analysis = this.getTechniqueAnalysis();
      const action = analysis.plan?.[0]?.action ?? { type: "screen", id: "assessment" };
      this.runTechniqueAction(action);
    });
    this.ui.techniqueScreen?.addEventListener("click", event => {
      const button = event.target.closest("[data-technique-action]");
      if (!button) return;
      try { this.runTechniqueAction(JSON.parse(decodeURIComponent(button.dataset.techniqueAction))); }
      catch (error) { console.warn("HyperSoft Technique Coach action could not be decoded:", error); }
    });
    this.ui.assessmentRecommendedButton?.addEventListener("click", () => {
      const latest = this.getLatestAssessment();
      if (latest?.placementDestination) this.showScreen(latest.placementDestination);
    });
    document.getElementById("aboutButton").addEventListener("click", () => this.openAbout());
    document.getElementById("aboutCloseButton").addEventListener("click", () => this.ui.aboutDialog.close());
    document.getElementById("aboutTipButton").addEventListener("click", () => this.renderAboutTip());
    document.getElementById("blakeNotificationClose").addEventListener("click", () => this.hideBlakeNotification());
    document.addEventListener("click", event => {
      if (event.target.closest("button") && this.settings.sound && this.settings.multimedia !== "quiet") this.playUiTone("click");
    });
    document.getElementById("brandButton").addEventListener("click", () => this.exitTo("title"));
    document.getElementById("helpButton").addEventListener("click", () => this.openContextHelp());
    document.getElementById("closeHelpButton").addEventListener("click", () => this.ui.helpDialog.close());
    document.getElementById("helpCloseButton").addEventListener("click", () => this.ui.helpDialog.close());
    this.ui.helpReferenceNav?.addEventListener("click", event => {
      const button = event.target.closest("[data-help-reference]");
      if (button) this.renderHelpReference(button.dataset.helpReference);
    });
    this.ui.helpReferencePanel?.addEventListener("click", event => {
      const button = event.target.closest("[data-help-open]");
      if (!button) return;
      this.ui.helpDialog?.close();
      this.exitTo(button.dataset.helpOpen, { focusHeading: event.detail === 0 });
    });
    this.ui.startupSkipButton.addEventListener("click", () => this.closeStartupSequence());
    document.addEventListener("keydown", event => {
      if (event.key !== "F1") return;
      event.preventDefault();
      if (document.querySelector("dialog[open]")) return;
      if ((this.activeGame || this.engine.running) && this.activeMode?.id) this.openGuide(this.activeMode.id);
      else this.openContextHelp();
    });
    this.ui.profileQuickButton.addEventListener("click", () => this.exitTo("profiles"));
    this.ui.activeProfileBanner.addEventListener("click", () => this.exitTo("profiles"));
    this.ui.backButton.addEventListener("click", () => {
      if (this.tournament?.active) {
        if (!confirm("Quit the current Typing Tournament? Completed rounds will remain in your arcade history, but the tournament itself will not be recorded.")) return;
        this.abortTournament({ keepScreen: true });
        this.exitTo("menu");
        return;
      }
      this.exitTo(this.activityKind === "lesson" ? this.getLessonHomeScreen(this.activeMode) : this.activityKind === "assessment" ? "assessment" : this.activityKind === "realWorld" ? "realWorld" : this.activityKind === "accuracyClinic" ? "accuracyClinic" : this.activityKind === "tenKey" ? "tenKey" : this.activityKind === "punctuation" ? "punctuation" : this.activityKind === "certification" ? "certification" : "menu");
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
      const pendingLesson = this.pendingLessonId ? this.getLessonDefinition(this.pendingLessonId) : null;
      const destination = this.pendingLessonId ? this.getLessonHomeScreen(pendingLesson) : this.pendingGameId ? "menu" : null;
      this.pendingLessonId = null;
      this.pendingGameId = null;
      this.pendingGameOptions = {};
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
      button.addEventListener("click", event => this.exitTo(button.dataset.nav, { focusHeading: event.detail === 0 }));
    });

    this.ui.hyper98CurriculumToggle?.addEventListener("click", () => {
      this.exitTo(this.currentScreenName === "lessons" ? "smartPractice" : "lessons");
    });
    this.ui.hyper98HowButton?.addEventListener("click", () => this.openContextHelp());
    this.ui.hyper98BlakeTipsButton?.addEventListener("click", () => this.exitTo("office"));

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
      this.dailyPlanReturnPending = false;
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
      } else if (this.lastActivity.kind === "assessment") {
        this.launchWithLoading("Typing Assessment", () => this.beginAssessment());
      } else if (this.lastActivity.kind === "realWorld") {
        const mode = getRealWorldMode(this.lastActivity.id);
        if (mode) this.launchWithLoading(mode.title, () => this.beginRealWorldMode(mode.id));
      } else if (this.lastActivity.kind === "accuracyClinic") {
        const protocol = getAccuracyClinicProtocol(this.lastActivity.id);
        if (protocol) this.launchWithLoading(protocol.title, () => this.beginAccuracyClinic(protocol.id));
      } else if (this.lastActivity.kind === "tenKey") {
        const protocol = getTenKeyProtocol(this.lastActivity.id);
        if (protocol) this.launchWithLoading(protocol.title, () => this.beginTenKeyProtocol(protocol.id));
      } else if (this.lastActivity.kind === "punctuation") {
        const protocol = getPunctuationBusinessProtocol(this.lastActivity.id);
        if (protocol) this.launchWithLoading(protocol.title, () => this.beginPunctuationProtocol(protocol.id));
      } else if (this.lastActivity.kind === "certification") {
        const duration = getCertificationDuration(this.lastActivity.id);
        if (duration) this.launchWithLoading(duration.label, () => this.beginCertificationTest(duration.id));
      } else {
        const mode = MODE_METADATA.find(item => item.id === this.lastActivity.id);
        this.launchWithLoading(mode?.title || "Typing Game", () => this.beginMode(this.lastActivity.id));
      }
    });

    this.ui.resultHomeButton.addEventListener("click", () => {
      this.ui.resultDialog.close();
      if (this.tournament?.active) this.abortTournament({ keepScreen: true });
      this.arcadeChallenge = null;
      if (this.dailyPlanReturnPending) {
        this.dailyPlanReturnPending = false;
        this.showScreen("dailyPlan");
        return;
      }
      this.showScreen(this.activityKind === "lesson" ? this.getLessonHomeScreen(this.activeMode) : this.activityKind === "assessment" ? "assessment" : this.activityKind === "realWorld" ? "realWorld" : this.activityKind === "accuracyClinic" ? "accuracyClinic" : this.activityKind === "tenKey" ? "tenKey" : this.activityKind === "punctuation" ? "punctuation" : this.activityKind === "certification" ? "certification" : "menu");
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
        hyper98Palette: this.ui.hyper98PaletteSelect.value,
        sound: this.ui.soundToggle.checked,
        soundVolume: this.ui.soundVolumeSelect.value,
        multimedia: this.ui.multimediaSelect.value,
        backupReminder: this.ui.backupReminderToggle.checked,
        startup: this.ui.startupToggle.checked,
        lessonKeyboardCoach: this.ui.lessonKeyboardCoachToggle.checked,
        motionPreference: this.ui.motionPreferenceSelect?.value || "system"
      };
      this.persistActiveProfile();
      this.applyTheme(this.settings.theme, this.settings.hyper98Palette);
      this.applyMotionPreference();
      this.engine.setSound(this.settings.sound);
      this.engine.setSoundVolume(this.settings.soundVolume);
      this.renderMenu();
      this.renderLessons(); this.renderSmartPracticeLab(); this.renderSmartPracticeWeakKeySummary();
      this.renderDifficultyPreview();
      this.renderProfiles();
      this.updateProfileChrome();
      this.showScreen("lessons");
    });

    this.ui.difficultySelect.addEventListener("change", () => this.renderDifficultyPreview());
    this.ui.themeSelect.addEventListener("change", () => {
      this.updateHyper98PaletteVisibility();
      this.applyTheme(this.ui.themeSelect.value, this.ui.hyper98PaletteSelect.value);
    });
    this.ui.hyper98PaletteSelect.addEventListener("change", () => {
      this.applyTheme(this.ui.themeSelect.value, this.ui.hyper98PaletteSelect.value);
    });
    this.ui.soundVolumeSelect?.addEventListener("change", () => {
      // Choosing an audible level is an affirmative audio choice. Keep the
      // separate checkbox for an explicit OFF state, but do not let a user
      // select “Normal” and then unknowingly save Sound Effects as disabled.
      this.ui.soundToggle.checked = true;
      if (this.ui.soundTestStatus) this.ui.soundTestStatus.textContent =
        `Sound Effects will be ON at ${this.ui.soundVolumeSelect.value} level after you save Settings.`;
    });
    this.ui.soundToggle?.addEventListener("change", () => {
      if (this.ui.soundTestStatus) this.ui.soundTestStatus.textContent = this.ui.soundToggle.checked
        ? `Sound Effects will be ON at ${this.ui.soundVolumeSelect?.value || "normal"} level after you save Settings.`
        : "Sound Effects will be OFF after you save Settings. The sound test remains available.";
    });
    this.ui.soundTestButton?.addEventListener("click", () => this.playSoundTest());

    document.getElementById("resetSettingsButton").addEventListener("click", () => {
      this.settings = { ...DEFAULT_SETTINGS };
      this.persistActiveProfile();
      this.engine.setSound(this.settings.sound);
      this.engine.setSoundVolume(this.settings.soundVolume);
      this.applyTheme(this.settings.theme, this.settings.hyper98Palette);
      this.applyMotionPreference();
      this.renderSettings();
      this.renderMenu();
      this.renderLessons(); this.renderSmartPracticeLab(); this.renderSmartPracticeWeakKeySummary();
      this.updateProfileChrome();
    });

    document.getElementById("resetAdaptiveButton").addEventListener("click", () => {
      if (!confirm("Reset the weak-key, key-pair, and adaptive typing profile for the active learner? Scores will be kept.")) return;
      this.keyStats = {};
      this.keyHistory = [];
      this.pairStats = {};
      this.persistActiveProfile();
      this.renderLessons(); this.renderSmartPracticeLab(); this.renderSmartPracticeWeakKeySummary();
      this.renderProgress();
      this.renderProfiles();
    });

    this.ui.traineeScreen?.addEventListener("click", event => {
      const stationButton = event.target.closest("[data-trainee-station]");
      if (stationButton) { this.selectTraineeStep(stationButton.dataset.traineeStation); return; }
      const answerButton = event.target.closest("[data-trainee-answer]");
      if (answerButton) { this.answerTraineeQuiz(Number(answerButton.dataset.traineeAnswer)); return; }
      const checkButton = event.target.closest("[data-trainee-check]");
      if (checkButton) { this.checkTraineeTyping(); return; }
      const completeButton = event.target.closest("[data-trainee-complete]");
      if (completeButton) { this.completeTraineeStep(this.currentTraineeStepId); return; }
    });

    this.ui.customPracticeForm?.addEventListener("submit", event => {
      event.preventDefault();
      this.startCustomPracticeFromBuilder();
    });
    this.ui.customPracticeForm?.addEventListener("input", () => this.renderCustomPracticePreview());
    this.ui.customPracticeForm?.addEventListener("change", () => this.renderCustomPracticePreview());
    this.ui.customPracticeScreen?.addEventListener("click", event => {
      const quick = event.target.closest("[data-custom-quick]");
      if (quick) {
        this.applyCustomPracticeConfig(getCustomPracticePreset(quick.dataset.customQuick, {
          weakKeys: this.getWeakKeys(8),
          weakPairs: this.getWeakPairs(8)
        }));
        return;
      }
      const load = event.target.closest("[data-custom-load]");
      if (load) {
        const preset = this.customPracticePresets.find(item => item.id === load.dataset.customLoad);
        if (preset) this.applyCustomPracticeConfig(preset.config);
        return;
      }
      const remove = event.target.closest("[data-custom-delete]");
      if (remove) {
        this.deleteCustomPracticePreset(remove.dataset.customDelete);
      }
    });
    this.ui.customPracticeSavePresetButton?.addEventListener("click", () => this.saveCustomPracticePreset());
    this.ui.customPracticeResetButton?.addEventListener("click", () => {
      this.applyCustomPracticeConfig(CUSTOM_PRACTICE_DEFAULTS);
      if (this.ui.customPracticePresetName) this.ui.customPracticePresetName.value = "";
    });

    this.ui.realWorldScreen?.addEventListener("click", event => {
      const button = event.target.closest("[data-realworld-mode]");
      if (button) this.startRealWorldMode(button.dataset.realworldMode);
    });

    this.ui.accuracyClinicScreen?.addEventListener("click", event => {
      const protocolButton = event.target.closest("[data-accuracy-protocol]");
      if (protocolButton) { this.startAccuracyClinic(protocolButton.dataset.accuracyProtocol); return; }
      const remediate = event.target.closest("[data-accuracy-remediate]");
      if (remediate?.dataset.accuracyRemediate === "customPractice") { this.showScreen("customPractice"); return; }
      if (remediate?.dataset.accuracyRemediate === "smartPractice") { this.showScreen("smartPractice"); return; }
      if (remediate?.dataset.accuracyRemediate === "assessment") { this.showScreen("assessment"); }
    });

    this.ui.tenKeyScreen?.addEventListener("click", event => {
      const button = event.target.closest("[data-tenkey-protocol]");
      if (button) this.startTenKeyProtocol(button.dataset.tenkeyProtocol);
    });

    this.ui.punctuationScreen?.addEventListener("click", event => {
      const button = event.target.closest("[data-punctuation-protocol]");
      if (button) this.startPunctuationProtocol(button.dataset.punctuationProtocol);
    });

    this.ui.certificationScreen?.addEventListener("click", event => {
      const button = event.target.closest("[data-certification-test]");
      if (button) this.startCertificationTest(button.dataset.certificationTest);
    });
    this.ui.certificationStandardSelect?.addEventListener("change", () => {
      this.certificationConfig.standardId = this.ui.certificationStandardSelect.value;
      this.updateCertificationCustomVisibility();
      this.renderCertificationTests();
    });
    this.ui.certificationContentSelect?.addEventListener("change", () => {
      this.certificationConfig.contentId = this.ui.certificationContentSelect.value;
      this.renderCertificationTests();
    });
    this.ui.certificationCustomWpm?.addEventListener("input", () => { this.certificationConfig.customWpm = Number(this.ui.certificationCustomWpm.value) || 40; this.renderCertificationTests(); });
    this.ui.certificationCustomAccuracy?.addEventListener("input", () => { this.certificationConfig.customAccuracy = Number(this.ui.certificationCustomAccuracy.value) || 97; this.renderCertificationTests(); });

    this.ui.dailyPlanGenerateButton?.addEventListener("click", () => {
      const duration = Number(this.ui.dailyPlanDurationSelect?.value) || 20;
      if (this.dailyPlanState?.completedStepIds?.length && !confirm("Generate a new daily plan? Today's current plan progress will be replaced.")) return;
      this.generateDailyPlan(duration);
    });
    this.ui.dailyPlanStartNextButton?.addEventListener("click", () => this.startNextDailyPlanStep());
    this.ui.dailyPlanScreen?.addEventListener("click", event => {
      const start = event.target.closest("[data-daily-start]");
      if (start) { this.runDailyPlanStep(start.dataset.dailyStart); return; }
      const complete = event.target.closest("[data-daily-complete]");
      if (complete) this.markDailyPlanStepComplete(complete.dataset.dailyComplete, { manual: true });
    });

    this.ui.theoryCategorySelect?.addEventListener("change", () => {
      this.theoryCategory = this.ui.theoryCategorySelect.value || "all";
      this.renderTheoryLibrary();
    });
    this.ui.theorySearchInput?.addEventListener("input", () => {
      this.theorySearch = this.ui.theorySearchInput.value || "";
      this.renderTheoryLibrary();
    });
    this.ui.theoryScreen?.addEventListener("click", event => {
      const topicButton = event.target.closest("[data-theory-topic]");
      if (topicButton) { this.selectTheoryTopic(topicButton.dataset.theoryTopic); return; }
      const answerButton = event.target.closest("[data-theory-answer]");
      if (answerButton) { this.answerTheoryQuiz(this.currentTheoryTopicId, Number(answerButton.dataset.theoryAnswer)); return; }
      const reviewButton = event.target.closest("[data-theory-review]");
      if (reviewButton) { this.markTheoryReviewed(reviewButton.dataset.theoryReview); return; }
      const navButton = event.target.closest("[data-theory-nav]");
      if (navButton) this.exitTo(navButton.dataset.theoryNav);
    });

    this.bindDialogAccessibility();
    document.querySelector(".topnav")?.addEventListener("keydown", event => this.handleTopNavigationKeys(event));

    [this.ui.profileDialog, this.ui.onboardingDialog, this.ui.tournamentDialog, this.ui.hostDialog, this.ui.guideDialog, this.ui.resultDialog, this.ui.aboutDialog].forEach(dialog => {
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

  loadTheoryProgress() {
    return normalizeTheoryProgress(this.getActiveProfile()?.data?.theoryProgress);
  }

  getTheoryFilteredTopics() {
    const query = String(this.theorySearch || "").trim().toLowerCase();
    return THEORY_TOPICS.filter(topic => {
      if (this.theoryCategory !== "all" && topic.category !== this.theoryCategory) return false;
      if (!query) return true;
      const haystack = [topic.title, topic.summary, topic.why, topic.category, ...(topic.principles || [])].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }

  selectTheoryTopic(topicId) {
    if (!THEORY_TOPICS.some(topic => topic.id === topicId)) return;
    this.currentTheoryTopicId = topicId;
    this.theoryFeedback = "";
    this.renderTheoryLibrary();
    this.ui.theoryArticle?.scrollIntoView?.({ block: "start", behavior: this.shouldReduceMotion() ? "auto" : "smooth" });
  }

  markTheoryReviewed(topicId) {
    const topic = THEORY_TOPICS.find(item => item.id === topicId);
    if (!topic) return;
    const row = this.theoryProgress[topicId] ?? { reviewed:false, quizCorrect:false, quizAttempts:0, lastReviewedAt:0 };
    row.reviewed = true;
    row.lastReviewedAt = Date.now();
    this.theoryProgress[topicId] = row;
    this.theoryFeedback = `${topic.title} marked reviewed.`;
    const dailyStep = this.dailyPlanState?.activeStepId ? this.getDailyPlanStep(this.dailyPlanState.activeStepId) : null;
    if (dailyStep?.action?.type === "theory" && dailyStep.action.id === topicId) this.markDailyPlanStepComplete(dailyStep.id);
    else this.persistActiveProfile();
    this.renderTheoryLibrary();
  }

  answerTheoryQuiz(topicId, answerIndex) {
    const topic = THEORY_TOPICS.find(item => item.id === topicId);
    if (!topic?.quiz || !Number.isInteger(answerIndex)) return;
    const row = this.theoryProgress[topicId] ?? { reviewed:false, quizCorrect:false, quizAttempts:0, lastReviewedAt:0 };
    row.quizAttempts = Math.min(99, (Number(row.quizAttempts) || 0) + 1);
    const correct = answerIndex === topic.quiz.answer;
    if (correct) {
      row.quizCorrect = true;
      row.reviewed = true;
      row.lastReviewedAt = Date.now();
      this.theoryFeedback = `Correct. ${topic.quiz.explanation}`;
      this.playTrainingTone?.(true);
    } else {
      this.theoryFeedback = `Not quite. ${topic.quiz.explanation}`;
      this.playTrainingTone?.(false);
    }
    this.theoryProgress[topicId] = row;
    const dailyStep = correct && this.dailyPlanState?.activeStepId ? this.getDailyPlanStep(this.dailyPlanState.activeStepId) : null;
    if (dailyStep?.action?.type === "theory" && dailyStep.action.id === topicId) this.markDailyPlanStepComplete(dailyStep.id);
    else this.persistActiveProfile();
    this.renderTheoryLibrary();
  }

  renderTheoryLibrary() {
    if (!this.ui.theorySummary || !this.ui.theoryTopicList || !this.ui.theoryArticle || !this.ui.theoryGlossary) return;
    const summary = getTheoryProgressSummary(this.theoryProgress);
    const filtered = this.getTheoryFilteredTopics();
    if (!filtered.some(topic => topic.id === this.currentTheoryTopicId) && filtered.length) this.currentTheoryTopicId = filtered[0].id;
    const topic = THEORY_TOPICS.find(item => item.id === this.currentTheoryTopicId) ?? THEORY_TOPICS[0];
    const current = this.theoryProgress[topic.id] ?? {};
    const category = THEORY_CATEGORIES.find(item => item.id === topic.category);

    if (this.ui.theoryCategorySelect && this.ui.theoryCategorySelect.value !== this.theoryCategory) this.ui.theoryCategorySelect.value = this.theoryCategory;
    if (this.ui.theorySearchInput && this.ui.theorySearchInput.value !== this.theorySearch) this.ui.theorySearchInput.value = this.theorySearch;

    this.ui.theorySummary.innerHTML = `
      <div class="theory-summary-primary"><span>Learning Center</span><strong>${summary.reviewed}/${summary.total}</strong><small>topics reviewed · ${summary.reviewedPercent}% complete</small></div>
      <div><span>Knowledge Checks</span><strong>${summary.quizCorrect}/${summary.total}</strong><small>answered correctly</small></div>
      <div><span>Current Section</span><strong>${this.escapeHtml(category?.label || "Theory")}</strong><small>${this.escapeHtml(topic.title)}</small></div>
      <div><span>Reference Topics</span><strong>${THEORY_TOPICS.length}</strong><small>${THEORY_CATEGORIES.length} learning areas</small></div>`;

    this.ui.theoryTopicList.innerHTML = filtered.length ? filtered.map(item => {
      const state = this.theoryProgress[item.id] ?? {};
      const cat = THEORY_CATEGORIES.find(row => row.id === item.category);
      return `<button type="button" class="theory-topic-button ${item.id === topic.id ? "active" : ""} ${state.reviewed ? "reviewed" : ""}" data-theory-topic="${item.id}" aria-current="${item.id === topic.id ? "true" : "false"}">
        <span class="theory-topic-number">${state.reviewed ? "✓" : item.number}</span>
        <span><small>${this.escapeHtml(cat?.label || "Theory")}</small><strong>${this.escapeHtml(item.title)}</strong><em>${this.escapeHtml(item.summary)}</em></span>
      </button>`;
    }).join("") : `<div class="empty-state">No Learning Center topics match that filter or search.</div>`;

    const feedbackClass = this.theoryFeedback.startsWith("Correct") || this.theoryFeedback.includes("marked reviewed") ? "good" : this.theoryFeedback ? "bad" : "";
    this.ui.theoryArticle.innerHTML = `
      <article class="theory-reader-card">
        <div class="theory-reader-header">
          <div class="theory-reader-icon">${this.escapeHtml(topic.icon)}</div>
          <div><span>${this.escapeHtml(category?.label || "Theory")} · Topic ${topic.number}</span><h3>${this.escapeHtml(topic.title)}</h3><p>${this.escapeHtml(topic.summary)}</p></div>
          <div class="theory-reader-state ${current.reviewed ? "complete" : ""}">${current.reviewed ? "Reviewed ✓" : "Open"}</div>
        </div>
        <section class="theory-why"><span>Why this matters</span><p>${this.escapeHtml(topic.why)}</p></section>
        <section class="theory-principles"><h4>Core ideas</h4><ul>${topic.principles.map(item => `<li>${this.escapeHtml(item)}</li>`).join("")}</ul></section>
        <div class="theory-example-grid">
          <section class="theory-example"><span>${this.escapeHtml(topic.example.label)}</span><p>${this.escapeHtml(topic.example.body)}</p></section>
          <section class="theory-mistake"><span>Common mistake</span><p>${this.escapeHtml(topic.mistake)}</p></section>
        </div>
        <section class="theory-connection"><strong>Where this appears in HyperSoft</strong><p>${this.escapeHtml(topic.connection)}</p><div class="theory-related-actions">${topic.related.map(link => `<button class="secondary" type="button" data-theory-nav="${this.escapeHtml(link.screen)}">${this.escapeHtml(link.label)}</button>`).join("")}</div></section>
        <section class="theory-quiz">
          <div class="theory-quiz-heading"><div><span>Knowledge Check</span><strong>${this.escapeHtml(topic.quiz.question)}</strong></div><small>${current.quizCorrect ? "Completed ✓" : current.quizAttempts ? `${current.quizAttempts} attempt${current.quizAttempts === 1 ? "" : "s"}` : "Optional"}</small></div>
          <div class="theory-quiz-options">${topic.quiz.options.map((option,index)=>`<button type="button" data-theory-answer="${index}" ${current.quizCorrect ? "disabled" : ""}>${String.fromCharCode(65+index)}. ${this.escapeHtml(option)}</button>`).join("")}</div>
          <div class="theory-feedback ${feedbackClass}" role="status">${this.escapeHtml(this.theoryFeedback || (current.quizCorrect ? topic.quiz.explanation : "Choose an answer or mark the topic reviewed when the concept is clear."))}</div>
        </section>
        <div class="theory-reader-footer"><button class="${current.reviewed ? "secondary" : "primary"}" type="button" data-theory-review="${topic.id}">${current.reviewed ? "Reviewed" : "Mark Topic Reviewed"}</button><small>Reading progress is profile-specific and included in HyperSoft backups.</small></div>
      </article>`;

    this.ui.theoryGlossary.innerHTML = `<div class="theory-glossary-heading"><div><strong>Typing Glossary</strong><span>Quick definitions used throughout HyperSoft</span></div><small>Reference only</small></div><div class="theory-glossary-grid">${THEORY_GLOSSARY.map(([term,definition])=>`<article><strong>${this.escapeHtml(term)}</strong><p>${this.escapeHtml(definition)}</p></article>`).join("")}</div>`;
  }

  loadOnboardingState() {
    return normalizeOnboardingState(this.getActiveProfile()?.data?.onboardingState);
  }

  loadNavigationState() {
    return normalizeNavigationState(this.getActiveProfile()?.data?.navigationState);
  }

  recordNavigationVisit(moduleId) {
    if (!getSuiteModule(moduleId)) return;
    this.navigationState=recordSuiteModuleVisit(this.navigationState,moduleId,Date.now());
    this.persistActiveProfile();
    this.updateNavigationFavoriteMarkers();
  }

  toggleModuleFavorite(moduleId) {
    if (!getSuiteModule(moduleId)) return;
    this.navigationState=toggleSuiteModuleFavorite(this.navigationState,moduleId);
    this.persistActiveProfile();
    this.renderHomeNavigationHub();
    this.renderModuleExplorer();
    this.updateNavigationFavoriteMarkers();
  }

  updateNavigationFavoriteMarkers() {
    const favorites=new Set(this.navigationState?.favorites||[]);
    document.querySelectorAll(".topnav [data-nav]").forEach(button=>{
      const favorite=favorites.has(button.dataset.nav);
      if (favorite) {
        button.setAttribute("data-favorite","true");
        button.setAttribute("data-favorite-label","Favorite");
      } else {
        button.removeAttribute("data-favorite");
        button.removeAttribute("data-favorite-label");
      }
    });
  }

  renderHomeNavigationHub() {
    if (!this.ui.homeContinuePanel || !this.ui.homeFavoriteModules || !this.ui.homeRecentModules) return;
    const state=normalizeNavigationState(this.navigationState);
    const smartContinue=getSmartContinueModule(state,this.getRecommendedSuitePath());
    const continueModule=smartContinue.module;
    const visitRow=state.recent.find(row=>row.id===continueModule?.id);
    const visitedText=smartContinue.usedRecommendation ? "Recommended from your current training path" : (visitRow?.visitedAt ? `Last opened ${this.formatPacificTimestamp(visitRow.visitedAt)}` : "Ready to resume");
    const continueLabel=smartContinue.usedRecommendation ? "Best next module" : "Continue training";
    this.ui.homeContinuePanel.innerHTML=continueModule ? `<div class="home-continue-icon">${this.escapeHtml(continueModule.icon)}</div><div><span class="eyebrow">${continueLabel}</span><strong>${this.escapeHtml(continueModule.title)}</strong><small>${this.escapeHtml(visitedText)}</small></div><button class="primary" type="button" data-module-open="${continueModule.id}">${smartContinue.usedRecommendation?"Open":"Continue"}</button>` : `<div class="empty-state">Open any training module and HyperSoft will remember your place here.</div>`;

    const favorites=(state.favorites||[]).map(getSuiteModule).filter(Boolean);
    this.ui.homeFavoriteModules.innerHTML=favorites.length ? favorites.map(item=>`<div class="home-quick-module"><button class="home-quick-open" type="button" data-module-open="${item.id}"><span>${this.escapeHtml(item.icon)}</span><strong>${this.escapeHtml(item.title)}</strong></button><button class="home-quick-star is-favorite" type="button" data-module-favorite="${item.id}" aria-label="Remove ${this.escapeHtml(item.title)} from favorites" aria-pressed="true">★</button></div>`).join("") : `<div class="home-quick-empty">No favorites yet. Use the ★ control in Find a Module to pin the tools you use most.</div>`;

    const recent=(state.recent||[]).map(row=>({...row,module:getSuiteModule(row.id)})).filter(row=>row.module).slice(0,6);
    this.ui.homeRecentModules.innerHTML=recent.length ? recent.map(row=>`<button class="home-recent-module" type="button" data-module-open="${row.module.id}"><span>${this.escapeHtml(row.module.icon)}</span><div><strong>${this.escapeHtml(row.module.title)}</strong><small>${row.visitedAt?this.escapeHtml(this.formatPacificTimestamp(row.visitedAt)):"Recently opened"}</small></div></button>`).join("") : `<div class="home-quick-empty">Recently opened modules will appear here automatically.</div>`;
  }

  getRecommendedSuitePath() {
    return buildSuiteRecommendedPath({
      onboarding:this.onboardingState,
      scores:this.scores,
      traineeComplete:TRAINEE_MODULES.every(item=>this.traineeProgress?.[item.id]),
      assessment:this.getLatestAssessment(),
      lessonMastered:LESSON_METADATA.filter(lesson=>this.getLessonProgress(lesson).metTarget).length,
      lessonTotal:LESSON_METADATA.length,
      weakKeys:this.getWeakKeys(6),
      weakPairs:this.getWeakPairs(6)
    });
  }

  renderHomeIntegration() {
    if (!this.ui.homeRecommendedPath || !this.ui.moduleExplorerContent) return;
    const path=this.getRecommendedSuitePath();
    const profile=this.getActiveProfile();
    const goalLabels={general:"General improvement",accuracy:"Accuracy",speed:"Sustainable speed",work:"Workplace typing",numeric:"10-key / numeric entry",fun:"Games & variety"};
    this.ui.homeRecommendedPath.innerHTML=path.map((item,index)=>`<article class="home-path-step"><span class="home-path-number">${index+1}</span><div><strong>${this.escapeHtml(item.label)}</strong>${item.signal?`<small class="recommendation-signal">Why now: ${this.escapeHtml(item.signal)}</small>`:""}<p>${this.escapeHtml(item.reason)}</p></div><button class="secondary" type="button" data-path-open="${this.escapeHtml(item.id)}">Open</button></article>`).join("");
    const onboardingButton=document.getElementById("onboardingLaunchButton");
    if (onboardingButton) onboardingButton.textContent=this.onboardingState.completed ? `Goal: ${goalLabels[this.onboardingState.goal] || "General"}` : "Set My Training Goal";
    this.renderHomeNavigationHub();
    this.renderModuleExplorer();
    this.updateNavigationFavoriteMarkers();
    if (profile && this.activeProfileId === "guest") this.ui.homeRecommendedPath.insertAdjacentHTML("beforeend",`<div class="home-path-note">Guest mode: recommendations, favorites, and recent-module history work during this session but disappear when Guest mode ends.</div>`);
  }

  renderModuleExplorer() {
    if (!this.ui.moduleExplorerContent) return;
    const state=normalizeNavigationState(this.navigationState);
    let matches=filterModuleCatalog(this.moduleExplorerQuery);
    const view=new Set(["all","recommended","favorites","recent"]).has(this.moduleExplorerView)?this.moduleExplorerView:"all";
    if (view==="recommended") {
      const order=new Map(this.getRecommendedSuitePath().map((row,index)=>[row.id,index]));
      matches=matches.filter(item=>order.has(item.id)).sort((a,b)=>order.get(a.id)-order.get(b.id));
    } else if (view==="favorites") {
      const recentOrder=new Map(state.recent.map((row,index)=>[row.id,index]));
      const order=new Map(state.favorites.map((id,index)=>[id,index]));
      matches=matches.filter(item=>order.has(item.id)).sort((a,b)=>(recentOrder.get(a.id)??99)-(recentOrder.get(b.id)??99)||order.get(a.id)-order.get(b.id));
      matches=matches.filter(item=>order.has(item.id)).sort((a,b)=>order.get(a.id)-order.get(b.id));
    } else if (view==="recent") {
      const order=new Map(state.recent.map((row,index)=>[row.id,index]));
      matches=matches.filter(item=>order.has(item.id)).sort((a,b)=>order.get(a.id)-order.get(b.id));
    }
    this.ui.moduleExplorerControls?.querySelectorAll("[data-module-view]").forEach(button=>button.setAttribute("aria-pressed",button.dataset.moduleView===view?"true":"false"));
    if (!matches.length) {
      const noun=view==="recommended"?"recommended":view==="favorites"?"favorite":view==="recent"?"recent":"HyperSoft";
      this.ui.moduleExplorerContent.innerHTML=`<div class="empty-state">No ${noun} module matches “${this.escapeHtml(this.moduleExplorerQuery)}”.${view!=="all"?" Switch to All Modules or change the search.":" Try accuracy, work, 10-key, test, reports, or games."}</div>`;
      return;
    }
    let groups;
    if (view==="all") {
      const matchIds=new Set(matches.map(item=>item.id));
      groups=getModuleCatalogGroups().map(group=>({...group,items:group.items.filter(item=>matchIds.has(item.id))})).filter(group=>group.items.length);
    } else {
      groups=[{name:view==="recommended"?"Recommended for You":view==="favorites"?"Favorite Modules":"Recently Used",items:matches}];
    }
    const favoriteSet=new Set(state.favorites);
    this.ui.moduleExplorerContent.innerHTML=groups.map(group=>`<section class="module-explorer-group"><h3>${this.escapeHtml(group.name)}</h3><div class="module-explorer-grid">${group.items.map(item=>{ const favorite=favoriteSet.has(item.id); return `<article class="module-explorer-card ${favorite?"is-favorite":""}"><button class="module-card-open" type="button" data-module-open="${item.id}"><span>${this.escapeHtml(item.icon)}</span><div><strong>${this.escapeHtml(item.title)}</strong><small>${this.escapeHtml(item.description)}</small></div></button><button class="module-favorite-button ${favorite?"is-favorite":""}" type="button" data-module-favorite="${item.id}" aria-pressed="${favorite?"true":"false"}" aria-label="${favorite?"Remove":"Add"} ${this.escapeHtml(item.title)} ${favorite?"from":"to"} favorites">${favorite?"★":"☆"}</button></article>`; }).join("")}</div></section>`).join("");
  }

  openOnboarding({automatic=false}={}) {
    if (!this.ui.onboardingDialog || !this.ui.onboardingForm) return;
    const state=this.onboardingState;
    const experience=this.ui.onboardingForm.querySelector(`input[name="onboardingExperience"][value="${state.experience === "unknown" ? "some" : state.experience}"]`) ?? this.ui.onboardingForm.querySelector('input[name="onboardingExperience"][value="some"]');
    if (experience) experience.checked=true;
    if (this.ui.onboardingGoalSelect) this.ui.onboardingGoalSelect.value=state.goal;
    const minutes=this.ui.onboardingForm.querySelector(`input[name="onboardingMinutes"][value="${state.sessionMinutes}"]`);
    if (minutes) minutes.checked=true;
    this.onboardingState.lastOpenedAt=Date.now();
    if (!automatic) this.persistActiveProfile();
    this.renderOnboardingPreview();
    if (!this.ui.onboardingDialog.open) this.openAccessibleDialog(this.ui.onboardingDialog);
  }

  renderOnboardingPreview() {
    if (!this.ui.onboardingPreview || !this.ui.onboardingForm) return;
    const form=new FormData(this.ui.onboardingForm);
    const previewState=normalizeOnboardingState({
      completed:true,
      experience:form.get("onboardingExperience") || "some",
      goal:form.get("onboardingGoal") || "general",
      sessionMinutes:Number(form.get("onboardingMinutes")) || 20
    });
    const rows=buildSuiteRecommendedPath({
      onboarding:previewState,
      scores:this.scores,
      traineeComplete:TRAINEE_MODULES.every(item=>this.traineeProgress?.[item.id]),
      assessment:this.getLatestAssessment(),
      lessonMastered:LESSON_METADATA.filter(lesson=>this.getLessonProgress(lesson).metTarget).length,
      lessonTotal:LESSON_METADATA.length,
      weakKeys:this.getWeakKeys(6), weakPairs:this.getWeakPairs(6)
    });
    this.ui.onboardingPreview.innerHTML=`<strong>Suggested starting route</strong><ol>${rows.map(item=>`<li>${this.escapeHtml(item.label)}</li>`).join("")}</ol><small>You can ignore this route at any time. HyperSoft never locks modules based on onboarding.</small>`;
  }

  saveOnboarding() {
    if (!this.ui.onboardingForm) return;
    const form=new FormData(this.ui.onboardingForm);
    this.onboardingState=normalizeOnboardingState({
      completed:true,
      experience:form.get("onboardingExperience") || "some",
      goal:form.get("onboardingGoal") || "general",
      sessionMinutes:Number(form.get("onboardingMinutes")) || 20,
      completedAt:Date.now(), lastOpenedAt:Date.now()
    });
    this.persistActiveProfile();
    this.ui.onboardingDialog?.close();
    this.renderHomeIntegration();
    this.showScreen("title");
  }

  skipOnboarding() {
    this.onboardingState={...normalizeOnboardingState(this.onboardingState),completed:true,completedAt:Date.now(),lastOpenedAt:Date.now()};
    this.persistActiveProfile();
    this.ui.onboardingDialog?.close();
    this.renderHomeIntegration();
  }

  maybeOpenOnboarding() {
    if (this.activeProfileId === "guest" || this.onboardingState.completed) return;
    const hasActivity=(this.scores?.length||0)>0 || Object.keys(this.traineeProgress||{}).length>0;
    if (hasActivity) return;
    window.setTimeout(()=>this.openOnboarding({automatic:true}),80);
  }

  getDiagnosticsSummary() {
    const allIds=[...document.querySelectorAll("[id]")].map(el=>el.id);
    const duplicateIds=allIds.length-new Set(allIds).size;
    const screens=new Set(this.ui.screens.map(screen=>screen.id));
    const navButtons=[...document.querySelectorAll(".topnav [data-nav]")];
    const missingNavTargets=navButtons.filter(button=>!screens.has(SYSTEM_ROUTE_MAP[button.dataset.nav])).length;
    return buildDiagnosticsSummary({
      version:APP_VERSION, storageVolatile:this.storageVolatile, profiles:this.profiles.length+(this.activeProfileId==="guest"?1:0), activeProfile:this.getActiveProfile()?.name,
      counts:{games:MODE_METADATA.length,lessons:LESSON_METADATA.length,smartPractice:SMART_PRACTICE_MODES.length,trainee:TRAINEE_MODULES.length,accuracyClinic:ACCURACY_CLINIC_PROTOCOLS.length,tenKey:TEN_KEY_PROTOCOLS.length,punctuation:PUNCTUATION_BUSINESS_PROTOCOLS.length,timedTests:CERTIFICATION_DURATIONS.length,theory:THEORY_TOPICS.length},
      dom:{
        duplicateIds, missingNavTargets,
        unlabeledDialogs:[...document.querySelectorAll("dialog")].filter(dialog=>{ const id=dialog.getAttribute("aria-labelledby"); return !id || !document.getElementById(id); }).length,
        skipTargetFocusable:Boolean(this.ui.appMain?.hasAttribute("tabindex")),
        liveRegions:document.querySelectorAll("[aria-live]").length,
        motionPreference:this.settings.motionPreference || "system"
      }
    });
  }

  renderDiagnostics(explicit=false) {
    if (!this.ui.diagnosticsResults) return;
    const summary=this.getDiagnosticsSummary();
    const allGood=summary.passed===summary.total;
    this.ui.diagnosticsResults.innerHTML=`<div class="diagnostics-summary ${allGood?"good":"warn"}"><div><span>Suite status</span><strong>${summary.passed}/${summary.total} checks passed</strong><small>Build ${this.escapeHtml(summary.version)} · Profile ${this.escapeHtml(summary.activeProfile)}</small></div><b>${allGood?"READY":"REVIEW"}</b></div><div class="diagnostics-grid">${summary.checks.map(item=>`<div class="diagnostic-row ${item.ok?"pass":"fail"}"><span>${item.ok?"✓":"!"}</span><div><strong>${this.escapeHtml(item.label)}</strong><small>${this.escapeHtml(item.detail)}</small></div></div>`).join("")}</div><div class="diagnostics-note">${this.storageWarning?this.escapeHtml(this.storageWarning):"Diagnostics are read-only. They do not alter scores, adaptive data, profiles, or backups."}${explicit?" · Check completed now.":""}</div>`;
  }

  getProfileTortureProbe() {
    try {
      const raw={
        id:"", name:"   ", avatar:"unknown", createdAt:-1, updatedAt:"bad",
        data:{
          settings:{difficulty:"nightmare",motionPreference:"spin",sound:"yes"},
          scores:[null,{activityType:"lesson",wpm:-50,accuracy:500,durationMs:-1,timestamp:-2}],
          keyStats:{a:{attempts:-5,correct:999,errors:-2}}, keyHistory:[null,{timestamp:"bad",keys:{q:{attempts:2,correct:1,errors:1}}}],
          pairStats:{th:{attempts:-1,correct:99,errors:-1}}, achievements:{bogus:true}, traineeProgress:{bogus:true},
          customPracticePresets:[
            {id:"dup",name:"Same",config:{minLength:99,maxLength:-2}},
            {id:"dup",name:"Same",config:{durationMinutes:999}}
          ],
          dailyPlanState:{durationMinutes:999,steps:[{id:"bad",action:{type:"lesson",id:"missing_lesson"}}],completedStepIds:["bad"]},
          dailyPlanHistory:[{dateKey:"",completedAt:-1}], theoryProgress:{bogus:{reviewed:true}}, onboardingState:{experience:"???",goal:"???"},
          navigationState:{favorites:["lessons","missing","lessons"],recent:[{id:"missing",visitedAt:-5}],lastModule:"missing",lastVisitedAt:-2}
        }
      };
      const clean=this.normalizeProfile(raw);
      const presetIds=(clean.data.customPracticePresets||[]).map(item=>item.id);
      const presetNames=(clean.data.customPracticePresets||[]).map(item=>item.name.toLowerCase());
      const ok=Boolean(clean.id && clean.name && clean.avatar==="initials"
        && clean.data.settings.difficulty==="normal"
        && clean.data.scores[0]?.wpm===0 && clean.data.scores[0]?.accuracy===100
        && clean.data.dailyPlanState?.steps?.length===0
        && !clean.data.theoryProgress.bogus
        && clean.data.navigationState.favorites.length===1 && clean.data.navigationState.favorites[0]==="lessons" && clean.data.navigationState.recent.length===0 && clean.data.navigationState.lastModule===""
        && new Set(presetIds).size===presetIds.length
        && new Set(presetNames).size===presetNames.length);
      return {ok,detail:ok?"Corrupt settings, score values, IDs, presets, plan actions, and topic state repaired in memory":"One or more corrupt-profile fields survived normalization"};
    } catch (error) {
      return {ok:false,detail:`Normalizer threw: ${error?.message||error}`};
    }
  }

  getSystemTortureTestSummary() {
    const domIds=[...document.querySelectorAll("[id]")].map(el=>el.id);
    const navTargets=[...document.querySelectorAll(".topnav [data-nav]")].map(el=>el.dataset.nav).filter(Boolean);
    const reportTypes=[...this.ui.reportsContent?.querySelectorAll?.("[data-report-type]")||[]].map(el=>el.dataset.reportType).filter(type=>type && type!=="help");
    if (this.ui.reportsContent?.querySelector?.("#lessonCertificateButton")) reportTypes.push("lessonCertificate");
    if (this.ui.reportsContent?.querySelector?.("#certificationResultButton")) reportTypes.push("certificationResult");
    return runHyperSoftSystemTortureTest({
      version:APP_VERSION,
      traineeIds:TRAINEE_MODULES.map(item=>item.id),
      navTargets,
      screenIds:this.ui.screens.map(screen=>screen.id),
      domIds,
      reportTypes:[...new Set(reportTypes)],
      dailyPlanState:this.dailyPlanState,
      presets:this.customPracticePresets||[],
      scores:this.scores||[],
      profiles:this.profiles||[],
      profileProbe:this.getProfileTortureProbe(),
      navigationState:this.navigationState,
      storageVolatile:this.storageVolatile
    });
  }

  renderSystemTortureTest(explicit=false) {
    if (!this.ui.tortureTestResults) return;
    const summary=this.getSystemTortureTestSummary();
    const grouped=new Map();
    summary.checks.forEach(check=>{ if(!grouped.has(check.category)) grouped.set(check.category,[]); grouped.get(check.category).push(check); });
    const badge=summary.failed?"FAIL":summary.warnings?"WARN":"PASS";
    this.ui.tortureTestResults.innerHTML=`<div class="torture-summary ${badge.toLowerCase()}"><div><span>Read-only torture suite</span><strong>${summary.passed} passed · ${summary.warnings} warnings · ${summary.failed} failed</strong><small>${summary.total} assertions · Build ${this.escapeHtml(summary.version)}</small></div><b>${badge}</b></div><div class="torture-groups">${[...grouped.entries()].map(([category,checks])=>`<section class="torture-group"><h4>${this.escapeHtml(category)}</h4>${checks.map(item=>`<div class="torture-row ${item.severity}"><span>${item.severity==="pass"?"✓":item.severity==="warn"?"?":"!"}</span><div><strong>${this.escapeHtml(item.label)}</strong><small>${this.escapeHtml(item.detail)}</small></div></div>`).join("")}</section>`).join("")}</div><div class="diagnostics-note">Synthetic corruption cases run entirely in memory. No profile, score, preset, backup, or training result is modified.${explicit?" · Torture test completed now.":""}</div>`;
  }

  renderTrainee() {
    if (!this.ui.traineeStationList || !this.ui.traineeWorkstation) return;
    const completed = TRAINEE_MODULES.filter(item => this.traineeProgress?.[item.id]).length;
    const pct = Math.round((completed / TRAINEE_MODULES.length) * 100);
    this.ui.traineeProgressText.textContent = `${completed} of ${TRAINEE_MODULES.length} stations complete`;
    this.ui.traineeProgressFill.style.width = `${pct}%`;
    this.ui.traineeReadinessText.textContent = completed === TRAINEE_MODULES.length
      ? "Foundation course complete. You are ready for formal Lessons; Smart Practice becomes more useful after you have some lesson history."
      : completed >= 5
        ? "Good foundation. Finish the remaining stations before treating WPM as your main goal."
        : "Technique first: posture, keyboard map, finger zones, eyes-up typing, and rhythm all come before raw speed.";

    this.ui.traineeStationList.innerHTML = TRAINEE_MODULES.map(item => {
      const done = Boolean(this.traineeProgress?.[item.id]);
      const active = item.id === this.currentTraineeStepId;
      return `<button type="button" class="trainee-station ${done ? "complete" : ""} ${active ? "active" : ""}" data-trainee-station="${item.id}" aria-current="${active ? "step" : "false"}">
        <span class="trainee-station-number">${done ? "✓" : item.number}</span>
        <span><strong>${this.escapeHtml(item.title)}</strong><small>${this.escapeHtml(item.summary)}</small></span>
      </button>`;
    }).join("");
    this.renderTraineeWorkstation();
  }

  renderTraineeWorkstation(feedback = "") {
    if (!this.ui.traineeWorkstation) return;
    const item = TRAINEE_MODULES.find(step => step.id === this.currentTraineeStepId) ?? TRAINEE_MODULES[0];
    const done = Boolean(this.traineeProgress?.[item.id]);
    const body = item.theory.map(text => `<li>${this.escapeHtml(text)}</li>`).join("");
    const activity = item.type === "quiz"
      ? `<div class="trainee-check-card">
          <span class="trainee-check-label">Knowledge Check</span>
          <strong>${this.escapeHtml(item.question)}</strong>
          <div class="trainee-answer-grid">${item.options.map((option, index) => `<button type="button" class="secondary" data-trainee-answer="${index}">${this.escapeHtml(option)}</button>`).join("")}</div>
        </div>`
      : `<div class="trainee-check-card trainee-typing-check">
          <span class="trainee-check-label">Technique Check</span>
          <strong>Type this exactly. Do not race it.</strong>
          <div class="trainee-target-text">${this.escapeHtml(item.target)}</div>
          <input id="traineeTypingInput" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Keyboard Trainee typing check" />
          <button class="primary" type="button" data-trainee-check="1">Check My Typing</button>
        </div>`;
    this.ui.traineeWorkstation.innerHTML = `
      <div class="trainee-workstation-title">
        <span class="trainee-large-icon">${this.escapeHtml(item.icon)}</span>
        <div><span>Station ${item.number} of ${TRAINEE_MODULES.length}</span><h3>${this.escapeHtml(item.title)}</h3><p>${this.escapeHtml(item.summary)}</p></div>
        <span class="trainee-status-chip ${done ? "complete" : ""}">${done ? "COMPLETE" : "IN TRAINING"}</span>
      </div>
      <div class="trainee-theory-grid">
        <section><h4>What to know</h4><ul>${body}</ul></section>
        <aside><h4>HyperSoft Principle</h4><p>${this.escapeHtml(item.principle)}</p><div class="trainee-keyboard-map" aria-label="Simplified touch typing hand zones">
          <span>LP</span><span>LR</span><span>LM</span><span>LI</span><span>LI</span><span>RI</span><span>RI</span><span>RM</span><span>RR</span><span>RP</span>
          <small>Left pinky → right pinky finger zones</small>
        </div></aside>
      </div>
      ${activity}
      <div class="trainee-feedback ${feedback ? "visible" : ""}" id="traineeFeedback">${feedback}</div>
      ${done ? `<div class="trainee-complete-note">✓ This station is complete. Revisit it anytime, or choose the next unfinished station.</div>` : ""}
    `;
    if (item.type === "typing") requestAnimationFrame(() => document.getElementById("traineeTypingInput")?.focus());
  }

  selectTraineeStep(stepId) {
    if (!TRAINEE_MODULES.some(item => item.id === stepId)) return;
    this.currentTraineeStepId = stepId;
    this.renderTrainee();
  }

  answerTraineeQuiz(answerIndex) {
    const item = TRAINEE_MODULES.find(step => step.id === this.currentTraineeStepId);
    if (!item || item.type !== "quiz") return;
    if (answerIndex === item.answer) {
      this.completeTraineeStep(item.id, "Correct. That is the technique HyperSoft wants you to carry into the typing curriculum.");
    } else {
      this.renderTraineeWorkstation("Not quite. Re-read the principle above and choose the answer that supports repeatable touch-typing technique.");
      this.playTrainingTone(false);
    }
  }

  checkTraineeTyping() {
    const item = TRAINEE_MODULES.find(step => step.id === this.currentTraineeStepId);
    if (!item || item.type !== "typing") return;
    const input = document.getElementById("traineeTypingInput");
    const entered = String(input?.value ?? "");
    if (entered === item.target) {
      this.completeTraineeStep(item.id, "Clean entry. The goal here was deliberate technique, not speed.");
      return;
    }
    let firstMismatch = 0;
    while (firstMismatch < entered.length && firstMismatch < item.target.length && entered[firstMismatch] === item.target[firstMismatch]) firstMismatch += 1;
    const expected = item.target[firstMismatch] ?? "end of line";
    this.renderTraineeWorkstation(`That entry was not exact. First mismatch: expected “${this.escapeHtml(expected)}”. Slow down and try the line again.`);
    this.playTrainingTone(false);
  }

  completeTraineeStep(stepId, feedback = "Station complete.") {
    if (!TRAINEE_MODULES.some(item => item.id === stepId)) return;
    this.traineeProgress[stepId] = true;
    this.persistActiveProfile();
    this.playTrainingTone(true);
    this.currentTraineeStepId = stepId;
    this.renderTrainee();
    const feedbackNode = this.ui.traineeWorkstation?.querySelector("#traineeFeedback");
    if (feedbackNode && feedback) { feedbackNode.textContent = feedback; feedbackNode.classList.add("visible"); }
  }

  resetTraineeProgress() {
    if (!confirm("Reset Keyboard Trainee foundation progress for this learner? Formal lesson, game, and Smart Practice history will not be changed.")) return;
    this.traineeProgress = {};
    this.currentTraineeStepId = TRAINEE_MODULES[0].id;
    this.persistActiveProfile();
    this.renderTrainee();
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
    this.ui.lessonGrid.querySelectorAll("[data-lesson]").forEach(button => {
      button.addEventListener("click", () => this.startLesson(button.dataset.lesson));
    });
  }

  renderSmartPracticeWeakKeySummary() {
    if (!this.ui.smartPracticeWeakKeySummary) return;
    const weak = this.getWeakKeys(5);
    const pairs = this.getWeakPairs(4);
    if (!weak.length && !pairs.length) {
      this.ui.smartPracticeWeakKeySummary.innerHTML = `<strong>Adaptive focus:</strong> Complete a few lesson-style sessions and HyperSoft will begin identifying weak keys and troublesome two-letter transitions for targeted drills.`;
      return;
    }
    const keyText = weak.length ? `Weak keys: ${weak.map(item => this.formatKeyLabel(item.key)).join(", ")}` : "No established weak keys";
    const pairText = pairs.length ? `Trouble pairs: ${pairs.map(item => item.pair.toUpperCase()).join(", ")}` : "No established trouble pairs";
    this.ui.smartPracticeWeakKeySummary.innerHTML = `<strong>Adaptive focus:</strong> ${this.escapeHtml(keyText)} <span class="adaptive-separator">•</span> ${this.escapeHtml(pairText)}`;
  }

  renderSmartPracticeLab() {
    if (!this.ui.smartPracticeLab) return;
    const weakPairs = this.getWeakPairs(5);
    const poolStats = getSmartPoolStats({
      listName: this.settings.wordList,
      focusPairs: weakPairs.map(item => item.pair)
    });
    const listLabel = ({ general: "General", office: "Office", technical: "Technical" }[this.settings.wordList] || this.settings.wordList);
    const pairNoteHtml = weakPairs.length
      ? `Current transition focus: ${this.renderPairAccuracyItems(weakPairs.slice(0, 4))}`
      : this.escapeHtml("Transition focus will personalize after several lesson-style sessions.");

    const practiceRows = (this.scores ?? []).filter(row => row.activityType === "practice");
    const pacificDay = value => new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date(value));
    const todayKey = pacificDay(Date.now());
    const todayRuns = practiceRows.filter(row => pacificDay(Number(row.timestamp) || Date.now()) === todayKey).length;
    const drillRecords = SMART_PRACTICE_MODES.map(mode => this.getLessonProgress(mode)).filter(record => record.attempts);
    const averageBestWpm = drillRecords.length ? Math.round(drillRecords.reduce((sum, record) => sum + (Number(record.bestWpm) || 0), 0) / drillRecords.length) : 0;
    const averageBestAccuracy = drillRecords.length ? Math.round(drillRecords.reduce((sum, record) => sum + (Number(record.bestAccuracy) || 0), 0) / drillRecords.length) : 0;

    this.ui.smartPracticeLab.innerHTML = `
      <section class="smart-practice-panel">
        <div class="smart-practice-heading">
          <div>
            <span class="eyebrow">Keyboard-aware generation</span>
            <h3>Smart Practice Lab</h3>
            <p>These drills analyze the actual keyboard geometry of the ${this.escapeHtml(listLabel)} vocabulary pool instead of merely choosing random words by length.</p>
          </div>
          <div class="smart-pool-summary">
            <strong>${poolStats.total}</strong><span>analyzed words</span>
            <small class="smart-pair-note">${pairNoteHtml}</small>
          </div>
        </div>
        <div class="smart-drill-grid">
          ${SMART_PRACTICE_MODES.map(mode => {
            const record = this.getLessonProgress(mode);
            const count = poolStats[mode.smartStrategy] ?? poolStats.total;
            const runLabel = record.attempts === 1 ? "run" : "runs";
            return `<article class="smart-drill-card smart-strategy-${this.escapeHtml(mode.smartStrategy)} ${mode.smartStrategy === "troublePairs" ? "adaptive-card" : ""}">
              <div class="lesson-card-topline"><span class="mode-number">${this.escapeHtml(mode.number)}</span><span class="smart-pool-chip">~${count} matching words</span></div>
              <h4>${this.escapeHtml(mode.title)}</h4>
              <p>${this.escapeHtml(mode.subtitle)}</p>
              <div class="game-card-meta">${mode.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join("")}</div>
              <div class="lesson-record-line">${record.attempts ? `${record.attempts} ${runLabel} • Best <strong>${record.bestWpm} WPM</strong> / <strong>${record.bestAccuracy}%</strong>` : `Not practiced yet • ${mode.targetWpm} WPM / ${mode.targetAccuracy}% reference`}</div>
              <button type="button" data-smart-drill="${mode.id}"><span class="hyper98-play-triangle" aria-hidden="true">▶</span>Start ${this.escapeHtml(mode.title)}</button>
            </article>`;
          }).join("")}
          <div class="smart-lab-footer">
            <div class="smart-lab-about">
              <span class="smart-lab-bulb" aria-hidden="true">💡</span>
              <div><strong>About Smart Practice</strong><p>Each drill adapts to your performance and focuses on the skills that will improve your typing the most.</p><small>Run them regularly for fastest results!</small></div>
            </div>
            <div class="smart-lab-stats">
              <div><span aria-hidden="true">🎯</span><b>Drills Completed</b><strong>${todayRuns}</strong><small>today</small></div>
              <div><span aria-hidden="true">📊</span><b>Total Drill Runs</b><strong>${practiceRows.length}</strong><small>all time</small></div>
              <div><span aria-hidden="true">⏱</span><b>Avg Drill Best</b><strong>${averageBestWpm || "—"} WPM / ${averageBestAccuracy || "—"}%</strong></div>
            </div>
          </div>
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
      .filter(row => ["lesson", "practice", "customPractice"].includes(row.activityType) && row.modeId === lessonId)
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
      ${weak.length ? this.renderKeyAccuracyItems(weak, { chipClass: "weak-key-chip" }) : `<span class="adaptive-profile-note">No persistent single-key weakness</span>`}
      ${pairs.length ? `<span class="adaptive-separator">Transitions:</span>${this.renderPairAccuracyItems(pairs, { chipClass: "pair-focus-chip" })}` : ""}
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
    if (!this.ui.tournamentDialog.open) this.openAccessibleDialog(this.ui.tournamentDialog, { initialFocus: "#tournamentFormatSelect" });
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
    if (!Array.isArray(this.tournament.rounds) || this.tournament.currentIndex < 0 || this.tournament.currentIndex >= this.tournament.rounds.length) {
      this.abortTournament();
      return;
    }
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
    if (!this.tournament?.active || !this.tournament.awaitingContinue) return;
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
    this.pendingGameId = null;
    this.pendingGameOptions = {};
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

  shouldReduceMotion() {
    if (this.settings?.motionPreference === "reduced") return true;
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  }

  applyMotionPreference() {
    const reduced = this.shouldReduceMotion();
    document.documentElement.dataset.motion = reduced ? "reduced" : "standard";
  }

  openAccessibleDialog(dialog, { initialFocus = null } = {}) {
    if (!dialog) return;
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const returnFocus = active && !active.closest("dialog") ? active : this.lastNonDialogFocus;
    this.dialogFocusReturn.set(dialog, { element: returnFocus, screen: this.currentScreenName });
    if (!dialog.open) dialog.showModal();
    requestAnimationFrame(() => {
      const preferred = typeof initialFocus === "string" ? dialog.querySelector(initialFocus) : initialFocus;
      const target = preferred || dialog.querySelector("[data-dialog-initial-focus]") || hyperSoftGetFocusableElements(dialog)[0] || dialog;
      if (target === dialog && !dialog.hasAttribute("tabindex")) dialog.setAttribute("tabindex", "-1");
      target?.focus?.({ preventScroll: true });
    });
  }

  bindDialogAccessibility() {
    document.addEventListener("focusin", event => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target && !target.closest("dialog")) this.lastNonDialogFocus = target;
    });
    document.addEventListener("pointerdown", () => { this.lastInputModality = "pointer"; }, { passive: true });
    document.addEventListener("keydown", event => {
      if (["Tab", "Enter", " ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) this.lastInputModality = "keyboard";
    }, true);
    const dialogs = [this.ui.onboardingDialog, this.ui.profileDialog, this.ui.tournamentDialog, this.ui.hostDialog, this.ui.guideDialog, this.ui.helpDialog, this.ui.resultDialog, this.ui.aboutDialog].filter(Boolean);
    dialogs.forEach(dialog => {
      dialog.addEventListener("close", () => {
        const record = this.dialogFocusReturn.get(dialog);
        this.dialogFocusReturn.delete(dialog);
        if (!record || record.screen !== this.currentScreenName || document.querySelector("dialog[open]")) return;
        requestAnimationFrame(() => {
          if (record.screen !== this.currentScreenName || document.querySelector("dialog[open]")) return;
          if (hyperSoftElementCanReceiveFocus(record.element)) record.element.focus({ preventScroll: true });
          else this.focusCurrentScreenHeading({ preventScroll: true });
        });
      });
    });
  }

  focusCurrentScreenHeading({ preventScroll = false } = {}) {
    const screen = this.ui.screens.find(item => item.classList.contains("is-active"));
    const heading = screen?.querySelector("h1, h2");
    if (!heading) return false;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll });
    return true;
  }

  handleTopNavigationKeys(event) {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = [...document.querySelectorAll(".topnav [data-nav]")].filter(button => !button.disabled && button.offsetParent !== null);
    if (!buttons.length) return;
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    let next = current;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = buttons.length - 1;
    else if (["ArrowRight", "ArrowDown"].includes(event.key)) next = (current + 1) % buttons.length;
    else next = (current - 1 + buttons.length) % buttons.length;
    buttons[next].focus();
  }

  renderSettings() {
    this.ui.difficultySelect.value = this.settings.difficulty;
    this.ui.wordListSelect.value = this.settings.wordList;
    this.ui.themeSelect.value = this.settings.theme;
    this.ui.hyper98PaletteSelect.value = this.settings.hyper98Palette || "blue";
    this.updateHyper98PaletteVisibility();
    this.ui.soundToggle.checked = this.settings.sound;
    this.ui.soundVolumeSelect.value = this.settings.soundVolume || "normal";
    if (this.ui.soundTestStatus) this.ui.soundTestStatus.textContent = this.settings.sound
      ? `Sound Effects are ON at ${this.settings.soundVolume || "normal"} level. Use Test HyperSoft Sounds to verify your browser output.`
      : "Sound Effects are currently OFF for this profile. Test HyperSoft Sounds will still demonstrate the available audio.";
    this.ui.multimediaSelect.value = this.settings.multimedia || "standard";
    this.ui.backupReminderToggle.checked = this.settings.backupReminder !== false;
    this.ui.startupToggle.checked = this.settings.startup !== false;
    this.ui.lessonKeyboardCoachToggle.checked = this.settings.lessonKeyboardCoach !== false;
    if (this.ui.motionPreferenceSelect) this.ui.motionPreferenceSelect.value = this.settings.motionPreference || "system";
    const profile = this.getActiveProfile();
    this.ui.settingsProfileContext.textContent = this.activeProfileId === "guest"
      ? "Guest preferences are temporary and will not be saved."
      : `These preferences belong to ${profile?.name ?? "the active profile"}.`;
    this.renderDifficultyPreview();
    this.renderDiagnostics();
  }

  updateHyper98PaletteVisibility() {
    if (!this.ui.hyper98PaletteField) return;
    const isHyper98 = this.ui.themeSelect?.value === "hyper98";
    this.ui.hyper98PaletteField.hidden = !isHyper98;
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

  normalizeCustomPracticePresets(value) {
    if (!Array.isArray(value)) return [];
    const ids=new Set();
    const names=new Set();
    return value.slice(-8).map((item,index)=>{
      if (!item || typeof item!=="object" || Array.isArray(item)) return null;
      let id=String(item.id||`custom_${index+1}`).trim().slice(0,80) || `custom_${index+1}`;
      const baseId=id;
      let suffix=2;
      while (ids.has(id)) id=`${baseId.slice(0,70)}_${suffix++}`.slice(0,80);
      ids.add(id);
      let name=String(item.name||`Preset ${index+1}`).trim().slice(0,28) || `Preset ${index+1}`;
      const baseName=name;
      suffix=2;
      while (names.has(name.toLowerCase())) name=`${baseName.slice(0,21)} (${suffix++})`.slice(0,28);
      names.add(name.toLowerCase());
      return {id,name,config:normalizeCustomPracticeConfig(item.config)};
    }).filter(Boolean);
  }

  loadCustomPracticePresets() {
    const profile = this.getActiveProfile();
    const rows = profile?.data?.customPracticePresets;
    return this.normalizeCustomPracticePresets(rows);
  }

  loadCustomPracticeLastConfig() {
    const profile = this.getActiveProfile();
    return normalizeCustomPracticeConfig(profile?.data?.customPracticeLastConfig ?? CUSTOM_PRACTICE_DEFAULTS);
  }

  getCustomPracticeConfigFromForm() {
    if (!this.ui.customPracticeForm) return normalizeCustomPracticeConfig(this.customPracticeLastConfig);
    return normalizeCustomPracticeConfig({
      focus: this.ui.customPracticeFocusSelect?.value,
      wordList: this.ui.customPracticeWordListSelect?.value,
      minLength: this.ui.customPracticeMinLength?.value,
      maxLength: this.ui.customPracticeMaxLength?.value,
      customKeys: this.ui.customPracticeKeysInput?.value,
      customPairs: this.ui.customPracticePairsInput?.value,
      capitals: this.ui.customPracticeCapitalsToggle?.checked,
      punctuation: this.ui.customPracticePunctuationToggle?.checked,
      numberRow: this.ui.customPracticeNumberRowToggle?.checked,
      durationMinutes: this.ui.customPracticeDurationSelect?.value,
      targetWpm: this.ui.customPracticeTargetWpm?.value,
      targetAccuracy: this.ui.customPracticeAccuracySelect?.value
    });
  }

  applyCustomPracticeConfig(config) {
    const c = normalizeCustomPracticeConfig(config);
    if (!this.ui.customPracticeForm) return;
    this.ui.customPracticeFocusSelect.value = c.focus;
    this.ui.customPracticeWordListSelect.value = c.wordList;
    this.ui.customPracticeMinLength.value = String(c.minLength);
    this.ui.customPracticeMaxLength.value = String(c.maxLength);
    this.ui.customPracticeKeysInput.value = c.customKeys;
    this.ui.customPracticePairsInput.value = c.customPairs;
    this.ui.customPracticeCapitalsToggle.checked = c.capitals;
    this.ui.customPracticePunctuationToggle.checked = c.punctuation;
    this.ui.customPracticeNumberRowToggle.checked = c.numberRow;
    this.ui.customPracticeDurationSelect.value = String(c.durationMinutes);
    this.ui.customPracticeTargetWpm.value = String(c.targetWpm);
    this.ui.customPracticeAccuracySelect.value = String(c.targetAccuracy);
    this.renderCustomPracticePreview();
  }

  renderCustomPracticeBuilder() {
    if (!this.ui.customPracticeForm) return;
    this.applyCustomPracticeConfig(this.customPracticeLastConfig ?? CUSTOM_PRACTICE_DEFAULTS);
    const weakKeys = this.getWeakKeys(8);
    const weakPairs = this.getWeakPairs(8);
    if (this.ui.customWeakKeyCount) this.ui.customWeakKeyCount.textContent = weakKeys.length ? `${weakKeys.length} established` : "None established yet";
    if (this.ui.customPairCount) this.ui.customPairCount.textContent = weakPairs.length ? `${weakPairs.length} established` : "None established yet";
    this.renderCustomPracticeSavedPresets();
  }

  renderCustomPracticePreview() {
    if (!this.ui.customPracticePreview) return;
    const c = this.getCustomPracticeConfigFromForm();
    if (Number(c.minLength) > Number(c.maxLength)) {
      c.maxLength = c.minLength;
      if (this.ui.customPracticeMaxLength) this.ui.customPracticeMaxLength.value = String(c.maxLength);
    }
    const weakKeys = this.getWeakKeys(8);
    const weakPairs = this.getWeakPairs(8);
    const focusHtml = {
      balanced: this.escapeHtml("Balanced keyboard coverage"),
      weakKeys: weakKeys.length
        ? `Stored weak keys: ${this.renderKeyAccuracyItems(weakKeys.slice(0, 6))}`
        : this.escapeHtml("Weak-key mode selected, but no established weak keys exist yet; HyperSoft will use broad mixed coverage."),
      troublePairs: weakPairs.length
        ? `Stored trouble pairs: ${this.renderPairAccuracyItems(weakPairs.slice(0, 6))}`
        : this.escapeHtml("Trouble-pair mode selected, but no established pair weaknesses exist yet; HyperSoft will use a broad transition pool."),
      custom: `Custom focus: ${this.escapeHtml(c.customKeys.trim() || "no keys entered")}${c.customPairs.trim() ? ` · pairs ${this.escapeHtml(c.customPairs.trim())}` : ""}`
    }[c.focus];

    const extras = [
      c.capitals ? "capitals" : null,
      c.punctuation ? "punctuation" : null,
      c.numberRow ? "number row + numeric forms" : null
    ].filter(Boolean);

    this.ui.customPracticePreview.innerHTML = `
      <div class="custom-preview-heading"><span>Live Session Preview</span><strong>${c.durationMinutes} min</strong></div>
      <h3 class="custom-preview-focus">${focusHtml}</h3>
      <p>${this.escapeHtml(c.wordList === "profile" ? `Profile vocabulary (${this.settings.wordList})` : `${c.wordList} vocabulary`)} · ${c.minLength}–${c.maxLength} letter words${extras.length ? ` · ${extras.join(" · ")}` : ""}</p>
      <div class="custom-preview-meters">
        <div><span>Speed Target</span><strong>${c.targetWpm} WPM</strong></div>
        <div><span>Accuracy Target</span><strong>${c.targetAccuracy}%</strong></div>
        <div><span>Session</span><strong>${c.durationMinutes}:00</strong></div>
      </div>
      <small>Custom Practice feeds weak-key and trouble-pair analytics, but it does not count toward the 14-lesson curriculum certificate.</small>
    `;
  }

  renderCustomPracticeSavedPresets() {
    if (!this.ui.customPracticeSavedPresets) return;
    if (!this.customPracticePresets.length) {
      this.ui.customPracticeSavedPresets.innerHTML = `<div class="custom-preset-empty">No saved presets yet. Configure a drill, give it a name, and save it for later.</div>`;
      return;
    }
    this.ui.customPracticeSavedPresets.innerHTML = this.customPracticePresets.map(item => {
      const c = normalizeCustomPracticeConfig(item.config);
      return `<article class="custom-saved-preset">
        <div><strong>${this.escapeHtml(item.name)}</strong><span>${c.durationMinutes} min · ${c.targetWpm} WPM · ${c.targetAccuracy}% · ${this.escapeHtml(c.focus)}</span></div>
        <div><button class="secondary" type="button" data-custom-load="${this.escapeHtml(item.id)}">Load</button><button class="danger-ghost" type="button" data-custom-delete="${this.escapeHtml(item.id)}">Delete</button></div>
      </article>`;
    }).join("");
  }

  saveCustomPracticePreset() {
    const name = String(this.ui.customPracticePresetName?.value || "").trim().slice(0, 28);
    if (!name) {
      if (this.ui.customPracticePresetName) {
        this.ui.customPracticePresetName.focus();
        this.ui.customPracticePresetName.setCustomValidity("Name this preset before saving it.");
        this.ui.customPracticePresetName.reportValidity();
        window.setTimeout(() => this.ui.customPracticePresetName?.setCustomValidity(""), 100);
      }
      return;
    }
    const config = this.getCustomPracticeConfigFromForm();
    const existing = this.customPracticePresets.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!confirm(`Replace the saved preset "${existing.name}" with the current configuration?`)) return;
      existing.config = config;
    } else {
      if (this.customPracticePresets.length >= 8) {
        alert("HyperSoft stores up to eight custom practice presets per learner. Delete one before saving another.");
        return;
      }
      this.customPracticePresets.push({
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        config
      });
    }
    this.customPracticeLastConfig = config;
    this.persistActiveProfile();
    this.renderCustomPracticeSavedPresets();
    if (this.ui.customPracticePresetName) this.ui.customPracticePresetName.value = "";
  }

  deleteCustomPracticePreset(id) {
    const preset = this.customPracticePresets.find(item => item.id === id);
    if (!preset) return;
    if (!confirm(`Delete the custom practice preset "${preset.name}"?`)) return;
    this.customPracticePresets = this.customPracticePresets.filter(item => item.id !== id);
    this.persistActiveProfile();
    this.renderCustomPracticeSavedPresets();
  }

  startCustomPracticeFromBuilder() {
    const config = this.getCustomPracticeConfigFromForm();
    this.customPracticeLastConfig = config;
    this.customPracticeDefinition = buildCustomPracticeLesson(config, {
      weakKeys: this.getWeakKeys(8),
      weakPairs: this.getWeakPairs(8),
      difficulty: this.settings.difficulty,
      defaultWordList: this.settings.wordList,
      title: this.ui.customPracticePresetName?.value.trim()
        ? `Custom: ${this.ui.customPracticePresetName.value.trim().slice(0, 32)}`
        : "Custom Practice Session"
    });
    this.persistActiveProfile();
    this.startLesson(this.customPracticeDefinition.id);
  }

  getLessonDefinition(lessonId) {
    if (lessonId === "customPracticeBuilder" && this.customPracticeDefinition) return this.customPracticeDefinition;
    return LESSON_METADATA.find(item => item.id === lessonId)
      ?? SMART_PRACTICE_MODES.find(item => item.id === lessonId)
      ?? null;
  }

  getLessonHomeScreen(lesson) {
    if (lesson?.isCustomPractice) return "customPractice";
    if (lesson?.isSmartPractice) return "smartPractice";
    return "lessons";
  }

  getTechniqueAnalysis() {
    return analyzeTechniqueProfile({
      scores: this.scores,
      keyStats: this.keyStats,
      pairStats: this.pairStats,
      traineeProgress: this.traineeProgress
    });
  }

  encodeTechniqueAction(action = {}) {
    return encodeURIComponent(JSON.stringify(action));
  }

  runTechniqueAction(action = {}) {
    if (!action || typeof action !== "object") return;
    if (action.type === "lesson" && action.id) {
      const lesson = this.getLessonDefinition(action.id);
      if (lesson) this.startLesson(action.id);
      return;
    }
    if (action.type === "screen" && action.id) {
      this.exitTo(action.id);
      return;
    }
    this.exitTo("assessment");
  }

  renderTechniqueCoach() {
    if (!this.ui.techniqueSummary || !this.ui.techniqueMetrics || !this.ui.techniquePlan || !this.ui.techniqueWeaknesses) return;
    const analysis = this.getTechniqueAnalysis();
    const profile = this.getActiveProfile();
    const confidenceClass = analysis.confidence.toLowerCase();
    this.ui.techniqueSummary.innerHTML = `
      <section class="technique-summary-card">
        <div class="technique-summary-score ${confidenceClass}">
          <span>Technique Index</span>
          <strong>${analysis.aggregate || "—"}${analysis.aggregate ? `<small>/100</small>` : ""}</strong>
          <em>${this.escapeHtml(analysis.level)}</em>
        </div>
        <div class="technique-summary-copy">
          <span class="eyebrow">${this.escapeHtml(profile?.name || "Learner")} • ${analysis.confidence} confidence</span>
          <h3>${this.escapeHtml(analysis.summary)}</h3>
          <p>${analysis.assessment
            ? `Technique Coach is combining your latest Placement Assessment with ${analysis.recentSessions} recent sustained training ${analysis.recentSessions === 1 ? "session" : "sessions"}.`
            : `Technique Coach can already read saved key history, but a Placement Assessment is needed for rhythm, correction behavior, mixed-key slowdown, and speed sustainability.`}</p>
          <div class="technique-summary-tags"><span>${analysis.traineeCompleted}/8 Trainee stations</span><span>${analysis.weakKeys.length} established weak keys</span><span>${analysis.weakPairs.length} trouble pairs surfaced</span></div>
        </div>
      </section>`;

    this.ui.techniqueMetrics.innerHTML = analysis.metrics.map(item => `
      <article class="technique-metric-card ${item.tone}">
        <div class="technique-metric-top"><span>${this.escapeHtml(item.title)}</span><strong>${item.score == null ? "—" : item.score}</strong></div>
        <div class="technique-status"><span>${this.escapeHtml(item.label)}</span>${item.score == null ? "" : `<div aria-hidden="true"><i style="width:${item.score}%"></i></div>`}</div>
        <p class="technique-evidence">${item.id === "transitions" && analysis.weakPairs.length ? this.renderPairAccuracyItems(analysis.weakPairs.slice(0, 5)) : this.escapeHtml(item.evidence)}</p>
        <p>${this.escapeHtml(item.coaching)}</p>
        <button class="secondary" type="button" data-technique-action='${this.encodeTechniqueAction(item.action)}'>${this.escapeHtml(item.action?.label || "Open Training")}</button>
      </article>`).join("");

    this.ui.techniquePlan.innerHTML = analysis.plan.map((step, index) => `
      <article class="technique-plan-step">
        <span>${index + 1}</span>
        <div><strong>${this.escapeHtml(step.title)}</strong><p>${this.escapeHtml(step.reason)}</p></div>
        <button class="primary" type="button" data-technique-action='${this.encodeTechniqueAction(step.action)}'>${this.escapeHtml(step.action?.label || "Start")}</button>
      </article>`).join("");

    const latest = analysis.assessment;
    this.ui.techniqueWeaknesses.innerHTML = `
      <div class="technique-section-heading"><div><strong>Evidence Desk</strong><span>The specific observations behind the coaching profile</span></div><small>${latest ? `Latest assessment: ${this.formatPacificTimestamp(latest.timestamp)}` : "Assessment pending"}</small></div>
      <div class="technique-evidence-grid">
        <article><span>Weak keys</span>${analysis.weakKeys.length ? this.renderKeyAccuracyItems(analysis.weakKeys.slice(0, 6)) : `<strong>No established weak keys</strong>`}<p>Only keys with enough recorded observations are treated as established weaknesses.</p></article>
        <article><span>Trouble pairs</span>${analysis.weakPairs.length ? this.renderPairAccuracyItems(analysis.weakPairs.slice(0, 6)) : `<strong>No established trouble pairs</strong>`}<p>Pair accuracy uses first-attempt adjacent-letter transition history.</p></article>
        <article><span>Placement</span><strong>${this.escapeHtml(latest?.placementLabel || "No assessment yet")}</strong><p>${this.escapeHtml(latest?.placementDetail || "Take the Placement Assessment to add sustained-passage technique evidence.")}</p></article>
      </div>`;

    const firstAction = analysis.plan?.[0]?.action;
    this.ui.techniquePrimaryActionButton.textContent = firstAction?.label || "Take Placement Assessment";
    this.ui.techniqueAssessmentButton.textContent = latest ? "Retake Assessment" : "Take Assessment";
  }

  getAssessmentRows() {
    return (this.scores ?? []).filter(row => row.activityType === "assessment").sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  }

  getLatestAssessment() {
    return this.getAssessmentRows().at(-1) ?? null;
  }

  renderAssessment() {
    if (!this.ui.assessmentLatest || !this.ui.assessmentHistory) return;
    const rows = this.getAssessmentRows();
    const latest = rows.at(-1);
    if (!latest) {
      this.ui.assessmentLatest.innerHTML = `<div class="assessment-empty"><div class="assessment-empty-icon">✓</div><div><strong>No placement assessment yet</strong><p>Complete Keyboard Trainee first if touch typing is unfamiliar. Otherwise start the diagnostic now and HyperSoft will recommend the most useful training path.</p></div></div>`;
      this.ui.assessmentHistory.innerHTML = `<div class="empty-state">No assessment history for this profile.</div>`;
      this.ui.assessmentRecommendedButton.hidden = true;
      return;
    }
    const placement = latest.placementLabel || "Training path available";
    this.ui.assessmentLatest.innerHTML = `
      <section class="assessment-latest-card">
        <div class="assessment-placement-banner"><span>Latest HyperSoft Placement</span><strong>${this.escapeHtml(placement)}</strong><small>${this.escapeHtml(latest.placementDetail || "Retake the assessment whenever your skill changes significantly.")}</small></div>
        <div class="assessment-result-metrics">
          <div><span>WPM</span><strong>${Math.round(Number(latest.wpm) || 0)}</strong></div>
          <div><span>Accuracy</span><strong>${Math.round(Number(latest.accuracy) || 0)}%</strong></div>
          <div><span>Rhythm</span><strong>${Math.round(Number(latest.rhythmScore) || 0)}%</strong></div>
          <div><span>Hesitations</span><strong>${Number(latest.hesitations) || 0}</strong></div>
        </div>
        <div class="assessment-latest-note"><strong>Practice focus</strong>${this.renderAssessmentPracticeFocus(latest)}<small>Completed ${this.formatPacificTimestamp(latest.timestamp)}</small></div>
      </section>`;
    this.ui.assessmentRecommendedButton.hidden = !latest.placementDestination;
    this.ui.assessmentRecommendedButton.textContent = latest.placementDestination === "trainee" ? "Open Keyboard Trainee" : latest.placementDestination === "lessons" ? "Open Recommended Lessons" : latest.placementDestination === "smartPractice" ? "Open Smart Practice" : "Follow Recommendation";
    const history = rows.slice(-6).reverse();
    this.ui.assessmentHistory.innerHTML = `<div class="table-wrap"><table class="assessment-history-table"><thead><tr><th>Date</th><th>Placement</th><th>WPM</th><th>Accuracy</th><th>Rhythm</th></tr></thead><tbody>${history.map(row => `<tr><td>${this.formatPacificTimestamp(row.timestamp)}</td><td><strong>${this.escapeHtml(row.placementLabel || "—")}</strong></td><td>${Math.round(Number(row.wpm) || 0)}</td><td>${Math.round(Number(row.accuracy) || 0)}%</td><td>${Math.round(Number(row.rhythmScore) || 0)}%</td></tr>`).join("")}</tbody></table></div>`;
  }

  getRealWorldRows() {
    return (this.scores ?? [])
      .filter(row => row.activityType === "realWorld")
      .sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));
  }

  getRealWorldRecord(modeId) {
    const rows = this.getRealWorldRows().filter(row => row.modeId === modeId);
    return {
      attempts: rows.length,
      bestWpm: rows.length ? Math.max(...rows.map(row => Number(row.wpm) || 0)) : 0,
      bestAccuracy: rows.length ? Math.max(...rows.map(row => Number(row.accuracy) || 0)) : 0,
      targetsMet: rows.filter(row => row.targetStatus === "Met").length,
      latest: rows.at(-1) ?? null
    };
  }

  renderRealWorldLab() {
    if (!this.ui.realWorldGrid || !this.ui.realWorldSummary || !this.ui.realWorldHistory) return;
    const rows = this.getRealWorldRows();
    const totalRuns = rows.length;
    const modesTried = new Set(rows.map(row => row.modeId)).size;
    const bestWpm = totalRuns ? Math.max(...rows.map(row => Number(row.wpm) || 0)) : 0;
    const bestAccuracy = totalRuns ? Math.max(...rows.map(row => Number(row.accuracy) || 0)) : 0;
    const targetsMet = rows.filter(row => row.targetStatus === "Met").length;

    this.ui.realWorldSummary.innerHTML = `
      <div><span>Applied Sessions</span><strong>${totalRuns}</strong><small>Completed simulations</small></div>
      <div><span>Labs Tried</span><strong>${modesTried}/${REAL_WORLD_MODES.length}</strong><small>Real-world categories</small></div>
      <div><span>Best WPM</span><strong>${bestWpm || "—"}</strong><small>Across applied typing</small></div>
      <div><span>Best Accuracy</span><strong>${totalRuns ? `${bestAccuracy}%` : "—"}</strong><small>First-attempt accuracy</small></div>
      <div><span>Targets Met</span><strong>${targetsMet}</strong><small>Applied standards cleared</small></div>`;

    this.ui.realWorldGrid.innerHTML = REAL_WORLD_MODES.map(mode => {
      const record = this.getRealWorldRecord(mode.id);
      const target = (() => {
        const speedFactor = { novice:.68, easy:.82, normal:1, challenging:1.13, hard:1.27, expert:1.42 }[this.settings.difficulty] ?? 1;
        const accuracyDelta = { novice:-4, easy:-2, normal:0, challenging:0, hard:1, expert:1 }[this.settings.difficulty] ?? 0;
        return {
          wpm: Math.max(15, Math.round(mode.targetWpm * speedFactor)),
          accuracy: Math.max(90, Math.min(100, mode.targetAccuracy + accuracyDelta))
        };
      })();
      return `<article class="realworld-mode-card realworld-card-${mode.skin}">
        <div class="realworld-mode-top"><span class="realworld-mode-icon">${this.escapeHtml(mode.icon)}</span><span>Lab ${mode.number}</span></div>
        <h3>${this.escapeHtml(mode.title)}</h3>
        <p>${this.escapeHtml(mode.subtitle)}</p>
        <div class="realworld-tag-row">${mode.tags.map(tag => `<span>${this.escapeHtml(tag)}</span>`).join("")}</div>
        <div class="realworld-standard"><span>Current standard</span><strong>${target.wpm} WPM · ${target.accuracy}%</strong></div>
        <div class="realworld-record">${record.attempts
          ? `<span>${record.attempts} ${record.attempts === 1 ? "run" : "runs"} · ${record.targetsMet} target${record.targetsMet === 1 ? "" : "s"} met</span><strong>Best ${record.bestWpm} WPM · ${record.bestAccuracy}%</strong>`
          : `<span>No applied record yet</span><strong>3 records per session</strong>`}</div>
        <button type="button" data-realworld-mode="${mode.id}">Start ${this.escapeHtml(mode.title)}</button>
      </article>`;
    }).join("");

    const recent = [...rows].reverse().slice(0, 8);
    this.ui.realWorldHistory.innerHTML = recent.length
      ? `<div class="realworld-history-table"><table><thead><tr><th>Lab</th><th>WPM</th><th>Accuracy</th><th>Target</th><th>Completed</th></tr></thead><tbody>${recent.map(row => `<tr><td>${this.escapeHtml(row.modeTitle || row.variant || "Applied Typing")}</td><td>${row.wpm ?? "—"}</td><td>${row.accuracy ?? "—"}%</td><td>${this.escapeHtml(row.targetStatus || "Practice")}</td><td>${this.formatPacificTimestamp(row.timestamp)}</td></tr>`).join("")}</tbody></table></div>`
      : `<div class="empty-state">No Real-World Typing Lab sessions yet. Choose a simulation above.</div>`;
  }

  startRealWorldMode(modeId) {
    this.stopActiveGame();
    this.tournament = null;
    this.arcadeChallenge = null;
    const mode = getRealWorldMode(modeId);
    if (!mode) return;
    this.launchWithLoading(mode.title, () => this.beginRealWorldMode(modeId));
  }

  beginRealWorldMode(modeId) {
    this.finishingActivity = false;
    const sessionId = ++this.activitySessionId;
    const mode = getRealWorldMode(modeId);
    if (!mode) return;
    this.activityKind = "realWorld";
    this.activeMode = mode;
    this.lastActivity = { kind: "realWorld", id: mode.id };
    this.pendingLessonId = null;
    this.pendingGameId = null;
    this.pendingGameOptions = {};
    this.ui.activeGameTitle.textContent = mode.title;
    this.ui.activeGameSubtitle.textContent = mode.subtitle;
    this.ui.backButton.textContent = "← Back to Real-World Lab";
    this.ui.guidedLinkButton.textContent = "Applied Lab Guide";
    this.ui.stage.innerHTML = "";
    if (this.ui.arcadeStageShell) this.ui.arcadeStageShell.dataset.game = "realworld";
    if (this.ui.arcadeConsoleMode) this.ui.arcadeConsoleMode.textContent = `HYPERSOFT APPLIED KEYBOARDING • ${mode.title.toUpperCase()}`;
    if (this.ui.arcadeConsoleStatus) this.ui.arcadeConsoleStatus.textContent = "REAL-WORLD SIMULATION";
    if (this.ui.arcadeStageReadout) this.ui.arcadeStageReadout.textContent = `${this.settings.difficulty.toUpperCase()} • 3 APPLIED RECORDS`;
    if (this.ui.arcadeInputHint) this.ui.arcadeInputHint.textContent = "Type highlighted text exactly • Enter creates required line breaks";
    this.showScreen("game");
    this.engine.startGame({
      difficulty: this.settings.difficulty,
      wordList: this.settings.wordList,
      modeId: `realworld:${mode.id}`
    });
    this.activeGame = new RealWorldTypingExercise({
      stage: this.ui.stage,
      engine: this.engine,
      finish: result => this.finishActivity(result, sessionId),
      mode,
      difficulty: this.settings.difficulty
    });
    this.activeGame.start();
    this.startHudTimer();
    this.ui.stage.focus();
  }

  getBlakeRealWorldResultComment(result) {
    const wpm = Number(result.wpm) || 0;
    const accuracy = Number(result.accuracy) || 0;
    if (result.targetStatus === "Met" && accuracy >= 99) return `${wpm} WPM at ${accuracy}% while typing actual structured material. HyperSoft calls that applied keyboard mastery. I call it suspiciously competent.`;
    if (accuracy < 94) return `The records are complete, but structured typing exposed some accuracy leaks. This is why people object when I say "close enough" about reference numbers.`;
    if (result.targetStatus === "Met") return `Applied target met. Apparently typing an email address correctly is more useful than winning Road Race, although the Arcade department has filed an objection.`;
    return `You finished the applied lab. The useful part is seeing where ordinary punctuation, numbers, paths, or document structure interrupt your normal rhythm.`;
  }

  loadDailyPlanState() {
    const state = normalizeDailyPlanState(this.getActiveProfile()?.data?.dailyPlanState);
    return state?.dateKey === getPacificDayKey() ? state : null;
  }

  loadDailyPlanHistory() {
    const rows = this.getActiveProfile()?.data?.dailyPlanHistory;
    if (!Array.isArray(rows)) return [];
    return rows.slice(-60).map(row => ({
      dateKey: String(row?.dateKey || "").slice(0, 16),
      durationMinutes: DAILY_PLAN_DURATIONS.includes(Number(row?.durationMinutes)) ? Number(row.durationMinutes) : 20,
      completedAt: Math.max(0, Number(row?.completedAt) || 0),
      stepCount: Math.max(1, Math.min(10, Math.floor(Number(row?.stepCount) || 1)))
    })).filter(row => row.dateKey && row.completedAt);
  }

  getDailyPlanEvidence() {
    const technique = this.getTechniqueAnalysis();
    const latestAssessment = this.getLatestAssessment();
    const now = Date.now();
    const dayMs = 86400000;
    const weakKeys = this.getWeakKeys(8);
    const weakPairs = this.getWeakPairs(8);
    const accuracyRows = this.getAccuracyClinicRows();
    const punctuationRows = this.getPunctuationRows();
    const tenKeyRows = this.getTenKeyRows();
    const certificationRows = this.getCertificationRows();
    const realWorldRows = this.getRealWorldRows();
    const punctuationFamilies = this.getPunctuationFamilyAggregate(punctuationRows);
    const punctuationLabels = { capitals:"Capitals", apostrophe:"Quotes / Apostrophes", sentence:"Sentence Marks", brackets:"Parentheses / Brackets", path:"Web / Path Symbols", business:"Business Symbols", numbers:"Number Row" };
    const punctuationWeakFamily = Object.entries(punctuationLabels).map(([id,label]) => {
      const row = punctuationFamilies[id];
      return row?.attempts ? { id, label, attempts: row.attempts, errors: row.errors || 0, accuracy: (row.correct / row.attempts) * 100 } : null;
    }).filter(Boolean).sort((a,b)=>a.accuracy-b.accuracy || b.errors-a.errors)[0] ?? null;
    const nextLesson = LESSON_METADATA.find(lesson => !this.getLessonProgress(lesson).metTarget) ?? null;
    const recentSessionCount = (this.scores ?? []).filter(row => row.activityType !== "tournament" && (Number(row.timestamp) || 0) >= now - 14 * dayMs).length;
    const latestCertification = certificationRows.at(-1) ?? null;
    return {
      technique,
      latestAssessment,
      traineeCompleted: TRAINEE_MODULES.filter(item => this.traineeProgress?.[item.id]).length,
      traineeTotal: TRAINEE_MODULES.length,
      theoryReviewed: getTheoryProgressSummary(this.theoryProgress).reviewed,
      theoryTotal: THEORY_TOPICS.length,
      weakKeys,
      weakPairs,
      accuracyClinicIndex: this.getAccuracyClinicIndex(accuracyRows),
      punctuationWeakFamily,
      punctuationSessions: punctuationRows.length,
      tenKeySessions: tenKeyRows.length,
      tenKeyLevel: this.getTenKeyLevel(tenKeyRows).label,
      certificationSessions: certificationRows.length,
      realWorldSessions: realWorldRows.length,
      masteredLessons: LESSON_METADATA.filter(lesson => this.getLessonProgress(lesson).metTarget).length,
      totalLessons: LESSON_METADATA.length,
      nextLessonId: nextLesson?.id ?? null,
      nextLessonTitle: nextLesson?.title ?? null,
      recentSessionCount,
      daysSinceAssessment: latestAssessment ? Math.max(0, Math.floor((now - (Number(latestAssessment.timestamp) || now)) / dayMs)) : null,
      daysSinceCertification: latestCertification ? Math.max(0, Math.floor((now - (Number(latestCertification.timestamp) || now)) / dayMs)) : null
    };
  }

  generateDailyPlan(durationMinutes = 20) {
    this.dailyPlanState = buildDailyTrainingPlan({ durationMinutes, evidence: this.getDailyPlanEvidence() });
    this.dailyPlanReturnPending = false;
    this.persistActiveProfile();
    this.renderDailyPlan();
  }

  getDailyPlanStep(stepId) {
    return this.dailyPlanState?.steps?.find(step => step.id === stepId) ?? null;
  }

  getDailyPlanActivityMatch(step) {
    if (!step?.action) return false;
    const type = step.action.type;
    const id = step.action.id;
    if (type === "assessment") return this.activityKind === "assessment";
    if (type === "lesson") return this.activityKind === "lesson" && this.activeMode?.id === id;
    if (type === "accuracyClinic") return this.activityKind === "accuracyClinic" && this.activeMode?.id === id;
    if (type === "punctuation") return this.activityKind === "punctuation" && this.activeMode?.id === id;
    if (type === "tenKey") return this.activityKind === "tenKey" && this.activeMode?.id === id;
    if (type === "realWorld") return this.activityKind === "realWorld" && this.activeMode?.id === id;
    if (type === "certification") return this.activityKind === "certification" && this.activeMode?.id === id;
    return false;
  }

  runDailyPlanStep(stepId) {
    const step = this.getDailyPlanStep(stepId);
    if (!step || this.dailyPlanState?.completedStepIds?.includes(step.id)) return;
    this.dailyPlanState.activeStepId = step.id;
    this.persistActiveProfile();
    const action = step.action;
    if (action.type === "screen") { this.exitTo(action.id || "trainee"); return; }
    if (action.type === "theory") { this.currentTheoryTopicId = THEORY_TOPICS.some(topic => topic.id === action.id) ? action.id : THEORY_TOPICS[0].id; this.theoryFeedback = ""; this.exitTo("theory"); return; }
    if (action.type === "assessment") { this.startAssessment(); return; }
    if (action.type === "lesson") { this.startLesson(action.id); return; }
    if (action.type === "accuracyClinic") { this.startAccuracyClinic(action.id); return; }
    if (action.type === "punctuation") { this.startPunctuationProtocol(action.id); return; }
    if (action.type === "tenKey") { this.startTenKeyProtocol(action.id); return; }
    if (action.type === "realWorld") { this.startRealWorldMode(action.id); return; }
    if (action.type === "certification") { this.startCertificationTest(action.id); return; }
    this.dailyPlanState.activeStepId = null;
    this.persistActiveProfile();
  }

  startNextDailyPlanStep() {
    if (!this.dailyPlanState || this.dailyPlanState.dateKey !== getPacificDayKey()) this.generateDailyPlan(Number(this.ui.dailyPlanDurationSelect?.value) || 20);
    const done = new Set(this.dailyPlanState?.completedStepIds ?? []);
    const next = this.dailyPlanState?.steps?.find(step => !done.has(step.id));
    if (next) this.runDailyPlanStep(next.id);
  }

  markDailyPlanStepComplete(stepId, { manual = false } = {}) {
    const step = this.getDailyPlanStep(stepId);
    if (!step || (!manual && step.manual)) return null;
    const done = new Set(this.dailyPlanState.completedStepIds ?? []);
    if (done.has(step.id)) return null;
    done.add(step.id);
    this.dailyPlanState.completedStepIds = [...done];
    this.dailyPlanState.activeStepId = null;
    const completion = getDailyPlanCompletion(this.dailyPlanState);
    if (completion.complete) {
      const already = this.dailyPlanHistory.some(row => row.dateKey === this.dailyPlanState.dateKey);
      if (!already) this.dailyPlanHistory.push({ dateKey:this.dailyPlanState.dateKey, durationMinutes:this.dailyPlanState.durationMinutes, completedAt:Date.now(), stepCount:this.dailyPlanState.steps.length });
      this.dailyPlanHistory = this.dailyPlanHistory.slice(-60);
    }
    this.persistActiveProfile();
    this.renderDailyPlan();
    return completion;
  }

  completeDailyPlanActiveStep() {
    if (!this.dailyPlanState?.activeStepId) return null;
    const step = this.getDailyPlanStep(this.dailyPlanState.activeStepId);
    if (!step || step.manual || !this.getDailyPlanActivityMatch(step)) return null;
    const completion = this.markDailyPlanStepComplete(step.id);
    if (!completion) return null;
    this.dailyPlanReturnPending = true;
    return completion.complete ? `Today's plan complete (${completion.completed}/${completion.total})` : `Step ${completion.completed}/${completion.total} complete`;
  }

  renderDailyPlan() {
    if (!this.ui.dailyPlanSummary || !this.ui.dailyPlanSteps || !this.ui.dailyPlanEvidence || !this.ui.dailyPlanHistory) return;
    const today = getPacificDayKey();
    if (this.dailyPlanState?.dateKey !== today) this.dailyPlanState = null;
    if (!this.dailyPlanState) this.dailyPlanState = buildDailyTrainingPlan({ durationMinutes:20, evidence:this.getDailyPlanEvidence() });
    const plan = this.dailyPlanState;
    const completion = getDailyPlanCompletion(plan);
    const evidence = this.getDailyPlanEvidence();
    if (this.ui.dailyPlanDurationSelect) this.ui.dailyPlanDurationSelect.value = String(plan.durationMinutes);
    if (this.ui.dailyPlanStartNextButton) {
      this.ui.dailyPlanStartNextButton.disabled = completion.complete;
      this.ui.dailyPlanStartNextButton.textContent = completion.complete ? "Today's Plan Complete" : completion.completed ? "Continue Today's Plan" : "Start Today's Plan";
    }
    this.ui.dailyPlanSummary.innerHTML = `
      <div class="daily-plan-focus"><span>Today's Focus</span><strong>${this.escapeHtml(plan.focusLabel)}</strong><small>${this.escapeHtml(plan.rationale)}</small></div>
      <div><span>Plan Progress</span><strong>${completion.completed}/${completion.total}</strong><small>${completion.percent}% complete</small></div>
      <div><span>Planned Time</span><strong>~${completion.minutesTotal} min</strong><small>${completion.minutesDone} min of steps completed</small></div>
      <div><span>Technique Index</span><strong>${evidence.technique?.aggregate || "—"}</strong><small>${this.escapeHtml(evidence.technique?.level || "Collecting data")}</small></div>
      <div><span>Curriculum</span><strong>${evidence.masteredLessons}/${evidence.totalLessons}</strong><small>formal targets met</small></div>`;

    const done = new Set(plan.completedStepIds);
    const nextOpenIndex = plan.steps.findIndex(step => !done.has(step.id));
    this.ui.dailyPlanSteps.innerHTML = plan.steps.map((step,index) => {
      const isDone = done.has(step.id);
      const isActive = plan.activeStepId === step.id && !isDone;
      return `<article class="daily-plan-step ${isDone?"done":isActive?"active":""}">
        <div class="daily-step-number">${isDone?"✓":index+1}</div>
        <div class="daily-step-copy"><div class="daily-step-meta"><span>${this.escapeHtml(step.module)}</span><b>~${step.minutes} min</b></div><h3>${this.escapeHtml(step.title)}</h3><p>${this.escapeHtml(step.reason)}</p></div>
        <div class="daily-step-action">${isDone
          ? `<span class="daily-step-complete">Complete</span>`
          : `<button class="${index === nextOpenIndex ? "primary" : "secondary"}" type="button" data-daily-start="${this.escapeHtml(step.id)}">${step.manual?"Open Module":"Start Step"}</button>${step.manual?`<button class="text-button" type="button" data-daily-complete="${this.escapeHtml(step.id)}">Mark Reviewed</button>`:""}`}</div>
      </article>`;
    }).join("");

    const weakKeys = evidence.weakKeys?.slice(0,4) || [];
    const weakPairs = evidence.weakPairs?.slice(0,4) || [];
    this.ui.dailyPlanEvidence.innerHTML = `
      <div class="daily-evidence-heading"><div><strong>Why HyperSoft Built This Plan</strong><span>Live evidence used to rank today's training blocks</span></div><small>Plan generated ${this.formatPacificTimestamp(plan.generatedAt)}</small></div>
      <div class="daily-evidence-grid">
        <article><span>Weak Keys</span>${weakKeys.length ? this.renderKeyAccuracyItems(weakKeys) : `<strong>No established weak keys</strong>`}<p>Persistent first-attempt key history.</p></article>
        <article><span>Trouble Pairs</span>${weakPairs.length ? this.renderPairAccuracyItems(weakPairs) : `<strong>No established trouble pairs</strong>`}<p>Repeated adjacent-key transition evidence.</p></article>
        <article><span>Precision</span><strong>${evidence.accuracyClinicIndex?.score ?? "—"}${evidence.accuracyClinicIndex?.score != null?"/100":""}</strong><p>${this.escapeHtml(evidence.accuracyClinicIndex?.label || "No Accuracy Clinic record")}</p></article>
        <article><span>Punctuation</span><strong>${evidence.punctuationWeakFamily?`${this.escapeHtml(evidence.punctuationWeakFamily.label)} ${Math.round(evidence.punctuationWeakFamily.accuracy)}%`:"No family weakness established"}</strong><p>Dedicated capitals and symbol history.</p></article>
        <article><span>10-Key</span><strong>${this.escapeHtml(evidence.tenKeyLevel || "Not Started")}</strong><p>${evidence.tenKeySessions} numeric ${evidence.tenKeySessions===1?"session":"sessions"} recorded.</p></article>
        <article><span>Benchmark Age</span><strong>${evidence.certificationSessions ? `${evidence.daysSinceCertification ?? 0} days` : "No timed test"}</strong><p>Used to decide whether today's plan needs a benchmark.</p></article>
      </div>`;

    const history = [...this.dailyPlanHistory].reverse().slice(0,10);
    this.ui.dailyPlanHistory.innerHTML = history.length
      ? `<div class="daily-history-table"><table><thead><tr><th>Date</th><th>Plan</th><th>Steps</th><th>Completed</th></tr></thead><tbody>${history.map(row=>`<tr><td>${this.escapeHtml(row.dateKey)}</td><td>${row.durationMinutes} min</td><td>${row.stepCount}</td><td>${this.formatPacificTimestamp(row.completedAt)}</td></tr>`).join("")}</tbody></table></div>`
      : `<div class="empty-state">Complete today's plan to begin the Daily Training history.</div>`;
    this.persistActiveProfile();
  }

  getCertificationRows() {
    return (this.scores ?? []).filter(row => row.activityType === "certification")
      .sort((a,b)=>(Number(a.timestamp)||0)-(Number(b.timestamp)||0));
  }

  getCertificationCurrentStandard() {
    const selected=getCertificationStandard(this.certificationConfig?.standardId || "general");
    if (selected.id !== "custom") return { ...selected };
    return {
      ...selected,
      wpm: Math.max(5,Math.min(150,Math.round(Number(this.certificationConfig?.customWpm)||40))),
      accuracy: Math.max(80,Math.min(100,Math.round((Number(this.certificationConfig?.customAccuracy)||97)*10)/10))
    };
  }

  updateCertificationCustomVisibility() {
    if (!this.ui.certificationCustomFields) return;
    this.ui.certificationCustomFields.hidden = (this.ui.certificationStandardSelect?.value || this.certificationConfig?.standardId) !== "custom";
  }

  getCertificationRecord(durationId) {
    const rows=this.getCertificationRows().filter(row=>row.modeId===durationId);
    return {
      attempts:rows.length,
      passes:rows.filter(row=>row.targetStatus==="Passed").length,
      bestAdjusted:rows.length?Math.max(...rows.map(row=>Number(row.certificationAdjustedWpm)||Number(row.wpm)||0)):0,
      bestGross:rows.length?Math.max(...rows.map(row=>Number(row.certificationGrossWpm)||0)):0,
      bestAccuracy:rows.length?Math.max(...rows.map(row=>Number(row.accuracy)||0)):0,
      latest:rows.at(-1)??null
    };
  }

  renderCertificationTests() {
    if (!this.ui.certificationSummary || !this.ui.certificationGrid || !this.ui.certificationHistory) return;
    if (this.ui.certificationStandardSelect) this.ui.certificationStandardSelect.value=this.certificationConfig?.standardId || "general";
    if (this.ui.certificationContentSelect) this.ui.certificationContentSelect.value=this.certificationConfig?.contentId || "general";
    if (this.ui.certificationCustomWpm) this.ui.certificationCustomWpm.value=String(this.certificationConfig?.customWpm ?? 40);
    if (this.ui.certificationCustomAccuracy) this.ui.certificationCustomAccuracy.value=String(this.certificationConfig?.customAccuracy ?? 97);
    this.updateCertificationCustomVisibility();
    const rows=this.getCertificationRows();
    const standard=this.getCertificationCurrentStandard();
    const content=getCertificationContent(this.certificationConfig?.contentId || "general");
    const bestAdjusted=rows.length?Math.max(...rows.map(row=>Number(row.certificationAdjustedWpm)||Number(row.wpm)||0)):0;
    const bestGross=rows.length?Math.max(...rows.map(row=>Number(row.certificationGrossWpm)||0)):0;
    const bestAccuracy=rows.length?Math.max(...rows.map(row=>Number(row.accuracy)||0)):0;
    const passed=rows.filter(row=>row.targetStatus==="Passed").length;
    const durationsPassed=new Set(rows.filter(row=>row.targetStatus==="Passed").map(row=>row.modeId)).size;
    this.ui.certificationSummary.innerHTML=`
      <div class="cert-summary-primary"><span>Current Standard</span><strong>${this.escapeHtml(standard.label)}</strong><small>${standard.wpm} adjusted WPM · ${standard.accuracy}% accuracy</small></div>
      <div><span>Timed Tests</span><strong>${rows.length}</strong><small>Recorded attempts</small></div>
      <div><span>Best Adjusted</span><strong>${bestAdjusted||"—"}</strong><small>Net-style WPM</small></div>
      <div><span>Best Gross</span><strong>${bestGross||"—"}</strong><small>Physical typing pace</small></div>
      <div><span>Best Accuracy</span><strong>${rows.length?`${bestAccuracy}%`:"—"}</strong><small>First-attempt accuracy</small></div>
      <div><span>Standards Passed</span><strong>${durationsPassed}/${CERTIFICATION_DURATIONS.length}</strong><small>${passed} passing runs total</small></div>`;

    this.ui.certificationGrid.innerHTML=CERTIFICATION_DURATIONS.map(duration=>{
      const record=this.getCertificationRecord(duration.id);
      return `<article class="cert-test-card cert-test-${duration.id}">
        <div class="cert-test-top"><span class="cert-test-clock">${duration.seconds/60}</span><span>TIMED TEST</span></div>
        <h3>${this.escapeHtml(duration.label)}</h3>
        <p>${this.escapeHtml(duration.description)}</p>
        <div class="cert-test-standard"><span>Selected standard</span><strong>${standard.wpm} adjusted WPM · ${standard.accuracy}%</strong><small>${this.escapeHtml(content.label)}</small></div>
        <div class="cert-test-record">${record.attempts
          ? `<span>${record.attempts} ${record.attempts===1?"attempt":"attempts"} · ${record.passes} passed</span><strong>Best ${record.bestAdjusted} adjusted / ${record.bestGross} gross</strong><small>${record.bestAccuracy}% best accuracy</small>`
          : `<span>No timed record yet</span><strong>${duration.short} continuous copy</strong><small>Clock starts on first key</small>`}</div>
        <button type="button" data-certification-test="${duration.id}">Start ${this.escapeHtml(duration.label)}</button>
      </article>`;
    }).join("");

    const recent=[...rows].reverse().slice(0,10);
    this.ui.certificationHistory.innerHTML=recent.length
      ? `<div class="cert-history-table"><table><thead><tr><th>Test</th><th>Gross</th><th>Adjusted</th><th>Accuracy</th><th>Errors</th><th>Standard</th><th>Result</th><th>Completed</th></tr></thead><tbody>${recent.map(row=>`<tr><td>${this.escapeHtml(row.modeTitle||row.variant||"Timed Test")}</td><td>${row.certificationGrossWpm??"—"}</td><td><strong>${row.certificationAdjustedWpm??row.wpm??"—"}</strong></td><td>${row.accuracy??"—"}%</td><td>${row.certificationRawErrors??"—"}</td><td>${this.escapeHtml(row.certificationStandardLabel||"Training")}</td><td>${this.escapeHtml(row.targetStatus||"Completed")}</td><td>${this.formatPacificTimestamp(row.timestamp)}</td></tr>`).join("")}</tbody></table></div>`
      : `<div class="empty-state">No timed certification tests yet. The 1-Minute Test is useful for establishing a quick baseline; the 5-Minute Test is the stronger general benchmark.</div>`;
  }

  startCertificationTest(durationId) {
    this.stopActiveGame();
    this.tournament=null;
    this.arcadeChallenge=null;
    const duration=getCertificationDuration(durationId);
    if (!duration) return;
    this.launchWithLoading(`Timed Test: ${duration.label}`,()=>this.beginCertificationTest(durationId));
  }

  beginCertificationTest(durationId) {
    this.finishingActivity=false;
    const sessionId=++this.activitySessionId;
    const duration=getCertificationDuration(durationId);
    if (!duration) return;
    const standard=this.getCertificationCurrentStandard();
    const content=getCertificationContent(this.certificationConfig?.contentId||"general");
    const config={durationId:duration.id,durationSeconds:duration.seconds,durationLabel:duration.label,standardId:standard.id,standardLabel:standard.label,targetWpm:standard.wpm,targetAccuracy:standard.accuracy,contentId:content.id,contentLabel:content.label};
    this.activityKind="certification";
    this.activeMode={id:duration.id,title:duration.label,subtitle:`${content.label} · ${standard.label} training standard`,guide:[
      "The timer starts with the first valid typing key, not while you are reading the screen.",
      "Gross WPM measures physical character attempts. Adjusted WPM subtracts raw errors per minute from Gross WPM.",
      "Wrong keys count as raw errors and remain on the current character so the source passage is never silently skipped.",
      "A passing HyperSoft result requires both the selected adjusted-WPM target and accuracy target for the full scheduled duration.",
      "This is local training documentation only, not an employment test or third-party typing certification."
    ]};
    this.lastActivity={kind:"certification",id:duration.id};
    this.pendingLessonId=null; this.pendingGameId=null; this.pendingGameOptions={};
    this.ui.activeGameTitle.textContent=`Timed Certification — ${duration.label}`;
    this.ui.activeGameSubtitle.textContent=`${content.label} · ${standard.label}: ${standard.wpm} adjusted WPM at ${standard.accuracy}% accuracy`;
    this.ui.backButton.textContent="← Back to Timed Tests";
    this.ui.guidedLinkButton.textContent="Timed Test Guide";
    this.ui.stage.innerHTML="";
    if (this.ui.arcadeStageShell) this.ui.arcadeStageShell.dataset.game="certification";
    if (this.ui.arcadeConsoleMode) this.ui.arcadeConsoleMode.textContent=`HYPERSOFT TIMED TESTING CENTER • ${duration.label.toUpperCase()}`;
    if (this.ui.arcadeConsoleStatus) this.ui.arcadeConsoleStatus.textContent="CERTIFICATION TIMER ARMED";
    if (this.ui.arcadeStageReadout) this.ui.arcadeStageReadout.textContent=`${standard.wpm} ADJ WPM • ${standard.accuracy}%`;
    if (this.ui.arcadeInputHint) this.ui.arcadeInputHint.textContent="Clock starts on first key • exact passage entry • F1 scoring method";
    this.showScreen("game");
    this.engine.startGame({difficulty:this.settings.difficulty,wordList:this.settings.wordList,modeId:`certification:${duration.id}`});
    this.activeGame=new TimedCertificationExercise({stage:this.ui.stage,engine:this.engine,finish:result=>this.finishActivity(result,sessionId),config});
    this.activeGame.start();
    this.startHudTimer();
    this.ui.stage.focus();
  }

  getBlakeCertificationResultComment(result) {
    const adjusted=Number(result.certificationAdjustedWpm)||Number(result.wpm)||0;
    const gross=Number(result.certificationGrossWpm)||0;
    const accuracy=Number(result.accuracy)||0;
    if (result.targetStatus==="Passed" && accuracy>=99) return `${adjusted} adjusted WPM at ${accuracy}% accuracy. Blake has requested that the official result sheet list his role as “executive sponsor,” despite doing none of the typing.`;
    if (result.targetStatus==="Passed") return `Timed standard passed. Gross pace was ${gross} WPM and the error adjustment still left ${adjusted} WPM. That is the useful kind of speed.`;
    if (accuracy < (Number(result.certificationTargetAccuracy)||97)) return `The timed run exposed an accuracy limit before a speed limit. Protect the first attempt, then retest under the same standard so the comparison actually means something.`;
    return `Accuracy held, but adjusted WPM missed the selected standard. The next useful move is sustained practice, not a sixty-second sprint designed to make the number look better.`;
  }

  getPunctuationRows() {
    return (this.scores ?? []).filter(row => row.activityType === "punctuation")
      .sort((a,b)=>(Number(a.timestamp)||0)-(Number(b.timestamp)||0));
  }

  getPunctuationRecord(protocolId) {
    const rows=this.getPunctuationRows().filter(row=>row.modeId===protocolId);
    return {
      attempts:rows.length,
      bestWpm:rows.length?Math.max(...rows.map(row=>Number(row.wpm)||0)):0,
      bestAccuracy:rows.length?Math.max(...rows.map(row=>Number(row.accuracy)||0)):0,
      bestSymbolAccuracy:rows.length?Math.max(...rows.map(row=>Number(row.punctuationSymbolAccuracy)||0)):0,
      targetsMet:rows.filter(row=>row.targetStatus==="Met").length
    };
  }

  getPunctuationFamilyAggregate(rows=this.getPunctuationRows()) {
    const aggregate={};
    rows.forEach(row=>{
      const stats=row.punctuationFamilyStats;
      if (!stats || typeof stats!=="object" || Array.isArray(stats)) return;
      Object.entries(stats).forEach(([family,value])=>{
        const target=aggregate[family]??{attempts:0,correct:0,errors:0};
        target.attempts+=Math.max(0,Number(value?.attempts)||0);
        target.correct+=Math.max(0,Number(value?.correct)||0);
        target.errors+=Math.max(0,Number(value?.errors)||0);
        aggregate[family]=target;
      });
    });
    return aggregate;
  }

  renderPunctuationLab() {
    if (!this.ui.punctuationSummary || !this.ui.punctuationGrid || !this.ui.punctuationReview || !this.ui.punctuationHistory) return;
    const rows=this.getPunctuationRows();
    const bestWpm=rows.length?Math.max(...rows.map(row=>Number(row.wpm)||0)):0;
    const bestAccuracy=rows.length?Math.max(...rows.map(row=>Number(row.accuracy)||0)):0;
    const bestSymbol=rows.length?Math.max(...rows.map(row=>Number(row.punctuationSymbolAccuracy)||0)):0;
    const targetsMet=rows.filter(row=>row.targetStatus==="Met").length;
    const modesTried=new Set(rows.map(row=>row.modeId)).size;
    this.ui.punctuationSummary.innerHTML=`
      <div><span>Lab Sessions</span><strong>${rows.length}</strong><small>Recorded punctuation runs</small></div>
      <div><span>Protocols Tried</span><strong>${modesTried}/${PUNCTUATION_BUSINESS_PROTOCOLS.length}</strong><small>Business-writing categories</small></div>
      <div><span>Best WPM</span><strong>${bestWpm||"—"}</strong><small>Punctuation-rich prose</small></div>
      <div><span>Best Accuracy</span><strong>${rows.length?`${bestAccuracy}%`:"—"}</strong><small>Overall first-attempt</small></div>
      <div><span>Best Symbol Accuracy</span><strong>${rows.length?`${bestSymbol}%`:"—"}</strong><small>Capitals + symbols</small></div>
      <div><span>Targets Met</span><strong>${targetsMet}</strong><small>Precision standards cleared</small></div>`;

    const factor={novice:.72,easy:.85,normal:1,challenging:1.12,hard:1.25,expert:1.38}[this.settings.difficulty]??1;
    this.ui.punctuationGrid.innerHTML=PUNCTUATION_BUSINESS_PROTOCOLS.map(protocol=>{
      const record=this.getPunctuationRecord(protocol.id);
      const targetWpm=Math.max(18,Math.round(protocol.targetWpm*factor));
      return `<article class="punct-protocol-card punct-protocol-${protocol.id}">
        <div class="punct-protocol-top"><span class="punct-protocol-icon">${this.escapeHtml(protocol.icon)}</span><span>Lab ${protocol.number}</span></div>
        <h3>${this.escapeHtml(protocol.title)}</h3><p>${this.escapeHtml(protocol.subtitle)}</p>
        <div class="punct-tag-row">${protocol.tags.map(tag=>`<span>${this.escapeHtml(tag)}</span>`).join("")}</div>
        <div class="punct-standard-card"><span>Current standard</span><strong>${targetWpm} WPM · ${protocol.accuracyGate}% accuracy</strong></div>
        <div class="punct-record-card">${record.attempts?`<span>${record.attempts} ${record.attempts===1?"run":"runs"} · ${record.targetsMet} targets met</span><strong>Best ${record.bestWpm} WPM · ${record.bestSymbolAccuracy}% symbols</strong>`:`<span>No punctuation record yet</span><strong>3 exercises per protocol</strong>`}</div>
        <button type="button" data-punctuation-protocol="${protocol.id}">Start ${this.escapeHtml(protocol.title)}</button>
      </article>`;
    }).join("");

    const families=this.getPunctuationFamilyAggregate(rows);
    const labels={capitals:"Capitals",apostrophe:"Quotes / Apostrophes",sentence:"Sentence Marks",brackets:"Parentheses / Brackets",path:"Web / Path Symbols",business:"Business Symbols",numbers:"Number Row"};
    const familyRows=Object.entries(labels).map(([id,label])=>{
      const row=families[id]; const accuracy=row?.attempts?Math.round((row.correct/row.attempts)*1000)/10:null;
      return {id,label,accuracy,attempts:row?.attempts||0,errors:row?.errors||0};
    });
    const worst=[...familyRows].filter(x=>x.accuracy!=null).sort((a,b)=>a.accuracy-b.accuracy||b.errors-a.errors)[0];
    const substitutions={};
    rows.forEach(row=>(row.punctuationSubstitutions||[]).forEach(item=>{ if(item?.pattern) substitutions[item.pattern]=(substitutions[item.pattern]||0)+(Number(item.count)||0); }));
    const topSubs=Object.entries(substitutions).sort((a,b)=>b[1]-a[1]).slice(0,6);
    this.ui.punctuationReview.innerHTML=`<div class="punct-review-heading"><div><strong>Symbol Family Review</strong><span>Aggregated from Punctuation & Business Writing Lab sessions</span></div><small>${worst?`Priority: ${this.escapeHtml(worst.label)} ${worst.accuracy}%`:"Complete a lab to build evidence"}</small></div>
      <div class="punct-family-grid">${familyRows.map(item=>`<div class="punct-family-card ${item.accuracy==null?"no-data":item.accuracy>=99?"excellent":item.accuracy>=97?"good":item.accuracy>=94?"watch":"weak"}"><span>${this.escapeHtml(item.label)}</span><strong>${item.accuracy==null?"—":`${item.accuracy}%`}</strong><small>${item.attempts?`${item.errors} errors / ${item.attempts} attempts`:"No data"}</small></div>`).join("")}</div>
      <div class="punct-substitution-review"><strong>Common substitutions</strong><span>${topSubs.length?topSubs.map(([p,c])=>`${this.escapeHtml(p)} ×${c}`).join(" · "):"No recurring punctuation substitutions recorded yet."}</span></div>`;

    const recent=[...rows].reverse().slice(0,8);
    this.ui.punctuationHistory.innerHTML=recent.length?`<div class="punct-history-table"><table><thead><tr><th>Protocol</th><th>WPM</th><th>Accuracy</th><th>Symbols</th><th>Target</th><th>Completed</th></tr></thead><tbody>${recent.map(row=>`<tr><td>${this.escapeHtml(row.modeTitle||row.variant||"Punctuation Lab")}</td><td>${row.wpm??"—"}</td><td>${row.accuracy??"—"}%</td><td>${row.punctuationSymbolAccuracy??"—"}%</td><td>${this.escapeHtml(row.targetStatus||"Practice")}</td><td>${this.formatPacificTimestamp(row.timestamp)}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty-state">No punctuation lab sessions yet. Start with Shift & Capitals.</div>`;
  }

  startPunctuationProtocol(protocolId) {
    this.stopActiveGame(); this.tournament=null; this.arcadeChallenge=null;
    const protocol=getPunctuationBusinessProtocol(protocolId); if (!protocol) return;
    this.launchWithLoading(protocol.title,()=>this.beginPunctuationProtocol(protocolId));
  }

  beginPunctuationProtocol(protocolId) {
    this.finishingActivity=false; const sessionId=++this.activitySessionId;
    const protocol=getPunctuationBusinessProtocol(protocolId); if (!protocol) return;
    this.activityKind="punctuation"; this.activeMode=protocol; this.lastActivity={kind:"punctuation",id:protocol.id};
    this.pendingLessonId=null; this.pendingGameId=null; this.pendingGameOptions={};
    this.ui.activeGameTitle.textContent=`Punctuation Lab — ${protocol.title}`; this.ui.activeGameSubtitle.textContent=protocol.subtitle;
    this.ui.backButton.textContent="← Back to Punctuation Lab"; this.ui.guidedLinkButton.textContent="Business Writing Guide"; this.ui.stage.innerHTML="";
    if (this.ui.arcadeStageShell) this.ui.arcadeStageShell.dataset.game="punctuation";
    if (this.ui.arcadeConsoleMode) this.ui.arcadeConsoleMode.textContent=`HYPERSOFT BUSINESS KEYBOARDING • ${protocol.title.toUpperCase()}`;
    if (this.ui.arcadeConsoleStatus) this.ui.arcadeConsoleStatus.textContent="PUNCTUATION TRAINING ACTIVE";
    if (this.ui.arcadeStageReadout) this.ui.arcadeStageReadout.textContent=`${this.settings.difficulty.toUpperCase()} • ${protocol.accuracyGate}% PRECISION`;
    if (this.ui.arcadeInputHint) this.ui.arcadeInputHint.textContent="Exact punctuation + capitals • Enter creates required line breaks";
    this.showScreen("game");
    this.engine.startGame({difficulty:this.settings.difficulty,wordList:this.settings.wordList,modeId:`punctuation:${protocol.id}`});
    this.activeGame=new PunctuationBusinessExercise({stage:this.ui.stage,engine:this.engine,finish:result=>this.finishActivity(result,sessionId),protocol,difficulty:this.settings.difficulty});
    this.activeGame.start(); this.startHudTimer(); this.ui.stage.focus();
  }

  getBlakePunctuationResultComment(result) {
    const accuracy=Number(result.accuracy)||0; const symbols=Number(result.punctuationSymbolAccuracy)||0;
    if (result.targetStatus==="Met" && symbols>=99) return `${accuracy}% overall and ${symbols}% on capitals and symbols. HyperSoft has officially run out of reasons to blame punctuation.`;
    if (symbols<94) return `Ordinary letters are only part of business typing. The symbol review is showing exactly where Shift, punctuation, or path characters are interrupting you.`;
    if (result.targetStatus==="Met") return `Precision target met. Punctuation is starting to behave like part of the sentence instead of a tiny keyboard emergency.`;
    return `The document is complete. Review the symbol-family panel, then attack the weakest family instead of repeating everything blindly.`;
  }

  getTenKeyRows() {
    return (this.scores ?? [])
      .filter(row => row.activityType === "tenKey")
      .sort((a,b)=>(Number(a.timestamp)||0)-(Number(b.timestamp)||0));
  }

  getTenKeyRecord(protocolId) {
    const rows=this.getTenKeyRows().filter(row=>row.modeId===protocolId);
    return {
      attempts:rows.length,
      bestKph:rows.length?Math.max(...rows.map(row=>Number(row.tenKeyKph)||0)):0,
      bestAccuracy:rows.length?Math.max(...rows.map(row=>Number(row.accuracy)||0)):0,
      bestNumpadRate:rows.length?Math.max(...rows.map(row=>Number(row.tenKeyNumpadRate)||0)):0,
      targetsMet:rows.filter(row=>row.targetStatus==="Met").length,
      latest:rows.at(-1)??null
    };
  }

  getTenKeyAggregateStats(rows=this.getTenKeyRows()) {
    const aggregate={};
    rows.forEach(row=>{
      const stats=row.tenKeyKeyStats;
      if (!stats || typeof stats!=="object" || Array.isArray(stats)) return;
      Object.entries(stats).forEach(([key,value])=>{
        const target=aggregate[key]??{attempts:0,correct:0,errors:0};
        target.attempts+=Math.max(0,Number(value?.attempts)||0);
        target.correct+=Math.max(0,Number(value?.correct)||0);
        target.errors+=Math.max(0,Number(value?.errors)||0);
        aggregate[key]=target;
      });
    });
    return aggregate;
  }

  getTenKeyLevel(rows=this.getTenKeyRows()) {
    if (!rows.length) return {label:"Not Started",detail:"Begin with Keypad Home Position."};
    const proficiency=rows.filter(row=>row.modeId==="proficiency").at(-1);
    if (proficiency?.targetStatus==="Met") return {label:"Proficient",detail:`Latest test: ${(Number(proficiency.tenKeyKph)||0).toLocaleString()} KPH at ${Number(proficiency.accuracy)||0}% accuracy.`};
    const targets=rows.filter(row=>row.targetStatus==="Met").length;
    const bestKph=Math.max(...rows.map(row=>Number(row.tenKeyKph)||0));
    if (targets>=4 && bestKph>=6000) return {label:"Productive",detail:"Strong numeric rhythm; complete the proficiency test when ready."};
    if (targets>=2) return {label:"Developing",detail:"Home position is established. Continue through Enter and accounting entry."};
    return {label:"Familiarization",detail:"Build consistent finger zones before chasing KPH."};
  }

  renderTenKeyAcademy() {
    if (!this.ui.tenKeySummary || !this.ui.tenKeyGrid || !this.ui.tenKeyKeyMap || !this.ui.tenKeyHistory) return;
    const rows=this.getTenKeyRows();
    const level=this.getTenKeyLevel(rows);
    const bestKph=rows.length?Math.max(...rows.map(row=>Number(row.tenKeyKph)||0)):0;
    const bestAccuracy=rows.length?Math.max(...rows.map(row=>Number(row.accuracy)||0)):0;
    const bestNumpad=rows.length?Math.max(...rows.map(row=>Number(row.tenKeyNumpadRate)||0)):0;
    const targetsMet=rows.filter(row=>row.targetStatus==="Met").length;
    const proficiency=rows.filter(row=>row.modeId==="proficiency").at(-1);

    this.ui.tenKeySummary.innerHTML=`
      <div class="tenkey-summary-primary"><span>Academy Level</span><strong>${this.escapeHtml(level.label)}</strong><small>${this.escapeHtml(level.detail)}</small></div>
      <div><span>Numeric Sessions</span><strong>${rows.length}</strong><small>Recorded Academy runs</small></div>
      <div><span>Best KPH</span><strong>${bestKph?bestKph.toLocaleString():"—"}</strong><small>Keystrokes per hour</small></div>
      <div><span>Best Accuracy</span><strong>${rows.length?`${bestAccuracy}%`:"—"}</strong><small>First-attempt precision</small></div>
      <div><span>Best Numpad Use</span><strong>${rows.length?`${bestNumpad}%`:"—"}</strong><small>Accepted physical input</small></div>
      <div><span>Proficiency Test</span><strong>${proficiency ? (proficiency.targetStatus==="Met"?"Passed":"Attempted") : "Not taken"}</strong><small>${proficiency ? `${(Number(proficiency.tenKeyKph)||0).toLocaleString()} KPH · ${proficiency.accuracy}%` : "2-minute test"}</small></div>`;

    const factor={novice:.68,easy:.82,normal:1,challenging:1.12,hard:1.24,expert:1.36}[this.settings.difficulty]??1;
    this.ui.tenKeyGrid.innerHTML=TEN_KEY_PROTOCOLS.map(protocol=>{
      const record=this.getTenKeyRecord(protocol.id);
      const targetKph=Math.max(1800,Math.round(protocol.targetKph*factor/100)*100);
      return `<article class="tenkey-protocol-card tenkey-protocol-${protocol.id}">
        <div class="tenkey-protocol-top"><span class="tenkey-protocol-icon">${this.escapeHtml(protocol.icon)}</span><span>Academy ${protocol.number}</span></div>
        <h3>${this.escapeHtml(protocol.title)}</h3>
        <p>${this.escapeHtml(protocol.subtitle)}</p>
        <div class="tenkey-tag-row">${protocol.tags.map(tag=>`<span>${this.escapeHtml(tag)}</span>`).join("")}</div>
        <div class="tenkey-standard-card"><span>Current target</span><strong>${targetKph.toLocaleString()} KPH · ${protocol.accuracyGate}%${protocol.strictNumpad?" · 90% Numpad":""}</strong></div>
        <div class="tenkey-record-card">${record.attempts
          ? `<span>${record.attempts} ${record.attempts===1?"run":"runs"} · ${record.targetsMet} target${record.targetsMet===1?"":"s"} met</span><strong>Best ${record.bestKph.toLocaleString()} KPH · ${record.bestAccuracy}%</strong>`
          : `<span>No numeric record yet</span><strong>${protocol.durationMs?"2-minute test":"Technique protocol"}</strong>`}</div>
        <button type="button" data-tenkey-protocol="${protocol.id}">Start ${this.escapeHtml(protocol.title)}</button>
      </article>`;
    }).join("");

    const stats=this.getTenKeyAggregateStats(rows);
    const order=["7","8","9","4","5","6","1","2","3","0",".","Enter","+","-"];
    this.ui.tenKeyKeyMap.innerHTML=`
      <div class="tenkey-keymap-heading"><div><strong>Numeric Key Reliability</strong><span>Accuracy from 10-Key Academy sessions only</span></div><small>Separate from alphabetic weak-key statistics</small></div>
      <div class="tenkey-keymap-grid">${order.map(key=>{
        const row=stats[key];
        const accuracy=row?.attempts ? Math.round((row.correct/row.attempts)*100) : null;
        const cls=accuracy==null?"no-data":accuracy>=99?"excellent":accuracy>=97?"good":accuracy>=93?"watch":"weak";
        return `<div class="tenkey-keymap-key ${cls}"><strong>${this.escapeHtml(key)}</strong><span>${accuracy==null?"—":`${accuracy}%`}</span><small>${row?.attempts?`${row.attempts} attempts`:"No data"}</small></div>`;
      }).join("")}</div>`;

    const recent=[...rows].reverse().slice(0,8);
    this.ui.tenKeyHistory.innerHTML=recent.length
      ? `<div class="tenkey-history-table"><table><thead><tr><th>Protocol</th><th>KPH</th><th>Accuracy</th><th>Numpad</th><th>Target</th><th>Completed</th></tr></thead><tbody>${recent.map(row=>`<tr><td>${this.escapeHtml(row.modeTitle||row.variant||"10-Key")}</td><td>${(Number(row.tenKeyKph)||0).toLocaleString()}</td><td>${row.accuracy ?? "—"}%</td><td>${row.tenKeyNumpadRate ?? "—"}%</td><td>${this.escapeHtml(row.targetStatus||"Practice")}</td><td>${this.formatPacificTimestamp(row.timestamp)}</td></tr>`).join("")}</tbody></table></div>`
      : `<div class="empty-state">No 10-Key Academy sessions yet. Start with Keypad Home Position.</div>`;
  }

  startTenKeyProtocol(protocolId) {
    this.stopActiveGame();
    this.tournament=null;
    this.arcadeChallenge=null;
    const protocol=getTenKeyProtocol(protocolId);
    if (!protocol) return;
    this.launchWithLoading(`10-Key Academy: ${protocol.title}`,()=>this.beginTenKeyProtocol(protocolId));
  }

  beginTenKeyProtocol(protocolId) {
    this.finishingActivity=false;
    const sessionId=++this.activitySessionId;
    const protocol=getTenKeyProtocol(protocolId);
    if (!protocol) return;
    this.activityKind="tenKey";
    this.activeMode=protocol;
    this.lastActivity={kind:"tenKey",id:protocol.id};
    this.pendingLessonId=null;
    this.pendingGameId=null;
    this.pendingGameOptions={};
    this.ui.activeGameTitle.textContent=`10-Key Academy — ${protocol.title}`;
    this.ui.activeGameSubtitle.textContent=protocol.subtitle;
    this.ui.backButton.textContent="← Back to 10-Key Academy";
    this.ui.guidedLinkButton.textContent="10-Key Technique Guide";
    this.ui.stage.innerHTML="";
    if (this.ui.arcadeStageShell) this.ui.arcadeStageShell.dataset.game="tenkey";
    if (this.ui.arcadeConsoleMode) this.ui.arcadeConsoleMode.textContent=`HYPERSOFT NUMERIC SKILLS CENTER • ${protocol.title.toUpperCase()}`;
    if (this.ui.arcadeConsoleStatus) this.ui.arcadeConsoleStatus.textContent="10-KEY TRAINING ACTIVE";
    if (this.ui.arcadeStageReadout) this.ui.arcadeStageReadout.textContent=`${this.settings.difficulty.toUpperCase()} • KPH + ACCURACY`;
    if (this.ui.arcadeInputHint) this.ui.arcadeInputHint.textContent="Numeric keypad preferred • exact entry • F1 technique guide";
    this.showScreen("game");
    this.engine.startGame({difficulty:this.settings.difficulty,wordList:"general",modeId:`tenKey:${protocol.id}`});
    this.activeGame=new TenKeyExercise({
      stage:this.ui.stage,
      engine:this.engine,
      finish:result=>this.finishActivity(result,sessionId),
      protocol,
      difficulty:this.settings.difficulty
    });
    this.activeGame.start();
    this.startHudTimer();
    this.ui.stage.focus();
  }

  getBlakeTenKeyResultComment(result) {
    const kph=Number(result.tenKeyKph)||0;
    const accuracy=Number(result.accuracy)||0;
    if (result.targetStatus==="Met" && this.activeMode?.id==="proficiency") return `${kph.toLocaleString()} KPH at ${accuracy}% accuracy. HyperSoft has now determined that you can enter numbers faster than I can explain why the spreadsheet is wrong.`;
    if (result.targetStatus==="Met") return `Numeric target met. The unnerving part is how quickly 4-5-6 starts feeling like a home row once the hand stops wandering.`;
    if (accuracy<95) return `The Academy says precision first. A numeric transposition is not improved by entering it at ${kph.toLocaleString()} KPH.`;
    return `Technique is close. Keep the hand centered, protect the decimal and Enter rhythm, and let KPH rise from fewer hesitations.`;
  }

  getAccuracyClinicRows() {
    return (this.scores ?? [])
      .filter(row => row.activityType === "accuracyClinic")
      .sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));
  }

  getAccuracyClinicRecord(protocolId) {
    const rows = this.getAccuracyClinicRows().filter(row => row.modeId === protocolId);
    return {
      attempts: rows.length,
      bestAccuracy: rows.length ? Math.max(...rows.map(row => Number(row.accuracy) || 0)) : 0,
      bestWpm: rows.length ? Math.max(...rows.map(row => Number(row.wpm) || 0)) : 0,
      bestStreak: rows.length ? Math.max(...rows.map(row => Number(row.accuracyClinicBestStreak) || 0)) : 0,
      gatesMet: rows.filter(row => row.targetStatus === "Met").length,
      latest: rows.at(-1) ?? null
    };
  }

  getAccuracyClinicIndex(rows = this.getAccuracyClinicRows()) {
    if (!rows.length) return { score: null, label: "No clinic record", confidence: "Collecting Data" };
    const recent = rows.slice(-8);
    const avgAccuracy = this.averageField(recent, "accuracy");
    const gateRate = recent.filter(row => row.targetStatus === "Met").length / recent.length;
    const avgErrors = recent.reduce((sum,row)=>sum+(Number(row.errors) || Number(row.accuracyClinicErrors) || 0),0) / recent.length;
    const score = Math.max(0, Math.min(100, Math.round(avgAccuracy * .72 + gateRate * 22 + Math.max(0, 6 - avgErrors))));
    const label = score >= 99 ? "Near-Perfect Control" : score >= 97 ? "High Precision" : score >= 94 ? "Reliable Accuracy" : score >= 88 ? "Developing Control" : "Precision Rebuild";
    return { score, label, confidence: recent.length >= 5 ? "High confidence" : recent.length >= 2 ? "Medium confidence" : "Early reading" };
  }

  renderAccuracyClinic() {
    if (!this.ui.accuracyClinicGrid || !this.ui.accuracyClinicSummary || !this.ui.accuracyClinicReview || !this.ui.accuracyClinicHistory) return;
    const rows = this.getAccuracyClinicRows();
    const index = this.getAccuracyClinicIndex(rows);
    const bestAccuracy = rows.length ? Math.max(...rows.map(row=>Number(row.accuracy)||0)) : 0;
    const bestStreak = rows.length ? Math.max(...rows.map(row=>Number(row.accuracyClinicBestStreak)||0)) : 0;
    const gatesMet = rows.filter(row=>row.targetStatus === "Met").length;
    this.ui.accuracyClinicSummary.innerHTML = `
      <div class="accuracy-summary-primary"><span>Precision Index</span><strong>${index.score ?? "—"}</strong><small>${this.escapeHtml(index.label)} · ${this.escapeHtml(index.confidence)}</small></div>
      <div><span>Clinic Sessions</span><strong>${rows.length}</strong><small>Recorded precision work</small></div>
      <div><span>Best Accuracy</span><strong>${rows.length ? `${bestAccuracy}%` : "—"}</strong><small>First-attempt accuracy</small></div>
      <div><span>Best Clean Streak</span><strong>${bestStreak || "—"}</strong><small>Consecutive characters</small></div>
      <div><span>Gates Cleared</span><strong>${gatesMet}</strong><small>Precision standards met</small></div>`;

    this.ui.accuracyClinicGrid.innerHTML = ACCURACY_CLINIC_PROTOCOLS.map(protocol => {
      const record = this.getAccuracyClinicRecord(protocol.id);
      const built = buildAccuracyClinicProtocol(protocol.id, { weakKeys:this.getWeakKeys(8), weakPairs:this.getWeakPairs(8) });
      const targets = (() => {
        const speedFactor = { novice:.72,easy:.86,normal:1,challenging:1.12,hard:1.24,expert:1.36 }[this.settings.difficulty] ?? 1;
        return { wpm:Math.max(15,Math.round(protocol.baseWpm*speedFactor)), accuracy:protocol.accuracyGate };
      })();
      return `<article class="accuracy-protocol-card accuracy-protocol-${protocol.id}">
        <div class="accuracy-protocol-top"><span class="accuracy-protocol-icon">${this.escapeHtml(protocol.icon)}</span><span>Protocol ${protocol.number}</span></div>
        <h3>${this.escapeHtml(protocol.title)}</h3>
        <p>${this.escapeHtml(protocol.subtitle)}</p>
        <div class="accuracy-tag-row">${protocol.tags.map(tag=>`<span>${this.escapeHtml(tag)}</span>`).join("")}</div>
        ${protocol.adaptive ? `<div class="accuracy-adaptive-note"><strong>Current focus</strong><span>${this.escapeHtml(built?.adaptiveFocus || "Broad accuracy coverage")}</span></div>` : ""}
        <div class="accuracy-gate-card"><span>Current precision gate</span><strong>${targets.accuracy}% · ${targets.wpm} WPM</strong></div>
        <div class="accuracy-record-card">${record.attempts
          ? `<span>${record.attempts} ${record.attempts === 1 ? "run" : "runs"} · ${record.gatesMet} gate${record.gatesMet === 1 ? "" : "s"} cleared</span><strong>Best ${record.bestAccuracy}% · streak ${record.bestStreak}</strong>`
          : `<span>No clinic record yet</span><strong>${protocol.rounds.length || 3} precision rounds</strong>`}</div>
        <button type="button" data-accuracy-protocol="${protocol.id}">Start ${this.escapeHtml(protocol.title)}</button>
      </article>`;
    }).join("");

    const latest = rows.at(-1);
    const persistentKeys = this.getWeakKeys(6);
    const persistentPairs = this.getWeakPairs(6);
    const latestMistakes = Array.isArray(latest?.accuracyClinicMistakes) ? latest.accuracyClinicMistakes : [];
    this.ui.accuracyClinicReview.innerHTML = `
      <div class="accuracy-review-heading"><div><strong>Error Pattern Review</strong><span>HyperSoft combines the latest clinic result with the active profile's adaptive history.</span></div>${latest ? `<small>Latest: ${this.escapeHtml(latest.modeTitle || latest.variant || "Clinic")}</small>` : ""}</div>
      <div class="accuracy-review-grid">
        <article><span>Latest substitutions</span>${latestMistakes.length ? `<div class="accuracy-error-chips">${latestMistakes.slice(0,6).map(item=>`<b>${this.escapeHtml(item.pattern)} ×${item.count}</b>`).join("")}</div>` : `<p>Complete a clinic protocol to collect first-attempt substitution patterns.</p>`}</article>
        <article><span>Persistent weak keys</span>${persistentKeys.length ? `<div class="accuracy-error-chips">${this.renderKeyAccuracyItems(persistentKeys)}</div>` : `<p>No established weak-key pattern yet.</p>`}</article>
        <article><span>Trouble pairs</span>${persistentPairs.length ? `<div class="accuracy-error-chips">${this.renderPairAccuracyItems(persistentPairs)}</div>` : `<p>No established pair weakness yet.</p>`}</article>
      </div>
      <div class="accuracy-remediation-actions"><button class="secondary" type="button" data-accuracy-remediate="customPractice">Build Remediation Drill</button><button class="secondary" type="button" data-accuracy-remediate="smartPractice">Open Smart Practice</button><button class="secondary" type="button" data-accuracy-remediate="assessment">Retake Placement Assessment</button></div>`;

    const recent=[...rows].reverse().slice(0,8);
    this.ui.accuracyClinicHistory.innerHTML = recent.length
      ? `<div class="accuracy-history-table"><table><thead><tr><th>Protocol</th><th>WPM</th><th>Accuracy</th><th>Streak</th><th>Gate</th><th>Completed</th></tr></thead><tbody>${recent.map(row=>`<tr><td>${this.escapeHtml(row.modeTitle||row.variant||"Accuracy Clinic")}</td><td>${row.wpm ?? "—"}</td><td>${row.accuracy ?? "—"}%</td><td>${row.accuracyClinicBestStreak ?? "—"}</td><td>${this.escapeHtml(row.targetStatus || "Practice")}</td><td>${this.formatPacificTimestamp(row.timestamp)}</td></tr>`).join("")}</tbody></table></div>`
      : `<div class="empty-state">No Accuracy Clinic sessions yet. Start with Clean Slate if precision is the primary problem.</div>`;
  }

  startAccuracyClinic(protocolId) {
    this.stopActiveGame();
    this.tournament = null;
    this.arcadeChallenge = null;
    const protocol = getAccuracyClinicProtocol(protocolId);
    if (!protocol) return;
    this.launchWithLoading(`Accuracy Clinic: ${protocol.title}`, () => this.beginAccuracyClinic(protocolId));
  }

  beginAccuracyClinic(protocolId) {
    this.finishingActivity = false;
    const sessionId = ++this.activitySessionId;
    const protocol = buildAccuracyClinicProtocol(protocolId, { weakKeys:this.getWeakKeys(8), weakPairs:this.getWeakPairs(8) });
    if (!protocol) return;
    this.activityKind = "accuracyClinic";
    this.activeMode = protocol;
    this.lastActivity = { kind:"accuracyClinic", id:protocol.id };
    this.pendingLessonId = null;
    this.pendingGameId = null;
    this.pendingGameOptions = {};
    this.ui.activeGameTitle.textContent = `Accuracy Clinic — ${protocol.title}`;
    this.ui.activeGameSubtitle.textContent = protocol.subtitle;
    this.ui.backButton.textContent = "← Back to Accuracy Clinic";
    this.ui.guidedLinkButton.textContent = "Precision Protocol Guide";
    this.ui.stage.innerHTML = "";
    if (this.ui.arcadeStageShell) this.ui.arcadeStageShell.dataset.game = "accuracyclinic";
    if (this.ui.arcadeConsoleMode) this.ui.arcadeConsoleMode.textContent = `HYPERSOFT PRECISION SERVICES • ${protocol.title.toUpperCase()}`;
    if (this.ui.arcadeConsoleStatus) this.ui.arcadeConsoleStatus.textContent = "ACCURACY PROTOCOL ACTIVE";
    if (this.ui.arcadeStageReadout) this.ui.arcadeStageReadout.textContent = `${this.settings.difficulty.toUpperCase()} • PRECISION GATE`;
    if (this.ui.arcadeInputHint) this.ui.arcadeInputHint.textContent = "Exact-entry typing • mistakes stay highlighted • protect the clean streak";
    this.showScreen("game");
    this.engine.startGame({ difficulty:this.settings.difficulty, wordList:this.settings.wordList, modeId:`accuracyClinic:${protocol.id}` });
    this.activeGame = new AccuracyClinicExercise({
      stage:this.ui.stage,
      engine:this.engine,
      finish:result=>this.finishActivity(result,sessionId),
      protocol,
      difficulty:this.settings.difficulty
    });
    this.activeGame.start();
    this.startHudTimer();
    this.ui.stage.focus();
  }

  getBlakeAccuracyClinicResultComment(result) {
    const accuracy=Number(result.accuracy)||0;
    if (result.targetStatus === "Met" && accuracy >= 99.5) return `${accuracy}% first-attempt accuracy. HyperSoft calls this near-perfect control. I have asked whether historical records from 1999 can be rounded to the same standard.`;
    if (result.targetStatus === "Met") return `Precision gate cleared. The irritating lesson here is that controlled typing can be both fast and clean, which undermines several excuses I had prepared.`;
    if (accuracy < 94) return `The clinic found enough misses to justify deliberate remediation. This is not a speed problem yet; the movement pattern needs to become more reliable first.`;
    return `Close to the gate. Review the repeated substitutions, target those keys or pairs, then return without trying to compensate by typing faster.`;
  }

  startAssessment() {
    this.stopActiveGame();
    this.tournament = null;
    this.arcadeChallenge = null;
    this.launchWithLoading("Typing Assessment", () => this.beginAssessment());
  }

  beginAssessment() {
    this.finishingActivity = false;
    const sessionId = ++this.activitySessionId;
    this.activityKind = "assessment";
    this.activeMode = ASSESSMENT_METADATA;
    this.lastActivity = { kind: "assessment", id: ASSESSMENT_METADATA.id };
    this.pendingLessonId = null;
    this.pendingGameId = null;
    this.ui.activeGameTitle.textContent = "Typing Assessment & Placement";
    this.ui.activeGameSubtitle.textContent = ASSESSMENT_METADATA.subtitle;
    this.ui.backButton.textContent = "← Back to Assessment";
    this.ui.guidedLinkButton.textContent = "Assessment Guide";
    this.ui.stage.innerHTML = "";
    if (this.ui.arcadeStageShell) this.ui.arcadeStageShell.dataset.game = "assessment";
    if (this.ui.arcadeConsoleMode) this.ui.arcadeConsoleMode.textContent = "HYPERSOFT PLACEMENT CENTER • DIAGNOSTIC";
    if (this.ui.arcadeConsoleStatus) this.ui.arcadeConsoleStatus.textContent = "ASSESSMENT IN PROGRESS";
    if (this.ui.arcadeStageReadout) this.ui.arcadeStageReadout.textContent = "3-PHASE PLACEMENT DIAGNOSTIC";
    if (this.ui.arcadeInputHint) this.ui.arcadeInputHint.textContent = "Keyboard input active — type the highlighted expected character";
    this.showScreen("game");
    this.engine.startGame({ difficulty: "normal", wordList: "general", modeId: "assessment:placement" });
    this.activeGame = new TypingAssessmentExercise({
      stage: this.ui.stage,
      engine: this.engine,
      finish: result => this.finishActivity(result, sessionId)
    });
    this.activeGame.start();
    this.startHudTimer();
    this.ui.stage.focus();
  }

  getAssessmentPlacement(result) {
    const wpm = Number(result.wpm) || 0;
    const accuracy = Number(result.accuracy) || 0;
    const rhythm = Number(result.rhythmScore) || 0;
    const hesitations = Number(result.hesitations) || 0;
    const traineeComplete = TRAINEE_MODULES.every(item => this.traineeProgress?.[item.id] === true);
    if (accuracy < 88 || wpm < 16 || rhythm < 42) return {
      label: "Keyboard Trainee", destination: "trainee",
      detail: traineeComplete ? "Revisit foundation technique before adding more speed. The diagnostic shows that movement consistency or first-attempt accuracy needs rebuilding." : "Build touch-typing fundamentals first: home position, finger zones, eyes-up technique, and steady rhythm."
    };
    if (accuracy < 94 || wpm < 28 || rhythm < 58) return {
      label: "Formal Lessons — Keyboard Foundations", destination: "lessons",
      detail: "Your fundamentals are usable, but structured curriculum work should come before heavy speed or adaptive drills."
    };
    if (accuracy < 97 || rhythm < 72 || wpm < 42 || hesitations >= 10) return {
      label: "Formal Lessons + Smart Practice", destination: "lessons",
      detail: "You have a workable typing base. Continue the curriculum while using Smart Practice for the specific keys and transitions that slow you down."
    };
    if (wpm >= 55 && accuracy >= 98 && rhythm >= 78) return {
      label: "Advanced Targeted Work", destination: "smartPractice",
      detail: "Your sustained fundamentals are strong. Use Smart Practice, long-word control, trouble-pair work, and the Arcade to push speed without sacrificing accuracy."
    };
    return {
      label: "Smart Practice — Accuracy & Rhythm", destination: "smartPractice",
      detail: "Your general pace is established. Target hesitation, awkward transitions, and accuracy rather than restarting from the beginning."
    };
  }

  applyAssessmentPlacement(result) {
    const placement = this.getAssessmentPlacement(result);
    result.placementLabel = placement.label;
    result.placementDestination = placement.destination;
    result.placementDetail = placement.detail;
    result.targetStatus = placement.label;
    result.title = "Placement Assessment Complete";
    result.message = `${placement.label}: ${placement.detail}`;
    result.extraStats = [...(result.extraStats ?? []), ["Recommended path", placement.label]];
    return result;
  }

  getBlakeAssessmentResultComment(result) {
    const accuracy = Number(result.accuracy) || 0;
    const wpm = Number(result.wpm) || 0;
    if (result.placementLabel === "Advanced Targeted Work") return `${wpm} WPM at ${Math.round(accuracy)}% accuracy with strong rhythm. HyperSoft would like me to welcome the competition. I have declined in writing.`;
    if (result.placementLabel === "Keyboard Trainee") return `The diagnostic says foundations first. This is not a demotion. It is apparently what happens when training software refuses to award points for confidence alone.`;
    if (result.placementDestination === "lessons") return `You've got enough control to train seriously. The curriculum is the right next stop; build the movement pattern until hesitation starts disappearing on its own.`;
    return `The basics are in place. Now HyperSoft wants targeted practice instead of generic repetition. Disturbingly reasonable advice from a company that still employs me as its typing spokesperson.`;
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
    if (!this.ui.hostDialog.open) this.openAccessibleDialog(this.ui.hostDialog, { initialFocus: "#hostStartButton" });
    requestAnimationFrame(() => document.getElementById("hostStartButton")?.focus());
  }

  beginLesson(lessonId) {
    // v0.17.8.1 QA: lesson startup is intentionally isolated from all arcade modeId state.
    this.finishingActivity = false;
    const sessionId = ++this.activitySessionId;
    const lesson = this.getLessonDefinition(lessonId);
    if (!lesson) return;
    this.pendingLessonId = null;
    this.activityKind = "lesson";
    this.activeMode = lesson;
    this.lastActivity = { kind: "lesson", id: lessonId };
    this.ui.activeGameTitle.textContent = lesson.title;
    this.ui.activeGameSubtitle.textContent = lesson.subtitle;
    this.ui.backButton.textContent = lesson.isCustomPractice ? "← Back to Practice Builder" : lesson.isSmartPractice ? "← Back to Smart Practice" : "← Back to lessons";
    this.ui.guidedLinkButton.textContent = "Lesson Guide";
    this.ui.stage.innerHTML = "";
    // Lessons share the activity shell, but must never reference arcade-only mode variables.
    if (this.ui.arcadeStageShell) this.ui.arcadeStageShell.dataset.game = "lesson";
    if (this.ui.arcadeConsoleMode) this.ui.arcadeConsoleMode.textContent = `${lesson.isCustomPractice ? "HYPERSOFT PRACTICE BUILDER" : lesson.isSmartPractice ? "HYPERSOFT SMART PRACTICE" : "HYPERSOFT CURRICULUM"} • ${lesson.title.toUpperCase()}`;
    if (this.ui.arcadeConsoleStatus) this.ui.arcadeConsoleStatus.textContent = lesson.isCustomPractice ? "CUSTOM TIMED SESSION" : lesson.isSmartPractice ? "SMART PRACTICE SESSION" : "LESSON SESSION";
    if (this.ui.arcadeStageReadout) this.ui.arcadeStageReadout.textContent = `${this.settings.difficulty.toUpperCase()} • ${lesson.title.toUpperCase()}`;
    if (this.ui.arcadeInputHint) this.ui.arcadeInputHint.textContent = "Keyboard input active — no click required";
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
      finish: result => this.finishActivity(result, sessionId),
      lesson,
      adaptiveProfile: this.getWeakKeys(8),
      pairProfile: this.getWeakPairs(8)
    });
    this.activeGame.start();
    this.startHudTimer();
    this.ui.stage.focus();
  }

  getBlakeLessonBriefing(lesson, record) {
    if (lesson.isCustomPractice) {
      return `You built this one yourself: ${lesson.subtitle}. HyperSoft will respect your settings, which is more than can be said for several forms I have completed. Keep the target realistic, type for the full timed session, and let the adaptive system record what actually gives you trouble.`;
    }
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
    if (!this.ui.hostDialog.open) this.openAccessibleDialog(this.ui.hostDialog, { initialFocus: "#hostStartButton" });
    requestAnimationFrame(() => document.getElementById("hostStartButton")?.focus());
  }

  beginMode(modeId) {
    // v0.17.8.1 QA: modeId is a required parameter and is never read from outer/global scope.
    if (typeof modeId !== "string" || !modeId) { console.error("HyperSoft: beginMode called without a valid modeId"); return; }
    this.finishingActivity = false;
    const sessionId = ++this.activitySessionId;
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
    // Restore the arcade presentation state every time a mode starts.
    if (this.ui.arcadeStageShell) this.ui.arcadeStageShell.dataset.game = modeId;
    if (this.ui.arcadeConsoleMode) this.ui.arcadeConsoleMode.textContent = `HYPERSOFT ARCADE • ${mode.title.toUpperCase()}`;
    if (this.ui.arcadeConsoleStatus) this.ui.arcadeConsoleStatus.textContent = this.tournament?.active ? `TOURNAMENT ROUND ${tournamentRound}/${tournamentTotal}` : this.arcadeChallenge?.active ? "RANDOM CHALLENGE" : "LIVE SESSION";
    if (this.ui.arcadeStageReadout) this.ui.arcadeStageReadout.textContent = `${this.settings.difficulty.toUpperCase()} • ${mode.title.toUpperCase()}`;
    if (this.ui.arcadeInputHint) this.ui.arcadeInputHint.textContent = modeId === "checkOutTime" ? "10-key / number input armed" : modeId === "chameleonPicnic" ? "Target keys armed" : "Keyboard input active — no click required where supported";
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
      finish: result => this.finishActivity(result, sessionId),
      mode,
      gameOptions
    });
    this.activeGame.start();
    this.startHudTimer();
    this.ui.stage.focus();
  }

  startHudTimer() {
    window.clearInterval(this.hudTimerId);
    this.hudTimerId = window.setInterval(() => {
      if (this.engine.running) {
        const timerMs = this.activeGame?.getHUDTime?.() ?? this.engine.getElapsedMs();
        this.engine.updateHUD({ timerMs });
      }
    }, 200);
  }

  finishActivity(activityResult = {}, sessionId = this.activitySessionId) {
    // Reject completions from an activity that has already been quit/replaced.
    if (sessionId !== this.activitySessionId) return;
    // A frame/timer and a final keystroke can occasionally finish on the same tick.
    // Ignore duplicate completion callbacks so scores/tournaments are never recorded twice.
    if (this.finishingActivity) return;
    this.finishingActivity = true;
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
    if (this.activityKind === "lesson") result.lessonComparison = this.compareLessonResult(result, this.activeMode);
    if (["lesson", "assessment", "realWorld", "accuracyClinic", "punctuation", "certification"].includes(this.activityKind)) {
      if (result.keyStats) {
        this.mergeKeyStats(result.keyStats);
        this.appendKeyHistory(result.keyStats, this.activeMode?.id);
      }
      if (result.pairStats) this.mergePairStats(result.pairStats);
      this.renderWeakKeySummary();
    }
    if (this.activityKind === "assessment") this.applyAssessmentPlacement(result);

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
    const dailyPlanUpdate = this.completeDailyPlanActiveStep(result);
    if (dailyPlanUpdate) result.extraStats = [...(result.extraStats ?? []), ["Daily plan", dailyPlanUpdate]];
    const newlyUnlocked = this.syncAchievements({ notify: true });
    this.renderScoreboard();
    this.renderAchievements();

    if (this.activityKind === "game" && this.tournament?.active) {
      const isLast = this.tournament.currentIndex >= this.tournament.rounds.length - 1;
      if (isLast) {
        this.finishingActivity = false;
        this.completeTournament(newlyUnlocked);
        return;
      }
      this.tournament.awaitingContinue = true;
      const cupTotal = this.tournament.results.reduce((sum, row) => sum + (Number(row.cupPoints) || 0), 0);
      const nextMode = MODE_METADATA.find(item => item.id === this.tournament.rounds[this.tournament.currentIndex + 1]);
      result.extraStats = [...(result.extraStats ?? []), ["Cup points", result.cupPoints], ["Cup total", cupTotal.toLocaleString()], ["Tournament", `Round ${this.tournament.currentIndex + 1}/${this.tournament.rounds.length}`], ["Next", nextMode?.title ?? "Final results"]];
      result.newAchievements = newlyUnlocked;
      this.finishingActivity = false;
      this.showResult(result);
      return;
    }

    if (this.activityKind === "game" && this.arcadeChallenge?.active) this.arcadeChallenge.completed = true;
    result.newAchievements = newlyUnlocked;
    if (newlyUnlocked.length) this.playUiTone("achievement"); else if (result.success !== false) this.playUiTone("complete");
    this.finishingActivity = false;
    this.showResult(result);
  }

  getMultimediaLevel() { return this.settings.multimedia || "standard"; }

  getSoundGain(level = this.settings.soundVolume || "normal") {
    return { low: 0.035, normal: 0.075, high: 0.13 }[level] ?? 0.075;
  }

  playSynthSequence(sequence, { gainLevel = this.settings.soundVolume || "normal", type = "square" } = {}) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.audioContext ||= new AudioCtx();
      const ctx = this.audioContext;
      if (ctx.state === "suspended") ctx.resume?.().catch(() => {});
      const now = ctx.currentTime + 0.015;
      const peak = this.getSoundGain(gainLevel);
      sequence.forEach(([freq, dur, offset = 0, wave = type]) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = wave;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(peak, now + offset + .008);
        gain.gain.exponentialRampToValueAtTime(.0001, now + offset + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + dur + .025);
      });
      return true;
    } catch (_) { return false; }
  }

  playUiTone(kind = "click") {
    if (!this.settings.sound || this.getMultimediaLevel() === "quiet") return;
    const sequences = {
      click: [[610, .045, 0, "triangle"]],
      complete: [[440, .09, 0], [660, .1, .11], [880, .12, .23]],
      achievement: [[523, .09, 0], [659, .09, .11], [784, .1, .22], [1047, .15, .34]],
      notice: [[392, .07, 0, "triangle"], [523, .09, .1, "triangle"]]
    };
    this.playSynthSequence(sequences[kind] || sequences.click);
  }

  playTrainingTone(correct = true) {
    if (!this.settings.sound) return;
    this.playSynthSequence(correct
      ? [[540, .065, 0, "triangle"], [720, .08, .075, "triangle"]]
      : [[190, .11, 0, "sawtooth"]], { gainLevel: this.settings.soundVolume });
  }

  playSoundTest() {
    const level = this.ui.soundVolumeSelect?.value || "normal";
    const ok = this.playSynthSequence([
      [440, .09, 0, "triangle"],
      [660, .09, .12, "triangle"],
      [880, .13, .24, "square"]
    ], { gainLevel: level });
    if (this.ui.soundTestStatus) {
      this.ui.soundTestStatus.textContent = ok
        ? `Played the ${level} HyperSoft sound test. ${this.ui.soundToggle?.checked ? "Sound Effects are enabled and will be saved at this level." : "Sound Effects are still switched off; check Sound Effects before saving to use audio during training."}`
        : "This browser did not allow Web Audio. Check the tab/site audio permissions and try again.";
    }
  }

  renderAboutTip() {
    const tips = [
      "Did You Know? F1 opens context-sensitive HyperSoft Help almost everywhere in the suite.",
      "Did You Know? Smart Practice does not alter the 14-lesson curriculum certificate requirements.",
      "Did You Know? Blake's typing speed remains the primary reason Compliance has not replaced his chair with a traffic cone.",
      "Did You Know? The Direct Edition is designed to run by double-clicking index.html with no local web server.",
      "Did You Know? Weak-Key Workshop and Trouble-Pair Clinic adapt independently for each learner profile.",
      "Did You Know? Real-World Lab uses fictional records to train email addresses, file paths, forms, numeric entry, and document transcription.",
      "Did You Know? 10-Key Academy reports numeric entry in KPH rather than pretending it is ordinary word-processing WPM.",
      "Did You Know? Punctuation Lab tracks symbol-family accuracy separately so a strong alphabetic score cannot hide trouble with Shift, quotes, slashes, or business symbols.",
      "Did You Know? Timed Tests keep Gross WPM and Adjusted WPM separate so an error-heavy sprint cannot masquerade as clean sustained speed.",
      "Did You Know? The Learning Center explains the theory behind HyperSoft's WPM, accuracy, rhythm, 10-Key, punctuation, and practice recommendations.",
      "Did You Know? Accuracy Clinic tracks the longest clean first-attempt character streak in each precision session.",
      "Did You Know? Locking your workstation is faster than completing an incident report, despite Blake's field research."
    ];
    this.ui.aboutTip.textContent = tips[Math.floor(Math.random() * tips.length)];
  }

  openAbout() { this.renderAboutTip(); this.openAccessibleDialog(this.ui.aboutDialog); this.playUiTone("notice"); }

  showBlakeNotification(title, text) {
    if (this.getMultimediaLevel() !== "full" || !this.ui.blakeNotification) return;
    window.clearTimeout(this.notificationTimer);
    this.ui.blakeNotificationTitle.textContent = title;
    this.ui.blakeNotificationText.textContent = text;
    this.ui.blakeNotification.hidden = false;
    requestAnimationFrame(() => this.ui.blakeNotification.classList.add("is-visible"));
    this.playUiTone("notice");
    this.notificationTimer = window.setTimeout(() => this.hideBlakeNotification(), 6500);
  }

  hideBlakeNotification() {
    if (!this.ui.blakeNotification) return;
    this.ui.blakeNotification.classList.remove("is-visible");
    window.setTimeout(() => { this.ui.blakeNotification.hidden = true; }, 180);
  }

  maybeShowBlakeNotification(screen) {
    if (this.getMultimediaLevel() !== "full" || Math.random() > .24) return;
    const messages = {
      title: ["Blake is online", "Productivity systems nominal. Security posture remains under review."],
      dailyPlan: ["Daily plan ready", "HyperSoft has converted the learner profile into an actual practice sequence. Blake has asked whether lunch can also be optimized this way."],
      theory: ["Learning Center advisory", "Blake has requested that the chapter on adjusted WPM be revised so errors count as 'optional productivity events.' Request denied."],
      lessons: ["Training advisory", "Accuracy first. Blake objects to this ordering but the curriculum team prevailed."],
      smartPractice: ["Smart Practice advisory", "Target the awkward transitions until they become boring. Blake calls this 'weaponized repetition.'"],
      customPractice: ["Practice Builder advisory", "You selected the drill. HyperSoft therefore has documentation proving this was your idea."],
      realWorld: ["Applied typing advisory", "Today's records are fictional. Blake has been specifically instructed not to substitute a live distribution list."],
      accuracyClinic: ["Precision advisory", "If accuracy falls apart when you speed up, HyperSoft has classified that as evidence rather than bad luck."],
      tenKey: ["Numeric skills advisory", "Blake has volunteered to demonstrate 10-key entry. Accounting has asked that the sample ledger remain fictional."],
      punctuation: ["Business writing advisory", "Punctuation is not optional decoration. Blake has been informed that this includes apostrophes in filenames, somehow."],
      certification: ["Timed test advisory", "The clock starts on your first key. Blake has asked whether thinking time can also be excluded from every other performance metric."],
      menu: ["Arcade bulletin", "Typing games are authorized. Attempting to access the server room for bonus points is not."],
      progress: ["Performance review", "Your statistics are local to this profile. Blake has been asked not to print them and leave them in the break room."]
    };
    const row = messages[screen]; if (row) this.showBlakeNotification(row[0], row[1]);
  }

  stopActiveGame() {
    // Invalidate every callback captured by the activity being stopped.
    this.activitySessionId += 1;
    window.clearInterval(this.hudTimerId);
    this.hudTimerId = null;
    if (this.activeGame) {
      try { this.activeGame.stop(); }
      catch (error) { console.error("Activity cleanup error:", error); }
    }
    this.activeGame = null;
    if (this.engine.running) this.engine.stopGame();
  }

  exitTo(screenName, { focusHeading = false } = {}) {
    if (screenName !== "dailyPlan") this.dailyPlanReturnPending = false;
    this.cancelLoadingInterlude();
    window.clearTimeout(this.notificationTimer);
    this.notificationTimer = null;
    this.hideBlakeNotification();
    this.pendingLessonId = null;
    this.pendingGameId = null;
    this.pendingGameOptions = {};
    this.finishingActivity = false;
    if (this.tournament?.active && this.activeGame && screenName !== "game") {
      if (!confirm("Quit the current Typing Tournament? Completed rounds remain in arcade history, but the unfinished cup will not be recorded.")) return;
      this.tournament = null;
    }
    if (this.arcadeChallenge?.active && this.activeGame && screenName !== "game") this.arcadeChallenge = null;
    this.stopActiveGame();
    if (this.ui.resultDialog.open) this.ui.resultDialog.close();
    if (this.ui.guideDialog.open) this.ui.guideDialog.close();
    this.showScreen(screenName, { focusHeading });
  }

  showScreen(name, { focusHeading = false } = {}) {
    const map = {
      title: this.ui.titleScreen,
      office: this.ui.officeScreen,
      profiles: this.ui.profilesScreen,
      trainee: this.ui.traineeScreen,
      assessment: this.ui.assessmentScreen,
      technique: this.ui.techniqueScreen,
      dailyPlan: this.ui.dailyPlanScreen,
      theory: this.ui.theoryScreen,
      lessons: this.ui.lessonsScreen,
      smartPractice: this.ui.smartPracticeScreen,
      customPractice: this.ui.customPracticeScreen,
      realWorld: this.ui.realWorldScreen,
      accuracyClinic: this.ui.accuracyClinicScreen,
      tenKey: this.ui.tenKeyScreen,
      punctuation: this.ui.punctuationScreen,
      certification: this.ui.certificationScreen,
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
    if (name === "trainee") this.renderTrainee();
    if (name === "assessment") this.renderAssessment();
    if (name === "technique") this.renderTechniqueCoach();
    if (name === "dailyPlan") this.renderDailyPlan();
    if (name === "theory") this.renderTheoryLibrary();
    if (name === "progress") this.renderProgress();
    if (name === "achievements") this.renderAchievements();
    if (name === "reports") this.renderReports();
    if (name === "scoreboard") this.renderScoreboard();
    if (name === "settings") this.renderSettings();
    if (name === "lessons") this.renderLessons(); this.renderSmartPracticeLab(); this.renderSmartPracticeWeakKeySummary();
    if (name === "smartPractice") { this.renderSmartPracticeLab(); this.renderSmartPracticeWeakKeySummary(); }
    if (name === "customPractice") this.renderCustomPracticeBuilder();
    if (name === "realWorld") this.renderRealWorldLab();
    if (name === "accuracyClinic") this.renderAccuracyClinic();
    if (name === "tenKey") this.renderTenKeyAcademy();
    if (name === "punctuation") this.renderPunctuationLab();
    if (name === "certification") this.renderCertificationTests();
    if (name === "menu") this.renderMenu();
    if (name === "title") { this.updateProfileChrome(); this.rotateBlakeQuote(); this.rotateHomePersonality(); this.renderHomeIntegration(); }
    const previousScreenName=this.currentScreenName;
    this.currentScreenName = name;
    if (name !== previousScreenName && getSuiteModule(name)) this.recordNavigationVisit(name);
    document.querySelectorAll(".topnav [data-nav]").forEach(button => {
      if (button.dataset.nav === name) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    const activeHeading=map[name]?.querySelector("h1, h2");
    if (this.ui.screenChangeAnnouncer) this.ui.screenChangeAnnouncer.textContent=`${activeHeading?.textContent?.trim() || name} loaded`;
    if (focusHeading && activeHeading) {
      activeHeading.setAttribute("tabindex", "-1");
      requestAnimationFrame(() => activeHeading.focus({ preventScroll: false }));
    }
    this.updateWorkspaceChrome(name);
    if (["title","trainee","assessment","technique","dailyPlan","theory","lessons","smartPractice","customPractice","realWorld","accuracyClinic","tenKey","punctuation","certification","menu","progress"].includes(name)) this.maybeShowBlakeNotification(name);
  }

  initializeStartupSequence() {
    if (!this.ui.startupOverlay) return;
    const reduceMotion = this.shouldReduceMotion();
    if (this.settings.startup === false || reduceMotion) {
      this.ui.startupOverlay.hidden = true;
      this.ui.startupOverlay.setAttribute("aria-busy", "false");
      this.maybeOpenOnboarding();
      return;
    }

    this.ui.startupOverlay.hidden = false;
    this.ui.startupOverlay.classList.remove("is-closing");
    const steps = [
      [0, "Reading learner profile...", 12],
      [390, "Initializing adaptive keyboard analysis...", 28],
      [790, "Mounting Keyboard Trainee, Assessment, Technique Coach, Daily Training Plan, Learning Center, Practice Builder, 10-Key Academy, Timed Tests, and lessons...", 47],
      [1190, "Loading Typing Arcade competition services...", 66],
      [1590, "Verifying reports, certificates, and local backups...", 83],
      [1980, "Consulting Blake. Compliance has been notified...", 96],
      [2320, "HyperSoft workstation ready.", 100]
    ];
    this.startupTimeoutIds.forEach(id => window.clearTimeout(id));
    this.startupTimeoutIds = steps.map(([delay, message, progress]) => window.setTimeout(() => {
      if (!this.ui.startupOverlay || this.ui.startupOverlay.hidden) return;
      this.ui.startupStatus.textContent = message;
      this.ui.startupProgressFill.style.width = `${progress}%`;
    }, delay));
    this.startupTimeoutIds.push(window.setTimeout(() => this.closeStartupSequence(), 2670));
  }

  closeStartupSequence() {
    this.startupTimeoutIds.forEach(id => window.clearTimeout(id));
    this.startupTimeoutIds = [];
    if (!this.ui.startupOverlay || this.ui.startupOverlay.hidden) return;
    const reduceMotion = this.shouldReduceMotion();
    if (reduceMotion) {
      this.ui.startupOverlay.hidden = true;
      this.ui.startupOverlay.setAttribute("aria-busy", "false");
      this.maybeOpenOnboarding();
      return;
    }
    this.ui.startupOverlay.classList.add("is-closing");
    window.setTimeout(() => {
      this.ui.startupOverlay.hidden = true;
      this.ui.startupOverlay.classList.remove("is-closing");
      this.ui.startupOverlay.setAttribute("aria-busy", "false");
      this.maybeOpenOnboarding();
    }, 220);
  }

  updateWorkspaceChrome(name = this.currentScreenName || "title") {
    const labels = {
      title: ["Home", "HyperSoft Deluxe launcher"],
      office: ["Blake's Office", "Advice, bulletins, and Compliance corrections"],
      profiles: ["Profiles", "Learner files, guest mode, backup and restore"],
      trainee: ["Keyboard Trainee", "Foundations: posture, keyboard map, finger zones, rhythm, and touch-typing theory"],
      assessment: ["Typing Assessment", "Placement diagnostic: sustainable speed, accuracy, rhythm, and keyboard range"],
      technique: ["Technique Coach", "Coaching analysis: accuracy, rhythm, corrections, mixed keys, transitions, and sustainability"],
      dailyPlan: ["Daily Training Plan", "Adaptive 10-, 20-, or 30-minute guided practice assembled from the active learner profile"],
      theory: ["Learning Center", "Typing theory, measurement, technique, practice science, ergonomics, and a map of the HyperSoft training system"],
      lessons: ["Lessons", "Formal curriculum from home row through the full keyboard"],
      smartPractice: ["Smart Practice", "Targeted training drills to sharpen your skills."],
      customPractice: ["Practice Builder", "Build timed drills from weak keys, trouble pairs, vocabulary, punctuation, numbers, and custom targets"],
      realWorld: ["Real-World Lab", "Applied typing: email, memos, contact data, paths, forms, and document transcription"],
      accuracyClinic: ["Accuracy Clinic", "Precision protocols, accuracy gates, clean-streak training, and error-pattern remediation"],
      tenKey: ["10-Key Academy", "Numeric keypad theory, finger zones, KPH practice, accounting entry, and proficiency testing"],
      punctuation: ["Punctuation Lab", "Shift technique, business punctuation, symbols, email/web characters, and writing precision"],
      certification: ["Timed Tests", "1-, 3-, 5-, and 10-minute certification-style training tests with gross and adjusted WPM"],
      menu: ["Arcade", "8 typing games, Random Challenge, and Typing Tournament"],
      progress: ["Progress", "WPM, accuracy, weak keys, and trend analysis"],
      achievements: ["Achievements", "HyperSoft badge and milestone archive"],
      reports: ["Reports", "Certificates and printable learner reports"],
      scoreboard: ["Scoreboard", "Local lesson, practice, game, and tournament history"],
      settings: ["Settings", "Profile-specific training and interface preferences"],
      game: [
        this.activeMode?.title ?? "Training Activity",
        this.activityKind === "realWorld"
          ? `Applied Keyboarding Lab • ${this.activeMode?.subtitle ?? "Real-world typing simulation"}`
          : this.activityKind === "accuracyClinic"
            ? `Accuracy Clinic • ${this.activeMode?.subtitle ?? "Precision protocol"}`
          : this.activityKind === "tenKey"
            ? `10-Key Academy • ${this.activeMode?.subtitle ?? "Numeric keypad training"}`
          : this.activityKind === "punctuation"
            ? `Punctuation & Business Writing Lab • ${this.activeMode?.subtitle ?? "Business writing precision"}`
          : this.activityKind === "certification"
            ? `Timed Testing Center • ${this.activeMode?.subtitle ?? "Certification-style timed copy"}`
          : this.activeMode?.isCustomPractice
            ? `Practice Builder • ${this.activeMode?.subtitle ?? "Custom timed drill"}`
          : this.activeMode?.isSmartPractice
          ? `Smart Practice Lab • ${this.activeMode?.subtitle ?? "Targeted keyboard drill"}`
          : this.activityKind === "lesson"
            ? `Curriculum Workstation • ${this.activeMode?.subtitle ?? "Formal typing lesson"}`
            : this.activityKind === "assessment"
              ? `Placement Center • ${this.activeMode?.subtitle ?? "Typing diagnostic"}`
              : this.activeMode?.subtitle ?? "Active typing session"
      ]
    };
    const [label, detail] = labels[name] ?? ["HyperSoft", "Typing workstation"];
    if (this.ui.currentScreenLabel) this.ui.currentScreenLabel.textContent = label;
    if (this.ui.currentScreenDetail) this.ui.currentScreenDetail.textContent = detail;
    const hyper98Icons = { title: "⌂", trainee: "⌨", assessment: "✓", technique: "◇", dailyPlan: "☷", theory: "?", lessons: "▣", smartPractice: "💡", customPractice: "⚒", realWorld: "▤", accuracyClinic: "✓", tenKey: "#", punctuation: ";", certification: "T", menu: "✣", progress: "↗", reports: "▤", achievements: "★", office: "B", profiles: "●", settings: "⚙", scoreboard: "#", game: "⌨" };
    if (this.ui.hyper98ModuleIcon) this.ui.hyper98ModuleIcon.textContent = hyper98Icons[name] ?? "⌨";
    if (this.ui.hyper98CurriculumState) this.ui.hyper98CurriculumState.textContent = name === "lessons" ? "ON" : "OFF";
    if (this.ui.hyper98CurriculumToggle) this.ui.hyper98CurriculumToggle.setAttribute("aria-pressed", name === "lessons" ? "true" : "false");
    const difficulty = DIFFICULTY_CONFIG[this.settings.difficulty]?.label ?? "Normal";
    if (this.ui.workspaceDifficulty) this.ui.workspaceDifficulty.textContent = difficulty;
    if (this.ui.workspaceWordList) this.ui.workspaceWordList.textContent = this.settings.wordList ? this.settings.wordList[0].toUpperCase() + this.settings.wordList.slice(1) : "General";
    document.body.dataset.screen = name;
    document.querySelectorAll(".topnav [data-nav]").forEach(button => {
      const active = button.dataset.nav === name;
      button.classList.toggle("is-current", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  renderHelpReference(view="context") {
    if (!this.ui.helpReferencePanel) return;
    const selected = new Set(["context","start","return","recovery","modules"]).has(view) ? view : "context";
    this.ui.helpReferenceNav?.querySelectorAll("[data-help-reference]").forEach(button => {
      const active = button.dataset.helpReference === selected;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const action = (label, screen, primary=false) => `<button class="${primary ? "primary" : "secondary"}" type="button" data-help-open="${this.escapeHtml(screen)}">${this.escapeHtml(label)}</button>`;
    if (selected === "start") {
      this.ui.helpReferencePanel.innerHTML = `<h4>New to HyperSoft?</h4><p>You do not need to understand the whole suite before beginning. Pick the route that matches how much typing experience you already have.</p><ol class="help-reference-steps"><li><span><strong>Never learned touch typing seriously:</strong> start with Keyboard Trainee for posture, finger zones, home row, and the basic theory behind the keyboard.</span></li><li><span><strong>Know the basics but do not know your level:</strong> take Typing Assessment. It recommends a starting point without locking anything.</span></li><li><span><strong>Ready for structured practice:</strong> use Formal Lessons for curriculum progression, or Daily Plan when you want HyperSoft to choose a short session from your evidence.</span></li><li><span><strong>Need targeted repair:</strong> Smart Practice, Accuracy Clinic, Technique Coach, and specialized labs become more useful after the profile has recorded some typing.</span></li></ol><div class="help-reference-actions">${action("Keyboard Trainee","trainee",true)}${action("Typing Assessment","assessment")}${action("Formal Lessons","lessons")}${action("Daily Plan","dailyPlan")}</div>`;
      return;
    }
    if (selected === "return") {
      this.ui.helpReferencePanel.innerHTML = `<h4>Returning after weeks or months away</h4><p>Your saved profile already remembers prior lessons, scores, weak keys, assessments, achievements, and recent modules. You normally do not need to start over.</p><ol class="help-reference-steps"><li><span>Go to <strong>Home</strong> and use <strong>Continue Training</strong> if it points to something you still recognize.</span></li><li><span>If you are unsure where your skill level is now, retake <strong>Typing Assessment</strong>. The new result updates placement evidence without deleting history.</span></li><li><span>Open <strong>Daily Plan</strong> for a short current-session recommendation assembled from your saved evidence.</span></li><li><span>Use <strong>Progress</strong> or <strong>Technique Coach</strong> when you want to review what had been weak before deciding what to practice.</span></li></ol><div class="help-reference-actions">${action("Home","title",true)}${action("Retake Assessment","assessment")}${action("Today's Plan","dailyPlan")}${action("Progress","progress")}${action("Technique Coach","technique")}</div>`;
      return;
    }
    if (selected === "recovery") {
      this.ui.helpReferencePanel.innerHTML = `<h4>Backup, move, or recover a learner</h4><p>HyperSoft stores learner data locally in this browser. Portable JSON exports are the recovery path if browser storage is cleared or you move to another computer/browser.</p><ol class="help-reference-steps"><li><span><strong>Routine backup:</strong> Profiles → Backup & Restore → <strong>Export Current Profile</strong>. This creates a portable copy of the active learner.</span></li><li><span><strong>Whole installation backup:</strong> use <strong>Export All Profiles</strong> when you want every persistent learner in one file.</span></li><li><span><strong>Bring one learner back:</strong> use <strong>Import Profile</strong>. This does not require replacing the other profiles.</span></li><li><span><strong>Disaster recovery:</strong> <strong>Restore Full Backup</strong> replaces the persistent profile set with the profiles stored in that backup. Export anything you need first.</span></li><li><span><strong>No backup file:</strong> if browser/site storage has already been erased, HyperSoft cannot reconstruct the lost local performance history from the application alone.</span></li></ol><div class="help-recovery-warning"><strong>Before clearing browser data, changing computers, resetting a profile, or reinstalling:</strong> export a profile or full backup first.</div><div class="help-reference-actions">${action("Open Profiles & Backup","profiles",true)}${action("Backup Reminder Settings","settings")}</div>`;
      return;
    }
    if (selected === "modules") {
      const entries = SUITE_MODULE_CATALOG.map(item => `<div class="help-module-entry"><div><strong>${this.escapeHtml(item.title)}</strong><small>${this.escapeHtml(item.description)}</small></div>${action("Open",item.id)}</div>`).join("");
      this.ui.helpReferencePanel.innerHTML = `<h4>Complete Module Directory</h4><p>Every major HyperSoft module is listed here. Opening one closes Help and takes you directly there.</p><div class="help-module-directory">${entries}</div>`;
      return;
    }
    this.ui.helpReferencePanel.innerHTML = `<h4>Help for the current module</h4><p>The guidance above changes automatically with the screen you are using. Use the other tabs when you need an orientation, return-to-training plan, recovery instructions, or the complete module map.</p>`;
  }

  openContextHelp() {
    if (!this.ui.helpDialog) return;
    const topics = {
      title: ["Home", "The integrated HyperSoft launcher now recommends a short next-step path and provides a searchable Program Guide for the full suite.", ["Use Set My Training Goal to tell HyperSoft whether you are new, experienced, accuracy-focused, speed-focused, work-focused, numeric-focused, or mainly here for games.", "Recommended Path never locks modules; it only reduces guesswork about what to do next.", "Use Find a Module to search the complete suite by terms such as accuracy, 10-key, work, test, reports, or games."]],
      trainee: ["Keyboard Trainee", "An eight-station orientation course for learners who have never practiced touch typing seriously or want to rebuild bad habits.", ["Complete the short theory checks and technique checks at your own pace; there is no WPM target.", "Home row and finger zones are taught as repeatable reference movements rather than trivia to memorize.", "After the Readiness Check, use Typing Assessment if you want a data-based placement recommendation before formal training."]],
      assessment: ["Typing Assessment", "A three-phase placement diagnostic that measures sustained WPM, first-attempt accuracy, keyboard range, rhythm, and hesitation.", ["Type the highlighted passage exactly; wrong keys count but do not move the passage forward.", "The result recommends Keyboard Trainee, Formal Lessons, Smart Practice, or Advanced Targeted Work.", "Assessment results are stored locally in the active profile and can be retaken at any time."]],
      technique: ["Technique Coach", "A profile-level coaching analysis that interprets how the learner types rather than just reporting final WPM.", ["Technique Coach combines Assessment timing with recent training, weak keys, and trouble-pair history.", "Priority cards link directly to the lesson, drill, or module most relevant to that technique problem.", "A low-confidence profile simply means HyperSoft needs more sustained evidence; it is not a negative score."]],
      dailyPlan: ["Daily Training Plan", "HyperSoft assembles a practical sequence from the learner's current evidence instead of asking them to guess what to practice next.", ["Choose a 10-, 20-, or 30-minute plan; longer plans can include broader skill rotation while short plans stay focused on the highest-priority issue.", "Completing a launched activity automatically checks off that plan step. Keyboard Trainee review steps are marked manually after the review is finished.", "Plans use Assessment, Technique Coach, curriculum progress, weak keys/pairs, Accuracy Clinic, punctuation, 10-Key, Real-World Lab, and Timed Test history."]],
      theory: ["Learning Center", "A reference-and-instruction library for the ideas behind touch typing and HyperSoft's measurements.", ["Use the category filter or search box to jump between foundations, measurement, technique, special skills, practice/comfort, and system topics.", "Each topic includes a practical example, a common mistake, an optional knowledge check, and links into the relevant training modules.", "Reviewed topics and correct knowledge checks are stored with the active profile but do not affect WPM, curriculum completion, or certification results."]],
      office: ["Blake's Office", "A deliberately excessive archive of Blake material. Nothing here changes your training data unless a linked activity is started elsewhere.", ["Shuffle Blake's Desk rotates the featured advice and archive selections.", "Earn achievements to recover more of Blake's quote archive.", "Compliance rebuttals are the actual safe guidance whenever Blake offers terrible workplace advice."]],
      profiles: ["Profiles", "Create independent local learner files, use temporary Guest mode, and manage portable JSON backups.", ["Each saved profile keeps separate settings, scores, adaptive data, achievements, and reports.", "Export Current Profile before clearing browser data or moving computers.", "Restore Full Backup replaces the persistent profile set, so use it intentionally."]],
      lessons: ["Lessons", "The formal fourteen-step HyperSoft curriculum progresses from home row through the full keyboard.", ["Formal lessons count toward curriculum completion certificates.", "Use the Smart Practice module for targeted keyboard-geometry drills.", "Weak-Key Workshop remains the adaptive capstone of the formal curriculum."]],
      smartPractice: ["Smart Practice", "Nine focused drills target word shape, hand balance, awkward transitions, and your own recorded trouble pairs.", ["Smart Practice records are kept separately from formal curriculum completion.", "Trouble-Pair Clinic personalizes itself from the active learner's transition history.", "Use Curriculum Mode in the HyperSoft 98 header to jump back to formal Lessons."]],
      customPractice: ["Practice Builder", "Build a timed typing drill around the exact material you want to practice.", ["Choose balanced typing, stored weak keys, stored trouble pairs, or your own custom keys and two-letter transitions.", "Add capitals, punctuation, and number-row material independently, then set session duration, WPM, and accuracy targets.", "Saved presets belong to the active profile and travel with profile/full-backup exports."]],
      realWorld: ["Real-World Typing Lab", "Applied simulations bridge tutor exercises and the structured material people actually type.", ["Choose Email, Memo, Contact/Address, File/Web, Forms/Numbers, or Document Transcription.", "Each session contains three fictional records and requires exact punctuation, capitalization, digits, symbols, and line breaks.", "Real-World Lab results feed weak-key, trouble-pair, Progress, Scoreboard, and Technique Coach analytics without counting as formal curriculum lessons."]],
      accuracyClinic: ["Accuracy Clinic", "Precision protocols are designed for learners who need cleaner first-attempt typing rather than more raw speed.", ["Choose Clean Slate, Controlled Pace, Punctuation Precision, Weakness Repair, or Near-Perfect Endurance.", "Each protocol uses an accuracy gate, clean-streak tracking, exact-entry error handling, and a post-session substitution review.", "Accuracy Clinic evidence feeds weak-key, trouble-pair, Progress, Scoreboard, and Technique Coach analytics without changing curriculum completion."]],
      tenKey: ["10-Key Academy", "A dedicated numeric-keypad course covering home position, finger columns, zero/decimal, Enter rhythm, accounting entry, and sustained proficiency.", ["Use 4-5-6 as the keypad home row: index on 4, middle on 5, ring on 6; thumb handles 0.", "HyperSoft reports KPH separately from ordinary WPM because numeric data-entry speed is a different metric.", "Top-row digits remain usable, but advanced Academy protocols track and require predominantly numeric-keypad input to clear their full target."]],
      punctuation: ["Punctuation & Business Writing Lab", "A guided progression for Shift, capitals, quotes, apostrophes, business punctuation, web/path characters, and symbol-heavy professional prose.", ["Each protocol contains three exact-entry exercises and separately measures capital/symbol accuracy.", "Wrong keys remain on the expected character so first-attempt errors are visible without corrupting the training text.", "Results feed adaptive weak-key/trouble-pair history and preserve a dedicated punctuation-family review."]],
      certification: ["Timed Certification Tests", "Formal-length local typing tests for repeatable speed and accuracy measurement.", ["Choose 1, 3, 5, or 10 minutes, then select General, Business, or Technical prose.", "Choose a preset training standard or define a custom adjusted-WPM and accuracy target.", "Gross WPM, Adjusted WPM, raw errors, accuracy, and printable result sheets are stored with the active learner profile."]],
      menu: ["Typing Arcade", "Choose any of eight typing games, launch randomized challenges, or enter a multi-game HyperSoft tournament.", ["Difficulty is profile-specific and applies across the arcade.", "Many games offer their own scenario or variant options in Blake's briefing.", "Tournament Cup Points normalize performance so one high-scoring game cannot dominate the whole competition."]],
      progress: ["Progress", "A detailed local analytics screen built from this learner's recorded lesson, practice, and game sessions.", ["Review WPM and accuracy trends over time.", "Use the keyboard heatmap, weak-key list, and troublesome-pair data to choose targeted practice.", "Difficulty records and personal-best history help separate improvement from one unusually good run."]],
      achievements: ["Achievements", "HyperSoft milestones reward speed, accuracy, practice, curriculum progress, arcade performance, challenges, and tournaments.", ["Achievements are profile-specific and persist even if the Scoreboard is cleared.", "Many achievements evaluate existing history retroactively.", "Achievement points also unlock additional Blake quotes."]],
      reports: ["Reports", "Generate printable HyperSoft certificates and learner reports from the active profile's saved performance history.", ["Print / Save PDF uses the browser's normal print dialog and requires no internet connection.", "Lesson Mastery certificates appear only for lessons whose targets have been met.", "Assessment and detailed reports include adaptive weak-key information when enough data exists."]],
      scoreboard: ["Scoreboard", "Chronological local history for Lessons, Smart Practice, Assessments, Games, and Tournament summaries.", ["Tournament rounds and tournament summaries are separated to avoid double-counting performance statistics.", "Pacific time is used for displayed activity timestamps.", "Clearing scores does not delete unlocked achievements."]],
      settings: ["Settings & Diagnostics", "Preferences belong to the active learner profile unless Guest mode is in use. Settings also includes read-only diagnostics and backup-reminder controls.", ["Difficulty changes timing, movement, word length, and other activity parameters.", "Interface Theme changes the full HyperSoft shell.", "Run Diagnostics checks expected module counts, duplicate IDs, navigation targets, and browser-storage availability without modifying learner data."]],
      game: [this.activeMode?.title ?? "Active Activity", this.activeMode?.subtitle ?? "An activity is currently running.", [
        this.activityKind === "lesson" ? "The lesson workstation highlights the next physical key, recommended hand/finger, and Shift key when the keyboard coach is enabled." : "Use the on-screen target and HUD as the authoritative activity instructions.",
        "The Guided Link button opens the mode-specific quick-reference rules.",
        this.activityKind === "lesson" ? "Keyboard Coach can be toggled inside the workstation without changing scores or adaptive data." : "Leaving the activity stops the current run; tournaments ask before abandoning an unfinished cup."
      ]]
    };
    const [title, intro, bullets] = topics[this.currentScreenName] ?? topics.title;
    this.ui.helpDialogTitle.textContent = `${title} Help`;
    this.ui.helpModuleName.textContent = title;
    this.ui.helpDialogIntro.textContent = intro;
    this.ui.helpTopicList.innerHTML = bullets.map(item => `<li>${this.escapeHtml(item)}</li>`).join("");
    this.renderHelpReference("context");
    this.openAccessibleDialog(this.ui.helpDialog);
  }

  openGuide(id) {
    const item = this.activityKind === "lesson"
      ? this.getLessonDefinition(id)
      : this.activityKind === "assessment"
        ? ASSESSMENT_METADATA
        : this.activityKind === "realWorld"
          ? getRealWorldMode(id)
          : this.activityKind === "accuracyClinic"
            ? getAccuracyClinicProtocol(id)
          : this.activityKind === "tenKey"
            ? getTenKeyProtocol(id)
          : this.activityKind === "punctuation"
            ? getPunctuationBusinessProtocol(id)
          : this.activityKind === "certification"
            ? this.activeMode
          : MODE_METADATA.find(entry => entry.id === id);
    if (!item) return;
    this.ui.guideTitle.textContent = item.title;
    this.ui.guideBody.innerHTML = `
      <p>${item.subtitle}</p>
      <ul class="guide-list">${item.guide.map(line => `<li>${line}</li>`).join("")}</ul>
      ${this.activityKind === "lesson"
        ? `<p><strong>Training target:</strong> ${item.targetWpm} WPM at ${item.targetAccuracy}% accuracy. Completing the lesson is always allowed even if the target is missed.</p>`
        : this.activityKind === "assessment"
          ? `<p><strong>Placement note:</strong> this diagnostic recommends a starting point but never locks or skips modules automatically.</p>`
          : this.activityKind === "realWorld"
            ? `<p><strong>Applied standard:</strong> the Real-World Lab uses this profile's current difficulty to scale the WPM/accuracy target. Missing the target never blocks another module.</p>`
          : this.activityKind === "accuracyClinic"
            ? `<p><strong>Precision note:</strong> Accuracy Clinic gates are strict training objectives, not lockouts. Complete the protocol even when a gate is missed, review the error pattern, and remediate deliberately.</p>`
          : this.activityKind === "tenKey"
            ? `<p><strong>Numeric proficiency note:</strong> KPH and Numpad-use targets are local training metrics, not employment certification. Top-row digits remain available when a separate keypad is unavailable.</p>`
          : this.activityKind === "punctuation"
            ? `<p><strong>Business-writing note:</strong> punctuation gates are local practice standards only. The lab emphasizes exact entry and symbol fluency without treating its scores as certification.</p>`
          : this.activityKind === "certification"
            ? `<p><strong>Timed-test note:</strong> passing means the selected HyperSoft training standard was met for the full scheduled duration. Results are local training documentation and are not a third-party or employment credential.</p>`
          : `<p><strong>Guided Link:</strong> use these notes as the quick-reference rules for the selected typing game.</p>`}
    `;
    this.openAccessibleDialog(this.ui.guideDialog);
  }

  renderHUD({ wpm, accuracy, timerMs, score }) {
    const isTenKey = this.activityKind === "tenKey";
    const isCertification = this.activityKind === "certification";
    const speedLabel = this.ui.hudWpm?.parentElement?.querySelector("span");
    if (speedLabel) speedLabel.textContent = isTenKey ? "KPH" : isCertification ? "Adj WPM" : "WPM";
    this.ui.hudWpm.textContent = isTenKey
      ? (Number(this.activeGame?.getKph?.()) || 0).toLocaleString()
      : isCertification
        ? String(Math.round((Number(this.activeGame?.getAdjustedWpm?.()) || 0) * 10) / 10)
      : String(wpm);
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
      : this.activityKind === "assessment"
        ? this.getBlakeAssessmentResultComment(result)
        : this.activityKind === "realWorld"
          ? this.getBlakeRealWorldResultComment(result)
          : this.activityKind === "accuracyClinic"
            ? this.getBlakeAccuracyClinicResultComment(result)
          : this.activityKind === "tenKey"
            ? this.getBlakeTenKeyResultComment(result)
          : this.activityKind === "punctuation"
            ? this.getBlakePunctuationResultComment(result)
          : this.activityKind === "certification"
            ? this.getBlakeCertificationResultComment(result)
          : tournamentSummary
            ? this.getBlakeTournamentResultComment(result)
            : this.getBlakeGameResultComment(result);
    this.ui.resultComplianceMessage.textContent = this.activityKind === "assessment"
      ? "Placement recommendations are local training guidance, not employment testing or a professional certification. You can use any HyperSoft module regardless of the recommendation."
      : this.activityKind === "realWorld"
        ? "Real-World Typing Lab records are fictional local training simulations. They are not a work product, certification, personnel evaluation, or authorization to enter real confidential data."
      : this.activityKind === "accuracyClinic"
        ? "Accuracy Clinic gates are local training targets only. They are not employment standards, certification thresholds, or evidence that a learner should be restricted from any HyperSoft module."
      : this.activityKind === "tenKey"
        ? "10-Key KPH, accuracy, and keypad-use results are local training metrics only. They are not an employment test, certification, or statement that a particular keyboard layout is required."
      : this.activityKind === "punctuation"
        ? "Punctuation & Business Writing Lab results are local practice metrics using fictional text. They are not an employment test, certification, or writing-quality evaluation."
      : this.activityKind === "certification"
        ? "Timed Certification Tests are HyperSoft local training measurements. Their result sheets are not third-party credentials, employment tests, or proof of qualification for a job requirement."
      : tournamentSummary
        ? "Tournament medals and Cup Points are local training-game metrics. They do not represent certification, job classification, or authority to override ordinary workplace controls."
        : this.getComplianceResultComment(result);

    const stats = [
      [tournamentSummary ? "Cup Points" : "Score", result.score],
      [this.activityKind === "tenKey" ? "KPH" : "WPM", this.activityKind === "tenKey" ? (Number(result.tenKeyKph)||0).toLocaleString() : result.wpm],
      ["Accuracy", `${result.accuracy}%`],
      ["Time", this.formatTime(result.durationMs)]
    ];
    if (tournamentRound && result.cupPoints != null) stats.push(["Cup Points", result.cupPoints]);
    if (randomChallenge) stats.push(["Challenge", "Randomized"]);
    if (result.wordsCompleted != null) stats.push(["Tokens", result.wordsCompleted]);
    if (result.targetStatus) stats.push(["Target", result.targetStatus]);
    if (result.weakKeys) stats.push(["Practice next", result.weakKeys, "keyMetrics"]);
    if (result.variant) stats.push(["Variant", result.variant]);
    if (result.lessonComparison?.newBestWpm) stats.push(["Record", "Best WPM"]);
    if (Array.isArray(result.extraStats)) {
      result.extraStats.forEach(row => {
        if (Array.isArray(row) && row.length >= 2) stats.push([row[0], row[1]]);
      });
    }

    this.ui.resultStats.innerHTML = stats.map(([label, value, format]) => `
      <div class="result-stat"><span>${this.escapeHtml(String(label))}</span>${format === "keyMetrics" ? `<div class="result-stat-metric-list">${this.renderKeyAccuracyString(value)}</div>` : `<strong>${this.escapeHtml(String(value))}</strong>`}</div>
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
    const replayLabels = {
      lesson: "Repeat Lesson",
      assessment: "Retake Assessment",
      realWorld: "Repeat Lab",
      accuracyClinic: "Repeat Protocol",
      tenKey: "Repeat 10-Key Drill",
      punctuation: "Repeat Writing Drill",
      certification: "Retake Timed Test"
    };
    const returnLabels = {
      lesson: "Lessons",
      assessment: "Assessment",
      realWorld: "Real-World Lab",
      accuracyClinic: "Accuracy Clinic",
      tenKey: "10-Key Academy",
      punctuation: "Punctuation Lab",
      certification: "Timed Tests"
    };
    if (tournamentRound) replayButton.textContent = "Continue Tournament";
    else if (tournamentSummary) replayButton.textContent = "New Tournament";
    else if (randomChallenge) replayButton.textContent = "New Random Challenge";
    else replayButton.textContent = replayLabels[this.activityKind] || "Play Again";
    this.ui.resultHomeButton.textContent = this.dailyPlanReturnPending ? "Return to Daily Plan" : (returnLabels[this.activityKind] || "Arcade");
    const reportsButton = document.getElementById("resultReportsButton");
    if (reportsButton) reportsButton.hidden = Boolean(tournamentRound);
    if (!this.ui.resultDialog.open) this.openAccessibleDialog(this.ui.resultDialog);
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
      activityType: this.activeMode?.isCustomPractice ? "customPractice" : this.activeMode?.isSmartPractice ? "practice" : this.activityKind,
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
      rhythmScore: result.rhythmScore ?? null,
      medianIntervalMs: result.medianIntervalMs ?? null,
      hesitations: result.hesitations ?? null,
      backspaces: result.backspaces ?? null,
      assessmentWeakPairs: result.assessmentWeakPairs ?? null,
      assessmentWeakKeyMetrics: Array.isArray(result.assessmentWeakKeyMetrics) ? this.cloneData(result.assessmentWeakKeyMetrics) : null,
      assessmentPhaseStats: Array.isArray(result.assessmentPhaseStats) ? this.cloneData(result.assessmentPhaseStats) : null,
      realWorldTasks: Array.isArray(result.realWorldTasks) ? this.cloneData(result.realWorldTasks) : null,
      realWorldErrors: result.realWorldErrors ?? null,
      realWorldBackspaces: result.realWorldBackspaces ?? null,
      accuracyClinicProtocol: result.accuracyClinicProtocol ?? null,
      accuracyClinicMistakes: Array.isArray(result.accuracyClinicMistakes) ? this.cloneData(result.accuracyClinicMistakes) : null,
      accuracyClinicBestStreak: result.accuracyClinicBestStreak ?? null,
      accuracyClinicPaceAlerts: result.accuracyClinicPaceAlerts ?? null,
      accuracyClinicErrors: result.accuracyClinicErrors ?? null,
      accuracyClinicRounds: Array.isArray(result.accuracyClinicRounds) ? this.cloneData(result.accuracyClinicRounds) : null,
      accuracyClinicGate: result.accuracyClinicGate ?? null,
      tenKeyKph: result.tenKeyKph ?? null,
      tenKeyNumpadRate: result.tenKeyNumpadRate ?? null,
      tenKeyKeyStats: result.tenKeyKeyStats && typeof result.tenKeyKeyStats === "object" ? this.cloneData(result.tenKeyKeyStats) : null,
      tenKeyBackspaces: result.tenKeyBackspaces ?? null,
      tenKeyErrors: result.tenKeyErrors ?? null,
      punctuationProtocol: result.punctuationProtocol ?? null,
      punctuationSymbolAccuracy: result.punctuationSymbolAccuracy ?? null,
      punctuationErrors: result.punctuationErrors ?? null,
      punctuationBackspaces: result.punctuationBackspaces ?? null,
      punctuationFamilyStats: result.punctuationFamilyStats && typeof result.punctuationFamilyStats === "object" ? this.cloneData(result.punctuationFamilyStats) : null,
      punctuationSubstitutions: Array.isArray(result.punctuationSubstitutions) ? this.cloneData(result.punctuationSubstitutions) : null,
      punctuationRounds: Array.isArray(result.punctuationRounds) ? this.cloneData(result.punctuationRounds) : null,
      certificationDurationSeconds: result.certificationDurationSeconds ?? null,
      certificationGrossWpm: result.certificationGrossWpm ?? null,
      certificationAdjustedWpm: result.certificationAdjustedWpm ?? null,
      certificationRawErrors: result.certificationRawErrors ?? null,
      certificationBackspaces: result.certificationBackspaces ?? null,
      certificationCharacters: result.certificationCharacters ?? null,
      certificationAttempts: result.certificationAttempts ?? null,
      certificationStandardId: result.certificationStandardId ?? null,
      certificationStandardLabel: result.certificationStandardLabel ?? null,
      certificationTargetWpm: result.certificationTargetWpm ?? null,
      certificationTargetAccuracy: result.certificationTargetAccuracy ?? null,
      certificationContentId: result.certificationContentId ?? null,
      certificationContentLabel: result.certificationContentLabel ?? null,
      placementLabel: result.placementLabel ?? null,
      placementDestination: result.placementDestination ?? null,
      placementDetail: result.placementDetail ?? null,
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
    return this.normalizeAchievements(profile?.data?.achievements, profile?.updatedAt || Date.now());
  }

  getAchievementMetrics() {
    const rows = this.scores ?? [];
    const lessonRows = rows.filter(row => row.activityType === "lesson");
    const gameRows = this.getArcadeGameRows();
    const tournamentRows = this.getTournamentRows();
    const sessionRows = rows.filter(row => ["lesson", "practice", "customPractice", "realWorld", "accuracyClinic", "punctuation", "certification"].includes(row.activityType) || this.isArcadeGameRow(row));
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
    const sessionRows = rows.filter(row => ["lesson", "practice", "customPractice", "realWorld", "accuracyClinic", "punctuation", "certification"].includes(row.activityType) || this.isArcadeGameRow(row));
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
            <th>Type</th><th>Activity</th><th>Difficulty</th><th>Score</th><th>Speed</th><th>Accuracy</th><th>Completed (Pacific)</th>
          </tr></thead>
          <tbody>${top.map(row => `
            <tr>
              <td>${row.activityType === "tournament"
                ? `<span class="score-type tournament">Tournament</span>`
                : row.activityType === "lesson"
                  ? `<span class="score-type lesson">Lesson</span>`
                  : row.activityType === "practice"
                    ? `<span class="score-type practice">Practice</span>`
                    : row.activityType === "customPractice"
                      ? `<span class="score-type practice">Custom Practice</span>`
                    : row.activityType === "realWorld"
                      ? `<span class="score-type practice">Real-World Lab</span>`
                    : row.activityType === "accuracyClinic"
                      ? `<span class="score-type lesson">Accuracy Clinic</span>`
                    : row.activityType === "tenKey"
                      ? `<span class="score-type practice">10-Key Academy</span>`
                    : row.activityType === "punctuation"
                      ? `<span class="score-type practice">Punctuation Lab</span>`
                    : row.activityType === "certification"
                      ? `<span class="score-type assessment">Timed Test</span>`
                    : row.activityType === "assessment"
                      ? `<span class="score-type assessment">Assessment</span>`
                      : `<span class="score-type game">Game</span>`}</td>
              <td>${this.escapeHtml(row.modeTitle ?? "Activity")}${row.activityType === "tournament" && row.tournamentMedal
                ? `<small class="score-subline">${this.escapeHtml(row.tournamentMedal)} · ${this.escapeHtml(({ quick: "Quick Cup", standard: "Standard Cup", grand: "Grand Tour" }[row.tournamentFormat] || row.tournamentFormat || "Cup"))}</small>`
                : row.challengeType === "random"
                  ? `<small class="score-subline">Blake's Random Challenge</small>`
                  : row.tournamentId && row.tournamentRound
                    ? `<small class="score-subline">Tournament round ${row.tournamentRound}</small>`
                    : row.activityType === "customPractice" && row.variant
                      ? `<small class="score-subline">${this.escapeHtml(row.variant)}</small>`
                    : row.activityType === "certification"
                      ? `<small class="score-subline">Gross ${row.certificationGrossWpm ?? "—"} WPM · ${row.certificationRawErrors ?? 0} raw errors</small>`
                    : ""}</td>
              <td>${DIFFICULTY_CONFIG[row.difficulty]?.label ?? row.difficulty}</td>
              <td><strong>${row.score}</strong></td>
              <td>${row.activityType === "tenKey" ? `${(Number(row.tenKeyKph)||0).toLocaleString()} KPH` : `${row.wpm} WPM`}</td>
              <td>${row.accuracy}%</td>
              <td>${this.formatPacificTimestamp(row.timestamp)}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>`;
  }

  renderProgress() {
    if (!this.ui.progressContent) return;
    const allRows = [...this.scores]
      .filter(row => row.activityType !== "tournament" && Number.isFinite(Number(row.timestamp)))
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    const tenKeyRows = allRows.filter(row => row.activityType === "tenKey");
    const rows = allRows.filter(row => row.activityType !== "tenKey");
    const lessonRows = rows.filter(row => row.activityType === "lesson");
    const practiceRows = rows.filter(row => ["practice", "customPractice"].includes(row.activityType));
    const realWorldRows = rows.filter(row => row.activityType === "realWorld");
    const accuracyRows = rows.filter(row => row.activityType === "accuracyClinic");
    const punctuationRows = rows.filter(row => row.activityType === "punctuation");
    const certificationRows = rows.filter(row => row.activityType === "certification");
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
      ? this.renderKeyAccuracyItems(strong, { chipClass: "weak-key-chip" })
      : `<span class="adaptive-profile-note">More lesson data needed.</span>`;

    const lessonAverageWpm = this.averageField(lessonRows, "wpm");
    const practiceAverageWpm = this.averageField(practiceRows, "wpm");
    const realWorldAverageWpm = this.averageField(realWorldRows, "wpm");
    const accuracyAverageWpm = this.averageField(accuracyRows, "wpm");
    const punctuationAverageWpm = this.averageField(punctuationRows, "wpm");
    const certificationAverageWpm = this.averageField(certificationRows, "wpm");
    const gameAverageWpm = this.averageField(gameRows, "wpm");
    const lessonAverageAccuracy = this.averageField(lessonRows, "accuracy");
    const practiceAverageAccuracy = this.averageField(practiceRows, "accuracy");
    const realWorldAverageAccuracy = this.averageField(realWorldRows, "accuracy");
    const accuracyAverageAccuracy = this.averageField(accuracyRows, "accuracy");
    const punctuationAverageAccuracy = this.averageField(punctuationRows, "accuracy");
    const certificationAverageAccuracy = this.averageField(certificationRows, "accuracy");
    const gameAverageAccuracy = this.averageField(gameRows, "accuracy");
    const lessonTime = lessonRows.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0);
    const practiceTime = practiceRows.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0);
    const realWorldTime = realWorldRows.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0);
    const accuracyTime = accuracyRows.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0);
    const punctuationTime = punctuationRows.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0);
    const certificationTime = certificationRows.reduce((sum, row) => sum + (Number(row.durationMs) || 0), 0);
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
        <div class="progress-stat-card"><span>Applied Labs</span><strong>${realWorldRows.length}</strong><small>${new Set(realWorldRows.map(row => row.modeId)).size}/${REAL_WORLD_MODES.length} categories tried</small></div>
        <div class="progress-stat-card"><span>Accuracy Clinic</span><strong>${accuracyRows.length}</strong><small>${accuracyRows.filter(row=>row.targetStatus === "Met").length} precision gates cleared</small></div>
        <div class="progress-stat-card"><span>Punctuation Lab</span><strong>${punctuationRows.length}</strong><small>${punctuationRows.filter(row=>row.targetStatus === "Met").length} business-writing targets met</small></div>
        <div class="progress-stat-card"><span>Timed Tests</span><strong>${certificationRows.length}</strong><small>${certificationRows.filter(row=>row.targetStatus === "Passed").length} standards passed</small></div>
        <div class="progress-stat-card"><span>10-Key Academy</span><strong>${tenKeyRows.length}</strong><small>${tenKeyRows.length ? `Best ${Math.max(...tenKeyRows.map(row=>Number(row.tenKeyKph)||0)).toLocaleString()} KPH` : "No numeric record yet"}</small></div>
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
          <div class="mastery-line"><h3>Training Activity Mix</h3><span>Recorded activity comparison</span></div>
          <div class="activity-compare-grid">
            ${this.renderActivityComparison("Lessons", lessonRows.length, lessonAverageWpm, lessonAverageAccuracy, lessonTime)}
            ${this.renderActivityComparison("Targeted Practice", practiceRows.length, practiceAverageWpm, practiceAverageAccuracy, practiceTime)}
            ${this.renderActivityComparison("Real-World Lab", realWorldRows.length, realWorldAverageWpm, realWorldAverageAccuracy, realWorldTime)}
            ${this.renderActivityComparison("Accuracy Clinic", accuracyRows.length, accuracyAverageWpm, accuracyAverageAccuracy, accuracyTime)}
            ${this.renderActivityComparison("Punctuation Lab", punctuationRows.length, punctuationAverageWpm, punctuationAverageAccuracy, punctuationTime)}
            ${this.renderActivityComparison("Timed Tests", certificationRows.length, certificationAverageWpm, certificationAverageAccuracy, certificationTime)}
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
        ${recent.length ? `<div style="overflow-x:auto"><table class="recent-progress-table"><thead><tr><th>Activity</th><th>Type</th><th>Difficulty</th><th>WPM</th><th>Accuracy</th><th>Completed (Pacific)</th></tr></thead><tbody>${recent.map(row => `<tr><td>${this.escapeHtml(row.modeTitle ?? "Activity")}</td><td>${row.activityType === "lesson" ? "Lesson" : row.activityType === "practice" ? "Practice" : row.activityType === "customPractice" ? "Custom Practice" : row.activityType === "realWorld" ? "Real-World Lab" : row.activityType === "accuracyClinic" ? "Accuracy Clinic" : row.activityType === "tenKey" ? "10-Key Academy" : row.activityType === "punctuation" ? "Punctuation Lab" : row.activityType === "certification" ? "Timed Test" : row.activityType === "assessment" ? "Assessment" : "Game"}</td><td>${this.escapeHtml(DIFFICULTY_CONFIG[row.difficulty]?.label ?? row.difficulty ?? "—")}</td><td>${row.wpm ?? "—"}</td><td>${row.accuracy ?? "—"}%</td><td>${this.formatPacificTimestamp(row.timestamp)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No recorded activity yet.</div>`}
      </div>
    `;

    this.ui.progressContent.querySelectorAll("[data-progress-lesson]").forEach(button => {
      button.addEventListener("click", () => this.startLesson(button.dataset.progressLesson));
    });
  }


  getReportSnapshot() {
    const profile = this.getActiveProfile();
    const allRows = [...(this.scores ?? [])]
      .filter(row => row.activityType !== "tournament" && Number.isFinite(Number(row.timestamp)))
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    const tenKeyRows = allRows.filter(row => row.activityType === "tenKey");
    const rows = allRows.filter(row => row.activityType !== "tenKey");
    const lessonRows = rows.filter(row => row.activityType === "lesson");
    const practiceRows = rows.filter(row => ["practice", "customPractice"].includes(row.activityType));
    const realWorldRows = rows.filter(row => row.activityType === "realWorld");
    const accuracyRows = rows.filter(row => row.activityType === "accuracyClinic");
    const punctuationRows = rows.filter(row => row.activityType === "punctuation");
    const certificationRows = rows.filter(row => row.activityType === "certification");
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
      realWorldRows,
      accuracyRows,
      punctuationRows,
      certificationRows,
      tenKeyRows,
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
    const certificationOptions = stats.certificationRows.length
      ? [...stats.certificationRows].reverse().slice(0,20).map(row => `<option value="${row.timestamp}">${this.escapeHtml(row.modeTitle || "Timed Test")} — ${row.certificationAdjustedWpm ?? row.wpm ?? "—"} adj WPM / ${row.accuracy ?? "—"}% — ${this.formatPacificTimestamp(row.timestamp)}</option>`).join("")
      : `<option value="">No timed test results yet</option>`;

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
        <article class="document-card ${stats.certificationRows.length ? "" : "locked"}">
          <div class="document-icon">T</div><h4>Timed Test Result Sheet</h4>
          <p>Print an individual 1-, 3-, 5-, or 10-minute result with Gross WPM, Adjusted WPM, raw errors, accuracy, test material, and the selected HyperSoft standard.</p>
          <select id="certificationResultSelect" ${stats.certificationRows.length ? "" : "disabled"}>${certificationOptions}</select>
          <div class="document-status">${stats.certificationRows.length ? `${stats.certificationRows.length} timed ${stats.certificationRows.length === 1 ? "result" : "results"} available` : "Locked • Complete a Timed Test"}</div>
          <button class="${stats.certificationRows.length ? "primary" : "secondary"}" id="certificationResultButton" type="button" ${stats.certificationRows.length ? "" : "disabled"}>Preview Test Result</button>
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
    const certificationButton = this.ui.reportsContent.querySelector("#certificationResultButton");
    certificationButton?.addEventListener("click", () => {
      const select = this.ui.reportsContent.querySelector("#certificationResultSelect");
      if (select?.value) this.openReportPreview("certificationResult", select.value);
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
    else if (type === "certificationResult") { html = this.buildCertificationResultSheet(stats, lessonId); label = "Timed Test Result Sheet"; }
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
    const source = `${profile?.id ?? "guest"}|${type}|v${APP_VERSION}`;
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
        <div class="certificate-footer-block"><strong>HyperSoft Typing Division</strong><br />Deluxe Training Suite v${APP_VERSION}</div>
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

  buildCertificationResultSheet(stats, timestampValue) {
    const timestamp=Number(timestampValue);
    const row=stats.certificationRows.find(item=>Number(item.timestamp)===timestamp) ?? stats.certificationRows.at(-1);
    if (!row) return "";
    const profileName=stats.profile?.name ?? "Player";
    const durationSeconds=Number(row.certificationDurationSeconds)||Math.round((Number(row.durationMs)||0)/1000);
    const durationLabel=durationSeconds>=60?`${Math.round(durationSeconds/60)}-Minute Test`:`${durationSeconds}-Second Test`;
    const gross=Number(row.certificationGrossWpm)||0;
    const adjusted=Number(row.certificationAdjustedWpm)||Number(row.wpm)||0;
    const accuracy=Number(row.accuracy)||0;
    const errors=Number(row.certificationRawErrors)||0;
    const corrections=Number(row.certificationBackspaces)||0;
    const chars=Number(row.certificationCharacters)||0;
    const standardWpm=Number(row.certificationTargetWpm)||0;
    const standardAccuracy=Number(row.certificationTargetAccuracy)||0;
    const passed=row.targetStatus==="Passed";
    return `<div class="report-document cert-result-sheet">
      ${this.getReportHeader("Timed Typing Test Result", `${durationLabel} • HyperSoft local training measurement`, stats)}
      <div class="report-pass-banner">${passed ? "TRAINING STANDARD PASSED" : "TEST COMPLETED — STANDARD NOT MET"}</div>
      <p>This sheet records one timed HyperSoft passage-typing test completed by <strong>${this.escapeHtml(profileName)}</strong>. It is intended for personal training records and repeatable practice comparison.</p>
      <div class="report-cert-metrics">
        <div><span>Gross WPM</span><strong>${gross}</strong></div>
        <div><span>Adjusted WPM</span><strong>${adjusted}</strong></div>
        <div><span>Accuracy</span><strong>${accuracy}%</strong></div>
        <div><span>Raw Errors</span><strong>${errors}</strong></div>
      </div>
      <table class="report-doc-table"><tbody>
        <tr><th>Test Duration</th><td>${this.escapeHtml(durationLabel)}</td><th>Completed</th><td>${this.escapeHtml(this.formatPacificTimestamp(row.timestamp))}</td></tr>
        <tr><th>Passage Family</th><td>${this.escapeHtml(row.certificationContentLabel || "General Prose")}</td><th>Training Standard</th><td>${this.escapeHtml(row.certificationStandardLabel || "HyperSoft Training")}</td></tr>
        <tr><th>Standard Requirement</th><td>${standardWpm} adjusted WPM / ${standardAccuracy}% accuracy</td><th>Result</th><td>${this.escapeHtml(row.targetStatus || "Completed")}</td></tr>
        <tr><th>Characters Entered</th><td>${chars}</td><th>Correction Attempts</th><td>${corrections}</td></tr>
      </tbody></table>
      <h2>Scoring Method</h2>
      <p><strong>Gross WPM</strong> is calculated from physical character attempts using the conventional five-character word. <strong>Adjusted WPM</strong> subtracts raw errors per minute from Gross WPM. Accuracy reflects correct first attempts across scored typing attempts.</p>
      <div class="report-doc-callout"><strong>Training-document disclaimer</strong>This HyperSoft result is generated locally from the learner profile. It is not a third-party typing certificate, employment examination, proctored credential, or guarantee that an external organization will accept the result.</div>
      <div class="certificate-footer">
        <div class="certificate-footer-block"><strong>${this.escapeHtml(this.formatPacificDateLong(row.timestamp))}</strong><br />Test date • Pacific Time</div>
        <div class="certificate-footer-block"><div class="blake-signature">Blake Breacher</div><strong>Blake Breacher</strong><br />Lead Typing Champion</div>
        <div class="certificate-footer-block"><strong>HyperSoft Timed Testing Center</strong><br />Training record v${APP_VERSION}</div>
      </div>
      ${this.getReportFooter()}
    </div>`;
  }

  getReportFooter() {
    return `<div class="report-doc-footer"><span>Blake Breacher Teaches Typing v${APP_VERSION}</span><span>Generated locally • Pacific Time • HyperSoft Learning Suite</span></div>`;
  }

  buildAssessmentReport(stats) {
    if (!stats.rows.length) return "";
    const comp = stats.recentComparison;
    const weakHtml = stats.weakKeys.length ? this.renderKeyAccuracyItems(stats.weakKeys, { chipClass: "report-key-chip" }) : "No persistent weak keys established.";
    const strongHtml = stats.strongKeys.length ? this.renderKeyAccuracyItems(stats.strongKeys, { chipClass: "report-key-chip" }) : "More lesson data needed.";
    const pairHtml = stats.weakPairs.length ? this.renderPairAccuracyItems(stats.weakPairs, { chipClass: "report-key-chip" }) : "No persistent key-pair problems established.";
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
      ${this.getLatestAssessment() ? `<div class="report-doc-callout"><strong>Latest Placement Diagnostic</strong>${this.escapeHtml(this.getLatestAssessment().placementLabel || "Placement available")} — ${Math.round(Number(this.getLatestAssessment().wpm) || 0)} WPM · ${Math.round(Number(this.getLatestAssessment().accuracy) || 0)}% accuracy · ${Math.round(Number(this.getLatestAssessment().rhythmScore) || 0)}% rhythm. ${this.escapeHtml(this.getLatestAssessment().placementDetail || "")}</div>` : ""}
      ${(() => { const coach = this.getTechniqueAnalysis(); return `<div class="report-doc-callout"><strong>Technique Coach</strong>${this.escapeHtml(coach.level)} · ${coach.aggregate || "—"}/100 · ${this.escapeHtml(coach.confidence)} confidence. ${this.escapeHtml(coach.summary)}</div>`; })()}
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
    const recentTable = recent.map(row => `<tr><td>${this.escapeHtml(row.modeTitle ?? "Activity")}</td><td>${row.activityType === "lesson" ? "Lesson" : row.activityType === "practice" ? "Practice" : row.activityType === "customPractice" ? "Custom Practice" : row.activityType === "realWorld" ? "Real-World Lab" : row.activityType === "accuracyClinic" ? "Accuracy Clinic" : row.activityType === "tenKey" ? "10-Key Academy" : row.activityType === "punctuation" ? "Punctuation Lab" : row.activityType === "certification" ? "Timed Test" : row.activityType === "assessment" ? "Assessment" : "Game"}</td><td>${this.escapeHtml(DIFFICULTY_CONFIG[row.difficulty]?.label ?? row.difficulty ?? "—")}</td><td>${row.wpm ?? "—"}</td><td>${row.accuracy ?? "—"}%</td><td>${this.formatPacificTimestamp(row.timestamp)}</td></tr>`).join("");
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
    return this.normalizeKeyHistory(this.getActiveProfile()?.data?.keyHistory);
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
      data: data ? this.cloneData(data) : { settings: { ...DEFAULT_SETTINGS }, scores: [], keyStats: {}, keyHistory: [], pairStats: {}, achievements: {}, traineeProgress: {}, customPracticePresets: [], customPracticeLastConfig: { ...CUSTOM_PRACTICE_DEFAULTS }, dailyPlanState: null, dailyPlanHistory: [], theoryProgress: {}, onboardingState: { ...ONBOARDING_DEFAULTS }, navigationState: { ...NAVIGATION_DEFAULTS } }
    };
  }

  normalizeSettings(settings) {
    const raw = settings && typeof settings === "object" && !Array.isArray(settings) ? settings : {};
    const allowed = {
      difficulty: new Set(["novice", "easy", "normal", "challenging", "hard", "expert"]),
      wordList: new Set(["general", "office", "technical"]),
      theme: new Set(["classic", "teal98", "officeBeige", "midnight", "plumDeluxe", "hyper98"]),
      hyper98Palette: new Set(["blue", "teal", "beige", "midnight", "plum"]),
      soundVolume: new Set(["low", "normal", "high"]),
      motionPreference: new Set(["system", "reduced"]),
      multimedia: new Set(["quiet", "standard", "full"])
    };
    return {
      difficulty: allowed.difficulty.has(raw.difficulty) ? raw.difficulty : DEFAULT_SETTINGS.difficulty,
      wordList: allowed.wordList.has(raw.wordList) ? raw.wordList : DEFAULT_SETTINGS.wordList,
      theme: allowed.theme.has(raw.theme) ? raw.theme : DEFAULT_SETTINGS.theme,
      hyper98Palette: allowed.hyper98Palette.has(raw.hyper98Palette) ? raw.hyper98Palette : DEFAULT_SETTINGS.hyper98Palette,
      sound: typeof raw.sound === "boolean" ? raw.sound : DEFAULT_SETTINGS.sound,
      soundVolume: allowed.soundVolume.has(raw.soundVolume) ? raw.soundVolume : DEFAULT_SETTINGS.soundVolume,
      multimedia: allowed.multimedia.has(raw.multimedia) ? raw.multimedia : DEFAULT_SETTINGS.multimedia,
      backupReminder: typeof raw.backupReminder === "boolean" ? raw.backupReminder : DEFAULT_SETTINGS.backupReminder,
      startup: typeof raw.startup === "boolean" ? raw.startup : DEFAULT_SETTINGS.startup,
      lessonKeyboardCoach: typeof raw.lessonKeyboardCoach === "boolean" ? raw.lessonKeyboardCoach : DEFAULT_SETTINGS.lessonKeyboardCoach,
      motionPreference: allowed.motionPreference.has(raw.motionPreference) ? raw.motionPreference : DEFAULT_SETTINGS.motionPreference
    };
  }

  normalizeStatMap(value, pairMode = false) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const clean = {};
    Object.entries(value).forEach(([rawKey, rawStats]) => {
      const key = String(rawKey ?? "");
      if (!key || key.length > 12 || (pairMode && !/^[a-z]{2}$/i.test(key))) return;
      if (!rawStats || typeof rawStats !== "object" || Array.isArray(rawStats)) return;
      const attempts = Math.max(0, Math.floor(Number(rawStats.attempts) || 0));
      const correct = Math.max(0, Math.min(attempts, Math.floor(Number(rawStats.correct) || 0)));
      const errors = Math.max(0, Math.floor(Number(rawStats.errors) || Math.max(0, attempts - correct)));
      if (!attempts && !correct && !errors) return;
      clean[pairMode ? key.toLowerCase() : key] = { attempts, correct, errors };
    });
    return clean;
  }

  normalizeScoreRow(row) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    const clean = { ...row };
    const numeric = ["timestamp", "wpm", "accuracy", "score", "durationMs", "wordsCompleted", "cupPoints",
       "tournamentRound", "tournamentTotal", "errors", "mistakes", "rhythmScore", "medianIntervalMs", "hesitations", "backspaces", "realWorldErrors", "realWorldBackspaces", "accuracyClinicBestStreak", "accuracyClinicPaceAlerts", "accuracyClinicErrors", "accuracyClinicGate", "tenKeyKph", "tenKeyNumpadRate", "tenKeyBackspaces", "tenKeyErrors", "punctuationSymbolAccuracy", "punctuationErrors", "punctuationBackspaces", "certificationDurationSeconds", "certificationGrossWpm", "certificationAdjustedWpm", "certificationRawErrors", "certificationBackspaces", "certificationCharacters", "certificationAttempts", "certificationTargetWpm", "certificationTargetAccuracy"];
    numeric.forEach(field => {
      if (!(field in clean)) return;
      const value = Number(clean[field]);
      clean[field] = Number.isFinite(value) ? value : 0;
    });
    if ("accuracy" in clean) clean.accuracy = Math.max(0, Math.min(100, clean.accuracy));
    if ("wpm" in clean) clean.wpm = Math.max(0, clean.wpm);
    if ("durationMs" in clean) clean.durationMs = Math.max(0, clean.durationMs);
    if ("timestamp" in clean && clean.timestamp < 0) clean.timestamp = 0;
    ["activityType", "modeId", "modeTitle", "difficulty", "challengeType", "tournamentFormat", "tournamentMedal",  "placementLabel", "placementDestination", "placementDetail", "assessmentWeakPairs", "variant", "accuracyClinicProtocol", "punctuationProtocol", "certificationStandardId", "certificationStandardLabel", "certificationContentId", "certificationContentLabel"]
      .forEach(field => {
        if (field in clean && clean[field] != null) clean[field] = String(clean[field]).slice(0, 120);
      });
    if (Array.isArray(clean.assessmentWeakKeyMetrics)) clean.assessmentWeakKeyMetrics = clean.assessmentWeakKeyMetrics.slice(0, 8).map(item => ({
      key: String(item?.key ?? "").slice(0, 24),
      accuracy: Math.max(0, Math.min(100, Number(item?.accuracy) || 0))
    })).filter(item => item.key);
    else if ("assessmentWeakKeyMetrics" in clean) clean.assessmentWeakKeyMetrics = null;
    if (Array.isArray(clean.realWorldTasks)) clean.realWorldTasks = clean.realWorldTasks.slice(0, 12).map(item => ({
      title: String(item?.title || "Record").slice(0, 80),
      chars: Math.max(0, Math.floor(Number(item?.chars) || 0)),
      durationMs: Math.max(0, Math.floor(Number(item?.durationMs) || 0)),
      errors: Math.max(0, Math.floor(Number(item?.errors) || 0)),
      grossWpm: Math.max(0, Number(item?.grossWpm) || 0)
    }));
    else if ("realWorldTasks" in clean) clean.realWorldTasks = null;
    if (Array.isArray(clean.accuracyClinicMistakes)) clean.accuracyClinicMistakes = clean.accuracyClinicMistakes.slice(0, 12).map(item => ({
      pattern:String(item?.pattern || "").slice(0,40), count:Math.max(0,Math.floor(Number(item?.count)||0))
    })).filter(item=>item.pattern && item.count);
    else if ("accuracyClinicMistakes" in clean) clean.accuracyClinicMistakes = null;
    if (Array.isArray(clean.accuracyClinicRounds)) clean.accuracyClinicRounds = clean.accuracyClinicRounds.slice(0, 8).map(item => ({
      round:Math.max(1,Math.floor(Number(item?.round)||1)), chars:Math.max(0,Math.floor(Number(item?.chars)||0)), errors:Math.max(0,Math.floor(Number(item?.errors)||0)), durationMs:Math.max(0,Math.floor(Number(item?.durationMs)||0)), grossWpm:Math.max(0,Number(item?.grossWpm)||0)
    }));
    else if ("accuracyClinicRounds" in clean) clean.accuracyClinicRounds = null;
    if (clean.tenKeyKeyStats && typeof clean.tenKeyKeyStats === "object" && !Array.isArray(clean.tenKeyKeyStats)) {
      clean.tenKeyKeyStats = Object.fromEntries(Object.entries(clean.tenKeyKeyStats).slice(0,20).map(([key,row])=>[String(key).slice(0,8),{
        attempts:Math.max(0,Math.floor(Number(row?.attempts)||0)),
        correct:Math.max(0,Math.floor(Number(row?.correct)||0)),
        errors:Math.max(0,Math.floor(Number(row?.errors)||0))
      }]));
    } else if ("tenKeyKeyStats" in clean) clean.tenKeyKeyStats = null;
    if (clean.punctuationFamilyStats && typeof clean.punctuationFamilyStats === "object" && !Array.isArray(clean.punctuationFamilyStats)) {
      clean.punctuationFamilyStats=Object.fromEntries(Object.entries(clean.punctuationFamilyStats).slice(0,12).map(([family,row])=>[String(family).slice(0,24),{attempts:Math.max(0,Math.floor(Number(row?.attempts)||0)),correct:Math.max(0,Math.floor(Number(row?.correct)||0)),errors:Math.max(0,Math.floor(Number(row?.errors)||0))}]));
    } else if ("punctuationFamilyStats" in clean) clean.punctuationFamilyStats=null;
    if (Array.isArray(clean.punctuationSubstitutions)) clean.punctuationSubstitutions=clean.punctuationSubstitutions.slice(0,12).map(item=>({pattern:String(item?.pattern||"").slice(0,60),count:Math.max(0,Math.floor(Number(item?.count)||0))})).filter(item=>item.pattern&&item.count);
    else if ("punctuationSubstitutions" in clean) clean.punctuationSubstitutions=null;
    if (Array.isArray(clean.punctuationRounds)) clean.punctuationRounds=clean.punctuationRounds.slice(0,8).map(item=>({round:Math.max(1,Math.floor(Number(item?.round)||1)),chars:Math.max(0,Math.floor(Number(item?.chars)||0)),durationMs:Math.max(0,Math.floor(Number(item?.durationMs)||0)),errors:Math.max(0,Math.floor(Number(item?.errors)||0)),grossWpm:Math.max(0,Number(item?.grossWpm)||0)}));
    else if ("punctuationRounds" in clean) clean.punctuationRounds=null;
    if ("success" in clean && typeof clean.success !== "boolean") delete clean.success;
    if (clean.placementDestination && !new Set(["trainee", "lessons", "smartPractice"]).has(clean.placementDestination)) clean.placementDestination = null;
    return clean;
  }

  normalizeKeyHistory(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(-500).map(item => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      return {
        timestamp: Number.isFinite(Number(item.timestamp)) ? Number(item.timestamp) : 0,
        keys: this.normalizeStatMap(item.keys)
      };
    }).filter(Boolean);
  }

  normalizeAchievements(value, fallbackTimestamp = Date.now()) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const validIds = new Set(ACHIEVEMENTS.map(item => item.id));
    const clean = {};
    Object.entries(value).forEach(([id, record]) => {
      if (!validIds.has(id) || !record) return;
      if (record === true) {
        clean[id] = { unlockedAt: fallbackTimestamp, version: "legacy" };
        return;
      }
      if (typeof record !== "object" || Array.isArray(record)) return;
      const unlockedAt = Number(record.unlockedAt);
      clean[id] = {
        unlockedAt: Number.isFinite(unlockedAt) && unlockedAt > 0 ? unlockedAt : fallbackTimestamp,
        version: String(record.version || "legacy").slice(0, 24)
      };
    });
    return clean;
  }

  normalizeProfile(profile) {
    const source = profile && typeof profile === "object" && !Array.isArray(profile) ? profile : {};
    const normalized = { ...source };
    normalized.id = typeof normalized.id === "string" && normalized.id.trim()
      ? normalized.id.trim().slice(0, 100)
      : `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    normalized.name = String(normalized.name || "Player").trim().slice(0, 28) || "Player";
    const allowedAvatars = new Set(["initials", "keyboard", "star", "briefcase", "diamond", "bolt", "guest"]);
    normalized.avatar = allowedAvatars.has(normalized.avatar) ? normalized.avatar : "initials";
    normalized.createdAt = Number.isFinite(Number(normalized.createdAt)) && Number(normalized.createdAt) > 0 ? Number(normalized.createdAt) : Date.now();
    normalized.updatedAt = Number.isFinite(Number(normalized.updatedAt)) && Number(normalized.updatedAt) > 0 ? Number(normalized.updatedAt) : normalized.createdAt;
    normalized.lastBackupAt = Number.isFinite(Number(normalized.lastBackupAt)) && Number(normalized.lastBackupAt) > 0 ? Number(normalized.lastBackupAt) : null;

    const data = normalized.data && typeof normalized.data === "object" && !Array.isArray(normalized.data) ? normalized.data : {};
    normalized.data = {
      settings: this.normalizeSettings(data.settings),
      scores: Array.isArray(data.scores) ? data.scores.slice(-50000).map(row => this.normalizeScoreRow(row)).filter(Boolean) : [],
      keyStats: this.normalizeStatMap(data.keyStats),
      keyHistory: this.normalizeKeyHistory(data.keyHistory),
      pairStats: this.normalizeStatMap(data.pairStats, true),
      achievements: this.normalizeAchievements(data.achievements, normalized.updatedAt),
      traineeProgress: data.traineeProgress && typeof data.traineeProgress === "object" && !Array.isArray(data.traineeProgress)
        ? Object.fromEntries(TRAINEE_MODULES.filter(item => data.traineeProgress[item.id] === true).map(item => [item.id, true]))
        : {},
      customPracticePresets: this.normalizeCustomPracticePresets(data.customPracticePresets),
      customPracticeLastConfig: normalizeCustomPracticeConfig(data.customPracticeLastConfig ?? CUSTOM_PRACTICE_DEFAULTS),
      dailyPlanState: normalizeDailyPlanState(data.dailyPlanState),
      dailyPlanHistory: Array.isArray(data.dailyPlanHistory) ? data.dailyPlanHistory.slice(-60).map(row=>({
        dateKey:String(row?.dateKey||"").slice(0,16),
        durationMinutes:DAILY_PLAN_DURATIONS.includes(Number(row?.durationMinutes))?Number(row.durationMinutes):20,
        completedAt:Math.max(0,Number(row?.completedAt)||0),
        stepCount:Math.max(1,Math.min(10,Math.floor(Number(row?.stepCount)||1)))
      })).filter(row=>row.dateKey&&row.completedAt) : [],
      theoryProgress: normalizeTheoryProgress(data.theoryProgress),
      onboardingState: normalizeOnboardingState(data.onboardingState),
      navigationState: normalizeNavigationState(data.navigationState)
    };
    return normalized;
  }

  safeStorageGet(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch (error) {
      this.storageVolatile = true;
      this.storageWarning ||= "Browser storage is unavailable. HyperSoft will keep this session running, but changes may not survive closing the page.";
      console.warn("HyperSoft storage read failed:", error);
      return null;
    }
  }

  safeStorageSet(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value);
      return true;
    } catch (error) {
      this.storageVolatile = true;
      this.storageWarning = "HyperSoft could not save to browser storage. Export a backup before closing this page.";
      console.warn("HyperSoft storage write failed:", error);
      this.setBackupStatus?.(this.storageWarning, "bad");
      return false;
    }
  }

  safeStorageRemove(key) {
    try {
      globalThis.localStorage?.removeItem(key);
      return true;
    } catch (error) {
      this.storageVolatile = true;
      this.storageWarning = "HyperSoft could not modify browser storage. Some reset or recovery actions may not persist.";
      console.warn("HyperSoft storage removal failed:", error);
      return false;
    }
  }

  preserveCorruptStorage(rawValue) {
    if (!rawValue) return;
    const recoveryKey = "blakeBreacher.recovery.corruptProfiles.v1";
    this.safeStorageSet(recoveryKey, String(rawValue).slice(0, 4 * 1024 * 1024));
    this.storageWarning = "HyperSoft found unreadable profile storage and started a clean recovery profile. The original raw data was preserved in browser storage for recovery.";
  }

  loadOrMigrateProfiles() {
    const storedRaw = this.safeStorageGet(STORAGE_KEYS.profiles);
    if (storedRaw) {
      try {
        const stored = JSON.parse(storedRaw);
        if (Array.isArray(stored) && stored.length) {
          const profiles = stored.slice(0, 100).map(profile => this.normalizeProfile(profile));
          const seenIds = new Set();
          const seenNames = new Set();
          profiles.forEach((profile,index) => {
            if (seenIds.has(profile.id)) profile.id = `profile_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
            seenIds.add(profile.id);
            const base=profile.name || "Player";
            let candidate=base;
            let suffix=2;
            while (seenNames.has(candidate.toLowerCase())) candidate=`${base.slice(0,22)} (${suffix++})`.slice(0,28);
            profile.name=candidate;
            seenNames.add(candidate.toLowerCase());
          });
          return profiles;
        }
        this.preserveCorruptStorage(storedRaw);
      } catch {
        this.preserveCorruptStorage(storedRaw);
      }
    }

    let legacySettings = { ...DEFAULT_SETTINGS };
    let legacyScores = [];
    let legacyKeyStats = {};
    let legacyKeyHistory = [];
    let hadLegacyData = false;
    try {
      const raw = this.safeStorageGet(STORAGE_KEYS.legacySettings);
      if (raw) { legacySettings = this.normalizeSettings(JSON.parse(raw)); hadLegacyData = true; }
    } catch {}
    try {
      const raw = this.safeStorageGet(STORAGE_KEYS.legacyScores);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) { legacyScores = parsed.map(row => this.normalizeScoreRow(row)).filter(Boolean); hadLegacyData = true; }
    } catch {}
    try {
      const raw = this.safeStorageGet(STORAGE_KEYS.legacyKeyStats);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length) { legacyKeyStats = this.normalizeStatMap(parsed); hadLegacyData = true; }
    } catch {}
    try {
      const raw = this.safeStorageGet(STORAGE_KEYS.legacyKeyHistory);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) { legacyKeyHistory = this.normalizeKeyHistory(parsed); hadLegacyData = true; }
    } catch {}

    const profile = this.createProfileRecord("Player 1", "initials", {
      settings: legacySettings, scores: legacyScores, keyStats: legacyKeyStats, keyHistory: legacyKeyHistory, pairStats: {}, achievements: {}
    });
    const profiles = [profile];
    this.safeStorageSet(STORAGE_KEYS.profiles, JSON.stringify(profiles));
    this.safeStorageSet(STORAGE_KEYS.activeProfile, profile.id);
    if (hadLegacyData) this.safeStorageSet("blakeBreacher.profileMigrationNotice.v1", "1");
    return profiles;
  }

  consumeMigrationMessage() {
    const key = "blakeBreacher.profileMigrationNotice.v1";
    if (this.safeStorageGet(key) !== "1") return "";
    this.safeStorageRemove(key);
    return "Your existing v0.8.3 scores, settings, and adaptive typing history were migrated into Player 1. The original legacy data was left untouched as a fallback.";
  }

  resolveActiveProfileId() {
    const stored = this.safeStorageGet(STORAGE_KEYS.activeProfile);
    if (stored && this.profiles.some(profile => profile.id === stored)) return stored;
    const fallback = this.profiles[0]?.id;
    if (fallback) this.safeStorageSet(STORAGE_KEYS.activeProfile, fallback);
    return fallback;
  }

  getActiveProfile() {
    if (this.activeProfileId === "guest") return this.guestProfile;
    return this.profiles.find(profile => profile.id === this.activeProfileId) ?? this.profiles[0] ?? null;
  }

  persistProfiles() {
    return this.safeStorageSet(STORAGE_KEYS.profiles, JSON.stringify(this.profiles));
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
      achievements: this.cloneData(this.achievements),
      traineeProgress: this.cloneData(this.traineeProgress),
      customPracticePresets: this.cloneData(this.customPracticePresets),
      customPracticeLastConfig: this.cloneData(this.customPracticeLastConfig),
      dailyPlanState: this.cloneData(this.dailyPlanState),
      dailyPlanHistory: this.cloneData(this.dailyPlanHistory),
      theoryProgress: this.cloneData(this.theoryProgress),
      onboardingState: this.cloneData(this.onboardingState),
      navigationState: this.cloneData(this.navigationState)
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
    this.traineeProgress = this.loadTraineeProgress();
    this.dailyPlanState = this.loadDailyPlanState();
    this.dailyPlanHistory = this.loadDailyPlanHistory();
    this.dailyPlanReturnPending = false;
    this.theoryProgress = this.loadTheoryProgress();
    this.onboardingState = this.loadOnboardingState();
    this.navigationState = this.loadNavigationState();
    this.moduleExplorerQuery = "";
    this.moduleExplorerView = "all";
    this.currentTheoryTopicId = THEORY_TOPICS.find(topic => !this.theoryProgress[topic.id]?.reviewed)?.id ?? THEORY_TOPICS[0].id;
    this.theoryCategory = "all";
    this.theorySearch = "";
    this.theoryFeedback = "";
    this.currentTraineeStepId = TRAINEE_MODULES.find(item => !this.traineeProgress[item.id])?.id ?? TRAINEE_MODULES[0].id;
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
        scores: [], keyStats: {}, keyHistory: [], pairStats: {}, achievements: {}, traineeProgress: {}, customPracticePresets: [], customPracticeLastConfig: { ...CUSTOM_PRACTICE_DEFAULTS }, dailyPlanState: null, dailyPlanHistory: [], theoryProgress: {}, onboardingState: { ...ONBOARDING_DEFAULTS }, navigationState: { ...NAVIGATION_DEFAULTS }
      });
      this.guestProfile.id = "guest";
      this.activeProfileId = "guest";
    } else {
      const target = this.profiles.find(profile => profile.id === profileId);
      if (!target) return;
      this.guestProfile = null;
      this.activeProfileId = target.id;
      this.safeStorageSet(STORAGE_KEYS.activeProfile, target.id);
    }

    this.loadActiveProfileState();
    this.applyTheme(this.settings.theme, this.settings.hyper98Palette);
    this.applyMotionPreference();
    this.engine?.setSound(this.settings.sound);
    this.engine?.setSoundVolume(this.settings.soundVolume);
    this.lastActivity = null;
    this.pendingLessonId = null;
    this.renderMenu();
    this.renderTrainee();
    this.renderCustomPracticeBuilder();
    this.renderRealWorldLab();
    this.renderAccuracyClinic();
    this.renderTenKeyAcademy();
    this.renderPunctuationLab();
    this.renderCertificationTests();
    this.renderDailyPlan();
    this.renderTheoryLibrary();
    this.renderTechniqueCoach();
    this.renderLessons(); this.renderSmartPracticeLab(); this.renderSmartPracticeWeakKeySummary();
    this.renderSettings();
    this.renderScoreboard();
    this.renderProgress();
    this.renderAchievements();
    this.renderReports();
    this.renderProfiles();
    this.renderHomeIntegration();
    this.renderDiagnostics();
    this.updateProfileChrome();
    this.showScreen("title");
    this.maybeOpenOnboarding();
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
    this.openAccessibleDialog(this.ui.profileDialog, { initialFocus: "#profileNameInput" });
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
      scores: [], keyStats: {}, keyHistory: [], pairStats: {}, achievements: {}, traineeProgress: {}, customPracticePresets: [], customPracticeLastConfig: { ...CUSTOM_PRACTICE_DEFAULTS }, dailyPlanState: null, dailyPlanHistory: [], theoryProgress: {}, onboardingState: { ...ONBOARDING_DEFAULTS }, navigationState: { ...NAVIGATION_DEFAULTS }
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
      this.safeStorageSet(STORAGE_KEYS.activeProfile, this.activeProfileId);
      this.loadActiveProfileState();
      this.applyTheme(this.settings.theme, this.settings.hyper98Palette);
      this.applyMotionPreference();
      this.engine?.setSound(this.settings.sound);
    this.engine?.setSoundVolume(this.settings.soundVolume);
    }
    this.renderMenu();
    this.renderTrainee();
    this.renderCustomPracticeBuilder();
    this.renderRealWorldLab();
    this.renderAccuracyClinic();
    this.renderTenKeyAcademy();
    this.renderPunctuationLab();
    this.renderCertificationTests();
    this.renderDailyPlan();
    this.renderTheoryLibrary();
    this.renderTechniqueCoach();
    this.renderLessons(); this.renderSmartPracticeLab(); this.renderSmartPracticeWeakKeySummary();
    this.renderScoreboard();
    this.renderProgress();
    this.renderAchievements();
    this.renderReports();
    this.renderProfiles();
    this.renderHomeIntegration();
    this.renderDiagnostics();
    this.updateProfileChrome();
  }

  getSaveEnvelope(format, payload = {}) {
    return {
      app: "Blake Breacher Teaches Typing",
      appVersion: APP_VERSION,
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
        try {
          const text = String(reader.result ?? "").replace(/^\uFEFF/, "").trim();
          if (!text) throw new Error("empty");
          resolve(JSON.parse(text));
        } catch {
          reject(new Error("The selected file is empty or is not valid JSON."));
        }
      };
      reader.onerror = () => reject(new Error("The selected file could not be read."));
      reader.readAsText(file);
    });
  }

  unwrapImportedProfile(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("This is not a HyperSoft profile file.");
    const schema = Number(payload.schemaVersion ?? 1);
    if (!Number.isInteger(schema) || schema < 1) throw new Error("This profile has an invalid save-schema version.");
    if (schema > 1) throw new Error(`This save was created by a newer HyperSoft save format and cannot be imported by v${APP_VERSION}.`);
    let raw = payload.format === "hyperSoftProfile" ? payload.profile : payload;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("No learner profile was found in that file.");
    const profileLike = raw.data || raw.name || raw.id || raw.settings || raw.scores || raw.keyStats || raw.achievements;
    if (!profileLike) throw new Error("No learner profile was found in that file.");
    // Accept early/flat profile exports by wrapping their state into the current data container.
    if (!raw.data || typeof raw.data !== "object" || Array.isArray(raw.data)) {
      raw = {
        ...raw,
        data: {
          settings: raw.settings,
          scores: raw.scores,
          keyStats: raw.keyStats,
          keyHistory: raw.keyHistory,
          pairStats: raw.pairStats,
          achievements: raw.achievements
        }
      };
    }
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
      const snapshot = this.cloneData(this.profiles);
      this.profiles.push(profile);
      if (!this.persistProfiles()) {
        this.profiles = snapshot;
        throw new Error("The profile was valid, but browser storage rejected the import. No existing profile was changed.");
      }
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
    const schema = Number(payload.schemaVersion ?? 1);
    if (!Number.isInteger(schema) || schema < 1) throw new Error("This backup has an invalid save-schema version.");
    if (schema > 1) throw new Error(`This backup uses a newer save format than v${APP_VERSION} supports.`);
    if (payload.profiles.length > 100) throw new Error("This backup contains more than 100 profiles and was rejected as unreasonable.");
    const seenIds = new Set();
    const seenNames = new Set();
    const profiles = payload.profiles.map((raw, index) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        throw new Error(`Profile ${index + 1} in this backup is malformed.`);
      }
      const profile = this.normalizeProfile(this.cloneData(raw));
      if (!profile.id || seenIds.has(profile.id)) profile.id = `profile_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
      seenIds.add(profile.id);
      const originalName = profile.name;
      let candidate = originalName;
      let suffix = 2;
      while (seenNames.has(candidate.toLowerCase())) candidate = `${originalName.slice(0, 22)} (${suffix++})`.slice(0, 28);
      profile.name = candidate;
      seenNames.add(candidate.toLowerCase());
      return profile;
    });
    return { profiles, activeProfileId: typeof payload.activeProfileId === "string" ? payload.activeProfileId : null };
  }

  async restoreBackupFile(file) {
    try {
      const payload = await this.readJsonFile(file);
      const restored = this.unwrapFullBackup(payload);
      const count = restored.profiles.length;
      if (!confirm(`Restore ${count} ${count === 1 ? "profile" : "profiles"} from this backup? This will replace all current persistent profiles on this browser.`)) return;
      if (!confirm("Final confirmation: current persistent profiles will be replaced. Guest data, if any, will also be discarded.")) return;
      this.stopActiveGame();
      const previousProfiles = this.cloneData(this.profiles);
      const previousActiveProfileId = this.activeProfileId;
      this.profiles = restored.profiles;
      this.guestProfile = null;
      const preferred = this.profiles.some(profile => profile.id === restored.activeProfileId) ? restored.activeProfileId : this.profiles[0].id;
      this.activeProfileId = preferred;
      if (!this.persistProfiles() || !this.safeStorageSet(STORAGE_KEYS.activeProfile, preferred)) {
        this.profiles = previousProfiles;
        this.activeProfileId = previousActiveProfileId;
        this.safeStorageSet(STORAGE_KEYS.profiles, JSON.stringify(previousProfiles));
        if (previousActiveProfileId && previousActiveProfileId !== "guest") this.safeStorageSet(STORAGE_KEYS.activeProfile, previousActiveProfileId);
        throw new Error("Browser storage rejected the restore. HyperSoft rolled back to the profiles that were present before the restore attempt.");
      }
      this.loadActiveProfileState();
      this.applyTheme(this.settings.theme, this.settings.hyper98Palette);
      this.applyMotionPreference();
      this.engine?.setSound(this.settings.sound);
    this.engine?.setSoundVolume(this.settings.soundVolume);
      this.syncAchievements({ notify: false });
      this.renderMenu(); this.renderTrainee(); this.renderCustomPracticeBuilder(); this.renderRealWorldLab(); this.renderAccuracyClinic(); this.renderTenKeyAcademy(); this.renderPunctuationLab(); this.renderCertificationTests(); this.renderDailyPlan(); this.renderTheoryLibrary(); this.renderTechniqueCoach(); this.renderLessons(); this.renderSmartPracticeLab(); this.renderSmartPracticeWeakKeySummary(); this.renderSettings(); this.renderScoreboard(); this.renderProgress(); this.renderAchievements(); this.renderReports(); this.renderProfiles(); this.renderHomeIntegration(); this.renderDiagnostics(); this.updateProfileChrome();
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
      this.guestProfile.data = { settings: { ...DEFAULT_SETTINGS }, scores: [], keyStats: {}, keyHistory: [], pairStats: {}, achievements: {}, traineeProgress: {}, customPracticePresets: [], customPracticeLastConfig: { ...CUSTOM_PRACTICE_DEFAULTS }, dailyPlanState: null, dailyPlanHistory: [], theoryProgress: {}, onboardingState: { ...ONBOARDING_DEFAULTS }, navigationState: { ...NAVIGATION_DEFAULTS } };
    } else {
      profile.data = { settings: { ...DEFAULT_SETTINGS }, scores: [], keyStats: {}, keyHistory: [], pairStats: {}, achievements: {}, traineeProgress: {}, customPracticePresets: [], customPracticeLastConfig: { ...CUSTOM_PRACTICE_DEFAULTS }, dailyPlanState: null, dailyPlanHistory: [], theoryProgress: {}, onboardingState: { ...ONBOARDING_DEFAULTS }, navigationState: { ...NAVIGATION_DEFAULTS } };
      profile.updatedAt = Date.now();
      this.persistProfiles();
    }
    this.loadActiveProfileState();
    this.applyTheme(this.settings.theme, this.settings.hyper98Palette);
    this.applyMotionPreference();
    this.engine?.setSound(this.settings.sound);
    this.engine?.setSoundVolume(this.settings.soundVolume);
    this.renderMenu(); this.renderTrainee(); this.renderCustomPracticeBuilder(); this.renderRealWorldLab(); this.renderAccuracyClinic(); this.renderTenKeyAcademy(); this.renderPunctuationLab(); this.renderCertificationTests(); this.renderDailyPlan(); this.renderTheoryLibrary(); this.renderTechniqueCoach(); this.renderLessons(); this.renderSmartPracticeLab(); this.renderSmartPracticeWeakKeySummary(); this.renderSettings(); this.renderScoreboard(); this.renderProgress(); this.renderAchievements(); this.renderReports(); this.renderProfiles(); this.renderHomeIntegration(); this.renderDiagnostics(); this.updateProfileChrome();
    this.setBackupStatus(`${profile.name} was reset to a fresh learner file.`, "good");
  }

  resetAllLocalData() {
    if (!confirm("Reset ALL Blake Breacher local data? This removes every profile, score, achievement, adaptive record, and preference in this browser.")) return;
    if (!confirm("This cannot be undone unless you exported a backup. Erase everything now?")) return;
    Object.values(STORAGE_KEYS).forEach(key => this.safeStorageRemove(key));
    this.safeStorageRemove("blakeBreacher.profileMigrationNotice.v1");
    this.safeStorageRemove("blakeBreacher.recovery.corruptProfiles.v1");
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
    this.ui.profileMigrationNote.textContent = [this.migrationMessage, this.storageWarning].filter(Boolean).join(" ");
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
    if (this.ui.hyper98WelcomeName) this.ui.hyper98WelcomeName.textContent = profile.name;
    this.ui.activeProfileStatus.textContent = this.activeProfileId === "guest" ? "Profile: Guest • not saved" : `Profile: ${profile.name}`;
    this.ui.activeProfileBanner.innerHTML = `<span class="profile-banner-avatar">${this.escapeHtml(avatar)}</span><span><strong>${this.escapeHtml(profile.name)}</strong><small>${this.activeProfileId === "guest" ? "Guest mode — progress disappears when you leave" : `${stats.sessions} sessions • ${stats.achievements} badges • Best ${stats.bestWpm || "—"} WPM • Open Profiles to switch learner`}</small></span>`;
    this.renderBackupReminder();
    this.updateWorkspaceChrome(this.currentScreenName);
  }

  loadSettings() {
    const profile = this.getActiveProfile();
    return this.normalizeSettings(profile?.data?.settings);
  }

  loadScores() {
    const profile = this.getActiveProfile();
    return Array.isArray(profile?.data?.scores)
      ? profile.data.scores.map(row => this.normalizeScoreRow(row)).filter(Boolean)
      : [];
  }

  loadKeyStats() {
    return this.normalizeStatMap(this.getActiveProfile()?.data?.keyStats);
  }

  loadTheoryProgress() {
    return normalizeTheoryProgress(this.getActiveProfile()?.data?.theoryProgress);
  }

  loadTraineeProgress() {
    const value = this.getActiveProfile()?.data?.traineeProgress;
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(TRAINEE_MODULES.filter(item => value[item.id] === true).map(item => [item.id, true]));
  }

  loadPairStats() {
    return this.normalizeStatMap(this.getActiveProfile()?.data?.pairStats, true);
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

  renderKeyMetricChip(label, value, chipClass = "key-metric-chip") {
    const safeLabel = this.escapeHtml(label);
    const safeValue = this.escapeHtml(value);
    return `<span class="${chipClass} key-metric-chip"><strong class="key-metric-glyph">${safeLabel}</strong><span class="key-metric-value">${safeValue}</span></span>`;
  }

  renderKeyAccuracyItems(items = [], { chipClass = "key-metric-chip" } = {}) {
    const html = (Array.isArray(items) ? items : []).map(item => {
      const key = this.formatKeyLabel(String(item?.key ?? ""));
      const accuracy = Math.max(0, Math.min(100, Number(item?.accuracy) || 0));
      return key ? this.renderKeyMetricChip(key, `${Math.round(accuracy)}%`, chipClass) : "";
    }).filter(Boolean).join("");
    return html ? `<span class="key-metric-list">${html}</span>` : "";
  }

  renderPairAccuracyItems(items = [], { chipClass = "pair-focus-chip" } = {}) {
    const html = (Array.isArray(items) ? items : []).map(item => {
      const pair = String(item?.pair ?? "").toUpperCase();
      const accuracy = Math.max(0, Math.min(100, Number(item?.accuracy) || 0));
      return pair ? this.renderKeyMetricChip(pair, `${Math.round(accuracy)}%`, chipClass) : "";
    }).filter(Boolean).join("");
    return html ? `<span class="key-metric-list">${html}</span>` : "";
  }

  parseKeyAccuracyString(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return [];
    const rows = [];
    const pattern = /\s*(.*?)\s+(\d+(?:\.\d+)?)%(?:,\s*|·\s*|$)/g;
    let match;
    while ((match = pattern.exec(raw)) !== null) {
      const key = match[1].trim();
      if (!key) continue;
      rows.push({ key, accuracy: Number(match[2]) });
    }
    return rows;
  }

  renderKeyAccuracyString(value) {
    const parsed = this.parseKeyAccuracyString(value);
    return parsed.length ? this.renderKeyAccuracyItems(parsed) : `<span class="key-metric-empty">${this.escapeHtml(String(value ?? ""))}</span>`;
  }

  renderAssessmentPracticeFocus(row = {}) {
    const metrics = Array.isArray(row.assessmentWeakKeyMetrics) ? row.assessmentWeakKeyMetrics : [];
    if (metrics.length) return this.renderKeyAccuracyItems(metrics);
    return this.renderKeyAccuracyString(row.weakKeys || "No clear weak key in this sample");
  }

  escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  applyTheme(theme = "classic", hyper98Palette = "blue") {
    const validThemes = new Set(["classic", "teal98", "officeBeige", "midnight", "plumDeluxe", "hyper98"]);
    const validPalettes = new Set(["blue", "teal", "beige", "midnight", "plum"]);
    const resolvedTheme = validThemes.has(theme) ? theme : "classic";
    document.documentElement.dataset.theme = resolvedTheme;
    if (resolvedTheme === "hyper98") {
      document.documentElement.dataset.hyper98Palette = validPalettes.has(hyper98Palette) ? hyper98Palette : "blue";
    } else {
      delete document.documentElement.dataset.hyper98Palette;
    }
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
