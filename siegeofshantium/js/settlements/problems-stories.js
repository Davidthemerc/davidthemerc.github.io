function progressSettlementProblem(locId,amount=1,reason=''){
 const p=settlementProblem(locId);if(!p)return;p.progress=(p.progress||0)+amount;syncSettlementProblemMatter(locId,p);if(reason)recordWorldHistory(SOSText("settlements_problems_stories.progressSettlementProblem.001",worldLocation(locId).name,reason,amount,p.title),'good',SOSText("settlements_problems_stories.progressSettlementProblem.002"));
 if(p.progress>=3){p.status='resolved';p.resolvedDay=state.world.day;const ss=settlementState(locId);ss.security=Math.min(100,ss.security+2);ss.prosperity=Math.min(100,ss.prosperity+2);ss.problemCooldownUntil=state.world.day+5;changeLocalReputation(locId,1,SOSText("settlements_problems_stories.progressSettlementProblem.003",p.title));recordWorldNews(SOSText("settlements_problems_stories.progressSettlementProblem.004",p.title,worldLocation(locId).name),'good');syncSettlementProblemMatter(locId,p)}
}
function tickSettlementProblems(){
 for(const [locId,p] of Object.entries(state.world.settlementProblems||{})){
  if(!p||p.status!=='active')continue;const ss=settlementState(locId),fx=settlementProblemEffects(locId);if(!Number.isFinite(p.extensions))p.extensions=0;if(!Number.isFinite(p.lastEffectDay))p.lastEffectDay=p.startedDay||state.world.day;
  if(state.world.day-(p.lastEffectDay||0)>=2){ss.security=clamp(ss.security+(fx.security||0),0,100);ss.prosperity=clamp(ss.prosperity+(fx.prosperity||0),0,100);p.lastEffectDay=state.world.day}
  if(state.world.day>p.expiresDay){
   if((p.progress||0)>=2){p.status='resolved';p.resolvedDay=state.world.day;ss.problemCooldownUntil=state.world.day+4;recordWorldNews(SOSText("settlements_problems_stories.tickSettlementProblems.001",p.title,worldLocation(locId).name),'info')}
   else if((p.extensions||0)<1){p.extensions=(p.extensions||0)+1;p.expiresDay=state.world.day+3;recordWorldHistory(SOSText("settlements_problems_stories.tickSettlementProblems.002",worldLocation(locId).name,p.title),'info',SOSText("settlements_problems_stories.tickSettlementProblems.003"))}
   else{p.status='unresolved';p.resolvedDay=state.world.day;p.outcome=SOSText("settlements_problems_stories.tickSettlementProblems.004");ss.security=Math.max(0,ss.security+(fx.security<0?-1:0));ss.prosperity=Math.max(0,ss.prosperity+(fx.prosperity<0?-1:0));ss.problemCooldownUntil=state.world.day+6;recordWorldNews(SOSText("settlements_problems_stories.tickSettlementProblems.005",p.title,worldLocation(locId).name),'info')}
   syncSettlementProblemMatter(locId,p)
  }
 }
}

function capitalSecurityDailyTick(){
 for(const capId of Object.keys(REGIONAL_CAPITALS)){
  const ss=settlementState(capId),base=defaultSettlementState()[capId]||{security:70,prosperity:55};
  // Capitals can be troubled, but ordinary background drift should not leave them effectively undefended.
  const softFloor=Math.max(42,Math.round(base.security*.62));
  if(ss.security<softFloor)ss.security=Math.min(softFloor,ss.security+2);
 }
 resolveCapitalSecurityZones()
}
function settlementBackgroundRecoveryDaily(){
 const defaults=defaultSettlementState(),day=state.world.day;
 for(const [locId,ss] of Object.entries(state.world.settlements||{})){
  if(settlementProblem(locId))continue;
  const base=defaults[locId]||{security:55,prosperity:50},quietRaid=day-(ss.lastRaidDamageDay||-99)>=3;
  if(day%2===0&&ss.security<Math.min(60,base.security*.78)){
   const gain=ss.security<15?2:1;ss.security=Math.min(100,ss.security+gain)
  }
  if(quietRaid&&day%2===0&&ss.prosperity<Math.min(60,base.prosperity*.80)){
   const gain=ss.prosperity<12?2:1;ss.prosperity=Math.min(100,ss.prosperity+gain)
  }
 }
}
function settlementProblemHTML(locId){const p=settlementProblem(locId);if(!p)return'';return SOSText("settlements_problems_stories.settlementProblemHTML.001",esc(p.title),esc(p.desc),Math.min(3,p.progress||0))}
function helpSettlementProblem(locId){
 const p=settlementProblem(locId);if(!p)return showSettlementSpecial(locId);const ss=settlementState(locId);let text='';
 if(['shortage','trade_slump','refugee_load','grain_road','warehouse_backlog','dry_supply','requisition_pressure'].includes(p.type)){const cost=Math.min(state.gold,18);state.gold-=cost;ss.prosperity=Math.min(100,ss.prosperity+1);text=SOSText("settlements_problems_stories.helpSettlementProblem.001",cost)}
 else{advanceWorldDays(1,SOSText("settlements_problems_stories.helpSettlementProblem.002",p.title));ss.security=Math.min(100,ss.security+2);text=SOSText("settlements_problems_stories.helpSettlementProblem.003")}
 progressSettlementProblem(locId,1,SOSText("settlements_problems_stories.helpSettlementProblem.004"));save();actionResult(p.title,text,'good',()=>showSettlementSpecial(locId))
}
function reputationMilestoneState(locId){if(!state.world.reputationMilestones[locId])state.world.reputationMilestones[locId]={known:false,trusted:false,hero:false};return state.world.reputationMilestones[locId]}
function checkReputationMilestones(locId){
 const rep=localReputation(locId),m=reputationMilestoneState(locId),loc=worldLocation(locId);
 if(rep>=3&&!m.known){m.known=true;recordWorldHistory(SOSText("settlements_problems_stories.checkReputationMilestones.001",loc.name),'good',SOSText("settlements_problems_stories.checkReputationMilestones.002"))}
 if(rep>=7&&!m.trusted){m.trusted=true;recordWorldNews(SOSText("settlements_problems_stories.checkReputationMilestones.003",loc.name),'good');if(locId==='shantium')state.world.shantiumCommunity.recognitions.push({day:state.world.day,text:SOSText("settlements_problems_stories.checkReputationMilestones.004")})}
 if(rep>=12&&!m.hero){m.hero=true;recordWorldNews(SOSText("settlements_problems_stories.checkReputationMilestones.005",loc.name),'good');if(locId==='shantium')state.world.shantiumCommunity.recognitions.push({day:state.world.day,text:SOSText("settlements_problems_stories.checkReputationMilestones.006")})}
}
function localReputationBenefits(locId){
 const rep=localReputation(locId),out=[];if(rep>=3)out.push(SOSText("settlements_problems_stories.localReputationBenefits.001"));if(rep>=7)out.push(SOSText("settlements_problems_stories.localReputationBenefits.002"));if(rep>=12)out.push(SOSText("settlements_problems_stories.localReputationBenefits.003"));if(rep<=-2)out.push(SOSText("settlements_problems_stories.localReputationBenefits.004"));if(rep<=-6)out.push(SOSText("settlements_problems_stories.localReputationBenefits.005"));if(rep<=-10)out.push(SOSText("settlements_problems_stories.localReputationBenefits.006"));return out
}
function reputationServiceDiscount(locId){const r=localReputation(locId);return r>=12?.78:r>=7?.88:r<=-6?1.16:r<=-2?1.08:1}
function maybeFreeLocalService(locId,kind){const rep=localReputation(locId),key=`${locId}:${kind}:free:${state.world.day}`;if(rep<12||state.world.reputationMilestones[key])return false;if(chance(.28)){state.world.reputationMilestones[key]=true;return true}return false}

