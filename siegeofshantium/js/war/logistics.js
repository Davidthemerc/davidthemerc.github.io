/* v1.6.66.5 — Military Logistics & Wartime Economy */
const WAR_LOGISTICS_VERSION=1;
function warLogisticsState(){
 const W=ensureWarFoundation();
 if(!W.logistics||typeof W.logistics!=='object')W.logistics={version:WAR_LOGISTICS_VERSION,lastTickDay:0,factions:{},depots:{},history:[]};
 const L=W.logistics;L.version=WAR_LOGISTICS_VERSION;if(!L.factions||typeof L.factions!=='object')L.factions={};if(!L.depots||typeof L.depots!=='object')L.depots={};if(!Array.isArray(L.history))L.history=[];return L
}
function warLogisticsFactionAccount(f){
 const L=warLogisticsState();if(L.factions[f])return L.factions[f];
 const held=warFactionSettlements(f),seed=held.reduce((n,x)=>{const s=settlementState(x.id);return n+(s?.population||100)*4+(s?.prosperity||50)*55},0);
 return L.factions[f]={faction:f,treasury:Math.max(3500,Math.round(seed)),incomeToday:0,expenseToday:0,procurementToday:0,operatingToday:0,lifetimeExpense:0,lastBalanceDay:state.world.day}
}
function warLogisticsDepot(locId){
 const L=warLogisticsState(),control=settlementControl(locId);let D=L.depots[locId];
 if(!D||typeof D!=='object')D=L.depots[locId]={location:locId,faction:control,food:24,equipment:12,medical:8,capacity:{food:90,equipment:60,medical:45},lastProcureDay:0,lastControlDay:state.world.day};
 if(D.faction!==control){D.faction=control;D.food=Math.min(D.food||0,18);D.equipment=Math.min(D.equipment||0,8);D.medical=Math.min(D.medical||0,5);D.lastControlDay=state.world.day}
 D.capacity=D.capacity||{food:90,equipment:60,medical:45};return D
}
function warEnsureLogisticsFormation(F){
 if(!F.logistics||typeof F.logistics!=='object')F.logistics={foodDays:clamp(Number(F.supplyDays)||8,0,16),equipmentReserve:8,medicalReserve:6,woundedPool:0,shortageDays:0,routeIntegrity:100,routeStatus:'local',source:null,lastResupplyDay:0,lastSupplyDay:state.world.day,lastAttritionDay:0};
 const L=F.logistics;L.foodDays=clamp(Number.isFinite(L.foodDays)?L.foodDays:(Number(F.supplyDays)||8),0,16);if(Number.isFinite(F.supplyDays))L.foodDays=Math.min(L.foodDays,F.supplyDays);L.equipmentReserve=clamp(Number(L.equipmentReserve)||0,0,30);L.medicalReserve=clamp(Number(L.medicalReserve)||0,0,24);L.woundedPool=Math.max(0,Math.round(Number(L.woundedPool)||0));L.shortageDays=Math.max(0,Math.round(Number(L.shortageDays)||0));F.supplyDays=L.foodDays;return L
}
function warLogisticsAtWar(f){return activeWars().some(w=>w.sides?.flat().includes(f))}
function warLogisticsDailyRevenue(f){
 return warFactionSettlements(f).reduce((n,x)=>{const s=settlementState(x.id);return n+Math.max(4,Math.round((s?.population||100)*.018+(s?.prosperity||50)*.75))},0)
}
function warLogisticsProcureDepot(f,D,A){
 if(D.faction!==f)return;const s=settlementState(D.location),pros=clamp(s?.prosperity||50,0,100),security=clamp(s?.security||50,0,100),funding=A.treasury>800?1:A.treasury>200?.65:.25;
 const food=Math.min(D.capacity.food-D.food,Math.max(0,Math.round((5+pros/12+security/35)*funding)));
 const equipment=Math.min(D.capacity.equipment-D.equipment,Math.max(0,Math.round((1.5+pros/38)*funding)));
 const medical=Math.min(D.capacity.medical-D.medical,Math.max(0,Math.round((1+pros/55)*funding)));
 let cost=Math.round(food*1.25+equipment*3.2+medical*2.8);if(cost>A.treasury&&cost>0){const scale=clamp(A.treasury/cost,0,1);cost=Math.round(cost*scale);D.food+=food*scale;D.equipment+=equipment*scale;D.medical+=medical*scale}else{D.food+=food;D.equipment+=equipment;D.medical+=medical}
 A.treasury=Math.max(0,A.treasury-cost);A.expenseToday+=cost;A.procurementToday+=cost;A.lifetimeExpense+=cost;D.lastProcureDay=state.world.day;
 if(typeof tradeStock==='function'&&typeof changeTradeStock==='function'&&warLogisticsAtWar(f)&&state.world.day%2===0){if(food>=4&&tradeStock(D.location,'food')>1)changeTradeStock(D.location,'food',-1);if(medical>=1&&tradeStock(D.location,'medicine')>1)changeTradeStock(D.location,'medicine',-1);if(equipment>=2){if(tradeStock(D.location,'tools')>1)changeTradeStock(D.location,'tools',-1);else if(tradeStock(D.location,'iron')>1)changeTradeStock(D.location,'iron',-1)}}
 D.food=clamp(D.food,0,D.capacity.food);D.equipment=clamp(D.equipment,0,D.capacity.equipment);D.medical=clamp(D.medical,0,D.capacity.medical)
}
function warLogisticsMilitaryFinance(){
 for(const f of WAR_MAJOR_FACTIONS.filter(warFactionEligible)){
  const A=warLogisticsFactionAccount(f),M=warMilitaryState(f);A.incomeToday=0;A.expenseToday=0;A.procurementToday=0;A.operatingToday=0;
  const income=warLogisticsDailyRevenue(f);A.treasury+=income;A.incomeToday=income;
  const field=warActiveFormations(f).reduce((n,F)=>n+(F.strength||0),0),operating=Math.round(field*(warLogisticsAtWar(f)?.12:.055)+warActiveFormations(f).length*2);
  const paid=Math.min(A.treasury,operating);A.treasury-=paid;A.expenseToday+=paid;A.operatingToday=paid;A.lifetimeExpense+=paid;
  const unpaid=Math.max(0,operating-paid),pressure=operating?unpaid/operating:0;M.treasuryPressure=clamp((M.treasuryPressure||0)*.82+pressure*28+(A.treasury<250?3:0),0,100);
  if(unpaid>0){M.readiness=clamp((M.readiness||50)-pressure*1.4,20,100);M.warSupport=clamp((M.warSupport||50)-pressure*.4,5,100)}
  A.lastBalanceDay=state.world.day
 }
}
function warLogisticsProcurementTick(){
 for(const f of WAR_MAJOR_FACTIONS.filter(warFactionEligible)){const A=warLogisticsFactionAccount(f);for(const loc of warFactionSettlements(f))warLogisticsProcureDepot(f,warLogisticsDepot(loc.id),A)}
}
function warLogisticsPath(from,to){
 if(!from||!to)return[];if(from===to)return[from];const out=[from];let cur=from;for(let i=0;i<14&&cur!==to;i++){const step=warRegionRouteStep(cur,to);if(!step?.next||out.includes(step.next)&&step.next!==to)break;out.push(step.next);cur=step.next}return out[out.length-1]===to?out:[]
}
function warLogisticsEnemyFactions(F){const w=ensureWarFoundation().wars.find(x=>x.id===F.warId);return w?warEnemiesForFaction(w,F.faction):[]}
function warLogisticsPathIntegrity(F,path){
 if(!path?.length)return 0;const enemies=warLogisticsEnemyFactions(F);let integrity=100;
 for(let i=0;i<path.length;i++){const id=path[i],ctrl=settlementControl(id);if(ctrl&&ctrl!==F.faction){if(enemies.includes(ctrl))integrity-=32;else integrity-=8}if(typeof roadRights==='function'){const rr=roadRights(id);if(rr&&Number.isFinite(rr.openness))integrity-=Math.max(0,4-rr.openness)*4}if(i>0&&typeof routePressure==='function')integrity-=Math.min(20,routePressure(path[i-1],id)*2.2);if(warActiveFormations().some(E=>E.location===id&&enemies.includes(E.faction)&&E.strength>15))integrity-=28;if(typeof warOccupationAt==='function'){const O=warOccupationAt(id);if(O&&O.attackerFaction!==F.faction)integrity-=18}}
 return clamp(Math.round(integrity),0,100)
}
function warLogisticsSupplySource(F){
 const L=warLogisticsState(),candidates=warFactionSettlements(F.faction).map(x=>{const D=warLogisticsDepot(x.id),path=warLogisticsPath(F.location,x.id),integrity=warLogisticsPathIntegrity(F,path),stock=(D.food||0)+(D.equipment||0)*.8+(D.medical||0)*.7,dist=warLocationDistance(F.location,x.id);return {loc:x.id,depot:D,path,integrity,score:integrity+stock*.42-dist*.12}}).filter(x=>x.path.length&&x.integrity>=18&&x.depot.faction===F.faction).sort((a,b)=>b.score-a.score);return candidates[0]||null
}
function warLogisticsDeliver(F,source){
 const L=warEnsureLogisticsFormation(F),D=source.depot,integrity=source.integrity,local=F.location===source.loc,throughput=clamp((local?5:1)+integrity/24,1,8);
 const foodNeed=Math.max(0,14-L.foodDays),food=Math.min(foodNeed,D.food,throughput);D.food-=food;L.foodDays+=food;
 const equipNeed=Math.max(0,20-L.equipmentReserve),equip=Math.min(equipNeed,D.equipment,Math.max(.5,throughput*.65));D.equipment-=equip;L.equipmentReserve+=equip;
 const medNeed=Math.max(0,16-L.medicalReserve),med=Math.min(medNeed,D.medical,Math.max(.4,throughput*.5));D.medical-=med;L.medicalReserve+=med;
 L.source=source.loc;L.routeIntegrity=integrity;L.routeStatus=local?'local':integrity>=75?'open':integrity>=48?'strained':integrity>=25?'contested':'cut';if(food+equip+med>.25)L.lastResupplyDay=state.world.day
}
function warLogisticsFormationConsumption(F){
 const L=warEnsureLogisticsFormation(F);const status=F.status||'ready';let food=0.55;if(status==='garrison')food=.35;else if(status==='marching')food=.28;else if(status==='engaged')food=.55;else if(status==='recovering')food=.4;else if(status==='occupying')food=.65;
 L.foodDays=clamp(L.foodDays-food,0,16);const wear=status==='engaged'?1.25:status==='marching'?.32:status==='occupying'?.18:.08;F.equipment=clamp((F.equipment||60)-wear,20,100);
 if(L.equipmentReserve>0&&F.equipment<88){const use=Math.min(L.equipmentReserve,status==='engaged'?1.5:.8,(88-F.equipment)/2);L.equipmentReserve-=use;F.equipment=clamp(F.equipment+use*1.8,20,100)}
 if(L.woundedPool>0){const medical=L.medicalReserve>0?clamp(1+Math.floor(L.medicalReserve/6),1,4):0;if(medical){const recover=Math.min(L.woundedPool,medical,Math.max(0,(F.maxStrength||F.strength)-F.strength));if(recover>0){L.woundedPool-=recover;L.medicalReserve=Math.max(0,L.medicalReserve-recover*.55);F.strength+=recover;F.composition=F.composition||{};F.composition.infantry=(F.composition.infantry||0)+recover;F.morale=clamp((F.morale||50)+.25*recover,0,100)}}else if(state.world.day-(L.lastAttritionDay||0)>=3){L.lastAttritionDay=state.world.day;if(L.woundedPool>=4){L.woundedPool--;warMilitaryState(F.faction).casualties=(warMilitaryState(F.faction).casualties||0)+1}}}
 if(L.foodDays<.75){L.shortageDays++;F.morale=clamp((F.morale||50)-3.2,0,100);F.readiness=clamp((F.readiness||50)-2.2,20,100);F.fatigue=clamp((F.fatigue||0)+3,0,100);if(F.status==='marching'&&L.shortageDays%2===0)F.travelRemaining=(F.travelRemaining||0)+1}else if(L.foodDays<2.5){L.shortageDays=Math.max(0,L.shortageDays-1);F.morale=clamp((F.morale||50)-.8,0,100)}else L.shortageDays=0;
 F.supplyDays=L.foodDays;L.lastSupplyDay=state.world.day
}
function warLogisticsForceWithdrawal(F){
 const L=warEnsureLogisticsFormation(F);if(L.shortageDays<3||F.retreating||['engaged','recovering','destroyed','disbanded','mobilizing'].includes(F.status))return false;const source=warLogisticsSupplySource(F);if(!source)return false;const target=source.loc;if(target===F.location)return false;
 const oldCampaignId=F.campaignId;F.campaignId=null;F.destination=target;const step=warRegionRouteStep(F.location,target);if(!step){F.campaignId=oldCampaignId;return false;}F.routeStep=step.next;F.travelRemaining=Math.max(1,step.days);F.routeKind=step.kind;F.status='marching';F.retreating=true;F.retreatDestination=target;F.logisticsWithdrawal=true;const W=ensureWarFoundation(),w=W.wars.find(x=>x.id===F.warId),C=w?.campaigns?.find(x=>x.id===oldCampaignId);if(C){C.status='stalled';C.phase='supply_withdrawal'}warLogisticsState().history.push({day:state.world.day,type:'supply_withdrawal',formationId:F.id,text:`${F.name} withdraws toward ${worldLocation(target)?.name||target} after its supply line fails.`});W.history.push({day:state.world.day,type:'supply_withdrawal',warId:F.warId,formationId:F.id,text:`${F.name} abandons field operations because its supply situation is untenable.`});return true
}
function warLogisticsPeacetimeDestination(F){
 const held=warFactionSettlements(F.faction);if(!held.length)return null;if(held.some(x=>x.id===F.location))return F.location;
 return held.map(x=>({id:x.id,d:warLocationDistance(F.location,x.id),path:warLogisticsPath(F.location,x.id)})).filter(x=>x.path.length).sort((a,b)=>a.d-b.d)[0]?.id||warFactionBase(F.faction)
}
function warLogisticsPeacetimeDisposition(F){
 if(warLogisticsAtWar(F.faction))return false;const target=warLogisticsPeacetimeDestination(F);if(!target)return false;
 const W=ensureWarFoundation(),oldWar=F.warId&&W.wars.find(w=>w.id===F.warId);if(!oldWar||oldWar.status!=='active'){F.warId=null;F.campaignId=null;F.battleId=null;F.contactId=null}
 if(F.location===target){const changed=F.status!=='garrison'||F.destination||F.routeStep||F.retreating;F.status='garrison';F.destination=null;F.routeStep=null;F.travelRemaining=0;F.retreating=false;F.retreatDestination=null;F.logisticsWithdrawal=false;F.peacetimeReturn=false;if(changed)F.lastActionDay=state.world.day;return changed}
 if(F.status==='marching'&&F.peacetimeReturn&&F.destination===target&&F.routeStep)return false;
 const step=warRegionRouteStep(F.location,target);if(!step)return false;F.campaignId=null;F.battleId=null;F.contactId=null;F.destination=target;F.routeStep=step.next;F.travelRemaining=Math.max(1,step.days);F.routeKind=step.kind;F.status='marching';F.retreating=true;F.retreatDestination=target;F.logisticsWithdrawal=false;F.peacetimeReturn=true;F.lastActionDay=state.world.day;warLogisticsState().history.push({day:state.world.day,type:'peacetime_return',formationId:F.id,text:`${F.name} returns toward ${worldLocation(target)?.name||target} for peacetime garrison duty.`});return true
}
function warLogisticsCivilProvision(F,L){
 if(warLogisticsAtWar(F.faction))return false;const held=warFactionSettlements(F.faction),friendly=held.some(x=>x.id===F.location);L.source=friendly?F.location:(warLogisticsPeacetimeDestination(F)||F.location);L.routeIntegrity=friendly?100:85;L.routeStatus='civil provisioning';L.foodDays=Math.max(L.foodDays,6);L.equipmentReserve=Math.max(L.equipmentReserve,20);L.medicalReserve=Math.max(L.medicalReserve,16);L.shortageDays=0;F.supplyDays=L.foodDays;return true
}
function warLogisticsFormationTick(){
 for(const F of warActiveFormations()){
  const L=warEnsureLogisticsFormation(F);warLogisticsPeacetimeDisposition(F);const source=warLogisticsSupplySource(F);if(source)warLogisticsDeliver(F,source);else if(warLogisticsAtWar(F.faction)){L.source=null;L.routeIntegrity=0;L.routeStatus='cut'}
  if(!warLogisticsAtWar(F.faction))warLogisticsCivilProvision(F,L);warLogisticsFormationConsumption(F);if(!warLogisticsAtWar(F.faction)){L.shortageDays=0;F.supplyDays=L.foodDays}else warLogisticsForceWithdrawal(F)
 }
}
function warLogisticsDailyTick(){
 const L=warLogisticsState();if(L.lastTickDay===state.world.day)return;L.lastTickDay=state.world.day;const perf=(n,fn)=>typeof sosPerfRun==='function'?sosPerfRun(n,fn):fn();perf('War — Military Finance',()=>warLogisticsMilitaryFinance());perf('War — Supply Depots',()=>warLogisticsProcurementTick());perf('War — Supply Lines',()=>{for(const F of warActiveFormations()){warEnsureLogisticsFormation(F);const s=warLogisticsSupplySource(F);if(s){F.logistics.routeIntegrity=s.integrity;F.logistics.source=s.loc;F.logistics.routeStatus=F.location===s.loc?'local':s.integrity>=75?'open':s.integrity>=48?'strained':s.integrity>=25?'contested':'cut'}else{F.logistics.routeIntegrity=0;F.logistics.source=null;F.logistics.routeStatus='cut'}}});perf('War — Formation Sustainment',()=>warLogisticsFormationTick());L.history=L.history.slice(-120)
}
const __warBattleApplyLossesLogistics=warBattleApplyLosses;warBattleApplyLosses=function(B,side,count){const before=warBattleSideFormations(B,side).map(F=>({F,strength:F.strength||0})),out=__warBattleApplyLossesLogistics.apply(this,arguments);let wounded=out?.wounded||0,total=before.reduce((n,x)=>n+x.strength,0);for(let i=0;i<before.length&&wounded>0;i++){const x=before[i],share=i===before.length-1?wounded:Math.min(wounded,Math.round((out.wounded||0)*x.strength/Math.max(1,total)));wounded-=share;if(share>0)warEnsureLogisticsFormation(x.F).woundedPool+=share}return out};
const __warBattleFormationPowerLogistics=warBattleFormationPower;warBattleFormationPower=function(F){const base=__warBattleFormationPowerLogistics.apply(this,arguments),L=warEnsureLogisticsFormation(F),supply=L.foodDays<=0?.68:L.foodDays<2?.84:L.foodDays<4?.94:1,stores=L.equipmentReserve<=0?.94:1,medical=L.medicalReserve<=0&&L.woundedPool>0?.97:1;return base*supply*stores*medical};
const __warTerritorialAttackPowerLogistics=warTerritorialAttackPower;warTerritorialAttackPower=function(forces){const base=__warTerritorialAttackPowerLogistics.apply(this,arguments);if(!forces?.length)return base;const avg=forces.reduce((n,F)=>n+(warEnsureLogisticsFormation(F).foodDays||0),0)/forces.length,mod=avg<=0?.62:avg<2?.78:avg<4?.9:1;return base*mod};
const __warStrategicDailyTickLogistics=warStrategicDailyTick;warStrategicDailyTick=function(){const out=__warStrategicDailyTickLogistics.apply(this,arguments);warLogisticsDailyTick();return out};
function warLogisticsFactionCard(f){const A=warLogisticsFactionAccount(f),M=warMilitaryState(f),depots=warFactionSettlements(f).map(x=>warLogisticsDepot(x.id)),food=Math.round(depots.reduce((n,d)=>n+(d.food||0),0)),eq=Math.round(depots.reduce((n,d)=>n+(d.equipment||0),0)),med=Math.round(depots.reduce((n,d)=>n+(d.medical||0),0));return `<div class="card compact"><div class="stat-row"><span><b>${esc(majorFaction(f).short)}</b></span><b>${fmt(Math.round(A.treasury))} military treasury</b></div>Daily military revenue ${fmt(A.incomeToday||0)} • expense ${fmt(A.expenseToday||0)} • treasury pressure ${Math.round(M.treasuryPressure||0)}%<br><small>${depots.length} supply base${depots.length===1?'':'s'} • food ${food} • equipment ${eq} • medical ${med}</small></div>`}
function warLogisticsFormationCard(F){const L=warEnsureLogisticsFormation(F),src=L.source?(worldLocation(L.source)?.name||L.source):'No viable source';return `<div class="card compact"><div class="stat-row"><span><b>${esc(F.name)}</b></span><b>${Math.round(L.foodDays*10)/10} days food</b></div>${esc(L.routeStatus.replaceAll('_',' '))} supply line • integrity ${Math.round(L.routeIntegrity||0)}% • source ${esc(src)}<br><small>Equipment stores ${Math.round(L.equipmentReserve)} • medical stores ${Math.round(L.medicalReserve)}${L.woundedPool?` • ${fmt(L.woundedPool)} wounded awaiting return`:''}${L.shortageDays?` • shortage ${L.shortageDays}d`:''}</small></div>`}
const __showWarOverviewLogistics=showWarOverview;showWarOverview=function(){const r=__showWarOverviewLogistics.apply(this,arguments),dlg=document.querySelector('.dialog');if(!dlg)return r;const before=[...dlg.querySelectorAll('h3')].find(h=>h.textContent==='Military Balance');if(before){const wrap=document.createElement('div'),known=warActiveFormations().filter(F=>typeof warIntelLatestForFormation==='function'?warIntelLatestForFormation(F.id):true);wrap.innerHTML=`<h3>Wartime Economy & Supply</h3>${WAR_MAJOR_FACTIONS.filter(warFactionEligible).map(warLogisticsFactionCard).join('')}<h3>Known Field Supply</h3>${known.map(warLogisticsFormationCard).join('')||'<p class="muted">No field supply information is currently available.</p>'}`;while(wrap.firstChild)dlg.insertBefore(wrap.firstChild,before)}return r};
