// v1.6.23 — Guest Quarters social-interface refresh
function homeGuestRelationshipSummary(g){
 if(!g)return'';
 if(g.recordId){
   const r=travelerRegistryState().records[g.recordId];
   if(r)return `${travelerAttitudeLabel(r)} • familiarity ${r.social?.familiarity||0}/10`;
 }
 if(g.companionId){
   const c=state.world.companions?.[g.companionId];
   if(c)return `Personal disposition ${c.disposition||0}`;
 }
 return 'Known guest';
}
function homeGuestHospitalityPotential(g){
 if(!g)return'';
 const parts=[];
 if(!(g.refreshments||0))parts.push('refreshments can improve familiarity');
 if(!g.conversationHad)parts.push('a personal conversation can improve familiarity');
 if(!(g.meals||0))parts.push('the first shared meal can improve familiarity');
 parts.push('a completed stay improves the relationship');
 return parts.join(' • ');
}
function showHomeGuestGroupInfo(recordId){
 guardianHallRouteEnter('showHomeGuestGroupInfo',[recordId]);
 const r=travelerRegistryState().records[recordId];
 if(!r)return showHomeGuestQuarters();
 ensureTravelerRecordIdentity(r);
 const i=r.identity,where=travelerWhereabouts(r),hist=(r.history||[]).slice(-8).reverse();
 const memberStatus=m=>m.status==='dead'?' • deceased':m.status==='captured'?' • captured':m.status==='recovering'?' • recovering':'';
 overlay(`<h2>${esc(i?.groupName||r.name||'Known Group')}</h2>
   <div class="notice compact"><b>${esc(travelerAttitudeLabel(r))}</b> • familiarity ${r.social?.familiarity||0}/10<br>
   ${esc(r.kind||'traveling group')} • ${esc(r.faction||'Independent')}</div>
   ${i?.summary?`<p>${esc(i.summary)}</p>`:''}
   <h3>Members</h3>
   <div class="guest-group-members">${(i?.members||[]).map(m=>`<div class="stat-row"><span><b>${esc(m.name)}</b><small>${esc(m.role||'member')}${m.age==='child'?' • child':''}${memberStatus(m)}</small></span></div>`).join('')||'<p class="muted">No detailed member list is known.</p>'}</div>
   <h3>What We Know</h3>
   <div class="notice compact"><b>${esc(where.text||'Current whereabouts uncertain.')}</b><br>
   Meetings ${r.meetings||0} • Helped ${r.helped||0} • Completed jobs ${r.contractsCompleted||0} • Favors ${travelerFavorState(r)}</div>
   <h3>Recent History</h3>
   ${hist.map(x=>`<div class="card compact"><b>Day ${x.day}</b><br>${esc(x.detail||x.event||'Recorded contact')}</div>`).join('')||'<p class="muted">No detailed relationship history has been recorded.</p>'}
   <div class="dialog-footer"><button id="guestGroupInfoBack">Back to Guest Quarters</button></div>`,true);
 $('#guestGroupInfoBack').onclick=()=>guardianHallRouteBack(showHomeGuestQuarters)
}

