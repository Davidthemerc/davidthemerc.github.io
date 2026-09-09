const KEY='ucl-draft-tracker-2026-v1';

const UCL_2026_HOME_ROSTERS_BY_WEEK=Object.freeze({
  1:['2','5','8','6'],
  2:['1','7','3','6'],
  3:['2','1','4','5'],
  4:['3','6','8','5'],
  5:['6','3','7','1'],
  6:['2','5','4','7'],
  7:['2','8','6','3'],
  8:['4','1','7','3'],
  9:['2','4','5','8'],
  10:['7','3','6','8'],
  11:['2','7','1','4'],
  12:['2','8','5','4'],
  13:['8','6','3','1'],
  14:['5','4','1','7']
});
function uclVenueForRoster(week,rosterId){
  const w=Number(week),id=String(rosterId??'');
  if(w<1||w>14||!id)return null;
  const home=UCL_2026_HOME_ROSTERS_BY_WEEK[w]||[];
  return home.includes(id)?'home':'away';
}
function uclVenueLabel(week,rosterId){
  const v=uclVenueForRoster(week,rosterId);
  return v?v.toUpperCase():'';
}
function uclVenuePill(week,rosterId){
  const v=uclVenueForRoster(week,rosterId);
  return v?`<span class="venue-pill ${v}">${v.toUpperCase()}</span>`:'';
}
function uclMatchupNotation(week,rosterId,opponentName){
  const v=uclVenueForRoster(week,rosterId);
  return `${v==='away'?'@':'vs'} ${opponentName}`;
}

