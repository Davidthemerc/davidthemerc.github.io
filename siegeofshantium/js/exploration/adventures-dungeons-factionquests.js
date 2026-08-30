function adventureProgressText(site){const s=adventureState(site.location);return s.completed?'CLEARED':SOSText("exploration_adventures_dungeons_factionquests.adventureProgressText.001",Math.min(site.stages,s.stage+1),site.stages)}
function adventureEnemyGroup(siteId,label,size=3){
 const phase=clamp(1+Math.floor(state.world.day/4),1,12),pool=phase<4?ENEMIES.slice(0,12):phase<8?ENEMIES.slice(0,22):ENEMIES.slice(5),members=[];
 for(let i=0;i<size;i++)members.push(makeEnemy(pick(pool),DIFFICULTIES[state.difficulty].enemy,phase));
 return {id:`adv_${siteId}_${uid()}`,adventureSiteId:siteId,name:label,faction:SOSText("exploration_adventures_dungeons_factionquests.adventureEnemyGroup.001"),route:'north',distance:3,speed:1,members,objective:'guard',status:SOSText("exploration_adventures_dungeons_factionquests.adventureEnemyGroup.002"),camp:null,progress:0,retreating:false,threat:Math.round(members.reduce((a,e)=>a+e.maxHp+e.damage*4,0)/10),loot:20+phase*5+size*7,xp:35+phase*5+size*10,commander:null,engaged:false}
}
function startAdventureCombat(siteId,label,size){const gr=adventureEnemyGroup(siteId,label,size);SOSServices.combat.launch(gr)}
function adventureSkillCheck(attr,dc){return rnd(1,12)+stat(state,attr)+Math.floor(state.scouting/2)>=dc}
function grantAdventureTreasure(siteId){
 let text=[];
 if(siteId==='quarry'){valuableAdd(chance(.4)?'val_tradebar':'val_silver',1);gainGold(55+rnd(0,45));text.push(SOSText("exploration_adventures_dungeons_factionquests.grantAdventureTreasure.001"))}
 if(siteId==='watchfort'){valuableAdd('val_relic',1);if(chance(.35))giveNamed(state);else invAdd('stamina',1);text.push(SOSText("exploration_adventures_dungeons_factionquests.grantAdventureTreasure.002"))}
 if(siteId==='woods'){invAdd('heal',1);valuableAdd(chance(.35)?'val_gem':'val_buckle',1);text.push(SOSText("exploration_adventures_dungeons_factionquests.grantAdventureTreasure.003"))}
 if(siteId==='marsh'){valuableAdd(chance(.35)?'val_relic':'val_gem',1);gainGold(35+rnd(0,35));text.push(SOSText("exploration_adventures_dungeons_factionquests.grantAdventureTreasure.004"))}
 state.reputation++;save();return text.join(', ')
}
function resolveAdventureCombatWin(gr){
 const site=ADVENTURE_SITES[gr.adventureSiteId],s=site?adventureState(site.location):null;if(!s)return;
 s.stage=Math.min(site.stages,s.stage+1);s.lastDay=state.world.day;
 if(s.stage>=site.stages&&!s.completed){s.completed=true;const loot=grantAdventureTreasure(site.location),map=chance(.35)?grantTreasureMap(site.location):null;recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.resolveAdventureCombatWin.001",site.name),'good');log(SOSText("exploration_adventures_dungeons_factionquests.resolveAdventureCombatWin.002",site.name,loot,map?` Found ${map.name}.`:''),'good');updateAdventureStory('site',site.location)}
 else log(SOSText("exploration_adventures_dungeons_factionquests.resolveAdventureCombatWin.003",site.name,s.stage,site.stages),'good');
}
function showAdventureSite(siteId){modalRouteEnter(SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.001"),Array.from(arguments));
 const site=ADVENTURE_SITES[siteId]||adventureSiteForLocation(siteId);if(!site)return renderOpenWorld();const s=adventureState(site.location);s.visits++;
 if(s.completed){overlay(SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.002",esc(site.name),esc(site.desc)));$('#dungeonMapBtn').onclick=()=>showDungeonMap(site.location);$('#adventureScavenge').onclick=()=>{advanceWorldDays(1,SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.003",site.name));if(chance(.35)){gainGold(rnd(8,24));log(SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.004"),'good')}else log(SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.005"),'info');save();closeOverlay();renderOpenWorld()};wireClose();return}
 let action='',detail='';
 if(site.location==='quarry'){
   if(s.stage===0){action=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.006");detail=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.007")}
   if(s.stage===1){action=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.008");detail=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.009")}
   if(s.stage===2){action=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.010");detail=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.011")}
 }
 if(site.location==='watchfort'){
   if(s.stage===0){action=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.012");detail=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.013")}
   if(s.stage===1){action=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.014");detail=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.015")}
   if(s.stage===2){action=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.016");detail=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.017")}
 }
 if(site.location==='woods'){
   if(s.stage===0){action=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.018");detail=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.019")}
   if(s.stage===1){action=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.020");detail=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.021")}
 }
 if(site.location==='marsh'){
   if(s.stage===0){action=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.022");detail=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.023")}
   if(s.stage===1){action=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.024");detail=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.025")}
   if(s.stage===2){action=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.026");detail=SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.027")}
 }
 const branch=adventureBranchOptions(site.location),boss=bossNeeded(site.location);overlay(SOSText("exploration_adventures_dungeons_factionquests.showAdventureSite.028",esc(site.name),esc(site.desc),adventureProgressText(site),esc(site.reward),boss?`<div class="warning notice"><b>Unique threat:</b> Something formidable controls the deepest part of this site.</div>`:'',branch||`<div class="choice-list"><button id="adventureAdvance"><b>${esc(action)}</b><br><small>${esc(detail)}</small></button></div>`));
 $('#dungeonMapBtn').onclick=()=>showDungeonMap(site.location);if($('#adventureAdvance'))$('#adventureAdvance').onclick=()=>advanceAdventureSite(site.location);if($('#branchCareful'))$('#branchCareful').onclick=()=>chooseAdventureBranch(site.location,'careful');if($('#branchFast'))$('#branchFast').onclick=()=>chooseAdventureBranch(site.location,'fast');if($('#branchSeal'))$('#branchSeal').onclick=()=>chooseAdventureBranch(site.location,'seal');if($('#branchDeep'))$('#branchDeep').onclick=()=>chooseAdventureBranch(site.location,'deep');wireClose()
}
function advanceAdventureSite(siteId){
 const site=ADVENTURE_SITES[siteId],s=adventureState(siteId);if(!site||s.completed)return showAdventureSite(siteId);
 advanceWorldDays(1,SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.001",site.name));
 if(siteId==='quarry'){
  if(s.stage===0){if(adventureSkillCheck('dex',14)||adventureSkillCheck('wis',14)){s.stage++;log(SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.002"),'good')}else{state.guardian.hp=Math.max(1,state.guardian.hp-rnd(5,12));log(SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.003"),'bad');s.stage++}}
  else if(s.stage===1)return startAdventureCombat(siteId,SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.004"),rnd(2,4));
  else if(s.stage===2){if(adventureSkillCheck('dex',17)&&chance(.45)){s.stage=site.stages;s.completed=true;const loot=grantAdventureTreasure(siteId),map=chance(.45)?grantTreasureMap(siteId):null;recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.005",site.name),'good');updateAdventureStory('site',siteId);return actionResult(SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.006"),SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.007",loot,map?` A map is also found: ${map.name}.`:''),'good',renderOpenWorld)}return startAdventureBoss(siteId)}
 }
 if(siteId==='watchfort'){
  if(s.stage===0){s.stage++;if(adventureSkillCheck('int',14)||adventureSkillCheck('dex',14)){gainScouting(1);log(SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.008"),'good')}else log(SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.009"),'info')}
  else if(s.stage===1)return startAdventureCombat(siteId,SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.010"),rnd(3,5));
  else if(s.stage===2)return startAdventureBoss(siteId);
 }
 if(siteId==='woods'){
  if(s.stage===0){s.stage++;if(adventureSkillCheck('wis',13)||adventureSkillCheck('dex',13))log(SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.011"),'good');else state.guardian.stamina=Math.max(0,state.guardian.stamina-12)}
  else if(s.stage===1)return startAdventureBoss(siteId);
 }
 if(siteId==='marsh'){
  if(s.stage===0){s.stage++;if(!adventureSkillCheck('con',14)&&!adventureSkillCheck('wis',14)){state.guardian.hp=Math.max(1,state.guardian.hp-rnd(4,10));log(SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.012"),'bad')}else log(SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.013"),'good')}
  else if(s.stage===1)return startAdventureCombat(siteId,SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.014"),rnd(2,4));
  else if(s.stage===2){if(adventureSkillCheck('int',17)&&s.branch==='seal'&&chance(.5)){s.stage=site.stages;s.completed=true;const loot=grantAdventureTreasure(siteId),map=chance(.5)?grantTreasureMap(siteId):null;recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.015",site.name),'good');return actionResult(SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.016"),SOSText("exploration_adventures_dungeons_factionquests.advanceAdventureSite.017",loot,map?` Also found: ${map.name}.`:''),'good',renderOpenWorld)}return startAdventureBoss(siteId)}
 }
 save();showAdventureSite(siteId)
}
function adventureStory(){ensureWorldState();return state.world.storyChains.watchfortLedger}
function ensureAdventureStory(){
 ensureWorldState();if(!state.world.storyChains)state.world.storyChains={};
 if(!state.world.storyChains.watchfortLedger)state.world.storyChains.watchfortLedger={stage:0,active:false,complete:false};
 return state.world.storyChains.watchfortLedger
}
function updateAdventureStory(trigger,value){
 const q=ensureAdventureStory();
 if(trigger==='site'&&value==='watchfort'&&!q.active&&!q.complete){q.active=true;q.stage=1;recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.updateAdventureStory.001"),'info');log(SOSText("exploration_adventures_dungeons_factionquests.updateAdventureStory.002"),'good')}
 if(q.active&&q.stage===2&&trigger==='site'&&value==='quarry'){q.stage=3;log(SOSText("exploration_adventures_dungeons_factionquests.updateAdventureStory.003"),'good')}
 save()
}
function checkAdventureStoryArrival(){
 const q=ensureAdventureStory();if(!q.active||q.complete)return;
 if(q.stage===1&&state.world.location==='northgate'){q.stage=2;state.world.factionStanding.Coalition+=2;recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.checkAdventureStoryArrival.001"),'info');log(SOSText("exploration_adventures_dungeons_factionquests.checkAdventureStoryArrival.002"),'good');save()}
 if(q.stage===3&&['shantium','northgate','redoubt'].includes(state.world.location)){log(SOSText("exploration_adventures_dungeons_factionquests.checkAdventureStoryArrival.003"),'info');save()}
}
function adventureStoryText(){
 const q=ensureAdventureStory();if(q.complete)return SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.001");
 if(!q.active)return'';
 const text=q.stage===1?'Take the recovered Watchfort ledger to Northgate Hamlet.':q.stage===2?'Search the Old Quarry for the supply cache marked in the ledger.':SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.002");
 return SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.003",esc(text))
}

const ADVENTURE_BOSSES={
 quarry:{name:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.004"),title:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.005"),hp:1.7,damage:1.35,acc:2,init:1,reward:'val_paychest',taunt:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.006")},
 watchfort:{name:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.007"),title:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.008"),hp:1.8,damage:1.3,acc:3,init:2,reward:'val_relic',taunt:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.009")},
 woods:{name:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.010"),title:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.011"),hp:1.65,damage:1.45,acc:2,init:4,reward:'val_gem',taunt:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.012")},
 marsh:{name:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.013"),title:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.014"),hp:1.85,damage:1.25,acc:3,init:0,reward:'val_relic',taunt:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.015")}
};
const TREASURE_MAP_TEMPLATES=[
 {id:'map_marsh_stone',name:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.016"),location:'marsh',clue:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.017"),reward:'relic'},
 {id:'map_woods_oak',name:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.018"),location:'woods',clue:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.019"),reward:'gear'},
 {id:'map_quarry_cache',name:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.020"),location:'quarry',clue:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.021"),reward:'silver'},
 {id:'map_watchfort_cistern',name:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.022"),location:'watchfort',clue:SOSText("exploration_adventures_dungeons_factionquests.adventureStoryText.023"),reward:'military'}
];
function ensureTreasureMaps(){ensureWorldState();if(!Array.isArray(state.world.treasureMaps))state.world.treasureMaps=[]}
function grantTreasureMap(prefer=null){
 ensureTreasureMaps();const owned=new Set(state.world.treasureMaps.map(m=>m.id)),pool=TREASURE_MAP_TEMPLATES.filter(m=>!owned.has(m.id)&&(prefer?m.location===prefer:true));if(!pool.length)return null;
 const t=pick(pool),m={...t,foundDay:state.world.day,claimed:false};state.world.treasureMaps.push(m);recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.grantTreasureMap.001",m.name),'info');save();return m
}
function treasureMapsAtLocation(locId){ensureTreasureMaps();return state.world.treasureMaps.filter(m=>m.location===locId&&!m.claimed)}
function showTreasureMaps(){modalRouteEnter(SOSText("exploration_adventures_dungeons_factionquests.showTreasureMaps.001"),Array.from(arguments));
 ensureTreasureMaps();const maps=state.world.treasureMaps;
 overlay(SOSText("exploration_adventures_dungeons_factionquests.showTreasureMaps.002",maps.map(m=>`<div class="card ${m.claimed?'muted':''}"><b>${esc(m.name)}</b><p>${esc(m.clue)}</p><small>${m.claimed?'Recovered':'Points toward '+esc(worldLocation(m.location).name)} • found Day ${m.foundDay}</small></div>`).join('')||'<div class="notice muted">No treasure maps have been found.</div>'));wireClose()
}
function recoverTreasureMap(id){
 ensureTreasureMaps();const m=state.world.treasureMaps.find(x=>x.id===id&&!x.claimed);if(!m||m.location!==state.world.location)return;
 advanceWorldDays(1,SOSText("exploration_adventures_dungeons_factionquests.recoverTreasureMap.001",m.name));m.claimed=true;let text='';
 if(m.reward==='relic'){valuableAdd('val_relic',1);gainGold(rnd(35,70));text=SOSText("exploration_adventures_dungeons_factionquests.recoverTreasureMap.002")}
 if(m.reward==='gear'){if(chance(.55))giveNamed(state);else{invAdd('heal',2);valuableAdd('val_gem',1)}text=SOSText("exploration_adventures_dungeons_factionquests.recoverTreasureMap.003")}
 if(m.reward==='silver'){valuableAdd('val_tradebar',1);valuableAdd('val_silver',1);gainGold(rnd(30,60));text=SOSText("exploration_adventures_dungeons_factionquests.recoverTreasureMap.004")}
 if(m.reward==='military'){invAdd('stamina',2);valuableAdd('val_buckle',1);if(chance(.35))giveNamed(state);text=SOSText("exploration_adventures_dungeons_factionquests.recoverTreasureMap.005")}
 state.reputation++;recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.recoverTreasureMap.006",m.name,worldLocation(m.location).name),'good');save();actionResult(SOSText("exploration_adventures_dungeons_factionquests.recoverTreasureMap.007"),SOSText("exploration_adventures_dungeons_factionquests.recoverTreasureMap.008",text),'good',renderOpenWorld)
}
function makeAdventureBossGroup(siteId){
 const site=ADVENTURE_SITES[siteId],boss=ADVENTURE_BOSSES[siteId],phase=clamp(2+Math.floor(state.world.day/4),2,12),base=pick(ENEMIES.slice(Math.min(6,ENEMIES.length-1))),e=makeEnemy(base,DIFFICULTIES[state.difficulty].enemy,phase);
 e.name=boss.name;e.maxHp=e.hp=Math.round(e.maxHp*boss.hp);e.damage=Math.round(e.damage*boss.damage);e.acc+=boss.acc;e.init+=boss.init;e.trait=(e.trait?e.trait+' • ':'')+SOSText("exploration_adventures_dungeons_factionquests.makeAdventureBossGroup.001");
 const adds=[];for(let i=0;i<(state.world.day>18?2:1);i++)adds.push(makeEnemy(pick(ENEMIES.slice(0,Math.min(18,ENEMIES.length))),DIFFICULTIES[state.difficulty].enemy,phase));
 const members=[e,...adds];
 return {id:`advboss_${siteId}_${uid()}`,adventureSiteId:siteId,adventureBoss:true,bossReward:boss.reward,name:boss.name,faction:SOSText("exploration_adventures_dungeons_factionquests.makeAdventureBossGroup.002"),route:'north',distance:3,speed:1,members,objective:'boss',status:SOSText("exploration_adventures_dungeons_factionquests.makeAdventureBossGroup.003"),camp:null,progress:0,retreating:false,threat:Math.round(members.reduce((a,x)=>a+x.maxHp+x.damage*4,0)/9),loot:65+phase*8,xp:85+phase*9,commander:{name:boss.name,line:boss.taunt||SOSText("exploration_adventures_dungeons_factionquests.makeAdventureBossGroup.004"),taunt:boss.taunt||SOSText("exploration_adventures_dungeons_factionquests.makeAdventureBossGroup.005"),quote:boss.taunt||SOSText("exploration_adventures_dungeons_factionquests.makeAdventureBossGroup.006")},engaged:false}
}
function startAdventureBoss(siteId){const gr=makeAdventureBossGroup(siteId);SOSServices.combat.launch(gr)}
function resolveAdventureBossWin(gr){
 const s=adventureState(gr.adventureSiteId),site=ADVENTURE_SITES[gr.adventureSiteId];if(!s||!site)return;
 s.bossDefeated=true;s.stage=site.stages;s.completed=true;
 if(gr.bossReward)valuableAdd(gr.bossReward,1);const bossItem={quarry:'boss_quarry_cleaver',watchfort:'boss_signal_sabre',woods:'boss_greyfang_charm',marsh:'boss_drowned_ring'}[gr.adventureSiteId];if(bossItem&&!state.guardian.inventory.some(x=>x.id===bossItem)&&!allEquipmentIds().includes(bossItem)){invAdd(bossItem);log(SOSText("exploration_adventures_dungeons_factionquests.resolveAdventureBossWin.001",item(bossItem).name),'good')}
 const map=chance(.7)?grantTreasureMap(gr.adventureSiteId):grantTreasureMap();
 state.reputation+=2;
 const ss=state.world.settlements[site.location];if(ss){ss.security=Math.min(100,ss.security+8);ss.prosperity=Math.min(100,ss.prosperity+3)}
 recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.resolveAdventureBossWin.002",gr.name,site.name),'good');if(site.location==='watchfort'){state.world.factionStanding.Coalition+=1;state.world.factionStanding.Redstone-=1}if(site.location==='quarry'){state.world.factionStanding.Independent+=2}if(site.location==='woods'){state.world.settlements.river.security=Math.min(100,state.world.settlements.river.security+2)}if(site.location==='marsh'){state.world.settlements.southroad.security=Math.min(100,state.world.settlements.southroad.security+2)}
 updateAdventureStory('site',gr.adventureSiteId);
 log(SOSText("exploration_adventures_dungeons_factionquests.resolveAdventureBossWin.003",gr.name,map?` Recovered ${map.name}.`:''),'good');save()
}
function bossNeeded(siteId){const s=adventureState(siteId);return !s.completed&&s.stage>=Math.max(1,ADVENTURE_SITES[siteId].stages-1)&&!s.bossDefeated}
function adventureBranchOptions(siteId){
 const s=adventureState(siteId);if(s.branch)return '';
 if(siteId==='woods'&&s.stage===1)return SOSText("exploration_adventures_dungeons_factionquests.adventureBranchOptions.001");
 if(siteId==='marsh'&&s.stage===1)return SOSText("exploration_adventures_dungeons_factionquests.adventureBranchOptions.002");
 return ''
}
function chooseAdventureBranch(siteId,choice){
 const s=adventureState(siteId);s.branch=choice;
 if(siteId==='woods'&&choice==='careful'){gainScouting(1);log(SOSText("exploration_adventures_dungeons_factionquests.chooseAdventureBranch.001"),'good')}
 if(siteId==='woods'&&choice==='fast'){state.guardian.stamina=Math.max(0,state.guardian.stamina-8);log(SOSText("exploration_adventures_dungeons_factionquests.chooseAdventureBranch.002"),'info')}
 if(siteId==='marsh'&&choice==='seal'){state.world.settlements.shantium.security=Math.min(100,state.world.settlements.shantium.security+1);log(SOSText("exploration_adventures_dungeons_factionquests.chooseAdventureBranch.003"),'good')}
 if(siteId==='marsh'&&choice==='deep'){valuableAdd('val_silver',1);log(SOSText("exploration_adventures_dungeons_factionquests.chooseAdventureBranch.004"),'good')}
 save();showAdventureSite(siteId)
}
function storyLedgerResolutionReady(){
 const q=ensureAdventureStory();return q.active&&q.stage===3&&['shantium','northgate','redoubt'].includes(state.world.location)
}
function showLedgerResolution(){modalRouteEnter(SOSText("exploration_adventures_dungeons_factionquests.showLedgerResolution.001"),Array.from(arguments));
 const q=ensureAdventureStory();if(!storyLedgerResolutionReady())return renderOpenWorld();
 const loc=state.world.location;
 let choices='';
 if(loc==='shantium')choices=SOSText("exploration_adventures_dungeons_factionquests.showLedgerResolution.002");
 if(loc==='northgate')choices=SOSText("exploration_adventures_dungeons_factionquests.showLedgerResolution.003");
 if(loc==='redoubt')choices=SOSText("exploration_adventures_dungeons_factionquests.showLedgerResolution.004");
 overlay(SOSText("exploration_adventures_dungeons_factionquests.showLedgerResolution.005",choices));
 if($('#ledgerShantium'))$('#ledgerShantium').onclick=()=>resolveLedgerBranch('shantium');
 if($('#ledgerCoalition'))$('#ledgerCoalition').onclick=()=>resolveLedgerBranch('coalition');
 if($('#ledgerRedstone'))$('#ledgerRedstone').onclick=()=>resolveLedgerBranch('redstone');wireClose()
}
function resolveLedgerBranch(choice){
 const q=ensureAdventureStory();if(!q.active||q.stage!==3)return;
 q.complete=true;q.active=false;q.branch=choice;
 if(choice==='shantium'){gainGold(180);state.reputation+=3;state.world.factionStanding.Shantium+=4;valuableAdd('val_relic',1);recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.001"),'good')}
 if(choice==='coalition'){gainGold(135);state.reputation+=2;state.world.factionStanding.Coalition+=6;state.world.factionStanding.Redstone-=2;recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.002"),'info')}
 if(choice==='redstone'){gainGold(260);state.world.factionStanding.Redstone+=6;state.world.factionStanding.Coalition-=4;state.reputation=Math.max(0,state.reputation-1);recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.003"),'bad')}
 save();actionResult(SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.004"),choice==='shantium'?'Shantium receives the records and rewards the Guardian.':choice==='coalition'?'The Coalition receives the records, shifting regional relations in its favor.':SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.005"),'good',renderOpenWorld)
}

const DUNGEON_LAYOUTS={
 quarry:{rooms:[
  {id:'mouth',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.006"),x:9,y:47,stage:0,type:'entry',desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.007")},
  {id:'ledge',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.008"),x:32,y:26,stage:1,type:'trap',attr:'dex',dc:14,desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.009")},
  {id:'gallery',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.010"),x:53,y:49,stage:2,type:'combat',desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.011")},
  {id:'falsewall',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.012"),x:53,y:76,stage:2,type:'secret',attr:'int',dc:15,desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.013")},
  {id:'vault',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.014"),x:80,y:49,stage:3,type:'boss',desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.015")}
 ]},
 watchfort:{rooms:[
  {id:'yard',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.016"),x:10,y:50,stage:0,type:'entry',desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.017")},
  {id:'stairs',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.018"),x:33,y:50,stage:1,type:'lock',attr:'int',dc:14,desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.019")},
  {id:'tower',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.020"),x:55,y:28,stage:2,type:'combat',desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.021")},
  {id:'cistern',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.022"),x:55,y:73,stage:2,type:'secret',attr:'dex',dc:15,desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.023")},
  {id:'archive',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.024"),x:82,y:49,stage:3,type:'boss',desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.025")}
 ]},
 woods:{rooms:[
  {id:'trail',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.026"),x:12,y:50,stage:0,type:'entry',desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.027")},
  {id:'blind',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.028"),x:43,y:25,stage:1,type:'secret',attr:'wis',dc:13,desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.029")},
  {id:'hollow',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.030"),x:70,y:50,stage:2,type:'boss',desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.031")},
  {id:'cache',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.032"),x:44,y:75,stage:1,type:'lock',attr:'dex',dc:14,desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.033")}
 ]},
 marsh:{rooms:[
  {id:'causeway',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.034"),x:10,y:48,stage:0,type:'entry',desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.035")},
  {id:'ante',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.036"),x:34,y:48,stage:1,type:'trap',attr:'con',dc:14,desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.037")},
  {id:'side',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.038"),x:53,y:75,stage:2,type:'secret',attr:'wis',dc:15,desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.039")},
  {id:'sanctum',name:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.040"),x:76,y:48,stage:3,type:'boss',desc:SOSText("exploration_adventures_dungeons_factionquests.resolveLedgerBranch.041")}
 ]}
};
function dungeonLayout(siteId){return DUNGEON_LAYOUTS[siteId]||null}
function ensureDungeonState(siteId){const s=adventureState(siteId);if(!s.dungeon)s.dungeon={visited:[],secrets:[],disabledTraps:[],current:null};return s.dungeon}
function dungeonRoomStatus(siteId,r){
 const s=adventureState(siteId),d=ensureDungeonState(siteId);
 if(d.secrets.includes(r.id))return SOSText("exploration_adventures_dungeons_factionquests.dungeonRoomStatus.001");
 if(d.visited.includes(r.id))return SOSText("exploration_adventures_dungeons_factionquests.dungeonRoomStatus.002");
 if(r.stage<=s.stage)return SOSText("exploration_adventures_dungeons_factionquests.dungeonRoomStatus.003");
 if(r.stage===s.stage+1)return SOSText("exploration_adventures_dungeons_factionquests.dungeonRoomStatus.004");
 return SOSText("exploration_adventures_dungeons_factionquests.dungeonRoomStatus.005")
}
function showDungeonMap(siteId){modalRouteEnter(SOSText("exploration_adventures_dungeons_factionquests.showDungeonMap.001"),Array.from(arguments));
 const site=ADVENTURE_SITES[siteId],layout=dungeonLayout(siteId);if(!site||!layout)return showAdventureSite(siteId);
 const s=adventureState(siteId),d=ensureDungeonState(siteId);
 overlay(SOSText("exploration_adventures_dungeons_factionquests.showDungeonMap.002",esc(site.name),layout.rooms.map(r=>{const status=dungeonRoomStatus(siteId,r),locked=status==='LOCKED';return `<button class="dungeon-room room-${r.type} ${status==='VISITED'||status==='CLEARED SECRET'?'room-cleared':''}" data-room="${r.id}" style="left:${r.x}%;top:${r.y}%" ${locked?'disabled':''}><b>${esc(r.name)}</b><span>${esc(status)}</span></button>`}).join(''),adventureProgressText(site),s.bossDefeated?' • Boss defeated':''));
 document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>interactDungeonRoom(siteId,b.dataset.room));$('#dungeonBack').onclick=()=>SOSServices.navigation.back(()=>showAdventureSite(siteId));wireClose()
}
function interactDungeonRoom(siteId,roomId){
 const layout=dungeonLayout(siteId),r=layout?.rooms.find(x=>x.id===roomId),s=adventureState(siteId),d=ensureDungeonState(siteId);if(!r)return;
 d.current=roomId;if(!d.visited.includes(roomId)&&r.stage<=s.stage)d.visited.push(roomId);
 if(r.type==='entry')return actionResult(r.name,r.desc,'info',()=>showDungeonMap(siteId));
 if(r.type==='secret'){
  if(d.secrets.includes(roomId))return actionResult(r.name,SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.001"),'info',()=>showDungeonMap(siteId));
  advanceWorldDays(1,SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.002",ADVENTURE_SITES[siteId].name));
  const ok=adventureSkillCheck(r.attr||'dex',r.dc||14)||state.scouting>=4;
  if(ok){d.secrets.push(roomId);valuableAdd(chance(.45)?'val_gem':'val_silver',1);if(chance(.3))grantTreasureMap(siteId);save();return actionResult(SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.003"),SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.004",r.desc),'good',()=>showDungeonMap(siteId))}
  return actionResult(SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.005"),SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.006",r.desc),'info',()=>showDungeonMap(siteId))
 }
 if(r.type==='lock'){
  if(d.visited.includes(roomId)&&r.stage<=s.stage)return actionResult(r.name,SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.007"),'info',()=>showDungeonMap(siteId));
  advanceWorldDays(1,SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.008",ADVENTURE_SITES[siteId].name));
  const ok=adventureSkillCheck(r.attr||'dex',r.dc||14);
  if(ok){d.visited.push(roomId);gainScouting(1);save();return actionResult(SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.009"),SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.010",r.name),'good',()=>showDungeonMap(siteId))}
  state.guardian.stamina=Math.max(0,state.guardian.stamina-8);save();return actionResult(SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.011"),SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.012"),'bad',()=>showDungeonMap(siteId))
 }
 if(r.type==='trap'){
  if(d.disabledTraps.includes(roomId))return actionResult(r.name,SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.013"),'info',()=>showDungeonMap(siteId));
  advanceWorldDays(1,SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.014",ADVENTURE_SITES[siteId].name));
  const ok=adventureSkillCheck(r.attr||'dex',r.dc||14);
  if(ok){d.disabledTraps.push(roomId);gainScouting(1);save();return actionResult(SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.015"),SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.016",r.name),'good',()=>showDungeonMap(siteId))}
  state.guardian.hp=Math.max(1,state.guardian.hp-rnd(5,12));save();return actionResult(SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.017"),SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.018"),'bad',()=>showDungeonMap(siteId))
 }
 if(r.stage>s.stage+1)return;
 if(r.type==='boss'&&bossNeeded(siteId))return startAdventureBoss(siteId);
 if(r.type==='combat'||r.stage===s.stage+1)return advanceAdventureSite(siteId);
 return actionResult(r.name,r.desc,'info',()=>showDungeonMap(siteId))
}

