function currentFactionPriority(faction){
 ensurePoliticalState();const day=state.world.day,bucket=Math.floor(day/4),saved=state.world.politics.factionPriorities[faction];
 if(saved?.bucket===bucket)return saved;
 const choices={
  Shantium:[['autonomy',SOSText("politics_control_incidents.currentFactionPriority.001")],['security',SOSText("politics_control_incidents.currentFactionPriority.002")],['trade',SOSText("politics_control_incidents.currentFactionPriority.003")]],
  Coalition:[['roads',SOSText("politics_control_incidents.currentFactionPriority.004")],['security',SOSText("politics_control_incidents.currentFactionPriority.005")],['alliances',SOSText("politics_control_incidents.currentFactionPriority.006")]],
  Redstone:[['security',SOSText("politics_control_incidents.currentFactionPriority.007")],['roads',SOSText("politics_control_incidents.currentFactionPriority.008")],['politics',SOSText("politics_control_incidents.currentFactionPriority.009")],['trade',SOSText("politics_control_incidents.currentFactionPriority.010")],['autonomy',SOSText("politics_control_incidents.currentFactionPriority.011")]],
  Independent:[['trade',SOSText("politics_control_incidents.currentFactionPriority.012")],['autonomy',SOSText("politics_control_incidents.currentFactionPriority.013")],['roads',SOSText("politics_control_incidents.currentFactionPriority.014")]],
  Bluestone:[['passes',SOSText("politics_control_incidents.currentFactionPriority.015")],['security',SOSText("politics_control_incidents.currentFactionPriority.016")],['trade',SOSText("politics_control_incidents.currentFactionPriority.017")],['intel',SOSText("politics_control_incidents.currentFactionPriority.018")]],
  Spawn:[['travel',SOSText("politics_control_incidents.currentFactionPriority.019")],['trade',SOSText("politics_control_incidents.currentFactionPriority.020")],['rights',SOSText("politics_control_incidents.currentFactionPriority.021")]],
  Mercenaries:[['contracts',SOSText("politics_control_incidents.currentFactionPriority.022")],['trade',SOSText("politics_control_incidents.currentFactionPriority.023")],['reputation',SOSText("politics_control_incidents.currentFactionPriority.024")]]
 };
 const [key,label]=pick(choices[faction]||[['politics',SOSText("politics_control_incidents.currentFactionPriority.025")]]),row={bucket,key,label,day};state.world.politics.factionPriorities[faction]=row;return row
}
function factionAgendaFit(faction,locId){
 const pr=currentFactionPriority(faction),ss=settlementState(locId),route=strongestTroubledRoute(locId),problem=settlementProblem(locId);let score=0;
 if(pr.key==='security'&&(ss.security<60||problem?.type==='raider_pressure'||problem?.type==='watch_shortage'))score+=2;
 if(['roads','travel','passes'].includes(pr.key)&&route?.pressure>=3)score+=2;
 if(pr.key==='trade'&&(ss.prosperity<60||problem?.type==='shortage'||problem?.type==='trade_slump'))score+=2;
 if(['autonomy','politics','alliances','rights','intel'].includes(pr.key))score+=1;
 if(pr.key==='contracts'&&(state.world.contracts[locId]?.length||0)>0)score+=1;
 return score
}
function politicalPowerSummary(locId,faction){
 const reasons=factionPowerReasons(locId,faction,3);return reasons.length?reasons.map(x=>`${FACTION_POWER_CHANNELS[x.channel]||x.channel}: ${x.reason}`).join(' • '):SOSText("politics_control_incidents.politicalPowerSummary.001")
}
function decayFactionPowerEvidence(){
 ensurePoliticalState();for(const locId of Object.keys(state.world.politics.powerEvidence))for(const faction of Object.keys(state.world.politics.powerEvidence[locId]))state.world.politics.powerEvidence[locId][faction]=activeFactionPowerEvidence(locId,faction)
}
let SOSPoliticalPressureReadCache=null;
function beginPoliticalPressureReadCache(){SOSPoliticalPressureReadCache={state,day:state.world.day,values:new Map(),locations:new Map(),profile:{shared:0,evidence:0,civic:0,math:0}}}
function endPoliticalPressureReadCache(){const p=SOSPoliticalPressureReadCache?.profile||null;SOSPoliticalPressureReadCache=null;return p}
function politicalPressure(locId,faction){
 const now=()=>typeof sosPerfNow==='function'?sosPerfNow():performance.now(),cache=SOSPoliticalPressureReadCache&&SOSPoliticalPressureReadCache.state===state&&SOSPoliticalPressureReadCache.day===state.world.day?SOSPoliticalPressureReadCache:null,key=`${locId}|${faction}`;if(cache?.values.has(key))return cache.values.get(key);let t=now();
 let shared=cache?.locations.get(locId);if(!shared){shared={ps:politicalSettlement(locId),presence:factionPresenceAt(locId),control:settlementControl(locId),security:settlementState(locId).security};if(cache)cache.locations.set(locId,shared)}if(cache)cache.profile.shared+=now()-t;const ps=shared.ps,presence=shared.presence[faction]||0,control=shared.control,standing=state.world.factionStanding[faction]||0,security=shared.security,lean=ps.lean[faction]||0;
 t=now();const evidence=factionPowerEvidenceScore(locId,faction);if(cache)cache.profile.evidence+=now()-t;t=now();const c=localPoliticalFactionState(locId,faction);if(cache)cache.profile.civic+=now()-t;t=now();let v=(presence||0)+(ps.pressure[faction]||0)+Math.round(evidence*.45)+Math.round(lean*.35)+c.organization*.45+c.security*.25+c.support*.12;if(control===faction)v+=3;if(standing>=8)v+=1;if(security<40)v+=1;v=Math.max(0,v);if(cache){cache.profile.math+=now()-t;cache.values.set(key,v)}return v
}
function addPoliticalPressure(locId,faction,amt=1,reason=''){
 const ps=politicalSettlement(locId);ps.pressure[faction]=clamp((ps.pressure[faction]||0)+amt,0,12);if(reason){recordFactionPower(locId,faction,'politics',amt,reason,7);politicalHistory(SOSText("politics_control_incidents.addPoliticalPressure.001",worldLocation(locId).name,majorFaction(faction).short,amt>0?'increases':'falls',reason),amt>=0?'info':'good')}
}
function politicalStatus(locId,perfStats=null){
 const now=()=>typeof sosPerfNow==='function'?sosPerfNow():performance.now();let t=now(),ps=politicalSettlement(locId),control=settlementControl(locId);if(perfStats)perfStats.statusPrep=(perfStats.statusPrep||0)+now()-t;
 t=now();const rows=Object.keys(OPEN_WORLD_FACTIONS).map(f=>[f,politicalPressure(locId,f)]);if(perfStats)perfStats.statusPressure=(perfStats.statusPressure||0)+now()-t;
 t=now();const ranked=rows.filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]),top=ranked[0]||[control,0],second=ranked[1]||[null,0],out={control,leader:ps.leader,style:ps.style,autonomy:ps.autonomy,topFaction:top[0],topPressure:top[1],secondFaction:second[0],secondPressure:second[1],contested:second[0]&&top[1]-second[1]<=2&&second[1]>=5,pending:ps.pending};if(perfStats)perfStats.statusRank=(perfStats.statusRank||0)+now()-t;return out
}
function politicalStatusLabel(locId){
 const s=politicalStatus(locId);if(s.pending)return SOSText("politics_control_incidents.politicalStatusLabel.001");if(s.contested)return SOSText("politics_control_incidents.politicalStatusLabel.002");if(s.topFaction!==s.control&&s.topPressure>=8)return SOSText("politics_control_incidents.politicalStatusLabel.003");if(s.autonomy>=8)return SOSText("politics_control_incidents.politicalStatusLabel.004");if(s.autonomy<=3)return SOSText("politics_control_incidents.politicalStatusLabel.005");return SOSText("politics_control_incidents.politicalStatusLabel.006")
}
function treatyKey(a,b){return factionPairKey(a,b)}
function treatyState(a,b){ensurePoliticalState();return state.world.politics.treaties[treatyKey(a,b)]||null}
function createTreaty(a,b,type='nonaggression',days=12){
 const k=treatyKey(a,b),label=type==='road_access'?'Road Access Accord':type==='trade'?'Trade Accord':SOSText("politics_control_incidents.createTreaty.001");
 state.world.politics.treaties[k]={a,b,type,label,startDay:state.world.day,expiresDay:state.world.day+days,status:'active'};adjustFactionRelation(a,b,1,`${label} signed`);politicalHistory(SOSText("politics_control_incidents.createTreaty.002",a,b,label),'good')
}
function activeTreaty(a,b){const t=treatyState(a,b);return t&&t.status==='active'&&t.expiresDay>=state.world.day?t:null}
function expireTreaties(){
 ensurePoliticalState();for(const t of Object.values(state.world.politics.treaties)){if(t.status==='active'&&state.world.day>t.expiresDay){t.status='expired';politicalHistory(SOSText("politics_control_incidents.expireTreaties.001",t.label,t.a,t.b),'info')}}
}
function factionsOpposedPolitically(a,b){const t=activeTreaty(a,b);if(t&&['nonaggression','road_access','trade'].includes(t.type))return false;return factionRelation(a,b)<=-4}
// v1.6.66.22.6 — Formal handovers use the same political contest the player can actually see and influence.
// `politicalPressure()` is a broad strategic-power score: it also counts physical faction presence,
// temporary evidence, civic organization and an incumbency bonus.  Using it as the handover vote/lead
// test let a heavily garrisoned incumbent silently veto a challenger that visibly led the political
// picture and the settlement's explicit pressure track.  Keep that strategic score for the rest of
// politics, but use the persistent settlement pressure track for control handovers.
function politicalHandoverMetrics(locId){
 const ps=politicalSettlement(locId),current=settlementControl(locId),visibleLead=localPoliticalLeader(locId),challenger=visibleLead?.faction||null;
 const rows=Object.keys(OPEN_WORLD_FACTIONS).map(f=>({f,pressure:Number(ps.pressure?.[f]||0)})).sort((a,b)=>b.pressure-a.pressure),pressureLead=rows[0]||{f:current,pressure:0},incumbentPressure=Number(ps.pressure?.[current]||0),autonomyMargin=Math.max(2,Math.round((ps.autonomy||0)/4));
 return{ps,current,visibleLead,challenger,pressureLead,incumbentPressure,autonomyMargin,challengerPressure:challenger?Number(ps.pressure?.[challenger]||0):0,lean:challenger?settlementLeanScore(locId,challenger):0}
}
function politicalHandoverQualification(locId,q){
 const status=politicalStatus(locId),m=politicalHandoverMetrics(locId),challenger=q?.challenger,expected=q?.current;
 if(!q||!challenger||!expected)return{qualified:false,status,reason:'missing handover state'};
 if(m.current!==expected)return{qualified:false,status,reason:'formal control changed'};
 if(m.visibleLead?.faction!==challenger)return{qualified:false,status,reason:'challenger no longer leads the visible political picture'};
 if(m.pressureLead.f!==challenger)return{qualified:false,status,reason:'challenger no longer leads settlement political pressure'};
 const qualified=m.challengerPressure>=10&&m.lean>=7&&m.challengerPressure>=m.incumbentPressure+m.autonomyMargin;
 return{qualified,status,defense:m.incumbentPressure+m.autonomyMargin,lean:m.lean,visibleLead:m.visibleLead,challengerPressure:m.challengerPressure,reason:qualified?'qualified':'handover thresholds no longer met'}
}
function cancelStalePoliticalHandover(locId,q,reason='the political lead no longer holds'){
 const ps=politicalSettlement(locId);if(!q||ps.pending?.id!==q.id)return false;
 politicalHistory(`${worldLocation(locId).name}: ${majorFaction(q.challenger).short} loses the sustained political lead; the threatened handover recedes (${reason}).`,'info');ps.pending=null;return true
}
// v1.6.66.22.4 — A pending handover is a world-state clock, not a regional-activity clock.
// Advance it at most once per world day wherever the Guardian happens to be.
function advancePoliticalHandoverClock(locId){
 const ps=politicalSettlement(locId),q=ps.pending;if(!q)return false;
 const check=politicalHandoverQualification(locId,q);
 if(!check.qualified)return cancelStalePoliticalHandover(locId,q,check.reason);
 if(q.guardianLastStand)return false;
 const today=state.world.day;
 // Mature-save repair: retain the original creation day and never count the same day twice.
 if(!Number.isFinite(q.createdDay))q.createdDay=today-Math.max(0,(q.sustainDays||1)-1);
 if(!Number.isFinite(q.lastQualifiedDay))q.lastQualifiedDay=q.createdDay;
 if(q.lastQualifiedDay<today){q.sustainDays=Math.max(1,q.sustainDays||1)+(today-q.lastQualifiedDay);q.lastQualifiedDay=today}
 if((q.sustainDays||1)>=(q.requiredDays||4)){
  if(guardianPoliticalLastStandEligible(locId,q.current))return queueGuardianPoliticalLastStand(locId,q);
  completeAutomaticPoliticalTransfer(locId,q);return true
 }
 return false
}
function guardianPoliticalLastStandEligible(locId,current){
 const e=typeof guardianPublicEndorsement==='function'?guardianPublicEndorsement():null;
 return !!(e?.faction===current&&state.world.location===locId);
}
function completeAutomaticPoliticalTransfer(locId,q,reason='sustained political lead'){
 const ps=politicalSettlement(locId),ss=settlementState(locId),challenger=q.challenger,current=q.current;
 ss.control=challenger;ps.alignmentHistory.push({day:state.world.day,from:current,to:challenger,reason});ps.alignment=challenger;ps.autonomy=Math.max(1,ps.autonomy-2);ps.lastShiftDay=state.world.day;ps.transitionUntilDay=state.world.day+8;
 const rr=roadRights(locId);rr.controller=challenger;rr.openness=Math.max(3,rr.openness-1);
 stabilizePoliticalTransfer(locId,current,challenger);const reopened=reopenProtectedPoliticalCases(locId,current,challenger);
 const text=`${worldLocation(locId).name} passes into ${majorFaction(challenger).short} political control after the faction sustains its local lead.${reopened.length?` ${reopened.length} protected case${reopened.length===1?' is':'s are'} reopened by the new administration.`:''}`;
 politicalHistory(text,'bad');recordWorldNews(text,'bad');ps.pending=null;return text;
}
function showGuardianPoliticalLastStand(locId){
 const ps=politicalSettlement(locId),q=ps.pending;if(!q?.guardianLastStand)return;const check=politicalHandoverQualification(locId,q);if(!check.qualified){cancelStalePoliticalHandover(locId,q,check.reason);if(state.world.location===locId)showSettlementPolitics(locId);return}
 const current=q.current,challenger=q.challenger,loc=worldLocation(locId);
 overlay(`<h2>${esc(loc.name)} — Control at the Brink</h2><div class="warning notice"><b>${esc(majorFaction(challenger).name)} is poised to take political control.</b><br>${esc(majorFaction(current).name)}, the faction you publicly endorse, has failed to recover its lead during the handover period.</div><p>Because you are here and have publicly committed yourself to the incumbent, you have one last opportunity to rally its supporters. Success is not guaranteed, and a strong opposing lead will be difficult to reverse.</p><div class="choice-list"><button id="politicalLastStand"><b>Make a Last-Ditch Intervention</b><br><small>Use your local reputation, political relationships, and personal influence to try to restore the incumbent's position.</small></button><button id="politicalStandAside"><b>Stand Aside</b><br><small>Allow the political handover to proceed.</small></button></div>`,true);
 $('#politicalLastStand').onclick=()=>resolveGuardianPoliticalLastStand(locId,true);$('#politicalStandAside').onclick=()=>resolveGuardianPoliticalLastStand(locId,false);
}
function resolveGuardianPoliticalLastStand(locId,intervene){
 const ps=politicalSettlement(locId),q=ps.pending;if(!q?.guardianLastStand)return render();const check=politicalHandoverQualification(locId,q);if(!check.qualified){cancelStalePoliticalHandover(locId,q,check.reason);return showSettlementPolitics(locId)}const current=q.current,challenger=q.challenger,before=politicalOutcomeSnapshot(locId,[current,challenger]);let text,tone='bad';
 if(intervene){const status=politicalStatus(locId),lead=Math.max(0,(status.topPressure||0)-politicalPressure(locId,current)),rep=localReputation(locId),standing=state.world.factionStanding[current]||0,roll=rnd(1,20)+stat(state,'cha')+Math.floor(rep/2)+Math.floor(Math.max(0,standing)/3)-Math.floor(lead/2);if(roll>=18){ps.pressure[current]=Math.min(12,(ps.pressure[current]||0)+2);ps.pressure[challenger]=Math.max(0,(ps.pressure[challenger]||0)-2);ps.lean[current]=clamp((ps.lean[current]||0)+1.5,-6,12);ps.pending=null;ps.lastShiftDay=state.world.day;text=`Your intervention gives ${majorFaction(current).short} enough political ground to halt the immediate handover in ${worldLocation(locId).name}. The contest remains alive.`;tone='good';politicalHistory(text,'good');recordWorldNews(text,'info')}else{text=`Your intervention fails to overturn ${majorFaction(challenger).short}'s sustained political lead. ${completeAutomaticPoliticalTransfer(locId,q,'sustained political lead despite Guardian intervention')}`}}
 else{text=completeAutomaticPoliticalTransfer(locId,q,'sustained political lead; Guardian stood aside')}
 const after=politicalOutcomeSnapshot(locId,[current,challenger]);save();showPoliticalOutcome('Political Control',text,before,after,{tone,back:()=>showSettlementPolitics(locId)});
}
function queueGuardianPoliticalLastStand(locId,q){const check=politicalHandoverQualification(locId,q);if(!check.qualified){cancelStalePoliticalHandover(locId,q,check.reason);return false}q.guardianLastStand=true;q.guardianLastStandDay=state.world.day;setTimeout(()=>{const ps=politicalSettlement(locId);if(ps.pending?.id!==q.id||!ps.pending.guardianLastStand)return;const live=politicalHandoverQualification(locId,ps.pending);if(!live.qualified){cancelStalePoliticalHandover(locId,ps.pending,live.reason);return}showGuardianPoliticalLastStand(locId)},0);return true}
function evaluatePoliticalShift(locId,perfStats=null){
 const now=()=>typeof sosPerfNow==='function'?sosPerfNow():performance.now();let t=now(),ps=politicalSettlement(locId),status=politicalStatus(locId,perfStats);if(perfStats)perfStats.status+=now()-t;
 t=now();const blocked=!!ps.pending||state.world.day<(ps.transitionUntilDay||0)||state.world.day-(ps.lastShiftDay||0)<8;if(perfStats)perfStats.eligibility=(perfStats.eligibility||0)+now()-t;if(blocked)return;
 // Handover creation must agree with the visible Political Lead and the settlement's persistent
 // pressure track.  Do not use the broader strategic-power score here: incumbency/presence in that
 // score previously prevented a valid pending handover from ever being created.
 t=now();const m=politicalHandoverMetrics(locId),challenger=m.challenger;if(perfStats)perfStats.pressure+=now()-t;if(!challenger||challenger===m.current)return;
 if(m.pressureLead.f!==challenger||m.challengerPressure<10||m.challengerPressure<m.incumbentPressure+m.autonomyMargin)return;
 t=now();if(perfStats)perfStats.lean+=now()-t;if(m.lean<7)return;
 t=now();ps.pending={id:uid(),kind:'automatic_handover',challenger,current:m.current,createdDay:state.world.day,sustainDays:1,requiredDays:4,lastQualifiedDay:state.world.day,reason:`${majorFaction(challenger).name} has established a political lead. If it holds for four consecutive days, control will pass automatically.`};recordWorldNews(`${worldLocation(locId).name}: ${majorFaction(challenger).short} has established a political lead; the local government faces a possible handover if that lead holds.`,'info');if(perfStats)perfStats.transition+=now()-t
}

