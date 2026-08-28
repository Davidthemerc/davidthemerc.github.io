function relationshipKey(a,b){return[a,b].sort().join('|')}
function defaultCompanionRelationship(a,b){const k=relationshipKey(a,b),base=COMPANION_REL_BASE[k],A=allyDef(a),B=allyDef(b);let value=base?.value??50,reason=base?.reason||SOSText("companions_relationships_party.defaultCompanionRelationship.001",A?.name||a,B?.name||b);if(!base&&A?.className===B?.className){value=55;reason=SOSText("companions_relationships_party.defaultCompanionRelationship.002",A.className,A.name,B.name)}return{value,reason,history:[],sharedBattles:0,sharedDays:0,lastSharedDay:0,reconciliationQuest:null}}
function companionRelationship(a,b){ensurePartyState();if(a===b)return{value:100,reason:SOSText("companions_relationships_party.companionRelationship.001"),history:[],sharedBattles:0,sharedDays:0};const k=relationshipKey(a,b);if(!state.party.relationships[k])state.party.relationships[k]=defaultCompanionRelationship(a,b);return state.party.relationships[k]}
function relationshipTier(v){v=Number(v)||0;return v>=82?'Close':v>=68?'Friendly':v>=57?'Comfortable':v>=44?'Neutral':v>=32?'Uneasy':v>=18?'Resentful':SOSText("companions_relationships_party.relationshipTier.001")}
function relationshipTone(v){return v>=68?'good':v<32?'bad':v<44?'warn':'neutral'}
function relationshipHistory(a,b,text,delta=0){const r=companionRelationship(a,b);const added=addRelationshipHistory(r,{day:isOpenWorld()?state.world.day:state.round,text,delta});if(added)r.value=clamp((r.value||50)+delta,0,100);return r}
function relationshipReason(a,b){const r=companionRelationship(a,b),A=state.party.members[a],B=state.party.members[b],shared=(r.sharedDays||0)+(r.sharedBattles||0);let base=r.reason;const generic=/have not formed a strong opinion of one another yet\.?$/i.test(base||'');if(generic&&shared>=3){if(r.value>=75)base=SOSText("companions_relationships_party.relationshipReason.001",A?.name||a,B?.name||b);else if(r.value>=60)base=SOSText("companions_relationships_party.relationshipReason.002",A?.name||a,B?.name||b);else if(r.value>=45)base=SOSText("companions_relationships_party.relationshipReason.003",A?.name||a,B?.name||b);else base=SOSText("companions_relationships_party.relationshipReason.004",A?.name||a,B?.name||b)}const recent=uniqueRelationshipTexts((r.history||[]).slice().reverse().map(h=>h?.text).filter(Boolean).filter(t=>!relationshipTextIsDuplicate(t,[base])),2).reverse();return recent.length?SOSText("companions_relationships_party.relationshipReason.005",base,recent.join(' ')):base}
function companionPairs(){ensurePartyState();const ids=state.allies.slice(),pairs=[];for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)pairs.push({a:ids[i],b:ids[j],r:companionRelationship(ids[i],ids[j])});return pairs}
function activeCompanionPairs(){const ids=state.party.active||[],pairs=[];for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)pairs.push({a:ids[i],b:ids[j],r:companionRelationship(ids[i],ids[j])});return pairs}
function noteSharedCompanionDay(){if(!isOpenWorld())return;for(const {a,b,r} of activeCompanionPairs()){if(r.lastSharedDay===state.world.day)continue;r.lastSharedDay=state.world.day;r.sharedDays=(r.sharedDays||0)+1;if(r.value<44&&r.sharedDays%4===0)relationshipHistory(a,b,SOSText("companions_relationships_party.noteSharedCompanionDay.001"),1);else if(r.value>=44&&r.value<68&&r.sharedDays%6===0)relationshipHistory(a,b,SOSText("companions_relationships_party.noteSharedCompanionDay.002"),1)}}
function noteSharedCompanionBattle(){for(const {a,b,r} of activeCompanionPairs()){r.sharedBattles=(r.sharedBattles||0)+1;if(r.sharedBattles%3===0)relationshipHistory(a,b,SOSText("companions_relationships_party.noteSharedCompanionBattle.001"),r.value<44?2:1)}}
function relationshipQuestAvailable(a,b){const r=companionRelationship(a,b);return r.value<44&&(r.sharedDays>=3||r.sharedBattles>=2)&&!r.reconciliationQuest}
function startRelationshipQuest(a,b){const r=companionRelationship(a,b),A=state.party.members[a],B=state.party.members[b];r.reconciliationQuest={startedDay:isOpenWorld()?state.world.day:state.round,startBattles:r.sharedBattles||0,startDays:r.sharedDays||0,status:'active'};relationshipHistory(a,b,SOSText("companions_relationships_party.startRelationshipQuest.001",A.name,B.name),1);save();actionResult(SOSText("companions_relationships_party.startRelationshipQuest.002"),SOSText("companions_relationships_party.startRelationshipQuest.003",A.name,B.name),'info',()=>showPairRelationship(a,b))}
function checkRelationshipQuests(){for(const {a,b,r} of companionPairs()){const q=r.reconciliationQuest;if(!q||q.status!=='active')continue;const bg=(r.sharedBattles||0)-q.startBattles,dg=(r.sharedDays||0)-q.startDays;if(bg>=3||dg>=6){q.status='complete';relationshipHistory(a,b,SOSText("companions_relationships_party.checkRelationshipQuests.001"),10);adjustTrust(a,2);adjustTrust(b,2);log(SOSText("companions_relationships_party.checkRelationshipQuests.002",state.party.members[a].name,state.party.members[b].name),'good')}}}
function talkAboutCompanion(a,b){const A=state.party.members[a],B=state.party.members[b],r=companionRelationship(a,b),low=r.value<44;overlay(SOSText("companions_relationships_party.talkAboutCompanion.001",esc(A.name),esc(B.name),relationshipTone(r.value),esc(relationshipTier(r.value)),esc(relationshipReason(a,b)),low?`<button id="relProfessional">Ask them to keep it professional</button><button id="relUnderstand">Ask what the problem is</button>${relationshipQuestAvailable(a,b)?'<button id="relQuest">Suggest they try working together deliberately</button>':''}`:'<button id="relEncourage">Encourage the friendship</button>'));if($('#relProfessional'))$('#relProfessional').onclick=()=>{relationshipHistory(a,b,SOSText("companions_relationships_party.talkAboutCompanion.002",A.name),2);adjustTrust(a,1);save();showPairRelationship(a,b)};if($('#relUnderstand'))$('#relUnderstand').onclick=()=>actionResult(A.name,relationshipReason(a,b),'info',()=>talkAboutCompanion(a,b));if($('#relQuest'))$('#relQuest').onclick=()=>startRelationshipQuest(a,b);if($('#relEncourage'))$('#relEncourage').onclick=()=>{relationshipHistory(a,b,SOSText("companions_relationships_party.talkAboutCompanion.003",A.name),1);save();showPairRelationship(a,b)};$('#relTalkBack').onclick=()=>showPairRelationship(a,b)}
function showPairRelationship(a,b){modalRouteEnter(SOSText("companions_relationships_party.showPairRelationship.001"),Array.from(arguments));const A=state.party.members[a],B=state.party.members[b];if(!A||!B)return showPartyRelationships();const r=companionRelationship(a,b),q=r.reconciliationQuest,h=(r.history||[]).slice().reverse(),drivers=relationshipDrivers(a,b),help=uniqueRelationshipTexts(drivers.pos.slice().reverse().map(x=>x.text),3),hurt=uniqueRelationshipTexts(drivers.neg.slice().reverse().map(x=>x.text),3);overlay(SOSText("companions_relationships_party.showPairRelationship.002",esc(A.name),esc(B.name),relationshipTone(r.value),esc(relationshipTier(r.value)),r.value,r.value,esc(relationshipReason(a,b)),help.length?`<div class="relationship-driver positive"><b>What has helped</b><br>${help.map(x=>esc(x)).join('<br>')}</div>`:'',hurt.length?`<div class="relationship-driver negative"><b>What has hurt</b><br>${hurt.map(x=>esc(x)).join('<br>')}</div>`:'',r.sharedDays||0,r.sharedBattles||0,q?`<div class="notice ${q.status==='complete'?'success':''}"><b>Shared Ground: ${q.status==='complete'?'Resolved':'In progress'}</b><br>${q.status==='active'?'Keep both companions active. Reconciliation completes after 6 shared travel days or 3 shared battles from the start of this effort.':'Their relationship improved through shared experience.'}</div>`:'',h.length?(()=>{const seen=[],rows=[];for(const x of h){if(!x?.text||relationshipTextIsDuplicate(x.text,seen))continue;seen.push(x.text);rows.push(`<div class="card compact"><small>${isOpenWorld()?'Day':'Round'} ${x.day}</small><br>${esc(x.text)} ${x.delta?`<b>${x.delta>0?'+':''}${x.delta}</b>`:''}</div>`)}return rows.join('')})():'<p class="muted">They do not have much shared history yet.</p>',esc(A.name),esc(B.name),esc(B.name),esc(A.name),relationshipQuestAvailable(a,b)?'<button id="pairQuest">Try to Help Them Find Common Ground</button>':''));$('#talkA').onclick=()=>talkAboutCompanion(a,b);$('#talkB').onclick=()=>talkAboutCompanion(b,a);if($('#pairQuest'))$('#pairQuest').onclick=()=>startRelationshipQuest(a,b);$('#pairBack').onclick=()=>SOSServices.navigation.back(showPartyRelationships)}
function showPartyRelationships(){modalRouteEnter(SOSText("companions_relationships_party.showPartyRelationships.001"),Array.from(arguments));ensurePartyState();const pairs=companionPairs().sort((x,y)=>x.r.value-y.r.value),low=pairs.filter(x=>x.r.value<44).length;overlay(SOSText("companions_relationships_party.showPartyRelationships.002",low?`<div class="warning notice"><b>${low} strained relationship${low===1?'':'s'}</b> in the roster. Open a pair to discuss it.</div>`:'',pairs.map(({a,b,r})=>`<button class="relationship-pair relation-${relationshipTone(r.value)}" data-pair="${a}|${b}"><span><b>${esc(state.party.members[a].name)}</b> ↔ <b>${esc(state.party.members[b].name)}</b><small>${esc(relationshipTier(r.value))} • ${r.sharedDays||0} shared days • ${r.sharedBattles||0} battles</small></span><b>${r.value}</b></button>`).join('')||'<div class="notice muted">Recruit at least two companions to see party relationships.</div>'),true);document.querySelectorAll('[data-pair]').forEach(b=>b.onclick=()=>{const [a,c]=b.dataset.pair.split('|');showPairRelationship(a,c)});$('#relationshipsBack').onclick=()=>SOSServices.navigation.back(showParty)}
function showCompanionRelationships(id){modalRouteEnter(SOSText("companions_relationships_party.showCompanionRelationships.001"),Array.from(arguments));const m=state.party.members[id];if(!m)return showParty();const rows=state.allies.filter(x=>x!==id).map(other=>({other,r:companionRelationship(id,other)})).sort((a,b)=>a.r.value-b.r.value);overlay(SOSText("companions_relationships_party.showCompanionRelationships.002",esc(m.name),rows.map(({other,r})=>`<button class="relationship-pair relation-${relationshipTone(r.value)}" data-relother="${other}"><span><b>${esc(state.party.members[other].name)}</b><small>${esc(relationshipTier(r.value))} • ${esc(r.reason)}</small></span><b>${r.value}</b></button>`).join('')||'<p class="muted">No other recruited companions yet.</p>'));document.querySelectorAll('[data-relother]').forEach(b=>b.onclick=()=>showPairRelationship(id,b.dataset.relother));$('#compRelBack').onclick=()=>showCompanionProfile(id)}

