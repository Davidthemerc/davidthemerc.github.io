function repairWorldLifeState(){
 if(!state.world)return;const w=state.world;
 if(!w.travelerRegistry||typeof w.travelerRegistry!=='object')w.travelerRegistry={records:{},history:[]};if(!w.travelerRegistry.records||typeof w.travelerRegistry.records!=='object')w.travelerRegistry.records={};if(!Array.isArray(w.travelerRegistry.history))w.travelerRegistry.history=[];
 if(!w.socialLife||typeof w.socialLife!=='object')w.socialLife={events:{},history:[],lastGenDay:{}};if(!w.socialLife.events||typeof w.socialLife.events!=='object')w.socialLife.events={};if(!Array.isArray(w.socialLife.history))w.socialLife.history=[];if(!w.socialLife.lastGenDay||typeof w.socialLife.lastGenDay!=='object')w.socialLife.lastGenDay={};
 if(!w.socialChains||typeof w.socialChains!=='object')w.socialChains={chains:[],history:[],lastTickDay:w.day||1};if(!Array.isArray(w.socialChains.chains))w.socialChains.chains=[];if(!Array.isArray(w.socialChains.history))w.socialChains.history=[];if(!Number.isFinite(w.socialChains.lastTickDay))w.socialChains.lastTickDay=w.day||1;
 if(!w.relationshipBridge||typeof w.relationshipBridge!=='object')w.relationshipBridge={referrals:{},introductions:{},companionRecognition:{},history:[]};for(const k of ['referrals','introductions',SOSText("openworld_state_captivity.repairWorldLifeState.001")])if(!w.relationshipBridge[k]||typeof w.relationshipBridge[k]!=='object')w.relationshipBridge[k]={};if(!Array.isArray(w.relationshipBridge.history))w.relationshipBridge.history=[];if(!w.relationshipBridge.companionNpcOpinions||typeof w.relationshipBridge.companionNpcOpinions!=='object')w.relationshipBridge.companionNpcOpinions={};
 if(!w.relationshipBridge.companionSocial||typeof w.relationshipBridge.companionSocial!=='object')w.relationshipBridge.companionSocial={requests:[],travelerOpinions:{},history:[],lastGenDay:{}};const cs=w.relationshipBridge.companionSocial;if(!Array.isArray(cs.requests))cs.requests=[];if(!cs.travelerOpinions||typeof cs.travelerOpinions!=='object')cs.travelerOpinions={};if(!Array.isArray(cs.history))cs.history=[];if(!cs.lastGenDay||typeof cs.lastGenDay!=='object')cs.lastGenDay={};
 if(!w.populationMovement||typeof w.populationMovement!=='object')w.populationMovement={npcResidences:{},households:[],history:[],lastTickDay:w.day||1,lastHouseholdId:0};if(!w.populationMovement.npcResidences||typeof w.populationMovement.npcResidences!=='object')w.populationMovement.npcResidences={};if(!Array.isArray(w.populationMovement.households))w.populationMovement.households=[];if(!Array.isArray(w.populationMovement.history))w.populationMovement.history=[];if(!Number.isFinite(w.populationMovement.lastTickDay))w.populationMovement.lastTickDay=w.day||1;if(!Number.isFinite(w.populationMovement.lastHouseholdId))w.populationMovement.lastHouseholdId=0;
 if(!w.relationshipContracts||typeof w.relationshipContracts!=='object')w.relationshipContracts={messengers:[],history:[],lastGenDay:{},serial:0};if(!Array.isArray(w.relationshipContracts.messengers))w.relationshipContracts.messengers=[];if(!Array.isArray(w.relationshipContracts.history))w.relationshipContracts.history=[];if(!w.relationshipContracts.lastGenDay||typeof w.relationshipContracts.lastGenDay!=='object')w.relationshipContracts.lastGenDay={};if(!Number.isFinite(w.relationshipContracts.serial))w.relationshipContracts.serial=0;
 if(!w.factionSocial||typeof w.factionSocial!=='object')w.factionSocial={npcAlignment:{},travelerInfluence:{},history:[],lastDay:w.day||1,lastPressureDay:{}};if(!w.factionSocial.npcAlignment||typeof w.factionSocial.npcAlignment!=='object')w.factionSocial.npcAlignment={};if(!w.factionSocial.travelerInfluence||typeof w.factionSocial.travelerInfluence!=='object')w.factionSocial.travelerInfluence={};if(!Array.isArray(w.factionSocial.history))w.factionSocial.history=[];if(!w.factionSocial.lastPressureDay||typeof w.factionSocial.lastPressureDay!=='object')w.factionSocial.lastPressureDay={};
 if(!w.travelPlan||typeof w.travelPlan!=='object')w.travelPlan={mode:'direct',from:null,to:null,startedDay:null};if(!Array.isArray(w.routeTravelHistory))w.routeTravelHistory=[];
 if(!w.settings||typeof w.settings!=='object')w.settings={};if(!w.settings.worldLifeDensity)w.settings.worldLifeDensity='balanced';
}

function ensureWorldState(){
 if(!state.world)state.world=defaultWorldState();
 state.scouting=clamp(Math.round(Number(state.scouting)||0),0,7);
 ensureWorldIntegrationState(state.world);
 const d=defaultWorldState();
 if(!state.world.companions)state.world.companions=d.companions;if(!state.world.region)state.world.region=locationRegion(state.world.location);if(!Array.isArray(state.world.unlockedRegions))state.world.unlockedRegions=['shantium'];if(!state.world.unlockedRegions.includes(locationRegion(state.world.location)))state.world.unlockedRegions.push(locationRegion(state.world.location));if(!Array.isArray(state.world.regionHistory))state.world.regionHistory=[];
 if(!Array.isArray(state.world.parties))state.world.parties=[];
 if(!Array.isArray(state.world.quests))state.world.quests=[];
 if(!state.world.contracts||typeof state.world.contracts!=='object'||Array.isArray(state.world.contracts))state.world.contracts={};
 if(!state.world.factionStanding)state.world.factionStanding=defaultFactionStanding();
 if(!state.world.cargo)state.world.cargo={food:0,medicine:0,timber:0,cloth:0,iron:0,tools:0,luxury:0};for(const g of TRADE_GOODS)if(state.world.cargo[g.id]===undefined)state.world.cargo[g.id]=0;if(!state.world.settlements)state.world.settlements=defaultSettlementState();else{const ds=defaultSettlementState();for(const [id,v] of Object.entries(ds))if(!state.world.settlements[id])state.world.settlements[id]={...v}}if(!Array.isArray(state.world.worldEvents))state.world.worldEvents=[];if(!Array.isArray(state.world.news))state.world.news=[];if(!state.world.marketShock)state.world.marketShock={};if(!state.world.tradeEconomy||typeof state.world.tradeEconomy!=='object')state.world.tradeEconomy={stock:{},intel:{},deliveries:[],losses:[],trades:[]};if(!state.world.tradeEconomy.stock)state.world.tradeEconomy.stock={};if(!state.world.tradeEconomy.intel)state.world.tradeEconomy.intel={};if(!Array.isArray(state.world.tradeEconomy.deliveries))state.world.tradeEconomy.deliveries=[];if(!Array.isArray(state.world.tradeEconomy.losses))state.world.tradeEconomy.losses=[];if(!Array.isArray(state.world.tradeEconomy.trades))state.world.tradeEconomy.trades=[];if(!state.world.tradeEconomy.economyIII||typeof state.world.tradeEconomy.economyIII!=='object')state.world.tradeEconomy.economyIII={settlements:{},history:[],lastDay:0};if(!state.world.tradeEconomy.economyIII.settlements)state.world.tradeEconomy.economyIII.settlements={};if(!Array.isArray(state.world.tradeEconomy.economyIII.history))state.world.tradeEconomy.economyIII.history=[];if(!state.world.tradeEconomy.crossRegion||typeof state.world.tradeEconomy.crossRegion!=='object')state.world.tradeEconomy.crossRegion={flows:[],disruptions:[],lastSpawnDay:0,delivered:0,lost:0};if(!Array.isArray(state.world.tradeEconomy.crossRegion.flows))state.world.tradeEconomy.crossRegion.flows=[];if(!Array.isArray(state.world.tradeEconomy.crossRegion.disruptions))state.world.tradeEconomy.crossRegion.disruptions=[];if(!state.world.mapFilters)state.world.mapFilters={hostile:true,friendly:true,neutral:true,companions:true};if(!state.world.settings||typeof state.world.settings!=='object')state.world.settings={};if(state.world.settings.silentIntegrityOnLoad===undefined)state.world.settings.silentIntegrityOnLoad=true;if(!state.world.adventures)state.world.adventures={};if(!state.world.storyChains)state.world.storyChains={};if(!Array.isArray(state.world.treasureMaps))state.world.treasureMaps=[];if(!state.world.factionQuestlines)state.world.factionQuestlines={};if(!state.world.localStock)state.world.localStock={};if(!state.world.localReputation)state.world.localReputation=defaultLocalReputation();else{for(const [id,v] of Object.entries(defaultLocalReputation()))if(state.world.localReputation[id]===undefined)state.world.localReputation[id]=v}if(!state.world.npcFamiliarity)state.world.npcFamiliarity={};if(!state.world.npcRelations)state.world.npcRelations={};if(!Array.isArray(state.world.history))state.world.history=[];if(!state.world.homeBase)state.world.homeBase=defaultHomeBase();if(!state.world.personalRequests)state.world.personalRequests={};if(!state.world.redstoneCivic||typeof state.world.redstoneCivic!=='object')state.world.redstoneCivic={issues:{},districts:{},history:[],lastTickDay:0};if(!state.world.mapView)state.world.mapView={x:0,y:0,lastLocation:null};if(!state.world.mapViews||typeof state.world.mapViews!=='object')state.world.mapViews={};for(const reg of Object.keys(WORLD_REGIONS)){if(!state.world.mapViews[reg])state.world.mapViews[reg]={x:reg===locationRegion(state.world.location)?(state.world.mapView.x||0):0,y:reg===locationRegion(state.world.location)?(state.world.mapView.y||0):0,lastLocation:reg===locationRegion(state.world.location)?state.world.mapView.lastLocation:null}}if(state.world.trackedQuestId===undefined)state.world.trackedQuestId=null;if(state.world.trackedPartyId===undefined)state.world.trackedPartyId=null;if(state.world.activeEscortQuestId===undefined)state.world.activeEscortQuestId=null;
 if(!state.world.exploration||typeof state.world.exploration!=='object')state.world.exploration={searched:{},sites:{},discoveries:[],surveys:0,failedSearches:0};if(!state.world.interiors||typeof state.world.interiors!=='object')state.world.interiors={};if(!state.world.artifacts||typeof state.world.artifacts!=='object')state.world.artifacts={found:{},history:[]};if(!state.world.artifacts.found)state.world.artifacts.found={};if(!Array.isArray(state.world.artifacts.history))state.world.artifacts.history=[];if(!state.world.companionExploration||typeof state.world.companionExploration!=='object')state.world.companionExploration={quests:{},history:[],lastLeadDay:0};if(!state.world.companionExploration.quests)state.world.companionExploration.quests={};if(!Array.isArray(state.world.companionExploration.history))state.world.companionExploration.history=[];if(!state.world.townLife||typeof state.world.townLife!=='object')state.world.townLife={notices:{},rumors:{},jobs:{},visitors:{},history:[],lastRefresh:{}};if(!state.world.townLife.notices)state.world.townLife.notices={};if(!state.world.townLife.rumors)state.world.townLife.rumors={};if(!state.world.townLife.jobs)state.world.townLife.jobs={};if(!state.world.townLife.visitors)state.world.townLife.visitors={};if(!Array.isArray(state.world.townLife.history))state.world.townLife.history=[];if(!state.world.townLife.lastRefresh)state.world.townLife.lastRefresh={};if(!state.world.exploration.searched)state.world.exploration.searched={};if(!state.world.exploration.sites)state.world.exploration.sites={};if(!Array.isArray(state.world.exploration.discoveries))state.world.exploration.discoveries=[];if(!Array.isArray(state.world.exploration.fieldDiscoveries))state.world.exploration.fieldDiscoveries=[];if(!state.world.exploration.clues||typeof state.world.exploration.clues!=='object')state.world.exploration.clues={};if(!state.world.exploration.minorUses||typeof state.world.exploration.minorUses!=='object')state.world.exploration.minorUses={};if(state.world.exploration.nextFieldId===undefined)state.world.exploration.nextFieldId=1;
 if(!Array.isArray(state.world.roadEventHistory))state.world.roadEventHistory=[];
 if(state.world.roadEventCooldownDay===undefined)state.world.roadEventCooldownDay=0;
 if(!state.world.roadEventStats)state.world.roadEventStats={helped:0,ignored:0,hostile:0,profited:0};if(!state.world.contractChains)state.world.contractChains={};if(!state.world.contractStats)state.world.contractStats={completed:0,failed:0,abandoned:0,early:0,followups:0};if(!state.world.contractMemory||typeof state.world.contractMemory!=='object')state.world.contractMemory={entities:{},history:[]};if(!state.world.contractMemory.entities||typeof state.world.contractMemory.entities!=='object')state.world.contractMemory.entities={};if(!Array.isArray(state.world.contractMemory.history))state.world.contractMemory.history=[];if(!Array.isArray(state.world.pendingContractFailures))state.world.pendingContractFailures=[];if(state.world.captivity===undefined)state.world.captivity=null;if(!state.world.captiveCompanions||typeof state.world.captiveCompanions!=='object')state.world.captiveCompanions={};if(!state.world.factionPresence||typeof state.world.factionPresence!=='object')state.world.factionPresence={};if(state.world.factionActivityDay===undefined)state.world.factionActivityDay=0;if(!state.world.factionDiplomacy||typeof state.world.factionDiplomacy!=='object')state.world.factionDiplomacy={};if(!state.world.factionIncidents||typeof state.world.factionIncidents!=='object')state.world.factionIncidents={};if(!state.world.factionPrivileges||typeof state.world.factionPrivileges!=='object')state.world.factionPrivileges={};if(!state.world.companionStories||typeof state.world.companionStories!=='object')state.world.companionStories={};if(!state.world.settlementEvents||typeof state.world.settlementEvents!=='object')state.world.settlementEvents={};if(!state.world.npcMovements||typeof state.world.npcMovements!=='object')state.world.npcMovements={};if(!state.world.settlementVisits||typeof state.world.settlementVisits!=='object')state.world.settlementVisits={};if(!state.world.settlementProblems||typeof state.world.settlementProblems!=='object')state.world.settlementProblems={};if(!state.world.reputationMilestones||typeof state.world.reputationMilestones!=='object')state.world.reputationMilestones={};if(!state.world.shantiumCommunity||typeof state.world.shantiumCommunity!=='object')state.world.shantiumCommunity={recognitions:[],lastCeremonyDay:0,publicMood:'steady'};if(!state.world.regionalSimulation||typeof state.world.regionalSimulation!=='object')state.world.regionalSimulation={threads:[],flows:[],routePressure:{},lastResponseDay:{}};if(!Array.isArray(state.world.regionalSimulation.threads))state.world.regionalSimulation.threads=[];if(!Array.isArray(state.world.regionalSimulation.flows))state.world.regionalSimulation.flows=[];if(!state.world.regionalSimulation.routePressure)state.world.regionalSimulation.routePressure={};if(!state.world.regionalSimulation.lastResponseDay)state.world.regionalSimulation.lastResponseDay={};if(!Array.isArray(state.world.regionalSimulation.opportunities))state.world.regionalSimulation.opportunities=[];if(!Array.isArray(state.world.regionalSimulation.interventions))state.world.regionalSimulation.interventions=[];if(!state.world.travelPlan||typeof state.world.travelPlan!=='object')state.world.travelPlan={mode:'direct',from:null,to:null,startedDay:null};if(!state.world.regionalContractStats||typeof state.world.regionalContractStats!=='object')state.world.regionalContractStats={generated:0,completed:0,faction:0,problemsHelped:0,routesImproved:0};if(!state.world.regionalStories||typeof state.world.regionalStories!=='object')state.world.regionalStories={arcs:{},history:[]};if(!state.world.preflight||typeof state.world.preflight!=='object')state.world.preflight={lastRepairDay:0,repairs:[],runs:0};if(!state.world.consolidation||typeof state.world.consolidation!=='object')state.world.consolidation={lastDay:0,history:[],settlementChecks:{}};if(!Array.isArray(state.world.consolidation.history))state.world.consolidation.history=[];if(!state.world.consolidation.settlementChecks)state.world.consolidation.settlementChecks={};if(!Array.isArray(state.world.preflight.repairs))state.world.preflight.repairs=[];if(!state.world.regionalStories.arcs)state.world.regionalStories.arcs={};if(!Array.isArray(state.world.regionalStories.history))state.world.regionalStories.history=[];if(!Array.isArray(state.world.routeTravelHistory))state.world.routeTravelHistory=[];if(!state.world.regionalSimulation.evidence||typeof state.world.regionalSimulation.evidence!=='object')state.world.regionalSimulation.evidence={settlements:{},routes:{},history:[]};if(!state.world.regionalSimulation.evidence.settlements)state.world.regionalSimulation.evidence.settlements={};if(!state.world.regionalSimulation.evidence.routes)state.world.regionalSimulation.evidence.routes={};if(!Array.isArray(state.world.regionalSimulation.evidence.history))state.world.regionalSimulation.evidence.history=[];if(!state.world.politics||typeof state.world.politics!=='object')state.world.politics={settlements:{},treaties:{},roadRights:{},history:[]};if(!state.world.politics.settlements)state.world.politics.settlements={};if(!state.world.politics.treaties)state.world.politics.treaties={};if(!state.world.politics.roadRights)state.world.politics.roadRights={};if(!Array.isArray(state.world.politics.history))state.world.politics.history=[];if(!state.world.encounterStats||typeof state.world.encounterStats!=='object')state.world.encounterStats={ambushes:0,avoided:0,surrenders:0,parleys:0,withdrawals:0,terrainWins:{}};if(!state.world.encounterStats.terrainWins)state.world.encounterStats.terrainWins={};if(!state.world.economy||typeof state.world.economy!=='object')state.world.economy={properties:{},investments:[],ledger:[],regionalStorage:{},projects:{}};if(!state.world.economy.properties)state.world.economy.properties={};if(!Array.isArray(state.world.economy.investments))state.world.economy.investments=[];if(!Array.isArray(state.world.economy.ledger))state.world.economy.ledger=[];if(!state.world.economy.regionalStorage)state.world.economy.regionalStorage={};if(!state.world.economy.projects)state.world.economy.projects={};if(!state.world.law||typeof state.world.law!=='object')state.world.law={heat:{},bounties:{},crimes:[],warrants:{},jailings:0,finesPaid:0,bribes:0};if(!state.world.law.heat)state.world.law.heat={};if(!state.world.law.bounties)state.world.law.bounties={};if(!Array.isArray(state.world.law.crimes))state.world.law.crimes=[];if(!state.world.law.warrants)state.world.law.warrants={};if(!state.world.law.restitution)state.world.law.restitution={};if(!state.world.law.jurisdictionRep)state.world.law.jurisdictionRep={};if(!state.world.law.trespass)state.world.law.trespass={};if(!state.world.roadLife||typeof state.world.roadLife!=='object')state.world.roadLife={queue:[],history:[],lastSceneDay:0,camps:0,initiatives:0,arguments:0,reconciliations:0};if(!state.world.companionLife||typeof state.world.companionLife!=='object')state.world.companionLife={decisions:{},sharedEvents:[],campHistory:[],followups:{},lastCampDay:0};if(!state.world.companionLife.decisions)state.world.companionLife.decisions={};if(!Array.isArray(state.world.companionLife.sharedEvents))state.world.companionLife.sharedEvents=[];if(!Array.isArray(state.world.companionLife.campHistory))state.world.companionLife.campHistory=[];if(!state.world.companionLife.followups)state.world.companionLife.followups={};if(!Array.isArray(state.world.roadLife.queue))state.world.roadLife.queue=[];if(!Array.isArray(state.world.roadLife.history))state.world.roadLife.history=[];repairWorldLifeState();WORLD_STATE_ENSURING=true;ensureFactionPresence();ensurePoliticalState();ensureFactionDiplomacy();WORLD_STATE_ENSURING=false;
 for(const a of ALLIES.filter(x=>!x.fieldOnly))if(!state.world.companions[a.id]){const blueHomes={blue_guide:'lowcreek',blue_quarry:'winterstone',blue_valley:'norwegian',blue_signal:'skybreak',red_adjutant:'sengia',red_lockrunner:'lockwood',red_grainwarden:'briarlake',red_firebreak:'pyreglade'};state.world.companions[a.id]={id:a.id,location:blueHomes[a.id]||'river',known:false,lastSeenDay:0,disposition:0,cooldownUntil:0}}
}

