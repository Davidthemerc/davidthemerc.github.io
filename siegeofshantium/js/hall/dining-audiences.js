// v1.6.23 — Hall social systems final overrides

function homeGuestEarlyDeparturePenalty(g){
 const days=Math.max(1,state.world.day-(g?.arrivedDay||state.world.day)+1);
 return days<=2?-3:-2
}
function confirmHomeGuestEarlyDeparture(){
 ensureHomeBase();const g=state.world.homeBase.hospitality.guest;if(!g)return showHomeGuestQuarters();
 const days=Math.max(1,state.world.day-(g.arrivedDay||state.world.day)+1),
       left=Math.max(0,(g.expiresDay||state.world.day)-state.world.day),
       penalty=homeGuestEarlyDeparturePenalty(g);
 overlay(`<h2>Ask ${esc(g.name)} to Leave Early?</h2>
   <div class="guest-early-warning"><b>This will damage the relationship.</b><br>
   You invited ${esc(g.name)} to stay at Guardian Hall. Ending the visit ${left?`${left} day${left===1?'':'s'} early`:'before its normal conclusion'} will be taken as a deliberate withdrawal of hospitality.</div>
   <div class="notice compact"><b>Relationship effect:</b> ${penalty} familiarity / disposition<br>
   <b>Visit so far:</b> ${days} day${days===1?'':'s'} • ${g.meals||0} shared meal${(g.meals||0)===1?'':'s'} • ${g.refreshments||0} refreshment visit${(g.refreshments||0)===1?'':'s'}</div>
   <div class="dialog-footer"><button id="confirmGuestEarlyDeparture">End Visit Early</button><button id="cancelGuestEarlyDeparture">Keep Hosting Them</button></div>`,true);
 $('#confirmGuestEarlyDeparture').onclick=()=>{homeConcludeGuestStay('is asked to leave before the planned end of the visit',true);save();showHomeGuestQuarters()};
 $('#cancelGuestEarlyDeparture').onclick=showHomeGuestQuarters
}

// Normal completion gives +1; deliberate early termination now penalizes the relationship.
homeConcludeGuestStay=function(reason=SOSText("hall_core_hospitality.homeConcludeGuestStay.001"),forcedEarly=false){
 ensureHomeBase();const H=state.world.homeBase.hospitality,g=H.guest;if(!g)return;
 const days=Math.max(1,state.world.day-(g.arrivedDay||state.world.day)+1),
       early=forcedEarly||/early|before the planned|asked to leave/i.test(String(reason||'')),
       relationChange=early?homeGuestEarlyDeparturePenalty(g):1,
       summary={day:state.world.day,name:g.name,arrivedDay:g.arrivedDay,days,meals:g.meals||0,refreshments:g.refreshments||0,socialMoments:g.socialMoments||0,reason,earlyDeparture:early,relationshipChange:relationChange};
 H.history.push(summary);H.history=H.history.slice(-20);
 const inv=H.invitations.find(x=>x.id===g.invitationId);if(inv){inv.status=early?'ended_early':'completed';inv.resolvedDay=state.world.day}
 if(early)homeHospitalityRelationship(g,relationChange,`${g.name} was asked to leave Guardian Hall before the planned end of the visit.`);
 else homeHospitalityRelationship(g,1,SOSText("hall_core_hospitality.homeConcludeGuestStay.002",g.name,days));
 if(g.recordId){
   const tr=travelerRegistryState().records[g.recordId];if(tr){
     tr.hospitalityStatus=null;tr.lastKnownLocation='shantium';tr.lastLocationDay=state.world.day;
     tr.lastLead={precision:'exact',location:'shantium',day:state.world.day,source:SOSText("hall_core_hospitality.homeConcludeGuestStay.003")};
     if(tr.settledAt){const back=homeHospitalityTravelDays(tr.settledAt)||2;tr.hospitalityAwayUntil=state.world.day+back}else tr.hospitalityAwayUntil=state.world.day+1
   }
 }
 const historyText=early?`${g.name} is asked to leave Guardian Hall early after ${days} day${days===1?'':'s'}. The abrupt end to the hospitality damages the relationship (${relationChange}).`:SOSText("hall_core_hospitality.homeConcludeGuestStay.004",g.name,reason,days,days===1?'':'s');
 recordWorldHistory(historyText,early?'bad':'info','home');
 homeHospitalityReport(early?`${g.name}'s stay is ended early. Relationship ${relationChange}.`:SOSText("hall_core_hospitality.homeConcludeGuestStay.005",g.name,days,days===1?'':'s'),early?'bad':'good');
 H.guest=null
};

