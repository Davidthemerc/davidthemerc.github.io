const CTESPN_MANUAL_NEWS_URL='https://rqhqbhdeykoicemztaxp.supabase.co/rest/v1/ctespn_public_news?select=id,headline,body,week,category,teams,importance,priority,lead_eligible,link,story_date,updated_at,published&published=eq.true&order=story_date.desc,updated_at.desc';
const CTESPN_MANUAL_NEWS_APIKEY='sb_publishable_JiENIL-NZW2La8uDCOFgcg_5nMlWi7y';
let ctespnManualStories=[];
let ctespnManualNewsRequest=null;

function manualNewsValidLink(value){
  if(typeof value!=='string'||!value.trim())return null;
  try{
    const url=new URL(value.trim());
    return ['http:','https:'].includes(url.protocol)?url.href:null;
  }catch(e){return null;}
}
function manualNewsCategory(value){
  const category=String(value||'league').trim().toLowerCase();
  if(category==='games')return 'matchup';
  if(category==='moves')return 'transaction';
  return category;
}
function normalizeManualNewsStory(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.published===false)return null;
  const sourceId=String(raw.id||'').trim();
  const headline=String(raw.headline||'').trim();
  const detail=String(raw.body||'').trim();
  const category=manualNewsCategory(raw.category);
  const week=Number(raw.week);
  const priority=Number(raw.priority);
  const date=String(raw.story_date||'').trim();
  const dateMs=Date.parse(date);
  if(!sourceId||!headline||!detail||!category||!Number.isInteger(week)||week<1||week>18||!Number.isFinite(priority)||!Number.isFinite(dateMs)||!Array.isArray(raw.teams))return null;
  const teams=[...new Set(raw.teams.map(v=>String(v||'').trim()).filter(Boolean))];
  const importance=String(raw.importance||'normal').trim().toLowerCase();
  const leadEligible=raw.lead_eligible===true||importance==='lead';
  const updatedValue=String(raw.updated_at||date).trim()||date;
  const updatedMs=Date.parse(updatedValue);
  return {
    id:`manual:${sourceId}`,
    manualSourceId:sourceId,
    manualSource:true,
    sourceKicker:'CTESPN DESK',
    category,
    priority,
    headline,
    detail,
    fact:importance==='breaking'?'BREAKING':importance==='lead'?'CTESPN DESK':'',
    week,
    kind:importance==='breaking'?'breaking':importance==='lead'?'major':'',
    date,
    dateMs,
    updated:Number.isFinite(updatedMs)?updatedValue:date,
    importance,
    leadEligible,
    manualTeamIdentifiers:teams,
    leagueWide:teams.length===0,
    link:manualNewsValidLink(raw.link)
  };
}
function normalizeManualNewsRows(rows){
  if(!Array.isArray(rows))return [];
  const dedup=new Map();
  for(const raw of rows){
    const story=normalizeManualNewsStory(raw);
    if(!story)continue;
    const prior=dedup.get(story.manualSourceId);
    if(!prior||Date.parse(story.updated||story.date)>=Date.parse(prior.updated||prior.date))dedup.set(story.manualSourceId,story);
  }
  return [...dedup.values()].sort((a,b)=>Number(b.dateMs||0)-Number(a.dateMs||0)||Number(b.priority||0)-Number(a.priority||0)||a.headline.localeCompare(b.headline));
}
function manualStoryMatchesMyTeam(story){
  if(!story?.manualSource)return false;
  if(story.leagueWide)return true;
  const roster=(leagueRosters||[]).find(r=>String(r.roster_id)===String(sleeperCtx.rosterId||''));
  const ownerId=String(roster?.owner_id||'');
  const user=(leagueUsers||[]).find(u=>String(u?.user_id||'')===ownerId);
  const needles=[sleeperCtx.username,sleeperCtx.teamName,roster?rosterUserName(roster):'',user?.username,user?.display_name,user?.metadata?.team_name]
    .map(v=>normName(String(v||''))).filter(Boolean);
  if(!needles.length)return false;
  return (story.manualTeamIdentifiers||[]).some(id=>{
    const n=normName(id);
    return !!n&&needles.includes(n);
  });
}
async function fetchManualNews(){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  try{
    const res=await fetch(CTESPN_MANUAL_NEWS_URL,{
      method:'GET',cache:'no-store',signal:controller.signal,
      headers:{'apikey':CTESPN_MANUAL_NEWS_APIKEY,'Accept':'application/json'}
    });
    if(!res.ok)return [];
    return normalizeManualNewsRows(await res.json());
  }catch(e){return [];}
  finally{clearTimeout(timer);}
}
async function refreshManualNews({rerender=false}={}){
  if(ctespnManualNewsRequest)return ctespnManualNewsRequest;
  ctespnManualNewsRequest=(async()=>{
    const stories=await fetchManualNews();
    ctespnManualStories=stories;
    if(rerender&&$('#newsView')?.classList.contains('active'))renderNewsroom();
    return stories;
  })();
  try{return await ctespnManualNewsRequest;}
  finally{ctespnManualNewsRequest=null;}
}
