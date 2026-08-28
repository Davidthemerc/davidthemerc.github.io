function ensureRegionalSimulation(){ensureWorldState();const r=state.world.regionalSimulation||(state.world.regionalSimulation={threads:[],flows:[],routePressure:{},lastResponseDay:{}});if(!Array.isArray(r.threads))r.threads=[];if(!Array.isArray(r.flows))r.flows=[];if(!r.routePressure)r.routePressure={};if(!r.lastResponseDay)r.lastResponseDay={};if(!Array.isArray(r.opportunities))r.opportunities=[];if(!Array.isArray(r.interventions))r.interventions=[];return r}
function regionalSettlements(region=null){return WORLD_LOCATIONS.filter(x=>state.world.settlements?.[x.id]&&(!region||locationRegion(x)===region))}

function regionalEvidenceState(){const r=ensureRegionalSimulation();if(!r.evidence)r.evidence={settlements:{},routes:{},history:[]};return r.evidence}
function addSettlementEvidence(locId,text,type='info',days=4){
 const E=regionalEvidenceState();if(!E.settlements[locId])E.settlements[locId]=[];const row={id:uid(),day:state.world.day,expiresDay:state.world.day+days,text,type};E.settlements[locId].push(row);E.settlements[locId]=E.settlements[locId].slice(-10);E.history.push({...row,locId});E.history=E.history.slice(-80);return row
}
function settlementEvidence(locId){const E=regionalEvidenceState();return (E.settlements[locId]||[]).filter(x=>x.expiresDay>=state.world.day)}
function routeEvidenceKey(a,b){return routePressureKey(a,b)}
function updateRouteEvidence(a,b,reason=''){
 if(!a||!b||a===b)return;const E=regionalEvidenceState(),k=routeEvidenceKey(a,b),p=routePressure(a,b);let status=p>=7?'dangerous':p>=4?'risky':p>=1?'watched':'open';
 E.routes[k]={a,b,status,pressure:p,lastDay:state.world.day,reason};return E.routes[k]
}
function routeEvidence(a,b){const k=routeEvidenceKey(a,b),E=regionalEvidenceState();return E.routes[k]||updateRouteEvidence(a,b)}
function routeConditionText(a,b){
 const r=routeEvidence(a,b);return r.status==='dangerous'?'Travelers report repeated attacks and some caravans are avoiding this road.':r.status==='risky'?'The road is still used, but guards and merchants are treating it cautiously.':r.status==='watched'?'There are recent signs of trouble, though traffic continues.':SOSText("world_regional_simulation.routeConditionText.001")
}
function recentRegionalEvidence(limit=12){return regionalEvidenceState().history.filter(x=>x.expiresDay>=state.world.day-2).slice(-limit).reverse()}
function clearExpiredRegionalEvidence(){
 const E=regionalEvidenceState();for(const id of Object.keys(E.settlements))E.settlements[id]=E.settlements[id].filter(x=>x.expiresDay>=state.world.day)
}
function merchantDeliveryEffect(p,locId,origin){
 const ss=settlementState(locId),before=ss.prosperity;recordTradeDelivery(p,locId);ss.prosperity=Math.min(100,ss.prosperity+2);state.world.marketShock=state.world.marketShock||{};state.world.localStockDay=state.world.localStockDay||{};state.world.marketShock[locId]=Math.max(0,(state.world.marketShock[locId]||0)-.08);
 state.world.localStockDay[locId]=0;const cargoText=manifestText(p.manifest);addSettlementEvidence(locId,SOSText("world_regional_simulation.merchantDeliveryEffect.001",p.name,cargoText),'good',4);
 if(origin&&origin!==locId)addSettlementEvidence(origin,SOSText("world_regional_simulation.merchantDeliveryEffect.002",p.name,worldLocation(locId).name),'good',3);
 if(OPEN_WORLD_FACTIONS[p.faction])recordFactionPower(locId,p.faction,'trade',1,SOSText("world_regional_simulation.merchantDeliveryEffect.003",p.name),5);const problem=settlementProblem(locId);if(problem?.type==='shortage'&&Object.keys(p.manifest||{}).some(id=>['food','medicine','tools'].includes(id)))progressSettlementProblem(locId,1,SOSText("world_regional_simulation.merchantDeliveryEffect.004",p.name));
 return ss.prosperity-before
}
function refugeeArrivalEffect(p,locId,origin){
 const ss=settlementState(locId);ss.prosperity=Math.max(0,ss.prosperity-1);if(ss.security<55)ss.security=Math.max(0,ss.security-1);
 addSettlementEvidence(locId,SOSText("world_regional_simulation.refugeeArrivalEffect.001",p.name,origin?worldLocation(origin).name:'the roads'),'info',5);
 if(origin)addSettlementEvidence(origin,SOSText("world_regional_simulation.refugeeArrivalEffect.002",worldLocation(locId).name),'bad',4)
}
function patrolArrivalEffect(p,locId,origin){
 const ss=settlementState(locId);ss.security=Math.min(100,ss.security+3);if(origin)reduceRoutePressure(origin,locId,2);
 let suppressed=null;const hostile=state.world.parties.filter(x=>!x.contractProtected&&['bandits','raiders'].includes(x.kind)&&(x.location===locId||x.destination===locId));
 if(hostile.length&&chance(.45)){suppressed=pick(hostile);if(chance(.78)){suppressed.origin=locId;suppressed.location=locId;suppressed.destination=purposefulDestination(suppressed.kind,locId);suppressed.travelTotal=suppressed.travelLeft=Math.max(1,worldTravelDays(locId,suppressed.destination));regionalFlow('security',locId,suppressed.destination,SOSText("world_regional_simulation.patrolArrivalEffect.001",suppressed.name,worldLocation(locId).name),suppressed.id)}else{removeWorldParty(suppressed.id);regionalFlow('security',locId,locId,SOSText("world_regional_simulation.patrolArrivalEffect.002",p.name,suppressed.name,worldLocation(locId).name))}}
 recordFactionPower(locId,p.faction,'security',2,SOSText("world_regional_simulation.patrolArrivalEffect.003",p.name),6);addSettlementEvidence(locId,SOSText("world_regional_simulation.patrolArrivalEffect.004",p.name,suppressed?` ${suppressed.name} has been pushed away from the area.`:''),'good',4)
}
function simulateRegionalRaidDamage(){
 const day=state.world.day;
 for(const loc of regionalSettlements()){
  // A hostile party must actually be at the settlement to disrupt its local economy.
  // Merely traveling toward a settlement no longer counts as an active raid.
  const hostile=state.world.parties.filter(p=>['bandits','raiders'].includes(p.kind)&&p.location===loc.id&&day-(p.lastEconomicRaidDay||-99)>=3);
  if(!hostile.length)continue;
  const ss=settlementState(loc.id),guards=state.world.parties.filter(p=>['coalition','redstone','bluestone','mercenary'].includes(p.kind)&&p.location===loc.id).length;
  const capital=!!regionalCapitalDef(loc.id),risk=clamp(.055+(55-ss.security)/320+Math.min(2,hostile.length)*.025-Math.min(.08,guards*.035)-(capital?.035:0),capital?.01:.025,capital?.10:.20);
  if(!chance(risk))continue;
  const raider=pick(hostile),hitGood=pick(TRADE_GOODS),veryWeak=ss.security<22,loss=(veryWeak&&raider.kind==='raiders'&&chance(.22))?2:1;
  changeTradeStock(loc.id,hitGood.id,-rnd(1,2));
  ss.prosperity=Math.max(0,ss.prosperity-loss);
  if(veryWeak&&chance(.45))ss.security=Math.max(0,ss.security-1);
  ss.lastRaidDamageDay=day;
  raider.lastEconomicRaidDay=day;
  state.world.marketShock=state.world.marketShock||{};
  state.world.marketShock[loc.id]=Math.min(.35,(state.world.marketShock[loc.id]||0)+.025);
  addRoutePressure(raider.origin||loc.id,loc.id,1);
  addSettlementEvidence(loc.id,SOSText("world_regional_simulation.simulateRegionalRaidDamage.001",raider.name,hitGood.name.toLowerCase()),'bad',4);
  recordWorldHistory(SOSText("world_regional_simulation.simulateRegionalRaidDamage.002",loc.name,loss,raider.name),'bad',SOSText("world_regional_simulation.simulateRegionalRaidDamage.003"))
 }
}
function simulateRefugeeIntegration(){
 for(const loc of regionalSettlements()){const p=settlementProblem(loc.id),ss=settlementState(loc.id);if(p?.type==='refugee_load'&&p.progress>=2&&chance(.22)){ss.prosperity=Math.min(100,ss.prosperity+1);progressSettlementProblem(loc.id,1,SOSText("world_regional_simulation.simulateRefugeeIntegration.001"));addSettlementEvidence(loc.id,SOSText("world_regional_simulation.simulateRefugeeIntegration.002"),'good',4)}}
}
function simulateFactionPersonnelShift(){
 const candidates=[
  ['north_scout','northgate',SOSText("world_regional_simulation.simulateFactionPersonnelShift.001")],['north_clerk','northgate',SOSText("world_regional_simulation.simulateFactionPersonnelShift.002")],
  ['red_engineer','redoubt',SOSText("world_regional_simulation.simulateFactionPersonnelShift.003")],['red_supplier','redoubt',SOSText("world_regional_simulation.simulateFactionPersonnelShift.004")],
  ['stone_guard','stonebridge',SOSText("world_regional_simulation.simulateFactionPersonnelShift.005")],['sh_watch','shantium',SOSText("world_regional_simulation.simulateFactionPersonnelShift.006")]
 ];
 if(!chance(.16))return;
 const needy=regionalSettlements().filter(l=>{const p=settlementProblem(l.id);return p&&['raider_pressure','watch_shortage','trade_slump','shortage'].includes(p.type)});if(!needy.length)return;
 const target=pick(needy),cand=pick(candidates.filter(([id,home])=>home!==target.id&&!state.world.npcMovements[id]));if(!cand)return;
 const [id,home,faction]=cand,npc=settlementNpc(home,id);state.world.npcMovements[id]={location:target.id,home,untilDay:state.world.day+rnd(2,4),regionalReason:SOSText("world_regional_simulation.simulateFactionPersonnelShift.007",settlementProblem(target.id).title)};
 regionalFlow('personnel',home,target.id,SOSText("world_regional_simulation.simulateFactionPersonnelShift.008",npc?.name||id,worldLocation(home).name,target.name));
 addSettlementEvidence(target.id,SOSText("world_regional_simulation.simulateFactionPersonnelShift.009",npc?.name||id,worldLocation(home).name,settlementProblem(target.id).title.toLowerCase()),'info',4);
 if(OPEN_WORLD_FACTIONS[faction]){recordFactionPower(target.id,faction,'personnel',1,SOSText("world_regional_simulation.simulateFactionPersonnelShift.010",npc?.name||id),5);addPoliticalPressure(target.id,faction,.25,SOSText("world_regional_simulation.simulateFactionPersonnelShift.011"))}
}
function decayRegionalMarketShock(){
 state.world.marketShock=state.world.marketShock||{};
 for(const id of Object.keys(state.world.marketShock)){
  state.world.marketShock[id]=Math.max(0,(state.world.marketShock[id]||0)-.02);
  if(state.world.marketShock[id]<=.001)delete state.world.marketShock[id]
 }
}
function simulateTradeEconomyDay(){
 for(const loc of regionalSettlements()){const stock=ensureTradeStock(loc.id),problem=settlementProblem(loc.id);for(const g of TRADE_GOODS){const role=tradeGoodRole(loc.id,g.id);if(role==='source'&&chance(.68))changeTradeStock(loc.id,g.id,1);if(role==='demand'&&chance(.46))changeTradeStock(loc.id,g.id,-1);if(problem?.type==='shortage'&&['food','medicine','tools'].includes(g.id)&&chance(.35))changeTradeStock(loc.id,g.id,-1)}}
 const T=tradeEconomyState();for(const id of Object.keys(T.intel)){if(state.world.day-(T.intel[id]?.day||0)>12)delete T.intel[id]}
}
function simulateRegionalConsequencesII(){
 clearExpiredRegionalEvidence();decayRegionalMarketShock();capitalSecurityDailyTick();simulateTradeEconomyDay();simulateRegionalRaidDamage();simulateRefugeeIntegration();simulateFactionPersonnelShift();
 const E=regionalEvidenceState();for(const [k,v] of Object.entries(ensureRegionalSimulation().routePressure)){const [a,b]=k.split('|');updateRouteEvidence(a,b,SOSText("world_regional_simulation.simulateRegionalConsequencesII.001"))}
}
function regionalFlow(type,from,to,text,partyId=null){
 const r=ensureRegionalSimulation(),flow={id:uid(),day:state.world.day,type,from,to,text,partyId};r.flows.push(flow);r.flows=r.flows.slice(-40);return flow
}
function regionalThread(kind,from,to,title,text){
 const r=ensureRegionalSimulation(),existing=r.threads.find(t=>t.status==='active'&&t.kind===kind&&t.from===from&&t.to===to);if(existing){existing.lastDay=state.world.day;existing.notes.push(text);existing.notes=existing.notes.slice(-6);return existing}
 const t={id:uid(),kind,from,to,title,text,status:'active',stage:1,startDay:state.world.day,lastDay:state.world.day,notes:[text],resolution:null};r.threads.push(t);r.threads=r.threads.slice(-30);recordWorldHistory(SOSText("world_regional_simulation.regionalThread.001",title,text),'info',SOSText("world_regional_simulation.regionalThread.002"));return t
}
function activeRegionalThreads(){return ensureRegionalSimulation().threads.filter(t=>t.status==='active')}
function regionalThreadAt(locId){return activeRegionalThreads().filter(t=>t.from===locId||t.to===locId)}
function regionalThreadAdvance(kind,locId,note,complete=false,origin=null){
 const matches=activeRegionalThreads().filter(x=>x.kind===kind&&x.to===locId&&(!origin||x.from===origin));
 for(const t of matches){t.stage++;t.lastDay=state.world.day;t.notes.push(note);t.notes=t.notes.slice(-6);if(complete){t.status='resolved';t.resolvedDay=state.world.day;t.resolution=note;recordWorldHistory(SOSText("world_regional_simulation.regionalThreadAdvance.001",t.title,note),'good',SOSText("world_regional_simulation.regionalThreadAdvance.002"))}}
}
function regionalThreadCleanup(){
 for(const t of activeRegionalThreads()){const age=state.world.day-(t.startDay||state.world.day);
  if(t.kind==='supply'&&!settlementProblem(t.to)){t.status='resolved';t.resolvedDay=state.world.day;t.resolution=SOSText("world_regional_simulation.regionalThreadCleanup.001",worldLocation(t.to).name)}
  else if(t.kind==='security'&&!settlementProblem(t.to)){t.status='resolved';t.resolvedDay=state.world.day;t.resolution=SOSText("world_regional_simulation.regionalThreadCleanup.002",worldLocation(t.to).name)}
  else if(t.kind==='displacement'&&age>=7){t.status='resolved';t.resolvedDay=state.world.day;t.resolution=SOSText("world_regional_simulation.regionalThreadCleanup.003",worldLocation(t.to).name)}
  else if(['supply','security'].includes(t.kind)&&age>=12){t.status='resolved';t.resolvedDay=state.world.day;t.resolution=SOSText("world_regional_simulation.regionalThreadCleanup.004")}
 }
 const r=ensureRegionalSimulation();if(r.threads.length>40)r.threads=r.threads.slice(-40)
}
function bestReliefDestination(from,kind='merchant'){
 const candidates=regionalSettlements(locationRegion(from)).filter(x=>x.id!==from);
 const scored=candidates.map(x=>{const ss=settlementState(x.id),p=settlementProblem(x.id);let score=0;
   if(kind==='merchant'){score+=(100-ss.prosperity)/14;if(p&&['shortage','trade_slump'].includes(p.type))score+=9}
   if(kind==='refugees'){score+=ss.security/18+ss.prosperity/25;if(p)score-=5}
   if(kind==='patrol'){score+=(100-ss.security)/14;if(p&&['raider_pressure','watch_shortage'].includes(p.type))score+=10}
   return {id:x.id,score:score+Math.random()*2}
 }).sort((a,b)=>b.score-a.score);
 return scored[0]?.id||purposefulDestination(kind,from)
}
function regionalDestinationForParty(kind,from){
 if(kind==='merchant'&&chance(.62))return bestReliefDestination(from,'merchant');
 if(kind==='refugees')return bestReliefDestination(from,'refugees');
 if(['coalition','redstone','bluestone'].includes(kind)&&chance(.48))return bestReliefDestination(from,'patrol');
 return null
}
function routePressureKey(a,b){return[a,b].sort().join('|')}
function addRoutePressure(a,b,amt=1){if(!a||!b||a===b)return;const r=ensureRegionalSimulation(),k=routePressureKey(a,b);r.routePressure[k]=clamp((r.routePressure[k]||0)+amt,0,10);if(typeof updateRouteEvidence==='function')updateRouteEvidence(a,b,SOSText("world_regional_simulation.addRoutePressure.001"))}
function reduceRoutePressure(a,b,amt=1){if(!a||!b||a===b)return;const r=ensureRegionalSimulation(),k=routePressureKey(a,b);r.routePressure[k]=Math.max(0,(r.routePressure[k]||0)-amt);if(typeof updateRouteEvidence==='function')updateRouteEvidence(a,b,SOSText("world_regional_simulation.reduceRoutePressure.001"))}
function routePressure(a,b){return ensureRegionalSimulation().routePressure[routePressureKey(a,b)]||0}
function spawnRegionalResponse(kind,from,to,title){
 if(!from||!to||from===to)return null;const region=locationRegion(from),regionalCount=state.world.parties.filter(p=>p.regionalResponse&&p.kind===kind&&worldPartyDisplayRegion(p)===region).length;
 if(['refugees','merchant'].includes(kind)&&regionalCount>=3)return null;const exists=state.world.parties.some(p=>p.kind===kind&&p.regionalResponse&&p.origin===from&&p.destination===to);if(exists)return null;
 const p=spawnWorldParty(kind,region);p.origin=from;p.location=from;p.destination=to;if(p.kind==='merchant')assignMerchantManifest(p);p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays(from,to));p.name=title||p.name;p.genericName=p.name;const r=travelerRecord(p);r.genericName=p.name;if(!r.identity)r.name=p.name;r.lastKnownLocation=from;r.lastKnownDestination=to;r.regions=[...new Set([...(r.regions||[]),region])];p.regionalResponse=true;regionalFlow(kind,from,to,SOSText("world_regional_simulation.spawnRegionalResponse.001",p.name,worldLocation(from).name,worldLocation(to).name),p.id);return p
}
function maybeRegionalResponse(){
 ensureRegionalSimulation();const sim=state.world.regionalSimulation;
 for(const loc of regionalSettlements()){
  const p=settlementProblem(loc.id),ss=settlementState(loc.id);if(!p)continue;const last=sim.lastResponseDay[loc.id]||0;
  if(state.world.day-last>=2){
   if(['shortage','trade_slump'].includes(p.type)&&chance(.30)){const source=regionalSettlements(locationRegion(loc.id)).filter(x=>x.id!==loc.id&&settlementState(x.id).prosperity>=58).sort((a,b)=>settlementState(b.id).prosperity-settlementState(a.id).prosperity)[0];if(source&&spawnRegionalResponse('merchant',source.id,loc.id,SOSText("world_regional_simulation.maybeRegionalResponse.001",source.name))){regionalThread('supply',source.id,loc.id,SOSText("world_regional_simulation.maybeRegionalResponse.002",loc.name),SOSText("world_regional_simulation.maybeRegionalResponse.003",source.name,loc.name,p.title.toLowerCase()));sim.lastResponseDay[loc.id]=state.world.day}}
   else if(['raider_pressure','watch_shortage'].includes(p.type)&&chance(.28)){const source=regionalSettlements(locationRegion(loc.id)).filter(x=>x.id!==loc.id&&settlementState(x.id).security>=65).sort((a,b)=>settlementState(b.id).security-settlementState(a.id).security)[0];if(source){const kind=settlementControl(source.id)===SOSText("world_regional_simulation.maybeRegionalResponse.004")?'redstone':'coalition';if(spawnRegionalResponse(kind,source.id,loc.id,SOSText("world_regional_simulation.maybeRegionalResponse.005",majorFaction(kind==='redstone'?'Redstone':'Coalition').short))){regionalThread('security',source.id,loc.id,SOSText("world_regional_simulation.maybeRegionalResponse.006",loc.name),SOSText("world_regional_simulation.maybeRegionalResponse.007",source.name,loc.name));sim.lastResponseDay[loc.id]=state.world.day}}}
  }
  const refugeeKey=`${loc.id}:refugees`,refugeeLast=sim.lastResponseDay[refugeeKey]||0;
  if(state.world.day-refugeeLast>=5&&(ss.security<27||p.type==='raider_pressure')&&chance(.14)){const dest=bestReliefDestination(loc.id,'refugees');if(dest&&dest!==loc.id&&spawnRegionalResponse('refugees',loc.id,dest,SOSText("world_regional_simulation.maybeRegionalResponse.008",loc.name))){regionalThread('displacement',loc.id,dest,SOSText("world_regional_simulation.maybeRegionalResponse.009",loc.name),SOSText("world_regional_simulation.maybeRegionalResponse.010",loc.name,worldLocation(dest).name));sim.lastResponseDay[refugeeKey]=state.world.day}}
 }
}

