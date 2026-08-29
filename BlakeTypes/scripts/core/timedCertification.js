import { hyperSoftShouldBypassTypingEvent } from "./accessibilityUtils.js";
export const CERTIFICATION_DURATIONS = [
  { id:"oneMinute", seconds:60, label:"1-Minute Test", short:"1 min", description:"A fast baseline check for warm-ups, quick comparisons, and repeatable personal-best attempts." },
  { id:"threeMinute", seconds:180, label:"3-Minute Test", short:"3 min", description:"Long enough to expose rhythm and accuracy drift without becoming a full endurance test." },
  { id:"fiveMinute", seconds:300, label:"5-Minute Test", short:"5 min", description:"The core HyperSoft timed test for sustained speed, accuracy, and realistic comparison over time." },
  { id:"tenMinute", seconds:600, label:"10-Minute Test", short:"10 min", description:"An endurance certification run that tests whether technique survives a genuinely sustained passage." }
];

export const CERTIFICATION_STANDARDS = [
  { id:"learning", label:"Learning", wpm:25, accuracy:95, note:"A forgiving starting standard for developing typists." },
  { id:"general", label:"General Office", wpm:35, accuracy:97, note:"A practical general-purpose training standard." },
  { id:"professional", label:"Professional", wpm:45, accuracy:98, note:"Higher sustained speed with strong first-attempt accuracy." },
  { id:"advanced", label:"Advanced", wpm:55, accuracy:98, note:"An ambitious local training target for experienced typists." },
  { id:"custom", label:"Custom Standard", wpm:40, accuracy:97, note:"Choose your own adjusted-WPM and accuracy targets." }
];

export const CERTIFICATION_CONTENT = [
  { id:"general", label:"General Prose", note:"Balanced everyday prose with ordinary capitalization and punctuation." },
  { id:"business", label:"Business Prose", note:"Professional correspondence, project notes, schedules, and workplace-style writing." },
  { id:"technical", label:"Technical Prose", note:"Technology and process-oriented material with denser vocabulary and occasional symbols." }
];

