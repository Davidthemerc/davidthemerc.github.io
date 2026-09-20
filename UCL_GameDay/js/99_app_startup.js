/* UCL GameDay v0.5.58 — build fragment: 99_app_startup.js
   This file is concatenated in manifest order into the app's single lexical scope.
   It is intentionally not loaded independently in the browser. */
function loadPlayers(forceApi=false){
  loadDiscoveredPlayers();
  if(!forceApi&&!missingReferencedPlayerIds().length)return discoveredSleeperPlayers;
  await resolveMissingReferencedPlayers();
  return discoveredSleeperPlayers;
}


async function ensureInitialActivityPrerequisites(){
  try{
    loadDiscoveredPlayers();
    const tasks=[];
    if(missingReferencedPlayerIds().length)tasks.push(resolveMissingReferencedPlayers().catch(e=>{if(!e?.isSleeperRequestError)throw e;return 0}));
    tasks.push(refreshNflScheduleStatus(false).catch(e=>{if(!e?.isSleeperRequestError)throw e;return false}));
    tasks.push(refreshNflKickoffSchedule(false).catch(()=>false));
    await Promise.all(tasks);
    refreshNflActivityUi();
    return true;
  }catch(e){
    try{console.warn('Initial active-game prerequisites failed',e)}catch(_){}
    refreshNflActivityUi();
    return false;
  }
}

