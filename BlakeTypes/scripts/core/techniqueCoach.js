const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const round1 = value => Math.round((Number(value) || 0) * 10) / 10;

function establishedWeakKeys(keyStats = {}, limit = 5) {
  return Object.entries(keyStats)
    .map(([key, stats]) => {
      const attempts = Number(stats?.attempts) || 0;
      const correct = Number(stats?.correct) || 0;
      return { key, attempts, accuracy: attempts ? (correct / attempts) * 100 : 100 };
    })
    .filter(item => item.attempts >= 6)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, limit);
}

function establishedWeakPairs(pairStats = {}, limit = 5) {
  return Object.entries(pairStats)
    .map(([pair, stats]) => {
      const attempts = Number(stats?.attempts) || 0;
      const correct = Number(stats?.correct) || 0;
      return { pair: String(pair).toUpperCase(), attempts, accuracy: attempts ? (correct / attempts) * 100 : 100 };
    })
    .filter(item => item.attempts >= 5)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, limit);
}

function statusFor(score, hasData = true) {
  if (!hasData) return { label: "Collecting data", tone: "data" };
  if (score >= 94) return { label: "Strong", tone: "strong" };
  if (score >= 86) return { label: "Good", tone: "good" };
  if (score >= 75) return { label: "Watch", tone: "watch" };
  return { label: "Priority", tone: "priority" };
}

function metric(id, title, score, hasData, evidence, coaching, action) {
  const state = statusFor(score, hasData);
  return { id, title, score: hasData ? Math.round(clamp(score)) : null, hasData, ...state, evidence, coaching, action };
}

function phaseById(assessment, id) {
  return Array.isArray(assessment?.assessmentPhaseStats)
    ? assessment.assessmentPhaseStats.find(item => item?.id === id)
    : null;
}

function getCorrectionRate(assessment) {
  if (!assessment) return null;
  const chars = (assessment.assessmentPhaseStats || []).reduce((sum, item) => sum + (Number(item?.chars) || 0), 0);
  if (!chars) return null;
  return ((Number(assessment.backspaces) || 0) / chars) * 100;
}

function getRecentTrainingRows(scores = []) {
  return scores
    .filter(row => ["lesson", "practice", "customPractice", "realWorld", "accuracyClinic", "punctuation", "certification", "assessment"].includes(row?.activityType))
    .filter(row => (Number(row.durationMs) || 0) >= 15000 || row.activityType === "assessment")
    .sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0))
    .slice(-20);
}

