function playoffTeamCount(){
  const n=Number(verifiedLeague?.settings?.playoff_teams||0);
  if(n>0)return n;
  return Math.max(2,Math.floor((leagueRosters||[]).length/2));
}
function playoffStartWeek(){
  const w=Number(verifiedLeague?.settings?.playoff_week_start||0);
  return w>0?w:15;
}
function regularSeasonGamesRemaining(){
  return futureRegularSeasonWeeks().length;
}
function historicalRecordThrough(rosterId,maxWeek){
  let wins=0,losses=0,ties=0,pf=0;
  for(const [wk,list] of Object.entries(seasonMatchupsByWeek||{})){
    const week=Number(wk);
    if(week>maxWeek)continue;
    const mine=(list||[]).find(m=>String(m.roster_id)===String(rosterId));
    if(!mine||mine.matchup_id==null)continue;
    const opp=(list||[]).find(m=>String(m.matchup_id)===String(mine.matchup_id)&&String(m.roster_id)!==String(rosterId));
    if(!opp)continue;
    const myPts=Number(mine.points||0),oppPts=Number(opp.points||0);
    pf+=myPts;
    if(myPts>oppPts)wins++; else if(myPts<oppPts)losses++; else ties++;
  }
  return {wins,losses,ties,pf};
}
function standingsOrderFromRecords(rows){
  return rows.slice().sort((a,b)=>
    b.wins-a.wins ||
    a.losses-b.losses ||
    b.pf-a.pf ||
    String(a.name).localeCompare(String(b.name))
  );
}
function previousStandingsRanks(){
  const through=Math.max(0,currentWeekNumber()-1);
  if(through<1)return {};
  const rows=(leagueRosters||[]).map(r=>{
    const h=historicalRecordThrough(r.roster_id,through);
    return {rosterId:String(r.roster_id),name:rosterUserName(r),wins:h.wins,losses:h.losses,ties:h.ties,pf:h.pf};
  });
  const ordered=standingsOrderFromRecords(rows);
  return Object.fromEntries(ordered.map((r,i)=>[r.rosterId,i+1]));
}
function playoffMathStatus(row,allRows,slots,remaining){
  const maxWins=row.wins+remaining;
  const others=allRows.filter(x=>x.rosterId!==row.rosterId);

  // Conservative math only: ties/tiebreakers are treated against the team.
  const teamsAbleToTieOrBeat=others.filter(x=>x.wins+remaining>=row.wins).length;
  const teamsAlreadyBeyondMax=others.filter(x=>x.wins>maxWins).length;
  const clinched=teamsAbleToTieOrBeat<slots;
  const eliminated=teamsAlreadyBeyondMax>=slots;

  if(clinched)return {kind:'clinched',label:'CLINCHED'};
  if(eliminated)return {kind:'eliminated',label:'ELIMINATED'};
  if(row.rank<=slots)return {kind:'in',label:'IN'};
  if(row.rank<=slots+2)return {kind:'bubble',label:'BUBBLE'};
  return {kind:'out',label:'OUT'};
}

function futureRegularSeasonWeeks(){
  const current=currentWeekNumber();
  const start=current<playoffStartWeek()?current:playoffStartWeek();
  const end=playoffStartWeek()-1,out=[];
  for(let w=start;w<=end;w++){
    if(!isWeekFinalForHistory(w))out.push(w);
  }
  return out;
}

let remainingScheduleLoadPromise=null;
async function ensureRemainingRegularSeasonSchedule(){
  const weeks=futureRegularSeasonWeeks().filter(w=>!Array.isArray(seasonMatchupsByWeek?.[w])||seasonMatchupsByWeek[w].length===0);
  if(!weeks.length)return {loaded:0,failed:0};
  if(remainingScheduleLoadPromise)return remainingScheduleLoadPromise;
  remainingScheduleLoadPromise=(async()=>{
    let loaded=0,failed=0;
    const results=await Promise.all(weeks.map(async week=>{
      const r=await sleeperGetSafe(`/league/${SLEEPER_LEAGUE_ID}/matchups/${week}`,{
        ttlMs:6*60*60*1000,force:false,fallback:seasonMatchupsByWeek?.[week]||[],label:`Week ${week} schedule`
      });
      return {week,...r};
    }));
    for(const r of results){
      if(r.ok&&Array.isArray(r.value)&&r.value.length){
        seasonMatchupsByWeek[r.week]=dedupeMatchupList(r.value);
        loaded++;
      }else failed++;
    }
    if(loaded){
      persistRuntimeCache();
      renderPlayoffMachine();
      renderStandingsAndPlayoffRace();
    }
    return {loaded,failed};
  })().finally(()=>{remainingScheduleLoadPromise=null;});
  return remainingScheduleLoadPromise;
}