const STATE_SCHEMA_VERSION=2;
function storageGet(key,fallback=null){
  try{const v=localStorage.getItem(key);return v===null?fallback:v;}catch(e){return fallback;}
}
function storageSet(key,value){
  try{localStorage.setItem(key,value);return true;}catch(e){return false;}
}
function storageRemove(key){
  try{localStorage.removeItem(key);return true;}catch(e){return false;}
}
function storageGetJson(key,fallback){
  const raw=storageGet(key,null);
  if(raw===null)return fallback;
  try{return JSON.parse(raw);}
  catch(e){
    storageSet(`${key}-recovery-copy`,raw);
    return fallback;
  }
}
function storageSetJson(key,value){return storageSet(key,JSON.stringify(value));}
function normalizePlayerStateEntry(v){
  const src=v&&typeof v==='object'?v:{};
  return {
    ...src,
    draft:['available','mine','other'].includes(src.draft)?src.draft:'available',
    target:!!src.target,
    sleeper:!!src.sleeper,
    avoid:!!src.avoid,
    note:typeof src.note==='string'?src.note:''
  };
}
function migrateState(raw){
  const src=raw&&typeof raw==='object'?raw:{};
  const out={schemaVersion:STATE_SCHEMA_VERSION,players:{},history:[]};
  const players=src.players&&typeof src.players==='object'?src.players:{};
  for(const [rank,v] of Object.entries(players)){
    const n=Number(rank);
    if(Number.isInteger(n)&&n>0&&n<=PLAYERS.length)out.players[n]=normalizePlayerStateEntry(v);
  }
  if(Array.isArray(src.history)){
    out.history=src.history.filter(x=>x&&Number.isInteger(Number(x.rank))&&x.before&&typeof x.before==='object')
      .slice(-30).map(x=>({rank:Number(x.rank),before:normalizePlayerStateEntry(x.before)}));
  }
  return out;
}
function loadState(){
  const raw=storageGetJson(KEY,{schemaVersion:STATE_SCHEMA_VERSION,players:{},history:[]});
  const migrated=migrateState(raw);
  if(!raw||raw.schemaVersion!==STATE_SCHEMA_VERSION)storageSetJson(KEY,migrated);
  return migrated;
}
const state=loadState();state.players||={};state.history||=[];let noteRank=null;
const $=s=>document.querySelector(s);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function ps(rank){return state.players[rank]||={draft:'available',target:false,sleeper:false,avoid:false,note:''}}function save(){storageSetJson(KEY,state)}function snapshot(rank){state.history.push({rank,before:JSON.parse(JSON.stringify(ps(rank)))});if(state.history.length>30)state.history.shift()}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),1700)}
function rowClasses(p){const s=ps(p.rank),c=[s.draft];if(s.target)c.push('target');if(s.sleeper)c.push('sleeper');if(s.avoid)c.push('avoid');return c.join(' ')}
function buttons(p){const s=ps(p.rank);return `<button class="action mine ${s.draft==='mine'?'on':''}" data-act="mine" data-r="${p.rank}">✓ MINE</button><button class="action other ${s.draft==='other'?'on':''}" data-act="other" data-r="${p.rank}">✕ TAKEN</button><button class="action target ${s.target?'on':''}" data-act="target" data-r="${p.rank}">★ Target</button><button class="action sleeper ${s.sleeper?'on':''}" data-act="sleeper" data-r="${p.rank}">◆ Sleeper</button><button class="action avoid ${s.avoid?'on':''}" data-act="avoid" data-r="${p.rank}">! Avoid</button>`}
function draftFilterState(){
  return {
    q:$('#search').value.trim(),
    pos:$('#posFilter').value,
    status:$('#statusFilter').value,
    bye:$('#byeFilter').value,
    sort:$('#sortBy').value
  };
}
function updateDraftFilterSummary(){
  const s=draftFilterState(),parts=[];
  if(s.q)parts.push(`"${s.q}"`);
  if(s.pos)parts.push(s.pos);
  if(s.status)parts.push(s.status==='other'?'TAKEN':s.status.toUpperCase());
  if(s.bye)parts.push(`Bye ${s.bye}`);
  if(s.sort!=='rank')parts.push(s.sort==='proj'?'Proj sort':s.sort==='posrank'?'Position sort':'Name sort');
  const active=!!parts.length;
  $('#searchSummary').textContent=active?parts.join(' • '):'All players • overall rank';
  const clear=$('#clearFiltersBtn');if(clear)clear.hidden=!active;
}
function clearDraftFilters(){
  $('#search').value='';
  $('#posFilter').value='';
  $('#statusFilter').value='';
  $('#byeFilter').value='';
  $('#sortBy').value='rank';
  document.querySelectorAll('[data-quick]').forEach(x=>x.classList.toggle('active',x.dataset.quick==='all'));
  render();
}
function filtered(){const q=$('#search').value.trim().toLowerCase(),pos=$('#posFilter').value,status=$('#statusFilter').value,bye=$('#byeFilter').value;let a=PLAYERS.filter(p=>{const s=ps(p.rank);if(q && !`${p.rank} ${p.name} ${p.team} ${p.pos} ${p.posRank}`.toLowerCase().includes(q)) return false;if(pos&&p.pos!==pos)return false;if(bye&&String(p.bye)!==bye)return false;if(status==='available'&&s.draft!=='available')return false;if(status==='mine'&&s.draft!=='mine')return false;if(status==='other'&&s.draft!=='other')return false;if(status==='target'&&!s.target)return false;if(status==='sleeper'&&!s.sleeper)return false;if(status==='avoid'&&!s.avoid)return false;return true});const sort=$('#sortBy').value;a.sort((x,y)=>sort==='proj'?y.proj-x.proj||x.rank-y.rank:sort==='posrank'?(x.pos.localeCompare(y.pos)||parseInt(x.posRank.match(/\d+/))-parseInt(y.posRank.match(/\d+/))):sort==='name'?x.name.localeCompare(y.name):x.rank-y.rank);return a}
function render(){
  const a=filtered();
  updateDraftFilterSummary();
  $('#tbody').innerHTML=a.map(p=>{
    const s=ps(p.rank);
    if(s.draft==='mine'||s.draft==='other'){
      const label=s.draft==='mine'?'MINE':'TAKEN';
      return `<tr class="${rowClasses(p)} compact-drafted">
        <td class="rank">${p.rank}</td>
        <td colspan="6"><span class="player-name" style="font-size:12px">${esc(p.name)}</span>
          <span class="meta"> • ${p.posRank} • ${p.team}</span></td>
        <td style="white-space:nowrap;text-align:right">
          <span class="compact-status ${s.draft}">${label}</span>${s.source==='sleeper'?'<span class="sleeper-badge">Sleeper</span>':''}
          ${s.draft==='mine'&&s.sleeperPick?`<span class="mine-pick">${pickLabel(s.sleeperPick)}</span>`:''}
          ${s.draft==='other'&&s.draftedBy?`<span class="drafted-by">by ${esc(s.draftedBy)}</span>`:''}
          <button class="compact-edit" data-edit="${p.rank}">Edit</button>
        </td>
      </tr>`;
    }
    return `<tr class="${rowClasses(p)}">
      <td class="rank">${p.rank}</td>
      <td><div class="player-name">${esc(p.name)}</div><div class="meta">${s.note?esc(s.note):''}</div></td>
      <td>${p.team}</td><td><span class="posbadge">${p.posRank}</span></td><td>${p.bye}</td><td><b>${p.proj}</b></td>
      <td><div class="actions">${buttons(p)}</div></td>
      <td><button class="action note-btn" data-note="${p.rank}">${s.note?'📝':'＋'}</button></td>
    </tr>`;
  }).join('');

  $('#mobileList').innerHTML=a.map(p=>{
    const s=ps(p.rank);
    if(s.draft==='mine'||s.draft==='other'){
      const label=s.draft==='mine'?'MINE':'TAKEN';
      return `<article class="card ${rowClasses(p)}" style="padding:7px 9px">
        <div style="display:flex;align-items:center;gap:8px;min-width:0">
          <div style="min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px">
            <strong>${esc(p.name)}</strong> <span class="meta">• ${p.posRank} • ${p.team}</span>
          </div>
          <span class="compact-status ${s.draft}">${label}</span>${s.source==='sleeper'?'<span class="sleeper-badge">Sleeper</span>':''}
          ${s.draft==='mine'&&s.sleeperPick?`<span class="mine-pick">${pickLabel(s.sleeperPick)}</span>`:''}
          ${s.draft==='other'&&s.draftedBy?`<span class="drafted-by">by ${esc(s.draftedBy)}</span>`:''}
          <button class="compact-edit" data-edit="${p.rank}">Edit</button>
        </div>
      </article>`;
    }
    return `<article class="card ${rowClasses(p)}">
      <div class="card-top"><div class="rankbox">#${p.rank}</div>
      <div><div class="player-name">${esc(p.name)}</div><div class="meta">${p.team} • ${p.posRank} • Bye ${p.bye}</div></div>
      <div class="projected">${p.proj}<span>PROJ PTS</span></div></div>
      <div class="card-info">${s.note?`📝 ${esc(s.note)}`:''}</div>
      <div class="mobile-primary-actions">
        <button class="action mine ${s.draft==='mine'?'on':''}" data-act="mine" data-r="${p.rank}">✓ MINE</button>
        <button class="action other ${s.draft==='other'?'on':''}" data-act="other" data-r="${p.rank}">✕ TAKEN</button>
        <details class="mobile-more-actions">
          <summary>More</summary>
          <div class="mobile-secondary-actions">
            <button class="action target ${s.target?'on':''}" data-act="target" data-r="${p.rank}">★ Target</button>
            <button class="action sleeper ${s.sleeper?'on':''}" data-act="sleeper" data-r="${p.rank}">◆ Sleeper</button>
            <button class="action avoid ${s.avoid?'on':''}" data-act="avoid" data-r="${p.rank}">! Avoid</button>
            <button class="action" data-note="${p.rank}">📝 Note</button>
          </div>
        </details>
      </div>
      <div class="card-actions">${buttons(p)}<button class="action" data-note="${p.rank}">📝 Note</button></div>
    </article>`;
  }).join('')||`<div class="empty">No players match these filters.</div>`;
  $('#shownCount').textContent=`Showing ${a.length} of ${PLAYERS.length} ranked players`;
  counts();
  if(typeof renderDraftIntelligence==='function')renderDraftIntelligence();
  if(typeof renderPostDraftReport==='function')renderPostDraftReport();
  if($('#teamView')&&$('#teamView').classList.contains('active'))renderTeam();
}
function counts(){let mine=0,other=0,target=0,sleeper=0;PLAYERS.forEach(p=>{const s=ps(p.rank);if(s.draft==='mine')mine++;if(s.draft==='other')other++;if(s.target)target++;if(s.sleeper)sleeper++});$('#mineCount').textContent=mine;$('#otherCount').textContent=other;$('#targetCount').textContent=target;$('#sleeperCount').textContent=sleeper;$('#pickCount').textContent=mine+other;$('#availableCount').textContent=PLAYERS.length-mine-other}
function doAction(rank,act){
  const p=PLAYERS.find(x=>x.rank===rank),s=ps(rank);snapshot(rank);
  if(act==='mine'){s.draft=s.draft==='mine'?'available':'mine';s.source='manual'}
  if(act==='other'){s.draft=s.draft==='other'?'available':'other';s.source='manual'}
  if(act==='target')s.target=!s.target;
  if(act==='sleeper')s.sleeper=!s.sleeper;
  if(act==='avoid')s.avoid=!s.avoid;
  save();render();
  const label=act==='mine'?(s.draft==='mine'?'MINE':'Available'):act==='other'?(s.draft==='other'?'TAKEN':'Available'):act==='target'?(s.target?'Target added':'Target removed'):act==='sleeper'?(s.sleeper?'Sleeper added':'Sleeper removed'):(s.avoid?'Avoid added':'Avoid removed');
  toast(`${p.name}: ${label}`);
}
$('#seasonWeekSelect')?.addEventListener('change',e=>selectSeasonWeek(e.target.value));
$('#teamWeekSelect')?.addEventListener('change',e=>selectTeamWeek(e.target.value));
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(b)doAction(+b.dataset.r,b.dataset.act);
  const n=e.target.closest('[data-note]');if(n)openNote(+n.dataset.note);
  const ed=e.target.closest('[data-edit]');
  if(ed){
    const rank=+ed.dataset.edit,p=PLAYERS.find(x=>x.rank===rank);
    snapshot(rank);
    ps(rank).draft='available';ps(rank).source='manual';
    save();render();
    toast(`${p.name}: status unlocked`);
  }
});
['search','posFilter','statusFilter','byeFilter','sortBy'].forEach(id=>$('#'+id).addEventListener(id==='search'?'input':'change',render));
document.querySelectorAll('[data-quick]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-quick]').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  const q=b.dataset.quick;$('#statusFilter').value=q==='all'?'':q;render();
}));
$('#clearFiltersBtn').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();clearDraftFilters();});
$('#topAvailable').onclick=()=>{
  $('#statusFilter').value='available';$('#sortBy').value='rank';$('#search').value='';$('#posFilter').value='';$('#byeFilter').value='';
  document.querySelectorAll('[data-quick]').forEach(x=>x.classList.remove('active'));
  render();setSearchCollapsed(true);
  setTimeout(()=>document.querySelector('.table-wrap, .mobile-list')?.scrollIntoView({behavior:'smooth',block:'start'}),20);
};
function openNote(rank){noteRank=rank;const p=PLAYERS.find(x=>x.rank===rank);$('#noteTitle').textContent=`Note — ${p.name}`;$('#noteText').value=ps(rank).note||'';$('#noteDialog').showModal();setTimeout(()=>$('#noteText').focus(),50)}
$('#noteCancel').onclick=()=>$('#noteDialog').close();$('#noteSave').onclick=()=>{snapshot(noteRank);ps(noteRank).note=$('#noteText').value.trim();save();$('#noteDialog').close();render();toast('Note saved')};
$('#undoBtn').onclick=()=>{const h=state.history.pop();if(!h)return toast('Nothing to undo');state.players[h.rank]=h.before;save();render();toast('Last change undone')};
function resetDraftMarks(){
  if(!confirm('Clear manual MINE/TAKEN marks? Sleeper-synced picks, targets, sleepers, avoids, notes, connection data, and Settings will stay.'))return false;
  PLAYERS.forEach(p=>{
    const s=ps(p.rank);
    if(s.source!=='sleeper')s.draft='available';
  });
  state.history=[];
  save();
  renderDraftSyncViews({force:true,changed:true});
  toast('Manual draft marks reset');
  return true;
}
async function resetAllLocalAppData(){
  if(!confirm('Reset all UCL app data on this device? Your Settings preferences will be kept, but draft state, selected team, saved Sleeper data, history imports, and other UCL data will be cleared.'))return false;
  const preferences=snapshotUserPreferences();
  clearNonPreferenceAppStorage();
  restoreUserPreferences(preferences);
  await apiCacheDeleteAll();
  // Reload from a clean runtime so no cleared cache remains alive in memory.
  location.reload();
  return true;
}
$('#resetDraftBtn').onclick=resetDraftMarks;
$('#resetAllBtn').onclick=resetAllLocalAppData;



