function renderSeasonGameDayLiveBanner(){
  const banner=$('#seasonGameDayLiveBanner'),detail=$('#seasonGameDayLiveDetail');
  if(!banner)return;
  const live=typeof uclGameDayLiveState==='function'?uclGameDayLiveState():{live:false,count:0,games:[]};
  banner.hidden=!live.live;
  if(!live.live)return;
  if(detail)detail.textContent=live.count===1?'1 NFL game is currently in progress.':`${live.count} NFL games are currently in progress.`;
}

const SEASON_LAZY_GROUPS={
  seasonManagement(roster,oppRoster,mine,opp){renderWaiverCenter(roster);},
  seasonPostseason(roster,oppRoster,mine,opp){renderPlayoffMachine();renderStandingsAndPlayoffRace();void ensureRemainingRegularSeasonSchedule();},
  seasonAchievements(roster,oppRoster,mine,opp){if(typeof renderPublicAchievements==='function')renderPublicAchievements();},
  seasonRecords(roster,oppRoster,mine,opp){renderRivalryContext(roster,oppRoster);renderHistoryBridge();if(roster&&oppRoster)void ensureRivalryApiHistory(roster,oppRoster);}
};
let seasonLazyObserver=null;
let seasonLazyContext={roster:null,oppRoster:null,mine:null,opp:null};
let seasonLazyDirty=new Set(Object.keys(SEASON_LAZY_GROUPS));
function seasonGroupIsNearViewport(id,margin=120){
  const el=document.getElementById(id);if(!el||!$('#seasonView')?.classList.contains('active'))return false;
  const r=el.getBoundingClientRect(),h=window.innerHeight||document.documentElement.clientHeight||0;
  return r.bottom>=-margin&&r.top<=h+margin;
}
function renderSeasonLazyGroup(id,{force=false}={}){
  const fn=SEASON_LAZY_GROUPS[id];if(!fn)return false;
  if(!force&&!seasonLazyDirty.has(id))return false;
  const c=seasonLazyContext;
  fn(c.roster,c.oppRoster,c.mine,c.opp);
  seasonLazyDirty.delete(id);
  return true;
}
function renderVisibleSeasonLazyGroups(){
  for(const id of Object.keys(SEASON_LAZY_GROUPS))if(seasonGroupIsNearViewport(id))renderSeasonLazyGroup(id);
}
function ensureSeasonLazyObserver(){
  if(seasonLazyObserver)return;
  if(typeof IntersectionObserver!=='function'){
    seasonLazyObserver={fallback:true};
    for(const id of Object.keys(SEASON_LAZY_GROUPS))renderSeasonLazyGroup(id);
    return;
  }
  seasonLazyObserver=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting)renderSeasonLazyGroup(entry.target.id);
  },{root:null,rootMargin:'120px 0px',threshold:0});
  for(const id of Object.keys(SEASON_LAZY_GROUPS)){
    const el=document.getElementById(id);if(el)seasonLazyObserver.observe(el);
  }
}
function updateSeasonLazyContext(roster,oppRoster,mine,opp){
  seasonLazyContext={roster:roster||null,oppRoster:oppRoster||null,mine:mine||null,opp:opp||null};
  seasonLazyDirty=new Set(Object.keys(SEASON_LAZY_GROUPS));
  ensureSeasonLazyObserver();
  renderVisibleSeasonLazyGroups();
}
function prepareSeasonSection(section){
  const id=String(section||'');
  if(SEASON_LAZY_GROUPS[id])renderSeasonLazyGroup(id,{force:true});
  return !!document.getElementById(id);
}

