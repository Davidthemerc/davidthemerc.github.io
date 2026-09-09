function leagueOwnedPlayerIds(){
  const owned=new Set();
  for(const r of leagueRosters||[]){
    for(const id of r.players||[])owned.add(String(id));
  }
  return owned;
}

function leagueStarterSlots(){
  return (verifiedLeague?.roster_positions||[]).filter(x=>x&&x!=='BN');
}
function requiredStarterCount(pos){
  return leagueStarterSlots().filter(x=>String(x).toUpperCase()===pos).length;
}
function flexEligibleCountFromCounts(c){
  return Number(c.RB||0)+Number(c.WR||0)+Number(c.TE||0);
}
function waiverPlayerRaw(id){
  const key=String(id||'');
  return discoveredSleeperPlayers?.[key]||playerMetadataFallback(key)||{};
}
function waiverDesignation(id){
  const raw=waiverPlayerRaw(id);
  return String(raw?.injury_status||raw?.injuryStatus||raw?.designation||raw?.status||'').trim();
}
function waiverDesignationKey(id){
  return waiverDesignation(id).toUpperCase().replace(/[^A-Z]/g,'');
}
function waiverPlayerHealth(id,roster=null){
  const reserve=new Set((roster?.reserve||[]).filter(Boolean).map(String));
  if(reserve.has(String(id)))return {healthy:false,label:'RESERVE',kind:'bad'};
  const designation=waiverDesignation(id);
  const key=waiverDesignationKey(id);
  if(!key||['ACTIVE','HEALTHY','PROBABLE','FULL'].includes(key))return {healthy:true,label:designation||'Healthy',kind:'good'};
  if(key.includes('QUESTION'))return {healthy:false,label:'Questionable',kind:'warn'};
  if(key.includes('DOUBT'))return {healthy:false,label:'Doubtful',kind:'bad'};
  if(key.includes('OUT'))return {healthy:false,label:'Out',kind:'bad'};
  if(key.includes('IR')||key.includes('PUP')||key.includes('NFI')||key.includes('SUSPEND')||key.includes('EXEMPT'))return {healthy:false,label:designation||'Unavailable',kind:'bad'};
  return {healthy:false,label:designation||'Designated',kind:'warn'};
}

