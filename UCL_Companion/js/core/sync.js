function currentDraftFingerprint(picks=lastDraftPicks,draft=verifiedDraft){
  return `${draft?.status||''}#${(picks||[]).map(p=>`${p.pick_no||''}:${p.player_id||''}:${p.roster_id||''}`).join('|')}`;
}
function resetTeamRuntimeState(){
  playoffScenarioOutcomes={};
  selectedWeeklyReportWeek=null;
  selectedLeagueTeamRosterId=null;
  sleeperCtx.lastPickCount=0;
}

function commitDraftSyncState({fingerprint=currentDraftFingerprint(lastDraftPicks,verifiedDraft),issues=[]}={}){
  const now=Date.now();
  sleeperCtx.lastPickCount=lastDraftPicks.length;
  lastDraftFingerprint=fingerprint;
  lastDraftSyncAt=now;
  runtimeDataMode=issues.length?'partial':'current';
  if(!issues.length){
    runtimeLastSuccess=now;
    lastSuccessfulSleeperSyncAt=now;
    lastSleeperError='';
    lastSleeperErrorAt=0;
  }
  persistRuntimeCache();
}

function reconcileDraftTransientUI(){
  // Close a What If preview if its player is no longer available after a live pick.
  const dialog=$('#whatIfDialog');
  if(dialog?.open){
    const rank=Number(dialog.dataset.rank||0);
    const p=PLAYERS.find(x=>x.rank===rank);
    if(!p||ps(rank).draft!=='available'){
      dialog.close();
      dialog.removeAttribute('data-rank');
    }
  }

  // Clear stale recommendation-detail state when the selected player was drafted.
  const why=$('#whyDialog');
  if(why?.open){
    const rank=Number(why.dataset.rank||0);
    if(rank&&ps(rank).draft!=='available'){
      why.close();
      why.removeAttribute('data-rank');
    }
  }

  // A card that just became unavailable should not remain expanded in mobile secondary actions.
  document.querySelectorAll('.mobile-more-actions[open]').forEach(d=>{
    const card=d.closest('[data-player-rank]');
    const rank=Number(card?.dataset?.playerRank||0);
    if(rank&&ps(rank).draft!=='available')d.open=false;
  });
}

