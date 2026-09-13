function teamDisplayWeek(){
  return Math.max(1,Math.min(14,Number(selectedTeamWeek)||currentWeekNumber()));
}
function populateTeamWeekSelector(){
  const sel=$('#teamWeekSelect');if(!sel)return;
  const current=currentWeekNumber(),selected=teamDisplayWeek();
  sel.innerHTML=Array.from({length:14},(_,i)=>{
    const w=i+1;
    return `<option value="${w}"${w===selected?' selected':''}>Week ${w}${w===current?' • Current':''}</option>`;
  }).join('');
  sel.disabled=teamWeekSelectionBusy;
}
async function selectTeamWeek(week){
  week=Math.max(1,Math.min(14,Number(week)||currentWeekNumber()));
  selectedTeamWeek=week;
  teamWeekSelectionBusy=true;populateTeamWeekSelector();
  try{
    if(!Array.isArray(seasonMatchupsByWeek[week])||!seasonMatchupsByWeek[week].length){
      const r=await sleeperGetSafe(`/league/${SLEEPER_LEAGUE_ID}/matchups/${week}`,{
        ttlMs:week===currentWeekNumber()?30000:6*60*60*1000,
        force:false,fallback:seasonMatchupsByWeek[week]||[],label:`Week ${week} matchups`
      });
      if(r.ok)seasonMatchupsByWeek[week]=dedupeMatchupList(r.value);
    }
    try{await syncCurrentWeekProjections(week,false);}catch(e){}
    try{await syncWeeklyStats(week,false);}catch(e){}
  }finally{
    teamWeekSelectionBusy=false;
    populateTeamWeekSelector();
    renderTeam();
  }
}
function teamWeekMatchup(rosterId,week=teamDisplayWeek()){
  return matchupForRoster(rosterId,week);
}
function teamWeekPointFor(matchup,id,week,started){
  if(started)return matchupPlayerPoints(matchup,id);
  const proj=currentWeekProjectionForPlayer(id,week);
  return proj==null?null:Number(proj);
}

function myTeamInjuryStatus(id,roster){
  const key=String(id||'');
  const reserve=new Set((roster?.reserve||[]).filter(Boolean).map(String));
  if(reserve.has(key))return {label:'IR / Reserve',kind:'bad'};
  const raw=discoveredSleeperPlayers?.[key]||playerMetadataFallback(key)||{};
  const designation=String(raw?.injury_status||raw?.injuryStatus||raw?.designation||raw?.status||'').trim();
  const normalized=designation.toUpperCase().replace(/[^A-Z]/g,'');
  if(!normalized||['ACTIVE','HEALTHY','FULL'].includes(normalized))return null;
  if(normalized==='PROBABLE')return {label:'Probable',kind:'good'};
  if(normalized.includes('QUESTION'))return {label:'Questionable',kind:'warn'};
  if(normalized.includes('DOUBT'))return {label:'Doubtful',kind:'bad'};
  if(normalized.includes('OUT'))return {label:'Out',kind:'bad'};
  if(normalized.includes('IR')||normalized.includes('PUP')||normalized.includes('NFI')||normalized.includes('SUSPEND')||normalized.includes('EXEMPT'))return {label:designation||'Unavailable',kind:'bad'};
  return {label:designation,kind:'warn'};
}

const MY_TEAM_BENCH_POSITION_ORDER=Object.freeze({QB:0,RB:1,WR:2,TE:3,DEF:4,K:5});
function sortMyTeamBenchIds(ids,playerFn,pointFn){
  return [...(ids||[])].sort((a,b)=>{
    const ap=String(playerFn(a)?.pos||'').toUpperCase(),bp=String(playerFn(b)?.pos||'').toUpperCase();
    const ao=MY_TEAM_BENCH_POSITION_ORDER[ap]??99,bo=MY_TEAM_BENCH_POSITION_ORDER[bp]??99;
    if(ao!==bo)return ao-bo;
    const av=pointFn(a),bv=pointFn(b);
    const an=av==null?-Infinity:Number(av),bn=bv==null?-Infinity:Number(bv);
    if(bn!==an)return bn-an;
    return String(playerFn(a)?.name||'').localeCompare(String(playerFn(b)?.name||''));
  });
}

