/* v1.6.49 — Spawn Economy & Industry
   Turns the Spawn's signature goods into actual metropolitan supply chains.
   Livestock availability at the Stockyards represents desert herds arriving through
   the southeast gate; it is explicitly not local cattle raising. */

const SPAWN_INDUSTRY_CHAINS={
 luxury:{name:'Luxury Goods',hub:'spawn_works',output:'luxury',outputQty:2,inputs:{cloth:2},flexInputs:['dye','hides','iron'],desc:'Fine workshops turn imported cloth, dyes, hides, metals, glasswork, and skilled labor into high-value finished goods.'},
 spirits:{name:'Spirits',hub:'spawn_spirits',output:'spirits',outputQty:3,inputs:{food:2},flexInputs:[],desc:'Brewers and distillers convert grain and other food inputs into beer, spirits, and bottled trade stock at metropolitan scale.'},
 livestock:{name:'Desert Livestock',hub:'spawn_stockyards',output:'livestock',outputQty:0,inputs:{},flexInputs:[],desc:'Cattle and other livestock are driven in by desert herders and ranchers through the southeastern gate, then auctioned, processed, and redistributed.'}
};
function spawnEconomyState(){
 state.world.spawnEconomy=state.world.spawnEconomy||{lastTickDay:0,history:[],totals:{luxury:0,spirits:0,livestockIn:0},today:null};
 const E=state.world.spawnEconomy;E.history=Array.isArray(E.history)?E.history:[];E.totals=E.totals||{luxury:0,spirits:0,livestockIn:0};return E
}
function spawnEconomyRecord(text,kind='info'){
 const E=spawnEconomyState();E.history.push({day:state.world.day,text,kind});E.history=E.history.slice(-40);if(typeof recordWorldHistory==='function')recordWorldHistory(text,kind,'spawn economy')
}
function spawnIndustryCanRun(c){
 for(const [gid,q] of Object.entries(c.inputs||{}))if(tradeStock(c.hub,gid)<q)return false;
 if(c.flexInputs?.length&&!c.flexInputs.some(g=>tradeStock(c.hub,g)>0))return false;return true
}
function spawnIndustryRun(c){
 if(!spawnIndustryCanRun(c))return false;
 for(const [gid,q] of Object.entries(c.inputs||{}))changeTradeStock(c.hub,gid,-q);
 if(c.flexInputs?.length){const g=c.flexInputs.slice().sort((a,b)=>tradeStock(c.hub,b)-tradeStock(c.hub,a))[0];changeTradeStock(c.hub,g,-1)}
 changeTradeStock(c.hub,c.output,c.outputQty);return true
}
function spawnIndustryTransfer(from,to,gid,maxQty){const q=Math.min(maxQty,Math.max(0,tradeStock(from,gid)-4));if(q>0){changeTradeStock(from,gid,-q);changeTradeStock(to,gid,q)}return q}
function spawnEconomyDailyTick(){
 if(!(state.world.unlockedRegions||[]).includes('spawn'))return;const E=spawnEconomyState();if(E.lastTickDay>=state.world.day)return;E.lastTickDay=state.world.day;
 const today={day:state.world.day,luxury:0,spirits:0,livestockIn:0,distributed:0};
 const lux=SPAWN_INDUSTRY_CHAINS.luxury,sp=SPAWN_INDUSTRY_CHAINS.spirits;
 if(spawnIndustryRun(lux)){today.luxury=lux.outputQty;E.totals.luxury+=lux.outputQty}
 if(spawnIndustryRun(sp)){today.spirits=sp.outputQty;E.totals.spirits+=sp.outputQty}
 // The Endless Desert is not playable yet, but established herders can reach the gate and market.
 const inbound=2+((state.world.day*7)%4);changeTradeStock('spawn_stockyards','livestock',inbound);today.livestockIn=inbound;E.totals.livestockIn+=inbound;
 today.distributed+=spawnIndustryTransfer('spawn_works','spawn_merchant','luxury',2);
 today.distributed+=spawnIndustryTransfer('spawn_works','spawn_market','luxury',1);
 today.distributed+=spawnIndustryTransfer('spawn_spirits','spawn_merchant','spirits',2);
 today.distributed+=spawnIndustryTransfer('spawn_spirits','spawn_bazaar','spirits',1);
 today.distributed+=spawnIndustryTransfer('spawn_stockyards','spawn_market','livestock',2);
 today.distributed+=spawnIndustryTransfer('spawn_stockyards','spawn_bazaar','livestock',1);
 E.today=today;
 if(state.world.day%3===0)spawnEconomyRecord(`${inbound} lots of desert livestock reached the Great Stockyard while the Works and Brewers Ward continued supplying the city.`, 'info');
}
function spawnEconomySupplyLabel(id,gid){const q=tradeStock(id,gid);return q>=12?'abundant':q>=7?'healthy':q>=3?'tight':'scarce'}
function spawnEconomyChainCard(key){const c=SPAWN_INDUSTRY_CHAINS[key],stock=tradeStock(c.hub,c.output),role=key==='livestock'?'Desert inflow':'Domestic production';return `<div class="card"><h4>${esc(c.name)}</h4><p>${esc(c.desc)}</p><small><b>${role}</b> • Hub: ${esc(worldLocation(c.hub).name)} • Current trade stock ${stock} (${spawnEconomySupplyLabel(c.hub,c.output)})</small></div>`}
function showSpawnEconomy(){
 modalRouteEnter('showSpawnEconomy',[]);const E=spawnEconomyState(),T=E.today||{};
 const routes=[['Luxury Goods','spawn_works','spawn_merchant','Fineworks → merchant houses'],['Spirits','spawn_spirits','spawn_bazaar','Brewers Ward → southern trade'],['Livestock','spawn_stockyards','spawn_market','Desert herders → Stockyards → city markets']];
 overlay(`<h2>Spawn Economy & Industry</h2><p>The metropolis is not merely a large consumer. It transforms imports and local labor into high-value goods, produces spirits at immense urban scale, and serves as the nearest great market for livestock driven in from the Endless Desert.</p><div class="notice compact"><b>Today:</b> Luxury output ${T.luxury||0} lots • Spirits output ${T.spirits||0} lots • Desert livestock arrivals ${T.livestockIn||0} lots.<br><b>Important:</b> the Stockyards are an intake and redistribution center. The Spawn does not primarily raise these cattle itself.</div>${spawnEconomyChainCard('luxury')}${spawnEconomyChainCard('spirits')}${spawnEconomyChainCard('livestock')}<h3>Metropolitan Trade Flows</h3>${routes.map(r=>`<div class="card compact"><b>${esc(r[0])}</b><br>${esc(r[3])}<br><small>${esc(worldLocation(r[1]).name)} stock ${tradeStock(r[1],r[0]==='Luxury Goods'?'luxury':r[0]==='Spirits'?'spirits':'livestock')} • ${esc(worldLocation(r[2]).name)} stock ${tradeStock(r[2],r[0]==='Luxury Goods'?'luxury':r[0]==='Spirits'?'spirits':'livestock')}</small></div>`).join('')}<h3>Recent Economic Activity</h3>${E.history.slice(-6).reverse().map(x=>`<div class="card compact"><b>Day ${x.day}</b><br>${esc(x.text)}</div>`).join('')||'<p class="muted">No notable industry report has been recorded yet.</p>'}<div class="dialog-footer"><button class="closeModal">Back</button></div>`,true);wireClose()
}
function spawnEconomyDistrictHTML(id){return ['spawn_works','spawn_spirits','spawn_stockyards','spawn_merchant','spawn_bazaar','spawn_market','spawn_warehouses'].includes(id)?`<h3>Metropolitan Economy</h3><div class="choice-list compact"><button id="spawnEconomyOverview"><b>Spawn Economy & Industry</b><small>Luxury goods, spirits, desert livestock and city trade flows</small></button></div>`:''}
function wireSpawnEconomyDistrict(id){if($('#spawnEconomyOverview'))$('#spawnEconomyOverview').onclick=showSpawnEconomy}