const CERTIFICATION_PASSAGES = {
  general: [
    "A reliable typing rhythm feels almost uneventful. The hands move in small patterns, the eyes stay on the source, and each word arrives without a dramatic pause. Speed grows from that consistency rather than from sudden bursts. When a difficult word appears, a skilled typist keeps the same calm pace and lets accurate movement do the work.",
    "Learning a keyboard is similar to learning a map. At first, every destination seems to require conscious thought. With practice, the route becomes familiar enough that attention can shift toward meaning instead of location. That change is important because useful typing is not merely pressing keys quickly; it is entering complete ideas while maintaining control.",
    "The morning began quietly, but the schedule filled by noon. Three short meetings moved to different rooms, a delivery arrived earlier than expected, and the afternoon appointment was pushed back by thirty minutes. None of the changes were serious, yet together they rewarded careful notes and a willingness to confirm details before acting.",
    "Good practice sessions have a clear purpose. One day may emphasize accuracy, another may focus on difficult letter transitions, and a third may build endurance. Repeating the same exercise without knowing what it is supposed to improve can become mechanical. A specific goal makes the result easier to understand and the next session easier to plan.",
    "A steady reader often becomes a steadier typist because the eyes learn to move ahead of the hands. Reading one or two words in advance gives the fingers time to prepare for what comes next. The goal is not to stare far down the page. It is simply to avoid treating every character as a surprise that must be solved individually.",
    "The old training room still had beige desks, heavy keyboards, and a wall clock that clicked loudly between exercises. Students worked through timed pages while the instructor walked behind them and reminded everyone to keep their shoulders relaxed. The equipment looked dated, but the central lesson remained useful: controlled technique lasts longer than frantic effort.",
    "Small errors can reveal large habits. Missing the same letter repeatedly may show that one finger is leaving its home position too early. Pausing before every capital letter may show that Shift has not become automatic. A useful practice program notices those patterns and turns them into specific work instead of offering the same generic advice after every test.",
    "A ten-minute typing test feels very different from a one-minute sprint. The opening minute may be fast, but later minutes expose tension, uneven rhythm, and unnecessary corrections. Endurance testing is valuable because most real typing tasks are not over in sixty seconds. Sustainable performance matters more than a brief peak that cannot be maintained.",
    "Before sending an important message, the writer reviewed the names, dates, and numbers one more time. The wording was already clear, but a mistyped figure could still create confusion. Careful proofreading did not erase the value of typing speed; it made that speed useful. Fast work only saves time when the final result is dependable.",
    "Practice becomes more interesting when progress is visible. A personal record can provide motivation, but averages and accuracy trends often tell a better story. One unusually fast run may be exciting, while ten consistent runs show a skill that is becoming reliable. The best measurement is the one that helps the learner choose what to practice next.",
    "The community center opened its doors at eight in the morning. Volunteers arranged chairs, checked the sign-in table, and placed printed directions near the entrance. By nine, families were arriving steadily. The event ran smoothly because the small details had been handled in advance instead of being left for the busiest moment of the day.",
    "A good workspace does not need to be elaborate. The keyboard should be positioned so the hands can reach it without stretching, the screen should be easy to read, and the chair should support a comfortable posture. The objective is to remove distractions and unnecessary strain so attention can remain on accurate, efficient keyboarding."
  ],
  business: [
    "The project team reviewed the revised schedule during Thursday's meeting. Two milestones remained unchanged, but the testing window moved forward by one week. Each coordinator agreed to confirm staffing by Friday afternoon and record any conflicts in the shared planning document before the next status call.",
    "Please review the attached summary before tomorrow's discussion. The first section lists completed actions, the second identifies items that still require confirmation, and the final section contains the proposed dates for implementation. Comments received before 3:00 PM will be included in the version distributed to the full group.",
    "A clear business message should tell the reader what happened, what action is needed, and when that action is expected. Extra detail can be useful, but only when it supports the decision. Strong workplace writing is usually easier to type because the structure is predictable: context first, request second, deadline or next step last.",
    "The monthly review found that response times improved in most categories. Routine requests were completed more quickly, while complex cases remained close to the previous average. Management asked the team to examine the small group of long-running items and determine whether additional guidance, staffing, or escalation rules would help.",
    "Meeting notes should distinguish decisions from discussion. A useful record identifies who owns the next action, the date it is due, and any condition that could change the plan. This prevents a common problem in which everyone remembers the conversation but nobody remembers exactly what was supposed to happen afterward.",
    "The vendor confirmed receipt of the revised document and asked for one final clarification regarding the delivery schedule. The analyst responded with the requested date, copied the project mailbox, and saved the correspondence with the contract file. No additional change to the approved amount was necessary.",
    "Before closing the task, the coordinator compared the final entry with the source document. The reference number matched, the effective date was correct, and the amount included two decimal places. A thirty-second verification prevented a much longer correction process later in the week.",
    "The training announcement was intentionally brief. It included the session title, location, start time, registration instructions, and a contact address for questions. Employees did not need a long explanation to decide whether to attend; they needed accurate information presented in a form that could be scanned quickly.",
    "A status report is most useful when it separates facts from assumptions. Completed work should be described clearly, unresolved issues should be labeled as such, and future dates should not be presented as guarantees unless they are actually confirmed. Precise language makes the document easier to trust and easier to update.",
    "The revised procedure will take effect on the first business day of next month. Supervisors should review the change with staff during their regular team meetings and send implementation questions to the central mailbox. Existing records do not need to be changed unless they are reopened for another reason.",
    "During the budget review, the group compared current spending with the forecast prepared earlier in the year. Several categories were nearly exact, while travel costs were lower than expected. The difference will remain uncommitted until the final quarter so that unexpected operational needs can still be addressed.",
    "The final memo was saved with a descriptive filename, placed in the approved shared folder, and sent only after the distribution list was checked. These small administrative steps are easy to overlook when work is rushed. They also prevent many avoidable problems involving duplicate drafts, missing recipients, and outdated attachments."
  ],
  technical: [
    "A troubleshooting process works best when each observation is recorded before the next change is made. If several settings are altered at once, a successful result does not reveal which change solved the problem. Controlled testing may feel slower, but it produces evidence that can be repeated, explained, and reversed when necessary.",
    "The application stores learner progress locally and does not require a network connection for ordinary use. A backup file can preserve profiles, settings, scores, and adaptive statistics. Before replacing a browser profile or moving to another device, exporting that data provides a simple recovery path if local storage is later cleared.",
    "Version numbers help distinguish a tested release from an earlier build. A useful release process records what changed, checks that expected files were generated, and verifies that packaged archives can be opened without corruption. The final version string should match the documentation, application interface, and exported metadata.",
    "When a program responds to keyboard events, cleanup matters as much as setup. A handler that remains active after the user leaves a screen can process input at the wrong time. Timers and animation callbacks can create similar problems. Reliable software removes or invalidates old activity state before a new activity begins.",
    "A local data file should be treated as untrusted input when it is imported. The program can verify expected fields, normalize numeric values, reject unsupported future schemas, and preserve existing data if the replacement cannot be saved. Defensive validation is less visible than a new feature, but it protects every feature that depends on stored information.",
    "Performance metrics need definitions that match the activity being measured. Ordinary typing tests often use a five-character word for WPM, while numeric data entry may use keystrokes per hour. Mixing those values into one chart would create a misleading comparison, so separate metrics should remain separate even when they are stored in the same learner profile.",
    "A test harness can catch structural errors before a release is packaged. Syntax checks find malformed JavaScript, archive tests detect damaged ZIP files, and static reference scans can reveal interface controls that point to missing elements. None of these checks replaces interactive testing, but together they reduce the number of simple failures that reach a user.",
    "Responsive design is not only about shrinking content. A navigation rail that works on a tall desktop can become unusable on a shorter laptop if every new module adds another fixed-height button. Good responsive rules preserve access to the interface while keeping the visual character of the original design.",
    "The browser's audio system may remain suspended until the user interacts with the page. Applications that generate sound should account for that behavior and provide an obvious test control. A feature technically exists only in a limited sense if users cannot tell whether it is enabled or whether their browser has permitted it to start.",
    "Adaptive training depends on the quality of the evidence it collects. A single missed key should not permanently label a character as weak. Repeated attempts provide a better signal, and recent performance can be compared with older history to determine whether a problem is persistent, improving, or simply the result of one unusual session.",
    "A session identifier is a simple way to prevent stale callbacks from finishing the wrong activity. Every new exercise receives a unique token, and delayed work checks that token before changing shared state. If the user quits one game and starts another, an old timer can fire harmlessly because it no longer belongs to the active session.",
    "Good software documentation explains both what a feature does and where its data lives. Users need to know whether settings are saved per profile, whether a backup includes custom presets, and whether a report is generated locally. Those details become especially important when an application grows from a small game into a complete training suite."
  ]
};

