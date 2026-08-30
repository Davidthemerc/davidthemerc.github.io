// v1.6.21 — Far North Exploration & Wilderness: persistent northern expeditions, hazards, occupants, legends, and hidden routes
// Final presentation, aftermath readability, and resilient command rendering.
function siegeIIFinalQAState(){
 const S=siegeIICombatState();if(!S)return null;
 if(!S.finalQA||typeof S.finalQA!=='object')S.finalQA={schema:'siege2_final_qa_v1',createdVersion:VERSION,renderRecoveries:0};
 S.finalQA.schema='siege2_final_qa_v1';S.finalQA.renderRecoveries=Math.max(0,Math.floor(Number(S.finalQA.renderRecoveries)||0));return S.finalQA
}
function siegeIIFinalGradeText(A){
 if(!A)return '';
 const victory=A.result==='victory';
 if(victory&&A.score>=85)return 'Shantium emerges battered but unmistakably victorious. The defense preserved both military strength and civic confidence under sustained siege.';
 if(victory&&A.score>=65)return 'Shantium survives with a credible strategic victory. The siege left scars, but the city retained enough strength and cohesion to endure.';
 if(victory)return 'Shantium survives, though at serious cost. The victory will be remembered as endurance more than triumph.';
 if(A.score>=45)return 'The defense ultimately fails, but not before imposing a severe cost on the besiegers and preserving part of Shantium’s fighting spirit.';
 return 'The defense collapses under combined military, civic, and logistical pressure. The campaign record shows where Shantium’s resistance finally broke.';
}
const _siegeIIAftermathHTML16174=siegeIIAftermathHTML;
siegeIIAftermathHTML=function(A){
 if(!A)return '<div class="warning notice"><b>Aftermath unavailable.</b><br>The campaign result is being reconstructed from the current Siege II state.</div>';
 const O=siegeIIOutcomesState(),S=siegeIICombatState(),F=siegeIIForcesState(),B=siegeIIBattlefieldState(),L=siegeIILogisticsState();
 const breaches=(F.breaches||[]).filter(x=>x.status==='open').length,incidents=(B.incidents||[]).filter(x=>x.status==='active').length;
 const record=`${S.battles.wins||0} wins • ${S.battles.defeats||0} defeats • ${S.battles.retreats||0} withdrawals • ${(S.battles.surrenders||0)+(S.battles.enemyWithdrawals||0)} enemy yields`;
 const milestones=[...(O.milestones||[]).map(x=>({...x,tone:'good'})),...(O.setbacks||[]).map(x=>({...x,tone:'bad'}))].sort((a,b)=>(b.assault||0)-(a.assault||0)).slice(0,8);
 return `<div class="siege2-aftermath-hero ${A.result==='victory'?'victory':'defeat'}"><small>CAMPAIGN COMPLETE</small><h2>${esc(A.title)}</h2><b>${esc(A.grade)} • ${A.score}/100</b><p>${esc(A.text)}</p><p class="compact">${esc(siegeIIFinalGradeText(A))}</p></div><div class="siege2-aftermath-grid"><div class="card"><h4>Military Result</h4><div class="stat-row"><span>Final assault</span><b>${A.assault}</b></div><div class="stat-row"><span>Battle record</span><b>${esc(record)}</b></div><div class="stat-row"><span>Defenders remaining</span><b>${A.defenders}</b></div><div class="stat-row"><span>Besiegers remaining</span><b>${A.besiegers}</b></div><div class="stat-row"><span>Final position</span><b>${esc(A.position)}</b></div></div><div class="card"><h4>Shantium at the End</h4><div class="stat-row"><span>Defender morale</span><b>${A.defenderMorale}</b></div><div class="stat-row"><span>Civilian morale</span><b>${A.civilianMorale}</b></div><div class="stat-row"><span>Logistics</span><b>${A.logistics}%</b></div><div class="stat-row"><span>Authority / legitimacy</span><b>${A.authority} / ${A.legitimacy}</b></div><div class="stat-row"><span>Breaches / incidents</span><b>${breaches} / ${incidents}</b></div></div></div><div class="notice compact"><b>Final stores:</b> Food ${L.stocks.food} • Medicine ${L.stocks.medicine} • Materials ${L.stocks.materials} • Arms ${L.stocks.arms}<br><b>Siege fatigue:</b> ${O.siegeFatigue}/100</div>${milestones.length?`<h3>Defining Moments</h3><div class="siege2-aftermath-timeline">${milestones.map(x=>`<div class="${x.tone}"><b>Assault ${x.assault} — ${esc(x.title)}</b><small>${esc(x.text)}</small></div>`).join('')}</div>`:''}`;
};
// Resilient final renderer: preserve normal UI, but never strand a valid Siege II save on an optional dashboard render error.
const _renderSiegeIICommand16174=renderSiegeIICommand;
renderSiegeIICommand=function(){
 if(!isSiegeModeII())return _renderSiegeIICommand16174();
 try{siegeIIFinalQAState();return _renderSiegeIICommand16174();}
 catch(err){
  console.error('Siege II command render recovery',err);const Q=siegeIIFinalQAState();if(Q)Q.renderRecoveries++;try{save()}catch(_e){}
  const msg=err&&err.message?err.message:'Unknown command-screen error';
  document.getElementById('app').innerHTML=`<div class="menu-screen"><div class="menu-window"><h1 class="menu-title" style="font-size:28px">SIEGE MODE II</h1><div class="warning notice"><b>Command screen recovered from a display error.</b><br>Your campaign state remains loaded. Retry the command dashboard or use the menu to save/export before continuing.</div><p class="compact muted">${esc(msg)}</p><div class="menu-actions"><button id="siege2QARetry">Retry Command Screen</button><button id="siege2QAMenu">Game Menu</button></div></div></div>`;
  $('#siege2QARetry').onclick=()=>_renderSiegeIICommand16174();$('#siege2QAMenu').onclick=gameMenu;
 }
};renderSiegeIIFoundation=renderSiegeIICommand;


