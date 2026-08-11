window.DSH=window.DSH||{};
DSH.Save=(()=>{
 const KEY='deniseSolitaireHarvest', VERSION=40;
 function defaults(){return{
   version:VERSION,level:1,coins:80,gems:2,bestStreak:0,harvests:0,region:0,windmills:0,
   timedHarvestAt:Date.now(),timedHarvestClaims:0,timedHarvestCoins:0,timedHarvestGems:0,
   harvestStreak:0,rosieHappiness:50,rosieTreats:0,lastPetAt:0,lastFarmVisitAt:0,
   farmRegionView:0,regionRewardsClaimed:{0:true},regionDecorations:{},
   farmOrders:[],farmOrderSerial:0,inDemandDate:'',inDemandCrop:'',
   milestonesCleared:{},chapterBest:{},
   rosieAdventure:null,rosieAdventureFinds:{clover:0,feather:0,star:0,cache:0},rosieAdventureHistory:{},
   farmhouseTrophies:{},farmhouseTierClaims:{},rosieToys:{},chapterMemorabilia:{},
   lifetime:{coinsEarned:0,coinsSpent:0,gemsEarned:0,gemsSpent:0},_walletSnapshot:null,
   weatherOverride:'',weatherOverrideUntil:0,eventOverride:'',eventOverrideUntil:0,eventProgress:{},eventClaimed:{},
   dailyLastClaimDate:'',dailyLastWinDate:'',dailyWinStreak:0,dailyBestScore:0,dailyBestScoreDate:'',
   collection:{specials:{},crops:{},regions:{0:true},powers:{},rosie:{}},
   levelStars:{},achievements:{},magicGates:0,rosieRescues:0,magicDice:0,luckySeeds:0,sunCharms:0,magicDiceUnlocked:false,luckySeedUnlocked:false,sunCharmUnlocked:false,magicDiceTier2:false,luckySeedTier2:false,sunCharmTier2:false,
   plots:Array(6).fill(null),upgrades:{fence:false,butterfly:false,barn:false,bandana:false},
   settings:{sfx:true,sfxVolume:.65,reducedMotion:false,highContrast:false,largeCardValues:false,colorIndependentSuits:false,tutorialNotices:true},
   seenMechanics:{},saveHealth:{lastCheckAt:0,lastRepairAt:0,lastIssueCount:0},
   stats:{levelsCompleted:0,cardsCleared:0,totalScore:0,windmillsFound:0,windmillsUsed:0,wildsPlayed:0,drawPacksBought:0,magicGatesFound:0,magicGatesUsed:0,rosieRescuesFound:0,rosieRescuesUsed:0,streakBonuses:0,streakCoins:0,streakBonusDraws:0,timedHarvestClaims:0,timedHarvestCoins:0,timedHarvestGems:0,rosieFinds:0,
   rosieTreasures:0,treatsFound:0,treatsFed:0,petRosieCount:0,harvestStreakMax:0,
   perfectClears:0,threeStarClears:0,starsEarned:0,powersUsed:0,
   specialCardsCleared:0,flowersCleared:0,goldenCardsCleared:0,goldenGems:0,keysCleared:0,barnLocksCleared:0,wateringCansCleared:0,beeCardsCleared:0,harvestChainsCompleted:0,harvestChainCoins:0,
   rainbowCardsCleared:0,shearsUsed:0,shearsEarned:0,obstacleLevelsCleared:0,
   regionalCropsHarvested:0,regionRewardsClaimed:0,regionDecorationsOwned:0,applesHarvested:0,
   dailyChallengesStarted:0,dailyChallengesCompleted:0,dailyPerfectClears:0,dailyRewardsClaimed:0,
   dailyBestWinStreak:0,dailyCoinsEarned:0,dailyGemsEarned:0,tier2UpgradesOwned:0,
   rosieRescueClears:0,rosieRescueCardsCleared:0,rosieRescueNudges:0,rosieRescueSwaps:0,
   missionsChosen:0,missionsCompleted:0,missionsFailed:0,missionCoinsEarned:0,missionGemsEarned:0,missionPowersEarned:0,
   farmOrdersCompleted:0,farmOrderCoinsEarned:0,farmOrderGemsEarned:0,farmOrderPowersEarned:0,inDemandHarvests:0,
   milestonesCompleted:0,milestoneCoinsEarned:0,milestoneGemsEarned:0,
   rosieAdventuresCompleted:0,rosieAdventureCoins:0,rosieAdventureGems:0,rosieAdventureRareFinds:0,rosieAdventurePowers:0,rosieToysFound:0,
   trophiesUnlocked:0,tierAchievementsUnlocked:0,reserveUses:0,challengeHandsWon:0,luckyHandsWon:0,previewChoicesUsed:0,heavyCardsCleared:0,sleepingCardsCleared:0,sunflowerCardsCleared:0,
   weatherLevels:0,eventLevels:0,festivalClaims:0,
   developerActions:0,
   achievementsUnlocked:0}
 }}
 function migrate(raw){
   if(!raw||typeof raw!=='object') return defaults();
   if(!raw.version){raw.version=1;raw.stats=raw.stats||{levelsCompleted:Math.max(0,(raw.level||1)-1),cardsCleared:0,totalScore:0}}
   if(raw.version===1){raw.version=2;raw.stats=raw.stats||{}}
   if(raw.version===2){raw.version=3;raw.windmills=raw.windmills||0;raw.settings=raw.settings||{};raw.stats=raw.stats||{}}
   if(raw.version===3){raw.version=4;raw.stats=raw.stats||{}}
   if(raw.version===4){raw.version=5;raw.stats=raw.stats||{}}
   if(raw.version===5){raw.version=6}
   if(raw.version===6){raw.version=7}
   if(raw.version===7){raw.version=8}
   if(raw.version===8){raw.version=9}
   if(raw.version===9){raw.version=10}
   if(raw.version===10){raw.version=11}
   if(raw.version===11){raw.version=12}
   if(raw.version===12){raw.version=13}
   if(raw.version===13){raw.version=14}
   if(raw.version===14){raw.version=15}
   if(raw.version===15){raw.version=16}
   if(raw.version===16){raw.version=17}
   if(raw.version===17){raw.version=18}
   if(raw.version===18){raw.version=19}
   if(raw.version===19){raw.version=20}
   if(raw.version===20){raw.version=21}
   if(raw.version===21){
     // v22 converts gem-shop consumables into permanent unlocks.
     raw.magicDiceUnlocked=!!raw.magicDiceUnlocked||(raw.magicDice||0)>0;
     raw.luckySeedUnlocked=!!raw.luckySeedUnlocked||(raw.luckySeeds||0)>0;
     raw.sunCharmUnlocked=!!raw.sunCharmUnlocked||(raw.sunCharms||0)>0;
     raw.version=22;
   }
   if(raw.version===22){raw.version=23}
   if(raw.version===23){raw.version=24}
   if(raw.version===24){
     raw.timedHarvestAt=Number(raw.timedHarvestAt)||Date.now();
     raw.version=25;
   }
   if(raw.version===25){
     raw.rosieHappiness=Number.isFinite(Number(raw.rosieHappiness))?Number(raw.rosieHappiness):50;
     raw.rosieTreats=Number(raw.rosieTreats)||0;
     raw.harvestStreak=Number(raw.harvestStreak)||0;
     raw.lastPetAt=Number(raw.lastPetAt)||0;
     raw.lastFarmVisitAt=Number(raw.lastFarmVisitAt)||0;
     raw.levelStars=raw.levelStars||{};
     raw.achievements=raw.achievements||{};
     raw.version=26;
   }
   if(raw.version===26){raw.version=27}
   if(raw.version===27){
     raw.farmRegionView=Math.max(0,Math.min(Number(raw.region)||0,4));
     raw.regionRewardsClaimed=raw.regionRewardsClaimed||{0:true};
     raw.regionRewardsClaimed[0]=true;
     raw.regionDecorations=raw.regionDecorations||{};
     raw.version=28;
   }
   if(raw.version===28){
     raw.dailyLastClaimDate=raw.dailyLastClaimDate||'';
     raw.dailyLastWinDate=raw.dailyLastWinDate||'';
     raw.dailyWinStreak=Number(raw.dailyWinStreak)||0;
     raw.dailyBestScore=Number(raw.dailyBestScore)||0;
     raw.dailyBestScoreDate=raw.dailyBestScoreDate||'';
     raw.version=29;
   }
   if(raw.version===29){
     raw.magicDiceTier2=!!raw.magicDiceTier2;
     raw.luckySeedTier2=!!raw.luckySeedTier2;
     raw.sunCharmTier2=!!raw.sunCharmTier2;
     raw.version=30;
   }
   if(raw.version===30){
     raw.collection=raw.collection||{specials:{},crops:{},regions:{0:true},powers:{},rosie:{}};
     raw.collection.specials=raw.collection.specials||{};
     raw.collection.crops=raw.collection.crops||{};
     raw.collection.regions=raw.collection.regions||{0:true};
     raw.collection.powers=raw.collection.powers||{};
     raw.collection.rosie=raw.collection.rosie||{};
     raw.version=31;
   }
   if(raw.version===31){raw.version=32}
   if(raw.version===32){
     raw.farmOrders=Array.isArray(raw.farmOrders)?raw.farmOrders:[];
     raw.farmOrderSerial=Number(raw.farmOrderSerial)||0;
     raw.inDemandDate=raw.inDemandDate||'';
     raw.inDemandCrop=raw.inDemandCrop||'';
     raw.version=33;
   }
   if(raw.version===33){
     raw.milestonesCleared=raw.milestonesCleared||{};
     raw.chapterBest=raw.chapterBest||{};
     raw.version=34;
   }
   if(raw.version===34){raw.version=35}
   if(raw.version===35){
     raw.rosieAdventure=null;raw.rosieAdventureFinds=raw.rosieAdventureFinds||{clover:0,feather:0,star:0,cache:0};raw.rosieAdventureHistory=raw.rosieAdventureHistory||{};raw.version=36;
   }
   if(raw.version===36){raw.weatherOverride='';raw.weatherOverrideUntil=0;raw.eventOverride='';raw.eventOverrideUntil=0;raw.eventProgress=raw.eventProgress||{};raw.eventClaimed=raw.eventClaimed||{};raw.version=37}
   if(raw.version===37){
     raw.farmhouseTrophies=raw.farmhouseTrophies||{};raw.farmhouseTierClaims=raw.farmhouseTierClaims||{};raw.rosieToys=raw.rosieToys||{};raw.chapterMemorabilia=raw.chapterMemorabilia||{};
     raw.lifetime=raw.lifetime||{coinsEarned:0,coinsSpent:0,gemsEarned:0,gemsSpent:0};raw._walletSnapshot={coins:Number(raw.coins)||0,gems:Number(raw.gems)||0};raw.version=38;
   }
   
   if(raw.version===38){raw.version=39}
   if(raw.version===39){
     raw.settings=raw.settings||{};
     raw.settings.sfxVolume=Number.isFinite(Number(raw.settings.sfxVolume))?Number(raw.settings.sfxVolume):.65;
     raw.settings.highContrast=!!raw.settings.highContrast;raw.settings.largeCardValues=!!raw.settings.largeCardValues;
     raw.settings.colorIndependentSuits=!!raw.settings.colorIndependentSuits;raw.settings.tutorialNotices=raw.settings.tutorialNotices!==false;
     raw.seenMechanics=raw.seenMechanics||{};raw.saveHealth=raw.saveHealth||{lastCheckAt:0,lastRepairAt:0,lastIssueCount:0};
     raw.version=40;
   }
   const d=defaults();
   return {...d,...raw,version:VERSION,
     upgrades:{...d.upgrades,...(raw.upgrades||{})},
     settings:{...d.settings,...(raw.settings||{})},
     seenMechanics:{...d.seenMechanics,...(raw.seenMechanics||{})},
     saveHealth:{...d.saveHealth,...(raw.saveHealth||{})},
     stats:{...d.stats,...(raw.stats||{})},
     levelStars:{...d.levelStars,...(raw.levelStars||{})},
     achievements:{...d.achievements,...(raw.achievements||{})},
     regionRewardsClaimed:{...d.regionRewardsClaimed,...(raw.regionRewardsClaimed||{})},
     regionDecorations:{...d.regionDecorations,...(raw.regionDecorations||{})},
     farmhouseTrophies:{...d.farmhouseTrophies,...(raw.farmhouseTrophies||{})},
     farmhouseTierClaims:{...d.farmhouseTierClaims,...(raw.farmhouseTierClaims||{})},
     rosieToys:{...d.rosieToys,...(raw.rosieToys||{})},
     chapterMemorabilia:{...d.chapterMemorabilia,...(raw.chapterMemorabilia||{})},
     lifetime:{...d.lifetime,...(raw.lifetime||{})},
     collection:{
       specials:{...d.collection.specials,...(raw.collection?.specials||{})},
       crops:{...d.collection.crops,...(raw.collection?.crops||{})},
       regions:{...d.collection.regions,...(raw.collection?.regions||{})},
       powers:{...d.collection.powers,...(raw.collection?.powers||{})},
       rosie:{...d.collection.rosie,...(raw.collection?.rosie||{})}
     },
     plots:Array.isArray(raw.plots)?raw.plots.slice(0,6).concat(Array(6).fill(null)).slice(0,6):d.plots
   };
 }
 const BACKUP_KEYS=[KEY+':backupA',KEY+':backupB',KEY+':backupC'],BACKUP_META=KEY+':backupMeta',BACKUP_INTERVAL=5*60*1000;
 function checksum(text){let h=2166136261>>>0;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return('00000000'+(h>>>0).toString(16)).slice(-8)}
 function finiteNumber(v,fallback=0){v=Number(v);return Number.isFinite(v)?v:fallback}
 function sanitize(input){
   const source=JSON.parse(JSON.stringify(input||{})),sourceVersion=Number(source.version)||0,issues=[],now=Date.now(),d=defaults();
   if(sourceVersion>=40){
     ['plots','stats','settings','collection','farmOrders','seenMechanics','saveHealth'].forEach(k=>{if(source[k]===undefined||source[k]===null)issues.push(`Missing ${k}`)});
   }
   const state=migrate(source);
   const fix=(test,label,fn)=>{if(!test){issues.push(label);fn()}};
   fix(Number.isInteger(Number(state.level))&&Number(state.level)>=1,'Invalid level',()=>state.level=Math.max(1,Math.floor(finiteNumber(state.level,1))));
   ['coins','gems','windmills','magicGates','rosieRescues','rosieTreats','harvests','bestStreak'].forEach(k=>
     fix(Number.isFinite(Number(state[k]))&&Number(state[k])>=0,`Invalid ${k}`,()=>state[k]=Math.max(0,Math.floor(finiteNumber(state[k],d[k]||0))))
   );
   fix(Number.isFinite(Number(state.rosieHappiness))&&state.rosieHappiness>=0&&state.rosieHappiness<=100,'Invalid Rosie Happiness',()=>state.rosieHappiness=Math.max(0,Math.min(100,finiteNumber(state.rosieHappiness,50))));
   fix(Number.isInteger(Number(state.region))&&state.region>=0&&state.region<5,'Invalid farm region',()=>state.region=Math.max(0,Math.min(4,Math.floor(finiteNumber(state.region,0)))));
   fix(Number.isInteger(Number(state.farmRegionView))&&state.farmRegionView>=0&&state.farmRegionView<=state.region,'Invalid farm region view',()=>state.farmRegionView=Math.max(0,Math.min(state.region,Math.floor(finiteNumber(state.farmRegionView,0)))));
   fix(Number.isFinite(Number(state.timedHarvestAt))&&state.timedHarvestAt>0&&state.timedHarvestAt<=now+300000,'Invalid timed harvest timestamp',()=>state.timedHarvestAt=now);
   if(!Array.isArray(state.plots)){issues.push('Farm plots were malformed');state.plots=Array(6).fill(null)}
   state.plots=state.plots.slice(0,6).concat(Array(6).fill(null)).slice(0,6).map((p,i)=>{
     if(!p)return null;
     if(typeof p!=='object'||!DSH.Config?.crops?.[p.type]){issues.push(`Invalid crop in plot ${i+1}`);return null}
     return{...p,age:Math.max(0,Math.floor(finiteNumber(p.age,0))),region:Math.max(0,Math.min(4,Math.floor(finiteNumber(p.region,state.region))))};
   });
   if(!Array.isArray(state.farmOrders)){issues.push('Farm Orders were malformed');state.farmOrders=[]}
   state.farmOrders=state.farmOrders.slice(0,3).filter((o,i)=>{
     if(!o||typeof o!=='object'||!DSH.Config?.farmOrders?.tiers?.[o.tier]||!o.requirements||!o.progress){issues.push(`Invalid Farm Order ${i+1}`);return false}
     const keys=Object.keys(o.requirements);if(!keys.length||keys.some(k=>!DSH.Config?.crops?.[k])){issues.push(`Farm Order ${i+1} referenced an invalid crop`);return false}
     keys.forEach(k=>{o.requirements[k]=Math.max(1,Math.floor(finiteNumber(o.requirements[k],1)));o.progress[k]=Math.max(0,Math.min(o.requirements[k],Math.floor(finiteNumber(o.progress[k],0))))});
     o.rewardCoins=Math.max(0,Math.floor(finiteNumber(o.rewardCoins,0)));return true
   });
   ['upgrades','settings','stats','levelStars','achievements','collection','regionRewardsClaimed','regionDecorations','milestonesCleared','chapterBest',
    'rosieAdventureFinds','rosieAdventureHistory','farmhouseTrophies','farmhouseTierClaims','rosieToys','chapterMemorabilia','lifetime','seenMechanics','saveHealth',
    'eventProgress','eventClaimed'].forEach(k=>{if(!state[k]||typeof state[k]!=='object'||Array.isArray(state[k])){issues.push(`Missing or invalid ${k}`);state[k]=JSON.parse(JSON.stringify(d[k]||{}))}});
   state.settings={...d.settings,...state.settings};
   state.settings.sfxVolume=Math.max(0,Math.min(1,finiteNumber(state.settings.sfxVolume,.65)));
   ['sfx','reducedMotion','highContrast','largeCardValues','colorIndependentSuits','tutorialNotices'].forEach(k=>state.settings[k]=!!state.settings[k]);
   state.upgrades={...d.upgrades,...state.upgrades};Object.keys(d.upgrades).forEach(k=>state.upgrades[k]=!!state.upgrades[k]);
   Object.keys(d.rosieAdventureFinds).forEach(k=>{const v=state.rosieAdventureFinds[k];if(!Number.isFinite(Number(v))||Number(v)<0){issues.push(`Invalid Adventure Find count: ${k}`);state.rosieAdventureFinds[k]=0}else state.rosieAdventureFinds[k]=Math.floor(Number(v))});
   Object.keys(d.lifetime).forEach(k=>{const v=state.lifetime[k];if(!Number.isFinite(Number(v))||Number(v)<0){issues.push(`Invalid lifetime counter: ${k}`);state.lifetime[k]=0}else state.lifetime[k]=Number(v)});
   for(const [k,v] of Object.entries(state.stats))if(!Number.isFinite(Number(v))||Number(v)<0){issues.push(`Invalid statistic: ${k}`);state.stats[k]=Math.max(0,finiteNumber(d.stats[k],0))}
   if(state.rosieAdventure){
     const a=state.rosieAdventure;
     if(typeof a!=='object'||!Number.isFinite(Number(a.startedAt))||!Number.isFinite(Number(a.endsAt))||a.endsAt<a.startedAt||!DSH.Config?.rosieAdventures?.durations?.some(x=>x.key===a.duration)){
       issues.push('Invalid Rosie Adventure state');state.rosieAdventure=null;
     }else{
       a.region=Math.max(0,Math.min(state.region,Math.floor(finiteNumber(a.region,0))));
       if(a.endsAt>now+7*24*60*60*1000){issues.push('Rosie Adventure timestamp was implausibly far in the future');state.rosieAdventure=null}
     }
   }
   state.version=VERSION;state.saveHealth.lastIssueCount=issues.length;
   return{state,issues,healthy:issues.length===0};
 }
 function migrateAndSanitize(raw){return sanitize(raw)}
 function rawPrimary(){return localStorage.getItem(KEY)}
 function forceBackup(){
   const current=rawPrimary();if(!current)return false;
   let meta={slots:[]};try{meta=JSON.parse(localStorage.getItem(BACKUP_META)||'{}')}catch(e){};const now=Date.now(),old=Array.isArray(meta.slots)?meta.slots:[];
   localStorage.setItem(BACKUP_KEYS[2],localStorage.getItem(BACKUP_KEYS[1])||'');
   localStorage.setItem(BACKUP_KEYS[1],localStorage.getItem(BACKUP_KEYS[0])||'');
   localStorage.setItem(BACKUP_KEYS[0],current);
   localStorage.setItem(BACKUP_META,JSON.stringify({lastAt:now,slots:[now,old[0]||0,old[1]||0]}));return true;
 }
 function maybeBackup(){
   let meta={};try{meta=JSON.parse(localStorage.getItem(BACKUP_META)||'{}')}catch(e){}
   if(Date.now()-(Number(meta.lastAt)||0)>=BACKUP_INTERVAL)forceBackup();
 }
 function backupInfo(){
   let meta={slots:[]};try{meta=JSON.parse(localStorage.getItem(BACKUP_META)||'{}')}catch(e){}
   return BACKUP_KEYS.map((k,i)=>{const raw=localStorage.getItem(k),at=meta.slots?.[i]||0;if(!raw)return{slot:i+1,exists:false,at};try{const x=JSON.parse(raw);return{slot:i+1,exists:true,version:x.version||x.state?.version||'?',level:x.level||x.state?.level||'?',bytes:raw.length,at}}catch(e){return{slot:i+1,exists:true,invalid:true,bytes:raw.length,at}}})
 }
 function restoreBackup(slot=1){
   const raw=localStorage.getItem(BACKUP_KEYS[Math.max(0,Math.min(2,slot-1))]);if(!raw)throw new Error('Backup slot is empty');
   const parsed=JSON.parse(raw),candidate=parsed.state||parsed;const checked=migrateAndSanitize(candidate);
   localStorage.setItem(KEY,JSON.stringify(checked.state));return checked.state;
 }
 function load(){
   const primary=rawPrimary();
   if(primary){try{return migrateAndSanitize(JSON.parse(primary)).state}catch(e){}}
   for(let i=0;i<BACKUP_KEYS.length;i++){const raw=localStorage.getItem(BACKUP_KEYS[i]);if(!raw)continue;try{const st=migrateAndSanitize(JSON.parse(raw).state||JSON.parse(raw)).state;st._recoveredFromBackup=i+1;return st}catch(e){}}
   return defaults();
 }
 function save(state,opts={}){
   state.version=VERSION;state.lifetime=state.lifetime||{coinsEarned:0,coinsSpent:0,gemsEarned:0,gemsSpent:0};
   const snap=state._walletSnapshot;
   if(snap){
     const dc=(Number(state.coins)||0)-(Number(snap.coins)||0),dg=(Number(state.gems)||0)-(Number(snap.gems)||0);
     if(dc>0)state.lifetime.coinsEarned+=dc;else if(dc<0)state.lifetime.coinsSpent+=-dc;
     if(dg>0)state.lifetime.gemsEarned+=dg;else if(dg<0)state.lifetime.gemsSpent+=-dg;
   }
   state._walletSnapshot={coins:Number(state.coins)||0,gems:Number(state.gems)||0};
   if(!opts.skipBackup)maybeBackup();
   localStorage.setItem(KEY,JSON.stringify(state));
 }
 function reset(){localStorage.removeItem(KEY);BACKUP_KEYS.forEach(k=>localStorage.removeItem(k));localStorage.removeItem(BACKUP_META);return defaults()}
 function wrap(state){
   const clean=JSON.parse(JSON.stringify(state)),payload=JSON.stringify(clean);
   return{app:'DenisesSolitaireHarvest',format:'DSH_SAVE',version:VERSION,exportedAt:new Date().toISOString(),
     summary:{level:state.level,coins:state.coins,gems:state.gems,rosieHappiness:state.rosieHappiness,trophies:Object.values(state.farmhouseTrophies||{}).filter(Boolean).length},
     checksum:checksum(payload),state:clean};
 }
 function inspect(text){
   const p=typeof text==='string'?JSON.parse(text):text,raw=p.state||p,payload=JSON.stringify(raw);
   const checksumValid=!p.checksum||p.checksum===checksum(payload),checked=migrateAndSanitize(raw);
   return{...checked,checksumPresent:!!p.checksum,checksumValid,sourceVersion:p.version||raw.version||0,summary:{level:checked.state.level,coins:checked.state.coins,gems:checked.state.gems,rosieHappiness:checked.state.rosieHappiness,trophies:Object.values(checked.state.farmhouseTrophies||{}).filter(Boolean).length}};
 }
 function parse(text){const r=inspect(text);if(!r.checksumValid)throw new Error('Checksum mismatch');return r.state}
 function doctor(state){return sanitize(state)}
 return{KEY,VERSION,defaults,migrate,load,save,reset,wrap,parse,inspect,doctor,checksum,forceBackup,backupInfo,restoreBackup,rawPrimary};
})();