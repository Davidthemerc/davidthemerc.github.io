'use strict';
const WAR_CIVILIAN_VERSION=1;
function warCivilianState(){
 const W=ensureWarFoundation();
 if(!W.civilians||typeof W.civilians!=='object')W.civilians={version:WAR_CIVILIAN_VERSION,settlements:{},history:[],refugeeParties:[],lastTickDay:0};
 const C=W.civilians;C.version=WAR_CIVILIAN_VERSION;if(!C.settlements)C.settlements={};if(!Array.isArray(C.history))C.history=[];if(!Array.isArray(C.refugeeParties))C.refugeeParties=[];return C
}
function warCivilianSettlement(locId){
 const C=warCivilianState();
 return C.settlements[locId]||(C.settlements[locId]={location:locId,displaced:0,wounded:0,shortage:0,crime:0,damage:0,grievance:0,refugeesDeparted:0,refugeesReceived:0,lastImpactDay:0,lastRefugeeDay:-99,lastRecoveryDay:0,status:'stable'})
}
function warCivilianEligibleSettlement(locId){return !!(locId&&state.world?.settlements?.[locId]&&worldLocation(locId))}
function warCivilianTierPopulation(locId){
 const tier=typeof settlementTier==='function'?settlementTier(worldLocation(locId)):'town';
 return {outpost:180,village:420,town:1100,city:3200,metropolis:7800}[tier]||900
}
function warCivilianRecord(locId,type,text,severity='info',amount=0){
 const C=warCivilianState(),e={day:state.world.day,location:locId,type,text,severity,amount};C.history.push(e);C.history=C.history.slice(-140);
 if(typeof addSettlementEvidence==='function'&&warCivilianEligibleSettlement(locId))addSettlementEvidence(locId,text,severity==='bad'?'bad':severity==='good'?'good':'info',5);
 return e
}
function warCivilianActiveBattleAt(locId){return typeof activeWarBattles==='function'?activeWarBattles().find(B=>B.status==='active'&&B.location===locId):null}
function warCivilianOperationAt(locId){const T=typeof warTerritorialState==='function'?warTerritorialState():null;return T?.operations?.find(O=>O.status==='active'&&O.location===locId)||null}
function warCivilianOccupationAt(locId){return typeof warOccupationAt==='function'?warOccupationAt(locId):null}
function warCivilianSafeDestination(from){
 const originControl=typeof settlementControl==='function'?settlementControl(from):null,regions=state.world?.unlockedRegions||['shantium'];
 const pool=regions.flatMap(r=>typeof regionalSettlements==='function'?regionalSettlements(r):[]).filter(l=>l.id!==from&&warCivilianEligibleSettlement(l.id));
 if(!pool.length)return null;
 let best=null,bestScore=-1e9;
 for(const l of pool){const ss=settlementState(l.id),battle=warCivilianActiveBattleAt(l.id),op=warCivilianOperationAt(l.id),occ=warCivilianOccupationAt(l.id);if(battle||op)continue;let score=(ss.security||50)*1.25+(ss.prosperity||50)*.7-(occ?28:0);const ctrl=settlementControl(l.id);if(originControl&&ctrl===originControl)score+=18;try{score-=Math.max(0,worldTravelDays(from,l.id)-1)*3}catch(_){score-=12}if(score>bestScore){bestScore=score;best=l.id}}
 return best
}
function warSpawnRefugees(locId,reason='fighting'){
 if(!warCivilianEligibleSettlement(locId)||typeof spawnRegionalResponse!=='function')return null;const R=warCivilianSettlement(locId),C=warCivilianState();
 if(state.world.day-(R.lastRefugeeDay||-99)<4)return null;const activeWarRefugees=state.world.parties.filter(p=>p.warRefugees&&state.world.day-(p.createdDay||0)<24);if(activeWarRefugees.length>=6)return null;
 const dest=warCivilianSafeDestination(locId);if(!dest)return null;const size=clamp(Math.round(warCivilianTierPopulation(locId)*(.008+rnd(0,10)/1000)),6,90),name=`Displaced families from ${worldLocation(locId).name}`;
 const p=spawnRegionalResponse('refugees',locId,dest,name);if(!p)return null;p.warRefugees=true;p.warRefugeeOrigin=locId;p.warRefugeeReason=reason;p.civilianCount=size;p.purpose=`Fleeing ${reason} in ${worldLocation(locId).name}`;R.displaced+=size;R.refugeesDeparted+=size;R.lastRefugeeDay=state.world.day;C.refugeeParties.push({partyId:p.id,day:state.world.day,origin:locId,destination:dest,count:size,reason});C.refugeeParties=C.refugeeParties.slice(-80);
 if(typeof regionalThread==='function')regionalThread('displacement',locId,dest,`War refugees from ${worldLocation(locId).name}`,`${size} civilians leave ${worldLocation(locId).name} for ${worldLocation(dest).name} as ${reason} threatens local safety.`);
 if(typeof addRoutePressure==='function')addRoutePressure(locId,dest,Math.min(3,1+Math.floor(size/35)));
 warCivilianRecord(locId,'refugees',`${size} civilians flee toward ${worldLocation(dest).name} as ${reason} reaches ${worldLocation(locId).name}.`,'bad',size);return p
}
function warCivilianApplyImpact(locId,kind,intensity=1,faction=null){
 if(!warCivilianEligibleSettlement(locId))return;const R=warCivilianSettlement(locId),ss=settlementState(locId),pop=warCivilianTierPopulation(locId),i=clamp(Number(intensity)||1,.25,4);R.lastImpactDay=state.world.day;R.status=kind;
 const wound=Math.max(0,Math.round(pop*(kind==='battle'?.0009:kind==='assault'?.0012:kind==='siege'?.00035:kind==='occupation'?.00012:.00025)*i));R.wounded+=wound;
 R.damage=clamp(R.damage+(kind==='battle'?3.2:kind==='assault'?4.5:kind==='siege'?2.2:kind==='occupation'?.6:1.2)*i,0,100);R.shortage=clamp(R.shortage+(kind==='siege'?5:kind==='battle'?3.5:kind==='assault'?3:kind==='occupation'?1.5:2)*i,0,100);R.crime=clamp(R.crime+(kind==='occupation'?2.3:kind==='battle'?1.8:kind==='assault'?2.2:1)*i,0,100);R.grievance=clamp(R.grievance+(kind==='occupation'?2.4:kind==='assault'?2.7:kind==='battle'?2:1.2)*i,0,100);
 ss.prosperity=clamp((ss.prosperity||50)-(kind==='assault'?1.2:kind==='battle'?.8:kind==='siege'?.55:.25)*i,0,100);ss.security=clamp((ss.security||50)-(kind==='assault'?1.4:kind==='battle'?1:kind==='occupation'?.45:.6)*i,0,100);
 state.world.marketShock=state.world.marketShock||{};state.world.marketShock[locId]=clamp((state.world.marketShock[locId]||0)+.015*i,0,.5);
 if(typeof changeTradeStock==='function'){if(chance(.55))changeTradeStock(locId,'food',-1);if((kind==='battle'||kind==='assault')&&chance(.28))changeTradeStock(locId,'medicine',-1)}
 if(!settlementProblem(locId)){if(R.shortage>=34&&chance(.28))createSettlementProblem(locId,'shortage');else if(kind==='occupation'&&R.grievance>=35&&chance(.22))createSettlementProblem(locId,'occupation_tension')}
 const flightChance=clamp((kind==='assault'?.26:kind==='battle'?.18:kind==='siege'?.12:kind==='occupation'?.07:.05)*i,0,.58);if(chance(flightChance))warSpawnRefugees(locId,kind==='occupation'?'military occupation':kind)
}
function warCivilianImpactTick(){
 const seen=new Set();
 if(typeof activeWarBattles==='function')for(const B of activeWarBattles()){if(!warCivilianEligibleSettlement(B.location))continue;const total=(B.sides||[]).flat().map(id=>ensureWarFoundation().formations.find(F=>F.id===id)?.strength||0).reduce((a,b)=>a+b,0);warCivilianApplyImpact(B.location,'battle',clamp(total/180,.6,2.2));seen.add(B.location)}
 const T=typeof warTerritorialState==='function'?warTerritorialState():null;
 for(const O of T?.operations||[]){if(O.status!=='active'||!warCivilianEligibleSettlement(O.location))continue;warCivilianApplyImpact(O.location,O.mode==='siege'?'siege':'assault',clamp((O.defense||40)/55,.7,2));seen.add(O.location)}
 for(const O of T?.occupations||[]){if(!['occupying','consolidating'].includes(O.status)||!warCivilianEligibleSettlement(O.location))continue;warCivilianApplyImpact(O.location,'occupation',clamp((O.resistance||40)/55,.45,1.7),O.attackerFaction);seen.add(O.location)}
 return seen
}
function warCivilianRefugeeArrivalTick(){
 const C=warCivilianState();for(const rec of C.refugeeParties){if(rec.arrivedDay||!rec.partyId)continue;const p=state.world.parties.find(x=>x.id===rec.partyId);if(p&&p.location===rec.destination){rec.arrivedDay=state.world.day;const R=warCivilianSettlement(rec.destination);R.refugeesReceived+=rec.count||0;R.shortage=clamp(R.shortage+Math.min(12,(rec.count||0)/12),0,100);if(!settlementProblem(rec.destination)&&R.refugeesReceived>=18&&chance(.35))createSettlementProblem(rec.destination,'refugee_load');warCivilianRecord(rec.destination,'arrival',`${rec.count||'Displaced'} civilians from ${worldLocation(rec.origin)?.name||rec.origin} reach ${worldLocation(rec.destination)?.name||rec.destination}.`,'info',rec.count||0)}}
}
function warCivilianRecoveryTick(active){
 const C=warCivilianState();for(const [locId,R] of Object.entries(C.settlements)){if(active.has(locId))continue;const quiet=state.world.day-(R.lastImpactDay||0);if(quiet<2)continue;R.lastRecoveryDay=state.world.day;const ss=settlementState(locId),med=typeof tradeStock==='function'?tradeStock(locId,'medicine'):2,food=typeof tradeStock==='function'?tradeStock(locId,'food'):2;const care=Math.max(1,Math.min(4,1+Math.floor((med||0)/3)));R.wounded=Math.max(0,R.wounded-care);R.shortage=clamp(R.shortage-(food>1?1.4:.5),0,100);R.crime=clamp(R.crime-((ss.security||50)>=55?1.2:.45),0,100);R.damage=clamp(R.damage-((ss.prosperity||50)>=45?.7:.3),0,100);if(quiet>=8)R.grievance=clamp(R.grievance-.35,0,100);R.displaced=Math.max(0,R.displaced-(quiet>=10?1:0));if(R.damage<10&&R.shortage<10&&R.crime<10)R.status='recovering';if(R.damage<3&&R.shortage<3&&R.crime<3&&R.wounded===0)R.status='stable'}
}
function warCivilianDailyTick(){const C=warCivilianState();if(C.lastTickDay===state.world.day)return;C.lastTickDay=state.world.day;const active=warCivilianImpactTick();warCivilianRefugeeArrivalTick();warCivilianRecoveryTick(active);C.history=C.history.slice(-140);C.refugeeParties=C.refugeeParties.filter(x=>!x.arrivedDay||state.world.day-x.arrivedDay<45).slice(-80)}
const __warStrategicDailyTickCivilians=warStrategicDailyTick;warStrategicDailyTick=function(){const out=__warStrategicDailyTickCivilians.apply(this,arguments),perf=(n,fn)=>typeof sosPerfRun==='function'?sosPerfRun(n,fn):fn();perf('War — Civilian Impact',()=>warCivilianDailyTick());return out};
function warCivilianSummaryCard(locId,R){const loc=worldLocation(locId)?.name||locId,status=String(R.status||'stable').replaceAll('_',' ');return `<div class="card compact"><div class="stat-row"><span><b>${esc(loc)}</b></span><b>${esc(status)}</b></div><small>${fmt(Math.round(R.displaced||0))} displaced • ${fmt(Math.round(R.wounded||0))} civilian wounded • shortage ${Math.round(R.shortage||0)}% • crime pressure ${Math.round(R.crime||0)}%</small><br><small>Damage ${Math.round(R.damage||0)}% • grievance ${Math.round(R.grievance||0)}%${R.refugeesDeparted?` • ${fmt(R.refugeesDeparted)} fled`:''}${R.refugeesReceived?` • ${fmt(R.refugeesReceived)} received`:''}</small></div>`}
const __showWarOverviewCivilians=showWarOverview;showWarOverview=function(){const r=__showWarOverviewCivilians.apply(this,arguments),dlg=document.querySelector('.dialog');if(!dlg)return r;const C=warCivilianState(),rows=Object.entries(C.settlements).filter(([,x])=>(x.displaced||0)+(x.wounded||0)+(x.shortage||0)+(x.crime||0)+(x.damage||0)>4).sort((a,b)=>(b[1].lastImpactDay||0)-(a[1].lastImpactDay||0)).slice(0,12),recent=C.history.slice(-8).reverse();const before=[...dlg.querySelectorAll('h3')].find(h=>h.textContent==='Military Balance');if(before){const wrap=document.createElement('div');wrap.innerHTML=`<h3>Civilians & Displacement</h3>${rows.map(([id,x])=>warCivilianSummaryCard(id,x)).join('')||'<p class="muted">No major wartime civilian disruption is currently recorded.</p>'}${recent.length?`<details><summary>Recent civilian consequences</summary>${recent.map(e=>`<div class="card compact"><b>Day ${e.day} — ${esc(worldLocation(e.location)?.name||e.location)}</b><br><small>${esc(e.text)}</small></div>`).join('')}</details>`:''}`;while(wrap.firstChild)dlg.insertBefore(wrap.firstChild,before)}return r};
