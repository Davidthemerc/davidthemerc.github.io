function rosterUserName(roster){
  const u=leagueUserById(roster?.owner_id);
  const team=String(u?.metadata?.team_name||'').trim();
  return team||u?.display_name||u?.username||`Roster ${roster?.roster_id??'?'}`;
}
function transactionTeamName(rosterId){
  const roster=(leagueRosters||[]).find(r=>String(r?.roster_id)===String(rosterId));
  return roster?rosterUserName(roster):`Roster ${rosterId??'?'}`;
}
function transactionPlayerName(playerId){
  const player=sleeperRosterPlayer(playerId);
  return player?.name||`Player ${playerId??'?'}`;
}
function transactionTimestamp(tx){
  let raw=Number(tx?.created??tx?.timestamp??tx?.status_updated??0);
  if(!Number.isFinite(raw)||raw<=0)return '';
  if(raw<1e12)raw*=1000;
  const d=new Date(raw);
  if(Number.isNaN(d.getTime()))return '';
  try{
    return d.toLocaleString([],{
      month:'short',
      day:'numeric',
      hour:'numeric',
      minute:'2-digit'
    });
  }catch(e){
    return d.toLocaleString();
  }
}
function rosterRecord(roster){
  const s=roster?.settings||{};
  const w=Number(s.wins||0),l=Number(s.losses||0),t=Number(s.ties||0);
  return `${w}-${l}${t?`-${t}`:''}`;
}
function currentWeekNumber(){
  const week=Number(nflState?.week||verifiedLeague?.settings?.leg||1);
  return Math.max(1,week||1);
}
function seasonDisplayWeek(){
  const current=currentWeekNumber();
  return Math.max(1,Math.min(14,Number(selectedSeasonWeek)||current));
}
function seasonDisplayMatchups(week=seasonDisplayWeek()){
  const current=currentWeekNumber();
  if(Number(week)===Number(current))return currentMatchups||[];
  return seasonMatchupsByWeek?.[week]||[];
}
function matchupForRoster(rosterId,week=seasonDisplayWeek()){
  const list=seasonDisplayMatchups(week);
  const mine=list.find(m=>String(m.roster_id)===String(rosterId));
  if(!mine)return {mine:null,opp:null};
  const opp=list.find(m=>m.matchup_id!=null&&String(m.matchup_id)===String(mine.matchup_id)&&String(m.roster_id)!==String(rosterId));
  return {mine,opp};
}
function populateSeasonWeekSelector(){
  const sel=$('#seasonWeekSelect');if(!sel)return;
  const current=currentWeekNumber(),selected=seasonDisplayWeek();
  const options=[];
  for(let w=1;w<=14;w++)options.push(`<option value="${w}"${w===selected?' selected':''}>Week ${w}${w===current?' • Current':''}</option>`);
  sel.innerHTML=options.join('');
  sel.disabled=seasonWeekSelectionBusy;
}
async function selectSeasonWeek(week){
  week=Math.max(1,Math.min(14,Number(week)||currentWeekNumber()));
  selectedSeasonWeek=week;
  seasonWeekSelectionBusy=true;populateSeasonWeekSelector();
  try{
    if(!Array.isArray(seasonMatchupsByWeek[week])||!seasonMatchupsByWeek[week].length){
      const r=await sleeperGetSafe(`/league/${SLEEPER_LEAGUE_ID}/matchups/${week}`,{
        ttlMs:week===currentWeekNumber()?30000:6*60*60*1000,
        force:true,fallback:seasonMatchupsByWeek[week]||[],label:`Week ${week} matchups`
      });
      if(r.ok)seasonMatchupsByWeek[week]=dedupeMatchupList(r.value);
    }
    try{await syncCurrentWeekProjections(week,false);}catch(e){}
    try{await syncWeeklyStats(week,false);}catch(e){}
  }finally{
    seasonWeekSelectionBusy=false;populateSeasonWeekSelector();renderSeasonCompanion();
  }
}
function sleeperRosterPlayer(id){
  const playerId=String(id||'');
  // Rendering must be read-only. Player metadata is learned/persisted during
  // explicit sync/ingestion paths; a roster lookup must never serialize and
  // rewrite the discovered-player cache. Teams calls this helper many times.
  const db=discoveredSleeperPlayers[playerId]||playerMetadataFallback(playerId)||{};
  const name=db.full_name||[db.first_name,db.last_name].filter(Boolean).join(' ')||String(playerId);
  const pos=String(db.position||'').toUpperCase()==='DST'?'DEF':String(db.position||'').toUpperCase();
  const ranked=PLAYERS.find(p=>normName(p.name)===normName(name));
  const team=String(db.team||'—').toUpperCase();
  const currentTeamBye=nflTeamByeWeek(team);
  return {
    id:playerId,name,pos,team,
    rank:ranked?.rank||null,posRank:ranked?.posRank||null,proj:ranked?.proj??null,
    bye:currentTeamBye??ranked?.bye??null,
    status:String(db.injury_status||db.status||''),
    source:discoveredSleeperPlayers[playerId]?'saved':'fallback'
  };
}
function rosterReserveIds(roster){
  return new Set((roster?.reserve||[]).filter(Boolean).map(String));
}
function rosterAutoSubIds(roster){
  const ids=new Set();
  const sources=[roster?.auto_subs,roster?.autosubs,roster?.metadata?.auto_subs,roster?.metadata?.autosubs];
  for(const src of sources){
    if(Array.isArray(src))for(const x of src){
      if(typeof x==='string'||typeof x==='number')ids.add(String(x));
      else if(x&&typeof x==='object')for(const k of ['player_id','sub_id','starter_id'])if(x[k]!=null)ids.add(String(x[k]));
    }else if(src&&typeof src==='object'){
      for(const [k,v] of Object.entries(src)){
        if(k)ids.add(String(k));
        if(typeof v==='string'||typeof v==='number')ids.add(String(v));
        else if(v&&typeof v==='object')for(const key of ['player_id','sub_id','starter_id'])if(v[key]!=null)ids.add(String(v[key]));
      }
    }
  }
  return ids;
}
function seasonPlayerHtml(p,{showProjection=false,reserveSet=null,autoSubSet=null,week=currentWeekNumber()}={}){
  const proj=showProjection?currentWeekProjectionForPlayer(p.id,week):null;
  const right=showProjection&&proj!=null?`${Number(proj).toFixed(2)} PROJ`:(p.rank?`#${p.rank}`:'NR');
  const badges=[];
  if(reserveSet?.has(String(p.id)))badges.push('<span class="season-player-status ir">IR</span>');
  if(autoSubSet?.has(String(p.id)))badges.push('<span class="season-player-status autosub">AUTO SUB</span>');
  return `<div class="season-player"><div><b>${esc(p.name)}${badges.length?' '+badges.join(' '):''}</b><small>${esc(p.team)} • ${esc(p.pos||'—')}${p.posRank?` • ${esc(p.posRank)}`:''}</small></div><div class="season-player-rank">${esc(right)}</div></div>`;
}

