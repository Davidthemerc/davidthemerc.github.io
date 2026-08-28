function encounterTerrain(locId=state.world.location){return OPEN_WORLD_TERRAINS[locId]||{name:SOSText("law_encounter_planning_law.encounterTerrain.001"),acc:0,def:0,enemyAcc:0,retreat:0,ambush:0,desc:SOSText("law_encounter_planning_law.encounterTerrain.002")}}
function encounterScoutScore(p){const ranger=guardianClass()===SOSText("law_encounter_planning_law.encounterScoutScore.001")?4:0,rogue=guardianClass()===SOSText("law_encounter_planning_law.encounterScoutScore.002")?3:0,companions=partyMembers(true).filter(m=>[SOSText("law_encounter_planning_law.encounterScoutScore.003"),SOSText("law_encounter_planning_law.encounterScoutScore.004")].includes(m.className||allyDef(m.id)?.className)).length*2;return stat(state,'dex')+state.scouting+ranger+rogue+companions-(p?.kind==='bandits'?2:0)}
function encounterIntimidationScore(p){const bers=guardianClass()===SOSText("law_encounter_planning_law.encounterIntimidationScore.001")?5:0,vanguard=guardianClass()===SOSText("law_encounter_planning_law.encounterIntimidationScore.002")?2:0,rep=Math.floor((state.reputation||0)/2),party=partyMembers(true).filter(m=>m.hp>0).length;return stat(state,'cha')+rep+bers+vanguard+party}

function rollWorldPartyCombatLevel(kind){
 const bag=[-2,-2,-1,-1,-1,-1,0,0,0,0,0,0,0,1,1,2];
 let offset=pick(bag);
 if(['redstone','bluestone','mercenary'].includes(kind)&&offset===-2&&chance(.45))offset=-1;
 return Math.max(1,(state.level||1)+offset)
}
function worldPartyCombatLevel(p){
 const level=Math.max(1,state.level||1);if(!p)return level;
 if(!Number.isFinite(p.combatLevel))p.combatLevel=rollWorldPartyCombatLevel(p.kind);
 p.combatLevel=clamp(Math.round(p.combatLevel),Math.max(1,level-2),level+2);
 return p.combatLevel
}
function worldCombatTargetRatio(level){
 const gap=clamp(level-(state.level||1),-2,2);
 return gap<=-2?.76:gap===-1?.87:gap===0?.98:gap===1?1.10:1.22
}
function worldPartyCombatAssessment(p){
 const level=worldPartyCombatLevel(p),gap=level-(state.level||1);
 const row=gap<=-2?[SOSText("law_encounter_planning_law.worldPartyCombatAssessment.001"),SOSText("law_encounter_planning_law.worldPartyCombatAssessment.002"),'good']:
  gap===-1?[SOSText("law_encounter_planning_law.worldPartyCombatAssessment.003"),SOSText("law_encounter_planning_law.worldPartyCombatAssessment.004"),'good']:
  gap===0?[SOSText("law_encounter_planning_law.worldPartyCombatAssessment.005"),SOSText("law_encounter_planning_law.worldPartyCombatAssessment.006"),'info']:
  gap===1?[SOSText("law_encounter_planning_law.worldPartyCombatAssessment.007"),SOSText("law_encounter_planning_law.worldPartyCombatAssessment.008"),'warning']:
  [SOSText("law_encounter_planning_law.worldPartyCombatAssessment.009"),SOSText("law_encounter_planning_law.worldPartyCombatAssessment.010"),'warning'];
 return {level,gap,label:row[0],text:row[1],tone:row[2]}
}
function encounterStrengthEstimate(p){return worldPartyCombatAssessment(p).label}