// v1.6.20 — Far North Parties & Combat
// Northern warbands preserve the canonical bandit/raider kinds underneath so existing
// contracts, law, route pressure, security, combat aftermath, and persistence logic still work.
const FAR_NORTH_WARBAND_ARCHETYPES={
 frost_reavers:{id:'frost_reavers',label:'Frost Reaver Warband',baseKind:'raiders',faction:'Raiders',morale:74,levelBonus:2,doctrine:{name:'Frost Reaver Shock Line',formation:'Shield-and-axe wedge',morale:74,surrender:.62,withdraw:.72,reinforce:.10,leaderRole:'captain',tactic:'shock'},roles:[['Frost Reaver Captain','captain'],['Huskarl Veteran','veteran'],['Northland Berserker','berserker'],['Shield Raider Guard','guard'],['Frostbow Archer','archer'],['Ice Spearman','spearman']]},
 wolfcloaks:{id:'wolfcloaks',label:'Wolfcloak Outlaw Party',baseKind:'bandits',faction:'Outlaws',morale:68,levelBonus:1,doctrine:{name:'Wolfcloak Hunt',formation:'Loose stalking line',morale:68,surrender:.82,withdraw:1.18,reinforce:.06,leaderRole:'captain',tactic:'mobile'},roles:[['Wolfcloak Captain','captain'],['Snow Stalker Scout','scout'],['Frostbow Archer','archer'],['Spear Hunter','spearman'],['Rogue Skirmisher Scout','scout']]},
 oathless:{id:'oathless',label:'Oathless Warband',baseKind:'raiders',faction:'Outlaws',morale:78,levelBonus:3,doctrine:{name:'Oathless Veteran Line',formation:'Hard veteran line',morale:78,surrender:.55,withdraw:.82,reinforce:.08,leaderRole:'captain',tactic:'professional'},roles:[['Oathless Captain','captain'],['Huskarl Veteran','veteran'],['Northland Berserker','berserker'],['Shield Raider Guard','guard'],['Crossbow Raider','crossbow'],['Rogue Gunner Scout','scout']]},
 ice_brigands:{id:'ice_brigands',label:'Ice-Road Brigands',baseKind:'bandits',faction:'Outlaws',morale:64,levelBonus:1,doctrine:{name:'Ice-Road Ambushers',formation:'Broken roadside screen',morale:64,surrender:.94,withdraw:1.22,reinforce:.05,leaderRole:'brigand',tactic:'skirmish'},roles:[['Ice-Road Captain','captain'],['Ice-Road Brigand','brigand'],['Crossbow Brigand','crossbow'],['Snow Scout','scout'],['Spear Brigand','spearman']]}
};
const FAR_NORTH_WARBAND_NAMES={
 frost_reavers:['The Skeld Reavers','Torvald’s Axes','The Frostbound','The White Wolves','Hrold’s Reavers'],
 wolfcloaks:['Hrold’s Wolfcloaks','The Wolfcloak Company','The Black Wolf Band','Sten’s Winter Wolves','The Pale Cloaks'],
 oathless:['Vargan’s Oathless','The Sons of Harken','The Oathless of Skar','Runa’s Exiles','The Broken Oath Company'],
 ice_brigands:['The Ice-Road Brotherhood','The Black Elk Band','Kjell’s Roadmen','The Snowcutters','The Frozen Tollmen']
};
const FAR_NORTH_PERSON_NAMES=['Hrold','Torvald','Vargan','Sten','Kjell','Halvar','Eirik','Soren','Skeld','Harken','Runa','Sigrun','Brynja','Astrid','Freydis','Yrsa','Inga','Leif','Arvid','Gunnar','Tove','Solveig','Edda','Rurik'];
const FAR_NORTH_SURNAMES=['Skeldson','Harkensson','Vargasson','Iceborn','Snowmark','Wolfcloak','Stonehand','Frostvein','Whiteaxe','Rimewalker','Blackelk','Coldwater','Winterson'];
function farNorthWarbandDef(pOrId){const id=typeof pOrId==='string'?pOrId:pOrId?.northernArchetype;return FAR_NORTH_WARBAND_ARCHETYPES[id]||null}
function isFarNorthWarband(p){return !!farNorthWarbandDef(p)}
function farNorthWarbandUsedNames(){return new Set([...(state.world?.parties||[]).map(p=>p.name),...Object.values(state.world?.travelerRegistry?.records||{}).map(r=>r.name)])}
function farNorthWarbandName(id){const rows=FAR_NORTH_WARBAND_NAMES[id]||['Northern Warband'],used=farNorthWarbandUsedNames(),free=rows.filter(x=>!used.has(x));return pick(free.length?free:rows)}
function farNorthPersonName(used){for(let i=0;i<30;i++){const n=`${pick(FAR_NORTH_PERSON_NAMES)} ${pick(FAR_NORTH_SURNAMES)}`;if(!used.has(n)){used.add(n);return n}}const n=`${pick(FAR_NORTH_PERSON_NAMES)} of ${rnd(1,99)}`;used.add(n);return n}
function farNorthWarbandIdentity(p,def){
 const used=new Set(),count=Math.max(4,Math.min(7,rnd(4,def.baseKind==='raiders'?7:6))),members=[];
 for(let i=0;i<count;i++){const role=def.roles[i<def.roles.length?i:rnd(1,def.roles.length-1)];members.push({id:`north_person_${uid()}`,name:farNorthPersonName(used),role:role[0],combatRole:role[1],age:'adult',status:'active'})}
 p.travelerId=p.travelerId||`north_warband_${uid()}`;p.groupIdentity={type:'company',groupName:p.name,summary:`A hardened Far Northern ${def.label.toLowerCase()} operating beyond routine southern authority.`,members};
 p.combatComposition=members.map(m=>({id:m.id,label:m.name,role:m.combatRole,status:'active',named:true,travelerPersonId:m.id}));p.memberCount=count;p.combatantCount=count;p.compositionSource='named_identity';
 const R=travelerRegistryState(),r=travelerRecord(p);r.name=p.name;r.genericName=def.label;r.kind=p.kind;r.faction=p.faction;r.identity=p.groupIdentity;r.northernWarband=true;r.northernArchetype=def.id;r.locationStatus='traveling';r.combatComposition=p.combatComposition.map(x=>({...x}));r.memberCount=count;r.compositionSource='named_identity';syncTravelerRecord(p);return p
}
function convertToFarNorthWarband(p,archetype=null){
 if(!p)return null;const id=archetype||pick(Object.keys(FAR_NORTH_WARBAND_ARCHETYPES)),def=FAR_NORTH_WARBAND_ARCHETYPES[id];p.kind=def.baseKind;p.northernArchetype=id;p.northernWarband=true;p.northernPersistent=true;p.northernAvoidant=true;p.northernAggressive=chance(.12);p.faction=def.faction;p.attitude='hostile';p.name=farNorthWarbandName(id);p.genericName=def.label;p.purpose='Hunting, raiding, hiding, and surviving in the Far North';p.combatLevel=clamp(rollWorldPartyCombatLevel(p.kind)+def.levelBonus,Math.min(40,Math.max(4,(state.level||1)-1)),42);p.doctrine={...def.doctrine};p.formation=def.doctrine.formation;p.morale=def.morale;farNorthWarbandIdentity(p,def);ensureWorldPartyDoctrine(p);syncTravelerRecord(p);return p
}
function spawnFarNorthWarband(archetype=null){const id=archetype||pick(Object.keys(FAR_NORTH_WARBAND_ARCHETYPES)),def=FAR_NORTH_WARBAND_ARCHETYPES[id],p=spawnWorldParty(def.baseKind,'farnorth');return convertToFarNorthWarband(p,id)}
function farNorthWarbandNormalize(){
 if(!isOpenWorld()||!state.world)return 0;let n=0;
 for(const p of state.world.parties||[]){if(worldPartyDisplayRegion(p)!=='farnorth')continue;if(['bandits','raiders'].includes(p.kind)&&!p.northernArchetype){convertToFarNorthWarband(p,p.kind==='raiders'?pick(['frost_reavers','oathless']):pick(['wolfcloaks','ice_brigands']));n++}else if(isFarNorthWarband(p)){p.northernPersistent=true;p.northernAvoidant=true;if(typeof p.northernAggressive!=='boolean')p.northernAggressive=false;const def=farNorthWarbandDef(p);p.genericName=def.label;p.attitude='hostile';p.faction=def.faction;if(!p.groupIdentity&&!travelerRegistryState().records[p.travelerId]?.identity)farNorthWarbandIdentity(p,def)}}
 return n
}

