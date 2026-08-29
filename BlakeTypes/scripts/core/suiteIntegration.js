export const SUITE_MODULE_CATALOG = [
  { id:"trainee", title:"Keyboard Trainee", icon:"⌨", group:"Start Here", description:"Learn home position, finger zones, eyes-up technique, rhythm, Shift, and basic control-key habits.", tags:["beginner","technique","foundation"] },
  { id:"assessment", title:"Typing Assessment", icon:"✓", group:"Start Here", description:"A placement diagnostic for sustainable speed, first-attempt accuracy, rhythm, keyboard range, and weak-key evidence.", tags:["assessment","placement","baseline"] },
  { id:"technique", title:"Technique Coach", icon:"◇", group:"Guidance", description:"Interprets how you type: rhythm, corrections, Shift/punctuation fluency, transitions, and speed sustainability.", tags:["coach","analysis","technique"] },
  { id:"dailyPlan", title:"Daily Training Plan", icon:"☷", group:"Guidance", description:"Builds a profile-specific 10-, 20-, or 30-minute practice sequence from your current evidence.", tags:["adaptive","routine","recommendation"] },
  { id:"theory", title:"Learning Center", icon:"?", group:"Guidance", description:"Typing theory, WPM math, rhythm, motor learning, Shift technique, 10-key concepts, practice design, and ergonomics fundamentals.", tags:["theory","reference","learning"] },
  { id:"lessons", title:"Formal Lessons", icon:"▣", group:"Core Training", description:"Fourteen structured curriculum lessons from home row through full-keyboard endurance and adaptive weak-key work.", tags:["curriculum","structured","lesson"] },
  { id:"smartPractice", title:"Smart Practice", icon:"💡", group:"Core Training", description:"Nine focused drills for short/long words, hand balance, awkward transitions, same-finger movement, and trouble pairs.", tags:["practice","adaptive","drill"] },
  { id:"customPractice", title:"Practice Builder", icon:"⚒", group:"Core Training", description:"Build timed drills around chosen keys, pairs, vocabulary, punctuation, number row, duration, WPM, and accuracy.", tags:["custom","practice","weakness"] },
  { id:"accuracyClinic", title:"Accuracy Clinic", icon:"✓", group:"Specialty Training", description:"Precision-first protocols with strict accuracy gates, clean streaks, substitution review, and deliberate remediation.", tags:["accuracy","precision","errors"] },
  { id:"punctuation", title:"Punctuation Lab", icon:";", group:"Specialty Training", description:"Shift combinations, quotes, apostrophes, business punctuation, paths/URLs, symbols, and business-writing mastery.", tags:["punctuation","shift","business"] },
  { id:"tenKey", title:"10-Key Academy", icon:"#", group:"Specialty Training", description:"Numeric keypad home position, columns, decimals, Enter rhythm, accounting entry, KPH, and proficiency testing.", tags:["numeric","numpad","kph"] },
  { id:"realWorld", title:"Real-World Lab", icon:"▤", group:"Applied Skills", description:"Exact-entry simulations for email, memos, contacts, file paths, forms, numeric records, and document transcription.", tags:["work","applied","transcription"] },
  { id:"certification", title:"Timed Tests", icon:"T", group:"Measurement", description:"Formal 1-, 3-, 5-, and 10-minute tests with Gross WPM, Adjusted WPM, accuracy, raw errors, and printable result sheets.", tags:["test","wpm","benchmark"] },
  { id:"menu", title:"Typing Arcade", icon:"✣", group:"Arcade", description:"Eight typing games plus randomized challenges and tournaments for skill reinforcement and variety.", tags:["games","arcade","fun"] },
  { id:"progress", title:"Progress", icon:"↗", group:"Records", description:"Detailed training history, trends, mastery, weak keys/pairs, personal bests, heatmaps, and activity mix.", tags:["progress","analytics","history"] },
  { id:"reports", title:"Reports", icon:"▤", group:"Records", description:"Printable certificates, assessments, progress reports, and timed-test result sheets generated from the active learner file.", tags:["reports","print","certificate"] },
  { id:"achievements", title:"Achievements", icon:"★", group:"Records", description:"Retro badges and points for sustained practice, curriculum progress, game accomplishments, and typing milestones.", tags:["badges","milestones","progress"] },
  { id:"scoreboard", title:"Scoreboard", icon:"#", group:"Records", description:"A compact activity ledger for lessons, practice, applied labs, tests, numeric work, games, and tournaments.", tags:["scores","records","history"] },
  { id:"office", title:"Blake's Office", icon:"B", group:"HyperSoft", description:"Blake advice, Compliance rebuttals, corporate notices, incident history, and other unnecessary HyperSoft lore.", tags:["blake","humor","office"] },
  { id:"profiles", title:"Profiles & Backup", icon:"●", group:"HyperSoft", description:"Manage independent learner records, profile exports, full backups, restore, and reset/recovery operations.", tags:["profiles","backup","save"] },
  { id:"settings", title:"Settings & Diagnostics", icon:"⚙", group:"HyperSoft", description:"Difficulty, vocabulary, themes, sound, multimedia, keyboard coaching, startup preferences, and suite diagnostics.", tags:["settings","diagnostics","theme"] }
];