function notePreflightRepair(text){
 if(!state?.world?.preflight)return;const P=state.world.preflight;
 if(!P.repairs.some(x=>x.day===state.world.day&&x.text===text))P.repairs.push({day:state.world.day,text});
 P.repairs=P.repairs.slice(-30)
}
function validWorldLocationId(id){return !!WORLD_LOCATIONS.find(x=>x.id===id)}
function repairOpenWorldState(){
 if(state?.mode!=='openworld'||!state.world)return 0;
 const w=state.world,P=w.preflight;let fixes=0,escortRepairNeeded=false;consolidateWorldSystems(true);
 const fix=t=>{fixes++;notePreflightRepair(t)};
 if(!validWorldLocationId(w.location)){w.location='shantium';fix(SOSText("openworld_state_captivity.repairOpenWorldState.001"))};w.region=locationRegion(w.location);if(!Array.isArray(w.unlockedRegions))w.unlockedRegions=['shantium'];if(!w.unlockedRegions.includes(w.region))w.unlockedRegions.push(w.region)
 if(!Array.isArray(w.discovered))w.discovered=['shantium'];
 if(!w.discovered.includes('shantium')){w.discovered.unshift('shantium');fix(SOSText("openworld_state_captivity.repairOpenWorldState.002"))}
 w.discovered=[...new Set(w.discovered.filter(validWorldLocationId))];
 const seen=new Set(),clean=[];
 for(const p of (w.parties||[])){
   if(!p||!p.id||seen.has(p.id)){fix(SOSText("openworld_state_captivity.repairOpenWorldState.003"));continue}
   seen.add(p.id);
   if(!validWorldLocationId(p.location)){p.location=p.origin&&validWorldLocationId(p.origin)?p.origin:w.location;fix(SOSText("openworld_state_captivity.repairOpenWorldState.004",p.name||'world party'))}
   if(!validWorldLocationId(p.origin))p.origin=p.location;if(locationRegion(p.location)!==locationRegion(p.destination)&&!p.crossRegion){p.crossRegion=true;p.tradeRoute=p.tradeRoute||connectionRouteName(p.location,p.destination);fix(SOSText("openworld_state_captivity.repairOpenWorldState.005",p.name||'world party'))}
   if(!validWorldLocationId(p.destination)){p.destination=purposefulDestination(p.kind||'merchant',p.location);fix(SOSText("openworld_state_captivity.repairOpenWorldState.006",p.name||'world party'))}
   p.travelLeft=Math.max(0,Number.isFinite(p.travelLeft)?p.travelLeft:worldTravelDays(p.location,p.destination));
   p.travelTotal=Math.max(1,Number.isFinite(p.travelTotal)?p.travelTotal:Math.max(1,p.travelLeft));
   if(p.kind==='merchant'&&!p.manifest){assignMerchantManifest(p);fix(SOSText("openworld_state_captivity.repairOpenWorldState.007",p.name||'merchant caravan'))}
   if(!Array.isArray(p.combatComposition)||!p.combatComposition.length){ensureWorldPartyComposition(p);fix(SOSText("openworld_state_captivity.repairOpenWorldState.009",p.name||'world party'))}else ensureWorldPartyComposition(p);ensureWorldPartyDoctrine(p);
   clean.push(p)
 }
 w.parties=clean;
 if(w.trackedPartyId&&!w.parties.some(p=>p.id===w.trackedPartyId)){w.trackedPartyId=null;fix(SOSText("openworld_state_captivity.repairOpenWorldState.008"))}
 const lifecycleRepairs=typeof reconcileNamedTravelerLifecycles==='function'?reconcileNamedTravelerLifecycles(true):0;if(lifecycleRepairs){fixes+=lifecycleRepairs;notePreflightRepair(SOSText("openworld_state_captivity.repairOpenWorldState.019",lifecycleRepairs,lifecycleRepairs===1?'group':'groups'))}
 const qseen=new Set();
 w.quests=(w.quests||[]).filter(q=>{if(!q||!q.id||qseen.has(q.id)){fix(SOSText("openworld_state_captivity.repairOpenWorldState.009"));return false}qseen.add(q.id);ensureContractPaymentTerms(q);const pay=contractPaymentLocation(q);if(q.paymentLocation!==pay){q.paymentLocation=pay;fix(SOSText("openworld_state_captivity.repairOpenWorldState.010",q.name||'contract'))}return true});
 const activeBefore=(state.party.active||[]).length;state.party.active=(state.party.active||[]).filter(id=>!!state.party.members?.[id]);if(state.party.active.length!==activeBefore)fix(SOSText("openworld_state_captivity.repairOpenWorldState.011"));
 if(w.trackedQuestId&&!w.quests.some(q=>q.id===w.trackedQuestId&&['active','ready'].includes(q.status))){w.trackedQuestId=null;fix(SOSText("openworld_state_captivity.repairOpenWorldState.012"))};for(const a of activeRegionalStories()){const q=a.linkedQuestId?w.quests.find(x=>x.id===a.linkedQuestId):null;if(a.linkedQuestId&&!q){a.linkedQuestId=null;if(['winterstone_run','bread_uphill'].includes(a.id)&&a.stage===2)a.stage=1;fix(SOSText("openworld_state_captivity.repairOpenWorldState.013",regionalStoryDef(a.id).title))}}
 const escorts=w.quests.filter(q=>q.type==='escort'&&q.status==='active');
 if(w.activeEscortQuestId&&!escorts.some(q=>q.id===w.activeEscortQuestId)){w.activeEscortQuestId=null;fix(SOSText("openworld_state_captivity.repairOpenWorldState.014"))}
 if(escorts.length>1){
   const active=escorts.find(q=>q.id===w.activeEscortQuestId)||escorts.find(q=>q.escortStage==='escorting')||escorts[0];
   for(const q of escorts)if(q.id!==active.id&&q.escortStage==='escorting'){q.escortStage='rendezvous';q.escortRemainingDays=q.escortTotalDays||worldTravelDays(q.origin,q.target);fix(SOSText("openworld_state_captivity.repairOpenWorldState.015",q.name))}
   if(active.escortStage==='escorting')w.activeEscortQuestId=active.id;escortRepairNeeded=true
 }
 if(escorts.length)escortRepairNeeded=true;
 if(w.captivity?.active){if(w.captivity.location&&!validWorldLocationId(w.captivity.location)){w.captivity.location=w.location;fix(SOSText("openworld_state_captivity.repairOpenWorldState.016"))}}else if(w.captivity&&!w.captivity.active&&w.captivity.captorPartyId){w.captivity=null;fix(SOSText("openworld_state_captivity.repairOpenWorldState.017"))}
 state.party.active=[...new Set((state.party.active||[]).filter(id=>state.party.members[id]))].slice(0,partyLimit());
 for(const m of Object.values(state.party.members||{})){if(!m)continue;m.hp=clamp(Number.isFinite(m.hp)?m.hp:allyMaxHP(m),0,allyMaxHP(m));m.stamina=clamp(Number.isFinite(m.stamina)?m.stamina:allyMaxStamina(m),0,allyMaxStamina(m))}
 state.guardian.hp=clamp(Number.isFinite(state.guardian.hp)?state.guardian.hp:maxHP(),w.captivity?.active?1:0,maxHP());
 state.guardian.stamina=clamp(Number.isFinite(state.guardian.stamina)?state.guardian.stamina:maxStamina(),0,maxStamina());
 const uniqById=arr=>{const s=new Set();return (arr||[]).filter(x=>{if(!x||!x.id||s.has(x.id))return false;s.add(x.id);return true})};
 w.regionalSimulation.threads=uniqById(w.regionalSimulation.threads).slice(-40);
 w.regionalSimulation.opportunities=uniqById(w.regionalSimulation.opportunities).slice(-30);
 w.regionalSimulation.interventions=(w.regionalSimulation.interventions||[]).slice(-40);
 w.regionalSimulation.flows=(w.regionalSimulation.flows||[]).slice(-80);
 w.roadEventHistory=(w.roadEventHistory||[]).slice(-60);w.routeTravelHistory=(w.routeTravelHistory||[]).slice(-40);w.news=(w.news||[]).slice(-80);w.history=(w.history||[]).slice(-180);
 for(const locId of Object.keys(w.contracts||{})){const ids=new Set();w.contracts[locId]=(w.contracts[locId]||[]).filter(q=>q&&q.id&&!ids.has(q.id)&&(ids.add(q.id),true)).slice(0,4)}
 if(state.flags.legacyWeapon&&!item(state.flags.legacyWeapon)){state.flags.legacyWeapon=null;fix(SOSText("openworld_state_captivity.repairOpenWorldState.018"))}
 if(escortRepairNeeded&&typeof repairEscortContracts==='function')repairEscortContracts();
 fixes+=repairV1510OpenWorldState();
 P.lastRepairDay=w.day;P.runs=(P.runs||0)+1;return fixes
}

