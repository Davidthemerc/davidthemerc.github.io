function loadStoredHistorySource(){
  if(uclHistorySource)return uclHistorySource;
  try{uclHistorySource=storageGetJson(UCL_HISTORY_SOURCE_KEY,null);}catch(e){uclHistorySource=null;}
  return uclHistorySource;
}
function saveHistorySource(data){
  uclHistorySource=data||null;
  if(data)storageSetJson(UCL_HISTORY_SOURCE_KEY,data);
  else storageRemove(UCL_HISTORY_SOURCE_KEY);
}

const RIVALRY_API_CACHE_KEY=KEY+'-rivalry-api-history-v5';
const RIVALRY_API_CACHE_MAX_AGE=7*24*60*60*1000;
let rivalryApiGames=[];
let rivalryChampionships={};
let rivalryApiPairKey='';
let rivalryApiBusy=false;
let rivalryApiLastError='';
function rivalryApiPair(roster,oppRoster){
  const userA=String(roster?.owner_id||''),userB=String(oppRoster?.owner_id||'');
  if(!userA||!userB)return null;
  const key=[userA,userB].sort().join('|');
  return {key,userA,userB,nameA:rosterUserName(roster),nameB:rosterUserName(oppRoster)};
}
function rivalryApiCacheRead(){
  try{return storageGetJson(RIVALRY_API_CACHE_KEY,{})||{};}catch(e){return {};}
}
function rivalryApiCacheWrite(cache){
  try{storageSetJson(RIVALRY_API_CACHE_KEY,cache||{});}catch(e){}
}
function rivalryApiCachedEntry(pair){
  const entry=rivalryApiCacheRead()?.[pair.key];
  if(!entry||!Array.isArray(entry.games))return null;
  return entry;
}
function rivalryHistoryWeekLimit(league){
  const start=Number(league?.settings?.playoff_week_start||15);
  return Math.max(14,Math.min(18,start+3));
}
function rivalryChampionshipKey(season){return String(Number(season)||'');}
function rivalryChampionshipPair(season){return rivalryChampionships[rivalryChampionshipKey(season)]||null;}
function rivalryGameIsChampionship(game){
  const champ=rivalryChampionshipPair(game?.season);
  if(champ){
    const pair=[String(game?.rosterA||''),String(game?.rosterB||'')].sort().join('|');
    const titlePair=[String(champ.w||''),String(champ.l||'')].sort().join('|');
    const weekMatches=Number(game?.week||0)>0&&Number(game.week)===Number(champ.week||0);
    return !!pair&&pair===titlePair&&weekMatches;
  }
  // Imported history may explicitly identify a championship when no Sleeper
  // bracket metadata is available. A sleeper-history flag is also trusted
  // because rivalryHistoryGameFromWeek only sets it after winners-bracket verification.
  return ['history','sleeper-history'].includes(String(game?.source||''))&&game?.championship===true;
}
async function rivalryChampionshipForLeague(league){
  const leagueId=String(league?.league_id||'');if(!leagueId)return null;
  const season=Number(league?.season||0)||null;
  const res=await sleeperGetSafe(`/league/${leagueId}/winners_bracket`,{ttlMs:30*24*60*60*1000,force:false,fallback:[],label:`${season||'Historical'} playoff bracket`});
  const bracket=Array.isArray(res.value)?res.value:[];
  const title=bracket.find(x=>Number(x?.p)===1&&x?.w!=null&&x?.l!=null)||null;
  if(!title)return null;
  const playoffStart=Number(league?.settings?.playoff_week_start||15);
  const round=Math.max(1,Number(title?.r||1));
  return {
    season,leagueId,w:String(title.w),l:String(title.l),
    matchId:title.m==null?null:Number(title.m),round,week:playoffStart+round-1
  };
}

function sleeperAuthoritativeMatchupScore(matchup){
  if(!matchup)return {value:null,source:'missing'};
  // Sleeper matchup `points` is the authoritative finalized fantasy score.
  // `custom_points` can be stale/alternate data and must never override it.
  const rawValue=matchup.points;
  if(rawValue!==null&&rawValue!==undefined&&rawValue!==''){
    const raw=Number(rawValue);
    if(Number.isFinite(raw))return {value:raw,source:'points'};
  }
  // Retain custom_points only as a defensive fallback for legacy rows where
  // Sleeper supplies no normal points value at all.
  const custom=matchup.custom_points;
  if(custom!==null&&custom!==undefined&&custom!==''){
    const n=Number(custom);
    if(Number.isFinite(n))return {value:n,source:'custom-fallback'};
  }
  return {value:null,source:'missing'};
}
function sleeperMatchupPoints(matchup,fallback=0){
  const score=sleeperAuthoritativeMatchupScore(matchup);
  return score.value==null?fallback:score.value;
}

function rivalryHistoryGameFromWeek(list,rosterA,rosterB,season,week,leagueId,pair){
  const a=(list||[]).find(x=>String(x.roster_id)===String(rosterA));
  const b=(list||[]).find(x=>String(x.roster_id)===String(rosterB));
  if(!a||!b||a.matchup_id==null||String(a.matchup_id)!==String(b.matchup_id))return null;
  const aScore=sleeperAuthoritativeMatchupScore(a),bScore=sleeperAuthoritativeMatchupScore(b);
  const ap=aScore.value,bp=bScore.value;
  if(ap==null||bp==null)return null;
  // Sleeper can expose paired 0-0 rows for weeks that were never actually
  // played by a historical league. A true 0-0 fantasy result is not useful
  // enough to justify risking a phantom rivalry tie, so exclude it.
  if(ap===0&&bp===0)return null;
  return {
    id:`${leagueId}-${week}-${a.matchup_id}`,
    gameKey:`${leagueId}:${week}:${a.matchup_id}`,
    season:Number(season)||null,week:Number(week),
    teamA:pair.nameA,teamB:pair.nameB,
    userA:pair.userA,userB:pair.userB,
    rosterA:String(rosterA),rosterB:String(rosterB),
    scoreA:ap,scoreB:bp,
    scoreSourceA:aScore.source,scoreSourceB:bScore.source,
    source:'sleeper-history',matchupId:Number(a.matchup_id),
    championship:(()=>{
      const c=rivalryChampionshipPair(season);
      return !!c&&Number(week)===Number(c.week)&&[String(rosterA),String(rosterB)].sort().join('|')===[String(c.w),String(c.l)].sort().join('|');
    })()
  };
}
async function rivalryHistoricalMeetingsForLeague(league,pair){
  const leagueId=String(league?.league_id||'');
  if(!leagueId)return [];
  const rostersRes=await sleeperGetSafe(`/league/${leagueId}/rosters`,{ttlMs:30*24*60*60*1000,force:false,fallback:[],label:`${league.season||'Historical'} rosters`});
  const rosters=Array.isArray(rostersRes.value)?rostersRes.value:[];
  const ra=rosters.find(r=>String(r.owner_id)===pair.userA),rb=rosters.find(r=>String(r.owner_id)===pair.userB);
  if(!ra||!rb)return [];
  const maxWeek=rivalryHistoryWeekLimit(league),games=[];
  for(let start=1;start<=maxWeek;start+=4){
    const weeks=[];
    for(let w=start;w<Math.min(start+4,maxWeek+1);w++)weeks.push(w);
    const responses=await Promise.all(weeks.map(w=>sleeperGetSafe(`/league/${leagueId}/matchups/${w}`,{
      ttlMs:30*24*60*60*1000,force:false,fallback:[],label:`${league.season||'Historical'} Week ${w} matchups`
    })));
    responses.forEach((res,i)=>{
      if(!res.ok&&!Array.isArray(res.value))return;
      const game=rivalryHistoryGameFromWeek(Array.isArray(res.value)?res.value:[],ra.roster_id,rb.roster_id,league.season,weeks[i],leagueId,pair);
      if(game)games.push(game);
    });
  }
  return games;
}
async function fetchRivalryApiHistory(pair){
  const games=[];
  rivalryChampionships={};
  if(verifiedLeague){const currentChamp=await rivalryChampionshipForLeague(verifiedLeague);if(currentChamp)rivalryChampionships[rivalryChampionshipKey(verifiedLeague.season||2026)]=currentChamp;}
  let league=verifiedLeague,leagueId=String(league?.previous_league_id||'');
  const seen=new Set();
  while(leagueId&&leagueId!=='0'&&!seen.has(leagueId)){
    seen.add(leagueId);
    const leagueRes=await sleeperGetSafe(`/league/${leagueId}`,{ttlMs:30*24*60*60*1000,force:false,fallback:null,label:'historical league'});
    league=leagueRes.value||null;
    if(!league)break;
    const season=Number(league.season||0);
    if(season&&season<2018)break;
    const championship=await rivalryChampionshipForLeague(league);
    if(championship)rivalryChampionships[rivalryChampionshipKey(season)]=championship;
    games.push(...await rivalryHistoricalMeetingsForLeague(league,pair));
    if(season===2018)break;
    leagueId=String(league.previous_league_id||'');
  }
  return games.sort((a,b)=>(b.season||0)-(a.season||0)||(b.week||0)-(a.week||0));
}