function waiverHealthyCount(roster,pos,playerCache=null){
  if(!roster)return 0;
  const lookup=id=>playerCache?.get(String(id))||sleeperRosterPlayer(id);
  return (roster.players||[]).filter(id=>{
    const p=lookup(id);
    return p.pos===pos&&waiverPlayerHealth(id,roster).healthy;
  }).length;
}
function waiverPositionHealthCounts(roster,pos,playerCache=null){
  const lookup=id=>playerCache?.get(String(id))||sleeperRosterPlayer(id);
  const ids=(roster?.players||[]).filter(id=>lookup(id).pos===pos);
  let secure=0,questionable=0,severe=0,other=0;
  for(const id of ids){
    const reserve=new Set((roster?.reserve||[]).filter(Boolean).map(String));
    const key=waiverDesignationKey(id);
    if(reserve.has(String(id))){severe++;continue;}
    if(!key||['ACTIVE','HEALTHY','PROBABLE','FULL'].includes(key)){secure++;continue;}
    if(key.includes('QUESTION')){questionable++;continue;}
    if(key.includes('DOUBT')||key.includes('OUT')||key.includes('IR')||key.includes('PUP')||key.includes('NFI')||key.includes('SUSPEND')||key.includes('EXEMPT')){severe++;continue;}
    other++;
  }
  return {total:ids.length,secure,questionable,severe,other,available:secure+questionable};
}
function waiverPositionTotal(roster,pos,playerCache=null){
  const lookup=id=>playerCache?.get(String(id))||sleeperRosterPlayer(id);
  return (roster?.players||[]).filter(id=>lookup(id).pos===pos).length;
}
function waiverNeedProfile(roster,playerCache=null){
  if(!roster)return [];
  const c=rosterPositionCounts(roster,playerCache),needs=[];
  const add=(pos,severity,reason,kind='depth',meta={})=>needs.push({pos,severity,reason,kind,...meta});
  const reqQB=Math.max(1,requiredStarterCount('QB'));
  const reqRB=Math.max(2,requiredStarterCount('RB'));
  const reqWR=Math.max(3,requiredStarterCount('WR'));
  const reqK=Math.max(1,requiredStarterCount('K'));
  const reqDEF=Math.max(1,requiredStarterCount('DEF'));

  // UCL health model:
  // Questionable = precautionary availability risk; it does not trigger an immediate transaction by itself.
  // Doubtful/Out/reserve-type designations = actionable unavailability.
  const healthFloors={QB:1,RB:2,WR:3};
  for(const pos of ['QB','RB','WR']){
    const h=waiverPositionHealthCounts(roster,pos,playerCache),floor=healthFloors[pos];
    if(h.severe>0&&h.secure<=floor){
      add(pos,5,`${h.secure} healthy ${pos}${h.secure===1?'':'s'} • ${h.questionable} questionable • ${h.severe} doubtful/out/reserve`,'health',
        {healthState:'action',health:h});
    }else if(h.questionable>0&&h.secure<=floor){
      add(pos,3,`${h.secure} healthy ${pos}${h.secure===1?'':'s'} • ${h.questionable} questionable`,'potential',
        {healthState:'potential',health:h});
    }
  }

  // Structural shortages remain actionable even if health metadata is sparse.
  if(c.QB<reqQB)add('QB',5,`QB ${c.QB}/${reqQB}`,'count');
  if(c.RB<reqRB+1)add('RB',4,`Only ${c.RB} RB rostered`,'count');
  if(c.WR<reqWR+1)add('WR',4,`Only ${c.WR} WR rostered`,'count');

  const flexCount=flexEligibleCountFromCounts(c);
  const flexFloor=reqRB+reqWR+1;
  if(flexCount<flexFloor+1){
    add('RB',2,'FLEX depth could improve');
    add('WR',2,'FLEX depth could improve');
  }
  if(c.TE<1)add('TE',2,'No TE FLEX depth');
  if(c.K<reqK)add('K',3,`K ${c.K}/${reqK}`);
  if(c.DEF<reqDEF)add('DEF',3,`DEF ${c.DEF}/${reqDEF}`);

  const byPos={};
  for(const n of needs){
    if(!byPos[n.pos]||n.severity>byPos[n.pos].severity)byPos[n.pos]=n;
  }
  return Object.values(byPos).sort((a,b)=>b.severity-a.severity||a.pos.localeCompare(b.pos));
}

function currentWaiverOrder(){
  return (leagueRosters||[]).map(r=>{
    const raw=Number(r?.settings?.waiver_position);
    const position=Number.isFinite(raw)&&raw>0?raw:null;
    return {roster:r,position,name:rosterUserName(r),mine:String(r.roster_id)===String(sleeperCtx.rosterId)};
  }).sort((a,b)=>{
    if(a.position==null&&b.position==null)return a.name.localeCompare(b.name);
    if(a.position==null)return 1;
    if(b.position==null)return -1;
    return a.position-b.position||a.name.localeCompare(b.name);
  });
}
function renderCurrentWaiverOrder(){
  const list=$('#waiverOrderList'),status=$('#waiverOrderStatus');
  if(!list)return;
  const rows=currentWaiverOrder(),known=rows.filter(x=>x.position!=null);
  if(status){
    const mine=rows.find(x=>x.mine);
    status.textContent=known.length
      ?(mine?.position?`Your priority: #${mine.position}`:`${known.length} priorities reported by Sleeper`)
      :'Sleeper has not published waiver priority yet';
  }
  list.innerHTML=known.length?rows.map((x,i)=>{
    const n=x.position??'—';
    return `<div class="waiver-order-item ${x.mine?'mine':''}"><span>#${esc(n)}</span><b>${esc(x.name)}${x.mine?' • YOU':''}</b></div>`;
  }).join(''):'<div class="waiver-empty">Current waiver priority is not available in the loaded Sleeper roster data.</div>';
}

