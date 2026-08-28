function sengiaEconomyState(){ensureWorldState();let E=state.world.sengiaEconomy;if(!E||typeof E!=='object')E=state.world.sengiaEconomy={season:1,seasonDay:1,lastTickDay:state.world.day,settlements:{},shipments:[],history:[],harvests:0};if(!E.settlements)E.settlements={};if(!Array.isArray(E.shipments))E.shipments=[];if(!Array.isArray(E.history))E.history=[];for(const [id,d] of Object.entries(SENGIA_ECONOMY_DEFAULTS.settlements))if(!E.settlements[id])E.settlements[id]={...d,shortage:false,lastHarvest:0,compensation:0};return E}
function sengiaFoodPolicy(){const p=redstoneCompanionPolicy('red_grainwarden'),r=redstoneRegionalOutcome('sengia_hunger');if(r==='capital')return'capital';if(r==='market')return'market';if(r==='compact'||p==='compact')return'compact';if(p==='reserve')return'reserve';return'custom'}
function sengiaFoodPolicyLabel(){const p=sengiaFoodPolicy();return p==='capital'?'Capital Emergency Priority':p==='market'?'Market-Negotiated Grain':p==='compact'?'Regional Grain Compact':p==='reserve'?'Protected Seed & Household Floors':SOSText("regions_sengia_redstone.sengiaFoodPolicyLabel.001")}
function sengiaSeedFloor(id){const e=sengiaEconomyState().settlements[id];if(!e)return 0;if(!['briarlake','glenbrook','tyrdon'].includes(id))return Math.max(6,Math.round(e.seed*.45));const p=sengiaFoodPolicy();return Math.max(8,Math.round(e.seed*((p==='reserve'||p==='compact')?.72:.55)))}
function sengiaEconomicCondition(id){const e=sengiaEconomyState().settlements[id];if(!e)return SOSText("regions_sengia_redstone.sengiaEconomicCondition.001");if(e.food<22)return SOSText("regions_sengia_redstone.sengiaEconomicCondition.002");if(e.food<38)return SOSText("regions_sengia_redstone.sengiaEconomicCondition.003");if(e.recovery<35)return SOSText("regions_sengia_redstone.sengiaEconomicCondition.004");if(e.recovery>70&&e.food>55)return SOSText("regions_sengia_redstone.sengiaEconomicCondition.005");return SOSText("regions_sengia_redstone.sengiaEconomicCondition.006")}
function sengiaTradeSignal(id){const e=sengiaEconomyState().settlements[id];if(!e)return SOSText("regions_sengia_redstone.sengiaTradeSignal.001");if(id==='sengia'&&e.food<55)return SOSText("regions_sengia_redstone.sengiaTradeSignal.002");if(id==='lockwood'&&e.materials>55)return SOSText("regions_sengia_redstone.sengiaTradeSignal.003");if(id==='briarlake'&&e.food>60&&e.seed>sengiaSeedFloor(id)+8)return SOSText("regions_sengia_redstone.sengiaTradeSignal.004");if(id==='pyreglade'&&e.materials>55)return SOSText("regions_sengia_redstone.sengiaTradeSignal.005");if(e.food<38)return SOSText("regions_sengia_redstone.sengiaTradeSignal.006");if(e.materials<35)return SOSText("regions_sengia_redstone.sengiaTradeSignal.007");return SOSText("regions_sengia_redstone.sengiaTradeSignal.008")}
function sengiaEconomyHTML(id){const e=sengiaEconomyState().settlements[id],floor=sengiaSeedFloor(id);if(!e)return'';return SOSText("regions_sengia_redstone.sengiaEconomyHTML.001",esc(e.label),esc(sengiaEconomicCondition(id)),Math.round(e.food),Math.round(e.seed),['briarlake','glenbrook','tyrdon'].includes(id)?` (protected floor ${floor})`:'',Math.round(e.materials),Math.round(e.recovery),esc(sengiaTradeSignal(id)))}
function recordSengiaEconomy(text,type='info'){const E=sengiaEconomyState();E.history.push({day:state.world.day,text,type});E.history=E.history.slice(-80);recordWorldHistory(text,type,SOSText("regions_sengia_redstone.recordSengiaEconomy.001"))}
function sengiaHarvest(){const E=sengiaEconomyState();E.season++;E.seasonDay=1;E.harvests++;for(const id of ['briarlake','glenbrook','tyrdon']){const e=E.settlements[id],security=settlementState(id).security||50,pressure=settlementProblem(id)?6:0;let y=Math.max(8,Math.round(e.production*(.75+security/200)-pressure+rnd(-3,5)));const floor=sengiaSeedFloor(id);e.seed=Math.max(floor,e.seed);e.food=Math.min(100,e.food+y);e.seed=Math.min(60,e.seed+Math.round(y*.22));e.lastHarvest=state.world.day}recordSengiaEconomy(SOSText("regions_sengia_redstone.sengiaHarvest.001",E.season-1),'good');sengiaPlanShipments(true)}
function sengiaPlanShipments(force=false){const E=sengiaEconomyState(),s=E.settlements.sengia,b=E.settlements.briarlake,p=sengiaFoodPolicy(),floor=sengiaSeedFloor('briarlake');if(!force&&E.shipments.some(x=>x.status==='planned'||x.status==='moving'))return;let available=Math.max(0,Math.floor(Math.min(b.food-48,b.seed-floor)));if(p==='capital')available=Math.max(available,Math.floor(Math.max(0,b.food-38)));if(p==='reserve')available=Math.min(available,Math.max(0,Math.floor(b.seed-floor)));if(s.food<58&&available>0){const qty=Math.max(4,Math.min(18,available));E.shipments.push({id:'grain_'+state.world.day+'_'+rnd(100,999),from:'briarlake',to:'sengia',good:'grain',qty,status:'planned',createdDay:state.world.day,eta:2});b.food=Math.max(0,b.food-qty);if(p==='capital'&&b.seed<floor){b.recovery=Math.max(0,b.recovery-3);recordSengiaEconomy(SOSText("regions_sengia_redstone.sengiaPlanShipments.001"),'bad')}recordSengiaEconomy(SOSText("regions_sengia_redstone.sengiaPlanShipments.002",qty,sengiaFoodPolicyLabel()))}}
function sengiaProcessShipments(){const E=sengiaEconomyState();for(const sh of E.shipments.filter(x=>x.status==='planned'||x.status==='moving')){sh.status='moving';sh.eta--;if(sh.eta<=0){const dest=E.settlements[sh.to];let lost=0;if(settlementProblem('briarlake')&&chance(.25))lost=Math.ceil(sh.qty*.35);const delivered=sh.qty-lost;dest.food=Math.min(100,dest.food+delivered);sh.status=lost?'partial':'delivered';sh.delivered=delivered;sh.arrivedDay=state.world.day;recordSengiaEconomy(SOSText("regions_sengia_redstone.sengiaProcessShipments.001",delivered,sh.good,worldLocation(sh.to).name,lost?`; ${lost} were lost to road disruption`:''),lost?'bad':'good')}}E.shipments=E.shipments.slice(-30)}
function sengiaEconomyDailyTick(){if(!isOpenWorld()||!(state.world.unlockedRegions||[]).includes('redstone'))return;const E=sengiaEconomyState();if(E.lastTickDay>=state.world.day)return;while(E.lastTickDay<state.world.day){E.lastTickDay++;E.seasonDay++;for(const [id,e] of Object.entries(E.settlements)){e.food=Math.max(0,e.food-(id==='sengia'?2.1:.65));e.materials=Math.max(0,e.materials-.18);const ss=settlementState(id);if(e.food<30)e.recovery=Math.max(0,e.recovery-.8);else if(e.materials>30&&ss.security>45)e.recovery=Math.min(100,e.recovery+.22);e.shortage=e.food<35}sengiaProcessShipments();if(E.seasonDay>SENGIA_ECONOMY_DEFAULTS.seasonLength)sengiaHarvest();else if(E.seasonDay%3===0)sengiaPlanShipments()}}
function sengiaEconomyAction(id,act){const E=sengiaEconomyState(),e=E.settlements[id];let text='',tone='good';if(act==='food'){if(state.gold<45)return actionResult(SOSText("regions_sengia_redstone.sengiaEconomyAction.001"),SOSText("regions_sengia_redstone.sengiaEconomyAction.002"),'bad',()=>showSengiaEconomy(id));state.gold-=45;e.food=Math.min(100,e.food+10);e.recovery=Math.min(100,e.recovery+2);changeLocalReputation(id,1,SOSText("regions_sengia_redstone.sengiaEconomyAction.003"));text=SOSText("regions_sengia_redstone.sengiaEconomyAction.004")}if(act==='materials'){if(state.gold<55)return actionResult(SOSText("regions_sengia_redstone.sengiaEconomyAction.005"),SOSText("regions_sengia_redstone.sengiaEconomyAction.006"),'bad',()=>showSengiaEconomy(id));state.gold-=55;e.materials=Math.min(100,e.materials+12);e.recovery=Math.min(100,e.recovery+3);changeLocalReputation(id,1,SOSText("regions_sengia_redstone.sengiaEconomyAction.007"));text=SOSText("regions_sengia_redstone.sengiaEconomyAction.008")}if(act==='compensate'){if(state.gold<35)return actionResult(SOSText("regions_sengia_redstone.sengiaEconomyAction.009"),SOSText("regions_sengia_redstone.sengiaEconomyAction.010"),'bad',()=>showSengiaEconomy(id));state.gold-=35;e.compensation+=35;e.recovery=Math.min(100,e.recovery+2);adjustJurisdictionRep(id,1,SOSText("regions_sengia_redstone.sengiaEconomyAction.011"));text=SOSText("regions_sengia_redstone.sengiaEconomyAction.012")}if(act==='protectseed'){if(!['briarlake','glenbrook','tyrdon'].includes(id))return showSengiaEconomy(id);e.seed=Math.max(e.seed,sengiaSeedFloor(id)+4);recordFactionPower(id,SOSText("regions_sengia_redstone.sengiaEconomyAction.013"),'trade',1,SOSText("regions_sengia_redstone.sengiaEconomyAction.014"),8);text=SOSText("regions_sengia_redstone.sengiaEconomyAction.015")}recordSengiaEconomy(`${worldLocation(id).name}: ${text}`,tone);advanceWorldDays(1,SOSText("regions_sengia_redstone.sengiaEconomyAction.016"));save();actionResult(SOSText("regions_sengia_redstone.sengiaEconomyAction.017"),text,tone,()=>showSengiaEconomy(id))}
function showSengiaEconomy(id=state.world.location){modalRouteEnter(SOSText("regions_sengia_redstone.showSengiaEconomy.001"),Array.from(arguments));if(locationRegion(id)!=='redstone')return renderOpenWorld();const E=sengiaEconomyState(),ship=E.shipments.filter(x=>x.from===id||x.to===id).slice(-5).reverse(),hist=E.history.filter(x=>x.text.includes(worldLocation(id).name)||x.text.includes(SOSText("regions_sengia_redstone.showSengiaEconomy.002"))).slice(-5).reverse();overlay(SOSText("regions_sengia_redstone.showSengiaEconomy.003",esc(worldLocation(id).name),redstonePolicyNoticeHTML(id),sengiaEconomyHTML(id),esc(sengiaFoodPolicyLabel()),E.season,E.seasonDay,SENGIA_ECONOMY_DEFAULTS.seasonLength,esc(sengiaTradeSignal(id)),['briarlake','glenbrook','tyrdon'].includes(id)?'<button data-econact="protectseed">Reinforce Planting Reserve</button>':'',ship.map(x=>`<div class="card compact"><b>${esc(x.good)}: ${esc(worldLocation(x.from).name)} → ${esc(worldLocation(x.to).name)}</b><br>${x.qty} committed • ${esc(x.status)}${x.delivered!=null?` • ${x.delivered} delivered`:''}</div>`).join('')||'<p class="muted">No recent tracked shipment involves this settlement.</p>',hist.map(x=>`<div class="card compact">Day ${x.day}: ${esc(x.text)}</div>`).join('')||'<p class="muted">No major economic event recorded here yet.</p>'),true);document.querySelectorAll('[data-econact]').forEach(b=>b.onclick=()=>sengiaEconomyAction(id,b.dataset.econact));wireClose()}

