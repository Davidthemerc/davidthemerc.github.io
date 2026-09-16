'use strict';
/* Siege II combat boundary.
   Siege II owns its campaign state and combat outcomes. It may use the mode-neutral
   combat renderer/turn engine, but never Open World incidents, parties, locations,
   contracts, politics, or encounter bookkeeping. */
function siegeIICombatLaunch(gr){
  if(!gr||!gr.siegeIIEncounter)throw new Error('Siege II combat payload required');
  gr.mode='siege2';
  gr.incidentId=null;
  gr.worldPartyId=null;
  gr.politicalOperation=null;
  gr.guardianCaravanIncident=null;
  state.gameResult=gr;
  beginCombat(gr);
}
function siegeIICombatVictory(gr){return resolveSiegeIICombat(gr)}
function siegeIICombatRetreat(gr){return resolveSiegeIIRetreat(gr)}
globalThis.SOSSiegeIICombat=Object.freeze({
 launch:siegeIICombatLaunch,
 victory:siegeIICombatVictory,
 retreat:siegeIICombatRetreat
});