// Patch current Guest Quarters end-visit button to confirmation.
const __v162214ShowHomeGuestQuarters=showHomeGuestQuarters;
showHomeGuestQuarters=function(){
 __v162214ShowHomeGuestQuarters();
 if($('#guestDepart'))$('#guestDepart').onclick=confirmHomeGuestEarlyDeparture
};

function homeAudienceTypeLabel(v){
 if(v.authorityClaim)return'AUTHORITY CLAIM';
 if(v.endorsementRequest)return'ENDORSEMENT REQUEST';
 if(v.sanctuary)return'SANCTUARY MATTER';
 if(v.political)return'POLITICAL VISIT';
 if(v.kind==='petitioner')return'PETITION';
 if(v.kind==='shelter')return'LODGING REQUEST';
 return'SOCIAL CALL'
}
function homeAudienceShortPurpose(v){
 if(v.authorityClaim)return'A political authority is testing the Hall’s independence and jurisdiction.';
 if(v.endorsementRequest)return'They want the Guardian to turn a private relationship into a public political commitment.';
 if(v.sanctuary)return'A traveler is asking the Hall for protection from an outside authority.';
 if(v.political)return'They came to discuss political relations and possible cooperation.';
 if(v.kind==='petitioner')return'They are asking the Guardian Hall for practical help.';
 if(v.kind==='shelter')return'They need temporary lodging and assistance.';
 return'They came to call on the Guardian without a formal demand.'
}

