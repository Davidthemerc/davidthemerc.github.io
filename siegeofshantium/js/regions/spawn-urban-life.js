/* v1.6.51 — Spawn Urban Life & Encounters II
   Interactive, district-specific metropolitan incidents and minor opportunities.
   These are short local involvements: one resolution per district/day and no
   campaign-day cost. Rewards are intentionally modest to prevent urban errands
   from replacing contracts or regional adventuring. */

const SPAWN_URBAN_OPPORTUNITIES=[
 {id:'garden_delivery',districts:['spawn_northwest'],kind:'Neighborhood',title:'Medicine on the Wrong Avenue',text:'A neighborhood runner is struggling to locate an elderly resident while carrying a time-sensitive packet from the ward clinic.',actions:[
  {id:'guide',label:'Guide the runner through the blocks',result:'You cut through the residential grid and put the delivery back on course.',rep:1},
  {id:'carry',label:'Take the packet the rest of the way',result:'The clinic runner gratefully hands over the address. The delivery reaches the right door.',gold:6,rep:1},
  {id:'leave',label:'Leave the runner to it',result:'The runner studies the street markers and continues searching.'}]},
 {id:'gate_lodging',districts:['spawn_northgate'],kind:'Social',title:'Stranded Travelers',text:'A family newly through North Gate has been quoted three wildly different lodging prices and cannot tell which inn is taking advantage of them.',actions:[
  {id:'compare',label:'Help compare the nearby inns',result:'A few questions expose the inflated quote. The travelers find a fair room nearby.',rep:1},
  {id:'cover',label:'Cover part of their lodging — 10 gold',cost:10,result:'You cover the difference and send the family toward a reputable house.',rep:2},
  {id:'leave',label:'Keep moving',result:'The family resumes arguing quietly over the price boards.'}]},
 {id:'highroad_manifest',districts:['spawn_northcentral'],kind:'Gate traffic',title:'Misrouted Freight Manifest',text:'A Southroad freight clerk has sent three carts toward the wrong warehouse row and is trying to correct the mistake before they disappear into city traffic.',actions:[
  {id:'redirect',label:'Help redirect the carts',result:'You intercept the carters at the next avenue and turn the shipment toward its proper receiving yard.',gold:8,rep:1},
  {id:'watch',label:'Ask the gate officials to handle it',result:'Gate staff take the manifest and dispatch two runners. The freight is recovered without much drama.',rep:1},
  {id:'leave',label:'Leave the clerk to solve it',result:'The clerk grabs another runner and vanishes into the traffic.'}]},
 {id:'market_shortchange',districts:['spawn_market'],kind:'Commerce',title:'A Very Convenient Miscount',text:'A shopper insists a stallholder shortchanged her. The stallholder insists the crowd is making her confused. Several witnesses are now loudly choosing sides.',actions:[
  {id:'mediate',label:'Recount the transaction',result:'A careful recount finds the missing coins under a folded price slate. The argument dissolves.',gold:5,rep:1},
  {id:'inspector',label:'Call a Market Inspector',result:'An inspector records the dispute and settles it under market rules.',rep:1},
  {id:'leave',label:'Let the market settle itself',result:'The argument is swallowed by the noise of Market Cross.'}]},
 {id:'west_cart',districts:['spawn_west'],kind:'Neighborhood',title:'Broken Delivery Axle',text:'A household delivery cart has lost an axle pin in the middle of a residential avenue, bottling up carts behind it.',actions:[
  {id:'lift',label:'Help move the cart clear',result:'With several residents pushing, the cart reaches the curb and the avenue starts moving again.',gold:5,rep:1},
  {id:'tools',label:'Buy a replacement pin nearby — 6 gold',cost:6,result:'A nearby tradesman produces the right pin and the driver gets moving almost immediately.',rep:2},
  {id:'leave',label:'Walk around the blockage',result:'Residents continue organizing themselves around the stranded cart.'}]},
 {id:'works_rush',districts:['spawn_works'],kind:'Work',title:'Rush Order Needs Hands',text:'A workshop factor is short two pairs of hands for a high-value order that must be moved from Fineworks Arcade to a merchant house before the street clogs.',actions:[
  {id:'work',label:'Take the short hauling job',result:'You help move the wrapped finished goods through the Works District before traffic peaks.',gold:14,rep:1},
  {id:'organize',label:'Help the factor recruit porters',result:'Hiring Corner supplies enough workers once somebody points the factor toward the right foreman.',rep:1},
  {id:'leave',label:'Decline the work',result:'The factor goes back to shouting for porters.'}]},
 {id:'civic_petition',districts:['spawn_civic'],kind:'Civic',title:'Petition Queue Dispute',text:'Two petitioners have reached the same clerk window with conflicting queue tokens, and the argument is beginning to halt the entire line.',actions:[
  {id:'mediate',label:'Help reconstruct the queue order',result:'The surrounding petitioners confirm who arrived first. The line begins moving again.',rep:2},
  {id:'clerk',label:'Bring a senior clerk over',result:'A senior clerk checks the intake ledger and resolves the duplicate token.',rep:1},
  {id:'leave',label:'Stay out of it',result:'The queue remains stalled while the two petitioners argue.'}]},
 {id:'merchant_ledger',districts:['spawn_merchant'],kind:'Commerce',title:'Ledger in the Street',text:'A bound commercial ledger lies beneath a bench outside a counting house. Its brass plate identifies a merchant company a block away.',actions:[
  {id:'return',label:'Return the ledger',result:'A relieved factor checks the seal, thanks you, and pays a small finder’s reward.',gold:18,rep:1},
  {id:'decline',label:'Return it but refuse payment',result:'The factor is surprised by the refusal and makes sure your name is remembered.',rep:2},
  {id:'watch',label:'Turn it over to a commercial guard',result:'A guard signs for the ledger and carries it back to the counting house.',rep:1}]},
 {id:'foundry_shift',districts:['spawn_working'],kind:'Work',title:'Hiring Corner Shortfall',text:'A repair foreman needs extra labor to unload replacement fittings before a foundry shift change floods the street.',actions:[
  {id:'work',label:'Help unload the fittings',result:'The fittings reach the repair crew before the shift crowd arrives.',gold:12,rep:1},
  {id:'recruit',label:'Find workers at Hiring Corner',result:'You connect the foreman with a waiting crew looking for exactly this kind of short job.',rep:1},
  {id:'leave',label:'Leave the foreman recruiting',result:'The foreman keeps calling rates over the noise of Foundry Square.'}]},
 {id:'oldcity_cistern',districts:['spawn_oldcity'],kind:'Watch',title:'Unsealed Cistern Door',text:'A waterworks service door stands open without a crew in sight. Residents are giving the dark stair beyond it a wide berth.',actions:[
  {id:'report',label:'Report it to the local Watch post',result:'Watch officers secure the entrance and send for a waterworks supervisor.',rep:2,lawRep:1},
  {id:'wait',label:'Wait for a water crew and warn passersby',result:'A maintenance crew eventually arrives, annoyed that somebody left the access unsecured.',rep:1},
  {id:'leave',label:'Leave it alone',result:'People continue detouring around the open service door.'}]},
 {id:'central_child',districts:['spawn_centralres'],kind:'Social',title:'Lost at Fountain Court',text:'A frightened child has lost sight of his family in the central crowds and can only remember the name of the street where they were headed.',actions:[
  {id:'find',label:'Help find the family',result:'Street markers and a few questions lead you to the family two avenues away.',rep:2},
  {id:'warden',label:'Bring him to a ward official',result:'A ward official takes over and sends runners toward the named street.',rep:1},
  {id:'leave',label:'Ask a nearby resident to help',result:'A resident kneels beside the child and begins asking careful questions.'}]},
 {id:'warehouse_seal',districts:['spawn_warehouses'],kind:'Watch',title:'Broken Cargo Seal',text:'A warehouse guard has found a freight wagon with a broken seal. The driver claims it snapped on the road; the receiving clerk is not convinced.',actions:[
  {id:'witness',label:'Help inspect the wagon exterior',result:'Scrape marks around the latch suggest rough handling rather than forced entry. The clerk records your observation.',gold:8,rep:1,lawRep:1},
  {id:'watch',label:'Call the freight Watch',result:'Freight officers isolate the wagon and take statements from both sides.',rep:1,lawRep:1},
  {id:'leave',label:'Leave the dispute to the warehouse',result:'The wagon remains held outside the receiving doors.'}]},
 {id:'southwest_vendor',districts:['spawn_southwest'],kind:'Neighborhood',title:'Street Seller in Trouble',text:'A food seller’s handcart has tipped at the edge of Southwest Commons. Half the neighborhood is stepping around scattered baskets.',actions:[
  {id:'help',label:'Help recover the baskets',result:'Most of the seller’s stock is rescued before feet and wheels ruin it.',gold:5,rep:1},
  {id:'replace',label:'Pay for the spoiled food — 8 gold',cost:8,result:'The seller can replace the lost stock instead of ending the day early.',rep:2},
  {id:'leave',label:'Let the crowd handle it',result:'Nearby residents start gathering the least-damaged baskets.'}]},
 {id:'spirits_barrels',districts:['spawn_spirits'],kind:'Work',title:'Runaway Barrel Train',text:'A brewery cart has shed two small casks and a cooper is trying to stop them from rolling farther down Brewers’ Mile.',actions:[
  {id:'catch',label:'Help catch the casks',result:'The runaway casks are stopped before they reach the busier Southway intersection.',gold:9,rep:1},
  {id:'traffic',label:'Hold traffic while the crew recovers them',result:'You keep carts clear while brewery workers wrestle the casks back into place.',rep:1},
  {id:'leave',label:'Stay clear of the barrels',result:'The cooper and several amused workers chase the casks themselves.'}]},
 {id:'stockyard_loose',districts:['spawn_stockyards'],kind:'Livestock',title:'Loose Desert Steer',text:'A desert-raised steer has slipped an auction lane and is pushing drovers and buyers away from a Stockyards passage.',actions:[
  {id:'help',label:'Help the drovers contain it',result:'Working with the drovers, you help close the side lane and turn the steer back toward the pens.',gold:15,rep:1},
  {id:'clear',label:'Clear bystanders from the lane',result:'With the lane empty, experienced drovers recover the animal without anyone getting hurt.',rep:2},
  {id:'leave',label:'Give the drovers room',result:'You move clear while the stockyard crews organize around the animal.'}]},
 {id:'bazaar_interpreter',districts:['spawn_bazaar'],kind:'Caravan',title:'Caravan Price Dispute',text:'A newly arrived desert caravan and a city warehouse buyer disagree over a delivery term. The argument is mostly a mismatch of trade customs rather than language.',actions:[
  {id:'mediate',label:'Help clarify the deal',result:'Once each side states what it thought the measure included, the disagreement becomes easy to settle.',gold:10,rep:1},
  {id:'authority',label:'Fetch a Bazaar Authority clerk',result:'A bazaar clerk cites the local receiving rule and records the agreed quantity.',rep:2},
  {id:'leave',label:'Let the traders negotiate',result:'The two sides continue bargaining loudly beside the caravan wagons.'}]}
];

