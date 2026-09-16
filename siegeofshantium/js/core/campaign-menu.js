'use strict';
function equipReturnedBoundWeapon(){
 if(!meta.boundWeapon)return false;
 if(meta.boundItem&&!ITEMS.some(i=>i.id===meta.boundWeapon)&&!state.customItems.some(i=>i.id===meta.boundWeapon))state.customItems.push({...meta.boundItem});
 const legacy=item(meta.boundWeapon);if(!legacy||legacy.slot!=='weapon')return false;
 state.flags.legacyWeapon=meta.boundWeapon;
 // Bound weapons return equipped. Preserve the normal starter weapon in the common pack.
 const current=state.guardian.equipment.weapon;
 if(current&&current!==meta.boundWeapon)invAdd(current);
 // Remove any accidental duplicate copy from the common pack before equipping.
 while(state.guardian.inventory.some(x=>x.id===meta.boundWeapon))invRemove(meta.boundWeapon);
 state.guardian.equipment.weapon=meta.boundWeapon;
 log(SOSText("siege_campaign_start_menu.equipReturnedBoundWeapon.001",legacy.name),'good');
 return true
}

function showContinueFailure(mode,error=null){modalRouteEnter(SOSText("siege_campaign_start_menu.showContinueFailure.001"),Array.from(arguments));
 const savedError=error||null,stack=savedError?.stack?String(savedError.stack).split('\n').slice(0,4).join('\n'):'';
 state=null;combat=null;
 const label=mode==='openworld'?'Open World':SOSText("siege_campaign_start_menu.showContinueFailure.002"),detail=savedError?.message||lastLoadFailure||SOSText("siege_campaign_start_menu.showContinueFailure.003");
 overlay(SOSText("siege_campaign_start_menu.showContinueFailure.004",label,esc(detail),stack?`<pre class="continue-error-stack">${esc(stack)}</pre>`:''),false,true);
 $('#continueRetry').onclick=()=>{closeOverlay();continueSavedCampaign(mode)};
 $('#continueImport').onclick=()=>importSave();
 $('#continueBack').onclick=()=>{closeOverlay();renderMenu()}
}

function renderMenu(){
 migrateLegacySaveSlots();migrateSiegeModeSplit();
 if(typeof SOSIndexedDBRuntime!=='undefined'&&!SOSIndexedDBRuntime.ready&&!SOSIndexedDBRuntime.failed){
  document.getElementById('app').innerHTML='<div class="menu-screen"><div class="menu-window"><h1 class="menu-title">SIEGE OF SHANTIUM</h1><div class="menu-sub">Preparing campaign saves…</div><div class="notice">Checking the local campaign database and migrating any older browser saves.</div></div></div>';
  sosStorageReady().catch(e=>console.warn('Campaign storage initialization failed.',e)).finally(()=>renderMenu());return
 }
 const openSave=savedCampaign('openworld'),siegeIISave=savedCampaign('siege2'),legacySave=savedCampaign('legacy_siege');
 const opts=Object.keys(DIFFICULTIES).map(k=>`<option>${k}</option>`).join('');
 document.getElementById('app').innerHTML=`<div class="menu-screen"><div class="menu-window siege2-menu"><h1 class="menu-title">SIEGE OF SHANTIUM</h1><div class="menu-sub">A Macintosh-style party role-playing game</div><div class="continue-campaigns continue-three"><h3>Continue Campaign</h3><button id="continueOpenBtn" class="continue-slot continue-open" ${openSave?'':'disabled'}><b>${openSave?'Continue Open World':'No Open World Campaign'}</b><small>${esc(openSave?savedCampaignSummary('openworld'):'Start one below')}</small></button><button id="continueSiegeIIBtn" class="continue-slot continue-siege2" ${siegeIISave?'':'disabled'}><b>${siegeIISave?'Continue Siege Mode II':'No Siege Mode II Campaign'}</b><small>${esc(siegeIISave?savedCampaignSummary('siege2'):'The modern siege campaign begins below')}</small></button><button id="continueLegacySiegeBtn" class="continue-slot continue-legacy" ${legacySave?'':'disabled'}><b>${legacySave?'Continue Legacy Siege Mode':'No Legacy Siege Campaign'}</b><small>${esc(legacySave?savedCampaignSummary('legacy_siege'):'Original Siege Mode is preserved here')}</small></button></div><div class="notice"><b>Three independent campaign slots:</b> Open World, Siege Mode II, and Legacy Siege Mode. Existing pre-v1.6.9 Siege saves are copied into Legacy Siege Mode and preserved under the original rules.</div><h3>Start New Campaign</h3><div class="new-form"><label>Guardian Name<input id="guardianName" maxlength="24" value="Guardian"></label><label>Difficulty<select id="difficulty">${opts}</select></label></div><div class="mode-grid mode-grid-three"><button id="openWorldBtn" class="mode-card"><b>NEW OPEN WORLD</b><br><small>Travel, explore, build the Guardian Company, and play an ongoing campaign.</small></button><button id="siegeIIBtn" class="mode-card siege2-primary"><b>NEW SIEGE MODE II</b><br><small>The fully modernized defense of Shantium: combat, armies, battlefield, logistics, recovery, politics, and long-siege outcomes.</small></button><button id="legacySiegeBtn" class="mode-card legacy-mode-card"><b>LEGACY SIEGE MODE</b><br><small>The original 12-round Siege Mode, preserved for old campaigns and classic play.</small></button></div><div class="menu-actions"><button id="statsBtn">Career Statistics</button><button id="importBtn">Import Save</button><button id="helpBtn">How to Play</button><button id="settingsBtn">Settings</button></div><p class="compact center muted">Version ${RELEASE_VERSION} • Open World / Siege Mode II / Legacy Siege use separate campaign saves</p></div></div>`;
 if($('#continueOpenBtn'))$('#continueOpenBtn').onclick=()=>continueSavedCampaign('openworld');
 if($('#continueSiegeIIBtn'))$('#continueSiegeIIBtn').onclick=()=>continueSavedCampaign('siege2');
 if($('#continueLegacySiegeBtn'))$('#continueLegacySiegeBtn').onclick=()=>continueSavedCampaign('legacy_siege');
 $('#openWorldBtn').onclick=()=>startCampaign('openworld');$('#siegeIIBtn').onclick=()=>startCampaign('siege2');$('#legacySiegeBtn').onclick=()=>startCampaign('legacy_siege');$('#statsBtn').onclick=showStats;$('#importBtn').onclick=importSave;$('#helpBtn').onclick=showHelp;$('#settingsBtn').onclick=()=>showSettings('menu');
}
