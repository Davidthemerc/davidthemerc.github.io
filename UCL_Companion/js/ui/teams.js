function leagueSeasonTeams(){
  return (leagueRosters||[]).map(r=>{
    const owner=leagueUserById(r.owner_id);
    const username=owner?.display_name||owner?.username||String(r.owner_id||`Roster ${r.roster_id}`);
    const teamName=String(owner?.metadata?.team_name||'').trim()||username;
    return {
      rosterId:String(r.roster_id),
      ownerId:String(r.owner_id||''),
      username,
      teamName
    };
  }).sort((a,b)=>String(a.teamName).localeCompare(String(b.teamName)));
}
function renderLeagueTeams(){
  const picker=$('#teamsPicker');
  if(!picker)return;

  // Live Season team browsing uses current roster/user data only.
  const teams=leagueSeasonTeams();
  if(!selectedLeagueTeamRosterId || !teams.some(t=>String(t.rosterId)===String(selectedLeagueTeamRosterId))){
    selectedLeagueTeamRosterId=String(sleeperCtx.rosterId||teams[0]?.rosterId||'');
  }

  picker.innerHTML=teams.map(t=>`<button type="button" data-team-roster="${t.rosterId}" class="${String(t.rosterId)===String(selectedLeagueTeamRosterId)?'active':''}">${esc(t.teamName)}</button>`).join('');
  const selected=teams.find(t=>String(t.rosterId)===String(selectedLeagueTeamRosterId));
  if(selected)renderLeagueTeamPage(selected);
}
function renderTeamAnalysis(){
  const grid=$('#teamAnalysisGrid'),summary=$('#analysisSummary'),strip=$('#analysisLeagueStrip');
  if(!grid||!summary||!strip)return;
  const teams=leagueDraftGrades();
  if(!teams.length){
    grid.innerHTML='<div class="empty">No Sleeper draft picks available yet.</div>';
    summary.innerHTML='';strip.innerHTML='';return;
  }

  const analyses=teams.map(t=>({team:t,a:teamDraftAnalysis(t)}));
  const totalPicks=analyses.reduce((s,x)=>s+x.team.picks.length,0);
  const totalReaches=analyses.reduce((s,x)=>s+x.a.reaches.length+x.a.offList.length,0);
  const avgAdherence=Math.round(analyses.reduce((s,x)=>s+x.a.adherence,0)/analyses.length);
  const mostAgg=analyses.slice().sort((x,y)=>(y.a.reaches.length+y.a.offList.length)-(x.a.reaches.length+x.a.offList.length))[0];
  const mostValue=analyses.slice().sort((x,y)=>y.team.grade.valueScore-x.team.grade.valueScore)[0];

  summary.innerHTML=`
    <span><b>${totalPicks}</b> picks analyzed</span>
    <span><b>${avgAdherence}%</b> avg list adherence</span>
    <span><b>${totalReaches}</b> reaches/off-list</span>`;

  strip.innerHTML=`
    <span class="analysis-league-chip"><b>Most aggressive:</b>${esc(mostAgg?.team.teamName||'—')}</span>
    <span class="analysis-league-chip"><b>Best value:</b>${esc(mostValue?.team.teamName||'—')}</span>
    <span class="analysis-league-chip"><b>Current leader:</b>${esc(teams[0]?.teamName||'—')} (${teams[0]?.grade.letter||'—'})</span>`;

  renderThreatRadar(analyses);
  grid.innerHTML=analyses.map(({team,a})=>{
    const perspective=teamAnalysisPerspective(team),me=perspective.me;
    const positions=['QB','RB','WR','TE','K','DEF'].filter(p=>a.c[p]>0);
    const recent=team.grade.graded.slice(-6).reverse();
    const worstName=a.worst ? (a.worst.ranked?.name||sleeperPickName(a.worst.pick)||'Off-list') : '—';
    const bestName=a.best?.ranked?.name||'—';
    return `<section class="team-analysis-card ${me?'me':''}" data-open-team="${team.rosterId}" title="Open ${esc(team.teamName)} team page">
      <div class="ta-head">
        <div class="ta-name">
          <b>${esc(team.teamName)}${me?' • YOU':''}</b>
          <small>${esc(team.username)} • ${team.picks.length} picks • ${esc(draftStyleLabel(a))}</small>
        </div>
        <div class="ta-grade">${gradeBadge(team.grade.letter)}<small>${team.grade.score} overall</small></div>
      </div>

      <div class="ta-metrics">
        <div class="ta-metric"><span>List Adherence</span><b>${a.adherence}%</b></div>
        <div class="ta-metric"><span>Avg Pick vs Rank</span><b>${a.avgDelta>0?'+':''}${a.avgDelta.toFixed(1)}</b></div>
        <div class="ta-metric"><span>Reaches</span><b>${a.reaches.length}${a.offList.length?` + ${a.offList.length} NR`:''}</b></div>
        <div class="ta-metric"><span>Steals</span><b>${a.steals.length}</b></div>
      </div>

      <div class="ta-roster">${positions.map(p=>{
        const n=a.c[p],cls=(p==='RB'&&n>=4)||(p==='WR'&&n>=5)||(p==='QB'&&n>=2)||(p==='TE'&&n>=2)?'thick':'';
        return `<span class="ta-pos ${cls}">${p} ${n}</span>`;
      }).join('')}</div>

      <div class="ta-tendency"><b>${perspective.readLabel}</b> ${esc(a.tendency)}
        ${a.worst?` <b>Biggest reach:</b> ${esc(worstName)}.`:''}
        ${a.best&&a.best.delta>=5?` <b>Best value:</b> ${esc(bestName)} (+${a.best.delta}).`:''}
      </div>
      <div class="ta-projection"><b>${perspective.projectionLabel}</b> ${likelyNextPositions(team,a).slice(0,3).map((x,i)=>`${i+1}. ${x.pos}`).join(' • ')}</div>
      <div class="ta-patterns">${draftPatternRecognition(team,a).map(p=>`<span class="ta-pattern ${p.kind}">${esc(p.text)}</span>`).join('')}</div>
      <div class="ta-for-you"><b>${perspective.outlookLabel}</b> ${esc(whatThisMeansForYou(team,a))}</div>

      <details class="ta-picks">
        <summary class="ta-picks-title">Recent picks (${recent.length})</summary>
        <div class="ta-picks-body">
        ${recent.map(g=>{
          const md=g.pick.metadata||{},name=g.ranked?.name||sleeperPickName(g.pick)||String(g.pick.player_id||'Unknown');
          const v=valueTextForAnalysis(g);
          return `<div class="ta-pick-row">
            <span class="pick">${pickLabel(g.pick)}</span>
            <span class="player">${esc(name)} <small>${esc(pickPosition(g.pick,g.ranked)||'—')}${g.ranked?` • #${g.ranked.rank}`:' • NR'}</small></span>
            <span class="value ${v.cls}">${esc(v.text)}</span>
          </div>`;
        }).join('')}
        </div>
      </details>
    </section>`;
  }).join('');
}
function leagueDraftGrades(){
  const rosters=(leagueRosters||[]).map(r=>{
    const picks=picksForRoster(r.roster_id);
    const grade=gradeDraftPicks(picks);
    const owner=leagueUserById(r.owner_id);
    const teamName=String(owner?.metadata?.team_name||'').trim();
    const username=owner?.display_name||owner?.username||String(r.owner_id||`Roster ${r.roster_id}`);
    return {
      rosterId:String(r.roster_id),ownerId:String(r.owner_id||''),username,
      teamName:teamName||username,grade,picks
    };
  }).filter(x=>x.picks.length);
  rosters.sort((a,b)=>(b.grade.score??-1)-(a.grade.score??-1)||String(a.teamName).localeCompare(String(b.teamName)));
  return rosters.map((x,i)=>({...x,rank:i+1}));
}