function cleanupExpiredNpcMovements(){
 const moves=state.world.npcMovements||{};let n=0;for(const [id,m] of Object.entries(moves)){if(!m||(!m.permanent&&Number.isFinite(m.untilDay)&&m.untilDay<state.world.day)){delete moves[id];n++}}return n
}
function regionalNpcResponse(){
 cleanupExpiredNpcMovements();for(const loc of regionalSettlements()){const p=settlementProblem(loc.id);if(!p)continue;
   if(['shortage','trade_slump'].includes(p.type)){const candidate=[['river_trader','river'],['stone_broker','stonebridge'],['south_trader','southroad']].find(([id,home])=>home!==loc.id&&!state.world.npcMovements[id]);if(candidate&&chance(.15)){const [id,home]=candidate;state.world.npcMovements[id]={location:loc.id,home,untilDay:state.world.day+2,regionalReason:p.title};regionalFlow('npc',home,loc.id,SOSText("world_regional_simulation.regionalNpcResponse.001",settlementNpc(home,id)?.name||id,worldLocation(loc.id).name,p.title.toLowerCase()))}}
   if(p.type==='refugee_load'){const candidate=[['river_healer','river'],['north_healer','northgate'],['sh_healer','shantium']].find(([id,home])=>home!==loc.id&&!state.world.npcMovements[id]);if(candidate&&chance(.16)){const [id,home]=candidate;state.world.npcMovements[id]={location:loc.id,home,untilDay:state.world.day+2,regionalReason:p.title};regionalFlow('npc',home,loc.id,SOSText("world_regional_simulation.regionalNpcResponse.002",settlementNpc(home,id)?.name||id,worldLocation(loc.id).name))}}
 }
}
function simulateRegionalNetworkDay(){
 if(!isOpenWorld())return;ensureRegionalSimulation();maybeRegionalResponse();regionalNpcResponse();simulateRegionalConsequencesII();
 for(const [k,v] of Object.entries(state.world.regionalSimulation.routePressure)){if(v>0&&chance(.22)){state.world.regionalSimulation.routePressure[k]=Math.max(0,v-1);const [a,b]=k.split('|');updateRouteEvidence(a,b,SOSText("world_regional_simulation.simulateRegionalNetworkDay.001"))}}
 regionalThreadCleanup();syncRegionalOpportunities()
}
function regionalArrivalConsequences(p,locId){
 const loc=worldLocation(locId),origin=p.origin&&state.world.settlements[p.origin]?p.origin:null,problem=settlementProblem(locId);
 if(p.kind==='merchant'){
   regionalFlow('trade',origin||p.location,locId,SOSText("world_regional_simulation.regionalArrivalConsequences.001",p.name,loc.name),p.id);merchantDeliveryEffect(p,locId,origin);if(origin&&origin!==locId)settlementState(origin).prosperity=Math.min(100,settlementState(origin).prosperity+1);
   if(problem&&problem.type==='trade_slump'){progressSettlementProblem(locId,1,SOSText("world_regional_simulation.regionalArrivalConsequences.002",p.name));regionalThreadAdvance('supply',locId,SOSText("world_regional_simulation.regionalArrivalConsequences.003",p.name,loc.name),!settlementProblem(locId),origin)}
   if(origin)reduceRoutePressure(origin,locId,1)
 }
 if(p.kind==='refugees'){
   regionalFlow('people',origin||p.location,locId,SOSText("world_regional_simulation.regionalArrivalConsequences.004",p.name,loc.name),p.id);refugeeArrivalEffect(p,locId,origin);if(!settlementProblem(locId)&&settlementState(locId).prosperity<62)createSettlementProblem(locId,'refugee_load');regionalThreadAdvance('displacement',locId,SOSText("world_regional_simulation.regionalArrivalConsequences.005",origin?worldLocation(origin).name:'the roads',loc.name),false,origin)
 }
 if(['coalition','redstone','bluestone'].includes(p.kind)){
   regionalFlow('security',origin||p.location,locId,SOSText("world_regional_simulation.regionalArrivalConsequences.006",p.name,loc.name),p.id);patrolArrivalEffect(p,locId,origin);if(OPEN_WORLD_FACTIONS[p.faction])addPoliticalPressure(locId,p.faction,.5,SOSText("world_regional_simulation.regionalArrivalConsequences.007"));if(problem&&['raider_pressure','watch_shortage'].includes(problem.type)){progressSettlementProblem(locId,1,SOSText("world_regional_simulation.regionalArrivalConsequences.008",p.name));settlementState(locId).security=Math.min(100,settlementState(locId).security+2);regionalThreadAdvance('security',locId,SOSText("world_regional_simulation.regionalArrivalConsequences.009",p.name),!settlementProblem(locId),origin)}
 }
 if(p.kind==='mercenary'&&problem?.type==='watch_shortage'&&settlementState(locId).prosperity>=45){progressSettlementProblem(locId,1,SOSText("world_regional_simulation.regionalArrivalConsequences.010",p.name));settlementState(locId).prosperity=Math.max(0,settlementState(locId).prosperity-1);settlementState(locId).security=Math.min(100,settlementState(locId).security+2)}
}