function seasonDataIsFresh(maxAgeMs=45000){
  return runtimeDataMode==='current' && !!seasonDataMeta.lastSync && Date.now()-seasonDataMeta.lastSync<maxAgeMs && !seasonDataMeta.failures.length;
}
function ensureSeasonDataFresh(force=false){
  if(force||!seasonDataIsFresh())return syncSeasonData(force);
  renderSeasonCompanion();
  return Promise.resolve();
}
function commandAction(label,tab,section='',primary=false){
  return `<button type="button" class="${primary?'primary':''}" data-command-tab="${tab}"${section?` data-command-section="${section}"`:''}>${esc(label)}</button>`;
}
function updateCommandCenter(){
  const dot=$('#syncDot'),txt=$('#syncText'),wrap=dot?.closest('.sync-status');
  if(!dot||!txt||sleeperBusy)return;
  const connected=!!sleeperCtx.username,complete=draftAllowsPostDraftViews();
  const h=companionDataHealth();
  let kind='',healthTitle='Select your team to connect Sleeper.';
  if(!connected){
    kind='';
  }else if(runtimeDataMode==='offline'){
    kind='err';
    healthTitle=`${lastSleeperError||'Sleeper offline'} • ${runtimeCacheAgeText()}`;
  }else if(runtimeDataMode==='stale'){
    kind='busy';
    healthTitle=`Saved Sleeper data • ${runtimeCacheAgeText()}`;
  }else if(runtimeDataMode==='partial'){
    kind='busy';
    healthTitle=`Partial sync • ${h.staleEndpoints?`${h.staleEndpoints} endpoint${h.staleEndpoints===1?'':'s'} using saved data`:h.issues.join(' • ')||'some data unavailable'}`;
  }else if(complete){
    kind=h.ok?'ok':'busy';
    const age=seasonDataMeta.lastSync?Math.max(0,Math.round((Date.now()-seasonDataMeta.lastSync)/60000)):null;
    healthTitle=h.ok?(seasonDataMeta.lastSync?`Sleeper connected • season data ${age}m old`:'Sleeper connected'):`Data review • ${h.issues.join(' • ')}`;
  }else{
    kind='ok';
    const lastSync=lastDraftSyncAt||lastSuccessfulSleeperSyncAt||runtimeLastSuccess;
    healthTitle=lastSync?`Sleeper connected • synced ${debugTime(lastSync)}`:'Sleeper connected';
  }
  dot.className=`sync-dot ${kind}`.trim();
  txt.textContent=healthTitle;
  if(wrap){
    wrap.title=healthTitle;
    wrap.setAttribute('aria-label',healthTitle);
    wrap.setAttribute('role','status');
  }
}
function navigateCommand(tab,section=''){
  const cleanTab=String(tab||'').trim();
  if(!cleanTab)return false;
  const validTabs=new Set(['news','home','draft','analysis','teams','team','season','trade','faw','log','settings']);
  if(!validTabs.has(cleanTab))return false;
  switchTab(cleanTab);
  if(section){
    const scroll=()=>{
      const target=document.getElementById(section);
      if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
    };
    if(cleanTab==='season'){
      if(typeof prepareSeasonSection==='function')prepareSeasonSection(section);
      setTimeout(scroll,35);
    }else setTimeout(scroll,35);
  }
  return true;
}
function renderRestoredRuntimeState(){
  // Only the visible surface gets DOM work. Hidden screens render on demand.
  const active=document.querySelector('.tab-view.active')?.id||'homeView';
  if(active==='newsView'){safeUiCall('restored-activity',()=>renderLeagueActivity());safeUiCall('restored-weekly-report',()=>renderWeeklyLeagueReport());safeUiCall('restored-newsroom',()=>renderNewsroom());safeUiCall('restored-news-rivalry',()=>{if(typeof ensureNewsRivalryData==='function')void ensureNewsRivalryData();});}
  else if(active==='homeView')safeUiCall('restored-home',()=>renderCompanionHome());
  else if(active==='teamsView')safeUiCall('restored-teams',()=>renderLeagueTeams());
  else if(active==='teamView')safeUiCall('restored-my-team',()=>renderTeam());
  else if(active==='seasonView')safeUiCall('restored-season',()=>renderSeasonCompanion());
  else if(active==='tradeView')safeUiCall('restored-trade',()=>renderTradeCenter());
  else if(active==='fawView')safeUiCall('restored-faw',()=>renderFaw());
  else if(active==='draftView')safeUiCall('restored-report-card',()=>renderPostDraftReport());
  else if(active==='settingsView')safeUiCall('restored-settings',()=>renderSettingsView());
  else if(active==='analysisView')safeUiCall('restored-analysis',()=>renderTeamAnalysis());
  else if(active==='logView')safeUiCall('restored-log',()=>renderDraftLog());
  safeUiCall('restored-command',()=>updateCommandCenter());
}
function updateSeasonTabVisibility(){
  const show=seasonToolsAvailable();
  document.querySelectorAll('.season-tab-btn,.tab-btn[data-tab="season"],.tab-btn[data-tab="trade"],.tab-btn[data-tab="faw"]').forEach(b=>b.hidden=!show);
  if(!show){
    if($('#seasonView')?.classList.contains('active')||$('#tradeView')?.classList.contains('active')||$('#fawView')?.classList.contains('active'))switchTab('draft');
  }
}
function updateLiveSeasonDraftUtilityVisibility(){
  const hide=!!FORCE_POST_DRAFT || document.body.classList.contains('live-season-build');
  for(const tab of ['analysis','log']){
    const b=document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    if(b)b.hidden=hide;
  }
}

