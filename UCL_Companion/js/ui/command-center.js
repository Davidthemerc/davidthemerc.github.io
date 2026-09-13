function homeWeeklyActionBrief(roster,mineMatch,week=currentWeekNumber(),playerCache=null){
  if(!roster)return [];
  const actions=[];
  const add=(priority,kind,title,detail,tag)=>actions.push({priority,kind,title,detail,tag});
  const lookup=id=>playerCache?.get(String(id))||sleeperRosterPlayer(id);
  const projectionMap=projectionMapForWeek(week);

  // Current-week bye coverage comes first because a starter on bye is directly actionable.
  for(const id of (roster.starters||[]).filter(Boolean)){
    const p=lookup(id);
    if(Number(p?.bye)===Number(week))add(100,'bad',`Cover ${p.name}'s bye`,`${p.pos||'Starter'} is currently in your Week ${week} starting lineup but is on bye.`,'BYE');
  }

  // Bench Analysis: only surface bench players that clear the position-specific starter-replacement threshold.
  if(mineMatch&&projectionMap?.size){
    for(const x of benchThreatAnalysis(roster,mineMatch,week,playerCache).slice(0,2)){
      const pct=Math.round((x.multiplier-1)*100);
      const title=`Consider ${x.player.name} over ${x.starter.player.name}`;
      const detail=`${x.player.name} projects ${x.gap.toFixed(2)} points higher for an eligible ${x.starter.slot} spot, clearing the ${pct}% recommendation threshold.`;
      add(95,'bad',title,detail,'LINEUP');
    }
  }


const needs=waiverNeedProfile(roster,playerCache);
const handledPos=new Set();
for(const need of needs){
  if(handledPos.has(need.pos))continue;
  const alternatives=projectionMap?.size?waiverAvailableForPosition(need.pos,week,1,{healthyFirst:true}):[];
  const best=alternatives[0]||null;
  if(need.kind==='potential'){
    handledPos.add(need.pos);
    const detail=best
      ?`${need.reason}. Questionable designations are precautionary; monitor status. If availability worsens, ${best.player.name} is the current top contingency at ${best.pts.toFixed(2)} projected.`
      :`${need.reason}. Questionable designations are precautionary; monitor status before kickoff.`;
    add(84,'warn',`Potential Problem — ${need.pos} availability`,detail,'MONITOR');
  }else if(need.severity>=4){
    handledPos.add(need.pos);
    if(best){
      add(90,'bad',`Address ${need.pos} depth: ${best.player.name}`,`${need.reason}. Top available ${need.pos}: ${best.pts.toFixed(2)} projected this week.`,'WAIVER');
    }else{
      add(82,'warn',`Explore a trade for ${need.pos}`,`${need.reason}. No suitable projected ${need.pos} waiver alternative is currently loaded.`,'TRADE');
    }
  }
}

  // A positive near-parity add/drop is useful even when the position is not a major emergency.
  if(projectionMap?.size){
    const upgrades=waiverPercentageSuggestions(roster,week,playerCache)
      .filter(x=>x.delta>0.05&&!handledPos.has(x.pos))
      .sort((a,b)=>b.delta-a.delta);
    for(const x of upgrades.slice(0,2)){
      handledPos.add(x.pos);
      const detail=x.healthEmergency
        ?`${x.add.player.name} is the top available ${x.pos} while injuries have pushed usable ${x.pos} depth below the acceptable level; the normal percentage threshold is waived.`
        :`${x.add.player.name} projects ${x.delta.toFixed(2)} points above ${x.compare.player.name} (${x.compare.starter?'starter':'bench'}), clearing the ${Math.round((x.multiplier-1)*100)}% waiver threshold.`;
      add(x.compare.starter?78:68,'warn',`Waiver upgrade: ${x.add.player.name}`,detail,'WAIVER');
    }
  }

  // Lower-severity structural holes still matter, but only after lineup/bye/major-need actions.
  for(const need of needs){
    if(need.severity<2||need.severity>=4||handledPos.has(need.pos))continue;
    handledPos.add(need.pos);
    add(55,'warn',`Strengthen ${need.pos} depth`,need.reason,'DEPTH');
  }

  const seen=new Set();
  return actions.sort((a,b)=>b.priority-a.priority).filter(x=>{
    const key=`${x.tag}|${x.title}`;
    if(seen.has(key))return false;
    seen.add(key);return true;
  }).slice(0,5);
}