function populationMovementState(){
 ensureWorldState();if(!state.world.populationMovement||typeof state.world.populationMovement!=='object')state.world.populationMovement={npcResidences:{},households:[],history:[],lastTickDay:state.world.day,lastHouseholdId:0};
 const P=state.world.populationMovement;if(!P.npcResidences)P.npcResidences={};if(!Array.isArray(P.households))P.households=[];if(!Array.isArray(P.history))P.history=[];return P
}
function npcHomeLocation(npcId){
 for(const [home,list] of Object.entries(SETTLEMENT_NPCS))if(list.some(n=>n.id===npcId))return home;return null
}
function npcResidenceRecord(npcId){
 const P=populationMovementState(),home=npcHomeLocation(npcId);if(!home)return null;
 return P.npcResidences[npcId]||(P.npcResidences[npcId]={npcId,home,current:home,status:'home',sinceDay:1,reason:SOSText("settlements_problems_stories.npcResidenceRecord.001"),history:[]})
}
function npcPermanentLocation(npcId,homeLoc=null){
 const r=npcResidenceRecord(npcId);return r?.current||homeLoc||npcHomeLocation(npcId)
}
function settlementPopulationAttractiveness(locId,role=''){
 const ss=settlementState(locId),econ=locationRegion(locId)==='redstone'?sengiaEconomyState().settlements[locId]:null,security=ss.security||50,pros=ss.prosperity||50,problem=settlementProblem(locId);let s=pros*.45+security*.35+(100-(problem?25:0))*.20;
 if(econ)s+=((econ.recovery||50)-50)*.15+((econ.food||50)-50)*.08;
 role=String(role).toLowerCase();
 if(role.includes('trader')||role.includes('factor')||role.includes('merchant')||role.includes('broker'))s+=pros*.12;
 if(role.includes('guard')||role.includes('watch')||role.includes('officer')||role.includes('veteran'))s+=security*.08;
 if(role.includes('farmer')||role.includes('seed')||role.includes('miller'))s+=(locId==='briarlake'?15:0);
 return s
}
function populationDestinationsForNpc(npc){
 const home=npcHomeLocation(npc.id),unlocked=state.world.unlockedRegions||['shantium'],pool=unlocked.flatMap(r=>regionalSettlements(r)).filter(l=>l.id!==npcPermanentLocation(npc.id,home)&&!l.hidden);
 return pool.sort((a,b)=>settlementPopulationAttractiveness(b.id,npc.role)-settlementPopulationAttractiveness(a.id,npc.role))
}
function relocationReason(npc,from,to){
 const fromS=settlementState(from),toS=settlementState(to),role=String(npc.role||'').toLowerCase();
 if(toS.security-fromS.security>=18)return'safety';
 if(toS.prosperity-fromS.prosperity>=18)return'work';
 if(role.includes('veteran'))return SOSText("settlements_problems_stories.relocationReason.001");
 if(role.includes('trader')||role.includes('factor')||role.includes('merchant'))return SOSText("settlements_problems_stories.relocationReason.002");
 if(role.includes('healer')||role.includes('teacher'))return SOSText("settlements_problems_stories.relocationReason.003");
 return SOSText("settlements_problems_stories.relocationReason.004")
}
function relocateSettlementNpc(npcId,to,reason='opportunity',permanent=true){
 const P=populationMovementState(),r=npcResidenceRecord(npcId),npc=settlementNpc(r?.home||to,npcId);if(!r||!npc||!state.world.settlements?.[to])return null;
 const from=r.current;r.current=to;r.status=permanent?'relocated':SOSText("settlements_problems_stories.relocateSettlementNpc.001");r.sinceDay=state.world.day;r.reason=reason;r.history.push({day:state.world.day,from,to,reason,permanent});r.history=r.history.slice(-12);
 if(permanent&&state.world.npcMovements?.[npcId])delete state.world.npcMovements[npcId];
 const text=SOSText("settlements_problems_stories.relocateSettlementNpc.002",npc.name,permanent?'moves':'establishes a temporary base',worldLocation(from).name,worldLocation(to).name,reason);
 P.history.push({day:state.world.day,type:'npc_move',npcId,from,to,reason,permanent,text});P.history=P.history.slice(-100);recordWorldHistory(text,'info',SOSText("settlements_problems_stories.relocateSettlementNpc.003"));if(permanent&&((npcRelationshipState(npc.id).familiarity||0)>=4||chance(.45))){const source={kind:'npc',npc,weight:(npcRelationshipState(npc.id).familiarity||3)+2};createRelationshipGeneratedContract(to,source,true)}
 npcMemoryAdd(npcId,SOSText("settlements_problems_stories.relocateSettlementNpc.004",worldLocation(from).name,worldLocation(to).name,reason),1);
 return r
}
function maybeRelocateSettlementNpc(){
 const all=Object.values(SETTLEMENT_NPCS).flat(),eligible=all.filter(n=>{const r=npcResidenceRecord(n.id);return r&&state.world.day-(r.sinceDay||1)>=12});
 if(!eligible.length||!chance(.12))return null;const npc=pick(eligible),r=npcResidenceRecord(npc.id),dests=populationDestinationsForNpc(npc),to=dests[0];if(!to)return null;
 const currentScore=settlementPopulationAttractiveness(r.current,npc.role),newScore=settlementPopulationAttractiveness(to.id,npc.role);if(newScore<currentScore+10&&!chance(.25))return null;
 return relocateSettlementNpc(npc.id,to.id,relocationReason(npc,r.current,to.id),true)
}
function ensureDisplacedHouseholds(){
 const P=populationMovementState();if(P.households.length)return P.households;
 const seeds=[[SOSText("settlements_problems_stories.ensureDisplacedHouseholds.001"),'southroad'],[SOSText("settlements_problems_stories.ensureDisplacedHouseholds.002"),'river'],[SOSText("settlements_problems_stories.ensureDisplacedHouseholds.003"),'northgate'],[SOSText("settlements_problems_stories.ensureDisplacedHouseholds.004"),'sengia'],[SOSText("settlements_problems_stories.ensureDisplacedHouseholds.005"),'briarlake']];
 for(const [name,home] of seeds)if(state.world.settlements?.[home])P.households.push({id:`house_${++P.lastHouseholdId}`,name,home,current:home,status:'settled',members:rnd(2,6),sinceDay:1,history:[]});
 return P.households
}
function householdDestination(h){
 const pool=(state.world.unlockedRegions||['shantium']).flatMap(r=>regionalSettlements(r)).filter(l=>l.id!==h.current&&!l.hidden).sort((a,b)=>settlementPopulationAttractiveness(b.id)-settlementPopulationAttractiveness(a.id));return pool[0]||null
}
function moveHousehold(h,to,reason){
 const P=populationMovementState(),from=h.current;h.current=to;h.status=to===h.home?'returned home':'resettled';h.sinceDay=state.world.day;h.history.push({day:state.world.day,from,to,reason});h.history=h.history.slice(-10);
 const text=SOSText("settlements_problems_stories.moveHousehold.001",h.name,to===h.home?'returns to':'resettles in',worldLocation(to).name,reason);P.history.push({day:state.world.day,type:'household_move',householdId:h.id,from,to,reason,text});P.history=P.history.slice(-100);recordWorldHistory(text,'info',SOSText("settlements_problems_stories.moveHousehold.002"));return h
}
function maybeMoveHousehold(){
 const P=populationMovementState();ensureDisplacedHouseholds();if(!chance(.10))return null;const h=pick(P.households.filter(x=>state.world.day-(x.sinceDay||1)>=10));if(!h)return null;
 if(h.current!==h.home&&settlementPopulationAttractiveness(h.home)>=settlementPopulationAttractiveness(h.current)+5&&chance(.5))return moveHousehold(h,h.home,SOSText("settlements_problems_stories.maybeMoveHousehold.001"));
 const to=householdDestination(h);if(!to)return null;const reason=settlementState(h.current).security<40?'security concerns':settlementState(to.id).prosperity>settlementState(h.current).prosperity?'work and housing':SOSText("settlements_problems_stories.maybeMoveHousehold.002");return moveHousehold(h,to.id,reason)
}
function maybeEstablishTravelerBase(){
 const R=travelerRegistryState(),cands=Object.values(R.records).filter(r=>!r.settledAt&&(r.social?.familiarity||0)>=3&&((r.contractsCompleted||0)>=1||(r.helped||0)>=2));if(!cands.length||!chance(.10))return null;
 const r=pick(cands),regions=r.regions?.length?r.regions:(state.world.unlockedRegions||['shantium']),region=pick(regions),to=regionalSettlements(region).sort((a,b)=>settlementPopulationAttractiveness(b.id)-settlementPopulationAttractiveness(a.id))[0];if(!to)return null;
 r.settledAt=to.id;r.professionShift=r.professionShift||(r.kind==='merchant'?'regional factor':r.kind==='mercenary'?'licensed escort company':r.kind==='refugees'?'settled households':SOSText("settlements_problems_stories.maybeEstablishTravelerBase.001"));r.history.push({day:state.world.day,event:'base_established',detail:SOSText("settlements_problems_stories.maybeEstablishTravelerBase.002",to.name),region});const text=SOSText("settlements_problems_stories.maybeEstablishTravelerBase.003",r.name,to.name);populationMovementState().history.push({day:state.world.day,type:'traveler_base',travelerId:r.id,to:to.id,text});recordWorldHistory(text,'good',SOSText("settlements_problems_stories.maybeEstablishTravelerBase.004"));return r
}
function populationMovementDailyTick(){
 if(!isOpenWorld())return;const P=populationMovementState();ensureDisplacedHouseholds();if(P.lastTickDay>=state.world.day)return;
 while(P.lastTickDay<state.world.day){P.lastTickDay++;if(P.lastTickDay%4===0)maybeRelocateSettlementNpc();if(P.lastTickDay%5===0)maybeMoveHousehold();if(P.lastTickDay%6===0)maybeEstablishTravelerBase()}
 P.history=P.history.slice(-100)
}
function populationAtSettlementHTML(locId){
 const P=populationMovementState(),moves=P.history.filter(x=>(x.to===locId||x.from===locId)&&state.world.day-x.day<=20).slice(-4).reverse(),house=ensureDisplacedHouseholds().filter(h=>h.current===locId);
 if(!moves.length&&!house.length)return'';
 return SOSText("settlements_problems_stories.populationAtSettlementHTML.001",house.map(h=>`<div class="card compact"><b>${esc(h.name)}</b><br><small>${h.members} people • ${esc(h.status)} since Day ${h.sinceDay}</small></div>`).join(''),moves.map(x=>`<div class="card compact"><b>Day ${x.day}</b><br>${esc(x.text)}</div>`).join(''))
}
function showPopulationMovementJournal(){modalRouteEnter(SOSText("settlements_problems_stories.showPopulationMovementJournal.001"),Array.from(arguments));
 const P=populationMovementState(),hist=P.history.slice(-18).reverse(),relocated=Object.values(P.npcResidences).filter(r=>r.current!==r.home),bases=Object.values(travelerRegistryState().records).filter(r=>r.settledAt);
 overlay(SOSText("settlements_problems_stories.showPopulationMovementJournal.002",relocated.map(r=>{const n=settlementNpc(r.home,r.npcId);return `<div class="card compact"><b>${esc(n?.name||r.npcId)}</b><br>${esc(worldLocation(r.home).name)} → ${esc(worldLocation(r.current).name)} • ${esc(r.reason)}</div>`}).join('')||'<p class="muted">No named resident has permanently relocated yet.</p>',ensureDisplacedHouseholds().map(h=>`<div class="card compact"><b>${esc(h.name)}</b><br>${esc(worldLocation(h.current).name)} • ${esc(h.status)} • ${h.members} people</div>`).join(''),bases.map(r=>`<div class="card compact"><b>${esc(r.name)}</b><br>Regular base: ${esc(worldLocation(r.settledAt).name)}${r.professionShift?` • ${esc(r.professionShift)}`:''}</div>`).join('')||'<p class="muted">No recurring traveler has established a regular base yet.</p>',hist.map(x=>`<div class="card compact"><b>Day ${x.day}</b><br>${esc(x.text)}</div>`).join('')||'<p class="muted">No recent movement recorded.</p>'),true);wireClose()
}
function currentNpcLocation(npcId,homeLoc){const base=npcPermanentLocation(npcId,homeLoc),move=state.world.npcMovements?.[npcId];return move&&move.untilDay>=state.world.day?move.location:base}
function maybeMoveSettlementNPCs(){
 const movers=[['river_trader','river',['stonebridge','shantium']],['stone_broker','stonebridge',['river','shantium']],['north_scout','northgate',['river']],['south_runner','southroad',['stonebridge','river']],['red_clerk','redoubt',['stonebridge']]];
 for(const [id,home,dests] of movers){const cur=state.world.npcMovements[id];if(cur&&cur.untilDay>=state.world.day)continue;const base=npcPermanentLocation(id,home),valid=dests.filter(d=>d!==base);if(valid.length&&chance(.14)){const dest=pick(valid);state.world.npcMovements[id]={location:dest,home:base,untilDay:state.world.day+rnd(1,3)};recordWorldHistory(SOSText("settlements_problems_stories.maybeMoveSettlementNPCs.001",settlementNpc(home,id)?.name||id,worldLocation(base).name,worldLocation(dest).name),'info',SOSText("settlements_problems_stories.maybeMoveSettlementNPCs.002"))}}
}
function politicalNpcDead(npcId){for(const ps of Object.values(state?.world?.politics?.settlements||{}))if(ps?.covert?.deadNpcs?.[npcId])return ps.covert.deadNpcs[npcId];return null}
function settlementNpcsPresent(locId){const rows=[];for(const [home,list] of Object.entries(SETTLEMENT_NPCS))for(const n of list)if(!politicalNpcDead(n.id)&&currentNpcLocation(n.id,home)===locId)rows.push({...n,home});return rows}
function shantiumCommunityMood(){const ss=settlementState('shantium'),rep=localReputation('shantium');if(settlementProblem('shantium'))return'concerned';if(ss.security>=75&&ss.prosperity>=65&&rep>=7)return'confident';if(ss.security<40||ss.prosperity<35)return'anxious';return'steady'}
function shantiumCommunityText(){const mood=shantiumCommunityMood(),rep=localReputation('shantium'),h=state.world.shantiumCommunity;h.publicMood=mood;if(mood==='confident')return SOSText("settlements_problems_stories.shantiumCommunityText.001");if(mood==='concerned')return SOSText("settlements_problems_stories.shantiumCommunityText.002");if(mood==='anxious')return SOSText("settlements_problems_stories.shantiumCommunityText.003");if(rep>=12)return SOSText("settlements_problems_stories.shantiumCommunityText.004");return SOSText("settlements_problems_stories.shantiumCommunityText.005")}
function showShantiumCommunity(){modalRouteEnter(SOSText("settlements_problems_stories.showShantiumCommunity.001"),Array.from(arguments));
 const h=state.world.shantiumCommunity,rep=localReputation('shantium'),ss=settlementState('shantium'),recent=(h.recognitions||[]).slice(-6).reverse();
 overlay(SOSText("settlements_problems_stories.showShantiumCommunity.002",esc(shantiumCommunityText()),esc(h.publicMood),ss.security,ss.prosperity,esc(localRepTier(rep)),recent.map(x=>`<div class="card compact"><b>Day ${x.day}</b><br>${esc(x.text)}</div>`).join('')||'<p class="muted">The Guardian’s place in Shantium is still being defined.</p>',localReputationBenefits('shantium').map(x=>`<li>${esc(x)}</li>`).join(''),settlementProblemHTML('shantium')),true);if($('#helpLocalProblem'))$('#helpLocalProblem').onclick=()=>helpSettlementProblem('shantium');$('#communityBack').onclick=()=>SOSServices.navigation.back(showHomeBase)
}
function settlementConditionText(locId){
 const ss=settlementState(locId),control=settlementControl(locId),rep=localReputation(locId);
 let condition=ss.security<30?'tense and poorly protected':ss.security<50?'uneasy but functioning':ss.security>=75?'well-patrolled and orderly':SOSText("settlements_problems_stories.settlementConditionText.001");
 let economy=ss.prosperity<30?'Shops are sparse and people count every coin.':ss.prosperity<50?'Trade is subdued and stock is inconsistent.':ss.prosperity>=75?'Market traffic is strong and new goods arrive regularly.':SOSText("settlements_problems_stories.settlementConditionText.002");
 let welcome=rep>=12?'People openly recognize the Guardian and make room when the company arrives.':rep>=7?'The Guardian is greeted as a trusted local ally.':rep>=3?'Several people recognize the Guardian from earlier visits.':rep<=-3?'Conversation quiets when the Guardian enters.':SOSText("settlements_problems_stories.settlementConditionText.003");
 const event=settlementEvent(locId),evidence=settlementEvidence(locId).slice(-1)[0],factions=factionRepresentativesAt(locId).slice(0,2).map(([f,v])=>`${majorFaction(f).short} ${factionPresenceTier(v)}`).join(', ');return SOSText("settlements_problems_stories.settlementConditionText.004",worldLocation(locId).name,condition,control,economy,welcome,factions?` Visible political presence: ${factions}.`:'',event&&!event.resolved?` Today: ${event.title}.`:'',evidence?` Visible consequence: ${evidence.text}`:'')
}