export function analyzeTechniqueProfile({ scores = [], keyStats = {}, pairStats = {}, traineeProgress = {} } = {}) {
  const assessments = scores.filter(row => row?.activityType === "assessment").sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));
  const assessment = assessments.at(-1) ?? null;
  const recent = getRecentTrainingRows(scores);
  const recentAccuracy = recent.map(row => Number(row.accuracy)).filter(Number.isFinite);
  const recentWpm = recent.map(row => Number(row.wpm)).filter(Number.isFinite);
  const weakKeys = establishedWeakKeys(keyStats);
  const weakPairs = establishedWeakPairs(pairStats);
  const traineeCompleted = Object.values(traineeProgress || {}).filter(Boolean).length;

  const assessmentAccuracy = Number(assessment?.accuracy);
  const accuracyValue = Number.isFinite(assessmentAccuracy) ? assessmentAccuracy : average(recentAccuracy);
  const accuracyHasData = Number.isFinite(assessmentAccuracy) || recentAccuracy.length >= 3;
  const accuracyScore = accuracyHasData ? clamp(100 - Math.max(0, 97 - accuracyValue) * 4) : 0;

  const rhythmValue = Number(assessment?.rhythmScore);
  const rhythmHasData = Number.isFinite(rhythmValue);
  const rhythmScore = rhythmHasData ? rhythmValue : 0;

  const correctionRate = getCorrectionRate(assessment);
  const correctionHasData = correctionRate != null;
  const correctionScore = correctionHasData ? clamp(100 - correctionRate * 12) : 0;

  const foundation = phaseById(assessment, "foundation");
  const mixed = phaseById(assessment, "mixed");
  const sustained = phaseById(assessment, "sustained");
  const foundationWpm = Number(foundation?.grossWpm) || 0;
  const mixedWpm = Number(mixed?.grossWpm) || 0;
  const sustainedWpm = Number(sustained?.grossWpm) || 0;

  const mixedHasData = foundationWpm > 0 && mixedWpm > 0;
  const mixedRatio = mixedHasData ? mixedWpm / foundationWpm : 0;
  const mixedScore = mixedHasData ? clamp(mixedRatio * 110) : 0;

  const sustainabilityHasData = foundationWpm > 0 && sustainedWpm > 0;
  const sustainabilityRatio = sustainabilityHasData ? sustainedWpm / foundationWpm : 0;
  const sustainabilityScore = sustainabilityHasData ? clamp(sustainabilityRatio * 105) : 0;

  const pairHasData = weakPairs.length > 0 || Object.values(pairStats || {}).some(stats => (Number(stats?.attempts) || 0) >= 5);
  const pairAverage = weakPairs.length ? average(weakPairs.map(item => item.accuracy)) : 100;
  const pairScore = pairHasData ? clamp(pairAverage) : 0;

  const weakKeyLabel = weakKeys.length
    ? weakKeys.map(item => `${item.key === " " ? "Space" : item.key.toUpperCase()} ${Math.round(item.accuracy)}%`).join(" · ")
    : "No established weak keys yet";
  const weakPairLabel = weakPairs.length
    ? weakPairs.map(item => `${item.pair} ${Math.round(item.accuracy)}%`).join(" · ")
    : "No established weak pairs yet";

  const metrics = [
    metric(
      "accuracy", "Accuracy Discipline", accuracyScore, accuracyHasData,
      accuracyHasData ? `${round1(accuracyValue)}% first-attempt/recent accuracy` : "Complete an Assessment or several training sessions",
      !accuracyHasData ? "HyperSoft needs more sustained typing before judging accuracy habits." : accuracyValue >= 97 ? "Your accuracy is supporting speed instead of being sacrificed for it." : accuracyValue >= 94 ? "Accuracy is workable, but slow down slightly when unfamiliar patterns appear." : "Treat clean first attempts as the primary target until error rate drops.",
      accuracyValue < 94 ? { type: "lesson", id: "smartDifficult", label: "Open Difficult-Word Clinic" } : { type: "screen", id: "smartPractice", label: "Open Smart Practice" }
    ),
    metric(
      "rhythm", "Rhythm Stability", rhythmScore, rhythmHasData,
      rhythmHasData ? `${Math.round(rhythmValue)}% rhythm · ${Number(assessment?.hesitations) || 0} long hesitations` : "Placement Assessment rhythm sample required",
      !rhythmHasData ? "Assessment records inter-key timing so Technique Coach can distinguish steady typing from bursts and stalls." : rhythmValue >= 90 ? "Your timing is comparatively even. Preserve that cadence as WPM rises." : rhythmValue >= 78 ? "You have a usable cadence, but visible pauses are interrupting flow." : "Reduce burst typing. Aim for a slightly slower pace that you can repeat key after key.",
      rhythmValue < 85 ? { type: "lesson", id: "smartAlternation", label: "Start Hand Alternation" } : { type: "lesson", id: "smartShortBurst", label: "Start Short-Word Burst" }
    ),
    metric(
      "correction", "Correction Behavior", correctionScore, correctionHasData,
      correctionHasData ? `${Number(assessment?.backspaces) || 0} Backspace attempts · ${round1(correctionRate)} per 100 characters` : "Placement Assessment correction sample required",
      !correctionHasData ? "The Placement Assessment records correction behavior without allowing Backspace to erase the original first-attempt error." : correctionRate <= 0.8 ? "Corrections are infrequent and controlled." : correctionRate <= 2.0 ? "Correction use is noticeable but not dominating the passage." : "Frequent correction attempts are breaking rhythm. Prioritize deliberate first strikes over immediate repair.",
      correctionRate != null && correctionRate > 1.5 ? { type: "screen", id: "trainee", label: "Review Keyboard Trainee" } : { type: "screen", id: "assessment", label: "Retake Assessment Later" }
    ),
    metric(
      "mixed", "Shift & Punctuation Fluency", mixedScore, mixedHasData,
      mixedHasData ? `Mixed-key phase ${round1(mixedWpm)} WPM vs ${round1(foundationWpm)} WPM foundation` : "Mixed-key Assessment phase required",
      !mixedHasData ? "The mixed phase reveals whether capitals, punctuation, numbers, and symbols cause disproportionate slowing." : mixedRatio >= .88 ? "Shift, punctuation, and number-row work are staying close to your ordinary pace." : mixedRatio >= .72 ? "Mixed-key work causes a moderate slowdown. Practice clean modifier-key movement." : "Your pace drops sharply outside ordinary lowercase prose. Give mixed-key control dedicated practice.",
      mixedRatio < .82 ? { type: "lesson", id: "fullKeyboardMix", label: "Start Full Keyboard Mix" } : { type: "lesson", id: "smartRowHops", label: "Start Row-Hop Control" }
    ),
    metric(
      "transitions", "Key-Transition Control", pairScore, pairHasData,
      pairHasData ? weakPairLabel : "More pair observations required",
      !pairHasData ? "Lesson-style exercises collect first-attempt two-key transition data. Technique Coach waits for repeated observations before calling a pair weak." : pairScore >= 95 ? "No recurring transition problem is materially dragging this profile down." : pairScore >= 88 ? "A few transitions deserve targeted repetition before they become automatic." : "Repeated pair errors are established enough to justify a dedicated clinic.",
      { type: "lesson", id: "smartTroublePairs", label: "Start Trouble-Pair Clinic" }
    ),
    metric(
      "sustainability", "Speed Sustainability", sustainabilityScore, sustainabilityHasData,
      sustainabilityHasData ? `Sustained phase ${round1(sustainedWpm)} WPM vs ${round1(foundationWpm)} WPM opening pace` : (recentWpm.length >= 3 ? `Recent sustained average ${round1(average(recentWpm))} WPM` : "Placement Assessment sustained phase required"),
      !sustainabilityHasData ? "Technique Coach uses the opening and sustained Assessment phases to detect an early sprint that cannot be maintained." : sustainabilityRatio >= .94 ? "Your ending pace holds up well against your opening pace." : sustainabilityRatio >= .80 ? "Some fatigue or hesitation appears in longer text. Build endurance without forcing the first minute." : "Opening speed is not yet sustainable. Start slower and make the final paragraph look like the first.",
      sustainabilityRatio < .88 ? { type: "lesson", id: "smartLongControl", label: "Start Long-Word Control" } : { type: "lesson", id: "longWordEndurance", label: "Start Long-Word Endurance" }
    )
  ];

  const scored = metrics.filter(item => item.hasData);
  const aggregate = scored.length ? Math.round(average(scored.map(item => item.score))) : 0;
  const lowest = [...scored].sort((a, b) => a.score - b.score)[0] ?? null;
  const confidencePoints = (assessment ? 3 : 0) + Math.min(3, Math.floor(recent.length / 4)) + (weakKeys.length ? 1 : 0) + (pairHasData ? 1 : 0);
  const confidence = confidencePoints >= 7 ? "High" : confidencePoints >= 4 ? "Medium" : "Low";
  const level = !scored.length ? "Awaiting Diagnostic" : aggregate >= 94 ? "Advanced Control" : aggregate >= 86 ? "Controlled Typist" : aggregate >= 76 ? "Developing Technique" : "Foundation Rebuild";

  const priorities = [...metrics]
    .sort((a, b) => {
      if (a.hasData !== b.hasData) return a.hasData ? -1 : 1;
      return (a.score ?? 101) - (b.score ?? 101);
    })
    .slice(0, 3);

  const plan = priorities.map((item, index) => ({
    order: index + 1,
    title: item.title,
    reason: item.coaching,
    action: item.action
  }));

  if (!assessment) {
    plan.unshift({
      order: 0,
      title: "Establish a diagnostic baseline",
      reason: "Technique Coach can already use saved key history, but rhythm, mixed-key slowdown, correction behavior, and speed sustainability require a Placement Assessment.",
      action: { type: "screen", id: "assessment", label: "Take Placement Assessment" }
    });
  }

  return {
    aggregate,
    level,
    confidence,
    metrics,
    plan: plan.slice(0, 3),
    weakKeys,
    weakPairs,
    weakKeyLabel,
    weakPairLabel,
    assessment,
    recentSessions: recent.length,
    traineeCompleted,
    summary: lowest
      ? `${lowest.title} is the clearest current coaching priority.`
      : "Complete a Placement Assessment to establish a technique baseline."
  };
}
