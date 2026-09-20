/* UCL GameDay v0.5.60 — build fragment: 00_bootstrap_session.js
   This file is concatenated in manifest order into the app's single lexical scope.
   It is intentionally not loaded independently in the browser. */

(()=>{
const jsErrorEntries=[];
function appendJsError(message){
  try{
    const line=`[${new Date().toLocaleTimeString()}] ${String(message||'Unknown JavaScript error')}`;
    jsErrorEntries.push(line);
    if(jsErrorEntries.length>50)jsErrorEntries.shift();
    const box=document.getElementById('jsErrorLog'),pre=document.getElementById('jsErrorText');
    if(box&&pre){pre.textContent=jsErrorEntries.join('\n\n');box.hidden=false}
  }catch(e){}
}
window.addEventListener('error',e=>{
  const parts=[e.message||'Uncaught error'];
  if(e.filename)parts.push(`${e.filename}${e.lineno?`:${e.lineno}`:''}${e.colno?`:${e.colno}`:''}`);
  if(e.error?.stack)parts.push(e.error.stack);
  appendJsError(parts.join('\n'));
});
window.addEventListener('unhandledrejection',e=>{
  const r=e.reason;
  appendJsError(`Unhandled Promise Rejection\n${r?.stack||r?.message||String(r)}`);
});

'use strict';
const VERSION='0.5.60',LEAGUE_ID='1386066375474180096',API='https://api.sleeper.app/v1',POLL_MS=15000;
const THEMES={
 'UCL Blue':['#102a56','#2f65ad','#173d73','#eef3f9'],Forest:['#183d2b','#2e7653','#24563f','#eef5f0'],Purple:['#35265f','#7558b5','#513b86','#f2eff8'],Crimson:['#5b1f2b','#a53c50','#7d2939','#f8eff1'],Orange:['#5a3416','#c26b27','#84491e','#faf2eb'],Slate:['#273342','#5a6b7e','#3f4d5e','#f0f3f6'],Gold:['#4e3d13','#af861d','#735b19','#f8f4e8'],'Ice Blue':['#16465a','#2b95b8','#21738f','#edf7fa']
};

const NFL_TEAM_COLORS=Object.freeze({
ARI:['#97233F','#000000'],ATL:['#A71930','#000000'],BAL:['#241773','#000000'],BUF:['#00338D','#C60C30'],
CAR:['#0085CA','#101820'],CHI:['#0B162A','#C83803'],CIN:['#FB4F14','#000000'],CLE:['#311D00','#FF3C00'],
DAL:['#003594','#869397'],DEN:['#FB4F14','#002244'],DET:['#0076B6','#B0B7BC'],GB:['#203731','#FFB612'],
HOU:['#03202F','#A71930'],IND:['#002C5F','#A2AAAD'],JAX:['#101820','#00A5B5'],KC:['#E31837','#FFB81C'],
LV:['#000000','#A5ACAF'],LAC:['#0080C6','#FFC20E'],LAR:['#003594','#FFA300'],MIA:['#008E97','#FC4C02'],
MIN:['#4F2683','#FFC62F'],NE:['#002244','#C60C30'],NO:['#D3BC8D','#101820'],NYG:['#0B2265','#A71930'],
NYJ:['#125740','#000000'],PHI:['#004C54','#A5ACAF'],PIT:['#FFB612','#101820'],SEA:['#002244','#69BE28'],
SF:['#AA0000','#B3995D'],TB:['#D50A0A','#34302B'],TEN:['#0C2340','#4B92DB'],WAS:['#5A1414','#FFB612']
});
const NFL_TEAM_NAMES=Object.freeze({
ARI:'CARDINALS',ATL:'FALCONS',BAL:'RAVENS',BUF:'BILLS',CAR:'PANTHERS',CHI:'BEARS',CIN:'BENGALS',CLE:'BROWNS',
DAL:'COWBOYS',DEN:'BRONCOS',DET:'LIONS',GB:'PACKERS',HOU:'TEXANS',IND:'COLTS',JAX:'JAGUARS',KC:'CHIEFS',
LV:'RAIDERS',LAC:'CHARGERS',LAR:'RAMS',MIA:'DOLPHINS',MIN:'VIKINGS',NE:'PATRIOTS',NO:'SAINTS',NYG:'GIANTS',
NYJ:'JETS',PHI:'EAGLES',PIT:'STEELERS',SEA:'SEAHAWKS',SF:'49ERS',TB:'BUCCANEERS',TEN:'TITANS',WAS:'COMMANDERS'
});
function nflTeamColors(team){const t=String(team||'').toUpperCase();return NFL_TEAM_COLORS[t]||['#24364f','#aeb7c4']}
function gvNflTeamLabel(team){const t=String(team||'').toUpperCase();return NFL_TEAM_NAMES[t]||t||'NFL'}
function readableText(hex){const h=String(hex||'#000000').replace('#','');if(h.length!==6)return '#fff';const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return ((r*299+g*587+b*114)/1000)>155?'#111':'#fff'}

const $=s=>document.querySelector(s);let users=[],rosters=[],matchups=[],players={},nflState=null,leagueInfo=null,featuredMatchupId=null,lastSnapshot={},events=[],busy=false,timer=null;let currentView='gameday';
// Current NFL game detection for lineup highlighting.
let nflScheduleGames=[],nflScheduleFetchedAt=0,nflScheduleSeason='',nflScheduleType='';
const nflLiveStatHeartbeat=new Map();
const NFL_LIVE_STAT_HEARTBEAT_MS=10*60*1000;
const NFL_ACTIVITY_UI_REFRESH_MS=30000;
let nflActivityUiTimer=null;
const NFL_KICKOFF_CACHE_KEY='ucl-gameday-nfl-kickoffs-v1';
const NFL_KICKOFF_REFRESH_MS=6*60*60*1000;
let nflKickoffByGameKey=new Map(),nflKickoffFetchedAt=0;
let nflEspnStatusByTeam=new Map(),nflEspnStatusFetchedAt=0;
const NFL_ESPN_STATUS_REFRESH_MS=30000;


// v0.5.16: ordinary Sleeper/network failures are connection state, not JavaScript crashes.
const sleeperConnectionState={consecutiveFailures:0,lastSuccessAt:0,lastFailureAt:0,lastMessage:'',lastEndpoint:'',pageScheme:String(location?.protocol||'unknown'),pageOrigin:(location?.origin&&location.origin!=='null')?location.origin:String(location?.protocol||'unknown')};
function sleeperConnectionTime(ts){return ts?new Date(ts).toLocaleTimeString():'—'}
function sleeperConnectionDebugText(){return `Page: ${sleeperConnectionState.pageScheme} • Origin: ${sleeperConnectionState.pageOrigin} • Last success: ${sleeperConnectionTime(sleeperConnectionState.lastSuccessAt)} • Last failure: ${sleeperConnectionTime(sleeperConnectionState.lastFailureAt)} • Consecutive failures: ${sleeperConnectionState.consecutiveFailures}${sleeperConnectionState.lastEndpoint?` • Endpoint: ${sleeperConnectionState.lastEndpoint}`:''}${sleeperConnectionState.lastMessage?` • ${sleeperConnectionState.lastMessage}`:''}`}
function renderSleeperConnectionDebug(){const el=$('#sleeperConnectionDebugText');if(el)el.textContent=sleeperConnectionDebugText()}
function setSleeperConnectionWarning(message=''){const box=$('#errorBox');if(!box)return;box.classList.toggle('connection-warning',!!message);if(message){box.textContent=message;box.classList.add('show')}else{box.classList.remove('show','connection-warning');box.textContent=''}}
function markSleeperConnectionSuccess(){sleeperConnectionState.consecutiveFailures=0;sleeperConnectionState.lastSuccessAt=Date.now();sleeperConnectionState.lastMessage='';sleeperConnectionState.lastEndpoint='';setSleeperConnectionWarning('');renderSleeperConnectionDebug()}
function markSleeperConnectionFailure(error){sleeperConnectionState.consecutiveFailures++;sleeperConnectionState.lastFailureAt=Date.now();sleeperConnectionState.lastMessage=String(error?.message||error||'Sleeper request failed');sleeperConnectionState.lastEndpoint=String(error?.endpoint||'');setSleeperConnectionWarning(`Sleeper temporarily unavailable — using the most recent saved data. Retrying automatically.${sleeperConnectionState.consecutiveFailures>1?` (${sleeperConnectionState.consecutiveFailures} consecutive attempts)`:''}`);renderSleeperConnectionDebug()}


// v0.5.03: built-in UCL team identities keep first-run setup usable before any
// Sleeper API/cache data exists. Live or saved Sleeper rosters remain authoritative.
const DEFAULT_UCL_TEAMS=Object.freeze([
  {username:'dmercado',label:'Remember The Titans'},
  {username:'ChiefJuannataco',label:'ChiefJuannataco'},
  {username:'MadRagin',label:'MadRagin'},
  {username:'karebear',label:'karebear'},
  {username:'fograw',label:'fograw'},
  {username:'mgarcia49',label:'mgarcia49'},
  {username:'brianbrianrbianbrina',label:'brianbrianrbianbrina'},
  {username:'Ntsuas',label:'Ntsuas'}
]);
function defaultUclRosterData(){
  return {
    users:DEFAULT_UCL_TEAMS.map(t=>({user_id:`offline:${t.username}`,username:t.username,display_name:t.label,metadata:{team_name:t.label}})),
    rosters:DEFAULT_UCL_TEAMS.map(t=>({roster_id:t.username,owner_id:`offline:${t.username}`,players:[],starters:[],reserve:[],taxi:[],settings:{wins:0,losses:0,ties:0},metadata:{team_name:t.label,_uclOfflineFallback:'1'}}))
  };
}
function ensureDefaultUclTeams(){
  if(Array.isArray(rosters)&&rosters.length)return false;
  const fallback=defaultUclRosterData();users=fallback.users;rosters=fallback.rosters;return true;
}
function hasOfflineDefaultUclTeams(){return !!rosters.length&&rosters.every(r=>r?.metadata?._uclOfflineFallback==='1')}

// v0.5.09: exact 2026 UCL scoring fallback, sourced from league
// 1386066375474180096. Live league scoring_settings remain authoritative whenever
// they are available; this table keeps simulation/testing accurate before the API
// response arrives or while running from saved/offline data.
const UCL_2026_SCORING_FALLBACK=Object.freeze({
  blk_kick:2,blk_kick_ret_yd:.02,bonus_rec_te:1,def_2pt:.5,def_pass_def:.1,
  def_st_td:6,def_td:6,fg_ret_yd:.02,fgm:4.5,fgm_yds_over_30:.15,fgmiss:-1,
  fum_lost:-2,fum_rec:2,fum_rec_td:6,fum_ret_yd:.02,int:2,int_ret_yd:.02,
  pass_2pt:2,pass_int:-2,pass_td:6,pass_yd:.04,qb_hit:.1,rec:1,rec_2pt:2,
  rec_td:6,rec_yd:.1,rush_2pt:2,rush_td:6,rush_yd:.1,sack:1,sack_yd:.02,
  safe:2,st_ff:1,st_fum_rec:1,st_td:6,tkl_loss:.1,tkl_solo:.05,xpm:1.5
});
const UCL_SCORING_ALIASES=Object.freeze({
  def_int_ret_yd:'int_ret_yd',fum_rec_yd:'fum_ret_yd',kick_ret_yd:'def_kr_yd',punt_ret_yd:'def_pr_yd',pass_def:'def_pass_def',pass_defended:'def_pass_def',passes_defended:'def_pass_def',pd:'def_pass_def'
});
function uclScoringWeight(key,fallback=0){
  const live=Number(leagueInfo?.scoring_settings?.[key]);
  if(Number.isFinite(live))return live;
  const baked=Number(UCL_2026_SCORING_FALLBACK[key]);
  return Number.isFinite(baked)?baked:Number(fallback||0);
}
function uclScoreStats(stats,pos=''){
  const raw=stats&&typeof stats==='object'?stats:{};let total=0;
  for(const [key,val] of Object.entries(raw)){
    const num=Number(val||0);if(!Number.isFinite(num)||!num)continue;
    const scoreKey=(leagueInfo?.scoring_settings&&Object.prototype.hasOwnProperty.call(leagueInfo.scoring_settings,key))||Object.prototype.hasOwnProperty.call(UCL_2026_SCORING_FALLBACK,key)
      ?key:(UCL_SCORING_ALIASES[key]||key);
    total+=num*uclScoringWeight(scoreKey,0);
  }
  const p=String(pos||'').toUpperCase()==='DST'?'DEF':String(pos||'').toUpperCase();
  const rec=Number(raw.rec||0);
  if(rec){
    const bonusKey=p==='TE'?'bonus_rec_te':p==='RB'?'bonus_rec_rb':p==='WR'?'bonus_rec_wr':'';
    if(bonusKey&&!Object.prototype.hasOwnProperty.call(raw,bonusKey))total+=rec*uclScoringWeight(bonusKey,0);
  }
  return Number(total.toFixed(2));
}
const simulation={active:false,paused:false,speed:20,style:'chaos',scenario:'full',elapsed:0,total:0,lastReal:0,virtualStart:Date.now(),liveMatchups:null,liveGameViewStats:null,liveLastGameViewStats:null,liveGameViewStatsAt:0,loop:null,lastSessionId:null,assignments:new Map(),scoreSchedule:[],scoreCursor:0};
const momentumGames=new Map();
const gameViewEvents=[];let gameViewQueue=[];let gameViewPlaying=false;let gvActorAnimations=[];
const gvLiveCaptureDiagnostics={lastAt:0,teamScoreChanges:0,starterDeltas:0,benchDeltasIgnored:0,unresolvedTeamChanges:0,lastMessage:''};
const gvStatFirstReconciliation=new Map();
const GV_FPTS_CONFIRM_WINDOW_MS=45000;
const gvPendingStatCandidates=new Map();

// v0.5.60: immediate stat-first play capture with a small-correction rejection layer.
const GV_STAT_REJECTION_WINDOW_MS=15000;
const GV_SMALL_YARDAGE_CORRECTION_MAX=4;
const gvRecentAcceptedStatPlays=new Map();


const GAMEVIEW_SESSION_KEY='ucl-gameday-gameview-session-v1';
let gameViewSession=null;
let clearingLocalAppData=false;
const GAMEVIEW_ALL_TEAMS_PREF_KEY='ucl-gameday-gameview-all-teams';
let gameViewAllTeamsMode=false;
function gvIsAllTeamsMode(){return !!gameViewAllTeamsMode}
function gvSetAllTeamsMode(enabled){
  gameViewAllTeamsMode=!!enabled;
  storage.set(GAMEVIEW_ALL_TEAMS_PREF_KEY,gameViewAllTeamsMode?'on':'off');
  gvSwitchMatchupSession();
}

function gvCurrentWeekKey(){
  const season=String(nflState?.season||new Date().getFullYear());
  const type=String(nflState?.season_type||'regular');
  const week=Number(nflState?.week||1);
  if(gvIsAllTeamsMode())return `${season}:${type}:week-${week}:all-teams`;
  const pair=chosenPair?.();
  const ids=pair?.rows?.map(r=>String(r.roster_id)).sort()||[];
  return `${season}:${type}:week-${week}:${ids.join('-vs-')}`;
}
function gvSelectedRosterIds(){
  if(gvIsAllTeamsMode())return rosters.map(r=>String(r.roster_id));
  const pair=chosenPair?.();return pair?.rows?.map(r=>String(r.roster_id))||[];
}
function gvMatchupScoreSnapshot(){
  const pair=chosenPair?.();
  const rows=gvIsAllTeamsMode()?rosters:(pair?.rows||[]);
  if(!rows.length)return null;
  const byRoster={},statsByPlayer={};
  for(const r of rows){
    const starterIds=new Set((r.starters||[]).filter(Boolean).map(String));
    const allPlayerPoints={...(r.players_points||{})},starterPoints={};
    for(const pid of starterIds)starterPoints[pid]=Number(allPlayerPoints[pid]||0);
    byRoster[String(r.roster_id)]={
      rosterId:String(r.roster_id),
      points:Number(r.points)||0,
      playersPoints:starterPoints,
      fullPlayersPoints:allPlayerPoints,
      starters:[...starterIds],
      players:[...(r.players||[])]
    };
    for(const pid of new Set([...(r.players||[]),...(r.starters||[]),...Object.keys(r.players_points||{})])){
      const raw=gameViewStats[String(pid)]||{},compact={};
      for(const [k,value] of Object.entries(raw)){const v=Number(value);if(Number.isFinite(v)&&v!==0)compact[k]=v}
      statsByPlayer[String(pid)]=compact;
    }
  }
  return {capturedAt:Date.now(),weekKey:gvCurrentWeekKey(),byRoster,statsByPlayer};
}
function gvSessionScoreLine(snapshot){
  if(gvIsAllTeamsMode())return {leftScore:null,rightScore:null};
  const ids=gvSelectedRosterIds(),left=ids[0],right=ids[1];
  const a=snapshot?.byRoster?.[left]?.points||0,b=snapshot?.byRoster?.[right]?.points||0;
  return {leftScore:a,rightScore:b};
}
function gvNewSession(snapshot){
  const score=gvSessionScoreLine(snapshot);
  return {
    schema:2,
    weekKey:gvCurrentWeekKey(),
    createdAt:Date.now(),
    lastSeenAt:Date.now(),
    baseline:snapshot,
    lastSnapshot:snapshot,
    feed:[{
      id:`baseline-${Date.now()}`,
      type:'baseline',
      time:Date.now(),
      leftScore:score.leftScore,
      rightScore:score.rightScore,
      text:'GameView tracking started',
      played:true
    }],
    queue:[],
    playedIds:[],
    replayArchive:{},
    activityWindows:[],
    activeWindowId:null
  };
}
function gvSessionStorageKey(weekKey=gvCurrentWeekKey()){
  return `${GAMEVIEW_SESSION_KEY}:${String(weekKey||'unknown')}`;
}
function gvSaveSession(){
  try{
    if(clearingLocalAppData||!gameViewSession)return false;
    gameViewSession.lastSeenAt=Date.now();
    const key=gvSessionStorageKey(gameViewSession.weekKey||gvCurrentWeekKey());
    return storage.set(key,JSON.stringify(gameViewSession));
  }catch(e){return false}
}
function gvLoadSession(){
  try{
    const currentKey=gvCurrentWeekKey();
    let raw=storage.get(gvSessionStorageKey(currentKey),'');
    let legacy=false;
    if(!raw){
      raw=storage.get(GAMEVIEW_SESSION_KEY,'');
      legacy=!!raw;
    }
    if(!raw)return false;
    const s=JSON.parse(raw);
    if(!s||s.weekKey!==currentKey)return false;
    if(!Array.isArray(s.feed))s.feed=[];
    if(!Array.isArray(s.queue))s.queue=[];
    if(!Array.isArray(s.playedIds))s.playedIds=[];
    if(!s.replayArchive||typeof s.replayArchive!=='object'||Array.isArray(s.replayArchive))s.replayArchive={};
    if(!Array.isArray(s.activityWindows))s.activityWindows=[];
    s.schema=2;
    gameViewSession=s;
    if(legacy)storage.set(gvSessionStorageKey(currentKey),JSON.stringify(s));
    return true;
  }catch(e){return false}
}
function gvEnsureSession(){
  const snap=gvMatchupScoreSnapshot();if(!snap)return null;
  if(!gameViewSession||gameViewSession.weekKey!==gvCurrentWeekKey()){
    if(!gvLoadSession())gameViewSession=gvNewSession(snap);
  }
  if(!gameViewSession.baseline)gameViewSession.baseline=snap;
  if(!gameViewSession.lastSnapshot)gameViewSession.lastSnapshot=snap;
  gvSaveSession();
  return gameViewSession;
}
function gvSwitchMatchupSession(){
  const targetKey=gvCurrentWeekKey();
  if(gameViewSession?.weekKey===targetKey)return gameViewSession;
  if(gameViewSession)gvSaveSession();
  try{if(typeof cancelGameViewPlayback==='function')cancelGameViewPlayback(true)}catch(e){
    try{gameViewQueue.length=0}catch(_){}
  }
  gameViewSession=null;
  try{gameViewQueue.length=0}catch(e){}
  try{gameViewPending.length=0}catch(e){}
  const session=gvEnsureSession();
  if(session&&typeof gvRestorePlaybackQueue==='function')gvRestorePlaybackQueue();
  return session;
}
function gvWindowLabel(ts=Date.now()){
  const d=new Date(ts),day=d.toLocaleDateString(undefined,{weekday:'long'});
  const h=d.getHours();
  if(day==='Sunday'&&h>=9&&h<17)return 'Sunday GameDay';
  const part=h<12?'Morning':h<17?'Afternoon':'Night';
  return `${day} ${part}`;
}

function gvActivityState(){
  const s=gameViewSession;if(!s)return 'WAITING';
  const plays=(s.feed||[]).filter(e=>e.type!=='baseline');
  if(!plays.length)return 'WAITING';
  const last=Number(s.lastActivityAt||plays.at(-1)?.time||0);
  return Date.now()-last<=300000?'ACTIVE':'BETWEEN ACTIVITY';
}
function gvUpdateActivityState(newEvents=0){
  const state=gvActivityState(),el=$('#gvStatus');
  if(!el||gameViewPlaying)return state;
  if(state==='ACTIVE'){
    const w=gameViewSession?.activeWindowId?gameViewSession.activityWindows.find(x=>x.id===gameViewSession.activeWindowId):null;
    el.textContent=w?.label?`${w.label} • Active`:'GameView • Active';
  }else if(state==='BETWEEN ACTIVITY')el.textContent='Waiting for activity';
  else el.textContent='Waiting for matchup activity';
  return state;
}

function gvOpenActivityWindow(ts=Date.now()){
  const s=gvEnsureSession();if(!s)return null;
  if(s.activeWindowId)return s.activityWindows.find(w=>w.id===s.activeWindowId)||null;
  const w={id:`window-${ts}`,label:gvWindowLabel(ts),startedAt:ts,endedAt:null};
  s.activityWindows.push(w);s.activeWindowId=w.id;gvSaveSession();return w;
}
function gvCloseActivityWindow(ts=Date.now()){
  const s=gameViewSession;if(!s?.activeWindowId)return;
  const w=s.activityWindows.find(x=>x.id===s.activeWindowId);
  if(w&&!w.endedAt)w.endedAt=ts;
  s.activeWindowId=null;gvSaveSession();
}
function gvRevisionFamily(evt){return String(evt?.intervalAnalysis?.family||evt?.playType||'').toLowerCase()}
function gvFindRevisionTarget(feed,evt){
  if(!Array.isArray(feed)||!evt)return null;
  const t=Number(evt.time||0),family=gvRevisionFamily(evt);
  for(let i=feed.length-1;i>=0;i--){
    const old=feed[i];
    if(!old||old.type==='baseline'||old.type==='summary'||gvIsLikelyStatCorrection(old))continue;
    if(String(old.rosterId||'')!==String(evt.rosterId||'')||String(old.playerId||'')!==String(evt.playerId||''))continue;
    if(Math.abs(t-Number(old.time||0))>180000)continue;
    const oldFamily=gvRevisionFamily(old);
    if(family&&oldFamily&&family!==oldFamily)continue;
    return {event:old,index:i};
  }
  return null;
}
function gvRemoveEventFromTransientQueues(id){
  if(!id)return;
  for(let i=gameViewQueue.length-1;i>=0;i--)if(gameViewQueue[i]?.id===id)gameViewQueue.splice(i,1);
  for(let i=gameViewEvents.length-1;i>=0;i--)if(gameViewEvents[i]?.id===id)gameViewEvents.splice(i,1);
  for(let i=gameViewPending.length-1;i>=0;i--)if(gameViewPending[i]?.id===id)gameViewPending.splice(i,1);
  for(let i=gameViewCorrelationWindow.length-1;i>=0;i--)if(gameViewCorrelationWindow[i]?.id===id)gameViewCorrelationWindow.splice(i,1);
}
function gvSpecificOverturnLabel(evt){
  const type=String(evt?.playType||gvPlayType(evt)||'');
  const detail=String(evt?.detail||'').toLowerCase();
  if(gvIsTouchdownEvent(evt,type)||detail.includes('touchdown'))return 'TOUCHDOWN OVERTURNED';
  if(type==='def_int'||type==='def_int_td'||detail.includes('interception'))return 'INTERCEPTION OVERTURNED';
  if(type==='def_fumble'||type==='def_fum_td'||detail.includes('fumble'))return 'FUMBLE OVERTURNED';
  if(type==='kick'||detail.includes('field goal')||detail.includes('extra point'))return 'KICK OVERTURNED';
  return 'PLAY OVERTURNED';
}

function gvReconcileCorrectionIntoSession(session,evt){
  if(!session||!gvIsLikelyStatCorrection(evt))return {handled:false,event:evt};
  const hit=gvFindRevisionTarget(session.feed,evt);
  if(!hit){
    // With no safe target, keep the revision visible but never animate it as a football play.
    return {handled:false,event:{...evt,type:'play',played:false,correctionUnmatched:true}};
  }
  const old=hit.event,wasPlayed=!!old.played||(session.playedIds||[]).includes(old.id);
  if(wasPlayed){
    return {handled:false,event:{...evt,type:'play',played:false,revisedExistingEvent:true,correctionOfEventId:old.id,overturnedLabel:Math.abs(Number(evt?.delta||0))>=Math.abs(Number(old?.delta||0))-.01?gvSpecificOverturnLabel(old):''}};
  }

  const revisedDelta=Number((Number(old.delta||0)+Number(evt.delta||0)).toFixed(2));
  session.queue=(session.queue||[]).filter(id=>id!==old.id);
  gvRemoveEventFromTransientQueues(old.id);

  if(Math.abs(revisedDelta)<0.01){
    session.feed.splice(hit.index,1);
    return {handled:false,event:{...evt,type:'play',played:false,revisedExistingEvent:true,correctionOfEventId:old.id,removedPriorEvent:true,overturnedLabel:gvSpecificOverturnLabel(old),detail:`Sleeper removed prior ${old.detail||'scoring event'}`}};
  }

  const revised={
    ...old,
    delta:revisedDelta,
    total:Number.isFinite(Number(evt.total))?Number(evt.total):old.total,
    revisedExistingEvent:true,
    correctionApplied:true,
    correctionDelta:Number(evt.delta||0),
    correctionReason:evt.correctionReason||gvCorrectionEvidence(evt).reason||'',
    likelyCorrection:false,
    negativeScoringEvent:revisedDelta<0,
    played:false
  };
  session.feed[hit.index]=revised;
  if(revised.type==='play'||revised.type==='burst')session.queue.push(revised.id);
  return {handled:true,event:revised};
}

const GV_EVENT_DEDUPE_WINDOW_MS=5000;
function gvEventActorKey(evt){
  const ids=[
    evt?.playerId,evt?.qbPlayerId,evt?.passerPlayerId,evt?.receiverPlayerId,
    evt?.offensivePlayerId,evt?.defensivePlayerId,evt?.lateralRecipientPlayerId
  ].filter(Boolean).map(String);
  return [...new Set(ids)].sort().join(',');
}
function gvSemanticPlayFamily(evt){
  const raw=String(evt?.playType||evt?.intervalAnalysis?.family||evt?.type||'').toLowerCase();
  const stats=evt?.intervalAnalysis?.stats||{};
  if(/kickoff|kick return|kick_ret/.test(raw)||Number(stats.kick_ret_yd||0)||Number(stats.kick_ret_td||0))return 'kick_return';
  if(/punt|punt return|punt_ret/.test(raw)||Number(stats.punt_ret_yd||0)||Number(stats.punt_ret_td||0))return 'punt_return';
  if(/interception|pick six|\bint\b/.test(raw)||Number(stats.int||0)||Number(stats.int_ret_yd||0))return 'interception';
  if(/fumble|scoop/.test(raw)||Number(stats.fum_lost||0)||Number(stats.fum_rec_td||0))return 'fumble';
  if(/field goal|\bfg\b/.test(raw)||Number(stats.fgm||0)||Number(stats.fga||0))return 'field_goal';
  if(/extra point|\bxp\b/.test(raw)||Number(stats.xpm||0)||Number(stats.xpa||0))return 'extra_point';
  if(/pass|receiv|reception/.test(raw)||Number(stats.pass_yd||0)||Number(stats.rec_yd||0))return 'pass';
  if(/rush|run/.test(raw)||Number(stats.rush_yd||0))return 'rush';
  if(/sack/.test(raw)||Number(stats.sack||0))return 'sack';
  return raw.replace(/\s+/g,'_').slice(0,40)||'unknown';
}
function gvEventStatSignature(evt){
  const stats=evt?.intervalAnalysis?.stats||{};
  return Object.keys(stats).sort().map(k=>`${k}:${Number(stats[k]||0)}`).join('|');
}
function gvSemanticPlayYards(evt){
  const stats=evt?.intervalAnalysis?.stats||{};
  const vals=[
    evt?.visualYards,evt?.yards,
    stats.pass_yd,stats.rec_yd,stats.rush_yd,
    stats.kick_ret_yd,stats.punt_ret_yd,stats.int_ret_yd,stats.fum_ret_yd
  ].map(v=>Math.abs(Number(v||0))).filter(v=>Number.isFinite(v)&&v>0);
  return vals.length?Math.max(...vals):0;
}
function gvMajorPlayFlag(evt,kind){
  const stats=evt?.intervalAnalysis?.stats||{};
  const raw=`${evt?.playType||''} ${evt?.detail||''}`.toLowerCase();
  if(kind==='td'){
    return ['pass_td','rush_td','rec_td','fum_rec_td','def_td','def_st_td','st_td','kick_ret_td','punt_ret_td']
      .some(k=>Number(stats[k]||0)>0)||/touchdown|pick six|scoop and score|kick six|return td/.test(raw);
  }
  if(kind==='turnover'){
    return Number(stats.int||0)>0||Number(stats.fum_lost||0)>0||/interception|pick six|fumble|scoop/.test(raw);
  }
  return false;
}
function gvSemanticPlayKey(evt){
  const team=String(evt?.nflTeam||evt?.qbNflTeam||evt?.receiverNflTeam||'');
  const family=gvSemanticPlayFamily(evt);
  const yards=Math.round(gvSemanticPlayYards(evt));
  const td=gvMajorPlayFlag(evt,'td')?'td':'';
  const turnover=gvMajorPlayFlag(evt,'turnover')?'to':'';
  return `${team}::${family}::${yards}::${td}::${turnover}`;
}
function gvEventDedupeKey(evt){
  const type=String(evt?.playType||evt?.intervalAnalysis?.family||evt?.type||'');
  const team=String(evt?.nflTeam||evt?.qbNflTeam||evt?.receiverNflTeam||'');
  const actors=gvEventActorKey(evt);
  const stats=gvEventStatSignature(evt);
  const yards=Math.round(Math.abs(Number(evt?.visualYards||0)));
  const detail=String(evt?.detail||'').toLowerCase().replace(/\s+/g,' ').trim();
  return `${team}::${actors}::${type}::${stats}::${yards}::${detail}`;
}
function gvFindRecentEquivalentEvent(events,evt,windowMs=GV_EVENT_DEDUPE_WINDOW_MS){
  if(!evt)return null;
  const exact=gvEventDedupeKey(evt);
  const semantic=gvSemanticPlayKey(evt);
  const actors=new Set(gvEventActorKey(evt).split(',').filter(Boolean));
  const time=Number(evt.time||evt.ingestedAt||Date.now());
  const src=String(evt?.source||'').toLowerCase();
  const allowLooseSemantic=src!=='testing'&&src!=='simulation';

  for(const prior of events||[]){
    if(!prior||prior.type==='summary')continue;
    const pt=Number(prior.time||prior.ingestedAt||0);
    const age=Math.abs(time-pt);
    if(age<=windowMs&&gvEventDedupeKey(prior)===exact)return prior;

    // Loose semantic matching is intentionally confined to one ingestion burst.
    // Normal live polls are ~15s apart, so a 6s ceiling catches enriched copies of
    // the same play without swallowing a later legitimate play with similar stats.
    if(!allowLooseSemantic||age>6000)continue;
    const priorSrc=String(prior?.source||'').toLowerCase();
    if(priorSrc==='testing'||priorSrc==='simulation')continue;
    if(gvSemanticPlayKey(prior)!==semantic)continue;

    const priorActors=new Set(gvEventActorKey(prior).split(',').filter(Boolean));
    const actorOverlap=[...actors].some(id=>priorActors.has(id));
    const family=gvSemanticPlayFamily(evt);
    const sameFamily=gvSemanticPlayFamily(prior)===family;
    const y1=gvSemanticPlayYards(prior),y2=gvSemanticPlayYards(evt);
    const yardsClose=Math.abs(y1-y2)<=1;

    // Passer-side and receiver-side copies from the same Sleeper interval can have
    // different actor sets/details, but must agree on team/family/yardage.
    const st=evt?.intervalAnalysis?.stats||{},pst=prior?.intervalAnalysis?.stats||{};
    const passerReceiverSplit=sameFamily&&family==='pass'&&yardsClose&&(
      (Number(st.pass_att||st.pass_cmp||0)>0&&Number(pst.rec||0)>0)||
      (Number(pst.pass_att||pst.pass_cmp||0)>0&&Number(st.rec||0)>0)
    );

    if(yardsClose&&(passerReceiverSplit||actorOverlap))return prior;
  }
  return null;
}

function gvFeedAdd(entry,queueForPlayback=true){
  const s=gvEnsureSession();if(!s)return;
  let normalized=gvNormalizeEventSource(entry,entry?.type==='summary'?'summary':'live');
  if(!normalized?.unresolvedTeamScore&&!gvIsStartedPlayerForEvent(normalized))return;
  const semantic=gvCorrectionEvidence(normalized);
  normalized={...normalized,likelyCorrection:semantic.correction,negativeScoringEvent:semantic.negativePlay,correctionReason:normalized.correctionReason||semantic.reason||''};
  const correctionMerge=gvReconcileCorrectionIntoSession(s,normalized);
  if(correctionMerge.handled){gvSaveSession();return correctionMerge.event}
  normalized=correctionMerge.event;
  const exactRecentDuplicate=gvFindRecentEquivalentEvent(s.feed,normalized);
  if(exactRecentDuplicate){
    normalized.duplicateOf=exactRecentDuplicate.id;
    return exactRecentDuplicate;
  }
  normalized={...normalized,dedupeKey:gvEventDedupeKey(normalized),semanticKey:gvSemanticPlayKey(normalized)};
  const revisionCheck=gvSuppressOrReviseDuplicateEvent(s.feed,normalized);
  if(revisionCheck.duplicate&&!revisionCheck.revised)return;
  s.feed=revisionCheck.feed;
  if(revisionCheck.revised){
    normalized={...normalized,revisedExistingEvent:true};
    s.queue=(s.queue||[]).filter(id=>!s.feed.some(e=>e.id===id&&gvEventsLookLikeSameRevision(e,normalized)));
  }

  if(normalized.turnoverCorrelatedAcrossPolls&&normalized.offensivePlayerId&&normalized.defensivePlayerId){
    const t=Number(normalized.time||0);
    s.feed=s.feed.filter(e=>{
      if(e.id===normalized.id)return false;
      const sameActor=e.playerId===normalized.offensivePlayerId||e.playerId===normalized.defensivePlayerId;
      const near=Math.abs(Number(e.time||0)-t)<=GV_TURNOVER_CORRELATION_MS;
      const es=e.intervalAnalysis?.stats||{};
      const turnoverish=(es.pass_int||0)>0||(es.fum_lost||es.fum_lost_total||0)>0||(es.int||0)>0||(es.fum_rec||0)>0||(es.def_td||0)>0;
      if(sameActor&&near&&turnoverish){
        s.queue=(s.queue||[]).filter(id=>id!==e.id);
        return false;
      }
      return true;
    });
  }

  if(normalized.tdCorrelatedAcrossPolls&&normalized.qbPlayerId&&normalized.receiverPlayerId){
    const t=Number(normalized.time||0);
    s.feed=s.feed.filter(e=>{
      if(e.id===normalized.id)return false;
      const samePlayer=e.playerId===normalized.qbPlayerId||e.playerId===normalized.receiverPlayerId;
      const sameTeam=e.nflTeam&&normalized.nflTeam&&e.nflTeam===normalized.nflTeam;
      const near=Math.abs(Number(e.time||0)-t)<=GV_TD_CORRELATION_MS;
      const tdish=/touchdown|TD/i.test(String(e.detail||''))||(e.intervalAnalysis?.stats?.pass_td||0)>0||(e.intervalAnalysis?.stats?.rec_td||0)>0;
      if(samePlayer&&sameTeam&&near&&tdish){
        s.queue=(s.queue||[]).filter(id=>id!==e.id);
        return false;
      }
      return true;
    });
  }

  s.feed.push(normalized);
  if(normalized.type==='play'||normalized.type==='burst')gvArchiveReplayEvent(normalized);
  if(queueForPlayback&&(normalized.type==='play'||normalized.type==='burst'))s.queue.push(normalized.id);
  gvSaveSession();
}
function gvRestorePlaybackQueue(){
  if(!gameViewSession)return;
  gameViewSession.feed=(gameViewSession.feed||[]).map(e=>gvNormalizeEventSource(e,e?.type==='summary'?'summary':'live'));
  const byId=new Map(gameViewSession.feed.map(e=>[e.id,e]));
  const existing=new Set(gameViewQueue.map(e=>e.id));
  for(const id of gameViewSession.queue||[]){
    const e=byId.get(id);
    if(e&&!existing.has(id))gameViewQueue.push(e);
  }
  gameViewQueue=gameViewQueue.map(e=>gvNormalizeEventSource(e)).sort((a,b)=>(a.time||0)-(b.time||0));
}
const GAMEVIEW_PLAY_ARCHIVE_PREFIX='ucl-gameday-play-archive-v1';
const GAMEVIEW_PLAY_ARCHIVE_MAX_PER_WEEK=300;
function gvPlayArchiveWeekKey(){
  const season=String(nflState?.season||new Date().getFullYear());
  const type=String(nflState?.season_type||'regular');
  const week=Number(nflState?.week||1);
  return `${season}:${type}:week-${week}`;
}
function gvPlayArchiveStorageKey(weekKey=gvPlayArchiveWeekKey()){
  return `${GAMEVIEW_PLAY_ARCHIVE_PREFIX}:${String(weekKey)}`;
}
function gvLoadPersistentPlayArchive(weekKey=gvPlayArchiveWeekKey()){
  try{
    const raw=storage.get(gvPlayArchiveStorageKey(weekKey),'');
    if(!raw)return {};
    const parsed=JSON.parse(raw);
    return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};
  }catch(e){return {}}
}
function gvPersistentArchiveEligible(evt){
  if(!evt?.id||!['play','burst'].includes(String(evt.type||'')))return false;
  const src=gvNormalizeSourceValue(evt?.source,evt||{});
  return src!=='testing'&&src!=='simulation';
}
function gvPersistentArchiveDedupeKey(evt){
  return String(evt?.semanticKey||evt?.dedupeKey||evt?.id||'');
}
function gvSavePersistentPlay(evt){
  if(!gvPersistentArchiveEligible(evt))return null;
  const snap=gvReplaySnapshot(evt);if(!snap)return null;
  const weekKey=gvPlayArchiveWeekKey(),archive=gvLoadPersistentPlayArchive(weekKey);
  const dedupe=gvPersistentArchiveDedupeKey(snap);
  const duplicateId=Object.keys(archive).find(id=>id===String(snap.id)||(dedupe&&gvPersistentArchiveDedupeKey(archive[id])===dedupe));
  if(duplicateId&&duplicateId!==String(snap.id))delete archive[duplicateId];
  snap.archiveWeekKey=weekKey;snap.archiveCapturedAt=Date.now();
  archive[String(snap.id)]=snap;
  const ids=Object.keys(archive);
  if(ids.length>GAMEVIEW_PLAY_ARCHIVE_MAX_PER_WEEK){
    ids.sort((a,b)=>Number(archive[a]?.archiveCapturedAt||archive[a]?.replayCapturedAt||archive[a]?.time||0)-Number(archive[b]?.archiveCapturedAt||archive[b]?.replayCapturedAt||archive[b]?.time||0));
    for(const id of ids.slice(0,ids.length-GAMEVIEW_PLAY_ARCHIVE_MAX_PER_WEEK))delete archive[id];
  }
  storage.set(gvPlayArchiveStorageKey(weekKey),JSON.stringify(archive));
  return snap;
}
function gvPersistentArchivedEvent(id){
  if(!id)return null;
  const e=gvLoadPersistentPlayArchive()[String(id)];
  return e?gvReplaySnapshot(e):null;
}
function gvPersistentArchiveEntries(){return Object.values(gvLoadPersistentPlayArchive())}

function gvReplaySnapshot(evt){
  if(!evt||!evt.id)return null;
  try{
    const snap=JSON.parse(JSON.stringify(evt));
    snap.played=true;
    snap.replayCapturedAt=Date.now();
    return snap;
  }catch(e){
    const snap={...evt,played:true,replayCapturedAt:Date.now()};
    // Runtime diagnostics are never required to reconstruct the animation.
    delete snap.phaseHandoffAudit;delete snap.ballContinuityAudit;delete snap.terminalPossessionAudit;delete snap.terminalFrameAudit;
    return snap;
  }
}
function gvArchiveReplayEvent(evt){
  const snap=gvReplaySnapshot(evt);if(!snap)return null;
  const s=gameViewSession||gvEnsureSession();
  if(s){
    if(!s.replayArchive||typeof s.replayArchive!=='object'||Array.isArray(s.replayArchive))s.replayArchive={};
    s.replayArchive[String(snap.id)]=snap;
    // Keep the archive bounded while preserving the newest completed plays.
    const ids=Object.keys(s.replayArchive);
    if(ids.length>120){
      ids.sort((a,b)=>Number(s.replayArchive[a]?.replayCapturedAt||s.replayArchive[a]?.time||0)-Number(s.replayArchive[b]?.replayCapturedAt||s.replayArchive[b]?.time||0));
      for(const id of ids.slice(0,ids.length-120))delete s.replayArchive[id];
    }
    gvSaveSession();
  }
  return snap;
}
function gvReplayArchivedEvent(id){
  if(!id)return null;
  const e=gameViewSession?.replayArchive?.[String(id)];
  return e?gvReplaySnapshot(e):null;
}
function gvReplayAvailable(id){return !!(gvReplayArchivedEvent(id)||gvPersistentArchivedEvent(id))}

function gvMarkPlayed(evt){
  const s=gameViewSession;if(!s||!evt?.id)return false;
  if(!Array.isArray(s.playedIds))s.playedIds=[];
  if(!Array.isArray(s.queue))s.queue=[];
  if(!Array.isArray(s.feed))s.feed=[];
  if(!s.playedIds.includes(evt.id))s.playedIds.push(evt.id);
  s.queue=s.queue.filter(id=>id!==evt.id);
  const f=s.feed.find(x=>x.id===evt.id);if(f)f.played=true;
  gvSaveSession();
  return true;
}
function testingMarkGameViewPlayed(evt){
  if(!evt?.id)return false;
  const f=testingGameViewFeed.find(x=>x.id===evt.id);if(f)f.played=true;
  for(let i=testingGameViewQueue.length-1;i>=0;i--)if(testingGameViewQueue[i]?.id===evt.id)testingGameViewQueue.splice(i,1);
  return !!f;
}
function gvMarkEventPlayed(evt){
  const src=gvNormalizeSourceValue(evt?.source,evt||{});
  if(src==='testing')return testingMarkGameViewPlayed(evt);
  if(src==='simulation'){
    const f=gameViewEvents.find(x=>x.id===evt?.id);if(f)f.played=true;
    return true;
  }
  gvArchiveReplayEvent(evt);
  gvSavePersistentPlay(evt);
  return gvMarkPlayed(evt);
}
const gvActiveMotionFrames=new Set();
const gameViewPending=[];let gameViewPendingTimer=null;let gameViewSequence=0;const GAMEVIEW_INGEST_HOLD_MS=900;
const gameViewCorrelationWindow=[];const GAMEVIEW_CORRELATION_MS=2500;
let gameViewStats={},lastGameViewStats={},gameViewStatsAt=0;
let gameViewOpponentByPlayer={};
let gameViewNflOpponentMap={};
let gameViewScheduleSeason='';
let gameViewScheduleType='';
let gameViewScheduleLoadedAt=0;


const TESTING_LOG_KEY='ucl-gameday-testing-log-v1';
const TESTING_PREFS_KEY='ucl-gameday-testing-prefs-v1';
const TESTING_PANEL_STATE_KEY='ucl-gameday-testing-panels-v1';
const TESTING_PANEL_IDS=['testingDeltaSimulator'];
function testingPanelStateLoad(){
  try{
    const raw=localStorage.getItem(TESTING_PANEL_STATE_KEY);
    const parsed=raw?JSON.parse(raw):{};
    return parsed&&typeof parsed==='object'?parsed:{};
  }catch(e){return {}}
}
function testingPanelStateApply(){
  const state=testingPanelStateLoad();
  for(const id of TESTING_PANEL_IDS){
    const el=document.getElementById(id);if(!el)continue;
    el.open=state[id]===true;
  }
}
function testingPanelStateBind(){
  testingPanelStateApply();
  for(const id of TESTING_PANEL_IDS){
    const el=document.getElementById(id);if(!el||el.dataset.panelStateBound==='1')continue;
    el.dataset.panelStateBound='1';
    el.addEventListener('toggle',()=>{
      const state=testingPanelStateLoad();state[id]=!!el.open;
      try{localStorage.setItem(TESTING_PANEL_STATE_KEY,JSON.stringify(state))}catch(e){}
    });
  }
}
const testingLog=[];
const testingGameViewFeed=[];
const testingGameViewQueue=[];

const testingPollSequence=[];
let testingPollNumber=1;
let testingPollOffsetMs=0;
let testingSequenceBaseTime=Date.now();
const testingSequenceTdCandidates=[];
const testingSequenceConsumedTdKeys=new Set();
const testingSequenceTurnoverCandidates=[];
const testingSequenceConsumedTurnoverKeys=new Set();

const TESTING_LOG_MAX=250;
let testingTeamFilter='all';
let testingPosFilter='all';
let testingRawVisible=false;
const testingLastFantasyPoints={};
const gvRecentTdCandidates=[];
const GV_TD_CORRELATION_MS=35000;
const gvConsumedTdKeys=new Set();
const gvRecentTurnoverCandidates=[];
const GV_TURNOVER_CORRELATION_MS=35000;
const gvConsumedTurnoverKeys=new Set();
let testingLastPollAt=0;


function purgeLegacyTestingStorage(){
  try{storage.remove?.('ucl-gameday-testing-log-v1')}catch(e){}
  try{storage.remove?.('ucl-gameday-testing-prefs-v1')}catch(e){}
  try{localStorage.removeItem('ucl-gameday-testing-log-v1')}catch(e){}
  try{localStorage.removeItem('ucl-gameday-testing-prefs-v1')}catch(e){}
}


function clearAllLocalAppData(){
  const ok=confirm('Clear all locally saved UCL GameDay data on this device? This cannot be undone.');
  if(!ok)return false;

  // v0.5.13: block every persistence path before touching storage. Reloading fires
  // pagehide/visibilitychange, which used to re-save the still-live GameView session
  // immediately after it had been deleted.
  clearingLocalAppData=true;

  try{cancelGameViewPlayback(true)}catch(e){
    try{gameViewQueue.length=0}catch(_){}
    try{gameViewPending.length=0}catch(_){}
    try{if(gameViewPendingTimer){clearTimeout(gameViewPendingTimer);gameViewPendingTimer=null}}catch(_){}
  }
  try{gameViewCorrelationWindow.length=0}catch(e){}
  try{gameViewEvents.length=0}catch(e){}
  try{gameViewSession=null}catch(e){}
  try{gvActorAnimations=[]}catch(e){}

  try{
    const keys=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k&&(/ucl[-_ ]?gameday/i.test(k)||/ucl-gameday/i.test(k)))keys.push(k);
    }
    keys.forEach(k=>localStorage.removeItem(k));
  }catch(e){}
  try{
    if(window.indexedDB){
      // GameDay currently relies primarily on localStorage; known app databases are removed defensively.
      ['ucl-gameday','UCLGameDay','ucl-gameday-cache'].forEach(name=>{
        try{indexedDB.deleteDatabase(name)}catch(e){}
      });
    }
  }catch(e){}
  try{sessionStorage.clear()}catch(e){}
  alert('Local UCL GameDay data cleared. The app will reload now.');
  location.reload();
  return true;
}