function renderDraftSyncViews({force=false,changed=true}={}){
  if(!force&&!changed)return;

  // Draft-era UI is archival in Live Season mode. Only render an archive
  // surface when it is actually open.
  if(draftAllowsPostDraftViews()){
    if($('#draftView')?.classList.contains('active'))renderPostDraftReport();
    if($('#analysisView')?.classList.contains('active'))renderTeamAnalysis();
    if($('#logView')?.classList.contains('active'))renderDraftLog();
    if($('#teamView')?.classList.contains('active'))renderTeam();
    if($('#teamsView')?.classList.contains('active'))renderLeagueTeams();
    if($('#homeView')?.classList.contains('active'))renderCompanionHome();
    updateCommandCenter();
    return;
  }

  reconcileDraftTransientUI();
  render();
  renderRecentPicks();
  renderDraftLog();
  renderDraftNeeds();
  renderDraftIntelligence();
  renderLiveDraftGrade();
  renderCompanionHome();
  if($('#teamView')?.classList.contains('active')){
    renderTeam();
    renderStrategyHistory();
  }
  if($('#analysisView')?.classList.contains('active'))renderTeamAnalysis();
  if($('#teamsView')?.classList.contains('active'))renderLeagueTeams();
  updateCommandCenter();
}
function renderSeasonSyncViews(){
  if($('#seasonView')?.classList.contains('active'))renderSeasonCompanion();
  if($('#teamView')?.classList.contains('active'))renderTeam();
  if($('#tradeView')?.classList.contains('active'))renderTradeCenter();
  if($('#fawView')?.classList.contains('active'))renderFaw();
  if($('#teamsView')?.classList.contains('active'))renderLeagueTeams();
  if($('#homeView')?.classList.contains('active'))renderCompanionHome();
  updateCommandCenter();
}
async function syncSeasonData(showStatus=false){
  if(!verifiedLeague)return;
  if(seasonSyncPromise){
    if(showStatus)setSyncStatus('busy','Season sync already in progress…');
    return seasonSyncPromise;
  }
  seasonSyncPromise=_syncSeasonDataImpl(showStatus);
  try{return await seasonSyncPromise;}
  finally{seasonSyncPromise=null;}
}
async function _syncSeasonDataImpl(showStatus=false){
  if(!verifiedLeague)return;
  const failures=[];
  try{
    if(showStatus)setSyncStatus('busy','Syncing season data…');

    // State is refreshed first so every subsequent request uses the actual current week.
    const stateRes=await sleeperGetSafe('/state/nfl',{ttlMs:60000,force:showStatus,fallback:nflState,label:'NFL state'});
    if(stateRes.ok)nflState=stateRes.value||nflState;
    else failures.push(stateRes.label);

    const week=currentWeekNumber();
    handleWeekTransition(week);
    const txWeeks=[week,Math.max(1,week-1)].filter((v,i,a)=>a.indexOf(v)===i);

    const [rosterRes,matchupRes,txResults]=await Promise.all([
      sleeperGetSafe(`/league/${SLEEPER_LEAGUE_ID}/rosters`,{ttlMs:60000,force:showStatus,fallback:leagueRosters,label:'league rosters'}),
      sleeperGetSafe(`/league/${SLEEPER_LEAGUE_ID}/matchups/${week}`,{ttlMs:30000,force:true,fallback:currentMatchups,label:`Week ${week} matchups`}),
      Promise.all(txWeeks.map(w=>sleeperGetSafe(`/league/${SLEEPER_LEAGUE_ID}/transactions/${w}`,{ttlMs:120000,force:showStatus,fallback:seasonTransactionsByWeek[w]||[],label:`Week ${w} transactions`})))
    ]);

    if(rosterRes.ok)leagueRosters=uniqueRosters(rosterRes.value); else failures.push(rosterRes.label);
    if(matchupRes.ok)currentMatchups=dedupeMatchupList(matchupRes.value); else failures.push(matchupRes.label);

    currentTransactions=txResults.flatMap((r,i)=>{
      if(!r.ok)failures.push(r.label);
      const w=txWeeks[i];
      if(r.ok)seasonTransactionsByWeek[w]=dedupeTransactionList(r.value);
      return dedupeTransactionList(r.value);
    });


    const finalizedThrough=Math.max(0,week-1);
    const missingWeeks=[];
    for(let w=1;w<=finalizedThrough;w++){
      if(!Array.isArray(seasonMatchupsByWeek[w])||seasonMatchupsByWeek[w].length===0)missingWeeks.push(w);
    }
    if(missingWeeks.length){
      const archiveWeeks=missingWeeks.slice(-SYNC_ARCHIVE_WEEKS_PER_RUN);
      const history=await Promise.all(archiveWeeks.map(w=>
        sleeperGetSafe(`/league/${SLEEPER_LEAGUE_ID}/matchups/${w}`,{
          ttlMs:24*60*60*1000,force:false,fallback:seasonMatchupsByWeek[w]||[],label:`Week ${w} history`
        }).then(r=>({week:w,...r}))
      ));
      for(const r of history){
        if(r.ok)seasonMatchupsByWeek[r.week]=dedupeMatchupList(r.value);
        else failures.push(r.label);
      }
    }
    seasonMatchupsByWeek[week]=dedupeMatchupList(currentMatchups);


    const missingTxWeeks=[];
    for(let w=1;w<=finalizedThrough;w++){
      if(!Array.isArray(seasonTransactionsByWeek[w]))missingTxWeeks.push(w);
    }
    if(missingTxWeeks.length){
      const archiveTxWeeks=missingTxWeeks.slice(-SYNC_ARCHIVE_WEEKS_PER_RUN);
      const txHistory=await Promise.all(archiveTxWeeks.map(w=>
        sleeperGetSafe(`/league/${SLEEPER_LEAGUE_ID}/transactions/${w}`,{
          ttlMs:24*60*60*1000,force:false,fallback:seasonTransactionsByWeek[w]||[],label:`Week ${w} transaction archive`
        }).then(r=>({week:w,...r}))
      ));
      for(const r of txHistory){
        if(r.ok)seasonTransactionsByWeek[r.week]=r.value||[];
        else failures.push(r.label);
      }
    }

    // Future schedule weeks are loaded lazily by the explicit Week selectors.
    // A normal Sync should not fan out across every future week.

    // Remove the obsolete full-player database cache if an older build left it behind.
    // v1.9.19 never fetches /players/nfl and does not need to retain that large record.
    apiCacheDelete('api','/players/nfl').catch(()=>{});
    try{await syncCurrentWeekProjections(week,showStatus);}catch(e){failures.push(`Week ${week} projections`);}

    seasonDataMeta={
      lastSync:Date.now(),
      failures:[...new Set(failures)],
      historicalWeeksLoaded:Object.keys(seasonMatchupsByWeek).filter(w=>Number(w)<week&&(seasonMatchupsByWeek[w]||[]).length).length
    };
    runtimeDataMode=failures.length?'partial':'current';
    if(!failures.length){
      runtimeLastSuccess=Date.now();
      lastSuccessfulSleeperSyncAt=Date.now();
      lastSleeperError='';
      lastSleeperErrorAt=0;
    }
    persistRuntimeCache();

    renderSeasonSyncViews();

    if(showStatus){
      if(failures.length)setSyncStatus('busy',`${sleeperCtx.leagueName||'Unmanaged Chaos'} • partial season sync • ${[...new Set(failures)].join(', ')}`);
      else setSyncStatus('ok',`${sleeperCtx.leagueName||'Unmanaged Chaos'} • season data synced ${syncStamp()} • v${APP_VERSION}`);
    }
  }catch(err){
    console.error(err);
    seasonDataMeta.failures=[err.message||'season sync error'];
    runtimeDataMode=(leagueRosters.length||currentMatchups.length)?'offline':'partial';
    renderSeasonSyncViews();
    if(showStatus){
      const detail=lastSleeperError||describeSleeperError(err);
      setSyncStatus('err',runtimeDataMode==='offline'?`${detail} • showing ${runtimeCacheAgeText()}`:`${detail}`);
    }
  }
}
async function verifyLeagueBase(force=false){
  // League identity is the only endpoint that must succeed with no fallback.
  const leagueRes=await sleeperGetSafe(`/league/${SLEEPER_LEAGUE_ID}`,{
    ttlMs:120000,force,fallback:verifiedLeague,label:'league'
  });
  if(!leagueRes.ok&&!verifiedLeague)throw leagueRes.error||new Error('League could not be loaded');
  const league=leagueRes.value||verifiedLeague;
  if(!league||String(league.league_id)!==SLEEPER_LEAGUE_ID)throw new Error('League ID did not verify');

  // These can independently fall back to the last good state.
  const [usersRes,rostersRes,draftsRes]=await Promise.all([
    sleeperGetSafe(`/league/${SLEEPER_LEAGUE_ID}/users`,{
      ttlMs:120000,force,fallback:leagueUsers,label:'league users'
    }),
    sleeperGetSafe(`/league/${SLEEPER_LEAGUE_ID}/rosters`,{
      ttlMs:60000,force,fallback:leagueRosters,label:'league rosters'
    }),
    sleeperGetSafe(`/league/${SLEEPER_LEAGUE_ID}/drafts`,{
      ttlMs:60000,force,fallback:verifiedDraft?[verifiedDraft]:[],label:'league drafts'
    })
  ]);

  verifiedLeague=league;
  if(Array.isArray(usersRes.value)&&usersRes.value.length)leagueUsers=usersRes.value.filter(Boolean);
  if(Array.isArray(rostersRes.value)&&rostersRes.value.length)leagueRosters=uniqueRosters(rostersRes.value);
  const drafts=Array.isArray(draftsRes.value)?draftsRes.value:[];

  populateSleeperTeamOptions(leagueUsers);
  sleeperCtx.leagueName=league.name||sleeperCtx.leagueName||'Unmanaged Chaos';
  sleeperCtx.draftId=String(league.draft_id||drafts?.[0]?.draft_id||sleeperCtx.draftId||'');
  verifiedDraft=drafts.find(d=>String(d.draft_id)===String(sleeperCtx.draftId))||drafts[0]||verifiedDraft;

  const degraded=[usersRes,rostersRes,draftsRes].filter(r=>!r.ok);
  if(degraded.length){
    runtimeDataMode=(leagueUsers.length&&leagueRosters.length)?'partial':runtimeLastSuccess?runtimeCacheFreshnessMode():'partial';
  }else{
    runtimeDataMode='current';
    runtimeLastSuccess=Date.now();
    lastSleeperError='';
    lastSleeperErrorAt=0;
  }
  return {league,users:leagueUsers,rosters:leagueRosters,drafts,issues:degraded.map(r=>r.label)};
}