export const ONBOARDING_DEFAULTS = {
  completed:false,
  experience:"unknown",
  goal:"general",
  sessionMinutes:20,
  completedAt:0,
  lastOpenedAt:0
};

export const NAVIGATION_DEFAULTS = {
  favorites:[],
  recent:[],
  lastModule:"",
  lastVisitedAt:0
};

function suiteValidModuleId(id) {
  return SUITE_MODULE_CATALOG.some(item=>item.id===String(id||""));
}

export function normalizeNavigationState(value) {
  const raw=value && typeof value==="object" && !Array.isArray(value) ? value : {};
  const favorites=[];
  (Array.isArray(raw.favorites)?raw.favorites:[]).forEach(id=>{
    id=String(id||"");
    if (suiteValidModuleId(id) && !favorites.includes(id) && favorites.length<8) favorites.push(id);
  });
  const recent=[];
  (Array.isArray(raw.recent)?raw.recent:[]).forEach(item=>{
    const id=String(typeof item==="string"?item:item?.id||"");
    if (!suiteValidModuleId(id) || recent.some(row=>row.id===id) || recent.length>=8) return;
    recent.push({id,visitedAt:Math.max(0,Number(typeof item==="string"?0:item?.visitedAt)||0)});
  });
  let lastModule=String(raw.lastModule||"");
  if (!suiteValidModuleId(lastModule)) lastModule=recent[0]?.id||"";
  return {
    favorites,
    recent,
    lastModule,
    lastVisitedAt:Math.max(0,Number(raw.lastVisitedAt)||0)
  };
}

export function recordSuiteModuleVisit(value,id,visitedAt=Date.now()) {
  const state=normalizeNavigationState(value);
  id=String(id||"");
  if (!suiteValidModuleId(id)) return state;
  state.recent=[{id,visitedAt:Math.max(0,Number(visitedAt)||Date.now())},...state.recent.filter(row=>row.id!==id)].slice(0,8);
  state.lastModule=id;
  state.lastVisitedAt=Math.max(0,Number(visitedAt)||Date.now());
  return state;
}

export function toggleSuiteModuleFavorite(value,id) {
  const state=normalizeNavigationState(value);
  id=String(id||"");
  if (!suiteValidModuleId(id)) return state;
  if (state.favorites.includes(id)) state.favorites=state.favorites.filter(item=>item!==id);
  else state.favorites=[...state.favorites,id].slice(-8);
  return state;
}

export function getSuiteModule(id) {
  return SUITE_MODULE_CATALOG.find(item=>item.id===String(id||"")) ?? null;
}

export function normalizeOnboardingState(value) {
  const raw=value && typeof value==="object" && !Array.isArray(value) ? value : {};
  const experience=new Set(["unknown","new","some","confident"]).has(raw.experience) ? raw.experience : "unknown";
  const goal=new Set(["general","accuracy","speed","work","numeric","fun"]).has(raw.goal) ? raw.goal : "general";
  const sessionMinutes=[10,20,30].includes(Number(raw.sessionMinutes)) ? Number(raw.sessionMinutes) : 20;
  return {
    completed:raw.completed===true,
    experience,
    goal,
    sessionMinutes,
    completedAt:Math.max(0,Number(raw.completedAt)||0),
    lastOpenedAt:Math.max(0,Number(raw.lastOpenedAt)||0)
  };
}

