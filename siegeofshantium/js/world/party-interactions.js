function guardianHallAffiliatedParty(p){if(!p)return false;if(p.guardianCaravan||p.logisticsShipment||p.guardianAffiliation||p.guardianHallAffiliated)return true;const r=p.travelerId?travelerRegistryState().records[p.travelerId]:null;return !!r?.guardianHallAffiliated}
function ensureGuardianHallPartyRecognition(p){
 if(!guardianHallAffiliatedParty(p))return null;const s=ensurePartySocial(p),r=travelerRecord(p);
 s.familiarity=Math.max(2,s.familiarity||0);s.hallRecognized=true;
 r.guardianHallAffiliated=true;r.guardianHallCordial=true;r.social=r.social||{talks:0,topics:{},firstDay:state.world.day,lastDay:state.world.day,familiarity:0,helped:0};
 r.social.familiarity=Math.max(2,r.social.familiarity||0);r.social.hallRecognized=true;r.lastContactDay=state.world.day;return r
}
function guardianHallPartyRecognitionHTML(p){if(!guardianHallAffiliatedParty(p))return'';return SOSText("world_party_interactions.guardianHallPartyRecognitionHTML.001",esc(p.name))}
function worldPartyDisposition(p){if(p.kind==='bounty')return hasWarrant(p.bountyLocId||state.world.location)?'hostile':'neutral';if(guardianHallAffiliatedParty(p))return'friendly';const standing=state.world.factionStanding[p.faction]||0;if(p.attitude==='hostile')return standing>=8?'wary':'hostile';if(p.attitude==='friendly')return standing<-5?'wary':'friendly';if(p.attitude==='conditional')return standing<-2?'hostile':standing>=5?'friendly':'wary';return standing<-5?'wary':standing>=8?'friendly':'neutral'}

