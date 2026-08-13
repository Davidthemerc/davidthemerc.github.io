window.DSH=window.DSH||{};
DSH.Farm=(()=>{
 const C=DSH.Config, cropDefs=C.crops;
 const regionDefs=C.farmRegions,regions=regionDefs.map(r=>r.name);
 let state,onChange,onMessage,onReward,chosenPlot=null;
 const TIMED_MS=C.timedHarvest.ms,TIMED_CAP=C.timedHarvest.cap;

 function bind(s,change,message,reward){state=s;onChange=change;onMessage=message;onReward=reward}
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
   const pool=[...unlocked].sort(()=>Math.random()-.5).slice(0,typeCount),req={},progress={};
   pool.forEach(k=>{req[k]=randomInt(T.qty[0],T.qty[1]);progress[k]=0});
   const rawValue=pool.reduce((sum,k)=>sum+(cropDefs[k].payout||30)*req[k],0);
   const coins=Math.max(80,Math.round(rawValue*T.rewardMult));
   const serial=++state.farmOrderSerial;
   return{id:`order-${serial}`,tier,requirements:req,progress,rewardCoins:coins,createdAt:Date.now()};
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
   let gems=0,power='',clover=false,coins=Math.max(0,Math.round(Number(o.readyCoinBase)||o.rewardCoins));
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
   onChange();render();flashFarmBalance();
   onReward?.(`${T.icon} ${T.label} Order Collected!`,`${coins} coins${clover?' • 🍀 Lucky Clover 2×':''}${gems?' • +1 💎':''}${power?' • '+power:''}`,T.icon);
   return true;
 }
 function advanceOrders(cropKey){
   ensureOrders();
   let advanced=0,becameReady=0,progress=[];
   state.farmOrders.forEach(o=>{
     if(o.ready||orderComplete(o)){o.ready=true;return}
     if(o.requirements[cropKey]&&((o.progress[cropKey]||0)<o.requirements[cropKey])){
       const before=o.progress[cropKey]||0;
       o.progress[cropKey]=before+1;advanced++;
       const ready=orderComplete(o);
       if(ready){
         o.ready=true;o.completedAt=Date.now();
         o.readyCoinBase=Math.round(o.rewardCoins*(DSH.Weather?.effects(state).orderCoin||1));
         becameReady++;
       }
       progress.push({id:o.id,tier:o.tier,cropKey,before,after:o.progress[cropKey],target:o.requirements[cropKey],ready});
     }
   });
   if(advanced)onChange();
   return{advanced,completed:becameReady,becameReady,progress};
 }
 function renderOrders(){
   const box=document.getElementById('farmOrdersGrid');if(!box||!state)return;
   ensureOrders();ensureInDemand();
   const demand=cropDefs[state.inDemandCrop],readyCount=readyOrderCount(),clover=(state.rosieAdventureFinds?.clover||0)>0;
   const badge=document.getElementById('inDemandBadge');
   if(badge)badge.textContent=`${readyCount?`📋 ${readyCount} reward${readyCount===1?'':'s'} waiting! • `:''}${demand?`🔥 In Demand: ${demand.icon} ${demand.name} +25%`:'🔥 In Demand: —'}`;
   box.innerHTML=state.farmOrders.map(o=>{
     const T=C.farmOrders.tiers[o.tier],ready=!!o.ready||orderComplete(o),parts=Object.entries(o.requirements).map(([k,q])=>{
       const d=cropDefs[k],p=Math.min(q,o.progress[k]||0);
       return `<span class="${p>=q?'done':''}">${d.icon} ${d.name} ${p}/${q}</span>`;
     }).join('');
     const base=Math.max(0,Math.round(Number(o.readyCoinBase)||o.rewardCoins)),shown=ready&&clover?base*2:base;
     return `<div class="farmOrderCard order-${o.tier}${ready?' order-ready':''}" data-order-id="${o.id}">
       <div class="farmOrderTitle"><span>${T.icon}</span><b>${T.label} Order${ready?' • READY!':''}</b><strong>${shown} 🪙</strong></div>
       <div class="farmOrderReqs">${parts}</div>
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
   const treasure=awardRosieTreasure();
   DSH.Audio.play.harvest();announceAchievements();onChange();render();
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
 function harvest(i){
   const p=state.plots[i],d=p&&cropDefs[p.type];if(!p||p.age<d.grow)return;
   const plantedRegion=Number.isInteger(p.region)?p.region:Math.min(d.homeRegion||0,state.region||0);
   ensureInDemand();
   const homeBonus=d.homeRegion===plantedRegion;
   let pay=Math.round(d.payout*regionalCropMultiplier(plantedRegion,p.type));
   const weatherFx=DSH.Weather?.effects(state)||{};pay=Math.round(pay*(weatherFx.cropCoin||1));const bumper=weatherFx.bumper===p.type;if(bumper)pay*=2;
   const inDemand=p.type===state.inDemandCrop;if(inDemand){pay=Math.round(pay*C.farmOrders.inDemandMultiplier);state.stats.inDemandHarvests=(state.stats.inDemandHarvests||0)+1}
   if(state.upgrades.butterfly)pay=Math.round(pay*C.cropRewards.butterflyMultiplier);
   state.coins+=pay;state.harvests++;state.stats.regionalCropsHarvested=(state.stats.regionalCropsHarvested||0)+1;if(p.type==='apple')state.stats.applesHarvested=(state.stats.applesHarvested||0)+1;
   state.collection=state.collection||{specials:{},crops:{},regions:{0:true},powers:{},rosie:{}};
   state.collection.crops[p.type]=true;state.collection.regions[plantedRegion]=true;
   state.plots[i]=null;addHappy(C.happiness.cropHarvest);
   let wind=0,gates=0,rescues=0,treats=maybeTreat();
   const plantedRegionDef=regionDefs[plantedRegion]||regionDefs[0],windChance=Math.min(.85,d.wind+(plantedRegionDef.windBonus||0)+(weatherFx.windBonus||0));
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
   const orderResult=advanceOrders(p.type);
   announceAchievements();DSH.Audio.play.harvest();onChange();render();
   const feedback=[`${d.icon} +${pay} 🪙`,`+${C.happiness.cropHarvest} ❤️`];
   if(homeBonus)feedback.push('🏡 HOME +15%');
   if(inDemand)feedback.push('🔥 IN DEMAND +25%');
   if(bumper)feedback.push('🌻 BUMPER 2×');
   if(wind)feedback.push(`🌬️ +${wind}`);
   if(gates)feedback.push(`🚪 +${gates}`);
   if(rescues)feedback.push(`🐾 +${rescues}`);
   if(treats)feedback.push(`🦴 +${treats}`);
   if(orderResult.advanced)feedback.push(orderResult.becameReady?'📋 ORDER READY!':`📋 +${orderResult.advanced}`);
   showPlotFeedback(i,feedback,'harvestFeedback');pulseOrderProgress(orderResult);flashFarmBalance();
   onMessage(`${d.icon} Harvested for ${pay} coins${orderResult.becameReady?' • Farm Order ready to collect!':orderResult.advanced?' • Farm Order progress!':''}`);
 }
 function grow(){const extra=DSH.Weather?.effects(state).extraGrowth||0;state.plots=state.plots.map(p=>p?{...p,age:p.age+1+extra}:p)}
 function upgrade(k){
   const costs={fence:3,butterfly:5,barn:8,bandana:4};
   if(state.upgrades[k]||state.gems<costs[k]){onMessage('Not enough gems.');return}
   state.gems-=costs[k];state.upgrades[k]=true;addHappy(C.happiness.decoration);
   announceAchievements();onChange();render();onReward?.('Farm Upgrade!',`+${C.happiness.decoration} Rosie Happiness ❤️`,'✨');
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
 function startAdventure(){
   if(state.rosieAdventure){
     if(Date.now()>=state.rosieAdventure.endsAt)return claimAdventure();
     onMessage('Rosie is already out exploring.');return;
   }
   const max=unlockedRegionIndex();selectedAdventureRegion=Math.min(selectedAdventureRegion,max);
   const d=adventureDuration(selectedAdventureDuration);
   state.rosieAdventure={region:selectedAdventureRegion,duration:d.key,startedAt:Date.now(),endsAt:Date.now()+Math.round(d.ms*(DSH.Weather?.effects(state).adventureTime||1))};
   onChange();renderAdventure();onReward?.('Rosie is off! 🐾',`${regions[selectedAdventureRegion]} • ${d.name}`,'🐕');
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
   if(data.rare)items.push({icon:data.rare.icon,label:'Rare Find',value:data.rare.name});
   if(data.toy)items.push({icon:data.toy.icon,label:'NEW TOY!',value:data.toy.name,newItem:true});
   grid.innerHTML=items.map((x,i)=>`<div class="rosieRewardItem${x.newItem?' newRewardItem':''}" style="--reward-order:${i}"><span>${x.icon}</span><small>${x.label}</small><b>${x.value}</b></div>`).join('');
   overlay.classList.add('open');
   const done=document.getElementById('rosieRewardDone');if(done)done.onclick=()=>overlay.classList.remove('open');
 }
 function claimAdventure(forceRare=false){
   const a=state.rosieAdventure;if(!a)return;
   if(Date.now()<a.endsAt&&!forceRare){onMessage('Rosie is still exploring.');return}
   const d=adventureDuration(a.duration),bias=adventureRegionBias(a.region),happy=DSH.Progress.clampHappiness(state);
   const luck=happy/1000,lo=d.coin[0],hi=d.coin[1],coins=Math.round((lo+Math.random()*(hi-lo))*bias.coin*(DSH.Weather?.effects(state).rosieCoin||1));
   let gems=0,power='',rare='',toy='';
   state.coins+=coins;
   if(Math.random()<d.gemChance+bias.gem+luck+(DSH.Weather?.effects(state).gemBonus||0)){gems=1;state.gems++}
   if(Math.random()<d.powerChance+bias.power+luck)power=weightedPower();
   const rareChance=d.rareChance+bias.rare+luck+(DSH.Weather?.effects(state).rosieRareBonus||0);
   if(forceRare||Math.random()<rareChance){
     const keys=Object.keys(C.rosieAdventures.rareFinds),key=keys[Math.floor(Math.random()*keys.length)];
     state.rosieAdventureFinds[key]=(state.rosieAdventureFinds[key]||0)+1;state.collection.powers['adventure-'+key]=true;rare=key;state.stats.rosieAdventureRareFinds++;
   }
   state.rosieToys=state.rosieToys||{};
   const availableToys=Object.keys(C.farmhouse.toys).filter(k=>!state.rosieToys[k]);
   if(availableToys.length&&Math.random()<(d.toyChance||0)+luck*.35){
     toy=availableToys[Math.floor(Math.random()*availableToys.length)];state.rosieToys[toy]=true;state.stats.rosieToysFound=(state.stats.rosieToysFound||0)+1;
   }
   state.stats.rosieAdventuresCompleted++;state.stats.rosieAdventureCoins+=coins;state.stats.rosieAdventureGems+=gems;if(power)state.stats.rosieAdventurePowers++;
   const hist=state.rosieAdventureHistory;hist[a.region]=(hist[a.region]||0)+1;
   const rd=rare?C.rosieAdventures.rareFinds[rare]:null,td=toy?C.farmhouse.toys[toy]:null;
   const reward={coins,gems,power,rare:rd,toy:td,region:regions[a.region],duration:d.name,
     summary:`${coins} coins${gems?' • +1 💎':''}${power?' • '+power:''}${rd?' • '+rd.icon+' '+rd.name:''}${td?' • '+td.icon+' '+td.name+' TOY!':''}`};
   state.rosieAdventure=null;onChange();render();showAdventureRewardPopup(reward);
   onMessage('🐕 Rosie is home! Adventure rewards collected.');
 }
 function useAdventureFind(key){
   const n=state.rosieAdventureFinds[key]||0;if(n<=0)return;
   if(key==='cache'){
     state.rosieAdventureFinds.cache--;const coins=250+Math.floor(Math.random()*351);state.coins+=coins;
     let extra='';if(Math.random()<.45){state.gems++;extra=' +1 💎'}else extra=' '+weightedPower();
     onChange();render();onReward?.('Rosie Cache Opened! 🎁',`${coins} coins •${extra}`,'🎁');return;
   }
   onMessage(`${C.rosieAdventures.rareFinds[key].name} activates automatically when its condition is met.`);
 }
 function renderAdventure(){
   const card=document.getElementById('rosieAdventureCard');if(!card||!state)return;
   const a=state.rosieAdventure,now=Date.now(),max=unlockedRegionIndex();
   selectedAdventureRegion=Math.min(selectedAdventureRegion,max);
   const loc=document.getElementById('adventureLocations'),dur=document.getElementById('adventureDurations'),btn=document.getElementById('rosieAdventureAction');
   const supervision=document.getElementById('farmRosieSupervisionText');
   if(supervision){
     if(!a)supervision.textContent='Rosie is supervising. Crops gain one growth step whenever a solitaire level is completed.';
     else if(now>=a.endsAt)supervision.textContent='Rosie is back from her adventure! Welcome her home to reveal what she found.';
     else supervision.textContent=`Rosie is exploring ${regions[a.region]||'the farm'}. Crops still gain one growth step whenever a solitaire level is completed.`;
   }
   if(a){
     const ready=now>=a.endsAt,remaining=Math.max(0,a.endsAt-now),d=adventureDuration(a.duration);
     setText('rosieAdventureStatus',ready?`Rosie is back from ${regions[a.region]}!`:`Exploring ${regions[a.region]} • ${d.name}`);
     setText('rosieAdventureTimer',ready?'HOME!':formatTime(remaining));
     if(loc)loc.innerHTML='';if(dur)dur.innerHTML='';
     if(btn){btn.textContent=ready?'🐾 Welcome Rosie Home':'Rosie is exploring…';btn.disabled=!ready;btn.onclick=()=>claimAdventure()}
   }else{
     setText('rosieAdventureStatus','Choose a destination and how long Rosie should explore.');setText('rosieAdventureTimer','');
     if(loc)loc.innerHTML=regions.slice(0,max+1).map((name,i)=>{const b=adventureRegionBias(i);return`<button class="${i===selectedAdventureRegion?'selected':''}" data-ar="${i}">${regionDefs[i].icon} ${name}<small>Favors ${b.label}</small></button>`}).join('');
     if(dur)dur.innerHTML=C.rosieAdventures.durations.map(d=>`<button class="${d.key===selectedAdventureDuration?'selected':''}" data-ad="${d.key}">${d.icon} ${d.name}<small>${Math.round(d.ms/60000)} min</small></button>`).join('');
     loc?.querySelectorAll('[data-ar]').forEach(b=>b.onclick=()=>{selectedAdventureRegion=+b.dataset.ar;renderAdventure()});
     dur?.querySelectorAll('[data-ad]').forEach(b=>b.onclick=()=>{selectedAdventureDuration=b.dataset.ad;renderAdventure()});
     if(btn){btn.disabled=false;btn.textContent='🐾 Send Rosie Exploring';btn.onclick=startAdventure}
   }
   const finds=document.getElementById('adventureFinds');
   if(finds)finds.innerHTML=Object.entries(C.rosieAdventures.rareFinds).map(([k,d])=>`<button data-find="${k}" ${(state.rosieAdventureFinds[k]||0)<=0?'disabled':''}><span>${d.icon}</span><b>${d.name} ×${state.rosieAdventureFinds[k]||0}</b><small>${d.desc}</small></button>`).join('');
   finds?.querySelectorAll('[data-find]').forEach(b=>b.onclick=()=>useAdventureFind(b.dataset.find));
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
   setText('rosieTreasureStatus',h>=100?'🎁 Treasure ready on next harvest!':`Treasure at 100 • Find bonus +${Math.round(DSH.Progress.happinessFindBonus(state)*100)}%`);
   const now=Date.now(),wait=Math.max(0,C.happiness.petCooldownMs-(now-(Number(state.lastPetAt)||0))),away=!!state.rosieAdventure,returned=away&&now>=state.rosieAdventure.endsAt;
   setText('petRosieCooldown',away?(returned?'🐕 Welcome Rosie home first':'🐾 Rosie is exploring…'):(wait?`Pet again in ${formatTime(wait)}`:'Petting ready'));
   const pet=document.getElementById('petRosieBtn'),feed=document.getElementById('feedTreatBtn');
   if(pet){pet.disabled=away||wait>0;pet.title=away?(returned?'Collect Rosie’s Adventure rewards first.':'Rosie is currently away on an Adventure.'):'Pet Rosie'}
   if(feed){feed.disabled=away||(state.rosieTreats||0)<=0||h>=100;feed.title=away?(returned?'Collect Rosie’s Adventure rewards first.':'Rosie is currently away on an Adventure.'):'Give Rosie a treat'}
 }
 function render(){
   if(!state)return;renderTimedHarvest();renderHappiness();renderOrders();renderAdventure();
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
     for(let n=0;n<regionDefs.length;n++)scene.classList.toggle(`region-${n}`,n===ri);
   }
   const decor=document.getElementById('regionDecorVisual');if(decor){decor.textContent=ownsDecor(r.decor.key)?r.decor.icon:'';decor.title=ownsDecor(r.decor.key)?r.decor.name:''}
   const rosie=document.getElementById('rosie');if(rosie)rosie.classList.toggle('bandanaOn',!!state.upgrades.bandana);
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
   document.querySelectorAll('[data-upgrade]').forEach(b=>{const k=b.dataset.upgrade;b.disabled=!!state.upgrades[k];if(state.upgrades[k])b.textContent='Owned ✓'});
 }
 return{bind,plant,harvest,grow,upgrade,render,visit,petRosie,feedTreat,claimTimedHarvest,renderTimedHarvest,renderHappiness,timedStatus,setRegion,claimRegionRewards,buyRegionDecor,ensureOrders,renderOrders,advanceOrders,collectOrder,readyOrderCount,
 startAdventure,claimAdventure,renderAdventure,useAdventureFind,cropDefs,regions,regionDefs};
})();