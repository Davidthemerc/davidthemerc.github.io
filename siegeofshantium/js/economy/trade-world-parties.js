function interregionalTradeSignals(limit=6){
 if(!crossRegionTradeUnlocked())return [];const unlocked=state.world.unlockedRegions||['shantium'],settlements=unlocked.flatMap(r=>regionalSettlements(r)),rows=[];
 for(const dest of settlements)for(const g of TRADE_GOODS){
  const dStock=tradeStock(dest.id,g.id),demand=tradeDemandScore(dest.id,g.id);if(demand<1&&dStock>3)continue;
  const sources=settlements.filter(s=>locationRegion(s.id)!==locationRegion(dest.id)).map(s=>({s,stock:tradeStock(s.id,g.id),price:tradePrice(s.id,g.id),role:tradeGoodRole(s.id,g.id)})).filter(x=>x.stock>=3).sort((a,b)=>(b.role==='source')-(a.role==='source')||a.price-b.price);
  const src=sources[0];if(!src)continue;const sell=tradePrice(dest.id,g.id),margin=sell-src.price,days=tradeRouteDistanceDays(src.s.id,dest.id),score=margin+demand*8+Math.max(0,4-dStock)*5+(src.role==='source'?7:0)-days;
  if(score>8)rows.push({from:src.s.id,to:dest.id,gid:g.id,margin,days,risk:crossRegionRouteLabel(src.s.id,dest.id),score,need:demand,stock:dStock})
 }
 const seen=new Set();return rows.sort((a,b)=>b.score-a.score).filter(x=>{const k=`${x.gid}:${locationRegion(x.from)}:${locationRegion(x.to)}`;if(seen.has(k))return false;seen.add(k);return true}).slice(0,limit)
}
function interregionalSignalsHTML(limit=4){
 const rows=interregionalTradeSignals(limit);if(!rows.length)return SOSText("economy_trade_world_parties.interregionalSignalsHTML.001");
 return rows.map(r=>SOSText("economy_trade_world_parties.interregionalSignalsHTML.002",esc(worldGood(r.gid).name),esc(regionDef(locationRegion(r.from)).name),esc(regionDef(locationRegion(r.to)).name),esc(worldLocation(r.from).name),esc(worldLocation(r.to).name),r.margin,r.days,esc(r.risk),r.stock)).join('')
}
function compactMatureWorldState(){
 if(!isOpenWorld())return 0;let changed=0,w=state.world,T=tradeEconomyState(),R=travelerRegistryState();
 if((T.trades||[]).length>200){T.trades=T.trades.slice(-200);changed++}const B=relationshipBridgeState();if(B.history.length>80){B.history=B.history.slice(-80);changed++}repairWorldLifeState();if(state.world.socialLife.history.length>60){state.world.socialLife.history=state.world.socialLife.history.slice(-60);changed++}if(state.world.socialChains.history.length>80){state.world.socialChains.history=state.world.socialChains.history.slice(-80);changed++}if(state.world.populationMovement.history.length>80){state.world.populationMovement.history=state.world.populationMovement.history.slice(-80);changed++}if(state.world.relationshipContracts.history.length>80){state.world.relationshipContracts.history=state.world.relationshipContracts.history.slice(-80);changed++}if(state.world.factionSocial.history.length>80){state.world.factionSocial.history=state.world.factionSocial.history.slice(-80);changed++}
 if((w.townLife?.history||[]).length>120){w.townLife.history=w.townLife.history.slice(-120);changed++}
 if((w.quests||[]).length>160){const live=w.quests.filter(q=>['active','ready'].includes(q.status)),story=w.quests.filter(q=>q.storyArcId&&!['active','ready'].includes(q.status)).slice(-30),past=w.quests.filter(q=>!q.storyArcId&&!['active','ready'].includes(q.status)).slice(-100),ids=new Set();w.quests=[...live,...story,...past].filter(q=>!ids.has(q.id)&&(ids.add(q.id),true));changed++}
 const recs=Object.values(R.records);if(recs.length>90){
   const activeIds=new Set((w.parties||[]).map(p=>p.travelerId).filter(Boolean)),social=companionSocialNetworkState(),socialIds=new Set(Object.values(social.travelerOpinions||{}).filter(o=>Math.abs(o.score||0)>=1).map(o=>o.travelerId)),requestIds=new Set((social.requests||[]).filter(x=>x.status==='active'&&x.travelerId).map(x=>x.travelerId));
   const important=recs.filter(r=>activeIds.has(r.id)||r.identity||r.settledAt||(r.contractsCompleted||0)>0||(r.helped||0)>=2||socialIds.has(r.id)||requestIds.has(r.id));
   const importantIds=new Set(important.map(r=>r.id)),disposable=recs.filter(r=>!importantIds.has(r.id)).sort((a,b)=>((b.social?.familiarity||0)*20+(b.lastSeenDay||0))-((a.social?.familiarity||0)*20+(a.lastSeenDay||0)));
   const target=Math.max(90,important.length),keep=[...important,...disposable.slice(0,Math.max(0,target-important.length))];
   if(keep.length<recs.length){R.records=Object.fromEntries(keep.map(x=>[x.id,x]));changed++}
 }
 return changed
}

function worldGood(id){return TRADE_GOODS.find(x=>x.id===id)}
function tradeEconomyState(){ensureWorldState();return state.world.tradeEconomy}