function loadTestingState(){
  purgeLegacyTestingStorage();
  testingLog.length=0;
  testingTeamFilter='all';
  testingPosFilter='all';
  testingRawVisible=false;
}
function saveTestingState(){
  // Intentionally non-persistent: Testing Area data exists only in memory for this page session.
}
function testingRosterSideForPlayer(pid){
  const {mine,opp}=gvSelectedAndOpponentRosterIds();
  const mineRoster=mine?rosterFor(mine):null,oppRoster=opp?rosterFor(opp):null;
  if((mineRoster?.players||[]).map(String).includes(String(pid)))return 'mine';
  if((oppRoster?.players||[]).map(String).includes(String(pid)))return 'opp';
  return 'unknown';
}
function testingEntryVisible(entry){
  if(!entry)return false;
  if(testingTeamFilter!=='all'&&entry.side!==testingTeamFilter)return false;
  if(testingPosFilter!=='all'&&String(entry.pos||'').toUpperCase()!==testingPosFilter)return false;
  return true;
}
function testingIntervalLabel(entry){
  const c=entry?.intervalClass||'';
  if(c==='MULTI_PLAY_BURST')return {text:'MULTI-PLAY BURST',cls:'burst'};
  if(c==='AMBIGUOUS_SUMMARY')return {text:'AMBIGUOUS',cls:'ambiguous'};
  return {text:'PLAY',cls:''};
}