function worldAmbushPlan(p,terrain=encounterTerrain()){
 const scout=encounterScoutScore(p),disciplined=['redstone','bluestone','coalition','mercenary'].includes(p?.kind)?5:0;
 const pct=clamp(Math.round(16+scout*.75+(terrain.ambush||0)*.65+artifactEncounterBonus('ambush')*.5-disciplined),8,58);
 const openingDamage=clamp(Math.round(3+Math.max(0,scout)*.22+Math.max(0,terrain.ambush||0)*.12),3,12);
 const counterRisk=clamp(Math.round(28+openingDamage*2+Math.max(0,terrain.ambush||0)*.6),30,58);
 return {pct,openingDamage,counterRisk,riskLabel:counterRisk>=50?'High':counterRisk>=40?'Meaningful':SOSText("law_encounter_planning_law.worldAmbushPlan.001")}
}
function worldSurrenderChance(p){
 const level=worldPartyCombatLevel(p),gap=(state.level||1)-level,score=encounterIntimidationScore(p),d=ensureWorldPartyDoctrine(p),morale=Number(p.morale??d.morale);
 let pct=(4+Math.max(0,score-10)*.6+Math.max(0,gap)*3-Math.max(0,-gap)*4+(55-morale)*.18)*d.surrender;if(worldPartyDisposition(p)!=='hostile')pct-=2;
 return clamp(Math.round(pct),2,32)
}
function surrenderRefusalAttackChance(p){
 const assessment=worldPartyCombatAssessment(p),hostile=worldPartyDisposition(p)==='hostile',disciplined=['redstone','bluestone','coalition','mercenary'].includes(p?.kind);
 return clamp((hostile?52:24)+Math.max(0,assessment.gap)*12+(disciplined?8:0),20,86)
}
function showWorldEncounterPlan(p,hostileInitiated=false){modalRouteEnter(SOSText("law_encounter_planning_law.showWorldEncounterPlan.001"),Array.from(arguments));
 if(!p||!state.world.parties.some(x=>x.id===p.id))return renderOpenWorld();if(!canEngageWorldParty(p))return actionResult(SOSText("law_encounter_planning_law.showWorldEncounterPlan.002"),SOSText("law_encounter_planning_law.showWorldEncounterPlan.003"),'info',renderOpenWorld);
 const terrain=encounterTerrain(),d=worldPartyDisposition(p),assessment=worldPartyCombatAssessment(p),ambush=worldAmbushPlan(p,terrain),intim=worldSurrenderChance(p),doctrine=ensureWorldPartyDoctrine(p),leader=worldPartyLeaderFromComposition(p);
 const canParley=[SOSText("law_encounter_planning_law.showWorldEncounterPlan.004"),SOSText("law_encounter_planning_law.showWorldEncounterPlan.005"),SOSText("law_encounter_planning_law.showWorldEncounterPlan.006"),SOSText("law_encounter_planning_law.showWorldEncounterPlan.007"),SOSText("law_encounter_planning_law.showWorldEncounterPlan.008"),SOSText("law_encounter_planning_law.showWorldEncounterPlan.009")].includes(p.faction),political=OPEN_WORLD_FACTIONS[p.faction]&&settlementControl(state.world.location)!==p.faction;
 const doctrineHTML=SOSText("law_encounter_planning_law.showWorldEncounterPlan.018",esc(doctrine.name),esc(p.formation||doctrine.formation),Math.round(p.morale??doctrine.morale),Math.round((doctrine.reinforce||0)*100),leader?esc(leader.label||p.leaderName||''):'—');
 overlay(SOSText("law_encounter_planning_law.showWorldEncounterPlan.010",esc(p.name),assessment.gap>0?'warning':'notice',esc(assessment.label),assessment.level,state.level,esc(assessment.text),esc(terrain.name),esc(terrain.desc),terrain.acc>=0?'+':'',terrain.acc,terrain.def>=0?'+':'',terrain.def,terrain.enemyAcc>=0?'+':'',terrain.enemyAcc,terrain.retreat>=0?'+':'',Math.round(terrain.retreat*100),ambush.pct,ambush.riskLabel,intim,`${doctrineHTML}${canParley?'<button id="encParley">Attempt Parley</button>':''}<button id="encWithdraw">Offer a Way Out</button>`,political?`<p class="compact muted">This encounter occurs under ${esc(settlementControl(state.world.location))} political control. Violence may have local political consequences.</p>`:''),true);
 $('#encDirect').onclick=()=>startWorldPartyCombatPrepared(p,{terrain,stance:'direct'});
 $('#encAmbush').onclick=()=>attemptWorldAmbush(p,terrain);
 $('#encIntimidate').onclick=()=>attemptWorldSurrender(p);
 if($('#encParley'))$('#encParley').onclick=()=>attemptWorldParley(p);
 if($('#encWithdraw'))$('#encWithdraw').onclick=()=>offerWorldPartyWithdrawal(p);
 $('#encAvoid').onclick=()=>avoidWorldEncounter(p);
 $('#encBack').onclick=()=>showWorldParty(p.id)
}
function offerWorldPartyWithdrawal(p){
 const d=ensureWorldPartyDoctrine(p),hostile=worldPartyDisposition(p)==='hostile',score=rnd(1,20)+stat(state,'cha')+Math.floor((state.reputation||0)/2)+Math.max(0,Math.round((55-(p.morale??d.morale))/8)),dc=hostile?15:11;
 if(score>=dc){state.world.encounterStats.parleys++;p.attitude=hostile?'wary':p.attitude;p.morale=Math.max(20,(p.morale??d.morale)-4);p.travelLeft=Math.max(1,p.travelLeft||1);reduceRoutePressure(p.location,p.destination,1);const inc=createWorldIncident('encounter_withdrawal',{location:state.world.location,severity:1,actors:[{ref:'guardian:guardian'},{ref:p.actorRef||`world_party:${p.id}`}],political:{faction:p.faction},meta:{peaceful:true,partyName:p.name}});resolveWorldIncident(inc.id,{kind:'mutual_withdrawal',violent:false});recordWorldHistory(SOSText("law_encounter_planning_law.offerWorldPartyWithdrawal.001",p.name),'good','encounter');save();return actionResult(SOSText("law_encounter_planning_law.offerWorldPartyWithdrawal.002"),SOSText("law_encounter_planning_law.offerWorldPartyWithdrawal.003",p.name),'good',renderOpenWorld)}
 p.morale=Math.min(90,(p.morale??d.morale)+2);recordWorldHistory(SOSText("law_encounter_planning_law.offerWorldPartyWithdrawal.004",p.name),'info','encounter');save();actionResult(SOSText("law_encounter_planning_law.offerWorldPartyWithdrawal.005"),SOSText("law_encounter_planning_law.offerWorldPartyWithdrawal.006",p.name),'info',()=>showWorldEncounterPlan(p))
}
function attemptWorldAmbush(p,terrain){
 const plan=worldAmbushPlan(p,terrain),roll=rnd(1,100);
 if(roll<=plan.pct){
   state.world.encounterStats.ambushes++;
   recordWorldHistory(SOSText("law_encounter_planning_law.attemptWorldAmbush.001",state.name,p.name,terrain.name),'good','encounter');
   return startWorldPartyCombatPrepared(p,{terrain,stance:SOSText("law_encounter_planning_law.attemptWorldAmbush.002"),acc:8,enemyAcc:-8,openingDamage:plan.openingDamage,retreat:.03})
 }
 const counter= rnd(1,100)<=plan.counterRisk;
 if(counter){
   recordWorldHistory(SOSText("law_encounter_planning_law.attemptWorldAmbush.003",p.name),'bad','encounter');
   return startWorldPartyCombatPrepared(p,{terrain,stance:'counter-ambushed',acc:-8,def:-2,enemyAcc:10,retreat:-.08,enemyFirst:true})
 }
 recordWorldHistory(SOSText("law_encounter_planning_law.attemptWorldAmbush.004",p.name),'bad','encounter');
 startWorldPartyCombatPrepared(p,{terrain,stance:SOSText("law_encounter_planning_law.attemptWorldAmbush.005"),acc:-4,enemyAcc:6,retreat:-.03})
}
function attemptWorldSurrender(p){
 const pct=worldSurrenderChance(p),roll=rnd(1,100),combatants=['bandits','raiders','mercenary','redstone','bluestone','coalition','spawn'];
 if(roll<=pct&&combatants.includes(p.kind)){
   state.world.encounterStats.surrenders++;
   const outlaw=['bandits','raiders','mercenary'].includes(p.kind),gold=outlaw?Math.min(30,6+rnd(0,12)+(p.cargo||0)*2):0;
   if(gold)gainGold(gold);if(['bandits','raiders'].includes(p.kind))state.reputation++;
   recordWorldHistory(SOSText("law_encounter_planning_law.attemptWorldSurrender.001",p.name),'good','encounter');
   p.contractResolutionAllowed=true;removeWorldParty(p.id);save();
   return actionResult(SOSText("law_encounter_planning_law.attemptWorldSurrender.002"),outlaw?SOSText("law_encounter_planning_law.attemptWorldSurrender.003",p.name,gold):SOSText("law_encounter_planning_law.attemptWorldSurrender.004",p.name),'good',renderOpenWorld)
 }
 if(roll<=pct&&['merchant','refugees'].includes(p.kind)){
   recordCrimeDetailed('threat',state.world.location,p.faction,{severity:1,desc:SOSText("law_encounter_planning_law.attemptWorldSurrender.005",p.name)});state.reputation=Math.max(0,state.reputation-2);state.world.factionStanding[p.faction]=(state.world.factionStanding[p.faction]||0)-3;recordCrimeDetailed('robbery',state.world.location,p.faction,{severity:3,desc:SOSText("law_encounter_planning_law.attemptWorldSurrender.006",p.name)});recordWorldHistory(SOSText("law_encounter_planning_law.attemptWorldSurrender.007",state.name,p.name),'bad','encounter');const gold=Math.min(28,6+rnd(0,16));gainGold(gold);p.contractResolutionAllowed=true;removeWorldParty(p.id);save();return actionResult(SOSText("law_encounter_planning_law.attemptWorldSurrender.008"),SOSText("law_encounter_planning_law.attemptWorldSurrender.009",p.name,gold),'bad',renderOpenWorld)
 }
 const attackRisk=surrenderRefusalAttackChance(p);
 recordWorldHistory(SOSText("law_encounter_planning_law.attemptWorldSurrender.010",p.name),'info','encounter');
 if(rnd(1,100)<=attackRisk&&worldPartyDisposition(p)==='hostile'){
   recordWorldHistory(SOSText("law_encounter_planning_law.attemptWorldSurrender.011",p.name),'bad','encounter');
   return startWorldPartyCombatPrepared(p,{terrain:encounterTerrain(),stance:SOSText("law_encounter_planning_law.attemptWorldSurrender.012"),enemyAcc:4,enemyFirst:worldPartyCombatLevel(p)>=state.level&&chance(.35)})
 }
 if(['merchant','refugees'].includes(p.kind)){
   recordCrimeDetailed('threat',state.world.location,p.faction,{severity:1,desc:SOSText("law_encounter_planning_law.attemptWorldSurrender.013",p.name)});state.reputation=Math.max(0,state.reputation-1);state.world.factionStanding[p.faction]=(state.world.factionStanding[p.faction]||0)-1;save();
   return actionResult(SOSText("law_encounter_planning_law.attemptWorldSurrender.014"),SOSText("law_encounter_planning_law.attemptWorldSurrender.015",p.name),'bad',()=>showWorldEncounterPlan(p))
 }
 actionResult(SOSText("law_encounter_planning_law.attemptWorldSurrender.016"),SOSText("law_encounter_planning_law.attemptWorldSurrender.017",p.name),'info',()=>showWorldEncounterPlan(p))
}
function attemptWorldParley(p){
 const treaty=OPEN_WORLD_FACTIONS[p.faction]?activeTreaty(p.faction,settlementControl(state.world.location)):null,standing=state.world.factionStanding[p.faction]||0,roll=rnd(1,20)+stat(state,'cha')+Math.floor(standing/2)+(treaty?4:0);
 if(roll>=16){state.world.encounterStats.parleys++;if(p.attitude==='hostile')p.attitude='conditional';state.world.factionStanding[p.faction]=(state.world.factionStanding[p.faction]||0)+1;recordWorldHistory(SOSText("law_encounter_planning_law.attemptWorldParley.001",state.name,p.name),'good','encounter');save();return actionResult(SOSText("law_encounter_planning_law.attemptWorldParley.002"),SOSText("law_encounter_planning_law.attemptWorldParley.003",p.name),'good',renderOpenWorld)}
 if(roll<=8&&worldPartyDisposition(p)==='hostile'){recordWorldHistory(SOSText("law_encounter_planning_law.attemptWorldParley.004",p.name),'bad','encounter');return startWorldPartyCombatPrepared(p,{terrain:encounterTerrain(),stance:SOSText("law_encounter_planning_law.attemptWorldParley.005"),enemyAcc:5})}
 actionResult(SOSText("law_encounter_planning_law.attemptWorldParley.006"),SOSText("law_encounter_planning_law.attemptWorldParley.007",p.name),'info',()=>showWorldEncounterPlan(p))
}
function avoidWorldEncounter(p){
 state.world.encounterStats.avoided++;const terrain=encounterTerrain(),hostile=worldPartyDisposition(p)==='hostile',risk=hostile?clamp(25-terrain.retreat*100-artifactEncounterBonus('retreat')-(guardianClass()===SOSText("law_encounter_planning_law.avoidWorldEncounter.001")?8:0),3,45):0;
 if(hostile&&rnd(1,100)<=risk){recordWorldHistory(SOSText("law_encounter_planning_law.avoidWorldEncounter.002",p.name),'bad','encounter');return startWorldPartyCombatPrepared(p,{terrain,stance:SOSText("law_encounter_planning_law.avoidWorldEncounter.003"),enemyAcc:5})}
 recordWorldHistory(SOSText("law_encounter_planning_law.avoidWorldEncounter.004",state.name,p.name),'info','encounter');save();actionResult(SOSText("law_encounter_planning_law.avoidWorldEncounter.005"),SOSText("law_encounter_planning_law.avoidWorldEncounter.006",terrain.name.toLowerCase(),p.name),'info',renderOpenWorld)
}
function startWorldPartyCombatPrepared(p,tactical={}){
 if(!p||!state.world.parties.some(x=>x.id===p.id))return renderOpenWorld();if(!canEngageWorldParty(p))return actionResult(SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.001"),SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.002"),'info',renderOpenWorld);
 const gr=makeWorldCombatGroup(p);gr.tactical={terrain:tactical.terrain||encounterTerrain(),stance:tactical.stance||'direct',acc:tactical.acc||0,def:tactical.def||0,enemyAcc:tactical.enemyAcc||0,retreat:tactical.retreat||0,openingDamage:tactical.openingDamage||0,enemyFirst:!!tactical.enemyFirst};SOSServices.combat.launch(gr)
}