function certificationShuffle(values) {
  const out=[...values];
  for (let i=out.length-1;i>0;i-=1) {
    const j=Math.floor(Math.random()*(i+1));
    [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}

export function getCertificationDuration(id) {
  return CERTIFICATION_DURATIONS.find(item=>item.id===id) ?? null;
}

export function getCertificationStandard(id) {
  return CERTIFICATION_STANDARDS.find(item=>item.id===id) ?? CERTIFICATION_STANDARDS[1];
}

export function getCertificationContent(id) {
  return CERTIFICATION_CONTENT.find(item=>item.id===id) ?? CERTIFICATION_CONTENT[0];
}

export function buildCertificationText(contentId="general", durationSeconds=300) {
  const bank=CERTIFICATION_PASSAGES[contentId] ?? CERTIFICATION_PASSAGES.general;
  const minimum=Math.max(4500,Math.ceil((Number(durationSeconds)||300)*22));
  const parts=[];
  let chars=0;
  while (chars<minimum) {
    certificationShuffle(bank).forEach(paragraph=>{
      if (chars>=minimum) return;
      parts.push(paragraph);
      chars+=paragraph.length+2;
    });
  }
  return parts.join("\n\n");
}

export class TimedCertificationExercise {
  constructor({stage,engine,finish,config}) {
    this.stage=stage;
    this.engine=engine;
    this.finish=finish;
    this.config={...config};
    this.text=buildCertificationText(config.contentId,config.durationSeconds);
    this.cursor=0;
    this.running=false;
    this.finished=false;
    this.startedAt=null;
    this.timerId=null;
    this.scrollFrameId=null;
    this.typedAttempts=0;
    this.rawErrors=0;
    this.backspaces=0;
    this.correctPositions=0;
    this.pairAttemptedPositions=new Set();
    this.handleKeydown=this.handleKeydown.bind(this);
  }

  start() {
    this.running=true;
    this.stage.innerHTML=`
      <div class="certification-workstation">
        <div class="certification-titlebar">
          <div><small>HyperSoft Timed Testing Center</small><strong>${this.escape(this.config.durationLabel)}</strong></div>
          <span>STANDARDIZED TRAINING TEST</span>
        </div>
        <div class="certification-live-grid">
          <div><span>Gross WPM</span><strong id="certGrossWpm">0</strong><small>Physical typing pace</small></div>
          <div><span>Adjusted WPM</span><strong id="certAdjustedWpm">0</strong><small>Gross minus errors/min</small></div>
          <div><span>Accuracy</span><strong id="certAccuracy">100%</strong><small>Target ${this.config.targetAccuracy}%</small></div>
          <div><span>Raw Errors</span><strong id="certErrors">0</strong><small>Wrong first attempts</small></div>
          <div><span>Time Left</span><strong id="certTime">${this.formatTime(this.config.durationSeconds*1000)}</strong><small>${this.escape(this.config.standardLabel)} standard</small></div>
        </div>
        <div class="certification-standard-strip">
          <div><span>Passing standard</span><strong>${this.config.targetWpm} adjusted WPM · ${this.config.targetAccuracy}% accuracy</strong></div>
          <div><span>Content</span><strong>${this.escape(this.config.contentLabel)}</strong></div>
          <div><span>Clock</span><strong>Starts on first valid key</strong></div>
        </div>
        <section class="certification-document-shell">
          <div class="certification-doc-toolbar"><span>Timed Copy</span><span>First-attempt scoring</span><span class="active">${this.escape(this.config.durationLabel)}</span></div>
          <div class="certification-document" id="certDocument" tabindex="-1" aria-label="Timed certification passage"></div>
          <div class="certification-status-row"><span>Next</span><strong id="certNextKey">—</strong><small id="certStatus" aria-live="polite">Begin typing when ready. The clock starts with your first valid key.</small></div>
          <div class="certification-progress"><span id="certProgressFill"></span></div>
        </section>
        <div class="certification-method-note"><strong>Scoring method</strong><span>Gross WPM = physical character attempts ÷ 5 ÷ minutes. Adjusted WPM = gross WPM minus raw errors per minute. Accuracy uses correct first attempts divided by all scored attempts. HyperSoft results are local training documentation, not an employment credential.</span></div>
      </div>`;
    this.grossEl=this.stage.querySelector("#certGrossWpm");
    this.adjustedEl=this.stage.querySelector("#certAdjustedWpm");
    this.accuracyEl=this.stage.querySelector("#certAccuracy");
    this.errorsEl=this.stage.querySelector("#certErrors");
    this.timeEl=this.stage.querySelector("#certTime");
    this.documentEl=this.stage.querySelector("#certDocument");
    this.nextEl=this.stage.querySelector("#certNextKey");
    this.statusEl=this.stage.querySelector("#certStatus");
    this.progressEl=this.stage.querySelector("#certProgressFill");
    this.renderDocument();
    window.addEventListener("keydown",this.handleKeydown);
    this.timerId=window.setInterval(()=>{
      if (!this.running || !this.startedAt) return;
      this.updateMetrics();
      if (this.getElapsedMs()>=this.config.durationSeconds*1000) this.complete();
    },100);
    this.engine.updateHUD();
  }

  expected() { return this.text[this.cursor] ?? null; }

  normalizeEvent(event) {
    if (event.key==="Enter") return "\n";
    if (event.key.length===1) return event.key;
    return null;
  }

  handleKeydown(event) {
    if (!this.running || event.ctrlKey || event.metaKey || event.altKey) return;
    if (hyperSoftShouldBypassTypingEvent(event)) return;
    if (event.key==="Backspace") {
      event.preventDefault();
      if (!this.startedAt) return;
      this.backspaces+=1;
      this.engine.recordKeystroke(false,0,null);
      this.statusEl.textContent="Correction attempt recorded. Type the highlighted character to continue.";
      this.statusEl.className="bad";
      this.updateMetrics();
      return;
    }
    const typed=this.normalizeEvent(event);
    if (typed==null) return;
    const expected=this.expected();
    if (expected==null) return;
    event.preventDefault();
    if (!this.startedAt) {
      this.startedAt=performance.now();
      this.statusEl.textContent="Clock started. Keep the pace sustainable and protect first-attempt accuracy.";
    }
    const correct=typed===expected;
    this.typedAttempts+=1;
    const previous=this.cursor>0?this.text[this.cursor-1]:null;
    const pairKey=String(this.cursor);
    if (previous && !this.pairAttemptedPositions.has(pairKey)) {
      this.engine.recordPairAttempt(correct,previous,expected);
      this.pairAttemptedPositions.add(pairKey);
    }
    this.engine.recordKeystroke(correct,correct?.35:0,expected==="\n"?null:expected);
    if (correct) {
      this.correctPositions+=1;
      this.cursor+=1;
      this.statusEl.textContent=expected==="\n"?"Paragraph break accepted. Continue into the next passage.":"Correct. Read slightly ahead and keep the rhythm even.";
      this.statusEl.className="good";
      if (this.cursor>=this.text.length-2000) this.text += "\n\n" + buildCertificationText(this.config.contentId,this.config.durationSeconds);
    } else {
      this.rawErrors+=1;
      this.statusEl.textContent=`Expected ${this.describe(expected)} — received ${this.describe(typed)}.`;
      this.statusEl.className="bad";
      this.stage.classList.remove("certification-error-flash");
      void this.stage.offsetWidth;
      this.stage.classList.add("certification-error-flash");
    }
    this.renderDocument();
    this.updateMetrics();
    this.engine.updateHUD();
    if (this.getElapsedMs()>=this.config.durationSeconds*1000) this.complete();
  }

  getElapsedMs() {
    return this.startedAt?Math.max(0,performance.now()-this.startedAt):0;
  }

  getMinutes() {
    return Math.max(this.getElapsedMs()/60000,1/60);
  }

  getGrossWpm() {
    if (!this.startedAt) return 0;
    return (this.typedAttempts/5)/this.getMinutes();
  }

  getAdjustedWpm() {
    if (!this.startedAt) return 0;
    return Math.max(0,this.getGrossWpm()-(this.rawErrors/this.getMinutes()));
  }

  getAccuracy() {
    const attempts=this.typedAttempts+this.backspaces;
    return attempts?Math.max(0,Math.min(100,(this.correctPositions/attempts)*100)):100;
  }

  updateMetrics() {
    const gross=Math.round(this.getGrossWpm()*10)/10;
    const adjusted=Math.round(this.getAdjustedWpm()*10)/10;
    const accuracy=Math.round(this.getAccuracy()*10)/10;
    if (this.grossEl) this.grossEl.textContent=String(gross);
    if (this.adjustedEl) this.adjustedEl.textContent=String(adjusted);
    if (this.accuracyEl) this.accuracyEl.textContent=`${accuracy}%`;
    if (this.errorsEl) this.errorsEl.textContent=String(this.rawErrors);
    const total=this.config.durationSeconds*1000;
    const remaining=this.startedAt?Math.max(0,total-this.getElapsedMs()):total;
    if (this.timeEl) this.timeEl.textContent=this.formatTime(remaining);
    if (this.progressEl) this.progressEl.style.width=`${this.startedAt?Math.min(100,(this.getElapsedMs()/total)*100):0}%`;
  }

  renderDocument() {
    const start=Math.max(0,this.cursor-450);
    const end=Math.min(this.text.length,this.cursor+1500);
    const before=this.text.slice(start,this.cursor);
    const current=this.expected()??"";
    const after=this.text.slice(this.cursor+(current?1:0),end);
    const currentHtml=current
      ? current==="\n"?`<span class="certification-current certification-newline">↵</span><br>`:`<span class="certification-current">${this.formatText(current)}</span>`
      : "";
    this.documentEl.innerHTML=`<span class="certification-complete">${this.formatText(before)}</span>${currentHtml}<span class="certification-upcoming">${this.formatText(after)}</span>`;
    this.nextEl.textContent=this.displayKey(current);
    if (this.scrollFrameId) cancelAnimationFrame(this.scrollFrameId);
    this.scrollFrameId=requestAnimationFrame(()=>{
      this.scrollFrameId=null;
      this.documentEl.querySelector(".certification-current")?.scrollIntoView?.({block:"center",inline:"nearest"});
    });
  }

  complete() {
    if (this.finished) return;
    this.finished=true;
    this.running=false;
    window.clearInterval(this.timerId);
    this.timerId=null;
    if (this.scrollFrameId) cancelAnimationFrame(this.scrollFrameId);
    this.scrollFrameId=null;
    window.removeEventListener("keydown",this.handleKeydown);
    const durationMs=this.startedAt?Math.min(this.getElapsedMs(),this.config.durationSeconds*1000):0;
    const gross=Math.round(this.getGrossWpm()*10)/10;
    const adjusted=Math.round(this.getAdjustedWpm()*10)/10;
    const accuracy=Math.round(this.getAccuracy()*10)/10;
    const passed=durationMs>=this.config.durationSeconds*1000-750 && adjusted>=this.config.targetWpm && accuracy>=this.config.targetAccuracy;
    const weak=this.engine.getSessionWeakKeys(5).map(item=>`${this.displayKey(item.key)} ${Math.round(item.accuracy)}%`);
    if (passed) this.engine.addScore(750+Math.round(adjusted*10));
    this.finish({
      success:true,
      score:this.engine.score,
      wpm:adjusted,
      accuracy,
      durationMs,
      targetStatus:passed?"Passed":"Completed",
      variant:`${this.config.durationLabel} · ${this.config.standardLabel} · ${this.config.contentLabel}`,
      weakKeys:weak.length?weak.join(", "):"None",
      certificationDurationSeconds:this.config.durationSeconds,
      certificationGrossWpm:gross,
      certificationAdjustedWpm:adjusted,
      certificationRawErrors:this.rawErrors,
      certificationBackspaces:this.backspaces,
      certificationCharacters:this.correctPositions,
      certificationAttempts:this.typedAttempts,
      certificationStandardId:this.config.standardId,
      certificationStandardLabel:this.config.standardLabel,
      certificationTargetWpm:this.config.targetWpm,
      certificationTargetAccuracy:this.config.targetAccuracy,
      certificationContentId:this.config.contentId,
      certificationContentLabel:this.config.contentLabel,
      extraStats:[
        ["Gross WPM",gross],
        ["Adjusted WPM",adjusted],
        ["Raw errors",this.rawErrors],
        ["Corrections",this.backspaces],
        ["Characters entered",this.correctPositions],
        ["Standard",`${this.config.targetWpm} WPM / ${this.config.targetAccuracy}%`]
      ],
      title:passed?`${this.config.durationLabel}: Standard Passed`:`${this.config.durationLabel}: Test Complete`,
      message:passed
        ? `Timed test complete. You met the ${this.config.standardLabel} training standard with ${adjusted} adjusted WPM at ${accuracy}% accuracy.`
        : `Timed test complete. Result: ${adjusted} adjusted WPM at ${accuracy}% accuracy. Standard: ${this.config.targetWpm} adjusted WPM at ${this.config.targetAccuracy}% accuracy.`
    });
  }

  getHUDTime() {
    this.updateMetrics();
    return this.getElapsedMs();
  }

  stop() {
    this.running=false;
    window.clearInterval(this.timerId);
    this.timerId=null;
    if (this.scrollFrameId) cancelAnimationFrame(this.scrollFrameId);
    this.scrollFrameId=null;
    window.removeEventListener("keydown",this.handleKeydown);
  }

  displayKey(value) {
    if (value==="\n") return "Enter";
    if (value===" ") return "Space";
    return value||"Complete";
  }

  describe(value) {
    if (value==="\n") return "Enter";
    if (value===" ") return "Space";
    return value?`“${value}”`:"the end of the passage";
  }

  formatText(value="") {
    return this.escape(value).replaceAll("\n","<br>");
  }

  formatTime(ms=0) {
    const seconds=Math.max(0,Math.ceil(Number(ms)/1000));
    return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`;
  }

  escape(value="") {
    return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  }
}
