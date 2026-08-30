// v1.6.23 — Final Hall Operations overrides

// Prisoners: dense action layout; Enlistment is intentionally absent.
prisonerCardHTML=function(p,scope='party'){
 const ow=isOpenWorld(),physical=ow?playerPhysicalContext():null,inside=ow&&physical?.type==='settlement',
       authority=inside&&!!state.world.settlements?.[physical.settlementId],hall=scope==='hall',
       c=ensurePrisonerCustodyIII(p),
       named=Array.isArray(p.namedPersonNames)&&p.namedPersonNames.length?` • ${p.namedPersonNames.map(esc).join(', ')}`:'';
 if(ow&&!p.captureIntelDone&&!p.hallCustody)prisonerCaptureRoadIntel(p);
 const source=`${p.world?'Day':'Round'} ${p.round} • ${esc(p.source||'an enemy force')}${named}${p.hallLabor?' • supervised work crew':''}`;
 const custody=`${esc(prisonerCustodyLabelIII(p))}${c.jurisdiction?` • ${esc(worldLocation(c.jurisdiction).name)} jurisdiction`:''}`;
 const actions=[];
 actions.push(`<button data-release="${p.id}" title="Release these prisoners">Release</button>`);
 if(prisonerExchangeEligibleIII(p))actions.push(`<button data-exchange="${p.id}" ${!authority?'disabled':''} title="Exchange legitimate faction prisoners">Exchange</button>`);
 if(p.world&&prisonerRansomEligibleIII(p))actions.push(`<button data-ransom="${p.id}" ${!authority?'disabled':''} title="Ransom prisoners with a plausible payer">Ransom</button>`);
 if(p.world)actions.push(`<button data-handover="${p.id}" ${!authority?'disabled':''} title="Transfer custody to the local authority">Hand Over</button>`);
 if(!hall&&ow&&canAccessGuardianHall())actions.push(`<button data-deposit="${p.id}" title="Transfer to Guardian Hall custody">To Hall</button>`);
 if(hall)actions.push(`<button data-labor="${p.id}" title="Toggle supervised Hall work assignment">${p.hallLabor?'End Work':'Work Crew'}</button>`);
 return `<div class="prisoner-card">
   <div class="prisoner-card-head"><h4>${esc(p.faction)} Prisoners</h4><span class="prisoner-count-badge">×${p.count}</span></div>
   <div class="prisoner-meta">${source}<br><b>Custody:</b> ${custody}</div>
   <div class="prisoner-actions">${actions.join('')}</div>
 </div>`
};

