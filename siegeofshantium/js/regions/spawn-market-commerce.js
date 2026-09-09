/* v1.6.48 — Market District & Urban Commerce
   The Spawn's northeast Market District is not one shop. It is a dense open-air
   commercial district with competing sellers, overlapping inventory, and stable
   day-specific prices so the Player can meaningfully shop around. */

const SPAWN_MARKET_MERCHANTS=[
 {id:'nessa',name:'Nessa Tor',shop:'Tor’s General Stall',place:'Market Cross',pitch:'Reliable everyday equipment from several wholesalers.',markup:1.00,slots:['weapon','offhand','armor','helm','boots'],count:7},
 {id:'yara',name:'Yara Pell',shop:'Pell’s Secondhand Tables',place:'Secondhand Market',pitch:'Used, surplus, and estate equipment. Prices can be excellent; selection is erratic.',markup:.88,slots:['weapon','offhand','armor','helm','boots','ring','amulet'],count:7},
 {id:'hollen',name:'Hollen Varr',shop:'Varr Arms',place:'Equipment Rows',pitch:'Weapons and shields displayed beneath long canvas awnings.',markup:1.04,slots:['weapon','offhand'],count:6},
 {id:'selka',name:'Selka Orr',shop:'Orr Armor & Leather',place:'Equipment Rows',pitch:'Armor, helms, boots, and practical protective gear.',markup:.98,slots:['armor','helm','boots','offhand'],count:6},
 {id:'pavek',name:'Pavek Renn',shop:'Renn’s Road Outfitters',place:'North Market',pitch:'Travel-oriented equipment for guards, couriers, caravan hands, and adventurers.',markup:1.02,slots:['weapon','armor','boots','offhand'],count:6},
 {id:'talin',name:'Talin Moss',shop:'Moss Household & Field',place:'Central Market',pitch:'Practical goods sourced in bulk. Not glamorous, usually competitive.',markup:.94,slots:['weapon','offhand','armor','boots'],count:7},
 {id:'serra',name:'Serra Kell',shop:'Kell Fine Goods',place:'South Market',pitch:'Better-finished pieces, jewelry, and fashionable equipment for prosperous buyers.',markup:1.10,slots:['ring','amulet','armor','helm','boots','weapon'],count:6},
 {id:'dorr',name:'Dorr Cale',shop:'Cale Clearance Yard',place:'Secondhand Market',pitch:'End lots, damaged crates, old contracts, and stock someone wants gone today.',markup:.85,slots:['weapon','offhand','armor','helm','boots'],count:6},
 {id:'merin',name:'Merin Sol',shop:'Sol Apothecary Tables',place:'Central Market',pitch:'Common medicines and field supplies sold from several adjoining counters.',markup:.96,consumables:true,count:6},
 {id:'vala',name:'Vala Denne',shop:'Denne Remedies & Provisions',place:'South Market',pitch:'Medicines, tonics, and travel consumables with a more polished presentation.',markup:1.06,consumables:true,count:6},
 {id:'joren',name:'Joren Tebb',shop:'Tebb Adventuring Goods',place:'Equipment Rows',pitch:'A broad assortment deliberately aimed at mercenaries and traveling companies.',markup:1.01,slots:['weapon','offhand','armor','helm','boots','ring','amulet'],count:7},
 {id:'mina',name:'Mina Voss',shop:'Voss Corner Stall',place:'Market Cross',pitch:'A small but aggressively priced stall that lives on repeat local customers.',markup:.92,slots:['weapon','offhand','armor','helm','boots'],count:5}
];

