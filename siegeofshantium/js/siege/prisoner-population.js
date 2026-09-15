// v1.6.65.24 — Guardian Hall Prisoner Population Overhaul
// Hall custody is managed as populations/cohorts. Legacy capture-group rows remain
// as compatibility backing records for older custody/law systems, but are no longer
// the primary Hall management surface.

const HOME_PRISONER_POPULATION_VERSION=1;
const HOME_PRISONER_COHORTS={
 general:{id:'general',label:'General Custody',desc:'Ordinary Hall prisoners managed as a shared population.',tone:''},
 skilled:{id:'skilled',label:'Skilled / Trade Custody',desc:'Prisoners with a recorded trade or useful specialty.',tone:'good'},
 high:{id:'high',label:'High Security',desc:'Prisoners requiring tighter supervision or carrying an elevated security risk.',tone:'warning'},
 special:{id:'special',label:'Special Custody',desc:'Named, politically significant, or otherwise individually tracked captives.',tone:'warning'}
};

function homePrisonerPopulationState(){
 ensureHomeBase();
 const h=state.world.homeBase;
 if(!h.prisonerPopulation||typeof h.prisonerPopulation!=='object')h.prisonerPopulation={version:HOME_PRISONER_POPULATION_VERSION,migratedDay:state.world.day,history:[],archive:{admissions:0,releases:0,byClass:{},byFaction:{}}};
 const P=h.prisonerPopulation;
 if(!Array.isArray(P.history))P.history=[];
 if(!P.archive||typeof P.archive!=='object')P.archive={admissions:0,releases:0,byClass:{},byFaction:{}};
 if(!P.archive.byClass)P.archive.byClass={};
 if(!P.archive.byFaction)P.archive.byFaction={};
 P.version=HOME_PRISONER_POPULATION_VERSION;
 return P
}
function homePrisonerIsSpecial(p){return !!(p&&(p.specialCustody||p.namedTravelerId||(Array.isArray(p.namedPersonIds)&&p.namedPersonIds.length)||(Array.isArray(p.namedPersonNames)&&p.namedPersonNames.length)))}
function homePrisonerTradeLabel(p){
 if(!p)return '';
 if(typeof p.tradeSkill==='string'&&p.tradeSkill.trim())return p.tradeSkill.trim();
 if(typeof p.profession==='string'&&p.profession.trim())return p.profession.trim();
 if(typeof p.skill==='string'&&p.skill.trim())return p.skill.trim();
 if(Array.isArray(p.skills)&&p.skills.length)return String(p.skills[0]||'').trim();
 const s=`${p.source||''} ${p.faction||''}`.toLowerCase();
 const m=s.match(/\b(mason|carpenter|smith|blacksmith|farmer|herbalist|scribe|miner|quarryman|artisan|engineer|healer|cook|tailor)\b/);
 return m?m[1].replace(/^./,c=>c.toUpperCase()):''
}
function homePrisonerIsHighSecurity(p){
 if(!p||homePrisonerIsSpecial(p))return false;
 if(p.highSecurity||p.violent||p.escapeRisk==='high'||p.securityRisk==='high')return true;
 return /\b(assassin|commander|captain|chief|leader|reaver|marauder captain|war chief)\b/i.test(`${p.source||''} ${p.faction||''}`)
}
function homePrisonerCohortClass(p){
 if(homePrisonerIsSpecial(p))return 'special';
 if(homePrisonerIsHighSecurity(p))return 'high';
 if(homePrisonerTradeLabel(p))return 'skilled';
 return 'general'
}
function homePrisonerHistoryCompact(){
 const P=homePrisonerPopulationState();
 if(P.history.length<=72)return;
 const old=P.history.splice(0,P.history.length-54);
 for(const r of old){
  const n=Math.max(0,Number(r.count)||0),kind=r.kind||'admission',cls=r.cohort||'general',fac=r.faction||'Unknown';
  if(kind==='admission')P.archive.admissions=(P.archive.admissions||0)+n;else P.archive.releases=(P.archive.releases||0)+n;
  P.archive.byClass[cls]=(P.archive.byClass[cls]||0)+n;
  P.archive.byFaction[fac]=(P.archive.byFaction[fac]||0)+n;
 }
}
function homePrisonerRecordAdmission(p,legacy=false){
 if(!p||!p.hallCustody||p.hallPopulationAdmissionRecorded)return false;
 const P=homePrisonerPopulationState(),cls=homePrisonerCohortClass(p),day=Math.max(0,Number(p.round)||state.world.day||0);
 P.history.push({kind:'admission',day,count:Math.max(1,p.count||1),faction:p.faction||'Unknown',source:p.source||'Custody transfer',cohort:cls,trade:homePrisonerTradeLabel(p)||'',legacy:!!legacy});
 p.hallPopulationAdmissionRecorded=true;p.hallCohortClass=cls;
 homePrisonerHistoryCompact();return true
}
function syncHomePrisonerPopulation(){
 const P=homePrisonerPopulationState();let changed=false;
 for(const p of hallPrisoners()){
  const cls=homePrisonerCohortClass(p);if(p.hallCohortClass!==cls){p.hallCohortClass=cls;changed=true}
  if(!p.hallPopulationAdmissionRecorded)changed=homePrisonerRecordAdmission(p,true)||changed;
 }
 P.lastSyncDay=state.world.day;return changed
}
function homePrisonerCohortRows(){
 syncHomePrisonerPopulation();
 const map={general:[],skilled:[],high:[],special:[]};
 for(const p of hallPrisoners())(map[homePrisonerCohortClass(p)]||map.general).push(p);
 return map
}
function homePrisonerCountRows(rows){return rows.reduce((n,p)=>n+Math.max(0,p.count||0),0)}
function homePrisonerWorkCountRows(rows){return rows.filter(p=>p.hallLabor).reduce((n,p)=>n+Math.max(0,p.count||0),0)}
function homePrisonerAffiliations(rows){
 const m=new Map();for(const p of rows){const k=p.faction||'Unknown',x=m.get(k)||{faction:k,count:0,groups:0,work:0};x.count+=Math.max(0,p.count||0);x.groups++;if(p.hallLabor)x.work+=Math.max(0,p.count||0);m.set(k,x)}
 return Array.from(m.values()).sort((a,b)=>b.count-a.count||a.faction.localeCompare(b.faction))
}
function homePrisonerPopulationSummary(){
 const rows=homePrisonerCohortRows(),total=hallPrisonerCount(),ordinary=total-homePrisonerCountRows(rows.special),work=homePrisonerWorkCountRows([...rows.general,...rows.skilled,...rows.high]),special=homePrisonerCountRows(rows.special);
 return {rows,total,ordinary,work,special,general:homePrisonerCountRows(rows.general),skilled:homePrisonerCountRows(rows.skilled),high:homePrisonerCountRows(rows.high)}
}
function homePrisonerCohortBadgeHTML(id,n){const d=HOME_PRISONER_COHORTS[id];return `<div class="card compact ${d.tone==='warning'?'warning':''}"><div class="stat-row"><span><b>${esc(d.label)}</b><small>${esc(d.desc)}</small></span><b>${n}</b></div></div>`}
function homePrisonerAffiliationText(rows){const a=homePrisonerAffiliations(rows);if(!a.length)return 'No prisoners';return a.slice(0,4).map(x=>`${x.faction} ${x.count}`).join(' • ')+(a.length>4?` • +${a.length-4} more`:'')}
function homePrisonerCohortCard(id,rows){
 const d=HOME_PRISONER_COHORTS[id],n=homePrisonerCountRows(rows),work=homePrisonerWorkCountRows(rows),aff=homePrisonerAffiliations(rows);
 return `<div class="card prisoner-population-card ${d.tone==='warning'?'warning':''}"><div class="prisoner-card-head"><h4>${esc(d.label)}</h4><span class="prisoner-count-badge">×${n}</span></div><p class="compact">${esc(d.desc)}</p><div class="stat-row"><span>Affiliations represented</span><b>${aff.length}</b></div>${id!=='special'?`<div class="stat-row"><span>Current supervised work roster</span><b>${work}</b></div>`:''}<small>${esc(homePrisonerAffiliationText(rows))}</small><div class="prisoner-actions"><button data-popcohort="${id}" ${n?'':'disabled'}>${id==='special'?'Review Special Custody':'Manage Cohort'}</button></div></div>`
}
function homePrisonerHistoryHTML(limit=24){
 const P=homePrisonerPopulationState(),rows=P.history.slice(-limit).reverse();
 const archived=(P.archive.admissions||0)+(P.archive.releases||0);
 return `${archived?`<div class="notice compact"><b>Older custody records condensed:</b> ${P.archive.admissions||0} admissions • ${P.archive.releases||0} departures.</div>`:''}${rows.map(r=>`<div class="history-entry"><b>Day ${r.day}</b> — ${r.kind==='admission'?'Admitted':'Departed'} ${r.count} ${esc(r.faction)} prisoner${r.count===1?'':'s'} • ${esc(HOME_PRISONER_COHORTS[r.cohort]?.label||'Custody')}<br><small>${esc(r.source||'Guardian Hall')}</small></div>`).join('')||'<p class="muted">No Hall custody history has been recorded yet.</p>'}`
}
function showHomePrisonerHistory(){
 guardianHallRouteEnter('showHomePrisonerHistory',[]);syncHomePrisonerPopulation();
 overlay(`<h2>Guardian Hall — Custody History</h2><div class="notice compact">Admission history preserves where Hall prisoners came from without forcing every old capture group to remain a permanent management row.</div>${homePrisonerHistoryHTML(36)}<div class="dialog-footer"><button id="homePrisonerHistoryBack">Back to Prisoner Management</button></div>`,true);
 $('#homePrisonerHistoryBack').onclick=()=>guardianHallRouteBack(showHomePrisoners)
}
function showHomePrisonerCohort(id){
 guardianHallRouteEnter('showHomePrisonerCohort',[id]);const all=homePrisonerCohortRows(),rows=all[id]||[],d=HOME_PRISONER_COHORTS[id]||HOME_PRISONER_COHORTS.general,n=homePrisonerCountRows(rows);
 if(id==='special'){
  overlay(`<h2>${esc(d.label)}</h2><div class="notice compact"><b>${n} individually tracked captive${n===1?'':'s'}.</b><br>Named and politically significant captives remain separate from the ordinary Hall population.</div>${rows.map(p=>prisonerCardHTML(p,'hall')).join('')||'<div class="notice muted">No prisoners currently require special custody.</div>'}<div class="dialog-footer"><button id="homePrisonerCohortBack">Back to Prisoner Management</button></div>`,true);wirePrisonerButtons(true);$('#homePrisonerCohortBack').onclick=()=>guardianHallRouteBack(showHomePrisoners);return
 }
 const aff=homePrisonerAffiliations(rows);
 const affinity=aff.map(a=>`<div class="card compact"><div class="stat-row"><span><b>${esc(a.faction)}</b><small>${a.groups} admission record${a.groups===1?'':'s'} consolidated here</small></span><b>${a.count}</b></div><div class="stat-row"><span>On current work roster</span><b>${a.work}</b></div><div class="prisoner-actions"><button data-popaff="${esc(id)}|${esc(a.faction)}">Manage ${esc(a.faction)}</button></div></div>`).join('');
 overlay(`<h2>${esc(d.label)}</h2><div class="notice compact"><b>${n} prisoners in this cohort.</b><br>Capture groups are consolidated by custody class and affiliation. Admission provenance remains in Custody History.</div>${affinity||'<div class="notice muted">This cohort is empty.</div>'}<div class="dialog-footer"><button id="homePrisonerCohortBack">Back to Prisoner Management</button></div>`,true);
 document.querySelectorAll('[data-popaff]').forEach(b=>b.onclick=()=>{const [c,...rest]=b.dataset.popaff.split('|');showHomePrisonerAffiliation(c,rest.join('|'))});$('#homePrisonerCohortBack').onclick=()=>guardianHallRouteBack(showHomePrisoners)
}
function homePrisonerAffiliationBackingRows(cls,faction){return hallPrisoners().filter(p=>homePrisonerCohortClass(p)===cls&&(p.faction||'Unknown')===faction&&!homePrisonerIsSpecial(p))}
function showHomePrisonerAffiliation(cls,faction){
 guardianHallRouteEnter('showHomePrisonerAffiliation',[cls,faction]);const rows=homePrisonerAffiliationBackingRows(cls,faction),n=homePrisonerCountRows(rows),work=homePrisonerWorkCountRows(rows),sources=new Map();
 for(const p of rows){const k=p.source||'Unknown source';sources.set(k,(sources.get(k)||0)+Math.max(0,p.count||0))}
 const src=Array.from(sources.entries()).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([s,c])=>`<div class="stat-row"><span>${esc(s)}</span><b>${c}</b></div>`).join('');
 const canExchange=rows.length&&rows.every(prisonerExchangeEligibleIII),canRansom=rows.length&&rows.every(prisonerRansomEligibleIII);
 overlay(`<h2>${esc(faction)} — ${esc(HOME_PRISONER_COHORTS[cls]?.label||'Custody')}</h2><div class="notice compact"><b>${n} prisoners</b> • ${rows.length} historical admission record${rows.length===1?'':'s'} consolidated into one management population.</div><h3>Origins</h3>${src||'<p class="muted">No origin records.</p>'}<h3>Current Status</h3><div class="stat-row"><span>Assigned through persistent work crews</span><b>${work} / ${n}</b></div><div class="choice-list compact"><button id="popAffCrews">Manage Work Crews</button><button id="popAffRelease">Release This Population</button>${canExchange?'<button id="popAffExchange">Exchange This Population</button>':''}${canRansom?'<button id="popAffRansom">Ransom This Population</button>':''}<button id="popAffHandover">Hand Over This Population</button></div><p class="compact muted">These actions apply to the consolidated population while preserving the effects attached to its underlying custody records.</p><div class="dialog-footer"><button id="popAffBack">Back to Cohort</button></div>`,true);
 if($('#popAffCrews'))$('#popAffCrews').onclick=showHomePrisonerCrews;$('#popAffRelease').onclick=()=>homePrisonerPopulationAction(cls,faction,'release');if($('#popAffExchange'))$('#popAffExchange').onclick=()=>homePrisonerPopulationAction(cls,faction,'exchange');if($('#popAffRansom'))$('#popAffRansom').onclick=()=>homePrisonerPopulationAction(cls,faction,'ransom');$('#popAffHandover').onclick=()=>homePrisonerPopulationAction(cls,faction,'handover');$('#popAffBack').onclick=()=>guardianHallRouteBack(()=>showHomePrisonerCohort(cls))
}
function homePrisonerPopulationDepartureHistory(rows,action){
 const P=homePrisonerPopulationState(),label={release:'Released from Guardian Hall',exchange:'Exchanged from Guardian Hall',ransom:'Ransomed from Guardian Hall',handover:'Handed to Shantium authority'}[action]||'Departed Guardian Hall';
 const by=new Map();for(const p of rows){const k=`${homePrisonerCohortClass(p)}|${p.faction||'Unknown'}`,x=by.get(k)||{cohort:homePrisonerCohortClass(p),faction:p.faction||'Unknown',count:0};x.count+=Math.max(0,p.count||0);by.set(k,x)}
 for(const x of by.values())P.history.push({kind:'departure',day:state.world.day,count:x.count,faction:x.faction,source:label,cohort:x.cohort});homePrisonerHistoryCompact()
}
function homePrisonerPopulationAction(cls,faction,action){
 const rows=homePrisonerAffiliationBackingRows(cls,faction);if(!rows.length)return showHomePrisonerCohort(cls);
 if(action==='labor'){
  const allWorking=rows.every(p=>p.hallLabor);for(const p of rows)p.hallLabor=!allWorking;
  const n=homePrisonerCountRows(rows);recordWorldHistory(`${n} ${faction} prisoner${n===1?'':'s'} ${allWorking?'leave':'enter'} the current supervised Hall work roster.`,'info','home');save();return showHomePrisonerAffiliation(cls,faction)
 }
 const ids=new Set(rows.map(p=>p.id)),groupCount=rows.length,total=homePrisonerCountRows(rows);
 if(action==='exchange'&&!rows.every(prisonerExchangeEligibleIII))return showHomePrisonerAffiliation(cls,faction);
 if(action==='ransom'&&!rows.every(prisonerRansomEligibleIII))return showHomePrisonerAffiliation(cls,faction);
 homePrisonerPopulationDepartureHistory(rows,action);
 if(action==='release'){
  for(const p of rows){if(prisonerCriminalIII(p)){const penalty=(p.count||1)>=6?3:(p.count||1)>=3?2:1;changeLocalReputation('shantium',-penalty,`released ${p.count||1} captured ${p.faction||'criminal'} prisoners nearby`);const ss=settlementState('shantium');if(ss)ss.security=clamp((ss.security||50)-1,0,100)}else{state.reputation+=2;state.flags.compassion++;if(state.relations[p.faction]!=null)state.relations[p.faction]++}}
 }else if(action==='exchange'){
  state.town.morale+=2*groupCount;if(state.relations[faction]!=null)state.relations[faction]+=groupCount;
 }else if(action==='ransom'){
  gainGold(total*18);state.world.factionStanding.Mercenaries=(state.world.factionStanding.Mercenaries||0)+groupCount;
 }else if(action==='handover'){
  const fac=faction==='Redstone'?'Coalition':'Shantium';state.world.factionStanding[fac]=(state.world.factionStanding[fac]||0)+2*groupCount;state.reputation+=groupCount;
 }
 state.prisoners=state.prisoners.filter(p=>!ids.has(p.id));
 recordWorldHistory(`${total} ${faction} prisoner${total===1?'':'s'} ${action==='release'?'were released':action==='exchange'?'were exchanged':action==='ransom'?'were ransomed':'were handed over to Shantium authorities'} as a consolidated Hall population.`,'info','home');
 save();showHomePrisonerCohort(cls)
}

