import { MODE_METADATA } from "./config.js";
import { LESSON_METADATA } from "./lessonConfig.js";
import { SMART_PRACTICE_MODES } from "./smartTypingContent.js";
import { REAL_WORLD_MODES } from "./realWorldTypingLab.js";
import { ACCURACY_CLINIC_PROTOCOLS } from "./accuracyClinic.js";
import { TEN_KEY_PROTOCOLS } from "./tenKeyAcademy.js";
import { PUNCTUATION_BUSINESS_PROTOCOLS } from "./punctuationBusinessLab.js";
import { CERTIFICATION_DURATIONS } from "./timedCertification.js";
import { normalizeDailyPlanState } from "./dailyTrainingPlan.js";
import { THEORY_TOPICS, normalizeTheoryProgress } from "./typingTheoryLibrary.js";
import { normalizeOnboardingState, normalizeNavigationState, SUITE_MODULE_CATALOG } from "./suiteIntegration.js";
import { normalizeCustomPracticeConfig } from "./customPracticeBuilder.js";

export const SYSTEM_ROUTE_MAP = {
  title:"titleScreen", game:"gameScreen", trainee:"traineeScreen", assessment:"assessmentScreen", technique:"techniqueScreen",
  dailyPlan:"dailyPlanScreen", theory:"theoryScreen", lessons:"lessonsScreen", smartPractice:"smartPracticeScreen",
  customPractice:"customPracticeScreen", realWorld:"realWorldScreen", accuracyClinic:"accuracyClinicScreen",
  tenKey:"tenKeyScreen", punctuation:"punctuationScreen", certification:"certificationScreen", menu:"menuScreen",
  progress:"progressScreen", reports:"reportsScreen", achievements:"achievementsScreen", office:"officeScreen",
  profiles:"profilesScreen", settings:"settingsScreen", scoreboard:"scoreboardScreen"
};

export const SYSTEM_REPORT_TYPES = [
  "typingCertificate", "curriculumCertificate", "lessonCertificate", "assessmentReport", "progressReport", "certificationResult"
];

const SYSTEM_ACTIVITY_TYPES = new Set([
  "lesson", "practice", "customPractice", "assessment", "realWorld", "accuracyClinic", "tenKey",
  "punctuation", "certification", "game", "tournament"
]);

function systemCheck(rows, category, id, label, ok, detail, severity="fail") {
  rows.push({category,id,label,ok:Boolean(ok),detail:String(detail ?? ""),severity:ok?"pass":severity});
}

function systemUniqueIds(rows=[]) {
  const ids=rows.map(item=>String(item?.id||"")).filter(Boolean);
  return {ids, unique:new Set(ids).size===ids.length};
}

function systemCatalogs(traineeIds=[]) {
  return [
    ["games",8,MODE_METADATA], ["lessons",14,LESSON_METADATA], ["smartPractice",9,SMART_PRACTICE_MODES],
    ["trainee",8,traineeIds.map(id=>({id}))], ["realWorld",6,REAL_WORLD_MODES],
    ["accuracyClinic",5,ACCURACY_CLINIC_PROTOCOLS], ["tenKey",6,TEN_KEY_PROTOCOLS],
    ["punctuation",6,PUNCTUATION_BUSINESS_PROTOCOLS], ["timedTests",4,CERTIFICATION_DURATIONS],
    ["theory",12,THEORY_TOPICS]
  ];
}

export function systemActionResolves(action, traineeIds=[]) {
  if (!action || typeof action!=="object") return false;
  const id=String(action.id||"");
  if (action.type==="screen") return new Set(Object.keys(SYSTEM_ROUTE_MAP)).has(id);
  if (action.type==="theory") return THEORY_TOPICS.some(item=>item.id===id);
  if (action.type==="assessment") return id==="typingAssessment";
  if (action.type==="lesson") return LESSON_METADATA.some(item=>item.id===id) || SMART_PRACTICE_MODES.some(item=>item.id===id);
  if (action.type==="accuracyClinic") return ACCURACY_CLINIC_PROTOCOLS.some(item=>item.id===id);
  if (action.type==="punctuation") return PUNCTUATION_BUSINESS_PROTOCOLS.some(item=>item.id===id);
  if (action.type==="tenKey") return TEN_KEY_PROTOCOLS.some(item=>item.id===id);
  if (action.type==="realWorld") return REAL_WORLD_MODES.some(item=>item.id===id);
  if (action.type==="certification") return CERTIFICATION_DURATIONS.some(item=>item.id===id);
  return false;
}

