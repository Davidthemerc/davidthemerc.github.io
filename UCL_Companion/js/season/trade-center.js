const TRADE_LAZY_SECTIONS={
  tradePartnerIdeasSection(mine){renderTradePartnerIdeas(mine);},
  tradeRetrospectivesSection(){renderTradeRetrospectives();}
};
let tradeLazyObserver=null;
let tradeLazyMine=null;
let tradeLazyDirty=new Set(Object.keys(TRADE_LAZY_SECTIONS));
function tradeSectionIsNearViewport(id,margin=140){
  const el=document.getElementById(id);if(!el||!$('#tradeView')?.classList.contains('active'))return false;
  const r=el.getBoundingClientRect(),h=window.innerHeight||document.documentElement.clientHeight||0;
  return r.bottom>=-margin&&r.top<=h+margin;
}
function renderTradeLazySection(id,{force=false}={}){
  const fn=TRADE_LAZY_SECTIONS[id];if(!fn)return false;
  if(!force&&!tradeLazyDirty.has(id))return false;
  fn(tradeLazyMine);
  tradeLazyDirty.delete(id);
  return true;
}
function renderVisibleTradeLazySections(){
  for(const id of Object.keys(TRADE_LAZY_SECTIONS))if(tradeSectionIsNearViewport(id))renderTradeLazySection(id);
}
function ensureTradeLazyObserver(){
  if(tradeLazyObserver)return;
  if(typeof IntersectionObserver!=='function'){
    tradeLazyObserver={fallback:true};
    for(const id of Object.keys(TRADE_LAZY_SECTIONS))renderTradeLazySection(id);
    return;
  }
  tradeLazyObserver=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting)renderTradeLazySection(entry.target.id);
  },{root:null,rootMargin:'140px 0px',threshold:0});
  for(const id of Object.keys(TRADE_LAZY_SECTIONS)){const el=document.getElementById(id);if(el)tradeLazyObserver.observe(el);}
}
function updateTradeLazyContext(mine){
  tradeLazyMine=mine||null;
  tradeLazyDirty=new Set(Object.keys(TRADE_LAZY_SECTIONS));
  if($('#tradePartnerIdeas'))$('#tradePartnerIdeas').innerHTML='';
  if($('#tradeRetrospectives'))$('#tradeRetrospectives').innerHTML='';
  ensureTradeLazyObserver();
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>renderVisibleTradeLazySections());
  else setTimeout(()=>renderVisibleTradeLazySections(),0);
}

