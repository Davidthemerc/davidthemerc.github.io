function socialLifeState(){
 ensureWorldState();if(!state.world.socialLife||typeof state.world.socialLife!=='object')state.world.socialLife={events:{},history:[],lastGenDay:{}};
 const S=state.world.socialLife;if(!S.events)S.events={};if(!Array.isArray(S.history))S.history=[];if(!S.lastGenDay)S.lastGenDay={};return S
}
function activeSocialEvent(locId){
 const S=socialLifeState(),e=S.events[locId];if(!e)return null;
 if(e.status==='active'&&e.expiresDay>=state.world.day)return e;
 if(e.status==='active'&&e.expiresDay<state.world.day){e.status='expired';e.resolvedDay=state.world.day;S.history.push({day:state.world.day,locId,title:e.title,result:SOSText("social_world_life_chains.activeSocialEvent.001")});}
 return null
}
function socialEventActors(locId){
 const people=settlementNpcsPresent(locId).filter(n=>n.home===locId),trav=knownTravelerAtSettlement(locId),companions=activeRoadCompanions();
 return {npc:people.length?pick(people):null,trav,companion:companions.length?pick(companions):null}
}
function socialEventTypeFor(locId,a){
 if(a.trav&&a.companion&&travelerAttitudeScore(a.trav)>=4)return pick(['reunion','hiring','market_meet']);
 if(a.trav&&travelerAttitudeScore(a.trav)<=-5)return'dispute';
 if(a.npc&&a.companion)return pick(['local_project','public_meal','memorial']);
 if(a.trav&&a.npc)return pick(['market_meet','hiring','dispute']);
 return pick(['market_day','public_meal','memorial'])
}
function socialEventDefinition(type,locId,a){
 const N=a.npc?.name||SOSText("social_world_life_chains.socialEventDefinition.001"),T=a.trav?.name||SOSText("social_world_life_chains.socialEventDefinition.002"),C=a.companion?.name||SOSText("social_world_life_chains.socialEventDefinition.003"),place=worldLocation(locId).name;
 const defs={
  reunion:{title:SOSText("social_world_life_chains.socialEventDefinition.004"),text:SOSText("social_world_life_chains.socialEventDefinition.005",T,place,C,N),stage2:SOSText("social_world_life_chains.socialEventDefinition.006")},
  hiring:{title:SOSText("social_world_life_chains.socialEventDefinition.007"),text:SOSText("social_world_life_chains.socialEventDefinition.008",N,T,C),stage2:SOSText("social_world_life_chains.socialEventDefinition.009")},
  market_meet:{title:SOSText("social_world_life_chains.socialEventDefinition.010"),text:SOSText("social_world_life_chains.socialEventDefinition.011",T,place,N,C),stage2:SOSText("social_world_life_chains.socialEventDefinition.012")},
  dispute:{title:SOSText("social_world_life_chains.socialEventDefinition.013"),text:SOSText("social_world_life_chains.socialEventDefinition.014",T,place,N),stage2:SOSText("social_world_life_chains.socialEventDefinition.015")},
  local_project:{title:SOSText("social_world_life_chains.socialEventDefinition.016"),text:SOSText("social_world_life_chains.socialEventDefinition.017",N,place,C),stage2:SOSText("social_world_life_chains.socialEventDefinition.018")},
  public_meal:{title:SOSText("social_world_life_chains.socialEventDefinition.019"),text:SOSText("social_world_life_chains.socialEventDefinition.020",place,N,C),stage2:SOSText("social_world_life_chains.socialEventDefinition.021")},
  memorial:{title:SOSText("social_world_life_chains.socialEventDefinition.022"),text:SOSText("social_world_life_chains.socialEventDefinition.023",place,N,C),stage2:SOSText("social_world_life_chains.socialEventDefinition.024")},
  market_day:{title:SOSText("social_world_life_chains.socialEventDefinition.025"),text:SOSText("social_world_life_chains.socialEventDefinition.026",place),stage2:SOSText("social_world_life_chains.socialEventDefinition.027")}
 };
 return defs[type]||defs.market_day
}
function createSocialLifeEvent(locId,force=false,type=null){
 const S=socialLifeState(),existing=activeSocialEvent(locId);if(existing&&!force)return existing;
 if(!force&&(state.world.day-(S.lastGenDay[locId]||-99)<3||!chance(.24)))return null;
 const a=socialEventActors(locId),kind=type||socialEventTypeFor(locId,a),d=socialEventDefinition(kind,locId,a);
 const e={id:uid(),locId,type:kind,title:d.title,text:d.text,stage2:d.stage2,stage:0,status:'active',createdDay:state.world.day,expiresDay:state.world.day+5,npcId:a.npc?.id||null,travelerId:a.trav?.id||null,companionId:a.companion?.id||null,choices:[],result:null};
 S.events[locId]=e;S.lastGenDay[locId]=state.world.day;recordWorldHistory(SOSText("social_world_life_chains.createSocialLifeEvent.001",worldLocation(locId).name,e.title),'info',SOSText("social_world_life_chains.createSocialLifeEvent.002"));return e
}
function socialEventActorNames(e){
 const npc=e.npcId?settlementNpc(e.locId,e.npcId):null,r=e.travelerId?travelerRegistryState().records[e.travelerId]:null,c=e.companionId?state.party.members[e.companionId]:null;
 return {npc,r,c}
}
function socialEventHTML(locId){
 const e=activeSocialEvent(locId)||createSocialLifeEvent(locId,false);if(!e)return'';
 const a=socialEventActorNames(e),actors=[a.npc?.name,a.r?.name,a.c?.name].filter(Boolean);
 return SOSText("social_world_life_chains.socialEventHTML.001",esc(e.title),esc(e.stage===0?e.text:e.stage2),actors.length?`<small>People involved: ${esc(actors.join(' • '))}</small><br>`:'',e.stage===0?'Get Involved':'Continue the Situation')
}
function socialEventChoiceSet(e){
 if(e.stage===0)return [
  ['join',SOSText("social_world_life_chains.socialEventChoiceSet.001"),SOSText("social_world_life_chains.socialEventChoiceSet.002")],
  ['mediate',SOSText("social_world_life_chains.socialEventChoiceSet.003"),SOSText("social_world_life_chains.socialEventChoiceSet.004")],
  ['observe',SOSText("social_world_life_chains.socialEventChoiceSet.005"),SOSText("social_world_life_chains.socialEventChoiceSet.006")],
  ['leave',SOSText("social_world_life_chains.socialEventChoiceSet.007"),SOSText("social_world_life_chains.socialEventChoiceSet.008")]
 ];
 return [
  ['followup',SOSText("social_world_life_chains.socialEventChoiceSet.009"),SOSText("social_world_life_chains.socialEventChoiceSet.010")],
  ['favor',SOSText("social_world_life_chains.socialEventChoiceSet.011"),SOSText("social_world_life_chains.socialEventChoiceSet.012")],
  ['distance',SOSText("social_world_life_chains.socialEventChoiceSet.013"),SOSText("social_world_life_chains.socialEventChoiceSet.014")]
 ]
}
function showSocialLifeEvent(locId=state.world.location,arrivalConfirmed=false){modalRouteEnter(SOSText("social_world_life_chains.showSocialLifeEvent.001"),Array.from(arguments));
 if(locId!==state.world.location&&!arrivalConfirmed){const e=activeSocialEvent(locId);return beginWorldLifeTravel('event',e?.id||null,locId)}
 const e=activeSocialEvent(locId)||createSocialLifeEvent(locId,true);if(!e)return showTownLife(locId);const a=socialEventActorNames(e);
 overlay(SOSText("social_world_life_chains.showSocialLifeEvent.002",esc(e.title),esc(e.stage===0?e.text:e.stage2),a.c?`<div class="notice compact companion-social-interjection">${esc(socialEventCompanionInterjection(e))}</div>`:'',esc(worldLocation(locId).name),state.world.day,e.stage+1,[a.npc?.name,a.r?.name,a.c?.name].filter(Boolean).map(esc).join(' • '),socialEventChoiceSet(e).map(([id,label,desc])=>`<button data-socialchoice="${id}"><b>${esc(label)}</b><br><small>${esc(desc)}</small></button>`).join('')),true);
 document.querySelectorAll('[data-socialchoice]').forEach(b=>b.onclick=()=>resolveSocialLifeEvent(locId,b.dataset.socialchoice));$('#socialEventBack').onclick=()=>showTownLife(locId)
}
function socialRelationshipEffects(e,choice){
 const a=socialEventActorNames(e);let good=0,bad=0;
 if(['join','mediate','followup','favor'].includes(choice))good=choice==='mediate'||choice==='followup'?2:1;
 if(choice==='leave')bad=1;
 if(a.npc&&good){const nr=npcRelationshipState(a.npc.id);nr.familiarity=clamp(nr.familiarity+good,0,10);npcMemoryAdd(a.npc.id,SOSText("social_world_life_chains.socialRelationshipEffects.001",e.title,choice==='mediate'?'helped people work through it':choice==='followup'?'followed through after the first meeting':'took part rather than standing apart'),good)}
 if(a.r&&good){a.r.social=a.r.social||{familiarity:0};a.r.social.familiarity=clamp((a.r.social.familiarity||0)+good,0,10);a.r.meetings=(a.r.meetings||0)+1;a.r.history.push({day:state.world.day,event:'social_event',detail:SOSText("social_world_life_chains.socialRelationshipEffects.002",e.title,worldLocation(e.locId).name),region:locationRegion(e.locId)})}
 if(a.r&&choice==='favor'&&travelerFavorState(a.r)>0)a.r.favors--;
 if(a.c&&good){SOSServices.companions.adjustTrust(a.c.id,good);SOSServices.companions.noteSharedEvent('town_social',SOSText("social_world_life_chains.socialRelationshipEffects.003",a.c.name,e.title),[a.c.id],e.locId)}
 if(bad&&a.c)SOSServices.companions.adjustTrust(a.c.id,-1);
 return {good,bad,a}
}
function resolveSocialLifeEvent(locId,choice){
 const e=activeSocialEvent(locId);if(!e)return showTownLife(locId);const fx=socialRelationshipEffects(e,choice);e.choices.push({day:state.world.day,stage:e.stage,choice});let text='',tone='info';
 if(e.stage===0){
  if(choice==='join'){changeLocalReputation(locId,1,SOSText("social_world_life_chains.resolveSocialLifeEvent.001",e.title));text=SOSText("social_world_life_chains.resolveSocialLifeEvent.002");tone='good'}
  else if(choice==='mediate'){changeLocalReputation(locId,1,SOSText("social_world_life_chains.resolveSocialLifeEvent.003",e.title));const broughtIn=fx.a.npc?.name||fx.a.r?.name||fx.a.c?.name||SOSText("social_world_life_chains.resolveSocialLifeEvent.014");text=SOSText("social_world_life_chains.resolveSocialLifeEvent.004",broughtIn);tone='good'}
  else if(choice==='observe'){text=SOSText("social_world_life_chains.resolveSocialLifeEvent.005")}
  else{text=SOSText("social_world_life_chains.resolveSocialLifeEvent.006")}
  if(choice==='leave'){e.status='resolved';e.result=text;e.resolvedDay=state.world.day;socialLifeState().history.push({day:state.world.day,locId,title:e.title,result:text,actors:[e.npcId,e.travelerId,e.companionId].filter(Boolean),choices:e.choices});maybeQueueSocialChainFromEvent(e)}
  else e.stage=1;
 }else{
  if(choice==='followup'){changeLocalReputation(locId,1,SOSText("social_world_life_chains.resolveSocialLifeEvent.007",e.title));text=SOSText("social_world_life_chains.resolveSocialLifeEvent.008");tone='good'}
  else if(choice==='favor'){
   if(fx.a.r&&travelerFavorState(fx.a.r)>=0){text=SOSText("social_world_life_chains.resolveSocialLifeEvent.009",fx.a.r.name||SOSText("social_world_life_chains.resolveSocialLifeEvent.014"));tone='good'}else{text=SOSText("social_world_life_chains.resolveSocialLifeEvent.010")}
  }else{text=SOSText("social_world_life_chains.resolveSocialLifeEvent.011")}
  e.status='resolved';e.result=text;e.resolvedDay=state.world.day;if(e.companionId&&e.npcId)setCompanionNpcOpinion(e.companionId,e.npcId,choice==='distance'?0:1,`${e.title} in ${worldLocation(locId).name}`);if(e.companionId&&e.travelerId)setCompanionTravelerOpinion(e.companionId,e.travelerId,choice==='distance'?0:1,`${e.title} in ${worldLocation(locId).name}`);socialLifeState().history.push({day:state.world.day,locId,title:e.title,result:text,actors:[e.npcId,e.travelerId,e.companionId].filter(Boolean),choices:e.choices});socialLifeState().history=socialLifeState().history.slice(-60);
  recordWorldHistory(SOSText("social_world_life_chains.resolveSocialLifeEvent.012",worldLocation(locId).name,e.title,text),'good',SOSText("social_world_life_chains.resolveSocialLifeEvent.013"));maybeQueueSocialChainFromEvent(e)
 }
 save();actionResult(e.title,text,tone,()=>showTownLife(locId))
}
function socialLifeDailyTick(){
 if(!isOpenWorld())return;const S=socialLifeState(),ids=Object.keys(state.world.settlements||{});for(const id of ids)activeSocialEvent(id);let active=Object.values(S.events).filter(e=>e.status==='active'&&e.expiresDay>=state.world.day).length;
 if(active<4){const pool=ids.filter(id=>id!==state.world.location).sort(()=>Math.random()-.5),targets=[state.world.location,...pool.slice(0,2)];for(const id of targets){if(active>=4)break;if((!S.events[id]||S.events[id].status!=='active')&&createSocialLifeEvent(id,false))active++}}
 if(S.history.length>60)S.history=S.history.slice(-60)
}
function socialLifeHistoryHTML(locId){
 const rows=socialLifeState().history.filter(x=>x.locId===locId).slice(-4).reverse();return rows.length?SOSText("social_world_life_chains.socialLifeHistoryHTML.001",rows.map(x=>`<div class="card compact"><b>Day ${x.day}: ${esc(x.title)}</b><br>${esc(x.result)}</div>`).join('')):''
}