const CROSS_REGION_TRADE={
 routes:[
  {id:'northwest_high_road',connection:'northwest_highroad',name:SOSText("economy_trade_world_parties.tradeEconomyState.001")},
  {id:'eastern_redstone_road',connection:'eastern_redstone_road',name:SOSText("economy_trade_world_parties.tradeEconomyState.002")}
 ],
 exports:{
  shantium:{food:2,medicine:2,cloth:2,luxury:2,tools:1},
  bluestone:{iron:3,tools:3,timber:2,food:2,medicine:1},
  redstone:{food:3,timber:3,tools:2,cloth:2,luxury:2}
 }
};
function crossRegionTradeUnlocked(){return (state.world?.unlockedRegions||[]).length>1}
function crossRegionTradeState(){
 const T=tradeEconomyState();if(!T.crossRegion||typeof T.crossRegion!=='object')T.crossRegion={flows:[],disruptions:[],lastSpawnDay:0,delivered:0,lost:0};
 if(!Array.isArray(T.crossRegion.flows))T.crossRegion.flows=[];if(!Array.isArray(T.crossRegion.disruptions))T.crossRegion.disruptions=[];return T.crossRegion
}
function isCrossRegionRoute(a,b){return !!a&&!!b&&locationRegion(a)!==locationRegion(b)}
function connectionRouteName(a,b){const c=regionConnectionForRegions(locationRegion(a),locationRegion(b));return c?.name||`${regionDef(locationRegion(a)).name}–${regionDef(locationRegion(b)).name} route`}
function crossRegionRoutePlan(from,to){
 if(!isCrossRegionRoute(from,to))return {days:worldTravelDays(from,to),segments:[{from,to,days:worldTravelDays(from,to),kind:'regional'}],connections:[]};
 const startRegion=locationRegion(from),goalRegion=locationRegion(to),regions=Object.keys(WORLD_REGIONS),dist={},prev={},visited=new Set();for(const r of regions)dist[r]=Infinity;dist[startRegion]=0;
 while(true){let cur=null,best=Infinity;for(const r of regions)if(!visited.has(r)&&dist[r]<best){best=dist[r];cur=r}if(cur===null||cur===goalRegion)break;visited.add(cur);
  for(const nr of connectedRegions(cur)){const c=regionConnectionForRegions(cur,nr);if(!c)continue;const exit=locationRegion(c.a)===cur?c.a:c.b,entry=exit===c.a?c.b:c.a,step=c.days+1;if(dist[cur]+step<dist[nr]){dist[nr]=dist[cur]+step;prev[nr]={region:cur,c,exit,entry}}}
 }
 if(!Number.isFinite(dist[goalRegion]))return {days:99,segments:[],connections:[]};
 const legs=[];let r=goalRegion;while(r!==startRegion){const p=prev[r];if(!p)break;legs.unshift(p);r=p.region}
 let days=0,current=from;const segments=[],connections=[];
 for(const leg of legs){if(current!==leg.exit){const d=worldTravelDays(current,leg.exit);days+=d;segments.push({from:current,to:leg.exit,days:d,kind:'regional'})}days+=leg.c.days;segments.push({from:leg.exit,to:leg.entry,days:leg.c.days,kind:'connection',name:leg.c.name});connections.push(leg.c);current=leg.entry}
 if(current!==to){const d=worldTravelDays(current,to);days+=d;segments.push({from:current,to,days:d,kind:'regional'})}
 return {days:Math.max(1,days),segments,connections}
}
function crossRegionRouteDays(a,b){return crossRegionRoutePlan(a,b).days}
function directlyConnectedDestinationRegions(from){const r=locationRegion(from),unlocked=state.world.unlockedRegions||['shantium'];return connectedRegions(r).filter(x=>unlocked.includes(x))}
function crossRegionDestination(from){
 if(!crossRegionTradeUnlocked())return null;const candidates=[];
 for(const other of directlyConnectedDestinationRegions(from))for(const loc of regionalSettlements(other)){if(loc.hidden)continue;let score=0;for(const g of TRADE_GOODS)score+=(tradeGoodRole(from,g.id)==='source'?2:0)+tradeDemandScore(loc.id,g.id)+(tradePrice(loc.id,g.id)-tradePrice(from,g.id))/18;candidates.push({id:loc.id,score})}
 return candidates.sort((a,b)=>b.score-a.score)[0]?.id||null
}
function crossRegionMerchantManifest(origin,destination,lots=rnd(3,7)){
 const fromRegion=locationRegion(origin),bias=CROSS_REGION_TRADE.exports[fromRegion]||{};
 const candidates=TRADE_GOODS.map(g=>({g,score:(bias[g.id]||0)+(tradeGoodRole(origin,g.id)==='source'?4:0)+tradeDemandScore(destination,g.id)*2+(tradePrice(destination,g.id)-tradePrice(origin,g.id))/10})).sort((a,b)=>b.score-a.score);
 const out={};for(let n=0;n<lots;n++){const pool=candidates.slice(0,4),g=pick(pool)?.g||candidates[0].g;out[g.id]=(out[g.id]||0)+1}return out
}
function assignCrossRegionMerchant(p,destination=null){
 if(!p||p.kind!=='merchant'||!crossRegionTradeUnlocked())return p;const dest=destination||crossRegionDestination(p.location);if(!dest)return p;
 p.origin=p.location;p.destination=dest;p.region=locationRegion(p.location);p.crossRegion=true;p.tradeRoute=connectionRouteName(p.origin,dest);p.travelTotal=p.travelLeft=crossRegionRouteDays(p.location,dest);p.manifest=crossRegionMerchantManifest(p.origin,dest,p.cargo||rnd(3,7));p.cargo=manifestLots(p.manifest);
 crossRegionTradeState().flows.push({day:state.world.day,status:'departed',partyId:p.id,party:p.name,origin:p.origin,destination:p.destination,route:p.tradeRoute,manifest:{...p.manifest}});crossRegionTradeState().flows=crossRegionTradeState().flows.slice(-60);return p
}
function regionalMerchantStarts(region){
 return {shantium:['shantium','river','stonebridge','northgate','redoubt'],bluestone:['zion','norwegian','winterstone','ebonheart','lowcreek'],redstone:['sengia','lockwood','grayhaven','briarlake','glenbrook','tyrdon','pyreglade']}[region]||regionalSettlements(region).map(x=>x.id)
}
function spawnCrossRegionMerchant(fromRegion=null){
 if(!crossRegionTradeUnlocked())return null;const unlocked=state.world.unlockedRegions||['shantium'],eligible=unlocked.filter(r=>directlyConnectedDestinationRegions(regionalMerchantStarts(r)[0]||'shantium').length||connectedRegions(r).some(x=>unlocked.includes(x))),region=fromRegion&&unlocked.includes(fromRegion)?fromRegion:pick(eligible.length?eligible:unlocked),starts=regionalMerchantStarts(region);
 const p=spawnWorldParty('merchant',region);p.location=pick(starts);p.origin=p.location;p.cargo=rnd(3,7);return assignCrossRegionMerchant(p)
}
function maybeSpawnCrossRegionTrade(){
 if(!crossRegionTradeUnlocked())return;const X=crossRegionTradeState();if(state.world.day<=X.lastSpawnDay)return;const active=state.world.parties.filter(p=>p.kind==='merchant'&&p.crossRegion).length;
 if(active<Math.max(2,(state.world.unlockedRegions.length-1)*2)||chance(.35)){spawnCrossRegionMerchant();X.lastSpawnDay=state.world.day}
}
function recordCrossRegionDelivery(p,locId){
 if(!p?.crossRegion)return;const X=crossRegionTradeState();X.delivered=(X.delivered||0)+1;X.flows.push({day:state.world.day,status:'delivered',partyId:p.id,party:p.name,origin:p.origin,destination:locId,route:p.tradeRoute,manifest:{...(p.manifest||{})}});X.flows=X.flows.slice(-60);
 addSettlementEvidence(locId,SOSText("economy_trade_world_parties.recordCrossRegionDelivery.001",p.name,p.tradeRoute||'regional road',worldLocation(p.origin).name),'good',5)
}
function crossRegionSupplyPressure(){
 if(!crossRegionTradeUnlocked())return;const X=crossRegionTradeState(),recentLoss=X.disruptions.filter(x=>state.world.day-x.day<=8);
 for(const x of recentLoss){const dest=x.destination;if(!state.world.settlements[dest])continue;for(const [gid,qty] of Object.entries(x.manifest||{})){if(qty<1)continue;changeTradeStock(dest,gid,-1);if(['food','medicine','iron','tools'].includes(gid))state.world.marketShock[dest]=(state.world.marketShock[dest]||0)+.015}}
}
function crossRegionRouteRisk(from,to){
 const plan=crossRegionRoutePlan(from,to);if(!plan.connections.length)return .16;let sec=0,n=0,danger=0;
 for(const c of plan.connections){for(const id of [c.a,c.b]){const ss=settlementState(id);sec+=ss.security;n++;const p=settlementProblem(id);if(p&&['pass_closure','raider_pressure','watch_shortage','retaining_damage','occupation_tension','requisition_pressure'].includes(p.type))danger++}}
 return clamp(.10+(100-(sec/Math.max(1,n)))/220+danger*.08,.08,.68)
}
function crossRegionRouteLabel(from,to){const risk=crossRegionRouteRisk(from,to);return risk>=.48?'Dangerous':risk>=.32?'Risky':risk>=.2?'Watched':SOSText("economy_trade_world_parties.crossRegionRouteLabel.001")}
function tradeRouteDistanceDays(from,to){return isCrossRegionRoute(from,to)?crossRegionRouteDays(from,to):worldTravelDays(from,to)}
function tradeGoodRole(locId,goodId){
 const g=worldGood(goodId);if(!g)return'normal';if(g.sources?.includes(locId))return'source';if(g.demand?.includes(locId))return'demand';return'normal'
}
function defaultTradeStock(locId,goodId){
 const role=tradeGoodRole(locId,goodId),ss=settlementState(locId),base=role==='source'?8:role==='demand'?2:4;
 return clamp(Math.round(base+(ss.prosperity-50)/18),0,14)
}
function ensureTradeStock(locId){
 const T=tradeEconomyState();if(!T.stock[locId])T.stock[locId]={};
 for(const g of TRADE_GOODS)if(T.stock[locId][g.id]===undefined)T.stock[locId][g.id]=defaultTradeStock(locId,g.id);
 return T.stock[locId]
}
function tradeStock(locId,goodId){return ensureTradeStock(locId)[goodId]||0}
function changeTradeStock(locId,goodId,delta){const s=ensureTradeStock(locId);s[goodId]=clamp((s[goodId]||0)+delta,0,30);return s[goodId]}
function tradeDemandScore(locId,goodId){
 let score=tradeGoodRole(locId,goodId)==='demand'?2:tradeGoodRole(locId,goodId)==='source'?-1:0;
 const p=settlementProblem(locId);if(p?.type==='shortage'&&['food','medicine','tools'].includes(goodId))score+=2;if(p?.type==='trade_slump'&&['cloth','iron','tools','luxury'].includes(goodId))score+=1;
 const ss=settlementState(locId);if(ss.prosperity<40)score+=1;if(ss.security<35&&['food','medicine'].includes(goodId))score+=1;return score
}
function tradePrice(locId,goodId){
 const g=worldGood(goodId);if(!g)return 1;const stock=tradeStock(locId,goodId),role=tradeGoodRole(locId,goodId),demand=tradeDemandScore(locId,goodId),shock=state.world.marketShock?.[locId]||0;
 let mult=role==='source'?.78:role==='demand'?1.16:1;mult*=1+clamp((5-stock)*.055,-.22,.38);mult*=1+demand*.07;
 if(['food','medicine'].includes(goodId))mult*=1+shock*(goodId==='food'?1:.7);
 const day=state.world?.day||1;mult*=1+Math.sin(day*.41+g.base)*.025;return Math.max(4,Math.round(g.base*mult))
}
function locationEconomy(locId){return Object.fromEntries(TRADE_GOODS.map(g=>[g.id,tradePrice(locId,g.id)]))}
function applyWorldMarketShock(locId,prices){return prices}
function observeMarket(locId){
 const T=tradeEconomyState(),prices=locationEconomy(locId),stock={...ensureTradeStock(locId)};T.intel[locId]={day:state.world.day,prices,stock};return T.intel[locId]
}
function marketIntel(locId){return tradeEconomyState().intel[locId]||null}
function marketIntelAge(locId){const i=marketIntel(locId);return i?state.world.day-i.day:null}
function marketRoleText(locId,gid){const role=tradeGoodRole(locId,gid),d=tradeDemandScore(locId,gid);return role==='source'?'Local production':d>=2?'Strong demand':role==='demand'?'Regular demand':d>0?'Elevated demand':SOSText("economy_trade_world_parties.marketRoleText.001")}
function bestKnownTradeRoutes(limit=8){
 const T=tradeEconomyState(),known=Object.keys(T.intel).filter(id=>state.world.settlements[id]);
 const rows=[];for(const a of known)for(const b of known){if(a===b)continue;for(const g of TRADE_GOODS){const ia=T.intel[a],ib=T.intel[b];if(!ia?.prices[g.id]||!ib?.prices[g.id])continue;const buy=ia.prices[g.id],sell=Math.round(ib.prices[g.id]*.92),profit=sell-buy;if(profit>0){const days=tradeRouteDistanceDays(a,b),cross=isCrossRegionRoute(a,b),risk=cross?crossRegionRouteLabel(a,b):(roadConditionProfile(a,b)?.status||SOSText("economy_trade_world_parties.bestKnownTradeRoutes.001"));rows.push({from:a,to:b,gid:g.id,buy,sell,profit,days,cross,risk,age:Math.max(state.world.day-ia.day,state.world.day-ib.day)})}}}
 return rows.sort((x,y)=>(y.profit/Math.max(1,y.days))-(x.profit/Math.max(1,x.days))).slice(0,limit)
}
function merchantManifest(origin,destination,lots=rnd(2,6)){
 const candidates=TRADE_GOODS.map(g=>({g,score:(tradeGoodRole(origin,g.id)==='source'?4:0)+tradeDemandScore(destination,g.id)*2+(tradePrice(destination,g.id)-tradePrice(origin,g.id))/10})).sort((a,b)=>b.score-a.score);
 const manifest={};for(let n=0;n<lots;n++){const pool=candidates.slice(0,Math.min(4,candidates.length)),pickg=pick(pool)?.g||pick(TRADE_GOODS);manifest[pickg.id]=(manifest[pickg.id]||0)+1}return manifest
}
function manifestLots(manifest){return Object.values(manifest||{}).reduce((a,b)=>a+b,0)}
function manifestText(manifest){return Object.entries(manifest||{}).filter(([,q])=>q>0).map(([id,q])=>`${worldGood(id)?.name||id} ×${q}`).join(', ')||SOSText("economy_trade_world_parties.manifestText.001")}
function assignMerchantManifest(p){if(!p||p.kind!=='merchant')return p;const lots=p.cargo||rnd(2,6);p.manifest=merchantManifest(p.origin||p.location,p.destination,lots);p.cargo=manifestLots(p.manifest);return p}
function recordTradeDelivery(p,locId){
 const T=tradeEconomyState(),manifest=p.manifest||{};for(const [gid,qty] of Object.entries(manifest))changeTradeStock(locId,gid,qty);
 T.deliveries.push({day:state.world.day,party:p.name,origin:p.origin,destination:locId,manifest:{...manifest}});T.deliveries=T.deliveries.slice(-40)
}
function recordTradeLoss(p,nearId){
 const T=tradeEconomyState(),manifest=p.manifest||{};T.losses.push({day:state.world.day,party:p.name,origin:p.origin,destination:p.destination,near:nearId,manifest:{...manifest}});T.losses=T.losses.slice(-40);
 const dest=p.destination;if(state.world.settlements[dest]){for(const [gid,qty] of Object.entries(manifest)){changeTradeStock(dest,gid,-Math.max(1,Math.ceil(qty/2)));if(['food','medicine'].includes(gid))state.world.marketShock[dest]=(state.world.marketShock[dest]||0)+.035*qty}}
}

