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
 if(v.kind==='veteran')return'VETERAN CALL';
 if(v.kind==='scholar')return'SCHOLARLY CALL';
 if(v.kind==='healer')return'HEALER / RELIEF CALL';
 if(v.kind==='courier')return'COURIER BRIEFING';
 if(v.kind==='caravan_master')return'CARAVAN AFFAIRS';
 if(v.kind==='civic_delegate')return'CIVIC DELEGATION';
 if(v.kind==='grateful_family')return'PERSONAL THANKS';
 if(v.kind==='witness')return'SECURITY WITNESS';
 if(v.returning)return'RETURNING VISITOR';
 return'SOCIAL CALL'
}
function homeAudienceShortPurpose(v){
 if(v.authorityClaim)return'A political authority is testing the Hall’s independence and jurisdiction.';
 if(v.endorsementRequest)return'They want the Guardian to turn a private relationship into a public political commitment.';
 if(v.sanctuary)return'A traveler is asking the Hall for protection from an outside authority.';
 if(v.political)return'They came to discuss political relations and possible cooperation.';
 if(v.kind==='petitioner')return'They are asking the Guardian Hall for practical help.';
 if(v.kind==='shelter')return'They need temporary lodging and assistance.';
 if(v.purpose)return v.purpose;
 return'They came to call on the Guardian without a formal demand.'
}

