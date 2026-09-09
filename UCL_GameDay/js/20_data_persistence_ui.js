/* UCL GameDay v0.5.03 — build fragment: 20_data_persistence_ui.js
   This file is concatenated in manifest order into the app's single lexical scope.
   It is intentionally not loaded independently in the browser. */
function saveDiscoveredPlayers(){
  try{
    return storage.set(DISCOVERED_PLAYERS_KEY,JSON.stringify({
      savedAt:Date.now(),
      count:Object.keys(discoveredSleeperPlayers).length,
      players:discoveredSleeperPlayers
    }));
  }catch(e){return false}
}

function playerMetadataFallback(playerId){
  const id=String(playerId||'');
  const raw=players?.[id];
  return raw&&typeof raw==='object'?raw:null;
}

function learnDiscoveredPlayer(id,raw){
  const key=String(id||'');
  if(!key||!raw)return false;
  const normalized=normalizeDiscoveredPlayer(raw);
  if(!normalized)return false;
  const prior=discoveredSleeperPlayers[key];
  const same=prior &&
    prior.full_name===normalized.full_name &&
    prior.position===normalized.position &&
    prior.team===normalized.team &&
    prior.injury_status===normalized.injury_status &&
    prior.status===normalized.status;
  if(same)return false;
  discoveredSleeperPlayers[key]=normalized;
  return true;
}

function referencedPlayerIds(){
  const ids=new Set(),add=id=>{if(id!=null&&String(id)!=='')ids.add(String(id))};
  for(const r of rosters||[]){
    for(const id of (r.players||[]))add(id);
    for(const id of (r.starters||[]))add(id);
    for(const id of (r.reserve||[]))add(id);
    for(const id of (r.taxi||[]))add(id);
  }
  for(const m of matchups||[]){
    for(const id of (m.players||[]))add(id);
    for(const id of (m.starters||[]))add(id);
    if(m.players_points&&typeof m.players_points==='object')for(const id of Object.keys(m.players_points))add(id);
  }
  return ids;
}

function ingestReferencedPlayersFromMap(source){
  if(!source||typeof source!=='object')return 0;
  let learned=0;
  for(const id of referencedPlayerIds()){
    if(source[id]&&learnDiscoveredPlayer(id,source[id]))learned++;
  }
  if(learned)saveDiscoveredPlayers();
  return learned;
}

function missingReferencedPlayerIds(){
  return [...referencedPlayerIds()].filter(id=>!discoveredSleeperPlayers[id]&&!playerMetadataFallback(id));
}

async function resolveMissingReferencedPlayers(){
  const missing=missingReferencedPlayerIds();
  if(!missing.length)return 0;
  const all=await get(`${API}/players/nfl`);
  if(!all||typeof all!=='object')return 0;
  let learned=0;
  for(const id of missing){
    if(all[id]&&learnDiscoveredPlayer(id,all[id]))learned++;
  }
  if(learned)saveDiscoveredPlayers();
  players={};
  return learned;
}

function migrateLegacyPlayerCaches(){
  const keys=['ucl-gameday-player-cache-v3','ucl-gameday-player-cache-v2','ucl-gameday-players-cache-v1'];
  let learned=0;
  for(const key of keys){
    try{
      const raw=storage.get(key,'');if(!raw)continue;
      const c=JSON.parse(raw),map=(c?.players&&typeof c.players==='object')?c.players:null;
      if(map)learned+=ingestReferencedPlayersFromMap(map);
    }catch(e){}
  }
  if(learned)saveDiscoveredPlayers();
  return learned;
}

function saveRosterCacheV2(){
  try{
    storage.set(ROSTER_CACHE_V2_KEY,JSON.stringify({
      savedAt:Date.now(),
      users:Array.isArray(users)?users:[],
      rosters:Array.isArray(rosters)?rosters:[],
      matchups:Array.isArray(matchups)?matchups:[],
      nflState:nflState||{}
    }));
  }catch(e){}
}

