function relationshipContractName(source,type){
 const who=source.npc?.name||source.companion?.name||source.traveler?.name||SOSText("social_relationship_contracts.relationshipContractName.001");
 if(source.kind==='npc')return type==='delivery'?SOSText("social_relationship_contracts.relationshipContractName.002",who):type==='procure'?SOSText("social_relationship_contracts.relationshipContractName.003",who):type==='escort'?SOSText("social_relationship_contracts.relationshipContractName.004",who):SOSText("social_relationship_contracts.relationshipContractName.005",who);
 if(source.kind==='companion')return type==='hunt'?SOSText("social_relationship_contracts.relationshipContractName.006",who):type==='escort'?SOSText("social_relationship_contracts.relationshipContractName.007",who):SOSText("social_relationship_contracts.relationshipContractName.008",who);
 return type==='escort'?SOSText("social_relationship_contracts.relationshipContractName.009",who):type==='delivery'?SOSText("social_relationship_contracts.relationshipContractName.010",who):SOSText("social_relationship_contracts.relationshipContractName.011",who)
}
function relationshipContractDescription(source,locId,target,type){
 const from=worldLocation(locId).name,to=worldLocation(target).name,who=source.npc?.name||source.companion?.name||source.traveler?.name||SOSText("social_relationship_contracts.relationshipContractDescription.001");
 if(source.kind==='npc')return SOSText("social_relationship_contracts.relationshipContractDescription.002",who,from,to);
 if(source.kind==='companion')return SOSText("social_relationship_contracts.relationshipContractDescription.003",who,from,to);
 return SOSText("social_relationship_contracts.relationshipContractDescription.004",who,from,to)
}
function createRelationshipGeneratedContract(locId,source=null,force=false){
 const R=relationshipContractState();if(!state.world.contracts[locId])state.world.contracts[locId]=[];
 if(!force&&state.world.day-(R.lastGenDay[locId]||-99)<2)return null;
 const candidates=relationshipContractCandidates(locId);source=source||candidates[0];if(!source)return null;
 const type=relationshipContractType(source,locId),target=relationshipContractTarget(source,locId,type),q=generateContract(locId,type,{target});
 q.relationshipGenerated=true;q.relationshipSourceKind=source.kind;q.relationshipSourceId=source.npc?.id||source.companion?.id||source.traveler?.id||null;q.relationshipSourceName=source.npc?.name||source.companion?.name||source.traveler?.name||SOSText("social_relationship_contracts.createRelationshipGeneratedContract.001");q.name=relationshipContractName(source,type);q.desc=relationshipContractDescription(source,locId,target,type);q.reward+=20+Math.max(0,source.weight||0)*2;
 if(source.kind==='npc'){q.referralNpcId=source.npc.id;const al=npcFactionAlignment(source.npc.id);if(al&&Math.abs(al.support)>=2&&chance(.35)){q.politicalRelationship=true;q.faction=al.faction;q.desc+=SOSText("social_relationship_contracts.createRelationshipGeneratedContract.002",majorFaction(al.faction).short)}}
 if(source.kind==='companion'){q.companionRequestId=source.companion.id;q.reward+=15}
 if(source.kind==='traveler'){q.referralTravelerId=source.traveler.id;q.referralTravelerName=source.traveler.name;q.referral=true}
 q.crossRegion=isCrossRegionRoute(locId,target);if(q.crossRegion){q.interregional=true;q.routePlan=crossRegionRoutePlan(locId,target);q.routeSummary=interregionalRouteSummary(locId,target);q.reward+=35}
 state.world.contracts[locId].unshift(q);state.world.contracts[locId]=state.world.contracts[locId].slice(0,4);R.lastGenDay[locId]=state.world.day;R.history.push({day:state.world.day,type:'generated',locId,contractId:q.id,source:q.relationshipSourceName,text:SOSText("social_relationship_contracts.createRelationshipGeneratedContract.003",q.relationshipSourceName,q.name)});R.history=R.history.slice(-100);return q
}
function maybeGenerateRelationshipContract(locId){
 const R=relationshipContractState();if(state.world.day-(R.lastGenDay[locId]||-99)<3||!chance(.24))return null;return createRelationshipGeneratedContract(locId,null,false)
}
function messengerContractCandidate(){
 const unlocked=state.world.unlockedRegions||['shantium'],records=[];
 for(const [home,list] of Object.entries(SETTLEMENT_NPCS))for(const npc of list){const rel=npcRelationshipState(npc.id),cur=currentNpcLocation(npc.id,home);if((rel.familiarity||0)>=5&&unlocked.includes(locationRegion(cur)))records.push({kind:'npc',npc,loc:cur,weight:rel.familiarity+(rel.opinion||0)})}
 for(const r of travelerLedgerRecords())if(travelerAttitudeScore(r)>=6&&(r.contractsCompleted||0)>=1){
  let loc=r.settledAt||null;if(!loc&&r.regions?.length){const rg=r.regions[r.regions.length-1],ss=regionalSettlements(rg);loc=ss[0]?.id||null}if(loc)records.push({kind:'traveler',traveler:r,loc,weight:travelerAttitudeScore(r)})
 }
 return records.filter(x=>x.loc&&x.loc!==state.world.location).sort((a,b)=>b.weight-a.weight)[0]||null
}
function queueMessengerContract(force=false){
 const R=relationshipContractState();if(!force&&(!chance(.12)||R.messengers.some(m=>m.status==='traveling')))return null;const src=messengerContractCandidate();if(!src)return null;
 const origin=src.loc,dest=state.world.location,days=Math.max(1,tradeRouteDistanceDays(origin,dest)),dispatch=createWorldDispatch('relationship_contract_messenger',{origin,destination:dest,baseDays:days,title:SOSText("social_relationship_contracts.queueMessengerContract.003",src.npc?.name||src.traveler?.name||SOSText("social_relationship_contracts.queueMessengerContract.001")),sourceRef:src.kind==='npc'?`settlement_npc:${src.npc.id}`:`traveler_group:${src.traveler.id}`}),m={id:`msg_${++R.serial}`,status:'traveling',dispatchId:dispatch.id,sourceKind:src.kind,sourceId:src.npc?.id||src.traveler?.id,sourceName:src.npc?.name||src.traveler?.name||SOSText("social_relationship_contracts.queueMessengerContract.001"),origin,destination:dest,createdDay:state.world.day,arrivalDay:dispatch.dueDay};
 R.messengers.push(m);R.history.push({day:state.world.day,type:'messenger_sent',text:SOSText("social_relationship_contracts.queueMessengerContract.002",worldLocation(origin).name,m.sourceName)});return m
}
function messengerSourceObject(m){
 if(m.sourceKind==='npc'){const home=npcHomeLocation(m.sourceId),npc=settlementNpc(home,m.sourceId);return npc?{kind:'npc',npc,weight:npcRelationshipState(npc.id).familiarity||4}:null}
 if(m.sourceKind==='traveler'){const traveler=travelerRegistryState().records[m.sourceId];return traveler?{kind:'traveler',traveler,weight:travelerAttitudeScore(traveler)}:null}
 return null
}
function deliverDueMessengerContracts(){
 const R=relationshipContractState();for(const m of R.messengers.filter(x=>x.status==='traveling'&&(x.dispatchId?worldDispatchArrived(x.dispatchId):x.arrivalDay<=state.world.day))){
  m.status='arrived';m.deliveredDay=state.world.day;if(m.dispatchId)completeWorldDispatch(m.dispatchId,'delivered');const src=messengerSourceObject(m),q=src?createRelationshipGeneratedContract(state.world.location,src,true):null;m.contractId=q?.id||null;
  const text=q?SOSText("social_relationship_contracts.deliverDueMessengerContracts.001",m.sourceName,worldLocation(state.world.location).name,q.name):SOSText("social_relationship_contracts.deliverDueMessengerContracts.002",m.sourceName);
  R.history.push({day:state.world.day,type:'messenger_arrived',text,contractId:q?.id});recordWorldHistory(text,q?'good':'info',SOSText("social_relationship_contracts.deliverDueMessengerContracts.003"))
 }}