function newsRivalryPairsForWeek(week){
  const list=Number(week)===Number(currentWeekNumber())?(currentMatchups||[]):(seasonMatchupsByWeek?.[week]||[]);
  const seen=new Set(),pairs=[];
  for(const m of list){
    if(m?.matchup_id==null||seen.has(String(m.matchup_id)))continue;
    const other=list.find(x=>String(x.matchup_id)===String(m.matchup_id)&&String(x.roster_id)!==String(m.roster_id));
    if(!other)continue;
    seen.add(String(m.matchup_id));
    const roster=leagueRosters.find(r=>String(r.roster_id)===String(m.roster_id));
    const oppRoster=leagueRosters.find(r=>String(r.roster_id)===String(other.roster_id));
    if(roster&&oppRoster)pairs.push({my:roster,oppRoster,week:Number(week),matchupId:m.matchup_id});
  }
  return pairs;
}
function newsCurrentRivalryPairs(){
  const out=[],seen=new Set();
  for(const week of newsroomWindowWeeks()){
    for(const pair of newsRivalryPairsForWeek(week)){
      const apiPair=rivalryApiPair(pair.my,pair.oppRoster);
      const key=apiPair?.key||`${pair.week}:${pair.matchupId}`;
      if(seen.has(key))continue;seen.add(key);out.push(pair);
    }
  }
  return out;
}

function newsCurrentRivalryPair(){
  return newsCurrentRivalryPairs().find(p=>String(p.my.roster_id)===String(sleeperCtx.rosterId)||String(p.oppRoster.roster_id)===String(sleeperCtx.rosterId))||null;
}

let newsRivalryLeagueBusy=false;
let newsRivalryLoadPromise=null;
let newsRivalryLoadedSignature='';
function newsRivalryWindowSignature(pairs=newsCurrentRivalryPairs()){
  return pairs.map(item=>{
    const pair=rivalryApiPair(item.my,item.oppRoster);
    return `${item.week}:${pair?.key||item.matchupId}`;
  }).sort().join(';');
}
async function ensureNewsRivalryData(){
  const pairs=newsCurrentRivalryPairs();
  if(!pairs.length)return false;
  const signature=newsRivalryWindowSignature(pairs);
  if(signature&&signature===newsRivalryLoadedSignature)return true;
  if(newsRivalryLoadPromise)return newsRivalryLoadPromise;
  newsRivalryLeagueBusy=true;
  newsRivalryLoadPromise=(async()=>{
    const prevGames=rivalryApiGames,prevChamps=rivalryChampionships,prevKey=rivalryApiPairKey;
    try{
      for(const item of pairs){
        const pair=rivalryApiPair(item.my,item.oppRoster);
        if(!pair)continue;
        const cached=rivalryApiCachedEntry(pair);
        if(cached&&Date.now()-Number(cached.savedAt||0)<RIVALRY_API_CACHE_MAX_AGE)continue;
        try{
          const games=await fetchRivalryApiHistory(pair);
          const cache=rivalryApiCacheRead();
          cache[pair.key]={savedAt:Date.now(),games,championships:{...rivalryChampionships}};
          rivalryApiCacheWrite(cache);
        }catch(e){}
      }
      newsRivalryLoadedSignature=signature;
      return true;
    }finally{
      rivalryApiGames=prevGames;rivalryChampionships=prevChamps;rivalryApiPairKey=prevKey;
      newsRivalryLeagueBusy=false;
      newsRivalryLoadPromise=null;
      if($('#newsView')?.classList.contains('active'))renderNewsroom();
    }
  })();
  return newsRivalryLoadPromise;
}

async function ensureRivalryApiHistory(roster,oppRoster){
  const pair=rivalryApiPair(roster,oppRoster);if(!pair||rivalryApiBusy)return;
  rivalryApiPairKey=pair.key;
  const cached=rivalryApiCachedEntry(pair);
  if(cached){
    rivalryApiGames=cached.games||[];
    rivalryChampionships=cached.championships||{};
    renderRivalryContext(roster,oppRoster);
    if($('#newsView')?.classList.contains('active'))renderNewsroom();
    if(Date.now()-Number(cached.savedAt||0)<RIVALRY_API_CACHE_MAX_AGE)return;
  }else rivalryApiGames=[];
  rivalryApiBusy=true;rivalryApiLastError='';
  const status=$('#rivalryStatus');if(status)status.textContent='Loading historical rivalry…';
  try{
    const games=await fetchRivalryApiHistory(pair);
    if(rivalryApiPairKey!==pair.key)return;
    rivalryApiGames=games;
    const cache=rivalryApiCacheRead();
    cache[pair.key]={savedAt:Date.now(),games,championships:rivalryChampionships};
    rivalryApiCacheWrite(cache);
  }catch(e){
    rivalryApiLastError=String(e?.message||e||'Historical rivalry unavailable');
  }finally{
    rivalryApiBusy=false;
    if(rivalryApiPairKey===pair.key){
      renderRivalryContext(roster,oppRoster);
      if($('#newsView')?.classList.contains('active'))renderNewsroom();
    }
  }
}

function normalizedHistoryGames(data){
  if(!data)return [];
  let raw=[];
  if(Array.isArray(data.games))raw.push(...data.games);
  if(Array.isArray(data.matchups))raw.push(...data.matchups);
  if(Array.isArray(data.seasons)){
    for(const s of data.seasons){
      const season=s.season||s.year;
      const games=Array.isArray(s.games)?s.games:Array.isArray(s.matchups)?s.matchups:[];
      raw.push(...games.map(g=>({...g,season:g.season||g.year||season})));
    }
  }
  if(data.schema==='ucl-history-snapshot-v1'&&Array.isArray(data.teams)){
    const seen=new Set();
    for(const t of data.teams){
      for(const w of t.weeklyResults||[]){
        const key=[data.league?.season||2026,w.week,[t.teamName,w.opponent].sort().join('|')].join(':');
        if(seen.has(key))continue;seen.add(key);
        raw.push({
          season:data.league?.season||2026,week:w.week,
          teamA:t.teamName,teamB:w.opponent,
          scoreA:w.pointsFor,scoreB:w.pointsAgainst
        });
      }
    }
  }
  return raw.map((g,i)=>{
    const a=g.teamA||g.home||g.team1||g.managerA||g.rosterA||g.a;
    const b=g.teamB||g.away||g.team2||g.managerB||g.rosterB||g.b;
    const sa=Number(g.scoreA??g.homeScore??g.score1??g.pointsA??g.aScore);
    const sb=Number(g.scoreB??g.awayScore??g.score2??g.pointsB??g.bScore);
    return {
      id:g.id||g.gameId||g.game_id||`import-${i}`,
      season:Number(g.season||g.year||0)||null,
      week:Number(g.week||g.weekNumber||g.leg||0)||null,
      teamA:String(a||''),teamB:String(b||''),
      scoreA:Number.isFinite(sa)?sa:null,scoreB:Number.isFinite(sb)?sb:null,
      gameUrl:g.gameUrl||g.url||g.href||null,
      gameKey:g.gameKey||g.game_key||null,
      source:'history',championship:g.championship===true
    };
  }).filter(g=>g.teamA&&g.teamB&&g.scoreA!=null&&g.scoreB!=null&&!(g.scoreA===0&&g.scoreB===0));
}
function currentSeasonRivalryGames(){
  const out=[],seen=new Set();
  for(const week of Object.keys(seasonMatchupsByWeek||{}).map(Number).filter(isWeekFinalForHistory).sort((a,b)=>a-b)){
    const list=seasonMatchupsByWeek[week]||[];
    for(const a of list){
      if(a.matchup_id==null||seen.has(`${week}:${a.matchup_id}`))continue;
      const b=list.find(x=>String(x.matchup_id)===String(a.matchup_id)&&String(x.roster_id)!==String(a.roster_id));
      if(!b)continue;
      seen.add(`${week}:${a.matchup_id}`);
      const aScore=sleeperAuthoritativeMatchupScore(a),bScore=sleeperAuthoritativeMatchupScore(b);
      const scoreA=aScore.value??0,scoreB=bScore.value??0;
      if(scoreA===0&&scoreB===0)continue;
      out.push({
        id:`2026-${week}-${a.matchup_id}`,season:2026,week,
        teamA:achievementTeamName(a.roster_id),teamB:achievementTeamName(b.roster_id),
        rosterA:String(a.roster_id),rosterB:String(b.roster_id),
        scoreA,scoreB,scoreSourceA:aScore.source,scoreSourceB:bScore.source,
        source:'sleeper',matchupId:Number(a.matchup_id),
        championship:(()=>{
          const c=rivalryChampionshipPair(2026);
          return !!c&&Number(week)===Number(c.week)&&[String(a.roster_id),String(b.roster_id)].sort().join('|')===[String(c.w),String(c.l)].sort().join('|');
        })()
      });
    }
  }
  return out;
}
function sameTeamLabel(a,b){
  const na=normName(String(a||'')),nb=normName(String(b||''));
  return !!na&&!!nb&&na===nb;
}