function matchupForRosterInWeek(rosterId,week){
  const list=seasonMatchupsByWeek?.[week]||[];
  const mine=list.find(m=>String(m.roster_id)===String(rosterId));
  if(!mine||mine.matchup_id==null)return {mine:null,opp:null};
  const opp=list.find(m=>String(m.matchup_id)===String(mine.matchup_id)&&String(m.roster_id)!==String(rosterId));
  return {mine,opp};
}
function remainingScheduleFor(rosterId){
  return futureRegularSeasonWeeks().map(week=>{
    const {mine,opp}=matchupForRosterInWeek(rosterId,week);
    if(!mine||!opp)return {week,oppRoster:null,opp:null};
    return {week,opp,oppRoster:leagueRosters.find(r=>String(r.roster_id)===String(opp.roster_id))};
  });
}
function baseStandingsRows(){
  return (leagueRosters||[]).map(r=>({
    roster:r,rosterId:String(r.roster_id),name:rosterUserName(r),
    wins:Number(r.settings?.wins||0),losses:Number(r.settings?.losses||0),ties:Number(r.settings?.ties||0),
    pf:rosterPointsFor(r)
  }));
}
function playoffScenarioRows(){
  const rows=baseStandingsRows();
  const myId=String(sleeperCtx.rosterId||'');
  const mine=rows.find(r=>r.rosterId===myId);
  if(!mine)return rows;
  for(const item of remainingScheduleFor(myId)){
    const outcome=playoffScenarioOutcomes[item.week]||'tbd';
    if(outcome==='win')mine.wins++;
    else if(outcome==='loss')mine.losses++;
  }
  const ordered=standingsOrderFromRecords(rows);
  ordered.forEach((r,i)=>r.rank=i+1);
  return ordered;
}
function playoffSeedRange(rosterId){
  const rows=baseStandingsRows(),me=rows.find(r=>r.rosterId===String(rosterId));
  if(!me)return {best:null,worst:null};
  const rem=futureRegularSeasonWeeks().length;
  const bestWins=me.wins+rem,worstWins=me.wins;
  const others=rows.filter(r=>r.rosterId!==me.rosterId);
  const best=1+others.filter(r=>r.wins>bestWins).length;
  const worst=1+others.filter(r=>r.wins+rem>=worstWins).length;
  return {best:Math.min(rows.length,best),worst:Math.min(rows.length,worst),bestWins,worstWins};
}
function playoffRootingGuide(){
  const rows=baseStandingsRows();
  const mine=rows.find(r=>r.rosterId===String(sleeperCtx.rosterId));
  if(!mine)return [];
  const slots=playoffTeamCount();
  const out=[];
  for(const r of rows){
    if(r.rosterId===mine.rosterId)continue;
    const currentRank=standingsOrderFromRecords(rows).findIndex(x=>x.rosterId===r.rosterId)+1;
    if(currentRank<=slots && r.wins>=mine.wins){
      out.push({kind:'good',team:r.name,text:`Root against ${r.name}: they currently occupy a playoff position and have ${r.wins} wins.`});
    }else if(currentRank===slots+1 || Math.abs(r.wins-mine.wins)<=1){
      out.push({kind:'warn',team:r.name,text:`Watch ${r.name}: they are near your current win total / playoff bubble.`});
    }
  }
  return out.slice(0,6);
}
function setPlayoffOutcome(week,outcome){
  playoffScenarioOutcomes[Number(week)]=outcome;
  renderPlayoffMachine();
}
function renderPlayoffMachine(){
  const summary=$('#playoffMachineSummary'),schedule=$('#playoffScheduleList'),result=$('#playoffScenarioResult'),rooting=$('#playoffRootingList'),status=$('#playoffMachineStatus');
  if(!summary||!schedule||!result||!rooting)return;
  const myId=String(sleeperCtx.rosterId||'');
  const mine=leagueRosters.find(r=>String(r.roster_id)===myId);
  if(!mine){
    summary.innerHTML='';schedule.innerHTML='<div class="empty">Select your Sleeper team.</div>';result.innerHTML='<div class="empty">No scenario available.</div>';rooting.innerHTML='';return;
  }

  const slots=playoffTeamCount(),remaining=futureRegularSeasonWeeks().length,range=playoffSeedRange(myId);
  const currentRows=standingsOrderFromRecords(baseStandingsRows());currentRows.forEach((r,i)=>r.rank=i+1);
  const current=currentRows.find(r=>r.rosterId===myId);
  const baseStatus=playoffMathStatus(current,currentRows,slots,remaining);

  summary.innerHTML=`
    <span><b>#${current?.rank||'—'}</b> current seed</span>
    <span><b>${range.best??'—'}–${range.worst??'—'}</b> mathematical seed range</span>
    <span><b>${remaining}</b> games remaining</span>
    <span><b>${baseStatus.label}</b> current playoff status</span>`;
  if(status)status.textContent=`${slots} playoff spots • playoffs Week ${playoffStartWeek()}`;

  const games=remainingScheduleFor(myId);
  if(!games.length){
    schedule.innerHTML='<div class="empty">No remaining regular-season weeks are available.</div>';
  }else{
    schedule.innerHTML=games.map(g=>{
      const currentChoice=playoffScenarioOutcomes[g.week]||'tbd';
      return `<div class="playoff-game">
        <span class="pg-week">Week ${g.week}</span>
        <b>${g.oppRoster?`vs ${esc(rosterUserName(g.oppRoster))}`:'Schedule not loaded'}</b>
        <div class="playoff-outcome">
          <button type="button" class="${currentChoice==='win'?'active win':''}" data-playoff-week="${g.week}" data-playoff-outcome="win">W</button>
          <button type="button" class="${currentChoice==='loss'?'active loss':''}" data-playoff-week="${g.week}" data-playoff-outcome="loss">L</button>
          <button type="button" class="${currentChoice==='tbd'?'active tbd':''}" data-playoff-week="${g.week}" data-playoff-outcome="tbd">?</button>
        </div>
      </div>`;
    }).join('');
  }

  const projected=playoffScenarioRows();
  const myProj=projected.find(r=>r.rosterId===myId);
  const chosen=games.filter(g=>(playoffScenarioOutcomes[g.week]||'tbd')!=='tbd').length;
  const projectedStatus=playoffMathStatus(myProj,projected,slots,Math.max(0,remaining-chosen));
  result.innerHTML=`<div class="psr-kicker">SCENARIO RESULT</div>
    <b>Projected #${myProj?.rank||'—'} • ${myProj?.wins||0}-${myProj?.losses||0}</b>
    <p>${chosen?`${chosen} of ${remaining} remaining outcome${remaining===1?'':'s'} selected.`:'Choose W/L outcomes to model your path.'} Current scenario status: ${projectedStatus.label}. Other teams keep their current projected results.</p>
    <div class="playoff-scenario-table">${projected.slice(0,Math.min(6,projected.length)).map(r=>`<div class="playoff-scenario-row"><span>#${r.rank}</span><b>${esc(r.name)}</b><span>${r.wins}-${r.losses}</span></div>`).join('')}</div>`;

  const guide=playoffRootingGuide();
  rooting.innerHTML=guide.length?guide.map(x=>`<div class="rooting-card ${x.kind}"><b>${esc(x.team)}</b><small>${esc(x.text)}</small></div>`).join(''):'<div class="empty">No obvious rooting priority yet.</div>';
}
function renderStandingsAndPlayoffRace(){
  const list=$('#standingsList'),summary=$('#playoffRaceSummary'),note=$('#playoffRaceNote'),noteHead=$('#standingsNote');
  if(!list||!summary||!note)return;

  const previous=previousStandingsRanks();
  const rows=(leagueRosters||[]).map(r=>{
    const s=r.settings||{};
    return {
      roster:r,rosterId:String(r.roster_id),name:rosterUserName(r),
      wins:Number(s.wins||0),losses:Number(s.losses||0),ties:Number(s.ties||0),
      pf:rosterPointsFor(r)
    };
  });
  const ordered=standingsOrderFromRecords(rows);
  ordered.forEach((r,i)=>r.rank=i+1);

  const slots=playoffTeamCount(),remaining=regularSeasonGamesRemaining();
  const leader=ordered[0]||null;
  const cutoff=ordered[Math.min(slots-1,Math.max(0,ordered.length-1))]||null;
  const cutoffWins=cutoff?.wins||0;

  let clinched=0,eliminated=0;
  ordered.forEach(r=>{
    r.status=playoffMathStatus(r,ordered,slots,remaining);
    if(r.status.kind==='clinched')clinched++;
    if(r.status.kind==='eliminated')eliminated++;
    r.gb=leader?Math.max(0,(leader.wins-r.wins)+((r.losses-leader.losses)*0.5)):0;
  });

  summary.innerHTML=`
    <span><b>${slots}</b> playoff spots</span>
    <span><b>${remaining}</b> regular-season game${remaining===1?'':'s'} left</span>
    <span><b>${clinched}</b> clinched</span>
    <span><b>${eliminated}</b> eliminated</span>
    <span><b>${cutoffWins}</b> wins at current cutoff</span>`;

  if(noteHead)noteHead.textContent=`${slots} playoff spots • playoffs Week ${playoffStartWeek()}`;

  list.innerHTML=ordered.map((r,i)=>{
    const me=r.rosterId===String(sleeperCtx.rosterId);
    const prev=previous[r.rosterId];
    const movement=prev?prev-r.rank:0;
    const moveText=!prev?'—':movement>0?`▲ ${movement}`:movement<0?`▼ ${Math.abs(movement)}`:'—';
    const moveClass=movement>0?'up':movement<0?'down':'even';
    const lineClass=r.rank===slots?'playoff-line':'';
    const gb=r.rank===1?'—':r.gb.toFixed(1).replace('.0','');
    return `<div class="standing-row ${me?'me':''} ${lineClass}">
      <div class="standing-rank">${r.rank}</div>
      <div class="standing-team"><b>${esc(r.name)}</b><small>${me?'YOUR TEAM • ':''}${r.pf.toFixed(2)} PF</small></div>
      <div class="standing-record">${r.wins}-${r.losses}${r.ties?`-${r.ties}`:''}</div>
      <div class="standing-pf">${r.pf.toFixed(1)}</div>
      <div class="standing-gb">${gb}</div>
      <div class="standing-move ${moveClass}">${moveText}</div>
      <div><span class="playoff-status ${r.status.kind}">${r.status.label}</span></div>
    </div>`;
  }).join('');

  note.textContent=`Playoff status is intentionally conservative. “Clinched” means the team cannot fall below the top ${slots} by wins even if all remaining results break against it; “Eliminated” means at least ${slots} teams already have more wins than that team can still reach. Sleeper tiebreakers are not assumed here.`;
}