function relationshipContractDailyTick(){
 if(!isOpenWorld())return;const ids=Object.keys(state.world.settlements||{}),R=relationshipContractState(),offered=Object.values(state.world.contracts||{}).flat().filter(q=>q.relationshipGenerated&&q.status==='offered').length;
 if(offered<10&&state.world.day%2===0)maybeGenerateRelationshipContract(state.world.location);if(offered<10&&state.world.day%3===0){const remote=pick(ids.filter(x=>x!==state.world.location));if(remote&&chance(.35))maybeGenerateRelationshipContract(remote)}
 if(state.world.day%3===0)queueMessengerContract(false);deliverDueMessengerContracts();R.messengers=R.messengers.filter(m=>m.status==='traveling'||state.world.day-(m.deliveredDay||m.createdDay)<25).slice(-30);R.history=R.history.slice(-100)
}
function relationshipContractSourceHTML(q){
 if(!q?.relationshipGenerated)return'';let extra='';
 if(q.relationshipSourceKind==='npc')extra=SOSText("social_relationship_contracts.relationshipContractSourceHTML.001");
 if(q.relationshipSourceKind==='companion')extra=SOSText("social_relationship_contracts.relationshipContractSourceHTML.002");
 if(q.relationshipSourceKind==='traveler')extra=SOSText("social_relationship_contracts.relationshipContractSourceHTML.003");
 return SOSText("social_relationship_contracts.relationshipContractSourceHTML.004",esc(q.relationshipSourceName),esc(extra))
}
function showRelationshipContractJournal(){modalRouteEnter(SOSText("social_relationship_contracts.showRelationshipContractJournal.001"),Array.from(arguments));
 const R=relationshipContractState(),active=state.world.quests.filter(q=>q.relationshipGenerated&&['active','ready'].includes(q.status)),offered=Object.values(state.world.contracts||{}).flat().filter(q=>q.relationshipGenerated&&q.status==='offered'),hist=R.history.slice(-18).reverse();
 overlay(SOSText("social_relationship_contracts.showRelationshipContractJournal.002",active.map(contractCard).join('')||'<p class="muted">No personal referral is currently active.</p>',offered.slice(0,8).map(contractCard).join('')||'<p class="muted">No personal referral is waiting on a board.</p>',R.messengers.filter(m=>m.status==='traveling').map(m=>`<div class="card compact"><b>${esc(m.sourceName)}</b><br>${esc(worldLocation(m.origin).name)} → ${esc(worldLocation(m.destination).name)} • expected Day ${m.arrivalDay}</div>`).join('')||'<p class="muted">No messenger is currently carrying a request.</p>',hist.map(x=>`<div class="card compact"><b>Day ${x.day}</b><br>${esc(x.text)}</div>`).join('')||'<p class="muted">No relationship-generated work history yet.</p>'),true);wireContractCards();wireClose()
}

