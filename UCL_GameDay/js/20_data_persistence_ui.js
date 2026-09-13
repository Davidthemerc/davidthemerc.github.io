/* UCL GameDay v0.5.51 — build fragment: 20_data_persistence_ui.js
   This file is concatenated in manifest order into the app's single lexical scope.
   It is intentionally not loaded independently in the browser. */

function ensureNotificationSettingsControls(){
  const toggle=document.getElementById('notificationSoundsToggle');
  const slider=document.getElementById('notificationVolumeControl');
  const value=document.getElementById('notificationVolumeValue');
  if(!toggle||!slider||!value)return;
  const prefs=window.getNotificationSettings?window.getNotificationSettings():{enabled:true,volume:1};
  toggle.checked=!!prefs.enabled;
  slider.value=String(Math.round((prefs.volume??1)*100));
  value.textContent=`${slider.value}%`;
  slider.disabled=!toggle.checked;
  if(toggle.dataset.bound==='1')return;
  toggle.dataset.bound='1';
  toggle.addEventListener('change',()=>{
    window.setNotificationSoundsEnabled?.(toggle.checked);
    slider.disabled=!toggle.checked;
  });
  slider.addEventListener('input',()=>{
    value.textContent=`${slider.value}%`;
    window.setNotificationVolume?.(Number(slider.value)/100);
  });
}
window.ensureNotificationSettingsControls=ensureNotificationSettingsControls;

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


const NFL_SCHEDULE_CACHE_KEY='ucl-gameday-nfl-schedule-status-v4';
const NFL_SCHEDULE_REFRESH_MS=60000;
const NFL_GAME_WINDOW_EARLY_MS=5*60*1000;
const NFL_GAME_WINDOW_LATE_MS=4.5*60*60*1000;

function normalizeNflTeamCode(team){
  const raw=String(team||'').trim().toUpperCase();
  return ({JAC:'JAX',WSH:'WAS',LA:'LAR',OAK:'LV',SD:'LAC'})[raw]||raw;
}
function nflScheduleSeasonType(){
  const raw=String(nflState?.season_type||leagueInfo?.season_type||'regular').toLowerCase();
  if(raw.startsWith('pre'))return 'pre';
  if(raw.startsWith('post'))return 'post';
  return 'regular';
}