const ACHIEVEMENTS_ENABLED=false;
const UCL_HISTORY_SOURCE_KEY=KEY+'-league-history-source-v1';
let uclHistorySource=null;
const UCL_ACHIEVEMENTS=[
  {id:'skin',title:'BY THE SKIN OF YOUR TEETH',visible:true,mode:'auto',desc:'First manager to win a game by less than 1.00 point.'},
  {id:'task_failed',title:'TASK FAILED SUCCESSFULLY',visible:true,mode:'auto',desc:'First manager to win while starting a player who scores exactly 0.00.'},
  {id:'bench_30',title:'YOU LEFT HIM WHERE?!',visible:true,mode:'auto',desc:'First manager to leave a 30+ point scorer on the bench.'},
  {id:'escape_artist',title:'ESCAPE ARTIST',visible:true,mode:'auto',desc:'First manager to collect three wins in the season by fewer than 5 points each.'},
  {id:'broom',title:'GET THE BROOM',visible:true,mode:'auto',desc:'First manager to defeat the same opponent twice during the regular season.'},
  {id:'took_personally',title:'TOOK THAT PERSONALLY',visible:true,mode:'auto',desc:'After losing to an opponent, beat that same opponent in the next meeting while scoring 30+ more points than them.'},
  {id:'wrong_history',title:'WRONG SIDE OF HISTORY',visible:true,mode:'auto',desc:'First top-4 team after Week 3 to lose to the last-place team.'},
  {id:'alive',title:'SOMEHOW WE’RE ALIVE',visible:true,mode:'auto',desc:'First manager to win while scoring at least 15 points below the league median that week.'},
  {id:'quality_start',title:'QUALITY START',visible:false,mode:'auto',desc:'First manager to win while three starters score fewer than 5 points each.'},
  {id:'thanks_nothing',title:'THANKS FOR NOTHING',visible:false,mode:'manual',desc:'Drop a player, then have that player score 25+ in their next game.'},
  {id:'cleaning_house',title:'CLEANING HOUSE',visible:false,mode:'manual',desc:'Drop at least three players in the same week.'},
  {id:'panic_button',title:'PANIC BUTTON',visible:false,mode:'manual',desc:'Start a player less than 24 hours after adding them.'},
  {id:'drew_it_up',title:'JUST LIKE WE DREW IT UP',visible:false,mode:'manual',desc:'Win after two intended starters are ruled out.'},
  {id:'without_you',title:'WE WON WITHOUT YOU',visible:false,mode:'manual',desc:'Win while a star is out and the replacement outscores them.'}
];

