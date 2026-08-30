// v1.6.6 — Crime, Law & Custody III
// Consolidates warrants, arrest, detention, questioning, hearings/judgment,
// political intervention, escape, jurisdiction, and prisoner custody memory.

function lawIIIState(){
 const L=lawState();
 if(!L.custodyIII||typeof L.custodyIII!=='object')L.custodyIII={activeDetention:null,history:[],prisonerHistory:[],authorityTransfers:[],hearings:0,escapes:0,interventions:0};
 if(!Array.isArray(L.custodyIII.history))L.custodyIII.history=[];
 if(!Array.isArray(L.custodyIII.prisonerHistory))L.custodyIII.prisonerHistory=[];
 if(!Array.isArray(L.custodyIII.authorityTransfers))L.custodyIII.authorityTransfers=[];
 return L.custodyIII
}
function activeLawDetention(){return lawIIIState().activeDetention||null}
function lawCustodyHistory(text,tone='info',extra={}){const C=lawIIIState(),row={day:state.world.day,text,...extra};C.history.push(row);C.history=C.history.slice(-80);recordWorldHistory(text,tone,'law');return row}
function lawChargeRows(id){return lawState().crimes.filter(c=>c.locId===id&&c.witnessed).slice(-10)}
function lawChargeSeverity(id){const rows=lawChargeRows(id),w=hasWarrant(id)?lawWarrantSeverity(id):0;return Math.max(w,rows.reduce((m,c)=>Math.max(m,Number(c.severity)||0),0),Math.ceil(lawHeat(id)/3),1)}
function lawProceedingName(d){return d.severity>=5?'Trial':d.severity>=3?'Formal Hearing':'Magistrate Hearing'}
function lawDetentionAuthority(id){const r=jurisdictionRule(id);return {id,authority:r.authority,faction:r.faction,strict:Number(r.strict)||1,location:worldLocation(id).name}}
function normalizeLawWarrantIII(id){const L=lawState(),w=L.warrants[id];if(!w)return null;w.severity=Number(w.severity??CRIME_SEVERITY[w.kind]??lawChargeSeverity(id)??3);w.authority=w.authority||jurisdictionRule(id).authority;w.jurisdiction=id;w.status=w.status||'active';return w}
function lawDetentionReleaseToSettlement(id){
 const F=playerPartyFieldState();F.active=false;F.region=null;F.x=null;F.y=null;F.anchorLocation=null;F.targetPartyId=null;F.sinceDay=null;
 state.world.location=id;clearLawEntryState(id);return id
}

// Custody is a physical context of its own. It must never masquerade as ordinary
// free settlement presence and therefore cannot unlock shops, Hall, politics, etc.
function playerPhysicalContext(){
 if(!isOpenWorld())return{type:'non_open_world',anchor:state.world?.location||null,settlementId:null};
 const detention=activeLawDetention();if(detention)return{type:'custody',anchor:detention.id,settlementId:detention.id,authority:detention.authority};
 const anchor=state.world?.location||null,F=playerPartyFieldState();
 if(state.world?.homeBase?.secretPassage?.sheltering)return{type:'guardian_hall',anchor:'shantium',settlementId:'shantium'};
 if(state.world?.pursuit?.active)return{type:'pursuit',anchor,settlementId:null};
 if(state.world?.travel?.active)return{type:'travel',anchor,settlementId:null};
 if(F.active)return{type:'field',anchor:F.anchorLocation||anchor,settlementId:null,region:F.region,x:F.x,y:F.y,targetPartyId:F.targetPartyId||null};
 const loc=worldLocation(anchor);if(loc&&state.world.settlements?.[loc.id])return{type:'settlement',anchor:loc.id,settlementId:loc.id};
 return{type:'field',anchor,settlementId:null,region:currentWorldRegion()}
}