const REGIONAL_OPPORTUNITY_LIFETIME=6;
function normalizeRegionalOpportunityState(){
 const r=ensureRegionalSimulation(),seen=new Map();
 for(const o of r.opportunities){
   if(o.status!=='active')continue;
   const t=r.threads.find(x=>x.id===o.threadId);
   if(!t||t.status!=='active'){o.status='expired';o.resolvedDay=state.world.day;o.result=SOSText("world_regional_simulation.normalizeRegionalOpportunityState.001");continue}
   o.type=opportunityTypeForThread(t);o.location=t.to||t.from;o.origin=t.from||o.location;o.title=opportunityTitle(o.type,o.location);
   o.partyId=null;o.stage='available';
   if(o.type==='relief'){o.summary=SOSText("world_regional_simulation.normalizeRegionalOpportunityState.002",worldLocation(o.location).name);o.actions=['supplies','coordinate','tradehelp']}
   else if(o.type==='security'){o.summary=SOSText("world_regional_simulation.normalizeRegionalOpportunityState.003",worldLocation(o.location).name);o.actions=['investigate','patrol','faction']}
   else if(o.type==='refugees'){o.summary=SOSText("world_regional_simulation.normalizeRegionalOpportunityState.004",worldLocation(o.origin).name,worldLocation(o.location).name);o.actions=['aid','settle','redirect']}
   else{o.summary=t.text||t.notes?.[0]||SOSText("world_regional_simulation.normalizeRegionalOpportunityState.005");o.actions=['investigate']}
   const key=`${o.type}|${o.origin}|${o.location}`,prior=seen.get(key);
   if(prior){o.status='superseded';o.resolvedDay=state.world.day;o.result=SOSText("world_regional_simulation.normalizeRegionalOpportunityState.006",prior.title)}else seen.set(key,o)
 }
}
function activeRegionalOpportunities(){normalizeRegionalOpportunityState();return ensureRegionalSimulation().opportunities.filter(o=>o.status==='active'&&o.expiresDay>=state.world.day)}
function regionalOpportunity(id){normalizeRegionalOpportunityState();return ensureRegionalSimulation().opportunities.find(o=>o.id===id)}
function opportunityAt(locId){return activeRegionalOpportunities().filter(o=>o.location===locId)}
function opportunityTypeForThread(t){
 if(t.kind==='supply')return 'relief';
 if(t.kind==='security')return 'security';
 if(t.kind==='displacement')return 'refugees';
 return 'investigate'
}
function opportunityTitle(type,locId){
 const n=worldLocation(locId)?.name||SOSText("world_regional_simulation.opportunityTitle.001");
 return type==='relief'?SOSText("world_regional_simulation.opportunityTitle.002",n):type==='security'?SOSText("world_regional_simulation.opportunityTitle.003",n):type==='refugees'?SOSText("world_regional_simulation.opportunityTitle.004",n):SOSText("world_regional_simulation.opportunityTitle.005",n)
}
function createRegionalOpportunity(thread,force=false){
 const r=ensureRegionalSimulation();if(!thread||thread.status!=='active')return null;const type=opportunityTypeForThread(thread),locId=thread.to||thread.from,origin=thread.from||locId,region=locationRegion(locId);
 if(!force&&!(state.world.unlockedRegions||['shantium']).includes(region))return null;const localProblem=settlementProblem(locId),matter=localProblem?syncSettlementProblemMatter(locId,localProblem):worldMatterForRegionalThread(thread),existing=r.opportunities.find(o=>o.status==='active'&&o.type===type&&o.location===locId&&o.origin===origin);if(existing){existing.threadId=thread.id;existing.expiresDay=Math.max(existing.expiresDay,state.world.day+3);if(matter){existing.matterId=matter.id;existing.workOfferId=createWorldWorkOffer(matter.id,'regional_opportunity',existing.id,{title:existing.title,location:locId,expiresDay:existing.expiresDay,links:{threadId:thread.id}})?.id}normalizeRegionalOpportunityState();return existing}
 const activeType=r.opportunities.filter(o=>o.status==='active'&&o.type===type&&o.expiresDay>=state.world.day&&locationRegion(o.location)===region).length;if(!force&&activeType>=(type==='refugees'?4:3))return null;if(!force&&!chance(.42))return null;
 const o={id:uid(),threadId:thread.id,type,title:opportunityTitle(type,locId),location:locId,origin,status:'active',createdDay:state.world.day,expiresDay:state.world.day+REGIONAL_OPPORTUNITY_LIFETIME,stage:'available',partyId:null,marker:true,matterId:matter?.id||null};if(matter)o.workOfferId=createWorldWorkOffer(matter.id,'regional_opportunity',o.id,{title:o.title,location:locId,expiresDay:o.expiresDay,links:{threadId:thread.id}})?.id;r.opportunities.push(o);r.opportunities=r.opportunities.slice(-24);normalizeRegionalOpportunityState();recordWorldNews(`${o.title}: ${o.summary}`,'info');return o
}
function syncRegionalOpportunities(){
 const r=ensureRegionalSimulation();normalizeRegionalOpportunityState();
 for(const o of r.opportunities){if(o.status==='active'&&state.world.day>o.expiresDay){o.status='expired';o.resolvedDay=state.world.day;o.result=SOSText("world_regional_simulation.syncRegionalOpportunities.001");if(o.workOfferId)updateWorldWorkOffer(o.workOfferId,{status:'expired'});recordWorldHistory(SOSText("world_regional_simulation.syncRegionalOpportunities.002",o.title),'info',SOSText("world_regional_simulation.syncRegionalOpportunities.003"))}}
 for(const t of activeRegionalThreads())createRegionalOpportunity(t,false)
}
function opportunityMarkerHTML(o){
 const loc=worldLocation(o.location),here=state.world.location===o.location;
 return SOSText("world_regional_simulation.opportunityMarkerHTML.001",here?'opportunity-here':'',esc(o.title),esc(loc?.name||o.location),here?'YOU ARE HERE • ':'',o.expiresDay,esc(o.summary),o.id,here?'Respond to Situation':'Review Opportunity')
}
function regionalOpportunityActionLabel(a){return a==='supplies'?'Provide Emergency Supplies':a==='coordinate'?'Coordinate Local Relief':a==='tradehelp'?'Arrange Outside Trade Support':a==='investigate'?'Investigate the Situation':a==='patrol'?'Join a Road Patrol':a==='faction'?'Request Faction Support':a==='aid'?'Provide Food, Blankets & Aid':a==='settle'?'Help the Families Settle Here':a==='redirect'?'Recommend Another Settlement':a}
function resolveRegionalOpportunity(o,action){
 if(!o||o.status!=='active')return;
 if(state.world.location!==o.location)return actionResult(SOSText("world_regional_simulation.resolveRegionalOpportunity.001"),SOSText("world_regional_simulation.resolveRegionalOpportunity.002",worldLocation(o.location).name),'info',()=>showRegionalOpportunity(o.id));
 const locId=o.location,ss=settlementState(locId),p=settlementProblem(locId);let text='',good=true;
 if(action==='supplies'){const cost=Math.min(state.gold,25);if(cost<10)return actionResult(SOSText("world_regional_simulation.resolveRegionalOpportunity.003"),SOSText("world_regional_simulation.resolveRegionalOpportunity.004"),'bad',()=>showRegionalOpportunity(o.id));state.gold-=cost;ss.prosperity=Math.min(100,ss.prosperity+2);progressSettlementProblem(locId,2,SOSText("world_regional_simulation.resolveRegionalOpportunity.005"));text=SOSText("world_regional_simulation.resolveRegionalOpportunity.006",cost)}
 else if(action==='coordinate'){advanceWorldDays(1,SOSText("world_regional_simulation.resolveRegionalOpportunity.007",worldLocation(locId).name));ss.prosperity=Math.min(100,ss.prosperity+2);progressSettlementProblem(locId,2,SOSText("world_regional_simulation.resolveRegionalOpportunity.008"));changeLocalReputation(locId,1,SOSText("world_regional_simulation.resolveRegionalOpportunity.009"));text=SOSText("world_regional_simulation.resolveRegionalOpportunity.010")}
 else if(action==='tradehelp'){const source=regionalSettlements(locationRegion(locId)).filter(x=>x.id!==locId&&settlementState(x.id).prosperity>=55).sort((a,b)=>settlementState(b.id).prosperity-settlementState(a.id).prosperity)[0];if(source){spawnRegionalResponse('merchant',source.id,locId,SOSText("world_regional_simulation.resolveRegionalOpportunity.011",source.name));text=SOSText("world_regional_simulation.resolveRegionalOpportunity.012",source.name)}else{text=SOSText("world_regional_simulation.resolveRegionalOpportunity.013");good=false}}
 else if(action==='investigate'){advanceWorldDays(1,SOSText("world_regional_simulation.resolveRegionalOpportunity.014",o.title));gainScouting(2);if(p&&['raider_pressure','watch_shortage'].includes(p.type)){progressSettlementProblem(locId,1,SOSText("world_regional_simulation.resolveRegionalOpportunity.015"));ss.security=Math.min(100,ss.security+2);text=SOSText("world_regional_simulation.resolveRegionalOpportunity.016")}else{text=SOSText("world_regional_simulation.resolveRegionalOpportunity.017")}}
 else if(action==='patrol'){advanceWorldDays(1,SOSText("world_regional_simulation.resolveRegionalOpportunity.018",worldLocation(locId).name));ss.security=Math.min(100,ss.security+4);progressSettlementProblem(locId,2,SOSText("world_regional_simulation.resolveRegionalOpportunity.019"));text=SOSText("world_regional_simulation.resolveRegionalOpportunity.020")}
 else if(action==='faction'){const control=settlementControl(locId),kind=control===SOSText("world_regional_simulation.resolveRegionalOpportunity.021")?'redstone':'coalition',source=regionalSettlements(locationRegion(locId)).filter(x=>x.id!==locId&&settlementState(x.id).security>=55)[0];if(source){spawnRegionalResponse(kind,source.id,locId,SOSText("world_regional_simulation.resolveRegionalOpportunity.022",majorFaction(kind==='redstone'?'Redstone':'Coalition').short));addPoliticalPressure(locId,kind==='redstone'?'Redstone':SOSText("world_regional_simulation.resolveRegionalOpportunity.023"),1,SOSText("world_regional_simulation.resolveRegionalOpportunity.024"));text=SOSText("world_regional_simulation.resolveRegionalOpportunity.025",source.name)}else{text=SOSText("world_regional_simulation.resolveRegionalOpportunity.026");good=false}}
 else if(action==='aid'){const cost=Math.min(state.gold,18);if(cost<8)return actionResult(SOSText("world_regional_simulation.resolveRegionalOpportunity.027"),SOSText("world_regional_simulation.resolveRegionalOpportunity.028"),'bad',()=>showRegionalOpportunity(o.id));state.gold-=cost;ss.prosperity=Math.min(100,ss.prosperity+1);progressSettlementProblem(locId,1,SOSText("world_regional_simulation.resolveRegionalOpportunity.029"));changeLocalReputation(locId,1,SOSText("world_regional_simulation.resolveRegionalOpportunity.030"));text=SOSText("world_regional_simulation.resolveRegionalOpportunity.031",cost)}
 else if(action==='settle'){advanceWorldDays(1,SOSText("world_regional_simulation.resolveRegionalOpportunity.032",worldLocation(locId).name));ss.prosperity=Math.min(100,ss.prosperity+1);changeLocalReputation(locId,2,SOSText("world_regional_simulation.resolveRegionalOpportunity.033"));progressSettlementProblem(locId,2,SOSText("world_regional_simulation.resolveRegionalOpportunity.034"));text=SOSText("world_regional_simulation.resolveRegionalOpportunity.035",worldLocation(locId).name)}
 else if(action==='redirect'){const dest=bestReliefDestination(locId,'refugees');if(!dest||dest===locId){text=SOSText("world_regional_simulation.resolveRegionalOpportunity.036")}else{regionalThread('displacement',locId,dest,SOSText("world_regional_simulation.resolveRegionalOpportunity.037",worldLocation(locId).name),SOSText("world_regional_simulation.resolveRegionalOpportunity.038",worldLocation(dest).name));spawnRegionalResponse('refugees',locId,dest,SOSText("world_regional_simulation.resolveRegionalOpportunity.039",worldLocation(dest).name));text=SOSText("world_regional_simulation.resolveRegionalOpportunity.040",worldLocation(dest).name)}}
 o.status='resolved';o.resolvedDay=state.world.day;o.result=text;if(o.workOfferId)updateWorldWorkOffer(o.workOfferId,{status:'completed',result:text});if(o.matterId&&settlementProblem(locId))syncSettlementProblemMatter(locId);ensureRegionalSimulation().interventions.push({day:state.world.day,opportunityId:o.id,title:o.title,action,result:text});ensureRegionalSimulation().interventions=ensureRegionalSimulation().interventions.slice(-30);
 const t=ensureRegionalSimulation().threads.find(x=>x.id===o.threadId);if(t){t.notes.push(SOSText("world_regional_simulation.resolveRegionalOpportunity.041",text));t.lastDay=state.world.day}
 recordWorldHistory(`${o.title}: ${text}`,good?'good':'info',SOSText("world_regional_simulation.resolveRegionalOpportunity.042"));save();actionResult(o.title,text,good?'good':'info',showRegionalOpportunities)
}
function showRegionalOpportunity(id){modalRouteEnter(SOSText("world_regional_simulation.showRegionalOpportunity.001"),Array.from(arguments));
 const o=regionalOpportunity(id);if(!o)return showRegionalOpportunities();const loc=worldLocation(o.location),t=ensureRegionalSimulation().threads.find(x=>x.id===o.threadId),here=state.world.location===o.location;
 const context=t?SOSText("world_regional_simulation.showRegionalOpportunity.002",esc(t.text||t.notes?.[0]||'Conditions elsewhere in the region created this situation.')):'';
 const actions=o.status==='active'?(here?SOSText("world_regional_simulation.showRegionalOpportunity.003",o.actions.map(a=>`<button data-opaction="${a}">${esc(regionalOpportunityActionLabel(a))}</button>`).join('')):SOSText("world_regional_simulation.showRegionalOpportunity.004",esc(loc.name),esc(loc.name))):`<div class="notice">${esc(o.result||'This opportunity has ended.')}</div>`;
 overlay(SOSText("world_regional_simulation.showRegionalOpportunity.005",esc(o.title),esc(loc?.name||o.location),o.status==='active'?`Available through Day ${o.expiresDay}`:esc(o.status),esc(o.summary),`${o.matterId?worldMatterChannelLabel(o.matterId,'regional_opportunity'):''}${context}`,actions),true);
 document.querySelectorAll('[data-opaction]').forEach(b=>b.onclick=()=>resolveRegionalOpportunity(o,b.dataset.opaction));if($('#opTravel'))$('#opTravel').onclick=()=>{closeOverlay();attemptWorldTravel(o.location)};if($('#opLeave'))$('#opLeave').onclick=()=>{o.status='declined';o.result=SOSText("world_regional_simulation.showRegionalOpportunity.006");save();showRegionalOpportunities()};$('#opBack').onclick=()=>SOSServices.navigation.back(showRegionalOpportunities)
}