const VERIFIED_HISTORICAL_SCORE_CORRECTIONS=[
  {
    season:2019,week:10,
    teamA:'dmercado',teamB:'fograw',
    scoreA:140.47,scoreB:138.51,
    source:'verified-sleeper-screenshot',
    note:'Verified against Sleeper league matchup display.'
  }
];
function managerAliasValues(user){
  return [
    user?.username,
    user?.display_name,
    user?.metadata?.team_name
  ].map(x=>normName(String(x||''))).filter(Boolean);
}
function managerIdentityKey(label,ownerId=''){
  const uid=String(ownerId||'').trim();
  if(uid)return `uid:${uid}`;
  const needle=normName(String(label||''));
  if(!needle)return '';
  const user=(leagueUsers||[]).find(u=>managerAliasValues(u).includes(needle));
  return user?.user_id!=null?`uid:${String(user.user_id)}`:`name:${needle}`;
}
function managerIdentityMatches(label,ownerId,identity){
  const a=managerIdentityKey(label,ownerId),b=managerIdentityKey(identity);
  return !!a&&!!b&&a===b;
}
function historicalGameTeamIs(game,identity,side='A'){
  const label=side==='A'?game?.teamA:game?.teamB;
  const ownerId=side==='A'?game?.userA:game?.userB;
  return managerIdentityMatches(label,ownerId,identity);
}
function historicalGameParticipantKey(game,side){
  return managerIdentityKey(
    side==='A'?game?.teamA:game?.teamB,
    side==='A'?game?.userA:game?.userB
  );
}
function historicalGameIdentity(game){
  return [
    Number(game?.season)||0,
    Number(game?.week)||0,
    [historicalGameParticipantKey(game,'A'),historicalGameParticipantKey(game,'B')].sort().join('|')
  ].join(':');
}
function historicalGameSourcePriority(game){
  const source=String(game?.source||'');
  if(source==='verified-correction'||source==='verified-sleeper-screenshot')return 100;
  if(source==='sleeper-history')return 80;
  if(source==='sleeper')return 75;
  if(source==='current-season')return 70;
  if(source==='history')return 60;
  return 50;
}
function verifiedHistoricalCorrectionFor(game){
  const season=Number(game?.season)||0,week=Number(game?.week)||0;
  return VERIFIED_HISTORICAL_SCORE_CORRECTIONS.find(c=>{
    if(Number(c.season)!==season||Number(c.week)!==week)return false;
    const direct=
      managerIdentityMatches(game?.teamA,game?.userA,c.teamA)&&
      managerIdentityMatches(game?.teamB,game?.userB,c.teamB);
    const reverse=
      managerIdentityMatches(game?.teamA,game?.userA,c.teamB)&&
      managerIdentityMatches(game?.teamB,game?.userB,c.teamA);
    return direct||reverse;
  })||null;
}
function applyVerifiedHistoricalCorrection(game){
  const c=verifiedHistoricalCorrectionFor(game);
  if(!c)return game;
  const aIsCorrectionA=managerIdentityMatches(game?.teamA,game?.userA,c.teamA);
  return {
    ...game,
    scoreA:aIsCorrectionA?Number(c.scoreA):Number(c.scoreB),
    scoreB:aIsCorrectionA?Number(c.scoreB):Number(c.scoreA),
    source:'verified-correction',
    originalSource:game.source||null,
    correctionSource:c.source,
    correctionNote:c.note||'Verified historical correction'
  };
}
function verifiedHistoricalSyntheticGames(teamA,teamB){
  return VERIFIED_HISTORICAL_SCORE_CORRECTIONS.filter(c=>{
    const direct=managerIdentityMatches(teamA,'',c.teamA)&&managerIdentityMatches(teamB,'',c.teamB);
    const reverse=managerIdentityMatches(teamA,'',c.teamB)&&managerIdentityMatches(teamB,'',c.teamA);
    return direct||reverse;
  }).map(c=>{
    const inputAIsCorrectionA=managerIdentityMatches(teamA,'',c.teamA);
    return {
      id:`verified-${c.season}-${c.week}-${normName(c.teamA)}-${normName(c.teamB)}`,
      season:Number(c.season),week:Number(c.week),
      teamA,teamB,
      scoreA:inputAIsCorrectionA?Number(c.scoreA):Number(c.scoreB),
      scoreB:inputAIsCorrectionA?Number(c.scoreB):Number(c.scoreA),
      source:'verified-correction',
      correctionSource:c.source,
      correctionNote:c.note||'Verified historical correction'
    };
  });
}
function historicalMatchupAudit(teamA,teamB,season,week){
  const imported=normalizedHistoryGames(loadStoredHistorySource());
  const current=currentSeasonRivalryGames();
  const api=rivalryApiGames||[];
  const synthetic=verifiedHistoricalSyntheticGames(teamA,teamB);
  const wantedSeason=Number(season)||0,wantedWeek=Number(week)||0;
  const rows=[...imported,...api,...current,...synthetic].filter(g=>
    Number(g?.season)===wantedSeason&&Number(g?.week)===wantedWeek
  ).map(raw=>{
    const targetMatch=
      (managerIdentityMatches(raw?.teamA,raw?.userA,teamA)&&managerIdentityMatches(raw?.teamB,raw?.userB,teamB))||
      (managerIdentityMatches(raw?.teamA,raw?.userA,teamB)&&managerIdentityMatches(raw?.teamB,raw?.userB,teamA));
    const corrected=targetMatch?applyVerifiedHistoricalCorrection(raw):raw;
    return {
      targetMatch,
      rawTeamA:raw?.teamA||'',rawTeamB:raw?.teamB||'',
      rawScoreA:Number(raw?.scoreA),rawScoreB:Number(raw?.scoreB),
      source:raw?.source||'unknown',
      participantA:historicalGameParticipantKey(raw,'A'),
      participantB:historicalGameParticipantKey(raw,'B'),
      correctionMatched:corrected?.source==='verified-correction',
      finalScoreA:Number(corrected?.scoreA),finalScoreB:Number(corrected?.scoreB),
      identity:historicalGameIdentity(corrected)
    };
  });
  const final=rivalryGamesBetween(teamA,teamB).find(g=>Number(g.season)===wantedSeason&&Number(g.week)===wantedWeek)||null;
  return {teamA,teamB,season:wantedSeason,week:wantedWeek,rows,final};
}

function rivalryCachedGamesForTeams(teamA,teamB){
  const rosterA=(leagueRosters||[]).find(r=>managerIdentityMatches(rosterUserName(r),r.owner_id,teamA));
  const rosterB=(leagueRosters||[]).find(r=>managerIdentityMatches(rosterUserName(r),r.owner_id,teamB));
  if(!rosterA||!rosterB)return [];
  const pair=rivalryApiPair(rosterA,rosterB);
  const cached=pair?rivalryApiCachedEntry(pair):null;
  return Array.isArray(cached?.games)?cached.games:[];
}
function rivalryGamesBetween(teamA,teamB){
  const imported=normalizedHistoryGames(loadStoredHistorySource());
  const current=currentSeasonRivalryGames();
  const api=rivalryApiGames||[];
  const cached=rivalryCachedGamesForTeams(teamA,teamB);
  const all=[...imported,...api,...cached,...current,...verifiedHistoricalSyntheticGames(teamA,teamB)];
  const byGame=new Map();
  for(const raw of all){
    const match=
      (managerIdentityMatches(raw?.teamA,raw?.userA,teamA)&&managerIdentityMatches(raw?.teamB,raw?.userB,teamB))||
      (managerIdentityMatches(raw?.teamA,raw?.userA,teamB)&&managerIdentityMatches(raw?.teamB,raw?.userB,teamA));
    if(!match)continue;
    const g=applyVerifiedHistoricalCorrection(raw);
    if(Number(g.scoreA)===0&&Number(g.scoreB)===0)continue;
    const key=historicalGameIdentity(g);
    const prev=byGame.get(key);
    if(!prev||historicalGameSourcePriority(g)>historicalGameSourcePriority(prev))byGame.set(key,g);
  }
  return [...byGame.values()].sort((a,b)=>(b.season||0)-(a.season||0)||(b.week||0)-(a.week||0));
}