function homeRosterWarnings(){
  const p=myRosterProfile(),c=p.counts,out=[],r=draftLineupRequirements(),ctx=draftPhaseContext(p);
  if(c.RB<r.RB)out.push({k:'bad',t:`RB ${c.RB}/${r.RB}`});
  if(c.WR<r.WR)out.push({k:'bad',t:`WR ${c.WR}/${r.WR}`});
  if(r.TE>0&&c.TE<r.TE)out.push({k:'bad',t:`TE ${c.TE}/${r.TE}`});
  if(c.QB<r.QB&&(ctx.phase==='late'||ctx.endgame))out.push({k:'warn',t:'QB still open'});
  const flexHave=c.RB+c.WR+c.TE,flexFloor=draftFlexStarterFloor();
  if(flexHave<flexFloor&&ctx.phase!=='early')out.push({k:'warn',t:`FLEX ${flexHave}/${flexFloor}`});
  if(ctx.endgame&&c.K<r.K)out.push({k:'warn',t:'K still open'});
  if(ctx.endgame&&c.DEF<r.DEF)out.push({k:'warn',t:'DEF still open'});
  if(!out.length){
    if(ctx.endgame)out.push({k:'good',t:'Core roster covered'});
    else out.push({k:'good',t:'Roster on track'});
  }
  return out.slice(0,5);
}
function homeThreatRows(){
  if(!sleeperCtx.rosterId)return [];
  const teams=leagueDraftGrades().map(t=>({team:t,a:teamDraftAnalysis(t)}));
  const before=teamsPickingBeforeMe(),top=bestAvailableForMe(1)[0]||null;
  return before.slice(0,4).map(x=>{
    const found=teams.find(y=>String(y.team.rosterId)===String(x.roster.roster_id));
    if(!found)return null;
    const th=threatForOpponent(found.team,found.a,x.next,top);
    return {name:found.team.teamName,pick:x.next,level:th.level,label:th.label,positions:th.likely.slice(0,2).map(z=>z.pos).join('/')};
  }).filter(Boolean);
}
function homeLeagueRows(){
  const teams=leagueDraftGrades().slice(0,4);
  return teams.map(x=>({name:x.teamName,grade:x.grade.letter,score:x.grade.score,picks:x.picks.length}));
}
function homeRecentRows(){
  return lastDraftPicks.slice().sort((a,b)=>(b.pick_no||0)-(a.pick_no||0)).slice(0,5).map(p=>({
    pick:pickLabel(p),
    name:sleeperPickName(p)||String(p.player_id||'Unknown'),
    by:rosterOwnerName(p.roster_id,p.picked_by)
  }));
}

