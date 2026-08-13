window.DSH=window.DSH||{};
document.addEventListener('DOMContentLoaded',()=>{
 const ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],suits=['♣','♦','♥','♠'];
 let state=DSH.Save.load(),game={},history=[],lastExposed=new Set(),locked=false,handStarted=false,handComplete=false,devUnlocked=false,devTrophyChecksPaused=false,mechanicNoticeQueue=[],mechanicNoticeActive=false,completionFailureCount=0,normalHandSeed=0,normalHandSeedLevel=0;
 DSH.Audio.bindState(state);DSH.Farm.bind(state,commit,msg,showRewardToast);

 function shuffle(a,rng=Math.random){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
 function deck(rng=Math.random){let d=[];for(let s=0;s<4;s++)for(let r=0;r<13;r++)d.push({r,s,wild:false});return shuffle(d,rng)}
 function chapterForLevel(level){
   const chapters=DSH.Config.chapters,idx=Math.floor((Math.max(1,level)-1)/10);
   if(idx<chapters.length)return{...chapters[idx],index:idx};
   const start=idx*10+1;return{start,end:start+9,name:`Endless Harvest ${idx-chapters.length+1}`,icon:'🌾',tone:'#79945a',index:idx};
 }
 function milestoneInfo(level){const n=DSH.Config.milestones.interval,m=Math.ceil(Math.max(1,level)/n)*n;return{level:m,isMilestone:level%n===0}}
 function milestoneName(level){
   const ch=chapterForLevel(level),names={10:'Meadow Gate',20:'Sunflower Festival',30:'Rosie Creek Crossing',40:'Golden Orchard Fair',50:'Harvest Ridge Summit',60:'Autumn Moon',70:'Moonlit Barn',80:'Winter Garden Finale',90:'Spring Jubilee',100:'Centennial Harvest'};
   return names[level]||`${ch.name} Milestone`;
 }
 function renderChapterProgress(){
   const ch=chapterForLevel(state.level),pos=state.level-ch.start+1,total=10,m=milestoneInfo(state.level);
   setTextIfPresent('chapterIcon',ch.icon);setTextIfPresent('chapterName',ch.name);setTextIfPresent('chapterLevelText',`Level ${state.level} • ${Math.min(total,pos)}/${total}`);
   setTextIfPresent('nextMilestoneText',m.isMilestone?`🏆 Milestone ${state.level}`:`Next: ${m.level}`);
   const bar=document.getElementById('chapterProgressBar');if(bar){bar.style.width=`${Math.max(0,Math.min(100,(pos-1)/total*100))}%`;bar.style.background=`linear-gradient(90deg,${ch.tone},#e3b742)`}
 }
 function localDateKey(d=new Date()){
   const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
   return `${y}-${m}-${day}`;
 }
 function dateSerial(key){const [y,m,d]=key.split('-').map(Number);return Math.floor(Date.UTC(y,m-1,d)/86400000)}
 function hashString(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
 function mulberry32(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
 function dailyDescriptor(){
   const key=localDateKey(),seed=hashString('DeniseHarvestDaily:'+key),C=DSH.Config.dailyChallenge;
   const level=C.minLevel+(seed%C.levelRange),power=['windmill','gate','rescue'][seed%3];
   const date=new Date();const label=date.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
   return{key,seed,level,power,label};
 }
 function dailyPowerLabel(power){return power==='windmill'?'1 Windmill 🌬️':power==='gate'?'1 Magic Gate 🚪':"1 Rosie Rescue 🐾"}

 function playable(card){return card?.wild||game.waste?.wild||Math.abs(card.r-game.waste.r)===1||Math.abs(card.r-game.waste.r)===12}
 function blocked(c){if(c?.bonusUnlocked)return false;const blockers=Array.isArray(c?.blockers)?c.blockers:(Array.isArray(c?.coveredBy)?c.coveredBy:[]);return blockers.some(id=>{const b=game.layout?.find(x=>x.id===id);return b&&!b.removed})}
 function exposed(){return game.layout.filter(c=>!c.removed&&!blocked(c))}
 function tableauCleared(){return Array.isArray(game.layout)&&game.layout.length>0&&game.layout.every(c=>c.removed)}
 function finishIfCleared(source=''){
   if(!handStarted||handComplete||game.completing||!tableauCleared())return false;
   const stateBackup=JSON.stringify(state),gameBackup=JSON.stringify(game),rawBackup=DSH.Save.rawPrimary?.()??null;
   game.completing=true;
   try{win();completionFailureCount=0;return true}
   catch(err){
     console.error('Completion flow failed',source,err);
     state=JSON.parse(stateBackup);game=JSON.parse(gameBackup);game.completing=false;handComplete=false;handStarted=true;
     DSH.Audio.bindState(state);DSH.Farm.bind(state,commit,msg,showRewardToast);
     try{if(rawBackup===null)localStorage.removeItem(DSH.Save.KEY);else localStorage.setItem(DSH.Save.KEY,rawBackup)}catch(e){}
     completionFailureCount++;
     if(completionFailureCount<=1){
       msg('The field is clear. Retrying completion once…');
       setTimeout(()=>finishIfCleared('retry'),60);
     }else{
       completionFailureCount=0;handStarted=false;handComplete=false;locked=false;game={};history=[];lastExposed=new Set();
       document.getElementById('app').classList.add('menu-mode');close('winOverlay');close('pauseOverlay');renderAllBalances();open('mainMenuOverlay');
       showRewardToast('Completion Recovered','The reward screen hit an error, so the level was safely rolled back instead of duplicating rewards. Your saved progress is intact.','🛠️');
     }
     return true;
   }
 }
 function specialProgress(c){
   const req=c.specialRequires||[];
   return req.reduce((n,id)=>{const x=game.layout.find(v=>v.id===id);return n+(x&&x.removed?1:0)},0);
 }
 function specialLocked(c){
   if(!c?.special)return false;
   const req=c.specialRequires||[];
   if(c.special==='vine')return req.length?specialProgress(c)<1:false;
   if(c.special==='crate')return req.length?specialProgress(c)<Math.min(2,req.length):false;
   if(c.special==='chain'){
     const need=DSH.Config.specialCards.chainRequiredStreak;
     if(game.chainUnlocked||(game.streak||0)>=need)return false;
     // Safety release: a Chain should be a streak challenge, never a permanent
     // deadlock. If no OTHER exposed, non-Chain card can currently be acted on,
     // the Chain becomes available so the hand can continue.
     const route=game.layout.some(x=>x.id!==c.id&&!x.removed&&!blocked(x)&&x.special!=='chain'&&!specialLocked(x));
     return route;
   }
   if(c.special==='barnlock')return (c.specialRequires||[]).some(id=>{const k=game.layout.find(x=>x.id===id);return k&&!k.removed});
   if(c.special==='sleeping')return (game.cardsClearedThisHand||0)<DSH.Config.specialCards.sleepingClears;
   return false;
 }
 function specialLockMessage(c){
   if(c.special==='vine')return '🌿 Vines: clear a nearby card before playing this one.';
   if(c.special==='crate')return `📦 Crate: clear ${Math.max(0,2-specialProgress(c))} more nearby card${Math.max(0,2-specialProgress(c))===1?'':'s'} first.`;
   if(c.special==='chain')return `⛓️ Chain: build a ${DSH.Config.specialCards.chainRequiredStreak}-card streak before playing this card.`;
   if(c.special==='barnlock')return '🔒 Barn Lock: find and clear its matching 🔑 Key first.';
   if(c.special==='sleeping')return `🌙 Sleeping Card: clear ${Math.max(0,DSH.Config.specialCards.sleepingClears-(game.cardsClearedThisHand||0))} more card(s) to wake it.`;
   return 'That special card is still locked.';
 }
 function snapshot(){
   history.push(JSON.stringify({game,state:{
     bestStreak:state.bestStreak,stats:state.stats,windmills:state.windmills,coins:state.coins,gems:state.gems,
     magicGates:state.magicGates,rosieRescues:state.rosieRescues,rosieHappiness:state.rosieHappiness,
     lifetime:state.lifetime,_walletSnapshot:state._walletSnapshot,
     farmhouseTrophies:state.farmhouseTrophies,farmhouseTierClaims:state.farmhouseTierClaims,
     farmhouseTrophyRewardsClaimed:state.farmhouseTrophyRewardsClaimed,farmhouseTierRewardsClaimed:state.farmhouseTierRewardsClaimed
   }}));
   if(history.length>15)history.shift();
 }
 function commit(){
   DSH.Save.save(state);renderAllBalances();
   if(handStarted&&game.layout)render();
   else DSH.Farm.render();
 }

 function assignWilds(layout,level,rng=Math.random){
   const chance=Math.min(.025+level*.0015,.055);let assigned=0;
   const eligible=layout.filter(c=>!c.special);
   eligible.forEach(c=>{if(rng()<chance&&assigned<2){c.card={r:null,s:null,wild:true};assigned++}});
   if(level>=3&&assigned===0&&eligible.length&&rng()<.20)eligible[Math.floor(rng()*eligible.length)].card={r:null,s:null,wild:true};
 }
 function prepareSpecialCards(layout){
   layout.forEach(c=>{if(c.special==='rainbow')c.card={r:null,s:null,wild:true}});
 }
 function breakHarvestChain(){game.harvestChainGroup=null;game.harvestChainCount=0}
 function handleHarvestChain(c){
   if(c.special!=='harvestchain'){breakHarvestChain();return}
   if(game.harvestChainGroup===c.chainGroup)game.harvestChainCount=(game.harvestChainCount||0)+1;
   else{game.harvestChainGroup=c.chainGroup;game.harvestChainCount=1}
   const n=game.harvestChainCount,S=DSH.Config.specialCards;
   if(n===2){state.coins+=S.harvestChain2Coins;state.stats.harvestChainCoins=(state.stats.harvestChainCoins||0)+S.harvestChain2Coins;showRewardToast('Harvest Chain!',`2 linked cards • +${S.harvestChain2Coins} coins`,'🌾')}
   if(n>=3){state.coins+=S.harvestChain3Coins;state.stats.harvestChainCoins=(state.stats.harvestChainCoins||0)+S.harvestChain3Coins;state.stats.harvestChainsCompleted=(state.stats.harvestChainsCompleted||0)+1;game.streak++;if(game.streak>=DSH.Config.specialCards.chainRequiredStreak)game.chainUnlocked=true;showRewardToast('Full Harvest Chain!',`3 linked cards • +${S.harvestChain3Coins} coins • +1 streak`,'🌾')}
 }
 function waterExposedCard(){
   const candidates=exposed().filter(x=>!x.removed&&!x.special&&!x.card?.wild);
   if(!candidates.length)return false;const t=candidates[Math.floor(Math.random()*candidates.length)];t.card={r:null,s:null,wild:true};return true;
 }
 function buzzBee(){
   const bees=exposed().filter(x=>x.special==='bee');if(!bees.length)return false;
   const bee=bees[Math.floor(Math.random()*bees.length)],others=exposed().filter(x=>x.id!==bee.id&&!x.special);
   if(!others.length)return false;const target=others[Math.floor(Math.random()*others.length)];
   // Nodes are structural tableau slots: their blocker relationships belong to
   // the position, not the card. Swap the card contents + Bee marker instead of
   // moving node coordinates, otherwise a later reveal can appear underneath
   // the wrong visible card.
   const beeCard=bee.card;bee.card=target.card;target.card=beeCard;
   delete bee.special;target.special='bee';
   state.stats.beeBuzzes=(state.stats.beeBuzzes||0)+1;return true;
 }
 function blockerAncestorCountForCard(card,seen=new Set()){
   for(const id of card?.blockers||[]){
     if(seen.has(id))continue;seen.add(id);
     blockerAncestorCountForCard(game.layout?.find(c=>c.id===id),seen);
   }
   return seen.size;
 }
 function showLevelPreview(built){
   const e=document.getElementById('levelPreview');if(!e)return;
   setTextIfPresent('levelPreviewTitle',game.dailyMode?`Daily Challenge • ${built.name}`:`Level ${state.level} • ${built.name}`);
   setTextIfPresent('levelPreviewTags',built.specialLabels?.length?built.specialLabels.join(' • '):'Classic field');
   const stockNote=(built.obstacleStockBonus||0)+(game.dailyMode?(DSH.Config.dailyChallenge.extraStock||0):0);
   setTextIfPresent('levelPreviewStock',stockNote?`${game.dailyMode?'Daily cushion + obstacle compensation':'Obstacle compensation'}: +${stockNote} stock draw${stockNote===1?'':'s'}`:'');
   e.classList.remove('show');void e.offsetWidth;e.classList.add('show');clearTimeout(showLevelPreview.t);
   showLevelPreview.t=setTimeout(()=>e.classList.remove('show'),2600);
 }
 function applySpecialClear(c,grantRewards=true){
   if(!c?.special)return;
   state.stats.specialCardsCleared=(state.stats.specialCardsCleared||0)+1;
   const S=DSH.Config.specialCards;
   if(c.special==='flower'){
     state.stats.flowersCleared=(state.stats.flowersCleared||0)+1;
     if(grantRewards){for(let i=0;i<S.flowerBonusDraws;i++)game.stock.push(makeBonusCard());showRewardToast('Flower Card!',`+${S.flowerBonusDraws} draw 🌼`,'🌼')}
   }else if(c.special==='gold'){
     state.stats.goldenCardsCleared=(state.stats.goldenCardsCleared||0)+1;
     if(grantRewards){
       if(game.dailyMode){game.score+=250;showRewardToast('Daily Golden Card!','+250 challenge score','💰')}
       else{
         const coins=S.goldBaseCoins+state.level*S.goldPerLevelCoins;let gems=0;
         state.coins+=coins;if(Math.random()<S.goldGemChance){state.gems++;gems=1;state.stats.goldenGems=(state.stats.goldenGems||0)+1}
         showRewardToast('Golden Card!',`+${coins} coins${gems?' • +1 💎':''}`,'💰');
       }
     }
   }else if(c.special==='key'){
     state.stats.keysCleared=(state.stats.keysCleared||0)+1;
     if(grantRewards)showRewardToast('Barn Key!','Matching Barn Lock unlocked.','🔑');
   }else if(c.special==='barnlock'){
     state.stats.barnLocksCleared=(state.stats.barnLocksCleared||0)+1;
   }else if(c.special==='watering'){
     state.stats.wateringCansCleared=(state.stats.wateringCansCleared||0)+1;
     if(grantRewards){const changed=waterExposedCard();showRewardToast('Watering Can!',changed?'An exposed card bloomed into a Wild!':'No ordinary exposed card needed watering.','💧')}
   }else if(c.special==='bee'){
     state.stats.beeCardsCleared=(state.stats.beeCardsCleared||0)+1;
   }else if(c.special==='harvestchain'){
     // Consecutive-chain reward is handled by normal card play so assisted clears cannot trigger it.
   }else if(c.special==='heavy'){
     state.stats.heavyCardsCleared=(state.stats.heavyCardsCleared||0)+1;
   }else if(c.special==='sleeping'){
     state.stats.sleepingCardsCleared=(state.stats.sleepingCardsCleared||0)+1;
   }else if(c.special==='sunflower'){
     state.stats.sunflowerCardsCleared=(state.stats.sunflowerCardsCleared||0)+1;
     if(grantRewards){const hidden=game.layout.filter(x=>!x.removed&&blocked(x));if(hidden.length){hidden[Math.floor(Math.random()*hidden.length)].bonusUnlocked=true;showRewardToast('Sunflower!','A hidden field card opened to the sun.','🌻')}}
   }else if(c.special==='rainbow'){
     state.stats.rainbowCardsCleared=(state.stats.rainbowCardsCleared||0)+1;
     if(grantRewards){
       for(let i=0;i<S.rainbowBonusDraws;i++)game.stock.push(makeBonusCard());
       if(game.dailyMode){game.score+=300;showRewardToast('Daily Rainbow Card!',`+300 score • +${S.rainbowBonusDraws} draw`,'🌈')}
       else{state.coins+=S.rainbowCoins;showRewardToast('Rainbow Card!',`+${S.rainbowCoins} coins • +${S.rainbowBonusDraws} draw`,'🌈')}
     }
   }
 }
 function chargeShearsFromClear(){
   const C=DSH.Config.shears;
   if((game.shearsGenerated||0)>=C.maxCharges)return;
   game.shearsMeter=(game.shearsMeter||0)+1;
   if(game.shearsMeter>=C.cardsPerCharge){
     game.shearsMeter=0;game.shearsCharges=(game.shearsCharges||0)+1;game.shearsGenerated=(game.shearsGenerated||0)+1;
     state.stats.shearsEarned=(state.stats.shearsEarned||0)+1;
     showRewardToast('Garden Shears Charged!',`✂️ ${game.shearsCharges} ready • ${C.maxCharges-game.shearsGenerated} more can be earned`,'✂️');
   }
 }
 const MISSION_DEFS=[
   {id:'streak',icon:'🔥',name:'Streak Farmer',minLevel:1,desc:t=>`Build a ${t}-card streak.`,target:l=>Math.min(8,4+Math.floor(l/12)),progress:m=>Math.min(game.levelBestStreak||0,m.target),done:m=>(game.levelBestStreak||0)>=m.target},
   {id:'stock',icon:'🃏',name:'Stock Saver',minLevel:1,desc:t=>`Finish with at least ${t} draw cards left.`,target:l=>Math.min(6,3+Math.floor(l/18)),progress:m=>Math.min(game.stock.length,m.target),done:m=>game.stock.length>=m.target},
   {id:'noPower',icon:'💪',name:'No Help Needed',minLevel:3,desc:()=>`Win without using a Magic Pouch power.`,target:()=>1,progress:m=>(game.powersUsed||0)===0?1:0,done:m=>(game.powersUsed||0)===0,failEarly:m=>(game.powersUsed||0)>0},
   {id:'noBuy',icon:'🪙',name:'Frugal Farmer',minLevel:4,desc:()=>`Win without buying extra draws.`,target:()=>1,progress:m=>(game.drawPacksBought||0)===0?1:0,done:m=>(game.drawPacksBought||0)===0,failEarly:m=>(game.drawPacksBought||0)>0},
   {id:'natural',icon:'🌿',name:'Natural Harvest',minLevel:5,desc:()=>`Clear the field without Shears, Windmills, Gates, Rosie, Dice, Seed or Sun Charm.`,target:()=>1,progress:m=>(game.powersUsed||0)===0?1:0,done:m=>(game.powersUsed||0)===0,failEarly:m=>(game.powersUsed||0)>0},
   {id:'run3',icon:'🌾',name:"Rosie's Route",minLevel:1,desc:t=>`Make ${t} separate 3-card streaks.`,target:l=>Math.min(4,2+Math.floor(l/20)),progress:m=>Math.min(game.missionMetrics?.runs3||0,m.target),done:m=>(game.missionMetrics?.runs3||0)>=m.target},
   {id:'specials',icon:'✨',name:'Treasure Hunter',minLevel:8,requires:b=>(b.obstacleCount||0)>0,desc:t=>`Clear ${t} special card${t===1?'':'s'} by ordinary card play.`,target:(l,b)=>Math.min(3,Math.max(1,b.obstacleCount||1)),progress:m=>Math.min(game.missionMetrics?.naturalSpecials||0,m.target),done:m=>(game.missionMetrics?.naturalSpecials||0)>=m.target},
   {id:'efficient',icon:'🎯',name:'Clean Sweep',minLevel:6,desc:t=>`Clear the last ${t} field cards without drawing.`,target:l=>Math.min(5,3+Math.floor(l/25)),progress:m=>Math.min(game.missionMetrics?.endRun||0,m.target),done:m=>(game.missionMetrics?.endRun||0)>=m.target}
 ];
 function buildMissionChoices(level,built,rng=Math.random){
   let pool=MISSION_DEFS.filter(d=>level>=d.minLevel&&(!d.requires||d.requires(built)));
   // Avoid redundant "no powers" missions appearing together.
   shuffle(pool,rng);const out=[];
   for(const d of pool){
     if(out.length>=3)break;
     if((d.id==='noPower'||d.id==='natural')&&out.some(x=>x.id==='noPower'||x.id==='natural'))continue;
     const target=d.target(level,built),base=DSH.Config.missions.coinBase+level*DSH.Config.missions.coinPerLevel;
     out.push({id:d.id,icon:d.icon,name:d.name,target,desc:d.desc(target),rewardCoins:Math.round(base*(1+(out.length*.08)))});
   }
   while(out.length<3){const d=MISSION_DEFS[out.length],target=d.target(level,built);out.push({id:d.id,icon:d.icon,name:d.name,target,desc:d.desc(target),rewardCoins:DSH.Config.missions.coinBase+level*DSH.Config.missions.coinPerLevel})}
   return out;
 }
 function missionDef(id){return MISSION_DEFS.find(x=>x.id===id)}
 function missionProgressText(){
   const m=game.mission;if(!m)return'No mission selected';
   if(game.missionFailed)return'FAILED';
   const d=missionDef(m.id),p=d?d.progress(m):0;
   if(['noPower','noBuy','natural'].includes(m.id))return p?'Still on track':'FAILED';
   return `${Math.min(p,m.target)}/${m.target}`;
 }
 function renderMissionChip(){
   const chip=document.getElementById('missionChip');if(!chip)return;
   if(game.dailyMode||!game.mission){chip.classList.remove('show','failed','complete');return}
   chip.classList.add('show');chip.classList.toggle('failed',!!game.missionFailed);chip.classList.toggle('complete',!!game.missionCompleted);
   setTextIfPresent('missionChipTitle',`${game.mission.icon} ${game.mission.name}`);
   setTextIfPresent('missionChipProgress',game.missionFailed?'FAILED ✕':game.missionCompleted?'COMPLETE ✓':missionProgressText());
 }
 function missionRequiresWin(id){return ['stock','noPower','noBuy','natural'].includes(id)}
 function updateMission(){
   if(!game.mission||game.dailyMode||game.missionFailed)return;
   const d=missionDef(game.mission.id),wasComplete=!!game.missionCompleted;
   if(d?.failEarly?.(game.mission)){game.missionFailed=true;game.missionCompleted=false;renderMissionChip();showRewardToast('Mission Failed',`${game.mission.name} — the requirement was broken.`,'📋');return}
   // Some missions describe a condition that must STILL be true when the hand is won.
   // Their raw predicate is naturally true at the start of a level, so do not call
   // them complete merely because the first move caused a mission-state refresh.
   const terminalReady=!missionRequiresWin(game.mission.id)||tableauCleared();
   const done=terminalReady&&!!d?.done(game.mission);game.missionCompleted=done;
   if(done&&!wasComplete)showRewardToast('Mission Complete!',`${game.mission.name} accomplished — finish the level to collect.`,'📋');
   renderMissionChip();
 }
 function showMissionBoard(){
   if(!handStarted||handComplete||game.dailyMode||game.missionChosen||document.getElementById('app').classList.contains('menu-mode'))return;
   const box=document.getElementById('missionChoices');if(!box)return;
   box.innerHTML=game.missionChoices.map((m,i)=>`<button class="missionChoice" data-mission-index="${i}"><span>${m.icon}</span><div><b>${m.name}</b><small>${m.desc}</small><strong>Reward: ${m.rewardCoins} coins + bonus chance</strong></div></button>`).join('');
   box.querySelectorAll('[data-mission-index]').forEach(b=>b.onclick=()=>chooseMission(Number(b.dataset.missionIndex)));
   open('missionOverlay');
 }
 function isChallengeOfferLevel(){return !game.dailyMode&&state.level>=40&&state.level%7===0}
 function applyChallengeMutators(){
   game.challengeHand=true;
   game.stock.splice(0,Math.min(2,Math.max(0,game.stock.length-18)));
   const normal=game.layout.filter(c=>!c.special),heavy=normal[0]||null;
   if(heavy)heavy.special='heavy';
   const need=DSH.Config.specialCards.sleepingClears,requiredIds=new Set(game.layout.flatMap(c=>c.specialRequires||[]));
   const sleep=normal.filter(c=>c!==heavy&&!requiredIds.has(c.id)&&blockerAncestorCountForCard(c)>=need)[0]||null;
   if(sleep)sleep.special='sleeping';
   [heavy,sleep].filter(Boolean).forEach(c=>state.collection.specials[c.special]=true);
   game.obstacleLevel=game.obstacleLevel||!!heavy||!!sleep;
 }
 function maybeOfferChallenge(){
   if(!isChallengeOfferLevel()||!handStarted||handComplete||!game.missionChosen||game.challengeDecisionMade||game.challengeOfferOpen)return;
   if(mechanicNoticeActive||mechanicNoticeQueue.length)return;
   game.challengeOfferOpen=true;setTimeout(()=>{if(handStarted&&!handComplete&&game.challengeOfferOpen&&!mechanicNoticeActive)document.getElementById('challengeOfferOverlay').classList.add('show')},90);
 }
 function chooseMission(index){
   const m=game.missionChoices[index];if(!m)return;
   game.mission={...m};game.missionChosen=true;game.missionFailed=false;game.missionCompleted=false;
   state.stats.missionsChosen=(state.stats.missionsChosen||0)+1;DSH.Save.save(state);close('missionOverlay');renderMissionChip();
   msg(`📋 Mission chosen: ${m.name}. ${m.desc}`);setTimeout(()=>{collectMechanicNotices();maybeOfferChallenge()},120);
 }
 function skipMission(){game.mission=null;game.missionChosen=true;close('missionOverlay');renderMissionChip();msg('No mission this level — just clear the field.');setTimeout(()=>{collectMechanicNotices();maybeOfferChallenge()},120)}
 function missionReward(){
   const m=game.mission;if(!m)return null;
   const d=missionDef(m.id),success=!game.missionFailed&&!!d?.done(m);
   if(!success){state.stats.missionsFailed=(state.stats.missionsFailed||0)+1;return{success:false,name:m.name}}
   let coins=m.rewardCoins,gems=0,power='';
   state.coins+=coins;state.stats.missionsCompleted=(state.stats.missionsCompleted||0)+1;state.stats.missionCoinsEarned=(state.stats.missionCoinsEarned||0)+coins;
   if(Math.random()<DSH.Config.missions.gemChance){state.gems++;gems=1;state.stats.missionGemsEarned=(state.stats.missionGemsEarned||0)+1}
   if(Math.random()<DSH.Config.missions.powerChance){
     const roll=Math.floor(Math.random()*3);
     if(roll===0){state.windmills++;state.stats.windmillsFound=(state.stats.windmillsFound||0)+1;power='Windmill 🌬️'}
     else if(roll===1){state.magicGates++;state.stats.magicGatesFound=(state.stats.magicGatesFound||0)+1;power='Magic Gate 🚪'}
     else{state.rosieRescues++;state.stats.rosieRescuesFound=(state.stats.rosieRescuesFound||0)+1;power='Rosie Rescue 🐾'}
     state.stats.missionPowersEarned=(state.stats.missionPowersEarned||0)+1;
   }
   return{success:true,name:m.name,coins,gems,power};
 }
 function startLevelUnsafe(restarting=false){
   document.getElementById('nextBtn').textContent='Next Level';
   setTextIfPresent('levelNum',state.level);setTextIfPresent('formationName','Preparing field…');setTextIfPresent('stockCount','—');
   document.getElementById('app').classList.remove('menu-mode');
   const sameRetry=!!restarting&&normalHandSeedLevel===state.level&&normalHandSeed!==0;
   if(!sameRetry){normalHandSeed=((Date.now()&0xffffffff)^Math.floor(Math.random()*0xffffffff)^Math.imul(state.level,2654435761))>>>0;if(!normalHandSeed)normalHandSeed=1;normalHandSeedLevel=state.level}
   const rng=mulberry32(normalHandSeed);
   const previousMissionChosen=sameRetry&&game&&!game.dailyMode&&game.missionLevel===state.level?!!game.missionChosen:false;
   const previousMission=(previousMissionChosen&&game.mission)?{...game.mission}:null;
   const previousChoices=(sameRetry&&game.missionChoices&&game.missionLevel===state.level)?game.missionChoices.map(x=>({...x})):null;
   const previousChallengeDecision=sameRetry?!!game.challengeDecisionMade:false,previousChallengeHand=sameRetry?!!game.challengeHand:false;
   const previousFeather=sameRetry?!!game.featherActive:false,previousWeatherFx=sameRetry&&game.handWeatherFx?game.handWeatherFx:null;
   const d=deck(rng),built=DSH.Levels.buildSafe?DSH.Levels.buildSafe(state.level,rng):DSH.Levels.build(state.level,rng);
   const featherActive=sameRetry?previousFeather:(state.rosieAdventureFinds?.feather||0)>0;
   if(featherActive){built.stockTarget=Math.min(46,built.stockTarget+3);setTimeout(()=>msg('🪶 Curious Feather: +3 stock cards active on this hand!'),250)}
   const weatherFx=previousWeatherFx||DSH.Weather.effects(state);built.stockTarget=Math.min(DSH.Config.difficulty.weatherCeiling,built.stockTarget+(weatherFx.extraStock||0));
   const ordinary=built.cards.filter(c=>!c.special);if(weatherFx.goldBonus&&ordinary.length&&rng()<weatherFx.goldBonus)ordinary[0].special='gold';if(weatherFx.wateringBonus&&ordinary[1]&&rng()<weatherFx.wateringBonus)ordinary[1].special='watering';if(weatherFx.rainbowBonus&&ordinary[2]&&rng()<weatherFx.rainbowBonus)ordinary[2].special='rainbow';if(weatherFx.storm&&ordinary[3]&&rng()<.35)ordinary[3].special='mud';
   built.cards.forEach(c=>c.card=d.pop());assignWilds(built.cards,state.level,rng);prepareSpecialCards(built.cards);
   state.collection=state.collection||{specials:{},crops:{},regions:{0:true},powers:{},rosie:{}};
   built.cards.forEach(c=>{if(c.special)state.collection.specials[c.special]=true});
   const waste=d.pop();
   const desired=built.stockTarget||DSH.Levels.stockTarget(state.level,built.cards.length);
   let stock=d.slice(-Math.min(desired,d.length));
   // If a large formation consumed too much of one deck, top up from a fresh shuffled deck.
   if(stock.length<desired){const extra=deck(rng);while(stock.length<desired&&extra.length)stock.unshift(extra.pop())}
   // Always consume the mission-choice RNG stream, even on restart where the
   // previously chosen choices are retained. This keeps every later random
   // outcome (Lucky Hand bonus cards, etc.) identical on a restart.
   const generatedMissionChoices=buildMissionChoices(state.level,built,rng);
   game={layout:built.cards,formation:built.name,stock,waste,streak:0,levelBestStreak:0,chainUnlocked:false,score:0,moves:0,awardedMilestones:[],
     diceUsed:false,diceMode:false,diceRoll:0,seedUsed:false,seedUses:0,seedMode:false,sunUsed:false,
     gateMode:false,shearsMode:false,shearsCharges:built.obstacleCount?DSH.Config.shears.startOnObstacleLevel:0,shearsMeter:0,shearsGenerated:built.obstacleCount?DSH.Config.shears.startOnObstacleLevel:0,
     powersUsed:0,drawPacksBought:0,obstacleLevel:built.obstacleCount>0,obstacleStockBonus:built.obstacleStockBonus||0,milestone:!!built.milestone,
     reserve:null,reserveUsed:false,reserveEverUsed:false,cardsClearedThisHand:0,challengeDecisionMade:previousChallengeDecision,challengeOfferOpen:false,luckyHand:rng()<DSH.Config.specialCards.luckyHandChance,challengeHand:false,previewChoiceUsed:false,
     previewChoiceOpen:false,handWeatherFx:weatherFx,dailyMode:false,mission:previousMission,missionChoices:previousChoices||generatedMissionChoices,missionChosen:previousMissionChosen,missionFailed:false,missionCompleted:false,missionLevel:state.level,featherActive,
     missionMetrics:{runs3:0,naturalSpecials:0,endRun:0,lastRemaining:built.cards.length}};
   if(game.luckyHand){for(let i=0;i<3;i++)game.stock.push(makeBonusCard(rng));const normal=game.layout.filter(c=>!c.special);if(normal.length)normal[Math.floor(rng()*normal.length)].card={r:null,s:null,wild:true}}
   if(previousChallengeHand)applyChallengeMutators();
   if(featherActive&&!sameRetry)state.rosieAdventureFinds.feather--;
   history=[];lastExposed=new Set(exposed().map(c=>c.id));locked=false;handStarted=true;handComplete=false;completionFailureCount=0;DSH.Save.save(state);
   close('winOverlay');close('mainMenuOverlay');render();showLevelPreview(built);if(built.recovered)showRewardToast('Field Recovered',`Level ${state.level} used a safe fallback layout because the generated board failed validation.`,'🛠️');
   if(built.milestone)showRewardToast(`🏆 Level ${state.level} Milestone`,`${milestoneName(state.level)} • Bonus stock + boosted clear reward`,'🏆');
   else if(game.luckyHand)showRewardToast('✨ LUCKY HAND!','+3 stock cards and a bonus Wild are hiding in this hand.','🌟');
   if(previousMissionChosen){
     msg(previousMission?`📋 Mission retry: ${previousMission.name}. Same mission — no rerolling after choosing.`:'📋 Mission retry: you skipped the Mission Board on this hand.');
     renderMissionChip();setTimeout(maybeOfferChallenge,120)
   }else{msg('Choose one optional mission before the level begins.');setTimeout(showMissionBoard,180)}
 }
 function recoverStartFailure(kind,err){
   console.error(`${kind} start failed`,err);handStarted=false;handComplete=false;locked=false;completionFailureCount=0;game={};history=[];lastExposed=new Set();mechanicNoticeQueue=[];mechanicNoticeActive=false;
   document.getElementById('previewChoiceOverlay').classList.remove('show');document.getElementById('challengeOfferOverlay').classList.remove('show');
   document.getElementById('app').classList.add('menu-mode');document.querySelectorAll('.sectionOverlay').forEach(x=>x.classList.remove('open'));close('pauseOverlay');close('winOverlay');close('missionOverlay');close('mechanicNoticeOverlay');
   renderAllBalances();open('mainMenuOverlay');showRewardToast('Field Load Recovered',`${kind} could not start, so you were returned safely to the Main Menu. Your saved progress was preserved.`,'🛠️');
 }
 function startLevel(restarting=false){
   const stateBackup=JSON.stringify(state),rawBackup=DSH.Save.rawPrimary?.()??null;
   try{return startLevelUnsafe(restarting)}
   catch(err){
     state=JSON.parse(stateBackup);DSH.Audio.bindState(state);DSH.Farm.bind(state,commit,msg,showRewardToast);
     try{if(rawBackup===null)localStorage.removeItem(DSH.Save.KEY);else localStorage.setItem(DSH.Save.KEY,rawBackup)}catch(e){}
     recoverStartFailure(`Level ${state.level}`,err);return false
   }
 }
 function renderDailyUI(){
   const d=dailyDescriptor(),claimed=state.dailyLastClaimDate===d.key,C=DSH.Config.dailyChallenge;
   setTextIfPresent('dailyDate',d.label);
   setTextIfPresent('dailyDifficulty',`Challenge difficulty ${d.level} • fixed seeded board`);
   setTextIfPresent('dailyWinStreak',state.dailyWinStreak||0);
   setTextIfPresent('dailyBestScore',(state.dailyBestScore||0).toLocaleString());
   setTextIfPresent('dailyReward',`Reward: ${C.coins} coins • ${C.gems} 💎 • ${dailyPowerLabel(d.power)}${C.perfectGem?` • Perfect +${C.perfectGem} 💎`:''}`);
   setTextIfPresent('dailyStatus',claimed?'Completed today ✓ — replay for score':'Daily reward available');
   setTextIfPresent('dailyMenuStatus',claimed?'Completed today ✓ • Replay for score':`Today's board • ${C.gems} 💎 + farm reward`);
   const btn=document.getElementById('dailyPlayBtn');if(btn)btn.textContent=(game.dailyMode&&game.dailyKey===d.key&&handStarted&&!handComplete)?'Resume Daily Challenge':(claimed?'Replay Today’s Challenge':'Play Today’s Challenge');
   const card=document.getElementById('dailyStatusCard');if(card)card.classList.toggle('claimed',claimed);
 }
 function startDailyChallengeUnsafe(){
   const desc=dailyDescriptor(),C=DSH.Config.dailyChallenge,rng=mulberry32(desc.seed);
   document.getElementById('app').classList.remove('menu-mode');close('mainMenuOverlay');close('dailyOverlay');close('winOverlay');
   const built=DSH.Levels.buildSafe?DSH.Levels.buildSafe(desc.level,rng):DSH.Levels.build(desc.level,rng),d=deck(rng);
   built.cards.forEach(c=>c.card=d.pop());assignWilds(built.cards,desc.level,rng);prepareSpecialCards(built.cards);
   state.collection=state.collection||{specials:{},crops:{},regions:{0:true},powers:{},rosie:{}};
   built.cards.forEach(c=>{if(c.special)state.collection.specials[c.special]=true});
   const waste=d.pop(),desired=Math.min(41,(built.stockTarget||DSH.Levels.stockTarget(desc.level,built.cards.length))+C.extraStock);
   let stock=d.slice(-Math.min(desired,d.length));
   if(stock.length<desired){const extra=deck(rng);while(stock.length<desired&&extra.length)stock.unshift(extra.pop())}
   game={layout:built.cards,formation:built.name,stock,waste,streak:0,levelBestStreak:0,chainUnlocked:false,score:0,moves:0,awardedMilestones:[],
     diceUsed:false,diceMode:false,diceRoll:0,seedUsed:false,seedUses:0,seedMode:false,sunUsed:false,
     gateMode:false,shearsMode:false,shearsCharges:built.obstacleCount?DSH.Config.shears.startOnObstacleLevel:0,shearsMeter:0,shearsGenerated:built.obstacleCount?DSH.Config.shears.startOnObstacleLevel:0,
     powersUsed:0,drawPacksBought:0,obstacleLevel:built.obstacleCount>0,obstacleStockBonus:built.obstacleStockBonus||0,
     previewChoiceOpen:false,challengeDecisionMade:true,challengeOfferOpen:false,dailyMode:true,dailyKey:desc.key,dailySeed:desc.seed,dailyChallengeLevel:desc.level,dailyRewardPower:desc.power};
   history=[];lastExposed=new Set(exposed().map(c=>c.id));locked=false;handStarted=true;handComplete=false;completionFailureCount=0;
   state.stats.dailyChallengesStarted=(state.stats.dailyChallengesStarted||0)+1;DSH.Save.save(state);
   render();showLevelPreview(built);if(built.recovered)showRewardToast('Daily Field Recovered','Today’s generated field failed validation, so a safe deterministic fallback was used.','🛠️');msg('📅 Daily Challenge: this board stays the same all day. Clear it to claim today’s reward.');setTimeout(collectMechanicNotices,350);
 }
 function startDailyChallenge(){
   const stateBackup=JSON.stringify(state),rawBackup=DSH.Save.rawPrimary?.()??null;
   try{return startDailyChallengeUnsafe()}
   catch(err){
     state=JSON.parse(stateBackup);DSH.Audio.bindState(state);DSH.Farm.bind(state,commit,msg,showRewardToast);
     try{if(rawBackup===null)localStorage.removeItem(DSH.Save.KEY);else localStorage.setItem(DSH.Save.KEY,rawBackup)}catch(e){}
     recoverStartFailure('Daily Challenge',err);return false
   }
 }
 function ensureDaily(){
   const d=dailyDescriptor();
   if(game.dailyMode&&game.dailyKey===d.key&&handStarted&&!handComplete){
     document.getElementById('app').classList.remove('menu-mode');close('mainMenuOverlay');close('dailyOverlay');render();return;
   }
   startDailyChallenge();
 }
 function restartCurrent(){close('pauseOverlay');if(game.dailyMode)startDailyChallenge();else startLevel(true)}
 function grantDailyPower(power){
   if(power==='windmill'){state.windmills++;state.stats.windmillsFound=(state.stats.windmillsFound||0)+1;return'1 Windmill 🌬️'}
   if(power==='gate'){state.magicGates=(state.magicGates||0)+1;state.stats.magicGatesFound=(state.stats.magicGatesFound||0)+1;return'1 Magic Gate 🚪'}
   state.rosieRescues=(state.rosieRescues||0)+1;state.stats.rosieRescuesFound=(state.stats.rosieRescuesFound||0)+1;return"1 Rosie Rescue 🐾";
 }
 function winDaily(){
   const C=DSH.Config.dailyChallenge,perfect=(game.drawPacksBought||0)===0&&(game.powersUsed||0)===0,levelStreak=game.levelBestStreak||0;
   let stars=1;if(perfect||levelStreak>=DSH.Config.scoring.threeStarStreak)stars=2;if(perfect&&levelStreak>=DSH.Config.scoring.threeStarStreak)stars=3;
   state.stats.dailyChallengesCompleted=(state.stats.dailyChallengesCompleted||0)+1;
   if(perfect)state.stats.dailyPerfectClears=(state.stats.dailyPerfectClears||0)+1;
   if(game.score>(state.dailyBestScore||0)){state.dailyBestScore=game.score;state.dailyBestScoreDate=game.dailyKey}
   const firstClaim=state.dailyLastClaimDate!==game.dailyKey;
   let coins=0,gems=0,powerText='',streakBonus='';
   if(firstClaim){
     // Shooting Star is intentionally reserved for the next NORMAL Solitaire clear.
     // Daily Challenge must never consume it.
     coins=C.coins;gems=C.gems+(perfect?C.perfectGem:0);
     state.coins+=coins;state.gems+=gems;
     powerText=grantDailyPower(game.dailyRewardPower);
     const gap=state.dailyLastWinDate?dateSerial(game.dailyKey)-dateSerial(state.dailyLastWinDate):999;
     state.dailyWinStreak=gap===1?(state.dailyWinStreak||0)+1:1;
     state.dailyLastWinDate=game.dailyKey;state.dailyLastClaimDate=game.dailyKey;
     state.stats.dailyRewardsClaimed=(state.stats.dailyRewardsClaimed||0)+1;
     state.stats.dailyCoinsEarned=(state.stats.dailyCoinsEarned||0)+coins;state.stats.dailyGemsEarned=(state.stats.dailyGemsEarned||0)+gems;
     state.stats.dailyBestWinStreak=Math.max(state.stats.dailyBestWinStreak||0,state.dailyWinStreak||0);
     if(state.dailyWinStreak%C.weeklyStreakEvery===0){
       state.gems+=C.weeklyBonusGems;state.rosieTreats=(state.rosieTreats||0)+C.weeklyBonusTreats;
       state.stats.dailyGemsEarned=(state.stats.dailyGemsEarned||0)+C.weeklyBonusGems;
       state.stats.treatsFound=(state.stats.treatsFound||0)+C.weeklyBonusTreats;
       gems+=C.weeklyBonusGems;streakBonus=` • ${C.weeklyStreakEvery}-day streak: +${C.weeklyBonusGems} 💎 +${C.weeklyBonusTreats} 🦴`;
     }
     DSH.Progress.addHappiness(state,2);
   }
   handComplete=true;handStarted=false;game.completing=false;DSH.Audio.play.win();
   DSH.Save.save(state);renderAllBalances();renderDailyUI();renderStats();
   setTextIfPresent('rewardCoins',coins);setTextIfPresent('rewardGems',gems);
   setTextIfPresent('winStars','★'.repeat(stars)+'☆'.repeat(3-stars));
   document.getElementById('perfectClearBadge').classList.toggle('show',perfect);
   setTextIfPresent('winText',`Daily score ${game.score.toLocaleString()} • Best streak ${levelStreak}`);
   setTextIfPresent('winBonusText',firstClaim?`Daily reward claimed • ${powerText}${perfect?` • Perfect +${C.perfectGem} 💎`:''}${streakBonus}`:'Today’s reward was already claimed — this replay only updates your best score.');
   document.getElementById('nextBtn').textContent='Main Menu';
   showRewardToast(firstClaim?'Daily Challenge Complete!':'Daily Replay Complete',firstClaim?`${coins} coins • ${gems} 💎 • ${powerText}`:`Score ${game.score.toLocaleString()}`,'📅');
   open('winOverlay');
 }
 function ensureHand(){
   document.getElementById('app').classList.remove('menu-mode');close('mainMenuOverlay');
   if(game.dailyMode||!handStarted||handComplete||!game.layout)startLevel();else render();
 }

 function play(id){
   if(locked)return;const c=game.layout.find(x=>x.id===id);if(!c||c.removed||blocked(c))return;
   if(game.shearsMode){useShearsOnCard(c);return}
   if(game.gateMode){useGateOnCard(c);return}
   if(game.diceMode){useDiceOnCard(c);return}
   if(game.seedMode){useSeedOnCard(c);return}
   if(specialLocked(c)){DSH.Audio.play.bad();shakeCard(id);msg(specialLockMessage(c));return}
   if(!playable(c.card)){
     DSH.Audio.play.bad();shakeCard(id);
     if(game.waste?.wild)msg('🌈 The active Wild accepts any exposed card.');
     else{
       const lo=(game.waste.r+12)%13,hi=(game.waste.r+1)%13;
       msg(`Need ${ranks[lo]} or ${ranks[hi]} — ${ranks[c.card.r]} cannot play on ${ranks[game.waste.r]}.`);
     }
     return
   }
   if(c.special==='heavy'&&(c.heavyHits||0)<1){snapshot();c.heavyHits=1;game.streak=0;breakHarvestChain();game.moves++;DSH.Audio.play.crack();render(true);msg('🪨 Heavy Card cracked! Match it once more to clear it.');return}
   snapshot();locked=true;
   animateCardToWaste(id,()=>{
     c.removed=true;game.waste=c.card;game.streak++;if(game.streak>=DSH.Config.specialCards.chainRequiredStreak)game.chainUnlocked=true;game.moves++;
     game.score+=100*(1+Math.floor(game.streak/4))+game.streak*15;
     state.bestStreak=Math.max(state.bestStreak,game.streak);game.levelBestStreak=Math.max(game.levelBestStreak||0,game.streak);state.stats.cardsCleared++;game.cardsClearedThisHand=(game.cardsClearedThisHand||0)+1;
     if(c.card.wild){state.stats.wildsPlayed++;DSH.Audio.play.wild()}else{DSH.Audio.play.card();if(game.streak>=3)DSH.Audio.play.streak(Math.min(game.streak,9))}
     if(game.missionMetrics){
       if(game.streak===3)game.missionMetrics.runs3=(game.missionMetrics.runs3||0)+1;
       if(c.special)game.missionMetrics.naturalSpecials=(game.missionMetrics.naturalSpecials||0)+1;
       const remainingCount=game.layout.filter(x=>!x.removed).length;
       if(remainingCount<=(game.mission?.id==='efficient'?game.mission.target:5))game.missionMetrics.endRun=(game.missionMetrics.endRun||0)+1;
     }
     handleHarvestChain(c);applySpecialClear(c,true);chargeShearsFromClear();awardStreakMilestone();updateMission();
     DSH.Save.save(state);locked=false;
     const remaining=game.layout.some(x=>!x.removed);render(true);
     if(!remaining)finishIfCleared('normal-play');else if(game.streak>=3)msg(`${game.streak}-card streak!`);
   });
 }
 function awardStreakMilestone(){
   if(game.streak<5||game.streak%5!==0)return;
   if(game.awardedMilestones.includes(game.streak))return;
   game.awardedMilestones.push(game.streak);
   const S=DSH.Config.streak,phase=game.streak%20||20,tier=Math.ceil(game.streak/5);
   state.stats.streakBonuses=(state.stats.streakBonuses||0)+1;
   let text='';
   if(phase===S.phases.coin){
     let reward=S.coinBase*tier;if(state.upgrades.barn)reward=Math.round(reward*1.1);
     if(game.dailyMode){const scoreReward=reward*10;game.score+=scoreReward;text=`+${scoreReward} challenge score`}
     else{state.coins+=reward;state.stats.streakCoins=(state.stats.streakCoins||0)+reward;game.score+=reward*10;text=`+${reward} coins`}
   }else if(phase===S.phases.draw){
     game.stock.push(makeBonusCard());state.stats.streakBonusDraws=(state.stats.streakBonusDraws||0)+1;
     text='+1 bonus draw';
   }else if(phase===S.phases.reveal){
     const hidden=game.layout.filter(c=>!c.removed&&blocked(c));
     if(hidden.length){const pick=hidden[Math.floor(Math.random()*hidden.length)];pick.bonusUnlocked=true;text='One hidden card uncovered!'}
     else{game.stock.push(makeBonusCard());state.stats.streakBonusDraws=(state.stats.streakBonusDraws||0)+1;text='No hidden cards — +1 draw instead!'}
   }else{
     game.waste={r:null,s:null,wild:true};text='Active card became WILD!';
   }
   if(!game.dailyMode&&game.streak%DSH.Config.streak.happinessEvery===0){
     const happy=DSH.Progress.addHappiness(state,1);if(happy)text+=` • Rosie +${happy} ❤️`;
   }
   DSH.Audio.play.bonus(tier);showBonus(text,tier);
 }
 function showBonus(text,tier){
   const e=document.getElementById('bonusToast');document.getElementById('bonusToastText').textContent=text;
   e.classList.remove('show');void e.offsetWidth;e.classList.add('show');
   if(!state.settings.reducedMotion){
     const layer=document.getElementById('particleLayer');
     for(let i=0;i<12;i++){const c=document.createElement('span');c.className='bonusCoin';c.style.left=(45+Math.random()*10)+'%';c.style.top=(43+Math.random()*8)+'%';c.style.setProperty('--bx',((Math.random()-.5)*260)+'px');c.style.setProperty('--by',(-40-Math.random()*170)+'px');layer.appendChild(c);setTimeout(()=>c.remove(),1000)}
   }
 }
 function stockDepthForCount(n){
   if(n<=0)return 0;if(n===1)return 1;if(n<=4)return 2;if(n<=8)return 3;if(n<=14)return 4;return 5;
 }
 function animateStockDraw(done){
   if(state.settings.reducedMotion){done();return}
   const stock=document.querySelector('#stockWrap .stockCard'),waste=document.getElementById('waste');
   if(!stock||!waste){done();return}
   const a=stock.getBoundingClientRect(),b=waste.getBoundingClientRect(),ghost=document.createElement('div');
   ghost.className='stockDrawGhost';
   ghost.style.left=a.left+'px';ghost.style.top=a.top+'px';ghost.style.width=a.width+'px';ghost.style.height=a.height+'px';
   ghost.style.setProperty('--draw-x',(b.left+b.width/2-(a.left+a.width/2))+'px');
   ghost.style.setProperty('--draw-y',(b.top+b.height/2-(a.top+a.height/2))+'px');
   (document.getElementById('app')||document.body).appendChild(ghost);
   requestAnimationFrame(()=>ghost.classList.add('fly'));
   setTimeout(()=>{ghost.remove();done()},260);
 }
 function draw(){
   if(locked||handComplete)return;
   if(game.previewChoiceOpen){msg('Choose one of the two preview cards first.');return}
   if(finishIfCleared('draw'))return;
   if(!game.stock.length){render();DSH.Audio.play.bad();msg('No cards remain in the draw pile.');return}
   if(!game.previewChoiceUsed&&game.stock.length>=2&&Math.random()<DSH.Config.specialCards.previewChoiceChance){showPreviewChoice();return}
   snapshot();locked=true;DSH.Audio.play.draw();
   animateStockDraw(()=>{
     game.waste=game.stock.pop();game.streak=0;breakHarvestChain();game.moves++;if(game.missionMetrics)game.missionMetrics.endRun=0;
     const buzzed=buzzBee();updateMission();if(buzzed)DSH.Save.save(state);locked=false;render(true);
     msg(buzzed?'🐝 A Bee buzzed to a new field position!':'New active card.');
   });
 }
 function cardLabel(card){return card.wild?'🌈 WILD':`${ranks[card.r]}${suits[card.s]}`}
 function showPreviewChoice(){
   if(game.previewChoiceOpen||game.stock.length<2)return;
   const a=game.stock[game.stock.length-1],b=game.stock[game.stock.length-2],o=document.getElementById('previewChoiceOverlay');
   game.previewChoiceOpen=true;
   document.getElementById('previewChoiceA').textContent=cardLabel(a);document.getElementById('previewChoiceB').textContent=cardLabel(b);o.classList.add('show');
   document.getElementById('previewChoiceA').onclick=()=>choosePreview(0);document.getElementById('previewChoiceB').onclick=()=>choosePreview(1);
 }
 function choosePreview(which){
   if(!game.previewChoiceOpen||game.stock.length<2){game.previewChoiceOpen=false;document.getElementById('previewChoiceOverlay').classList.remove('show');return}
   snapshot();game.previewChoiceOpen=false;document.getElementById('previewChoiceOverlay').classList.remove('show');locked=true;DSH.Audio.play.draw();
   animateStockDraw(()=>{
     const top=game.stock.pop(),second=game.stock.pop(),chosen=which?second:top,other=which?top:second;
     game.stock.unshift(other);game.waste=chosen;game.previewChoiceUsed=true;state.stats.previewChoicesUsed=(state.stats.previewChoicesUsed||0)+1;
     game.streak=0;breakHarvestChain();game.moves++;if(game.missionMetrics)game.missionMetrics.endRun=0;updateMission();DSH.Save.save(state);
     locked=false;render(true);msg('🔮 Preview choice used — the other card returned deeper into the stock.');
   });
 }
 function useReserve(){
   if(locked||!handStarted||game.dailyMode||game.previewChoiceOpen)return;if(game.reserveUsed){msg('The Reserve Slot has already been spent this level.');return}
   if(!game.reserve&&!game.stock.length){msg('You need at least one stock card before parking the active card in Reserve.');return}
   snapshot();
   if(!game.reserve){
     game.reserve=game.waste;game.waste=game.stock.pop();game.reserveEverUsed=true;state.stats.reserveUses=(state.stats.reserveUses||0)+1;game.streak=0;breakHarvestChain();if(game.missionMetrics)game.missionMetrics.endRun=0;updateMission();DSH.Save.save(state);render();msg('🧠 Active card parked in Reserve. Tap Reserve later to swap it back in.');return;
   }
   const old=game.waste;game.waste=game.reserve;game.reserve=old;game.reserveUsed=true;game.reserveEverUsed=true;game.streak=0;breakHarvestChain();DSH.Save.save(state);render();msg('🧠 Reserve swap complete — your saved card is active.');
 }
 function undo(){
   if(locked||game.previewChoiceOpen)return;if(!history.length){msg('Nothing to undo.');return}
   const s=JSON.parse(history.pop());game=s.game;
   ['bestStreak','stats','windmills','coins','gems','magicGates','rosieRescues','rosieHappiness','lifetime','_walletSnapshot',
    'farmhouseTrophies','farmhouseTierClaims','farmhouseTrophyRewardsClaimed','farmhouseTierRewardsClaimed'].forEach(k=>{if(s.state[k]!==undefined)state[k]=s.state[k]});
   DSH.Save.save(state,{skipBackup:true});render();
   if(game.previewChoiceOpen){
     // Choosing a Preview card is undoable. Restore the prompt as well as the
     // stock state; otherwise Draw would be blocked by an invisible pending choice.
     game.previewChoiceOpen=false;showPreviewChoice();
   }
   msg('Move undone.');
 }
 function makeBonusCard(rng=Math.random){
   const suits=[0,1,2,3];
   return {r:Math.floor(rng()*13),s:suits[Math.floor(rng()*4)],wild:false};
 }
 function buyDraws(){
   if(locked)return;const D=DSH.Config.draws;game.drawPacksBought=game.drawPacksBought||0;
   if(game.drawPacksBought>=D.maxPacks){DSH.Audio.play.bad();msg(`You have used all ${D.maxPacks} draw packs for this level.`);return}
   const price=drawPackPrice();if(state.coins<price){DSH.Audio.play.bad();msg(`You need ${price} coins to buy ${D.cards} extra draws.`);return}
   setPouch(false);state.coins-=price;game.drawPacksBought++;state.stats.drawPacksBought=(state.stats.drawPacksBought||0)+1;updateMission();
   for(let i=0;i<D.cards;i++)game.stock.push(makeBonusCard());
   history=[];DSH.Save.save(state);render();DSH.Audio.play.harvest();
   const left=D.maxPacks-game.drawPacksBought,next=left?` Next pack costs ${drawPackPrice()} coins.`:'';
   msg(`Bought ${D.cards} extra draws for ${price} coins. ${left} pack${left===1?'':'s'} left.${next}`);
 }
 function toggleShearsMode(){
   if(locked)return;
   if((game.shearsCharges||0)<=0){
     if((game.shearsGenerated||0)>=DSH.Config.shears.maxCharges){msg('✂️ Both Garden Shears charges for this match have already been used.');return}
     const left=Math.max(0,DSH.Config.shears.cardsPerCharge-(game.shearsMeter||0));
     msg(`✂️ Garden Shears are not charged. Clear ${left} more tableau card${left===1?'':'s'} to earn a charge.`);
     return;
   }
   setPouch(false);
   game.shearsMode=!game.shearsMode;game.gateMode=false;game.diceMode=false;game.seedMode=false;
   render();msg(game.shearsMode?'✂️ Garden Shears ready — cut away any exposed card. This counts as an assist.':'Garden Shears cancelled.');
 }
 function useShearsOnCard(c){
   if(!game.shearsMode||!c||c.removed||blocked(c))return false;
   snapshot();game.shearsCharges--;game.shearsMode=false;game.streak=0;breakHarvestChain();game.moves++;
   game.powersUsed=(game.powersUsed||0)+1;state.stats.powersUsed=(state.stats.powersUsed||0)+1;updateMission();state.stats.shearsUsed=(state.stats.shearsUsed||0)+1;
   c.removed=true;state.stats.cardsCleared++;game.cardsClearedThisHand=(game.cardsClearedThisHand||0)+1;applySpecialClear(c,true);game.score+=70;updateMission();
   DSH.Audio.play.flip();DSH.Save.save(state);render(true);
   msg(`✂️ Garden Shears cut away that card without changing the active card. ${game.shearsCharges} charge${game.shearsCharges===1?'':'s'} remain.`);
   finishIfCleared('shears');return true;
 }

 function toggleGateMode(){
   if(locked)return;
   if((state.magicGates||0)<=0){DSH.Audio.play.bad();msg('No Magic Gates available. Harvest crops after buying the Cozy Fence to find them.');return}
   setPouch(false);
   game.gateMode=!game.gateMode;game.diceMode=false;game.seedMode=false;game.shearsMode=false;
   render();
   msg(game.gateMode?'Magic Gate ready — tap one exposed card to send it behind the fence.':'Magic Gate cancelled.');
 }
 function useGateOnCard(c){
   if(!game.gateMode||!c||c.removed||blocked(c))return false;
   snapshot();game.streak=0;breakHarvestChain();
   state.magicGates--;
   state.stats.magicGatesUsed=(state.stats.magicGatesUsed||0)+1;game.powersUsed=(game.powersUsed||0)+1;state.stats.powersUsed=(state.stats.powersUsed||0)+1;updateMission();
   c.removed=true;
   // A gated card goes to the bottom of stock, preserving its rank/suit. Its
   // tableau special effect is forfeited because the card was moved, not cleared.
   // A gated Key still unlocks its Barn Lock because its tableau node is removed.
   // A gated card goes to the bottom of stock, preserving its identity.
   game.stock.unshift({...c.card});
   game.gateMode=false;updateMission();
   DSH.Save.save(state);
   DSH.Audio.play.flip();
   render(true);
   msg('Magic Gate! That card was moved to the bottom of the draw pile without changing the active card.');
   finishIfCleared('gate');
   return true;
 }

 function rescueRankDistance(a,b){const d=Math.abs(a-b);return Math.min(d,13-d)}
 function helpfulWasteRank(cards){
   let best=[],bestScore=-1;
   for(let r=0;r<13;r++){
     let score=0;
     cards.forEach(c=>{if(!c.card?.wild&&rescueRankDistance(c.card.r,r)===1)score++});
     if(score>bestScore){bestScore=score;best=[r]}else if(score===bestScore)best.push(r);
   }
   return best.length?best[Math.floor(Math.random()*best.length)]:Math.floor(Math.random()*13);
 }
 function findRosieNudge(cards){
   if(!game.waste||game.waste.wild)return null;
   const w=game.waste.r;
   for(const dir of [1,-1]){
     const adjacent=(w+dir+13)%13,next=(w+2*dir+26)%13;
     const same=cards.filter(c=>!c.card.wild&&!c.special&&c.card.r===adjacent);
     if(same.length>=2)return{card:same[Math.floor(Math.random()*same.length)],rank:next,dir};
   }
   return null;
 }
 function showRosiePawTrail(){
   if(state.settings.reducedMotion)return;const f=document.getElementById('field');if(!f)return;
   for(let i=0;i<5;i++){const p=document.createElement('span');p.className='rosiePawTrail';p.textContent='🐾';p.style.left=(8+i*18)+'%';p.style.top=(72-i*11)+'%';p.style.animationDelay=(i*.07)+'s';f.appendChild(p);setTimeout(()=>p.remove(),900+i*70)}
 }
 function useRosieRescue(){
   if(locked)return;
   if((state.rosieRescues||0)<=0){DSH.Audio.play.bad();msg("Rosie doesn't have a Rescue ready.");return}
   const allExposed=exposed(),usable=allExposed.filter(c=>!specialLocked(c)),playableNow=usable.filter(c=>playable(c.card));
   if(!allExposed.length){DSH.Audio.play.bad();msg("Rosie can't find an exposed card to help with.");return}
   setPouch(false);snapshot();showRosiePawTrail();DSH.Audio.play.rescue();

   // v39: Rosie understands the new tableau mechanics instead of blindly deleting them.
   const mechanicHelp=allExposed.find(c=>c.special==='sleeping'&&specialLocked(c))||allExposed.find(c=>c.special==='heavy'&&(c.heavyHits||0)<1);
   if(mechanicHelp){
     if(mechanicHelp.special==='sleeping')game.cardsClearedThisHand=Math.max(game.cardsClearedThisHand||0,DSH.Config.specialCards.sleepingClears);
     else mechanicHelp.heavyHits=1;
     state.rosieRescues--;state.stats.rosieRescuesUsed=(state.stats.rosieRescuesUsed||0)+1;game.powersUsed=(game.powersUsed||0)+1;state.stats.powersUsed=(state.stats.powersUsed||0)+1;updateMission();
     DSH.Save.save(state);render(true);showRewardToast('Rosie Rescue!',mechanicHelp.special==='sleeping'?'Rosie woke the Sleeping Card!':'Rosie cracked the Heavy Card!','🐾');return;
   }

   const consume=()=>{
     state.rosieRescues--;
     state.stats.rosieRescuesUsed=(state.stats.rosieRescuesUsed||0)+1;
     game.powersUsed=(game.powersUsed||0)+1;state.stats.powersUsed=(state.stats.powersUsed||0)+1;updateMission();
   };

   // Best-case tactical assist: if two identical playable cards are showing,
   // nudge one another rank in the same direction so the player can make a tiny run.
   const nudge=findRosieNudge(usable);
   if(nudge&&Math.random()<DSH.Config.rosieRescue.nudgeChance){
     const before=nudge.card.card.r;nudge.card.card={...nudge.card.card,r:nudge.rank};
     consume();state.stats.rosieRescueNudges=(state.stats.rosieRescueNudges||0)+1;
     DSH.Save.save(state);DSH.Audio.play.flip();render(true);
     msg(`🐾 Rosie nudged one ${ranks[before]} into a ${ranks[nudge.rank]} so you can build a little run!`);
     showRewardToast('Rosie Rescue!',`${ranks[before]} → ${ranks[nudge.rank]} • Rosie spotted a streak route`,'🐾');
     return;
   }

   // If there is no stock left and the tableau is genuinely stuck, Rosie simply
   // clears one or two exposed cards. This can also break obstacle deadlocks.
   if(game.stock.length===0&&playableNow.length===0){
     const shuffled=[...allExposed].sort(()=>Math.random()-.5);
     const qty=Math.min(shuffled.length,Math.random()<DSH.Config.rosieRescue.clearTwoChance?2:1);
     const targets=shuffled.slice(0,qty);
     targets.forEach(c=>{c.removed=true;applySpecialClear(c,true);state.stats.cardsCleared++;game.cardsClearedThisHand=(game.cardsClearedThisHand||0)+1;game.score+=80});
     consume();game.streak=0;breakHarvestChain();
     state.stats.rosieRescueClears=(state.stats.rosieRescueClears||0)+1;
     state.stats.rosieRescueCardsCleared=(state.stats.rosieRescueCardsCleared||0)+qty;
     DSH.Save.save(state);DSH.Audio.play.flip();render(true);
     msg(`🐾 Rosie cleared ${qty} stubborn field card${qty===1?'':'s'} for you!`);
     showRewardToast('Rosie to the Rescue!',`Cleared ${qty} field card${qty===1?'':'s'}`,'🐕');
     finishIfCleared('rosie-clear');
     return;
   }

   // If the current active card cannot play anything, Rosie can conjure a useful
   // active card even when that card never existed in the stock.
   if(playableNow.length===0&&usable.length){
     const rank=helpfulWasteRank(usable);
     game.waste={r:rank,s:Math.floor(Math.random()*4),wild:false,rosieMagic:true};
     game.streak=0;breakHarvestChain();consume();state.stats.rosieRescueSwaps=(state.stats.rosieRescueSwaps||0)+1;
     DSH.Save.save(state);DSH.Audio.play.flip();render();
     const count=usable.filter(c=>playable(c.card)).length;
     msg(`🐾 Rosie magically swapped in a ${ranks[rank]} that opens ${count} field option${count===1?'':'s'}!`);
     showRewardToast('Rosie Magic!',`Active card became ${ranks[rank]} • ${count} play${count===1?'':'s'} available`,'🐾');
     return;
   }

   // Otherwise Rosie still helps proactively: alter another normal exposed card so
   // it will follow one of the currently playable cards.
   if(playableNow.length){
     const lead=playableNow[Math.floor(Math.random()*playableNow.length)];
     const candidates=usable.filter(c=>c.id!==lead.id&&!c.card.wild&&!c.special);
     if(candidates.length){
       const c=candidates[Math.floor(Math.random()*candidates.length)],dir=Math.random()<.5?1:-1;
       const target=(lead.card.r+dir+13)%13,before=c.card.r;c.card={...c.card,r:target};
       consume();state.stats.rosieRescueNudges=(state.stats.rosieRescueNudges||0)+1;
       DSH.Save.save(state);DSH.Audio.play.flip();render(true);
       msg(`🐾 Rosie adjusted a ${ranks[before]} into a ${ranks[target]} to give your next play somewhere to go.`);
       showRewardToast('Rosie Rescue!',`A future card was nudged into position`,'🐾');
       return;
     }
   }

   // Last-resort direct clear if every exposed card is special/locked.
   const target=allExposed[Math.floor(Math.random()*allExposed.length)];
   target.removed=true;applySpecialClear(target,true);state.stats.cardsCleared++;game.cardsClearedThisHand=(game.cardsClearedThisHand||0)+1;game.score+=80;game.streak=0;breakHarvestChain();
   consume();state.stats.rosieRescueClears=(state.stats.rosieRescueClears||0)+1;state.stats.rosieRescueCardsCleared=(state.stats.rosieRescueCardsCleared||0)+1;
   DSH.Save.save(state);DSH.Audio.play.flip();render(true);msg('🐾 Rosie cleared a troublesome card that had nowhere else to go.');
   finishIfCleared('rosie-last-resort');
 }

 function buyShopItem(kind){
   const defs={
     dice:{cost:18,key:'magicDiceUnlocked',name:'Magic Dice'},
     seed:{cost:24,key:'luckySeedUnlocked',name:'Lucky Seed'},
     sun:{cost:20,key:'sunCharmUnlocked',name:'Sun Charm'}
   };
   const d=defs[kind];if(!d)return;
   if(state[d.key]){msg(`${d.name} is already permanently unlocked.`);return}
   if(state.gems<d.cost){DSH.Audio.play.bad();msg(`You need ${d.cost} gems to permanently unlock ${d.name}.`);return}
   state.gems-=d.cost;state[d.key]=true;DSH.Save.save(state);renderAllBalances();renderShop();renderPouch();
   msg(`✨ ${d.name} permanently unlocked! It can now be used once every match.`);
 }
 function buyTier2(kind){
   const T=DSH.Config.rewardShopTier2;
   const defs={
     dice:{base:'magicDiceUnlocked',key:'magicDiceTier2',name:T.dice.name,cost:T.dice.cost},
     seed:{base:'luckySeedUnlocked',key:'luckySeedTier2',name:T.seed.name,cost:T.seed.cost},
     sun:{base:'sunCharmUnlocked',key:'sunCharmTier2',name:T.sun.name,cost:T.sun.cost}
   };
   const d=defs[kind];if(!d)return;
   if(!state[d.base]){DSH.Audio.play.bad();msg(`Unlock the base power before buying ${d.name}.`);return}
   if(state[d.key]){msg(`${d.name} is already permanently owned.`);return}
   if(state.gems<d.cost){DSH.Audio.play.bad();msg(`You need ${d.cost} gems for ${d.name}.`);return}
   state.gems-=d.cost;state[d.key]=true;state.stats.tier2UpgradesOwned=(state.stats.tier2UpgradesOwned||0)+1;
   DSH.Save.save(state);renderAllBalances();renderShop();renderPouch();
   showRewardToast('Tier II Unlocked!',`${d.name} is now permanent.`,'✨');
   msg(`✨ ${d.name} permanently upgraded.`);
 }
 function renderShop(){
   setTextIfPresent('shopGems',state.gems);
   setTextIfPresent('shopDiceOwned',state.magicDiceUnlocked?'Unlocked ✓':'Locked');
   setTextIfPresent('shopSeedOwned',state.luckySeedUnlocked?'Unlocked ✓':'Locked');
   setTextIfPresent('shopSunOwned',state.sunCharmUnlocked?'Unlocked ✓':'Locked');
   const defs={dice:'magicDiceUnlocked',seed:'luckySeedUnlocked',sun:'sunCharmUnlocked'};
   document.querySelectorAll('[data-shop]').forEach(b=>{
     const unlocked=!!state[defs[b.dataset.shop]];
     b.disabled=unlocked;b.textContent=unlocked?'Owned':'Buy';
   });

   const tiers={
     dice:{base:'magicDiceUnlocked',key:'magicDiceTier2',status:'shopDiceTier2'},
     seed:{base:'luckySeedUnlocked',key:'luckySeedTier2',status:'shopSeedTier2'},
     sun:{base:'sunCharmUnlocked',key:'sunCharmTier2',status:'shopSunTier2'}
   };
   Object.entries(tiers).forEach(([kind,d])=>{
     setTextIfPresent(d.status,state[d.key]?'Upgraded ✓':state[d.base]?'Available':'Requires base power');
     const b=document.querySelector(`[data-shop-tier2="${kind}"]`);
     if(b){b.disabled=!state[d.base]||!!state[d.key];b.textContent=state[d.key]?'Owned':state[d.base]?'Upgrade':'Locked'}
   });
 }
 function toggleDice(){
   if(locked)return;
   if(game.diceUsed){msg('Magic Dice can only be used once per match.');return}
   if(!state.magicDiceUnlocked){msg('Permanently unlock Magic Dice in the Rewards Shop with gems.');return}
   setPouch(false);game.seedMode=false;game.gateMode=false;game.shearsMode=false;
   // Once rolled, the result is committed until the Dice is actually used.
   // Closing targeting or opening another power must not allow free rerolls.
   if(game.diceRoll>0){
     game.diceMode=!game.diceMode;render();
     msg(game.diceMode?`🎲 Dice result ${game.diceRoll} is still waiting — choose ${ranks[game.diceRoll]} or ${ranks[game.diceRoll+1]}.`:'Magic Dice targeting paused. The roll is saved.');
     return;
   }
   const maxRoll=state.magicDiceTier2?DSH.Config.rewardShopTier2.dice.maxRoll:6,roll=1+Math.floor(Math.random()*maxRoll);
   animateDiceRoll(roll,()=>{
     game.diceRoll=roll;game.diceMode=true;render();
     msg(`🎲 ${state.magicDiceTier2?'Enchanted ':'Magic '}Dice rolled ${roll}! Choose an exposed ${ranks[roll]} or ${ranks[roll+1]}.`);
   });
 }
 function useDiceOnCard(c){
   if(!game.diceMode||!c||c.removed||blocked(c))return false;
   const valid=!c.card.wild&&(c.card.r+1===game.diceRoll+1||c.card.r+1===game.diceRoll+2);
   if(!valid){DSH.Audio.play.bad();msg(`The Magic Dice rolled ${game.diceRoll}; choose a card 1 or 2 ranks above it.`);return false}
   snapshot();game.streak=0;breakHarvestChain();c.removed=true;applySpecialClear(c,true);game.diceUsed=true;game.powersUsed=(game.powersUsed||0)+1;state.stats.powersUsed=(state.stats.powersUsed||0)+1;updateMission();game.diceMode=false;game.diceRoll=0;
   state.stats.cardsCleared++;game.cardsClearedThisHand=(game.cardsClearedThisHand||0)+1;game.score+=125;updateMission();DSH.Save.save(state);DSH.Audio.play.flip();render(true);msg('🎲 Magic Dice cleared the card!');
   finishIfCleared('dice');return true;
 }
 function toggleSeed(){
   if(locked)return;
   const limit=state.luckySeedTier2?DSH.Config.rewardShopTier2.seed.uses:1,used=game.seedUses||0;
   if(used>=limit){msg(`Lucky Seed has used all ${limit} charge${limit===1?'':'s'} for this match.`);return}
   if(!state.luckySeedUnlocked){msg('Permanently unlock Lucky Seed in the Rewards Shop with gems.');return}
   setPouch(false);
   game.seedMode=!game.seedMode;game.diceMode=false;game.gateMode=false;game.shearsMode=false;render();
   msg(game.seedMode?`🌱 Lucky Seed ready — tap one exposed card to turn it Wild. ${limit-used} use${limit-used===1?'':'s'} available.`:'Lucky Seed cancelled.');
 }
 function useSeedOnCard(c){
   if(!game.seedMode||!c||c.removed||blocked(c))return false;
   if(c.special==='mud'){DSH.Audio.play.bad();msg('🟤 Mud cards cannot be transformed by Lucky Seed.');return false}
   snapshot();c.card={r:null,s:null,wild:true};
   game.seedUses=(game.seedUses||0)+1;const seedLimit=state.luckySeedTier2?DSH.Config.rewardShopTier2.seed.uses:1;game.seedUsed=game.seedUses>=seedLimit;
   game.powersUsed=(game.powersUsed||0)+1;state.stats.powersUsed=(state.stats.powersUsed||0)+1;updateMission();game.seedMode=false;DSH.Save.save(state);DSH.Audio.play.flip();render(true);msg(`🌱 Lucky Seed transformed that card into a Wild! ${Math.max(0,(state.luckySeedTier2?DSH.Config.rewardShopTier2.seed.uses:1)-(game.seedUses||0))} use${Math.max(0,(state.luckySeedTier2?DSH.Config.rewardShopTier2.seed.uses:1)-(game.seedUses||0))===1?'':'s'} remain.`);
   return true;
 }
 function useSunCharm(){
   if(locked)return;
   if(game.sunUsed){msg('Sun Charm can only be used once per match.');return}
   if(!state.sunCharmUnlocked){msg('Permanently unlock Sun Charm in the Rewards Shop with gems.');return}
   if(!game.stock.length){msg('There are no draw cards left for the Sun Charm to inspect.');return}
   setPouch(false);
   const lookAhead=state.sunCharmTier2?DSH.Config.rewardShopTier2.sun.lookAhead:3,n=Math.min(lookAhead,game.stock.length),choices=game.stock.slice(-n),good=choices.filter(card=>playable(card));
   const pick=good.length?good[Math.floor(Math.random()*good.length)]:choices[Math.floor(Math.random()*choices.length)];
   const ix=game.stock.lastIndexOf(pick);snapshot();game.stock.splice(ix,1);game.waste=pick;game.streak=0;breakHarvestChain();
   game.sunUsed=true;game.powersUsed=(game.powersUsed||0)+1;state.stats.powersUsed=(state.stats.powersUsed||0)+1;if(game.missionMetrics)game.missionMetrics.endRun=0;updateMission();DSH.Save.save(state);DSH.Audio.play.flip();render();
   msg(good.length?`☀️ ${state.sunCharmTier2?'Brilliant ':''}Sun Charm found a useful card among the next ${lookAhead}!`:`☀️ No immediate match was hiding there, but the Sun Charm chose one of the next ${lookAhead} cards.`);
 }

 function useWindmill(){
   if(locked)return;if(state.windmills<=0){DSH.Audio.play.bad();msg('Harvest crops for a chance to find a rare Windmill Card.');return}
   setPouch(false);
   const targets=exposed();if(!targets.length)return;
   snapshot();state.windmills--;state.stats.windmillsUsed++;game.powersUsed=(game.powersUsed||0)+1;state.stats.powersUsed=(state.stats.powersUsed||0)+1;updateMission();locked=true;DSH.Audio.play.windmill();gust();
   document.querySelectorAll('.card:not(.faceDown)').forEach((el,i)=>setTimeout(()=>el.classList.add('windGone'),i*25));
   setTimeout(()=>{
     targets.forEach(c=>{c.removed=true;applySpecialClear(c,true);state.stats.cardsCleared++;game.cardsClearedThisHand=(game.cardsClearedThisHand||0)+1;game.score+=75});
     game.streak=0;breakHarvestChain();updateMission();DSH.Save.save(state);locked=false;render(true);msg(`Windmill! ${targets.length} face-up cards blown away. 🌬️`);
     finishIfCleared('windmill');
   },580);
 }
 function win(){
   if(game.dailyMode)return winDaily();
   const walletCoinsAtWin=state.coins,walletGemsAtWin=state.gems;
   handComplete=true;handStarted=false;game.completing=false;DSH.Audio.play.win();
   const completedLevel=state.level,S=DSH.Config.scoring;
   const perfect=(game.drawPacksBought||0)===0&&(game.powersUsed||0)===0;
   const levelStreak=game.levelBestStreak||0;
   let stars=1;if(perfect||levelStreak>=S.threeStarStreak)stars=2;if(perfect&&levelStreak>=S.threeStarStreak)stars=3;
   const previousStars=Number(state.levelStars[completedLevel])||0;state.levelStars[completedLevel]=Math.max(previousStars,stars);
   const newStars=Math.max(0,stars-previousStars);state.stats.starsEarned=(state.stats.starsEarned||0)+newStars;
   if(stars===3)state.stats.threeStarClears=(state.stats.threeStarClears||0)+1;
   if(perfect)state.stats.perfectClears=(state.stats.perfectClears||0)+1;if(game.obstacleLevel)state.stats.obstacleLevelsCleared=(state.stats.obstacleLevelsCleared||0)+1;

   const base=150+completedLevel*28,streak=levelStreak*4,barnBonus=state.upgrades.barn?Math.round((base+streak)*.12):0;
   const starBonus=stars*S.starCoinBonus,perfectBonus=perfect?(S.perfectBase+completedLevel*S.perfectPerLevel):0;
   let coins=Math.round((base+streak+barnBonus+starBonus+perfectBonus)*((game.handWeatherFx||DSH.Weather.effects(state)).levelCoin||1));
   let gems=1+(completedLevel%3===0?1:0);
   let perfectGem=0;if(perfect&&Math.random()<S.perfectGemChance){perfectGem=1;gems++}
   let shootingStarGem=0;
   if((state.rosieAdventureFinds?.star||0)>0){state.rosieAdventureFinds.star--;shootingStarGem=1;gems++}
   updateMission();const missionResult=missionReward();
   let milestoneResult=null;
   if(completedLevel%DSH.Config.milestones.interval===0&&!state.milestonesCleared[completedLevel]){
     const MC=DSH.Config.milestones,mc=MC.coinBase+completedLevel*MC.coinPerLevel,mg=MC.gemsBase+Math.floor(completedLevel/50);
     state.milestonesCleared[completedLevel]=true;state.stats.milestonesCompleted=(state.stats.milestonesCompleted||0)+1;
     state.stats.milestoneCoinsEarned=(state.stats.milestoneCoinsEarned||0)+mc;state.stats.milestoneGemsEarned=(state.stats.milestoneGemsEarned||0)+mg;
     state.coins+=mc;state.gems+=mg;state.rosieRescues++;state.stats.rosieRescuesFound=(state.stats.rosieRescuesFound||0)+1;milestoneResult={coins:mc,gems:mg,name:milestoneName(completedLevel)};
   }
   if(game.challengeHand){state.coins+=DSH.Config.specialCards.challengeCoins;state.gems+=DSH.Config.specialCards.challengeGems;state.stats.challengeHandsWon=(state.stats.challengeHandsWon||0)+1}
   if(game.luckyHand){state.stats.luckyHandsWon=(state.stats.luckyHandsWon||0)+1}
   state.coins+=coins;state.gems+=gems;state.stats.levelsCompleted++;state.stats.totalScore+=game.score;
   const activeEvent=DSH.Weather.event(state);if(activeEvent){state.stats.eventLevels=(state.stats.eventLevels||0)+1;if(activeEvent.key==='festival'){const dk=DSH.Weather.dayKey(),p=(state.eventProgress[dk]||0)+1;state.eventProgress[dk]=p;if(p>=3&&!state.eventClaimed[dk]){state.eventClaimed[dk]=true;state.coins+=500;state.gems+=2;state.stats.festivalClaims=(state.stats.festivalClaims||0)+1;setTimeout(()=>showRewardToast('Harvest Festival Complete!','3 levels cleared • +500 coins • +2 💎','🎪'),500)}}}state.stats.weatherLevels=(state.stats.weatherLevels||0)+1;
   checkFarmhouseAchievements({wonWithZeroStock:(game.stock?.length||0)===0,wonWithThreePacks:(game.drawPacksBought||0)>=DSH.Config.draws.maxPacks,reserveWin:!!game.reserveEverUsed,luckyPerfect:!!game.luckyHand&&perfect});
   DSH.Progress.addHappiness(state,DSH.Config.happiness.levelComplete);
   state.level++;
   const oldRegion=state.region;
   if(state.level>=(state.region+1)*4+1&&state.region<DSH.Farm.regions.length-1)state.region++;
   if(state.region!==oldRegion){state.farmRegionView=state.region;DSH.Farm.claimRegionRewards()}
   DSH.Farm.grow();
   const achievements=DSH.Progress.checkAchievements(state),achievementGems=achievements.reduce((a,x)=>a+x.gems,0);
   const displayedWinCoins=Math.max(0,state.coins-walletCoinsAtWin),displayedWinGems=Math.max(0,state.gems-walletGemsAtWin);
   DSH.Save.save(state);DSH.Farm.render();renderAllBalances();
   setTextIfPresent('rewardCoins',displayedWinCoins);setTextIfPresent('rewardGems',displayedWinGems);
   setTextIfPresent('winStars','★'.repeat(stars)+'☆'.repeat(3-stars));
   document.getElementById('perfectClearBadge').classList.toggle('show',perfect);
   setTextIfPresent('winText',`Score ${game.score.toLocaleString()} • Level streak ${levelStreak}`);
   let details=[`Star bonus +${starBonus} coins`,`Rosie +${DSH.Config.happiness.levelComplete} ❤️`];
   if(missionResult){
     if(missionResult.success)details.push(`📋 ${missionResult.name}: +${missionResult.coins} coins${missionResult.gems?' +1 💎':''}${missionResult.power?' + '+missionResult.power:''}`);
     else details.push(`📋 ${missionResult.name}: FAILED — no mission reward`);
   }
   if(milestoneResult)details.push(`🏆 ${milestoneResult.name}: +${milestoneResult.coins} coins +${milestoneResult.gems} 💎 +1 Rosie Rescue 🐾`);
   if(game.challengeHand)details.push(`🔥 Challenge Hand: +${DSH.Config.specialCards.challengeCoins} coins +${DSH.Config.specialCards.challengeGems} 💎`);if(game.luckyHand)details.push('🌟 Lucky Hand completed');
   if(perfect)details.push(`Perfect Clear +${perfectBonus} coins${perfectGem?' +1 💎':''}`);
   if(shootingStarGem)details.push('🌟 Shooting Star: +1 guaranteed gem');
   if(achievements.length)details.push(`Achievement: ${achievements.map(x=>x.name).join(', ')} (+${achievementGems} 💎)`);
   setTextIfPresent('winBonusText',details.join(' • '));
   showRewardToast(milestoneResult?'Milestone Cleared!':stars===3?'Three-Star Clear!':'Level Complete',milestoneResult?`${milestoneResult.name} • ${milestoneResult.coins} coins • ${milestoneResult.gems} 💎 • Rosie Rescue`:perfect?'Perfect Clear — no purchased draws or powers used!':`${stars} star${stars===1?'':'s'} earned`,milestoneResult?'🏆':'⭐');
   open('winOverlay');
 }

 function setTextIfPresent(id,value){const el=document.getElementById(id);if(el)el.textContent=value}
 function compactCoins(n){
   if(n<1000)return String(n);
   if(n<1000000){
     const v=n/1000;
     return (v<10?v.toFixed(1):Math.floor(v))+'k';
   }
   const v=n/1000000;
   return (v<10?v.toFixed(1):Math.floor(v))+'m';
 }

 function drawPackPrice(){
   const bought=game.drawPacksBought||0,D=DSH.Config.draws,P=D.prices,pricingLevel=game.dailyMode?(game.dailyChallengeLevel||state.level):state.level;
   const surcharge=Math.floor(Math.max(0,pricingLevel-1)/(D.levelSurchargeEvery||10))*(D.levelSurcharge||0);
   return P[Math.min(bought,P.length-1)]+surcharge;
 }
 function pouchInventoryCount(){
   // Badge represents things that can actually be used now, not merely owned inventory.
   let n=(state.rosieRescues||0)+(state.magicGates||0)+(state.windmills||0)+(game.shearsCharges||0);
   if(state.magicDiceUnlocked && !game.diceUsed)n++;
   if(state.luckySeedUnlocked && (game.seedUses||0)<(state.luckySeedTier2?DSH.Config.rewardShopTier2.seed.uses:1))n++;
   if(state.sunCharmUnlocked && !game.sunUsed)n++;
   // +5 Draws lives in the pouch. Each purchase becomes more expensive.
   const bought=game.drawPacksBought||0;
   const D=DSH.Config.draws,pricingLevel=game.dailyMode?(game.dailyChallengeLevel||state.level):state.level,surcharge=Math.floor(Math.max(0,pricingLevel-1)/(D.levelSurchargeEvery||10))*(D.levelSurcharge||0);
   for(let i=bought;i<D.maxPacks;i++)if(state.coins>=(D.prices[i]+surcharge))n++;
   return n;
 }
 function renderPouch(){
   const pouchButton=document.getElementById('magicPouchBtn');
   if(pouchButton)pouchButton.disabled=false;
   const n=pouchInventoryCount(),badge=document.getElementById('pouchBadge'),summary=document.getElementById('pouchSummary');
   const permanentOwned=(state.magicDiceUnlocked?1:0)+(state.luckySeedUnlocked?1:0)+(state.sunCharmUnlocked?1:0);
   const consumables=(state.rosieRescues||0)+(state.magicGates||0)+(state.windmills||0);
   const drawsLeft=Math.max(0,DSH.Config.draws.maxPacks-(game.drawPacksBought||0));
   if(badge){
     badge.textContent=n>99?'99+':n;
     badge.classList.toggle('empty',n===0);
   }
   if(summary){
     if(n>0)summary.textContent=`${n} action${n===1?'':'s'} ready`;
     else if(permanentOwned||consumables||drawsLeft)summary.textContent='Open powers & draws';
     else summary.textContent='Open Magic Pouch';
   }
   // Permanent powers display ownership/use state. Farm powers remain numeric.
   setTextIfPresent('magicDiceCount',state.magicDiceUnlocked?(game.diceUsed?'✓':'∞'):'🔒');
   if(state.luckySeedUnlocked){
     const sl=state.luckySeedTier2?DSH.Config.rewardShopTier2.seed.uses:1,su=game.seedUses||0;
     setTextIfPresent('luckySeedCount',su>=sl?'✓':state.luckySeedTier2?`${sl-su}×`:'∞');
   }else setTextIfPresent('luckySeedCount','🔒');
   setTextIfPresent('sunCharmCount',state.sunCharmUnlocked?(game.sunUsed?'✓':'∞'):'🔒');
   setTextIfPresent('shearsCount',(game.shearsCharges||0)>0?(game.shearsCharges||0):((game.shearsGenerated||0)>=DSH.Config.shears.maxCharges?'✓':`${game.shearsMeter||0}/${DSH.Config.shears.cardsPerCharge}`));
 }
 function setPouch(opened){
   const panel=document.getElementById('magicPouchPanel'),btn=document.getElementById('magicPouchBtn');
   if(!panel)return;
   panel.classList.toggle('open',!!opened);
   panel.setAttribute('aria-hidden',opened?'false':'true');
   if(btn){
     btn.classList.toggle('active',!!opened);
     btn.setAttribute('aria-expanded',opened?'true':'false');
   }
 }

 function renderWeatherBulletin(){
   const b=DSH.Weather.bulletin(state),fx=DSH.Weather.effects(state),crop=fx.bumper&&DSH.Config.crops[fx.bumper];
   setTextIfPresent('weatherNow',`${b.w.icon} ${b.w.name}`);setTextIfPresent('weatherDesc',b.w.desc);setTextIfPresent('weatherRemaining',b.weatherRemaining);setTextIfPresent('weatherNext',`Next: ${b.next.icon} ${b.next.name}`);
   setTextIfPresent('farmWeatherNow',`${b.w.icon} ${b.w.name}`);setTextIfPresent('farmWeatherDesc',b.w.desc);setTextIfPresent('farmWeatherRemaining',b.weatherRemaining);setTextIfPresent('farmWeatherNext',`Forecast: ${b.next.icon} ${b.next.name}`);
   let eventText='No special farm event today.';if(b.e){eventText=`${b.e.icon} ${b.e.name} • ${b.e.desc} • ${b.eventRemaining} left`;if(b.e.key==='bumper'&&crop)eventText+=` Featured: ${crop.icon} ${crop.name}`;if(b.e.key==='festival'){const dk=DSH.Weather.dayKey(),n=Math.min(3,state.eventProgress[dk]||0);eventText+=` Progress ${n}/3${state.eventClaimed[dk]?' ✓':''}`}}
   setTextIfPresent('farmEventLine',eventText);setTextIfPresent('farmEventDetail',eventText);
 }
 function formatApproxMinutes(ms){
   const mins=Math.max(0,Math.ceil(ms/60000));
   if(mins<=1)return'about 1 min';
   if(mins<60)return`about ${mins} min`;
   const hours=Math.floor(mins/60),rem=mins%60;
   return rem?`about ${hours}h ${rem}m`:`about ${hours}h`;
 }
 function renderMainRosieStatus(){
   const adv=state.rosieAdventure,now=Date.now(),peek=document.getElementById('mainRosiePeek'),fs=document.getElementById('farmMenuStatus');
   const footer=document.getElementById('mainRosieFooter'),title=document.getElementById('mainRosiePeekTitle'),detail=document.getElementById('mainRosiePeekDetail');
   const readyOrders=DSH.Farm.readyOrderCount?.()||0,notices=[];
   if(readyOrders)notices.push(`📋 ${readyOrders} order${readyOrders===1?'':'s'} ready`);
   if(!adv){
     if(footer)footer.textContent='Rosie is home at the farm. 🐾';
     if(peek){peek.classList.remove('show','away');peek.setAttribute('aria-label','Rosie is home at the farm')}
   }else{
     const ready=now>=adv.endsAt,remaining=Math.max(0,adv.endsAt-now),region=DSH.Farm.regions?.[adv.region]||'the farm';
     if(ready){
       notices.push('🐕 Rosie is home!');
       if(footer)footer.textContent='Rosie is back from her adventure! 🐕';
       if(title)title.textContent='Rosie is home!';
       if(detail)detail.textContent='Tap to welcome her back';
       if(peek){peek.classList.add('show');peek.classList.remove('away');peek.setAttribute('aria-label','Rosie is home from her adventure. Tap to welcome her back.')}
     }else{
       const eta=formatApproxMinutes(remaining);notices.push(`🐾 Rosie exploring • ${eta}`);
       if(footer)footer.textContent=`Rosie is exploring ${region} • ${eta} left 🐾`;
       if(title)title.textContent='Rosie is adventuring';
       if(detail)detail.textContent=`${region} • ${eta} left`;
       if(peek){peek.classList.add('show','away');peek.setAttribute('aria-label',`Rosie is adventuring in ${region}. ${eta} until return.`)}
     }
   }
   if(fs)fs.textContent=notices.length?notices.join(' • '):'Plant, harvest, upgrade';
 }
 function renderAllBalances(){
   checkFarmhouseAchievements();
   const hud=document.getElementById('hudCoins');
   if(hud)hud.textContent=compactCoins(state.coins);
   ['menuCoins','farmCoins'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=state.coins.toLocaleString()});
   ['menuGems','gems','shopGems'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=state.gems});
   ['menuWindmills','farmWindmills','windmills'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=state.windmills});
   ['farmGates','magicGates'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=state.magicGates||0});
   ['farmRosieRescues','rosieRescues'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=state.rosieRescues||0});
   document.getElementById('menuLevel').textContent=state.level;renderChapterProgress();renderWeatherBulletin();
   renderShop();
   renderPouch();
   renderDailyUI();
   renderMainRosieStatus();
   refreshCollectionKnowledge();
   const allCollection=['specials','crops','regions','powers','rosie','milestones'].flatMap(collectionEntries),collectionFound=allCollection.filter(x=>x.found).length;
   setTextIfPresent('collectionMenuStatus',`${collectionFound}/${allCollection.length} discoveries`);
   const fh=document.getElementById('farmhouseMenuStatus');if(fh){const te=Object.values(state.farmhouseTrophies||{}).filter(Boolean).length,toys=Object.values(state.rosieToys||{}).filter(Boolean).length,pending=farmhousePendingRewardCount();fh.textContent=pending?`🎁 ${pending} reward${pending===1?'':'s'} waiting`:`${te}/${Object.keys(DSH.Config.farmhouse.trophies).length} trophies • ${toys}/6 toys`}
 }


 function render(animateReveals=false){
   applyAccessibilitySettings();renderAllBalances();
   document.getElementById('levelNum').textContent=game.dailyMode?'DAILY':state.level;document.getElementById('formationName').textContent=game.formation||'Meadow';
   const stockN=game.stock?.length||0;document.getElementById('stockCount').textContent=stockN;
   const stockWrapEl=document.getElementById('stockWrap');if(stockWrapEl){
     const depth=stockDepthForCount(stockN);stockWrapEl.dataset.depth=String(depth);
     stockWrapEl.classList.toggle('empty',stockN===0);stockWrapEl.classList.toggle('disabled',!!handComplete);
     stockWrapEl.setAttribute('aria-disabled',(stockN===0||handComplete)?'true':'false');
     stockWrapEl.setAttribute('aria-label',stockN?`Draw next stock card. ${stockN} remaining.`:'Draw pile empty');
   }
   const messageEl=document.getElementById('message');if(stockN>0&&messageEl?.textContent==='No cards remain in the draw pile.')messageEl.textContent=`${stockN} draw card${stockN===1?'':'s'} remain.`;
   document.getElementById('windmillBtn').disabled=state.windmills<=0;
   const rb=document.getElementById('rosieBtn');if(rb){rb.disabled=(state.rosieRescues||0)<=0;rb.title=(state.rosieRescues||0)>0?'Rosie Rescue — Rosie will choose the most useful kind of help':'No Rosie Rescues available'}
   const gb=document.getElementById('gateBtn');if(gb){gb.disabled=(state.magicGates||0)<=0;gb.classList.toggle('active',!!game.gateMode)}
   const db=document.getElementById('diceBtn');if(db){db.disabled=!state.magicDiceUnlocked||!!game.diceUsed;db.classList.toggle('active',!!game.diceMode)}
   const sb=document.getElementById('seedBtn');if(sb){const sl=state.luckySeedTier2?DSH.Config.rewardShopTier2.seed.uses:1,su=game.seedUses||0;sb.disabled=!state.luckySeedUnlocked||su>=sl;sb.classList.toggle('active',!!game.seedMode);sb.title=state.luckySeedTier2?`Twin Lucky Seed — ${Math.max(0,sl-su)} use${Math.max(0,sl-su)===1?'':'s'} left`:'Lucky Seed'}
   const sunb=document.getElementById('sunBtn');if(sunb)sunb.disabled=!state.sunCharmUnlocked||!!game.sunUsed||!game.stock.length;
   const sh=document.getElementById('shearsBtn');if(sh){sh.disabled=false;sh.classList.toggle('active',!!game.shearsMode);sh.title=(game.shearsCharges||0)?`Garden Shears — ${game.shearsCharges} charge${game.shearsCharges===1?'':'s'} ready`:((game.shearsGenerated||0)>=DSH.Config.shears.maxCharges?'Garden Shears — both match charges used':`Garden Shears — ${game.shearsMeter||0}/${DSH.Config.shears.cardsPerCharge} charge progress`)}
   const bd=document.getElementById('buyDrawsBtn');if(bd){const dp=drawPackPrice();bd.disabled=state.coins<dp||(game.drawPacksBought||0)>=DSH.Config.draws.maxPacks;bd.querySelector('small').textContent=(game.drawPacksBought||0)>=DSH.Config.draws.maxPacks?'MAX':dp;bd.title=(game.drawPacksBought||0)>=DSH.Config.draws.maxPacks?'All draw packs used this level':`Buy 5 extra draws for ${dp} coins`}
   const reserveBtn=document.getElementById('reserveBtn'),reserveCard=document.getElementById('reserveCard');if(reserveBtn){reserveBtn.disabled=!!game.reserveUsed||game.dailyMode;reserveBtn.classList.toggle('used',!!game.reserveUsed);if(reserveCard)reserveCard.textContent=game.reserve?cardLabel(game.reserve):'＋';setTextIfPresent('reserveUses',game.dailyMode?'Off':game.reserveUsed?'Used':game.reserve?'Swap ready':'Ready')}
   const w=document.getElementById('waste');
   if(game.waste?.wild){w.className='waste wildWaste suit-wild';w.innerHTML='<small>WILD</small><span>🌈</span>'}
   else if(game.waste){const red=game.waste.s===1||game.waste.s===2;w.className='waste '+(red?'red ':'black ')+`suit-${game.waste.s}`;w.innerHTML=`<small>${ranks[game.waste.r]}${suits[game.waste.s]}</small><span>${ranks[game.waste.r]}</span>`}
   const streakNow=game.streak||0,streakPhase=streakNow%5,streakDisplay=streakNow===0?0:(streakPhase||5);
   setTextIfPresent('streakFraction',`${streakDisplay}/5`);
   const dots=document.getElementById('streakDots');dots.innerHTML='';for(let i=1;i<=5;i++){const d=document.createElement('span');d.className='streakDot '+(streakPhase>=i||(streakNow>0&&streakPhase===0)?'on':'');dots.appendChild(d)}
   const f=document.getElementById('field'),prev=lastExposed;f.innerHTML='';const W=Math.max(f.clientWidth||0,320),H=Math.max(f.clientHeight||0,260),cardW=Math.min(Math.max(W*.073,56),88),cardH=cardW/.70;
   const now=new Set(exposed().map(c=>c.id));
   game.layout?.forEach(c=>{
     if(c.removed)return;const el=document.createElement('div'),isBlocked=blocked(c),became=animateReveals&&!prev.has(c.id)&&now.has(c.id),red=!c.card.wild&&(c.card.s===1||c.card.s===2);
     const targetClass=powerTargetState(c,isBlocked);
     el.className='card '+(isBlocked?'faceDown ':c.card.wild?'wild ':'')+(red?'red ':'black ')+(!c.card.wild?`suit-${c.card.s} `:'suit-wild ')+(!isBlocked&&!specialLocked(c)&&playable(c.card)?'playable ':'')+(became?'flipIn ':'')+(targetClass?' '+targetClass+' ':'');
     const x=Math.max(4,Math.min(W-cardW-4,c.x*W-cardW/2)),y=Math.max(4,Math.min(H-cardH-4,c.y*H));
     el.style.left=x+'px';el.style.top=y+'px';el.style.zIndex=10+c.row;el.dataset.id=c.id;el.tabIndex=isBlocked?-1:0;el.setAttribute('role','button');el.style.touchAction='manipulation';
     if(!isBlocked){
       el.innerHTML=c.card.wild?'<div class="corner"><span>WILD</span></div><div class="big">🌈</div>':`<div class="corner"><span>${ranks[c.card.r]}</span><span>${suits[c.card.s]}</span></div><div class="big">${ranks[c.card.r]}</div>`;
       if(c.special){
         const tag=document.createElement('div');tag.className='specialTag special-'+c.special;
         const p=specialProgress(c),need=c.special==='vine'?1:c.special==='crate'?2:0;
         const chainNeed=DSH.Config.specialCards.chainRequiredStreak,sleepNeed=DSH.Config.specialCards.sleepingClears;
         const labels={vine:'🌿 '+Math.min(p,1)+'/1',crate:'📦 '+Math.min(p,2)+'/2',flower:'🌼',gold:'💰',mud:'🟤',chain:specialLocked(c)?`⛓️ ${Math.min(game.streak||0,chainNeed)}/${chainNeed}`:'⛓️ OPEN',rainbow:'🌈+',key:'🔑',barnlock:specialLocked(c)?'🔒 KEY':'🔓 OPEN',watering:'💧',bee:'🐝',harvestchain:'🌾 '+((c.chainIndex||0)+1)+'/'+(c.chainSize||2),heavy:(c.heavyHits?'🪨 CRACKED':'🪨 2×'),sleeping:specialLocked(c)?`🌙 ${Math.min(game.cardsClearedThisHand||0,sleepNeed)}/${sleepNeed}`:'🌙 AWAKE',sunflower:'🌻'};
         tag.textContent=labels[c.special]||'✨';el.appendChild(tag);
         el.classList.add('specialCard','special-'+c.special);
         if(specialLocked(c))el.classList.add('specialLocked');
       }
     }
     if(!isBlocked)el.setAttribute('aria-label',c.card.wild?'Wild card':`${ranks[c.card.r]} ${['clubs','diamonds','hearts','spades'][c.card.s]}${c.special?' • '+c.special:''}`);
     el.onclick=()=>play(c.id);el.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&!isBlocked){e.preventDefault();play(c.id)}};f.appendChild(el);if(became)DSH.Audio.play.flip();
   });
   lastExposed=now;renderMissionChip();renderHandStatus();renderPowerMode();DSH.Farm.render();renderStats();renderSettings();setTimeout(collectMechanicNotices,0);
   if(handStarted&&!handComplete&&tableauCleared())setTimeout(()=>finishIfCleared('render-safety-net'),0);
 }
 function animateCardToWaste(id,done){
   if(state.settings.reducedMotion){done();return}
   const el=document.querySelector(`.card[data-id="${id}"]`),w=document.getElementById('waste');if(!el||!w){done();return}
   const a=el.getBoundingClientRect(),b=w.getBoundingClientRect();el.style.setProperty('--flyX',(b.left-a.left)+'px');el.style.setProperty('--flyY',(b.top-a.top)+'px');el.classList.add('flyToWaste');setTimeout(done,330);
 }
 function shakeCard(id){const el=document.querySelector(`.card[data-id="${id}"]`);if(!el)return;el.animate([{transform:'translateX(0)'},{transform:'translateX(-7px)'},{transform:'translateX(7px)'},{transform:'translateX(0)'}],{duration:220})}
 function gust(){if(state.settings.reducedMotion)return;const g=document.createElement('div');g.className='gust';document.getElementById('gustLayer').appendChild(g);setTimeout(()=>g.remove(),700)}
 
 function showViewportFeedback(text,icon='💬',tone='info'){
   const e=document.getElementById('viewportFeedback');if(!e)return;
   setTextIfPresent('viewportFeedbackText',text);setTextIfPresent('viewportFeedbackIcon',icon);
   e.dataset.tone=tone;e.classList.remove('show');void e.offsetWidth;e.classList.add('show');clearTimeout(showViewportFeedback.t);
   showViewportFeedback.t=setTimeout(()=>e.classList.remove('show'),2400);
 }
 function menuFeedbackIcon(text){
   const s=String(text||'');
   if(s.includes('planted')||s.includes('Plot selected'))return'🌱';
   if(s.includes('harvest')||s.includes('Harvest'))return'🌾';
   if(s.includes('Order')||s.includes('order'))return'📋';
   if(s.includes('Rosie'))return'🐕';
   if(s.includes('region')||s.includes('Region'))return'🗺️';
   if(s.includes('coins')||s.includes('coin'))return'🪙';
   if(s.includes('gems')||s.includes('gem'))return'💎';
   if(s.includes('Not enough')||s.includes("can't")||s.includes('cannot')||s.includes('full'))return'⚠️';
   return'✨';
 }
 function showRewardToast(title,text,icon='✨'){
   const e=document.getElementById('rewardToast');if(!e)return;
   setTextIfPresent('rewardToastTitle',title);setTextIfPresent('rewardToastText',text);setTextIfPresent('rewardToastIcon',icon);
   e.classList.remove('show');void e.offsetWidth;e.classList.add('show');clearTimeout(showRewardToast.t);
   showRewardToast.t=setTimeout(()=>e.classList.remove('show'),2800);
   if(!state.settings.reducedMotion){
     const layer=document.getElementById('particleLayer'),hasGem=String(text).includes('💎');
     for(let i=0;i<8;i++){
       const p=document.createElement('span');p.className='rewardParticle';p.textContent=hasGem&&i%3===0?'💎':'🪙';
       p.style.left=(46+Math.random()*8)+'%';p.style.top=(20+Math.random()*5)+'%';
       p.style.setProperty('--rx',((Math.random()-.5)*180)+'px');p.style.setProperty('--ry',(40+Math.random()*140)+'px');
       layer.appendChild(p);setTimeout(()=>p.remove(),1100);
     }
   }
 }
 function animateDiceRoll(finalValue,done){
   const overlay=document.getElementById('diceRollOverlay'),value=document.getElementById('diceRollValue');
   if(!overlay||state.settings.reducedMotion){if(value)value.textContent=finalValue;done();return}
   overlay.classList.add('show');locked=true;let ticks=0,max=state.magicDiceTier2?DSH.Config.rewardShopTier2.dice.maxRoll:6;
   const timer=setInterval(()=>{
     ticks++;value.textContent=String(1+Math.floor(Math.random()*max));
     if(ticks>=7){clearInterval(timer);value.textContent=String(finalValue);setTimeout(()=>{overlay.classList.remove('show');locked=false;done()},320)}
   },70);
 }
 function cancelTargetPower(){
   game.gateMode=false;game.diceMode=false;game.seedMode=false;game.shearsMode=false;render();msg(game.diceRoll>0&&!game.diceUsed?'Power targeting cancelled. Your Magic Dice roll is saved.':'Power targeting cancelled.');
 }
 function handStatusText(){
   const stock=game.stock?.length||0,need=DSH.Config.specialCards.chainRequiredStreak||3;
   const sleeping=(game.layout||[]).filter(c=>!c.removed&&c.special==='sleeping'),sleepNeed=DSH.Config.specialCards.sleepingClears||4;
   return{
     stock:`🃏 Stock ${stock}${stock<=3?' • LOW':''}`,
     chain:`⛓️ Chain ${game.chainUnlocked?'OPEN':Math.min(game.streak||0,need)+'/'+need}`,
     sleep:sleeping.length?`🌙 ${Math.min(game.cardsClearedThisHand||0,sleepNeed)}/${sleepNeed}`:'🌙 —'
   };
 }
 function renderHandStatus(){
   const x=handStatusText();setTextIfPresent('stockStatus',x.stock);setTextIfPresent('chainStatus',x.chain);setTextIfPresent('sleepStatus',x.sleep);
   const e=document.getElementById('stockStatus');if(e)e.classList.toggle('warning',(game.stock?.length||0)<=3);
 }
 function powerTargetState(c,isBlocked){
   const active=!!(game.gateMode||game.diceMode||game.seedMode||game.shearsMode);
   if(!active||isBlocked)return'';
   if(game.shearsMode)return'powerEligible shearsTarget';
   if(game.gateMode)return'powerEligible';
   if(game.seedMode)return(c.card.wild||c.special==='mud')?'powerIneligible':'powerEligible';
   if(game.diceMode){
     const card=c.card,valid=!card.wild&&((card.r+1===game.diceRoll+1)||(card.r+1===game.diceRoll+2));
     return valid?'powerEligible':'powerIneligible';
   }
   return'';
 }
 function renderPowerMode(){
   const bar=document.getElementById('powerModeBar'),text=document.getElementById('powerModeText');if(!bar)return;
   const active=game.gateMode||game.diceMode||game.seedMode||game.shearsMode;bar.classList.toggle('show',!!active);
   if(!active)return;
   if(game.shearsMode)text.textContent='✂️ Garden Shears: cut any exposed card';
   else if(game.gateMode)text.textContent='🚪 Magic Gate: choose any exposed card';
   else if(game.seedMode)text.textContent='🌱 Lucky Seed: choose a non-Mud card to make Wild';
   else text.textContent=`🎲 Dice ${game.diceRoll}: choose ${ranks[game.diceRoll]} or ${ranks[game.diceRoll+1]}`;
 }

 function msg(t){
   const app=document.getElementById('app'),menuMode=app?.classList.contains('menu-mode');
   if(menuMode){showViewportFeedback(t,menuFeedbackIcon(t),String(t).includes('Not enough')||String(t).includes('full')?'warn':'info');return}
   const e=document.getElementById('message');if(!e)return;e.textContent=t;e.style.opacity='1';clearTimeout(msg.t);msg.t=setTimeout(()=>e.style.opacity='.78',2600)
 }
 const MECHANIC_NOTICES={
   reserve:{icon:'🧠',title:'Reserve Slot',text:'Once per normal level, park the active card in Reserve, draw a replacement, then swap the saved card back when it becomes useful.'},
   vine:{icon:'🌿',title:'Vine Card',text:'Clear one of its nearby requirement cards before the Vine card can be played.'},
   crate:{icon:'📦',title:'Crate',text:'Clear its nearby requirements to open the Crate.'},
   chain:{icon:'⛓️',title:'Chained Card',text:'Build the required streak before this card can be played normally.'},
   key:{icon:'🔑',title:'Barn Key',text:'Clear the Key to unlock its matching Barn Lock elsewhere on the tableau.'},
   barnlock:{icon:'🔒',title:'Barn Lock',text:'This card stays locked until its matching Key is cleared.'},
   watering:{icon:'💧',title:'Watering Can',text:'Clear it normally and one exposed ordinary card blooms into a Wild.'},
   bee:{icon:'🐝',title:'Bee Card',text:'Bees can buzz to another exposed position when you draw from the stock.'},
   harvestchain:{icon:'🌾',title:'Harvest Chain',text:'Clear linked Harvest Chain cards consecutively for bonus coins and streak progress.'},
   heavy:{icon:'🪨',title:'Heavy Card',text:'A Heavy Card takes two valid plays. The first cracks it; the second clears it.'},
   sleeping:{icon:'🌙',title:'Sleeping Card',text:'Sleeping Cards wake after enough other cards have been cleared.'},
   sunflower:{icon:'🌻',title:'Sunflower Card',text:'Clearing a Sunflower immediately opens one hidden tableau card.'},
   mud:{icon:'🟤',title:'Mud Card',text:'Mud Cards cannot be transformed with Lucky Seed.'},
   rainbow:{icon:'🌈',title:'Rainbow Card',text:'A Rainbow Card is a Wild and also grants an extra reward when cleared.'},
   flower:{icon:'🌼',title:'Flower Card',text:'Clearing a Flower adds a bonus draw to the stock.'},
   gold:{icon:'💰',title:'Golden Card',text:'Golden Cards pay bonus coins and can rarely contain a gem.'}
 };
 function queueMechanicNotice(key){
   if(!state.settings.tutorialNotices||state.seenMechanics?.[key]||!MECHANIC_NOTICES[key]||mechanicNoticeQueue.includes(key))return;
   mechanicNoticeQueue.push(key);
 }
 function collectMechanicNotices(){
   if(!handStarted||!state.settings.tutorialNotices)return;
   if(!game.dailyMode&&!game.missionChosen)return;
   if(!game.dailyMode&&!state.seenMechanics?.reserve)queueMechanicNotice('reserve');
   exposed().forEach(c=>{if(c.special)queueMechanicNotice(c.special)});
   maybeShowMechanicNotice();
 }
 function maybeShowMechanicNotice(){
   if(mechanicNoticeActive||!mechanicNoticeQueue.length||!state.settings.tutorialNotices)return;
   if(document.querySelector('.overlay.open:not(#mechanicNoticeOverlay)')||document.getElementById('challengeOfferOverlay')?.classList.contains('show'))return;
   const key=mechanicNoticeQueue.shift(),d=MECHANIC_NOTICES[key];if(!d)return;
   mechanicNoticeActive=true;state.seenMechanics[key]=true;DSH.Save.save(state);
   setTextIfPresent('mechanicNoticeIcon',d.icon);setTextIfPresent('mechanicNoticeTitle',d.title);setTextIfPresent('mechanicNoticeText',d.text);open('mechanicNoticeOverlay');
 }
 function closeMechanicNotice(){
   close('mechanicNoticeOverlay');mechanicNoticeActive=false;
   setTimeout(()=>{maybeShowMechanicNotice();if(!mechanicNoticeActive&&!mechanicNoticeQueue.length)maybeOfferChallenge()},80)
 }
 function open(id){document.getElementById(id).classList.add('open')}function close(id){document.getElementById(id).classList.remove('open')}

 function toggleFullscreen(){
   const doc=document, el=document.documentElement;
   if(!doc.fullscreenElement && !doc.webkitFullscreenElement){
     const req=el.requestFullscreen||el.webkitRequestFullscreen;
     if(req){
       try{
         const result=req.call(el);
         if(result&&result.catch)result.catch(()=>msg('Fullscreen is not available in this browser.'));
       }catch(e){msg('Fullscreen is not available in this browser.')}
     }else msg('Fullscreen is not available in this browser.');
   }else{
     const exit=doc.exitFullscreen||doc.webkitExitFullscreen;
     if(exit)try{exit.call(doc)}catch(e){}
   }
 }

 function showMain(){
   if(handStarted)history=[]; // Leaving the table commits moves so Farm/Main activity cannot later be erased by Undo.
   if(game.previewChoiceOpen)game.previewChoiceOpen=false;if(game.challengeOfferOpen)game.challengeOfferOpen=false;
   document.getElementById('previewChoiceOverlay').classList.remove('show');document.getElementById('challengeOfferOverlay').classList.remove('show');close('missionOverlay');close('mechanicNoticeOverlay');mechanicNoticeActive=false;
   document.getElementById('app').classList.add('menu-mode');document.querySelectorAll('.sectionOverlay').forEach(x=>x.classList.remove('open'));close('pauseOverlay');close('winOverlay');renderAllBalances();open('mainMenuOverlay')
 }
 function refreshCollectionKnowledge(){
   state.collection=state.collection||{specials:{},crops:{},regions:{0:true},powers:{},rosie:{}};
   const before=JSON.stringify(state.collection),col=state.collection;
   // Preserve discoveries for migrated saves instead of pretending previously reached content is unknown.
   Object.entries(DSH.Config.almanac.specials).forEach(([k,d])=>{if(state.level>d.level)col.specials[k]=true});
   Object.entries(DSH.Config.crops).forEach(([k,d])=>{if((state.region||0)>=d.minRegion)col.crops[k]=true});
   for(let i=0;i<=Math.min(state.region||0,DSH.Farm.regions.length-1);i++)col.regions[i]=true;
   if(state.windmills>0||state.stats.windmillsFound>0)col.powers.windmill=true;
   if(state.magicGates>0||state.stats.magicGatesFound>0)col.powers.gate=true;
   if(state.rosieRescues>0||state.stats.rosieRescuesFound>0)col.powers.rescue=true;
   if(state.magicDiceUnlocked)col.powers.dice=true;if(state.luckySeedUnlocked)col.powers.seed=true;if(state.sunCharmUnlocked)col.powers.sun=true;
   if(state.stats.shearsEarned>0||state.stats.shearsUsed>0)col.powers.shears=true;
   if(state.magicDiceTier2)col.powers.dice2=true;if(state.luckySeedTier2)col.powers.seed2=true;if(state.sunCharmTier2)col.powers.sun2=true;
   if(state.stats.petRosieCount>0)col.rosie.petted=true;
   if(state.stats.rosieFinds>0)col.rosie.find=true;
   if(state.stats.rosieTreasures>0)col.rosie.treasure=true;
   if(state.stats.rosieRescuesUsed>0)col.rosie.rescue=true;
   if((state.rosieHappiness||0)>=100||state.achievements.bestFriend)col.rosie.bestFriend=true;
   if(JSON.stringify(state.collection)!==before)DSH.Save.save(state);
 }
 function collectionEntries(tab){
   const special=Object.entries(DSH.Config.almanac.specials).map(([key,d])=>({key,...d,found:!!state.collection.specials[key]}));
   const crops=Object.entries(DSH.Config.crops).map(([key,d])=>({key,icon:d.icon,name:d.name,desc:`${d.grow} level clear${d.grow===1?'':'s'} to mature • ${d.payout} base coins • home region: ${DSH.Farm.regions[d.homeRegion]}`,found:!!state.collection.crops[key]}));
   const regions=DSH.Config.farmRegions.map((d,i)=>({key:String(i),icon:d.icon,name:d.name,desc:d.bonus,found:!!state.collection.regions[i]}));
   const powers=[
     {key:'windmill',icon:'🌬️',name:'Windmill',desc:'Blows away all currently exposed tableau cards.',found:!!state.collection.powers.windmill},
     {key:'gate',icon:'🚪',name:'Magic Gate',desc:'Moves one exposed card behind the fence and into the bottom of the stock.',found:!!state.collection.powers.gate},
     {key:'rescue',icon:'🐾',name:'Rosie Rescue',desc:'Rosie reads the board and chooses between clearing, nudging, or magically replacing the active card.',found:!!state.collection.powers.rescue},
     {key:'dice',icon:'🎲',name:'Magic Dice',desc:'Rolls a number and lets you clear an exposed card one or two ranks above it.',found:!!state.collection.powers.dice},
     {key:'seed',icon:'🌱',name:'Lucky Seed',desc:'Turns one eligible exposed card into a Wild.',found:!!state.collection.powers.seed},
     {key:'sun',icon:'☀️',name:'Sun Charm',desc:'Searches ahead in the stock for a useful active card.',found:!!state.collection.powers.sun},
     {key:'shears',icon:'✂️',name:'Garden Shears',desc:'Charges through ordinary play and can cut away one exposed card.',found:!!state.collection.powers.shears},
     {key:'dice2',icon:'🎲✨',name:'Enchanted Dice',desc:'Tier II Magic Dice with a 1–10 roll.',found:!!state.collection.powers.dice2},
     {key:'seed2',icon:'🌱🌱',name:'Twin Lucky Seed',desc:'Tier II Lucky Seed with two uses per match.',found:!!state.collection.powers.seed2},
     {key:'sun2',icon:'☀️✨',name:'Brilliant Sun Charm',desc:'Tier II Sun Charm that searches five stock cards.',found:!!state.collection.powers.sun2},
     ...Object.entries(DSH.Config.rosieAdventures.rareFinds).map(([key,d])=>({key:'adventure-'+key,icon:d.icon,name:d.name,desc:d.desc,found:!!state.collection.powers['adventure-'+key]||(state.rosieAdventureFinds[key]||0)>0}))
   ];
   const milestones=Array.from({length:10},(_,i)=>{
     const level=(i+1)*10,ch=chapterForLevel(level),found=!!state.milestonesCleared[level];
     return{key:String(level),icon:found?'🏆':'🔒',name:found?`${level} — ${milestoneName(level)}`:`Level ${level} Milestone`,desc:found?`${ch.icon} ${ch.name} completed. First-clear milestone reward claimed.`:`Reach and clear Level ${level} to reveal this milestone.`,found};
   });
   const rosie=[
     {key:'petted',icon:'💗',name:'Good Girl',desc:'Pet Rosie at the farm.',found:!!state.collection.rosie.petted},
     {key:'find',icon:'🔎',name:'Rosie Find',desc:'Rosie has discovered a farm reward for Denise.',found:!!state.collection.rosie.find},
     {key:'rescue',icon:'🐕',name:'Board Rescue',desc:'Rosie has personally rescued a Solitaire hand.',found:!!state.collection.rosie.rescue},
     {key:'bestFriend',icon:'❤️',name:"Rosie's Best Friend",desc:'Reach 100 Rosie Happiness.',found:!!state.collection.rosie.bestFriend},
     {key:'treasure',icon:'🎁',name:"Rosie's Treasure",desc:'Trigger Rosie’s special treasure at maximum Happiness.',found:!!state.collection.rosie.treasure}
   ];
   return{specials:special,crops,regions,powers,rosie,milestones}[tab]||special;
 }
 function renderCollection(tab){
   refreshCollectionKnowledge();
   tab=tab||document.querySelector('.collectionTab.active')?.dataset.collectionTab||'specials';
   document.querySelectorAll('.collectionTab').forEach(b=>b.classList.toggle('active',b.dataset.collectionTab===tab));
   const allTabs=['specials','crops','regions','powers','rosie','milestones'],all=allTabs.flatMap(collectionEntries),found=all.filter(x=>x.found).length;
   setTextIfPresent('collectionProgress',`${found} / ${all.length} discoveries`);
   setTextIfPresent('collectionMenuStatus',`${found}/${all.length} discoveries`);
   const bar=document.getElementById('collectionProgressBar');if(bar)bar.style.width=(all.length?found/all.length*100:0)+'%';
   const grid=document.getElementById('collectionGrid');if(!grid)return;
   grid.innerHTML=collectionEntries(tab).map(e=>e.found
     ?`<div class="collectionEntry found"><div class="collectionIcon">${e.icon}</div><div><b>${e.name}</b><small>${e.desc}</small></div><span>✓</span></div>`
     :`<div class="collectionEntry hiddenEntry"><div class="collectionIcon">❔</div><div><b>Undiscovered</b><small>Keep playing to reveal this entry.</small></div><span>🔒</span></div>`
   ).join('');
 }
 function farmhouseTierValue(def){
   if(def.stat==='harvests')return state.harvests||0;
   return state.stats[def.stat]||0;
 }
 function farmhousePendingRewardCount(){
   const trophyPending=Object.keys(state.farmhouseTrophies||{}).filter(k=>state.farmhouseTrophies[k]&&!state.farmhouseTrophyRewardsClaimed?.[k]).length;
   const tierPending=Object.keys(state.farmhouseTierClaims||{}).filter(k=>state.farmhouseTierClaims[k]&&!state.farmhouseTierRewardsClaimed?.[k]).length;
   return trophyPending+tierPending;
 }
 function farmhouseRewardBurst(icon,text){
   const b=document.createElement('div');b.className='farmhouseRewardBurst';b.innerHTML=`<span>${icon}</span><b>${text}</b>`;document.body.appendChild(b);setTimeout(()=>b.remove(),1500);
 }
 function unlockFarmhouseTrophy(key,silent=false){
   const def=DSH.Config.farmhouse.trophies[key];if(!def||state.farmhouseTrophies[key])return false;
   state.farmhouseTrophies[key]=true;state.stats.trophiesUnlocked=(state.stats.trophiesUnlocked||0)+1;DSH.Save.save(state);
   if(!silent){DSH.Audio.play.achievement();showRewardToast('🏆 TROPHY EARNED',`${def.name} • reward waiting in Denise’s Farmhouse`,def.icon)}
   return true;
 }
 function collectTrophyReward(key){
   const def=DSH.Config.farmhouse.trophies[key];
   if(!def||!state.farmhouseTrophies?.[key]||state.farmhouseTrophyRewardsClaimed?.[key])return false;
   state.farmhouseTrophyRewardsClaimed=state.farmhouseTrophyRewardsClaimed||{};
   state.farmhouseTrophyRewardsClaimed[key]=true;state.gems+=def.rewardGems||0;state.stats.trophyRewardsCollected=(state.stats.trophyRewardsCollected||0)+1;
   DSH.Save.save(state);DSH.Audio.play.achievement();farmhouseRewardBurst('💎',`+${def.rewardGems||0} gems`);renderAllBalances();renderFarmhouse('trophies');
   showRewardToast('Trophy Reward Collected',`${def.name} • +${def.rewardGems||0} 💎`,def.icon);return true;
 }
 function collectTierReward(key,i){
   const claim=`${key}-${i}`,def=DSH.Config.farmhouse.tiers[key],reward=i+1;
   if(!def||!state.farmhouseTierClaims?.[claim]||state.farmhouseTierRewardsClaimed?.[claim])return false;
   state.farmhouseTierRewardsClaimed=state.farmhouseTierRewardsClaimed||{};
   state.farmhouseTierRewardsClaimed[claim]=true;state.gems+=reward;state.stats.tierRewardsCollected=(state.stats.tierRewardsCollected||0)+1;
   DSH.Save.save(state);DSH.Audio.play.achievement();farmhouseRewardBurst('💎',`+${reward} gems`);renderAllBalances();renderFarmhouse('tiers');
   showRewardToast('Achievement Reward Collected',`${def.name} ${['Bronze','Silver','Gold'][i]} • +${reward} 💎`,def.icon);return true;
 }
 function checkFarmhouseAchievements(context={}){
   if(devTrophyChecksPaused)return null;
   state.farmhouseTrophies=state.farmhouseTrophies||{};state.farmhouseTierClaims=state.farmhouseTierClaims||{};
   state.farmhouseTrophyRewardsClaimed=state.farmhouseTrophyRewardsClaimed||{};state.farmhouseTierRewardsClaimed=state.farmhouseTierRewardsClaimed||{};
   state.chapterMemorabilia=state.chapterMemorabilia||{};
   const threeStarLevels=Object.values(state.levelStars||{}).filter(v=>Number(v)>=3).length;
   const tests={
     meadowGate:!!state.milestonesCleared?.[10],
     rosieCreek:!!state.milestonesCleared?.[30],
     centennial:!!state.milestonesCleared?.[100],
     unbroken:(state.bestStreak||0)>=10,
     perfectHarvest:threeStarLevels>=10,
     supplier:(state.stats.farmOrdersCompleted||0)>=25,
     explorer:(state.stats.rosieAdventuresCompleted||0)>=25,
     shiny:(state.lifetime?.gemsEarned||0)>=50,
     rosiePlease:(state.stats.rosieRescuesUsed||0)>=3,
     empire:(state.lifetime?.coinsEarned||0)>=100000,
     close:!!context.wonWithZeroStock,
     drawPacks:!!context.wonWithThreePacks,
     shoe:!!state.rosieToys?.shoe,
     goodest:(state.rosieHappiness||0)>=100&&Object.keys(state.rosieToys||{}).filter(k=>state.rosieToys[k]).length>=6&&(state.stats.rosieAdventuresCompleted||0)>=50&&(state.stats.rosieTreasures||0)>=3,
     reserveMind:!!context.reserveWin,challengeWin:(state.stats.challengeHandsWon||0)>=1,highRoller:(state.stats.challengeHandsWon||0)>=10,luckyGirl:!!context.luckyPerfect
   };
   let first=null;
   Object.entries(tests).forEach(([k,ok])=>{if(ok&&!state.farmhouseTrophies[k]&&unlockFarmhouseTrophy(k,!!first)){if(!first)first=k}});
   for(let level=10;level<=100;level+=10)if(state.milestonesCleared?.[level])state.chapterMemorabilia[level]=true;
   // Thresholds become earned immediately, but their gem rewards wait in the Farmhouse.
   Object.entries(DSH.Config.farmhouse.tiers).forEach(([key,def])=>{
     const value=farmhouseTierValue(def);
     def.values.forEach((target,i)=>{
       const claim=`${key}-${i}`;if(value>=target&&!state.farmhouseTierClaims[claim]){
         state.farmhouseTierClaims[claim]=true;state.stats.tierAchievementsUnlocked=(state.stats.tierAchievementsUnlocked||0)+1;DSH.Save.save(state);
         if(!first){first=claim;DSH.Audio.play.achievement();showRewardToast('🎖️ ACHIEVEMENT EARNED',`${def.name} ${['Bronze','Silver','Gold'][i]} • reward waiting in Denise’s Farmhouse`,def.icon)}
       }
     });
   });
   return first;
 }
 function farmhouseTrophyEntries(){
   return Object.entries(DSH.Config.farmhouse.trophies).map(([key,d])=>({key,...d,earned:!!state.farmhouseTrophies[key],claimed:!!state.farmhouseTrophyRewardsClaimed?.[key]}));
 }
 function renderFarmhouse(tab){
   checkFarmhouseAchievements();
   tab=tab||document.querySelector('.farmhouseTab.active')?.dataset.houseTab||'trophies';
   document.querySelectorAll('.farmhouseTab').forEach(b=>b.classList.toggle('active',b.dataset.houseTab===tab));
   const trophies=farmhouseTrophyEntries(),earned=trophies.filter(x=>x.earned),pending=farmhousePendingRewardCount();
   const notice=document.getElementById('farmhouseRewardNotice');if(notice){notice.classList.toggle('show',pending>0);notice.textContent=pending?`🎁 ${pending} Farmhouse reward${pending===1?'':'s'} waiting to be collected.`:'All earned rewards collected ✓'}
   const shelf=document.getElementById('trophyShelf');
   if(shelf)shelf.innerHTML=earned.slice(0,8).map(t=>`<span class="${!t.claimed?'rewardWaiting':''}" title="${t.name}${!t.claimed?' • reward waiting':''}">${t.icon}${!t.claimed?'<i>!</i>':''}</span>`).join('')||'<small>No trophies yet</small>';
   const wall=document.getElementById('chapterWall');
   if(wall)wall.innerHTML=Array.from({length:10},(_,i)=>{const level=(i+1)*10,got=!!state.chapterMemorabilia[level],ch=chapterForLevel(level);return `<span class="${got?'earned':''}" title="${got?ch.name:'Locked chapter keepsake'}">${got?ch.icon:'▧'}</span>`}).join('');
   const toys=document.getElementById('toyBox'),toyDefs=DSH.Config.farmhouse.toys;
   if(toys)toys.innerHTML=Object.entries(toyDefs).map(([k,d])=>`<span class="${state.rosieToys?.[k]?'found':''}" title="${state.rosieToys?.[k]?d.name:'Undiscovered toy'}">${state.rosieToys?.[k]?d.icon:'?'}</span>`).join('');
   const cab=document.getElementById('harvestCabinet');if(cab)cab.innerHTML=`<span>🌾 ${state.harvests||0}</span><span>📋 ${state.stats.farmOrdersCompleted||0}</span><span>💎 ${(state.lifetime?.gemsEarned||0).toLocaleString()}</span>`;
   const box=document.getElementById('farmhouseDetails');if(!box)return;
   if(tab==='trophies'){
     box.innerHTML=`<div class="houseDetailGrid">${trophies.map(t=>{
       const hidden=t.secret&&!t.earned,pendingReward=t.earned&&!t.claimed;
       return `<div class="houseAchievement ${t.earned?'earned':'locked'}${pendingReward?' reward-pending':''}"><span>${t.earned?t.icon:hidden?'❔':'🔒'}</span><div><b>${t.earned?t.name:hidden?'Secret Trophy':t.name}${pendingReward?' • NEW!':''}</b><small>${t.earned||!hidden?t.desc:'Requirement hidden.'}</small><strong>${!t.earned?`Reward: ${t.rewardGems} 💎`:t.claimed?'Reward collected ✓':`Reward waiting: ${t.rewardGems} 💎`}</strong>${pendingReward?`<button class="collectHouseReward" data-trophy-reward="${t.key}">🎁 COLLECT ${t.rewardGems} 💎</button>`:''}</div></div>`
     }).join('')}</div>`;
     box.querySelectorAll('[data-trophy-reward]').forEach(b=>b.onclick=()=>collectTrophyReward(b.dataset.trophyReward));
   }else if(tab==='tiers'){
     const medals=['🥉','🥈','🥇'],names=['Bronze','Silver','Gold'];
     box.innerHTML=Object.entries(DSH.Config.farmhouse.tiers).map(([key,d])=>{
       const value=farmhouseTierValue(d);return `<section class="tierFamily"><h3>${d.icon} ${d.name} <small>${value.toLocaleString()}</small></h3><div class="tierRow">${d.values.map((v,i)=>{
         const claim=`${key}-${i}`,earned=!!state.farmhouseTierClaims[claim],claimed=!!state.farmhouseTierRewardsClaimed?.[claim];
         return `<div class="${earned?'earned':''}${earned&&!claimed?' reward-pending':''}"><b>${medals[i]} ${names[i]}</b><span>${Math.min(value,v).toLocaleString()}/${v.toLocaleString()}</span><small>${!earned?`Reward: +${i+1} 💎`:claimed?'Reward collected ✓':`Reward waiting: +${i+1} 💎`}</small>${earned&&!claimed?`<button class="collectHouseReward" data-tier-key="${key}" data-tier-index="${i}">🎁 COLLECT</button>`:''}</div>`
       }).join('')}</div></section>`
     }).join('');
     box.querySelectorAll('[data-tier-key]').forEach(b=>b.onclick=()=>collectTierReward(b.dataset.tierKey,+b.dataset.tierIndex));
   }else if(tab==='chapters'){
     box.innerHTML=`<div class="chapterKeepsakes">${Array.from({length:10},(_,i)=>{const level=(i+1)*10,ch=chapterForLevel(level),got=!!state.chapterMemorabilia[level];const keeps=['🌱 Pressed Clover','🌻 Sunflower Painting','🐾 Muddy Pawprint','🍎 Golden Apple','⛰️ Mountain Plaque','🍂 Autumn Wreath','🌙 Moon Lantern','❄️ Crystal Snowflake','🌷 Spring Bouquet','👑 Centennial Crown'][i];return `<div class="${got?'earned':'locked'}"><span>${got?keeps.split(' ')[0]:'🔒'}</span><b>${got?keeps.substring(keeps.indexOf(' ')+1):ch.name}</b><small>${got?`Earned by clearing Level ${level}.`:`Clear Level ${level} to place this keepsake.`}</small></div>`}).join('')}</div>`;
   }else if(tab==='rosie'){
     const hist=state.rosieAdventureHistory||{},favEntry=Object.entries(hist).sort((a,b)=>b[1]-a[1])[0],fav=favEntry?DSH.Farm.regions[+favEntry[0]]:'None yet';
     box.innerHTML=`<div class="rosieJournalStats"><div>🐾 <b>${state.stats.rosieAdventuresCompleted||0}</b><small>Adventures</small></div><div>🪙 <b>${(state.stats.rosieAdventureCoins||0).toLocaleString()}</b><small>Coins Found</small></div><div>💎 <b>${state.stats.rosieAdventureGems||0}</b><small>Gems Found</small></div><div>🎁 <b>${state.stats.rosieAdventureRareFinds||0}</b><small>Rare Finds</small></div></div><p class="houseJournal">Favorite destination: <b>${fav}</b></p><h3>Rosie's Toy Box</h3><div class="toyJournal">${Object.entries(toyDefs).map(([k,d])=>`<div class="${state.rosieToys?.[k]?'found':'locked'}"><span>${state.rosieToys?.[k]?d.icon:'❔'}</span><b>${state.rosieToys?.[k]?d.name:'Undiscovered Toy'}</b></div>`).join('')}</div>`;
   }else{
     const L=state.lifetime||{};
     box.innerHTML=`<div class="lifetimeGrid"><div>🪙<b>${(L.coinsEarned||0).toLocaleString()}</b><small>Coins earned since v38</small></div><div>🛒<b>${(L.coinsSpent||0).toLocaleString()}</b><small>Coins spent since v38</small></div><div>💎<b>${(L.gemsEarned||0).toLocaleString()}</b><small>Gems earned since v38</small></div><div>✨<b>${(L.gemsSpent||0).toLocaleString()}</b><small>Gems spent since v38</small></div><div>🃏<b>${(state.stats.cardsCleared||0).toLocaleString()}</b><small>Cards cleared</small></div><div>🌾<b>${(state.harvests||0).toLocaleString()}</b><small>Crops harvested</small></div><div>📋<b>${state.stats.farmOrdersCompleted||0}</b><small>Orders collected</small></div><div>🐕<b>${state.stats.rosieAdventuresCompleted||0}</b><small>Rosie adventures</small></div></div>`;
   }
   const toysFound=Object.values(state.rosieToys||{}).filter(Boolean).length;
   setTextIfPresent('farmhouseMenuStatus',pending?`🎁 ${pending} reward${pending===1?'':'s'} waiting`:`${earned.length}/${trophies.length} trophies • ${toysFound}/6 toys`);
 }

 function openSection(id){
   renderAllBalances();
   if(id==='farmOverlay'){DSH.Farm.visit();DSH.Farm.render()}
   if(id==='dailyOverlay')renderDailyUI();
   if(id==='collectionOverlay')renderCollection();
   if(id==='farmhouseOverlay')renderFarmhouse();
   if(id==='statsOverlay')renderStats();
   if(id==='optionsOverlay')renderSettings();
   open(id);
 }
 function renderStats(){
   setTextIfPresent('statBest',state.bestStreak);setTextIfPresent('statLevels',state.stats.levelsCompleted);setTextIfPresent('statCards',state.stats.cardsCleared);
   setTextIfPresent('statHarvests',state.harvests);setTextIfPresent('statWindmills',state.stats.windmillsFound);setTextIfPresent('statWilds',state.stats.wildsPlayed);
   setTextIfPresent('statStreakBonuses',state.stats.streakBonuses);setTextIfPresent('statStreakCoins',(state.stats.streakCoins||0).toLocaleString());setTextIfPresent('statBonusDraws',state.stats.streakBonusDraws);
   setTextIfPresent('statTimedHarvests',state.stats.timedHarvestClaims||0);setTextIfPresent('statTimedCoins',(state.stats.timedHarvestCoins||0).toLocaleString());
   setTextIfPresent('statPerfect',state.stats.perfectClears||0);setTextIfPresent('statThreeStars',state.stats.threeStarClears||0);setTextIfPresent('statStars',state.stats.starsEarned||0);
   setTextIfPresent('statHappiness',state.rosieHappiness||0);setTextIfPresent('statRosieFinds',state.stats.rosieFinds||0);setTextIfPresent('statTreasures',state.stats.rosieTreasures||0);
   setTextIfPresent('statTreats',`${state.stats.treatsFound||0} / ${state.stats.treatsFed||0}`);setTextIfPresent('statPowers',state.stats.powersUsed||0);
   setTextIfPresent('statSpecialCards',state.stats.specialCardsCleared||0);setTextIfPresent('statGoldenCards',state.stats.goldenCardsCleared||0);
   setTextIfPresent('statGoldenGems',state.stats.goldenGems||0);setTextIfPresent('statShearsUsed',state.stats.shearsUsed||0);setTextIfPresent('statObstacleLevels',state.stats.obstacleLevelsCleared||0);setTextIfPresent('statRegionsUnlocked',Math.min((state.region||0)+1,DSH.Farm.regions.length));setTextIfPresent('statRegionDecorations',state.stats.regionDecorationsOwned||0);setTextIfPresent('statApples',state.stats.applesHarvested||0);
   setTextIfPresent('statDailyStarted',state.stats.dailyChallengesStarted||0);setTextIfPresent('statDailyCompleted',state.stats.dailyChallengesCompleted||0);
   setTextIfPresent('statDailyPerfect',state.stats.dailyPerfectClears||0);setTextIfPresent('statDailyStreak',state.stats.dailyBestWinStreak||0);setTextIfPresent('statTier2',state.stats.tier2UpgradesOwned||0);
   setTextIfPresent('statRosieRescueClears',state.stats.rosieRescueCardsCleared||0);setTextIfPresent('statRosieRescueNudges',state.stats.rosieRescueNudges||0);setTextIfPresent('statRosieRescueSwaps',state.stats.rosieRescueSwaps||0);
   setTextIfPresent('statMissionsChosen',state.stats.missionsChosen||0);setTextIfPresent('statMissionsCompleted',state.stats.missionsCompleted||0);setTextIfPresent('statMissionsFailed',state.stats.missionsFailed||0);
   setTextIfPresent('statFarmOrders',state.stats.farmOrdersCompleted||0);setTextIfPresent('statFarmOrderCoins',(state.stats.farmOrderCoinsEarned||0).toLocaleString());setTextIfPresent('statInDemandHarvests',state.stats.inDemandHarvests||0);
   setTextIfPresent('statMilestones',state.stats.milestonesCompleted||0);setTextIfPresent('statMilestoneCoins',(state.stats.milestoneCoinsEarned||0).toLocaleString());setTextIfPresent('statMilestoneGems',state.stats.milestoneGemsEarned||0);
   setTextIfPresent('statRosieAdventures',state.stats.rosieAdventuresCompleted||0);setTextIfPresent('statAdventureCoins',(state.stats.rosieAdventureCoins||0).toLocaleString());setTextIfPresent('statAdventureGems',state.stats.rosieAdventureGems||0);setTextIfPresent('statAdventureRare',state.stats.rosieAdventureRareFinds||0);
   setTextIfPresent('statRosieToys',state.stats.rosieToysFound||0);setTextIfPresent('statTrophies',state.stats.trophiesUnlocked||0);setTextIfPresent('statReserveUses',state.stats.reserveUses||0);setTextIfPresent('statChallengeWins',state.stats.challengeHandsWon||0);setTextIfPresent('statLuckyWins',state.stats.luckyHandsWon||0);
   setTextIfPresent('statLifetimeCoins',(state.lifetime?.coinsEarned||0).toLocaleString());setTextIfPresent('statLifetimeGems',(state.lifetime?.gemsEarned||0).toLocaleString());
   setTextIfPresent('statAchievements',state.stats.achievementsUnlocked||0);setTextIfPresent('saveVersion',DSH.Save.VERSION);
   const al=document.getElementById('achievementList');
   if(al){
     const defs=DSH.Config.achievements,labels={
       firstHarvest:'🌾 First Harvest',level10:'🔟 Ten Levels Down',bestFriend:"🐾 Rosie's Best Friend",
       perfectFarmer:'⭐ Perfect Farmer',bigHarvest:'🏆 Big Harvest'
     };
     al.innerHTML=Object.keys(defs).map(k=>`<div class="achievement ${state.achievements[k]?'unlocked':'locked'}"><span>${labels[k]}</span><b>${state.achievements[k]?'Unlocked ✓':'+'+defs[k].gems+' 💎'}</b></div>`).join('');
   }
 }
 function applyAccessibilitySettings(){
   document.body.classList.toggle('reduced-motion',!!state.settings.reducedMotion);
   document.body.classList.toggle('high-contrast-cards',!!state.settings.highContrast);
   document.body.classList.toggle('large-card-values',!!state.settings.largeCardValues);
   document.body.classList.toggle('suit-aid',!!state.settings.colorIndependentSuits);
 }
 function renderBackupStatus(){
   const e=document.getElementById('backupStatus');if(!e)return;
   const list=DSH.Save.backupInfo(),ready=list.filter(x=>x.exists&&!x.invalid).length;
   const slots=list.filter(x=>x.exists&&!x.invalid).map(x=>`${['A','B','C'][x.slot-1]}: L${x.level}${x.at?' @ '+new Date(x.at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):''}`).join(' • ');
   e.textContent=`Automatic rotating backups: ${ready}/3 available${slots?' • '+slots:''}`+(list.some(x=>x.invalid)?' • one backup is invalid':'');
   const restore=document.getElementById('restoreBackupBtn');if(restore)restore.disabled=!list[0]?.exists||!!list[0]?.invalid;
 }
 function renderSettings(){
   document.getElementById('sfxToggle').textContent='SFX: '+(state.settings.sfx?'On':'Off');
   document.getElementById('motionToggle').textContent='Motion: '+(state.settings.reducedMotion?'Reduced':'Full');
   setTextIfPresent('contrastToggle','Contrast: '+(state.settings.highContrast?'High':'Normal'));
   setTextIfPresent('largeValuesToggle','Values: '+(state.settings.largeCardValues?'Large':'Normal'));
   setTextIfPresent('suitAidToggle','Suit Aid: '+(state.settings.colorIndependentSuits?'On':'Off'));
   setTextIfPresent('tutorialToggle','Notices: '+(state.settings.tutorialNotices?'On':'Off'));
   const vol=document.getElementById('sfxVolume');if(vol)vol.value=Math.round((state.settings.sfxVolume??.65)*100);
   setTextIfPresent('sfxVolumeLabel',Math.round((state.settings.sfxVolume??.65)*100)+'%');
   const health=state.saveHealth||{},status=document.getElementById('saveDoctorStatus');
   if(status)status.textContent=health.lastCheckAt?`${health.lastIssueCount?'Last check repaired '+health.lastIssueCount+' issue(s)':'Last check: healthy'} • ${new Date(health.lastCheckAt).toLocaleString()}`:'Not checked yet.';
   renderBackupStatus();applyAccessibilitySettings();
 }
 function exportText(){const t=JSON.stringify(DSH.Save.wrap(state),null,2);document.getElementById('saveText').value=t;return t}
 function importText(t){
   try{
     const preview=DSH.Save.inspect(t);
     if(!preview.checksumValid){alert('This backup failed its checksum and was not imported.');return false}
     const s=preview.summary,issues=preview.issues.length?`\n\nSave Doctor will repair ${preview.issues.length} structural issue(s) during import.`:'';
     if(!confirm(`Import this save?\n\nLevel ${s.level} • ${s.coins.toLocaleString()} coins • ${s.gems} gems\nRosie Happiness ${s.rosieHappiness}% • ${s.trophies} trophies\nChecksum: ${preview.checksumPresent?(preview.checksumValid?'Valid':'Invalid'):'Legacy backup (no checksum)'}${issues}\n\nYour current local save will be placed in the rotating backups first.`))return false;
     DSH.Save.forceBackup();state=preview.state;state.saveHealth.lastCheckAt=Date.now();state.saveHealth.lastIssueCount=preview.issues.length;if(preview.issues.length)state.saveHealth.lastRepairAt=Date.now();
     DSH.Audio.bindState(state);DSH.Farm.bind(state,commit,msg,showRewardToast);DSH.Save.save(state,{skipBackup:true});handStarted=false;game={};history=[];
     renderAllBalances();renderStats();renderSettings();DSH.Farm.render();msg('Save imported and validated successfully.');showRewardToast('Save Imported',`Level ${state.level} • checksum valid${preview.issues.length?' • repaired '+preview.issues.length+' issue(s)':''}`,'💾');return true
   }catch(e){alert('That save could not be imported. '+(e?.message||'Please verify the backup.'));return false}
 }
 function downloadBackup(){const t=exportText(),blob=new Blob([t],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`denises-solitaire-harvest-v${DSH.Save.VERSION}-level-${state.level}-${new Date().toISOString().slice(0,10)}.dshsave`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 function checkAndRepairSave(){
   const r=DSH.Save.doctor(state),count=r.issues.length;
   if(count)DSH.Save.forceBackup();
   state=r.state;state.saveHealth.lastCheckAt=Date.now();state.saveHealth.lastIssueCount=count;if(count)state.saveHealth.lastRepairAt=Date.now();
   DSH.Audio.bindState(state);DSH.Farm.bind(state,commit,msg,showRewardToast);DSH.Save.save(state,{skipBackup:true});
   renderAllBalances();renderStats();renderSettings();DSH.Farm.render();
   if(count)showRewardToast('Save Repaired',`${count} issue${count===1?'':'s'} repaired • pre-repair backup created`,'🩺');
   else showRewardToast('Save Healthy','No structural problems detected.','✅');
   return r;
 }
 function restoreLatestBackup(){
   const info=DSH.Save.backupInfo();if(!info[0]?.exists||info[0]?.invalid){alert('There is no healthy automatic backup in slot A.');return}
   if(!confirm(`Restore automatic backup A (Level ${info[0].level})? Your current save will be backed up first.`))return;
   DSH.Save.forceBackup();
   try{state=DSH.Save.restoreBackup(2);DSH.Audio.bindState(state);DSH.Farm.bind(state,commit,msg,showRewardToast);DSH.Save.save(state,{skipBackup:true});handStarted=false;game={};history=[];renderAllBalances();renderStats();renderSettings();DSH.Farm.render();showMain();showRewardToast('Backup Restored',`Restored Level ${state.level}`,'💾')}
   catch(e){alert('Backup restore failed: '+e.message)}
 }

 function resetGameSave(){
   if(!confirm('Reset ALL Denise’s Solitaire Harvest progress on this browser? This cannot be undone unless you exported a backup.'))return;
   const typed=prompt('Type RESET to permanently erase the save.');
   if(typed!=='RESET'){msg('Reset cancelled.');return}
   state=DSH.Save.reset();DSH.Save.save(state);
   DSH.Audio.bindState(state);DSH.Farm.bind(state,commit,msg,showRewardToast);
   game={};history=[];lastExposed=new Set();locked=false;handStarted=false;handComplete=false;devUnlocked=false;devTrophyChecksPaused=false;mechanicNoticeQueue=[];mechanicNoticeActive=false;
   document.getElementById('saveText').value='';
   renderAllBalances();renderStats();renderSettings();DSH.Farm.render();renderDailyUI();
   showMain();showRewardToast('Fresh Farm Started','Game save reset to defaults.','🌱');
 }
 function openDeveloperMenu(){
   if(devUnlocked){renderDevSummary();open('devOverlay');return}
   document.getElementById('devPasswordInput').value='';setTextIfPresent('devPasswordError','');open('devLoginOverlay');
   setTimeout(()=>document.getElementById('devPasswordInput').focus(),50);
 }
 function unlockDeveloperMenu(){
   const value=document.getElementById('devPasswordInput').value;
   if(value!=='failspy'){setTextIfPresent('devPasswordError','Incorrect password.');DSH.Audio.play.bad();return}
   devUnlocked=true;document.getElementById('devPasswordInput').value='';setTextIfPresent('devPasswordError','');close('devLoginOverlay');renderDevSummary();open('devOverlay');
 }
 function renderDevSummary(){
   const e=document.getElementById('devStateSummary');if(!e)return;
   e.innerHTML=`<b>Current State</b><span>Level ${state.level} • ${state.coins.toLocaleString()} coins • ${state.gems} gems</span><span>Rosie ${state.rosieHappiness}/100 • Region ${(state.region||0)+1}/5 • Orders ${(state.farmOrders||[]).length}/3</span>`;
   const li=document.getElementById('devLevelInput');if(li)li.value=state.level;
 }
 function afterDev(label){
   state.stats.developerActions=(state.stats.developerActions||0)+1;DSH.Save.save(state);
   renderAllBalances();renderStats();DSH.Farm.render();renderDailyUI();refreshCollectionKnowledge();renderDevSummary();
   showRewardToast('Developer Tool',label,'🛠️');
 }
 function revealAlmanac(){
   refreshCollectionKnowledge();const c=state.collection;
   Object.keys(DSH.Config.almanac.specials).forEach(k=>c.specials[k]=true);
   Object.keys(DSH.Config.crops).forEach(k=>c.crops[k]=true);
   DSH.Config.farmRegions.forEach((r,i)=>c.regions[i]=true);
   ['windmill','gate','rescue','dice','seed','sun','shears','dice2','seed2','sun2'].forEach(k=>c.powers[k]=true);
   ['petted','find','rescue','bestFriend','treasure'].forEach(k=>c.rosie[k]=true);
 }
 function setDevReport(text){const e=document.getElementById('devReport');if(e)e.value=typeof text==='string'?text:JSON.stringify(text,null,2)}
 function runCorruptionRepairTest(){
   const bad=JSON.parse(JSON.stringify(state));bad.coins=-999;bad.gems='oops';bad.level=0;bad.rosieHappiness=900;bad.plots=[{type:'not-a-crop',age:-4}];bad.rosieAdventure={duration:'bogus',startedAt:9,endsAt:2};
   const r=DSH.Save.doctor(bad);
   return `SAFE CORRUPTION/REPAIR TEST (copy only; real save unchanged)\nIssues detected: ${r.issues.length}\n${r.issues.map(x=>' - '+x).join('\n')}\n\nRepaired sample: Level ${r.state.level}, ${r.state.coins} coins, ${r.state.gems} gems, Rosie ${r.state.rosieHappiness}/100, plots ${r.state.plots.length}`;
 }
 function runDevAction(action){
   if(!devUnlocked)return openDeveloperMenu();
   if(action==='levelAudit'){setDevReport(DSH.Diagnostics.textReport(state,{from:1,to:500,samples:6}));showRewardToast('Diagnostics Complete','3,000 procedural boards audited.','🧪');return}
   if(action==='economy'){setDevReport(JSON.stringify(DSH.Diagnostics.economySnapshot(state),null,2));return}
   if(action==='validateSave'){setDevReport(JSON.stringify(DSH.Diagnostics.saveReport(state),null,2));return}
   if(action==='repairTest'){setDevReport(runCorruptionRepairTest());return}
   if(action==='sampleLevels'){
     const out=[1,50,100,500].map(level=>{const b=DSH.Levels.build(level);return{level,name:b.name,cards:b.cards.length,stock:b.stockTarget,compensation:b.obstacleStockBonus,specials:b.specialCounts}});setDevReport(JSON.stringify(out,null,2));return
   }
   if(action==='resetTutorials'){state.seenMechanics={};mechanicNoticeQueue=[];DSH.Save.save(state);afterDev('Mechanic notices reset');return}
   if(action==='animations'){showRosiePawTrail();DSH.Audio.play.achievement();showRewardToast('Animation Test','Rosie paws • reward particles • achievement sound','🐾');return}
   if(action==='coins'){state.coins+=10000;afterDev('+10,000 coins');return}
   if(action==='gems'){state.gems+=100;afterDev('+100 gems');return}
   if(action==='powers'){
     state.windmills+=5;state.magicGates+=5;state.rosieRescues+=5;state.rosieTreats+=5;
     state.stats.windmillsFound+=5;state.stats.magicGatesFound+=5;state.stats.rosieRescuesFound+=5;state.stats.treatsFound+=5;afterDev('+5 Windmills, Gates, Rescues, and Treats');return
   }
   if(action==='happiness'){state.rosieHappiness=100;afterDev('Rosie Happiness set to 100');return}
   if(action==='harvest'){state.timedHarvestAt=Date.now()-DSH.Config.timedHarvest.ms*DSH.Config.timedHarvest.cap;afterDev('Timed harvest forced to 3/3 FULL');return}
   if(action==='mature'){state.plots=state.plots.map(p=>p?{...p,age:DSH.Config.crops[p.type]?.grow||99}:p);afterDev('All planted crops matured');return}
   if(action==='unlockPowers'){
     state.magicDiceUnlocked=state.luckySeedUnlocked=state.sunCharmUnlocked=true;
     state.magicDiceTier2=state.luckySeedTier2=state.sunCharmTier2=true;state.stats.tier2UpgradesOwned=3;afterDev('All permanent shop powers and Tier II unlocked');return
   }
   if(action==='unlockFarm'){
     state.region=DSH.Config.farmRegions.length-1;state.farmRegionView=state.region;
     Object.keys(state.upgrades).forEach(k=>state.upgrades[k]=true);
     state.regionRewardsClaimed={};DSH.Config.farmRegions.forEach((r,i)=>state.regionRewardsClaimed[i]=true);
     state.regionDecorations={};DSH.Config.farmRegions.forEach(r=>state.regionDecorations[r.decor.key]=true);
     state.stats.regionDecorationsOwned=DSH.Config.farmRegions.length;afterDev('All regions, decorations, and farm upgrades unlocked');return
   }
   if(action==='almanac'){revealAlmanac();afterDev('Harvest Almanac fully revealed');return}
   if(action==='orders'){DSH.Farm.ensureOrders(true);afterDev('Farm Orders regenerated');return}
   if(action==='completeOrders'){DSH.Farm.ensureOrders();(state.farmOrders||[]).forEach(o=>{Object.keys(o.requirements||{}).forEach(k=>o.progress[k]=o.requirements[k]);o.ready=true;o.readyCoinBase=o.rewardCoins;o.completedAt=Date.now()});afterDev('All Farm Orders marked ready for manual collection');return}
   if(action==='daily'){state.dailyLastClaimDate='';state.dailyLastWinDate='';renderDailyUI();afterDev('Daily Challenge claim/streak cleared');return}
   if(action==='finishAdventure'){if(state.rosieAdventure)state.rosieAdventure.endsAt=Date.now()-1;afterDev('Rosie Adventure finished instantly');return}
   if(action==='toy'){
     const keys=Object.keys(DSH.Config.farmhouse.toys),missing=keys.filter(k=>!state.rosieToys[k]),k=(missing.length?missing:keys)[Math.floor(Math.random()*(missing.length?missing.length:keys.length))];
     state.rosieToys[k]=true;state.stats.rosieToysFound=Math.max(state.stats.rosieToysFound||0,Object.values(state.rosieToys).filter(Boolean).length);afterDev(`Gave Rosie toy: ${DSH.Config.farmhouse.toys[k].name}`);return
   }
   if(action==='trophy'){unlockFarmhouseTrophy('unbroken');afterDev('Unlocked test trophy: Unbroken');return}
   if(action==='unclaimTrophy'){state.farmhouseTrophies.unbroken=true;state.farmhouseTrophyRewardsClaimed=state.farmhouseTrophyRewardsClaimed||{};delete state.farmhouseTrophyRewardsClaimed.unbroken;afterDev('Unbroken trophy reward marked unclaimed for testing');return}
   if(action==='tierProgress'){state.harvests=Math.max(state.harvests||0,100);state.stats.levelsCompleted=Math.max(state.stats.levelsCompleted||0,100);state.stats.rosieAdventuresCompleted=Math.max(state.stats.rosieAdventuresCompleted||0,50);checkFarmhouseAchievements();afterDev('Added achievement-tier progress');return}
   if(action==='chapterKeepsakes'){for(let n=10;n<=100;n+=10){state.milestonesCleared[n]=true;state.chapterMemorabilia[n]=true}afterDev('Completed all Chapter Wall keepsakes');return}
   if(action==='resetTrophies'){devTrophyChecksPaused=true;state.farmhouseTrophies={};state.farmhouseTierClaims={};state.stats.trophiesUnlocked=0;state.stats.tierAchievementsUnlocked=0;DSH.Save.save(state);renderDevSummary();showRewardToast('Developer Tool','Trophy/tier flags reset and automatic trophy checks paused for this session. Previous rewards were not removed.','🛠️');return}
   if(action==='resumeTrophies'){devTrophyChecksPaused=false;checkFarmhouseAchievements();afterDev('Automatic trophy checks resumed');return}
   if(action==='rareAdventure'){
     if(!state.rosieAdventure)state.rosieAdventure={region:Math.min(state.region||0,4),duration:'sniff',startedAt:Date.now()-1800000,endsAt:Date.now()-1};
     DSH.Farm.claimAdventure(true);afterDev('Forced a completed Rosie Adventure with a rare find');return
   }
   if(action==='weather'){DSH.Weather.cycleOverride(state);afterDev('Weather advanced to '+DSH.Weather.weather(state).name);return}
   if(action==='event'){DSH.Weather.cycleEvent(state);afterDev('Farm event set to '+DSH.Weather.event(state).name);return}
   if(action==='festival'){state.eventOverride='festival';state.eventOverrideUntil=Date.now()+43200000;const dk=DSH.Weather.dayKey();state.eventProgress[dk]=3;state.eventClaimed[dk]=true;state.coins+=500;state.gems+=2;state.stats.festivalClaims=(state.stats.festivalClaims||0)+1;afterDev('Harvest Festival objective completed');return}
 }
 function devSetLevel(){
   if(!devUnlocked)return openDeveloperMenu();
   const n=Math.max(1,Math.min(9999,parseInt(document.getElementById('devLevelInput').value,10)||1));
   state.level=n;state.highestLevelReached=n;state.region=Math.min(DSH.Config.farmRegions.length-1,Math.floor((n-1)/4));state.farmRegionView=state.region;
   handStarted=false;handComplete=false;game={};afterDev(`Level set to ${n}`);
 }

 setInterval(renderMainRosieStatus,15000);

 const stockWrap=document.getElementById('stockWrap');stockWrap.onclick=draw;stockWrap.tabIndex=0;stockWrap.setAttribute('role','button');stockWrap.setAttribute('aria-label','Draw next stock card');stockWrap.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();draw()}};
 document.getElementById('reserveBtn').onclick=useReserve;document.getElementById('undoBtn').onclick=undo;const pouchTrigger=document.getElementById('magicPouchBtn');
 pouchTrigger.setAttribute('aria-expanded','false');
 pouchTrigger.onclick=()=>setPouch(!document.getElementById('magicPouchPanel').classList.contains('open'));
 document.getElementById('closePouchBtn').onclick=()=>setPouch(false);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')setPouch(false)});
 document.getElementById('windmillBtn').onclick=useWindmill;
 document.getElementById('shearsBtn').onclick=toggleShearsMode;
 document.getElementById('diceBtn').onclick=toggleDice;document.getElementById('seedBtn').onclick=toggleSeed;document.getElementById('sunBtn').onclick=useSunCharm;
 document.querySelectorAll('[data-shop]').forEach(b=>b.onclick=()=>buyShopItem(b.dataset.shop));document.querySelectorAll('[data-shop-tier2]').forEach(b=>b.onclick=()=>buyTier2(b.dataset.shopTier2));document.getElementById('buyDrawsBtn').onclick=buyDraws;document.getElementById('gateBtn').onclick=toggleGateMode;document.getElementById('rosieBtn').onclick=useRosieRescue;
 document.getElementById('challengeNormalBtn').onclick=()=>{game.challengeDecisionMade=true;game.challengeOfferOpen=false;document.getElementById('challengeOfferOverlay').classList.remove('show');setTimeout(collectMechanicNotices,100)};
 document.getElementById('challengeAcceptBtn').onclick=()=>{
   if(!game.challengeOfferOpen&&!document.getElementById('challengeOfferOverlay').classList.contains('show'))return;
   game.challengeDecisionMade=true;game.challengeOfferOpen=false;applyChallengeMutators();
   document.getElementById('challengeOfferOverlay').classList.remove('show');render(true);showRewardToast('🔥 Challenge Accepted',`Win for +${DSH.Config.specialCards.challengeCoins} coins +${DSH.Config.specialCards.challengeGems} 💎`,'🔥')
 };
 document.getElementById('fullscreenBtn').onclick=toggleFullscreen;
 document.getElementById('homeBtn').onclick=()=>{if(locked){msg('Finish the current card animation first.');return}open('pauseOverlay')};document.getElementById('resumeBtn').onclick=()=>close('pauseOverlay');
 document.getElementById('restartBtn').onclick=restartCurrent;document.getElementById('pauseMainMenuBtn').onclick=showMain;
 document.getElementById('playBtn').onclick=ensureHand;
 document.getElementById('mainDailyBtn').onclick=()=>openSection('dailyOverlay');
 document.getElementById('dailyPlayBtn').onclick=ensureDaily;
 document.getElementById('skipMissionBtn').onclick=skipMission;
 document.getElementById('mainShopBtn').onclick=()=>openSection('shopOverlay');document.getElementById('mainFarmBtn').onclick=()=>openSection('farmOverlay');document.getElementById('mainOptionsBtn').onclick=()=>openSection('optionsOverlay');
 document.getElementById('mainStatsBtn').onclick=()=>openSection('statsOverlay');
 document.getElementById('mainCollectionBtn').onclick=()=>openSection('collectionOverlay');
 document.getElementById('mainHouseBtn').onclick=()=>openSection('farmhouseOverlay');
 document.querySelectorAll('.farmhouseTab').forEach(b=>b.onclick=()=>renderFarmhouse(b.dataset.houseTab));
 document.querySelectorAll('.collectionTab').forEach(b=>b.onclick=()=>renderCollection(b.dataset.collectionTab));
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{close(b.dataset.close);if(b.classList.contains('backToMain'))open('mainMenuOverlay')});
 document.querySelectorAll('.sectionOverlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o){close(o.id);open('mainMenuOverlay')}}));
 document.getElementById('nextBtn').onclick=()=>{if(game.dailyMode)showMain();else startLevel()};
 document.getElementById('winMainMenuBtn').onclick=()=>{handComplete=true;handStarted=false;showMain()};
 document.querySelectorAll('[data-crop]').forEach(b=>b.onclick=()=>DSH.Farm.plant(b.dataset.crop));document.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>DSH.Farm.upgrade(b.dataset.upgrade));
 document.getElementById('timedHarvestBtn').onclick=()=>DSH.Farm.claimTimedHarvest();
 document.getElementById('prevRegionBtn').onclick=()=>DSH.Farm.setRegion(-1);
 document.getElementById('nextRegionBtn').onclick=()=>DSH.Farm.setRegion(1);
 document.getElementById('petRosieBtn').onclick=()=>DSH.Farm.petRosie();
 document.getElementById('rosie').onclick=()=>DSH.Farm.petRosie();
 document.getElementById('feedTreatBtn').onclick=()=>DSH.Farm.feedTreat();
 document.getElementById('cancelPowerBtn').onclick=cancelTargetPower;
 setInterval(()=>{DSH.Farm.renderTimedHarvest();DSH.Farm.renderHappiness();DSH.Farm.renderAdventure()},1000);
 setInterval(()=>{renderDailyUI();renderWeatherBulletin()},60000);
 document.getElementById('exportBtn').onclick=exportText;document.getElementById('downloadBackupBtn').onclick=downloadBackup;document.getElementById('importBtn').onclick=()=>importText(document.getElementById('saveText').value);
 document.getElementById('backupFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>importText(r.result);r.readAsText(f);e.target.value=''};
 document.getElementById('checkSaveBtn').onclick=checkAndRepairSave;
 document.getElementById('restoreBackupBtn').onclick=restoreLatestBackup;
 document.getElementById('mechanicNoticeOk').onclick=closeMechanicNotice;
 document.getElementById('mainRosiePeek').onclick=()=>openSection('farmOverlay');
 document.getElementById('copyDevReportBtn').onclick=async()=>{const text=document.getElementById('devReport').value;if(!text)return;try{await navigator.clipboard.writeText(text);showRewardToast('Copied','Diagnostic report copied to clipboard.','📋')}catch(e){document.getElementById('devReport').select();document.execCommand?.('copy')}};
 document.getElementById('resetSaveBtn').onclick=resetGameSave;
 document.getElementById('openDevBtn').onclick=openDeveloperMenu;
 document.getElementById('devUnlockBtn').onclick=unlockDeveloperMenu;
 document.getElementById('devPasswordInput').addEventListener('keydown',e=>{if(e.key==='Enter')unlockDeveloperMenu()});
 document.querySelectorAll('[data-dev]').forEach(b=>b.onclick=()=>runDevAction(b.dataset.dev));
 document.getElementById('devSetLevelBtn').onclick=devSetLevel;
 document.getElementById('sfxToggle').onclick=()=>{state.settings.sfx=!state.settings.sfx;DSH.Save.save(state);renderSettings();if(state.settings.sfx)DSH.Audio.play.card()};
 const vol=document.getElementById('sfxVolume');vol.oninput=()=>{state.settings.sfxVolume=Number(vol.value)/100;setTextIfPresent('sfxVolumeLabel',vol.value+'%')};vol.onchange=()=>{DSH.Save.save(state);if(state.settings.sfx)DSH.Audio.play.card()};
 document.getElementById('motionToggle').onclick=()=>{state.settings.reducedMotion=!state.settings.reducedMotion;DSH.Save.save(state);renderSettings()};
 document.getElementById('contrastToggle').onclick=()=>{state.settings.highContrast=!state.settings.highContrast;DSH.Save.save(state);renderSettings();if(handStarted)render()};
 document.getElementById('largeValuesToggle').onclick=()=>{state.settings.largeCardValues=!state.settings.largeCardValues;DSH.Save.save(state);renderSettings();if(handStarted)render()};
 document.getElementById('suitAidToggle').onclick=()=>{state.settings.colorIndependentSuits=!state.settings.colorIndependentSuits;DSH.Save.save(state);renderSettings();if(handStarted)render()};
 document.getElementById('tutorialToggle').onclick=()=>{state.settings.tutorialNotices=!state.settings.tutorialNotices;if(!state.settings.tutorialNotices){mechanicNoticeQueue=[];if(mechanicNoticeActive)closeMechanicNotice()}DSH.Save.save(state);renderSettings()};
 document.addEventListener('keydown',e=>{
   if(['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
   if(!handStarted||document.querySelector('.overlay.open')||document.getElementById('previewChoiceOverlay').classList.contains('show')||document.getElementById('challengeOfferOverlay').classList.contains('show'))return;
   const k=e.key.toLowerCase();
   if(k==='d'){e.preventDefault();draw()}
   else if(k==='r'){e.preventDefault();useReserve()}
   else if(k==='u'){e.preventDefault();undo()}
   else if(k==='p'){e.preventDefault();setPouch(!document.getElementById('magicPouchPanel').classList.contains('open'))}
 });
 window.addEventListener('resize',()=>{if(handStarted)render()});

 renderAllBalances();renderStats();renderSettings();DSH.Farm.render();open('mainMenuOverlay');
 if(state._recoveredFromBackup){const slot=state._recoveredFromBackup;delete state._recoveredFromBackup;DSH.Save.save(state,{skipBackup:true});setTimeout(()=>showRewardToast('Save Recovered',`Primary save was unreadable. Restored automatic backup ${slot}.`,'🩺'),350)}
});