function openWorldIntegrityIssues(){
 ensureWorldState();const w=state.world,issues=[];
 const add=(kind,text)=>issues.push({kind,text});
 if(!validWorldLocationId(w.location))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.001"));if(w.region!==locationRegion(w.location))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.002"));
 const pids=new Set();for(const p of w.parties||[]){if(!p?.id)add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.003"));else if(pids.has(p.id))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.004",p.id));else pids.add(p.id);if(p?.kind==='merchant'){const lots=manifestLots(p.manifest||{});if(lots!==(p.cargo||0))add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.005",p.name||'Merchant caravan'))}}
 for(const q of w.quests||[]){if(q.storyArcId&&!regionalStoryDef(q.storyArcId))add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.006",q.name||'Contract'));if(!validWorldLocationId(q.origin))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.007",q.name||'Contract'));if(q.target&&!validWorldLocationId(q.target))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.008",q.name||'Contract'));if(['active','ready'].includes(q.status)&&!validWorldLocationId(contractPaymentLocation(q)))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.009",q.name||'Contract'));if(q.type==='escort'&&q.status==='active'&&!contractParty(q))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.010",q.name||'Escort contract'))}
 if(w.activeEscortQuestId&&!w.quests.some(q=>q.id===w.activeEscortQuestId&&q.type==='escort'&&q.status==='active'))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.011"));
 if(w.trackedQuestId&&!w.quests.some(q=>q.id===w.trackedQuestId&&['active','ready'].includes(q.status)))add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.012"));
 if(w.trackedPartyId&&!w.parties.some(p=>p.id===w.trackedPartyId))add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.013"));
 for(const g of TRADE_GOODS){const n=w.cargo?.[g.id];if(!Number.isFinite(n)||n<0)add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.014",g.name))}
 for(const id of state.party.active||[])if(!state.party.members?.[id])add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.015",id));
 for(const [id,m] of Object.entries(state.party.members||{})){if(!m)add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.016",id));else if(!Number.isFinite(m.hp)||!Number.isFinite(m.stamina))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.017",m.name||id))}
 for(const [key,r] of Object.entries(state.party.relationships||{})){if(!r||typeof r!=='object')continue;const seen=[];for(const h of r.history||[]){if(h?.text&&relationshipTextIsDuplicate(h.text,seen))add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.018",key));else if(h?.text)seen.push(h.text)}}
 const namedByRegion={};for(const p of w.parties||[]){const tr=p.travelerId?travelerRegistryState().records[p.travelerId]:null;if(!tr?.identity)continue;const reg=worldPartyDisplayRegion(p);namedByRegion[reg]=(namedByRegion[reg]||0)+1}
 for(const [reg,n] of Object.entries(namedByRegion))if(n>namedTravelerRoamingCap(reg)+1)add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.019",regionDef(reg)?.name||reg,n,namedTravelerRoamingCap(reg)));for(const r of Object.values(w.travelerRegistry?.records||{})){if(!r?.identity||travelerAllMembersDead(r))continue;const accountable=!!activePartyForTraveler(r)||!!r.settledAt||!!r.hospitalityStatus||travelerCapturedMembers(r).length>0;if(!accountable)add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.042",r.name||'Named traveler'))}
 const sim=w.regionalSimulation||{};for(const k of Object.keys(sim.routePressure||{})){const [a,b]=k.split('|');if(a&&b&&a===b)add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.020",k))}
 const staleNpcMoves=Object.entries(w.npcMovements||{}).filter(([,m])=>m&&!m.permanent&&Number.isFinite(m.untilDay)&&m.untilDay<w.day);if(staleNpcMoves.length)add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.021",staleNpcMoves.length,staleNpcMoves.length===1?' remains':'s remain'));
 const staleProblems=Object.entries(w.settlementProblems||{}).filter(([,p])=>p?.status==='active'&&w.day-(p.startedDay||w.day)>18);if(staleProblems.length)add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.022",staleProblems.length,staleProblems.length===1?' has':'s have'));
 const capitalRows=['shantium','zion','sengia'].map(id=>[id,w.settlements?.[id]]).filter(([,ss])=>ss);for(const [id,ss] of capitalRows){if((ss.security||0)<35)add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.023",worldLocation(id)?.name||id,ss.security))}
 const liveConflicts=(w.liveRegionalConflicts||[]).filter(c=>c.status==='active');if(liveConflicts.length>6)add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.024",liveConflicts.length));
 const orphanResponses=(w.parties||[]).filter(p=>p.securityResponse&&p.securityTargetPartyId&&!w.parties.some(x=>x.id===p.securityTargetPartyId));if(orphanResponses.length)add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.025",orphanResponses.length,orphanResponses.length===1?'y has':'ies have'));
 const capitalThreats=(w.parties||[]).filter(p=>['bandits','raiders'].includes(p.kind)&&(['shantium','zion','sengia'].includes(p.location)||['shantium','zion','sengia'].includes(p.destination)));if(capitalThreats.length>3)add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.026",capitalThreats.length));
 const settlementRows=Object.entries(w.settlements||{}),nearZero=settlementRows.filter(([,ss])=>(ss.prosperity||0)<=2),veryLow=settlementRows.filter(([,ss])=>(ss.prosperity||0)<=5);if(w.day>=60&&nearZero.length>=Math.ceil(settlementRows.length*.55))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.027"));if(w.day>=120&&veryLow.length>=Math.ceil(settlementRows.length*.70))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.028",veryLow.length,settlementRows.length));
 for(const [locId,ps] of Object.entries(w.politics?.settlements||{})){if(!ps?.civic||typeof ps.civic!=='object')add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.029",worldLocation(locId)?.name||locId));for(const [f,c] of Object.entries(ps?.civic||{}))for(const k of ['support','organization','legitimacy','merchant','security'])if(!Number.isFinite(c?.[k]))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.030",worldLocation(locId)?.name||locId,f,k));for(const [f,c] of Object.entries(ps?.campaigns||{}))if(!Number.isFinite(c?.momentum)||!Number.isFinite(c?.heat))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.031",worldLocation(locId)?.name||locId,f));if(ps?.covert){for(const k of ['suspicion','evidence','operations'])if(!Number.isFinite(ps.covert[k]))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.032",worldLocation(locId)?.name||locId,k))}if(ps?.protection){for(const [f,v] of Object.entries(ps.protection.capital||{}))if(!Number.isFinite(v))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.033",worldLocation(locId)?.name||locId,f));for(const c of ps.protection.cases||[])if(!c.id||!c.kind||!c.status)add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.034",worldLocation(locId)?.name||locId))}for(const [f,s] of Object.entries(ps?.internalPolitics||{})){if(!s?.influence||!Number.isFinite(s.lastActionDay))add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.035",worldLocation(locId)?.name||locId,f));for(const [id,v] of Object.entries(s?.influence||{}))if(!Number.isFinite(v)||v<0||v>100)add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.036",worldLocation(locId)?.name||locId,f,id))}if(Number.isFinite(ps?.transitionUntilDay)&&ps.transitionUntilDay>state.world.day+20)add('warn',SOSText("openworld_state_captivity.openWorldIntegrityIssues.037",worldLocation(locId)?.name||locId))}
 for(const q of [...(w.quests||[]),...Object.values(w.contracts||{}).flat()])if(q?.politicalCampaign&&(!q.politicalLocId||!OPEN_WORLD_FACTIONS[q.politicalFaction||q.faction]))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.038",q.name||'Political campaign'));
 if(state.guardian.equipment.weapon&& !item(state.guardian.equipment.weapon))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.039"));
 for(const [slot,id] of Object.entries(state.guardian.equipment||{}))if(id&&!item(id))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.040",slot));
 for(const a of activeRegionalStories()){const target=regionalStoryTarget(a.id);if(target&&!validWorldLocationId(target))add('bad',SOSText("openworld_state_captivity.openWorldIntegrityIssues.041",regionalStoryDef(a.id).title))}
 return issues
}


