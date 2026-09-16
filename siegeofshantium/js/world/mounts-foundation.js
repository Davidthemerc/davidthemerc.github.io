/* v1.6.66.9.5 — Mount Foundation, Markets & Ownership */
const MOUNT_MARKET_REFRESH_DAYS=7;
const MOUNT_BREEDS={
 shantium_sable:{name:'Shantium Sable',region:'shantium',base:{speed:6,stamina:7,carry:6,surefoot:7,courage:7,recovery:7},price:1450,desc:'A balanced Shantium riding horse: steady, durable, and dependable on mixed roads.'},
 sengian_courser:{name:'Sengian Courser',region:'redstone',base:{speed:10,stamina:5,carry:3,surefoot:5,courage:6,recovery:3},price:3100,desc:'A very fast Sengian horse bred for hard riding and pursuit, with limited carrying ability and slower recovery after being pushed.'},
 redstone_charger:{name:'Redstone Charger',region:'redstone',base:{speed:7,stamina:8,carry:7,surefoot:6,courage:9,recovery:6},price:2550,desc:'A powerful military riding horse valued for courage, stamina, and carrying strength.'},
 lockwood_ranger:{name:'Lockwood Ranger',region:'redstone',base:{speed:7,stamina:8,carry:6,surefoot:9,courage:7,recovery:8},price:2200,desc:'A compact woodland horse bred for broken ground, forest roads, and long days under saddle.'},
 bluestone_highlander:{name:'Bluestone Highlander',region:'bluestone',base:{speed:6,stamina:9,carry:7,surefoot:10,courage:8,recovery:8},price:2350,desc:'A sure-footed mountain horse with exceptional stamina and difficult-terrain ability.'},
 spawn_roadster:{name:'Spawn Roadster',region:'spawn',base:{speed:8,stamina:7,carry:5,surefoot:6,courage:7,recovery:7},price:2050,desc:'A road-bred horse accustomed to traffic, crowds, carts, and maintained highways.'}
};
const MOUNT_SPECIES={donkey:{name:'Donkey',base:{speed:3,stamina:9,carry:8,surefoot:9,courage:6,recovery:9},price:420,travelBonus:.05,packSlots:3},mule:{name:'Mule',base:{speed:5,stamina:9,carry:9,surefoot:9,courage:7,recovery:9},price:950,travelBonus:.22,packSlots:4}};
const MOUNT_STAT_KEYS=['speed','stamina','carry','surefoot','courage','recovery'];
function mountClampStat(n){return Math.max(1,Math.min(13,Math.round(n||1)))}
function mountHash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mountRand(seed,n=10000){return (mountHash(seed)%n)/n}
function mountPick(seed,arr){return arr[Math.floor(mountRand(seed)*arr.length)%arr.length]}
function ensureMountState(){ensureWorldState();if(!state.world.mounts||typeof state.world.mounts!=='object')state.world.mounts={version:1,owned:[],markets:{},history:[],nextId:1};const M=state.world.mounts;if(!Array.isArray(M.owned))M.owned=[];if(!M.markets)M.markets={};if(!Array.isArray(M.history))M.history=[];if(!Number.isFinite(M.nextId))M.nextId=1;return M}
function mountSettlementEligible(locId){const l=worldLocation(locId);return !!l&&['town','settlement','camp'].includes(l.type)&&settlementServiceAvailable(locId)}
function mountMarketCount(loc){const t=loc?.settlementTier||'village';return t==='city'?10:t==='town'?6:t==='outpost'?3:3}
function mountVariation(seed,species,key){const r=mountRand(seed+':'+key);if(species==='donkey'){if(r<.025)return -3;if(r<.10)return -2;if(r<.31)return -1;if(r<.69)return 0;if(r<.90)return 1;if(r<.975)return 2;return 3}return Math.floor(mountRand(seed+':wide:'+key)*9)-4}
function mountHorseBreedPool(locId){const region=locationRegion(locId),local=Object.keys(MOUNT_BREEDS).filter(k=>MOUNT_BREEDS[k].region===region),common=region==='shantium'?'shantium_sable':region==='bluestone'?'bluestone_highlander':region==='redstone'?(locId==='lockwood'?'lockwood_ranger':'redstone_charger'):region==='spawn'?'spawn_roadster':'shantium_sable';return [common,common,common,...local,...Object.keys(MOUNT_BREEDS)]}
function mountGeneratedName(seed){const a=['Ash','Bramble','Cinder','Dusk','Ember','Flint','Hazel','Juniper','Moss','Night','Oak','Rain','River','Rowan','Sable','Slate','Storm','Thistle','Willow'],b=['bell','fall','foot','mane','mark','step','stone','wind','wood','runner','star','song'];return mountPick(seed+':a',a)+mountPick(seed+':b',b)}
function generateMarketMount(locId,index,cycle){const seed=`${locId}:${cycle}:${index}`,r=mountRand(seed+':species'),species=r<.30?'donkey':r<.46?'mule':'horse';let breedId=null,base,basePrice,breedName;if(species==='horse'){breedId=mountPick(seed+':breed',mountHorseBreedPool(locId));const B=MOUNT_BREEDS[breedId];base=B.base;basePrice=B.price;breedName=B.name}else{const S=MOUNT_SPECIES[species];base=S.base;basePrice=S.price;breedName=S.name}const stats={};for(const k of MOUNT_STAT_KEYS)stats[k]=mountClampStat(base[k]+mountVariation(seed,species,k));const quality=MOUNT_STAT_KEYS.reduce((a,k)=>a+stats[k]-base[k],0),price=Math.max(120,Math.round(basePrice*(1+quality*.035)*(0.93+mountRand(seed+':price')*.14)/10)*10);return{id:`market_${locId}_${cycle}_${index}`,species,breedId,breedName,name:mountGeneratedName(seed),stats,price,sex:mountRand(seed+':sex')<.5?(species==='horse'?'mare':'female'):(species==='horse'?'stallion':'male'),age:3+Math.floor(mountRand(seed+':age')*(species==='horse'?9:12)),origin:locId,marketLoc:locId,generatedDay:cycle*MOUNT_MARKET_REFRESH_DAYS}}
function ensureMountMarket(locId){const M=ensureMountState(),cycle=Math.floor((state.world.day||1)/MOUNT_MARKET_REFRESH_DAYS),old=M.markets[locId];if(old&&old.cycle===cycle&&Array.isArray(old.stock))return old;const count=mountMarketCount(worldLocation(locId)),stock=[];for(let i=0;i<count;i++)stock.push(generateMarketMount(locId,i,cycle));return M.markets[locId]={cycle,refreshDay:(cycle+1)*MOUNT_MARKET_REFRESH_DAYS,stock}}
function mountBaseFor(m){return m.species==='horse'?MOUNT_BREEDS[m.breedId]?.base:MOUNT_SPECIES[m.species]?.base}
function mountDeviationHTML(m){const b=mountBaseFor(m)||m.stats;return MOUNT_STAT_KEYS.map(k=>{const d=m.stats[k]-b[k],label=k==='surefoot'?'Surefoot':k[0].toUpperCase()+k.slice(1);return `<span><small>${label}</small><b>${m.stats[k]}</b>${d?`<em class="${d>0?'mount-stat-up':'mount-stat-down'}">${d>0?'+':''}${d}</em>`:''}</span>`}).join('')}
function mountSpeciesRole(m){if(m.species==='donkey')return 'Efficient pack animal • +5% ordinary travel foundation • very high stamina';if(m.species==='mule')return 'Premium pack animal • faster than a donkey • excellent stamina and rough-ground ability';return MOUNT_BREEDS[m.breedId]?.desc||'Riding horse'}
function mountPurchase(locId,id){const M=ensureMountState(),market=ensureMountMarket(locId),i=market.stock.findIndex(x=>x.id===id);if(i<0)return showMountMarket(locId);const m=market.stock[i];if(state.gold<m.price)return actionResult('Not Enough Gold',`${m.name} costs ${m.price} gold.`,'bad',()=>showMountMarket(locId));state.gold-=m.price;market.stock.splice(i,1);const owned={...m,id:`mount_${M.nextId++}`,ownedDay:state.world.day,purchasePrice:m.price,purchaseLocation:locId,status:'owned',assignment:'unassigned',parents:null,offspring:[]};M.owned.push(owned);M.history.push({day:state.world.day,type:'purchase',mountId:owned.id,name:owned.name,location:locId,price:m.price});if(M.history.length>120)M.history.splice(0,M.history.length-120);log(`Purchased ${owned.name}, a ${owned.breedName}, in ${worldLocation(locId).name} for ${m.price} gold.`,'good');save();showMountMarket(locId)}
function showMountMarket(locId=state.world.location){modalRouteEnter('showMountMarket',Array.from(arguments));ensureMountState();if(!mountSettlementEligible(locId)||state.world.location!==locId)return actionResult('No Mount Market','The Guardian must be present at an operating settlement to inspect its animals.','info',()=>showSettlementServices(state.world.location));const market=ensureMountMarket(locId),loc=worldLocation(locId),days=Math.max(1,market.refreshDay-state.world.day),stock=market.stock.map(m=>`<div class="card mount-market-card"><div class="mount-card-head"><span><h3>${esc(m.name)}</h3><small>${esc(m.breedName)} • ${esc(m.sex)} • age ${m.age}</small></span><b>${m.price}g</b></div><p>${esc(mountSpeciesRole(m))}</p><div class="mount-stat-grid">${mountDeviationHTML(m)}</div><button data-mountbuy="${m.id}" ${state.gold<m.price?'disabled':''}>Buy ${esc(m.name)}</button></div>`).join('');overlay(`<h2>${esc(loc.name)} — Horse & Pack-Animal Market</h2><p>Animals are individual stock. Statistics are shown against the usual qualities of their breed or species, making unusually strong animals easy to spot.</p><div class="notice compact"><b>${market.stock.length} animals offered</b> • stock turns over in about ${days} day${days===1?'':'s'} • Guardian gold ${state.gold}g</div><div class="shop-grid mount-market-grid">${stock||'<div class="notice">The animal market is sold out until its next turnover.</div>'}</div><div class="dialog-footer"><button id="mountOwned">Owned Mounts (${ensureMountState().owned.length})</button><button id="mountMarketBack">Back to Local Services</button></div>`,true);document.querySelectorAll('[data-mountbuy]').forEach(b=>b.onclick=()=>mountPurchase(locId,b.dataset.mountbuy));$('#mountOwned').onclick=()=>showOwnedMounts(locId);$('#mountMarketBack').onclick=()=>showSettlementServices(locId)}
function showOwnedMounts(returnLoc=state.world.location){modalRouteEnter('showOwnedMounts',Array.from(arguments));const M=ensureMountState(),rows=M.owned.map(m=>`<div class="card mount-market-card"><div class="mount-card-head"><span><h3>${esc(m.name)}</h3><small>${esc(m.breedName)} • ${esc(m.sex)} • age ${m.age}</small></span><b>${esc(m.assignment||'unassigned')}</b></div><div class="mount-stat-grid">${mountDeviationHTML(m)}</div><p><small>Purchased Day ${m.ownedDay} in ${esc(worldLocation(m.purchaseLocation)?.name||m.purchaseLocation)} for ${m.purchasePrice}g.</small></p></div>`).join('');overlay(`<h2>Owned Mounts</h2><p>These animals persist individually. Riding, pack, breeding, and stable assignments will be activated as the mount system expands.</p>${rows||'<div class="notice">The Guardian does not own any mounts yet.</div>'}<div class="dialog-footer">${typeof hallStableLevel==='function'&&hallStableLevel()?'<button id="ownedHallStable">Guardian Hall Stable</button>':''}<button id="ownedMountBack">Back</button></div>`,true);$('#ownedMountBack').onclick=()=>mountSettlementEligible(returnLoc)&&state.world.location===returnLoc?showMountMarket(returnLoc):renderOpenWorld()}

