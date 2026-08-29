import { hyperSoftShouldBypassTypingEvent } from "./accessibilityUtils.js";
export const PUNCTUATION_BUSINESS_PROTOCOLS = [
  {
    id:"shiftBasics", number:"01", title:"Shift & Capitals", icon:"⇧",
    subtitle:"Opposite-hand Shift technique, acronyms, names, and sentence starts.",
    tags:["Shift", "Capitals", "Technique"], targetWpm:32, accuracyGate:98,
    guide:[
      "Use the Shift key with the hand opposite the letter whenever practical: left Shift for right-hand letters, right Shift for left-hand letters.",
      "Release Shift immediately after the capital unless the entire sequence is uppercase.",
      "Keep the typing hand anchored instead of reaching one finger across the keyboard.",
      "This lab scores first-attempt accuracy and separately tracks errors on capitals and symbols."
    ],
    passages:[
      "Monday Review: Blake, Jordan, Priya, and Elena will meet in Room C at 9:30 AM.",
      "HyperSoft Training Services approved the Q3 Keyboard Skills Update for August.",
      "Please send the FINAL draft to Morgan before Friday, and mark Section B as READY."
    ]
  },
  {
    id:"quotesApostrophes", number:"02", title:"Quotes & Apostrophes", icon:"’",
    subtitle:"Contractions, possessives, quotation marks, and dialogue punctuation.",
    tags:["Quotes", "Apostrophes", "Grammar"], targetWpm:34, accuracyGate:98,
    guide:[
      "Apostrophes appear in contractions and possessives; quotation marks use Shift with the same key on standard US layouts.",
      "Do not pause after every punctuation mark. Read slightly ahead so punctuation becomes part of the phrase rhythm.",
      "Type curly-looking source punctuation as the ordinary keyboard apostrophe or quotation character shown by HyperSoft.",
      "The exercise uses original fictional business text."
    ],
    passages:[
      "Blake's note said, \"Don't rename the folder until it's actually approved.\"",
      "Jordan replied, \"We're ready, but the vendor's estimate hasn't arrived yet.\"",
      "The manager asked, \"Who's reviewing Friday's report, and where's the final copy?\""
    ]
  },
  {
    id:"businessMarks", number:"03", title:"Business Punctuation", icon:";",
    subtitle:"Commas, semicolons, colons, parentheses, and hyphens in ordinary office prose.",
    tags:["; : ,", "Parentheses", "Hyphens"], targetWpm:35, accuracyGate:98,
    guide:[
      "Treat punctuation as part of the word group rather than a reason to stop typing.",
      "Semicolons join closely related independent clauses; colons often introduce a list or explanation.",
      "Parentheses and hyphens require controlled Shift or reach patterns depending on the character.",
      "Accuracy is more important than maintaining a high burst speed through punctuation-heavy clauses."
    ],
    passages:[
      "Three items remain: confirm the date, revise the estimate, and archive the old draft.",
      "Testing is complete; however, two follow-up items (both low-risk) remain open.",
      "The post-review checklist covers file naming, version control, sign-off, and year-end storage."
    ]
  },
  {
    id:"slashesWeb", number:"04", title:"Slashes, Email & Web", icon:"/",
    subtitle:"Slashes, backslashes, @, dots, hyphens, underscores, and web-style strings.",
    tags:["/ \\", "@ . _", "Web"], targetWpm:28, accuracyGate:99,
    guide:[
      "URLs, email addresses, and file paths are precision work. One character can point somewhere entirely different.",
      "Practice forward slash and backslash as distinct keys.",
      "Use Shift deliberately for @ and underscore rather than hunting visually for the symbol.",
      "Example domains are reserved fictional training destinations."
    ],
    passages:[
      "training.team@example.org | https://example.org/keyboard/shift-basics",
      "C:\\Training\\2026\\August\\Punctuation_Lab_v2.docx",
      "https://portal.example.org/review?id=4827&mode=final | user.name+lab@example.org"
    ]
  },
  {
    id:"numbersSymbols", number:"05", title:"Numbers & Shift Symbols", icon:"$",
    subtitle:"Currency, percentages, parentheses, #, &, +, and mixed business-number strings.",
    tags:["$ % #", "Numbers", "Mixed Shift"], targetWpm:30, accuracyGate:99,
    guide:[
      "This protocol uses the number row and its shifted symbols rather than 10-Key entry.",
      "Keep number-row reaches small and return to the alphabetic home position after each symbol group.",
      "Currency, percentage, and reference symbols must be typed exactly.",
      "For dedicated numeric-keypad work, use 10-Key Academy instead."
    ],
    passages:[
      "Budget: $18,500.00 | Variance: 3.8% | Reference: #4827",
      "Option A + Option B = 100%; review items (1), (2), and (3).",
      "Q4 estimate: $7,245.60 & contingency: $850.00 | total cap: $8,095.60"
    ]
  },
  {
    id:"businessMastery", number:"06", title:"Business Writing Mastery", icon:"¶",
    subtitle:"Sustained professional prose mixing capitals, punctuation, symbols, email, and structured references.",
    tags:["Mixed", "Endurance", "99% Gate"], targetWpm:40, accuracyGate:99,
    guide:[
      "This final protocol mixes the punctuation families from the earlier labs into sustained business-style text.",
      "Read ahead by a few characters so punctuation does not repeatedly interrupt rhythm.",
      "The 99% accuracy gate is intentionally strict; completion is always allowed even when the gate is missed.",
      "Use Accuracy Clinic or Practice Builder afterward if the review identifies a recurring punctuation family."
    ],
    passages:[
      "Subject: Final Review — Project Atlas\n\nPlease confirm the following by 2:30 PM Friday: (1) the $4,825.00 estimate; (2) the revised 8.5% allocation; and (3) the file named Atlas_Final_v6.pdf. Send questions to atlas.team@example.org.",
      "MEMO: The pilot is complete; however, two items remain. Jordan's team will verify the export path (C:\\Training\\Atlas\\Final), and Priya will confirm whether the 09/01/2026 launch date still works.",
      "The reviewer wrote, \"Please don't change the approved totals.\" The current values are $12,450.75, $3,008.20, and $945.00; together, they represent 96.4% of the planned amount."
    ]
  }
];

