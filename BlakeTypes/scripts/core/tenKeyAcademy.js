import { hyperSoftShouldBypassTypingEvent } from "./accessibilityUtils.js";
export const TEN_KEY_PROTOCOLS = [
  {
    id:"homeRow",
    number:"01",
    title:"Keypad Home Position",
    subtitle:"Learn the 4-5-6 home row, the raised marker on 5, and the right-hand finger map.",
    icon:"5",
    tags:["4-5-6 Home", "Finger Map", "Foundation"],
    targetKph:3200,
    accuracyGate:98,
    strictNumpad:false,
    groups:["456","654","445566","546","465","564","444 555 666","456 456 654","546 645 465"],
    guide:[
      "Rest the right index finger on 4, middle finger on 5, and ring finger on 6. Many full-size keypads provide a tactile marker on 5.",
      "The same three fingers normally travel vertically: index handles 1/4/7, middle handles 2/5/8, and ring handles 3/6/9.",
      "Use the thumb for 0. Enter and arithmetic keys are generally reached with the little finger or ring/little-finger area depending on keyboard and training method.",
      "This first protocol accepts either the numeric keypad or number row so learners without a separate keypad can study the layout."
    ]
  },
  {
    id:"columns",
    number:"02",
    title:"Vertical Columns",
    subtitle:"Build automatic movement through 1-4-7, 2-5-8, and 3-6-9.",
    icon:"↕",
    tags:["Columns", "Finger Zones", "Rhythm"],
    targetKph:4200,
    accuracyGate:98,
    strictNumpad:false,
    groups:["147","741","258","852","369","963","174 285 396","714 825 936","123 456 789","789 456 123","159 357 951","753 951 357"],
    guide:[
      "Keep the hand centered over 4-5-6 instead of lifting the whole arm for each number.",
      "Index finger: 1, 4, 7. Middle finger: 2, 5, 8. Ring finger: 3, 6, 9.",
      "After an upper or lower reach, return mentally toward the 4-5-6 home row.",
      "The objective is a consistent numeric cadence, not rapid pecking with one finger."
    ]
  },
  {
    id:"zeroDecimal",
    number:"03",
    title:"Zero & Decimal",
    subtitle:"Add the long 0 key and decimal point without losing keypad orientation.",
    icon:".",
    tags:["0", "Decimal", "Precision"],
    targetKph:4600,
    accuracyGate:99,
    strictNumpad:false,
    groups:["0.00","45.60","12.75","308.40","900.05","0.99","74.25 18.50 6.00","1024.75 88.03 19.90","5.25 50.25 500.25","701.08 42.19 300.00"],
    guide:[
      "Use the thumb for 0 on the conventional keypad layout.",
      "Decimal technique varies somewhat by training method and keyboard geometry; use a small, repeatable reach rather than shifting the whole hand.",
      "Treat the decimal point as a full data-entry character. A missing decimal can change a value dramatically.",
      "Keep the hand oriented around 4-5-6 between values."
    ]
  },
  {
    id:"enterRhythm",
    number:"04",
    title:"Enter-Key Rhythm",
    subtitle:"Practice complete numeric entries followed by Enter, like calculator and data-entry work.",
    icon:"↵",
    tags:["Enter", "Data Entry", "Cadence"],
    targetKph:5200,
    accuracyGate:99,
    strictNumpad:true,
    entries:["4827","1064","795","2208","3401","9182","604","7750","1299","5308","442","8106","2375","9900","1843","7201","658","3114"],
    guide:[
      "Each displayed value is followed by Enter. The next value appears automatically after the current one is accepted.",
      "On a full numeric keypad, Numpad Enter is normally reached with the right little finger.",
      "Top-row digits and the main Enter key still allow completion, but this protocol requires mostly numeric-keypad input to clear its keypad-discipline target.",
      "Aim for a regular number-Enter-number-Enter rhythm rather than pausing after every record."
    ]
  },
  {
    id:"accounting",
    number:"05",
    title:"Accounting Entry",
    subtitle:"Decimals, totals, signed adjustments, and repetitive financial-style numeric records.",
    icon:"$",
    tags:["Accounting", "Decimals", "Operators"],
    targetKph:6000,
    accuracyGate:99,
    strictNumpad:true,
    entries:["1245.80","86.25","646.88","18500.00","12764.35","5735.65","17.95","430.80","-42.50","+105.00","998.17","72.04","3500.00","204.19","-8.25","610.40","91.73","12000.00"],
    guide:[
      "This protocol uses plain numeric values rather than currency symbols because the objective is numeric-keypad entry.",
      "Decimal placement, plus/minus signs, and Enter are part of the record and count toward accuracy.",
      "Use a deliberate cadence around signed adjustments. Do not let a minus sign become an afterthought.",
      "The target emphasizes first-attempt accuracy because a single digit or decimal error can materially change a financial value."
    ]
  },
  {
    id:"proficiency",
    number:"06",
    title:"10-Key Proficiency Test",
    subtitle:"A two-minute sustained numeric test scored in KPH, accuracy, and keypad-use discipline.",
    icon:"#",
    tags:["2 Minutes", "KPH", "Proficiency"],
    targetKph:7200,
    accuracyGate:98,
    strictNumpad:true,
    durationMs:120000,
    entries:["4827","1064","7953","2208","3401","9182","6047","7750","1299","5308","4426","8106","2375","9900","1843","7201","6584","3114","9052","4671","2038","7719","1450","8623","3905","6187","2504","9341","5076","1288","4490","7135","8012","2664","9503","3782","6240","1197","8356","4021"],
    guide:[
      "The proficiency test runs for two minutes and repeats a large randomized numeric record stream.",
      "HyperSoft reports Keystrokes Per Hour (KPH), first-attempt accuracy, and the percentage of accepted input that came from numeric-keypad keys.",
      "The default proficiency target requires strong accuracy and predominantly Numpad input. Missing the target never locks the Academy.",
      "KPH is a training metric calculated from accepted correct keystrokes over elapsed time; it is not an employment certification."
    ]
  }
];

