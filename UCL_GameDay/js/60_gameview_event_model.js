/* UCL GameDay v0.5.51 — build fragment: 60_gameview_event_model.js
   This file is concatenated in manifest order into the app's single lexical scope.
   It is intentionally not loaded independently in the browser. */
function gvScheduleWeekOfGame(g){
  return Number(g?.week ?? g?.leg ?? g?.week_num ?? g?.week_number ?? 0);
}
function gvScheduleTeamsOfGame(g){
  const home=gvScheduleTeamCode(
    g?.home_team ?? g?.home ?? g?.home_team_abbr ?? g?.home_abbr ??
    g?.team_home ?? g?.metadata?.home_team
  );
  const away=gvScheduleTeamCode(
    g?.away_team ?? g?.away ?? g?.away_team_abbr ?? g?.away_abbr ??
    g?.team_away ?? g?.metadata?.away_team
  );
  return {home,away};
}
function gvBuildWeeklyOpponentMap(schedule,week){
  const map={};
  const games=Array.isArray(schedule)?schedule:
    Array.isArray(schedule?.games)?schedule.games:
    Array.isArray(schedule?.schedule)?schedule.schedule:[];
  for(const g of games){
    if(gvScheduleWeekOfGame(g)!==Number(week))continue;
    const {home,away}=gvScheduleTeamsOfGame(g);
    if(!home||!away||home===away)continue;
    map[home]=away;
    map[away]=home;
  }
  return map;
}
async function gvRefreshNflOpponentMap(force=false){
  if(simulation.active||!liveLoadingEnabled())return;
  const season=String(n(nflState?.season)||2026);
  const seasonType=String(nflState?.season_type||'regular');
  const week=Number(n(nflState?.week)||1);
  const sameSeason=gameViewScheduleSeason===season&&gameViewScheduleType===seasonType;
  if(!force&&sameSeason&&Object.keys(gameViewNflOpponentMap).length&&Date.now()-gameViewScheduleLoadedAt<6*60*60*1000)return;
  try{
    const r=await fetch(`https://api.sleeper.com/schedule/nfl/${encodeURIComponent(seasonType)}/${encodeURIComponent(season)}`,{cache:'no-store'});
    if(!r.ok)return;
    const data=await r.json();
    const games=Array.isArray(data)?data:Array.isArray(data?.games)?data.games:Array.isArray(data?.schedule)?data.schedule:[];
    gameViewWeeklyScheduleGames=games;
    const map=gvBuildWeeklyOpponentMap(data,week);
    if(Object.keys(map).length){
      gameViewNflOpponentMap=map;
      gameViewScheduleSeason=season;
      gameViewScheduleType=seasonType;
      gameViewScheduleLoadedAt=Date.now();
    }
  }catch(e){}
}
function gvOpponentFromWeeklyMap(team){
  return gvScheduleTeamCode(gameViewNflOpponentMap?.[gvScheduleTeamCode(team)]||'');
}