export function getPunctuationBusinessProtocol(id) {
  return PUNCTUATION_BUSINESS_PROTOCOLS.find(item=>item.id===id) ?? null;
}

const SYMBOL_FAMILIES = {
  apostrophe:new Set(["'",'"']),
  sentence:new Set([",",".",";",":","?","!"]),
  brackets:new Set(["(",")","[","]","{","}"]),
  path:new Set(["/","\\","_","@"]),
  business:new Set(["$","%","#","&","+","-","="]),
  capitals:new Set()
};

function punctuationFamily(char) {
  if (/^[A-Z]$/.test(char)) return "capitals";
  for (const [family,set] of Object.entries(SYMBOL_FAMILIES)) if (set.has(char)) return family;
  if (/^[0-9]$/.test(char)) return "numbers";
  return null;
}

export class PunctuationBusinessExercise {
  constructor({stage,engine,finish,protocol,difficulty="normal"}) {
    this.stage=stage; this.engine=engine; this.finish=finish; this.protocol=protocol; this.difficulty=difficulty;
    this.roundIndex=0; this.cursor=0; this.running=false; this.finished=false; this.errors=0; this.backspaces=0;
    this.roundStartedAt=0; this.roundStats=[]; this.familyStats={}; this.substitutions={};
    this.handleKeydown=this.handleKeydown.bind(this);
  }

  getTargets() {
    const factor={novice:.72,easy:.85,normal:1,challenging:1.12,hard:1.25,expert:1.38}[this.difficulty]??1;
    return {wpm:Math.max(18,Math.round(this.protocol.targetWpm*factor)),accuracy:this.protocol.accuracyGate};
  }