function seasonWarnings(roster,playerCache=null){
  const lookup=id=>playerCache?.get(String(id))||sleeperRosterPlayer(id);
  const players=(roster?.players||[]).map(lookup);
  const counts={QB:0,RB:0,WR:0,TE:0,K:0,DEF:0};
  players.forEach(p=>{if(counts[p.pos]!==undefined)counts[p.pos]++;});
  const out=[];
  const floors={QB:1,RB:2,WR:3};

  // Match Roster Needs & Moves:
  // Questionable-only = precautionary availability risk.
  // Doubtful/Out/IR/reserve-type = actionable availability concern.
  for(const pos of ['QB','RB','WR']){
    const h=typeof waiverPositionHealthCounts==='function'
      ?waiverPositionHealthCounts(roster,pos,playerCache)
      :{total:counts[pos],secure:counts[pos],questionable:0,severe:0,available:counts[pos]};
    const floor=floors[pos];
    if(h.severe>0&&h.secure<=floor){
      out.push({
        kind:'bad',
        healthState:'action',
        pos,
        text:`${pos} availability problem: ${h.secure} healthy • ${h.questionable} questionable • ${h.severe} doubtful/out/reserve`
      });
    }else if(h.questionable>0&&h.secure<=floor){
      out.push({
        kind:'warn',
        healthState:'potential',
        pos,
        text:`Potential ${pos} availability problem: ${h.secure} healthy • ${h.questionable} questionable`
      });
    }else{
      out.push({kind:'good',healthState:'good',pos,text:`${pos} availability covered`});
    }
  }

  // Single-slot positions: Questionable is monitor-only; severe designation is actionable.
  for(const pos of ['K','DEF']){
    const h=typeof waiverPositionHealthCounts==='function'
      ?waiverPositionHealthCounts(roster,pos,playerCache)
      :{total:counts[pos],secure:counts[pos],questionable:0,severe:0,available:counts[pos]};
    if(!h.total)out.push({kind:'warn',healthState:'action',pos,text:`${pos} missing`});
    else if(h.secure<1&&h.severe>0)out.push({kind:'bad',healthState:'action',pos,text:`${pos} availability problem: ${h.severe} doubtful/out/reserve`});
    else if(h.secure<1&&h.questionable>0)out.push({kind:'warn',healthState:'potential',pos,text:`Potential ${pos} availability problem: ${h.questionable} questionable`});
  }

  const empty=(verifiedLeague?.roster_positions||[]).filter(x=>x!=='BN').length-(roster?.starters||[]).filter(Boolean).length;
  if(empty>0)out.push({kind:'bad',healthState:'action',text:`${empty} starter slot${empty===1?'':'s'} empty`});
  if(!out.some(x=>x.kind==='bad')&&!out.some(x=>x.kind==='warn'))return [{kind:'good',healthState:'good',text:'Roster covered'}];
  return out.filter(x=>x.kind!=='good');
}

function rosterPositionCounts(roster,playerCache=null){
  const counts={QB:0,RB:0,WR:0,TE:0,K:0,DEF:0};
  const lookup=id=>playerCache?.get(String(id))||sleeperRosterPlayer(id);
  for(const id of roster?.players||[]){
    const p=lookup(id);
    if(counts[p.pos]!==undefined)counts[p.pos]++;
  }
  return counts;
}
function starterPositionCounts(roster,playerCache=null){
  const counts={QB:0,RB:0,WR:0,TE:0,K:0,DEF:0};
  const lookup=id=>playerCache?.get(String(id))||sleeperRosterPlayer(id);
  for(const id of roster?.starters||[]){
    if(!id)continue;
    const p=lookup(id);
    if(counts[p.pos]!==undefined)counts[p.pos]++;
  }
  return counts;
}

function seasonRosterPressure(roster,playerCache=null){
  const c=rosterPositionCounts(roster,playerCache),out=[];
  const add=(label,value,detail,kind='good')=>out.push({label,value,detail,kind});
  const floors={QB:1,RB:2,WR:3};

  for(const pos of ['QB','RB','WR']){
    const h=typeof waiverPositionHealthCounts==='function'
      ?waiverPositionHealthCounts(roster,pos,playerCache)
      :{total:c[pos],secure:c[pos],questionable:0,severe:0,available:c[pos]};
    const floor=floors[pos];
    const value=h.questionable||h.severe
      ?`${h.secure} healthy • ${h.questionable} Q • ${h.severe} out`
      :`${h.secure} healthy`;
    if(h.severe>0&&h.secure<=floor){
      add(pos,value,'Actionable availability concern — add/drop or contingency planning may be needed.','bad');
    }else if(h.questionable>0&&h.secure<=floor){
      add(pos,value,'Potential problem — monitor Questionable designations; contingency options may be useful.','warn');
    }else{
      add(pos,value,`${pos} availability covered`,'good');
    }
  }

  // FLEX pool counts Questionable as available for now, while surfacing them in the position cards above.
  const flexHealth=['RB','WR','TE'].map(pos=>typeof waiverPositionHealthCounts==='function'
    ?waiverPositionHealthCounts(roster,pos,playerCache)
    :{secure:c[pos],questionable:0,severe:0,available:c[pos]});
  const flexAvailable=flexHealth.reduce((n,h)=>n+h.available,0);
  const flexSecure=flexHealth.reduce((n,h)=>n+h.secure,0);
  const flexQuestionable=flexHealth.reduce((n,h)=>n+h.questionable,0);
  const flexSevere=flexHealth.reduce((n,h)=>n+h.severe,0);
  const flexValue=flexQuestionable||flexSevere
    ?`${flexSecure} healthy • ${flexQuestionable} Q • ${flexSevere} out`
    :`${flexSecure} healthy`;
  add('FLEX pool',flexValue,
      flexSevere>0&&flexSecure<6?'Actionable FLEX availability pressure':
      flexQuestionable>0&&flexSecure<6?'Potential FLEX availability pressure — monitor Questionable players':
      flexAvailable<6?'Shallow FLEX inventory':flexAvailable<8?'Moderate FLEX depth':'Strong FLEX inventory',
      flexSevere>0&&flexSecure<6?'bad':(flexQuestionable>0&&flexSecure<6)||flexAvailable<8?'warn':'good');

  for(const pos of ['K','DEF']){
    const h=typeof waiverPositionHealthCounts==='function'
      ?waiverPositionHealthCounts(roster,pos,playerCache)
      :{total:c[pos],secure:c[pos],questionable:0,severe:0};
    if(!h.total)add(pos,'Missing',`No ${pos==='K'?'kicker':'defense'} rostered`,'warn');
    else if(h.secure<1&&h.severe>0)add(pos,'Unavailable',`${h.severe} doubtful/out/reserve`,'bad');
    else if(h.secure<1&&h.questionable>0)add(pos,'Questionable','Potential problem — monitor status','warn');
  }
  return out;
}

