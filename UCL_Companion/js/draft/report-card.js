const REPORT_LAZY_SECTIONS={
  reportWeek1Section(ctx){renderWeek1ProjectionReport();},
  reportLeagueSection(ctx){
    const leagueGrades=ctx.leagueGrades||[];
    const myLeague=ctx.myLeague;
    $('#reportLeagueSummary').textContent=myLeague?`Your draft ranked ${myLeague.rank}${myLeague.rank===1?'st':myLeague.rank===2?'nd':myLeague.rank===3?'rd':'th'} of ${leagueGrades.length}`:`${leagueGrades.length} teams graded`;
    $('#reportLeagueLeaderboard').innerHTML=leagueGrades.map(x=>{
      const me=String(x.rosterId)===String(sleeperCtx.rosterId);
      return `<div class="league-rank-item ${me?'me':''}">
        <div class="league-rank-num">${x.rank}</div>
        <div class="league-rank-team"><b>${esc(x.teamName)}</b><small>${esc(x.username)} • ${x.picks.length} picks</small></div>
        <div class="league-rank-grade">${gradeBadge(x.grade.letter)}<small>${x.grade.score}</small></div>
      </div>`;
    }).join('');
  },
  reportAwardsSection(ctx){renderLeagueAwards(ctx.leagueGrades||[]);},
  reportStrategySection(ctx){renderPostDraftStrategyReview(ctx.grade);},
  reportEvaluationSection(ctx){
    let evaluation=finalEvaluation(ctx.grade,ctx.efficiency,ctx.assessment);
    const myLeague=ctx.myLeague,leagueGrades=ctx.leagueGrades||[];
    if(myLeague)evaluation+=` Relative to the rest of the league, this draft finished ${myLeague.rank}${myLeague.rank===1?'st':myLeague.rank===2?'nd':myLeague.rank===3?'rd':'th'} of ${leagueGrades.length} by the same grading model.`;
    const week1League=leagueWeek1ProjectionGrades();
    const week1Mine=week1League.find(x=>String(x.rosterId)===String(sleeperCtx.rosterId));
    if(week1Mine)evaluation+=` Week 1 projected strength ranks ${week1Mine.rank} of ${week1League.length} at ${week1Mine.projection.starterPts.toFixed(2)} projected points; this is immediate roster-strength context used as a supporting component of the completed-team grade, while Draft Value remains separately preserved.`;
    $('#reportEvaluation').textContent=evaluation;
  }
};
let reportLazyObserver=null;
let reportLazyContext={grade:null,efficiency:null,leagueGrades:[],myLeague:null,assessment:[]};
let reportLazyDirty=new Set(Object.keys(REPORT_LAZY_SECTIONS));
function reportSectionIsNearViewport(id,margin=160){
  const el=document.getElementById(id);if(!el||!$('#draftView')?.classList.contains('active')||$('#postDraftReport')?.hidden)return false;
  const r=el.getBoundingClientRect(),h=window.innerHeight||document.documentElement.clientHeight||0;
  return r.bottom>=-margin&&r.top<=h+margin;
}
function renderReportLazySection(id,{force=false}={}){
  const fn=REPORT_LAZY_SECTIONS[id];if(!fn)return false;
  if(!force&&!reportLazyDirty.has(id))return false;
  fn(reportLazyContext);
  reportLazyDirty.delete(id);
  return true;
}
function renderVisibleReportLazySections(){
  for(const id of Object.keys(REPORT_LAZY_SECTIONS))if(reportSectionIsNearViewport(id))renderReportLazySection(id);
}
function ensureReportLazyObserver(){
  if(reportLazyObserver)return;
  if(typeof IntersectionObserver!=='function'){
    reportLazyObserver={fallback:true};
    for(const id of Object.keys(REPORT_LAZY_SECTIONS))renderReportLazySection(id);
    return;
  }
  reportLazyObserver=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting)renderReportLazySection(entry.target.id);
  },{root:null,rootMargin:'160px 0px',threshold:0});
  for(const id of Object.keys(REPORT_LAZY_SECTIONS)){const el=document.getElementById(id);if(el)reportLazyObserver.observe(el);}
}
function updateReportLazyContext(ctx){
  reportLazyContext=ctx;
  reportLazyDirty=new Set(Object.keys(REPORT_LAZY_SECTIONS));
  $('#reportLeagueLeaderboard').innerHTML='';
  $('#reportAwards').innerHTML='';
  $('#reportStrategyCopy').innerHTML='';
  $('#reportEvaluation').textContent='';
  ensureReportLazyObserver();
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>renderVisibleReportLazySections());
  else setTimeout(()=>renderVisibleReportLazySections(),0);
}

