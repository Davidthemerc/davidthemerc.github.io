// v1.6.22.2 — Far North Integration & Balance
(function(){
const FAR_NORTH_SETTLEMENTS_16221=['azerdon','karsen','decius','velmora','skallvik','exium'];
const FAR_NORTH_DEEP_16221=new Set(['azerdon','karsen','decius','velmora','skallvik','roguehold','snowcaves','standingstones','whitescar']);

function repairFarNorthIntegration16221(){
 if(!isOpenWorld()||!state.world)return 0;let fixes=0;ensureWorldState();
 const unlocked=state.world.unlockedRegions||[];
 if((state.world.region==='farnorth'||locationRegion(state.world.location)==='farnorth')&&!unlocked.includes('farnorth')){unlocked.push('farnorth');state.world.unlockedRegions=unlocked;fixes++}
 // Ensure every northern settlement has valid settlement/economy state after migration.
 for(const id of FAR_NORTH_SETTLEMENTS_16221){
  if(!state.world.settlements[id]){state.world.settlements[id]={security:id==='azerdon'?76:id==='skallvik'?38:58,prosperity:id==='azerdon'?58:id==='skallvik'?34:45,lastEventDay:0};fixes++}
  const ss=state.world.settlements[id];ss.security=clamp(Number.isFinite(ss.security)?ss.security:55,0,100);ss.prosperity=clamp(Number.isFinite(ss.prosperity)?ss.prosperity:45,0,100);
  ensureTradeStock(id);settlementEconomyIII(id);
 }
 // Azerdon remains strongly Independent and routine southern political presence is restricted to Exium.
 if(typeof normalizeFarNorthFactionPresence1622==='function')normalizeFarNorthFactionPresence1622();
 // Turn back ordinary southern faction parties that leaked past Exium through old saves or generic simulation.
 for(const p of state.world.parties||[]){
  const loc=p.location,dest=p.destination,foreignKind=['redstone','coalition','bluestone','spawn'].includes(p.kind),foreignMerchant=p.kind==='merchant'&&p.faction&&p.faction!=='Independent'&&!/Independent/i.test(p.faction);
  if((foreignKind||foreignMerchant)&&!p.contractProtected&&!p.securityResponse&&(FAR_NORTH_DEEP_16221.has(loc)||FAR_NORTH_DEEP_16221.has(dest))){
   p.location='exium';p.origin='exium';p.destination=foreignKind&&p.kind==='bluestone'?'crownpass':chance(.5)?'grayhaven':'crownpass';p.crossRegion=true;p.region='farnorth';p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays('exium',p.destination));p.tradeRoute=connectionRouteName('exium',p.destination);syncTravelerRecord(p);fixes++
  }
 }
 // Clamp northern society values and discard malformed expired issues without erasing valid history.
 if(typeof farNorthSocietyState1622==='function'){
  const S=farNorthSocietyState1622();
  for(const id of FAR_NORTH_SETTLEMENTS_16221){const x=S.settlements[id];x.autonomy=clamp(Number(x.autonomy)||0,0,10);x.outsiderTolerance=clamp(Number(x.outsiderTolerance)||0,0,10);x.civicConfidence=clamp(Number(x.civicConfidence)||0,0,100);if(x.issue&&x.issue.status==='active'&&state.world.day-(x.issue.createdDay||state.world.day)>18){x.issue.status='expired';x.issue.resolvedDay=state.world.day;fixes++}}
 }
 return fixes
}

// Far Northern same-region contracts need enough time for doubled travel and the return trip to the issuer.
const _contractBaseDeadlineDays16221=contractBaseDeadlineDays;
contractBaseDeadlineDays=function(q){
 let base=_contractBaseDeadlineDays16221(q);if(!q||locationRegion(q.origin)!=='farnorth')return base;
 const travel=(q.target&&q.target!==q.origin&&worldLocation(q.target))?worldTravelDays(q.origin,q.target):0;
 if(['visit','delivery','diplomacy','recovery'].includes(q.type)&&travel<90)base=Math.max(base,travel*2+3);
 if(q.type==='hunt')base=Math.max(base,10);
 if(q.type==='escort')base=Math.max(base,(q.escortTotalDays||travel||1)+5);
 return base
};

// In the severe northern road network, choosing the safer route is a meaningful detour rather than a one-day universal surcharge.
const _routeTravelOptions16221=routeTravelOptions;
routeTravelOptions=function(from,to){const out=_routeTravelOptions16221(from,to);if(locationRegion(from)==='farnorth'&&locationRegion(to)==='farnorth'){out.safer.days=out.direct.days+2;out.safer.desc=`${out.safer.days} days • take sheltered approaches and slower ice-road sections • fewer dangerous encounters`;}return out};

// Mark the Far North's resource-linked production without turning wilderness landmarks into trade markets.
const _settlementProductionRate16221=settlementProductionRate;
settlementProductionRate=function(locId,gid){let r=_settlementProductionRate16221(locId,gid);if(locId==='shantium'&&gid==='stone')r+=.18; // Old Quarry feeds the capital market.
 if(locId==='river'&&gid==='salt')r+=.16; // Low Marsh salt reaches River Crossing.
 if(locId==='karsen'&&gid==='stone')r+=.18; // Standing Stone country and local quarrying reinforce Karsen's stone trade.
 return r};

// Keep internal northern caravans at a stable floor, but prevent runaway accumulation from repeated render/tick hooks.
function balanceFarNorthCaravans16221(){
 if(!isOpenWorld()||!(state.world.unlockedRegions||[]).includes('farnorth'))return 0;const local=(state.world.parties||[]).filter(p=>p.kind==='merchant'&&worldPartyDisplayRegion(p)==='farnorth'&&!p.crossRegion&&!p.tradeProcurementCaravan);let changed=0;
 if(local.length>5){const protectedIds=new Set([state.world.trackedPartyId,...state.world.quests.filter(q=>['active','ready'].includes(q.status)).map(q=>q.worldPartyId||q.partyId)].filter(Boolean));for(const p of local.sort((a,b)=>(a.createdDay||0)-(b.createdDay||0)).slice(0,local.length-5)){if(protectedIds.has(p.id))continue;archiveTravelerParty(p,'Northern caravan traffic consolidated after the winter road cycle.');state.world.parties=state.world.parties.filter(x=>x.id!==p.id);changed++}}
 if(typeof ensureFarNorthInternalCaravans1622==='function')ensureFarNorthInternalCaravans1622();return changed
}

const _advanceWorldDays16221=advanceWorldDays;
advanceWorldDays=function(days,reason){const out=_advanceWorldDays16221(days,reason);if(isOpenWorld()&&state.world&&(state.world.unlockedRegions||[]).includes('farnorth')){repairFarNorthIntegration16221();balanceFarNorthCaravans16221()}return out};

const _renderOpenWorld16221=renderOpenWorld;
renderOpenWorld=function(){if(isOpenWorld()&&state.world&&(state.world.unlockedRegions||[]).includes('farnorth')){repairFarNorthIntegration16221();balanceFarNorthCaravans16221()}return _renderOpenWorld16221()};

// Make the dense northern map easier to read on phones without losing the icy identity.
const style=document.createElement('style');style.textContent=`
.region-map-farnorth .world-map-caption{background:rgba(239,247,250,.92)!important;color:#28434f!important;border-color:#718b96!important}
.region-map-farnorth .map-legend{color:#35515d!important}
.region-map-farnorth .world-location{overflow-wrap:anywhere}
@media(max-width:700px){.region-map-farnorth .world-map-viewport .world-location{width:78px!important;min-width:78px!important;max-width:78px!important;padding:3px!important}.region-map-farnorth .world-map-viewport .world-location b{font-size:7px!important}.region-map-farnorth .world-map-viewport .world-location span{font-size:5.5px!important}.region-map-farnorth .map-region-name{font-size:6px!important}}
`;document.head.appendChild(style);

// Run once on load for migrated campaigns.
if(isOpenWorld()&&state.world&&(state.world.unlockedRegions||[]).includes('farnorth')){const n=repairFarNorthIntegration16221();balanceFarNorthCaravans16221();if(n)save()}
})();