function renderSeasonCompanion(){
  const view=$('#seasonView');if(!view)return;
  renderSeasonGameDayLiveBanner();
  const week=seasonDisplayWeek();
  applyLifecycleUI();
  populateSeasonWeekSelector();
  const seasonMode=draftAllowsPostDraftViews();
  $('#seasonStatus').textContent=nflState
    ?`Your guide to NFL Week ${week}.`
    :(seasonMode?`Your guide to NFL Week ${week}.`:'Season workspace not active yet.');
  const health=companionDataHealth();
  const fresh=$('#seasonFreshness');
  if(fresh){
    const when=seasonDataMeta.lastSync?new Date(seasonDataMeta.lastSync).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):'never';
    const chipClass=runtimeDataMode==='offline'?'offline':runtimeDataMode==='stale'?'stale':runtimeDataMode==='saved'?'saved':health.ok?'good':'warn';
    const chipText=runtimeDataMode==='offline'?'Offline • saved data':runtimeDataMode==='stale'?`Stale data • ${runtimeCacheAgeText()}`:runtimeDataMode==='saved'?`Saved data • ${runtimeCacheAgeText()}`:health.ok?'Data current':esc(health.issues.join(' • '));
    fresh.innerHTML=`<span class="data-health-chip ${chipClass}">${chipText}</span> • last season sync ${when}`;
  }

  const roster=leagueRosters.find(r=>String(r.roster_id)===String(sleeperCtx.rosterId));
  if(!roster){
    $('#seasonMyTeam').textContent=sleeperCtx.teamName||sleeperCtx.username||'My Team';
    if($('#seasonWatchList'))$('#seasonWatchList').innerHTML='<div class="empty">Select your Sleeper team.</div>';
    if($('#seasonOpponentGrid'))$('#seasonOpponentGrid').innerHTML='';
    renderMatchupCenter(null,null,null,null);
    renderOtherLeagueMatchups();
    renderMatchupIntelligence(null,null,null,null);
    updateSeasonLazyContext(null,null,null,null);
    return;
  }

  const {mine,opp}=matchupForRoster(roster.roster_id,week);
  $('#seasonMyTeam').innerHTML=`${esc(rosterUserName(roster))} ${uclVenuePill(week,roster.roster_id)}`;
  $('#seasonMyRecord').textContent=rosterRecord(roster);

  let oppRoster=null,scoring=null;
  if(opp){
    oppRoster=leagueRosters.find(r=>String(r.roster_id)===String(opp.roster_id));
    scoring=matchupScoringContext(roster,oppRoster,mine,opp,week);
    $('#seasonMyPoints').textContent=matchupScoreText(scoring,'my');
    $('#seasonOppTeam').innerHTML=`${esc(rosterUserName(oppRoster))} ${uclVenuePill(week,oppRoster.roster_id)}`;
    $('#seasonOppPoints').textContent=matchupScoreText(scoring,'opp');
    $('#seasonOppRecord').textContent=rosterRecord(oppRoster);
    $('#matchupState').textContent=scoring.projected?`Week ${week} projections`:`Matchup ${mine.matchup_id}`;
    $('#matchupNote').textContent=scoring.projected
      ?`Pregame totals use Sleeper Week ${week} projections and will switch to actual points after kickoff.`
      :scoring.started?(scoring.projectionAvailable?`Week ${week} live scoring from Sleeper with projected final totals in parentheses.`:`Week ${week} live scoring from Sleeper.`):`Week ${week} projections are still loading; totals will update automatically.`;
  }else{
    $('#seasonOppTeam').textContent='Opponent';
    $('#seasonOppPoints').textContent='—';
    $('#seasonOppRecord').textContent='—';
    $('#matchupState').textContent='Awaiting matchup';
    $('#matchupNote').textContent='Sleeper has not published a paired matchup for this roster/week yet.';
  }

  renderSeasonIntelligence(roster,oppRoster,mine,opp,scoring);
  renderMatchupCenter(roster,oppRoster,mine,opp,scoring);
  renderOtherLeagueMatchups();
  renderMatchupIntelligence(roster,oppRoster,mine,opp);

  updateSeasonLazyContext(roster,oppRoster,mine,opp);
}