function loadManualAchievements(){
  try{return storageGetJson(ACHIEVEMENT_MANUAL_KEY,{})||{};}catch(e){return {};}
}
function saveManualAchievements(v){storageSetJson(ACHIEVEMENT_MANUAL_KEY,v||{});}
function achievementTeamName(rosterId){
  const r=leagueRosters.find(x=>String(x.roster_id)===String(rosterId));
  return r?rosterUserName(r):`Roster ${rosterId}`;
}
function finalizedWeeksAsc(){
  return Object.keys(seasonMatchupsByWeek||{}).map(Number).filter(w=>isWeekFinalForHistory(w)&&(seasonMatchupsByWeek[w]||[]).length).sort((a,b)=>a-b);
}
function weeklyRosterEntry(week,rosterId){
  return (seasonMatchupsByWeek?.[week]||[]).find(m=>String(m.roster_id)===String(rosterId))||null;
}
function weeklyOpponentEntry(week,entry){
  if(!entry)return null;
  return (seasonMatchupsByWeek?.[week]||[]).find(m=>String(m.matchup_id)===String(entry.matchup_id)&&String(m.roster_id)!==String(entry.roster_id))||null;
}
function standingsRankEnteringWeek(week){
  if(week<=1)return {};
  return weeklyRankMap(week-1);
}
function teamRecordToWeek(rosterId,week){
  const h=historicalRecordThrough(rosterId,week);
  return h;
}
function autoAchievementCandidates(){
  const candidates={};
  const add=(id,week,rosterId,detail)=>{(candidates[id]??=[]).push({week,rosterId:String(rosterId),detail});};

  const closeWins={};
  const meetings={};
  for(const week of finalizedWeeksAsc()){
    const list=seasonMatchupsByWeek[week]||[];
    const median=weeklyMedianScore(week);
    const entering=standingsRankEnteringWeek(week);
    const orderedEntering=Object.entries(entering).sort((a,b)=>a[1]-b[1]);
    const lastRosterId=orderedEntering.length?orderedEntering[orderedEntering.length-1][0]:null;

    const seen=new Set();
    for(const entry of list){
      if(entry.matchup_id==null||seen.has(String(entry.matchup_id)))continue;
      const opp=weeklyOpponentEntry(week,entry); if(!opp)continue;
      seen.add(String(entry.matchup_id));
      const aPts=Number(entry.points||0),bPts=Number(opp.points||0);
      if(Math.abs(aPts-bPts)<.0001)continue;
      const winner=aPts>bPts?entry:opp,loser=aPts>bPts?opp:entry;
      const winPts=Math.max(aPts,bPts),losePts=Math.min(aPts,bPts),margin=winPts-losePts;
      const wid=String(winner.roster_id),lid=String(loser.roster_id);

      if(margin<1)add('skin',week,wid,`Won by ${margin.toFixed(2)} over ${achievementTeamName(lid)}.`);

      const winnerStarters=(winner.starters||[]).filter(Boolean);
      const zeroStarters=winnerStarters.filter(id=>Math.abs(matchupPlayerPoints(winner,id))<.005);
      if(zeroStarters.length)add('task_failed',week,wid,`Won with ${zeroStarters.length} starter${zeroStarters.length===1?'':'s'} at 0.00.`);

      const lowStarters=winnerStarters.filter(id=>matchupPlayerPoints(winner,id)<5);
      if(lowStarters.length>=3)add('quality_start',week,wid,`Won with ${lowStarters.length} starters under 5 points.`);

      if(winPts<=median-15)add('alive',week,wid,`Won with ${winPts.toFixed(2)} points; weekly median was ${median.toFixed(2)}.`);

      closeWins[wid]??=[];
      if(margin<5){
        closeWins[wid].push({week,margin});
        if(closeWins[wid].length===3)add('escape_artist',week,wid,`Third sub-5-point win of the season (${margin.toFixed(2)} margin).`);
      }

      const pair=[wid,lid].sort().join('|');
      meetings[pair]??=[];
      meetings[pair].push({week,winner:wid,loser:lid,winnerPts:winPts,loserPts:losePts});
      const teamWins=meetings[pair].filter(x=>x.winner===wid);
      if(teamWins.length===2)add('broom',week,wid,`Second regular-season win over ${achievementTeamName(lid)}.`);

      if(meetings[pair].length>=2){
        const prev=meetings[pair][meetings[pair].length-2];
        if(prev.winner===lid && prev.loser===wid && winPts-losePts>=30){
          add('took_personally',week,wid,`Avenged the prior loss by beating ${achievementTeamName(lid)} by ${(winPts-losePts).toFixed(2)}.`);
        }
      }

      if(week>3 && lastRosterId){
        const top4=Number(entering[wid]||99)<=4;
        if(top4 && lid===String(lastRosterId))add('wrong_history',week,wid,`Entered Week ${week} in the top 4 and lost to last place.`);
        const loserTop4=Number(entering[lid]||99)<=4;
        if(loserTop4 && wid===String(lastRosterId))add('wrong_history',week,lid,`Entered Week ${week} in the top 4 and lost to last place ${achievementTeamName(wid)}.`);
      }
    }

    for(const entry of list){
      const roster=leagueRosters.find(r=>String(r.roster_id)===String(entry.roster_id));
      const starters=new Set((entry.starters||[]).filter(Boolean).map(String));
      const bench=(roster?.players||[]).filter(id=>!starters.has(String(id)));
      const bench30=bench.map(id=>({id,pts:matchupPlayerPoints(entry,id),p:sleeperRosterPlayer(id)})).filter(x=>x.pts>=30).sort((a,b)=>b.pts-a.pts)[0];
      if(bench30)add('bench_30',week,entry.roster_id,`${bench30.p.name} scored ${bench30.pts.toFixed(2)} on the bench.`);
    }
  }
  return candidates;
}
function achievementResults(){
  const auto=autoAchievementCandidates(),manual=loadManualAchievements(),out={};
  for(const def of UCL_ACHIEVEMENTS){
    if(def.mode==='auto'){
      const rows=(auto[def.id]||[]).slice().sort((a,b)=>a.week-b.week||String(a.rosterId).localeCompare(String(b.rosterId)));
      out[def.id]=rows.length?{unlocked:true,...rows[0],source:'Sleeper'}:{unlocked:false,source:'Sleeper'};
    }else{
      const m=manual[def.id];
      out[def.id]=m?.rosterId?{unlocked:true,week:Number(m.week||0)||null,rosterId:String(m.rosterId),detail:m.detail||'Manually verified.',source:'Manual'}:{unlocked:false,source:'Manual'};
    }
  }
  return out;
}
function achievementCountsByRoster(){
  const results=achievementResults(),counts={};
  for(const [id,r] of Object.entries(results)){
    if(r.unlocked){counts[r.rosterId]=(counts[r.rosterId]||0)+1;}
  }
  return counts;
}
function updateManualAchievement(id){
  const row=document.querySelector(`[data-manual-ach="${id}"]`);
  if(!row)return;
  const rosterId=row.querySelector('select')?.value||'';
  const data=loadManualAchievements();
  if(!rosterId)delete data[id];
  else data[id]={rosterId,week:Math.max(0,currentWeekNumber()-1),detail:'Manually verified in Companion.'};
  saveManualAchievements(data);
  renderAchievements();
  renderHistoryBridge();
}
function renderAchievements(){
  if(!ACHIEVEMENTS_ENABLED)return;
  const grid=$('#achievementGrid'),summary=$('#achievementSummary'),manualList=$('#achievementManualList'),status=$('#achievementStatus');
  if(!grid||!summary||!manualList)return;
  const results=achievementResults(),defs=UCL_ACHIEVEMENTS;
  const unlocked=defs.filter(d=>results[d.id]?.unlocked).length;
  const autoDefs=defs.filter(d=>d.mode==='auto'),manualDefs=defs.filter(d=>d.mode==='manual');
  const counts=achievementCountsByRoster();
  const leaders=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const topCount=leaders[0]?.[1]||0;
  const topNames=leaders.filter(x=>x[1]===topCount).map(x=>achievementTeamName(x[0]));

  if(status)status.textContent=`${unlocked}/${defs.length} unlocked • ${autoDefs.length} API-verifiable`;
  summary.innerHTML=`
    <span><b>${unlocked}</b> unlocked</span>
    <span><b>${defs.length-unlocked}</b> available</span>
    <span><b>${autoDefs.length}</b> auto-tracked</span>
    <span><b>${manualDefs.length}</b> manual-review</span>
    <span><b>${topCount||0}</b> leader total${topNames.length?` • ${esc(topNames.join(', '))}`:''}</span>`;

  const shown=defs.filter(d=>{
    const r=results[d.id];
    if(achievementFilter==='unlocked')return r.unlocked;
    if(achievementFilter==='available')return !r.unlocked;
    if(achievementFilter==='manual')return d.mode==='manual';
    return true;
  });
  grid.innerHTML=shown.map(d=>{
    const r=results[d.id],hidden=!d.visible&&!r.unlocked;
    const classes=[r.unlocked?'unlocked':'',hidden?'hidden-ach':'',d.mode==='manual'?'manual-ach':''].filter(Boolean).join(' ');
    return `<div class="achievement-card ${classes}">
      <div class="ach-top"><div class="ach-title">${hidden?'??? HIDDEN ACHIEVEMENT':esc(d.title)}</div><span class="ach-status">${r.unlocked?'UNLOCKED':d.mode==='manual'?'MANUAL REVIEW':'AVAILABLE'}</span></div>
      <div class="ach-desc">${hidden?'This achievement remains hidden until somebody unlocks it.':esc(d.desc)}</div>
      ${r.unlocked?`<div class="ach-winner">🏆 ${esc(achievementTeamName(r.rosterId))}${r.week?` • Week ${r.week}`:''}</div><div class="ach-meta">${esc(r.detail||'')} • ${esc(r.source)}</div>`:`<div class="ach-meta">${d.mode==='auto'?'Tracked from league results.':'Manual review.'}</div>`}
    </div>`;
  }).join('');

  const manual=loadManualAchievements();
  manualList.innerHTML=manualDefs.map(d=>`<div class="achievement-manual-row" data-manual-ach="${d.id}">
    <b>${esc(d.title)}</b>
    <select><option value="">Not verified</option>${(leagueRosters||[]).map(r=>`<option value="${r.roster_id}" ${String(manual[d.id]?.rosterId||'')===String(r.roster_id)?'selected':''}>${esc(rosterUserName(r))}</option>`).join('')}</select>
    <button type="button" class="btn ghost" data-save-manual-ach="${d.id}">Save</button>
  </div>`).join('');
}
function achievementsForWeek(week){
  const results=achievementResults(),out=[];
  for(const def of UCL_ACHIEVEMENTS){
    const r=results[def.id];
    if(r?.unlocked && Number(r.week)===Number(week))out.push({title:def.title,rosterId:r.rosterId,detail:r.detail});
  }
  return out;
}
function historyTeamSnapshot(roster){
  const rosterId=String(roster?.roster_id||'');
  const draftTeam=leagueDraftGrades().find(x=>String(x.rosterId)===rosterId);
  const txs=teamTransactions(rosterId);
  const weekly=teamWeeklyResults(rosterId).slice().sort((a,b)=>a.week-b.week);
  const counts=rosterPositionCounts(roster);
  return {
    rosterId,
    teamName:rosterUserName(roster),
    record:{
      wins:Number(roster?.settings?.wins||0),
      losses:Number(roster?.settings?.losses||0),
      ties:Number(roster?.settings?.ties||0)
    },
    pointsFor:rosterPointsFor(roster),
    draft:draftTeam?{
      grade:draftTeam.grade?.letter||'—',
      score:draftTeam.grade?.score??null,
      valueScore:draftTeam.grade?.valueScore??null,
      constructionScore:draftTeam.grade?.constructionScore??null,
      picks:draftTeam.picks?.length||0
    }:null,
    roster:{
      total:(roster?.players||[]).length,
      counts
    },
    weeklyResults:weekly.map(x=>({
      week:x.week,
      result:x.result,
      opponent:x.oppName,
      pointsFor:x.myPts,
      pointsAgainst:x.oppPts
    })),
    recentTransactions:txs.slice(0,20).map(tx=>({
      type:tx.type||'transaction',
      created:Number(tx.created||0),
      moves:transactionMoves(tx).filter(m=>String(m.rosterId)===rosterId).map(m=>({
        kind:m.kind,player:m.player,pos:m.pos,team:m.team
      }))
    }))
  };
}

