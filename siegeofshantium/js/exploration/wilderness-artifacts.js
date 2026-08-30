function createFieldDiscovery(nearId,forcedKind=null,forcedName=null){
 const E=explorationState(),base=worldLocation(nearId),t=forcedKind?FIELD_DISCOVERY_TEMPLATES.find(x=>x.kind===forcedKind):pick(FIELD_DISCOVERY_TEMPLATES),id=`field_${E.nextFieldId++}`,name=forcedName||pick(t.names),d={id,name,kind:t.kind,nearId,day:state.world.day,text:pick(t.texts),searched:false,used:0,x:clamp(base.x+rnd(-7,7),3,97),y:clamp(base.y+rnd(-7,7),3,97)};
 E.fieldDiscoveries.push(d);E.fieldDiscoveries=E.fieldDiscoveries.slice(-24);recordWorldHistory(SOSText("exploration_wilderness_artifacts.createFieldDiscovery.001",name,base.name),'good','exploration');return d
}
function fieldDiscoveryReward(d){
 if(d.searched)return [SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.001"),SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.002"),0];d.searched=true;
 if(d.kind==='cache'){const gain=rnd(12,28);gainGold(gain),clue=resolveFieldClueCompletion(d);if(clue)return [SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.003"),SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.004",gain,clue),gain];if(chance(.2)){const r=pick(EXPLORATION_RARES);invAdd(r.id,1);return [SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.005"),SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.006",gain,r.name),gain]}return [SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.007"),SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.008",gain),gain]}
 if(d.kind==='campsite'){explorationState().minorUses[d.id]=(explorationState().minorUses[d.id]||0)+1;state.guardian.stamina=Math.min(maxStamina(),state.guardian.stamina+18);return [SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.009"),SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.010"),0]}
 if(d.kind==='landmark'){gainScouting(2);return [SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.011"),SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.012"),0]}
 gainScouting(1);const clue=resolveFieldClueCompletion(d);return [SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.013"),SOSText("exploration_wilderness_artifacts.fieldDiscoveryReward.014",clue?` ${clue}`:''),0]
}
function showFieldDiscovery(id){modalRouteEnter(SOSText("exploration_wilderness_artifacts.showFieldDiscovery.001"),Array.from(arguments));
 const d=fieldDiscovery(id);if(!d)return showExplorationJournal();overlay(SOSText("exploration_wilderness_artifacts.showFieldDiscovery.002",esc(d.name),esc(d.kind),esc(worldLocation(d.nearId).name),d.day,esc(d.text),d.searched?'<div class="success notice">This minor site has been investigated.</div>':'<button id="fieldSearch">Investigate</button>',d.kind==='campsite'?'<button id="fieldCamp">Use as Field Camp</button>':''),true);
 if($('#fieldSearch'))$('#fieldSearch').onclick=()=>{const r=fieldDiscoveryReward(d);save();actionResult(r[0],r[1],'good',()=>showFieldDiscovery(id))};if($('#fieldCamp'))$('#fieldCamp').onclick=()=>{advanceWorldDays(1,SOSText("exploration_wilderness_artifacts.showFieldDiscovery.003",d.name));state.guardian.hp=Math.min(maxHP(),state.guardian.hp+Math.round(maxHP()*.35));state.guardian.stamina=maxStamina();explorationState().minorUses[d.id]=(explorationState().minorUses[d.id]||0)+1;for(const m of activeRoadCompanions())SOSServices.companions.noteSharedEvent('camp',SOSText("exploration_wilderness_artifacts.showFieldDiscovery.004",m.name,d.name),[m.id]);save();actionResult(SOSText("exploration_wilderness_artifacts.showFieldDiscovery.005"),SOSText("exploration_wilderness_artifacts.showFieldDiscovery.006",d.name),'good',()=>showFieldDiscovery(id))};$('#fieldBack').onclick=()=>SOSServices.navigation.back(showExplorationJournal)
}
function clueState(key){const E=explorationState();if(!E.clues[key])E.clues[key]={stage:0,startedDay:null,completedDay:null};return E.clues[key]}
function clueForSite(siteId){return Object.entries(EXPLORATION_CLUE_CHAINS).find(([,d])=>d.start===siteId||d.next===siteId)||null}
function progressExplorationClue(siteId){
 const hit=clueForSite(siteId);if(!hit)return null;const [key,d]=hit,q=clueState(key);
 if(siteId===d.start&&q.stage===0){q.stage=1;q.startedDay=state.world.day;const next=worldLocation(d.next);discoverWildernessSite(next,SOSText("exploration_wilderness_artifacts.progressExplorationClue.001",worldLocation(siteId).name));return SOSText("exploration_wilderness_artifacts.progressExplorationClue.002",d.title,next.name)}
 if(siteId===d.next&&q.stage===1){q.stage=2;const final=createFieldDiscovery(siteId,d.finalKind,d.finalName);q.finalId=final.id;return SOSText("exploration_wilderness_artifacts.progressExplorationClue.003",d.title,final.name)}
 return null
}
function completeExplorationClueFromField(id){
 const hit=Object.entries(EXPLORATION_CLUE_CHAINS).find(([,d])=>clueState(arguments[1]||'').finalId===id);return hit
}
function resolveFieldClueCompletion(d){
 const pair=Object.entries(EXPLORATION_CLUE_CHAINS).find(([k])=>clueState(k).finalId===d.id);if(!pair)return null;const [key,def]=pair,q=clueState(key);if(q.stage>=3)return null;q.stage=3;q.completedDay=state.world.day;if(def.rare&&!artifactOwned(def.rare)){invAdd(def.rare,1);recordWorldHistory(SOSText("exploration_wilderness_artifacts.resolveFieldClueCompletion.001",def.title,item(def.rare).name),'good','exploration');return SOSText("exploration_wilderness_artifacts.resolveFieldClueCompletion.002",def.title,item(def.rare).name)}return SOSText("exploration_wilderness_artifacts.resolveFieldClueCompletion.003",def.title)
}
function showExplorationClues(){modalRouteEnter(SOSText("exploration_wilderness_artifacts.showExplorationClues.001"),Array.from(arguments));
 const rows=Object.entries(EXPLORATION_CLUE_CHAINS).map(([k,d])=>({k,d,q:clueState(k)}));overlay(SOSText("exploration_wilderness_artifacts.showExplorationClues.002",rows.map(x=>`<div class="card"><b>${esc(x.d.title)}</b><br><small>${x.q.stage===0?'Not begun':x.q.stage===1?`Follow the clue to ${esc(worldLocation(x.d.next).name)}`:x.q.stage===2?`Final lead recorded: ${esc(fieldDiscovery(x.q.finalId)?.name||'field location')}`:`Completed Day ${x.q.completedDay}`}</small>${x.q.stage>0?`<p>${esc(x.d.text)}</p>`:''}</div>`).join('')),true);wireClose()
}
function explorationState(){ensureWorldState();const E=state.world.exploration;if(!E.retiredSites||typeof E.retiredSites!=='object')E.retiredSites={};return E}
function hiddenWorldSites(){return WORLD_LOCATIONS.filter(x=>x.hidden)}
function discoveredHiddenSites(){return hiddenWorldSites().filter(x=>state.world.discovered.includes(x.id))}
function unexploredHiddenSites(){return hiddenWorldSites().filter(x=>!state.world.discovered.includes(x.id))}
function explorationSearchSkill(){
 let n=Math.floor((state.scouting||0)/3)+Math.floor(stat(state,'wis')/3);
 for(const m of activeRoadCompanions()){const cls=allyDef(m.id)?.className||m.className||'';if(cls===SOSText("exploration_wilderness_artifacts.explorationSearchSkill.001"))n+=4;else if(cls===SOSText("exploration_wilderness_artifacts.explorationSearchSkill.002"))n+=2}
 return n
}
function siteDistance(a,b){const A=worldLocation(a),B=worldLocation(b);return Math.hypot(A.x-B.x,A.y-B.y)}
function nearbyUndiscoveredSites(locId=state.world.location,radius=30){const region=locationRegion(locId);return unexploredHiddenSites().filter(s=>locationRegion(s)===region&&siteDistance(locId,s.id)<=radius).sort((a,b)=>siteDistance(locId,a.id)-siteDistance(locId,b.id))}

