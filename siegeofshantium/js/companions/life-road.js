function showPersistentCompanion(id){modalRouteEnter(SOSText("companions_life_road.showPersistentCompanion.001"),Array.from(arguments));
 ensureWorldState();const c=state.world.companions[id],a=allyDef(id);if(!c||!a||state.allies.includes(id))return renderOpenWorld();
 if(c.location!==state.world.location){c.known=false;save();return actionResult(SOSText("companions_life_road.showPersistentCompanion.002"),SOSText("companions_life_road.showPersistentCompanion.003",a.name),'info',renderOpenWorld)}
 const cooling=state.world.day<c.cooldownUntil;if(c.trouble){return overlay(SOSText("companions_life_road.showPersistentCompanion.004",esc(a.name),esc(a.desc),esc(a.name))),$('#helpCompWorld').onclick=()=>{advanceWorldDays(1,SOSText("companions_life_road.showPersistentCompanion.005",a.name));c.trouble=false;c.disposition=Math.min(6,(c.disposition||0)+2);state.reputation++;save();actionResult(SOSText("companions_life_road.showPersistentCompanion.006"),SOSText("companions_life_road.showPersistentCompanion.007",a.name),'good',renderOpenWorld)},wireClose()}
 overlay(SOSText("companions_life_road.showPersistentCompanion.008",esc(a.name),esc(a.title),esc(a.className),esc(a.desc),id.startsWith('red_')?`<div class="redstone-companion-note"><b>Redstone-region perspective</b><br>${esc(regionalRecruitConversation(id))}</div>`:'',c.disposition>=3?'Warm':c.disposition>=0?'Neutral':'Cool',cooling?` • Not ready to reconsider until Day ${c.cooldownUntil}`:'',cooling?'disabled':'',esc(a.name)));
 $('#compRecruitWorld').onclick=()=>attemptPersistentRecruit(id);$('#compTalkWorld').onclick=()=>worldCompanionTalk(id);wireClose();
}