function findRegionalBattleNearPlayer(){
 const region=currentWorldRegion(),me=worldLocation(state.world.location),rows=[];
 for(const c of activeLiveRegionalConflicts()){
  if(c.region!==region)continue;const a=state.world.parties.find(p=>p.id===c.aId),b=state.world.parties.find(p=>p.id===c.bId);if(!a||!b)continue;
  const pos=liveConflictPosition(c),dist=Math.hypot(pos.x-me.x,pos.y-me.y);if(dist<24)rows.push({a,b,c,dist})
 }
 rows.sort((x,y)=>x.dist-y.dist);return rows.length?[rows[0].a,rows[0].b,rows[0].c]:null
}
function showLiveRegionalConflict(id){modalRouteEnter(SOSText("world_party_interactions.showLiveRegionalConflict.001"),Array.from(arguments));
 const c=liveRegionalConflict(id);if(!c)return actionResult(SOSText("world_party_interactions.showLiveRegionalConflict.002"),SOSText("world_party_interactions.showLiveRegionalConflict.003"),'info',renderOpenWorld);
 const a=state.world.parties.find(p=>p.id===c.aId),b=state.world.parties.find(p=>p.id===c.bId);if(!a||!b)return renderOpenWorld();showRegionalBattle(a,b,c)
}
function showRegionalBattle(a,b,c=null){modalRouteEnter(SOSText("world_party_interactions.showRegionalBattle.001"),Array.from(arguments));
 if(c&&!liveRegionalConflict(c.id))return actionResult(SOSText("world_party_interactions.showRegionalBattle.002"),SOSText("world_party_interactions.showRegionalBattle.003"),'info',renderOpenWorld);
 const locId=c?.locId||state.world.location,atBattle=state.world.location===locId,bonusA=c?liveConflictReinforcementBonus(c,'a'):0,bonusB=c?liveConflictReinforcementBonus(c,'b'):0,pair=c?.kind==='guardian_caravan_dispute'?guardianCaravanDisputeParties(c):null;
 if(pair&&!c.escalated){
   overlay(SOSText("world_party_interactions.showRegionalBattle.004",esc(pair.patrol.name),esc(pair.caravan.name),esc(worldLocation(locId).name),atBattle?`<div class="choice-list"><button id="clearCaravanDispute"><b>Clear Up the Misunderstanding</b><small>Identify the caravan, explain its business, and try to get the patrol to stand down.</small></button><button id="submitCaravanInspection"><b>Present Papers & Accept Inspection</b><small>Slower, but the safest way to demonstrate that the caravan is lawful.</small></button><button id="rerouteGuardianCaravan"><b>Order the Caravan to Reroute</b><small>Avoid the confrontation at the cost of about two days.</small></button><button id="defendGuardianCaravan"><b>Prepare to Defend the Caravan</b><small>Escalate to armed resistance if the patrol will not stand down.</small></button></div>`:`<div class="choice-list"><button id="travelBattle">Travel toward the incident near ${esc(worldLocation(locId).name)}</button></div>`));
   if(atBattle){$('#clearCaravanDispute').onclick=()=>resolveGuardianCaravanDispute(c,'explain');$('#submitCaravanInspection').onclick=()=>resolveGuardianCaravanDispute(c,'inspect');$('#rerouteGuardianCaravan').onclick=()=>resolveGuardianCaravanDispute(c,'reroute');$('#defendGuardianCaravan').onclick=()=>{c.escalated=true;c.misunderstanding=false;c.guardianEscalated=true;save();showRegionalBattle(a,b,c)}}
   else $('#travelBattle').onclick=()=>{const travel=worldTravelDays(state.world.location,locId);c.guardianCommitted=true;c.expiresDay=Math.max(c.expiresDay,state.world.day+travel+1);c.guardianCommitDay=state.world.day;save();closeOverlay();attemptWorldTravel(locId)};
   wireClose();return
 }
 overlay(SOSText("world_party_interactions.showRegionalBattle.005",esc(a.name),esc(a.faction),esc(b.name),esc(b.faction),pair?`<div class="warning notice compact"><b>Guardian caravan incident:</b> This clash began when ${esc(pair.patrol.name)} stopped ${esc(pair.caravan.name)}. Fighting the patrol may create local political and legal consequences if the incident is reported.</div>`:'',c?`<div class="warning notice compact"><b>Live regional conflict</b> • near ${esc(worldLocation(locId).name)} • expected to resolve by Day ${c.expiresDay}${bonusA||bonusB?`<br>Reinforcements: ${bonusA?`${esc(a.name)} +${bonusA.toFixed(1)}`:''}${bonusA&&bonusB?' • ':''}${bonusB?`${esc(b.name)} +${bonusB.toFixed(1)}`:''}`:''}</div>`:'',atBattle?`${pair?`<button id="joinCaravan">Defend ${esc(pair.caravan.name)}</button><button id="submitCaravanInspection">Try to Stand Down & Accept Inspection</button>`:`<button id="joinA">Join ${esc(a.name)}</button><button id="joinB">Join ${esc(b.name)}</button>`}<button id="watchBattle">Wait and Watch</button>`:`<button id="travelBattle">Travel toward the battle near ${esc(worldLocation(locId).name)}</button>`));
 if(atBattle){
   if(pair){$('#joinCaravan').onclick=()=>joinRegionalBattle(pair.caravan,pair.patrol,c);$('#submitCaravanInspection').onclick=()=>resolveGuardianCaravanDispute(c,'inspect')}
   else{$('#joinA').onclick=()=>joinRegionalBattle(a,b,c);$('#joinB').onclick=()=>joinRegionalBattle(b,a,c)}
   $('#watchBattle').onclick=()=>{const result=c?resolveLiveRegionalConflict(c):resolvePartyVsParty(a,b);if(c&&pair&&result)applyGuardianCaravanViolenceConsequences(c,{guardianJoined:false,caravanWon:result.winner?.id===pair.caravan.id,patrolWon:result.winner?.id===pair.patrol.id});advanceWorldDays(1,SOSText("world_party_interactions.showRegionalBattle.006"));closeOverlay();renderOpenWorld()}
 }else $('#travelBattle').onclick=()=>{if(c){const travel=worldTravelDays(state.world.location,locId);c.guardianCommitted=true;c.expiresDay=Math.max(c.expiresDay,state.world.day+travel+1);c.guardianCommitDay=state.world.day;save()}closeOverlay();attemptWorldTravel(locId)};
 wireClose()
}
function joinRegionalBattle(ally,enemy,c=null){
 const locId=c?.locId||state.world.location;if(c&&state.world.location!==locId)return actionResult(SOSText("world_party_interactions.joinRegionalBattle.001"),SOSText("world_party_interactions.joinRegionalBattle.002",worldLocation(locId).name),'info',()=>showRegionalBattle(ally,enemy,c));
 if(!c&&!worldPartyAtPlayer(ally)&&!worldPartyAtPlayer(enemy))return actionResult(SOSText("world_party_interactions.joinRegionalBattle.003"),SOSText("world_party_interactions.joinRegionalBattle.004"),'info',renderOpenWorld);
 const pair=c?.kind==='guardian_caravan_dispute'?guardianCaravanDisputeParties(c):null,defendingGuardian=pair&&ally.id===pair.caravan.id&&enemy.id===pair.patrol.id;
 if(!defendingGuardian){state.world.factionStanding[ally.faction]=(state.world.factionStanding[ally.faction]||0)+2;state.world.factionStanding[enemy.faction]=(state.world.factionStanding[enemy.faction]||0)-3;companionReaction(ally.faction,2);companionReaction(enemy.faction,-3)}
 else recordGuardianFactionIncident(locId,pair.patrol.faction,SOSText("world_party_interactions.joinRegionalBattle.005",pair.caravan.name,pair.patrol.name),{severity:2,witnessed:false,kind:'guardian_intervention',incidentId:c?.incidentId||null,actorRefs:['guardian:guardian',pair.caravan.actorRef||`world_party:${pair.caravan.id}`,pair.patrol.actorRef||`world_party:${pair.patrol.id}`]});
 if(c){c.status='guardian_intervened';c.intervenedDay=state.world.day;c.guardianSide=ally.id}
 const gr=makeWorldCombatGroup(enemy);gr.name=SOSText("world_party_interactions.joinRegionalBattle.006",enemy.name,ally.name);gr.worldPartyId=enemy.id;gr.regionalConflictId=c?.id||null;gr.incidentId=c?.incidentId||null;gr.regionalAllyPartyId=ally.id;
 if(defendingGuardian)gr.guardianCaravanIncident={conflictId:c.id,locId,caravanId:pair.caravan.id,patrolId:pair.patrol.id,patrolFaction:pair.patrol.faction};
 SOSServices.combat.launch(gr)
}
function showWorldParty(id){modalRouteEnter(SOSText("world_party_interactions.showWorldParty.001"),Array.from(arguments));
 const p=state.world.parties.find(x=>x.id===id);if(!p)return renderOpenWorld();if(p.kind==='bounty')return handleBountyPartyEncounter(p);const underway=activeEscortQuest();if(underway&&p.id!==underway.partyId)return actionResult(SOSText("world_party_interactions.showWorldParty.002"),SOSText("world_party_interactions.showWorldParty.003",escortCaravan(underway)?.name||'the contracted caravan'),'info',()=>showEscortStatus(underway.id));
 const q=p.questId?activeQuest(p.questId):null;if(guardianHallAffiliatedParty(p))ensureGuardianHallPartyRecognition(p);const d=worldPartyDisposition(p),est=worldPartyTravelEstimate(p),inReach=canEngageWorldParty(p),tracked=state.world.trackedPartyId===p.id,plan=worldPartyInterceptPlan(p);
 if(q?.type==='escort'){
   overlay(SOSText("world_party_interactions.showWorldParty.004",esc(p.name),q.spotContract?'On-the-Spot Escort':'Escort Contract',q.spotContract?esc(p.name):esc(contractIssuerName(q)),esc(contractTargetName(q)),esc(contractObjective(q)),q.escortStage==='rendezvous'&&inReach?'<button id="partyBeginEscort">Begin Escort</button>':'',q.escortStage==='rendezvous'&&!inReach?'<button id="partyPursueEscort">Travel to Caravan</button>':'',q.escortStage==='escorting'?'<button id="partyResumeEscort">Resume Escort</button>':''));
   if($('#partyBeginEscort'))$('#partyBeginEscort').onclick=()=>beginEscortContract(q);if($('#partyPursueEscort'))$('#partyPursueEscort').onclick=()=>attemptWorldTravel(q.origin);if($('#partyResumeEscort'))$('#partyResumeEscort').onclick=()=>showEscortStatus(q.id);$('#partyEscortDetails').onclick=()=>showContractDetails(q.id);$('#worldAvoid').onclick=()=>{closeOverlay();renderOpenWorld()};return
 }
 ensureTravelerGroupIdentity(p);overlay(SOSText("world_party_interactions.showWorldParty.005",esc(p.name),esc(p.faction),esc(d.toUpperCase()),tracked?' • TRACKED':'',`${guardianHallPartyRecognitionHTML(p)}${recurringTravelerText(p)}`,travelerGroupIdentityHTML(p),esc(p.purpose||partyPurpose(p.kind)),esc(worldLocation(p.origin||p.location).name),esc(worldLocation(p.destination).name),esc(est.label),p.kind==='merchant'?`<br><b>Trade cargo:</b> ${p.cargo||0} lots — ${esc(manifestText(p.manifest))}`:'',!inReach?`<div class="notice">Route: ${esc(worldLocation(p.location).name)} → ${esc(worldLocation(p.destination).name)}. ${plan.likely?`An intercept near ${esc(plan.target.name)} looks possible.`:`The Guardian can follow toward ${esc(plan.target.name)} and pick up the trail there.`}</div>`:'',p.questId&&activeQuest(p.questId)?'<div class="warning notice"><b>Contract target.</b></div>':'',inReach&&d==='hostile'?(()=>{const a=worldPartyCombatAssessment(p);return `<div class="${a.gap>0?'warning':'notice'} compact"><b>Preliminary combat assessment: ${esc(a.label)}</b><br>Estimated enemy level ${a.level} • Company level ${state.level}</div>`})():'',inReach&&d==='hostile'?'<button id="worldFight">Engage / Assess</button>':'',inReach&&d!=='hostile'?'<button id="worldTalk">Approach / Talk</button><button id="worldHostile">Take Hostile Action…</button>':'',!inReach?'<button id="worldPursue">Travel / Pursue Party</button>':'',tracked?'Stop Tracking':'Track Party'));
 if($('#worldFight'))$('#worldFight').onclick=()=>showWorldEncounterPlan(p);if($('#worldTalk'))$('#worldTalk').onclick=()=>worldPartyTalk(p);if($('#worldHostile'))$('#worldHostile').onclick=()=>confirmHostileAction(p);if($('#worldPursue'))$('#worldPursue').onclick=()=>pursueWorldParty(p);$('#worldTrack').onclick=()=>{setTrackedWorldParty(tracked?null:p);closeOverlay();renderOpenWorld()};$('#worldAvoid').onclick=()=>{closeOverlay();renderOpenWorld()}
}
function informationOfferCost(p){
 const base=p.kind==='merchant'?12:35;
 return Math.max(5,Math.round(base*(1+Math.max(0,state.world.day-1)*.01)))
}
function paidRoadInformation(p,cost){
 if(p.infoSold)return actionResult(SOSText("world_party_interactions.paidRoadInformation.001"),SOSText("world_party_interactions.paidRoadInformation.002",p.name),'info',renderOpenWorld);
 if(state.gold<cost)return actionResult(SOSText("world_party_interactions.paidRoadInformation.003"),SOSText("world_party_interactions.paidRoadInformation.004",cost),'info',renderOpenWorld);
 pay(state,cost);p.infoSold=true;gainScoutingIntel(1,{type:'road_contact',location:p.location,source:p.name,sourceRef:p.actorRef||`world_party:${p.id}`,summary:SOSText("world_party_interactions.intelGain.001",p.name,worldLocation(p.location).name),reliability:78,precision:'route'});
 const c=chance(.45)?revealCompanionRumor():null;
 const detail=c?SOSText("world_party_interactions.paidRoadInformation.005",allyDef(c.id).name,worldLocation(c.location).name):SOSText("world_party_interactions.paidRoadInformation.006");
 recordWorldHistory(SOSText("world_party_interactions.paidRoadInformation.007",state.name,p.name,cost),'info','encounter');
 save();actionResult(SOSText("world_party_interactions.paidRoadInformation.008"),SOSText("world_party_interactions.paidRoadInformation.009",p.name,detail),'good',renderOpenWorld)
}
function threatenForInformation(p){
 if(!canEngageWorldParty(p))return actionResult(SOSText("world_party_interactions.threatenForInformation.001"),SOSText("world_party_interactions.threatenForInformation.002"),'info',renderOpenWorld);
 const presence=stat(state,'cha'),roll=rnd(1,12)+presence+Math.floor((state.reputation||0)/3),target=p.kind==='merchant'?14:17;
 state.world.factionStanding[p.faction]=(state.world.factionStanding[p.faction]||0)-1;
 state.reputation=Math.max(0,(state.reputation||0)-1);syncTravelerRecord(p,'threat',SOSText("world_party_interactions.threatenForInformation.003"));{const rr=travelerRecord(p);if((rr.social?.familiarity||0)>=3||rr.settledAt)changeLocalReputation(state.world.location,-1,SOSText("world_party_interactions.threatenForInformation.004",p.name))}
 companionReaction(p.faction,-1);
 if(roll>=target){
   p.infoSold=true;gainScoutingIntel(2,{type:'coerced_road_contact',location:p.location,source:p.name,sourceRef:p.actorRef||`world_party:${p.id}`,summary:SOSText("world_party_interactions.intelGain.002",p.name,worldLocation(p.location).name),reliability:66,precision:'route'});
   const c=chance(.55)?revealCompanionRumor():null;
   recordWorldHistory(SOSText("world_party_interactions.threatenForInformation.005",state.name,p.name),'bad','encounter');
   save();return actionResult(SOSText("world_party_interactions.threatenForInformation.006"),SOSText("world_party_interactions.threatenForInformation.007",p.name,c?` They also reveal that ${allyDef(c.id).name} was seen near ${worldLocation(c.location).name}.`:''),'bad',renderOpenWorld)
 }
 state.world.factionStanding[p.faction]=(state.world.factionStanding[p.faction]||0)-1;
 p.attitude='wary';recordWorldHistory(SOSText("world_party_interactions.threatenForInformation.008",state.name,p.name),'bad','encounter');save();
 return actionResult(SOSText("world_party_interactions.threatenForInformation.009"),SOSText("world_party_interactions.threatenForInformation.010",p.name),'bad',renderOpenWorld)
}
function confirmHostileAction(p){
 if(!canEngageWorldParty(p))return actionResult(SOSText("world_party_interactions.confirmHostileAction.001"),SOSText("world_party_interactions.confirmHostileAction.002"),'info',renderOpenWorld);
 const dlg=overlay(SOSText("world_party_interactions.confirmHostileAction.003",esc(p.name),esc(p.faction)));
 $('#confirmRoadAttack').onclick=()=>beginHostileWorldAction(p);$('#cancelRoadAttack').onclick=()=>showWorldParty(p.id)
}
function beginHostileWorldAction(p){
 if(!canEngageWorldParty(p))return actionResult(SOSText("world_party_interactions.beginHostileWorldAction.001"),SOSText("world_party_interactions.beginHostileWorldAction.002"),'info',renderOpenWorld);
 p.attitude='hostile';
 state.world.factionStanding[p.faction]=(state.world.factionStanding[p.faction]||0)-5;
 state.reputation=Math.max(0,(state.reputation||0)-2);
 companionReaction(p.faction,-3);
 syncTravelerRecord(p,'threat',SOSText("world_party_interactions.beginHostileWorldAction.003"));{const rr=travelerRecord(p);if((rr.social?.familiarity||0)>=2||rr.settledAt)changeLocalReputation(state.world.location,-2,SOSText("world_party_interactions.beginHostileWorldAction.004",p.name))}recordWorldHistory(SOSText("world_party_interactions.beginHostileWorldAction.005",state.name,p.name),'bad','encounter');if(!['bandits','raiders'].includes(p.kind))recordCrimeDetailed(p.kind==='merchant'||p.kind==='refugees'?'robbery':'assault',state.world.location,p.faction,{severity:p.kind==='merchant'||p.kind==='refugees'?4:3,desc:SOSText("world_party_interactions.beginHostileWorldAction.006",p.name)});
 log(SOSText("world_party_interactions.beginHostileWorldAction.007",p.name,p.faction),'bad');save();showWorldEncounterPlan(p,true)
}

