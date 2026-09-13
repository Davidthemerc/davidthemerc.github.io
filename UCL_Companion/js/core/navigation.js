function safeUiCall(label,fn){
  try{
    return typeof fn==='function'?fn():undefined;
  }catch(err){
    console.error(`UCL ${label} render error`,err);
    try{recordSleeperError({path:`ui/${label}`,error:err,retries:0,cachedUsed:true,label:`${label} render`});}catch(e){}
    return undefined;
  }
}
function activateTabView(name){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  const map={
    news:'newsView',home:'homeView',draft:'draftView',analysis:'analysisView',teams:'teamsView',
    team:'teamView',season:'seasonView',trade:'tradeView',faw:'fawView',
    log:'logView',settings:'settingsView'
  };
  for(const [tab,id] of Object.entries(map)){
    document.getElementById(id)?.classList.toggle('active',tab===name);
  }
}
function switchTab(name){
  try{
    if((name==='season'||name==='trade'||name==='faw') &&
       !(typeof seasonToolsAvailable==='function' && seasonToolsAvailable()))name='draft';
  }catch(e){
    // Lifecycle uncertainty should not break basic navigation.
    if(name==='season'||name==='trade'||name==='faw')name='draft';
  }

  safeUiCall('audit-help',()=>typeof toggleAuditHelp==='function'&&toggleAuditHelp(false));

  // Change the visible screen first. A renderer failure must never make a click
  // appear to do nothing.
  activateTabView(name);

  if(name==='news'){
    safeUiCall('league-activity',()=>renderLeagueActivity());
    safeUiCall('weekly-report',()=>renderWeeklyLeagueReport());
    safeUiCall('newsroom',()=>renderNewsroom());
    if(typeof refreshManualNews==='function')void refreshManualNews({rerender:true});
    safeUiCall('news-rivalry-preflight',()=>{if(typeof ensureNewsRivalryData==='function')void ensureNewsRivalryData();});
  }
  if(name==='home'){
    safeUiCall('command-center',()=>renderCompanionHome());
  }
  if(name==='draft')safeUiCall('report-card',()=>typeof renderPostDraftReport==='function'&&renderPostDraftReport());
  if(name==='analysis')safeUiCall('team-analysis',()=>renderTeamAnalysis());
  if(name==='teams')safeUiCall('teams',()=>renderLeagueTeams());
  if(name==='team')safeUiCall('my-team',()=>renderTeam());
  if(name==='season')safeUiCall('season',()=>renderSeasonCompanion());
  if(name==='trade')safeUiCall('trade-center',()=>renderTradeCenter());
  if(name==='faw')safeUiCall('free-agency',()=>renderFaw());
  if(name==='log')safeUiCall('draft-log',()=>renderDraftLog());
  if(name==='settings')safeUiCall('settings',()=>renderSettingsView());

  return name;
}
document.querySelectorAll('.tab-btn').forEach(b=>b.addEventListener('click',e=>{
  e.preventDefault();
  switchTab(b.dataset.tab);
}));
$('#historyImportBtn')?.addEventListener('click',()=>$('#historyImportFile')?.click());
$('#historyImportFile')?.addEventListener('change',e=>{
  const file=e.target.files?.[0];
  if(file)importLeagueHistoryFile(file);
  e.target.value='';
});
$('#tradePartner')?.addEventListener('change',()=>renderTradePlayerList(tradeRosterById($('#tradePartner').value),'tradeGetList'));
$('#evaluateTradeBtn')?.addEventListener('click',()=>evaluateTrade());
document.addEventListener('click',e=>{
  const r=e.target.closest('[data-open-rivalry-detail]');
  if(r){e.preventDefault();openNewsRivalryDetail(r.dataset.rivalryTeamA||'',r.dataset.rivalryTeamB||'');return;}
});
document.addEventListener('keydown',e=>{
  const r=e.target.closest?.('[data-open-rivalry-detail]');
  if(r&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openNewsRivalryDetail(r.dataset.rivalryTeamA||'',r.dataset.rivalryTeamB||'');}
});
$('#newsRivalryClose')?.addEventListener('click',()=>$('#newsRivalryDialog')?.close());

document.addEventListener('click',e=>{
  const f=e.target.closest('[data-news-filter]');
  if(f){
    newsroomFilter=f.dataset.newsFilter;
    document.querySelectorAll('[data-news-filter]').forEach(b=>b.classList.toggle('active',b===f));
    renderNewsroom();
    return;
  }
});
document.addEventListener('click',e=>{
  const filter=e.target.closest('[data-ach-filter]');
  if(filter){
    if(!ACHIEVEMENTS_ENABLED)return;
    achievementFilter=filter.dataset.achFilter;
    document.querySelectorAll('[data-ach-filter]').forEach(b=>b.classList.toggle('active',b===filter));
    renderAchievements();
    return;
  }
  const save=e.target.closest('[data-save-manual-ach]');
  if(save){if(!ACHIEVEMENTS_ENABLED)return;updateManualAchievement(save.dataset.saveManualAch);return;}
});
$('#weeklyReportWeek')?.addEventListener('change',e=>{
  selectedWeeklyReportWeek=Number(e.target.value);
  renderWeeklyLeagueReport();
});
document.addEventListener('click',e=>{
  const picker=e.target.closest('[data-team-roster]');
  if(picker){e.preventDefault();openLeagueTeam(picker.dataset.teamRoster);return;}
  const card=e.target.closest('[data-open-team]');
  if(card&&!e.target.closest('button,a,summary')){
    selectedLeagueTeamRosterId=String(card.dataset.openTeam);
    switchTab('teams');
  }
});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-playoff-week][data-playoff-outcome]');
  if(b){e.preventDefault();setPlayoffOutcome(Number(b.dataset.playoffWeek),b.dataset.playoffOutcome);return;}
});
document.addEventListener('click',e=>{
});
document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-command-tab]');
  if(btn){e.preventDefault();navigateCommand(btn.dataset.commandTab,btn.dataset.commandSection||'');return;}
});
function activateHomeShortcut(btn){
  if(!btn||btn.hidden||btn.disabled)return false;
  const tab=String(btn.dataset.homeNav||'').trim();
  if(!tab)return false;
  const section=String(btn.dataset.homeSection||'').trim();
  return navigateCommand(tab,section);
}
document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-home-nav]');
  if(!btn)return;
  e.preventDefault();
  activateHomeShortcut(btn);
});

function minePlayers(){
  return PLAYERS.filter(p=>ps(p.rank).draft==='mine').slice().sort((a,b)=>b.proj-a.proj||a.rank-b.rank);
}
function takeBest(pool,pos){
  const i=pool.findIndex(p=>p.pos===pos);
  if(i<0)return null;
  return pool.splice(i,1)[0];
}
function takeFlex(pool){
  let bestIndex=-1;
  for(let i=0;i<pool.length;i++){
    if(['RB','WR','TE'].includes(pool[i].pos)){bestIndex=i;break;}
  }
  return bestIndex<0?null:pool.splice(bestIndex,1)[0];
}
function slotHtml(label,p,bench=false,note=''){
  if(!p){
    return `<div class="slot-row ${bench?'bench-row':''}">
      <div class="slot-pos">${label}</div>
      <div class="slot-player"><span class="slot-empty">${note||'Empty'}</span></div>
      <div class="slot-proj">—<small>PROJ</small></div><div class="slot-bye">—</div>
    </div>`;
  }
  return `<div class="slot-row ${bench?'bench-row':''}">
    <div class="slot-pos">${label}</div>
    <div class="slot-player"><strong>${esc(p.name)}</strong><small>${p.team} • ${p.posRank}</small></div>
    <div class="slot-proj">${p.proj}<small>PROJ</small></div><div class="slot-bye">Bye ${p.bye}</div>
  </div>`;
}