function companionRegionalReaction(o){
 if(!o||!state.companions?.length)return'';const c=pick(state.companions),cls=(c.classId||c.class||'').toLowerCase();let line='';
 if(o.type==='security')line=cls.includes('rogue')?SOSText("world_regional_simulation.companionRegionalReaction.001",c.name):cls.includes('ranger')?SOSText("world_regional_simulation.companionRegionalReaction.002",c.name):SOSText("world_regional_simulation.companionRegionalReaction.003",c.name);
 else if(o.type==='refugees')line=SOSText("world_regional_simulation.companionRegionalReaction.004",c.name);
 else if(o.type==='relief')line=cls.includes('merchant')?SOSText("world_regional_simulation.companionRegionalReaction.005",c.name):SOSText("world_regional_simulation.companionRegionalReaction.006",c.name);
 return line?`<div class="companion-reaction"><b>${esc(c.name)}:</b> ${esc(line)}</div>`:''
}
function showRegionalOpportunities(){modalRouteEnter(SOSText("world_regional_simulation.showRegionalOpportunities.001"),Array.from(arguments));
 const region=currentWorldRegion(),ops=activeRegionalOpportunities().filter(o=>locationRegion(o.location)===region).sort((a,b)=>(b.location===state.world.location)-(a.location===state.world.location)||a.expiresDay-b.expiresDay);
 overlay(SOSText("world_regional_simulation.showRegionalOpportunities.002",esc(regionDef(region).name),ops.map(o=>opportunityMarkerHTML(o)+companionRegionalReaction(o)).join('')||'<p class="muted">No unusual regional situation currently needs the Guardian’s attention.</p>'),true);
 document.querySelectorAll('[data-openopportunity]').forEach(b=>b.onclick=()=>showRegionalOpportunity(b.dataset.openopportunity));wireClose()
}
function regionalThreadHTML(t){
 const from=t.from?worldLocation(t.from)?.name:SOSText("world_regional_simulation.regionalThreadHTML.001"),to=t.to?worldLocation(t.to)?.name:SOSText("world_regional_simulation.regionalThreadHTML.002");
 return SOSText("world_regional_simulation.regionalThreadHTML.003",t.status==='resolved'?'resolved':'',esc(t.title),esc(from),esc(to),t.startDay,esc(t.status),esc(t.notes[t.notes.length-1]||t.text),t.status==='active'&&t.to?`<button data-regionaltravel="${t.to}">Travel to ${esc(to)}</button>`:'')
}