function rivalrySeries(teamA,teamB,gamesOverride=null){
  const games=Array.isArray(gamesOverride)?gamesOverride:rivalryGamesBetween(teamA,teamB);
  let aWins=0,bWins=0,ties=0,aPts=0,bPts=0,largest=null,closest=null,highestScoring=null;
  for(const g of games){
    const aIsA=historicalGameTeamIs(g,teamA,'A');
    const ap=aIsA?g.scoreA:g.scoreB,bp=aIsA?g.scoreB:g.scoreA;
    aPts+=ap;bPts+=bp;
    if(ap>bp)aWins++;else if(bp>ap)bWins++;else ties++;
    const margin=Math.abs(ap-bp);
    const winner=ap>bp?teamA:bp>ap?teamB:'Tie';
    const result={...g,margin,winner,winnerScore:Math.max(ap,bp),loserScore:Math.min(ap,bp),teamAScore:ap,teamBScore:bp,total:ap+bp};
    if(!largest||margin>largest.margin)largest=result;
    if(!closest||margin<closest.margin)closest=result;
    if(!highestScoring||result.total>highestScoring.total)highestScoring=result;
  }
  const chronological=[...games].sort((x,y)=>(x.season||0)-(y.season||0)||(x.week||0)-(y.week||0));
  let streakTeam=null,streakCount=0,streakStart=null,streakEnd=null;
  let currentTeam=null,currentCount=0,currentStart=null,currentEnd=null;
  for(const g of chronological){
    const aIsA=historicalGameTeamIs(g,teamA,'A'),ap=aIsA?g.scoreA:g.scoreB,bp=aIsA?g.scoreB:g.scoreA;
    const winner=ap>bp?teamA:bp>ap?teamB:null;
    if(!winner){currentTeam=null;currentCount=0;currentStart=null;currentEnd=null;continue;}
    if(winner===currentTeam){currentCount++;currentEnd=g;}
    else{currentTeam=winner;currentCount=1;currentStart=g;currentEnd=g;}
    if(currentCount>=streakCount){
      streakTeam=currentTeam;streakCount=currentCount;streakStart=currentStart;streakEnd=currentEnd;
    }
  }
  const lastChronological=chronological[chronological.length-1]||null;
  const streakActive=!!streakCount&&currentTeam===streakTeam&&currentCount===streakCount&&currentEnd===lastChronological;
  const longestStreak=streakCount?{team:streakTeam,count:streakCount,start:streakStart,end:streakEnd,active:streakActive}:null;
  return {games,aWins,bWins,ties,aPts,bPts,largest,closest,highestScoring,last:games[0]||null,longestStreak};
}

function rivalryStreakSpan(streak){
  if(!streak?.start)return '';
  const start=Number(streak.start.season)||null;
  const end=Number(streak.end?.season)||start;
  if(!start)return '';
  if(streak.active)return `${start}–Present`;
  return end&&end!==start?`${start}–${end}`:`${start}`;
}
function rivalryGameWinnerDetail(game,teamA,teamB){
  if(!game)return {winner:'—',winnerScore:null,loserScore:null,margin:null};
  const aIsA=historicalGameTeamIs(game,teamA,'A');
  const ap=aIsA?Number(game.scoreA):Number(game.scoreB),bp=aIsA?Number(game.scoreB):Number(game.scoreA);
  if(ap===bp)return {winner:'Tie',winnerScore:ap,loserScore:bp,margin:0};
  return {winner:ap>bp?teamA:teamB,winnerScore:Math.max(ap,bp),loserScore:Math.min(ap,bp),margin:Math.abs(ap-bp)};
}
function rivalryResultLine(game,teamA,teamB,{margin=false}={}){
  if(!game)return 'No prior meeting';
  const r=rivalryGameWinnerDetail(game,teamA,teamB);
  if(r.winner==='Tie')return `Tie • ${r.winnerScore.toFixed(2)}-${r.loserScore.toFixed(2)}`;
  return `${r.winner} won • ${r.winnerScore.toFixed(2)}-${r.loserScore.toFixed(2)}${margin?` • ${r.margin.toFixed(2)} PTS`:''}`;
}

function romanNumeral(value){
  let n=Math.max(0,Math.floor(Number(value)||0));if(!n)return '';
  const pairs=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let out='';for(const [v,r] of pairs){while(n>=v){out+=r;n-=v;}}return out;
}
function uclBowlLabel(season){
  const number=Number(season)-2017;
  return number>=1?`UCL Bowl ${romanNumeral(number)}`:'UCL Bowl';
}

function rivalryDetailMarkup(teamA,teamB){
  const a=String(teamA||''),b=String(teamB||''),series=rivalrySeries(a,b);
  const leader=series.aWins===series.bWins?'Series tied':series.aWins>series.bWins?`${a} leads`:`${b} leads`;
  const lastDetail=rivalryGameWinnerDetail(series.last,a,b);
  const metricRows=[
    {l:'Series',v:`${series.aWins}-${series.bWins}${series.ties?`-${series.ties}`:''}`,d:leader},
    {l:'Largest Blowout',v:series.largest?`${series.largest.margin.toFixed(2)} PTS`:'—',d:series.largest?rivalryResultLine(series.largest,a,b):'No result'},
    {l:`${a} PF`,v:series.aPts.toFixed(1),d:'Recorded series points'},
    {l:`${b} PF`,v:series.bPts.toFixed(1),d:'Recorded series points'},
    {l:'Highest-Scoring Meeting',v:series.highestScoring?series.highestScoring.total.toFixed(2):'—',d:series.highestScoring?`${rivalryResultLine(series.highestScoring,a,b)} • ${series.highestScoring.season||'—'} W${series.highestScoring.week||'—'}`:'No prior meeting'},
    {l:'Closest Matchup',v:series.closest?`${series.closest.margin.toFixed(2)} PTS`:'—',d:series.closest?`${rivalryResultLine(series.closest,a,b)} • ${series.closest.season||'—'} W${series.closest.week||'—'}`:'No prior meeting'},
    {l:'Last Meeting',v:series.last?`${series.last.season||'—'} W${series.last.week||'—'}`:'—',d:series.last?rivalryResultLine(series.last,a,b):'No prior meeting'},
    {l:'Longest Win Streak',v:series.longestStreak?`${series.longestStreak.count} Game${series.longestStreak.count===1?'':'s'}`:'—',d:series.longestStreak?`${series.longestStreak.team}${rivalryStreakSpan(series.longestStreak)?` • ${rivalryStreakSpan(series.longestStreak)}`:''}`:'No decided meeting'}
  ];
  const metrics=metricRows.map(x=>`<div class="rivalry-metric"><span>${esc(x.l)}</span><b>${esc(x.v)}</b><small>${esc(x.d)}</small></div>`).join('');
  const games=series.games.length?series.games.slice(0,6).map(g=>{
    const aIsA=historicalGameTeamIs(g,a,'A'),ap=aIsA?g.scoreA:g.scoreB,bp=aIsA?g.scoreB:g.scoreA;
    const winner=ap>bp?a:bp>ap?b:'Tie';
    const championship=rivalryGameIsChampionship(g);
    return `<div class="rivalry-game ${championship?'championship':''}">
      <span class="rg-date">${g.season||'—'} • W${g.week||'—'}${championship?'<em class="rg-champ">🏆 CHAMPIONSHIP</em>':''}</span>
      <div class="rivalry-game-result"><b>${esc(winner==='Tie'?'Tie':`${winner} won`)}</b><small>${ap.toFixed(2)} – ${bp.toFixed(2)}</small></div>
      <span class="rg-margin">Margin: ${Math.abs(ap-bp).toFixed(2)} PTS</span>
    </div>`;
  }).join(''):'<div class="empty">No finalized meeting is available in the current source.</div>';
  const noteRows=[];
  for(const bowlGame of series.games.filter(rivalryGameIsChampionship)){
    const aIsA=historicalGameTeamIs(bowlGame,a,'A'),ap=aIsA?bowlGame.scoreA:bowlGame.scoreB,bp=aIsA?bowlGame.scoreB:bowlGame.scoreA;
    if(ap===bp)continue;
    const winning=ap>bp?a:b,losing=ap>bp?b:a;
    const winningScore=ap>bp?ap:bp,losingScore=ap>bp?bp:ap;
    noteRows.push({d:`${winning} defeated ${losing} ${winningScore.toFixed(2)} to ${losingScore.toFixed(2)} in ${uclBowlLabel(bowlGame.season)} (${bowlGame.season}).`});
  }
  if(series.aWins===0&&series.bWins>0)noteRows.push({d:`${a} has never beaten ${b}.`});
  else if(series.bWins===0&&series.aWins>0)noteRows.push({d:`${b} has never beaten ${a}.`});
  const notes=noteRows.map(x=>`<div class="rivalry-note"><small>${esc(x.d)}</small></div>`).join('');
  return {a,b,series,metrics,games,notes,noteCount:noteRows.length};
}
function renderRivalryDetailElements({hero,metrics,gamesEl,notes,status,sourceNote},teamA,teamB,{loading=false}={}){
  if(!hero||!metrics||!gamesEl||!notes)return;
  if(!teamA||!teamB){
    hero.innerHTML='<div class="rh-kicker">RIVALRY FILE</div><b>Waiting for a paired matchup</b><span>Rivalry history will appear when an opponent is available.</span>';
    metrics.innerHTML='';gamesEl.innerHTML='<div class="empty">No rivalry matchup loaded.</div>';notes.innerHTML='';return;
  }
  const d=rivalryDetailMarkup(teamA,teamB);
  if(status)status.textContent=loading?'Loading historical rivalry…':d.series.games.length?'Rivalry history loaded':'Rivalry history';
  hero.innerHTML=`<div class="rh-kicker">RIVALRY FILE</div><b>${esc(d.a)} vs ${esc(d.b)}</b><span>${d.series.games.length?`${d.series.games.length} recorded meeting${d.series.games.length===1?'':'s'}.`:'No prior meeting found.'}</span>`;
  metrics.innerHTML=d.metrics;gamesEl.innerHTML=d.games;notes.innerHTML=d.notes;
  const notesSection=notes.closest('section');if(notesSection)notesSection.hidden=d.noteCount===0;
  if(sourceNote)sourceNote.textContent=loading?'Checking rivalry history…':`${d.series.games.length} recorded meeting${d.series.games.length===1?'':'s'} available.`;
}
function renderRivalryContext(roster,oppRoster){
  renderRivalryDetailElements({
    hero:$('#rivalryHero'),metrics:$('#rivalryMetrics'),gamesEl:$('#rivalryRecentGames'),notes:$('#rivalryNotes'),
    status:$('#rivalryStatus'),sourceNote:$('#rivalrySourceNote')
  },roster?rosterUserName(roster):'',oppRoster?rosterUserName(oppRoster):'',{loading:rivalryApiBusy});
}