async function sync(){
  if(simulation.active){updateSimulationUi();render();return true}
  if(!liveLoadingEnabled()){
    loadSavedGameDayData();
    if(rosters.length&&!$('#teamSelect').options.length)populateControls();
    updateLiveLoadingUi();render();return true
  }
  if(busy)return false;busy=true;
  try{
    // Stage every core Sleeper response first. A failed poll must not partially replace
    // the last known-good users/rosters/matchups already displayed in the app.
    const [state,leagueUsers,leagueRosters,leagueMeta]=await Promise.all([
      get(`${API}/state/nfl`),
      get(`${API}/league/${LEAGUE_ID}/users`),
      get(`${API}/league/${LEAGUE_ID}/rosters`),
      get(`${API}/league/${LEAGUE_ID}`).catch(e=>{if(e?.isSleeperRequestError)return null;throw e})
    ]);
    const week=n(state?.week)||1;
    const nextMatchups=await get(`${API}/league/${LEAGUE_ID}/matchups/${week}`);

    // Commit only after the required core payloads all succeeded.
    nflState=state;leagueInfo=leagueMeta||leagueInfo;users=leagueUsers||[];rosters=leagueRosters||[];matchups=nextMatchups||[];
    if(!rosters.length)ensureDefaultUclTeams();
    loadDiscoveredPlayers();
    // Player-directory hydration is optional. A blocked/failed giant players endpoint
    // must not invalidate an otherwise successful league poll.
    try{await resolveMissingReferencedPlayers()}catch(e){if(!e?.isSleeperRequestError)throw e}
    // NFL schedule/status is optional: use it when available, never fail the core Sleeper poll because of it.
    try{await refreshNflScheduleStatus(false)}catch(e){if(!e?.isSleeperRequestError)throw e}
    try{await refreshNflKickoffSchedule(false)}catch(e){}
    await Promise.all([refreshGameViewStats(false),refreshGameViewProjections(false)]);
    captureTestingAreaPoll();testingCaptureLiveDebugPoll();saveLiveSnapshot();saveRosterCache();saveRosterCacheV2();
    const teamControl=$('#teamSelect'),liveRosterIds=new Set(rosters.map(r=>String(r.roster_id)));
    if(!teamControl.options.length||!liveRosterIds.has(String(teamControl.value)))populateControls();else renderCtespnMatchupAlertSettings();
    if(typeof testingRefreshAllPlayerSelectors==='function')testingRefreshAllPlayerSelectors();
    if(!featuredMatchupId)featuredMatchupId=pairForRoster($('#teamSelect').value)?.id||matchupPairs()[0]?.id||null;
    snapshotAndEvents();gvProcessLiveSnapshot();$('#weekLabel').textContent=`Week ${week}`;
    if($('#liveDot'))$('#liveDot').classList.add('on');
    markSleeperConnectionSuccess();render();renderPlayerDataStatus();refreshNflActivityUi();
    return true;
  }catch(e){
    if(e?.isSleeperRequestError){
      markSleeperConnectionFailure(e);
      if($('#liveDot'))$('#liveDot').classList.remove('on');
      // Keep rendering the last successful snapshot/cache; the interval will retry.
      if(!rosters.length||!matchups.length)loadSavedGameDayData();
      if(!rosters.length)ensureDefaultUclTeams();
      if(rosters.length&&!$('#teamSelect').options.length)populateControls();
      render();renderPlayerDataStatus();
      return false;
    }else{
      console.error(e);appendJsError(e?.stack||e?.message||String(e));
      $('#errorBox').textContent=`GameDay error: ${e?.message||e}.`;$('#errorBox').classList.add('show');
      if($('#liveDot'))$('#liveDot').classList.remove('on');
      return false;
    }
  }finally{busy=false}
}
window.addEventListener('resize',()=>{const p=chosenPair();if(p)renderMomentum(p)});
$('#refreshBtn').onclick=()=>{if(liveLoadingEnabled())sync()};
// Testing Area is physically below this script in the document, so direct startup
// queries cannot see its controls. Delegate events from document instead.
document.addEventListener('click',e=>{
  const gameDayPlayerLink=e.target.closest?.('[data-gameday-gv-roster]');
  if(gameDayPlayerLink){
    selectPreferredTeam(gameDayPlayerLink.dataset.gamedayGvRoster);
    setView('gameview');
    return;
  }
  if(e.target?.id==='testingDeltaNextPoll'){
    testingAdvancePoll();
    return;
  }
  if(e.target?.id==='testingDeltaClearSequence'){
    testingSequenceStateReset();
    const r=$('#testingDeltaResult');
    if(r)r.innerHTML='Sequence cleared. Configure Poll 1, then select <b>Send Poll</b>.';
    return;
  }

  if(e.target?.id==='firstRunContinueBtn'){
    completeFirstRunSetup();
    return;
  }

  if(e.target?.id==='clearLocalDataBtn'){
    clearAllLocalAppData();
    return;
  }

  const gvAllTeamsChoice=e.target.closest?.('[data-gv-all-teams]');
  if(gvAllTeamsChoice){
    gvSetAllTeamsMode(true);
    gvTeamPickerClose();
    if(currentView==='gameview')renderGameView();
    return;
  }
  const gvTeamChoice=e.target.closest?.('[data-gv-team-id]');
  if(gvTeamChoice){
    if(gvIsAllTeamsMode())gvSetAllTeamsMode(false);
    selectPreferredTeam(gvTeamChoice.dataset.gvTeamId);
    gvTeamPickerClose();
    if(currentView==='gameview')renderGameView();
    return;
  }
  if(!e.target.closest?.('.gameview-team-switcher-copy'))gvTeamPickerClose();
  const btn=e.target.closest?.('button');if(!btn)return;
  if(btn.dataset.testingTab){testingSetTab(btn.dataset.testingTab);return;}
  if(btn.id==='testingLiveDebugClear'){testingLiveDebugPlays.length=0;renderTestingLiveDebug();return;}
  if(btn.id==='clearTestingLogBtn'){
    testingLog.length=0;testingSequenceStateReset();saveTestingState();renderTestingArea();return;
  }
  if(btn.dataset.testingTeam){
    testingTeamFilter=btn.dataset.testingTeam||'all';saveTestingState();renderTestingArea();return;
  }
  if(btn.dataset.testingPos){
    testingPosFilter=btn.dataset.testingPos||'all';saveTestingState();renderTestingArea();return;
  }
  if(btn.id==='testingDeltaQuickRun'){
    testingRunQuickDelta();return;
  }
  if(btn.id==='testingPlayRun'){
    gvTestingRunSimplePlay();return;
  }
  if(btn.id==='testingDeltaSend'){
    testingReconcileSyntheticDeltas();return;
  }
  if(btn.id==='testingDeltaReset'){
    testingResetDeltaSimulator();testingUpdateDeltaPreview();return;
  }
  if(btn.dataset.deltaPreset){
    testingApplyDeltaPreset(btn.dataset.deltaPreset);return;
  }
  if(btn.dataset.sequencePreset){
    testingRunSequencePreset(btn.dataset.sequencePreset);return;
  }
  if(btn.dataset.testScoreSide&&btn.dataset.testScoreDelta){
    gvTestingAdjustScore(btn.dataset.testScoreSide,Number(btn.dataset.testScoreDelta));return;
  }
  if(btn.id==='testingScoreReset'){
    gvTestingResetCloseScore();return;
  }
  if(btn.dataset.testSide&&btn.dataset.testPlay){
    gvRunForcedTest(btn.dataset.testSide,btn.dataset.testPlay);return;
  }
});

