function normalizeSleeperPlayerRecord(id,raw={}){
  const playerId=String(id||raw?.player_id||raw?.id||'');
  const rawPos=String(raw?.position||raw?.fantasy_positions?.[0]||'').toUpperCase();
  const pos=rawPos==='DST'?'DEF':rawPos;
  const team=String(raw?.team||raw?.team_abbr||'').toUpperCase();
  const fullName=String(raw?.full_name||[raw?.first_name,raw?.last_name].filter(Boolean).join(' ')||raw?.name||'').trim();
  return {
    id:playerId,
    full_name:fullName||playerId,
    first_name:String(raw?.first_name||''),
    last_name:String(raw?.last_name||''),
    position:pos,
    team,
    active:raw?.active!==false,
    status:String(raw?.status||''),
    injury_status:String(raw?.injury_status||raw?.injuryStatus||raw?.designation||''),
    injury_body_part:String(raw?.injury_body_part||raw?.injuryBodyPart||''),
    practice_participation:String(raw?.practice_participation||raw?.practiceParticipation||''),
    updatedAt:Date.now()
  };
}
const DISCOVERED_PLAYER_MAX=220;
function pruneDiscoveredPlayers(extraKeepIds=[]){
  const keep=new Set([...trackedUclPlayerIds(),...(extraKeepIds||[])].map(String));
  const entries=Object.entries(discoveredSleeperPlayers||{});
  const kept={};
  for(const [id,row] of entries){if(keep.has(String(id)))kept[id]=row;}
  const remaining=entries
    .filter(([id])=>!keep.has(String(id)))
    .sort((a,b)=>Number(b[1]?.updatedAt||0)-Number(a[1]?.updatedAt||0));
  let keptCount=Object.keys(kept).length;
  for(const [id,row] of remaining){
    if(keptCount>=DISCOVERED_PLAYER_MAX)break;
    kept[id]=row;keptCount++;
  }
  discoveredSleeperPlayers=kept;
  return discoveredSleeperPlayers;
}
function persistDiscoveredPlayers(extraKeepIds=[]){
  pruneDiscoveredPlayers(extraKeepIds);
  return storageSetJson(DISCOVERED_PLAYERS_KEY,discoveredSleeperPlayers);
}
function rememberDiscoveredPlayer(id,raw={},options={}){
  const playerId=String(id||raw?.player_id||raw?.id||'');
  if(!playerId)return null;
  const normalized=normalizeSleeperPlayerRecord(playerId,raw);
  const prior=discoveredSleeperPlayers[playerId]||{};
  discoveredSleeperPlayers[playerId]={...prior,...normalized};
  if(options?.persist!==false)persistDiscoveredPlayers([playerId]);
  return discoveredSleeperPlayers[playerId];
}

function playerMetadataFallback(id){
  const playerId=String(id||'');
  const discovered=discoveredSleeperPlayers[playerId];
  if(discovered)return discovered;
  const pick=lastDraftPicks.find(p=>String(p?.player_id||'')===playerId);
  if(pick){
    const md=pick.metadata||{};
    return normalizeSleeperPlayerRecord(playerId,{
      first_name:md.first_name,last_name:md.last_name,
      full_name:md.full_name||md.name,
      position:md.position,team:md.team
    });
  }
  return null;
}
function trackedUclPlayerIds(){
  const ids=new Set();
  const add=id=>{if(id!=null&&String(id).trim())ids.add(String(id));};
  for(const roster of leagueRosters||[]){
    (roster.players||[]).forEach(add);
    (roster.starters||[]).forEach(add);
    (roster.reserve||[]).forEach(add);
  }
  for(const pick of lastDraftPicks||[])add(pick?.player_id);
  for(const tx of currentTransactions||[]){
    Object.keys(tx?.adds||{}).forEach(add);Object.keys(tx?.drops||{}).forEach(add);
  }
  for(const list of Object.values(seasonTransactionsByWeek||{})){
    for(const tx of list||[]){
      Object.keys(tx?.adds||{}).forEach(add);Object.keys(tx?.drops||{}).forEach(add);
    }
  }
  return [...ids];
}
function playerAuditDifference(id,beforeRaw,afterRaw){
  const before=normalizeSleeperPlayerRecord(id,beforeRaw||{});
  const after=normalizeSleeperPlayerRecord(id,afterRaw||{});
  const changes=[];
  if(before.full_name&&after.full_name&&before.full_name!==after.full_name)changes.push(`name ${before.full_name} → ${after.full_name}`);
  if(before.team!==after.team)changes.push(`team ${before.team||'—'} → ${after.team||'—'}`);
  if(before.position!==after.position)changes.push(`position ${before.position||'—'} → ${after.position||'—'}`);
  const beforeBye=nflTeamByeWeek(before.team),afterBye=nflTeamByeWeek(after.team);
  if(beforeBye!==afterBye)changes.push(`bye ${beforeBye??'—'} → ${afterBye??'—'}`);
  return changes;
}

