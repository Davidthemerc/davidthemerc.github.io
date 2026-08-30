function contractStatusLabel(q){if(q.status==='ready')return SOSText("contracts_contracts_journal.contractStatusLabel.001");if(q.status==='complete')return SOSText("contracts_contracts_journal.contractStatusLabel.002");if(q.status==='failed')return SOSText("contracts_contracts_journal.contractStatusLabel.003");if(q.status==='abandoned')return SOSText("contracts_contracts_journal.contractStatusLabel.004");if(q.type==='escort'&&q.escortStage==='escorting')return SOSText("contracts_contracts_journal.contractStatusLabel.005");if(q.type==='escort'&&q.escortStage==='rendezvous')return SOSText("contracts_contracts_journal.contractStatusLabel.006");if(q.type==='diplomacy'&&q.decisionReady)return SOSText("contracts_contracts_journal.contractStatusLabel.007");return SOSText("contracts_contracts_journal.contractStatusLabel.008")}
function contractDaysLeft(q){return q.dueDay==null?null:q.dueDay-state.world.day}
function contractTargetName(q){return worldLocation(q.target)?.name||SOSText("contracts_contracts_journal.contractTargetName.001")}
function contractIssuerName(q){return q?.issuerName||worldLocation(q.origin)?.name||SOSText("contracts_contracts_journal.contractIssuerName.001")}
function contractWorldSourceText(q){return q?.worldSourceText||''}
function contractWorldSourceHTML(q){return q?.worldLinked?`<div class="world-contract-source"><b>Living-world source</b><br>${esc(contractWorldSourceText(q)||'This work comes from an active person, Party, route, or settlement condition in the current world.')}${q.worldFollowThroughText?`<br><small><b>World result:</b> ${esc(q.worldFollowThroughText)}</small>`:''}</div>`:''}
function ensureContractMemory(){
 ensureWorldState();if(!state.world.contractMemory||typeof state.world.contractMemory!=='object')state.world.contractMemory={entities:{},history:[]};if(!state.world.contractMemory.entities||typeof state.world.contractMemory.entities!=='object')state.world.contractMemory.entities={};if(!Array.isArray(state.world.contractMemory.history))state.world.contractMemory.history=[];return state.world.contractMemory
}
function contractMemoryEntity(key,label){
 if(!key)return null;const M=ensureContractMemory();if(!M.entities[key])M.entities[key]={key,label:label||key,accepted:0,completed:0,failed:0,abandoned:0,early:0,lastMinute:0,late:0,score:0,lastOutcome:null,lastDay:0};const r=M.entities[key];if(label)r.label=label;return r
}
function contractMemoryKeys(q){
 if(!q)return[];const rows=[];if(q.issuerNpcId)rows.push([`npc:${q.issuerNpcId}`,q.issuerName||'Local contact']);if(q.relationshipSourceKind==='npc'&&q.relationshipSourceId)rows.push([`npc:${q.relationshipSourceId}`,q.relationshipSourceName||'Known contact']);if(q.referralTravelerId)rows.push([`traveler:${q.referralTravelerId}`,q.referralTravelerName||'Road contact']);if(q.relationshipSourceKind==='traveler'&&q.relationshipSourceId)rows.push([`traveler:${q.relationshipSourceId}`,q.relationshipSourceName||'Road contact']);if(q.worldPartyId)rows.push([`party:${q.worldPartyId}`,q.targetPartyName||q.escortPartyName||'World Party']);if(q.origin)rows.push([`settlement:${q.origin}`,worldLocation(q.origin)?.name||q.origin]);const seen=new Set();return rows.filter(([k])=>k&&!seen.has(k)&&seen.add(k))
}
function contractMemoryScore(r){return r?clamp((r.completed||0)*2+(r.early||0)-(r.failed||0)*2-(r.abandoned||0)*3-(r.late||0),-12,12):0}
function contractMemoryTier(r){const n=contractMemoryScore(r);return n>=8?'Preferred':n>=4?'Trusted':n>=2?'Reliable':n<=-6?'Unreliable':n<=-2?'Wary':'Unproven'}
function contractPrimaryMemory(q){for(const [k,l] of contractMemoryKeys(q)){if(!k.startsWith('settlement:'))return contractMemoryEntity(k,l)}const row=contractMemoryKeys(q)[0];return row?contractMemoryEntity(row[0],row[1]):null}
function contractMemorySourceHTML(q){const r=contractPrimaryMemory(q);if(!r||(r.accepted||0)+(r.completed||0)+(r.failed||0)+(r.abandoned||0)===0)return'';return `<div class="notice compact"><b>Working relationship: ${esc(contractMemoryTier(r))}</b> — ${esc(r.label)}<br><small>${r.completed||0} completed • ${r.failed||0} failed • ${r.abandoned||0} abandoned${r.lastOutcome?` • last: ${esc(r.lastOutcome)}`:''}</small></div>`}
function contractSettlementMemoryBonus(origin){const r=contractMemoryEntity(`settlement:${origin}`,worldLocation(origin)?.name||origin),score=contractMemoryScore(r);return score>=8?20:score>=4?12:score>=2?6:0}
function contractIssuerMemoryBonus(q){const r=contractPrimaryMemory(q),score=contractMemoryScore(r);return score>=8?15:score>=4?10:score>=2?5:0}
function contractTermRelationship(q){const r=contractPrimaryMemory(q),score=contractMemoryScore(r);return {row:r,score,tier:contractMemoryTier(r)}}
function contractBaseDeadlineDays(q){const tpl=contractTemplate(q.type),base=tpl?.days||7;if(q.type==='escort')return Math.max(base,(q.escortTotalDays||tradeRouteDistanceDays(q.origin,q.target)||1)+4);if(q.crossRegion)return Math.max(base,tradeRouteDistanceDays(q.origin,q.target)+4);return base}
function initializeContractTerms(q){
 if(!q||q.contractTermsInitialized)return q;q.contractTermsInitialized=true;const rel=contractTermRelationship(q),danger=['hunt','recovery'].includes(q.type)||q.escortRisk>=.12||q.crossRegion;
 q.termRiskPremium=danger?Math.max(8,Math.round((q.reward||50)*(q.crossRegion?.10:.06))):0;if(q.termRiskPremium){q.reward=(q.reward||0)+q.termRiskPremium;q.termRiskPremiumApplied=true}
 q.termDeadlineAdjustment=rnd(-1,1)+(rel.score>=8?2:rel.score>=4?1:0);q.termDeadlineAdjustment=clamp(q.termDeadlineAdjustment,-1,4);
 q.termCompletionBonus=rel.score>=8?rnd(15,25):rel.score>=4?rnd(8,16):danger&&chance(.35)?rnd(5,12):0;
 q.termAdvancePct=rel.score>=8?.20:rel.score>=4?.10:0;q.negotiationAttempts=0;q.maxNegotiationAttempts=rel.score>=8?2:1;q.negotiationHistory=[];return q
}
function contractDeadlineDays(q){initializeContractTerms(q);return Math.max(3,contractBaseDeadlineDays(q)+(q.termDeadlineAdjustment||0))}
function contractAdvanceAmount(q){initializeContractTerms(q);return Math.max(0,Math.floor((q.reward||0)*(q.termAdvancePct||0)))}
function contractTermsHTML(q,compact=false){
 initializeContractTerms(q);const rel=contractTermRelationship(q),days=contractDeadlineDays(q),advance=contractAdvanceAmount(q),bits=[];
 bits.push(`<b>${q.reward}g</b> base compensation`);bits.push(`${days} day${days===1?'':'s'} after acceptance`);if(q.termRiskPremium)bits.push(`${q.termRiskPremium}g risk premium included`);if(q.termCompletionBonus)bits.push(`${q.termCompletionBonus}g on-time completion bonus`);if(advance)bits.push(`${advance}g advance on acceptance`);
 const hist=(q.negotiationHistory||[]).slice(-2).map(x=>esc(x)).join(' • ');return `<div class="notice compact contract-terms"><b>Contract terms${compact?'':' — '+esc(rel.tier)+' client relationship'}</b><br>${bits.join(' • ')}${hist?`<br><small>${hist}</small>`:''}</div>`
}
function contractNegotiable(q){return !!q&&q.status==='offered'&&!q.storyArcId&&!q.politicalCampaign&&!q.spotContract}
function contractNegotiationChance(q,kind){initializeContractTerms(q);const rel=contractTermRelationship(q),cha=stat(state,'cha')||0,rep=Math.min(20,Math.floor((state.reputation||0)/12)),base=48+Math.min(18,cha)+rep+rel.score*3-(q.worldLinked?2:0);return clamp(base+(kind==='advance'?-8:kind==='time'?4:0),25,92)}
function showContractNegotiation(id,loc){
 const q=(state.world.contracts[loc]||[]).find(x=>x.id===id);if(!q)return showContractBoard(loc);initializeContractTerms(q);if(!contractNegotiable(q))return acceptQuest(id,loc,true);const left=Math.max(0,(q.maxNegotiationAttempts||1)-(q.negotiationAttempts||0)),rel=contractTermRelationship(q),advance=contractAdvanceAmount(q);
 overlay(`<h2>Contract Terms — ${esc(q.name)}</h2>${contractTermsHTML(q)}<p>${esc(contractIssuerName(q))} has offered these terms. Negotiation reflects Charisma, reputation, and your working history with this issuer.</p><div class="notice compact"><b>Negotiation standing:</b> ${esc(rel.tier)} • ${left} attempt${left===1?'':'s'} remaining</div><div class="choice-list"><button data-contractnegotiate="pay" ${left?'':'disabled'}><b>Request Higher Pay</b><small>Ask the issuer to improve the base compensation.</small></button><button data-contractnegotiate="time" ${left?'':'disabled'}><b>Ask for More Time</b><small>Request additional time before the deadline.</small></button><button data-contractnegotiate="advance" ${left&&advance===0?'':'disabled'}><b>Request an Advance</b><small>Ask for part of the agreed reward when the contract is accepted.</small></button><button id="acceptCurrentTerms"><b>Accept Current Terms</b><small>Take the contract as currently written.</small></button></div><div class="dialog-footer"><button id="contractNegotiationBack">Back</button></div>`,true);
 document.querySelectorAll('[data-contractnegotiate]').forEach(b=>b.onclick=()=>attemptContractNegotiation(q.id,loc,b.dataset.contractnegotiate));$('#acceptCurrentTerms').onclick=()=>acceptQuest(q.id,loc,true);$('#contractNegotiationBack').onclick=()=>showContractBoard(loc)
}
function attemptContractNegotiation(id,loc,kind){
 const q=(state.world.contracts[loc]||[]).find(x=>x.id===id);if(!q)return showContractBoard(loc);initializeContractTerms(q);if((q.negotiationAttempts||0)>=(q.maxNegotiationAttempts||1))return showContractNegotiation(id,loc);q.negotiationAttempts=(q.negotiationAttempts||0)+1;const chancePct=contractNegotiationChance(q,kind),ok=rnd(1,100)<=chancePct;let msg='';
 if(ok&&kind==='pay'){const add=Math.max(12,Math.round(q.reward*rnd(10,18)/100));q.reward+=add;msg=`Higher pay agreed: +${add}g.`}
 else if(ok&&kind==='time'){const add=q.crossRegion?3:2;q.termDeadlineAdjustment=(q.termDeadlineAdjustment||0)+add;msg=`Deadline extended by ${add} days.`}
 else if(ok&&kind==='advance'){q.termAdvancePct=contractTermRelationship(q).score>=4?.20:.15;msg=`Advance approved: ${contractAdvanceAmount(q)}g will be paid on acceptance.`}
 else msg=kind==='pay'?'The issuer declines to increase the pay.':kind==='time'?'The issuer keeps the original deadline.':'The issuer declines to pay an advance.';
 q.negotiationHistory=q.negotiationHistory||[];q.negotiationHistory.push(msg);save();showContractNegotiation(id,loc)
}
function recordContractAcceptance(q){if(!q||q.memoryAcceptedRecorded)return;q.memoryAcceptedRecorded=true;for(const [k,l] of contractMemoryKeys(q)){const r=contractMemoryEntity(k,l);r.accepted=(r.accepted||0)+1;r.lastDay=state.world.day}}
function recordContractOutcome(q,outcome,reason=''){
 if(!q||q.memoryOutcomeRecorded)return;q.memoryOutcomeRecorded=true;const onTime=q.dueDay==null||state.world.day<=q.dueDay,early=q.status==='complete'&&q.readyDay!=null&&q.dueDay!=null&&q.dueDay-q.readyDay>=2,lastMinute=q.status==='complete'&&q.readyDay!=null&&q.dueDay!=null&&q.dueDay-q.readyDay<=1;const label=outcome==='complete'?(early?'completed early':lastMinute?'completed near the deadline':'completed successfully'):outcome==='abandoned'?'abandoned by the Guardian':reason&&/late|deadline|day \d+/i.test(reason)?'failed after the deadline':'failed';q.contractOutcome=label;q.contractOutcomeDay=state.world.day;
 const M=ensureContractMemory();for(const [k,l] of contractMemoryKeys(q)){const r=contractMemoryEntity(k,l);if(outcome==='complete'){r.completed=(r.completed||0)+1;if(early)r.early=(r.early||0)+1;if(lastMinute)r.lastMinute=(r.lastMinute||0)+1}else if(outcome==='abandoned')r.abandoned=(r.abandoned||0)+1;else{r.failed=(r.failed||0)+1;if(!onTime||/late|deadline/i.test(reason||''))r.late=(r.late||0)+1}r.score=contractMemoryScore(r);r.lastOutcome=label;r.lastDay=state.world.day}M.history.push({day:state.world.day,contractId:q.id,name:q.name,outcome:label,reason:reason||''});M.history=M.history.slice(-120);
 if(q.issuerNpcId){try{npcMemoryAdd(q.issuerNpcId,`${q.name}: ${label}`,outcome==='complete'?1:outcome==='abandoned'?-2:-1)}catch(e){}}if(q.referralTravelerId){const tr=travelerRegistryState().records[q.referralTravelerId];if(tr){tr.contractMemory=tr.contractMemory||{completed:0,failed:0,abandoned:0};tr.contractMemory[outcome==='complete'?'completed':outcome==='abandoned'?'abandoned':'failed']++;tr.contractMemory.lastOutcome=label;tr.contractMemory.lastDay=state.world.day}}if(q.worldPartyId){const wp=state.world.parties.find(p=>p.id===q.worldPartyId);if(wp){wp.guardianContractMemory=wp.guardianContractMemory||{completed:0,failed:0,abandoned:0};wp.guardianContractMemory[outcome==='complete'?'completed':outcome==='abandoned'?'abandoned':'failed']++;wp.guardianContractMemory.lastOutcome=label;wp.guardianContractMemory.lastDay=state.world.day}}
}
function contractPaymentAgentLabel(q,location,mode){
 const faction=q?.spotIssuerFaction||q?.faction||worldLocation(location)?.faction||SOSText("contracts_contracts_journal.contractPaymentAgentLabel.001");
 if(mode==='recipient')return q.type==='diplomacy'?'the recipient':q.sensitiveCargo?'the designated recipient':SOSText("contracts_contracts_journal.contractPaymentAgentLabel.002");
 if(faction===SOSText("contracts_contracts_journal.contractPaymentAgentLabel.003"))return SOSText("contracts_contracts_journal.contractPaymentAgentLabel.004");
 if(faction===SOSText("contracts_contracts_journal.contractPaymentAgentLabel.005"))return SOSText("contracts_contracts_journal.contractPaymentAgentLabel.006");
 if(faction===SOSText("contracts_contracts_journal.contractPaymentAgentLabel.007"))return SOSText("contracts_contracts_journal.contractPaymentAgentLabel.008");
 if(faction===SOSText("contracts_contracts_journal.contractPaymentAgentLabel.009"))return SOSText("contracts_contracts_journal.contractPaymentAgentLabel.010");
 if(faction===SOSText("contracts_contracts_journal.contractPaymentAgentLabel.011"))return SOSText("contracts_contracts_journal.contractPaymentAgentLabel.012");
 return mode==='origin_agent'?'an authorized contract agent':SOSText("contracts_contracts_journal.contractPaymentAgentLabel.013")
}
function assignContractPaymentTerms(q,{spot=false,force=false}={}){
 if(!q||q.type==='escort'||q.storyArcId)return q;if(q.paymentMode&&!force)return q;if(!['delivery','diplomacy','visit','procure','hunt','recovery','spotservice'].includes(q.type))return q;
 let mode='origin_agent';if(q.type==='delivery'){const roll=Math.random();mode=spot?(roll<.55?'recipient':roll<.90?'destination_agent':'origin_agent'):(roll<.48?'recipient':roll<.76?'destination_agent':'origin_agent')}else if(q.type==='diplomacy')mode=chance(.55)?'destination_agent':'origin_agent';
 const preferred=(mode==='recipient'||mode==='destination_agent')?q.target:q.origin,location=validWorldLocationId(preferred)?preferred:(validWorldLocationId(q.origin)?q.origin:validWorldLocationId(q.target)?q.target:state.world?.location||'shantium');q.paymentMode=mode;q.paymentLocation=location;q.paymentPayer=contractPaymentAgentLabel(q,location,mode);
 const locName=worldLocation(location)?.name||SOSText("contracts_contracts_journal.assignContractPaymentTerms.001");
 q.paymentExplanation=mode==='recipient'?SOSText("contracts_contracts_journal.assignContractPaymentTerms.002",sentenceStart(q.paymentPayer),locName):mode==='destination_agent'?SOSText("contracts_contracts_journal.assignContractPaymentTerms.003",sentenceStart(q.paymentPayer),locName):SOSText("contracts_contracts_journal.assignContractPaymentTerms.004",sentenceStart(q.paymentPayer),locName);return q
}
function ensureContractPaymentTerms(q){if(!q)return q;if(q.type==='escort'){q.paymentMode='escort_party';q.paymentLocation=q.target;q.paymentPayer=q.escortPartyName||SOSText("contracts_contracts_journal.ensureContractPaymentTerms.001");q.paymentExplanation=SOSText("contracts_contracts_journal.ensureContractPaymentTerms.002",sentenceStart(q.paymentPayer),contractTargetName(q));return q}return assignContractPaymentTerms(q,{spot:!!q.spotContract})}
function contractPaymentLocation(q){
 ensureContractPaymentTerms(q);
 const candidates=[q?.paymentLocation,q?.type==='escort'?q?.target:null,q?.origin,q?.target,state.world?.location,'shantium'];
 return candidates.find(id=>id&&validWorldLocationId(id))||'shantium'
}
function contractPaymentSummary(q){
 ensureContractPaymentTerms(q);const loc=worldLocation(contractPaymentLocation(q));
 return q.paymentExplanation||SOSText("contracts_contracts_journal.contractPaymentSummary.001",loc?.name||'the designated settlement')
}
function contractPaymentShort(q){ensureContractPaymentTerms(q);const loc=worldLocation(contractPaymentLocation(q));return `${q.paymentPayer||'Authorized payer'} • ${loc?.name||'designated settlement'}`}
function rawContractParty(q){return q?.partyId?state.world.parties.find(p=>p.id===q.partyId):null}
function createContractTargetParty(q,repair=false){
 if(!q||!['hunt','recovery'].includes(q.type)||!['active','ready'].includes(q.status))return rawContractParty(q);
 let p=rawContractParty(q);if(p){p.contractProtected=true;p.questId=q.id;p.contractRole='target';return p}
 const kind=q.targetKind||q.contractTargetKind||(q.type==='recovery'?'bandits':'raiders'),region=locationRegion(q.contractSpawnLocation||q.origin),spawn=q.contractSpawnLocation||q.origin;
 p=spawnWorldParty(kind,region);p.location=spawn;p.origin=spawn;p.destination=q.contractSpawnDestination||purposefulDestination(kind,spawn);p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays(p.location,p.destination));p.questId=q.id;p.contractProtected=true;p.contractRole='target';p.createdDay=state.world.day;p.contractExpiresDay=q.dueDay||null;
 if(q.targetPartyName)p.name=q.targetPartyName;else q.targetPartyName=p.name;
 q.partyId=p.id;q.target=p.destination;
 if(q.type==='hunt')q.desc=SOSText("contracts_contracts_journal.createContractTargetParty.001",p.name);
 if(q.type==='recovery')q.desc=SOSText("contracts_contracts_journal.createContractTargetParty.002",p.name,q.qty,q.qty===1?'':'s',TRADE_GOODS.find(g=>g.id===q.goodId)?.name||'stolen cargo');
 if(repair){log(SOSText("contracts_contracts_journal.createContractTargetParty.003",p.name),'info');recordWorldHistory(SOSText("contracts_contracts_journal.createContractTargetParty.004",q.name),'info',SOSText("contracts_contracts_journal.createContractTargetParty.005"))}
 return p
}
function contractParty(q){
 let p=rawContractParty(q);
 if(!p&&q&&['active','ready'].includes(q.status)&&['hunt','recovery'].includes(q.type)&&(!q.dueDay||state.world.day<=q.dueDay))p=createContractTargetParty(q,true);
 return p
}
function repairActiveContractParties(){
 if(!isOpenWorld())return;ensureWorldState();
 for(const q of state.world.quests.filter(x=>['active','ready'].includes(x.status))){
   if(['hunt','recovery'].includes(q.type))createContractTargetParty(q,!rawContractParty(q));
   if(q.type==='escort'&&q.status==='active'&&q.escortStage!=='arrived'&&!rawContractParty(q))createEscortCaravan(q,true);
   const p=rawContractParty(q);if(p){p.contractProtected=true;p.questId=q.id}
 }
}
function contractChainKey(q){return q.chainKey||`${q.origin}:${q.type}`}
function contractChainLevel(q){return state.world.contractChains[contractChainKey(q)]||0}
function contractVariantLabel(q){return q.variantName||contractTemplate(q.type)?.name||q.name}
function activeEscortQuest(){ensureWorldState();const q=state.world.quests.find(x=>x.id===state.world.activeEscortQuestId&&x.type==='escort'&&x.status==='active'&&x.escortStage==='escorting');if(!q&&state.world.activeEscortQuestId)state.world.activeEscortQuestId=null;return q||null}
function escortCaravan(q){return q?.partyId?state.world.parties.find(p=>p.id===q.partyId):null}
function createEscortCaravan(q,repair=false){
 let p=escortCaravan(q);if(p){p.contractProtected=true;p.questId=q.id;p.contractRole='escort';return p;}
 const total=Math.max(1,q.escortTotalDays||tradeRouteDistanceDays(q.origin,q.target)),kind=q.escortKind||'merchant',base=worldPartyType(kind)||worldPartyType('merchant');
 const defaultName=kind==='refugees'?'Refugee Column':q.escortVariant==='diplomatic'?'Diplomatic Delegation':q.escortVariant==='supply'?'Supply Wagon':q.escortVariant==='valuable'?'High-Value Caravan':SOSText("contracts_contracts_journal.createEscortCaravan.001");
 p={id:uid(),kind,name:q.escortPartyName||`${worldLocation(q.origin).name} ${defaultName}`,faction:q.faction||base?.faction||SOSText("contracts_contracts_journal.createEscortCaravan.002"),attitude:'friendly',purpose:SOSText("contracts_contracts_journal.createEscortCaravan.003",worldLocation(q.target).name),origin:q.origin,location:q.origin,destination:q.target,travelLeft:total,travelTotal:total,createdDay:state.world.day,questId:q.id,cargo:q.escortCargo||rnd(2,5),manifest:q.escortCargoManifest?{...q.escortCargoManifest}:undefined,crossRegion:!!q.crossRegion,tradeRoute:q.crossRegion?connectionRouteName(q.origin,q.target):undefined,contractProtected:true,contractRole:'escort',escortWaiting:true,escortActive:false};
 state.world.parties.push(p);q.partyId=p.id;q.escortTotalDays=total;q.escortRemainingDays=total;q.escortDaysTraveled=q.escortDaysTraveled||0;q.attacksDefended=q.attacksDefended||0;q.escortStage='rendezvous';
 if(repair)log(SOSText("contracts_contracts_journal.createEscortCaravan.004",p.name,worldLocation(q.origin).name),'info');
 return p
}
function repairEscortContracts(){
 if(!isOpenWorld())return;
 for(const q of state.world.quests.filter(x=>x.type==='escort'&&x.status==='active')){
   let p=escortCaravan(q);if(!q.escortStage||!['rendezvous','escorting'].includes(q.escortStage)){q.escortStage='rendezvous';q.escortTotalDays=Math.max(1,tradeRouteDistanceDays(q.origin,q.target));q.escortRemainingDays=q.escortTotalDays}
   if(!p)p=createEscortCaravan(q,true);
   p.questId=q.id;p.contractProtected=true;p.destination=q.target;p.travelTotal=Math.max(1,q.escortTotalDays||tradeRouteDistanceDays(q.origin,q.target));
   if(q.escortStage==='rendezvous'){p.location=q.origin;p.travelLeft=p.travelTotal;p.escortWaiting=true;p.escortActive=false}else{p.escortWaiting=false;p.escortActive=true;p.travelLeft=Math.max(0,q.escortRemainingDays??p.travelLeft);if(!state.world.activeEscortQuestId||state.world.activeEscortQuestId===q.id)state.world.activeEscortQuestId=q.id}
 }
}
function releaseEscortCaravan(q,atDestination=false){
 const p=escortCaravan(q);if(!p)return;p.contractProtected=false;p.escortWaiting=false;p.escortActive=false;p.questId=null;p.contractRole=null;p.contractExpiresDay=null;if(q.spotContract&&atDestination)p.spotContractCompleted=true;
 if(atDestination){p.location=q.target;p.origin=q.target;p.destination=purposefulDestination(p.kind==='refugees'?'refugees':'merchant',q.target);p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays(p.location,p.destination))}
 else if(p.travelLeft<=0){p.location=p.destination;p.destination=purposefulDestination(p.kind,p.location);p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays(p.location,p.destination))}
}
function escortVariant(origin,target,chain=0){
 const choices=[
  {escortVariant:'merchant',escortKind:'merchant',variantName:SOSText("contracts_contracts_journal.escortVariant.001"),party:SOSText("contracts_contracts_journal.escortVariant.002"),reward:0,risk:0},
  {escortVariant:'supply',escortKind:'merchant',variantName:SOSText("contracts_contracts_journal.escortVariant.003"),party:SOSText("contracts_contracts_journal.escortVariant.004"),reward:20,risk:.03,cargo:5},
  {escortVariant:'refugee',escortKind:'refugees',variantName:SOSText("contracts_contracts_journal.escortVariant.005"),party:SOSText("contracts_contracts_journal.escortVariant.006"),reward:-5,risk:-.05},
  {escortVariant:'diplomatic',escortKind:'merchant',variantName:SOSText("contracts_contracts_journal.escortVariant.007"),party:SOSText("contracts_contracts_journal.escortVariant.008"),reward:30,risk:.05}
 ];
 if(chain>=2)choices.push({escortVariant:'valuable',escortKind:'merchant',variantName:SOSText("contracts_contracts_journal.escortVariant.009"),party:SOSText("contracts_contracts_journal.escortVariant.010"),reward:65,risk:.12,cargo:7});
 return pick(choices)
}