function seasonWeeklyWatch(roster,oppRoster,mineMatch,oppMatch,scoringOverride=null){
  const items=[];
  const warnings=seasonWarnings(roster);
  warnings.forEach(w=>{
    if(w.healthState==='potential')items.push({kind:'warn',title:w.text,detail:'Precautionary only: monitor the Questionable designations before lineup lock and keep contingency options in mind.'});
    else if(w.kind==='bad')items.push({kind:'bad',title:w.text,detail:'This is an actionable roster/lineup availability problem from your current Sleeper roster.'});
    else if(w.kind==='warn')items.push({kind:'warn',title:w.text,detail:'Worth monitoring before lineup lock.'});
  });

  const starterCount=(roster?.starters||[]).filter(Boolean).length;
  const required=(verifiedLeague?.roster_positions||[]).filter(x=>x!=='BN').length;
  if(required&&starterCount<required)items.unshift({kind:'bad',title:`${required-starterCount} starter slot${required-starterCount===1?'':'s'} open`,detail:'Your current Sleeper lineup is not fully filled.'});

  if(mineMatch&&oppMatch&&oppRoster){
    const week=currentWeekNumber(),scoring=scoringOverride||matchupScoringContext(roster,oppRoster,mineMatch,oppMatch,week);
    if(scoring.projected){
      const diff=scoring.diff;
      items.push({kind:Math.abs(diff)<3?'warn':diff>0?'good':'warn',title:Math.abs(diff)<3?'Projected matchup is close':diff>0?`Projected edge +${diff.toFixed(1)}`:`Projected deficit ${Math.abs(diff).toFixed(1)}`,detail:`Sleeper Week ${week} starter projections: ${scoring.myTotal.toFixed(2)} to ${scoring.oppTotal.toFixed(2)}.`});
    }else if(scoring.started){
      const diff=scoring.diff;
      if(Math.abs(diff)>=20)items.push({kind:diff<0?'warn':'good',title:diff<0?`Trailing by ${Math.abs(diff).toFixed(1)}`:`Leading by ${diff.toFixed(1)}`,detail:'Current Sleeper matchup scoring.'});
      else items.push({kind:'warn',title:'Matchup currently close',detail:`Current score margin is ${Math.abs(diff).toFixed(1)} points.`});
    }else{
      items.push({kind:'warn',title:'Pregame projections loading',detail:`Week ${week} has not started. The matchup will show projected totals as soon as saved or live projection data is available.`});
    }
  }

  if(oppRoster){
    const mineC=rosterPositionCounts(roster),oppC=rosterPositionCounts(oppRoster);
    const shared=[];
    for(const p of ['RB','WR','QB','TE']){
      if((mineC[p]||0)<=(oppC[p]||0))shared.push(p);
    }
    if(shared.length)items.push({kind:'warn',title:`Opponent depth edge: ${shared.slice(0,2).join('/')}`,detail:'Based on roster counts, not external player projections.'});
  }

  if(!items.length)items.push({kind:'good',title:'No major roster warning',detail:'Your roster is covered at the required positions.'});
  return items.slice(0,6);
}
function opponentSeasonRead(oppRoster){
  if(!oppRoster)return [];
  const c=rosterPositionCounts(oppRoster);
  const s=oppRoster.settings||{};
  const pf=Number(s.fpts||0)+Number(s.fpts_decimal||0)/100;
  const starters=(oppRoster.starters||[]).filter(Boolean).length;
  const flex=c.RB+c.WR+c.TE;
  const t=teamManagerTendencyProfile(oppRoster);
  const trend=t.score.trend==='rising'?'Rising':t.score.trend==='falling'?'Falling':t.score.trend==='steady'?'Steady':'Pending';
  const activity=t.tx.churn>=6?'High churn':t.tx.churn>=2?'Moderate churn':'Low churn';
  return [
    {label:'Record',value:rosterRecord(oppRoster),detail:`${pf.toFixed(2)} points for`},
    {label:'Scoring Trend',value:trend,detail:t.score.count>=3?`${t.score.delta>=0?'+':''}${t.score.delta.toFixed(1)} recent vs prior`:'Needs more finalized weeks'},
    {label:'Consistency',value:t.score.count>=2?t.score.std.toFixed(1):'—',detail:t.score.std>=22?'Boom/bust scoring profile':'More stable weekly scoring'},
    {label:'Lineup Style',value:t.stability.score!=null?`${t.stability.score}% stable`:'Pending',detail:t.stability.label},
    {label:'Roster Activity',value:activity,detail:`${t.tx.adds} adds • ${t.tx.drops} drops • ${t.tx.trades} trades`},
    {label:'Roster Shape',value:`${c.RB} RB / ${c.WR} WR`,detail:`${c.QB} QB • ${c.TE} TE • ${flex} FLEX-eligible`},
    {label:'Recent Form',value:t.recent.length?`${t.wins}-${t.losses}`:'—',detail:`Last ${t.recent.length||0} finalized weeks`},
    {label:'Current Starters',value:String(starters),detail:'Sleeper lineup slots currently populated'}
  ];
}
function renderSeasonIntelligence(roster,oppRoster,mine,opp,scoringOverride=null){
  const state=$('#seasonIntelState'),watch=$('#seasonWatchList'),oppGrid=$('#seasonOpponentGrid');
  if(!state||!watch||!oppGrid)return;

  state.textContent=`Week ${seasonDisplayWeek()} • Sleeper roster data`;
  const items=seasonWeeklyWatch(roster,oppRoster,mine,opp,scoringOverride);
  watch.innerHTML=items.map((x,i)=>`<div class="season-watch-item ${x.kind}">
    <div class="sev">${x.kind==='bad'?'!':x.kind==='warn'?'?':'✓'}</div>
    <div><b>${esc(x.title)}</b><small>${esc(x.detail)}</small></div>
  </div>`).join('');


  $('#seasonOpponentLabel').textContent=oppRoster?rosterUserName(oppRoster):'Opponent pending';
  const reads=opponentSeasonRead(oppRoster);
  oppGrid.innerHTML=reads.length?reads.map(x=>`<div class="season-opponent-item">
    <span>${esc(x.label)}</span><b>${esc(x.value)}</b><small>${esc(x.detail)}</small>
  </div>`).join(''):'<div class="empty">Sleeper has not published an opponent for this week yet.</div>';
}

