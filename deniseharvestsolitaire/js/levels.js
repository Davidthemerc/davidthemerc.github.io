window.DSH=window.DSH||{};
DSH.Levels=(()=>{
 let R=Math.random;
 const formations=[
  {name:'Twin Terraces',min:1,build:terraces},
  {name:'Harvest Pyramid',min:1,build:pyramid},
  {name:'Country Bridge',min:2,build:bridge},
  {name:'Split Fields',min:3,build:islands},
  {name:'Diamond Rows',min:4,build:diamond},
  {name:'Windrows',min:5,build:windrows},
  {name:'Barn Steps',min:6,build:steps},
  {name:'Orchard Rows',min:8,build:orchard},
  {name:'Garden Gate',min:12,build:gardenGate},
  {name:'Trellis',min:16,build:trellis},
  {name:'Creek Crossing',min:20,build:creek},
  {name:'Harvest Spiral',min:24,build:spiral},
  {name:'Windmill Ring',min:30,build:ring}
 ];
 function node(x,y,row){return{x,y,row,removed:false,blockers:[]}}
 function autoBlock(cards,dx=.115,depth=2){
   cards.forEach((c,i)=>cards.forEach((o,j)=>{
     if(i!==j&&o.row>c.row&&o.row-c.row<=depth&&Math.abs(o.x-c.x)<dx&&!c.blockers.includes(o.id))c.blockers.push(o.id)
   }));
   return cards;
 }
 function tag(cards){cards.forEach((c,i)=>c.id='c'+i);return cards}
 function trim(cards,count){return tag(cards.slice(0,Math.min(count,cards.length)))}
 function terraces(count){let a=[];for(let r=0;r<4;r++){const n=5+r*2;for(let i=0;i<n;i++)a.push(node((i+.5)/n,.08+r*.19,r))}return autoBlock(trim(a,count),.09,2)}
 function pyramid(count){let a=[];for(let r=0;r<6;r++){let n=2+r*2;for(let i=0;i<n;i++)a.push(node(.5+(i-(n-1)/2)*(.72/Math.max(n-1,1)),.05+r*.145,r))}return autoBlock(trim(a,count),.095,2)}
 function bridge(count){let a=[];for(let r=0;r<4;r++){let n=r===0?5:r===1?7:r===2?10:12;for(let i=0;i<n;i++){if(r<2&&i>1&&i<n-2&&i%2===1)continue;a.push(node((i+.5)/n,.07+r*.19,r))}}return autoBlock(trim(a,count),.09,2)}
 function islands(count){let a=[];for(let r=0;r<4;r++){let n=3+r;[.27,.73].forEach(cx=>{for(let i=0;i<n;i++)a.push(node(cx+(i-(n-1)/2)*.07,.06+r*.19,r))})}return autoBlock(trim(a,count),.082,2)}
 function diamond(count){let a=[];[3,6,10,6,3].forEach((n,r)=>{for(let i=0;i<n;i++)a.push(node(.5+(i-(n-1)/2)*(.68/Math.max(n-1,1)),.04+r*.155,r))});return autoBlock(trim(a,count),.1,2)}
 function windrows(count){let a=[];for(let r=0;r<5;r++){let n=6+(r%2)*3;for(let i=0;i<n;i++)a.push(node((i+.5)/n,.05+r*.15,r))}return autoBlock(trim(a,count),.085,1)}
 function steps(count){let a=[];for(let r=0;r<5;r++){let n=5+r;for(let i=0;i<n;i++)a.push(node(.18+r*.06+i*.065,.05+r*.155,r))}return autoBlock(trim(a,count),.08,2)}
 function orchard(count){
   let a=[];for(let r=0;r<5;r++){const n=6;for(let i=0;i<n;i++){const offset=(r%2)*.035;a.push(node(.13+offset+i*.145,.05+r*.155,r))}}
   return autoBlock(trim(a,count),.095,2)
 }
 function gardenGate(count){
   let a=[];for(let r=0;r<5;r++){const n=r<2?6:8;for(let i=0;i<n;i++){if(r<3&&i===Math.floor(n/2))continue;a.push(node((i+.5)/n,.05+r*.155,r))}}
   return autoBlock(trim(a,count),.092,2)
 }
 function trellis(count){
   let a=[];for(let r=0;r<5;r++){const n=5+r;for(let i=0;i<n;i++){const x=.16+i*(.68/Math.max(n-1,1));a.push(node(x,.045+r*.155,r))}}
   return autoBlock(trim(a,count),.075,2)
 }
 function creek(count){
   let a=[];for(let r=0;r<5;r++){const n=6;for(let i=0;i<n;i++){const bend=Math.sin((i+r)*1.35)*.025;a.push(node(.1+i*.16+bend,.05+r*.155,r))}}
   return autoBlock(trim(a,count),.09,1)
 }
 function spiral(count){
   let a=[];const total=Math.max(30,count);for(let i=0;i<total;i++){const t=i/(total-1),ang=t*Math.PI*3.6,rad=.34*(1-t*.7);a.push(node(.5+Math.cos(ang)*rad,.38+Math.sin(ang)*rad*.75,Math.floor(t*6)))}
   return autoBlock(trim(a,count),.085,2)
 }
 function ring(count){
   let a=[];const rows=5;for(let r=0;r<rows;r++){const n=5+r;for(let i=0;i<n;i++){const ang=(i/n)*Math.PI*2+(r%2)*.25,rad=.15+r*.055;a.push(node(.5+Math.cos(ang)*rad,.38+Math.sin(ang)*rad*.7,r))}}
   return autoBlock(trim(a,count),.08,2)
 }

 function targetCount(level){
   const base=14+Math.floor(level*.72),wobble=Math.floor(R()*5)-2;
   return Math.max(14,Math.min(DSH.Config?.difficulty?.tableauCeiling||30,base+wobble));
 }
 function stockTarget(level,fieldCount){
   const D=DSH.Config?.difficulty||{stockFloor:24,stockCeiling:44};
   const progression=Math.min(8,Math.floor((level-1)/5));
   return Math.max(D.stockFloor,Math.min(34,D.stockFloor+progression+Math.floor(fieldCount/12)));
 }
 function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
 function choose(cards,type,count){
   const candidates=shuffle(cards.filter(c=>!c.special));
   candidates.slice(0,Math.min(count,candidates.length)).forEach(c=>c.special=type);
 }
 function dependsOnCard(candidate,targetId,cards,seen=new Set()){
   if(!candidate||seen.has(candidate.id))return false;seen.add(candidate.id);
   // Both physical blockers and already-assigned special requirements are
   // "must clear before this card" edges. Traverse both so adding a new
   // Vine/Crate requirement can never close a circular dependency.
   const deps=[...(Array.isArray(candidate.blockers)?candidate.blockers:[]),...(Array.isArray(candidate.specialRequires)?candidate.specialRequires:[])];
   if(deps.includes(targetId))return true;
   return deps.some(id=>dependsOnCard(cards.find(c=>c.id===id),targetId,cards,new Set(seen)));
 }
 function blockerAncestorIds(card,cards,out=new Set()){
   (card?.blockers||[]).forEach(id=>{if(out.has(id))return;out.add(id);blockerAncestorIds(cards.find(c=>c.id===id),cards,out)});
   return out;
 }
 function nearbyNormals(card,cards,needed){
   // Requirement cards must be removable BEFORE the special card itself. Older
   // selection could choose a card structurally underneath a Vine/Crate, creating
   // a circular dependency: clear B to unlock A, but A physically blocks B.
   const list=cards.filter(o=>o.id!==card.id&&!o.special&&!dependsOnCard(o,card.id,cards))
     .map(o=>({o,d:Math.abs(o.x-card.x)*1.2+Math.abs(o.y-card.y)+Math.max(0,card.row-o.row)*.5}))
     .sort((a,b)=>a.d-b.d).map(x=>x.o);
   return list.slice(0,needed).map(x=>x.id);
 }
 function decorate(cards,level){
   // Complexity rises by mechanics, not endlessly by raw card count.
   if(level>=8)choose(cards,'vine',Math.min(3,1+Math.floor((level-8)/20)));
   if(level>=12)choose(cards,'flower',level>=34?2:1);
   if(level>=16)choose(cards,'crate',Math.min(2,1+Math.floor((level-16)/30)));
   if(level>=20)choose(cards,'gold',level>=48?2:1);
   if(level>=24)choose(cards,'mud',level>=56?2:1);
   if(level>=30){
     const need=DSH.Config?.specialCards?.chainRequiredStreak||3;
     const pool=shuffle(cards.filter(c=>!c.special&&blockerAncestorIds(c,cards).size>=need));
     pool.slice(0,Math.min(level>=66?2:1,pool.length)).forEach(c=>c.special='chain');
   }
   if(level>=36&&R()<Math.min(.60,.25+(level-36)*.012))choose(cards,'rainbow',1);

   // v35 strategic mechanics. Key is chosen from an exposed/later-row card and the
   // lock from an earlier row so the generator cannot bury the key beneath its own lock.
   if(level>=42&&R()<Math.min(.72,.32+(level-42)*.01)){
     const rows=cards.map(c=>c.row),maxRow=Math.max(...rows),keyPool=cards.filter(c=>!c.special&&c.row>=maxRow-1);
     const key=keyPool[Math.floor(R()*keyPool.length)];
     const lockPool=cards.filter(c=>!c.special&&c!==key&&(!key||c.row<key.row));
     const lock=lockPool[Math.floor(R()*lockPool.length)];
     if(key&&lock){const pair='K'+level+'-'+Math.floor(R()*9999);key.special='key';key.keyPair=pair;lock.special='barnlock';lock.keyPair=pair;lock.specialRequires=[key.id]}
   }
   if(level>=46&&R()<Math.min(.70,.30+(level-46)*.009))choose(cards,'watering',1);
   if(level>=50&&R()<Math.min(.58,.22+(level-50)*.008))choose(cards,'bee',1);
   if(level>=54&&R()<Math.min(.72,.28+(level-54)*.008)){
     const pool=shuffle(cards.filter(c=>!c.special)),qty=Math.min(pool.length,level>=78?3:2),group='H'+level+'-'+Math.floor(R()*9999);
     pool.slice(0,qty).forEach((c,i)=>{c.special='harvestchain';c.chainGroup=group;c.chainIndex=i;c.chainSize=qty});
   }
   // v39: difficulty grows through mechanics rather than starving the stock.
   if(level>=58&&R()<Math.min(.58,.20+(level-58)*.007))choose(cards,'heavy',level>=90?2:1);
   if(level>=62&&R()<Math.min(.52,.18+(level-62)*.006)){
     // A Sleeping Card needs four tableau clears before it wakes. Put it only
     // somewhere that is guaranteed to have at least that many physical
     // prerequisite cards cleared before the player can reach it.
     const need=DSH.Config?.specialCards?.sleepingClears||4;
     const pool=shuffle(cards.filter(c=>!c.special&&blockerAncestorIds(c,cards).size>=need));
     if(pool.length)pool[0].special='sleeping';
   }
   if(level>=66&&R()<Math.min(.55,.18+(level-66)*.006))choose(cards,'sunflower',1);

   cards.forEach(c=>{
     if(c.special==='vine')c.specialRequires=nearbyNormals(c,cards,1);
     if(c.special==='crate')c.specialRequires=nearbyNormals(c,cards,2);
   });

   return summarizeSpecials(cards);
 }
 function summarizeSpecials(cards){
   const counts={vine:0,flower:0,crate:0,gold:0,mud:0,chain:0,rainbow:0,key:0,barnlock:0,watering:0,bee:0,harvestchain:0,heavy:0,sleeping:0,sunflower:0};
   cards.forEach(c=>{if(c.special&&counts[c.special]!==undefined)counts[c.special]++});
   const hardScore=counts.vine+counts.crate*1.7+counts.mud*.5+counts.chain*1.3+counts.barnlock*1.5+counts.bee*.45+counts.harvestchain*.25+counts.heavy*1.2+counts.sleeping*.8;
   const obstacleCount=counts.vine+counts.crate+counts.mud+counts.chain+counts.barnlock+counts.heavy+counts.sleeping;
   const stockBonus=obstacleCount?Math.min(7,Math.max(1,Math.ceil(hardScore/2))):0;
   const labels=[],names={vine:'Vines',flower:'Flowers',crate:'Crates',gold:'Gold',mud:'Mud',chain:'Chains',rainbow:'Rainbow',key:'Keys',barnlock:'Barn Locks',watering:'Watering Cans',bee:'Bees',harvestchain:'Harvest Chains',heavy:'Heavy Cards',sleeping:'Sleeping Cards',sunflower:'Sunflowers'};
   Object.keys(counts).forEach(k=>{if(counts[k])labels.push(names[k])});
   return{counts,obstacleCount,stockBonus,labels};
 }
 function milestoneFormation(level){
   const chapter=Math.max(1,Math.ceil(level/10)),rows=Math.min(5,3+Math.floor(chapter/3));
   const cards=[],cols=Math.min(8,5+Math.floor(chapter/2));
   // v40.3: milestone boards now use the SAME normalized node/blocker model as every
   // other formation. Older milestone code used x/y percentages plus coveredBy arrays,
   // which could crash blocked() and push every card off-screen.
   for(let row=0;row<rows;row++){
     const count=Math.max(3,cols-row),span=Math.min(.80,.18+(count-1)*.12),left=.5-span/2;
     for(let col=0;col<count;col++)cards.push(node(count===1?.5:left+(col/(count-1))*span,.07+row*(.70/(rows-1||1)),row));
   }
   tag(cards);
   cards.forEach(c=>{
     if(c.row>=rows-1)return;
     const next=cards.filter(n=>n.row===c.row+1),threshold=.13;
     next.filter(n=>Math.abs(n.x-c.x)<threshold).forEach(n=>{if(!c.blockers.includes(n.id))c.blockers.push(n.id)});
     // Guarantee every covered row card has at least one blocker so the ridge reveals
     // progressively rather than accidentally exposing isolated lower cards.
     if(!c.blockers.length&&next.length){const nearest=[...next].sort((a,b)=>Math.abs(a.x-c.x)-Math.abs(b.x-c.x))[0];c.blockers.push(nearest.id)}
   });
   return cards;
 }
 function validateBoardData(built){
   const errors=[],cards=built?.cards;
   if(!built||!Array.isArray(cards)||!cards.length)return['Board has no tableau cards'];
   const ids=new Set();
   cards.forEach((c,i)=>{
     if(c==null||typeof c!=='object'){errors.push(`Card ${i} is invalid`);return}
     if(c.id===undefined||c.id===null)errors.push(`Card ${i} has no id`);else if(ids.has(c.id))errors.push(`Duplicate card id ${c.id}`);else ids.add(c.id);
     if(!Array.isArray(c.blockers))errors.push(`Card ${c.id??i} has no blockers array`);
     if(!Number.isFinite(c.x)||c.x<0||c.x>1)errors.push(`Card ${c.id??i} x is outside 0-1`);
     if(!Number.isFinite(c.y)||c.y<0||c.y>1)errors.push(`Card ${c.id??i} y is outside 0-1`);
   });
   cards.forEach(c=>(c?.blockers||[]).forEach(id=>{if(!ids.has(id))errors.push(`Card ${c.id} references missing blocker ${id}`);if(id===c.id)errors.push(`Card ${c.id} blocks itself`)}));
   const exposed=cards.filter(c=>(c.blockers||[]).length===0);if(!exposed.length)errors.push('Board starts with no exposed cards');
   if(!Number.isFinite(Number(built.stockTarget))||built.stockTarget<1)errors.push('Board has invalid starting stock');
   if(built.specialCounts){
     const actual={};cards.forEach(c=>{if(c.special)actual[c.special]=(actual[c.special]||0)+1});
     new Set([...Object.keys(actual),...Object.keys(built.specialCounts)]).forEach(k=>{if((actual[k]||0)!==(built.specialCounts[k]||0))errors.push(`Special count mismatch for ${k}`)});
   }
   // Structural solvability pass: ignore rank luck, but prove that blocker and
   // special-card requirements themselves cannot deadlock the tableau.
   if(!errors.length){
     const removed=new Set();let clearCount=0,guard=0;
     while(removed.size<cards.length&&guard++<cards.length+5){
       let progress=false;
       for(const c of cards){
         if(removed.has(c.id)||(c.blockers||[]).some(id=>!removed.has(id)))continue;
         const req=c.specialRequires||[];let locked=false;
         if(c.special==='vine')locked=req.length&&req.filter(id=>removed.has(id)).length<1;
         else if(c.special==='crate')locked=req.length&&req.filter(id=>removed.has(id)).length<Math.min(2,req.length);
         else if(c.special==='barnlock')locked=req.some(id=>!removed.has(id));
         else if(c.special==='sleeping')locked=clearCount<(DSH.Config?.specialCards?.sleepingClears||4);
         // Chain has a runtime safety release if it becomes the only actionable route.
         // Heavy/etc. are interaction constraints, not structural dependencies.
         if(locked)continue;
         removed.add(c.id);clearCount++;progress=true;
       }
       if(!progress)break;
     }
     if(removed.size<cards.length)errors.push(`Structural deadlock leaves ${cards.length-removed.size} tableau card(s) unreachable`);
   }
   return[...new Set(errors)];
 }
 function recoveryFormation(level){
   const count=Math.max(14,Math.min(24,targetCount(level))),cards=terraces(count),base=stockTarget(level,cards.length);
   return{name:`Recovery Meadow ${level}`,cards,count:cards.length,milestone:false,stockTarget:Math.max(28,base),baseStockTarget:base,obstacleStockBonus:0,obstacleCount:0,specialCounts:{},specialLabels:[],recovered:true};
 }
 function buildSafe(level,rng=Math.random){
   try{const built=build(level,rng),issues=validateBoardData(built);if(issues.length)throw new Error(issues.join('; '));return built}
   catch(err){const fallback=recoveryFormation(level);fallback.recoveryReason=String(err?.message||err);return fallback}
 }
 function build(level,rng=Math.random){
   const prev=R;R=typeof rng==='function'?rng:Math.random;
   try{
     const milestone=level%10===0;
     const available=formations.filter(f=>level>=f.min),f=available[Math.floor(R()*available.length)];
     const count=targetCount(level),cards=milestone?milestoneFormation(level):f.build(count);let specials=decorate(cards,level);
     // Milestones deliberately contain a richer mix of specials once those mechanics are unlocked.
     if(milestone&&level>=20){
       const eligible=cards.filter(c=>!c.special);
       const bonusTypes=level>=60?['gold','watering','barnlock','rainbow']:level>=50?['gold','flower','bee','watering']:level>=36?['gold','flower','vine','rainbow']:level>=24?['gold','flower','vine','mud']:['gold','flower','vine'];
       bonusTypes.forEach((type,i)=>{const c=eligible[(i*3+level)%eligible.length];if(c&&!c.special){
         if(type==='barnlock'){c.special='crate';c.specialRequires=nearbyNormals(c,cards,2)}
         else{c.special=type;if(type==='vine')c.specialRequires=nearbyNormals(c,cards,1)}
       }});
       specials=summarizeSpecials(cards);
     }
     const milestoneBonus=milestone?4:0;
     const baseStock=stockTarget(level,cards.length);
     return{
       name:milestone?`Milestone Ridge ${level}`:f.name,cards,count:cards.length,milestone,
       stockTarget:Math.max(DSH.Config?.difficulty?.stockFloor||24,Math.min(DSH.Config?.difficulty?.stockCeiling||44,baseStock+specials.stockBonus+milestoneBonus)),
       baseStockTarget:baseStock,obstacleStockBonus:specials.stockBonus+milestoneBonus,
       obstacleCount:specials.obstacleCount,specialCounts:specials.counts,specialLabels:specials.labels
     };
   }finally{R=prev}
 }
 return{build,buildSafe,validateBoardData,stockTarget};
})();