/* v1.6.66.9.6 — Mounted Travel, Pursuit & Endurance */
function mountConditionEnsure(m){if(!m.condition)m.condition='fresh';if(!Number.isFinite(m.fatigue))m.fatigue=0;if(!Number.isFinite(m.recoverUntilDay))m.recoverUntilDay=0;if(m.recoverUntilDay&&state.world.day>=m.recoverUntilDay){m.recoverUntilDay=0;m.fatigue=Math.max(0,m.fatigue-55);m.condition=m.fatigue>=70?'tired':m.fatigue>=35?'winded':'fresh'}return m}
function mountTraveling(){return ensureMountState().owned.filter(m=>{mountConditionEnsure(m);return ['riding','pack'].includes(m.assignment)&&m.status==='owned'})}
function mountRiding(){return mountTraveling().filter(m=>m.assignment==='riding'&&m.species!=='donkey')}
function mountPartyPeopleCount(){return 1+(Array.isArray(state.companions)?state.companions.filter(c=>c&&c.active!==false).length:0)}
function mountConditionFactor(m){mountConditionEnsure(m);if(m.recoverUntilDay>state.world.day)return .18;if(m.condition==='exhausted')return .12;if(m.condition==='tired')return .55;if(m.condition==='winded')return .78;return 1}
function mountOrdinaryTravelBonus(){
 const traveling=mountTraveling();if(!traveling.length)return 0;
 const people=Math.max(1,mountPartyPeopleCount()),riders=mountRiding(),coverage=Math.min(1,riders.length/people);
 const ride=riders.length?riders.reduce((a,m)=>a+Math.max(.08,(m.stats.speed-3)*.055)*mountConditionFactor(m),0)/riders.length*coverage:0;
 const donkey=traveling.some(m=>m.species==='donkey')?.05:0;
 const mule=traveling.some(m=>m.species==='mule')?.10:0;
 return Math.max(donkey,mule,ride)
}
function mountPursuitBonus(){
 const people=Math.max(1,mountPartyPeopleCount()),riders=mountRiding();if(!riders.length)return 0;
 const coverage=Math.min(1,riders.length/people),avg=riders.reduce((a,m)=>a+Math.max(0,m.stats.speed-4)*.62*mountConditionFactor(m),0)/riders.length;
 return avg*coverage
}
function mountPursuitStepSpeedMultiplier(){return 1+Math.min(.85,mountPursuitBonus()*.085)}
function mountUseForPursuit(forced=false){
 const riders=mountRiding();if(!riders.length)return;
 for(const m of riders){mountConditionEnsure(m);const endurance=Math.max(1,m.stats.stamina),recovery=Math.max(1,m.stats.recovery),speed=Math.max(1,m.stats.speed),gain=Math.max(5,Math.round((forced?30:18)+(speed*1.5)-endurance));m.fatigue=Math.min(100,m.fatigue+gain);
   if(m.fatigue>=88){m.condition='exhausted';const poorRecovery=Math.max(0,7-recovery),days=Math.max(1,Math.min(2,1+Math.floor((poorRecovery+(speed>=9?2:0))/5)));m.recoverUntilDay=Math.max(m.recoverUntilDay||0,state.world.day+days)}
   else if(m.fatigue>=65)m.condition='tired';else if(m.fatigue>=32)m.condition='winded';else m.condition='fresh'
 }
}
function mountDailyRecovery(){
 for(const m of ensureMountState().owned){mountConditionEnsure(m);if(m.status!=='owned')continue;if(m.recoverUntilDay>state.world.day)continue;const rate=Math.max(7,Math.round(7+m.stats.recovery*1.8));m.fatigue=Math.max(0,m.fatigue-rate);m.condition=m.fatigue>=88?'exhausted':m.fatigue>=65?'tired':m.fatigue>=32?'winded':'fresh'}
}
function mountAssign(id,assignment){
 const m=ensureMountState().owned.find(x=>x.id===id);if(!m)return;
 if(assignment==='riding'&&m.species==='donkey')return actionResult('Pack Animal',`${m.name} is kept as a pack animal rather than a pursuit mount.`,'info',()=>showOwnedMounts(state.world.location));
 m.assignment=assignment;save();showOwnedMounts(state.world.location)
}
const _mountOwnedBase=showOwnedMounts;
function mountPartyRiderChoices(){
 const rows=[{id:'guardian',name:state.name||'Guardian'}];
 if(typeof partyMembers==='function')for(const m of partyMembers(true))rows.push({id:m.id,name:m.name});
 return rows
}
function mountRiderName(id){return mountPartyRiderChoices().find(x=>x.id===id)?.name||'Unassigned rider'}
function mountAssignRider(id,riderId){
 const M=ensureMountState(),m=M.owned.find(x=>x.id===id);if(!m)return;
 if(m.species==='donkey')return actionResult('Pack Animal',`${m.name} is kept as a pack animal rather than a riding mount.`,'info',()=>showOwnedMounts(state.world.location));
 for(const other of M.owned)if(other.id!==id&&other.assignment==='riding'&&other.riderId===riderId){other.assignment='unassigned';other.riderId=null}
 m.assignment='riding';m.riderId=riderId;save();showOwnedMounts(state.world.location)
}
showOwnedMounts=function(returnLoc=state.world.location){
 modalRouteEnter('showOwnedMounts',Array.from(arguments));const M=ensureMountState(),riders=mountPartyRiderChoices(),rows=M.owned.map(m=>{mountConditionEnsure(m);const recovery=m.recoverUntilDay>state.world.day?` • recovering ${m.recoverUntilDay-state.world.day}d`:'';const rider=m.assignment==='riding'?(m.riderId?mountRiderName(m.riderId):'Rider not assigned'):'';const rideControls=m.species==='donkey'?'':`<div class="mount-rider-controls"><select data-mountriderselect="${m.id}">${riders.map(r=>`<option value="${r.id}" ${m.riderId===r.id?'selected':''}>${esc(r.name)}</option>`).join('')}</select><button data-mountrider="${m.id}">Assign Rider</button></div>`;return `<div class="card mount-market-card"><div class="mount-card-head"><span><h3>${esc(m.name)}</h3><small>${esc(m.breedName)} • ${esc(m.sex)} • age ${m.age}</small></span><b>${esc(m.condition)}${recovery}</b></div><div class="mount-stat-grid">${mountDeviationHTML(m)}</div><p><small>Assignment: <b>${esc(m.assignment||'unassigned')}</b>${rider?` • ${esc(rider)}`:''} • fatigue ${Math.round(m.fatigue||0)}%${m.bornDay&&state.world.day-m.bornDay<MOUNT_BREEDING_MATURITY_DAYS?` • young stock (${MOUNT_BREEDING_MATURITY_DAYS-(state.world.day-m.bornDay)}d to maturity)`:''}</small><br>${typeof mountLineageHTML==='function'?mountLineageHTML(m):''}</p>${rideControls}<div class="button-row"><button data-mountassign="${m.id}:pack">Pack</button><button data-mountassign="${m.id}:unassigned">Leave Behind</button></div></div>`}).join('');
 const people=mountPartyRiderChoices(),ridden=M.owned.filter(m=>m.status==='owned'&&m.assignment==='riding').length,packs=mountPackAnimals().length,cm=mountCaravanMasterPersonalMount();
 overlay(`<h2>Party Mounts & Pack Animals</h2><div class="notice compact"><b>${people.length} party member${people.length===1?'':'s'}</b> • ${ridden} riding mount${ridden===1?'':'s'} • ${Math.max(0,people.length-ridden)} on foot • ${packs} pack animal${packs===1?'':'s'}${cm?`<br><small>Caravan Master: ${esc(state.world.caravanMaster.master.name)} rides ${esc(cm.name)} (their own mount).</small>`:''}</div><div class="notice compact"><b>Company travel pace:</b> ${typeof mountCompanyPaceProfile==='function'?mountCompanyPaceProfile().effective.toFixed(1):'—'} • <b>Travel bonus:</b> +${Math.round((typeof mountOrdinaryTravelMultiplier==='function'?mountOrdinaryTravelMultiplier()-1:mountOrdinaryTravelBonus())*100)}% • <b>Pursuit bonus:</b> +${mountPursuitBonus().toFixed(1)}</div>${typeof mountCargoSummaryHTML==='function'?mountCargoSummaryHTML():''}${rows||'<div class="notice">The Guardian does not own any mounts yet.</div>'}<div class="dialog-footer">${typeof hallStableLevel==='function'&&hallStableLevel()?'<button id="ownedHallStable">Guardian Hall Stable</button>':''}<button id="ownedMountBack">Back</button></div>`,true);
 document.querySelectorAll('[data-mountrider]').forEach(b=>b.onclick=()=>{const sel=document.querySelector(`[data-mountriderselect="${b.dataset.mountrider}"]`);if(sel)mountAssignRider(b.dataset.mountrider,sel.value)});
 document.querySelectorAll('[data-mountassign]').forEach(b=>b.onclick=()=>{const [id,a]=b.dataset.mountassign.split(':');const m=M.owned.find(x=>x.id===id);if(m){m.riderId=null}mountAssign(id,a)});if($('#ownedHallStable'))$('#ownedHallStable').onclick=showHallStable;$('#ownedMountBack').onclick=()=>mountSettlementEligible(returnLoc)&&state.world.location===returnLoc?showMountMarket(returnLoc):renderOpenWorld()
};