function strongestTroubledRoute(locId){
 const rows=regionalSettlements(locationRegion(locId)).filter(x=>x.id!==locId).map(x=>({id:x.id,pressure:routePressure(locId,x.id),days:worldTravelDays(locId,x.id)})).sort((a,b)=>b.pressure-a.pressure||a.days-b.days);
 return rows[0]||null
}
function regionalContractSource(locId){
 const p=settlementProblem(locId);
 if(p){const m=syncSettlementProblemMatter(locId,p);return{kind:'problem',id:p.id,matterId:m?.id||null,type:p.type,title:p.title,locId,text:SOSText("contracts_contracts_journal.regionalContractSource.001",worldLocation(locId).name,p.title.toLowerCase())}};
 const threads=regionalThreadAt(locId);
 if(threads.length){const t=threads[0];return{kind:'thread',id:t.id,type:t.kind,title:t.title,locId,text:t.notes[t.notes.length-1]||t.text}}
 const route=strongestTroubledRoute(locId);
 if(route&&route.pressure>=3)return{kind:'route',id:routeEvidenceKey(locId,route.id),type:'route',title:SOSText("contracts_contracts_journal.regionalContractSource.002"),locId,other:route.id,pressure:route.pressure,text:SOSText("contracts_contracts_journal.regionalContractSource.003",worldLocation(locId).name,worldLocation(route.id).name,route.pressure)};
 return null
}
function regionalContractValid(q){
 if(!q?.regionalSource)return true;
 const s=q.regionalSource;
 if(s.kind==='problem'){const p=settlementProblem(s.locId);return !!p&&p.id===s.id}
 if(s.kind==='thread')return activeRegionalThreads().some(t=>t.id===s.id);
 if(s.kind==='route')return routePressure(s.locId,s.other)>=2;
 if(s.kind==='faction')return factionPostAvailable(s.locId,s.faction);
 return true
}
function regionalContractReason(q){return q.regionalReason||q.regionalSource?.text||''}
function regionalContractImpactText(q){
 const e=q.regionalEffect||{},bits=[];
 if(e.problemProgress)bits.push(SOSText("contracts_contracts_journal.regionalContractImpactText.001",e.problemProgress));
 if(e.security)bits.push(SOSText("contracts_contracts_journal.regionalContractImpactText.002",e.security>0?'+':'',e.security));
 if(e.prosperity)bits.push(SOSText("contracts_contracts_journal.regionalContractImpactText.003",e.prosperity>0?'+':'',e.prosperity));
 if(e.routeRelief)bits.push(SOSText("contracts_contracts_journal.regionalContractImpactText.004",e.routeRelief));
 if(e.factionPressure)bits.push(`${q.faction} influence ${e.factionPressure>0?'+':''}${e.factionPressure}`);
 return bits.join(' • ')
}
function configureRegionalContract(q,source,opts={}){
 q.regional=true;q.regionalSource=source;q.regionalReason=opts.reason||source?.text||SOSText("contracts_contracts_journal.configureRegionalContract.001");q.regionalEffect=opts.effect||{};q.regionalLabel=opts.label||SOSText("contracts_contracts_journal.configureRegionalContract.002");q.chainKey=opts.chainKey||`regional:${q.origin}:${source?.kind||'world'}:${source?.type||q.type}`;const matter=source?.kind==='problem'?worldMatterForSettlementProblem(source.locId,state.world.settlementProblems?.[source.locId]):source?.kind==='thread'?worldMatterForRegionalThread(ensureRegionalSimulation().threads.find(t=>t.id===source.id)):null;if(matter){q.matterId=matter.id;q.workOfferId=createWorldWorkOffer(matter.id,'contract',q.id,{title:q.name,location:source.locId||q.origin,links:{contractId:q.id},meta:{contractType:q.type}})?.id}
 if(opts.name){q.variantName=opts.name;q.name=opts.name}
 if(opts.desc)q.desc=opts.desc;
 if(opts.reward)q.reward+=opts.reward;if(q.workOfferId)updateWorldWorkOffer(q.workOfferId,{title:q.name});
 return q
}
function chooseRegionalSupplyGood(problemType){
 if(problemType==='shortage'||problemType==='refugee_load')return chance(.65)?'food':'medicine';
 if(problemType==='trade_slump')return chance(.5)?'tools':'cloth';
 return pick(TRADE_GOODS).id
}
function retargetContractHostile(q,locId,targetId=null){
 q.contractSpawnLocation=locId;q.contractSpawnDestination=targetId||q.contractSpawnDestination||null;
 const p=rawContractParty(q);if(!p)return;
 p.location=locId;p.origin=locId;p.destination=targetId||purposefulDestination(p.kind,locId);p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays(p.location,p.destination))
}