function beginLawDetention(id=state.world.location,source='authority'){
 const C=lawIIIState();if(C.activeDetention)return showLawDetention();
 const A=lawDetentionAuthority(id),charges=lawChargeRows(id),severity=lawChargeSeverity(id),w=normalizeLawWarrantIII(id);
 const d={id,authority:A.authority,faction:A.faction,strict:A.strict,location:A.location,source,startedDay:state.world.day,stage:'booked',severity,originalSeverity:severity,bounty:localBounty(id),restitution:restitutionDue(id),chargeIds:charges.map(c=>c.id),questioned:false,statement:null,cooperation:0,defense:0,aggravation:0,politicalUsed:false,hearingType:severity>=5?'trial':severity>=3?'formal':'magistrate',history:[]};
 C.activeDetention=d;C.history.push({day:state.world.day,type:'arrest',id,authority:A.authority,severity,bounty:d.bounty,source});C.history=C.history.slice(-80);const L=lawState();L.jailings=(L.jailings||0)+1;
 const F=playerPartyFieldState();F.active=false;F.targetPartyId=null;state.world.location=id;clearLawEntryState(id);lawCustodyHistory(`${state.name} submitted to ${A.authority} custody in ${A.location}.`,'info',{type:'arrest',id});save();return showLawDetention()
}
function submitToArrest(id){return beginLawDetention(id,'voluntary surrender')}

