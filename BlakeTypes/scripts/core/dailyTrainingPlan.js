import { LESSON_METADATA } from "./lessonConfig.js";
import { SMART_PRACTICE_MODES } from "./smartTypingContent.js";
import { REAL_WORLD_MODES } from "./realWorldTypingLab.js";
import { ACCURACY_CLINIC_PROTOCOLS } from "./accuracyClinic.js";
import { TEN_KEY_PROTOCOLS } from "./tenKeyAcademy.js";
import { PUNCTUATION_BUSINESS_PROTOCOLS } from "./punctuationBusinessLab.js";
import { CERTIFICATION_DURATIONS } from "./timedCertification.js";
import { THEORY_TOPICS } from "./typingTheoryLibrary.js";

export const DAILY_PLAN_DURATIONS = [10, 20, 30];

const dailyPlanClamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

export function getPacificDayKey(timestamp = Date.now()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date(timestamp));
    const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${map.year}-${map.month}-${map.day}`;
  } catch {
    return new Date(timestamp).toISOString().slice(0, 10);
  }
}

export function dailyPlanActionResolves(action) {
  if (!action || typeof action !== "object") return false;
  const id=String(action.id||"");
  if (action.type === "screen") return new Set(["trainee","assessment","technique","dailyPlan","theory","lessons","smartPractice","customPractice","realWorld","accuracyClinic","tenKey","punctuation","certification","menu","progress","reports","achievements","office","profiles","settings","scoreboard","title"]).has(id);
  if (action.type === "theory") return THEORY_TOPICS.some(item=>item.id===id);
  if (action.type === "assessment") return id === "typingAssessment";
  if (action.type === "lesson") return LESSON_METADATA.some(item=>item.id===id) || SMART_PRACTICE_MODES.some(item=>item.id===id);
  if (action.type === "accuracyClinic") return ACCURACY_CLINIC_PROTOCOLS.some(item=>item.id===id);
  if (action.type === "punctuation") return PUNCTUATION_BUSINESS_PROTOCOLS.some(item=>item.id===id);
  if (action.type === "tenKey") return TEN_KEY_PROTOCOLS.some(item=>item.id===id);
  if (action.type === "realWorld") return REAL_WORLD_MODES.some(item=>item.id===id);
  if (action.type === "certification") return CERTIFICATION_DURATIONS.some(item=>item.id===id);
  return false;
}

export function normalizeDailyPlanState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const duration = DAILY_PLAN_DURATIONS.includes(Number(value.durationMinutes)) ? Number(value.durationMinutes) : 20;
  const allowedTypes = new Set(["screen", "theory", "assessment", "lesson", "accuracyClinic", "punctuation", "tenKey", "realWorld", "certification"]);
  const steps = Array.isArray(value.steps) ? value.steps.slice(0, 10).map((raw, index) => {
    if (!raw || typeof raw !== "object") return null;
    const action = raw.action && typeof raw.action === "object" && allowedTypes.has(raw.action.type)
      ? { type: raw.action.type, id: String(raw.action.id || "").slice(0, 80) }
      : null;
    if (!action || !dailyPlanActionResolves(action)) return null;
    return {
      id: String(raw.id || `step_${index + 1}`).slice(0, 80),
      title: String(raw.title || "Training Step").slice(0, 120),
      module: String(raw.module || "HyperSoft").slice(0, 80),
      reason: String(raw.reason || "Recommended practice.").slice(0, 360),
      minutes: Math.max(1, Math.min(15, Math.round(Number(raw.minutes) || 3))),
      priority: Math.max(0, Math.min(999, Math.round(Number(raw.priority) || 0))),
      action,
      manual: raw.manual === true
    };
  }).filter(Boolean) : [];
  const completed = Array.isArray(value.completedStepIds)
    ? [...new Set(value.completedStepIds.map(id => String(id).slice(0, 80)))].filter(id => steps.some(step => step.id === id))
    : [];
  const activeStepId = steps.some(step => step.id === value.activeStepId) ? String(value.activeStepId) : null;
  return {
    dateKey: String(value.dateKey || "").slice(0, 16),
    durationMinutes: duration,
    generatedAt: Math.max(0, Number(value.generatedAt) || 0),
    focusLabel: String(value.focusLabel || "Balanced Training").slice(0, 100),
    rationale: String(value.rationale || "HyperSoft generated a balanced practice sequence.").slice(0, 500),
    steps,
    completedStepIds: completed,
    activeStepId
  };
}

function dailyMetric(technique, id) {
  return technique?.metrics?.find(item => item.id === id) ?? null;
}

function dailyCandidate(key, title, module, minutes, priority, reason, action, manual = false) {
  return { key, title, module, minutes, priority, reason, action, manual };
}

function dailyPunctuationProtocol(familyId = "") {
  const id = String(familyId).toLowerCase();
  if (id.includes("capital") || id.includes("shift")) return "shiftBasics";
  if (id.includes("quote") || id.includes("apost")) return "quotesApostrophes";
  if (id.includes("web") || id.includes("path") || id.includes("slash")) return "slashesWeb";
  if (id.includes("symbol") || id.includes("number")) return "numbersSymbols";
  if (id.includes("sentence") || id.includes("parent") || id.includes("bracket")) return "businessMarks";
  return "businessMastery";
}

function dailyStepId(candidate, index) {
  return `${candidate.key}_${index + 1}`.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80);
}

export function buildDailyTrainingPlan({ durationMinutes = 20, evidence = {} } = {}) {
  const duration = DAILY_PLAN_DURATIONS.includes(Number(durationMinutes)) ? Number(durationMinutes) : 20;
  const technique = evidence.technique ?? {};
  const accuracyMetric = dailyMetric(technique, "accuracy");
  const rhythmMetric = dailyMetric(technique, "rhythm");
  const mixedMetric = dailyMetric(technique, "mixed");
  const pairMetric = dailyMetric(technique, "transitions");
  const sustainabilityMetric = dailyMetric(technique, "sustainability");
  const candidates = [];

  if ((Number(evidence.traineeCompleted) || 0) < (Number(evidence.traineeTotal) || 8) && (!evidence.latestAssessment || (technique.aggregate || 0) < 72)) {
    candidates.push(dailyCandidate(
      "trainee", "Technique Foundation Review", "Keyboard Trainee", 4, 120,
      "Your foundation stations are not complete, so today's plan starts with posture, finger zones, home-row orientation, or the next unfinished Trainee station before speed work.",
      { type: "screen", id: "trainee" }, true
    ));
  }

  if (duration >= 20 && (Number(evidence.theoryReviewed) || 0) < Math.min(4, Number(evidence.theoryTotal) || 12)) {
    const topicId = !evidence.latestAssessment ? "touchTyping"
      : (accuracyMetric?.score ?? 100) < 90 ? "accuracySpeed"
      : (rhythmMetric?.score ?? 100) < 90 ? "rhythm"
      : evidence.punctuationWeakFamily?.accuracy != null && evidence.punctuationWeakFamily.accuracy < 98 ? "shiftPunctuation"
      : evidence.tenKeySessions > 0 && evidence.tenKeyLevel !== "Proficient" ? "tenKeyTheory"
      : "practiceDesign";
    const topicLabels = {
      touchTyping:"Touch Typing & Home Position",
      accuracySpeed:"Accuracy Before Speed",
      rhythm:"Rhythm, Hesitation & Flow",
      shiftPunctuation:"Shift, Capitals & Punctuation",
      tenKeyTheory:"10-Key Theory & KPH",
      practiceDesign:"Practice Design, Rest & Progress"
    };
    candidates.push(dailyCandidate(
      "theory", `Theory Refresher: ${topicLabels[topicId] || "Typing Fundamentals"}`, "Learning Center", 3, 76,
      "Your Learning Center foundation is still developing. A short concept review can make the practice steps that follow more intentional instead of turning them into unexplained repetition.",
      { type:"theory", id:topicId }, true
    ));
  }

  if (!evidence.latestAssessment) {
    candidates.push(dailyCandidate(
      "assessment", "Establish a Placement Baseline", "Typing Assessment", 5, 116,
      "HyperSoft does not yet have sustained rhythm, hesitation, mixed-key, and placement evidence. A baseline makes every later recommendation more specific.",
      { type: "assessment", id: "typingAssessment" }
    ));
  } else if ((Number(evidence.daysSinceAssessment) || 0) >= 21 && (Number(evidence.recentSessionCount) || 0) >= 5) {
    candidates.push(dailyCandidate(
      "reassessment", "Refresh the Placement Baseline", "Typing Assessment", 5, 84,
      "Your latest placement sample is several weeks old and you have accumulated newer training evidence. A retest can recalibrate the plan.",
      { type: "assessment", id: "typingAssessment" }
    ));
  }

  if ((accuracyMetric?.score ?? 100) < 88 || (evidence.accuracyClinicIndex?.score != null && evidence.accuracyClinicIndex.score < 95)) {
    candidates.push(dailyCandidate(
      "accuracy", evidence.weakKeys?.length || evidence.weakPairs?.length ? "Repair Accuracy Leaks" : "Clean First Attempts",
      "Accuracy Clinic", 5, 108,
      evidence.weakKeys?.length || evidence.weakPairs?.length
        ? "Recent evidence shows enough repeatable weak-key or transition errors to justify a precision-first remediation block."
        : "Accuracy is currently costing more performance than speed. Protect clean first attempts before trying to type faster.",
      { type: "accuracyClinic", id: evidence.weakKeys?.length || evidence.weakPairs?.length ? "weaknessRepair" : "cleanSlate" }
    ));
  }

  if (evidence.weakPairs?.length || (pairMetric?.score != null && pairMetric.score < 91)) {
    const label = (evidence.weakPairs || []).slice(0, 3).map(item => String(item.pair || "").toUpperCase()).filter(Boolean).join(", ");
    candidates.push(dailyCandidate(
      "pairs", "Trouble-Pair Clinic", "Smart Practice", 4, 102,
      label ? `Repeated transition evidence is concentrated around ${label}. Short targeted repetition should make those movements less deliberate.` : "Transition control is still below the rest of the profile and deserves a focused repetition block.",
      { type: "lesson", id: "smartTroublePairs" }
    ));
  } else if (evidence.weakKeys?.length) {
    const label = evidence.weakKeys.slice(0, 4).map(item => String(item.key || "").toUpperCase()).filter(Boolean).join(", ");
    candidates.push(dailyCandidate(
      "weakKeys", "Weak-Key Workshop", "Formal Lessons", 4, 97,
      label ? `The adaptive profile still flags ${label}. Use the curriculum's Weak-Key Workshop to bias practice toward those keys.` : "Adaptive key history still contains established weak keys.",
      { type: "lesson", id: "adaptiveWorkshop" }
    ));
  }

  if ((mixedMetric?.score ?? 100) < 88 || (evidence.punctuationWeakFamily?.accuracy != null && evidence.punctuationWeakFamily.accuracy < 98)) {
    const family = evidence.punctuationWeakFamily;
    candidates.push(dailyCandidate(
      "punctuation", "Mixed-Key Precision", "Punctuation & Business Writing", 5, 96,
      family ? `${family.label || "Punctuation"} is the weakest recorded punctuation family at about ${Math.round(family.accuracy)}% accuracy.` : "Shift, punctuation, symbols, or number-row work is slowing the profile more than ordinary prose.",
      { type: "punctuation", id: dailyPunctuationProtocol(family?.id || family?.label) }
    ));
  }

  if (evidence.nextLessonId) {
    candidates.push(dailyCandidate(
      "curriculum", `Continue: ${evidence.nextLessonTitle || "Next Formal Lesson"}`, "Formal Lessons", 5, 82,
      `The formal curriculum is ${Number(evidence.masteredLessons) || 0}/${Number(evidence.totalLessons) || 14} targets complete. Keep progressive keyboard coverage moving alongside targeted clinics.`,
      { type: "lesson", id: evidence.nextLessonId }
    ));
  }

  if ((rhythmMetric?.score != null && rhythmMetric.score < 86) || (sustainabilityMetric?.score != null && sustainabilityMetric.score < 86)) {
    candidates.push(dailyCandidate(
      "rhythm", "Rhythm & Hand Alternation", "Smart Practice", 4, 91,
      "Timing evidence shows pauses, burst typing, or speed fade. A controlled alternation drill emphasizes repeatable cadence instead of short sprints.",
      { type: "lesson", id: "smartAlternation" }
    ));
  }

  const tenKeyNeedsWork = evidence.tenKeySessions > 0 && evidence.tenKeyLevel !== "Proficient";
  const tenKeyRotation = duration >= 30 && evidence.tenKeySessions === 0 && (evidence.recentSessionCount || 0) >= 4;
  if (tenKeyNeedsWork || tenKeyRotation) {
    const protocolId = evidence.tenKeyLevel === "Productive" ? "proficiency" : evidence.tenKeySessions > 2 ? "enterRhythm" : "homeRow";
    candidates.push(dailyCandidate(
      "tenKey", tenKeyRotation ? "Numeric Skills Rotation" : "10-Key Development", "10-Key Academy", protocolId === "proficiency" ? 3 : 4, tenKeyNeedsWork ? 72 : 42,
      tenKeyRotation ? "A longer daily plan has room for numeric-keypad cross-training without taking time away from your highest-priority prose work." : `Your current 10-Key level is ${evidence.tenKeyLevel || "Developing"}; reinforce numeric home position and entry rhythm.`,
      { type: "tenKey", id: protocolId }
    ));
  }

  if ((evidence.recentSessionCount || 0) >= 3) {
    const labId = evidence.realWorldSessions ? "transcription" : "emailDesk";
    candidates.push(dailyCandidate(
      "application", "Apply the Skill to Real Material", "Real-World Typing Lab", 5, 64,
      evidence.realWorldSessions ? "Finish the focused work by carrying the same technique into structured, realistic document material." : "You have enough controlled practice to benefit from an applied typing simulation with real punctuation, structure, and formatting.",
      { type: "realWorld", id: labId }
    ));
  }

  const certificationStale = !evidence.certificationSessions || (Number(evidence.daysSinceCertification) || 0) >= 7;
  if ((technique.aggregate || 0) >= 78 && certificationStale) {
    candidates.push(dailyCandidate(
      "benchmark", duration >= 20 ? "Sustained Benchmark" : "Quick Benchmark", "Timed Tests", duration >= 30 ? 5 : duration >= 20 ? 3 : 1, 58,
      "A timed benchmark converts today's technique work into a comparable sustained result without replacing the practice that came before it.",
      { type: "certification", id: duration >= 30 ? "fiveMinute" : duration >= 20 ? "threeMinute" : "oneMinute" }
    ));
  }

  candidates.push(dailyCandidate(
    "warmup", "Controlled Warm-Up", "Smart Practice", 3, 52,
    "A short familiar-word burst gets the hands moving before more demanding work. The objective is smooth cadence, not a personal record.",
    { type: "lesson", id: "smartShortBurst" }
  ));

  candidates.sort((a, b) => b.priority - a.priority);

  const selected = [];
  let used = 0;
  const maxSteps = duration === 10 ? 3 : duration === 20 ? 5 : 7;
  for (const candidate of candidates) {
    if (selected.length >= maxSteps) break;
    if (selected.some(item => item.key === candidate.key)) continue;
    const fits = used + candidate.minutes <= duration;
    if (!fits && selected.length >= 2) continue;
    selected.push(candidate);
    used += candidate.minutes;
    if (used >= duration - 1) break;
  }

  // Fill sparse plans with useful general work, while avoiding duplicate activities.
  const fillers = [
    dailyCandidate("difficult", "Difficult-Word Control", "Smart Practice", 4, 20, "Use a moderate pace on longer or awkward words to preserve clean movement under added complexity.", { type: "lesson", id: "smartDifficult" }),
    dailyCandidate("realworld-fallback", "Applied Document Practice", "Real-World Typing Lab", 5, 18, "End with structured prose so the day's improvements are tested outside a purpose-built drill.", { type: "realWorld", id: "transcription" }),
    dailyCandidate("benchmark-fallback", "One-Minute Check", "Timed Tests", 1, 12, "Capture a quick comparable result at the end of the session without turning the entire plan into a speed test.", { type: "certification", id: "oneMinute" })
  ];
  for (const filler of fillers) {
    if (selected.length >= maxSteps || used >= duration - 1) break;
    if (selected.some(item => item.action.type === filler.action.type && item.action.id === filler.action.id)) continue;
    if (used + filler.minutes > duration + 1) continue;
    selected.push(filler);
    used += filler.minutes;
  }

  const steps = selected.map((candidate, index) => ({
    id: dailyStepId(candidate, index),
    title: candidate.title,
    module: candidate.module,
    reason: candidate.reason,
    minutes: candidate.minutes,
    priority: candidate.priority,
    action: candidate.action,
    manual: candidate.manual
  }));

  const top = steps[0];
  const focusLabel = top?.module || "Balanced Training";
  const rationale = top
    ? `Today's highest-priority signal points to ${top.module}. HyperSoft then balances targeted remediation, progressive curriculum work, applied typing, and benchmarking to fit a roughly ${duration}-minute session.`
    : `HyperSoft found no urgent weakness and assembled a balanced ${duration}-minute maintenance session.`;

  return normalizeDailyPlanState({
    dateKey: getPacificDayKey(),
    durationMinutes: duration,
    generatedAt: Date.now(),
    focusLabel,
    rationale,
    steps,
    completedStepIds: [],
    activeStepId: null
  });
}

export function getDailyPlanCompletion(plan) {
  const state = normalizeDailyPlanState(plan);
  if (!state || !state.steps.length) return { completed: 0, total: 0, percent: 0, minutesDone: 0, minutesTotal: 0, complete: false };
  const done = new Set(state.completedStepIds);
  const completedSteps = state.steps.filter(step => done.has(step.id));
  const minutesDone = completedSteps.reduce((sum, step) => sum + step.minutes, 0);
  const minutesTotal = state.steps.reduce((sum, step) => sum + step.minutes, 0);
  return {
    completed: completedSteps.length,
    total: state.steps.length,
    percent: Math.round((completedSteps.length / state.steps.length) * 100),
    minutesDone,
    minutesTotal,
    complete: completedSteps.length === state.steps.length
  };
}
