/* v1.6.66.26 — Issue, Loss & Replacement */
const GUARDIAN_EQUIPMENT_SERVICE_VERSION=1;
function guardianFormationEquipmentService(U){
 if(!U.equipmentService||typeof U.equipmentService!=='object')U.equipmentService={version:GUARDIAN_EQUIPMENT_SERVICE_VERSION,kitsLost:0,kitsRecovered:0,medicalLost:0,lastLossDay:null,lastReplacementDay:null,replacementsReceived:0};
 const E=U.equipmentService;E.version=GUARDIAN_EQUIPMENT_SERVICE_VERSION;
 for(const k of ['kitsLost','kitsRecovered','medicalLost','replacementsReceived'])E[k]=Math.max(0,Math.round(Number(E[k])||0));
 return E;
}
function guardianFormationEquipmentShortfall(U){const P=guardianFormationPrep(U),n=guardianFormationStrength(U);return Math.max(0,Math.min(n,U.authorizedStrength)-P.standardKits)}
function guardianFormationRecordEquipmentCasualties(U,soldiersLost){
 soldiersLost=Math.max(0,Math.round(Number(soldiersLost)||0));if(!U||!soldiersLost)return {lost:0,recovered:0,medicalLost:0};
 const P=guardianFormationPrep(U),E=guardianFormationEquipmentService(U),beforeKits=P.standardKits,exposed=Math.min(beforeKits,soldiersLost);
 let lost=exposed?Math.min(exposed,Math.max(0,Math.round(exposed*(.18+Math.random()*.24)))):0;
 let recovered=Math.max(0,exposed-lost);
 const remainingStrength=guardianFormationStrength(U);
 if(remainingStrength<=0&&P.standardKits-lost>0){const abandoned=Math.min(P.standardKits-lost,Math.round((P.standardKits-lost)*(.22+Math.random()*.28)));lost+=abandoned}
 let medicalLost=0;if(P.medicalPacks>0){const expected=Math.ceil(soldiersLost/5),chance=remainingStrength<=0?.55:.24;medicalLost=Math.min(P.medicalPacks,Math.round(expected*chance*Math.random()))}
 P.standardKits=Math.max(0,P.standardKits-lost);P.medicalPacks=Math.max(0,P.medicalPacks-medicalLost);
 E.kitsLost+=lost;E.kitsRecovered+=recovered;E.medicalLost+=medicalLost;E.lastLossDay=state.world.day;
 if(lost||recovered||medicalLost)guardianFormationRecord(U,'equipment_casualties',`${recovered} standard field kit${recovered===1?' was':'s were'} recovered from casualties${lost?`; ${lost} kit${lost===1?' was':'s were'} lost or rendered unserviceable`:''}${medicalLost?`; ${medicalLost} medical pack${medicalLost===1?' was':'s were'} lost`:''}.`);
 return {lost,recovered,medicalLost};
}
const __guardianWarRemoveSoldiersIssueLoss=guardianWarRemoveSoldiers;
guardianWarRemoveSoldiers=function(U,count){const lost=__guardianWarRemoveSoldiersIssueLoss(U,count);if(lost>0)guardianFormationRecordEquipmentCasualties(U,lost);return lost};
const __guardianReinforceFormationIssueLoss=guardianReinforceFormation;
guardianReinforceFormation=function(id,count){const U=guardianFormationById(id),before=U?guardianFormationStrength(U):0;const r=__guardianReinforceFormationIssueLoss(id,count);if(U){const added=Math.max(0,guardianFormationStrength(U)-before);if(added){const E=guardianFormationEquipmentService(U);E.replacementsReceived+=added;E.lastReplacementDay=state.world.day;const short=guardianFormationEquipmentShortfall(U);guardianFormationRecord(U,'replacement_equipment',short?`${added} replacement soldier${added===1?' has':'s have'} joined the company. ${short} soldier${short===1?' now lacks':'s now lack'} a standard field kit and must be equipped from Arsenal stores.`:`${added} replacement soldier${added===1?' has':'s have'} joined the company; sufficient issued field equipment is already on hand.`);save()}}return r};
const __guardianDisbandFormationIssueLoss=guardianDisbandFormation;
guardianDisbandFormation=function(id){const U=guardianFormationById(id);if(U&&U.status!=='disbanded'){const P=guardianFormationPrep(U),A=guardianArsenalState(),kits=P.standardKits,med=P.medicalPacks;if(kits||med){A.standardKits+=kits;A.medicalPacks+=med;P.standardKits=0;P.medicalPacks=0;guardianArsenalRecord('stores_returned',`${U.name} returns ${kits} standard field kit${kits===1?'':'s'} and ${med} medical pack${med===1?'':'s'} to the Arsenal on standing down.`)}}return __guardianDisbandFormationIssueLoss(id)};
const __showGuardianFormationDetailIssueLoss=showGuardianFormationDetail;
showGuardianFormationDetail=function(id){const r=__showGuardianFormationDetailIssueLoss.apply(this,arguments),U=guardianFormationById(id),dlg=document.querySelector('.dialog');if(!U||!dlg)return r;const P=guardianFormationPrep(U),E=guardianFormationEquipmentService(U),n=guardianFormationStrength(U),short=guardianFormationEquipmentShortfall(U),h3=Array.from(dlg.querySelectorAll('h3')).find(x=>x.textContent==='Service Record');if(!h3)return r;const sec=document.createElement('div');sec.innerHTML=`<h3>Issue, Loss & Replacement</h3><div class="card compact"><div class="stat-row"><span>Soldiers / serviceable field kits</span><b>${n} / ${P.standardKits}</b></div><div class="stat-row"><span>Soldiers awaiting field equipment</span><b>${short}</b></div><div class="stat-row"><span>Replacement soldiers received</span><b>${E.replacementsReceived}</b></div><div class="stat-row"><span>Battlefield kits recovered</span><b>${E.kitsRecovered}</b></div><div class="stat-row"><span>Kits lost or unserviceable</span><b>${E.kitsLost}</b></div><div class="stat-row"><span>Medical packs lost</span><b>${E.medicalLost}</b></div></div>${short?`<p class="muted">Replacement soldiers count toward company strength immediately, but unequipped soldiers reduce equipment coverage until the Quartermaster issues replacement kits from the Guardian Arsenal.</p>`:'<p class="muted">Every soldier currently on the company rolls has a serviceable standard field kit issued against the formation.</p>'}`;h3.parentNode.insertBefore(sec,h3);return r};
const __showGuardianArsenalIssueLoss=showGuardianArsenal;
showGuardianArsenal=function(){const r=__showGuardianArsenalIssueLoss.apply(this,arguments),dlg=document.querySelector('.dialog');if(!dlg)return r;const h=Array.from(dlg.querySelectorAll('h3')).find(x=>x.textContent==='Company Issue Ledger');if(h){const p=document.createElement('p');p.className='muted';p.textContent='Issued kits remain accountable to their company. Battlefield losses permanently reduce that company’s serviceable issue; replacement soldiers must be equipped from unissued Arsenal stock. Standing down a company returns its remaining serviceable stores here.';h.parentNode.insertBefore(p,h.nextSibling)}return r};