function matchupPlayerPoints(matchup,playerId){
  if(!matchup||!playerId)return 0;
  const map=matchup.players_points||{};
  const v=map[playerId];
  return Number.isFinite(Number(v))?Number(v):0;
}
function starterSlotsForRoster(roster,matchup=null){
  const leagueSlots=(verifiedLeague?.roster_positions||[]).filter(x=>String(x).toUpperCase()!=='BN');
  const starters=matchupStarterIds(roster,matchup);
  return starters.map((id,i)=>({
    id,
    slot:String(leagueSlots[i]||sleeperRosterPlayer(id).pos||'START').toUpperCase()
  }));
}
function matchupStarterTotal(roster,matchup){
  return starterSlotsForRoster(roster,matchup).reduce((sum,x)=>sum+matchupPlayerPoints(matchup,x.id),0);
}
function matchupBenchTotal(roster,matchup){
  const starters=new Set(matchupStarterIds(roster,matchup));
  return matchupPlayerIds(roster,matchup).filter(id=>!starters.has(String(id))).reduce((sum,id)=>sum+matchupPlayerPoints(matchup,id),0);
}
function normalizedMatchupSlots(roster,matchup=null,playerCache=null){
  const lookup=id=>playerCache?.get(String(id))||sleeperRosterPlayer(id);
  return starterSlotsForRoster(roster,matchup).map((x,i)=>{
    const p=lookup(x.id);
    let slot=x.slot;
    if(slot==='FLEX'||slot==='W/R/T'||slot==='WRT')slot='FLEX';
    if(slot==='DST')slot='DEF';
    return {...x,index:i,player:p,slot};
  });
}