function gradeClass(letter){
  const l=String(letter||'').toUpperCase();
  if(l.startsWith('A'))return 'grade-a';
  if(l.startsWith('B'))return 'grade-b';
  if(l.startsWith('C'))return 'grade-c';
  if(l.startsWith('D'))return 'grade-d';
  if(l==='F')return 'grade-f';
  return 'grade-na';
}
function gradeBadge(letter,extra=''){
  const l=String(letter||'—');
  return `<span class="grade-badge ${gradeClass(l)} ${extra}">${esc(l)}</span>`;
}
function setGradeBadge(el,letter,extra=''){
  if(!el)return;
  el.className=`${extra} grade-badge ${gradeClass(letter)}`.trim();
  el.textContent=letter||'—';
}
function gradeLetter(score){
  if(score>=97)return 'A+';
  if(score>=93)return 'A';
  if(score>=90)return 'A-';
  if(score>=87)return 'B+';
  if(score>=83)return 'B';
  if(score>=80)return 'B-';
  if(score>=77)return 'C+';
  if(score>=73)return 'C';
  if(score>=70)return 'C-';
  if(score>=67)return 'D+';
  if(score>=63)return 'D';
  if(score>=60)return 'D-';
  return 'F';
}
function gradeWeight(round){
  if(round<=1)return 2.35;
  if(round===2)return 2.10;
  if(round===3)return 1.90;
  if(round===4)return 1.70;
  if(round<=6)return 1.45;
  if(round<=9)return 1.22;
  if(round<=12)return 1.08;
  return .96;
}
function pickValueScore(rank,pickNo,round){
  if(!rank){
    // Off-list picks are still reaches, but the penalty now scales more smoothly
    // with draft capital instead of crushing the whole team grade by itself.
    if(round===1)return 32;
    if(round===2)return 40;
    if(round===3)return 48;
    if(round===4)return 55;
    if(round<=6)return 64;
    if(round<=9)return 72;
    if(round<=12)return 78;
    return 82;
  }

  const delta=pickNo-rank; // positive = drafted later than list rank
  let score=94;

  if(delta>=0){
    const bonus=Math.min(12,Math.pow(delta,0.68)*.95);
    score+=bonus;
  }else{
    const reach=Math.abs(delta);
    const earlyFactor=round===1?1.18:round===2?1.10:round<=4?1.02:round<=7?.94:.84;
    let penalty=Math.pow(reach,1.03)*.78*earlyFactor;
    if(reach>=20)penalty+=3;
    if(reach>=35)penalty+=5;
    if(reach>=50)penalty+=7;
    score-=penalty;
  }
  return Math.max(25,Math.min(106,score));
}
function gradeLabel(rank,pickNo,round){
  if(!rank)return {label:'VERY BAD REACH • not in ranking list',kind:'bad'};
  const delta=pickNo-rank;
  if(delta>=18)return {label:`Big steal • ${delta} picks after list value`,kind:'steal'};
  if(delta>=7)return {label:`Steal • +${delta} picks of value`,kind:'steal'};
  if(delta>=-5)return {label:'Near list value',kind:''};
  if(delta>=-14)return {label:`Reach • ${Math.abs(delta)} picks early`,kind:'reach'};
  if(delta>=-29)return {label:`Bad reach • ${Math.abs(delta)} picks early`,kind:'bad'};
  return {label:`VERY BAD REACH • ${Math.abs(delta)} picks early`,kind:'bad'};
}
function liveDraftGrade(){
  const picks=myRawPicks().slice().sort((a,b)=>(a.pick_no||0)-(b.pick_no||0));
  if(!picks.length)return {score:null,letter:'—',graded:[],best:null,worst:null,valueScore:null,constructionScore:null};

  const graded=picks.map(pick=>{
    const ranked=playerFromPick(pick);
    const pickNo=Number(pick.pick_no||0);
    const round=Number(pick.round||Math.ceil(pickNo/(Number(verifiedLeague?.total_rosters||8)))||1);
    const score=pickValueScore(ranked?.rank||null,pickNo,round);
    const info=gradeLabel(ranked?.rank||null,pickNo,round);
    return {
      pick,ranked,pickNo,round,
      delta:ranked?pickNo-ranked.rank:null,
      score,label:info.label,kind:info.kind,weight:gradeWeight(round)
    };
  });

  // Pick value remains the largest component, but one bad pick no longer
  // imposes an artificial ceiling on the entire draft.
  let weighted=0,wsum=0;
  graded.forEach(g=>{weighted+=g.score*g.weight;wsum+=g.weight;});
  let valueScore=weighted/wsum;

  const prof=myRosterProfile(),c=prof.counts;
  let construction=draftConstructionScore(prof);

  // In the Live Season build, the report should judge the team that was built,
  // not merely how closely the manager followed the ranking board. A full
  // roster receives a construction-heavy grade, with Week 1 projected starter
  // strength contributing when Sleeper projections are available.
  const rosterSlots=(verifiedLeague?.roster_positions||[]).length||15;
  const rosterFinished=prof.total>=rosterSlots||isDraftComplete();
  const teamStrengthScore=rosterFinished?draftTeamStrengthScore(picks):null;
  let overall=rosterFinished
    ? Math.round(valueScore*(teamStrengthScore==null?.55:.45)+construction*(teamStrengthScore==null?.45:.35)+(teamStrengthScore||0)*(teamStrengthScore==null?0:.20))
    : Math.round(valueScore*.65+construction*.35);
  overall=Math.max(0,Math.min(100,overall));

  const best=graded.filter(g=>g.ranked).sort((a,b)=>b.score-a.score)[0]||null;
  const worst=graded.slice().sort((a,b)=>a.score-b.score)[0]||null;

  return {
    score:overall,
    letter:gradeLetter(overall),
    graded,best,worst,
    valueScore:Math.round(valueScore),
    constructionScore:Math.round(construction),
    teamStrengthScore:teamStrengthScore==null?null:Math.round(teamStrengthScore)
  };
}

