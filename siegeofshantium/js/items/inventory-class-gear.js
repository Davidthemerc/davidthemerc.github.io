function showInventory(ownerId='guardian'){modalRouteEnter(SOSText("items_inventory_class_gear.showInventory.001"),Array.from(arguments));ensurePartyState();const saleCtx=equipmentSaleContext();if(ownerId!=='guardian'&&!state.party.members[ownerId])ownerId='guardian';const owner=ownerFor(ownerId),eq=owner.equipment,cls=ownerClassName(ownerId);const tabs=[['guardian',state.name],...partyMembers(false).map(m=>[m.id,m.name])].map(([id,n])=>`<button data-owner="${id}" class="${ownerId===id?'active':''}">${esc(n)}</button>`).join('');const rows=state.guardian.inventory.map(v=>{const it=item(v.id);if(!it)return'';const action=SOSText("items_inventory_class_gear.showInventory.002",it.id,ownerId)+(it.slot?SOSText("items_inventory_class_gear.showInventory.003",it.id,ownerId,it.slot==='weapon'?` <button data-bind="${it.id}" data-ownerid="${ownerId}" data-bindsource="pack">${meta.boundWeapon===it.id?'Bound ✓':'Bind'}</button>`:''):SOSText("items_inventory_class_gear.showInventory.004",it.id));return SOSText("items_inventory_class_gear.showInventory.005",it.artifact?'<span class="artifact-mark">ARTIFACT</span> ':'',it.rareExploration?'<span class="rare-explore-mark">RARE FIND</span> ':'',esc(it.name),v.qty||1,affinityBadge(cls,it),upgradeMark(it,ownerId),traitBadges(it),it.slot?` • Best use: ${esc(bestPartyRecipient(it))}`:'',it.slot||'item',action,it.id,it.slot?(saleCtx.allowed?'':`disabled title="${esc(isOpenWorld()?'Equipment can only be sold in a settlement with local trade.':'Selling unavailable.')}" `):'disabled title="Consumables can only be sold at the Market." ')}).join('');const equipped=EQUIP_SLOTS.map(slot=>{const id=eq[slot],it=id?item(id):null;return `<div class="equipment-row"><span><b>${slot[0].toUpperCase()+slot.slice(1)}</b></span><span>${it?`${esc(it.name)} ${affinityBadge(cls,it)}<br><small>${traitBadges(it)}</small>`:'—'}</span><span>${it?`<button data-inspect="${it.id}" data-owner="${ownerId}">Inspect</button> <button data-unequip="${slot}" data-ownerid="${ownerId}">Unequip</button>${slot==='weapon'?` <button data-bind="${it.id}" data-ownerid="${ownerId}" data-bindsource="equipped">${meta.boundWeapon===it.id?'Bound ✓':'Bind'}</button>`:''}`:''}</span></div>`}).join('');const vitals=ownerId==='guardian'?SOSText("items_inventory_class_gear.showInventory.006",owner.hp,maxHP(),owner.stamina,maxStamina()):SOSText("items_inventory_class_gear.showInventory.007",owner.hp,allyMaxHP(owner),esc(owner.title));overlay(SOSText("items_inventory_class_gear.showInventory.008",tabs,esc(ownerName(ownerId)),cls?esc(cls):'Unclassed',vitals,(()=>{const oc=outfitStockContext();return `<button id="autoOutfit" ${oc.available?'':`disabled title="${esc(oc.detail)}"`}>${esc(oc.label)}</button>`})(),ownerId==='guardian'&&state.guardian.classChoicePending?'<button id="inventoryChooseClass">Choose Class</button>':'',equipped,rows||'Empty.',footer(),TRADE_GOODS.map(g=>`<div class="inventory-row"><span><b>${esc(g.name)}</b><br><small>Carried cargo</small></span><b>${state.world.cargo[g.id]||0}</b></div>`).join('')),true);document.querySelectorAll('[data-bind]').forEach(b=>b.onclick=()=>{if(meta.boundWeapon!==b.dataset.bind)bindWeapon(b.dataset.bind,b.dataset.ownerid,b.dataset.bindsource||'pack')});document.querySelectorAll('[data-owner]').forEach(b=>b.onclick=()=>showInventory(b.dataset.owner));document.querySelectorAll('[data-inspect]').forEach(b=>b.onclick=()=>inspectItem(b.dataset.inspect,b.dataset.owner||'guardian'));document.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>equip(b.dataset.equip,b.dataset.ownerid));document.querySelectorAll('[data-unequip]').forEach(b=>b.onclick=()=>unequip(b.dataset.ownerid,b.dataset.unequip));document.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>useItemOutside(b.dataset.use,ownerId));document.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>sellItem(b.dataset.sell,ownerId));$('#autoOutfit').onclick=()=>showOutfitter(ownerId,'inventory');$('#optimizeParty').onclick=optimizePartyEquipment;if($('#inventoryChooseClass'))$('#inventoryChooseClass').onclick=showClassChoice;wireClose()}
function optimizePartyEquipment(){ensurePartyState();const owners=['guardian',...state.allies].filter(id=>ownerFor(id)),before={};for(const oid of owners)before[oid]={...ownerFor(oid).equipment};let pool=[];for(const oid of owners){const o=ownerFor(oid);for(const slot of EQUIP_SLOTS){if(o.equipment[slot]){if(oid==='guardian'&&slot==='weapon'&&o.equipment[slot]===meta.boundWeapon)continue;pool.push(o.equipment[slot]);o.equipment[slot]=null}}}for(const v of [...state.guardian.inventory]){const it=item(v.id);if(it?.slot)for(let n=0;n<(v.qty||1);n++)pool.push(v.id)}state.guardian.inventory=state.guardian.inventory.filter(v=>!item(v.id)?.slot);for(const slot of EQUIP_SLOTS){let items=pool.filter(id=>item(id)?.slot===slot);while(items.length){let best=null;for(const id of items){const it=item(id);for(const oid of owners){const o=ownerFor(oid);if(o.equipment[slot])continue;const score=gearUtility(it,ownerClassName(oid),'balanced',oid);if(!best||score>best.score)best={id,oid,score}}}if(!best)break;ownerFor(best.oid).equipment[slot]=best.id;pool.splice(pool.indexOf(best.id),1);items=pool.filter(id=>item(id)?.slot===slot)}}pool.forEach(id=>invAdd(id));const changes=[];for(const oid of owners){const o=ownerFor(oid);for(const slot of EQUIP_SLOTS){const was=before[oid][slot],now=o.equipment[slot];if(was!==now&&now){const from=owners.find(x=>x!==oid&&before[x][slot]===now);changes.push(`${ownerName(oid)}: ${was?item(was)?.name+' → ':''}${item(now)?.name}${from?` (from ${ownerName(from)})`:` (from shared inventory)`}`)}}}log(changes.length?SOSText("items_inventory_class_gear.optimizePartyEquipment.001",changes.length,changes.length===1?'':'s'):SOSText("items_inventory_class_gear.optimizePartyEquipment.002"),'good');save();overlay(SOSText("items_inventory_class_gear.optimizePartyEquipment.003",changes.length?'Only actual equipment changes are shown.':'No equipment needed to be redistributed.',changes.map(esc).join('<br>')||'No changes.'));$('#optDone').onclick=()=>showInventory('guardian')}
function equip(id,ownerId='guardian'){const it=item(id),owner=ownerFor(ownerId);if(!it||!it.slot||!owner||!invRemove(id))return;const old=owner.equipment[it.slot];if(old)invAdd(old);owner.equipment[it.slot]=id;if(it.id.startsWith('named_'))unlock('legend');sfx('coin');save();showInventory(ownerId)}
function unequip(ownerId,slot){const owner=ownerFor(ownerId);if(!owner||!owner.equipment?.[slot])return;invAdd(owner.equipment[slot]);owner.equipment[slot]=null;save();showInventory(ownerId)}
function invAdd(id,qty=1){const e=state.guardian.inventory.find(x=>x.id===id);if(e)e.qty=(e.qty||1)+qty;else state.guardian.inventory.push({id,qty})}
function invRemove(id,qty=1){const e=state.guardian.inventory.find(x=>x.id===id);if(!e)return false;e.qty=(e.qty||1)-qty;if(e.qty<=0)state.guardian.inventory=state.guardian.inventory.filter(x=>x!==e);return true}
function sellItem(id,ownerId='guardian',quick=false,returnTo='inventory'){const it=item(id);if(!it||meta.boundWeapon===id)return;if(!it.slot&&!quick)return;if(blockEquipmentSaleIfUnavailable(()=>showInventory(ownerId)))return;const val=equipmentSellPrice(it);const go=()=>{if(invRemove(id)){gainGold(val);log(SOSText("items_inventory_class_gear.sellItem.001",it.name,val),'good');sfx('coin');save()}returnTo==='market'?showMarket():returnTo==='shop'?showShop(SOSText("items_inventory_class_gear.sellItem.002")):showInventory(ownerId)};if(quick)return go();overlay(SOSText("items_inventory_class_gear.sellItem.003",esc(it.name),val));$('#confirmSell').onclick=go;$('#cancelSell').onclick=()=>showInventory(ownerId)}
function useItemOutside(id,ownerId='guardian'){
 const target=ownerFor(ownerId),isGuardian=ownerId==='guardian',hpMax=isGuardian?maxHP():allyMaxHP(target),stMax=isGuardian?maxStamina():allyMaxStamina(target);
 if(id==='heal'||id==='bandage'){
   if(target.hp>=hpMax)return actionResult(SOSText("items_inventory_class_gear.useItemOutside.001"),SOSText("items_inventory_class_gear.useItemOutside.002",ownerName(ownerId)),'info',()=>showInventory(ownerId));
   target.hp=Math.min(hpMax,target.hp+(id==='heal'?32:16));invRemove(id);if(id==='heal')sfx('potion')
 }else if(id==='stamina'){
   if(target.stamina>=stMax)return actionResult(SOSText("items_inventory_class_gear.useItemOutside.003"),SOSText("items_inventory_class_gear.useItemOutside.004",ownerName(ownerId)),'info',()=>showInventory(ownerId));
   target.stamina=Math.min(stMax,target.stamina+35);invRemove(id)
 }else return;
 save();showInventory(ownerId)
}