function tradeRosterById(id){return leagueRosters.find(r=>String(r.roster_id)===String(id));}
function tradePlayerReference(id){
  const p=sleeperRosterPlayer(id);
  const ranked=PLAYERS.find(x=>normName(x.name)===normName(p.name));
  return {id:String(id),name:p.name,pos:p.pos||'—',team:p.team||'—',rank:ranked?.rank||null,proj:ranked?.proj??null,status:p.status||''};
}
let tradeValueContextCache=null;
function tradeValueContext(){
  const week=currentWeekNumber(),projectionMap=projectionMapForWeek(week);
  const seasonKeys=Object.keys(seasonMatchupsByWeek||{}).filter(w=>isWeekFinalForHistory(Number(w))).sort().join(',');
  if(tradeValueContextCache&&tradeValueContextCache.week===week&&tradeValueContextCache.projectionMap===projectionMap&&tradeValueContextCache.seasonKeys===seasonKeys)return tradeValueContextCache;
  const positions=['QB','RB','WR','TE','K','DEF'];
  const projectionByPos=Object.fromEntries(positions.map(pos=>[pos,[]]));
  if(projectionMap?.size)for(const [id,row] of projectionMap.entries()){
    const pos=sleeperRosterPlayer(id).pos,v=Number(row?.pts);if(projectionByPos[pos]&&Number.isFinite(v))projectionByPos[pos].push(v);
  }
  const rankedRanks=PLAYERS.filter(x=>Number.isFinite(Number(x.rank))).map(x=>Number(x.rank));
  const productionByPlayer=new Map(),productionByPos=Object.fromEntries(positions.map(pos=>[pos,[]]));
  const rosteredByPos=Object.fromEntries(positions.map(pos=>[pos,0]));
  const rosterByPlayer=new Map(),rosterCountsById=new Map();
  const ids=new Set();
  for(const roster of leagueRosters||[]){
    rosterCountsById.set(String(roster.roster_id),rosterPositionCounts(roster));
    for(const id of roster.players||[]){
      const sid=String(id);ids.add(sid);rosterByPlayer.set(sid,roster);
      const pos=sleeperRosterPlayer(sid).pos;if(pos in rosteredByPos)rosteredByPos[pos]++;
    }
  }
  for(const id of ids){
    const scores=[];
    for(const [weekKey,list] of Object.entries(seasonMatchupsByWeek||{})){
      if(!isWeekFinalForHistory(Number(weekKey)))continue;
      for(const m of list||[]){const v=Number(m?.players_points?.[id]);if(Number.isFinite(v))scores.push(v);}
    }
    if(!scores.length)continue;
    const ppg=scores.reduce((a,b)=>a+b,0)/scores.length,pos=sleeperRosterPlayer(id).pos;
    productionByPlayer.set(id,ppg);if(productionByPos[pos])productionByPos[pos].push(ppg);
  }
  tradeValueContextCache={week,projectionMap,seasonKeys,rankedRanks,projectionByPos,productionByPlayer,productionByPos,rosteredByPos,rosterByPlayer,rosterCountsById};
  return tradeValueContextCache;
}
function tradeValueTier(value){
  value=Number(value)||0;
  return value>=90?'Elite':value>=80?'Premium':value>=70?'Strong':value>=60?'Solid':value>=45?'Depth':value>=30?'Fringe':'Minimal';
}
function tradePercentileScore(values,value,{higher=true}={}){
  const nums=(values||[]).filter(Number.isFinite).sort((a,b)=>a-b);
  if(!nums.length||!Number.isFinite(value))return null;
  let below=0,equal=0;
  for(const n of nums){if(n<value)below++;else if(n===value)equal++;}
  const pct=nums.length===1?0.5:(below+Math.max(0,equal-1)/2)/(nums.length-1);
  return Math.max(0,Math.min(100,Math.round((higher?pct:1-pct)*100)));
}
function tradePreseasonScore(p){
  if(!p?.rank)return 24;
  return tradePercentileScore(tradeValueContext().rankedRanks,Number(p.rank),{higher:false})??24;
}
function tradeProjectionScore(p,week=currentWeekNumber()){
  const pts=currentWeekProjectionForPlayer(p?.id,week),pos=String(p?.pos||'').toUpperCase();
  if(!Number.isFinite(Number(pts))||!pos)return null;
  return tradePercentileScore(tradeValueContext().projectionByPos[pos]||[],Number(pts));
}
function tradeSeasonProductionScore(p){
  const pos=String(p?.pos||'').toUpperCase(),ctx=tradeValueContext(),ppg=ctx.productionByPlayer.get(String(p?.id));
  if(!pos||!Number.isFinite(ppg))return null;
  return tradePercentileScore(ctx.productionByPos[pos]||[],ppg);
}
function tradeRosterNeedScoreFromCounts(c,pos){
  if(pos==='QB')return c.QB<Math.max(1,requiredStarterCount('QB'))+1?2:0;
  if(pos==='RB')return c.RB<Math.max(2,requiredStarterCount('RB'))+2?3:c.RB<Math.max(2,requiredStarterCount('RB'))+3?1:0;
  if(pos==='WR')return c.WR<Math.max(3,requiredStarterCount('WR'))+2?3:c.WR<Math.max(3,requiredStarterCount('WR'))+3?1:0;
  if(pos==='TE'){
    if(requiredStarterCount('TE')>0)return c.TE<requiredStarterCount('TE')+1?2:0;
    return flexEligibleCountFromCounts(c)<8&&c.TE<1?1:0;
  }
  if(pos==='K')return c.K<Math.max(1,requiredStarterCount('K'))?2:0;
  if(pos==='DEF')return c.DEF<Math.max(1,requiredStarterCount('DEF'))?2:0;
  return 0;
}
function tradeRoleScore(p){
  const ctx=tradeValueContext(),roster=ctx.rosterByPlayer.get(String(p?.id));
  if(!roster)return 45;
  const starters=new Set((roster.starters||[]).filter(Boolean).map(String));
  if(starters.has(String(p.id)))return 92;
  const pos=String(p.pos||''),counts=ctx.rosterCountsById.get(String(roster.roster_id))||rosterPositionCounts(roster),need=tradeRosterNeedScoreFromCounts(counts,pos);
  return need>=2?68:(counts[pos]||0)<=2?62:52;
}
function tradeScarcityScore(p){
  const pos=String(p?.pos||'').toUpperCase();
  const base={RB:82,WR:72,TE:68,QB:55,K:28,DEF:28}[pos]??45;
  const rostered=Number(tradeValueContext().rosteredByPos[pos]||0);
  const leagueSize=Math.max(1,(leagueRosters||[]).length||8);
  const density=Math.min(18,Math.max(0,(rostered/leagueSize-2)*5));
  return Math.max(20,Math.min(95,Math.round(base+density)));
}
function tradeHealthMultiplier(p){
  const s=String(p?.status||'').toLowerCase();
  if(!s||s==='active'||s==='healthy'||s==='probable')return 1;
  if(s.includes('question'))return .90;
  if(s.includes('doubt'))return .78;
  if(s.includes('out')||s.includes('ir')||s.includes('reserve')||s.includes('pup')||s.includes('suspend'))return .62;
  return .88;
}
function tradePlayerValueDetail(p){
  const week=currentWeekNumber(),finalized=Math.max(0,week-1);
  const preseason=tradePreseasonScore(p),projection=tradeProjectionScore(p,week),production=tradeSeasonProductionScore(p),role=tradeRoleScore(p),scarcity=tradeScarcityScore(p);
  const late=finalized>=6;
  const weights=late?{preseason:.20,projection:.20,production:.30,role:.15,scarcity:.15}:{preseason:.45,projection:.25,production:.10,role:.10,scarcity:.10};
  const parts={preseason,projection,production,role,scarcity};let sum=0,w=0;
  for(const [k,v] of Object.entries(parts)){if(Number.isFinite(v)){sum+=v*weights[k];w+=weights[k];}}
  const raw=w?sum/w:preseason;
  const value=Math.max(0,Math.min(100,Math.round(raw*tradeHealthMultiplier(p))));
  return {value,tier:tradeValueTier(value),parts,health:tradeHealthMultiplier(p)};
}
function tradePlayerValue(p){return tradePlayerValueDetail(p).value;}
function tradeRosterNeedScore(roster,pos){
  return tradeRosterNeedScoreFromCounts(rosterPositionCounts(roster),pos);
}
function tradeRosterFitLabel(roster,pos){
  const n=tradeRosterNeedScore(roster,pos);
  return n>=3?'Strong Need':n>=2?'Need':n>=1?'Useful':'Depth';
}
function selectedTradePlayers(containerId){
  return [...document.querySelectorAll(`#${containerId} input:checked`)].map(x=>tradePlayerReference(x.value));
}
function renderTradePlayerList(roster,containerId){
  const el=$('#'+containerId);if(!el)return;
  if(!roster){el.innerHTML='<div class="empty">Roster unavailable.</div>';return;}
  const starterSet=new Set((roster.starters||[]).map(String)),order=['QB','RB','WR','TE','K','DEF'],counts=rosterPositionCounts(roster);
  const ps=(roster.players||[]).map(tradePlayerReference).map(p=>({...p,tradeDetail:tradePlayerValueDetail(p)})).sort((a,b)=>order.indexOf(a.pos)-order.indexOf(b.pos)||b.tradeDetail.value-a.tradeDetail.value||a.name.localeCompare(b.name));
  const groups=order.map(pos=>({pos,players:ps.filter(p=>p.pos===pos)})).filter(g=>g.players.length);
  el.innerHTML=groups.map(g=>`<section class="trade-position-group"><div class="trade-position-head"><b>${esc(g.pos)}</b><span>${g.players.length}</span></div><div class="trade-position-grid">${g.players.map(p=>{
    const d=p.tradeDetail,n=tradeRosterNeedScoreFromCounts(counts,p.pos),fit=n>=3?'Strong Need':n>=2?'Need':n>=1?'Useful':'Depth';
    return `<label class="trade-player-option"><input type="checkbox" value="${esc(p.id)}"><span class="trade-player-main"><b>${esc(p.name)}${starterSet.has(p.id)?' ★':''}</b><small>${esc(p.team)} • ${p.rank?`#${p.rank}`:'NR'} • ${esc(fit)}</small></span><span class="trade-value" title="UCL Trade Value"><b>${d.value}</b><small>${esc(d.tier)}</small></span></label>`;
  }).join('')}</div></section>`).join('');
}
function renderTradeCenter(){
  const view=$('#tradeView');if(!view)return;
  tradeValueContextCache=null;
  const mine=tradeRosterById(sleeperCtx.rosterId);
  const sel=$('#tradePartner');
  if(!mine){sel.innerHTML='<option>Select your Sleeper team first</option>';renderTradePlayerList(null,'tradeGiveList');renderTradePlayerList(null,'tradeGetList');updateTradeLazyContext(null);return;}
  const others=(leagueRosters||[]).filter(r=>String(r.roster_id)!==String(mine.roster_id));
  const old=sel.value;
  sel.innerHTML=others.map(r=>`<option value="${r.roster_id}">${esc(rosterUserName(r))}</option>`).join('');
  if(others.some(r=>String(r.roster_id)===old))sel.value=old;
  renderTradePlayerList(mine,'tradeGiveList');
  renderTradePlayerList(tradeRosterById(sel.value),'tradeGetList');
  updateTradeLazyContext(mine);
}