function allOtherUnlockedSettlements(origin){
 const r=locationRegion(origin),unlocked=state.world.unlockedRegions||['shantium'];return unlocked.filter(x=>x!==r).flatMap(x=>regionalSettlements(x)).filter(x=>!x.hidden)
}
function interregionalRouteSummary(from,to){
 const plan=crossRegionRoutePlan(from,to);if(!plan.segments.length)return SOSText("social_relationship_contracts.interregionalRouteSummary.001");
 return plan.segments.map(s=>s.kind==='connection'?s.name:`${worldLocation(s.from).name} → ${worldLocation(s.to).name}`).join(' • ')
}
function interregionalContractRouteHTML(q){
 if(!q?.crossRegion)return'';const plan=crossRegionRoutePlan(q.origin,q.target),regions=[locationRegion(q.origin),...plan.connections.map(c=>locationRegion(regionConnectionOther(c,locationRegion(c.a)===locationRegion(q.origin)?c.a:c.b))),locationRegion(q.target)];
 return SOSText("social_relationship_contracts.interregionalContractRouteHTML.001",esc(interregionalRouteSummary(q.origin,q.target)),plan.days,plan.days===1?'':'s',esc(crossRegionRouteLabel(q.origin,q.target)))
}
function nextInterregionalTravelStep(from,to){
 if(locationRegion(from)===locationRegion(to))return to;const plan=crossRegionRoutePlan(from,to),s=plan.segments[0];return s?.to||to
}
function travelTowardDestination(dest){
 if(!dest||dest===state.world.location)return showWorldArea();const step=nextInterregionalTravelStep(state.world.location,dest);return attemptWorldTravel(step)
}


