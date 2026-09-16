'use strict';
/* Mode-neutral campaign entry routing. */

function startCampaign(mode='siege2',confirmed=false){
 if(!confirmed&&hasModeSave(mode)){const label=mode==='openworld'?'Open World':mode==='siege2'?'Siege Mode II':'Legacy Siege Mode';if(!confirm(SOSText("siege_campaign_start_menu.startCampaign.002",label,label)))return}
 const name=$('#guardianName').value.trim()||SOSText("siege_campaign_start_menu.startCampaign.003"),diff=$('#difficulty').value;
 state=mode==='legacy_siege'?newLegacySiegeState(name,diff):newState(name,diff,mode);
 equipReturnedBoundWeapon();
 meta.campaigns++;saveMeta();refreshShopStock();
 if(mode==='legacy_siege'){state.groups=createGroups(1);spawnFieldEncounters(1);log(`${state.name} takes command as enemy forces close on Shantium.`,'info');log('Twelve hard rounds stand between the city and survival.','info')}
 else if(mode==='siege2'){state.groups=[];state.fieldEncounters=[];state.roundActions=0;log(`${state.name} takes command of Shantium's defense.`,'info');log('The besieging host gathers beyond the city while defenders prepare the first line.','info')}
 else{state.groups=[];state.fieldEncounters=[];ensureWorldState();maintainWorldParties();refreshContracts();log(SOSText("siege_campaign_start_menu.startCampaign.006",state.name),'info');log(SOSText("siege_campaign_start_menu.startCampaign.007"),'info')}
 save();renderGame()
}