function loadRosterCacheV2(){
  let loaded=false;
  try{
    const raw=storage.get(ROSTER_CACHE_V2_KEY,'');
    if(raw){
      const c=JSON.parse(raw);
      if(Array.isArray(c?.users)&&c.users.length){users=c.users;loaded=true}
      if(Array.isArray(c?.rosters)&&c.rosters.length){rosters=c.rosters;loaded=true}
      if(Array.isArray(c?.matchups)&&c.matchups.length){matchups=c.matchups;loaded=true}
      if(c?.nflState&&typeof c.nflState==='object')nflState=c.nflState;
    }
  }catch(e){}
  return loaded;
}

function saveRosterCache(){
  try{
    storage.set(ROSTER_CACHE_KEY,JSON.stringify({savedAt:Date.now(),users,rosters,matchups,nflState}));
  }catch(e){}
}

function loadRosterCache(){
  try{
    const raw=storage.get(ROSTER_CACHE_KEY,'');if(!raw)return false;
    const c=JSON.parse(raw);if(!c)return false;
    if(Array.isArray(c.users)&&c.users.length)users=c.users;
    if(Array.isArray(c.rosters)&&c.rosters.length)rosters=c.rosters;
    if(Array.isArray(c.matchups)&&c.matchups.length)matchups=c.matchups;
    if(c.nflState&&typeof c.nflState==='object')nflState=c.nflState;
    if(c.players&&typeof c.players==='object')ingestReferencedPlayersFromMap(c.players);
    return !!(rosters.length||matchups.length||users.length);
  }catch(e){return false}
}

function loadSavedGameDayData(){
  let loaded=false;
  try{if(loadDiscoveredPlayers())loaded=true}catch(e){}
  try{if(loadRosterCacheV2())loaded=true}catch(e){}
  try{if(loadRosterCache())loaded=true}catch(e){}
  try{if(restoreLiveSnapshot())loaded=true}catch(e){}
  try{if(migrateLegacyPlayerCaches())loaded=true}catch(e){}
  const usedDefaultTeams=ensureDefaultUclTeams();
  if(rosters.length&&!$('#teamSelect').options.length)loadTestingState();
  populateControls();
  return loaded||usedDefaultTeams;
}

function liveLoadingEnabled(){return storage.get(LIVE_LOADING_KEY,'off')==='on'}
function saveLiveSnapshot(){
  try{storage.set(LIVE_SNAPSHOT_KEY,JSON.stringify({savedAt:Date.now(),nflState,users,rosters,matchups}))}catch(e){}
}
function restoreLiveSnapshot(){
  try{
    const raw=storage.get(LIVE_SNAPSHOT_KEY,'');if(!raw)return false;
    const c=JSON.parse(raw);if(!c||!Array.isArray(c.rosters)||!Array.isArray(c.matchups))return false;
    nflState=c.nflState||nflState;users=c.users||[];rosters=c.rosters||[];matchups=c.matchups||[];
    if(c.players&&typeof c.players==='object')ingestReferencedPlayersFromMap(c.players);
    return !!(rosters.length&&matchups.length);
  }catch(e){return false}
}
function setRefreshButtonLabel(label){
  const refresh=$('#refreshBtn');if(!refresh)return;
  let labelEl=refresh.querySelector('.refresh-label');
  if(!labelEl){
    labelEl=document.createElement('span');labelEl.className='refresh-label';refresh.appendChild(labelEl);
  }
  labelEl.textContent=label;
}