const SENGIA_SECURITY_DEFAULTS={
 sengia:{garrison:78,patrols:62,manpower:74,readiness:72,irregulars:18,priority:SOSText("regions_sengia_redstone.showSengiaEconomy.004")},
 lockwood:{garrison:58,patrols:56,manpower:60,readiness:61,irregulars:34,priority:SOSText("regions_sengia_redstone.showSengiaEconomy.005")},
 grayhaven:{garrison:46,patrols:61,manpower:52,readiness:55,irregulars:24,priority:SOSText("regions_sengia_redstone.showSengiaEconomy.006")},
 briarlake:{garrison:38,patrols:48,manpower:44,readiness:50,irregulars:22,priority:SOSText("regions_sengia_redstone.showSengiaEconomy.007")},
 glenbrook:{garrison:42,patrols:44,manpower:48,readiness:49,irregulars:29,priority:SOSText("regions_sengia_redstone.showSengiaEconomy.008")},
 tyrdon:{garrison:35,patrols:40,manpower:43,readiness:45,irregulars:31,priority:SOSText("regions_sengia_redstone.showSengiaEconomy.009")},
 pyreglade:{garrison:51,patrols:57,manpower:55,readiness:58,irregulars:20,priority:SOSText("regions_sengia_redstone.showSengiaEconomy.010")}
};
function sengiaSecurityState(){
 ensureWorldState();let M=state.world.sengiaSecurity;
 if(!M||typeof M!=='object')M=state.world.sengiaSecurity={settlements:{},deployments:[],history:[],lastTickDay:state.world.day};
 if(!M.settlements)M.settlements={};if(!Array.isArray(M.deployments))M.deployments=[];if(!Array.isArray(M.history))M.history=[];
 for(const [id,d] of Object.entries(SENGIA_SECURITY_DEFAULTS))if(!M.settlements[id])M.settlements[id]={...d,coverage:Math.round((d.garrison+d.patrols)/2),pressure:0,lastDeployDay:0};
 return M
}
function sengiaSecurityPressure(id){
 let p=0;const ss=settlementState(id),econ=sengiaEconomyState().settlements[id],problem=settlementProblem(id);
 if(ss.security<45)p+=4;else if(ss.security<60)p+=2;
 if(econ?.food<35)p+=2;if(econ?.materials<30)p+=1;
 if(problem?.type==='raider_pressure')p+=5;if(problem?.type==='watch_shortage')p+=3;
 const nearby=state.world.parties.filter(x=>worldPartyDisplayRegion(x)==='redstone'&&['bandits','raiders'].includes(x.kind)&&(x.location===id||x.destination===id)).length;p+=Math.min(5,nearby*2);
 return p
}
function sengiaAuthorityModifier(id){
 const p=sengiaAuthorityState().precedents[id];
 return p==='command'?2:p==='review'?1:p==='local'?-1:p==='refused'?-2:0
}
function sengiaReadiness(id){
 const M=sengiaSecurityState(),m=M.settlements[id],e=sengiaEconomyState().settlements[id],ss=settlementState(id);
 let r=(m.manpower*.35)+(m.garrison*.2)+(m.patrols*.15)+(ss.security*.15)+(Math.min(100,e.food)*.08)+(Math.min(100,e.materials)*.07);
 r+=sengiaAuthorityModifier(id)*2;
 if(e.food<25)r-=8;if(e.materials<25)r-=5;
 return clamp(Math.round(r),10,100)
}
function sengiaSecurityCondition(id){
 const r=sengiaReadiness(id),p=sengiaSecurityPressure(id);
 if(p>=8&&r<50)return SOSText("regions_sengia_redstone.sengiaSecurityCondition.001");
 if(p>=7)return SOSText("regions_sengia_redstone.sengiaSecurityCondition.002");
 if(r>=75)return SOSText("regions_sengia_redstone.sengiaSecurityCondition.003");
 if(r>=55)return SOSText("regions_sengia_redstone.sengiaSecurityCondition.004");
 return SOSText("regions_sengia_redstone.sengiaSecurityCondition.005")
}
function sengiaSecurityHTML(id){
 const m=sengiaSecurityState().settlements[id];if(!m)return'';
 m.pressure=sengiaSecurityPressure(id);m.readiness=sengiaReadiness(id);m.coverage=clamp(Math.round((m.garrison+m.patrols-m.pressure*2)/2),10,100);
 return SOSText("regions_sengia_redstone.sengiaSecurityHTML.001",esc(m.priority),esc(sengiaSecurityCondition(id)),Math.round(m.garrison),Math.round(m.patrols),Math.round(m.manpower),m.readiness,m.pressure,m.coverage,Math.round(m.irregulars),esc(sengiaSecurityAdvice(id)))
}
function sengiaSecurityAdvice(id){
 const m=sengiaSecurityState().settlements[id],e=sengiaEconomyState().settlements[id],p=sengiaSecurityPressure(id),a=sengiaPrecedentLabel(id);
 if(e.food<30)return SOSText("regions_sengia_redstone.sengiaSecurityAdvice.001");
 if(e.materials<28)return SOSText("regions_sengia_redstone.sengiaSecurityAdvice.002");
 if(p>=7)return SOSText("regions_sengia_redstone.sengiaSecurityAdvice.003");
 if(a.includes(SOSText("regions_sengia_redstone.sengiaSecurityAdvice.004")))return SOSText("regions_sengia_redstone.sengiaSecurityAdvice.005");
 if(a.includes('review'))return SOSText("regions_sengia_redstone.sengiaSecurityAdvice.006");
 return SOSText("regions_sengia_redstone.sengiaSecurityAdvice.007")
}
function recordSengiaSecurity(text,type='info'){const M=sengiaSecurityState();M.history.push({day:state.world.day,text,type});M.history=M.history.slice(-100);recordWorldHistory(text,type,SOSText("regions_sengia_redstone.recordSengiaSecurity.001"))}
function sengiaDeploymentNeed(){
 const M=sengiaSecurityState();return Object.keys(M.settlements).map(id=>({id,score:sengiaSecurityPressure(id)-sengiaReadiness(id)/25})).sort((a,b)=>b.score-a.score)
}
function createSengiaDeployment(from,to,kind='redstone',reason=SOSText("regions_sengia_redstone.createSengiaDeployment.001")){
 const M=sengiaSecurityState();if(from===to)return null;
 const existing=M.deployments.find(x=>['planned','moving'].includes(x.status)&&x.to===to&&x.kind===kind);if(existing)return existing;
 const p=spawnRegionalResponse(kind,from,to,SOSText("regions_sengia_redstone.createSengiaDeployment.002",worldLocation(to).name));if(p){p.securityDeployment=true;p.securityReason=reason}
 const d={id:'sec_'+uid(),from,to,kind,reason,status:'moving',createdDay:state.world.day,partyId:p?.id||null};M.deployments.push(d);M.deployments=M.deployments.slice(-40);recordSengiaSecurity(SOSText("regions_sengia_redstone.createSengiaDeployment.003",worldLocation(from).name,kind==='redstone'?'Redstone':'local',worldLocation(to).name,reason));return d
}
function sengiaPlanSecurityDeployments(){
 const M=sengiaSecurityState(),needs=sengiaDeploymentNeed();if(!needs.length)return;
 const target=needs[0];if(target.score<1.5)return;
 let source=Object.keys(M.settlements).filter(id=>id!==target.id&&sengiaReadiness(id)>=58&&M.settlements[id].manpower>=45).sort((a,b)=>sengiaReadiness(b)-sengiaReadiness(a))[0];
 if(!source&&target.id!=='sengia'&&M.settlements.sengia.manpower>=40)source='sengia';
 if(!source)return;
 const precedent=sengiaAuthorityState().precedents[target.id],reason=settlementProblem(target.id)?.type==='raider_pressure'?'raider pressure':settlementProblem(target.id)?.type==='watch_shortage'?'watch shortage':SOSText("regions_sengia_redstone.sengiaPlanSecurityDeployments.001");
 if(precedent==='refused'&&chance(.5)){recordSengiaSecurity(SOSText("regions_sengia_redstone.sengiaPlanSecurityDeployments.002",worldLocation(target.id).name),'info');M.settlements[target.id].irregulars=Math.min(70,M.settlements[target.id].irregulars+2);return}
 createSengiaDeployment(source,target.id,'redstone',reason);M.settlements[source].manpower=Math.max(20,M.settlements[source].manpower-3);M.settlements[target.id].patrols=Math.min(100,M.settlements[target.id].patrols+4)
}
function sengiaSecurityDailyTick(){
 if(!isOpenWorld()||!(state.world.unlockedRegions||[]).includes('redstone'))return;const M=sengiaSecurityState();if(M.lastTickDay>=state.world.day)return;
 while(M.lastTickDay<state.world.day){M.lastTickDay++;
  for(const [id,m] of Object.entries(M.settlements)){
   const econ=sengiaEconomyState().settlements[id],pressure=sengiaSecurityPressure(id);
   m.pressure=pressure;
   if(econ.food<30)m.manpower=Math.max(20,m.manpower-.45);else if(econ.food>45)m.manpower=Math.min(100,m.manpower+.12);
   if(econ.materials<30)m.garrison=Math.max(20,m.garrison-.25);else if(econ.materials>50)m.garrison=Math.min(100,m.garrison+.08);
   if(pressure>=7)m.patrols=Math.max(20,m.patrols-.2);
   if(m.irregulars>20&&settlementState(id).security<50)m.irregulars=Math.min(80,m.irregulars+.15);
   m.readiness=sengiaReadiness(id);m.coverage=clamp(Math.round((m.garrison+m.patrols-pressure*2)/2),10,100)
  }
  if(M.lastTickDay%2===0)sengiaPlanSecurityDeployments()
 }
}
function sengiaSecurityAction(id,act){
 const M=sengiaSecurityState(),m=M.settlements[id];let text='',tone='good';
 if(act==='patrol'){advanceWorldDays(1,SOSText("regions_sengia_redstone.sengiaSecurityAction.001",worldLocation(id).name));m.patrols=Math.min(100,m.patrols+6);settlementState(id).security=Math.min(100,settlementState(id).security+3);text=SOSText("regions_sengia_redstone.sengiaSecurityAction.002")}
 if(act==='supply'){if(state.gold<50)return actionResult(SOSText("regions_sengia_redstone.sengiaSecurityAction.003"),SOSText("regions_sengia_redstone.sengiaSecurityAction.004"),'bad',()=>showSengiaSecurity(id));state.gold-=50;sengiaEconomyState().settlements[id].materials=Math.min(100,sengiaEconomyState().settlements[id].materials+8);m.readiness=Math.min(100,m.readiness+4);text=SOSText("regions_sengia_redstone.sengiaSecurityAction.005")}
 if(act==='local'){advanceWorldDays(1,SOSText("regions_sengia_redstone.sengiaSecurityAction.006",worldLocation(id).name));m.irregulars=Math.min(80,m.irregulars+5);m.patrols=Math.min(100,m.patrols+2);recordFactionPower(id,SOSText("regions_sengia_redstone.sengiaSecurityAction.007"),'security',2,SOSText("regions_sengia_redstone.sengiaSecurityAction.008"),10);text=SOSText("regions_sengia_redstone.sengiaSecurityAction.009")}
 if(act==='redstone'){advanceWorldDays(1,SOSText("regions_sengia_redstone.sengiaSecurityAction.010",worldLocation(id).name));m.garrison=Math.min(100,m.garrison+5);m.patrols=Math.min(100,m.patrols+3);recordFactionPower(id,SOSText("regions_sengia_redstone.sengiaSecurityAction.011"),'security',2,SOSText("regions_sengia_redstone.sengiaSecurityAction.012"),10);adjustFactionStanding(SOSText("regions_sengia_redstone.sengiaSecurityAction.013"),1,SOSText("regions_sengia_redstone.sengiaSecurityAction.014"));text=SOSText("regions_sengia_redstone.sengiaSecurityAction.015")}
 if(act==='demob'){advanceWorldDays(1,SOSText("regions_sengia_redstone.sengiaSecurityAction.016",worldLocation(id).name));m.irregulars=Math.max(0,m.irregulars-5);m.manpower=Math.min(100,m.manpower+2);changeLocalReputation(id,1,SOSText("regions_sengia_redstone.sengiaSecurityAction.017"));text=SOSText("regions_sengia_redstone.sengiaSecurityAction.018")}
 recordSengiaSecurity(`${worldLocation(id).name}: ${text}`,tone);save();actionResult(SOSText("regions_sengia_redstone.sengiaSecurityAction.019"),text,tone,()=>showSengiaSecurity(id))
}
function showSengiaSecurity(id=state.world.location){modalRouteEnter(SOSText("regions_sengia_redstone.showSengiaSecurity.001"),Array.from(arguments));
 if(locationRegion(id)!=='redstone')return renderOpenWorld();const M=sengiaSecurityState(),m=M.settlements[id],deps=M.deployments.filter(x=>x.from===id||x.to===id).slice(-6).reverse(),hist=M.history.filter(x=>x.text.includes(worldLocation(id).name)).slice(-6).reverse();
 overlay(SOSText("regions_sengia_redstone.showSengiaSecurity.002",esc(worldLocation(id).name),redstonePolicyNoticeHTML(id),sengiaEconomyHTML(id),sengiaSecurityHTML(id),esc(sengiaPrecedentLabel(id)),esc(m.priority),deps.map(x=>`<div class="card compact"><b>${esc(worldLocation(x.from).name)} → ${esc(worldLocation(x.to).name)}</b><br>${esc(x.reason)} • ${esc(x.status)}</div>`).join('')||'<p class="muted">No recent security deployment involves this settlement.</p>',hist.map(x=>`<div class="card compact">Day ${x.day}: ${esc(x.text)}</div>`).join('')||'<p class="muted">No major security event recorded here yet.</p>'),true);
 document.querySelectorAll('[data-secact]').forEach(b=>b.onclick=()=>sengiaSecurityAction(id,b.dataset.secact));wireClose()
}