// Dining / Gathering interface refresh.
showHomeDining=function(){
 modalRouteEnter('showHomeDining',Array.from(arguments));guardianHallRouteEnter('showHomeDining',[]);ensureHomeBase();
 const h=state.world.homeBase,H=h.hospitality,g=H.guest,arrived=homeGatheringArrived(),pending=homeGatheringPending(),
       activeInv=homeGatheringInvitees().filter(x=>['sent','traveling','arrived'].includes(x.status)),
       activeIds=new Set(activeInv.map(x=>x.targetId)),
       cands=homeKnownGuestCandidates().filter(c=>c.canInvite&&!activeIds.has(c.id)&&(!g||g.id!==c.id)).slice(0,16),
       outside=arrived.reduce((n,x)=>n+(x.size||1),0)+(g?homeGuestSize(g):0);
 const dashboard=`<div class="hall-social-dashboard">
   <div><small>Dining Hall</small><b>${homeDiningCapacity(false)} seats</b><span>Company meals & gatherings</span></div>
   <div><small>Formal Dining</small><b>${homeDiningCapacity(true)} seats</b><span>Honored guests & diplomacy</span></div>
   <div><small>Hall Stores</small><b>${h.logistics.supplies?.food||0} food / ${h.logistics.supplies?.hospitality||0} hospitality</b><span>${outside} outside guest${outside===1?'':'s'} currently ready</span></div>
 </div>`;
 const meals=`<div class="dining-section"><h3>Meals at the Hall</h3><p class="compact muted">Host the company or spend a meal specifically with your current guests.</p>
   <div class="dining-primary-actions">
     <button id="companySupper"><b>Company Supper</b><small>An ordinary shared meal for the Hall household.</small></button>
     ${g?`<button id="dineGuest"><b>Supper with ${esc(g.name)}</b><small>Informal hospitality; the first shared meal can improve the relationship.</small></button>
     <button id="formalGuest"><b>Formal Dinner with ${esc(g.name)}</b><small>A more significant occasion; the first formal dinner gives a stronger relationship benefit.</small></button>`:''}
   </div></div>`;
 const gatheringActions=`<div class="dining-section"><h3>Host a Gathering</h3><p class="compact muted">Invited contacts who have arrived can be brought together for a deliberate Hall event.</p>
   <div class="dining-primary-actions">
     <button id="hostGathering" ${arrived.length||g?'':'disabled'}><b>Hall Gathering</b><small>Informal social event in the Dining Hall.</small></button>
     <button id="hostFormalGathering" ${arrived.length||g?'':'disabled'}><b>Formal Gathering</b><small>Smaller, deliberate gathering in the Formal Dining Room.</small></button>
     ${h.upgrades.banquetFacilities?`<button id="hostBanquet" ${arrived.length||g?'':'disabled'}><b>Major Banquet</b><small>Large public-facing event using expanded banquet facilities.</small></button>`:''}
   </div>
   ${!h.upgrades.banquetFacilities?'<div class="notice compact"><b>Major Banquets:</b> Build Great Banquet Facilities under Hall Improvements to host deliberately large Hall-wide events.</div>':''}
 </div>`;
 const activeHTML=activeInv.map(inv=>`<div class="gathering-invite-row"><div><b>${esc(inv.name)}</b><small>${inv.status==='sent'?`Invitation sent • reply expected after Day ${inv.responseDay}`:inv.status==='traveling'?`Accepted • traveling from ${esc(worldLocation(inv.origin).name)} • expected around Day ${inv.arrivalDay}`:'Present in Shantium and ready for the gathering'}</small></div><div class="gathering-invite-actions">${inv.recordId?`<button data-dininggroupinfo="${inv.recordId}">View Group</button>`:''}<button data-cancelgather="${inv.id}">Withdraw</button></div></div>`).join('')||'<p class="muted">No gathering invitations are currently active.</p>';
 const candidates=activeInv.length<3?cands.map(c=>`<div class="gathering-invite-row"><div><b>${esc(c.name)}</b><small>${c.size} guest${c.size===1?'':'s'} • ${esc(c.detail||'Known contact')}</small></div><div class="gathering-invite-actions">${c.recordId?`<button data-dininggroupinfo="${c.recordId}">View Group</button>`:''}<button data-gatherinvite="${c.id}" ${c.size>homeDiningCapacity(false)?'disabled':''}>Invite</button></div></div>`).join('')||'<p class="muted">No additional known contacts currently have usable whereabouts.</p>':'<div class="notice compact">Three gathering invitations are already active.</div>';
 overlay(`<h2>Guardian Hall — Dining & Gatherings</h2><p>Meals are part of everyday Hall life; gatherings are deliberate social events for guests, contacts, and political relationships.</p>
   ${dashboard}${meals}${gatheringActions}
   <div class="dining-section"><h3>Gathering Invitations</h3>${activeHTML}<h4>Invite Known Contacts</h4>${candidates}</div>
   <div class="dialog-toolbar"><button id="diningHistory">Dining & Gathering Record (${H.diningHistory.length})</button></div>
   <div class="dialog-footer"><button id="diningBack">Back to Guardian Hall</button></div>`,true);
 if($('#companySupper'))$('#companySupper').onclick=homeCompanySupper;
 if($('#dineGuest'))$('#dineGuest').onclick=()=>homeInviteMeal(false);
 if($('#formalGuest'))$('#formalGuest').onclick=()=>homeInviteMeal(true);
 if($('#hostGathering'))$('#hostGathering').onclick=()=>homeHostGathering(false,false);
 if($('#hostFormalGathering'))$('#hostFormalGathering').onclick=()=>homeHostGathering(true,false);
 if($('#hostBanquet'))$('#hostBanquet').onclick=()=>homeHostGathering(false,true);
 document.querySelectorAll('[data-gatherinvite]').forEach(b=>b.onclick=()=>homeSendGatheringInvitation(b.dataset.gatherinvite));
 document.querySelectorAll('[data-cancelgather]').forEach(b=>b.onclick=()=>homeCancelGatheringInvitation(b.dataset.cancelgather));
 document.querySelectorAll('[data-dininggroupinfo]').forEach(b=>b.onclick=()=>showHomeGuestGroupInfo(b.dataset.dininggroupinfo));
 $('#diningHistory').onclick=showHomeDiningHistory;$('#diningBack').onclick=()=>guardianHallRouteBack(showHomeBase)
};

