window.DSH=window.DSH||{};
DSH.Diagnostics=(()=>{
 function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
 function levelAudit(from=1,to=500,samples=8){
   from=Math.max(1,Math.floor(from));to=Math.max(from,Math.floor(to));samples=Math.max(1,Math.min(50,Math.floor(samples)));
   const rows=[],specialTotals={},warnings=[];let total=0,stockMin=999,stockMax=0,cardsMin=999,cardsMax=0,bonusMax=0;
   for(let level=from;level<=to;level++){
     let levelStock=0,levelCards=0,levelBonus=0,levelObs=0;
     for(let s=0;s<samples;s++){
       const b=DSH.Levels.build(level,rng((level*73856093)^(s*19349663)^0x5f3759df));
       total++;stockMin=Math.min(stockMin,b.stockTarget);stockMax=Math.max(stockMax,b.stockTarget);cardsMin=Math.min(cardsMin,b.cards.length);cardsMax=Math.max(cardsMax,b.cards.length);bonusMax=Math.max(bonusMax,b.obstacleStockBonus||0);
       levelStock+=b.stockTarget;levelCards+=b.cards.length;levelBonus+=b.obstacleStockBonus||0;levelObs+=b.obstacleCount||0;
       Object.entries(b.specialCounts||{}).forEach(([k,v])=>specialTotals[k]=(specialTotals[k]||0)+v);
       if(b.stockTarget<24)warnings.push(`Level ${level}: stock below floor (${b.stockTarget})`);
       if(b.stockTarget>48)warnings.push(`Level ${level}: stock above ceiling (${b.stockTarget})`);
       if(b.cards.length>34)warnings.push(`Level ${level}: tableau unusually large (${b.cards.length})`);
       const locks=b.cards.filter(c=>c.special==='barnlock');
       for(const lock of locks){
         const key=b.cards.find(c=>c.keyPair&&c.keyPair===lock.keyPair&&c.special==='key');
         if(!key)warnings.push(`Level ${level}: Barn Lock missing matching Key`);
         else if(key.row<lock.row)warnings.push(`Level ${level}: Key potentially buried under its Lock`);
       }
     }
     if(level===from||level===to||level%25===0)rows.push({level,avgCards:+(levelCards/samples).toFixed(1),avgStock:+(levelStock/samples).toFixed(1),avgComp:+(levelBonus/samples).toFixed(1),avgObstacles:+(levelObs/samples).toFixed(1)});
   }
   return{from,to,samples,total,stock:{min:stockMin,max:stockMax},cards:{min:cardsMin,max:cardsMax},maxCompensation:bonusMax,specialTotals,warnings:[...new Set(warnings)].slice(0,80),checkpoints:rows};
 }
 function economySnapshot(state){
   const C=DSH.Config,level=Math.max(1,state.level||1),surcharge=Math.floor(Math.max(0,level-1)/(C.draws.levelSurchargeEvery||10))*(C.draws.levelSurcharge||0);
   const currentDrawPrices=C.draws.prices.map(x=>x+surcharge),levelBase=150+level*28,drawCost=currentDrawPrices.reduce((a,b)=>a+b,0);
   const crops=Object.fromEntries(Object.entries(C.crops).map(([k,d])=>[k,{cost:d.cost,payout:d.payout,net:d.payout-d.cost,grow:d.grow}]));
   return{
     level,normalLevelBaseCoins:levelBase,allThreeEmergencyDrawPacks:drawCost,
     drawPackPrices:currentDrawPrices,
     timedHarvest:{intervalMinutes:C.timedHarvest.ms/60000,cap:C.timedHarvest.cap,baseCoins:C.timedHarvest.baseCoins},
     crops,
     missionTypicalCoins:C.missions.coinBase+level*C.missions.coinPerLevel,
     dailyReward:{coins:C.dailyChallenge.coins,gems:C.dailyChallenge.gems},
     wallet:{coins:state.coins,gems:state.gems},
     lifetime:state.lifetime||{}
   };
 }
 function saveReport(state){
   const r=DSH.Save.doctor(state),backups=DSH.Save.backupInfo();
   return{healthy:r.healthy,issues:r.issues,version:DSH.Save.VERSION,level:r.state.level,coins:r.state.coins,gems:r.state.gems,rosieHappiness:r.state.rosieHappiness,backups};
 }
 function textReport(state,range={from:1,to:500,samples:6}){
   const save=saveReport(state),levels=levelAudit(range.from,range.to,range.samples),eco=economySnapshot(state);
   return[
     `Denise's Solitaire Harvest v${DSH.Save.VERSION} Diagnostics`,
     `Generated: ${new Date().toISOString()}`,
     '',
     `SAVE: ${save.healthy?'HEALTHY':'ISSUES FOUND'} • Level ${save.level} • ${save.issues.length} issue(s)`,
     ...(save.issues.length?save.issues.map(x=>'  - '+x):['  - No structural issues detected']),
     `Backups: ${save.backups.map(b=>b.exists?`${['A','B','C'][b.slot-1]}: L${b.level}${b.invalid?' INVALID':''}`:`${['A','B','C'][b.slot-1]}: empty`).join(' | ')}`,
     '',
     `LEVEL GENERATOR: ${levels.from}-${levels.to}, ${levels.samples} sample(s)/level, ${levels.total} boards`,
     `  Tableau cards: ${levels.cards.min}-${levels.cards.max}`,
     `  Starting stock: ${levels.stock.min}-${levels.stock.max}`,
     `  Max compensation: +${levels.maxCompensation}`,
     `  Warnings: ${levels.warnings.length}`,
     ...levels.warnings.slice(0,20).map(x=>'  - '+x),
     '',
     `ECONOMY @ LEVEL ${eco.level}`,
     `  Base level coins: ${eco.normalLevelBaseCoins}`,
     `  +5 draw packs: ${eco.drawPackPrices.join(' / ')} (all three ${eco.allThreeEmergencyDrawPacks})`,
     `  Mission typical: ${eco.missionTypicalCoins}`,
     `  Timed harvest: ${eco.timedHarvest.baseCoins} base every ${eco.timedHarvest.intervalMinutes}m, cap ${eco.timedHarvest.cap}`,
     `  Wallet: ${eco.wallet.coins} coins / ${eco.wallet.gems} gems`
   ].join('\n');
 }
 return{levelAudit,economySnapshot,saveReport,textReport};
})();