function lawDetentionChargeHTML(d){
 const rows=lawState().crimes.filter(c=>d.chargeIds.includes(c.id));
 if(!rows.length)return '<div class="notice compact">The warrant is supported by accumulated local charges and enforcement heat; no individual surviving case record is available.</div>';
 return rows.map(c=>`<div class="law-case-row"><b>${esc(String(c.kind||'charge').replaceAll('_',' '))}</b><span>Day ${c.day} • severity ${c.severity} • ${c.fine}g assessment</span><small>${esc(c.desc||'Recorded offense')}</small></div>`).join('')
}
function lawDetentionPoliticalOption(d){const opt=lawPoliticalEntryOption(d.id);if(!opt||d.politicalUsed)return null;return {...opt,cost:clamp(4+d.severity*2,4,18)}}
function showLawDetention(){
 const d=activeLawDetention();if(!d)return renderOpenWorld();const political=lawDetentionPoliticalOption(d),proceeding=lawProceedingName(d),daysHeld=Math.max(0,state.world.day-d.startedDay);
 overlay(`<div class="dialog large law-custody-dialog"><div class="dialog-status"><b>IN CUSTODY — ${esc(d.location)}</b><span>${esc(d.authority)}</span></div><h2>Custody & Case</h2>
 <div class="two-col"><div><div class="notice law-custody-status"><b>${esc(proceeding)} pending</b><br><small>Held ${daysHeld} day${daysHeld===1?'':'s'} • case severity ${d.severity} • ${esc(d.stage)}</small></div><div class="stat-row"><span>Outstanding charges</span><b>${localBounty(d.id)}g</b></div><div class="stat-row"><span>Restitution</span><b>${restitutionDue(d.id)}g</b></div><div class="stat-row"><span>Jurisdiction reputation</span><b>${jurisdictionRep(d.id)}</b></div><div class="stat-row"><span>Cooperation / defense</span><b>${d.cooperation>=0?'+':''}${d.cooperation} / ${d.defense>=0?'+':''}${d.defense}</b></div></div><div><h3>Charges Before the Authority</h3>${lawDetentionChargeHTML(d)}</div></div>
 <div class="choice-list law-custody-actions">
 ${!d.questioned?'<button id="custodyAnswer"><b>Answer Questions</b><small>Cooperate with questioning. Charisma and local standing can help; poor answers can strengthen the case.</small></button><button id="custodySilent"><b>Decline to Answer</b><small>Proceed without giving a statement. Neutral legally, but you gain no cooperation credit.</small></button>':'<div class="notice compact"><b>Questioning complete:</b> '+esc(d.statement||'No further statement recorded.')+'</div>'}
 <button id="custodyHearing"><b>Prepare for ${esc(proceeding)}</b><small>Review the case and choose how to answer the charges.</small></button>
 ${political?`<button id="custodyPolitical"><b>Request Political Intervention</b><small>${esc(majorFaction(political.faction).short)} may lean on the local authority. Costs ${political.cost} political capital and can create political debt.</small></button>`:''}
 <button id="custodyEscape"><b>Attempt Escape</b><small>High risk. Success puts the Player Party outside the settlement; failure adds an escape charge and hardens the case.</small></button>
 </div>`,true);
 $('#custodyAnswer')&&($('#custodyAnswer').onclick=lawAnswerQuestions);$('#custodySilent')&&($('#custodySilent').onclick=lawRemainSilent);$('#custodyHearing').onclick=showLawHearing;if($('#custodyPolitical'))$('#custodyPolitical').onclick=lawCustodyPoliticalIntervention;$('#custodyEscape').onclick=attemptLawCustodyEscape
}
function lawAnswerQuestions(){const d=activeLawDetention();if(!d)return;const score=rnd(1,20)+stat(state,'cha')+Math.floor(jurisdictionRep(d.id)/2)+Math.floor((state.reputation||0)/5)-d.severity*2;if(score>=18){d.cooperation=2;d.defense=1;d.statement='A careful statement is entered without materially strengthening the case.';lawCustodyHistory(`${state.name} cooperated effectively during questioning by ${d.authority}.`,'good')}else if(score>=11){d.cooperation=1;d.statement='A routine statement is recorded.';lawCustodyHistory(`${state.name} answered questions while held by ${d.authority}.`,'info')}else{d.aggravation=1;d.statement='Inconsistencies in the statement strengthen the authority’s case.';lawState().heat[d.id]=clamp(lawHeat(d.id)+1,0,25);lawCustodyHistory(`${state.name}'s questioning produced damaging inconsistencies in ${d.location}.`,'bad')}d.questioned=true;d.stage='questioned';save();showLawDetention()}
function lawRemainSilent(){const d=activeLawDetention();if(!d)return;d.questioned=true;d.statement='The Guardian declined to provide a substantive statement.';d.stage='questioned';lawCustodyHistory(`${state.name} declined substantive questioning in ${d.location}.`,'info');save();showLawDetention()}
function showLawHearing(){const d=activeLawDetention();if(!d)return;d.stage='hearing';const name=lawProceedingName(d),canRest=state.gold>=restitutionDue(d.id)&&restitutionDue(d.id)>0;
 overlay(`<div class="dialog large law-hearing"><div class="dialog-status"><b>${esc(name.toUpperCase())}</b><span>${esc(d.authority)}</span></div><h2>${esc(name)} — ${esc(d.location)}</h2><p>The authority will weigh the recorded offenses, local reputation, cooperation, political circumstances, and your chosen position.</p><div class="choice-list"><button id="hearingContest"><b>Contest the Charges</b><small>Argue the evidence and circumstances. Best with Charisma, reputation, and a defensible case.</small></button><button id="hearingMitigate"><b>Accept Responsibility, Argue Mitigation</b><small>Seek a reduced sentence through cooperation and prior standing.</small></button>${canRest?`<button id="hearingRest"><b>Offer Restitution Before Judgment — ${restitutionDue(d.id)}g</b><small>Pay victims first; this substantially improves mitigation.</small></button>`:''}<button id="hearingAccept"><b>Accept Judgment</b><small>Proceed directly to sentence without contesting the case.</small></button><button id="hearingBack">Back to Custody</button></div>`,true);
 $('#hearingContest').onclick=()=>resolveLawJudgment('contest');$('#hearingMitigate').onclick=()=>resolveLawJudgment('mitigate');if($('#hearingRest'))$('#hearingRest').onclick=()=>{const due=restitutionDue(d.id);state.gold-=due;lawState().restitution[d.id]=0;d.defense+=3;d.cooperation+=1;lawCustodyHistory(`${state.name} paid ${due}g restitution before judgment in ${d.location}.`,'good');save();showLawHearing()};$('#hearingAccept').onclick=()=>resolveLawJudgment('accept');$('#hearingBack').onclick=showLawDetention
}
function lawCustodyPoliticalIntervention(){const d=activeLawDetention(),opt=d&&lawDetentionPoliticalOption(d);if(!d||!opt)return showLawDetention();d.politicalUsed=true;adjustPoliticalCapital(d.id,opt.faction,-opt.cost,`intervention in ${state.name}'s custody case`);const roll=rnd(1,20)+opt.score+(state.world.factionStanding[opt.faction]||0)-d.severity*3-d.strict*2;lawIIIState().interventions++;
 if(roll>=35){d.defense+=5;d.severity=Math.max(1,d.severity-2);lawState().heat[d.id]=Math.max(0,lawHeat(d.id)-2);lawCustodyHistory(`${majorFaction(opt.faction).short} successfully pressed ${d.authority} to narrow the case against ${state.name}.`,'good',{type:'political_intervention'})}
 else{d.defense+=1;adjustPoliticalDebt(d.id,opt.faction,1,`failed intervention in ${state.name}'s custody case`);lawCustodyHistory(`${majorFaction(opt.faction).short} intervened, but ${d.authority} refused to materially soften the case.`,'bad',{type:'political_intervention'})}save();showLawDetention()}