function pickPosition(pick,ranked=null){
  const raw=String(pick?.metadata?.position||ranked?.pos||'').toUpperCase();
  return raw==='DST'?'DEF':raw;
}
function leastValuablePositionWeight(pos){
  // Tie-breaker only: special teams first, then TE/QB, then RB/WR.
  // Primary Worst Reach ordering remains unranked status, then reach/list value.
  const p=String(pos||'').toUpperCase();
  return ({K:6,DEF:6,TE:5,QB:4,RB:2,WR:1})[p]||3;
}
function worstReachComparator(a,b){
  const teams=Number(verifiedLeague?.total_rosters||8);
  const roundOf=x=>Number(x.round||x.pick?.round||Math.ceil(Number(x.pickNo||x.pick?.pick_no||1)/teams)||1);
  const scoreOf=x=>Number.isFinite(Number(x.score))?Number(x.score):pickValueScore(x.ranked?.rank||null,Number(x.pickNo||x.pick?.pick_no||0),roundOf(x));
  const as=scoreOf(a),bs=scoreOf(b);
  if(as!==bs)return as-bs; // lower grade score = worse reach/value decision

  const au=!a.ranked,bu=!b.ranked;
  if(au!==bu)return au?-1:1;
  if(au&&bu)return Number(a.pickNo||0)-Number(b.pickNo||0);

  const aReach=Math.max(0,(a.ranked?.rank||0)-Number(a.pickNo||0));
  const bReach=Math.max(0,(b.ranked?.rank||0)-Number(b.pickNo||0));
  if(aReach!==bReach)return bReach-aReach;
  return Number(a.pickNo||0)-Number(b.pickNo||0);
}
function allLeagueGradedPicks(leagueGrades){
  const out=[];
  for(const team of leagueGrades){
    for(const g of (team.grade?.graded||[]))out.push({...g,team});
  }
  return out;
}
function mostAggressiveTeam(leagueGrades){
  let best=null;
  for(const team of leagueGrades){
    const graded=team.grade?.graded||[];
    if(!graded.length)continue;
    let aggression=0,den=0;
    for(const g of graded){
      if(!g.ranked){
        // Off-list picks count as very aggressive, especially early.
        aggression+=(80-Math.min(45,(g.round-1)*5));
        den++;
      }else{
        aggression+=Math.max(0,g.ranked.rank-g.pickNo);
        den++;
      }
    }
    const avg=den?aggression/den:0;
    if(!best||avg>best.avg)best={team,avg};
  }
  return best;
}
function bestPositionTeam(leagueGrades,pos){
  let best=null;
  for(const team of leagueGrades){
    const pg=positionalReportGradesForPicks(team.picks).find(x=>x.pos===pos);
    if(!pg||pg.score==null)continue;
    if(!best||pg.score>best.grade.score||
       (pg.score===best.grade.score&&(team.grade.valueScore??0)>(best.team.grade.valueScore??0))){
      best={team,grade:pg};
    }
  }
  return best;
}
function leagueDraftAwards(leagueGrades){
  const all=allLeagueGradedPicks(leagueGrades);
  const bestDraft=leagueGrades[0]||null;
  const biggestSteal=all.filter(x=>x.ranked&&x.delta>0)
    .sort((a,b)=>b.delta-a.delta||b.score-a.score||a.pickNo-b.pickNo)[0]||null;

  const worstReach=all.slice().sort(worstReachComparator)[0]||null;
  const bestValue=leagueGrades.slice().sort((a,b)=>
    (b.grade.valueScore??-1)-(a.grade.valueScore??-1)||
    (b.grade.score??-1)-(a.grade.score??-1))[0]||null;
  const aggressive=mostAggressiveTeam(leagueGrades);

  return {
    bestDraft,biggestSteal,worstReach,bestValue,aggressive,
    QB:bestPositionTeam(leagueGrades,'QB'),
    RB:bestPositionTeam(leagueGrades,'RB'),
    WR:bestPositionTeam(leagueGrades,'WR'),
    TE:bestPositionTeam(leagueGrades,'TE')
  };
}
function awardPickName(g){
  if(!g)return '—';
  const md=g.pick?.metadata||{};
  return g.ranked?.name||sleeperPickName(g.pick)||String(g.pick?.player_id||'Unknown Sleeper Player');
}
function renderLeagueAwards(leagueGrades){
  const el=$('#reportAwards');if(!el)return;
  const a=leagueDraftAwards(leagueGrades);
  const cards=[];

  if(a.bestDraft)cards.push({
    title:'Best Draft',winner:a.bestDraft.teamName,
    detail:`${a.bestDraft.grade.letter} • ${a.bestDraft.grade.score} overall • ranked #1 of ${leagueGrades.length}`,major:true
  });
  if(a.biggestSteal)cards.push({
    title:'Biggest Steal',winner:awardPickName(a.biggestSteal),
    detail:`${a.biggestSteal.team.teamName} • ${pickLabel(a.biggestSteal.pick)} • List #${a.biggestSteal.ranked.rank} • +${a.biggestSteal.delta} picks`,major:true
  });
  if(a.worstReach){
    const unranked=!a.worstReach.ranked;
    const reach=a.worstReach.ranked?Math.max(0,a.worstReach.ranked.rank-a.worstReach.pickNo):null;
    cards.push({
      title:'Worst Reach',winner:awardPickName(a.worstReach),
      detail:unranked
        ?`${a.worstReach.team.teamName} • ${pickLabel(a.worstReach.pick)} • NOT IN RANKING LIST`
        :`${a.worstReach.team.teamName} • ${pickLabel(a.worstReach.pick)} • List #${a.worstReach.ranked.rank} • ${reach}-pick reach`,
      bad:true
    });
  }
  if(a.bestValue)cards.push({
    title:'Best Value Drafter',winner:a.bestValue.teamName,
    detail:`Draft Value ${a.bestValue.grade.valueScore} • ${a.bestValue.grade.letter} overall`
  });
  if(a.aggressive)cards.push({
    title:'Most Aggressive Drafter',winner:a.aggressive.team.teamName,
    detail:`Avg. reach pressure ${a.aggressive.avg.toFixed(1)} picks per selection`
  });

  for(const pos of ['QB','RB','WR','TE']){
    const w=a[pos];
    if(w)cards.push({
      title:`Best ${pos} Draft`,winner:w.team.teamName,
      detail:`${w.grade.letter} • ${w.grade.score} positional score • ${w.grade.detail}`
    });
  }

  el.innerHTML=cards.map(c=>`
    <div class="award-card ${c.major?'major':''} ${c.bad?'bad-award':''}">
      <div class="award-title">${esc(c.title)}</div>
      <div class="award-winner">${esc(c.winner)}</div>
      <div class="award-detail">${esc(c.detail)}</div>
    </div>`).join('');
}
function positionalReportGradesForPicks(picks){
  const g=gradeDraftPicks(picks),positions=['QB','RB','WR','TE'];
  const r=draftLineupRequirements(),required={QB:r.QB,RB:r.RB,WR:r.WR,TE:r.TE};
  return positions.map(pos=>{
    const pp=g.graded.filter(x=>String(x.pick?.metadata?.position||x.ranked?.pos||'').toUpperCase()===pos);
    if(!pp.length)return {pos,letter:required[pos]>0?'F':'N/A',score:required[pos]>0?45:null,detail:'No picks',comment:required[pos]>0?`${pos} was never addressed.`:`${pos} was optional in this lineup.`};
    const avg=pp.reduce((s,x)=>s+x.score,0)/pp.length;
    let score=avg;
    if(required[pos]&&pp.length<required[pos])score-=12*(required[pos]-pp.length);
    score=Math.max(35,Math.min(100,Math.round(score)));
    const values=pp.filter(x=>x.delta!=null).map(x=>x.delta);
    const avgDelta=values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null;
    let comment='';
    if(required[pos]===0&&pos==='TE')comment=`TE was a FLEX-only choice; ${pp.length} selected.`;
    else if(score>=90)comment=`${pos} was a major strength: strong value across ${pp.length} selection${pp.length===1?'':'s'}.`;
    else if(score>=80)comment=`${pos} was handled well with generally sound draft value.`;
    else if(score>=70)comment=`${pos} was adequate, though the value/depth profile was mixed.`;
    else comment=`${pos} was a weak point due to reach cost, insufficient depth, or both.`;
    if(avgDelta!=null&&Math.abs(avgDelta)>=5)comment+=avgDelta>0?` Average value: ${avgDelta} picks later than list rank.`:` Average cost: ${Math.abs(avgDelta)} picks earlier than list rank.`;
    return {pos,letter:gradeLetter(score),score,detail:`${pp.length} pick${pp.length===1?'':'s'}`,comment};
  });
}
function positionalReportGrades(){
  return positionalReportGradesForPicks(myRawPicks());
}
function postDraftAssessment(){
  const prof=myRosterProfile(),c=prof.counts,tags=[],r=draftLineupRequirements();
  const rb=Number(c.RB||0),wr=Number(c.WR||0),te=Number(c.TE||0),qb=Number(c.QB||0);
  if(rb>=r.RB+2)tags.push({kind:'good',text:`Strong RB depth: ${rb}`});
  else if(rb>=r.RB+1)tags.push({kind:'good',text:`RB depth: ${rb}`});
  else tags.push({kind:'warn',text:`Thin RB depth: ${rb}`});
  if(wr>=r.WR+2)tags.push({kind:'good',text:`Strong WR depth: ${wr}`});
  else if(wr>=r.WR+1)tags.push({kind:'good',text:`WR depth: ${wr}`});
  else tags.push({kind:'warn',text:`Thin WR depth: ${wr}`});
  if(qb>=r.QB)tags.push({kind:'good',text:'QB starter covered'}); else tags.push({kind:'bad',text:'QB starter uncovered'});
  const flexPool=rb+wr+te;
  if(flexPool>=draftFlexStarterFloor()+2)tags.push({kind:'good',text:'Flexible RB/WR/TE depth'});
  else if(flexPool>=draftFlexStarterFloor())tags.push({kind:'warn',text:'FLEX covered, depth limited'});
  else tags.push({kind:'bad',text:'FLEX starter path incomplete'});
  if(qb>=3)tags.push({kind:'warn',text:`Heavy QB investment: ${qb}`});
  if(r.TE===0&&te>=3)tags.push({kind:'warn',text:`Heavy FLEX-only TE investment: ${te}`});
  if(c.K>=1)tags.push({kind:'good',text:'K covered'}); else tags.push({kind:'warn',text:'K uncovered'});
  if(c.DEF>=1)tags.push({kind:'good',text:'DEF covered'}); else tags.push({kind:'warn',text:'DEF uncovered'});
  const bye=byeConcentrationWarning(prof);
  tags.push(bye?{kind:'warn',text:bye}:{kind:'good',text:'Bye weeks balanced'});
  return tags;
}
function finalEvaluation(g,efficiency,assessment){
  if(g.score==null)return 'No completed draft data is available for this roster.';
  const strengths=assessment.filter(x=>x.kind==='good').map(x=>x.text);
  const concerns=assessment.filter(x=>x.kind!=='good').map(x=>x.text);
  let tone='';
  if(g.score>=90)tone='An excellent draft overall, combining strong board value with disciplined roster construction.';
  else if(g.score>=83)tone='A strong draft with more good decisions than costly ones and a generally sound roster build.';
  else if(g.score>=73)tone='A mixed but workable draft: the roster has useful pieces, though value or construction left points on the table.';
  else if(g.score>=63)tone='A below-average draft that will need in-season management to overcome meaningful value or roster-construction issues.';
  else tone='A difficult draft on paper, driven by major value losses and/or significant roster-construction problems.';
  const value=`Draft Value graded ${g.valueScore}, while Roster Construction graded ${g.constructionScore}.${g.teamStrengthScore!=null?` Week 1 team strength graded ${g.teamStrengthScore} and is included as a supporting part of the overall grade.`:''} Draft-capital efficiency finished at ${efficiency}.`;
  const s=strengths.length?` Strengths: ${strengths.slice(0,3).join(', ')}.`:'';
  const c=concerns.length?` Concerns: ${concerns.slice(0,3).join(', ')}.`:'';
  return tone+' '+value+s+c;
}

