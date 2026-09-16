'use strict';
function legacySiegeCombatLaunch(gr){if(!gr)throw new Error('Legacy Siege combat payload required');gr.mode='legacy_siege';state.gameResult=gr;beginCombat(gr)}
globalThis.SOSLegacySiegeCombat=Object.freeze({launch:legacySiegeCombatLaunch});