function setHomeNavButton(el,tab,label){
  if(!el)return;
  el.dataset.homeNav=tab;
  delete el.dataset.homeSection;
  el.textContent=label;
}
function homeShortcutIcon(title=''){
  const key=String(title||'').toLowerCase();
  let paths='';
  if(key.includes('this week')||key.includes('season')||key.includes('matchup')){
    paths='<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 9h18"/><path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2"/>';
  }else if(key.includes('trade')){
    paths='<path d="M7 7h12l-3-3M19 7l-3 3"/><path d="M17 17H5l3 3M5 17l3-3"/>';
  }else if(key.includes('my team')){
    paths='<path d="M12 3l7 3v5c0 4.7-2.8 8.1-7 10-4.2-1.9-7-5.3-7-10V6l7-3z"/><path d="M12 7.2l1.25 2.55 2.8.4-2.03 1.98.48 2.8L12 13.6l-2.5 1.33.48-2.8-2.03-1.98 2.8-.4L12 7.2z"/>';
  }else if(key==='teams'||key.includes('team analysis')){
    paths='<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 19c.4-3.5 2.3-5.3 5.5-5.3s5.1 1.8 5.5 5.3"/><path d="M14.5 15c1-.9 2.2-1.3 3.6-1.3 2.2 0 3.6 1.4 3.9 4.1"/>';
  }else if(key.includes('ctespn')||key.includes('news')){
    paths='<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/>';
  }else if(key.includes('report')||key.includes('draft log')){
    paths='<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8 9h8M8 13h8M8 17h5"/>';
  }else if(key.includes('draft')){
    paths='<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>';
  }else{
    paths='<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>';
  }
  return `<span class="home-shortcut-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span>`;
}
function setHomeShortcut(el,tab,title,detail,hidden=false,section=''){
  if(!el)return;
  el.dataset.homeNav=tab;
  if(section)el.dataset.homeSection=section;
  else delete el.dataset.homeSection;
  el.hidden=!!hidden;
  el.type='button';
  el.innerHTML=`${homeShortcutIcon(title)}<span class="home-shortcut-copy"><b>${esc(title)}</b><span class="home-shortcut-detail">${esc(detail)}</span></span>`;
}
function homeSeasonStandings(){
  const rows=standingsOrderFromRecords((leagueRosters||[]).map(r=>({
    roster:r,rosterId:String(r.roster_id),name:rosterUserName(r),
    wins:Number(r.settings?.wins||0),losses:Number(r.settings?.losses||0),ties:Number(r.settings?.ties||0),
    pf:rosterPointsFor(r)
  })));
  return rows.map((x,i)=>({...x,rank:i+1}));
}
function homeNewsRows(){
  try{return newsroomStories().slice(0,3);}catch(e){return [];}
}
function configureHomeForPhase(connected,complete,hasPicks){
  const view=$('#homeView');
  if(view){
    view.classList.toggle('home-view-season',!!complete);
    view.classList.toggle('home-view-live',!!hasPicks&&!complete);
  }

  const main=$('#homeMainAction'),focus=$('#homeFocusAction'),rec=$('#homeRecAction'),grade=$('#homeGradeAction');
  const threatAction=$('#homeThreatAction');
  if(threatAction){
    threatAction.dataset.homeNav=complete?'team':'analysis';
    threatAction.textContent=complete?'My Team':'Team Analysis';
  }

  const s=[1,2,3,4,5,6].map(i=>$(`#homeShortcut${i}`));

  if(!connected){
    setHomeNavButton(main,'draft','Open Rankings');
    setHomeNavButton(focus,'draft','Open Draft Board');
    setHomeNavButton(rec,'draft','Rankings');
    setHomeNavButton(grade,'team','My Team');
    setHomeShortcut(s[0],'draft','Draft Board','Rankings + intelligence');
    setHomeShortcut(s[1],'analysis','Team Analysis','League draft view');
    setHomeShortcut(s[2],'teams','Teams','Browse UCL teams');
    setHomeShortcut(s[3],'team','My Team','Roster planning');
    setHomeShortcut(s[4],'log','Draft Log','Pick history');
    setHomeShortcut(s[5],'season','Season Preview','Ready for kickoff',false);
    return;
  }

  if(!complete){
    setHomeNavButton(main,'draft',hasPicks?'Open Live Draft':'Open Draft Board');
    setHomeNavButton(focus,'draft',hasPicks?'Open Live Draft':'Open Draft Board');
    setHomeNavButton(rec,'draft','Draft Intelligence');
    setHomeNavButton(grade,'team','My Team');
    setHomeShortcut(s[0],'draft',hasPicks?'Live Draft':'Draft Board','Rankings + recommendations');
    setHomeShortcut(s[1],'analysis','Team Analysis','Runs + opponents');
    setHomeShortcut(s[2],'team','My Team','Roster + grade');
    setHomeShortcut(s[3],'teams','Teams','League drafts');
    setHomeShortcut(s[4],'log','Draft Log','Picks + value');
    setHomeShortcut(s[5],'season','Season Preview','Ready for kickoff',false);
    return;
  }

  setHomeNavButton(main,'season','Open This Week');
  setHomeNavButton(focus,'season','Matchup Center');
  setHomeNavButton(rec,'season','This Week');
  rec.dataset.homeSection='seasonThisWeek';
  setHomeNavButton(grade,'teams','Standings');
  setHomeShortcut(s[0],'season','This Week','Matchup + lineup',false,'seasonThisWeek');
  setHomeShortcut(s[1],'trade','Trade Center','Build + evaluate trades');
  setHomeShortcut(s[2],'team','My Team','Roster + season view');
  setHomeShortcut(s[3],'teams','Teams','Standings + team pages');
  setHomeShortcut(s[4],'news','CTESPN','News + weekly report',false);
  setHomeShortcut(s[5],'draft','Report Card','Final draft grade + results',false);
}

