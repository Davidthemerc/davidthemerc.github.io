// v1.6.23 — Guardian Hall integration safeguards
function homePhysicalAccessContext(){
 const c=typeof playerPhysicalContext==='function'?playerPhysicalContext():null;
 return {
   atHall:canAccessGuardianHall(),
   viaPassage:!!state.world?.homeBase?.secretPassage?.sheltering,
   context:c?.type||null,
   settlementId:c?.settlementId||null
 }
}
function homeEnsureRecentSubsystemState(){
 ensureHomeBase();
 const h=state.world.homeBase;
 if(!Array.isArray(h.armoryInventory))h.armoryInventory=[];
 if(!Array.isArray(h.logistics.tradeStandingOrders))h.logistics.tradeStandingOrders=[];
 if(!Array.isArray(h.logistics.tradeProcurementPlans))h.logistics.tradeProcurementPlans=[];
 if(!Array.isArray(h.hospitality.invitations))h.hospitality.invitations=[];
 if(!Array.isArray(h.hospitality.diningHistory))h.hospitality.diningHistory=[];
 if(!Array.isArray(h.audiences?.queue))h.audiences.queue=[];
 // Remove impossible dangling procurement Party references without touching active world Parties.
 for(const o of (h.logistics.tradeProcurementOrders||[])){
   if(o.partyId && !state.world.parties?.some(p=>p.id===o.partyId) &&
      ['outbound','sourcing','returning','returning_partial','awaiting_storage'].includes(o.status)){
     o.partyId=null;
     o.status='failed';
     o.completedDay=o.completedDay||state.world.day;
     o.lossReason=o.lossReason||'Procurement caravan record was no longer present in the living world.';
   }
 }
 return h
}

// Hall root now runs a very small recent-subsystem normalization only when actually accessed.
const __v162215ShowHomeBase=showHomeBase;
showHomeBase=function(){
 if(!canAccessGuardianHall())return denyGuardianHallAccess();
 homeEnsureRecentSubsystemState();
 return __v162215ShowHomeBase()
};

// Keep Hall Holding Area access consistent with Hidden Passage / physical Hall context.
const __v162215ShowHomePrisoners=showHomePrisoners;
showHomePrisoners=function(){
 if(!isOpenWorld()||!canAccessGuardianHall())return actionResult(
   SOSText("siege_prisoners_force_encounters.showHomePrisoners.002"),
   SOSText("siege_prisoners_force_encounters.showHomePrisoners.003"),
   'info',renderOpenWorld
 );
 return __v162215ShowHomePrisoners()
};
