/* v1.6.66.9.11 — Stable Supplies, Predictive Logistics & Emergency Reserves */
const HOME_RESERVE_STORAGE_CAPACITY=[0,30,70,120];
const HOME_SUPPLY_DAILY_BURN={food:0,household:.5,medical:.2,guard:2,hospitality:.34,stable:1};
HOME_LOGISTICS_POLICIES.abundant={name:'Abundant',target:94,cost:104,interval:5,reserveTarget:45,forecastDays:5,desc:'Keeps routine stores near full and maintains a substantial emergency reserve. The Logistics Master orders ahead of expected caravan travel time.'};
HOME_LOGISTICS_POLICIES.strategic={name:'Strategic Reserve',target:98,cost:138,interval:4,reserveTarget:90,forecastDays:8,desc:'Maximum peacetime resilience. The Hall deliberately carries deep protected reserves so an ordinary delayed or missed caravan should not create a shortage.'};
function ensureHomeSupplyReserves(){
 ensureHomeBase();const L=state.world.homeBase.logistics;
 if(L.supplies.stable==null)L.supplies.stable=hallStableLevel()?82:0;
 if(!L.reserve||typeof L.reserve!=='object')L.reserve={food:0,household:0,medical:0,guard:0,hospitality:0,stable:0};
 for(const k of Object.keys(L.supplies))if(L.reserve[k]==null)L.reserve[k]=0;
 if(!L.reserveAddedDay)L.reserveAddedDay={};
 if(L.surplusOpportunity===undefined)L.surplusOpportunity=null;
 return L
}
function homeReserveStorageLevel(){return homeUpgradeLevel('reserveStorage')}
function homeReserveCapacity(){return HOME_RESERVE_STORAGE_CAPACITY[Math.min(3,homeReserveStorageLevel())]||0}
function homeReserveTotal(){const L=ensureHomeSupplyReserves();return Object.values(L.reserve).reduce((n,v)=>n+(Number(v)||0),0)}
function homeReserveTargetPerKind(){const p=homeLogisticsPolicy();return Math.min(homeReserveCapacity(),Number(p.reserveTarget)||0)}
function homeSupplyAverage(){const s=ensureHomeSupplyReserves().supplies,vals=Object.entries(s).filter(([k])=>k!=='stable'||hallStableLevel()).map(([,v])=>v);return Math.round(vals.reduce((a,b)=>a+b,0)/Math.max(1,vals.length))}
function homeSupplyProjected(kind,days){
 const L=ensureHomeSupplyReserves(),burn=kind==='stable'?homeStableSupplyDailyUse():HOME_SUPPLY_DAILY_BURN[kind]||0;
 return (L.supplies[kind]||0)+(L.reserve[kind]||0)-burn*Math.max(0,days)
}
function homeSupplyNeed(){
 const L=ensureHomeSupplyReserves(),p=homeLogisticsPolicy(),shipment=L.shipmentId?state.world.parties.find(x=>x.id===L.shipmentId):null,lead=Math.max(Number(p.forecastDays)||2,shipment?.travelLeft||0);
 const active=Object.keys(L.supplies).filter(k=>k!=='stable'||hallStableLevel());
 return active.some(k=>homeSupplyProjected(k,lead)<p.target-10)||(Number(p.reserveTarget)||0)>0&&active.some(k=>(L.reserve[k]||0)<Math.min(homeReserveCapacity(),p.reserveTarget)*.75)
}
function homeReserveDraw(kind,desiredFloor=20){
 const L=ensureHomeSupplyReserves(),have=L.supplies[kind]||0,need=Math.max(0,desiredFloor-have),take=Math.min(need,L.reserve[kind]||0);
 if(take>0){L.reserve[kind]-=take;L.supplies[kind]=Math.min(100,have+take);homeLogisticsReport(`${Math.round(take)} ${HOME_LOCAL_SUPPLY_LABELS[kind]||kind} reserve released into working stores.`,'info')}
 return take
}
function homeReserveProtectDaily(){
 const L=ensureHomeSupplyReserves(),p=homeLogisticsPolicy(),floor=L.policy==='strategic'?55:L.policy==='abundant'?40:20;
 for(const k of Object.keys(L.supplies))if(k!=='stable'||hallStableLevel())homeReserveDraw(k,floor)
}
function homeApplySupplyDeliveryUnified(amount=24,source='routine'){
 const L=ensureHomeSupplyReserves(),p=homeLogisticsPolicy(),cap=homeReserveCapacity(),rt=Math.min(cap,Number(p.reserveTarget)||0),added={};
 for(const k of Object.keys(L.supplies)){
   if(k==='stable'&&!hallStableLevel())continue;
   const before=(L.supplies[k]||0)+(L.reserve[k]||0),workingNeed=Math.max(0,Math.min(100,p.target)-L.supplies[k]),toWorking=Math.min(amount,workingNeed);
   L.supplies[k]=Math.min(100,L.supplies[k]+toWorking);
   let extra=Math.max(0,amount-toWorking);
   if(rt>0&&extra>0){const add=Math.min(extra,Math.max(0,rt-L.reserve[k]));L.reserve[k]+=add;if(add)L.reserveAddedDay[k]=state.world.day}
   added[k]=(L.supplies[k]||0)+(L.reserve[k]||0)-before
 }
 state.world.homeBase.hospitality.refreshments=Math.min(18,(state.world.homeBase.hospitality.refreshments||0)+Math.max(3,Math.round(amount/5)));
 L.lastSupplyDay=state.world.day;L.nextOrderDay=state.world.day+p.interval;L.status=source==='physical_caravan'?'Supply caravan unloaded into working stores and protected reserves.':'Routine and reserve stores replenished.';
 if(source==='physical_caravan'&&hallStableLevel()&&!added.stable)homeLogisticsReport('The supply caravan carried no usable stable stores because both working and protected stable storage were already at policy capacity.','info');
 return {added,stableAdded:added.stable||0,source}
}
function homeStableSupplyDailyUse(){
 if(!hallStableLevel())return 0;const animals=hallStableMounts().length,preg=(typeof ensureMountBreeding==='function'?ensureMountBreeding().pregnancies.length:0);
 return animals?Math.max(1,Math.ceil(animals/8)+preg):0
}
function homeStableSupplyStatus(){const L=ensureHomeSupplyReserves(),v=L.supplies.stable||0;return v>=60?'Adequate':v>=35?'Tight':v>=20?'Low':'Emergency'}
function homeStableEmergency(){return hallStableLevel()&&(ensureHomeSupplyReserves().supplies.stable||0)<20}
function homeStableSupplyDailyTick(){
 if(!hallStableLevel())return;const L=ensureHomeSupplyReserves(),use=homeStableSupplyDailyUse();
 L.supplies.stable=Math.max(0,(L.supplies.stable||0)-use);homeReserveDraw('stable',L.policy==='strategic'?55:L.policy==='abundant'?40:20);
 if(homeStableEmergency())L.status=`${L.master?.name||'Hall logistics staff'} is prioritizing emergency stable feed and bedding.`;
}
function homePredictiveLogisticsDailyTick(){
 if(!isOpenWorld())return;const L=ensureHomeSupplyReserves(),p=homeLogisticsPolicy();homeReserveProtectDaily();
 const shipment=L.shipmentId?state.world.parties.find(x=>x.id===L.shipmentId):null,lead=Math.max(1,shipment?.travelLeft||Number(p.forecastDays)||2);
 const danger=Object.keys(L.supplies).filter(k=>k!=='stable'||hallStableLevel()).some(k=>homeSupplyProjected(k,lead)<15);
 if(danger&&L.master&&L.autoProcure&&L.budget>=45&&L.lastEmergencyForecastDay!==state.world.day){
   const weak=Object.keys(L.supplies).filter(k=>k!=='stable'||hallStableLevel()).sort((a,b)=>homeSupplyProjected(a,lead)-homeSupplyProjected(b,lead))[0],q=homeEmergencyLocalQuote(weak);
   if(q.amount>0&&L.budget>=q.cost){homeFinanceDebit(q.cost,'Preventive procurement',`${L.master.name} secures ${q.label.toLowerCase()} before inbound supplies arrive.`);L.supplies[weak]=Math.min(100,L.supplies[weak]+q.amount);L.lastEmergencyForecastDay=state.world.day;homeLogisticsReport(`${L.master.name} made a preventive local purchase after forecasting that ${q.label.toLowerCase()} could run short before the next caravan arrived.`,'good')}
 }
 homeMaybeCreateSurplusOpportunity()
}
function homeMaybeCreateSurplusOpportunity(){
 const h=state.world.homeBase,L=ensureHomeSupplyReserves(),B=h.business;if(!B?.adviser||L.surplusOpportunity||state.world.day%7!==0)return;
 const p=homeLogisticsPolicy(),target=homeReserveTargetPerKind(),eligible=Object.keys(L.reserve).filter(k=>(L.reserve[k]||0)>=target+18&&state.world.day-(L.reserveAddedDay[k]||state.world.day)>=24);
 if(!eligible.length)return;const kind=eligible.sort((a,b)=>L.reserve[b]-L.reserve[a])[0],qty=Math.min(20,Math.floor(L.reserve[kind]-target)),pros=settlementState('shantium')?.prosperity||50,price=Math.max(35,Math.round(qty*(2.5+pros/35)));
 L.surplusOpportunity={kind,qty,price,day:state.world.day,expiresDay:state.world.day+5};homeBusinessReport(`${B.adviser.name} identified a favorable buyer for ${qty} units of aged ${HOME_LOCAL_SUPPLY_LABELS[kind]||kind} reserve. The sale would leave the Hall above its required reserve.`,'good')
}
function homeSellReserveSurplus(){
 const L=ensureHomeSupplyReserves(),o=L.surplusOpportunity;if(!o||o.expiresDay<state.world.day)return showHomeLogistics();const p=homeLogisticsPolicy(),target=homeReserveTargetPerKind();
 if((L.reserve[o.kind]||0)-o.qty<target)return actionResult('Reserve Protected','The Logistics Master no longer certifies this stock as surplus.','info',showHomeLogistics);
 L.reserve[o.kind]-=o.qty;homeFinanceCredit(o.price,'Reserve surplus sale',`${state.world.homeBase.business.adviser?.name||'The Economic Adviser'} sells aged surplus ${HOME_LOCAL_SUPPLY_LABELS[o.kind]||o.kind} stock.`);homeLogisticsReport(`Certified surplus sold for ${o.price}g without reducing the required emergency reserve.`,'good');L.surplusOpportunity=null;save();showHomeLogistics()
}
function homeReserveSummaryHTML(){
 const L=ensureHomeSupplyReserves(),cap=homeReserveCapacity(),p=homeLogisticsPolicy(),o=L.surplusOpportunity;
 if(!cap)return `<div class="notice compact"><b>Emergency reserve storage:</b> none. Build Reserve Stores under Improvements & Facilities to hold protected backup stock.</div>`;
 return `<div class="card"><h3>Emergency Reserve Stores</h3><p>Protected stock is rotated into working stores before shortages occur. Capacity: ${cap} per category • policy target: ${homeReserveTargetPerKind()}.</p>${Object.entries(L.reserve).filter(([k])=>k!=='stable'||hallStableLevel()).map(([k,v])=>`<div class="stat-row"><span>${esc(HOME_LOCAL_SUPPLY_LABELS[k]||k)}</span><b>${Math.round(v)}/${cap}</b></div>`).join('')}${o&&o.expiresDay>=state.world.day?`<div class="success notice compact"><b>Surplus sale opportunity:</b> ${o.qty} ${esc(HOME_LOCAL_SUPPLY_LABELS[o.kind]||o.kind)} for ${o.price}g.<br><button id="sellReserveSurplus">Authorize Sale</button></div>`:''}</div>`
}