document.addEventListener('keydown',e=>{
  const link=e.target?.closest?.('[data-gameday-gv-roster]');
  if(!link||!['Enter',' '].includes(e.key))return;
  e.preventDefault();
  selectPreferredTeam(link.dataset.gamedayGvRoster);
  setView('gameview');
});

document.addEventListener('wheel',e=>{
  const el=e.target;
  if(!el?.matches?.('#testingView input[type="number"]')||document.activeElement!==el)return;
  e.preventDefault();
  const step=Number(el.step||1)||1;
  const min=el.min===''?-Infinity:Number(el.min);
  const max=el.max===''?Infinity:Number(el.max);
  const cur=Number(el.value||0);
  const next=Math.min(max,Math.max(min,cur+(e.deltaY<0?step:-step)));
  el.value=String(next);
  el.dispatchEvent(new Event('input',{bubbles:true}));
},{passive:false});


document.addEventListener('input',e=>{
  if(e.target?.closest?.('.testing-delta-sim'))testingUpdateDeltaPreview();
});

document.addEventListener('change',e=>{
  if(e.target?.id==='testingPlayPositionSelect'){gvTestingPopulateSimplePlaySelect();return}
  if(e.target?.id==='testingPlayTeamSelect'){testingRefreshAllPlayerSelectors();return;
  }
  if(e.target?.id==='testingPlaySelect'){gvTestingUpdateSimplePlaySummary();return}
  if(['testingPlayTandemPasser','testingPlayTandemReceiver'].includes(e.target?.id)){
    const other=e.target.id==='testingPlayTandemPasser'?'testingPlayTandemReceiver':'testingPlayTandemPasser';
    if(e.target.value&&e.target.value===$('#'+other)?.value)testingPopulateTandemPair('play');
    gvTestingUpdateSimplePlaySummary();return;
  }
  if(e.target?.id==='testingDeltaTeamSelect'){testingRefreshAllPlayerSelectors();return;
  }
  if(e.target?.id==='testingDeltaPositionSelect'){testingPopulateDeltaPlaySelect();return}
  if(e.target?.id==='testingDeltaPlaySelect'){testingPopulateDeltaValueSelect(true);testingUpdateQuickDeltaSummary();return}
  if(e.target?.id==='testingDeltaValueSelect'){testingUpdateQuickDeltaSummary();return}
  if(['testingDeltaTandemPasser','testingDeltaTandemReceiver'].includes(e.target?.id)){
    const other=e.target.id==='testingDeltaTandemPasser'?'testingDeltaTandemReceiver':'testingDeltaTandemPasser';
    if(e.target.value&&e.target.value===$('#'+other)?.value)testingPopulateTandemPair('delta');
    testingUpdateQuickDeltaSummary();return;
  }
  if(e.target?.closest?.('.testing-delta-sim'))testingUpdateDeltaPreview();
  if(e.target?.id==='settingsTeamSelect'){
    selectPreferredTeam(e.target.value);
    return;
  }
  if(e.target?.id==='firstRunThemeSelect'){
    applyTheme(e.target.value);
    return;
  }

  if(e.target?.id==='testingRawToggle'){
    testingRawVisible=!!e.target.checked;saveTestingState();renderTestingArea();
  }
});


