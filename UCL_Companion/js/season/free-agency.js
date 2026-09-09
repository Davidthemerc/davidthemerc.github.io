let fawSelectedPosition='ALL';
let fawSelectedWeek=null;
const FAW_POSITIONS=['QB','RB','WR','TE','K','DEF'];
const FAW_MAX_CANDIDATES_PER_POSITION=3;

function fawDisplayWeek(){
  return Math.max(1,Math.min(14,Number(fawSelectedWeek)||currentWeekNumber()));
}
function populateFawWeekSelector(){
  const sel=$('#fawWeekSelect');if(!sel)return;
  const current=currentWeekNumber(),selected=fawDisplayWeek();
  sel.innerHTML=Array.from({length:14},(_,i)=>{
    const w=i+1;
    return `<option value="${w}"${w===selected?' selected':''}>Week ${w}${w===current?' • Current':''}</option>`;
  }).join('');
}
function fawOwnedPlayerIds(){
  const ids=new Set();
  for(const roster of leagueRosters||[])(roster?.players||[]).forEach(id=>{if(id!=null)ids.add(String(id));});
  return ids;
}
function fawMyRoster(){
  return (leagueRosters||[]).find(r=>String(r.roster_id)===String(sleeperCtx.rosterId))||null;
}
function fawKnownPlayer(id){
  const p=sleeperRosterPlayer(id);
  const raw=discoveredSleeperPlayers?.[String(id)]||{};
  const name=String(p?.name||'').trim();
  const pos=String(p?.pos||raw?.position||'').toUpperCase()==='DST'?'DEF':String(p?.pos||raw?.position||'').toUpperCase();
  const team=String(p?.team||raw?.team||'').toUpperCase();
  if(!name||name===String(id)||!FAW_POSITIONS.includes(pos)||!team||team==='—')return null;
  return {...p,id:String(id),name,pos,team,bye:p?.bye??nflTeamByeWeek(team)};
}
function fawWeakestByPosition(week=fawDisplayWeek()){
  const roster=fawMyRoster(),out={};
  if(!roster)return out;
  for(const id of roster.players||[]){
    const p=fawKnownPlayer(id);if(!p)continue;
    const pts=currentWeekProjectionForPlayer(id,week);if(pts==null)continue;
    const row={id:String(id),player:p,pts:Number(pts)};
    if(!out[p.pos]||row.pts<out[p.pos].pts)out[p.pos]=row;
  }
  return out;
}
function fawAvailablePlayers(week=fawDisplayWeek(),positions=FAW_POSITIONS){
  const map=projectionMapForWeek(week),owned=fawOwnedPlayerIds();
  if(!map)return [];
  const wanted=new Set((positions||FAW_POSITIONS).map(pos=>String(pos).toUpperCase()));
  const buckets=new Map([...wanted].map(pos=>[pos,[]]));
  for(const [id,proj] of map.entries()){
    if(owned.has(String(id)))continue;
    const p=fawKnownPlayer(id);if(!p||!wanted.has(p.pos))continue;
    const pts=Number(proj?.pts);
    if(!Number.isFinite(pts))continue;
    const bucket=buckets.get(p.pos);if(!bucket)continue;
    bucket.push({id:String(id),player:p,pts});
    bucket.sort((a,b)=>b.pts-a.pts||a.player.name.localeCompare(b.player.name));
    if(bucket.length>FAW_MAX_CANDIDATES_PER_POSITION)bucket.length=FAW_MAX_CANDIDATES_PER_POSITION;
  }
  return [...buckets.values()].flat();
}
function fawComparison(candidate,weakest){
  if(!weakest)return {delta:null,label:'No roster comparison',kind:'neutral'};
  const delta=candidate.pts-weakest.pts;
  return {
    delta,
    label:`${delta>=0?'+':''}${delta.toFixed(2)} vs ${weakest.player.name}`,
    kind:delta>0?'good':delta<0?'bad':'neutral'
  };
}
function fawPlayerRow(row,weakest){
  const c=fawComparison(row,weakest),p=row.player;
  return `<div class="faw-player-row ${c.kind}">
    <div class="faw-player-main"><b>${esc(p.name)}</b><small>${esc(p.team)} • ${esc(p.pos)}${p.bye?` • Bye ${p.bye}`:''}</small></div>
    <div class="faw-proj"><b>${row.pts.toFixed(2)}</b><span>PROJ</span></div>
    <div class="faw-comp"><b>${esc(c.label)}</b><small>${weakest?`Your low: ${weakest.pts.toFixed(2)} projected`:'No projected player at this position on your roster'}</small></div>
  </div>`;
}
function renderFaw(){
  const groups=$('#fawGroups'),status=$('#fawStatus');if(!groups||!status)return;
  populateFawWeekSelector();
  document.querySelectorAll('[data-faw-pos]').forEach(b=>b.classList.toggle('active',b.dataset.fawPos===fawSelectedPosition));
  if(!sleeperCtx.rosterId||!leagueRosters.length){
    status.textContent='Select your Sleeper team to compare available players.';
    groups.innerHTML='<section class="season-card"><div class="empty">Connect your UCL team to load FA/W comparisons.</div></section>';return;
  }
  const week=fawDisplayWeek(),map=projectionMapForWeek(week);
  if(!map){
    status.textContent=`Week ${week} projections are loading…`;
    groups.innerHTML='<section class="season-card"><div class="empty">Weekly projections are not loaded yet. Saved data or the next season sync will populate this list.</div></section>';
    return;
  }
  const positions=fawSelectedPosition==='ALL'?FAW_POSITIONS:[fawSelectedPosition];
  const available=fawAvailablePlayers(week,positions),weakest=fawWeakestByPosition(week);
  status.textContent=`Week ${week} • Top ${FAW_MAX_CANDIDATES_PER_POSITION} projected options per position`;
  groups.innerHTML=positions.map(pos=>{
    const rows=available.filter(x=>x.player.pos===pos);
    const low=weakest[pos];
    const compare=low?`Your weakest projected ${pos}: ${esc(low.player.name)} • ${low.pts.toFixed(2)}`:`No projected ${pos} comparison on your roster`;
    return `<section class="season-card faw-position-card" data-faw-group="${pos}">
      <div class="season-card-head"><h3>${pos}</h3><span>${compare}</span></div>
      <div class="faw-player-list">${rows.length?rows.map(r=>fawPlayerRow(r,low)).join(''):'<div class="empty">No projected unrostered players found at this position.</div>'}</div>
    </section>`;
  }).join('');
}
async function selectFawWeek(week){
  fawSelectedWeek=Math.max(1,Math.min(14,Number(week)||currentWeekNumber()));
  populateFawWeekSelector();
  try{await syncCurrentWeekProjections(fawSelectedWeek,false);}catch(e){}
  renderFaw();
}

$('#fawWeekSelect')?.addEventListener('change',e=>selectFawWeek(e.target.value));
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-faw-pos]');
  if(!b)return;
  fawSelectedPosition=String(b.dataset.fawPos||'ALL');
  renderFaw();
});