const _purposefulDestination1620=purposefulDestination;
purposefulDestination=function(kind,from){
 const region=locationRegion(from);if(region!=='farnorth')return _purposefulDestination1620(kind,from);
 const north={merchant:['exium','karsen','azerdon','decius','velmora','skallvik'],refugees:['azerdon','karsen','exium','velmora'],mercenary:['skallvik','karsen','roguehold','exium'],bandits:['skallvik','snowcaves','roguehold','whitescar','decius'],raiders:['roguehold','whitescar','standingstones','karsen','velmora']};
 const ids=(north[kind]||['exium','karsen','azerdon','decius','velmora','skallvik']).filter(x=>x!==from);return pick(ids.length?ids:['exium'])
};
const _worldPartyTypeLabel1620=worldPartyTypeLabel;
worldPartyTypeLabel=function(p){const d=farNorthWarbandDef(p);return d?d.label:_worldPartyTypeLabel1620(p)};
const _namedTravelerRoamingCap1620=namedTravelerRoamingCap;
namedTravelerRoamingCap=function(region){return region==='farnorth'?14:_namedTravelerRoamingCap1620(region)};
const _worldPartyDoctrine1620=worldPartyDoctrine;
worldPartyDoctrine=function(pOrKind,region=null){const p=typeof pOrKind==='object'?pOrKind:null,d=farNorthWarbandDef(p);if(d)return {...d.doctrine};return _worldPartyDoctrine1620(pOrKind,region)};
const _openWorldEnemyPool1620=openWorldEnemyPool;
openWorldEnemyPool=function(p,targetLevel){const d=farNorthWarbandDef(p);if(!d)return _openWorldEnemyPool1620(p,targetLevel);const proxy={...p,kind:d.id==='oathless'?'mercenary':d.baseKind};return _openWorldEnemyPool1620(proxy,targetLevel)};
const _worldPartyThreatKindFactor1620=worldPartyThreatKindFactor;
worldPartyThreatKindFactor=function(kind){return _worldPartyThreatKindFactor1620(kind)};
const _worldPartyCombatLevel1620=worldPartyCombatLevel;
worldPartyCombatLevel=function(p){if(!isFarNorthWarband(p))return _worldPartyCombatLevel1620(p);const d=farNorthWarbandDef(p),player=Math.max(1,state.level||1),floor=d.id==='oathless'?7:d.id==='frost_reavers'?6:5,cap=42;if(!Number.isFinite(p.combatLevel))p.combatLevel=player+d.levelBonus;p.combatLevel=clamp(Math.round(p.combatLevel),floor,Math.min(cap,Math.max(floor,player+3)));return p.combatLevel};
const _worldPartyThreatProfile1620=worldPartyThreatProfile;
worldPartyThreatProfile=function(p){const x=_worldPartyThreatProfile1620(p);const d=farNorthWarbandDef(p);if(d){x.targetRatio=clamp(x.targetRatio*(d.id==='oathless'?1.13:d.id==='frost_reavers'?1.09:1.05),.38,1.9);x.northern=true}return x};
const _encounterFormationTuning1620=encounterFormationTuning;
encounterFormationTuning=function(doctrine,members){_encounterFormationTuning1620(doctrine,members);if(!members?.length)return;if(/Frost Reaver|Oathless|Wolfcloak|Ice-Road/.test(doctrine?.name||'')){for(const e of members){e.acc=clamp((e.acc||60)+2,45,94);if(/archer|crossbow|scout|veteran|captain/i.test(e.worldPartyRole||e.travelerRole||e.groupRoleLabel||''))e.init=(e.init||5)+1}}};
const _worldEncounterLeaderQuote1620=worldEncounterLeaderQuote;
worldEncounterLeaderQuote=function(p){const d=farNorthWarbandDef(p);if(!d)return _worldEncounterLeaderQuote1620(p);const rows={frost_reavers:['“The south made you soft. Draw steel.”','“You came north looking for trouble. Here it is.”'],wolfcloaks:['“Keep your distance and live. Close it, and we hunt.”','“Snow hides more than tracks.”'],oathless:['“No lord owns us. No law shields you.”','“We broke our oaths before you ever crossed the ice.”'],ice_brigands:['“Road’s ours while the snow holds.”','“You can pass. You just won’t like the price.”']};return pick(rows[d.id]||['“Turn back.”'])};