showHomeGuestQuarters=function(){
 modalRouteEnter('showHomeGuestQuarters',Array.from(arguments));
 guardianHallRouteEnter('showHomeGuestQuarters',[]);
 ensureHomeBase();
 const h=state.world.homeBase,H=h.hospitality,g=H.guest,cands=homeKnownGuestCandidates(),active=homeActiveInvitation(),
       recent=H.invitations.slice(-6).reverse(),beds=homeLodgingCapacitySnapshot(),temporary=homeTemporaryLodgings();
 const capacity=`<div class="guest-quarters-summary">
   <div><small>Guest rooms</small><b>${beds.total}</b><span>${beds.available} available${beds.reserved?` • ${beds.reserved} reserved`:''}</span></div>
   <div><small>Hospitality supplies</small><b>${h.logistics.supplies?.hospitality||0}</b><span>${H.refreshments} prepared refreshment${H.refreshments===1?'':'s'}</span></div>
   <div><small>Current visit</small><b>${g?'Occupied':active?'Invitation Pending':'Open'}</b><span>${g?esc(g.name):active?esc(active.name):'Ready for guests'}</span></div>
 </div>`;
 let body='';
 if(temporary.length)body+=`<div class="card compact"><b>Other Overnight Guests</b><br><small>${temporary.map(x=>`${esc(x.name)} — ${homeGuestSize(x)} bed${homeGuestSize(x)===1?'':'s'}`).join('<br>')}</small></div>`;
 if(g){
   const daysLeft=Math.max(0,g.expiresDay-state.world.day);
   body+=`<div class="guest-current-card">
     <div class="guest-current-head"><div><small>STAYING AT GUARDIAN HALL</small><h3>${esc(g.name)}</h3></div><span>${daysLeft} day${daysLeft===1?'':'s'} left</span></div>
     <p>${g.detail?esc(g.detail):'Your guests are settled into the Hall.'}</p>
     <div class="notice compact"><b>Relationship:</b> ${esc(homeGuestRelationshipSummary(g))}<br><small>${esc(homeGuestHospitalityPotential(g))}</small></div>
     <div class="guest-visit-stats"><span>Refreshments <b>${g.refreshments||0}</b></span><span>Meals <b>${g.meals||0}</b></span><span>Hall moments <b>${g.socialMoments||0}</b></span></div>
     <div class="guest-actions">
       <button id="guestTalk"><b>Spend Time Together</b><small>Have a personal conversation.</small></button>
       <button id="guestRefresh"><b>Bring Refreshments</b><small>Have Hall staff look after your guests.</small></button>
       <button id="guestMeal"><b>Invite Them to Supper</b><small>Share an informal meal with the company.</small></button>
       <button id="guestFormal"><b>Host a Formal Dinner</b><small>Make the visit a more significant occasion.</small></button>
       <button id="guestPrivacy"><b>Let Them Rest</b><small>Give your guests the day to themselves.</small></button>
       ${g.recordId?`<button id="guestViewGroup"><b>View Group / Family</b><small>Members, history, whereabouts, and relationship.</small></button>`:''}
       <button id="guestDepart" class="guest-end-visit"><b>End Visit Early</b><small>Conclude the stay before its planned end.</small></button>
     </div>
   </div>`;
 }else if(active){
   body+=`<div class="guest-current-card">
     <div class="guest-current-head"><div><small>INVITATION UNDERWAY</small><h3>${esc(active.name)}</h3></div><span>${esc(active.status==='traveling'?'ACCEPTED':'SENT')}</span></div>
     <p>${esc(homeInvitationStatusText(active))}</p>
     <small>Invitation sent Day ${active.sentDay}${active.origin?` • messenger routed toward ${esc(worldLocation(active.origin).name)}`:''}</small>
     <div class="guest-actions compact">
       ${active.recordId?`<button id="activeGuestViewGroup"><b>View Group / Family</b><small>Review who you invited.</small></button>`:''}
       <button id="cancelGuestInvite"><b>Withdraw Invitation</b><small>Cancel the invitation before the visit begins.</small></button>
     </div>
   </div>`;
 }else{
   body+=`<h3>Invite Someone to Stay</h3>
   <p class="compact muted">A stay at Guardian Hall can strengthen an existing relationship through conversation, meals, hospitality, and a successfully completed visit. Sending the invitation by itself does not improve the relationship.</p>
   <div class="guest-invite-list">${cands.map(c=>`<div class="guest-invite-row">
     <div><b>${esc(c.name)}</b><small>${c.size} guest${c.size===1?'':'s'} • ${c.canInvite?`${esc(c.origin?worldLocation(c.origin).name:'Known location')} • roughly ${c.travelDays} day${c.travelDays===1?'':'s'} away`:'Current whereabouts unknown'}</small></div>
     <div class="guest-invite-actions">${c.recordId?`<button data-guestinfo="${c.recordId}">View Group</button>`:''}<button data-homeinvite="${c.id}" ${c.size>homeGuestBedsAvailable()||!c.canInvite?'disabled':''}>Invite to Stay</button></div>
   </div>`).join('')||'<p class="muted">No established road contacts or groups are currently suitable for an invitation.</p>'}</div>`;
 }
 const history=recent.length?`<details class="guest-invite-history"><summary>Recent Invitations</summary>${recent.map(inv=>`<div class="card compact"><b>${esc(inv.name)}</b><br><small>${esc(homeInvitationStatusText(inv))} • sent Day ${inv.sentDay||inv.day||'?'}</small>${inv.recordId?`<br><button data-guesthistoryinfo="${inv.recordId}">View Group</button>`:''}</div>`).join('')}</details>`:'';
 overlay(`<h2>Guardian Hall — Guest Quarters</h2>
   <p>Invite people you know to stay at Guardian Hall, look after them while they are here, and give the relationship room to grow.</p>
   ${capacity}${body}${history}
   <div class="dialog-footer"><button id="guestBack">Back to Guardian Hall</button></div>`,true);
 document.querySelectorAll('[data-homeinvite]').forEach(b=>b.onclick=()=>homeInviteGuest(b.dataset.homeinvite));
 document.querySelectorAll('[data-guestinfo],[data-guesthistoryinfo]').forEach(b=>b.onclick=()=>showHomeGuestGroupInfo(b.dataset.guestinfo||b.dataset.guesthistoryinfo));
 if($('#activeGuestViewGroup'))$('#activeGuestViewGroup').onclick=()=>showHomeGuestGroupInfo(active.recordId);
 if($('#guestViewGroup'))$('#guestViewGroup').onclick=()=>showHomeGuestGroupInfo(g.recordId);
 if($('#cancelGuestInvite'))$('#cancelGuestInvite').onclick=()=>homeCancelInvitation(active.id);
 if($('#guestTalk'))$('#guestTalk').onclick=homeGuestConversation;
 if($('#guestRefresh'))$('#guestRefresh').onclick=homeOfferRefreshments;
 if($('#guestMeal'))$('#guestMeal').onclick=()=>homeInviteMeal(false);
 if($('#guestFormal'))$('#guestFormal').onclick=()=>homeInviteMeal(true);
 if($('#guestPrivacy'))$('#guestPrivacy').onclick=homeGiveGuestPrivacy;
 if($('#guestDepart'))$('#guestDepart').onclick=()=>{homeConcludeGuestStay('ends the visit early');save();showHomeGuestQuarters()};
 $('#guestBack').onclick=()=>guardianHallRouteBack(showHomeBase)
};