// v1.6.7 — Economy & Trade III
function economyIIIState(){
 const T=tradeEconomyState();
 if(!T.economyIII||typeof T.economyIII!=='object')T.economyIII={settlements:{},history:[],lastDay:0};
 if(!T.economyIII.settlements)T.economyIII.settlements={};
 if(!Array.isArray(T.economyIII.history))T.economyIII.history=[];
 return T.economyIII
}
function settlementEconomyIII(locId){
 const E=economyIIIState(),ss=settlementState(locId);
 if(!E.settlements[locId])E.settlements[locId]={production:{},consumption:{},flowHealth:50,lastDay:0,shortageDays:0,surplusDays:0};
 const row=E.settlements[locId];
 for(const g of TRADE_GOODS){if(row.production[g.id]===undefined)row.production[g.id]=0;if(row.consumption[g.id]===undefined)row.consumption[g.id]=0}
 if(row.flowHealth===undefined)row.flowHealth=50;if(row.shortageDays===undefined)row.shortageDays=0;if(row.surplusDays===undefined)row.surplusDays=0;return row
}
function tradeRoutePressureAround(locId){
 const R=ensureRegionalSimulation(),keys=Object.entries(R.routePressure||{}).filter(([k])=>k.split('|').includes(locId));
 if(!keys.length)return 0;return keys.reduce((n,[,v])=>n+(v||0),0)/keys.length
}
function settlementProductionRate(locId,gid){
 const ss=settlementState(locId),role=tradeGoodRole(locId,gid),pressure=tradeRoutePressureAround(locId),problem=settlementProblem(locId);
 let rate=role==='source'?1.0:role==='normal'?.22:.05;
 rate*=clamp(.45+ss.prosperity/100,.45,1.45);rate*=clamp(.55+ss.security/130,.55,1.25);rate*=clamp(1-pressure*.055,.45,1);
 if(problem?.type==='trade_slump')rate*=.7;if(problem?.type==='shortage'&&['food','medicine','tools'].includes(gid))rate*=.82;
 return rate
}
function settlementConsumptionRate(locId,gid){
 const ss=settlementState(locId),role=tradeGoodRole(locId,gid),problem=settlementProblem(locId);
 let rate=role==='demand'?.72:.28;
 if(['food','medicine'].includes(gid))rate+=.18;if(ss.prosperity>65&&['cloth','luxury','tools','spirits','dye'].includes(gid))rate+=.15;if(ss.security<35&&['food','medicine','tools'].includes(gid))rate+=.12;
 if(problem?.type==='shortage'&&['food','medicine','tools'].includes(gid))rate+=.18;return rate
}
function economyIIIStockStatus(locId){
 const vals=TRADE_GOODS.map(g=>tradeStock(locId,g.id)),ess=['food','medicine','tools'].map(g=>tradeStock(locId,g));
 const avg=vals.reduce((a,b)=>a+b,0)/Math.max(1,vals.length),essential=ess.reduce((a,b)=>a+b,0)/ess.length;
 return {avg,essential,critical:ess.filter(x=>x<=1).length,low:vals.filter(x=>x<=2).length,healthy:vals.filter(x=>x>=6).length}
}
function economyIIIFlowHealth(locId){
 const ss=settlementState(locId),st=economyIIIStockStatus(locId),pressure=tradeRoutePressureAround(locId),recentDeliveries=tradeEconomyState().deliveries.filter(x=>x.destination===locId&&state.world.day-x.day<=6).length,recentLosses=tradeEconomyState().losses.filter(x=>x.destination===locId&&state.world.day-x.day<=6).length;
 return clamp(Math.round(35+ss.security*.28+ss.prosperity*.20+st.avg*3+recentDeliveries*5-recentLosses*7-pressure*4),0,100)
}
function economyIIIStatusLabel(locId){const h=settlementEconomyIII(locId).flowHealth;return h>=75?'Strong trade flow':h>=55?'Stable trade flow':h>=35?'Strained trade flow':h>=18?'Disrupted trade flow':'Severe supply disruption'}
function economyIIISettlementHTML(locId){
 const r=settlementEconomyIII(locId),st=economyIIIStockStatus(locId),pressure=tradeRoutePressureAround(locId);
 const prod=TRADE_GOODS.map(g=>({g,v:r.production[g.id]||0})).sort((a,b)=>b.v-a.v).slice(0,3).filter(x=>x.v>.1).map(x=>`${esc(x.g.name)} ${x.v.toFixed(1)}`).join(' • ')||'little current output';
 return `<div class="notice compact economy-iii-summary"><b>${esc(economyIIIStatusLabel(locId))}</b><br>Flow health ${r.flowHealth}/100 • average stock ${st.avg.toFixed(1)} • essential stock ${st.essential.toFixed(1)} • route pressure ${pressure.toFixed(1)}<br><small>Recent local production: ${prod}. Production depends on prosperity, security, local resources, and road disruption.</small></div>`
}
function recordEconomyIII(locId,text,type='info'){const E=economyIIIState();E.history.push({day:state.world.day,locId,text,type});E.history=E.history.slice(-100)}
function simulateEconomyIIIDay(){
 const E=economyIIIState();if(E.lastDay===state.world.day)return;E.lastDay=state.world.day;
 for(const loc of regionalSettlements()){
  const id=loc.id,row=settlementEconomyIII(id),ss=settlementState(id);
  for(const g of TRADE_GOODS){
   const pr=settlementProductionRate(id,g.id),cr=settlementConsumptionRate(id,g.id);row.production[g.id]=pr;row.consumption[g.id]=cr;
   if(Math.random()<pr)changeTradeStock(id,g.id,1);if(Math.random()<cr)changeTradeStock(id,g.id,-1);
  }
  row.flowHealth=economyIIIFlowHealth(id);row.lastDay=state.world.day;const st=economyIIIStockStatus(id),problem=settlementProblem(id);
  if(st.essential<2.4||st.critical>=2){row.shortageDays++;row.surplusDays=0;state.world.marketShock[id]=Math.min(.45,(state.world.marketShock[id]||0)+.018);if(row.shortageDays>=3&&!problem&&chance(.35)){createSettlementProblem(id,'shortage');recordEconomyIII(id,`${loc.name} develops a sustained supply shortage.`,'bad')}}
  else if(st.avg>=6&&row.flowHealth>=62){row.surplusDays++;row.shortageDays=Math.max(0,row.shortageDays-1);if(row.surplusDays>=3&&chance(.28))ss.prosperity=Math.min(100,ss.prosperity+1)}
  else{row.shortageDays=Math.max(0,row.shortageDays-1);row.surplusDays=0}
  if(problem?.type==='shortage'&&st.essential>=4.5&&row.flowHealth>=55){progressSettlementProblem(id,1,'sustained market recovery and restored deliveries');recordEconomyIII(id,`${loc.name}'s shortage eases as stocks recover.`,'good')}
  if(row.flowHealth<25&&chance(.16))ss.prosperity=Math.max(0,ss.prosperity-1);
 }
}
function reserveMerchantCargoAtOrigin(p){
 if(!p||p.kind!=='merchant'||p.economyCargoReserved)return p;const origin=p.origin||p.location;if(!state.world.settlements?.[origin])return p;
 for(const [gid,qty] of Object.entries(p.manifest||{})){const available=tradeStock(origin,gid),take=Math.min(qty,Math.max(0,available-1));if(take<qty)p.manifest[gid]=take;changeTradeStock(origin,gid,-take)}
 p.cargo=manifestLots(p.manifest);p.economyCargoReserved=true;if(p.cargo<=0){p.manifest=merchantManifest(origin,p.destination,1);for(const gid of Object.keys(p.manifest))p.manifest[gid]=0}return p
}