// Armory state helpers.
function homeArmoryInventory(){
 ensureHomeBase();const h=state.world.homeBase;if(!Array.isArray(h.armoryInventory))h.armoryInventory=[];return h.armoryInventory
}
function homeArmoryAdd(id,qty=1){
 const rows=homeArmoryInventory(),r=rows.find(x=>x.id===id);if(r)r.qty=(r.qty||1)+qty;else rows.push({id,qty})
}
function homeArmoryRemove(id,qty=1){
 const rows=homeArmoryInventory(),r=rows.find(x=>x.id===id);if(!r||r.qty<qty)return false;r.qty-=qty;if(r.qty<=0)state.world.homeBase.armoryInventory=rows.filter(x=>x!==r);return true
}
function homeArmoryAvailableWeapons(){
 normalize();
 const pools=[
   ['blacksmith',state.shopStock?.blacksmith||[]],
   ['fletcher',state.shopStock?.fletcher||[]],
   ['wizard',state.shopStock?.wizard||[]]
 ];
 const seen=new Set(),out=[];
 for(const [shop,ids] of pools)for(const id of ids){
   if(seen.has(id))continue;const it=item(id);if(!it||it.slot!=='weapon')continue;
   seen.add(id);out.push({shop,id,it,price:homeArmoryWeaponPrice(it)})
 }
 return out
}
function homeArmoryWeaponPrice(it){
 // Hall purchase is negotiated by staff, not the Guardian's personal Charisma.
 const morale=1+(50-(state.town?.morale??50))/700;
 return Math.max(1,Math.round((it?.price||25)*morale))
}
function homeArmoryBestFit(it){
 const owners=['guardian',...state.allies].filter(x=>ownerFor(x)),fits=owners.map(oid=>({oid,...itemFitScore(it,oid)})).filter(Boolean).sort((a,b)=>b.delta-a.delta||b.raw-a.raw);
 return fits[0]||null
}
function homeArmoryCandidateScore(row){
 const fit=homeArmoryBestFit(row.it),tier=(row.it.tier||0)+1;
 return (fit?.delta||0)*4+(fit?.raw||0)*.35+tier*5
}
function homeArmoryRemoveFromMarket(row){
 const arr=state.shopStock?.[row.shop];if(!Array.isArray(arr))return;
 const ix=arr.indexOf(row.id);if(ix>=0)arr.splice(ix,1)
}
function homeArmoryPurchaseWeapons(maxBudget){
 ensureHomeBase();const h=state.world.homeBase,S=h.security,L=h.logistics;
 if(!S.headGuard)return actionResult('Head Guard Required','Hire a Head Guard before delegating Armory purchasing.','info',showHomeArmory);
 const ceiling=Math.max(1,Math.min(Math.floor(Number(maxBudget)||0),L.budget||0));
 if(ceiling<=0)return actionResult('No Hall Budget Available','Transfer funds to the Hall budget before assigning an Armory purchase.','bad',showHomeArmory);
 let candidates=homeArmoryAvailableWeapons().map(r=>({...r,score:homeArmoryCandidateScore(r),fit:homeArmoryBestFit(r.it)}))
   .filter(r=>(r.fit?.delta??0)>1)
   .sort((a,b)=>b.score-a.score||a.price-b.price);
 let spent=0,bought=[];
 for(const row of candidates){
   if(row.price>ceiling-spent)continue;
   // Avoid buying repeated copies of the same weapon during one delegated shopping pass.
   if(bought.some(x=>x.id===row.id))continue;
   bought.push(row);spent+=row.price;
 }
 if(!bought.length)return actionResult('No Worthwhile Purchase Found',`${S.headGuard.name} reviewed Shantium's current weapon stocks but found no meaningful Party upgrade that fits the ${ceiling} gold budget.`,'info',showHomeArmory);
 if(!homeFinanceDebit(spent,'Hall Armory weapons',`${S.headGuard.name} purchases ${bought.length} weapon${bought.length===1?'':'s'} from Shantium merchants for Guardian Hall.`))return showHomeArmory();
 for(const row of bought){homeArmoryRemoveFromMarket(row);homeArmoryAdd(row.id,1)}
 h.lastArmoryPurchaseDay=state.world.day;
 const summary=bought.map(r=>`${r.it.name} (${r.price}g${r.fit?`, best fit ${ownerName(r.fit.oid)} ${r.fit.delta>=0?'+':''}${r.fit.delta}`:''})`).join('; ');
 recordWorldHistory(`${S.headGuard.name} purchased weapons for Guardian Hall: ${summary}.`,'good','home');
 save();
 actionResult('Armory Purchase Complete',`${S.headGuard.name} spent ${spent} of the authorized ${ceiling} Hall gold and added ${bought.length} weapon${bought.length===1?'':'s'} to the Hall Armory.<br><br>${esc(summary)}`,'good',showHomeArmory)
}
function homeArmoryIssueTo(id,ownerId){
 const it=item(id),o=ownerFor(ownerId);if(!it||!o||it.slot!=='weapon'||!homeArmoryRemove(id,1))return showHomeArmory();
 const old=o.equipment?.weapon;if(old&&old!==id)homeArmoryAdd(old,1);
 o.equipment.weapon=id;
 recordWorldHistory(`${it.name} was issued from the Hall Armory to ${ownerName(ownerId)}${old&&old!==id?`; ${item(old)?.name||old} returned to the Armory`:''}.`,'info','home');
 save();showHomeArmory()
}
function homeArmoryTakeToPack(id){
 if(!homeArmoryRemove(id,1))return showHomeArmory();invAdd(id);save();showHomeArmory()
}
function showHomeArmoryItem(id){
 guardianHallRouteEnter('showHomeArmoryItem',[id]);const it=item(id);if(!it)return showHomeArmory();
 const owners=['guardian',...state.allies].filter(x=>ownerFor(x)),fits=owners.map(oid=>({oid,...itemFitScore(it,oid)})).filter(Boolean).sort((a,b)=>b.delta-a.delta||b.raw-a.raw);
 const issue=fits.map(f=>`<button data-armoryissueowner="${f.oid}"><b>Issue to ${esc(ownerName(f.oid))}</b><small>${f.delta>=0?'+':''}${f.delta} vs equipped • ${esc(f.label)}</small></button>`).join('');
 overlay(`<h2>${esc(it.name)}</h2>
   <div class="notice"><b>Weapon Stats</b><br>${itemStatsLine(it)}<br>${traitBadges(it)}${it.special?`<br>${esc(it.special)}`:''}</div>
   <h3>Party Comparison</h3>
   <div class="armory-fit-list">${fits.map(f=>`<div class="fit-row"><b>${esc(ownerName(f.oid))}</b><span>Fit ${f.raw}</span><span>${f.delta>=0?'+':''}${f.delta} vs equipped</span><small>${esc(f.label)} • ${esc(f.role.label)}${f.equippedName?` • currently ${esc(f.equippedName)}`:' • no weapon equipped'}</small></div>`).join('')}</div>
   <h3>Armory Actions</h3><div class="choice-list compact">${issue}<button id="armoryTakePack">Take to Guardian Inventory</button></div>
   <div class="dialog-footer"><button id="armoryItemBack">Back to Armory</button></div>`,true);
 document.querySelectorAll('[data-armoryissueowner]').forEach(b=>b.onclick=()=>homeArmoryIssueTo(id,b.dataset.armoryissueowner));
 $('#armoryTakePack').onclick=()=>homeArmoryTakeToPack(id);$('#armoryItemBack').onclick=()=>guardianHallRouteBack(showHomeArmory)
}
function showHomeArmoryPurchase(){
 guardianHallRouteEnter('showHomeArmoryPurchase',[]);ensureHomeBase();const h=state.world.homeBase,S=h.security,L=h.logistics;
 const candidates=homeArmoryAvailableWeapons().map(r=>({...r,fit:homeArmoryBestFit(r.it),score:homeArmoryCandidateScore(r)})).filter(r=>(r.fit?.delta??0)>1).sort((a,b)=>b.score-a.score||a.price-b.price);
 const preview=candidates.slice(0,8).map(r=>`<div class="stat-row"><span><b>${esc(r.it.name)}</b><small>${esc(r.shop)} • best for ${r.fit?esc(ownerName(r.fit.oid)):'—'} (${r.fit?.delta>=0?'+':''}${r.fit?.delta||0})</small></span><b>${r.price}g</b></div>`).join('')||'<div class="notice muted">No meaningful weapon upgrades are currently available in Shantium.</div>';
 overlay(`<h2>Head Guard — Armory Purchasing</h2>
   ${S.headGuard?`<div class="notice compact"><b>${esc(S.headGuard.name)}</b> will review current Shantium weapon stocks and purchase the strongest useful upgrades that fit the authorized Hall budget.</div>`:'<div class="warning notice"><b>Head Guard required.</b> Hire a Head Guard before delegating weapon purchasing.</div>'}
   <div class="armory-purchase-controls">
     <button data-armorybudget="150">150g</button><button data-armorybudget="300">300g</button><button data-armorybudget="600">600g</button>
     <label>Custom<input id="armoryPurchaseBudget" type="number" min="1" max="${Math.max(1,L.budget||1)}" value="${Math.min(300,L.budget||300)}"></label>
   </div>
   <div class="notice compact"><b>Hall operating budget:</b> ${L.budget}g<br><small>The Head Guard spends only what is actually needed, up to the authorized ceiling. Purchased weapons are removed from Shantium's current shop stock and placed in the Hall Armory.</small></div>
   <h3>Best Current Candidates</h3><div class="armory-market-preview">${preview}</div>
   <div class="dialog-footer"><button id="armoryAuthorizePurchase" ${S.headGuard&&L.budget>0?'':'disabled'}>Authorize Purchase</button><button id="armoryPurchaseBack">Cancel</button></div>`,true);
 document.querySelectorAll('[data-armorybudget]').forEach(b=>b.onclick=()=>{$('#armoryPurchaseBudget').value=b.dataset.armorybudget});
 $('#armoryAuthorizePurchase').onclick=()=>homeArmoryPurchaseWeapons($('#armoryPurchaseBudget').value);
 $('#armoryPurchaseBack').onclick=()=>guardianHallRouteBack(showHomeArmory)
}