function ordinal(n){
  const v=Number(n)||0,mod100=v%100;
  if(mod100>=11&&mod100<=13)return `${v}th`;
  return `${v}${v%10===1?'st':v%10===2?'nd':v%10===3?'rd':'th'}`;
}
function relativeLeagueDraftGradeContext(){
  const grades=leagueDraftGrades();
  const total=grades.length;
  const mine=grades.find(x=>String(x.rosterId)===String(sleeperCtx.rosterId));
  if(!mine||!total)return null;

  const metricRank=(field)=>{
    const eligible=grades.filter(x=>Number.isFinite(Number(x.grade?.[field])));
    eligible.sort((a,b)=>Number(b.grade[field])-Number(a.grade[field])||String(a.teamName).localeCompare(String(b.teamName)));
    const index=eligible.findIndex(x=>String(x.rosterId)===String(sleeperCtx.rosterId));
    if(index<0)return null;
    const rank=index+1,n=eligible.length;
    const percentile=n<=1?100:Math.round((n-rank)/(n-1)*100);
    return {rank,total:n,percentile,value:Number(mine.grade?.[field])};
  };

  return {
    overall:{rank:mine.rank,total,score:mine.grade.score,letter:mine.grade.letter},
    value:metricRank('valueScore'),
    construction:metricRank('constructionScore')
  };
}
function renderRelativeLeagueDraftGrade(){
  if(!$('#draftLeagueRank')||!$('#draftValueRank')||!$('#draftConstructionRank'))return relativeLeagueDraftGradeContext();
  const overall=$('#draftLeagueRank'),value=$('#draftValueRank'),construction=$('#draftConstructionRank');
  if(!overall||!value||!construction)return null;
  const ctx=relativeLeagueDraftGradeContext();
  if(!ctx){
    overall.textContent='—';value.textContent='—';construction.textContent='—';
    $('#draftLeagueRankDetail').textContent='Waiting for league picks';
    $('#draftValueRankDetail').textContent='—';
    $('#draftConstructionRankDetail').textContent='—';
    return null;
  }
  overall.textContent=`${ordinal(ctx.overall.rank)} of ${ctx.overall.total}`;
  $('#draftLeagueRankDetail').textContent=`${ctx.overall.letter} • ${ctx.overall.score} overall`;
  if(ctx.value){
    value.textContent=`${ordinal(ctx.value.rank)} of ${ctx.value.total}`;
    $('#draftValueRankDetail').textContent=`${ctx.value.value} score • ${ordinal(ctx.value.percentile)} percentile`;
  }else{
    value.textContent='—';$('#draftValueRankDetail').textContent='Not enough data';
  }
  if(ctx.construction){
    construction.textContent=`${ordinal(ctx.construction.rank)} of ${ctx.construction.total}`;
    $('#draftConstructionRankDetail').textContent=`${ctx.construction.value} score • ${ordinal(ctx.construction.percentile)} percentile`;
  }else{
    construction.textContent='—';$('#draftConstructionRankDetail').textContent='Not enough data';
  }
  return ctx;
}

function renderLiveDraftGrade(){
  const box=$('#draftGradeBox');if(!box)return;
  const g=liveDraftGrade();
  setGradeBadge($('#draftGradeLetter'),g.letter,'draft-grade-letter');
  $('#draftGradeScore').textContent=g.score==null?'—':g.score;
  $('#draftGradePicks').textContent=g.graded.length;
  $('#draftBestValue').textContent=g.best?.ranked?`#${g.best.pickNo} ${g.best.ranked.name}`:'—';
  $('#draftBiggestReach').textContent=g.worst?.ranked?`#${g.worst.pickNo} ${g.worst.ranked.name}`:(g.worst?'Off-list pick':'—');
  const leagueContext=renderRelativeLeagueDraftGrade();

  if(g.score==null){
    $('#draftGradeCopy').textContent='Your live grade will appear as Sleeper records your picks.';
    $('#draftGradeList').innerHTML='';
    return;
  }

  const steals=g.graded.filter(x=>x.kind==='steal').length;
  const bad=g.graded.filter(x=>x.kind==='bad').length;
  const leagueLine=leagueContext
    ?` • League ${ordinal(leagueContext.overall.rank)}/${leagueContext.overall.total} • Value ${leagueContext.value?ordinal(leagueContext.value.rank)+'/'+leagueContext.value.total:'—'} • Build ${leagueContext.construction?ordinal(leagueContext.construction.rank)+'/'+leagueContext.construction.total:'—'}`
    :'';
  $('#draftGradeCopy').textContent=
    `${g.score} (${g.letter}) • Value ${g.valueScore} • Build ${g.constructionScore} • ${steals} value pick${steals===1?'':'s'} • ${bad} major reach${bad===1?'':'es'}${leagueLine}`;

  $('#draftGradeList').innerHTML=g.graded.map(x=>{
    const md=x.pick.metadata||{};
    const name=x.ranked?.name||sleeperPickName(x.pick)||String(x.pick?.player_id||'Unknown Sleeper Player');
    const rank=x.ranked?`List #${x.ranked.rank}`:'NR • NOT IN LIST';
    return `<span class="grade-pick ${x.kind}"><b>${pickLabel(x.pick)} ${esc(name)}</b><br>${rank} • ${esc(x.label)} • Pick score ${Math.round(x.score)}</span>`;
  }).join('');
}


function isDraftComplete(){
  const status=String(verifiedDraft?.status||'').toLowerCase();
  if(['complete','completed','finished'].includes(status))return true;
  const teams=Number(verifiedLeague?.total_rosters||8);
  const rounds=Number(verifiedDraft?.settings?.rounds||verifiedDraft?.rounds||0);
  return !!(rounds&&teams&&lastDraftPicks.length>=rounds*teams);
}
function draftAllowsPostDraftViews(){
  // v1.8 Live Season is deployed as the season product. Once this build is in use,
  // season-mode UI must not be held back by a stale Sleeper draft status.
  if(LIVE_SEASON_BUILD)return true;
  const status=String(verifiedDraft?.status||'').toLowerCase();
  if(status==='drafting'||status==='active'||status==='in_progress'||status==='in progress')return false;
  return isDraftComplete();
}
function seasonToolsAvailable(){
  return LIVE_SEASON_BUILD||draftAllowsPostDraftViews();
}

function finalPickName(g){
  if(!g)return '—';
  const md=g.pick?.metadata||{};
  const name=g.ranked?.name||sleeperPickName(g.pick)||String(g.pick?.player_id||'Unknown Sleeper Player');
  return `${pickLabel(g.pick)} ${name}`;
}
function capitalEfficiency(graded){
  if(!graded.length)return null;
  const ranked=graded.filter(g=>g.ranked);
  if(!ranked.length)return 0;
  const deltas=ranked.map(g=>g.delta||0);
  const avg=deltas.reduce((a,b)=>a+b,0)/deltas.length;
  const off=graded.length-ranked.length;
  let score=72+avg*.8-off*10;
  return Math.max(0,Math.min(100,Math.round(score)));
}

function picksForRoster(rosterId){
  return lastDraftPicks.filter(p=>String(p.roster_id||'')===String(rosterId))
    .slice().sort((a,b)=>(a.pick_no||0)-(b.pick_no||0));
}
function rosterProfileFromPicks(picks){
  const counts={QB:0,RB:0,WR:0,TE:0,K:0,DEF:0},rankedPlayers=[];
  for(const pick of picks){
    const ranked=playerFromPick(pick);
    const pos=String(pick?.metadata?.position||ranked?.pos||'').toUpperCase();
    const normalized=pos==='DST'?'DEF':pos;
    if(counts[normalized]!==undefined)counts[normalized]++;
    if(ranked)rankedPlayers.push(ranked);
  }
  return {counts,total:picks.length,mine:rankedPlayers};
}
function byeConcentrationForPlayers(players){
  if(players.length<5)return null;
  const byes={};
  players.forEach(p=>byes[p.bye]=(byes[p.bye]||0)+1);
  let best=null;
  for(const [bye,count] of Object.entries(byes)){
    const share=count/players.length;
    if(count>=4||(count>=3&&share>=.40)){
      if(!best||count>best.count)best={bye,count,share};
    }
  }
  return best?`Bye ${best.bye} concentration • ${best.count}/${players.length} ranked players`:null;
}
function gradeDraftPicks(picks){
  if(!picks.length)return {score:null,letter:'—',graded:[],best:null,worst:null,valueScore:null,constructionScore:null};
  const graded=picks.map(pick=>{
    const ranked=playerFromPick(pick);
    const pickNo=Number(pick.pick_no||0);
    const round=Number(pick.round||Math.ceil(pickNo/(Number(verifiedLeague?.total_rosters||8)))||1);
    const score=pickValueScore(ranked?.rank||null,pickNo,round);
    const info=gradeLabel(ranked?.rank||null,pickNo,round);
    return {pick,ranked,pickNo,round,delta:ranked?pickNo-ranked.rank:null,score,label:info.label,kind:info.kind,weight:gradeWeight(round)};
  });

  let weighted=0,wsum=0;
  graded.forEach(g=>{weighted+=g.score*g.weight;wsum+=g.weight;});
  let valueScore=weighted/wsum;

  const prof=rosterProfileFromPicks(picks),c=prof.counts;
  let construction=draftConstructionScore(prof);

  const rosterSlots=(verifiedLeague?.roster_positions||[]).length||15;
  const rosterFinished=prof.total>=rosterSlots||isDraftComplete();
  const teamStrengthScore=rosterFinished?draftTeamStrengthScore(picks):null;
  let overall=rosterFinished
    ? Math.round(valueScore*(teamStrengthScore==null?.55:.45)+construction*(teamStrengthScore==null?.45:.35)+(teamStrengthScore||0)*(teamStrengthScore==null?0:.20))
    : Math.round(valueScore*.65+construction*.35);
  overall=Math.max(0,Math.min(100,overall));
  const best=graded.filter(g=>g.ranked).sort((a,b)=>b.score-a.score)[0]||null;
  const worst=graded.slice().sort((a,b)=>a.score-b.score)[0]||null;
  return {score:overall,letter:gradeLetter(overall),graded,best,worst,valueScore:Math.round(valueScore),constructionScore:Math.round(construction),teamStrengthScore:teamStrengthScore==null?null:Math.round(teamStrengthScore)};
}

