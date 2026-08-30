function showWorldMapFilters(){modalRouteEnter(SOSText("openworld_ui_map_actions.showWorldMapFilters.001"),Array.from(arguments));
 ensureWorldState();const f=state.world.mapFilters;
 overlay(SOSText("openworld_ui_map_actions.showWorldMapFilters.002",f.hostile?'checked':'',f.friendly?'checked':'',f.neutral?'checked':'',f.companions?'checked':''));
 $('#filterDone').onclick=()=>{f.hostile=$('#filterHostile').checked;f.friendly=$('#filterFriendly').checked;f.neutral=$('#filterNeutral').checked;f.companions=$('#filterCompanions').checked;save();closeOverlay();renderOpenWorld()}
}
function worldLocationIcon(loc){return loc.type==='town'?'♜':loc.type==='settlement'?'⌂':loc.type==='fort'?'♜':loc.type==='camp'?'▲':loc.type==='ruins'?'✦':loc.type==='hidden'?(loc.minor?'·':'✧'):'◆'}
function worldPartySymbol(p,d){if(d==='hostile')return '⚔';if(p.kind==='merchant')return '▣';if(p.kind==='refugees')return '●';if(p.kind==='coalition'||p.kind==='redstone')return '⚑';return '◆'}
function worldMapLegendHTML(){return SOSText("openworld_ui_map_actions.worldMapLegendHTML.001")}
const REGION_MAP_ROAD_SEGMENTS={
 shantium:[
  ['shantium','northgate'],['shantium','river'],['river','woods'],['woods','marsh'],
  ['shantium','southroad'],['southroad','stonebridge'],['southroad','marsh'],
  ['shantium','watchfort'],['watchfort','stonebridge'],['watchfort','redoubt'],
  ['northgate','redoubt'],['northgate','quarry'],['quarry','redoubt'],['shantium','quarry']
 ],
 bluestone:[
  ['lowcreek','zion'],['zion','winterstone'],['zion','ebonheart'],['ebonheart','lowcreek'],
  ['norwegian','westspawnroad'],['ziongorge','skybreak'],['zion','crownpass'],
  ['ziongorge','snowcut'],['ebonheart','goatshrine']
 ],
 redstone:[
  ['lockwood','sengia'],['lockwood','lockwoodforest'],['lockwood','briarlake'],
  ['grainpass','briarlake'],['briarlake','sengia'],['glenbrook','tyrdon'],
  ['glenbrook','lockwood'],['sengia','pyreglade'],['tyrdon','pyreglade']
 ]
};
function mapRoadStatusClass(a,b){
 const status=routeEvidence(a,b)?.status||'open';
 return status==='dangerous'?'route-dangerous':status==='risky'?'route-risky':'route-open'
}
function applyRegionRoadStatusClasses(html,region){
 const pairs=REGION_MAP_ROAD_SEGMENTS[region]||[];let i=0;
 return String(html).replace(/<g(?: class="([^"]*)")?>/g,(full,existing)=>{
  const pair=pairs[i++];if(!pair)return full;
  const cls=[existing||'',mapRoadStatusClass(pair[0],pair[1])].filter(Boolean).join(' ').trim();
  return `<g class="${cls}">`
 })
}
function regionTerrainHTML(region){
 const farNorth=`<div class="map-paper-grain"></div><div class="map-region-name" style="left:38%;top:4%">AZERDON REACH</div><div class="map-region-name" style="left:6%;top:31%">WESTERN SNOWFIELDS</div><div class="map-region-name" style="right:5%;top:31%">WHITE SCAR</div><div class="map-region-name" style="left:32%;bottom:5%">EXIUM GATE</div><svg class="far-road-network" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g><path class="road-shadow" d="M46 88 L55 43 L55 8 M55 43 L29 42 L10 42 M29 42 L39 24 M55 43 L82 43 L75 63 L59 72 L46 88 M55 43 L75 63 M46 88 L34 66 L55 43 M34 66 L10 42"/><path class="road-line" d="M46 88 L55 43 L55 8 M55 43 L29 42 L10 42 M29 42 L39 24 M55 43 L82 43 L75 63 L59 72 L46 88 M55 43 L75 63 M46 88 L34 66 L55 43 M34 66 L10 42"/><path class="road-highlight" d="M46 88 L55 43 L55 8 M55 43 L29 42 L10 42 M55 43 L82 43 L75 63 L59 72 L46 88 M46 88 L34 66 L55 43"/></g></svg><div class="far-ridge far-ridge-a">▲ ▲ ▲ ▲<br> ▲ ▲ ▲</div><div class="far-ridge far-ridge-b">▲ ▲ ▲<br>▲ ▲ ▲ ▲</div><div class="far-ridge far-ridge-c">▲ ▲ ▲ ▲ ▲</div><div class="far-icefield far-ice-a">❄ · ❄ · ❄</div><div class="far-icefield far-ice-b">❄ · ❄ · ❄</div><div class="map-compass"><b>N</b><span>✥</span></div>`;
 const raw=region==='farnorth'?farNorth:region==='bluestone'?SOSText("openworld_ui_map_actions.regionTerrainHTML.001"):region==='redstone'?SOSText("openworld_ui_map_actions.regionTerrainHTML.002"):SOSText("openworld_ui_map_actions.regionTerrainHTML.003");
 return applyRegionRoadStatusClasses(raw,region)
}
function arrangeTransientMapPosition(region,key,base,used){
 let x=clamp(base.x,2,98),y=clamp(base.y,2,98);const fixed=locationsInRegion(region).filter(l=>state.world.discovered.includes(l.id));const collides=()=>fixed.some(l=>Math.hypot(x-l.x,y-l.y)<5.5)||used.some(u=>Math.hypot(x-u.x,y-u.y)<3.2);
 if(collides()){const seed=[...String(key)].reduce((n,c)=>n+c.charCodeAt(0),0);for(let i=0;i<12;i++){const a=((seed+i*47)%360)*Math.PI/180,r=3.5+Math.floor(i/4)*2;x=clamp(base.x+Math.cos(a)*r,2,98);y=clamp(base.y+Math.sin(a)*r,2,98);if(!collides())break}}
 used.push({x,y,key});return{x,y}
}
function openWorldMapHTML(){
 ensureWorldState();const region=currentWorldRegion(),rd=regionDef(region),here=state.world.location,eq=activeEscortQuest(),tp=trackedWorldParty(),tq=state.world.quests.find(q=>q.id===state.world.trackedQuestId&&['active','ready'].includes(q.status)),used=[];
 let html=`<div class="world-map-frame region-map-${region}"><div class="world-map-title"><b>${esc(rd.mapTitle)}</b><span>${esc(rd.subtitle)}</span></div><div class="world-map-viewport" id="worldMapViewport"><div class="world-map-canvas" id="worldMapCanvas">${regionTerrainHTML(region)}`;
 for(const loc of locationsInRegion(region)){if(!state.world.discovered.includes(loc.id)||(loc.hidden&&hiddenSiteRetired(loc.id)))continue;const days=worldTravelDays(here,loc.id),current=loc.id===here&&!eq&&!playerPartyInField(),reentry=loc.id===here&&playerPartyInField()&&isTownLikeLocation(loc),contract=tq&&(tq.target===loc.id||tq.origin===loc.id),road=!current?roadConditionProfile(here,loc.id):null,cross=regionConnectionAt(loc.id);html+=`<button class="world-location ${current?'current':''} ${contract?'contract-location':''} ${cross?'regional-crossing-location':''} ${road?`route-${road.status}`:''} world-type-${loc.type} terrain-${loc.terrain||'normal'}" data-worldloc="${loc.id}" style="left:${loc.x}%;top:${loc.y}%" title="${esc(loc.desc)}${cross?` Regional crossing via ${esc(cross.name)}.`:''}"><i class="world-loc-icon">${worldLocationIcon(loc)}</i><b>${esc(loc.name)}</b>${current?'<span class="map-you-here">YOU ARE HERE</span>':reentry?'<span class="map-you-here">RE-ENTER</span>':`<span>${days}d • ${road.status}</span>`}${cross?`<em class="regional-crossing-tag">REGION GATE</em>`:''}${contract?'<em class="contract-pin">!</em>':''}${politicalMapTag(loc.id)}</button>`}
 for(const c of Object.values(state.world.companions)){if(state.allies.includes(c.id)||!c.known||!state.world.mapFilters.companions||locationRegion(c.location)!==region)continue;const loc=worldLocation(c.location),a=allyDef(c.id),pp=arrangeTransientMapPosition(region,'comp_'+c.id,{x:loc.x+7,y:loc.y-6},used);html+=`<div class="companion-rumor-pin" style="left:${pp.x}%;top:${pp.y}%" title="${esc(a.name)} last reported here">?</div>`}
 // v1.6.23: Party maintenance is simulation work, not rendering work. renderOpenWorld() already schedules it once per game day after paint.
 // Live battles are placed first so they retain the best nearby clickable position.
 for(const c of activeLiveRegionalConflicts()){if(c.region!==region)continue;const base=liveConflictPosition(c),a=state.world.parties.find(p=>p.id===c.aId),b=state.world.parties.find(p=>p.id===c.bId);if(!a||!b)continue;const pos=arrangeTransientMapPosition(region,'battle_'+c.id,base,used);html+=`<button class="live-conflict-marker" data-liveconflict="${c.id}" style="left:${pos.x}%;top:${pos.y}%" title="Battle underway near ${esc(worldLocation(c.locId).name)}: ${esc(a.name)} vs ${esc(b.name)}">⚔</button>`}
 for(const p of state.world.parties){repairWorldPartyMapRoute(p);if(worldPartyDisplayRegion(p)!==region)continue;const base=worldPartyPosition(p),d=worldPartyDisposition(p);if(!p.contractProtected&&p.id!==state.world.trackedPartyId&&((d==='hostile'&&!state.world.mapFilters.hostile)||(d==='friendly'&&!state.world.mapFilters.friendly)||(!['hostile','friendly'].includes(d)&&!state.world.mapFilters.neutral)))continue;const pos=arrangeTransientMapPosition(region,'party_'+p.id,base,used),dest=worldLocation(worldPartySafeLocationId(p.destination,p.location));html+=`<button class="world-party ${d} party-${p.kind} ${p.northernArchetype?'northern-warband':''} ${state.world.trackedPartyId===p.id?'tracked-party':''} ${p.contractProtected?'escort-caravan':''}" data-worldparty="${p.id}" style="left:${pos.x}%;top:${pos.y}%" title="${esc(p.name)} — ${esc(p.faction||'Unaffiliated')} — toward ${esc(dest.name)}"><span>${worldPartySymbol(p,d)}</span></button>`}
 const playerPos=playerPartyMapPosition();if(playerPartyInField()&&playerPartyFieldState().region===region){html+=`<div class="player-party-marker" style="left:${playerPos.x}%;top:${playerPos.y}%" title="Player Party — Guardian and active companions"><span>G</span></div>`}
 if(tp&&worldPartyDisplayRegion(tp)===region){repairWorldPartyMapRoute(tp);const pp=worldPartyPosition(tp),dest=worldLocation(worldPartySafeLocationId(tp.destination,tp.location));html+=`<svg class="tracking-route" viewBox="0 0 920 700" preserveAspectRatio="none"><line x1="${pp.x*9.2}" y1="${pp.y*7}" x2="${dest.x*9.2}" y2="${dest.y*7}"/></svg>`}
 const regionalParties=state.world.parties.filter(p=>locationRegion(p.location)===region).length;html+=SOSText("openworld_ui_map_actions.openWorldMapHTML.001",state.world.day,eq?`ESCORT → ${esc(contractTargetName(eq))}`:esc(worldLocation(here).name),regionalParties,esc(rd.name),worldMapLegendHTML());return html
}
function ensureMapView(region=currentWorldRegion()){
 ensureWorldState();if(!state.world.mapViews)state.world.mapViews={};if(!state.world.mapViews[region])state.world.mapViews[region]={x:0,y:0,lastLocation:null};state.world.mapView=state.world.mapViews[region];return state.world.mapViews[region]
}
function worldMapDimensions(){return {w:920,h:700}}
function worldMapViewportSize(){
 const vp=document.getElementById(SOSText("openworld_ui_map_actions.worldMapViewportSize.001"));return {w:vp?.clientWidth||Math.min(window.innerWidth-24,680),h:vp?.clientHeight||500}
}
function clampWorldMapView(x,y){
 const map=worldMapDimensions(),vp=worldMapViewportSize();
 return {x:clamp(x,0,Math.max(0,map.w-vp.w)),y:clamp(y,0,Math.max(0,map.h-vp.h))}
}
function applyWorldMapView(saveIt=false){
 const canvas=document.getElementById(SOSText("openworld_ui_map_actions.applyWorldMapView.001"));if(!canvas)return;const v=ensureMapView(),c=clampWorldMapView(v.x,v.y);v.x=c.x;v.y=c.y;canvas.style.transform=SOSText("openworld_ui_map_actions.applyWorldMapView.002",-Math.round(v.x),-Math.round(v.y));if(saveIt)save()
}
function centerWorldMapOnLocation(locId=state.world.location,saveIt=false){
 const loc=worldLocation(locId),map=worldMapDimensions(),vp=worldMapViewportSize(),v=ensureMapView();
 const target=clampWorldMapView(map.w*(loc.x/100)-vp.w/2,map.h*(loc.y/100)-vp.h/2);v.x=target.x;v.y=target.y;v.lastLocation=locId;applyWorldMapView(saveIt)
}
function panWorldMap(dx,dy){
 const v=ensureMapView(),c=clampWorldMapView(v.x+dx,v.y+dy);v.x=c.x;v.y=c.y;applyWorldMapView(false)
}
function wireWorldMapPan(){
 const vp=document.getElementById(SOSText("openworld_ui_map_actions.wireWorldMapPan.001"));if(!vp)return;const v=ensureMapView();
 const mobile=window.matchMedia?window.matchMedia(SOSText("openworld_ui_map_actions.wireWorldMapPan.002")).matches:window.innerWidth<=980;
 requestAnimationFrame(()=>{if(v.lastLocation!==state.world.location)centerWorldMapOnLocation(state.world.location,false);else applyWorldMapView(false)});
 let mouseDragging=false,startX=0,startY=0,baseX=0,baseY=0,moved=false;
 if(!mobile){
  vp.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.target.closest('button'))return;mouseDragging=true;moved=false;startX=e.clientX;startY=e.clientY;baseX=v.x;baseY=v.y;vp.setPointerCapture?.(e.pointerId)});
  vp.addEventListener('pointermove',e=>{if(!mouseDragging)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)+Math.abs(dy)>5)moved=true;if(moved)e.preventDefault?.();const c=clampWorldMapView(baseX-dx,baseY-dy);v.x=c.x;v.y=c.y;applyWorldMapView(false)});
  const finish=e=>{if(!mouseDragging)return;mouseDragging=false;vp.releasePointerCapture?.(e.pointerId);if(moved)save();moved=false};vp.addEventListener('pointerup',finish);vp.addEventListener('pointercancel',finish);
 }
 let twoFinger=false,touchBaseX=0,touchBaseY=0,touchStartMidX=0,touchStartMidY=0;
 const midpoint=touches=>({x:(touches[0].clientX+touches[1].clientX)/2,y:(touches[0].clientY+touches[1].clientY)/2});
 vp.addEventListener('touchstart',e=>{if(e.touches.length===2){const m=midpoint(e.touches);twoFinger=true;touchStartMidX=m.x;touchStartMidY=m.y;touchBaseX=v.x;touchBaseY=v.y;e.preventDefault()}},{passive:false});
 vp.addEventListener('touchmove',e=>{if(e.touches.length===2){if(!twoFinger){const m=midpoint(e.touches);twoFinger=true;touchStartMidX=m.x;touchStartMidY=m.y;touchBaseX=v.x;touchBaseY=v.y}const m=midpoint(e.touches),c=clampWorldMapView(touchBaseX-(m.x-touchStartMidX),touchBaseY-(m.y-touchStartMidY));v.x=c.x;v.y=c.y;applyWorldMapView(false);e.preventDefault()}},{passive:false});
 const finishTouch=e=>{if(twoFinger&&e.touches.length<2){twoFinger=false;save()}};vp.addEventListener('touchend',finishTouch,{passive:true});vp.addEventListener('touchcancel',finishTouch,{passive:true});
}
function primaryLiveBattleAlert(){const b=findRegionalBattleNearPlayer();if(b)return b;const rows=activeLiveRegionalConflicts().filter(c=>c.region===currentWorldRegion()).map(c=>{const a=state.world.parties.find(p=>p.id===c.aId),bb=state.world.parties.find(p=>p.id===c.bId);return a&&bb?[a,bb,c]:null}).filter(Boolean);return rows[0]||null}
function liveBattleAlertHTML(){const b=primaryLiveBattleAlert();if(!b)return'';const [a,bb,c]=b;if(c.guardianIgnored)return'';const loc=worldLocation(c.locId),days=worldTravelDays(state.world.location,c.locId),committed=c.guardianCommitted?'<br><small>Guardian intervention route committed.</small>':'',tracked=c.guardianTracked?'<br><small>Tracking this incident.</small>':'',dispute=c.kind==='guardian_caravan_dispute'&&!c.escalated;if(dispute){const pair=guardianCaravanDisputeParties(c),messenger=c.messengerOrder&&!c.messengerOrder.resolved?SOSText("openworld_ui_map_actions.liveBattleAlertHTML.003",c.messengerOrder.dueDay):'';return SOSText("openworld_ui_map_actions.liveBattleAlertHTML.001",esc(pair?.patrol.name||a.name),esc(pair?.caravan.name||bb.name),esc(loc.name),days,days===1?'':'s',c.expiresDay,committed,tracked,messenger,c.messengerOrder&&!c.messengerOrder.resolved?'disabled':'',c.guardianTracked?'disabled':'',c.guardianTracked?'Tracking ✓':'Track Incident')}return SOSText("openworld_ui_map_actions.liveBattleAlertHTML.002",esc(`${a.name} (${a.faction||'Unaffiliated'})`),esc(`${bb.name} (${bb.faction||'Unaffiliated'})`),esc(loc.name),days,days===1?'':'s',c.expiresDay,committed,tracked,c.guardianTracked?'disabled':'',c.guardianTracked?'Tracking ✓':'Track Battle')}
function openWorldPlayerActionsHTML(){
 const atHall=typeof canAccessGuardianHall==='function'?canAccessGuardianHall():(state.world?.location==='shantium'&&!playerPartyInField()),loc=worldLocation(state.world.location),inSettlement=typeof playerPartyInsideSettlement==='function'?playerPartyInsideSettlement(loc.id):!!state.world.settlements?.[loc.id]&&!playerPartyInField(),held=partyPrisonerCount(),fieldProc=homeFieldProcurementsHere(),innBase=loc.id==='southroad'?14:loc.id==='redoubt'?28:20,innCost=inSettlement&&!atHall?settlementServicePrice(loc.id,innBase):0;
 return SOSText("openworld_ui_map_actions.openWorldPlayerActionsHTML.001",held?` (${held})`:'',held?`${held} held • questioning, release & disposition`:'No prisoners currently held',inSettlement&&!atHall?SOSText("openworld_ui_map_actions.openWorldPlayerActionsHTML.002",innCost):'',fieldProc.length?`<button id="worldHallProcurement"><b>Hall Procurement (${fieldProc.length})</b><small>Complete a Guardian Hall sourcing request here in ${esc(loc.name)}</small></button>`:'',!inSettlement?'<button id="worldCamping"><b>Camping</b><small>Make camp, rest & camp life</small></button>':'',atHall?'<button id="worldHomeBase"><b>Guardian Hall</b><small>Permanent company home base</small></button><button id="worldHomePrepare"><b>Prepare Company</b><small>Guardian Hall preparation</small></button><button id="worldHomeRest"><b>Rest at Guardian Hall</b><small>Spend a full day recovering at home</small></button>':'')
}
function confirmSettlementTavernRest(){
 const loc=worldLocation(state.world.location),inSettlement=typeof playerPartyInsideSettlement==='function'?playerPartyInsideSettlement(loc.id):!!state.world.settlements?.[loc.id]&&!playerPartyInField();if(!inSettlement||loc.id==='shantium')return renderOpenWorld();
 const innBase=loc.id==='southroad'?14:loc.id==='redoubt'?28:20,cost=settlementServicePrice(loc.id,innBase);
 overlay(SOSText("openworld_ui_map_actions.confirmSettlementTavernRest.001",esc(loc.name),cost,state.gold<cost?'disabled':''),true);
 $('#confirmTavernRest').onclick=()=>settlementInnRest(loc.id,cost);$('#cancelTavernRest').onclick=closeOverlay
}
function showOpenWorldTravelMenu(){modalRouteEnter(SOSText("openworld_ui_map_actions.showOpenWorldTravelMenu.001"),Array.from(arguments));
 const loc=worldLocation(state.world.location);
 overlay(SOSText("openworld_ui_map_actions.showOpenWorldTravelMenu.002",esc(loc.name),esc(regionalTravelSummary()||'Find routes to other regions'),''),true);
 $('#worldArea').onclick=showWorldArea;$('#worldRegionalTravelHub').onclick=showRegionalTravelHub;$('#worldMapFilters').onclick=showWorldMapFilters;wireClose()
}
function showOpenWorldCampingMenu(){modalRouteEnter(SOSText("openworld_ui_map_actions.showOpenWorldCampingMenu.001"),Array.from(arguments));
 const loc=worldLocation(state.world.location);if(typeof playerPartyInsideSettlement==='function'?playerPartyInsideSettlement(loc.id):(state.world.settlements?.[loc.id]&&!playerPartyInField()))return actionResult(SOSText("openworld_ui_map_actions.showOpenWorldCampingMenu.002"),SOSText("openworld_ui_map_actions.showOpenWorldCampingMenu.003",loc.name),'info',renderOpenWorld);
 overlay(SOSText("openworld_ui_map_actions.showOpenWorldCampingMenu.004",esc(loc.name)),true);
 $('#campMake').onclick=()=>typeof showCampingWildernessMenu==='function'?showCampingWildernessMenu():makeRoadCamp();$('#campLife').onclick=showRoadLife;wireClose()
}
function worldLifeActivitySummary(){
 repairWorldLifeState();const activeEvents=Object.values(state.world.socialLife.events).filter(e=>e.status==='active'&&e.expiresDay>=state.world.day).length,chains=state.world.socialChains.chains.filter(c=>c.status==='active').length,requests=companionSocialRequests().length,messengers=state.world.relationshipContracts.messengers.filter(m=>m.status==='traveling').length,moves=state.world.populationMovement.history.filter(x=>state.world.day-x.day<=7).length;return {activeEvents,chains,requests,messengers,moves,total:activeEvents+chains+requests+messengers}
}
function showOpenWorldWorldLifeMenu(){modalRouteEnter(SOSText("openworld_ui_map_actions.showOpenWorldWorldLifeMenu.001"),Array.from(arguments));
 const a=worldLifeActivitySummary(),localFaction=factionSocialInfluenceSummary(state.world.location).length;
 overlay(SOSText("openworld_ui_map_actions.showOpenWorldWorldLifeMenu.002",a.activeEvents,a.activeEvents===1?'':'s',a.chains,a.chains===1?'':'s',a.requests,a.requests===1?'':'s',a.messengers,a.messengers===1?'':'s',localFaction,localFaction===1?'':'s'),true);
 $('#worldLifeContacts').onclick=showRoadContactLedger;$('#worldLifeSocial').onclick=showSocialLifeJournal;$('#worldLifePopulation').onclick=showPopulationMovementJournal;$('#worldLifeWork').onclick=showRelationshipContractJournal;$('#worldLifeFactionPeople').onclick=()=>showFactionSocialNetwork(state.world.location);wireClose()
}
function showOpenWorldRecordsMenu(){modalRouteEnter(SOSText("openworld_ui_map_actions.showOpenWorldRecordsMenu.001"),Array.from(arguments));
 overlay(SOSText("openworld_ui_map_actions.showOpenWorldRecordsMenu.002",state.world.quests.filter(q=>q.status==='ready').length,state.world.quests.filter(q=>q.status==='active').length,activeRegionalStories().length,completedRegionalStories().length),true);
 $('#worldContractsJournal').onclick=showContractsJournal;$('#worldRegionalStories').onclick=showRegionalStoryJournal;$('#worldJournal').onclick=showWorldJournal;wireClose()
}
function regionalPoliticsAtGlanceHTML(){
 const region=currentWorldRegion(),locs=regionalSettlements(region),controls={},contested=[];for(const l of locs){const s=politicalStatus(l.id),control=s.control||'Independent';controls[control]=(controls[control]||0)+1;if(s.contested)contested.push(l.name)}
 const total=Math.max(1,locs.length),bars=Object.entries(controls).sort((a,b)=>b[1]-a[1]).map(([f,n])=>`<div class="region-politics-glance-row"><span>${esc(OPEN_WORLD_FACTIONS[f]?majorFaction(f).short:f)}</span><div class="region-politics-glance-bar"><i style="width:${Math.round(n/total*100)}%"></i></div><b>${n}</b></div>`).join('');
 const treaties=Object.values(state.world.politics?.treaties||{}).filter(t=>t.status==='active'&&t.expiresDay>=state.world.day).length;
 return SOSText("openworld_ui_map_actions.regionalPoliticsAtGlanceHTML.001",esc(regionDef(region).name),bars,contested.length,contested.length?` • ${esc(contested.slice(0,3).join(', '))}`:'',treaties)
}
function showRegionalIntelligence(){
 modalRouteEnter(SOSText("openworld_ui_map_actions.showRegionalIntelligence.001"),Array.from(arguments));const region=currentWorldRegion(),rows=activeWorldIntel({region}),day=state.world.day;
 overlay(SOSText("openworld_ui_map_actions.showRegionalIntelligence.002",state.scouting||0,esc(regionDef(region).name),rows.length,rows.map(i=>{const rel=worldIntelReliability(i),age=Math.max(0,day-i.createdDay),source=i.source||SOSText("openworld_ui_map_actions.showRegionalIntelligence.003"),loc=i.location&&worldLocation(i.location)?worldLocation(i.location).name:SOSText("openworld_ui_map_actions.showRegionalIntelligence.004");return `<div class="card intel-card"><div class="stat-row"><span><b>${esc(i.subject||loc)}</b></span><b>${rel}% confidence</b></div><p>${esc(i.summary||'')}</p><small>${esc(source)} • ${esc(loc)} • ${esc(i.precision||'general')} • ${age===0?'today':`${age} day${age===1?'':'s'} old`}</small></div>`}).join('')||SOSText("openworld_ui_map_actions.showRegionalIntelligence.005")),true);$('.closeModal').onclick=()=>SOSServices.navigation.back(showOpenWorldRegionMenu)
}
function regionalWorldParties(){maintainWorldParties();const region=currentWorldRegion();return state.world.parties.filter(p=>worldPartyDisplayRegion(p)===region).sort((a,b)=>{const ar=canEngageWorldParty(a)?0:1,br=canEngageWorldParty(b)?0:1;if(ar!==br)return ar-br;return worldPartyDistanceToPlayer(a)-worldPartyDistanceToPlayer(b)||String(a.name).localeCompare(String(b.name))})}
function regionalPartyMeetingLabel(p){const r=p.meetingRequest;if(!r)return'';if(r.status==='sent')return ` • messenger due Day ${r.dueDay}`;if(r.status==='accepted')return ` • meeting at ${worldLocation(r.targetId)?.name||r.targetId}`;if(r.status==='waiting')return ` • waiting through Day ${r.waitUntil}`;if(r.status==='declined')return ' • meeting declined';return''}
function regionalPartyCardHTML(p){const d=worldPartyDisposition(p),type=worldPartyTypeLabel(p),faction=p.faction||'Unaffiliated',est=worldPartyTravelEstimate(p),loc=worldLocation(p.location),inReach=canEngageWorldParty(p);return `<button class="regional-party-card disposition-${uiClassToken(d)} faction-${uiClassToken(faction)}" data-regionalparty="${p.id}"><span><b>${esc(p.name)}</b><small>${esc(type)} • ${esc(faction)}</small></span><span class="regional-party-meta">${inReach?'<b>IN RANGE</b>':`<b>${esc(est.label)}</b>`}<small>${esc(loc?.name||'On the road')} • ${esc(d)}${esc(regionalPartyMeetingLabel(p))}</small></span></button>`}
function showRegionalWorldParties(){modalRouteEnter(SOSText("openworld_ui_map_actions.showRegionalWorldParties.001"),Array.from(arguments));const region=currentWorldRegion(),list=regionalWorldParties();overlay(SOSText("openworld_ui_map_actions.showRegionalWorldParties.002",esc(regionDef(region).name),list.length,list.map(regionalPartyCardHTML).join('')||SOSText("openworld_ui_map_actions.showRegionalWorldParties.003")),true);document.querySelectorAll('[data-regionalparty]').forEach(b=>b.onclick=()=>showRegionalPartyActions(b.dataset.regionalparty));$('.closeModal').onclick=()=>SOSServices.navigation.back(showOpenWorldRegionMenu)}
function showRegionalPartyActions(id){modalRouteEnter(SOSText("openworld_ui_map_actions.showRegionalPartyActions.001"),Array.from(arguments));const p=state.world.parties.find(x=>x.id===id);if(!p)return showRegionalWorldParties();const d=worldPartyDisposition(p),inReach=canEngageWorldParty(p),est=worldPartyTravelEstimate(p),req=p.meetingRequest;overlay(SOSText("openworld_ui_map_actions.showRegionalPartyActions.002",esc(p.name),esc(p.faction||'Unaffiliated'),esc(worldPartyTypeLabel(p)),esc(d),esc(est.label),req?`<div class="notice compact"><b>Messenger / meeting:</b>${esc(regionalPartyMeetingLabel(p).replace(/^ • /,''))}</div>`:'',inReach?'':'disabled',inReach?'Already within interaction range.':'Use the existing pursuit system to close with this party.',req&&['sent','accepted','waiting'].includes(req.status)?'disabled':''),true);$('#regionalPartyInteract').onclick=()=>showWorldParty(p.id);$('#regionalPartyIntercept').onclick=()=>{if(inReach)return showWorldParty(p.id);pursueWorldParty(p)};$('#regionalPartyMessenger').onclick=()=>showRegionalPartyMessenger(p.id);$('#regionalPartyBack').onclick=()=>SOSServices.navigation.back(showRegionalWorldParties)}
function showRegionalPartyMessenger(id){modalRouteEnter(SOSText("openworld_ui_map_actions.showRegionalPartyMessenger.001"),Array.from(arguments));const p=state.world.parties.find(x=>x.id===id);if(!p)return showRegionalWorldParties();const region=currentWorldRegion(),cap=regionalCapitalId(region),active=p.meetingRequest&&['sent','accepted','waiting'].includes(p.meetingRequest.status);overlay(SOSText("openworld_ui_map_actions.showRegionalPartyMessenger.002",esc(p.name),esc(worldLocation(state.world.location).name),esc(worldLocation(cap).name),active?'disabled':''),true);$('#partyMeetHere').onclick=()=>sendRegionalPartyMeetingRequest(p,'current',state.world.location);$('#partyMeetCapital').onclick=()=>sendRegionalPartyMeetingRequest(p,'capital',cap);$('#partyMeetHall').onclick=()=>sendRegionalPartyMeetingRequest(p,'hall','shantium');$('#regionalMessengerBack').onclick=()=>SOSServices.navigation.back(()=>showRegionalPartyActions(id))}
function sendRegionalPartyMeetingRequest(p,kind,targetId){if(!p||!state.world.parties.some(x=>x.id===p.id))return showRegionalWorldParties();if(p.meetingRequest&&['sent','accepted','waiting'].includes(p.meetingRequest.status))return actionResult(SOSText("openworld_ui_map_actions.sendRegionalPartyMeetingRequest.001"),SOSText("openworld_ui_map_actions.sendRegionalPartyMeetingRequest.002",p.name),'info',()=>showRegionalPartyActions(p.id));const est=worldPartyTravelEstimate(p),days=Math.max(1,est.days||1),d=createWorldDispatch('party_meeting_request',{origin:state.world.location,destination:p.location,baseDays:days,messageSpeed:.65,title:SOSText("openworld_ui_map_actions.sendRegionalPartyMeetingRequest.003",p.name),sourceRef:'guardian:guardian',targetRef:p.actorRef||`world_party:${p.id}`,payload:{partyId:p.id,meetingKind:kind,targetId}});p.meetingRequest={kind,targetId,status:'sent',sentDay:state.world.day,dueDay:d.dueDay,dispatchId:d.id,waitDays:rnd(2,3)};save();actionResult(SOSText("openworld_ui_map_actions.sendRegionalPartyMeetingRequest.004"),SOSText("openworld_ui_map_actions.sendRegionalPartyMeetingRequest.005",p.name,d.dueDay,worldLocation(targetId).name),'good',()=>showRegionalPartyActions(p.id))}
function showOpenWorldRegionMenu(){modalRouteEnter(SOSText("openworld_ui_map_actions.showOpenWorldRegionMenu.001"),Array.from(arguments));
 const count=activeRegionalOpportunities().filter(o=>locationRegion(o.location)===currentWorldRegion()).length,activeStories=activeRegionalStories().filter(s=>locationRegion(s.location||state.world.location)===currentWorldRegion()).length,intel=activeWorldIntel({region:currentWorldRegion()}).length,parties=regionalWorldParties().length;
 overlay(SOSText("openworld_ui_map_actions.showOpenWorldRegionMenu.002",regionalPoliticsAtGlanceHTML(),count,activeStories,intel,parties),true);
 $('#worldRegionOverview').onclick=showRegionOverview;$('#worldIntel').onclick=showRegionalIntelligence;$('#worldPolitics').onclick=showRegionalPolitics;$('#worldFactions').onclick=showFactionOverview;$('#worldLaw').onclick=showRegionalLaw;$('#worldStories').onclick=showRegionalStoryJournal;$('#worldOpportunities').onclick=showRegionalOpportunities;$('#worldRegionalParties').onclick=showRegionalWorldParties;wireClose()
}
function showOpenWorldExplorationMenu(){modalRouteEnter(SOSText("openworld_ui_map_actions.showOpenWorldExplorationMenu.001"),Array.from(arguments));
 overlay(SOSText("openworld_ui_map_actions.showOpenWorldExplorationMenu.002"),true);
 $('#worldSurvey').onclick=surveyCurrentRegion;$('#worldExplore').onclick=showExplorationJournal;$('#worldArtifacts').onclick=showArtifactCollection;$('#worldEncounters').onclick=showRoadEncounterCatalogue;wireClose()
}
function showOpenWorldCompanionMenu(){modalRouteEnter(SOSText("openworld_ui_map_actions.showOpenWorldCompanionMenu.001"),Array.from(arguments));
 overlay(SOSText("openworld_ui_map_actions.showOpenWorldCompanionMenu.002",roadLifeState().queue.length?` (${roadLifeState().queue.length})`:'',companionSocialRequests().length?` (${companionSocialRequests().length})`:''),true);
 $('#worldRoadLife').onclick=showRoadLife;$('#worldCompanionSocial').onclick=showCompanionSocialConnections;$('#worldCompanionExpeditions').onclick=showCompanionExpeditionJournal;wireClose()
}
function showGuardianQuickInfo(){modalRouteEnter(SOSText("openworld_ui_map_actions.showGuardianQuickInfo.001"),Array.from(arguments));
 const cls=guardianClass(),points=state.attributePoints||0;overlay(SOSText("openworld_ui_map_actions.showGuardianQuickInfo.002",esc(state.name),state.level,cls?esc(cls):state.level>=2?'Class choice available':'Unclassed',points,guardianPanel(false),points?'<button id="guardianSpendStats"><b>Spend Attribute Points ('+points+')</b><small>Increase Might, Finesse, Fortitude, Focus, Agility, or Presence.</small></button>':''),true);document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openLocation(b.dataset.open));if($('#guardianSpendStats'))$('#guardianSpendStats').onclick=showTraining;if($('#guardianGuide'))$('#guardianGuide').onclick=()=>showClassGuide('help');wireClose()
}
function nearbyWorldParties(){
 maintainWorldParties();return state.world.parties.filter(p=>worldPartyDisplayRegion(p)===currentWorldRegion()&&worldPartyDistanceToPlayer(p)<10).sort((a,b)=>worldPartyDistanceToPlayer(a)-worldPartyDistanceToPlayer(b))
}
function uiClassToken(v){return String(v||'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'unknown'}
function worldPartyTypeLabel(p){return worldPartyType(p.kind)?.name||partyPurpose(p.kind)||SOSText("openworld_ui_map_actions.worldPartyTypeLabel.001")}
function nearbyPartyButtonHTML(p,attr='data-nearparty'){
 const d=worldPartyDisposition(p),est=worldPartyTravelEstimate(p),type=worldPartyTypeLabel(p),symbol=worldPartySymbol(p,d),faction=p.faction||SOSText("openworld_ui_map_actions.nearbyPartyButtonHTML.001"),contract=p.questId&&activeQuest(p.questId);
 return SOSText("openworld_ui_map_actions.nearbyPartyButtonHTML.002",uiClassToken(d),uiClassToken(faction),attr,p.id,esc(type),esc(faction),esc(d),esc(symbol),esc(p.name),esc(est.label),esc(type),esc(faction),uiClassToken(d),esc(d.toUpperCase()),contract?'<em class="party-tag contract">CONTRACT</em>':'')
}
function nearbyPartyGroupHTML(list,attr='data-nearparty',limit=null){
 const shown=limit?list.slice(0,limit):list;if(!shown.length)return '';
 return `<div class="nearby-party-buttons">${shown.map(p=>nearbyPartyButtonHTML(p,attr)).join('')}</div>`
}
function showNearbyWorldParties(){modalRouteEnter(SOSText("openworld_ui_map_actions.showNearbyWorldParties.001"),Array.from(arguments));
 const list=nearbyWorldParties(),loc=worldLocation(state.world.location);
 overlay(SOSText("openworld_ui_map_actions.showNearbyWorldParties.002",esc(loc.name),list.length?`${list.length===1?'1 party is':`${list.length} parties are`} close enough to approach. Each entry identifies its type, allegiance, and current attitude toward the company.`:'No moving party is currently close enough to approach.',nearbyPartyGroupHTML(list),list.length?'<div class="party-status-key"><span class="status-hostile">Hostile</span><span class="status-wary">Wary</span><span class="status-neutral">Neutral</span><span class="status-friendly">Friendly</span></div>':''),true);
 document.querySelectorAll('[data-nearparty]').forEach(b=>b.onclick=()=>showWorldParty(b.dataset.nearparty));wireClose()
}
function regionalTravelOptions(){
 const region=currentWorldRegion();return REGION_CONNECTIONS.filter(c=>locationRegion(c.a)===region||locationRegion(c.b)===region).map(c=>{const hereSide=locationRegion(c.a)===region?c.a:c.b,dest=hereSide===c.a?c.b:c.a;return {connection:c,gateway:hereSide,dest,toRegion:locationRegion(dest)}})
}
function regionalTravelSummary(){
 const opts=regionalTravelOptions();if(!opts.length)return'';const here=state.world.location,at=opts.find(x=>x.gateway===here);if(at)return SOSText("openworld_ui_map_actions.regionalTravelSummary.001",at.connection.name,regionDef(at.toRegion).name);const nearest=opts.slice().sort((a,b)=>worldTravelDays(here,a.gateway)-worldTravelDays(here,b.gateway))[0];return SOSText("openworld_ui_map_actions.regionalTravelSummary.002",regionDef(nearest.toRegion).name,worldLocation(nearest.gateway).name,worldTravelDays(here,nearest.gateway))
}
function showRegionalTravelHub(){modalRouteEnter(SOSText("openworld_ui_map_actions.showRegionalTravelHub.001"),Array.from(arguments));
 const here=state.world.location,opts=regionalTravelOptions();
 overlay(SOSText("openworld_ui_map_actions.showRegionalTravelHub.002",opts.length?`<div class="regional-route-list">${opts.map(x=>{const at=x.gateway===here,days=worldTravelDays(here,x.gateway);return `<div class="regional-route-card ${at?'at-crossing':''}"><div><b>${esc(regionDef(x.toRegion).name)}</b><small>${esc(x.connection.name)} • ${esc(worldLocation(x.gateway).name)} → ${esc(worldLocation(x.dest).name)} • ${x.connection.days} crossing days</small></div><button data-regionroute="${x.connection.id}">${at?'Cross Region Now':`Travel to ${esc(worldLocation(x.gateway).name)} (${days}d)`}</button></div>`}).join('')}</div>`:'<div class="notice">No regional crossing is available from this region yet.</div>'),true);
 document.querySelectorAll('[data-regionroute]').forEach(b=>b.onclick=()=>{const c=REGION_CONNECTIONS.find(x=>x.id===b.dataset.regionroute),gateway=locationRegion(c.a)===currentWorldRegion()?c.a:c.b;if(state.world.location===gateway)return showRegionTravel();closeOverlay();attemptWorldTravel(gateway)});wireClose()
}

function openWorldActionsHTML(){
 const eq=activeEscortQuest(),loc=worldLocation(state.world.location),tq=state.world.quests.find(q=>q.id===state.world.trackedQuestId&&['active','ready'].includes(q.status)),tp=trackedWorldParty(),regional=regionalTravelSummary();
 if(eq){
   const p=escortCaravan(eq),total=eq.escortTotalDays||1,done=Math.max(0,total-(eq.escortRemainingDays||0));
   return SOSText("openworld_ui_map_actions.openWorldActionsHTML.001",openWorldPlayerActionsHTML(),liveBattleAlertHTML(),homeHomecomingSummaryHTML(),esc(p?.name||eq.name),esc(contractIssuerName(eq)),esc(contractTargetName(eq)),done,total,eq.escortRemainingDays)
 }
 return SOSText("openworld_ui_map_actions.openWorldActionsHTML.002",openWorldPlayerActionsHTML(),liveBattleAlertHTML(),homeHomecomingSummaryHTML(),tp?`<div class="notice compact"><b>Tracked party: ${esc(tp.name)}</b><br><small>${esc(worldPartyTravelEstimate(tp).label)}</small><br><button id="openTrackedParty" class="mini-action">Open Party Report</button></div>`:'',tq?`<div class="notice compact"><b>Tracked contract: ${esc(tq.name)}</b><br><small>${esc(contractObjective(tq))}</small><br><button id="openTrackedContract" class="mini-action">Open Contract</button></div>`:'',regional?`<div class="region-crossing-hint"><b>Regional travel:</b> ${esc(regional)}</div>`:'',state.world.day,esc(loc.name))
}
function openWorldLocationPanel(){
 const eq=activeEscortQuest();if(eq){const p=escortCaravan(eq);return SOSText("openworld_ui_map_actions.openWorldLocationPanel.001",esc(p?.name||'the caravan'),esc(contractTargetName(eq)),state.world.day,esc(regionDef().name),eq.escortRemainingDays,eq.escortRemainingDays===1?'':'s',eq.attacksDefended||0)}
 const loc=worldLocation(state.world.location),field=playerPartyInField(),present=Object.values(state.world.companions).filter(c=>c.location===loc.id&&!state.allies.includes(c.id)),rank=worldRankName(),rep=state.world.settlements[loc.id]?localReputation(loc.id):0;
 return SOSText("openworld_ui_map_actions.openWorldLocationPanel.002",field?'Player Party — In the Field':esc(loc.name),field?`The Guardian and active companions are outside ${esc(loc.name)}. Re-enter the settlement before using town services.`:esc(loc.desc),regionConnectionAt(loc.id)?`<div class="regional-crossing-callout"><b>REGIONAL CROSSING</b><br>${esc(regionConnectionAt(loc.id).name)} → ${esc(regionDef(locationRegion(regionConnectionOther(regionConnectionAt(loc.id),loc.id))).name)}<br><button id="locationCrossRegion">Cross Region</button></div>`:'',state.world.settlements[loc.id]?`<p class="compact living-location">${esc(settlementConditionText(loc.id))}</p>`:'',state.world.day,activeRoadCompanions().length?`<div class="stat-row"><span>Traveling with</span><b>${activeRoadCompanions().map(m=>esc(m.name)).join(", ")}</b></div>`:``,esc(settlementControl(loc.id)),state.world.settlements[loc.id]?`<div class="stat-row"><span>Legal status</span><b>${esc(wantedTier(loc.id))}${localBounty(loc.id)?` • ${localBounty(loc.id)}g`:``} • rep ${jurisdictionRep(loc.id)}</b></div>`:``,state.world.settlements[loc.id]?`<div class="stat-row"><span>Faction presence</span><b>${esc(factionRepresentativesAt(loc.id).slice(0,2).map(([f,v])=>`${majorFaction(f).short} ${factionPresenceTier(v)}`).join(' • ')||'None')}</b></div>`:'',esc(rank),state.world.settlements[loc.id]?`<div class="stat-row"><span>Local reputation</span><b>${esc(localRepTier(rep))} ${rep>=0?'+':''}${rep}</b></div>`:'',present.filter(c=>c.known).length);
}

function isTownLikeLocation(loc){return !!loc&&['town','settlement','camp','fort'].includes(loc.type)}
function openWorldTownActionsPanelHTML(loc,escort=false){
 if(escort||playerPartyInField()||!isTownLikeLocation(loc))return '';
 return SOSText("openworld_ui_map_actions.openWorldTownActionsPanelHTML.001",esc(loc.name),loc.id==='shantium'?'<button id="worldCouncilHall"><b>Council Hall</b><small>Civic administration, law & public affairs</small></button>':'',`<button id="worldLeaveSettlement" class="leave-settlement-action"><b>Leave ${esc(loc.name)}</b><small>Exit the settlement and move the Player Party into the nearby field.</small></button>`)
}
function openWorldNearbyPartiesPanelHTML(loc,escort=false){
 const liveBattles=activeLiveRegionalConflicts().filter(c=>c.region===currentWorldRegion());
 if(escort||playerPartyInField()||!isTownLikeLocation(loc))return '';const list=nearbyWorldParties();if(!list.length)return '';
 const shown=list.slice(0,3);
 return SOSText("openworld_ui_map_actions.openWorldNearbyPartiesPanelHTML.001",liveBattles.length?`<div class="warning notice compact"><b>${liveBattles.length} live regional battle${liveBattles.length===1?'':'s'}</b> underway in this region.</div>`:'',list.length,nearbyPartyGroupHTML(shown,'data-localparty'),list.length>3?`<button id="worldNearbyAll" class="view-all-parties">View all ${list.length} nearby parties</button>`:'')
}

function scrollToCurrentTownSection(){
 const loc=worldLocation(state.world.location);if(!isTownLikeLocation(loc))return showWorldArea();
 const section=document.getElementById(SOSText("openworld_ui_map_actions.scrollToCurrentTownSection.001"));if(!section)return showWorldArea();
 section.scrollIntoView?.({behavior:'smooth',block:'start'});section.classList.add('town-section-focus');setTimeout(()=>section.classList.remove('town-section-focus'),900)
}
function handleWorldMapLocationClick(dest){
 if(dest===state.world.location&&playerPartyInField()&&isTownLikeLocation(worldLocation(dest)))return attemptPlayerPartySettlementReentry(dest);
 if(dest===state.world.location&&isTownLikeLocation(worldLocation(dest)))return scrollToCurrentTownSection();
 return attemptWorldTravel(dest)
}
function safeOpenWorldRenderPart(label,fn,fallback){
 try{return fn()}catch(e){
   console.error(SOSText("openworld_ui_map_actions.safeOpenWorldRenderPart.001",label),e);
   const msg=e?.message||String(e);if(state?.log)state.log.push({t:Date.now(),msg:SOSText("openworld_ui_map_actions.safeOpenWorldRenderPart.002",label,msg),type:'bad'});
   return fallback||SOSText("openworld_ui_map_actions.safeOpenWorldRenderPart.003",esc(label),esc(msg))
 }
}
function renderOpenWorld(){SOSServices.navigation.reset();
 if(combat&&!combat.over)return renderCombat();sosFastOpenWorldStateReady();scheduleOpenWorldMaintenance();
 checkLevel();checkAchievements();if(captivityActive())return showCaptivity();const loc=worldLocation(state.world.location),escort=activeEscortQuest();
 const guardianHTML=safeOpenWorldRenderPart(SOSText("openworld_ui_map_actions.renderOpenWorld.004"),()=>guardianPanel(),SOSText("openworld_ui_map_actions.renderOpenWorld.005"));
 const actionsHTML=safeOpenWorldRenderPart(SOSText("openworld_ui_map_actions.renderOpenWorld.006"),()=>openWorldActionsHTML(),SOSText("openworld_ui_map_actions.renderOpenWorld.007"));
 const mapHTML=safeOpenWorldRenderPart(SOSText("openworld_ui_map_actions.renderOpenWorld.008"),()=>openWorldMapHTML(),SOSText("openworld_ui_map_actions.renderOpenWorld.009"));
 const locationHTML=safeOpenWorldRenderPart(SOSText("openworld_ui_map_actions.renderOpenWorld.010"),()=>openWorldLocationPanel(),SOSText("openworld_ui_map_actions.renderOpenWorld.011",esc(loc?.name||'Current Location')));
 const townHTML=safeOpenWorldRenderPart(SOSText("openworld_ui_map_actions.renderOpenWorld.012"),()=>openWorldTownActionsPanelHTML(loc,!!escort),'');
 const nearbyHTML=safeOpenWorldRenderPart(SOSText("openworld_ui_map_actions.renderOpenWorld.013"),()=>openWorldNearbyPartiesPanelHTML(loc,!!escort),'');
 document.getElementById('app').innerHTML=SOSText("openworld_ui_map_actions.renderOpenWorld.014",esc(state.name),state.level,fmt(state.gold),esc(regionDef().name.toUpperCase()),state.world.day,guardianHTML,actionsHTML,mapHTML,locationHTML,townHTML,nearbyHTML,state.log.slice(-50).map(x=>`<div class="log-line ${x.type}">${esc(x.msg)}</div>`).join(''));
 document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openLocation(b.dataset.open));
 document.querySelectorAll('[data-mainturnin]').forEach(b=>b.onclick=()=>{const q=state.world.quests.find(x=>x.id===b.dataset.mainturnin);if(q&&q.status==='ready'&&contractPaymentLocation(q)===state.world.location)turnInQuest(q,renderOpenWorld)});
 document.querySelectorAll('[data-localparty]').forEach(b=>b.onclick=()=>showWorldParty(b.dataset.localparty));
 if($('#worldNearbyAll'))$('#worldNearbyAll').onclick=showNearbyWorldParties;
 if($('#worldTravelMenu'))$('#worldTravelMenu').onclick=showOpenWorldTravelMenu;if($('#worldRecordsMenu'))$('#worldRecordsMenu').onclick=showOpenWorldRecordsMenu;if($('#worldRegionMenu'))$('#worldRegionMenu').onclick=showOpenWorldRegionMenu;if($('#worldExplorationMenu'))$('#worldExplorationMenu').onclick=showOpenWorldExplorationMenu;if($('#worldCompanionMenu'))$('#worldCompanionMenu').onclick=showOpenWorldCompanionMenu;if($('#worldLifeMenu'))$('#worldLifeMenu').onclick=showOpenWorldWorldLifeMenu;if($('#worldCompanyEconomy'))$('#worldCompanyEconomy').onclick=showEconomyLedger;if($('#worldCharacterInfo'))$('#worldCharacterInfo').onclick=showGuardianQuickInfo;if($('#locationCrossRegion'))$('#locationCrossRegion').onclick=showRegionTravel;
 document.querySelectorAll('[data-worldloc]').forEach(b=>b.onclick=()=>handleWorldMapLocationClick(b.dataset.worldloc));document.querySelectorAll('[data-worldparty]').forEach(b=>b.onclick=()=>showWorldParty(b.dataset.worldparty));document.querySelectorAll('[data-liveconflict]').forEach(b=>b.onclick=()=>showLiveRegionalConflict(b.dataset.liveconflict));
 if($('#mainBattleIntervene'))$('#mainBattleIntervene').onclick=()=>{const b=primaryLiveBattleAlert();if(b)showRegionalBattle(b[0],b[1],b[2])};if($('#mainBattleMessenger'))$('#mainBattleMessenger').onclick=()=>{const b=primaryLiveBattleAlert();if(!b)return;const c=b[2],pair=guardianCaravanDisputeParties(c);overlay(SOSText("openworld_ui_map_actions.dispatchCaravanMessenger.001",esc(pair?.caravan.name||b[1].name),esc(pair?.patrol.name||b[0].name)),true);$('#messengerClear').onclick=()=>dispatchGuardianCaravanMessenger(c,'explain');$('#messengerInspect').onclick=()=>dispatchGuardianCaravanMessenger(c,'inspect');$('#messengerReroute').onclick=()=>dispatchGuardianCaravanMessenger(c,'reroute');$('#messengerCancel').onclick=()=>{closeOverlay();renderOpenWorld()}};if($('#mainBattleTrack'))$('#mainBattleTrack').onclick=()=>{const b=primaryLiveBattleAlert();if(b&&!b[2].guardianTracked){b[2].guardianTracked=true;log(SOSText("openworld_ui_map_actions.renderOpenWorld.015",worldLocation(b[2].locId).name,b[0].name,b[1].name),'info');save();renderOpenWorld()}};
 if($('#mainBattleIgnore'))$('#mainBattleIgnore').onclick=()=>{const b=primaryLiveBattleAlert();if(b){b[2].guardianIgnored=true;b[2].ignoredDay=state.world.day;save()}renderOpenWorld()}
 if($('#openTrackedParty'))$('#openTrackedParty').onclick=showTrackedWorldParty;if($('#openTrackedContract'))$('#openTrackedContract').onclick=()=>showContractDetails(state.world.trackedQuestId);if($('#worldEscortContinue'))$('#worldEscortContinue').onclick=()=>continueEscortContract(state.world.activeEscortQuestId);if($('#worldEscortContract'))$('#worldEscortContract').onclick=()=>showContractDetails(state.world.activeEscortQuestId);if($('#worldArea'))$('#worldArea').onclick=showWorldArea;if($('#worldContractsJournal'))$('#worldContractsJournal').onclick=showContractsJournal;if($('#worldJournal'))$('#worldJournal').onclick=showWorldJournal;if($('#worldRegionOverview'))$('#worldRegionOverview').onclick=showRegionOverview;if($('#worldRegionalStories'))$('#worldRegionalStories').onclick=showRegionalStoryJournal;if($('#worldEconomy'))$('#worldEconomy').onclick=showEconomyLedger;if($('#worldLaw'))$('#worldLaw').onclick=showRegionalLaw;if($('#worldRoadLife'))$('#worldRoadLife').onclick=showRoadLife;if($('#worldCompanionExpeditions'))$('#worldCompanionExpeditions').onclick=showCompanionExpeditionJournal;if($('#worldEncounters'))$('#worldEncounters').onclick=showRoadEncounterCatalogue;if($('#worldExplore'))$('#worldExplore').onclick=showExplorationJournal;if($('#worldArtifacts'))$('#worldArtifacts').onclick=showArtifactCollection;if($('#worldSurvey'))$('#worldSurvey').onclick=surveyCurrentRegion;if($('#worldOpportunities'))$('#worldOpportunities').onclick=showRegionalOpportunities;if($('#worldPolitics'))$('#worldPolitics').onclick=showRegionalPolitics;if($('#worldFactions'))$('#worldFactions').onclick=showFactionOverview;if($('#worldMapFilters'))$('#worldMapFilters').onclick=showWorldMapFilters;if($('#worldRegionTravel'))$('#worldRegionTravel').onclick=showRegionTravel;
 if($('#worldTownLife'))$('#worldTownLife').onclick=()=>navigateTownMenu(SOSText("openworld_ui_map_actions.renderOpenWorld.016"),{locId:state.world.location});if($('#worldServices'))$('#worldServices').onclick=()=>navigateTownMenu('services',{locId:state.world.location});if($('#worldContracts'))$('#worldContracts').onclick=()=>navigateTownMenu('contracts',{locId:state.world.location});if($('#worldLocalFactions'))$('#worldLocalFactions').onclick=()=>navigateTownMenu('factions',{locId:state.world.location});if($('#worldLocalPolitics'))$('#worldLocalPolitics').onclick=()=>navigateTownMenu('politics',{locId:state.world.location});if($('#worldCouncilHall'))$('#worldCouncilHall').onclick=()=>openLocation('council');if($('#worldLeaveSettlement'))$('#worldLeaveSettlement').onclick=leaveCurrentSettlementToField;if($('#worldTavernRest'))$('#worldTavernRest').onclick=confirmSettlementTavernRest;if($('#worldHomeBase'))$('#worldHomeBase').onclick=showHomeBase;if($('#worldHomePrepare'))$('#worldHomePrepare').onclick=showHomePreparation;if($('#worldHomeRest'))$('#worldHomeRest').onclick=confirmGuardianHallRest;if($('#worldHomecomingBrief'))$('#worldHomecomingBrief').onclick=showHomecomingBriefing;if($('#worldHallProcurement'))$('#worldHallProcurement').onclick=showHomeFieldProcurement;if($('#worldPrisoners'))$('#worldPrisoners').onclick=showPrisoners;if($('#worldCamping'))$('#worldCamping').onclick=showOpenWorldCampingMenu;
 if($('#worldCamp'))$('#worldCamp').onclick=makeRoadCamp;
 $('#menuBtn').onclick=gameMenu;
 wireWorldMapPan();
 if(state.world.pendingContractFailures?.length)setTimeout(()=>{if(!modal)showPendingContractFailureNotice()},0);
 setTimeout(()=>{const l=document.getElementById(SOSText("openworld_ui_map_actions.renderOpenWorld.017"));if(l)l.scrollTop=l.scrollHeight},0);
}

const ROAD_EVENT_TYPES=[
 {id:'ambush',title:SOSText("openworld_ui_map_actions.renderOpenWorld.018"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.019"),weight:5},
 {id:'traffic',title:SOSText("openworld_ui_map_actions.renderOpenWorld.020"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.021"),weight:6},
 {id:'stranded',title:SOSText("openworld_ui_map_actions.renderOpenWorld.022"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.023"),weight:6},
 {id:'wounded',title:SOSText("openworld_ui_map_actions.renderOpenWorld.024"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.025"),weight:10},
 {id:'refugees',title:SOSText("openworld_ui_map_actions.renderOpenWorld.026"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.027"),weight:9},
 {id:'broken_cart',title:SOSText("openworld_ui_map_actions.renderOpenWorld.028"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.029"),weight:9},
 {id:'toll',title:SOSText("openworld_ui_map_actions.renderOpenWorld.030"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.031"),weight:7},
 {id:'camp',title:SOSText("openworld_ui_map_actions.renderOpenWorld.032"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.033"),weight:7},
 {id:'patrol',title:SOSText("openworld_ui_map_actions.renderOpenWorld.034"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.035"),weight:6},
 {id:'blocked',title:SOSText("openworld_ui_map_actions.renderOpenWorld.036"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.037"),weight:8},
 {id:'weather',title:SOSText("openworld_ui_map_actions.renderOpenWorld.038"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.039"),weight:8},
 {id:'prisoners',title:SOSText("openworld_ui_map_actions.renderOpenWorld.040"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.041"),weight:5},
 {id:'abandoned',title:SOSText("openworld_ui_map_actions.renderOpenWorld.042"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.043"),weight:6},
 {id:'traveler',title:SOSText("openworld_ui_map_actions.renderOpenWorld.044"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.045"),weight:8},
 {id:'pilgrims',title:SOSText("openworld_ui_map_actions.renderOpenWorld.046"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.047"),weight:5},
 {id:'deserters',title:SOSText("openworld_ui_map_actions.renderOpenWorld.048"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.049"),weight:5},
 {id:'messenger',title:SOSText("openworld_ui_map_actions.renderOpenWorld.050"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.051"),weight:5},
 {id:'smugglers',title:SOSText("openworld_ui_map_actions.renderOpenWorld.052"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.053"),weight:5},
 {id:'bounty_hunter',title:SOSText("openworld_ui_map_actions.renderOpenWorld.054"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.055"),weight:4},
 {id:'road_healer',title:SOSText("openworld_ui_map_actions.renderOpenWorld.056"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.057"),weight:5},
 {id:'merc_recruiter',title:SOSText("openworld_ui_map_actions.renderOpenWorld.058"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.059"),weight:5},
 {id:'ruined_caravan',title:SOSText("openworld_ui_map_actions.renderOpenWorld.060"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.061"),weight:5},
 {id:'magic_disturbance',title:SOSText("openworld_ui_map_actions.renderOpenWorld.062"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.063"),weight:4},
 {id:'hunters',title:SOSText("openworld_ui_map_actions.renderOpenWorld.064"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.065"),weight:5},
 {id:'envoy',title:SOSText("openworld_ui_map_actions.renderOpenWorld.066"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.067"),weight:4},
 {id:'escaped_prisoner',title:SOSText("openworld_ui_map_actions.renderOpenWorld.068"),text:SOSText("openworld_ui_map_actions.renderOpenWorld.069"),weight:4}
];

function roadConditionProfile(from,to){
 // v1.6.0.2: a Player Party standing just outside a settlement renders that
 // settlement as RE-ENTER. This legitimately asks for a same-location profile
 // (for example shantium -> shantium), for which routeEvidence intentionally
 // has no route record. Treat that as a local/open profile instead of reading
 // .status from undefined. Also keep a defensive fallback for malformed legacy
 // route evidence so one bad record can never take down the regional map.
 const same=!!from&&from===to,r=same?null:routeEvidence(from,to),status=r?.status||'open',pressure=Number.isFinite(r?.pressure)?r.pressure:0;
 const traffic=status==='open'?'heavy':status==='watched'?'normal':status==='risky'?'light':'sparse';
 return {status,pressure,traffic,encounterMod:status==='open'?.02:status==='watched'?.08:status==='risky'?.18:.28,hostileMod:status==='dangerous'?2.3:status==='risky'?1.65:status==='watched'?1.2:.7}
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
   // v1.6.1: road life should not feel like a shuffled deck repeating the same card.
   // Recent scenes remain possible, but their weight falls sharply for a few encounters.
   const recent=(state.world.roadEventHistory||[]).slice(-3).map(x=>x.event),repeats=recent.filter(id=>id===e.id).length;
   if(repeats)w=Math.max(1,Math.round(w*(repeats>=2?.18:.42)));
   for(let i=0;i<w;i++)pool.push(e)
 }
 return pick(pool)
}
function roadEventContext(from,to,escort=false){
 const fs=settlementState(from),ts=settlementState(to),security=Math.round(((fs.security||50)+(ts.security||50))/2),route=roadConditionProfile(from,to),plan=state.world.travelPlan||{mode:'direct'};
 const region=locationRegion(to),ambushVariant=region==='redstone'?'checkpoint trap':region==='bluestone'?'high-ground ambush':['woods','marsh'].includes(to)?'concealed flank':'roadside ambush';
 const campPrep=typeof campingTravelPrepBonus==='function'?campingTravelPrepBonus():0;
 const injuryRisk=typeof recoveryTravelDangerPenalty==='function'?recoveryTravelDangerPenalty():0;
 return {from,to,escort,security,route,plan,region,ambushVariant,campPrep,injuryRisk,danger:clamp((60-security)/100+.08+route.encounterMod-(plan.mode==='safer'?.10:0)-(campPrep?.08:0)+injuryRisk,.05,.78)}
}
function roadEventChance(ctx){return clamp(.24+ctx.danger-(ctx.escort?.06:0)+(ctx.route.status==='open'?.05:0),.18,.78)}