const PARTY_TALK_TOPICS={
 merchant:[
  ['route',SOSText("world_party_interactions.beginHostileWorldAction.008")],['trade',SOSText("world_party_interactions.beginHostileWorldAction.009")],['destination',SOSText("world_party_interactions.beginHostileWorldAction.010")],['help',SOSText("world_party_interactions.beginHostileWorldAction.011")]
 ],
 mercenary:[
  ['work',SOSText("world_party_interactions.beginHostileWorldAction.012")],['route',SOSText("world_party_interactions.beginHostileWorldAction.013")],['faction',SOSText("world_party_interactions.beginHostileWorldAction.014")],['help',SOSText("world_party_interactions.beginHostileWorldAction.015")]
 ],
 refugees:[
  ['needs',SOSText("world_party_interactions.beginHostileWorldAction.016")],['origin',SOSText("world_party_interactions.beginHostileWorldAction.017")],['destination',SOSText("world_party_interactions.beginHostileWorldAction.018")],['help',SOSText("world_party_interactions.beginHostileWorldAction.019")]
 ],
 coalition:[
  ['route',SOSText("world_party_interactions.beginHostileWorldAction.020")],['faction',SOSText("world_party_interactions.beginHostileWorldAction.021")],['destination',SOSText("world_party_interactions.beginHostileWorldAction.022")],['help',SOSText("world_party_interactions.beginHostileWorldAction.023")]
 ],
 redstone:[
  ['route',SOSText("world_party_interactions.beginHostileWorldAction.024")],['faction',SOSText("world_party_interactions.beginHostileWorldAction.025")],['destination',SOSText("world_party_interactions.beginHostileWorldAction.026")],['help',SOSText("world_party_interactions.beginHostileWorldAction.027")]
 ],
 bluestone:[
  ['route',SOSText("world_party_interactions.beginHostileWorldAction.028")],['faction',SOSText("world_party_interactions.beginHostileWorldAction.029")],['destination',SOSText("world_party_interactions.beginHostileWorldAction.030")],['help',SOSText("world_party_interactions.beginHostileWorldAction.031")]
 ],
 spawn:[
  ['route',SOSText("world_party_interactions.beginHostileWorldAction.032")],['destination',SOSText("world_party_interactions.beginHostileWorldAction.033")],['faction',SOSText("world_party_interactions.beginHostileWorldAction.034")],['help',SOSText("world_party_interactions.beginHostileWorldAction.035")]
 ]
};
function partyTalkTopics(p){const base=[...(PARTY_TALK_TOPICS[p.kind]||[['route',SOSText("world_party_interactions.partyTalkTopics.001")],['destination',SOSText("world_party_interactions.partyTalkTopics.002")],['help',SOSText("world_party_interactions.partyTalkTopics.003")]])];if(ensureTravelerGroupIdentity(p))base.splice(Math.min(2,base.length),0,['people',p.kind==='refugees'?'Ask About Their Family':SOSText("world_party_interactions.partyTalkTopics.004")]);return base}
function ensurePartySocial(p){if(!p.social)p.social={talks:0,topics:{},firstDay:state.world.day,lastDay:state.world.day,familiarity:0,helped:0};if(!p.social.topics)p.social.topics={};if(!p.travelerId)assignTravelerIdentity(p,worldPartyDisplayRegion(p));ensureTravelerGroupIdentity(p);return p.social}
function partyRelationshipLabel(p){const s=ensurePartySocial(p),d=worldPartyDisposition(p);if(s.familiarity>=4)return SOSText("world_party_interactions.partyRelationshipLabel.001");if(s.familiarity>=2)return SOSText("world_party_interactions.partyRelationshipLabel.002");return d==='friendly'?'Friendly':d==='wary'?'Wary':SOSText("world_party_interactions.partyRelationshipLabel.003")}
function partyTalkText(p,topic){
 const loc=worldLocation(p.location||state.world.location),dest=worldLocation(p.destination),origin=worldLocation(p.origin||p.location),ss=settlementState(p.destination);
 if(topic==='people')return travelerPeopleConversationText(p);
 if(topic==='route'){const pressure=routePressure(p.location||p.origin,p.destination);return pressure>=6?SOSText("world_party_interactions.partyTalkText.001",p.name,dest.name):pressure>=3?SOSText("world_party_interactions.partyTalkText.002",p.name,dest.name):SOSText("world_party_interactions.partyTalkText.003",p.name,dest.name)}
 if(topic==='trade')return SOSText("world_party_interactions.partyTalkText.004",p.name,manifestText(p.manifest),dest.name,ss.prosperity<40?'They expect shortages there to keep prices high.':'They expect ordinary bargaining unless conditions change before arrival.');
 if(topic==='destination')return SOSText("world_party_interactions.partyTalkText.005",p.name,dest.name,p.purpose||partyPurpose(p.kind));
 if(topic==='work')return SOSText("world_party_interactions.partyTalkText.006",p.name,String(p.purpose||'road work').toLowerCase());
 if(topic==='faction')return p.kind==='mercenary'?SOSText("world_party_interactions.partyTalkText.007",p.name):SOSText("world_party_interactions.partyTalkText.008",p.name,p.faction,loc.name,factionPresenceTier(factionPresenceAt(loc.id)?.[p.faction]||0).toLowerCase());
 if(topic==='needs')return SOSText("world_party_interactions.partyTalkText.009",p.name,dest.name);
 if(topic==='origin')return SOSText("world_party_interactions.partyTalkText.010",p.name,origin.name);
 if(topic==='help'){const offer=spotContractOffer(p,true);return offer?SOSText("world_party_interactions.partyTalkText.011",p.name):SOSText("world_party_interactions.partyTalkText.012",p.name)}
 return SOSText("world_party_interactions.partyTalkText.013",p.name)
}
function discussWorldPartyTopic(p,topic){
 if(!canEngageWorldParty(p))return actionResult(SOSText("world_party_interactions.discussWorldPartyTopic.001"),SOSText("world_party_interactions.discussWorldPartyTopic.002"),'info',renderOpenWorld);
 const s=ensurePartySocial(p),prior=s.topics[topic]||0;s.topics[topic]=prior+1;s.talks++;s.lastDay=state.world.day;if(!prior)s.familiarity=Math.min(6,s.familiarity+1);
 syncTravelerRecord(p);ensureTravelerGroupIdentity(p);const text=partyTalkText(p,topic);syncTravelerRecord(p,'meeting',topic);recordWorldHistory(SOSText("world_party_interactions.discussWorldPartyTopic.003",state.name,p.name,text),'info',SOSText("world_party_interactions.discussWorldPartyTopic.004"));save();
 actionResult(prior?'Continuing the Conversation':SOSText("world_party_interactions.discussWorldPartyTopic.005"),`${text}${prior?'\n\nYou have discussed this subject with them before.':''}`,'info',()=>showFriendlyPartyInteraction(p))
}
function partyAidCost(p){return p.kind==='refugees'?12:p.kind==='merchant'?8:10}
function giveWorldPartyAid(p){
 if(!canEngageWorldParty(p))return actionResult(SOSText("world_party_interactions.giveWorldPartyAid.001"),SOSText("world_party_interactions.giveWorldPartyAid.002"),'info',renderOpenWorld);const cost=partyAidCost(p);
 if(state.gold<cost)return actionResult(SOSText("world_party_interactions.giveWorldPartyAid.003"),SOSText("world_party_interactions.giveWorldPartyAid.004",cost),'info',()=>showFriendlyPartyInteraction(p));
 pay(state,cost);const s=ensurePartySocial(p);s.helped++;s.familiarity=Math.min(6,s.familiarity+1);syncTravelerRecord(p);ensureTravelerGroupIdentity(p);state.reputation++;state.world.factionStanding[p.faction]=(state.world.factionStanding[p.faction]||0)+1;
 syncTravelerRecord(p,'help',SOSText("world_party_interactions.giveWorldPartyAid.005",cost));maybeGrantTravelerFavor(p,SOSText("world_party_interactions.giveWorldPartyAid.006"));recordWorldHistory(SOSText("world_party_interactions.giveWorldPartyAid.007",state.name,cost,p.name),'good',SOSText("world_party_interactions.giveWorldPartyAid.008"));save();actionResult(SOSText("world_party_interactions.giveWorldPartyAid.009"),SOSText("world_party_interactions.giveWorldPartyAid.010",p.name),'good',()=>showFriendlyPartyInteraction(p))
}
function shareRoadInformation(p){
 if(!canEngageWorldParty(p))return actionResult(SOSText("world_party_interactions.shareRoadInformation.001"),SOSText("world_party_interactions.shareRoadInformation.002"),'info',renderOpenWorld);const s=ensurePartySocial(p);s.familiarity=Math.min(6,s.familiarity+1);syncTravelerRecord(p);ensureTravelerGroupIdentity(p);gainScoutingIntel(1,{type:'shared_road_report',location:p.location,source:p.name,sourceRef:p.actorRef||`world_party:${p.id}`,summary:SOSText("world_party_interactions.intelGain.003",p.name),reliability:74,precision:'route'});
 syncTravelerRecord(p,'meeting',SOSText("world_party_interactions.shareRoadInformation.003"));recordWorldHistory(SOSText("world_party_interactions.shareRoadInformation.004",state.name,p.name),'info',SOSText("world_party_interactions.shareRoadInformation.005"));save();actionResult(SOSText("world_party_interactions.shareRoadInformation.006"),SOSText("world_party_interactions.shareRoadInformation.007"),'good',()=>showFriendlyPartyInteraction(p))
}
function partySpotContractEligible(p){
 if(!p||!canEngageWorldParty(p)||worldPartyDisposition(p)==='hostile'||p.questId||p.contractProtected)return false;
 if(state.world.quests.filter(x=>['active','ready'].includes(x.status)).length>=4)return false;
 if(p.spotContractDeclinedDay===state.world.day||p.spotContractCompleted)return false;
 return ['merchant','mercenary','refugees','coalition','redstone','bluestone','spawn'].includes(p.kind)
}
function spotContractOffer(p,fromHelp=false){
 if(!partySpotContractEligible(p))return null;
 if(p.spotContractOffer&&p.spotContractOffer.status==='offered')return p.spotContractOffer;
 const social=ensurePartySocial(p),problem=settlementProblem(p.destination),pressure=routePressure(p.location||p.origin,p.destination),roll=(fromHelp?.46:.24)+(social.familiarity*.05)+(pressure>=4?.12:0)+(problem?.type==='shortage'?.08:0);
 if(!fromHelp&&!chance(clamp(roll,.18,.65)))return null;
 let type,title,desc,reward,due=state.world.day+Math.max(4,worldTravelDays(p.location||p.origin,p.destination)+3);
 if(p.kind==='merchant'){
   if(pressure>=3||chance(.62)){type='escort';title=SOSText("world_party_interactions.spotContractOffer.001");desc=SOSText("world_party_interactions.spotContractOffer.002",p.name,worldLocation(p.destination).name);reward=75+worldTravelDays(p.location||p.origin,p.destination)*18}
   else{type='aid';title=SOSText("world_party_interactions.spotContractOffer.003");desc=SOSText("world_party_interactions.spotContractOffer.004",p.name);reward=45}
 }else if(p.kind==='refugees'){
   if(pressure>=3||chance(.5)){type='escort';title=SOSText("world_party_interactions.spotContractOffer.005");desc=SOSText("world_party_interactions.spotContractOffer.006",p.name,worldLocation(p.destination).name);reward=45+worldTravelDays(p.location||p.origin,p.destination)*12}
   else{type='aid';title=SOSText("world_party_interactions.spotContractOffer.007");desc=SOSText("world_party_interactions.spotContractOffer.008",p.name);reward=35}
 }else if(['coalition','redstone','bluestone'].includes(p.kind)){
   if(pressure>=4||chance(.55)){type='security';title=SOSText("world_party_interactions.spotContractOffer.009");desc=SOSText("world_party_interactions.spotContractOffer.010",p.name);reward=65}
   else{type='delivery';title=SOSText("world_party_interactions.spotContractOffer.011");desc=SOSText("world_party_interactions.spotContractOffer.012",p.name,worldLocation(p.destination).name);reward=60}
 }else if(p.kind==='mercenary'){
   if(pressure>=4||chance(.55)){type='security';title=SOSText("world_party_interactions.spotContractOffer.013");desc=SOSText("world_party_interactions.spotContractOffer.014",p.name);reward=70}
   else{type='escort';title=SOSText("world_party_interactions.spotContractOffer.015");desc=SOSText("world_party_interactions.spotContractOffer.016",p.name,worldLocation(p.destination).name);reward=80+worldTravelDays(p.location||p.origin,p.destination)*12}
 }else{
   type=chance(.5)?'aid':'delivery';title=type==='aid'?'Traveler Assistance':SOSText("world_party_interactions.spotContractOffer.017");desc=type==='aid'?SOSText("world_party_interactions.spotContractOffer.018",p.name):SOSText("world_party_interactions.spotContractOffer.019",p.name,worldLocation(p.destination).name);reward=40
 }
 p.spotContractOffer={id:`spot_${uid()}`,status:'offered',type,title,desc,reward,dueDay:due,createdDay:state.world.day,partyId:p.id,origin:p.location||p.origin,target:p.destination,faction:p.faction};
 return p.spotContractOffer
}
function maybeOfferSpotContract(p){
 const o=spotContractOffer(p,false);if(!o)return false;showSpotContractOffer(p,o);return true
}
function showSpotContractOffer(p,o=p?.spotContractOffer){modalRouteEnter(SOSText("world_party_interactions.showSpotContractOffer.001"),Array.from(arguments));
 if(!p||!o||o.status!=='offered')return showFriendlyPartyInteraction(p);
 const escort=o.type==='escort',preview={...o,type:o.type==='security'||o.type==='aid'?'spotservice':o.type,origin:p.location||p.origin,target:o.target||p.destination,faction:p.faction,spotContract:true,spotIssuerFaction:p.faction,escortPartyName:p.name};if(o.paymentMode){preview.paymentMode=o.paymentMode;preview.paymentLocation=o.paymentLocation;preview.paymentPayer=o.paymentPayer;preview.paymentExplanation=o.paymentExplanation}else{ensureContractPaymentTerms(preview);o.paymentMode=preview.paymentMode;o.paymentLocation=preview.paymentLocation;o.paymentPayer=preview.paymentPayer;o.paymentExplanation=preview.paymentExplanation}
 overlay(SOSText("world_party_interactions.showSpotContractOffer.004",esc(p.name),esc(o.title),esc(o.desc),o.reward,esc(preview.paymentExplanation),o.dueDay),true);
 $('#spotAccept').onclick=()=>acceptSpotContract(p,o);$('#spotDecline').onclick=()=>{o.status='declined';p.spotContractDeclinedDay=state.world.day;save();actionResult(SOSText("world_party_interactions.showSpotContractOffer.005"),SOSText("world_party_interactions.showSpotContractOffer.006",p.name),'info',()=>showFriendlyPartyInteraction(p))};$('#spotBack').onclick=()=>showFriendlyPartyInteraction(p)
}
function acceptSpotContract(p,o){
 if(!partySpotContractEligible(p)||!o||o.status!=='offered')return actionResult(SOSText("world_party_interactions.acceptSpotContract.001"),SOSText("world_party_interactions.acceptSpotContract.002"),'info',()=>showFriendlyPartyInteraction(p));
 const q={id:o.id,type:o.type==='security'||o.type==='aid'?'spotservice':o.type,name:o.title,origin:p.location||p.origin,target:o.target||p.destination,desc:o.desc,acceptedDay:state.world.day,dueDay:o.dueDay,reward:o.reward,status:'active',faction:p.faction,partyId:p.id,spotContract:true,spotService:o.type,spotIssuerPartyId:p.id,spotIssuerTravelerId:p.travelerId||null,spotIssuerName:p.name,spotIssuerKind:p.kind,spotIssuerFaction:p.faction,spotIssuerPurpose:p.purpose,chainKey:`spot:${p.id}`,chainStage:0,followup:false};
 q.crossRegion=!!o.crossRegion||isCrossRegionRoute(q.origin,q.target);q.interregional=q.crossRegion;if(q.crossRegion){q.routePlan=crossRegionRoutePlan(q.origin,q.target);q.routeSummary=interregionalRouteSummary(q.origin,q.target)}if(o.paymentMode){q.paymentMode=o.paymentMode;q.paymentLocation=o.paymentLocation;q.paymentPayer=o.paymentPayer;q.paymentExplanation=o.paymentExplanation}else assignContractPaymentTerms(q,{spot:true});p.questId=q.id;p.contractProtected=true;p.contractRole=o.type==='escort'?'escort':'spot';p.contractExpiresDay=q.dueDay;o.status='accepted';
 if(o.type==='escort'){q.escortKind=p.kind;q.escortPartyName=p.name;q.escortStage='rendezvous';q.escortTotalDays=Math.max(1,worldTravelDays(q.origin,q.target));q.escortRemainingDays=q.escortTotalDays;q.escortDaysTraveled=0;q.attacksDefended=0;p.escortWaiting=true;p.escortActive=false;p.location=q.origin;p.destination=q.target;p.travelLeft=q.escortTotalDays}
 state.world.quests.push(q);state.world.trackedQuestId=q.id;state.world.trackedPartyId=p.id;syncTravelerRecord(p,'contract',q.name);log(SOSText("world_party_interactions.acceptSpotContract.003",p.name,q.name),'good');recordWorldHistory(SOSText("world_party_interactions.acceptSpotContract.004",p.name,q.name),'good',SOSText("world_party_interactions.acceptSpotContract.005"));save();
 actionResult(SOSText("world_party_interactions.acceptSpotContract.006"),SOSText("world_party_interactions.acceptSpotContract.007",q.name,q.desc,contractPaymentSummary(q),q.type==='delivery'&&q.spotContract?'The moving issuer only needs to remain available until the message is delivered; the payment arrangement remains valid afterward.':'The issuing group will remain available while the contract still depends on them.',q.dueDay,q.reward),'good',()=>showContractDetails(q.id))
}
function resolveSpotService(q){
 const p=rawContractParty(q);if(!q||q.type!=='spotservice'||q.status!=='active'||!p)return showContractDetails(q?.id);
 if(!canEngageWorldParty(p))return actionResult(SOSText("world_party_interactions.resolveSpotService.001"),SOSText("world_party_interactions.resolveSpotService.002",p.name),'info',()=>showContractDetails(q.id));
 if(q.spotService==='aid'){const cost=12;if(state.gold<cost)return actionResult(SOSText("world_party_interactions.resolveSpotService.003"),SOSText("world_party_interactions.resolveSpotService.004",cost),'info',()=>showContractDetails(q.id));pay(state,cost);q.branch=SOSText("world_party_interactions.resolveSpotService.005",cost);ensurePartySocial(p).helped++}
 else{advanceWorldDays(1,SOSText("world_party_interactions.resolveSpotService.006",p.name));settlementState(p.destination).security=Math.min(100,settlementState(p.destination).security+2);q.branch=SOSText("world_party_interactions.resolveSpotService.007")}
 markQuestReady(q);showContractDetails(q.id)
}
function finishSpotPartyContract(q){
 if(!q?.spotContract)return;const p=rawContractParty(q),r=q.spotIssuerTravelerId?travelerRegistryState().records[q.spotIssuerTravelerId]:p?travelerRecord(p):null,name=r?.name||q.spotIssuerName||p?.name||SOSText("world_party_interactions.finishSpotPartyContract.001");
 if(p){syncTravelerRecord(p,'completed',q.name);p.contractProtected=false;p.contractRole=null;p.questId=null;p.contractExpiresDay=null;p.escortWaiting=false;p.escortActive=false;p.spotContractCompleted=true}
 else if(r){r.contractsCompleted=(r.contractsCompleted||0)+1;r.history=r.history||[];r.history.push({day:state.world.day,event:'completed',detail:SOSText("world_party_interactions.finishSpotPartyContract.002",q.name),region:locationRegion(state.world.location)});r.history=r.history.slice(-20)}
 if(r?.settledAt)changeLocalReputation(r.settledAt,1,SOSText("world_party_interactions.finishSpotPartyContract.003",name));
 SOSServices.companions.noteSharedEvent('road_contact',SOSText("world_party_interactions.finishSpotPartyContract.004",name,q.name));
 if(p)maybeGrantTravelerFavor(p,SOSText("world_party_interactions.finishSpotPartyContract.005",q.name));else if(r&&travelerFavorState(r)<3&&(r.contractsCompleted||0)>=2)r.favors=(r.favors||0)+1
}
function showFriendlyPartyInteraction(p){modalRouteEnter(SOSText("world_party_interactions.showFriendlyPartyInteraction.001"),Array.from(arguments));
 if(!canEngageWorldParty(p))return actionResult(SOSText("world_party_interactions.showFriendlyPartyInteraction.002"),SOSText("world_party_interactions.showFriendlyPartyInteraction.003"),'info',renderOpenWorld);
 const d=worldPartyDisposition(p),s=ensurePartySocial(p),topics=partyTalkTopics(p),offer=interregionalSpotContractOffer(p)||spotContractOffer(p,false),info=['merchant','mercenary'].includes(p.kind);
 if(guardianHallAffiliatedParty(p))ensureGuardianHallPartyRecognition(p);syncTravelerRecord(p,'meeting',SOSText("world_party_interactions.showFriendlyPartyInteraction.004"));ensureTravelerGroupIdentity(p);recognizeTravelerWithCompanions(p);overlay(SOSText("world_party_interactions.showFriendlyPartyInteraction.005",esc(p.name),`${guardianHallPartyRecognitionHTML(p)}${recurringTravelerText(p)}`,travelerGroupIdentityHTML(p),esc(p.faction),esc(partyRelationshipLabel(p)),esc(p.purpose||partyPurpose(p.kind)),esc(worldLocation(p.destination).name),s.talks?`<p class="muted compact">You have spoken with this party ${s.talks} time${s.talks===1?'':'s'} about ${Object.keys(s.topics).length} subject${Object.keys(s.topics).length===1?'':'s'}.</p>`:'',topics.map(([id,label])=>`<button data-partytopic="${id}">${esc(label)}${s.topics[id]?` <small>• discussed ${s.topics[id]}×</small>`:''}</button>`).join(''),partyAidCost(p),info?'<button id="partyInfoBusiness">Ask About Information for Sale</button>':'',offer?`<button id="partySpotOffer"><b>Hear Their Job Offer</b><br><small>${esc(offer.title)}</small></button>`:''),true);
 document.querySelectorAll('[data-partytopic]').forEach(b=>b.onclick=()=>discussWorldPartyTopic(p,b.dataset.partytopic));$('#partyShareInfo').onclick=()=>shareRoadInformation(p);$('#partyAid').onclick=()=>giveWorldPartyAid(p);if($('#partyInfoBusiness'))$('#partyInfoBusiness').onclick=()=>showInformationPartyInteraction(p);if($('#partySpotOffer'))$('#partySpotOffer').onclick=()=>showSpotContractOffer(p,offer);$('#partyTalkBack').onclick=()=>showWorldParty(p.id)
if($('#partyAskKnownGroup'))$('#partyAskKnownGroup').onclick=()=>showTravelerInquiryPicker('party',p,()=>showFriendlyPartyInteraction(p));}
function showInformationPartyInteraction(p){modalRouteEnter(SOSText("world_party_interactions.showInformationPartyInteraction.001"),Array.from(arguments));
 if(!canEngageWorldParty(p))return actionResult(SOSText("world_party_interactions.showInformationPartyInteraction.002"),SOSText("world_party_interactions.showInformationPartyInteraction.003"),'info',renderOpenWorld);
 const cost=informationOfferCost(p),merchant=p.kind==='merchant',already=!!p.infoSold;
 overlay(SOSText("world_party_interactions.showInformationPartyInteraction.004",esc(p.name),merchant?'The caravan has heard a great deal on the road, but information is part of its business.':'The free company is willing to sell what it knows about movements in the region.',cost,already?' • already purchased from this party':'',already||state.gold<cost?'disabled':'',cost,already?'disabled':''));
 $('#buyRoadInfo').onclick=()=>paidRoadInformation(p,cost);
 $('#declineRoadInfo').onclick=()=>{recordWorldHistory(SOSText("world_party_interactions.showInformationPartyInteraction.005",state.name,p.name),'info','encounter');save();actionResult(SOSText("world_party_interactions.showInformationPartyInteraction.006"),SOSText("world_party_interactions.showInformationPartyInteraction.007"),'info',renderOpenWorld)};
 $('#threatenRoadInfo').onclick=()=>threatenForInformation(p);
 $('#hostileRoadAction').onclick=()=>confirmHostileAction(p);
 $('#roadInfoBack').onclick=()=>showWorldParty(p.id)
}
function worldPartyTalk(p){
 if(!canEngageWorldParty(p)){const est=worldPartyTravelEstimate(p);return actionResult(SOSText("world_party_interactions.worldPartyTalk.001"),SOSText("world_party_interactions.worldPartyTalk.002",p.name,est.label.toLowerCase()),'info',renderOpenWorld)}
 ensurePartySocial(p);
 if(currentWorldRegion()==='redstone'&&p.kind==='redstone'&&!activeSengiaAuthorityCase(state.world.location)&&chance(.22)){generateSengiaAuthorityCase(state.world.location,true);return actionResult(SOSText("world_party_interactions.worldPartyTalk.003"),SOSText("world_party_interactions.worldPartyTalk.004",p.name),'info',()=>showSengiaAuthority(state.world.location))}
 if(currentWorldRegion()==='redstone'&&p.kind==='redstone'&&chance(.18)){return actionResult(SOSText("world_party_interactions.worldPartyTalk.005"),SOSText("world_party_interactions.worldPartyTalk.006",p.name,worldLocation(state.world.location).name,sengiaSecurityCondition(state.world.location).toLowerCase(),sengiaSecurityAdvice(state.world.location)),'info',()=>showSengiaSecurity(state.world.location))}
 if(maybeOfferSpotContract(p))return;showFriendlyPartyInteraction(p)
}
function openWorldEnemyPool(p,level){
 const tier=level<=3?0:level<=6?1:2,lists={
  bandits:[
   [SOSText("world_party_interactions.openWorldEnemyPool.001"),SOSText("world_party_interactions.openWorldEnemyPool.002"),SOSText("world_party_interactions.openWorldEnemyPool.003"),SOSText("world_party_interactions.openWorldEnemyPool.004"),SOSText("world_party_interactions.openWorldEnemyPool.005")],
   [SOSText("world_party_interactions.openWorldEnemyPool.006"),SOSText("world_party_interactions.openWorldEnemyPool.007"),SOSText("world_party_interactions.openWorldEnemyPool.008"),SOSText("world_party_interactions.openWorldEnemyPool.009"),SOSText("world_party_interactions.openWorldEnemyPool.010"),SOSText("world_party_interactions.openWorldEnemyPool.011"),SOSText("world_party_interactions.openWorldEnemyPool.012"),SOSText("world_party_interactions.openWorldEnemyPool.013"),SOSText("world_party_interactions.openWorldEnemyPool.014")],
   [SOSText("world_party_interactions.openWorldEnemyPool.015"),SOSText("world_party_interactions.openWorldEnemyPool.016"),SOSText("world_party_interactions.openWorldEnemyPool.017"),SOSText("world_party_interactions.openWorldEnemyPool.018"),SOSText("world_party_interactions.openWorldEnemyPool.019"),SOSText("world_party_interactions.openWorldEnemyPool.020"),SOSText("world_party_interactions.openWorldEnemyPool.021"),SOSText("world_party_interactions.openWorldEnemyPool.022"),SOSText("world_party_interactions.openWorldEnemyPool.023")]],
  raiders:[
   [SOSText("world_party_interactions.openWorldEnemyPool.024"),SOSText("world_party_interactions.openWorldEnemyPool.025"),SOSText("world_party_interactions.openWorldEnemyPool.026"),SOSText("world_party_interactions.openWorldEnemyPool.027"),SOSText("world_party_interactions.openWorldEnemyPool.028")],
   [SOSText("world_party_interactions.openWorldEnemyPool.029"),SOSText("world_party_interactions.openWorldEnemyPool.030"),SOSText("world_party_interactions.openWorldEnemyPool.031"),SOSText("world_party_interactions.openWorldEnemyPool.032"),SOSText("world_party_interactions.openWorldEnemyPool.033"),SOSText("world_party_interactions.openWorldEnemyPool.034"),SOSText("world_party_interactions.openWorldEnemyPool.035")],
   [SOSText("world_party_interactions.openWorldEnemyPool.036"),SOSText("world_party_interactions.openWorldEnemyPool.037"),SOSText("world_party_interactions.openWorldEnemyPool.038"),SOSText("world_party_interactions.openWorldEnemyPool.039"),SOSText("world_party_interactions.openWorldEnemyPool.040"),SOSText("world_party_interactions.openWorldEnemyPool.041"),SOSText("world_party_interactions.openWorldEnemyPool.042"),SOSText("world_party_interactions.openWorldEnemyPool.043")]],
  mercenary:[
   [SOSText("world_party_interactions.openWorldEnemyPool.044"),SOSText("world_party_interactions.openWorldEnemyPool.045"),SOSText("world_party_interactions.openWorldEnemyPool.046")],
   [SOSText("world_party_interactions.openWorldEnemyPool.047"),SOSText("world_party_interactions.openWorldEnemyPool.048"),SOSText("world_party_interactions.openWorldEnemyPool.049"),SOSText("world_party_interactions.openWorldEnemyPool.050"),SOSText("world_party_interactions.openWorldEnemyPool.051"),SOSText("world_party_interactions.openWorldEnemyPool.052")],
   [SOSText("world_party_interactions.openWorldEnemyPool.053"),SOSText("world_party_interactions.openWorldEnemyPool.054"),SOSText("world_party_interactions.openWorldEnemyPool.055"),SOSText("world_party_interactions.openWorldEnemyPool.056"),SOSText("world_party_interactions.openWorldEnemyPool.057"),SOSText("world_party_interactions.openWorldEnemyPool.058"),SOSText("world_party_interactions.openWorldEnemyPool.059"),SOSText("world_party_interactions.openWorldEnemyPool.060")]],
  redstone:[
   [SOSText("world_party_interactions.openWorldEnemyPool.061"),SOSText("world_party_interactions.openWorldEnemyPool.062"),SOSText("world_party_interactions.openWorldEnemyPool.063")],
   [SOSText("world_party_interactions.openWorldEnemyPool.064"),SOSText("world_party_interactions.openWorldEnemyPool.065"),SOSText("world_party_interactions.openWorldEnemyPool.066"),SOSText("world_party_interactions.openWorldEnemyPool.067"),SOSText("world_party_interactions.openWorldEnemyPool.068"),SOSText("world_party_interactions.openWorldEnemyPool.069")],
   [SOSText("world_party_interactions.openWorldEnemyPool.070"),SOSText("world_party_interactions.openWorldEnemyPool.071"),SOSText("world_party_interactions.openWorldEnemyPool.072"),SOSText("world_party_interactions.openWorldEnemyPool.073"),SOSText("world_party_interactions.openWorldEnemyPool.074"),SOSText("world_party_interactions.openWorldEnemyPool.075"),SOSText("world_party_interactions.openWorldEnemyPool.076")]],
  bluestone:[
   [SOSText("world_party_interactions.openWorldEnemyPool.077"),SOSText("world_party_interactions.openWorldEnemyPool.078"),SOSText("world_party_interactions.openWorldEnemyPool.079")],
   [SOSText("world_party_interactions.openWorldEnemyPool.080"),SOSText("world_party_interactions.openWorldEnemyPool.081"),SOSText("world_party_interactions.openWorldEnemyPool.082"),SOSText("world_party_interactions.openWorldEnemyPool.083"),SOSText("world_party_interactions.openWorldEnemyPool.084"),SOSText("world_party_interactions.openWorldEnemyPool.085")],
   [SOSText("world_party_interactions.openWorldEnemyPool.086"),SOSText("world_party_interactions.openWorldEnemyPool.087"),SOSText("world_party_interactions.openWorldEnemyPool.088"),SOSText("world_party_interactions.openWorldEnemyPool.089"),SOSText("world_party_interactions.openWorldEnemyPool.090"),SOSText("world_party_interactions.openWorldEnemyPool.091"),SOSText("world_party_interactions.openWorldEnemyPool.092")]],
  coalition:[
   [SOSText("world_party_interactions.openWorldEnemyPool.093"),SOSText("world_party_interactions.openWorldEnemyPool.094"),SOSText("world_party_interactions.openWorldEnemyPool.095")],
   [SOSText("world_party_interactions.openWorldEnemyPool.096"),SOSText("world_party_interactions.openWorldEnemyPool.097"),SOSText("world_party_interactions.openWorldEnemyPool.098"),SOSText("world_party_interactions.openWorldEnemyPool.099"),SOSText("world_party_interactions.openWorldEnemyPool.100"),SOSText("world_party_interactions.openWorldEnemyPool.101")],
   [SOSText("world_party_interactions.openWorldEnemyPool.102"),SOSText("world_party_interactions.openWorldEnemyPool.103"),SOSText("world_party_interactions.openWorldEnemyPool.104"),SOSText("world_party_interactions.openWorldEnemyPool.105"),SOSText("world_party_interactions.openWorldEnemyPool.106"),SOSText("world_party_interactions.openWorldEnemyPool.107")]],
  spawn:[
   [SOSText("world_party_interactions.openWorldEnemyPool.108"),SOSText("world_party_interactions.openWorldEnemyPool.109"),SOSText("world_party_interactions.openWorldEnemyPool.110")],
   [SOSText("world_party_interactions.openWorldEnemyPool.111"),SOSText("world_party_interactions.openWorldEnemyPool.112"),SOSText("world_party_interactions.openWorldEnemyPool.113"),SOSText("world_party_interactions.openWorldEnemyPool.114")],
   [SOSText("world_party_interactions.openWorldEnemyPool.115"),SOSText("world_party_interactions.openWorldEnemyPool.116"),SOSText("world_party_interactions.openWorldEnemyPool.117"),SOSText("world_party_interactions.openWorldEnemyPool.118"),SOSText("world_party_interactions.openWorldEnemyPool.119")]],
  merchant:[
   [SOSText("world_party_interactions.openWorldEnemyPool.120"),SOSText("world_party_interactions.openWorldEnemyPool.121"),SOSText("world_party_interactions.openWorldEnemyPool.122")],
   [SOSText("world_party_interactions.openWorldEnemyPool.123"),SOSText("world_party_interactions.openWorldEnemyPool.124"),SOSText("world_party_interactions.openWorldEnemyPool.125"),SOSText("world_party_interactions.openWorldEnemyPool.126")],
   [SOSText("world_party_interactions.openWorldEnemyPool.127"),SOSText("world_party_interactions.openWorldEnemyPool.128"),SOSText("world_party_interactions.openWorldEnemyPool.129"),SOSText("world_party_interactions.openWorldEnemyPool.130")]],
  refugees:[
   [SOSText("world_party_interactions.openWorldEnemyPool.131"),SOSText("world_party_interactions.openWorldEnemyPool.132")],
   [SOSText("world_party_interactions.openWorldEnemyPool.133"),SOSText("world_party_interactions.openWorldEnemyPool.134"),SOSText("world_party_interactions.openWorldEnemyPool.135")],
   [SOSText("world_party_interactions.openWorldEnemyPool.136"),SOSText("world_party_interactions.openWorldEnemyPool.137"),SOSText("world_party_interactions.openWorldEnemyPool.138")]]
 };
 const names=(lists[p?.kind]||lists.bandits)[tier],pool=names.map(enemyByName).filter(Boolean);return pool.length?pool:ENEMIES.slice(0,12)
}
function openWorldGuardianCombatRating(){
 const hit=clamp(accuracy(),25,97)/100,w=weapon(),dmg=Math.max(4,(w.damage||6)+stat(state,'str')*.45+2+guardianClassBonus().damage);
 return maxHP()+defense()*5+dmg*6*hit+maxStamina()*.15
}
function openWorldAllyCombatRating(m){
 const hit=clamp(allyAccuracy(m),25,97)/100,w=allyWeapon(m),dmg=Math.max(4,(w.damage||6)+allyStat(m,'str')*.45+2+allyClassBonus(m).damage+companionBonuses(m).damage);
 return allyMaxHP(m)+allyDefense(m)*5+dmg*6*hit+allyMaxStamina(m)*.15
}
function openWorldCompanyCombatRating(){return Math.max(120,openWorldGuardianCombatRating()+partyMembers(true).reduce((n,m)=>n+openWorldAllyCombatRating(m),0))}
function openWorldEnemyCombatRating(e){
 const hit=clamp(e.acc||60,25,97)/100,trait={commander:20,elite:18,assassin:16,mage:14,healer:13,shield:12,stone:16,regen:15,brute:12,duelist:16,charger:13,engineer:12}[e.trait]||6;
 return (e.maxHp||e.hp||20)+(e.damage||5)*6*hit+(e.acc||60)*.35+(e.init||5)*1.4+trait
}
function openWorldEnemyGroupRating(members){return members.reduce((n,e)=>n+openWorldEnemyCombatRating(e),0)}
function tuneOpenWorldEnemyGroup(members,targetPower,levelGap){
 let rating=openWorldEnemyGroupRating(members);if(!rating)return members;
 const factor=clamp(Math.sqrt(targetPower/rating),.88,1.24),hpFactor=factor,dmgFactor=clamp(1+(factor-1)*.58,.92,1.14),accShift=levelGap>0?levelGap*2:levelGap<0?levelGap:0;
 for(const e of members){e.maxHp=e.hp=Math.max(8,Math.round(e.maxHp*hpFactor));e.damage=Math.max(3,Math.round(e.damage*dmgFactor));e.acc=clamp(Math.round(e.acc+accShift),45,92)}
 return members
}