function showInterregionalTradeSignals(){modalRouteEnter(SOSText("economy_trade_world_parties.showInterregionalTradeSignals.001"),Array.from(arguments));
 const rows=interregionalTradeSignals(10);
 overlay(SOSText("economy_trade_world_parties.showInterregionalTradeSignals.002",(state.world.unlockedRegions||[]).map(r=>regionDef(r).name).join(' • '),rows.map(r=>`<div class="trade-route-card interregional-signal"><b>${esc(worldGood(r.gid).name)}</b><br>${esc(worldLocation(r.from).name)} (${esc(regionDef(locationRegion(r.from)).name)}) → ${esc(worldLocation(r.to).name)} (${esc(regionDef(locationRegion(r.to)).name)})<br><small>Current price difference ${r.margin}g/lot • ${r.days} travel days • ${esc(r.risk)} • destination stock ${r.stock}</small><br><button data-signalroute="${r.to}">Review Destination</button></div>`).join('')||'<p class="muted">No strong interregional imbalance is visible right now.</p>'),true);
 document.querySelectorAll('[data-signalroute]').forEach(b=>b.onclick=()=>{const d=b.dataset.signalroute;actionResult(SOSText("economy_trade_world_parties.showInterregionalTradeSignals.003"),SOSText("economy_trade_world_parties.showInterregionalTradeSignals.004",worldLocation(d).name),'info',showInterregionalTradeSignals)});wireClose()
}
function showMarketIntelligence(){modalRouteEnter(SOSText("economy_trade_world_parties.showMarketIntelligence.001"),Array.from(arguments));
 const rows=bestKnownTradeRoutes(10),known=Object.keys(tradeEconomyState().intel).filter(id=>state.world.settlements[id]);
 overlay(SOSText("economy_trade_world_parties.showMarketIntelligence.002",known.length,state.world.day,known.map(id=>{const age=marketIntelAge(id);return `<div class="card compact"><b>${esc(worldLocation(id).name)}</b> • observed Day ${marketIntel(id).day}${age?` • ${age} day${age===1?'':'s'} old`:''}</div>`}).join('')||'<p class="muted">Inspect a settlement market to begin collecting price intelligence.</p>',rows.map(r=>`<div class="trade-route-card"><b>${esc(worldGood(r.gid).name)}</b><br>${esc(worldLocation(r.from).name)} ${r.buy}g → ${esc(worldLocation(r.to).name)} ~${r.sell}g<br><small>Estimated margin ${r.profit}g/lot • ${r.days} travel day${r.days===1?'':'s'} • ${esc(r.risk)}${r.cross?' • Cross-region':''} • intelligence up to ${r.age} day${r.age===1?'':'s'} old</small></div>`).join('')||'<p class="muted">Observe at least two markets before profitable routes can be compared.</p>'),true);wireClose()
}
function worldPartyDisplayRegion(p){
 const a=locationRegion(p.location),b=locationRegion(p.destination||p.location);if(a===b)return a;const f=p.travelTotal?clamp(1-(p.travelLeft||0)/p.travelTotal,0,1):0;return f<.5?a:b
}
function worldPartyPosition(p){
 const a=worldLocation(p.location),b=worldLocation(p.destination||p.location),ar=locationRegion(a.id),br=locationRegion(b.id),f=p.travelTotal?clamp(1-(p.travelLeft||0)/p.travelTotal,0,1):0;
 if(ar!==br){const c=regionConnectionForRegions(ar,br);if(c){const aGate=locationRegion(c.a)===ar?worldLocation(c.a):worldLocation(c.b),bGate=locationRegion(c.a)===br?worldLocation(c.a):worldLocation(c.b),gate=f<.5?aGate:bGate;return{x:clamp(gate.x+(f<.5?2:-2),2,98),y:clamp(gate.y,2,98)}}return{x:f<.5?a.x:b.x,y:f<.5?a.y:b.y}}
 return{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f}
}
function randomWorldDestination(from){const choices=WORLD_LOCATIONS.filter(x=>x.id!==from&&x.id!=='redoubt');return pick(choices).id}