function finalizedStarterPositionAverages(rosterId){
  const positions=['QB','RB','WR','TE','K','DEF'];
  const totals=Object.fromEntries(positions.map(pos=>[pos,0]));
  const counts=Object.fromEntries(positions.map(pos=>[pos,0]));
  const weeks=Object.fromEntries(positions.map(pos=>[pos,0]));
  for(const [weekKey,list] of Object.entries(seasonMatchupsByWeek||{})){
    const week=Number(weekKey);
    if(!isWeekFinalForHistory(week))continue;
    const m=(list||[]).find(x=>String(x.roster_id)===String(rosterId));
    if(!m)continue;
    const roster=leagueRosters.find(r=>String(r.roster_id)===String(rosterId));
    if(!roster)continue;
    const weekTotals=Object.fromEntries(positions.map(pos=>[pos,0]));
    const weekCounts=Object.fromEntries(positions.map(pos=>[pos,0]));
    for(const starter of normalizedMatchupSlots(roster,m)){
      let pos=String(starter.slot||'').toUpperCase();
      if(pos==='FLEX')pos=String(starter.player?.pos||'').toUpperCase();
      if(pos==='DST')pos='DEF';
      if(!positions.includes(pos))continue;
      weekTotals[pos]+=matchupPlayerPoints(m,starter.id);
      weekCounts[pos]++;
    }
    for(const pos of positions){
      if(!weekCounts[pos])continue;
      totals[pos]+=weekTotals[pos]; counts[pos]+=weekCounts[pos]; weeks[pos]++;
    }
  }
  const out={};
  for(const pos of positions)out[pos]={avg:weeks[pos]?totals[pos]/weeks[pos]:null,weeks:weeks[pos],starterSamples:counts[pos]};
  return out;
}
function currentZeroPointStarters(roster,matchup){
  return normalizedMatchupSlots(roster,matchup).filter(x=>Math.abs(matchupPlayerPoints(matchup,x.id))<0.005);
}
function benchDecisionContext(roster,matchup){
  if(!roster||!matchup)return [];
  const starterSet=new Set(matchupStarterIds(roster,matchup));
  const playerIds=matchupPlayerIds(roster,matchup);
  const starters=playerIds.filter(id=>starterSet.has(String(id))).map(id=>({p:sleeperRosterPlayer(id),pts:matchupPlayerPoints(matchup,id),id:String(id)}));
  const bench=playerIds.filter(id=>!starterSet.has(String(id))).map(id=>({p:sleeperRosterPlayer(id),pts:matchupPlayerPoints(matchup,id),id:String(id)}));
  const rows=[];
  for(const b of bench){
    if(b.pts<=0)continue;
    const same=starters.filter(s=>s.p.pos===b.p.pos || (['RB','WR','TE'].includes(b.p.pos)&&['RB','WR','TE'].includes(s.p.pos)));
    if(!same.length)continue;
    const low=same.slice().sort((a,b)=>a.pts-b.pts)[0];
    const gap=b.pts-low.pts;
    if(gap>=5)rows.push({bench:b,starter:low,gap});
  }
  return rows.sort((a,b)=>b.gap-a.gap).slice(0,4);
}
function matchupStateFraming(roster,oppRoster,mine,opp,week=seasonDisplayWeek()){
  if(!roster||!oppRoster||!mine||!opp)return {cls:'close',title:'Matchup context unavailable',detail:'A paired Sleeper matchup is required.'};
  const scoring=matchupScoringContext(roster,oppRoster,mine,opp,week);
  if(scoring.projected){
    return {cls:Math.abs(scoring.diff)<3?'close':scoring.diff>0?'leading':'trailing',title:'Pregame projection',detail:`Projected starter totals: ${scoring.myTotal.toFixed(2)} to ${scoring.oppTotal.toFixed(2)} (${scoring.diff>=0?'+':''}${scoring.diff.toFixed(2)}). Actual scoring will replace projections once the matchup begins.`};
  }
  if(!scoring.started){
    return {cls:'close',title:'Pregame projections loading',detail:`Week ${week} has not started. Saved or live Sleeper projections are still loading.`};
  }
  const myPts=scoring.myTotal,oppPts=scoring.oppTotal,diff=scoring.diff;
  const myZero=currentZeroPointStarters(roster,mine).length,oppZero=currentZeroPointStarters(oppRoster,opp).length;
  if(diff>=15)return {cls:'leading',title:'Protect the lead',detail:`You lead by ${diff.toFixed(2)}. ${myZero} of your starters and ${oppZero} opponent starters currently show 0.00 points, so the scoreboard may still have unresolved scoring context.`};
  if(diff<=-15)return {cls:'trailing',title:'Comeback pressure',detail:`You trail by ${Math.abs(diff).toFixed(2)}. ${myZero} of your starters currently show 0.00 points versus ${oppZero} for the opponent; treat those as monitor items, not guaranteed remaining players.`};
  const combinedZeros=myZero+oppZero;
  return {cls:'close',title:'Close matchup',detail:`The current margin is ${Math.abs(diff).toFixed(2)} points. ${combinedZeros} combined starters currently show 0.00 points, so the score should be treated as incomplete context.`};
}
function matchupPressurePoints(roster,oppRoster,mine,opp){
  const rows=[];
  if(!roster||!oppRoster||!mine||!opp)return rows;
  const myZero=currentZeroPointStarters(roster,mine),oppZero=currentZeroPointStarters(oppRoster,opp);
  if(myZero.length)rows.push({kind:'warn',title:`${myZero.length} of your starters at 0.00`,detail:myZero.slice(0,4).map(x=>x.player.name).join(', ')});
  if(oppZero.length)rows.push({kind:'warn',title:`${oppZero.length} opponent starters at 0.00`,detail:`Current scoring only: ${oppZero.slice(0,4).map(x=>x.player.name).join(', ')}. This does not imply those players are finished or still to play.`});
  const myEmpty=(verifiedLeague?.roster_positions||[]).filter(x=>x!=='BN').length-matchupStarterIds(roster,mine).length;
  const oppEmpty=(verifiedLeague?.roster_positions||[]).filter(x=>x!=='BN').length-matchupStarterIds(oppRoster,opp).length;
  if(myEmpty>0)rows.unshift({kind:'bad',title:`You have ${myEmpty} open starter slot${myEmpty===1?'':'s'}`,detail:'This is a direct lineup vulnerability and should be corrected before lock if possible.'});
  if(oppEmpty>0)rows.push({kind:'good',title:`Opponent has ${oppEmpty} open starter slot${oppEmpty===1?'':'s'}`,detail:'Their current Sleeper lineup is incomplete.'});
  const oppT=teamManagerTendencyProfile(oppRoster);
  if(oppT.score.trend==='rising')rows.push({kind:'warn',title:'Opponent scoring trend is rising',detail:`Recent finalized scoring is ${oppT.score.delta>=0?'+':''}${oppT.score.delta.toFixed(1)} versus their earlier baseline.`});
  if(oppT.score.std>=22)rows.push({kind:'warn',title:'Opponent is boom / bust',detail:`Their finalized-week scoring volatility is ${oppT.score.std.toFixed(1)} points (σ).`});
  if(!rows.length)rows.push({kind:'good',title:'No obvious matchup pressure flag',detail:'No major lineup concern stands out.'});
  return rows.slice(0,6);
}
function positionalMatchupContext(roster,oppRoster){
  if(!roster||!oppRoster)return [];
  const mine=finalizedStarterPositionAverages(roster.roster_id),theirs=finalizedStarterPositionAverages(oppRoster.roster_id);
  return ['QB','RB','WR','TE','K','DEF'].map(pos=>{
    const a=mine[pos]?.avg??null,b=theirs[pos]?.avg??null;
    const comparable=a!=null&&b!=null;
    const diff=comparable?a-b:null;
    const cls=!comparable||Math.abs(diff)<2?'':diff>0?'edge-me':'edge-opp';
    return {pos,a,b,diff,cls,aWeeks:mine[pos]?.weeks||0,bWeeks:theirs[pos]?.weeks||0,comparable};
  }).filter(x=>x.a!=null||x.b!=null);
}
function benchThreatRequiredMultiplier(benchPos,starter){
  const pos=String(benchPos||'').toUpperCase();
  const starterPos=String(starter?.player?.pos||'').toUpperCase();
  const slot=String(starter?.slot||'').toUpperCase();
  if(pos==='QB')return 1.10;
  if(pos==='TE'&&slot==='FLEX'&&starterPos==='WR')return 1.40;
  return 1.20;
}