function resolvePoliticalShift(locId,choice){return showSettlementPolitics(locId)}


function localPoliticalProfilesSorted(locId){
 return localPoliticalFactions(locId).map(f=>localPoliticalProfile(locId,f)).sort((a,b)=>b.overall-a.overall)
}
// v1.6.66.22.12 — The player-facing Political Lead is the faction actually leading the
// settlement's persistent political-pressure contest.  Profile/lean scores remain important
// context, but capped secondary metrics must not turn a real pressure lead into a false tie.
function localPoliticalLeader(locId){
 const ps=politicalSettlement(locId),profiles=localPoliticalProfilesSorted(locId);
 const ranked=Object.keys(OPEN_WORLD_FACTIONS).map(f=>({f,pressure:Number(ps.pressure?.[f]||0)})).sort((a,b)=>b.pressure-a.pressure);
 const top=ranked[0];if(!top||top.pressure<=0)return profiles[0]||null;
 return profiles.find(p=>p.faction===top.f)||localPoliticalProfile(locId,top.f)||null
}
function localPoliticalGlanceRowsHTML(locId,mode='display'){
 const s=politicalStatus(locId),profiles=localPoliticalProfilesSorted(locId),lead=localPoliticalLeader(locId)?.faction||null,maxScore=Math.max(1,...profiles.map(p=>Math.max(0,p.overall||0)));
 return profiles.map(p=>{
  const standing=state.world.factionStanding[p.faction]||0,control=p.faction===s.control,dominant=p.faction===lead,pct=clamp(Math.round((Math.max(0,p.overall||0)/maxScore)*100),4,100),tier=pct>=75?'strong':pct>=45?'medium':'weak';
  const tag=[dominant?'POLITICAL LEAD':'',control?'FORMAL CONTROL':''].filter(Boolean).join(' • ');
  const body=SOSText("politics_control_incidents.localPoliticalGlanceRowsHTML.001",esc(majorFaction(p.faction).name),p.overall,tag?`${tag} • `:'',esc(politicalSupportLabel(p.publicSupport)),esc(politicalOrganizationLabel(p.organization)),standing>=0?'+':'',standing,pct,tier,pct);
  if(mode==='activities')return `<button class="political-action-faction political-glance-row" data-politicalfaction="${p.faction}">${body}</button>`;
  if(mode==='situation')return `<button class="political-action-faction political-glance-row" data-politicalsituationfaction="${p.faction}">${body}</button>`;
  return `<div class="political-action-faction political-glance-row">${body}</div>`
 }).join('')
}
function politicalSituationFactionHTML(locId,p,focusFaction=null){
 const s=politicalStatus(locId),lead=localPoliticalLeader(locId)?.faction||null,standing=state.world.factionStanding[p.faction]||0,localRel=localGuardianFactionRelation(locId,p.faction);
 const tags=[p.faction===lead?'POLITICAL LEAD':'',p.faction===s.control?'FORMAL CONTROL':''].filter(Boolean).join(' • ');
 const drivers=localPoliticalDrivers(locId,p.faction,3);
 return SOSText("politics_control_incidents.politicalSituationFactionHTML.001",focusFaction===p.faction?'controlling':'',esc(majorFaction(p.faction).name),tags?`${tags} • `:'',esc(settlementLeanTier(locId,p.faction)),standing>=0?'+':'',standing,esc(localGuardianFactionRelationLabel(localRel)),localRel>=0?'+':'',localRel,p.overall,p.publicSupport,esc(politicalSupportLabel(p.publicSupport)),p.organization,esc(politicalOrganizationLabel(p.organization)),p.legitimacy,p.merchantBacking,p.securityInfluence,politicalPressure(locId,p.faction).toFixed(1),esc(politicalCampaignMomentumLabel(politicalCampaignState(locId,p.faction).momentum)),drivers.length?`<div class="political-driver-list">${drivers.map(x=>`<small>• ${esc(x)}</small>`).join('')}</div>`:'')
}