function interregionalTradeSignals(limit=6){
 if(!crossRegionTradeUnlocked())return [];const unlocked=state.world.unlockedRegions||['shantium'],settlements=unlocked.flatMap(r=>regionalSettlements(r)),rows=[];
 for(const dest of settlements)for(const g of TRADE_GOODS){
  const dStock=tradeStock(dest.id,g.id),demand=tradeDemandScore(dest.id,g.id);if(demand<1&&dStock>3)continue;
  const sources=settlements.filter(s=>locationRegion(s.id)!==locationRegion(dest.id)).map(s=>({s,stock:tradeStock(s.id,g.id),price:tradePrice(s.id,g.id),role:tradeGoodRole(s.id,g.id)})).filter(x=>x.stock>=3).sort((a,b)=>(b.role==='source')-(a.role==='source')||a.price-b.price);
  const src=sources[0];if(!src)continue;const sell=tradePrice(dest.id,g.id),margin=sell-src.price,days=tradeRouteDistanceDays(src.s.id,dest.id),score=margin+demand*8+Math.max(0,4-dStock)*5+(src.role==='source'?7:0)-days;
  if(score>8)rows.push({from:src.s.id,to:dest.id,gid:g.id,margin,days,risk:crossRegionRouteLabel(src.s.id,dest.id),score,need:demand,stock:dStock})
 }
 const seen=new Set();return rows.sort((a,b)=>b.score-a.score).filter(x=>{const k=`${x.gid}:${locationRegion(x.from)}:${locationRegion(x.to)}`;if(seen.has(k))return false;seen.add(k);return true}).slice(0,limit)
}
