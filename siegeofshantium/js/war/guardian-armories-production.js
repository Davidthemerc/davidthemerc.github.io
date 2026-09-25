/* v1.6.66.28 — Armories & Guardian Production */
const GUARDIAN_ARMORY_PRODUCTION_VERSION=1;
const GUARDIAN_ARMORY_LEVELS=[
 {name:'Quartermaster Stores',bonus:0,cost:0,materials:{}},
 {name:'Expanded Military Armory',bonus:120,cost:900,materials:{timber:8,iron:10,stone:6,tools:3}},
 {name:'Arsenal Storehouses',bonus:280,cost:1800,materials:{timber:14,iron:18,stone:12,tools:6}},
 {name:'Strategic Arsenal Complex',bonus:520,cost:3200,materials:{timber:22,iron:30,stone:20,tools:10}}
];
const GUARDIAN_REPAIR_LEVELS=[
 {name:'No Dedicated Repair Shop',cost:0,materials:{}},
 {name:'Armorer Repair Shop',cost:700,materials:{timber:5,iron:8,stone:4,tools:4}},
 {name:'Military Repair Yard',cost:1450,materials:{timber:9,iron:14,stone:8,tools:7}},
 {name:'Ordnance Repair Depot',cost:2600,materials:{timber:14,iron:22,stone:12,tools:11}}
];
const GUARDIAN_WORKSHOP_LEVELS=[
 {name:'No Guardian Production',cost:0,materials:{}},
 {name:'Military Workshop',cost:1100,materials:{timber:8,iron:12,stone:6,tools:5}},
 {name:'Guardian Manufactury',cost:2400,materials:{timber:14,iron:22,stone:12,tools:9}},
 {name:'Guardian Arsenal Works',cost:4200,materials:{timber:22,iron:36,stone:18,tools:14}}
];
const GUARDIAN_PRODUCTION_RECIPES={
 kits:{name:'Standard field kits',batch:10,days:6,materials:{iron:4,cloth:2,tools:1}},
 medical:{name:'Field medical packs',batch:10,days:5,materials:{medicine:3,cloth:2}}
};
function guardianArmoryProductionState(){
 const A=guardianArsenalState(),base=Math.max(80,Math.round((guardianBarracksState().capacity||40)*1.5));
 if(!A.production||typeof A.production!=='object')A.production={version:GUARDIAN_ARMORY_PRODUCTION_VERSION,armoryLevel:0,repairLevel:0,workshopLevel:0,damagedKits:0,repairQueue:[],productionQueue:[],history:[],lastTickDay:state.world.day,totalRepaired:0,totalProducedKits:0,totalProducedMedical:0};
 const P=A.production;P.version=GUARDIAN_ARMORY_PRODUCTION_VERSION;
 for(const k of ['armoryLevel','repairLevel','workshopLevel'])P[k]=clamp(Math.round(Number(P[k])||0),0,3);
 for(const k of ['damagedKits','totalRepaired','totalProducedKits','totalProducedMedical'])P[k]=Math.max(0,Math.round(Number(P[k])||0));
 if(!Array.isArray(P.repairQueue))P.repairQueue=[];if(!Array.isArray(P.productionQueue))P.productionQueue=[];if(!Array.isArray(P.history))P.history=[];
 A.capacity=base+(GUARDIAN_ARMORY_LEVELS[P.armoryLevel]?.bonus||0);
 return P;
}
const __guardianArsenalStateArmories=guardianArsenalState;
guardianArsenalState=function(){const A=__guardianArsenalStateArmories.apply(this,arguments);if(A.production){const l=clamp(Math.round(Number(A.production.armoryLevel)||0),0,3),base=Math.max(80,Math.round((guardianBarracksState().capacity||40)*1.5));A.capacity=base+(GUARDIAN_ARMORY_LEVELS[l]?.bonus||0)}return A};
function guardianArmoryRecord(text){const P=guardianArmoryProductionState();P.history.push({day:state.world.day,text});P.history=P.history.slice(-60);guardianArsenalRecord('armory_production',text)}
function guardianArmoryMaterialStatus(plan){ensureHomeBase();return Object.entries(plan||{}).map(([id,need])=>({id,name:worldGood(id)?.name||id,need,have:state.world.homeBase.tradeGoods?.[id]||0}))}
function guardianArmoryHasMaterials(plan){return guardianArmoryMaterialStatus(plan).every(x=>x.have>=x.need)}
function guardianArmoryConsumeMaterials(plan){ensureHomeBase();const G=state.world.homeBase.tradeGoods;for(const [id,q] of Object.entries(plan||{})){G[id]=(G[id]||0)-q;if(G[id]<=0)delete G[id]}}
function guardianArmoryMaterialsText(plan){return guardianArmoryMaterialStatus(plan).map(x=>`${x.need} ${x.name}${x.have<x.need?` (${x.have} held)`:''}`).join(' • ')}
function guardianArmoryUpgrade(kind){
 const P=guardianArmoryProductionState(),key=kind==='armory'?'armoryLevel':kind==='repair'?'repairLevel':'workshopLevel',defs=kind==='armory'?GUARDIAN_ARMORY_LEVELS:kind==='repair'?GUARDIAN_REPAIR_LEVELS:GUARDIAN_WORKSHOP_LEVELS,n=P[key]+1,d=defs[n],F=guardianForceState();
 if(!d)return showGuardianArmoryProduction();if(F.treasury<d.cost)return actionResult('Military Works Not Funded',`${fmt(d.cost)} gold is required from the military treasury.`,'bad',showGuardianArmoryProduction);if(!guardianArmoryHasMaterials(d.materials))return actionResult('Construction Materials Required',`The works require ${guardianArmoryMaterialsText(d.materials)} from Hall Stores.`,'info',showGuardianArmoryProduction);
 F.treasury-=d.cost;guardianArmoryConsumeMaterials(d.materials);P[key]=n;guardianArmoryRecord(`${d.name} is completed for the Guardian military establishment.`);save();return actionResult('Military Works Completed',`${d.name} is now in service.`,'good',showGuardianArmoryProduction)
}
function guardianArmoryQueueProduction(kind,batches=1){
 const P=guardianArmoryProductionState(),r=GUARDIAN_PRODUCTION_RECIPES[kind];batches=Math.max(1,Math.round(Number(batches)||1));if(!r||P.workshopLevel<1)return showGuardianArmoryProduction();
 const mats=Object.fromEntries(Object.entries(r.materials).map(([k,v])=>[k,v*batches])),qty=r.batch*batches,days=Math.max(2,Math.ceil(r.days*batches/(1+(P.workshopLevel-1)*.45)));
 if(!guardianArmoryHasMaterials(mats))return actionResult('Workshop Materials Required',`${qty} ${r.name.toLowerCase()} require ${guardianArmoryMaterialsText(mats)} from Hall Stores.`,'info',showGuardianArmoryProduction);
 if(kind==='kits'){const A=guardianArsenalState(),reserved=P.productionQueue.filter(x=>x.kind==='kits').reduce((n,x)=>n+x.quantity,0);if(A.standardKits+reserved+qty>A.capacity)return actionResult('Arsenal Capacity Reserved',`There is not enough uncommitted Arsenal storage for another ${qty} kits.`,'bad',showGuardianArmoryProduction)}
 guardianArmoryConsumeMaterials(mats);P.productionQueue.push({id:'GMW-'+uid(),kind,quantity:qty,startedDay:state.world.day,dueDay:state.world.day+days,materials:mats,status:'in_production'});guardianArmoryRecord(`Guardian workshops begin producing ${qty} ${r.name.toLowerCase()}; completion is expected on Day ${state.world.day+days}.`);save();showGuardianArmoryProduction()
}
function guardianArmoryQueueRepair(count=10){
 const P=guardianArmoryProductionState();if(P.repairLevel<1||P.damagedKits<1)return showGuardianArmoryProduction();count=Math.min(P.damagedKits,Math.max(1,Math.round(Number(count)||10)));const batches=Math.ceil(count/10),mats={iron:batches,tools:batches},days=Math.max(1,Math.ceil((3+batches)/(1+(P.repairLevel-1)*.5)));
 if(!guardianArmoryHasMaterials(mats))return actionResult('Repair Materials Required',`${count} damaged kits require ${guardianArmoryMaterialsText(mats)} from Hall Stores.`,'info',showGuardianArmoryProduction);
 const A=guardianArsenalState(),reserved=P.repairQueue.reduce((n,x)=>n+x.quantity,0)+P.productionQueue.filter(x=>x.kind==='kits').reduce((n,x)=>n+x.quantity,0);if(A.standardKits+reserved+count>A.capacity)return actionResult('Arsenal Capacity Reserved','There is not enough Arsenal storage to receive the repaired kits.','bad',showGuardianArmoryProduction);
 guardianArmoryConsumeMaterials(mats);P.damagedKits-=count;P.repairQueue.push({id:'GAR-'+uid(),quantity:count,startedDay:state.world.day,dueDay:state.world.day+days,materials:mats,status:'repairing'});guardianArmoryRecord(`${count} damaged field kits enter the repair shop; completion is expected on Day ${state.world.day+days}.`);save();showGuardianArmoryProduction()
}
function guardianArmoryProductionDailyTick(){
 const P=guardianArmoryProductionState();if(P.lastTickDay===state.world.day)return;P.lastTickDay=state.world.day;const A=guardianArsenalState();
 for(const q of P.repairQueue){if(q.status!=='repairing'||state.world.day<q.dueDay)continue;if(A.standardKits+q.quantity>A.capacity){q.status='awaiting_space';continue}A.standardKits+=q.quantity;P.totalRepaired+=q.quantity;q.status='complete';q.completedDay=state.world.day;guardianArmoryRecord(`${q.quantity} repaired standard field kits return to serviceable Arsenal stores.`)}
 for(const q of P.repairQueue){if(q.status==='awaiting_space'&&A.standardKits+q.quantity<=A.capacity){A.standardKits+=q.quantity;P.totalRepaired+=q.quantity;q.status='complete';q.completedDay=state.world.day;guardianArmoryRecord(`${q.quantity} repaired kits enter Arsenal stores after space becomes available.`)}}
 for(const q of P.productionQueue){if(q.status!=='in_production'||state.world.day<q.dueDay)continue;if(q.kind==='kits'&&A.standardKits+q.quantity>A.capacity){q.status='awaiting_space';continue}if(q.kind==='kits'){A.standardKits+=q.quantity;P.totalProducedKits+=q.quantity}else{A.medicalPacks+=q.quantity;P.totalProducedMedical+=q.quantity}q.status='complete';q.completedDay=state.world.day;guardianArmoryRecord(`Guardian workshops complete ${q.quantity} ${GUARDIAN_PRODUCTION_RECIPES[q.kind].name.toLowerCase()}.`)}
 for(const q of P.productionQueue){if(q.status==='awaiting_space'&&q.kind==='kits'&&A.standardKits+q.quantity<=A.capacity){A.standardKits+=q.quantity;P.totalProducedKits+=q.quantity;q.status='complete';q.completedDay=state.world.day;guardianArmoryRecord(`${q.quantity} newly manufactured kits enter Arsenal stores after space becomes available.`)}}
}
const __guardianWarRemoveSoldiersArmories=guardianWarRemoveSoldiers;
guardianWarRemoveSoldiers=function(U,count){const E=U?guardianFormationEquipmentService(U):null,before=E?E.kitsLost:0,lost=__guardianWarRemoveSoldiersArmories(U,count);if(U&&lost>0){const after=guardianFormationEquipmentService(U).kitsLost,newLoss=Math.max(0,after-before);if(newLoss){const P=guardianArmoryProductionState(),repairable=Math.min(newLoss,Math.round(newLoss*(.25+Math.random()*.25)));if(repairable){P.damagedKits+=repairable;guardianFormationRecord(U,'equipment_recovery',`${repairable} otherwise unserviceable field kit${repairable===1?' was':'s were'} recovered for Arsenal repair.`);guardianArmoryRecord(`${repairable} damaged kit${repairable===1?' is':'s are'} recovered from ${U.name} for repair.`)}}}return lost};
const __warStrategicDailyTickArmories=warStrategicDailyTick;warStrategicDailyTick=function(){const out=__warStrategicDailyTickArmories.apply(this,arguments),perf=(n,fn)=>typeof sosPerfRun==='function'?sosPerfRun(n,fn):fn();perf('War — Guardian Armories & Production',()=>guardianArmoryProductionDailyTick());return out};
function showGuardianArmoryProduction(){
 modalRouteEnter('showGuardianArmoryProduction',Array.from(arguments));guardianArmoryProductionDailyTick();const P=guardianArmoryProductionState(),A=guardianArsenalState(),F=guardianForceState(),al=GUARDIAN_ARMORY_LEVELS[P.armoryLevel],rl=GUARDIAN_REPAIR_LEVELS[P.repairLevel],wl=GUARDIAN_WORKSHOP_LEVELS[P.workshopLevel],active=[...P.repairQueue,...P.productionQueue].filter(x=>!['complete'].includes(x.status));
 const upgrade=(kind,defs,lvl)=>{const d=defs[lvl+1];return d?`<div class="card compact"><b>Next: ${esc(d.name)}</b><div class="stat-row"><span>Military treasury cost</span><b>${fmt(d.cost)} gold</b></div><small>${esc(guardianArmoryMaterialsText(d.materials))}</small><button data-gap-up="${kind}" ${F.treasury>=d.cost&&guardianArmoryHasMaterials(d.materials)?'':'disabled'}>Construct / Expand</button></div>`:'<p class="muted">This facility is fully developed.</p>'};
 overlay(`<h2>Guardian Armories & Production</h2><p>The Guardian military can store, recover, repair and manufacture accountable field equipment. Workshop production uses physical materials from Hall Stores; civilian contractors remain available for surge purchases.</p><div class="card compact"><div class="stat-row"><span>Military armory</span><b>${esc(al.name)}</b></div><div class="stat-row"><span>Unissued kits / capacity</span><b>${A.standardKits}/${A.capacity}</b></div><div class="stat-row"><span>Damaged kits awaiting repair</span><b>${P.damagedKits}</b></div><div class="stat-row"><span>Repair facility</span><b>${esc(rl.name)}</b></div><div class="stat-row"><span>Production facility</span><b>${esc(wl.name)}</b></div><div class="stat-row"><span>Military treasury</span><b>${fmt(F.treasury)} gold</b></div></div><h3>Military Armory</h3>${upgrade('armory',GUARDIAN_ARMORY_LEVELS,P.armoryLevel)}<h3>Repair Facilities</h3>${upgrade('repair',GUARDIAN_REPAIR_LEVELS,P.repairLevel)}${P.repairLevel&&P.damagedKits?`<div class="choice-list"><button data-gap-repair="10">Repair up to 10 Damaged Kits</button><button data-gap-repair="50">Repair up to 50 Damaged Kits</button></div>`:''}<h3>Guardian Workshops</h3>${upgrade('workshop',GUARDIAN_WORKSHOP_LEVELS,P.workshopLevel)}${P.workshopLevel?`<div class="choice-list"><button data-gap-prod="kits|1">Manufacture 10 Standard Kits</button><button data-gap-prod="kits|5">Manufacture 50 Standard Kits</button><button data-gap-prod="medical|1">Manufacture 10 Medical Packs</button></div><small>10 kits: ${esc(guardianArmoryMaterialsText(GUARDIAN_PRODUCTION_RECIPES.kits.materials))} • 10 medical packs: ${esc(guardianArmoryMaterialsText(GUARDIAN_PRODUCTION_RECIPES.medical.materials))}</small>`:''}<h3>Work in Progress</h3>${active.map(q=>`<div class="card compact"><b>${esc(q.id)}</b> — ${q.quantity} ${q.kind?esc(GUARDIAN_PRODUCTION_RECIPES[q.kind]?.name||q.kind):'standard field kits'}<br><small>${q.status==='awaiting_space'?'Complete — awaiting Arsenal space':`Expected Day ${q.dueDay}`}</small></div>`).join('')||'<p class="muted">No military workshop or repair work is currently underway.</p>'}<h3>Production Record</h3><div class="card compact"><div class="stat-row"><span>Kits repaired</span><b>${P.totalRepaired}</b></div><div class="stat-row"><span>Kits manufactured</span><b>${P.totalProducedKits}</b></div><div class="stat-row"><span>Medical packs manufactured</span><b>${P.totalProducedMedical}</b></div></div>${P.history.slice(-6).reverse().map(h=>`<div class="card compact"><b>Day ${h.day}</b> — ${esc(h.text)}</div>`).join('')}<div class="dialog-footer"><button id="guardianArmoryProductionBack">Back to Arsenal</button></div>`,true);
 document.querySelectorAll('[data-gap-up]').forEach(b=>b.onclick=()=>guardianArmoryUpgrade(b.dataset.gapUp));document.querySelectorAll('[data-gap-repair]').forEach(b=>b.onclick=()=>guardianArmoryQueueRepair(Number(b.dataset.gapRepair)));document.querySelectorAll('[data-gap-prod]').forEach(b=>b.onclick=()=>{const [k,n]=b.dataset.gapProd.split('|');guardianArmoryQueueProduction(k,Number(n))});$('#guardianArmoryProductionBack').onclick=showGuardianArsenal
}
const __showGuardianArsenalArmories=showGuardianArsenal;showGuardianArsenal=function(){const r=__showGuardianArsenalArmories.apply(this,arguments),dlg=document.querySelector('.dialog');if(!dlg)return r;const footer=dlg.querySelector('.dialog-footer');if(footer&&!document.getElementById('guardianArmoryProductionOpen')){const P=guardianArmoryProductionState(),b=document.createElement('button');b.id='guardianArmoryProductionOpen';b.innerHTML=`<b>Armories & Guardian Production</b><small>${GUARDIAN_ARMORY_LEVELS[P.armoryLevel].name} • ${P.damagedKits} damaged kit${P.damagedKits===1?'':'s'} awaiting repair</small>`;b.onclick=showGuardianArmoryProduction;footer.parentNode.insertBefore(b,footer)}return r};