function renderCompanionHome(){
  const view=$('#homeView');if(!view)return;
  setHomeCardCompact('homeRecommendations',false);
  setHomeCardCompact('homeRecentPicks',false);
  const connected=!!sleeperCtx.username,complete=draftAllowsPostDraftViews(),hasPicks=lastDraftPicks.length>0;
  const phase=$('#homePhase');
  phase.classList.remove('live','complete');
  if(complete){phase.textContent='SEASON';phase.classList.add('complete');}
  else if(hasPicks){phase.textContent='LIVE DRAFT';phase.classList.add('live');}
  else phase.textContent='PRE-DRAFT';
  configureHomeForPhase(connected,complete,hasPicks);

  const team=sleeperCtx.teamName||sleeperCtx.username||'Your Team';
  $('#homeTitle').textContent=connected?(complete?`${team} Command Center`:`${team} Companion`):'UCL Command Center';
  $('#homeSub').textContent=connected
    ?`${sleeperCtx.leagueName||'Unmanaged Chaos'} • ${complete?`Week ${currentWeekNumber()} season command`:hasPicks?'Live draft intelligence and league context':'Pre-draft rankings and roster planning'}`
    :'Select your Sleeper team to load the league.';

  if(!connected){
    $('#homeFocusTitle').textContent='Get Started';
    $('#homeFocusValue').textContent='Select your Sleeper team';
    $('#homeFocusDetail').textContent='Choose your team above to load your league view.';
    $('#homeFocusMini').innerHTML='';
    $('#homeRecTitle').textContent='Draft Rankings';
    $('#homeRecommendations').innerHTML='<div class="empty">Connect Sleeper to personalize recommendations.</div>';
    $('#homeGradeTitle').textContent='My Team';
    $('#homeGrade').textContent='—';$('#homeGrade').className='home-grade';
    $('#homeGradeScore').textContent='—';$('#homeGradeDetail').textContent='No team selected.';$('#homeRosterStatus').innerHTML='';
    $('#homeRecentTitle').textContent='Recent Picks';$('#homeRecentPicks').innerHTML='<div class="empty">No live draft data.</div>';
    $('#homeThreatTitle').textContent='Team Analysis';$('#homeThreats').innerHTML='<div class="empty">No team selected.</div>';
    $('#homeLeagueTitle').textContent='League Snapshot';$('#homeLeagueSnapshot').innerHTML='<div class="empty">Connect Sleeper to load the league.</div>';
    $('#homeLastSync').textContent='Waiting for Sleeper';
    return;
  }

  if(!complete){
    const turn=liveDraftTurnState(),best=bestAvailableForMe(3),g=liveDraftGrade();
    $('#homeFocusTitle').textContent=hasPicks?'Your Next Pick':'Draft Ready';
    $('#homeFocusValue').textContent=turn.label;
    const specialist=specialistEndgameState();
    $('#homeFocusDetail').textContent=best[0]
      ?`#${best[0].player.rank} ${best[0].player.name} (${best[0].player.posRank}) is the current top recommendation.`
      :specialist.forced
        ?`Reserve the remaining roster slot${specialist.remaining===1?'':'s'} for ${specialist.missing.join(' + ')}.`
        :'Waiting for player data.';
    $('#homeFocusMini').innerHTML=homeRosterWarnings().map(x=>`<span class="${x.k}">${esc(x.t)}</span>`).join('');

    $('#homeRecTitle').textContent='Best Available for Me';
    $('#homeRecommendations').innerHTML=best.length
      ?best.map((x,i)=>`<div class="home-rec"><span class="num">${i+1}</span><div><b>${esc(x.player.name)}</b><small>#${x.player.rank} • ${esc(x.player.posRank)} • ${esc(x.needState)}</small></div><span class="score">${x.score}</span></div>`).join('')
      :specialist.forced
        ?`<div class="empty">Final roster requirement: ${esc(specialist.missing.join(' + '))}.</div>`
        :'<div class="empty">No ranked players available.</div>';

    $('#homeGradeTitle').textContent='Live Draft Grade';
    $('#homeGrade').textContent=g.letter||'—';$('#homeGrade').className=`home-grade ${gradeClass(g.letter)}`;
    $('#homeGradeScore').textContent=g.score??'—';
    const liveLeagueContext=relativeLeagueDraftGradeContext();
    $('#homeGradeDetail').textContent=liveLeagueContext
      ?`${g.graded?.length||0} selections • ${ordinal(liveLeagueContext.overall.rank)} of ${liveLeagueContext.overall.total} in league`
      :`${g.graded?.length||0} selections graded`;
    $('#homeRosterStatus').innerHTML=`<span>${myRosterProfile().total} players</span><span>${g.valueScore??'—'} value</span><span>${g.constructionScore??'—'} construction</span>`;

    const recents=homeRecentRows();
    $('#homeRecentTitle').textContent='Recent Picks';
    $('#homeRecentPicks').innerHTML=recents.length?recents.map(x=>`<div class="home-list-row"><span>${esc(x.pick)}</span><b>${esc(x.name)}</b><small>${esc(x.by)}</small></div>`).join(''):'<div class="empty">No picks yet.</div>';

    const threats=homeThreatRows();
    $('#homeThreatTitle').textContent='Threats Before Your Pick';
    $('#homeThreats').innerHTML=threats.length?threats.map(x=>`<div class="home-list-row"><span>#${x.pick}</span><b>${esc(x.name)} • ${esc(x.positions)}</b><small class="${x.level==='high'?'risk-high':x.level==='medium'?'risk-med':'risk-low'}">${esc(x.label)}</small></div>`).join(''):'<div class="empty">No managers currently threaten your next turn.</div>';

    const league=homeLeagueRows();
    $('#homeLeagueTitle').textContent='League Draft Leaders';
    $('#homeLeagueSnapshot').innerHTML=league.length?league.map((x,i)=>`<div class="home-list-row"><span>${i+1}</span><b>${esc(x.name)}</b><small>${x.grade} • ${x.score}</small></div>`).join(''):'<div class="empty">No league grades yet.</div>';
  }else{
    const g=liveDraftGrade();
    const roster=leagueRosters.find(r=>String(r.roster_id)===String(sleeperCtx.rosterId));
    const homeWeek=currentWeekNumber();
    const matchup=matchupForRoster(sleeperCtx.rosterId,homeWeek);
    const oppRoster=matchup.opp?leagueRosters.find(r=>String(r.roster_id)===String(matchup.opp.roster_id)):null;
    const standings=homeSeasonStandings();
    const standing=standings.find(x=>String(x.rosterId)===String(sleeperCtx.rosterId));
    // One render-scoped player cache is shared by roster warnings and waiver-need analysis.
    // Command Center must not resolve the same roster metadata repeatedly just to paint adjacent cards.
    const homePlayerCache=new Map();
    if(roster)for(const id of roster.players||[])homePlayerCache.set(String(id),sleeperRosterPlayer(id));
    const warnings=roster?seasonWarnings(roster,homePlayerCache):[];
    const homeRecord=roster?rosterRecord(roster):'—';

    $('#homeFocusTitle').textContent='This Week';
    if(matchup.mine&&matchup.opp&&oppRoster){
      const scoring=matchupScoringContext(roster,oppRoster,matchup.mine,matchup.opp,homeWeek);
      if(scoring.projected||scoring.started){
        $('#homeFocusValue').textContent=scoring.started?`${matchupScoreText(scoring,'my')} – ${matchupScoreText(scoring,'opp')}`:`${scoring.myTotal.toFixed(2)} – ${scoring.oppTotal.toFixed(2)}`;
        $('#homeFocusDetail').textContent=scoring.projected
          ?`Week ${homeWeek} ${uclMatchupNotation(homeWeek,roster.roster_id,rosterUserName(oppRoster))} • projected ${scoring.diff>0?`edge +${scoring.diff.toFixed(2)}`:scoring.diff<0?`deficit ${Math.abs(scoring.diff).toFixed(2)}`:'tie'}.`
          :`Week ${homeWeek} ${uclMatchupNotation(homeWeek,roster.roster_id,rosterUserName(oppRoster))} • ${scoring.diff>0?`leading by ${scoring.diff.toFixed(2)}`:scoring.diff<0?`trailing by ${Math.abs(scoring.diff).toFixed(2)}`:'tied'}.`;
      }else{
        $('#homeFocusValue').textContent=`Week ${homeWeek}`;
        $('#homeFocusDetail').textContent=`${uclMatchupNotation(homeWeek,roster.roster_id,rosterUserName(oppRoster))} • pregame projections are loading.`;
      }
    }else{
      $('#homeFocusValue').textContent=`Week ${currentWeekNumber()}`;
      $('#homeFocusDetail').textContent='Your matchup will appear here when Sleeper posts it.';
    }
    $('#homeFocusMini').innerHTML=`${matchup.mine?uclVenuePill(homeWeek,matchup.mine.roster_id):''}<span>${esc(homeRecord)}</span>${standing?`<span class="good">#${standing.rank} in league</span>`:''}${warnings.length?`<span class="${warnings.some(x=>x.kind==='bad')?'bad':'warn'}">${warnings.length} roster note${warnings.length===1?'':'s'}</span>`:'<span class="good">Roster covered</span>'}`;

    $('#homeRecTitle').textContent='Weekly Action Brief';
    const actions=homeWeeklyActionBrief(roster,matchup.mine,homeWeek,homePlayerCache);
    $('#homeRecommendations').innerHTML=actions.length?actions.map((a,i)=>`<div class="home-rec"><span class="num">${i+1}</span><div><b>${esc(a.title)}</b><small>${esc(a.detail)}</small></div><span class="score ${a.kind}">${esc(a.tag)}</span></div>`).join(''):'<div class="empty">No active suggestions this week.</div>';
    setHomeCardCompact('homeRecommendations',!actions.length);

    $('#homeGradeTitle').textContent='League Position';
    $('#homeGrade').textContent=standing?`#${standing.rank}`:'—';$('#homeGrade').className='home-grade';
    $('#homeGradeScore').textContent=homeRecord;
    $('#homeGradeDetail').textContent=standing?`${Number(standing.pf||0).toFixed(2)} points for`:'Standings loading';
    $('#homeRosterStatus').innerHTML=`<span>${roster?.players?.length||0} players</span><span>Draft ${g.letter||'—'}</span><span>${g.score??'—'} draft score</span>`;

    const news=homeNewsRows();
    $('#homeRecentTitle').textContent='CTESPN Headlines';
    $('#homeRecentPicks').innerHTML=news.length?news.map(x=>`<div class="home-list-row"><span>${x.week?`W${x.week}`:'NOW'}</span><b>${esc(x.headline)}</b><small>${esc(x.category)}</small></div>`).join(''):'<div class="empty">No major league story yet.</div>';
    setHomeCardCompact('homeRecentPicks',!news.length);

    $('#homeThreatTitle').textContent='Roster Watch';
    $('#homeThreats').innerHTML=warnings.length?warnings.slice(0,4).map(x=>{
      const badge=x.healthState==='potential'?'POTENTIAL':x.kind==='bad'?'ACTION':x.kind==='warn'?'MONITOR':'OK';
      return `<div class="home-list-row"><span>•</span><b>${esc(x.text)}</b><small class="${x.kind==='bad'?'risk-high':x.kind==='warn'?'risk-med':'risk-low'}">${esc(badge)}</small></div>`;
    }).join(''):'<div class="empty">No roster warning right now.</div>';

    $('#homeLeagueTitle').textContent='Standings';
    $('#homeLeagueSnapshot').innerHTML=standings.slice(0,4).map(r=>`<div class="home-list-row"><span>${r.rank}</span><b>${esc(r.name)}</b><small>${r.wins}-${r.losses}${r.ties?`-${r.ties}`:''}</small></div>`).join('');
  }

  $('#homeLastSync').textContent=seasonDataMeta.lastSync&&complete
    ?`Synced ${new Date(seasonDataMeta.lastSync).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`
    :'Sleeper connected';
}