function waiverCandidateHealth(row){
  const id=row?.id||row?.player?.id;
  const h=waiverPlayerHealth(id,null);
  // Severe designations should not be presented as suitable emergency alternatives.
  const key=waiverDesignationKey(id);
  const severe=key.includes('OUT')||key.includes('DOUBT')||key.includes('IR')||key.includes('PUP')||key.includes('NFI')||key.includes('SUSPEND')||key.includes('EXEMPT');
  return {...h,severe};
}
function waiverAvailableForPosition(pos,week=currentWeekNumber(),limit=5,{healthyFirst=true}={}){
  if(typeof fawAvailablePlayers!=='function')return [];
  const rows=fawAvailablePlayers(week).filter(x=>x.player.pos===pos).map(x=>({...x,health:waiverCandidateHealth(x)}));
  const usable=rows.filter(x=>!x.health.severe);
  usable.sort((a,b)=>{
    if(healthyFirst&&a.health.healthy!==b.health.healthy)return a.health.healthy?-1:1;
    return b.pts-a.pts||a.player.name.localeCompare(b.player.name);
  });
  return usable.slice(0,limit);
}
function waiverCandidates(roster,limit=12,week=currentWeekNumber()){
  const needs=waiverNeedProfile(roster);
  const needMap=Object.fromEntries(needs.map(n=>[n.pos,n]));
  if(typeof fawAvailablePlayers!=='function')return [];
  return fawAvailablePlayers(week)
    .filter(x=>needMap[x.player.pos])
    .map(x=>({...x,need:needMap[x.player.pos],health:waiverCandidateHealth(x)}))
    .filter(x=>!x.health.severe)
    .sort((a,b)=>
      b.need.severity-a.need.severity ||
      (a.health.healthy===b.health.healthy?0:a.health.healthy?-1:1) ||
      b.pts-a.pts ||
      a.player.name.localeCompare(b.player.name)
    ).slice(0,limit);
}
function waiverMajorNeedAlternatives(roster,week=currentWeekNumber()){
  return waiverNeedProfile(roster).filter(n=>n.severity>=4&&['QB','RB','WR'].includes(n.pos)).map(need=>({
    need,
    alternatives:waiverAvailableForPosition(need.pos,week,3,{healthyFirst:true})
  }));
}
function waiverResearchLinks(player){
  const name=player?.name||player?.player?.name||'';
  return [
    {label:'FantasyPros',url:`https://www.fantasypros.com/nfl/players/${fantasyProsSlug(name)}.php`},
    {label:'RotoWire',url:`https://www.google.com/search?q=${encodeURIComponent(`site:rotowire.com/football/player "${name}"`)}`},
    {label:'Web',url:`https://www.google.com/search?q=${encodeURIComponent(`${name} fantasy football 2026 waiver outlook`)}`}
  ];
}

function waiverReplacementMultiplier(candidatePos,comparison){
  if(typeof benchThreatRequiredMultiplier==='function')return benchThreatRequiredMultiplier(candidatePos,comparison);
  const pos=String(candidatePos||'').toUpperCase();
  const starterPos=String(comparison?.player?.pos||'').toUpperCase();
  const slot=String(comparison?.slot||'').toUpperCase();
  if(pos==='QB')return 1.10;
  if(pos==='TE'&&slot==='FLEX'&&starterPos==='WR')return 1.40;
  return 1.20;
}
function waiverReplacementComparisons(roster,pos,week=currentWeekNumber(),playerCache=null){
  const starters=new Set((roster?.starters||[]).filter(Boolean).map(String));
  const lookup=id=>playerCache?.get(String(id))||sleeperRosterPlayer(id);
  const matchup=typeof matchupForRoster==='function'?matchupForRoster(roster?.roster_id,week)?.mine:null;
  const starterSlots=typeof normalizedMatchupSlots==='function'?normalizedMatchupSlots(roster,matchup,playerCache):[];
  const slotById=new Map(starterSlots.map(x=>[String(x.id),String(x.slot||'').toUpperCase()]));
  const rows=[];
  for(const id of (roster?.players||[])){
    const player=lookup(id),playerPos=String(player?.pos||'').toUpperCase();
    const slot=slotById.get(String(id))||(starters.has(String(id))?playerPos:'BENCH');
    const samePosition=playerPos===pos;
    const teFlexWr=pos==='TE'&&starters.has(String(id))&&slot==='FLEX'&&playerPos==='WR';
    if(!samePosition&&!teFlexWr)continue;
    const pts=currentWeekProjectionForPlayer(id,week);
    if(pts==null||!Number.isFinite(Number(pts)))continue;
    rows.push({id:String(id),player,pts:Number(pts),starter:starters.has(String(id)),slot});
  }
  return rows;
}
function waiverHealthEmergencyPositions(roster,playerCache=null){
  const healthNeeds=waiverNeedProfile(roster,playerCache)
    .filter(need=>need.kind==='health'&&need.severity>=5);
  return new Set(healthNeeds.filter(need=>{
    return need.healthState==='action';
  }).map(need=>need.pos));
}
function waiverPercentageSuggestions(roster,week=currentWeekNumber(),playerCache=null){
  const out=[];
  const emergencyPositions=waiverHealthEmergencyPositions(roster,playerCache);
  for(const pos of ['QB','RB','WR','TE','K','DEF']){
    const add=waiverAvailableForPosition(pos,week,1,{healthyFirst:true})[0];
    if(!add)continue;
    const emergency=emergencyPositions.has(pos);
    const comparisons=waiverReplacementComparisons(roster,pos,week,playerCache).map(compare=>{
      const multiplier=waiverReplacementMultiplier(pos,compare);
      const required=Number(compare.pts)*multiplier;
      return {...compare,multiplier,required,delta:Number(add.pts)-Number(compare.pts)};
    });
    const eligible=emergency
      ?comparisons
      :comparisons.filter(compare=>Number(add.pts)+1e-9>=compare.required);
    if(!eligible.length)continue;
    const compare=eligible.sort((a,b)=>b.delta-a.delta||a.required-b.required)[0];
    out.push({pos,add,compare,delta:Number(add.pts)-Number(compare.pts),multiplier:compare.multiplier,required:compare.required,healthEmergency:emergency});
  }
  return out;
}