function integrationPushUnique(rows, item) {
  if (!item || rows.some(row=>row.id===item.id)) return;
  rows.push(item);
}

export function buildSuiteRecommendedPath({onboarding={},scores=[],traineeComplete=false,assessment=null,lessonMastered=0,lessonTotal=14,weakKeys=[],weakPairs=[]}={}) {
  const state=normalizeOnboardingState(onboarding);
  const rows=[];
  const history=Array.isArray(scores)?scores.filter(row=>row&&typeof row==="object"):[];
  const recent=history.slice(-12);
  const trainingRecent=recent.filter(row=>!["game","arcade"].includes(String(row.activityType||"")));
  const avg=(key,rows=trainingRecent)=>{const vals=rows.map(r=>Number(r?.[key])).filter(Number.isFinite);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;};
  const recentAccuracy=avg("accuracy");
  const recentWpm=avg("wpm");
  const rhythmRows=trainingRecent.filter(r=>Number.isFinite(Number(r.rhythmScore)));
  const recentRhythm=avg("rhythmScore",rhythmRows);
  const hesitationRows=trainingRecent.filter(r=>Number.isFinite(Number(r.hesitations)));
  const recentHesitations=avg("hesitations",hesitationRows);
  const latestAssessment=assessment||[...history].reverse().find(r=>r.activityType==="assessment"||r.placementDestination);
  const hasAssessment=Boolean(latestAssessment);
  const sessions=history.length;
  const unfinished=Math.max(0,(Number(lessonTotal)||14)-(Number(lessonMastered)||0));
  const evidenceCount=[hasAssessment,recentAccuracy!=null,recentWpm!=null,recentRhythm!=null,weakKeys.length>0,weakPairs.length>0,sessions>=3].filter(Boolean).length;
  const push=(id,label,reason,priority=50,signal="Profile")=>integrationPushUnique(rows,{id,label,reason,priority,signal});

  // Evidence outranks preference when there is a clear training problem.
  if ((recentAccuracy!=null && recentAccuracy<94) || weakKeys.length>=3 || weakPairs.length>=2) {
    const detail=weakKeys.length?` Persistent weak keys include ${weakKeys.slice(0,4).map(x=>String(x.key||"").toUpperCase()).filter(Boolean).join(", ")}.`:"";
    push("accuracyClinic","Repair Accuracy Before Adding Speed",`Recent first-attempt accuracy is ${recentAccuracy!=null?Math.round(recentAccuracy)+"%":"inconsistent"}.${detail} HyperSoft is prioritizing precision because speed work on unstable movement tends to preserve the errors.`,130,"Accuracy evidence");
  }
  if ((recentRhythm!=null && recentRhythm<78) || (recentHesitations!=null && recentHesitations>=10)) {
    push("smartPractice","Smooth Rhythm & Hesitation",`Recent timing evidence shows ${recentRhythm!=null?Math.round(recentRhythm)+"% rhythm":"uneven rhythm"}${recentHesitations!=null?` and about ${Math.round(recentHesitations)} hesitations per measured session`:""}. Use focused repetition before another benchmark.`,122,"Timing evidence");
  }
  if (weakPairs.length && !rows.some(r=>r.id==="smartPractice")) {
    push("smartPractice","Target Trouble Pairs",`Repeated transition errors are established around ${weakPairs.slice(0,3).map(x=>String(x.pair||"").toUpperCase()).filter(Boolean).join(", ")}. Smart Practice can bias repetition toward those movements.`,118,"Transition evidence");
  }

  if ((state.experience==="new"||state.experience==="unknown")&&!traineeComplete) push("trainee","Finish Keyboard Trainee","Foundation stations are still incomplete. HyperSoft will not treat raw WPM as the main problem until basic home-position and finger-zone technique has been covered.",125,"Unfinished foundation");
  if (!hasAssessment) push("assessment","Establish a Placement Baseline","There is no sustained placement sample yet. The assessment gives HyperSoft rhythm, hesitation, keyboard-range, speed, and accuracy evidence for later recommendations.",120,"Missing baseline");

  if (latestAssessment?.placementDestination && getSuiteModule(latestAssessment.placementDestination)) {
    const mod=getSuiteModule(latestAssessment.placementDestination);
    push(mod.id,`Follow Placement: ${mod.title}`,latestAssessment.placementDetail||`Your latest placement assessment points to ${mod.title} as the most useful starting level.`,112,"Assessment result");
  }

  if (unfinished>0 && Number(lessonMastered)<Number(lessonTotal)) {
    push("lessons",`Continue Formal Curriculum (${lessonMastered}/${lessonTotal})`,`You still have ${unfinished} formal lesson target${unfinished===1?"":"s"} to master. Curriculum progress remains a high-value recommendation because it expands keyboard coverage systematically.`,state.goal==="general"?105:82,"Curriculum progress");
  }

  // Goal-specific branches remain important, but they now sit behind urgent evidence.
  if (state.goal==="numeric") {
    push("tenKey","Build Numeric Technique","Your stated goal emphasizes numeric entry, so 10-Key Academy remains the primary specialty branch.",104,"Training goal");
    push("theory","Review 10-Key Theory","Reinforce 4-5-6 home position, finger columns, KPH, and keypad discipline before chasing numeric speed.",66,"Training goal");
  } else if (state.goal==="fun") {
    push("menu","Open the Typing Arcade","Arcade training is your stated priority. HyperSoft will still surface accuracy or technique work first when the evidence says a problem is persistent.",88,"Training goal");
  } else if (state.goal==="accuracy") {
    push("accuracyClinic","Prioritize Accuracy Clinic",weakKeys.length||weakPairs.length?"Your goal and adaptive error history agree: precision-first remediation is the strongest next move.":"Use first-attempt accuracy gates and clean-streak training to make reliable movement automatic.",108,"Goal + profile");
  } else if (state.goal==="speed") {
    push("smartPractice","Build Sustainable Speed",recentAccuracy!=null&&recentAccuracy<96?"Speed remains your goal, but HyperSoft will emphasize controlled repetition until accuracy is stable enough to support it.":"Your accuracy is stable enough for focused speed development without reducing practice to a single timed-test number.",96,"Training goal");
    if (sessions>=3) push("certification","Benchmark With a Timed Test","You have enough recent practice history for a timed benchmark to be meaningful. Compare Gross WPM, Adjusted WPM, accuracy, and raw errors.",72,"Benchmark timing");
  } else if (state.goal==="work") {
    push("realWorld","Practice Applied Typing","Your workplace goal makes structured email, forms, paths, addresses, and transcription a useful bridge from drills to practical typing.",94,"Training goal");
    push("punctuation","Strengthen Business Punctuation","Professional typing depends on fluent Shift, apostrophe, quote, slash, symbol, and punctuation movement.",78,"Training goal");
  }

  if (sessions>=4) push("dailyPlan","Use Today's Evidence-Based Plan",`HyperSoft has ${evidenceCount} major evidence channels available and can assemble a ${state.sessionMinutes}-minute sequence around the strongest needs instead of making you choose drills manually.`,90,"Combined evidence");
  if (sessions>0) push("technique","Review Technique Coach","Technique Coach translates accumulated speed, accuracy, rhythm, correction, mixed-key, and sustainability evidence into movement priorities.",64,"Profile review");
  if (!sessions) push("theory","Use the Learning Center","Review accuracy, WPM, rhythm, Shift, motor learning, and practice design while HyperSoft builds enough performance history for stronger recommendations.",55,"Low evidence");

  return rows.sort((a,b)=>(b.priority||0)-(a.priority||0)).slice(0,4);
}
export const MODULE_DISCOVERY_GROUPS = [
  {name:"Start & Guidance", groups:["Start Here","Guidance"]},
  {name:"Core Training", groups:["Core Training"]},
  {name:"Specialty & Applied", groups:["Specialty Training","Applied Skills"]},
  {name:"Tests & Records", groups:["Measurement","Records"]},
  {name:"Typing Arcade", groups:["Arcade"]},
  {name:"HyperSoft Tools", groups:["HyperSoft"]}
];
const MODULE_SEARCH_ALIASES={trainee:["new user","beginner","start","fundamentals","home row"],assessment:["test me","placement","baseline"],dailyPlan:["what next","recommend","today","routine"],theory:["help","manual","keyboard theory"],lessons:["course","curriculum","learn"],smartPractice:["drill","weak keys","practice"],customPractice:["builder","custom drill"],accuracyClinic:["mistakes","errors","precision"],punctuation:["symbols","shift keys","quotes"],tenKey:["10 key","ten key","number pad","numeric keypad"],realWorld:["office","work typing","email","forms"],certification:["timed test","typing test","benchmark"],menu:["games","fun"],progress:["stats","analytics","history"],reports:["print","certificate"],achievements:["badges","awards"],scoreboard:["scores","ledger"],office:["blake","lore"],profiles:["save","backup","restore","learner"],settings:["options","sound","theme","diagnostics"]};
export function getModuleCatalogGroups(){return MODULE_DISCOVERY_GROUPS.map(section=>({name:section.name,items:SUITE_MODULE_CATALOG.filter(item=>section.groups.includes(item.group))})).filter(section=>section.items.length);}
export function filterModuleCatalog(query=""){const q=String(query||"").trim().toLowerCase();if(!q)return SUITE_MODULE_CATALOG;const terms=q.split(/\s+/).filter(Boolean);return SUITE_MODULE_CATALOG.filter(item=>{const haystack=[item.title,item.group,item.description,...item.tags,...(MODULE_SEARCH_ALIASES[item.id]||[])].join(" ").toLowerCase();return terms.every(term=>haystack.includes(term));});}
export function getSmartContinueModule(navigationState,recommendedPath=[]){const state=normalizeNavigationState(navigationState);const resumable=new Set(["trainee","assessment","technique","dailyPlan","theory","lessons","smartPractice","customPractice","accuracyClinic","punctuation","tenKey","realWorld","certification","menu"]);const recentTraining=state.recent.find(row=>resumable.has(row.id)&&getSuiteModule(row.id));const last=resumable.has(state.lastModule)?getSuiteModule(state.lastModule):null;const recommended=(Array.isArray(recommendedPath)?recommendedPath:[]).map(row=>getSuiteModule(row?.id)).find(Boolean);return{module:last||(recentTraining?getSuiteModule(recentTraining.id):null)||recommended||getSuiteModule("trainee"),usedRecommendation:!last&&!recentTraining};}