function renderTeam(){
  populateTeamWeekSelector();
  const roster=(leagueRosters||[]).find(r=>String(r.roster_id)===String(sleeperCtx.rosterId));
  if(!roster){
    $('#starterLineup').innerHTML='<div class="empty">Select your Sleeper team to load the roster.</div>';
    $('#benchLineup').innerHTML='';
    $('#teamPlayers').textContent='0';$('#starterPts').textContent='—';$('#benchPts').textContent='—';
    $('#extraBox').style.display='none';
    if($('#teamWeekStatus'))$('#teamWeekStatus').textContent='Select your Sleeper team to load weekly lineups.';
    if($('#teamRosterPressureGrid'))$('#teamRosterPressureGrid').innerHTML='<div class="empty">Select your Sleeper team.</div>';
    return;
  }

  const week=teamDisplayWeek(),current=currentWeekNumber();
  const {mine,opp}=teamWeekMatchup(roster.roster_id,week);
  const oppRoster=opp?leagueRosters.find(r=>String(r.roster_id)===String(opp.roster_id)):null;
  const started=!!(mine&&opp&&oppRoster&&matchupHasStarted(mine,opp,roster,oppRoster));
  const historical=week<current;
  const projectionMap=projectionMapForWeek(week);

  // Prefer the matchup snapshot for that week; fall back to the live roster
  // when Sleeper has not published week-specific player/starter arrays.
  const starterIds=matchupStarterIds(roster,mine);
  const starterSet=new Set(starterIds);
  const allIds=matchupPlayerIds(roster,mine);
  const starterLabels=(verifiedLeague?.roster_positions||[]).filter(x=>x&&x!=='BN');
  // Resolve each player and weekly point value once per render. Rows and totals share the same cache.
  const playerCache=new Map();
  const pointCache=new Map();
  const player=id=>{
    const key=String(id);
    if(!playerCache.has(key))playerCache.set(key,sleeperRosterPlayer(key));
    return playerCache.get(key);
  };
  const pointFor=id=>{
    const key=String(id);
    if(!pointCache.has(key))pointCache.set(key,teamWeekPointFor(mine,key,week,started||historical&&!!mine));
    return pointCache.get(key);
  };

  const mode=(started||historical&&!!mine)?'actual':projectionMap?'projected':'pending';
  if($('#teamWeekStatus'))$('#teamWeekStatus').innerHTML=`Week ${week} • ${mode==='actual'?'Sleeper scoring':mode==='projected'?'Sleeper projections':'projection data loading'}${oppRoster?` • ${uclVenuePill(week,roster.roster_id)} ${esc(uclMatchupNotation(week,roster.roster_id,rosterUserName(oppRoster)))}`:''}`;
  if($('#teamWeekNote'))$('#teamWeekNote').textContent=mode==='actual'
    ?`Week ${week} shows Sleeper live scoring first, with projected points in parentheses when projections are available.`
    :mode==='projected'
      ?`Week ${week} shows the available lineup with Sleeper projected points. Bye weeks use the official 2026 NFL schedule.`
      :`Week ${week} lineup is available; projection data is still loading. Bye weeks use the official 2026 NFL schedule.`;

  const row=(label,id,bench=false)=>{
    if(!id)return `<div class="slot-row ${bench?'bench-row':''}"><div class="slot-pos">${esc(label)}</div><div class="slot-player"><strong class="slot-empty">Empty</strong><small>Open lineup slot</small></div><div class="slot-proj">—<small>WEEK ${week}</small></div><div class="slot-bye">—</div></div>`;
    const p=player(id),pts=pointFor(id),bye=p.bye==null?'—':`Bye ${p.bye}`,injury=myTeamInjuryStatus(id,roster);
    const ptsLabel=mode==='actual'?'PTS + PROJ':mode==='projected'?'PROJ':'PENDING';
    const proj=projectionMap?.get(String(id))?.pts??null;
    const ptsText=mode==='actual'?liveScoreText(pts,proj,{started:true,projectionAvailable:proj!=null}):(pts==null?'—':Number(pts).toFixed(2));
    const injuryBadge=injury?` <span class="my-team-injury ${injury.kind}">${esc(injury.label)}</span>`:'';
    const statLine=mode==='actual'?compactPlayerStatLine(id,week,p.pos):'';
    return `<div class="slot-row ${bench?'bench-row':''}"><div class="slot-pos">${esc(label)}</div><div class="slot-player"><strong>${esc(p.name)}</strong><small>${esc(p.team)} • ${esc(p.pos||'—')}${injuryBadge}</small>${statLine?`<small class="live-stat-line">${esc(statLine)}</small>`:''}</div><div class="slot-proj">${ptsText}<small>WEEK ${week} ${ptsLabel}</small></div><div class="slot-bye">${esc(bye)}</div></div>`;
  };

  const starterRows=[];
  const slotCount=Math.max(starterLabels.length,starterIds.length);
  for(let i=0;i<slotCount;i++)starterRows.push(row(starterLabels[i]||`S${i+1}`,starterIds[i]||null,false));
  const benchIds=sortMyTeamBenchIds(
    allIds.filter(id=>!starterSet.has(String(id))),
    player,
    pointFor
  );
  const benchRows=benchIds.map((id,i)=>row(`BN${i+1}`,id,true));

  $('#starterLineup').innerHTML=starterRows.join('')||'<div class="empty">No starters reported by Sleeper.</div>';
  $('#benchLineup').innerHTML=benchRows.join('')||'<div class="empty">No bench players reported by Sleeper.</div>';
  $('#teamPlayers').textContent=allIds.length;

  const sp=starterIds.reduce((sum,id)=>sum+Number(pointFor(id)||0),0);
  const bp=benchIds.reduce((sum,id)=>sum+Number(pointFor(id)||0),0);
  const starterProj=projectionMap?starterIds.reduce((sum,id)=>sum+Number(projectionMap.get(String(id))?.pts||0),0):null;
  const benchProj=projectionMap?benchIds.reduce((sum,id)=>sum+Number(projectionMap.get(String(id))?.pts||0),0):null;
  $('#starterPts').textContent=mode==='pending'?'—':mode==='actual'?liveScoreText(sp,starterProj,{started:true,projectionAvailable:starterProj!=null}):sp.toFixed(2);
  $('#benchPts').textContent=mode==='pending'?'—':mode==='actual'?liveScoreText(bp,benchProj,{started:true,projectionAvailable:benchProj!=null}):bp.toFixed(2);
  $('#extraBox').style.display='none';
  if($('#teamRosterPressureGrid'))$('#teamRosterPressureGrid').innerHTML=seasonRosterPressure(roster,playerCache).map(x=>`<div class="season-pressure ${x.kind}"><span>${esc(x.label)}</span><b>${esc(x.value)}</b><small>${esc(x.detail)}</small></div>`).join('');
}
