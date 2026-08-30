// v1.6.23 — Prisoner Logic & Custody Cleanup
function prisonerCriminalIII(p){
 const s=`${p?.faction||''} ${p?.source||''}`.toLowerCase();
 return /outlaw|bandit|raider|brigand|reaver|oathless|wolfcloak|marauder/.test(s)
}
function prisonerLegitimateFactionIII(p){
 if(!p||prisonerCriminalIII(p))return false;
 return ['Shantium','Coalition','Redstone','Bluestone','Spawn'].includes(p.faction)
}
function prisonerExchangeEligibleIII(p){return prisonerLegitimateFactionIII(p)}
function prisonerRansomEligibleIII(p){return prisonerLegitimateFactionIII(p)||(!prisonerCriminalIII(p)&&p?.faction==='Mercenaries')}
function prisonerNearbySettlementIII(){
 if(!isOpenWorld())return null;
 const physical=playerPhysicalContext?.();
 if(physical?.type==='settlement'&&physical.settlementId)return physical.settlementId;
 const here=state.world?.location,reg=state.world?.region||locationRegion(here);let best=null,bestDays=99;
 for(const id of Object.keys(state.world?.settlements||{})){
  if(locationRegion(id)!==reg)continue;
  const d=worldTravelDays(here,id);if(Number.isFinite(d)&&d<bestDays){bestDays=d;best=id}
 }
 return bestDays<=1?best:null
}
function prisonerCaptureRoadIntel(p){
 if(!p||p.captureIntelDone||!isOpenWorld()||p.hallCustody)return false;
 p.captureIntelDone=true;p.questioned=true;
 state.flags.fullIntel=Math.max(state.flags.fullIntel||0,2);gainScouting(1);
 const n=Math.max(1,p.count||1),who=esc(p.faction||'captured');
 log(`The Player Party questions the ${who} prisoner${n===1?'':'s'} about recent roads, camps, and movements. Regional intelligence improves.`,'info');
 recordWorldHistory(`Captured ${p.faction||'enemy'} prisoners were questioned immediately for current road intelligence.`,'info','prisoners');
 return true
}
function prisonerReleaseCriminalIII(p,returnHall=false){
 const back=()=>returnHall?showHomePrisoners():showPrisoners(),near=prisonerNearbySettlementIII(),n=Math.max(1,p.count||1);
 resolveNamedPrisonerLifecycle(p,'release');state.prisoners=state.prisoners.filter(x=>x.id!==p.id);
 if(near){
  const penalty=n>=6?3:n>=3?2:1,ss=settlementState(near);changeLocalReputation(near,-penalty,`released ${n} captured ${p.faction||'criminal'} prisoner${n===1?'':'s'} nearby`);if(ss)ss.security=clamp((ss.security||50)-1,0,100);
  const place=worldLocation(near)?.name||near;
  log(`Residents near ${place} are angered that ${n} captured ${p.faction||'criminal'} prisoner${n===1?' was':'s were'} released nearby. Local reputation -${penalty}; security -1.`,'bad');
  recordWorldHistory(`The Guardian released ${n} captured ${p.faction||'criminal'} prisoner${n===1?'':'s'} near ${place}; local residents objected and security confidence fell.`,'bad','reputation')
 }else{
  log(`${n} captured ${p.faction||'criminal'} prisoner${n===1?' is':'s are'} released in remote country. No community is close enough for an immediate civic reaction.`,'info');
  recordWorldHistory(`The Guardian released ${n} captured ${p.faction||'criminal'} prisoner${n===1?'':'s'} away from a settlement.`,'info','prisoners')
 }
 save();back()
}

// Preserve all modern custody/jurisdiction accounting, but intercept the revised outcomes.
const SOS_PRISONER_ACTION_16229_BASE=prisonerAction;
prisonerAction=function(id,action,returnHall=false){
 const p=state.prisoners.find(x=>x.id===id);if(!p)return;
 if(action==='question'||action==='enlist')return returnHall?showHomePrisoners():showPrisoners();
 if(action==='exchange'&&!prisonerExchangeEligibleIII(p))return returnHall?showHomePrisoners():showPrisoners();
 if(action==='ransom'&&!prisonerRansomEligibleIII(p))return returnHall?showHomePrisoners():showPrisoners();
 if(action==='release'&&isOpenWorld()&&prisonerCriminalIII(p))return prisonerReleaseCriminalIII(p,returnHall);
 return SOS_PRISONER_ACTION_16229_BASE(id,action,returnHall)
};

// Final prisoner-card renderer: only show actions that are actually meaningful for this group.
prisonerCardHTML=function(p,scope='party'){
 const ow=isOpenWorld(),physical=ow?playerPhysicalContext():null,inside=ow&&physical?.type==='settlement',authority=inside&&!!state.world.settlements?.[physical.settlementId],hall=scope==='hall',c=ensurePrisonerCustodyIII(p),named=Array.isArray(p.namedPersonNames)&&p.namedPersonNames.length?` • ${p.namedPersonNames.map(esc).join(', ')}`:'';
 if(ow&&!p.captureIntelDone&&!p.hallCustody)prisonerCaptureRoadIntel(p);
 const metaLine=`${p.world?'Day':'Round'} ${p.round} • ${esc(p.source||'an enemy force')}${named}${p.hallLabor?' • Supervised work crew':''}<br><small><b>Custody:</b> ${esc(prisonerCustodyLabelIII(p))}${c.jurisdiction?` • jurisdiction ${esc(worldLocation(c.jurisdiction).name)}`:''}</small>`;
 const actions=[];
 actions.push(`<button data-release="${p.id}">Release</button>`);
 if(prisonerExchangeEligibleIII(p))actions.push(`<button data-exchange="${p.id}" ${!authority?'disabled':''}>Exchange</button>`);
 if(p.world&&prisonerRansomEligibleIII(p))actions.push(`<button data-ransom="${p.id}" ${!authority?'disabled':''}>Ransom</button>`);
 if(p.world)actions.push(`<button data-handover="${p.id}" ${!authority?'disabled':''}>Hand Over to ${authority?esc(jurisdictionRule(physical.settlementId).authority):'Local Authority'}</button>`);
 if(!hall&&ow&&playerPartyInsideSettlement('shantium'))actions.push(`<button data-deposit="${p.id}">Transfer to Guardian Hall</button>`);
 if(hall)actions.push(`<button data-labor="${p.id}">${p.hallLabor?'End Work Assignment':'Assign Work Crew'}</button>`);
 return `<div class="prisoner-card"><h4>${esc(p.faction)} prisoners — ${p.count}</h4><div class="compact">${metaLine}</div><div class="choice-list compact">${actions.join('')}</div></div>`
};