function spawnMarketState(){
 state.world.spawnMarket=state.world.spawnMarket||{day:state.world.day,sold:{},visited:[]};
 const M=state.world.spawnMarket;
 if(M.day!==state.world.day){M.day=state.world.day;M.sold={};M.visited=[]}
 M.sold=M.sold||{};M.visited=Array.isArray(M.visited)?M.visited:[];
 return M
}
function spawnMarketHash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function spawnMarketRand(key){return (spawnMarketHash(`${state.world.day}|${key}`)%1000000)/1000000}
function spawnMarketShuffle(rows,key){return [...rows].sort((a,b)=>spawnMarketRand(`${key}|${a.id}`)-spawnMarketRand(`${key}|${b.id}`))}
function spawnMarketTierCap(){return clamp(3+Math.floor(((state.level||1)-1)/3),3,7)}
function spawnMarketEquipmentPool(v){
 const maxTier=spawnMarketTierCap();
 return ITEMS.filter(i=>i&&i.id&&!i.artifact&&!i.magic&&!i.id.startsWith('named_')&&(i.tier||1)<=maxTier&&v.slots.includes(i.slot))
}
function spawnMarketConsumablePool(){return CONSUMABLES.filter(Boolean)}
function spawnMarketVendorStock(v){
 const pool=v.consumables?spawnMarketConsumablePool():spawnMarketEquipmentPool(v),rows=spawnMarketShuffle(pool,`stock|${v.id}`),take=Math.min(v.count||6,rows.length);
 // Common practical equipment deliberately appears at multiple sellers, while the seeded
 // remainder keeps each merchant distinct. This creates real overlapping offers to compare.
 return rows.slice(0,take)
}
function spawnMarketQuote(v,it){
 const jitter=.91+spawnMarketRand(`price|${v.id}|${it.id}`)*.18;
 const cha=clamp(1-(stat(state,'cha')-7)*.01,.90,1.10),pros=settlementState('spawn_market')?.prosperity||65,demand=clamp(.96+(pros-50)/500,.92,1.06);
 return Math.max(1,Math.round((it.price||10)*v.markup*jitter*cha*demand))
}
function spawnMarketOfferKey(v,it){return `${v.id}:${it.id}`}
function spawnMarketOfferSold(v,it){return !!spawnMarketState().sold[spawnMarketOfferKey(v,it)]}
function spawnMarketLiveOffers(){
 const out=[];for(const v of SPAWN_MARKET_MERCHANTS)for(const it of spawnMarketVendorStock(v))if(!spawnMarketOfferSold(v,it))out.push({v,it,price:spawnMarketQuote(v,it)});return out
}
function spawnMarketComparisonRows(){
 const by={};for(const o of spawnMarketLiveOffers()){by[o.it.id]=by[o.it.id]||[];by[o.it.id].push(o)}
 return Object.values(by).filter(x=>x.length>1).map(x=>x.sort((a,b)=>a.price-b.price)).sort((a,b)=>(b[b.length-1].price-b[0].price)-(a[a.length-1].price-a[0].price)||a[0].it.name.localeCompare(b[0].it.name))
}
function spawnMarketVisit(v){const M=spawnMarketState();if(!M.visited.includes(v.id))M.visited.push(v.id)}
function showSpawnMarketDistrict(){
 modalRouteEnter('showSpawnMarketDistrict',[]);spawnMarketState();
 const offers=spawnMarketLiveOffers(),comparisons=spawnMarketComparisonRows(),visited=spawnMarketState().visited.length;
 overlay(`<h2>Market District</h2><p>The northeast quarter of the Spawn is an enormous open-air shopping district. Merchants compete directly, inventories overlap, and there is no single official market price.</p><div class="notice compact"><b>Day ${state.world.day} market:</b> ${offers.length} offers across ${SPAWN_MARKET_MERCHANTS.length} merchants • ${comparisons.length} items currently sold by competing sellers.<br>Prices and stock remain fixed for the day. Walking between stalls does not advance the campaign day.</div><div class="choice-list"><button id="spawnCompare"><b>Compare Today’s Prices</b><small>See items offered by more than one merchant and find the cheapest current seller.</small></button><button id="spawnMarketSell"><b>Sell Equipment & Valuables</b><small>Use the district’s broad resale market.</small></button></div><h3>Open-Air Merchants</h3><div class="choice-list compact">${SPAWN_MARKET_MERCHANTS.map(v=>{const live=spawnMarketVendorStock(v).filter(it=>!spawnMarketOfferSold(v,it));return `<button data-spawnvendor="${v.id}"><b>${esc(v.shop)}</b><small>${esc(v.name)} • ${esc(v.place)} • ${live.length} offers${spawnMarketState().visited.includes(v.id)?' • visited':''}</small></button>`}).join('')}</div><p class="muted">Visited today: ${visited}/${SPAWN_MARKET_MERCHANTS.length}. Different merchants may carry the same equipment or supplies at substantially different prices.</p><div class="dialog-footer"><button id="spawnMarketBack">Back to Market District Guide</button></div>`,true);
 document.querySelectorAll('[data-spawnvendor]').forEach(b=>b.onclick=()=>showSpawnMarketVendor(b.dataset.spawnvendor));$('#spawnCompare').onclick=showSpawnMarketCompare;$('#spawnMarketSell').onclick=()=>showSellMode('market');$('#spawnMarketBack').onclick=()=>modalNavBackOrFallback(()=>showSpawnDistrictGuide('spawn_market'))
}
function showSpawnMarketVendor(vendorId){
 const v=SPAWN_MARKET_MERCHANTS.find(x=>x.id===vendorId);if(!v)return showSpawnMarketDistrict();spawnMarketVisit(v);const rows=spawnMarketVendorStock(v),live=rows.filter(it=>!spawnMarketOfferSold(v,it));
 modalRouteEnter('showSpawnMarketVendor',[vendorId]);
 const all=spawnMarketLiveOffers();
 overlay(`<h2>${esc(v.shop)}</h2><p><b>${esc(v.name)}</b> • ${esc(v.place)}</p><p>${esc(v.pitch)}</p><div class="notice compact">This merchant sets independent prices. The same item may be cheaper—or more expensive—a few rows away.</div>${live.length?`<div class="shop-grid">${live.map(it=>{const p=spawnMarketQuote(v,it),other=all.filter(o=>o.it.id===it.id&&o.v.id!==v.id).sort((a,b)=>a.price-b.price),best=other[0];return `<div class="card"><h4>${esc(it.name)}</h4><p>${it.slot?`${esc(it.slot)} • ${itemStatsLine(it)}<br>${traitBadges(it)}${it.special?`<br><i>${esc(it.special)}</i>`:''}`:esc(it.desc||'Travel supply')}</p>${it.slot?comparisonHTML(it,'guardian'):''}<div class="price">${p} gold</div>${best?`<small>${best.price<p?`Another seller is currently <b>${p-best.price}g cheaper</b>.`:`Best competing offer: ${best.price}g.`}</small><br>`:''}<button data-spawnbuy="${esc(it.id)}" ${state.gold<p?'disabled':''}>Buy from ${esc(v.name)}</button></div>`}).join('')}</div>`:`<div class="notice muted">This merchant has sold through today’s available stock.</div>`}<div class="dialog-footer"><button id="spawnVendorCompare">Compare Prices</button><button id="spawnVendorBack">Back to Market Merchants</button></div>`,true);
 document.querySelectorAll('[data-spawnbuy]').forEach(b=>b.onclick=()=>buySpawnMarketOffer(vendorId,b.dataset.spawnbuy));$('#spawnVendorCompare').onclick=showSpawnMarketCompare;$('#spawnVendorBack').onclick=()=>modalNavBackOrFallback(showSpawnMarketDistrict)
}
function buySpawnMarketOffer(vendorId,itemId){
 const v=SPAWN_MARKET_MERCHANTS.find(x=>x.id===vendorId),it=v&&spawnMarketVendorStock(v).find(x=>x.id===itemId);if(!v||!it||spawnMarketOfferSold(v,it))return showSpawnMarketVendor(vendorId);const p=spawnMarketQuote(v,it);if(!pay(state,p))return showSpawnMarketVendor(vendorId);
 invAdd(it.id);state.flags.purchases++;spawnMarketState().sold[spawnMarketOfferKey(v,it)]=true;sfx('coin');log(`Bought ${it.name} from ${v.name} in the Spawn Market District for ${p} gold.`,'good');save();showSpawnMarketVendor(vendorId)
}
function showSpawnMarketCompare(){
 modalRouteEnter('showSpawnMarketCompare',[]);const rows=spawnMarketComparisonRows();
 overlay(`<h2>Compare Today’s Market Prices</h2><p>These goods are being offered by more than one merchant today. The range shows why Spawn residents shop around.</p>${rows.length?rows.map(list=>{const best=list[0],worst=list[list.length-1],spread=worst.price-best.price;return `<div class="card"><h4>${esc(best.it.name)}</h4><p><b>Best:</b> ${best.price}g at ${esc(best.v.shop)}${spread?` • <b>Highest:</b> ${worst.price}g • Difference ${spread}g`:''}</p><div class="choice-list compact">${list.map(o=>`<button data-comparevendor="${o.v.id}"><b>${o.price}g — ${esc(o.v.shop)}</b><small>${esc(o.v.name)} • ${esc(o.v.place)}</small></button>`).join('')}</div></div>`}).join(''):`<div class="notice muted">No remaining goods currently have competing live offers. Purchased stock may have removed today’s overlaps.</div>`}<div class="dialog-footer"><button id="spawnCompareBack">Back to Market Merchants</button></div>`,true);
 document.querySelectorAll('[data-comparevendor]').forEach(b=>b.onclick=()=>showSpawnMarketVendor(b.dataset.comparevendor));$('#spawnCompareBack').onclick=()=>modalNavBackOrFallback(showSpawnMarketDistrict)
}
function spawnMarketDistrictCommerceHTML(id){return id==='spawn_market'?`<h3>Market Commerce</h3><div class="choice-list compact"><button id="spawnMarketCommerce"><b>Browse the Open-Air Market</b><small>Competing merchants, overlapping inventory, and different prices</small></button></div>`:''}
function wireSpawnMarketDistrictCommerce(id){if(id==='spawn_market'&&$('#spawnMarketCommerce'))$('#spawnMarketCommerce').onclick=showSpawnMarketDistrict}