const SENGIA_RESOLUTION_STORIES=['sengia_hunger','lockwood_lines','paper_army','eastern_fuse'];
function sengiaResolutionState(){
 ensureWorldState();let R=state.world.sengiaResolution;
 if(!R||typeof R!=='object')R=state.world.sengiaResolution={status:'locked',stage:0,startDay:null,completedDay:null,framework:null,history:[],testimony:{},lastTickDay:state.world.day};
 if(!Array.isArray(R.history))R.history=[];if(!R.testimony)R.testimony={};return R
}
function sengiaCoreStoriesComplete(){return SENGIA_RESOLUTION_STORIES.every(id=>regionalStory(id)?.status==='complete')}
function sengiaChoiceSummary(){
 return SENGIA_RESOLUTION_STORIES.map(id=>{const a=regionalStory(id);return {id,title:regionalStoryDef(id)?.title||id,choice:a?.choice||null,text:a?.outcomeText||''}})
}
function sengiaConsequenceProfile(){
 const E=sengiaEconomyState(),M=sengiaSecurityState(),A=sengiaAuthorityState(),ids=Object.keys(SENGIA_SECURITY_DEFAULTS),avg=f=>Math.round(ids.reduce((n,id)=>n+f(id),0)/ids.length);
 const recovery=avg(id=>E.settlements[id]?.recovery||0),food=avg(id=>E.settlements[id]?.food||0),readiness=avg(id=>sengiaReadiness(id)),pressure=avg(id=>sengiaSecurityPressure(id));
 const precedents=Object.values(A.precedents||{}),local=precedents.filter(x=>x==='local'||x==='refused').length,review=precedents.filter(x=>x==='review').length,command=precedents.filter(x=>x==='command').length;
 const choices=sengiaChoiceSummary(),localChoices=choices.filter(x=>['compact','council','named','local','district'].includes(x.choice)).length,commandChoices=choices.filter(x=>['capital','closure','command'].includes(x.choice)).length,mixed=choices.length-localChoices-commandChoices;
 const score=Math.round(recovery*.28+food*.18+readiness*.28+(100-Math.min(100,pressure*10))*.16+Math.min(100,(local+review+command)*12)*.10);
 const condition=score>=72?'Resilient':score>=58?'Stabilizing':score>=44?'Uneven Recovery':SOSText("regions_sengia_redstone.sengiaConsequenceProfile.001");
 return {recovery,food,readiness,pressure,local,review,command,localChoices,commandChoices,mixed,score,condition}
}
function sengiaResolutionWitnesses(locId){
 const locals=(SETTLEMENT_NPCS[locId]||[]).map(n=>({n,r:npcRelationshipState(n.id)})).sort((a,b)=>(b.r.familiarity||0)-(a.r.familiarity||0)).slice(0,3);
 const parties=(state.world.parties||[]).filter(p=>worldPartyDisplayRegion(p)==='redstone'&&(p.social?.familiarity>=2||p.spotContractCompleted)).slice(0,2);
 return {locals,parties}
}
function sengiaResolutionTestimony(locId){
 const R=sengiaResolutionState(),profile=sengiaConsequenceProfile(),w=sengiaResolutionWitnesses(locId),names=w.locals.map(x=>x.n.name).join(', ')||SOSText("regions_sengia_redstone.sengiaResolutionTestimony.001");let text='';
 if(locId==='briarlake')text=SOSText("regions_sengia_redstone.sengiaResolutionTestimony.002",names,sengiaEconomyState().settlements.briarlake.food.toFixed(0),sengiaEconomyState().settlements.briarlake.seed.toFixed(0),sengiaEconomyState().settlements.briarlake.recovery.toFixed(0));
 if(locId==='lockwood')text=SOSText("regions_sengia_redstone.sengiaResolutionTestimony.003",names,sengiaReadiness('lockwood'),sengiaSecurityPressure('lockwood'),sengiaPrecedentLabel('lockwood').toLowerCase());
 if(locId==='pyreglade')text=SOSText("regions_sengia_redstone.sengiaResolutionTestimony.004",names,sengiaReadiness('pyreglade'),sengiaEconomyState().settlements.pyreglade.materials.toFixed(0),sengiaPrecedentLabel('pyreglade').toLowerCase());
 if(w.parties.length)text+=SOSText("regions_sengia_redstone.sengiaResolutionTestimony.005",w.parties.map(p=>p.name).join(' and '));
 R.testimony[locId]={day:state.world.day,text,npcs:w.locals.map(x=>x.n.id),parties:w.parties.map(p=>p.id),profile:{...profile}};R.history.push({day:state.world.day,type:'testimony',locId,text});R.history=R.history.slice(-50);
 for(const x of w.locals){npcMemoryAdd(x.n.id,SOSText("regions_sengia_redstone.sengiaResolutionTestimony.006"),1)}
 recordWorldHistory(SOSText("regions_sengia_redstone.sengiaResolutionTestimony.007",worldLocation(locId).name),'info',SOSText("regions_sengia_redstone.sengiaResolutionTestimony.008"));save();return text
}
function refreshSengiaResolution(){
 const R=sengiaResolutionState();if(R.status==='locked'&&sengiaCoreStoriesComplete()){R.status='available';R.stage=0;R.history.push({day:state.world.day,type:'available',text:SOSText("regions_sengia_redstone.refreshSengiaResolution.001")});recordWorldHistory(SOSText("regions_sengia_redstone.refreshSengiaResolution.002"),'good',SOSText("regions_sengia_redstone.refreshSengiaResolution.003"));save()}return R
}
function sengiaResolutionObjective(){
 const R=refreshSengiaResolution();if(R.status==='locked')return SOSText("regions_sengia_redstone.sengiaResolutionObjective.001");
 if(R.status==='available')return SOSText("regions_sengia_redstone.sengiaResolutionObjective.002");
 if(R.status==='active'){return R.stage===0?'Hear Grain Valley testimony in Briarlake.':R.stage===1?'Hear authority and security testimony in Lockwood.':R.stage===2?'Hear eastern logistics testimony in Pyreglade.':SOSText("regions_sengia_redstone.sengiaResolutionObjective.003")}
 if(R.status==='decision')return SOSText("regions_sengia_redstone.sengiaResolutionObjective.004");
 return SOSText("regions_sengia_redstone.sengiaResolutionObjective.005",R.completedDay)
}
function sengiaResolutionTarget(){
 const R=refreshSengiaResolution();if(R.status==='available')return'sengia';if(R.status==='active')return R.stage===0?'briarlake':R.stage===1?'lockwood':R.stage===2?'pyreglade':'sengia';if(R.status==='decision')return'sengia';return null
}
function beginSengiaResolution(){
 const R=refreshSengiaResolution();if(R.status!=='available')return showSengiaRegionalConsequences();
 if(state.world.location!=='sengia')return actionResult(SOSText("regions_sengia_redstone.beginSengiaResolution.001"),SOSText("regions_sengia_redstone.beginSengiaResolution.002"),'info',showSengiaRegionalConsequences);
 R.status='active';R.startDay=state.world.day;R.stage=0;R.history.push({day:state.world.day,type:'start',text:SOSText("regions_sengia_redstone.beginSengiaResolution.003")});
 const known=settlementNpcsPresent('sengia').filter(n=>n.home==='sengia').slice(0,4);for(const n of known)npcMemoryAdd(n.id,SOSText("regions_sengia_redstone.beginSengiaResolution.004"),1);
 recordWorldHistory(SOSText("regions_sengia_redstone.beginSengiaResolution.005"),'good',SOSText("regions_sengia_redstone.beginSengiaResolution.006"));save();actionResult(SOSText("regions_sengia_redstone.beginSengiaResolution.007"),SOSText("regions_sengia_redstone.beginSengiaResolution.008"),'good',showSengiaRegionalConsequences)
}
function advanceSengiaResolution(){
 const R=refreshSengiaResolution(),target=sengiaResolutionTarget();if(R.status!=='active')return showSengiaRegionalConsequences();if(state.world.location!==target)return actionResult(SOSText("regions_sengia_redstone.advanceSengiaResolution.001"),SOSText("regions_sengia_redstone.advanceSengiaResolution.002",worldLocation(target).name),'info',showSengiaRegionalConsequences);
 if(R.stage<=2){const text=sengiaResolutionTestimony(target);R.stage++;save();return actionResult(SOSText("regions_sengia_redstone.advanceSengiaResolution.003",worldLocation(target).name),text,'good',showSengiaRegionalConsequences)}
 if(R.stage===3&&state.world.location==='sengia'){R.status='decision';R.history.push({day:state.world.day,type:'decision',text:SOSText("regions_sengia_redstone.advanceSengiaResolution.004")});save();return showSengiaRegionalConsequences()}
}
function sengiaFrameworkChoices(){
 const p=sengiaConsequenceProfile();return [
  ['compact',SOSText("regions_sengia_redstone.sengiaFrameworkChoices.001"),SOSText("regions_sengia_redstone.sengiaFrameworkChoices.002",p.condition)],
  ['command',SOSText("regions_sengia_redstone.sengiaFrameworkChoices.003"),SOSText("regions_sengia_redstone.sengiaFrameworkChoices.004")],
  ['local',SOSText("regions_sengia_redstone.sengiaFrameworkChoices.005"),SOSText("regions_sengia_redstone.sengiaFrameworkChoices.006")]
 ]
}
function applySengiaFramework(choice){
 const R=sengiaResolutionState(),E=sengiaEconomyState(),M=sengiaSecurityState(),ids=Object.keys(SENGIA_SECURITY_DEFAULTS);let text='',tone='good';
 if(choice==='compact'){
  for(const id of ids){E.settlements[id].recovery=Math.min(100,E.settlements[id].recovery+4);M.settlements[id].patrols=Math.min(100,M.settlements[id].patrols+2)}
  E.settlements.briarlake.seed=Math.max(E.settlements.briarlake.seed,sengiaSeedFloor('briarlake')+4);adjustFactionStanding(SOSText("regions_sengia_redstone.applySengiaFramework.001"),1,SOSText("regions_sengia_redstone.applySengiaFramework.002"));state.reputation+=2;
  text=SOSText("regions_sengia_redstone.applySengiaFramework.003")
 }
 if(choice==='command'){
  E.settlements.sengia.food=Math.min(100,E.settlements.sengia.food+8);E.settlements.sengia.recovery=Math.min(100,E.settlements.sengia.recovery+5);
  for(const id of ids){M.settlements[id].garrison=Math.min(100,M.settlements[id].garrison+5);M.settlements[id].patrols=Math.min(100,M.settlements[id].patrols+3)}
  for(const id of ids.filter(x=>x!=='sengia'))E.settlements[id].recovery=Math.max(0,E.settlements[id].recovery-1);
  adjustFactionStanding(SOSText("regions_sengia_redstone.applySengiaFramework.004"),3,SOSText("regions_sengia_redstone.applySengiaFramework.005"));changeLocalReputation('sengia',2,SOSText("regions_sengia_redstone.applySengiaFramework.006"));
  text=SOSText("regions_sengia_redstone.applySengiaFramework.007")
 }
 if(choice==='local'){
  for(const id of ids.filter(x=>x!=='sengia')){E.settlements[id].recovery=Math.min(100,E.settlements[id].recovery+5);M.settlements[id].irregulars=Math.max(0,M.settlements[id].irregulars-3);changeLocalReputation(id,1,SOSText("regions_sengia_redstone.applySengiaFramework.008"))}
  M.settlements.sengia.garrison=Math.max(20,M.settlements.sengia.garrison-2);adjustFactionStanding(SOSText("regions_sengia_redstone.applySengiaFramework.009"),-1,SOSText("regions_sengia_redstone.applySengiaFramework.010"));state.reputation+=3;
  text=SOSText("regions_sengia_redstone.applySengiaFramework.011")
 }
 R.framework=choice;R.frameworkText=text;R.status='complete';R.completedDay=state.world.day;R.history.push({day:state.world.day,type:'complete',choice,text,profile:sengiaConsequenceProfile()});R.history=R.history.slice(-50);
 for(const id of ids){const people=(SETTLEMENT_NPCS[id]||[]).slice(0,4);for(const n of people)npcMemoryAdd(n.id,SOSText("regions_sengia_redstone.applySengiaFramework.012",choice==='compact'?'Provincial Recovery Compact':choice==='command'?'Central Reconstruction Directorate':'Network of Local Accords'),choice==='local'?1:0)}
 SOSServices.companions.noteSharedEvent('regional_story',SOSText("regions_sengia_redstone.applySengiaFramework.013",text));recordWorldHistory(SOSText("regions_sengia_redstone.applySengiaFramework.014",text),'good',SOSText("regions_sengia_redstone.applySengiaFramework.015"));save();return {text,tone}
}
function resolveSengiaFramework(choice){
 const R=refreshSengiaResolution();if(R.status!=='decision'||state.world.location!=='sengia')return actionResult(SOSText("regions_sengia_redstone.resolveSengiaFramework.001"),SOSText("regions_sengia_redstone.resolveSengiaFramework.002"),'info',showSengiaRegionalConsequences);
 const result=applySengiaFramework(choice);actionResult(SOSText("regions_sengia_redstone.resolveSengiaFramework.003"),SOSText("regions_sengia_redstone.resolveSengiaFramework.004",result.text),'good',showSengiaRegionalConsequences)
}
function sengiaFrameworkLabel(){const f=sengiaResolutionState().framework;return f==='compact'?'Provincial Recovery Compact':f==='command'?'Central Reconstruction Directorate':f==='local'?'Network of Local Accords':SOSText("regions_sengia_redstone.sengiaFrameworkLabel.001")}
function sengiaRegionalConsequenceDailyTick(){
 const R=sengiaResolutionState();if(R.status!=='complete'||R.lastTickDay>=state.world.day)return;const E=sengiaEconomyState(),M=sengiaSecurityState();while(R.lastTickDay<state.world.day){R.lastTickDay++;
  if(R.framework==='compact'){for(const id of Object.keys(SENGIA_SECURITY_DEFAULTS)){E.settlements[id].recovery=Math.min(100,E.settlements[id].recovery+.10);M.settlements[id].patrols=Math.min(100,M.settlements[id].patrols+.05)}}
  if(R.framework==='command'){M.settlements.sengia.garrison=Math.min(100,M.settlements.sengia.garrison+.12);M.settlements.sengia.patrols=Math.min(100,M.settlements.sengia.patrols+.10)}
  if(R.framework==='local'){for(const id of Object.keys(SENGIA_SECURITY_DEFAULTS).filter(x=>x!=='sengia')){E.settlements[id].recovery=Math.min(100,E.settlements[id].recovery+.12);M.settlements[id].irregulars=Math.max(0,M.settlements[id].irregulars-.06)}}
 }}