function finalizedMatchupArchive(){
  const out=[];
  for(const week of finalizedWeeksAsc()){
    for(const p of matchupPairsForWeek(week)){
      out.push({
        gameKey:`2026-W${week}-M${p.matchupId}`,
        season:2026,
        week,
        matchupId:p.matchupId,
        teamA:{rosterId:String(p.a.roster_id),teamName:rosterUserName(p.ar),score:p.ap},
        teamB:{rosterId:String(p.b.roster_id),teamName:rosterUserName(p.br),score:p.bp},
        winnerRosterId:p.winner?String(p.winner.roster_id):null,
        margin:p.margin,
        totalPoints:p.total,
        source:'Sleeper finalized matchup'
      });
    }
  }
  return out;
}
function standingsProgressionArchive(){
  return finalizedWeeksAsc().map(week=>({
    week,
    standings:standingsAfterWeek(week).map(r=>({
      rank:r.rank,rosterId:r.rosterId,teamName:r.name,
      wins:r.wins,losses:r.losses,ties:r.ties,pointsFor:r.pf
    }))
  }));
}
function playoffArchive(){
  const start=playoffStartWeek();
  const games=finalizedMatchupArchive().filter(g=>g.week>=start);
  return {
    playoffTeams:playoffTeamCount(),
    startWeek:start,
    finalizedGames:games,
    currentBracketState:games.length?games.map(g=>({
      week:g.week,gameKey:g.gameKey,teamA:g.teamA,teamB:g.teamB,winnerRosterId:g.winnerRosterId
    })):[]
  };
}
function draftArchive(){
  const grades=leagueDraftGrades();
  return {
    draftId:sleeperCtx.draftId||verifiedDraft?.draft_id||null,
    status:verifiedDraft?.status||null,
    picks:(lastDraftPicks||[]).slice().sort((a,b)=>Number(a.pick_no||0)-Number(b.pick_no||0)).map(p=>{
      const ranked=playerFromPick(p);
      return {
        pickNo:Number(p.pick_no||0),
        round:Number(p.round||0),
        rosterId:String(p.roster_id??''),
        draftedBy:rosterOwnerName(p.roster_id,p.picked_by),
        playerId:String(p.player_id||''),
        playerName:sleeperPickName(p)||ranked?.name||String(p.player_id||'Unknown'),
        position:pickPosition(p,ranked)||null,
        nflTeam:ranked?.team||p.metadata?.team||null,
        listRank:ranked?.rank||null
      };
    }),
    teamGrades:grades.map(g=>({
      rosterId:g.rosterId,teamName:g.teamName,username:g.username,rank:g.rank,
      overall:g.grade?.letter||null,score:g.grade?.score??null,
      valueScore:g.grade?.valueScore??null,constructionScore:g.grade?.constructionScore??null,
      picks:g.picks?.length||0
    }))
  };
}
function transactionArchive(){
  const weeks=Object.keys(seasonTransactionsByWeek||{}).map(Number).sort((a,b)=>a-b);
  const seen=new Set(),out=[];
  for(const week of weeks){
    for(const tx of dedupeTransactionList(seasonTransactionsByWeek[week])){
      const key=transactionStableKey(tx);
      if(seen.has(key))continue;
      seen.add(key);
      out.push({
        week,
        transactionId:tx.transaction_id||null,
        type:tx.type||null,
        status:tx.status||null,
        created:Number(tx.created||0)||null,
        rosterIds:(tx.roster_ids||[]).map(String),
        adds:Object.entries(tx.adds||{}).map(([playerId,rosterId])=>({
          playerId:String(playerId),playerName:transactionPlayerName(playerId),rosterId:String(rosterId),teamName:transactionTeamName(rosterId)
        })),
        drops:Object.entries(tx.drops||{}).map(([playerId,rosterId])=>({
          playerId:String(playerId),playerName:transactionPlayerName(playerId),rosterId:String(rosterId),teamName:transactionTeamName(rosterId)
        }))
      });
    }
  }
  return out;
}
function teamSeasonSummaryArchive(){
  return (leagueRosters||[]).map(r=>{
    const t=teamManagerTendencyProfile(r);
    const results=teamWeeklyResults(r.roster_id).slice().sort((a,b)=>a.week-b.week);
    return {
      rosterId:String(r.roster_id),teamName:rosterUserName(r),
      record:rosterRecord(r),pointsFor:rosterPointsFor(r),
      finalizedResults:results,
      rosterCounts:rosterPositionCounts(r),
      scoringAverage:t.score.avg,scoringVolatility:t.score.std,scoringTrend:t.score.trend,
      lineupStability:t.stability.score,
      recentTransactionProfile:t.tx
    };
  });
}
function newsroomArchive(){
  return newsroomStories().map(s=>({
    id:s.id,category:s.category,priority:s.priority,headline:s.headline,
    detail:s.detail,fact:s.fact,week:s.week||null,kind:s.kind||null
  }));
}
function rivalryArchive(){
  const teams=(leagueRosters||[]).map(rosterUserName);
  const out=[];
  for(let i=0;i<teams.length;i++){
    for(let j=i+1;j<teams.length;j++){
      const s=rivalrySeries(teams[i],teams[j]);
      if(!s.games.length)continue;
      out.push({
        teamA:teams[i],teamB:teams[j],
        meetings:s.games.length,aWins:s.aWins,bWins:s.bWins,ties:s.ties,
        pointsA:s.aPts,pointsB:s.bPts,
        lastMeeting:s.last?{season:s.last.season,week:s.last.week,scoreA:s.last.scoreA,scoreB:s.last.scoreB}:null,
        largestWin:s.largest?{winner:s.largest.winner,margin:s.largest.margin,season:s.largest.season,week:s.largest.week}:null
      });
    }
  }
  return out;
}
function validate2026SeasonPackage(pkg){
  const issues=[];
  const warnings=[];
  const finalizedThrough=Math.max(0,currentWeekNumber()-1);
  const expectedWeeks=Array.from({length:finalizedThrough},(_,i)=>i+1);
  const loadedFinalized=expectedWeeks.filter(w=>(seasonMatchupsByWeek[w]||[]).length);
  if(loadedFinalized.length!==expectedWeeks.length)warnings.push(`Only ${loadedFinalized.length}/${expectedWeeks.length} finalized weeks have matchup data loaded.`);
  if(!(leagueRosters||[]).length)issues.push('No league rosters loaded.');
  if(!pkg.matchups.length&&finalizedThrough>0)issues.push('No finalized matchup archive was produced.');
  if(pkg.draft.picks.length===0&&isDraftComplete())warnings.push('Draft is complete but no draft picks are present in the archive.');
  if(pkg.standingsProgression.length!==loadedFinalized.length)warnings.push('Standings progression does not match the number of loaded finalized weeks.');
  const expectedGamesPerWeek=Math.floor((leagueRosters||[]).length/2);
  const expectedGames=loadedFinalized.length*expectedGamesPerWeek;
  if(expectedGamesPerWeek>0&&pkg.matchups.length!==expectedGames)warnings.push(`Finalized game count is ${pkg.matchups.length}; ${expectedGames} are expected from ${loadedFinalized.length} loaded weeks.`);

  const matchupKeys=pkg.matchups.map(x=>x.gameKey);
  if(new Set(matchupKeys).size!==matchupKeys.length)issues.push('Duplicate finalized game keys detected.');

  const teamIds=pkg.teams.map(x=>x.rosterId);
  if(new Set(teamIds).size!==teamIds.length)issues.push('Duplicate team roster IDs detected.');

  return {
    ok:issues.length===0,
    complete:issues.length===0&&warnings.length===0,
    issues,warnings,
    checks:{
      teams:pkg.teams.length,
      finalizedWeeks:loadedFinalized.length,
      finalizedGames:pkg.matchups.length,
      transactions:pkg.transactions.length,
      draftPicks:pkg.draft.picks.length,
      newsroomStories:pkg.ctespnStories.length
    }
  };
}