function teamDraftAnalysis(team){
  const graded=team.grade?.graded||[];
  const prof=rosterProfileFromPicks(team.picks||[]);
  const c=prof.counts;
  const ranked=graded.filter(g=>g.ranked);
  const reaches=ranked.filter(g=>g.delta<=-5);
  const steals=ranked.filter(g=>g.delta>=5);
  const offList=graded.filter(g=>!g.ranked);
  const avgDelta=ranked.length?ranked.reduce((s,g)=>s+(g.delta||0),0)/ranked.length:0;
  const avgAbs=ranked.length?ranked.reduce((s,g)=>s+Math.abs(g.delta||0),0)/ranked.length:0;
  const closeToList=ranked.filter(g=>Math.abs(g.delta||0)<5).length;
  const adherence=ranked.length?Math.round(closeToList/ranked.length*100):0;
  const reachAvg=reaches.length?Math.round(reaches.reduce((s,g)=>s+Math.abs(g.delta),0)/reaches.length):0;
  const stealAvg=steals.length?Math.round(steals.reduce((s,g)=>s+g.delta,0)/steals.length):0;

  const early=(graded.filter(g=>g.round<=4));
  const earlyReach=early.filter(g=>!g.ranked || (g.delta!=null&&g.delta<=-10)).length;

  const positionOrder={};
  for(const g of graded){
    const pos=pickPosition(g.pick,g.ranked)||'UNK';
    if(positionOrder[pos]==null)positionOrder[pos]=g.pickNo;
  }

  let tendency='';
  if(offList.length>=2)tendency='Frequently goes off-list and drafts independently of the custom board.';
  else if(adherence>=65)tendency='Closely follows the custom ranking list and usually stays near expected value.';
  else if(reaches.length>steals.length+1)tendency='Aggressive drafter who is willing to reach for preferred players.';
  else if(steals.length>reaches.length+1)tendency='Patient/value-oriented drafter who often lets the board come to them.';
  else tendency='Balanced approach with a mix of list value and personal preference.';

  const heavy=[];
  if(c.RB>=4)heavy.push('RB-heavy');
  if(c.WR>=5)heavy.push('WR-heavy');
  if(c.QB>=2)heavy.push('multiple QBs');
  if(c.TE>=2)heavy.push('multiple TEs');
  if(heavy.length)tendency+=` Roster build: ${heavy.join(', ')}.`;

  const worst=graded.slice().sort(worstReachComparator)[0]||null;
  const best=ranked.slice().sort((a,b)=>(b.delta||0)-(a.delta||0))[0]||null;

  return {prof,c,ranked,reaches,steals,offList,avgDelta,avgAbs,adherence,reachAvg,stealAvg,earlyReach,positionOrder,tendency,worst,best};
}
function valueTextForAnalysis(g){
  if(!g?.ranked)return {cls:'nr',text:'NR'};
  const d=g.delta||0;
  if(d>=5)return {cls:'steal',text:`+${d}`};
  if(d<=-15)return {cls:'bad',text:`${d}`};
  if(d<=-5)return {cls:'reach',text:`${d}`};
  return {cls:'',text:d===0?'EVEN':d>0?`+${d}`:`${d}`};
}
function draftStyleLabel(a){
  if(a.offList.length>=2)return 'Independent / Off-list';
  if(a.adherence>=70)return 'List Follower';
  if(a.reaches.length>=a.steals.length+2)return 'Aggressive / Reacher';
  if(a.steals.length>=a.reaches.length+2)return 'Value Hunter';
  return 'Balanced';
}