const _regionalPartyTarget1620=regionalPartyTarget;
regionalPartyTarget=function(region){if(region==='farnorth')return{total:10,hostile:5};return _regionalPartyTarget1620(region)};
maintainWorldParties=function(){
 ensureWorldState();refreshTravelerMemberStatuses();farNorthWarbandNormalize();const keep=[];
 for(const p of state.world.parties){const live=p.northernPersistent||p.tradeProcurementCaravan||p.contractProtected||(p.questId&&activeQuest(p.questId))||p.id===state.world.trackedPartyId||state.world.day-(p.createdDay||1)<22;if(live)keep.push(p);else archiveTravelerParty(p,SOSText("economy_trade_world_parties.maintainWorldParties.001"))}
 state.world.parties=keep;if(state.world.trackedPartyId&&!state.world.parties.some(p=>p.id===state.world.trackedPartyId))state.world.trackedPartyId=null;manageNamedTravelerPopulation();reconcileNamedTravelerLifecycles(false);const unlocked=state.world.unlockedRegions||['shantium'];
 for(const region of unlocked){const target=regionalPartyTarget(region);let local=state.world.parties.filter(p=>worldPartyDisplayRegion(p)===region);
  if(region==='farnorth'){
   // Foreign routine faction traffic stops at Exium. Old leaked parties are turned back rather than allowed deeper north.
   for(const p of local.filter(p=>['redstone','coalition','bluestone','spawn'].includes(p.kind)&&!p.contractProtected&&!p.securityResponse)){p.location='exium';p.origin='exium';p.destination=chance(.5)?'grayhaven':'crownpass';p.crossRegion=true;p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays('exium',p.destination));p.tradeRoute=connectionRouteName('exium',p.destination)}
   local=state.world.parties.filter(p=>worldPartyDisplayRegion(p)===region);let hostile=local.filter(p=>isFarNorthWarband(p));
   if(!state.world.farNorthWarbandPopulationSeeded){while(hostile.length<target.hostile){const p=spawnFarNorthWarband();hostile.push(p);local.push(p)}state.world.farNorthWarbandPopulationSeeded=true;state.world.farNorthWarbandLastSpawnDay=state.world.day}
   else if(hostile.length<target.hostile&&state.world.day-(state.world.farNorthWarbandLastSpawnDay||0)>=2){const p=spawnFarNorthWarband();hostile.push(p);local.push(p);state.world.farNorthWarbandLastSpawnDay=state.world.day}
   const trafficKinds=['merchant','merchant','mercenary','refugees'],civilTarget=Math.max(3,target.total-target.hostile);let civil=local.filter(p=>!isFarNorthWarband(p)&&!['redstone','coalition','bluestone','spawn'].includes(p.kind));while(civil.length<civilTarget){const p=spawnWorldParty(pick(trafficKinds),'farnorth');if(p.kind==='merchant'||p.kind==='refugees')p.faction='Independent';p.region='farnorth';civil.push(p);local.push(p)}continue
  }
  let hostile=local.filter(p=>['bandits','raiders'].includes(p.kind));while(hostile.length<target.hostile){const p=spawnWorldParty(chance(.56)?'bandits':'raiders',region);hostile.push(p);local.push(p)}const trafficKinds=region==='redstone'?['redstone','merchant','merchant','mercenary','refugees','coalition','spawn']:region==='bluestone'?['bluestone','merchant','merchant','mercenary','refugees','coalition','spawn']:['merchant','merchant','coalition','redstone','mercenary','refugees','spawn'];while(local.length<target.total){const p=spawnWorldParty(pick(trafficKinds),region);local.push(p)}
 }
};

const _resolveWorldPartyArrival1620=resolveWorldPartyArrival;
resolveWorldPartyArrival=function(p){const north=isFarNorthWarband(p),loc=p?.location,ss=loc?state.world.settlements?.[loc]:null,before=ss?{security:ss.security,prosperity:ss.prosperity}:null;const out=_resolveWorldPartyArrival1620(p);if(north&&ss&&before&&ss.security===before.security&&ss.prosperity===before.prosperity){if(!settlementProblem(loc)&&chance(.24))createSettlementProblem(loc,'raider_pressure');ss.security=Math.max(0,ss.security-rnd(2,5));ss.prosperity=Math.max(0,ss.prosperity-rnd(1,3));if(state.world.day-ss.lastEventDay>=2){log(`${p.name} presses close to ${worldLocation(loc).name}, worsening local security.`,'bad');ss.lastEventDay=state.world.day}}return out};