const REGIONAL_STORY_DEFS={
 broken_supply:{title:SOSText("settlements_problems_stories.settlementConditionText.005"),start:'river',summary:SOSText("settlements_problems_stories.settlementConditionText.006"),stages:[SOSText("settlements_problems_stories.settlementConditionText.007"),SOSText("settlements_problems_stories.settlementConditionText.008"),SOSText("settlements_problems_stories.settlementConditionText.009")]},
 road_knives:{title:SOSText("settlements_problems_stories.settlementConditionText.010"),start:'northgate',summary:SOSText("settlements_problems_stories.settlementConditionText.011"),stages:[SOSText("settlements_problems_stories.settlementConditionText.012"),SOSText("settlements_problems_stories.settlementConditionText.013"),SOSText("settlements_problems_stories.settlementConditionText.014")]},
 displaced:{title:SOSText("settlements_problems_stories.settlementConditionText.015"),start:'southroad',summary:SOSText("settlements_problems_stories.settlementConditionText.016"),stages:[SOSText("settlements_problems_stories.settlementConditionText.017"),SOSText("settlements_problems_stories.settlementConditionText.018"),SOSText("settlements_problems_stories.settlementConditionText.019")]},
 quiet_observer:{title:SOSText("settlements_problems_stories.settlementConditionText.020"),start:'stonebridge',summary:SOSText("settlements_problems_stories.settlementConditionText.021"),stages:[SOSText("settlements_problems_stories.settlementConditionText.022"),SOSText("settlements_problems_stories.settlementConditionText.023"),SOSText("settlements_problems_stories.settlementConditionText.024")]},
 winterstone_run:{title:SOSText("settlements_problems_stories.settlementConditionText.025"),start:'stonebridge',crossRegion:true,summary:SOSText("settlements_problems_stories.settlementConditionText.026"),stages:[SOSText("settlements_problems_stories.settlementConditionText.027"),SOSText("settlements_problems_stories.settlementConditionText.028"),SOSText("settlements_problems_stories.settlementConditionText.029"),SOSText("settlements_problems_stories.settlementConditionText.030")]},
 bread_uphill:{title:SOSText("settlements_problems_stories.settlementConditionText.031"),start:'zion',crossRegion:true,summary:SOSText("settlements_problems_stories.settlementConditionText.032"),stages:[SOSText("settlements_problems_stories.settlementConditionText.033"),SOSText("settlements_problems_stories.settlementConditionText.034"),SOSText("settlements_problems_stories.settlementConditionText.035"),SOSText("settlements_problems_stories.settlementConditionText.036")]},
 watchfires:{title:SOSText("settlements_problems_stories.settlementConditionText.037"),start:'skybreak',crossRegion:true,summary:SOSText("settlements_problems_stories.settlementConditionText.038"),stages:[SOSText("settlements_problems_stories.settlementConditionText.039"),SOSText("settlements_problems_stories.settlementConditionText.040"),SOSText("settlements_problems_stories.settlementConditionText.041"),SOSText("settlements_problems_stories.settlementConditionText.042")]},
 two_gatekeepers:{title:SOSText("settlements_problems_stories.settlementConditionText.043"),start:'northgate',crossRegion:true,summary:SOSText("settlements_problems_stories.settlementConditionText.044"),stages:[SOSText("settlements_problems_stories.settlementConditionText.045"),SOSText("settlements_problems_stories.settlementConditionText.046"),SOSText("settlements_problems_stories.settlementConditionText.047")]},
 sengia_hunger:{title:SOSText("settlements_problems_stories.settlementConditionText.048"),start:'sengia',decision:'sengia',redstone:true,summary:SOSText("settlements_problems_stories.settlementConditionText.049"),stages:[SOSText("settlements_problems_stories.settlementConditionText.050"),SOSText("settlements_problems_stories.settlementConditionText.051"),SOSText("settlements_problems_stories.settlementConditionText.052"),SOSText("settlements_problems_stories.settlementConditionText.053"),SOSText("settlements_problems_stories.settlementConditionText.054")]},
 lockwood_lines:{title:SOSText("settlements_problems_stories.settlementConditionText.055"),start:'lockwood',decision:'lockwood',redstone:true,summary:SOSText("settlements_problems_stories.settlementConditionText.056"),stages:[SOSText("settlements_problems_stories.settlementConditionText.057"),SOSText("settlements_problems_stories.settlementConditionText.058"),SOSText("settlements_problems_stories.settlementConditionText.059"),SOSText("settlements_problems_stories.settlementConditionText.060")]},
 paper_army:{title:SOSText("settlements_problems_stories.settlementConditionText.061"),start:'glenbrook',decision:'sengia',redstone:true,summary:SOSText("settlements_problems_stories.settlementConditionText.062"),stages:[SOSText("settlements_problems_stories.settlementConditionText.063"),SOSText("settlements_problems_stories.settlementConditionText.064"),SOSText("settlements_problems_stories.settlementConditionText.065"),SOSText("settlements_problems_stories.settlementConditionText.066")]},
 eastern_fuse:{title:SOSText("settlements_problems_stories.settlementConditionText.067"),start:'pyreglade',decision:'pyreglade',redstone:true,summary:SOSText("settlements_problems_stories.settlementConditionText.068"),stages:[SOSText("settlements_problems_stories.settlementConditionText.069"),SOSText("settlements_problems_stories.settlementConditionText.070"),SOSText("settlements_problems_stories.settlementConditionText.071"),SOSText("settlements_problems_stories.settlementConditionText.072"),SOSText("settlements_problems_stories.settlementConditionText.073")]}
};