function projectedPlayerFromPick(pick){
  const md=pick?.metadata||{},raw=String(md.position||'').toUpperCase();
  const pos=raw==='DST'?'DEF':raw;
  const id=String(pick?.player_id||'');
  return {id,pos,name:sleeperPickName(pick)||id,pts:week1ProjectionData?.get(id)?.pts??null};
}
function projectedLineupForPicks(picks){
  const all=(picks||[]).map(projectedPlayerFromPick).filter(p=>p.pos&&p.pts!=null);
  const pool=all.slice().sort((a,b)=>b.pts-a.pts),starters=[];
  const take=pos=>{const i=pool.findIndex(p=>p.pos===pos);return i<0?null:pool.splice(i,1)[0];};
  const add=(label,p)=>{if(p)starters.push({...p,slot:label});};
  add('QB',take('QB'));add('RB',take('RB'));add('RB',take('RB'));
  add('WR',take('WR'));add('WR',take('WR'));add('WR',take('WR'));
  const fi=pool.findIndex(p=>['RB','WR','TE'].includes(p.pos)); if(fi>=0)add('W/R/T',pool.splice(fi,1)[0]);
  add('K',take('K'));add('DEF',take('DEF'));
  const starterPts=Math.round(starters.reduce((n,p)=>n+p.pts,0)*100)/100;
  const benchPts=Math.round(pool.reduce((n,p)=>n+p.pts,0)*100)/100;
  return {starters,starterPts,benchPts,projected:all.length,missing:9-starters.length};
}
function leagueWeek1ProjectionGrades(){
  if(!week1ProjectionData)return [];
  const teams=(leagueRosters||[]).map(r=>{
    const picks=picksForRoster(r.roster_id),projection=projectedLineupForPicks(picks);
    const owner=leagueUserById(r.owner_id),teamName=String(owner?.metadata?.team_name||'').trim();
    const username=owner?.display_name||owner?.username||String(r.owner_id||`Roster ${r.roster_id}`);
    return {rosterId:String(r.roster_id),teamName:teamName||username,username,projection};
  }).filter(x=>x.projection.projected);
  teams.sort((a,b)=>b.projection.starterPts-a.projection.starterPts);
  const vals=teams.map(x=>x.projection.starterPts),hi=Math.max(...vals),lo=Math.min(...vals);
  return teams.map((x,i)=>{
    const relative=hi===lo?90:72+18*((x.projection.starterPts-lo)/(hi-lo));
    const completeness=Math.max(0,9-x.projection.missing)/9;
    const score=Math.round(Math.max(45,Math.min(100,relative*completeness)));
    return {...x,rank:i+1,score,letter:gradeLetter(score)};
  });
}
function renderWeek1ProjectionReport(){
  const status=$('#reportWeek1Status');if(!status)return;
  if(!week1ProjectionData){
    status.textContent=week1ProjectionError?'Projection data unavailable':'Loading Sleeper projections…';
    $('#reportWeek1StarterPts').textContent='—';$('#reportWeek1Grade').textContent='—';$('#reportWeek1Rank').textContent='—';$('#reportWeek1BenchPts').textContent='—';
    $('#reportWeek1Copy').textContent=week1ProjectionError?`Sleeper Week 1 projections could not be loaded (${week1ProjectionError}). The draft report remains fully available without them.`:`Week 1 projections are kept separate from the draft-process grade and scored using the league's Sleeper scoring settings.`;
    return;
  }
  const league=leagueWeek1ProjectionGrades(),mine=league.find(x=>String(x.rosterId)===String(sleeperCtx.rosterId));
  if(!mine){status.textContent='No projection available';return;}
  status.textContent=`Sleeper Week 1 • UCL scoring • ${mine.projection.projected} players projected`;
  $('#reportWeek1StarterPts').textContent=mine.projection.starterPts.toFixed(2);
  $('#reportWeek1Grade').innerHTML=gradeBadge(mine.letter);
  $('#reportWeek1Rank').textContent=`${mine.rank}/${league.length}`;
  $('#reportWeek1BenchPts').textContent=mine.projection.benchPts.toFixed(2);
  const leader=league[0];
  $('#reportWeek1Copy').textContent=mine.projection.missing>0?`Week 1 projection data is missing for ${mine.projection.missing} required starter slot${mine.projection.missing===1?'':'s'}. This projection grade does not change Draft Value itself; it contributes only to the completed-team overall grade.`:`Your best legal Week 1 lineup projects for ${mine.projection.starterPts.toFixed(2)} points, ranking ${mine.rank} of ${league.length}. ${leader&&leader.rosterId!==mine.rosterId?`${leader.teamName} currently leads at ${leader.projection.starterPts.toFixed(2)}.`:'This is currently the league-high projection.'} Projection strength supplements Draft Value and Roster Construction in the completed-team overall grade.`;
}
async function ensureWeek1ProjectionReport(){
  if(!draftAllowsPostDraftViews())return;
  renderWeek1ProjectionReport();
  try{await syncWeek1Projections(false);}catch(e){}
  renderWeek1ProjectionReport();
  // Projection strength is part of the completed-team grade in v1.8.3.
  // Re-render once after the async projection feed arrives so the overall
  // score and league-relative report use the same information.
  if(week1ProjectionData&&draftAllowsPostDraftViews())renderPostDraftReport();
}