function socialChainState(){
 ensureWorldState();if(!state.world.socialChains||typeof state.world.socialChains!=='object')state.world.socialChains={chains:[],history:[],lastTickDay:state.world.day};
 const C=state.world.socialChains;if(!Array.isArray(C.chains))C.chains=[];if(!Array.isArray(C.history))C.history=[];return C
}
function socialChainActorsFromEvent(e){const a=socialEventActorNames(e);return {npcId:a.npc?.id||e.npcId||null,travelerId:a.r?.id||e.travelerId||null,companionId:a.c?.id||e.companionId||null}}
function queueSocialConsequence(e,kind=null,delay=null){
 if(!e||e.status!=='resolved')return null;const C=socialChainState(),actors=socialChainActorsFromEvent(e),choices=(e.choices||[]).map(x=>x.choice),good=choices.some(x=>['mediate','followup','join','favor'].includes(x)),bad=choices.includes('leave');let type=kind;
 if(!type){const pool=[];if(actors.npcId&&actors.travelerId)pool.push(good?'friendship':'friction','referral','visit');if(actors.companionId&&actors.npcId)pool.push('companion_opinion','visit');if(actors.travelerId)pool.push('traveler_request','departure');if(e.type==='memorial')pool.push('funeral_followup');if(e.type==='reunion')pool.push('reunion_return');if(e.type==='hiring')pool.push('promotion','work_contract');if(['public_meal','market_day','market_meet'].includes(e.type))pool.push('celebration','wedding');if(bad)pool.push('friction','departure');type=pick(pool.length?pool:['visit'])}
 const c={id:uid(),sourceEventId:e.id,locId:e.locId,type,status:'pending',createdDay:state.world.day,dueDay:state.world.day+(delay??rnd(4,12)),actors,sourceTitle:e.title,sourceChoices:choices,good,bad};C.chains.push(c);C.chains=C.chains.slice(-80);C.history.push({day:state.world.day,type:'queued',locId:e.locId,chainId:c.id,text:SOSText("social_world_life_chains.queueSocialConsequence.001",e.title)});C.history=C.history.slice(-100);return c
}
function chainActorData(c){return {npc:c.actors?.npcId?settlementNpc(c.locId,c.actors.npcId):null,r:c.actors?.travelerId?travelerRegistryState().records[c.actors.travelerId]:null,comp:c.actors?.companionId?state.party.members[c.actors.companionId]:null}}
function socialChainText(c){
 const a=chainActorData(c),N=a.npc?.name||SOSText("social_world_life_chains.socialChainText.001"),T=a.r?.name||'travelers',P=a.comp?.name||SOSText("social_world_life_chains.socialChainText.002"),place=worldLocation(c.locId).name;
 const map={friendship:SOSText("social_world_life_chains.socialChainText.003",c.sourceTitle,N,T,place),friction:SOSText("social_world_life_chains.socialChainText.004",c.sourceTitle,N,T,place),referral:SOSText("social_world_life_chains.socialChainText.005",T,N,place),visit:SOSText("social_world_life_chains.socialChainText.006",N),companion_opinion:SOSText("social_world_life_chains.socialChainText.007",P,N,c.sourceTitle),traveler_request:SOSText("social_world_life_chains.socialChainText.008",T),departure:SOSText("social_world_life_chains.socialChainText.009",c.sourceTitle,place),funeral_followup:SOSText("social_world_life_chains.socialChainText.010",c.sourceTitle),reunion_return:SOSText("social_world_life_chains.socialChainText.011",c.sourceTitle,place),promotion:SOSText("social_world_life_chains.socialChainText.012",c.sourceTitle,N),work_contract:SOSText("social_world_life_chains.socialChainText.013",c.sourceTitle),celebration:SOSText("social_world_life_chains.socialChainText.014",c.sourceTitle,place),wedding:SOSText("social_world_life_chains.socialChainText.015",c.sourceTitle)};return map[c.type]||SOSText("social_world_life_chains.socialChainText.016",c.sourceTitle,place)
}
function activateDueSocialChains(){if(!isOpenWorld())return;const C=socialChainState();for(const c of C.chains.filter(x=>x.status==='pending'&&x.dueDay<=state.world.day)){c.status='active';c.activatedDay=state.world.day;c.text=socialChainText(c);recordWorldHistory(`${worldLocation(c.locId).name}: ${c.text}`,'info',SOSText("social_world_life_chains.activateDueSocialChains.001"))}}
function activeSocialChains(locId=null){activateDueSocialChains();return socialChainState().chains.filter(c=>c.status==='active'&&(!locId||c.locId===locId))}
function socialChainHTML(locId){const rows=activeSocialChains(locId);return rows.length?SOSText("social_world_life_chains.socialChainHTML.001",rows.slice(0,3).map(c=>`<div class="social-chain-card"><b>${esc(c.sourceTitle)} — Follow-Up</b><p>${esc(c.text||socialChainText(c))}</p><button data-socialchain="${c.id}">Respond</button></div>`).join('')):''}
function socialChainChoiceSet(c){
 if(['friendship','referral','visit','reunion_return','celebration','wedding','funeral_followup','promotion'].includes(c.type))return [['support',SOSText("social_world_life_chains.socialChainChoiceSet.001"),SOSText("social_world_life_chains.socialChainChoiceSet.002")],['attend',SOSText("social_world_life_chains.socialChainChoiceSet.003"),SOSText("social_world_life_chains.socialChainChoiceSet.004")],['decline',SOSText("social_world_life_chains.socialChainChoiceSet.005"),SOSText("social_world_life_chains.socialChainChoiceSet.006")]];
 if(['friction','departure'].includes(c.type))return [['mediate',SOSText("social_world_life_chains.socialChainChoiceSet.007"),SOSText("social_world_life_chains.socialChainChoiceSet.008")],['accept',SOSText("social_world_life_chains.socialChainChoiceSet.009"),SOSText("social_world_life_chains.socialChainChoiceSet.010")],['side',SOSText("social_world_life_chains.socialChainChoiceSet.011"),SOSText("social_world_life_chains.socialChainChoiceSet.012")]];
 return [['help',SOSText("social_world_life_chains.socialChainChoiceSet.013"),SOSText("social_world_life_chains.socialChainChoiceSet.014")],['contract',SOSText("social_world_life_chains.socialChainChoiceSet.015"),SOSText("social_world_life_chains.socialChainChoiceSet.016")],['decline',SOSText("social_world_life_chains.socialChainChoiceSet.017"),SOSText("social_world_life_chains.socialChainChoiceSet.018")]]
}
function showSocialChain(id,arrivalConfirmed=false){modalRouteEnter(SOSText("social_world_life_chains.showSocialChain.001"),Array.from(arguments));
 const c=socialChainState().chains.find(x=>x.id===id);if(!c||c.status!=='active')return showTownLife(state.world.location);if(c.locId!==state.world.location&&!arrivalConfirmed)return beginWorldLifeTravel('chain',c.id,c.locId);const a=chainActorData(c);
 overlay(SOSText("social_world_life_chains.showSocialChain.002",esc(c.sourceTitle),esc(c.text||socialChainText(c)),esc(worldLocation(c.locId).name),c.activatedDay||state.world.day,[a.npc?.name,a.r?.name,a.comp?.name].filter(Boolean).map(esc).join(' • '),socialChainChoiceSet(c).map(([id,label,desc])=>`<button data-chainchoice="${id}"><b>${esc(label)}</b><br><small>${esc(desc)}</small></button>`).join('')),true);document.querySelectorAll('[data-chainchoice]').forEach(b=>b.onclick=()=>resolveSocialChain(c.id,b.dataset.chainchoice));$('#socialChainBack').onclick=()=>showTownLife(c.locId)
}
function createSocialFollowupContract(c){const a=chainActorData(c),type=c.type==='traveler_request'?'delivery':c.type==='work_contract'?'escort':pick(['visit','delivery','procure']),q=generateContract(c.locId,type);q.socialChainId=c.id;q.socialSourceTitle=c.sourceTitle;q.name=c.type==='traveler_request'?'Road Contact Follow-Up':c.type==='work_contract'?'Social Connection Contract':SOSText("social_world_life_chains.createSocialFollowupContract.001");q.desc=SOSText("social_world_life_chains.createSocialFollowupContract.002",c.sourceTitle,a.r?`${a.r.name} is directly involved.`:'');q.reward+=30;state.world.contracts[c.locId]=state.world.contracts[c.locId]||[];state.world.contracts[c.locId].unshift(q);state.world.contracts[c.locId]=state.world.contracts[c.locId].slice(0,4);return q}
function resolveSocialChain(id,choice){
 const C=socialChainState(),c=C.chains.find(x=>x.id===id);if(!c||c.status!=='active')return showTownLife(state.world.location);const a=chainActorData(c);let text='',tone='info';
 if(['support','attend','help','mediate'].includes(choice)){changeLocalReputation(c.locId,1,SOSText("social_world_life_chains.resolveSocialChain.001",c.sourceTitle));if(['wedding','celebration','friendship'].includes(c.type)&&a.r&&!a.r.settledAt&&choice==='support'){a.r.settledAt=c.locId;a.r.history.push({day:state.world.day,event:'base_established',detail:SOSText("social_world_life_chains.resolveSocialChain.002",worldLocation(c.locId).name,c.sourceTitle),region:locationRegion(c.locId)});populationMovementState().history.push({day:state.world.day,type:'traveler_base',travelerId:a.r.id,to:c.locId,text:SOSText("social_world_life_chains.resolveSocialChain.003",a.r.name,worldLocation(c.locId).name)})}if(a.npc){const nr=npcRelationshipState(a.npc.id);nr.familiarity=clamp(nr.familiarity+1,0,10);npcMemoryAdd(a.npc.id,SOSText("social_world_life_chains.resolveSocialChain.004",c.sourceTitle),1)}if(a.r){a.r.social=a.r.social||{familiarity:0};a.r.social.familiarity=clamp((a.r.social.familiarity||0)+1,0,10);a.r.history.push({day:state.world.day,event:'consequence_followup',detail:SOSText("social_world_life_chains.resolveSocialChain.005",c.sourceTitle),region:locationRegion(c.locId)})}if(a.comp){SOSServices.companions.adjustTrust(a.comp.id,1);if(a.npc)setCompanionNpcOpinion(a.comp.id,a.npc.id,1,SOSText("social_world_life_chains.resolveSocialChain.006",c.sourceTitle));if(a.r)setCompanionTravelerOpinion(a.comp.id,a.r.id,1,SOSText("social_world_life_chains.resolveSocialChain.007",c.sourceTitle));SOSServices.companions.noteSharedEvent('social_chain',SOSText("social_world_life_chains.resolveSocialChain.008",a.comp.name,c.sourceTitle),[a.comp.id],c.locId)}text=SOSText("social_world_life_chains.resolveSocialChain.009");tone='good'}
 else if(choice==='contract'){const q=createSocialFollowupContract(c);text=SOSText("social_world_life_chains.resolveSocialChain.010",q.name);tone='good'}
 else if(choice==='side'){if(a.npc)npcMemoryAdd(a.npc.id,SOSText("social_world_life_chains.resolveSocialChain.011",c.sourceTitle),0);if(a.r)a.r.history.push({day:state.world.day,event:'side_taken',detail:SOSText("social_world_life_chains.resolveSocialChain.012",c.sourceTitle),region:locationRegion(c.locId)});text=SOSText("social_world_life_chains.resolveSocialChain.013");tone='bad'}
 else if(choice==='accept'){if(c.type==='departure'&&a.npc){const dest=populationDestinationsForNpc(a.npc)[0];if(dest)relocateSettlementNpc(a.npc.id,dest.id,SOSText("social_world_life_chains.resolveSocialChain.014")+c.sourceTitle,true)}text=SOSText("social_world_life_chains.resolveSocialChain.015")}
 else{text=SOSText("social_world_life_chains.resolveSocialChain.016")}
 c.status='resolved';c.resolvedDay=state.world.day;c.choice=choice;c.result=text;C.history.push({day:state.world.day,type:'resolved',locId:c.locId,chainId:c.id,text,result:text});C.history=C.history.slice(-100);recordWorldHistory(SOSText("social_world_life_chains.resolveSocialChain.017",worldLocation(c.locId).name,text),tone,SOSText("social_world_life_chains.resolveSocialChain.018"));save();actionResult(SOSText("social_world_life_chains.resolveSocialChain.019"),text,tone,()=>showTownLife(c.locId))
}
function maybeQueueSocialChainFromEvent(e){if(!e||e.status!=='resolved'||e.chainQueued)return;e.chainQueued=true;if(chance(.55))queueSocialConsequence(e);if((e.choices||[]).some(x=>x.choice==='mediate'||x.choice==='followup')&&chance(.20))queueSocialConsequence(e,null,rnd(10,22))}
function socialChainDailyTick(){if(!isOpenWorld())return;const C=socialChainState();if(C.lastTickDay>=state.world.day){activateDueSocialChains();return}while(C.lastTickDay<state.world.day){C.lastTickDay++;activateDueSocialChains()}C.chains=C.chains.slice(-80);C.history=C.history.slice(-100)}
function companionNpcOpinionState(){const B=relationshipBridgeState();if(!B.companionNpcOpinions)B.companionNpcOpinions={};return B.companionNpcOpinions}
function setCompanionNpcOpinion(compId,npcId,delta,reason){if(!compId||!npcId)return;const O=companionNpcOpinionState(),key=`${compId}:${npcId}`,o=O[key]||(O[key]={compId,npcId,score:0,history:[]});o.score=clamp(o.score+delta,-5,5);o.history.push({day:state.world.day,delta,reason});o.history=o.history.slice(-10)}
function companionNpcOpinionLabel(compId,npcId){const o=companionNpcOpinionState()[`${compId}:${npcId}`],s=o?.score||0;return s>=4?'Very Fond':s>=2?'Likes Them':s<=-4?'Strongly Dislikes':s<=-2?'Dislikes Them':SOSText("social_world_life_chains.companionNpcOpinionLabel.001")}


