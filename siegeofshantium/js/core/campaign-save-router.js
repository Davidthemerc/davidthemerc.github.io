'use strict';
/* Mode-neutral saved-campaign continuation router. */
function continueSavedCampaign(mode){
 const btn=$(mode==='openworld'?'#continueOpenBtn':mode==='siege2'?'#continueSiegeIIBtn':'#continueLegacySiegeBtn');
 if(btn){btn.disabled=true;btn.dataset.original=btn.innerHTML;btn.innerHTML=SOSText("siege_campaign_start_menu.continueSavedCampaign.001")}
 setTimeout(()=>{
   if(!load(mode)){if(btn){btn.disabled=false;btn.innerHTML=btn.dataset.original||btn.innerHTML}return showContinueFailure(mode)}
   try{
     closeOverlay();renderGame()
   }catch(e){
     console.error(SOSText("siege_campaign_start_menu.continueSavedCampaign.002"),e);
     // One conservative repair attempt before giving up the loaded state.
     try{
       if(state?.mode==='openworld'){ensureWorldState();safeLoadRepair(SOSText("siege_campaign_start_menu.continueSavedCampaign.003"),()=>repairOpenWorldState(),[]);if(!validWorldLocationId(state.world.location)){state.world.location='shantium';state.world.region='shantium'}}
       normalize();renderGame();save();return
     }catch(e2){console.error(SOSText("siege_campaign_start_menu.continueSavedCampaign.004"),e2);return showContinueFailure(mode,e2)}
   }
 },0)
}
