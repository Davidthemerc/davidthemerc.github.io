/* UCL GameDay v0.5.03 — build fragment: 00_bootstrap_session.js
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
const VERSION='0.5.03',LEAGUE_ID='1386066375474180096',API='https://api.sleeper.app/v1',POLL_MS=15000;
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
const simulation={active:false,paused:false,speed:20,style:'chaos',scenario:'full',elapsed:0,total:0,lastReal:0,virtualStart:Date.now(),liveMatchups:null,liveGameViewStats:null,liveLastGameViewStats:null,liveGameViewStatsAt:0,loop:null,lastSessionId:null,assignments:new Map(),scoreSchedule:[],scoreCursor:0};
const momentumGames=new Map();
const gameViewEvents=[];let gameViewQueue=[];let gameViewPlaying=false;let gvActorAnimations=[];

const GAMEVIEW_SESSION_KEY='ucl-gameday-gameview-session-v1';
let gameViewSession=null;

function gvCurrentWeekKey(){
  const season=String(nflState?.season||new Date().getFullYear());
  const type=String(nflState?.season_type||'regular');
  const week=Number(nflState?.week||1);
  const pair=chosenPair?.();
  const ids=pair?.rows?.map(r=>String(r.roster_id)).sort()||[];
  return `${season}:${type}:week-${week}:${ids.join('-vs-')}`;
}
function gvSelectedRosterIds(){
  const pair=chosenPair?.();return pair?.rows?.map(r=>String(r.roster_id))||[];
}
function gvMatchupScoreSnapshot(){
  const pair=chosenPair?.();if(!pair)return null;
  const rows=pair.rows||[],byRoster={},statsByPlayer={};
  const statKeys=['rush_att','rush_yd','rush_td','rec','rec_yd','rec_td','pass_att','pass_cmp','pass_yd','pass_td','pass_int','fum_lost','fgm','fgm_0_19','fgm_20_29','fgm_30_39','fgm_40_49','fgm_50p','xpm','def_td','def_st_td','int','fum_rec','sack','def_int_ret_yd','fum_rec_yd','kick_ret_yd','punt_ret_yd'];
  for(const r of rows){
    byRoster[String(r.roster_id)]={
      rosterId:String(r.roster_id),
      points:Number(r.points)||0,
      playersPoints:{...(r.players_points||{})},
      starters:[...(r.starters||[])],
      players:[...(r.players||[])]
    };
    for(const pid of new Set([...(r.players||[]),...(r.starters||[]),...Object.keys(r.players_points||{})])){
      const raw=gameViewStats[String(pid)]||{},compact={};
      for(const k of statKeys){const v=Number(raw[k]);if(Number.isFinite(v)&&v!==0)compact[k]=v}
      statsByPlayer[String(pid)]=compact;
    }
  }
  return {capturedAt:Date.now(),weekKey:gvCurrentWeekKey(),byRoster,statsByPlayer};
}
function gvSessionScoreLine(snapshot){
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
function gvSaveSession(){
  try{
    if(!gameViewSession)return false;
    gameViewSession.lastSeenAt=Date.now();
    return storage.set(GAMEVIEW_SESSION_KEY,JSON.stringify(gameViewSession));
  }catch(e){return false}
}
function gvLoadSession(){
  try{
    const raw=storage.get(GAMEVIEW_SESSION_KEY,'');if(!raw)return false;
    const s=JSON.parse(raw);
    if(!s||s.weekKey!==gvCurrentWeekKey())return false;
    if(!Array.isArray(s.feed))s.feed=[];
    if(!Array.isArray(s.queue))s.queue=[];
    if(!Array.isArray(s.playedIds))s.playedIds=[];
    if(!s.replayArchive||typeof s.replayArchive!=='object'||Array.isArray(s.replayArchive))s.replayArchive={};
    if(!Array.isArray(s.activityWindows))s.activityWindows=[];
    s.schema=2;
    gameViewSession=s;
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
function gvReconcileCorrectionIntoSession(session,evt){
  if(!session||!gvIsLikelyStatCorrection(evt))return {handled:false,event:evt};
  const hit=gvFindRevisionTarget(session.feed,evt);
  if(!hit){
    // With no safe target, keep the revision visible but never animate it as a football play.
    return {handled:false,event:{...evt,type:'summary',played:true,correctionUnmatched:true}};
  }
  const old=hit.event,wasPlayed=!!old.played||(session.playedIds||[]).includes(old.id);
  if(wasPlayed){
    return {handled:false,event:{...evt,type:'summary',played:true,revisedExistingEvent:true,correctionOfEventId:old.id}};
  }

  const revisedDelta=Number((Number(old.delta||0)+Number(evt.delta||0)).toFixed(2));
  session.queue=(session.queue||[]).filter(id=>id!==old.id);
  gvRemoveEventFromTransientQueues(old.id);

  if(Math.abs(revisedDelta)<0.01){
    session.feed.splice(hit.index,1);
    return {handled:false,event:{...evt,type:'summary',played:true,revisedExistingEvent:true,correctionOfEventId:old.id,removedPriorEvent:true,detail:`Sleeper removed prior ${old.detail||'scoring event'}`}};
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
function gvFeedAdd(entry,queueForPlayback=true){
  const s=gvEnsureSession();if(!s)return;
  let normalized=gvNormalizeEventSource(entry,entry?.type==='summary'?'summary':'live');
  const semantic=gvCorrectionEvidence(normalized);
  normalized={...normalized,likelyCorrection:semantic.correction,negativeScoringEvent:semantic.negativePlay,correctionReason:normalized.correctionReason||semantic.reason||''};
  const correctionMerge=gvReconcileCorrectionIntoSession(s,normalized);
  if(correctionMerge.handled){gvSaveSession();return correctionMerge.event}
  normalized=correctionMerge.event;
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
function gvReplayAvailable(id){return !!gvReplayArchivedEvent(id)}

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
  gvArchiveReplayEvent(evt);
  if(src==='simulation'){
    const f=gameViewEvents.find(x=>x.id===evt?.id);if(f)f.played=true;
    return true;
  }
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
const TESTING_PANEL_IDS=['ctespnAudioSoundboard','testingDeltaSimulator'];
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

