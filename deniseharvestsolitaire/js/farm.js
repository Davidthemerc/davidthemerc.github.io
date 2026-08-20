window.DSH=window.DSH||{};
DSH.Farm=(()=>{
 const C=DSH.Config, cropDefs=C.crops;
 const regionDefs=C.farmRegions,regions=regionDefs.map(r=>r.name);
 let state,onChange,onMessage,onReward,chosenPlot=null;
 let lastHarvestPattern=null;
 const TIMED_MS=C.timedHarvest.ms,TIMED_CAP=C.timedHarvest.cap;

 function bind(s,change,message,reward){state=s;onChange=change;onMessage=message;onReward=reward}
 function seasonRewardText(r){return DSH.Seasons?.rewardText?DSH.Seasons.rewardText(r):''}
 function announceSeasonResult(result){
   if(!result?.completed)return;
   const extra=result.firstKeepsake?` • New keepsake: ${result.info.icon} ${result.info.keepsake}`:'';
   onReward?.(`${result.info.icon} ${result.info.name} Basket Complete!`,`${seasonRewardText(result.reward)}${extra}`,result.info.icon);
 }
 function orderDateKey(d=new Date()){
   const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
   return `${y}-${m}-${day}`;
 }
 function hashText(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
 function unlockedCropKeys(){return Object.entries(cropDefs).filter(([k,d])=>(state.region||0)>=d.minRegion).map(([k])=>k)}
 function ensureInDemand(){
   const key=orderDateKey(),unlocked=unlockedCropKeys();
   if(!unlocked.length)return;
   if(state.inDemandDate!==key||!unlocked.includes(state.inDemandCrop)){
     const idx=hashText(`DSH-demand-${key}`)%unlocked.length;
     state.inDemandDate=key;state.inDemandCrop=unlocked[idx];DSH.Save.save(state);
   }
 }
 function randomInt(min,max){return min+Math.floor(Math.random()*(max-min+1))}
 function makeOrder(tier){
   const T=C.farmOrders.tiers[tier],unlocked=unlockedCropKeys();
   const typeCount=Math.min(unlocked.length,randomInt(T.types[0],T.types[1]));
   const seasonOrder=DSH.Seasons?.orderFavors(state.level)||{info:null,crops:[]},favored=(seasonOrder.crops||[]).filter(k=>unlocked.includes(k));
   const shuffled=[...unlocked].sort(()=>Math.random()-.5);let pool=[];
   if(favored.length&&Math.random()<.72){const pick=favored[Math.floor(Math.random()*favored.length)];pool=[pick,...shuffled.filter(k=>k!==pick)].slice(0,typeCount)}
   else pool=shuffled.slice(0,typeCount);
   const req={},progress={};pool.forEach(k=>{req[k]=randomInt(T.qty[0],T.qty[1]);progress[k]=0});
   // Once the full farm is unlocked, orders slowly mature with campaign progress:
   // larger late-game requests, but with proportional rewards rather than grind for its own sake.
   const late=Math.max(0,Math.min(3,Math.floor(((state.level||1)-500)/175)));
   if(late>0)pool.forEach(k=>{req[k]+=late;progress[k]=0});
   const rawValue=pool.reduce((sum,k)=>sum+(cropDefs[k].payout||30)*req[k],0),seasonalFocus=!!favored.length&&pool.some(k=>favored.includes(k));
   const lateReward=1+late*.12,seasonalValue=seasonalFocus?1.10:1,coins=Math.max(80,Math.round(rawValue*T.rewardMult*lateReward*seasonalValue));
   const serial=++state.farmOrderSerial;
   return{id:`order-${serial}`,tier,requirements:req,progress,rewardCoins:coins,createdAt:Date.now(),seasonalFocus,seasonKey:seasonOrder.info?.key||'',seasonVariant:seasonOrder.info?.variant?.key||'',readySeasonMult:0,readySeasonKey:''};
 }
 function ensureOrders(force=false){
   ensureInDemand();
   const before=JSON.stringify(state.farmOrders||[]);
   if(force)state.farmOrders=[];
   if(!Array.isArray(state.farmOrders))state.farmOrders=[];
   const slots=C.farmOrders.slots;
   // Repair/migrate malformed orders and always maintain exactly one of each tier.
   state.farmOrders=state.farmOrders.filter(o=>o&&o.tier&&o.requirements&&o.progress&&C.farmOrders.tiers[o.tier]);
   const next=[];
   slots.forEach(tier=>{
     let o=state.farmOrders.find(x=>x.tier===tier);
     if(!o)o=makeOrder(tier);
     if(orderComplete(o)){
       o.ready=true;
       if(!Number.isFinite(Number(o.readyCoinBase)))o.readyCoinBase=Math.round(o.rewardCoins*(DSH.Weather?.effects(state).orderCoin||1));
       if(!Number.isFinite(Number(o.readySeasonMult))||Number(o.readySeasonMult)<=0){o.readySeasonMult=DSH.Seasons?.effects(state).orderCoin||1;o.readySeasonKey=DSH.Seasons?.info(state.level)?.key||''}
       o.completedAt=Number(o.completedAt)||Date.now();
     }
     next.push(o);
   });
   state.farmOrders=next;
   if(force||JSON.stringify(state.farmOrders)!==before)DSH.Save.save(state);
 }
 function orderComplete(o){return Object.entries(o.requirements).every(([k,q])=>(o.progress[k]||0)>=q)}
 function readyOrderCount(){if(!state)return 0;ensureOrders();return (state.farmOrders||[]).filter(o=>o&&(o.ready||orderComplete(o))).length}
 function collectOrder(id){
   ensureOrders();
   const o=state.farmOrders.find(x=>x.id===id);
   if(!o||!(o.ready||orderComplete(o))){onMessage('That Farm Order is not ready yet.');return false}
   const T=C.farmOrders.tiers[o.tier],h=DSH.Progress.clampHappiness(state);
   const frozenSeasonMult=Number(o.readySeasonMult)>0?Number(o.readySeasonMult):(DSH.Seasons?.effects(state).orderCoin||1);
   let gems=0,power='',clover=false,coins=Math.max(0,Math.round(Number(o.readyCoinBase)||o.rewardCoins));coins=Math.round(coins*frozenSeasonMult);if(state.upgrades.market)coins=Math.round(coins*1.15);
   if((state.rosieAdventureFinds?.clover||0)>0){
     state.rosieAdventureFinds.clover--;coins*=2;clover=true;
   }
   state.coins+=coins;
   state.stats.farmOrdersCompleted=(state.stats.farmOrdersCompleted||0)+1;
   state.stats.farmOrdersCollected=(state.stats.farmOrdersCollected||0)+1;
   state.stats.farmOrderCoinsEarned=(state.stats.farmOrderCoinsEarned||0)+coins;
   const happinessBonus=Math.min(.10,h/1000);
   if(Math.random()<T.gemChance+happinessBonus){state.gems++;gems=1;state.stats.farmOrderGemsEarned=(state.stats.farmOrderGemsEarned||0)+1}
   if(Math.random()<T.powerChance+happinessBonus){
     const r=Math.floor(Math.random()*4);
     if(r===0){state.windmills++;state.stats.windmillsFound++;power='Windmill 🌬️'}
     else if(r===1){state.magicGates++;state.stats.magicGatesFound++;power='Magic Gate 🚪'}
     else if(r===2){state.rosieRescues++;state.stats.rosieRescuesFound++;power='Rosie Rescue 🐾'}
     else{state.rosieTreats++;state.stats.treatsFound++;power='Rosie Treat 🦴'}
     state.stats.farmOrderPowersEarned=(state.stats.farmOrderPowersEarned||0)+1;
   }
   const idx=state.farmOrders.findIndex(x=>x.id===o.id);
   if(idx>=0)state.farmOrders[idx]=makeOrder(o.tier);
   const seasonResult=DSH.Seasons?.addProgress(state,'order',1,state.level);
   onChange();render();flashFarmBalance();announceSeasonResult(seasonResult);
   onReward?.(`${T.icon} ${T.label} Order Collected!`,`${coins} coins${clover?' • 🍀 Lucky Clover 2×':''}${gems?' • +1 💎':''}${power?' • '+power:''}`,T.icon);
   return true;
 }
 function advanceOrders(cropKey,opts={}){
   ensureOrders();
   // One harvested crop is one physical crop. It may satisfy at most ONE Farm Order.
   // Orders are considered in board order (Easy -> Standard -> Premium), so progress
   // finishes the earliest eligible order before spilling into the next one.
   let advanced=0,becameReady=0,progress=[];
   const eligible=state.farmOrders.find(o=>{
     if(!o)return false;
     if(o.ready||orderComplete(o)){o.ready=true;return false}
     return !!o.requirements[cropKey]&&((o.progress[cropKey]||0)<o.requirements[cropKey]);
   });
   if(eligible){
     const o=eligible,before=o.progress[cropKey]||0;
     o.progress[cropKey]=before+1;advanced=1;
     const ready=orderComplete(o);
     if(ready){
       o.ready=true;o.completedAt=Date.now();
       o.readyCoinBase=Math.round(o.rewardCoins*(DSH.Weather?.effects(state).orderCoin||1));
       o.readySeasonMult=DSH.Seasons?.effects(state).orderCoin||1;o.readySeasonKey=DSH.Seasons?.info(state.level)?.key||'';
       becameReady=1;
     }
     progress.push({id:o.id,tier:o.tier,cropKey,before,after:o.progress[cropKey],target:o.requirements[cropKey],ready});
   }
   if(advanced&&!opts.silent)onChange();
   return{advanced,completed:becameReady,becameReady,progress};
 }
 function renderOrders(){
   const box=document.getElementById('farmOrdersGrid');if(!box||!state)return;
   ensureOrders();ensureInDemand();
   const demand=cropDefs[state.inDemandCrop],readyCount=readyOrderCount(),clover=(state.rosieAdventureFinds?.clover||0)>0,seasonInfo=DSH.Seasons?.info(state.level),seasonFx=DSH.Seasons?.effects(state)||{};
   const badge=document.getElementById('inDemandBadge');
   if(badge)badge.textContent=`${readyCount?`📋 ${readyCount} reward${readyCount===1?'':'s'} waiting! • `:''}${demand?`🔥 In Demand: ${demand.icon} ${demand.name} +25%`:'🔥 In Demand: —'}`;
   box.innerHTML=state.farmOrders.map(o=>{
     const T=C.farmOrders.tiers[o.tier],ready=!!o.ready||orderComplete(o),parts=Object.entries(o.requirements).map(([k,q])=>{
       const d=cropDefs[k],p=Math.min(q,o.progress[k]||0);
       return `<span class="${p>=q?'done':''}">${d.icon} ${d.name} ${p}/${q}</span>`;
     }).join('');
     const base=Math.max(0,Math.round(Number(o.readyCoinBase)||o.rewardCoins)),orderSeasonMult=ready&&Number(o.readySeasonMult)>0?Number(o.readySeasonMult):(seasonFx.orderCoin||1),seasonBase=Math.round(base*orderSeasonMult),marketBase=state.upgrades.market?Math.round(seasonBase*1.15):seasonBase,shown=ready&&clover?marketBase*2:marketBase;
     const orderOrigin=DSH.Seasons?.byKey(o.seasonKey)||seasonInfo,readyOrigin=DSH.Seasons?.byKey(o.readySeasonKey)||seasonInfo,originFavors=orderOrigin?.variant?.orderCrops||[];
     const payoutBits=[];if(orderSeasonMult!==1)payoutBits.push(`${readyOrigin?.icon||'🍂'} ${readyOrigin?.variant?.name||readyOrigin?.name||'season'} ×${orderSeasonMult.toFixed(2)}${ready?' (locked)':''}`);if(state.upgrades.market)payoutBits.push('🪧 Farmstand ×1.15');if(ready&&clover)payoutBits.push('🍀 Clover ×2');
     const seasonalRequest=o.seasonalFocus?`<small class="seasonOrderNote">${orderOrigin?.icon||'🌾'} ${orderOrigin?.variant?.name||'Seasonal'} Request +10% base value${originFavors.length?` • favors ${originFavors.map(k=>cropDefs[k]?.icon||'').join(' ')}`:''}</small>`:'';
     return `<div class="farmOrderCard order-${o.tier}${ready?' order-ready':''}${o.seasonalFocus?' seasonal-order':''}" data-order-id="${o.id}">
       <div class="farmOrderTitle"><span>${T.icon}</span><b>${T.label} Order${ready?' • READY!':''}</b><strong>${shown} 🪙</strong></div>
       <div class="farmOrderReqs">${parts}</div>${seasonalRequest}
       ${payoutBits.length?`<small class="orderPayoutWhy">Payout modifiers: ${payoutBits.join(' • ')}</small>`:''}
       ${ready
         ?`<small>${clover?'🍀 Lucky Clover available — collect this order for 2× coins.':'Reward is waiting. Harvests no longer advance this order until collected.'}</small><button class="collectOrderBtn" data-collect-order="${o.id}">🎁 COLLECT REWARD</button>`
         :`<small>${o.tier==='premium'?'Best bonus odds':'Bonus gem/power chance'} • Rosie Happiness slightly improves bonuses</small>`}
     </div>`;
   }).join('');
   box.querySelectorAll('[data-collect-order]').forEach(b=>b.onclick=()=>collectOrder(b.dataset.collectOrder));
 }
 function unlockedRegionIndex(){return Math.max(0,Math.min(Number(state?.region)||0,regionDefs.length-1))}
 function activeRegionIndex(){
   const max=Math.max(0,Math.min(state.region||0,regionDefs.length-1));
   state.farmRegionView=Math.max(0,Math.min(Number(state.farmRegionView)||0,max));
   return state.farmRegionView;
 }
 function activeRegion(){return regionDefs[activeRegionIndex()]||regionDefs[0]}
 function ownsDecor(key){return !!state.regionDecorations?.[key]}
 function regionalCropMultiplier(plotRegion,type){
   let mult=1,def=cropDefs[type],r=regionDefs[plotRegion]||regionDefs[0];
   if(def&&def.homeRegion===plotRegion)mult+=C.regionalFarm.homeCropBonus;
   if(r.cropPayBonus)mult+=r.cropPayBonus;
   if(ownsDecor('lanterns'))mult+=C.regionalFarm.lanternCropBonus;
   return mult;
 }
 function timedCoinMultiplier(){
   let mult=1,r=activeRegion();
   if(r.timedCoinBonus)mult+=r.timedCoinBonus;
   if(ownsDecor('weatherVane'))mult+=C.regionalFarm.weatherVaneCoinBonus;
   return mult;
 }
 function timedGemChance(){
   let chance=C.timedHarvest.gemChance,r=activeRegion();
   chance+=r.timedGemBonus||0;
   if(ownsDecor('bench'))chance+=C.regionalFarm.benchGemBonus;
   return Math.min(.35,chance);
 }
 function regionFindBonus(){
   const r=activeRegion();
   return (r.rosieFindBonus||0)+(ownsDecor('footbridge')?C.regionalFarm.footbridgeFindBonus:0);
 }
 function setRegion(dir){
   const max=Math.max(0,Math.min(state.region||0,regionDefs.length-1));
   const next=Math.max(0,Math.min(max,activeRegionIndex()+dir));
   if(next===state.farmRegionView)return;
   state.farmRegionView=next;chosenPlot=null;onChange();render();
   onReward?.(`${regionDefs[next].icon} ${regionDefs[next].name}`,regionDefs[next].bonus,regionDefs[next].icon);
 }
 function claimRegionRewards(){
   state.regionRewardsClaimed=state.regionRewardsClaimed||{0:true};
   let claimed=[];
   for(let i=1;i<=Math.min(state.region||0,regionDefs.length-1);i++){
     if(state.regionRewardsClaimed[i])continue;
     const r=regionDefs[i],rw=r.reward||{};
     state.regionRewardsClaimed[i]=true;state.stats.regionRewardsClaimed=(state.stats.regionRewardsClaimed||0)+1;
     state.coins+=(rw.coins||0);state.gems+=(rw.gems||0);state.rosieTreats=(state.rosieTreats||0)+(rw.treats||0);
     state.rosieRescues=(state.rosieRescues||0)+(rw.rescues||0);state.magicGates=(state.magicGates||0)+(rw.gates||0);state.windmills=(state.windmills||0)+(rw.windmills||0);
     if(rw.rescues)state.stats.rosieRescuesFound=(state.stats.rosieRescuesFound||0)+rw.rescues;
     if(rw.gates)state.stats.magicGatesFound=(state.stats.magicGatesFound||0)+rw.gates;
     if(rw.windmills)state.stats.windmillsFound=(state.stats.windmillsFound||0)+rw.windmills;
     if(rw.treats)state.stats.treatsFound=(state.stats.treatsFound||0)+rw.treats;
     claimed.push({r,rw});
   }
   if(claimed.length){
     onChange();
     claimed.forEach(({r,rw})=>{
       const bits=[];if(rw.coins)bits.push(`${rw.coins} coins`);if(rw.gems)bits.push(`${rw.gems} 💎`);if(rw.treats)bits.push(`${rw.treats} 🦴`);if(rw.rescues)bits.push(`${rw.rescues} 🐾`);if(rw.gates)bits.push(`${rw.gates} 🚪`);if(rw.windmills)bits.push(`${rw.windmills} 🌬️`);
       onReward?.(`New Region: ${r.name}!`,bits.join(' • '),r.icon);
     });
   }
   return claimed;
 }
 function buyRegionDecor(){
   const r=activeRegion(),d=r.decor;if(!d)return;
   state.regionDecorations=state.regionDecorations||{};
   if(state.regionDecorations[d.key]){onMessage(`${d.name} is already placed here.`);return}
   if(state.gems<d.cost){onMessage(`You need ${d.cost} gems for ${d.name}.`);return}
   state.gems-=d.cost;state.regionDecorations[d.key]=true;
   state.stats.regionDecorationsOwned=(state.stats.regionDecorationsOwned||0)+1;
   addHappy(C.happiness.decoration);announceAchievements();onChange();render();
   onReward?.(`${d.icon} ${d.name} placed!`,`${d.desc} • Rosie +${C.happiness.decoration} ❤️`,d.icon);
 }
 function formatTime(ms){
   const sec=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(sec/60),s=sec%60;
   return `${m}:${String(s).padStart(2,'0')}`;
 }
 function timedStatus(now=Date.now()){
   let base=Number(state.timedHarvestAt)||now;
   if(base>now)base=now;
   const elapsed=Math.max(0,now-base),rawReady=Math.floor(elapsed/TIMED_MS),ready=Math.min(TIMED_CAP,rawReady);
   const full=rawReady>=TIMED_CAP;
   return{ready,rawReady,full,nextMs:full?0:TIMED_MS-(elapsed%TIMED_MS),base,elapsed};
 }
 function addHappy(n,label){
   const gained=DSH.Progress.addHappiness(state,n);
   if(gained&&label)onReward?.('Rosie Happiness',`+${gained} ❤️ ${label}`,'🐾');
   announceAchievements();
   return gained;
 }
 function announceAchievements(){
   const list=DSH.Progress.checkAchievements(state);
   if(list.length){
     const gems=list.reduce((a,x)=>a+x.gems,0);
     onReward?.('Achievement Unlocked!',`${list.map(x=>x.name).join(', ')} • +${gems} 💎`,'🏆');
   }
   return list;
 }
 function happinessFindChance(){
   return Math.min(.80,C.timedHarvest.rosieFindChance+DSH.Progress.happinessFindBonus(state)+regionFindBonus());
 }
 function cropRescueChance(){
   return Math.min(.70,C.cropRewards.rescueChance+DSH.Progress.happinessFindBonus(state));
 }
 function timedPayBase(){let pay=C.timedHarvest.baseCoins+C.timedHarvest.regionCoins*(state.region||0);if(state.upgrades.barn)pay=Math.round(pay*1.10);return Math.round(pay*timedCoinMultiplier())}
 function nextHarvestMultiplier(streak=(state.harvestStreak||0)+1){
   return 1+Math.min(C.timedHarvest.harvestStreakMax,streak*C.timedHarvest.harvestStreakStep);
 }
 function timedPay(){return Math.round(timedPayBase()*nextHarvestMultiplier())}

 function visit(){
   claimRegionRewards();
   const now=Date.now(),last=Number(state.lastFarmVisitAt)||0;
   if(now-last>=C.happiness.visitCooldownMs){
     state.lastFarmVisitAt=now;addHappy(C.happiness.visit,'Rosie is glad you visited.');
     onChange();render();
   }
 }
 function petRosie(){
   if(state.rosieAdventure){onMessage(Date.now()>=state.rosieAdventure.endsAt?'Welcome Rosie home and collect her Adventure rewards first.':'Rosie is out exploring right now. 🐾');return}
   const now=Date.now(),last=Number(state.lastPetAt)||0,wait=C.happiness.petCooldownMs-(now-last);
   if(wait>0){onMessage(`Rosie can be petted again in ${formatTime(wait)}.`);return}
   state.lastPetAt=now;state.stats.petRosieCount=(state.stats.petRosieCount||0)+1;state.collection=state.collection||{specials:{},crops:{},regions:{0:true},powers:{},rosie:{}};state.collection.rosie.petted=true;
   addHappy(C.happiness.pet,'Good girl!');
   onChange();render();onReward?.('Rosie loved that!',`+${C.happiness.pet} Happiness ❤️`,'💗');
 }
 function feedTreat(){
   if(state.rosieAdventure){onMessage(Date.now()>=state.rosieAdventure.endsAt?'Welcome Rosie home before giving her a treat.':'Rosie is out exploring right now. Save the treat for when she gets home. 🐾');return}
   if((state.rosieTreats||0)<=0){onMessage("Rosie doesn't have any treats right now.");return}
   state.rosieTreats--;state.stats.treatsFed=(state.stats.treatsFed||0)+1;
   addHappy(C.happiness.treat,'Treat time!');
   onChange();render();onReward?.('Treat for Rosie!',`+${C.happiness.treat} Happiness ❤️`,'🦴');
 }
 function maybeTreat(chance=C.cropRewards.treatChance){
   chance+=ownsDecor('birdbath')?C.regionalFarm.birdbathTreatBonus:0;
   if(Math.random()<chance){
     state.rosieTreats=(state.rosieTreats||0)+1;state.stats.treatsFound=(state.stats.treatsFound||0)+1;
     return 1;
   } return 0;
 }
 function awardRosieTreasure(){
   if((state.rosieHappiness||0)<C.happiness.max)return null;
   // Best Friend achievement must be checked before Happiness drops.
   announceAchievements();
   const T=C.rosieTreasure;
   const coins=T.coinsMin+Math.floor(Math.random()*(T.coinsMax-T.coinsMin+1));
   const gems=T.gemsMin+Math.floor(Math.random()*(T.gemsMax-T.gemsMin+1));
   state.coins+=coins;state.gems+=gems;
   const found=[];
   for(let i=0;i<T.consumables;i++){
     const r=Math.random();
     if(r<.34){state.windmills++;state.stats.windmillsFound++;found.push('🌬️')}
     else if(r<.67){state.magicGates=(state.magicGates||0)+1;state.stats.magicGatesFound++;found.push('🚪')}
     else{state.rosieRescues=(state.rosieRescues||0)+1;state.stats.rosieRescuesFound++;found.push('🐾')}
   }
   state.rosieHappiness=C.happiness.treasureReset;
   state.stats.rosieTreasures=(state.stats.rosieTreasures||0)+1;state.collection=state.collection||{specials:{},crops:{},regions:{0:true},powers:{},rosie:{}};state.collection.rosie.treasure=true;
   return{coins,gems,found};
 }
 function claimTimedHarvest(){
   const now=Date.now(),st=timedStatus(now);
   if(st.ready<=0){onMessage(`Next farm harvest in ${formatTime(st.nextMs)}.`);return}
   const count=st.ready;let coins=0,gems=0,rosie=0,gates=0,rescues=0,treats=0;
   for(let i=0;i<count;i++){
     state.harvestStreak=(state.harvestStreak||0)+1;
     state.stats.harvestStreakMax=Math.max(state.stats.harvestStreakMax||0,state.harvestStreak);
     const mult=nextHarvestMultiplier(state.harvestStreak);
     coins+=Math.round(timedPayBase()*mult);
     if(Math.random()<timedGemChance())gems++;
     if(Math.random()<happinessFindChance()){
       rosie++;
       addHappy(C.happiness.rosieFind);
       if(state.upgrades.fence&&Math.random()<.45){state.magicGates=(state.magicGates||0)+1;state.stats.magicGatesFound++;gates++}
       else{state.rosieRescues=(state.rosieRescues||0)+1;state.stats.rosieRescuesFound++;rescues++}
     }
     treats+=maybeTreat(C.timedHarvest.treatChance);
     addHappy(C.happiness.timedHarvest);
   }
   state.coins+=coins;state.gems+=gems;
   state.timedHarvestClaims=(state.timedHarvestClaims||0)+count;state.timedHarvestCoins=(state.timedHarvestCoins||0)+coins;state.timedHarvestGems=(state.timedHarvestGems||0)+gems;
   state.stats.timedHarvestClaims=(state.stats.timedHarvestClaims||0)+count;state.stats.timedHarvestCoins=(state.stats.timedHarvestCoins||0)+coins;state.stats.timedHarvestGems=(state.stats.timedHarvestGems||0)+gems;
   state.stats.rosieFinds=(state.stats.rosieFinds||0)+rosie;
   // If storage reached the 3-charge cap, all excess offline time is intentionally discarded.
   // This prevents the same old elapsed time from immediately producing another 3/3 batch.
   state.timedHarvestAt=st.full?now:(st.base+count*TIMED_MS);
   const treasure=awardRosieTreasure(),seasonResult=DSH.Seasons?.addProgress(state,'timed',count,state.level);
   DSH.Audio.play.harvest();announceAchievements();onChange();render();announceSeasonResult(seasonResult);
   let parts=[`${coins} coins`];
   if(gems)parts.push(`${gems} gem${gems===1?'':'s'}`);
   if(rosie)parts.push(`Rosie found ${gates+rescues} power${gates+rescues===1?'':'s'}`);
   if(treats)parts.push(`${treats} treat${treats===1?'':'s'}`);
   onReward?.('Farm Harvest!',parts.join(' • '),'🌾');
   if(rosie)onReward?.('ROSIE FOUND SOMETHING!',`${gates?'🚪 ×'+gates+' ':''}${rescues?'🐾 ×'+rescues:''}`.trim(),'🐕');
   if(treasure)onReward?.("ROSIE'S TREASURE!",`${treasure.coins} coins • ${treasure.gems} 💎 • ${treasure.found.join(' ')}`,'🎁');
   onMessage(`Claimed ${count} timed harvest${count===1?'':'s'}. Harvest streak: ${state.harvestStreak}.`);
 }
 function renderTimedHarvest(){
   const box=document.getElementById('timedHarvestBox');if(!box||!state)return;
   const st=timedStatus(),btn=document.getElementById('timedHarvestBtn');
   const pct=Math.round(Math.min(C.timedHarvest.harvestStreakMax,(state.harvestStreak||0)*C.timedHarvest.harvestStreakStep)*100);
   const nextPay=timedPay();
   setText('timedHarvestReady',st.full?`${TIMED_CAP}/${TIMED_CAP} FULL`:`${st.ready}/${TIMED_CAP} ready`);
   setText('timedHarvestPay',`${nextPay} coins next`);
   setText('timedHarvestTimer',st.full?'Storage capped at 3 — claim to restart the 30:00 timer':st.ready?`Next in ${formatTime(st.nextMs)}`:`Ready in ${formatTime(st.nextMs)}`);
   setText('harvestStreakText',`Harvest streak: ${state.harvestStreak||0} • +${pct}%`);
   if(btn){btn.disabled=st.ready===0;btn.textContent=st.ready?`Harvest ×${st.ready}`:'Growing…'}
 }
 function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v}

 function flashFarmBalance(id='farmCoins'){
   setTimeout(()=>{const el=document.getElementById(id);if(!el)return;el.classList.remove('balanceGain');void el.offsetWidth;el.classList.add('balanceGain');setTimeout(()=>el.classList.remove('balanceGain'),700)},30);
 }
 function showPlotFeedback(i,items,kind=''){
   const fire=()=>{
     const plot=document.querySelector(`.plot[data-plot-index="${i}"]`);if(!plot)return;
     const box=document.createElement('div');box.className='plotFeedback '+kind;
     box.innerHTML=items.map((x,n)=>`<span style="--feedback-order:${n}">${x}</span>`).join('');
     plot.appendChild(box);setTimeout(()=>box.remove(),1900);
   };
   setTimeout(fire,25);
 }
 function pulseOrderProgress(result){
   if(!result?.progress?.length)return;
   setTimeout(()=>result.progress.forEach(p=>{
     const card=document.querySelector(`.farmOrderCard[data-order-id="${p.id}"]`);if(!card)return;
     card.classList.add(p.ready?'order-just-ready':'order-progressed');
     setTimeout(()=>card.classList.remove('order-progressed','order-just-ready'),1300);
   }),40);
 }
 function plant(type){
   const d=cropDefs[type],region=activeRegionIndex(),i=Number.isInteger(chosenPlot)?chosenPlot:state.plots.findIndex(x=>!x);
   if(!d||(state.region||0)<d.minRegion){onMessage('That crop has not been unlocked yet.');return}
   if(i<0||state.plots[i]){onMessage(state.plots.every(Boolean)?'All six crop fields are full. Harvest something before planting again.':'Select an empty plot first.');return}
   if(state.coins<d.cost){onMessage('Not enough coins.');return}
   state.coins-=d.cost;state.plots[i]={type,age:0,region};chosenPlot=null;onChange();render();
   const spacesLeft=state.plots.filter(x=>!x).length,spaceText=spacesLeft===0?'FIELDS FULL':`${spacesLeft} crop space${spacesLeft===1?'':'s'} left`;
   showPlotFeedback(i,[`${d.icon} ${d.name}`,'PLANTED!',spaceText],'plantedFeedback');
   onMessage(`${d.icon} ${d.name} planted${d.homeRegion===region?' in its home region!':'.'} ${spacesLeft===0?'Fields full.':`${spacesLeft} crop space${spacesLeft===1?'':'s'} left.`}`);
 }
 function harvest(i,opts={}){
   const p=state.plots[i],d=p&&cropDefs[p.type];if(!p||p.age<d.grow)return null;
   const plantedRegion=Number.isInteger(p.region)?p.region:Math.min(d.homeRegion||0,state.region||0);
   ensureInDemand();
   const homeBonus=d.homeRegion===plantedRegion;
   let pay=Math.round(d.payout*regionalCropMultiplier(plantedRegion,p.type));
   const weatherFx=DSH.Weather?.effects(state)||{},seasonFx=DSH.Seasons?.effects(state)||{};pay=Math.round(pay*(weatherFx.cropCoin||1)*(seasonFx.cropCoin||1));const bumper=weatherFx.bumper===p.type;if(bumper)pay*=2;
   const inDemand=p.type===state.inDemandCrop;if(inDemand){pay=Math.round(pay*C.farmOrders.inDemandMultiplier);state.stats.inDemandHarvests=(state.stats.inDemandHarvests||0)+1}
   if(state.upgrades.butterfly)pay=Math.round(pay*C.cropRewards.butterflyMultiplier);if(state.upgrades.silo)pay=Math.round(pay*1.10);
   state.coins+=pay;state.harvests++;state.stats.regionalCropsHarvested=(state.stats.regionalCropsHarvested||0)+1;if(p.type==='apple')state.stats.applesHarvested=(state.stats.applesHarvested||0)+1;
   state.collection=state.collection||{specials:{},crops:{},regions:{0:true},powers:{},rosie:{}};
   state.collection.crops[p.type]=true;state.collection.regions[plantedRegion]=true;
   state.plots[i]=null;addHappy(C.happiness.cropHarvest);
   let wind=0,gates=0,rescues=0,treats=maybeTreat();
   const plantedRegionDef=regionDefs[plantedRegion]||regionDefs[0],windChance=Math.min(.85,d.wind+(plantedRegionDef.windBonus||0)+(weatherFx.windBonus||0)+(seasonFx.windBonus||0));
   if(Math.random()<windChance){
     wind=Math.random()<.12?3:(Math.random()<.38?2:1);
     state.windmills+=wind;state.stats.windmillsFound+=wind;
   }
   if(state.upgrades.fence&&Math.random()<C.cropRewards.gateChance){
     gates=Math.random()<C.cropRewards.gateDoubleChance?2:1;
     state.magicGates=(state.magicGates||0)+gates;state.stats.magicGatesFound+=gates;
   }
   if(state.upgrades.bandana&&Math.random()<Math.min(.80,cropRescueChance())){
     rescues=Math.random()<C.cropRewards.rescueDoubleChance?2:1;
     state.rosieRescues=(state.rosieRescues||0)+rescues;state.stats.rosieRescuesFound+=rescues;
     state.stats.rosieFinds=(state.stats.rosieFinds||0)+1;addHappy(C.happiness.rosieFind);
   }
   const orderResult=advanceOrders(p.type,{silent:!!opts.silent}),seasonResult=DSH.Seasons?.addProgress(state,'crop',1,state.level);
   announceAchievements();if(!opts.silent){DSH.Audio.play.harvest();onChange();render()}
   const feedback=[`${d.icon} +${pay} 🪙`,`+${C.happiness.cropHarvest} ❤️`];
   if(homeBonus)feedback.push('🏡 HOME +15%');
   if(inDemand)feedback.push('🔥 IN DEMAND +25%');
   if(bumper)feedback.push('🌻 BUMPER 2×');
   if(wind)feedback.push(`🌬️ +${wind}`);
   if(gates)feedback.push(`🚪 +${gates}`);
   if(rescues)feedback.push(`🐾 +${rescues}`);
   if(treats)feedback.push(`🦴 +${treats}`);
   if(orderResult.advanced)feedback.push(orderResult.becameReady?'📋 ORDER READY!':`📋 +${orderResult.advanced}`);
   if(!opts.silent){
     showPlotFeedback(i,feedback,'harvestFeedback');pulseOrderProgress(orderResult);flashFarmBalance();
     const seasonPay=(seasonFx.cropCoin||1)!==1?` • ${DSH.Seasons.info(state.level).icon} season ${Math.round(((seasonFx.cropCoin||1)-1)*100)>=0?'+':''}${Math.round(((seasonFx.cropCoin||1)-1)*100)}% crops`:'';
     onMessage(`${d.icon} Harvested for ${pay} coins${seasonPay}${orderResult.becameReady?' • Farm Order ready to collect!':orderResult.advanced?' • Farm Order progress!':''}`);announceSeasonResult(seasonResult);
   }
   return{pay,wind,gates,rescues,treats,orderResult,seasonResult,type:p.type,icon:d.icon};
 }
 function harvestAll(){
   const ready=state.plots.map((p,i)=>({p,i})).filter(x=>x.p&&cropDefs[x.p.type]&&x.p.age>=cropDefs[x.p.type].grow).map(x=>x.i);
   if(!ready.length){onMessage('No crops are ready to harvest yet.');return}
   lastHarvestPattern=ready.map(i=>({i,type:state.plots[i].type,region:Number.isInteger(state.plots[i].region)?state.plots[i].region:activeRegionIndex()}));
   const before={coins:state.coins,windmills:state.windmills||0,gates:state.magicGates||0,rescues:state.rosieRescues||0,treats:state.rosieTreats||0,happiness:state.rosieHappiness||0,orders:readyOrderCount()};
   let harvested=0,seasonResult=null;ready.forEach(i=>{const r=harvest(i,{silent:true});if(r){harvested++;if(r.seasonResult?.completed)seasonResult=r.seasonResult}});
   const after={coins:state.coins,windmills:state.windmills||0,gates:state.magicGates||0,rescues:state.rosieRescues||0,treats:state.rosieTreats||0,happiness:state.rosieHappiness||0,orders:readyOrderCount()};
   onChange();render();flashFarmBalance();DSH.Audio.play.harvest();
   const bits=[`${harvested} crop${harvested===1?'':'s'}`,`+${after.coins-before.coins} 🪙`];
   if(after.windmills>before.windmills)bits.push(`+${after.windmills-before.windmills} 🌬️`);
   if(after.gates>before.gates)bits.push(`+${after.gates-before.gates} 🚪`);
   if(after.rescues>before.rescues)bits.push(`+${after.rescues-before.rescues} 🐾`);
   if(after.treats>before.treats)bits.push(`+${after.treats-before.treats} 🦴`);
   if(after.happiness>before.happiness)bits.push(`+${after.happiness-before.happiness} ❤️`);
   if(after.orders>before.orders)bits.push(`📋 ${after.orders-before.orders} order${after.orders-before.orders===1?'':'s'} ready`);
   onReward?.('🌾 Harvest All',bits.join(' • '),'🌾');announceSeasonResult(seasonResult);
   onMessage(`Harvested ${harvested} ready crop${harvested===1?'':'s'} • ${after.coins-before.coins} coins total.`);
 }
 function replantLastHarvest(){
   if(!Array.isArray(lastHarvestPattern)||!lastHarvestPattern.length){onMessage('Use Harvest All first, then you can replant that harvest with one tap.');return false}
   const open=lastHarvestPattern.filter(x=>!state.plots[x.i]&&cropDefs[x.type]&&(state.region||0)>=cropDefs[x.type].minRegion);
   if(!open.length){onMessage('There are no matching empty fields to replant.');return false}
   const affordable=[];let cost=0;
   // Skip crops that are currently too expensive instead of stopping at the first
   // one; a cheap Clover later in the remembered pattern should still be replanted.
   for(const x of open){const price=cropDefs[x.type].cost;if(cost+price<=state.coins){cost+=price;affordable.push(x)}}
   if(!affordable.length){onMessage('Not enough coins to replant any of the last harvest.');return false}
   affordable.forEach(x=>{state.plots[x.i]={type:x.type,age:0,region:Math.min(x.region,state.region||0)}});
   state.coins-=cost;state.stats.batchReplants=(state.stats.batchReplants||0)+1;state.stats.cropsReplanted=(state.stats.cropsReplanted||0)+affordable.length;
   onChange();render();flashFarmBalance();
   const remaining=state.plots.filter(x=>!x).length;
   onReward?.('🌱 Replanted!',`${affordable.length} crop${affordable.length===1?'':'s'} replanted • ${cost} 🪙${affordable.length<open.length?' • stopped when coins ran out':''}`,'🌱');
   onMessage(`Replanted ${affordable.length} of the last harvested crop${affordable.length===1?'':'s'}. ${remaining} field${remaining===1?'':'s'} empty.`);
   return true;
 }
 function grow(level=state.level){const extra=(DSH.Weather?.effects(state).extraGrowth||0)+(DSH.Seasons?.effects(state,level).extraGrowth||0);state.plots=state.plots.map(p=>p?{...p,age:p.age+1+extra}:p)}
 function upgrade(k){
   const costs={fence:3,butterfly:5,barn:8,bandana:4,silo:10,market:12},names={fence:'Cozy Fence',butterfly:'Butterfly Garden',barn:'Bigger Barn',bandana:"Rosie's Pink Bandana",silo:'Golden Silo',market:'Farmstand Sign'};
   if(!Object.prototype.hasOwnProperty.call(costs,k))return;
   if(state.upgrades[k]){onMessage(`${names[k]} is already owned.`);return}
   if(state.gems<costs[k]){onMessage(`You need ${costs[k]} gems for ${names[k]}.`);return}
   state.gems-=costs[k];state.upgrades[k]=true;addHappy(C.happiness.decoration);
   announceAchievements();onChange();render();onReward?.('Farm Upgrade!',`${names[k]} is now permanent • +${C.happiness.decoration} Rosie Happiness ❤️`,'✨');
 }
 let selectedAdventureRegion=0,selectedAdventureDuration='sniff';
 function adventureDuration(key){return C.rosieAdventures.durations.find(x=>x.key===key)||C.rosieAdventures.durations[0]}
 function adventureRegionBias(i){
   return [
     {label:'Coins',coin:1.18,gem:0,power:0,rare:0},
     {label:'Rosie Finds',coin:1,gem:0,power:.06,rare:.02},
     {label:'Gems',coin:1,gem:.07,power:0,rare:0},
     {label:'Farm Powers',coin:1,gem:0,power:.10,rare:0},
     {label:'Rare Finds',coin:1,gem:.02,power:0,rare:.05}
   ][i%5];
 }
 function adventureSeason(level=state?.level||1){
   const info=DSH.Seasons?.info(level)||null,key=info?.key?info.key.split('-').slice(1).join('-'):'spring';
   return{info,key,profile:C.rosieAdventures.seasonal?.[key]||{}};
 }
 function chooseAdventureEvent(seasonKey){
   const entries=Object.entries(C.rosieAdventures.events||{}),pool=[],preferred=C.rosieAdventures.seasonal?.[seasonKey]?.preferredEvents||[];
   entries.forEach(([key,d])=>{
     if(Array.isArray(d.seasons)&&!d.seasons.includes(seasonKey))return;
     const seasonal=Array.isArray(d.seasons)&&d.seasons.includes(seasonKey),weight=preferred.includes(key)?4:seasonal?3:1;
     for(let i=0;i<weight;i++)pool.push(key);
   });
   return pool.length?pool[Math.floor(Math.random()*pool.length)]:'';
 }
 function favoriteAdventureSeason(){
   const stats=state?.rosieSeasonStats||{},defs=DSH.Config.seasons?.definitions||[];
   let best=null;
   Object.entries(stats).forEach(([key,x])=>{
     const trips=Math.max(0,Number(x?.trips)||0);if(!trips)return;
     const avg=(Number(x?.score)||0)/trips,def=defs.find(d=>d.key===key);
     const candidate={key,trips,avg,def};
     if(!best||candidate.avg>best.avg||candidate.avg===best.avg&&candidate.trips>best.trips)best=candidate;
   });
   return best;
 }
 function startAdventure(){
   if(state.rosieAdventure){
     if(Date.now()>=state.rosieAdventure.endsAt)return claimAdventure();
     onMessage('Rosie is already out exploring.');return;
   }
   const max=unlockedRegionIndex();selectedAdventureRegion=Math.min(selectedAdventureRegion,max);
   const d=adventureDuration(selectedAdventureDuration),happy=DSH.Progress.clampHappiness(state),seasonLevel=Math.max(1,state.level||1),season=adventureSeason(seasonLevel);
   const eventChance=.22+(happy>=75?.08:0)+(happy>=100?.08:0)+(season.profile.eventBonus||0);
   const eventKey=Math.random()<Math.min(.85,eventChance)?chooseAdventureEvent(season.key):'',event=C.rosieAdventures.events?.[eventKey]||null;
   const timeMult=(DSH.Weather?.effects(state).adventureTime||1)*(DSH.Seasons?.effects(state,seasonLevel).adventureTime||1)*(event?.timeMult||1);
   state.rosieAdventure={region:selectedAdventureRegion,duration:d.key,event:eventKey,seasonLevel,startedAt:Date.now(),endsAt:Date.now()+Math.round(d.ms*timeMult)};
   onChange();renderAdventure();
   const friend=happy>=100?' • ❤️ Best Friend bonus active':happy>=75?' • 💕 Happy Rosie bonus active':'';
   const seasonal=season.info?` • ${season.info.icon} ${season.info.variant?.name||season.info.name}`:'';
   onReward?.('Rosie is off! 🐾',`${regions[selectedAdventureRegion]} • ${d.name}${seasonal}${event?` • ${event.icon} ${event.name}`:''}${friend}`,'🐕');
 }
 function weightedPower(){
   const r=Math.floor(Math.random()*4);
   if(r===0){state.windmills++;state.stats.windmillsFound++;return'🌬️ Windmill'}
   if(r===1){state.magicGates++;state.stats.magicGatesFound++;return'🚪 Magic Gate'}
   if(r===2){state.rosieRescues++;state.stats.rosieRescuesFound++;return'🐾 Rosie Rescue'}
   state.rosieTreats++;state.stats.treatsFound++;return'🦴 Rosie Treat';
 }
 function showAdventureRewardPopup(data){
   const overlay=document.getElementById('rosieRewardOverlay'),grid=document.getElementById('rosieRewardGrid');
   if(!overlay||!grid){onReward?.('Welcome home, Rosie! 🐕',data.summary,'🐾');return}
   setText('rosieRewardTrip',`${data.region} • ${data.duration}`);
   const items=[{icon:'🪙',label:'Coins',value:`+${data.coins}`}];
   if(data.gems)items.push({icon:'💎',label:'Gems',value:`+${data.gems}`});
   if(data.power)items.push({icon:data.power.includes('Windmill')?'🌬️':data.power.includes('Gate')?'🚪':data.power.includes('Rescue')?'🐾':'🦴',label:'Farm Find',value:data.power.replace(/[🌬️🚪🐾🦴]/g,'').trim()});
   if(data.season)items.push({icon:data.season.icon,label:'Seasonal Trail',value:`${data.season.name}${data.season.variant?` • ${data.season.variant.icon} ${data.season.variant.name}`:''}`});
   if(data.rare)items.push({icon:data.rare.icon,label:'Rare Find',value:data.rare.name});
   if(data.event)items.push({icon:data.event.icon,label:data.event.seasons?'Season Event':'Adventure Event',value:data.event.name});
   if(data.bonusTreats)items.push({icon:'🦴',label:'Adventure Treat',value:`+${data.bonusTreats} Rosie Treat${data.bonusTreats===1?'':'s'}`});
   if(data.memento)items.push({icon:data.memento.icon,label:'SEASON MEMENTO!',value:data.memento.name,newItem:true});
   if(data.toy)items.push({icon:data.toy.icon,label:data.toy.season?'SEASON TOY!':'NEW TOY!',value:data.toy.name,newItem:true});
   if(data.friendBonus)items.push({icon:'❤️',label:'Best Friend Bonus',value:data.friendBonus});
   if(data.seasonResult?.completed)items.push({icon:data.seasonResult.info.icon,label:'SEASON BASKET!',value:`${seasonRewardText(data.seasonResult.reward)}${data.seasonResult.firstKeepsake?' • '+data.seasonResult.info.keepsake:''}`,newItem:true});
   grid.innerHTML=items.map((x,i)=>`<div class="rosieRewardItem${x.newItem?' newRewardItem':''}" style="--reward-order:${i}"><span>${x.icon}</span><small>${x.label}</small><b>${x.value}</b></div>`).join('');
   overlay.classList.add('open');
   const done=document.getElementById('rosieRewardDone');if(done)done.onclick=()=>overlay.classList.remove('open');
 }
 function claimAdventure(forceRare=false){
   const a=state.rosieAdventure;if(!a)return;
   if(Date.now()<a.endsAt&&!forceRare){onMessage('Rosie is still exploring.');return}
   const d=adventureDuration(a.duration),bias=adventureRegionBias(a.region),happy=DSH.Progress.clampHappiness(state),event=C.rosieAdventures.events?.[a.event]||null;
   const season=adventureSeason(a.seasonLevel||state.level),seasonEffects=DSH.Seasons?.effects(state,a.seasonLevel||state.level)||{},profile=season.profile||{};
   const luck=happy/1000,friendCoin=happy>=100?1.20:happy>=75?1.10:1,lo=d.coin[0],hi=d.coin[1];
   const coins=Math.round((lo+Math.random()*(hi-lo))*bias.coin*(event?.coinMult||1)*(profile.coinMult||1)*friendCoin*(DSH.Weather?.effects(state).rosieCoin||1));
   let gems=0,power='',rare='',toy='',memento='',bonusTreats=Math.max(0,Math.floor(Number(event?.bonusTreats)||0));
   state.coins+=coins;
   if(Math.random()<d.gemChance+bias.gem+luck+(DSH.Weather?.effects(state).gemBonus||0)){gems=1;state.gems++}
   if(Math.random()<d.powerChance+bias.power+luck+(profile.powerBonus||0)+(event?.powerBonus||0))power=weightedPower();
   const rareChance=d.rareChance+bias.rare+luck+(profile.rareBonus||0)+(event?.rareBonus||0)+(DSH.Weather?.effects(state).rosieRareBonus||0)+(seasonEffects.rosieRareBonus||0);
   if(forceRare||Math.random()<rareChance){
     const keys=Object.keys(C.rosieAdventures.rareFinds),key=keys[Math.floor(Math.random()*keys.length)];
     state.rosieAdventureFinds[key]=(state.rosieAdventureFinds[key]||0)+1;state.collection.powers['adventure-'+key]=true;rare=key;state.stats.rosieAdventureRareFinds++;
   }
   state.rosieSeasonalFinds=state.rosieSeasonalFinds||{spring:false,summer:false,autumn:false,winter:false};
   const mem=C.rosieAdventures.seasonal?.[season.key]?.memento,mementoChance=(d.mementoChance||0)+luck*.12+(event?.rareBonus||0)*.12;
   if(mem&&!state.rosieSeasonalFinds[season.key]&&(forceRare||Math.random()<mementoChance)){
     state.rosieSeasonalFinds[season.key]=true;memento=season.key;state.stats.rosieSeasonalMementos=(state.stats.rosieSeasonalMementos||0)+1;
   }
   state.rosieToys=state.rosieToys||{};
   const availableToys=Object.keys(C.farmhouse.toys).filter(k=>!state.rosieToys[k]&&(!C.farmhouse.toys[k].season||C.farmhouse.toys[k].season===season.key));
   const weightedToys=[];availableToys.forEach(k=>{const seasonal=C.farmhouse.toys[k].season===season.key;for(let i=0;i<(seasonal?3:1);i++)weightedToys.push(k)});
   if(weightedToys.length&&Math.random()<(d.toyChance||0)+luck*.35+(profile.toyBonus||0)+(event?.toyBonus||0)){
     toy=weightedToys[Math.floor(Math.random()*weightedToys.length)];state.rosieToys[toy]=true;state.stats.rosieToysFound=(state.stats.rosieToysFound||0)+1;
     if(C.farmhouse.toys[toy]?.season)state.stats.rosieSeasonalToys=(state.stats.rosieSeasonalToys||0)+1;
   }
   if(bonusTreats){state.rosieTreats=(state.rosieTreats||0)+bonusTreats;state.stats.treatsFound=(state.stats.treatsFound||0)+bonusTreats}
   state.stats.rosieAdventuresCompleted++;state.stats.rosieAdventureCoins+=coins;state.stats.rosieAdventureGems+=gems;if(power)state.stats.rosieAdventurePowers++;
   if(event){state.stats.rosieAdventureEvents=(state.stats.rosieAdventureEvents||0)+1;if(Array.isArray(event.seasons))state.stats.rosieSeasonalEvents=(state.stats.rosieSeasonalEvents||0)+1}
   const hist=state.rosieAdventureHistory;hist[a.region]=(hist[a.region]||0)+1;
   state.rosieSeasonStats=state.rosieSeasonStats||{};const ss=state.rosieSeasonStats[season.key]||(state.rosieSeasonStats[season.key]={trips:0,coins:0,gems:0,powers:0,rares:0,toys:0,mementos:0,events:0,score:0});
   const outcomeScore=coins+gems*180+(power?120:0)+(rare?160:0)+(toy?250:0)+(memento?300:0)+(event?40:0)+bonusTreats*35;
   ss.trips++;ss.coins+=coins;ss.gems+=gems;if(power)ss.powers++;if(rare)ss.rares++;if(toy)ss.toys++;if(memento)ss.mementos++;if(event)ss.events++;ss.score+=outcomeScore;
   const rd=rare?C.rosieAdventures.rareFinds[rare]:null,td=toy?C.farmhouse.toys[toy]:null,md=memento?C.rosieAdventures.seasonal?.[memento]?.memento:null;
   const friendBonus=happy>=100?'+20% Adventure coins':happy>=75?'+10% Adventure coins':'';
   const reward={coins,gems,power,rare:rd,toy:td,memento:md,event,bonusTreats,season:season.info,friendBonus,region:regions[a.region],duration:d.name,
     summary:`${coins} coins${gems?' • +1 💎':''}${power?' • '+power:''}${rd?' • '+rd.icon+' '+rd.name:''}${event?' • '+event.icon+' '+event.name:''}${bonusTreats?' • +'+bonusTreats+' 🦴':''}${md?' • '+md.icon+' '+md.name:''}${td?' • '+td.icon+' '+td.name+' TOY!':''}${friendBonus?' • ❤️ '+friendBonus:''}`};
   const seasonResult=DSH.Seasons?.addProgress(state,'adventure',1,state.level);reward.seasonResult=seasonResult;
   state.rosieAdventure=null;onChange();render();showAdventureRewardPopup(reward);
   onMessage(`🐕 Rosie is home from ${season.info?.name||'her seasonal trail'}! Adventure rewards collected.`);
 }
 function useAdventureFind(key){
   const n=state.rosieAdventureFinds[key]||0;if(n<=0)return;
   if(key==='cache'){
     state.rosieAdventureFinds.cache--;const coins=250+Math.floor(Math.random()*351);state.coins+=coins;
     let extra='';if(Math.random()<.45){state.gems++;extra=' +1 💎'}else extra=' '+weightedPower();
     onChange();render();onReward?.('Rosie Cache Opened! 🎁',`${coins} coins •${extra}`,'🎁');return;
   }
   if(key==='snacks'){
     state.rosieAdventureFinds.snacks--;const treats=2+Math.floor(Math.random()*3);state.rosieTreats=(state.rosieTreats||0)+treats;state.stats.treatsFound=(state.stats.treatsFound||0)+treats;
     onChange();render();onReward?.('Trail Snack Bag Opened! 👜',`+${treats} Rosie Treats 🦴`,'👜');return;
   }
   onMessage(`${C.rosieAdventures.rareFinds[key].name} activates automatically when its condition is met.`);
 }
 function renderAdventure(){
   const card=document.getElementById('rosieAdventureCard');if(!card||!state)return;
   const a=state.rosieAdventure,now=Date.now(),max=unlockedRegionIndex(),currentSeason=adventureSeason(state.level);
   selectedAdventureRegion=Math.min(selectedAdventureRegion,max);
   const loc=document.getElementById('adventureLocations'),dur=document.getElementById('adventureDurations'),btn=document.getElementById('rosieAdventureAction'),seasonHint=document.getElementById('rosieAdventureSeasonHint');
   const supervision=document.getElementById('farmRosieSupervisionText');
   if(supervision){
     const growth=1+(DSH.Seasons?.effects(state,state.level).extraGrowth||0),growthText=`${growth} growth step${growth===1?'':'s'}`;
     if(!a)supervision.textContent=`Rosie is supervising. Crops gain ${growthText} whenever a normal Solitaire level is completed.`;
     else if(now>=a.endsAt)supervision.textContent='Rosie is back from her adventure! Welcome her home to reveal what she found.';
     else supervision.textContent=`Rosie is exploring ${regions[a.region]||'the farm'}. Crops still gain ${growthText} whenever a normal Solitaire level is completed.`;
   }
   if(a){
     const ready=now>=a.endsAt,remaining=Math.max(0,a.endsAt-now),d=adventureDuration(a.duration),ev=C.rosieAdventures.events?.[a.event],tripSeason=adventureSeason(a.seasonLevel||state.level);
     setText('rosieAdventureStatus',ready?`Rosie is back from ${regions[a.region]}!`:`Exploring ${regions[a.region]} • ${d.name} • ${tripSeason.info?.icon||'🍂'} ${tripSeason.info?.name||'Seasonal Trail'}${ev?` • ${ev.icon} ${ev.name}`:''}`);
     if(seasonHint)seasonHint.textContent=`This trip started during ${tripSeason.info?.name||'the season'}${tripSeason.info?.variant?` • ${tripSeason.info.variant.icon} ${tripSeason.info.variant.name}`:''}. Its Adventure bonuses stay locked for the trip.`;
     setText('rosieAdventureTimer',ready?'HOME!':formatTime(remaining));
     if(loc)loc.innerHTML='';if(dur)dur.innerHTML='';
     if(btn){btn.textContent=ready?'🐾 Welcome Rosie Home':'Rosie is exploring…';btn.disabled=!ready;btn.onclick=()=>claimAdventure()}
   }else{
     setText('rosieAdventureStatus','Choose a destination and how long Rosie should explore.');setText('rosieAdventureTimer','');
     if(seasonHint)seasonHint.textContent=`${currentSeason.info?.icon||'🍂'} ${currentSeason.profile.name||currentSeason.info?.name||'Seasonal Trail'} • ${currentSeason.profile.desc||'Seasonal Adventure bonuses are active.'}${currentSeason.info?.variant?` • Focus: ${currentSeason.info.variant.icon} ${currentSeason.info.variant.name}`:''}`;
     if(loc)loc.innerHTML=regions.slice(0,max+1).map((name,i)=>{const b=adventureRegionBias(i);return`<button class="${i===selectedAdventureRegion?'selected':''}" data-ar="${i}">${regionDefs[i].icon} ${name}<small>Favors ${b.label}</small></button>`}).join('');
     if(dur)dur.innerHTML=C.rosieAdventures.durations.map(d=>`<button class="${d.key===selectedAdventureDuration?'selected':''}" data-ad="${d.key}">${d.icon} ${d.name}<small>${Math.round(d.ms/60000)} min</small></button>`).join('');
     loc?.querySelectorAll('[data-ar]').forEach(b=>b.onclick=()=>{selectedAdventureRegion=+b.dataset.ar;renderAdventure()});
     dur?.querySelectorAll('[data-ad]').forEach(b=>b.onclick=()=>{selectedAdventureDuration=b.dataset.ad;renderAdventure()});
     if(btn){btn.disabled=false;btn.textContent='🐾 Send Rosie Exploring';btn.onclick=startAdventure}
   }
   const finds=document.getElementById('adventureFinds');
   if(finds)finds.innerHTML=Object.entries(C.rosieAdventures.rareFinds).map(([k,d])=>`<button data-find="${k}" ${(state.rosieAdventureFinds[k]||0)<=0?'disabled':''}><span>${d.icon}</span><b>${d.name} ×${state.rosieAdventureFinds[k]||0}</b><small>${d.desc}</small></button>`).join('');
   finds?.querySelectorAll('[data-find]').forEach(b=>b.onclick=()=>useAdventureFind(b.dataset.find));
   const journal=document.getElementById('adventureJournal');if(journal){
     const trips=state.stats.rosieAdventuresCompleted||0,toys=Object.values(state.rosieToys||{}).filter(Boolean).length,totalToys=Object.keys(C.farmhouse.toys||{}).length;
     const favorite=Object.entries(state.rosieAdventureHistory||{}).sort((a,b)=>b[1]-a[1])[0],favoriteText=favorite&&favorite[1]>0?`${regions[+favorite[0]]} ×${favorite[1]}`:'No favorite trail yet';
     const favSeason=favoriteAdventureSeason(),favSeasonText=favSeason?`${favSeason.def?.icon||'🍂'} ${favSeason.def?.name||favSeason.key}`:'No favorite season yet';
     const mementos=Object.values(state.rosieSeasonalFinds||{}).filter(Boolean).length;
     journal.innerHTML=`<span>🗺️ ${trips} trip${trips===1?'':'s'}</span><span>🧸 Toys ${toys}/${totalToys}</span><span>🐾 ${favoriteText}</span><span>❤️ ${favSeasonText}</span><span>✨ Mementos ${mementos}/4</span>`;
   }
   const rosie=document.getElementById('rosie');if(rosie){
     const returned=!!a&&now>=a.endsAt;rosie.classList.toggle('adventuring',!!a&&!returned);rosie.classList.toggle('returnedHome',returned);
     rosie.onclick=returned?()=>claimAdventure():a?null:()=>petRosie();
     rosie.title=returned?'Rosie is home — tap to reveal her Adventure rewards':a?'Rosie is out exploring':'Pet Rosie';
   }
 }
 function renderHappiness(){
   const h=DSH.Progress.clampHappiness(state),bar=document.getElementById('rosieHappinessBar');
   setText('rosieHappinessText',`${h}/100 ❤️`);if(bar)bar.style.width=h+'%';
   setText('rosieTreatCount',state.rosieTreats||0);
   setText('rosieTreasureStatus',h>=100?'🎁 Treasure ready • Best Friend: +20% Adventure coins & better events':h>=75?`💕 Happy Rosie: +10% Adventure coins • Find bonus +${Math.round(DSH.Progress.happinessFindBonus(state)*100)}%`:`Treasure at 100 • Find bonus +${Math.round(DSH.Progress.happinessFindBonus(state)*100)}%`);
   const now=Date.now(),wait=Math.max(0,C.happiness.petCooldownMs-(now-(Number(state.lastPetAt)||0))),away=!!state.rosieAdventure,returned=away&&now>=state.rosieAdventure.endsAt;
   setText('petRosieCooldown',away?(returned?'🐕 Welcome Rosie home first':'🐾 Rosie is exploring…'):(wait?`Pet again in ${formatTime(wait)}`:'Petting ready'));
   const pet=document.getElementById('petRosieBtn'),feed=document.getElementById('feedTreatBtn');
   if(pet){pet.disabled=away||wait>0;pet.title=away?(returned?'Collect Rosie’s Adventure rewards first.':'Rosie is currently away on an Adventure.'):'Pet Rosie'}
   if(feed){feed.disabled=away||(state.rosieTreats||0)<=0||h>=100;feed.title=away?(returned?'Collect Rosie’s Adventure rewards first.':'Rosie is currently away on an Adventure.'):'Give Rosie a treat'}
 }
 function render(){
   if(!state)return;renderTimedHarvest();renderHappiness();renderOrders();renderAdventure();
   const seasonInfo=DSH.Seasons?.ensure(state,state.level),ss=state.seasonState||{};
   if(seasonInfo){setText('farmSeasonName',`${seasonInfo.icon} ${seasonInfo.name} • Year ${seasonInfo.year}`);setText('farmSeasonEffect',`${DSH.Seasons.variantText(seasonInfo)} • ${DSH.Seasons.effectText(seasonInfo)}`);setText('farmSeasonPoints',ss.claimed?'Basket complete ✓':`${ss.points||0}/${seasonInfo.goal}`);const sb=document.getElementById('farmSeasonBar');if(sb)sb.style.width=`${Math.min(100,(ss.points||0)/seasonInfo.goal*100)}%`;const sc=document.getElementById('farmSeasonCard');if(sc){sc.dataset.season=seasonInfo.key.split('-').slice(1).join('-')}}
   const ri=activeRegionIndex(),r=activeRegion();
   setText('gems',state.gems);setText('farmCoins',state.coins.toLocaleString());setText('farmWindmills',state.windmills);setText('regionName',r.name);
   setText('farmGates',state.magicGates||0);setText('regionBonusText',r.bonus);
   setText('regionIndexText',`${ri+1}/${Math.min((state.region||0)+1,regionDefs.length)}`);
   const prev=document.getElementById('prevRegionBtn'),next=document.getElementById('nextRegionBtn');if(prev)prev.disabled=ri<=0;if(next)next.disabled=ri>=Math.min(state.region||0,regionDefs.length-1);
   const nextDef=regionDefs[Math.min((state.region||0)+1,regionDefs.length-1)],atMax=(state.region||0)>=regionDefs.length-1;
   setText('nextRegionUnlock',atMax?'All farm regions unlocked':`Next: ${nextDef.name} at Level ${nextDef.unlockLevel}`);
   const prog=document.getElementById('regionProgress');if(prog)prog.style.width=atMax?'100%':Math.min(100,Math.max(0,(state.level-(regionDefs[state.region]?.unlockLevel||1))/(nextDef.unlockLevel-(regionDefs[state.region]?.unlockLevel||1))*100))+'%';
   const p=document.getElementById('plots');if(p){p.innerHTML='';state.plots.forEach((plot,i)=>{
     const el=document.createElement('div');el.className='plot';el.dataset.plotIndex=i;
     if(!plot){
       el.innerHTML='<span class="emptyPlotPlus">＋</span>';
       if(chosenPlot===i)el.classList.add('selectedPlot');
       el.onclick=()=>{chosenPlot=i;render();onMessage('Plot selected. Choose a crop.')}
     }else{
       const d=cropDefs[plot.type],ready=plot.age>=d.grow;
       el.innerHTML=ready
         ?`<span class="matureCrop">${d.icon}</span><small class="plotCropLabel">${d.name}</small>`
         :`<span class="seedlingCrop">🌱</span><span class="cropIdentity">${d.icon}</span><small class="plotCropLabel">${d.name}</small>`;
       if(ready){el.classList.add('ready');el.title=`${d.name} ready to harvest`}
       else el.title=`Growing ${d.name} • ${Math.min(plot.age,d.grow)}/${d.grow}`;
       el.onclick=()=>harvest(i)
     }
     p.appendChild(el);
   })}
   const scene=document.getElementById('farmScene');if(scene){
     scene.classList.toggle('hasCozyFence',!!state.upgrades.fence);scene.classList.remove('hasPinkCollar');
     for(let n=0;n<regionDefs.length;n++)scene.classList.toggle(`region-${n}`,n===ri);['spring','summer','autumn','winter'].forEach(k=>scene.classList.toggle(`season-${k}`,seasonInfo?.key.endsWith('-'+k)));
   }
   const decor=document.getElementById('regionDecorVisual');if(decor){decor.textContent=ownsDecor(r.decor.key)?r.decor.icon:'';decor.title=ownsDecor(r.decor.key)?r.decor.name:''}
   const rosie=document.getElementById('rosie');if(rosie)rosie.classList.toggle('bandanaOn',!!state.upgrades.bandana);
   const harvestAllBtn=document.getElementById('harvestAllBtn');if(harvestAllBtn){
     const readyCount=state.plots.filter(p=>p&&cropDefs[p.type]&&p.age>=cropDefs[p.type].grow).length;
     harvestAllBtn.disabled=readyCount===0;harvestAllBtn.textContent=readyCount?`🌾 Harvest All (${readyCount})`:'🌾 Harvest All';
     harvestAllBtn.title=readyCount?`Harvest all ${readyCount} ready crop${readyCount===1?'':'s'}`:'No crops are ready yet';
   }
   const replantBtn=document.getElementById('replantBtn');if(replantBtn){
     const matches=Array.isArray(lastHarvestPattern)?lastHarvestPattern.filter(x=>!state.plots[x.i]&&cropDefs[x.type]):[];
     const total=matches.reduce((sum,x)=>sum+cropDefs[x.type].cost,0);
     replantBtn.disabled=!matches.length||state.coins<Math.min(...matches.map(x=>cropDefs[x.type].cost),Infinity);
     replantBtn.textContent=matches.length?`🌱 Replant (${matches.length})`:'🌱 Replant';
     replantBtn.title=matches.length?`Replant the last Harvest All pattern • up to ${total} coins`:'Harvest All first to remember a crop pattern';
   }
   const cropBox=document.getElementById('cropChoices');if(cropBox){
     cropBox.innerHTML='';const fieldsFull=state.plots.every(Boolean);
     const fullNote=document.getElementById('fieldsFullNotice');if(fullNote){fullNote.classList.toggle('show',fieldsFull);fullNote.textContent=fieldsFull?'🌱 All six fields are full — harvest a crop to plant more.':''}
     Object.entries(cropDefs).forEach(([key,d])=>{
       if(d.minRegion>state.region)return;
       const item=document.createElement('div');item.className='item cropChoice'+(d.homeRegion===ri?' signatureCrop':'')+(fieldsFull?' fieldsFull':'');
       const home=regionDefs[d.homeRegion]?.name||'Farm';
       item.innerHTML=`<b>${d.icon} ${d.name} — ${d.cost} coins</b><small>${d.grow} clear${d.grow===1?'':'s'} • pays ${d.payout} base • Home: ${home}${d.homeRegion===ri?' • +15% home bonus':''}</small><button data-crop="${key}">${fieldsFull?'Fields Full':'Plant'}</button>`;
       const b=item.querySelector('button');b.disabled=fieldsFull||state.coins<d.cost;b.title=fieldsFull?'Harvest a crop before planting another.':state.coins<d.cost?'Not enough coins.':`Plant ${d.name}`;b.onclick=()=>plant(key);cropBox.appendChild(item);
     });
   }
   const rd=document.getElementById('regionDecorCard');if(rd){
     const d=r.decor,owned=ownsDecor(d.key);rd.innerHTML=`<b>${d.icon} ${d.name}</b><small>${d.desc}</small><button id="buyRegionDecorBtn">${owned?'Owned ✓':d.cost+' Gems'}</button>`;
     const b=rd.querySelector('button');b.disabled=owned||state.gems<d.cost;b.onclick=buyRegionDecor;
   }
   const upgradeCosts={fence:3,butterfly:5,barn:8,bandana:4,silo:10,market:12};
   document.querySelectorAll('[data-upgrade]').forEach(b=>{
     const k=b.dataset.upgrade,cost=upgradeCosts[k],owned=!!state.upgrades[k];
     b.textContent=owned?'Owned ✓':`${cost} Gems`;
     b.disabled=owned||state.gems<cost;
     b.title=owned?'Permanent farm upgrade owned':state.gems<cost?`Need ${cost} gems`:`Buy for ${cost} gems`;
     b.classList.toggle('owned',owned);
   });
 }
 return{bind,plant,harvest,harvestAll,replantLastHarvest,grow,upgrade,render,favoriteAdventureSeason,visit,petRosie,feedTreat,claimTimedHarvest,renderTimedHarvest,renderHappiness,timedStatus,setRegion,claimRegionRewards,buyRegionDecor,ensureOrders,renderOrders,advanceOrders,collectOrder,readyOrderCount,
 startAdventure,claimAdventure,renderAdventure,useAdventureFind,cropDefs,regions,regionDefs};
})();