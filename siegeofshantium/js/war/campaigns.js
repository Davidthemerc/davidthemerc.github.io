/* v1.6.66.1 — Mobilization, Campaigns & Strategic AI */
const WAR_STRATEGY_VERSION=1;
function warStrategyState(){const W=ensureWarFoundation();if(!W.strategy||typeof W.strategy!=='object')W.strategy={version:WAR_STRATEGY_VERSION,lastTickDay:0,lastPlanningDay:0,contacts:[],history:[]};W.strategy.version=WAR_STRATEGY_VERSION;if(!Array.isArray(W.strategy.contacts))W.strategy.contacts=[];if(!Array.isArray(W.strategy.history))W.strategy.history=[];return W.strategy}
function warSideForFaction(w,f){return (w?.sides||[]).find(s=>s.includes(f))||null}
function warEnemiesForFaction(w,f){const own=warSideForFaction(w,f);if(!own)return[];return (w.sides||[]).filter(s=>s!==own).flat().filter(warFactionEligible)}
function warActiveFormations(f=null){return ensureWarFoundation().formations.filter(F=>!['destroyed','disbanded'].includes(F.status)&&(!f||F.faction===f))}
function warCampaigns(w){if(!Array.isArray(w.campaigns))w.campaigns=[];return w.campaigns}
function warSettlementValue(id){const L=worldLocation(id),S=settlementState(id);const tier={metropolis:7,city:6,town:4,village:3,outpost:2}[L?.settlementTier]||2;return tier*20+Math.min(60,(S?.population||100)/20)+Math.min(25,(S?.prosperity||50)/4)+(L?.type==='fort'?25:0)}
function warLocationDistance(a,b){const A=worldLocation(a),B=worldLocation(b);if(!A||!B)return 999;const regionPenalty=locationRegion(a)===locationRegion(b)?0:65;const dx=(A.x||0)-(B.x||0),dy=(A.y||0)-(B.y||0);return Math.sqrt(dx*dx+dy*dy)+regionPenalty}
function warCampaignOccupationController(locId){const O=typeof warOccupationAt==='function'?warOccupationAt(locId):null;return O&&['occupying','consolidating'].includes(O.status)?O.attackerFaction:null}
function warCampaignEffectiveController(locId){return warCampaignOccupationController(locId)||settlementControl(locId)}
function warCampaignObjectiveKind(w,f,target){const political=settlementControl(target),occupation=warCampaignOccupationController(target),enemies=warEnemiesForFaction(w,f);if(occupation&&enemies.includes(occupation))return political===f?'liberate':'recapture';if(political===f)return 'defend';if(enemies.includes(political)||enemies.includes(occupation))return 'capture';return null}
function warChooseObjective(w,f){
 const enemies=warEnemiesForFaction(w,f);if(!enemies.length)return null;const base=warFactionBase(f),hostile=[],friendly=[];
 for(const L of WORLD_LOCATIONS.filter(x=>x.settlement)){
  const kind=warCampaignObjectiveKind(w,f,L.id);if(!kind)continue;
  const value=warSettlementValue(L.id),distance=warLocationDistance(base,L.id);
  if(['capture','recapture','liberate'].includes(kind))hostile.push({id:L.id,enemy:warCampaignEffectiveController(L.id),kind,value,distance});
  else if(kind==='defend'){
   const threat=warActiveFormations().filter(F=>enemies.includes(F.faction)&&!['destroyed','disbanded'].includes(F.status)).reduce((n,F)=>n+Math.max(0,110-warLocationDistance(F.location,L.id)),0);
   if(threat>0||activeWarBattles().some(B=>B.status==='active'&&B.location===L.id))friendly.push({id:L.id,enemy:enemies[0],kind,value:value+threat,distance});
  }
 }
 const targets=hostile.length?hostile:friendly;targets.sort((a,b)=>(b.value-b.distance*.35)-(a.value-a.distance*.35));return targets[0]||null
}
function warCampaignObjectiveFamily(kind){return kind==='defend'?'defend':kind}
function warCampaignEquivalent(w,f,target,kind,exclude=null){const family=warCampaignObjectiveFamily(kind);return warCampaigns(w).find(c=>c!==exclude&&c.faction===f&&c.target===target&&warCampaignObjectiveFamily(c.objective)===family&&['forming','active','stalled'].includes(c.status))}
function warCampaignName(target,kind){const loc=worldLocation(target)?.name||target;return kind==='defend'?`Defense of ${loc}`:kind==='liberate'?`Liberation of ${loc}`:kind==='recapture'?`Recapture of ${loc}`:`${loc} Campaign`}
function warCreateCampaign(w,f){const target=warChooseObjective(w,f);if(!target)return null;const objective=target.kind||'capture',existing=warCampaignEquivalent(w,f,target.id,objective);if(existing)return existing;const C={id:`wc_${state.world.day}_${uid().slice(0,6)}`,warId:w.id,faction:f,enemyFaction:target.enemy,type:objective==='defend'?'defensive':'offensive',name:warCampaignName(target.id,objective),objective,target:target.id,staging:warFactionBase(f),status:'forming',phase:'mobilizing',createdDay:state.world.day,lastPlanDay:state.world.day,lastProgressDay:state.world.day,formationIds:[],progress:0};warCampaigns(w).push(C);ensureWarFoundation().history.push({day:state.world.day,type:'campaign_started',warId:w.id,campaignId:C.id,text:`${majorFaction(f).short} begins the ${C.name}.`});return C}
function warCampaignPhaseRank(phase){return ({enemy_contact:90,at_objective:80,besieging:75,advancing:65,marching:60,defending:55,reorienting:45,mobilizing:35,forming:25,no_force_available:0})[phase]??20}
function warMergeCampaigns(w,keep,drop){
 const W=ensureWarFoundation(),ids=new Set([...(keep.formationIds||[]),...(drop.formationIds||[])]);
 keep.formationIds=[...ids].filter(id=>W.formations.some(F=>F.id===id&&!['destroyed','disbanded'].includes(F.status)));
 keep.progress=Math.max(keep.progress||0,drop.progress||0);
 keep.createdDay=Math.min(keep.createdDay??state.world.day,drop.createdDay??state.world.day);
 keep.lastPlanDay=Math.max(keep.lastPlanDay||0,drop.lastPlanDay||0);keep.lastProgressDay=Math.max(keep.lastProgressDay||0,drop.lastProgressDay||0);
 if(warCampaignPhaseRank(drop.phase)>warCampaignPhaseRank(keep.phase))keep.phase=drop.phase;
 for(const F of W.formations)if(F.campaignId===drop.id){F.campaignId=keep.id;if(!keep.formationIds.includes(F.id)&&!['destroyed','disbanded'].includes(F.status))keep.formationIds.push(F.id)}
 drop.status='merged';drop.completedDay=state.world.day;drop.mergedInto=keep.id;return keep
}
function warCanonicalizeCampaigns(w){
 const W=ensureWarFoundation(),active=warCampaigns(w).filter(c=>['forming','active','stalled'].includes(c.status)),groups=new Map();
 for(const C of active){const key=`${C.faction}|${C.target}|${warCampaignObjectiveFamily(C.objective)}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(C)}
 for(const list of groups.values()){
  if(list.length<2)continue;
  list.sort((a,b)=>(a.createdDay??state.world.day)-(b.createdDay??state.world.day)||String(a.id).localeCompare(String(b.id)));
  const keep=list[0];for(const drop of list.slice(1))warMergeCampaigns(w,keep,drop);
  W.history.push({day:state.world.day,type:'campaigns_consolidated',warId:w.id,campaignId:keep.id,text:`Overlapping ${keep.name} commands are consolidated into one field campaign.`});
 }
 // Rebuild every active campaign's roster from both sides of the relationship so stale save mirrors cannot recreate duplicates.
 for(const C of warCampaigns(w).filter(c=>['forming','active','stalled'].includes(c.status))){
  const ids=new Set(C.formationIds||[]);for(const F of W.formations)if(F.campaignId===C.id&&!['destroyed','disbanded'].includes(F.status))ids.add(F.id);
  C.formationIds=[...ids].filter(id=>W.formations.some(F=>F.id===id&&!['destroyed','disbanded'].includes(F.status)));
 }
}
function warReconcileCampaigns(){
 const W=ensureWarFoundation();
 for(const w of activeWars())for(const C of warCampaigns(w).filter(c=>['forming','active','stalled'].includes(c.status))){
  if(!worldLocation(C.target)){C.status='cancelled';C.completedDay=state.world.day;continue}
  const proper=warCampaignObjectiveKind(w,C.faction,C.target);
  if(!proper){C.status='cancelled';C.completedDay=state.world.day;for(const id of C.formationIds||[]){const F=W.formations.find(x=>x.id===id);if(F&&F.campaignId===C.id)F.campaignId=null}continue}
  if(C.objective!==proper){C.objective=proper;C.type=proper==='defend'?'defensive':'offensive';C.name=warCampaignName(C.target,proper);C.phase=proper==='defend'?'defending':'reorienting';C.lastPlanDay=state.world.day}
 }
 for(const w of activeWars()){
  warCanonicalizeCampaigns(w);
  const active=warCampaigns(w).filter(c=>['forming','active','stalled'].includes(c.status));
  for(const C of active.filter(c=>c.type==='defensive'||c.objective==='defend')){
   const live=(C.formationIds||[]).map(id=>W.formations.find(F=>F.id===id)).filter(F=>F&&!['destroyed','disbanded'].includes(F.status));C.formationIds=[...new Set(live.map(F=>F.id))];
   if(live.length)continue;
   // An empty duplicate shell is retired immediately when a canonical defense for this objective exists.
   const canonical=active.find(x=>x!==C&&x.faction===C.faction&&x.target===C.target&&warCampaignObjectiveFamily(x.objective)==='defend'&&x.formationIds?.length);
   if(canonical){warMergeCampaigns(w,canonical,C);continue}
   const pending=warActiveFormations(C.faction).some(F=>F.warId===w.id&&F.role==='field'&&(!F.campaignId||F.campaignId===C.id)&&['mobilizing','ready','marching','holding'].includes(F.status));
   if(!pending&&state.world.day-(C.createdDay||state.world.day)>=2){C.status='closed';C.completedDay=state.world.day;C.phase='no_force_available';W.history.push({day:state.world.day,type:'campaign_closed',warId:w.id,campaignId:C.id,text:`${C.name} is folded into the wider defense after no field formation is available to sustain a separate command.`})}
  }
 }
}
function warEnsureCampaigns(){warReconcileCampaigns();for(const w of activeWars()){for(const side of w.sides||[])for(const f of side.filter(warFactionEligible)){let C=warCampaigns(w).find(c=>c.faction===f&&['forming','active','stalled'].includes(c.status));if(!C){C=warCreateCampaign(w,f);continue}if(state.world.day-C.lastPlanDay>=10){const target=warChooseObjective(w,f);if(target&&target.id!==C.target&&!warCampaignEquivalent(w,f,target.id,target.kind,C)){C.target=target.id;C.enemyFaction=target.enemy;C.objective=target.kind;C.type=target.kind==='defend'?'defensive':'offensive';C.name=warCampaignName(target.id,target.kind);C.lastPlanDay=state.world.day;C.phase=target.kind==='defend'?'defending':'reorienting'}}}}}
function warMobilizationTarget(f,w){const M=warMilitaryState(f),support=clamp(M.warSupport||50,10,95);return clamp(1+Math.floor((support-35)/25),1,3)}
function warMobilizeForWars(){const W=ensureWarFoundation();for(const w of activeWars())for(const side of w.sides||[])for(const f of side.filter(warFactionEligible)){const M=warMilitaryState(f),field=warActiveFormations(f).filter(F=>F.warId===w.id&&F.role==='field'),desired=warMobilizationTarget(f,w);if(field.length<desired&&state.world.day-(M.lastMobilizedDay||0)>=3){const available=Math.max(0,M.manpowerReserve-M.mobilized);if(available>=30){const F=createWarFormation(f,{role:'field',status:'mobilizing',strength:Math.min(95,Math.max(45,Math.round(available*.28)))});if(F){F.warId=w.id;F.mobilizeUntil=state.world.day+Math.max(1,Math.round(4-(M.readiness||50)/35));M.lastMobilizedDay=state.world.day;W.history.push({day:state.world.day,type:'mobilization',warId:w.id,formationId:F.id,text:`${F.name} is called into field service.`})}}}for(const F of field)if(F.status==='mobilizing'&&state.world.day>=(F.mobilizeUntil||F.createdDay+2)){F.status='ready';F.lastActionDay=state.world.day}}}
function warAssignCampaignForces(){const W=ensureWarFoundation();for(const w of activeWars())for(const C of warCampaigns(w).filter(c=>['forming','active','stalled'].includes(c.status))){const live=new Set(warActiveFormations(C.faction).filter(F=>F.warId===w.id).map(F=>F.id));C.formationIds=(C.formationIds||[]).filter(id=>live.has(id));const available=warActiveFormations(C.faction).filter(F=>F.warId===w.id&&F.role==='field'&&!F.campaignId&&!F.retreating&&!['mobilizing','recovering','engaged','occupying'].includes(F.status));for(const F of available){F.campaignId=C.id;C.formationIds.push(F.id)}if(C.formationIds.length){C.status='active';if(['forming','reorienting'].includes(C.phase))C.phase='advancing'}}}
function warRegionRouteStep(from,to){if(!from||!to||from===to)return null;const ra=locationRegion(from),rb=locationRegion(to);if(ra===rb)return {next:to,days:Math.max(1,worldTravelDays(from,to)),kind:'regional'};const queue=[[ra,[]]],seen=new Set([ra]);let path=null;while(queue.length){const [r,p]=queue.shift();if(r===rb){path=p;break}for(const nr of connectedRegions(r)){if(seen.has(nr))continue;seen.add(nr);queue.push([nr,p.concat(nr)])}}if(!path?.length)return null;const nr=path[0],conn=regionConnectionForRegions(ra,nr);if(!conn)return null;const gateway=locationRegion(conn.a)===ra?conn.a:conn.b,other=gateway===conn.a?conn.b:conn.a;if(from!==gateway)return {next:gateway,days:Math.max(1,worldTravelDays(from,gateway)),kind:'gateway',connectionId:conn.id};return {next:other,days:Math.max(1,conn.days||worldTravelDays(from,other)),kind:'cross_region',connectionId:conn.id}}
function warIssueFormationOrders(){const W=ensureWarFoundation();for(const w of activeWars())for(const C of warCampaigns(w).filter(c=>c.status==='active')){for(const id of C.formationIds||[]){const F=W.formations.find(x=>x.id===id);if(!F||['destroyed','disbanded','mobilizing','awaiting_engagement','engaged','recovering','occupying'].includes(F.status)||F.retreating)continue;if(F.location===C.target){F.destination=null;F.routeStep=null;F.travelRemaining=0;F.status='holding';C.phase='at_objective';C.progress=Math.max(C.progress||0,75);continue}if(!F.destination||F.destination!==C.target||!F.routeStep){const step=warRegionRouteStep(F.location,C.target);if(!step){F.status='holding';continue}F.destination=C.target;F.routeStep=step.next;F.travelRemaining=step.days;F.routeKind=step.kind;F.status='marching';F.lastActionDay=state.world.day}}}}
function warAdvanceFormations(){const W=ensureWarFoundation();for(const F of warActiveFormations()){if(F.status!=='marching'||!F.routeStep)continue;F.fatigue=clamp((F.fatigue||0)+2,0,100);F.supplyDays=Math.max(0,(F.supplyDays||0)-1);F.travelRemaining=Math.max(0,(F.travelRemaining||1)-1);if(F.travelRemaining>0)continue;const old=F.location;F.location=F.routeStep;F.routeStep=null;F.lastActionDay=state.world.day;if(typeof addRoutePressure==='function')addRoutePressure(old,F.location,.35);W.history.push({day:state.world.day,type:'formation_move',formationId:F.id,warId:F.warId,text:`${F.name} reaches ${worldLocation(F.location)?.name||F.location}.`});if(F.location===F.destination){if(F.retreating){F.status='recovering';F.recoverUntil=state.world.day+2;F.routeStep=null}else{F.status='holding';const w=W.wars.find(x=>x.id===F.warId),C=w?.campaigns?.find(x=>x.id===F.campaignId);if(C){C.phase='at_objective';C.progress=Math.max(C.progress||0,75);C.lastProgressDay=state.world.day}}}}}
function warDetectContacts(){
 const W=ensureWarFoundation(),S=warStrategyState(),live=warActiveFormations(),byLoc=new Map();
 for(const F of live){if(!byLoc.has(F.location))byLoc.set(F.location,[]);byLoc.get(F.location).push(F)}
 for(const [loc,list] of byLoc){
  if(list.length<2)continue;
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
   const A=list[i],B=list[j],w=warBetween(A.faction,B.faction);if(!w)continue;
   const key=[A.id,B.id].sort().join('|');let c=S.contacts.find(x=>x.key===key&&x.status==='active');
   if(!c){c={id:`contact_${state.world.day}_${uid().slice(0,5)}`,key,warId:w.id,location:loc,a:A.id,b:B.id,day:state.world.day,status:'active'};S.contacts.push(c);W.history.push({day:state.world.day,type:'enemy_contact',warId:w.id,text:`Opposing formations make contact near ${worldLocation(loc)?.name||loc}. Battle has not yet been resolved.`})}
   A.status='awaiting_engagement';B.status='awaiting_engagement';A.contactId=c.id;B.contactId=c.id;
   for(const F of [A,B]){const C=w.campaigns?.find(x=>x.id===F.campaignId);if(C){C.phase='enemy_contact';C.status='stalled'}}
  }
 }
 S.contacts=S.contacts.filter(c=>c.status==='active'||state.world.day-(c.day||0)<30).slice(-60)
}
function warStrategicDailyTick(){const S=warStrategyState();if(S.lastTickDay===state.world.day)return;S.lastTickDay=state.world.day;const perf=(n,fn)=>typeof sosPerfRun==='function'?sosPerfRun(n,fn):fn();perf('War — Mobilization',()=>warMobilizeForWars());perf('War — Campaign Planning',()=>warEnsureCampaigns());perf('War — Formation Orders',()=>{warAssignCampaignForces();warIssueFormationOrders()});perf('War — Military Movement',()=>warAdvanceFormations());perf('War — Contact Detection',()=>warDetectContacts());S.lastPlanningDay=state.world.day}
function warCampaignCard(C,w){const target=worldLocation(C.target)?.name||C.target,forces=(C.formationIds||[]).map(id=>ensureWarFoundation().formations.find(F=>F.id===id)).filter(Boolean),strength=forces.reduce((n,F)=>n+(F.strength||0),0);return `<div class="card"><div class="stat-row"><span><b>${esc(C.name)}</b></span><b>${esc((C.phase||C.status).replaceAll('_',' '))}</b></div><small>${esc(majorFaction(C.faction).short)} • objective: ${esc(C.objective)} ${esc(target)}</small><div class="compact">Assigned formations ${forces.length} • ${fmt(strength)} effectives • campaign progress ${Math.round(C.progress||0)}%</div></div>`}
function warFormationStatusLabel(F){const labels={garrison:'Garrison',mobilizing:'Mobilizing',ready:'Ready',marching:'Marching',holding:'Holding',awaiting_engagement:'Enemy Contact',engaged:'In Battle',recovering:'Recovering',destroyed:'Destroyed',disbanded:'Disbanded'};return labels[F.status]||F.status||'Active'}
function warFormationCard(F){const loc=worldLocation(F.location)?.name||F.location||'Unknown',dest=F.destination&&F.destination!==F.location?worldLocation(F.destination)?.name||F.destination:null,c=F.composition||{};return `<div class="card"><div class="stat-row"><span><b>${esc(F.name)}</b></span><b>${fmt(F.strength)} effectives</b></div><small>${esc(majorFaction(F.faction).short)} • ${esc(warFormationStatusLabel(F))} • ${esc(loc)}${dest?` → ${esc(dest)}`:''}</small><div class="compact">Infantry ${c.infantry||0} • Ranged ${c.ranged||0} • Cavalry ${c.cavalry||0} • Officers ${c.officers||0}<br>Morale ${Math.round(F.morale||0)}% • Readiness ${Math.round(F.readiness||0)}% • Supply ${Math.round(F.supplyDays||0)} days${F.status==='marching'?` • ${Math.max(0,F.travelRemaining||0)}d to next waypoint`:''}</div></div>`}
function showWarOverview(){modalRouteEnter('showWarOverview',Array.from(arguments));const W=ensureWarFoundation(),wars=activeWars(),forces=warActiveFormations(),S=warStrategyState(),mil=WAR_MAJOR_FACTIONS.filter(warFactionEligible).map(f=>{const M=warMilitaryState(f),fs=forces.filter(x=>x.faction===f),active=fs.reduce((n,x)=>n+x.strength,0);return `<div class="stat-row"><span>${esc(majorFaction(f).short)}</span><b>${fmt(active)} active • ${fmt(Math.max(0,M.manpowerReserve-M.mobilized))} reserve • readiness ${Math.round(M.readiness)}%</b></div>`}).join('');const warHtml=wars.length?wars.map(w=>`<div class="card"><div class="stat-row"><span><b>${esc(w.name)}</b></span><b>Day ${w.startedDay}</b></div><small>${esc(w.cause)}</small><div class="compact">${w.sides.map(s=>s.map(f=>esc(majorFaction(f).short)).join(' + ')).join(' ↔ ')}</div></div>`).join(''):'<div class="notice compact"><b>No declared wars.</b><br>Regional powers maintain forces and readiness. Strategic mobilization begins automatically when a formal war starts.</div>';const campaigns=wars.flatMap(w=>warCampaigns(w).filter(c=>!['completed','cancelled'].includes(c.status)).map(c=>warCampaignCard(c,w))).join('');const contacts=S.contacts.filter(c=>c.status==='active').map(c=>{const A=W.formations.find(F=>F.id===c.a),B=W.formations.find(F=>F.id===c.b);return `<div class="warning notice compact"><b>Opposing forces in contact — ${esc(worldLocation(c.location)?.name||c.location)}</b><br>${esc(A?.name||'Formation')} ↔ ${esc(B?.name||'Formation')}<br><small>Battle resolution is intentionally reserved for the upcoming combat layer.</small></div>`}).join('');overlay(`<h2>War & Military Affairs</h2><p class="muted">Persistent military establishments now mobilize, establish campaign objectives, issue field orders, and march through the regional world. Battles are not yet resolved in this stage.</p><h3>Wars</h3>${warHtml}<h3>Active Campaigns</h3>${campaigns||'<p class="muted">No active military campaigns.</p>'}${contacts?`<h3>Enemy Contact</h3>${contacts}`:''}<h3>Military Balance</h3><div class="card">${mil}</div><h3>Known Formations</h3>${forces.map(warFormationCard).join('')||'<p class="muted">No formations recorded.</p>'}<div class="dialog-footer"><button id="warOverviewBack">Back</button></div>`,true);$('#warOverviewBack').onclick=()=>{resetModalNavigation();closeOverlay();renderOpenWorld()}}
