/* v1.6.47 — Spawn Services & Population
   Baseline metropolitan services, institutions, and named residents for all Spawn districts. */

const SPAWN_SERVICE_IDENTITIES={
 spawn_northwest:'Northwest Commons House',spawn_northgate:'Travelers’ Row House',spawn_northcentral:'Highroad Exchange House',spawn_market:'Market Cross Houses',
 spawn_west:'West Commons House',spawn_works:'Guildhall Canteen & Rooms',spawn_civic:'Administrative Guest House',spawn_merchant:'Factors’ House',
 spawn_working:'Foundry Rest House',spawn_oldcity:'Old Arcade House',spawn_centralres:'Central Commons House',spawn_warehouses:'Carters’ House',
 spawn_southwest:'Southwest Commons House',spawn_spirits:'Brewers’ House',spawn_stockyards:'Drovers’ House',spawn_bazaar:'Caravan Courts'
};
const SPAWN_DISTRICT_INSTITUTIONS={
 spawn_northwest:['Northwest Ward Office','Wall Gardens School','Neighborhood Watch Post'],
 spawn_northgate:['North Gate Authority','Travelers’ Registry','Gate Watch Barracks'],
 spawn_northcentral:['Highroad Gate Authority','Arrival Registry','Highroad Watch House'],
 spawn_market:['Market Inspectors’ Office','Weights & Measures Hall','Market Watch'],
 spawn_west:['West Ward Office','West Commons Clinic','Neighborhood Watch Post'],
 spawn_works:['Guild Registry','Works Safety Office','Fire Watch'],
 spawn_civic:['Hall of the Great Admin','Central Archives','Courts of Administration','Metropolitan Watch Headquarters'],
 spawn_merchant:['Commercial Registry','Exchange Hall','Contract Court'],
 spawn_working:['Labor Registry','Foundry Watch','Public Clinic'],
 spawn_oldcity:['Old Ward Office','Covered Cistern Authority','Old Watch House'],
 spawn_centralres:['Central Ward Office','Fountain Court Clinic','Central Watch Post'],
 spawn_warehouses:['Freight Registry','Bonded Stores Authority','Warehouse Watch'],
 spawn_southwest:['Southwest Ward Office','Commons Clinic','South Wall Watch'],
 spawn_spirits:['Brewers’ Guild','Excise Office','Brewers Ward Watch'],
 spawn_stockyards:['Cattle Exchange Authority','Animal Inspectors','Stockyard Watch'],
 spawn_bazaar:['Bazaar Authority','Caravan Registry','Desert Gate Watch']
};
const SPAWN_RESIDENTS={
 spawn_northwest:[['Mara Venn','school registrar'],['Tomas Ell','neighborhood shopkeeper']],
 spawn_northgate:[['Hadrin Cole','innkeeper'],['Sella Marr','travelers’ registrar']],
 spawn_northcentral:[['Oren Vale','gate clerk'],['Ilyra Penn','carriage factor']],
 spawn_market:[['Nessa Tor','general merchant'],['Bram Kest','market inspector'],['Yara Pell','secondhand dealer']],
 spawn_west:[['Davin Rusk','ward clerk'],['Elia Moss','local healer']],
 spawn_works:[['Caro Vey','master glassworker'],['Jannik Pell','textile factor'],['Mera Sol','guild clerk']],
 spawn_civic:[['Alda Ren','archive clerk'],['Corvin Hale','administrative advocate'],['Seren Doss','court usher']],
 spawn_merchant:[['Lysa Varr','commercial broker'],['Teren Quill','counting-house clerk'],['Maro Denn','cargo factor']],
 spawn_working:[['Bessa Korr','labor organizer'],['Joren Pike','repair smith']],
 spawn_oldcity:[['Nira Olden','arcade shopkeeper'],['Calder Voss','cistern keeper']],
 spawn_centralres:[['Eren Tal','schoolmaster'],['Mira Cenn','fountain keeper']],
 spawn_warehouses:[['Garrik Holt','warehouse factor'],['Pella Durn','freight dispatcher']],
 spawn_southwest:[['Rena Birk','commons baker'],['Olan Senn','ward constable']],
 spawn_spirits:[['Vessa Brann','brewer'],['Corl Dey','cooper'],['Mina Tarr','excise clerk']],
 spawn_stockyards:[['Harl Venn','cattle broker'],['Sura Kett','animal inspector'],['Dorrin Bale','drovers’ host']],
 spawn_bazaar:[['Samira Vell','bazaar merchant'],['Korin Dast','caravan registrar'],['Nahil Orr','stablemaster']]
};
function spawnInstallResidents(){
 if(typeof SETTLEMENT_NPCS==='undefined')return;
 for(const [district,rows] of Object.entries(SPAWN_RESIDENTS))if(!SETTLEMENT_NPCS[district])SETTLEMENT_NPCS[district]=rows.map((r,i)=>({id:`${district}_resident_${i+1}`,name:r[0],role:r[1]}));
}
spawnInstallResidents();
function spawnServiceIdentity(id){return SPAWN_SERVICE_IDENTITIES[id]||`${worldLocation(id)?.name||'Spawn'} House`}
function spawnDistrictInstitutionsHTML(id){const rows=SPAWN_DISTRICT_INSTITUTIONS[id]||[];return rows.length?`<h3>Institutions & Authorities</h3>${rows.map(x=>`<div class="card compact">${esc(x)}</div>`).join('')}`:''}
function spawnDistrictPopulationHTML(id){const rows=SPAWN_RESIDENTS[id]||[];return rows.length?`<h3>People of the District</h3><div class="choice-list compact">${rows.map((r,i)=>`<button data-spawnresident="${i}"><b>${esc(r[0])}</b><small>${esc(r[1])}</small></button>`).join('')}</div>`:''}
function showSpawnResident(districtId,index){const row=(SPAWN_RESIDENTS[districtId]||[])[Number(index)];if(!row)return showSpawnDistrictGuide(districtId);const loc=worldLocation(districtId);modalRouteEnter('showSpawnResident',[districtId,index]);overlay(`<h2>${esc(row[0])}</h2><p><b>${esc(row[1])}</b> • ${esc(loc.name)}</p><p>${esc(row[0])} is one of the people whose ordinary work helps keep this part of the Spawn functioning. The conversation ranges over local work, prices, traffic, and whatever has been occupying the district lately.</p><div class="notice compact">The Spawn is densely populated; named residents represent people the Guardian can recognize and return to, not the district’s full population.</div><div class="dialog-footer"><button class="closeModal">Back</button></div>`,true);wireClose()}
function spawnDistrictServicesHTML(id){return `<h3>District Services</h3><div class="choice-list compact"><button id="spawnServices"><b>${esc(spawnServiceIdentity(id))}</b><small>Lodging, food, healing, local trade and traveler services</small></button><button id="spawnLaw"><b>Local Authority</b><small>Watch, warrants, law and district jurisdiction</small></button></div>`}
function wireSpawnDistrictServices(id){if($('#spawnServices'))$('#spawnServices').onclick=()=>navigateTownMenu('services',{locId:id});if($('#spawnLaw'))$('#spawnLaw').onclick=()=>navigateTownMenu('law',{locId:id});document.querySelectorAll('[data-spawnresident]').forEach(b=>b.onclick=()=>showSpawnResident(id,b.dataset.spawnresident))}