function attemptLawCustodyEscape(){const d=activeLawDetention();if(!d)return;const security=state.world.settlements[d.id]?.security??50,pct=clamp(Math.round(12+stat(state,'dex')*3+(state.scouting||0)*2+(guardianClass()==='Rogue'?18:guardianClass()==='Ranger'?10:0)-security*.35-d.strict*4-d.severity*3),4,72);const ok=rnd(1,100)<=pct;lawIIIState().escapes++;
 if(ok){lawIIIState().activeDetention=null;recordCrimeDetailed('escape_custody',d.id,d.faction,{witnessed:true,severity:Math.max(3,d.severity),desc:`escaped ${d.authority} custody`});const w=normalizeLawWarrantIII(d.id);if(w){w.severity=Math.max(w.severity,d.severity+1);w.status='escaped'}lawCustodyHistory(`${state.name} escaped ${d.authority} custody in ${d.location}.`,'bad',{type:'escape'});placePlayerPartyOutsideSettlement(d.id);save();return actionResult('Escape Successful',`The Player Party slips out of custody and reaches the outskirts of ${esc(d.location)}. The warrant remains active and now includes escape from custody.`,'bad',renderOpenWorld)}
 d.aggravation+=2;d.severity=Math.min(7,d.severity+1);recordCrimeDetailed('escape_custody',d.id,d.faction,{witnessed:true,severity:3,desc:`attempted escape from ${d.authority} custody`});lawCustodyHistory(`${state.name} failed an escape attempt from ${d.authority} custody.`,'bad',{type:'failed_escape'});save();actionResult('Escape Failed',`The attempt is stopped. Security tightens, and escape from custody is added to the case.`,'bad',showLawDetention)
}
function resolveLawJudgment(mode='accept'){
 const d=activeLawDetention();if(!d)return;const C=lawIIIState(),L=lawState();C.hearings++;let defense=d.defense+d.cooperation-d.aggravation;
 if(mode==='contest')defense+=Math.floor(stat(state,'cha')/2)+Math.floor(jurisdictionRep(d.id)/2)+rnd(1,12);
 else if(mode==='mitigate')defense+=3+d.cooperation+Math.max(0,Math.floor(jurisdictionRep(d.id)/3))+rnd(1,8);
 const target=8+d.severity*3+d.strict*2,margin=defense-target;let outcome='detention',days=0,pay=0,text='';
 if(mode==='contest'&&margin>=7){outcome='dismissed';text='The authority finds the surviving case insufficient and dismisses the active warrant.'}
 else if(margin>=2){outcome='reduced';d.severity=Math.max(1,d.severity-2);pay=Math.min(state.gold,Math.round(localBounty(d.id)*.35));days=d.severity>=4?2:0;text=`The case is substantially reduced${pay?`, with ${pay}g collected`:''}${days?` and ${days} days of detention`:''}.`}
 else if(d.severity<=2){outcome='fine';pay=Math.min(state.gold,Math.max(10,Math.round(localBounty(d.id)*.75)));days=pay<Math.round(localBounty(d.id)*.5)?1:0;text=`The matter ends with ${pay}g in financial penalties${days?' and one day of local service':''}.`}
 else if(d.severity<=4){outcome='service';pay=Math.min(state.gold,Math.round(localBounty(d.id)*.35));days=clamp(2+d.severity-d.cooperation,2,5);text=`The authority imposes ${days} days of detention/service${pay?` and collects ${pay}g`:''}.`}
 else{outcome='detention';pay=Math.min(state.gold,Math.round(localBounty(d.id)*.2));days=clamp(4+d.severity+d.strict-d.cooperation,5,10);text=`The serious case results in ${days} days of detention${pay?` and ${pay}g collected`:''}.`}
 if(pay)state.gold=Math.max(0,state.gold-pay);if(days)advanceWorldDays(days,`${lawProceedingName(d)} sentence in ${d.location}`);
 if(outcome==='dismissed'){L.bounties[d.id]=0;L.restitution[d.id]=0;L.heat[d.id]=Math.max(0,lawHeat(d.id)-6);delete L.warrants[d.id];adjustJurisdictionRep(d.id,1,'case dismissed after hearing')}
 else{L.bounties[d.id]=0;L.restitution[d.id]=0;L.heat[d.id]=outcome==='reduced'?2:1;delete L.warrants[d.id];adjustJurisdictionRep(d.id,mode==='mitigate'?1:0,`${lawProceedingName(d)} resolved`)}
 d.stage='resolved';d.outcome=outcome;d.resolvedDay=state.world.day;C.history.push({day:state.world.day,type:'judgment',id:d.id,outcome,days,pay,severity:d.severity});C.history=C.history.slice(-80);C.activeDetention=null;lawDetentionReleaseToSettlement(d.id);state.guardian.hp=Math.max(1,Math.round(state.guardian.hp||1));lawCustodyHistory(`${d.authority} resolved ${state.name}'s case in ${d.location}: ${outcome}.`,'info',{type:'judgment',outcome});save();actionResult(`${lawProceedingName(d)} Resolved`,`${text}<br><br>You are released in ${esc(d.location)}. The active warrant for this case is closed.`,'info',renderOpenWorld)
}