function openNewsRivalryDetail(teamA='',teamB=''){
  let a=String(teamA||''),b=String(teamB||'');
  let pair=null;
  if(!a||!b){
    pair=newsCurrentRivalryPair();
    if(!pair)return false;
    a=rosterUserName(pair.my);b=rosterUserName(pair.oppRoster);
  }else{
    const rosterA=(leagueRosters||[]).find(r=>managerIdentityMatches(rosterUserName(r),r.owner_id,a));
    const rosterB=(leagueRosters||[]).find(r=>managerIdentityMatches(rosterUserName(r),r.owner_id,b));
    if(rosterA&&rosterB)pair={my:rosterA,oppRoster:rosterB};
  }
  const dialog=$('#newsRivalryDialog');if(!dialog)return false;
  renderRivalryDetailElements({
    hero:$('#newsRivalryHero'),metrics:$('#newsRivalryMetrics'),gamesEl:$('#newsRivalryRecentGames'),notes:$('#newsRivalryNotes'),
    status:$('#newsRivalryStatus'),sourceNote:$('#newsRivalrySourceNote')
  },a,b,{loading:newsRivalryLeagueBusy});
  $('#newsRivalryTitle').textContent=`${a} vs ${b}`;
  if(!dialog.open)dialog.showModal();
  if(pair){
    const apiPair=rivalryApiPair(pair.my,pair.oppRoster),cached=apiPair?rivalryApiCachedEntry(apiPair):null;
    if(!cached||Date.now()-Number(cached.savedAt||0)>=RIVALRY_API_CACHE_MAX_AGE){
      void ensureRivalryApiHistory(pair.my,pair.oppRoster).then(()=>{
        if(dialog.open)renderRivalryDetailElements({
          hero:$('#newsRivalryHero'),metrics:$('#newsRivalryMetrics'),gamesEl:$('#newsRivalryRecentGames'),notes:$('#newsRivalryNotes'),
          status:$('#newsRivalryStatus'),sourceNote:$('#newsRivalrySourceNote')
        },a,b,{loading:rivalryApiBusy});
      });
    }
  }
  return true;
}

async function importLeagueHistoryFile(file){
  try{
    const raw=await file.text(),data=JSON.parse(raw),games=normalizedHistoryGames(data);
    if(!games.length)throw new Error('No games were found in that file.');
    saveHistorySource(data);
    toast(`Loaded ${games.length} historical games.`);
    renderSeasonCompanion();
  }catch(e){
    toast(`History import failed: ${e.message}`);
  }
}
let selectedWeeklyReportWeek=null;
let newsroomFilter='all';
let playoffScenarioOutcomes={};
let achievementFilter='all';
const ACHIEVEMENT_MANUAL_KEY=KEY+'-achievement-manual-v1';
function matchupPairsForWeek(week){
  const list=seasonMatchupsByWeek?.[week]||[];
  const seen=new Set(),pairs=[];
  for(const a of list){
    if(a.matchup_id==null||seen.has(String(a.matchup_id)))continue;
    const b=list.find(x=>String(x.matchup_id)===String(a.matchup_id)&&String(x.roster_id)!==String(a.roster_id));
    if(!b)continue;
    seen.add(String(a.matchup_id));
    const ar=leagueRosters.find(r=>String(r.roster_id)===String(a.roster_id));
    const br=leagueRosters.find(r=>String(r.roster_id)===String(b.roster_id));
    const ap=sleeperMatchupPoints(a,0),bp=sleeperMatchupPoints(b,0);
    const winner=ap>bp?a:bp>ap?b:null,loser=ap>bp?b:bp>ap?a:null;
    pairs.push({
      matchupId:a.matchup_id,a,b,ar,br,ap,bp,
      margin:Math.abs(ap-bp),total:ap+bp,
      winner,loser,
      winnerRoster:winner?leagueRosters.find(r=>String(r.roster_id)===String(winner.roster_id)):null,
      loserRoster:loser?leagueRosters.find(r=>String(r.roster_id)===String(loser.roster_id)):null
    });
  }
  return pairs;
}
function standingsAfterWeek(week){
  const rows=(leagueRosters||[]).map(r=>{
    const h=historicalRecordThrough(r.roster_id,week);
    return {rosterId:String(r.roster_id),name:rosterUserName(r),wins:h.wins,losses:h.losses,ties:h.ties,pf:h.pf};
  });
  const ordered=standingsOrderFromRecords(rows);
  return ordered.map((r,i)=>({...r,rank:i+1}));
}
function weeklyRankMap(week){
  const w=Number(week||0);
  if(w<1)return {};
  return Object.fromEntries(standingsAfterWeek(w).map(r=>[r.rosterId,r.rank]));
}
function weeklyMedianScore(week){
  const list=(seasonMatchupsByWeek?.[week]||[]).map(m=>sleeperMatchupPoints(m,0)).sort((a,b)=>a-b);
  if(!list.length)return 0;
  const mid=Math.floor(list.length/2);
  return list.length%2?list[mid]:(list[mid-1]+list[mid])/2;
}
function weeklyStreak(rosterId,throughWeek){
  const results=teamWeeklyResults(rosterId).filter(x=>x.week<=throughWeek).sort((a,b)=>b.week-a.week);
  if(!results.length)return {type:'',count:0};
  const type=results[0].result;
  let count=0;
  for(const r of results){if(r.result===type)count++;else break;}
  return {type,count};
}
function weeklyReportData(week){
  const pairs=matchupPairsForWeek(week);
  if(!pairs.length)return null;
  const scores=(seasonMatchupsByWeek?.[week]||[]).map(m=>({
    roster:leagueRosters.find(r=>String(r.roster_id)===String(m.roster_id)),
    points:sleeperMatchupPoints(m,0),matchup:m
  }));
  const high=scores.slice().sort((a,b)=>b.points-a.points)[0];
  const low=scores.slice().sort((a,b)=>a.points-b.points)[0];
  const closest=pairs.slice().sort((a,b)=>a.margin-b.margin)[0];
  const blowout=pairs.slice().sort((a,b)=>b.margin-a.margin)[0];
  const before=weeklyRankMap(week-1),after=weeklyRankMap(week);
  const upsetCandidates=pairs.filter(p=>p.winner&&before[String(p.winner.roster_id)]&&before[String(p.loser.roster_id)])
    .map(p=>({...p,rankGap:before[String(p.winner.roster_id)]-before[String(p.loser.roster_id)]}))
    .filter(p=>p.rankGap>0).sort((a,b)=>b.rankGap-a.rankGap||b.margin-a.margin);
  const upset=upsetCandidates[0]||null;
  const median=weeklyMedianScore(week);
  const winners=scores.filter(x=>{
    const pair=pairs.find(p=>String(p.winner?.roster_id)===String(x.matchup.roster_id));return !!pair;
  });
  const losers=scores.filter(x=>{
    const pair=pairs.find(p=>String(p.loser?.roster_id)===String(x.matchup.roster_id));return !!pair;
  });
  const lucky=winners.filter(x=>x.points<median).sort((a,b)=>a.points-b.points)[0]||null;
  const unlucky=losers.filter(x=>x.points>median).sort((a,b)=>b.points-a.points)[0]||null;
  const movement=standingsAfterWeek(week).map(r=>{
    const hasPrevious=Object.prototype.hasOwnProperty.call(before,r.rosterId);
    const prev=hasPrevious?before[r.rosterId]:r.rank;
    return {...r,prev,movement:hasPrevious?prev-r.rank:0,hasPrevious};
  }).sort((a,b)=>Math.abs(b.movement)-Math.abs(a.movement)||a.rank-b.rank);
  const trends=[];
  for(const r of leagueRosters||[]){
    const streak=weeklyStreak(r.roster_id,week);
    if(streak.count>=2)trends.push({kind:streak.type==='win'?'hot':streak.type==='loss'?'cold':'move',text:`${rosterUserName(r)}: ${streak.count} straight ${streak.type==='win'?'wins':streak.type==='loss'?'losses':'ties'}`});
  }
  const risers=movement.filter(x=>x.movement>=2);
  risers.forEach(x=>trends.push({kind:'move',text:`${x.name} jumped ${x.movement} standings spots`}));
  const fallers=movement.filter(x=>x.movement<=-2);
  fallers.forEach(x=>trends.push({kind:'cold',text:`${x.name} fell ${Math.abs(x.movement)} standings spots`}));
  return {week,pairs,scores,high,low,closest,blowout,upset,median,lucky,unlucky,movement,trends:trends.slice(0,8)};
}
function weeklyTeamName(roster){return roster?rosterUserName(roster):'Unknown Team';}
function weeklyPairText(pair){
  if(!pair)return '—';
  const a=weeklyTeamName(pair.ar),b=weeklyTeamName(pair.br);
  return `${a} ${pair.ap.toFixed(2)} – ${pair.bp.toFixed(2)} ${b}`;
}