function postDraftTransitionStatus(){
  const complete=draftAllowsPostDraftViews();
  const seasonBtn=document.querySelector('[data-tab="season"]');
  const history=loadStrategyHistory();
  return {
    complete,
    boardArchived:complete && !!$('#liveDraftBoard')?.hidden,
    reportActive:complete && !$('#postDraftReport')?.hidden,
    seasonUnlocked:complete && seasonBtn && !seasonBtn.hidden,
    strategyPreserved:Array.isArray(history)
  };
}
function renderPostTransitionStatus(){
  const strip=$('#postTransitionStrip');if(!strip)return;
  const s=postDraftTransitionStatus();
  const set=(id,ok,pending=false)=>{
    const el=$(id)?.closest('span'); if(!el)return;
    el.classList.toggle('pending',!ok&&pending);
    el.classList.toggle('bad',!ok&&!pending);
    $(id).textContent=ok?'✓':pending?'…':'!';
  };
  set('#postTransitionBoard',s.boardArchived,!s.complete);
  set('#postTransitionReport',s.reportActive,!s.complete);
  set('#postTransitionSeason',s.seasonUnlocked,!s.complete);
  set('#postTransitionStrategy',s.strategyPreserved,false);
}
function projectionStatPoints(stats){
  const scoring=verifiedLeague?.scoring_settings||{};
  let total=0,used=0;
  for(const [key,mult] of Object.entries(scoring)){
    const m=Number(mult),v=Number(stats?.[key]);
    if(Number.isFinite(m)&&Number.isFinite(v)){total+=m*v;used++;}
  }
  return used?Math.round(total*100)/100:null;
}
function compactProjectionPayload(payload){
  const rows=Array.isArray(payload)?payload:Object.values(payload||{});
  const tracked=new Set(typeof trackedUclPlayerIds==='function'?trackedUclPlayerIds().map(String):[]);
  const owned=new Set();
  for(const roster of leagueRosters||[])(roster?.players||[]).forEach(id=>owned.add(String(id)));
  const perPos=new Map(['QB','RB','WR','TE','K','DEF'].map(pos=>[pos,[]]));
  const trackedRows=[];
  for(const row of rows){
    const rawPlayer=row?.player||row?.metadata||row||{};
    const id=String(row?.player_id??rawPlayer?.player_id??rawPlayer?.id??'');
    if(!id)continue;
    const stats=row?.stats||row?.projection||row?.projections||{};
    const pts=projectionStatPoints(stats);if(pts==null)continue;
    const rawPos=String(rawPlayer?.position||rawPlayer?.fantasy_positions?.[0]||'').toUpperCase();
    const pos=rawPos==='DST'?'DEF':rawPos;
    const compact={player_id:id,stats,player:{
      player_id:id,full_name:String(rawPlayer?.full_name||rawPlayer?.name||''),
      first_name:String(rawPlayer?.first_name||''),last_name:String(rawPlayer?.last_name||''),
      position:pos,team:String(rawPlayer?.team||rawPlayer?.team_abbr||'').toUpperCase(),
      injury_status:String(rawPlayer?.injury_status||rawPlayer?.injuryStatus||rawPlayer?.designation||''),
      status:String(rawPlayer?.status||'')
    }};
    if(tracked.has(id)||owned.has(id)){trackedRows.push(compact);continue;}
    const bucket=perPos.get(pos);if(!bucket)continue;
    bucket.push({pts,compact});
    bucket.sort((a,b)=>b.pts-a.pts);
    if(bucket.length>PROJECTION_AVAILABLE_METADATA_PER_POSITION)bucket.length=PROJECTION_AVAILABLE_METADATA_PER_POSITION;
  }
  const seen=new Set(),out=[];
  for(const row of [...trackedRows,...[...perPos.values()].flat().map(x=>x.compact)]){
    if(seen.has(row.player_id))continue;seen.add(row.player_id);out.push(row);
  }
  return out;
}
function normalizeWeek1Projections(payload){
  const rows=Array.isArray(payload)?payload:Object.values(payload||{});
  const map=new Map();
  const tracked=new Set(typeof trackedUclPlayerIds==='function'?trackedUclPlayerIds().map(String):[]);
  const owned=new Set();
  for(const roster of leagueRosters||[])(roster?.players||[]).forEach(id=>owned.add(String(id)));
  const metadataBuckets=new Map(['QB','RB','WR','TE','K','DEF'].map(pos=>[pos,[]]));
  const metadataKeep=[];
  for(const row of rows){
    const rawPlayer=row?.player||row?.metadata||row||{};
    const id=String(row?.player_id??rawPlayer?.player_id??rawPlayer?.id??'');
    if(!id)continue;
    const stats=row?.stats||row?.projection||row?.projections||{};
    const pts=projectionStatPoints(stats);
    if(pts!=null)map.set(id,{pts,stats});
    const hasIdentity=rawPlayer?.full_name||rawPlayer?.first_name||rawPlayer?.last_name||rawPlayer?.name;
    const hasFootballMeta=rawPlayer?.position||rawPlayer?.fantasy_positions?.[0]||rawPlayer?.team||rawPlayer?.team_abbr;
    if(!(hasIdentity||hasFootballMeta)||typeof rememberDiscoveredPlayer!=='function')continue;
    const rawPos=String(rawPlayer?.position||rawPlayer?.fantasy_positions?.[0]||'').toUpperCase();
    const pos=rawPos==='DST'?'DEF':rawPos;
    const candidate={id,rawPlayer,pts:Number(pts??-Infinity)};
    if(tracked.has(id)||owned.has(id)){metadataKeep.push(candidate);continue;}
    const bucket=metadataBuckets.get(pos);if(!bucket)continue;
    bucket.push(candidate);bucket.sort((a,b)=>b.pts-a.pts);
    if(bucket.length>PROJECTION_AVAILABLE_METADATA_PER_POSITION)bucket.length=PROJECTION_AVAILABLE_METADATA_PER_POSITION;
  }
  const learnedIds=[];
  for(const row of [...metadataKeep,...[...metadataBuckets.values()].flat()]){
    rememberDiscoveredPlayer(row.id,row.rawPlayer,{persist:false});learnedIds.push(row.id);
  }
  if(learnedIds.length&&typeof persistDiscoveredPlayers==='function')persistDiscoveredPlayers(learnedIds);
  return map;
}
function projectionMapForWeek(week=currentWeekNumber()){
  week=Math.max(1,Number(week)||1);
  if(weekProjectionMaps.has(week))return weekProjectionMaps.get(week);
  if(currentWeekProjectionWeek===week&&currentWeekProjectionData)return currentWeekProjectionData;
  if(week===1&&week1ProjectionData)return week1ProjectionData;
  return null;
}
function currentWeekProjectionForPlayer(playerId,week=currentWeekNumber()){
  if(!playerId)return null;
  return projectionMapForWeek(week)?.get(String(playerId))?.pts??null;
}
function rememberProjectionMap(week,map){
  week=Math.max(1,Number(week)||1);
  if(map?.size)weekProjectionMaps.set(week,map);
  currentWeekProjectionData=map||null;
  currentWeekProjectionWeek=week;
  if(week===1&&map?.size)week1ProjectionData=map;
  return map;
}
function syncCurrentWeekProjections(week=currentWeekNumber(),force=false){
  week=Math.max(1,Number(week)||1);
  if(weekProjectionSyncPromises.has(week))return weekProjectionSyncPromises.get(week);
  const existing=projectionMapForWeek(week);
  if(existing&&!force)return Promise.resolve(existing);

  const promise=(async()=>{
    const qs='season_type=regular&position%5B%5D=QB&position%5B%5D=RB&position%5B%5D=WR&position%5B%5D=TE&position%5B%5D=K&position%5B%5D=DEF';
    const cacheKey=`week-${week}`,ttlMs=30*60*1000;
    const cached=await apiCacheGet('projection',cacheKey);

    if(!force&&cached&&Date.now()-Number(cached.time||0)<ttlMs){
      const map=normalizeWeek1Projections(cached.value);
      if(map.size){
        currentWeekProjectionError='';
        return rememberProjectionMap(week,map);
      }
    }

    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const r=await fetch(`${SLEEPER_PROJECTIONS_API}/${SLEEPER_SEASON}/${week}?${qs}`,{cache:'no-store',signal:controller.signal});
      if(!r.ok)throw new Error(`Sleeper projections ${r.status}`);
      const raw=await r.json(),map=normalizeWeek1Projections(raw);
      if(!map.size)throw new Error(`No Week ${week} projections returned`);
      currentWeekProjectionError='';
      rememberProjectionMap(week,map);
      const compact=compactProjectionPayload(raw);
      apiCachePut('projection',cacheKey,compact,{ttlMs,compact:true}).catch(()=>{});
      return map;
    }catch(err){
      if(cached){
        const map=normalizeWeek1Projections(cached.value);
        if(map.size){
          currentWeekProjectionError=`Using saved projections • ${describeSleeperError(err)}`;
          return rememberProjectionMap(week,map);
        }
      }
      currentWeekProjectionError=describeSleeperError(err);
      throw err;
    }finally{
      clearTimeout(timer);
      weekProjectionSyncPromises.delete(week);
      if(currentWeekProjectionWeek===week)currentWeekProjectionSyncPromise=null;
    }
  })();

  weekProjectionSyncPromises.set(week,promise);
  currentWeekProjectionSyncPromise=promise;
  return promise;
}
function matchupStarterIds(roster,matchup){
  const ids=(matchup?.starters||[]).filter(Boolean);
  return (ids.length?ids:(roster?.starters||[]).filter(Boolean)).map(String);
}
function matchupPlayerIds(roster,matchup){
  const ids=(matchup?.players||[]).filter(Boolean);
  return (ids.length?ids:(roster?.players||[]).filter(Boolean)).map(String);
}
function matchupHasStarted(mine,opp,roster=null,oppRoster=null){
  if(!mine||!opp)return false;
  if(Math.abs(Number(mine.points||0))>0.005||Math.abs(Number(opp.points||0))>0.005)return true;
  const ids=[...matchupStarterIds(roster,mine),...matchupStarterIds(oppRoster,opp)];
  return ids.some(id=>Math.abs(matchupPlayerPoints(mine,id))>0.005||Math.abs(matchupPlayerPoints(opp,id))>0.005);
}
function projectedRosterStarterTotal(roster,week=currentWeekNumber(),matchup=null){
  return matchupStarterIds(roster,matchup).reduce((sum,id)=>sum+Number(currentWeekProjectionForPlayer(id,week)||0),0);
}
function projectedRosterBenchTotal(roster,week=currentWeekNumber(),matchup=null){
  const starters=new Set(matchupStarterIds(roster,matchup));
  return matchupPlayerIds(roster,matchup).filter(id=>!starters.has(String(id))).reduce((sum,id)=>sum+Number(currentWeekProjectionForPlayer(id,week)||0),0);
}
function matchupScoringContext(roster,oppRoster,mine,opp,week=currentWeekNumber()){
  week=Math.max(1,Number(week)||1);
  const started=matchupHasStarted(mine,opp,roster,oppRoster);
  const projectionMap=projectionMapForWeek(week);
  const projected=!started&&!!projectionMap;
  const myTotal=projected?projectedRosterStarterTotal(roster,week,mine):Number(mine?.points||0);
  const oppTotal=projected?projectedRosterStarterTotal(oppRoster,week,opp):Number(opp?.points||0);
  const myBench=projected?projectedRosterBenchTotal(roster,week,mine):matchupBenchTotal(roster,mine);
  const oppBench=projected?projectedRosterBenchTotal(oppRoster,week,opp):matchupBenchTotal(oppRoster,opp);
  return {
    week,started,projected,projectionAvailable:!!projectionMap,
    myTotal,oppTotal,myBench,oppBench,diff:myTotal-oppTotal,
    label:projected?'projected':'actual'
  };
}async function syncWeek1Projections(force=false){
  if(week1ProjectionSyncPromise)return week1ProjectionSyncPromise;
  if(week1ProjectionData&&!force)return week1ProjectionData;
  week1ProjectionSyncPromise=(async()=>{
    try{
      const map=await syncCurrentWeekProjections(1,force);
      week1ProjectionData=map;week1ProjectionError='';
      return map;
    }catch(err){week1ProjectionError=describeSleeperError(err);throw err;}
    finally{week1ProjectionSyncPromise=null;}
  })();
  return week1ProjectionSyncPromise;
}