function showEncounterRecord(){modalRouteEnter(SOSText("world_regional_simulation.showEncounterRecord.001"),Array.from(arguments));
 const e=state.world.encounterStats||{},wins=Object.entries(e.terrainWins||{}).sort((a,b)=>b[1]-a[1]);
 overlay(SOSText("world_regional_simulation.showEncounterRecord.002",e.ambushes||0,e.avoided||0,e.surrenders||0,e.parleys||0,e.withdrawals||0,wins.map(([k,v])=>`<div class="stat-row"><span>${esc(k)}</span><b>${v}</b></div>`).join('')||'<p class="muted">No recorded Open World terrain victories yet.</p>'),true);$('#encRecordBack').onclick=()=>SOSServices.navigation.back(showRoadEncounterCatalogue)
}

function showRegionalEvidence(){modalRouteEnter(SOSText("world_regional_simulation.showRegionalEvidence.001"),Array.from(arguments));
 const region=currentWorldRegion(),ev=recentRegionalEvidence(40).filter(e=>locationRegion(e.locId)===region).slice(0,18),routes=Object.values(regionalEvidenceState().routes).filter(r=>locationRegion(r.a)===region&&locationRegion(r.b)===region).sort((a,b)=>b.pressure-a.pressure);
 overlay(SOSText("world_regional_simulation.showRegionalEvidence.002",esc(regionDef(region).name),ev.map(e=>`<div class="regional-evidence ${esc(e.type||'info')}"><b>Day ${e.day} — ${esc(worldLocation(e.locId)?.name||e.locId)}</b><br>${esc(e.text)}</div>`).join('')||'<p class="muted">No recent visible consequence is recorded.</p>',routes.map(r=>`<div class="route-condition ${esc(r.status)}"><b>${esc(worldLocation(r.a)?.name||r.a)} ↔ ${esc(worldLocation(r.b)?.name||r.b)}</b><br><small>${esc(r.status)} • pressure ${r.pressure}/10</small><p>${esc(routeConditionText(r.a,r.b))}</p></div>`).join('')||'<p class="muted">No route pressure is currently recorded.</p>'),true);$('#regionalEvidenceBack').onclick=()=>SOSServices.navigation.back(showWorldJournal)
}
function showRegionalSimulation(){modalRouteEnter(SOSText("world_regional_simulation.showRegionalSimulation.001"),Array.from(arguments));return showOpenWorldRegionMenu()}