function snapshotUserPreferences(){
  const out={};
  for(const key of USER_PREFERENCE_KEYS){
    const value=storageGet(key,null);
    if(value!==null)out[key]=value;
  }
  return out;
}
function restoreUserPreferences(snapshot){
  for(const key of USER_PREFERENCE_KEYS)storageRemove(key);
  for(const [key,value] of Object.entries(snapshot||{}))storageSet(key,value);
}
function appStorageKeys(){
  const keys=[];
  try{
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key&&key.startsWith(KEY))keys.push(key);
    }
  }catch(e){}
  return keys;
}
function clearNonPreferenceAppStorage(){
  const keep=new Set(USER_PREFERENCE_KEYS);
  appStorageKeys().filter(key=>!keep.has(key)).forEach(storageRemove);
}

function recommendationDetailMode(){
  const mode=storageGet(REC_DETAIL_KEY,'full');
  return ['full','concise','minimal'].includes(mode)?mode:'full';
}
function boardDensityMode(){
  return storageGet(BOARD_DENSITY_KEY,'compact')==='comfortable'?'comfortable':'compact';
}
function applyDraftPreferenceClasses(){
  const rec=recommendationDetailMode(),density=boardDensityMode();
  document.body.classList.toggle('rec-detail-concise',rec==='concise');
  document.body.classList.toggle('rec-detail-minimal',rec==='minimal');
  document.body.classList.toggle('board-density-comfortable',density==='comfortable');
}
function setRecommendationDetailMode(mode){
  const clean=['full','concise','minimal'].includes(mode)?mode:'full';
  storageSet(REC_DETAIL_KEY,clean);applyDraftPreferenceClasses();
  if($('#draftView')?.classList.contains('active'))renderDraftIntelligence();
}
function setBoardDensityMode(mode){
  const clean=mode==='comfortable'?'comfortable':'compact';
  storageSet(BOARD_DENSITY_KEY,clean);applyDraftPreferenceClasses();
}