function regionalStoryDecisionLocation(id){
 const d=regionalStoryDef(id);if(d?.decision)return d.decision;
 return id==='bread_uphill'?'zion':id==='watchfires'?'skybreak':id==='two_gatekeepers'?'northgate':d?.start
}
function redstoneRegionalOutcome(id){const a=state.world?.regionalStories?.arcs?.[id];return a?.status==='complete'?a.choice:null}
function recentRedstoneCivicHistory(locId,limit=3){return (state.world?.redstoneCivic?.history||[]).filter(x=>x.locId===locId).slice(-limit)}
function redstoneStoryPolicyContext(id){
 const cass=redstoneCompanionPolicy('red_adjutant'),mara=redstoneCompanionPolicy('red_lockrunner'),tessa=redstoneCompanionPolicy('red_grainwarden'),ronan=redstoneCompanionPolicy('red_firebreak');
 if(id==='sengia_hunger')return tessa==='reserve'?'Protected Seed is already in force: seed grain and protected household reserves cannot be counted as ordinary surplus.':tessa==='compact'?'The Seasonal Grain Compact is already in force: emergency exports are negotiated after local reserves are measured.':SOSText("settlements_problems_stories.redstoneStoryPolicyContext.001");
 if(id==='lockwood_lines')return mara==='council'?'Council Paths is already in force: legitimate local-use routes can be registered under Lockwood council authority.':mara==='hidden'?'Unmapped Freedom is already in force: the side-road network remains deliberately unofficial and outside routine garrison registration.':SOSText("settlements_problems_stories.redstoneStoryPolicyContext.002");
 if(id==='paper_army')return cass==='accountable'?'The Named Authority Rule already requires a named authorizing office and automatic compensation for emergency requisitions.':cass==='discretion'?'The Emergency Review Rule preserves broad emergency discretion but requires rapid review, responsibility, and compensation afterward.':SOSText("settlements_problems_stories.redstoneStoryPolicyContext.003");
 if(id==='eastern_fuse')return ronan==='local'?'Local Spark is already in force: Pyreglade has final authority over fire-risk decisions affecting local workshops, resin stores, and slopes.':ronan==='joint'?'Shared Fireline is already in force: Redstone and Pyreglade share defense planning, but local fire-safety officials retain an explicit veto.':SOSText("settlements_problems_stories.redstoneStoryPolicyContext.004");
 return ''
}
function regionalStoryState(){ensureWorldState();return state.world.regionalStories}
function regionalStoryDef(id){return REGIONAL_STORY_DEFS[id]||null}
function regionalStory(id){const R=regionalStoryState(),d=regionalStoryDef(id);if(!d)return null;if(!R.arcs[id])R.arcs[id]={id,status:'locked',stage:0,startDay:null,lastDay:null,completedDay:null,choice:null,notes:[]};return R.arcs[id]}
function activeRegionalStories(){return Object.keys(REGIONAL_STORY_DEFS).map(regionalStory).filter(a=>['available','active','decision'].includes(a.status))}
function completedRegionalStories(){return Object.keys(REGIONAL_STORY_DEFS).map(regionalStory).filter(a=>a.status==='complete')}
function regionalStoryEligibility(id){
 const a=regionalStory(id);if(!a||a.status!=='locked')return false;
 if(id==='broken_supply'){const p=settlementProblem('river');return state.world.day>=4||['shortage','trade_slump'].includes(p?.type)}
 if(id==='road_knives')return state.world.day>=6||routePressure('northgate','stonebridge')>=3||settlementProblem('northgate')?.type==='raider_pressure';
 if(id==='displaced')return state.world.day>=8||settlementProblem('southroad')?.type==='refugee_load'||activeRegionalThreads().some(t=>t.kind==='displacement');
 if(id==='quiet_observer')return state.world.day>=10||((factionPresenceAt('stonebridge').Bluestone||0)>=1&&(factionPresenceAt('stonebridge').Redstone||0)>=1);
 if(id==='winterstone_run'){if(!crossRegionTradeUnlocked())return false;const X=crossRegionTradeState();return state.world.day>=14||tradeStock('stonebridge','iron')<=2||X.disruptions.some(x=>state.world.day-x.day<=8&&x.destination==='stonebridge'&&x.manifest?.iron)}
 if(id==='bread_uphill'){if(!crossRegionTradeUnlocked())return false;return state.world.day>=16||tradeStock('zion','food')<=2||settlementProblem('zion')?.type==='shortage'}
 if(id==='watchfires')return crossRegionTradeUnlocked()&&(state.world.day>=18||settlementProblem('skybreak')?.type==='watch_isolation'||settlementProblem('lowcreek')?.type==='pass_closure');
 if(id==='two_gatekeepers')return crossRegionTradeUnlocked()&&(state.world.day>=20||settlementProblem('lowcreek')?.type==='authority_dispute'||routePressure('northgate','stonebridge')>=4);
 const redUnlocked=(state.world.unlockedRegions||[]).includes('redstone');if(!redUnlocked)return false;
 if(id==='sengia_hunger')return state.world.day>=24||tradeStock('sengia','food')<=3||settlementProblem('sengia')?.type==='warehouse_backlog'||settlementProblem('briarlake')?.type==='grain_road';
 if(id==='lockwood_lines')return regionalStory('sengia_hunger')?.status==='complete'||redstoneCompanionPolicy('red_lockrunner')||settlementProblem('lockwood')?.type==='occupation_tension'||state.world.day>=28;
 if(id==='paper_army')return regionalStory('lockwood_lines')?.status==='complete'||redstoneCompanionPolicy('red_adjutant')||settlementProblem('glenbrook')?.type==='requisition_pressure'||settlementProblem('tyrdon')?.type==='requisition_pressure'||state.world.day>=32;
 if(id==='eastern_fuse')return regionalStory('paper_army')?.status==='complete'||redstoneCompanionPolicy('red_firebreak')||settlementProblem('pyreglade')?.type==='resin_fire'||state.world.day>=36;
 return false
}
function refreshRegionalStories(){
 const R=regionalStoryState();for(const id of Object.keys(REGIONAL_STORY_DEFS)){const a=regionalStory(id);if(regionalStoryEligibility(id)){a.status='available';a.lastDay=state.world.day;R.history.push({day:state.world.day,id,event:'available'});recordWorldHistory(SOSText("settlements_problems_stories.refreshRegionalStories.001",regionalStoryDef(id).title),'info',SOSText("settlements_problems_stories.refreshRegionalStories.002"))}}R.history=R.history.slice(-60)
}
function regionalStoryObjective(id){const a=regionalStory(id),d=regionalStoryDef(id);if(!a)return'';if(a.status==='available')return SOSText("settlements_problems_stories.regionalStoryObjective.001",worldLocation(d.start).name);if(a.status==='decision')return SOSText("settlements_problems_stories.regionalStoryObjective.002",worldLocation(regionalStoryDecisionLocation(id)).name);if(a.status==='complete')return SOSText("settlements_problems_stories.regionalStoryObjective.003",a.completedDay);return d.stages[Math.min(a.stage,d.stages.length-1)]}
function regionalStoryTarget(id){
 const a=regionalStory(id),d=regionalStoryDef(id);if(a.status==='available'||a.stage===0)return d.start;
 if(id==='broken_supply')return a.stage===1?'abandonedwagon':'river';if(id==='road_knives')return a.stage===1?'banditcamp':'northgate';if(id==='displaced')return a.stage===1?'river':'southroad';if(id==='quiet_observer')return a.stage===1?'oldtower':'stonebridge';
 if(id==='winterstone_run')return a.stage===1?'winterstone':a.stage===2?(a.linkedQuestId&&activeQuest(a.linkedQuestId)?worldLocation(activeQuest(a.linkedQuestId).origin).id:'stonebridge'):'stonebridge';
 if(id==='bread_uphill')return a.stage===1?'river':a.stage===2?(a.linkedQuestId&&activeQuest(a.linkedQuestId)?worldLocation(activeQuest(a.linkedQuestId).origin).id:'zion'):'zion';
 if(id==='watchfires')return a.stage===1?'northgate':a.stage===2?'lowcreek':'skybreak';
 if(id==='two_gatekeepers')return a.stage===1?'lowcreek':'northgate';
 if(id==='sengia_hunger')return a.stage===1?'briarlake':a.stage===2?'grayhaven':a.stage===3?(a.linkedQuestId&&activeQuest(a.linkedQuestId)?worldLocation(activeQuest(a.linkedQuestId).origin).id:'sengia'):'sengia';
 if(id==='lockwood_lines')return a.stage===1?'lockwoodforest':a.stage===2?'sengia':'lockwood';
 if(id==='paper_army')return a.stage===1?'tyrdon':a.stage===2?'sengia':'sengia';
 if(id==='eastern_fuse')return a.stage===1?'pyreslopes':a.stage===2?'sengia':a.stage===3?(a.linkedQuestId&&activeQuest(a.linkedQuestId)?worldLocation(activeQuest(a.linkedQuestId).origin).id:'pyreglade'):'pyreglade';
 return d.start
}