// Local-law screen modernization: preserve the existing crime ledger while surfacing
// warrant provenance and custody history so jurisdictional state is understandable.
function showLocalLaw(id=state.world.location){modalRouteEnter('Local Law',Array.from(arguments));const C=lawIIIState(),L=lawState(),p=jurisdictionRule(id),b=localBounty(id),h=lawHeat(id),rest=restitutionDue(id),crimes=L.crimes.filter(c=>c.locId===id).slice(-8).reverse(),jrep=jurisdictionRep(id),w=normalizeLawWarrantIII(id),history=C.history.filter(x=>x.id===id).slice(-5).reverse();
 overlay(`<h2>Law & Authority — ${esc(worldLocation(id).name)}</h2><div class="two-col"><div class="notice ${w?'warning':''}"><b>${esc(wantedTier(id))}${w?' • ACTIVE WARRANT':''}</b><br><small>${esc(p.authority)} • jurisdiction reputation ${jrep}</small><div class="stat-row"><span>Heat</span><b>${h}</b></div><div class="stat-row"><span>Outstanding charges</span><b>${b}g</b></div><div class="stat-row"><span>Restitution</span><b>${rest}g</b></div>${w?`<p class="compact"><b>Warrant:</b> ${esc(String(w.kind||'case').replaceAll('_',' '))} • severity ${lawWarrantSeverity(id)} • issued Day ${w.issuedDay??'?'}</p>`:''}</div><div><h3>Recent Case History</h3>${history.map(x=>`<div class="history-entry"><b>Day ${x.day}</b> — ${esc(x.text||x.type||'case event')}</div>`).join('')||'<p class="muted">No custody or hearing history here yet.</p>'}</div></div><h3>Recorded Offenses</h3>${crimes.map(c=>`<div class="card compact"><b>Day ${c.day}: ${esc(c.desc)}</b><br>${c.witnessed?`Reported / witnessed (${c.witnessChance??'?'}% witness likelihood) • assessed ${c.fine}g • severity ${c.severity}`:`No actionable witness (${c.witnessChance??'?'}% witness likelihood)`}</div>`).join('')||'<p class="muted">No local offenses recorded.</p>'}<div class="choice-list">${b>0?`${lawFineSettlementAllowed(id)?`<button id="lawPay" ${state.gold<b?'disabled':''}>Pay Outstanding Charges — ${b}g</button>`:`<div class="warning notice compact">This warrant requires custody or formal intervention; paying money alone will not erase a serious case.</div>`}<button id="lawAppeal">Appeal / Negotiate Charges</button><button id="lawBribe" ${state.gold<Math.max(20,Math.round(b*.55))?'disabled':''}>Attempt Quiet Payment</button>`:''}${rest>0?`<button id="lawRestitution" ${state.gold<rest?'disabled':''}>Pay Restitution — ${rest}g</button>`:''}${w?'<button id="lawSubmit"><b>Submit to Arrest / Formal Process</b><small>Enter custody, questioning, and hearing/judgment instead of skipping directly through jail time.</small></button>':''}</div><div class="dialog-footer"><button id="localLawBack">Back to Market & Services</button></div>`,true);
 if($('#lawPay'))$('#lawPay').onclick=()=>clearLocalLaw(id,'fine');if($('#lawAppeal'))$('#lawAppeal').onclick=()=>clearLocalLaw(id,'appeal');if($('#lawBribe'))$('#lawBribe').onclick=()=>bribeLocalAuthority(id);if($('#lawRestitution'))$('#lawRestitution').onclick=()=>payRestitution(id);if($('#lawSubmit'))$('#lawSubmit').onclick=()=>submitToArrest(id);if($('#localLawBack'))$('#localLawBack').onclick=()=>SOSServices.navigation.back(()=>showSettlementServices(id));wireClose()
}