function ensureSpawnUrbanLife(){
 ensureWorldState();
 if(!state.world.spawnUrbanLife||typeof state.world.spawnUrbanLife!=='object')state.world.spawnUrbanLife={resolved:{},history:[]};
 if(!state.world.spawnUrbanLife.resolved)state.world.spawnUrbanLife.resolved={};
 if(!Array.isArray(state.world.spawnUrbanLife.history))state.world.spawnUrbanLife.history=[];
 return state.world.spawnUrbanLife
}
function spawnUrbanOpportunityKey(id=state.world.location){return `${state.world.day}|${id}`}
function spawnUrbanOpportunity(id=state.world.location){
 if(locationRegion(id)!=='spawn'||id==='endless_desert_gate')return null;
 const rows=SPAWN_URBAN_OPPORTUNITIES.filter(x=>x.districts.includes(id));
 if(!rows.length)return null;
 return rows[spawnUrbanHash(`${state.world.day}|${id}|urban-life`)%rows.length]
}
function spawnUrbanOpportunityResolution(id=state.world.location){return ensureSpawnUrbanLife().resolved[spawnUrbanOpportunityKey(id)]||null}
function spawnUrbanOpportunityHTML(id=state.world.location){
 const e=spawnUrbanOpportunity(id),done=spawnUrbanOpportunityResolution(id);if(!e)return'';
 if(done)return `<h3>Urban Opportunity</h3><div class="card compact"><b>${esc(e.title)}</b> • <small>${esc(e.kind)}</small><br>${esc(done.result)}<br><small>Resolved today • local involvement, no campaign time spent.</small></div>`;
 return `<h3>Urban Opportunity</h3><button id="spawnUrbanOpportunity"><b>${esc(e.title)}</b><small>${esc(e.kind)} • ${esc(e.text)}</small></button>`
}
function wireSpawnUrbanOpportunity(id=state.world.location){if($('#spawnUrbanOpportunity'))$('#spawnUrbanOpportunity').onclick=()=>showSpawnUrbanOpportunity(id)}
function showSpawnUrbanOpportunity(id=state.world.location){
 const e=spawnUrbanOpportunity(id);if(!e)return showSpawnDistrictGuide(id);modalRouteEnter('showSpawnUrbanOpportunity',[id]);
 const done=spawnUrbanOpportunityResolution(id);
 overlay(`<h2>${esc(e.title)}</h2><p>${esc(e.text)}</p><div class="notice compact"><b>${esc(e.kind)}</b> • This is a short local incident. Resolving it does not advance the campaign day.</div>${done?`<div class="card"><b>Resolved today</b><p>${esc(done.result)}</p></div>`:`<div class="choice-list compact">${e.actions.map(a=>`<button data-urbanlife="${esc(a.id)}" ${a.cost&&state.gold<a.cost?'disabled':''}><b>${esc(a.label)}</b><small>${a.gold?`Reward: ${a.gold} gold${a.rep?' • ':''}`:''}${a.rep?`Local reputation ${a.rep>0?'+':''}${a.rep}`:''}${a.lawRep?`${a.rep?' • ':''}Watch standing ${a.lawRep>0?'+':''}${a.lawRep}`:''}</small></button>`).join('')}</div>`}<div class="dialog-footer"><button id="spawnUrbanLifeBack">Back to ${esc(worldLocation(id).name)}</button></div>`,true);
 document.querySelectorAll('[data-urbanlife]').forEach(b=>b.onclick=()=>resolveSpawnUrbanOpportunity(id,b.dataset.urbanlife));$('#spawnUrbanLifeBack').onclick=()=>modalNavBackOrFallback(()=>showSpawnDistrictGuide(id))
}
function resolveSpawnUrbanOpportunity(id,actionId){
 const e=spawnUrbanOpportunity(id),L=ensureSpawnUrbanLife(),key=spawnUrbanOpportunityKey(id);if(!e||L.resolved[key])return showSpawnUrbanOpportunity(id);
 const a=e.actions.find(x=>x.id===actionId);if(!a)return showSpawnUrbanOpportunity(id);
 if(a.cost){if(state.gold<a.cost)return actionResult('Not Enough Gold',`You need ${a.cost} gold for that choice.`,'info',()=>showSpawnUrbanOpportunity(id));state.gold-=a.cost}
 if(a.gold)state.gold+=a.gold;
 if(a.rep&&typeof changeLocalReputation==='function')changeLocalReputation(id,a.rep,`Urban involvement: ${e.title}`);
 if(a.lawRep&&typeof adjustJurisdictionRep==='function')adjustJurisdictionRep(id,a.lawRep,`Urban involvement: ${e.title}`);
 const rec={day:state.world.day,district:id,event:e.id,title:e.title,action:a.id,result:a.result,gold:(a.gold||0)-(a.cost||0),rep:a.rep||0,lawRep:a.lawRep||0};
 L.resolved[key]=rec;L.history.push(rec);if(L.history.length>80)L.history.shift();
 if(typeof recordWorldHistory==='function')recordWorldHistory(`${worldLocation(id).name}: ${e.title} — ${a.result}`,'good','Spawn urban life');
 save();showSpawnUrbanOpportunity(id)
}