// Hall management surface: population-first, not capture-record-first.
showHomePrisoners=function(){
 modalRouteEnter('Guardian Hall Prisoner Management',Array.from(arguments));
 if(!isOpenWorld()||!canAccessGuardianHall())return actionResult('Guardian Hall Not Reachable','Prisoner management requires access to Guardian Hall in Shantium.','info',renderOpenWorld);
 normalize();ensureHomeBase();const s=homePrisonerPopulationSummary(),cap=homePrisonerCapacity(),laborCap=homePrisonerLaborCapacity(),P=homePrisonerPopulationState();
 const cards=['general','skilled','high','special'].map(id=>homePrisonerCohortCard(id,s.rows[id])).join('');
 overlay(`<h2>Guardian Hall — Prisoner Management</h2><div class="notice compact"><b>Population management</b><br>Ordinary prisoners are consolidated into custody cohorts. Their original capture and transfer records remain in history, while named or politically significant captives remain individually tracked.</div><div class="prisoner-population-summary"><div class="stat-row"><span>Total Hall population</span><b>${s.total} / ${cap}${s.total>cap?' • OVER CAPACITY':''}</b></div><div class="stat-row"><span>Ordinary population</span><b>${s.ordinary}</b></div><div class="stat-row"><span>Special custody</span><b>${s.special}</b></div><div class="stat-row"><span>Current supervised work roster</span><b>${s.work} / ${laborCap} effective capacity</b></div></div><div class="prisoner-cohort-grid">${cards}</div><div class="choice-list compact"><button id="homePrisonerCrews">Work Crews & Facilities</button><button id="homePrisonerHistory">Custody History & Provenance</button></div><div class="notice compact muted"><b>Population model active since Day ${P.migratedDay??state.world.day}.</b> Older capture groups are retained only as compatibility records beneath these cohorts.</div><div class="dialog-footer"><button id="hallPrisonerBack">Back to Guardian Hall</button></div>`,true);
 document.querySelectorAll('[data-popcohort]').forEach(b=>b.onclick=()=>showHomePrisonerCohort(b.dataset.popcohort));if($('#homePrisonerCrews'))$('#homePrisonerCrews').onclick=showHomePrisonerCrews;$('#homePrisonerHistory').onclick=showHomePrisonerHistory;$('#hallPrisonerBack').onclick=()=>SOSServices.navigation.back(showHomeBase)
};