function companionSocialNetworkState(){
 const B=relationshipBridgeState();if(!B.companionSocial)B.companionSocial={requests:[],travelerOpinions:{},history:[],lastGenDay:{}};
 const C=B.companionSocial;if(!Array.isArray(C.requests))C.requests=[];if(!C.travelerOpinions)C.travelerOpinions={};if(!Array.isArray(C.history))C.history=[];if(!C.lastGenDay)C.lastGenDay={};return C
}
function companionTravelerOpinion(compId,travelerId){
 const C=companionSocialNetworkState(),key=`${compId}:${travelerId}`;return C.travelerOpinions[key]||(C.travelerOpinions[key]={compId,travelerId,score:0,history:[]})
}
function setCompanionTravelerOpinion(compId,travelerId,delta,reason){
 if(!compId||!travelerId)return;const tr=travelerRegistryState().records[travelerId];if(tr)travelerContactPerson(tr,compId);const o=companionTravelerOpinion(compId,travelerId);o.score=clamp((o.score||0)+delta,-5,5);o.history.push({day:state.world.day,delta,reason});o.history=o.history.slice(-10)
}
function companionTravelerOpinionLabel(compId,travelerId){
 const s=companionTravelerOpinion(compId,travelerId).score||0;return s>=4?'Trusts Them':s>=2?'Likes Them':s<=-4?'Cannot Stand Them':s<=-2?'Distrusts Them':SOSText("social_world_life_chains.companionTravelerOpinionLabel.001")
}
function companionSocialRequests(locId=null){
 return companionSocialNetworkState().requests.filter(r=>r.status==='active'&&(!locId||r.locId===locId)&&r.expiresDay>=state.world.day)
}
function companionSocialRequestText(r){
 const m=state.party.members[r.compId],npc=r.npcId?settlementNpc(r.locId,r.npcId):null,tr=r.travelerId?travelerRegistryState().records[r.travelerId]:null,tref=tr?travelerReferenceForCompanion(tr,r.compId):null;
 if(r.type==='visit')return SOSText("social_world_life_chains.companionSocialRequestText.001",m.name,npc?.name||'a local acquaintance',worldLocation(r.locId).name);
 if(r.type==='avoid')return SOSText("social_world_life_chains.companionSocialRequestText.002",m.name,npc?.name||tref||'someone here',worldLocation(r.locId).name);
 if(r.type==='traveler')return SOSText("social_world_life_chains.companionSocialRequestText.003",m.name,tref||'a recurring road contact');
 if(r.type==='personal_local')return SOSText("social_world_life_chains.companionSocialRequestText.004",m.name,npc?.name||'someone in town');
 return SOSText("social_world_life_chains.companionSocialRequestText.005",m.name,worldLocation(r.locId).name)
}
function maybeGenerateCompanionSocialRequest(locId,force=false){
 const C=companionSocialNetworkState();if(companionSocialRequests(locId).length)return companionSocialRequests(locId)[0];
 if(!force&&(state.world.day-(C.lastGenDay[locId]||-99)<3||!chance(.28)))return null;
 const active=activeRoadCompanions();if(!active.length)return null;const candidates=[];
 for(const m of active){
  const npcOpinions=Object.values(companionNpcOpinionState()).filter(o=>o.compId===m.id&&Math.abs(o.score)>=2);
  for(const o of npcOpinions){const home=npcHomeLocation(o.npcId);if(currentNpcLocation(o.npcId,home)===locId)candidates.push({compId:m.id,npcId:o.npcId,type:o.score<0?'avoid':'visit',weight:Math.abs(o.score)+2})}
  const travOps=Object.values(C.travelerOpinions).filter(o=>o.compId===m.id&&Math.abs(o.score)>=2);
  for(const o of travOps){const tr=travelerRegistryState().records[o.travelerId];if(tr&&travelerPresentAtLocation(tr,locId))candidates.push({compId:m.id,travelerId:o.travelerId,type:o.score<0?'avoid':'traveler',weight:Math.abs(o.score)+1})}
  if((m.trust||0)>=62){const familiar=(SETTLEMENT_NPCS[locId]||[]).filter(n=>npcRelationshipState(n.id).familiarity>=4);if(familiar.length)candidates.push({compId:m.id,npcId:pick(familiar).id,type:'personal_local',weight:2})}
 }
 if(!candidates.length)return null;const max=Math.max(...candidates.map(x=>x.weight)),row=pick(candidates.filter(x=>x.weight>=max-1));
 const r={id:uid(),...row,locId,status:'active',createdDay:state.world.day,expiresDay:state.world.day+5};C.requests.push(r);C.requests=C.requests.slice(-30);C.lastGenDay[locId]=state.world.day;C.history.push({day:state.world.day,type:'request',locId,compId:r.compId,text:companionSocialRequestText(r)});C.history=C.history.slice(-80);return r
}
function companionSocialTownHTML(locId){
 const r=companionSocialRequests(locId)[0]||maybeGenerateCompanionSocialRequest(locId,false);if(!r)return'';
 return SOSText("social_world_life_chains.companionSocialTownHTML.001",esc(state.party.members[r.compId]?.name||'Companion'),esc(companionSocialRequestText(r)))
}
function showCompanionSocialRequest(id){modalRouteEnter(SOSText("social_world_life_chains.showCompanionSocialRequest.001"),Array.from(arguments));
 const r=companionSocialNetworkState().requests.find(x=>x.id===id);if(!r||r.status!=='active')return showTownLife(state.world.location);const m=state.party.members[r.compId],npc=r.npcId?settlementNpc(r.locId,r.npcId):null,tr=r.travelerId?travelerRegistryState().records[r.travelerId]:null;
 overlay(SOSText("social_world_life_chains.showCompanionSocialRequest.002",esc(m.name),esc(companionSocialRequestText(r)),npc?`<div class="notice compact"><b>${esc(npc.name)}</b> • ${esc(npc.role)}<br>${esc(m.name)} → ${esc(npc.name)}: ${esc(companionNpcOpinionLabel(m.id,npc.id))}</div>`:'',tr?`<div class="notice compact"><b>${esc(travelerReferenceForCompanion(tr,m.id))}</b><br>${esc(m.name)} → contact: ${esc(companionTravelerOpinionLabel(m.id,tr.id))} • Guardian/company standing: ${esc(travelerAttitudeLabel(tr))}${tr.identity?`<br><small>${esc(tr.identity.groupName)} • ${tr.identity.members.length} known members</small>`:''}</div>`:''),true);
 document.querySelectorAll('[data-comp-social]').forEach(b=>b.onclick=()=>resolveCompanionSocialRequest(id,b.dataset.compSocial));$('#compSocialBack').onclick=()=>showTownLife(r.locId)
}
function resolveCompanionSocialRequest(id,choice){
 const C=companionSocialNetworkState(),r=C.requests.find(x=>x.id===id);if(!r||r.status!=='active')return showTownLife(state.world.location);const m=state.party.members[r.compId],npc=r.npcId?settlementNpc(r.locId,r.npcId):null,tr=r.travelerId?travelerRegistryState().records[r.travelerId]:null;let text='',tone='info';
 if(choice==='agree'){
  SOSServices.companions.adjustTrust(m.id,2);if(npc){setCompanionNpcOpinion(m.id,npc.id,r.type==='avoid'?0:1,SOSText("social_world_life_chains.resolveCompanionSocialRequest.001"));const nr=npcRelationshipState(npc.id);nr.familiarity=clamp(nr.familiarity+1,0,10);npcMemoryAdd(npc.id,SOSText("social_world_life_chains.resolveCompanionSocialRequest.002",m.name),1)}
  if(tr){setCompanionTravelerOpinion(m.id,tr.id,r.type==='avoid'?0:1,SOSText("social_world_life_chains.resolveCompanionSocialRequest.003"));tr.social=tr.social||{familiarity:0};if(r.type!=='avoid')tr.social.familiarity=clamp((tr.social.familiarity||0)+1,0,10)}
  text=r.type==='avoid'?SOSText("social_world_life_chains.resolveCompanionSocialRequest.004",m.name):SOSText("social_world_life_chains.resolveCompanionSocialRequest.005",m.name);tone='good'
 }else if(choice==='talk'){
  SOSServices.companions.adjustTrust(m.id,1);if(chance(.35)){const q=createRelationshipGeneratedContract(r.locId,{kind:'companion',companion:m,weight:Math.floor((m.trust||0)/10)},true);text=SOSText("social_world_life_chains.resolveCompanionSocialRequest.006",m.name,q.name)}else{text=SOSText("social_world_life_chains.resolveCompanionSocialRequest.007",m.name)}SOSServices.companions.noteSharedEvent('social_request',SOSText("social_world_life_chains.resolveCompanionSocialRequest.008",m.name,npc?.name||tr?.name||'a local relationship'),[m.id],r.locId)
 }else{SOSServices.companions.adjustTrust(m.id,-1);text=SOSText("social_world_life_chains.resolveCompanionSocialRequest.009",m.name);tone='bad'}
 r.status='resolved';r.resolvedDay=state.world.day;r.choice=choice;r.result=text;C.history.push({day:state.world.day,type:'resolved_request',locId:r.locId,compId:r.compId,text});C.history=C.history.slice(-80);save();actionResult(SOSText("social_world_life_chains.resolveCompanionSocialRequest.010"),text,tone,()=>showTownLife(r.locId))
}
function companionTownInterjection(locId){
 const active=activeRoadCompanions();if(!active.length)return'';for(const m of active){
  const o=Object.values(companionNpcOpinionState()).filter(x=>x.compId===m.id&&Math.abs(x.score)>=2).sort((a,b)=>Math.abs(b.score)-Math.abs(a.score)).find(x=>(SETTLEMENT_NPCS[locId]||[]).some(n=>n.id===x.npcId));
  if(o){const npc=settlementNpc(locId,o.npcId);return `<div class="notice compact companion-town-interjection"><b>${esc(m.name)}</b><br>${o.score>0?`${esc(m.name)} seems pleased to be somewhere ${esc(npc.name)} might be around.`:`${esc(m.name)} is visibly less enthusiastic about running into ${esc(npc.name)} here.`}</div>`}
  const to=Object.values(companionSocialNetworkState().travelerOpinions).filter(x=>x.compId===m.id&&Math.abs(x.score)>=2).find(x=>{const tr=travelerRegistryState().records[x.travelerId];return tr&&((tr.regions||[]).includes(locationRegion(locId))||tr.settledAt===locId)});
  if(to){const tr=travelerRegistryState().records[to.travelerId],ref=travelerReferenceForCompanion(tr,m.id);return `<div class="notice compact companion-town-interjection"><b>${esc(m.name)}</b><br>${to.score>0?`${esc(m.name)} asks whether ${esc(ref)} has been seen around town.`:`${esc(m.name)} would prefer not to cross paths with ${esc(ref)}.`}</div>`}
 }
 return''
}
function npcCompanionInterest(locId,npc){
 const active=activeRoadCompanions();if(!active.length)return null;const O=companionNpcOpinionState(),ranked=active.map(m=>({m,o:O[`${m.id}:${npc.id}`],history:recentCompanionSharedEvents(m.id,8).length})).sort((a,b)=>Math.max(Math.abs(b.o?.score||0)*3,b.history)-Math.max(Math.abs(a.o?.score||0)*3,a.history));return ranked[0]?.m||null
}
function npcAskAboutCompanion(locId,npcId,compId){
 const npc=settlementNpc(locId,npcId),m=state.party.members[compId];if(!npc||!m)return showSettlementNPCConversation(locId,npcId);const op=companionNpcOpinionState()[`${m.id}:${npc.id}`],label=companionNpcOpinionLabel(m.id,npc.id),score=op?.score||0;let text='';
 if(score>=2)text=SOSText("social_world_life_chains.npcAskAboutCompanion.001",npc.name,m.name,m.name,npc.name);
 else if(score<=-2)text=SOSText("social_world_life_chains.npcAskAboutCompanion.002",npc.name,m.name,m.name,npc.name);
 else text=SOSText("social_world_life_chains.npcAskAboutCompanion.003",npc.name,m.name);
 const context=score?SOSText("social_world_life_chains.npcAskAboutCompanion.004",m.name,npc.name,label):SOSText("social_world_life_chains.npcAskAboutCompanion.005",m.name,npc.name);
 npcMemoryAdd(npc.id,SOSText("social_world_life_chains.npcAskAboutCompanion.006",m.name),1);SOSServices.companions.noteSharedEvent('npc_interest',SOSText("social_world_life_chains.npcAskAboutCompanion.007",npc.name,m.name,worldLocation(locId).name),[m.id],locId);save();actionResult(SOSText("social_world_life_chains.npcAskAboutCompanion.008",npc.name,m.name),SOSText("social_world_life_chains.npcAskAboutCompanion.009",text,context,m.name,m.trust),'info',()=>showSettlementNPCConversation(locId,npcId))
}
function socialEventCompanionInterjection(e){
 const a=socialEventActorNames(e);if(!a.c)return'';const npcScore=a.npc?(companionNpcOpinionState()[`${a.c.id}:${a.npc.id}`]?.score||0):0,trScore=a.r?(companionSocialNetworkState().travelerOpinions[`${a.c.id}:${a.r.id}`]?.score||0):0;
 if(npcScore>=2)return SOSText("social_world_life_chains.socialEventCompanionInterjection.001",a.c.name,a.npc.name);
 if(npcScore<=-2)return SOSText("social_world_life_chains.socialEventCompanionInterjection.002",a.c.name,a.npc.name);
 if(trScore>=2)return SOSText("social_world_life_chains.socialEventCompanionInterjection.003",a.c.name,a.r.name);
 if(trScore<=-2)return SOSText("social_world_life_chains.socialEventCompanionInterjection.004",a.c.name,a.r.name);
 return SOSText("social_world_life_chains.socialEventCompanionInterjection.005",a.c.name)
}
function showCompanionSocialConnections(){modalRouteEnter(SOSText("social_world_life_chains.showCompanionSocialConnections.001"),Array.from(arguments));
 const members=activeRoadCompanions(),O=companionNpcOpinionState(),C=companionSocialNetworkState();
 overlay(SOSText("social_world_life_chains.showCompanionSocialConnections.002",members.map(m=>{const npcOps=Object.values(O).filter(o=>o.compId===m.id&&Math.abs(o.score)>=1).slice(-6),travOps=Object.values(C.travelerOpinions).filter(o=>o.compId===m.id&&Math.abs(o.score)>=1).slice(-6);return `<div class="card"><b>${esc(m.name)}</b><br><small>Guardian trust ${m.trust}</small>${npcOps.length?`<h4>Local people</h4>${npcOps.map(o=>{const loc=Object.keys(SETTLEMENT_NPCS).find(id=>(SETTLEMENT_NPCS[id]||[]).some(n=>n.id===o.npcId)),n=loc?settlementNpc(loc,o.npcId):null;return n?`<div class="compact">${esc(n.name)} — ${esc(companionNpcOpinionLabel(m.id,n.id))}</div>`:''}).join('')}`:''}${travOps.length?`<h4>Road contacts</h4>${travOps.map(o=>{const tr=travelerRegistryState().records[o.travelerId];return tr?`<div class="compact">${esc(travelerReferenceForCompanion(tr,m.id))} — ${esc(companionTravelerOpinionLabel(m.id,tr.id))}</div>`:''}).join('')}`:''}</div>`}).join('')||'<p class="muted">No active companion currently has established social connections.</p>'),true);wireClose()
}
function companionNpcSocialDailyTick(){
 if(!isOpenWorld())return;const C=companionSocialNetworkState();for(const r of C.requests)if(r.status==='active'&&r.expiresDay<state.world.day){r.status='expired';r.resolvedDay=state.world.day}
 if(state.world.settlements?.[state.world.location])maybeGenerateCompanionSocialRequest(state.world.location,false)
}