function rosterNeedsFromCounts(c){
  const r=draftLineupRequirements(),needs=[];
  if((c.QB||0)<r.QB)needs.push({pos:'QB',severity:3,label:`QB ${c.QB||0}/${r.QB}`});
  if((c.RB||0)<r.RB)needs.push({pos:'RB',severity:4,label:`RB ${c.RB||0}/${r.RB}`});
  else if((c.RB||0)<r.RB+1)needs.push({pos:'RB',severity:2,label:'RB depth'});
  if((c.WR||0)<r.WR)needs.push({pos:'WR',severity:4,label:`WR ${c.WR||0}/${r.WR}`});
  else if((c.WR||0)<r.WR+1)needs.push({pos:'WR',severity:2,label:'WR depth'});
  if(r.TE>0&&(c.TE||0)<r.TE)needs.push({pos:'TE',severity:4,label:`TE ${c.TE||0}/${r.TE}`});

  const flex=(c.RB||0)+(c.WR||0)+(c.TE||0);
  if(flex<draftFlexStarterFloor()){
    for(const p of ['RB','WR','TE']){
      const existing=needs.find(x=>x.pos===p);
      if(existing)existing.severity=Math.max(existing.severity,3);
      else needs.push({pos:p,severity:p==='TE'&&r.TE===0?1:2,label:'FLEX path'});
    }
  }
  return needs.sort((a,b)=>b.severity-a.severity);
}
function nextPickForRoster(rosterId){
  const teams=Number(verifiedLeague?.total_rosters||8);
  if(!teams||!verifiedDraft)return null;
  const slots=verifiedDraft?.slot_to_roster_id||{};
  let slot=null;
  for(const [s,rid] of Object.entries(slots)){
    if(String(rid)===String(rosterId)){slot=Number(s);break;}
  }
  if(!slot){
    const first=picksForRoster(rosterId)[0];
    slot=first?.draft_slot?Number(first.draft_slot):null;
  }
  if(!slot)return null;
  const completed=lastDraftPicks.length;
  for(let round=1;round<=30;round++){
    const pick=(round-1)*teams+(round%2===1?slot:(teams-slot+1));
    if(pick>completed)return pick;
  }
  return null;
}
function likelyNextPositions(team,a){
  const needs=rosterNeedsFromCounts(a.c);
  const graded=team.grade?.graded||[];
  const recent=graded.slice(-4);
  const recentPos={};
  recent.forEach(g=>{const p=pickPosition(g.pick,g.ranked);recentPos[p]=(recentPos[p]||0)+1;});
  const profile={counts:a.c,total:Object.values(a.c||{}).reduce((sum,n)=>sum+Number(n||0),0),mine:[]};

  return ['QB','RB','WR','TE'].map(pos=>{
    let score=0;
    const n=needs.find(x=>x.pos===pos),sat=positionSaturation(profile,pos);
    if(n)score+=n.severity*10;

    // Recent position preference is supporting evidence, not a need by itself.
    // Once a roster is saturated at a position, repeated earlier picks should
    // not make the app claim another selection is "likely".
    if(sat.state!=='saturated')score+=(recentPos[pos]||0)*(n?3:1.5);
    score+=sat.penalty;

    // Board-following only matters when there is at least a plausible roster fit.
    if(a.adherence>=70&&(n||score>3))score+=2;
    return {pos,score:Math.round(score),saturation:sat.state,plausible:score>=10&&sat.state!=='saturated'};
  }).sort((x,y)=>y.score-x.score);
}
function teamsPickingBeforeMe(){
  const myNext=nextUserPickNumber(),current=currentDraftNumber();
  if(!myNext||myNext<=current)return [];
  const byPick=[];
  for(const r of leagueRosters||[]){
    if(String(r.roster_id)===String(sleeperCtx.rosterId))continue;
    const next=nextPickForRoster(r.roster_id);
    if(next&&next<myNext&&next>=current)byPick.push({roster:r,next});
  }
  return byPick.sort((a,b)=>a.next-b.next);
}
function threatForOpponent(team,a,nextPick,myTop){
  const likely=likelyNextPositions(team,a);
  const topPos=myTop?.player?.pos||'';
  const topRead=likely.find(x=>x.pos===topPos)||{score:0,plausible:false,saturation:'open'};
  const picksAway=nextPick-currentDraftNumber();
  let riskScore=(topRead.plausible?topRead.score:Math.min(6,Math.max(0,topRead.score)))+(picksAway<=2?8:picksAway<=4?4:0);

  // List adherence increases candidate-specific threat only when the roster fit
  // itself is plausible. Otherwise it merely means they tend to follow value.
  if(a.adherence>=65&&myTop&&topRead.plausible)riskScore+=5;
  if(a.offList.length>=2)riskScore-=3;
  if(topRead.saturation==='saturated')riskScore-=8;

  const level=riskScore>=32?'high':riskScore>=18?'medium':'low';
  const label=level==='high'?'High threat':level==='medium'?'Watch':'Lower threat';
  return {level,label,likely,riskScore,topPositionThreat:!!myTop&&topRead.plausible&&riskScore>=18};
}
function renderThreatRadar(analyses){
  const grid=$('#threatGrid'),windowEl=$('#threatWindow');
  if(!grid||!windowEl)return;
  const before=teamsPickingBeforeMe();
  const myNext=nextUserPickNumber(),current=currentDraftNumber();
  const top=bestAvailableForMe(1)[0]||null;

  if(!myNext){
    windowEl.textContent='Your next pick is unresolved';
    grid.innerHTML='<div class="intel-muted">Sleeper has not resolved your draft slot yet.</div>';
    return;
  }
  if(myNext<=current){
    windowEl.textContent='You are on the clock';
    grid.innerHTML='<div class="intel-muted">No managers pick before you right now.</div>';
    return;
  }

  windowEl.textContent=`${before.length} manager${before.length===1?'':'s'} pick before you • yours #${myNext}`;
  if(!before.length){
    grid.innerHTML='<div class="intel-muted">No other teams select before your next pick.</div>';
    return;
  }

  grid.innerHTML=before.map(x=>{
    const team=analyses.find(y=>String(y.team.rosterId)===String(x.roster.roster_id));
    if(!team)return '';
    const threat=threatForOpponent(team.team,team.a,x.next,top);
    const likely=threat.likely.slice(0,2);
    const threatensTop=!!top&&threat.topPositionThreat;
    const copy=threatensTop
      ?`${team.team.teamName} has a plausible ${top.player.pos} path and could take ${top.player.name} before your turn.`
      :`${team.team.teamName}'s strongest current roster signals are ${likely.filter(p=>p.plausible).slice(0,2).map(p=>p.pos).join(' / ')||'not strong enough to call'}.`;
    return `<div class="threat-card ${threat.level}">
      <div class="tc-head">
        <span class="tc-team">${esc(team.team.teamName)}</span>
        <span class="tc-risk">${threat.label}</span>
      </div>
      <div class="tc-pick">Picks #${x.next} • ${x.next-current} before your turn</div>
      <div class="tc-needs">${likely.map(p=>`<span>${p.pos} ${p.score}</span>`).join('')}</div>
      <div class="tc-copy">${esc(copy)}</div>
    </div>`;
  }).join('');
}

function draftPatternRecognition(team,a){
  const g=team.grade?.graded||[];
  const patterns=[];

  if(g.length>=3){
    const early=g.filter(x=>x.round<=4&&x.ranked);
    const late=g.filter(x=>x.round>=5&&x.ranked);
    const earlyAdh=early.length?early.filter(x=>Math.abs(x.delta||0)<=5).length/early.length:0;
    const lateAdh=late.length?late.filter(x=>Math.abs(x.delta||0)<=5).length/late.length:0;
    if(early.length>=2&&late.length>=2&&earlyAdh-lateAdh>=.35)
      patterns.push({kind:'warn',text:'Follows list early, freelances later'});
    if(late.length>=2&&lateAdh-earlyAdh>=.35)
      patterns.push({kind:'good',text:'Becomes more list-driven later'});
  }

  const reachesByPos={};
  for(const x of g){
    const pos=pickPosition(x.pick,x.ranked)||'UNK';
    if(!reachesByPos[pos])reachesByPos[pos]={reaches:0,total:0};
    reachesByPos[pos].total++;
    if(!x.ranked || (x.delta!=null&&x.delta<=-8))reachesByPos[pos].reaches++;
  }
  for(const [pos,v] of Object.entries(reachesByPos)){
    if(v.total>=2&&v.reaches>=2)
      patterns.push({kind:'bad',text:`Repeated ${pos} reaches`});
  }

  const c=a.c;
  const isMe=String(team.rosterId)===String(sleeperCtx.rosterId);
  if(c.RB>=4)patterns.push({kind:'warn',text:isMe?'RB-heavy build':'RB hoarder'});
  if(c.WR>=5)patterns.push({kind:'warn',text:isMe?'WR-heavy build':'WR hoarder'});
  if(c.QB>=2)patterns.push({kind:'warn',text:'Multiple-QB build'});
  if(c.TE>=2)patterns.push({kind:'warn',text:'Multiple-TE build'});

  // "Sniping" only applies to other managers.
  if(!isMe){
    const myPicks=myRawPicks().map(p=>Number(p.pick_no||0)).filter(Boolean);
    let snipes=0;
    for(const x of g){
      if(myPicks.includes(Number(x.pickNo)+1))snipes++;
    }
    if(snipes>=2)patterns.push({kind:'bad',text:`Repeatedly picks right before you (${snipes})`});
    else if(snipes===1)patterns.push({kind:'warn',text:'Has picked immediately before you'});
  }

  if(a.adherence>=75)patterns.push({kind:'good',text:'High list adherence'});
  if(a.offList.length>=2)patterns.push({kind:'bad',text:'Frequent off-list drafting'});
  if(a.steals.length>=3&&a.steals.length>a.reaches.length)
    patterns.push({kind:'good',text:'Patient value hunter'});

  if(!patterns.length)patterns.push({kind:'good',text:'No strong pattern yet'});
  return patterns.slice(0,5);
}
function whatThisMeansForYou(team,a){
  const isMe=String(team.rosterId)===String(sleeperCtx.rosterId);
  const likely=likelyNextPositions(team,a);

  if(isMe){
    const needs=rosterNeedsFromCounts(a.c||{}).slice(0,3);
    if(needs.length){
      return `Your current build points toward ${needs.map(x=>x.pos).join('/')} next, with ${likely.slice(0,2).map(x=>x.pos).join('/')} the most likely directions.`;
    }
    if(likely.length){
      return `Your roster is broadly covered. ${likely.slice(0,2).map(x=>x.pos).join('/')} are the most likely next directions based on your build.`;
    }
    return 'Your roster is broadly covered with no obvious forced position on the next pick.';
  }

  const myTop=bestAvailableForMe(3);
  const topPositions=new Set(myTop.map(x=>x.player.pos));
  const overlap=likely.filter(x=>topPositions.has(x.pos)&&x.score>=20);
  if(overlap.length){
    return `Likely to compete with you for ${overlap.map(x=>x.pos).join('/')} in the current tier.`;
  }

  const myProfile=myRosterProfile();
  const myNeeds=rosterNeedsFromCounts(myProfile.counts).map(x=>x.pos);
  const oppNeeds=likely.slice(0,2).map(x=>x.pos);
  const shared=myNeeds.filter(p=>oppNeeds.includes(p));
  if(shared.length)return `Shares your ${shared.join('/')} needs, so watch that position before your next turn.`;

  const unlikely=['QB','RB','WR','TE'].filter(p=>!oppNeeds.includes(p));
  if(unlikely.length)return `Less likely to attack ${unlikely.slice(0,2).join('/')} soon based on current build.`;
  return 'No obvious direct conflict with your current draft plan.';
}

