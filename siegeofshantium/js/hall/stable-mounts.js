/* v1.6.66.9.8 — Guardian Hall Stable & Stable Master */
const HALL_STABLE_CAPACITY=[0,8,18,32];
const STABLE_MASTER_CANDIDATES=[
 {id:'mara_vell',name:'Mara Vell',competence:4,salary:92,trait:'Patient Handler',desc:'A steady Shantium horsewoman with a reputation for keeping difficult animals calm.'},
 {id:'orrin_tack',name:'Orrin Tack',competence:6,salary:126,trait:'Road Eye',desc:'A caravan-yard veteran skilled at judging sound feet, endurance, and road condition.'},
 {id:'selka_renn',name:'Selka Renn',competence:8,salary:168,trait:'Master Horsekeeper',desc:'An experienced stablemaster whose eye for conditioning and breeding stock is widely respected.'}
];
function ensureHallStable(){
 ensureHomeBase();const h=state.world.homeBase;if(!h.stable||typeof h.stable!=='object')h.stable={version:1,master:null,lastSalaryDay:state.world.day,records:[],careReserve:100};
 const S=h.stable;if(!Array.isArray(S.records))S.records=[];if(!Number.isFinite(S.careReserve))S.careReserve=100;return S
}
function hallStableLevel(){return homeUpgradeLevel('stable')}
function hallStableCapacity(){return HALL_STABLE_CAPACITY[Math.min(3,hallStableLevel())]||0}
function hallStableMounts(){return ensureMountState().owned.filter(m=>m.status==='owned'&&m.assignment==='hall_stable')}
function hallStableSpare(){return Math.max(0,hallStableCapacity()-hallStableMounts().length)}
function hallStableMaster(){return ensureHallStable().master}
function hallStableRecoveryBonus(){
 const M=hallStableMaster(),lvl=hallStableLevel();return lvl?lvl*2+(M?Math.max(1,Math.floor(M.competence/2)):0):0
}
function hallStableBoard(id){
 const m=ensureMountState().owned.find(x=>x.id===id);if(!m||!hallStableLevel()||hallStableSpare()<=0)return showHallStable();m.assignment='hall_stable';m.hallStabledDay=state.world.day;save();showHallStable()
}
function hallStableTake(id){
 if(typeof homeStableEmergency==='function'&&homeStableEmergency())return actionResult('Stable Supplies Critical','The Stable Master cannot release animals while emergency feed and care are being secured. The animals are safe, but every available hand is keeping them fed and tended.','info',showHallStable);
 const m=ensureMountState().owned.find(x=>x.id===id);if(!m)return showHallStable();m.assignment='unassigned';save();showHallStable()
}
function showStableMasterCandidates(){
 guardianHallRouteEnter('showStableMasterCandidates',[]);const S=ensureHallStable();
 if(!hallStableLevel())return actionResult('Stable Required','Build the Guardian Hall Stable before hiring a Stable Master.','info',showHomeUpgrades);
 overlay(`<h2>Hire a Stable Master</h2><p>The Stable Master is a named Hall officer responsible for conditioning, animal care, records, and eventually breeding operations.</p>${STABLE_MASTER_CANDIDATES.map(c=>`<div class="card"><h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p><small>${esc(c.trait)} • Competence ${c.competence}/10 • ${c.salary}g every 14 days</small><button data-stablehire="${c.id}" ${S.master?'disabled':''}>Hire ${esc(c.name)}</button></div>`).join('')}<div class="dialog-footer"><button id="stableHireBack">Back</button></div>`,true);
 document.querySelectorAll('[data-stablehire]').forEach(b=>b.onclick=()=>{const c=STABLE_MASTER_CANDIDATES.find(x=>x.id===b.dataset.stablehire);if(!c||S.master)return;S.master={...c,hiredDay:state.world.day};S.lastSalaryDay=state.world.day;S.records.push({day:state.world.day,text:`${c.name} hired as Stable Master.`});save();showHallStable()});$('#stableHireBack').onclick=showHallStable
}
function hallStableDailyTick(){
 if(!isOpenWorld()||!hallStableLevel())return;const S=ensureHallStable(),master=S.master;
 if(master&&state.world.day-(S.lastSalaryDay||state.world.day)>=14){if(state.world.homeBase.logistics.budget>=master.salary){homeFinanceDebit(master.salary,'Stable staff',`${master.name}, Stable Master`);S.lastSalaryDay=state.world.day;S.records.push({day:state.world.day,text:`${master.name} paid ${master.salary}g.`})}}
 const bonus=hallStableRecoveryBonus();for(const m of hallStableMounts()){mountConditionEnsure(m);m.fatigue=Math.max(0,m.fatigue-(5+bonus));if(m.recoverUntilDay>state.world.day&&master&&master.competence>=7&&m.fatigue<70)m.recoverUntilDay=Math.max(state.world.day,m.recoverUntilDay-1);m.condition=m.fatigue>=88?'exhausted':m.fatigue>=65?'tired':m.fatigue>=32?'winded':'fresh'}
 S.records=S.records.slice(-60)
}
function showHallStable(){
 guardianHallRouteEnter('showHallStable',[]);ensureHallStable();const lvl=hallStableLevel(),S=ensureHallStable(),master=S.master,stabled=hallStableMounts(),available=ensureMountState().owned.filter(m=>m.status==='owned'&&m.assignment!=='hall_stable');
 if(!lvl)return actionResult('No Hall Stable','Guardian Hall does not yet have a dedicated stable. Build one under Improvements & Facilities.','info',showHomeUpgrades);
 const stabledRows=stabled.map(m=>{mountConditionEnsure(m);return `<div class="inventory-row"><span><b>${esc(m.name)}</b><br><small>${esc(m.breedName)} • ${esc(m.condition)} • fatigue ${Math.round(m.fatigue)}%</small></span><button data-stabletake="${m.id}">Take Out</button></div>`}).join('')||'<p class="muted">No owned mounts are currently boarded at Guardian Hall.</p>';
 const availRows=available.map(m=>`<div class="inventory-row"><span><b>${esc(m.name)}</b><br><small>${esc(m.breedName)} • currently ${esc(m.assignment||'unassigned')}</small></span><button data-stableboard="${m.id}" ${hallStableSpare()<=0?'disabled':''}>Board at Hall</button></div>`).join('')||'<p class="muted">No additional owned mounts are available to board.</p>';
 overlay(`<h2>Guardian Hall — Stable</h2>${typeof ensureHomeSupplyReserves==='function'?`<div class="notice compact"><b>Stable Supplies:</b> ${Math.round(ensureHomeSupplyReserves().supplies.stable||0)}% • ${homeStableSupplyStatus()} • daily use ${homeStableSupplyDailyUse()}${homeStableEmergency()?'<br><span class="danger-text"><b>Emergency husbandry:</b> breeding and animal checkout are suspended until supplies recover.</span>':''}</div>`:''}<div class="notice compact"><b>Stable Level ${lvl}/3</b> • ${stabled.length}/${hallStableCapacity()} stalls occupied • Recovery care +${5+hallStableRecoveryBonus()} fatigue/day beyond ordinary rest</div><div class="card"><h3>Stable Master</h3>${master?`<b>${esc(master.name)}</b><p>${esc(master.trait)} • Competence ${master.competence}/10 • ${master.salary}g / 14 days</p>`:'<p>No Stable Master is employed. Animals can be boarded, but professional conditioning and later breeding management require one.</p>'}${master?'':`<button id="hireStableMaster">Hire Stable Master</button>`}</div><h3>Boarded Mounts</h3>${stabledRows}<h3>Owned Mounts</h3>${availRows}<div class="dialog-footer"><button id="stableBreeding">Breeding Book</button><button id="stableCaravanMaster">Caravan Master</button><button id="stableBack">Back to Guardian Hall</button></div>`,true);
 if($('#hireStableMaster'))$('#hireStableMaster').onclick=showStableMasterCandidates;$('#stableBreeding').onclick=showMountBreeding;$('#stableCaravanMaster').onclick=showCaravanMaster;document.querySelectorAll('[data-stableboard]').forEach(b=>b.onclick=()=>hallStableBoard(b.dataset.stableboard));document.querySelectorAll('[data-stabletake]').forEach(b=>b.onclick=()=>hallStableTake(b.dataset.stabletake));$('#stableBack').onclick=()=>guardianHallRouteBack(showHomeBase)
}