function rosterCountsAfterTrade(roster,give,get){
  const c={...rosterPositionCounts(roster)};
  for(const p of give)c[p.pos]=Math.max(0,Number(c[p.pos]||0)-1);
  for(const p of get)c[p.pos]=Number(c[p.pos]||0)+1;
  return c;
}
function rosterConstructionRisk(c){
  let risk=0;
  const req={
    QB:Math.max(1,requiredStarterCount('QB')),
    RB:Math.max(2,requiredStarterCount('RB')),
    WR:Math.max(3,requiredStarterCount('WR')),
    TE:requiredStarterCount('TE'),
    K:Math.max(1,requiredStarterCount('K')),
    DEF:Math.max(1,requiredStarterCount('DEF'))
  };
  for(const pos of ['QB','RB','WR','TE','K','DEF']){
    if(req[pos]>0&&Number(c[pos]||0)<req[pos])risk+=(req[pos]-Number(c[pos]||0))*30;
  }
  if(Number(c.RB||0)<req.RB+1)risk+=18;
  if(Number(c.WR||0)<req.WR+1)risk+=18;
  if(flexEligibleCountFromCounts(c)<req.RB+req.WR+Math.max(1,req.TE)+1)risk+=15;
  return risk;
}
function tradeValueConfidence(players){
  const total=players.length||1;
  const ranked=players.filter(p=>p.rank).length;
  const ratio=ranked/total;
  return ratio===1?'high':ratio>=0.5?'medium':'low';
}
function tradePackageScoreFromValues(values){
  const weights=[1,.65,.42,.30,.22,.17];
  return Math.round((values||[]).map(Number).filter(Number.isFinite).map(v=>Math.max(0,Math.min(100,v))).sort((a,b)=>b-a).reduce((sum,v,i)=>{
    const starValue=Math.pow(v/100,2)*100;
    const slotWeight=weights[i]??Math.max(.10,.17-(i-5)*.02);
    return sum+starValue*slotWeight;
  },0));
}
function tradePackageValue(players){return tradePackageScoreFromValues((players||[]).map(tradePlayerValue));}
function tradeConsolidationLabel(give,get){
  const delta=(give?.length||0)-(get?.length||0);
  if(delta>=2)return 'Strong consolidation';
  if(delta===1)return 'Consolidation';
  if(delta===-1)return 'Depth return';
  if(delta<=-2)return 'Heavy depth return';
  return 'Even roster slots';
}
function evaluateTrade(){
  const mine=tradeRosterById(sleeperCtx.rosterId),partner=tradeRosterById($('#tradePartner')?.value);
  const give=selectedTradePlayers('tradeGiveList'),get=selectedTradePlayers('tradeGetList'),el=$('#tradeEvaluation');
  if(!mine||!partner||!give.length||!get.length){el.innerHTML='<div class="empty">Select at least one player on each side.</div>';return;}

  const rawGive=give.reduce((s,p)=>s+tradePlayerValue(p),0);
  const rawGet=get.reduce((s,p)=>s+tradePlayerValue(p),0);
  const packageGive=tradePackageValue(give),packageGet=tradePackageValue(get);
  const beforeCounts=rosterPositionCounts(mine),afterCounts=rosterCountsAfterTrade(mine,give,get);
  const constructionNet=rosterConstructionRisk(beforeCounts)-rosterConstructionRisk(afterCounts);
  const packageNet=packageGet-packageGive;
  const confidence=tradeValueConfidence([...give,...get]);
  const net=packageNet+constructionNet;
  const consolidation=tradeConsolidationLabel(give,get);

  let verdict;
  if(confidence==='low')verdict=['even','NEEDS RESEARCH'];
  else verdict=net>=18?['good','FAVORABLE']:net<=-18?['bad','UNFAVORABLE']:['even','BALANCED'];

  const reasons=[];
  if(packageNet>=12)reasons.push('The incoming package has the stronger lineup-adjusted value.');
  else if(packageNet<=-12)reasons.push('The outgoing package has the stronger lineup-adjusted value.');
  if(give.length>get.length)reasons.push(`${consolidation}: fewer incoming players means more of the return can fit into starting-lineup and premium bench slots.`);
  else if(get.length>give.length)reasons.push(`${consolidation}: extra incoming depth is discounted because every additional player has less access to a lineup spot.`);
  if(constructionNet>=15)reasons.push('The trade improves your roster construction.');
  else if(constructionNet<=-15)reasons.push('The trade creates or deepens a roster-construction problem.');
  if(confidence!=='high')reasons.push(`${confidence==='medium'?'Some':'Most'} players in this deal are off the custom list, so the value verdict has limited confidence.`);
  if(!reasons.length)reasons.push('The deal is close after accounting for player quality, lineup-slot value, and roster construction.');

  el.innerHTML=`<div class="trade-verdict ${verdict[0]}"><span>TRADE VERDICT II • ${confidence.toUpperCase()} CONFIDENCE</span><b>${verdict[1]}</b><span>${esc(rosterUserName(partner))} trade</span></div>
  <div class="trade-score-grid"><div><b>${packageGive}</b><span>Package Out</span></div><div><b>${packageGet}</b><span>Package In</span></div><div><b>${constructionNet>0?'+':''}${constructionNet}</b><span>Roster Fit</span></div></div>
  <div class="trade-reasons">${reasons.map(x=>`• ${esc(x)}`).join('<br>')}<br><span class="small">Raw player values: ${rawGive} out • ${rawGet} in. Package value discounts additional assets because lineup spots are limited.</span></div>`;
}
function renderTradePartnerIdeas(mine){
  const el=$('#tradePartnerIdeas');if(!el)return;
  const myNeeds=waiverNeedProfile(mine).map(x=>x.pos),mineCounts=rosterPositionCounts(mine);
  const cards=(leagueRosters||[]).filter(r=>String(r.roster_id)!==String(mine.roster_id)).map(r=>{
    const c=rosterPositionCounts(r),theirNeeds=waiverNeedProfile(r).map(x=>x.pos);
    const surplus=[];
    if(c.RB>=5)surplus.push('RB');if(c.WR>=6)surplus.push('WR');if(c.QB>=2)surplus.push('QB');if(c.TE>=2)surplus.push('TE');
    const fit=surplus.filter(p=>myNeeds.includes(p));
    const give=[];
    if(mineCounts.RB>=5&&theirNeeds.includes('RB'))give.push('RB');
    if(mineCounts.WR>=6&&theirNeeds.includes('WR'))give.push('WR');
    if(mineCounts.QB>=2&&theirNeeds.includes('QB'))give.push('QB');
    if(mineCounts.TE>=2&&theirNeeds.includes('TE'))give.push('TE');
    return {r,fit,give,score:fit.length*2+give.length};
  }).sort((a,b)=>b.score-a.score);
  el.innerHTML=cards.map(x=>`<div class="trade-partner-card"><b>${esc(rosterUserName(x.r))}</b><p>${x.score?`Potential fit: they may have ${esc(x.fit.join('/')||'useful')} depth${x.give.length?` while your ${esc(x.give.join('/'))} depth may address their needs`:''}.`:'No obvious complementary positional surplus detected right now.'}</p></div>`).join('');
}
function renderTradeRetrospectives(){
  const el=$('#tradeRetrospectives');if(!el)return;
  const trades=(currentTransactions||[]).filter(tx=>String(tx.type)==='trade').sort((a,b)=>Number(b.created||0)-Number(a.created||0));
  el.innerHTML=trades.length?trades.slice(0,10).map(tx=>{
    const teams=(tx.roster_ids||[]).map(transactionTeamName);
    const moves=transactionMoves(tx);
    return `<div class="activity-item trade"><div class="activity-head"><b>${esc(teams.join(' ↔ ')||'League Trade')}</b><span>${esc(transactionTimestamp(tx))}</span></div><div class="activity-moves">${moves.map(m=>`<span class="activity-move ${m.kind}">${m.kind==='add'?'+':'−'} ${esc(m.player)} • ${esc(m.team)}</span>`).join('')}</div><div class="activity-impact">${esc(transactionImpact(tx))}</div></div>`;
  }).join(''):'<div class="empty">No completed Sleeper trades are present in the currently loaded transaction window.</div>';
}
