// v1.6.23 — Prisoners & Custody spacing / formatting refresh
prisonerCardHTML=function(p,scope='party'){
 const ow=!!state&&state.mode==='openworld',
       physical=ow?playerPhysicalContext():null,
       inside=ow&&physical?.type==='settlement',
       authority=inside&&!!state.world.settlements?.[physical.settlementId],
       hall=scope==='hall',
       c=ensurePrisonerCustodyIII(p),
       named=Array.isArray(p.namedPersonNames)&&p.namedPersonNames.length?p.namedPersonNames.map(esc).join(', '):'';
 if(ow&&!p.captureIntelDone&&!p.hallCustody)prisonerCaptureRoadIntel(p);

 const sourceName=esc(p.source||'an enemy force');
 const custodyName=esc(prisonerCustodyLabelIII(p));
 const jurisdiction=c.jurisdiction?esc(worldLocation(c.jurisdiction).name):'—';

 const actions=[];
 actions.push(`<button data-release="${p.id}" title="Release these prisoners">Release</button>`);
 if(prisonerExchangeEligibleIII(p))actions.push(`<button data-exchange="${p.id}" ${!authority?'disabled':''} title="Exchange legitimate faction prisoners">Exchange</button>`);
 if(p.world&&prisonerRansomEligibleIII(p))actions.push(`<button data-ransom="${p.id}" ${!authority?'disabled':''} title="Ransom prisoners with a plausible payer">Ransom</button>`);
 if(p.world)actions.push(`<button data-handover="${p.id}" ${!authority?'disabled':''} title="Transfer custody to the local authority">Hand Over</button>`);
 if(!hall&&ow&&canAccessGuardianHall())actions.push(`<button data-deposit="${p.id}" title="Transfer to Guardian Hall custody">To Hall</button>`);
 if(hall)actions.push(`<button data-labor="${p.id}" title="Toggle supervised Hall work assignment">${p.hallLabor?'End Work':'Work Crew'}</button>`);

 return `<div class="prisoner-card">
   <div class="prisoner-card-head">
     <h4>${esc(p.faction)} Prisoners</h4>
     <span class="prisoner-count-badge">×${p.count}</span>
   </div>
   <div class="prisoner-meta-grid">
     <div><span class="prisoner-meta-label">${p.world?'Captured':'Taken'}</span><span class="prisoner-meta-value">${p.world?'Day':'Round'} ${p.round}</span></div>
     <div><span class="prisoner-meta-label">Source</span><span class="prisoner-meta-value">${sourceName}</span></div>
     <div><span class="prisoner-meta-label">Custody</span><span class="prisoner-meta-value">${custodyName}</span></div>
     ${ow?`<div><span class="prisoner-meta-label">Jurisdiction</span><span class="prisoner-meta-value">${jurisdiction}</span></div>`:''}
     ${named?`<div class="prisoner-meta-wide"><span class="prisoner-meta-label">Named captives</span><span class="prisoner-meta-value">${named}</span></div>`:''}
     ${p.hallLabor?`<div class="prisoner-meta-wide"><span class="prisoner-meta-label">Assignment</span><span class="prisoner-meta-value">Supervised Hall work crew</span></div>`:''}
   </div>
   <div class="prisoner-actions">${actions.join('')}</div>
 </div>`
};