function repairGeneratedGroupGrammar(){
 if(!isOpenWorld()||!state.world)return 0;let fixes=0;
 const clean=s=>String(s||'').replace(/\bThe the ([A-Za-z][^.!?]*)/g,(m,g)=>SOSText("openworld_state_captivity.repairGeneratedGroupGrammar.001",g.charAt(0).toUpperCase()+g.slice(1))).replace(/\bthe the ([A-Za-z][^.!?]*)/g,(m,g)=>`the ${g}`);
 const walk=v=>{if(Array.isArray(v)){for(let i=0;i<v.length;i++){if(typeof v[i]==='string'){const n=clean(v[i]);if(n!==v[i]){v[i]=n;fixes++}}else if(v[i]&&typeof v[i]==='object')walk(v[i])}}else if(v&&typeof v==='object'){for(const k of Object.keys(v)){if(typeof v[k]==='string'){const n=clean(v[k]);if(n!==v[k]){v[k]=n;fixes++}}else if(v[k]&&typeof v[k]==='object')walk(v[k])}}};
 walk(state.world.regionalSimulation?.threads||[]);walk(state.world.regionalEvidence||{});walk(state.world.settlementEvidence||{});walk(state.world.news||[]);walk(state.world.history||[]);
 return fixes
}
function repairPursuitState(){if(!isOpenWorld()||!state.world)return 0;let f=0;if(state.world.pursuit&&typeof state.world.pursuit!=='object'){state.world.pursuit=null;f++}const P=state.world.pursuit;if(P?.targetId&&!state.world.parties.some(p=>p.id===P.targetId)){clearPursuit();f++}return f}
function repairFactionSecurityResponseState(){
 if(!isOpenWorld())return 0;let fixes=0;const S=factionSecurityResponseState();
 for(const c of state.world.liveRegionalConflicts){if(!c.id){c.id='conf_'+uid();fixes++}if(!c.status)c.status='active';if(!Number.isFinite(c.expiresDay)){c.expiresDay=state.world.day+1;fixes++}}
 cleanupLiveRegionalConflicts();for(const p of state.world.parties||[]){if(p.securityResponse&&!p.securityTargetPartyId){p.securityResponse=false;fixes++}}
 return fixes
}
function repairLongCampaignSimulationState(){
 ensureWorldState();let fixes=0;const fix=t=>{fixes++;notePreflightRepair(t)},defaults=defaultSettlementState(),settlements=Object.entries(state.world.settlements||{}),
 collapseSignature=state.world.day>=60&&settlements.length>=8&&settlements.filter(([,ss])=>(ss.prosperity||0)<=2).length>=Math.ceil(settlements.length*.55),
 broadCollapse=state.world.day>=120&&settlements.filter(([,ss])=>(ss.prosperity||0)<=5).length>=Math.ceil(settlements.length*.70);
 const staleMoves=cleanupExpiredNpcMovements();if(staleMoves)fix(SOSText("openworld_state_captivity.repairLongCampaignSimulationState.001",staleMoves,staleMoves===1?'':'s'));
 const grammarFixes=repairGeneratedGroupGrammar();if(grammarFixes)fix(SOSText("openworld_state_captivity.repairLongCampaignSimulationState.002",grammarFixes,grammarFixes===1?'y':'ies'));
 const sim=ensureRegionalSimulation();for(const k of Object.keys(sim.routePressure||{})){const [a,b]=k.split('|');if(!a||!b||a===b){delete sim.routePressure[k];fix(SOSText("openworld_state_captivity.repairLongCampaignSimulationState.003",k))}}
 state.world.consolidation=state.world.consolidation||{};
 if(!state.world.consolidation.capitalSecurityRepairV1){
  for(const capId of Object.keys(REGIONAL_CAPITALS)){const ss=settlementState(capId),base=defaults[capId]||{security:70,prosperity:55},floor=Math.max(45,Math.round(base.security*.66));if(ss.security<floor)ss.security=floor}
  for(const p of state.world.parties||[]){if(hostileToCapital(p)&&regionalCapitalDef(p.destination))p.capitalRepelledDay=state.world.day-3}
  state.world.consolidation.capitalSecurityRepairV1={day:state.world.day,version:VERSION};fix(SOSText("openworld_state_captivity.repairLongCampaignSimulationState.004"))
 }
 if(collapseSignature&&!state.world.consolidation?.settlementCollapseRepairV2){
  for(const [locId,ss] of settlements){const base=defaults[locId]||{security:55,prosperity:50};if((ss.prosperity||0)<=2)ss.prosperity=Math.max(ss.prosperity||0,Math.round(base.prosperity*.34));if((ss.security||0)<=2)ss.security=Math.max(ss.security||0,Math.round(base.security*.34));ss.problemCooldownUntil=Math.max(ss.problemCooldownUntil||0,state.world.day+3)}
  for(const [locId,p] of Object.entries(state.world.settlementProblems||{})){if(p?.status==='active'&&state.world.day-(p.startedDay||state.world.day)>14){p.status='legacy_closed';p.resolvedDay=state.world.day;p.outcome=SOSText("openworld_state_captivity.repairLongCampaignSimulationState.005");settlementState(locId).problemCooldownUntil=state.world.day+5}}
  state.world.consolidation.settlementCollapseRepairV2={day:state.world.day,version:VERSION};fix(SOSText("openworld_state_captivity.repairLongCampaignSimulationState.006"))
 }
 // A later collapse can happen after V2 has already run. V3 specifically repairs the
 // regional raid/economic-disruption death spiral and can only run once.
 if(broadCollapse&&!state.world.consolidation?.settlementProsperityRepairV3){
  for(const [locId,ss] of settlements){
   const base=defaults[locId]||{security:55,prosperity:50},floor=Math.max(10,Math.round(base.prosperity*.38));
   if((ss.prosperity||0)<=5)ss.prosperity=Math.max(ss.prosperity||0,floor);
   if((ss.security||0)<=5)ss.security=Math.max(ss.security||0,Math.max(8,Math.round(base.security*.22)));
   ss.problemCooldownUntil=Math.max(ss.problemCooldownUntil||0,state.world.day+4);
   ss.lastRaidDamageDay=Math.min(ss.lastRaidDamageDay||-99,state.world.day-3)
  }
  for(const p of state.world.parties||[])if(['bandits','raiders'].includes(p.kind))p.lastEconomicRaidDay=state.world.day;
  state.world.marketShock={};
  state.world.consolidation.settlementProsperityRepairV3={day:state.world.day,version:VERSION,reason:SOSText("openworld_state_captivity.repairLongCampaignSimulationState.007")};
  fix(SOSText("openworld_state_captivity.repairLongCampaignSimulationState.008"))
 }
 for(const [locId,p] of Object.entries(state.world.settlementProblems||{})){if(!p||p.status!=='active')continue;if(!Number.isFinite(p.extensions))p.extensions=0;if(!Number.isFinite(p.lastEffectDay))p.lastEffectDay=state.world.day;if(state.world.day-(p.startedDay||state.world.day)>18){p.status='legacy_closed';p.resolvedDay=state.world.day;settlementState(locId).problemCooldownUntil=state.world.day+5;fix(SOSText("openworld_state_captivity.repairLongCampaignSimulationState.009",worldLocation(locId)?.name||locId))}}
 const unlocked=new Set(state.world.unlockedRegions||['shantium']);for(const o of sim.opportunities||[]){if(o?.status==='active'&&!unlocked.has(locationRegion(o.location))){o.status='expired';o.resolvedDay=state.world.day;o.result=SOSText("openworld_state_captivity.repairLongCampaignSimulationState.010");fix(SOSText("openworld_state_captivity.repairLongCampaignSimulationState.011",worldLocation(o.location)?.name||o.location))}}
 for(const t of sim.threads||[]){if(t?.status==='active'){const age=state.world.day-(t.startDay||state.world.day);if((t.kind==='displacement'&&age>10)||(['supply','security'].includes(t.kind)&&age>16)){t.status='resolved';t.resolvedDay=state.world.day;t.resolution=SOSText("openworld_state_captivity.repairLongCampaignSimulationState.012");fix(SOSText("openworld_state_captivity.repairLongCampaignSimulationState.013",t.kind))}}}
 sim.opportunities=(sim.opportunities||[]).slice(-24);sim.threads=(sim.threads||[]).slice(-40);return fixes
}
function repairPendingWorldLifeTravel(){
 if(!isOpenWorld()||!state.world)return 0;const p=state.world.pendingWorldLifeTravel;if(!p)return 0;
 const validLoc=validWorldLocationId(p.locId),validKind=['event','chain'].includes(p.kind);
 let validActivity=false;if(validLoc&&validKind){if(p.kind==='event')validActivity=!!activeSocialEvent(p.locId);else validActivity=!!socialChainState().chains.find(c=>c.id===p.id&&c.status==='active')}
 if(!validLoc||!validKind||!validActivity){state.world.pendingWorldLifeTravel=null;return 1}return 0
}
function repairGuardianPublicEndorsement(){
 if(!isOpenWorld())return 0;const e=state.world?.guardianPublicEndorsement;if(!e)return 0;let fixes=0;
 if(e.faction&&!OPEN_WORLD_FACTIONS[e.faction]){e.faction=null;fixes++}if(!Number.isFinite(e.day)){e.day=-99;fixes++}if(!Array.isArray(e.history)){e.history=[];fixes++}return fixes
}
function repairLocalPoliticsState(){
 ensurePoliticalState();let fixes=0;const fix=t=>{fixes++;notePreflightRepair(t)};
 for(const [locId,ps] of Object.entries(state.world.politics?.settlements||{})){
  if(!ps.civic||typeof ps.civic!=='object'){ps.civic={};fix(SOSText("openworld_state_captivity.repairLocalPoliticsState.001",worldLocation(locId)?.name||locId))}
  if(!Array.isArray(ps.civicHistory))ps.civicHistory=[];
  ps.autonomy=clamp(Number.isFinite(ps.autonomy)?ps.autonomy:6,1,10);if(!Number.isFinite(ps.transitionUntilDay))ps.transitionUntilDay=0;
  for(const f of Object.keys(OPEN_WORLD_FACTIONS)){
   const c=localPoliticalFactionState(locId,f);for(const k of ['support','organization','legitimacy','merchant','security'])if(!Number.isFinite(c[k])){c[k]=0;fix(SOSText("openworld_state_captivity.repairLocalPoliticsState.002",f,k,worldLocation(locId)?.name||locId))}
   c.lastActionDay=Number.isFinite(c.lastActionDay)?c.lastActionDay:-99;
  }
  for(const [f,c] of Object.entries(ps.campaigns||{})){for(const k of ['momentum','successes','failures','heat'])if(!Number.isFinite(c[k])){c[k]=0;fix(SOSText("openworld_state_captivity.repairLocalPoliticsState.003",f,k,worldLocation(locId)?.name||locId))}c.momentum=clamp(c.momentum,-8,10);c.heat=clamp(c.heat,0,10);if(!Array.isArray(c.history))c.history=[]}
  const covert=politicalCovertState(locId);for(const k of ['suspicion','evidence','operations'])if(!Number.isFinite(covert[k])){covert[k]=0;fix(SOSText("openworld_state_captivity.repairLocalPoliticsState.004",k,worldLocation(locId)?.name||locId))}covert.suspicion=clamp(covert.suspicion,0,20);covert.evidence=clamp(covert.evidence,0,20);if(!Array.isArray(covert.history))covert.history=[];if(!covert.injuredNpcs||typeof covert.injuredNpcs!=='object')covert.injuredNpcs={};if(!covert.recoveredWounds||typeof covert.recoveredWounds!=='object')covert.recoveredWounds={};
  const P=politicalProtectionState(locId);for(const f of Object.keys(P.capital||{}))if(!Number.isFinite(P.capital[f])){P.capital[f]=0;fix(SOSText("openworld_state_captivity.repairLocalPoliticsState.005",f,worldLocation(locId)?.name||locId))}for(const f of Object.keys(P.debt||{}))if(!Number.isFinite(P.debt[f])){P.debt[f]=0;fix(SOSText("openworld_state_captivity.repairLocalPoliticsState.006",f,worldLocation(locId)?.name||locId))}
  P.cases=(P.cases||[]).filter(c=>c&&c.id&&c.kind&&c.status).slice(-80);P.history=(P.history||[]).slice(-60);
  for(const f of Object.keys(ps.internalPolitics||{})){const s=internalFactionPoliticsState(locId,f);for(const b of INTERNAL_FACTION_BLOCS[f]||[])s.influence[b.id]=clamp(Number.isFinite(s.influence[b.id])?s.influence[b.id]:30,0,100);s.history=(s.history||[]).slice(-30)}
  ps.civicHistory=ps.civicHistory.slice(-60)
 }
 refreshTravelerMemberStatuses();return fixes
}
function repairPreBeyondIntegrity(){
 ensureWorldState();const w=state.world;let fixes=0;
 for(const g of TRADE_GOODS){const n=w.cargo[g.id];if(!Number.isFinite(n)||n<0){w.cargo[g.id]=Math.max(0,Number(n)||0);notePreflightRepair(SOSText("openworld_state_captivity.repairPreBeyondIntegrity.001",g.name));fixes++}}
 for(const p of w.parties||[])if(p.kind==='merchant'){if(!p.manifest){assignMerchantManifest(p);fixes++;notePreflightRepair(SOSText("openworld_state_captivity.repairPreBeyondIntegrity.002",p.name||'merchant caravan'))}const lots=manifestLots(p.manifest||{});if((p.cargo||0)!==lots){p.cargo=lots;fixes++;notePreflightRepair(SOSText("openworld_state_captivity.repairPreBeyondIntegrity.003",p.name||'merchant caravan'))}}
 for(const [slot,id] of Object.entries(state.guardian.equipment||{}))if(id&&!item(id)){state.guardian.equipment[slot]=null;fixes++;notePreflightRepair(SOSText("openworld_state_captivity.repairPreBeyondIntegrity.004",slot))}
 ensureHomeBase();state.world.homeBase.storage=(state.world.homeBase.storage||[]).filter(v=>v&&item(v.id)&&Number.isFinite(v.qty)&&v.qty>0);
 return fixes
}
function showOpenWorldPreflight(){modalRouteEnter(SOSText("openworld_state_captivity.showOpenWorldPreflight.001"),Array.from(arguments));
 ensureWorldState();const fixes=repairOpenWorldState()+repairPreBeyondIntegrity()+repairGeneratedGroupGrammar()+repairPursuitState()+repairFactionSecurityResponseState()+repairLongCampaignSimulationState()+repairPendingWorldLifeTravel()+repairGuardianPublicEndorsement()+repairLocalPoliticsState(),issues=openWorldIntegrityIssues(),P=state.world.preflight,activeEscorts=state.world.quests.filter(q=>q.type==='escort'&&q.status==='active').length;
 overlay(SOSText("openworld_state_captivity.showOpenWorldPreflight.002",fixes?'warning':'success',fixes?`${fixes} issue${fixes===1?'':'s'} repaired`:'No repair was needed',P.runs||0,state.world.day,state.world.parties.length,state.world.quests.filter(q=>['active','ready'].includes(q.status)).length,activeEscorts,activeRegionalStories().length,completedRegionalStories().length,state.world.discovered.length,issues.length,issues.length?`<h3>Needs Review</h3>${issues.slice(0,8).map(x=>`<div class="${x.kind==='bad'?'warning':'notice'} notice">${esc(x.text)}</div>`).join('')}`:'',P.repairs.slice().reverse().map(x=>`<div class="card compact"><b>Day ${x.day}</b><br>${esc(x.text)}</div>`).join('')||'<p class="muted">No repair has been recorded.</p>'),true);save();wireClose()
}
function isOpenWorld(){return state?.mode==='openworld'}
function syncOpenWorldProgress(){
 if(!isOpenWorld())return;
 ensureWorldState();
 // Keep existing progression/shop/event systems compatible by mapping days to a broad campaign phase.
 state.round=clamp(1+Math.floor((state.world.day-1)/3),1,12);
 state.maxRounds=12;
 state.roundActions=2;
}
function scoutingLevel(){return clamp(Math.round(Number(state.scouting)||0),0,7)}
function gainScouting(amount=1){state.scouting=clamp(scoutingLevel()+Math.max(0,Math.round(Number(amount)||0)),0,7);return state.scouting}
function decayScoutingDaily(){const n=scoutingLevel();if(n<=0)return 0;state.scouting=Math.max(0,n-(n>=6?2:1));return state.scouting}
function reduceScoutingForRegionChange(){const before=scoutingLevel();state.scouting=before<=1?0:Math.floor(before*.25);return {before,after:state.scouting}}
function scoutingTravelDays(base){base=Math.max(0,Math.round(base||0));const s=scoutingLevel();if(base<=1||s<3)return base;const reduction=s>=7&&base>=5?2:s>=4?1:0;return Math.max(1,base-reduction)}
function worldTravelDays(from,to){
 if(from===to)return 0;const ra=locationRegion(from),rb=locationRegion(to);
 if(ra!==rb){const c=REGION_CONNECTIONS.find(x=>(x.a===from&&x.b===to)||(x.b===from&&x.a===to));return c?c.days:99}
 const a=worldLocation(from),b=worldLocation(to),dx=a.x-b.x,dy=a.y-b.y,base=Math.max(1,Math.round(Math.sqrt(dx*dx+dy*dy)/32));
 if(ra==='bluestone'){const rough=[a.terrain,b.terrain].some(x=>['pass','gorge','mountain','mountain-road','quarry','mountain-fort'].includes(x));return base+(rough?1:0)}
 if(ra==='farnorth')return Math.max(2,base*2);
 if(ra==='redstone'){const rough=[a.terrain,b.terrain].some(x=>['mountain-valley','pass-road','forest','forest-slope'].includes(x)),pair=new Set([from,to]),mountainLink=(pair.has('grayhaven')&&pair.has('briarlake'))||(pair.has('lockwood')&&pair.has('briarlake'));return base+(rough||mountainLink?1:0)}
 return base
}
function moveWorldCompanions(){
 ensureWorldState();
 const ids=WORLD_LOCATIONS.filter(x=>x.id!=='shantium'&&!x.hidden&&(state.world.unlockedRegions||['shantium']).includes(locationRegion(x))).map(x=>x.id);
 for(const [id,c] of Object.entries(state.world.companions)){
   if(state.allies.includes(id)||c.meeting)continue;
   if(chance(.34)){
     const old=c.location,regional=id.startsWith('red_')?ids.filter(x=>locationRegion(x)==='redstone'):id.startsWith('blue_')?ids.filter(x=>locationRegion(x)==='bluestone'):ids;
     c.location=pick(regional.filter(x=>x!==old).length?regional.filter(x=>x!==old):regional);
     if(c.known&&chance(.55))c.known=false;
   }
 }
}
function advanceWorldDays(days,reason=SOSText("openworld_state_captivity.advanceWorldDays.001")){
 if(!isOpenWorld())return;
 ensureWorldState();
 for(let d=0;d<days;d++){
   state.world.day++;
   decayScoutingDaily();
   worldIntegrationStartDayTick();
   noteSharedCompanionDay();checkRelationshipQuests();maybeRoadLifeScene();maybeCompanionExplorationLead();
   if(state.world.day%2===0)moveWorldCompanions();
   moveWorldParties();
   factionSecurityResponseDailyTick();
   simulateRegionalConflict();
   updateSettlementControl();
   simulateSettlementLife();
   townLifeDailyTick();populationMovementDailyTick();relationshipContractDailyTick();socialLifeDailyTick();socialChainDailyTick();companionNpcSocialDailyTick();redstoneCivicDailyTick();redstoneAuthorityDailyTick();sengiaEconomyDailyTick();sengiaSecurityDailyTick();sengiaRegionalConsequenceDailyTick();consolidateWorldSystems();
   simulateRegionalNetworkDay();crossRegionSupplyPressure();
   simulateFactionPresence();
   factionSocialDailyTick();
   simulatePoliticalDay();
   if(state.world.day%4===0)travelerLifeTransitionTick();if(state.world.day%5===0)compactMatureWorldState();
   for(const loc of WORLD_LOCATIONS.filter(x=>state.world.settlements?.[x.id]))if((state.world.day+loc.id.length)%2===0)maybeCreateFactionIncident(loc.id);
   maybeCompanionPersonalRequest();
   homeDailyTick();
   propertyDailyTick();
   worldIntegrationEndDayTick();
   decayLawHeat();
   failExpiredQuests();
   for(const k of Object.keys(state.world.marketShock||{})){state.world.marketShock[k]=Math.max(0,state.world.marketShock[k]-.025)}
   if(state.world.day%3===1)refreshShopStock();
 }
 syncOpenWorldProgress();updateCompanionStoryAvailability();
 state.world.travelHistory.push({day:state.world.day,location:state.world.location,reason});
 refreshContracts();refreshRegionalStories();checkRegionalStoryArrival();checkWorldQuestArrival();checkAdventureStoryArrival();checkFactionQuestProgress();checkPersonalRequests();checkCompanionStories();maybeCompanyQuartersBenefit();syncHomeTrophies();save();
}