const COMPANION_HISTORY={
 spear:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.003"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.004"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.005"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.006"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.007")
 },
 archer:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.008"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.009"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.010"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.011"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.012")
 },
 scout:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.013"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.014"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.015"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.016"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.017")
 },
 healer:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.018"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.019"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.020"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.021"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.022")
 },
 defector:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.023"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.024"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.025"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.026"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.027")
 },
 spawn:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.028"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.029"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.030"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.031"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.032")
 },
 field_sellsword:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.033"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.034"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.035"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.036"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.037")
 },
 field_hunter:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.038"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.039"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.040"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.041"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.042")
 },
 field_mender:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.043"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.044"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.045"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.046"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.047")
 },
 field_guard:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.048"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.049"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.050"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.051"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.052")
 },
 field_duelist:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.053"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.054"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.055"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.056"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.057")
 },
 field_tracker:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.058"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.059"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.060"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.061"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.062")
 },
 field_arcanist:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.063"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.064"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.065"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.066"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.067")
 },
 field_sergeant:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.068"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.069"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.070"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.071"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.072")
 },
 rogue:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.073"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.074"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.075"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.076"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.077")
 },
 berserker:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.078"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.079"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.080"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.081"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.082")
 }
};


Object.assign(COMPANION_HISTORY,{
 blue_guide:{origin:SOSText("companions_relationships_party.showCompanionRelationships.083"),past:SOSText("companions_relationships_party.showCompanionRelationships.084"),joined:SOSText("companions_relationships_party.showCompanionRelationships.085"),private:SOSText("companions_relationships_party.showCompanionRelationships.086"),future:SOSText("companions_relationships_party.showCompanionRelationships.087")},
 blue_quarry:{origin:SOSText("companions_relationships_party.showCompanionRelationships.088"),past:SOSText("companions_relationships_party.showCompanionRelationships.089"),joined:SOSText("companions_relationships_party.showCompanionRelationships.090"),private:SOSText("companions_relationships_party.showCompanionRelationships.091"),future:SOSText("companions_relationships_party.showCompanionRelationships.092")},
 blue_valley:{origin:SOSText("companions_relationships_party.showCompanionRelationships.093"),past:SOSText("companions_relationships_party.showCompanionRelationships.094"),joined:SOSText("companions_relationships_party.showCompanionRelationships.095"),private:SOSText("companions_relationships_party.showCompanionRelationships.096"),future:SOSText("companions_relationships_party.showCompanionRelationships.097")},
 blue_signal:{origin:SOSText("companions_relationships_party.showCompanionRelationships.098"),past:SOSText("companions_relationships_party.showCompanionRelationships.099"),joined:SOSText("companions_relationships_party.showCompanionRelationships.100"),private:SOSText("companions_relationships_party.showCompanionRelationships.101"),future:SOSText("companions_relationships_party.showCompanionRelationships.102")},
 red_adjutant:{origin:SOSText("companions_relationships_party.showCompanionRelationships.103"),past:SOSText("companions_relationships_party.showCompanionRelationships.104"),joined:SOSText("companions_relationships_party.showCompanionRelationships.105"),private:SOSText("companions_relationships_party.showCompanionRelationships.106"),future:SOSText("companions_relationships_party.showCompanionRelationships.107")},
 red_lockrunner:{origin:SOSText("companions_relationships_party.showCompanionRelationships.108"),past:SOSText("companions_relationships_party.showCompanionRelationships.109"),joined:SOSText("companions_relationships_party.showCompanionRelationships.110"),private:SOSText("companions_relationships_party.showCompanionRelationships.111"),future:SOSText("companions_relationships_party.showCompanionRelationships.112")},
 red_grainwarden:{origin:SOSText("companions_relationships_party.showCompanionRelationships.113"),past:SOSText("companions_relationships_party.showCompanionRelationships.114"),joined:SOSText("companions_relationships_party.showCompanionRelationships.115"),private:SOSText("companions_relationships_party.showCompanionRelationships.116"),future:SOSText("companions_relationships_party.showCompanionRelationships.117")},
 red_firebreak:{origin:SOSText("companions_relationships_party.showCompanionRelationships.118"),past:SOSText("companions_relationships_party.showCompanionRelationships.119"),joined:SOSText("companions_relationships_party.showCompanionRelationships.120"),private:SOSText("companions_relationships_party.showCompanionRelationships.121"),future:SOSText("companions_relationships_party.showCompanionRelationships.122")}
});
const COMPANION_VOICE_HISTORY={
 spear:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.123"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.124"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.125"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.126"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.127")
 },
 archer:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.128"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.129"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.130"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.131"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.132")
 },
 scout:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.133"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.134"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.135"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.136"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.137")
 },
 healer:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.138"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.139"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.140"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.141"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.142")
 },
 defector:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.143"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.144"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.145"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.146"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.147")
 },
 spawn:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.148"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.149"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.150"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.151"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.152")
 },
 field_sellsword:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.153"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.154"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.155"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.156"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.157")
 },
 field_hunter:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.158"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.159"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.160"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.161"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.162")
 },
 field_mender:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.163"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.164"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.165"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.166"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.167")
 },
 field_guard:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.168"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.169"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.170"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.171"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.172")
 },
 field_duelist:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.173"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.174"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.175"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.176"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.177")
 },
 field_tracker:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.178"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.179"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.180"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.181"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.182")
 },
 field_arcanist:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.183"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.184"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.185"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.186"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.187")
 },
 field_sergeant:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.188"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.189"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.190"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.191"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.192")
 },
 rogue:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.193"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.194"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.195"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.196"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.197")
 },
 berserker:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.198"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.199"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.200"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.201"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.202")
 }
};
Object.assign(COMPANION_VOICE_HISTORY,{
 red_adjutant:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.203"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.204"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.205"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.206"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.207")
 },
 red_lockrunner:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.208"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.209"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.210"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.211"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.212")
 },
 red_grainwarden:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.213"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.214"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.215"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.216"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.217")
 },
 red_firebreak:{
  origin:SOSText("companions_relationships_party.showCompanionRelationships.218"),
  past:SOSText("companions_relationships_party.showCompanionRelationships.219"),
  joined:SOSText("companions_relationships_party.showCompanionRelationships.220"),
  private:SOSText("companions_relationships_party.showCompanionRelationships.221"),
  future:SOSText("companions_relationships_party.showCompanionRelationships.222")
 }
});