const LAW_PROFILES={shantium:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.003"),strict:2},river:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.004"),strict:1},stonebridge:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.005"),strict:2},northgate:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.006"),strict:3},southroad:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.007"),strict:1},redoubt:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.008"),strict:4},zion:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.009"),strict:3},lowcreek:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.010"),strict:3},ebonheart:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.011"),strict:2},norwegian:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.012"),strict:2},winterstone:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.013"),strict:3},skybreak:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.014"),strict:4},sengia:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.015"),strict:4},lockwood:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.016"),strict:4},grayhaven:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.017"),strict:3},briarlake:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.018"),strict:3},glenbrook:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.019"),strict:3},tyrdon:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.020"),strict:2},pyreglade:{name:SOSText("law_encounter_planning_law.startWorldPartyCombatPrepared.021"),strict:3}};
function lawState(){ensureWorldState();return state.world.law}
function lawProfile(id=state.world.location){return LAW_PROFILES[id]||{name:SOSText("law_encounter_planning_law.lawProfile.001",worldLocation(id).name),strict:1}}
function lawHeat(id=state.world.location){return lawState().heat[id]||0}
function localBounty(id=state.world.location){return lawState().bounties[id]||0}
function wantedTier(id=state.world.location){const h=lawHeat(id),b=localBounty(id);return b>=180||h>=12?'Fugitive':b>=90||h>=8?'Wanted':b>=35||h>=4?'Suspected':SOSText("law_encounter_planning_law.wantedTier.001")}
function hasWarrant(id=state.world.location){return !!lawState().warrants[id]}
function lawWarrantSeverity(id=state.world.location){const w=lawState().warrants[id];return w?Number(w.severity??CRIME_SEVERITY[w.kind]??3):0}
function lawFineSettlementAllowed(id=state.world.location){return !hasWarrant(id)||lawWarrantSeverity(id)<=2}
function lawArrivalNeedsDecision(id=state.world.location){return !!state.world.settlements[id]&&(hasWarrant(id)||lawHeat(id)>=4||localBounty(id)>=35)}
function lawEntryState(id=state.world.location){const L=lawState();if(!L.entryState||typeof L.entryState!=='object')L.entryState={};return L.entryState[id]||null}
function setLawEntryState(id,status,extra={}){const L=lawState();if(!L.entryState||typeof L.entryState!=='object')L.entryState={};L.entryState[id]={status,day:state.world.day,...extra};return L.entryState[id]}
function clearLawEntryState(id=state.world.location){const L=lawState();if(L.entryState)delete L.entryState[id]}
function lawCovertEntryChance(id=state.world.location){
 const cls=guardianClass(),classBonus=cls==='Rogue'?26:cls==='Ranger'?22:cls==='Wizard'?5:cls==='Sorcerer'?4:0,companions=partyMembers(true).filter(m=>m.hp>0).length;
 const security=state.world.settlements[id]?.security??50,fame=Math.max(0,state.reputation||0)+Math.max(0,localReputation(id))*1.4,homePenalty=id==='shantium'?18:0,warrantPenalty=hasWarrant(id)?10:0;
 return clamp(Math.round(28+stat(state,'dex')*2.4+(state.scouting||0)*2.5+classBonus-security*.34-fame*.7-companions*5-homePenalty-warrantPenalty),5,88)
}
function lawPoliticalEntryOption(id=state.world.location){
 const faction=settlementControl(id);if(!OPEN_WORLD_FACTIONS[faction])return null;const score=politicalProtectionScore(id,faction),cap=politicalCapital(id,faction),standing=state.world.factionStanding[faction]||0;
 return score>=28&&cap>=3&&standing>=3?{faction,score,cap}:null
}
function completeLawfulSettlementEntry(id,onEntered){clearLawEntryState(id);save();closeOverlay();return typeof onEntered==='function'?onEntered():renderOpenWorld()}
function attemptLawPoliticalEntryIntervention(id,onEntered){
 const opt=lawPoliticalEntryOption(id);if(!opt)return showSettlementLawArrival(id,onEntered);const severity=Math.max(1,lawWarrantSeverity(id)),cost=clamp(3+severity*2,3,16);if(opt.cap<cost)return actionResult(SOSText("law_encounter_planning_law.attemptLawPoliticalEntryIntervention.001"),SOSText("law_encounter_planning_law.attemptLawPoliticalEntryIntervention.002",cost),'bad',()=>showSettlementLawArrival(id,onEntered));
 adjustPoliticalCapital(id,opt.faction,-cost,SOSText("law_encounter_planning_law.attemptLawPoliticalEntryIntervention.003",worldLocation(id).name));const effective=opt.score+rnd(1,20)+(state.world.factionStanding[opt.faction]||0);if(effective>=48+severity*3){lawState().heat[id]=Math.max(0,lawHeat(id)-2);if(lawWarrantSeverity(id)<=3)delete lawState().warrants[id];recordWorldHistory(SOSText("law_encounter_planning_law.attemptLawPoliticalEntryIntervention.004",majorFaction(opt.faction).short,worldLocation(id).name),'info','law');save();return actionResult(SOSText("law_encounter_planning_law.attemptLawPoliticalEntryIntervention.005"),SOSText("law_encounter_planning_law.attemptLawPoliticalEntryIntervention.006",majorFaction(opt.faction).short,cost),'good',()=>completeLawfulSettlementEntry(id,onEntered))}
 adjustPoliticalDebt(id,opt.faction,1,SOSText("law_encounter_planning_law.attemptLawPoliticalEntryIntervention.007",worldLocation(id).name));save();return actionResult(SOSText("law_encounter_planning_law.attemptLawPoliticalEntryIntervention.008"),SOSText("law_encounter_planning_law.attemptLawPoliticalEntryIntervention.009",majorFaction(opt.faction).short),'bad',()=>showSettlementLawArrival(id,onEntered))
}
function attemptCovertSettlementEntry(id,onEntered){
 const pct=lawCovertEntryChance(id),roll=rnd(1,100);if(roll<=pct){setLawEntryState(id,'covert',{recognitionRisk:clamp(28+(state.world.settlements[id]?.security||50)*.35+(id==='shantium'?18:0),25,88),enteredDay:state.world.day});recordWorldHistory(SOSText("law_encounter_planning_law.attemptCovertSettlementEntry.001",state.name,worldLocation(id).name),'info','law');save();return actionResult(SOSText("law_encounter_planning_law.attemptCovertSettlementEntry.002"),SOSText("law_encounter_planning_law.attemptCovertSettlementEntry.003",worldLocation(id).name),'good',()=>{closeOverlay();return typeof onEntered==='function'?onEntered():renderOpenWorld()})}
 lawState().heat[id]=clamp(lawHeat(id)+1,0,25);if(hasWarrant(id)){save();return actionResult(SOSText("law_encounter_planning_law.attemptCovertSettlementEntry.004"),SOSText("law_encounter_planning_law.attemptCovertSettlementEntry.005",worldLocation(id).name),'bad',()=>maybeLawCheckpoint(id,onEntered))}save();return actionResult(SOSText("law_encounter_planning_law.attemptCovertSettlementEntry.004"),SOSText("law_encounter_planning_law.attemptCovertSettlementEntry.006",worldLocation(id).name),'bad',()=>showSettlementLawArrival(id,onEntered))
}
function showSettlementLawArrival(id=state.world.location,onEntered=null){
 if(!lawArrivalNeedsDecision(id))return completeLawfulSettlementEntry(id,onEntered);const p=jurisdictionRule(id),b=localBounty(id),h=lawHeat(id),w=hasWarrant(id),pct=lawCovertEntryChance(id),political=lawPoliticalEntryOption(id),serious=w&&!lawFineSettlementAllowed(id),existing=lawEntryState(id);
 if(existing?.status==='covert')return typeof onEntered==='function'?onEntered():renderOpenWorld();
 overlay(SOSText("law_encounter_planning_law.showSettlementLawArrival.001",esc(worldLocation(id).name),esc(p.authority),esc(wantedTier(id)),h,b,w?' • ACTIVE WARRANT':'',pct,serious?SOSText("law_encounter_planning_law.showSettlementLawArrival.002"):'',political?`<button id="lawArrivalPolitical"><b>${esc(SOSText("law_encounter_planning_law.showSettlementLawArrival.003",majorFaction(political.faction).short))}</b><small>${esc(SOSText("law_encounter_planning_law.showSettlementLawArrival.004",political.score,political.cap.toFixed(1)))}</small></button>`:'')+(id==='shantium'&&typeof homeSecretPassageBuilt==='function'&&homeSecretPassageBuilt()?`<button id="lawArrivalPassage"><b>Use Hidden Passage to Guardian Hall</b><small>Enter from the concealed forest entrance without passing through Shantium’s gates.</small></button>`:''),true);
 $('#lawArrivalOpen').onclick=()=>{if(w)return maybeLawCheckpoint(id,onEntered);setLawEntryState(id,'open',{enteredDay:state.world.day,scrutiny:true});recordWorldHistory(SOSText("law_encounter_planning_law.showSettlementLawArrival.005",state.name,worldLocation(id).name),'info','law');save();closeOverlay();return typeof onEntered==='function'?onEntered():renderOpenWorld()};
 $('#lawArrivalSneak').onclick=()=>attemptCovertSettlementEntry(id,onEntered);if($('#lawArrivalPassage'))$('#lawArrivalPassage').onclick=enterGuardianHallViaSecretPassage;if($('#lawArrivalPolitical'))$('#lawArrivalPolitical').onclick=()=>attemptLawPoliticalEntryIntervention(id,onEntered);$('#lawArrivalOutside').onclick=()=>{setLawEntryState(id,'outside',{arrivedFrom:state.world.travelPlan?.from||null});recordWorldHistory(SOSText("law_encounter_planning_law.showSettlementLawArrival.006",state.name,worldLocation(id).name),'info','law');save();closeOverlay();renderOpenWorld()};return true
}
function ensureSettlementEnteredForMenu(id=state.world.location){const e=lawEntryState(id);if(e?.status==='outside'){showSettlementLawArrival(id,()=>renderOpenWorld());return false}return true}
function maybeExposeCovertSettlementEntry(id=state.world.location,activity='public'){const e=lawEntryState(id);if(!e||e.status!=='covert')return false;const mod=activity==='law'||activity==='politics'||activity==='council'?24:activity==='services'||activity==='trade'?12:activity==='people'||activity==='townLife'?16:6,pct=clamp(Math.round((e.recognitionRisk||45)+mod),18,96);if(rnd(1,100)>pct)return false;clearLawEntryState(id);lawState().heat[id]=clamp(lawHeat(id)+1,0,25);recordWorldHistory(SOSText("law_encounter_planning_law.maybeExposeCovertSettlementEntry.001",state.name,worldLocation(id).name),'bad','law');save();if(hasWarrant(id)){actionResult(SOSText("law_encounter_planning_law.maybeExposeCovertSettlementEntry.002"),SOSText("law_encounter_planning_law.maybeExposeCovertSettlementEntry.003",worldLocation(id).name),'bad',()=>maybeLawCheckpoint(id));return true}actionResult(SOSText("law_encounter_planning_law.maybeExposeCovertSettlementEntry.002"),SOSText("law_encounter_planning_law.maybeExposeCovertSettlementEntry.004",worldLocation(id).name),'bad',renderOpenWorld);return true}
function crimeWitnessChance(id,kind='robbery'){const ss=state.world.settlements[id],base=ss?30+ss.security*.45:18,mod=kind==='murder'?20:kind==='assault'?10:0;return clamp(Math.round(base+mod),12,92)}