function regionalStoryTravelStep(target){
 if(!target)return renderOpenWorld();if(locationRegion(target)===currentWorldRegion())return attemptWorldTravel(target);
 const plan=crossRegionRoutePlan(state.world.location,target),seg=plan.segments?.[0];if(!seg)return actionResult(SOSText("settlements_problems_stories.regionalStoryTravelStep.001"),SOSText("settlements_problems_stories.regionalStoryTravelStep.002",worldLocation(state.world.location).name,worldLocation(target).name),'bad',renderOpenWorld);
 if(seg.kind==='regional')return attemptWorldTravel(seg.to);
 if(seg.kind==='connection'){if(state.world.location!==seg.from)return attemptWorldTravel(seg.from);return showRegionTravel()}
 return renderOpenWorld()
}
function regionalStoryLinkedQuest(id){const a=regionalStory(id);return a?.linkedQuestId?state.world.quests.find(q=>q.id===a.linkedQuestId):null}
function createRegionalStoryEscort(id,origin,target,manifest,name,desc){
 const a=regionalStory(id);if(a.linkedQuestId){const old=state.world.quests.find(q=>q.id===a.linkedQuestId);if(old&&['offered','active','ready'].includes(old.status))return old}
 const cross=isCrossRegionRoute(origin,target),q=generateContract(origin,'escort',{target,faction:worldLocation(origin).faction||SOSText("settlements_problems_stories.createRegionalStoryEscort.001"),crossRegion:cross});q.name=name;q.desc=desc;q.crossRegion=cross;q.storyArcId=id;q.escortCargoManifest={...manifest};q.escortCargo=manifestLots(manifest);q.escortTotalDays=tradeRouteDistanceDays(origin,target);q.escortRemainingDays=q.escortTotalDays;q.reward+=70;q.status='active';q.acceptedDay=state.world.day;q.dueDay=state.world.day+q.escortTotalDays+8;state.world.quests.push(q);createEscortCaravan(q);a.linkedQuestId=q.id;state.world.trackedQuestId=q.id;regionalStoryNote(id,SOSText("settlements_problems_stories.createRegionalStoryEscort.002",q.name,worldLocation(origin).name,worldLocation(target).name));return q
}
function regionalStoryContractProgress(q){
 if(!q?.storyArcId)return;const a=regionalStory(q.storyArcId);if(!a||a.status!=='active')return;const origin=worldLocation(q.origin)?.name||q.origin,target=worldLocation(q.target)?.name||q.target,route=connectionRouteName(q.origin,q.target)||SOSText("settlements_problems_stories.regionalStoryContractProgress.009");
 if(q.storyArcId==='winterstone_run'&&a.stage===2&&q.status==='complete'){a.stage=3;a.status='decision';regionalStoryNote(q.storyArcId,SOSText("settlements_problems_stories.regionalStoryContractProgress.001",origin,target));SOSServices.companions.noteSharedEvent('regional_story',SOSText("settlements_problems_stories.regionalStoryContractProgress.002",origin,target,route));save()}
 if(q.storyArcId==='bread_uphill'&&a.stage===2&&q.status==='complete'){a.stage=3;a.status='decision';regionalStoryNote(q.storyArcId,SOSText("settlements_problems_stories.regionalStoryContractProgress.003",origin,target));SOSServices.companions.noteSharedEvent('regional_story',SOSText("settlements_problems_stories.regionalStoryContractProgress.004",origin,target,route));save()}
 if(q.storyArcId==='sengia_hunger'&&a.stage===3&&q.status==='complete'){a.stage=4;a.status='decision';changeTradeStock(q.target,'food',Math.max(3,q.escortCargoManifest?.food||3));regionalStoryNote(q.storyArcId,SOSText("settlements_problems_stories.regionalStoryContractProgress.005",origin,target));SOSServices.companions.noteSharedEvent('regional_story',SOSText("settlements_problems_stories.regionalStoryContractProgress.006",origin,target,route));save()}
 if(q.storyArcId==='eastern_fuse'&&a.stage===3&&q.status==='complete'){a.stage=4;a.status='decision';changeTradeStock(q.target,'tools',Math.max(2,q.escortCargoManifest?.tools||2));regionalStoryNote(q.storyArcId,SOSText("settlements_problems_stories.regionalStoryContractProgress.007",origin,target));SOSServices.companions.noteSharedEvent('regional_story',SOSText("settlements_problems_stories.regionalStoryContractProgress.008",origin,target,route));save()}
}
function regionalStoryCompanionPerspective(id){
 const active=activeRoadCompanions().map(m=>m.id),has=x=>active.includes(x);
 if(id==='winterstone_run'){if(has('blue_quarry'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.001");if(has('blue_guide'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.002")}
 if(id==='bread_uphill'){if(has('blue_valley'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.003");if(has('blue_guide'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.004")}
 if(id==='watchfires'&&has('blue_signal'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.005");
 if(id==='two_gatekeepers'){if(has('blue_guide'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.006");if(has('blue_valley'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.007")}
 if(id==='sengia_hunger'){if(has('red_grainwarden'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.008");if(has('red_adjutant'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.009")}
 if(id==='lockwood_lines'){if(has('red_lockrunner'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.010");if(has('red_adjutant'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.011")}
 if(id==='paper_army'){if(has('red_adjutant'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.012");if(has('red_grainwarden'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.013")}
 if(id==='eastern_fuse'){if(has('red_firebreak'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.014");if(has('red_adjutant'))return SOSText("settlements_problems_stories.regionalStoryCompanionPerspective.015")}
 return ''
}
function regionalStoryNote(id,text){const a=regionalStory(id);a.notes.push({day:state.world.day,text});a.notes=a.notes.slice(-10);a.lastDay=state.world.day;regionalStoryState().history.push({day:state.world.day,id,event:'progress',text});regionalStoryState().history=regionalStoryState().history.slice(-60)}
function startRegionalStory(id){
 const a=regionalStory(id),d=regionalStoryDef(id);if(!a||!d)return;if(a.status==='locked'&&!regionalStoryEligibility(id))return actionResult(SOSText("settlements_problems_stories.startRegionalStory.001"),SOSText("settlements_problems_stories.startRegionalStory.002"),'info',showRegionalStoryJournal);
 a.status='active';a.stage=0;a.startDay=state.world.day;regionalStoryNote(id,SOSText("settlements_problems_stories.startRegionalStory.003",d.title));recordWorldHistory(SOSText("settlements_problems_stories.startRegionalStory.004",d.title,worldLocation(d.start).name),'info',SOSText("settlements_problems_stories.startRegionalStory.005"));save();
 if(state.world.location===d.start){advanceRegionalStoryAtLocation(id,d.start);return showRegionalStory(id)}actionResult(d.title,SOSText("settlements_problems_stories.startRegionalStory.006",d.summary,regionalStoryObjective(id)),'good',()=>showRegionalStory(id))
}
function advanceRegionalStoryAtLocation(id,locId){
 const a=regionalStory(id);if(!a||a.status!=='active')return false;
 if(id==='broken_supply'){if(a.stage===0&&locId==='river'){a.stage=1;discoverWildernessSite(worldLocation('abandonedwagon'),SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.001"));regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.002"));addRoutePressure('river','stonebridge',1);save();return true}if(a.stage===1&&locId==='abandonedwagon'&&explorationSiteState('abandonedwagon').searched>0){a.stage=2;a.status='decision';regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.003"));save();return true}}
 if(id==='road_knives'){if(a.stage===0&&locId==='northgate'){a.stage=1;discoverWildernessSite(worldLocation('banditcamp'),SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.004"));regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.005"));addRoutePressure('northgate','stonebridge',2);save();return true}if(a.stage===1&&locId==='banditcamp'&&interiorState('banditcamp').completed){a.stage=2;a.status='decision';regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.006"));save();return true}}
 if(id==='displaced'){if(a.stage===0&&locId==='southroad'){a.stage=1;regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.007"));save();return true}if(a.stage===1&&locId==='river'){a.stage=2;a.status='decision';regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.008",settlementState('river').prosperity));save();return true}}
 if(id==='quiet_observer'){if(a.stage===0&&locId==='stonebridge'){a.stage=1;discoverWildernessSite(worldLocation('oldtower'),SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.009"));regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.010"));recordFactionPower('stonebridge',SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.011"),'personnel',1,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.012"),6);save();return true}if(a.stage===1&&locId==='oldtower'&&(interiorState('oldtower').completed||explorationSiteState('oldtower').searched>0)){a.stage=2;a.status='decision';regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.013"));save();return true}}
 if(id==='winterstone_run'){
  if(a.stage===0&&locId==='stonebridge'){a.stage=1;regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.014",tradeStock('stonebridge','iron')));addSettlementEvidence('stonebridge',SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.015"),'bad',6);save();return true}
  if(a.stage===1&&locId==='winterstone'){a.stage=2;const qty=Math.max(4,7-tradeStock('stonebridge','iron'));createRegionalStoryEscort(id,'winterstone','stonebridge',{iron:qty,tools:2},SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.016"),SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.017"));regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.018"));save();return true}
 }
 if(id==='bread_uphill'){
  if(a.stage===0&&locId==='zion'){a.stage=1;regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.019",tradeStock('zion','food')));addSettlementEvidence('zion',SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.020"),'bad',6);save();return true}
  if(a.stage===1&&locId==='river'){a.stage=2;const qty=Math.max(5,8-tradeStock('zion','food'));createRegionalStoryEscort(id,'river','zion',{food:qty,medicine:1},SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.021"),SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.022"));regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.023"));save();return true}
 }
 if(id==='watchfires'){
  if(a.stage===0&&locId==='skybreak'){a.stage=1;regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.024"));save();return true}
  if(a.stage===1&&locId==='northgate'){a.stage=2;regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.025"));save();return true}
  if(a.stage===2&&locId==='lowcreek'){a.stage=3;a.status='decision';regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.026"));save();return true}
 }
 if(id==='two_gatekeepers'){
  if(a.stage===0&&locId==='northgate'){a.stage=1;regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.027"));save();return true}
  if(a.stage===1&&locId==='lowcreek'){a.stage=2;a.status='decision';regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.028"));save();return true}
 }
 if(id==='sengia_hunger'){
  if(a.stage===0&&locId==='sengia'){a.stage=1;const policy=redstoneStoryPolicyContext(id),hist=recentRedstoneCivicHistory('sengia',2);regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.029",tradeStock('sengia','food'),policy,hist.length?` Recent civic decisions include ${hist.map(x=>x.title).join(' and ')}.`:''));addSettlementEvidence('sengia',SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.030"),'bad',7);save();return true}
  if(a.stage===1&&locId==='briarlake'){a.stage=2;const policy=redstoneStoryPolicyContext(id),available=Math.max(3,Math.min(6,tradeStock('briarlake','food')));a.negotiatedFood=redstoneCompanionPolicy('red_grainwarden')==='reserve'?Math.max(3,available-1):available;regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.031",a.negotiatedFood,policy));save();return true}
  if(a.stage===2&&locId==='grayhaven'){a.stage=3;const pressure=routePressure('grayhaven','briarlake'),qty=a.negotiatedFood||4;createRegionalStoryEscort(id,'briarlake','sengia',{food:qty},SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.032"),SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.033",pressure));regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.034"));save();return true}
 }
 if(id==='lockwood_lines'){
  if(a.stage===0&&locId==='lockwood'){a.stage=1;regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.035",redstoneStoryPolicyContext(id)));save();return true}
  if(a.stage===1&&locId==='lockwoodforest'){a.stage=2;if(!state.world.discovered.includes('smugglercutred'))discoverWildernessSite(worldLocation('smugglercutred'),SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.036"));regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.037"));save();return true}
  if(a.stage===2&&locId==='sengia'){a.stage=3;a.status='decision';regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.038",redstoneStoryPolicyContext(id)));save();return true}
 }
 if(id==='paper_army'){
  if(a.stage===0&&locId==='glenbrook'){a.stage=1;const hist=recentRedstoneCivicHistory('glenbrook',3);regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.039",redstoneStoryPolicyContext(id),hist.length?` Recent local decisions: ${hist.map(x=>x.title).join(', ')}.`:''));save();return true}
  if(a.stage===1&&locId==='tyrdon'){a.stage=2;regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.040"));save();return true}
  if(a.stage===2&&locId==='sengia'){a.stage=3;a.status='decision';regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.041",redstoneStoryPolicyContext(id)));save();return true}
 }
 if(id==='eastern_fuse'){
  if(a.stage===0&&locId==='pyreglade'){a.stage=1;regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.042",redstoneStoryPolicyContext(id)));save();return true}
  if(a.stage===1&&locId==='pyreslopes'){a.stage=2;regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.043"));save();return true}
  if(a.stage===2&&locId==='sengia'){a.stage=3;const tools=Math.max(2,Math.min(4,tradeStock('sengia','tools'))),med=Math.max(1,Math.min(2,tradeStock('sengia','medicine')));createRegionalStoryEscort(id,'sengia','pyreglade',{tools,medicine:med},SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.044"),SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.045"));regionalStoryNote(id,SOSText("settlements_problems_stories.advanceRegionalStoryAtLocation.046"));save();return true}
 }
 return false
}
function checkRegionalStoryArrival(){refreshRegionalStories();for(const a of activeRegionalStories())if(a.status==='active')advanceRegionalStoryAtLocation(a.id,state.world.location)}
function checkRegionalStorySiteProgress(siteId){for(const a of activeRegionalStories())if(a.status==='active')advanceRegionalStoryAtLocation(a.id,siteId)}
function regionalStoryChoices(id){
 if(id==='broken_supply')return [['independent',SOSText("settlements_problems_stories.regionalStoryChoices.001")],['coalition',SOSText("settlements_problems_stories.regionalStoryChoices.002")],['redstone',SOSText("settlements_problems_stories.regionalStoryChoices.003")]];
 if(id==='road_knives')return [['local',SOSText("settlements_problems_stories.regionalStoryChoices.004")],['coalition',SOSText("settlements_problems_stories.regionalStoryChoices.005")],['mercenary',SOSText("settlements_problems_stories.regionalStoryChoices.006")]];
 if(id==='displaced')return [['river',SOSText("settlements_problems_stories.regionalStoryChoices.007")],['split',SOSText("settlements_problems_stories.regionalStoryChoices.008")],['coalition',SOSText("settlements_problems_stories.regionalStoryChoices.009")]];
 if(id==='quiet_observer')return [['release',SOSText("settlements_problems_stories.regionalStoryChoices.010")],['share',SOSText("settlements_problems_stories.regionalStoryChoices.011")],['redstone',SOSText("settlements_problems_stories.regionalStoryChoices.012")]];
 if(id==='winterstone_run')return [['joint',SOSText("settlements_problems_stories.regionalStoryChoices.013")],['local',SOSText("settlements_problems_stories.regionalStoryChoices.014")],['bluestone',SOSText("settlements_problems_stories.regionalStoryChoices.015")]];
 if(id==='bread_uphill')return [['mutual',SOSText("settlements_problems_stories.regionalStoryChoices.016")],['market',SOSText("settlements_problems_stories.regionalStoryChoices.017")],['zion',SOSText("settlements_problems_stories.regionalStoryChoices.018")]];
 if(id==='watchfires')return [['shared',SOSText("settlements_problems_stories.regionalStoryChoices.019")],['layered',SOSText("settlements_problems_stories.regionalStoryChoices.020")],['local',SOSText("settlements_problems_stories.regionalStoryChoices.021")]];
 if(id==='two_gatekeepers')return [['reciprocal',SOSText("settlements_problems_stories.regionalStoryChoices.022")],['joint',SOSText("settlements_problems_stories.regionalStoryChoices.023")],['separate',SOSText("settlements_problems_stories.regionalStoryChoices.024")]];
 if(id==='sengia_hunger')return [['compact',SOSText("settlements_problems_stories.regionalStoryChoices.025")],['capital',SOSText("settlements_problems_stories.regionalStoryChoices.026")],['market',SOSText("settlements_problems_stories.regionalStoryChoices.027")]];
 if(id==='lockwood_lines')return [['council',SOSText("settlements_problems_stories.regionalStoryChoices.028")],['joint',SOSText("settlements_problems_stories.regionalStoryChoices.029")],['closure',SOSText("settlements_problems_stories.regionalStoryChoices.030")]];
 if(id==='paper_army')return [['named',SOSText("settlements_problems_stories.regionalStoryChoices.031")],['district',SOSText("settlements_problems_stories.regionalStoryChoices.032")],['command',SOSText("settlements_problems_stories.regionalStoryChoices.033")]];
 if(id==='eastern_fuse')return [['local',SOSText("settlements_problems_stories.regionalStoryChoices.034")],['joint',SOSText("settlements_problems_stories.regionalStoryChoices.035")],['command',SOSText("settlements_problems_stories.regionalStoryChoices.036")]];
 return[]
}
function resolveRegionalStory(id,choice){
 const a=regionalStory(id),d=regionalStoryDef(id),decisionLoc=regionalStoryDecisionLocation(id);if(!a||a.status!=='decision'||state.world.location!==decisionLoc)return actionResult(SOSText("settlements_problems_stories.resolveRegionalStory.001"),SOSText("settlements_problems_stories.resolveRegionalStory.002",worldLocation(decisionLoc).name),'info',()=>showRegionalStory(id));
 let text='';
 if(id==='broken_supply'){
  if(choice==='independent'){settlementState('river').prosperity=Math.min(100,settlementState('river').prosperity+4);reduceRoutePressure('river','stonebridge',1);recordFactionPower('river',SOSText("settlements_problems_stories.resolveRegionalStory.003"),'trade',3,SOSText("settlements_problems_stories.resolveRegionalStory.004"),9);text=SOSText("settlements_problems_stories.resolveRegionalStory.005")}
  if(choice==='coalition'){settlementState('river').security=Math.min(100,settlementState('river').security+4);reduceRoutePressure('river','stonebridge',3);recordFactionPower('river',SOSText("settlements_problems_stories.resolveRegionalStory.006"),'security',3,SOSText("settlements_problems_stories.resolveRegionalStory.007"),9);text=SOSText("settlements_problems_stories.resolveRegionalStory.008")}
  if(choice==='redstone'){settlementState('river').security=Math.min(100,settlementState('river').security+5);reduceRoutePressure('river','stonebridge',3);recordFactionPower('river',SOSText("settlements_problems_stories.resolveRegionalStory.009"),'roads',4,SOSText("settlements_problems_stories.resolveRegionalStory.010"),10);addPoliticalPressure('river',SOSText("settlements_problems_stories.resolveRegionalStory.011"),1,SOSText("settlements_problems_stories.resolveRegionalStory.012"));text=SOSText("settlements_problems_stories.resolveRegionalStory.013")}
 }
 if(id==='road_knives'){
  if(choice==='local'){settlementState('northgate').security=Math.min(100,settlementState('northgate').security+3);reduceRoutePressure('northgate','stonebridge',3);recordFactionPower('northgate',SOSText("settlements_problems_stories.resolveRegionalStory.014"),'security',3,SOSText("settlements_problems_stories.resolveRegionalStory.015"),9);text=SOSText("settlements_problems_stories.resolveRegionalStory.016")}
  if(choice==='coalition'){settlementState('northgate').security=Math.min(100,settlementState('northgate').security+5);reduceRoutePressure('northgate','stonebridge',4);recordFactionPower('northgate',SOSText("settlements_problems_stories.resolveRegionalStory.017"),'security',4,SOSText("settlements_problems_stories.resolveRegionalStory.018"),10);text=SOSText("settlements_problems_stories.resolveRegionalStory.019")}
  if(choice==='mercenary'){settlementState('northgate').prosperity=Math.max(0,settlementState('northgate').prosperity-1);reduceRoutePressure('northgate','stonebridge',4);recordFactionPower('northgate',SOSText("settlements_problems_stories.resolveRegionalStory.020"),'contracts',4,SOSText("settlements_problems_stories.resolveRegionalStory.021"),10);text=SOSText("settlements_problems_stories.resolveRegionalStory.022")}
 }
 if(id==='displaced'){
  if(choice==='river'){settlementState('river').prosperity=Math.max(0,settlementState('river').prosperity-2);settlementState('river').security=Math.max(0,settlementState('river').security-1);changeLocalReputation('river',2,SOSText("settlements_problems_stories.resolveRegionalStory.023"));recordFactionPower('river',SOSText("settlements_problems_stories.resolveRegionalStory.024"),'guardian',2,SOSText("settlements_problems_stories.resolveRegionalStory.025"),8);text=SOSText("settlements_problems_stories.resolveRegionalStory.026")}
  if(choice==='split'){settlementState('river').prosperity=Math.max(0,settlementState('river').prosperity-1);settlementState('southroad').prosperity=Math.min(100,settlementState('southroad').prosperity+1);state.reputation+=1;text=SOSText("settlements_problems_stories.resolveRegionalStory.027")}
  if(choice==='coalition'){settlementState('northgate').prosperity=Math.max(0,settlementState('northgate').prosperity-1);recordFactionPower('northgate',SOSText("settlements_problems_stories.resolveRegionalStory.028"),'guardian',3,SOSText("settlements_problems_stories.resolveRegionalStory.029"),9);adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.030"),1,SOSText("settlements_problems_stories.resolveRegionalStory.031"));text=SOSText("settlements_problems_stories.resolveRegionalStory.032")}
 }
 if(id==='quiet_observer'){
  if(choice==='release'){recordFactionPower('stonebridge',SOSText("settlements_problems_stories.resolveRegionalStory.033"),'politics',3,SOSText("settlements_problems_stories.resolveRegionalStory.034"),9);adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.035"),2,SOSText("settlements_problems_stories.resolveRegionalStory.036"));adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.037"),-1,SOSText("settlements_problems_stories.resolveRegionalStory.038"));text=SOSText("settlements_problems_stories.resolveRegionalStory.039")}
  if(choice==='share'){adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.040"),1,SOSText("settlements_problems_stories.resolveRegionalStory.041"));adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.042"),1,SOSText("settlements_problems_stories.resolveRegionalStory.043"));recordFactionPower('stonebridge',SOSText("settlements_problems_stories.resolveRegionalStory.044"),'politics',2,SOSText("settlements_problems_stories.resolveRegionalStory.045"),8);text=SOSText("settlements_problems_stories.resolveRegionalStory.046")}
  if(choice==='redstone'){recordFactionPower('stonebridge',SOSText("settlements_problems_stories.resolveRegionalStory.047"),'politics',4,SOSText("settlements_problems_stories.resolveRegionalStory.048"),10);addPoliticalPressure('stonebridge',SOSText("settlements_problems_stories.resolveRegionalStory.049"),1,SOSText("settlements_problems_stories.resolveRegionalStory.050"));adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.051"),-2,SOSText("settlements_problems_stories.resolveRegionalStory.052"));text=SOSText("settlements_problems_stories.resolveRegionalStory.053")}
 }
 if(id==='winterstone_run'){
  if(choice==='joint'){settlementState('stonebridge').prosperity=Math.min(100,settlementState('stonebridge').prosperity+4);settlementState('winterstone').prosperity=Math.min(100,settlementState('winterstone').prosperity+3);recordFactionPower('stonebridge',SOSText("settlements_problems_stories.resolveRegionalStory.054"),'trade',2,SOSText("settlements_problems_stories.resolveRegionalStory.055"),10);recordFactionPower('winterstone',SOSText("settlements_problems_stories.resolveRegionalStory.056"),'trade',2,SOSText("settlements_problems_stories.resolveRegionalStory.057"),10);text=SOSText("settlements_problems_stories.resolveRegionalStory.058")}
  if(choice==='local'){changeLocalReputation('stonebridge',2,SOSText("settlements_problems_stories.resolveRegionalStory.059"));changeLocalReputation('winterstone',2,SOSText("settlements_problems_stories.resolveRegionalStory.060"));text=SOSText("settlements_problems_stories.resolveRegionalStory.061")}
  if(choice==='bluestone'){recordFactionPower('winterstone',SOSText("settlements_problems_stories.resolveRegionalStory.062"),'trade',4,SOSText("settlements_problems_stories.resolveRegionalStory.063"),12);adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.064"),2,SOSText("settlements_problems_stories.resolveRegionalStory.065"));settlementState('stonebridge').security=Math.min(100,settlementState('stonebridge').security+2);text=SOSText("settlements_problems_stories.resolveRegionalStory.066")}
  changeTradeStock('stonebridge','iron',4);changeTradeStock('stonebridge','tools',2)
 }
 if(id==='bread_uphill'){
  if(choice==='mutual'){settlementState('zion').prosperity=Math.min(100,settlementState('zion').prosperity+4);settlementState('river').prosperity=Math.min(100,settlementState('river').prosperity+2);recordFactionPower('zion',SOSText("settlements_problems_stories.resolveRegionalStory.067"),'trade',2,SOSText("settlements_problems_stories.resolveRegionalStory.068"),10);text=SOSText("settlements_problems_stories.resolveRegionalStory.069")}
  if(choice==='market'){state.reputation+=1;recordFactionPower('river',SOSText("settlements_problems_stories.resolveRegionalStory.070"),'trade',3,SOSText("settlements_problems_stories.resolveRegionalStory.071"),9);text=SOSText("settlements_problems_stories.resolveRegionalStory.072")}
  if(choice==='zion'){recordFactionPower('zion',SOSText("settlements_problems_stories.resolveRegionalStory.073"),'trade',4,SOSText("settlements_problems_stories.resolveRegionalStory.074"),12);adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.075"),2,SOSText("settlements_problems_stories.resolveRegionalStory.076"));settlementState('zion').prosperity=Math.min(100,settlementState('zion').prosperity+5);text=SOSText("settlements_problems_stories.resolveRegionalStory.077")}
  changeTradeStock('zion','food',5);state.world.marketShock.zion=Math.max(0,(state.world.marketShock.zion||0)-.18)
 }
 if(id==='watchfires'){
  if(choice==='shared'){gainScouting(2);adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.078"),1,SOSText("settlements_problems_stories.resolveRegionalStory.079"));adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.080"),1,SOSText("settlements_problems_stories.resolveRegionalStory.081"));recordFactionPower('lowcreek',SOSText("settlements_problems_stories.resolveRegionalStory.082"),'roads',2,SOSText("settlements_problems_stories.resolveRegionalStory.083"),9);text=SOSText("settlements_problems_stories.resolveRegionalStory.084")}
  if(choice==='layered'){settlementState('skybreak').security=Math.min(100,settlementState('skybreak').security+3);settlementState('lowcreek').security=Math.min(100,settlementState('lowcreek').security+2);text=SOSText("settlements_problems_stories.resolveRegionalStory.085")}
  if(choice==='local'){changeLocalReputation('skybreak',1,SOSText("settlements_problems_stories.resolveRegionalStory.086"));changeLocalReputation('northgate',1,SOSText("settlements_problems_stories.resolveRegionalStory.087"));text=SOSText("settlements_problems_stories.resolveRegionalStory.088")}
 }
 if(id==='two_gatekeepers'){
  if(choice==='reciprocal'){settlementState('northgate').prosperity=Math.min(100,settlementState('northgate').prosperity+3);settlementState('lowcreek').prosperity=Math.min(100,settlementState('lowcreek').prosperity+3);reduceRoutePressure('northgate','stonebridge',1);text=SOSText("settlements_problems_stories.resolveRegionalStory.089")}
  if(choice==='joint'){recordFactionPower('northgate',SOSText("settlements_problems_stories.resolveRegionalStory.090"),'roads',2,SOSText("settlements_problems_stories.resolveRegionalStory.091"),10);recordFactionPower('lowcreek',SOSText("settlements_problems_stories.resolveRegionalStory.092"),'roads',2,SOSText("settlements_problems_stories.resolveRegionalStory.093"),10);settlementState('northgate').security=Math.min(100,settlementState('northgate').security+3);settlementState('lowcreek').security=Math.min(100,settlementState('lowcreek').security+3);text=SOSText("settlements_problems_stories.resolveRegionalStory.094")}
  if(choice==='separate'){changeLocalReputation('northgate',1,SOSText("settlements_problems_stories.resolveRegionalStory.095"));changeLocalReputation('lowcreek',1,SOSText("settlements_problems_stories.resolveRegionalStory.096"));text=SOSText("settlements_problems_stories.resolveRegionalStory.097")}
 }
 if(id==='sengia_hunger'){
  const prior=redstoneCompanionPolicy('red_grainwarden');
  if(choice==='compact'){settlementState('sengia').prosperity=Math.min(100,settlementState('sengia').prosperity+3);settlementState('briarlake').prosperity=Math.min(100,settlementState('briarlake').prosperity+3);recordFactionPower('briarlake',SOSText("settlements_problems_stories.resolveRegionalStory.098"),'trade',3,SOSText("settlements_problems_stories.resolveRegionalStory.099"),12);recordFactionPower('sengia',SOSText("settlements_problems_stories.resolveRegionalStory.100"),'trade',1,SOSText("settlements_problems_stories.resolveRegionalStory.101"),10);text=prior==='reserve'?'Sengia adopts a regional food compact that explicitly keeps Tessa’s Protected Seed floors intact while creating predictable emergency export rules.':prior==='compact'?'The existing Seasonal Grain Compact becomes a broader regional institution with published emergency thresholds and convoy rules.':SOSText("settlements_problems_stories.resolveRegionalStory.102")}
  if(choice==='capital'){settlementState('sengia').security=Math.min(100,settlementState('sengia').security+3);settlementState('briarlake').prosperity=Math.max(0,settlementState('briarlake').prosperity-1);recordFactionPower('sengia',SOSText("settlements_problems_stories.resolveRegionalStory.103"),'trade',4,SOSText("settlements_problems_stories.resolveRegionalStory.104"),12);adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.105"),2,SOSText("settlements_problems_stories.resolveRegionalStory.106"));text=prior==='reserve'?'Sengia receives emergency priority only after the legally protected seed and household floors are deducted. The capital gains authority, but not over the grain already protected by Tessa’s rule.':SOSText("settlements_problems_stories.resolveRegionalStory.107")}
  if(choice==='market'){recordFactionPower('briarlake',SOSText("settlements_problems_stories.resolveRegionalStory.108"),'trade',2,SOSText("settlements_problems_stories.resolveRegionalStory.109"),10);changeLocalReputation('briarlake',2,SOSText("settlements_problems_stories.resolveRegionalStory.110"));state.reputation+=1;text=SOSText("settlements_problems_stories.resolveRegionalStory.111")}
  changeTradeStock('sengia','food',2)
 }
 if(id==='lockwood_lines'){
  const prior=redstoneCompanionPolicy('red_lockrunner');
  if(choice==='council'){recordFactionPower('lockwood',SOSText("settlements_problems_stories.resolveRegionalStory.112"),'roads',4,SOSText("settlements_problems_stories.resolveRegionalStory.113"),12);changeLocalReputation('lockwood',3,SOSText("settlements_problems_stories.resolveRegionalStory.114"));settlementState('lockwood').prosperity=Math.min(100,settlementState('lockwood').prosperity+2);text=prior==='council'?'Mara’s Council Paths system becomes the formal regional answer: Lockwood registers legitimate local-use routes while the garrison must request access or specific searches through the council.':SOSText("settlements_problems_stories.resolveRegionalStory.115")}
  if(choice==='joint'){recordFactionPower('lockwood',SOSText("settlements_problems_stories.resolveRegionalStory.116"),'roads',2,SOSText("settlements_problems_stories.resolveRegionalStory.117"),10);recordFactionPower('lockwood',SOSText("settlements_problems_stories.resolveRegionalStory.118"),'security',2,SOSText("settlements_problems_stories.resolveRegionalStory.119"),10);settlementState('lockwood').security=Math.min(100,settlementState('lockwood').security+2);text=prior==='hidden'?'The unofficial network remains largely unmapped, but a joint liaison allows the council to warn the garrison about specific threats without surrendering the whole route system.':SOSText("settlements_problems_stories.resolveRegionalStory.120")}
  if(choice==='closure'){recordFactionPower('lockwood',SOSText("settlements_problems_stories.resolveRegionalStory.121"),'roads',4,SOSText("settlements_problems_stories.resolveRegionalStory.122"),10);settlementState('lockwood').security=Math.min(100,settlementState('lockwood').security+4);settlementState('lockwood').prosperity=Math.max(0,settlementState('lockwood').prosperity-2);adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.123"),1,SOSText("settlements_problems_stories.resolveRegionalStory.124"));text=SOSText("settlements_problems_stories.resolveRegionalStory.125")}
 }
 if(id==='paper_army'){
  const prior=redstoneCompanionPolicy('red_adjutant');
  if(choice==='named'){recordFactionPower('glenbrook',SOSText("settlements_problems_stories.resolveRegionalStory.126"),'politics',3,SOSText("settlements_problems_stories.resolveRegionalStory.127"),12);recordFactionPower('tyrdon',SOSText("settlements_problems_stories.resolveRegionalStory.128"),'politics',3,SOSText("settlements_problems_stories.resolveRegionalStory.129"),12);adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.130"),1,SOSText("settlements_problems_stories.resolveRegionalStory.131"));text=prior==='accountable'?'Cassian’s Named Authority Rule expands into a regional code: property, paid labor, voluntary service, and compulsory service each require a named legal basis and responsible office.':SOSText("settlements_problems_stories.resolveRegionalStory.132")}
  if(choice==='district'){changeLocalReputation('glenbrook',2,SOSText("settlements_problems_stories.resolveRegionalStory.133"));changeLocalReputation('tyrdon',2,SOSText("settlements_problems_stories.resolveRegionalStory.134"));recordFactionPower('glenbrook',SOSText("settlements_problems_stories.resolveRegionalStory.135"),'politics',3,SOSText("settlements_problems_stories.resolveRegionalStory.136"),10);recordFactionPower('tyrdon',SOSText("settlements_problems_stories.resolveRegionalStory.137"),'politics',3,SOSText("settlements_problems_stories.resolveRegionalStory.138"),10);text=SOSText("settlements_problems_stories.resolveRegionalStory.139")}
  if(choice==='command'){recordFactionPower('sengia',SOSText("settlements_problems_stories.resolveRegionalStory.140"),'politics',4,SOSText("settlements_problems_stories.resolveRegionalStory.141"),12);settlementState('sengia').security=Math.min(100,settlementState('sengia').security+2);adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.142"),2,SOSText("settlements_problems_stories.resolveRegionalStory.143"));text=prior==='discretion'?'Cassian’s Emergency Review Rule becomes the regional compromise: command retains broad emergency authority, but every use triggers rapid review, responsibility, and compensation afterward.':SOSText("settlements_problems_stories.resolveRegionalStory.144")}
 }
 if(id==='eastern_fuse'){
  const prior=redstoneCompanionPolicy('red_firebreak');
  if(choice==='local'){recordFactionPower('pyreglade',SOSText("settlements_problems_stories.resolveRegionalStory.145"),'security',4,SOSText("settlements_problems_stories.resolveRegionalStory.146"),12);settlementState('pyreglade').security=Math.min(100,settlementState('pyreglade').security+4);changeLocalReputation('pyreglade',3,SOSText("settlements_problems_stories.resolveRegionalStory.147"));text=prior==='local'?'Ronan’s Local Spark rule becomes the foundation for eastern logistics: Redstone may request staging, but Pyreglade can refuse placements that violate local fire-safety standards.':SOSText("settlements_problems_stories.resolveRegionalStory.148")}
  if(choice==='joint'){recordFactionPower('pyreglade',SOSText("settlements_problems_stories.resolveRegionalStory.149"),'security',2,SOSText("settlements_problems_stories.resolveRegionalStory.150"),12);recordFactionPower('pyreglade',SOSText("settlements_problems_stories.resolveRegionalStory.151"),'security',2,SOSText("settlements_problems_stories.resolveRegionalStory.152"),12);settlementState('pyreglade').security=Math.min(100,settlementState('pyreglade').security+3);text=prior==='joint'?'The existing Shared Fireline arrangement expands into a standing Eastern Logistics Board with Redstone coordination and explicit local vetoes on fire-risk and workshop safety.':SOSText("settlements_problems_stories.resolveRegionalStory.153")}
  if(choice==='command'){recordFactionPower('pyreglade',SOSText("settlements_problems_stories.resolveRegionalStory.154"),'security',4,SOSText("settlements_problems_stories.resolveRegionalStory.155"),12);settlementState('pyreglade').security=Math.min(100,settlementState('pyreglade').security+4);settlementState('pyreglade').prosperity=Math.max(0,settlementState('pyreglade').prosperity-1);adjustFactionStanding(SOSText("settlements_problems_stories.resolveRegionalStory.156"),2,SOSText("settlements_problems_stories.resolveRegionalStory.157"));text=SOSText("settlements_problems_stories.resolveRegionalStory.158")}
 }
 a.choice=choice;a.status='complete';a.completedDay=state.world.day;a.outcomeText=text;a.regions=[...new Set([locationRegion(d.start),locationRegion(state.world.location)])];regionalStoryNote(id,text);SOSServices.companions.noteSharedEvent('regional_story',SOSText("settlements_problems_stories.resolveRegionalStory.159",d.title,text));recordWorldHistory(`${d.title} resolved: ${text}`,'good',d.crossRegion?'cross-region story':d.redstone?'Redstone regional story':SOSText("settlements_problems_stories.resolveRegionalStory.160"));state.reputation+=1;if(d.redstone)refreshSengiaResolution();save();actionResult(SOSText("settlements_problems_stories.resolveRegionalStory.161",d.title),SOSText("settlements_problems_stories.resolveRegionalStory.162",text),'good',()=>showRegionalStory(id))
}
function showRegionalStory(id){modalRouteEnter(SOSText("settlements_problems_stories.showRegionalStory.001"),Array.from(arguments));
 const a=regionalStory(id),d=regionalStoryDef(id);if(!a)return showRegionalStoryJournal();const target=regionalStoryTarget(id),here=state.world.location===target,perspective=regionalStoryCompanionPerspective(id),linked=regionalStoryLinkedQuest(id);
 overlay(SOSText("settlements_problems_stories.showRegionalStory.002",esc(d.title),esc(d.summary),esc(a.status),esc(regionalStoryObjective(id)),d.redstone?`<div class="redstone-story-context"><b>Existing Redstone policy</b><br>${esc(redstoneStoryPolicyContext(id))}</div>`:'',d.crossRegion?`<div class="cross-story-banner"><b>Cross-region storyline</b> • ${esc(regionDef(locationRegion(d.start)).name)} ↔ ${esc(regionDef(locationRegion(target||d.start)).name)}</div>`:'',perspective?`<div class="companion-story-reaction">${esc(perspective)}</div>`:'',linked&&['active','ready'].includes(linked.status)?`<div class="notice"><b>Linked contract:</b> ${esc(linked.name)} • ${esc(contractObjective(linked))}<br><button id="storyLinkedContract">Open Contract</button></div>`:'',a.notes.length?`<h3>Story Record</h3>${a.notes.slice().reverse().map(n=>`<div class="regional-story-note"><b>Day ${n.day}</b><br>${esc(n.text)}</div>`).join('')}`:'',a.status==='available'?'<button id="storyStart">Become Involved</button>':'',a.status==='active'&&target&&!here?`<button id="storyTravel">Travel to ${esc(worldLocation(target).name)}</button>`:'',a.status==='active'&&here?'<button id="storyAdvance">Investigate / Continue Here</button>':'',a.status==='decision'&&state.world.location!==regionalStoryDecisionLocation(id)?`<button id="storyReturn">Return for Final Decision</button>`:'',a.status==='decision'&&state.world.location===regionalStoryDecisionLocation(id)?regionalStoryChoices(id).map(([k,t])=>`<button data-storychoice="${k}">${esc(t)}</button>`).join(''):''),true);
 if($('#storyStart'))$('#storyStart').onclick=()=>startRegionalStory(id);if($('#storyTravel'))$('#storyTravel').onclick=()=>{closeOverlay();regionalStoryTravelStep(target)};if($('#storyLinkedContract'))$('#storyLinkedContract').onclick=()=>showContractDetails(linked.id);if($('#storyReturn'))$('#storyReturn').onclick=()=>{closeOverlay();regionalStoryTravelStep(regionalStoryDecisionLocation(id))};if($('#storyAdvance'))$('#storyAdvance').onclick=()=>{const ok=advanceRegionalStoryAtLocation(id,state.world.location);if(!ok)return actionResult(SOSText("settlements_problems_stories.showRegionalStory.003"),linked&&['active','ready'].includes(linked.status)?SOSText("settlements_problems_stories.showRegionalStory.004",linked.name):id==='road_knives'?'Blackthorn Camp must be cleared first.':id==='broken_supply'?'Investigate the abandoned wagon first.':id==='quiet_observer'?'Search or clear the signal tower first.':SOSText("settlements_problems_stories.showRegionalStory.005"),'info',()=>showRegionalStory(id));showRegionalStory(id)};document.querySelectorAll('[data-storychoice]').forEach(b=>b.onclick=()=>resolveRegionalStory(id,b.dataset.storychoice));$('#storyJournalBack').onclick=()=>SOSServices.navigation.back(showRegionalStoryJournal)
}
function showRegionalStoryJournal(){modalRouteEnter(SOSText("settlements_problems_stories.showRegionalStoryJournal.001"),Array.from(arguments));
 refreshRegionalStories();const arcs=Object.keys(REGIONAL_STORY_DEFS).map(id=>({id,a:regionalStory(id),d:regionalStoryDef(id)})),open=arcs.filter(x=>!['locked','complete'].includes(x.a.status)),done=arcs.filter(x=>x.a.status==='complete');
 overlay(SOSText("settlements_problems_stories.showRegionalStoryJournal.002",(state.world.unlockedRegions||[]).includes('redstone')?`${sengiaConsequenceSummaryHTML()}<button id="regionalStoriesSengiaOutcome">Open Sengia Regional Consequences</button>`:'',open.length?`<h3>Active / Available</h3>${open.map(x=>`<button class="regional-story-card" data-regstory="${x.id}"><span><b>${esc(x.d.title)}</b><small>${x.d.crossRegion?'Cross-region • ':''}${esc(x.a.status)} • ${esc(regionalStoryObjective(x.id))}</small></span><span>${esc(x.d.summary)}</span></button>`).join('')}`:'<p class="muted">No regional story is currently active.</p>',done.map(x=>`<button class="regional-story-card complete" data-regstory="${x.id}"><span><b>${esc(x.d.title)}</b><small>Completed Day ${x.a.completedDay}</small></span><span>${esc(x.a.notes[x.a.notes.length-1]?.text||'Resolved.')}</span></button>`).join('')||'<p class="muted">No regional arc has been completed yet.</p>',arcs.filter(x=>x.a.status==='locked').map(x=>`<div class="card compact"><b>${esc(x.d.title)}</b><br><small>The regional conditions for this story have not developed yet.</small></div>`).join('')||'<p class="muted">All current arcs have entered the campaign.</p>'),true);document.querySelectorAll('[data-regstory]').forEach(b=>b.onclick=()=>showRegionalStory(b.dataset.regstory));if($('#regionalStoriesSengiaOutcome'))$('#regionalStoriesSengiaOutcome').onclick=showSengiaRegionalConsequences;wireClose()
}
function recordWorldHistory(text,type='info',category='world'){
 ensureWorldState();state.world.history=state.world.history||[];
 state.world.history.push({day:state.world.day,text,type,category,location:state.world.location,region:currentWorldRegion()});
 if(state.world.history.length>180)state.world.history.shift()
}
function showWorldHistory(){modalRouteEnter(SOSText("settlements_problems_stories.showWorldHistory.001"),Array.from(arguments));
 ensureWorldState();const hist=(state.world.history||[]).slice().reverse();
 overlay(SOSText("settlements_problems_stories.showWorldHistory.002",completedRegionalStories().length,completedRegionalStories().length===1?'y':'ies',activeRegionalStories().length,sengiaResolutionState().status==='complete'?`<br><b>Sengia:</b> ${esc(sengiaFrameworkLabel())}`:'',hist.map(h=>`<div class="history-entry ${esc(h.type||'info')}"><b>Day ${h.day}${h.region?` • ${esc(regionDef(h.region).name)}`:''}</b> • ${esc(h.category||'world')}<br><span>${esc(h.text)}</span></div>`).join('')||'<div class="notice muted">The campaign has only just begun.</div>'),true);wireClose()
}
function simulateSettlementLife(){
 if(!isOpenWorld())return;ensureWorldState();
 for(const [id,ss] of Object.entries(state.world.settlements)){
   const hostile=state.world.parties.some(p=>['bandits','raiders'].includes(p.kind)&&(p.location===id||p.destination===id));
   if(!hostile&&ss.security>=65&&chance(.30))ss.prosperity=Math.min(100,ss.prosperity+1);
   if(!hostile&&ss.security<50&&chance(.18))ss.security=Math.min(100,ss.security+1);
   if(!hostile&&ss.security>=70&&ss.prosperity<70&&chance(.14))ss.prosperity=Math.min(100,ss.prosperity+1);
   if(ss.security<30&&chance(.28))ss.prosperity=Math.max(0,ss.prosperity-1);
   if(ss.security<20&&chance(.18))ss.prosperity=Math.max(0,ss.prosperity-2);
   maybeCreateSettlementProblem(id);checkReputationMilestones(id)
 }
 tickSettlementProblems();settlementBackgroundRecoveryDaily();maybeMoveSettlementNPCs();if(chance(.22))generateLivingWorldEvent();for(const id of Object.keys(state.world.settlements))if(!settlementEvent(id))createSettlementEvent(id,false)
}
function generateLivingWorldEvent(){
 const loc=pick(WORLD_LOCATIONS.filter(x=>state.world.settlements[x.id])),ss=settlementState(loc.id),roll=rnd(1,5);
 if(roll===1&&ss.security<65){ss.security=Math.min(100,ss.security+3);recordWorldNews(SOSText("settlements_problems_stories.generateLivingWorldEvent.001",loc.name),'info');recordWorldHistory(SOSText("settlements_problems_stories.generateLivingWorldEvent.002",loc.name),'info','settlement')}
 else if(roll===2&&ss.prosperity>35){ss.prosperity=Math.min(100,ss.prosperity+2);recordWorldNews(SOSText("settlements_problems_stories.generateLivingWorldEvent.003",loc.name),'good');recordWorldHistory(SOSText("settlements_problems_stories.generateLivingWorldEvent.004",loc.name),'good','economy')}
 else if(roll===3){ss.prosperity=Math.max(0,ss.prosperity-2);state.world.marketShock[loc.id]=(state.world.marketShock[loc.id]||0)+.06;recordWorldNews(SOSText("settlements_problems_stories.generateLivingWorldEvent.005",loc.name),'bad');recordWorldHistory(SOSText("settlements_problems_stories.generateLivingWorldEvent.006",loc.name),'bad','economy')}
 else if(roll===4&&loc.id!=='redoubt'){ss.security=Math.min(100,ss.security+1);ss.prosperity=Math.min(100,ss.prosperity+1);recordWorldHistory(SOSText("settlements_problems_stories.generateLivingWorldEvent.007",loc.name),'good','settlement')}
 else{recordWorldHistory(SOSText("settlements_problems_stories.generateLivingWorldEvent.008",loc.name),'info','world')}
}