let gameViewProjections={},gameViewProjectionsAt=0,gameViewProjectionSeason='',gameViewProjectionWeek=0;
let gameViewWeeklyScheduleGames=[];
function gvProjectionPoints(row){
  if(!row)return 0;
  const stats=row?.stats||row||{},scoring=leagueInfo?.scoring_settings||{};
  let custom=0,hits=0;
  for(const [key,weight] of Object.entries(scoring)){
    const value=Number(stats?.[key]),w=Number(weight);
    if(Number.isFinite(value)&&Number.isFinite(w)&&value!==0){custom+=value*w;hits++}
  }
  // Sleeper projection payloads commonly include a precomputed PPR value. Use it only
  // when the league scoring map could not meaningfully score the projected stat line.
  const fallback=Number(row?.pts_ppr ?? stats?.pts_ppr ?? row?.fantasy_points ?? stats?.fantasy_points);
  if(hits>0&&Number.isFinite(custom))return custom;
  return Number.isFinite(fallback)?fallback:0;
}
function gvIngestProjectionPayload(data){
  const next={};
  const ingest=(id,row)=>{id=String(id||row?.player_id||row?.player?.player_id||row?.player?.id||'');if(!id)return;next[id]=gvProjectionPoints(row)};
  if(Array.isArray(data)){for(const row of data)ingest(null,row)}
  else if(data&&typeof data==='object'){for(const [id,row] of Object.entries(data))ingest(id,row)}
  return next;
}
async function refreshGameViewProjections(force=false){
  if(simulation.active||!liveLoadingEnabled())return;
  const season=String(n(nflState?.season)||2026),week=Number(n(nflState?.week)||1),now=Date.now();
  if(!force&&gameViewProjectionSeason===season&&gameViewProjectionWeek===week&&Object.keys(gameViewProjections).length&&now-gameViewProjectionsAt<15*60*1000)return;
  try{
    const r=await fetch(`https://api.sleeper.com/projections/nfl/${encodeURIComponent(season)}/${encodeURIComponent(week)}?season_type=regular`,{cache:'no-store'});
    if(!r.ok)return;
    const next=gvIngestProjectionPayload(await r.json());
    if(Object.keys(next).length){gameViewProjections=next;gameViewProjectionsAt=now;gameViewProjectionSeason=season;gameViewProjectionWeek=week}
  }catch(e){}
}
function ctespnRosterProjection(row){
  if(!row)return 0;
  let total=0,count=0;
  for(const pid of (row.starters||[]).filter(Boolean)){
    const p=Number(gameViewProjections[String(pid)]);
    if(Number.isFinite(p)&&p>0){total+=p;count++}
  }
  return count?total:0;
}
function ctespnScheduleStartMs(g){
  const v=nflScheduleKickoffMs(g);
  return v||NaN;
}
function ctespnScheduleStatusRaw(g){
  return g?.status ?? g?.game_status ?? g?.gameStatus ?? g?.state ?? g?.game_state ??
    g?.gameState ?? g?.metadata?.status ?? g?.metadata?.game_status ?? '';
}
function ctespnScheduleStatusToken(g){
  return String(ctespnScheduleStatusRaw(g)||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
}
function ctespnScheduleStateFromStatus(g){
  const token=ctespnScheduleStatusToken(g);
  const completed=!!(g?.completed ?? g?.complete ?? g?.is_final ?? g?.isFinal ?? g?.metadata?.completed);
  if(completed)return {state:'final',token:token||'completed_flag',reliable:true};
  if(!token)return {state:'unknown',token:'',reliable:false};
  const finalTokens=new Set(['final','final_ot','complete','completed','closed','finished','ended','post','postgame','full_time','ft','canceled','cancelled']);
  const preTokens=new Set(['scheduled','schedule','pre','pregame','pre_game','not_started','notstarted','upcoming','delayed','postponed','suspended_before_start']);
  const liveTokens=new Set(['live','active','in_progress','inprogress','in_game','ingame','started','playing','halftime','half_time','half','q1','q2','q3','q4','ot','overtime']);
  if(finalTokens.has(token)||token.startsWith('final_'))return {state:'final',token,reliable:true};
  if(preTokens.has(token))return {state:'pregame',token,reliable:true};
  if(liveTokens.has(token)||/^q[1-4]$/.test(token)||/^ot[0-9]*$/.test(token))return {state:'in_progress',token,reliable:true};
  return {state:'unknown',token,reliable:false};
}
function ctespnTeamGameState(team,now=gameNow()){
  team=gvScheduleTeamCode(team);if(!team||simulation.active)return null;
  const g=(gameViewWeeklyScheduleGames||[]).find(x=>{const t=gvScheduleTeamsOfGame(x);return t.home===team||t.away===team});
  if(!g)return null;
  const status=ctespnScheduleStateFromStatus(g),start=ctespnScheduleStartMs(g),nowMs=Number(now);
  let clockProgress=null;
  if(Number.isFinite(start)&&Number.isFinite(nowMs)){
    const elapsed=(nowMs-start)/60000;
    clockProgress=elapsed<=0?0:Math.max(0,Math.min(1,elapsed/210));
  }
  // A reliable schedule state overrides the wall-clock approximation at the boundaries.
  // In-progress games still use elapsed time only as a coarse opportunity estimate, but
  // are kept below 100% so an unusually long game cannot be treated as finished early.
  if(status.state==='final')return {progress:1,state:'final',source:'schedule-status',confidence:'high',status:status.token,start};
  if(status.state==='pregame')return {progress:0,state:'pregame',source:'schedule-status',confidence:'high',status:status.token,start};
  if(status.state==='in_progress'){
    const estimate=clockProgress==null?.50:clockProgress;
    return {progress:Math.max(.02,Math.min(.97,estimate)),state:'in_progress',source:'schedule-status+clock',confidence:'medium',status:status.token,start};
  }
  if(clockProgress==null)return null;
  return {progress:clockProgress,state:clockProgress<=0?'pregame':clockProgress>=1?'estimated_complete':'estimated_in_progress',source:'clock-fallback',confidence:'low',status:status.token,start};
}
function ctespnTeamGameProgress(team,now=gameNow()){
  return ctespnTeamGameState(team,now)?.progress ?? null;
}
function ctespnStarterMeta(pid){
  pid=String(pid||'');const p=playerInfo(pid)||{};
  let pos=String(p.pos||p.position||'').toUpperCase(),team=String(p.team||'').toUpperCase();
  // Sleeper team defenses can be represented directly by their NFL abbreviation.
  if((!pos||pos==='—')&&/^[A-Z]{2,3}$/.test(pid.toUpperCase()))pos='DEF';
  if((!team||team==='FA')&&pos==='DEF')team=pid.toUpperCase();
  return {pos:pos==='DST'?'DEF':pos,team:gvScheduleTeamCode(team)};
}
function ctespnPositionOpportunityWeight(pos){
  pos=String(pos||'').toUpperCase();
  if(pos==='QB')return 1.18;
  if(pos==='RB'||pos==='WR')return 1.00;
  if(pos==='TE')return .94;
  if(pos==='K')return .66;
  if(pos==='DEF'||pos==='DST')return .70;
  return .90;
}
function ctespnPhaseOpportunityWeight(progress){
  progress=Math.max(0,Math.min(1,Number(progress)||0));
  if(progress>=.98)return .18;
  if(progress>=.92)return .38;
  if(progress>=.85)return .55;
  if(progress>=.75)return .75;
  return 1;
}
function ctespnStarterOpportunity(pid,now=gameNow()){
  pid=String(pid||'');const proj=Number(gameViewProjections[pid]);if(!(proj>0))return null;
  const meta=ctespnStarterMeta(pid),positionWeight=ctespnPositionOpportunityWeight(meta.pos);
  let progress=null,gameState=null;
  if(simulation.active){
    const a=simulation.assignments.get(pid);
    if(!a)progress=0;
    else{
      const session=simulationSessionAt(simulation.elapsed),within=simulation.elapsed-(a.sessionStart??session?.start??0);
      const span=Math.max(1,Number(a.gameEnd)-Number(a.gameStart));
      progress=Math.max(0,Math.min(1,(within-Number(a.gameStart))/span));
    }
  }else{
    const state=ctespnTeamGameState(meta.team,now);
    progress=state?.progress ?? null;
    gameState=state;
  }
  if(progress==null)return null;
  const remaining=proj*(1-progress),phaseWeight=ctespnPhaseOpportunityWeight(progress);
  const weightedProjection=proj*positionWeight,weightedRemaining=remaining*positionWeight*phaseWeight;
  return {pid,pos:meta.pos,team:meta.team,projection:proj,remaining,progress,positionWeight,phaseWeight,weightedProjection,weightedRemaining,active:progress<.985&&remaining>.10,meaningful:progress<.96&&weightedRemaining>=.75,gameState};
}
function ctespnRosterOpportunity(row,now=gameNow()){
  const starters=(row?.starters||[]).filter(Boolean);let projection=0,remaining=0,weightedProjection=0,weightedRemaining=0,known=0,deep=0,active=0,meaningfulActive=0,maxWeightedRemaining=0;const details=[];
  for(const pid of starters){
    const o=ctespnStarterOpportunity(pid,now);if(!o)continue;known++;details.push(o);projection+=o.projection;remaining+=o.remaining;weightedProjection+=o.weightedProjection;weightedRemaining+=o.weightedRemaining;
    if(o.progress>=.75)deep++;if(o.active)active++;if(o.meaningful)meaningfulActive++;maxWeightedRemaining=Math.max(maxWeightedRemaining,o.weightedRemaining);
  }
  if(!known||!(projection>0))return null;
  const pct=remaining/projection,weightedPct=weightedProjection>0?weightedRemaining/weightedProjection:pct,coverage=starters.length?known/starters.length:0,concentration=weightedRemaining>0?maxWeightedRemaining/weightedRemaining:0;
  return {projection,remaining,pct,weightedProjection,weightedRemaining,weightedPct,deepPct:deep/known,known,total:starters.length,coverage,active,meaningfulActive,concentration,details};
}
function ctespnRosterEndgameState(o){
  if(!o)return {trusted:false,exhausted:false,nearlyDone:false};
  const trusted=o.coverage>=.75;
  const exhausted=trusted&&o.weightedPct<=.20&&o.deepPct>=.75&&o.meaningfulActive<=2;
  const nearlyDone=trusted&&o.weightedPct<=.11&&o.deepPct>=.80&&o.meaningfulActive<=1;
  return {trusted,exhausted,nearlyDone};
}
function ctespnLeadChangeMaturity(line,beforeDiff=Infinity,now=gameNow()){
  const aProj=ctespnRosterProjection(line?.a),bProj=ctespnRosterProjection(line?.b);
  const avgProjection=(aProj+bProj)/2,threshold=avgProjection*.75;
  const projectionMature=aProj>0&&bProj>0&&line.aScore>=threshold&&line.bScore>=threshold;
  const aOpp=ctespnRosterOpportunity(line?.a,now),bOpp=ctespnRosterOpportunity(line?.b,now),aEnd=ctespnRosterEndgameState(aOpp),bEnd=ctespnRosterEndgameState(bOpp);
  const closeBefore=Math.abs(Number(beforeDiff))<=8;
  const exhausted=!!(aEnd.exhausted&&bEnd.exhausted);
  return {eligible:projectionMature||(closeBefore&&exhausted),projectionMature,exhausted,closeBefore,threshold,aOpp,bOpp,aEnd,bEnd};
}
function ctespnEndgameDecisiveContext(line,beforeDiff,afterDiff,now=gameNow()){
  const aOpp=ctespnRosterOpportunity(line?.a,now),bOpp=ctespnRosterOpportunity(line?.b,now),aEnd=ctespnRosterEndgameState(aOpp),bEnd=ctespnRosterEndgameState(bOpp);
  const trailing=afterDiff>0?{row:line?.b,opp:bOpp,end:bEnd}:{row:line?.a,opp:aOpp,end:aEnd};
  const closeBefore=Math.abs(Number(beforeDiff))<=10;
  const trailingDepleted=!!(trailing.end?.trusted&&trailing.opp&&(trailing.opp.weightedPct<=.20||trailing.end.nearlyDone));
  return {eligible:closeBefore&&trailingDepleted,aOpp,bOpp,aEnd,bEnd,trailing};
}
function ctespnLeadChangeEligible(line,beforeDiff=Infinity,now=gameNow()){
  return ctespnLeadChangeMaturity(line,beforeDiff,now).eligible;
}

async function refreshGameViewStats(force=false){
  if(simulation.active||!liveLoadingEnabled())return;
  const now=Date.now();if(!force&&now-gameViewStatsAt<12000)return;
  try{
    await gvRefreshNflOpponentMap(false);
    const season=n(nflState?.season)||2026,week=n(nflState?.week)||1;
    const r=await fetch(`https://api.sleeper.com/stats/nfl/${season}/${week}?season_type=regular`,{cache:'no-store'});
    if(!r.ok)return;
    const data=await r.json(),next={},nextOpp={};
    const ingest=(id,row)=>{
      id=String(id||'');if(!id)return;
      const stats=row?.stats||row||{};
      next[id]=stats;
      const opp=String(
        row?.opponent||row?.opp||row?.opponent_team||row?.opponent_abbr||
        stats?.opponent||stats?.opp||stats?.opponent_team||stats?.opponent_abbr||''
      ).toUpperCase();
      if(opp)nextOpp[id]=opp;
    };
    if(Array.isArray(data)){
      for(const row of data)ingest(row?.player_id||row?.player?.player_id||row?.player?.id,row);
    }else if(data&&typeof data==='object'){
      for(const [id,row] of Object.entries(data))ingest(id,row);
    }
    const priorStats=gameViewStats||{};
    const hadPrior=Object.keys(priorStats).length>0;
    if(hadPrior){
      const ids=new Set([...Object.keys(priorStats),...Object.keys(next)]);
      for(const id of ids){
        const a=priorStats[id]||{},b=next[id]||{},keys=new Set([...Object.keys(a),...Object.keys(b)]);
        let changed=false;
        for(const key of keys){
          const av=Number(a[key]),bv=Number(b[key]);
          if(Number.isFinite(av)&&Number.isFinite(bv)&&Math.abs(bv-av)>.0001){changed=true;break}
          if(!Number.isFinite(av)&&Number.isFinite(bv)&&bv!==0){changed=true;break}
        }
        if(changed){
          const team=normalizeNflTeamCode(playerInfo(id)?.team);
          if(team)nflLiveStatHeartbeat.set(team,now);
        }
      }
    }
    lastGameViewStats=gameViewStats;
    gameViewStats=next;
    gameViewOpponentByPlayer=nextOpp;
    gameViewStatsAt=now;
  }catch(e){}
}




function gvCatchLabel(evt){
  const t=String(evt.playType||'');
  if(t!=='reception'&&t!=='qb_pass')return '';
  return t==='qb_pass'?'Pass':'Reception';
}

function gvPlayLabel(evt){
  const type=evt.playType||gvPlayType(evt),detail=String(evt.detail||'').toLowerCase();
  if(type==='rb_run'||type==='qb_run')return 'Run';
  if(type==='reception'||type==='qb_pass')return type==='qb_pass'?'Pass':'Reception';
  if(type==='kick')return detail.includes('extra point')?'Extra Point':'Field Goal';
  if(type==='def_blocked_kick')return 'Blocked Kick';
  if(type==='qb_kneel')return 'QB Kneel';
  if(type==='two_point_pass'||type==='two_point_reception')return 'Two-Point Conversion';
  if(type==='two_point_rush')return 'Two-Point Conversion';
  if(type==='def_2pt_int')return 'Defensive Two-Point Interception Return';
  if(type==='def_2pt_fumble')return 'Defensive Two-Point Fumble Return';
  if(type==='def_safety')return 'Safety';
  if(type==='off_fum_rec_td')return 'Offensive Fumble Recovery TD';
  if(type==='def_sack')return 'Sack';
  if(type==='def_qb_hit')return 'QB Hit';
  if(type==='def_run_stop')return 'Run Stop';
  if(type==='def_int'||type==='def_int_td')return 'Interception Return';
  if(type==='def_fumble'||type==='def_fum_td')return 'Fumble Return';
  if(type==='def_kick_return'||type==='def_kick_ret_td')return 'Kick Return';
  if(type==='def_punt_return'||type==='def_punt_ret_td')return 'Punt Return';
  if(type==='def_breakup')return 'Pass Breakup';
  if(type==='pass_incomplete'||type==='incomplete')return 'Incomplete Pass';
  return '';
}

function gvPlayType(evtLike){
  const pos=String(evtLike?.pos||'').toUpperCase(),detail=String(evtLike?.detail||'').toLowerCase();
  const rushLike=detail.includes('rushing')||detail.includes('rush')||detail.includes('run')||detail.includes('scramble')||
    evtLike?.intervalAnalysis?.family==='rb_run'||evtLike?.intervalAnalysis?.family==='qb_run';
  const recLike=detail.includes('receiv')||detail.includes('reception')||evtLike?.intervalAnalysis?.family==='reception';
  const offenseStats=evtLike?.intervalAnalysis?.stats||{};
  const pass2=Number(offenseStats.pass_2pt||0)>0,rec2=Number(offenseStats.rec_2pt||0)>0,rush2=Number(offenseStats.rush_2pt||0)>0;
  const fumLost=Number(offenseStats.fum_lost||offenseStats.fum_lost_total||0)>0;
  if(Number(offenseStats.fum_rec_td||0)>0&&!['DEF','DST'].includes(pos))return 'off_fum_rec_td';
  if(fumLost&&pos==='RB')return recLike&&!rushLike?'rb_rec_fumble':'rb_rush_fumble';
  if(fumLost&&pos==='WR')return rushLike?'wr_rush_fumble':'wr_rec_fumble';
  if(pos==='K'&&!rushLike)return 'kick';
  if(pos==='DEF'||pos==='DST'){
    const fam=String(evtLike?.intervalAnalysis?.family||'').toLowerCase(),st=evtLike?.intervalAnalysis?.stats||{};
    const intLike=detail.includes('interception')||fam==='def_interception'||Number(st.int||0)>0||Number(st.def_int_ret_yd||0)!==0;
    const fumLike=detail.includes('fumble')||fam==='def_fumble'||Number(st.fum_rec||0)>0||Number(st.fum_rec_yd||0)!==0;
    const kickRetLike=detail.includes('kick return')||detail.includes('kickoff return')||fam==='kick_return'||Number(st.kick_ret_yd||0)!==0;
    const puntRetLike=detail.includes('punt return')||fam==='punt_return'||Number(st.punt_ret_yd||0)!==0;
    const tdLike=detail.includes('touchdown')||Number(st.def_td||0)>0;
    const stTdLike=Number(st.def_st_td||0)>0||fam==='special_teams_return';
    const def2=Number(st.def_2pt||0)>0||detail.includes('defensive two-point')||detail.includes('defensive 2-point');
    if(def2&&intLike)return 'def_2pt_int';
    if(def2&&fumLike)return 'def_2pt_fumble';
    if(Number(st.safe||0)>0||detail.includes('safety'))return 'def_safety';
    if(Number(st.blk_kick||0)>0||detail.includes('blocked field goal')||detail.includes('blocked extra point')||detail.includes('blocked kick'))return 'def_blocked_kick';
    if(kickRetLike&&stTdLike)return 'def_kick_ret_td';
    if(puntRetLike&&stTdLike)return 'def_punt_ret_td';
    if(kickRetLike)return 'def_kick_return';
    if(puntRetLike)return 'def_punt_return';
    if(intLike&&tdLike)return 'def_int_td';
    if(fumLike&&tdLike)return 'def_fum_td';
    if(intLike)return 'def_int';
    if(fumLike)return 'def_fumble';
    if(detail.includes('sack'))return 'def_sack';
    if(detail.includes('quarterback hit')||detail.includes('qb hit')||Number(st.qb_hit||0)>0)return 'def_qb_hit';
    if(detail.includes('run stop')||detail.includes('rush'))return 'def_run_stop';
    const passDefLike=detail.includes('pass breakup')||detail.includes('pass defended')||fam==='def_breakup'||gvPassDefendedDelta(st)>0;
    if(passDefLike)return 'def_breakup';
    return 'def_generic';
  }
  if(pos==='QB'){
    const st=evtLike?.intervalAnalysis?.stats||{};
    if(pass2)return 'two_point_pass';
    if(rush2)return 'two_point_rush';
    const kneelLike=rushLike&&Number(st.rush_att||0)===1&&Number(st.rush_yd||0)<=0&&Number(st.rush_yd||0)>=-3&&Math.abs(Number(evtLike?.delta||0))<=.35;
    if(detail.includes('kneel')||kneelLike)return 'qb_kneel';
    if(rushLike)return 'qb_run';
    const incompleteLike=detail.includes('incomplete pass')||
      (evtLike?.intervalAnalysis?.family==='qb_pass'&&Number(st.pass_att||0)>0&&Number(st.pass_cmp||0)===0&&Number(st.pass_int||0)===0);
    if(incompleteLike)return 'incomplete';
    return recLike?'reception':'qb_pass';
  }
  if(rec2)return 'two_point_reception';
  if(rush2)return 'two_point_rush';
  if(pos==='RB')return recLike&&!rushLike?'reception':'rb_run';
  if(pos==='WR'||pos==='TE'||pos==='K')return rushLike?'rb_run':'reception';
  return 'generic';
}
function gvDefensiveTouchdownKind(evtLike){
  const t=evtLike?.playType||gvPlayType(evtLike);
  if(t==='def_int_td')return 'pick-six';
  if(t==='def_fum_td')return 'scoop-and-score';
  if(t==='def_kick_ret_td')return 'kick-return-touchdown';
  if(t==='def_punt_ret_td')return 'punt-return-touchdown';
  return gvIsTouchdownEvent(evtLike,t)?'other-defensive-touchdown':null;
}

function gameViewEventFromDelta(item){
  const pair=gameViewPair();if(!pair)return null;
  const oriented=orientedPair(pair),left=oriented.rows[0],right=oriented.rows[1],rid=String(item.rosterId);
  const leftId=String(left.roster_id),rightId=String(right.roster_id);
  if(rid!==leftId&&rid!==rightId)return null;
  const leftScore=n(left.points),rightScore=n(right.points);
  const p=playerInfo(item.playerId),colors=nflTeamColors(p.team),detail=item.detail||playDetailFromStats(item.playerId,p.pos,item.delta);
  const base={id:`${item.time}-${rid}-${item.playerId}-${Math.random().toString(36).slice(2,7)}`,time:item.time,rosterId:rid,playerId:item.playerId,name:item.name,pos:p.pos||'—',nflTeam:p.team||'FA',teamPrimary:colors[0],teamSecondary:colors[1],detail,intervalAnalysis:item.intervalAnalysis||null,delta:Number(item.delta)||0,total:Number(item.total)||0,side:(String($('#teamSelect')?.value||'')===rid?'left':(rid===leftId?'left':'right')),leftScore,rightScore,tier:gameViewTier(item.delta),source:gvNormalizeSourceValue(item.source||(simulation?.active?'simulation':'live'),item),reconstructed:!!item.reconstructed,testingForced:!!item.testingForced};
  base.playType=gvPlayType(base);
  const rawStats=base.intervalAnalysis?.stats||{};
  if(['DEF','DST'].includes(String(base.pos||'').toUpperCase())&&Number(rawStats.sack||0)>0&&Number(rawStats.fum_rec||0)>0)base.stripSack=true;
  if(base.testingForced&&typeof gvTestingEnsureRandomScoreContext==='function')gvTestingEnsureRandomScoreContext(base);
  return base;
}
function recordGameViewEvent(item){
  let evt=gameViewEventFromDelta(item);
  if(item?.simulatedTandem&&evt){
    evt={...evt,...item,multiActor:true,playType:'qb_pass',source:'simulation'};
  }if(!evt)return;
  evt=item?.source==='simulation'||simulation?.active
    ?gvNormalizeSimulationEvent(evt)
    :gvNormalizeEventSource(evt,item?.source||'live');
  if(!evt)return;
  evt.sequence=++gameViewSequence;
  evt.ingestedAt=Date.now();
  gvPruneCorrelation(evt.time||Date.now());

  let pendingMatch=null,bestScore=-Infinity;
  for(let i=0;i<gameViewPending.length;i++){
    const other=gameViewPending[i];if(!gvSameNflTeam(evt,other))continue;const score=gvCorrelationScore(evt,other);
    if(score>=9&&score>bestScore){pendingMatch={other,index:i,score};bestScore=score}
  }
  if(pendingMatch){
    const merged=gvMergePlayEvents(pendingMatch.other,evt);
    merged.sequence=Math.min(pendingMatch.other.sequence||evt.sequence,evt.sequence);
    merged.ingestedAt=Math.min(pendingMatch.other.ingestedAt||evt.ingestedAt,evt.ingestedAt);
    gameViewPending.splice(pendingMatch.index,1,merged);
  }else{
    gameViewPending.push(evt);
  }
  gameViewPending.sort(gvSortBySequence);
  gvSchedulePendingFlush();
}
function gvOpportunityTop(o){
  if(!o?.details?.length)return null;
  return [...o.details].sort((a,b)=>Number(b.weightedRemaining||0)-Number(a.weightedRemaining||0))[0]||null;
}
function gvOpportunityUi(o){
  if(!o||!o.coverage||o.coverage<.5)return {pct:'—',main:'Opportunity estimate unavailable',sub:'Enable/load projection data for estimate',meter:0};
  const pct=Math.max(0,Math.min(100,Math.round(Number(o.weightedPct||0)*100))),top=gvOpportunityTop(o),active=Number(o.meaningfulActive||0);
  let main=active===0?'No meaningful starters estimated active':active===1?'1 meaningful starter estimated active':`${active} meaningful starters estimated active`;
  let sub='Estimated remaining scoring opportunity';
  if(top&&Number(o.concentration||0)>=.50){const p=playerInfo(top.pid)||{};sub=`${Math.round(Number(o.concentration||0)*100)}% concentrated in ${p.name||p.full_name||top.pid}`}
  else if(Number(o.coverage||0)<.75)sub='Partial lineup coverage • estimate less reliable';
  return {pct:`${pct}%`,main,sub,meter:pct};
}
function renderGameViewOpportunityBar(){
  const pair=gameViewPair();if(!pair)return;const p=orientedPair(pair),left=p.rows[0],right=p.rows[1];
  const lu=gvOpportunityUi(ctespnRosterOpportunity(left,gameNow())),ru=gvOpportunityUi(ctespnRosterOpportunity(right,gameNow()));
  for(const [side,u] of [['Left',lu],['Right',ru]]){
    const pct=$(`#gv${side}OppPct`),main=$(`#gv${side}OppMain`),sub=$(`#gv${side}OppSub`),meter=$(`#gv${side}OppMeter`);
    if(pct)pct.textContent=u.pct;if(main)main.textContent=u.main;if(sub)sub.textContent=u.sub;if(meter)meter.style.setProperty('--opp',`${u.meter}%`);
  }
}
function gvEventScoreContext(evt){
  const pair=gameViewPair();if(!pair)return '';const p=orientedPair(pair),left=p.rows[0],right=p.rows[1];
  const afterL=Number(evt?.leftScore),afterR=Number(evt?.rightScore);if(!Number.isFinite(afterL)||!Number.isFinite(afterR))return '';
  const leftId=String(left.roster_id),rightId=String(right.roster_id);let dl=0,dr=0;
  if(Array.isArray(evt?.fantasyImpacts)&&evt.fantasyImpacts.length){for(const x of evt.fantasyImpacts){const rid=String(x.rosterId||''),d=Number(x.delta||0);if(rid===leftId)dl+=d;else if(rid===rightId)dr+=d}}
  else{const rid=String(evt?.rosterId||''),d=Number(evt?.delta||0);if(rid===leftId)dl=d;else if(rid===rightId)dr=d}
  const beforeL=afterL-dl,beforeR=afterR-dr,beforeDiff=beforeL-beforeR,afterDiff=afterL-afterR;
  const beforeLeader=Math.sign(beforeDiff),afterLeader=Math.sign(afterDiff);if(!afterLeader)return 'MATCHUP IS NOW TIED';
  const leaderRow=afterLeader>0?left:right,trailingRow=afterLeader>0?right:left,leaderName=teamName(rosterFor(leaderRow.roster_id)),trailingName=teamName(rosterFor(trailingRow.roster_id));
  const opp=ctespnRosterOpportunity(trailingRow,gameNow()),end=ctespnRosterEndgameState(opp);
  let suffix='';
  if(end.trusted&&opp){if(opp.meaningfulActive===0&&opp.weightedPct<=.06)suffix=` • ${trailingName} HAS LITTLE SCORING OPPORTUNITY LEFT`;else if(opp.meaningfulActive===1&&opp.deepPct>=.75)suffix=` • ${trailingName} DOWN TO ONE MEANINGFUL STARTER`;else if(opp.concentration>=.65&&opp.meaningfulActive<=2){const top=gvOpportunityTop(opp),pi=top?playerInfo(top.pid):null;suffix=` • ${trailingName}'S REMAINING UPSIDE${pi?.name||pi?.full_name?` RUNS THROUGH ${pi.name||pi.full_name}`:' IS HIGHLY CONCENTRATED'}`}}
  if(beforeLeader!==afterLeader)return `${leaderName} TAKES THE LEAD${suffix}`;
  if(Math.abs(afterDiff)>=Math.abs(beforeDiff)+5)return `${leaderName} EXTENDS THE EDGE${suffix}`;
  if(suffix)return `${leaderName} LEADS${suffix}`;
  return '';
}
function renderGameViewScorebar(){
  const pair=gameViewPair();if(!pair)return;
  const p=orientedPair(pair),left=p.rows[0],right=p.rows[1],lr=rosterFor(left.roster_id),rr=rosterFor(right.roster_id);
  $('#gvLeftName').textContent=teamName(lr);$('#gvRightName').textContent=teamName(rr);
  $('#gvLeftScore').textContent=pts(left.points);$('#gvRightScore').textContent=pts(right.points);
  $('#gvHomeEndLabel').textContent=teamName(lr);$('#gvAwayEndLabel').textContent=teamName(rr);renderGameViewOpportunityBar();
}
function gvRenderNflEndzones(evt,built){
  const left=$('#gvHomeEndLabel'),right=$('#gvAwayEndLabel');if(!left||!right||!evt||!built?.formation)return;
  const eventTeam=gvScheduleTeamCode(evt.nflTeam||evt.receiverNflTeam||evt.passerNflTeam||'');
  const opponent=gvScheduleTeamCode(evt.opponentNflTeam||gvOpponentFromWeeklyMap(eventTeam)||'');
  if(!eventTeam)return;
  const defensiveEvent=String(evt.playType||gvPlayType(evt)).startsWith('def_');
  const offenseTeam=defensiveEvent?(opponent||'OPP'):eventTeam;
  const defenseTeam=defensiveEvent?eventTeam:(opponent||'OPP');
  // The formation's `own` flag tells us which physical end of the synthetic
  // field the offense starts from. Label those ends with the actual NFL matchup.
  const leftTeam=built.formation.own?offenseTeam:defenseTeam;
  const rightTeam=built.formation.own?defenseTeam:offenseTeam;
  left.textContent=gvNflTeamLabel(leftTeam);right.textContent=gvNflTeamLabel(rightTeam);
  const lc=nflTeamColors(leftTeam),rc=nflTeamColors(rightTeam),le=left.closest('.gv-endzone'),re=right.closest('.gv-endzone');
  if(le){le.style.background=`linear-gradient(135deg,${lc[0]}cc,${lc[1]}aa)`;le.style.color=readableText(lc[0])}
  if(re){re.style.background=`linear-gradient(135deg,${rc[0]}cc,${rc[1]}aa)`;re.style.color=readableText(rc[0])}
}


function gvNormalizeSourceValue(source,e={}){
  const s=String(source||'').toLowerCase();
  if(e?.testingForced||s==='testing'||s==='test')return 'testing';
  if(e?.simulated||e?.simulatedTandem||s==='simulation'||s==='sim')return 'simulation';
  if(e?.reconstructed||s==='reconstructed'||s==='recon')return 'reconstructed';
  if(s==='summary')return 'summary';
  if(s==='live')return 'live';
  return 'live';
}
function gvSourcePriority(source){
  return ({testing:5,simulation:4,reconstructed:3,live:2,summary:1})[gvNormalizeSourceValue(source)]||0;
}
function gvResolveSource(...events){
  let best='live',score=-1;
  for(const e of events){
    if(!e)continue;
    const src=gvNormalizeSourceValue(e.source,e),p=gvSourcePriority(src);
    if(p>score){best=src;score=p}
  }
  return best;
}
function gvNormalizeEventSource(evt, fallback='live'){
  if(!evt)return evt;
  const source=gvNormalizeSourceValue(evt.source||fallback,evt);
  return {...evt,source,testingForced:source==='testing'||!!evt.testingForced,reconstructed:source==='reconstructed'||!!evt.reconstructed};
}

function gvFeedSource(e){
  const src=gvNormalizeSourceValue(e?.source,e||{});
  if(src==='testing')return 'TEST';
  if(src==='simulation')return 'SIMULATION';
  if(src==='summary')return 'SUMMARY';
  return 'LIVE';
}
function gvFeedSourceClass(e){return gvFeedSource(e).toLowerCase()}
function gvFeedQualifier(e){
  if(e?.trickPlay&&e?.trickConfidenceLabel)return e.trickConfidenceLabel;
  const revision=gvReconciliationQualifier(e);
  if(revision)return revision;
  if(e?.type==='burst')return 'MULTI-PLAY BURST';
  if(e?.type==='summary')return 'SUMMARY';
  return '';
}
function gvFeedDetail(e){
  const multi=gvEventHasMultipleFantasyImpacts(e);
  const cross=gvEventHasCrossRosterImpacts(e);
  const pts=multi
    ?(cross?'separate fantasy impacts by roster':'separate player fantasy impacts')
    :`${gvEventPrimaryImpactText(e)} fantasy points`;
  const detail=esc(e?.detail||'Fantasy scoring update');
  if(gvIsLikelyStatCorrection(e))return `${detail} • Sleeper scoring/stat revision${e?.correctionReason?` (${esc(e.correctionReason)})`:''} • ${pts}`;
  if(e?.revisedExistingEvent)return `${detail} • score revised • ${pts}`;
  if(gvIsLegitimateNegativeEvent(e))return `${detail} • ${pts}`;
  return `${detail} • ${pts}`;
}

function gvFeedEntriesForRender(){
  const canonical=(gameViewSession?.feed||[]).slice();
  const seen=new Set(canonical.map(e=>String(e?.id||'')));
  // Simulation events are intentionally session-volatile and therefore do not pass
  // through gvFeedAdd(). Include only those here; live events are never merged from
  // gameViewEvents because gvProcessLiveSnapshot() is the canonical live feed source.
  const selectedRosters=new Set(gvSelectedRosterIds().map(String));
  const volatileSimulation=gameViewEvents.filter(e=>{
    if(gvNormalizeSourceValue(e?.source,e)!=='simulation'||seen.has(String(e?.id||'')))return false;
    const rid=String(e?.rosterId||'');
    if(rid&&selectedRosters.size&&!selectedRosters.has(rid))return false;
    if(Array.isArray(e?.fantasyImpacts)&&e.fantasyImpacts.some(x=>x?.rosterId)){
      return e.fantasyImpacts.some(x=>selectedRosters.has(String(x.rosterId)));
    }
    return true;
  });
  return [...canonical,...volatileSimulation];
}
function gvFindReplayEvent(id){
  if(!id)return null;
  return gvReplayArchivedEvent(id)||gameViewSession?.feed?.find(e=>e.id===id)||gameViewEvents.find(e=>e.id===id)||testingGameViewFeed.find(e=>e.id===id)||null;
}
function gvYouTubeHighlightSearch(e){
  if(!e)return null;
  if(e.type==='baseline'||e.type==='summary')return null;
  const type=String(e.playType||gvPlayType(e)||'').toLowerCase();
  const detail=String(e.detail||'').toLowerCase();
  const stats=e.intervalAnalysis?.stats||{};
  const td=gvIsTouchdownEvent(e,type)||/touchdown|pick six|scoop and score|kick six/.test(detail)||Number(stats.pass_td||0)>0||Number(stats.rush_td||0)>0||Number(stats.rec_td||0)>0||Number(stats.def_td||0)>0||Number(stats.def_st_td||0)>0;
  const interception=type==='def_int'||type==='def_int_td'||Number(stats.pass_int||0)>0||Number(stats.int||0)>0||detail.includes('interception');
  const fumble=['def_fumble','def_fum_td','wr_rec_fumble','rb_rec_fumble','wr_rush_fumble','rb_rush_fumble'].includes(type)||Number(stats.fum_lost||stats.fum_lost_total||0)>0||Number(stats.fum_rec||0)>0||detail.includes('fumble');
  if(!td&&!interception&&!fumble)return null;

  const team=gvNflTeamLabel(e.nflTeam||e.defensiveNflTeam||e.receiverNflTeam||'');
  const identifiedDefender=String(e.defensivePlayerName||'').trim();
  let player=String(e.name||'').trim(),phrase='';
  if(type==='def_int_td'){
    // Never infer a defender from a D/ST event. Use a player only when the
    // reconciliation layer explicitly identified one; otherwise search by team.
    player=identifiedDefender||team;phrase='pick six';
  }else if(type==='def_fum_td'){
    player=identifiedDefender||team;phrase='fumble return touchdown';
  }else if(type==='def_int'){
    player=identifiedDefender||team;phrase='interception';
  }else if(type==='def_fumble'){
    player=identifiedDefender||team;phrase='fumble recovery';
  }else if(type==='def_kick_ret_td'){
    player=String(e.returnerName||e.name||'').trim()||team;phrase='kickoff return touchdown';
  }else if(type==='def_punt_ret_td'){
    player=String(e.returnerName||e.name||'').trim()||team;phrase='punt return touchdown';
  }else if(td){
    player=String(e.qbName||e.passerName||e.name||'').trim();phrase='touchdown';
  }else if(interception){
    // An offensive interception can safely use the explicitly recorded QB/player.
    player=String(e.offensivePlayerName||e.qbName||e.name||'').trim();phrase='interception';
  }else if(fumble){
    player=String(e.offensivePlayerName||e.name||'').trim();phrase='fumble';
  }
  if(!player)return null;
  const query=`${player} ${phrase}`.trim();
  const url=gvYouTubeSearchUrl(query);
  return {query,url};
}
function gvYouTubeSearchUrl(query){
  // YouTube's Upload date → Today filter currently uses the same encoded
  // search-filter token on desktop web and mobile web/app handoff URLs.
  // Keep this centralized because YouTube's undocumented `sp` tokens may change.
  const todayFilter='EgIIAg%253D%253D';
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(String(query||'').trim())}&sp=${todayFilter}`;
}
function gvFeedDetailHtml(e,score=''){
  const text=`${gvFeedDetail(e)}${score}`;
  const search=gvYouTubeHighlightSearch(e);
  if(!search)return esc(text);
  return `<a class="gv-highlight-search" href="${esc(search.url)}" target="_blank" rel="noopener noreferrer" title="Search YouTube for ${esc(search.query)}">${esc(text)}</a>`;
}
function renderGameViewFeed(){
  const host=$('#gameViewFeed');if(!host)return;
  const liveFeed=gvFeedEntriesForRender();
  if(!liveFeed.length){
    host.innerHTML='<div class="empty">GameView is waiting for matchup activity.</div>';return;
  }
  const rows=[];
  for(const e of liveFeed.slice().sort((a,b)=>(b.time||0)-(a.time||0))){
    if(e.type==='baseline'){
      rows.push(`<div class="gv-feed-item"><div class="gv-feed-meta"><span class="gv-source-badge baseline">SESSION</span><time>${new Date(e.time).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</time></div><b>GameView started</b><small>${Number(e.leftScore||0).toFixed(2)} – ${Number(e.rightScore||0).toFixed(2)} • Earlier scoring is already reflected in the matchup total.</small></div>`);
      continue;
    }
    if(e.type==='summary'&&e.players){
      const when=`${new Date(e.startTime||e.time).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}–${new Date(e.endTime||e.time).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`;
      const detail=(e.players||[]).map(p=>`${esc(p.name)} (${esc(p.pos)}) ${p.delta>=0?'+':''}${Number(p.delta||0).toFixed(2)}`).join(' • ');
      rows.push(`<div class="gv-feed-item"><div class="gv-feed-meta"><span class="gv-event-kind">SUMMARY</span><time>${when}</time></div><b>While You Were Away</b><small>${detail||'Matchup scoring changed while GameView was closed.'}</small></div>`);
      continue;
    }
    const source=gvFeedSource(e),qualifier=gvFeedQualifier(e);
    const who=e.turnoverKind&&e.offensivePlayerName&&e.defensivePlayerName
      ?`${esc(e.offensivePlayerName)} → ${esc(e.defensivePlayerName)} <span>${esc(e.turnoverKind)} • ${esc(e.nflTeam||'')}</span>`
      :e.multiActor&&(e.passerName||e.qbName)&&e.receiverName
      ?`${esc(e.passerName||e.qbName)} (${esc(e.passerPos||e.qbPos||'QB')}) → ${esc(e.receiverName)} (${esc(e.receiverPos||e.pos||'REC')}) <span>${esc(e.nflTeam||e.receiverNflTeam||e.passerNflTeam||'')}</span>`
      :`${esc(e.name||'Scoring update')} <span>${esc(e.pos||'')} ${e.nflTeam?`• ${esc(e.nflTeam)}`:''}</span>`;
    const score=(Number.isFinite(Number(e.leftScore))&&Number.isFinite(Number(e.rightScore)))
      ?` • ${Number(e.leftScore||0).toFixed(2)}–${Number(e.rightScore||0).toFixed(2)}`:'';
    rows.push(`<div class="gv-feed-item">
      <div class="gv-feed-meta"><span class="gv-source-badge ${gvFeedSourceClass(e)}">${source}</span>${qualifier?`<span class="gv-event-kind ${gvIsLikelyStatCorrection(e)?'stat-correction':e?.trickPlay?`trick-${esc(e.trickConfidenceLevel||'possible')}`:''}">${esc(qualifier)}</span>`:''}<time>${new Date(e.time||Date.now()).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</time></div>
      <b>${who}</b>
      <small>${gvFeedDetailHtml(e,score)}</small>
      ${gvEventHasMultipleFantasyImpacts(e)?`<div class="gv-feed-impact-breakdown">${gvEventImpactBreakdownHtml(e)}</div>`:''}
      ${gvReplayAvailable(e.id)?`<button class="gv-replay" data-gv-replay="${esc(e.id)}">Replay</button>`:''}
    </div>`);
  }
  host.innerHTML=rows.join('');
  host.querySelectorAll('[data-gv-replay]').forEach(btn=>btn.onclick=()=>{
    const evt=gvFindReplayEvent(btn.dataset.gvReplay);
    if(!evt||gameViewPlaying)return;
    if(evt.type==='burst')playGameViewBurst(evt,true);else playGameViewEvent(evt,true);
  });
}
function gvClearActors(){
  gvActorAnimations.forEach(a=>{try{a.cancel()}catch(e){}});gvActorAnimations=[];
  gvActiveMotionFrames.forEach(id=>{try{cancelAnimationFrame(id)}catch(e){}});
  gvActiveMotionFrames.clear();
  const field=$('#gameViewField');
  if(field){
    field.querySelectorAll('.gv-possession-ring').forEach(x=>{if(x._gvFrame)cancelAnimationFrame(x._gvFrame);x.remove()});
    field.querySelectorAll('.gv-football,.gv-uprights,.gv-impact-ring,.gv-engage-link').forEach(x=>x.remove());
  }
  const layer=$('#gvPlayersLayer');if(layer)layer.innerHTML='';
  const los=$('#gvLos');if(los)los.hidden=true;
}
function clearGameViewEffects(blank=true){
  gvClearPossession();
  const field=$('#gameViewField'),pop=$('#gvPointsPop'),banner=$('#gvBanner'),conf=$('#gvConfetti');
  if(field){field.getAnimations().forEach(a=>a.cancel());field.classList.remove('impact-medium','impact-huge')}
  const identity=$('#gvPlayerIdentity'),value=$('#gvPointsValue'),impact=$('#gvPointsImpactBreakdown'),detail=$('#gvPlayDetail'),context=$('#gvMatchupContext');
  if(pop){pop.getAnimations().forEach(a=>a.cancel());pop.hidden=true}
  if(identity)identity.textContent='';if(value)value.textContent='';if(impact)impact.textContent='';if(detail)detail.textContent='';if(context){context.textContent='';context.classList.remove('lead-change','edge-extension')}
  if(banner){banner.getAnimations().forEach(a=>a.cancel());banner.hidden=true;banner.textContent='';banner.classList.remove('touchdown','sack','big-play')}
  if(conf)conf.innerHTML='';
  gvClearActors();
  if(blank&&$('#gvStatus'))$('#gvStatus').textContent='Waiting for scoring';
}
function makeConfetti(count=30){
  const root=$('#gvConfetti');if(!root)return;
  root.innerHTML='';
  for(let i=0;i<count;i++){const x=document.createElement('i');x.style.left=`${Math.random()*100}%`;x.style.top=`${-10-Math.random()*25}%`;x.style.transform=`rotate(${Math.random()*180}deg)`;root.appendChild(x);x.animate([{transform:x.style.transform,top:x.style.top,opacity:1},{transform:`translate(${(Math.random()-.5)*100}px,${280+Math.random()*240}px) rotate(${360+Math.random()*540}deg)`,top:'100%',opacity:.15}],{duration:1200+Math.random()*900,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'})}
}
function gvFieldPoint(x,y){
  const portrait=matchMedia('(orientation: portrait)').matches;
  return portrait?{left:`${y}%`,top:`${100-x}%`}:{left:`${x}%`,top:`${y}%`};
}

function gvEventFieldSide(evt){
  const rid=String(evt?.rosterId??'');
  const selected=String($('#teamSelect')?.value??'');
  const pair=gameViewPair?.();
  if(rid&&selected&&rid===selected)return 'left';
  if(rid&&selected&&pair?.rows?.some(r=>String(r.roster_id)===rid))return 'right';
  return evt?.side==='right'?'right':'left';
}

function gvFormation(evt){
  const fieldSide=gvEventFieldSide(evt),own=fieldSide==='left',dir=own?1:-1;
  const type=evt.playType||gvPlayType(evt),pos=String(evt.pos||'').toUpperCase(),seed=assignmentHash(`${evt.id}|formation|${type}|${pos}`);
  const twoPoint=['two_point_pass','two_point_reception','two_point_rush','def_2pt_int','def_2pt_fumble'].includes(type);
  const safety=type==='def_safety';
  const los=twoPoint?(own?88:12):safety?(own?12:88):(own?34:66);
  const snapX=los-dir*2.2;

  const linemen=[
    {role:'LT',x:los-dir*.8,y:36},
    {role:'LG',x:los-dir*.35,y:43},
    {role:'C',x:los,y:50},
    {role:'RG',x:los-dir*.35,y:57},
    {role:'RT',x:los-dir*.8,y:64}
  ];

  let offense=[],defense=[],label='Balanced';

  const addShotgunCore=()=>{
    offense.push(...linemen);
    offense.push({role:'QB',x:los-dir*6,y:50});
  };
  const addUnderCenterCore=()=>{
    offense.push(...linemen);
    offense.push({role:'QB',x:los-dir*2.4,y:50});
  };

  if(type==='kick'||type==='def_blocked_kick'){
    label='Field Goal';
    offense=[
      {role:'TE',x:los-dir*.9,y:31},
      ...linemen,
      {role:'TE',x:los-dir*.9,y:69},
      {role:'H',x:los-dir*7.2,y:50},
      {role:'K',x:los-dir*11.5,y:50},
      {role:'WB',x:los-dir*4.2,y:24},
      {role:'WB',x:los-dir*4.2,y:76}
    ];
    defense=[
      {role:'EDGE',x:los+dir*1.5,y:29},
      {role:'DT',x:los+dir*.9,y:38},
      {role:'DT',x:los+dir*.8,y:45},
      {role:'NT',x:los+dir*.6,y:50},
      {role:'DT',x:los+dir*.8,y:55},
      {role:'DT',x:los+dir*.9,y:62},
      {role:'EDGE',x:los+dir*1.5,y:71},
      {role:'LB',x:los+dir*5,y:40},
      {role:'LB',x:los+dir*5,y:60},
      {role:'S',x:los+dir*12,y:35},
      {role:'S',x:los+dir*12,y:65}
    ];
  }else if(type==='rb_run'||type==='off_fum_rec_td'){
    const heavy=seed%3===0;
    if(heavy){
      label='12 Personnel';
      addUnderCenterCore();
      offense.push(
        {role:'RB',x:los-dir*7.2,y:50},
        {role:'TE',x:los-dir*.8,y:28},
        {role:'TE',x:los-dir*.8,y:72},
        {role:'WR',x:los-dir*.4,y:14},
        {role:'WR',x:los-dir*.4,y:86}
      );
      defense=[
        {role:'DE',x:los+dir*1.6,y:31},{role:'DT',x:los+dir*1,y:43},{role:'DT',x:los+dir*1,y:57},{role:'DE',x:los+dir*1.6,y:69},
        {role:'LB',x:los+dir*5,y:35},{role:'LB',x:los+dir*5,y:50},{role:'LB',x:los+dir*5,y:65},
        {role:'CB',x:los+dir*4,y:14},{role:'CB',x:los+dir*4,y:86},
        {role:'S',x:los+dir*12,y:41},{role:'S',x:los+dir*12,y:59}
      ];
    }else{
      label='Shotgun Run';
      addShotgunCore();
      offense.push(
        {role:'RB',x:los-dir*7,y:57},
        {role:'TE',x:los-dir*.9,y:70},
        {role:'WR',x:los-dir*.4,y:16},
        {role:'WR',x:los-dir*.4,y:30},
        {role:'WR',x:los-dir*.4,y:86}
      );
      defense=[
        {role:'EDGE',x:los+dir*1.5,y:33},{role:'DT',x:los+dir*1,y:44},{role:'DT',x:los+dir*1,y:56},{role:'EDGE',x:los+dir*1.5,y:67},
        {role:'LB',x:los+dir*5,y:42},{role:'LB',x:los+dir*5,y:58},
        {role:'NB',x:los+dir*4,y:28},
        {role:'CB',x:los+dir*4,y:14},{role:'CB',x:los+dir*4,y:86},
        {role:'S',x:los+dir*12,y:39},{role:'S',x:los+dir*12,y:61}
      ];
    }
  }else if(type==='qb_run'){
    label=seed%2?'Empty QB Run':'Read Option';
    addShotgunCore();
    if(label==='Read Option'){
      offense.push(
        {role:'RB',x:los-dir*7,y:59},
        {role:'TE',x:los-dir*.9,y:70},
        {role:'WR',x:los-dir*.4,y:15},
        {role:'WR',x:los-dir*.4,y:31},
        {role:'WR',x:los-dir*.4,y:86}
      );
    }else{
      offense.push(
        {role:'WR',x:los-dir*.4,y:12},
        {role:'WR',x:los-dir*.4,y:27},
        {role:'WR',x:los-dir*.4,y:43},
        {role:'WR',x:los-dir*.4,y:73},
        {role:'WR',x:los-dir*.4,y:88}
      );
    }
    defense=[
      {role:'EDGE',x:los+dir*1.5,y:34},{role:'DT',x:los+dir*1,y:45},{role:'DT',x:los+dir*1,y:55},{role:'EDGE',x:los+dir*1.5,y:66},
      {role:'LB',x:los+dir*5,y:42},{role:'LB',x:los+dir*5,y:58},
      {role:'NB',x:los+dir*4,y:28},
      {role:'CB',x:los+dir*4,y:12},{role:'CB',x:los+dir*4,y:88},
      {role:'S',x:los+dir*12,y:40},{role:'S',x:los+dir*12,y:60}
    ];
  }else{
    const empty=seed%4===0,spread=seed%2===0;
    label=empty?'Empty':'11 Personnel';
    addShotgunCore();
    if(empty){
      offense.push(
        {role:'WR',x:los-dir*.4,y:11},
        {role:'WR',x:los-dir*.4,y:25},
        {role:'WR',x:los-dir*.4,y:40},
        {role:'WR',x:los-dir*.4,y:74},
        {role:'WR',x:los-dir*.4,y:89}
      );
    }else{
      offense.push(
        {role:'RB',x:los-dir*7,y:58},
        {role:'TE',x:los-dir*.8,y:spread?67:71},
        {role:'WR',x:los-dir*.4,y:spread?13:16},
        {role:'WR',x:los-dir*.4,y:spread?31:28},
        {role:'WR',x:los-dir*.4,y:spread?87:84}
      );
    }
    defense=[
      {role:'EDGE',x:los+dir*1.4,y:34},{role:'DT',x:los+dir*.9,y:45},{role:'DT',x:los+dir*.9,y:55},{role:'EDGE',x:los+dir*1.4,y:66},
      {role:'LB',x:los+dir*5,y:42},{role:'LB',x:los+dir*5,y:58},
      {role:'NB',x:los+dir*4,y:29},
      {role:'CB',x:los+dir*4,y:12},{role:'CB',x:los+dir*4,y:88},
      {role:'S',x:los+dir*12,y:39},{role:'S',x:los+dir*12,y:61}
    ];
  }

  if(evt?.trickPlay){
    const passerPos=String(evt.passerPos||evt.qbPos||'QB').toUpperCase();
    const receiverPos=String(evt.receiverPos||'WR').toUpperCase();
    const need={};
    need[passerPos]=(need[passerPos]||0)+1;
    need[receiverPos]=(need[receiverPos]||0)+1;
    const countRole=role=>offense.filter(u=>u.role===role).length;
    const replaceable=()=>offense.findIndex(u=>['WR','RB','TE'].includes(u.role)&&countRole(u.role)>(need[u.role]||0));
    for(const [role,wanted] of Object.entries(need)){
      while(countRole(role)<wanted){
        let idx=replaceable();
        if(idx<0)idx=offense.findIndex(u=>u.role==='WR');
        if(idx<0)break;
        offense[idx]={...offense[idx],role};
      }
    }
    // v0.5.09: preserve the trick passer's normal pre-snap position. The reveal
    // happens after the snap: the WR/RB/TE moves along the line, receives a
    // backward/horizontal pass, then becomes the passer while the QB releases.
    evt.trickFormationAudit={normalPreSnapAlignment:true,passerPos,receiverPos};
    label=receiverPos==='QB'&&passerPos!=='QB'
      ?`QB Throwback • ${passerPos} → QB`
      :`Trick Pass • ${passerPos} → ${receiverPos}`;
  }

  // The coordinate formulas above are already direction-aware.
  // Left side:  dir=+1, LOS=34 -> offense x < 34, attacks right.
  // Right side: dir=-1, LOS=66 -> offense x > 66, attacks left.
  // Do NOT mirror these coordinates again.
  return {own,fieldSide,dir,los,offense,defense,label,snapX};
}

function gvReceiverUnitIndex(evt,candidates){
  if(!Array.isArray(candidates)||!candidates.length)return -1;
  // v0.4.40: choose the receiver lane with a seeded uniform draw rather than
  // relying on raw hash modulo. The result remains replay-stable but distributes
  // targets evenly across all eligible WR/TE/RB formation slots.
  const key=String(evt?.receiverPlayerId||evt?.playerId||evt?.id||'receiver');
  const seed=assignmentHash(`${key}|receiver-slot-v2|${evt?.detail||''}`);
  return Math.min(candidates.length-1,Math.floor(simRand(seed,941)*candidates.length));
}

