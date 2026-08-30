// v1.6.23 — Guest Quarters / Hospitality presentation refresh
showHomeGuestQuarters=function(){
 modalRouteEnter('showHomeGuestQuarters',Array.from(arguments));
 guardianHallRouteEnter('showHomeGuestQuarters',[]);
 ensureHomeBase();
 const h=state.world.homeBase,H=h.hospitality,g=H.guest,cands=homeKnownGuestCandidates(),active=homeActiveInvitation(),
       recent=H.invitations.slice(-6).reverse(),beds=homeLodgingCapacitySnapshot(),temporary=homeTemporaryLodgings();
 const chips=`<div class="hospitality-status">
   <span class="hospitality-chip">🛏 <b>${beds.available}</b> guest bed${beds.available===1?'':'s'} open</span>
   <span class="hospitality-chip">☕ <b>${H.refreshments}</b> refreshment${H.refreshments===1?'':'s'} prepared</span>
   <span class="hospitality-chip">◈ Hospitality <b>${h.logistics.supplies?.hospitality||0}</b>/100</span>
   ${beds.reserved?`<span class="hospitality-chip">✉ <b>${beds.reserved}</b> bed${beds.reserved===1?'':'s'} reserved</span>`:''}
 </div>`;
 let body='';
 if(temporary.length)body+=`<details class="card compact"><summary><b>Other Overnight Guests (${temporary.length})</b></summary><small>${temporary.map(x=>`${esc(x.name)} — ${homeGuestSize(x)} bed${homeGuestSize(x)===1?'':'s'}`).join('<br>')}</small></details>`;
 if(g){
   const daysLeft=Math.max(0,g.expiresDay-state.world.day);
   body+=`<div class="hospitality-guest">
     <div class="hospitality-guest-header">
       <div><small>STAYING AT GUARDIAN HALL</small><h3>${esc(g.name)}</h3><span>${g.detail?esc(g.detail):'Settled into the Guest Quarters.'}</span></div>
       <span>${daysLeft} day${daysLeft===1?'':'s'} left</span>
     </div>
     <div class="hospitality-relationship">
       <div><b>${esc(homeGuestRelationshipSummary(g))}</b><small>${esc(homeGuestHospitalityPotential(g))}</small></div>
       ${g.recordId?`<button id="guestViewGroup">Group Info</button>`:''}
     </div>
     <div class="hospitality-visit-mini">
       <span>☕ Refreshments <b>${g.refreshments||0}</b></span>
       <span>🍲 Meals <b>${g.meals||0}</b></span>
       <span>💬 Hall moments <b>${g.socialMoments||0}</b></span>
     </div>
     <div class="hospitality-actions">
       <button id="guestTalk" class="hospitality-action"><span class="hosp-icon">💬</span><b>Spend Time</b><small>Talk with your guests personally.</small></button>
       <button id="guestRefresh" class="hospitality-action"><span class="hosp-icon">☕</span><b>Refreshments</b><small>Have Hall staff look after them.</small></button>
       <button id="guestMeal" class="hospitality-action"><span class="hosp-icon">🍲</span><b>Supper</b><small>Share an informal company meal.</small></button>
       <button id="guestFormal" class="hospitality-action"><span class="hosp-icon">🍽</span><b>Formal Dinner</b><small>Make the visit a special occasion.</small></button>
       <button id="guestPrivacy" class="hospitality-action"><span class="hosp-icon">🛏</span><b>Give Privacy</b><small>Let them have the day to themselves.</small></button>
       ${g.recordId?`<button id="guestViewGroupTile" class="hospitality-action"><span class="hosp-icon">👥</span><b>Group / Family</b><small>Members, history and whereabouts.</small></button>`:''}
     </div>
     <div class="hospitality-secondary">
       <button id="guestDepart" class="danger-soft">End Visit Early</button>
     </div>
   </div>`;
 }else if(active){
   body+=`<div class="hospitality-guest">
     <div class="hospitality-guest-header">
       <div><small>INVITATION UNDERWAY</small><h3>${esc(active.name)}</h3><span>${esc(homeInvitationStatusText(active))}</span></div>
       <span>${esc(active.status==='traveling'?'ACCEPTED':'SENT')}</span>
     </div>
     <div class="hospitality-pending-actions">
       ${active.recordId?`<button id="activeGuestViewGroup">Group Info</button>`:''}
       <button id="cancelGuestInvite">Withdraw Invitation</button>
     </div>
   </div>`;
 }else{
   body+=`<h3>Invite Someone to Stay</h3>
   <p class="compact muted">A stay can strengthen an existing relationship through actual hospitality. Sending the invitation alone does not improve familiarity.</p>
   <div class="hospitality-invite-grid">${cands.map(c=>`<div class="hospitality-contact">
     <div class="hospitality-contact-head"><b>${esc(c.name)}</b><span>${c.size} guest${c.size===1?'':'s'}</span></div>
     <div class="contact-detail">${c.canInvite?`${esc(c.origin?worldLocation(c.origin).name:'Known location')} • roughly ${c.travelDays} day${c.travelDays===1?'':'s'} away`:'Current whereabouts unknown'}${c.detail?`<br>${esc(c.detail)}`:''}</div>
     <div class="hospitality-contact-actions">${c.recordId?`<button data-guestinfo="${c.recordId}">Info</button>`:''}<button data-homeinvite="${c.id}" ${c.size>homeGuestBedsAvailable()||!c.canInvite?'disabled':''}>Invite</button></div>
   </div>`).join('')||'<p class="muted">No established road contacts or groups are currently suitable for an invitation.</p>'}</div>`;
 }
 const history=recent.length?`<details class="guest-invite-history"><summary>Recent Invitations</summary>${recent.map(inv=>`<div class="card compact"><b>${esc(inv.name)}</b><br><small>${esc(homeInvitationStatusText(inv))} • sent Day ${inv.sentDay||inv.day||'?'}</small>${inv.recordId?`<div class="hospitality-history-actions"><button data-guesthistoryinfo="${inv.recordId}">Group Info</button></div>`:''}</div>`).join('')}</details>`:'';
 overlay(`<div class="hospitality-shell"><h2>Guardian Hall — Guest Quarters</h2>
   <p>Host people you know, make them comfortable, and give important relationships somewhere to develop away from the road.</p>
   ${chips}${body}${history}
   <div class="dialog-footer hospitality-footer"><button id="guestBack">Guardian Hall</button></div></div>`,true);
 document.querySelectorAll('[data-homeinvite]').forEach(b=>b.onclick=()=>homeInviteGuest(b.dataset.homeinvite));
 document.querySelectorAll('[data-guestinfo],[data-guesthistoryinfo]').forEach(b=>b.onclick=()=>showHomeGuestGroupInfo(b.dataset.guestinfo||b.dataset.guesthistoryinfo));
 if($('#activeGuestViewGroup'))$('#activeGuestViewGroup').onclick=()=>showHomeGuestGroupInfo(active.recordId);
 if($('#guestViewGroup'))$('#guestViewGroup').onclick=()=>showHomeGuestGroupInfo(g.recordId);
 if($('#guestViewGroupTile'))$('#guestViewGroupTile').onclick=()=>showHomeGuestGroupInfo(g.recordId);
 if($('#cancelGuestInvite'))$('#cancelGuestInvite').onclick=()=>homeCancelInvitation(active.id);
 if($('#guestTalk'))$('#guestTalk').onclick=homeGuestConversation;
 if($('#guestRefresh'))$('#guestRefresh').onclick=homeOfferRefreshments;
 if($('#guestMeal'))$('#guestMeal').onclick=()=>homeInviteMeal(false);
 if($('#guestFormal'))$('#guestFormal').onclick=()=>homeInviteMeal(true);
 if($('#guestPrivacy'))$('#guestPrivacy').onclick=homeGiveGuestPrivacy;
 if($('#guestDepart'))$('#guestDepart').onclick=confirmHomeGuestEarlyDeparture;
 $('#guestBack').onclick=()=>guardianHallRouteBack(showHomeBase)
};