const _roadEventWeightedPick1620=roadEventWeightedPick;
roadEventWeightedPick=function(ctx=null){
 if((ctx?.region||currentWorldRegion())!=='farnorth')return _roadEventWeightedPick1620(ctx);const pool=[],profile=ctx?.route||roadConditionProfile(ctx?.from||state.world.location,ctx?.to||state.world.location),hostileIds=['ambush','toll','camp','deserters','ruined_caravan','escaped_prisoner'],safeIds=['traffic','pilgrims','messenger','road_healer','hunters','envoy','patrol'];
 for(const e of ROAD_EVENT_TYPES){let w=e.weight;if(e.id==='bounty_hunter'&&!hasWarrant(ctx?.to||state.world.location))w=1;if(hostileIds.includes(e.id))w=Math.max(1,Math.round(w*profile.hostileMod*.30));if(safeIds.includes(e.id))w=Math.max(1,Math.round(w*.72));if(e.id==='weather')w+=12;if(e.id==='blocked')w+=5;if(e.id==='hunters')w+=4;if(e.id==='ruined_caravan')w+=3;if(e.id==='traffic')w=Math.max(1,w-3);if(e.id==='envoy'||e.id==='pilgrims')w=1;const recent=(state.world.roadEventHistory||[]).slice(-3).map(x=>x.event),repeats=recent.filter(id=>id===e.id).length;if(repeats)w=Math.max(1,Math.round(w*(repeats>=2?.18:.42)));for(let i=0;i<w;i++)pool.push(e)}return pick(pool)
};
roadAmbushLikelyParty=function(ctx){const region=ctx?.region||currentWorldRegion(),candidates=(state.world.parties||[]).filter(p=>['bandits','raiders'].includes(p.kind)&&worldPartyDisplayRegion(p)===region&&!p.engaged&&!partyInLiveConflict(p.id)&&(region!=='farnorth'||!isFarNorthWarband(p)||p.northernAggressive));if(!candidates.length)return null;const endpoints=new Set([ctx?.from,ctx?.to]);return candidates.sort((a,b)=>((endpoints.has(b.location)?3:0)+(endpoints.has(b.destination)?2:0)+(b.morale||50)/100)-((endpoints.has(a.location)?3:0)+(endpoints.has(a.destination)?2:0)+(a.morale||50)/100))[0]||null};
const _ensureRoadAmbushParty1620=ensureRoadAmbushParty;
ensureRoadAmbushParty=function(ctx){if((ctx?.region||currentWorldRegion())!=='farnorth')return _ensureRoadAmbushParty1620(ctx);let p=roadAmbushLikelyParty(ctx);if(!p){p=spawnFarNorthWarband(chance(.55)?'ice_brigands':'wolfcloaks');p.northernAggressive=true}p.attitude='hostile';p.status='engaged';p.roadAmbush=true;p.lastRoadAmbushDay=state.world.day;const loc=ctx?.to||ctx?.from||state.world.location;p.location=loc;p.destination=loc;p.travelLeft=0;p.travelTotal=Math.max(1,p.travelTotal||1);p.region='farnorth';ensureWorldPartyComposition(p);ensureWorldPartyDoctrine(p);syncTravelerRecord(p);playerPartyMoveBesideWorldParty(p);return p};

// Map/UI styling hook for northern warbands without changing the canonical base kind.
const _worldPartyHTML1620=typeof worldPartyHTML==='function'?worldPartyHTML:null;
if(_worldPartyHTML1620)worldPartyHTML=function(p){let html=_worldPartyHTML1620(p);if(isFarNorthWarband(p))html=html.replace('world-party ','world-party northern-warband ');return html};
const _regionalPartyCardHTML1620=regionalPartyCardHTML;
regionalPartyCardHTML=function(p){let html=_regionalPartyCardHTML1620(p);if(isFarNorthWarband(p))html=html.replace('</small></span><span class="regional-party-meta">',` • keeps its distance unless approached</small></span><span class="regional-party-meta">`);return html};

// Normalize immediately after loading a v1.6.18/1.6.19 Far North save.
const _renderOpenWorld1620=renderOpenWorld;
renderOpenWorld=function(){if(isOpenWorld()&&state.world){farNorthWarbandNormalize();if((state.world.unlockedRegions||[]).includes('farnorth')&&!state.world.farNorthCombatV1620){maintainWorldParties();state.world.farNorthCombatV1620=true;save()}}return _renderOpenWorld1620()};


// v1.6.21 — Far North Exploration & Wilderness
const FAR_NORTH_EXPEDITION_SITES=['roguehold','snowcaves','standingstones','whitescar'];
function isFarNorthExpeditionSite(id){return FAR_NORTH_EXPEDITION_SITES.includes(id)}