function crossRegionSupplyContract(locId){
 if(!crossRegionTradeUnlocked())return null;const stock=ensureTradeStock(locId),need=TRADE_GOODS.map(g=>({g,qty:stock[g.id]||0,d:tradeDemandScore(locId,g.id)})).sort((a,b)=>(a.qty-b.qty)||(b.d-a.d))[0];
 if(!need||need.qty>3)return null;const pool=allOtherUnlockedSettlements(locId),sources=pool.filter(x=>need.g.sources?.includes(x.id));const source=(sources.length?sources:pool).slice().sort((a,b)=>tradePrice(a.id,need.g.id)-tradePrice(b.id,need.g.id))[0];if(!source)return null;
 const q=generateContract(locId,'escort',{target:source.id,faction:settlementControl(locId),crossRegion:true});q.origin=source.id;q.target=locId;q.crossRegion=true;q.escortTotalDays=tradeRouteDistanceDays(source.id,locId);q.escortRemainingDays=q.escortTotalDays;q.escortCargoManifest={[need.g.id]:rnd(3,6)};q.escortCargo=manifestLots(q.escortCargoManifest);q.name=SOSText("contracts_contracts_journal.crossRegionSupplyContract.001");q.desc=SOSText("contracts_contracts_journal.crossRegionSupplyContract.002",source.name,need.g.name,connectionRouteName(source.id,locId),worldLocation(locId).name);q.reward+=55;return q
}
function generateRegionalContract(locId,source=null,forcedFaction=null){
 source=source||regionalContractSource(locId);
 if(!source&&forcedFaction)source={kind:'faction',id:`${forcedFaction}:${locId}:${state.world.day}`,type:'faction',locId,faction:forcedFaction,title:SOSText("contracts_contracts_journal.generateRegionalContract.001",majorFaction(forcedFaction).short),text:SOSText("contracts_contracts_journal.generateRegionalContract.002",majorFaction(forcedFaction).name)};
 if(!source)return null;
 const faction=forcedFaction||settlementControl(locId)||worldLocation(locId).faction||SOSText("contracts_contracts_journal.generateRegionalContract.003");
 let q=null;
 if((source.kind==='problem'&&['raider_pressure','watch_shortage'].includes(source.type))||(source.kind==='thread'&&source.type==='security')){
   const hostile=state.world.parties.find(p=>['bandits','raiders'].includes(p.kind)&&(p.location===locId||p.destination===locId));
   if(hostile){
     q=generateContract(locId,'hunt',{faction});q.targetKind=hostile.kind;q.contractSpawnLocation=locId;q.contractSpawnDestination=hostile.destination||purposefulDestination(hostile.kind,locId);
     configureRegionalContract(q,source,{name:SOSText("contracts_contracts_journal.generateRegionalContract.004"),desc:SOSText("contracts_contracts_journal.generateRegionalContract.005",worldPartyType(hostile.kind)?.name||'raider force',worldLocation(locId).name),reward:30,effect:{problemProgress:source.kind==='problem'?2:0,security:3,routeRelief:2}})
   }else{
     const route=strongestTroubledRoute(locId),target=route?.id||pick(regionalSettlements(locationRegion(locId)).filter(x=>x.id!==locId)).id;
     q=generateContract(locId,'visit',{target,faction});
     configureRegionalContract(q,source,{name:SOSText("contracts_contracts_journal.generateRegionalContract.006"),desc:SOSText("contracts_contracts_journal.generateRegionalContract.007",worldLocation(locId).name,worldLocation(target).name),reward:25,effect:{problemProgress:source.kind==='problem'?2:0,security:3,routeRelief:2}})
   }
 }
 else if((source.kind==='problem'&&['shortage','trade_slump'].includes(source.type))||(source.kind==='thread'&&source.type==='supply')){
   q=generateContract(locId,'procure',{faction});
   const sourceType=source.kind==='problem'?source.type:'shortage';q.goodId=chooseRegionalSupplyGood(sourceType);q.qty=sourceType==='shortage'?3:2;q.target=locId;
   const g=TRADE_GOODS.find(x=>x.id===q.goodId);
   configureRegionalContract(q,source,{name:sourceType==='shortage'?'Emergency Supply Procurement':SOSText("contracts_contracts_journal.generateRegionalContract.008"),desc:SOSText("contracts_contracts_journal.generateRegionalContract.009",q.qty,g.name,worldLocation(locId).name),reward:25,effect:{problemProgress:source.kind==='problem'?2:0,prosperity:3}})
 }
 else if((source.kind==='problem'&&source.type==='refugee_load')||(source.kind==='thread'&&source.type==='displacement')){
   const target=bestReliefDestination(locId,'refugees');
   q=generateContract(locId,'escort',{target,faction});q.escortVariant='refugee';q.escortKind='refugees';q.escortPartyName=source.kind==='thread'?'Displaced Family Column':SOSText("contracts_contracts_journal.generateRegionalContract.010");q.escortCargo=1;
   configureRegionalContract(q,source,{name:source.kind==='thread'?'Displaced Families Escort':SOSText("contracts_contracts_journal.generateRegionalContract.011"),desc:SOSText("contracts_contracts_journal.generateRegionalContract.012",worldLocation(locId).name,worldLocation(target).name),reward:20,effect:{problemProgress:source.kind==='problem'?2:0,prosperity:1,routeRelief:1}})
 }
 else if(source.kind==='route'){
   const hard=source.pressure>=6;q=generateContract(locId,hard?'hunt':'visit',{target:source.other,faction});
   if(hard)retargetContractHostile(q,locId,source.other);
   configureRegionalContract(q,source,{name:hard?'Dangerous Road Suppression':SOSText("contracts_contracts_journal.generateRegionalContract.013"),desc:hard?SOSText("contracts_contracts_journal.generateRegionalContract.014",worldLocation(source.other).name):SOSText("contracts_contracts_journal.generateRegionalContract.015",worldLocation(source.other).name),reward:hard?35:20,effect:{security:2,routeRelief:3}})
 }
 else if(source.kind==='faction'){
   const f=forcedFaction||source.faction,route=strongestTroubledRoute(locId),agenda=majorFaction(f).agenda||SOSText("contracts_contracts_journal.generateRegionalContract.016");
   const type=(f===SOSText("contracts_contracts_journal.generateRegionalContract.017")||f===SOSText("contracts_contracts_journal.generateRegionalContract.018"))?(route?.pressure>=4?'visit':'diplomacy'):f===SOSText("contracts_contracts_journal.generateRegionalContract.019")?'escort':f===SOSText("contracts_contracts_journal.generateRegionalContract.020")?'diplomacy':chance(.5)?'delivery':'visit';
   q=generateContract(locId,type,{target:route?.id||undefined,faction:f});
   configureRegionalContract(q,source,{name:SOSText("contracts_contracts_journal.generateRegionalContract.021",majorFaction(f).short),desc:SOSText("contracts_contracts_journal.generateRegionalContract.022",majorFaction(f).name,agenda),reward:25,effect:{security:[SOSText("contracts_contracts_journal.generateRegionalContract.023"),SOSText("contracts_contracts_journal.generateRegionalContract.024")].includes(f)?2:0,prosperity:[SOSText("contracts_contracts_journal.generateRegionalContract.025"),SOSText("contracts_contracts_journal.generateRegionalContract.026")].includes(f)?1:0,factionPressure:1,routeRelief:route?.pressure>=3?1:0}});
   state.world.regionalContractStats.faction++
 }
 else{
   q=generateContract(locId,'visit',{target:source.locId||undefined,faction});
   configureRegionalContract(q,source,{name:SOSText("contracts_contracts_journal.generateRegionalContract.027"),reward:20,effect:{security:1}})
 }
 if(q){q.regionalGeneratedDay=state.world.day;state.world.regionalContractStats.generated++}
 return q
}
function applyRegionalContractConsequences(q){
 if(!q?.regional||q.regionalConsequencesApplied)return'';
 q.regionalConsequencesApplied=true;
 const e=q.regionalEffect||{},locId=q.regionalSource?.locId||q.origin,ss=state.world.settlements[locId]?settlementState(locId):null,notes=[];
 if(e.problemProgress&&settlementProblem(locId)){progressSettlementProblem(locId,e.problemProgress,SOSText("contracts_contracts_journal.applyRegionalContractConsequences.001",q.name));state.world.regionalContractStats.problemsHelped++;notes.push(SOSText("contracts_contracts_journal.applyRegionalContractConsequences.002",e.problemProgress))}
 if(ss&&e.security){ss.security=clamp(ss.security+e.security,0,100);notes.push(SOSText("contracts_contracts_journal.applyRegionalContractConsequences.003",e.security>0?'+':'',e.security))}
 if(ss&&e.prosperity){ss.prosperity=clamp(ss.prosperity+e.prosperity,0,100);notes.push(SOSText("contracts_contracts_journal.applyRegionalContractConsequences.004",e.prosperity>0?'+':'',e.prosperity))}
 if(e.routeRelief){
   const other=q.regionalSource?.other||q.target;
   if(other&&other!==locId){reduceRoutePressure(locId,other,e.routeRelief);state.world.regionalContractStats.routesImproved++;notes.push(SOSText("contracts_contracts_journal.applyRegionalContractConsequences.005",e.routeRelief))}
 }
 if(q.faction&&OPEN_WORLD_FACTIONS[q.faction])recordFactionPower(locId,q.faction,'contracts',q.regional?1.5:.75,SOSText("contracts_contracts_journal.applyRegionalContractConsequences.006",q.name,majorFaction(q.faction).short),7);if(e.factionPressure&&OPEN_WORLD_FACTIONS[q.faction]){addPoliticalPressure(locId,q.faction,e.factionPressure,SOSText("contracts_contracts_journal.applyRegionalContractConsequences.007",q.name));notes.push(SOSText("contracts_contracts_journal.applyRegionalContractConsequences.008",majorFaction(q.faction).short,e.factionPressure))}
 state.world.regionalContractStats.completed++;if(q.workOfferId)updateWorldWorkOffer(q.workOfferId,{status:'completed'});if(q.matterId&&settlementProblem(locId))syncSettlementProblemMatter(locId);
 if(notes.length)addSettlementEvidence(locId,SOSText("contracts_contracts_journal.applyRegionalContractConsequences.009",q.name,notes.join(', ')),'good',5);
 recordWorldHistory(SOSText("contracts_contracts_journal.applyRegionalContractConsequences.010",q.name,worldLocation(locId)?.name||locId,notes.length?` ${notes.join(' • ')}.`:''),'good',SOSText("contracts_contracts_journal.applyRegionalContractConsequences.011"));
 return notes.join(' • ')
}
function ensureRegionalContractOffer(locId){
 const arr=state.world.contracts[locId]||[];
 if(arr.some(q=>q.regional&&regionalContractValid(q)))return;
 const source=regionalContractSource(locId);if(!source)return;
 const q=generateRegionalContract(locId,source);if(q){arr.unshift(q);state.world.contracts[locId]=arr.slice(0,3)}
}
function generateFactionRegionalContract(locId,faction){
 const source={kind:'faction',id:`${faction}:${locId}:${state.world.day}`,type:'faction',locId,faction,title:SOSText("contracts_contracts_journal.generateFactionRegionalContract.001",majorFaction(faction).short),text:SOSText("contracts_contracts_journal.generateFactionRegionalContract.002",majorFaction(faction).name,worldLocation(locId).name)};
 const q=generateRegionalContract(locId,source,faction);if(!q)return null;
 state.world.contracts[locId]=state.world.contracts[locId]||[];state.world.contracts[locId].unshift(q);state.world.contracts[locId]=state.world.contracts[locId].slice(0,4);return q
}
function contractWorldLinkedValid(q){
 if(!q?.worldLinked)return true;
 if(q.worldPartyId){const p=state.world.parties.find(x=>x.id===q.worldPartyId);if(!p)return false;if(q.status==='offered'&&q.origin&&p.location!==q.origin)return false}
 if(q.worldProblemId){const p=settlementProblem(q.origin);if(!p||p.id!==q.worldProblemId)return false}
 return true
}
function contractIssuerFromSettlement(locId){
 try{const rows=settlementNpcsPresent(locId).map(n=>({n,r:npcRelationshipState(n.id)})).filter(x=>(x.r?.familiarity||0)>=2).sort((a,b)=>(b.r?.familiarity||0)-(a.r?.familiarity||0));return rows[0]?.n||null}catch(e){return null}
}
function worldContractCandidateParties(locId){
 const region=locationRegion(locId);return (state.world.parties||[]).filter(p=>p&&p.location===locId&&locationRegion(p.location)===region&&!p.questId&&!p.contractProtected&&!p.defeated&&!p.archived)
}
function generateWorldLinkedContract(locId){
 const parties=worldContractCandidateParties(locId),hostiles=parties.filter(p=>['bandits','raiders'].includes(p.kind)||p.attitude==='hostile'),travelers=parties.filter(p=>['merchant','refugees'].includes(p.kind)&&p.destination&&p.destination!==locId&&p.attitude!=='hostile');
 let q=null,source='';
 if(hostiles.length){
   const p=pick(hostiles);q=generateContract(locId,'hunt',{faction:settlementControl(locId)});q.partyId=p.id;q.worldPartyId=p.id;q.targetKind=p.kind;q.target=p.destination||p.location;q.targetPartyName=p.name;q.name=`Contract: ${p.name}`;q.desc=`A real hostile Party currently operating from ${worldLocation(locId).name} has become the subject of a local contract. Track and defeat ${p.name}.`;source=`${p.name} is an active ${worldPartyType(p.kind)?.name||p.kind} currently operating at ${worldLocation(locId).name}.`;
 }else if(travelers.length){
   const p=pick(travelers);q=generateContract(locId,'escort',{target:p.destination,faction:p.faction||settlementControl(locId)});q.partyId=p.id;q.worldPartyId=p.id;q.escortPartyName=p.name;q.escortKind=p.kind;q.escortVariant=p.kind==='refugees'?'refugee':'merchant';q.escortTotalDays=Math.max(1,worldTravelDays(p.location,p.destination));q.escortRemainingDays=q.escortTotalDays;q.name=`Escort ${p.name}`;q.desc=`${p.name} is actually present in ${worldLocation(locId).name} and preparing to travel to ${worldLocation(p.destination).name}. They are hiring the Guardian to accompany them.`;source=`${p.name} is an active world Party currently present in ${worldLocation(locId).name}, bound for ${worldLocation(p.destination).name}.`;
 }else{
   const ss=settlementState(locId),problem=settlementProblem(locId),stock=ensureTradeStock(locId),scarce=TRADE_GOODS.map(g=>({g,qty:stock[g.id]||0,d:tradeDemandScore(locId,g.id)})).sort((a,b)=>(a.qty-b.qty)||(b.d-a.d))[0];
   if(problem&&['shortage','trade_slump','refugee_load'].includes(problem.type)){
     q=generateContract(locId,'procure',{faction:settlementControl(locId)});q.worldProblemId=problem.id;q.goodId=chooseRegionalSupplyGood(problem.type);q.qty=problem.type==='shortage'?4:3;q.target=locId;const g=TRADE_GOODS.find(x=>x.id===q.goodId);q.name=`Local Need: ${g?.name||'Supplies'}`;q.desc=`${worldLocation(locId).name} is dealing with ${problem.title.toLowerCase()}. Acquire ${q.qty} lots of ${g?.name||'needed goods'} and return them here.`;source=`${worldLocation(locId).name}'s active problem, ${problem.title}, created this request.`;
   }else if(scarce&&scarce.qty<=2&&ss.prosperity<80){
     q=generateContract(locId,'procure',{faction:settlementControl(locId)});q.goodId=scarce.g.id;q.qty=3;q.target=locId;q.name=`Market Restock: ${scarce.g.name}`;q.desc=`Local stocks of ${scarce.g.name} are unusually thin. Acquire ${q.qty} lots and return them to ${worldLocation(locId).name}.`;source=`The actual ${worldLocation(locId).name} market has only ${scarce.qty} lot${scarce.qty===1?'':'s'} of ${scarce.g.name} in stock.`;
   }else if(ss.security<45){
     const route=strongestTroubledRoute(locId),target=route?.id||pick(regionalSettlements(locationRegion(locId)).filter(x=>x.id!==locId))?.id;if(target){q=generateContract(locId,'visit',{target,faction:settlementControl(locId)});q.name='Local Security Survey';q.desc=`Local security is ${Math.round(ss.security)}/100. Travel toward ${worldLocation(target).name} and survey the route for current problems.`;source=`${worldLocation(locId).name}'s current security is only ${Math.round(ss.security)}/100.`}
   }
 }
 if(!q)return null;
 q.worldLinked=true;q.worldSourceText=source;q.worldGeneratedDay=state.world.day;q.chainKey=`world:${locId}:${q.worldPartyId||q.worldProblemId||q.type}`;
 const issuer=contractIssuerFromSettlement(locId);if(issuer){q.issuerNpcId=issuer.id;q.issuerName=issuer.name;q.worldSourceText+=` ${issuer.name} is the local contact handling the offer.`}
 q.reward+=20+contractIssuerMemoryBonus(q);assignContractPaymentTerms(q,{spot:false,force:true});return q
}
function ensureWorldLinkedContractOffers(locId){
 const arr=state.world.contracts[locId]||[];if(arr.some(q=>q.worldLinked&&contractWorldLinkedValid(q)))return;
 const q=generateWorldLinkedContract(locId);if(q){arr.unshift(q);state.world.contracts[locId]=arr.slice(0,4)}
}
function generateContract(origin,forcedType=null,opts={}){
 const tpl=forcedType?contractTemplate(forcedType):pick(QUEST_TEMPLATES),sameTargets=WORLD_LOCATIONS.filter(x=>x.id!==origin&&x.id!=='redoubt'&&locationRegion(x)===locationRegion(origin)),crossEligible=crossRegionTradeUnlocked()&&['escort','delivery','visit','diplomacy'].includes(tpl.type),crossTargets=crossEligible?allOtherUnlockedSettlements(origin):[],crossChance=(state.world.unlockedRegions||[]).length>=3?.30:.18,targets=(opts.crossRegion||(!forcedType&&crossEligible&&chance(crossChance)))&&crossTargets.length?crossTargets:sameTargets,target=opts.target?worldLocation(opts.target):pick(targets),id=uid(),chainKey=opts.chainKey||`${origin}:${tpl.type}`,chain=state.world.contractChains[chainKey]||0;
 const q={id,type:tpl.type,name:tpl.name,origin,target:target.id,desc:tpl.desc.replace('{target}',target.name),acceptedDay:null,dueDay:null,reward:tpl.reward+rnd(0,35)+Math.min(chain,4)*12+contractSettlementMemoryBonus(origin),status:'offered',faction:opts.faction||worldLocation(origin).faction||SOSText("contracts_contracts_journal.generateContract.001"),chainKey,chainStage:opts.chainStage||0,followup:!!opts.followup};
 if(q.type==='hunt'){
   q.targetKind=pick(chain>=2?['raiders','bandits','raiders']:['bandits','raiders']);q.partyId=null;q.variantName=chain>=2?'Dangerous Bounty':SOSText("contracts_contracts_journal.generateContract.002");q.name=q.variantName;q.desc=SOSText("contracts_contracts_journal.generateContract.003");q.reward+=chain>=2?35:0
 }
 if(q.type==='recovery'){
   q.targetKind=chance(.55)?'bandits':'raiders';q.partyId=null;q.goodId=pick(TRADE_GOODS).id;q.qty=rnd(1,3);q.variantName=SOSText("contracts_contracts_journal.generateContract.004");q.name=q.variantName;q.desc=SOSText("contracts_contracts_journal.generateContract.005",q.qty,q.qty===1?'':'s',TRADE_GOODS.find(g=>g.id===q.goodId).name);q.reward+=25
 }
 if(q.type==='escort'){
   const v=escortVariant(origin,target.id,chain);Object.assign(q,v);q.escortPartyName=v.party;q.escortCargo=v.cargo||rnd(2,5);q.escortRisk=v.risk||0;q.escortStage='offered';q.crossRegion=isCrossRegionRoute(origin,target.id);q.escortTotalDays=Math.max(1,tradeRouteDistanceDays(origin,target.id));q.reward+=q.escortTotalDays*15+v.reward;if(q.crossRegion){q.escortCargoManifest=crossRegionMerchantManifest(origin,target.id,q.escortCargo);q.reward+=45;}q.name=v.variantName;q.desc=SOSText("contracts_contracts_journal.generateContract.006",v.party.toLowerCase(),worldLocation(origin).name,target.name)
 }
 if(q.type==='procure'){const good=pick(TRADE_GOODS);q.goodId=good.id;q.qty=rnd(2,4)+(chain>=2?1:0);q.target=origin;q.variantName=chain>=2?'Priority Supply Order':SOSText("contracts_contracts_journal.generateContract.007");q.name=q.variantName;q.desc=SOSText("contracts_contracts_journal.generateContract.008",q.qty,good.name,worldLocation(origin).name);q.reward+=chain>=2?25:0}
 if(q.type==='delivery'){q.variantName=chain>=2?'Priority Dispatch':SOSText("contracts_contracts_journal.generateContract.009");q.name=q.variantName;if(chain>=2){q.sensitiveCargo=true;q.reward+=25;q.desc=SOSText("contracts_contracts_journal.generateContract.010",target.name)}}
 if(q.type==='visit'){q.variantName=chain>=2?'Dangerous Route Survey':SOSText("contracts_contracts_journal.generateContract.011");q.name=q.variantName;q.reward+=chain>=2?20:0}
 if(q.type==='diplomacy'){q.variantName=chain>=2?'Sensitive Negotiation':SOSText("contracts_contracts_journal.generateContract.012");q.name=q.variantName;q.desc=SOSText("contracts_contracts_journal.generateContract.013",worldLocation(origin).name,target.name);q.reward+=chain>=2?30:0}
 q.crossRegion=q.crossRegion||isCrossRegionRoute(origin,target.id);if(q.crossRegion){q.interregional=true;q.routePlan=crossRegionRoutePlan(origin,target.id);if(q.type!=='escort')q.reward+=35+Math.min(80,q.routePlan.days*8);q.routeSummary=interregionalRouteSummary(origin,target.id)}
 q.reward+=matureCampaignTier()*8;
 assignContractPaymentTerms(q,{spot:false});initializeContractTerms(q);
 return q
}
function maybeSeedContractVariety(locId){
 const arr=state.world.contracts[locId]||[],types=new Set(arr.map(q=>q.type));
 if(arr.length>=2&&!types.has('recovery')&&chance(.28))arr[arr.length-1]=generateContract(locId,'recovery')
}
function refreshContracts(){
 ensureWorldState();if(state.world.contractDay===state.world.day)return;state.world.contractDay=state.world.day;
 for(const loc of availableQuestLocations()){
   const arr=state.world.contracts[loc.id]||[];
   state.world.contracts[loc.id]=arr.filter(q=>q.status==='offered'&&(!q.regional||regionalContractValid(q))&&contractWorldLinkedValid(q)).sort((a,b)=>((b.politicalCampaign?5:0)+(b.worldLinked?4:0)+(b.regional?3:0)+(b.referral?1:0))-((a.politicalCampaign?5:0)+(a.worldLinked?4:0)+(a.regional?3:0)+(a.referral?1:0))).slice(0,3);
   ensureWorldLinkedContractOffers(loc.id);ensureRegionalContractOffer(loc.id);
   if(crossRegionTradeUnlocked()&&!state.world.contracts[loc.id].some(q=>q.crossRegion)&&chance((state.world.unlockedRegions||[]).length>=3?.42:.22)){const cq=chance(.6)?crossRegionSupplyContract(loc.id):generateContract(loc.id,pick(['delivery','escort','diplomacy','visit']),{crossRegion:true});if(cq)state.world.contracts[loc.id].push(cq)}
   const ss=settlementState(loc.id),desired=ss.prosperity>=70&&ss.security>=55?3:ss.prosperity<35||ss.security<30?2:3;
   while(state.world.contracts[loc.id].length<desired)state.world.contracts[loc.id].push(generateContract(loc.id));
   state.world.contracts[loc.id]=state.world.contracts[loc.id].slice(0,desired);maybeSeedContractVariety(loc.id);const referred=ensureTravelerReferralContract(loc.id);if(referred)state.world.contracts[loc.id]=state.world.contracts[loc.id].slice(0,Math.min(4,desired+1));const relq=maybeGenerateRelationshipContract(loc.id);if(relq)state.world.contracts[loc.id]=state.world.contracts[loc.id].slice(0,Math.min(4,desired+1))
 }
}
function contractObjective(q){
 const p=contractParty(q);
 if(q.status==='ready'){ensureContractPaymentTerms(q);const loc=worldLocation(contractPaymentLocation(q)).name,here=state.world.location===contractPaymentLocation(q);return here?SOSText("contracts_contracts_journal.contractObjective.001",q.paymentPayer,loc):SOSText("contracts_contracts_journal.contractObjective.002",q.paymentPayer,loc,q.reward+(q.extraReward||0))}
 if(q.status==='complete')return SOSText("contracts_contracts_journal.contractObjective.003",q.completedDay||state.world.day);
 if(q.status==='failed'||q.status==='abandoned')return q.failReason||SOSText("contracts_contracts_journal.contractObjective.004");
 if(q.type==='hunt')return p?SOSText("contracts_contracts_journal.contractObjective.005",p.name,worldLocation(p.location).name,worldLocation(p.destination).name):SOSText("contracts_contracts_journal.contractObjective.006");
 if(q.type==='recovery')return p?SOSText("contracts_contracts_journal.contractObjective.007",p.name,TRADE_GOODS.find(g=>g.id===q.goodId)?.name||'cargo'):SOSText("contracts_contracts_journal.contractObjective.008");
 if(q.type==='escort'){if(q.escortStage==='rendezvous')return SOSText("contracts_contracts_journal.contractObjective.009",p?.name||'the traveling party',contractIssuerName(q),contractTargetName(q));if(q.escortStage==='escorting')return SOSText("contracts_contracts_journal.contractObjective.010",p?.name||'the traveling party',contractTargetName(q),Math.max(0,q.escortRemainingDays||0),(q.escortRemainingDays||0)===1?'':'s');return SOSText("contracts_contracts_journal.contractObjective.011",contractTargetName(q))}
 if(q.type==='spotservice'){const p=rawContractParty(q);return p?`${q.spotService==='aid'?'Provide the requested practical aid to':'Spend a day working with'} ${p.name}.`:SOSText("contracts_contracts_journal.contractObjective.012")}
 if(q.type==='procure'){const g=TRADE_GOODS.find(x=>x.id===q.goodId),have=state.world.cargo[q.goodId]||0;return SOSText("contracts_contracts_journal.contractObjective.013",q.qty,g?.name||'trade goods',Math.min(have,q.qty),q.qty,contractIssuerName(q))}
 if(q.type==='diplomacy'&&q.decisionReady)return SOSText("contracts_contracts_journal.contractObjective.014",contractTargetName(q));
 if(q.type==='delivery')return SOSText("contracts_contracts_journal.contractObjective.015",contractTargetName(q),contractPaymentSummary(q));
 if(q.type==='visit')return SOSText("contracts_contracts_journal.contractObjective.016",contractTargetName(q));
 if(q.type==='diplomacy')return SOSText("contracts_contracts_journal.contractObjective.017",contractTargetName(q));
 return q.desc||SOSText("contracts_contracts_journal.contractObjective.018")
}
function contractProgress(q){
 if(q.status==='ready')return SOSText("contracts_contracts_journal.contractProgress.001");
 if(q.status!=='active')return contractStatusLabel(q);
 if(q.type==='escort'){if(q.escortStage==='rendezvous')return SOSText("contracts_contracts_journal.contractProgress.002");const total=q.escortTotalDays||1,done=Math.max(0,total-(q.escortRemainingDays||0));return SOSText("contracts_contracts_journal.contractProgress.003",done,total,q.attacksDefended||0,(q.attacksDefended||0)===1?'':'s')}
 if(q.type==='spotservice')return rawContractParty(q)?'Meet the issuing party':SOSText("contracts_contracts_journal.contractProgress.004");
 if(q.type==='procure'){const have=state.world.cargo[q.goodId]||0;return SOSText("contracts_contracts_journal.contractProgress.005",Math.min(have,q.qty),q.qty)}
 if(q.type==='hunt')return contractParty(q)?'Target still active':SOSText("contracts_contracts_journal.contractProgress.006");
 if(q.type==='recovery')return contractParty(q)?'Thieves still active':q.recovered?'Cargo recovered':SOSText("contracts_contracts_journal.contractProgress.007");
 if(q.type==='diplomacy'&&q.decisionReady)return SOSText("contracts_contracts_journal.contractProgress.008");
 return state.world.location===q.target?'At objective':SOSText("contracts_contracts_journal.contractProgress.009")
}
function acceptQuest(id,loc,termsConfirmed=false){
 const q=(state.world.contracts[loc]||[]).find(x=>x.id===id);if(!q||state.world.quests.filter(x=>['active','ready'].includes(x.status)).length>=4)return;initializeContractTerms(q);if(!termsConfirmed&&contractNegotiable(q))return showContractNegotiation(id,loc);
 q.status='active';q.acceptedDay=state.world.day;recordContractAcceptance(q);if(q.workOfferId)updateWorldWorkOffer(q.workOfferId,{status:'open',acceptedDay:state.world.day});
 if(q.worldLinked&&q.worldPartyId){const wp=state.world.parties.find(p=>p.id===q.worldPartyId);if(wp){q.partyId=wp.id;q.origin=wp.location||q.origin;if(q.type==='escort'&&wp.destination){q.target=wp.destination;q.escortTotalDays=Math.max(1,worldTravelDays(q.origin,q.target));q.escortRemainingDays=q.escortTotalDays}}}
 if(q.type==='escort'){q.dueDay=state.world.day+contractDeadlineDays(q);const p=createEscortCaravan(q);q.escortStage='rendezvous';p.contractExpiresDay=q.dueDay;state.world.trackedPartyId=p.id}
 else{q.dueDay=state.world.day+contractDeadlineDays(q);if(['hunt','recovery'].includes(q.type)){const p=createContractTargetParty(q);if(p){p.contractExpiresDay=q.dueDay;state.world.trackedPartyId=p.id}}}
 const advance=contractAdvanceAmount(q);if(advance>0){q.advancePaid=advance;gainGold(advance);q.advancePaidDay=state.world.day}
 state.world.quests.push(q);state.world.contracts[loc]=state.world.contracts[loc].filter(x=>x.id!==id);state.world.trackedQuestId=q.id;log(SOSText("contracts_contracts_journal.acceptQuest.001",q.name),'good');save();
 actionResult(SOSText("contracts_contracts_journal.acceptQuest.002"),SOSText("contracts_contracts_journal.acceptQuest.003",q.name,q.politicalCampaign?`Political goal: ${q.politicalNeed}\n${q.politicalReason}\n\n`:q.regional?`Why this exists: ${regionalContractReason(q)}\n\n`:'',contractObjective(q),`${contractPaymentSummary(q)}${advance?` Advance paid now: ${advance}g.`:''}`,q.dueDay,q.reward),'good',()=>showContractDetails(q.id))
}
function markQuestReady(q,quiet=false){
 if(!q||q.status!=='active')return;ensureContractPaymentTerms(q);q.status='ready';q.readyDay=state.world.day;state.world.trackedQuestId=q.id;
 if(q.type==='escort'){q.escortStage='arrived';state.world.activeEscortQuestId=null;if(state.world.trackedPartyId===q.partyId)state.world.trackedPartyId=null;releaseEscortCaravan(q,true)}
 if(q.spotContract&&q.type==='delivery'){const p=rawContractParty(q);if(p){p.contractProtected=false;p.contractRole=null;p.questId=null;p.contractExpiresDay=null;if(state.world.trackedPartyId===p.id)state.world.trackedPartyId=null}q.mobileIssuerReleasedDay=state.world.day}
 if(q.storyArcId){const result=finalizeQuestPayment(q,{standingGain:1,skipFollowup:true});SOSServices.companions.noteSharedEvent('contract',SOSText("contracts_contracts_journal.markQuestReady.001",q.name,regionalStoryDef(q.storyArcId)?.title||'a regional storyline'));log(SOSText("contracts_contracts_journal.markQuestReady.002",q.name,result.payout),'good');save();return result}
 if(!quiet)log(SOSText("contracts_contracts_journal.markQuestReady.003",q.name,q.paymentPayer,worldLocation(contractPaymentLocation(q)).name),'good');save()
}
function contractPerformanceBonus(q){
 initializeContractTerms(q);let bonus=q.extraReward||0;
 if(q.dueDay&&q.readyDay&&q.dueDay-q.readyDay>=2){const early=Math.min(25,(q.dueDay-q.readyDay)*5);bonus+=early;q.earlyBonus=early}
 if(q.termCompletionBonus&&(!q.dueDay||!q.readyDay||q.readyDay<=q.dueDay)){bonus+=q.termCompletionBonus;q.promisedCompletionBonus=q.termCompletionBonus}
 if(q.type==='escort')bonus+=(q.attacksDefended||0)*15;
 return bonus
}
function contractPerformanceText(q){
 const bits=[];if(q.earlyBonus)bits.push(SOSText("contracts_contracts_journal.contractPerformanceText.001",q.earlyBonus));if(q.promisedCompletionBonus)bits.push(`terms bonus +${q.promisedCompletionBonus}g`);if(q.advancePaid)bits.push(`${q.advancePaid}g advance already paid`);if(q.type==='escort'&&q.attacksDefended)bits.push(SOSText("contracts_contracts_journal.contractPerformanceText.002",q.attacksDefended,q.attacksDefended===1?'':'s',q.attacksDefended*15));if(q.breach)bits.push(SOSText("contracts_contracts_journal.contractPerformanceText.003"));if(q.branch)bits.push(q.branch);return bits.join(' • ')||SOSText("contracts_contracts_journal.contractPerformanceText.004")
}
function maybeCreateFollowupContract(q){
 const key=contractChainKey(q),level=(state.world.contractChains[key]||0)+1;state.world.contractChains[key]=level;
 const sourceMemory=contractPrimaryMemory(q),trusted=contractMemoryScore(sourceMemory)>=4;if(q.followup)return null;if(!trusted&&(level<2||level%2!==0))return null;if(trusted&&level%2!==0&&!chance(.55))return null;
 let type=q.type;if(type==='delivery'&&chance(.4))type='diplomacy';if(type==='hunt'&&chance(.4))type='recovery';
 const follow=generateContract(q.origin,type,{chainKey:key,chainStage:level,followup:true,faction:q.faction});
 follow.reward+=20;follow.name=SOSText("contracts_contracts_journal.maybeCreateFollowupContract.001",follow.name);follow.desc=SOSText("contracts_contracts_journal.maybeCreateFollowupContract.002",follow.desc);state.world.contracts[q.origin]=state.world.contracts[q.origin]||[];state.world.contracts[q.origin].unshift(follow);state.world.contracts[q.origin]=state.world.contracts[q.origin].slice(0,4);state.world.contractStats.followups++;return follow
}