export function buildDiagnosticsSummary({version="",storageVolatile=false,profiles=0,activeProfile="",counts={},dom={}}={}) {
  const expected={games:8,lessons:14,smartPractice:9,trainee:8,accuracyClinic:5,tenKey:6,punctuation:6,timedTests:4,theory:12};
  const checks=[];
  Object.entries(expected).forEach(([key,value])=>{
    const actual=Number(counts[key]);
    checks.push({id:key,label:key,ok:actual===value,detail:`${Number.isFinite(actual)?actual:"?"}/${value}`});
  });
  checks.push({id:"duplicateIds",label:"Duplicate HTML IDs",ok:Number(dom.duplicateIds||0)===0,detail:String(Number(dom.duplicateIds||0))});
  checks.push({id:"navTargets",label:"Navigation targets",ok:Number(dom.missingNavTargets||0)===0,detail:Number(dom.missingNavTargets||0)?`${dom.missingNavTargets} missing`:"All resolved"});
  checks.push({id:"dialogLabels",label:"Dialog labels",ok:Number(dom.unlabeledDialogs||0)===0,detail:Number(dom.unlabeledDialogs||0)?`${dom.unlabeledDialogs} unlabeled`:"All labeled"});
  checks.push({id:"skipTarget",label:"Skip-link target",ok:dom.skipTargetFocusable===true,detail:dom.skipTargetFocusable?"Focusable":"Needs tabindex"});
  checks.push({id:"liveRegions",label:"Live status regions",ok:Number(dom.liveRegions||0)>=3,detail:`${Number(dom.liveRegions||0)} available`});
  checks.push({id:"motion",label:"Motion preference",ok:new Set(["system","reduced"]).has(String(dom.motionPreference||"")),detail:String(dom.motionPreference||"unknown")});
  checks.push({id:"storage",label:"Browser storage",ok:!storageVolatile,detail:storageVolatile?"Volatile / unavailable":"Available"});
  return {
    version:String(version||"unknown"),
    profiles:Math.max(0,Number(profiles)||0),
    activeProfile:String(activeProfile||"Unknown"),
    checks,
    passed:checks.filter(item=>item.ok).length,
    total:checks.length
  };
}