function showSettlementPolitics(locId=state.world.location){modalRouteEnter(SOSText("politics_control_incidents.showSettlementPolitics.001"),Array.from(arguments));
 const now=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();let t=now();
 const loc=worldLocation(locId),s=politicalStatus(locId),ps=politicalSettlement(locId),rr=roadRights(locId),lead=localPoliticalLeader(locId),protection=politicalProtectionScore(locId,s.control);
 if(typeof sosPerfRecordDuration==='function')sosPerfRecordDuration('Settlement Politics — State & Leadership',now()-t);
 t=now();const glance=localPoliticalGlanceRowsHTML(locId,'situation');if(typeof sosPerfRecordDuration==='function')sosPerfRecordDuration('Settlement Politics — Faction Glance',now()-t);
 t=now();
 overlay(SOSText("politics_control_incidents.showSettlementPolitics.002",esc(loc.name),locationRegion(locId)==='redstone'?redstonePolicyNoticeHTML(locId):'',locationRegion(locId)==='redstone'?`<div class="notice compact"><b>Authority precedent:</b> ${esc(sengiaPrecedentLabel(locId))}<br><button id="politicsAuthority">Orders & Jurisdiction</button><button id="politicsSecurity">Military & Security</button></div>`:'',esc(politicalStatusLabel(locId)),esc(ps.leader),esc(ps.style),esc(s.control),lead?` • Political lead: <b>${esc(majorFaction(lead.faction).short)}</b> (${lead.overall})`:'',ps.autonomy,esc(rr.controller),rr.openness,rr.toll?` • Toll ${rr.toll}g`:'',esc(politicalProtectionLabel(protection)),protection,politicalCapital(locId,s.control).toFixed(1),politicalDebt(locId,s.control).toFixed(1),glance,politicalTransitionStatus(locId)?`<div class="notice compact"><b>${esc(politicalTransitionStatus(locId))}</b><br>A new control challenge cannot begin until the transition period ends.</div>`:'',politicalHandoverNoticeHTML(locId)) ,true);
 if(typeof sosPerfRecordDuration==='function')sosPerfRecordDuration('Settlement Politics — Render',now()-t);
 document.querySelectorAll('[data-politicalsituationfaction]').forEach(b=>b.onclick=()=>navigateTownMenu(SOSText("politics_control_incidents.showSettlementPolitics.003"),{locId,focusFaction:b.dataset.politicalsituationfaction}));
 $('#politicalActivities').onclick=()=>navigateTownMenu(SOSText("politics_control_incidents.showSettlementPolitics.004"),{locId});
 $('#politicalSituation').onclick=()=>navigateTownMenu(SOSText("politics_control_incidents.showSettlementPolitics.005"),{locId});
 $('#politicalSocial').onclick=()=>navigateTownMenu(SOSText("politics_control_incidents.showSettlementPolitics.006"),{locId});
 $('#politicalCampaigns').onclick=()=>showPoliticalCampaignDesk(locId);
 $('#politicalCovert').onclick=()=>showCovertPoliticalActions(locId);
 $('#politicalProtection').onclick=()=>showPoliticalProtection(locId);
 $('#politicalInternal').onclick=()=>showInternalFactionPolitics(locId);
 if($('#politicsAuthority'))$('#politicsAuthority').onclick=()=>showSengiaAuthority(locId);
 if($('#politicsSecurity'))$('#politicsSecurity').onclick=()=>showSengiaSecurity(locId);
 wireClose()
}
function simulatePoliticalDay(){
 if(!isOpenWorld())return;
 ensurePoliticalState();expireTreaties();decayFactionPowerEvidence();
 const perf=(name,fn)=>typeof sosPerfRun==='function'?sosPerfRun(name,fn):fn(),locs=regionalSettlements();
 if(typeof beginFactionPresenceReadCache==='function')beginFactionPresenceReadCache();
 try{
  perf('Politics Simulation — Local Maintenance',()=>{
   const sub={protection:0,campaigns:0,internal:0,long:0};
   for(const loc of locs){
    let t=sosPerfNow();const P=politicalProtectionState(loc.id),oldControl=P.lastControl,currentControl=settlementControl(loc.id);if(oldControl&&oldControl!==currentControl)reopenProtectedPoliticalCases(loc.id,oldControl,currentControl);P.lastControl=currentControl;decayLocalPoliticalCivic(loc.id);sub.protection+=sosPerfNow()-t;
    t=sosPerfNow();simulateLocalPoliticalCampaignDay(loc.id);sub.campaigns+=sosPerfNow()-t;
    t=sosPerfNow();simulateInternalFactionPoliticsDay(loc.id);sub.internal+=sosPerfNow()-t;
    t=sosPerfNow();politicalLongCampaignMaintenance(loc.id);sub.long+=sosPerfNow()-t
   }
   sosPerfRecordDuration('Politics Local — Protection & Civic',sub.protection);
   sosPerfRecordDuration('Politics Local — Campaigns',sub.campaigns);
   sosPerfRecordDuration('Politics Local — Internal Factions',sub.internal);
   sosPerfRecordDuration('Politics Local — Long Maintenance',sub.long)
  });
  perf('Politics Simulation — Presence & Pressure',()=>{
   for(const loc of locs){const ps=politicalSettlement(loc.id),presence=factionPresenceAt(loc.id),control=settlementControl(loc.id);
    for(const [f,v] of Object.entries(presence)){if(!OPEN_WORLD_FACTIONS[f])continue;if(v>=5&&chance(.24)){const fit=factionAgendaFit(f,loc.id);recordFactionPower(loc.id,f,'personnel',v>=8?1:.5,SOSText("politics_control_incidents.simulatePoliticalDay.001",factionPresenceTier(v),currentFactionPriority(f).label.toLowerCase()),5);ps.lean[f]=clamp((ps.lean[f]||0)+(f===control?.08:.04)+fit*.03,-6,12)}if(v>=7&&f!==control&&chance(.18))addPoliticalPressure(loc.id,f,.5,SOSText("politics_control_incidents.simulatePoliticalDay.002"));if(v<=2&&(ps.pressure[f]||0)>0&&chance(.18))ps.pressure[f]=Math.max(0,ps.pressure[f]-1)}
    const incident=activeFactionIncident(loc.id);if(incident)for(const f of incident.factions)if(f!==control)ps.pressure[f]=Math.min(12,(ps.pressure[f]||0)+.25)
   }
  });
  perf('Politics Simulation — Control Shifts',()=>{
   const now=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();let evalMs=0,sustainMs=0,pressureProfile=null;
   if(typeof beginPoliticalPressureReadCache==='function')beginPoliticalPressureReadCache();
   try{for(const loc of locs){const ps=politicalSettlement(loc.id),te=now();evaluatePoliticalShift(loc.id);evalMs+=now()-te;if(!ps.pending)continue;const ts=now();advancePoliticalHandoverClock(loc.id);sustainMs+=now()-ts;
   }}finally{if(typeof endPoliticalPressureReadCache==='function')pressureProfile=endPoliticalPressureReadCache()}
   if(typeof sosPerfRecordDuration==='function'){sosPerfRecordDuration('Control Shifts — Candidate Evaluation',evalMs);sosPerfRecordDuration('Control Shifts — Sustained Lead',sustainMs);if(pressureProfile){sosPerfRecordDuration('Control Shifts — Pressure Evidence',pressureProfile.evidence);sosPerfRecordDuration('Control Shifts — Pressure Shared Reads',pressureProfile.shared)}}
  });
 }finally{if(typeof endFactionPresenceReadCache==='function')endFactionPresenceReadCache()}
}

