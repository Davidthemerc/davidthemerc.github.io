/* Siege of Shantium subsystem service boundaries.
   These facades are deliberately small. Gameplay modules should prefer them
   when crossing subsystem ownership boundaries rather than reaching directly
   into another subsystem's state/functions. */
const SOSServices=Object.freeze({
 state:Object.freeze({
  save:()=>save(),
  normalize:()=>normalize(),
  ensureWorld:()=>ensureWorldState(),
  ensureHall:()=>ensureHomeBase(),
  isOpenWorld:()=>isOpenWorld(),
  current:()=>state
 }),
 navigation:Object.freeze({
  back:(fallback)=>modalNavBackOrFallback(fallback),
  backOrExit:()=>navigationBackOrExit(),
  replace:(fn,...args)=>modalNavReplaceWith(fn,...args),
  result:(title,text,tone='info',after=null)=>actionResult(title,text,tone,after),
  reset:()=>resetModalNavigation(),
  renderGame:()=>renderGame(),
  renderOpenWorld:()=>renderOpenWorld()
 }),
 companions:Object.freeze({
  activeRoad:()=>activeRoadCompanions(),
  activeParty:()=>partyMembers(true),
  all:()=>partyMembers(false),
  adjustTrust:(id,delta,reason)=>adjustTrust(id,delta,reason),
  noteSharedEvent:(kind,text,ids=null)=>noteCompanionSharedEvent(kind,text,ids),
  leftBehind:(prep)=>politicalCompanionsLeftBehind(prep),
  participantIds:(prep)=>politicalCompanionsLeftBehind(prep)?[]:[...(state.party?.active||[])]
 }),
 combat:Object.freeze({
  setParticipants:(group,ids)=>{
   ensurePartyState();
   group.combatPartyIds=[...(ids||[])];
   if(group.politicalOperation)group.politicalOperation.companionIds=[...group.combatPartyIds];
   return group
  },
  launch:(group,{register=true,closeOverlay:shouldClose=true}={})=>{
   ensurePartyState();
   if(register&&!state.groups.includes(group))state.groups.push(group);
   if(shouldClose)closeOverlay();
   beginCombat(group);
   return group
  },
  participants:(group)=>Array.isArray(group?.combatPartyIds)?[...group.combatPartyIds]:[...(state.party?.active||[])]
 }),
 politics:Object.freeze({
  snapshot:(locId,factions)=>politicalOutcomeSnapshot(locId,factions),
  localFactionState:(locId,faction)=>localPoliticalFactionState(locId,faction),
  protectedCrime:(kind,locId,victimFaction,sponsor,opts={})=>politicallyProtectedCrime(kind,locId,victimFaction,sponsor,opts),
  localGuardianRelation:(locId,faction)=>localGuardianFactionRelation(locId,faction),
  adjustLocalGuardianRelation:(locId,faction,delta,reason='')=>adjustLocalGuardianFactionRelation(locId,faction,delta,reason),
  recordGuardianIncident:(locId,faction,text,opts={})=>recordGuardianFactionIncident(locId,faction,text,opts),
  guardianCaravanViolence:(conflict,opts={})=>applyGuardianCaravanViolenceConsequences(conflict,opts)
 }),
 hallFinance:Object.freeze({
  operatingDebit:(amount,category,text)=>homeFinanceDebit(amount,category,text),
  capitalDebit:(amount,category,text)=>homeFinanceCapitalDebit(amount,category,text),
  credit:(amount,category,text)=>homeFinanceCredit(amount,category,text),
  transferFromGuardian:(amount)=>homeFinanceTransfer(amount),
  window:(days)=>homeFinanceWindow(days),
  state:()=>homeFinanceState()
 }),
 hall:Object.freeze({
  lodgingSnapshot:(size=0)=>homeLodgingCapacitySnapshot(size),
  outstandingRequests:()=>homeOutstandingProcurementRequests(),
  markRequestHandled:(id)=>homeRequestMailHandled(id),
  supplyAverage:()=>homeSupplyAverage()
 }),
 contracts:Object.freeze({
  active:()=>activeQuest(),
  activeEscort:()=>activeEscortQuest(),
  party:(quest)=>contractParty(quest),
  objective:(quest)=>contractObjective(quest),
  issuerName:(quest)=>contractIssuerName(quest),
  targetName:(quest)=>contractTargetName(quest)
 }),
 world:Object.freeze({
  history:(text,tone='info',category='world')=>recordWorldHistory(text,tone,category),
  travel:(locId)=>attemptWorldTravel(locId),
  location:(locId)=>worldLocation(locId),
  settlement:(locId)=>settlementState(locId),
  settlementSnapshot:(locId)=>worldSettlementSnapshot(locId),
  regionSnapshot:(region)=>worldRegionSnapshot(region),
  consolidate:(force=false)=>consolidateWorldSystems(force)
 }),
 queries:Object.freeze({settlement:(locId)=>worldSettlementSnapshot(locId),region:(region=currentWorldRegion())=>worldRegionSnapshot(region),hall:()=>worldHallSnapshot(),journal:()=>worldJournalSnapshot(),situationHTML:(region=currentWorldRegion(),compact=false)=>worldSituationSummaryHTML(region,compact),incidents:(filter={})=>worldOpenIncidents(filter),dispatches:(filter={})=>worldActiveDispatches(filter),audit:(repair=true)=>worldIntegrationAudit(repair)}),
 actors:Object.freeze({ref:(kind,id,opts={})=>worldActorRef(kind,id,opts),resolve:(ref)=>resolveWorldActor(ref),sync:()=>syncWorldActorRegistry(),all:()=>Object.values(worldIntegrationState().actors)}),
 matters:Object.freeze({create:(type,opts={})=>createWorldMatter(type,opts),update:(id,patch={})=>updateWorldMatter(id,patch),active:(filter={})=>activeWorldMatters(filter),settlement:(locId)=>worldMatterForSettlementProblem(locId),workOffers:(matterId=null)=>activeWorldWorkOffers(matterId),link:(matterId,channel,sourceId,opts={})=>createWorldWorkOffer(matterId,channel,sourceId,opts)}),
 effects:Object.freeze({apply:(effects,context={})=>applyWorldEffects(effects,context),history:()=>[...worldIntegrationState().effects]}),
 attention:Object.freeze({register:(kind,sourceId,opts={})=>registerAttention(kind,sourceId,opts),resolve:(id)=>resolveAttention(id),open:(filter={})=>openAttention(filter),sync:()=>syncWorldAttentionRegistry()}),
 dispatch:Object.freeze({create:(kind,opts={})=>createWorldDispatch(kind,opts),get:(id)=>worldDispatch(id),arrived:(id)=>worldDispatchArrived(id),complete:(id,status='completed',meta={})=>completeWorldDispatch(id,status,meta),active:()=>Object.values(worldIntegrationState().dispatches).filter(d=>d.status==='traveling')}),
 intel:Object.freeze({create:(type,opts={})=>createWorldIntel(type,opts),gain:(amount=1,opts={})=>gainScoutingIntel(amount,opts),active:(filter={})=>activeWorldIntel(filter),reliability:(intel)=>worldIntelReliability(intel)}),
 incidents:Object.freeze({create:(type,opts={})=>createWorldIncident(type,opts),get:(id)=>worldIncident(id),actor:(id,ref,opts={})=>worldIncidentActor(id,ref,opts),witness:(id,ref,opts={})=>worldIncidentWitness(id,ref,opts),outcome:(id,ref,outcome,opts={})=>worldIncidentOutcome(id,ref,outcome,opts),update:(id,patch={})=>updateWorldIncident(id,patch),resolve:(id,resolution={})=>resolveWorldIncident(id,resolution),summary:(id)=>incidentOutcomeSummary(id),open:()=>Object.values(worldIntegrationState().incidents).filter(i=>i.status==='open')}),
 resources:Object.freeze({sources:(kind,id,locId=state.world.location,opts={})=>worldResourceSources(kind,id,locId,opts),count:(kind,id,locId=state.world.location,opts={})=>worldResourceCount(kind,id,locId,opts),consume:(kind,id,qty=1,opts={})=>worldResourceConsume(kind,id,qty,opts),transfer:(kind,id,qty,from,to,opts={})=>worldResourceTransfer(kind,id,qty,from,to,opts),history:()=>[...worldIntegrationState().resources.history]}),
 accounts:Object.freeze({balance:(id)=>worldAccountBalance(id),credit:(id,amount,opts={})=>worldAccountCredit(id,amount,opts),debit:(id,amount,opts={})=>worldAccountDebit(id,amount,opts),transfer:(from,to,amount,opts={})=>worldAccountTransfer(from,to,amount,opts),snapshot:()=>worldAccountsSnapshot(),transactions:()=>[...worldIntegrationState().transactions]}),
 accommodation:Object.freeze({provider:(locId,kind='local',size=1,opts={})=>worldAccommodationProvider(locId,kind,size,opts),providers:(locId,size=1,purpose='visitor')=>worldAccommodationProviders(locId,size,purpose),record:(provider,opts={})=>worldAccommodationRecord(provider,opts),history:()=>[...worldIntegrationState().accommodation.stays]}),
 diagnostics:Object.freeze({
  architecture:()=>({
   version:VERSION,
   serviceLayer:true,
   worldIntegrationSchema:typeof defaultWorldIntegrationState==='function'?worldIntegrationState().schemaVersion:null,
   languageCatalog:typeof SOS_LANGUAGE==='object',
   openWorldActions:typeof openWorldActionsHTML==='function',
   guardianHall:{
    office:typeof showGuardianOffice==='function',
    trainingYard:typeof showHomeTrainingYard==='function',
    archives:typeof showHomeArchives==='function',
    infirmary:typeof showHomeInfirmary==='function'
   },
   criticalGlobals:{
    factions:typeof OPEN_WORLD_FACTIONS==='object',
    factionRelations:typeof FACTION_RELATION_DEFAULTS==='object'
   }
  }),
  state:()=>state?{
   mode:state.mode,
   day:state.world?.day??null,
   location:state.world?.location??null,
   partyTotal:state.allies?.length||0,
   partyActive:state.party?.active?.length||0,
   hallBudget:state.world?.homeBase?.logistics?.budget??null,
   hallFood:state.world?.homeBase?.logistics?.supplies?.food??null,
   politicalSettlements:Object.keys(state.world?.politics?.settlements||{}).length
  }:null
 })
});