function newsroomStory(id,category,priority,headline,detail,fact,week=null,kind='',extra={}){
  return {id,category,priority,headline,detail,fact,week,kind,...extra};
}
function newsroomWindowWeeks(){
  const current=Math.max(1,currentWeekNumber());
  return current===1?[1]:[current-1,current];
}
function newsroomWeekInWindow(week){
  return newsroomWindowWeeks().includes(Number(week));
}
function newsroomMatchupStories(){
  const stories=[];
  const window=new Set(newsroomWindowWeeks());
  for(const week of finalizedWeeksAsc().filter(w=>window.has(Number(w)))){
    const d=weeklyReportData(week);
    if(!d)continue;

    if(d.high?.points>=160){
      stories.push(newsroomStory(`high-${week}`,'matchup',86,
        `${weeklyTeamName(d.high.roster)} lights up Week ${week}`,
        `${weeklyTeamName(d.high.roster)} posted ${d.high.points.toFixed(2)} points, the highest total of the finalized week.`,
        `Week ${week} high score • ${d.high.points.toFixed(2)}`,week,'positive'));
    }
    if(d.blowout?.margin>=30){
      stories.push(newsroomStory(`blowout-${week}`,'matchup',82,
        `${weeklyTeamName(d.blowout.winnerRoster)} leaves no doubt`,
        `${weeklyTeamName(d.blowout.winnerRoster)} beat ${weeklyTeamName(d.blowout.loserRoster)} by ${d.blowout.margin.toFixed(2)} points.`,
        `Largest Week ${week} margin • ${d.blowout.margin.toFixed(2)}`,week,'major'));
    }
    if(d.closest?.margin<1){
      stories.push(newsroomStory(`photo-${week}`,'matchup',90,
        `Photo finish in Week ${week}`,
        `${weeklyPairText(d.closest)} was decided by only ${d.closest.margin.toFixed(2)} points.`,
        `Closest game • ${d.closest.margin.toFixed(2)}`,week,'breaking'));
    }else if(d.closest?.margin<=3){
      stories.push(newsroomStory(`close-${week}`,'matchup',72,
        `Week ${week} comes down to the wire`,
        `${weeklyPairText(d.closest)} finished with only ${d.closest.margin.toFixed(2)} points separating the teams.`,
        `Closest game • ${d.closest.margin.toFixed(2)}`,week,''));
    }
    if(d.upset&&d.upset.rankGap>=2){
      stories.push(newsroomStory(`upset-${week}`,'standings',88,
        `${weeklyTeamName(d.upset.winnerRoster)} shakes up the table`,
        `The lower-ranked ${weeklyTeamName(d.upset.winnerRoster)} knocked off ${weeklyTeamName(d.upset.loserRoster)} by ${d.upset.margin.toFixed(2)} points.`,
        `Upset • ${d.upset.rankGap}-place pregame rank gap`,week,'major'));
    }
    if(d.unlucky){
      stories.push(newsroomStory(`unlucky-${week}`,'matchup',61,
        `${weeklyTeamName(d.unlucky.roster)} gets nothing for a strong score`,
        `${weeklyTeamName(d.unlucky.roster)} scored ${d.unlucky.points.toFixed(2)}—above the ${d.median.toFixed(2)} league median—and still lost.`,
        `Above-median loss • Week ${week}`,week,''));
    }
    for(const m of d.movement||[]){
      if(m.hasPrevious!==false&&Math.abs(m.movement)>=2){
        stories.push(newsroomStory(`move-${week}-${m.rosterId}`,'standings',70+Math.abs(m.movement),
          `${m.name} ${m.movement>0?'surges':'slides'} ${Math.abs(m.movement)} spots`,
          `${m.name} moved from #${m.prev} to #${m.rank} after Week ${week}.`,
          `Standings movement • ${m.prev} → ${m.rank}`,week,m.movement>0?'positive':'major'));
      }
    }
  }
  return stories;
}
function newsroomStreakStories(){
  const stories=[];
  for(const week of newsroomWindowWeeks()){
    if(!isWeekFinalForHistory(week))continue;
    for(const r of leagueRosters||[]){
      const s=weeklyStreak(r.roster_id,week);
      if(s.count>=3){
        stories.push(newsroomStory(`streak-${week}-${r.roster_id}-${s.type}-${s.count}`,'standings',
          s.count>=5?92:78,
          `${rosterUserName(r)} ${s.type==='win'?'is rolling':'is reeling'}`,
          `${rosterUserName(r)} had ${s.count} straight ${s.type==='win'?'wins':s.type==='loss'?'losses':'ties'} through Week ${week}.`,
          `${s.count}-game ${s.type} streak`,week,s.type==='win'?'positive':'major'));
      }
    }
  }
  return stories;
}
function playoffStatusAtWeek(rosterId,week){
  const rows=standingsAfterWeek(week),slots=playoffTeamCount();
  const row=rows.find(x=>String(x.rosterId)===String(rosterId));
  if(!row)return null;
  const remaining=Math.max(0,(playoffStartWeek()-1)-Number(week));
  return playoffMathStatus(row,rows,slots,remaining);
}
function firstPlayoffStatusWeek(rosterId,kind){
  const max=Math.max(0,currentWeekNumber());
  for(let week=1;week<=max;week++){
    if(!isWeekFinalForHistory(week))continue;
    if(playoffStatusAtWeek(rosterId,week)?.kind===kind)return week;
  }
  return null;
}
function newsroomPlayoffStories(){
  const stories=[],rows=standingsOrderFromRecords(baseStandingsRows()),slots=playoffTeamCount(),remaining=regularSeasonGamesRemaining();
  rows.forEach((r,i)=>r.rank=i+1);
  for(const r of rows){
    const s=playoffMathStatus(r,rows,slots,remaining);
    if(!['clinched','eliminated'].includes(s.kind))continue;
    const week=firstPlayoffStatusWeek(r.rosterId,s.kind);
    if(!week||!newsroomWeekInWindow(week))continue;
    if(s.kind==='clinched'){
      stories.push(newsroomStory(`clinched-${r.rosterId}-${week}`,'standings',96,
        `${r.name} clinches a playoff spot`,
        `${r.name} can no longer fall below the top ${slots} by wins under the Companion’s conservative playoff math.`,
        `CLINCHED • first secured Week ${week}`,week,'positive'));
    }else{
      stories.push(newsroomStory(`elim-${r.rosterId}-${week}`,'standings',94,
        `${r.name} is mathematically eliminated`,
        `At least ${slots} teams already have more wins than ${r.name} can still reach.`,
        `ELIMINATED • became final Week ${week}`,week,'breaking'));
    }
  }
  return stories;
}
function transactionStoryWeek(tx){
  const id=String(tx?.transaction_id??'');
  for(const week of newsroomWindowWeeks()){
    const list=seasonTransactionsByWeek?.[week]||[];
    if(list.some(x=>String(x?.transaction_id??'')===id&&id))return Number(week);
  }
  const explicit=Number(tx?.leg??tx?.week??0);
  if(explicit>0)return explicit;
  return currentWeekNumber();
}
function newsroomTransactionStories(){
  const stories=[],seen=new Set();
  const txs=[];
  for(const week of newsroomWindowWeeks()){
    for(const tx of seasonTransactionsByWeek?.[week]||[])txs.push(tx);
  }
  // Current transactions is a two-week sync fallback; week resolution above
  // maps each item back to its authoritative Sleeper transaction-week bucket.
  txs.push(...(currentTransactions||[]));
  for(const tx of txs.filter(x=>!x.status||['complete','successful'].includes(String(x.status).toLowerCase()))){
    const id=String(tx.transaction_id||tx.created||'');
    if(id&&seen.has(id))continue;if(id)seen.add(id);
    const week=transactionStoryWeek(tx);
    if(!newsroomWeekInWindow(week))continue;
    const type=String(tx.type||'');
    if(type==='trade'){
      const teams=(tx.roster_ids||[]).map(transactionTeamName);
      const moves=transactionMoves(tx);
      stories.push(newsroomStory(`trade-${tx.transaction_id||tx.created}`,'transaction',84,
        `${teams.join(' ↔ ')||'UCL trade'}: deal completed`,
        moves.length?moves.map(m=>`${m.kind==='add'?'Added':'Moved'} ${m.player} ${m.kind==='add'?'to':'from'} ${m.team}`).join(' • '):'Sleeper recorded a completed trade.',
        transactionImpact(tx),week,'major'));
    }else{
      const moves=transactionMoves(tx);
      const add=moves.find(m=>m.kind==='add');
      if(add&&['RB','WR','QB','TE'].includes(add.pos)){
        stories.push(newsroomStory(`move-${tx.transaction_id||tx.created}-${add.player}`,'transaction',54,
          `${add.team} adds ${add.player}`,
          `${add.team} added ${add.player} (${add.pos}) through ${type==='waiver'?'waivers':'free agency'}.`,
          transactionImpact(tx),week,''));
      }
    }
  }
  return stories;
}
function weakerTeamBowlWin(teamA,teamB,series){
  if(!series||series.aWins===series.bWins)return false;
  const weaker=series.aWins<series.bWins?teamA:teamB;
  return series.games.some(g=>{
    if(!rivalryGameIsChampionship(g))return false;
    const weakerIsA=historicalGameTeamIs(g,weaker,'A');
    const wp=weakerIsA?Number(g.scoreA):Number(g.scoreB),op=weakerIsA?Number(g.scoreB):Number(g.scoreA);
    return wp>op;
  });
}
function establishedRivalryContext(teamA,teamB,series=null){
  const s=series||rivalrySeries(teamA,teamB);
  const seasons=new Set(s.games.map(g=>Number(g.season)||null).filter(Boolean));
  const championship=s.games.some(g=>rivalryGameIsChampionship(g));
  const oneSided=s.games.length>0&&(s.aWins===0||s.bWins===0);
  const decided=s.aWins+s.bWins;
  const weakerWins=Math.min(s.aWins,s.bWins);
  const weakerWinShare=decided?weakerWins/decided:0;
  const championshipUpsetException=!oneSided&&weakerTeamBowlWin(teamA,teamB,s);
  const historicallyQualified=s.games.length>=5||championship||seasons.size>=3;
  const competitive=weakerWinShare>=0.25||championshipUpsetException;
  const established=!oneSided&&historicallyQualified&&competitive;
  return {established,oneSided,seasons:seasons.size,championship,games:s.games.length,weakerWinShare,championshipUpsetException,competitive,historicallyQualified};
}
function rivalryStorySeries(teamA,teamB,week){
  const season=Number(verifiedLeague?.season||2026);
  const prior=rivalryGamesBetween(teamA,teamB).filter(g=>
    Number(g.season)!==season||Number(g.week)<Number(week)
  );
  return rivalrySeries(teamA,teamB,prior);
}
function newsroomRivalryStories(){
  const stories=[];
  for(const week of newsroomWindowWeeks()){
    const list=Number(week)===Number(currentWeekNumber())?(currentMatchups||[]):(seasonMatchupsByWeek?.[week]||[]);
    const seen=new Set();
    for(const m of list){
      if(m?.matchup_id==null||seen.has(String(m.matchup_id)))continue;
      const other=list.find(x=>String(x.matchup_id)===String(m.matchup_id)&&String(x.roster_id)!==String(m.roster_id));
      if(!other)continue;
      seen.add(String(m.matchup_id));
      const ra=leagueRosters.find(r=>String(r.roster_id)===String(m.roster_id));
      const rb=leagueRosters.find(r=>String(r.roster_id)===String(other.roster_id));
      if(!ra||!rb)continue;
      const a=rosterUserName(ra),b=rosterUserName(rb),series=rivalryStorySeries(a,b,week);
      const ctx=establishedRivalryContext(a,b,series);
      const hasBowl=series.games.some(g=>rivalryGameIsChampionship(g));
      const extra={teamA:a,teamB:b,teamRosterIds:[String(ra.roster_id),String(rb.roster_id)],seriesGames:series.games.length,hasBowl};
      if(ctx.oneSided&&Math.max(series.aWins,series.bWins)>=5){
        const dominant=series.aWins>0?a:b;
        const searching=series.aWins===0?a:b;
        const wins=Math.max(series.aWins,series.bWins);
        stories.push(newsroomStory(`dominance-${week}-${normName(a)}-${normName(b)}`,'rivalry',72,
          `Can ${searching} finally break through against ${dominant}?`,
          `${dominant} had won all ${wins} decided meeting${wins===1?'':'s'} entering Week ${week}, with ${searching} still searching for a first win against ${dominant}.`,
          `${series.games.length} prior meeting${series.games.length===1?'':'s'} • one-sided series`,week,'rivalry',extra));
      }else if(ctx.established){
        const leader=series.aWins===series.bWins?'Series tied':series.aWins>series.bWins?`${a} leads ${series.aWins}-${series.bWins}`:`${b} leads ${series.bWins}-${series.aWins}`;
        stories.push(newsroomStory(`rivalry-${week}-${normName(a)}-${normName(b)}`,'rivalry',66,
          `${a} and ${b} renew the rivalry`,
          `They meet in Week ${week} with ${series.games.length} recorded prior meetings. ${leader}${series.ties?` with ${series.ties} tie${series.ties===1?'':'s'}`:''}.`,
          series.last?`Last prior meeting • ${series.last.season||'—'} Week ${series.last.week||'—'}`:'Historical series loaded',week,'rivalry',extra));
      }
    }
  }
  return stories;
}
function newsroomStorySort(a,b){
  return b.priority-a.priority||(b.week||0)-(a.week||0)||Number(b.dateMs||0)-Number(a.dateMs||0)||a.headline.localeCompare(b.headline);
}