function liveDraftTurnState(){
  const current=currentDraftNumber(),nextMine=nextUserPickNumber();
  if(!current||!nextMine)return {kind:'pending',label:'Draft slot pending',away:null,current,nextMine};
  if(nextMine<=current)return {kind:'mine',label:'YOU ARE ON THE CLOCK',away:0,current,nextMine};
  const away=Math.max(0,nextMine-current);
  return {kind:'waiting',label:`Pick #${nextMine} • ${away} away`,away,current,nextMine};
}

function bumpViewFontSizes(root){
  if(!root)return;
  const apply=el=>{
    if(!(el instanceof HTMLElement)||el.dataset.fontBump1==='1')return;
    const tag=el.tagName;
    if(['SCRIPT','STYLE','SVG','PATH','OPTION'].includes(tag))return;
    // Only bump actual text-bearing leaves/controls. Container elements stay
    // unchanged so inherited font sizes cannot compound through nesting.
    const directText=[...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&String(n.textContent||'').trim());
    const textControl=['INPUT','SELECT','TEXTAREA'].includes(tag);
    if(!directText&&!textControl)return;
    const cs=getComputedStyle(el),px=parseFloat(cs.fontSize);
    if(!Number.isFinite(px)||px<=0)return;
    el.style.fontSize=`${px+1}px`;
    el.dataset.fontBump1='1';
  };
  root.querySelectorAll('*').forEach(apply);
}
function installViewFontBump(){
  const roots=['homeView','postDraftReport','seasonView'].map(id=>document.getElementById(id)).filter(Boolean);
  roots.forEach(root=>{
    bumpViewFontSizes(root);
    const observer=new MutationObserver(records=>{
      for(const record of records){
        for(const node of record.addedNodes){
          if(!(node instanceof HTMLElement))continue;
          bumpViewFontSizes(node);
        }
      }
    });
    observer.observe(root,{childList:true,subtree:true});
  });
}
function setHomeCardCompact(contentId,compact=false){
  const el=document.getElementById(contentId);
  const card=el?.closest('.home-card');
  if(card)card.classList.toggle('home-empty-compact',!!compact);
}