function sengiaConsequenceSummaryHTML(){
 const R=refreshSengiaResolution(),p=sengiaConsequenceProfile();return SOSText("regions_sengia_redstone.sengiaConsequenceSummaryHTML.001",esc(p.condition),p.score,p.recovery,p.food,p.readiness,p.pressure,R.status==='complete'?`Framework: ${esc(sengiaFrameworkLabel())}`:`Status: ${esc(R.status)} • ${esc(sengiaResolutionObjective())}`)
}
function showSengiaRegionalConsequences(){modalRouteEnter(SOSText("regions_sengia_redstone.showSengiaRegionalConsequences.001"),Array.from(arguments));
 const R=refreshSengiaResolution(),p=sengiaConsequenceProfile(),target=sengiaResolutionTarget(),choices=sengiaChoiceSummary(),test=Object.entries(R.testimony||{});
 overlay(SOSText("regions_sengia_redstone.showSengiaRegionalConsequences.002",sengiaConsequenceSummaryHTML(),choices.map(x=>`<div class="card compact"><b>${esc(x.title)}</b><br>${x.choice?`<small>${esc(x.choice)}</small><br>${esc(x.text)}`:'<span class="muted">Not yet resolved.</span>'}</div>`).join(''),p.local,p.review,p.command,p.recovery,p.readiness,p.pressure,test.length?`<h3>Settlement Testimony</h3>${test.map(([id,t])=>`<div class="card compact"><b>${esc(worldLocation(id).name)}</b><br>${esc(t.text)}</div>`).join('')}`:'',R.status==='complete'?`<h3>Final Framework</h3><div class="notice good"><b>${esc(sengiaFrameworkLabel())}</b><br>${esc(R.frameworkText)}</div>`:'',R.status==='available'?`<button id="sengiaResolutionStart">${state.world.location==='sengia'?'Begin Regional Settlement':'Travel to Sengia to Begin'}</button>`:'',R.status==='active'&&target?`<button id="sengiaResolutionContinue">${state.world.location===target?'Hear / Present Testimony Here':`Travel to ${esc(worldLocation(target).name)}`}</button>`:'',R.status==='decision'?sengiaFrameworkChoices().map(([k,t,d])=>`<button data-sengiaframework="${k}"><b>${esc(t)}</b><br><small>${esc(d)}</small></button>`).join(''):''),true);
 if($('#sengiaResolutionStart'))$('#sengiaResolutionStart').onclick=()=>state.world.location==='sengia'?beginSengiaResolution():(closeOverlay(),regionalStoryTravelStep('sengia'));
 if($('#sengiaResolutionContinue'))$('#sengiaResolutionContinue').onclick=()=>state.world.location===target?advanceSengiaResolution():(closeOverlay(),regionalStoryTravelStep(target));
 document.querySelectorAll('[data-sengiaframework]').forEach(b=>b.onclick=()=>resolveSengiaFramework(b.dataset.sengiaframework));wireClose()
}