const SETTLEMENT_PROBLEM_TYPES=[
 {id:'shortage',title:SOSText("world_regional_simulation.showRegionalSimulation.002"),days:5,desc:SOSText("world_regional_simulation.showRegionalSimulation.003"),kind:'economy'},
 {id:'raider_pressure',title:SOSText("world_regional_simulation.showRegionalSimulation.004"),days:6,desc:SOSText("world_regional_simulation.showRegionalSimulation.005"),kind:'security'},
 {id:'refugee_load',title:SOSText("world_regional_simulation.showRegionalSimulation.006"),days:5,desc:SOSText("world_regional_simulation.showRegionalSimulation.007"),kind:'people'},
 {id:'trade_slump',title:SOSText("world_regional_simulation.showRegionalSimulation.008"),days:6,desc:SOSText("world_regional_simulation.showRegionalSimulation.009"),kind:'economy'},
 {id:'watch_shortage',title:SOSText("world_regional_simulation.showRegionalSimulation.010"),days:5,desc:SOSText("world_regional_simulation.showRegionalSimulation.011"),kind:'security'},
 {id:'pass_closure',title:SOSText("world_regional_simulation.showRegionalSimulation.012"),days:5,desc:SOSText("world_regional_simulation.showRegionalSimulation.013"),kind:'road'},
 {id:'retaining_damage',title:SOSText("world_regional_simulation.showRegionalSimulation.014"),days:5,desc:SOSText("world_regional_simulation.showRegionalSimulation.015"),kind:'infrastructure'},
 {id:'quarry_hazard',title:SOSText("world_regional_simulation.showRegionalSimulation.016"),days:5,desc:SOSText("world_regional_simulation.showRegionalSimulation.017"),kind:'labor'},
 {id:'valley_access',title:SOSText("world_regional_simulation.showRegionalSimulation.018"),days:5,desc:SOSText("world_regional_simulation.showRegionalSimulation.019"),kind:'infrastructure'},
 {id:'authority_dispute',title:SOSText("world_regional_simulation.showRegionalSimulation.020"),days:6,desc:SOSText("world_regional_simulation.showRegionalSimulation.021"),kind:'governance'},
 {id:'watch_isolation',title:SOSText("world_regional_simulation.showRegionalSimulation.022"),days:5,desc:SOSText("world_regional_simulation.showRegionalSimulation.023"),kind:'security'},
 {id:'requisition_pressure',title:SOSText("world_regional_simulation.showRegionalSimulation.024"),days:6,desc:SOSText("world_regional_simulation.showRegionalSimulation.025"),kind:'governance'},
 {id:'occupation_tension',title:SOSText("world_regional_simulation.showRegionalSimulation.026"),days:6,desc:SOSText("world_regional_simulation.showRegionalSimulation.027"),kind:'governance'},
 {id:'grain_road',title:SOSText("world_regional_simulation.showRegionalSimulation.028"),days:5,desc:SOSText("world_regional_simulation.showRegionalSimulation.029"),kind:'economy'},
 {id:'warehouse_backlog',title:SOSText("world_regional_simulation.showRegionalSimulation.030"),days:5,desc:SOSText("world_regional_simulation.showRegionalSimulation.031"),kind:'economy'},
 {id:'dry_supply',title:SOSText("world_regional_simulation.showRegionalSimulation.032"),days:5,desc:SOSText("world_regional_simulation.showRegionalSimulation.033"),kind:'economy'},
 {id:'resin_fire',title:SOSText("world_regional_simulation.showRegionalSimulation.034"),days:4,desc:SOSText("world_regional_simulation.showRegionalSimulation.035"),kind:'security'}
];
function settlementProblem(locId){const p=state.world.settlementProblems?.[locId];return p&&p.status==='active'?p:null}
function createSettlementProblem(locId,typeId=null){
 ensureWorldState();if(settlementProblem(locId))return settlementProblem(locId);const ss=settlementState(locId);if((ss.problemCooldownUntil||0)>state.world.day)return null;const type=typeId?SETTLEMENT_PROBLEM_TYPES.find(x=>x.id===typeId):pick(SETTLEMENT_PROBLEM_TYPES);
 const p={id:uid(),type:type.id,title:type.title,desc:type.desc,kind:type.kind,status:'active',startedDay:state.world.day,expiresDay:state.world.day+type.days,progress:0,extensions:0,lastEffectDay:state.world.day-2};
 state.world.settlementProblems[locId]=p;syncSettlementProblemMatter(locId,p);recordWorldNews(`${worldLocation(locId).name}: ${p.title}.`,'bad');recordWorldHistory(SOSText("world_regional_simulation.createSettlementProblem.001",worldLocation(locId).name,p.title),'bad',SOSText("world_regional_simulation.createSettlementProblem.002"));return p
}