// These are mapped regional landmarks, but their internal spaces use the same persistent
// Exploration III machinery as the world's hidden major sites.
Object.assign(HIDDEN_INTERIORS,{
 roguehold:{title:'Roguehold Castle',rooms:[
  {id:'icegate',name:'Frozen Gatehouse',text:'The gatehouse is split by frost and old impact scars. Tracks vanish under drifted snow, but someone has cleared a narrow way through.',links:['courtyard'],action:'observe'},
  {id:'courtyard',name:'Snow-Choked Courtyard',text:'Broken carts, frozen troughs, and half-buried barricades divide the courtyard. Boot prints lead toward both the barracks and the keep.',links:['icegate','barracks','keep'],action:'threat'},
  {id:'barracks',name:'Abandoned Barracks',text:'Bedframes and old weapon racks have been reused by generations of fugitives. Fresh ash proves the building is not always abandoned.',links:['courtyard','armory'],action:'search'},
  {id:'armory',name:'Rime Armory',text:'A stone armory survives behind a warped iron door. Most military stores are gone, but northern raiders have hidden replacement gear here.',links:['barracks','wallwalk'],action:'treasure'},
  {id:'wallwalk',name:'Wind-Battered Wall Walk',text:'The wall walk overlooks the southern ice road and the dark line of Velmora country. A concealed stair drops toward the outer slope.',links:['armory','postern'],action:'observe'},
  {id:'keep',name:'Roguehold Keep',text:'The keep hall is scarred by old fires and newer knife marks. Makeshift benches suggest warbands still use it for councils.',links:['courtyard','chapel','undercroft'],action:'threat'},
  {id:'chapel',name:'Ruined Oath Chapel',text:'Names have been cut from the old stone tablets. Later hands carved broken rings and axe marks where formal oaths once stood.',links:['keep'],action:'lore'},
  {id:'undercroft',name:'Frozen Undercroft',text:'A vaulted undercroft holds old cells, smuggled stores, and a blocked escape tunnel packed with blue ice.',links:['keep','postern'],action:'trap'},
  {id:'postern',name:'Hidden Postern Trail',text:'A concealed postern opens onto a wind-cut trail descending toward the Exium road. Whoever knows this path can bypass the obvious castle approach.',links:['wallwalk','undercroft'],action:'lore'}]},
 snowcaves:{title:'Snow Caves',rooms:[
  {id:'mouth',name:'Drifted Cave Mouth',text:'Wind has packed the entrance nearly shut. Animal tracks and boot prints overlap in the narrow opening.',links:['bluehall'],action:'observe'},
  {id:'bluehall',name:'Blue-Ice Hall',text:'A broad chamber glows with cold blue light beneath layers of ancient ice. Every sound carries farther than it should.',links:['mouth','crawl','split'],action:'strange'},
  {id:'crawl',name:'Low Ice Crawl',text:'The passage tightens beneath a sagging shelf of ice. Old rope and chipped footholds show that people still use it.',links:['bluehall','huntercache'],action:'trap'},
  {id:'huntercache',name:'Hunter Cache',text:'A dry pocket contains wrapped food, hides, lamp oil, and a few scratched route marks left by northern hunters.',links:['crawl'],action:'supplies'},
  {id:'split',name:'Frozen Split',text:'The cave divides around a pillar of stone and opaque ice. One branch descends toward running water; the other carries smoke.',links:['bluehall','grotto','hideout'],action:'observe'},
  {id:'grotto',name:'Under-Ice Grotto',text:'Black water moves beneath a thin crust of ice. Mineral shelves and old bones line the chamber.',links:['split','windtunnel'],action:'strange'},
  {id:'hideout',name:'Smuggler Hollow',text:'Bedrolls, cut timber, and weapon wrappings turn a natural chamber into a rough hideout.',links:['split','windtunnel'],action:'threat'},
  {id:'windtunnel',name:'Hunter’s Wind Tunnel',text:'A narrow tunnel rises toward daylight. The draft carries smoke from the Skallvik side of the western heights.',links:['grotto','hideout'],action:'lore'}]},
 standingstones:{title:'Standing Stone Tundra',rooms:[
  {id:'southmarker',name:'Southern Marker Field',text:'The first stones rise from the tundra like black teeth, each taller than a mounted rider and scarred by wind.',links:['ring','weststones'],action:'observe'},
  {id:'ring',name:'Great Stone Ring',text:'A vast ring of standing stones surrounds an empty snowfield. Their spacing seems deliberate, but no modern road follows the pattern.',links:['southmarker','northline','sunken'],action:'lore'},
  {id:'weststones',name:'Windward Stones',text:'The western stones are half buried by drifted snow. Sheltered pockets contain old camp traces and carved tally marks.',links:['southmarker','sunken'],action:'search'},
  {id:'sunken',name:'Sunken Processional',text:'Between two rows of stones, the ground falls into a shallow ancient road hidden beneath the tundra.',links:['ring','weststones','northline'],action:'trap'},
  {id:'northline',name:'Northern Alignment',text:'The northern stones point directly toward the distant heights below Azerdon. A series of smaller markers continues beyond the mapped field.',links:['ring','sunken','watchstone'],action:'observe'},
  {id:'watchstone',name:'The Watch Stone',text:'The tallest monolith bears shallow symbols visible only where the wind has polished the ice away. The marks describe a route, not a monument.',links:['northline'],action:'lore'}]},
 whitescar:{title:'The White Scar',rooms:[
  {id:'rim',name:'Western Rim',text:'The glacier has split into a vast pale wound. Wind pours through the ravine hard enough to erase tracks in minutes.',links:['shelf'],action:'observe'},
  {id:'shelf',name:'Ice Shelf Traverse',text:'A narrow shelf clings to the ravine wall above blue depth. Old iron spikes remain where travelers once fixed ropes.',links:['rim','bridge','lowercut'],action:'trap'},
  {id:'bridge',name:'Broken Ice Bridge',text:'A collapsed natural bridge once crossed the Scar. The remaining arch can still be used, but only with careful footing.',links:['shelf','eastledge'],action:'trap'},
  {id:'lowercut',name:'Lower Ravine Cut',text:'A steep descent reaches a sheltered cut filled with old camps, frozen packs, and signs of recent armed passage.',links:['shelf','cave'],action:'threat'},
  {id:'cave',name:'Scar Shelter',text:'A shallow cave in the ravine wall offers rare protection from the wind. Old route marks point east toward Velmora.',links:['lowercut','eastledge'],action:'supplies'},
  {id:'eastledge',name:'Eastern Ledge',text:'The eastern ledge overlooks the route to Velmora. From here the ravine is less a barrier than a hidden corridor.',links:['bridge','cave','marker'],action:'observe'},
  {id:'marker',name:'White Scar Marker',text:'A weathered stone marker records an old winter road through the ravine, abandoned after repeated disappearances.',links:['eastledge'],action:'lore'}]}
});