function politicalLongCampaignMaintenance(locId){
 const ps=politicalSettlement(locId),covert=politicalCovertState(locId),P=politicalProtectionState(locId),quietDays=state.world.day-(covert.lastOperationDay||-99);
 if(quietDays>=4&&covert.suspicion>0)covert.suspicion=Math.max(0,covert.suspicion-.22);
 if(quietDays>=10&&covert.evidence>0)covert.evidence=Math.max(0,covert.evidence-.08);
 if(state.world.day-(P.lastCapitalDay||-99)>=20)for(const f of Object.keys(P.capital||{}))if(P.capital[f]>0)P.capital[f]=Math.max(0,P.capital[f]-.08);
 if(state.world.day-(P.lastDebtDay||-99)>=12)for(const f of Object.keys(P.debt||{}))if(P.debt[f]>0)P.debt[f]=Math.max(0,P.debt[f]-.06);
 if(!ps.pending&&!activeFactionIncident(locId)){for(const f of Object.keys(ps.pressure||{})){const rate=f===settlementControl(locId)?.025:.06;ps.pressure[f]=Math.max(0,(ps.pressure[f]||0)-rate)}}
 for(const f of Object.keys(OPEN_WORLD_FACTIONS)){const c=localPoliticalFactionState(locId,f);for(const k of ['support','organization','legitimacy','merchant','security'])c[k]=clamp(Number.isFinite(c[k])?c[k]:0,-6,12)}
 if(Array.isArray(ps.civicHistory)&&ps.civicHistory.length>60)ps.civicHistory=ps.civicHistory.slice(-60);
 if(Array.isArray(P.history)&&P.history.length>60)P.history=P.history.slice(-60);
 if(Array.isArray(P.cases)&&P.cases.length>80)P.cases=P.cases.slice(-80)
}
function politicalTransitionStatus(locId){
 const ps=politicalSettlement(locId),left=Math.max(0,(ps.transitionUntilDay||0)-state.world.day);return left?SOSText("politics_control_incidents.politicalTransitionStatus.001",left,left===1?'':'s'):null
}
// v1.6.66.22.4 — Render the control countdown from the authoritative pending handover itself.
function politicalHandoverNoticeHTML(locId){
 const q=politicalSettlement(locId).pending;if(!q)return '';
 const faction=majorFaction(q.challenger),required=Math.max(1,q.requiredDays||4),held=Math.max(1,Math.min(required,q.sustainDays||1)),left=Math.max(0,required-held);
 if(q.guardianLastStand)return `<div class="warning notice"><b>Political Handover Imminent</b><br>${esc(faction.name)} is poised to take formal control.<br><small>The Guardian has an immediate opportunity to intervene.</small></div>`;
 const when=left===1?'1 more day':`${left} more days`;
 return `<div class="warning notice"><b>Political Handover Developing</b><br>If ${esc(faction.short)} holds its political lead, it will take formal control in <b>${when}</b>.<br><small>Lead held ${held}/${required} consecutive days.</small></div>`
}
function stabilizePoliticalTransfer(locId,oldControl,newControl){
 const ps=politicalSettlement(locId);ps.lastShiftDay=state.world.day;ps.transitionUntilDay=state.world.day+8;
 if(oldControl&&OPEN_WORLD_FACTIONS[oldControl])ps.pressure[oldControl]=Math.max(0,(ps.pressure[oldControl]||0)*.5);
 if(newControl&&OPEN_WORLD_FACTIONS[newControl]){ps.pressure[newControl]=Math.max(3,ps.pressure[newControl]||0);const c=localPoliticalFactionState(locId,newControl);c.organization=clamp(c.organization+.35,-6,12);c.legitimacy=clamp(c.legitimacy+.25,-6,12)}
 const P=politicalProtectionState(locId);P.lastControl=newControl
}
function politicalMapTag(locId){
 if(!state.world.settlements?.[locId])return'';const s=politicalStatus(locId),lead=rankedSettlementLeans(locId)[0],leaning=lead&&lead.f!==s.control&&lead.score>=4;return `<em class="political-control-tag ${s.contested?'contested':''} ${leaning?'leaning':''}" title="${esc(politicalStatusLabel(locId))}${leaning?` • leaning ${majorFaction(lead.f).short}`:''}">${esc((s.control||'Independent').slice(0,3).toUpperCase())}${s.contested?'?':leaning?'↗':''}</em>`
}
function showRegionalPolitics(){modalRouteEnter(SOSText("politics_control_incidents.showRegionalPolitics.001"),Array.from(arguments));
 ensurePoliticalState();const region=currentWorldRegion(),capId=regionalCapitalId(region),dom=dominantRegionalFaction(region),access=activeGuardianCaravanAccess(region),locs=regionalSettlements(region),treaties=Object.values(state.world.politics.treaties).filter(t=>t.status==='active'&&t.expiresDay>=state.world.day),history=state.world.politics.history.slice(-8).reverse();
 overlay(SOSText("politics_control_incidents.showRegionalPolitics.002",`${dom?`<div class="notice compact"><b>Regional caravan access — ${esc(majorFaction(dom).name)}</b><br>${esc(worldLocation(capId).name)} controls the region. Political capital: ${politicalCapital(capId,dom).toFixed(1)}.${access?`<br><span class="good-text">Guardian caravan protection active through Day ${access.expiresDay}.</span>`:`<br><button id="regionalCaravanAccess">Ask ${esc(majorFaction(dom).short)} to Protect Guardian Caravans</button>`}</div>`:''}`+Object.keys(OPEN_WORLD_FACTIONS).map(f=>`<div class="card compact"><b>${esc(majorFaction(f).name)}</b><br>${esc(currentFactionPriority(f).label)}</div>`).join(''),currentWorldRegion()==='bluestone'?`<h3>Bluestone Local Questions</h3>${locs.filter(l=>BLUESTONE_LOCAL_POLITICS[l.id]).map(l=>`<div class="card compact"><b>${esc(l.name)} — ${esc(BLUESTONE_LOCAL_POLITICS[l.id].issue)}</b><br><small>${esc(BLUESTONE_LOCAL_POLITICS[l.id].local)}</small></div>`).join('')}`:currentWorldRegion()==='redstone'?`<h3>Redstone Local Questions</h3>${locs.filter(l=>REDSTONE_LOCAL_POLITICS[l.id]).map(l=>`<div class="card compact"><b>${esc(l.name)} — ${esc(REDSTONE_LOCAL_POLITICS[l.id].issue)}</b><br><small>${esc(REDSTONE_LOCAL_POLITICS[l.id].local)}</small></div>`).join('')}`:'',locs.map(l=>{const s=politicalStatus(l.id),rr=roadRights(l.id),lead=rankedSettlementLeans(l.id)[0];return `<button class="political-settlement-card" data-politicsloc="${l.id}"><span><b>${esc(l.name)}</b><small>${esc(politicalStatusLabel(l.id))} • ${esc(s.leader)} • Autonomy ${s.autonomy}/10</small></span><span><b>${esc(s.control)}</b><small>${lead?`${esc(majorFaction(lead.f).short)}: ${esc(lead.tier)}`:'No strong lean'} • Roads ${esc(rr.controller)}</small></span></button>`}).join(''),treaties.map(t=>`<div class="card compact"><b>${esc(t.label)}</b><br>${esc(t.a)} ↔ ${esc(t.b)} • through Day ${t.expiresDay}</div>`).join('')||'<p class="muted">No active regional agreement.</p>',history.map(h=>`<div class="card compact"><b>Day ${h.day}</b> — ${esc(h.text)}</div>`).join('')||'<p class="muted">No major political change yet.</p>'),true);
 document.querySelectorAll('[data-politicsloc]').forEach(b=>b.onclick=()=>showSettlementPolitics(b.dataset.politicsloc));if($('#regionalCaravanAccess'))$('#regionalCaravanAccess').onclick=()=>requestGuardianCaravanAccess(region);wireClose()
}
const FACTION_INCIDENT_TYPES=[
 {id:'checkpoint',title:SOSText("politics_control_incidents.showRegionalPolitics.003"),factions:[SOSText("politics_control_incidents.showRegionalPolitics.004"),SOSText("politics_control_incidents.showRegionalPolitics.005")],text:SOSText("politics_control_incidents.showRegionalPolitics.006")},
 {id:'patrol_rights',title:SOSText("politics_control_incidents.showRegionalPolitics.007"),factions:[SOSText("politics_control_incidents.showRegionalPolitics.008"),SOSText("politics_control_incidents.showRegionalPolitics.009")],text:SOSText("politics_control_incidents.showRegionalPolitics.010")},
 {id:'prisoner',title:SOSText("politics_control_incidents.showRegionalPolitics.011"),factions:[SOSText("politics_control_incidents.showRegionalPolitics.012"),SOSText("politics_control_incidents.showRegionalPolitics.013")],text:SOSText("politics_control_incidents.showRegionalPolitics.014")},
 {id:'spawn_harassment',title:SOSText("politics_control_incidents.showRegionalPolitics.015"),factions:[SOSText("politics_control_incidents.showRegionalPolitics.016"),SOSText("politics_control_incidents.showRegionalPolitics.017")],text:SOSText("politics_control_incidents.showRegionalPolitics.018")},
 {id:'mercenary',title:SOSText("politics_control_incidents.showRegionalPolitics.019"),factions:[SOSText("politics_control_incidents.showRegionalPolitics.020"),SOSText("politics_control_incidents.showRegionalPolitics.021")],text:SOSText("politics_control_incidents.showRegionalPolitics.022")},
 {id:'observer',title:SOSText("politics_control_incidents.showRegionalPolitics.023"),factions:[SOSText("politics_control_incidents.showRegionalPolitics.024"),SOSText("politics_control_incidents.showRegionalPolitics.025")],text:SOSText("politics_control_incidents.showRegionalPolitics.026")}
];
function activeFactionIncident(locId){const x=state.world.factionIncidents?.[locId];return x&&x.status==='active'?x:null}
function incidentEligible(type,locId){const p=factionPresenceAt(locId);return type.factions.every(f=>(p[f]||0)>=1)}
function maybeCreateFactionIncident(locId){
 if(activeFactionIncident(locId))return;const ss=settlementState(locId);if(state.world.day-(ss.lastFactionIncidentDay||0)<3||!chance(.18))return;
 const choices=FACTION_INCIDENT_TYPES.filter(t=>incidentEligible(t,locId));if(!choices.length)return;const t=pick(choices);
 const row={id:uid(),type:t.id,title:t.title,text:t.text,factions:[...t.factions],day:state.world.day,status:'active'},wi=createWorldIncident('faction_dispute',{location:locId,severity:2,actors:t.factions.map(f=>({ref:`faction:${f}`,role:'faction'})),political:{factions:[...t.factions]},links:{factionIncidentId:row.id},meta:{incidentType:t.id,title:t.title}});row.incidentId=wi.id;state.world.factionIncidents[locId]=row;ss.lastFactionIncidentDay=state.world.day;
 recordWorldNews(SOSText("politics_control_incidents.maybeCreateFactionIncident.001",t.title,worldLocation(locId).name),'info')
}
function resolveFactionIncident(locId,choice){
 const inc=activeFactionIncident(locId);if(!inc)return showSettlementFactions(locId);const [a,b]=inc.factions,loc=worldLocation(locId),before=politicalOutcomeSnapshot(locId,[a,b]);let text='',tone='info';
 if(choice==='a'||choice==='b'){const favored=choice==='a'?a:b,other=choice==='a'?b:a;adjustFactionStanding(favored,2,SOSText("politics_control_incidents.resolveFactionIncident.001",favored,inc.title));adjustFactionStanding(other,-1,SOSText("politics_control_incidents.resolveFactionIncident.002",other,inc.title));adjustFactionRelation(a,b,-1,SOSText("politics_control_incidents.resolveFactionIncident.003",inc.title));state.world.factionPresence[locId][favored]=Math.min(12,(state.world.factionPresence[locId][favored]||0)+1);addPoliticalPressure(locId,favored,1,SOSText("politics_control_incidents.resolveFactionIncident.004",inc.title));text=SOSText("politics_control_incidents.resolveFactionIncident.005",majorFaction(favored).name,majorFaction(other).name);tone='good'}
 else if(choice==='mediate'){const roll=rnd(1,20)+stat(state,'cha')+Math.floor(localReputation(locId)/3);if(roll>=17){adjustFactionStanding(a,1,SOSText("politics_control_incidents.resolveFactionIncident.006"));adjustFactionStanding(b,1,SOSText("politics_control_incidents.resolveFactionIncident.007"));adjustFactionRelation(a,b,1,SOSText("politics_control_incidents.resolveFactionIncident.008",inc.title));changeLocalReputation(locId,2,SOSText("politics_control_incidents.resolveFactionIncident.009"));text=SOSText("politics_control_incidents.resolveFactionIncident.010");tone='good'}else{text=SOSText("politics_control_incidents.resolveFactionIncident.011");changeLocalReputation(locId,-1,SOSText("politics_control_incidents.resolveFactionIncident.012"));tone='bad'}}
 else {text=SOSText("politics_control_incidents.resolveFactionIncident.013")}
 inc.status='resolved';inc.resolvedDay=state.world.day;inc.choice=choice;if(inc.incidentId)resolveWorldIncident(inc.incidentId,{kind:'political_resolution',choice,violent:false,result:text});recordWorldHistory(SOSText("politics_control_incidents.resolveFactionIncident.014",loc.name,inc.title,text) ,tone,SOSText("politics_control_incidents.resolveFactionIncident.015"));const after=politicalOutcomeSnapshot(locId,[a,b]);save();showPoliticalOutcome(inc.title,text,before,after,{tone,back:()=>showSettlementFactions(locId)})
}
function showFactionIncident(locId){modalRouteEnter(SOSText("politics_control_incidents.showFactionIncident.001"),Array.from(arguments));
 const inc=activeFactionIncident(locId);if(!inc)return showSettlementFactions(locId);const [a,b]=inc.factions;
 overlay(SOSText("politics_control_incidents.showFactionIncident.002",esc(inc.title),esc(inc.text),esc(majorFaction(a).name),esc(majorFaction(b).name),esc(majorFaction(a).short),esc(majorFaction(b).short)));
 document.querySelectorAll('[data-incchoice]').forEach(x=>x.onclick=()=>resolveFactionIncident(locId,x.dataset.incchoice));$('#factionIncidentBack').onclick=()=>SOSServices.navigation.back(()=>showSettlementFactions(locId))
}
function factionCheckpointAt(locId){
 const rr=roadRights(locId);if(!rr)return null;const control=settlementControl(locId),pres=factionPresenceAt(locId);if((rr.openness??7)>=9)return null;if((pres[control]||0)>=7&&[SOSText("politics_control_incidents.factionCheckpointAt.001"),SOSText("politics_control_incidents.factionCheckpointAt.002"),SOSText("politics_control_incidents.factionCheckpointAt.003")].includes(control))return control;
 const strong=Object.entries(pres).find(([f,v])=>v>=9&&[SOSText("politics_control_incidents.factionCheckpointAt.004"),SOSText("politics_control_incidents.factionCheckpointAt.005"),SOSText("politics_control_incidents.factionCheckpointAt.006")].includes(f));return strong?.[0]||null
}
function handleFactionArrival(locId,done){
 const f=factionCheckpointAt(locId);if(!f)return done();const s=state.world.factionStanding[f]||0;
 if(s>=6)return done();
 if(s<=-10){return actionResult(SOSText("politics_control_incidents.handleFactionArrival.001",majorFaction(f).short),SOSText("politics_control_incidents.handleFactionArrival.002"),'bad',()=>done())}
 if(s<=-7){const rr=roadRights(locId)||{toll:0,openness:7},fee=Math.min(state.gold,Math.max(4,12+(rr.toll||0)+(6-(rr.openness??7))*2));state.gold-=fee;recordWorldHistory(SOSText("politics_control_incidents.handleFactionArrival.003",majorFaction(f).short,worldLocation(locId).name,fee),'bad','faction');save();return actionResult(SOSText("politics_control_incidents.handleFactionArrival.004",majorFaction(f).short),SOSText("politics_control_incidents.handleFactionArrival.005",fee),'bad',done)}
 done()
}
const FACTION_POST_NAMES={
 shantium:{Shantium:SOSText("politics_control_incidents.handleFactionArrival.006"),Coalition:SOSText("politics_control_incidents.handleFactionArrival.007"),Independent:SOSText("politics_control_incidents.handleFactionArrival.008")},
 river:{Independent:SOSText("politics_control_incidents.handleFactionArrival.009"),Coalition:SOSText("politics_control_incidents.handleFactionArrival.010"),Spawn:SOSText("politics_control_incidents.handleFactionArrival.011")},
 stonebridge:{Independent:SOSText("politics_control_incidents.handleFactionArrival.012"),Redstone:SOSText("politics_control_incidents.handleFactionArrival.013"),Coalition:SOSText("politics_control_incidents.handleFactionArrival.014"),Mercenaries:SOSText("politics_control_incidents.handleFactionArrival.015")},
 northgate:{Coalition:SOSText("politics_control_incidents.handleFactionArrival.016"),Independent:SOSText("politics_control_incidents.handleFactionArrival.017"),Bluestone:SOSText("politics_control_incidents.handleFactionArrival.018")},
 southroad:{Independent:SOSText("politics_control_incidents.handleFactionArrival.019"),Mercenaries:SOSText("politics_control_incidents.handleFactionArrival.020"),Spawn:SOSText("politics_control_incidents.handleFactionArrival.021")},
 redoubt:{Redstone:SOSText("politics_control_incidents.handleFactionArrival.022"),Mercenaries:SOSText("politics_control_incidents.handleFactionArrival.023")},
 zion:{Bluestone:SOSText("politics_control_incidents.handleFactionArrival.024"),Independent:SOSText("politics_control_incidents.handleFactionArrival.025"),Coalition:SOSText("politics_control_incidents.handleFactionArrival.026")},
 lowcreek:{Bluestone:SOSText("politics_control_incidents.handleFactionArrival.027"),Independent:SOSText("politics_control_incidents.handleFactionArrival.028")},
 ebonheart:{Bluestone:SOSText("politics_control_incidents.handleFactionArrival.029"),Independent:SOSText("politics_control_incidents.handleFactionArrival.030")},
 norwegian:{Bluestone:SOSText("politics_control_incidents.handleFactionArrival.031"),Independent:SOSText("politics_control_incidents.handleFactionArrival.032")},
 winterstone:{Bluestone:SOSText("politics_control_incidents.handleFactionArrival.033"),Independent:SOSText("politics_control_incidents.handleFactionArrival.034")},
 skybreak:{Bluestone:SOSText("politics_control_incidents.handleFactionArrival.035")},
 sengia:{Redstone:SOSText("politics_control_incidents.handleFactionArrival.036"),Independent:SOSText("politics_control_incidents.handleFactionArrival.037"),Mercenaries:SOSText("politics_control_incidents.handleFactionArrival.038")},
 lockwood:{Redstone:SOSText("politics_control_incidents.handleFactionArrival.039"),Independent:SOSText("politics_control_incidents.handleFactionArrival.040")},
 grayhaven:{Redstone:SOSText("politics_control_incidents.handleFactionArrival.041"),Independent:SOSText("politics_control_incidents.handleFactionArrival.042")},
 briarlake:{Redstone:SOSText("politics_control_incidents.handleFactionArrival.043"),Independent:SOSText("politics_control_incidents.handleFactionArrival.044")},
 glenbrook:{Redstone:SOSText("politics_control_incidents.handleFactionArrival.045"),Independent:SOSText("politics_control_incidents.handleFactionArrival.046")},
 tyrdon:{Redstone:SOSText("politics_control_incidents.handleFactionArrival.047"),Independent:SOSText("politics_control_incidents.handleFactionArrival.048")},
 pyreglade:{Redstone:SOSText("politics_control_incidents.handleFactionArrival.049"),Independent:SOSText("politics_control_incidents.handleFactionArrival.050"),Mercenaries:SOSText("politics_control_incidents.handleFactionArrival.051")}
};
function majorFaction(id){return OPEN_WORLD_FACTIONS[id]||{name:id,short:id,desc:SOSText("politics_control_incidents.majorFaction.001"),agenda:SOSText("politics_control_incidents.majorFaction.002")}}
function ensureFactionPresence(){
 if(!state?.world)return;state.world.factionPresence=state.world.factionPresence||{};
 for(const loc of WORLD_LOCATIONS.filter(x=>['town','settlement','camp','fort','district'].includes(x.type))){
  if(!state.world.settlements?.[loc.id])continue;
  if(!state.world.factionPresence[loc.id]){
   const base={};base[loc.faction||SOSText("politics_control_incidents.ensureFactionPresence.001")]=5;
   if(loc.id==='shantium')Object.assign(base,{Shantium:7,Independent:3,Coalition:1});
   if(loc.id==='river')Object.assign(base,{Independent:7,Coalition:2,Spawn:1});
   if(loc.id==='stonebridge')Object.assign(base,{Independent:8,Redstone:2,Coalition:1,Mercenaries:2});
   if(loc.id==='northgate')Object.assign(base,{Coalition:8,Independent:2,Bluestone:1});
   if(loc.id==='southroad')Object.assign(base,{Independent:6,Mercenaries:3,Spawn:1});
   if(loc.id==='redoubt')Object.assign(base,{Redstone:10,Mercenaries:2});
   if(loc.id==='zion')Object.assign(base,{Bluestone:10,Independent:3,Coalition:1});
   if(loc.id==='lowcreek')Object.assign(base,{Bluestone:8,Independent:3,Mercenaries:1});
   if(loc.id==='ebonheart')Object.assign(base,{Bluestone:8,Independent:2});
   if(loc.id==='norwegian')Object.assign(base,{Bluestone:6,Independent:5,Spawn:1});
   if(loc.id==='winterstone')Object.assign(base,{Bluestone:9,Independent:2,Mercenaries:2});
   if(loc.id==='skybreak')Object.assign(base,{Bluestone:11});
   if(loc.id==='sengia')Object.assign(base,{Redstone:13,Independent:3,Mercenaries:2});
   if(loc.id==='lockwood')Object.assign(base,{Redstone:8,Independent:6,Mercenaries:1});
   if(loc.id==='grayhaven')Object.assign(base,{Redstone:9,Independent:3});
   if(loc.id==='briarlake')Object.assign(base,{Redstone:6,Independent:6});
   if(loc.id==='glenbrook')Object.assign(base,{Redstone:6,Independent:6});
   if(loc.id==='tyrdon')Object.assign(base,{Redstone:5,Independent:7});
   if(loc.id==='pyreglade')Object.assign(base,{Redstone:5,Independent:8,Mercenaries:1});
   state.world.factionPresence[loc.id]=base;
  }
 }
}


function factionSocialState(){ensureWorldState();if(!state.world.factionSocial||typeof state.world.factionSocial!=='object')state.world.factionSocial={npcAlignment:{},travelerInfluence:{},history:[],lastDay:state.world.day,lastPressureDay:{}};const F=state.world.factionSocial;if(!F.npcAlignment)F.npcAlignment={};if(!F.travelerInfluence)F.travelerInfluence={};if(!Array.isArray(F.history))F.history=[];if(!F.lastPressureDay||typeof F.lastPressureDay!=='object')F.lastPressureDay={};return F}
