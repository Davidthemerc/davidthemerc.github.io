/* v1.6.66.16.0 — Guardian Military Command & Legacy */
const GUARDIAN_COMMAND_LEGACY_VERSION=1;
function guardianFormationLegacy(U){
 if(!U.legacy||typeof U.legacy!=='object')U.legacy={version:GUARDIAN_COMMAND_LEGACY_VERSION,commanders:[],honors:[],daysInService:0,lastServiceDay:null};
 const L=U.legacy;L.version=GUARDIAN_COMMAND_LEGACY_VERSION;if(!Array.isArray(L.commanders))L.commanders=[];if(!Array.isArray(L.honors))L.honors=[];
 L.daysInService=Math.max(0,Math.round(Number(L.daysInService)||0));
 const O=guardianFormationCommander(U);
 if(O&&!L.commanders.some(c=>c.officerId===O.id&&!c.endedDay))L.commanders.push({officerId:O.id,name:O.name,rank:O.rank,beganDay:state.world.day,endedDay:null});
 return L
}
function guardianFormationCurrentCommand(U){const L=guardianFormationLegacy(U),O=guardianFormationCommander(U);if(!O)return null;let C=L.commanders.find(c=>c.officerId===O.id&&!c.endedDay);if(!C){C={officerId:O.id,name:O.name,rank:O.rank,beganDay:state.world.day,endedDay:null};L.commanders.push(C)}return C}
function guardianFormationCommandDays(U){const C=guardianFormationCurrentCommand(U);return C?Math.max(0,state.world.day-C.beganDay):0}
function guardianFormationCommandChange(id,officerId){
 const U=guardianFormationById(id);if(!U||U.status==='disbanded')return showGuardianFormations();const F=guardianForceState(),next=F.officers.find(o=>o.id===officerId&&!o.formationId);
 if(!next)return actionResult('Command Unchanged','Select an available commissioned officer to assume command.','bad',()=>showGuardianFormationDetail(id));
 const L=guardianFormationLegacy(U),old=guardianFormationCommander(U),oldRec=old?L.commanders.find(c=>c.officerId===old.id&&!c.endedDay):null;if(oldRec)oldRec.endedDay=state.world.day;
 guardianFormationAssignCommander(U,next.id);L.commanders.push({officerId:next.id,name:next.name,rank:next.rank,beganDay:state.world.day,endedDay:null});
 guardianFormationRecord(U,'change_of_command',`${next.rank} ${next.name} assumes command${old?` from ${old.rank} ${old.name}`:''}.`);save();return actionResult('Change of Command',`${next.rank} ${next.name} has assumed command of ${U.name}. The company’s service record and lineage continue unchanged.`,'good',()=>showGuardianFormationDetail(id))
}
function guardianFormationAddHonor(U,key,name,reason){const L=guardianFormationLegacy(U);if(L.honors.some(h=>h.key===key))return false;L.honors.push({key,name,reason,day:state.world.day});guardianFormationRecord(U,'distinction',`${name}: ${reason}`);return true}
function guardianFormationEvaluateLegacy(U){
 const L=guardianFormationLegacy(U),W=guardianWarService(U);let changed=false;
 if((W.battles||0)>=1)changed=guardianFormationAddHonor(U,'first_battle','Baptism of Fire','The company has entered its first field battle.')||changed;
 if((W.victories||0)>=3)changed=guardianFormationAddHonor(U,'three_victories','Proven in Battle','The company has recorded three battlefield victories.')||changed;
 if((W.battles||0)>=8)changed=guardianFormationAddHonor(U,'veteran_formation','Veteran Formation','The company has completed eight field battles.')||changed;
 if((U.reconstitutions||0)>=1)changed=guardianFormationAddHonor(U,'banner_endures','The Banner Endures','The company has been reconstituted while preserving its historic designation.')||changed;
 if((W.casualties||0)>=U.authorizedStrength)changed=guardianFormationAddHonor(U,'paid_in_blood','Paid in Blood',`Recorded battle losses have reached the equivalent of the company’s authorized strength.`)||changed;
 return changed
}
function guardianFormationLegacyDailyTick(){let changed=false;for(const U of guardianFormationState().units){const L=guardianFormationLegacy(U);if(U.status!=='disbanded'&&L.lastServiceDay!==state.world.day){L.lastServiceDay=state.world.day;L.daysInService++;changed=true}changed=guardianFormationEvaluateLegacy(U)||changed}return changed}
const __warStrategicDailyTickGuardianLegacy=warStrategicDailyTick;warStrategicDailyTick=function(){const out=__warStrategicDailyTickGuardianLegacy.apply(this,arguments),perf=(n,fn)=>typeof sosPerfRun==='function'?sosPerfRun(n,fn):fn();perf('War — Guardian Command & Legacy',()=>guardianFormationLegacyDailyTick());return out};
function guardianFormationLegacySummary(U){const L=guardianFormationLegacy(U),W=guardianWarService(U);return `${L.daysInService} days on active rolls • ${W.battles||0} battles • ${W.victories||0} victories • ${W.casualties||0} recorded battle losses • ${U.reconstitutions||0} reconstitution${(U.reconstitutions||0)===1?'':'s'}`}
const __showGuardianFormationDetailLegacy=showGuardianFormationDetail;showGuardianFormationDetail=function(id){
 const r=__showGuardianFormationDetailLegacy.apply(this,arguments),U=guardianFormationById(id),dlg=document.querySelector('.dialog');if(!U||!dlg)return r;const L=guardianFormationLegacy(U),O=guardianFormationCommander(U),C=guardianFormationCurrentCommand(U),available=guardianUnassignedOfficers(),h3=Array.from(dlg.querySelectorAll('h3')).find(x=>x.textContent==='Service Record');if(!h3)return r;
 const honors=L.honors.length?L.honors.map(H=>`<div class="card compact"><b>${esc(H.name)}</b><br><small>Day ${H.day} • ${esc(H.reason)}</small></div>`).join(''):'<p class="muted">No company distinctions have yet been entered on the rolls.</p>';
 const commanders=L.commanders.slice().reverse().map(X=>`<div class="card compact"><b>${esc(X.rank)} ${esc(X.name)}</b><br><small>Command: Day ${X.beganDay}${X.endedDay?`–${X.endedDay}`:'–present'}</small></div>`).join('')||'<p class="muted">No command history recorded.</p>';
 const sec=document.createElement('div');sec.innerHTML=`<h3>Command & Lineage</h3><div class="card compact"><div class="stat-row"><span>Company lineage</span><b>Founded Day ${U.foundedDay}</b></div><div class="stat-row"><span>Days on active rolls</span><b>${L.daysInService}</b></div><div class="stat-row"><span>Current commander</span><b>${O?`${esc(O.rank)} ${esc(O.name)} • ${guardianFormationCommandDays(U)}d in command`:'Vacant'}</b></div><div class="stat-row"><span>Service summary</span><b>${esc(guardianFormationLegacySummary(U))}</b></div></div>${U.status!=='disbanded'&&available.length?`<div class="card compact"><label><b>Change of command</b><select id="gfcCommandOfficer">${available.map(o=>`<option value="${esc(o.id)}">${esc(o.rank)} ${esc(o.name)}</option>`).join('')}</select></label><div class="choice-list"><button id="gfcChangeCommand">Appoint New Company Commander</button></div></div>`:''}<h3>Company Distinctions</h3>${honors}<h3>Command History</h3>${commanders}`;
 h3.parentNode.insertBefore(sec,h3);if($('#gfcChangeCommand'))$('#gfcChangeCommand').onclick=()=>guardianFormationCommandChange(id,$('#gfcCommandOfficer').value);return r
};