function teamAnalysisPerspective(team){
  const me=String(team?.rosterId)===String(sleeperCtx.rosterId);
  return me?{
    me:true,
    readLabel:'Your draft:',
    projectionLabel:'Your likely next:',
    outlookLabel:'Your draft outlook:'
  }:{
    me:false,
    readLabel:'Read:',
    projectionLabel:'Likely next:',
    outlookLabel:'What this means for you:'
  };
}

let selectedLeagueTeamRosterId=null;
function teamPageRosterPlayers(rosterId){
  const roster=leagueRosters.find(r=>String(r.roster_id)===String(rosterId));
  return (roster?.players||[]).filter(Boolean).map(sleeperRosterPlayer);
}
function openLeagueTeam(rosterId){
  selectedLeagueTeamRosterId=String(rosterId);
  renderLeagueTeams();
}

function rosterPointsFor(roster){
  const s=roster?.settings||{};
  return Number(s.fpts||0)+Number(s.fpts_decimal||0)/100;
}
function teamSeasonStrengths(roster){
  const c=rosterPositionCounts(roster);
  const out=[];
  const add=(pos,count,goodAt,warnAt)=>out.push({
    pos,count,
    kind:count>=goodAt?'good':count>=warnAt?'warn':'bad',
    detail:count>=goodAt?'Strong depth':count>=warnAt?'Adequate depth':'Thin depth'
  });
  add('QB',c.QB,2,1);
  add('RB',c.RB,4,3);
  add('WR',c.WR,5,4);
  add('TE',c.TE,2,1);
  add('K',c.K,1,1);
  add('DEF',c.DEF,1,1);
  return out;
}
function isWeekFinalForHistory(week){
  // Conservative by design: the active NFL week is never archived as a final W/L.
  return Number(week)<currentWeekNumber();
}
function teamWeeklyResults(rosterId){
  const rows=[];
  for(const [weekKey,list] of Object.entries(seasonMatchupsByWeek||{})){
    const week=Number(weekKey);
    if(!isWeekFinalForHistory(week))continue;
    const mine=(list||[]).find(m=>String(m.roster_id)===String(rosterId));
    if(!mine||mine.matchup_id==null)continue;
    const opp=(list||[]).find(m=>String(m.matchup_id)===String(mine.matchup_id)&&String(m.roster_id)!==String(rosterId));
    if(!opp)continue;
    const myPts=Number(mine.points||0),oppPts=Number(opp.points||0);
    const result=myPts>oppPts?'win':myPts<oppPts?'loss':'tie';
    const oppRoster=leagueRosters.find(r=>String(r.roster_id)===String(opp.roster_id));
    rows.push({week,result,myPts,oppPts,oppName:rosterUserName(oppRoster)});
  }
  return rows.sort((a,b)=>b.week-a.week);
}
function teamTransactions(rosterId){
  return (currentTransactions||[])
    .filter(tx=>(tx.roster_ids||[]).some(id=>String(id)===String(rosterId)) ||
      Object.values(tx.adds||{}).some(id=>String(id)===String(rosterId)) ||
      Object.values(tx.drops||{}).some(id=>String(id)===String(rosterId)))
    .slice().sort((a,b)=>Number(b.created||0)-Number(a.created||0));
}
function teamCurrentMatchupSummary(rosterId,week=currentWeekNumber()){
  const {mine,opp}=matchupForRoster(rosterId,week);
  if(!mine||!opp)return null;
  const roster=leagueRosters.find(r=>String(r.roster_id)===String(rosterId));
  const oppRoster=leagueRosters.find(r=>String(r.roster_id)===String(opp.roster_id));
  if(!roster||!oppRoster)return null;
  const scoring=matchupScoringContext(roster,oppRoster,mine,opp,week);
  return {
    mine,opp,roster,oppRoster,scoring,
    opponent:rosterUserName(oppRoster),
    diff:scoring.diff,
    myTotal:scoring.myTotal,
    oppTotal:scoring.oppTotal,
    projected:scoring.projected,
    started:scoring.started
  };
}