function travelerNamedCombatBase(p,m,pool=[]){
 const role=String(m?.role||'').toLowerCase(),find=(words)=>pool.find(e=>words.some(w=>String(e?.name||'').toLowerCase().includes(w)))||null;
 if(role.includes('archer'))return find(['archer','bow'])||pool[0]||ENEMIES[0];
 if(role.includes('crossbow')||role.includes('arbal'))return find(['crossbow','arbal'])||pool[0]||ENEMIES[0];
 if(role.includes('medic')||role.includes('healer'))return find(['medic','healer'])||pool[0]||ENEMIES[0];
 if(role.includes('captain')||role.includes('sergeant')||role.includes('leader'))return find(['captain','sergeant','veteran','commander'])||pool[0]||ENEMIES[0];
 if(role.includes('guard')||role.includes('soldier')||role.includes('patrol')||role.includes('warden')||role.includes('lancer'))return find(['guard','soldier','warden','lancer','mercenary'])||pool[0]||ENEMIES[0];
 return pool[0]||ENEMIES[0]
}
function travelerNamedCombatMembers(p,targetLevel,d,scaleRound,pool=[]){
 const r=p?.travelerId?travelerRegistryState().records[p.travelerId]:null,i=r?.identity||p?.groupIdentity||null;if(!i?.members?.length)return null;syncWorldPartyCompositionWithIdentity(p,i);
 const people=i.members.filter(m=>m.age!=='child'&&m.status!=='dead'&&m.status!=='recovering');if(!people.length)return null;
 return people.map(m=>{const e=makeEnemy(travelerNamedCombatBase(p,m,pool),d.enemy,scaleRound),a=worldActorRef('traveler_person',m.id,{name:m.name,location:p.location,meta:{groupId:r?.id||p.travelerId,groupName:i.groupName,role:m.role}});e.name=m.name;e.travelerPersonId=m.id;e.travelerRole=m.role;e.actorRef=a?.key||m.actorRef;e.namedTravelerCombatant=true;e.groupRoleLabel=m.role;return e})
}

