const UCL_PUBLIC_ACHIEVEMENT_BASE='https://rqhqbhdeykoicemztaxp.supabase.co/rest/v1';
const UCL_PUBLIC_ACHIEVEMENT_APIKEY='sb_publishable_JiENIL-NZW2La8uDCOFgcg_5nMlWi7y';
const UCL_PUBLIC_ACHIEVEMENT_SEASON=2026;
const UCL_PUBLIC_ACHIEVEMENT_CACHE_KEY=`${KEY}-public-achievements-v1`;
const UCL_PUBLIC_ACHIEVEMENT_TTL=60000;
let publicAchievementStandings=[];
let publicAchievementUnlocks=[];
let publicAchievementFetchedAt=0;
let publicAchievementSelectedManager='';
let publicAchievementRequest=null;
let publicAchievementError='';

function publicAchievementLoadCache(){
  const cached=storageGetJson(UCL_PUBLIC_ACHIEVEMENT_CACHE_KEY,null);
  if(!cached||Number(cached.season)!==UCL_PUBLIC_ACHIEVEMENT_SEASON)return;
  if(Array.isArray(cached.standings))publicAchievementStandings=cached.standings;
  if(Array.isArray(cached.unlocks))publicAchievementUnlocks=cached.unlocks;
  publicAchievementFetchedAt=Number(cached.fetchedAt||0);
}
function publicAchievementSaveCache(){
  storageSetJson(UCL_PUBLIC_ACHIEVEMENT_CACHE_KEY,{season:UCL_PUBLIC_ACHIEVEMENT_SEASON,fetchedAt:publicAchievementFetchedAt,standings:publicAchievementStandings,unlocks:publicAchievementUnlocks});
}
function publicAchievementFetch(path){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
  return fetch(`${UCL_PUBLIC_ACHIEVEMENT_BASE}/${path}`,{method:'GET',cache:'no-store',signal:controller.signal,headers:{apikey:UCL_PUBLIC_ACHIEVEMENT_APIKEY,Accept:'application/json'}})
    .then(async res=>{if(!res.ok)throw new Error(`Achievement feed ${res.status}`);const data=await res.json();return Array.isArray(data)?data:[];})
    .finally(()=>clearTimeout(timer));
}
function publicAchievementIdentityValues(row){
  return [row?.manager_id,row?.manager_name,row?.team_name].map(v=>normName(String(v||''))).filter(Boolean);
}
function publicAchievementRoster(row){
  const ids=publicAchievementIdentityValues(row);
  return (leagueRosters||[]).find(r=>{
    const u=leagueUserById(r?.owner_id);
    const vals=[r?.owner_id,u?.user_id,u?.username,u?.display_name,u?.metadata?.team_name,rosterUserName(r)].map(v=>normName(String(v||''))).filter(Boolean);
    return ids.some(id=>vals.includes(id));
  })||null;
}
function publicAchievementTeamName(row){const r=publicAchievementRoster(row);return r?rosterUserName(r):String(row?.team_name||row?.manager_name||'UCL Team');}
function publicAchievementManagerKey(row){return String(row?.manager_id||row?.manager_name||row?.team_name||'').trim();}
function publicAchievementRowsForManager(key){
  const standing=publicAchievementStandings.find(r=>publicAchievementManagerKey(r)===String(key));
  if(!standing)return [];
  const ids=publicAchievementIdentityValues(standing);
  return publicAchievementUnlocks.filter(r=>publicAchievementIdentityValues(r).some(id=>ids.includes(id)));
}
function publicAchievementValue(row){
  const cp=Number(row?.chaos_points||0),ap=Number(row?.achievement_points||0);
  return cp>0?{value:cp,label:'CP',cls:'cp'}:{value:ap,label:'AP',cls:''};
}
function publicAchievementTier(row){const v=String(row?.tier||'').trim();return v?`Tier ${v.replace(/^tier\s*/i,'')}`:'';}
function renderPublicAchievementDetail(){
  const el=$('#publicAchievementDetail');if(!el)return;
  const selected=publicAchievementStandings.find(r=>publicAchievementManagerKey(r)===publicAchievementSelectedManager)||publicAchievementStandings[0];
  if(!selected){el.innerHTML='<div class="public-achievement-empty">No achievements unlocked yet.</div>';return;}
  publicAchievementSelectedManager=publicAchievementManagerKey(selected);
  const rows=publicAchievementRowsForManager(publicAchievementSelectedManager).sort((a,b)=>Number(a.unlocked_week||99)-Number(b.unlocked_week||99)||String(a.name||'').localeCompare(String(b.name||'')));
  const team=publicAchievementTeamName(selected);
  const cards=rows.map(row=>{
    const val=publicAchievementValue(row),tier=publicAchievementTier(row),week=Number(row.unlocked_week);
    const meta=[String(row.category||''),tier,Number.isFinite(week)&&week>0?`Week ${week}`:''].filter(Boolean);
    return `<article class="public-achievement-unlock"><div class="public-achievement-unlock-head"><b>${esc(row.name||'Achievement')}</b><span class="public-achievement-value ${val.cls}">+${val.value} ${val.label}</span></div><p>${esc(row.description||'')}</p><div class="public-achievement-meta">${meta.map(x=>`<span>${esc(x)}</span>`).join('')}</div></article>`;
  }).join('');
  el.innerHTML=`<div class="public-achievement-detail-head"><h3>${esc(team)} — Unlocked Achievements</h3><span>${rows.length} public${rows.length===1?' unlock':' unlocks'}</span></div>${cards?`<div class="public-achievement-list">${cards}</div>`:'<div class="public-achievement-empty">No achievements unlocked yet.</div>'}`;
}
function renderPublicAchievements(){
  const list=$('#publicAchievementStandings'),status=$('#publicAchievementStatus'),retry=$('#publicAchievementRetryBtn');if(!list)return;
  if(!publicAchievementStandings.length&&!publicAchievementFetchedAt)publicAchievementLoadCache();
  if(retry){retry.hidden=!publicAchievementError;retry.onclick=()=>refreshPublicAchievements({force:true,rerender:true});}
  if(!publicAchievementStandings.length){
    list.innerHTML=publicAchievementError?`<div class="public-achievement-error">Achievement data is temporarily unavailable. The rest of Season is unaffected.</div>`:'<div class="public-achievement-empty">Loading public achievement standings…</div>';
    if(status)status.textContent=publicAchievementError?'Achievement feed unavailable':'Loading public achievement data…';
    renderPublicAchievementDetail();
  }else{
    const rows=[...publicAchievementStandings].sort((a,b)=>Number(b.achievement_points||0)-Number(a.achievement_points||0)||Number(b.chaos_points||0)-Number(a.chaos_points||0)||Number(b.public_unlock_count||0)-Number(a.public_unlock_count||0)||publicAchievementTeamName(a).localeCompare(publicAchievementTeamName(b)));
    if(!publicAchievementSelectedManager||!rows.some(r=>publicAchievementManagerKey(r)===publicAchievementSelectedManager))publicAchievementSelectedManager=publicAchievementManagerKey(rows[0]);
    list.innerHTML=rows.map((row,i)=>{const key=publicAchievementManagerKey(row),active=key===publicAchievementSelectedManager;return `<button type="button" class="public-achievement-team ${active?'active':''}" data-ach-manager="${esc(key)}" aria-pressed="${active?'true':'false'}"><span class="public-achievement-team-name">${i+1}. ${esc(publicAchievementTeamName(row))}</span><span class="public-achievement-team-score"><span><b>${Number(row.achievement_points||0)}</b> AP</span><span class="cp"><b>${Number(row.chaos_points||0)}</b> CP</span><span><b>${Number(row.public_unlock_count||0)}</b> ${Number(row.public_unlock_count||0)===1?'Achievement':'Achievements'}</span></span></button>`;}).join('');
    list.querySelectorAll('[data-ach-manager]').forEach(btn=>btn.addEventListener('click',()=>{publicAchievementSelectedManager=btn.dataset.achManager||'';renderPublicAchievements();}));
    if(status){const stale=publicAchievementError?' • showing saved public data':'';status.textContent=`Publicly revealed achievements only${stale}`;}
    renderPublicAchievementDetail();
  }
  if(!publicAchievementRequest&&(Date.now()-publicAchievementFetchedAt>UCL_PUBLIC_ACHIEVEMENT_TTL))void refreshPublicAchievements({force:false,rerender:true});
}
async function refreshPublicAchievements({force=false,rerender=false}={}){
  if(publicAchievementRequest)return publicAchievementRequest;
  if(!force&&publicAchievementFetchedAt&&Date.now()-publicAchievementFetchedAt<UCL_PUBLIC_ACHIEVEMENT_TTL){if(rerender)renderPublicAchievements();return {standings:publicAchievementStandings,unlocks:publicAchievementUnlocks};}
  publicAchievementRequest=(async()=>{
    try{
      const [standings,unlocks]=await Promise.all([
        publicAchievementFetch(`ucl_public_achievement_standings?select=season,manager_id,manager_name,team_name,achievement_points,chaos_points,public_unlock_count,updated_at&season=eq.${UCL_PUBLIC_ACHIEVEMENT_SEASON}`),
        publicAchievementFetch(`ucl_public_achievements?select=season,achievement_id,name,description,category,tier,manager_id,manager_name,team_name,achievement_points,chaos_points,unlocked_week,unlocked_at,updated_at&season=eq.${UCL_PUBLIC_ACHIEVEMENT_SEASON}`)
      ]);
      publicAchievementStandings=standings;publicAchievementUnlocks=unlocks;publicAchievementFetchedAt=Date.now();publicAchievementError='';publicAchievementSaveCache();
      return {standings,unlocks};
    }catch(e){
      publicAchievementError=e?.name==='AbortError'?'Achievement feed timed out':String(e?.message||'Achievement feed unavailable');
      console.warn('[UCL Achievements]',publicAchievementError);
      if(!publicAchievementStandings.length)publicAchievementLoadCache();
      return {standings:publicAchievementStandings,unlocks:publicAchievementUnlocks,error:publicAchievementError};
    }finally{publicAchievementRequest=null;if(rerender&&$('#seasonView')?.classList.contains('active'))renderPublicAchievements();}
  })();
  return publicAchievementRequest;
}
publicAchievementLoadCache();