// v1.6.3.3 — Contract Consequences & World Follow-Through
function applyContractWorldFollowThrough(q,outcome,reason='') {
 if(!q||q.worldFollowThroughOutcome)return q?.worldFollowThroughText||'';
 const success=outcome==='complete',abandoned=outcome==='abandoned',locId=q.origin||q.politicalLocId||state.world.location,ss=state.world.settlements?.[locId]?settlementState(locId):null,notes=[];
 const problem=q.worldProblemId?settlementProblem(locId):null,party=q.worldPartyId?state.world.parties.find(p=>p.id===q.worldPartyId):rawContractParty(q);
 if(q.type==='procure'&&q.goodId){
   const delivered=Math.max(1,Number(q.qty)||1);
   if(success){const after=changeTradeStock(locId,q.goodId,delivered);const g=TRADE_GOODS.find(x=>x.id===q.goodId)?.name||'supplies';notes.push(`${g} stock rises to ${after}`);if(problem&&problem.id===q.worldProblemId){progressSettlementProblem(locId,problem.type==='shortage'?2:1,`Contract delivery: ${q.name}`);notes.push(`${problem.title} improves`)}if(ss){ss.prosperity=clamp(ss.prosperity+1,0,100)}if(state.world.marketShock?.[locId])state.world.marketShock[locId]=Math.max(0,state.world.marketShock[locId]-.03);}
   else{if(problem&&problem.id===q.worldProblemId){problem.progress=Math.max(0,(problem.progress||0)-1);problem.expiresDay=Math.max(problem.expiresDay||state.world.day,state.world.day+2);syncSettlementProblemMatter(locId,problem);notes.push(`${problem.title} remains unresolved`)}if(ss){ss.prosperity=clamp(ss.prosperity-(abandoned?1:2),0,100)}state.world.marketShock[locId]=(state.world.marketShock[locId]||0)+(abandoned ? .015 : .025);}
 }
 if(q.worldLinked&&q.type==='visit'&&/security/i.test(`${q.name||''} ${q.worldSourceText||''}`)){
   const route=strongestTroubledRoute(locId);if(success){if(ss)ss.security=clamp(ss.security+3,0,100);if(route?.id)reduceRoutePressure(locId,route.id,1);notes.push('local security pressure eases')}else{if(ss)ss.security=clamp(ss.security-(abandoned?1:2),0,100);if(route?.id)addRoutePressure(locId,route.id,1);notes.push('local security pressure persists')}
 }
 if(q.type==='hunt'&&q.worldPartyId){
   if(success){if(party){party.defeated=true;party.status='defeated';party.contractProtected=false;party.questId=null;party.contractRole=null;party.lastContractOutcome='defeated under contract';party.lastContractDay=state.world.day}if(ss)ss.security=clamp(ss.security+2,0,100);if(q.target&&q.target!==locId)reduceRoutePressure(locId,q.target,1);notes.push(`${q.targetPartyName||party?.name||'The hostile Party'} no longer threatens the contract area`)}
   else{if(party){party.contractProtected=false;party.questId=null;party.contractRole=null;party.contractExpiresDay=null;party.lastContractOutcome=abandoned?'contract abandoned':'contract failed';party.lastContractDay=state.world.day}if(ss)ss.security=clamp(ss.security-(abandoned?1:2),0,100);if(q.target&&q.target!==locId)addRoutePressure(locId,q.target,1);notes.push(`${q.targetPartyName||party?.name||'The hostile Party'} remains active`)}
 }
 if(q.type==='escort'&&q.worldPartyId){
   const live=state.world.parties.find(p=>p.id===q.worldPartyId)||party;if(live){live.lastContractOutcome=success?'escorted successfully':abandoned?'escort abandoned':'escort failed';live.lastContractDay=state.world.day;live.contractMemory=live.contractMemory||[];live.contractMemory.push({day:state.world.day,contractId:q.id,outcome:live.lastContractOutcome});live.contractMemory=live.contractMemory.slice(-8)}
   if(success){if(ss)ss.prosperity=clamp(ss.prosperity+1,0,100);const dest=state.world.settlements?.[q.target]?settlementState(q.target):null;if(dest)dest.prosperity=clamp(dest.prosperity+1,0,100);notes.push(`${q.escortPartyName||live?.name||'The escorted Party'} reaches ${worldLocation(q.target)?.name||'its destination'}`)}else{if(ss)ss.prosperity=clamp(ss.prosperity-1,0,100);notes.push('the planned movement does not improve regional trade or safety')}
 }
 if(q.worldProblemId&&problem&&q.type!=='procure'){
   if(success){progressSettlementProblem(locId,1,`Contract outcome: ${q.name}`);notes.push(`${problem.title} advances toward resolution`)}else{problem.progress=Math.max(0,(problem.progress||0)-1);problem.expiresDay=Math.max(problem.expiresDay||state.world.day,state.world.day+2);syncSettlementProblemMatter(locId,problem);notes.push(`${problem.title} remains active`)}
 }
 if(q.issuerNpcId){const memory=success?`The Guardian completed ${q.name}; the result visibly helped ${worldLocation(locId)?.name||'the local area'}.`:`${q.name} was ${abandoned?'abandoned':'not completed'}; the underlying problem remained.`;npcMemoryAdd(q.issuerNpcId,memory,success?2:-2)}
 if(q.relationshipSourceKind==='npc'&&q.relationshipSourceId&&q.relationshipSourceId!==q.issuerNpcId)npcMemoryAdd(q.relationshipSourceId,success?`${q.name} produced a real result in the world.`:`${q.name} did not resolve the underlying need.`,success?1:-1);
 if(q.workOfferId)updateWorldWorkOffer(q.workOfferId,{status:success?'completed':abandoned?'declined':'expired',worldOutcome:notes.join(' • ')});
 if(q.matterId&&success)updateWorldMatter(q.matterId,{status:'resolved',resolution:`Resolved through contract: ${q.name}`});
 else if(q.matterId&&!success)updateWorldMatter(q.matterId,{status:'active',resolution:null,lastContractOutcome:outcome});
 if(q.faction&&OPEN_WORLD_FACTIONS[q.faction]&&q.worldLinked&&!q.politicalCampaign)addPoliticalPressure(locId,q.faction,success ? .5 : abandoned ? -.25 : -.5,`Contract follow-through: ${q.name}`);
 q.worldFollowThroughOutcome=outcome;q.worldFollowThroughDay=state.world.day;q.worldFollowThroughText=notes.join(' • ')|| (success?'The contract source records the successful outcome.':'The living-world source remains unresolved.');
 recordWorldHistory(`${q.name}: ${q.worldFollowThroughText}`,(success?'good':'bad'),'contract');if(ss)addSettlementEvidence(locId,`${q.name}: ${q.worldFollowThroughText}`,success?'good':'bad',5);return q.worldFollowThroughText;
}