function defaultSettlementState(){const custom={shantium:[72,62],redoubt:[78,55],zion:[76,61],lowcreek:[61,48],ebonheart:[66,46],norwegian:[58,54],winterstone:[68,57],skybreak:[82,40],sengia:[86,82],lockwood:[63,55],grayhaven:[69,48],briarlake:[56,59],glenbrook:[58,49],tyrdon:[54,37],pyreglade:[61,52]};return Object.fromEntries(WORLD_LOCATIONS.filter(x=>['town','settlement','camp','fort'].includes(x.type)).map(x=>{const v=custom[x.id]||[58,55];return[x.id,{security:v[0],prosperity:v[1],lastEventDay:0}]}))}
function settlementState(id){ensureWorldState();return state.world.settlements[id]||{security:50,prosperity:50,lastEventDay:0}}
function partyPurpose(kind){
 return {bandits:SOSText("economy_trade_world_parties.partyPurpose.001"),raiders:SOSText("economy_trade_world_parties.partyPurpose.002"),redstone:SOSText("economy_trade_world_parties.partyPurpose.003"),coalition:SOSText("economy_trade_world_parties.partyPurpose.004"),merchant:SOSText("economy_trade_world_parties.partyPurpose.005"),refugees:SOSText("economy_trade_world_parties.partyPurpose.006"),mercenary:SOSText("economy_trade_world_parties.partyPurpose.007")}[kind]||SOSText("economy_trade_world_parties.partyPurpose.008")
}
function purposefulDestination(kind,from){
 const region=locationRegion(from),regional=state?.world?.regionalSimulation?regionalDestinationForParty(kind,from):null;if(regional&&regional!==from&&locationRegion(regional)===region)return regional;
 const shantium={merchant:['shantium','river','stonebridge','northgate','southroad'],refugees:['shantium','stonebridge','northgate','river'],redstone:['redoubt','watchfort','quarry','northgate','river'],coalition:['northgate','river','shantium','woods','watchfort'],bluestone:['northgate','stonebridge','river'],spawn:['river','southroad','stonebridge'],bandits:['river','southroad','stonebridge','woods','marsh'],raiders:['shantium','river','stonebridge','northgate','southroad'],mercenary:['shantium','river','stonebridge','southroad']};
 const bluestone={merchant:['zion','lowcreek','norwegian','ebonheart','winterstone'],refugees:['zion','norwegian','lowcreek'],redstone:['lowcreek','skybreak'],coalition:['lowcreek','zion'],bluestone:['zion','lowcreek','ebonheart','norwegian','winterstone','skybreak','ziongorge','crownpass'],spawn:['norwegian','westspawnroad','lowcreek'],bandits:['lowcreek','norwegian','winterstone','ziongorge','westspawnroad'],raiders:['lowcreek','norwegian','zion','winterstone'],mercenary:['zion','lowcreek','winterstone','norwegian']};
 const redstone={merchant:['sengia','lockwood','grayhaven','briarlake','glenbrook','tyrdon','pyreglade'],refugees:['lockwood','briarlake','glenbrook','tyrdon'],redstone:['sengia','lockwood','grayhaven','briarlake','glenbrook','tyrdon','pyreglade','sengiaroad'],coalition:['lockwood','grayhaven','briarlake'],bluestone:['grayhaven','briarlake'],spawn:['pyreglade','tyrdon'],bandits:['lockwoodforest','grainvalley','grainpass','glenbrook','tyrdon','pyreslopes'],raiders:['grainvalley','briarlake','glenbrook','pyreglade'],mercenary:['sengia','lockwood','glenbrook','pyreglade']};
 const table=region==='bluestone'?bluestone:region==='redstone'?redstone:shantium,ids=(table[kind]||locationsInRegion(region).map(x=>x.id)).filter(x=>x!==from);return pick(ids.length?ids:locationsInRegion(region).filter(x=>x.id!==from).map(x=>x.id))
}
function resolveWorldPartyArrival(p){
 if(p?.tradeProcurementCaravan&&resolveHomeTradeProcurementArrival(p))return;
 if(p?.logisticsShipment&&p.location==='shantium')completeHomeLogisticsShipment(p);
 const loc=worldLocation(p.location),ss=state.world.settlements[p.location];
 if(!ss)return;
 if(['bandits','raiders'].includes(p.kind)){if(!settlementProblem(p.location)&&chance(.28))createSettlementProblem(p.location,'raider_pressure');const hit=rnd(2,6);ss.security=Math.max(0,ss.security-hit);ss.prosperity=Math.max(0,ss.prosperity-rnd(1,4));if(state.world.day-ss.lastEventDay>=2){log(SOSText("economy_trade_world_parties.resolveWorldPartyArrival.001",p.name,loc.name),'bad');ss.lastEventDay=state.world.day}}
 if(p.kind==='merchant'){ss.prosperity=Math.min(100,ss.prosperity+2);if(settlementProblem(p.location)&&['shortage','trade_slump'].includes(settlementProblem(p.location).type))progressSettlementProblem(p.location,1,SOSText("economy_trade_world_parties.resolveWorldPartyArrival.002",p.name))}if(p.kind==='merchant'&&p.crossRegion)recordCrossRegionDelivery(p,p.location);
 if(p.kind==='refugees'){ss.prosperity=Math.max(0,ss.prosperity-1);if(p.location==='shantium')state.town.population=Math.min(260,state.town.population+rnd(1,3))}
 if(p.kind==='coalition'&&loc.faction===SOSText("economy_trade_world_parties.resolveWorldPartyArrival.003"))ss.security=Math.min(100,ss.security+2)
 if(p.kind==='redstone'&&loc.faction===SOSText("economy_trade_world_parties.resolveWorldPartyArrival.004"))ss.security=Math.min(100,ss.security+2)
 regionalArrivalConsequences(p,p.location);if(p.securityDeployment){const M=sengiaSecurityState(),d=M.deployments.find(x=>x.partyId===p.id&&x.status==='moving');if(d){d.status='arrived';d.arrivedDay=state.world.day;const sm=M.settlements[p.location];if(sm){sm.patrols=Math.min(100,sm.patrols+3);sm.manpower=Math.min(100,sm.manpower+1)}recordSengiaSecurity(SOSText("economy_trade_world_parties.resolveWorldPartyArrival.005",p.name,worldLocation(p.location).name,d.reason),'good')}p.securityDeployment=false}if(p.investmentId)completeCaravanInvestment(p);for(const o of activeRegionalOpportunities().filter(x=>x.stage==='tracking'&&x.partyId===p.id&&x.location===p.location)){o.status='resolved';o.resolvedDay=state.world.day;o.result=SOSText("economy_trade_world_parties.resolveWorldPartyArrival.006",p.name,worldLocation(p.location).name);progressSettlementProblem(p.location,1,SOSText("economy_trade_world_parties.resolveWorldPartyArrival.007",p.name));ensureRegionalSimulation().interventions.push({day:state.world.day,opportunityId:o.id,title:o.title,action:'escort',result:o.result});recordWorldHistory(`${o.title}: ${o.result}`,'good',SOSText("economy_trade_world_parties.resolveWorldPartyArrival.008"))}const q=p.questId?activeQuest(p.questId):null;
 if(q&&q.type==='escort'&&q.target===p.location)markQuestReady(q);
}
function maybeCompanionWorldEvent(){
 if(!isOpenWorld()||chance(.72))return;
 const available=Object.values(state.world.companions).filter(c=>!state.allies.includes(c.id)&&(state.world.unlockedRegions||['shantium']).includes(locationRegion(c.location))&&state.world.day>=(c.eventCooldown||0));
 if(!available.length)return;
 const c=pick(available),a=allyDef(c.id);c.eventCooldown=state.world.day+4;
 const roll=rnd(1,3);
 if(roll===1){c.known=true;c.lastSeenDay=state.world.day;log(SOSText("economy_trade_world_parties.maybeCompanionWorldEvent.001",a.name,worldLocation(c.location).name),'info')}
 if(roll===2){c.disposition=Math.min(6,(c.disposition||0)+1);c.known=true;log(SOSText("economy_trade_world_parties.maybeCompanionWorldEvent.002",a.name),'good')}
 if(roll===3){c.known=true;c.trouble=true;log(SOSText("economy_trade_world_parties.maybeCompanionWorldEvent.003",a.name,worldLocation(c.location).name),'bad')}
}
function worldPartyCombatLabels(kind){
 const labels={
  merchant:[
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.001"),'merchant'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.002"),'guard'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.003"),'merchant'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.004"),'crossbow']
  ],
  refugees:[
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.005"),'defender'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.006"),'traveler'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.007"),'defender']
  ],
  mercenary:[
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.008"),'captain'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.009"),'spearman'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.010"),'crossbow'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.011"),'veteran']
  ],
  redstone:[
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.012"),'sergeant'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.013"),'soldier'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.014"),'spearman'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.015"),'crossbow']
  ],
  bluestone:[
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.016"),'warden'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.017"),'soldier'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.018"),'lancer'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.019"),'archer']
  ],
  coalition:[
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.020"),'scout'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.021"),'guard'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.022"),'rider'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.023"),'archer']
  ],
  spawn:[
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.024"),'guard'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.025"),'traveler'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.026"),'scout']
  ],
  bandits:[
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.027"),'bandit'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.028"),'brigand'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.029"),'archer']
  ],
  raiders:[
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.030"),'raider'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.031"),'berserker'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.032"),'archer']
  ],
  bounty:[
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.033"),'hunter'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.034"),'guard'],
   [SOSText("economy_trade_world_parties.worldPartyCombatLabels.035"),'crossbow']
  ]
 };
 return labels[kind]||labels.spawn
}
function worldPartyDoctrine(pOrKind,region=null){
 const kind=typeof pOrKind==='string'?pOrKind:pOrKind?.kind||'spawn',p=typeof pOrKind==='object'?pOrKind:null,reg=region||locationRegion(p?.location||p?.origin||state.world.location);
 const base={
  bandits:{name:SOSText("economy_trade_world_parties.worldPartyDoctrine.001"),formation:SOSText("economy_trade_world_parties.worldPartyDoctrine.002"),morale:48,surrender:1.15,withdraw:.9,reinforce:.08,leaderRole:'brigand',tactic:'skirmish'},
  raiders:{name:SOSText("economy_trade_world_parties.worldPartyDoctrine.003"),formation:SOSText("economy_trade_world_parties.worldPartyDoctrine.004"),morale:62,surrender:.72,withdraw:.7,reinforce:.10,leaderRole:'raider',tactic:'shock'},
  redstone:{name:SOSText("economy_trade_world_parties.worldPartyDoctrine.005"),formation:SOSText("economy_trade_world_parties.worldPartyDoctrine.006"),morale:76,surrender:.58,withdraw:.8,reinforce:.18,leaderRole:'sergeant',tactic:'disciplined'},
  coalition:{name:SOSText("economy_trade_world_parties.worldPartyDoctrine.007"),formation:SOSText("economy_trade_world_parties.worldPartyDoctrine.008"),morale:68,surrender:.75,withdraw:1.2,reinforce:.16,leaderRole:'scout',tactic:'mobile'},
  bluestone:{name:SOSText("economy_trade_world_parties.worldPartyDoctrine.009"),formation:SOSText("economy_trade_world_parties.worldPartyDoctrine.010"),morale:73,surrender:.62,withdraw:1.05,reinforce:.14,leaderRole:'warden',tactic:'defensive'},
  mercenary:{name:SOSText("economy_trade_world_parties.worldPartyDoctrine.011"),formation:SOSText("economy_trade_world_parties.worldPartyDoctrine.012"),morale:66,surrender:.86,withdraw:1.0,reinforce:.12,leaderRole:'captain',tactic:'professional'},
  merchant:{name:SOSText("economy_trade_world_parties.worldPartyDoctrine.013"),formation:SOSText("economy_trade_world_parties.worldPartyDoctrine.014"),morale:52,surrender:1.25,withdraw:1.25,reinforce:.05,leaderRole:'guard',tactic:'protective'},
  refugees:{name:SOSText("economy_trade_world_parties.worldPartyDoctrine.015"),formation:SOSText("economy_trade_world_parties.worldPartyDoctrine.016"),morale:44,surrender:1.4,withdraw:1.4,reinforce:.02,leaderRole:'defender',tactic:'defensive'},
  spawn:{name:SOSText("economy_trade_world_parties.worldPartyDoctrine.017"),formation:SOSText("economy_trade_world_parties.worldPartyDoctrine.018"),morale:55,surrender:1.0,withdraw:1.0,reinforce:.06,leaderRole:'guard',tactic:'mixed'}
 }[kind]||{name:'Road Party',formation:'Loose formation',morale:55,surrender:1,withdraw:1,reinforce:.05,leaderRole:'guard',tactic:'mixed'};
 const d={...base};
 if(reg==='redstone'){d.morale+=4;if(kind==='redstone')d.reinforce+=.08}
 if(reg==='bluestone'){d.withdraw+=.08;if(kind==='bluestone')d.morale+=3}
 if(reg==='shantium'&&['bandits','raiders'].includes(kind))d.reinforce+=.03;
 d.morale=clamp(d.morale,20,90);d.reinforce=clamp(d.reinforce,0,.35);return d
}
function worldPartyLeaderFromComposition(p){
 if(!p)return null;const live=(p.combatComposition||[]).filter(x=>x.status!=='dead'&&x.status!=='recovering');if(!live.length)return null;
 const words=['captain','sergeant','leader','warden','factor','guard','brigand','raider','scout','veteran'];
 return live.find(x=>words.some(w=>String(x.role||x.label||'').toLowerCase().includes(w)))||live[0]
}
function ensureWorldPartyDoctrine(p){
 if(!p)return null;if(!p.doctrine||!p.doctrine.name)p.doctrine=worldPartyDoctrine(p);
 const leader=worldPartyLeaderFromComposition(p);if(leader){p.leaderMemberId=leader.id;p.leaderName=leader.label||p.leaderName||null;p.leaderRole=leader.role||p.leaderRole||p.doctrine.leaderRole}
 if(!Number.isFinite(p.morale))p.morale=p.doctrine.morale;if(!p.formation)p.formation=p.doctrine.formation;return p.doctrine
}
function generateWorldPartyComposition(kind,t=null){
 t=t||worldPartyType(kind)||{size:[2,4]};const labels=worldPartyCombatLabels(kind),count=rnd(Math.max(1,t.size?.[0]||2),Math.max(1,t.size?.[1]||4)),out=[];
 for(let i=0;i<count;i++){const x=labels[i<labels.length?i:rnd(0,labels.length-1)];out.push({id:`member_${uid()}`,label:x[0],role:x[1],status:'active'})}
 return out
}
function syncWorldPartyCompositionWithIdentity(p,identity){
 if(!p||!identity?.members?.length)return p;const total=identity.members.filter(m=>m.status!=='dead'),eligible=total.filter(m=>m.age!=='child'&&m.status!=='dead'&&m.status!=='recovering');
 p.memberCount=total.length;p.combatComposition=eligible.map(m=>({id:m.id,label:m.name,role:m.role||'member',status:m.status||'active',named:true,travelerPersonId:m.id}));
 p.combatantCount=p.combatComposition.length;p.compositionSource='named_identity';return p
}
function ensureWorldPartyComposition(p){
 if(!p)return p;const r=p.travelerId?state.world?.travelerRegistry?.records?.[p.travelerId]:null,i=r?.identity||p.groupIdentity||null;if(i?.members?.length){syncWorldPartyCompositionWithIdentity(p,i);if(r){r.memberCount=p.memberCount;r.combatComposition=p.combatComposition.map(x=>({...x}));r.compositionSource='named_identity'}return p}
 if((!Array.isArray(p.combatComposition)||!p.combatComposition.length)&&Array.isArray(r?.combatComposition)&&r.combatComposition.length){p.combatComposition=r.combatComposition.map(x=>({...x}));p.memberCount=r.memberCount||p.combatComposition.length;p.combatantCount=p.combatComposition.filter(x=>x.status!=='dead').length;p.compositionSource=r.compositionSource||'persistent_traveler';return p}
 if(!Array.isArray(p.combatComposition)||!p.combatComposition.length){const t=worldPartyType(p.kind)||{size:[2,4]};p.combatComposition=generateWorldPartyComposition(p.kind,t);p.memberCount=p.combatComposition.length;p.combatantCount=p.combatComposition.length;p.compositionSource='spawned'}
 if(!p.memberCount)p.memberCount=p.combatComposition.length;if(!p.combatantCount)p.combatantCount=p.combatComposition.filter(x=>x.status!=='dead').length;
 ensureWorldPartyDoctrine(p);if(r){r.memberCount=p.memberCount;r.combatComposition=p.combatComposition.map(x=>({...x}));r.compositionSource=p.compositionSource||'spawned';r.doctrine={...p.doctrine};r.morale=p.morale;r.leaderMemberId=p.leaderMemberId||null}return p
}
function spawnWorldParty(kind=null,regionHint=null){
 ensureWorldState();const t=kind?worldPartyType(kind):pick(WORLD_PARTY_TYPES),unlocked=state.world.unlockedRegions||['shantium'];
 let region=regionHint||(t.kind==='bluestone'&&unlocked.includes('bluestone')?'bluestone':pick(unlocked));
 const starts={shantium:{redstone:['redoubt','watchfort'],coalition:['northgate','river'],bluestone:['northgate','stonebridge'],spawn:['river','southroad']},bluestone:{bluestone:['zion','lowcreek','ebonheart','winterstone','skybreak'],coalition:['lowcreek'],redstone:['lowcreek'],spawn:['norwegian','westspawnroad']},redstone:{redstone:['sengia','lockwood','grayhaven','glenbrook','pyreglade'],coalition:['grayhaven','briarlake'],bluestone:['grayhaven'],spawn:['pyreglade','tyrdon'],merchant:['sengia','lockwood','briarlake','glenbrook','pyreglade']}};
 const candidates=(starts[region]?.[t.kind]||locationsInRegion(region).filter(x=>!x.hidden&&x.id!=='redoubt').map(x=>x.id)).filter(Boolean),start=pick(candidates.length?candidates:['shantium']),dest=purposefulDestination(t.kind,start),days=Math.max(1,worldTravelDays(start,dest));
 const p={id:uid(),kind:t.kind,name:t.name,faction:t.faction,attitude:t.attitude,purpose:partyPurpose(t.kind),origin:start,location:start,destination:dest,travelLeft:days,travelTotal:days,createdDay:state.world.day,questId:null,cargo:t.kind==='merchant'?rnd(2,6):0,region:locationRegion(start),combatLevel:rollWorldPartyCombatLevel(t.kind)};if(t.kind==='merchant')assignMerchantManifest(p);p.combatComposition=generateWorldPartyComposition(t.kind,t);p.memberCount=p.combatComposition.length;p.combatantCount=p.combatComposition.length;p.compositionSource='spawned';assignTravelerIdentity(p,region);ensureWorldPartyComposition(p);ensureWorldPartyDoctrine(p);state.world.parties.push(p);syncTravelerRecord(p);return p
}
function regionalPartyTarget(region){const settlements=regionalSettlements(region),avg=settlements.length?settlements.reduce((n,l)=>n+(settlementState(l.id).security||50),0)/settlements.length:55;return {total:region==='shantium'?7:6,hostile:avg>=78?1:avg>=62?2:3}}
function maintainWorldParties(){ensureWorldState();refreshTravelerMemberStatuses();const keep=[];for(const p of state.world.parties){const live=p.tradeProcurementCaravan||p.contractProtected||(p.questId&&activeQuest(p.questId))||p.id===state.world.trackedPartyId||state.world.day-(p.createdDay||1)<22;if(live)keep.push(p);else archiveTravelerParty(p,SOSText("economy_trade_world_parties.maintainWorldParties.001"))}state.world.parties=keep;if(state.world.trackedPartyId&&!state.world.parties.some(p=>p.id===state.world.trackedPartyId))state.world.trackedPartyId=null;manageNamedTravelerPopulation();reconcileNamedTravelerLifecycles(false);const unlocked=state.world.unlockedRegions||['shantium'];for(const region of unlocked){const target=regionalPartyTarget(region);let local=state.world.parties.filter(p=>worldPartyDisplayRegion(p)===region);let hostile=local.filter(p=>['bandits','raiders'].includes(p.kind));while(hostile.length<target.hostile){const p=spawnWorldParty(chance(.56)?'bandits':'raiders',region);hostile.push(p);local.push(p)}const trafficKinds=region==='redstone'?['redstone','merchant','merchant','mercenary','refugees','coalition','spawn']:region==='bluestone'?['bluestone','merchant','merchant','mercenary','refugees','coalition','spawn']:['merchant','merchant','coalition','redstone','mercenary','refugees','spawn'];while(local.length<target.total){const p=spawnWorldParty(pick(trafficKinds),region);local.push(p)}}}