// Settlement checkpoints now enter the same custody pipeline used by bounty hunters
// and the law screen instead of invoking a separate abstract jail resolution.
function maybeLawCheckpoint(id=state.world.location,onEntered=null){
 if(!state.world.settlements[id]||!hasWarrant(id)){if(typeof onEntered==='function')return onEntered();return false}const p=jurisdictionRule(id),b=localBounty(id),rest=restitutionDue(id),canPay=lawFineSettlementAllowed(id),w=normalizeLawWarrantIII(id);
 overlay(`<div class="dialog"><h2>Stopped by ${esc(p.authority)}</h2><div class="warning notice"><b>${esc(wantedTier(id))} • warrant severity ${lawWarrantSeverity(id)}</b><br>${b}g charges${rest?` • ${rest}g restitution`:''}</div><div class="choice-list"><button id="lawStopSubmit"><b>Submit to Custody</b><small>Proceed through questioning and a ${esc(lawProceedingName({severity:lawWarrantSeverity(id)}).toLowerCase())}.</small></button><button id="lawStopPay" ${(!canPay||state.gold<b)?'disabled':''}>Pay Eligible Charges — ${b}g</button>${rest?`<button id="lawStopRest" ${state.gold<rest?'disabled':''}>Pay Restitution — ${rest}g</button>`:''}<button id="lawStopTalk">Ask to Speak Before Detention</button><button id="lawStopRun">Flee the Checkpoint</button></div>${!canPay?'<p class="compact muted">Serious warrants cannot be erased by paying the posted financial amount at the gate.</p>':''}</div>`,true);
 $('#lawStopSubmit').onclick=()=>beginLawDetention(id,'settlement checkpoint');$('#lawStopPay').onclick=()=>payLawChargesForEntry(id,onEntered);if($('#lawStopRest'))$('#lawStopRest').onclick=()=>payRestitution(id);$('#lawStopTalk').onclick=()=>{const roll=rnd(1,20)+stat(state,'cha')+Math.floor(jurisdictionRep(id)/2);if(roll>=19){lawState().heat[id]=Math.max(0,lawHeat(id)-1);return actionResult('Allowed Through','The officer accepts your explanation for now, though the underlying warrant remains unresolved.','good',()=>{clearLawEntryState(id);return typeof onEntered==='function'?onEntered():renderOpenWorld()})}actionResult('Detention Still Required',`${esc(p.authority)} refuses to waive the warrant at the checkpoint.`,'bad',()=>maybeLawCheckpoint(id,onEntered))};$('#lawStopRun').onclick=()=>{recordCrimeDetailed('escape_custody',id,p.faction,{witnessed:true,desc:'fled a lawful settlement checkpoint'});setLawEntryState(id,'outside',{fledCheckpoint:true});placePlayerPartyOutsideSettlement(id);save();actionResult('You Flee',`The Player Party escapes back outside ${esc(worldLocation(id).name)}. The new flight is added to the local case.`,'bad',renderOpenWorld)};return true
}

function ensurePrisonerCustodyIII(p){if(!p)return null;if(!p.custodyIII||typeof p.custodyIII!=='object')p.custodyIII={holder:p.hallCustody?'guardian_hall':'player_party',location:p.hallCustody?'shantium':state.world.location,jurisdiction:p.hallCustody?'shantium':null,sinceDay:p.round||state.world.day,status:'held'};if(p.hallCustody){p.custodyIII.holder='guardian_hall';p.custodyIII.location='shantium'}return p.custodyIII}
function prisonerCustodyLabelIII(p){const c=ensurePrisonerCustodyIII(p);return c.holder==='guardian_hall'?'Guardian Hall custody':c.holder==='authority'?`${c.authority||'Local authority'} custody`:'Traveling with Player Party'}
function recordPrisonerCustodyIII(p,action,extra={}){const C=lawIIIState(),row={day:state.world.day,prisonerId:p.id,faction:p.faction,count:p.count,source:p.source,action,...extra};C.prisonerHistory.push(row);C.prisonerHistory=C.prisonerHistory.slice(-100);return row}