function showClassGuide(back='class'){modalRouteEnter(SOSText("items_inventory_class_gear.showClassGuide.001"),Array.from(arguments));
 const dlg=overlay(SOSText("items_inventory_class_gear.showClassGuide.002",Object.entries(ATTRIBUTES).map(([k,a])=>`<div class="card"><h4>${esc(a.name)}</h4><p>${esc(a.desc)}</p><small><b>Strong synergy:</b> ${esc(a.classes)}</small></div>`).join(''),Object.values(CLASSES).map(c=>`<div class="class-card"><h4>${esc(c.name)}</h4><p>${esc(c.desc)}</p><small>${esc(c.core)}</small></div>`).join('')),true);
 const backBtn=dlg.querySelector('#guideBack');
 if(backBtn)backBtn.onclick=()=>back==='level'?showLevelUpPrompt():back==='training'?showTraining():back==='help'?showHelp():showClassChoice();
}
function boundWeaponClassFit(className){
 const id=state?.guardian?.equipment?.weapon;
 if(!id||id!==meta.boundWeapon)return null;
 const it=item(id);if(!it)return null;
 const fit=roleSuitability(className,it);
 return {id,it,fit,inappropriate:fit.score<0}
}
function finalizeGuardianClass(className,keepBound=false){
 const check=boundWeaponClassFit(className);
 if(check?.inappropriate&&!keepBound){
   state.guardian.equipment.weapon=null;invAdd(check.id);
   log(SOSText("items_inventory_class_gear.finalizeGuardianClass.001",check.it.name,className),'info');
 }
 state.guardian.className=className;state.guardian.classChoicePending=false;
 log(SOSText("items_inventory_class_gear.finalizeGuardianClass.002",state.name,className),'good');
 chronicle(SOSText("items_inventory_class_gear.finalizeGuardianClass.003"),SOSText("items_inventory_class_gear.finalizeGuardianClass.004",state.name,className),'milestone');
 save();showLevelUpPrompt()
}
function chooseGuardianClass(className){
 const check=boundWeaponClassFit(className);
 if(!check?.inappropriate)return finalizeGuardianClass(className,false);
 const reason=check.fit.reasons?.length?check.fit.reasons.join('; '):SOSText("items_inventory_class_gear.chooseGuardianClass.001");
 const dlg=overlay(SOSText("items_inventory_class_gear.chooseGuardianClass.002",esc(className),esc(check.it.name),esc(check.fit.label),esc(className),esc(reason),esc(className)),true);
 const unequip=dlg.querySelector('#classUnequipBound');if(unequip)unequip.onclick=()=>finalizeGuardianClass(className,false);
 const keep=dlg.querySelector('#classKeepBound');if(keep)keep.onclick=()=>finalizeGuardianClass(className,true);
 const cancel=dlg.querySelector('#classCancelBound');if(cancel)cancel.onclick=showClassChoice
}
function showClassChoice(){modalRouteEnter(SOSText("items_inventory_class_gear.showClassChoice.001"),Array.from(arguments));
 if(state.level<2||guardianClass()){showLevelUpPrompt();return}
 const bound=state.guardian.equipment.weapon===meta.boundWeapon?item(meta.boundWeapon):null;
 const dlg=overlay(SOSText("items_inventory_class_gear.showClassChoice.002",bound?`<div class="notice"><b>Bound weapon equipped:</b> ${esc(bound.name)}. If the class is a poor match, you will choose whether to keep it equipped.</div>`:'',Object.values(CLASSES).map(c=>`<div class="class-card"><h3>${c.name}</h3><p>${c.desc}</p><small>${c.core}</small><button data-class="${c.name}">Choose ${c.name}</button></div>`).join('')),true);
 dlg.querySelectorAll('[data-class]').forEach(b=>b.onclick=()=>chooseGuardianClass(b.dataset.class));
 const cg=dlg.querySelector('#classGuide');if(cg)cg.onclick=()=>showClassGuide('class')
}
function showAttributeAllocation(){modalRouteEnter(SOSText("items_inventory_class_gear.showAttributeAllocation.001"),Array.from(arguments));
 const dlg=overlay(SOSText("items_inventory_class_gear.showAttributeAllocation.002",state.attributePoints,state.attributePoints===1?'':'s',Object.entries(state.guardian.stats).map(([k,v])=>{const a=attrGuide(k);return `<div class="inventory-row"><span><b>${esc(a.name)} ${v}</b><br><small>${esc(a.desc)} • ${esc(a.classes)}</small></span><button data-levelattr="${k}" ${state.attributePoints<=0?'disabled':''}>+1</button></div>`}).join(''),state.attributePoints>0?'Done for Now':'Finish'),true);
 dlg.querySelectorAll('[data-levelattr]').forEach(btn=>btn.onclick=()=>{if(state.attributePoints<=0)return;const k=btn.dataset.levelattr;state.guardian.stats[k]=(state.guardian.stats[k]||0)+1;state.attributePoints--;normalize();save();showAttributeAllocation()});
 const guide=dlg.querySelector('#allocationGuide');if(guide)guide.onclick=()=>showClassGuide('level');
 const done=dlg.querySelector('#allocationDone');if(done)done.onclick=()=>{save();if(state.attributePoints>0)showLevelUpPrompt();else{closeOverlay();renderGame()}};
}
function showLevelUpPrompt(){modalRouteEnter(SOSText("items_inventory_class_gear.showLevelUpPrompt.001"),Array.from(arguments));
 if(state.level>=2&&!guardianClass())return showClassChoice();
 if(state.attributePoints<=0){closeOverlay();renderGame();return}
 const dlg=overlay(SOSText("items_inventory_class_gear.showLevelUpPrompt.002",state.level,state.attributePoints,guardianClass()?`<p>${esc(classProgressText())}</p>`:''));
 const spend=dlg.querySelector('#spendPoints');if(spend)spend.onclick=showAttributeAllocation;
 const guide=dlg.querySelector('#levelGuide');if(guide)guide.onclick=()=>showClassGuide('level');
}
function legacyWeaponFactor(){return Math.min(1,.42+Math.max(0,(state.level||1)-1)*.075)}
function isGuardianBoundItem(it,ownerId='guardian'){return ownerId==='guardian'&&!!it?.id&&state.flags?.legacyWeapon===it.id}
function legacyFitBonus(it,ownerId='guardian'){return isGuardianBoundItem(it,ownerId)?2+legacyWeaponFactor()*3:0}
function boundPreferenceBonus(it,ownerId='guardian'){return isGuardianBoundItem(it,ownerId)?12:0}
function fitEffectiveItem(id,ownerId='guardian'){if(!id)return null;return item(id)}
function gearUtility(it,className,priority='balanced',ownerId='guardian'){
 if(!it||!it.slot)return 0;
 let wd=1.85,wa=1.15,wdef=1.35,wi=.72;
 if(priority==='weapon'){wd=2.55;wa=1.45;wdef=.65;wi=.82}
 else if(priority==='defense'){wd=.75;wa=.65;wdef=2.35;wi=.58}
 else if(priority==='cheap'){wd=1.55;wa=1.0;wdef=1.2;wi=.58}
 const role=roleSuitability(className,it),mechanical=(it.damage||0)*wd+(it.accuracy||0)*wa+(it.defense||0)*wdef+(it.initiative||0)*wi;
 return mechanical+role.score*2.2+traitScore(it,className)+(it.tier||0)*1.65+(it.enchantment?7+(it.enchantment.power||0)*2:0)+legacyFitBonus(it,ownerId)+boundPreferenceBonus(it,ownerId)
}