function rosterNeedsMoveCards(roster,week=currentWeekNumber(),playerCache=null){
  const needs=waiverNeedProfile(roster,playerCache);
  const upgrades=waiverPercentageSuggestions(roster,week,playerCache);
  const upgradeByPos=new Map(upgrades.map(x=>[x.pos,x]));
  const positions=['QB','RB','WR','TE','K','DEF'];
  const cards=[];
  for(const pos of positions){
    const need=needs.find(n=>n.pos===pos)||null;
    const upgrade=upgradeByPos.get(pos)||null;
    if(need?.kind==='potential'){
      cards.push({pos,type:'potential',need,alternatives:waiverAvailableForPosition(pos,week,3,{healthyFirst:true})});
      continue;
    }
    if(need?.kind==='health'&&need.healthState==='action'){
      cards.push({pos,type:'action',need,alternatives:waiverAvailableForPosition(pos,week,3,{healthyFirst:true}),upgrade});
      continue;
    }
    if(need?.severity>=4){
      cards.push({pos,type:'action',need,alternatives:waiverAvailableForPosition(pos,week,3,{healthyFirst:true}),upgrade});
      continue;
    }
    if(upgrade)cards.push({pos,type:'upgrade',need,upgrade,alternatives:waiverAvailableForPosition(pos,week,3,{healthyFirst:true})});
  }
  return cards;
}
function renderRosterNeedsMoves(roster,week=currentWeekNumber()){
  const strip=$('#waiverNeedStrip'),grid=$('#waiverMajorGrid'),status=$('#waiverMajorNeedStatus');
  if(!strip||!grid)return;
  const cards=rosterNeedsMoveCards(roster,week);
  const potential=cards.filter(x=>x.type==='potential').length;
  const actionable=cards.filter(x=>x.type!=='potential').length;
  if(status)status.textContent=cards.length
    ?`${actionable} action${actionable===1?'':'s'}${potential?` • ${potential} potential problem${potential===1?'':'s'}`:''} • Week ${week}`
    :'No roster moves recommended';

  strip.innerHTML=cards.length?cards.map(x=>{
    const cls=x.type==='action'?'high':x.type==='potential'?'med':'low';
    const label=x.type==='potential'?'POTENTIAL PROBLEM':x.type==='upgrade'?'UPGRADE AVAILABLE':'ACTION NEEDED';
    return `<span class="waiver-need ${cls}">${esc(x.pos)} • ${label}</span>`;
  }).join(''):'<span class="waiver-need low">No roster moves recommended</span>';

  grid.innerHTML=cards.length?cards.map(card=>{
    const {pos,type,need,upgrade,alternatives=[]}=card;
    if(type==='potential'){
      const h=need.health||{};
      return `<div class="waiver-major-card potential">
        <div class="waiver-major-head"><b>${esc(pos)} • MONITOR AVAILABILITY</b><span>${esc(need.reason)}</span></div>
        <div class="waiver-card-why">Questionable players are a precautionary depth risk, not an immediate add/drop recommendation. Monitor their status before kickoff.</div>
        <div class="waiver-major-alts">${alternatives.length?alternatives.map((x,i)=>`
          <div class="waiver-major-alt"><span>${i+1}</span><div><b>${esc(x.player.name)}</b><small>${esc(x.player.team)} • ${x.pts.toFixed(2)} PROJ • possible replacement if needed</small></div></div>`).join('')
          :'<div class="waiver-empty">No projected contingency replacement is currently loaded.</div>'}</div>
      </div>`;
    }
    if(type==='upgrade'&&upgrade){
      const c=upgrade.compare,a=upgrade.add,d=upgrade.delta,pct=Math.round((upgrade.multiplier-1)*100);
      return `<div class="waiver-major-card">
        <div class="waiver-major-head"><b>${esc(pos)} • UPGRADE AVAILABLE</b><span>Healthy roster • worthwhile projected improvement</span></div>
        <div class="waiver-swap positive"><b>ADD ${esc(a.player.name)}${!c.starter?` • DROP CONSIDERATION ${esc(c.player.name)}`:''}</b>
          <small>${a.pts.toFixed(2)} projected • ${d>=0?'+':''}${d.toFixed(2)} vs ${esc(c.player.name)} (${c.starter?'starter':'bench'})</small>
          <div class="swap-arrow">${pct}%+ THRESHOLD</div>
          <small>${esc(c.player.name)} • ${c.pts.toFixed(2)} projected • required ${upgrade.required.toFixed(2)}</small>
        </div>
      </div>`;
    }
    const best=alternatives[0]||null;
    return `<div class="waiver-major-card">
      <div class="waiver-major-head"><b>${esc(pos)} • ROSTER MOVE RECOMMENDED</b><span>${esc(need?.reason||'Roster depth needs attention')}</span></div>
      ${best?`<div class="waiver-card-why"><b>Recommended move:</b> Consider adding ${esc(best.player.name)} (${best.pts.toFixed(2)} projected). ${need?.kind==='health'?'Serious availability loss waives the normal percentage threshold.':''}</div>`:''}
      <div class="waiver-major-alts">${alternatives.length?alternatives.map((x,i)=>`
        <div class="waiver-major-alt"><span>${i+1}</span><div><b>${esc(x.player.name)}</b><small>${esc(x.player.team)} • ${x.pts.toFixed(2)} PROJ${x.health.healthy?' • HEALTHY':` • ${esc(x.health.label)}`}</small></div></div>`).join('')
        :'<div class="waiver-empty">No suitable projected alternative is currently available.</div>'}</div>
    </div>`;
  }).join(''):'<div class="waiver-empty">No roster moves recommended.</div>';
}
function renderWaiverCenter(roster){
  const centerStatus=$('#waiverCenterStatus');
  renderCurrentWaiverOrder();
  if(centerStatus){
    const week=currentWeekNumber(),mine=currentWaiverOrder().find(x=>x.mine);
    centerStatus.textContent=`Week ${week}${mine?.position?` • Waiver #${mine.position}`:''} • health, depth & worthwhile moves`;
  }
  if(!roster){
    const major=$('#waiverMajorGrid');if(major)major.innerHTML='<div class="waiver-empty">Select your Sleeper team.</div>';
    return;
  }
  const week=currentWeekNumber(),map=projectionMapForWeek(week);
  if(!map){
    const status=$('#waiverMajorNeedStatus');if(status)status.textContent=`Week ${week} projections are loading…`;
    const grid=$('#waiverMajorGrid');if(grid)grid.innerHTML='<div class="waiver-empty">Current-week projections are not loaded yet. Saved projection data or the next season sync will populate roster moves.</div>';
    return;
  }
  renderRosterNeedsMoves(roster,week);
}

