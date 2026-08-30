// v1.6.17.3 — Siege Mode II Full-Campaign Regression & Edge-Case Pass
// Campaign-length invariant repair, endpoint preflight, recap cleanup, and post-action outcome safety.
function siegeIIFullCampaignState(){
 const S=siegeIICombatState();if(!S)return null;
 if(!S.fullCampaignAudit||typeof S.fullCampaignAudit!=='object')S.fullCampaignAudit={schema:'siege2_full_campaign_v1',createdVersion:VERSION,repairs:[],lastCheckedAssault:0};
 const A=S.fullCampaignAudit;A.schema='siege2_full_campaign_v1';A.repairs=Array.isArray(A.repairs)?A.repairs:[];A.lastCheckedAssault=Math.max(0,Number(A.lastCheckedAssault)||0);return A
}
function siegeIIFullCampaignRepair(text){const A=siegeIIFullCampaignState();if(!A||!text)return;A.repairs.unshift({assault:siegeIICombatState().assault,text,version:VERSION});A.repairs=A.repairs.slice(0,40)}
function siegeIIFullCampaignNormalize(){
 if(!isSiegeModeII())return false;
 siegeIINormalizeCampaign();siegeIIBalanceNormalize();
 const S=siegeIICombatState(),F=siegeIIForcesState(),B=siegeIIBattlefieldState(),L=siegeIILogisticsState(),R=siegeIIRecoveryState(),P=siegeIIPoliticsState(),O=siegeIIOutcomesState(),U=siegeIIUXState(),A=siegeIIFullCampaignState();let changed=false;
 const mark=t=>{changed=true;siegeIIFullCampaignRepair(t)};
 // Battle counters are long-lived save data. Keep them non-negative and internally coherent without rewriting legitimate history totals.
 S.battles=S.battles&&typeof S.battles==='object'?S.battles:{};for(const k of ['fought','wins','retreats','defeats','surrenders','enemyWithdrawals']){const n=Math.max(0,Math.floor(Number(S.battles[k])||0));if(S.battles[k]!==n){S.battles[k]=n;changed=true}}
 const resolved=S.battles.wins+S.battles.retreats+S.battles.defeats+S.battles.surrenders+S.battles.enemyWithdrawals;
 if(S.battles.fought<resolved){S.battles.fought=resolved;mark('Raised the resolved-battle total to match recorded Siege II outcomes.')}
 const minNext=S.battles.fought+1;if(O.status!=='completed'&&!combat&&!S.currentAssault&&S.assault<minNext){S.assault=minNext;mark('Advanced a stale next-assault number that lagged behind the resolved battle record.')}
 // Clamp long-campaign state that older partial builds could leave malformed.
 O.phaseIndex=clamp(Math.floor(Number(O.phaseIndex)||0),0,3);O.phaseStartedAssault=Math.max(1,Math.floor(Number(O.phaseStartedAssault)||1));O.siegeFatigue=clamp(Math.round(Number(O.siegeFatigue)||0),0,100);O.lastEvaluatedAssault=Math.max(0,Math.floor(Number(O.lastEvaluatedAssault)||0));
 O.phaseHistory=Array.isArray(O.phaseHistory)?O.phaseHistory:[];O.performanceHistory=Array.isArray(O.performanceHistory)?O.performanceHistory:[];O.milestones=Array.isArray(O.milestones)?O.milestones:[];O.setbacks=Array.isArray(O.setbacks)?O.setbacks:[];
 // A pre-assault UX snapshot should never survive a completed campaign or point beyond the current assault.
 if(U.preAssault&&O.status==='completed'){U.preAssault=null;mark('Cleared a stale pre-assault recap snapshot from a completed campaign.')}
 else if(U.preAssault&&Number(U.preAssault.assault)>S.assault){U.preAssault=null;mark('Cleared an impossible future-dated pre-assault recap snapshot.')}
 if(U.lastRecap&&Number(U.lastRecap.assault)>=S.assault&&O.status!=='completed'){U.lastRecap=null;mark('Cleared a recap that referred to an assault that has not yet resolved.')}
 // Invalid current-assault references can otherwise survive imports that did not include live combat state.
 if(S.currentAssault&&!combat&&Number(S.currentAssault.assault)!==S.assault){S.currentAssault=null;mark('Cleared an assault marker that no longer matched the campaign assault number.')}
 // Normalize one-use command markers to integral assault numbers.
 for(const [obj,key] of [[B,'commandActionAssault'],[L,'commandActionAssault'],[R,'actionAssault'],[P,'commandActionAssault']]){const n=Math.max(0,Math.floor(Number(obj[key])||0));if(obj[key]!==n){obj[key]=n;changed=true}}
 // A completed campaign must not expose live UX or combat state. Conversely, active campaigns at a decisive endpoint are evaluated immediately below.
 if(O.status==='completed'){if(S.currentAssault){S.currentAssault=null;changed=true}S.phase='aftermath';if(!O.aftermath){O.status='active';O.finalScore=null;O.finalAssault=null;S.phase='command';B.commandActionAssault=Math.max(0,S.assault-1);L.commandActionAssault=Math.max(0,S.assault-1);R.actionAssault=Math.max(0,S.assault-1);P.commandActionAssault=Math.max(0,S.assault-1);mark('Reopened an incomplete aftermath marker so the campaign outcome can be evaluated safely.')}}
 A.lastCheckedAssault=S.assault;if(changed)save();return changed
}
function siegeIIFullCampaignEndpointPreflight(){
 if(!isSiegeModeII())return null;siegeIIFullCampaignNormalize();const O=siegeIIOutcomesState();if(O.status==='completed')return O.aftermath||null;
 // Re-evaluate endpoints immediately before an assault or after a strategic action. This prevents emergency reinforcements from resurrecting a host that has already lost the campaign.
 siegeIIUpdatePhase();const result=siegeIIOutcomeCheck();return result||null
}
const _siegeIIStartAssault16173=siegeIIStartAssault;
siegeIIStartAssault=function(){const ended=siegeIIFullCampaignEndpointPreflight();if(ended||siegeIIOutcomesState().status==='completed')return showSiegeIICampaignProgress();return _siegeIIStartAssault16173()};
const _siegeIIResolveBattlefieldIncident16173=siegeIIResolveBattlefieldIncident;
siegeIIResolveBattlefieldIncident=function(id,choice){const out=_siegeIIResolveBattlefieldIncident16173(id,choice);if(isSiegeModeII())siegeIIFullCampaignEndpointPreflight();return out};
const _renderSiegeIICommand16173=renderSiegeIICommand;
renderSiegeIICommand=function(){siegeIIFullCampaignNormalize();siegeIIFullCampaignEndpointPreflight();return _renderSiegeIICommand16173()};renderSiegeIIFoundation=renderSiegeIICommand;