// Dining / Gathering interface refresh.
showHomeDining=function(){
 modalRouteEnter('showHomeDining',Array.from(arguments));guardianHallRouteEnter('showHomeDining',[]);ensureHomeBase();
 const h=state.world.homeBase,H=h.hospitality,g=H.guest,arrived=homeGatheringArrived(),pending=homeGatheringPending(),
       activeInv=homeGatheringInvitees().filter(x=>['sent','traveling','arrived'].includes(x.status)),
       activeIds=new Set(activeInv.map(x=>x.targetId)),
       formalToday=homeFormalDinnerInvitees(state.world.day),cands=homeKnownGuestCandidates().filter(c=>c.canInvite&&!activeIds.has(c.id)&&(!g||g.id!==c.id)).slice(0,16),
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
     <button id="formalGuest"><b>Formal Dinner with ${esc(g.name)}</b><small>Receive your guest with greater ceremony in the formal dining room.</small></button>`:''}
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
 document.querySelectorAll('[data-formaldinner]').forEach(b=>b.onclick=()=>homeHostQueuedFormalDinner(b.dataset.formaldinner));document.querySelectorAll('[data-gatherinvite]').forEach(b=>b.onclick=()=>homeSendGatheringInvitation(b.dataset.gatherinvite));
 document.querySelectorAll('[data-cancelgather]').forEach(b=>b.onclick=()=>homeCancelGatheringInvitation(b.dataset.cancelgather));
 document.querySelectorAll('[data-dininggroupinfo]').forEach(b=>b.onclick=()=>showHomeGuestGroupInfo(b.dataset.dininggroupinfo));
 $('#diningHistory').onclick=showHomeDiningHistory;$('#diningBack').onclick=()=>guardianHallRouteBack(showHomeBase)
};

// Visitors list refresh.
showHomeVisitors=function(){
 modalRouteEnter('showHomeVisitors',Array.from(arguments));guardianHallRouteEnter('showHomeVisitors',[]);ensureHomeBase();
 const A=state.world.homeBase.audiences,q=A.queue,recent=A.history.slice(-8).reverse();
 const rows=q.map(v=>{homeAudienceProfileDefaults(v);const waiting=Math.max(0,state.world.day-v.arrivedDay);return `<div class="audience-row"><div><span class="audience-type-badge">${homeAudienceTypeLabel(v)}</span><b>${esc(v.name)}</b><small>${esc(homeAudienceShortPurpose(v))}<br>${esc(v.urgency)} urgency • ${esc(v.importance)} matter${v.returning?' • recognized returning caller':''}<br>Waiting ${waiting} day${waiting===1?'':'s'} • expected to leave after Day ${v.expiresDay}</small>${v.hallConnection?`<div class="hall-life-connection">${esc(v.hallConnection)}</div>`:''}</div><div class="audience-row-actions"><button data-audience="${v.id}">Receive Visitor</button></div></div>`}).join('')||'<div class="notice muted">Nobody is currently waiting for the Guardian.</div>';
 const history=recent.map(r=>`<div class="card compact"><b>Day ${r.day}</b> — ${esc(r.text)}</div>`).join('')||'<p class="muted">No audience record yet.</p>';
 overlay(`<h2>Guardian Hall — Audiences & Visitors</h2><p>People arrive at the Hall for different reasons. Review who is waiting, why they came, and decide how much of the Hall’s time or authority to give them.</p>
   <div class="hall-social-dashboard">
     <div><small>Waiting</small><b>${q.length}</b><span>currently at the Hall</span></div>
     <div><small>Audiences Concluded</small><b>${A.totalResolved}</b><span>all recorded visits</span></div>
     <div><small>Hall Relationships</small><b>${A.contacts.length}</b><span>${A.totalReturning||0} returning visit${(A.totalReturning||0)===1?'':'s'} • ${A.totalSocial} social audience${A.totalSocial===1?'':'s'}</span></div>
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
 else buttons=homeAudienceConversationButtons(v)||SOSText("hall_life_visitors_diplomacy.showHomeAudienceDetail.008");
 const lodgingNote=v.kind==='shelter'?homeLodgingNoteHTML(Math.max(2,v.size||3)):'';
 overlay(`<h2>${esc(v.name)}</h2>
   <div class="audience-detail-card"><span class="audience-type-badge">${homeAudienceTypeLabel(v)}</span>
     <div class="audience-detail-meta"><span>Arrived Day ${v.arrivedDay}</span><span>Waiting ${age} day${age===1?'':'s'}</span><span>Expected departure after Day ${v.expiresDay}</span></div>
     <div class="audience-detail-meta"><span><b>Origin:</b> ${esc(v.origin||'Unknown')}</span><span><b>Urgency:</b> ${esc(v.urgency||'Routine')}</span><span><b>Importance:</b> ${esc(v.importance||'Local')}</span><span><b>Trust:</b> ${esc(v.trust||'Unverified')}</span>${v.returning?`<span><b>Prior visits:</b> ${v.priorVisits||1}</span><span><b>Hall relationship:</b> ${v.relationship>=4?'Strong':v.relationship>=2?'Established':'Familiar'}</span>`:''}</div>
     <b>Why they are here</b><p>${esc(homeAudienceShortPurpose(v))}</p>
     <div class="notice compact"><b>The audience begins</b><br>${esc(homeAudienceSceneProfile(v).hook)}</div>
     <details><summary>Full message / circumstances</summary><p>${esc(v.text)}</p></details>
     ${lodgingNote}${v.hallConnection?`<div class="hall-life-connection">${esc(v.hallConnection)}</div>`:''}
   </div>
   <h3>How will the Guardian respond?</h3>
   <div class="audience-decision-grid">${buttons}<button id="audDecline"><b>Decline Politely</b><small>End the visit without further involvement.</small></button></div>
   <div class="dialog-footer"><button id="audDetailBack">Back to Audiences</button></div>`,true);
 if($('#audMeet'))$('#audMeet').onclick=()=>homeAudienceResult(v,'meet');
 if($('#audDetails'))$('#audDetails').onclick=()=>homeAudienceResult(v,'details');
 if($('#audCounsel'))$('#audCounsel').onclick=()=>homeAudienceResult(v,'counsel');
 if($('#audStewardFollow'))$('#audStewardFollow').onclick=()=>homeAudienceResult(v,'steward_follow');
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

/* v1.6.66.10.7 — Hall audiences, hospitality, and evening dining */
function homeEnsureInformalDiningState(){
 ensureHomeBase();const H=state.world.homeBase.hospitality;
 if(!Array.isArray(H.informalDinnerInvites))H.informalDinnerInvites=[];
 if(!Array.isArray(H.informalDinnerHistory))H.informalDinnerHistory=[];
 if(!Array.isArray(H.formalDinnerInvites))H.formalDinnerInvites=[];
 if(H.lastAutomaticInformalDinnerDay==null)H.lastAutomaticInformalDinnerDay=-99;
 return H
}
function homeVisitorHash(v){let n=0;for(const ch of String(v?.id||v?.name||'visitor'))n=(n*31+ch.charCodeAt(0))>>>0;return n}
function homeVisitorHospitalityProfile(v){
 const h=homeVisitorHash(v),wait=Math.max(0,state.world.day-(v.arrivedDay||state.world.day)),road=['stranger','veteran','scholar','healer','courier','caravan_master','witness','known_group','known_contact'].includes(v.kind);
 return{hungry:wait>0||road||(h%5<2),tired:wait>1||(road&&h%4===0),sociable:v.kind!=='witness'||h%3!==0}
}
function homeHallContactCultivate(v,amount=1,memory=''){ 
 if(!v||v.political||v.kind==='shelter'||v.kind==='petitioner')return null;ensureHomeBase();const A=state.world.homeBase.audiences,key=homeAudienceContactKey(v);let c=A.contacts.find(x=>x.key===key);
 if(!c){c={key,name:v.name,kind:v.kind,origin:v.origin||'Shantium region',originId:v.originId||null,subjectId:v.subjectId||null,goodId:v.goodId||null,faction:v.contextFaction||null,firstVisitDay:v.arrivedDay??state.world.day,lastVisitDay:state.world.day,visits:0,relationship:0,memories:[]};A.contacts.push(c)}
 c.lastVisitDay=state.world.day;c.visits=Math.max(1,c.visits||0);c.relationship=clamp((c.relationship||0)+amount,0,10);c.lastPurpose=v.purpose||c.lastPurpose||null;if(memory){c.memories=c.memories||[];c.memories.push({day:state.world.day,text:memory});c.memories=c.memories.slice(-12)}
 if(v.recordId){const r=state.world.travelerRegistry?.records?.[v.recordId];if(r){r.familiarity=Math.min(12,(r.familiarity||0)+amount);r.lastContactDay=state.world.day;r.history=r.history||[];r.history.push({day:state.world.day,event:'guardian_hall_contact',detail:memory||'Received personally at Guardian Hall.',region:'shantium'});r.history=r.history.slice(-20)}}
 if(v.companionId){const w=state.world.companions?.[v.companionId];if(w)w.disposition=clamp((w.disposition||0)+amount,-6,6)}
 A.contacts=A.contacts.sort((a,b)=>(b.lastVisitDay||0)-(a.lastVisitDay||0)).slice(0,40);return c
}
function homeVisitorThanksReply(v){
 const pools={merchant:['“Glad it was useful. I would want the Hall to know before the road gets worse.”','“Of course. Good information does no one any good if it stays on the road.”'],courier:['“You’re welcome, Guardian. I thought the circumstances mattered as much as the message.”','“Of course. I am glad I stopped long enough to explain it.”'],veteran:['“Think nothing of it. Better you hear it plainly than hear a polished version later.”','“You’re welcome. Someone ought to say these things while they can still be acted on.”'],scholar:['“I’m glad it was of use. Facts improve when people are willing to compare them.”','“You’re very welcome. Thank you for hearing the whole account.”'],healer:['“Of course. If it helps someone before matters worsen, the trip was worthwhile.”','“You’re welcome. Thank you for taking it seriously.”'],witness:['“Thank you for listening. I was not certain anyone would.”','“You’re welcome. I feel better having put it in the Hall’s hands.”']};
 return pick(pools[v.kind]||['“You’re very welcome, Guardian. Thank you for hearing me out.”','“Of course. I’m glad I could bring it to you directly.”','“Think nothing of it. I thought you should know.”','“The thanks are appreciated. Safe to say I’m glad I came.”'])
}
function homeVisitorFinish(v,text,tone='good'){
 const A=state.world.homeBase.audiences;homeHallContactCultivate(v,1,`The Guardian received ${v.name} personally and ended the visit courteously.`);A.queue=A.queue.filter(x=>x.id!==v.id);A.totalResolved++;homeAudienceHistory(`${v.name}: ${text}`,tone);recordWorldHistory(`${v.name} concluded a personal audience at Guardian Hall. ${text}`,tone,'home');save();actionResult('Audience Concluded',text,tone,showHomeVisitors)
}
function homeVisitorFormalDinnerSuitable(v){
 const k=String(v?.kind||'').toLowerCase(),p=String(v?.purpose||'').toLowerCase();
 if(['diplomat','envoy','noble','official','faction_representative','representative','leader'].includes(k))return true;
 if(v?.political&&/envoy|delegate|representative|leader|official|diplomat|minister|ambassador/.test(`${v.name||''} ${p}`.toLowerCase()))return true;
 return /ambassador|envoy|diplomat|minister|governor|mayor|chieftain|commander|representative|delegation/.test(`${v?.name||''} ${p}`.toLowerCase())
}
function homeQueueFormalDinnerVisitor(v){
 const H=homeEnsureInformalDiningState(),key=homeAudienceContactKey(v),old=H.formalDinnerInvites.find(x=>x.day===state.world.day&&x.contactKey===key);if(old)return old;
 const accepted=chance(.88),row={id:'formal_'+uid(),day:state.world.day,name:v.name,kind:v.kind,contactKey:key,recordId:v.recordId||null,companionId:v.companionId||null,accepted,status:accepted?'accepted':'declined'};H.formalDinnerInvites.push(row);H.formalDinnerInvites=H.formalDinnerInvites.slice(-40);return row
}
function homeQueueInformalDinnerVisitor(v){
 const H=homeEnsureInformalDiningState(),existing=H.informalDinnerInvites.find(x=>x.day===state.world.day&&x.contactKey===homeAudienceContactKey(v));if(existing)return existing;
 const p=homeVisitorHospitalityProfile(v),accepted=p.sociable?chance(.90):chance(.68),row={id:'dinner_'+uid(),day:state.world.day,name:v.name,kind:v.kind,contactKey:homeAudienceContactKey(v),recordId:v.recordId||null,companionId:v.companionId||null,accepted,status:accepted?'accepted':'declined',sourceAudienceId:v.id};H.informalDinnerInvites.push(row);H.informalDinnerInvites=H.informalDinnerInvites.slice(-60);return row
}
function homeVisitorHospitalityFinish(v,kind){
 ensureHomeBase();const h=state.world.homeBase,H=homeEnsureInformalDiningState(),L=h.logistics,p=homeVisitorHospitalityProfile(v),reply=homeVisitorThanksReply(v);let text=`You thank ${v.name} for taking the time to speak with you. ${reply} `,gain=1;
 if(kind==='refreshments'){
  if((L.supplies?.hospitality||0)<1)return actionResult('Hospitality Stores Low','The Hall cannot comfortably offer additional refreshments right now.','info',()=>homeAudienceConversationClosing(v));L.supplies.hospitality--;gain++;text+=pick([`${v.name} accepts a drink and something small from the Hall kitchens before departing.`,`The attendants bring refreshments, and the conversation eases into a few quieter minutes before ${v.name} takes their leave.`]);homeHospitalityReport(`${v.name} was offered refreshments after a personal audience.`,'good')
 }else if(kind==='dinner'){
  const inv=homeQueueInformalDinnerVisitor(v);if(inv.accepted){gain++;text+=pick([`${v.name} accepts the invitation and says they would be glad to join the Hall for supper.`,`The invitation is accepted. ${v.name} says they would be pleased to stay for the Hall’s informal supper.`])}else text+=`${v.name} politely declines dinner, explaining that they need to be on their way.`
 }else if(kind==='formal'){
  const inv=homeQueueFormalDinnerVisitor(v);if(inv.accepted){gain+=2;text+=`${v.name} accepts. The Steward will have the formal dining room prepared for this evening.`}else text+=`${v.name} thanks you for the invitation but asks to keep the evening simple.`
 }else if(kind==='lodging'){
  const admit=homeAdmitTemporaryLodging(v.name,1,`audience:${v.id}`);if(!admit.ok)return actionResult('No Guest Room Available',admit.reason==='beds'?'The Hall has no suitable guest bed free tonight.':'The Hall cannot comfortably provision another overnight guest tonight.','info',()=>homeAudienceConversationClosing(v));const row=(H.temporaryLodging||[]).find(x=>x.sourceId===`audience:${v.id}`);if(row)row.expiresDay=state.world.day+1;gain+=2;text+=`${v.name} gratefully accepts a room for the night. The Steward has them shown to the guest accommodations.`;homeHospitalityReport(`${v.name} accepted overnight lodging after a personal audience.`,'good')
 }else text+=pick([`You wish ${v.name} safe travels, and the two of you part on warm terms.`,`You exchange a final courtesy and ${v.name} takes their leave of the audience chamber.`,`You tell ${v.name} the Hall’s door will be open should they have reason to call again.`]);
 homeHallContactCultivate(v,gain,kind==='formal'?`${v.name} accepted an invitation to formal dinner at Guardian Hall.`:kind==='dinner'?`${v.name} was invited to an informal dinner at Guardian Hall.`:kind==='lodging'?`${v.name} was offered and accepted lodging at Guardian Hall.`:kind==='refreshments'?`${v.name} shared refreshments at Guardian Hall.`:`${v.name} was thanked personally for information brought to the Hall.`);homeVisitorFinish(v,text,'good')
}
function homeAudienceConversationClosing(v,lead=''){
 const p=homeVisitorHospitalityProfile(v),h=state.world.homeBase,H=homeEnsureInformalDiningState(),alreadyDinner=H.informalDinnerInvites.some(x=>x.day===state.world.day&&x.contactKey===homeAudienceContactKey(v)),lodging=homeLodgingCapacitySnapshot(1),refresh=(h.logistics.supplies?.hospitality||0)>0;
 const formal=homeVisitorFormalDinnerSuitable(v),alreadyFormal=H.formalDinnerInvites.some(x=>x.day===state.world.day&&x.contactKey===homeAudienceContactKey(v)&&x.status==='accepted');
 overlay(`<h2>Concluding the Audience</h2>${lead?`<div class="notice compact">${esc(lead)}</div>`:''}<p>You thank ${esc(v.name)} for coming to you with the matter.</p><p>${esc(homeVisitorThanksReply(v))}</p><h3>Before they leave</h3><div class="audience-decision-grid">${refresh?`<button id="audHostRefresh"><b>Offer Refreshments</b><small>Offer a drink and something from the kitchen.</small></button>`:''}${formal&&!alreadyFormal?`<button id="audHostFormal"><b>Invite Them to Formal Dinner</b><small>Ask them to be your guest in the formal dining room this evening.</small></button>`:!alreadyDinner&&(p.hungry||p.sociable)?`<button id="audHostDinner"><b>Invite Them to Supper</b><small>Offer them a place at the Hall’s table this evening.</small></button>`:''}${p.tired&&lodging.canFit?`<button id="audHostLodging"><b>Offer Lodging for the Night</b><small>Offer them a guest room before they return to the road.</small></button>`:''}<button id="audHostFarewell"><b>Wish Them Well</b><small>Thank them again and bid them a safe journey.</small></button></div>`,true);
 if($('#audHostRefresh'))$('#audHostRefresh').onclick=()=>homeVisitorHospitalityFinish(v,'refreshments');if($('#audHostFormal'))$('#audHostFormal').onclick=()=>homeVisitorHospitalityFinish(v,'formal');if($('#audHostDinner'))$('#audHostDinner').onclick=()=>homeVisitorHospitalityFinish(v,'dinner');if($('#audHostLodging'))$('#audHostLodging').onclick=()=>homeVisitorHospitalityFinish(v,'lodging');$('#audHostFarewell').onclick=()=>homeVisitorHospitalityFinish(v,'farewell')
}
function homeAudienceConversationalResolve(v,action){
 const result=homeAudienceConversationResult(v,action);if(!result)return homeAudienceResult(v,action);homeHallContactCultivate(v,1,`The Guardian listened carefully to ${v.name}'s account at Guardian Hall.`);save();homeAudienceConversationClosing(v,result.text)
}
function homeInformalDinnerInvitees(day=state.world.day){return homeEnsureInformalDiningState().informalDinnerInvites.filter(x=>x.day===day&&x.status==='accepted'&&!x.servedDay)}
function homeInformalDinnerStaffNames(){
 ensureHomeBase();const h=state.world.homeBase,rows=[];if(h.staff?.steward&&chance(.42))rows.push(h.staff.steward.name);if((h.staff?.cooks||0)>0&&chance(.18))rows.push('an off-duty kitchen worker');if((h.staff?.attendants||0)>0&&chance(.22))rows.push('an off-duty Hall attendant');if((h.staff?.medical||0)>0&&chance(.18))rows.push('an Infirmary worker');if((h.security?.guards||0)>0&&chance(.22))rows.push('an off-duty Hall Guard');return rows.slice(0,3)
}
function homeInformalDinnerPlan(guardianAttends=true,day=state.world.day){
 ensureHomeBase();const h=state.world.homeBase,invites=homeInformalDinnerInvitees(day),companions=homeCompanionsPresentAtHall().filter(()=>chance(.72)),staff=homeInformalDinnerStaffNames(),cm=(typeof caravanMasterActive==='function'&&typeof caravanMaster==='function'&&!caravanMasterActive()&&caravanMaster())?caravanMaster():null,guest=h.hospitality.guest,people=[];
 if(guardianAttends)people.push({name:'The Guardian',kind:'guardian'});for(const m of companions)people.push({name:m.name,kind:'companion',id:m.id});if(cm&&chance(.62))people.push({name:cm.name,kind:'caravan_master'});for(const s of staff)people.push({name:s,kind:'staff'});if(guest)people.push({name:guest.name,kind:'guest',recordId:guest.recordId||null,companionId:guest.companionId||null});for(const x of invites)people.push({name:x.name,kind:'visitor',invite:x,recordId:x.recordId,companionId:x.companionId});
 const normalCap=h.upgrades.diningExpansion?18:homeDiningCapacity(false),expandedCap=homeDiningCapacity(false),room=people.length>normalCap&&h.upgrades.diningExpansion?'Expanded Dining Hall (dressed down for informal supper)':'Dining Hall';return{day,guardianAttends,invites,companions,staff,cm,guest,people,normalCap,expandedCap,room}
}
function homeApplyInformalDinnerRelationships(plan){
 for(const m of plan.companions)if(chance(plan.guardianAttends?.55:.22))SOSServices.companions.adjustTrust(m.id,1);
 for(const x of plan.invites){x.servedDay=state.world.day;x.status='completed';const fake={name:x.name,kind:x.kind,recordId:x.recordId,companionId:x.companionId,contactKey:x.contactKey};homeHallContactCultivate(fake,plan.guardianAttends?2:1,plan.guardianAttends?`${x.name} dined informally with the Guardian at Guardian Hall.`:`${x.name} was hosted at Guardian Hall's informal dinner while the Guardian was elsewhere.`)}
 if(plan.guest){plan.guest.meals=(plan.guest.meals||0)+1;homeHospitalityRelationship(plan.guest,plan.guardianAttends?1:0,plan.guardianAttends?`${plan.guest.name} shared an informal Hall dinner with the Guardian.`:`${plan.guest.name} joined the Hall's informal dinner.`)}
}
function homeResolveInformalDinner(guardianAttends=true,automatic=false,day=state.world.day){
 ensureHomeBase();const h=state.world.homeBase,H=homeEnsureInformalDiningState(),plan=homeInformalDinnerPlan(guardianAttends,day);if(!plan.invites.length&&!guardianAttends&&automatic)return false;
 if(plan.people.length>plan.expandedCap){homeHospitalityReport(`The informal supper exceeded comfortable dining capacity; ordinary staff remained in the staff cafeteria and the Steward staggered seating.`,'info');plan.people=plan.people.slice(0,plan.expandedCap)}
 const food=Math.max(2,Math.ceil(plan.people.length/5)),host=Math.max(1,Math.ceil(plan.invites.length/3));if((h.logistics.supplies?.food||0)<food||(h.logistics.supplies?.hospitality||0)<host){homeHospitalityReport(`Informal dinner invitations could not be fully honored because Hall stores were too low.`,'bad');for(const x of plan.invites){x.servedDay=state.world.day;x.status='missed'}return false}
 h.logistics.supplies.food-=food;h.logistics.supplies.hospitality-=host;homeApplyInformalDinnerRelationships(plan);H.lastMealDay=state.world.day;H.lastCompanyMealDay=state.world.day;H.lastAutomaticInformalDinnerDay=automatic?state.world.day:H.lastAutomaticInformalDinnerDay;
 const names=plan.people.map(x=>x.name),detail=`${plan.room}. ${guardianAttends?'The Guardian attended.':'The Guardian did not attend.'} At table: ${names.join(', ')}. Most Hall staff ate in the large staff cafeteria as usual.`;homeDiningEventReport('Informal Dinner at Guardian Hall','informal',plan.people.length,food,host,detail);H.informalDinnerHistory.push({day:state.world.day,guardianAttends,room:plan.room,names});H.informalDinnerHistory=H.informalDinnerHistory.slice(-30);recordWorldHistory(`Guardian Hall held an informal dinner for ${plan.people.length} people${guardianAttends?', attended by the Guardian':''}.`,'good','home');return plan
}
function homeDineInformally(){
 ensureHomeBase();const H=homeEnsureInformalDiningState();if(H.informalDinnerHistory.some(x=>x.day===state.world.day))return actionResult('Dinner Already Held','Guardian Hall has already held its informal dinner today.','info',showHomeDining);const plan=homeResolveInformalDinner(true,false,state.world.day);if(!plan)return actionResult('Dinner Could Not Be Served','Hall stores are too low to comfortably serve the planned table.','bad',showHomeDining);const guestNames=plan.invites.map(x=>x.name);save();const attendees=plan.people.map(x=>x.name).join(', ');actionResult('Informal Dinner at Guardian Hall',`${plan.room}.\n\n**At the table:** ${attendees}.\n\nOff-duty staff come and go from the table, while most of the household takes supper in the staff cafeteria.`,'good',showHomeDining)
}
function homeFormalDinnerInvitees(day=state.world.day){return homeEnsureInformalDiningState().formalDinnerInvites.filter(x=>x.day===day&&x.status==='accepted'&&!x.servedDay)}
function homeHostQueuedFormalDinner(id){
 ensureHomeBase();const h=state.world.homeBase,H=homeEnsureInformalDiningState(),inv=H.formalDinnerInvites.find(x=>x.id===id&&x.status==='accepted'&&!x.servedDay);if(!inv)return showHomeDining();
 const party=homeCompanionsPresentAtHall().filter(()=>chance(.45)).slice(0,4),people=[{name:'The Guardian'},...party.map(x=>({name:x.name,id:x.id})),{name:inv.name}],cap=homeDiningCapacity(true),food=Math.max(3,Math.ceil(people.length/3)),host=4;
 if(people.length>cap)return actionResult('Formal Dining Room Full',`The Steward cannot seat the planned company comfortably in the formal dining room.`,'info',showHomeDining);
 if((h.logistics.supplies?.food||0)<food||(h.logistics.supplies?.hospitality||0)<host)return actionResult('Dinner Cannot Be Prepared','The kitchens do not have enough provisions to do the occasion justice.','info',showHomeDining);
 /* The ordinary Hall supper is a separate household meal. If it has not happened yet, it proceeds without the Guardian. */
 const informalDone=H.informalDinnerHistory.some(x=>x.day===state.world.day);if(!informalDone)homeResolveInformalDinner(false,true,state.world.day);
 h.logistics.supplies.food-=food;h.logistics.supplies.hospitality-=host;inv.servedDay=state.world.day;inv.status='completed';for(const m of party)if(chance(.5))SOSServices.companions.adjustTrust(m.id,1);const fake={name:inv.name,kind:inv.kind,recordId:inv.recordId,companionId:inv.companionId,contactKey:inv.contactKey};homeHallContactCultivate(fake,3,`${inv.name} was the Guardian's guest at a formal dinner in Guardian Hall.`);H.lastFormalDinnerDay=state.world.day;
 const names=people.map(x=>x.name);homeDiningEventReport(`Formal Dinner for ${inv.name}`,'formal',people.length,food,host,`Formal Dining Room. At table: ${names.join(', ')}. The ordinary Hall supper was served separately.`);recordWorldHistory(`The Guardian hosted ${inv.name} at a formal dinner in Guardian Hall.`,'good','home');save();actionResult(`Formal Dinner with ${inv.name}`,`The formal dining room is prepared for the occasion.\n\n**At the table:** ${names.join(', ')}.\n\nElsewhere in the Hall, the ordinary evening supper carries on as usual.`,'good',showHomeDining)
}
function homeInformalDinnerDailyTick(){
 if(!isOpenWorld())return;ensureHomeBase();const H=homeEnsureInformalDiningState(),days=[...new Set(H.informalDinnerInvites.filter(x=>x.status==='accepted'&&!x.servedDay&&x.day<state.world.day).map(x=>x.day))];for(const d of days){const guardianHere=state.world.location==='shantium';homeResolveInformalDinner(false,true,d);if(guardianHere)homeHospitalityReport(`While the Guardian was in Shantium, the Hall household held its evening meal without requiring the Guardian to attend. Party members, the Caravan Master, staff, and invited visitors could join as available.`,'info')}
 H.informalDinnerInvites=H.informalDinnerInvites.filter(x=>state.world.day-x.day<=14)
}
const __v1666106HospitalityTick=homeHospitalityTick;
homeHospitalityTick=function(){const r=__v1666106HospitalityTick();homeInformalDinnerDailyTick();return r};
const __v1666106AudienceRemember=homeAudienceRememberVisitor;
homeAudienceRememberVisitor=function(v,positive=true){__v1666106AudienceRemember(v,positive);if(positive&&v&&!v.political&&!['shelter','petitioner'].includes(v.kind))homeHallContactCultivate(v,0,'A personal audience at Guardian Hall established an ongoing contact.')};

showHomeDining=function(){
 modalRouteEnter('showHomeDining',Array.from(arguments));guardianHallRouteEnter('showHomeDining',[]);ensureHomeBase();const h=state.world.homeBase,H=homeEnsureInformalDiningState(),today=H.informalDinnerInvites.filter(x=>x.day===state.world.day&&x.status==='accepted'&&!x.servedDay),plan=homeInformalDinnerPlan(true,state.world.day),g=H.guest,arrived=homeGatheringArrived(),activeInv=homeGatheringInvitees().filter(x=>['sent','traveling','arrived'].includes(x.status)),activeIds=new Set(activeInv.map(x=>x.targetId)),formalToday=homeFormalDinnerInvitees(state.world.day),cands=homeKnownGuestCandidates().filter(c=>c.canInvite&&!activeIds.has(c.id)&&(!g||g.id!==c.id)).slice(0,16);
 if(formalToday.length&&plan.room.includes('Expanded'))plan.room='Dining Hall';
 const queued=today.map(x=>`<div class="card compact"><b>${esc(x.name)}</b><br><small>Expected at supper this evening.</small></div>`).join('')||'<p class="muted">No visitors have accepted an invitation to supper tonight.</p>';
 const formalList=formalToday.map(x=>`<div class="card compact"><b>${esc(x.name)}</b><br><small>Expected in the formal dining room this evening.</small><br><button data-formaldinner="${x.id}">Attend Formal Dinner</button></div>`).join('');
 const roomNote=plan.room.includes('Expanded')&&formalToday.length===0?`<div class="notice compact"><b>Tonight’s room:</b> ${esc(plan.room)}. The formal space is being set simply for the larger informal crowd.</div>`:'';
 const activeHTML=activeInv.map(inv=>`<div class="gathering-invite-row"><div><b>${esc(inv.name)}</b><small>${inv.status==='sent'?`Invitation sent • reply expected after Day ${inv.responseDay}`:inv.status==='traveling'?`Accepted • traveling from ${esc(worldLocation(inv.origin).name)} • expected around Day ${inv.arrivalDay}`:'Present in Shantium and ready for the gathering'}</small></div><div class="gathering-invite-actions">${inv.recordId?`<button data-dininggroupinfo="${inv.recordId}">View Group</button>`:''}<button data-cancelgather="${inv.id}">Withdraw</button></div></div>`).join('')||'<p class="muted">No deliberate gathering invitations are active.</p>';
 const candidates=activeInv.length<3?cands.map(c=>`<div class="gathering-invite-row"><div><b>${esc(c.name)}</b><small>${c.size} guest${c.size===1?'':'s'} • ${esc(c.detail||'Known contact')}</small></div><div class="gathering-invite-actions">${c.recordId?`<button data-dininggroupinfo="${c.recordId}">View Group</button>`:''}<button data-gatherinvite="${c.id}" ${c.size>homeDiningCapacity(false)?'disabled':''}>Invite</button></div></div>`).join('')||'<p class="muted">No additional known contacts currently have usable whereabouts.</p>':'<div class="notice compact">Three gathering invitations are already active.</div>';
 overlay(`<h2>Guardian Hall — Dining & Gatherings</h2><p>Evening meals at Guardian Hall range from the ordinary household supper to formal dinners and larger gatherings.</p><div class="hall-social-dashboard"><div><small>Informal Capacity</small><b>${homeDiningCapacity(false)} seats</b><span>${h.upgrades.diningExpansion?'Expanded Dining Hall available for dressed-down overflow':'Dining Hall'}</span></div><div><small>Guests Expected for Supper</small><b>${today.length}</b><span>expected this evening</span></div><div><small>Hall Stores</small><b>${h.logistics.supplies?.food||0} food / ${h.logistics.supplies?.hospitality||0} hospitality</b><span>Most employees normally eat in the staff cafeteria</span></div></div>${roomNote}<div class="dining-section"><h3>Tonight’s Informal Dinner</h3><p class="compact muted">The evening table is open to the Hall household, invited guests, and off-duty staff who care to join. Most staff take their meals in the staff cafeteria.</p>${queued}<div class="dining-primary-actions"><button id="dineInformally" ${H.informalDinnerHistory.some(x=>x.day===state.world.day)?'disabled':''}><b>${H.informalDinnerHistory.some(x=>x.day===state.world.day)?'Informal Dinner Already Held':'Dine Informally'}</b><small>Take your place at the Hall’s evening table.</small></button>${g?`<button id="formalGuest"><b>Formal Dinner with ${esc(g.name)}</b><small>Host the current resident guest as a deliberately formal occasion.</small></button>`:''}</div></div>${formalList?`<div class="dining-section"><h3>Formal Dinner Tonight</h3><p class="compact muted">The formal dining room is reserved for a distinguished guest. The ordinary Hall supper will be served separately.</p>${formalList}</div>`:''}<div class="dining-section"><h3>Deliberate Gatherings</h3><p class="compact muted">For occasions that call for more than the ordinary evening meal.</p><div class="dining-primary-actions"><button id="hostGathering" ${arrived.length||g?'':'disabled'}><b>Hall Gathering</b><small>Informal event for contacts who have deliberately come to gather.</small></button><button id="hostFormalGathering" ${arrived.length||g?'':'disabled'}><b>Formal Gathering</b><small>A smaller, deliberate formal occasion.</small></button>${h.upgrades.banquetFacilities?`<button id="hostBanquet" ${arrived.length||g?'':'disabled'}><b>Major Banquet</b><small>Receive a large company with the full resources of the Hall.</small></button>`:''}</div><h4>Gathering Invitations</h4>${activeHTML}<h4>Invite Known Contacts</h4>${candidates}</div><div class="dining-section"><h3>About Hall Dining</h3><p class="compact">When the ordinary dining room grows crowded, the Expanded Dining Hall can be set more simply for supper. Off-duty staff are welcome at the common table; most employees usually eat in the staff cafeteria.</p></div><div class="dialog-toolbar"><button id="diningHistory">Dining & Gathering Record (${H.diningHistory.length})</button></div><div class="dialog-footer"><button id="diningBack">Back to Guardian Hall</button></div>`,true);
 if($('#dineInformally'))$('#dineInformally').onclick=homeDineInformally;if($('#formalGuest'))$('#formalGuest').onclick=()=>homeInviteMeal(true);if($('#hostGathering'))$('#hostGathering').onclick=()=>homeHostGathering(false,false);if($('#hostFormalGathering'))$('#hostFormalGathering').onclick=()=>homeHostGathering(true,false);if($('#hostBanquet'))$('#hostBanquet').onclick=()=>homeHostGathering(false,true);document.querySelectorAll('[data-formaldinner]').forEach(b=>b.onclick=()=>homeHostQueuedFormalDinner(b.dataset.formaldinner));document.querySelectorAll('[data-gatherinvite]').forEach(b=>b.onclick=()=>homeSendGatheringInvitation(b.dataset.gatherinvite));document.querySelectorAll('[data-cancelgather]').forEach(b=>b.onclick=()=>homeCancelGatheringInvitation(b.dataset.cancelgather));document.querySelectorAll('[data-dininggroupinfo]').forEach(b=>b.onclick=()=>showHomeGuestGroupInfo(b.dataset.dininggroupinfo));$('#diningHistory').onclick=showHomeDiningHistory;$('#diningBack').onclick=()=>guardianHallRouteBack(showHomeBase)
};

const __v1666106AudienceDetail=showHomeAudienceDetail;
showHomeAudienceDetail=function(id){
 __v1666106AudienceDetail(id);const v=homeAudienceQueue().find(x=>x.id===id);if(!v)return;
 if($('#audDetails'))$('#audDetails').onclick=()=>homeAudienceConversationalResolve(v,'details');if($('#audCounsel'))$('#audCounsel').onclick=()=>homeAudienceConversationalResolve(v,'counsel');if($('#audStewardFollow'))$('#audStewardFollow').onclick=()=>homeAudienceConversationalResolve(v,'steward_follow')
};