Object.assign(EXPLORATION_III_HAZARDS,{
 northern_cold:{name:'Killing Cold',stat:'wis',dc:16,success:'The party layers shelter, movement, and exposure time carefully enough to cross without serious cold injury.',failure:'The cold gets through clothing and armor before adequate shelter is found.',hp:[4,10]},
 blue_ice:{name:'Blue-Ice Passage',stat:'dex',dc:16,success:'The party tests the ice and secures each difficult crossing before committing weight.',failure:'A slick crossing gives way beneath the expedition.',hp:[5,11]},
 whiteout:{name:'Tundra Whiteout',stat:'wis',dc:16,success:'Stone alignments and wind direction keep the expedition oriented when the horizon disappears.',failure:'The whiteout scatters the route and leaves the party exposed far longer than intended.',hp:[3,9]},
 ice_ravine:{name:'Glacial Ravine',stat:'dex',dc:17,success:'Ropes, old spikes, and careful route finding get the party through the Scar safely.',failure:'A bad traverse on the ravine wall causes a hard fall and exhausting recovery.',hp:[5,12]}
});
Object.assign(EXPLORATION_III_SITE_PROFILES,{
 roguehold:{legend:'The Oathless Postern',summary:'Northern outlaws insist Roguehold has never truly been sealed; an old escape path still reaches the Exium road beneath the southern wall.',hazard:'northern_cold',linkedSettlement:'velmora',worldEffect:'security',routeTo:'exium'},
 snowcaves:{legend:'The Hunter’s Breath',summary:'Skallvik hunters say smoke can travel through the Snow Caves and emerge miles away on the western heights.',hazard:'blue_ice',linkedSettlement:'decius',worldEffect:'route',routeTo:'skallvik'},
 standingstones:{legend:'The Road Before Roads',summary:'The standing stones are said to mark a winter route older than Azerdon itself, visible only when the snow covers newer tracks.',hazard:'whiteout',linkedSettlement:'karsen',worldEffect:'scouting',routeTo:'azerdon'},
 whitescar:{legend:'The Scar Road',summary:'Old Velmoran families claim the White Scar was once used as a hidden winter road rather than treated as a barrier.',hazard:'ice_ravine',linkedSettlement:'velmora',worldEffect:'route',routeTo:'velmora'}
});
for(const id of FAR_NORTH_EXPEDITION_SITES){const loc=worldLocation(id);if(loc){loc.siteKind=id==='roguehold'?'frozen ruin':id==='snowcaves'?'ice cave':id==='standingstones'?'ancient tundra landmark':'glacial ravine';}const d=HIDDEN_INTERIORS[id];if(d)for(const r of d.rooms)r.final=false}

const FAR_NORTH_EXPLORATION_OCCUPANTS={
 roguehold:[
  {kind:'hostiles',name:'A northern warband using the castle',attitude:'hostile'},
  {kind:'salvagers',name:'Skallvik scavengers stripping old ironwork',attitude:'wary'},
  {kind:'squatters',name:'Fugitives sheltering behind the ruined walls',attitude:'neutral'}],
 snowcaves:[
  {kind:'hunters',name:'Decius hunters sheltering in the caves',attitude:'friendly'},
  {kind:'hostiles',name:'Ice-road outlaws using a hidden chamber',attitude:'hostile'},
  {kind:'investigators',name:'Azerdon route surveyors mapping the cave drafts',attitude:'neutral'}],
 standingstones:[
  {kind:'investigators',name:'Azerdon antiquarians measuring the stones',attitude:'neutral'},
  {kind:'pilgrims',name:'Northern travelers leaving winter tokens at the ring',attitude:'friendly'},
  {kind:'hunters',name:'Karsen scouts using the stones as windbreaks',attitude:'neutral'}],
 whitescar:[
  {kind:'hunters',name:'Velmoran guides testing the ravine route',attitude:'friendly'},
  {kind:'salvagers',name:'A recovery crew searching frozen packs below the rim',attitude:'wary'},
  {kind:'hostiles',name:'Wolfcloak scouts watching the eastern ledges',attitude:'hostile'}]
};
const _assignExplorationIIIOccupant1621=assignExplorationIIIOccupant;
assignExplorationIIIOccupant=function(id,siteState=null){
 if(!isFarNorthExpeditionSite(id))return _assignExplorationIIIOccupant1621(id,siteState);
 const S=siteState||explorationIIISiteState(id,true);if(S.occupant)return S.occupant;
 // Prefer a real persistent northern Party already occupying the landmark.
 const actual=(state.world.parties||[]).find(p=>isFarNorthWarband?.(p)&&(p.location===id||p.destination===id)&&!p.engaged);
 if(actual){S.occupant={id:`expocc_${id}_${actual.id}`,name:actual.name,kind:'hostiles',attitude:'hostile',arrivedDay:state.world.day,actualPartyId:actual.id};S.occupantStatus='present';explorationIIIRecord(id,`${actual.name} are occupying or watching the site.`,'bad');return S.occupant}
 const d=pick(FAR_NORTH_EXPLORATION_OCCUPANTS[id]),name=d.name;S.occupant={id:`expocc_${id}_${state.world.day}`,name,kind:d.kind,attitude:d.attitude,arrivedDay:state.world.day};S.occupantStatus='present';explorationIIIRecord(id,`${name} are now associated with the site.`,'info');return S.occupant
};