// Visitors list refresh.
showHomeVisitors=function(){
 modalRouteEnter('showHomeVisitors',Array.from(arguments));guardianHallRouteEnter('showHomeVisitors',[]);ensureHomeBase();
 const A=state.world.homeBase.audiences,q=A.queue,recent=A.history.slice(-8).reverse();
 const rows=q.map(v=>{const waiting=Math.max(0,state.world.day-v.arrivedDay);return `<div class="audience-row"><div><span class="audience-type-badge">${homeAudienceTypeLabel(v)}</span><b>${esc(v.name)}</b><small>${esc(homeAudienceShortPurpose(v))}<br>Waiting ${waiting} day${waiting===1?'':'s'} • expected to leave after Day ${v.expiresDay}</small>${v.hallConnection?`<div class="hall-life-connection">${esc(v.hallConnection)}</div>`:''}</div><div class="audience-row-actions"><button data-audience="${v.id}">Receive Visitor</button></div></div>`}).join('')||'<div class="notice muted">Nobody is currently waiting for the Guardian.</div>';
 const history=recent.map(r=>`<div class="card compact"><b>Day ${r.day}</b><br>${esc(r.text)}</div>`).join('')||'<p class="muted">No audience record yet.</p>';
 overlay(`<h2>Guardian Hall — Audiences & Visitors</h2><p>People arrive at the Hall for different reasons. Review who is waiting, why they came, and decide how much of the Hall’s time or authority to give them.</p>
   <div class="hall-social-dashboard">
     <div><small>Waiting</small><b>${q.length}</b><span>currently at the Hall</span></div>
     <div><small>Audiences Concluded</small><b>${A.totalResolved}</b><span>all recorded visits</span></div>
     <div><small>Practical Help</small><b>${A.totalPetitions}</b><span>petition${A.totalPetitions===1?'':'s'} assisted • ${A.totalSocial} social visit${A.totalSocial===1?'':'s'}</span></div>
   </div>
   <h3>Waiting at the Hall</h3>${rows}
   <details style="margin-top:10px"><summary><b>Recent Visits</b></summary>${history}</details>
   <div class="dialog-footer"><button id="visitorBack">Back to Guardian Hall</button></div>`,true);
 document.querySelectorAll('[data-audience]').forEach(b=>b.onclick=()=>showHomeAudienceDetail(b.dataset.audience));$('#visitorBack').onclick=()=>guardianHallRouteBack(showHomeBase)
};