function teamScoreTrend(rosterId){
  const results=teamWeeklyResults(rosterId).slice().sort((a,b)=>a.week-b.week);
  const scores=results.map(x=>x.myPts);
  if(!scores.length)return {avg:0,std:0,recentAvg:0,trend:'insufficient',delta:0,count:0};
  const avg=scores.reduce((s,x)=>s+x,0)/scores.length;
  const variance=scores.reduce((s,x)=>s+(x-avg)**2,0)/scores.length;
  const std=Math.sqrt(variance);
  const recent=scores.slice(-Math.min(3,scores.length));
  const prior=scores.slice(0,Math.max(0,scores.length-recent.length));
  const recentAvg=recent.reduce((s,x)=>s+x,0)/recent.length;
  const priorAvg=prior.length?prior.reduce((s,x)=>s+x,0)/prior.length:avg;
  const delta=recentAvg-priorAvg;
  const trend=scores.length<3?'insufficient':delta>=8?'rising':delta<=-8?'falling':'steady';
  return {avg,std,recentAvg,trend,delta,count:scores.length};
}
function teamLineupStability(rosterId){
  const weeks=Object.entries(seasonMatchupsByWeek||{}).map(([w,list])=>({week:Number(w),list}))
    .filter(x=>isWeekFinalForHistory(x.week)).sort((a,b)=>a.week-b.week);
  const sets=[];
  for(const x of weeks){
    const m=(x.list||[]).find(y=>String(y.roster_id)===String(rosterId));
    if(!m)continue;
    const starters=new Set((m.starters||[]).filter(Boolean).map(String));
    if(starters.size)sets.push({week:x.week,starters});
  }
  if(sets.length<2)return {score:null,label:'Not enough weeks',changes:0};
  let comparisons=0,totalRetention=0,changes=0;
  for(let i=1;i<sets.length;i++){
    const a=sets[i-1].starters,b=sets[i].starters;
    const overlap=[...a].filter(id=>b.has(id)).length;
    const denom=Math.max(a.size,b.size,1);
    totalRetention+=overlap/denom;
    changes+=denom-overlap;
    comparisons++;
  }
  const score=Math.round((totalRetention/comparisons)*100);
  return {score,label:score>=85?'Very stable':score>=70?'Mostly stable':score>=50?'Rotational':'High turnover',changes};
}
function teamTransactionTendencies(rosterId){
  const txs=teamTransactions(rosterId);
  let adds=0,drops=0,trades=0,waivers=0,freeAgents=0;
  for(const tx of txs){
    const type=String(tx.type||'');
    if(type==='trade')trades++;
    if(type==='waiver')waivers++;
    if(type==='free_agent')freeAgents++;
    for(const rid of Object.values(tx.adds||{}))if(String(rid)===String(rosterId))adds++;
    for(const rid of Object.values(tx.drops||{}))if(String(rid)===String(rosterId))drops++;
  }
  const churn=adds+drops;
  return {txs:txs.length,adds,drops,trades,waivers,freeAgents,churn};
}
function teamPositionInvestment(roster){
  const c=rosterPositionCounts(roster);
  const total=Math.max(1,Object.values(c).reduce((s,x)=>s+x,0));
  const entries=Object.entries(c).map(([pos,n])=>({pos,n,pct:n/total})).sort((a,b)=>b.n-a.n);
  return {counts:c,top:entries[0]||null,entries,total};
}
function teamManagerTendencyProfile(roster){
  const rosterId=String(roster?.roster_id||'');
  const score=teamScoreTrend(rosterId),stability=teamLineupStability(rosterId),tx=teamTransactionTendencies(rosterId),invest=teamPositionInvestment(roster);
  const results=teamWeeklyResults(rosterId);
  const recent=results.slice().sort((a,b)=>b.week-a.week).slice(0,3);
  const wins=recent.filter(x=>x.result==='win').length,losses=recent.filter(x=>x.result==='loss').length;
  const chips=[],sentences=[];

  if(score.trend==='rising'){chips.push({kind:'hot',text:'Scoring trend rising'});sentences.push('Recent scoring is running meaningfully above the team’s earlier-season baseline.');}
  else if(score.trend==='falling'){chips.push({kind:'cold',text:'Scoring trend falling'});sentences.push('Recent scoring has slipped below the team’s earlier-season baseline.');}
  else if(score.count>=3){chips.push({kind:'active',text:'Scoring trend steady'});sentences.push('Scoring has been relatively steady compared with the team’s earlier weeks.');}

  if(score.std>=22){chips.push({kind:'warn',text:'Boom / bust scoring'});sentences.push('Weekly scoring has been volatile, with a relatively wide spread between outcomes.');}
  else if(score.count>=3){chips.push({kind:'active',text:'Consistent scorer'});sentences.push('Weekly scoring has been comparatively consistent.');}

  if(stability.score!=null){
    if(stability.score>=85){chips.push({kind:'active',text:'Stable lineup manager'});sentences.push('The manager tends to keep a stable starting lineup from week to week.');}
    else if(stability.score<60){chips.push({kind:'warn',text:'Frequent lineup changes'});sentences.push('The manager rotates starters relatively often between finalized weeks.');}
  }

  if(tx.churn>=6){chips.push({kind:'active',text:'Aggressive roster churn'});sentences.push('The loaded transaction window shows an aggressive add/drop approach.');}
  else if(tx.churn===0&&tx.txs===0){chips.push({kind:'active',text:'Quiet roster manager'});sentences.push('No roster activity appears in the loaded transaction window.');}
  if(tx.waivers>=2)chips.push({kind:'active',text:'Active on waivers'});
  if(tx.trades>=1)chips.push({kind:'active',text:'Willing trader'});

  if(invest.top&&invest.top.n>=5)chips.push({kind:'active',text:`${invest.top.pos}-heavy roster`});
  if(wins>=2)chips.push({kind:'hot',text:`Recent form: ${wins}-${losses}`});
  else if(losses>=2)chips.push({kind:'cold',text:`Recent form: ${wins}-${losses}`});

  if(!sentences.length)sentences.push('There is not enough finalized season data yet to establish a strong manager tendency profile.');

  return {score,stability,tx,invest,recent,wins,losses,chips:chips.slice(0,8),summary:sentences.join(' ')};
}
function renderTeamTrends(roster){
  const metrics=$('#teamTrendMetrics'),profile=$('#teamTrendProfile'),chips=$('#teamTrendChips'),status=$('#teamPageTrendStatus');
  if(!metrics||!profile||!chips)return;
  if(!roster){
    metrics.innerHTML='';profile.innerHTML='<div class="empty">Season trend data unavailable.</div>';chips.innerHTML='';return;
  }
  const t=teamManagerTendencyProfile(roster);
  if(status)status.textContent=`${t.score.count} finalized week${t.score.count===1?'':'s'} • loaded transaction window`;
  const trendLabel=t.score.trend==='rising'?'Rising':t.score.trend==='falling'?'Falling':t.score.trend==='steady'?'Steady':'Pending';
  metrics.innerHTML=[
    {l:'Scoring Avg',v:t.score.count?t.score.avg.toFixed(1):'—',d:`${t.score.count} weeks`},
    {l:'Consistency',v:t.score.count>=2?t.score.std.toFixed(1):'—',d:'weekly σ'},
    {l:'Trend',v:trendLabel,d:t.score.count>=3?`${t.score.delta>=0?'+':''}${t.score.delta.toFixed(1)} recent vs prior`:'need 3+ weeks'},
    {l:'Lineup Stability',v:t.stability.score!=null?`${t.stability.score}%`:'—',d:t.stability.label},
    {l:'Roster Churn',v:String(t.tx.churn),d:`${t.tx.adds} adds • ${t.tx.drops} drops`},
    {l:'Transactions',v:String(t.tx.txs),d:`${t.tx.waivers} waivers • ${t.tx.trades} trades`}
  ].map(x=>`<div class="team-trend-metric"><span>${esc(x.l)}</span><b>${esc(x.v)}</b><small>${esc(x.d)}</small></div>`).join('');
  profile.innerHTML=`<b>Manager read:</b> ${esc(t.summary)}`;
  chips.innerHTML=t.chips.length?t.chips.map(x=>`<span class="team-trend-chip ${x.kind}">${esc(x.text)}</span>`).join(''):'<span class="team-trend-chip">No strong tendency yet</span>';
}
function renderLeagueTeamSeason(team,roster){
  const snapshot=$('#teamPageSeasonSnapshot'),strength=$('#teamPageStrengthGrid'),weeks=$('#teamPageWeeklyResults'),activity=$('#teamPageActivity');
  if(!snapshot||!strength||!weeks||!activity)return;

  if(!roster){
    snapshot.innerHTML='<div class="empty">Season roster data unavailable.</div>';
    strength.innerHTML='';weeks.innerHTML='';activity.innerHTML='';
    scheduleTeamTrends(null);
    return;
  }

  const week=currentWeekNumber();
  const matchup=teamCurrentMatchupSummary(team.rosterId,week);
  const pf=rosterPointsFor(roster);
  const txs=teamTransactions(team.rosterId);
  const results=teamWeeklyResults(team.rosterId);
  const warnings=seasonWarnings(roster);
  const bad=warnings.filter(x=>x.kind==='bad').length,warn=warnings.filter(x=>x.kind==='warn').length;

  $('#teamPagePointsFor').textContent=pf.toFixed(2);
  $('#teamPageSeasonStatus').textContent=nflState?`NFL Week ${week}`:'Sleeper season data';
  const matchupDetail=!matchup
    ?'No paired matchup loaded'
    :matchup.projected
      ?`${matchup.myTotal.toFixed(2)} - ${matchup.oppTotal.toFixed(2)} projected`
      :matchup.started
        ?`${matchup.myTotal.toFixed(2)} - ${matchup.oppTotal.toFixed(2)} live`
        :'Projections loading';
  snapshot.innerHTML=[
    {l:'Record',v:rosterRecord(roster),d:`${pf.toFixed(2)} points for`},
    {l:'Current Matchup',v:matchup?uclMatchupNotation(week,roster.roster_id,matchup.opponent):'Awaiting opponent',d:matchupDetail,venue:matchup?uclVenuePill(week,roster.roster_id):''},
    {l:'Roster Health',v:bad?`${bad} major issue${bad===1?'':'s'}`:warn?`${warn} warning${warn===1?'':'s'}`:'Covered',d:bad?'Needs attention':warn?'Monitor depth/lineup':'No major concern'},
    {l:'Recent Moves',v:String(txs.length),d:'Loaded waiver/free-agent/trade activity'}
  ].map(x=>`<div class="team-season-item"><span>${esc(x.l)}</span><b>${esc(x.v)} ${x.venue||''}</b><small>${esc(x.d)}</small></div>`).join('');

  strength.innerHTML=teamSeasonStrengths(roster).map(x=>`<div class="team-strength ${x.kind}"><span>${x.pos}</span><b>${x.count}</b><small>${esc(x.detail)}</small></div>`).join('');
  scheduleTeamTrends(roster);

  $('#teamPageResultsStatus').textContent=results.length?`${results.length} week${results.length===1?'':'s'} loaded`:'No completed weeks loaded';
  weeks.innerHTML=results.length?results.map(x=>`<div class="team-week-row ${x.result}">
    <span>Week ${x.week}</span>
    <div><b>${esc(x.result==='win'?'W':x.result==='loss'?'L':'T')} ${esc(uclMatchupNotation(x.week,roster.roster_id,x.oppName))} ${uclVenuePill(x.week,roster.roster_id)}</b><small>${x.myPts.toFixed(2)} PF • ${x.oppPts.toFixed(2)} PA</small></div>
    <span class="week-score">${x.myPts.toFixed(2)}-${x.oppPts.toFixed(2)}</span>
  </div>`).join(''):'<div class="empty">Completed weekly results will appear as Sleeper matchup data becomes available.</div>';

  $('#teamPageActivityStatus').textContent=txs.length?`${txs.length} recent move${txs.length===1?'':'s'}`:'No recent moves';
  activity.innerHTML=txs.length?txs.slice(0,8).map(tx=>{
    const moves=transactionMoves(tx).filter(m=>String(m.rosterId)===String(team.rosterId));
    const type=String(tx.type||'transaction').replace(/_/g,' ');
    const summary=moves.length?moves.map(m=>`${m.kind==='add'?'+':'−'} ${m.player}`).join(' • '):'Trade / roster transaction';
    const detail=moves.length?moves.map(m=>`${m.kind==='add'?'Added':'Dropped'} ${m.player} (${m.pos})`).join(' • '):transactionImpact(tx);
    return `<div class="team-activity-row">
      <span class="ta-date">${esc(type)}${transactionTimestamp(tx)?` • ${esc(transactionTimestamp(tx))}`:''}</span>
      <b>${esc(summary)}</b><small>${esc(detail)}</small>
    </div>`;
  }).join(''):'<div class="empty">No recent transaction activity loaded for this team.</div>';
}
let teamsTrendRenderToken=0;
function scheduleTeamTrends(roster){
  const token=++teamsTrendRenderToken;
  const run=()=>{
    if(token!==teamsTrendRenderToken)return;
    if(!$('#teamsView')?.classList.contains('active'))return;
    safeUiCall('team-trends',()=>renderTeamTrends(roster));
  };
  if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:350});
  else setTimeout(run,30);
}
function renderLeagueTeamPage(team){
  if(!team)return;
  const roster=leagueRosters.find(r=>String(r.roster_id)===String(team.rosterId));
  const me=String(team.rosterId)===String(sleeperCtx.rosterId);

  $('#teamPageName').textContent=`${team.teamName}${me?' • YOU':''}`;
  const leagueRankRows=standingsOrderFromRecords((leagueRosters||[]).map(r=>({
    roster:r,rosterId:String(r.roster_id),name:rosterUserName(r),
    wins:Number(r.settings?.wins||0),losses:Number(r.settings?.losses||0),ties:Number(r.settings?.ties||0),
    pf:rosterPointsFor(r)
  })));
  const leagueRank=Math.max(1,leagueRankRows.findIndex(x=>String(x.rosterId)===String(team.rosterId))+1);
  $('#teamPageMeta').textContent=`${team.username} • League Rank: ${ordinal(leagueRank)} • Live Roster`;

  const players=teamPageRosterPlayers(team.rosterId);
  const starterSet=new Set((roster?.starters||[]).filter(Boolean).map(String));
  const positionOrder={QB:0,RB:1,WR:2,TE:3,K:4,DEF:5};
  const sortedPlayers=players.map(p=>({
    p,
    starter:starterSet.has(String(p.id)),
    value:typeof tradePlayerValue==='function'?tradePlayerValue(p):0
  })).sort((a,b)=>{
    const posA=positionOrder[a.p.pos]??99,posB=positionOrder[b.p.pos]??99;
    if(posA!==posB)return posA-posB;
    if(a.starter!==b.starter)return a.starter?-1:1;
    if(b.value!==a.value)return b.value-a.value;
    return String(a.p.name||'').localeCompare(String(b.p.name||''));
  });
  $('#teamPagePlayers').textContent=players.length;
  $('#teamPageStarters').textContent=starterSet.size;
  $('#teamPageBench').textContent=Math.max(0,players.length-starterSet.size);
  $('#teamPageRecord').textContent=rosterRecord(roster);
  $('#teamPagePointsFor').textContent=roster?rosterPointsFor(roster).toFixed(2):'—';
  const finalizedResults=roster?teamWeeklyResults(roster.roster_id):[];
  const pointsAgainst=finalizedResults.reduce((sum,x)=>sum+Number(x.oppPts||0),0);
  $('#teamPagePointsAgainst').textContent=finalizedResults.length?pointsAgainst.toFixed(2):'—';
  $('#teamPageRosterCount').textContent=`${players.length} players`;
  $('#teamPageRoster').innerHTML=sortedPlayers.length?sortedPlayers.map(({p,starter})=>{
    const bye=p.bye==null?'':` • Bye ${p.bye}`;
    return `<div class="team-page-player ${starter?'starter':''}">
      <b>${esc(p.name)}</b>
      <small>${esc(p.team||'—')} • ${esc(p.pos||'—')}${bye}</small>
      <span class="tp-role">${starter?'Starter':'Bench / Roster'}</span>
    </div>`;
  }).join(''):'<div class="empty">No roster players available yet.</div>';

  renderLeagueTeamSeason(team,roster);


}