function hiddenSiteRetired(id){return !!explorationState().retiredSites?.[id]}
function hiddenSiteHasOpenCompanionBusiness(id){
 for(const m of Object.values(state.party?.members||{})){const d=companionExplorationDef(m.id),q=companionExplorationQuest(m.id);if(d?.site===id&&['available','active','decision'].includes(q.status))return true}return false
}
function hiddenSiteUsefulActionsComplete(id){
 const loc=worldLocation(id),S=explorationSiteState(id);if(!loc?.hidden)return false;if(hiddenSiteHasOpenCompanionBusiness(id))return false;
 if(isMinorHiddenSite(loc))return (S.searched||0)>0;
 const I=interiorState(id);return !!I.completed&&(S.searched||0)>0
}
function retireHiddenSite(id){
 if(!hiddenSiteUsefulActionsComplete(id))return actionResult(SOSText("exploration_wilderness_artifacts.retireHiddenSite.001"),SOSText("exploration_wilderness_artifacts.retireHiddenSite.002"),'info',()=>showWildernessSite(id));const E=explorationState();E.retiredSites=E.retiredSites||{};E.retiredSites[id]={day:state.world.day,status:explorationSiteState(id).status||'cleared'};recordWorldHistory(SOSText("exploration_wilderness_artifacts.retireHiddenSite.003",worldLocation(id).name),'info','exploration');save();closeOverlay();renderOpenWorld()
}
function restoreRetiredHiddenSite(id){const E=explorationState();if(E.retiredSites)delete E.retiredSites[id];const S=explorationSiteState(id);if(S.status==='abandoned')S.status=interiorState(id).completed?'cleared':'discovered';save();showWildernessSite(id)}
function giveUpHiddenSiteExploration(id){
 const loc=worldLocation(id),E=explorationState(),S=explorationSiteState(id),I=interiorState(id);if(!loc?.hidden)return;
 if(!confirm(`Give up exploration of ${loc.name}?

This removes the site from the active map without granting completion rewards. You can restore it later from the Exploration Journal.`))return;
 E.retiredSites=E.retiredSites||{};E.retiredSites[id]={day:state.world.day,status:'abandoned',reason:'gave up exploration'};
 I.abandoned=true;I.abandonedDay=state.world.day;S.status='abandoned';S.notes=S.notes||[];S.notes.push(`Day ${state.world.day}: The Guardian gave up further exploration. The site was removed from the active map.`);
 recordWorldHistory(`${loc.name}: the Guardian gave up further exploration and removed the site from the active map.`,'info','exploration');save();closeOverlay();renderOpenWorld()
}
function explorationSiteState(id){const E=explorationState();if(!E.sites[id])E.sites[id]={visits:0,searched:0,status:'discovered',notes:[],lastVisit:0};return E.sites[id]}
function discoverWildernessSite(site,reason='exploration'){
 if(!site||state.world.discovered.includes(site.id))return false;state.world.discovered.push(site.id);const E=explorationState(),S=explorationSiteState(site.id);S.status='discovered';E.discoveries.push({id:site.id,day:state.world.day,reason});E.discoveries=E.discoveries.slice(-30);state.world.mapView.lastLocation=null;recordWorldHistory(SOSText("exploration_wilderness_artifacts.discoverWildernessSite.001",site.name,reason),'good','exploration');log(SOSText("exploration_wilderness_artifacts.discoverWildernessSite.002",site.name),'good');return true
}
function surveyCurrentRegion(){
 if(!isOpenWorld()||captivityActive())return;const E=explorationState(),loc=worldLocation(state.world.location),near=nearbyUndiscoveredSites(loc.id,34);E.surveys=(E.surveys||0)+1;E.searched[loc.id]=(E.searched[loc.id]||0)+1;
 const skill=explorationSearchSkill(),fatigue=Math.max(0,(E.searched[loc.id]||1)-2)*5,chancePct=clamp(30+skill*4-fatigue+(near.length?12:0),15,88);
 advanceWorldDays(1,SOSText("exploration_wilderness_artifacts.surveyCurrentRegion.001",loc.name));
 if(!near.length){if(chance(.52)){const f=createFieldDiscovery(loc.id);save();return actionResult(SOSText("exploration_wilderness_artifacts.surveyCurrentRegion.002"),SOSText("exploration_wilderness_artifacts.surveyCurrentRegion.003",f.name,loc.name,f.text),'good',()=>showFieldDiscovery(f.id))}E.failedSearches=(E.failedSearches||0)+1;save();return actionResult(SOSText("exploration_wilderness_artifacts.surveyCurrentRegion.004"),SOSText("exploration_wilderness_artifacts.surveyCurrentRegion.005"),'info',renderOpenWorld)}
 if(rnd(1,100)<=chancePct){const weights=[];near.forEach((s,i)=>{for(let n=0;n<Math.max(1,5-i);n++)weights.push(s)});const found=pick(weights);discoverWildernessSite(found,SOSText("exploration_wilderness_artifacts.surveyCurrentRegion.006",loc.name));save();return actionResult(SOSText("exploration_wilderness_artifacts.surveyCurrentRegion.007"),SOSText("exploration_wilderness_artifacts.surveyCurrentRegion.008",found.name,found.desc),'good',renderOpenWorld)}
 if(chance(.38)){const f=createFieldDiscovery(loc.id);save();return actionResult(SOSText("exploration_wilderness_artifacts.surveyCurrentRegion.009"),SOSText("exploration_wilderness_artifacts.surveyCurrentRegion.010",f.name,f.text),'good',()=>showFieldDiscovery(f.id))}E.failedSearches=(E.failedSearches||0)+1;save();actionResult(SOSText("exploration_wilderness_artifacts.surveyCurrentRegion.011"),SOSText("exploration_wilderness_artifacts.surveyCurrentRegion.012"),'info',renderOpenWorld)
}
function wildernessSiteReward(site){
 const S=explorationSiteState(site.id);if(S.searched>0)return null;S.searched++;const kind=site.siteKind;
 if(kind==='shrine'){state.reputation++;return [SOSText("exploration_wilderness_artifacts.wildernessSiteReward.001"),SOSText("exploration_wilderness_artifacts.wildernessSiteReward.002"),18]}
 if(kind==='battlefield'){return [SOSText("exploration_wilderness_artifacts.wildernessSiteReward.003"),SOSText("exploration_wilderness_artifacts.wildernessSiteReward.004"),28]}
 if(kind==='mine'){roadEventCargo('iron',1);return [SOSText("exploration_wilderness_artifacts.wildernessSiteReward.005"),SOSText("exploration_wilderness_artifacts.wildernessSiteReward.006"),0]}
 if(kind==='homestead'){roadEventCargo('food',1);return [SOSText("exploration_wilderness_artifacts.wildernessSiteReward.007"),SOSText("exploration_wilderness_artifacts.wildernessSiteReward.008"),0]}
 if(kind==='hideout'){gainScouting(2);return [SOSText("exploration_wilderness_artifacts.wildernessSiteReward.009"),SOSText("exploration_wilderness_artifacts.wildernessSiteReward.010"),0]}
 if(kind==='cave'){return [SOSText("exploration_wilderness_artifacts.wildernessSiteReward.011"),SOSText("exploration_wilderness_artifacts.wildernessSiteReward.012"),24]}
 if(kind==='ruin'){gainScouting(2);return [SOSText("exploration_wilderness_artifacts.wildernessSiteReward.013"),SOSText("exploration_wilderness_artifacts.wildernessSiteReward.014"),0]}
 if(kind==='strange'){gainScouting(1);return [SOSText("exploration_wilderness_artifacts.wildernessSiteReward.015"),SOSText("exploration_wilderness_artifacts.wildernessSiteReward.016"),12]}
 return [SOSText("exploration_wilderness_artifacts.wildernessSiteReward.017"),SOSText("exploration_wilderness_artifacts.wildernessSiteReward.018"),12]
}
function searchWildernessSite(id){
 const site=worldLocation(id),S=explorationSiteState(id);S.visits++;S.lastVisit=state.world.day;
 const reward=wildernessSiteReward(site);checkRegionalStorySiteProgress(id);advanceWorldDays(1,SOSText("exploration_wilderness_artifacts.searchWildernessSite.001",site.name));
 if(!reward){save();return actionResult(SOSText("exploration_wilderness_artifacts.searchWildernessSite.002"),SOSText("exploration_wilderness_artifacts.searchWildernessSite.003"),'info',()=>showWildernessSite(id))}
 if(reward[2])gainGold(reward[2]);S.status='surveyed';S.notes.push(reward[1]);recordWorldHistory(`${site.name}: ${reward[1]}`,'good','exploration');save();actionResult(reward[0],reward[1],'good',()=>showWildernessSite(id))
}