Object.assign(COMPANION_VOICE_HISTORY,{
 blue_guide:{origin:SOSText("companions_relationships_party.showCompanionRelationships.223"),past:SOSText("companions_relationships_party.showCompanionRelationships.224"),joined:SOSText("companions_relationships_party.showCompanionRelationships.225"),private:SOSText("companions_relationships_party.showCompanionRelationships.226"),future:SOSText("companions_relationships_party.showCompanionRelationships.227")},
 blue_quarry:{origin:SOSText("companions_relationships_party.showCompanionRelationships.228"),past:SOSText("companions_relationships_party.showCompanionRelationships.229"),joined:SOSText("companions_relationships_party.showCompanionRelationships.230"),private:SOSText("companions_relationships_party.showCompanionRelationships.231"),future:SOSText("companions_relationships_party.showCompanionRelationships.232")},
 blue_valley:{origin:SOSText("companions_relationships_party.showCompanionRelationships.233"),past:SOSText("companions_relationships_party.showCompanionRelationships.234"),joined:SOSText("companions_relationships_party.showCompanionRelationships.235"),private:SOSText("companions_relationships_party.showCompanionRelationships.236"),future:SOSText("companions_relationships_party.showCompanionRelationships.237")},
 blue_signal:{origin:SOSText("companions_relationships_party.showCompanionRelationships.238"),past:SOSText("companions_relationships_party.showCompanionRelationships.239"),joined:SOSText("companions_relationships_party.showCompanionRelationships.240"),private:SOSText("companions_relationships_party.showCompanionRelationships.241"),future:SOSText("companions_relationships_party.showCompanionRelationships.242")}
});

