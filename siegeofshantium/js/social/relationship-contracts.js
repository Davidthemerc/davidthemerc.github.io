function relationshipContractState(){
 ensureWorldState();if(!state.world.relationshipContracts||typeof state.world.relationshipContracts!=='object')state.world.relationshipContracts={messengers:[],history:[],lastGenDay:{},serial:0};
 const R=state.world.relationshipContracts;if(!Array.isArray(R.messengers))R.messengers=[];if(!Array.isArray(R.history))R.history=[];if(!R.lastGenDay)R.lastGenDay={};return R
}
function relationshipContractCandidates(locId){
 const rows=[],present=settlementNpcsPresent(locId),companions=activeRoadCompanions(),travelers=meaningfulTravelersForLocation(locId);
 for(const npc of present){const rel=npcRelationshipState(npc.id);if((rel.familiarity||0)>=4&&rel.opinion>-3)rows.push({kind:'npc',npc,weight:(rel.familiarity||0)+Math.max(0,rel.opinion||0)})}
 for(const m of companions){const ops=Object.values(companionNpcOpinionState()).filter(o=>o.compId===m.id&&Math.abs(o.score)>=2);if((m.trust||0)>=55||ops.length)rows.push({kind:'companion',companion:m,weight:Math.floor((m.trust||0)/15)+ops.length})}
 for(const r of travelers){if(travelerAttitudeScore(r)>=4&&(r.contractsCompleted||0)>=1)rows.push({kind:'traveler',traveler:r,weight:travelerAttitudeScore(r)+(r.contractsCompleted||0)*2})}
 return rows.sort((a,b)=>b.weight-a.weight)
}
function relationshipContractType(source,locId){
 const role=String(source.npc?.role||'').toLowerCase(),r=source.traveler,comp=source.companion;
 if(source.kind==='npc'){
  if(role.includes('guard')||role.includes('watch')||role.includes('scout')||role.includes('officer'))return pick(['hunt','visit','delivery']);
  if(role.includes('trader')||role.includes('factor')||role.includes('merchant')||role.includes('broker'))return pick(['delivery','procure','escort']);
  if(role.includes('healer')||role.includes('teacher')||role.includes('baker')||role.includes('cook'))return pick(['procure','visit','delivery']);
  return pick(['visit','delivery','procure']);
 }
 if(source.kind==='traveler')return r?.kind==='mercenary'?pick(['escort','hunt','visit']):pick(['delivery','escort','procure']);
 if(source.kind==='companion')return comp?.role==='ranger'||comp?.role==='rogue'?pick(['visit','hunt','delivery']):pick(['visit','delivery','escort']);
 return'visit'
}
function relationshipContractTarget(source,locId,type){
 const unlocked=state.world.unlockedRegions||['shantium'],all=unlocked.flatMap(r=>regionalSettlements(r)).filter(x=>!x.hidden&&x.id!==locId);
 if(source.kind==='npc'){
  const moves=populationMovementState().history.filter(x=>x.type==='npc_move'&&(x.from===locId||x.to===locId)).slice(-8);
  if(moves.length&&chance(.45)){const m=pick(moves);return m.to===locId?m.from:m.to}
 }
 if(source.kind==='traveler'&&source.traveler?.settledAt&&source.traveler.settledAt!==locId&&state.world.settlements[source.traveler.settledAt])return source.traveler.settledAt;
 if(source.kind==='companion'){
  const ops=Object.values(companionNpcOpinionState()).filter(o=>o.compId===source.companion.id&&Math.abs(o.score)>=2);
  const o=ops[0];if(o){const home=npcHomeLocation(o.npcId),cur=currentNpcLocation(o.npcId,home);if(cur&&cur!==locId)return cur}
 }
 return pick(all)?.id||locId
}
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