function finalizeQuestPayment(q,opts={}){
 const bonus=contractPerformanceBonus(q),payout=q.reward+bonus,finalPayment=Math.max(0,payout-(q.advancePaid||0));q.status='complete';q.completedDay=state.world.day;q.payout=payout;q.finalPayment=finalPayment;gainGold(finalPayment);state.reputation++;state.world.contractStats.completed++;if(q.earlyBonus)state.world.contractStats.early++;recordContractOutcome(q,'complete');
 state.world.factionStanding[q.faction]=(state.world.factionStanding[q.faction]||0)+(opts.standingGain??2);changeLocalReputation(q.origin,1,SOSText("contracts_contracts_journal.finalizeQuestPayment.001",q.name));if(state.world.trackedQuestId===q.id)state.world.trackedQuestId=null;
 regionalStoryContractProgress(q);const politicalImpact=applyPoliticalCampaignConsequences(q),regionalImpact=q.spotContract?'':applyRegionalContractConsequences(q),worldImpact=applyContractWorldFollowThrough(q,'complete'),follow=opts.skipFollowup||q.spotContract||q.politicalCampaign?null:maybeCreateFollowupContract(q);if(q.spotContract)finishSpotPartyContract(q);if(q.relationshipGenerated){const R=relationshipContractState();R.history.push({day:state.world.day,type:'completed',contractId:q.id,text:SOSText("contracts_contracts_journal.finalizeQuestPayment.002",q.name,q.relationshipSourceName)});if(q.relationshipSourceKind==='npc'&&q.relationshipSourceId){const nr=npcRelationshipState(q.relationshipSourceId);nr.familiarity=clamp(nr.familiarity+1,0,10);npcMemoryAdd(q.relationshipSourceId,SOSText("contracts_contracts_journal.finalizeQuestPayment.003",q.name),1)}if(q.relationshipSourceKind==='companion'&&q.relationshipSourceId)SOSServices.companions.adjustTrust(q.relationshipSourceId,2);if(q.relationshipSourceKind==='traveler'&&q.relationshipSourceId){const tr=travelerRegistryState().records[q.relationshipSourceId];if(tr){tr.contractsCompleted=(tr.contractsCompleted||0)+1;tr.social=tr.social||{familiarity:0};tr.social.familiarity=clamp((tr.social.familiarity||0)+1,0,10)}}}SOSServices.companions.noteSharedEvent('contract',SOSText("contracts_contracts_journal.finalizeQuestPayment.004",q.name,regionalImpact?` and changed regional conditions (${regionalImpact})`:'',politicalImpact?` Political result: ${politicalImpact}.`:''));log(SOSText("contracts_contracts_journal.finalizeQuestPayment.005",q.name,payout),'good');chronicle(SOSText("contracts_contracts_journal.finalizeQuestPayment.006"),SOSText("contracts_contracts_journal.finalizeQuestPayment.007",q.name,state.world.day),'event');save();return {bonus,payout,finalPayment,regionalImpact,worldImpact,follow}
}
function turnInQuest(q,after=renderOpenWorld){
 if(!q||q.status!=='ready')return;ensureContractPaymentTerms(q);if(state.world.location!==contractPaymentLocation(q))return;
 if(q.type==='procure'){const have=state.world.cargo[q.goodId]||0;if(have<q.qty){q.status='active';save();return showContractDetails(q.id)}state.world.cargo[q.goodId]-=q.qty}
 const wholePoliticalBefore=q.politicalCampaign?politicalOutcomeSnapshot(q.politicalLocId||q.origin,[q.politicalFaction||q.faction,q.politicalRival]):null,{bonus,payout,regionalImpact,worldImpact,follow}=finalizeQuestPayment(q),politicalImpact=q.politicalCampaign?politicalCampaignEffectText(q):'',wholePoliticalAfter=q.politicalCampaign?politicalOutcomeSnapshot(q.politicalLocId||q.origin,[q.politicalFaction||q.faction,q.politicalRival]):null;
 if(q.politicalCampaign)return showPoliticalOutcome(q.name,SOSText("contracts_contracts_journal.turnInQuest.001",sentenceStart(q.paymentPayer||'The authorized payer'),worldLocation(contractPaymentLocation(q)).name,payout),wholePoliticalBefore,wholePoliticalAfter,{tone:'good',notes:[bonus?SOSText("contracts_contracts_journal.turnInQuest.002",bonus):'',politicalImpact?SOSText("contracts_contracts_journal.turnInQuest.003",politicalImpact):'',regionalImpact?SOSText("contracts_contracts_journal.turnInQuest.004",regionalImpact):''].filter(Boolean),back:after});
 actionResult(SOSText("contracts_contracts_journal.turnInQuest.005"),SOSText("contracts_contracts_journal.turnInQuest.006",q.name,q.paymentPayer||'the authorized payer',worldLocation(contractPaymentLocation(q)).name,payout,bonus?` Bonus: ${bonus}g.`:'',politicalImpact?`\n\nPolitical result: ${politicalImpact}.`:'',`${regionalImpact?`\n\nRegional impact: ${regionalImpact}.`:''}${worldImpact?`\n\nWorld follow-through: ${worldImpact}.`:''}`,follow?` New work is available in ${contractIssuerName(q)}.`:''),'good',after)
}
function completeQuest(q){markQuestReady(q)}
function failEscortContract(q,reason,abandoned=false){
 if(!q||q.type!=='escort'||!['active','ready'].includes(q.status))return;q.status=abandoned?'abandoned':'failed';q.failReason=reason;q.failedDay=state.world.day;state.world.activeEscortQuestId=null;if(state.world.trackedQuestId===q.id)state.world.trackedQuestId=null;if(state.world.trackedPartyId===q.partyId)state.world.trackedPartyId=null;
 state.world.contractStats[abandoned?'abandoned':'failed']++;state.world.factionStanding[q.faction]=(state.world.factionStanding[q.faction]||0)-(abandoned?2:1);if(abandoned)state.reputation=Math.max(0,(state.reputation||0)-1);applyPoliticalCampaignFailure(q,reason,abandoned);recordContractOutcome(q,abandoned?'abandoned':'failed',reason);applyContractWorldFollowThrough(q,abandoned?'abandoned':'failed',reason);releaseEscortCaravan(q,false);save()
}
function abandonQuest(q){
 if(!q||!['active','ready'].includes(q.status))return;if(q.type==='escort'){failEscortContract(q,SOSText("contracts_contracts_journal.abandonQuest.001"),true);return actionResult(SOSText("contracts_contracts_journal.abandonQuest.002"),SOSText("contracts_contracts_journal.abandonQuest.003",q.name),'bad',showContractsJournal)}
 const wholePoliticalBefore=q.politicalCampaign?politicalOutcomeSnapshot(q.politicalLocId||q.origin,[q.politicalFaction||q.faction,q.politicalRival]):null;q.status='abandoned';state.world.contractStats.abandoned++;if(state.world.trackedQuestId===q.id)state.world.trackedQuestId=null;state.world.factionStanding[q.faction]=(state.world.factionStanding[q.faction]||0)-1;applyPoliticalCampaignFailure(q,SOSText("contracts_contracts_journal.abandonQuest.004"),true);const p=rawContractParty(q);if(p){p.questId=null;p.contractProtected=false;p.contractRole=null;p.contractExpiresDay=null}recordContractOutcome(q,'abandoned',SOSText("contracts_contracts_journal.abandonQuest.004"));applyContractWorldFollowThrough(q,'abandoned',SOSText("contracts_contracts_journal.abandonQuest.004"));save();if(q.politicalCampaign)return showPoliticalOutcome(SOSText("contracts_contracts_journal.abandonQuest.005"),SOSText("contracts_contracts_journal.abandonQuest.006",q.name),wholePoliticalBefore,politicalOutcomeSnapshot(q.politicalLocId||q.origin,[q.politicalFaction||q.faction,q.politicalRival]),{tone:'bad',notes:[SOSText("contracts_contracts_journal.abandonQuest.007",q.faction)],back:showContractsJournal});actionResult(SOSText("contracts_contracts_journal.abandonQuest.008"),SOSText("contracts_contracts_journal.abandonQuest.009",q.name,q.faction),'bad',showContractsJournal)
}
function queueContractFailureNotice(q,reason,standingLoss=1){
 ensureWorldState();state.world.pendingContractFailures.push({id:q.id,name:q.name,day:state.world.day,reason,faction:q.faction||SOSText("contracts_contracts_journal.queueContractFailureNotice.001"),standingLoss,politicalCampaign:!!q.politicalCampaign,politicalOutcome:q.politicalOutcome||null});
 state.world.pendingContractFailures=state.world.pendingContractFailures.slice(-12);
 log(SOSText("contracts_contracts_journal.queueContractFailureNotice.002",q.name,reason,q.faction||'Faction',standingLoss),'bad');
 recordWorldHistory(SOSText("contracts_contracts_journal.queueContractFailureNotice.003",q.name,state.world.day,reason),'bad','contract');
 chronicle(SOSText("contracts_contracts_journal.queueContractFailureNotice.004"),`${q.name}: ${reason}`,'event')
}
function showPendingContractFailureNotice(){modalRouteEnter(SOSText("contracts_contracts_journal.showPendingContractFailureNotice.001"),Array.from(arguments));
 if(!isOpenWorld()||!state.world.pendingContractFailures?.length)return false;const n=state.world.pendingContractFailures.shift();save();
 if(n.politicalCampaign&&n.politicalOutcome){showPoliticalOutcome(n.name,n.reason,n.politicalOutcome.before,n.politicalOutcome.after,{tone:'bad',notes:[SOSText("contracts_contracts_journal.showPendingContractFailureNotice.002",n.faction)],back:()=>closeOverlay(),button:SOSText("contracts_contracts_journal.showPendingContractFailureNotice.003")});return true}
 overlay(SOSText("contracts_contracts_journal.showPendingContractFailureNotice.004",esc(n.name),esc(n.reason),n.day,esc(n.faction),n.standingLoss));wireClose();return true
}
function warnAndFailExpiredQuests(){
 for(const q of state.world.quests.filter(x=>x.status==='active')){
   const left=contractDaysLeft(q);if(left===1&&!q.deadlineWarned){q.deadlineWarned=true;log(SOSText("contracts_contracts_journal.warnAndFailExpiredQuests.001",q.name),'bad')}
   if(left<0){
     const reason=q.type==='escort'?SOSText("contracts_contracts_journal.warnAndFailExpiredQuests.002",contractTargetName(q),q.dueDay):SOSText("contracts_contracts_journal.warnAndFailExpiredQuests.003",q.dueDay);
     if(q.type==='escort'){failEscortContract(q,reason,false);queueContractFailureNotice(q,reason,1)}
     else{
       const wholePoliticalBefore=q.politicalCampaign?politicalOutcomeSnapshot(q.politicalLocId||q.origin,[q.politicalFaction||q.faction,q.politicalRival]):null;q.status='failed';q.failReason=reason;q.failedDay=state.world.day;state.world.contractStats.failed++;if(state.world.trackedQuestId===q.id)state.world.trackedQuestId=null;if(state.world.trackedPartyId===q.partyId)state.world.trackedPartyId=null;
       const p=rawContractParty(q);if(p){p.contractProtected=false;p.contractRole=null;p.questId=null;p.contractExpiresDay=null}
       state.world.factionStanding[q.faction]=(state.world.factionStanding[q.faction]||0)-1;applyPoliticalCampaignFailure(q,reason,false);recordContractOutcome(q,'failed',reason);applyContractWorldFollowThrough(q,'failed',reason);if(q.worldLinked||q.issuerNpcId)changeLocalReputation(q.origin,-1,`Failed contract: ${q.name}`);if(q.politicalCampaign)q.politicalOutcome={before:wholePoliticalBefore,after:politicalOutcomeSnapshot(q.politicalLocId||q.origin,[q.politicalFaction||q.faction,q.politicalRival]),notes:[reason]};queueContractFailureNotice(q,reason,1)
     }
   }
 }
}
function failExpiredQuests(){warnAndFailExpiredQuests()}
function checkWorldQuestArrival(){
 if(!isOpenWorld()||activeEscortQuest())return;
 for(const q of state.world.quests.filter(x=>x.status==='active')){
   if(q.type==='escort'||q.type==='hunt'||q.type==='recovery')continue;
   if(['delivery','visit'].includes(q.type)&&q.target===state.world.location)markQuestReady(q);
   if(q.type==='diplomacy'&&q.target===state.world.location&&!q.decisionReady){q.decisionReady=true;state.world.trackedQuestId=q.id;log(SOSText("contracts_contracts_journal.checkWorldQuestArrival.001",q.name),'info');save()}
   if(q.type==='procure'&&q.origin===state.world.location&&(state.world.cargo[q.goodId]||0)>=q.qty)markQuestReady(q)
 }
}
function showDiplomacyDecision(q){modalRouteEnter(SOSText("contracts_contracts_journal.showDiplomacyDecision.001"),Array.from(arguments));
 if(!q||q.type!=='diplomacy'||q.status!=='active'||state.world.location!==q.target)return showContractDetails(q?.id);
 overlay(SOSText("contracts_contracts_journal.showDiplomacyDecision.002",esc(q.name)));
 $('#termsDeliver').onclick=()=>{q.branch=SOSText("contracts_contracts_journal.showDiplomacyDecision.003");q.decisionReady=false;markQuestReady(q);showContractDetails(q.id)};
 $('#termsOpen').onclick=()=>{q.branch=SOSText("contracts_contracts_journal.showDiplomacyDecision.004");q.breach=true;q.decisionReady=false;gainScouting(1);state.world.factionStanding[q.faction]=(state.world.factionStanding[q.faction]||0)-2;q.extraReward=(q.extraReward||0)-10;markQuestReady(q);actionResult(SOSText("contracts_contracts_journal.showDiplomacyDecision.005"),SOSText("contracts_contracts_journal.showDiplomacyDecision.006"),'bad',()=>showContractDetails(q.id))};
 $('#termsPressure').onclick=()=>{const score=stat(state,'cha')+rnd(1,12);q.decisionReady=false;if(score>=14){q.extraReward=(q.extraReward||0)+25;q.branch=SOSText("contracts_contracts_journal.showDiplomacyDecision.007");markQuestReady(q);actionResult(SOSText("contracts_contracts_journal.showDiplomacyDecision.008"),SOSText("contracts_contracts_journal.showDiplomacyDecision.009"),'good',()=>showContractDetails(q.id))}else{changeLocalReputation(q.target,-1,SOSText("contracts_contracts_journal.showDiplomacyDecision.010"));q.branch=SOSText("contracts_contracts_journal.showDiplomacyDecision.011");markQuestReady(q);actionResult(SOSText("contracts_contracts_journal.showDiplomacyDecision.012"),SOSText("contracts_contracts_journal.showDiplomacyDecision.013"),'bad',()=>showContractDetails(q.id))}};
 $('#termsBack').onclick=()=>SOSServices.navigation.back(()=>showContractDetails(q.id))
}
function beginEscortContract(q){
 repairEscortContracts();const current=activeEscortQuest();if(current&&current.id!==q?.id)return showEscortStatus(current.id);const p=escortCaravan(q);if(!q||q.type!=='escort'||q.status!=='active'||!p)return showContractDetails(q?.id);if(q.escortStage!=='rendezvous')return showEscortStatus(q.id);
 if(state.world.location!==q.origin&&!canEngageWorldParty(p))return actionResult(SOSText("contracts_contracts_journal.beginEscortContract.001"),SOSText("contracts_contracts_journal.beginEscortContract.002",p.name,contractIssuerName(q)),'info',()=>showContractDetails(q.id));
 q.escortStage='escorting';q.escortStartedDay=state.world.day;q.escortRemainingDays=Math.max(1,q.escortTotalDays||tradeRouteDistanceDays(q.origin,q.target));q.escortDaysTraveled=0;q.attacksDefended=q.attacksDefended||0;p.location=q.origin;p.destination=q.target;p.travelTotal=q.escortTotalDays;p.travelLeft=q.escortRemainingDays;p.contractProtected=true;p.escortWaiting=false;p.escortActive=true;state.world.activeEscortQuestId=q.id;state.world.trackedQuestId=q.id;state.world.trackedPartyId=p.id;save();showEscortStatus(q.id)
}
function escortAttackCandidate(p){
 const q=p.questId?activeQuest(p.questId):null,bonus=q?.escortRisk||0,cp=worldPartyPosition(p),hostiles=state.world.parties.filter(x=>x.id!==p.id&&!x.contractProtected&&worldPartyDisposition(x)==='hostile').map(x=>({p:x,pos:worldPartyPosition(x)})).sort((a,b)=>Math.hypot(a.pos.x-cp.x,a.pos.y-cp.y)-Math.hypot(b.pos.x-cp.x,b.pos.y-cp.y));
 if(hostiles.length&&Math.hypot(hostiles[0].pos.x-cp.x,hostiles[0].pos.y-cp.y)<=16&&chance(clamp(.72+bonus,.35,.92)))return hostiles[0].p;
 const ss=settlementState(p.destination),risk=clamp(.16+Math.max(0,55-ss.security)/220+bonus,.08,.52);return chance(risk)?null:false
}
function makeEscortAmbushGroup(q,p,attacker){let gr;if(attacker)gr=makeWorldCombatGroup(attacker);else{const kind=chance(.55)?'bandits':'raiders',t=worldPartyType(kind),pseudo={id:`escort_${uid()}`,kind,name:t.name,faction:t.faction,location:p.location,destination:p.destination};gr=makeWorldCombatGroup(pseudo);delete gr.worldPartyId}gr.escortContractId=q.id;gr.escortCaravanId=p.id;gr.escortDefense=true;gr.name=attacker?SOSText("contracts_contracts_journal.makeEscortAmbushGroup.001",attacker.name):SOSText("contracts_contracts_journal.makeEscortAmbushGroup.002",gr.name);gr.status=SOSText("contracts_contracts_journal.makeEscortAmbushGroup.003");return gr}
function beginEscortDefense(q,p,attacker){const gr=makeEscortAmbushGroup(q,p,attacker);SOSServices.combat.launch(gr)}
function escortDefenseWon(id){const q=state.world.quests.find(x=>x.id===id);if(!q||q.status!=='active')return;q.attacksDefended=(q.attacksDefended||0)+1;log(SOSText("contracts_contracts_journal.escortDefenseWon.001",contractParty(q)?.name||'The escorted party'),'good');save()}
function arriveEscortContract(q){const p=escortCaravan(q),partyName=p?.name||SOSText("contracts_contracts_journal.arriveEscortContract.001");if(p){p.location=q.target;p.travelLeft=0}state.world.location=q.target;ensureMapView().lastLocation=null;q.escortRemainingDays=0;q.escortDaysTraveled=q.escortTotalDays;recordWorldHistory(SOSText("contracts_contracts_journal.arriveEscortContract.002",q.name,contractTargetName(q)),'good','contract');const storyResult=markQuestReady(q,true);if(q.status==='complete'&&storyResult)return actionResult(SOSText("contracts_contracts_journal.arriveEscortContract.003"),SOSText("contracts_contracts_journal.arriveEscortContract.004",partyName,contractTargetName(q),storyResult.payout,storyResult.bonus?` Performance bonus: ${storyResult.bonus}g.`:''),'good',renderOpenWorld);const {bonus,payout,regionalImpact,worldImpact,follow}=finalizeQuestPayment(q),politicalImpact=q.politicalCampaign?politicalCampaignEffectText(q):'';actionResult(SOSText("contracts_contracts_journal.arriveEscortContract.005"),SOSText("contracts_contracts_journal.arriveEscortContract.006",partyName,contractTargetName(q),payout,bonus?` Performance bonus: ${bonus}g.`:'',politicalImpact?`\n\nPolitical result: ${politicalImpact}.`:'',regionalImpact?`\n\nRegional impact: ${regionalImpact}.`:'',worldImpact?`\n\nWorld follow-through: ${worldImpact}.`:'',follow?`\n\nThe successful job has led to new work back in ${contractIssuerName(q)}.`:''),'good',renderOpenWorld)}
function continueEscortContract(id){
 const q=state.world.quests.find(x=>x.id===id),p=escortCaravan(q);if(!q||q.status!=='active'||q.escortStage!=='escorting'||!p)return renderOpenWorld();
 function leg(){if(q.status!=='active')return actionResult(SOSText("contracts_contracts_journal.leg.001"),q.failReason||SOSText("contracts_contracts_journal.leg.002"),'bad',renderOpenWorld);if(q.escortRemainingDays<=0)return arriveEscortContract(q);advanceWorldDays(1,SOSText("contracts_contracts_journal.leg.003",p.name,contractTargetName(q)));if(q.status!=='active')return actionResult(SOSText("contracts_contracts_journal.leg.004"),q.failReason||SOSText("contracts_contracts_journal.leg.005"),'bad',renderOpenWorld);q.escortRemainingDays=Math.max(0,q.escortRemainingDays-1);q.escortDaysTraveled=(q.escortDaysTraveled||0)+1;p.travelLeft=q.escortRemainingDays;if(q.escortRemainingDays<=0)return arriveEscortContract(q);const attacker=escortAttackCandidate(p);if(attacker!==false){save();return beginEscortDefense(q,p,attacker)}save();maybeRoadEvent(p.location,q.target,true,leg)}leg()
}
function confirmBreakEscort(q,fromCombat=false){overlay(SOSText("contracts_contracts_journal.confirmBreakEscort.001",esc(q.faction),fromCombat?'Break Contract & Disengage':'Break Contract'),false,true);$('#breakEscortNo').onclick=()=>fromCombat?renderCombat():showEscortStatus(q.id);$('#breakEscortYes').onclick=()=>{if(fromCombat&&combat){const gr=combat.group;removeGroup(gr);combat=null}failEscortContract(q,fromCombat?'The Guardian abandoned the escort during an attack.':SOSText("contracts_contracts_journal.confirmBreakEscort.002"),true);closeOverlay();renderOpenWorld();actionResult(SOSText("contracts_contracts_journal.confirmBreakEscort.003"),SOSText("contracts_contracts_journal.confirmBreakEscort.004"),'bad',renderOpenWorld)}}
function showEscortStatus(id){modalRouteEnter(SOSText("contracts_contracts_journal.showEscortStatus.001"),Array.from(arguments));const q=state.world.quests.find(x=>x.id===id),p=escortCaravan(q);if(!q||q.status!=='active'||q.escortStage!=='escorting'||!p)return showContractDetails(id);const total=q.escortTotalDays||1,done=Math.max(0,total-(q.escortRemainingDays||0));overlay(SOSText("contracts_contracts_journal.showEscortStatus.002",esc(p.name),esc(contractIssuerName(q)),esc(contractTargetName(q)),done,total,q.escortRemainingDays,q.escortRemainingDays===1?'':'s',q.attacksDefended||0,(q.attacksDefended||0)===1?'':'s',q.dueDay),false,true);$('#escortContinue').onclick=()=>continueEscortContract(q.id);$('#escortDetails').onclick=()=>showContractDetails(q.id);$('#escortBreak').onclick=()=>confirmBreakEscort(q,false)}
function submitProcurement(q){if(q.type!=='procure'||q.status!=='active')return;const have=state.world.cargo[q.goodId]||0;if(state.world.location!==q.origin||have<q.qty)return showContractDetails(q.id);markQuestReady(q);showContractDetails(q.id)}
function contractPrimaryAction(q){
 if(q.status==='ready'){const payLoc=contractPaymentLocation(q),payName=worldLocation(payLoc).name;return state.world.location===payLoc?SOSText("contracts_contracts_journal.contractPrimaryAction.001",esc(q.paymentPayer||'Authorized Payer')):SOSText("contracts_contracts_journal.contractPrimaryAction.002",esc(payName));}
 if(q.status!=='active')return'';
 if(q.type==='escort'){const p=escortCaravan(q);if(q.escortStage==='rendezvous')return state.world.location===q.origin||canEngageWorldParty(p)?'<button id="contractPrimary">Begin Escort</button>':SOSText("contracts_contracts_journal.contractPrimaryAction.003");if(q.escortStage==='escorting')return SOSText("contracts_contracts_journal.contractPrimaryAction.004")}
 if(['hunt','recovery'].includes(q.type)){const p=contractParty(q);return p?'<button id="contractPrimary">Open Target Report</button>':''}
 if(q.type==='spotservice')return rawContractParty(q)?'<button id="contractPrimary">Meet Party / Perform Work</button>':'';
 if(q.type==='procure')return state.world.location===q.origin&&(state.world.cargo[q.goodId]||0)>=q.qty?'<button id="contractPrimary">Submit Goods</button>':SOSText("contracts_contracts_journal.contractPrimaryAction.005");
 if(q.type==='diplomacy'&&q.decisionReady)return SOSText("contracts_contracts_journal.contractPrimaryAction.006");
 if(['delivery','visit','diplomacy'].includes(q.type))return state.world.location===q.target?'<button id="contractPrimary">Complete Objective</button>':`<button id="contractPrimary">${q.crossRegion?'Continue Interregional Route':'Travel to '+esc(contractTargetName(q))}</button>`;
 return''
}
function runContractPrimary(q){
 if(q.status==='ready'){const payLoc=contractPaymentLocation(q);return state.world.location===payLoc?turnInQuest(q):(q.crossRegion&&locationRegion(payLoc)!==currentWorldRegion()?travelTowardDestination(payLoc):attemptWorldTravel(payLoc));}
 if(q.type==='escort'){const p=escortCaravan(q);if(q.escortStage==='rendezvous')return state.world.location===q.origin||canEngageWorldParty(p)?beginEscortContract(q):attemptWorldTravel(q.origin);if(q.escortStage==='escorting')return showEscortStatus(q.id)}
 if(['hunt','recovery'].includes(q.type)){const p=contractParty(q);return p?showWorldParty(p.id):showContractDetails(q.id)}
 if(q.type==='spotservice')return resolveSpotService(q);
 if(q.type==='procure'){if(state.world.location===q.origin&&(state.world.cargo[q.goodId]||0)>=q.qty)return submitProcurement(q);return showWorldTrade(state.world.location)}
 if(q.type==='diplomacy'&&q.decisionReady)return showDiplomacyDecision(q);
 if(['delivery','visit','diplomacy'].includes(q.type)){if(state.world.location===q.target){if(q.type==='diplomacy'){q.decisionReady=true;return showDiplomacyDecision(q)}markQuestReady(q);return showContractDetails(q.id)}return q.crossRegion?travelTowardDestination(q.target):attemptWorldTravel(q.target)}
}
function showContractDetails(id){modalRouteEnter(SOSText("contracts_contracts_journal.showContractDetails.001"),Array.from(arguments));
 repairEscortContracts();const q=state.world.quests.find(x=>x.id===id)||Object.values(state.world.contracts).flat().find(x=>x.id===id);if(!q)return showContractsJournal();const days=contractDaysLeft(q),primary=contractPrimaryAction(q),chain=contractChainLevel(q);
 overlay(SOSText("contracts_contracts_journal.showContractDetails.002",esc(q.name),esc(contractStatusLabel(q)),esc(contractObjective(q)),politicalCampaignSourceHTML(q),`${contractWorldSourceHTML(q)}${q.regional?`<div class="regional-contract-source"><b>Why this contract exists</b><br>${esc(regionalContractReason(q))}${regionalContractImpactText(q)?`<br><small>Expected regional effect: ${esc(regionalContractImpactText(q))}</small>`:''}${q.matterId?worldMatterChannelLabel(q.matterId,'contract'):''}</div>`:''}`,`${relationshipContractSourceHTML(q)}${contractMemorySourceHTML(q)}${contractTermsHTML(q)}`,interregionalContractRouteHTML(q),esc(contractVariantLabel(q)),esc(contractIssuerName(q)),esc(contractTargetName(q)),esc(contractPaymentSummary(q)),esc(contractProgress(q)),q.reward,q.status==='complete'?`<div class="stat-row"><span>Performance</span><b>${esc(contractPerformanceText(q))}</b></div><div class="stat-row"><span>Outcome</span><b>${esc(q.contractOutcome||'Completed successfully')}</b></div><div class="stat-row"><span>Paid</span><b>${q.payout||q.reward}g</b></div>`:(q.contractOutcome?`<div class="stat-row"><span>Outcome</span><b>${esc(q.contractOutcome)}</b></div>`:''),q.acceptedDay?`Day ${q.acceptedDay}`:'Not accepted',q.dueDay?`Day ${q.dueDay}${days!=null&&q.status==='active'?` • ${Math.max(0,days)} day${days===1?'':'s'} left`:''}`:'—',chain?`<div class="stat-row"><span>Issuer history</span><b>${chain} completed job${chain===1?'':'s'} in this line</b></div>`:'',primary,['active','ready'].includes(q.status)?`<button id="trackContract">${state.world.trackedQuestId===q.id?'Stop Tracking':'Track Contract'}</button>`:'',['active','ready'].includes(q.status)&&!(q.type==='escort'&&q.escortStage==='escorting')?'<button id="abandonContract">Abandon Contract…</button>':''));
 if($('#contractPrimary'))$('#contractPrimary').onclick=()=>runContractPrimary(q);if($('#trackContract'))$('#trackContract').onclick=()=>{state.world.trackedQuestId=state.world.trackedQuestId===q.id?null:q.id;save();showContractDetails(q.id)};if($('#abandonContract'))$('#abandonContract').onclick=()=>{if(confirm(SOSText("contracts_contracts_journal.showContractDetails.003",q.name)))abandonQuest(q)};$('#contractDetailsBack').onclick=()=>SOSServices.navigation.back(showContractsJournal)
}
function contractCard(q){return SOSText("contracts_contracts_journal.contractCard.001",q.type,q.politicalCampaign?'political-contract':'',q.regional?'regional-contract':'',q.crossRegion?'interregional-contract':'',esc(q.name),q.politicalCampaign?'POLITICAL • ':q.crossRegion?'INTERREGIONAL • ':q.regional?'REGIONAL • ':'',esc(q.type.toUpperCase()),q.politicalCampaign?`<div class="political-contract-why">${esc(q.politicalNeed)} • ${esc(politicalCampaignEffectText(q))}</div>`:'',q.worldLinked?`<div class="regional-contract-why"><b>Living-world contract:</b> ${esc(contractWorldSourceText(q))}</div>`:q.regional?`<div class="regional-contract-why">${esc(regionalContractReason(q))}</div>`:'',esc(contractObjective(q)),esc(contractProgress(q)),q.dueDay&&q.status==='active'?` • Due Day ${q.dueDay}`:'',q.reward,q.followup?' • FOLLOW-UP':'',esc(contractPaymentShort(q)),q.id)}
function wireContractCards(){document.querySelectorAll('[data-contractdetail]').forEach(b=>b.onclick=()=>showContractDetails(b.dataset.contractdetail))}
function contractRelevantToRegion(q,region=currentWorldRegion()){return !!q&&(q.crossRegion||q.storyArcId||locationRegion(q.origin)===region||locationRegion(q.target)===region)}
function showContractsJournal(){modalRouteEnter(SOSText("contracts_contracts_journal.showContractsJournal.001"),Array.from(arguments));
 repairEscortContracts();const region=currentWorldRegion(),active=state.world.quests.filter(q=>q.status==='active'&&contractRelevantToRegion(q,region)),ready=state.world.quests.filter(q=>q.status==='ready'&&contractRelevantToRegion(q,region)),past=state.world.quests.filter(q=>['complete','failed','abandoned'].includes(q.status)&&contractRelevantToRegion(q,region)).slice().reverse(),escort=activeEscortQuest(),cs=state.world.contractStats;
 overlay(SOSText("contracts_contracts_journal.showContractsJournal.002",esc(regionDef(region).name),escort?`<div class="warning notice"><b>Escort underway:</b> ${esc(contractObjective(escort))}<br><button id="journalResumeEscort">Resume Escort</button></div>`:'',cs.completed||0,cs.failed||0,cs.abandoned||0,state.world.regionalContractStats.completed||0,cs.followups||0,ready.map(contractCard).join('')||'<p class="muted">None.</p>',active.map(contractCard).join('')||'<p class="muted">No active contracts.</p>',past.slice(0,20).map(contractCard).join('')||'<p class="muted">No finished contracts yet.</p>'));
 wireContractCards();if($('#relationshipContractsJournal'))$('#relationshipContractsJournal').onclick=showRelationshipContractJournal;if($('#journalResumeEscort'))$('#journalResumeEscort').onclick=()=>showEscortStatus(escort.id);wireClose()
}
function showContractBoard(locId=state.world.location){modalRouteEnter(SOSText("contracts_contracts_journal.showContractBoard.001"),Array.from(arguments));
 refreshContracts();const loc=worldLocation(locId),offers=state.world.contracts[locId]||[],active=state.world.quests.filter(x=>['active','ready'].includes(x.status)),readyHere=state.world.quests.filter(x=>x.status==='ready'&&contractPaymentLocation(x)===locId);
 const readyHTML=readyHere.map(q=>{const payout=q.reward+contractPerformanceBonus(q);return SOSText("contracts_contracts_journal.showContractBoard.002",esc(q.name),esc(contractObjective(q)),esc(q.paymentPayer||'Authorized payer'),payout,q.id,q.id)}).join('');
 const offersHTML=offers.map(q=>SOSText("contracts_contracts_journal.showContractBoard.003",q.followup?'contract-followup':'',q.politicalCampaign?'political-contract':'',q.regional?'regional-contract':'',esc(q.name),q.politicalCampaign?'POLITICAL • ':q.crossRegion?'INTERREGIONAL • ':q.regional?'REGIONAL • ':'',esc(q.type.toUpperCase()),q.politicalCampaign?`<div class="political-contract-why"><b>Campaign goal:</b> ${esc(q.politicalNeed)}<br><small>${esc(politicalCampaignEffectText(q))}</small></div>`:'',q.worldLinked?`<div class="regional-contract-why"><b>Living-world source:</b> ${esc(contractWorldSourceText(q))}</div>`:q.regional?`<div class="regional-contract-why"><b>Regional cause:</b> ${esc(regionalContractReason(q))}</div>`:'',q.referral?`<div class="traveler-referral"><b>Referred by ${esc(q.referralTravelerName)}</b><br><small>A known road contact recommended the Guardian for this work.</small></div>`:'',`${relationshipContractSourceHTML(q)}${contractMemorySourceHTML(q)}${contractTermsHTML(q,true)}`,esc(q.desc),q.crossRegion?`<div class="compact interregional-offer-route">${esc(interregionalRouteSummary(q.origin,q.target))}</div>`:'',q.type==='escort'?`${worldLocation(q.origin).name} → ${worldLocation(q.target).name} • ${q.escortTotalDays} travel day${q.escortTotalDays===1?'':'s'} • `:'',q.reward,contractTemplate(q.type)?.days||7,esc(q.faction),q.followup?' • Requested after prior work':'',esc(contractPaymentShort(q)),q.id,active.length>=4?'disabled':'')).join('');
 overlay(SOSText("contracts_contracts_journal.showContractBoard.004",esc(loc.name),readyHere.length?`<div class="contract-priority-section"><h3>Completed Work — Turn In Now</h3><p class="muted compact">Completed work is shown first so payment can be settled before taking on more local work.</p>${readyHTML}<div class="notice compact">Finish the completed contract${readyHere.length===1?'':'s'} here before accepting another job from this board.</div></div>`:`<button id="openContractJournal">My Contracts (${active.length})</button><h3>Available Contracts</h3><div class="contract-board-offers">${offersHTML||'<div class="notice muted">No contracts are available today.</div>'}</div>`));
 if($('#openContractJournal'))$('#openContractJournal').onclick=showContractsJournal;
 document.querySelectorAll('[data-turninquest]').forEach(b=>b.onclick=()=>{const q=state.world.quests.find(x=>x.id===b.dataset.turninquest);if(q)turnInQuest(q,()=>showContractBoard(locId))});
 document.querySelectorAll('[data-contractdetail]').forEach(b=>b.onclick=()=>showContractDetails(b.dataset.contractdetail));
 document.querySelectorAll('[data-acceptquest]').forEach(b=>b.onclick=()=>acceptQuest(b.dataset.acceptquest,locId));wireClose()
}