  start() {
    this.running=true;
    const t=this.getTargets();
    this.stage.innerHTML=`<div class="punct-workstation">
      <div class="punct-titlebar"><div><small>HyperSoft Business Keyboarding Center</small><strong>${this.escape(this.protocol.title)}</strong></div><span>PUNCTUATION LAB</span></div>
      <div class="punct-live-grid">
        <div><span>WPM</span><strong id="punctWpm">0</strong><small>Target ${t.wpm}</small></div>
        <div><span>Accuracy</span><strong id="punctAccuracy">100%</strong><small>Gate ${t.accuracy}%</small></div>
        <div><span>Symbol Accuracy</span><strong id="punctSymbolAccuracy">100%</strong><small>Capitals + punctuation</small></div>
        <div><span>Errors</span><strong id="punctErrors">0</strong><small>First-attempt misses</small></div>
      </div>
      <div class="punct-main">
        <section class="punct-document-shell">
          <div class="punct-document-toolbar"><span>File</span><span>Edit</span><span>Format</span><strong id="punctRound">Exercise 1/${this.protocol.passages.length}</strong></div>
          <div class="punct-document" id="punctDocument"></div>
          <div class="punct-status"><span>Next key</span><strong id="punctNext">—</strong><small id="punctStatus" aria-live="polite">Begin typing. Exact punctuation is required.</small></div>
          <div class="punct-progress"><span id="punctProgressFill"></span></div>
        </section>
        <aside class="punct-coach">
          <div class="punct-coach-head"><span>Keyboard Coach</span><strong id="punctFamily">Ready</strong><small id="punctCoachText">Read slightly ahead so punctuation becomes part of the phrase.</small></div>
          <div class="punct-keyboard-hints">
            <div><kbd>Shift</kbd><span>Use opposite hand for capital letters when practical.</span></div>
            <div><kbd>; :</kbd><span>Same key; colon requires Shift.</span></div>
            <div><kbd>' \"</kbd><span>Apostrophe / quotation pair.</span></div>
            <div><kbd>/ ?</kbd><span>Slash / question-mark pair.</span></div>
            <div><kbd>- _</kbd><span>Hyphen / underscore pair.</span></div>
            <div><kbd>2 @</kbd><span>Number-row symbol reach.</span></div>
          </div>
          <div class="punct-session-review" id="punctMiniReview"><strong>Session review</strong><span>No symbol errors recorded yet.</span></div>
        </aside>
      </div>
      <div class="punct-footer"><strong>Precision rule</strong><span>A wrong key is recorded but does not advance the document. Backspace counts as a correction attempt.</span></div>
    </div>`;
    this.wpmEl=this.stage.querySelector('#punctWpm'); this.accuracyEl=this.stage.querySelector('#punctAccuracy');
    this.symbolAccuracyEl=this.stage.querySelector('#punctSymbolAccuracy'); this.errorsEl=this.stage.querySelector('#punctErrors');
    this.roundEl=this.stage.querySelector('#punctRound'); this.documentEl=this.stage.querySelector('#punctDocument');
    this.nextEl=this.stage.querySelector('#punctNext'); this.statusEl=this.stage.querySelector('#punctStatus');
    this.progressEl=this.stage.querySelector('#punctProgressFill'); this.familyEl=this.stage.querySelector('#punctFamily');
    this.coachEl=this.stage.querySelector('#punctCoachText'); this.reviewEl=this.stage.querySelector('#punctMiniReview');
    this.startRound(0);
    window.addEventListener('keydown',this.handleKeydown);
    this.engine.updateHUD();
  }

  startRound(index) {
    this.roundIndex=index; this.cursor=0; this.roundStartedAt=performance.now(); this.roundErrors=0;
    this.roundEl.textContent=`Exercise ${index+1}/${this.protocol.passages.length}`;
    this.statusEl.textContent=index?'Next exercise loaded. Continue typing.':'Begin typing. Exact punctuation is required.';
    this.render(); this.updateMetrics();
  }

  expected() { return this.protocol.passages[this.roundIndex]?.[this.cursor] ?? null; }