function recordNamedTravelerBattleOutcome(gr,incidentResult=null){
 if(!gr?.worldPartyId)return;const p=state.world.parties.find(x=>x.id===gr.worldPartyId),r=p?.travelerId?travelerRegistryState().records[p.travelerId]:null;if(!p||!r?.identity)return;
 r.history=r.history||[];const named=(incidentResult?.outcomes||[]).filter(x=>x.ref&&String(x.ref).startsWith('traveler_person:')),detail=named.length?named.map(x=>`${x.name} ${x.outcome}`).join(', '):(gr.members||[]).filter(x=>x.namedTravelerCombatant).map(x=>x.name).join(', ');
 r.history.push({day:state.world.day,event:'defeated_by_guardian',detail:SOSText("world_party_interactions.recordNamedTravelerBattleOutcome.001",r.identity.groupName,detail?` — ${detail}`:''),region:locationRegion(p.location),incidentId:gr.incidentId||null});r.history=r.history.slice(-24);r.lastDefeatedByGuardianDay=state.world.day;if(travelerAllMembersDead(r)){r.deathKnown=true;r.deathDay=r.deathDay||state.world.day;r.deathLocation=r.deathLocation||p.location;r.locationStatus='deceased'}else resolveTravelerDependentPlacements(r,p.location,SOSText("world_party_interactions.recordNamedTravelerBattleOutcome.002"));
 if(!incidentResult)for(const x of r.identity.members||[])if((gr.members||[]).some(e=>e.travelerPersonId===x.id)){x.lastBattleDay=state.world.day;x.status='recovering';x.recoverAfterDay=state.world.day+5}
}
function refreshTravelerMemberStatuses(){
 const R=state.world?.travelerRegistry?.records||{};for(const r of Object.values(R))for(const m of r.identity?.members||[])if(m.status==='recovering'&&state.world.day>=(m.recoverAfterDay||0)){m.status='active';delete m.recoverAfterDay}
}
function worldPartyCompositionCombatBase(p,entry,pool=[]){
 const role=String(entry?.role||'').toLowerCase(),find=(words)=>pool.find(e=>words.some(w=>String(e?.name||'').toLowerCase().includes(w)))||null;
 if(role.includes('crossbow'))return find(['crossbow','arbal'])||pool[0]||ENEMIES[0];
 if(role.includes('archer'))return find(['archer','bow'])||pool[0]||ENEMIES[0];
 if(role.includes('spearman')||role.includes('lancer'))return find(['spear','pike','lancer'])||pool[0]||ENEMIES[0];
 if(role.includes('captain')||role.includes('sergeant')||role.includes('veteran'))return find(['captain','sergeant','veteran','commander','elite'])||pool[0]||ENEMIES[0];
 if(role.includes('scout')||role.includes('rider'))return find(['scout','ranger','outrider','rider'])||pool[0]||ENEMIES[0];
 if(role.includes('guard')||role.includes('soldier')||role.includes('warden')||role.includes('defender'))return find(['guard','soldier','warden','mercenary','brigand'])||pool[0]||ENEMIES[0];
 return pool[0]||ENEMIES[0]
}
function genericWorldPartyCombatMembers(p,d,scaleRound,pool){
 ensureWorldPartyComposition(p);const live=(p.combatComposition||[]).filter(x=>x.status!=='dead'&&x.status!=='recovering');
 return live.map((entry,index)=>{const base=worldPartyCompositionCombatBase(p,entry,pool),e=makeEnemy(base,d.enemy,scaleRound),id=entry.id||`${p.id}_member_${index}`,a=worldActorRef('party_member',`${p.id}:${id}`,{name:entry.label||base.name,location:p.location,meta:{partyId:p.id,partyName:p.name,kind:p.kind,role:entry.role,index}});e.name=entry.label||base.name;e.worldPartyMemberId=id;e.worldPartyRole=entry.role||'';e.actorRef=a?.key||null;e.persistentWorldCombatant=true;return e})
}
function encounterFormationTuning(doctrine,members){
 if(!doctrine||!members?.length)return;const role=(e)=>String(e.worldPartyRole||e.travelerRole||e.groupRoleLabel||'').toLowerCase();
 if(doctrine.tactic==='disciplined')for(const e of members)e.acc=clamp(e.acc+2,45,94);
 if(doctrine.tactic==='mobile')for(const e of members.filter(e=>/archer|crossbow|scout/.test(role(e))))e.init=(e.init||5)+2;
 if(doctrine.tactic==='defensive')for(const e of members.filter(e=>/guard|soldier|warden|defender|spear/.test(role(e))))e.maxHp=e.hp=Math.round(e.maxHp*1.06);
 if(doctrine.tactic==='shock')for(const e of members)e.damage=Math.max(3,Math.round(e.damage*1.04))
}
function worldEncounterLeaderQuote(p){
 const rows={
  bandits:[SOSText("world_party_interactions.worldEncounterLeaderQuote.001"),SOSText("world_party_interactions.worldEncounterLeaderQuote.002")],
  raiders:[SOSText("world_party_interactions.worldEncounterLeaderQuote.003"),SOSText("world_party_interactions.worldEncounterLeaderQuote.004")],
  redstone:[SOSText("world_party_interactions.worldEncounterLeaderQuote.005"),SOSText("world_party_interactions.worldEncounterLeaderQuote.006")],
  coalition:[SOSText("world_party_interactions.worldEncounterLeaderQuote.007"),SOSText("world_party_interactions.worldEncounterLeaderQuote.008")],
  bluestone:[SOSText("world_party_interactions.worldEncounterLeaderQuote.009"),SOSText("world_party_interactions.worldEncounterLeaderQuote.010")],
  mercenary:[SOSText("world_party_interactions.worldEncounterLeaderQuote.011"),SOSText("world_party_interactions.worldEncounterLeaderQuote.012")],
  merchant:[SOSText("world_party_interactions.worldEncounterLeaderQuote.013"),SOSText("world_party_interactions.worldEncounterLeaderQuote.014")],
  refugees:[SOSText("world_party_interactions.worldEncounterLeaderQuote.015")]
 };return pick(rows[p.kind]||[SOSText("world_party_interactions.worldEncounterLeaderQuote.016",ensureWorldPartyDoctrine(p).name)])
}
function worldEncounterLeader(p,members){
 ensureWorldPartyDoctrine(p);const id=p.leaderMemberId,leader=members.find(e=>e.worldPartyMemberId===id||e.travelerPersonId===id)||members[0];if(!leader)return null;
 leader.encounterLeader=true;return {name:leader.name,role:leader.travelerRole||leader.worldPartyRole||p.leaderRole||'',quote:worldEncounterLeaderQuote(p),actorRef:leader.actorRef||null}
}
function makeWorldCombatGroup(p){
 ensureWorldPartyComposition(p);const doctrine=ensureWorldPartyDoctrine(p),day=state.world.day,targetLevel=worldPartyCombatLevel(p),levelGap=clamp(targetLevel-(state.level||1),-2,2),mature=matureCampaignTier(),pool=openWorldEnemyPool(p,targetLevel),soloGuardian=!!p.guardianSolo,companyPower=soloGuardian?Math.max(120,openWorldGuardianCombatRating()):openWorldCompanyCombatRating(),targetRatio=worldCombatTargetRatio(targetLevel),targetPower=companyPower*targetRatio,scaleRound=clamp(targetLevel+5,2,18),d=DIFFICULTIES[state.difficulty],named=travelerNamedCombatMembers(p,targetLevel,d,scaleRound,pool),members=named||genericWorldPartyCombatMembers(p,d,scaleRound,pool);
 if(!members.length){const e=makeEnemy(pool[0]||ENEMIES[0],d.enemy,scaleRound);e.name=p.kind==='refugees'?SOSText("world_party_interactions.makeWorldCombatGroup.002"):SOSText("world_party_interactions.makeWorldCombatGroup.003");members.push(e)}
 tuneOpenWorldEnemyGroup(members,targetPower,levelGap);encounterFormationTuning(doctrine,members);p.combatantCount=members.length;
 const leader=worldEncounterLeader(p,members),finalPower=openWorldEnemyGroupRating(members),powerRatio=finalPower/Math.max(1,companyPower),groupActor=worldActorRef('world_party',p.id,{name:p.name,location:p.location,meta:{kind:p.kind,faction:p.faction,memberCount:p.memberCount||members.length,combatantCount:members.length,travelerId:p.travelerId||null,doctrine:doctrine.name,formation:p.formation}});
 p.actorRef=groupActor?.key||p.actorRef;
 return {id:`world_${p.id}`,worldPartyId:p.id,actorRef:p.actorRef,name:p.name,faction:p.faction,route:'north',distance:3,speed:1,members,objective:'patrol',status:SOSText("world_party_interactions.makeWorldCombatGroup.001"),camp:null,progress:0,retreating:false,combatLevel:targetLevel,powerRatio,threat:Math.round(finalPower/10),loot:28+day*3+members.length*8+mature*15,xp:40+day*4+members.length*12+mature*20,commander:null,encounterLeader:leader,doctrine:{...doctrine},formation:p.formation,morale:p.morale,reinforcementChance:doctrine.reinforce,engaged:false}
}
function startWorldPartyCombat(p){return showWorldEncounterPlan(p)}
function removeWorldParty(id){
 if(!id)return false;const p=state.world.parties.find(x=>x.id===id),q=p?.questId?activeQuest(p.questId):null;
 if(p?.contractProtected&&q&&!p.contractResolutionAllowed)return false;
 if(p)p.contractResolutionAllowed=false;
 state.world.parties=state.world.parties.filter(x=>x.id!==id);if(state.world.trackedPartyId===id)state.world.trackedPartyId=null;
 if(q?.type==='hunt')markQuestReady(q);
 if(q?.type==='recovery'){q.recovered=true;roadEventCargo(q.goodId,q.qty||1);markQuestReady(q);log(SOSText("world_party_interactions.removeWorldParty.001",q.qty||1,TRADE_GOODS.find(g=>g.id===q.goodId)?.name||'goods'),'good')}
 maintainWorldParties();return true
}

const ADVENTURE_SITES={
 quarry:{name:SOSText("world_party_interactions.removeWorldParty.002"),location:'quarry',stages:3,desc:SOSText("world_party_interactions.removeWorldParty.003"),reward:SOSText("world_party_interactions.removeWorldParty.004")},
 watchfort:{name:SOSText("world_party_interactions.removeWorldParty.005"),location:'watchfort',stages:3,desc:SOSText("world_party_interactions.removeWorldParty.006"),reward:SOSText("world_party_interactions.removeWorldParty.007")},
 woods:{name:SOSText("world_party_interactions.removeWorldParty.008"),location:'woods',stages:2,desc:SOSText("world_party_interactions.removeWorldParty.009"),reward:SOSText("world_party_interactions.removeWorldParty.010")},
 marsh:{name:SOSText("world_party_interactions.removeWorldParty.011"),location:'marsh',stages:3,desc:SOSText("world_party_interactions.removeWorldParty.012"),reward:SOSText("world_party_interactions.removeWorldParty.013")}
};
