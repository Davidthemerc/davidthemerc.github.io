/* v1.6.54 — Spawn Contracts & Metropolitan Opportunities
   Circle-gated metropolitan work that feeds the normal contract/journal systems. */

const SPAWN_METRO_WORK={
 northwest:[
  {tier:'basic',type:'visit',name:'Commons Delivery Check',target:'spawn_west',desc:'The Northwest Commons needs a trusted pair of eyes on a routine delivery moving between residential wards.'},
  {tier:'trusted',type:'diplomacy',name:'Neighborhood Services Dispute',target:'spawn_centralres',desc:'Two residential committees need a neutral intermediary before a minor services dispute turns into a lasting grudge.'},
  {tier:'premium',type:'delivery',name:'Ward Registry Packet',target:'spawn_civic',desc:'Carry a sealed neighborhood registry packet directly to Civic Center and place it with the proper office.'}],
 north_gate:[
  {tier:'basic',type:'visit',name:'Arrival Ledger Check',target:'spawn_northcentral',desc:'Compare traveler and carriage entries between the North Gate and Highroad registries.'},
  {tier:'trusted',type:'delivery',name:'Priority Gate Papers',target:'spawn_civic',desc:'Carry priority gate papers to Civic Center without letting them disappear into the ordinary administrative queue.'},
  {tier:'premium',type:'delivery',name:'High Road Dispatch',target:'southroad',desc:'A trusted gate contact needs a sealed dispatch carried beyond the metropolis to Southroad Camp.'}],
 highroad:[
  {tier:'basic',type:'visit',name:'Carriage Factor Survey',target:'spawn_market',desc:'Follow a disputed arrival shipment from Highroad Ward into the Market District and verify where the handoff went wrong.'},
  {tier:'trusted',type:'diplomacy',name:'Gate-Factor Settlement',target:'spawn_merchant',desc:'A carriage factor and a merchant house need somebody credible to settle responsibility for delayed freight.'},
  {tier:'premium',type:'delivery',name:'Southroad Commercial Dispatch',target:'southroad',desc:'Carry a time-sensitive commercial dispatch from the Spawn to the Shantium-side roadhead.'}],
 market:[
  {tier:'basic',type:'visit',name:'Price Dispute Verification',target:'spawn_merchant',desc:'Market sellers want an independent verification of a wholesale price dispute with the Merchant Quarter.'},
  {tier:'trusted',type:'procure',name:'Priority Stall Restock',good:'food',qty:3,desc:'A group of known sellers needs a modest but urgent restock before the next rush of buyers.'},
  {tier:'premium',type:'diplomacy',name:'Tyrdon Trade Representation',target:'tyrdon',desc:'Represent established Market District sellers in a sensitive trade conversation with contacts in Tyrdon.'}],
 west:[
  {tier:'basic',type:'delivery',name:'Clinic Supply Note',target:'spawn_centralres',desc:'Carry a clinic supply note across the residential wards to the people who can fulfill it.'},
  {tier:'trusted',type:'procure',name:'West Ward Relief Order',good:'medicine',qty:2,desc:'The neighborhood clinic needs medicine obtained without paying panic prices.'},
  {tier:'premium',type:'diplomacy',name:'Residential Compact',target:'spawn_northwest',desc:'Help two large residential ward circles agree on a shared neighborhood-services arrangement.'}],
 works:[
  {tier:'basic',type:'delivery',name:'Workshop Sample Run',target:'spawn_merchant',desc:'Carry finished samples from the Works District to a buyer in the Merchant Quarter.'},
  {tier:'trusted',type:'procure',name:'Guild Material Order',good:'tools',qty:3,desc:'The Works Guild Compact needs a shortfall in shop tools covered before production begins to slip.'},
  {tier:'premium',type:'diplomacy',name:'Masterwork Commission Terms',target:'spawn_merchant',desc:'A high-value commission is stalled over specifications, liability, and payment terms. The guild wants a trusted mediator.'}],
 civic:[
  {tier:'basic',type:'delivery',name:'Administrative Packet',target:'spawn_oldcity',desc:'Carry a certified administrative packet to an office in Old Spawn and obtain confirmation of receipt.'},
  {tier:'trusted',type:'visit',name:'District Compliance Review',target:'spawn_warehouses',desc:'Civic administrators need an outside observer to verify that a warehouse district order is actually being followed.'},
  {tier:'premium',type:'diplomacy',name:'Commercial Petition Hearing',target:'spawn_merchant',desc:'A politically delicate commercial petition needs a credible intermediary before it reaches a formal hearing.'}],
 merchant:[
  {tier:'basic',type:'delivery',name:'Counting-House Dispatch',target:'spawn_warehouses',desc:'Carry sealed instructions from a counting house to the freight factors handling its cargo.'},
  {tier:'trusted',type:'diplomacy',name:'Freight Contract Dispute',target:'spawn_warehouses',desc:'A merchant house and a freight operator want a settlement before both sides start withholding service.'},
  {tier:'premium',type:'delivery',name:'Tyrdon Exchange Papers',target:'tyrdon',desc:'A trusted merchant house needs exchange papers delivered to its Sengian counterpart in Tyrdon.'}],
 foundry:[
  {tier:'basic',type:'visit',name:'Hiring-Corner Check',target:'spawn_works',desc:'Labor organizers want an independent check on whether a Works District contractor is honoring agreed hiring terms.'},
  {tier:'trusted',type:'diplomacy',name:'Apprenticeship Recognition',target:'spawn_works',desc:'Experienced laborers and guild representatives need mediation over practical skill recognition.'},
  {tier:'premium',type:'procure',name:'Emergency Repair Materials',good:'iron',qty:4,desc:'A major repair job is waiting on enough iron to keep a large crew working.'}],
 oldcity:[
  {tier:'basic',type:'visit',name:'Cistern Record Search',target:'spawn_civic',desc:'Old Spawn caretakers need a record checked against the Central Archives before maintenance can proceed.'},
  {tier:'trusted',type:'delivery',name:'Historic Property Docket',target:'spawn_civic',desc:'Carry a fragile property docket to Civic Center for certification without surrendering it to an ordinary courier queue.'},
  {tier:'premium',type:'diplomacy',name:'Old Ward Boundary Settlement',target:'spawn_civic',desc:'Represent Old Spawn residents in a technical boundary dispute with the administrative apparatus.'}],
 central:[
  {tier:'basic',type:'delivery',name:'Schoolhouse Supply Note',target:'spawn_market',desc:'Carry a combined neighborhood order to Market District suppliers and return with confirmation.'},
  {tier:'trusted',type:'procure',name:'Commons Supply Purchase',good:'food',qty:3,desc:'The Central Ward civic circle needs ordinary provisions bought before a neighborhood event.'},
  {tier:'premium',type:'diplomacy',name:'Central Ward Services Compact',target:'spawn_west',desc:'Help neighboring residential circles settle a recurring dispute over shared services and maintenance.'}],
 freight:[
  {tier:'basic',type:'visit',name:'Broken Cargo Trail',target:'spawn_market',desc:'A freight house wants somebody to follow the paperwork on a shipment that arrived short.'},
  {tier:'trusted',type:'delivery',name:'Bonded Stores Release',target:'spawn_merchant',desc:'Carry a bonded-store release directly to the merchant factor authorized to act on it.'},
  {tier:'premium',type:'delivery',name:'Southroad Freight Warrant',target:'southroad',desc:'A major freight house needs a road warrant and cargo instructions carried to Southroad Camp.'}],
 southwest:[
  {tier:'basic',type:'visit',name:'Commons Vendor Check',target:'spawn_spirits',desc:'Southwest residents want a quick check on a supplier whose deliveries have become unreliable.'},
  {tier:'trusted',type:'procure',name:'Commons Food Order',good:'food',qty:3,desc:'A neighborhood institution needs an ordinary food order filled at a fair price.'},
  {tier:'premium',type:'diplomacy',name:'South Wall Services Agreement',target:'spawn_stockyards',desc:'Mediate a services dispute where residential streets meet heavy southern commercial traffic.'}],
 brewers:[
  {tier:'basic',type:'delivery',name:'Cask Accounts',target:'spawn_warehouses',desc:'Carry brewery cask accounts to the freight houses responsible for returning empties.'},
  {tier:'trusted',type:'procure',name:'Brewers’ Production Order',good:'food',qty:4,desc:'The Brewers’ Guild needs fermentable food and grain-equivalent inputs before production tightens.'},
  {tier:'premium',type:'diplomacy',name:'Excise & Distribution Terms',target:'spawn_merchant',desc:'Brewers and distributors need a trusted intermediary to settle a high-value excise and distribution arrangement.'}],
 drovers:[
  {tier:'basic',type:'delivery',name:'Cattle Exchange Papers',target:'spawn_bazaar',desc:'Carry livestock exchange papers from the Stockyards to caravan-side merchants handling the next sale.'},
  {tier:'trusted',type:'visit',name:'Livestock Route Inspection',target:'spawn_bazaar',desc:'Inspect the shared livestock-and-caravan access lanes and report where congestion is actually occurring.'},
  {tier:'premium',type:'diplomacy',name:'Desert Herd Purchase Terms',target:'spawn_bazaar',desc:'Broker terms between cattle buyers and caravan-linked representatives of the desert herders supplying the city.'}],
 bazaar:[
  {tier:'basic',type:'delivery',name:'Caravan Registry Packet',target:'spawn_warehouses',desc:'Carry a caravan registry packet to the freight houses preparing storage for incoming goods.'},
  {tier:'trusted',type:'diplomacy',name:'Bazaar-Freight Arrangement',target:'spawn_warehouses',desc:'Bazaar merchants and freight houses need a workable arrangement for a surge of caravan cargo.'},
  {tier:'premium',type:'delivery',name:'Tyrdon Caravan Dispatch',target:'tyrdon',desc:'Carry a trusted caravan dispatch from the Grand Bazaar to trading contacts in Tyrdon. The Endless Desert itself remains closed.'}]
};
const SPAWN_WORK_THRESHOLDS={basic:0,trusted:5,premium:9};
const SPAWN_WORK_LABELS={basic:'Local Work',trusted:'Trusted Referral',premium:'High-Trust Opportunity'};