const COMPANION_TOPIC_DEFS=[
 {id:'origin',label:SOSText("companions_relationships_party.showCompanionRelationships.243"),trust:45},
 {id:'past',label:SOSText("companions_relationships_party.showCompanionRelationships.244"),trust:52},
 {id:'joined',label:SOSText("companions_relationships_party.showCompanionRelationships.245"),trust:58},
 {id:'private',label:SOSText("companions_relationships_party.showCompanionRelationships.246"),trust:68},
 {id:'future',label:SOSText("companions_relationships_party.showCompanionRelationships.247"),trust:78}
];
function companionMemory(m){
 if(!m.conversationMemory||typeof m.conversationMemory!=='object')m.conversationMemory={topics:{},knownTopics:{},history:[],lastDay:0,newTopics:0};
 const mem=m.conversationMemory;if(!mem.topics||typeof mem.topics!=='object')mem.topics={};if(!mem.knownTopics||typeof mem.knownTopics!=='object')mem.knownTopics={};if(!Array.isArray(mem.history))mem.history=[];
 // Migrate v1.3.9 counter-based memory into persistent canonical flags.
 for(const [id,t] of Object.entries(mem.topics))if((t?.count||0)>0)mem.knownTopics[id]=true;
 return mem
}
function companionTopicKnown(m,id){const mem=companionMemory(m);return mem.knownTopics[id]===true||(mem.topics[id]?.count||0)>0}
function companionTopicsKnown(m){return COMPANION_TOPIC_DEFS.filter(t=>companionTopicKnown(m,t.id)).length}
function companionTopicUnlocked(m,t){return companionTrust(m)>=t.trust}
function companionConversationFact(m,id){return COMPANION_VOICE_HISTORY[m.id]?.[id]||COMPANION_HISTORY[m.id]?.[id]||SOSText("companions_relationships_party.companionConversationFact.001")}
function companionConversationRepeat(m,id){const mem=companionMemory(m),topic=mem.topics[id],fact=companionConversationFact(m,id),count=topic?.count||0;if(count<=0)return fact;if(m.id==='rogue')return count%2?SOSText("companions_relationships_party.companionConversationRepeat.001",fact):SOSText("companions_relationships_party.companionConversationRepeat.002",fact);return count%3===0?SOSText("companions_relationships_party.companionConversationRepeat.003",fact):SOSText("companions_relationships_party.companionConversationRepeat.004",fact)}
function rememberCompanionTopic(m,id,text){
 const mem=companionMemory(m),t=mem.topics[id]||{count:0,firstDay:null,lastDay:null};const first=!companionTopicKnown(m,id);t.count=(t.count||0)+1;t.firstDay=t.firstDay??(isOpenWorld()?state.world.day:state.round);t.lastDay=isOpenWorld()?state.world.day:state.round;mem.topics[id]=t;mem.knownTopics[id]=true;mem.history.push({day:t.lastDay,topic:id,text});mem.history=mem.history.slice(-15);if(first){mem.newTopics=(mem.newTopics||0)+1;adjustTrust(m.id,1)}return first
}
function latestCompletedContract(){return [...(state.world?.quests||[])].reverse().find(q=>q.status==='complete')}
function latestRoadEvent(){return (state.world?.roadEventHistory||[]).slice(-1)[0]||null}
function companionRecentOpinion(m){
 const q=isOpenWorld()?latestCompletedContract():null,e=isOpenWorld()?latestRoadEvent():null,rogue=m.id==='rogue';
 if(q){
   if(rogue)return q.type==='escort'?SOSText("companions_relationships_party.companionRecentOpinion.001"):SOSText("companions_relationships_party.companionRecentOpinion.002",q.name);
   const cls=m.className||allyDef(m.id)?.className;
   if(q.type==='escort')return cls===SOSText("companions_relationships_party.companionRecentOpinion.003")?SOSText("companions_relationships_party.companionRecentOpinion.004"):SOSText("companions_relationships_party.companionRecentOpinion.005",q.name);
   if(q.type==='diplomacy')return SOSText("companions_relationships_party.companionRecentOpinion.006");
   if(q.type==='hunt')return SOSText("companions_relationships_party.companionRecentOpinion.007");
   return SOSText("companions_relationships_party.companionRecentOpinion.008",q.name)
 }
 if(e)return rogue?SOSText("companions_relationships_party.companionRecentOpinion.009",e.title.toLowerCase()):SOSText("companions_relationships_party.companionRecentOpinion.010",e.title.toLowerCase());
 return rogue?SOSText("companions_relationships_party.companionRecentOpinion.011"):SOSText("companions_relationships_party.companionRecentOpinion.012")
}
function companionLocationOpinion(m){
 const rogue=m.id==='rogue';
 if(!isOpenWorld())return rogue?SOSText("companions_relationships_party.companionLocationOpinion.001"):SOSText("companions_relationships_party.companionLocationOpinion.002");
 const id=state.world.location,loc=worldLocation(id),cls=m.className||allyDef(m.id)?.className;
 if(id==='zion')return m.id==='blue_quarry'?SOSText("companions_relationships_party.companionLocationOpinion.003"):m.id==='blue_valley'?SOSText("companions_relationships_party.companionLocationOpinion.004"):m.id==='blue_signal'?SOSText("companions_relationships_party.companionLocationOpinion.005"):SOSText("companions_relationships_party.companionLocationOpinion.006");
 if(id==='lowcreek')return m.id==='blue_guide'?SOSText("companions_relationships_party.companionLocationOpinion.007"):SOSText("companions_relationships_party.companionLocationOpinion.008");
 if(id==='norwegian')return m.id==='blue_valley'?SOSText("companions_relationships_party.companionLocationOpinion.009"):SOSText("companions_relationships_party.companionLocationOpinion.010");
 if(id==='winterstone')return m.id==='blue_quarry'?SOSText("companions_relationships_party.companionLocationOpinion.011"):SOSText("companions_relationships_party.companionLocationOpinion.012");
 if(id==='skybreak')return m.id==='blue_signal'?SOSText("companions_relationships_party.companionLocationOpinion.013"):SOSText("companions_relationships_party.companionLocationOpinion.014");
 if(id==='sengia')return m.id==='red_adjutant'?SOSText("companions_relationships_party.companionLocationOpinion.015"):m.id==='red_grainwarden'?SOSText("companions_relationships_party.companionLocationOpinion.016"):m.id==='red_lockrunner'?SOSText("companions_relationships_party.companionLocationOpinion.017"):SOSText("companions_relationships_party.companionLocationOpinion.018");
 if(id==='lockwood')return m.id==='red_lockrunner'?SOSText("companions_relationships_party.companionLocationOpinion.019"):m.id==='red_adjutant'?SOSText("companions_relationships_party.companionLocationOpinion.020"):SOSText("companions_relationships_party.companionLocationOpinion.021");
 if(id==='briarlake')return m.id==='red_grainwarden'?SOSText("companions_relationships_party.companionLocationOpinion.022"):m.id==='blue_valley'?SOSText("companions_relationships_party.companionLocationOpinion.023"):SOSText("companions_relationships_party.companionLocationOpinion.024");
 if(id==='glenbrook')return m.id==='red_adjutant'?SOSText("companions_relationships_party.companionLocationOpinion.025"):SOSText("companions_relationships_party.companionLocationOpinion.026");
 if(id==='tyrdon')return m.id==='red_grainwarden'?SOSText("companions_relationships_party.companionLocationOpinion.027"):m.id==='red_adjutant'?SOSText("companions_relationships_party.companionLocationOpinion.028"):SOSText("companions_relationships_party.companionLocationOpinion.029");
 if(id==='pyreglade')return m.id==='red_firebreak'?SOSText("companions_relationships_party.companionLocationOpinion.030"):m.id==='red_adjutant'?SOSText("companions_relationships_party.companionLocationOpinion.031"):SOSText("companions_relationships_party.companionLocationOpinion.032");
 if(id==='grainvalley')return m.id==='red_grainwarden'?SOSText("companions_relationships_party.companionLocationOpinion.033"):m.id==='blue_valley'?SOSText("companions_relationships_party.companionLocationOpinion.034"):SOSText("companions_relationships_party.companionLocationOpinion.035");
 if(id==='lockwoodforest')return m.id==='red_lockrunner'?SOSText("companions_relationships_party.companionLocationOpinion.036"):SOSText("companions_relationships_party.companionLocationOpinion.037");
 if(id==='pyreslopes')return m.id==='red_firebreak'?SOSText("companions_relationships_party.companionLocationOpinion.038"):SOSText("companions_relationships_party.companionLocationOpinion.039");
 if(id==='shantium')return rogue?SOSText("companions_relationships_party.companionLocationOpinion.040"):SOSText("companions_relationships_party.companionLocationOpinion.041");
 if(id==='redoubt')return m.id==='defector'?SOSText("companions_relationships_party.companionLocationOpinion.042"):rogue?SOSText("companions_relationships_party.companionLocationOpinion.043"):SOSText("companions_relationships_party.companionLocationOpinion.044");
 if(/woods|forest/i.test(loc.name))return cls===SOSText("companions_relationships_party.companionLocationOpinion.045")?SOSText("companions_relationships_party.companionLocationOpinion.046"):rogue?SOSText("companions_relationships_party.companionLocationOpinion.047"):SOSText("companions_relationships_party.companionLocationOpinion.048");
 if(loc.type==='town'||loc.type==='settlement')return rogue?SOSText("companions_relationships_party.companionLocationOpinion.049",loc.name):SOSText("companions_relationships_party.companionLocationOpinion.050",loc.name);
 return rogue?SOSText("companions_relationships_party.companionLocationOpinion.051",loc.name):SOSText("companions_relationships_party.companionLocationOpinion.052")
}
function companionStatusSpeech(m){
 if(m.id==='rogue'){if(m.hp<=0)return SOSText("companions_relationships_party.companionStatusSpeech.001");if(m.hp<allyMaxHP(m)*.45)return SOSText("companions_relationships_party.companionStatusSpeech.002");if(!state.party.active.includes(m.id))return SOSText("companions_relationships_party.companionStatusSpeech.003");return SOSText("companions_relationships_party.companionStatusSpeech.004")}
 if(m.hp<=0)return SOSText("companions_relationships_party.companionStatusSpeech.005");
 if(m.hp<allyMaxHP(m)*.45)return SOSText("companions_relationships_party.companionStatusSpeech.006");
 if(!state.party.active.includes(m.id))return isOpenWorld()?SOSText("companions_relationships_party.companionStatusSpeech.007"):SOSText("companions_relationships_party.companionStatusSpeech.008");
 if(state.groups.some(g=>g.distance<=1))return SOSText("companions_relationships_party.companionStatusSpeech.009");
 return SOSText("companions_relationships_party.companionStatusSpeech.010")
}
function showCompanionHistory(id){modalRouteEnter(SOSText("companions_relationships_party.showCompanionHistory.001"),Array.from(arguments));
 const m=state.party.members[id];if(!m)return showParty();const known=companionTopicsKnown(m);
 overlay(SOSText("companions_relationships_party.showCompanionHistory.002",esc(m.name),known,COMPANION_TOPIC_DEFS.length,esc(m.name),COMPANION_TOPIC_DEFS.map(t=>{const unlocked=companionTopicUnlocked(m,t),seen=companionTopicKnown(m,t.id);return `<div class="history-entry ${seen?'known':unlocked?'available':'locked'}"><b>${esc(t.label)}</b><p>${seen?esc(companionConversationFact(m,t.id)):unlocked?'Not discussed yet.':`Requires ${trustTier(t.trust)} trust (${t.trust}).`}</p></div>`}).join('')),true);
 $('#historyTalk').onclick=()=>showCompanionConversation(id);$('#historyBack').onclick=()=>showCompanionProfile(id)
}
function discussCompanionTopic(id,topic){
 const m=state.party.members[id],def=COMPANION_TOPIC_DEFS.find(t=>t.id===topic);if(!m||!def||!companionTopicUnlocked(m,def))return showCompanionConversation(id);
 const text=companionConversationRepeat(m,topic),first=rememberCompanionTopic(m,topic,text);save();
 actionResult(m.name,`${text}${first?`\n\nThe Guardian understands ${m.name} a little better.`:''}`,'info',()=>showCompanionConversation(id))
}
function casualCompanionTalk(id,topic){
 const m=state.party.members[id];if(!m)return showParty();const mem=companionMemory(m),period=companionInteractionPeriod(),fresh=mem.lastDay!==period;let text='';
 if(topic==='status')text=companionStatusSpeech(m);
 if(topic==='place')text=companionLocationOpinion(m);
 if(topic==='recent')text=companionRecentOpinion(m);
 if(topic==='prepare'){m.preparedPeriod=period;m.preparedRound=state.round;text=SOSText("companions_relationships_party.casualCompanionTalk.001",m.name)}
 if(fresh&&(topic==='status'||topic==='prepare')){mem.lastDay=period;adjustTrust(id,1)}
 mem.history.push({day:period,topic,text});mem.history=mem.history.slice(-15);save();actionResult(m.name,text,'info',()=>showCompanionConversation(id))
}
function showParty(){modalRouteEnter(SOSText("companions_relationships_party.showParty.001"),Array.from(arguments));
 ensurePartyState();const limit=partyLimit(),captiveIds=new Set(isOpenWorld()?Object.keys(state.world.captiveCompanions||{}):[]),byJoin=(a,b)=>(a.recruitedRound||1)-(b.recruitedRound||1),active=partyMembers(true).filter(m=>!captiveIds.has(m.id)).slice().sort(byJoin),reserve=partyMembers(false).filter(m=>!state.party.active.includes(m.id)&&!captiveIds.has(m.id)).sort(byJoin);
 const cards=(list,isActive)=>list.map(m=>{const cls=allyDef(m.id)?.className||m.className||SOSText("companions_relationships_party.showParty.002"),trust=companionTrust(m);return SOSText("companions_relationships_party.showParty.003",m.hp<=0?'down':'',esc(m.name),esc(m.title),esc(cls),m.level,esc(m.recruitmentOrigin||'recruited'),companionTopicsKnown(m),COMPANION_TOPIC_DEFS.length,m.personalGold||0,Math.max(0,m.hp),allyMaxHP(m),esc(allyWeapon(m).name),trustTier(trust),trust,trust,esc(companionPerkText(m)),m.id,m.id,m.id,isActive?`<button data-reserve="${m.id}">Move to Reserve</button>`:`<button data-activate="${m.id}" ${state.party.active.length>=limit||m.hp<=0?'disabled':''}>Add to Active Party</button>`)}).join('');
 const syn=partyTrustSynergy(),intro=isOpenWorld()?SOSText("companions_relationships_party.showParty.004",limit,limit===1?'':'s'):SOSText("companions_relationships_party.showParty.005",limit,limit===1?'':'s',state.round<PARTY_UNLOCK_ROUND?` A third field slot opens in Siege Round ${PARTY_UNLOCK_ROUND}.`:'');
 overlay(SOSText("companions_relationships_party.showParty.006",intro,captiveIds.size?`<div class="warning notice"><b>${captiveIds.size} companion${captiveIds.size===1?' is':'s are'} missing in captivity.</b> Check the World Journal for their last known location and rescue options.</div>`:'',syn.accuracy?'<div class="success notice compact"><b>Trusted Company:</b> two or more active companions are Loyal or better. Party accuracy and defense are improved.</div>':'',active.length,limit,cards(active,true)||'<div class="notice muted">No companions are currently assigned.</div>',isOpenWorld()?'Guardian Hall Reserve':'Reserve',cards(reserve,false)||'<div class="notice muted">No recruited companions are waiting in reserve.</div>',footer()),true);
 $('#partyRelationships').onclick=showPartyRelationships;document.querySelectorAll('[data-companion]').forEach(b=>b.onclick=()=>showCompanionProfile(b.dataset.companion));document.querySelectorAll('[data-partygear]').forEach(b=>b.onclick=()=>showInventory(b.dataset.partygear));document.querySelectorAll('[data-outfit]').forEach(b=>b.onclick=()=>showOutfitter(b.dataset.outfit,'party'));document.querySelectorAll('[data-reserve]').forEach(b=>b.onclick=()=>{state.party.active=state.party.active.filter(id=>id!==b.dataset.reserve);save();showParty()});document.querySelectorAll('[data-activate]').forEach(b=>b.onclick=()=>{const id=b.dataset.activate,m=state.party.members[id];if(m&&m.hp>0&&state.party.active.length<limit&&!state.party.active.includes(id)){state.party.active.push(id);save()}showParty()});wireClose()
}
function showCompanionProfile(id){modalRouteEnter(SOSText("companions_relationships_party.showCompanionProfile.001"),Array.from(arguments));
 ensurePartyState();const m=state.party.members[id];if(!m)return showParty();const d=companionData(id),trust=companionTrust(m),active=state.party.active.includes(id),known=companionTopicsKnown(m),roadMoments=isOpenWorld()?roadLifeState().history.filter(x=>x.result&&x.result.includes(m.name)).slice(-2):[],storyDef=isOpenWorld()?companionStoryDef(id):null,story=storyDef?companionStoryState(id):{status:'locked'};
 overlay(SOSText("companions_relationships_party.showCompanionProfile.002",esc(m.name),esc(m.title),esc(m.className||'Unclassed'),m.level,active?'Active Company':isOpenWorld()?'Guardian Hall Reserve':'Shantium Reserve',trustTier(trust),trust,trust,esc(d.trait),esc(d.perk),esc(companionContextLine(m)),known,COMPANION_TOPIC_DEFS.length,m.personalGold||0,m.battles||0,m.rescues||0,roadMoments.length?`<div class="notice compact"><b>Recent road life:</b><br>${roadMoments.map(x=>esc(x.title)).join("<br>")}</div>`:"",storyDef?`<button id="compStory">Personal Story — ${esc(story.status==='locked'&&companionStoryEligible(id)?'Available':story.status)}</button>`:''));
 $('#compTalk').onclick=()=>showCompanionConversation(id);$('#compHistory').onclick=()=>showCompanionHistory(id);if($('#compStory'))$('#compStory').onclick=()=>showCompanionStory(id);$('#compRelations').onclick=()=>showCompanionRelationships(id);$('#compGear').onclick=()=>showInventory(id);$('#compBack').onclick=()=>SOSServices.navigation.back(showParty)
}
function showCompanionConversation(id){modalRouteEnter(SOSText("companions_relationships_party.showCompanionConversation.001"),Array.from(arguments));
 const m=state.party.members[id];if(!m)return showParty();const trust=companionTrust(m),known=companionTopicsKnown(m);
 overlay(SOSText("companions_relationships_party.showCompanionConversation.002",esc(m.name),esc(companionContextLine(m)),trustTier(trust),trust,known,COMPANION_TOPIC_DEFS.length,isOpenWorld()?`<button data-casualtopic="place">What do you think of this place?</button><button data-casualtopic="recent">Anything on your mind?</button><button id="talkRoadLife">Road life / camp moments</button><button id="talkLoyalty">Loyalty / shared history</button>${companionExplorationDef(id)?'<button id="talkExpedition">Personal expedition</button>':''}`:'',COMPANION_TOPIC_DEFS.map(t=>{const unlocked=companionTopicUnlocked(m,t),seen=companionTopicKnown(m,t.id);return `<button data-historytopic="${t.id}" ${unlocked?'':'disabled'}><b>${esc(t.label)}</b><br><small>${seen?'Discussed before':unlocked?'New topic':`Requires ${trustTier(t.trust)} trust`}</small></button>`}).join('')),true);
 document.querySelectorAll('[data-casualtopic]').forEach(b=>b.onclick=()=>casualCompanionTalk(id,b.dataset.casualtopic));document.querySelectorAll('[data-historytopic]').forEach(b=>b.onclick=()=>discussCompanionTopic(id,b.dataset.historytopic));$('#talkRelationships').onclick=()=>showCompanionRelationships(id);if($('#talkRoadLife'))$('#talkRoadLife').onclick=showRoadLife;if($('#talkLoyalty'))$('#talkLoyalty').onclick=()=>showCompanionLifeProfile(id);if($('#talkExpedition'))$('#talkExpedition').onclick=()=>{const q=companionExplorationQuest(id);if(q.status==='locked'&&companionExplorationEligible(id))q.status='available';showCompanionExplorationQuest(id)};$('#talkHistory').onclick=()=>showCompanionHistory(id);$('#talkCancel').onclick=()=>showCompanionProfile(id)
}
function upgradeMark(it,ownerId='guardian'){
 if(!it||!it.slot)return'';const o=ownerFor(ownerId),cur=fitEffectiveItem(o?.equipment?.[it.slot],ownerId),d=gearUtility(it,ownerClassName(ownerId),'balanced',ownerId)-gearUtility(cur,ownerClassName(ownerId),'balanced',ownerId);return d>4?'<span class="upgrade-badge">▲ UPGRADE</span>':d<-4?'<span class="downgrade-badge">▼ weaker</span>':SOSText("companions_relationships_party.upgradeMark.001")
}
function bindWeapon(id,ownerId='guardian',source='pack'){
 const it=rawItem(id);if(!it||it.slot!=='weapon')return;
 const replacing=!!meta.boundWeapon&&meta.boundWeapon!==id,oldBound=meta.boundWeapon,oldName=oldBound?(rawItem(oldBound)?.name||meta.boundHistory?.name||oldBound):'';
 overlay(SOSText("companions_relationships_party.bindWeapon.001",esc(it.name),esc(it.name),replacing?`<p>This permanently replaces <b>${esc(oldName)}</b> as your bound weapon.</p>`:''),false,true);
 $('#bindConfirm').onclick=()=>{
   let legacy=null,newId=id;
   // Shared catalog IDs must become a unique custom instance. Existing unique/custom IDs may be bound directly.
   if(ITEMS.some(x=>x.id===id)){
     legacy=makeLegacyInstance(id);if(!legacy)return showInventory(ownerId);
     newId=legacy.id;
     const owner=ownerFor(ownerId);
     if(source==='equipped'&&owner?.equipment?.weapon===id)owner.equipment.weapon=newId;
     else if(!replaceOneInventoryItemId(id,newId)){
       // Defensive fallback if the UI changed underneath the confirmation.
       if(owner?.equipment?.weapon===id)owner.equipment.weapon=newId;else return showInventory(ownerId)
     }
   }else legacy=rawItem(id);
   const preserve=meta.boundHistory?.id===oldBound&&oldBound===id;
   meta.boundWeapon=newId;meta.boundItem={...(rawItem(newId)||legacy)};
   meta.boundHistory={id:newId,name:(rawItem(newId)||legacy).name,campaigns:preserve?(meta.boundHistory.campaigns||0):0,battles:preserve?(meta.boundHistory.battles||0):0,enemies:preserve?(meta.boundHistory.enemies||0):0,commanders:preserve?(meta.boundHistory.commanders||0):0,wielders:Array.from(new Set([...(preserve?(meta.boundHistory.wielders||[]):[]),ownerId==='guardian'?state.name:state.party.members[ownerId]?.name||state.name]))};
   state.flags.legacyWeapon=newId;saveMeta();save();log(SOSText("companions_relationships_party.bindWeapon.002",(rawItem(newId)||legacy).name),'good');showInventory(ownerId)
 };
 $('#bindCancel').onclick=()=>showInventory(ownerId)
}
