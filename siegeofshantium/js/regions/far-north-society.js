// v1.6.22 — Far North Society & Living World
(function(){
const FAR_NORTH_SETTLEMENTS=['azerdon','karsen','decius','velmora','skallvik','exium'];
function isFarNorthSettlement1622(id){return FAR_NORTH_SETTLEMENTS.includes(id)}

const FAR_NORTH_SETTLEMENT_PROFILES={
 azerdon:{tag:'Independent capital',summary:'Azerdon is the Far North’s only true city: stone halls, enclosed markets, deep storehouses, and stubborn civic institutions built to survive winters without southern help.',institution:'Council of Hearths',law:'Winter Watch',trade:'The broadest northern market, but imports remain expensive and irregular.',autonomy:10,outsiders:4},
 karsen:{tag:'Northern crossroads',summary:'Karsen survives by being useful. Every serious northern road eventually seems to pass its smiths, guide houses, stone yards, or fortified inn.',institution:'Road Moot',law:'Road Wardens',trade:'Stone, iron, tools, guides, and internal caravan traffic dominate local life.',autonomy:9,outsiders:5},
 decius:{tag:'Western hunters’ village',summary:'Decius is a low, wind-braced settlement of hunters, trappers, cave guides, and families who measure distance in hours of usable daylight.',institution:'Hunter Elders',law:'Local Wardens',trade:'Furs, food, medicine, and cave traffic matter more here than formal commerce.',autonomy:9,outsiders:3},
 velmora:{tag:'Shelter and herds',summary:'Velmora is built around protected yards, low-roofed houses, livestock shelters, and shared winter stores. Hospitality exists, but wastefulness is remembered.',institution:'Shelter Council',law:'Hearth Wardens',trade:'Food, hides, limited livestock, and practical supplies keep the village alive.',autonomy:9,outsiders:3},
 skallvik:{tag:'Rough frontier village',summary:'Skallvik is where trappers, fugitives, mercenaries, bounty hunters, salvagers, and merchants with flexible standards meet under the same smoky roofs.',institution:'Open Table',law:'Informal Bounty Compact',trade:'Furs, spirits, weapons, salvage, rumors, and questionable cargo change hands quickly.',autonomy:8,outsiders:6},
 exium:{tag:'Southern gateway',summary:'Exium is where the Far North meets everyone else. Southern merchants stop here; northern carriers decide what continues beyond the gate.',institution:'Gate Council',law:'North Road Wardens',trade:'Foreign goods terminate here before being redistributed by Independent northern traffic.',autonomy:8,outsiders:7}
};

const FAR_NORTH_NPCS={
 azerdon:[
  {id:'az_firstspeaker',name:'Eydis Halden',role:'First Speaker of the Council of Hearths'},
  {id:'az_watchcaptain',name:'Torren Skeld',role:'Captain of the Winter Watch'},
  {id:'az_factor',name:'Yrsa Vale',role:'Northern Market Factor'},
  {id:'az_smith',name:'Hakon Rime',role:'Master Smith'}],
 karsen:[
  {id:'kar_warden',name:'Sten Orvik',role:'Senior Road Warden'},
  {id:'kar_host',name:'Runa Keld',role:'Fortified Inn Host'},
  {id:'kar_stone',name:'Halvar Dorn',role:'Stonewright and Quarry Factor'},
  {id:'kar_healer',name:'Freja Norr',role:'Road Healer'}],
 decius:[
  {id:'dec_elder',name:'Sigrun Elt',role:'Hunter Elder'},
  {id:'dec_trapper',name:'Eirik Voss',role:'Trapper and Fur Trader'},
  {id:'dec_healer',name:'Astrid Fen',role:'Snow Healer'},
  {id:'dec_guide',name:'Kjell Marr',role:'Snow Cave Guide'}],
 velmora:[
  {id:'vel_herder',name:'Brynja Tor',role:'Herdmaster'},
  {id:'vel_warden',name:'Oren Vale',role:'Shelter Warden'},
  {id:'vel_hunter',name:'Freydis Harn',role:'Hunter and Scout'},
  {id:'vel_healer',name:'Jora Stenn',role:'Midwife and Healer'}],
 skallvik:[
  {id:'ska_host',name:'Hroa Venn',role:'Tavern Host and Informal Mediator'},
  {id:'ska_broker',name:'Varek Sorn',role:'Fur Broker and Fence'},
  {id:'ska_bounty',name:'Rikka Hal',role:'Bounty Clerk'},
  {id:'ska_smith',name:'Torgun Icehand',role:'Ice-Road Smith'}],
 exium:[
  {id:'ex_factor',name:'Elin Var',role:'Gate Market Factor'},
  {id:'ex_warden',name:'Magnus Keld',role:'North Road Warden'},
  {id:'ex_clerk',name:'Svala Renn',role:'Caravan Clerk'},
  {id:'ex_host',name:'Orik Dall',role:'Gate Inn Host'}]
};
for(const [id,list] of Object.entries(FAR_NORTH_NPCS)){
 if(!SETTLEMENT_NPCS[id])SETTLEMENT_NPCS[id]=[];
 for(const n of list)if(!SETTLEMENT_NPCS[id].some(x=>x.id===n.id))SETTLEMENT_NPCS[id].push(n)
}
Object.assign(TOWN_LIFE_SCENES,{
 azerdon:['Snow is swept constantly from Azerdon’s enclosed market lanes while watch patrols move between stone storehouses.','The Council of Hearths is in session behind frost-clouded windows while northern carriers unload sledges in the lower market.','Smith smoke hangs low over Azerdon as residents queue at winter stores and argue about roads that may not reopen for days.'],
 karsen:['Guide boards, stone carts, and laden sledges crowd Karsen’s central road yard.','Travelers compare routes inside Karsen’s fortified inn while Road Wardens mark fresh danger reports.','Hammering carries from the stone yards as another northern caravan changes teams before taking a different road.'],
 decius:['Hunters knock snow from their boots outside low-roofed houses while hides cure beneath covered frames.','A cave guide redraws a western route in charcoal while trappers argue about tracks lost in the last snowfall.','Smoke lies flat over Decius and nearly every conversation eventually turns toward weather, game, or the Snow Caves.'],
 velmora:['Herders move animals between sheltered yards while residents shovel wind-packed snow from the lanes.','The Shelter Council counts winter stores beside a crowded common hearth.','Hunters return to Velmora with frost on their cloaks while children help carry feed into protected sheds.'],
 skallvik:['Skallvik’s tavern doors never seem fully closed; cold air, smoke, arguments, and rumors spill through them together.','A bounty notice is nailed beside a fur price sheet while two mercenaries loudly disagree over who saw the outlaw first.','Sledges crowd the muddy-snow street as trappers, salvagers, fugitives, and traders conduct business without asking unnecessary questions.'],
 exium:['Southern wagons stop at Exium while northern sledges take over the cargo that will continue beyond the gate.','Gate clerks argue over manifests as North Road Wardens question drivers about conditions toward Karsen and Roguehold.','Foreign traders bargain inside Exium’s market sheds, but their guards rarely look eager to continue farther north.']
});
const FAR_NORTH_TOWN_JOBS={
 azerdon:[{id:'az_stores',title:'Audit Winter Stores',kind:'market',days:1,reward:25},{id:'az_watch',title:'Walk the Winter Watch',kind:'security',days:1,reward:28},{id:'az_carriers',title:'Help Northern Carriers',kind:'prosperity',days:1,reward:24}],
 karsen:[{id:'kar_roads',title:'Mark Dangerous Roads',kind:'scouting',days:1,reward:28},{id:'kar_stone',title:'Help the Stone Yards',kind:'prosperity',days:1,reward:24},{id:'kar_watch',title:'Ride with the Road Wardens',kind:'security',days:1,reward:30}],
 decius:[{id:'dec_tracks',title:'Scout Hunter Trails',kind:'scouting',days:1,reward:27},{id:'dec_hides',title:'Help Prepare Hides',kind:'market',days:1,reward:22},{id:'dec_caves',title:'Check the Snow Cave Approach',kind:'security',days:1,reward:29}],
 velmora:[{id:'vel_herds',title:'Protect the Herd Route',kind:'security',days:1,reward:29},{id:'vel_shelter',title:'Repair Winter Shelters',kind:'prosperity',days:1,reward:24},{id:'vel_tracks',title:'Scout the Eastern Snow',kind:'scouting',days:1,reward:27}],
 skallvik:[{id:'ska_bounty',title:'Check a Bounty Lead',kind:'scouting',days:1,reward:30},{id:'ska_watch',title:'Keep Order on Market Night',kind:'security',days:1,reward:29},{id:'ska_salvage',title:'Sort Frontier Salvage',kind:'market',days:1,reward:25}],
 exium:[{id:'ex_manifest',title:'Sort Northern Manifests',kind:'market',days:1,reward:24},{id:'ex_road',title:'Inspect the Northern Gate Road',kind:'scouting',days:1,reward:28},{id:'ex_escort',title:'Help Stage a Northern Caravan',kind:'prosperity',days:1,reward:27}]
};

function farNorthSocietyState1622(){
 ensureWorldState();if(!state.world.farNorthSociety||typeof state.world.farNorthSociety!=='object')state.world.farNorthSociety={settlements:{},history:[],lastTickDay:0};
 const S=state.world.farNorthSociety;if(!S.settlements)S.settlements={};if(!Array.isArray(S.history))S.history=[];
 for(const id of FAR_NORTH_SETTLEMENTS){const p=FAR_NORTH_SETTLEMENT_PROFILES[id],x=S.settlements[id]||(S.settlements[id]={});if(x.autonomy==null)x.autonomy=p.autonomy;if(x.outsiderTolerance==null)x.outsiderTolerance=p.outsiders;if(x.civicConfidence==null)x.civicConfidence=id==='azerdon'?82:id==='skallvik'?54:68;if(x.lastIssueDay==null)x.lastIssueDay=-99}
 return S
}
const FAR_NORTH_CIVIC_ISSUES={
 azerdon:[
  {id:'southern_envoys',title:'Southern Envoys at the Gate',text:'Several southern representatives want permanent rooms and formal standing in Azerdon. The Council of Hearths is reluctant to turn temporary visitors into organized political presence.',a:'Keep representation temporary',b:'Permit a limited liaison office'},
  {id:'winter_levy',title:'Winter Store Levy',text:'Azerdon’s storekeepers want every household to contribute to a reserve before the next severe weather cycle.',a:'Back the common reserve',b:'Leave stores in private hands'}],
 karsen:[
  {id:'road_priority',title:'Which Road Gets the Crews?',text:'Karsen has enough labor to improve one dangerous route before the weather worsens.',a:'Prioritize the Exium road',b:'Prioritize the eastern road'},
  {id:'guide_prices',title:'Guide Price Dispute',text:'Road guides want a common winter rate. Innkeepers argue that fixed prices will drive travelers toward unsafe self-navigation.',a:'Recognize the guide rate',b:'Keep rates competitive'}],
 decius:[
  {id:'hunt_boundary',title:'Winter Hunting Boundary',text:'Two hunting families disagree over a productive stretch of western ground.',a:'Set a temporary boundary',b:'Keep the ground open'},
  {id:'cave_rescue',title:'Cave Rescue Stores',text:'Guides want medicine and rope reserved specifically for Snow Cave rescues.',a:'Create a rescue cache',b:'Keep supplies general'}],
 velmora:[
  {id:'herd_route',title:'Herd Route Through Deep Snow',text:'Herders want a protected route cleared before traders use the same lane.',a:'Give livestock priority',b:'Keep the road open to all'},
  {id:'guest_shelter',title:'Shelter for Strangers',text:'A rough weather cycle has filled every common shelter. The council must decide how many outsider beds to preserve.',a:'Reserve outsider beds',b:'Prioritize local families'}],
 skallvik:[
  {id:'bounty_claim',title:'Competing Bounty Claims',text:'Two groups claim the same outlaw bounty, and neither trusts the other enough to leave town first.',a:'Split the verified bounty',b:'Require proof from one claimant'},
  {id:'market_weapons',title:'Weapons on Market Night',text:'A tavern dispute has revived the old argument over whether loaded weapons should be permitted inside the main market hall.',a:'Enforce a peace-bond rule',b:'Leave weapons unrestricted'}],
 exium:[
  {id:'foreign_stalls',title:'Foreign Merchant Stalls',text:'Southern merchants want permanent market stalls beyond the seasonal sheds at Exium.',a:'Keep foreign trade temporary',b:'Lease limited permanent stalls'},
  {id:'north_tariff',title:'Northern Transfer Fee',text:'Caravan handlers propose a transfer fee on goods changing from southern wagons to northern sledges.',a:'Adopt the transfer fee',b:'Keep the gate toll light'}]
};
function farNorthCurrentIssue1622(id){const x=farNorthSocietyState1622().settlements[id];return x.issue&&x.issue.status==='active'?x.issue:null}
function farNorthGenerateIssue1622(id,force=false){const S=farNorthSocietyState1622(),x=S.settlements[id];if(x.issue?.status==='active')return x.issue;if(!force&&state.world.day-(x.lastIssueDay||-99)<4)return null;const d=pick(FAR_NORTH_CIVIC_ISSUES[id]);x.issue={...d,status:'active',createdDay:state.world.day};x.lastIssueDay=state.world.day;return x.issue}
function farNorthResolveIssue1622(id,choice){
 const S=farNorthSocietyState1622(),x=S.settlements[id],q=farNorthCurrentIssue1622(id);if(!q)return showFarNorthCivicLife1622(id);const ss=settlementState(id);let text='',tone='good';
 if(choice==='a'){x.autonomy=clamp(x.autonomy+.25,0,10);x.civicConfidence=clamp(x.civicConfidence+2,0,100);if(['karsen','decius','velmora'].includes(id))ss.security=clamp(ss.security+1,0,100);text=`You support “${q.a}.” The decision reinforces local institutions and is recorded as a northern settlement matter rather than a faction victory.`}
 else{x.outsiderTolerance=clamp(x.outsiderTolerance+.35,0,10);x.civicConfidence=clamp(x.civicConfidence+1,0,100);if(['azerdon','exium'].includes(id))ss.prosperity=clamp(ss.prosperity+1,0,100);text=`You support “${q.b}.” The settlement becomes slightly more open to outside contact without surrendering Independent control.`}
 q.status='resolved';q.choice=choice;q.resolvedDay=state.world.day;S.history.push({day:state.world.day,locId:id,title:q.title,choice:choice==='a'?q.a:q.b});S.history=S.history.slice(-50);changeLocalReputation(id,1,'Helped resolve a northern civic dispute');recordWorldHistory(`${worldLocation(id).name}: ${q.title} — ${choice==='a'?q.a:q.b}.`,'info','Far North society');save();actionResult(q.title,text,tone,()=>showFarNorthCivicLife1622(id))
}
function farNorthCivicSummaryHTML1622(id){const p=FAR_NORTH_SETTLEMENT_PROFILES[id],x=farNorthSocietyState1622().settlements[id];return `<div class="notice compact far-north-civic-summary"><b>${esc(p.tag)}</b><br>${esc(p.summary)}<br><small>${esc(p.institution)} • ${esc(p.law)} • Local autonomy ${x.autonomy.toFixed(1)}/10 • Outsider tolerance ${x.outsiderTolerance.toFixed(1)}/10</small></div>`}
function showFarNorthCivicLife1622(id=state.world.location){
 if(!isFarNorthSettlement1622(id))return showTownLife(id);const p=FAR_NORTH_SETTLEMENT_PROFILES[id],x=farNorthSocietyState1622().settlements[id],q=farNorthCurrentIssue1622(id)||farNorthGenerateIssue1622(id,true),hist=farNorthSocietyState1622().history.filter(h=>h.locId===id).slice(-5).reverse();
 overlay(`<h2>${esc(worldLocation(id).name)} — Northern Affairs</h2>${farNorthCivicSummaryHTML1622(id)}<div class="two-col"><div><h3>Local Institutions</h3><div class="card compact"><b>${esc(p.institution)}</b><br>${esc(p.law)}<br><small>${esc(p.trade)}</small></div><h3>Independent Control</h3><div class="stat-row"><span>Civic confidence</span><b>${Math.round(x.civicConfidence)}/100</b></div><div class="stat-row"><span>Local autonomy</span><b>${x.autonomy.toFixed(1)}/10</b></div><div class="stat-row"><span>Outsider tolerance</span><b>${x.outsiderTolerance.toFixed(1)}/10</b></div>${id==='exium'?'<div class="notice compact">Foreign factions and merchants may maintain temporary contacts at Exium, but routine organized influence does not extend deeper into the Far North.</div>':'<div class="notice compact">Normal southern faction organizations do not maintain routine political infrastructure this deep in the Far North.</div>'}</div><div><h3>Current Local Question</h3>${q?`<div class="card"><b>${esc(q.title)}</b><p>${esc(q.text)}</p><div class="choice-list compact"><button data-northissue="a">${esc(q.a)}</button><button data-northissue="b">${esc(q.b)}</button></div></div>`:'<p class="muted">No major local dispute is active.</p>'}<h3>Recent Decisions</h3>${hist.map(h=>`<div class="card compact"><b>Day ${h.day}: ${esc(h.title)}</b><br>${esc(h.choice)}</div>`).join('')||'<p class="muted">No major northern civic decisions recorded yet.</p>'}</div></div><div class="dialog-footer"><button id="northAffairsBack">Back to Town Life</button></div>`,true);
 document.querySelectorAll('[data-northissue]').forEach(b=>b.onclick=()=>farNorthResolveIssue1622(id,b.dataset.northissue));$('#northAffairsBack').onclick=()=>showTownLife(id)
}

// Northern town jobs and scenes plug into the existing Town Life system.
const _refreshTownLife1622=refreshTownLife;
refreshTownLife=function(locId,force=false){
 _refreshTownLife1622(locId,force);if(!isFarNorthSettlement1622(locId))return;const T=townLifeState(),j=T.jobs[locId];
 if(!j||j.status==='superseded'||j.expiresDay<state.world.day){const d=pick(FAR_NORTH_TOWN_JOBS[locId]);T.jobs[locId]={id:uid(),defId:d.id,title:d.title,kind:d.kind,reward:Math.round(d.reward*settlementPriceModifier(locId)),createdDay:state.world.day,expiresDay:state.world.day+3,status:'available'};const p=settlementProblem(locId);if(p)linkTownJobToMatter(locId,T.jobs[locId])}
};
const _showOpenWorldSettlementTownLife1622=showOpenWorldSettlementTownLife;
showOpenWorldSettlementTownLife=function(locId=state.world.location){
 _showOpenWorldSettlementTownLife1622(locId);if(!isFarNorthSettlement1622(locId))return;const dlg=document.querySelector('.dialog');if(!dlg)return;dlg.classList.add('far-north-town-life');const footer=dlg.querySelector('.dialog-footer');if(!dlg.querySelector('#farNorthTownIdentity')){const box=document.createElement('div');box.id='farNorthTownIdentity';box.innerHTML=`<h3>Northern Settlement</h3>${farNorthCivicSummaryHTML1622(locId)}<button id="farNorthAffairs"><b>Northern Affairs</b><small>Local institutions, disputes, autonomy & outside contact</small></button>`;dlg.insertBefore(box,footer||null);$('#farNorthAffairs').onclick=()=>showFarNorthCivicLife1622(locId)}
};

// External factions do not conduct ordinary politics beyond the Exium gate.
const _showSettlementFactions1622=showSettlementFactions;
showSettlementFactions=function(locId=state.world.location){
 if(!isFarNorthSettlement1622(locId))return _showSettlementFactions1622(locId);const p=FAR_NORTH_SETTLEMENT_PROFILES[locId];
 overlay(`<h2>${esc(worldLocation(locId).name)} — Organized Presence</h2>${farNorthCivicSummaryHTML1622(locId)}${locId==='exium'?'<div class="notice"><b>Gateway exception</b><br>Bluestone, Redstone, Coalition, and other southern interests may send temporary traders, messengers, or representatives to Exium. They do not maintain routine political organizations beyond the gate.</div>':'<div class="notice"><b>Strong Independent local control</b><br>No southern faction maintains routine organized political presence here. Individuals may arrive for exceptional missions, but local institutions remain the normal authority.</div>'}<button id="northFactionAffairs">Open Northern Affairs</button><div class="dialog-footer"><button class="closeModal">Back</button></div>`,true);$('#northFactionAffairs').onclick=()=>showFarNorthCivicLife1622(locId);wireClose()
};
const _showLocalPoliticalActions1622=showLocalPoliticalActions;
showLocalPoliticalActions=function(locId=state.world.location){if(isFarNorthSettlement1622(locId))return showFarNorthCivicLife1622(locId);return _showLocalPoliticalActions1622(locId)};
const _simulateFactionPresence1622=simulateFactionPresence;
simulateFactionPresence=function(){
 _simulateFactionPresence1622();if(!isOpenWorld())return;ensureFactionPresence();for(const id of FAR_NORTH_SETTLEMENTS){const p=state.world.factionPresence[id];if(!p)continue;for(const f of Object.keys(p)){if(f==='Independent')continue;if(id==='exium')p[f]=Math.min(p[f]||0,2);else p[f]=0}const ss=settlementState(id);if(id==='azerdon'&&ss.control!=='Independent')ss.control='Independent'}
};

// Region-specific settlement events use the existing event resolution mechanics.
const FAR_NORTH_EVENTS={
 azerdon:[{id:'north_market',title:'Winter Market Convoy',text:'A rare concentration of northern carriers reaches Azerdon at once, filling the enclosed market lanes.',effect:'prosperity'},{id:'north_watch',title:'Winter Watch Muster',text:'The Winter Watch asks able residents to help inspect roofs, gates, and emergency stores before the next storm.',effect:'security'}],
 karsen:[{id:'north_guides',title:'Missing Road Guide',text:'A guide expected from the eastern road has not arrived, and the Road Wardens are deciding how quickly to search.',effect:'security'},{id:'north_caravan',title:'Crossroads Congestion',text:'Several northern caravans reach Karsen together and compete for teams, shelter, and road information.',effect:'mediate'}],
 decius:[{id:'north_hunters',title:'Hunters Overdue',text:'A hunting pair is overdue from the western snow and their families are preparing a search.',effect:'security'},{id:'north_hides',title:'Heavy Fur Market',text:'An unusually successful trapping run brings more hides into Decius than local buyers can immediately handle.',effect:'prosperity'}],
 velmora:[{id:'north_herds',title:'Herds in Deep Snow',text:'Wind-packed snow has made the herd route dangerous and extra hands are needed to move animals safely.',effect:'aid'},{id:'north_shelter',title:'Shelters Filled',text:'Travelers caught by worsening weather have filled the village’s spare sleeping space.',effect:'mediate'}],
 skallvik:[{id:'north_brawl',title:'Bounty Night Argument',text:'A bounty dispute has turned into a tavern-wide confrontation before anyone has drawn steel.',effect:'mediate'},{id:'north_salvage',title:'Questionable Salvage Auction',text:'A sled of recovered weapons and ironwork is being sold with very few questions about where it came from.',effect:'prosperity'}],
 exium:[{id:'north_transfer',title:'Gate Transfer Backlog',text:'Southern wagons and northern sledges have piled up at the same time, blocking sheds and arguing over handling priority.',effect:'mediate'},{id:'north_foreign',title:'Southern Traders Stranded',text:'A weather closure has left foreign merchants stuck at Exium longer than planned, consuming local rooms and stores.',effect:'aid'}]
};
const _createSettlementEvent1622=createSettlementEvent;
createSettlementEvent=function(locId,force=false){
 if(!isFarNorthSettlement1622(locId))return _createSettlementEvent1622(locId,force);ensureWorldState();const existing=settlementEvent(locId);if(existing&&!force)return existing;if(!force&&!chance(.25))return null;const t=pick(FAR_NORTH_EVENTS[locId]),e={id:uid(),type:t.id,title:t.title,text:t.text,effect:t.effect,createdDay:state.world.day,expiresDay:state.world.day+rnd(1,3),resolved:false};state.world.settlementEvents[locId]=e;recordWorldHistory(`${worldLocation(locId).name}: ${e.title}.`,'info','Far North society');return e
};

// Contract boards skew toward dangerous/local work. Hunt contracts preferentially attach to real northern warbands.
const _generateContract1622=generateContract;
generateContract=function(origin,forcedType=null,opts={}){
 if(!isFarNorthSettlement1622(origin)||forcedType)return _generateContract1622(origin,forcedType,opts);let type;
 if(origin==='azerdon'||origin==='exium')type=pick(['hunt','hunt','procure','escort','visit','recovery']);
 else if(origin==='skallvik')type=pick(['hunt','hunt','hunt','recovery','visit','escort']);
 else type=pick(['hunt','hunt','recovery','visit','procure']);
 const q=_generateContract1622(origin,type,opts);q.faction='Independent';q.northernContract=true;
 if(q.type==='hunt'){const real=(state.world.parties||[]).filter(p=>isFarNorthWarband?.(p)&&!p.engaged&&(p.location===origin||p.destination===origin||worldPartyDisplayRegion(p)==='farnorth')).sort((a,b)=>worldPartyDistanceToPlayer(a)-worldPartyDistanceToPlayer(b))[0];if(real){q.partyId=real.id;q.targetKind=real.kind;q.name=`Hunt ${real.name}`;q.desc=`A real northern warband, ${real.name}, is operating in the Far North. Find and defeat or force the group to yield.`;q.worldLinked=true;q.worldPartyId=real.id;q.worldSourceText=`${real.name} is an actual persistent hostile Party in the Far Northern Region.`}}
 if(q.type==='recovery')q.name=pick(['Recover Lost Northern Cargo','Find a Missing Sledge','Recover Hunter Stores']);
 if(q.type==='visit')q.name=pick(['Scout a Frozen Route','Check an Overdue Trail','Inspect a Northern Road']);
 return q
};

// Keep at least three Independent internal merchant Parties moving through the region.
function ensureFarNorthInternalCaravans1622(){
 if(!isOpenWorld()||!(state.world.unlockedRegions||[]).includes('farnorth'))return;const local=(state.world.parties||[]).filter(p=>p.kind==='merchant'&&worldPartyDisplayRegion(p)==='farnorth'&&!p.crossRegion);let n=local.length;const hubs=['exium','karsen','azerdon','decius','velmora','skallvik'];while(n<3){const from=pick(hubs),p=spawnWorldParty('merchant','farnorth');
  // spawnWorldParty may already have reserved cargo against its provisional spawn route. Refund that provisional reservation before assigning the actual northern route.
  const provisionalOrigin=p.origin||p.location;if(p.economyCargoReserved&&state.world.settlements?.[provisionalOrigin])for(const [gid,qty] of Object.entries(p.manifest||{}))if(qty>0)changeTradeStock(provisionalOrigin,gid,qty);
  p.faction='Independent';p.region='farnorth';p.origin=from;p.location=from;p.destination=pick(hubs.filter(x=>x!==from));p.crossRegion=false;p.name=pick(['Northern Sledge Caravan','Karsen Road Traders','Winter Fur Caravan','Independent Ice-Road Merchants']);p.economyCargoReserved=false;p.manifest={};p.cargo=rnd(2,6);assignMerchantManifest(p);p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays(p.location,p.destination));p.tradeRoute=connectionRouteName(p.location,p.destination);syncTravelerRecord(p);n++}
}
const _maintainWorldParties1622=maintainWorldParties;
maintainWorldParties=function(){const out=_maintainWorldParties1622();ensureFarNorthInternalCaravans1622();return out};

// A small amount of regional civic evolution occurs as days pass.
const _townLifeDailyTick1622=townLifeDailyTick;
townLifeDailyTick=function(){_townLifeDailyTick1622();if(!isOpenWorld()||!(state.world.unlockedRegions||[]).includes('farnorth'))return;const S=farNorthSocietyState1622();if(S.lastTickDay===state.world.day)return;S.lastTickDay=state.world.day;for(const id of FAR_NORTH_SETTLEMENTS){const x=S.settlements[id];if(!farNorthCurrentIssue1622(id)&&chance((id==='azerdon'||id==='exium')?.16:.11))farNorthGenerateIssue1622(id,true);x.civicConfidence=clamp(x.civicConfidence+(settlementState(id).security>=60?.2:-.15),0,100)}ensureFarNorthInternalCaravans1622()};

// Normalize immediately for existing Far North saves.
function normalizeFarNorthFactionPresence1622(){ensureFactionPresence();for(const id of FAR_NORTH_SETTLEMENTS){const p=state.world.factionPresence[id];if(!p)continue;for(const f of Object.keys(p)){if(f==='Independent')continue;if(id==='exium')p[f]=Math.min(p[f]||0,2);else p[f]=0}const ss=settlementState(id);if(id==='azerdon')ss.control='Independent'}}
const _renderOpenWorld1622=renderOpenWorld;
renderOpenWorld=function(){if(isOpenWorld()&&state.world&&(state.world.unlockedRegions||[]).includes('farnorth')){farNorthSocietyState1622();normalizeFarNorthFactionPresence1622();ensureFarNorthInternalCaravans1622()}return _renderOpenWorld1622()};
})();