function spawnContractState(){ensureWorldState();if(!state.world.spawnContracts||typeof state.world.spawnContracts!=='object')state.world.spawnContracts={offers:{},history:[]};const S=state.world.spawnContracts;if(!S.offers)S.offers={};if(!Array.isArray(S.history))S.history=[];return S}
function spawnWorkKey(id){return `${state.world.day}|${id}`}
function spawnKnownIssuer(id){const rows=SETTLEMENT_NPCS[id]||[];if(!rows.length)return null;return rows.slice().sort((a,b)=>(npcRelationshipState(b.id).familiarity||0)-(npcRelationshipState(a.id).familiarity||0))[0]}
function spawnWorkProfile(id){const cid=SPAWN_DISTRICT_CIRCLE[id];return {cid,circle:spawnCircle(cid),standing:spawnCircleState(cid).standing||0,templates:SPAWN_METRO_WORK[cid]||[]}}
function spawnTargetAvailable(target){const loc=worldLocation(target);if(!loc)return false;if(locationRegion(target)==='spawn')return true;return (state.world.unlockedRegions||['shantium']).includes(locationRegion(target))}
function spawnConfigureMetroContract(id,tpl){
 const P=spawnWorkProfile(id),issuer=spawnKnownIssuer(id),target=spawnTargetAvailable(tpl.target)?tpl.target:(tpl.target==='tyrdon'?'spawn_market':tpl.target==='southroad'?'spawn_northcentral':id),q=generateContract(id,tpl.type,{target:target||undefined,faction:'Spawn',chainKey:`spawn:${P.cid}:${tpl.tier}`});
 q.spawnOpportunityGenerated=true;q.spawnCircleId=P.cid;q.spawnOpportunityTier=tpl.tier;q.spawnOpportunityDistrict=id;q.name=tpl.name;q.desc=tpl.desc;q.faction='Spawn';q.relationshipGenerated=!!issuer;q.relationshipSourceKind=issuer?'npc':null;q.relationshipSourceId=issuer?.id||null;q.relationshipSourceName=issuer?.name||P.circle.name;q.issuerNpcId=issuer?.id||null;q.issuerName=issuer?.name||`${P.circle.name} representative`;
 if(tpl.type==='procure'){q.goodId=tpl.good||q.goodId;q.qty=tpl.qty||q.qty;q.target=id}
 const bonus=tpl.tier==='premium'?75:tpl.tier==='trusted'?35:10;q.reward+=bonus+Math.max(0,P.standing)*(tpl.tier==='premium'?4:tpl.tier==='trusted'?3:2);if(P.standing>=14)q.reward+=25;
 initializeContractTerms(q);if(P.standing>=14)q.maxNegotiationAttempts=Math.max(2,q.maxNegotiationAttempts||1);assignContractPaymentTerms(q,{spot:false,force:true});return q
}
function spawnMetroOffers(id=state.world.location){const S=spawnContractState(),key=spawnWorkKey(id);if(S.offers[key])return S.offers[key];const P=spawnWorkProfile(id),rows=P.templates.filter(t=>P.standing>=(SPAWN_WORK_THRESHOLDS[t.tier]||0)).map(t=>spawnConfigureMetroContract(id,t));S.offers[key]=rows;S.history.push({day:state.world.day,district:id,type:'offers',count:rows.length,standing:P.standing});S.history=S.history.slice(-100);save();return rows}
function spawnCanonicalOffer(q){return state.world.quests.find(x=>x.id===q.id)||Object.values(state.world.contracts||{}).flat().find(x=>x.id===q.id)||q}
function spawnMetroContractStatus(q){q=spawnCanonicalOffer(q);if(q.status==='offered')return 'Available';if(q.status==='active')return 'Active';if(q.status==='ready')return 'Ready for payment';if(q.status==='complete')return 'Completed';if(q.status==='failed')return 'Failed';if(q.status==='abandoned')return 'Abandoned';return q.status||'Unknown'}
function spawnContractsDistrictHTML(id=state.world.location){if(locationRegion(id)!=='spawn'||id==='endless_desert_gate')return'';const P=spawnWorkProfile(id),offers=spawnMetroOffers(id),next=P.standing<5?`Trusted referrals unlock at standing 5 (${fmtStat(P.standing)}/5).`:P.standing<9?`High-trust opportunities unlock at standing 9 (${fmtStat(P.standing)}/9).`:P.standing<14?`Inner-circle standing at 14 improves premium terms (${fmtStat(P.standing)}/14).`:'Your circle standing now produces the strongest local referrals and negotiation access.';return `<h3>Metropolitan Opportunities</h3><div class="card compact"><b>${esc(P.circle.name)}</b> • ${esc(spawnCircleStandingLabel(P.standing))}<br><small>${esc(next)} Today’s referrals are fixed until the next campaign day.</small></div><button id="spawnContractBoard"><b>View Today’s Work</b><small>${offers.length} circle-backed opportunit${offers.length===1?'y':'ies'} available or tracked today</small></button>`}
function wireSpawnContractsDistrict(id=state.world.location){if($('#spawnContractBoard'))$('#spawnContractBoard').onclick=()=>showSpawnMetropolitanContracts(id)}
function showSpawnMetropolitanContracts(id=state.world.location){const P=spawnWorkProfile(id),offers=spawnMetroOffers(id),active=state.world.quests.filter(q=>q.spawnOpportunityGenerated&&['active','ready'].includes(q.status));modalRouteEnter('showSpawnMetropolitanContracts',[id]);overlay(`<h2>${esc(P.circle.name)} — Opportunities</h2><p>People in this network increasingly refer work to the Guardian as trust builds. These are real contracts: normal deadlines, negotiation, journal tracking, payment, completion, and failure rules all apply.</p><div class="notice compact"><b>Circle standing ${fmtStat(P.standing)}/20</b> • ${esc(spawnCircleStandingLabel(P.standing))}<br>Basic local work: 0 • Trusted referrals: 5 • High-trust opportunities: 9 • Inner-circle terms: 14.</div><div class="choice-list compact">${offers.map(q=>{const c=spawnCanonicalOffer(q),st=spawnMetroContractStatus(c),locked=c.status!=='offered';return `<button data-spawnwork="${esc(q.id)}" ${locked?'disabled':''}><b>${esc(q.name)}</b><small>${esc(SPAWN_WORK_LABELS[q.spawnOpportunityTier])} • ${esc(st)} • ${q.reward}g<br>${esc(q.desc)}</small></button>`}).join('')||'<div class="card compact">No circle-backed work is available today.</div>'}</div>${active.length?`<div class="notice compact"><b>Active metropolitan work:</b> ${active.length} contract${active.length===1?'':'s'} currently in your journal.</div>`:''}<div class="dialog-footer"><button id="spawnWorkBack">Back to ${esc(worldLocation(id).name)}</button></div>`,true);document.querySelectorAll('[data-spawnwork]').forEach(b=>b.onclick=()=>openSpawnMetropolitanOffer(id,b.dataset.spawnwork));$('#spawnWorkBack').onclick=()=>modalNavBackOrFallback(()=>showSpawnDistrictGuide(id))}
function openSpawnMetropolitanOffer(id,qid){const q=spawnMetroOffers(id).find(x=>x.id===qid);if(!q)return showSpawnMetropolitanContracts(id);const c=spawnCanonicalOffer(q);if(c.status!=='offered')return showSpawnMetropolitanContracts(id);state.world.contracts[id]=state.world.contracts[id]||[];if(!state.world.contracts[id].some(x=>x.id===q.id))state.world.contracts[id].unshift(q);save();showContractNegotiation(q.id,id)}

