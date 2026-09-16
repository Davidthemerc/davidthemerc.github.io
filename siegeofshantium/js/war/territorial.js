/* v1.6.66.4 — Sieges, Occupation & Territorial Warfare */
const WAR_TERRITORIAL_VERSION=1;
function warTerritorialState(){
 const W=ensureWarFoundation();
 if(!W.territorial||typeof W.territorial!=='object')W.territorial={version:WAR_TERRITORIAL_VERSION,lastTickDay:0,operations:[],occupations:[],history:[]};
 const T=W.territorial;T.version=WAR_TERRITORIAL_VERSION;
 if(!Array.isArray(T.operations))T.operations=[];if(!Array.isArray(T.occupations))T.occupations=[];if(!Array.isArray(T.history))T.history=[];
 return T
}
function warOccupationAt(locId){return warTerritorialState().occupations.find(o=>o.location===locId&&['occupying','consolidating'].includes(o.status))||null}
function warTerritorialOperationAt(locId,warId=null){return warTerritorialState().operations.find(o=>o.location===locId&&o.status==='active'&&(!warId||o.warId===warId))||null}
function warTerritorialTierDefense(locId){const L=worldLocation(locId),S=settlementState(locId),tier={outpost:12,village:18,town:28,city:42,metropolis:58}[L?.settlementTier]||22,fort=L?.type==='fort'?28:0;return Math.round(tier+fort+(S.security||50)*.55)}
function warTerritorialAttackingForces(C){const W=ensureWarFoundation();return (C?.formationIds||[]).map(id=>W.formations.find(F=>F.id===id)).filter(F=>F&&!['destroyed','disbanded'].includes(F.status)&&F.location===C.target&&!F.retreating)}
function warTerritorialAttackPower(forces){return forces.reduce((n,F)=>n+(F.strength||0)*(.55+(F.morale||50)/200)*(.65+(F.equipment||60)/180)*(.7+(F.readiness||50)/200),0)}
function warTerritorialShouldSiege(locId){const L=worldLocation(locId),S=settlementState(locId);return L?.type==='fort'||['city','metropolis'].includes(L?.settlementTier)||(S.security||0)>=68}
function warTerritorialBeginOperation(w,C){
 if(!w||!C||!['capture','recapture','liberate'].includes(C.objective)||!C.target)return null;
 const existing=warTerritorialOperationAt(C.target,w.id);if(existing)return existing;
 const control=settlementControl(C.target);if(control===C.faction||!warEnemiesForFaction(w,C.faction).includes(control))return null;
 const forces=warTerritorialAttackingForces(C);if(!forces.length||activeWarBattles().some(B=>B.status==='active'&&B.location===C.target))return null;
 const siege=warTerritorialShouldSiege(C.target),defense=warTerritorialTierDefense(C.target);
 const O={id:`wto_${state.world.day}_${uid().slice(0,6)}`,warId:w.id,campaignId:C.id,attackerFaction:C.faction,defenderFaction:control,location:C.target,status:'active',stage:'approach',startedDay:state.world.day,lastTickDay:state.world.day,progress:0,defense,initialDefense:defense,mode:siege?'siege':'assault',losses:{attacker:0,defender:0},breach:0};
 warTerritorialState().operations.push(O);C.phase='approach';C.progress=Math.max(C.progress||0,78);
 for(const F of forces){F.status='holding';F.destination=null;F.routeStep=null}
 ensureWarFoundation().history.push({day:state.world.day,type:'territorial_operation',warId:w.id,campaignId:C.id,text:`${majorFaction(C.faction).short} begins operations against ${worldLocation(C.target)?.name||C.target}.`});
 return O
}
function warTerritorialApplyAttackerLosses(O,forces,loss){
 let remaining=Math.max(0,Math.round(loss)),total=forces.reduce((n,F)=>n+(F.strength||0),0);if(!remaining||!total)return 0;
 let applied=0;for(let i=0;i<forces.length;i++){const F=forces[i],share=i===forces.length-1?remaining:Math.min(remaining,Math.round(loss*(F.strength||0)/total));remaining-=share;if(!share)continue;const L=warBattleDistributeLosses(F,share);warBattleReduceComposition(F,L);applied+=L.dead+L.wounded+L.missing+L.captured;F.morale=clamp((F.morale||50)-Math.max(1,share/Math.max(1,F.maxStrength||1)*24),0,100);F.fatigue=clamp((F.fatigue||0)+3,0,100);if(F.strength<=0){F.status='destroyed';F.destroyedDay=state.world.day}}
 O.losses.attacker+=applied;return applied
}
function warTerritorialCapture(O,w,C,forces){
 const T=warTerritorialState(),locId=O.location,S=settlementState(locId),old=settlementControl(locId),ps=politicalSettlement(locId),rr=roadRights(locId);
 S.control=O.attackerFaction;S.security=clamp((S.security||50)-10,12,100);S.prosperity=clamp((S.prosperity||50)-4,8,100);
 ps.pending=null;ps.alignment=O.attackerFaction;ps.lastShiftDay=state.world.day;ps.transitionUntilDay=state.world.day+8;ps.alignmentHistory.push({day:state.world.day,from:old,to:O.attackerFaction,reason:'Military occupation after wartime capture'});ps.lean[O.attackerFaction]=Math.max(ps.lean[O.attackerFaction]||0,4);
 rr.controller=O.attackerFaction;rr.openness=Math.max(2,Math.min(rr.openness??7,4));rr.lastChangeDay=state.world.day;
 for(const [f,loss] of [[O.attackerFaction,O.losses.attacker||0],[O.defenderFaction,O.losses.defender||0]]){if(!loss||!f)continue;w.casualties[f]=(w.casualties[f]||0)+loss;const M=warMilitaryState(f);M.casualties=(M.casualties||0)+loss;M.exhaustion=clamp((M.exhaustion||0)+loss*.025,0,100);w.exhaustion[f]=clamp((w.exhaustion[f]||0)+loss*.02,0,100)}
 O.status='captured';O.stage='occupation';O.capturedDay=state.world.day;O.progress=100;
 const resistance=clamp(Math.round(62+(S.security||50)*.25+(ps.autonomy||5)*2-warTerritorialAttackPower(forces)/18),18,88);
 const occ={id:`occ_${state.world.day}_${uid().slice(0,6)}`,warId:w.id,campaignId:C.id,location:locId,attackerFaction:O.attackerFaction,formerController:old,status:'occupying',startedDay:state.world.day,lastTickDay:state.world.day-1,consolidation:0,resistance,garrisonFormationIds:forces.map(F=>F.id),incidents:0};T.occupations.push(occ);
 for(const F of forces){F.status='occupying';F.destination=null;F.routeStep=null;F.lastActionDay=state.world.day}
 C.phase='occupation';C.status='active';C.progress=90;C.lastProgressDay=state.world.day;
 if(!Array.isArray(w.occupiedSettlements))w.occupiedSettlements=[];w.occupiedSettlements.push({location:locId,attackerFaction:O.attackerFaction,formerController:old,day:state.world.day,status:'occupied'});w.occupiedSettlements=w.occupiedSettlements.slice(-40);w.lastMajorEventDay=state.world.day;
 T.history.push({day:state.world.day,type:'capture',location:locId,faction:O.attackerFaction,text:`${majorFaction(O.attackerFaction).short} captures ${worldLocation(locId)?.name||locId}.`});
 recordWorldHistory(`${majorFaction(O.attackerFaction).short} captures ${worldLocation(locId)?.name||locId} and establishes a military occupation.`,'bad','war');
 if(typeof recordWorldNews==='function')recordWorldNews(`${worldLocation(locId)?.name||locId} falls to ${majorFaction(O.attackerFaction).short}. Occupation forces begin consolidating control.`,'bad')
}
function warTerritorialResolveOperation(O){
 if(O.status!=='active'||O.lastTickDay===state.world.day)return;O.lastTickDay=state.world.day;
 const W=ensureWarFoundation(),w=W.wars.find(x=>x.id===O.warId),C=w?.campaigns?.find(x=>x.id===O.campaignId);if(!w||!C){O.status='cancelled';return}
 const forces=warTerritorialAttackingForces(C).filter(F=>F.strength>0);if(!forces.length){O.status='failed';O.stage='withdrawn';C.status='stalled';C.phase='regrouping';return}
 if(activeWarBattles().some(B=>B.status==='active'&&B.location===O.location))return;
 if(O.stage==='approach'){O.stage=O.mode==='siege'?'siege':'assault';C.phase=O.stage;O.progress=5;return}
 const power=warTerritorialAttackPower(forces),def=Math.max(10,O.defense||10),S=settlementState(O.location),ratio=power/def;
 const gain=O.mode==='siege'?clamp(Math.round(7+ratio*8+rnd(-2,3)),5,24):clamp(Math.round(14+ratio*11+rnd(-3,4)),8,34);
 O.progress=clamp((O.progress||0)+gain,0,100);O.breach=clamp((O.breach||0)+(O.mode==='siege'?gain*.7:gain*.4),0,100);
 const attackerLoss=Math.max(0,Math.round(forces.reduce((n,F)=>n+(F.strength||0),0)*(O.mode==='siege'?.006:.014)*clamp(def/Math.max(1,power),.55,1.8)));
 warTerritorialApplyAttackerLosses(O,forces,attackerLoss);O.losses.defender+=Math.max(1,Math.round(gain*.45));O.defense=Math.max(5,O.defense-Math.max(1,Math.round(gain*.22)));S.security=clamp((S.security||50)-(O.mode==='siege'?.8:1.5),10,100);S.prosperity=clamp((S.prosperity||50)-(O.mode==='siege'?.35:.65),8,100);
 C.progress=clamp(78+O.progress*.12,78,90);C.lastProgressDay=state.world.day;
 if(O.progress>=100||O.defense<=8)warTerritorialCapture(O,w,C,forces)
}
function warTerritorialBeginEligibleOperations(){for(const w of activeWars())for(const C of warCampaigns(w).filter(c=>c.status==='active'&&['capture','recapture','liberate'].includes(c.objective)&&['at_objective','post_battle','approach','siege','assault'].includes(c.phase))){if(settlementControl(C.target)===C.faction)continue;warTerritorialBeginOperation(w,C)}}
function warOccupationDailyTick(O){
 if(!['occupying','consolidating'].includes(O.status)||O.lastTickDay===state.world.day)return;O.lastTickDay=state.world.day;
 const W=ensureWarFoundation(),w=W.wars.find(x=>x.id===O.warId),C=w?.campaigns?.find(x=>x.id===O.campaignId),S=settlementState(O.location),ps=politicalSettlement(O.location);
 if(settlementControl(O.location)!==O.attackerFaction){O.status='ended';O.endedDay=state.world.day;return}
 ps.pending=null;ps.transitionUntilDay=Math.max(ps.transitionUntilDay||0,state.world.day+2);
 let forces=(O.garrisonFormationIds||[]).map(id=>W.formations.find(F=>F.id===id)).filter(F=>F&&!['destroyed','disbanded'].includes(F.status)&&F.location===O.location);
 const strength=forces.reduce((n,F)=>n+(F.strength||0),0),quality=forces.length?forces.reduce((n,F)=>n+(F.morale||50)+(F.readiness||50),0)/(forces.length*2):25;
 const hostileHolding=warActiveFormations().find(F=>F.location===O.location&&F.faction===O.formerController&&!F.retreating&&!['destroyed','disbanded','engaged'].includes(F.status));
 if(hostileHolding||!strength){O.unguardedDays=(O.unguardedDays||0)+1;O.consolidation=Math.max(0,(O.consolidation||0)-8);O.resistance=clamp((O.resistance||50)+4,0,100);if(hostileHolding||O.unguardedDays>=2){const old=settlementControl(O.location);S.control=O.formerController;ps.alignment=O.formerController;ps.pending=null;ps.lastShiftDay=state.world.day;ps.transitionUntilDay=state.world.day+6;roadRights(O.location).controller=O.formerController;roadRights(O.location).openness=Math.max(3,roadRights(O.location).openness??4);O.status='ended';O.endedDay=state.world.day;O.endReason='occupation_collapsed';if(C){C.status='failed';C.phase='occupation_lost';C.completedDay=state.world.day}const rec=(w?.occupiedSettlements||[]).slice().reverse().find(x=>x.location===O.location&&x.attackerFaction===O.attackerFaction&&x.status==='occupied');if(rec){rec.status='liberated';rec.liberatedDay=state.world.day}recordWorldHistory(`${worldLocation(O.location)?.name||O.location} is liberated from ${majorFaction(O.attackerFaction).short} occupation and returns to ${majorFaction(O.formerController).short} control.`,'good','war');return}}else O.unguardedDays=0;
 const controlGain=clamp(Math.round(4+strength/45+quality/30-(O.resistance||50)/30+rnd(-1,2)),1,12);O.consolidation=clamp((O.consolidation||0)+controlGain,0,100);O.resistance=clamp((O.resistance||50)-Math.max(1,Math.round(controlGain*.35)),0,100);
 if(chance(Math.max(.015,(O.resistance||0)/900))){O.incidents=(O.incidents||0)+1;S.security=clamp((S.security||50)-rnd(1,3),10,100);if(forces.length&&chance(.45))warTerritorialApplyAttackerLosses({losses:{attacker:0}},forces,1)}
 else S.security=clamp((S.security||50)+.35,10,100);
 if(O.consolidation>=100){O.status='consolidated';O.consolidatedDay=state.world.day;S.security=clamp((S.security||50)+4,10,100);ps.transitionUntilDay=state.world.day+6;if(C){C.status='completed';C.phase='consolidated';C.progress=100;C.completedDay=state.world.day}for(const F of forces){F.status='holding';F.campaignId=null;F.morale=clamp((F.morale||50)+2,0,100)}const rec=(w?.occupiedSettlements||[]).slice().reverse().find(x=>x.location===O.location&&x.attackerFaction===O.attackerFaction&&x.status==='occupied');if(rec){rec.status='consolidated';rec.consolidatedDay=state.world.day}warTerritorialState().history.push({day:state.world.day,type:'consolidated',location:O.location,faction:O.attackerFaction,text:`${majorFaction(O.attackerFaction).short} consolidates its occupation of ${worldLocation(O.location)?.name||O.location}.`});recordWorldHistory(`${majorFaction(O.attackerFaction).short} consolidates military control of ${worldLocation(O.location)?.name||O.location}.`,'bad','war')}
}
function warTerritorialDailyTick(){const T=warTerritorialState();if(T.lastTickDay===state.world.day)return;T.lastTickDay=state.world.day;warTerritorialBeginEligibleOperations();for(const O of T.operations.filter(x=>x.status==='active'))warTerritorialResolveOperation(O);for(const O of T.occupations.filter(x=>['occupying','consolidating'].includes(x.status)))warOccupationDailyTick(O);T.operations=T.operations.filter(x=>x.status==='active'||state.world.day-(x.capturedDay||x.startedDay||state.world.day)<60).slice(-80);T.occupations=T.occupations.filter(x=>['occupying','consolidating'].includes(x.status)||state.world.day-(x.consolidatedDay||x.endedDay||x.startedDay||state.world.day)<90).slice(-80);T.history=T.history.slice(-100)}
const __warStrategicDailyTickTerritorial=warStrategicDailyTick;warStrategicDailyTick=function(){const out=__warStrategicDailyTickTerritorial.apply(this,arguments),perf=(n,fn)=>typeof sosPerfRun==='function'?sosPerfRun(n,fn):fn();const T=warTerritorialState();if(T.lastTickDay!==state.world.day){T.lastTickDay=state.world.day;perf('War — Territorial Operations',()=>{warTerritorialBeginEligibleOperations();for(const O of T.operations.filter(x=>x.status==='active'))warTerritorialResolveOperation(O)});perf('War — Occupation & Consolidation',()=>{for(const O of T.occupations.filter(x=>['occupying','consolidating'].includes(x.status)))warOccupationDailyTick(O)});T.operations=T.operations.filter(x=>x.status==='active'||state.world.day-(x.capturedDay||x.startedDay||state.world.day)<60).slice(-80);T.occupations=T.occupations.filter(x=>['occupying','consolidating'].includes(x.status)||state.world.day-(x.consolidatedDay||x.endedDay||x.startedDay||state.world.day)<90).slice(-80);T.history=T.history.slice(-100)}return out};
const __evaluatePoliticalShiftTerritorial=evaluatePoliticalShift;evaluatePoliticalShift=function(locId){if(warOccupationAt(locId))return;return __evaluatePoliticalShiftTerritorial.apply(this,arguments)};
function warTerritorialCard(O){const loc=worldLocation(O.location)?.name||O.location;if(O.consolidation!=null)return `<div class="card compact"><div class="stat-row"><span><b>${esc(loc)}</b></span><b>${Math.round(O.consolidation||0)}% consolidated</b></div>${esc(majorFaction(O.attackerFaction).short)} occupation • resistance ${Math.round(O.resistance||0)}%<br><small>Occupation began Day ${O.startedDay}${O.incidents?` • ${O.incidents} resistance incident${O.incidents===1?'':'s'}`:''}</small></div>`;return `<div class="warning notice compact"><div class="stat-row"><span><b>${esc(loc)}</b></span><b>${esc((O.stage||O.mode).replaceAll('_',' '))}</b></div>${esc(majorFaction(O.attackerFaction).short)} attacking ${esc(majorFaction(O.defenderFaction).short)} • ${Math.round(O.progress||0)}% progress<br><small>${O.mode==='siege'?'Siege':'Assault'} • defensive strength ${Math.round(O.defense||0)} • attacker losses ${fmt(O.losses?.attacker||0)}</small></div>`}
const __showWarOverviewTerritorial=showWarOverview;showWarOverview=function(){const r=__showWarOverviewTerritorial.apply(this,arguments),dlg=document.querySelector('.dialog');if(!dlg)return r;const T=warTerritorialState(),ops=T.operations.filter(x=>x.status==='active'),occs=T.occupations.filter(x=>['occupying','consolidating'].includes(x.status));const before=[...dlg.querySelectorAll('h3')].find(h=>h.textContent==='Military Balance');if(before){const wrap=document.createElement('div');wrap.innerHTML=`<h3>Territorial Warfare</h3>${ops.map(warTerritorialCard).join('')||'<p class="muted">No settlement is currently under assault or siege.</p>'}<h3>Military Occupations</h3>${occs.map(warTerritorialCard).join('')||'<p class="muted">No active military occupations.</p>'}`;while(wrap.firstChild)dlg.insertBefore(wrap.firstChild,before)}return r};