const FACTION_QUESTLINES={
 coalition:{id:SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.019"),name:SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.020"),faction:SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.021"),start:'northgate',minStanding:2},
 redstone:{id:SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.022"),name:SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.023"),faction:SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.024"),start:'redoubt',minStanding:0},
 independent:{id:SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.025"),name:SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.026"),faction:SOSText("exploration_adventures_dungeons_factionquests.interactDungeonRoom.027"),start:'stonebridge',minStanding:2}
};
function ensureFactionQuestlines(){ensureWorldState();if(!state.world.factionQuestlines)state.world.factionQuestlines={};for(const def of Object.values(FACTION_QUESTLINES))if(!state.world.factionQuestlines[def.id])state.world.factionQuestlines[def.id]={stage:0,active:false,complete:false,branch:null}}
function factionQuestState(id){ensureFactionQuestlines();return state.world.factionQuestlines[id]}
function availableFactionQuestlinesHere(){
 ensureFactionQuestlines();return Object.values(FACTION_QUESTLINES).filter(def=>def.start===state.world.location&&!factionQuestState(def.id).complete&&(!factionQuestState(def.id).active)&&(state.world.factionStanding[def.faction]||0)>=def.minStanding)
}
function activeFactionQuestText(){
 ensureFactionQuestlines();let out='';
 const cq=factionQuestState(SOSText("exploration_adventures_dungeons_factionquests.activeFactionQuestText.001"));if(cq.active)out+=SOSText("exploration_adventures_dungeons_factionquests.activeFactionQuestText.002",cq.stage===1?'Inspect the Broken Watchfort signal system.':cq.stage===2?'Carry the restored signal code to River Crossing.':'Choose whether the final signal network serves the Coalition alone or is shared with Shantium.');
 const rq=factionQuestState(SOSText("exploration_adventures_dungeons_factionquests.activeFactionQuestText.003"));if(rq.active)out+=SOSText("exploration_adventures_dungeons_factionquests.activeFactionQuestText.004",rq.stage===1?'Visit the Old Quarry and recover proof of raider interference.':rq.stage===2?'Take the proof to Stonebridge.':'Return to Redstone Redoubt for a decision about the road.');
 const iq=factionQuestState(SOSText("exploration_adventures_dungeons_factionquests.activeFactionQuestText.005"));if(iq.active)out+=SOSText("exploration_adventures_dungeons_factionquests.activeFactionQuestText.006",iq.stage===1?'Make the Western Woods safer for caravans.':iq.stage===2?'Bring 2 Worked Timber to River Crossing.':'Return to Stonebridge to establish the compact.');
 return out
}
function showFactionQuestlines(){modalRouteEnter(SOSText("exploration_adventures_dungeons_factionquests.showFactionQuestlines.001"),Array.from(arguments));
 ensureFactionQuestlines();const available=availableFactionQuestlinesHere(),active=Object.values(FACTION_QUESTLINES).filter(d=>factionQuestState(d.id).active);
 overlay(SOSText("exploration_adventures_dungeons_factionquests.showFactionQuestlines.002",available.map(d=>`<div class="card"><b>${esc(d.name)}</b><p>A longer ${esc(d.faction)}-aligned assignment with multiple stages and regional consequences.</p><button data-startfq="${d.id}">Begin Questline</button></div>`).join('')||'<div class="notice muted">No new faction questline can be started here right now.</div>',activeFactionQuestText()||'<p class="muted">None.</p>'));
 document.querySelectorAll('[data-startfq]').forEach(b=>b.onclick=()=>startFactionQuestline(b.dataset.startfq));wireClose()
}
function startFactionQuestline(id){
 ensureFactionQuestlines();const q=factionQuestState(id);q.active=true;q.stage=1;
 const def=Object.values(FACTION_QUESTLINES).find(x=>x.id===id);recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.startFactionQuestline.001",def.name),'info');save();showFactionQuestlines()
}
function checkFactionQuestProgress(){
 if(!isOpenWorld())return;ensureFactionQuestlines();const loc=state.world.location;
 const cq=factionQuestState(SOSText("exploration_adventures_dungeons_factionquests.checkFactionQuestProgress.001"));
 if(cq.active&&cq.stage===1&&loc==='watchfort'&&adventureState('watchfort').completed){cq.stage=2;recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.checkFactionQuestProgress.002"),'info')}
 if(cq.active&&cq.stage===2&&loc==='river'){cq.stage=3;log(SOSText("exploration_adventures_dungeons_factionquests.checkFactionQuestProgress.003"),'good')}
 const rq=factionQuestState(SOSText("exploration_adventures_dungeons_factionquests.checkFactionQuestProgress.004"));
 if(rq.active&&rq.stage===1&&loc==='quarry'&&adventureState('quarry').completed){rq.stage=2;valuableAdd('val_buckle',1);log(SOSText("exploration_adventures_dungeons_factionquests.checkFactionQuestProgress.005"),'good')}
 if(rq.active&&rq.stage===2&&loc==='stonebridge'){rq.stage=3;recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.checkFactionQuestProgress.006"),'info')}
 const iq=factionQuestState(SOSText("exploration_adventures_dungeons_factionquests.checkFactionQuestProgress.007"));
 if(iq.active&&iq.stage===1&&loc==='woods'&&adventureState('woods').completed){iq.stage=2;log(SOSText("exploration_adventures_dungeons_factionquests.checkFactionQuestProgress.008"),'good')}
 if(iq.active&&iq.stage===2&&loc==='river'&&(state.world.cargo.timber||0)>=2){state.world.cargo.timber-=2;iq.stage=3;log(SOSText("exploration_adventures_dungeons_factionquests.checkFactionQuestProgress.009"),'good')}
 if(iq.active&&iq.stage===3&&loc==='stonebridge'){completeFactionQuestline(SOSText("exploration_adventures_dungeons_factionquests.checkFactionQuestProgress.010"),'compact')}
 save()
}
function showFactionQuestDecision(){modalRouteEnter(SOSText("exploration_adventures_dungeons_factionquests.showFactionQuestDecision.001"),Array.from(arguments));
 ensureFactionQuestlines();const cq=factionQuestState(SOSText("exploration_adventures_dungeons_factionquests.showFactionQuestDecision.002")),rq=factionQuestState(SOSText("exploration_adventures_dungeons_factionquests.showFactionQuestDecision.003"));
 if(cq.active&&cq.stage===3&&['northgate','shantium'].includes(state.world.location)){
  overlay(SOSText("exploration_adventures_dungeons_factionquests.showFactionQuestDecision.004"));$('#fqCoalOnly').onclick=()=>completeFactionQuestline(SOSText("exploration_adventures_dungeons_factionquests.showFactionQuestDecision.005"),'coalition');$('#fqCoalShare').onclick=()=>completeFactionQuestline(SOSText("exploration_adventures_dungeons_factionquests.showFactionQuestDecision.006"),'shared');wireClose();return true
 }
 if(rq.active&&rq.stage===3&&state.world.location==='redoubt'){
  overlay(SOSText("exploration_adventures_dungeons_factionquests.showFactionQuestDecision.007"));$('#fqRedClaim').onclick=()=>completeFactionQuestline(SOSText("exploration_adventures_dungeons_factionquests.showFactionQuestDecision.008"),'redstone');$('#fqRedNeutral').onclick=()=>completeFactionQuestline(SOSText("exploration_adventures_dungeons_factionquests.showFactionQuestDecision.009"),'neutral');wireClose();return true
 }
 return false
}
function completeFactionQuestline(id,branch){
 const q=factionQuestState(id);if(!q.active)return;q.active=false;q.complete=true;q.branch=branch;
 if(id===SOSText("exploration_adventures_dungeons_factionquests.completeFactionQuestline.001")){
  if(branch==='coalition'){gainGold(145);state.world.factionStanding.Coalition+=6;state.world.factionStanding.Redstone-=2}
  else{gainGold(110);state.world.factionStanding.Coalition+=3;state.world.factionStanding.Shantium+=3;state.world.settlements.shantium.security=Math.min(100,state.world.settlements.shantium.security+5)}
 }
 if(id===SOSText("exploration_adventures_dungeons_factionquests.completeFactionQuestline.002")){
  if(branch==='redstone'){gainGold(190);state.world.factionStanding.Redstone+=6;state.world.factionStanding.Independent-=2}
  else{gainGold(120);state.world.factionStanding.Independent+=4;state.world.factionStanding.Redstone+=1;state.reputation+=2}
 }
 if(id===SOSText("exploration_adventures_dungeons_factionquests.completeFactionQuestline.003")){gainGold(160);state.world.factionStanding.Independent+=6;state.world.settlements.stonebridge.prosperity=Math.min(100,state.world.settlements.stonebridge.prosperity+7);state.world.settlements.river.prosperity=Math.min(100,state.world.settlements.river.prosperity+5)}
 state.reputation++;recordWorldNews(SOSText("exploration_adventures_dungeons_factionquests.completeFactionQuestline.004",Object.values(FACTION_QUESTLINES).find(x=>x.id===id).name),'good');save();actionResult(SOSText("exploration_adventures_dungeons_factionquests.completeFactionQuestline.005"),SOSText("exploration_adventures_dungeons_factionquests.completeFactionQuestline.006"),'good',renderOpenWorld)
}

function defaultWorldState(){
 const candidates=ALLIES.filter(a=>!a.fieldOnly);
 const locs=['river','woods','quarry','southroad','watchfort','marsh','stonebridge','northgate'];
 const companions={};
 const blueHomes={blue_guide:'lowcreek',blue_quarry:'winterstone',blue_valley:'norwegian',blue_signal:'skybreak',red_adjutant:'sengia',red_lockrunner:'lockwood',red_grainwarden:'briarlake',red_firebreak:'pyreglade'};
 candidates.forEach((a,i)=>companions[a.id]={id:a.id,location:blueHomes[a.id]||locs[i%locs.length],known:false,lastSeenDay:0,disposition:0,cooldownUntil:0});
 return {day:1,location:'shantium',region:'shantium',unlockedRegions:['shantium'],regionHistory:[],discovered:WORLD_LOCATIONS.filter(x=>!x.hidden&&locationRegion(x)==='shantium').map(x=>x.id),companions,rumors:[],travelHistory:[],lastMoveDay:1,parties:[],quests:[],contracts:{},contractDay:0,factionStanding:defaultFactionStanding(),cargo:{food:0,medicine:0,timber:0,cloth:0,iron:0,tools:0,luxury:0,hides:0,stone:0,livestock:0,salt:0,spirits:0,dye:0},settlements:defaultSettlementState(),worldEvents:[],adventures:{},storyChains:{},treasureMaps:[],factionQuestlines:{},localReputation:defaultLocalReputation(),npcFamiliarity:{},history:[],homeBase:defaultHomeBase(),personalRequests:{},trackedQuestId:null,trackedPartyId:null,activeEscortQuestId:null,roadEventHistory:[],roadEventCooldownDay:0,roadEventStats:{helped:0,ignored:0,hostile:0,profited:0},contractChains:{},contractStats:{completed:0,failed:0,abandoned:0,early:0,followups:0},contractMemory:{entities:{},history:[]},pendingContractFailures:[],captivity:null,captiveCompanions:{},factionPresence:{},factionActivityDay:0,factionDiplomacy:{},factionIncidents:{},factionPrivileges:{},companionStories:{},settlementEvents:{},npcMovements:{},settlementVisits:{},settlementProblems:{},reputationMilestones:{},shantiumCommunity:{recognitions:[],lastCeremonyDay:0,publicMood:'steady'},regionalSimulation:{threads:[],flows:[],routePressure:{},lastResponseDay:{},opportunities:[],interventions:[]},politics:{settlements:{},treaties:{},roadRights:{},history:[]},encounterStats:{ambushes:0,avoided:0,surrenders:0,parleys:0,withdrawals:0,terrainWins:{}},economy:{properties:{},investments:[],ledger:[],regionalStorage:{},projects:{}},law:{heat:{},bounties:{},crimes:[],warrants:{},jailings:0,finesPaid:0,bribes:0},roadLife:{queue:[],history:[],lastSceneDay:0,camps:0,initiatives:0,arguments:0,reconciliations:0},worldIntegration:defaultWorldIntegrationState()};
}

let WORLD_STATE_ENSURING=false;