function transactionMoves(tx){
  const moves=[];
  for(const [pid,rid] of Object.entries(tx?.adds||{})){
    const p=sleeperRosterPlayer(pid);
    moves.push({kind:'add',player:p.name,pos:p.pos||'—',team:transactionTeamName(rid),rosterId:String(rid)});
  }
  for(const [pid,rid] of Object.entries(tx?.drops||{})){
    const p=sleeperRosterPlayer(pid);
    moves.push({kind:'drop',player:p.name,pos:p.pos||'—',team:transactionTeamName(rid),rosterId:String(rid)});
  }
  return moves;
}
function transactionImpact(tx){
  const moves=transactionMoves(tx);
  const added=moves.filter(x=>x.kind==='add'),dropped=moves.filter(x=>x.kind==='drop');
  const byTeam={};
  for(const m of added){
    (byTeam[m.team]??=[]).push(m.pos);
  }
  const parts=[];
  for(const [team,poses] of Object.entries(byTeam)){
    const counts={};poses.forEach(p=>counts[p]=(counts[p]||0)+1);
    const desc=Object.entries(counts).map(([p,n])=>`${n} ${p}`).join(', ');
    parts.push(`${team} added ${desc} depth`);
  }
  if(tx?.type==='trade'&&Array.isArray(tx.roster_ids)&&tx.roster_ids.length>=2){
    parts.unshift(`Trade between ${tx.roster_ids.map(transactionTeamName).join(' and ')}`);
  }
  if(!parts.length&&dropped.length)parts.push('Roster space opened through drops');
  return parts.join(' • ')||'Roster composition changed';
}
function renderLeagueActivity(){
  const feed=$('#activityFeed'),summary=$('#activitySummary'),status=$('#activityStatus');
  if(!feed||!summary||!status)return;
  const card=feed.closest('.activity-center');

  const txs=(currentTransactions||[])
    .filter(tx=>!tx.status||['complete','successful'].includes(String(tx.status).toLowerCase()))
    .slice().sort((a,b)=>Number(b.created||0)-Number(a.created||0));

  if(!txs.length){
    card?.classList.add('compact-empty');
    status.textContent='No recent transactions found';
    summary.innerHTML='';
    feed.innerHTML='<div class="empty">Sleeper has not reported recent waiver, free-agent, or trade activity for the loaded weeks.</div>';
    return;
  }

  card?.classList.remove('compact-empty');
  const counts={trade:0,waiver:0,free_agent:0,other:0};
  txs.forEach(tx=>{const t=String(tx.type||'other');counts[t]=(counts[t]||0)+1;});
  status.textContent=`${txs.length} recent transaction${txs.length===1?'':'s'}`;
  summary.innerHTML=`
    <span><b>${counts.waiver||0}</b> waivers</span>
    <span><b>${counts.free_agent||0}</b> free agents</span>
    <span><b>${counts.trade||0}</b> trades</span>`;

  feed.innerHTML=txs.slice(0,20).map(tx=>{
    const type=String(tx.type||'transaction').toLowerCase();
    const label=type==='free_agent'?'Free Agent':type==='waiver'?'Waiver':type==='trade'?'Trade':type.replace(/_/g,' ');
    const moves=transactionMoves(tx);
    const involved=(tx.roster_ids||[]).map(transactionTeamName);
    const headline=type==='trade'
      ?(involved.length?involved.join(' ↔ '):'League trade')
      :(moves.find(x=>x.kind==='add')?.team||involved[0]||'League transaction');

    const moveHtml=moves.map(m=>`<span class="activity-move ${m.kind}">${m.kind==='add'?'+':'−'} ${esc(m.player)}${m.pos?` • ${esc(m.pos)}`:''}</span>`).join('');
    const detail=moves.length
      ?moves.map(m=>`${m.kind==='add'?'Added':'Dropped'} ${m.player} ${m.kind==='add'?'to':'from'} ${m.team}`).join(' • ')
      :type==='trade'?'Draft-pick or asset trade recorded by Sleeper':'Transaction recorded by Sleeper';

    return `<div class="activity-item ${esc(type)}">
      <div class="activity-head"><b>${esc(headline)}</b><span>${esc(label)}${transactionTimestamp(tx)?` • ${esc(transactionTimestamp(tx))}`:''}</span></div>
      <div class="activity-main">${esc(detail)}</div>
      <div class="activity-moves">${moveHtml}</div>
      <div class="activity-impact">${esc(transactionImpact(tx))}</div>
    </div>`;
  }).join('');
}