const COMPANION_EXPLORATION_DEFS={
 spear:{title:SOSText("exploration_wilderness_artifacts.searchWildernessSite.004"),site:'collapsedmine',trust:55,intro:SOSText("exploration_wilderness_artifacts.searchWildernessSite.005"),objective:SOSText("exploration_wilderness_artifacts.searchWildernessSite.006"),choice:['preserve','salvage']},
 archer:{title:SOSText("exploration_wilderness_artifacts.searchWildernessSite.007"),site:'oldtower',trust:55,intro:SOSText("exploration_wilderness_artifacts.searchWildernessSite.008"),objective:SOSText("exploration_wilderness_artifacts.searchWildernessSite.009"),choice:['map','leave']},
 scout:{title:SOSText("exploration_wilderness_artifacts.searchWildernessSite.010"),site:'battlefield',trust:55,intro:SOSText("exploration_wilderness_artifacts.searchWildernessSite.011"),objective:SOSText("exploration_wilderness_artifacts.searchWildernessSite.012"),choice:['share','keep']},
 healer:{title:SOSText("exploration_wilderness_artifacts.searchWildernessSite.013"),site:'ashfarm',trust:58,intro:SOSText("exploration_wilderness_artifacts.searchWildernessSite.014"),objective:SOSText("exploration_wilderness_artifacts.searchWildernessSite.015"),choice:['memorial','supplies']},
 defector:{title:SOSText("exploration_wilderness_artifacts.searchWildernessSite.016"),site:'oldshrine',trust:60,intro:SOSText("exploration_wilderness_artifacts.searchWildernessSite.017"),objective:SOSText("exploration_wilderness_artifacts.searchWildernessSite.018"),choice:['record','quiet']},
 spawn:{title:SOSText("exploration_wilderness_artifacts.searchWildernessSite.019"),site:'sinkhole',trust:60,intro:SOSText("exploration_wilderness_artifacts.searchWildernessSite.020"),objective:SOSText("exploration_wilderness_artifacts.searchWildernessSite.021"),choice:['study','seal']},
 rogue:{title:SOSText("exploration_wilderness_artifacts.searchWildernessSite.022"),site:'smugglerhide',trust:55,intro:SOSText("exploration_wilderness_artifacts.searchWildernessSite.023"),objective:SOSText("exploration_wilderness_artifacts.searchWildernessSite.024"),choice:['contacts','burn']},
 field_hunter:{title:SOSText("exploration_wilderness_artifacts.searchWildernessSite.025"),site:'wolfcave',trust:58,intro:SOSText("exploration_wilderness_artifacts.searchWildernessSite.026"),objective:SOSText("exploration_wilderness_artifacts.searchWildernessSite.027"),choice:['mark','leave']},
 field_tracker:{title:SOSText("exploration_wilderness_artifacts.searchWildernessSite.028"),site:'banditcamp',trust:58,intro:SOSText("exploration_wilderness_artifacts.searchWildernessSite.029"),objective:SOSText("exploration_wilderness_artifacts.searchWildernessSite.030"),choice:['patrol','watch']},
 field_arcanist:{title:SOSText("exploration_wilderness_artifacts.searchWildernessSite.031"),site:'sinkhole',trust:58,intro:SOSText("exploration_wilderness_artifacts.searchWildernessSite.032"),objective:SOSText("exploration_wilderness_artifacts.searchWildernessSite.033"),choice:['study','seal']}
};
function companionExplorationState(){ensureWorldState();return state.world.companionExploration}
function companionExplorationDef(id){return COMPANION_EXPLORATION_DEFS[id]||null}
function companionExplorationQuest(id){
 const C=companionExplorationState();if(!C.quests[id])C.quests[id]={status:'locked',stage:0,startedDay:null,completedDay:null,choice:null,site:null};return C.quests[id]
}
function companionExplorationEligible(id){
 const m=state.party.members[id],d=companionExplorationDef(id),q=companionExplorationQuest(id);return !!(m&&d&&companionTrust(m)>=d.trust&&['locked','available'].includes(q.status))
}
function companionExplorationSiteKnown(id){
 const d=companionExplorationDef(id);return d&&state.world.discovered.includes(d.site)
}
function revealCompanionExplorationSite(id){
 const d=companionExplorationDef(id);if(!d)return false;const site=worldLocation(d.site);if(!state.world.discovered.includes(d.site))return discoverWildernessSite(site,SOSText("exploration_wilderness_artifacts.revealCompanionExplorationSite.001",state.party.members[id]?.name||'a companion'));return false
}
function maybeCompanionExplorationLead(){
 if(!isOpenWorld()||captivityActive())return;const C=companionExplorationState();if(state.world.day-(C.lastLeadDay||0)<2)return;
 const pool=activeRoadCompanions().filter(m=>companionExplorationEligible(m.id));if(!pool.length||!chance(.32))return;
 const m=pick(pool),d=companionExplorationDef(m.id),q=companionExplorationQuest(m.id);q.status='available';q.site=d.site;C.lastLeadDay=state.world.day;
 roadLifePush({type:'companion_exploration',a:m.id,title:`${m.name} — ${d.title}`,summary:d.intro});
 log(SOSText("exploration_wilderness_artifacts.maybeCompanionExplorationLead.001",m.name), 'good');save()
}
function startCompanionExplorationQuest(id){
 const m=state.party.members[id],d=companionExplorationDef(id),q=companionExplorationQuest(id);if(!m||!d)return;
 revealCompanionExplorationSite(id);q.status='active';q.stage=1;q.startedDay=state.world.day;q.site=d.site;
 companionExplorationState().history.push({day:state.world.day,id,title:d.title,event:'started'});recordWorldHistory(SOSText("exploration_wilderness_artifacts.startCompanionExplorationQuest.001",m.name,d.title),'info',SOSText("exploration_wilderness_artifacts.startCompanionExplorationQuest.002"));
 if(interiorState(d.site).completed)return completeCompanionExplorationSiteStage(id);
 save();actionResult(d.title,SOSText("exploration_wilderness_artifacts.startCompanionExplorationQuest.003",d.intro,d.objective,worldLocation(d.site).name),'good',()=>showCompanionExplorationQuest(id))
}
function companionExplorationObjective(id){
 const d=companionExplorationDef(id),q=companionExplorationQuest(id);if(!d)return'';
 if(q.status==='available')return SOSText("exploration_wilderness_artifacts.companionExplorationObjective.001",state.party.members[id]?.name||'this companion');
 if(q.status==='active'&&q.stage===1)return `${d.objective} ${state.party.active.includes(id)?'They are currently in the active party.':'They must be in the active party when the site is completed.'}`;
 if(q.status==='decision')return SOSText("exploration_wilderness_artifacts.companionExplorationObjective.002",state.party.members[id]?.name||'your companion');
 if(q.status==='complete')return SOSText("exploration_wilderness_artifacts.companionExplorationObjective.003",q.completedDay);
 return d.intro
}
function completeCompanionExplorationSiteStage(id){
 const d=companionExplorationDef(id),q=companionExplorationQuest(id),m=state.party.members[id];if(!d||!m||q.status!=='active')return false;
 if(!interiorState(d.site).completed||!state.party.active.includes(id))return false;
 q.status='decision';q.stage=2;SOSServices.companions.adjustTrust(id,3);const mem=companionMemory(m);mem.history.push({day:state.world.day,topic:'expedition',text:SOSText("exploration_wilderness_artifacts.completeCompanionExplorationSiteStage.001",d.title,worldLocation(d.site).name)});mem.history=mem.history.slice(-15);
 companionExplorationState().history.push({day:state.world.day,id,title:d.title,event:SOSText("exploration_wilderness_artifacts.completeCompanionExplorationSiteStage.002")});recordWorldHistory(SOSText("exploration_wilderness_artifacts.completeCompanionExplorationSiteStage.003",m.name,worldLocation(d.site).name),'good',SOSText("exploration_wilderness_artifacts.completeCompanionExplorationSiteStage.004"));save();return true
}
function companionExplorationChoiceText(id,key){
 const d=companionExplorationDef(id),m=state.party.members[id],site=worldLocation(d.site);
 const map={
  preserve:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.001"),
  salvage:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.002"),
  map:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.003"),
  leave:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.004"),
  share:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.005"),
  keep:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.006"),
  memorial:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.007"),
  supplies:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.008"),
  record:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.009"),
  quiet:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.010"),
  study:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.011"),
  seal:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.012"),
  contacts:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.013"),
  burn:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.014"),
  mark:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.015"),
  patrol:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.016"),
  watch:SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.017")
 };return map[key]||SOSText("exploration_wilderness_artifacts.companionExplorationChoiceText.018",m?.name||'the companion',site.name)
}
function resolveCompanionExplorationDecision(id,key){
 const d=companionExplorationDef(id),q=companionExplorationQuest(id),m=state.party.members[id];if(!d||!m||q.status!=='decision')return;
 q.choice=key;q.status='complete';q.completedDay=state.world.day;q.stage=3;SOSServices.companions.adjustTrust(id,5);state.reputation+=1;
 let text=companionExplorationChoiceText(id,key);
 if(['map','share','study','contacts','watch','patrol'].includes(key))gainScouting(2);
 if(['preserve','memorial','record','quiet','mark'].includes(key))state.reputation+=1;
 if(['salvage','supplies'].includes(key)){gainGold(25);text+=SOSText("exploration_wilderness_artifacts.resolveCompanionExplorationDecision.001")}
 if(key==='burn')settlementState('river').security=Math.min(100,settlementState('river').security+2);
 if(key==='patrol')settlementState('northgate').security=Math.min(100,settlementState('northgate').security+2);
 const mem=companionMemory(m);mem.history.push({day:state.world.day,topic:'expedition',text:SOSText("exploration_wilderness_artifacts.resolveCompanionExplorationDecision.002",d.title,text)});mem.history=mem.history.slice(-15);
 companionExplorationState().history.push({day:state.world.day,id,title:d.title,event:'completed',choice:key});recordWorldHistory(SOSText("exploration_wilderness_artifacts.resolveCompanionExplorationDecision.003",m.name,d.title,text),'good',SOSText("exploration_wilderness_artifacts.resolveCompanionExplorationDecision.004"));SOSServices.companions.noteSharedEvent('expedition',SOSText("exploration_wilderness_artifacts.resolveCompanionExplorationDecision.005",m.name,d.title,worldLocation(d.site).name),[id,...state.party.active]);save();actionResult(`${m.name} — ${d.title}`,SOSText("exploration_wilderness_artifacts.resolveCompanionExplorationDecision.006",text), 'good',()=>showCompanionExplorationQuest(id))
}
function showCompanionExplorationQuest(id){modalRouteEnter(SOSText("exploration_wilderness_artifacts.showCompanionExplorationQuest.001"),Array.from(arguments));
 const m=state.party.members[id],d=companionExplorationDef(id),q=companionExplorationQuest(id);if(!m||!d)return showWorldJournal();const site=worldLocation(d.site),progress=interiorProgress(d.site);
 overlay(SOSText("exploration_wilderness_artifacts.showCompanionExplorationQuest.002",esc(m.name),esc(d.title),esc(q.status),esc(site.name),progress.done,progress.total,esc(companionExplorationObjective(id)),esc(d.intro),q.status==='available'?`<button id="compExpStart">Follow ${esc(m.name)}'s Lead</button>`:'',q.status==='active'?`<div class="choice-list"><button id="compExpTravel">Travel to ${esc(site.name)}</button>${state.world.location===d.site?'<button id="compExpSite">Open Site</button>':''}</div>`:'',q.status==='decision'?`<h3>What should be done?</h3><div class="choice-list">${d.choice.map(k=>`<button data-compexpchoice="${k}">${esc(companionExplorationChoiceText(id,k))}</button>`).join('')}</div>`:'',q.status==='complete'?`<div class="success notice"><b>Completed Day ${q.completedDay}</b><br>${esc(companionExplorationChoiceText(id,q.choice))}</div>`:''),true);
 if($('#compExpStart'))$('#compExpStart').onclick=()=>startCompanionExplorationQuest(id);if($('#compExpTravel'))$('#compExpTravel').onclick=()=>{closeOverlay();attemptWorldTravel(d.site)};if($('#compExpSite'))$('#compExpSite').onclick=()=>showWildernessSite(d.site);document.querySelectorAll('[data-compexpchoice]').forEach(b=>b.onclick=()=>resolveCompanionExplorationDecision(id,b.dataset.compexpchoice));$('#compExpBack').onclick=()=>SOSServices.navigation.back(()=>showWorldJournal())
}
function activeCompanionExplorationQuests(){return Object.keys(COMPANION_EXPLORATION_DEFS).map(id=>({id,d:companionExplorationDef(id),q:companionExplorationQuest(id),m:state.party.members[id]})).filter(x=>x.m&&['available','active','decision'].includes(x.q.status))}
function companionSiteRecognition(siteId){
 const rows=[];for(const m of activeRoadCompanions()){const d=companionExplorationDef(m.id),q=companionExplorationQuest(m.id);if(d?.site===siteId&&companionTrust(m)>=d.trust){rows.push({m,d,q,line:q.status==='locked'?SOSText("exploration_wilderness_artifacts.companionSiteRecognition.001",m.name):q.status==='active'?SOSText("exploration_wilderness_artifacts.companionSiteRecognition.002",m.name):q.status==='decision'?SOSText("exploration_wilderness_artifacts.companionSiteRecognition.003",m.name):SOSText("exploration_wilderness_artifacts.companionSiteRecognition.004",m.name)})}}return rows
}
function showCompanionExpeditionJournal(){modalRouteEnter(SOSText("exploration_wilderness_artifacts.showCompanionExpeditionJournal.001"),Array.from(arguments));
 const all=Object.keys(COMPANION_EXPLORATION_DEFS).map(id=>({id,d:companionExplorationDef(id),q:companionExplorationQuest(id),m:state.party.members[id]})).filter(x=>x.m),hist=companionExplorationState().history.slice(-10).reverse();
 overlay(SOSText("exploration_wilderness_artifacts.showCompanionExpeditionJournal.002",all.map(x=>`<button class="companion-expedition-card" data-compexp="${x.id}"><span><b>${esc(x.m.name)} — ${esc(x.d.title)}</b><small>${esc(x.q.status)} • Trust ${companionTrust(x.m)}</small></span><span>${esc(companionExplorationObjective(x.id))}</span></button>`).join('')||'<p class="muted">No recruited companion currently has an exploration story.</p>',hist.map(h=>`<div class="card compact"><b>Day ${h.day}: ${esc(h.title)}</b><br>${esc(h.event)}</div>`).join('')||'<p class="muted">No companion expedition history yet.</p>'),true);document.querySelectorAll('[data-compexp]').forEach(b=>b.onclick=()=>showCompanionExplorationQuest(b.dataset.compexp));wireClose()
}
function artifactState(){ensureWorldState();return state.world.artifacts}
function explorationArtifactForSite(siteId){return EXPLORATION_ARTIFACTS.find(x=>x.site===siteId)}
function artifactOwned(id){return state.guardian.inventory.some(x=>x.id===id)||allEquipmentIds().includes(id)}
function awardExplorationArtifact(siteId){
 const a=explorationArtifactForSite(siteId),A=artifactState();if(!a)return null;
 if(A.found[a.id])return a;
 A.found[a.id]={day:state.world.day,site:siteId,name:a.name};A.history.push({day:state.world.day,id:a.id,site:siteId,name:a.name});A.history=A.history.slice(-30);
 if(!artifactOwned(a.id))invAdd(a.id,1);
 recordWorldHistory(SOSText("exploration_wilderness_artifacts.awardExplorationArtifact.001",a.name,worldLocation(siteId).name),'good','artifact');
 log(SOSText("exploration_wilderness_artifacts.awardExplorationArtifact.002",a.name),'good');return a
}
function equippedArtifactItems(ownerId='guardian'){
 const o=ownerFor(ownerId);return Object.values(o?.equipment||{}).map(item).filter(x=>x?.artifact)
}
function guardianArtifactBonus(kind){
 let n=0;for(const a of equippedArtifactItems('guardian')){
  if(a.artifactEffect==='survivor'&&state.guardian.hp<=maxHP()*.5){if(kind==='accuracy')n+=2;if(kind==='defense')n+=2}
  if(a.artifactEffect==='command'&&kind==='defense')n+=2;
  if(a.artifactEffect==='focus'){if(kind==='accuracy')n+=1;if(kind==='defense')n+=2}
  if(a.artifactEffect==='echo'){if(kind==='defense')n+=2;if(kind==='initiative')n+=2}
  if(a.artifactEffect==='shadow'&&kind==='retreat')n+=.08;
  if(a.artifactEffect==='traveler'&&kind==='retreat')n+=.05;
  if(a.artifactEffect==='highground'&&kind==='accuracy'&&['quarry','watchfort','oldtower','battlefield'].includes(state.world?.location))n+=2;
 }
 return n
}
function companionArtifactBonus(m,kind){
 const its=equippedArtifactItems(m.id);let n=0;
 if(its.some(a=>a.artifactEffect==='command')&&kind==='defense')n+=2;
 if(equippedArtifactItems('guardian').some(a=>a.artifactEffect==='command')&&kind==='defense')n+=1;
 if(its.some(a=>a.artifactEffect==='echo')&&kind==='defense')n+=2;
 return n
}
function artifactDamageBonusAgainst(e){
 let n=0;for(const a of equippedArtifactItems('guardian')){
  if(a.artifactEffect==='breaker'&&((e?.def||0)>=7||/armored|guard|knight|warden/i.test(e?.name||'')))n+=3;
  if(a.artifactEffect==='roadwarden'&&[SOSText("exploration_wilderness_artifacts.artifactDamageBonusAgainst.001"),SOSText("exploration_wilderness_artifacts.artifactDamageBonusAgainst.002")].includes(combat?.group?.faction))n+=2;
 }
 return n
}
function artifactEncounterBonus(kind){
 let n=0;for(const a of equippedArtifactItems('guardian')){
  if(a.artifactEffect==='shadow'&&kind==='ambush')n+=7;
  if(a.artifactEffect==='traveler'&&kind==='ambush')n+=4;
  if(a.artifactEffect==='shadow'&&kind==='retreat')n+=8;
  if(a.artifactEffect==='traveler'&&kind==='retreat')n+=5;
 }
 return n
}
function artifactCollectionProgress(){const A=artifactState();return {found:EXPLORATION_ARTIFACTS.filter(x=>A.found[x.id]).length,total:EXPLORATION_ARTIFACTS.length}}
function showArtifactCollection(){modalRouteEnter(SOSText("exploration_wilderness_artifacts.showArtifactCollection.001"),Array.from(arguments));
 const A=artifactState(),p=artifactCollectionProgress();
 overlay(SOSText("exploration_wilderness_artifacts.showArtifactCollection.002",p.found,p.total,meta.boundWeapon?` • Bound Legacy Weapon: ${esc(item(meta.boundWeapon)?.name||meta.boundWeapon)}`:'',EXPLORATION_ARTIFACTS.map(a=>{const f=A.found[a.id],owned=artifactOwned(a.id);return `<div class="artifact-card ${f?'found':'unknown'}"><b>${f?esc(a.name):'Unknown Artifact'}</b><small>${f?`${esc(worldLocation(a.site).name)} • ${esc(a.slot)} • Tier ${a.tier}`:`Undiscovered • ${esc(worldLocation(a.site).name)}`}</small>${f?`<p>${esc(a.special)}</p><div>${owned?'In company possession':'Previously recovered'}</div><button data-artinspect="${a.id}">Inspect</button>`:'<p>Clear this site’s interior to recover its unique item.</p>'}</div>`}).join(''),A.history.slice(-8).reverse().map(x=>`<div class="card compact"><b>Day ${x.day}: ${esc(x.name)}</b><br>${esc(worldLocation(x.site).name)}</div>`).join('')||'<p class="muted">No exploration artifact has been recovered yet.</p>'),true);
 document.querySelectorAll('[data-artinspect]').forEach(b=>b.onclick=()=>inspectItem(b.dataset.artinspect));wireClose()
}
const HIDDEN_INTERIORS={
 ashfarm:{title:SOSText("exploration_wilderness_artifacts.showArtifactCollection.003"),rooms:[
  {id:'yard',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.004"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.005"),links:['house','barn'],action:'search'},
  {id:'house',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.006"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.007"),links:['yard','cellar'],action:'search'},
  {id:'barn',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.008"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.009"),links:['yard'],action:'supplies'},
  {id:'cellar',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.010"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.011"),links:['house'],action:'threat',final:true}]},
 oldshrine:{title:SOSText("exploration_wilderness_artifacts.showArtifactCollection.012"),rooms:[
  {id:'path',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.013"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.014"),links:['court'],action:'search'},
  {id:'court',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.015"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.016"),links:['path','alcove','crypt'],action:'observe'},
  {id:'alcove',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.017"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.018"),links:['court'],action:'lore'},
  {id:'crypt',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.019"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.020"),links:['court'],action:'trap',final:true}]},
 wolfcave:{title:SOSText("exploration_wilderness_artifacts.showArtifactCollection.021"),rooms:[
  {id:'mouth',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.022"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.023"),links:['crawl'],action:'observe'},
  {id:'crawl',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.024"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.025"),links:['mouth','den'],action:'trap'},
  {id:'den',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.026"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.027"),links:['crawl','cache'],action:'threat'},
  {id:'cache',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.028"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.029"),links:['den'],action:'treasure',final:true}]},
 battlefield:{title:SOSText("exploration_wilderness_artifacts.showArtifactCollection.030"),rooms:[
  {id:'field',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.031"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.032"),links:['trench','marker'],action:'search'},
  {id:'trench',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.033"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.034"),links:['field','shelter'],action:'trap'},
  {id:'marker',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.035"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.036"),links:['field'],action:'lore'},
  {id:'shelter',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.037"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.038"),links:['trench'],action:'treasure',final:true}]},
 smugglerhide:{title:SOSText("exploration_wilderness_artifacts.showArtifactCollection.039"),rooms:[
  {id:'reeds',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.040"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.041"),links:['camp'],action:'observe'},
  {id:'camp',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.042"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.043"),links:['reeds','store','escape'],action:'threat'},
  {id:'store',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.044"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.045"),links:['camp'],action:'treasure',final:true},
  {id:'escape',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.046"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.047"),links:['camp'],action:'lore'}]},
 collapsedmine:{title:SOSText("exploration_wilderness_artifacts.showArtifactCollection.048"),rooms:[
  {id:'cut',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.049"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.050"),links:['shaft'],action:'search'},
  {id:'shaft',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.051"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.052"),links:['cut','gallery'],action:'trap'},
  {id:'gallery',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.053"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.054"),links:['shaft','office'],action:'supplies'},
  {id:'office',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.055"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.056"),links:['gallery'],action:'treasure',final:true}]},
 hermit:{title:SOSText("exploration_wilderness_artifacts.showArtifactCollection.057"),rooms:[
  {id:'garden',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.058"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.059"),links:['house'],action:'supplies'},
  {id:'house',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.060"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.061"),links:['garden','study'],action:'observe'},
  {id:'study',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.062"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.063"),links:['house'],action:'lore',final:true}]},
 oldtower:{title:SOSText("exploration_wilderness_artifacts.showArtifactCollection.064"),rooms:[
  {id:'base',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.065"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.066"),links:['stairs'],action:'search'},
  {id:'stairs',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.067"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.068"),links:['base','platform'],action:'trap'},
  {id:'platform',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.069"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.070"),links:['stairs','locker'],action:'observe'},
  {id:'locker',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.071"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.072"),links:['platform'],action:'treasure',final:true}]},
 sinkhole:{title:SOSText("exploration_wilderness_artifacts.showArtifactCollection.073"),rooms:[
  {id:'rim',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.074"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.075"),links:['slope'],action:'observe'},
  {id:'slope',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.076"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.077"),links:['rim','chamber'],action:'trap'},
  {id:'chamber',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.078"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.079"),links:['slope','fissure'],action:'lore'},
  {id:'fissure',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.080"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.081"),links:['chamber'],action:'strange',final:true}]},
 banditcamp:{title:SOSText("exploration_wilderness_artifacts.showArtifactCollection.082"),rooms:[
  {id:'trail',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.083"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.084"),links:['outer'],action:'observe'},
  {id:'outer',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.085"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.086"),links:['trail','tent','stash'],action:'threat'},
  {id:'tent',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.087"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.088"),links:['outer'],action:'lore'},
  {id:'stash',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.089"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.090"),links:['outer'],action:'treasure',final:true}]}
};