function newsroomLeadStory(stories){
  if(!stories.length)return null;
  const eligible=stories.filter(s=>!s.manualSource||s.leadEligible===true);
  const pool=eligible.length?eligible:stories.filter(s=>!s.manualSource);
  const candidates=pool.length?pool:stories;
  const onlyRivalry=candidates.every(s=>s.category==='rivalry');
  if(!onlyRivalry)return [...candidates].sort(newsroomStorySort)[0];
  return [...candidates].sort((a,b)=>
    Number(b.seriesGames||0)-Number(a.seriesGames||0)||
    Number(!!b.hasBowl)-Number(!!a.hasBowl)||
    b.priority-a.priority||
    a.headline.localeCompare(b.headline)
  )[0];
}
function newsroomStories(){
  const all=[
    ...newsroomMatchupStories(),
    ...newsroomStreakStories(),
    ...newsroomPlayoffStories(),
    ...newsroomTransactionStories(),
    ...newsroomRivalryStories(),
    ...(ctespnManualStories||[])
  ].filter(s=>newsroomWeekInWindow(s.week));
  const dedup=new Map();
  for(const s of all){
    const prev=dedup.get(s.id);
    if(!prev||s.priority>prev.priority)dedup.set(s.id,s);
  }
  return [...dedup.values()].sort(newsroomStorySort);
}