function regionalPartyMeetingAcceptance(p,req){
 const d=worldPartyDisposition(p);if(d==='hostile')return .08;let chanceBase=d==='friendly'?.92:d==='wary'?.42:.72;const standing=state.world.factionStanding?.[p.faction]||0;chanceBase+=Math.max(-.18,Math.min(.14,standing*.012));if(guardianHallAffiliatedParty?.(p))chanceBase=Math.max(chanceBase,.97);return clamp(chanceBase,.05,.98)
}
function regionalPartyMeetingTravelDays(p,targetId){if(targetId==='shantium'&&typeof homeHospitalityTravelDays==='function'){const d=homeHospitalityTravelDays(p.location);if(d!=null)return Math.max(1,d)}return Math.max(1,worldTravelDays(p.location,targetId))}
function resolveRegionalPartyMeetingRequest(p){
 const req=p?.meetingRequest;if(!req||req.status!=='sent'||!(req.dispatchId?worldDispatchArrived(req.dispatchId):state.world.day>=req.dueDay))return false;const accepted=chance(regionalPartyMeetingAcceptance(p,req));if(req.dispatchId)completeWorldDispatch(req.dispatchId,'delivered',{accepted});if(!accepted){req.status='declined';req.resolvedDay=state.world.day;recordWorldHistory(SOSText("economy_trade_world_parties.resolveRegionalPartyMeetingRequest.001",p.name),'info','travel');return true}
 req.status='accepted';req.acceptedDay=state.world.day;const target=req.targetId;if(req.kind==='hall'&&target==='shantium'&&typeof ensureHomeBase==='function'){ensureHomeBase();ensureTravelerGroupIdentity(p);const H=state.world.homeBase.hospitality,recordId=p.travelerId||null,travelDays=regionalPartyMeetingTravelDays(p,'shantium');H.invitations.push({id:'meet_'+uid(),targetId:`party_${p.id}`,name:p.name,size:Math.max(1,p.memberCount||p.combatantCount||1),kind:'group',recordId,origin:p.location,sentDay:req.sentDay,responseDay:state.world.day,dispatchId:req.dispatchId,travelDays,status:'traveling',acceptedDay:state.world.day,arrivalDay:state.world.day+travelDays,acceptChance:1,directMeeting:true,stayDays:req.waitDays||rnd(2,3)});if(recordId){const tr=travelerRegistryState().records[recordId];if(tr){tr.hospitalityStatus='traveling';tr.hospitalityArrivalDay=state.world.day+travelDays}}archiveTravelerParty(p,SOSText("economy_trade_world_parties.resolveRegionalPartyMeetingRequest.002"));state.world.parties=state.world.parties.filter(x=>x.id!==p.id);if(state.world.trackedPartyId===p.id)state.world.trackedPartyId=null;recordWorldHistory(SOSText("economy_trade_world_parties.resolveRegionalPartyMeetingRequest.003",p.name),'good','home');return true}
 p.origin=p.location;p.destination=target;p.travelTotal=p.travelLeft=regionalPartyMeetingTravelDays(p,target);p.crossRegion=locationRegion(p.location)!==locationRegion(target);recordWorldHistory(SOSText("economy_trade_world_parties.resolveRegionalPartyMeetingRequest.004",p.name,worldLocation(target).name),'good','travel');return true
}
function resolveRegionalPartyMeetingArrival(p){const req=p?.meetingRequest;if(!req||req.status!=='accepted'||p.location!==req.targetId)return false;req.status='waiting';req.arrivedDay=state.world.day;req.waitUntil=state.world.day+Math.max(2,Math.min(3,req.waitDays||2));recordWorldHistory(SOSText("economy_trade_world_parties.resolveRegionalPartyMeetingArrival.001",p.name,worldLocation(req.targetId).name,req.waitUntil),'good','travel');return true}
function moveWorldParties(){
 ensureWorldState();
 for(const p of [...state.world.parties]){
  if(resolveRegionalPartyMeetingRequest(p)&&!state.world.parties.some(x=>x.id===p.id))continue;
  if(p.meetingRequest?.status==='waiting'){if(state.world.day<=p.meetingRequest.waitUntil)continue;p.meetingRequest.status='expired';p.meetingRequest.resolvedDay=state.world.day;p.origin=p.location;p.destination=purposefulDestination(p.kind,p.location);p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays(p.location,p.destination))}
  if(partyInLiveConflict(p.id))continue;
  if(p.contractProtected&&(p.escortWaiting||p.escortActive||p.contractRole==='escort'))continue;
  if(!p.contractProtected&&p.crossRegion&&chance(crossRegionRouteRisk(p.origin,p.destination)*.035*(p.tradeProcurementCaravan?(HOME_TRADE_PROCUREMENT_PRIORITIES[homeTradeProcurementOrders().find(o=>o.id===p.procurementOrderId)?.priority||'balanced']?.risk||1):1))){
   if(p.tradeProcurementCaravan)homeTradeProcurementLost(p,'The caravan disappeared or was destroyed on a dangerous cross-region route.');
   recordTradeLoss(p,p.location);const X=crossRegionTradeState();X.lost=(X.lost||0)+1;X.disruptions.push({day:state.world.day,party:p.name,origin:p.origin,destination:p.destination,near:p.location,manifest:{...(p.manifest||{})}});X.disruptions=X.disruptions.slice(-40);recordWorldHistory(SOSText("economy_trade_world_parties.moveWorldParties.001",p.name,p.tradeRoute||'cross-region road',worldLocation(p.destination).name),'bad','trade');removeWorldParty(p.id);continue
  }
  p.travelLeft=Math.max(0,(p.travelLeft||0)-1);
  if(p.travelLeft<=0){p.location=p.destination;resolveWorldPartyArrival(p);if(p.tradeProcurementCaravan){if(state.world.parties.some(x=>x.id===p.id))syncTravelerRecord(p);continue}p.origin=p.location;if(resolveRegionalPartyMeetingArrival(p))continue;
   if(p.kind==='merchant'&&p.crossRegion&&crossRegionTradeUnlocked()){const nextCross=crossRegionDestination(p.location);if(nextCross){p.destination=nextCross;p.region=locationRegion(p.location);p.crossRegion=true;p.tradeRoute=connectionRouteName(p.location,p.destination);p.cargo=rnd(3,7);p.manifest=crossRegionMerchantManifest(p.location,p.destination,p.cargo);p.cargo=manifestLots(p.manifest);p.travelTotal=p.travelLeft=crossRegionRouteDays(p.location,p.destination)}else{p.crossRegion=false;p.tradeRoute=null;p.destination=purposefulDestination(p.kind,p.location);p.cargo=rnd(2,6);assignMerchantManifest(p);p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays(p.location,p.destination))}}
   else{p.destination=purposefulDestination(p.kind,p.location);if(p.kind==='merchant'){p.cargo=rnd(2,6);assignMerchantManifest(p)}p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays(p.location,p.destination))}
  }
 }
 maintainWorldParties();maybeSpawnCrossRegionTrade();maybeCompanionWorldEvent()
}
function worldPartyDistanceToPlayer(p){
 if(worldPartyDisplayRegion(p)!==currentWorldRegion())return Infinity;
 const pos=worldPartyPosition(p),me=worldLocation(state.world.location);return Math.hypot(pos.x-me.x,pos.y-me.y)
}
function worldPartyAtPlayer(p){return worldPartyDistanceToPlayer(p)<10}
function worldPartyTravelEstimate(p){
 const preg=worldPartyDisplayRegion(p);if(preg!==currentWorldRegion())return {days:null,label:SOSText("economy_trade_world_parties.worldPartyTravelEstimate.001",regionDef(preg).name)};
 const d=worldPartyDistanceToPlayer(p);
 if(d<10)return {days:0,label:SOSText("economy_trade_world_parties.worldPartyTravelEstimate.002")};
 // Approximate regional travel time using the same map scale as location travel.
 const days=Math.max(1,Math.round(d/32));
 return {days,label:SOSText("economy_trade_world_parties.worldPartyTravelEstimate.003",days,days===1?'':'s')}
}
function canEngageWorldParty(p){return !!p&&(worldPartyAtPlayer(p)||pursuitCaughtParty(p))}
function trackedWorldParty(){ensureWorldState();const p=state.world.parties.find(x=>x.id===state.world.trackedPartyId);if(!p&&state.world.trackedPartyId)state.world.trackedPartyId=null;return p||null}
function setTrackedWorldParty(p){ensureWorldState();state.world.trackedPartyId=p?.id||null;if(p)log(SOSText("economy_trade_world_parties.setTrackedWorldParty.001",p.name),'info');save()}
function pursuitState(){ensureWorldState();if(!state.world.pursuit||typeof state.world.pursuit!=='object')state.world.pursuit={targetId:null,progress:0,startedDay:0,lastDay:0,caught:false};return state.world.pursuit}
function clearPursuit(){if(state.world)state.world.pursuit={targetId:null,progress:0,startedDay:0,lastDay:0,caught:false}}
function pursuitSpeedBonus(){let b=scoutingLevel()*.42;if(guardianClass()===SOSText("economy_trade_world_parties.pursuitSpeedBonus.001"))b+=1.5;if(guardianClass()===SOSText("economy_trade_world_parties.pursuitSpeedBonus.002"))b+=1;return b}
function pursuitCaughtParty(p){const P=pursuitState();return !!p&&P.targetId===p.id&&P.caught}
function pursuitClosingNeed(p){return Math.max(3,Math.ceil(worldPartyDistanceToPlayer(p)/5.5))}
function continuePersistentPursuit(p,forced=false){
 if(!p||!state.world.parties.some(x=>x.id===p.id)){clearPursuit();return actionResult(SOSText("economy_trade_world_parties.continuePersistentPursuit.001"),SOSText("economy_trade_world_parties.continuePersistentPursuit.002"),'info',renderOpenWorld)}
 const P=pursuitState();if(P.targetId!==p.id){P.targetId=p.id;P.progress=0;P.startedDay=state.world.day;P.caught=false}P.lastDay=state.world.day;
 const before=worldPartyPosition(p),gain=1.5+pursuitSpeedBonus()+(forced?1.5:0);P.progress+=gain;if(forced){state.guardian.stamina=Math.max(0,state.guardian.stamina-18)}
 advanceWorldDays(1,`${forced?'Forced pursuit of':'Pursued'} ${p.name}`);const live=state.world.parties.find(x=>x.id===p.id);if(!live){clearPursuit();return actionResult(SOSText("economy_trade_world_parties.continuePersistentPursuit.003"),SOSText("economy_trade_world_parties.continuePersistentPursuit.004",p.name),'info',renderOpenWorld)}
 const need=pursuitClosingNeed(live);if(P.progress>=need){const pos=worldPartyPosition(live),near=nearestWorldLocationToPosition(currentWorldRegion(),pos);state.world.location=near;P.caught=true;setTrackedWorldParty(live);save();return actionResult(SOSText("economy_trade_world_parties.continuePersistentPursuit.005"),SOSText("economy_trade_world_parties.continuePersistentPursuit.006",live.name,worldLocation(near).name),'good',()=>showWorldParty(live.id))}
 setTrackedWorldParty(live);save();return actionResult(SOSText("economy_trade_world_parties.continuePersistentPursuit.007"),SOSText("economy_trade_world_parties.continuePersistentPursuit.008",live.name,Math.floor(P.progress),need),'info',()=>showWorldParty(live.id))
}
function worldPartyInterceptPlan(p){
 const target=worldLocation(p.destination),crossRegion=locationRegion(p.location)!==currentWorldRegion()||locationRegion(p.destination)!==currentWorldRegion();if(crossRegion)return {target,travel:null,eta:Math.max(0,p.travelLeft||0),wait:0,likely:false,total:null,crossRegion:true};
 const travel=worldTravelDays(state.world.location,p.destination),eta=Math.max(0,p.travelLeft||0),wait=Math.max(0,eta-travel);return {target,travel,eta,wait,likely:travel<=eta,total:travel+wait,crossRegion:false}
}
function showTrackedWorldParty(){modalRouteEnter(SOSText("economy_trade_world_parties.showTrackedWorldParty.001"),Array.from(arguments));const p=trackedWorldParty();if(!p)return actionResult(SOSText("economy_trade_world_parties.showTrackedWorldParty.002"),SOSText("economy_trade_world_parties.showTrackedWorldParty.003"),'info',renderOpenWorld);showWorldParty(p.id)}
function pursueWorldParty(p){
 if(!p||!state.world.parties.some(x=>x.id===p.id))return renderOpenWorld();const region=worldPartyDisplayRegion(p);if(region!==currentWorldRegion())return actionResult(SOSText("economy_trade_world_parties.pursueWorldParty.001"),SOSText("economy_trade_world_parties.pursueWorldParty.002",p.name,regionDef(region).name),'info',()=>showWorldParty(p.id));
 const P=pursuitState(),active=P.targetId===p.id&&!P.caught,need=pursuitClosingNeed(p),progress=active?P.progress:0;
 overlay(SOSText("economy_trade_world_parties.pursueWorldParty.003",active?'Continue Pursuit':'Begin Pursuit',esc(p.name),esc(worldLocation(p.destination).name),Math.floor(progress),need,pursuitSpeedBonus().toFixed(1),active?'Continue Pursuit':'Begin Pursuit',state.guardian.stamina<18?'disabled':''));
 $('#pursuitTrack').onclick=()=>{setTrackedWorldParty(p);closeOverlay();renderOpenWorld()};$('#pursuitGo').onclick=()=>{closeOverlay();continuePersistentPursuit(p,false)};$('#pursuitForce').onclick=()=>{closeOverlay();continuePersistentPursuit(p,true)};wireClose()
}