// Capture legacy prisoner actions and layer jurisdiction-aware custody accounting over them.
const SOS_LEGACY_PRISONER_ACTION_166=prisonerAction;
prisonerAction=function(id,action,returnHall=false){const p=state.prisoners.find(x=>x.id===id);if(!p)return;ensurePrisonerCustodyIII(p);
 if(action==='deposit'&&(!isOpenWorld()||!playerPartyInsideSettlement('shantium')))return actionResult('Guardian Hall Not Reachable','Prisoners can be transferred to Guardian Hall only while the Player Party is physically inside Shantium.','info',showPrisoners);
 if(action==='labor'&&(!isOpenWorld()||!playerPartyInsideSettlement('shantium')||!p.hallCustody))return actionResult('Holding Area Not Reachable','Guardian Hall custody decisions require physical presence in Shantium.','info',()=>returnHall?showHomePrisoners():showPrisoners);
 if(action==='handover'&&isOpenWorld()&&!playerPartyInsideSettlement(state.world.location))return actionResult('No Authority Present','A formal prisoner handover requires the Player Party to be physically inside a settlement with a local authority.','info',()=>returnHall?showHomePrisoners():showPrisoners);
 const before={...p,custodyIII:{...p.custodyIII}};const result=SOS_LEGACY_PRISONER_ACTION_166(id,action,returnHall);const still=state.prisoners.find(x=>x.id===id);
 if(action==='deposit'&&still){const c=ensurePrisonerCustodyIII(still);c.holder='guardian_hall';c.location='shantium';c.jurisdiction='shantium';c.authority='Guardian Hall';c.sinceDay=state.world.day;recordPrisonerCustodyIII(still,'transfer_to_hall',{location:'shantium'})}
 else if(action==='question'&&still){const c=ensurePrisonerCustodyIII(still);c.lastQuestionedDay=state.world.day;recordPrisonerCustodyIII(still,'questioned',{location:c.location})}
 else if(['handover','exchange','release','ransom','enlist'].includes(action)){recordPrisonerCustodyIII(before,action,{location:state.world.location,authority:action==='handover'?jurisdictionRule(state.world.location).authority:null})}
 save();return result
};

function prisonerCardHTML(p,scope='party'){
 const ow=isOpenWorld(),physical=ow?playerPhysicalContext():null,inside=ow&&physical?.type==='settlement',authority=inside&&!!state.world.settlements?.[physical.settlementId],hall=scope==='hall',c=ensurePrisonerCustodyIII(p),named=Array.isArray(p.namedPersonNames)&&p.namedPersonNames.length?` • ${p.namedPersonNames.map(esc).join(', ')}`:'';
 const metaLine=`${p.world?'Day':'Round'} ${p.round} • ${esc(p.source||'an enemy force')}${named}${p.hallLabor?' • Supervised work crew':''}<br><small><b>Custody:</b> ${esc(prisonerCustodyLabelIII(p))}${c.jurisdiction?` • jurisdiction ${esc(worldLocation(c.jurisdiction).name)}`:''}</small>`;
 const common=`<button data-question="${p.id}" ${p.questioned?'disabled':''}>Question</button><button data-release="${p.id}" ${ow&&!authority&&!hall?'disabled':''}>Release</button>`;
 const world=p.world?`<button data-ransom="${p.id}" ${!authority?'disabled':''}>Ransom</button><button data-handover="${p.id}" ${!authority?'disabled':''}>Hand Over to ${authority?esc(jurisdictionRule(physical.settlementId).authority):'Authority'}</button>`:'';
 const hallExtra=hall?`${p.world?world:''}<button data-labor="${p.id}">${p.hallLabor?'End Work Assignment':'Assign Work Crew'}</button>`:`${world}${ow&&playerPartyInsideSettlement('shantium')?`<button data-deposit="${p.id}">Transfer to Guardian Hall</button>`:''}`;
 const enlist='';
 return `<div class="prisoner-card"><h4>${esc(p.faction)} prisoners — ${p.count}</h4><div class="compact">${metaLine}</div><div class="choice-list">${common}${hallExtra}${enlist}</div></div>`
}

// A saved campaign cannot bypass an unresolved detention by reloading into the
// ordinary regional map. Any Open World render while custody is active resumes
// the custody case UI first.
const SOS_RENDER_OPEN_WORLD_166=renderOpenWorld;
renderOpenWorld=function(){if(activeLawDetention())return showLawDetention();return SOS_RENDER_OPEN_WORLD_166.apply(this,arguments)};