export function getTenKeyProtocol(id) {
  return TEN_KEY_PROTOCOLS.find(item=>item.id===id) ?? null;
}

function tenKeyShuffle(values) {
  const out=[...values];
  for (let i=out.length-1;i>0;i-=1) {
    const j=Math.floor(Math.random()*(i+1));
    [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}

export function buildTenKeySequence(protocol) {
  if (!protocol) return "";
  if (Array.isArray(protocol.entries) && protocol.entries.length) {
    let entries=[...protocol.entries];
    if (protocol.durationMs) {
      const large=[];
      for (let i=0;i<10;i+=1) large.push(...tenKeyShuffle(entries));
      entries=large;
    }
    return entries.join("\n");
  }
  return (protocol.groups ?? []).join("").replaceAll(" ","");
}

export class TenKeyExercise {
  constructor({stage,engine,finish,protocol,difficulty="normal"}) {
    this.stage=stage;
    this.engine=engine;
    this.finish=finish;
    this.protocol=protocol;
    this.difficulty=difficulty;
    this.text=buildTenKeySequence(protocol);
    this.cursor=0;
    this.running=false;
    this.finished=false;
    this.correctInputs=0;
    this.errors=0;
    this.backspaces=0;
    this.numpadAccepted=0;
    this.acceptedPhysical=0;
    this.keyStats={};
    this.startedAt=null;
    this.durationTimer=null;
    this.handleKeydown=this.handleKeydown.bind(this);
  }

  getTargets() {
    const factor={novice:.68,easy:.82,normal:1,challenging:1.12,hard:1.24,expert:1.36}[this.difficulty] ?? 1;
    return {
      kph:Math.max(1800,Math.round(this.protocol.targetKph*factor/100)*100),
      accuracy:this.protocol.accuracyGate,
      numpadRate:this.protocol.strictNumpad ? 90 : 0
    };
  }

  start() {
    this.running=true;
    this.startedAt=null;
    const targets=this.getTargets();
    this.stage.innerHTML=`
      <div class="tenkey-workstation">
        <div class="tenkey-titlebar">
          <div><small>HyperSoft Numeric Skills Center</small><strong>${this.escape(this.protocol.title)}</strong></div>
          <span>10-KEY ACADEMY</span>
        </div>
        <div class="tenkey-live-grid">
          <div><span>KPH</span><strong id="tenKeyKph">0</strong><small>Target ${targets.kph.toLocaleString()}</small></div>
          <div><span>Accuracy</span><strong id="tenKeyAccuracy">100%</strong><small>Gate ${targets.accuracy}%</small></div>
          <div><span>Numpad Use</span><strong id="tenKeyNumpadRate">0%</strong><small>${this.protocol.strictNumpad ? "90% required" : "Tracked only"}</small></div>
          <div><span>Errors</span><strong id="tenKeyErrors">0</strong><small>First-attempt misses</small></div>
        </div>
        <div class="tenkey-main">
          <section class="tenkey-stream-panel">
            <div class="tenkey-stream-heading"><div><small>Numeric Entry Stream</small><h3>${this.escape(this.protocol.subtitle)}</h3></div><strong id="tenKeyTimer">${this.protocol.durationMs ? "2:00" : "Practice"}</strong></div>
            <div class="tenkey-stream" id="tenKeyStream"></div>
            <div class="tenkey-next-row"><span>Next</span><strong id="tenKeyNext">—</strong><small id="tenKeyStatus" aria-live="polite">Place your right hand over 4-5-6 and begin.</small></div>
            <div class="tenkey-progress"><span id="tenKeyProgressFill"></span></div>
          </section>
          <aside class="tenkey-coach-panel">
            <div class="tenkey-finger-readout"><span>Recommended finger</span><strong id="tenKeyFinger">—</strong><small id="tenKeyFingerNote">Use the smallest comfortable movement.</small></div>
            <div class="tenkey-pad" id="tenKeyPad" aria-label="Numeric keypad diagram">
              ${this.padKey("Num","num","utility")}${this.padKey("/","/","utility")}${this.padKey("*","*","utility")}${this.padKey("-","-","operator")}
              ${this.padKey("7","7","index")}${this.padKey("8","8","middle")}${this.padKey("9","9","ring")}${this.padKey("+","+","operator","tall")}
              ${this.padKey("4","4","index")}${this.padKey("5","5","middle","home")}${this.padKey("6","6","ring")}
              ${this.padKey("1","1","index")}${this.padKey("2","2","middle")}${this.padKey("3","3","ring")}${this.padKey("Enter","Enter","enter","tall")}
              ${this.padKey("0","0","thumb","wide")}${this.padKey(".",".","decimal")}
            </div>
            <div class="tenkey-technique-note"><strong>Home position</strong><span>Index 4 · Middle 5 · Ring 6 · Thumb 0</span></div>
          </aside>
        </div>
        <div class="tenkey-footer-note"><strong>Training note</strong><span>Top-row digits remain usable for accessibility, but Numpad-use percentage is recorded. Strict protocols require mostly numeric-keypad input to clear their full target.</span></div>
      </div>`;
    this.kphEl=this.stage.querySelector("#tenKeyKph");
    this.accuracyEl=this.stage.querySelector("#tenKeyAccuracy");
    this.numpadEl=this.stage.querySelector("#tenKeyNumpadRate");
    this.errorsEl=this.stage.querySelector("#tenKeyErrors");
    this.timerEl=this.stage.querySelector("#tenKeyTimer");
    this.streamEl=this.stage.querySelector("#tenKeyStream");
    this.nextEl=this.stage.querySelector("#tenKeyNext");
    this.statusEl=this.stage.querySelector("#tenKeyStatus");
    this.progressEl=this.stage.querySelector("#tenKeyProgressFill");
    this.fingerEl=this.stage.querySelector("#tenKeyFinger");
    this.fingerNoteEl=this.stage.querySelector("#tenKeyFingerNote");
    this.pad=this.stage.querySelector("#tenKeyPad");
    this.render();
    window.addEventListener("keydown",this.handleKeydown);
    if (this.protocol.durationMs) {
      this.durationTimer=window.setInterval(()=>{
        if (!this.running) return;
        this.updateMetrics();
        if (!this.startedAt) return;
        const elapsed=performance.now()-this.startedAt;
        if (elapsed>=this.protocol.durationMs) this.complete({timed:true});
      },100);
    }
    this.engine.updateHUD();
  }

  padKey(label,key,finger,extra="") {
    return `<span class="tenkey-pad-key tenkey-${finger} ${extra}" data-tenkey="${this.escape(key)}"><b>${this.escape(label)}</b><small>${this.fingerShort(finger)}</small></span>`;
  }

  fingerShort(finger) {
    return {index:"I",middle:"M",ring:"R",thumb:"T",decimal:"D",operator:"P",enter:"P",utility:""}[finger] ?? "";
  }

  expected() { return this.text[this.cursor] ?? null; }

  normalizeEvent(event) {
    if (event.key==="Enter") return "\n";
    if (event.key==="Decimal") return ".";
    if (event.key.length===1) return event.key;
    return null;
  }

  isNumpadEvent(event) {
    return /^Numpad/.test(event.code || "");
  }

  handleKeydown(event) {
    if (!this.running || event.ctrlKey || event.metaKey || event.altKey) return;
    if (hyperSoftShouldBypassTypingEvent(event)) return;
    if (event.key==="Backspace") {
      event.preventDefault();
      this.backspaces+=1;
      this.errors+=1;
      this.engine.recordKeystroke(false,0,null);
      this.statusEl.textContent="Backspace is recorded as a correction attempt. Enter the highlighted value instead.";
      this.statusEl.className="bad";
      this.updateMetrics();
      return;
    }
    const typed=this.normalizeEvent(event);
    if (typed==null) return;
    const expected=this.expected();
    if (expected==null) return;
    const allowed=/[0-9.\n+\-*/ ]/.test(typed);
    if (!allowed) return;
    event.preventDefault();
    if (typed===" " && expected!==" ") return;
    if (!this.startedAt) {
      this.startedAt=performance.now();
      this.statusEl.textContent=this.protocol.durationMs ? "Clock started. Maintain numeric rhythm for the full test." : "Timing started. Keep the hand centered over 4-5-6.";
    }

    const correct=typed===expected;
    if (typed!==" ") {
      this.acceptedPhysical+=correct?1:0;
      if (correct && this.isNumpadEvent(event)) this.numpadAccepted+=1;
    }
    this.engine.recordKeystroke(correct,correct?.5:0,null);
    this.recordNumericKey(expected,correct);

    if (correct) {
      this.correctInputs+=1;
      this.cursor+=1;
      this.statusEl.textContent=this.isNumpadEvent(event)
        ? "Accepted from numeric keypad. Maintain the cadence."
        : "Accepted. Numeric-keypad input is preferred when available.";
      this.statusEl.className="good";
      if (!this.protocol.durationMs && this.cursor>=this.text.length) {
        this.complete();
        return;
      }
      if (this.protocol.durationMs && this.cursor>=this.text.length) {
        this.text += "\n" + buildTenKeySequence(this.protocol);
      }
    } else {
      this.errors+=1;
      this.statusEl.textContent=`Expected ${this.describe(expected)} — received ${this.describe(typed)}.`;
      this.statusEl.className="bad";
      this.stage.classList.remove("tenkey-error-flash");
      void this.stage.offsetWidth;
      this.stage.classList.add("tenkey-error-flash");
    }
    this.render();
    this.updateMetrics();
    this.engine.updateHUD();
  }

  recordNumericKey(expected,correct) {
    if (!expected || expected===" ") return;
    const key=expected==="\n" ? "Enter" : expected;
    const row=this.keyStats[key] ?? {attempts:0,correct:0,errors:0};
    row.attempts+=1;
    if (correct) row.correct+=1;
    else row.errors+=1;
    this.keyStats[key]=row;
  }

  getKph() {
    if (!this.startedAt) return 0;
    const elapsed=Math.max(1000,performance.now()-this.startedAt);
    return Math.round((this.correctInputs/(elapsed/3600000))/100)*100;
  }

  getNumpadRate() {
    return this.acceptedPhysical ? Math.round((this.numpadAccepted/this.acceptedPhysical)*100) : 0;
  }

  getWeakNumericKeys(limit=5) {
    return Object.entries(this.keyStats)
      .map(([key,row])=>({key,...row,accuracy:row.attempts?(row.correct/row.attempts)*100:100}))
      .filter(row=>row.errors>0)
      .sort((a,b)=>a.accuracy-b.accuracy || b.errors-a.errors)
      .slice(0,limit);
  }

  complete({timed=false}={}) {
    if (this.finished) return;
    this.finished=true;
    this.running=false;
    window.clearInterval(this.durationTimer);
    this.durationTimer=null;
    window.removeEventListener("keydown",this.handleKeydown);
    const targets=this.getTargets();
    const kph=this.getKph();
    const accuracy=Math.round(this.engine.calculateAccuracy()*10)/10;
    const numpadRate=this.getNumpadRate();
    const met=kph>=targets.kph && accuracy>=targets.accuracy && (!this.protocol.strictNumpad || numpadRate>=targets.numpadRate);
    if (met) this.engine.addScore(500);
    const weak=this.getWeakNumericKeys(5);
    this.finish({
      success:true,
      score:this.engine.score,
      title:met ? `${this.protocol.title}: Target met` : `${this.protocol.title}: Practice complete`,
      message:timed
        ? `Two-minute proficiency test complete. Target: ${targets.kph.toLocaleString()} KPH at ${targets.accuracy}% accuracy${this.protocol.strictNumpad ? ` with ${targets.numpadRate}%+ Numpad use` : ""}.`
        : `Numeric training complete. Target: ${targets.kph.toLocaleString()} KPH at ${targets.accuracy}% accuracy${this.protocol.strictNumpad ? ` with ${targets.numpadRate}%+ Numpad use` : ""}.`,
      targetStatus:met?"Met":"Practice",
      variant:this.protocol.title,
      durationMs:this.startedAt ? Math.max(0,Math.round(performance.now()-this.startedAt)) : 0,
      tenKeyKph:kph,
      tenKeyNumpadRate:numpadRate,
      tenKeyKeyStats:this.keyStats,
      tenKeyBackspaces:this.backspaces,
      tenKeyErrors:this.errors,
      extraStats:[
        ["Numpad use",`${numpadRate}%`],
        ["First-attempt errors",this.errors],
        ["Correction attempts",this.backspaces],
        ...(weak.length ? [["Weak numeric keys",weak.map(row=>`${row.key} ${Math.round(row.accuracy)}%`).join(", ")]] : [])
      ]
    });
  }

  render() {
    const expected=this.expected();
    const start=Math.max(0,this.cursor-36);
    const end=Math.min(this.text.length,this.cursor+84);
    const before=this.text.slice(start,this.cursor);
    const current=expected ?? "";
    const after=this.text.slice(this.cursor+(current?1:0),end);
    const fmt=value=>this.escape(value).replaceAll("\n"," ↵ ");
    this.streamEl.innerHTML=`<span class="tenkey-complete">${fmt(before)}</span>${current?`<span class="tenkey-current">${current==="\n"?"↵":this.escape(current)}</span>`:""}<span class="tenkey-upcoming">${fmt(after)}</span>`;
    this.nextEl.textContent=this.describe(current);
    const finger=this.fingerFor(current);
    this.fingerEl.textContent=finger.label;
    this.fingerNoteEl.textContent=finger.note;
    this.pad?.querySelectorAll("[data-tenkey]").forEach(el=>el.classList.toggle("is-next",el.dataset.tenkey===(current==="\n"?"Enter":current)));
    if (!this.protocol.durationMs) this.progressEl.style.width=`${this.text.length?Math.min(100,(this.cursor/this.text.length)*100):0}%`;
  }

  updateMetrics() {
    if (!this.running) return;
    if (this.kphEl) this.kphEl.textContent=this.getKph().toLocaleString();
    if (this.accuracyEl) this.accuracyEl.textContent=`${Math.round(this.engine.calculateAccuracy()*10)/10}%`;
    if (this.numpadEl) this.numpadEl.textContent=`${this.getNumpadRate()}%`;
    if (this.errorsEl) this.errorsEl.textContent=String(this.errors);
    if (this.protocol.durationMs && this.timerEl) {
      const elapsed=this.startedAt ? performance.now()-this.startedAt : 0;
      const remaining=Math.max(0,this.protocol.durationMs-elapsed);
      const sec=Math.ceil(remaining/1000);
      this.timerEl.textContent=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`;
      if (this.progressEl) this.progressEl.style.width=`${Math.min(100,((this.protocol.durationMs-remaining)/this.protocol.durationMs)*100)}%`;
    }
  }

  fingerFor(value) {
    const key=value==="\n"?"Enter":value;
    const map={
      "1":["Index finger","Lower-left column: 1 / 4 / 7"],
      "4":["Index finger","Home key 4; return toward 4-5-6"],
      "7":["Index finger","Upper-left column: 1 / 4 / 7"],
      "2":["Middle finger","Lower-middle column: 2 / 5 / 8"],
      "5":["Middle finger","Home key 5; tactile marker on many keypads"],
      "8":["Middle finger","Upper-middle column: 2 / 5 / 8"],
      "3":["Ring finger","Lower-right column: 3 / 6 / 9"],
      "6":["Ring finger","Home key 6; return toward 4-5-6"],
      "9":["Ring finger","Upper-right column: 3 / 6 / 9"],
      "0":["Thumb","Use the thumb for the long 0 key"],
      ".":["Decimal reach","Use a small repeatable reach; training methods vary"],
      "Enter":["Little finger","Complete the current record"],
      "+":["Little-finger side","Operator key; keep the hand centered"],
      "-":["Little-finger side","Operator key; keep the hand centered"],
      "*":["Upper operator reach","Use a controlled reach"],
      "/":["Upper operator reach","Use a controlled reach"],
      " ":["Reset to home","Relax over 4-5-6 before the next group"]
    };
    const row=map[key] ?? ["Numeric keypad","Keep the right hand centered"];
    return {label:row[0],note:row[1]};
  }

  getHUDTime() {
    this.updateMetrics();
    return this.startedAt ? Math.max(0,performance.now()-this.startedAt) : 0;
  }

  stop() {
    this.running=false;
    window.clearInterval(this.durationTimer);
    this.durationTimer=null;
    window.removeEventListener("keydown",this.handleKeydown);
  }

  describe(value) {
    if (value==="\n") return "Enter";
    if (value===" ") return "Space";
    return value || "Complete";
  }

  escape(value="") {
    return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  }
}
