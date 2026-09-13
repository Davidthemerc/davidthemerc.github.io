function setCondensedMode(on){
  document.body.classList.toggle('condensed-mode',!!on);
  if(window.matchMedia('(max-width:720px)').matches)setMobileDraftFocus(!!on);
  const btn=$('#condensedToggle');
  if(btn){btn.classList.toggle('active',!!on);btn.setAttribute('aria-pressed',String(!!on));btn.textContent=on?'Full Mode':'Condensed Mode';}
  const settingsToggle=$('#settingsCondensedToggle');if(settingsToggle)settingsToggle.checked=!!on;
  storageSet(condensedKey,on?'1':'0');
}
$('#condensedToggle').addEventListener('click',()=>setCondensedMode(!document.body.classList.contains('condensed-mode')));
setCondensedMode(storageGet(condensedKey,'0')==='1');

$('#logSyncBtn').addEventListener('click',()=>syncSleeper(true));
$('#reportAnalysisBtn')?.addEventListener('click',()=>switchTab('analysis'));
$('#reportLogBtn').addEventListener('click',()=>switchTab('log'));
$('#returnLogFromBanner').addEventListener('click',()=>switchTab('log'));
$('#reportBoardBtn').addEventListener('click',()=>{
  const board=$('#liveDraftBoard'),report=$('#postDraftReport');
  const show=board.hidden;
  board.hidden=!show;
  document.body.classList.toggle('archived-board',show);
  $('#reportBoardBtn').textContent=show?'Hide Archived Draft Board':'View Archived Draft Board';
  if(show){
    safeUiCall('archived-board-render',()=>render());
    board.scrollIntoView({behavior:'smooth',block:'start'});
  }
  renderPostTransitionStatus();
});
$('#settingsCondensedToggle').addEventListener('change',e=>setCondensedMode(e.target.checked));
$('#settingsRecDetail').addEventListener('change',e=>setRecommendationDetailMode(e.target.value));
$('#settingsBoardDensity').addEventListener('change',e=>setBoardDensityMode(e.target.value));
$('#settingsIntelDefaultToggle').addEventListener('change',e=>storageSet(INTEL_DEFAULT_KEY,e.target.checked?'1':'0'));
$('#settingsSearchDefaultToggle').addEventListener('change',e=>storageSet(SEARCH_DEFAULT_KEY,e.target.checked?'1':'0'));
$('#settingsSyncBtn').addEventListener('click',()=>$('#syncNowBtn')?.click());
$('#settingsResetDraftBtn').addEventListener('click',resetDraftMarks);
$('#settingsExportLocalBtn')?.addEventListener('click',exportLocalBackup);
$('#settingsImportLocalBtn')?.addEventListener('click',()=>$('#settingsImportLocalFile')?.click());
$('#settingsImportLocalFile')?.addEventListener('change',async e=>{
  const file=e.target.files?.[0];
  await importLocalBackupFile(file);
  e.target.value='';
});
$('#settingsClearRuntimeCacheBtn')?.addEventListener('click',async()=>{
  if(!confirm('Clear the saved season snapshot and cached weekly projections on this device? Preferences and reusable Sleeper API responses will remain.'))return;
  const cleared=await clearSavedSeasonSnapshot();
  toast(`Saved season data cleared${cleared?` • ${cleared} record${cleared===1?'':'s'}`:''}`);
});
$('#otherMatchupClose')?.addEventListener('click',()=>$('#otherMatchupDialog')?.close());
$('#otherMatchupDialog')?.addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.close();});
document.addEventListener('click',e=>{const b=e.target.closest('[data-other-matchup]');if(b)openOtherLeagueMatchup(b.dataset.otherMatchup);});
$('#settingsResetAllBtn').addEventListener('click',resetAllLocalAppData);
$('#settingsClearFiltersBtn').addEventListener('click',()=>{
  clearDraftFilters();
  toast('Draft Board filters cleared');
});
window.addEventListener('error',event=>{
  console.error('UCL runtime error',event.error||event.message);
  if(event?.error||event?.message){
    const err=event.error||new Error(String(event.message||'Runtime error'));
    recordSleeperError({path:'app/runtime',error:err,retries:0,cachedUsed:false,label:'App runtime'});
  }
  setSyncStatus('err','A page error occurred. Sync or reload if a control stops responding.');
});
window.addEventListener('unhandledrejection',event=>{
  console.error('UCL async error',event.reason);
  if(event?.reason){
    const err=event.reason instanceof Error?event.reason:new Error(String(event.reason));
    recordSleeperError({path:'app/async',error:err,retries:0,cachedUsed:false,label:'App async'});
  }
  if(runtimeDataMode!=='offline')setSyncStatus('busy','A background request failed. Existing data is preserved where possible.');
});
function initializeStaticUi(){
  // The application shell and navigation must become usable before *any*
  // asynchronous storage or network operation.
  safeUiCall('season-tab-visibility',()=>updateSeasonTabVisibility());
  safeUiCall('draft-utility-tab-visibility',()=>updateLiveSeasonDraftUtilityVisibility());
  if(draftAllowsPostDraftViews()) safeUiCall('initial-home-render',()=>renderCompanionHome());
  else safeUiCall('initial-render',()=>render());
  safeUiCall('team-select-size',()=>sizeSleeperTeamSelect());
  safeUiCall('font-bump',()=>installViewFontBump());

  const bye=$('#byeFilter');
  if(bye&&!bye.dataset.weeksReady){
    for(let w=5;w<=14;w++){
      const exists=[...bye.options].some(o=>String(o.value)===String(w));
      if(!exists){
        const o=document.createElement('option');
        o.value=o.textContent=w;
        bye.appendChild(o);
      }
    }
    bye.dataset.weeksReady='1';
  }
}
async function initializeCompanionRuntime(){
  const savedSleeperUser=selectedSleeperUserCandidate();
  let restoredFromMirror=false;
  let mirrorSavedAt=0;

  // Fast first meaningful render: synchronous local mirror only.
  if(savedSleeperUser){
    $('#sleeperUser').value=savedSleeperUser;
    const immediate=safeUiCall('local-runtime-hydration',()=>hydrateRuntimeCache(savedSleeperUser));
    if(immediate){
      restoredFromMirror=true;
      mirrorSavedAt=Number(runtimeLastSuccess||0);
      safeUiCall('saved-team-options',()=>populateSleeperTeamOptions(leagueUsers));
      renderRestoredRuntimeState();
      setSyncStatus('busy',`Loaded saved ${runtimeCacheAgeText()} • refreshing in background…`);
    }
  }

  // Once the shell (and any synchronous saved snapshot) is visible, immediately
  // launch a real Sleeper/season refresh for the saved team. This mirrors the
  // manual refresh path without blocking first paint.
  if(savedSleeperUser){
    backgroundTask('startup-api-refresh',async()=>{
      await connectSleeper(savedSleeperUser);
    });
  }

  // IndexedDB/cache bookkeeping stays outside the critical startup path.
  // If the API refresh has already started, avoid applying an older IndexedDB
  // snapshot over data that may be arriving from the network.
  backgroundTask('storage-hydration',async()=>{
    await boundedStartup(openApiCacheDb(),1800,null);
    if(savedSleeperUser){
      const newest=await boundedStartup(peekNewestRuntimeCache(savedSleeperUser),1800,null);
      const newestSavedAt=Number(newest?.savedAt||0);

      if(!startupConnectAttempted&&newest&&(!restoredFromMirror||newestSavedAt>mirrorSavedAt+250)){
        applyRuntimeCache(newest,savedSleeperUser);
        safeUiCall('indexed-team-options',()=>populateSleeperTeamOptions(leagueUsers));
        renderRestoredRuntimeState();
      }

      await boundedStartup(hydrateSavedProjectionMap(currentWeekNumber()),1400,0);
      if(!startupConnectAttempted)renderRestoredRuntimeState();

      backgroundTask('runtime-repair',()=>readRuntimeCacheAsync(savedSleeperUser));
      if(!startupConnectAttempted)setSyncStatus('busy','Saved data loaded • refreshing Sleeper…');
    }else{
      setSyncStatus('busy','Select your team, then tap ↻ to load Sleeper data.');
    }
  });
}
initializeStaticUi();
initializeCompanionRuntime().catch(err=>{
  console.error('UCL startup hydration error',err);
  try{
    setSyncStatus('err','Saved/API refresh had a problem. Local navigation remains available.');
  }catch(e){console.error('UCL startup fallback error',e);}
});