function journalWidthPreference(){const raw=+localStorage.getItem(SOSText("contracts_contracts_journal.journalWidthPreference.001"))||1080;return clamp(raw,760,Math.max(760,Math.min(1500,window.innerWidth-36)))}
function applyJournalWidth(dlg,width=journalWidthPreference()){if(!dlg||window.innerWidth<1100)return;const d=dlg.querySelector('.dialog');if(d){d.classList.add('journal-resizable-dialog');d.style.width=`${Math.round(width)}px`;d.style.maxWidth=SOSText("contracts_contracts_journal.applyJournalWidth.001")}}
function wireJournalWidth(dlg){const input=dlg?.querySelector('#journalWidthRange');if(!input||window.innerWidth<1100)return;const sync=()=>{const w=+input.value;localStorage.setItem(SOSText("contracts_contracts_journal.wireJournalWidth.001"),String(w));applyJournalWidth(dlg,w);const out=dlg.querySelector('#journalWidthValue');if(out)out.textContent=`${w}px`};input.oninput=sync;sync()}
function showWorldJournal(){modalRouteEnter(SOSText("contracts_contracts_journal.showWorldJournal.001"),Array.from(arguments));
 ensureWorldState();repairEscortContracts();consolidateWorldSystems();const snapshot=worldJournalSnapshot(),active=state.world.quests.filter(q=>q.status==='active'),ready=state.world.quests.filter(q=>q.status==='ready'),tracked=state.world.quests.find(q=>q.id===state.world.trackedQuestId&&['active','ready'].includes(q.status)),stories=activeRegionalStories(),news=(state.world.news||[]).slice(-3).reverse(),signals=interregionalTradeSignals(2),life=worldLifeActivitySummary();
 const journalDlg=overlay(SOSText("contracts_contracts_journal.showWorldJournal.002",journalWidthPreference(),journalWidthPreference(),esc(worldLocation(state.world.location).name),esc(regionDef().name),state.world.day,ready.length,active.length,tracked?` • tracking ${esc(tracked.name)}`:'',stories.length,stories.length===1?'y':'ies',completedRegionalStories().length,life.total,life.total===1?'':'s',life.moves,life.moves===1?'':'s',tracked?`<div class="notice compact"><b>Tracked contract:</b> ${esc(tracked.name)}<br>${esc(contractObjective(tracked))}<br><button id="journalTrackedContract">Open Tracked Contract</button></div>`:'',runtimeJavascriptErrors.length?`<div class="js-error-journal"><b>JavaScript Errors (${runtimeJavascriptErrors.length})</b><br><small>${esc(runtimeJavascriptErrors[runtimeJavascriptErrors.length-1].line)}</small><br><button id="journalJavascriptErrors">Open Error Record</button></div>`:'',(state.world.unlockedRegions||[]).includes('redstone')?sengiaConsequenceSummaryHTML():'',runtimeJavascriptErrors.length,`${worldSituationSummaryHTML(currentWorldRegion())}${signals.length?`<h3>Interregional Trade Signals</h3>${interregionalSignalsHTML(2)}`:''}`,news.map(n=>`<div class="card compact"><b>Day ${n.day}</b><br>${esc(n.text)}</div>`).join('')||'<p class="muted">No major new report.</p>'),true);applyJournalWidth(journalDlg);wireJournalWidth(journalDlg);
 if($('#journalTrackedContract'))$('#journalTrackedContract').onclick=()=>showContractDetails(tracked.id);$('#journalHubContracts').onclick=showContractsJournal;$('#journalHubStories').onclick=showRegionalStoryJournal;$('#journalHubCompanions').onclick=showOpenWorldCompanionMenu;$('#journalHubWorldLife').onclick=showOpenWorldWorldLifeMenu;$('#journalHubRegions').onclick=showOpenWorldRegionMenu;$('#journalHubEconomy').onclick=showEconomyLedger;$('#journalHubExploration').onclick=showOpenWorldExplorationMenu;$('#journalHubHistory').onclick=showWorldHistory;$('#journalHubArchive').onclick=showWorldJournalArchive;if($('#journalJavascriptErrors'))$('#journalJavascriptErrors').onclick=showJavascriptErrorJournal;if($('#journalJavascriptErrorsAlways'))$('#journalJavascriptErrorsAlways').onclick=showJavascriptErrorJournal;wireClose()
}