function nflTeamCode(value){
  const raw=String(value||'').toUpperCase().trim();
  const aliases={JAC:'JAX',WSH:'WAS',LA:'LAR'};
  return aliases[raw]||raw;
}
function sleeperScheduleTeamCodes(game){
  const values=[game?.home,game?.away,game?.home_team,game?.away_team,game?.homeTeam,game?.awayTeam,game?.team_home,game?.team_away];
  return new Set(values.map(nflTeamCode).filter(Boolean));
}
function playerWeekLockState(player,week=seasonDisplayWeek(),now=Date.now()){
  week=Math.max(1,Number(week)||1);
  const current=currentWeekNumber();
  if(week<current)return {locked:true,state:'final'};
  if(week>current)return {locked:false,state:'pregame'};
  const team=nflTeamCode(player?.team);if(!team||team==='—')return {locked:false,state:'unknown'};
  const game=(nflScheduleGames||[]).find(g=>{
    const gw=sleeperScheduleGameWeek(g);if(gw&&gw!==week)return false;
    return sleeperScheduleTeamCodes(g).has(team);
  });
  if(!game)return {locked:false,state:'unknown'};
  const status=sleeperScheduleStatus(game);
  const finalStatuses=new Set(['complete','completed','finished','final','post','closed']);
  const liveStatuses=new Set(['inprogress','live','halftime']);
  const pregameStatuses=new Set(['pregame','scheduled','notstarted','upcoming','created']);
  if(finalStatuses.has(status))return {locked:true,state:'final'};
  if(liveStatuses.has(status))return {locked:true,state:'live'};
  if(pregameStatuses.has(status))return {locked:false,state:'pregame'};
  const kickoff=sleeperScheduleKickoffMs(game);
  if(kickoff!=null&&now>=kickoff)return {locked:true,state:'started'};
  return {locked:false,state:'pregame'};
}
function benchThreatAnalysis(roster,matchup,week=seasonDisplayWeek(),playerCache=null){
  if(!roster||!matchup)return [];
  const starterSlots=normalizedMatchupSlots(roster,matchup,playerCache);
  const starterSet=new Set(starterSlots.map(x=>String(x.id)));
  const benchIds=matchupPlayerIds(roster,matchup).filter(id=>!starterSet.has(String(id)));
  const eligibleFor=(pos,slot)=>{
    pos=String(pos||'').toUpperCase();slot=String(slot||'').toUpperCase();
    if(pos==='DST')pos='DEF';
    if(slot==='DST')slot='DEF';
    if(slot==='FLEX'||slot==='W/R/T'||slot==='WRT')return ['RB','WR','TE'].includes(pos);
    return pos===slot;
  };
  const lookup=id=>playerCache?.get(String(id))||sleeperRosterPlayer(id);
  const rows=[];
  for(const id of benchIds){
    const player=lookup(id),pos=String(player?.pos||'').toUpperCase();
    // Once a bench player's NFL game starts, Sleeper locks that player in place;
    // it is no longer an actionable lineup recommendation.
    if(playerWeekLockState(player,week).locked)continue;
    const benchPts=currentWeekProjectionForPlayer(id,week);
    if(benchPts==null||!Number.isFinite(Number(benchPts)))continue;
    const eligible=starterSlots.filter(x=>eligibleFor(pos,x.slot)&&!playerWeekLockState(x.player,week).locked).map(x=>({
      ...x,pts:currentWeekProjectionForPlayer(x.id,week)
    })).filter(x=>x.pts!=null&&Number.isFinite(Number(x.pts)));
    if(!eligible.length)continue;
    const qualifying=eligible.map(starter=>{
      const multiplier=benchThreatRequiredMultiplier(pos,starter);
      const required=Number(starter.pts)*multiplier;
      return {...starter,multiplier,required,gap:Number(benchPts)-Number(starter.pts)};
    }).filter(x=>Number(benchPts)+1e-9>=x.required);
    if(!qualifying.length)continue;
    const starter=qualifying.sort((a,b)=>b.gap-a.gap||a.required-b.required)[0];
    rows.push({player,id:String(id),pos,benchPts:Number(benchPts),starter,starterPts:Number(starter.pts),gap:starter.gap,multiplier:starter.multiplier,required:starter.required,kind:'bad'});
  }
  return rows.sort((a,b)=>b.gap-a.gap).slice(0,6);
}
function otherLeagueMatchupPairs(week=seasonDisplayWeek()){
  const list=seasonDisplayMatchups(week);
  const seen=new Set(),pairs=[];
  for(const a of list){
    const mid=String(a?.matchup_id??'');
    if(!mid||seen.has(mid))continue;
    const b=list.find(x=>String(x?.matchup_id??'')===mid&&String(x?.roster_id)!==String(a?.roster_id));
    if(!b)continue;
    seen.add(mid);
    const ar=leagueRosters.find(r=>String(r.roster_id)===String(a.roster_id));
    const br=leagueRosters.find(r=>String(r.roster_id)===String(b.roster_id));
    if(ar&&br)pairs.push({matchupId:a.matchup_id,a,b,ar,br});
  }
  return pairs;
}
function renderOtherLeagueMatchups(){
  const list=$('#otherLeagueMatchupsList'),status=$('#otherLeagueMatchupsStatus');
  if(!list)return;
  const week=seasonDisplayWeek(),mineId=String(sleeperCtx.rosterId||'');
  const pairs=otherLeagueMatchupPairs(week).filter(p=>String(p.a.roster_id)!==mineId&&String(p.b.roster_id)!==mineId);
  if(status)status.textContent=`Week ${week} • ${pairs.length} other matchup${pairs.length===1?'':'s'}`;
  if(!pairs.length){list.innerHTML='<div class="empty">No other league matchups are available for this week.</div>';return;}
  list.innerHTML=pairs.map(p=>{
    const scoring=matchupScoringContext(p.ar,p.br,p.a,p.b,week),show=scoring.projected||scoring.started;
    const state=scoring.projected?'PROJECTED':scoring.started?'LIVE':'PENDING';
    return `<button type="button" class="other-matchup-row" data-other-matchup="${esc(p.matchupId)}">
      <div><b>${esc(rosterUserName(p.ar))}</b>${uclVenuePill(week,p.ar.roster_id)}<span>${show?matchupScoreText(scoring,'my'):'—'}</span></div>
      <em>${uclVenueForRoster(week,p.a.roster_id)==='away'?'@':'vs'} <small>${state}</small></em>
      <div class="right"><b>${esc(rosterUserName(p.br))}</b>${uclVenuePill(week,p.br.roster_id)}<span>${show?matchupScoreText(scoring,'opp'):'—'}</span></div>
    </button>`;
  }).join('');
}
function openOtherLeagueMatchup(matchupId){
  const week=seasonDisplayWeek();
  const p=otherLeagueMatchupPairs(week).find(x=>String(x.matchupId)===String(matchupId));
  const dialog=$('#otherMatchupDialog');if(!p||!dialog)return;
  const scoring=matchupScoringContext(p.ar,p.br,p.a,p.b,week),show=scoring.projected||scoring.started;
  const aName=rosterUserName(p.ar),bName=rosterUserName(p.br);
  const aAway=uclVenueForRoster(week,p.ar.roster_id)==='away';
  const awayName=aAway?aName:bName,homeName=aAway?bName:aName;
  $('#otherMatchupTitle').textContent=`${awayName} @ ${homeName}`;
  $('#otherMatchupSub').innerHTML=`Week ${week} • ${scoring.projected?'Pregame projections':scoring.started?'Live scoring':'Projections loading'} • ${uclVenuePill(week,p.ar.roster_id)} ${esc(aName)} / ${uclVenuePill(week,p.br.roster_id)} ${esc(bName)}`;
  $('#otherTeam1StarterLabel').textContent=`${aName} Starters`;$('#otherTeam2StarterLabel').textContent=`${bName} Starters`;
  const aSlots=normalizedMatchupSlots(p.ar,p.a),bSlots=normalizedMatchupSlots(p.br,p.b);
  $('#otherTeam1StarterPoints').textContent=show?matchupScoreText(scoring,'my'):'—';$('#otherTeam2StarterPoints').textContent=show?matchupScoreText(scoring,'opp'):'—';
  $('#otherTeam1StarterCount').textContent=`${aSlots.length} starters • ${scoring.projected?'projected':scoring.started?'actual':'pending'}`;
  $('#otherTeam2StarterCount').textContent=`${bSlots.length} starters • ${scoring.projected?'projected':scoring.started?'actual':'pending'}`;
  const edge=$('#otherMatchupEdge'),diff=scoring.diff;edge.className='mc-edge '+(Math.abs(diff)<3?'close':diff>0?'leading':'trailing');
  edge.querySelector('b').textContent=show?(Math.abs(diff)<.005?'TIED':Math.abs(diff).toFixed(2)):'—';
  $('#otherMatchupEdgeTeam').textContent=show?(Math.abs(diff)<.005?'Even matchup':diff>0?aName:bName):'Waiting for projections';
  $('#otherMatchupBenchPoints').textContent=show?`${matchupBenchScoreText(scoring,'my')} / ${matchupBenchScoreText(scoring,'opp')}`:'—';
  $('#otherMatchupBenchDetail').textContent=`${aName} / ${bName}`;
  const ppts=(match,id)=>scoring.projected?Number(currentWeekProjectionForPlayer(id,week)||0):matchupPlayerPoints(match,id);
  const rows=[],max=Math.max(aSlots.length,bSlots.length);
  for(let i=0;i<max;i++){
    const a=aSlots[i]||null,b=bSlots[i]||null,ap=a?ppts(p.a,a.id):0,bp=b?ppts(p.b,b.id):0,rowDiff=ap-bp;
    const cls=Math.abs(rowDiff)<.01?'':rowDiff>0?'my-edge':'opp-edge',slot=a?.slot||b?.slot||`S${i+1}`;
    rows.push(`<div class="matchup-pos-row ${cls}"><div class="matchup-pos-player"><b>${a?esc(a.player.name):'—'}</b><small>${a?`${esc(a.player.team||'—')} • ${esc(a.player.pos||slot)}`:'Empty'}</small></div><div class="matchup-pos-score">${a&&show?matchupPlayerScoreText(p.a,a.id,scoring,week):'—'}</div><div class="matchup-pos-slot">${esc(slot)}</div><div class="matchup-pos-score">${b&&show?matchupPlayerScoreText(p.b,b.id,scoring,week):'—'}</div><div class="matchup-pos-player right"><b>${b?esc(b.player.name):'—'}</b><small>${b?`${esc(b.player.team||'—')} • ${esc(b.player.pos||slot)}`:'Empty'}</small></div></div>`);
  }
  $('#otherMatchupPositionList').innerHTML=rows.join('');
  $('#otherMatchupFootnote').textContent=scoring.projected?`Pregame view: P indicates Sleeper Week ${week} projected points.`:scoring.started?(scoring.projectionAvailable?'Live view: actual points are shown first; projected final points remain in parentheses.':'Live view: actual Sleeper matchup scoring.'):`Week ${week} projections are loading.`;
  dialog.showModal();
}
function renderMatchupIntelligence(roster,oppRoster,mine,opp){
  const bench=$('#matchupBenchList'),pos=$('#matchupPosContext'),status=$('#matchupIntelStatus');
  if(!bench||!pos)return;
  const analyticsCard=pos.closest('.season-analytics');
  const week=seasonDisplayWeek();
  if(!roster||!mine){
    if(status)status.textContent='Starter threats from your bench';
    bench.innerHTML='<div class="empty">Bench analysis will appear when your current lineup is available.</div>';
    pos.innerHTML='<div class="empty">Not enough finalized positional scoring data yet.</div>';
    analyticsCard?.classList.add('compact-empty');
    return;
  }
  const projectionMap=projectionMapForWeek(week);
  const threats=benchThreatAnalysis(roster,mine,week);
  if(status)status.textContent=`Week ${week} • projected starter threats`;
  if(!projectionMap||!projectionMap.size){
    bench.innerHTML='<div class="matchup-intel-row warn"><b>Bench projections pending</b><small>Sync or select this week to load the projections needed for starter-threat analysis.</small></div>';
  }else bench.innerHTML=threats.length?threats.map(x=>{
    const pct=Math.round((x.multiplier-1)*100);
    const detail=`${x.player.name} projects ${x.gap.toFixed(2)} points higher than ${x.starter.player.name}, clearing the ${pct}% recommendation threshold.`;
    return `<div class="matchup-intel-row ${x.kind}"><b>STARTER THREAT: ${esc(x.player.name)} • ${x.benchPts.toFixed(2)}</b><small>${esc(detail)} Starter projection: ${x.starterPts.toFixed(2)} • eligible for ${esc(x.starter.slot)}.</small></div>`;
  }).join(''):'<div class="matchup-intel-row good"><b>No bench threats</b><small>No eligible bench player clears the position-specific projection threshold for Week '+week+'.</small></div>';

  const ctx=oppRoster?positionalMatchupContext(roster,oppRoster):[];
  pos.innerHTML=ctx.length?ctx.map(x=>`<div class="matchup-pos-context-card ${x.cls}">
    <span>${x.pos} finalized avg • ${Math.min(x.aWeeks,x.bWeeks)} wk${Math.min(x.aWeeks,x.bWeeks)===1?'':'s'}</span>
    <b>${x.a==null?'—':x.a.toFixed(1)} vs ${x.b==null?'—':x.b.toFixed(1)}</b>
    <small>${!x.comparable?'Not enough comparable finalized data':Math.abs(x.diff)<2?'Roughly even historical starter output':x.diff>0?'Your finalized starter output has the edge':'Opponent finalized starter output has the edge'}</small>
  </div>`).join(''):'<div class="empty">Not enough finalized positional scoring data yet.</div>';
  analyticsCard?.classList.toggle('compact-empty',!ctx.length);
}
function renderMatchupCenter(roster,oppRoster,mine,opp,scoringOverride=null){
  const list=$('#matchupPositionList');
  if(!list)return;
  if(!roster||!oppRoster||!mine||!opp){
    $('#matchupCenterStatus').textContent='Matchup not published yet';
    $('#mcMyStarterPoints').textContent='—';$('#mcOppStarterPoints').textContent='—';$('#mcMyStarterCount').textContent='—';$('#mcOppStarterCount').textContent='—';$('#mcBenchPoints').textContent='—';$('#mcBenchDetail').textContent='—';
    $('#mcEdge').className='mc-edge';$('#mcEdge').querySelector('b').textContent='—';
    if($('#mcEdgeDetail'))$('#mcEdgeDetail').textContent='Waiting for matchup';
    list.innerHTML='<div class="empty">Sleeper has not published a complete paired matchup yet.</div>';return;
  }
  const week=seasonDisplayWeek(),scoring=scoringOverride||matchupScoringContext(roster,oppRoster,mine,opp,week);
  const mineSlots=normalizedMatchupSlots(roster,mine),oppSlots=normalizedMatchupSlots(oppRoster,opp);
  const ppts=(match,id)=>scoring.projected?Number(currentWeekProjectionForPlayer(id,week)||0):matchupPlayerPoints(match,id);
  const myTotal=scoring.myTotal,oppTotal=scoring.oppTotal,myBench=scoring.myBench,oppBench=scoring.oppBench,diff=scoring.diff;
  $('#matchupCenterStatus').innerHTML=`Week ${week} • ${scoring.projected?'projected':scoring.started?'actual':'projections loading'} • <span class="matchup-venue-line">${esc(rosterUserName(roster))} ${uclVenuePill(week,roster.roster_id)} ${uclVenueForRoster(week,roster.roster_id)==='away'?'@':'vs'} ${esc(rosterUserName(oppRoster))} ${uclVenuePill(week,oppRoster.roster_id)}</span>`;
  $('#mcMyStarterPoints').textContent=scoring.projected||scoring.started?matchupScoreText(scoring,'my'):'—';
  $('#mcOppStarterPoints').textContent=scoring.projected||scoring.started?matchupScoreText(scoring,'opp'):'—';
  $('#mcMyStarterCount').textContent=`${mineSlots.length} starters • ${scoring.projected?'projected':scoring.started?'actual':'pending'}`;
  $('#mcOppStarterCount').textContent=`${oppSlots.length} starters • ${scoring.projected?'projected':scoring.started?'actual':'pending'}`;
  $('#mcBenchPoints').textContent=scoring.projected||scoring.started?`${matchupBenchScoreText(scoring,'my')} / ${matchupBenchScoreText(scoring,'opp')}`:'—';
  $('#mcBenchDetail').textContent=`Yours / Opponent • ${scoring.projected?'projected':scoring.started?'actual':'pending'}`;
  const edge=$('#mcEdge');edge.className='mc-edge '+(Math.abs(diff)<3?'close':diff>0?'leading':'trailing');
  edge.querySelector('b').textContent=scoring.projected||scoring.started?(Math.abs(diff)<.005?'TIED':`${diff>0?'+':''}${diff.toFixed(2)}`):'—';
  if($('#mcEdgeDetail'))$('#mcEdgeDetail').textContent=scoring.projected?'Projected edge':scoring.started?(diff>3?'You lead':diff<-3?'Opponent leads':'Very close'):'Waiting for projections';

  const max=Math.max(mineSlots.length,oppSlots.length),rows=[];
  for(let i=0;i<max;i++){
    const a=mineSlots[i]||null,b=oppSlots[i]||null;
    const ap=a?ppts(mine,a.id):0,bp=b?ppts(opp,b.id):0,rowDiff=ap-bp;
    const cls=Math.abs(rowDiff)<.01?'':rowDiff>0?'my-edge':'opp-edge',slot=a?.slot||b?.slot||`S${i+1}`;
    const show=scoring.projected||scoring.started;
    rows.push(`<div class="matchup-pos-row ${cls}">
      <div class="matchup-pos-player"><b>${a?esc(a.player.name):'—'}</b><small>${a?`${esc(a.player.team||'—')} • ${esc(a.player.pos||slot)}`:'Empty'}</small>${a&&scoring.started&&compactPlayerStatLine(a.id,week,a.player.pos)?`<small class="live-stat-line">${esc(compactPlayerStatLine(a.id,week,a.player.pos))}</small>`:''}</div>
      <div class="matchup-pos-score">${a&&show?matchupPlayerScoreText(mine,a.id,scoring,week):'—'}</div>
      <div class="matchup-pos-slot">${esc(slot)}</div>
      <div class="matchup-pos-score">${b&&show?matchupPlayerScoreText(opp,b.id,scoring,week):'—'}</div>
      <div class="matchup-pos-player right"><b>${b?esc(b.player.name):'—'}</b><small>${b?`${esc(b.player.team||'—')} • ${esc(b.player.pos||slot)}`:'Empty'}</small>${b&&scoring.started&&compactPlayerStatLine(b.id,week,b.player.pos)?`<small class="live-stat-line">${esc(compactPlayerStatLine(b.id,week,b.player.pos))}</small>`:''}</div>
    </div>`);
  }
  list.innerHTML=rows.join('');
  if($('#matchupCenterFootnote'))$('#matchupCenterFootnote').textContent=scoring.projected
    ?`Pregame view: P indicates Sleeper Week ${week} projected points. This automatically switches to actual matchup scoring once play begins.`
    :scoring.started?(scoring.projectionAvailable?'Live view: actual points are shown first; projected final points remain in parentheses.':'Live view: actual Sleeper matchup scoring is shown because this matchup has started.'):`Pregame view: Week ${week} projections are loading.`;
}