// If a persistent warband is the site's occupant, the interaction opens that actual Party rather
// than pretending a dialogue result removed a world entity.
const _showExplorationIIISitePanel1621=showExplorationIIISitePanel;
showExplorationIIISitePanel=function(id){
 if(isFarNorthExpeditionSite(id)){const S=explorationIIISiteState(id);if(!S.occupant&&interiorState(id).visited.length)assignExplorationIIIOccupant(id,S)}
 _showExplorationIIISitePanel1621(id);if(!isFarNorthExpeditionSite(id))return;
 const dlg=document.querySelector('.dialog');if(dlg){dlg.classList.add('northern-expedition');const p=dlg.querySelector('.exploration-iii-panel');if(p&&!p.querySelector('.north-expedition-banner'))p.insertAdjacentHTML('afterbegin','<div class="north-expedition-banner"><b>Far Northern Expedition</b><br>Severe weather, poor roads, and hostile local Parties make preparation and scouting unusually valuable here.</div>')}
 const S=explorationIIISiteState(id),actualId=S.occupant?.actualPartyId,btn=$('#expIIIOccupant');if(btn&&actualId){btn.textContent=`Confront ${S.occupant.name}`;btn.onclick=()=>{const p=(state.world.parties||[]).find(x=>x.id===actualId);if(!p){S.occupantStatus='gone';S.occupant=null;save();return showWildernessSite(id)}showWorldParty(p.id)}}
};

// Regional landmarks enter the same Exploration III experience even though they are not hidden-map sites.
const _showWorldArea1621=showWorldArea;
showWorldArea=function(){const id=state.world?.location;if(isFarNorthExpeditionSite(id))return showWildernessSite(id);return _showWorldArea1621.apply(this,arguments)};

// Northern mapped landmarks should never expose the hidden-site retirement button, because they
// are part of the permanent Far North road network. The expedition itself can still be left and resumed.
const _showWildernessSite1621=showWildernessSite;
showWildernessSite=function(id=state.world.location){
 _showWildernessSite1621(id);if(!isFarNorthExpeditionSite(id))return;const dlg=document.querySelector('.dialog');if(dlg)dlg.classList.add('northern-expedition');const give=$('#siteGiveUp');if(give)give.remove();const toggle=$('#siteMapToggle');if(toggle)toggle.remove()
};
const _showHiddenInterior1621=showHiddenInterior;
showHiddenInterior=function(id){_showHiddenInterior1621(id);if(!isFarNorthExpeditionSite(id))return;const dlg=document.querySelector('.dialog');if(dlg)dlg.classList.add('northern-expedition');const give=$('#interiorGiveUp');if(give)give.remove()};

// Completing northern expeditions improves regional intelligence in addition to their normal
// settlement/route consequence. This uses the existing temporary scouting model.
const _explorationIIICompletionCheck1621=explorationIIICompletionCheck;
explorationIIICompletionCheck=function(id){const before=interiorState(id).completed,out=_explorationIIICompletionCheck1621(id);if(isFarNorthExpeditionSite(id)&&before){const X=ensureExplorationIIIState(),S=X.sites[id];if(S&&!S.northScoutingAwarded){gainScouting(1);S.northScoutingAwarded=true;explorationIIIRecord(id,'The completed northern expedition improves practical route intelligence across the Far North.','good');save()}}return out};

// v1.6.21 physical-context correction: hidden routes that reach a settlement arrive at its outskirts,
// never inside its services. This also restores the intended Exploration III behavior globally.
useExplorationIIIHiddenRoute=function(id){
 const R=explorationIIIHiddenRoute(id);if(!R?.unlocked)return showWildernessSite(id);const dest=R.to;R.uses=(R.uses||0)+1;
 advanceWorldDays(1,`Using the hidden route from ${worldLocation(id).name} to ${worldLocation(dest).name}`);state.world.location=dest;state.world.region=locationRegion(dest);ensureMapView().lastLocation=null;
 if(state.world.settlements?.[dest])placePlayerPartyOutsideSettlement(dest);else{const F=playerPartyFieldState(),dl=worldLocation(dest);F.active=true;F.region=locationRegion(dest);F.x=dl.x;F.y=dl.y;F.anchorLocation=dest;F.targetPartyId=null;F.sinceDay=state.world.day}
 recordWorldHistory(`Hidden route used: ${worldLocation(id).name} → ${worldLocation(dest).name}.${state.world.settlements?.[dest]?' The Player Party emerges outside the settlement.':''}`,'good','exploration');save();closeOverlay();renderOpenWorld()
};

// Exploration Journal should include these mapped regional landmarks as major expedition sites.
const _showExplorationJournal1621=showExplorationJournal;
showExplorationJournal=function(){
 _showExplorationJournal1621();const dlg=document.querySelector('.dialog');if(!dlg||dlg.querySelector('#farNorthExpeditionJournal'))return;if(!(state.world.unlockedRegions||[]).includes('farnorth'))return;
 const footer=dlg.querySelector('.dialog-footer'),box=document.createElement('div');box.id='farNorthExpeditionJournal';box.innerHTML=`<h3>Far Northern Expeditions</h3>${FAR_NORTH_EXPEDITION_SITES.map(id=>{const l=worldLocation(id),P=interiorProgress(id),S=explorationIIISiteState(id);return `<button class="exploration-site-card" data-northexp="${id}"><span><b>${esc(l.name)}</b><small>${P.explored}/${P.total} areas explored • ${P.investigated}/${P.total} investigated • ${esc(S.phase)}</small></span><span>${esc(l.desc)}</span></button>`}).join('')}`;dlg.insertBefore(box,footer||null);box.querySelectorAll('[data-northexp]').forEach(b=>b.onclick=()=>showWildernessSite(b.dataset.northexp))
};