/* Wilderness & Exploration II: optional branches deepen several original interiors. */
HIDDEN_INTERIORS.wolfcave.rooms.find(r=>r.id==='den').links.push('upper');
HIDDEN_INTERIORS.wolfcave.rooms.push({id:'upper',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.091"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.092"),links:['den','ledge'],action:'trap'},{id:'ledge',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.093"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.094"),links:['upper'],action:'lore'});
HIDDEN_INTERIORS.collapsedmine.rooms.find(r=>r.id==='gallery').links.push('sidecut');
HIDDEN_INTERIORS.collapsedmine.rooms.push({id:'sidecut',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.095"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.096"),links:['gallery','toolroom'],action:'trap'},{id:'toolroom',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.097"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.098"),links:['sidecut'],action:'lore'});
HIDDEN_INTERIORS.battlefield.rooms.find(r=>r.id==='trench').links.push('dugout');
HIDDEN_INTERIORS.battlefield.rooms.push({id:'dugout',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.099"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.100"),links:['trench','sap'],action:'lore'},{id:'sap',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.101"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.102"),links:['dugout'],action:'treasure'});
HIDDEN_INTERIORS.smugglerhide.rooms.find(r=>r.id==='camp').links.push('reedpath');
HIDDEN_INTERIORS.smugglerhide.rooms.push({id:'reedpath',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.103"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.104"),links:['camp','blind'],action:'observe'},{id:'blind',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.105"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.106"),links:['reedpath'],action:'lore'});
HIDDEN_INTERIORS.oldtower.rooms.find(r=>r.id==='platform').links.push('roof');
HIDDEN_INTERIORS.oldtower.rooms.push({id:'roof',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.107"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.108"),links:['platform'],action:'observe'});
HIDDEN_INTERIORS.sinkhole.rooms.find(r=>r.id==='chamber').links.push('sidechamber');
HIDDEN_INTERIORS.sinkhole.rooms.push({id:'sidechamber',name:SOSText("exploration_wilderness_artifacts.showArtifactCollection.109"),text:SOSText("exploration_wilderness_artifacts.showArtifactCollection.110"),links:['chamber'],action:'strange'});
function interiorDef(id){return HIDDEN_INTERIORS[id]}
function interiorState(id){
 ensureWorldState();
 if(!state.world.interiors[id])state.world.interiors[id]={room:null,visited:[],cleared:[],notes:[],completed:false,startedDay:state.world.day};
 const I=state.world.interiors[id],d=interiorDef(id),valid=new Set((d?.rooms||[]).map(r=>r.id));
 if(!Array.isArray(I.visited))I.visited=[];if(!Array.isArray(I.cleared))I.cleared=[];if(!Array.isArray(I.notes))I.notes=[];
 I.visited=[...new Set(I.visited.filter(x=>valid.has(x)))];I.cleared=[...new Set(I.cleared.filter(x=>valid.has(x)))];
 if(I.room&&valid.has(I.room)&&!I.visited.includes(I.room))I.visited.push(I.room);
 if(I.room&&!valid.has(I.room))I.room=interiorStartRoom(id);
 return I
}
function interiorRoom(id,roomId){const d=interiorDef(id);return d?.rooms.find(r=>r.id===roomId)||d?.rooms[0]}
function interiorStartRoom(id){return interiorDef(id)?.rooms[0]?.id}
function enterHiddenInterior(id){
 const d=interiorDef(id);if(!d)return showWildernessSite(id);const I=interiorState(id);if(!I.room)I.room=interiorStartRoom(id);if(!I.visited.includes(I.room))I.visited.push(I.room);showHiddenInterior(id)
}
function interiorProgress(id){const d=interiorDef(id),I=interiorState(id),total=d?.rooms.length||0;return {done:I.visited.length,explored:I.visited.length,investigated:I.cleared.length,total}}
function interiorActionLabel(a){return ({search:SOSText("exploration_wilderness_artifacts.interiorActionLabel.001"),observe:SOSText("exploration_wilderness_artifacts.interiorActionLabel.002"),supplies:SOSText("exploration_wilderness_artifacts.interiorActionLabel.003"),threat:SOSText("exploration_wilderness_artifacts.interiorActionLabel.004"),trap:SOSText("exploration_wilderness_artifacts.interiorActionLabel.005"),lore:SOSText("exploration_wilderness_artifacts.interiorActionLabel.006"),treasure:SOSText("exploration_wilderness_artifacts.interiorActionLabel.007"),strange:SOSText("exploration_wilderness_artifacts.interiorActionLabel.008")})[a]||SOSText("exploration_wilderness_artifacts.interiorActionLabel.009")}
function resolveInteriorAction(id,roomId){
 const d=interiorDef(id),I=interiorState(id),r=interiorRoom(id,roomId);if(!d||!r)return;
 if(I.cleared.includes(roomId))return showHiddenInterior(id);advanceWorldDays(1,SOSText("exploration_wilderness_artifacts.resolveInteriorAction.001",d.title,r.name));
 let text='',tone='good';
 if(r.action==='threat'){const roll=rnd(1,12)+stat(state,'cha')+Math.floor(state.scouting/2);if(roll<12){state.guardian.hp=Math.max(1,state.guardian.hp-rnd(3,8));text=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.002");tone='bad'}else text=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.003")}
 else if(r.action==='trap'){if(adventureSkillCheck('dex',14)||adventureSkillCheck('wis',14))text=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.004");else{state.guardian.hp=Math.max(1,state.guardian.hp-rnd(4,10));text=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.005");tone='bad'}}
 else if(r.action==='supplies'){const good=chance(.5)?'food':'medicine';roadEventCargo(good,1);text=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.006",good==='food'?'food':'medical')}
 else if(r.action==='lore'){gainScouting(1);const gain=rnd(8,18);gainGold(gain);text=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.007",gain)}
 else if(r.action==='treasure'){const gain=rnd(24,55);gainGold(gain);valuableAdd(chance(.35)?'val_relic':'val_silver',1);text=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.008",gain)}
 else if(r.action==='strange'){if(chance(.55)){gainScouting(2);const gain=rnd(18,35);gainGold(gain);text=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.009",gain)}else{state.guardian.hp=Math.max(1,state.guardian.hp-rnd(4,9));text=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.010");tone='bad'}}
 else if(r.action==='observe'){gainScouting(1);text=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.011")}
 else {const gain=rnd(6,20);gainGold(gain);text=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.012",gain)}
 I.cleared.push(roomId);I.notes.push(`${r.name}: ${text}`);if(r.final){I.completed=true;const S=explorationSiteState(id);S.status=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.013");const artifact=awardExplorationArtifact(id);S.notes.push(SOSText("exploration_wilderness_artifacts.resolveInteriorAction.014",d.title,artifact?` Recovered ${artifact.name}.`:''));state.reputation++;recordWorldHistory(SOSText("exploration_wilderness_artifacts.resolveInteriorAction.015",d.title,artifact?` ${artifact.name} was recovered.`:''),'good','exploration');if(artifact)text+=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.016",artifact.name,artifact.special);checkRegionalStorySiteProgress(id);for(const m of activeRoadCompanions()){const d2=companionExplorationDef(m.id),q2=companionExplorationQuest(m.id);if(d2?.site===id&&q2.status==='active'&&completeCompanionExplorationSiteStage(m.id))text+=SOSText("exploration_wilderness_artifacts.resolveInteriorAction.017",m.name)}}
 save();actionResult(r.final?'Interior Cleared':r.name,text,tone,()=>showHiddenInterior(id))
}
function moveInterior(id,roomId){const I=interiorState(id);I.room=roomId;if(!I.visited.includes(roomId))I.visited.push(roomId);save();showHiddenInterior(id)}
function interiorRoomIcon(action){return ({search:'⌕',observe:'◉',supplies:'▣',threat:'⚔',trap:'⚠',lore:'✦',treasure:'◆',strange:'✧'})[action]||'•'}
function interiorMapLayout(id){
 const d=interiorDef(id);if(!d)return {pos:{},edges:[]};const start=d.rooms[0]?.id,depth={},queue=[];if(start){depth[start]=0;queue.push(start)}
 while(queue.length){const rid=queue.shift(),r=interiorRoom(id,rid);for(const n of (r?.links||[])){if(depth[n]===undefined){depth[n]=depth[rid]+1;queue.push(n)}}}
 let fallback=Math.max(0,...Object.values(depth));for(const r of d.rooms)if(depth[r.id]===undefined)depth[r.id]=++fallback;
 const levels={};for(const r of d.rooms)(levels[depth[r.id]]??=[]).push(r);const keys=Object.keys(levels).map(Number).sort((a,b)=>a-b),max=Math.max(1,...keys),pos={};
 for(const k of keys){const row=levels[k],y=12+(k/max)*76;row.forEach((r,i)=>{pos[r.id]={x:12+((i+1)/(row.length+1))*76,y}})}
 const seen=new Set,edges=[];for(const r of d.rooms)for(const n of (r.links||[])){const key=[r.id,n].sort().join('|');if(!seen.has(key)&&pos[r.id]&&pos[n]){seen.add(key);edges.push([r.id,n])}}
 return {pos,edges}
}
function hiddenInteriorMapHTML(id){
 const d=interiorDef(id),I=interiorState(id),layout=interiorMapLayout(id),current=interiorRoom(id,I.room),reachable=new Set(current?.links||[]);
 const lines=layout.edges.map(([a,b])=>{const A=layout.pos[a],B=layout.pos[b],known=I.visited.includes(a)&&I.visited.includes(b),active=(a===I.room&&reachable.has(b))||(b===I.room&&reachable.has(a));return `<line class="${known?'':'unknown'} ${active?'active':''}" x1="${A.x}%" y1="${A.y}%" x2="${B.x}%" y2="${B.y}%"></line>`}).join('');
 const nodes=d.rooms.map(r=>{const P=layout.pos[r.id],visited=I.visited.includes(r.id),here=I.room===r.id,cleared=I.cleared.includes(r.id),canMove=reachable.has(r.id),label=visited?esc(r.name):(canMove?'Unexplored Passage':'Unknown Area'),status=cleared?'CLEARED':here?'YOU ARE HERE':visited?'VISITED':canMove?'AVAILABLE':'UNKNOWN',cls=`interior-node ${here?'current':''} ${cleared?'cleared':''} ${visited?'visited':'unknown'} ${canMove?'reachable':''}`;const inner=`<span class="interior-room-icon">${visited?interiorRoomIcon(r.action):(canMove?'?':'·')}</span><b>${label}</b><small>${status}</small>`;return canMove&&!here?`<button class="${cls}" data-interiorroom="${r.id}" style="left:${P.x}%;top:${P.y}%" title="Move to ${label}">${inner}</button>`:`<div class="${cls}" style="left:${P.x}%;top:${P.y}%">${inner}</div>`}).join('');
 return `<div class="interior-map"><svg class="interior-map-lines" aria-hidden="true">${lines}</svg>${nodes}</div><div class="interior-map-legend"><span class="here"><i></i>Current room</span><span class="done"><i></i>Cleared</span><span><i></i>Known</span><span class="unknown-key"><i></i>Unexplored</span></div>`
}
function showHiddenInterior(id){modalRouteEnter(SOSText("exploration_wilderness_artifacts.showHiddenInterior.001"),Array.from(arguments));
 const d=interiorDef(id),I=interiorState(id);if(!d)return showWildernessSite(id);const r=interiorRoom(id,I.room),p=interiorProgress(id);
 overlay(SOSText("exploration_wilderness_artifacts.showHiddenInterior.002",esc(d.title),esc(r.name),p.explored,p.total,I.completed?' • CLEARED':'',esc(r.text),hiddenInteriorMapHTML(id),I.cleared.includes(r.id)?'<div class="success notice">This area has already been investigated.</div>':`<button id="interiorAct">${esc(interiorActionLabel(r.action))}</button>`,`<div class="interior-route-help">${p.investigated}/${p.total} room actions completed. Select a connected room directly on the map to move through the interior.</div>${!I.completed&&!hiddenSiteRetired(id)?'<button id="interiorGiveUp">Give Up Exploration</button>':''}`,I.notes.length?`<h3>Expedition Notes</h3><div class="card compact">${esc(I.notes[I.notes.length-1])}</div>`:''),true);
 if($('#interiorAct'))$('#interiorAct').onclick=()=>resolveInteriorAction(id,r.id);if($('#interiorGiveUp'))$('#interiorGiveUp').onclick=()=>giveUpHiddenSiteExploration(id);document.querySelectorAll('[data-interiorroom]').forEach(b=>b.onclick=()=>moveInterior(id,b.dataset.interiorroom));$('#interiorOutside').onclick=()=>showWildernessSite(id)
}

function minorSiteState(id){const E=explorationState();if(!E.minorUses[id])E.minorUses[id]=0;return E.minorUses[id]}
function investigateMinorHiddenSite(id){
 const site=worldLocation(id),S=explorationSiteState(id);if(S.searched>0)return actionResult(SOSText("exploration_wilderness_artifacts.investigateMinorHiddenSite.001"),SOSText("exploration_wilderness_artifacts.investigateMinorHiddenSite.002"),'info',()=>showMinorHiddenSite(id));S.searched++;S.status='investigated';
 let text='',tone='good';const def=MINOR_SITE_ACTIONS[site.siteKind]||MINOR_SITE_ACTIONS.landmark;
 if(def.bonus==='camp'){state.guardian.stamina=Math.min(maxStamina(),state.guardian.stamina+20);text=SOSText("exploration_wilderness_artifacts.investigateMinorHiddenSite.003")}
 else if(def.bonus==='scout'){gainScouting(2);text=SOSText("exploration_wilderness_artifacts.investigateMinorHiddenSite.004")}
 else {gainScouting(1);text=SOSText("exploration_wilderness_artifacts.investigateMinorHiddenSite.005")}
 const clue=progressExplorationClue(id);if(clue)text+=` ${clue}`;
 if(chance(.18)){const r=pick(EXPLORATION_RARES);if(!artifactOwned(r.id)){invAdd(r.id,1);text+=SOSText("exploration_wilderness_artifacts.investigateMinorHiddenSite.006",r.name)}}
 S.notes.push(text);checkRegionalStorySiteProgress(id);recordWorldHistory(`${site.name}: ${text}`,'good','exploration');save();actionResult(def.title,text,tone,()=>showMinorHiddenSite(id))
}
function showMinorHiddenSite(id){modalRouteEnter(SOSText("exploration_wilderness_artifacts.showMinorHiddenSite.001"),Array.from(arguments));
 const site=worldLocation(id),S=explorationSiteState(id),clue=clueForSite(id);overlay(SOSText("exploration_wilderness_artifacts.showMinorHiddenSite.002",esc(site.name),esc(site.desc),esc(site.siteKind),S.status||'discovered',minorSiteState(id)?` • used ${minorSiteState(id)} time${minorSiteState(id)===1?'':'s'}`:'',clue?`<div class="exploration-clue-card"><b>Possible clue site</b><br>${esc(clue[1].title)}</div>`:'',S.notes.length?`<h3>Field Notes</h3>${S.notes.slice(-4).map(n=>`<div class="card compact">${esc(n)}</div>`).join('')}`:'',S.searched?'Review the Site':'Investigate',site.siteKind==='campsite'?'<button id="minorCamp">Camp Here</button>':'',hiddenSiteUsefulActionsComplete(id)?`<button id="minorMapToggle">${hiddenSiteRetired(id)?'Restore to Map':'Clear from Map'}</button>`:''),true);
 if($('#minorMapToggle'))$('#minorMapToggle').onclick=()=>hiddenSiteRetired(id)?restoreRetiredHiddenSite(id):retireHiddenSite(id);$('#minorInvestigate').onclick=()=>investigateMinorHiddenSite(id);if($('#minorCamp'))$('#minorCamp').onclick=()=>{advanceWorldDays(1,SOSText("exploration_wilderness_artifacts.showMinorHiddenSite.003",site.name));state.guardian.hp=Math.min(maxHP(),state.guardian.hp+Math.round(maxHP()*.35));state.guardian.stamina=maxStamina();explorationState().minorUses[id]=(explorationState().minorUses[id]||0)+1;save();actionResult(SOSText("exploration_wilderness_artifacts.showMinorHiddenSite.004"),SOSText("exploration_wilderness_artifacts.showMinorHiddenSite.005",site.name),'good',()=>showMinorHiddenSite(id))};$('#minorSurvey').onclick=()=>{closeOverlay();surveyCurrentRegion()};wireClose()
}
function showWildernessSite(id=state.world.location){modalRouteEnter(SOSText("exploration_wilderness_artifacts.showWildernessSite.001"),Array.from(arguments));
 const site=worldLocation(id);if(isMinorHiddenSite(site))return showMinorHiddenSite(id);const S=explorationSiteState(id),E=explorationState();
 const art=explorationArtifactForSite(id);if(art&&interiorState(id).completed&&!artifactState().found[art.id])awardExplorationArtifact(id);const artFound=art&&artifactState().found[art.id],recognitions=companionSiteRecognition(id),I=interiorState(id),retired=hiddenSiteRetired(id);overlay(SOSText("exploration_wilderness_artifacts.showWildernessSite.002",esc(site.name),esc(site.desc),recognitions.map(x=>`<div class="companion-site-recognition"><b>${esc(x.m.name)}</b><br>${esc(x.line)} ${x.q.status==='locked'?`<button data-sitesidestory="${x.m.id}">Ask About This Place</button>`:''}${['available','active','decision','complete'].includes(x.q.status)?`<button data-sitesidestory="${x.m.id}">Open Personal Expedition</button>`:''}</div>`).join(''),art?`<div class="${artFound?'success':'notice'} notice"><b>Unique artifact:</b> ${artFound?esc(art.name):'Something unique may remain inside.'}${artFound?`<br><small>${esc(art.special)}</small>`:''}</div>`:'',esc(site.siteKind||'wilderness'),(E.discoveries.find(x=>x.id===id)||{}).day||'—',S.visits||0,esc(S.status||'discovered'),S.notes.length?`<h3>Field Notes</h3>${S.notes.slice(-4).map(n=>`<div class="card compact">${esc(n)}</div>`).join('')}`:'',I.completed?'Re-enter Cleared Interior':'Explore Interior',S.searched?'Search Outside Again':'Search the Outskirts',retired?'<button id="siteMapToggle">Restore to Map</button>':hiddenSiteUsefulActionsComplete(id)?'<button id="siteMapToggle">Clear from Map</button>':!I.completed?'<button id="siteGiveUp">Give Up Exploration</button>':''),true);
 document.querySelectorAll('[data-sitesidestory]').forEach(b=>b.onclick=()=>{const q=companionExplorationQuest(b.dataset.sitesidestory);if(q.status==='locked')q.status='available';showCompanionExplorationQuest(b.dataset.sitesidestory)});if($('#siteMapToggle'))$('#siteMapToggle').onclick=()=>hiddenSiteRetired(id)?restoreRetiredHiddenSite(id):retireHiddenSite(id);if($('#siteGiveUp'))$('#siteGiveUp').onclick=()=>giveUpHiddenSiteExploration(id);$('#siteInterior').onclick=()=>enterHiddenInterior(id);$('#siteSearch').onclick=()=>searchWildernessSite(id);$('#siteObserve').onclick=()=>{gainScouting(1);S.notes.push(SOSText("exploration_wilderness_artifacts.showWildernessSite.003"));save();actionResult(SOSText("exploration_wilderness_artifacts.showWildernessSite.004"),SOSText("exploration_wilderness_artifacts.showWildernessSite.005"),'good',()=>showWildernessSite(id))};$('#siteRoadLife').onclick=()=>{const m=pick(activeRoadCompanions());if(!m)return actionResult(SOSText("exploration_wilderness_artifacts.showWildernessSite.006"),SOSText("exploration_wilderness_artifacts.showWildernessSite.007"),'info',()=>showWildernessSite(id));roadLifePush({type:'place',a:m.id,title:`${m.name} — ${site.name}`,summary:companionRoadPlaceLine(m,id)});save();showRoadLife()};wireClose()
}
function showExplorationJournal(){modalRouteEnter(SOSText("exploration_wilderness_artifacts.showExplorationJournal.001"),Array.from(arguments));
 const E=explorationState(),found=discoveredHiddenSites(),unknown=unexploredHiddenSites().length,major=found.filter(s=>!s.minor),minor=found.filter(s=>s.minor),fields=E.fieldDiscoveries.slice().reverse();
 overlay(SOSText("exploration_wilderness_artifacts.showExplorationJournal.002",activeCompanionExplorationQuests().length,artifactCollectionProgress().found,artifactCollectionProgress().total,found.length,hiddenWorldSites().length,fields.length,E.surveys||0,unknown,major.length?`<h3>Major Sites</h3>${major.map(s=>{const S=explorationSiteState(s.id),P=interiorProgress(s.id);return `<button class="exploration-site-card" data-expsite="${s.id}"><span><b>${esc(s.name)}</b><small>${esc(s.siteKind||'site')} • ${esc(S.status||'discovered')} • Interior ${P.done}/${P.total}</small></span><span>${esc(s.desc)}</span></button>`}).join('')}`:'',minor.length?`<h3>Minor Mapped Discoveries</h3>${minor.map(s=>{const S=explorationSiteState(s.id);return `<button class="exploration-site-card" data-expsite="${s.id}"><span><b>${esc(s.name)}</b><small>${esc(s.siteKind)} • ${esc(S.status||'discovered')}</small></span><span>${esc(s.desc)}</span></button>`}).join('')}`:'',fields.slice(0,12).map(d=>`<button class="exploration-site-card procedural" data-fieldsite="${d.id}"><span><b>${esc(d.name)}</b><small>${esc(d.kind)} • near ${esc(worldLocation(d.nearId).name)} • Day ${d.day}</small></span><span>${esc(d.text)}</span></button>`).join('')||'<p class="muted">No procedural field discovery recorded yet.</p>'),true);
 document.querySelectorAll('[data-expsite]').forEach(b=>b.onclick=()=>showWildernessSite(b.dataset.expsite));document.querySelectorAll('[data-fieldsite]').forEach(b=>b.onclick=()=>showFieldDiscovery(b.dataset.fieldsite));$('#explorationArtifacts').onclick=showArtifactCollection;$('#explorationCompanions').onclick=showCompanionExpeditionJournal;$('#explorationClues').onclick=showExplorationClues;wireClose()
}
function showWorldArea(){modalRouteEnter(SOSText("exploration_wilderness_artifacts.showWorldArea.001"),Array.from(arguments));
 ensureWorldState();const loc=worldLocation(state.world.location);if(loc.hidden){if(hiddenSiteRetired(loc.id))return actionResult('Exploration Retired',`${loc.name} has been removed from the active map. Restore it from the Exploration Journal if you want to investigate it again.`,'info',renderOpenWorld);return showWildernessSite(loc.id)};
 const regionalHere=regionalThreadAt(loc.id),opportunitiesHere=opportunityAt(loc.id),storyHere=activeCompanionStories().filter(x=>state.party.active.includes(x.id)&&((x.s.stage===1&&x.d.loc1===loc.id)||(x.s.stage===2&&x.d.loc2===loc.id)||x.s.status==='decision')),known=knownCompanionsAt(loc.id),near=state.world.parties.filter(worldPartyAtPlayer),battle=findRegionalBattleNearPlayer(),site=adventureSiteForLocation(loc.id),maps=treasureMapsAtLocation(loc.id),ledgerReady=storyLedgerResolutionReady(),fqAvailable=availableFactionQuestlinesHere(),fqDecision=(factionQuestState(SOSText("exploration_wilderness_artifacts.showWorldArea.002")).active&&factionQuestState(SOSText("exploration_wilderness_artifacts.showWorldArea.003")).stage===3&&['northgate','shantium'].includes(loc.id))||(factionQuestState(SOSText("exploration_wilderness_artifacts.showWorldArea.004")).active&&factionQuestState(SOSText("exploration_wilderness_artifacts.showWorldArea.005")).stage===3&&loc.id==='redoubt'),town=isTownLikeLocation(loc);
 const townActions=town?SOSText("exploration_wilderness_artifacts.showWorldArea.006",loc.id==='shantium'?'<button id="areaCouncilHall"><b>Council Hall</b><small>Civic administration, law & public affairs</small></button>':''):'';
 const peopleActions=SOSText("exploration_wilderness_artifacts.showWorldArea.007",known.length?'Known contacts and local information':'Local information',known.map(c=>`<button data-seekcomp="${c.id}"><b>${esc(allyDef(c.id).name)}</b><small>${esc(allyDef(c.id).title)} • known to be here</small></button>`).join(''),town?'<button id="areaPeople"><b>Familiar Faces</b><small>Residents you already know</small></button>':'');
 const partyActions=near.length?SOSText("exploration_wilderness_artifacts.showWorldArea.008",nearbyPartyGroupHTML(near)):'';
 overlay(SOSText("exploration_wilderness_artifacts.showWorldArea.009",esc(loc.name),esc(loc.desc),state.world.settlements[loc.id]?`${settlementSnapshotHTML(loc.id,true)}<p class="living-welcome">${esc(settlementWelcomeText(loc.id))}</p><div class="town-scene-inline">${esc(townSceneText(loc.id))}</div>${settlementProblemHTML(loc.id)}${settlementEventHTML(loc.id)}`:'',opportunitiesHere.map(opportunityMarkerHTML).join(''),regionalHere.length?`<div class="regional-thread-card"><b>Regional consequence:</b><br>${regionalHere.map(t=>`${esc(t.title)} — ${esc(t.notes[t.notes.length-1]||t.text)}`).join('<br>')}<br><button id="areaRegionalSimulation">Region Overview</button></div>`:'',storyHere.length?`<div class="success notice"><b>Companion story:</b><br>${storyHere.map(x=>`${esc(state.party.members[x.id].name)} — ${esc(x.d.title)}`).join('<br>')}<br>${storyHere.map(x=>`<button data-storyhere="${x.id}">Continue ${esc(x.d.title)}</button>`).join('')}</div>`:'',battle?`<div class="warning notice"><b>Nearby battle:</b> ${esc(battle[0].name)} vs ${esc(battle[1].name)}<br><button id="viewBattle">Intervene</button></div>`:'',maps.length?`<div class="success notice"><b>Treasure lead:</b> ${maps.map(m=>esc(m.name)).join(', ')}<br>${maps.map(m=>`<button data-digmap="${m.id}">Follow ${esc(m.name)}</button>`).join('')}</div>`:'',ledgerReady?`<div class="warning notice"><b>The Watchfort Ledger:</b> This location can receive the recovered evidence.<br><button id="ledgerDecision">Decide Recipient</button></div>`:'',fqAvailable.length?`<div class="success notice"><b>Faction work available:</b> ${fqAvailable.map(x=>esc(x.name)).join(', ')}<br><button id="factionQuestBtn">View Faction Questlines</button></div>`:'',fqDecision?`<div class="warning notice"><b>Faction quest decision ready.</b><br><button id="factionDecisionBtn">Make Decision</button></div>`:'',regionConnectionAt(loc.id)?`<div class="mountain-route notice"><b>${esc(regionConnectionAt(loc.id).name)}</b><br>${esc(regionConnectionAt(loc.id).desc)}<br><button id="areaRegionTravel">Regional Travel</button></div>`:'',loc.id==='shantium'&&canAccessGuardianHall()?`<div class="success notice"><b>Guardian Hall:</b> Shantium is the company’s permanent home base.<br><button id="areaHomeBase">Open Home Base</button></div>`:'',site?`<div class="success notice"><b>Adventure Site:</b> ${esc(site.name)} • ${adventureProgressText(site)}<br><button id="exploreSite">Explore Interior</button></div>`:'',townActions,peopleActions,partyActions));
 wireSettlementEvent(loc.id);if($('#areaTownLife'))$('#areaTownLife').onclick=()=>showTownLife(loc.id);document.querySelectorAll('[data-openopportunity]').forEach(b=>b.onclick=()=>showRegionalOpportunity(b.dataset.openopportunity));if($('#areaRegionalSimulation'))$('#areaRegionalSimulation').onclick=showRegionOverview;if($('#helpLocalProblem'))$('#helpLocalProblem').onclick=()=>helpSettlementProblem(loc.id);document.querySelectorAll('[data-storyhere]').forEach(b=>b.onclick=()=>{if(!companionStoryScene(b.dataset.storyhere))showCompanionStory(b.dataset.storyhere)});if($('#areaRegionTravel'))$('#areaRegionTravel').onclick=showRegionTravel;if($('#areaHomeBase'))$('#areaHomeBase').onclick=showHomeBase;if($('#factionQuestBtn'))$('#factionQuestBtn').onclick=showFactionQuestlines;if($('#factionDecisionBtn'))$('#factionDecisionBtn').onclick=showFactionQuestDecision;document.querySelectorAll('[data-digmap]').forEach(b=>b.onclick=()=>recoverTreasureMap(b.dataset.digmap));if($('#ledgerDecision'))$('#ledgerDecision').onclick=showLedgerResolution;document.querySelectorAll('[data-seekcomp]').forEach(b=>b.onclick=()=>showPersistentCompanion(b.dataset.seekcomp));document.querySelectorAll('[data-nearparty]').forEach(b=>b.onclick=()=>showWorldParty(b.dataset.nearparty));
 if($('#exploreSite'))$('#exploreSite').onclick=()=>showAdventureSite(site.location);if($('#viewBattle'))$('#viewBattle').onclick=()=>showRegionalBattle(battle[0],battle[1],battle[2]);$('#askLocals').onclick=askAroundWorld;if($('#areaServices'))$('#areaServices').onclick=()=>navigateTownMenu('services',{locId:loc.id});if($('#areaPeople'))$('#areaPeople').onclick=()=>navigateTownMenu('people',{locId:loc.id});if($('#areaFactions'))$('#areaFactions').onclick=()=>navigateTownMenu('factions',{locId:loc.id});if($('#areaPolitics'))$('#areaPolitics').onclick=()=>navigateTownMenu('politics',{locId:loc.id});if($('#areaContracts'))$('#areaContracts').onclick=()=>navigateTownMenu('contracts',{locId:loc.id});if($('#areaCouncilHall'))$('#areaCouncilHall').onclick=()=>openLocation('council');wireClose();
}
function askAroundWorld(){
 ensureWorldState();const locId=state.world.location,loc=worldLocation(locId),ss=state.world.settlements[locId],people=SETTLEMENT_NPCS[locId]||[],unknown=Object.values(state.world.companions).filter(c=>!state.allies.includes(c.id)&&!c.known&&(state.world.unlockedRegions||['shantium']).includes(locationRegion(c.location))),event=settlementEvent(locId),roll=rnd(1,6);
 advanceWorldDays(1,SOSText("exploration_wilderness_artifacts.askAroundWorld.001"));
 const opps=opportunityAt(locId);if(opps.length&&roll<=2){const o=pick(opps);return actionResult(SOSText("exploration_wilderness_artifacts.askAroundWorld.002"),`${o.title}: ${o.summary}`,'info',()=>showRegionalOpportunity(o.id))}const threads=regionalThreadAt(locId);if(threads.length&&roll<=2){const t=pick(threads);return actionResult(SOSText("exploration_wilderness_artifacts.askAroundWorld.003"),`${t.title}: ${t.notes[t.notes.length-1]||t.text}`,'info',showWorldArea)}if(event&&!event.resolved&&roll<=2)return actionResult(SOSText("exploration_wilderness_artifacts.askAroundWorld.004"),`${event.title}: ${event.text}`,'info',showWorldArea);
 if(unknown.length&&roll<=3){const c=pick(unknown);c.known=true;c.lastSeenDay=state.world.day;save();return actionResult(SOSText("exploration_wilderness_artifacts.askAroundWorld.005"),SOSText("exploration_wilderness_artifacts.askAroundWorld.006",allyDef(c.id).name,allyDef(c.id).title,worldLocation(c.location).name),'good',renderOpenWorld)}
 if(people.length&&roll===4){const npc=pick(people),r=npcRelationshipState(npc.id);r.familiarity=Math.min(10,r.familiarity+1);npcMemoryAdd(npc.id,SOSText("exploration_wilderness_artifacts.askAroundWorld.007"),1);save();return actionResult(SOSText("exploration_wilderness_artifacts.askAroundWorld.008"),SOSText("exploration_wilderness_artifacts.askAroundWorld.009",npc.name,npc.role),'good',()=>showSettlementNPCConversation(locId,npc.id))}
 if(ss&&roll===5){const p=state.world.parties.find(x=>x.location===locId||x.destination===locId);if(p)return actionResult(SOSText("exploration_wilderness_artifacts.askAroundWorld.010"),SOSText("exploration_wilderness_artifacts.askAroundWorld.011",p.name,worldLocation(p.destination).name),'info',renderOpenWorld)}
 const rumors=(state.world.news||[]).slice(-5);if(rumors.length)return actionResult(SOSText("exploration_wilderness_artifacts.askAroundWorld.012"),pick(rumors).text,'info',renderOpenWorld);
 actionResult(SOSText("exploration_wilderness_artifacts.askAroundWorld.013"),SOSText("exploration_wilderness_artifacts.askAroundWorld.014",loc.name),'info',renderOpenWorld)
}

/* v1.6.4 — Exploration III
   Persistent sites, multi-stage environmental challenges, investigators/occupants,
   regional legends, hidden routes, and consequences that feed back into the living world. */

const EXPLORATION_III_SITE_PROFILES={
 ashfarm:{legend:'The Black Orchard',summary:'Travelers insist the ash around the farm never blows toward Shantium.',hazard:'smoke',linkedSettlement:'southroad',worldEffect:'recovery',routeTo:'southroad'},
 oldshrine:{legend:'The Bell Beneath the Hill',summary:'Old road prayers claim a buried bell rings before violence reaches the north road.',hazard:'collapse',linkedSettlement:'northgate',worldEffect:'security',routeTo:'northgate'},
 wolfcave:{legend:'The White Fang Den',summary:'Hunters tell of a cave network used by beasts, fugitives, and scouts for generations.',hazard:'beasts',linkedSettlement:'westwood',worldEffect:'security',routeTo:'westwood'},
 battlefield:{legend:'The Unburied Standard',summary:'A lost field standard is said to mark a forgotten route through the old defensive earthworks.',hazard:'unstable_ground',linkedSettlement:'stonebridge',worldEffect:'route',routeTo:'stonebridge'},
 smugglerhide:{legend:'The Reed Door',summary:'Boatmen whisper that one reed-lined cut bypasses the watched road entirely.',hazard:'flooding',linkedSettlement:'river',worldEffect:'trade',routeTo:'river'},
 collapsedmine:{legend:'The Second Gallery',summary:'Miners still argue that the collapse sealed a richer working than the one officially abandoned.',hazard:'collapse',linkedSettlement:'quarry',worldEffect:'trade',routeTo:'quarry'},
 hermit:{legend:'The Last Surveyor',summary:'A solitary mapmaker supposedly recorded paths no modern road patrol uses.',hazard:'weather',linkedSettlement:'eastwatch',worldEffect:'route',routeTo:'eastwatch'},
 oldtower:{legend:'The Far Lantern',summary:'The ruined tower was once part of a chain of signal posts spanning the eastern approaches.',hazard:'heights',linkedSettlement:'eastwatch',worldEffect:'security',routeTo:'eastwatch'},
 sinkhole:{legend:'The Hollow Wind',summary:'Locals say the fissures below the sinkhole breathe before storms and troop movements.',hazard:'fumes',linkedSettlement:'southroad',worldEffect:'scouting',routeTo:'southroad'},
 banditcamp:{legend:'The Knives Road',summary:'The camp sits over an older smugglers’ path that predates the modern road.',hazard:'occupants',linkedSettlement:'northgate',worldEffect:'security',routeTo:'northgate'}
};

const EXPLORATION_III_HAZARDS={
 smoke:{name:'Ash and Smoke',stat:'wis',dc:14,success:'The party reads the wind and crosses the worst ash safely.',failure:'Smoke and drifting ash force a painful, exhausting passage.',hp:[2,6]},
 collapse:{name:'Unstable Masonry',stat:'dex',dc:15,success:'Loose stone is identified and crossed without bringing the structure down.',failure:'Stone breaks loose during the crossing.',hp:[4,10]},
 beasts:{name:'Predator Signs',stat:'wis',dc:15,success:'Tracks and scent are read early enough to avoid being surrounded.',failure:'The party pushes too far before recognizing the danger.',hp:[3,8]},
 unstable_ground:{name:'Broken Earthworks',stat:'dex',dc:14,success:'The safest line through the collapsed works is found.',failure:'A concealed drop and rotten timbers slow the expedition.',hp:[3,8]},
 flooding:{name:'Flooded Passage',stat:'str',dc:15,success:'The party forces a safe line through the flooded cut.',failure:'Cold water and a hard current batter the party.',hp:[3,9]},
 weather:{name:'Exposed Ground',stat:'wis',dc:13,success:'The expedition uses the terrain and reaches shelter before the weather turns.',failure:'Exposure drains the party before shelter is found.',hp:[2,7]},
 heights:{name:'Ruined Heights',stat:'dex',dc:15,success:'The ascent is secured before anyone commits weight to the broken stairs.',failure:'A bad section gives way during the climb.',hp:[4,9]},
 fumes:{name:'Deep Fumes',stat:'wis',dc:16,success:'The strange air is recognized and the party waits for a safer draft.',failure:'The party presses into bad air and pays for it.',hp:[4,10]},
 occupants:{name:'Occupied Ground',stat:'cha',dc:15,success:'Signs of occupation are read correctly and the party advances without walking into a prepared position.',failure:'The expedition gives away its approach to whoever is using the site.',hp:[2,6]}
};

const EXPLORATION_III_OCCUPANTS=[
 {kind:'investigators',names:['A survey crew','A local antiquarian team','A pair of independent cartographers'],attitude:'neutral'},
 {kind:'salvagers',names:['A salvage crew','Independent scavengers','A rough recovery crew'],attitude:'wary'},
 {kind:'pilgrims',names:['A small pilgrim party','Local shrine keepers','Traveling devotees'],attitude:'friendly'},
 {kind:'squatters',names:['Displaced travelers','A hidden family camp','Road refugees using the ruins'],attitude:'neutral'},
 {kind:'hostiles',names:['Armed looters','A concealed raiding party','Bandit scouts'],attitude:'hostile'}
];

function ensureExplorationIIIState(){
 const E=explorationState();
 if(!E.explorationIII||typeof E.explorationIII!=='object')E.explorationIII={sites:{},legends:{},hiddenRoutes:{},history:[],regionDiscoveries:{}};
 const X=E.explorationIII;if(!X.sites)X.sites={};if(!X.legends)X.legends={};if(!X.hiddenRoutes)X.hiddenRoutes={};if(!Array.isArray(X.history))X.history=[];if(!X.regionDiscoveries)X.regionDiscoveries={};
 return X
}
function explorationIIIProfile(id){return EXPLORATION_III_SITE_PROFILES[id]||null}
function explorationIIISiteState(id,skipOccupantInit=false){
 const X=ensureExplorationIIIState(),p=explorationIIIProfile(id);if(!X.sites[id])X.sites[id]={phase:'discovered',condition:'untouched',hazardResolved:false,occupant:null,occupantStatus:'unknown',investigations:0,discoveries:[],consequenceApplied:false,lastChangedDay:state.world.day};
 const S=X.sites[id];
 // v1.6.4.4: occupant initialization must not recurse back into itself.
 if(!skipOccupantInit&&p&&!S.occupant&&interiorState(id).visited.length)assignExplorationIIIOccupant(id,S);
 return S
}
function explorationIIIRecord(id,text,tone='info'){
 const X=ensureExplorationIIIState(),S=explorationIIISiteState(id);S.lastChangedDay=state.world.day;S.discoveries.push({day:state.world.day,text});S.discoveries=S.discoveries.slice(-12);X.history.push({day:state.world.day,site:id,text,tone});X.history=X.history.slice(-80);recordWorldHistory(`${worldLocation(id).name}: ${text}`,tone,'exploration')
}
function explorationLegendState(id){const X=ensureExplorationIIIState();if(!X.legends[id])X.legends[id]={known:false,day:null,source:null};return X.legends[id]}
function learnExplorationLegend(id,source='field investigation'){
 const p=explorationIIIProfile(id);if(!p)return false;const L=explorationLegendState(id);if(L.known)return false;L.known=true;L.day=state.world.day;L.source=source;explorationIIIRecord(id,`Regional legend recorded: ${p.legend}.`,'good');return true
}
function knownRegionalLegends(region=currentWorldRegion()){
 return Object.keys(EXPLORATION_III_SITE_PROFILES).filter(id=>locationRegion(id)===region&&explorationLegendState(id).known)
}
function explorationIIIHiddenRoute(id){return ensureExplorationIIIState().hiddenRoutes[id]||null}
function unlockExplorationIIIHiddenRoute(id){
 const p=explorationIIIProfile(id);if(!p||!p.routeTo)return false;const X=ensureExplorationIIIState();if(X.hiddenRoutes[id]?.unlocked)return false;X.hiddenRoutes[id]={unlocked:true,day:state.world.day,to:p.routeTo,name:`Hidden route to ${worldLocation(p.routeTo).name}`,uses:0};explorationIIIRecord(id,`A usable hidden route to ${worldLocation(p.routeTo).name} has been mapped.`,'good');gainScouting(1);return true
}
function assignExplorationIIIOccupant(id,siteState=null){
 const p=explorationIIIProfile(id),S=siteState||explorationIIISiteState(id,true);if(!p||S.occupant)return S.occupant;
 let pool=EXPLORATION_III_OCCUPANTS;if(['banditcamp','smugglerhide','wolfcave'].includes(id))pool=pool.concat(EXPLORATION_III_OCCUPANTS.filter(x=>x.kind==='hostiles'));
 const d=pick(pool),name=pick(d.names);S.occupant={id:`expocc_${id}_${state.world.day}`,name,kind:d.kind,attitude:d.attitude,arrivedDay:state.world.day};S.occupantStatus='present';explorationIIIRecord(id,`${name} are now associated with the site.`,'info');return S.occupant
}
function explorationIIIOccupantText(id){
 const S=explorationIIISiteState(id),o=S.occupant;if(!o||S.occupantStatus==='gone')return 'No current occupants or investigators are known.';return `${o.name} • ${o.kind} • ${S.occupantStatus}`
}
function resolveExplorationIIIHazard(id){
 const p=explorationIIIProfile(id),S=explorationIIISiteState(id);if(!p||S.hazardResolved)return {ok:true,text:'The main environmental hazard has already been addressed.'};const h=EXPLORATION_III_HAZARDS[p.hazard];if(!h)return {ok:true,text:'No major environmental hazard remains.'};
 advanceWorldDays(1,`Navigating ${h.name} at ${worldLocation(id).name}`);const ok=adventureSkillCheck(h.stat,h.dc)||explorationSearchSkill()>=h.dc-5;S.hazardResolved=true;S.phase='penetrated';
 if(ok){explorationIIIRecord(id,`${h.name} was successfully navigated.`,'good');return {ok:true,text:h.success}}
 const dmg=rnd(h.hp[0],h.hp[1]);state.guardian.hp=Math.max(1,state.guardian.hp-dmg);explorationIIIRecord(id,`${h.name} injured or exhausted the expedition (${dmg} HP).`,'bad');return {ok:false,text:`${h.failure} Guardian loses ${dmg} HP.`}
}
function resolveExplorationIIIOccupant(id){
 const S=explorationIIISiteState(id),o=S.occupant||assignExplorationIIIOccupant(id);if(!o||S.occupantStatus!=='present')return {tone:'info',text:'No active occupants remain to deal with.'};
 advanceWorldDays(1,`Dealing with occupants at ${worldLocation(id).name}`);S.investigations++;
 if(o.attitude==='friendly'){S.occupantStatus='cooperating';gainScouting(1);learnExplorationLegend(id,o.name);explorationIIIRecord(id,`${o.name} shared what they know and agreed to coexist with the expedition.`,'good');return {tone:'good',text:`${o.name} cooperate and share local knowledge.`}}
 if(o.attitude==='neutral'){const ok=adventureSkillCheck('cha',13)||state.reputation>=8;if(ok){S.occupantStatus='cooperating';learnExplorationLegend(id,o.name);explorationIIIRecord(id,`${o.name} accepted an arrangement with the Guardian.`,'good');return {tone:'good',text:`${o.name} accept an arrangement and exchange information.`}}S.occupantStatus='wary';explorationIIIRecord(id,`${o.name} remain wary and unwilling to share the site.`,'info');return {tone:'info',text:`${o.name} remain wary. They do not leave, but they avoid the Player Party.`}}
 if(o.attitude==='wary'){const ok=adventureSkillCheck('cha',15);S.occupantStatus=ok?'cooperating':'gone';explorationIIIRecord(id,ok?`${o.name} agreed to a controlled salvage arrangement.`:`${o.name} withdrew rather than risk a confrontation.`,'info');return {tone:ok?'good':'info',text:ok?`${o.name} accept strict salvage terms.`:`${o.name} leave the site rather than contest it.`}}
 S.occupantStatus='gone';const linked=explorationIIIProfile(id)?.linkedSettlement;if(linked&&state.world.settlements?.[linked])settlementState(linked).security=Math.min(100,settlementState(linked).security+1);explorationIIIRecord(id,`${o.name} were driven away from the site.`,'good');return {tone:'good',text:`${o.name} abandon the site after the Guardian's intervention.`}
}
function applyExplorationIIIWorldConsequence(id){
 const p=explorationIIIProfile(id),S=explorationIIISiteState(id);if(!p||S.consequenceApplied)return null;const loc=p.linkedSettlement&&state.world.settlements?.[p.linkedSettlement]?p.linkedSettlement:null;let text='';
 if(loc){const ss=settlementState(loc);if(p.worldEffect==='security'){ss.security=Math.min(100,ss.security+3);progressSettlementProblem(loc,1,`information and pressure relieved by exploration of ${worldLocation(id).name}`);text=`Security around ${worldLocation(loc).name} improves as the site is understood and cleared.`}
 else if(p.worldEffect==='trade'){ss.prosperity=Math.min(100,ss.prosperity+2);if(typeof tradeStock==='function'&&typeof setTradeStock==='function'){/* optional newer economy helper */}progressSettlementProblem(loc,1,`access and supplies improved through ${worldLocation(id).name}`);text=`Trade and supply conditions around ${worldLocation(loc).name} improve.`}
 else if(p.worldEffect==='route'){addRoutePressure(id,loc,-2);ss.security=Math.min(100,ss.security+1);text=`A safer route and better local knowledge reduce pressure near ${worldLocation(loc).name}.`}
 else if(p.worldEffect==='recovery'){ss.prosperity=Math.min(100,ss.prosperity+2);text=`Recovered knowledge and materials modestly improve conditions around ${worldLocation(loc).name}.`}
 else {gainScouting(2);text=`The expedition materially improves regional intelligence around ${worldLocation(loc).name}.`}}
 else{gainScouting(2);text='The completed expedition materially improves regional intelligence.'}
 S.consequenceApplied=true;S.phase='resolved';S.condition='understood';explorationIIIRecord(id,text,'good');recordWorldNews(`${worldLocation(id).name} has changed after the Guardian's expedition. ${text}`,'good');return text
}
function explorationIIICompletionCheck(id){
 const d=interiorDef(id),I=interiorState(id),S=explorationIIISiteState(id);if(!d||!I.completed)return null;learnExplorationLegend(id,'completed expedition');unlockExplorationIIIHiddenRoute(id);if(!S.occupant)assignExplorationIIIOccupant(id);const c=applyExplorationIIIWorldConsequence(id);return c
}
function useExplorationIIIHiddenRoute(id){
 const R=explorationIIIHiddenRoute(id);if(!R?.unlocked)return showWildernessSite(id);const dest=R.to;R.uses=(R.uses||0)+1;advanceWorldDays(1,`Using the hidden route from ${worldLocation(id).name} to ${worldLocation(dest).name}`);state.world.location=dest;state.world.region=locationRegion(dest);const F=playerPartyFieldState();const dl=worldLocation(dest);F.active=!state.world.settlements?.[dest];F.region=locationRegion(dest);F.x=dl.x;F.y=dl.y;F.anchorLocation=dest;F.targetPartyId=null;ensureMapView().lastLocation=null;recordWorldHistory(`Hidden route used: ${worldLocation(id).name} → ${worldLocation(dest).name}.`,'good','exploration');save();closeOverlay();renderOpenWorld()
}
function showExplorationIIISitePanel(id){
 const p=explorationIIIProfile(id);if(!p)return;const S=explorationIIISiteState(id),L=explorationLegendState(id),R=explorationIIIHiddenRoute(id),dialog=document.querySelector('.dialog');if(!dialog||dialog.querySelector('.exploration-iii-panel'))return;
 const box=document.createElement('div');box.className='exploration-iii-panel';box.innerHTML=`<h3>Expedition State</h3><div class="exploration-iii-grid"><div><b>Site condition</b><span>${esc(S.condition)}</span></div><div><b>Expedition phase</b><span>${esc(S.phase)}</span></div><div><b>Environmental risk</b><span>${esc(S.hazardResolved?'addressed':EXPLORATION_III_HAZARDS[p.hazard]?.name||'unknown')}</span></div><div><b>Occupants / investigators</b><span>${esc(explorationIIIOccupantText(id))}</span></div></div><div class="exploration-legend ${L.known?'known':''}"><b>${L.known?esc(p.legend):'Unconfirmed regional legend'}</b><br>${L.known?esc(p.summary):'Investigate the site, speak with occupants, or complete the interior to learn what local stories are attached to this place.'}</div>${!S.hazardResolved?'<button id="expIIIHazard">Address Environmental Hazard</button>':''}${S.occupantStatus==='present'?'<button id="expIIIOccupant">Approach Occupants / Investigators</button>':''}${R?.unlocked?`<button id="expIIIRoute">Use ${esc(R.name)}</button>`:''}${S.discoveries.length?`<details><summary>Persistent site history</summary>${S.discoveries.slice(-6).reverse().map(x=>`<div class="card compact"><b>Day ${x.day}</b><br>${esc(x.text)}</div>`).join('')}</details>`:''}`;
 const footer=dialog.querySelector('.dialog-footer');dialog.insertBefore(box,footer||null);
 if($('#expIIIHazard'))$('#expIIIHazard').onclick=()=>{const r=resolveExplorationIIIHazard(id);save();actionResult(EXPLORATION_III_HAZARDS[p.hazard]?.name||'Environmental Challenge',r.text,r.ok?'good':'bad',()=>showWildernessSite(id))};
 if($('#expIIIOccupant'))$('#expIIIOccupant').onclick=()=>{const r=resolveExplorationIIIOccupant(id);save();actionResult('Site Occupants',r.text,r.tone,()=>showWildernessSite(id))};
 if($('#expIIIRoute'))$('#expIIIRoute').onclick=()=>useExplorationIIIHiddenRoute(id)
}
function showExplorationIIILegends(){
 const X=ensureExplorationIIIState(),regions=(state.world.unlockedRegions||['shantium']);const cards=[];for(const region of regions){const defs=Object.entries(EXPLORATION_III_SITE_PROFILES).filter(([id])=>locationRegion(id)===region);if(!defs.length)continue;cards.push(`<h3>${esc(regionDef(region).name)} Legends</h3>${defs.map(([id,p])=>{const L=explorationLegendState(id);return `<div class="exploration-legend ${L.known?'known':''}"><b>${L.known?esc(p.legend):'Unknown legend'}</b><small>${L.known?` • ${esc(worldLocation(id).name)} • learned Day ${L.day}`:` • ${esc(worldLocation(id).name)}`}</small><p>${L.known?esc(p.summary):'This story has not yet been confirmed.'}</p></div>`}).join('')}`)}
 overlay(`<h2>Regional Legends</h2><p>Legends are persistent leads tied to real places. Clearing sites, investigating clues, and speaking with people at those sites can confirm them.</p>${cards.join('')}<div class="dialog-footer"><button id="close">Close</button></div>`,true);wireClose()
}

/* Expand the original major sites into longer expeditions. Existing saves keep cleared rooms;
   only the new areas remain to investigate. */
function addExplorationIIIRoom(siteId,fromId,room){const d=HIDDEN_INTERIORS[siteId];if(!d||d.rooms.some(x=>x.id===room.id))return;const from=d.rooms.find(x=>x.id===fromId);if(from&&!from.links.includes(room.id))from.links.push(room.id);d.rooms.push(room)}
addExplorationIIIRoom('ashfarm','cellar',{id:'orchard',name:'Black Orchard',text:'Behind a collapsed wall, rows of dead trees point toward a narrow drainage cut. Old markers suggest the farm once served as more than a homestead.',links:['cellar','culvert'],action:'observe'});
addExplorationIIIRoom('ashfarm','orchard',{id:'culvert',name:'Ash Culvert',text:'A low stone culvert continues beneath the field toward the old road. Fresh signs show that people still use it.',links:['orchard'],action:'lore'});
addExplorationIIIRoom('oldshrine','crypt',{id:'undercrypt',name:'Undercrypt',text:'A broken slab reveals an older chamber beneath the shrine, packed with road tokens and weathered warning marks.',links:['crypt','bellway'],action:'trap'});
addExplorationIIIRoom('oldshrine','undercrypt',{id:'bellway',name:'Bell Passage',text:'A narrow passage follows the hill toward the north road. Its stonework is older than the shrine above.',links:['undercrypt'],action:'lore'});
addExplorationIIIRoom('collapsedmine','toolroom',{id:'deepgallery',name:'Deep Gallery',text:'The abandoned tools give way to an intact gallery with old survey marks and a persistent draft from beyond the collapse.',links:['toolroom','ventcut'],action:'trap'});
addExplorationIIIRoom('collapsedmine','deepgallery',{id:'ventcut',name:'Ventilation Cut',text:'A narrow cut climbs toward daylight and overlooks an old haul route no longer shown on current maps.',links:['deepgallery'],action:'observe'});
addExplorationIIIRoom('oldtower','roof',{id:'signalroom',name:'Signal Room',text:'Below the ruined roof is a cramped signal room with sight-lines and coded marks pointing toward the eastern approaches.',links:['roof','postern'],action:'lore'});
addExplorationIIIRoom('oldtower','signalroom',{id:'postern',name:'Hidden Postern',text:'A concealed stair exits on the far side of the ridge, bypassing the obvious tower approach.',links:['signalroom'],action:'observe'});
addExplorationIIIRoom('sinkhole','sidechamber',{id:'windchamber',name:'Wind Chamber',text:'The stone narrows into a chamber where shifting drafts carry distant sounds from the southern road.',links:['sidechamber','fissurepath'],action:'strange'});
addExplorationIIIRoom('sinkhole','windchamber',{id:'fissurepath',name:'Fissure Path',text:'A tight natural corridor reaches a second opening hidden from the ordinary approach.',links:['windchamber'],action:'observe'});

/* Major-site completion is based on finishing the whole mapped interior, regardless of room order. */
for(const id of Object.keys(EXPLORATION_III_SITE_PROFILES)){const d=HIDDEN_INTERIORS[id];if(d)for(const r of d.rooms)r.final=false}

/* Completion must now mean the entire expanded interior, not just the old final room. */
const _explorationIIIResolveInteriorAction=resolveInteriorAction;
resolveInteriorAction=function(id,roomId){
 const p=explorationIIIProfile(id),S=p?explorationIIISiteState(id):null,I=interiorState(id),d=interiorDef(id),r=interiorRoom(id,roomId);if(!d||!r)return;
 /* v1.6.4.2: environmental setup must never consume a labeled room-action click. */
 if(p&&!S.hazardResolved){const h=resolveExplorationIIIHazard(id);I.notes.push(`${EXPLORATION_III_HAZARDS[p.hazard]?.name||'Environmental Challenge'}: ${h.text}`)}
 if(p&&!I.completed)r.final=d.rooms.every(x=>x.id===roomId||I.cleared.includes(x.id));
 _explorationIIIResolveInteriorAction(id,roomId);
 if(p&&r)r.final=false;if(p&&I.completed){explorationIIICompletionCheck(id);save()}
};

const _explorationIIIShowWildernessSite=showWildernessSite;
showWildernessSite=function(id=state.world.location){
 _explorationIIIShowWildernessSite(id);const site=worldLocation(id);if(site&&!site.minor&&explorationIIIProfile(id)){explorationIIISiteState(id);if(interiorState(id).completed)explorationIIICompletionCheck(id);showExplorationIIISitePanel(id)}
};

const _explorationIIIShowExplorationJournal=showExplorationJournal;
showExplorationJournal=function(){
 _explorationIIIShowExplorationJournal();const dialog=document.querySelector('.dialog');if(!dialog||dialog.querySelector('#explorationLegends'))return;const footer=dialog.querySelector('.dialog-footer');const btn=document.createElement('button');btn.id='explorationLegends';btn.textContent='Regional Legends';btn.onclick=showExplorationIIILegends;(footer||dialog).appendChild(btn)
};

/* Surveying can reveal legends even when it does not discover a new site. */
const _explorationIIISurveyCurrentRegion=surveyCurrentRegion;
surveyCurrentRegion=function(){
 const before=knownRegionalLegends(currentWorldRegion()).length;_explorationIIISurveyCurrentRegion();const candidates=Object.keys(EXPLORATION_III_SITE_PROFILES).filter(id=>locationRegion(id)===currentWorldRegion()&&!explorationLegendState(id).known&&state.world.discovered.includes(id));if(candidates.length&&chance(.24)){learnExplorationLegend(pick(candidates),'regional survey');save();if(knownRegionalLegends(currentWorldRegion()).length>before)log('A regional legend has been added to the Exploration Journal.','good')}
};