const CRIME_SEVERITY={trespass:1,threat:1,smuggling:2,theft:2,assault:3,robbery:4,kidnapping:5,murder:7,escape_custody:3,bribery:2};
const JURISDICTION_RULES={
 shantium:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.001"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.002"),strict:2,focus:['assault','robbery','theft','murder','kidnapping']},
 river:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.003"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.004"),strict:1,focus:['robbery','smuggling','theft','assault']},
 stonebridge:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.005"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.006"),strict:2,focus:['robbery','smuggling','theft','assault']},
 northgate:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.007"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.008"),strict:3,focus:['assault','murder','robbery','escape_custody']},
 southroad:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.009"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.010"),strict:1,focus:['theft','robbery','assault']},
 redoubt:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.011"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.012"),strict:4,focus:['trespass','assault','smuggling','escape_custody','murder']},
 zion:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.013"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.014"),strict:3,focus:['assault','theft','robbery','murder']},
 lowcreek:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.015"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.016"),strict:3,focus:['robbery','smuggling','assault','trespass']},
 ebonheart:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.017"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.018"),strict:2,focus:['theft','robbery','assault']},
 norwegian:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.019"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.020"),strict:2,focus:['theft','assault','robbery']},
 winterstone:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.021"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.022"),strict:3,focus:['theft','smuggling','assault']},
 skybreak:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.023"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.024"),strict:4,focus:['trespass','assault','smuggling','escape_custody']},
 sengia:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.025"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.026"),strict:4,focus:['trespass','smuggling','theft','assault','escape_custody','murder']},
 lockwood:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.027"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.028"),strict:4,focus:['trespass','smuggling','robbery','assault','escape_custody']},
 grayhaven:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.029"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.030"),strict:3,focus:['smuggling','robbery','assault','trespass']},
 briarlake:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.031"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.032"),strict:3,focus:['theft','robbery','assault','smuggling']},
 glenbrook:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.033"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.034"),strict:3,focus:['robbery','smuggling','assault']},
 tyrdon:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.035"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.036"),strict:2,focus:['theft','robbery','assault']},
 pyreglade:{authority:SOSText("law_encounter_planning_law.crimeWitnessChance.037"),faction:SOSText("law_encounter_planning_law.crimeWitnessChance.038"),strict:3,focus:['smuggling','robbery','assault','trespass']}
};
function jurisdictionRule(id=state.world.location){return JURISDICTION_RULES[id]||{authority:lawProfile(id).name,faction:settlementControl(id),strict:1,focus:['assault','robbery','theft']}}
function jurisdictionRep(id=state.world.location){const L=lawState();return L.jurisdictionRep[id]??localReputation(id)}
function adjustJurisdictionRep(id,delta,reason=''){const L=lawState();L.jurisdictionRep[id]=(L.jurisdictionRep[id]??localReputation(id))+delta;if(reason)recordWorldHistory(SOSText("law_encounter_planning_law.adjustJurisdictionRep.001",worldLocation(id).name,reason,delta>0?'+':'',delta),delta>=0?'good':'bad','law')}
function crimeWitnesses(id,kind,severity){const ss=state.world.settlements[id],security=ss?.security??45,traffic=state.world.parties.filter(p=>p.location===id||p.destination===id).length;let pct=22+security*.48+traffic*3+(kind==='murder'?24:kind==='robbery'?15:kind==='assault'?10:kind==='trespass'?-10:0);if(['woods','marsh','quarry','watchfort','ziongorge','crownpass','westspawnroad','lockwoodforest','grainvalley','grainpass','sengiaroad','pyreslopes','smugglercutred','oldredway','resinhollow'].includes(id))pct-=18;return clamp(Math.round(pct),8,95)}
function recordCrimeDetailed(kind,id=state.world.location,victimFaction=SOSText("law_encounter_planning_law.recordCrimeDetailed.001"),opts={}){
 const L=lawState(),severity=opts.severity??CRIME_SEVERITY[kind]??2,witnessChance=opts.witnessChance??crimeWitnesses(id,kind,severity),witnessed=opts.witnessed??(rnd(1,100)<=witnessChance),rule=jurisdictionRule(id),fine=Math.round((15+severity*15)*rule.strict*(rule.focus.includes(kind)?1.2:1)),desc=opts.desc||kind;
 const row={id:uid(),day:state.world.day,kind,locId:id,victimFaction,severity,witnessed,witnessChance,desc,fine};L.crimes.push(row);L.crimes=L.crimes.slice(-100);
 if(witnessed){L.heat[id]=clamp((L.heat[id]||0)+severity,0,25);L.bounties[id]=(L.bounties[id]||0)+fine;L.restitution[id]=(L.restitution[id]||0)+Math.round(fine*.35);if(L.heat[id]>=5||L.bounties[id]>=70)L.warrants[id]={issuedDay:state.world.day,authority:rule.authority,kind,severity};adjustJurisdictionRep(id,-Math.max(1,Math.ceil(severity/2)),SOSText("law_encounter_planning_law.recordCrimeDetailed.002",kind,desc));if(OPEN_WORLD_FACTIONS[victimFaction])state.world.factionStanding[victimFaction]=(state.world.factionStanding[victimFaction]||0)-Math.max(1,severity-1);recordWorldHistory(SOSText("law_encounter_planning_law.recordCrimeDetailed.003",rule.authority,desc),'bad','law')}
 else recordWorldHistory(SOSText("law_encounter_planning_law.recordCrimeDetailed.004",desc,worldLocation(id).name),'info','law');
 return row
}
function recordCrime(kind,id=state.world.location,victimFaction=SOSText("law_encounter_planning_law.recordCrime.001"),severity=2,desc=''){return recordCrimeDetailed(kind,id,victimFaction,{severity,desc}).witnessed}
function restitutionDue(id=state.world.location){return lawState().restitution[id]||0}
function payRestitution(id){const L=lawState(),due=restitutionDue(id);if(due<=0)return showLocalLaw(id);if(state.gold<due)return actionResult(SOSText("law_encounter_planning_law.payRestitution.001"),SOSText("law_encounter_planning_law.payRestitution.002",due),'bad',()=>showLocalLaw(id));state.gold-=due;L.restitution[id]=0;L.bounties[id]=Math.max(0,localBounty(id)-Math.round(due*.6));L.heat[id]=Math.max(0,lawHeat(id)-2);adjustJurisdictionRep(id,2,SOSText("law_encounter_planning_law.payRestitution.003"));save();showLocalLaw(id)}
function clearChargesThroughService(id){const L=lawState(),days=clamp(Math.ceil((localBounty(id)+restitutionDue(id))/75),1,5),fee=Math.round(localBounty(id)*.2);if(fee>state.gold)return actionResult(SOSText("law_encounter_planning_law.clearChargesThroughService.001"),SOSText("law_encounter_planning_law.clearChargesThroughService.002"),'bad',()=>showLocalLaw(id));state.gold-=fee;advanceWorldDays(days,SOSText("law_encounter_planning_law.clearChargesThroughService.003"));L.bounties[id]=0;L.restitution[id]=0;L.heat[id]=0;delete L.warrants[id];adjustJurisdictionRep(id,1,SOSText("law_encounter_planning_law.clearChargesThroughService.004"));save();actionResult(SOSText("law_encounter_planning_law.clearChargesThroughService.005"),SOSText("law_encounter_planning_law.clearChargesThroughService.006",days,days===1?'':'s'),'good',renderOpenWorld)}
function regionalWantedSummary(){return regionalSettlements().map(l=>({id:l.id,b:localBounty(l.id),h:lawHeat(l.id),tier:wantedTier(l.id),rep:jurisdictionRep(l.id)})).filter(x=>x.b||x.h||hasWarrant(x.id))}
function maybeSpawnBountyHunter(){
 if(!isOpenWorld())return;const wanted=regionalWantedSummary().filter(x=>x.b>=45||hasWarrant(x.id));if(!wanted.length)return;const t=pick(wanted);if(!chance(clamp(.04+(Math.round(t.b/35)+t.h)*.015,.04,.28)))return;if(state.world.parties.some(p=>p.kind==='bounty'&&p.bountyLocId===t.id))return;
 const p=spawnWorldParty('mercenary');p.kind='bounty';p.name=SOSText("law_encounter_planning_law.maybeSpawnBountyHunter.001",worldLocation(t.id).name);p.faction=jurisdictionRule(t.id).faction||SOSText("law_encounter_planning_law.maybeSpawnBountyHunter.002");p.attitude='conditional';p.location=t.id;p.origin=t.id;p.destination=purposefulDestination('mercenary',t.id);p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays(p.location,p.destination));p.bountyLocId=t.id;p.bountyAmount=t.b;addSettlementEvidence(t.id,SOSText("law_encounter_planning_law.maybeSpawnBountyHunter.003",p.name),'bad',4)
}
function handleBountyPartyEncounter(p){
 const id=p.bountyLocId||state.world.location,b=localBounty(id);if(!b){removeWorldParty(p.id);return actionResult(SOSText("law_encounter_planning_law.handleBountyPartyEncounter.001"),SOSText("law_encounter_planning_law.handleBountyPartyEncounter.002"),'info',renderOpenWorld)}
 const talk=clamp(20+stat(state,'cha')*3+jurisdictionRep(id)*2,10,75);
 overlay(SOSText("law_encounter_planning_law.handleBountyPartyEncounter.003",esc(p.name),esc(jurisdictionRule(id).authority),b,state.gold<b?'disabled':'',b,talk),true);
 $('#bountySubmit').onclick=()=>submitToArrest(id);$('#bountyPay').onclick=()=>clearLocalLaw(id,'fine');$('#bountyTalk').onclick=()=>{if(rnd(1,100)<=talk){lawState().heat[id]=Math.max(0,lawHeat(id)-1);removeWorldParty(p.id);return actionResult(SOSText("law_encounter_planning_law.handleBountyPartyEncounter.004"),SOSText("law_encounter_planning_law.handleBountyPartyEncounter.005"),'good',renderOpenWorld)}actionResult(SOSText("law_encounter_planning_law.handleBountyPartyEncounter.006"),SOSText("law_encounter_planning_law.handleBountyPartyEncounter.007"),'bad',()=>handleBountyPartyEncounter(p))};$('#bountyFlee').onclick=()=>{recordCrimeDetailed('escape_custody',id,jurisdictionRule(id).faction,{witnessed:true,desc:SOSText("law_encounter_planning_law.handleBountyPartyEncounter.008")});removeWorldParty(p.id);actionResult(SOSText("law_encounter_planning_law.handleBountyPartyEncounter.009"),SOSText("law_encounter_planning_law.handleBountyPartyEncounter.010"),'bad',renderOpenWorld)};$('#bountyFight').onclick=()=>{recordCrimeDetailed('assault',id,p.faction,{witnessed:true,severity:4,desc:SOSText("law_encounter_planning_law.handleBountyPartyEncounter.011")});startWorldPartyCombatPrepared(p,{terrain:encounterTerrain(),stance:SOSText("law_encounter_planning_law.handleBountyPartyEncounter.012"),enemyAcc:3})}
}
function trespassRisk(id=state.world.location){return id==='redoubt'&&(state.world.factionStanding.Redstone||0)<0}
function maybeTrespassNotice(id=state.world.location){
 if(!trespassRisk(id))return false;const L=lawState();if((L.trespass[id]||0)===state.world.day)return false;L.trespass[id]=state.world.day;
 overlay(SOSText("law_encounter_planning_law.maybeTrespassNotice.001",esc(jurisdictionRule(id).authority)),true);
 $('#trespassLeave').onclick=()=>{closeOverlay();renderOpenWorld()};$('#trespassExplain').onclick=()=>{const roll=rnd(1,20)+stat(state,'cha')+Math.floor((state.world.factionStanding.Redstone||0)/2);if(roll>=15)return actionResult(SOSText("law_encounter_planning_law.maybeTrespassNotice.002"),SOSText("law_encounter_planning_law.maybeTrespassNotice.003"),'good',renderOpenWorld);recordCrimeDetailed('trespass',id,SOSText("law_encounter_planning_law.maybeTrespassNotice.004"),{witnessed:true,desc:SOSText("law_encounter_planning_law.maybeTrespassNotice.005")});actionResult(SOSText("law_encounter_planning_law.maybeTrespassNotice.006"),SOSText("law_encounter_planning_law.maybeTrespassNotice.007"),'bad',renderOpenWorld)};$('#trespassStay').onclick=()=>{recordCrimeDetailed('trespass',id,SOSText("law_encounter_planning_law.maybeTrespassNotice.008"),{witnessed:true,severity:2,desc:SOSText("law_encounter_planning_law.maybeTrespassNotice.009")});actionResult(SOSText("law_encounter_planning_law.maybeTrespassNotice.010"),SOSText("law_encounter_planning_law.maybeTrespassNotice.011"),'bad',renderOpenWorld)};return true
}
function decayLawHeat(){const L=lawState();for(const id of Object.keys(L.heat)){if(L.heat[id]>0&&state.world.day%4===0&&!hasWarrant(id))L.heat[id]--;if((L.bounties[id]||0)<=0){delete L.warrants[id];L.heat[id]=Math.min(L.heat[id]||0,3)}}}
function clearLocalLaw(id,method='fine'){
 const L=lawState(),b=localBounty(id);if(method==='fine'){if(!lawFineSettlementAllowed(id))return actionResult(SOSText("law_encounter_planning_law.clearLocalLaw.007"),SOSText("law_encounter_planning_law.clearLocalLaw.008"),'bad',()=>showLocalLaw(id));if(state.gold<b)return showLocalLaw(id);state.gold-=b;L.finesPaid=(L.finesPaid||0)+b;L.bounties[id]=0;L.heat[id]=Math.max(0,lawHeat(id)-6);delete L.warrants[id];recordWorldHistory(SOSText("law_encounter_planning_law.clearLocalLaw.001",state.name,b,worldLocation(id).name),'good','law');save();return showLocalLaw(id)}
 const roll=rnd(1,20)+stat(state,'cha')+Math.floor(localReputation(id)/2);if(roll>=17){L.bounties[id]=Math.round(b*.35);L.heat[id]=Math.max(0,lawHeat(id)-4);if(L.heat[id]<6)delete L.warrants[id];save();return actionResult(SOSText("law_encounter_planning_law.clearLocalLaw.002"),SOSText("law_encounter_planning_law.clearLocalLaw.003"),'good',()=>showLocalLaw(id))}actionResult(SOSText("law_encounter_planning_law.clearLocalLaw.004"),SOSText("law_encounter_planning_law.clearLocalLaw.005"),'bad',()=>showLocalLaw(id))
}
function bribeLocalAuthority(id){
 const L=lawState(),cost=Math.max(20,Math.round(localBounty(id)*.55));if(state.gold<cost)return showLocalLaw(id);const roll=rnd(1,20)+stat(state,'cha')-lawProfile(id).strict*2;state.gold-=cost;L.bribes=(L.bribes||0)+1;
 if(roll>=12){L.bounties[id]=Math.round(localBounty(id)*.25);L.heat[id]=Math.max(0,lawHeat(id)-5);if(L.heat[id]<6)delete L.warrants[id];recordWorldHistory(SOSText("law_encounter_planning_law.bribeLocalAuthority.001",cost,worldLocation(id).name),'bad','law');save();return showLocalLaw(id)}
 L.heat[id]=clamp(lawHeat(id)+2,0,20);recordWorldHistory(SOSText("law_encounter_planning_law.bribeLocalAuthority.002",worldLocation(id).name),'bad','law');save();actionResult(SOSText("law_encounter_planning_law.bribeLocalAuthority.003"),SOSText("law_encounter_planning_law.bribeLocalAuthority.004"),'bad',()=>showLocalLaw(id))
}
function submitToArrest(id){
 const L=lawState(),days=clamp(Math.ceil((localBounty(id)+restitutionDue(id))/60),1,5),b=localBounty(id),rest=restitutionDue(id),cost=Math.min(state.gold,Math.round(b*.25+rest*.15));L.jailings=(L.jailings||0)+1;state.gold=Math.max(0,state.gold-cost);L.bounties[id]=0;L.restitution[id]=0;L.heat[id]=1;delete L.warrants[id];advanceWorldDays(days,SOSText("law_encounter_planning_law.submitToArrest.001"));state.guardian.hp=Math.max(1,Math.round(maxHP()*.8));adjustJurisdictionRep(id,1,SOSText("law_encounter_planning_law.submitToArrest.002"));save();actionResult(SOSText("law_encounter_planning_law.submitToArrest.003"),SOSText("law_encounter_planning_law.submitToArrest.004",days,days===1?'':'s'),'info',renderOpenWorld)
}
function showLocalLaw(id=state.world.location){modalRouteEnter(SOSText("law_encounter_planning_law.showLocalLaw.001"),Array.from(arguments));
 const L=lawState(),p=jurisdictionRule(id),b=localBounty(id),h=lawHeat(id),rest=restitutionDue(id),crimes=L.crimes.filter(c=>c.locId===id).slice(-8).reverse(),jrep=jurisdictionRep(id);
 overlay(SOSText("law_encounter_planning_law.showLocalLaw.002",esc(worldLocation(id).name),hasWarrant(id)?'warning':'notice',esc(wantedTier(id)),esc(p.authority),h,b,rest,jrep,hasWarrant(id)?' • WARRANT ACTIVE':'',crimes.map(c=>`<div class="card compact"><b>Day ${c.day}: ${esc(c.desc)}</b><br>${c.witnessed?`Reported / witnessed (${c.witnessChance??'?'}% witness likelihood) • assessed ${c.fine}g`:`No actionable witness (${c.witnessChance??'?'}% witness likelihood)`}</div>`).join('')||'<p class="muted">No local offenses recorded.</p>',b>0||rest>0?`<div class="choice-list">${b>0?`${lawFineSettlementAllowed(id)?`<button id="lawPay" ${state.gold<b?'disabled':''}>Pay Outstanding Charges — ${b}g</button>`:`<div class="warning notice compact">This warrant requires custody or formal intervention; paying the financial amount alone will not clear it.</div>`}<button id="lawAppeal">Appeal / Negotiate Charges</button><button id="lawBribe" ${state.gold<Math.max(20,Math.round(b*.55))?'disabled':''}>Attempt Quiet Payment</button>`:''}${rest>0?`<button id="lawRestitution" ${state.gold<rest?'disabled':''}>Pay Restitution — ${rest}g</button>`:''}${hasWarrant(id)?'<button id="lawSubmit">Submit to Arrest</button><button id="lawService">Request Service / Restitution Sentence</button>':''}</div>`:''),true);
 if($('#lawPay'))$('#lawPay').onclick=()=>clearLocalLaw(id,'fine');if($('#lawAppeal'))$('#lawAppeal').onclick=()=>clearLocalLaw(id,'appeal');if($('#lawBribe'))$('#lawBribe').onclick=()=>bribeLocalAuthority(id);if($('#lawRestitution'))$('#lawRestitution').onclick=()=>payRestitution(id);if($('#lawSubmit'))$('#lawSubmit').onclick=()=>submitToArrest(id);if($('#lawService'))$('#lawService').onclick=()=>clearChargesThroughService(id);wireClose()
}
function payLawChargesForEntry(id,onEntered=null){const L=lawState(),b=localBounty(id);if(!lawFineSettlementAllowed(id))return maybeLawCheckpoint(id,onEntered);if(state.gold<b)return maybeLawCheckpoint(id,onEntered);state.gold-=b;L.finesPaid=(L.finesPaid||0)+b;L.bounties[id]=0;L.heat[id]=Math.max(0,lawHeat(id)-6);delete L.warrants[id];clearLawEntryState(id);recordWorldHistory(SOSText("law_encounter_planning_law.clearLocalLaw.001",state.name,b,worldLocation(id).name),'good','law');save();return actionResult(SOSText("law_encounter_planning_law.payLawChargesForEntry.001"),SOSText("law_encounter_planning_law.payLawChargesForEntry.002",b,worldLocation(id).name),'good',()=>typeof onEntered==='function'?onEntered():renderOpenWorld())}
function maybeLawCheckpoint(id=state.world.location,onEntered=null){
 if(!state.world.settlements[id]||!hasWarrant(id)){if(typeof onEntered==='function')return onEntered();return false}const p=jurisdictionRule(id),b=localBounty(id),rest=restitutionDue(id),canPay=lawFineSettlementAllowed(id);
 overlay(SOSText("law_encounter_planning_law.maybeLawCheckpoint.001",esc(p.authority),b,rest?` with ${rest} gold restitution still due`:'',(!canPay||state.gold<b)?'disabled':'',b,rest?`<button id="lawStopRest" ${state.gold<rest?'disabled':''}>Pay Restitution — ${rest}g</button>`:'',canPay?'':SOSText("law_encounter_planning_law.maybeLawCheckpoint.009")),true);
 $('#lawStopSubmit').onclick=()=>submitToArrest(id);$('#lawStopPay').onclick=()=>payLawChargesForEntry(id,onEntered);if($('#lawStopRest'))$('#lawStopRest').onclick=()=>payRestitution(id);$('#lawStopTalk').onclick=()=>{const roll=rnd(1,20)+stat(state,'cha')+Math.floor(jurisdictionRep(id)/2);if(roll>=19){lawState().heat[id]=Math.max(0,lawHeat(id)-1);return actionResult(SOSText("law_encounter_planning_law.maybeLawCheckpoint.002"),SOSText("law_encounter_planning_law.maybeLawCheckpoint.003"),'good',()=>{clearLawEntryState(id);return typeof onEntered==='function'?onEntered():renderOpenWorld()})}actionResult(SOSText("law_encounter_planning_law.maybeLawCheckpoint.004"),SOSText("law_encounter_planning_law.maybeLawCheckpoint.005"),'bad',()=>maybeLawCheckpoint(id,onEntered))};$('#lawStopRun').onclick=()=>{recordCrimeDetailed('escape_custody',id,jurisdictionRule(id).faction,{witnessed:true,desc:SOSText("law_encounter_planning_law.maybeLawCheckpoint.006")});setLawEntryState(id,'outside',{fledCheckpoint:true});save();actionResult(SOSText("law_encounter_planning_law.maybeLawCheckpoint.007"),SOSText("law_encounter_planning_law.maybeLawCheckpoint.008"),'bad',renderOpenWorld)};return true
}
function showRegionalLaw(){modalRouteEnter(SOSText("law_encounter_planning_law.showRegionalLaw.001"),Array.from(arguments));
 const L=lawState(),locs=regionalSettlements(currentWorldRegion()),red=currentWorldRegion()==='redstone';overlay(SOSText("law_encounter_planning_law.showRegionalLaw.002",esc(regionDef().name),red?' Sengia-region settlements also track how Redstone orders interact with local civil authority and prior Guardian rulings.':'',locs.map(l=>`<button class="law-location-card" data-lawloc="${l.id}"><span><b>${esc(l.name)}</b><small>${esc(jurisdictionRule(l.id).authority)}${red?` • ${esc(sengiaPrecedentLabel(l.id))}`:''}</small></span><span><b>${esc(wantedTier(l.id))}</b><small>${localBounty(l.id)}g bounty • ${restitutionDue(l.id)}g restitution • rep ${jurisdictionRep(l.id)}${hasWarrant(l.id)?' • warrant':''}</small></span></button>`).join(''),L.finesPaid||0,L.jailings||0,L.bribes||0,regionalWantedSummary().length),true);document.querySelectorAll('[data-lawloc]').forEach(b=>b.onclick=()=>red?showSengiaAuthority(b.dataset.lawloc):showLocalLaw(b.dataset.lawloc));wireClose()
}