function renderPostDraftReport(){
  const report=$('#postDraftReport'),board=$('#liveDraftBoard');
  if(!report||!board)return;
  const complete=draftAllowsPostDraftViews();
  updateSeasonTabVisibility();
  if(!complete){
    report.hidden=true;board.hidden=false;
    document.body.classList.remove('archived-board');
    const tab=document.querySelector('[data-tab="draft"]');if(tab)tab.textContent='Draft Board';
    renderPostTransitionStatus();
    return;
  }
  report.hidden=false;
  board.hidden=true;
  document.body.classList.remove('archived-board');
  if(document.body.classList.contains('condensed-mode'))setCondensedMode(false);
  const tab=document.querySelector('[data-tab="draft"]');if(tab)tab.textContent='Report Card';

  const g=liveDraftGrade(),eff=capitalEfficiency(g.graded||[]);
  const team=sleeperCtx.teamName||sleeperCtx.username||'My Team';
  $('#reportTeamName').textContent=`${team} — Post-Draft Report Card`;
  $('#reportSubtitle').textContent=`${sleeperCtx.leagueName||'Unmanaged Chaos'} • ${g.graded.length} selections graded`;
  setGradeBadge($('#reportOverallGrade'),g.letter,'report-grade');
  $('#reportOverallScore').textContent=g.score??'—';
  $('#reportValueGrade').innerHTML=g.valueScore==null?'—':`${gradeBadge(gradeLetter(g.valueScore))} <span class="grade-scoreline">${g.valueScore}</span>`;
  $('#reportConstructionGrade').innerHTML=g.constructionScore==null?'—':`${gradeBadge(gradeLetter(g.constructionScore))} <span class="grade-scoreline">${g.constructionScore}</span>`;
  $('#reportEfficiency').textContent=eff==null?'—':eff;

  const leagueGrades=leagueDraftGrades();
  const myLeague=leagueGrades.find(x=>String(x.rosterId)===String(sleeperCtx.rosterId));
  $('#reportLeagueRank').textContent=myLeague?`${myLeague.rank}/${leagueGrades.length}`:'—';

  const steals=(g.graded||[]).filter(x=>x.kind==='steal').sort((a,b)=>b.delta-a.delta);
  $('#reportBestPick').textContent=finalPickName(g.best);
  $('#reportBiggestSteal').textContent=finalPickName(steals[0]||g.best);
  $('#reportBiggestReach').textContent=finalPickName(g.worst);
  $('#reportWorstPick').textContent=g.worst?`${finalPickName(g.worst)} • ${g.worst.ranked?`List #${g.worst.ranked.rank}`:'NOT IN LIST'}`:'—';

  const posGrades=positionalReportGrades();
  $('#reportPositionGrades').innerHTML=posGrades.map(x=>`
    <div class="position-grade"><span>${x.pos}</span><b class="grade-badge ${gradeClass(x.letter)}">${esc(x.letter)}</b><small>${x.score==null?x.detail:`${x.score} • ${x.detail}`}</small></div>`).join('');
  $('#reportPositionCommentary').innerHTML=posGrades.map(x=>`<p><b>${x.pos}:</b> ${esc(x.comment||x.detail)}</p>`).join('');

  const assessment=postDraftAssessment();
  $('#reportRosterAssessment').innerHTML=assessment.map(x=>`<span class="report-tag ${x.kind}">${esc(x.text)}</span>`).join('');
  updateReportLazyContext({grade:g,efficiency:eff,leagueGrades,myLeague,assessment});
  renderPostTransitionStatus();
}