function updateLiveLoadingUi(){
  const enabled=liveLoadingEnabled(),toggle=$('#liveLoadingToggle'),note=$('#liveOffNote'),refresh=$('#refreshBtn');
  if(toggle)toggle.checked=enabled;
  if(note)note.classList.toggle('show',!enabled);
  if(refresh&&!simulation.active){refresh.disabled=!enabled;setRefreshButtonLabel(enabled?'Refresh Live':'Live Loading Off')}
  if(!enabled&&!simulation.active){
    
    if($('#liveDot'))$('#liveDot').classList.remove('on');
  }
}
function setLiveLoading(enabled){
  storage.set(LIVE_LOADING_KEY,enabled?'on':'off');
  if(timer){clearInterval(timer);timer=null}
  updateLiveLoadingUi();renderPlayerDataStatus();

  if(enabled){
    sync();
    timer=setInterval(sync,POLL_MS);
    return;
  }

  // Offline mode still hydrates the most recent locally-saved GameDay data.
  loadSavedGameDayData();
  updateSimulationUi();
  render();
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function n(v){const x=Number(v);return Number.isFinite(x)?x:0}function pts(v){return n(v).toFixed(2)}
function owner(roster){return users.find(u=>String(u.user_id)===String(roster?.owner_id))||{}}
function teamName(roster){const u=owner(roster);return roster?.metadata?.team_name||u.display_name||u.username||`Roster ${roster?.roster_id??'—'}`}
function record(roster){const s=roster?.settings||{};return `${n(s.wins)}-${n(s.losses)}${n(s.ties)?`-${n(s.ties)}`:''}`}
function matchupPairs(){const by=new Map();for(const m of matchups){const id=String(m.matchup_id??m.roster_id);if(!by.has(id))by.set(id,[]);by.get(id).push(m)}return [...by.entries()].map(([id,rows])=>({id,rows:rows.slice(0,2),total:rows.reduce((a,x)=>a+n(x.points),0)})).filter(x=>x.rows.length===2).sort((a,b)=>n(a.id)-n(b.id));}
function rosterFor(id){return rosters.find(r=>String(r.roster_id)===String(id))}
function pointMap(m){return m?.players_points||{}}
function playerInfo(id){
  const key=String(id||'');
  const raw=discoveredSleeperPlayers[key]||playerMetadataFallback(key)||{};
  const full=raw.full_name||[raw.first_name,raw.last_name].filter(Boolean).join(' ');
  const pos=String(raw.position||raw.fantasy_positions?.[0]||'').toUpperCase();
  return {
    id:key,
    name:full||`Player ${key}`,
    pos:pos==='DST'?'DEF':(pos||'—'),
    team:String(raw.team||'FA').toUpperCase(),
    status:String(raw.injury_status||raw.status||'')
  };
}
function starterRows(m){const ids=(m?.starters||[]).filter(Boolean);return ids.map((id,i)=>({id:String(id),slot:['QB','RB','RB','WR','WR','WR','FLEX','K','DEF'][i]||'START',...playerInfo(id),points:n(pointMap(m)[id])}))}
function renderThemeOptions(){
  const selected=storage.get('ucl-gameday-theme','UCL Blue');
  document.querySelectorAll('.theme-option').forEach(btn=>{
    const name=btn.dataset.themeChoice,colors=THEMES[name]||THEMES['UCL Blue'],preview=btn.querySelector('.theme-preview');
    if(preview)preview.innerHTML=colors.map(c=>`<i style="background:${c}"></i>`).join('');
    const active=name===selected;btn.classList.toggle('active',active);btn.setAttribute('aria-checked',active?'true':'false');
    btn.onclick=()=>applyTheme(name);
  });
}
function applyTheme(name){const t=THEMES[name]||THEMES['UCL Blue'];document.documentElement.style.setProperty('--navy',t[0]);document.documentElement.style.setProperty('--accent',t[1]);document.documentElement.style.setProperty('--accent2',t[2]);document.documentElement.style.setProperty('--bg',t[3]);document.querySelector('meta[name=theme-color]').content=t[0];storage.set('ucl-gameday-theme',name);renderThemeOptions();syncThemePreferenceControls()}

const FIRST_RUN_SETUP_KEY='ucl-gameday-first-run-setup-v1';

function syncTeamPreferenceControls(){
  const source=$('#teamSelect');if(!source)return;
  for(const target of [$('#settingsTeamSelect'),$('#firstRunTeamSelect')]){
    if(!target)continue;
    target.innerHTML=source.innerHTML;
    target.value=source.value;
  }
}
function syncThemePreferenceControls(){
  const current=storage.get('ucl-gameday-theme','UCL Blue');
  const first=$('#firstRunThemeSelect');
  if(first)first.value=current;
}
function selectPreferredTeam(rosterId){
  const sel=$('#teamSelect');if(!sel||!rosterId)return;
  const valid=[...sel.options].some(o=>String(o.value)===String(rosterId));
  if(!valid)return;
  sel.value=String(rosterId);
  storage.set('ucl-gameday-team',sel.value);
  featuredMatchupId=pairForRoster(sel.value)?.id||featuredMatchupId;
  syncTeamPreferenceControls();
  testingPopulateDeltaPlayers();
  render();
}
function firstRunIsComplete(){
  try{return storage.get(FIRST_RUN_SETUP_KEY,'')==='1'}catch(e){return false}
}
function showFirstRunSetupIfNeeded(){
  const modal=$('#firstRunBackdrop');if(!modal)return;
  syncTeamPreferenceControls();syncThemePreferenceControls();
  modal.hidden=firstRunIsComplete();
}
function completeFirstRunSetup(){
  const team=$('#firstRunTeamSelect')?.value;
  const theme=$('#firstRunThemeSelect')?.value;
  const status=$('#firstRunStatus');
  if(!team){
    if(status)status.textContent='Choose your team to continue.';
    return;
  }
  selectPreferredTeam(team);
  if(theme)applyTheme(theme);
  storage.set(FIRST_RUN_SETUP_KEY,'1');
  const modal=$('#firstRunBackdrop');if(modal)modal.hidden=true;
}

function populateControls(){applyTheme(storage.get('ucl-gameday-theme','UCL Blue'));renderThemeOptions();
 renderCtespnMatchupAlertSettings();
 const sel=$('#teamSelect'),saved=storage.get('ucl-gameday-team','dmercado');sel.innerHTML=rosters.map(r=>{const u=owner(r);const label=u.display_name||u.username||teamName(r);return `<option value="${esc(r.roster_id)}">${esc(label)}</option>`}).join('');const wanted=rosters.find(r=>String(owner(r).username||owner(r).display_name).toLowerCase()===saved.toLowerCase())||rosters.find(r=>String(r.roster_id)===saved)||rosters[0];if(wanted)sel.value=String(wanted.roster_id);sel.onchange=()=>{storage.set('ucl-gameday-team',sel.value);featuredMatchupId=pairForRoster(sel.value)?.id||featuredMatchupId;syncTeamPreferenceControls();render()};syncTeamPreferenceControls();syncThemePreferenceControls();showFirstRunSetupIfNeeded();}
function pairForRoster(rosterId){return matchupPairs().find(p=>p.rows.some(m=>String(m.roster_id)===String(rosterId)))}

const CTESPN_SCORE_ALERT_PREFS_KEY='ucl-gameday-ctespn-score-alert-matchups-v1';
function ctespnAlertPrefsWeekKey(){
  const season=String(nflState?.season||new Date().getFullYear()),type=String(nflState?.season_type||'regular'),week=Number(nflState?.week||1);
  return `${season}:${type}:week-${week}`;
}
function ctespnScoreAlertPrefs(){
  try{const raw=JSON.parse(storage.get(CTESPN_SCORE_ALERT_PREFS_KEY,'{}'))||{};return raw&&typeof raw==='object'?raw:{}}catch(e){return {}}
}
function ctespnDisabledAlertPairIds(){
  const prefs=ctespnScoreAlertPrefs(),ids=prefs[ctespnAlertPrefsWeekKey()];
  return new Set(Array.isArray(ids)?ids.map(String):[]);
}
function ctespnAlertsDisabledForPair(pairId){return ctespnDisabledAlertPairIds().has(String(pairId))}
function ctespnSetPairAlertsEnabled(pairId,enabled){
  const prefs=ctespnScoreAlertPrefs(),wk=ctespnAlertPrefsWeekKey(),disabled=new Set(Array.isArray(prefs[wk])?prefs[wk].map(String):[]),id=String(pairId);
  if(enabled)disabled.delete(id);else disabled.add(id);
  prefs[wk]=[...disabled];
  storage.set(CTESPN_SCORE_ALERT_PREFS_KEY,JSON.stringify(prefs));
  if(!enabled&&typeof ctespnRemoveQueuedAlertsForPair==='function')ctespnRemoveQueuedAlertsForPair(id);
}
function ctespnMatchupSettingLabel(pair){
  const rows=pair?.rows||[];
  const names=rows.map(r=>teamName(rosterFor(r.roster_id)));
  return names.length===2?`${names[0]} vs ${names[1]}`:`Matchup ${pair?.id??'—'}`;
}
function renderCtespnMatchupAlertSettings(){
  const host=$('#ctespnMatchupAlertSettings');if(!host)return;
  const pairs=matchupPairs();
  if(!pairs.length){host.innerHTML='<div class="ctespn-matchup-alert-empty">No saved matchup data is available for this week yet.</div>';return}
  const disabled=ctespnDisabledAlertPairIds(),wk=Number(nflState?.week||1);
  host.innerHTML=pairs.map(pair=>{
    const id=String(pair.id),checked=!disabled.has(id);
    return `<label class="ctespn-matchup-alert-row"><span><b>${esc(ctespnMatchupSettingLabel(pair))}</b><small>Week ${wk} • matchup ${esc(id)}</small></span><input class="settings-toggle" type="checkbox" data-ctespn-alert-pair="${esc(id)}" ${checked?'checked':''} aria-label="Enable CTESPN score alerts for ${esc(ctespnMatchupSettingLabel(pair))}"></label>`;
  }).join('');
  host.querySelectorAll('[data-ctespn-alert-pair]').forEach(box=>box.onchange=()=>ctespnSetPairAlertsEnabled(box.dataset.ctespnAlertPair,!!box.checked));
}



function discoveredPlayerSavedAt(){
  try{
    const raw=storage.get(DISCOVERED_PLAYERS_KEY,'');if(!raw)return null;
    const parsed=JSON.parse(raw);
    const t=Number(parsed?.savedAt||0);
    return Number.isFinite(t)&&t>0?t:null;
  }catch(e){return null}
}
function currentPlayerDataHealth(){
  const refs=[...referencedPlayerIds()];
  const known=refs.filter(id=>!!discoveredSleeperPlayers[id]||!!playerMetadataFallback(id));
  const missing=refs.filter(id=>!discoveredSleeperPlayers[id]&&!playerMetadataFallback(id));
  return {
    discovered:Object.keys(discoveredSleeperPlayers).length,
    referenced:refs.length,
    known:known.length,
    missing
  };
}
function renderPlayerDataStatus(message=''){
  const summary=$('#playerDataSummary'),status=$('#playerDataStatus'),btn=$('#resolveMissingPlayersBtn');
  if(!summary||!status)return;
  const h=currentPlayerDataHealth(),savedAt=discoveredPlayerSavedAt();
  const saved=savedAt?new Date(savedAt).toLocaleString():'not saved yet';
  summary.textContent=`${h.discovered} stored • ${h.known}/${h.referenced} current roster IDs resolved • saved ${saved}`;
  if(message)status.textContent=message;
  else if(h.missing.length)status.textContent=`${h.missing.length} unresolved player ID${h.missing.length===1?'':'s'}: ${h.missing.slice(0,8).join(', ')}${h.missing.length>8?'…':''}`;
  else status.textContent=h.referenced?'All current roster player IDs are resolved.':'No current roster player IDs are loaded.';
  if(btn){
    btn.disabled=!liveLoadingEnabled()||!h.missing.length;
    btn.textContent=h.missing.length?`Resolve Missing (${h.missing.length})`:'All Resolved';
  }
}
async function resolveMissingPlayersNow(){
  const btn=$('#resolveMissingPlayersBtn');
  if(!liveLoadingEnabled()){
    renderPlayerDataStatus('Live Loading is off. Enable it to resolve new player IDs from Sleeper.');
    return;
  }
  if(btn)btn.disabled=true;
  renderPlayerDataStatus('Resolving missing player data…');
  try{
    const learned=await resolveMissingReferencedPlayers();
    render();
    renderPlayerDataStatus(learned?`${learned} player${learned===1?'':'s'} resolved and saved.`:'No additional player metadata was needed.');
  }catch(e){
    (typeof appendJsError==='function')&&appendJsError(e?.stack||e?.message||String(e));
    renderPlayerDataStatus(`Resolve failed: ${e?.message||e}`);
  }
}

const GAMEDAY_BACKUP_SCHEMA=1;
function gameDayBackupKeys(){
  return [
    DISCOVERED_PLAYERS_KEY,
    GAMEVIEW_SESSION_KEY,
    ROSTER_CACHE_KEY,
    ROSTER_CACHE_V2_KEY,
    LIVE_SNAPSHOT_KEY,
    LIVE_LOADING_KEY,
    SIM_OPEN_GAMEVIEW_KEY,
    CTESPN_SCORE_ALERT_PREFS_KEY,
    'ucl-gameday-theme',
    'ucl-gameday-sim-speed',
    'ucl-gameday-sim-style',
    'ucl-gameday-sim-scenario',
    'ucl-gameday-score-history-v1'
  ];
}
function createGameDayBackup(){
  const data={};
  for(const key of gameDayBackupKeys()){
    try{
      const value=localStorage.getItem(key);
      if(value!==null)data[key]=value;
    }catch(e){}
  }
  return {
    app:'UCL GameDay',
    version:VERSION,
    schema:GAMEDAY_BACKUP_SCHEMA,
    exportedAt:new Date().toISOString(),
    data
  };
}
function exportGameDaySave(){
  try{
    const backup=createGameDayBackup();
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    const stamp=new Date().toISOString().replace(/[:.]/g,'-');
    a.href=url;
    a.download=`UCL_GameDay_Save_${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    const status=$('#saveDataStatus');
    if(status)status.textContent=`Save data exported • ${Object.keys(backup.data).length} stored items`;
  }catch(e){
    (typeof appendJsError==='function')&&appendJsError(e?.stack||e?.message||String(e));
    const status=$('#saveDataStatus');
    if(status)status.textContent='Save data export failed.';
  }
}
function validateGameDayBackup(parsed){
  return !!(parsed&&parsed.app==='UCL GameDay'&&Number(parsed.schema)>=1&&parsed.data&&typeof parsed.data==='object');
}
async function importGameDaySaveFile(file){
  const status=$('#saveDataStatus');
  try{
    const raw=await file.text();
    const parsed=JSON.parse(raw);
    if(!validateGameDayBackup(parsed))throw new Error('This file is not a valid UCL GameDay backup.');

    const allowed=new Set(gameDayBackupKeys());
    let restored=0;
    for(const [key,value] of Object.entries(parsed.data||{})){
      if(!allowed.has(key)||typeof value!=='string')continue;
      if(storage.set(key,value))restored++;
    }

    // Rehydrate runtime state from imported storage without contacting Sleeper.
    discoveredSleeperPlayers={};
    users=[];rosters=[];matchups=[];players={};
    loadSavedGameDayData();
    if(rosters.length)populateControls();
if(rosters.length&&matchups.length){gvEnsureSession();gvRestorePlaybackQueue();}
    updateSimulationUi();
    updateLiveLoadingUi();
    applyTheme(storage.get('ucl-gameday-theme','UCL Blue'));
    render();

    if(status)status.textContent=`Save data imported • ${restored} stored items restored`;renderPlayerDataStatus();
  }catch(e){
    (typeof appendJsError==='function')&&appendJsError(e?.stack||e?.message||String(e));
    if(status)status.textContent=`Import failed: ${e?.message||e}`;
  }finally{
    const input=$('#importSaveDataFile');
    if(input)input.value='';
  }
}

function openSettings(){
  const dialog=$('#settingsDialog');
  if(!dialog)return;
  if(typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal()}
  else dialog.setAttribute('open','');
  updateSimulationUi();updateLiveLoadingUi();renderThemeOptions();
  renderCtespnMatchupAlertSettings();renderPlayerDataStatus();
}
function closeSettings(){
  const dialog=$('#settingsDialog');
  if(!dialog)return;
  if(typeof dialog.close==='function'&&dialog.open)dialog.close();
  else dialog.removeAttribute('open');
}


function gvFieldWrap(){
  return $('#gameViewField')?.closest('.gameview-field-wrap')||null;
}
function gvMountFieldForTesting(){
  const wrap=gvFieldWrap(),mount=$('#testingGameViewMount');
  if(wrap&&mount&&wrap.parentElement!==mount)mount.appendChild(wrap);
  const pair=chosenPair?.();
  if(pair){
    const p=orientedPair(pair),a=p.rows?.[0],b=p.rows?.[1];
    const ar=a?rosterFor(a.roster_id):null,br=b?rosterFor(b.roster_id):null;
    const an=ar?teamName(ar):'My Team',bn=br?teamName(br):'Opponent';
    if($('#testLeftName'))$('#testLeftName').textContent=an;
    if($('#testRightName'))$('#testRightName').textContent=bn;
    if($('#testScoreControlLeftName'))$('#testScoreControlLeftName').textContent=an;
    if($('#testScoreControlRightName'))$('#testScoreControlRightName').textContent=bn;
  }
  const tls=$('#testLeftScore'),trs=$('#testRightScore');
  if(typeof gvTestingRenderIdleScore==='function'&&(!tls||!/^-?\d+(?:\.\d+)?$/.test(String(tls.textContent||'').trim())||!trs||!/^-?\d+(?:\.\d+)?$/.test(String(trs.textContent||'').trim())))gvTestingRenderIdleScore();
}
function gvRestoreFieldHome(){
  const wrap=gvFieldWrap(),home=$('#gameViewFieldHome');
  if(wrap&&home&&wrap.parentElement!==home)home.appendChild(wrap);
}

function setView(view){
  if(view==='settings'){openSettings();return}
  currentView=['gameday','gameview','testing'].includes(view)?view:'gameday';

  if(currentView==='testing')gvMountFieldForTesting();
  else gvRestoreFieldHome();

  const gameDayView=$('#gameContentView');
  const gameView=$('#gameView');
  const testingView=$('#testingView');

  if(gameDayView)gameDayView.hidden=currentView!=='gameday';
  if(gameView)gameView.hidden=currentView!=='gameview';
  if(testingView)testingView.hidden=currentView!=='testing';

  document.querySelectorAll('.primary-nav [data-view]').forEach(
    b=>b.classList.toggle('active',b.dataset.view===currentView)
  );

  if(currentView==='gameday')render();
  if(currentView==='testing'){
    renderTestingArea();
    gvMountFieldForTesting();
    // v0.4.38: do not destroy an in-flight Testing Area animation merely
    // because another test button re-selects the Testing view.
    if(!gameViewPlaying)clearGameViewEffects(true);
  }
  if(currentView==='gameview'){
    gvRestoreFieldHome();
    gvRestorePlaybackQueue();
    renderGameView();
    if(!gameViewPlaying)playNextGameViewEvent();
    if(!gameViewPlaying)clearGameViewEffects(true);
  }
}