function nflScheduleGameKey(game){
  const teams=nflScheduleTeams(game),week=nflScheduleWeek(game);
  if(!teams.away||!teams.home)return '';
  return `${week||0}:${teams.away}@${teams.home}`;
}
const KNOWN_NFL_KICKOFFS_2026=Object.freeze({
  '1:NE@SEA':'2026-09-10T00:20:00Z',
  '1:SF@LAR':'2026-09-11T00:35:00Z',
  '1:ATL@PIT':'2026-09-13T17:00:00Z',
  '1:BAL@IND':'2026-09-13T17:00:00Z',
  '1:BUF@HOU':'2026-09-13T17:00:00Z',
  '1:CHI@CAR':'2026-09-13T17:00:00Z',
  '1:CLE@JAX':'2026-09-13T17:00:00Z',
  '1:NO@DET':'2026-09-13T17:00:00Z',
  '1:NYJ@TEN':'2026-09-13T17:00:00Z',
  '1:TB@CIN':'2026-09-13T17:00:00Z',
  '1:ARI@LAC':'2026-09-13T20:25:00Z',
  '1:GB@MIN':'2026-09-13T20:25:00Z',
  '1:MIA@LV':'2026-09-13T20:25:00Z',
  '1:WAS@PHI':'2026-09-13T20:25:00Z',
  '1:DAL@NYG':'2026-09-14T00:20:00Z',
  '1:DEN@KC':'2026-09-15T00:15:00Z'
});
function nflKnownKickoffMs(game){
  const season=String(nflState?.season||leagueInfo?.season||new Date().getFullYear());
  if(season!=='2026')return 0;
  const raw=KNOWN_NFL_KICKOFFS_2026[nflScheduleGameKey(game)]||'';
  const ms=raw?Date.parse(raw):0;
  return Number.isFinite(ms)?ms:0;
}
function loadNflKickoffCache(){
  try{
    const raw=storage.get(NFL_KICKOFF_CACHE_KEY,'');if(!raw)return false;
    const c=JSON.parse(raw),rows=c?.games;
    if(rows&&typeof rows==='object'){
      nflKickoffByGameKey=new Map(Object.entries(rows).filter(([,v])=>Number.isFinite(Number(v))).map(([k,v])=>[k,Number(v)]));
    }
    const statuses=c?.espnStatusByTeam;
    if(statuses&&typeof statuses==='object'){
      nflEspnStatusByTeam=new Map(Object.entries(statuses).filter(([,v])=>v&&typeof v==='object'));
    }
    nflKickoffFetchedAt=Number(c.fetchedAt)||0;
    nflEspnStatusFetchedAt=Number(c.statusFetchedAt)||0;
    return nflKickoffByGameKey.size>0||nflEspnStatusByTeam.size>0;
  }catch(_){return false}
}
function saveNflKickoffCache(){
  try{
    storage.set(NFL_KICKOFF_CACHE_KEY,JSON.stringify({
      fetchedAt:nflKickoffFetchedAt,
      statusFetchedAt:nflEspnStatusFetchedAt,
      games:Object.fromEntries(nflKickoffByGameKey),
      espnStatusByTeam:Object.fromEntries(nflEspnStatusByTeam)
    }));
  }catch(_){}
}
function espnNflTeamCode(comp){
  return normalizeNflTeamCode(comp?.team?.abbreviation||comp?.team?.shortDisplayName||comp?.team?.displayName||'');
}
function espnNflStatusKind(event,competition){
  const status=competition?.status||event?.status||{};
  const type=status?.type||{};
  if(type?.completed===true||status?.completed===true)return 'final';
  const raw=type?.state??type?.name??type?.description??status?.state??status?.name??status?.description??'';
  const value=String(raw||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
  if(['post','final','complete','completed','closed','finished','postgame'].includes(value)||value.includes('final')||value.includes('complete'))return 'final';
  if(['in','live','in_progress','playing','halftime','started'].includes(value)||value.includes('in_progress')||value.includes('halftime'))return 'live';
  if(['pre','scheduled','created','pregame','not_started','pending'].includes(value)||value.includes('scheduled')||value.includes('pregame'))return 'scheduled';
  return 'unknown';
}
function ingestEspnKickoffSchedule(data,week){
  const events=Array.isArray(data?.events)?data.events:[];
  let learned=0,statusLearned=0;
  const now=Date.now();
  for(const event of events){
    const competition=event?.competitions?.[0]||{};
    const competitors=Array.isArray(competition?.competitors)?competition.competitors:[];
    const home=competitors.find(c=>c?.homeAway==='home'),away=competitors.find(c=>c?.homeAway==='away');
    const homeCode=espnNflTeamCode(home),awayCode=espnNflTeamCode(away);
    if(!homeCode||!awayCode)continue;
    const key=`${Number(week)||0}:${awayCode}@${homeCode}`;
    const raw=event?.date||competition?.date||'';
    const ms=Date.parse(raw);
    if(Number.isFinite(ms)){nflKickoffByGameKey.set(key,ms);learned++}

    const kind=espnNflStatusKind(event,competition);
    if(kind!=='unknown'){
      for(const team of [homeCode,awayCode]){
        const previous=nflEspnStatusByTeam.get(team);
        // FINAL is sticky for this matchup/week. A stale later payload cannot revive it.
        const stickyFinal=previous?.kind==='final'&&previous?.key===key;
        nflEspnStatusByTeam.set(team,stickyFinal?previous:{kind,key,updatedAt:now});
        statusLearned++;
      }
    }
  }
  if(learned)nflKickoffFetchedAt=now;
  if(statusLearned)nflEspnStatusFetchedAt=now;
  if(learned||statusLearned)saveNflKickoffCache();
  return learned+statusLearned;
}
async function refreshNflKickoffSchedule(force=false){
  const season=String(nflState?.season||leagueInfo?.season||new Date().getFullYear());
  const week=n(nflState?.week)||1,now=Date.now();
  const kickoffFresh=nflKickoffByGameKey.size&&now-nflKickoffFetchedAt<NFL_KICKOFF_REFRESH_MS;
  const statusFresh=nflEspnStatusByTeam.size&&now-nflEspnStatusFetchedAt<NFL_ESPN_STATUS_REFRESH_MS;
  if(!force&&kickoffFresh&&statusFresh)return true;
  try{
    const data=await get(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${encodeURIComponent(week)}&dates=${encodeURIComponent(season)}`);
    return ingestEspnKickoffSchedule(data,week)>0;
  }catch(e){
    if(e?.isSleeperRequestError)return false;
    try{console.warn('NFL ESPN schedule/status enrichment unavailable',e)}catch(_){}
    return false;
  }
}
loadNflKickoffCache();
loadNflKickoffCache();

function nflScheduleKickoffMs(game){
  const candidates=[
    game?.start_time,game?.startTime,game?.startTimeUTC,game?.start_time_utc,game?.kickoff,game?.kickoff_time,game?.kickoffTime,
    game?.game_time,game?.gameTime,game?.metadata?.start_time,game?.metadata?.kickoff
  ];
  for(const raw of candidates){
    if(raw===null||raw===undefined||raw==='')continue;
    if(typeof raw==='number'&&Number.isFinite(raw))return raw<1e12?raw*1000:raw;
    const s=String(raw).trim();
    if(/^\d{10,13}$/.test(s)){const x=Number(s);return x<1e12?x*1000:x}
    const parsed=Date.parse(s);if(Number.isFinite(parsed))return parsed;
  }
  const date=String(game?.date??game?.metadata?.date??'').trim();
  const time=String(game?.time??game?.metadata?.time??'').trim();
  if(date&&time){
    // Sleeper's split schedule date/time values are UTC. Explicitly append Z so
    // Android/browser locale parsing cannot shift kickoff several hours late.
    const normalizedTime=/^\d{1,2}:\d{2}(?::\d{2})?$/.test(time)?time.padStart(5,'0'):time;
    const iso=/^\d{4}-\d{2}-\d{2}$/.test(date)&&/^\d{2}:\d{2}(?::\d{2})?$/.test(normalizedTime)
      ?`${date}T${normalizedTime}${normalizedTime.length===5?':00':''}Z`
      :'';
    const combined=iso?Date.parse(iso):Date.parse(`${date} ${time} UTC`);
    if(Number.isFinite(combined))return combined;
  }
  const gameKey=nflScheduleGameKey(game);
  const enriched=Number(nflKickoffByGameKey.get(gameKey)||0);
  if(Number.isFinite(enriched)&&enriched>0)return enriched;
  const known=nflKnownKickoffMs(game);
  if(known)return known;
  // A date-only value is never a kickoff timestamp unless the matchup/week fallback
  // supplied an authoritative kickoff above.
  return 0;
}
function nflScheduleKickoffSource(game){
  const candidates=[
    game?.start_time,game?.startTime,game?.startTimeUTC,game?.start_time_utc,
    game?.kickoff,game?.kickoff_time,game?.kickoffTime,game?.game_time,game?.gameTime,
    game?.metadata?.start_time,game?.metadata?.kickoff
  ];
  if(candidates.some(v=>v!==null&&v!==undefined&&v!==''))return 'schedule-field';
  const key=nflScheduleGameKey(game);
  if(Number(nflKickoffByGameKey.get(key)||0)>0)return 'espn-kickoff';
  if(nflKnownKickoffMs(game))return 'known-2026';
  return 'unavailable';
}

function nflScheduleStatusKind(game){
  const raw=
    game?.status?.type?.name ?? game?.status?.type?.state ?? game?.status?.type?.description ??
    game?.status?.name ?? game?.status?.state ?? game?.status?.description ??
    game?.status ?? game?.game_status ?? game?.gameStatus ?? game?.state ?? game?.phase ?? '';
  const status=String(raw||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
  if(!status)return 'unknown';
  if(['in_progress','live','playing','halftime','started','in'].includes(status)||status.includes('in_progress')||status.includes('halftime'))return 'live';
  if(['complete','completed','final','closed','finished','post','postgame'].includes(status)||status.includes('final')||status.includes('complete')||status.includes('finished'))return 'final';
  if(['scheduled','pre','pregame','not_started','pending'].includes(status)||status.includes('scheduled')||status.includes('pregame'))return 'scheduled';
  return 'unknown';
}
function nflScheduleTeams(game){
  return {
    home:normalizeNflTeamCode(
      game?.home_team ?? game?.home ?? game?.home_team_abbr ?? game?.home_abbr ??
      game?.team_home ?? game?.metadata?.home_team ?? game?.metadata?.home
    ),
    away:normalizeNflTeamCode(
      game?.away_team ?? game?.away ?? game?.away_team_abbr ?? game?.away_abbr ??
      game?.team_away ?? game?.metadata?.away_team ?? game?.metadata?.away
    )
  };
}
function nflScheduleWeek(game){
  return Number(game?.week ?? game?.leg ?? game?.week_num ?? game?.week_number ?? 0);
}
function nflScheduleGameForTeam(team,week=n(nflState?.week)||1,now=Date.now()){
  const code=normalizeNflTeamCode(team);if(!code)return null;
  const games=(nflScheduleGames||[]).filter(g=>{
    const teams=nflScheduleTeams(g);
    return teams.home===code||teams.away===code;
  });
  if(!games.length)return null;

  const inWindow=games
    .map(g=>({g,k:nflScheduleKickoffMs(g)}))
    .filter(x=>x.k&&now>=x.k-NFL_GAME_WINDOW_EARLY_MS&&now<=x.k+NFL_GAME_WINDOW_LATE_MS)
    .sort((a,b)=>Math.abs(now-a.k)-Math.abs(now-b.k))[0];
  if(inWindow)return inWindow.g;

  const exact=games.find(g=>nflScheduleWeek(g)===Number(week));
  if(exact)return exact;

  // If only one game for this team is present in the loaded payload, it is still
  // usable for diagnostics/fallback even when week metadata is absent.
  return games.length===1?games[0]:null;
}
function nflTeamGameActivity(team,now=Date.now()){
  const code=normalizeNflTeamCode(team);if(!code)return {active:false,source:'none',game:null,status:'unknown'};
  const week=n(nflState?.week)||1;
  const game=nflScheduleGameForTeam(code,week,now);
  const kickoff=game?nflScheduleKickoffMs(game):0;
  const sleeperKind=game?nflScheduleStatusKind(game):'unknown';

  // ESPN status is refreshed frequently and is authoritative for current-game lifecycle.
  const espn=nflEspnStatusByTeam.get(code);
  const espnCurrent=espn&&String(espn.key||'').startsWith(`${Number(week)||0}:`) ? espn : null;
  if(espnCurrent?.kind==='final')return {active:false,source:'espn-final',status:'final',game,kickoff};
  if(espnCurrent?.kind==='live')return {active:true,source:'espn-status',status:'live',game,kickoff};
  if(espnCurrent?.kind==='scheduled')return {active:false,source:'espn-pre',status:'scheduled',game,kickoff};

  // Sleeper explicit lifecycle is the secondary authoritative source.
  if(sleeperKind==='final')return {active:false,source:'final',status:'final',game,kickoff};
  if(sleeperKind==='scheduled')return {active:false,source:'status-pre',status:'scheduled',game,kickoff};
  if(sleeperKind==='live')return {active:true,source:'status',status:'live',game,kickoff};

  // Only when neither source knows the lifecycle do we use heuristics.
  if(kickoff&&now>=kickoff-NFL_GAME_WINDOW_EARLY_MS&&now<=kickoff+NFL_GAME_WINDOW_LATE_MS){
    return {active:true,source:'time-window',status:'unknown',game,kickoff};
  }
  const heartbeat=Number(nflLiveStatHeartbeat.get(code)||0);
  const recentDebug=(typeof testingLiveDebugPlays!=='undefined'&&Array.isArray(testingLiveDebugPlays))
    ?testingLiveDebugPlays.find(e=>normalizeNflTeamCode(e?.nflTeam)===code&&now-Number(e?.time||0)<=NFL_LIVE_STAT_HEARTBEAT_MS)
    :null;
  const recentAt=Math.max(heartbeat,Number(recentDebug?.time||0));
  if(recentAt&&now-recentAt<=NFL_LIVE_STAT_HEARTBEAT_MS){
    return {active:true,source:heartbeat?'live-stats':'live-debug',status:'unknown',game,lastStatAt:recentAt,kickoff};
  }
  return {active:false,source:kickoff?'schedule':'none',status:'unknown',game,lastStatAt:recentAt||0,kickoff};
}
function isNflTeamGameActive(team,now=Date.now()){return nflTeamGameActivity(team,now).active}
function refreshNflActivityUi(){
  try{
    if(typeof render==='function')render();
    if(typeof renderTestingNflGameActivity==='function')renderTestingNflGameActivity();
  }catch(e){try{console.warn('NFL activity UI refresh failed',e)}catch(_){}}
}
function startNflActivityUiTimer(){
  if(nflActivityUiTimer)clearInterval(nflActivityUiTimer);
  nflActivityUiTimer=setInterval(refreshNflActivityUi,NFL_ACTIVITY_UI_REFRESH_MS);
}
function loadNflScheduleCache(){
  try{
    const raw=storage.get(NFL_SCHEDULE_CACHE_KEY,'');if(!raw)return false;
    const c=JSON.parse(raw);
    if(!Array.isArray(c?.games))return false;
    nflScheduleGames=c.games;nflScheduleFetchedAt=Number(c.fetchedAt)||0;nflScheduleSeason=String(c.season||'');nflScheduleType=String(c.seasonType||'');
    return true;
  }catch(_){return false}
}
function saveNflScheduleCache(){
  try{storage.set(NFL_SCHEDULE_CACHE_KEY,JSON.stringify({fetchedAt:nflScheduleFetchedAt,season:nflScheduleSeason,seasonType:nflScheduleType,games:nflScheduleGames}))}catch(_){}
}
async function refreshNflScheduleStatus(force=false){
  const season=String(nflState?.season||leagueInfo?.season||new Date().getFullYear());
  const seasonType=nflScheduleSeasonType(),week=n(nflState?.week)||1,now=Date.now();
  const sameSeason=nflScheduleSeason===season&&nflScheduleType===seasonType;
  if(!force&&sameSeason&&nflScheduleGames.length&&now-nflScheduleFetchedAt<NFL_SCHEDULE_REFRESH_MS)return true;
  try{
    const raw=await get(`https://api.sleeper.app/schedule/nfl/${encodeURIComponent(seasonType)}/${encodeURIComponent(season)}`);
    const all=Array.isArray(raw)?raw:Array.isArray(raw?.games)?raw.games:Array.isArray(raw?.schedule)?raw.schedule:[];
    if(!all.length)return false;
    // Preserve the full schedule. Active-game detection must not depend on an exact
    // week-field match before kickoff-time fallback gets a chance to run.
    nflScheduleGames=all;nflScheduleFetchedAt=now;nflScheduleSeason=season;nflScheduleType=seasonType;saveNflScheduleCache();
    return true;
  }catch(e){
    if(e?.isSleeperRequestError)return false;
    throw e;
  }
}
loadNflScheduleCache();

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

function playerMetadataHasUsableTeam(raw){
  if(!raw||typeof raw!=='object')return false;
  const team=normalizeNflTeamCode(raw.team||raw.metadata?.team||'');
  return !!team&&team!=='FA';
}
function missingReferencedPlayerIds(){
  return [...referencedPlayerIds()].filter(id=>{
    const discovered=discoveredSleeperPlayers[id];
    const fallback=playerMetadataFallback(id);
    return !playerMetadataHasUsableTeam(discovered)&&!playerMetadataHasUsableTeam(fallback);
  });
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

function liveLoadingEnabled(){return storage.get(LIVE_LOADING_KEY,'on')==='on'}
const TESTING_AREA_VISIBLE_KEY='ucl-gameday-testing-area-visible-v1';
const TESTING_FEATURES_AUTH_KEY='ucl-gameday-testing-features-authorized-v1';
const TESTING_FEATURES_PASSWORD='failspy';
function testingFeaturesAuthorized(){return storage.get(TESTING_FEATURES_AUTH_KEY,'off')==='on'}
function testingAreaVisible(){return testingFeaturesAuthorized()&&storage.get(TESTING_AREA_VISIBLE_KEY,'off')==='on'}
function updateTestingAreaVisibilityUi(){
  const visible=testingAreaVisible(),nav=$('#testingAreaNavBtn'),toggle=$('#testingAreaVisibleToggle');
  if(nav)nav.hidden=!visible;
  if(toggle)toggle.checked=visible;
  document.querySelectorAll('.testing-feature-settings').forEach(el=>el.hidden=!visible);
  if(visible&&typeof testingRefreshAllPlayerSelectors==='function')testingRefreshAllPlayerSelectors();
  if(!visible&&currentView==='testing')setView('gameday');
}
function authorizeTestingFeatures(){
  if(testingFeaturesAuthorized())return true;
  const entered=window.prompt('Enter the testing features password:');
  if(entered===TESTING_FEATURES_PASSWORD){
    storage.set(TESTING_FEATURES_AUTH_KEY,'on');
    return true;
  }
  return false;
}
function setTestingAreaVisible(visible){
  if(visible&&!authorizeTestingFeatures()){
    storage.set(TESTING_AREA_VISIBLE_KEY,'off');
    updateTestingAreaVisibilityUi();
    return false;
  }
  storage.set(TESTING_AREA_VISIBLE_KEY,visible?'on':'off');
  updateTestingAreaVisibilityUi();
  return true;
}
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
  const discovered=discoveredSleeperPlayers[key]||null,fallback=playerMetadataFallback(key)||null;
  const raw=playerMetadataHasUsableTeam(discovered)?discovered:(playerMetadataHasUsableTeam(fallback)?fallback:(discovered||fallback||{}));
  const full=raw.full_name||[raw.first_name,raw.last_name].filter(Boolean).join(' ');
  const pos=String(raw.position||raw.fantasy_positions?.[0]||'').toUpperCase();
  return {
    id:key,
    name:full||`Player ${key}`,
    pos:pos==='DST'?'DEF':(pos||'—'),
    team:normalizeNflTeamCode(raw.team||'FA')||'FA',
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
function syncSelectedTeamToFeaturedMatchup(preferRosterId=''){
  const sel=$('#teamSelect'),pair=matchupPairs().find(p=>String(p.id)===String(featuredMatchupId));if(!sel||!pair)return String(sel?.value||'');
  const ids=(pair.rows||[]).map(r=>String(r.roster_id));
  const preferred=String(preferRosterId||sel.value||'');
  const next=ids.includes(preferred)?preferred:(ids[0]||'');
  if(next&&[...sel.options].some(o=>String(o.value)===next)){
    sel.value=next;storage.set('ucl-gameday-team',next);syncTeamPreferenceControls();
  }
  return next;
}
function selectPreferredTeam(rosterId){
  const sel=$('#teamSelect');if(!sel||!rosterId)return;
  const valid=[...sel.options].some(o=>String(o.value)===String(rosterId));
  if(!valid)return;
  sel.value=String(rosterId);
  storage.set('ucl-gameday-team',sel.value);
  featuredMatchupId=pairForRoster(sel.value)?.id||featuredMatchupId;
  if(typeof gvSwitchMatchupSession==='function')gvSwitchMatchupSession();
  syncTeamPreferenceControls();
  if(typeof testingRefreshAllPlayerSelectors==='function')testingRefreshAllPlayerSelectors();
  render();
  if(currentView==='gameview')renderGameView();
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
 const sel=$('#teamSelect'),saved=storage.get('ucl-gameday-team','dmercado');sel.innerHTML=rosters.map(r=>{const u=owner(r);const label=u.display_name||u.username||teamName(r);return `<option value="${esc(r.roster_id)}">${esc(label)}</option>`}).join('');const wanted=rosters.find(r=>String(owner(r).username||owner(r).display_name).toLowerCase()===saved.toLowerCase())||rosters.find(r=>String(r.roster_id)===saved)||rosters[0];if(wanted)sel.value=String(wanted.roster_id);sel.onchange=()=>{storage.set('ucl-gameday-team',sel.value);featuredMatchupId=pairForRoster(sel.value)?.id||featuredMatchupId;if(typeof gvSwitchMatchupSession==='function')gvSwitchMatchupSession();syncTeamPreferenceControls();if(typeof testingRefreshAllPlayerSelectors==='function')testingRefreshAllPlayerSelectors();render();if(currentView==='gameview')renderGameView()};syncTeamPreferenceControls();syncThemePreferenceControls();showFirstRunSetupIfNeeded();}
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
    TESTING_AREA_VISIBLE_KEY,
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

function ensureActiveNavVisible(){
  const nav=document.querySelector('.primary-nav');
  const active=nav?.querySelector('[data-view].active');
  if(!nav||!active)return;
  requestAnimationFrame(()=>{
    const nr=nav.getBoundingClientRect(),ar=active.getBoundingClientRect();
    if(ar.left<nr.left+4||ar.right>nr.right-4){
      active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});
    }
  });
}

function setView(view){
  if(view==='settings'){openSettings();return}
  currentView=['gameday','scores','gameview','testing'].includes(view)?view:'gameday';

  if(currentView==='testing')gvMountFieldForTesting();
  else gvRestoreFieldHome();

  const gameDayView=$('#gameContentView');
  const scoresView=$('#scoresView');
  const gameView=$('#gameView');
  const testingView=$('#testingView');

  if(gameDayView)gameDayView.hidden=currentView!=='gameday';
  if(scoresView)scoresView.hidden=currentView!=='scores';
  if(gameView)gameView.hidden=currentView!=='gameview';
  if(testingView)testingView.hidden=currentView!=='testing';

  document.querySelectorAll('.primary-nav [data-view]').forEach(
    b=>b.classList.toggle('active',b.dataset.view===currentView)
  );
  ensureActiveNavVisible();

  if(currentView==='gameday')render();
  if(currentView==='scores')renderScoresView();
  if(currentView==='testing'){
    testingInitTabs();renderTestingArea();renderTestingLiveDebug();
    gvMountFieldForTesting();
    // v0.4.38: do not destroy an in-flight Testing Area animation merely
    // because another test button re-selects the Testing view.
    if(!gameViewPlaying)clearGameViewEffects(true);
  }
  if(currentView==='gameview'){
    syncSelectedTeamToFeaturedMatchup($('#teamSelect')?.value||'');
    if(typeof gvSwitchMatchupSession==='function')gvSwitchMatchupSession();
    gvRestoreFieldHome();
    gvRestorePlaybackQueue();
    renderGameView();
    if(!gameViewPlaying)playNextGameViewEvent();
    if(!gameViewPlaying)clearGameViewEffects(true);
  }
}