// Keep population history synchronized even when a significant captive is acted
// on through the legacy individual custody action path.
const SOS_PRISONER_ACTION_16524_BASE=prisonerAction;
prisonerAction=function(id,action,returnHall=false){
 const before=state.prisoners.find(x=>x.id===id),wasHall=!!before?.hallCustody,beforeSnap=before?{count:before.count,faction:before.faction,source:before.source,cohort:homePrisonerCohortClass(before)}:null;
 const result=SOS_PRISONER_ACTION_16524_BASE(id,action,returnHall),after=state.prisoners.find(x=>x.id===id);
 if(action==='deposit'&&after?.hallCustody){if(homePrisonerRecordAdmission(after,false))save()}
 else if(wasHall&&beforeSnap&&['release','exchange','ransom','handover','enlist'].includes(action)&&!after){
  const P=homePrisonerPopulationState();P.history.push({kind:'departure',day:state.world.day,count:Math.max(1,beforeSnap.count||1),faction:beforeSnap.faction||'Unknown',source:{release:'Released from Guardian Hall',exchange:'Exchanged from Guardian Hall',ransom:'Ransomed from Guardian Hall',handover:'Handed to local authority',enlist:'Entered Guardian service'}[action]||'Departed Guardian Hall',cohort:beforeSnap.cohort});homePrisonerHistoryCompact();save()
 }
 return result
};
