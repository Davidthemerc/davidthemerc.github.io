window.DSH=window.DSH||{};
DSH.Seasons=(()=>{
 const C=()=>DSH.Config.seasons;
 const MULTIPLIERS=new Set(['cropCoin','levelCoin','orderCoin','harvestChainCoin','adventureTime']);
 function variantFor(def,index,year){
   const variants=Array.isArray(def.variants)?def.variants:[];if(!variants.length)return null;
   // Stable across reloads/restarts and continues naturally into Endless Harvest.
   return variants[(Math.imul(Math.max(1,year),17)+index*7)%variants.length];
 }
 function combineEffects(base={},extra={}){
   const out={...base};
   Object.entries(extra||{}).forEach(([k,v])=>{
     if(MULTIPLIERS.has(k))out[k]=(Number(out[k])||1)*(Number(v)||1);
     else out[k]=(Number(out[k])||0)+(Number(v)||0);
   });
   return out;
 }
 function info(level=1){
   level=Math.max(1,Math.floor(Number(level)||1));
   const span=C().cycleLevels||10,block=Math.floor((level-1)/span),defs=C().definitions;
   const index=block%defs.length,year=Math.floor(block/defs.length)+1,start=block*span+1,end=start+span-1,def=defs[index],variant=variantFor(def,index,year);
   return{...def,index,year,start,end,key:`${year}-${def.key}`,goal:C().pointGoal||18,variant,effects:combineEffects(def.effects,variant?.effects)};
 }
 function byKey(key){
   const m=/^(\d+)-([a-z-]+)$/.exec(String(key||''));if(!m)return null;const year=Math.max(1,Number(m[1])||1),defs=C().definitions,index=defs.findIndex(d=>d.key===m[2]);if(index<0)return null;
   const span=C().cycleLevels||10,level=(year-1)*defs.length*span+index*span+1;return info(level);
 }
 function effects(state,level=state?.level||1){return{...(info(level).effects||{})}}
 function archiveCurrent(state,cur){
   if(!cur?.key)return;state.seasonHistory=state.seasonHistory&&typeof state.seasonHistory==='object'?state.seasonHistory:{};
   state.seasonHistory[cur.key]={season:cur.season||'',year:Math.max(1,Number(cur.year)||1),startLevel:Number(cur.startLevel)||1,endLevel:Number(cur.endLevel)||1,
     points:Math.max(0,Number(cur.points)||0),claimed:cur.claimed===true,completedAt:Math.max(0,Number(cur.completedAt)||0)};
   const keys=Object.keys(state.seasonHistory).sort((a,b)=>{
     const A=state.seasonHistory[a],B=state.seasonHistory[b];return (B?.endLevel||0)-(A?.endLevel||0);
   });
   keys.slice(24).forEach(k=>delete state.seasonHistory[k]);
 }
 function ensure(state,level=state?.level||1){
   if(!state)return null;const inf=info(level),cur=state.seasonState;
   if(!cur||cur.key!==inf.key){
     if(cur?.key&&cur.key!==inf.key)archiveCurrent(state,cur);
     // Existing/pre-Seasons saves receive conservative credit for levels already
     // cleared inside the current ten-level season, but never auto-claim a Basket.
     const completedBefore=Math.max(0,Math.min((Number(level)||1)-inf.start,C().cycleLevels||10));
     const retro=Math.min(Math.max(0,inf.goal-(C().points.level||2)),completedBefore*(C().points.level||2));
     state.seasonState={key:inf.key,season:inf.key.split('-').slice(1).join('-'),year:inf.year,startLevel:inf.start,endLevel:inf.end,points:retro,claimed:false,completedAt:0};
   }
   state.seasonKeepsakes=state.seasonKeepsakes||{spring:false,summer:false,autumn:false,winter:false};
   state.seasonHistory=state.seasonHistory&&typeof state.seasonHistory==='object'?state.seasonHistory:{};
   return inf;
 }
 function rewardFor(inf){
   const scale=Math.max(0,Math.min(24,(inf.year||1)-1)),r=inf.reward||{};
   return{coins:(r.coins||0)+scale*100,gems:(r.gems||0)+Math.floor(scale/6),windmills:r.windmills||0,gates:r.gates||0,rescues:r.rescues||0,treats:r.treats||0};
 }
 function rewardText(r){
   const a=[];if(r.coins)a.push(`${r.coins} coins`);if(r.gems)a.push(`${r.gems} 💎`);if(r.windmills)a.push(`${r.windmills} 🌬️`);if(r.gates)a.push(`${r.gates} 🚪`);if(r.rescues)a.push(`${r.rescues} 🐾`);if(r.treats)a.push(`${r.treats} 🦴`);return a.join(' • ');
 }
 function pct(mult){return Math.round((mult-1)*100)}
 function effectText(inf){
   const e=inf?.effects||{},a=[];
   if(e.extraGrowth)a.push(`+${e.extraGrowth} crop growth`);
   if(e.cropCoin&&e.cropCoin!==1)a.push(`${pct(e.cropCoin)>=0?'+':''}${pct(e.cropCoin)}% crop coins`);
   if(e.levelCoin&&e.levelCoin!==1)a.push(`${pct(e.levelCoin)>=0?'+':''}${pct(e.levelCoin)}% level coins`);
   if(e.orderCoin&&e.orderCoin!==1)a.push(`${pct(e.orderCoin)>=0?'+':''}${pct(e.orderCoin)}% Order coins`);
   if(e.harvestChainCoin&&e.harvestChainCoin!==1)a.push(`${pct(e.harvestChainCoin)>=0?'+':''}${pct(e.harvestChainCoin)}% Harvest Chain coins`);
   if(e.extraStock)a.push(`+${e.extraStock} starting stock`);
   if(e.adventureTime&&e.adventureTime!==1)a.push(`${Math.round((1-e.adventureTime)*100)}% shorter Adventures`);
   if(e.rosieRareBonus)a.push(`+${Math.round(e.rosieRareBonus*100)}% Rosie rare finds`);
   if(e.windBonus)a.push(`+${Math.round(e.windBonus*100)}% crop Windmill chance`);
   return a.join(' • ');
 }
 function variantText(inf){return inf?.variant?`${inf.variant.icon||'✨'} ${inf.variant.name}: ${inf.variant.desc}`:''}
 function orderFavors(level=1){const inf=info(level);return{info:inf,crops:[...(inf.variant?.orderCrops||[])]}}
 function luckyFavor(level=1){const inf=info(level);return inf.variant?.lucky?{...inf.variant.lucky,season:inf}:null}
 function challengeFlavor(level=1){const inf=info(level);return{season:inf,label:`${inf.icon} ${inf.variant?.name||inf.name}`,bonusCoins:Math.max(0,Math.floor(Number(inf.variant?.challengeBonusCoins)||0))}}
 function award(state,inf){
   const r=rewardFor(inf),ss=state.seasonState;ss.claimed=true;ss.completedAt=Date.now();
   state.coins=(state.coins||0)+r.coins;state.gems=(state.gems||0)+r.gems;state.windmills=(state.windmills||0)+r.windmills;
   state.magicGates=(state.magicGates||0)+r.gates;state.rosieRescues=(state.rosieRescues||0)+r.rescues;state.rosieTreats=(state.rosieTreats||0)+r.treats;
   state.stats=state.stats||{};state.stats.seasonBasketsCompleted=(state.stats.seasonBasketsCompleted||0)+1;state.stats.seasonCoinsEarned=(state.stats.seasonCoinsEarned||0)+r.coins;state.stats.seasonGemsEarned=(state.stats.seasonGemsEarned||0)+r.gems;
   if(r.windmills)state.stats.windmillsFound=(state.stats.windmillsFound||0)+r.windmills;if(r.gates)state.stats.magicGatesFound=(state.stats.magicGatesFound||0)+r.gates;if(r.rescues)state.stats.rosieRescuesFound=(state.stats.rosieRescuesFound||0)+r.rescues;if(r.treats)state.stats.treatsFound=(state.stats.treatsFound||0)+r.treats;
   let firstKeepsake=false;if(!state.seasonKeepsakes[inf.key.split('-').slice(1).join('-')]){const k=inf.key.split('-').slice(1).join('-');state.seasonKeepsakes[k]=true;state.stats.seasonKeepsakesEarned=(state.stats.seasonKeepsakesEarned||0)+1;firstKeepsake=true}
   return{reward:r,firstKeepsake};
 }
 function addProgress(state,source,units=1,level=state?.level||1){
   const inf=ensure(state,level);if(!inf)return null;const ss=state.seasonState;
   if(ss.claimed)return{info:inf,added:0,completed:false,reward:null,points:ss.points,goal:inf.goal};
   const each=C().points[source]||0,amount=Math.max(0,Math.floor(Number(units)||0))*each;if(!amount)return{info:inf,added:0,completed:false,reward:null,points:ss.points,goal:inf.goal};
   const before=Math.max(0,Number(ss.points)||0);ss.points=Math.min(inf.goal,before+amount);const added=ss.points-before;
   state.stats=state.stats||{};state.stats.seasonPointsEarned=(state.stats.seasonPointsEarned||0)+added;
   let completed=false,reward=null,firstKeepsake=false;if(ss.points>=inf.goal&&!ss.claimed){completed=true;const a=award(state,inf);reward=a.reward;firstKeepsake=a.firstKeepsake}
   return{info:inf,added,completed,reward,firstKeepsake,points:ss.points,goal:inf.goal};
 }
 return{info,byKey,effects,ensure,addProgress,rewardFor,rewardText,effectText,variantText,orderFavors,luckyFavor,challengeFlavor,combineEffects};
})();