document.addEventListener('DOMContentLoaded',()=>{testingInitTabs();testingPanelStateBind();if(typeof gvTestingRenderIdleScore==='function')gvTestingRenderIdleScore();if(typeof testingInitSimpleControls==='function')testingInitSimpleControls();if(typeof testingRefreshAllPlayerSelectors==='function')testingRefreshAllPlayerSelectors()},{once:true});
document.querySelectorAll('.primary-nav [data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('#settingsClose').onclick=closeSettings;
$('#resolveMissingPlayersBtn').onclick=resolveMissingPlayersNow;
$('#exportSaveDataBtn').onclick=exportGameDaySave;
$('#importSaveDataBtn').onclick=()=>$('#importSaveDataFile').click();
$('#importSaveDataFile').onchange=e=>{const file=e.target.files?.[0];if(file)importGameDaySaveFile(file)};
$('#simStart').onclick=startSimulation;$('#simPause').onclick=toggleSimulationPause;$('#simStop').onclick=stopSimulation;
$('#liveLoadingToggle').onchange=e=>setLiveLoading(!!e.target.checked);
$('#testingAreaVisibleToggle').onchange=e=>setTestingAreaVisible(!!e.target.checked);
gameViewAllTeamsMode=storage.get(GAMEVIEW_ALL_TEAMS_PREF_KEY,'off')==='on';
$('#simSpeed').value=storage.get('ucl-gameday-sim-speed','20');
$('#simStyle').value=storage.get('ucl-gameday-sim-style','chaos');
const savedSimScenario=normalizeSimulationScenarioId(storage.get('ucl-gameday-sim-scenario','full'));
$('#simScenario').value=savedSimScenario;
simulation.scenario=savedSimScenario;
if(quickGameViewScenario()){simulation.speed=1;$('#simSpeed').value='1';$('#simSpeed').disabled=true}
else simulation.speed=Number($('#simSpeed').value)||20;
$('#simScenario').onchange=e=>{const v=normalizeSimulationScenarioId(e.target.value);applySimulationScenarioChoice(v);storage.set('ucl-gameday-sim-scenario',v);updateSimulationUi()};
$('#simSpeed').onchange=rememberSimulationSpeed;
$('#simOpenGameView').checked=simOpenGameViewEnabled();
$('#simOpenGameView').onchange=e=>storage.set(SIM_OPEN_GAMEVIEW_KEY,e.target.checked?'on':'off');
applyTheme(storage.get('ucl-gameday-theme','UCL Blue'));
if(liveLoadingEnabled()){
  loadRosterCacheV2();
  loadRosterCache();
  loadDiscoveredPlayers();
  restoreLiveSnapshot();
  ensureDefaultUclTeams();
}else{
  loadSavedGameDayData();
}
if(rosters.length)populateControls();
updateSimulationUi();updateLiveLoadingUi();updateTestingAreaVisibilityUi();
window.addEventListener('orientationchange',()=>{cancelGameViewPlayback(true);renderGameView()});

window.addEventListener('pagehide',()=>{if(clearingLocalAppData)return;try{gvSaveSession()}catch(e){}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!clearingLocalAppData){try{gvSaveSession()}catch(e){}}});

if(liveLoadingEnabled()){
  // Use the exact same full sync path as the manual Refresh Live button for the
  // first authoritative render. Do not put a slower prerequisite pass in front of it.
  sync().finally(()=>{
    refreshNflActivityUi();
    startNflActivityUiTimer();
    // Any still-missing optional metadata can hydrate afterward without blocking first sync.
    ensureInitialActivityPrerequisites();
  });
  timer=setInterval(sync,POLL_MS);
}else{
  loadSavedGameDayData();
  ensureInitialActivityPrerequisites().finally(()=>{
    render();updateLiveLoadingUi();refreshNflActivityUi();startNflActivityUiTimer();
  });
}
})();

document.addEventListener('click',e=>{
  if(e.target?.closest?.('[data-view="settings"],#settingsBtn,[data-target="settings"]')){
    setTimeout(()=>window.ensureNotificationSettingsControls?.(),0);
  }
});
setTimeout(()=>window.ensureNotificationSettingsControls?.(),0);