  handleKeydown(event) {
    if (!this.running || event.ctrlKey || event.metaKey || event.altKey) return;
    if (hyperSoftShouldBypassTypingEvent(event)) return;
    if (event.target instanceof HTMLElement && event.target.matches('button,select,textarea,input,a[href]')) return;
    let typed=event.key;
    if (typed==='Enter') typed='\n';
    else if (typed==='Backspace') {
      event.preventDefault(); this.backspaces++; this.errors++; this.roundErrors++;
      const expected=this.expected(); this.engine.recordKeystroke(false,0,expected==='\n'?null:expected);
      this.recordFamily(expected,false); this.recordSubstitution(expected,'Backspace');
      this.statusEl.textContent='Correction attempt recorded. Type the highlighted character to continue.'; this.statusEl.className='bad';
      this.renderReview(); this.updateMetrics(); return;
    } else if (typed.length!==1) return;
    event.preventDefault();
    const expected=this.expected(); if (expected==null) return;
    const correct=typed===expected;
    this.engine.recordKeystroke(correct,correct?.55:0,expected==='\n'?null:expected);
    this.recordFamily(expected,correct);
    if (!correct) this.recordSubstitution(expected,typed);
    if (correct) {
      this.cursor++;
      this.statusEl.textContent='Correct. Keep the punctuation in rhythm with the phrase.'; this.statusEl.className='good';
      if (this.cursor>=this.protocol.passages[this.roundIndex].length) { this.completeRound(); return; }
    } else {
      this.errors++; this.roundErrors++;
      this.statusEl.textContent=`Expected ${this.describe(expected)} — received ${this.describe(typed)}.`; this.statusEl.className='bad';
      this.stage.classList.remove('punct-error-flash'); void this.stage.offsetWidth; this.stage.classList.add('punct-error-flash');
    }
    this.render(); this.renderReview(); this.updateMetrics(); this.engine.updateHUD();
  }

  recordFamily(expected,correct) {
    const family=punctuationFamily(expected); if (!family) return;
    const row=this.familyStats[family]??{attempts:0,correct:0,errors:0}; row.attempts++;
    if (correct) row.correct++; else row.errors++; this.familyStats[family]=row;
  }

  recordSubstitution(expected,typed) {
    if (!expected || expected===' ') return;
    const key=`${this.describe(expected)} ← ${this.describe(typed)}`;
    this.substitutions[key]=(this.substitutions[key]||0)+1;
  }

  completeRound() {
    const text=this.protocol.passages[this.roundIndex]; const duration=Math.max(1,performance.now()-this.roundStartedAt);
    this.roundStats.push({round:this.roundIndex+1,chars:text.length,durationMs:Math.round(duration),errors:this.roundErrors,grossWpm:Math.round(((text.length/5)/(duration/60000))*10)/10});
    if (this.roundIndex<this.protocol.passages.length-1) { this.startRound(this.roundIndex+1); return; }
    this.complete();
  }

  getSymbolAccuracy() {
    const rows=Object.values(this.familyStats); const attempts=rows.reduce((s,r)=>s+r.attempts,0); const correct=rows.reduce((s,r)=>s+r.correct,0);
    return attempts?Math.round((correct/attempts)*1000)/10:100;
  }