export function runHyperSoftSystemTortureTest({
  version="", traineeIds=[], navTargets=[], screenIds=[], domIds=[], reportTypes=[], dailyPlanState=null,
  presets=[], scores=[], profiles=[], profileProbe=null, navigationState=null, storageVolatile=false
}={}) {
  const checks=[];
  const catalogs=systemCatalogs(traineeIds);
  catalogs.forEach(([key,expected,rows])=>{
    const {ids,unique}=systemUniqueIds(rows);
    systemCheck(checks,"Catalogs",`${key}Count`,`${key} count`,rows.length===expected,`${rows.length}/${expected}`);
    systemCheck(checks,"Catalogs",`${key}Ids`,`${key} IDs unique`,unique,unique?"No duplicates":"Duplicate IDs found");
    systemCheck(checks,"Catalogs",`${key}Nonempty`,`${key} IDs populated`,ids.length===rows.length,`${ids.length}/${rows.length} IDs present`);
  });

  // v0.16.8 content/balance gates: catch accidentally thin pools or broken training curves.
  const lessonTargets=LESSON_METADATA.map(item=>Number(item.targetAccuracy)||0);
  const fixedPools=LESSON_METADATA.filter(item=>Array.isArray(item.tokens));
  const thinFixed=fixedPools.filter(item=>new Set(item.tokens).size<35);
  const invalidLessonTargets=LESSON_METADATA.filter(item=>!(Number(item.targetWpm)>=15 && Number(item.targetWpm)<=60 && Number(item.targetAccuracy)>=90 && Number(item.targetAccuracy)<=100));
  const tenKeyTargets=TEN_KEY_PROTOCOLS.map(item=>Number(item.targetKph)||0);
  const tenKeyAscending=tenKeyTargets.every((value,index)=>index===0 || value>=tenKeyTargets[index-1]);
  const smartAccuracy=SMART_PRACTICE_MODES.every(item=>Number(item.targetAccuracy)>=95);
  systemCheck(checks,"Content Balance","lessonTargets","Curriculum targets stay instructional",invalidLessonTargets.length===0,invalidLessonTargets.length?invalidLessonTargets.map(x=>x.id).join(", "):"All 14 lessons remain within audited WPM/accuracy bands");
  systemCheck(checks,"Content Balance","fixedPools","Fixed lesson pools have useful variety",thinFixed.length===0,thinFixed.length?thinFixed.map(x=>`${x.id}:${new Set(x.tokens).size}`).join(", "):fixedPools.map(x=>`${x.id}:${new Set(x.tokens).size}`).join(" · "));
  systemCheck(checks,"Content Balance","smartAccuracy","Smart Practice protects precision",smartAccuracy,"All nine targeted drills require at least 95% accuracy");
  systemCheck(checks,"Content Balance","tenKeyCurve","10-Key KPH curve is progressive",tenKeyAscending,tenKeyTargets.join(" → "));
  systemCheck(checks,"Content Balance","lessonAccuracyCurve","Curriculum accuracy expectations do not regress sharply",lessonTargets.every((v,i)=>i===0 || v>=lessonTargets[i-1]-2),lessonTargets.join(" → "));

  const routeKeys=Object.keys(SYSTEM_ROUTE_MAP);
  const screens=new Set(screenIds);
  const nav=new Set(navTargets);
  const missingScreens=routeKeys.filter(key=>!screens.has(SYSTEM_ROUTE_MAP[key]));
  const missingNav=SUITE_MODULE_CATALOG.map(item=>item.id).filter(id=>!nav.has(id));
  systemCheck(checks,"Routing","screens","All routed screens exist",missingScreens.length===0,missingScreens.length?missingScreens.join(", "):"All route targets present");
  systemCheck(checks,"Routing","catalogNav","Module catalog resolves to navigation",missingNav.length===0,missingNav.length?missingNav.join(", "):"All catalog modules routable");
  systemCheck(checks,"Routing","domIds","DOM IDs are unique",new Set(domIds).size===domIds.length,`${domIds.length-new Set(domIds).size} duplicate IDs`);

  const normalizedPlan=normalizeDailyPlanState(dailyPlanState);
  const badPlanSteps=(normalizedPlan?.steps||[]).filter(step=>!systemActionResolves(step.action,traineeIds));
  systemCheck(checks,"State","dailyPlanActions","Daily Plan actions resolve",badPlanSteps.length===0,badPlanSteps.length?badPlanSteps.map(x=>x.action?.id).join(", "):"All persisted actions valid");
  const corruptPlan=normalizeDailyPlanState({durationMinutes:999,steps:[{id:"bad",minutes:99,action:{type:"lesson",id:"definitely_missing"}},{id:"good",minutes:-9,action:{type:"assessment",id:"typingAssessment"}}],completedStepIds:["bad","missing"]});
  const corruptPlanSafe=corruptPlan?.durationMinutes===20 && corruptPlan.steps.length===1 && corruptPlan.steps[0].id==="good" && corruptPlan.steps[0].minutes===1 && corruptPlan.completedStepIds.length===0;
  systemCheck(checks,"Recovery","dailyPlanRepair","Malformed Daily Plan is repaired",corruptPlanSafe,corruptPlanSafe?"Invalid action removed; values clamped":"Normalizer left an impossible plan state");

  const corruptConfig=normalizeCustomPracticeConfig({focus:"???",minLength:99,maxLength:-5,durationMinutes:999,targetWpm:-10,targetAccuracy:500});
  const customSafe=corruptConfig.minLength>=2 && corruptConfig.maxLength>=corruptConfig.minLength && corruptConfig.durationMinutes<=10 && corruptConfig.targetWpm>=10 && corruptConfig.targetAccuracy<=100;
  systemCheck(checks,"Recovery","customRepair","Malformed Practice Builder config is repaired",customSafe,customSafe?"Ranges and enums normalized":"Practice Builder normalization failed");
  const badPresetIds=presets.map(item=>String(item?.id||"")).filter(Boolean);
  const badPresetNames=presets.map(item=>String(item?.name||"").trim().toLowerCase()).filter(Boolean);
  systemCheck(checks,"State","presetLimit","Saved preset count is bounded",presets.length<=8,`${presets.length}/8`);
  systemCheck(checks,"State","presetIds","Saved preset IDs are unique",new Set(badPresetIds).size===badPresetIds.length,"Duplicate preset IDs can make Load/Delete ambiguous");
  systemCheck(checks,"State","presetNames","Saved preset names are unique",new Set(badPresetNames).size===badPresetNames.length,"Duplicate preset names can make replacement ambiguous");

  const onboarding=normalizeOnboardingState({completed:"yes",experience:"???",goal:"???",sessionMinutes:999,completedAt:-2});
  systemCheck(checks,"Recovery","onboardingRepair","Malformed onboarding state is repaired",onboarding.completed===false && onboarding.experience==="unknown" && onboarding.goal==="general" && onboarding.sessionMinutes===20 && onboarding.completedAt===0,"Defaults restored without throwing");
  const navigation=normalizeNavigationState(navigationState);
  const navigationIds=new Set(SUITE_MODULE_CATALOG.map(item=>item.id));
  const liveNavigationSafe=navigation.favorites.every(id=>navigationIds.has(id)) && navigation.recent.every(row=>navigationIds.has(row.id)) && (!navigation.lastModule || navigationIds.has(navigation.lastModule));
  systemCheck(checks,"State","navigationState","Navigation favorites/recent state resolves",liveNavigationSafe,liveNavigationSafe?`${navigation.favorites.length} favorites · ${navigation.recent.length} recent`:`Invalid module reference retained`);
  const brokenNavigation=normalizeNavigationState({favorites:["lessons","missing","lessons","assessment","menu","theory","tenKey","reports","settings","office"],recent:[{id:"missing",visitedAt:-5},{id:"lessons",visitedAt:-1},{id:"lessons",visitedAt:55},{id:"assessment",visitedAt:20}],lastModule:"missing",lastVisitedAt:-99});
  const brokenNavigationSafe=brokenNavigation.favorites.length===8 && !brokenNavigation.favorites.includes("missing") && new Set(brokenNavigation.favorites).size===brokenNavigation.favorites.length && brokenNavigation.recent.length===2 && brokenNavigation.recent[0].id==="lessons" && brokenNavigation.lastModule==="lessons" && brokenNavigation.lastVisitedAt===0;
  systemCheck(checks,"Recovery","navigationRepair","Malformed Favorites/Recent history is repaired",brokenNavigationSafe,brokenNavigationSafe?"Unknown/duplicate modules removed; bounds restored":"Navigation state normalizer left an impossible value");
  const theory=normalizeTheoryProgress({bogus:{reviewed:true},touchTyping:{reviewed:"yes",quizCorrect:"yes",quizAttempts:-5,lastReviewedAt:-1}});
  const theorySafe=!theory.bogus && theory.touchTyping && theory.touchTyping.reviewed===false && theory.touchTyping.quizCorrect===false && theory.touchTyping.quizAttempts===0;
  systemCheck(checks,"Recovery","theoryRepair","Malformed Learning Center progress is repaired",theorySafe,theorySafe?"Unknown topics dropped; fields normalized":"Theory normalization left invalid state");

  const expectedReports=new Set(SYSTEM_REPORT_TYPES);
  const actualReports=new Set(reportTypes);
  const missingReports=SYSTEM_REPORT_TYPES.filter(type=>!actualReports.has(type));
  systemCheck(checks,"Reports","reportHandlers","All report types have handlers",missingReports.length===0,missingReports.length?missingReports.join(", "):"All report routes resolve");

  const unknownTypes=scores.filter(row=>row?.activityType && !SYSTEM_ACTIVITY_TYPES.has(String(row.activityType))).length;
  systemCheck(checks,"History","scoreTypes","Score history uses known activity types",unknownTypes===0,unknownTypes?`${unknownTypes} legacy/unknown rows retained safely`:"All activity types recognized",unknownTypes?"warn":"fail");
  const profileIds=profiles.map(item=>String(item?.id||"")).filter(Boolean);
  const profileNames=profiles.map(item=>String(item?.name||"").trim().toLowerCase()).filter(Boolean);
  systemCheck(checks,"Profiles","profileIds","Profile IDs are unique",new Set(profileIds).size===profileIds.length,`${profiles.length} profiles checked`);
  systemCheck(checks,"Profiles","profileNames","Profile names are unique",new Set(profileNames).size===profileNames.length,"Duplicate names repaired on restore/load",new Set(profileNames).size===profileNames.length?"fail":"warn");
  if (profileProbe) {
    systemCheck(checks,"Recovery","profileProbe","Synthetic corrupt profile normalizes safely",profileProbe.ok===true,profileProbe.detail||"Profile normalization probe failed");
  }
  systemCheck(checks,"Storage","storage","Browser storage is writable",!storageVolatile,storageVolatile?"Session is volatile":"Storage wrapper reports available",storageVolatile?"warn":"fail");

  const failed=checks.filter(item=>item.severity==="fail").length;
  const warnings=checks.filter(item=>item.severity==="warn").length;
  const passed=checks.filter(item=>item.severity==="pass").length;
  return {version:String(version||"unknown"),checks,passed,warnings,failed,total:checks.length,status:failed?"FAIL":warnings?"WARN":"PASS"};
}