function sizeSleeperTeamSelect(){
  const select=$('#sleeperUser');
  if(!select)return;
  const option=select.options?.[select.selectedIndex];
  const label=String(option?.textContent||select.value||'').trim();
  // ch is a good approximation here; CSS max-width still protects narrow phones.
  select.style.width=`${Math.max(9,Math.min(42,label.length+3))}ch`;
}
function selectedSleeperUserCandidate(){
  const saved=String(storageGet(KEY+'-sleeper-user','')||'').trim();
  const selected=String($('#sleeperUser')?.value||'').trim();
  const bootstrap=storageGetJson(RUNTIME_BOOTSTRAP_KEY,null);
  const bootUser=String(bootstrap?.username||'').trim();

  if(selected&&SLEEPER_USERS.includes(selected))return selected;
  if(saved&&SLEEPER_USERS.includes(saved))return saved;
  if(bootUser&&SLEEPER_USERS.includes(bootUser))return bootUser;
  return '';
}
function startupConnectionMatchesSelection(){
  const candidate=selectedSleeperUserCandidate();
  return !!candidate&&String(sleeperCtx.username||'')===candidate;
}
function ensureStartupSleeperConnection(force=false){
  const candidate=selectedSleeperUserCandidate();
  if(!candidate)return false;

  if(startupConnectionMatchesSelection()){
    startupConnectAttempted=true;
    startupConnectUser=candidate;
    if(force)connectSleeper(candidate);
    return true;
  }

  // Do not block a newly restored/changed visible selection just because another
  // startup attempt ran earlier for a different team.
  if(!force&&startupConnectAttempted&&startupConnectUser===candidate)return false;

  startupConnectAttempted=true;
  startupConnectUser=candidate;
  storageSet(KEY+'-sleeper-user',candidate);
  if($('#sleeperUser'))$('#sleeperUser').value=candidate;
  connectSleeper(candidate);
  return true;
}
function scheduleStartupConnectionRecovery(){
  if(startupConnectRetryTimer)clearTimeout(startupConnectRetryTimer);

  // Android/Chrome can restore <select> state after the script and even after
  // pageshow. Check a few times during the first two seconds and connect as soon
  // as the visible selection exists.
  const delays=[0,100,300,700,1400,2200];
  let index=0;
  const probe=()=>{
    startupConnectRetryTimer=null;
    if(startupConnectionMatchesSelection())return;
    const candidate=selectedSleeperUserCandidate();
    if(candidate){
      // If a visible selection appeared after an earlier blank pass, permit it.
      if(startupConnectUser!==candidate)startupConnectAttempted=false;
      ensureStartupSleeperConnection(false);
      if(startupConnectionMatchesSelection())return;
    }
    index++;
    if(index<delays.length){
      startupConnectRetryTimer=setTimeout(probe,delays[index]-delays[index-1]);
    }
  };
  startupConnectRetryTimer=setTimeout(probe,delays[0]);
}
async function connectSleeper(username){
  if(username){
    startupConnectAttempted=true;
    startupConnectUser=username;
  }
  const sameLoadedTeam=!!username&&String(sleeperCtx.username||'')===String(username)&&
    (!!verifiedLeague||leagueRosters.length>0);
  const generation=++connectGeneration;
  stopSleeperPolling();
  // Any in-flight draft sync from the previous selection may finish, but its context guard prevents it from applying.
  if(draftSyncPromise&&draftSyncPromise.ctx?.generation!==generation)draftSyncPromise=null;
  if(!sameLoadedTeam){
    resetTeamRuntimeState();
    sleeperCtx={username:'',userId:'',leagueId:SLEEPER_LEAGUE_ID,draftId:'',rosterId:null,leagueName:'',teamName:'',lastPickCount:0};
    lastDraftPicks=[];
    setVerification(false);
    if(!draftAllowsPostDraftViews()){
      renderRecentPicks();
      renderDraftLog();
    }
  }
  if(!username){
    startupConnectAttempted=false;
    startupConnectUser='';
    storageRemove(KEY+'-sleeper-user');
    setSyncStatus('','Select your team to connect Sleeper.');
    renderTeam();
    renderStrategyHistory();
    renderCompanionHome();
    return;
  }
  storageSet(KEY+'-sleeper-user',username);
  $('.sleeper-bar')?.classList.add('loading-team');
  if(!sameLoadedTeam){
    const restored=await hydrateRuntimeCacheAsync(username);
    if(restored)await hydrateSavedProjectionMap(currentWeekNumber());
    if(restored){
      populateSleeperTeamOptions(leagueUsers);
      renderRestoredRuntimeState();
      setSyncStatus('busy',`Refreshing ${username}…`);
    }else setSyncStatus('busy',`Verifying Unmanaged Chaos for ${username}…`);
  }else{
    setVerification(true);
    setSyncStatus('busy',`Refreshing ${username} in background…`);
  }
  try{
    const [{league},user]=await Promise.all([verifyLeagueBase(false),sleeperGetCached(`/user/${encodeURIComponent(username)}`,300000,false)]);
    if(generation!==connectGeneration)return;
    if(!user?.user_id)throw new Error('Sleeper user not found');
    const leagueUser=leagueUsers.find(u=>String(u.user_id)===String(user.user_id));
    if(!leagueUser)throw new Error(`${username} is not a member of league ${SLEEPER_LEAGUE_ID}`);
    const roster=leagueRosters.find(r=>String(r.owner_id)===String(user.user_id));
    if(!roster)throw new Error(`No roster found for ${username}`);
    const teamName=String(leagueUser?.metadata?.team_name||'').trim();
    sleeperCtx.username=username;sleeperCtx.userId=String(user.user_id);
    sleeperCtx.rosterId=String(roster.roster_id);sleeperCtx.teamName=teamName;
    startupConnectAttempted=true;
    startupConnectUser=username;
    if($('#sleeperUser'))$('#sleeperUser').value=username;
    setSleeperTeamName(teamName,username);setVerification(true);
    await syncSleeper(false);
    if(generation!==connectGeneration)return;
    if(seasonToolsAvailable()||draftAllowsPostDraftViews())await syncSeasonData(true);
    if(generation!==connectGeneration)return;
    persistRuntimeCache();
    $('.sleeper-bar')?.classList.remove('loading-team');
  }catch(err){
    if(generation!==connectGeneration)return;
    console.error(err);
    const cached=await readRuntimeCacheAsync(username);
    if(cached&&!(leagueRosters.length||lastDraftPicks.length))applyRuntimeCache(cached,username);
    if(cached&&(leagueRosters.length||lastDraftPicks.length)){
      runtimeDataMode='offline';
      setVerification(true);
      const detail=lastSleeperError||describeSleeperError(err);
      setSyncStatus('err',`${detail} • showing ${runtimeCacheAgeText()}`);
      renderRestoredRuntimeState();
      $('.sleeper-bar')?.classList.remove('loading-team');
      return;
    }
    $('.sleeper-bar')?.classList.remove('loading-team');
    setVerification(false,err.message);
    setSyncStatus('err',`${username}: ${err.message}.`);
    // Keep the selected team visible, but allow a later pageshow/focus probe to retry.
    startupConnectAttempted=false;
  }
}
function draftSyncContext(){
  return {
    token:++draftSyncSequence,
    generation:connectGeneration,
    username:String(sleeperCtx.username||''),
    userId:String(sleeperCtx.userId||''),
    rosterId:String(sleeperCtx.rosterId??''),
    draftId:String(sleeperCtx.draftId||''),
    leagueId:String(sleeperCtx.leagueId||'')
  };
}
function draftSyncContextMatches(ctx){
  return !!ctx &&
    ctx.generation===connectGeneration &&
    ctx.username===String(sleeperCtx.username||'') &&
    ctx.userId===String(sleeperCtx.userId||'') &&
    ctx.rosterId===String(sleeperCtx.rosterId??'') &&
    ctx.draftId===String(sleeperCtx.draftId||'') &&
    ctx.leagueId===String(sleeperCtx.leagueId||'');
}
function setDraftSyncBusy(active){
  sleeperActiveSyncs=Math.max(0,sleeperActiveSyncs+(active?1:-1));
  sleeperBusy=sleeperActiveSyncs>0;
  const btn=$('#syncNowBtn');
  if(btn){
    btn.disabled=sleeperBusy;
    btn.setAttribute('aria-busy',String(sleeperBusy));
  }
}
async function syncSleeper(forceMessage=false){
  if(!sleeperCtx.leagueId)return;
  const currentKey=`${connectGeneration}|${sleeperCtx.username||''}|${sleeperCtx.userId||''}|${sleeperCtx.rosterId??''}|${sleeperCtx.draftId||''}`;
  if(draftSyncPromise?.key===currentKey){
    if(forceMessage)setSyncStatus('busy','Sleeper sync already in progress…');
    return draftSyncPromise.promise;
  }
  const ctx=draftSyncContext();
  const entry={token:ctx.token,key:currentKey,ctx,promise:null};
  entry.promise=_syncSleeperImpl(forceMessage,ctx);
  draftSyncPromise=entry;
  try{return await entry.promise;}
  finally{if(draftSyncPromise?.token===entry.token)draftSyncPromise=null;}
}
async function _syncSleeperImpl(forceMessage=false,ctx=draftSyncContext()){
  if(!sleeperCtx.leagueId)return;
  setDraftSyncBusy(true);if(forceMessage)setSyncStatus('busy','Syncing Sleeper draft…');
  try{
    if(!verifiedLeague)await verifyLeagueBase();
    if(!draftSyncContextMatches(ctx))return {ignored:true,reason:'connection changed'};
    if(!sleeperCtx.draftId){
      setSyncStatus('ok',`${sleeperCtx.leagueName} verified • draft not created yet`);
      setVerification(true);return;
    }
    const [picksRes,draftRes]=await Promise.all([
      sleeperGetSafe(`/draft/${sleeperCtx.draftId}/picks`,{
        ttlMs:15000,force:forceMessage,fallback:lastDraftPicks,label:'draft picks'
      }),
      sleeperGetSafe(`/draft/${sleeperCtx.draftId}`,{
        ttlMs:15000,force:forceMessage,fallback:verifiedDraft,label:'draft state'
      })
    ]);
    if(!draftSyncContextMatches(ctx))return {ignored:true,reason:'newer team/session active'};
    const wasComplete=isDraftComplete();
    verifiedDraft=draftRes.value||verifiedDraft;
    updateSeasonTabVisibility();
    lastDraftPicks=uniqueDraftPicks(picksRes.value);
    const draftIssues=[picksRes,draftRes].filter(r=>!r.ok).map(r=>r.label);
    const nowComplete=isDraftComplete();
    if(!wasComplete&&nowComplete){
      seasonDataMeta.lastSync=0;
      seasonDataMeta.failures=[];
      noteIntegrityRepair('Draft completed; season view refreshed');
    }
    const fingerprint=currentDraftFingerprint(lastDraftPicks,verifiedDraft);
    if(!forceMessage&&fingerprint===lastDraftFingerprint){
      commitDraftSyncState({fingerprint,issues:draftIssues});
      setVerification(true);
      updateCommandCenter();
      return {changed:false,fingerprint};
    }
    await resolveMissingSleeperPickNames();
    if(!draftSyncContextMatches(ctx))return {ignored:true,reason:'connection changed while resolving picks'};
    PLAYERS.forEach(p=>{const s=ps(p.rank);if(s.source==='sleeper'){s.draft='available';delete s.source;delete s.sleeperPick;delete s.draftedBy;}});
    let matched=0,unmatched=0,mine=0;
    for(const pick of lastDraftPicks){
      const player=playerFromPick(pick);if(!player){unmatched++;continue;}
      const s=ps(player.rank);
      const isMine=String(pick.picked_by||'')===String(sleeperCtx.userId)||(sleeperCtx.rosterId!=null&&String(pick.roster_id||'')===String(sleeperCtx.rosterId));
      s.draft=isMine?'mine':'other';s.source='sleeper';
      s.sleeperPick={pick_no:pick.pick_no,round:pick.round,draft_slot:pick.draft_slot};
      s.draftedBy=rosterOwnerName(pick.roster_id,pick.picked_by);
      matched++;if(isMine)mine++;
    }
    save();
    finalizeStrategyHistory();

    // Commit the new draft snapshot before anything renders so every view sees
    // the same picks, fingerprint, timestamps, and health state in one pass.
    commitDraftSyncState({fingerprint,issues:draftIssues});
    setVerification(true);
    renderDraftSyncViews({force:true,changed:true});
    const extra=unmatched?` • ${unmatched} unmatched`:'';
    if(draftIssues.length){
      setSyncStatus('busy',`${sleeperCtx.leagueName} • updated with saved ${draftIssues.join(', ')}`);
    }else{
      if(draftAllowsPostDraftViews()){
        setSyncStatus('ok',`${sleeperCtx.leagueName} • Live Season • synced ${syncStamp()} • v${APP_VERSION}`);
      }else{
        const turn=liveDraftTurnState();
        const turnText=turn.kind==='mine'?' • YOUR PICK':turn.kind==='waiting'&&turn.away!=null?` • ${turn.away} away`:'';
        setSyncStatus('ok',`${sleeperCtx.leagueName} • ${lastDraftPicks.length} picks • ${mine} MINE${extra}${turnText} • synced ${syncStamp()} • v${APP_VERSION}`);
      }
    }
    return {changed:true,fingerprint,matched,unmatched,mine};
  }catch(err){
    console.error(err);
    if(!draftSyncContextMatches(ctx))return {ignored:true,reason:'obsolete sync failed'};
    if(lastDraftPicks.length||leagueRosters.length){
      runtimeDataMode='offline';
      const detail=lastSleeperError||describeSleeperError(err);
      setSyncStatus('err',`${detail} • showing ${runtimeCacheAgeText()}`);
      updateCommandCenter();
    }else setSyncStatus('err',`Sleeper sync failed: ${err.message}`);
  }finally{
    setDraftSyncBusy(false);
    updateCommandCenter();
  }
}
$('#sleeperUser').addEventListener('change',e=>{
  sizeSleeperTeamSelect();
  startupConnectAttempted=false;
  startupConnectUser='';
  const username=e.target.value;
  if(username)storageSet(KEY+'-sleeper-user',username);
  connectSleeper(username);
});
$('#sleeperUser').addEventListener('input',e=>{
  sizeSleeperTeamSelect();
  const username=e.target.value;
  if(!username||username===sleeperCtx.username)return;
  startupConnectAttempted=false;
  startupConnectUser='';
  storageSet(KEY+'-sleeper-user',username);
  connectSleeper(username);
});