// Full Hall Armory refresh.
showHomeArmory=function(){
 modalRouteEnter('showHomeArmory',Array.from(arguments));guardianHallRouteEnter('showHomeArmory',[]);ensureHomeBase();
 const h=state.world.homeBase,S=h.security,L=h.logistics;if(!h.upgrades.armory)return showHomeBase();
 const stock=homeArmoryInventory(),weaponCount=stock.reduce((n,r)=>n+(r.qty||1),0),ready=state.world.day-h.armoryIssueDay>=5,choices=homeArmoryChoices();
 const purchased=stock.map(r=>{const it=item(r.id);if(!it)return'';const best=homeArmoryBestFit(it);return `<div class="armory-item-card"><h4>${esc(it.name)}${(r.qty||1)>1?` ×${r.qty}`:''}</h4><div class="armory-stats">${itemStatsLine(it)}<br><small>${best?`Best Party fit: ${esc(ownerName(best.oid))} • ${best.delta>=0?'+':''}${best.delta} vs equipped`:'No Party comparison available'}</small></div><div class="armory-item-actions"><button data-armoryinspect="${r.id}">Inspect & Compare</button><button data-armorytake="${r.id}">Take to Pack</button></div></div>`}).join('')||'<div class="notice muted">No purchased weapons are currently stored in the Hall Armory.</div>';
 const basic=choices.map(id=>`<div class="inventory-row"><span>${esc(item(id).name)}<br><small>${itemStatsLine(item(id))}</small></span><button data-armorybasic="${id}" ${ready?'':'disabled'}>Issue</button></div>`).join('');
 overlay(`<h2>Guardian Hall — Armory</h2>
   <div class="armory-dashboard">
    <div class="armory-kpi"><small>Armory weapons</small><b>${weaponCount}</b><span>purchased reserve</span></div>
    <div class="armory-kpi"><small>Head Guard</small><b>${S.headGuard?esc(S.headGuard.name):'Vacant'}</b><span>${S.headGuard?`competence ${S.headGuard.competence}/10`:'purchasing unavailable'}</span></div>
    <div class="armory-kpi"><small>Hall budget</small><b>${L.budget}g</b><span>weapon purchasing uses Hall funds</span></div>
   </div>
   <div class="choice-list"><button id="armoryHeadGuardBuy" ${S.headGuard&&L.budget>0?'':'disabled'}><b>Task Head Guard: Purchase Weapons</b><small>Set a budget; the Head Guard buys the strongest useful weapons currently available in Shantium.</small></button></div>
   <h3>Hall Armory Inventory</h3><div class="armory-stock-grid">${purchased}</div>
   <details style="margin-top:10px"><summary><b>Basic Armory Issue</b> — ${ready?'available':`available in ${Math.max(0,5-(state.world.day-h.armoryIssueDay))} day(s)`}</summary>
    <p class="compact muted">The original Hall Armory benefit remains: one basic replacement item may be issued every five days.</p>${basic}
   </details>
   <div class="dialog-footer"><button id="armoryBack">Back to Guardian Hall</button></div>`,true);
 if($('#armoryHeadGuardBuy'))$('#armoryHeadGuardBuy').onclick=showHomeArmoryPurchase;
 document.querySelectorAll('[data-armoryinspect]').forEach(b=>b.onclick=()=>showHomeArmoryItem(b.dataset.armoryinspect));
 document.querySelectorAll('[data-armorytake]').forEach(b=>b.onclick=()=>homeArmoryTakeToPack(b.dataset.armorytake));
 document.querySelectorAll('[data-armorybasic]').forEach(b=>b.onclick=()=>{if(state.world.day-h.armoryIssueDay<5)return;invAdd(b.dataset.armorybasic);h.armoryIssueDay=state.world.day;recordWorldHistory(`${item(b.dataset.armorybasic).name} was issued from the Hall Armory.`,'info','home');save();showHomeArmory()});
 $('#armoryBack').onclick=()=>guardianHallRouteBack(showHomeBase)
};