function v1510Num(v,fallback=0,min=0,max=100){v=Number(v);return Number.isFinite(v)?clamp(v,min,max):fallback}
function recreateSpotIssuerParty(q){
 if(!q?.spotContract||!['active','ready'].includes(q.status))return null;
 let p=rawContractParty(q);if(p)return p;
 const origin=validWorldLocationId(q.origin)?q.origin:state.world.location;
 const kind=q.spotIssuerKind||q.escortKind||(q.type==='escort'?'merchant':'merchant'),base=worldPartyType(kind)||worldPartyType('merchant');
 p={id:uid(),kind,name:q.spotIssuerName||q.escortPartyName||SOSText("regions_sengia_redstone.recreateSpotIssuerParty.001",worldLocation(origin).name),faction:q.spotIssuerFaction||q.faction||base?.faction||SOSText("regions_sengia_redstone.recreateSpotIssuerParty.002"),attitude:'friendly',purpose:q.spotIssuerPurpose||SOSText("regions_sengia_redstone.recreateSpotIssuerParty.003",q.name),origin,location:origin,destination:validWorldLocationId(q.target)?q.target:purposefulDestination(kind,origin),travelLeft:Math.max(1,worldTravelDays(origin,validWorldLocationId(q.target)?q.target:purposefulDestination(kind,origin))),travelTotal:Math.max(1,worldTravelDays(origin,validWorldLocationId(q.target)?q.target:purposefulDestination(kind,origin))),createdDay:state.world.day,questId:q.id,contractProtected:true,contractRole:q.type==='escort'?'escort':'spot'};
 state.world.parties.push(p);q.partyId=p.id;
 if(q.type==='escort'){q.escortKind=kind;q.escortPartyName=p.name;q.escortStage=q.escortStage||'rendezvous';p.destination=q.target;p.travelTotal=p.travelLeft=Math.max(1,q.escortTotalDays||worldTravelDays(q.origin,q.target));p.escortWaiting=q.escortStage!=='escorting';p.escortActive=q.escortStage==='escorting'}
 log(SOSText("regions_sengia_redstone.recreateSpotIssuerParty.004",p.name), 'info');return p
}
function repairV1510OpenWorldState(){
 if(!isOpenWorld()||!state.world)return 0;let fixes=0;const note=t=>{fixes++;notePreflightRepair(t)},w=state.world;
 // New Sengia systems: initialize, clamp, and remove impossible temporal states.
 if((w.unlockedRegions||[]).includes('redstone')){
  const E=sengiaEconomyState(),M=sengiaSecurityState(),A=sengiaAuthorityState(),R=sengiaResolutionState();
  for(const [id,e] of Object.entries(E.settlements)){for(const k of ['food','seed','materials','recovery']){const old=e[k],nu=v1510Num(old,SENGIA_ECONOMY_DEFAULTS.settlements[id]?.[k]||40);if(nu!==old){e[k]=nu;note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.001",worldLocation(id).name,k))}}}
  if(!Number.isFinite(E.lastTickDay)||E.lastTickDay>w.day){E.lastTickDay=w.day;note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.002"))}
  E.shipments=(E.shipments||[]).filter(x=>x&&x.id&&validWorldLocationId(x.from)&&validWorldLocationId(x.to)).slice(-30);
  for(const [id,m] of Object.entries(M.settlements)){for(const k of ['garrison','patrols','manpower','readiness','irregulars','coverage']){const old=m[k],nu=v1510Num(old,SENGIA_SECURITY_DEFAULTS[id]?.[k]||45);if(nu!==old){m[k]=nu;note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.003",worldLocation(id).name,k))}}m.pressure=Math.max(0,Number(m.pressure)||0)}
  if(!Number.isFinite(M.lastTickDay)||M.lastTickDay>w.day){M.lastTickDay=w.day;note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.004"))}
  M.deployments=(M.deployments||[]).filter(x=>x&&x.id&&validWorldLocationId(x.from)&&validWorldLocationId(x.to)).slice(-40);
  for(const d of M.deployments.filter(x=>x.status==='moving')){const p=w.parties.find(x=>x.id===d.partyId);if(!p){d.status='ended';d.endedDay=w.day;note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.005",worldLocation(d.to).name))}}
  if(!['locked','available','active','decision','complete'].includes(R.status)){R.status=sengiaCoreStoriesComplete()?'available':'locked';R.stage=0;note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.006"))}
  if(R.status==='complete'&&!['compact','command','local'].includes(R.framework)){R.status=sengiaCoreStoriesComplete()?'decision':'locked';R.framework=null;note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.007"))}
  if(!Number.isFinite(R.lastTickDay)||R.lastTickDay>w.day){R.lastTickDay=w.day;note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.008"))}
  if(R.status==='locked'&&sengiaCoreStoriesComplete()){R.status='available';note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.009"))}
 }
 // Contract-party integrity. Active contract parties must remain linked; stale protection must not survive a finished contract.
 const activeIds=new Set((w.quests||[]).filter(q=>['active','ready'].includes(q.status)).map(q=>q.id));
 for(const p of w.parties||[]){
  if(p.contractProtected&&(!p.questId||!activeIds.has(p.questId))){p.contractProtected=false;p.contractRole=null;p.contractExpiresDay=null;note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.010",p.name||'world party'))}
 }
 for(const q of (w.quests||[]).filter(q=>['active','ready'].includes(q.status))){
  let p=rawContractParty(q);
  if(!p&&q.spotContract){p=q.type==='escort'?createEscortCaravan(q,true):recreateSpotIssuerParty(q);if(p)note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.011",q.name))}
  if(!p&&['hunt','recovery'].includes(q.type)){p=createContractTargetParty(q,true);if(p)note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.012",q.name))}
  if(!p&&q.type==='escort'&&q.status==='active'){p=createEscortCaravan(q,true);if(p)note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.013",q.name))}
  if(p){p.questId=q.id;p.contractProtected=true;p.contractRole=q.type==='escort'?'escort':p.contractRole||'contract';q.partyId=p.id}
 }
 // Old v1.3.29 opportunity tracking states are no longer gameplay.
 normalizeRegionalOpportunityState();
 // Keep tracking pointers meaningful.
 if(w.trackedPartyId&&!w.parties.some(p=>p.id===w.trackedPartyId)){w.trackedPartyId=null;note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.014"))}
 if(w.trackedQuestId&&!w.quests.some(q=>q.id===w.trackedQuestId&&['active','ready'].includes(q.status))){w.trackedQuestId=null;note(SOSText("regions_sengia_redstone.repairV1510OpenWorldState.015"))}
 return fixes
}
const SENGIA_AUTHORITY_CASES={
 sengia:[
  {id:'warehouse_seizure',title:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.016"),order:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.017"),basis:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.018"),local:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.019"),risk:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.020")},
  {id:'permit_detention',title:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.021"),order:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.022"),basis:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.023"),local:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.024"),risk:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.025")}
 ],
 lockwood:[
  {id:'forest_detention',title:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.026"),order:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.027"),basis:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.028"),local:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.029"),risk:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.030")},
  {id:'route_closure',title:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.031"),order:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.032"),basis:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.033"),local:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.034"),risk:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.035")}
 ],
 grayhaven:[
  {id:'unsafe_march',title:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.036"),order:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.037"),basis:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.038"),local:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.039"),risk:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.040")}
 ],
 briarlake:[
  {id:'reserve_requisition',title:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.041"),order:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.042"),basis:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.043"),local:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.044"),risk:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.045")}
 ],
 glenbrook:[
  {id:'unnamed_voucher',title:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.046"),order:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.047"),basis:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.048"),local:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.049"),risk:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.050")}
 ],
 tyrdon:[
  {id:'volunteer_quota',title:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.051"),order:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.052"),basis:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.053"),local:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.054"),risk:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.055")}
 ],
 pyreglade:[
  {id:'unsafe_stores',title:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.056"),order:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.057"),basis:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.058"),local:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.059"),risk:SOSText("regions_sengia_redstone.repairV1510OpenWorldState.060")}
 ]
};
function sengiaAuthorityState(){
 ensureWorldState();if(!state.world.sengiaAuthority||typeof state.world.sengiaAuthority!=='object')state.world.sengiaAuthority={cases:{},precedents:{},history:[],appeals:0,documented:0,refusals:0,compliance:0};
 const A=state.world.sengiaAuthority;if(!A.cases)A.cases={};if(!A.precedents)A.precedents={};if(!Array.isArray(A.history))A.history=[];return A
}
function activeSengiaAuthorityCase(locId){const q=sengiaAuthorityState().cases[locId];return q&&q.status==='active'&&q.expiresDay>=state.world.day?q:null}
function sengiaPrecedentLabel(locId){
 const p=sengiaAuthorityState().precedents[locId];if(!p)return SOSText("regions_sengia_redstone.sengiaPrecedentLabel.001");
 return p==='command'?'Command authority favored':p==='review'?'Orders require review / documentation':p==='local'?'Local authority favored':p==='refused'?'Questionable order refused':SOSText("regions_sengia_redstone.sengiaPrecedentLabel.002")
}
function generateSengiaAuthorityCase(locId,force=false){
 if(locationRegion(locId)!=='redstone'||!SENGIA_AUTHORITY_CASES[locId])return null;const A=sengiaAuthorityState(),old=A.cases[locId];
 if(!force&&old?.status==='active'&&old.expiresDay>=state.world.day)return old;if(!force&&old?.resolvedDay&&state.world.day-old.resolvedDay<5)return null;
 const def=pick(SENGIA_AUTHORITY_CASES[locId]);A.cases[locId]={...def,status:'active',createdDay:state.world.day,expiresDay:state.world.day+5};return A.cases[locId]
}
function sengiaAuthorityCaseHTML(locId){
 const q=activeSengiaAuthorityCase(locId);return q?SOSText("regions_sengia_redstone.sengiaAuthorityCaseHTML.001",esc(q.title),esc(q.order)):SOSText("regions_sengia_redstone.sengiaAuthorityCaseHTML.002")
}
function sengiaAuthorityOutcome(locId,choice,q){
 const A=sengiaAuthorityState(),ss=settlementState(locId);let text='',tone='info',precedent='mixed';
 if(choice==='comply'){adjustFactionStanding(SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.001"),2,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.002",q.title));recordFactionPower(locId,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.003"),'law',3,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.004",q.title),10);ss.security=Math.min(100,ss.security+2);A.compliance++;precedent='command';text=SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.005")}
 if(choice==='challenge'){changeLocalReputation(locId,2,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.006",q.title));recordFactionPower(locId,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.007"),'law',3,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.008",q.title),10);adjustFactionStanding(SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.009"),-1,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.010",q.title));precedent='local';text=SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.011");tone='good'}
 if(choice==='appeal'){const roll=rnd(1,20)+stat(state,'cha')+Math.floor(jurisdictionRep(locId)/3)+(redstoneCompanionPolicy('red_adjutant')==='accountable'?2:0);A.appeals++;if(roll>=16){recordFactionPower(locId,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.012"),'law',1,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.013",q.title),8);recordFactionPower(locId,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.014"),'law',2,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.015",q.title),8);adjustFactionStanding(SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.016"),1,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.017"));changeLocalReputation(locId,1,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.018"));precedent='review';text=SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.019");tone='good'}else{precedent='command';adjustFactionStanding(SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.020"),1,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.021"));text=SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.022")}}
 if(choice==='document'){A.documented++;adjustJurisdictionRep(locId,1,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.023"));recordFactionPower(locId,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.024"),'law',1,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.025",q.title),8);precedent='review';text=SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.026");tone='good'}
 if(choice==='negotiate'){const roll=rnd(1,20)+stat(state,'cha')+Math.floor(localReputation(locId)/3);if(roll>=15){recordFactionPower(locId,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.027"),'law',1,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.028",q.title),7);recordFactionPower(locId,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.029"),'law',1,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.030",q.title),7);precedent='review';text=SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.031");tone='good'}else{text=SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.032")}}
 if(choice==='refuse'){A.refusals++;adjustFactionStanding(SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.033"),-2,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.034",q.title));changeLocalReputation(locId,2,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.035",q.title));recordFactionPower(locId,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.036"),'law',2,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.037",q.title),8);precedent='refused';text=SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.038");tone='bad'}
 A.precedents[locId]=precedent;q.status='resolved';q.choice=choice;q.resolvedDay=state.world.day;q.result=text;A.history.push({day:state.world.day,locId,title:q.title,choice,precedent,text});A.history=A.history.slice(-60);
 recordWorldHistory(`${worldLocation(locId).name}: ${q.title} — ${text}`,tone,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.039"));advanceWorldDays(1,SOSText("regions_sengia_redstone.sengiaAuthorityOutcome.040",q.title));save();return {text,tone}
}
function resolveSengiaAuthorityCase(locId,choice){
 const q=activeSengiaAuthorityCase(locId);if(!q)return showSengiaAuthority(locId);const r=sengiaAuthorityOutcome(locId,choice,q);actionResult(q.title,r.text,r.tone,()=>showSengiaAuthority(locId))
}
function showSengiaAuthorityCase(locId){modalRouteEnter(SOSText("regions_sengia_redstone.showSengiaAuthorityCase.001"),Array.from(arguments));
 const q=activeSengiaAuthorityCase(locId)||generateSengiaAuthorityCase(locId,true);if(!q)return showSengiaAuthority(locId);
 overlay(SOSText("regions_sengia_redstone.showSengiaAuthorityCase.002",esc(worldLocation(locId).name),esc(q.title),redstonePolicyNoticeHTML(locId),esc(q.order),esc(q.basis),esc(q.local),esc(q.risk)),true);
 document.querySelectorAll('[data-sengiaorder]').forEach(b=>b.onclick=()=>resolveSengiaAuthorityCase(locId,b.dataset.sengiaorder));$('#sengiaOrderBack').onclick=()=>showSengiaAuthority(locId)
}
function showSengiaAuthority(locId=state.world.location){modalRouteEnter(SOSText("regions_sengia_redstone.showSengiaAuthority.001"),Array.from(arguments));
 if(locationRegion(locId)!=='redstone')return showLocalLaw(locId);if(!activeSengiaAuthorityCase(locId)&&chance(.5))generateSengiaAuthorityCase(locId);
 const A=sengiaAuthorityState(),q=activeSengiaAuthorityCase(locId),history=A.history.filter(x=>x.locId===locId).slice(-5).reverse();
 overlay(SOSText("regions_sengia_redstone.showSengiaAuthority.002",esc(worldLocation(locId).name),redstonePoliticsHTML(locId),redstonePolicyNoticeHTML(locId),esc(sengiaPrecedentLabel(locId)),esc(jurisdictionRule(locId).authority),sengiaAuthorityCaseHTML(locId),history.map(x=>`<div class="card compact"><b>Day ${x.day}: ${esc(x.title)}</b><br>${esc(x.text)}</div>`).join('')||'<p class="muted">No Guardian authority ruling has been recorded here yet.</p>'),true);
 if($('#sengiaAuthorityCase'))$('#sengiaAuthorityCase').onclick=()=>showSengiaAuthorityCase(locId);$('#sengiaAuthorityLaw').onclick=()=>showLocalLaw(locId);wireClose()
}
function redstoneAuthorityDailyTick(){
 if(!isOpenWorld()||!(state.world.unlockedRegions||[]).includes('redstone'))return;const A=sengiaAuthorityState();
 for(const id of Object.keys(SENGIA_AUTHORITY_CASES)){const q=A.cases[id];if(q?.status==='active'&&q.expiresDay<state.world.day){q.status='expired';q.resolvedDay=state.world.day;q.result=SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.001");A.history.push({day:state.world.day,locId:id,title:q.title,choice:'none',precedent:A.precedents[id]||'none',text:q.result})}else if(!activeSengiaAuthorityCase(id)&&chance(.08))generateSengiaAuthorityCase(id)}
 A.history=A.history.slice(-60)
}
const REDSTONE_CIVIC_ISSUES={
 sengia:[
  {id:'warehouse_priority',title:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.002"),text:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.003"),a:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.004"),'command'],b:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.005"),'civilian']},
  {id:'gate_permits',title:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.006"),text:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.007"),a:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.008"),'command'],b:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.009"),'civilian']}
 ],
 lockwood:[
  {id:'forest_searches',title:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.010"),text:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.011"),a:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.012"),'command'],b:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.013"),'civilian']},
  {id:'timber_requisition',title:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.014"),text:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.015"),a:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.016"),'command'],b:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.017"),'civilian']}
 ],
 grayhaven:[
  {id:'road_schedule',title:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.018"),text:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.019"),a:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.020"),'command'],b:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.021"),'civilian']}
 ],
 briarlake:[
  {id:'grain_release',title:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.022"),text:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.023"),a:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.024"),'command'],b:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.025"),'civilian']},
  {id:'mill_priority',title:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.026"),text:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.027"),a:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.028"),'command'],b:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.029"),'civilian']}
 ],
 glenbrook:[
  {id:'supply_vouchers',title:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.030"),text:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.031"),a:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.032"),'command'],b:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.033"),'civilian']}
 ],
 tyrdon:[
  {id:'volunteer_roster',title:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.034"),text:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.035"),a:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.036"),'command'],b:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.037"),'civilian']},
  {id:'water_convoy',title:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.038"),text:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.039"),a:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.040"),'command'],b:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.041"),'civilian']}
 ],
 pyreglade:[
  {id:'storage_site',title:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.042"),text:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.043"),a:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.044"),'command'],b:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.045"),'civilian']},
  {id:'stable_priority',title:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.046"),text:SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.047"),a:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.048"),'command'],b:[SOSText("regions_sengia_redstone.redstoneAuthorityDailyTick.049"),'civilian']}
 ]
};
function redstoneCivicState(){
 ensureWorldState();if(!state.world.redstoneCivic||typeof state.world.redstoneCivic!=='object')state.world.redstoneCivic={issues:{},districts:{},history:[],lastTickDay:0};
 const C=state.world.redstoneCivic;if(!C.issues)C.issues={};if(!C.districts)C.districts={};if(!Array.isArray(C.history))C.history=[];return C
}
function redstoneCompanionPolicy(id){
 const s=state.world?.companionStories?.[id];return s?.status==='complete'?s.choice:null
}
function redstonePolicyNotices(locId){
 const out=[],cass=redstoneCompanionPolicy('red_adjutant'),mara=redstoneCompanionPolicy('red_lockrunner'),tessa=redstoneCompanionPolicy('red_grainwarden'),ronan=redstoneCompanionPolicy('red_firebreak');
 if(['sengia','glenbrook'].includes(locId)&&cass==='accountable')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.001"));
 if(['sengia','glenbrook'].includes(locId)&&cass==='discretion')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.002"));
 if(['lockwood','lockwoodforest'].includes(locId)&&mara==='council')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.003"));
 if(['lockwood','lockwoodforest'].includes(locId)&&mara==='hidden')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.004"));
 if(['briarlake','grainvalley','sengia'].includes(locId)&&tessa==='reserve')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.005"));
 if(['briarlake','grainvalley','sengia'].includes(locId)&&tessa==='compact')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.006"));
 if(['pyreglade','pyreslopes'].includes(locId)&&ronan==='local')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.007"));
 if(['pyreglade','pyreslopes'].includes(locId)&&ronan==='joint')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.008"));
 const food=redstoneRegionalOutcome('sengia_hunger'),lines=redstoneRegionalOutcome('lockwood_lines'),paper=redstoneRegionalOutcome('paper_army'),east=redstoneRegionalOutcome('eastern_fuse');
 if(['sengia','briarlake','grayhaven','grainvalley'].includes(locId)&&food==='compact')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.009"));
 if(['sengia','briarlake','grainvalley'].includes(locId)&&food==='capital')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.010"));
 if(['sengia','briarlake','grainvalley'].includes(locId)&&food==='market')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.011"));
 if(['lockwood','lockwoodforest','sengia'].includes(locId)&&lines==='council')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.012"));
 if(['lockwood','lockwoodforest','sengia'].includes(locId)&&lines==='joint')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.013"));
 if(['lockwood','lockwoodforest','sengia'].includes(locId)&&lines==='closure')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.014"));
 if(['sengia','glenbrook','tyrdon'].includes(locId)&&paper==='named')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.015"));
 if(['sengia','glenbrook','tyrdon'].includes(locId)&&paper==='district')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.016"));
 if(['sengia','glenbrook','tyrdon'].includes(locId)&&paper==='command')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.017"));
 if(['sengia','pyreglade','pyreslopes'].includes(locId)&&east==='local')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.018"));
 if(['sengia','pyreglade','pyreslopes'].includes(locId)&&east==='joint')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.019"));
 if(['sengia','pyreglade','pyreslopes'].includes(locId)&&east==='command')out.push(SOSText("regions_sengia_redstone.redstonePolicyNotices.020"));
 return out
}
function redstonePolicyNoticeHTML(locId){
 const rows=redstonePolicyNotices(locId);return rows.length?SOSText("regions_sengia_redstone.redstonePolicyNoticeHTML.001",rows.map(x=>`<span>• ${esc(x)}</span>`).join('')):''
}
function currentRedstoneCivicIssue(locId){
 const C=redstoneCivicState(),q=C.issues[locId];if(q&&q.status==='active'&&q.expiresDay>=state.world.day)return q;return null
}
function generateRedstoneCivicIssue(locId,force=false){
 if(locationRegion(locId)!=='redstone'||!REDSTONE_CIVIC_ISSUES[locId])return null;const C=redstoneCivicState(),old=C.issues[locId];
 if(!force&&old?.status==='active'&&old.expiresDay>=state.world.day)return old;
 if(!force&&old?.resolvedDay&&state.world.day-old.resolvedDay<4)return null;
 const def=pick(REDSTONE_CIVIC_ISSUES[locId]),q={...def,status:'active',createdDay:state.world.day,expiresDay:state.world.day+4};C.issues[locId]=q;return q
}
function redstoneCivicIssueHTML(locId){
 const q=currentRedstoneCivicIssue(locId);if(!q)return SOSText("regions_sengia_redstone.redstoneCivicIssueHTML.001");
 return SOSText("regions_sengia_redstone.redstoneCivicIssueHTML.002",esc(q.title),esc(q.text))
}
function resolveRedstoneCivicIssue(locId,side){
 const C=redstoneCivicState(),q=currentRedstoneCivicIssue(locId);if(!q)return showRedstoneCivicLife(locId);const ss=settlementState(locId),civilian=side==='civilian',choice=civilian?q.b[0]:q.a[0];q.status='resolved';q.choice=side;q.resolvedDay=state.world.day;
 if(civilian){changeLocalReputation(locId,2,SOSText("regions_sengia_redstone.resolveRedstoneCivicIssue.001",q.title));recordFactionPower(locId,SOSText("regions_sengia_redstone.resolveRedstoneCivicIssue.002"),'politics',2,SOSText("regions_sengia_redstone.resolveRedstoneCivicIssue.003",q.title),7);ss.prosperity=Math.min(100,ss.prosperity+1)}
 else{adjustFactionStanding(SOSText("regions_sengia_redstone.resolveRedstoneCivicIssue.004"),1,SOSText("regions_sengia_redstone.resolveRedstoneCivicIssue.005",q.title));recordFactionPower(locId,SOSText("regions_sengia_redstone.resolveRedstoneCivicIssue.006"),'politics',2,SOSText("regions_sengia_redstone.resolveRedstoneCivicIssue.007",q.title),7);ss.security=Math.min(100,ss.security+1)}
 if(q.id==='road_schedule'&&civilian)reduceRoutePressure('grayhaven','briarlake',1);
 if(q.id==='grain_release'&&!civilian)changeTradeStock('sengia','food',1);
 if(q.id==='grain_release'&&civilian)changeTradeStock('briarlake','food',1);
 if(q.id==='storage_site'&&civilian)ss.security=Math.min(100,ss.security+2);
 if(q.id==='supply_vouchers'&&civilian&&redstoneCompanionPolicy('red_adjutant')==='accountable')changeLocalReputation('glenbrook',1,SOSText("regions_sengia_redstone.resolveRedstoneCivicIssue.008"));
 C.history.push({day:state.world.day,locId,title:q.title,choice,side});C.history=C.history.slice(-50);recordWorldHistory(`${worldLocation(locId).name}: ${q.title} — ${choice}.`,civilian?'good':'info',SOSText("regions_sengia_redstone.resolveRedstoneCivicIssue.009"));advanceWorldDays(1,SOSText("regions_sengia_redstone.resolveRedstoneCivicIssue.010",q.title));save();actionResult(q.title,SOSText("regions_sengia_redstone.resolveRedstoneCivicIssue.011",choice),'good',()=>showRedstoneCivicLife(locId))
}
function showRedstoneCivicDecision(locId){modalRouteEnter(SOSText("regions_sengia_redstone.showRedstoneCivicDecision.001"),Array.from(arguments));
 const q=currentRedstoneCivicIssue(locId)||generateRedstoneCivicIssue(locId,true);if(!q)return showRedstoneCivicLife(locId);
 const policy=redstonePolicyNoticeHTML(locId);overlay(SOSText("regions_sengia_redstone.showRedstoneCivicDecision.002",esc(worldLocation(locId).name),esc(q.title),policy,esc(q.text),esc(q.a[0]),esc(q.b[0])),true);
 document.querySelectorAll('[data-redcivic]').forEach(b=>b.onclick=()=>resolveRedstoneCivicIssue(locId,b.dataset.redcivic));$('#redCivicBack').onclick=()=>showRedstoneCivicLife(locId)
}
function sengiaDistrictState(id){const C=redstoneCivicState();if(!C.districts[id])C.districts[id]={visits:0,lastVisitDay:0};return C.districts[id]}
function showSengiaDistrict(id){modalRouteEnter(SOSText("regions_sengia_redstone.showSengiaDistrict.001"),Array.from(arguments));
 const d=REDSTONE_CIVIC_DEFS.sengia.districts.find(x=>x.id===id);if(!d)return showRedstoneCivicLife('sengia');const D=sengiaDistrictState(id);
 const detail={oldmarket:SOSText("regions_sengia_redstone.showSengiaDistrict.002"),warehouse:SOSText("regions_sengia_redstone.showSengiaDistrict.003"),civic:SOSText("regions_sengia_redstone.showSengiaDistrict.004"),garrison:SOSText("regions_sengia_redstone.showSengiaDistrict.005")}[id];
 overlay(SOSText("regions_sengia_redstone.showSengiaDistrict.006",esc(d.name),esc(d.text),esc(detail),D.visits,esc(d.activity)),true);
 $('#sengiaDistrictSpend').onclick=()=>{advanceWorldDays(1,SOSText("regions_sengia_redstone.showSengiaDistrict.007",d.name));D.visits++;D.lastVisitDay=state.world.day;if(id==='warehouse')observeMarket('sengia');if(id==='oldmarket')settlementState('sengia').prosperity=Math.min(100,settlementState('sengia').prosperity+1);if(id==='civic')changeLocalReputation('sengia',1,SOSText("regions_sengia_redstone.showSengiaDistrict.008"));if(id==='garrison')gainScouting(1);save();actionResult(d.name,SOSText("regions_sengia_redstone.showSengiaDistrict.009",d.activity),'good',()=>showSengiaDistrict(id))};$('#sengiaDistrictBack').onclick=()=>showRedstoneCivicLife('sengia')
}
function redstoneInstitutionEffects(locId){
 const pol=redstonePolicyNotices(locId),out=[];
 if(locId==='lockwood'){out.push(SOSText("regions_sengia_redstone.redstoneInstitutionEffects.001",(factionPresenceAt(locId).Independent||0),(factionPresenceAt(locId).Redstone||0)))}
 if(locId==='briarlake'){out.push(SOSText("regions_sengia_redstone.redstoneInstitutionEffects.002",tradeStock(locId,'food'),settlementState(locId).prosperity))}
 if(locId==='glenbrook'&&pol.length)out.push(SOSText("regions_sengia_redstone.redstoneInstitutionEffects.003"));
 if(locId==='pyreglade'&&pol.length)out.push(SOSText("regions_sengia_redstone.redstoneInstitutionEffects.004"));
 return out
}
function showRedstoneCivicLife(locId=state.world.location){modalRouteEnter(SOSText("regions_sengia_redstone.showRedstoneCivicLife.001"),Array.from(arguments));
 const d=REDSTONE_CIVIC_DEFS[locId];if(!d)return showTownLife(locId);if(!currentRedstoneCivicIssue(locId)&&chance(.55))generateRedstoneCivicIssue(locId);
 const q=currentRedstoneCivicIssue(locId),effects=redstoneInstitutionEffects(locId);
 overlay(SOSText("regions_sengia_redstone.showRedstoneCivicLife.002",esc(worldLocation(locId).name),esc(d.summary),redstonePolicyNoticeHTML(locId),sengiaConsequenceSummaryHTML(),sengiaEconomyHTML(locId),sengiaSecurityHTML(locId),locId==='sengia'?'<button id="redstoneRegionalOutcome">Sengia Regional Consequences</button>':'',d.institutions.map(x=>`<span>${esc(x)}</span>`).join(''),settlementNpcsPresent(locId).filter(n=>n.home===locId).slice(0,5).map(n=>`<button data-civicnpc="${n.id}"><b>${esc(n.name)}</b><small>${esc(n.role)}</small></button>`).join(''),effects.length?`<div class="notice compact">${effects.map(esc).join('<br>')}</div>`:'',locId==='sengia'?`<h3>Sengia Districts</h3><div class="choice-list">${d.districts.map(x=>`<button data-sengiadistrict="${x.id}"><b>${esc(x.name)}</b><br><small>${esc(x.text)}</small></button>`).join('')}</div>`:'',redstoneCivicIssueHTML(locId),redstoneCivicState().history.filter(x=>x.locId===locId).slice(-5).reverse().map(x=>`<div class="card compact"><b>Day ${x.day}: ${esc(x.title)}</b><br>${esc(x.choice)}</div>`).join('')||'<p class="muted">No major decision has been recorded here yet.</p>'),true);
 document.querySelectorAll('[data-sengiadistrict]').forEach(b=>b.onclick=()=>showSengiaDistrict(b.dataset.sengiadistrict));document.querySelectorAll('[data-civicnpc]').forEach(b=>b.onclick=()=>showSettlementNPCConversation(locId,b.dataset.civicnpc));$('#redstoneAuthority').onclick=()=>showSengiaAuthority(locId);$('#redstoneEconomy').onclick=()=>showSengiaEconomy(locId);$('#redstoneSecurity').onclick=()=>showSengiaSecurity(locId);if($('#redstoneRegionalOutcome'))$('#redstoneRegionalOutcome').onclick=showSengiaRegionalConsequences;if($('#redstoneCivicIssue'))$('#redstoneCivicIssue').onclick=()=>showRedstoneCivicDecision(locId);$('#redstoneCivicBack').onclick=()=>showTownLife(locId)
}
function redstoneCivicDailyTick(){
 if(!isOpenWorld()||!(state.world.unlockedRegions||[]).includes('redstone'))return;const C=redstoneCivicState();if(C.lastTickDay===state.world.day)return;C.lastTickDay=state.world.day;
 for(const id of Object.keys(REDSTONE_CIVIC_ISSUES)){const q=C.issues[id];if(q?.status==='active'&&q.expiresDay<state.world.day){q.status='expired';q.resolvedDay=state.world.day;C.history.push({day:state.world.day,locId:id,title:q.title,choice:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.001"),side:'none'})}else if(!currentRedstoneCivicIssue(id)&&chance(.14))generateRedstoneCivicIssue(id)}
 C.history=C.history.slice(-50)
}
const SETTLEMENT_NPCS={
 shantium:[
  {id:'hobb',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.002"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.003")},{id:'sera',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.004"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.005")},{id:'pell',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.006"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.007")},{id:'ilwen',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.008"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.009")},
  {id:'sh_healer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.010"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.011")},{id:'sh_watch',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.012"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.013")},
  {id:'sh_baker',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.014"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.015")},{id:'sh_carpenter',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.016"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.017")},{id:'sh_teacher',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.018"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.019")},{id:'sh_porter',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.020"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.021")}
 ],
 river:[
  {id:'river_ferryman',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.022"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.023")},{id:'river_trader',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.024"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.025")},
  {id:'river_healer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.026"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.027")},{id:'river_host',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.028"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.029")},
  {id:'river_boatwright',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.030"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.031")},{id:'river_fisher',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.032"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.033")}
 ],
 stonebridge:[
  {id:'stone_factor',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.034"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.035")},{id:'stone_host',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.036"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.037")},
  {id:'stone_guard',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.038"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.039")},{id:'stone_broker',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.040"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.041")},
  {id:'stone_wheeler',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.042"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.043")},{id:'stone_cook',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.044"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.045")}
 ],
 northgate:[
  {id:'north_sergeant',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.046"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.047")},{id:'north_clerk',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.048"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.049")},
  {id:'north_healer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.050"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.051")},{id:'north_scout',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.052"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.053")},
  {id:'north_farrier',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.054"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.055")},{id:'north_runner2',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.056"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.057")}
 ],
 southroad:[
  {id:'south_runner',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.058"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.059")},{id:'south_host',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.060"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.061")},
  {id:'south_trader',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.062"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.063")},{id:'south_guard',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.064"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.065")},
  {id:'south_mender',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.066"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.067")},{id:'south_cook',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.068"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.069")}
 ],
 redoubt:[
  {id:'red_captain',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.070"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.071")},{id:'red_quarter',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.072"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.073")},
  {id:'red_healer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.074"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.075")},{id:'red_clerk',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.076"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.077")},
  {id:'red_engineer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.078"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.079")},{id:'red_supplier',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.080"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.081")}
 ],
 zion:[{id:'zion_warden',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.082"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.083")},{id:'zion_host',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.084"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.085")},{id:'zion_healer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.086"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.087")},{id:'zion_merchant',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.088"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.089")},{id:'zion_scout',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.090"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.091")},{id:'zion_mason',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.092"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.093")},{id:'zion_councilor',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.094"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.095")},{id:'zion_cistern',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.096"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.097")},{id:'zion_packer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.098"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.099")},{id:'zion_coalition',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.100"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.101")}],
 lowcreek:[{id:'low_warden',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.102"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.103")},{id:'low_host',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.104"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.105")},{id:'low_trader',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.106"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.107")},{id:'low_guide',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.108"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.109")},{id:'low_bridge',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.110"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.111")},{id:'low_mule',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.112"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.113")},{id:'low_council',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.114"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.115")}],
 ebonheart:[{id:'ebon_warden',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.116"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.117")},{id:'ebon_smith',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.118"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.119")},{id:'ebon_host',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.120"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.121")},{id:'ebon_runner',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.122"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.123")},{id:'ebon_council',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.124"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.125")},{id:'ebon_spring',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.126"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.127")},{id:'ebon_wood',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.128"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.129")}],
 norwegian:[{id:'nor_speaker',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.130"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.131")},{id:'nor_miller',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.132"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.133")},{id:'nor_healer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.134"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.135")},{id:'nor_trader',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.136"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.137")},{id:'nor_farmer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.138"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.139")},{id:'nor_irrigator',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.140"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.141")},{id:'nor_liaison',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.142"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.143")},{id:'nor_hamlet',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.144"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.145")}],
 winterstone:[{id:'winter_overseer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.146"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.147")},{id:'winter_healer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.148"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.149")},{id:'winter_factor',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.150"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.151")},{id:'winter_guard',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.152"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.153")},{id:'winter_guild',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.154"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.155")},{id:'winter_rigger',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.156"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.157")},{id:'winter_tool',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.158"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.159")}],
 skybreak:[{id:'sky_captain',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.160"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.161")},{id:'sky_quarter',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.162"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.163")},{id:'sky_signal',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.164"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.165")},{id:'sky_scout',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.166"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.167")},{id:'sky_cook',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.168"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.169")}],
 sengia:[{id:'sen_warden',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.170"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.171")},{id:'sen_factor',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.172"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.173")},{id:'sen_host',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.174"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.175")},{id:'sen_healer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.176"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.177")},{id:'sen_clerk',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.178"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.179")},{id:'sen_teamster',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.180"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.181")},{id:'sen_merchant',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.182"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.183")},{id:'sen_mason',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.184"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.185")},{id:'sen_teacher',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.186"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.187")},{id:'sen_veteran',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.188"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.189")},{id:'sen_baker',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.190"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.191")},{id:'sen_petitioner',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.192"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.193")}],
 lockwood:[{id:'lock_speaker',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.194"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.195")},{id:'lock_garrison',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.196"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.197")},{id:'lock_timber',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.198"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.199")},{id:'lock_resin',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.200"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.201")},{id:'lock_carver',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.202"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.203")},{id:'lock_host',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.204"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.205")},{id:'lock_healer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.206"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.207")},{id:'lock_hunter',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.208"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.209")},{id:'lock_teacher',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.210"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.211")},{id:'lock_veteran',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.212"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.213")}],
 grayhaven:[{id:'gray_council',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.214"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.215")},{id:'gray_officer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.216"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.217")},{id:'gray_wheeler',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.218"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.219")},{id:'gray_host',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.220"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.221")},{id:'gray_scout',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.222"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.223")},{id:'gray_teamster',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.224"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.225")},{id:'gray_veteran',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.226"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.227")},{id:'gray_cook',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.228"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.229")}],
 briarlake:[{id:'briar_speaker',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.230"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.231")},{id:'briar_farmer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.232"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.233")},{id:'briar_miller',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.234"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.235")},{id:'briar_fisher',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.236"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.237")},{id:'briar_watch',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.238"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.239")},{id:'briar_healer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.240"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.241")},{id:'briar_seed',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.242"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.243")},{id:'briar_boat',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.244"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.245")},{id:'briar_youth',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.246"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.247")}],
 glenbrook:[{id:'glen_speaker',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.248"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.249")},{id:'glen_well',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.250"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.251")},{id:'glen_mender',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.252"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.253")},{id:'glen_smith',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.254"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.255")},{id:'glen_route',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.256"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.257")},{id:'glen_host',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.258"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.259")},{id:'glen_midwife',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.260"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.261")},{id:'glen_carrier',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.262"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.263")},{id:'glen_veteran',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.264"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.265")}],
 tyrdon:[{id:'tyr_speaker',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.266"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.267")},{id:'tyr_water',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.268"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.269")},{id:'tyr_recruit',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.270"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.271")},{id:'tyr_smith',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.272"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.273")},{id:'tyr_clerk',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.274"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.275")},{id:'tyr_herder',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.276"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.277")},{id:'tyr_healer',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.278"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.279")},{id:'tyr_veteran',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.280"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.281")}],
 pyreglade:[{id:'pyre_speaker',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.282"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.283")},{id:'pyre_stable',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.284"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.285")},{id:'pyre_resin',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.286"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.287")},{id:'pyre_workshop',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.288"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.289")},{id:'pyre_watch',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.290"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.291")},{id:'pyre_fire',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.292"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.293")},{id:'pyre_farrier',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.294"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.295")},{id:'pyre_family',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.296"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.297")},{id:'pyre_veteran',name:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.298"),role:SOSText("regions_sengia_redstone.redstoneCivicDailyTick.299")}]
};