function captivityActive(){return !!(isOpenWorld()&&state.world?.captivity?.active)}
function captivityCaptorLocation(c=state.world?.captivity){
 if(!c)return state.world.location;const p=c.captorPartyId?state.world.parties.find(x=>x.id===c.captorPartyId):null;return p?.location||c.location||state.world.location
}
function captivityFactionLabel(c=state.world?.captivity){return c?.faction||SOSText("openworld_state_captivity.captivityFactionLabel.001")}
function confiscateForCaptivity(){
 const c=state.world.captivity;if(!c||c.confiscated)return;
 c.confiscated={gold:state.gold,guardianEquipment:{...state.guardian.equipment},guardianInventory:(state.guardian.inventory||[]).map(x=>({...x})),cargo:{...(state.world.cargo||{})},companionEquipment:{}};
 for(const m of partyMembers(true)){c.confiscated.companionEquipment[m.id]={...m.equipment};m.equipment=emptyEquipment()}
 state.gold=0;state.guardian.equipment=emptyEquipment();state.guardian.inventory=[];for(const k of Object.keys(state.world.cargo||{}))state.world.cargo[k]=0
}
function restoreConfiscatedProperty(c=state.world?.captivity){
 if(!c?.confiscated||c.propertyRecovered)return;
 const x=c.confiscated;state.gold+=x.gold||0;state.guardian.equipment={...emptyEquipment(),...(x.guardianEquipment||{})};state.guardian.inventory=(x.guardianInventory||[]).map(v=>({...v}));state.world.cargo={...(state.world.cargo||{}),...(x.cargo||{})};
 for(const [id,eq] of Object.entries(x.companionEquipment||{}))if(state.party.members[id])state.party.members[id].equipment={...emptyEquipment(),...eq};
 c.propertyRecovered=true
}
function beginOpenWorldCaptivity(gr){
 ensureWorldState();const activeIds=[...(state.party.active||[])],party=gr.worldPartyId?state.world.parties.find(p=>p.id===gr.worldPartyId):null;
 state.world.captivity={active:true,captorName:gr.name||SOSText("openworld_state_captivity.beginOpenWorldCaptivity.001"),faction:gr.faction||party?.faction||SOSText("openworld_state_captivity.beginOpenWorldCaptivity.002"),captorPartyId:gr.worldPartyId||null,location:party?.location||state.world.location,startDay:state.world.day,turns:0,escapeProgress:0,observed:0,careless:false,companions:[...activeIds],separated:[],confiscated:null,propertyRecovered:false,escapeFight:false,rescueFight:null};
 confiscateForCaptivity();
 state.guardian.hp=Math.max(1,Math.round(maxHP()*.28));state.guardian.stamina=Math.max(10,Math.round(maxStamina()*.35));
 for(const id of activeIds){const m=state.party.members[id];if(m){m.hp=Math.max(1,Math.round(allyMaxHP(m)*.25));m.stamina=Math.max(8,Math.round(allyMaxStamina(m)*.3))}}
 state.world.location=captivityCaptorLocation();state.world.region=locationRegion(state.world.location);ensureMapView().lastLocation=null;log(SOSText("openworld_state_captivity.beginOpenWorldCaptivity.003",gr.name),'bad');recordWorldHistory(SOSText("openworld_state_captivity.beginOpenWorldCaptivity.004",gr.name),'bad','captivity');SOSServices.companions.noteSharedEvent('capture',SOSText("openworld_state_captivity.beginOpenWorldCaptivity.005",gr.name),activeIds);for(const id of activeIds)SOSServices.companions.adjustTrust(id,1);save();renderOpenWorld()
}
function captivityEscapeChance(){
 const c=state.world.captivity,companions=(c.companions||[]).filter(id=>state.party.active.includes(id)).length;
 return clamp(18+(c.observed||0)*10+(c.escapeProgress||0)*7+companions*8+(guardianClass()===SOSText("openworld_state_captivity.captivityEscapeChance.001")?12:0)+(guardianClass()===SOSText("openworld_state_captivity.captivityEscapeChance.002")?5:0),15,88)
}
function captivityTurn(action){
 const c=state.world.captivity;if(!c?.active)return renderOpenWorld();c.turns++;let text='',good=false;
 if(action==='observe'){c.observed=(c.observed||0)+1;c.escapeProgress=(c.escapeProgress||0)+1;text=SOSText("openworld_state_captivity.captivityTurn.001");good=true}
 else if(action==='rest'){state.guardian.hp=Math.min(maxHP(),state.guardian.hp+Math.round(maxHP()*.18));state.guardian.stamina=Math.min(maxStamina(),state.guardian.stamina+20);for(const id of c.companions||[]){const m=state.party.members[id];if(m){m.hp=Math.min(allyMaxHP(m),m.hp+Math.round(allyMaxHP(m)*.18));m.stamina=Math.min(allyMaxStamina(m),m.stamina+18)}}text=SOSText("openworld_state_captivity.captivityTurn.002")}
 else if(action==='talk'){c.escapeProgress=(c.escapeProgress||0)+1;const names=(c.companions||[]).map(id=>state.party.members[id]?.name).filter(Boolean);text=names.length?SOSText("openworld_state_captivity.captivityTurn.003",names.join(', ')):SOSText("openworld_state_captivity.captivityTurn.004");good=names.length>0}
 advanceWorldDays(1,SOSText("openworld_state_captivity.captivityTurn.005"));
 c.location=captivityCaptorLocation(c);
 if(c.turns>=2&&chance(.16)){c.careless=true;text+=SOSText("openworld_state_captivity.captivityTurn.006");good=true}
 maybeSeparateCaptiveCompanion();
 save();actionResult(SOSText("openworld_state_captivity.captivityTurn.007"),text,good?'good':'info',showCaptivity)
}
function maybeSeparateCaptiveCompanion(){
 const c=state.world.captivity;if(!c?.active||c.turns<3||!(c.companions||[]).length||!chance(.16))return;
 const id=pick(c.companions),m=state.party.members[id];if(!m)return;c.companions=c.companions.filter(x=>x!==id);c.separated.push(id);state.party.active=state.party.active.filter(x=>x!==id);
 const destinations=WORLD_LOCATIONS.filter(x=>['town','settlement','camp','fort'].includes(x.type)&&x.id!==state.world.location),dest=pick(destinations)||worldLocation('stonebridge');
 state.world.captiveCompanions[id]={id,captor:c.captorName,faction:c.faction,location:dest.id,sinceDay:state.world.day,ransom:Math.max(50,Math.round((75+(m.level||1)*24)*(1-.15*factionPrisonerAid(c.faction)))),known:true};
 log(SOSText("openworld_state_captivity.maybeSeparateCaptiveCompanion.001",m.name,dest.name),'bad');recordWorldHistory(SOSText("openworld_state_captivity.maybeSeparateCaptiveCompanion.002",m.name,dest.name),'bad','companion')
}
function attemptCaptivityEscape(){
 const c=state.world.captivity;if(!c?.active)return renderOpenWorld();c.turns++;const roll=rnd(1,100),need=captivityEscapeChance();
 if(roll>need){c.escapeProgress=(c.escapeProgress||0)+1;advanceWorldDays(1,SOSText("openworld_state_captivity.attemptCaptivityEscape.001"));maybeSeparateCaptiveCompanion();save();return actionResult(SOSText("openworld_state_captivity.attemptCaptivityEscape.002"),SOSText("openworld_state_captivity.attemptCaptivityEscape.003"),'bad',showCaptivity)}
 const careless=c.careless||chance(.22+(c.observed||0)*.04);if(careless){restoreConfiscatedProperty(c);return completeCaptivityEscape(true)}
 c.escapeFight=true;const base=enemyByName(c.faction===SOSText("openworld_state_captivity.attemptCaptivityEscape.004")?'Redstone Soldier':c.faction===SOSText("openworld_state_captivity.attemptCaptivityEscape.005")?'Bluestone Soldier':c.faction===SOSText("openworld_state_captivity.attemptCaptivityEscape.006")?'Mercenary':SOSText("openworld_state_captivity.attemptCaptivityEscape.007")),enemy=makeEnemy(base,Math.max(.72,DIFFICULTIES[state.difficulty].enemy*.82),Math.max(1,state.round-1));
 const gr={id:uid(),name:SOSText("openworld_state_captivity.attemptCaptivityEscape.008",c.captorName),faction:c.faction,route:'road',distance:0,speed:0,members:[enemy],objective:'guard',status:'engaged',threat:1,loot:0,xp:20,commander:null,engaged:true,captivityEscapeFight:true};
 SOSServices.combat.launch(gr,{register:false})
}
function completeCaptivityEscape(careless=false){
 const c=state.world.captivity;if(!c)return renderOpenWorld();restoreConfiscatedProperty(c);const separated=[...(c.separated||[])],where=worldLocation(captivityCaptorLocation(c)).name;
 for(const id of c.companions||[]){const m=state.party.members[id];if(m){m.hp=Math.max(m.hp,Math.round(allyMaxHP(m)*.35));m.stamina=Math.max(m.stamina,Math.round(allyMaxStamina(m)*.45))}}
 state.guardian.hp=Math.max(state.guardian.hp,Math.round(maxHP()*.38));state.guardian.stamina=Math.max(state.guardian.stamina,Math.round(maxStamina()*.5));c.active=false;c.escapeFight=false;state.world.captivity=null;
 log(SOSText("openworld_state_captivity.completeCaptivityEscape.001",where,careless?' after exploiting careless guards':''),'good');recordWorldHistory(SOSText("openworld_state_captivity.completeCaptivityEscape.002",where),'good','captivity');save();renderOpenWorld();
 const missing=separated.map(id=>state.party.members[id]?.name).filter(Boolean);actionResult(SOSText("openworld_state_captivity.completeCaptivityEscape.003"),SOSText("openworld_state_captivity.completeCaptivityEscape.004",where,missing.length?`\n\nStill missing: ${missing.join(', ')}. Their last known locations are recorded in the World Journal.`:''),'good',renderOpenWorld)
}
function showCaptivity(){modalRouteEnter(SOSText("openworld_state_captivity.showCaptivity.001"),Array.from(arguments));
 const c=state.world.captivity;if(!c?.active)return renderOpenWorld();c.location=captivityCaptorLocation(c);const loc=worldLocation(c.location),names=(c.companions||[]).map(id=>state.party.members[id]?.name).filter(Boolean),chancePct=captivityEscapeChance();
 overlay(SOSText("openworld_state_captivity.showCaptivity.002",esc(c.captorName),state.world.day,esc(loc.name),names.length?`Captured with you: <b>${names.map(esc).join(', ')}</b>. Having companions present improves escape attempts.`:'You are currently being held without another active companion.',chancePct,c.observed||0,c.careless?'<div class="success notice compact">The captors have become careless around the confiscated property.</div>':'',names.length?'':'disabled'),true);
 $('#capEscape').onclick=attemptCaptivityEscape;$('#capObserve').onclick=()=>captivityTurn('observe');$('#capTalk').onclick=()=>captivityTurn('talk');$('#capRest').onclick=()=>captivityTurn('rest')
}
function captiveCompanionEntries(){ensureWorldState();return Object.values(state.world.captiveCompanions||{}).filter(x=>x&&state.allies.includes(x.id))}
function showCaptiveCompanions(){modalRouteEnter(SOSText("openworld_state_captivity.showCaptiveCompanions.001"),Array.from(arguments));
 const rows=captiveCompanionEntries();overlay(SOSText("openworld_state_captivity.showCaptiveCompanions.002",rows.map(c=>{const m=state.party.members[c.id],here=state.world.location===c.location;return `<div class="card captive-card"><b>${esc(m?.name||c.id)}</b><p>Held by ${esc(c.captor)} near <b>${esc(worldLocation(c.location).name)}</b> • Ransom ${c.ransom}g</p><div class="choice-list compact">${here?`<button data-caprescue="${c.id}" data-method="pay" ${state.gold<c.ransom?'disabled':''}>Pay Ransom (${c.ransom}g)</button><button data-caprescue="${c.id}" data-method="negotiate">Negotiate</button><button data-caprescue="${c.id}" data-method="authority">Appeal to Authorities</button><button data-caprescue="${c.id}" data-method="fight">Use Force</button>`:`<button data-captive-travel="${c.id}">Travel to ${esc(worldLocation(c.location).name)}</button>`}</div></div>`}).join('')||'<p class="muted">No recruited companions are currently missing in captivity.</p>'),true);
 document.querySelectorAll('[data-captive-travel]').forEach(b=>b.onclick=()=>{const c=state.world.captiveCompanions[b.dataset.captiveTravel];closeOverlay();attemptWorldTravel(c.location)});
 document.querySelectorAll('[data-caprescue]').forEach(b=>b.onclick=()=>resolveCaptiveCompanion(b.dataset.caprescue,b.dataset.method));$('#captiveBack').onclick=()=>SOSServices.navigation.back(showWorldJournal)
}
function freeCaptiveCompanion(id,method){
 const c=state.world.captiveCompanions[id],m=state.party.members[id];if(!c||!m)return showCaptiveCompanions();delete state.world.captiveCompanions[id];m.hp=Math.max(1,Math.round(allyMaxHP(m)*.55));m.stamina=Math.round(allyMaxStamina(m)*.6);if(state.party.active.length<partyLimit())state.party.active.push(id);relationshipHistoryForRescue(id);SOSServices.companions.adjustTrust(id,4);log(SOSText("openworld_state_captivity.freeCaptiveCompanion.001",m.name,method),'good');recordWorldHistory(SOSText("openworld_state_captivity.freeCaptiveCompanion.002",m.name,worldLocation(c.location).name),'good','companion');SOSServices.companions.noteSharedEvent('rescue',SOSText("openworld_state_captivity.freeCaptiveCompanion.003",m.name,worldLocation(c.location).name),[id,...state.party.active]);save();actionResult(SOSText("openworld_state_captivity.freeCaptiveCompanion.004"),SOSText("openworld_state_captivity.freeCaptiveCompanion.005",m.name),'good',showCaptiveCompanions)
}
function relationshipHistoryForRescue(rescuedId){
 const active=(state.party.active||[]).filter(id=>id!==rescuedId);for(const id of active){if(!state.party.members[id])continue;relationshipHistory(rescuedId,id,SOSText("openworld_state_captivity.relationshipHistoryForRescue.001",state.party.members[id].name,state.party.members[rescuedId].name),3)}
}
function resolveCaptiveCompanion(id,method){
 const c=state.world.captiveCompanions[id],m=state.party.members[id];if(!c||!m)return showCaptiveCompanions();if(state.world.location!==c.location)return actionResult(SOSText("openworld_state_captivity.resolveCaptiveCompanion.001"),SOSText("openworld_state_captivity.resolveCaptiveCompanion.002",worldLocation(c.location).name),'info',showCaptiveCompanions);
 if(method==='pay'){if(state.gold<c.ransom)return showCaptiveCompanions();state.gold-=c.ransom;return freeCaptiveCompanion(id,SOSText("openworld_state_captivity.resolveCaptiveCompanion.003"))}
 if(method==='negotiate'){const score=rnd(1,20)+stat(state,'cha')+Math.floor((state.world.factionStanding[c.faction]||0)/2);if(score>=20)return freeCaptiveCompanion(id,SOSText("openworld_state_captivity.resolveCaptiveCompanion.004"));return actionResult(SOSText("openworld_state_captivity.resolveCaptiveCompanion.005"),SOSText("openworld_state_captivity.resolveCaptiveCompanion.006",c.captor,m.name),'bad',showCaptiveCompanions)}
 if(method==='authority'){const rep=localReputation(c.location),control=settlementControl(c.location),aid=factionPrisonerAid(control),helpful=![SOSText("openworld_state_captivity.resolveCaptiveCompanion.007"),SOSText("openworld_state_captivity.resolveCaptiveCompanion.008")].includes(control)&&(rep>=4||aid>=1);if(helpful)return freeCaptiveCompanion(id,SOSText("openworld_state_captivity.resolveCaptiveCompanion.009"));return actionResult(SOSText("openworld_state_captivity.resolveCaptiveCompanion.010"),SOSText("openworld_state_captivity.resolveCaptiveCompanion.011",c.captor,m.name),'bad',showCaptiveCompanions)}
 if(method==='fight'){const base=enemyByName(c.faction===SOSText("openworld_state_captivity.resolveCaptiveCompanion.012")?'Redstone Soldier':c.faction===SOSText("openworld_state_captivity.resolveCaptiveCompanion.013")?'Bluestone Soldier':c.faction===SOSText("openworld_state_captivity.resolveCaptiveCompanion.014")?'Mercenary':SOSText("openworld_state_captivity.resolveCaptiveCompanion.015")),enemy=makeEnemy(base,DIFFICULTIES[state.difficulty].enemy,state.round),gr={id:uid(),name:SOSText("openworld_state_captivity.resolveCaptiveCompanion.016",m.name),faction:c.faction,route:'road',distance:0,speed:0,members:[enemy],objective:'guard',status:'engaged',threat:1,loot:0,xp:25,commander:null,engaged:true,captiveRescueFight:id};SOSServices.combat.launch(gr,{register:false})}
}
const ATTRIBUTES={
 str:{name:SOSText("openworld_state_captivity.resolveCaptiveCompanion.017"),desc:SOSText("openworld_state_captivity.resolveCaptiveCompanion.018"),classes:SOSText("openworld_state_captivity.resolveCaptiveCompanion.019")},
 dex:{name:SOSText("openworld_state_captivity.resolveCaptiveCompanion.020"),desc:SOSText("openworld_state_captivity.resolveCaptiveCompanion.021"),classes:SOSText("openworld_state_captivity.resolveCaptiveCompanion.022")},
 con:{name:SOSText("openworld_state_captivity.resolveCaptiveCompanion.023"),desc:SOSText("openworld_state_captivity.resolveCaptiveCompanion.024"),classes:SOSText("openworld_state_captivity.resolveCaptiveCompanion.025")},
 int:{name:SOSText("openworld_state_captivity.resolveCaptiveCompanion.026"),desc:SOSText("openworld_state_captivity.resolveCaptiveCompanion.027"),classes:SOSText("openworld_state_captivity.resolveCaptiveCompanion.028")},
 wis:{name:SOSText("openworld_state_captivity.resolveCaptiveCompanion.029"),desc:SOSText("openworld_state_captivity.resolveCaptiveCompanion.030"),classes:SOSText("openworld_state_captivity.resolveCaptiveCompanion.031")},
 cha:{name:SOSText("openworld_state_captivity.resolveCaptiveCompanion.032"),desc:SOSText("openworld_state_captivity.resolveCaptiveCompanion.033"),classes:SOSText("openworld_state_captivity.resolveCaptiveCompanion.034")}
};
function attrName(k){return ATTRIBUTES[k]?.name||k}
function attrGuide(k){return ATTRIBUTES[k]||{name:k,desc:'',classes:''}}
const CLASSES={
 Vanguard:{name:SOSText("openworld_state_captivity.attrGuide.001"),desc:SOSText("openworld_state_captivity.attrGuide.002"),core:SOSText("openworld_state_captivity.attrGuide.003")},
 Ranger:{name:SOSText("openworld_state_captivity.attrGuide.004"),desc:SOSText("openworld_state_captivity.attrGuide.005"),core:SOSText("openworld_state_captivity.attrGuide.006")},
 Warden:{name:SOSText("openworld_state_captivity.attrGuide.007"),desc:SOSText("openworld_state_captivity.attrGuide.008"),core:SOSText("openworld_state_captivity.attrGuide.009")},
 Rogue:{name:SOSText("openworld_state_captivity.attrGuide.010"),desc:SOSText("openworld_state_captivity.attrGuide.011"),core:SOSText("openworld_state_captivity.attrGuide.012")},
 Berserker:{name:SOSText("openworld_state_captivity.attrGuide.013"),desc:SOSText("openworld_state_captivity.attrGuide.014"),core:SOSText("openworld_state_captivity.attrGuide.015")},
 Wizard:{name:SOSText("openworld_state_captivity.attrGuide.016"),desc:SOSText("openworld_state_captivity.attrGuide.017"),core:SOSText("openworld_state_captivity.attrGuide.018")},
 Sorcerer:{name:SOSText("openworld_state_captivity.attrGuide.019"),desc:SOSText("openworld_state_captivity.attrGuide.020"),core:SOSText("openworld_state_captivity.attrGuide.021")}
};
const ALLIES=[
 {id:'spear',name:SOSText("openworld_state_captivity.attrGuide.022"),title:SOSText("openworld_state_captivity.attrGuide.023"),className:SOSText("openworld_state_captivity.attrGuide.024"),desc:SOSText("openworld_state_captivity.attrGuide.025"),role:'spear',cost:65,minRound:1,stats:{str:10,dex:8,con:10,int:6,wis:7,cha:7},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.026"),damage:8,accuracy:3,initiative:1}},
 {id:'archer',name:SOSText("openworld_state_captivity.attrGuide.027"),title:SOSText("openworld_state_captivity.attrGuide.028"),className:SOSText("openworld_state_captivity.attrGuide.029"),desc:SOSText("openworld_state_captivity.attrGuide.030"),role:'archer',cost:70,minRound:1,stats:{str:7,dex:11,con:7,int:7,wis:8,cha:7},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.031"),damage:7,accuracy:7,initiative:5}},
 {id:'scout',name:SOSText("openworld_state_captivity.attrGuide.032"),title:SOSText("openworld_state_captivity.attrGuide.033"),className:SOSText("openworld_state_captivity.attrGuide.034"),desc:SOSText("openworld_state_captivity.attrGuide.035"),role:'scout',cost:75,minRound:2,stats:{str:7,dex:11,con:8,int:8,wis:9,cha:8},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.036"),damage:6,accuracy:8,initiative:6}},
 {id:'healer',name:SOSText("openworld_state_captivity.attrGuide.037"),title:SOSText("openworld_state_captivity.attrGuide.038"),className:SOSText("openworld_state_captivity.attrGuide.039"),desc:SOSText("openworld_state_captivity.attrGuide.040"),role:'healer',cost:85,minRound:3,stats:{str:6,dex:8,con:8,int:9,wis:12,cha:9},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.041"),damage:5,accuracy:3,initiative:0}},
 {id:'defector',name:SOSText("openworld_state_captivity.attrGuide.042"),title:SOSText("openworld_state_captivity.attrGuide.043"),className:SOSText("openworld_state_captivity.attrGuide.044"),desc:SOSText("openworld_state_captivity.attrGuide.045"),role:'defector',cost:95,minRound:4,stats:{str:10,dex:9,con:10,int:8,wis:8,cha:7},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.046"),damage:9,accuracy:4,initiative:2}},
 {id:'spawn',name:SOSText("openworld_state_captivity.attrGuide.047"),title:SOSText("openworld_state_captivity.attrGuide.048"),className:SOSText("openworld_state_captivity.attrGuide.049"),desc:SOSText("openworld_state_captivity.attrGuide.050"),role:'spawn',cost:105,minRound:5,stats:{str:11,dex:8,con:12,int:8,wis:9,cha:6},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.051"),damage:10,accuracy:2,initiative:0}},
 {id:'field_sellsword',name:SOSText("openworld_state_captivity.attrGuide.052"),title:SOSText("openworld_state_captivity.attrGuide.053"),className:SOSText("openworld_state_captivity.attrGuide.054"),fieldOnly:true,desc:SOSText("openworld_state_captivity.attrGuide.055"),role:'defector',cost:0,minRound:1,stats:{str:10,dex:8,con:9,int:7,wis:7,cha:7},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.056"),damage:8,accuracy:3,initiative:1}},
 {id:'field_hunter',name:SOSText("openworld_state_captivity.attrGuide.057"),title:SOSText("openworld_state_captivity.attrGuide.058"),className:SOSText("openworld_state_captivity.attrGuide.059"),fieldOnly:true,desc:SOSText("openworld_state_captivity.attrGuide.060"),role:'archer',cost:0,minRound:1,stats:{str:7,dex:11,con:8,int:7,wis:9,cha:8},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.061"),damage:7,accuracy:6,initiative:5}},
 {id:'field_mender',name:SOSText("openworld_state_captivity.attrGuide.062"),title:SOSText("openworld_state_captivity.attrGuide.063"),className:SOSText("openworld_state_captivity.attrGuide.064"),fieldOnly:true,desc:SOSText("openworld_state_captivity.attrGuide.065"),role:'healer',cost:0,minRound:1,stats:{str:6,dex:8,con:8,int:9,wis:11,cha:9},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.066"),damage:5,accuracy:3,initiative:1}},
 {id:'field_guard',name:SOSText("openworld_state_captivity.attrGuide.067"),title:SOSText("openworld_state_captivity.attrGuide.068"),className:SOSText("openworld_state_captivity.attrGuide.069"),fieldOnly:true,desc:SOSText("openworld_state_captivity.attrGuide.070"),role:'spear',cost:0,minRound:1,stats:{str:9,dex:9,con:10,int:8,wis:8,cha:10},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.071"),damage:8,accuracy:4,initiative:2}}
,
 {id:'field_duelist',name:SOSText("openworld_state_captivity.attrGuide.072"),title:SOSText("openworld_state_captivity.attrGuide.073"),className:SOSText("openworld_state_captivity.attrGuide.074"),fieldOnly:true,fieldKind:'neutral',desc:SOSText("openworld_state_captivity.attrGuide.075"),role:'defector',cost:0,minRound:2,stats:{str:9,dex:11,con:8,int:7,wis:7,cha:9},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.076"),damage:8,accuracy:5,initiative:4},starterGear:{weapon:'starter_sword',armor:'starter_leather'}},
 {id:'field_tracker',name:SOSText("openworld_state_captivity.attrGuide.077"),title:SOSText("openworld_state_captivity.attrGuide.078"),className:SOSText("openworld_state_captivity.attrGuide.079"),fieldOnly:true,fieldKind:'friendly',desc:SOSText("openworld_state_captivity.attrGuide.080"),role:'scout',cost:0,minRound:2,stats:{str:7,dex:12,con:8,int:8,wis:10,cha:7},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.081"),damage:8,accuracy:7,initiative:5},starterGear:{weapon:'starter_bow',armor:'starter_leather'}},
 {id:'field_arcanist',name:SOSText("openworld_state_captivity.attrGuide.082"),title:SOSText("openworld_state_captivity.attrGuide.083"),className:SOSText("openworld_state_captivity.attrGuide.084"),fieldOnly:true,fieldKind:'friendly',desc:SOSText("openworld_state_captivity.attrGuide.085"),role:'healer',cost:0,minRound:3,stats:{str:5,dex:8,con:7,int:12,wis:10,cha:8},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.086"),damage:6,accuracy:5,initiative:2},starterGear:{weapon:'starter_staff',armor:'starter_robe'}},
 {id:'field_sergeant',name:SOSText("openworld_state_captivity.attrGuide.087"),title:SOSText("openworld_state_captivity.attrGuide.088"),className:SOSText("openworld_state_captivity.attrGuide.089"),fieldOnly:true,fieldKind:'friendly',desc:SOSText("openworld_state_captivity.attrGuide.090"),role:'spear',cost:0,minRound:4,stats:{str:9,dex:8,con:11,int:8,wis:9,cha:11},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.091"),damage:9,accuracy:4,initiative:1},starterGear:{weapon:'starter_spear',armor:'starter_mail',offhand:'starter_buckler'}}
,
 {id:'rogue',name:SOSText("openworld_state_captivity.attrGuide.092"),title:SOSText("openworld_state_captivity.attrGuide.093"),className:SOSText("openworld_state_captivity.attrGuide.094"),desc:SOSText("openworld_state_captivity.attrGuide.095"),role:'scout',cost:90,minRound:3,stats:{str:6,dex:12,con:7,int:9,wis:8,cha:9},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.096"),damage:9,accuracy:6,initiative:2},starterGear:{weapon:'light_crossbow',armor:'starter_leather'}},
 {id:'berserker',name:SOSText("openworld_state_captivity.attrGuide.097"),title:SOSText("openworld_state_captivity.attrGuide.098"),className:SOSText("openworld_state_captivity.attrGuide.099"),desc:SOSText("openworld_state_captivity.attrGuide.100"),role:'defector',cost:100,minRound:4,stats:{str:12,dex:8,con:11,int:5,wis:6,cha:7},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.101"),damage:10,accuracy:0,initiative:0},starterGear:{weapon:'raider_axe',armor:'starter_leather'}},
{id:'blue_guide',name:SOSText("openworld_state_captivity.attrGuide.102"),title:SOSText("openworld_state_captivity.attrGuide.103"),className:SOSText("openworld_state_captivity.attrGuide.104"),desc:SOSText("openworld_state_captivity.attrGuide.105"),role:'scout',cost:0,minRound:1,stats:{str:7,dex:12,con:8,int:8,wis:11,cha:8},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.106"),damage:8,accuracy:7,initiative:5},starterGear:{weapon:'starter_bow',armor:'starter_leather'}},
 {id:'blue_quarry',name:SOSText("openworld_state_captivity.attrGuide.107"),title:SOSText("openworld_state_captivity.attrGuide.108"),className:SOSText("openworld_state_captivity.attrGuide.109"),desc:SOSText("openworld_state_captivity.attrGuide.110"),role:'defector',cost:0,minRound:1,stats:{str:11,dex:8,con:11,int:8,wis:9,cha:8},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.111"),damage:9,accuracy:3,initiative:0},starterGear:{weapon:'starter_sword',armor:'starter_mail'}},
 {id:'blue_valley',name:SOSText("openworld_state_captivity.attrGuide.112"),title:SOSText("openworld_state_captivity.attrGuide.113"),className:SOSText("openworld_state_captivity.attrGuide.114"),desc:SOSText("openworld_state_captivity.attrGuide.115"),role:'spear',cost:0,minRound:1,stats:{str:10,dex:8,con:11,int:7,wis:10,cha:10},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.116"),damage:8,accuracy:4,initiative:1},starterGear:{weapon:'starter_spear',armor:'starter_mail',offhand:'starter_buckler'}},
 {id:'blue_signal',name:SOSText("openworld_state_captivity.attrGuide.117"),title:SOSText("openworld_state_captivity.attrGuide.118"),className:SOSText("openworld_state_captivity.attrGuide.119"),desc:SOSText("openworld_state_captivity.attrGuide.120"),role:'healer',cost:0,minRound:1,stats:{str:5,dex:9,con:8,int:12,wis:11,cha:8},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.121"),damage:6,accuracy:5,initiative:2},starterGear:{weapon:'starter_staff',armor:'starter_robe'}},
 {id:'red_adjutant',name:SOSText("openworld_state_captivity.attrGuide.122"),title:SOSText("openworld_state_captivity.attrGuide.123"),className:SOSText("openworld_state_captivity.attrGuide.124"),desc:SOSText("openworld_state_captivity.attrGuide.125"),role:'defector',cost:0,minRound:1,stats:{str:9,dex:8,con:10,int:10,wis:9,cha:11},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.126"),damage:8,accuracy:4,initiative:2},starterGear:{weapon:'starter_sword',armor:'starter_mail'}},
 {id:'red_lockrunner',name:SOSText("openworld_state_captivity.attrGuide.127"),title:SOSText("openworld_state_captivity.attrGuide.128"),className:SOSText("openworld_state_captivity.attrGuide.129"),desc:SOSText("openworld_state_captivity.attrGuide.130"),role:'scout',cost:0,minRound:1,stats:{str:6,dex:12,con:8,int:9,wis:10,cha:9},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.131"),damage:9,accuracy:6,initiative:3},starterGear:{weapon:'light_crossbow',armor:'starter_leather'}},
 {id:'red_grainwarden',name:SOSText("openworld_state_captivity.attrGuide.132"),title:SOSText("openworld_state_captivity.attrGuide.133"),className:SOSText("openworld_state_captivity.attrGuide.134"),desc:SOSText("openworld_state_captivity.attrGuide.135"),role:'spear',cost:0,minRound:1,stats:{str:9,dex:8,con:11,int:8,wis:11,cha:10},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.136"),damage:8,accuracy:4,initiative:1},starterGear:{weapon:'starter_spear',armor:'starter_mail',offhand:'starter_buckler'}},
 {id:'red_firebreak',name:SOSText("openworld_state_captivity.attrGuide.137"),title:SOSText("openworld_state_captivity.attrGuide.138"),className:SOSText("openworld_state_captivity.attrGuide.139"),desc:SOSText("openworld_state_captivity.attrGuide.140"),role:'scout',cost:0,minRound:1,stats:{str:7,dex:12,con:9,int:8,wis:11,cha:8},baseWeapon:{name:SOSText("openworld_state_captivity.attrGuide.141"),damage:8,accuracy:7,initiative:5},starterGear:{weapon:'starter_bow',armor:'starter_leather'}}
];
const STARTER_LOADOUTS={
 spear:{weapon:'starter_spear',armor:'starter_mail',offhand:'starter_buckler'},
 archer:{weapon:'starter_bow',armor:'starter_leather'},
 scout:{weapon:'starter_knife',armor:'starter_leather'},
 healer:{weapon:'starter_staff',armor:'starter_robe'},
 defector:{weapon:'starter_sword',armor:'starter_mail'},
 spawn:{weapon:'starter_sword',armor:'starter_mail',offhand:'starter_buckler'},
 field_sellsword:{weapon:'starter_sword',armor:'starter_leather'},
 field_hunter:{weapon:'starter_bow',armor:'starter_leather'},
 field_mender:{weapon:'starter_staff',armor:'starter_robe'},
 field_guard:{weapon:'starter_spear',armor:'starter_mail'},rogue:{weapon:'light_crossbow',armor:'starter_leather'},berserker:{weapon:'raider_axe',armor:'starter_leather'},
 blue_guide:{weapon:'starter_bow',armor:'starter_leather'},
 blue_quarry:{weapon:'starter_sword',armor:'starter_mail'},
 blue_valley:{weapon:'starter_spear',armor:'starter_mail',offhand:'starter_buckler'},
 blue_signal:{weapon:'starter_staff',armor:'starter_robe'},
 red_adjutant:{weapon:'starter_sword',armor:'starter_mail'},
 red_lockrunner:{weapon:'light_crossbow',armor:'starter_leather'},
 red_grainwarden:{weapon:'starter_spear',armor:'starter_mail',offhand:'starter_buckler'},
 red_firebreak:{weapon:'starter_bow',armor:'starter_leather'}
};
const COMPANION_DATA={
 spear:{trait:SOSText("openworld_state_captivity.attrGuide.142"),perk:SOSText("openworld_state_captivity.attrGuide.143"),lines:[SOSText("openworld_state_captivity.attrGuide.144"),SOSText("openworld_state_captivity.attrGuide.145"),SOSText("openworld_state_captivity.attrGuide.146")]},
 archer:{trait:SOSText("openworld_state_captivity.attrGuide.147"),perk:SOSText("openworld_state_captivity.attrGuide.148"),lines:[SOSText("openworld_state_captivity.attrGuide.149"),SOSText("openworld_state_captivity.attrGuide.150"),SOSText("openworld_state_captivity.attrGuide.151")]},
 scout:{trait:SOSText("openworld_state_captivity.attrGuide.152"),perk:SOSText("openworld_state_captivity.attrGuide.153"),lines:[SOSText("openworld_state_captivity.attrGuide.154"),SOSText("openworld_state_captivity.attrGuide.155"),SOSText("openworld_state_captivity.attrGuide.156")]},
 healer:{trait:SOSText("openworld_state_captivity.attrGuide.157"),perk:SOSText("openworld_state_captivity.attrGuide.158"),lines:[SOSText("openworld_state_captivity.attrGuide.159"),SOSText("openworld_state_captivity.attrGuide.160"),SOSText("openworld_state_captivity.attrGuide.161")]},
 defector:{trait:SOSText("openworld_state_captivity.attrGuide.162"),perk:SOSText("openworld_state_captivity.attrGuide.163"),lines:[SOSText("openworld_state_captivity.attrGuide.164"),SOSText("openworld_state_captivity.attrGuide.165"),SOSText("openworld_state_captivity.attrGuide.166")]},
 spawn:{trait:SOSText("openworld_state_captivity.attrGuide.167"),perk:SOSText("openworld_state_captivity.attrGuide.168"),lines:[SOSText("openworld_state_captivity.attrGuide.169"),SOSText("openworld_state_captivity.attrGuide.170"),SOSText("openworld_state_captivity.attrGuide.171")]},
 field_sellsword:{trait:SOSText("openworld_state_captivity.attrGuide.172"),perk:SOSText("openworld_state_captivity.attrGuide.173"),lines:[SOSText("openworld_state_captivity.attrGuide.174"),SOSText("openworld_state_captivity.attrGuide.175"),SOSText("openworld_state_captivity.attrGuide.176")]},
 field_hunter:{trait:SOSText("openworld_state_captivity.attrGuide.177"),perk:SOSText("openworld_state_captivity.attrGuide.178"),lines:[SOSText("openworld_state_captivity.attrGuide.179"),SOSText("openworld_state_captivity.attrGuide.180"),SOSText("openworld_state_captivity.attrGuide.181")]},
 field_mender:{trait:SOSText("openworld_state_captivity.attrGuide.182"),perk:SOSText("openworld_state_captivity.attrGuide.183"),lines:[SOSText("openworld_state_captivity.attrGuide.184"),SOSText("openworld_state_captivity.attrGuide.185"),SOSText("openworld_state_captivity.attrGuide.186")]},
 field_guard:{trait:SOSText("openworld_state_captivity.attrGuide.187"),perk:SOSText("openworld_state_captivity.attrGuide.188"),lines:[SOSText("openworld_state_captivity.attrGuide.189"),SOSText("openworld_state_captivity.attrGuide.190"),SOSText("openworld_state_captivity.attrGuide.191")]}
,
 field_duelist:{trait:SOSText("openworld_state_captivity.attrGuide.192"),perk:SOSText("openworld_state_captivity.attrGuide.193"),lines:[SOSText("openworld_state_captivity.attrGuide.194"),SOSText("openworld_state_captivity.attrGuide.195")]},
 field_tracker:{trait:SOSText("openworld_state_captivity.attrGuide.196"),perk:SOSText("openworld_state_captivity.attrGuide.197"),lines:[SOSText("openworld_state_captivity.attrGuide.198"),SOSText("openworld_state_captivity.attrGuide.199")]},
 field_arcanist:{trait:SOSText("openworld_state_captivity.attrGuide.200"),perk:SOSText("openworld_state_captivity.attrGuide.201"),lines:[SOSText("openworld_state_captivity.attrGuide.202"),SOSText("openworld_state_captivity.attrGuide.203")]},
 field_sergeant:{trait:SOSText("openworld_state_captivity.attrGuide.204"),perk:SOSText("openworld_state_captivity.attrGuide.205"),lines:[SOSText("openworld_state_captivity.attrGuide.206"),SOSText("openworld_state_captivity.attrGuide.207")]}
};

Object.assign(COMPANION_DATA,{
 blue_guide:{trait:SOSText("openworld_state_captivity.attrGuide.208"),perk:SOSText("openworld_state_captivity.attrGuide.209"),lines:[SOSText("openworld_state_captivity.attrGuide.210"),SOSText("openworld_state_captivity.attrGuide.211"),SOSText("openworld_state_captivity.attrGuide.212")]},
 blue_quarry:{trait:SOSText("openworld_state_captivity.attrGuide.213"),perk:SOSText("openworld_state_captivity.attrGuide.214"),lines:[SOSText("openworld_state_captivity.attrGuide.215"),SOSText("openworld_state_captivity.attrGuide.216"),SOSText("openworld_state_captivity.attrGuide.217")]},
 blue_valley:{trait:SOSText("openworld_state_captivity.attrGuide.218"),perk:SOSText("openworld_state_captivity.attrGuide.219"),lines:[SOSText("openworld_state_captivity.attrGuide.220"),SOSText("openworld_state_captivity.attrGuide.221"),SOSText("openworld_state_captivity.attrGuide.222")]},
 blue_signal:{trait:SOSText("openworld_state_captivity.attrGuide.223"),perk:SOSText("openworld_state_captivity.attrGuide.224"),lines:[SOSText("openworld_state_captivity.attrGuide.225"),SOSText("openworld_state_captivity.attrGuide.226"),SOSText("openworld_state_captivity.attrGuide.227")]},
 red_adjutant:{trait:SOSText("openworld_state_captivity.attrGuide.228"),perk:SOSText("openworld_state_captivity.attrGuide.229"),lines:[SOSText("openworld_state_captivity.attrGuide.230"),SOSText("openworld_state_captivity.attrGuide.231"),SOSText("openworld_state_captivity.attrGuide.232")]},
 red_lockrunner:{trait:SOSText("openworld_state_captivity.attrGuide.233"),perk:SOSText("openworld_state_captivity.attrGuide.234"),lines:[SOSText("openworld_state_captivity.attrGuide.235"),SOSText("openworld_state_captivity.attrGuide.236"),SOSText("openworld_state_captivity.attrGuide.237")]},
 red_grainwarden:{trait:SOSText("openworld_state_captivity.attrGuide.238"),perk:SOSText("openworld_state_captivity.attrGuide.239"),lines:[SOSText("openworld_state_captivity.attrGuide.240"),SOSText("openworld_state_captivity.attrGuide.241"),SOSText("openworld_state_captivity.attrGuide.242")]},
 red_firebreak:{trait:SOSText("openworld_state_captivity.attrGuide.243"),perk:SOSText("openworld_state_captivity.attrGuide.244"),lines:[SOSText("openworld_state_captivity.attrGuide.245"),SOSText("openworld_state_captivity.attrGuide.246"),SOSText("openworld_state_captivity.attrGuide.247")]}
});
const COMPANION_STORIES={
 spear:{title:SOSText("openworld_state_captivity.attrGuide.248"),text:SOSText("openworld_state_captivity.attrGuide.249"),choices:[[SOSText("openworld_state_captivity.attrGuide.250"),SOSText("openworld_state_captivity.attrGuide.251"),'militia'],[SOSText("openworld_state_captivity.attrGuide.252"),SOSText("openworld_state_captivity.attrGuide.253"),'self']]},
 archer:{title:SOSText("openworld_state_captivity.attrGuide.254"),text:SOSText("openworld_state_captivity.attrGuide.255"),choices:[[SOSText("openworld_state_captivity.attrGuide.256"),SOSText("openworld_state_captivity.attrGuide.257"),'belong'],[SOSText("openworld_state_captivity.attrGuide.258"),SOSText("openworld_state_captivity.attrGuide.259"),'professional']]},
 scout:{title:SOSText("openworld_state_captivity.attrGuide.260"),text:SOSText("openworld_state_captivity.attrGuide.261"),choices:[[SOSText("openworld_state_captivity.attrGuide.262"),SOSText("openworld_state_captivity.attrGuide.263"),'coalition'],[SOSText("openworld_state_captivity.attrGuide.264"),SOSText("openworld_state_captivity.attrGuide.265"),'shantium']]},
 healer:{title:SOSText("openworld_state_captivity.attrGuide.266"),text:SOSText("openworld_state_captivity.attrGuide.267"),choices:[[SOSText("openworld_state_captivity.attrGuide.268"),SOSText("openworld_state_captivity.attrGuide.269"),'mercy'],[SOSText("openworld_state_captivity.attrGuide.270"),SOSText("openworld_state_captivity.attrGuide.271"),'reserve']]},
 defector:{title:SOSText("openworld_state_captivity.attrGuide.272"),text:SOSText("openworld_state_captivity.attrGuide.273"),choices:[[SOSText("openworld_state_captivity.attrGuide.274"),SOSText("openworld_state_captivity.attrGuide.275"),'open'],[SOSText("openworld_state_captivity.attrGuide.276"),SOSText("openworld_state_captivity.attrGuide.277"),'burn']]},
 spawn:{title:SOSText("openworld_state_captivity.attrGuide.278"),text:SOSText("openworld_state_captivity.attrGuide.279"),choices:[[SOSText("openworld_state_captivity.attrGuide.280"),SOSText("openworld_state_captivity.attrGuide.281"),'gate'],[SOSText("openworld_state_captivity.attrGuide.282"),SOSText("openworld_state_captivity.attrGuide.283"),'company']]},
 field_sellsword:{title:SOSText("openworld_state_captivity.attrGuide.284"),text:SOSText("openworld_state_captivity.attrGuide.285"),choices:[[SOSText("openworld_state_captivity.attrGuide.286"),SOSText("openworld_state_captivity.attrGuide.287"),'stay'],[SOSText("openworld_state_captivity.attrGuide.288"),SOSText("openworld_state_captivity.attrGuide.289"),'contract']]},
 field_hunter:{title:SOSText("openworld_state_captivity.attrGuide.290"),text:SOSText("openworld_state_captivity.attrGuide.291"),choices:[[SOSText("openworld_state_captivity.attrGuide.292"),SOSText("openworld_state_captivity.attrGuide.293"),'scouts'],[SOSText("openworld_state_captivity.attrGuide.294"),SOSText("openworld_state_captivity.attrGuide.295"),'company']]},
 field_mender:{title:SOSText("openworld_state_captivity.attrGuide.296"),text:SOSText("openworld_state_captivity.attrGuide.297"),choices:[[SOSText("openworld_state_captivity.attrGuide.298"),SOSText("openworld_state_captivity.attrGuide.299"),'town'],[SOSText("openworld_state_captivity.attrGuide.300"),SOSText("openworld_state_captivity.attrGuide.301"),'field']]},
 field_guard:{title:SOSText("openworld_state_captivity.attrGuide.302"),text:SOSText("openworld_state_captivity.attrGuide.303"),choices:[[SOSText("openworld_state_captivity.attrGuide.304"),SOSText("openworld_state_captivity.attrGuide.305"),'strict'],[SOSText("openworld_state_captivity.attrGuide.306"),SOSText("openworld_state_captivity.attrGuide.307"),'adapt']]}
};
const NEUTRAL_ENCOUNTERS=[
 {allyId:'field_sellsword',name:SOSText("openworld_state_captivity.attrGuide.308"),faction:SOSText("openworld_state_captivity.attrGuide.309"),text:SOSText("openworld_state_captivity.attrGuide.310"),militia:5},
 {allyId:'field_hunter',name:SOSText("openworld_state_captivity.attrGuide.311"),faction:SOSText("openworld_state_captivity.attrGuide.312"),text:SOSText("openworld_state_captivity.attrGuide.313"),militia:4},
 {allyId:'field_mender',name:SOSText("openworld_state_captivity.attrGuide.314"),faction:SOSText("openworld_state_captivity.attrGuide.315"),text:SOSText("openworld_state_captivity.attrGuide.316"),militia:2},
 {allyId:'field_guard',name:SOSText("openworld_state_captivity.attrGuide.317"),faction:SOSText("openworld_state_captivity.attrGuide.318"),text:SOSText("openworld_state_captivity.attrGuide.319"),militia:6}
];

const FIELD_ENCOUNTER_TEMPLATES=[
 {id:'neutral_sellswords',kind:'neutral',name:SOSText("openworld_state_captivity.attrGuide.320"),allyId:'field_sellsword',text:SOSText("openworld_state_captivity.attrGuide.321"),minRound:1},
 {id:'neutral_woodsfolk',kind:'neutral',name:SOSText("openworld_state_captivity.attrGuide.322"),allyId:'field_hunter',text:SOSText("openworld_state_captivity.attrGuide.323"),minRound:1},
 {id:'neutral_healers',kind:'neutral',name:SOSText("openworld_state_captivity.attrGuide.324"),allyId:'field_mender',text:SOSText("openworld_state_captivity.attrGuide.325"),minRound:2},
 {id:'neutral_freeblade',kind:'neutral',name:SOSText("openworld_state_captivity.attrGuide.326"),allyId:'field_duelist',text:SOSText("openworld_state_captivity.attrGuide.327"),minRound:2},
 {id:'friendly_tracker',kind:'friendly',name:SOSText("openworld_state_captivity.attrGuide.328"),allyId:'field_tracker',text:SOSText("openworld_state_captivity.attrGuide.329"),minRound:2,rescue:true},
 {id:'friendly_arcanist',kind:'friendly',name:SOSText("openworld_state_captivity.attrGuide.330"),allyId:'field_arcanist',text:SOSText("openworld_state_captivity.attrGuide.331"),minRound:3,rescue:true},
 {id:'friendly_sergeant',kind:'friendly',name:SOSText("openworld_state_captivity.attrGuide.332"),allyId:'field_sergeant',text:SOSText("openworld_state_captivity.attrGuide.333"),minRound:4,rescue:true},
 {id:'friendly_guard',kind:'friendly',name:SOSText("openworld_state_captivity.attrGuide.334"),allyId:'field_guard',text:SOSText("openworld_state_captivity.attrGuide.335"),minRound:3,rescue:true}
];

function resolveFieldEncounterOnce(id){if(!id)return;state.fieldEncounters=state.fieldEncounters.filter(e=>e.id!==id);save()}
function spawnFieldEncounters(round){if(state.fieldEncounters?.length)return;if(!state.fieldEncounters)state.fieldEncounters=[];state.fieldEncounters=state.fieldEncounters.filter(e=>!e.expires||e.expires>=round);const eligible=FIELD_ENCOUNTER_TEMPLATES.filter(t=>t.minRound<=round&&!state.allies.includes(t.allyId)&&!state.fieldEncounters.some(e=>e.template===t.id));if(!eligible.length)return;const count=chance(.55)?1:(chance(.2)?2:0);for(let i=0;i<count&&eligible.length;i++){const t=pick(eligible),ix=eligible.indexOf(t);eligible.splice(ix,1);const route=pick(ROUTES);state.fieldEncounters.push({id:uid(),template:t.id,kind:t.kind,name:t.name,allyId:t.allyId,text:t.text,rescue:!!t.rescue,route:route.id,distance:rnd(2,5),expires:round+rnd(1,2)})}}

function fieldTemplate(e){return FIELD_ENCOUNTER_TEMPLATES.find(t=>t.id===e.template)||e}