function showWorldJournalArchive(){modalRouteEnter(SOSText("contracts_contracts_journal.showWorldJournalArchive.001"),Array.from(arguments));
 ensureWorldState();repairEscortContracts();ensurePersonalRequests();const active=state.world.quests.filter(q=>['active','ready'].includes(q.status)),requests=Object.values(state.world.personalRequests).filter(r=>r.status==='active'),known=Object.values(state.world.companions).filter(c=>c.known&&!state.allies.includes(c.id)),news=(state.world.news||[]).slice(-8).reverse();
 const journalDlg=overlay(SOSText("contracts_contracts_journal.showWorldJournalArchive.002",esc(worldRankName()),worldRenownScore(),adventureStoryText(),activeFactionQuestText()||'<p class="muted">No active faction questline.</p>',activeCompanionExplorationQuests().length,activeCompanionExplorationQuests().slice(0,4).map(x=>`<div class="card companion-story-card"><b>${esc(x.m.name)} — ${esc(x.d.title)}</b><p>${esc(companionExplorationObjective(x.id))}</p><button data-compexpjournal="${x.id}">Open Expedition</button></div>`).join(''),activeCompanionStories().map(x=>`<div class="card companion-story-card"><b>${esc(state.party.members[x.id]?.name||'Companion')} — ${esc(x.d.title)}</b><p>${esc(companionStoryObjective(x.id))}</p><button data-compstoryjournal="${x.id}">Open Story</button></div>`).join('')||'<p class="muted">No companion story is currently active.</p>',companionLifeState().sharedEvents.length,companionLifeState().campHistory.length,roadLifeState().queue.length,roadLifeState().history.length?`<div class="card compact"><b>Latest:</b> ${esc(roadLifeState().history[roadLifeState().history.length-1].title)}</div>`:'',requests.map(r=>`<div class="card"><b>${esc(state.party.members[r.companionId]?.name||'Companion')}</b><p>${esc(personalRequestText(r))}</p></div>`).join('')||'<p class="muted">No active personal requests.</p>',active.map(contractCard).join('')||'<p class="muted">No active contracts.</p>',state.world.regionalContractStats.completed||0,discoveredHiddenSites().length,hiddenWorldSites().length,artifactCollectionProgress().found,artifactCollectionProgress().total,roadEncounterVariety().seen.size,roadEncounterVariety().total,recentRoadEventsHTML(),settlementEvidence(state.world.location).slice(-2).map(e=>`<div class="card compact">${esc(e.text)}</div>`).join(''),activeRegionalOpportunities().slice(0,6).map(opportunityMarkerHTML).join('')||'<p class="muted">No major intervention opportunity is active.</p>',(state.world.unlockedRegions||[]).includes('redstone')?`${sengiaConsequenceSummaryHTML()}<button id="journalSengiaConsequences">Sengia Regional Consequences</button>`:'',activeRegionalStories().length,completedRegionalStories().length,activeRegionalStories().slice(0,3).map(a=>`<div class="card compact"><b>${esc(regionalStoryDef(a.id).title)}</b><br>${esc(regionalStoryObjective(a.id))}</div>`).join(''),news.map(n=>`<div class="card compact"><b>Day ${n.day}</b><br><small>${esc(n.text)}</small></div>`).join('')||'<p class="muted">No major regional news yet.</p>',prisonerCount(),state.world.treasureMaps.filter(m=>!m.claimed).length,captiveCompanionEntries().length?`<button id="worldCaptiveCompanions">Open Captive Companions (${captiveCompanionEntries().length})</button>`:'<p class="muted">No recruited companions are currently missing.</p>',known.map(c=>`<div class="stat-row"><span>${esc(allyDef(c.id).name)}${c.trouble?' ⚠':''}</span><b>${esc(worldLocation(c.location).name)}</b></div>`).join('')||'<p class="muted">No current leads.</p>',townLifeState().history.length?`<div class="card compact"><b>Latest local work:</b> ${esc(townLifeState().history[townLifeState().history.length-1].title)} in ${esc(worldLocation(townLifeState().history[townLifeState().history.length-1].locId).name)}</div>`:'',hasWarrant(state.world.location)?`<div class="warning notice compact"><b>Local warrant active:</b> ${localBounty(state.world.location)}g outstanding.</div>`:'',Object.keys(economyState().properties).length,activeInvestments().length,regionalSettlements().filter(l=>politicalStatus(l.id).pending).map(l=>`<div class="warning notice"><b>${esc(l.name)}:</b> ${esc(politicalStatusLabel(l.id))}</div>`).join(''),Object.entries(state.world.factionStanding).map(([k,v])=>`<div class="stat-row"><span>${esc(k)}</span><b>${factionTier(v)} ${v>0?'+':''}${v}</b></div>`).join(''),Object.values(ADVENTURE_SITES).map(s=>{const st=adventureState(s.location);return `<div class="stat-row"><span>${esc(s.name)}</span><b>${adventureProgressText(s)}${st.bossDefeated?' • BOSS DEFEATED':''}</b></div>`}).join('')));
 applyJournalWidth(journalDlg);
 wireContractCards();document.querySelectorAll('[data-openopportunity]').forEach(b=>b.onclick=()=>showRegionalOpportunity(b.dataset.openopportunity));document.querySelectorAll('[data-regionaltravel]').forEach(b=>b.onclick=()=>{closeOverlay();attemptWorldTravel(b.dataset.regionaltravel)});if($('#journalRegionalStories'))$('#journalRegionalStories').onclick=showRegionalStoryJournal;if($('#journalSengiaConsequences'))$('#journalSengiaConsequences').onclick=showSengiaRegionalConsequences;if($('#journalRegionOverview'))$('#journalRegionOverview').onclick=showRegionOverview;if($('#journalRegionalEvidence'))$('#journalRegionalEvidence').onclick=showRegionalEvidence;if($('#journalCompanionExpeditions'))$('#journalCompanionExpeditions').onclick=showCompanionExpeditionJournal;document.querySelectorAll('[data-compexpjournal]').forEach(b=>b.onclick=()=>showCompanionExplorationQuest(b.dataset.compexpjournal));document.querySelectorAll('[data-compstoryjournal]').forEach(b=>b.onclick=()=>showCompanionStory(b.dataset.compstoryjournal));$('#allContracts').onclick=showContractsJournal;$('#worldPrisoners').onclick=showPrisoners;$('#worldHistory').onclick=showWorldHistory;$('#worldTreasureMaps').onclick=showTreasureMaps;if($('#worldCaptiveCompanions'))$('#worldCaptiveCompanions').onclick=showCaptiveCompanions;if($('#journalFactions'))$('#journalFactions').onclick=showFactionOverview;if($('#journalPolitics'))$('#journalPolitics').onclick=showRegionalPolitics;if($('#journalEconomy'))$('#journalEconomy').onclick=showEconomyLedger;if($('#journalLaw'))$('#journalLaw').onclick=showRegionalLaw;if($('#journalTownLife'))$('#journalTownLife').onclick=()=>state.world.settlements[state.world.location]?showTownLife(state.world.location):actionResult(SOSText("contracts_contracts_journal.showWorldJournalArchive.003"),SOSText("contracts_contracts_journal.showWorldJournalArchive.004"),'info',showWorldJournal);if($('#journalRoadLife'))$('#journalRoadLife').onclick=showRoadLife;if($('#roadEncounterCatalogue'))$('#roadEncounterCatalogue').onclick=showRoadEncounterCatalogue;if($('#journalExploration'))$('#journalExploration').onclick=showExplorationJournal;if($('#journalArtifacts'))$('#journalArtifacts').onclick=showArtifactCollection;wireClose()
}