function build2026HistorySnapshot(){
  const teams=teamSeasonSummaryArchive();
  const standings=standingsOrderFromRecords((leagueRosters||[]).map(r=>({
    roster:r,rosterId:String(r.roster_id),name:rosterUserName(r),
    wins:Number(r.settings?.wins||0),losses:Number(r.settings?.losses||0),ties:Number(r.settings?.ties||0),
    pf:rosterPointsFor(r)
  }))).map((x,i)=>({
    rank:i+1,rosterId:x.rosterId,teamName:x.name,wins:x.wins,losses:x.losses,ties:x.ties,pointsFor:x.pf
  }));

  const pkg={
    schema:"ucl-season-package-v2",
    archiveVersion:2,
    league:{
      name:verifiedLeague?.name||"Unmanaged Chaos League",
      leagueId:SLEEPER_LEAGUE_ID,
      season:Number(verifiedLeague?.season||SLEEPER_SEASON||2026),
      totalRosters:Number(verifiedLeague?.total_rosters||leagueRosters.length||8),
      rosterPositions:verifiedLeague?.roster_positions||[]
    },
    generatedAt:new Date().toISOString(),
    appVersion:APP_VERSION,
    currentWeek:currentWeekNumber(),
    finalizedThroughWeek:Math.max(0,currentWeekNumber()-1),
    activeWeekExcludedFromFinalResults:true,
    draftComplete:isDraftComplete(),
    standings,
    standingsProgression:standingsProgressionArchive(),
    matchups:finalizedMatchupArchive(),
    playoff:playoffArchive(),
    draft:draftArchive(),
    transactions:transactionArchive(),
    teams,
    ctespnStories:newsroomArchive(),
    rivalries:rivalryArchive(),
    historicalSourceLoaded:!!loadStoredHistorySource(),
    historicalSourceGameCount:normalizedHistoryGames(loadStoredHistorySource()).length
  };
  pkg.validation=validate2026SeasonPackage(pkg);
  return pkg;
}
function renderHistoryBridge(){
  const summary=$('#historyBridgeSummary'),grid=$('#historyBridgeGrid'),status=$('#historyBridgeStatus');
  if(!summary||!grid||!status)return;
  if(!(leagueRosters||[]).length){
    status.textContent='Waiting for Sleeper';
    summary.innerHTML='';grid.innerHTML='<div class="empty">Season data is not available yet.</div>';
    return;
  }

  const snap=build2026HistorySnapshot();
  const v=snap.validation;
  status.textContent=v.complete?'Season package ready':v.ok?'Season package needs review':'Season package issue';
  summary.innerHTML=`
    <span><b>${snap.teams.length}</b> teams</span>
    <span><b>${snap.standingsProgression.length}</b> finalized weeks</span>
    <span><b>${snap.matchups.length}</b> finalized games</span>
    <span><b>${snap.transactions.length}</b> transactions</span>
    <span><b>${snap.draft.picks.length}</b> draft picks</span>
    <span><b>${snap.ctespnStories.length}</b> CTESPN stories</span>`;

  grid.innerHTML=snap.teams.map(t=>{
    const me=String(t.rosterId)===String(sleeperCtx.rosterId);
    return `<div class="history-team-row ${me?'me':''}">
      <div class="htr-head"><b>${esc(t.teamName)}${me?' • YOU':''}</b><span>${esc(t.record)}</span></div>
      <div class="htr-meta">${Number(t.pointsFor||0).toFixed(2)} PF • ${t.finalizedResults.length} finalized result${t.finalizedResults.length===1?'':'s'} • ${t.recentTransactionProfile?.txs||0} recent transactions loaded</div>
      <div class="htr-chips">
        <span>${esc(t.scoringTrend||'pending')} trend</span>
        <span>${t.lineupStability==null?'—':t.lineupStability+'%'} lineup stability</span>
        <span>${Object.values(t.rosterCounts||{}).reduce((s,n)=>s+Number(n||0),0)} rostered</span>
      </div>
    </div>`;
  }).join('');

}