/* v1.6.66.9.7 — Pack Animals, Cargo & Player Caravans */
function mountCargoCount(){return Object.values(state.world?.cargo||{}).reduce((a,n)=>a+Math.max(0,Number(n)||0),0)}
function mountPersonalCargoCapacity(){return Math.max(1,mountPartyPeopleCount())}
function mountPackCapacityFor(m){
 mountConditionEnsure(m);if(m.assignment!=='pack'||m.status!=='owned')return 0;
 const base=m.species==='donkey'?3:m.species==='mule'?4:2,standard=(MOUNT_SPECIES[m.species]?.base?.carry||MOUNT_BREEDS[m.breedId]?.base?.carry||6),delta=(m.stats?.carry||standard)-standard;
 return Math.max(1,base+(delta>=3?1:delta<=-3?-1:0))
}
function mountPackAnimals(){return mountTraveling().filter(m=>m.assignment==='pack')}
function mountCargoCapacity(){return mountPersonalCargoCapacity()+mountPackAnimals().reduce((a,m)=>a+mountPackCapacityFor(m),0)}
function mountCargoRoom(){return Math.max(0,mountCargoCapacity()-mountCargoCount())}
function mountCanAddCargo(qty=1){return mountCargoCount()+Math.max(0,qty)<=mountCargoCapacity()}
function mountPackManagementUnits(){return mountPackAnimals().length}
function mountCaravanMasterCapacity(){const C=state.world?.caravanMaster,M=C?.master;return C?.active&&M?Math.max(4,Number(M.capacity)||4):2}
function mountPackTrainSlowdown(){
 const n=mountPackManagementUnits(),managed=mountCaravanMasterCapacity(),over=Math.max(0,n-managed);
 if(!over)return 0;return Math.min(.35,over*.05)
}
function mountCaravanTravelMultiplier(){return 1-mountPackTrainSlowdown()}
function mountCargoSummaryHTML(){const used=mountCargoCount(),cap=mountCargoCapacity(),packs=mountPackAnimals(),slow=Math.round(mountPackTrainSlowdown()*100);return `<div class="notice compact"><b>Carried trade goods:</b> ${used}/${cap}<br><small>${mountPersonalCargoCapacity()} personal capacity${packs.length?` • ${packs.length} pack animal${packs.length===1?'':'s'} add ${packs.reduce((a,m)=>a+mountPackCapacityFor(m),0)}`:''}${slow?` • unmanaged pack train slows travel ${slow}%`:''}</small></div>`}
function mountCargoLimitMessage(returnFn){
 const packs=mountPackAnimals();return actionResult('No Cargo Space',packs.length?'Your party and accompanying pack animals are fully loaded. Assign another animal to pack duty, sell or store cargo, or leave goods behind.':'Each traveler can carry one trade good without pack transport. Assign a horse, donkey, or mule to pack duty to carry more.','info',returnFn)
}