$('#syncNowBtn').addEventListener('click',async()=>{
  const username=selectedSleeperUserCandidate();
  if(!username){toast('Select your Sleeper team first.');return;}
  if(!sleeperCtx.userId||String(sleeperCtx.username)!==String(username)){
    await connectSleeper(username);
    return;
  }
  // Live Season sync is intentionally season-only. The completed draft is
  // archival and should not be refetched/reprocessed on every press of ↻.
  if(seasonToolsAvailable()||draftAllowsPostDraftViews())await syncSeasonData(true);
  else await syncSleeper(true);
  renderRestoredRuntimeState();
});
$('#draftIntelPanel .intel-head').addEventListener('click',e=>{
  if(e.target.closest('#auditHelpBtn')||e.target.closest('#auditHelpPop'))return;
  toggleIntelCollapsed();
});
$('#draftIntelPanel .intel-head').addEventListener('keydown',e=>{
  if(e.target.closest('#auditHelpBtn')||e.target.closest('#auditHelpPop'))return;
  if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleIntelCollapsed();}
});
$('#searchToggle').addEventListener('click',toggleSearchCollapsed);
$('#searchToggle').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleSearchCollapsed();}});
applyDraftPreferenceClasses();
loadStoredHistorySource();
updateSeasonTabVisibility();
applyLifecycleUI();
updateCommandCenter();
renderCompanionHome();
initIntelCollapse();
initSearchCollapse();
if(storageGet(MOBILE_FOCUS_KEY,'0')==='1')setMobileDraftFocus(true);
$('#mobileIntelBtn').addEventListener('click',flashIntel);
$('#mobileLiveBar').addEventListener('dblclick',()=>setMobileDraftFocus(!document.body.classList.contains('mobile-draft-focus')));
const condensedKey=KEY+'-condensed';
