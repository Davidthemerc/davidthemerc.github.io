function roadConditionProfile(from,to){
 const r=routeEvidence(from,to),traffic=r.status==='open'?'heavy':r.status==='watched'?'normal':r.status==='risky'?'light':'sparse';
 return {status:r.status,pressure:r.pressure,traffic,encounterMod:r.status==='open'?.02:r.status==='watched'?.08:r.status==='risky'?.18:.28,hostileMod:r.status==='dangerous'?2.3:r.status==='risky'?1.65:r.status==='watched'?1.2:.7}
}
function roadEventWeightedPick(ctx=null){
 const pool=[],profile=ctx?.route||roadConditionProfile(ctx?.from||state.world.location,ctx?.to||state.world.location);
 const hostileIds=['ambush','toll','camp','deserters','ruined_caravan','escaped_prisoner'],safeIds=['traffic','pilgrims','messenger','road_healer','hunters','envoy','patrol'];
 for(const e of ROAD_EVENT_TYPES){let w=e.weight;
   if(e.id==='bounty_hunter'&&!hasWarrant(ctx?.to||state.world.location))w=Math.max(1,Math.round(w*.25));
   if(e.id==='envoy'&&['woods','marsh','quarry'].includes(ctx?.to))w=Math.max(1,w-2);
   if(e.id==='magic_disturbance'&&['quarry','watchfort','woods','marsh'].includes(ctx?.to))w+=3;
   if(e.id==='hunters'&&['woods','marsh','northgate'].includes(ctx?.to))w+=2;
   if(e.id==='smugglers'&&['stonebridge','river','southroad','marsh'].includes(ctx?.to))w+=2;
   if(hostileIds.includes(e.id))w=Math.max(1,Math.round(w*profile.hostileMod));
   if(safeIds.includes(e.id)){const mult=profile.status==='open'?1.65:profile.status==='watched'?1.25:profile.status==='risky'?.8:.5;w=Math.max(1,Math.round(w*mult))}
   if(e.id==='broken_cart'||e.id==='stranded')w+=profile.status==='risky'?3:profile.status==='dangerous'?5:0;
   if(e.id==='refugees')w+=profile.status==='dangerous'?4:profile.status==='risky'?2:0;
   for(let i=0;i<w;i++)pool.push(e)
 }
 return pick(pool)
}
function roadEventContext(from,to,escort=false){
 const fs=settlementState(from),ts=settlementState(to),security=Math.round(((fs.security||50)+(ts.security||50))/2),route=roadConditionProfile(from,to),plan=state.world.travelPlan||{mode:'direct'};
 const region=locationRegion(to),ambushVariant=region==='redstone'?'checkpoint trap':region==='bluestone'?'high-ground ambush':['woods','marsh'].includes(to)?'concealed flank':'roadside ambush';
 return {from,to,escort,security,route,plan,region,ambushVariant,danger:clamp((60-security)/100+.08+route.encounterMod-(plan.mode==='safer'?.10:0),.05,.72)}
}
function roadEventChance(ctx){return clamp(.24+ctx.danger-(ctx.escort?.06:0)+(ctx.route.status==='open'?.05:0),.18,.78)}
function roadTrafficDescription(ctx){
 const r=ctx.route;return r.status==='open'?SOSText("world_road_travel.roadTrafficDescription.001",worldLocation(ctx.from).name,worldLocation(ctx.to).name):r.status==='watched'?SOSText("world_road_travel.roadTrafficDescription.002"):r.status==='risky'?SOSText("world_road_travel.roadTrafficDescription.003"):SOSText("world_road_travel.roadTrafficDescription.004")
}
function companionRouteReaction(from,to){
 const active=activeRoadCompanions();if(!active.length)return'';const m=pick(active),r=roadConditionProfile(from,to),cls=allyDef(m.id)?.className||m.className||'';
 if(r.status==='dangerous')return cls===SOSText("world_road_travel.companionRouteReaction.001")||cls===SOSText("world_road_travel.companionRouteReaction.002")?SOSText("world_road_travel.companionRouteReaction.003",m.name):SOSText("world_road_travel.companionRouteReaction.004",m.name);
 if(r.status==='risky')return SOSText("world_road_travel.companionRouteReaction.005",m.name);
 if(r.status==='watched')return SOSText("world_road_travel.companionRouteReaction.006",m.name);
 return SOSText("world_road_travel.companionRouteReaction.007",m.name)
}
function routeTravelOptions(from,to){
 const p=roadConditionProfile(from,to),days=worldTravelDays(from,to);
 return {direct:{days,label:SOSText("world_road_travel.routeTravelOptions.001"),desc:SOSText("world_road_travel.routeTravelOptions.002",days,days===1?'':'s',p.status)},safer:{days:days+1,label:SOSText("world_road_travel.routeTravelOptions.003"),desc:SOSText("world_road_travel.routeTravelOptions.004",days+1)}}
}
function roadEventRecord(ev,choice,result){
 state.world.roadEventHistory.push({day:state.world.day,event:ev.id,title:ev.title,choice,result});
 state.world.roadEventHistory=state.world.roadEventHistory.slice(-30)
}
function roadEventStat(k){state.world.roadEventStats[k]=(state.world.roadEventStats[k]||0)+1}
function roadEventSettlementId(ctx){return ctx.to||ctx.from||state.world.location}
function roadEventFaction(delta,faction){
 if(!faction)return;state.world.factionStanding[faction]=(state.world.factionStanding[faction]||0)+delta
}
function roadEventCargo(id,n){state.world.cargo[id]=Math.max(0,(state.world.cargo[id]||0)+n)}
function roadEventOutcome(ev,choice,ctx,title,text,tone='info',after=null){
 const recordedText=text||title;
 roadEventRecord(ev,choice,recordedText);
 if(isOpenWorld()&&['roads','investigate','news','walk'].includes(choice)&&chance(.16)){const near=nearbyUndiscoveredSites(roadEventSettlementId(ctx),28);if(near.length)discoverWildernessSite(pick(near),SOSText("world_road_travel.roadEventOutcome.001",ev.title))}
 if(isOpenWorld()&&activeRoadCompanions().length&&chance(.18)){
   const m=pick(activeRoadCompanions());
   roadLifePush({type:'event_debrief',a:m.id,title:SOSText("world_road_travel.roadEventOutcome.002",m.name,ev.title),summary:SOSText("world_road_travel.roadEventOutcome.003",m.name,ev.title.toLowerCase()),eventId:ev.id,eventTitle:ev.title,eventChoice:choice,eventOutcome:title,eventText:recordedText,eventTone:tone})
 }
 log(`${ev.title}: ${recordedText}`,tone==='good'?'good':tone==='bad'?'bad':'info');save();
 actionResult(title,text,tone,after)
}
function resolveRoadEvent(ev,choice,ctx,after){
 const loc=roadEventSettlementId(ctx),ss=settlementState(loc),gold=state.gold||0;
 if(ev.id==='ambush'){
  if(choice==='stand'){const variant=ctx.ambushVariant,terrainBonus=variant==='high-ground ambush'?2:variant==='checkpoint trap'?1:0,score=rnd(1,20)+stat(state,'str')+Math.floor((state.scouting||0)/2)-terrainBonus,target=13+Math.round(ctx.route.pressure/2);if(score>=target){roadEventStat('hostile');reduceRoutePressure(ctx.from,ctx.to,1);state.reputation++;return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.001"),SOSText("world_road_travel.resolveRoadEvent.089",variant),'good',after)}const dmg=rnd(6,14);state.guardian.hp=Math.max(1,state.guardian.hp-dmg);addRoutePressure(ctx.from,ctx.to,1);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.003"),SOSText("world_road_travel.resolveRoadEvent.090",ctx.ambushVariant,dmg),'bad',after)}
  if(choice==='evade'){const bonus=[SOSText("world_road_travel.resolveRoadEvent.005"),SOSText("world_road_travel.resolveRoadEvent.006")].includes(guardianClass())?4:0,score=rnd(1,20)+stat(state,'dex')+bonus;if(score>=13){gainScoutingIntel(1,{type:'road_event',location:ctx.to,source:SOSText("world_road_travel.intelGain.001"),summary:SOSText("world_road_travel.intelGain.002",worldLocation(ctx.to).name),reliability:68,precision:'route'});return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.007"),SOSText("world_road_travel.resolveRoadEvent.008"),'good',after)}advanceWorldDays(1,SOSText("world_road_travel.resolveRoadEvent.009"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.010"),SOSText("world_road_travel.resolveRoadEvent.011"),'info',after)}
  if(choice==='pay'){const cost=25;if(gold<cost)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.012"),SOSText("world_road_travel.resolveRoadEvent.013"),'bad',after);state.gold-=cost;return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.014"),SOSText("world_road_travel.resolveRoadEvent.015",cost),'bad',after)}
 }
 if(ev.id==='blocked'&&choice==='talkroadblock'){
  const hostile=state.world.parties.filter(p=>['bandits','raiders','mercenary'].includes(p.kind)&&(p.location===ctx.from||p.location===ctx.to||p.destination===ctx.to)).sort((a,b)=>(b.morale||0)-(a.morale||0))[0];
  if(hostile){gainScoutingIntel(1,{type:'roadblock',location:ctx.to,source:hostile.name,sourceRef:hostile.actorRef||`world_party:${hostile.id}`,summary:SOSText("world_road_travel.resolveRoadEvent.091",hostile.name,worldLocation(ctx.to).name),reliability:84,precision:'route'});return actionResult(SOSText("world_road_travel.resolveRoadEvent.092"),SOSText("world_road_travel.resolveRoadEvent.093",hostile.name),'warning',()=>showWorldEncounterPlan(hostile,true))}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.094"),SOSText("world_road_travel.resolveRoadEvent.095"),'info',after)
 }
 if(ev.id==='traffic'){
  if(choice==='news'){gainScoutingIntel(1,{type:'road_event',location:ctx.to,source:SOSText("world_road_travel.intelGain.001"),summary:SOSText("world_road_travel.intelGain.002",worldLocation(ctx.to).name),reliability:68,precision:'route'});const near=state.world.parties.filter(p=>p.location===ctx.to||p.destination===ctx.to).slice(0,2);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.016"),near.length?SOSText("world_road_travel.resolveRoadEvent.017",near.map(p=>p.name).join(' and '),worldLocation(ctx.to).name):SOSText("world_road_travel.resolveRoadEvent.018"),'good',after)}
  if(choice==='trade'){const pay=rnd(4,10);gainGold(pay);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.019"),SOSText("world_road_travel.resolveRoadEvent.020",pay),'good',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.021"),SOSText("world_road_travel.resolveRoadEvent.022"),'info',after)
 }
 if(ev.id==='stranded'){
  if(choice==='help'){state.reputation++;changeLocalReputation(loc,1,SOSText("world_road_travel.resolveRoadEvent.023"));reduceRoutePressure(ctx.from,ctx.to,1);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.024"),SOSText("world_road_travel.resolveRoadEvent.025"),'good',after)}
  if(choice==='escort'){advanceWorldDays(1,SOSText("world_road_travel.resolveRoadEvent.026"));state.reputation+=2;changeLocalReputation(loc,2,SOSText("world_road_travel.resolveRoadEvent.027"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.028"),SOSText("world_road_travel.resolveRoadEvent.029"),'good',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.030"),SOSText("world_road_travel.resolveRoadEvent.031"),'info',after)
 }

 if(ev.id==='wounded'){
  if(choice==='help'){roadEventStat('helped');state.reputation++;changeLocalReputation(loc,1,SOSText("world_road_travel.resolveRoadEvent.032"));ss.security=Math.min(100,ss.security+1);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.033"),SOSText("world_road_travel.resolveRoadEvent.034"),'good',after)}
  if(choice==='supplies'){if((state.world.cargo.medicine||0)<1)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.035"),SOSText("world_road_travel.resolveRoadEvent.036"),'info',after);roadEventCargo('medicine',-1);roadEventStat('helped');state.reputation+=2;changeLocalReputation(loc,2,SOSText("world_road_travel.resolveRoadEvent.037"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.038"),SOSText("world_road_travel.resolveRoadEvent.039"),'good',after)}
  roadEventStat('ignored');return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.040"),SOSText("world_road_travel.resolveRoadEvent.041"),'info',after)
 }
 if(ev.id==='refugees'){
  if(choice==='food'){if((state.world.cargo.food||0)<1)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.042"),SOSText("world_road_travel.resolveRoadEvent.043"),'info',after);roadEventCargo('food',-1);roadEventStat('helped');state.reputation++;changeLocalReputation(loc,1,SOSText("world_road_travel.resolveRoadEvent.044"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.045"),SOSText("world_road_travel.resolveRoadEvent.046"),'good',after)}
  if(choice==='gold'){if(gold<15)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.047"),SOSText("world_road_travel.resolveRoadEvent.048"),'info',after);state.gold-=15;roadEventStat('helped');state.reputation++;return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.049"),SOSText("world_road_travel.resolveRoadEvent.050"),'good',after)}
  roadEventStat('ignored');return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.051"),SOSText("world_road_travel.resolveRoadEvent.052"),'info',after)
 }
 if(ev.id==='broken_cart'){
  if(choice==='help'){roadEventStat('helped');const pay=rnd(8,18);gainGold(pay);ss.prosperity=Math.min(100,ss.prosperity+1);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.053"),SOSText("world_road_travel.resolveRoadEvent.054",pay), 'good',after)}
  if(choice==='buy'){if(gold<20)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.055"),SOSText("world_road_travel.resolveRoadEvent.056"),'info',after);state.gold-=20;const good=pick(TRADE_GOODS);roadEventCargo(good.id,1);roadEventStat('profited');return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.057"),SOSText("world_road_travel.resolveRoadEvent.058",good.name),'good',after)}
  if(choice==='rob'){roadEventStat('hostile');const take=rnd(25,50);gainGold(take);state.reputation=Math.max(0,state.reputation-2);changeLocalReputation(loc,-2,SOSText("world_road_travel.resolveRoadEvent.059"));ss.security=Math.max(0,ss.security-2);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.060"),SOSText("world_road_travel.resolveRoadEvent.061",take),'bad',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.062"),SOSText("world_road_travel.resolveRoadEvent.063"),'info',after)
 }
 if(ev.id==='toll'){
  const toll=12;
  if(choice==='pay'){if(gold<toll)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.064"),SOSText("world_road_travel.resolveRoadEvent.065",toll),'info',after);state.gold-=toll;return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.066"),SOSText("world_road_travel.resolveRoadEvent.067",toll),'info',after)}
  if(choice==='refuse'){if(chance(.55+(state.guardian.attrs?.cha||0)*.025)){ss.security=Math.min(100,ss.security+1);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.068"),SOSText("world_road_travel.resolveRoadEvent.069"),'good',after)}return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.070"),SOSText("world_road_travel.resolveRoadEvent.071"),'bad',after)}
  if(choice==='threaten'){roadEventStat('hostile');if(chance(.45+(state.guardian.attrs?.str||0)*.035)){state.reputation=Math.max(0,state.reputation-1);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.072"),SOSText("world_road_travel.resolveRoadEvent.073"),'info',after)}ss.security=Math.max(0,ss.security-2);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.074"),SOSText("world_road_travel.resolveRoadEvent.075"),'bad',after)}
 }
 if(ev.id==='camp'){
  if(choice==='investigate'){if(chance(.55)){const take=rnd(10,28);gainGold(take);roadEventStat('profited');return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.076"),SOSText("world_road_travel.resolveRoadEvent.077",take),'good',after)}return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.078"),SOSText("world_road_travel.resolveRoadEvent.079"),'info',after)}
  if(choice==='avoid'){return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.080"),SOSText("world_road_travel.resolveRoadEvent.081"),'info',after)}
  if(choice==='demand'){roadEventStat('hostile');state.reputation=Math.max(0,state.reputation-1);const take=rnd(8,20);gainGold(take);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.082"),SOSText("world_road_travel.resolveRoadEvent.083",take),'bad',after)}
 }
 if(ev.id==='patrol'){
  if(choice==='mediate'){const good=chance(.5+(state.guardian.attrs?.cha||0)*.025);if(good){state.reputation++;ss.security=Math.min(100,ss.security+2);roadEventFaction(1,SOSText("world_road_travel.resolveRoadEvent.084"));roadEventFaction(1,SOSText("world_road_travel.resolveRoadEvent.085"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.086"),SOSText("world_road_travel.resolveRoadEvent.087"),'good',after)}return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.088"),SOSText("world_road_travel.resolveRoadEvent.089"),'info',after)}
  if(choice==='coalition'){roadEventFaction(2,SOSText("world_road_travel.resolveRoadEvent.090"));roadEventFaction(-1,SOSText("world_road_travel.resolveRoadEvent.091"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.092"),SOSText("world_road_travel.resolveRoadEvent.093"),'info',after)}
  if(choice==='redstone'){roadEventFaction(2,SOSText("world_road_travel.resolveRoadEvent.094"));roadEventFaction(-1,SOSText("world_road_travel.resolveRoadEvent.095"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.096"),SOSText("world_road_travel.resolveRoadEvent.097"),'info',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.098"),SOSText("world_road_travel.resolveRoadEvent.099"),'info',after)
 }
 if(ev.id==='blocked'){
  if(choice==='clear'){roadEventStat('helped');ss.security=Math.min(100,ss.security+1);changeLocalReputation(loc,1,SOSText("world_road_travel.resolveRoadEvent.100"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.101"),SOSText("world_road_travel.resolveRoadEvent.102"),'good',after)}
  if(choice==='detour'){advanceWorldDays(1,SOSText("world_road_travel.resolveRoadEvent.103"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.104"),SOSText("world_road_travel.resolveRoadEvent.105"),'info',after)}
 }
 if(ev.id==='weather'){
  if(choice==='press'){if(chance(.35)){return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.106"),SOSText("world_road_travel.resolveRoadEvent.107"),'good',after)}return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.108"),SOSText("world_road_travel.resolveRoadEvent.109"),'bad',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.110"),SOSText("world_road_travel.resolveRoadEvent.111"),'info',after)
 }
 if(ev.id==='prisoners'){
  if(choice==='ask'){return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.112"),SOSText("world_road_travel.resolveRoadEvent.113"),'info',after)}
  if(choice==='intervene'){roadEventStat('hostile');state.reputation=Math.max(0,state.reputation-1);ss.security=Math.max(0,ss.security-1);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.114"),SOSText("world_road_travel.resolveRoadEvent.115"),'bad',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.116"),SOSText("world_road_travel.resolveRoadEvent.117"),'info',after)
 }
 if(ev.id==='abandoned'){
  if(choice==='search'){if(chance(.7)){const good=pick(TRADE_GOODS);roadEventCargo(good.id,1);roadEventStat('profited');return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.118"),SOSText("world_road_travel.resolveRoadEvent.119",good.name),'good',after)}return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.120"),SOSText("world_road_travel.resolveRoadEvent.121"),'info',after)}
  if(choice==='mark'){roadEventStat('helped');ss.security=Math.min(100,ss.security+1);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.122"),SOSText("world_road_travel.resolveRoadEvent.123"),'good',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.124"),SOSText("world_road_travel.resolveRoadEvent.125"),'info',after)
 }
 if(ev.id==='traveler'){
  if(choice==='escort'){roadEventStat('helped');state.reputation++;changeLocalReputation(loc,1,SOSText("world_road_travel.resolveRoadEvent.126"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.127"),SOSText("world_road_travel.resolveRoadEvent.128"),'good',after)}
  if(choice==='directions'){return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.129"),SOSText("world_road_travel.resolveRoadEvent.130"),'info',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.131"),SOSText("world_road_travel.resolveRoadEvent.132"),'info',after)
 }
 if(ev.id==='pilgrims'){
  if(choice==='share'){if((state.world.cargo.food||0)>0)roadEventCargo('food',-1);else if(state.gold>=8)state.gold-=8;else return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.133"),SOSText("world_road_travel.resolveRoadEvent.134"),'info',after);state.reputation++;changeLocalReputation(loc,1,SOSText("world_road_travel.resolveRoadEvent.135"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.136"),SOSText("world_road_travel.resolveRoadEvent.137"),'good',after)}
  if(choice==='walk'){gainScoutingIntel(1,{type:'road_event',location:ctx.to,source:SOSText("world_road_travel.intelGain.001"),summary:SOSText("world_road_travel.intelGain.002",worldLocation(ctx.to).name),reliability:68,precision:'route'});return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.138"),SOSText("world_road_travel.resolveRoadEvent.139"),'good',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.140"),SOSText("world_road_travel.resolveRoadEvent.141"),'info',after)
 }
 if(ev.id==='deserters'){
  if(choice==='question'){gainScoutingIntel(1,{type:'road_event',location:ctx.to,source:SOSText("world_road_travel.intelGain.001"),summary:SOSText("world_road_travel.intelGain.002",worldLocation(ctx.to).name),reliability:68,precision:'route'});return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.142"),SOSText("world_road_travel.resolveRoadEvent.143"),'good',after)}
  if(choice==='hide'){const f=settlementControl(loc);if(OPEN_WORLD_FACTIONS[f])adjustFactionStanding(f,-1,SOSText("world_road_travel.resolveRoadEvent.144"));state.reputation++;return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.145"),SOSText("world_road_travel.resolveRoadEvent.146"),'info',after)}
  if(choice==='turnin'){const f=settlementControl(loc);if(OPEN_WORLD_FACTIONS[f])adjustFactionStanding(f,2,SOSText("world_road_travel.resolveRoadEvent.147"));ss.security=Math.min(100,ss.security+1);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.148"),'','good',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.150"),SOSText("world_road_travel.resolveRoadEvent.151"),'info',after)
 }
 if(ev.id==='messenger'){
  if(choice==='carry'){const faction=settlementControl(ctx.to);if(OPEN_WORLD_FACTIONS[faction])adjustFactionStanding(faction,1,SOSText("world_road_travel.resolveRoadEvent.152"));state.reputation++;return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.153"),SOSText("world_road_travel.resolveRoadEvent.154"),'good',after)}
  if(choice==='news'){gainScoutingIntel(2,{type:'road_event',location:ctx.to,source:SOSText("world_road_travel.intelGain.001"),summary:SOSText("world_road_travel.intelGain.003",worldLocation(ctx.to).name),reliability:76,precision:'route'});return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.155"),SOSText("world_road_travel.resolveRoadEvent.156"),'good',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.157"),SOSText("world_road_travel.resolveRoadEvent.158"),'info',after)
 }
 if(ev.id==='smugglers'){
  if(choice==='buy'){if(state.gold<22)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.159"),SOSText("world_road_travel.resolveRoadEvent.160"),'info',after);state.gold-=22;const good=pick(TRADE_GOODS);roadEventCargo(good.id,1);if(chance(.35))recordCrimeDetailed('smuggling',loc,SOSText("world_road_travel.resolveRoadEvent.161"),{severity:2,desc:SOSText("world_road_travel.resolveRoadEvent.162")});return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.163"),SOSText("world_road_travel.resolveRoadEvent.164",good.name),'info',after)}
  if(choice==='report'){ss.security=Math.min(100,ss.security+1);changeLocalReputation(loc,1,SOSText("world_road_travel.resolveRoadEvent.165"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.166"),SOSText("world_road_travel.resolveRoadEvent.167"),'good',after)}
  if(choice==='ask'){gainScoutingIntel(1,{type:'road_event',location:ctx.to,source:SOSText("world_road_travel.intelGain.001"),summary:SOSText("world_road_travel.intelGain.002",worldLocation(ctx.to).name),reliability:68,precision:'route'});return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.168"),SOSText("world_road_travel.resolveRoadEvent.169"),'info',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.170"),SOSText("world_road_travel.resolveRoadEvent.171"),'info',after)
 }
 if(ev.id==='bounty_hunter'){
  if(hasWarrant(loc)){
    if(choice==='payoff'){const cost=Math.max(15,Math.round(localBounty(loc)*.25));if(state.gold<cost)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.172"),SOSText("world_road_travel.resolveRoadEvent.173",cost),'info',after);state.gold-=cost;lawState().heat[loc]=Math.max(0,lawHeat(loc)-1);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.174"),SOSText("world_road_travel.resolveRoadEvent.175",cost),'bad',after)}
    if(choice==='talk'){const roll=rnd(1,20)+stat(state,'cha');if(roll>=16){lawState().heat[loc]=Math.max(0,lawHeat(loc)-1);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.176"),SOSText("world_road_travel.resolveRoadEvent.177"),'good',after)}return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.178"),SOSText("world_road_travel.resolveRoadEvent.179"),'bad',after)}
    if(choice==='fight'){lawState().heat[loc]=clamp(lawHeat(loc)+2,0,20);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.180"),SOSText("world_road_travel.resolveRoadEvent.181"),'bad',after)}
  }else{
    if(choice==='ask'){const wanted=regionalSettlements().find(x=>hasWarrant(x.id));if(wanted)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.182"),SOSText("world_road_travel.resolveRoadEvent.183",wanted.name),'info',after);gainScoutingIntel(1,{type:'road_event',location:ctx.to,source:SOSText("world_road_travel.intelGain.001"),summary:SOSText("world_road_travel.intelGain.002",worldLocation(ctx.to).name),reliability:68,precision:'route'});return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.184"),SOSText("world_road_travel.resolveRoadEvent.185"),'good',after)}
  }
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.186"),SOSText("world_road_travel.resolveRoadEvent.187"),'info',after)
 }
 if(ev.id==='road_healer'){
  if(choice==='treat'){if(state.gold<12)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.188"),SOSText("world_road_travel.resolveRoadEvent.189"),'info',after);state.gold-=12;restoreActiveCompany(.4);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.190"),SOSText("world_road_travel.resolveRoadEvent.191"),'good',after)}
  if(choice==='buy'){if(state.gold<18)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.192"),SOSText("world_road_travel.resolveRoadEvent.193"),'info',after);state.gold-=18;roadEventCargo('medicine',1);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.194"),SOSText("world_road_travel.resolveRoadEvent.195"),'good',after)}
  if(choice==='news'){gainScoutingIntel(1,{type:'road_event',location:ctx.to,source:SOSText("world_road_travel.intelGain.001"),summary:SOSText("world_road_travel.intelGain.002",worldLocation(ctx.to).name),reliability:68,precision:'route'});return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.196"),SOSText("world_road_travel.resolveRoadEvent.197"),'info',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.198"),SOSText("world_road_travel.resolveRoadEvent.199"),'info',after)
 }
 if(ev.id==='merc_recruiter'){
  if(choice==='hire'){if(state.gold<25)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.200"),SOSText("world_road_travel.resolveRoadEvent.201"),'info',after);state.gold-=25;gainScoutingIntel(2,{type:'road_event',location:ctx.to,source:SOSText("world_road_travel.intelGain.001"),summary:SOSText("world_road_travel.intelGain.003",worldLocation(ctx.to).name),reliability:76,precision:'route'});for(const m of activeRoadCompanions())m.preparedPeriod=state.world.day;return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.202"),SOSText("world_road_travel.resolveRoadEvent.203"),'good',after)}
  if(choice==='work'){const op=activeRegionalOpportunities()[0];if(op)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.204"),SOSText("world_road_travel.resolveRoadEvent.205",op.title.toLowerCase()),'info',after);state.world.factionStanding.Mercenaries=(state.world.factionStanding.Mercenaries||0)+1;return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.206"),SOSText("world_road_travel.resolveRoadEvent.207"),'good',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.208"),SOSText("world_road_travel.resolveRoadEvent.209"),'info',after)
 }
 if(ev.id==='ruined_caravan'){
  if(choice==='investigate'){gainScoutingIntel(2,{type:'road_event',location:ctx.to,source:SOSText("world_road_travel.intelGain.001"),summary:SOSText("world_road_travel.intelGain.003",worldLocation(ctx.to).name),reliability:76,precision:'route'});addRoutePressure(ctx.from,ctx.to,1);if(!settlementProblem(loc)&&chance(.35))createSettlementProblem(loc,'raider_pressure');return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.210"),SOSText("world_road_travel.resolveRoadEvent.211"),'info',after)}
  if(choice==='salvage'){const good=pick(TRADE_GOODS);roadEventCargo(good.id,1);if(chance(.25))recordCrimeDetailed('theft',loc,SOSText("world_road_travel.resolveRoadEvent.212"),{severity:1,desc:SOSText("world_road_travel.resolveRoadEvent.213")});return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.214"),SOSText("world_road_travel.resolveRoadEvent.215",good.name),'good',after)}
  if(choice==='report'){ss.security=Math.min(100,ss.security+2);changeLocalReputation(loc,1,SOSText("world_road_travel.resolveRoadEvent.216"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.217"),SOSText("world_road_travel.resolveRoadEvent.218"),'good',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.219"),SOSText("world_road_travel.resolveRoadEvent.220"),'info',after)
 }
 if(ev.id==='magic_disturbance'){
  if(choice==='study'){const cls=guardianClass(),bonus=cls===SOSText("world_road_travel.resolveRoadEvent.221")?3:cls===SOSText("world_road_travel.resolveRoadEvent.222")||cls===SOSText("world_road_travel.resolveRoadEvent.223")?1:0;gainScoutingIntel(1+bonus,{type:'trail_study',location:ctx.to,source:SOSText("world_road_travel.intelGain.004"),summary:SOSText("world_road_travel.intelGain.005",worldLocation(ctx.to).name),reliability:78+bonus*3,precision:'terrain'});if(chance(.45+bonus*.08)){const pay=rnd(12,32);gainGold(pay);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.224"),SOSText("world_road_travel.resolveRoadEvent.225",pay),'good',after)}return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.226"),SOSText("world_road_travel.resolveRoadEvent.227"),'info',after)}
  if(choice==='avoid'){return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.228"),SOSText("world_road_travel.resolveRoadEvent.229"),'info',after)}
  if(choice==='touch'){if(chance(.4)){restoreActiveCompany(.25);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.230"),SOSText("world_road_travel.resolveRoadEvent.231"),'good',after)}state.guardian.hp=Math.max(1,state.guardian.hp-rnd(3,9));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.232"),SOSText("world_road_travel.resolveRoadEvent.233"),'bad',after)}
 }
 if(ev.id==='hunters'){
  if(choice==='trade'){if(state.gold<10)return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.234"),SOSText("world_road_travel.resolveRoadEvent.235"),'info',after);state.gold-=10;roadEventCargo('food',1);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.236"),SOSText("world_road_travel.resolveRoadEvent.237"),'good',after)}
  if(choice==='roads'){gainScoutingIntel(2,{type:'road_event',location:ctx.to,source:SOSText("world_road_travel.intelGain.001"),summary:SOSText("world_road_travel.intelGain.003",worldLocation(ctx.to).name),reliability:76,precision:'route'});return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.238"),SOSText("world_road_travel.resolveRoadEvent.239"),'good',after)}
  if(choice==='camp'){restoreActiveCompany(.2);return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.240"),SOSText("world_road_travel.resolveRoadEvent.241"),'good',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.242"),SOSText("world_road_travel.resolveRoadEvent.243"),'info',after)
 }
 if(ev.id==='envoy'){
  const f=pick([SOSText("world_road_travel.resolveRoadEvent.244"),SOSText("world_road_travel.resolveRoadEvent.245"),SOSText("world_road_travel.resolveRoadEvent.246")]);
  if(choice==='escort'){adjustFactionStanding(f,1,SOSText("world_road_travel.resolveRoadEvent.247"));state.reputation++;return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.248"),SOSText("world_road_travel.resolveRoadEvent.249",majorFaction(f).short),'good',after)}
  if(choice==='news'){gainScoutingIntel(1,{type:'road_event',location:ctx.to,source:SOSText("world_road_travel.intelGain.001"),summary:SOSText("world_road_travel.intelGain.002",worldLocation(ctx.to).name),reliability:68,precision:'route'});return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.250"),SOSText("world_road_travel.resolveRoadEvent.251",majorFaction(f).short),'info',after)}
  if(choice==='pressure'){adjustFactionStanding(f,-2,SOSText("world_road_travel.resolveRoadEvent.252"));addPoliticalPressure(loc,f,-1,SOSText("world_road_travel.resolveRoadEvent.253"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.254"),SOSText("world_road_travel.resolveRoadEvent.255"),'bad',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.256"),SOSText("world_road_travel.resolveRoadEvent.257"),'info',after)
 }
 if(ev.id==='escaped_prisoner'){
  if(choice==='help'){state.reputation++;changeLocalReputation(loc,1,SOSText("world_road_travel.resolveRoadEvent.258"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.259"),SOSText("world_road_travel.resolveRoadEvent.260"),'info',after)}
  if(choice==='turnin'){ss.security=Math.min(100,ss.security+1);changeLocalReputation(loc,1,SOSText("world_road_travel.resolveRoadEvent.261"));return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.262"),SOSText("world_road_travel.resolveRoadEvent.263"),'good',after)}
  if(choice==='story'){gainScoutingIntel(1,{type:'road_event',location:ctx.to,source:SOSText("world_road_travel.intelGain.001"),summary:SOSText("world_road_travel.intelGain.002",worldLocation(ctx.to).name),reliability:68,precision:'route'});return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.264"),SOSText("world_road_travel.resolveRoadEvent.265"),'info',after)}
  return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.266"),SOSText("world_road_travel.resolveRoadEvent.267"),'info',after)
 }
 return roadEventOutcome(ev,choice,ctx,SOSText("world_road_travel.resolveRoadEvent.268"),SOSText("world_road_travel.resolveRoadEvent.269"),'info',after)
}
function roadEventButtons(ev){
 if(ev.id==='ambush')return [['stand',SOSText("world_road_travel.roadEventButtons.001")],['evade',SOSText("world_road_travel.roadEventButtons.002")],['pay',SOSText("world_road_travel.roadEventButtons.003")]];
 if(ev.id==='traffic')return [['news',SOSText("world_road_travel.roadEventButtons.004")],['trade',SOSText("world_road_travel.roadEventButtons.005")],['continue',SOSText("world_road_travel.roadEventButtons.006")]];
 if(ev.id==='stranded')return [['help',SOSText("world_road_travel.roadEventButtons.007")],['escort',SOSText("world_road_travel.roadEventButtons.008")],['continue',SOSText("world_road_travel.roadEventButtons.009")]];
 const m={
  wounded:[['help',SOSText("world_road_travel.roadEventButtons.010")],['supplies',SOSText("world_road_travel.roadEventButtons.011")],['ignore',SOSText("world_road_travel.roadEventButtons.012")]],
  refugees:[['food',SOSText("world_road_travel.roadEventButtons.013")],['gold',SOSText("world_road_travel.roadEventButtons.014")],['ignore',SOSText("world_road_travel.roadEventButtons.015")]],
  broken_cart:[['help',SOSText("world_road_travel.roadEventButtons.016")],['buy',SOSText("world_road_travel.roadEventButtons.017")],['rob',SOSText("world_road_travel.roadEventButtons.018")],['ignore',SOSText("world_road_travel.roadEventButtons.019")]],
  toll:[['pay',SOSText("world_road_travel.roadEventButtons.020")],['refuse',SOSText("world_road_travel.roadEventButtons.021")],['threaten',SOSText("world_road_travel.roadEventButtons.022")]],
  camp:[['investigate',SOSText("world_road_travel.roadEventButtons.023")],['avoid',SOSText("world_road_travel.roadEventButtons.024")],['demand',SOSText("world_road_travel.roadEventButtons.025")]],
  patrol:[['mediate',SOSText("world_road_travel.roadEventButtons.026")],['coalition',SOSText("world_road_travel.roadEventButtons.027")],['redstone',SOSText("world_road_travel.roadEventButtons.028")],['ignore',SOSText("world_road_travel.roadEventButtons.029")]],
  blocked:[['clear',SOSText("world_road_travel.roadEventButtons.030")],['detour',SOSText("world_road_travel.roadEventButtons.031")]],
  weather:[['press',SOSText("world_road_travel.roadEventButtons.032")],['wait',SOSText("world_road_travel.roadEventButtons.033")]],
  prisoners:[['ask',SOSText("world_road_travel.roadEventButtons.034")],['intervene',SOSText("world_road_travel.roadEventButtons.035")],['ignore',SOSText("world_road_travel.roadEventButtons.036")]],
  abandoned:[['search',SOSText("world_road_travel.roadEventButtons.037")],['mark',SOSText("world_road_travel.roadEventButtons.038")],['ignore',SOSText("world_road_travel.roadEventButtons.039")]],
  traveler:[['escort',SOSText("world_road_travel.roadEventButtons.040")],['directions',SOSText("world_road_travel.roadEventButtons.041")],['ignore',SOSText("world_road_travel.roadEventButtons.042")]],
  pilgrims:[['share',SOSText("world_road_travel.roadEventButtons.043")],['walk',SOSText("world_road_travel.roadEventButtons.044")],['ignore',SOSText("world_road_travel.roadEventButtons.045")]],
  deserters:[['question',SOSText("world_road_travel.roadEventButtons.046")],['hide',SOSText("world_road_travel.roadEventButtons.047")],['turnin',SOSText("world_road_travel.roadEventButtons.048")],['ignore',SOSText("world_road_travel.roadEventButtons.049")]],
  messenger:[['carry',SOSText("world_road_travel.roadEventButtons.050")],['news',SOSText("world_road_travel.roadEventButtons.051")],['ignore',SOSText("world_road_travel.roadEventButtons.052")]],
  smugglers:[['buy',SOSText("world_road_travel.roadEventButtons.053")],['ask',SOSText("world_road_travel.roadEventButtons.054")],['report',SOSText("world_road_travel.roadEventButtons.055")],['ignore',SOSText("world_road_travel.roadEventButtons.056")]],
  bounty_hunter:[['ask',SOSText("world_road_travel.roadEventButtons.057")],['talk',SOSText("world_road_travel.roadEventButtons.058")],['payoff',SOSText("world_road_travel.roadEventButtons.059")],['fight',SOSText("world_road_travel.roadEventButtons.060")],['ignore',SOSText("world_road_travel.roadEventButtons.061")]],
  road_healer:[['treat',SOSText("world_road_travel.roadEventButtons.062")],['buy',SOSText("world_road_travel.roadEventButtons.063")],['news',SOSText("world_road_travel.roadEventButtons.064")],['ignore',SOSText("world_road_travel.roadEventButtons.065")]],
  merc_recruiter:[['hire',SOSText("world_road_travel.roadEventButtons.066")],['work',SOSText("world_road_travel.roadEventButtons.067")],['ignore',SOSText("world_road_travel.roadEventButtons.068")]],
  ruined_caravan:[['investigate',SOSText("world_road_travel.roadEventButtons.069")],['salvage',SOSText("world_road_travel.roadEventButtons.070")],['report',SOSText("world_road_travel.roadEventButtons.071")],['ignore',SOSText("world_road_travel.roadEventButtons.072")]],
  magic_disturbance:[['study',SOSText("world_road_travel.roadEventButtons.073")],['touch',SOSText("world_road_travel.roadEventButtons.074")],['avoid',SOSText("world_road_travel.roadEventButtons.075")]],
  hunters:[['trade',SOSText("world_road_travel.roadEventButtons.076")],['roads',SOSText("world_road_travel.roadEventButtons.077")],['camp',SOSText("world_road_travel.roadEventButtons.078")],['ignore',SOSText("world_road_travel.roadEventButtons.079")]],
  envoy:[['escort',SOSText("world_road_travel.roadEventButtons.080")],['news',SOSText("world_road_travel.roadEventButtons.081")],['pressure',SOSText("world_road_travel.roadEventButtons.082")],['ignore',SOSText("world_road_travel.roadEventButtons.083")]],
  escaped_prisoner:[['story',SOSText("world_road_travel.roadEventButtons.084")],['help',SOSText("world_road_travel.roadEventButtons.085")],['turnin',SOSText("world_road_travel.roadEventButtons.086")],['ignore',SOSText("world_road_travel.roadEventButtons.087")]]
 };
 return m[ev.id]||[['ignore',SOSText("world_road_travel.roadEventButtons.088")]]
}
function showRoadEvent(ev,ctx,after){modalRouteEnter(SOSText("world_road_travel.showRoadEvent.001"),Array.from(arguments));
 let buttons=roadEventButtons(ev);if(ev.id==='blocked'&&ctx.route.pressure>=5&&chance(.38))buttons=[['talkroadblock',SOSText("world_road_travel.roadEventButtons.089")],['clear',SOSText("world_road_travel.roadEventButtons.030")],['detour',SOSText("world_road_travel.roadEventButtons.031")]];if(ev.id==='bounty_hunter'&&!hasWarrant(roadEventSettlementId(ctx)))buttons=buttons.filter(([id])=>['ask','ignore'].includes(id));
 overlay(SOSText("world_road_travel.showRoadEvent.002",esc(ev.title),ctx.route.status,esc(ev.text),esc(worldLocation(ctx.from).name),esc(worldLocation(ctx.to).name),esc(ctx.route.status.toUpperCase()),ctx.escort?' • Escort journey':'',buttons.map(([id,label])=>`<button data-roadchoice="${id}">${esc(label)}</button>`).join('')),false,true);
 document.querySelectorAll('[data-roadchoice]').forEach(b=>b.onclick=()=>resolveRoadEvent(ev,b.dataset.roadchoice,ctx,after))
}
function maybeRoadEvent(from,to,escort,after){
 ensureWorldState();const ctx=roadEventContext(from,to,escort);
 if(state.world.day<=(state.world.roadEventCooldownDay||0)||!chance(roadEventChance(ctx)))return after();
 state.world.roadEventCooldownDay=state.world.day;const ev=roadEventWeightedPick(ctx);showRoadEvent(ev,ctx,after)
}

function roadEncounterVariety(){
 const seen=new Set((state.world.roadEventHistory||[]).map(x=>x.event)),counts={};for(const x of state.world.roadEventHistory||[])counts[x.event]=(counts[x.event]||0)+1;
 return {seen,counts,total:ROAD_EVENT_TYPES.length}
}
function showRoadEncounterCatalogue(){modalRouteEnter(SOSText("world_road_travel.showRoadEncounterCatalogue.001"),Array.from(arguments));
 const v=roadEncounterVariety(),hist=(state.world.roadEventHistory||[]).slice(-15).reverse();
 overlay(SOSText("world_road_travel.showRoadEncounterCatalogue.002",v.seen.size,v.total,state.world.roadEventHistory.length,ROAD_EVENT_TYPES.map(e=>`<div class="card compact ${v.seen.has(e.id)?'seen':'unseen'}"><b>${esc(e.title)}</b><br><small>${v.seen.has(e.id)?`Encountered ${v.counts[e.id]||0} time${(v.counts[e.id]||0)===1?'':'s'}`:'Not yet encountered'}</small></div>`).join(''),hist.map(x=>`<div class="card compact"><b>Day ${x.day}: ${esc(x.title)}</b><br>${esc(x.result)}</div>`).join('')||'<p class="muted">No road encounters yet.</p>'),true);wireClose()
}
function recentRoadEventsHTML(){
 const rows=(state.world.roadEventHistory||[]).slice(-6).reverse();
 return rows.length?rows.map(x=>SOSText("world_road_travel.recentRoadEventsHTML.001",x.day,esc(x.title),esc(x.result))).join(''):SOSText("world_road_travel.recentRoadEventsHTML.002")
}

function unlockRegion(region){
 ensureWorldState();if(!state.world.unlockedRegions.includes(region))state.world.unlockedRegions.push(region);
 for(const loc of WORLD_LOCATIONS.filter(x=>locationRegion(x)===region&&!x.hidden))if(!state.world.discovered.includes(loc.id))state.world.discovered.push(loc.id);
 if(region==='bluestone'&&!state.world.parties.some(p=>locationRegion(p.location)==='bluestone')){spawnWorldParty('bluestone','bluestone');spawnWorldParty('merchant','bluestone');spawnWorldParty('bandits','bluestone');spawnWorldParty('mercenary','bluestone')};if(region==='redstone'&&!state.world.parties.some(p=>locationRegion(p.location)==='redstone')){spawnWorldParty('redstone','redstone');spawnWorldParty('redstone','redstone');spawnWorldParty('merchant','redstone');spawnWorldParty('bandits','redstone');spawnWorldParty('mercenary','redstone')};if(region==='bluestone'){for(const id of ['blue_guide','blue_quarry','blue_valley','blue_signal']){const c=state.world.companions[id];if(c){c.known=true;c.lastSeenDay=state.world.day}}}
}
function regionTravelFlavor(c){
 if(c.id==='northwest_highroad')return {summary:SOSText("world_road_travel.regionTravelFlavor.001"),events:[SOSText("world_road_travel.regionTravelFlavor.002"),SOSText("world_road_travel.regionTravelFlavor.003"),SOSText("world_road_travel.regionTravelFlavor.004"),SOSText("world_road_travel.regionTravelFlavor.005")]};
 if(c.id==='eastern_redstone_road')return {summary:SOSText("world_road_travel.regionTravelFlavor.006"),events:[SOSText("world_road_travel.regionTravelFlavor.007"),SOSText("world_road_travel.regionTravelFlavor.008"),SOSText("world_road_travel.regionTravelFlavor.009"),SOSText("world_road_travel.regionTravelFlavor.010")]};
 return {summary:SOSText("world_road_travel.regionTravelFlavor.011"),events:[SOSText("world_road_travel.regionTravelFlavor.012")]}
}
function showRegionTravel(){modalRouteEnter(SOSText("world_road_travel.showRegionTravel.001"),Array.from(arguments));
 const c=regionConnectionAt();if(!c)return actionResult(SOSText("world_road_travel.showRegionTravel.002"),SOSText("world_road_travel.showRegionTravel.003"),'info',renderOpenWorld);
 const dest=regionConnectionOther(c,state.world.location),to=worldLocation(dest),toRegion=regionDef(locationRegion(dest)),flavor=regionTravelFlavor(c);
 overlay(SOSText("world_road_travel.showRegionTravel.004",esc(c.name),esc(c.desc),esc(toRegion.name),c.days,esc(flavor.summary),esc(to.name)));
 $('#crossRegion').onclick=()=>{closeOverlay();beginInterRegionJourney(c,state.world.location,dest,c.days)};$('#regionTravelStay').onclick=()=>{if(worldLifePendingTravel())clearWorldLifePendingTravel();save();closeOverlay();renderOpenWorld()}
}
function beginInterRegionJourney(connection,from,dest,remaining){
 if(remaining<=0){const newRegion=locationRegion(dest),scoutShift=reduceScoutingForRegionChange();unlockRegion(newRegion);state.world.location=dest;state.world.region=newRegion;ensureMapView(newRegion).lastLocation=null;if(scoutShift.before!==scoutShift.after)recordWorldHistory(`Regional scouting reset: ${scoutShift.before} → ${scoutShift.after}. Fresh reconnaissance is needed in ${regionDef(newRegion).name}.`,'info','travel');state.world.regionHistory.push({day:state.world.day,from:locationRegion(from),to:newRegion,via:connection.name});state.world.regionHistory=state.world.regionHistory.slice(-30);ensureMapView().lastLocation=null;SOSServices.companions.noteSharedEvent('region',SOSText("world_road_travel.beginInterRegionJourney.001",connection.name,regionDef(newRegion).name));recordWorldHistory(SOSText("world_road_travel.beginInterRegionJourney.002",connection.name,regionDef(newRegion).name),'good',SOSText("world_road_travel.beginInterRegionJourney.003"));save();if(worldLifePendingTravel()){if(continueWorldLifeTravel())return}return renderOpenWorld()}
 advanceWorldDays(1,SOSText("world_road_travel.beginInterRegionJourney.004",connection.name));const flavor=regionTravelFlavor(connection);if(chance(.28))log(pick(flavor.events),'info');beginInterRegionJourney(connection,from,dest,remaining-1)
}
function attemptWorldTravel(dest){
 ensureWorldState();if(captivityActive())return showCaptivity();const eq=activeEscortQuest();if(eq)return showEscortStatus(eq.id);if(dest===state.world.location)return showWorldArea();if(locationRegion(dest)!==currentWorldRegion()){const c=regionConnectionAt();if(c&&regionConnectionOther(c,state.world.location)===dest)return showRegionTravel();return actionResult(SOSText("world_road_travel.attemptWorldTravel.001"),SOSText("world_road_travel.attemptWorldTravel.002",worldLocation(dest).name),'info',renderOpenWorld)}
 const from=state.world.location,to=worldLocation(dest),profile=roadConditionProfile(from,dest),opts=routeTravelOptions(from,dest),reaction=companionRouteReaction(from,dest);
 overlay(SOSText("world_road_travel.attemptWorldTravel.003",esc(to.name),esc(to.desc),profile.status,esc(profile.status.toUpperCase()),profile.pressure,esc(profile.traffic),esc(roadTrafficDescription({from,to:dest,route:profile})),reaction?`<div class="companion-reaction">${esc(reaction)}</div>`:'',opts.direct.label,esc(opts.direct.desc),opts.safer.label,esc(opts.safer.desc)));
 const go=(mode,days)=>{if(typeof clearLawEntryState==='function')clearLawEntryState(from);if(from==='shantium'&&dest!=='shantium')homeMarkDeparture();state.world.travelPlan={mode,from,to:dest,startedDay:state.world.day};state.world.routeTravelHistory.push({day:state.world.day,from,to:dest,mode,status:profile.status,pressure:profile.pressure});state.world.routeTravelHistory=state.world.routeTravelHistory.slice(-40);closeOverlay();beginWorldJourney(from,dest,days)};
 $('#travelDirect').onclick=()=>go('direct',scoutingTravelDays(opts.direct.days));$('#travelSafer').onclick=()=>go('safer',scoutingTravelDays(opts.safer.days));$('#travelStay').onclick=()=>{if(worldLifePendingTravel())clearWorldLifePendingTravel();save();closeOverlay();renderOpenWorld()};
}
function beginWorldJourney(from,dest,remaining){
 ensureWorldState();if(remaining<=0){ensureMapView().lastLocation=null;state.world.location=dest;state.world.region=locationRegion(dest);if(dest==='shantium'&&from!=='shantium')homePrepareHomecomingBriefing();state.world.travelPlan={mode:'direct',from:null,to:null,startedDay:null};state.world.settlementVisits[dest]=(state.world.settlementVisits[dest]||0)+1;if(worldLocation(dest).hidden){const XS=explorationSiteState(dest);XS.visits++;XS.lastVisit=state.world.day}if(state.world.settlements[dest])createSettlementEvent(dest,false);log(SOSText("world_road_travel.beginWorldJourney.001",state.world.day,worldLocation(dest).name),'info');if(state.world.settlements[dest])SOSServices.companions.noteSharedEvent('settlement',SOSText("world_road_travel.beginWorldJourney.002",worldLocation(dest).name));checkWorldQuestArrival();checkAdventureStoryArrival();checkFactionQuestProgress();checkPersonalRequests();save();const finishArrival=()=>{if(worldLifePendingTravel()){if(continueWorldLifeTravel())return}if(checkCompanionStories()){save();return}renderOpenWorld();return handleFactionArrival(dest,renderOpenWorld)};if(state.world.settlements[dest]&&typeof showSettlementLawArrival==='function'&&lawArrivalNeedsDecision(dest)){showSettlementLawArrival(dest,finishArrival);return}return finishArrival()}
 advanceWorldDays(1,SOSText("world_road_travel.beginWorldJourney.003",worldLocation(from).name,worldLocation(dest).name));
 const next=()=>beginWorldJourney(from,dest,remaining-1);
 maybeRoadEvent(from,dest,false,next)
}


const BLUESTONE_SETTLEMENT_PROFILES={
 zion:{identity:SOSText("world_road_travel.beginWorldJourney.004"),culture:SOSText("world_road_travel.beginWorldJourney.005"),infrastructure:SOSText("world_road_travel.beginWorldJourney.006"),survival:SOSText("world_road_travel.beginWorldJourney.007"),authority:SOSText("world_road_travel.beginWorldJourney.008"),concerns:[SOSText("world_road_travel.beginWorldJourney.009"),SOSText("world_road_travel.beginWorldJourney.010"),SOSText("world_road_travel.beginWorldJourney.011"),SOSText("world_road_travel.beginWorldJourney.012")]},
 lowcreek:{identity:SOSText("world_road_travel.beginWorldJourney.013"),culture:SOSText("world_road_travel.beginWorldJourney.014"),infrastructure:SOSText("world_road_travel.beginWorldJourney.015"),survival:SOSText("world_road_travel.beginWorldJourney.016"),authority:SOSText("world_road_travel.beginWorldJourney.017"),concerns:[SOSText("world_road_travel.beginWorldJourney.018"),SOSText("world_road_travel.beginWorldJourney.019"),SOSText("world_road_travel.beginWorldJourney.020"),SOSText("world_road_travel.beginWorldJourney.021")]},
 ebonheart:{identity:SOSText("world_road_travel.beginWorldJourney.022"),culture:SOSText("world_road_travel.beginWorldJourney.023"),infrastructure:SOSText("world_road_travel.beginWorldJourney.024"),survival:SOSText("world_road_travel.beginWorldJourney.025"),authority:SOSText("world_road_travel.beginWorldJourney.026"),concerns:[SOSText("world_road_travel.beginWorldJourney.027"),SOSText("world_road_travel.beginWorldJourney.028"),SOSText("world_road_travel.beginWorldJourney.029"),SOSText("world_road_travel.beginWorldJourney.030")]},
 norwegian:{identity:SOSText("world_road_travel.beginWorldJourney.031"),culture:SOSText("world_road_travel.beginWorldJourney.032"),infrastructure:SOSText("world_road_travel.beginWorldJourney.033"),survival:SOSText("world_road_travel.beginWorldJourney.034"),authority:SOSText("world_road_travel.beginWorldJourney.035"),concerns:[SOSText("world_road_travel.beginWorldJourney.036"),SOSText("world_road_travel.beginWorldJourney.037"),SOSText("world_road_travel.beginWorldJourney.038"),SOSText("world_road_travel.beginWorldJourney.039")]},
 winterstone:{identity:SOSText("world_road_travel.beginWorldJourney.040"),culture:SOSText("world_road_travel.beginWorldJourney.041"),infrastructure:SOSText("world_road_travel.beginWorldJourney.042"),survival:SOSText("world_road_travel.beginWorldJourney.043"),authority:SOSText("world_road_travel.beginWorldJourney.044"),concerns:[SOSText("world_road_travel.beginWorldJourney.045"),SOSText("world_road_travel.beginWorldJourney.046"),SOSText("world_road_travel.beginWorldJourney.047"),SOSText("world_road_travel.beginWorldJourney.048")]},
 skybreak:{identity:SOSText("world_road_travel.beginWorldJourney.049"),culture:SOSText("world_road_travel.beginWorldJourney.050"),infrastructure:SOSText("world_road_travel.beginWorldJourney.051"),survival:SOSText("world_road_travel.beginWorldJourney.052"),authority:SOSText("world_road_travel.beginWorldJourney.053"),concerns:[SOSText("world_road_travel.beginWorldJourney.054"),SOSText("world_road_travel.beginWorldJourney.055"),SOSText("world_road_travel.beginWorldJourney.056"),SOSText("world_road_travel.beginWorldJourney.057")]}
};
function bluestoneProfile(id){return BLUESTONE_SETTLEMENT_PROFILES[id]||null}
function bluestoneLocalLifeHTML(id){const p=bluestoneProfile(id);if(!p)return'';return SOSText("world_road_travel.bluestoneLocalLifeHTML.001",esc(p.identity),esc(p.culture),esc(p.infrastructure),esc(p.survival),esc(p.authority),p.concerns.map(x=>`<span>• ${esc(x)}</span>`).join(''))}


const REDSTONE_SETTLEMENT_PROFILES={
 sengia:{identity:SOSText("world_road_travel.bluestoneLocalLifeHTML.002"),culture:SOSText("world_road_travel.bluestoneLocalLifeHTML.003"),infrastructure:SOSText("world_road_travel.bluestoneLocalLifeHTML.004"),survival:SOSText("world_road_travel.bluestoneLocalLifeHTML.005"),authority:SOSText("world_road_travel.bluestoneLocalLifeHTML.006"),concerns:[SOSText("world_road_travel.bluestoneLocalLifeHTML.007"),SOSText("world_road_travel.bluestoneLocalLifeHTML.008"),SOSText("world_road_travel.bluestoneLocalLifeHTML.009"),SOSText("world_road_travel.bluestoneLocalLifeHTML.010")]},
 lockwood:{identity:SOSText("world_road_travel.bluestoneLocalLifeHTML.011"),culture:SOSText("world_road_travel.bluestoneLocalLifeHTML.012"),infrastructure:SOSText("world_road_travel.bluestoneLocalLifeHTML.013"),survival:SOSText("world_road_travel.bluestoneLocalLifeHTML.014"),authority:SOSText("world_road_travel.bluestoneLocalLifeHTML.015"),concerns:[SOSText("world_road_travel.bluestoneLocalLifeHTML.016"),SOSText("world_road_travel.bluestoneLocalLifeHTML.017"),SOSText("world_road_travel.bluestoneLocalLifeHTML.018"),SOSText("world_road_travel.bluestoneLocalLifeHTML.019")]},
 grayhaven:{identity:SOSText("world_road_travel.bluestoneLocalLifeHTML.020"),culture:SOSText("world_road_travel.bluestoneLocalLifeHTML.021"),infrastructure:SOSText("world_road_travel.bluestoneLocalLifeHTML.022"),survival:SOSText("world_road_travel.bluestoneLocalLifeHTML.023"),authority:SOSText("world_road_travel.bluestoneLocalLifeHTML.024"),concerns:[SOSText("world_road_travel.bluestoneLocalLifeHTML.025"),SOSText("world_road_travel.bluestoneLocalLifeHTML.026"),SOSText("world_road_travel.bluestoneLocalLifeHTML.027"),SOSText("world_road_travel.bluestoneLocalLifeHTML.028")]},
 briarlake:{identity:SOSText("world_road_travel.bluestoneLocalLifeHTML.029"),culture:SOSText("world_road_travel.bluestoneLocalLifeHTML.030"),infrastructure:SOSText("world_road_travel.bluestoneLocalLifeHTML.031"),survival:SOSText("world_road_travel.bluestoneLocalLifeHTML.032"),authority:SOSText("world_road_travel.bluestoneLocalLifeHTML.033"),concerns:[SOSText("world_road_travel.bluestoneLocalLifeHTML.034"),SOSText("world_road_travel.bluestoneLocalLifeHTML.035"),SOSText("world_road_travel.bluestoneLocalLifeHTML.036"),SOSText("world_road_travel.bluestoneLocalLifeHTML.037")]},
 glenbrook:{identity:SOSText("world_road_travel.bluestoneLocalLifeHTML.038"),culture:SOSText("world_road_travel.bluestoneLocalLifeHTML.039"),infrastructure:SOSText("world_road_travel.bluestoneLocalLifeHTML.040"),survival:SOSText("world_road_travel.bluestoneLocalLifeHTML.041"),authority:SOSText("world_road_travel.bluestoneLocalLifeHTML.042"),concerns:[SOSText("world_road_travel.bluestoneLocalLifeHTML.043"),SOSText("world_road_travel.bluestoneLocalLifeHTML.044"),SOSText("world_road_travel.bluestoneLocalLifeHTML.045"),SOSText("world_road_travel.bluestoneLocalLifeHTML.046")]},
 tyrdon:{identity:SOSText("world_road_travel.bluestoneLocalLifeHTML.047"),culture:SOSText("world_road_travel.bluestoneLocalLifeHTML.048"),infrastructure:SOSText("world_road_travel.bluestoneLocalLifeHTML.049"),survival:SOSText("world_road_travel.bluestoneLocalLifeHTML.050"),authority:SOSText("world_road_travel.bluestoneLocalLifeHTML.051"),concerns:[SOSText("world_road_travel.bluestoneLocalLifeHTML.052"),SOSText("world_road_travel.bluestoneLocalLifeHTML.053"),SOSText("world_road_travel.bluestoneLocalLifeHTML.054"),SOSText("world_road_travel.bluestoneLocalLifeHTML.055")]},
 pyreglade:{identity:SOSText("world_road_travel.bluestoneLocalLifeHTML.056"),culture:SOSText("world_road_travel.bluestoneLocalLifeHTML.057"),infrastructure:SOSText("world_road_travel.bluestoneLocalLifeHTML.058"),survival:SOSText("world_road_travel.bluestoneLocalLifeHTML.059"),authority:SOSText("world_road_travel.bluestoneLocalLifeHTML.060"),concerns:[SOSText("world_road_travel.bluestoneLocalLifeHTML.061"),SOSText("world_road_travel.bluestoneLocalLifeHTML.062"),SOSText("world_road_travel.bluestoneLocalLifeHTML.063"),SOSText("world_road_travel.bluestoneLocalLifeHTML.064")]}
};
function redstoneProfile(id){return REDSTONE_SETTLEMENT_PROFILES[id]||null}
function redstoneLocalLifeHTML(id){
 const p=redstoneProfile(id);if(!p)return'';
 return SOSText("world_road_travel.redstoneLocalLifeHTML.001",esc(p.identity),esc(p.culture),esc(p.infrastructure),esc(p.survival),esc(p.authority),p.concerns.map(x=>`<span>• ${esc(x)}</span>`).join(''))
}
function regionalLocalLifeHTML(id){return bluestoneLocalLifeHTML(id)||redstoneLocalLifeHTML(id)}

const REDSTONE_CIVIC_DEFS={
 sengia:{name:SOSText("world_road_travel.regionalLocalLifeHTML.001"),summary:SOSText("world_road_travel.regionalLocalLifeHTML.002"),institutions:[SOSText("world_road_travel.regionalLocalLifeHTML.003"),SOSText("world_road_travel.regionalLocalLifeHTML.004"),SOSText("world_road_travel.regionalLocalLifeHTML.005"),SOSText("world_road_travel.regionalLocalLifeHTML.006"),SOSText("world_road_travel.regionalLocalLifeHTML.007"),SOSText("world_road_travel.regionalLocalLifeHTML.008")],districts:[
  {id:'oldmarket',name:SOSText("world_road_travel.regionalLocalLifeHTML.009"),text:SOSText("world_road_travel.regionalLocalLifeHTML.010"),activity:SOSText("world_road_travel.regionalLocalLifeHTML.011")},
  {id:'warehouse',name:SOSText("world_road_travel.regionalLocalLifeHTML.012"),text:SOSText("world_road_travel.regionalLocalLifeHTML.013"),activity:SOSText("world_road_travel.regionalLocalLifeHTML.014")},
  {id:'civic',name:SOSText("world_road_travel.regionalLocalLifeHTML.015"),text:SOSText("world_road_travel.regionalLocalLifeHTML.016"),activity:SOSText("world_road_travel.regionalLocalLifeHTML.017")},
  {id:'garrison',name:SOSText("world_road_travel.regionalLocalLifeHTML.018"),text:SOSText("world_road_travel.regionalLocalLifeHTML.019"),activity:SOSText("world_road_travel.regionalLocalLifeHTML.020")}
 ]},
 lockwood:{name:SOSText("world_road_travel.regionalLocalLifeHTML.021"),summary:SOSText("world_road_travel.regionalLocalLifeHTML.022"),institutions:[SOSText("world_road_travel.regionalLocalLifeHTML.023"),SOSText("world_road_travel.regionalLocalLifeHTML.024"),SOSText("world_road_travel.regionalLocalLifeHTML.025"),SOSText("world_road_travel.regionalLocalLifeHTML.026"),SOSText("world_road_travel.regionalLocalLifeHTML.027")]},
 grayhaven:{name:SOSText("world_road_travel.regionalLocalLifeHTML.028"),summary:SOSText("world_road_travel.regionalLocalLifeHTML.029"),institutions:[SOSText("world_road_travel.regionalLocalLifeHTML.030"),SOSText("world_road_travel.regionalLocalLifeHTML.031"),SOSText("world_road_travel.regionalLocalLifeHTML.032"),SOSText("world_road_travel.regionalLocalLifeHTML.033")]},
 briarlake:{name:SOSText("world_road_travel.regionalLocalLifeHTML.034"),summary:SOSText("world_road_travel.regionalLocalLifeHTML.035"),institutions:[SOSText("world_road_travel.regionalLocalLifeHTML.036"),SOSText("world_road_travel.regionalLocalLifeHTML.037"),SOSText("world_road_travel.regionalLocalLifeHTML.038"),SOSText("world_road_travel.regionalLocalLifeHTML.039"),SOSText("world_road_travel.regionalLocalLifeHTML.040")]},
 glenbrook:{name:SOSText("world_road_travel.regionalLocalLifeHTML.041"),summary:SOSText("world_road_travel.regionalLocalLifeHTML.042"),institutions:[SOSText("world_road_travel.regionalLocalLifeHTML.043"),SOSText("world_road_travel.regionalLocalLifeHTML.044"),SOSText("world_road_travel.regionalLocalLifeHTML.045"),SOSText("world_road_travel.regionalLocalLifeHTML.046"),SOSText("world_road_travel.regionalLocalLifeHTML.047")]},
 tyrdon:{name:SOSText("world_road_travel.regionalLocalLifeHTML.048"),summary:SOSText("world_road_travel.regionalLocalLifeHTML.049"),institutions:[SOSText("world_road_travel.regionalLocalLifeHTML.050"),SOSText("world_road_travel.regionalLocalLifeHTML.051"),SOSText("world_road_travel.regionalLocalLifeHTML.052"),SOSText("world_road_travel.regionalLocalLifeHTML.053"),SOSText("world_road_travel.regionalLocalLifeHTML.054")]},
 pyreglade:{name:SOSText("world_road_travel.regionalLocalLifeHTML.055"),summary:SOSText("world_road_travel.regionalLocalLifeHTML.056"),institutions:[SOSText("world_road_travel.regionalLocalLifeHTML.057"),SOSText("world_road_travel.regionalLocalLifeHTML.058"),SOSText("world_road_travel.regionalLocalLifeHTML.059"),SOSText("world_road_travel.regionalLocalLifeHTML.060"),SOSText("world_road_travel.regionalLocalLifeHTML.061")]}
};


const SENGIA_ECONOMY_DEFAULTS={seasonLength:10,settlements:{
 sengia:{food:44,seed:12,materials:38,recovery:48,demand:78,production:8,label:SOSText("world_road_travel.regionalLocalLifeHTML.062")},
 lockwood:{food:50,seed:16,materials:56,recovery:54,demand:45,production:18,label:SOSText("world_road_travel.regionalLocalLifeHTML.063")},
 grayhaven:{food:46,seed:14,materials:44,recovery:51,demand:48,production:13,label:SOSText("world_road_travel.regionalLocalLifeHTML.064")},
 briarlake:{food:72,seed:34,materials:32,recovery:58,demand:36,production:34,label:SOSText("world_road_travel.regionalLocalLifeHTML.065")},
 glenbrook:{food:55,seed:20,materials:46,recovery:49,demand:42,production:19,label:SOSText("world_road_travel.regionalLocalLifeHTML.066")},
 tyrdon:{food:48,seed:17,materials:39,recovery:47,demand:47,production:15,label:SOSText("world_road_travel.regionalLocalLifeHTML.067")},
 pyreglade:{food:42,seed:11,materials:64,recovery:52,demand:51,production:10,label:SOSText("world_road_travel.regionalLocalLifeHTML.068")}}};