function renderNewsroom(){
  const lead=$('#newsroomLead'),grid=$('#newsroomGrid'),status=$('#newsroomStatus');
  if(!lead||!grid)return;
  const card=grid.closest('.newsroom-center');
  const all=newsroomStories();
  const myName=rosterUserName(leagueRosters.find(r=>String(r.roster_id)===String(sleeperCtx.rosterId))||{});
  const storyInvolvesMyTeam=s=>{
    const myRosterId=String(sleeperCtx.rosterId||'');
    if(s.manualSource)return manualStoryMatchesMyTeam(s);
    if(myRosterId&&Array.isArray(s.teamRosterIds)&&s.teamRosterIds.includes(myRosterId))return true;
    const needle=normName(myName);
    return !!needle&&[s.headline,s.detail,s.fact,s.teamA,s.teamB].some(v=>normName(v||'').includes(needle));
  };
  const shown=all.filter(s=>newsroomFilter==='all'||(newsroomFilter==='my-team'&&storyInvolvesMyTeam(s))||s.category===newsroomFilter);
  if(status)status.textContent=`${all.length} story signal${all.length===1?'':'s'} detected`;
  if(!all.length){
    card?.classList.add('compact-empty');
    lead.innerHTML='<div class="nr-kicker">CTESPN NEWSROOM</div><b>No major story signal yet</b><span>Finalized games, standings movement, transactions, and playoff math will populate the newsroom as the season develops.</span>';
    grid.innerHTML='<div class="empty">Nothing has crossed the newsroom threshold yet.</div>';return;
  }
  card?.classList.remove('compact-empty');
  const top=newsroomLeadStory(shown.length?shown:all);
  lead.classList.toggle('news-rivalry-link',top.category==='rivalry');
  if(top.category==='rivalry'){
    lead.dataset.openRivalryDetail='1';
    lead.dataset.rivalryTeamA=top.teamA||'';
    lead.dataset.rivalryTeamB=top.teamB||'';
    lead.setAttribute('role','button');lead.tabIndex=0;
  }else{
    delete lead.dataset.openRivalryDetail;delete lead.dataset.rivalryTeamA;delete lead.dataset.rivalryTeamB;
    lead.removeAttribute('role');lead.removeAttribute('tabindex');
  }
  const leadKicker=top.manualSource?(top.sourceKicker||'CTESPN DESK'):'CTESPN LEAD STORY';
  const leadLink=top.link?`<a class="nr-external-link" href="${esc(top.link)}" target="_blank" rel="noopener noreferrer">Read more ↗</a>`:'';
  lead.innerHTML=`<div class="nr-kicker">${esc(leadKicker)}${top.week?` • WEEK ${top.week}`:''}</div><b>${esc(top.headline)}</b><span>${esc(top.detail)}</span>${top.category==='rivalry'?'<small class="nr-open-detail">Tap for rivalry history ↗</small>':''}${leadLink}`;
  grid.innerHTML=shown.length?shown.slice(0,18).map((s,i)=>`<article class="news-card ${esc(s.kind||'')} ${s.category==='rivalry'?'news-rivalry-link':''}" ${s.category==='rivalry'?`data-open-rivalry-detail="1" data-rivalry-team-a="${esc(s.teamA||'')}" data-rivalry-team-b="${esc(s.teamB||'')}" role="button" tabindex="0"`:''}>
    <div class="nc-top"><span class="nc-tag">${esc(s.manualSource?(s.sourceKicker||'CTESPN DESK'):s.category)}</span><span class="nc-when">${s.week?`Week ${s.week}`:'Current'}</span></div>
    <h4>${esc(s.headline)}</h4>
    <p>${esc(s.detail)}</p>
    <div class="nc-fact">${esc(s.fact||'')}${s.category==='rivalry'?'<span class="nc-open-detail"> • Tap for history ↗</span>':''}${s.link?`<a class="nc-external-link" href="${esc(s.link)}" target="_blank" rel="noopener noreferrer">Read more ↗</a>`:''}</div>
  </article>`).join(''):'<div class="empty">No stories match this filter.</div>';
}
function renderWeeklyLeagueReport(){
  const select=$('#weeklyReportWeek'),hero=$('#weeklyReportHero'),awards=$('#weeklyReportAwards'),copy=$('#weeklyReportCopy'),moves=$('#weeklyMovementList'),trends=$('#weeklyTrendList'),status=$('#weeklyReportStatus');
  if(!select||!hero||!awards||!copy||!moves||!trends)return;
  const card=copy.closest('.weekly-report');
  const finalized=Object.keys(seasonMatchupsByWeek||{}).map(Number).filter(w=>isWeekFinalForHistory(w)&&(seasonMatchupsByWeek[w]||[]).length).sort((a,b)=>b-a);
  if(!finalized.length){
    card?.classList.add('compact-empty');
    select.innerHTML='<option>No finalized weeks</option>';select.disabled=true;
    hero.innerHTML='<div class="wr-kicker">CTESPN WEEKLY</div><b>No completed weeks yet</b><span>Weekly reports begin after the first completed week.</span>';
    awards.innerHTML='';copy.innerHTML='<div class="empty">No completed week is available yet.</div>';moves.innerHTML='';trends.innerHTML='';return;
  }
  card?.classList.remove('compact-empty');
  select.disabled=false;
  if(!selectedWeeklyReportWeek||!finalized.includes(Number(selectedWeeklyReportWeek)))selectedWeeklyReportWeek=finalized[0];
  select.innerHTML=finalized.map(w=>`<option value="${w}" ${Number(w)===Number(selectedWeeklyReportWeek)?'selected':''}>Week ${w}</option>`).join('');
  const d=weeklyReportData(Number(selectedWeeklyReportWeek));
  if(!d)return;
  status.textContent=`Week ${d.week} final • CTESPN desk`;

  const highName=weeklyTeamName(d.high?.roster),lowName=weeklyTeamName(d.low?.roster);
  hero.innerHTML=`<div class="wr-kicker">CTESPN • WEEK ${d.week} FINAL</div><b>${esc(highName)} sets the pace at ${d.high.points.toFixed(2)}</b><span>${esc(weeklyPairText(d.closest))} was the closest finish of the week.</span>`;

  const awardData=[
    {cls:'hot',label:'HIGH SCORE',name:highName,detail:`${d.high.points.toFixed(2)} points`},
    {cls:'cold',label:'LOW SCORE',name:lowName,detail:`${d.low.points.toFixed(2)} points`},
    {cls:'chaos',label:'CLOSEST GAME',name:d.closest?.winnerRoster?weeklyTeamName(d.closest.winnerRoster):'Tie',detail:`${d.closest.margin.toFixed(2)}-point margin`},
    {cls:'chaos',label:'BIGGEST BLOWOUT',name:d.blowout?.winnerRoster?weeklyTeamName(d.blowout.winnerRoster):'Tie',detail:`${d.blowout.margin.toFixed(2)}-point margin`}
  ];
  awards.innerHTML=awardData.map(x=>`<div class="weekly-award ${x.cls}"><span>${x.label}</span><b>${esc(x.name)}</b><small>${esc(x.detail)}</small></div>`).join('');

  const lines=[];
  lines.push(`<b>Scoreboard:</b> ${esc(highName)} led the league with ${d.high.points.toFixed(2)}, while ${esc(lowName)} finished at ${d.low.points.toFixed(2)}.`);

  if(d.upset)lines.push(`<b>Upset alert:</b> ${esc(weeklyTeamName(d.upset.winnerRoster))}, ranked #${weeklyRankMap(d.week-1)[String(d.upset.winner.roster_id)]}, beat #${weeklyRankMap(d.week-1)[String(d.upset.loser.roster_id)]} ${esc(weeklyTeamName(d.upset.loserRoster))} by ${d.upset.margin.toFixed(2)}.`);
  else lines.push(`<b>Upset alert:</b> No lower-ranked team defeated a higher-ranked opponent based on the standings entering Week ${d.week}.`);
  if(d.unlucky)lines.push(`<b>Wrong result, right score:</b> ${esc(weeklyTeamName(d.unlucky.roster))} lost despite scoring ${d.unlucky.points.toFixed(2)}, above the league median of ${d.median.toFixed(2)}.`);
  if(d.lucky)lines.push(`<b>Escaped with one:</b> ${esc(weeklyTeamName(d.lucky.roster))} won with ${d.lucky.points.toFixed(2)}, below the league median of ${d.median.toFixed(2)}.`);
  lines.push(`<b>Game of the week:</b> ${esc(weeklyPairText(d.closest))}, decided by just ${d.closest.margin.toFixed(2)}.`);
  copy.innerHTML=lines.join('<br><br>');

  moves.innerHTML=d.movement.map(x=>{
    const cls=x.movement>0?'up':x.movement<0?'down':'';
    const icon=x.movement>0?`▲${x.movement}`:x.movement<0?`▼${Math.abs(x.movement)}`:'—';
    return `<div class="weekly-move-row ${cls}"><span>${icon}</span><b>${esc(x.name)}</b><small>#${x.prev} → #${x.rank}</small></div>`;
  }).join('');

  trends.innerHTML=d.trends.length?d.trends.map(x=>`<span class="weekly-trend ${x.kind}">${esc(x.text)}</span>`).join(''):'<span class="weekly-trend">No multi-week trend is strong enough to flag yet.</span>';
}