  complete() {
    if (this.finished) return; this.finished=true; this.running=false; window.removeEventListener('keydown',this.handleKeydown);
    const target=this.getTargets(); const wpm=Math.round(this.engine.calculateWPM()); const accuracy=Math.round(this.engine.calculateAccuracy()*10)/10;
    const symbolAccuracy=this.getSymbolAccuracy(); const met=wpm>=target.wpm && accuracy>=target.accuracy;
    if (met) this.engine.addScore(450);
    const substitutions=Object.entries(this.substitutions).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([pattern,count])=>({pattern,count}));
    const familyRows=Object.entries(this.familyStats).map(([family,row])=>({family,...row,accuracy:row.attempts?Math.round((row.correct/row.attempts)*1000)/10:100})).sort((a,b)=>a.accuracy-b.accuracy);
    this.finish({
      success:true, score:this.engine.score, title:met?`${this.protocol.title}: Precision target met`:`${this.protocol.title}: Lab complete`,
      message:met?`All ${this.protocol.passages.length} exercises were completed at or above the business-writing precision standard.`:`All ${this.protocol.passages.length} exercises were completed. Target: ${target.wpm} WPM at ${target.accuracy}% accuracy.`,
      targetStatus:met?'Met':'Practice', variant:this.protocol.title,
      punctuationProtocol:this.protocol.id, punctuationSymbolAccuracy:symbolAccuracy, punctuationErrors:this.errors, punctuationBackspaces:this.backspaces,
      punctuationFamilyStats:this.familyStats, punctuationSubstitutions:substitutions, punctuationRounds:this.roundStats,
      extraStats:[['Symbol accuracy',`${symbolAccuracy}%`],['First-attempt errors',this.errors],['Correction attempts',this.backspaces],...(familyRows.length?[['Weakest punctuation family',`${this.familyLabel(familyRows[0].family)} · ${familyRows[0].accuracy}%`]]:[]),...(substitutions.length?[['Most common miss',`${substitutions[0].pattern} ×${substitutions[0].count}`]]:[])]
    });
  }

  render() {
    const text=this.protocol.passages[this.roundIndex]; const current=this.expected()??''; const before=text.slice(0,this.cursor); const after=text.slice(this.cursor+(current?1:0));
    const cur=current==='\n'?'<span class="punct-current punct-newline">↵</span><br>':current?`<span class="punct-current">${this.escape(current)}</span>`:'';
    this.documentEl.innerHTML=`<span class="punct-complete">${this.format(before)}</span>${cur}<span class="punct-upcoming">${this.format(after)}</span>`;
    this.nextEl.textContent=this.describe(current); const family=punctuationFamily(current); this.familyEl.textContent=family?this.familyLabel(family):/^[a-z]$/i.test(current)?'Letter flow':'Spacing';
    this.coachEl.textContent=this.coachFor(current,family);
    const total=this.protocol.passages.reduce((s,p)=>s+p.length,0); const previous=this.protocol.passages.slice(0,this.roundIndex).reduce((s,p)=>s+p.length,0);
    this.progressEl.style.width=`${total?Math.min(100,((previous+this.cursor)/total)*100):0}%`;
  }

  renderReview() {
    const top=Object.entries(this.substitutions).sort((a,b)=>b[1]-a[1]).slice(0,3);
    this.reviewEl.innerHTML=top.length?`<strong>Session review</strong><span>${top.map(([p,c])=>`${this.escape(p)} ×${c}`).join(' · ')}</span>`:'<strong>Session review</strong><span>No symbol errors recorded yet.</span>';
  }

  updateMetrics() {
    if (!this.running) return;
    this.wpmEl.textContent=String(Math.round(this.engine.calculateWPM())); this.accuracyEl.textContent=`${Math.round(this.engine.calculateAccuracy()*10)/10}%`;
    this.symbolAccuracyEl.textContent=`${this.getSymbolAccuracy()}%`; this.errorsEl.textContent=String(this.errors);
  }

  coachFor(char,family) {
    if (/^[A-Z]$/.test(char)) return `Capital ${char}: use the opposite-hand Shift when practical, then release it immediately.`;
    const map={apostrophe:'Quotes and apostrophes share one key; quotation marks require Shift.',sentence:'Keep sentence punctuation attached to the phrase rhythm.',brackets:'Use a controlled Shift reach and return to home position.',path:'Distinguish slash, backslash, underscore, @, and dot carefully.',business:'Treat currency/reference symbols as exact data, not decoration.',numbers:'Use a small number-row reach and return to the letter home row.'};
    if (family&&map[family]) return map[family];
    if (char==='\n') return 'Press Enter once for the required line break.';
    if (char===' ') return 'Space once, then continue the phrase.';
    return 'Read slightly ahead and keep the movement relaxed.';
  }

  familyLabel(f) { return {apostrophe:'Quotes / apostrophes',sentence:'Sentence punctuation',brackets:'Brackets / parentheses',path:'Web / path symbols',business:'Business symbols',capitals:'Capitals',numbers:'Number row'}[f]??f; }
  getHUDTime() { this.updateMetrics(); return this.engine.getElapsedMs(); }
  stop() { this.running=false; window.removeEventListener('keydown',this.handleKeydown); }
  describe(v) { if (v==='\n') return 'Enter'; if (v===' ') return 'Space'; return v?`“${v}”`:'Complete'; }
  format(v='') { return this.escape(v).replaceAll('\n','<br>'); }
  escape(v='') { return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
}