/* v1.6.66.9.20 — Sustainable mounted-company pace */
function mountSustainablePace(m){
 if(!m?.stats)return 0;mountConditionEnsure(m);const f=mountConditionFactor(m),speed=Number(m.stats.speed)||1,stamina=Number(m.stats.stamina)||1,recovery=Number(m.stats.recovery)||1;
 return Math.max(1,(speed*.55+stamina*.30+recovery*.15)*(.72+.28*f));
}
function mountCaravanMasterPersonalMount(){const C=state.world?.caravanMaster,M=C?.master;return C?.active&&M?.personalMount?M.personalMount:null}
function mountCompanyRidingMounts(){const a=mountRiding().slice(),cm=mountCaravanMasterPersonalMount();if(cm)a.push(cm);return a}
function mountCompanyPaceProfile(){
 const people=Math.max(1,mountPartyPeopleCount()),riders=mountRiding(),cm=mountCaravanMasterPersonalMount(),required=people,coverage=Math.min(1,riders.length/required),paces=riders.map(m=>mountSustainablePace(m)).sort((a,b)=>a-b);
 let riding=0;if(paces.length){const slow=paces[0],avg=paces.reduce((a,n)=>a+n,0)/paces.length;riding=slow*.65+avg*.35}if(cm&&riding)riding=Math.min(riding,mountSustainablePace(cm));
 const packs=mountPackAnimals(),packPaces=packs.map(m=>mountSustainablePace(m)),packBase=packPaces.length?Math.min(...packPaces):null,management=1-mountPackTrainSlowdown(),pack=packBase==null?null:packBase*management;
 const effective=riding?(pack==null?riding:Math.min(riding,pack)):0,normalMultiplier=coverage>=.999&&effective?clamp(.82+effective*.055,.9,1.48):1+mountOrdinaryTravelBonus();
 return {riding,pack,effective,coverage,normalMultiplier,limiting:pack!=null&&pack<riding?'pack':'riding'}
}
function mountOrdinaryTravelMultiplier(){return mountCompanyPaceProfile().normalMultiplier}
function mountAdjustedTravelDays(base){base=Math.max(0,Math.round(Number(base)||0));if(base<=1)return base;const mult=mountOrdinaryTravelMultiplier();return Math.max(1,Math.ceil(base/Math.max(.5,mult)))}