const PROPERTY_DEFS={
 shantium:{name:SOSText("contracts_contracts_journal.showWorldJournalArchive.005"),cost:260,income:[6,15],desc:SOSText("contracts_contracts_journal.showWorldJournalArchive.006"),type:'business'},
 river:{name:SOSText("contracts_contracts_journal.showWorldJournalArchive.007"),cost:230,income:[4,11],desc:SOSText("contracts_contracts_journal.showWorldJournalArchive.008"),type:'warehouse'},
 stonebridge:{name:SOSText("contracts_contracts_journal.showWorldJournalArchive.009"),cost:340,income:[8,20],desc:SOSText("contracts_contracts_journal.showWorldJournalArchive.010"),type:'business'},
 northgate:{name:SOSText("contracts_contracts_journal.showWorldJournalArchive.011"),cost:300,income:[5,14],desc:SOSText("contracts_contracts_journal.showWorldJournalArchive.012"),type:'workshop'},
 southroad:{name:SOSText("contracts_contracts_journal.showWorldJournalArchive.013"),cost:210,income:[4,12],desc:SOSText("contracts_contracts_journal.showWorldJournalArchive.014"),type:'warehouse'},
 redoubt:{name:SOSText("contracts_contracts_journal.showWorldJournalArchive.015"),cost:390,income:[7,18],desc:SOSText("contracts_contracts_journal.showWorldJournalArchive.016"),type:'business'}
};
const REGIONAL_PROJECTS={
 roadfund:{name:SOSText("contracts_contracts_journal.showWorldJournalArchive.017"),cost:180,desc:SOSText("contracts_contracts_journal.showWorldJournalArchive.018"),repeatable:true},
 reliefstock:{name:SOSText("contracts_contracts_journal.showWorldJournalArchive.019"),cost:150,desc:SOSText("contracts_contracts_journal.showWorldJournalArchive.020"),repeatable:true},
 marketworks:{name:SOSText("contracts_contracts_journal.showWorldJournalArchive.021"),cost:220,desc:SOSText("contracts_contracts_journal.showWorldJournalArchive.022"),repeatable:false}
};

function economyState(){ensureWorldState();return state.world.economy}