// Audience detail refresh while preserving all existing mechanics and handlers.
showHomeAudienceDetail=function(id){
 modalRouteEnter('showHomeAudienceDetail',Array.from(arguments));guardianHallRouteEnter('showHomeAudienceDetail',[id]);ensureHomeBase();
 const h=state.world.homeBase,v=homeAudienceQueue().find(x=>x.id===id);if(!v)return showHomeVisitors();const age=Math.max(0,state.world.day-v.arrivedDay);
 let buttons='';
 if(v.authorityClaim)buttons=SOSText("hall_life_visitors_diplomacy.showHomeAudienceDetail.002");
 else if(v.endorsementRequest){const es=guardianEndorsementButtonState(v.faction);buttons=SOSText("hall_life_visitors_diplomacy.showHomeAudienceDetail.003",es.disabled?'disabled':'',esc(es.label),esc(es.reason||'Make the private relationship a public political commitment.'))}
 else if(v.sanctuary)buttons=SOSText("hall_life_visitors_diplomacy.showHomeAudienceDetail.004");
 else if(v.political)buttons=SOSText("hall_life_visitors_diplomacy.showHomeAudienceDetail.005");
 else if(v.kind==='petitioner')buttons=SOSText("hall_life_visitors_diplomacy.showHomeAudienceDetail.006",v.cost||18);
 else if(v.kind==='shelter'){const need=Math.max(2,v.size||3),offer=SOSServices.accommodation.provider('shantium','hall',need);buttons=SOSText("hall_life_visitors_diplomacy.showHomeAudienceDetail.007",offer.canOffer?'':'disabled',homeLodgingOfferDetail(need))}
 else buttons=SOSText("hall_life_visitors_diplomacy.showHomeAudienceDetail.008");
 const lodgingNote=v.kind==='shelter'?homeLodgingNoteHTML(Math.max(2,v.size||3)):'';
 overlay(`<h2>${esc(v.name)}</h2>
   <div class="audience-detail-card"><span class="audience-type-badge">${homeAudienceTypeLabel(v)}</span>
     <div class="audience-detail-meta"><span>Arrived Day ${v.arrivedDay}</span><span>Waiting ${age} day${age===1?'':'s'}</span><span>Expected departure after Day ${v.expiresDay}</span></div>
     <b>Why they are here</b><p>${esc(homeAudienceShortPurpose(v))}</p>
     <details><summary>Full message / circumstances</summary><p>${esc(v.text)}</p></details>
     ${lodgingNote}${v.hallConnection?`<div class="hall-life-connection">${esc(v.hallConnection)}</div>`:''}
   </div>
   <h3>How will the Guardian respond?</h3>
   <div class="audience-decision-grid">${buttons}<button id="audDecline"><b>Decline Politely</b><small>End the visit without further involvement.</small></button></div>
   <div class="dialog-footer"><button id="audDetailBack">Back to Audiences</button></div>`,true);
 if($('#audMeet'))$('#audMeet').onclick=()=>homeAudienceResult(v,'meet');
 if($('#audCordial'))$('#audCordial').onclick=()=>homeAudienceResult(v,'cordial');
 if($('#audInformal'))$('#audInformal').onclick=()=>homeAudienceResult(v,'informal');
 if($('#audAid'))$('#audAid').onclick=()=>homeAudienceResult(v,'aid');
 if($('#audRefer'))$('#audRefer').onclick=()=>homeAudienceResult(v,'refer');
 if($('#audShelter'))$('#audShelter').onclick=()=>homeAudienceResult(v,'shelter');
 if($('#audDinner'))$('#audDinner').onclick=()=>homeDiplomaticDinner(v.id);
 if($('#audEndorse'))$('#audEndorse').onclick=()=>homeAcceptEndorsementRequest(v.id);
 if($('#audHallIndependent'))$('#audHallIndependent').onclick=()=>homeResolveAutonomyAudience(v.id,'independent');
 if($('#audLimitedAccess'))$('#audLimitedAccess').onclick=()=>homeResolveAutonomyAudience(v.id,'limited');
 if($('#audSanctuary'))$('#audSanctuary').onclick=()=>homeResolveSanctuaryAudience(v.id,'protect');
 if($('#audNeutralTransfer'))$('#audNeutralTransfer').onclick=()=>homeResolveSanctuaryAudience(v.id,'transfer');
 if($('#audTurnAway'))$('#audTurnAway').onclick=()=>homeResolveSanctuaryAudience(v.id,'turnaway');
 $('#audDecline').onclick=()=>homeAudienceResult(v,'decline');$('#audDetailBack').onclick=()=>guardianHallRouteBack(showHomeVisitors)
};