// Metropolitan work changes the social network that referred it after the normal contract memory is recorded.
const SPAWN_BASE_RECORD_CONTRACT_OUTCOME=recordContractOutcome;
recordContractOutcome=function(q,outcome,reason=''){SPAWN_BASE_RECORD_CONTRACT_OUTCOME(q,outcome,reason);if(!q?.spawnOpportunityGenerated||q.spawnCircleOutcomeApplied)return;q.spawnCircleOutcomeApplied=true;const cid=q.spawnCircleId,id=q.spawnOpportunityDistrict||q.origin;if(outcome==='complete'){const delta=q.spawnOpportunityTier==='premium'?3:2;changeSpawnCircleStanding(cid,delta,`${q.name} was completed successfully.`);changeLocalReputation(id,1,`Completed circle-backed contract: ${q.name}`);const npc=q.issuerNpcId;if(npc){const r=npcRelationshipState(npc);r.familiarity=clamp((r.familiarity||0)+1,0,10);state.world.npcFamiliarity[npc]=r.familiarity;npcMemoryAdd(npc,`You completed ${q.name} after being personally referred for the work.`,2)}}else{changeSpawnCircleStanding(cid,outcome==='abandoned'?-2:-1,`${q.name} was ${outcome==='abandoned'?'abandoned':'not completed'}.`)}spawnContractState().history.push({day:state.world.day,district:id,contractId:q.id,outcome,text:q.name});save()}