const COMPANION_VALUES={
 spear:{likes:[SOSText("companions_life_road.showPersistentCompanion.009"),SOSText("companions_life_road.showPersistentCompanion.010")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.011"),SOSText("companions_life_road.showPersistentCompanion.012")]},
 archer:{likes:[SOSText("companions_life_road.showPersistentCompanion.013")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.014")]},
 scout:{likes:[SOSText("companions_life_road.showPersistentCompanion.015")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.016")]},
 healer:{likes:[SOSText("companions_life_road.showPersistentCompanion.017"),SOSText("companions_life_road.showPersistentCompanion.018")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.019"),SOSText("companions_life_road.showPersistentCompanion.020")]},
 defector:{likes:[SOSText("companions_life_road.showPersistentCompanion.021")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.022")]},
 spawn:{likes:[SOSText("companions_life_road.showPersistentCompanion.023")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.024")]},
 rogue:{likes:[SOSText("companions_life_road.showPersistentCompanion.025")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.026")]},
 berserker:{likes:[SOSText("companions_life_road.showPersistentCompanion.027")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.028")]}
};
Object.assign(COMPANION_VALUES,{
 blue_guide:{likes:[SOSText("companions_life_road.showPersistentCompanion.029"),SOSText("companions_life_road.showPersistentCompanion.030")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.031"),SOSText("companions_life_road.showPersistentCompanion.032")]},
 blue_quarry:{likes:[SOSText("companions_life_road.showPersistentCompanion.033"),SOSText("companions_life_road.showPersistentCompanion.034")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.035")]},
 blue_valley:{likes:[SOSText("companions_life_road.showPersistentCompanion.036"),SOSText("companions_life_road.showPersistentCompanion.037")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.038")]},
 blue_signal:{likes:[SOSText("companions_life_road.showPersistentCompanion.039"),SOSText("companions_life_road.showPersistentCompanion.040")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.041"),SOSText("companions_life_road.showPersistentCompanion.042")]},
 red_adjutant:{likes:[SOSText("companions_life_road.showPersistentCompanion.043"),SOSText("companions_life_road.showPersistentCompanion.044")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.045"),SOSText("companions_life_road.showPersistentCompanion.046")]},
 red_lockrunner:{likes:[SOSText("companions_life_road.showPersistentCompanion.047"),SOSText("companions_life_road.showPersistentCompanion.048")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.049"),SOSText("companions_life_road.showPersistentCompanion.050")]},
 red_grainwarden:{likes:[SOSText("companions_life_road.showPersistentCompanion.051"),SOSText("companions_life_road.showPersistentCompanion.052")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.053"),SOSText("companions_life_road.showPersistentCompanion.054")]},
 red_firebreak:{likes:[SOSText("companions_life_road.showPersistentCompanion.055"),SOSText("companions_life_road.showPersistentCompanion.056")],dislikes:[SOSText("companions_life_road.showPersistentCompanion.057"),SOSText("companions_life_road.showPersistentCompanion.058")]}
});


const ROAD_LIFE_PLACE_LINES={
 woods:[SOSText("companions_life_road.showPersistentCompanion.059"),SOSText("companions_life_road.showPersistentCompanion.060")],
 marsh:[SOSText("companions_life_road.showPersistentCompanion.061"),SOSText("companions_life_road.showPersistentCompanion.062")],
 quarry:[SOSText("companions_life_road.showPersistentCompanion.063"),SOSText("companions_life_road.showPersistentCompanion.064")],
 watchfort:[SOSText("companions_life_road.showPersistentCompanion.065"),SOSText("companions_life_road.showPersistentCompanion.066")],
 river:[SOSText("companions_life_road.showPersistentCompanion.067"),SOSText("companions_life_road.showPersistentCompanion.068")],
 stonebridge:[SOSText("companions_life_road.showPersistentCompanion.069"),SOSText("companions_life_road.showPersistentCompanion.070")],
 northgate:[SOSText("companions_life_road.showPersistentCompanion.071"),SOSText("companions_life_road.showPersistentCompanion.072")],
 southroad:[SOSText("companions_life_road.showPersistentCompanion.073"),SOSText("companions_life_road.showPersistentCompanion.074")],
 redoubt:[SOSText("companions_life_road.showPersistentCompanion.075"),SOSText("companions_life_road.showPersistentCompanion.076")],
 shantium:[SOSText("companions_life_road.showPersistentCompanion.077"),SOSText("companions_life_road.showPersistentCompanion.078")]
};
Object.assign(ROAD_LIFE_PLACE_LINES,{
 zion:[SOSText("companions_life_road.showPersistentCompanion.079"),SOSText("companions_life_road.showPersistentCompanion.080")],
 lowcreek:[SOSText("companions_life_road.showPersistentCompanion.081"),SOSText("companions_life_road.showPersistentCompanion.082")],
 ebonheart:[SOSText("companions_life_road.showPersistentCompanion.083"),SOSText("companions_life_road.showPersistentCompanion.084")],
 norwegian:[SOSText("companions_life_road.showPersistentCompanion.085"),SOSText("companions_life_road.showPersistentCompanion.086")],
 winterstone:[SOSText("companions_life_road.showPersistentCompanion.087"),SOSText("companions_life_road.showPersistentCompanion.088")],
 skybreak:[SOSText("companions_life_road.showPersistentCompanion.089"),SOSText("companions_life_road.showPersistentCompanion.090")],
 ziongorge:[SOSText("companions_life_road.showPersistentCompanion.091"),SOSText("companions_life_road.showPersistentCompanion.092")],
 crownpass:[SOSText("companions_life_road.showPersistentCompanion.093"),SOSText("companions_life_road.showPersistentCompanion.094")]
});



Object.assign(ROAD_LIFE_PLACE_LINES,{
 sengia:[SOSText("companions_life_road.showPersistentCompanion.095"),SOSText("companions_life_road.showPersistentCompanion.096")],
 lockwood:[SOSText("companions_life_road.showPersistentCompanion.097"),SOSText("companions_life_road.showPersistentCompanion.098")],
 grayhaven:[SOSText("companions_life_road.showPersistentCompanion.099"),SOSText("companions_life_road.showPersistentCompanion.100")],
 briarlake:[SOSText("companions_life_road.showPersistentCompanion.101"),SOSText("companions_life_road.showPersistentCompanion.102")],
 glenbrook:[SOSText("companions_life_road.showPersistentCompanion.103"),SOSText("companions_life_road.showPersistentCompanion.104")],
 tyrdon:[SOSText("companions_life_road.showPersistentCompanion.105"),SOSText("companions_life_road.showPersistentCompanion.106")],
 pyreglade:[SOSText("companions_life_road.showPersistentCompanion.107"),SOSText("companions_life_road.showPersistentCompanion.108")],
 grainvalley:[SOSText("companions_life_road.showPersistentCompanion.109"),SOSText("companions_life_road.showPersistentCompanion.110")]
});
function companionLifeState(){ensureWorldState();return state.world.companionLife}
function companionDecisionState(id){const C=companionLifeState();if(!C.decisions[id])C.decisions[id]={supported:0,opposed:0,heard:0,dismissed:0,last:null};return C.decisions[id]}
function companionSharedMemory(id,type,text,locId=state.world.location){
 const m=state.party.members[id];if(!m)return;const mem=companionMemory(m);mem.history.push({day:state.world.day,topic:`shared_${type}`,text});mem.history=mem.history.slice(-24)
}
function noteCompanionSharedEvent(type,text,ids=null,locId=state.world.location){
 if(!isOpenWorld())return;const C=companionLifeState(),members=(ids||activeRoadCompanions().map(m=>m.id)).filter(id=>state.party.members[id]);if(!members.length)return;
 const row={id:uid(),day:state.world.day,type,text,locId,members:[...members]};C.sharedEvents.push(row);C.sharedEvents=C.sharedEvents.slice(-50);for(const id of members)companionSharedMemory(id,type,text,locId);return row
}
function recentCompanionSharedEvents(id,limit=5){return companionLifeState().sharedEvents.filter(e=>e.members.includes(id)).slice(-limit).reverse()}
function recordGuardianStance(id,stance,reason,trustDelta=0){
 const m=state.party.members[id];if(!m)return;const D=companionDecisionState(id);if(stance==='support')D.supported++;else if(stance==='oppose')D.opposed++;else if(stance==='hear')D.heard++;else if(stance==='dismiss')D.dismissed++;D.last={day:state.world.day,stance,reason};if(trustDelta)adjustTrust(id,trustDelta,reason);companionSharedMemory(id,'guardian_choice',SOSText("companions_life_road.recordGuardianStance.001",reason,stance==='support'?'backed':stance==='oppose'?'opposed':stance==='hear'?'heard out':'dismissed',m.name))
}
function companionLoyaltySummary(id){
 const m=state.party.members[id],D=companionDecisionState(id);if(!m)return'';
 const trust=companionTrust(m),events=companionLifeState().sharedEvents.filter(e=>e.members.includes(id)).length;
 const positive=D.supported+D.heard,negative=D.opposed+D.dismissed,total=positive+negative,net=positive-negative;
 let bond=trust>=90?SOSText("companions_life_road.companionLoyaltySummary.001",m.name):trust>=75?SOSText("companions_life_road.companionLoyaltySummary.002",m.name):trust>=60?SOSText("companions_life_road.companionLoyaltySummary.003",m.name):trust>=45?SOSText("companions_life_road.companionLoyaltySummary.004",m.name):SOSText("companions_life_road.companionLoyaltySummary.005",m.name);
 if(events>=12)bond+=SOSText("companions_life_road.companionLoyaltySummary.006",events);else if(events>=5)bond+=SOSText("companions_life_road.companionLoyaltySummary.007",events);else if(events>0)bond+=SOSText("companions_life_road.companionLoyaltySummary.008",events,events===1?'':'s');
 let stance;if(total===0)stance=SOSText("companions_life_road.companionLoyaltySummary.009");else if(net>=4)stance=SOSText("companions_life_road.companionLoyaltySummary.010");else if(net>=1)stance=SOSText("companions_life_road.companionLoyaltySummary.011",total<4?', though only a few direct stance decisions have been recorded':'');else if(net<=-4)stance=SOSText("companions_life_road.companionLoyaltySummary.012");else if(net<=-1)stance=SOSText("companions_life_road.companionLoyaltySummary.013",total<4?', though only a few direct stance decisions have been recorded':'');else stance=SOSText("companions_life_road.companionLoyaltySummary.014");
 return `${bond} ${stance}`
}
function relationshipDrivers(a,b){
 const r=companionRelationship(a,b),h=r.history||[],pos=h.filter(x=>(x.delta||0)>0).slice(-3),neg=h.filter(x=>(x.delta||0)<0).slice(-3);return {pos,neg}
}
function normalizeRelationshipText(s){
 return String(s||'').toLowerCase()
  .replace(/\b(sela marr|bren tal|the guardian|they|them|their|each other|one another)\b/g,' ')
  .replace(/\b(repeated|several|recent|recently|more|much|very|clear|settled|positive|comfortable|working|side by side|under pressure|together)\b/g,' ')
  .replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()
}
function relationshipTextTokens(s){return new Set(normalizeRelationshipText(s).split(' ').filter(w=>w.length>2))}
function relationshipTextSimilarity(a,b){const A=relationshipTextTokens(a),B=relationshipTextTokens(b);if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;const u=A.size+B.size-n;return u?n/u:0}
function relationshipTextIsDuplicate(candidate,existing=[]){
 const c=String(candidate||'').trim();if(!c)return true;const nc=normalizeRelationshipText(c);
 return existing.some(x=>{const e=String(x||'').trim(),ne=normalizeRelationshipText(e);if(!ne||!nc)return false;if(ne===nc)return true;if(ne.includes(nc)||nc.includes(ne))return Math.min(ne.length,nc.length)>=28;return relationshipTextSimilarity(c,e)>=0.62})
}
function uniqueRelationshipTexts(items,limit=Infinity){const out=[];for(const raw of items||[]){const t=typeof raw==='string'?raw:raw?.text;if(!t||relationshipTextIsDuplicate(t,out))continue;out.push(t);if(out.length>=limit)break}return out}
function addRelationshipHistory(r,entry){
 if(!r||!entry?.text)return false;r.history=Array.isArray(r.history)?r.history:[];
 const recent=r.history.slice(-8).map(x=>x?.text).filter(Boolean);if(relationshipTextIsDuplicate(entry.text,recent))return false;
 r.history.push(entry);r.history=r.history.slice(-8);return true
}
function completedExpeditionFollowupCandidates(){
 return Object.keys(COMPANION_EXPLORATION_DEFS).filter(id=>{const q=companionExplorationQuest(id),m=state.party.members[id];return m&&q.status==='complete'&&!companionLifeState().followups[id]&&state.party.active.includes(id)})
}
function createCampScene(){
 const active=activeRoadCompanions(),C=companionLifeState();if(!active.length)return null;const follow=completedExpeditionFollowupCandidates();if(follow.length){const id=pick(follow),m=state.party.members[id],d=companionExplorationDef(id);return {type:'expedition_followup',a:id,title:SOSText("companions_life_road.createCampScene.001",m.name,d.title),summary:SOSText("companions_life_road.createCampScene.002",m.name)}}
 const recent=C.sharedEvents.filter(e=>state.world.day-e.day<=8&&e.members.some(id=>state.party.active.includes(id))).slice(-6);if(recent.length&&chance(.45)){const e=pick(recent),ids=e.members.filter(id=>state.party.active.includes(id));if(ids.length){const id=pick(ids),m=state.party.members[id];return {type:'debrief',a:id,eventId:e.id,title:SOSText("companions_life_road.createCampScene.003",m.name),summary:SOSText("companions_life_road.createCampScene.004",m.name,e.text)}}}
 const strained=activeCompanionPairs().filter(x=>x.r.value<45);if(strained.length&&chance(.35)){const x=pick(strained);return {type:'camp_pair',a:x.a,b:x.b,title:SOSText("companions_life_road.createCampScene.005",state.party.members[x.a].name,state.party.members[x.b].name),summary:SOSText("companions_life_road.createCampScene.006")}}
 const m=pick(active);return {type:'private_talk',a:m.id,title:SOSText("companions_life_road.createCampScene.007",m.name),summary:SOSText("companions_life_road.createCampScene.008",m.name)}
}
function showCompanionLifeProfile(id){modalRouteEnter(SOSText("companions_life_road.showCompanionLifeProfile.001"),Array.from(arguments));
 const m=state.party.members[id];if(!m)return showRoadLife();const D=companionDecisionState(id),allEvents=companionLifeState().sharedEvents.filter(e=>e.members.includes(id)),events=allEvents.slice(-7).reverse(),q=companionExplorationDef(id)?companionExplorationQuest(id):null;
 overlay(SOSText("companions_life_road.showCompanionLifeProfile.002",esc(m.name),esc(trustTier(companionTrust(m))),companionTrust(m),esc(companionLoyaltySummary(id)),D.supported,D.heard,D.opposed,D.dismissed,q?.status==='complete'?`<div class="notice"><b>Personal expedition completed:</b> ${esc(companionExplorationDef(id).title)}</div>`:'',allEvents.length,Math.min(7,allEvents.length),events.map(e=>`<div class="card compact"><small>Day ${e.day} • ${esc(e.type)}</small><br>${esc(e.text)}</div>`).join('')||'<p class="muted">No major shared Open World experiences have been recorded yet.</p>'),true);$('#lifeProfileBack').onclick=()=>SOSServices.navigation.back(showRoadLife)
}
function roadLifeState(){ensureWorldState();return state.world.roadLife}
function activeRoadCompanions(){return partyMembers(true).filter(m=>m.hp>0)}
function roadLifeSceneKey(scene){
 if(!scene)return'';const type=scene.type||'legacy',pair=[scene.a,scene.b].filter(Boolean).sort().join('|'),title=String(scene.title||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 if(['argument','bond','camp_pair'].includes(type))return `${type}|${pair}`;
 if(['initiative','memory'].includes(type))return `${type}|${scene.a||''}`;
 if(type==='place')return `${type}|${scene.a||''}|${scene.location||''}|${title.replace(/ after .*/,'')}`;
 if(type==='event_debrief')return `${type}|${scene.a||''}|${scene.eventId||title}|${scene.eventChoice||''}`;
 if(['debrief','private_talk','expedition_followup','companion_exploration'].includes(type))return `${type}|${pair}|${title}`;
 return `${type}|${pair}|${title}`
}
function roadLifeSceneCooldown(scene){
 const t=scene?.type||'';if(t==='memory')return 6;if(t==='initiative')return 5;if(['argument','bond','camp_pair'].includes(t))return 7;if(t==='event_debrief')return 4;if(t==='place')return 3;if(t==='camp')return 3;return 2
}
function dedupePendingRoadLifeMoments(){
 const R=roadLifeState(),seen=new Set(),perComp={};let removed=0;const keep=[];
 for(let i=R.queue.length-1;i>=0;i--){const s=R.queue[i],key=roadLifeSceneKey(s),comp=s.a||null;if(seen.has(key)){removed++;continue}if(comp&&['place','initiative','memory','debrief','private_talk','event_debrief'].includes(s.type)&&(perComp[comp]||0)>=2){removed++;continue}seen.add(key);if(comp)perComp[comp]=(perComp[comp]||0)+1;keep.push(s)}
 R.queue=keep.reverse().slice(-6);return removed
}
function roadLifePush(scene){
 const R=roadLifeState();scene.id=scene.id||uid();scene.day=state.world.day;scene.location=scene.location||state.world.location;scene.status='pending';scene.key=roadLifeSceneKey(scene);
 const existing=R.queue.find(x=>roadLifeSceneKey(x)===scene.key);if(existing)return existing;
 const cooldown=roadLifeSceneCooldown(scene),recent=[...R.history].reverse().find(x=>(x.key||roadLifeSceneKey(x))===scene.key);
 if(recent&&state.world.day-(recent.day||0)<cooldown)return null;
 R.queue.push(scene);R.queue=R.queue.slice(-6);dedupePendingRoadLifeMoments();R.lastSceneDay=state.world.day;log(`${scene.title}: ${scene.summary}`,'info');return scene
}
function roadLifeHistory(scene,result=''){
 const R=roadLifeState();scene.status='resolved';scene.resolvedDay=state.world.day;scene.result=result;R.history.push({day:state.world.day,title:scene.title,summary:scene.summary,result,type:scene.type,a:scene.a,b:scene.b,location:scene.location,key:scene.key||roadLifeSceneKey(scene)});R.history=R.history.slice(-40);R.queue=R.queue.filter(x=>x.id!==scene.id);dedupePendingRoadLifeMoments()
}
function companionRoadPlaceLine(m,locId=state.world.location){
 const lines=ROAD_LIFE_PLACE_LINES[locId]||[SOSText("companions_life_road.companionRoadPlaceLine.001")];const className=allyDef(m.id)?.className||m.className||'';
 if(className===SOSText("companions_life_road.companionRoadPlaceLine.002")&&['woods','marsh','northgate'].includes(locId))return SOSText("companions_life_road.companionRoadPlaceLine.003",m.name,pick(lines));
 if(className===SOSText("companions_life_road.companionRoadPlaceLine.004")&&['quarry','watchfort'].includes(locId))return SOSText("companions_life_road.companionRoadPlaceLine.005",m.name);
 if(m.id==='rogue')return SOSText("companions_life_road.companionRoadPlaceLine.006",m.name);
 return `${m.name} says, “${pick(lines)}”`
}
function companionRoadEventDebriefLine(m,s){
 const cls=allyDef(m.id)?.className||m.className||'',event=String(s.eventTitle||SOSText("companions_life_road.companionRoadEventDebriefLine.001")).toLowerCase(),choice=String(s.eventChoice||''),outcome=String(s.eventText||s.eventOutcome||'');
 const good=s.eventTone==='good',bad=s.eventTone==='bad';
 const specific={
  abandoned_wagon:{
   investigate:SOSText("companions_life_road.companionRoadEventDebriefLine.002"),
   salvage:SOSText("companions_life_road.companionRoadEventDebriefLine.003"),
   leave:SOSText("companions_life_road.companionRoadEventDebriefLine.004")
  },
  broken_cart:{
   help:SOSText("companions_life_road.companionRoadEventDebriefLine.005"),
   buy:SOSText("companions_life_road.companionRoadEventDebriefLine.006"),
   rob:SOSText("companions_life_road.companionRoadEventDebriefLine.007"),
   ignore:SOSText("companions_life_road.companionRoadEventDebriefLine.008")
  },
  ambush:{
   stand:SOSText("companions_life_road.companionRoadEventDebriefLine.009"),
   evade:SOSText("companions_life_road.companionRoadEventDebriefLine.010"),
   pay:SOSText("companions_life_road.companionRoadEventDebriefLine.011")
  }
 };
 const line=specific[s.eventId]?.[choice];if(line)return line;
 if(cls===SOSText("companions_life_road.companionRoadEventDebriefLine.012")||cls===SOSText("companions_life_road.companionRoadEventDebriefLine.013"))return good?SOSText("companions_life_road.companionRoadEventDebriefLine.014"):bad?SOSText("companions_life_road.companionRoadEventDebriefLine.015"):SOSText("companions_life_road.companionRoadEventDebriefLine.016",event);
 if(cls===SOSText("companions_life_road.companionRoadEventDebriefLine.017")||cls===SOSText("companions_life_road.companionRoadEventDebriefLine.018"))return good?SOSText("companions_life_road.companionRoadEventDebriefLine.019"):bad?SOSText("companions_life_road.companionRoadEventDebriefLine.020"):SOSText("companions_life_road.companionRoadEventDebriefLine.021",event);
 if(cls===SOSText("companions_life_road.companionRoadEventDebriefLine.022"))return good?SOSText("companions_life_road.companionRoadEventDebriefLine.023"):bad?SOSText("companions_life_road.companionRoadEventDebriefLine.024"):SOSText("companions_life_road.companionRoadEventDebriefLine.025");
 if(cls===SOSText("companions_life_road.companionRoadEventDebriefLine.026"))return good?SOSText("companions_life_road.companionRoadEventDebriefLine.027"):bad?SOSText("companions_life_road.companionRoadEventDebriefLine.028"):SOSText("companions_life_road.companionRoadEventDebriefLine.029");
 return good?SOSText("companions_life_road.companionRoadEventDebriefLine.030",event):bad?SOSText("companions_life_road.companionRoadEventDebriefLine.031",event):SOSText("companions_life_road.companionRoadEventDebriefLine.032",event)
}
function roadLifeMemorySummary(m){
 const ev=recentCompanionSharedEvents(m.id,4)[0],place=worldLocation(state.world.location).name;
 if(ev)return SOSText("companions_life_road.roadLifeMemorySummary.001",m.name,ev.day,ev.text);
 const options=[SOSText("companions_life_road.roadLifeMemorySummary.002",m.name,place),SOSText("companions_life_road.roadLifeMemorySummary.003",m.name),SOSText("companions_life_road.roadLifeMemorySummary.004",m.name)];
 return pick(options)
}
function roadLifeInitiativeSummary(m){
 const cls=allyDef(m.id)?.className||m.className||'',place=worldLocation(state.world.location).name;
 if([SOSText("companions_life_road.roadLifeInitiativeSummary.001"),SOSText("companions_life_road.roadLifeInitiativeSummary.002")].includes(cls))return SOSText("companions_life_road.roadLifeInitiativeSummary.003",m.name,place);
 if([SOSText("companions_life_road.roadLifeInitiativeSummary.004")].includes(cls)||m.id==='healer'||m.id==='field_mender')return SOSText("companions_life_road.roadLifeInitiativeSummary.005",m.name,place);
 if([SOSText("companions_life_road.roadLifeInitiativeSummary.006"),SOSText("companions_life_road.roadLifeInitiativeSummary.007"),SOSText("companions_life_road.roadLifeInitiativeSummary.008")].includes(cls))return SOSText("companions_life_road.roadLifeInitiativeSummary.009",m.name,place);
 return SOSText("companions_life_road.roadLifeInitiativeSummary.010",m.name,place)
}
function maybeRoadLifeScene(){
 if(!isOpenWorld()||captivityActive())return;const R=roadLifeState(),active=activeRoadCompanions();dedupePendingRoadLifeMoments();if(!active.length||state.world.day-R.lastSceneDay<1||R.queue.length>=3||!chance(.34))return;
 const pairs=activeCompanionPairs(),strained=pairs.filter(x=>x.r.value<44),close=pairs.filter(x=>x.r.value>=68),roll=rnd(1,100);
 if(strained.length&&roll<=22){const x=pick(strained),A=state.party.members[x.a],B=state.party.members[x.b];const scene={type:'argument',a:x.a,b:x.b,title:SOSText("companions_life_road.maybeRoadLifeScene.001",A.name,B.name),summary:SOSText("companions_life_road.maybeRoadLifeScene.002",A.name,B.name)};const pushed=roadLifePush(scene);if(pushed===scene)R.arguments++;return pushed}
 if(close.length&&roll<=36){const x=pick(close),A=state.party.members[x.a],B=state.party.members[x.b];return roadLifePush({type:'bond',a:x.a,b:x.b,title:SOSText("companions_life_road.maybeRoadLifeScene.003",A.name,B.name),summary:SOSText("companions_life_road.maybeRoadLifeScene.004",A.name,B.name)})}
 const shuffled=active.slice().sort(()=>Math.random()-.5),m=shuffled.find(x=>!R.queue.some(q=>q.a===x.id&&['place','initiative','memory'].includes(q.type)))||pick(active);
 if(roll<=58)return roadLifePush({type:'place',a:m.id,title:`${m.name} — ${worldLocation(state.world.location).name}`,summary:companionRoadPlaceLine(m)});
 if(roll<=79){const scene={type:'initiative',a:m.id,title:SOSText("companions_life_road.maybeRoadLifeScene.005",m.name),summary:roadLifeInitiativeSummary(m)};const pushed=roadLifePush(scene);if(pushed===scene)R.initiatives++;return pushed}
 return roadLifePush({type:'memory',a:m.id,title:SOSText("companions_life_road.maybeRoadLifeScene.006",m.name),summary:roadLifeMemorySummary(m)})
}
function roadLifeSceneDisplaySummary(scene){
 if(scene?.type==='initiative'){const m=state.party.members[scene.a];if(m)return roadLifeInitiativeSummary(m)}
 return scene?.summary||''
}
function roadInitiativeOptions(m){
 const cls=allyDef(m.id)?.className||m.className||'';
 if(cls===SOSText("companions_life_road.roadInitiativeOptions.001")||cls===SOSText("companions_life_road.roadInitiativeOptions.002"))return[[SOSText("companions_life_road.roadInitiativeOptions.003"),'scout'],[SOSText("companions_life_road.roadInitiativeOptions.004"),'ignore']];
 if(cls===SOSText("companions_life_road.roadInitiativeOptions.005")||m.id==='healer'||m.id==='field_mender')return[[SOSText("companions_life_road.roadInitiativeOptions.006"),'heal'],[SOSText("companions_life_road.roadInitiativeOptions.007"),'ignore']];
 if([SOSText("companions_life_road.roadInitiativeOptions.008"),SOSText("companions_life_road.roadInitiativeOptions.009"),SOSText("companions_life_road.roadInitiativeOptions.010")].includes(cls))return[[SOSText("companions_life_road.roadInitiativeOptions.011"),'drill'],[SOSText("companions_life_road.roadInitiativeOptions.012"),'ignore']];
 return[[SOSText("companions_life_road.roadInitiativeOptions.013"),'rest'],[SOSText("companions_life_road.roadInitiativeOptions.014"),'ignore']]
}
function resolveRoadLifeScene(id,choice){
 const R=roadLifeState(),s=R.queue.find(x=>x.id===id);if(!s)return showRoadLife();let text='',tone='info',contextLine='';
 if(s.type==='companion_exploration'){const m=state.party.members[s.a],d=companionExplorationDef(s.a);roadLifeHistory(s,SOSText("companions_life_road.resolveRoadLifeScene.001",m.name,worldLocation(d.site).name));save();return startCompanionExplorationQuest(s.a)}
 if(s.type==='event_debrief'){
   const m=state.party.members[s.a],line=companionRoadEventDebriefLine(m,s);
   if(choice==='ask'){adjustTrust(s.a,1);text=SOSText("companions_life_road.resolveRoadLifeScene.002",m.name,line);tone='good'}
   else if(choice==='explain'){recordGuardianStance(s.a,'hear',SOSText("companions_life_road.resolveRoadLifeScene.003",s.eventTitle||'a road event',m.name),1);text=SOSText("companions_life_road.resolveRoadLifeScene.004",m.name,line);tone='good'}
   else if(choice==='stand'){recordGuardianStance(s.a,'support',SOSText("companions_life_road.resolveRoadLifeScene.005",s.eventTitle||'a road event',m.name),0);text=SOSText("companions_life_road.resolveRoadLifeScene.006",m.name,line);tone='info'}
   else{text=SOSText("companions_life_road.resolveRoadLifeScene.007",m.name,line);adjustTrust(s.a,1)}
   companionSharedMemory(s.a,'road_debrief',SOSText("companions_life_road.resolveRoadLifeScene.008",m.name,s.eventTitle||'a road event',s.eventChoice||'a course of action'));
   roadLifeHistory(s,text);save();return actionResult(s.title,text,tone,showRoadLife)
 }
 if(['debrief','private_talk','expedition_followup'].includes(s.type)){const m=state.party.members[s.a],reason=s.type==='expedition_followup'?SOSText("companions_life_road.resolveRoadLifeScene.009",companionExplorationDef(s.a)?.title||'a personal expedition'):s.type==='debrief'?'a shared experience':SOSText("companions_life_road.resolveRoadLifeScene.010");if(choice==='support'){recordGuardianStance(s.a,'support',SOSText("companions_life_road.resolveRoadLifeScene.011",reason,m.name),2);text=SOSText("companions_life_road.resolveRoadLifeScene.012",m.name);tone='good'}else if(choice==='hear'){recordGuardianStance(s.a,'hear',SOSText("companions_life_road.resolveRoadLifeScene.013",reason),1);text=SOSText("companions_life_road.resolveRoadLifeScene.014",m.name);tone='good'}else if(choice==='oppose'){recordGuardianStance(s.a,'oppose',SOSText("companions_life_road.resolveRoadLifeScene.015",reason,m.name),-1);text=SOSText("companions_life_road.resolveRoadLifeScene.016",m.name);tone='info'}else{recordGuardianStance(s.a,'dismiss',SOSText("companions_life_road.resolveRoadLifeScene.017",reason,m.name), -3);text=SOSText("companions_life_road.resolveRoadLifeScene.018",m.name);tone='bad'}if(s.type==='expedition_followup')companionLifeState().followups[s.a]={day:state.world.day,choice};}
 else if(s.type==='camp_pair'){const A=state.party.members[s.a],B=state.party.members[s.b];if(choice==='mediate'){const roll=rnd(1,20)+stat(state,'cha');if(roll>=13){relationshipHistory(s.a,s.b,SOSText("companions_life_road.resolveRoadLifeScene.019"),5);adjustTrust(s.a,1);adjustTrust(s.b,1);text=SOSText("companions_life_road.resolveRoadLifeScene.020",A.name,B.name);tone='good'}else{relationshipHistory(s.a,s.b,SOSText("companions_life_road.resolveRoadLifeScene.021"),-1);text=SOSText("companions_life_road.resolveRoadLifeScene.022");tone='bad'}}else{relationshipHistory(s.a,s.b,SOSText("companions_life_road.resolveRoadLifeScene.023"),1);text=SOSText("companions_life_road.resolveRoadLifeScene.024")}}
 else if(s.type==='argument'){const r=companionRelationship(s.a,s.b),A=state.party.members[s.a],B=state.party.members[s.b];
   if(choice==='mediate'){const roll=rnd(1,20)+stat(state,'cha');if(roll>=14){relationshipHistory(s.a,s.b,SOSText("companions_life_road.resolveRoadLifeScene.025"),5);adjustTrust(s.a,1);adjustTrust(s.b,1);R.reconciliations++;text=SOSText("companions_life_road.resolveRoadLifeScene.026",A.name,B.name);tone='good'}else{relationshipHistory(s.a,s.b,SOSText("companions_life_road.resolveRoadLifeScene.027"),-1);text=SOSText("companions_life_road.resolveRoadLifeScene.028");tone='bad'}}
   else if(choice==='sideA'){relationshipHistory(s.a,s.b,SOSText("companions_life_road.resolveRoadLifeScene.029",A.name),-3);recordGuardianStance(s.a,'support',SOSText("companions_life_road.resolveRoadLifeScene.030",A.name,B.name),2);recordGuardianStance(s.b,'oppose',SOSText("companions_life_road.resolveRoadLifeScene.031",B.name,A.name),-2);text=SOSText("companions_life_road.resolveRoadLifeScene.032",A.name,B.name)}
   else if(choice==='sideB'){relationshipHistory(s.a,s.b,SOSText("companions_life_road.resolveRoadLifeScene.033",B.name),-3);recordGuardianStance(s.b,'support',SOSText("companions_life_road.resolveRoadLifeScene.034",B.name,A.name),2);recordGuardianStance(s.a,'oppose',SOSText("companions_life_road.resolveRoadLifeScene.035",A.name,B.name),-2);text=SOSText("companions_life_road.resolveRoadLifeScene.036",B.name,A.name)}
   else{relationshipHistory(s.a,s.b,SOSText("companions_life_road.resolveRoadLifeScene.037"),r.value<32?-1:1);text=SOSText("companions_life_road.resolveRoadLifeScene.038")}
 }
 else if(s.type==='bond'){relationshipHistory(s.a,s.b,SOSText("companions_life_road.resolveRoadLifeScene.039"),2);adjustTrust(s.a,1);adjustTrust(s.b,1);text=SOSText("companions_life_road.resolveRoadLifeScene.040");tone='good'}
 else if(s.type==='camp'){text=SOSText("companions_life_road.resolveRoadLifeScene.041");contextLine=SOSText("companions_life_road.resolveRoadLifeScene.049",activeCompanionPairs().length>0);tone='good'}
 else if(s.type==='place'){const m=state.party.members[s.a];adjustTrust(s.a,1);text=s.summary;const mem=companionMemory(m);mem.history.push({day:state.world.day,topic:'road',text:s.summary});mem.history=mem.history.slice(-15)}
 else if(s.type==='memory'){const m=state.party.members[s.a],unknown=COMPANION_TOPIC_DEFS.find(t=>companionTopicUnlocked(m,t)&&!companionTopicKnown(m,t.id));if(unknown){const mem=companionMemory(m);mem.knownTopics[unknown.id]=true;mem.topics[unknown.id]={count:1,firstDay:state.world.day,lastDay:state.world.day};adjustTrust(s.a,1);text=SOSText("companions_life_road.resolveRoadLifeScene.042",m.name,unknown.label);tone='good'}else{text=SOSText("companions_life_road.resolveRoadLifeScene.043",m.name);adjustTrust(s.a,1)}}
 else if(s.type==='initiative'){const m=state.party.members[s.a];
   if(choice==='scout'){gainScouting(2);m.preparedPeriod=state.world.day;text=SOSText("companions_life_road.resolveRoadLifeScene.044",m.name);tone='good'}
   else if(choice==='heal'){if(typeof stabilizeActiveCompany==='function'){stabilizeActiveCompany(3);treatCompanyRecovery(1,true);recoveryRestoreCompany(.45,.6,true)}else restoreActiveCompany(.35);text=SOSText("companions_life_road.resolveRoadLifeScene.045",m.name);tone='good'}
   else if(choice==='drill'){for(const x of activeRoadCompanions())x.preparedPeriod=state.world.day;text=SOSText("companions_life_road.resolveRoadLifeScene.046",m.name);tone='good'}
   else if(choice==='rest'){state.guardian.stamina=Math.min(maxStamina(),state.guardian.stamina+18);for(const x of activeRoadCompanions())x.stamina=Math.min(allyMaxStamina(x),x.stamina+14);text=SOSText("companions_life_road.resolveRoadLifeScene.047");tone='good'}
   else{text=SOSText("companions_life_road.resolveRoadLifeScene.048",m.name)}
   if(choice!=='ignore')adjustTrust(s.a,1)
 }
 roadLifeHistory(s,text);save();actionResult(s.title,contextLine?`${text}\n\n*${contextLine}*`:text,tone,showRoadLife)
}
function showRoadLifeScene(id){modalRouteEnter(SOSText("companions_life_road.showRoadLifeScene.001"),Array.from(arguments));
 const s=roadLifeState().queue.find(x=>x.id===id);if(!s)return showRoadLife();let body='',buttons='';
 if(s.type==='debrief'||s.type==='private_talk'||s.type==='expedition_followup'){const m=state.party.members[s.a];body=`<p>${esc(s.summary)}</p><div class="notice">${esc(companionLoyaltySummary(s.a))}</div>`;buttons=SOSText("companions_life_road.showRoadLifeScene.002",esc(m.name))}
 else if(s.type==='event_debrief'){const m=state.party.members[s.a],line=companionRoadEventDebriefLine(m,s);body=`<p>${esc(s.summary)}</p><div class="notice compact"><b>${esc(s.eventTitle||'Road event')}</b><br>${esc(s.eventOutcome||'')}<br><small>${esc(s.eventText||'')}</small></div><div class="relationship-card"><b>${esc(m.name)}:</b><p>${esc(line)}</p></div>`;buttons=SOSText("companions_life_road.showRoadLifeScene.003",esc(m.name))}
 else if(s.type==='camp_pair'){const A=state.party.members[s.a],B=state.party.members[s.b],r=companionRelationship(s.a,s.b);body=`<p>${esc(s.summary)}</p><div class="relationship-card"><b>${esc(relationshipTier(r.value))}</b> (${r.value}/100)<br>${esc(relationshipReason(s.a,s.b))}</div>`;buttons=SOSText("companions_life_road.showRoadLifeScene.004")}
 else if(s.type==='argument'){const A=state.party.members[s.a],B=state.party.members[s.b],r=companionRelationship(s.a,s.b);body=`<p>${esc(SOSText("companions_life_road.showRoadLifeScene.005",A.name,B.name))}</p><p class="road-life-context"><em>${esc(SOSText("companions_life_road.showRoadLifeScene.009",relationshipTier(r.value),r.value))}</em></p>`;buttons=SOSText("companions_life_road.showRoadLifeScene.006",esc(A.name),esc(B.name))}
 else if(s.type==='initiative'){const m=state.party.members[s.a],summary=roadLifeSceneDisplaySummary(s);body=`<p>${esc(summary)}</p>`;buttons=roadInitiativeOptions(m).map(([lab,key])=>`<button data-roadchoice="${key}">${esc(lab)}</button>`).join('')}
 else{body=`<p>${esc(s.summary)}</p>`;buttons=SOSText("companions_life_road.showRoadLifeScene.007")}
 overlay(SOSText("companions_life_road.showRoadLifeScene.008",esc(s.title),body,buttons),true);
 document.querySelectorAll('[data-roadchoice]').forEach(b=>b.onclick=()=>resolveRoadLifeScene(s.id,b.dataset.roadchoice));$('#roadSceneBack').onclick=()=>SOSServices.navigation.back(showRoadLife)
}
function makeRoadCamp(){
 if(typeof showCampingWildernessMenu==='function')return showCampingWildernessMenu();
 const physical=typeof playerPhysicalContext==='function'?playerPhysicalContext():{type:playerPartyInField()?'field':(state.world.settlements?.[state.world.location]?'settlement':'field')};
 if(!isOpenWorld()||physical.type!=='field')return actionResult('Cannot Make Camp','The company can make camp only while physically in the field. Leave the settlement before setting up a road camp.','info',renderOpenWorld);
 const R=roadLifeState(),C=companionLifeState(),before=state.world.day;R.camps++;C.lastCampDay=before;advanceWorldDays(1,SOSText("companions_life_road.makeRoadCamp.001"));restoreActiveCompany(.58);
 for(const m of activeRoadCompanions())adjustTrust(m.id,1);
 if(activeCompanionPairs().length){const x=pick(activeCompanionPairs());relationshipHistory(x.a,x.b,SOSText("companions_life_road.makeRoadCamp.002"),x.r.value<44?2:1)}
 const scene=createCampScene();if(scene)roadLifePush(scene);else roadLifePush({type:'camp',title:SOSText("companions_life_road.makeRoadCamp.003"),summary:SOSText("companions_life_road.makeRoadCamp.004")});C.campHistory.push({day:state.world.day,location:state.world.location,scene:scene?.type||'camp'});C.campHistory=C.campHistory.slice(-30);noteCompanionSharedEvent('camp',SOSText("companions_life_road.makeRoadCamp.005",worldLocation(state.world.location).name));save();showRoadLife()
}
function showRoadLife(){modalRouteEnter(SOSText("companions_life_road.showRoadLife.001"),Array.from(arguments));
 const R=roadLifeState();dedupePendingRoadLifeMoments();const active=activeRoadCompanions(),recent=R.history.slice(-8).reverse();
 overlay(SOSText("companions_life_road.showRoadLife.002",active.length,active.length===1?'':'s',R.queue.length,R.queue.length===1?'':'s',R.camps||0,active.length?`<h3>Active Companion Loyalty</h3>${active.map(m=>`<button class="loyalty-card" data-lifeprofile="${m.id}"><span><b>${esc(m.name)}</b><small>${esc(trustTier(companionTrust(m)))} • Trust ${companionTrust(m)}</small></span><span>${esc(companionLoyaltySummary(m.id))}</span></button>`).join('')}`:'',R.queue.length?`<h3>Pending Moments</h3>${R.queue.map(s=>`<button class="road-life-card" data-roadscene="${s.id}"><span><b>${esc(s.title)}</b><small>Day ${s.day}</small></span><span>${esc(roadLifeSceneDisplaySummary(s))}</span></button>`).join('')}`:'<p class="muted">No companion moment is waiting right now.</p>',(typeof playerPhysicalContext==='function'?playerPhysicalContext().type==='field':state.world.location!=='shantium')?'<button id="roadMakeCamp">Make Camp — Advance 1 Day</button>':'',recent.map(x=>`<div class="card compact"><b>Day ${x.day}: ${esc(x.title)}</b><br>${esc(x.result||x.summary)}</div>`).join('')||'<p class="muted">The company has not accumulated much shared road history yet.</p>'),true);
 document.querySelectorAll('[data-lifeprofile]').forEach(b=>b.onclick=()=>showCompanionLifeProfile(b.dataset.lifeprofile));document.querySelectorAll('[data-roadscene]').forEach(b=>b.onclick=()=>showRoadLifeScene(b.dataset.roadscene));if($('#roadMakeCamp'))$('#roadMakeCamp').onclick=makeRoadCamp;wireClose()
}
function companionReaction(faction,delta){
 for(const m of partyMembers(false)){
  const v=COMPANION_VALUES[m.id];if(!v)continue;
  if(delta>0&&v.likes.includes(faction))adjustTrust(m.id,1);
  if(delta>0&&v.dislikes.includes(faction))adjustTrust(m.id,-1);
  if(delta<0&&v.dislikes.includes(faction))adjustTrust(m.id,1);
 }
}
function regionalRecruitConversation(id){
 const a=allyDef(id);
 const lines={
  red_adjutant:SOSText("companions_life_road.regionalRecruitConversation.001"),
  red_lockrunner:SOSText("companions_life_road.regionalRecruitConversation.002"),
  red_grainwarden:SOSText("companions_life_road.regionalRecruitConversation.003"),
  red_firebreak:SOSText("companions_life_road.regionalRecruitConversation.004")
 };
 return lines[id]||SOSText("companions_life_road.regionalRecruitConversation.005",a.name)
}
function worldCompanionTalk(id){
 const c=state.world.companions[id],a=allyDef(id);c.meeting=true;advanceWorldDays(1,SOSText("companions_life_road.worldCompanionTalk.001",a.name));c.meeting=false;c.disposition=Math.min(6,(c.disposition||0)+1);c.cooldownUntil=Math.min(c.cooldownUntil||0,state.world.day);
 const text=regionalRecruitConversation(id);if(id.startsWith('red_')){c.redstoneTalks=(c.redstoneTalks||0)+1;if(c.redstoneTalks>=2)c.disposition=Math.min(6,c.disposition+1)}
 save();actionResult(SOSText("companions_life_road.worldCompanionTalk.002"),SOSText("companions_life_road.worldCompanionTalk.003",text,a.name),'good',renderOpenWorld)
}
function attemptPersistentRecruit(id){
 const c=state.world.companions[id],a=allyDef(id);if(!c||!a||state.allies.includes(id))return;
 c.meeting=true;advanceWorldDays(1,SOSText("companions_life_road.attemptPersistentRecruit.001",a.name));c.meeting=false;
 const presence=stat(state,'cha'),roll=rnd(1,12)+presence+Math.floor(state.reputation/2)+(c.disposition||0)*2;
 const target=15+Math.max(0,(a.minRound||1)-state.round);
 if(roll>=target){
   state.allies.push(id);state.party.members[id]=makePartyMember(id,SOSText("companions_life_road.attemptPersistentRecruit.002"),0);state.party.members[id].trust=Math.max(50,state.party.members[id].trust);if(state.party.active.length<partyLimit())state.party.active.push(id);c.known=false;chronicle(SOSText("companions_life_road.attemptPersistentRecruit.003"),SOSText("companions_life_road.attemptPersistentRecruit.004",a.name),'companion');save();actionResult(SOSText("companions_life_road.attemptPersistentRecruit.005"),SOSText("companions_life_road.attemptPersistentRecruit.006",a.name),'good',renderOpenWorld)
 }else{
   c.disposition=Math.max(-2,(c.disposition||0)-1);c.cooldownUntil=state.world.day+2;c.known=true;c.lastSeenDay=state.world.day;save();actionResult(SOSText("companions_life_road.attemptPersistentRecruit.007"),SOSText("companions_life_road.attemptPersistentRecruit.008",a.name),'info',renderOpenWorld)
 }
}
function revealCompanionRumor(){
 ensureWorldState();const pool=Object.values(state.world.companions).filter(c=>!state.allies.includes(c.id)&&(state.world.unlockedRegions||['shantium']).includes(locationRegion(c.location)));
 if(!pool.length)return null;const c=pick(pool);c.known=true;c.lastSeenDay=state.world.day;save();return c;
}

// v1.6.5 — Camping & Wilderness Life II
// Persistent field-camp sessions: safety, watch, wound care, meals, scouting,
// training, nearby activity, companion interaction, travel preparation, and night resolution.
function ensureCampingLifeState(){
 ensureWorldState();
 if(!state.world.campingLife||typeof state.world.campingLife!=='object')state.world.campingLife={history:[],current:null,lastResolvedDay:0,totalNights:0,unsafeNights:0};
 const C=state.world.campingLife;if(!Array.isArray(C.history))C.history=[];if(!Number.isFinite(C.totalNights))C.totalNights=0;if(!Number.isFinite(C.unsafeNights))C.unsafeNights=0;return C
}
function campingFieldAllowed(){const p=typeof playerPhysicalContext==='function'?playerPhysicalContext():{type:playerPartyInField()?'field':'settlement'};return isOpenWorld()&&p.type==='field'&&!captivityActive()}
function campingActiveMembers(){return typeof activeRoadCompanions==='function'?activeRoadCompanions():partyMembers(true)}
function campLocationDanger(){
 const loc=worldLocation(state.world.location),ss=state.world.settlements?.[loc.id]?settlementState(loc.id):null;let n=28;
 if(['woods','marsh','ruins','hidden'].includes(loc.type))n+=10;if(loc.type==='camp')n-=5;if(ss)n+=Math.max(-8,Math.round((50-(ss.security||50))/5));
 const hostiles=(state.world.parties||[]).filter(p=>worldPartyDisposition(p)==='hostile'&&p.location===loc.id).length;n+=hostiles*12;
 return clamp(n,8,82)
}
function campBestWatcher(){const ms=campingActiveMembers();if(!ms.length)return null;return [...ms].sort((a,b)=>{const A=boundedStatValue(allyStat(a,'wis'))+boundedStatValue(allyStat(a,'dex'))+(allyDef(a.id)?.className==='Ranger'?5:0)+(allyDef(a.id)?.className==='Rogue'?4:0),B=boundedStatValue(allyStat(b,'wis'))+boundedStatValue(allyStat(b,'dex'))+(allyDef(b.id)?.className==='Ranger'?5:0)+(allyDef(b.id)?.className==='Rogue'?4:0);return B-A})[0]}
function campNewSession(){
 if(!campingFieldAllowed())return null;const C=ensureCampingLifeState(),F=typeof playerPartyFieldState==='function'?playerPartyFieldState():null,pos=F&&F.active&&Number.isFinite(F.x)&&Number.isFinite(F.y)?{x:F.x,y:F.y}:null;
 if(C.current&&C.current.location===state.world.location&&C.current.day===state.world.day){const a=C.current.position,b=pos,moved=!!(a&&b&&(Math.abs(a.x-b.x)>0.75||Math.abs(a.y-b.y)>0.75));if(!moved)return C.current}
 C.current={id:uid(),day:state.world.day,location:state.world.location,position:pos?{x:pos.x,y:pos.y}:null,watch:null,watchBonus:0,wounds:false,meal:'none',scouted:false,trained:false,nearbyChecked:false,travelPrepared:false,companionMoment:false,notes:[]};save();return C.current
}
function campSafetyScore(c=ensureCampingLifeState().current){
 if(!c)return 0;let s=100-campLocationDanger()+scoutingLevel()*3+c.watchBonus+(c.scouted?8:0)+(c.travelPrepared?3:0);if(c.meal==='food')s+=3;return clamp(Math.round(s),10,98)
}
function campSafetyLabel(n){return n>=82?'Well Secured':n>=66?'Watchful':n>=48?'Exposed':n>=30?'Risky':'Dangerous'}
function campPartyConditionHTML(){
 const rows=[{name:state.name,hp:state.guardian.hp,max:maxHP(),inj:combatInjurySummary(state.guardian)},...campingActiveMembers().map(m=>({name:m.name,hp:m.hp,max:allyMaxHP(m),inj:combatInjurySummary(m)}))];
 return rows.map(r=>`<div class="stat-row"><span>${esc(r.name)}${r.inj?` <small class="danger-text">${esc(r.inj)}</small>`:''}</span><b>${Math.max(0,r.hp)}/${r.max} HP</b></div>`).join('')
}
function campNearbySummary(){
 const loc=state.world.location,parties=(state.world.parties||[]).filter(p=>p.location===loc&&p.id!==state.world.playerPartyId),hostiles=parties.filter(p=>worldPartyDisposition(p)==='hostile'),friendly=parties.filter(p=>worldPartyDisposition(p)==='friendly');
 const battle=typeof findRegionalBattleNearPlayer==='function'?findRegionalBattleNearPlayer():null;return {parties,hostiles,friendly,battle}
}
function showCampingWildernessMenu(){modalRouteEnter('campingWilderness',Array.from(arguments));
 if(!campingFieldAllowed())return actionResult('Cannot Camp Here','Camping is available only while the Player Party is physically outside a settlement.','info',renderOpenWorld);
 const c=campNewSession(),s=campSafetyScore(c),near=campNearbySummary(),food=state.world.cargo?.food||0,inj=[state.guardian,...campingActiveMembers()].filter(x=>activeCombatInjuries(x).length).length;
 const prep=[c.watch?`Watch: ${c.watch}`:'No watch assigned',c.wounds?'Wounds tended':`${inj} injured`,c.meal==='food'?'Hot meal prepared':food>0?`${food} food cargo available`:'No food cargo',c.scouted?'Surroundings scouted':'No camp scout',c.trained?'Training completed':'No training',c.travelPrepared?'Travel kit prepared':'Travel not prepared'].join(' • ');
 overlay(`<h2>Field Camp — ${esc(worldLocation(c.location).name)}</h2><div class="notice camp-status"><div class="stat-row"><span>Camp safety</span><b>${esc(campSafetyLabel(s))} (${s}%)</b></div><small>${esc(prep)}</small></div><div class="two-col"><div><h3>Player Party</h3>${campPartyConditionHTML()}<h3>Nearby Activity</h3><div class="notice compact">${near.hostiles.length?`<b class="danger-text">${near.hostiles.length} hostile Party${near.hostiles.length===1?'':'ies'} nearby.</b><br>`:''}${near.parties.length?`${near.parties.length} known Party${near.parties.length===1?'':'ies'} at this map location.`:'No known Party is sharing this map location.'}${near.battle?'<br><b>Active regional fighting is close enough to matter.</b>':''}</div></div><div><h3>Camp Tasks</h3><div class="choice-list camp-task-list"><button id="campWatch"><b>Set the Watch</b><small>${c.watch?esc(c.watch):'Assign the Guardian or a companion to protect the camp.'}</small></button><button id="campWounds" ${c.wounds?'disabled':''}><b>Tend Wounds</b><small>${c.wounds?'Already completed this camp.':'Stabilize injuries and improve overnight recovery.'}</small></button><button id="campMeal" ${c.meal!=='none'?'disabled':''}><b>Prepare a Meal</b><small>${c.meal!=='none'?'Meal decision already made.':food>0?`Use 1 Food cargo (${food} available) for better recovery.`:'No Food cargo — make do with travel rations.'}</small></button><button id="campScout" ${c.scouted?'disabled':''}><b>Scout the Surroundings</b><small>${c.scouted?'Area checked.':'Gain regional intelligence and improve camp security.'}</small></button><button id="campTrain" ${c.trained?'disabled':''}><b>Train / Drill</b><small>${c.trained?'Training completed.':'Prepare the active Party for the next day.'}</small></button><button id="campNearby" ${c.nearbyChecked?'disabled':''}><b>Investigate Nearby Activity</b><small>${c.nearbyChecked?'Activity checked.':'Look for tracks, lights, movement, or nearby Parties.'}</small></button><button id="campTravelPrep" ${c.travelPrepared?'disabled':''}><b>Prepare for Travel</b><small>${c.travelPrepared?'Travel preparation complete.':'Pack deliberately and reduce next-day road risk.'}</small></button><button id="campCompanion"><b>Camp Conversations</b><small>Spend time with companions and resolve road-life moments.</small></button></div></div></div><div class="dialog-footer"><button id="campSleep"><b>Sleep & Break Camp</b><br><small>Advance 1 day and resolve recovery / camp risk</small></button><button class="closeModal">Close</button></div>`,true);
 $('#campWatch').onclick=showCampWatchMenu;$('#campWounds').onclick=campTendWounds;$('#campMeal').onclick=campPrepareMeal;$('#campScout').onclick=campScoutSurroundings;$('#campTrain').onclick=campTrainParty;$('#campNearby').onclick=campCheckNearby;$('#campTravelPrep').onclick=campPrepareTravel;$('#campCompanion').onclick=showRoadLife;$('#campSleep').onclick=resolveWildernessCampNight;wireClose()
}
function showCampWatchMenu(){const c=campNewSession(),ms=campingActiveMembers(),best=campBestWatcher();overlay(`<h2>Set the Watch</h2><p>A good watch improves camp safety and reduces the chance that nearby trouble catches the company asleep.</p><div class="choice-list"><button data-campwatch="guardian"><b>${esc(state.name)} takes watch</b><small>WIS/DEX and class experience determine effectiveness.</small></button>${ms.map(m=>`<button data-campwatch="${m.id}"><b>${esc(m.name)}</b><small>${esc(allyDef(m.id)?.className||m.className||m.title)}${best?.id===m.id?' • strongest available watch':''}</small></button>`).join('')}<button data-campwatch="rotation"><b>Shared Rotation</b><small>Lower individual strain; dependable if the active Party is large enough.</small></button></div><div class="dialog-footer"><button id="campWatchBack">Back</button></div>`,true);document.querySelectorAll('[data-campwatch]').forEach(b=>b.onclick=()=>assignCampWatch(b.dataset.campwatch));$('#campWatchBack').onclick=showCampingWildernessMenu}
function assignCampWatch(id){const c=campNewSession();let bonus=0,label='';if(id==='guardian'){bonus=Math.round((boundedStatValue(stat(state,'wis'))+boundedStatValue(stat(state,'dex')))/2)+(guardianClass()==='Ranger'?5:guardianClass()==='Rogue'?4:0);label=`${state.name} on watch`}else if(id==='rotation'){bonus=campingActiveMembers().length>=2?10:5;label='shared watch rotation'}else{const m=state.party.members[id];if(!m)return showCampWatchMenu();bonus=Math.round((boundedStatValue(allyStat(m,'wis'))+boundedStatValue(allyStat(m,'dex')))/2)+(allyDef(m.id)?.className==='Ranger'?5:allyDef(m.id)?.className==='Rogue'?4:0);label=`${m.name} on watch`}c.watch=id;c.watchBonus=clamp(bonus,3,18);c.notes.push(`Watch set: ${label}.`);save();showCampingWildernessMenu()}
function campTendWounds(){const c=campNewSession();if(c.wounds)return showCampingWildernessMenu();const healer=campingActiveMembers().find(m=>['healer','field_mender'].includes(m.id)||['Healer'].includes(allyDef(m.id)?.className)),days=healer?2:1;let treated=0;for(const owner of [state.guardian,...campingActiveMembers()])if(activeCombatInjuries(owner).length){treatCombatInjuries(owner,days);treated++}restoreActiveCompany(healer?.id?0.12:0.07);c.wounds=true;c.notes.push(treated?`${treated} injured member${treated===1?'':'s'} received field treatment${healer?` led by ${healer.name}`:''}.`:'The Party checked bandages and minor aches; no persistent injuries required treatment.');save();actionResult('Field Treatment',c.notes[c.notes.length-1],treated?'good':'info',showCampingWildernessMenu)}
function campPrepareMeal(){const c=campNewSession();if(c.meal!=='none')return showCampingWildernessMenu();const food=state.world.cargo?.food||0;if(food>0){state.world.cargo.food=Math.max(0,food-1);c.meal='food';c.notes.push('The Party used 1 Food cargo to prepare a proper camp meal.');for(const m of campingActiveMembers())adjustTrust(m.id,1);save();return actionResult('Camp Meal','One Food cargo is turned into a substantial meal. Morale and overnight recovery will be better.','good',showCampingWildernessMenu)}c.meal='rations';c.notes.push('The Party made do with ordinary travel rations.');save();actionResult('Travel Rations','No Food cargo is available. The company eats basic travel rations: enough to rest, but without the recovery bonus of a proper meal.','info',showCampingWildernessMenu)}
function campScoutSurroundings(){const c=campNewSession();if(c.scouted)return showCampingWildernessMenu();const ranger=guardianClass()==='Ranger'||guardianClass()==='Rogue'||campingActiveMembers().some(m=>['Ranger','Rogue'].includes(allyDef(m.id)?.className));gainScoutingIntel(ranger?2:1,{type:'camp_scout',location:state.world.location,source:'Camp scouting',summary:`The Player Party surveyed approaches around ${worldLocation(state.world.location).name} before settling for the night.`,reliability:ranger?86:74,precision:'local'});c.scouted=true;c.notes.push('Approaches and nearby ground were scouted.');save();actionResult('Camp Scouting',ranger?'An experienced scout maps approaches, likely cover, and signs of recent movement.':'The company checks the immediate approaches and notes signs of traffic.','good',showCampingWildernessMenu)}
function campTrainParty(){const c=campNewSession();if(c.trained)return showCampingWildernessMenu();const p=typeof companionInteractionPeriod==='function'?companionInteractionPeriod():state.world.day;for(const m of campingActiveMembers()){m.preparedPeriod=p;m.preparedRound=state.round}state.guardian.campPreparedUntil=state.world.day+1;c.trained=true;c.notes.push('The active Party completed a short drill and equipment check.');save();actionResult('Camp Training','The active Party drills formations, checks equipment, and rehearses reactions before nightfall. Companions count as prepared for the next interaction period.','good',showCampingWildernessMenu)}
function campCheckNearby(){const c=campNewSession();if(c.nearbyChecked)return showCampingWildernessMenu();const near=campNearbySummary();c.nearbyChecked=true;c.notes.push(`Nearby activity checked: ${near.parties.length} known Party${near.parties.length===1?'':'ies'} locally.`);if(near.parties.length)gainScoutingIntel(1,{type:'camp_activity',location:state.world.location,source:'Camp observation',summary:`Movement near ${worldLocation(state.world.location).name}: ${near.parties.slice(0,4).map(p=>p.name).join(', ')}.`,reliability:82,precision:'local'});save();actionResult('Nearby Activity',near.parties.length?`Tracks, lights, and movement confirm ${near.parties.length} known Party${near.parties.length===1?'':'ies'} nearby: ${near.parties.slice(0,5).map(p=>p.name).join(', ')}.${near.hostiles.length?` ${near.hostiles.length} appear hostile.`:''}`:'The surrounding ground is quiet enough that the Party finds no known moving group sharing the immediate area.',near.hostiles.length?'bad':'info',showCampingWildernessMenu)}
function campPrepareTravel(){const c=campNewSession();if(c.travelPrepared)return showCampingWildernessMenu();c.travelPrepared=true;ensureCampingLifeState().travelPreparedUntil=state.world.day+2;c.notes.push('Loads, water, route notes, and marching order were prepared for departure.');save();actionResult('Travel Prepared','The Player Party packs deliberately, reviews the route, and establishes a marching order. Road-event danger and ambush vulnerability are reduced briefly after camp.','good',showCampingWildernessMenu)}
function resolveWildernessCampNight(){
 const C=ensureCampingLifeState(),c=campNewSession(),s=campSafetyScore(c),risk=clamp((100-s)/180,.02,.42),bad=chance(risk),before=state.world.day;let eventText='',tone='good';
 if(bad){C.unsafeNights++;const near=campNearbySummary();if(near.hostiles.length){const p=pick(near.hostiles);eventText=`Movement from ${p.name} forces the camp awake before dawn. The company loses some of the night to alarms and repositioning.`;tone='bad'}else{eventText='A poor night of watches, weather, and unexplained movement breaks up the company’s sleep.';tone='info'}}else eventText='The camp passes without serious disturbance.';
 advanceWorldDays(1,'Made camp with the company');let recovery=.42+(c.wounds?.10:0)+(c.meal==='food'?.10:0)+(bad?-.15:0);recovery=clamp(recovery,.20,.72);restoreActiveCompany(recovery);
 if(c.watch==='guardian')state.guardian.stamina=Math.max(0,state.guardian.stamina-4);if(c.watch&&c.watch!=='guardian'&&c.watch!=='rotation'&&state.party.members[c.watch])state.party.members[c.watch].stamina=Math.max(0,state.party.members[c.watch].stamina-3);
 const R=roadLifeState(),CL=companionLifeState();R.camps++;CL.lastCampDay=before;for(const m of campingActiveMembers())adjustTrust(m.id,1);if(activeCompanionPairs().length){const x=pick(activeCompanionPairs());relationshipHistory(x.a,x.b,'Shared a field camp together',x.r.value<44?2:1)}const scene=createCampScene();if(scene)roadLifePush(scene);CL.campHistory.push({day:state.world.day,location:c.location,scene:scene?.type||'camp',safety:s});CL.campHistory=CL.campHistory.slice(-30);noteCompanionSharedEvent('camp',`The company camped near ${worldLocation(c.location).name}.`);
 C.totalNights++;C.lastResolvedDay=state.world.day;C.history.push({day:state.world.day,location:c.location,safety:s,disturbed:bad,recovery:Number(recovery.toFixed(2)),watch:c.watch,meal:c.meal,wounds:c.wounds,scouted:c.scouted,trained:c.trained,travelPrepared:c.travelPrepared,notes:c.notes.slice(-8)});C.history=C.history.slice(-50);C.current=null;save();actionResult('Camp Broken',`${eventText}\n\nOvernight recovery: ${Math.round(recovery*100)}%. Camp safety was ${campSafetyLabel(s)} (${s}%).${c.travelPrepared?' The Party leaves with travel preparation in effect.':''}`,tone,renderOpenWorld)
}
function makeRoadCamp(){return showCampingWildernessMenu()}
function campingTravelPrepBonus(){const C=ensureCampingLifeState();return (C.travelPreparedUntil||0)>=state.world.day?1:0}
function campingJournalHTML(){const C=ensureCampingLifeState(),recent=C.history.slice(-5).reverse();return `<div class="notice compact"><b>Wilderness camping</b><br>${C.totalNights||0} night${C.totalNights===1?'':'s'} recorded • ${C.unsafeNights||0} disturbed/unsafe</div>${recent.map(x=>`<div class="card compact"><b>Day ${x.day} — ${esc(worldLocation(x.location)?.name||x.location)}</b><br>Safety ${x.safety}% • Recovery ${Math.round((x.recovery||0)*100)}%${x.disturbed?' • disturbed':''}</div>`).join('')}`}
