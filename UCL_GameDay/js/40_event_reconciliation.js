/* UCL GameDay v0.5.58 — build fragment: 40_event_reconciliation.js
   This file is concatenated in manifest order into the app's single lexical scope.
   It is intentionally not loaded independently in the browser. */
function gvTdCandidateKey(e){
  return `${e?.time||0}|${e?.rosterId||''}|${e?.playerId||''}|${e?.nflTeam||''}|${e?.intervalAnalysis?.stats?.pass_td||e?.intervalAnalysis?.stats?.rec_td||0}`;
}
function gvRememberTdCandidates(events){
  const now=Math.max(Date.now(),...events.map(e=>Number(e?.time||0)));
  for(const e of events){
    const s=e?.intervalAnalysis?.stats||{};
    if((s.pass_td||0)>0||(s.rec_td||0)>0){
      const key=gvTdCandidateKey(e);
      if(!gvRecentTdCandidates.some(x=>x.key===key)){
        gvRecentTdCandidates.push({key,event:{...e},time:Number(e.time||now)});
      }
    }
  }
  for(let i=gvRecentTdCandidates.length-1;i>=0;i--){
    if(now-gvRecentTdCandidates[i].time>GV_TD_CORRELATION_MS)gvRecentTdCandidates.splice(i,1);
  }
}

function gvPassingStatShape(evt){
  const st=evt?.intervalAnalysis?.stats||{};
  return {
    passCmp:Number(st.pass_cmp||0),
    passYd:Number(st.pass_yd||0),
    passTd:Number(st.pass_td||0),
    rec:Number(st.rec||0),
    recYd:Number(st.rec_yd||0),
    recTd:Number(st.rec_td||0)
  };
}
function gvCorrelationAccountingSummary(qb,rec){
  const q=gvPassingStatShape(qb),r=gvPassingStatShape(rec);
  const compat=gvPassReceiverCompatibility(qb,rec);
  return {
    ok:compat.ok,
    sameNflTeam:String(qb?.nflTeam||'')===String(rec?.nflTeam||''),
    td:`${q.passTd}/${r.recTd}`,
    completions:`${q.passCmp}/${r.rec}`,
    yards:`${q.passYd}/${r.recYd}`,
    lagMs:compat.dt,
    reasons:compat.reasons||[]
  };
}

function gvPassReceiverCompatibility(qb,rec){
  if(!qb||!rec)return {ok:false,score:-Infinity,reasons:['missing event']};
  if(String(qb.nflTeam||'')!==String(rec.nflTeam||''))return {ok:false,score:-Infinity,reasons:['different NFL teams']};

  const q=gvPassingStatShape(qb),r=gvPassingStatShape(rec),reasons=[];
  const dt=Math.abs(Number(qb.time||0)-Number(rec.time||0));
  let score=100;

  const tdEvidence=(q.passTd>0||r.recTd>0);
  const tdMatch=q.passTd>0&&r.recTd>0&&q.passTd===r.recTd;
  if(tdEvidence){
    if(tdMatch)score+=20;
    else {score-=60;reasons.push(`TD mismatch ${q.passTd} vs ${r.recTd}`);}
  }

  const countEvidence=(q.passCmp>0||r.rec>0);
  const countMatch=q.passCmp>0&&r.rec>0&&q.passCmp===r.rec;
  if(countEvidence){
    if(countMatch)score+=18;
    else if(q.passCmp>0&&r.rec>0){
      score-=40;reasons.push(`completion/reception mismatch ${q.passCmp} vs ${r.rec}`);
    }else{
      score-=8;reasons.push('completion/reception evidence incomplete');
    }
  }

  const yardEvidence=(q.passYd!==0||r.recYd!==0);
  const ydDiff=Math.abs(q.passYd-r.recYd);
  if(yardEvidence){
    if(q.passYd!==0&&r.recYd!==0&&ydDiff<=1)score+=24;
    else if(q.passYd!==0&&r.recYd!==0){
      score-=45;reasons.push(`yardage mismatch ${q.passYd} vs ${r.recYd}`);
    }else{
      score-=8;reasons.push('passing/receiving yardage evidence incomplete');
    }
  }

  score-=Math.min(35,dt/1000);
  if(dt>GV_PENDING_TD_MAX_MS)reasons.push(`timing gap ${Math.round(dt/1000)}s exceeds window`);

  const hardTdMismatch=tdEvidence&&!tdMatch;
  const hardCountMismatch=q.passCmp>0&&r.rec>0&&!countMatch;
  const hardYardMismatch=q.passYd!==0&&r.recYd!==0&&ydDiff>1;
  const ok=dt<=GV_PENDING_TD_MAX_MS&&!hardTdMismatch&&!hardCountMismatch&&!hardYardMismatch;

  return {ok,score,reasons,dt,ydDiff};
}

function gvTrickPlayConfidence(passer,receiver,compat=null){
  const passerPos=String(passer?.pos||'QB').toUpperCase();
  const receiverPos=String(receiver?.pos||'WR').toUpperCase();
  const trick=passerPos!=='QB'||receiverPos==='QB';
  if(!trick)return {level:'standard',label:'STANDARD PASS',score:null,reasons:[]};
  const c=compat||gvPassReceiverCompatibility(passer,receiver);
  const q=gvPassingStatShape(passer),r=gvPassingStatShape(receiver);
  const exactCounts=q.passCmp>0&&r.rec>0&&q.passCmp===r.rec;
  const exactYards=(q.passYd!==0||r.recYd!==0)&&q.passYd!==0&&r.recYd!==0&&Math.abs(q.passYd-r.recYd)<=1;
  const tdPresent=q.passTd>0||r.recTd>0;
  const exactTd=!tdPresent||(q.passTd>0&&r.recTd>0&&q.passTd===r.recTd);
  const samePoll=Math.abs(Number(passer?.time||0)-Number(receiver?.time||0))<=1500;
  if(c.ok&&exactCounts&&exactYards&&exactTd&&samePoll)
    return {level:'confirmed',label:'TRICK PLAY — CONFIRMED BY DELTAS',score:c.score,reasons:c.reasons||[]};
  if(c.ok&&exactCounts&&exactYards&&exactTd)
    return {level:'strong',label:'TRICK PLAY — STRONG DELTA MATCH',score:c.score,reasons:c.reasons||[]};
  if(c.ok)
    return {level:'possible',label:'POSSIBLE TRICK PLAY',score:c.score,reasons:c.reasons||[]};
  return {level:'ambiguous',label:'TRICK PLAY — AMBIGUOUS',score:c.score,reasons:c.reasons||[]};
}

function gvCorrelatedFantasyImpacts(qb,rec){
  const impacts=[];
  const add=(evt,role)=>{
    if(!evt)return;
    const delta=Number(evt.delta||0);
    impacts.push({
      rosterId:String(evt.rosterId||''),
      playerId:String(evt.playerId||''),
      name:evt.name||'Player',
      pos:evt.pos||'',
      role,
      delta
    });
  };
  add(qb,'passer');add(rec,'receiver');
  return impacts;
}

function gvTdCompatible(qb,rec){
  return gvPassReceiverCompatibility(qb,rec).ok;
}

function gvTurnoverCandidateKey(e){
  const s=e?.intervalAnalysis?.stats||{};
  return `${e?.time||0}|${e?.rosterId||''}|${e?.playerId||''}|${e?.nflTeam||''}|${s.pass_int||0}|${s.fum_lost||s.fum_lost_total||0}|${s.int||0}|${s.fum_rec||0}|${s.def_td||0}`;
}
function gvIsOffensiveTurnoverEvent(e){
  const s=e?.intervalAnalysis?.stats||{};
  return (s.pass_int||0)>0||(s.fum_lost||s.fum_lost_total||0)>0;
}
function gvIsDefensiveTurnoverEvent(e){
  const s=e?.intervalAnalysis?.stats||{};
  return ['DEF','DST'].includes(String(e?.pos||'').toUpperCase())&&((s.int||0)>0||(s.fum_rec||0)>0||(s.def_td||0)>0);
}
function gvRememberTurnoverCandidates(events,nowOverride=null){
  const eventTimes=(events||[]).map(e=>Number(e?.time||0)).filter(Number.isFinite);
  const now=Number.isFinite(Number(nowOverride))
    ?Number(nowOverride)
    :(eventTimes.length?Math.max(Date.now(),...eventTimes):Date.now());
  for(const e of events||[]){
    if(!gvIsOffensiveTurnoverEvent(e)&&!gvIsDefensiveTurnoverEvent(e))continue;
    const key=gvTurnoverCandidateKey(e);
    if(!gvRecentTurnoverCandidates.some(x=>x.key===key)){
      gvRecentTurnoverCandidates.push({key,event:{...e},time:Number(e.time||now)});
    }
  }
  for(let i=gvRecentTurnoverCandidates.length-1;i>=0;i--){
    if(now-gvRecentTurnoverCandidates[i].time>GV_TURNOVER_CORRELATION_MS)gvRecentTurnoverCandidates.splice(i,1);
  }
}

function gvNormalizeNflTeamCode(team){
  return String(team||'').trim().toUpperCase();
}
function gvOpponentForEvent(evt){
  const direct=gvNormalizeNflTeamCode(
    evt?.opponentNflTeam||evt?.opponent||evt?.opp||
    evt?.intervalAnalysis?.opponent||evt?.intervalAnalysis?.stats?.opponent||
    evt?.intervalAnalysis?.stats?.opp
  );
  if(direct)return direct;
  const pid=String(evt?.playerId||'');
  const playerOpp=gvNormalizeNflTeamCode(gameViewOpponentByPlayer?.[pid]||'');
  if(playerOpp)return playerOpp;
  return gvOpponentFromWeeklyMap(evt?.nflTeam);
}
function gvEventsAreProvenNflOpponents(a,b){
  const at=gvNormalizeNflTeamCode(a?.nflTeam),bt=gvNormalizeNflTeamCode(b?.nflTeam);
  if(!at||!bt||at===bt)return false;
  const ao=gvOpponentForEvent(a),bo=gvOpponentForEvent(b);
  if(ao&&ao===bt)return true;
  if(bo&&bo===at)return true;
  return false;
}

function gvTurnoverCompatible(offense,defense){
  if(!offense||!defense)return false;
  if(!gvIsOffensiveTurnoverEvent(offense)||!gvIsDefensiveTurnoverEvent(defense))return false;
  if(!gvEventsAreProvenNflOpponents(offense,defense))return false;
  const os=offense.intervalAnalysis?.stats||{},ds=defense.intervalAnalysis?.stats||{};
  const offInt=(os.pass_int||0)>0,offFum=(os.fum_lost||os.fum_lost_total||0)>0;
  const defInt=(ds.int||0)>0,defFum=(ds.fum_rec||0)>0;
  if(offInt&&!defInt)return false;
  if(offFum&&!defFum)return false;
  return Math.abs(Number(offense.time||0)-Number(defense.time||0))<=GV_TURNOVER_CORRELATION_MS;
}



function gvEventRelevantRosterId(evt){
  const selected=String($('#teamSelect')?.value||'');
  if(Array.isArray(evt?.fantasyImpacts)&&evt.fantasyImpacts.length){
    if(selected&&evt.fantasyImpacts.some(x=>String(x.rosterId||'')===selected))return selected;
    const rid=String(evt?.rosterId||'');
    if(rid&&evt.fantasyImpacts.some(x=>String(x.rosterId||'')===rid))return rid;
    return String(evt.fantasyImpacts[0]?.rosterId||rid);
  }
  return String(evt?.rosterId||selected);
}
function gvEventDisplayDelta(evt,rosterId=''){
  const rid=String(rosterId||gvEventRelevantRosterId(evt)||'');
  return gvEventFantasyImpactForRoster(evt,rid);
}
function gvEventImpactBreakdown(evt){
  if(!Array.isArray(evt?.fantasyImpacts)||evt.fantasyImpacts.length<2)return '';
  return evt.fantasyImpacts.map(x=>{
    const d=Number(x.delta||0);
    return `${x.name||x.role||'Player'} ${d>=0?'+':''}${d.toFixed(2)}`;
  }).join(' • ');
}
function gvEventHasMultipleFantasyImpacts(evt){
  return Array.isArray(evt?.fantasyImpacts)&&evt.fantasyImpacts.length>1;
}
function gvEventHasCrossRosterImpacts(evt){
  return gvEventHasMultipleFantasyImpacts(evt)&&
    new Set(evt.fantasyImpacts.map(x=>String(x.rosterId||''))).size>1;
}
function gvFantasyImpactLabel(x){
  const d=Number(x?.delta||0);
  const role=String(x?.role||'').toLowerCase();
  const roleLabel=role==='offense'?'OFF':role==='defense'?'DEF':String(x?.pos||'').toUpperCase();
  return `${x?.name||roleLabel||'Player'}${roleLabel?` (${roleLabel})`:''} ${d>=0?'+':''}${d.toFixed(2)}`;
}
function gvEventImpactBreakdownHtml(evt){
  if(!gvEventHasMultipleFantasyImpacts(evt))return '';
  return evt.fantasyImpacts.map(x=>`<span>${esc(gvFantasyImpactLabel(x))}</span>`).join('');
}
function gvEventPrimaryImpactText(evt){
  const d=Number(gvEventDisplayDelta(evt)||0);
  return `${d>=0?'+':''}${d.toFixed(2)}`;
}

function gvEventFantasyImpactForRoster(evt,rosterId){
  if(!Array.isArray(evt?.fantasyImpacts)||!evt.fantasyImpacts.length)return Number(evt?.delta||0);
  const rid=String(rosterId||'');
  return Number(evt.fantasyImpacts
    .filter(x=>String(x.rosterId||'')===rid)
    .reduce((sum,x)=>sum+Number(x.delta||0),0)
    .toFixed(2));
}

function gvTurnoverFantasyImpacts(offense,defense){
  const impacts=[];
  if(offense){
    impacts.push({
      rosterId:String(offense.rosterId||''),
      playerId:String(offense.playerId||''),
      name:offense.name||'Offensive player',
      pos:offense.pos||'',
      role:'offense',
      delta:Number(offense.delta||0)
    });
  }
  if(defense){
    impacts.push({
      rosterId:String(defense.rosterId||''),
      playerId:String(defense.playerId||''),
      name:defense.name||defense.nflTeam||'Defense',
      pos:defense.pos||'DEF',
      role:'defense',
      delta:Number(defense.delta||0)
    });
  }
  return impacts;
}
function gvFantasyImpactDisplayDelta(impacts,anchorRosterId){
  const rid=String(anchorRosterId||'');
  const own=(impacts||[]).filter(x=>String(x.rosterId||'')===rid);
  return Number(own.reduce((sum,x)=>sum+Number(x.delta||0),0).toFixed(2));
}

function gvCorrelateAdjacentTurnovers(events,nowOverride=null){
  gvRememberTurnoverCandidates(events,nowOverride);
  const out=[...events];
  const candidates=gvRecentTurnoverCandidates.map(x=>x.event);
  const offenses=candidates.filter(e=>gvIsOffensiveTurnoverEvent(e)&&!gvConsumedTurnoverKeys.has(gvTurnoverCandidateKey(e)));
  const defenses=candidates.filter(e=>gvIsDefensiveTurnoverEvent(e)&&!gvConsumedTurnoverKeys.has(gvTurnoverCandidateKey(e)));

  for(const offense of offenses){
    let best=null,bestDt=Infinity;
    for(const defense of defenses){
      if(!gvTurnoverCompatible(offense,defense))continue;
      const dt=Math.abs(Number(offense.time||0)-Number(defense.time||0));
      if(dt<bestDt){best=defense;bestDt=dt}
    }
    if(!best)continue;

    const oKey=gvTurnoverCandidateKey(offense),dKey=gvTurnoverCandidateKey(best);
    gvConsumedTurnoverKeys.add(oKey);gvConsumedTurnoverKeys.add(dKey);

    const os=offense.intervalAnalysis?.stats||{},ds=best.intervalAnalysis?.stats||{};
    const isInt=(os.pass_int||0)>0&&(ds.int||0)>0;
    const defTd=(ds.def_td||0)>0;
    const stripSack=!isInt&&Number(ds.sack||0)>0&&((os.fum_lost||os.fum_lost_total||0)>0||(ds.fum_rec||0)>0);
    const impacts=gvTurnoverFantasyImpacts(offense,best);
    const sameFantasyRoster=String(offense.rosterId||'')===String(best.rosterId||'');
    const anchorRosterId=String(best.rosterId||offense.rosterId||'');

    const merged=gvNormalizeEventSource({
      ...best,
      id:`turncorr-${oKey}-${dKey}`,
      time:Math.max(Number(offense.time||0),Number(best.time||0)),
      type:'play',
      intervalClass:'SINGLE_PLAY',
      playType:isInt?(defTd?'def_int_td':'def_int'):(defTd?'def_fum_td':'def_fumble'),
      detail:isInt
        ?`${best.name||best.nflTeam} interception${defTd?' returned for a touchdown':''}`
        :stripSack?`Strip sack • ${best.name||best.nflTeam} fumble recovery${defTd?' returned for a touchdown':''}`:`${best.name||best.nflTeam} fumble recovery${defTd?' returned for a touchdown':''}`,
      correlated:true,
      stripSack,
      revisedExistingEvent:bestDt>0,
      turnoverCorrelatedAcrossPolls:bestDt>0,
      correlationLagMs:bestDt,
      turnoverKind:isInt?'interception':'fumble',
      offensivePlayerId:offense.playerId,
      offensivePlayerName:offense.name,
      defensivePlayerId:best.playerId,
      defensivePlayerName:best.name,
      fantasyImpacts:impacts,
      delta:sameFantasyRoster
        ? Number(impacts.reduce((sum,x)=>sum+Number(x.delta||0),0).toFixed(2))
        : gvFantasyImpactDisplayDelta(impacts,anchorRosterId),
      played:false
    },gvResolveSource(offense,best));

    for(let i=out.length-1;i>=0;i--){
      if(out[i]?.id===offense.id||out[i]?.id===best.id)out.splice(i,1);
    }
    out.push(merged);
  }

  if(gvConsumedTurnoverKeys.size>400){
    const keep=new Set(gvRecentTurnoverCandidates.map(x=>x.key));
    for(const k of [...gvConsumedTurnoverKeys])if(!keep.has(k))gvConsumedTurnoverKeys.delete(k);
  }
  return out.sort((a,b)=>(a.time||0)-(b.time||0));
}


const GV_PENDING_TD_MAX_MS=35000;
const gvLivePendingTdState={pending:[]};
const gvTestingPendingTdState={pending:[]};

function gvRosterHasTandemPair(rosterId,nflTeamHint=''){
  const roster=rosterFor(rosterId);
  if(!roster)return false;
  const players=(roster.players||[]).map(id=>playerInfo(id)).filter(Boolean);
  const qbs=players.filter(p=>String(p.pos||p.position||'').toUpperCase()==='QB');
  const elig=players.filter(p=>['WR','RB','TE'].includes(String(p.pos||p.position||'').toUpperCase()));
  if(!qbs.length||!elig.length)return false;
  const hint=String(nflTeamHint||'').toUpperCase();
  return qbs.some(q=>{
    const qt=String(q.team||'').toUpperCase();
    if(!qt)return false;
    if(hint&&qt!==hint)return false;
    return elig.some(r=>String(r.team||'').toUpperCase()===qt);
  });
}

function gvTdCouldBeTandemHalf(evt){
  const stats=evt?.intervalAnalysis?.stats||{};
  const isPassTd=Number(stats.pass_td||0)>0;
  const isRecTd=Number(stats.rec_td||0)>0;
  if(!isPassTd&&!isRecTd)return false;
  return gvRosterHasTandemPair(evt.rosterId,evt.nflTeam);
}

function gvPendingTdKey(evt){
  const stats=evt?.intervalAnalysis?.stats||{};
  const kind=Number(stats.pass_td||0)>0?'pass':Number(stats.rec_td||0)>0?'rec':'td';
  return `${evt.rosterId}|${evt.playerId}|${kind}|${evt.nflTeam||''}|${evt.time||0}`;
}

function gvReleaseExpiredPendingTds(now=Date.now(),state=gvLivePendingTdState){
  const released=[];
  const pending=state?.pending||[];
  for(let i=pending.length-1;i>=0;i--){
    const p=pending[i];
    if(now-Number(p.heldAt||p.time||now)>=GV_PENDING_TD_MAX_MS){
      const event={...p.event,pendingTdStatus:'EXPIRED / RELEASED',pendingTdResolvedAt:now};
      released.unshift(event);
      pending.splice(i,1);
    }
  }
  return released;
}

function gvTakeMatchingPendingTd(evt,state=gvLivePendingTdState){
  const stats=evt?.intervalAnalysis?.stats||{};
  const evtIsRec=Number(stats.rec_td||0)>0;
  const evtIsPass=Number(stats.pass_td||0)>0;
  if(!evtIsRec&&!evtIsPass)return null;
  const now=Number(evt.time||Date.now());
  const pending=state?.pending||[];
  const ranked=[];

  for(let i=pending.length-1;i>=0;i--){
    const p=pending[i],pe=p.event,ps=pe?.intervalAnalysis?.stats||{};
    if(now-Number(pe.time||p.heldAt||now)>GV_PENDING_TD_MAX_MS)continue;
    const complementary=(evtIsRec&&Number(ps.pass_td||0)>0)||(evtIsPass&&Number(ps.rec_td||0)>0);
    if(!complementary)continue;
    const qb=evtIsPass?evt:pe;
    const rec=evtIsRec?evt:pe;
    const compat=gvPassReceiverCompatibility(qb,rec);
    if(!compat.ok)continue;
    ranked.push({i,p,compat});
  }

  ranked.sort((a,b)=>b.compat.score-a.compat.score);
  if(!ranked.length)return null;
  if(ranked.length>1&&Math.abs(ranked[0].compat.score-ranked[1].compat.score)<5)return null;

  const hit=ranked[0];
  pending.splice(hit.i,1);
  return {...hit.p.event,pendingTdStatus:'MATCHED',pendingTdResolvedAt:now,pendingTdMatchScore:hit.compat.score};
}

function gvHoldOrReleaseTandemTdEvents(events,state=gvLivePendingTdState,nowOverride=null){
  const eventTimes=(events||[]).map(e=>Number(e?.time||0)).filter(Number.isFinite);
  const now=Number.isFinite(Number(nowOverride))?Number(nowOverride):(eventTimes.length?Math.max(...eventTimes):Date.now());
  const output=gvReleaseExpiredPendingTds(now,state);
  const pending=state?.pending||[];

  for(const evt of events||[]){
    if(!gvTdCouldBeTandemHalf(evt)){
      output.push(evt);
      continue;
    }
    const mate=gvTakeMatchingPendingTd(evt,state);
    if(mate){
      output.push(
        mate,
        {...evt,pendingTdStatus:'MATCHED',pendingTdResolvedAt:now}
      );
      continue;
    }
    const key=gvPendingTdKey(evt);
    if(!pending.some(p=>p.key===key)){
      pending.push({
        key,
        event:{...evt,pendingTdStatus:'HELD',pendingTdHeldAt:now},
        heldAt:Number(evt.time||now)
      });
    }
  }
  return output;
}

function gvCorrelateAdjacentTd(events){
  gvRememberTdCandidates(events);
  const out=[...events],used=new Set();
  const candidates=gvRecentTdCandidates.map(x=>x.event);
  const qbs=candidates.filter(e=>['QB','RB','WR','TE','K'].includes(String(e.pos||'').toUpperCase())&&(e.intervalAnalysis?.stats?.pass_td||0)>0&&!gvConsumedTdKeys.has(gvTdCandidateKey(e)));
  const recs=candidates.filter(e=>['QB','RB','WR','TE'].includes(String(e.pos||'').toUpperCase())&&(e.intervalAnalysis?.stats?.rec_td||0)>0&&!gvConsumedTdKeys.has(gvTdCandidateKey(e)));

  for(const qb of qbs){
    const ranked=[];
    for(const rec of recs){
      if(String(rec.playerId||'')===String(qb.playerId||''))continue;
      const c=gvPassReceiverCompatibility(qb,rec);
      if(!c.ok)continue;
      ranked.push({rec,compat:c});
    }
    ranked.sort((a,b)=>b.compat.score-a.compat.score);
    if(!ranked.length)continue;

    // Ambiguous receiver choice: do not guess if top two are effectively tied.
    if(ranked.length>1&&Math.abs(ranked[0].compat.score-ranked[1].compat.score)<5)continue;

    const best=ranked[0].rec,bestCompat=ranked[0].compat;
    const qKey=gvTdCandidateKey(qb),rKey=gvTdCandidateKey(best);
    gvConsumedTdKeys.add(qKey);gvConsumedTdKeys.add(rKey);
    used.add(qb.id);used.add(best.id);

    const base=gvBuildCorrelatedPassEvent(qb,{event:best,receptions:1,yards:Math.round(best.intervalAnalysis?.stats?.rec_yd||0),tds:1},0);
    if(!base)continue;
    const impacts=gvCorrelatedFantasyImpacts(qb,best);
    const sameFantasyRoster=String(qb.rosterId||'')===String(best.rosterId||'');
    const merged=gvNormalizeEventSource({
      ...base,
      id:`tdcorr-${qKey}-${rKey}`,
      time:Math.max(Number(qb.time||0),Number(best.time||0)),
      type:'play',
      intervalClass:'SINGLE_PLAY',
      detail:best.detail||qb.detail||'Touchdown pass',
      correlated:true,
      tdCorrelatedAcrossPolls:bestCompat.dt>0,
      revisedExistingEvent:bestCompat.dt>0,
      correlationLagMs:bestCompat.dt,
      correlationScore:bestCompat.score,
      correlationReasons:bestCompat.reasons,
      fantasyImpacts:impacts,
      delta:sameFantasyRoster
        ? Number(impacts.reduce((sum,x)=>sum+Number(x.delta||0),0).toFixed(2))
        : Number((best.delta||0).toFixed?.(2) ?? Number(best.delta||0)),
      played:false
    },gvResolveSource(qb,best));

    for(let i=out.length-1;i>=0;i--){
      if(out[i]?.id===qb.id||out[i]?.id===best.id)out.splice(i,1);
    }
    out.push(merged);
  }

  if(gvConsumedTdKeys.size>400){
    const keep=new Set(gvRecentTdCandidates.map(x=>x.key));
    for(const k of [...gvConsumedTdKeys])if(!keep.has(k))gvConsumedTdKeys.delete(k);
  }
  return out.sort((a,b)=>(a.time||0)-(b.time||0));
}

function gvCorrelateIntervalPassing(events){
  const remaining=new Set(events),combined=[];
  const {qbs,targets}=gvPassingCandidates(events);

  for(const qb of qbs){
    const groups=gvSameTeamReceiverGroups(qb,targets.filter(t=>remaining.has(t)));
    const lateralTails=events.filter(e=>remaining.has(e)&&gvSameNflTeam(qb,e)&&['QB','RB','WR','TE'].includes(String(e.pos||'').toUpperCase())&&e.intervalAnalysis?.family==='lateral_receive');
    if(!groups.length)continue;

    const q=qb.intervalAnalysis?.stats||{};
    // Detect the statistically distinctive completed-pass lateral: one player
    // owns the reception, another same-team player gains receiving yards with
    // no reception, and together their receiving yards equal the passer's yards.
    if(Math.max(0,Math.round(q.pass_cmp||0))===1&&groups.length===1&&groups[0].receptions===1&&lateralTails.length){
      const primary=groups[0].event,primaryY=Math.round(groups[0].yards||0);
      const ranked=lateralTails.map(t=>({t,tailY:Math.round(t.intervalAnalysis?.stats?.rec_yd||0),td:Math.max(0,Math.round(t.intervalAnalysis?.stats?.rec_td||0))}))
        .filter(x=>Math.abs(Math.round(q.pass_yd||0)-(primaryY+x.tailY))<=1)
        .sort((a,b)=>Math.abs(Number(a.t.time||0)-Number(qb.time||0))-Math.abs(Number(b.t.time||0)-Number(qb.time||0)));
      if(ranked.length===1){
        const tail=ranked[0].t,base=gvBuildCorrelatedPassEvent(qb,groups[0],0);
        if(base){
          const impacts=[...gvCorrelatedFantasyImpacts(qb,primary),{rosterId:String(tail.rosterId||''),playerId:String(tail.playerId||''),name:tail.name||'Lateral runner',pos:tail.pos||'',role:'lateral-recipient',delta:Number(tail.delta||0)}];
          const rosterIds=new Set(impacts.map(x=>x.rosterId));
          combined.push({...base,id:`lateral-${qb.id}-${primary.id}-${tail.id}`,type:'play',intervalClass:'SINGLE_PLAY',lateralChain:true,
            primaryReceiverPlayerId:primary.playerId,primaryReceiverName:primary.name,primaryReceiverPos:primary.pos,
            lateralRecipientPlayerId:tail.playerId,lateralRecipientName:tail.name,lateralRecipientPos:String(tail.pos||'WR').toUpperCase(),
            lateralYards:ranked[0].tailY,lateralTouchdown:ranked[0].td>0,detail:`Completed pass → lateral to ${tail.name||'teammate'}${ranked[0].td?' for a touchdown':''}`,
            fantasyImpacts:impacts,delta:rosterIds.size===1?Number(impacts.reduce((sum,x)=>sum+Number(x.delta||0),0).toFixed(2)):Number(primary.delta||0),played:false});
          remaining.delete(qb);remaining.delete(primary);remaining.delete(tail);
          continue;
        }
      }
    }
    const qbCmp=Math.max(0,Math.round(q.pass_cmp||0));
    const qbYds=Math.round(q.pass_yd||0);
    const qbTd=Math.max(0,Math.round(q.pass_td||0));

    const recCount=groups.reduce((sum,g)=>sum+g.receptions,0);
    const recYds=groups.reduce((sum,g)=>sum+g.yards,0);
    const recTd=groups.reduce((sum,g)=>sum+g.tds,0);
    const pass2=Math.max(0,Math.round(q.pass_2pt||0));
    const twoPointGroups=groups.filter(g=>Number(g.event?.intervalAnalysis?.stats?.rec_2pt||0)>0);
    if(pass2===1&&twoPointGroups.length===1){
      const rec=twoPointGroups[0].event,merged=gvBuildCorrelatedPassEvent(qb,twoPointGroups[0],0);
      if(merged){
        const impacts=gvCorrelatedFantasyImpacts(qb,rec),sameFantasyRoster=String(qb.rosterId||'')===String(rec.rosterId||'');
        combined.push({...merged,type:'play',intervalClass:'SINGLE_PLAY',twoPointConversion:true,detail:'Successful two-point pass',fantasyImpacts:impacts,
          delta:sameFantasyRoster?Number(impacts.reduce((sum,x)=>sum+Number(x.delta||0),0).toFixed(2)):Number(rec.delta||0),played:false});
        remaining.delete(qb);remaining.delete(rec);continue;
      }
    }

    // Same-poll correlation is strict: the receiving group must fully account for
    // the quarterback's completion, yardage, and touchdown deltas.
    if(qbCmp<=0||recCount<=0)continue;
    if(qbCmp!==recCount)continue;
    if(Math.abs(qbYds-recYds)>1)continue;
    if(qbTd!==recTd)continue;

    // Single clean completion: apply the same compatibility model used across polls.
    if(qbCmp===1&&groups.length===1&&groups[0].receptions===1){
      const rec=groups[0].event;
      const compat=gvPassReceiverCompatibility(qb,rec);
      if(!compat.ok)continue;

      const impacts=gvCorrelatedFantasyImpacts(qb,rec);
      const sameFantasyRoster=String(qb.rosterId||'')===String(rec.rosterId||'');
      const merged=gvBuildCorrelatedPassEvent(qb,groups[0],0);
      if(!merged)continue;

      combined.push({
        ...merged,
        type:'play',
        intervalClass:'SINGLE_PLAY',
        detail:rec.detail||qb.detail,
        correlationScore:compat.score,
        correlationReasons:compat.reasons,
        fantasyImpacts:impacts,
        delta:sameFantasyRoster
          ? Number(impacts.reduce((sum,x)=>sum+Number(x.delta||0),0).toFixed(2))
          : Number(rec.delta||0),
        played:false
      });

      remaining.delete(qb);
      remaining.delete(rec);
      continue;
    }

    // Multiple completions: correlate only the group as an aggregate. We do not
    // invent a per-play receiver assignment that Sleeper has not proven.
    const allImpacts=[{
      rosterId:String(qb.rosterId||''),
      playerId:String(qb.playerId||''),
      name:qb.name||'Quarterback',
      pos:qb.pos||'QB',
      role:'passer',
      delta:Number(qb.delta||0)
    }];

    for(const g of groups){
      allImpacts.push({
        rosterId:String(g.event.rosterId||''),
        playerId:String(g.event.playerId||''),
        name:g.event.name||'Receiver',
        pos:g.event.pos||'',
        role:'receiver',
        delta:Number(g.event.delta||0)
      });
    }

    const rosterIds=new Set(allImpacts.map(x=>x.rosterId));
    const aggregateDelta=rosterIds.size===1
      ? Number(allImpacts.reduce((sum,x)=>sum+Number(x.delta||0),0).toFixed(2))
      : 0;

    // Preserve one aggregate correlated burst for visualization/feed, but keep
    // fantasy impacts separated by roster.
    const anchorGroup=groups[0];
    combined.push({
      ...gvBuildCorrelatedPassEvent(qb,anchorGroup,0),
      id:`corr-burst-${qb.id}-${groups.map(g=>g.event.id).join('-')}`,
      type:'burst',
      intervalClass:'MULTI_PLAY_BURST',
      detail:`${qbCmp} completions for ${qbYds} passing yards${qbTd?` and ${qbTd} passing TD${qbTd===1?'':'s'}`:''}`,
      correlated:true,
      correlatedReceiverCount:groups.length,
      fantasyImpacts:allImpacts,
      delta:aggregateDelta,
      played:true
    });

    remaining.delete(qb);
    groups.forEach(g=>remaining.delete(g.event));
  }

  return [...remaining,...combined].sort((a,b)=>(a.time||0)-(b.time||0));
}


function gvStatDeltaSignature(evt){
  const stats=evt?.intervalAnalysis?.stats||{};
  const pairs=Object.entries(stats)
    .filter(([,v])=>Math.abs(Number(v||0))>0)
    .sort(([a],[b])=>a.localeCompare(b))
    .map(([k,v])=>`${k}:${Number(v)}`);
  return pairs.join('|');
}
function gvEventRevisionKey(evt){
  return [
    String(evt?.rosterId||''),
    String(evt?.playerId||''),
    String(evt?.nflTeam||''),
    String(evt?.intervalAnalysis?.family||'')
  ].join('~');
}
function gvEventsLookLikeSameRevision(a,b){
  if(!a||!b)return false;
  if(gvEventRevisionKey(a)!==gvEventRevisionKey(b))return false;
  const dt=Math.abs(Number(a.time||0)-Number(b.time||0));
  if(dt>45000)return false;
  // Identical stat signatures are duplicates. A changed signature is considered a revision
  // only when at least one side carries affirmative correction/revision evidence; this avoids
  // collapsing two legitimate plays by the same player inside a 45-second polling window.
  const sameStats=gvStatDeltaSignature(a)===gvStatDeltaSignature(b);
  return sameStats||gvIsLikelyStatCorrection(a)||gvIsLikelyStatCorrection(b)||!!a.revisedExistingEvent||!!b.revisedExistingEvent;
}
const GV_MONOTONIC_STAT_KEYS=new Set([
  'rush_att','rush_td','rec','rec_td','pass_att','pass_cmp','pass_td','pass_int',
  'fum_lost','fum_lost_total','fgm','fgm_0_19','fgm_20_29','fgm_30_39','fgm_40_49','fgm_50p',
  'xpm','int','fum_rec','sack','def_td'
]);
const GV_YARDAGE_STAT_KEYS=new Set(['rush_yd','rec_yd','pass_yd','fum_rec_yd','def_int_ret_yd']);
function gvStatScoringWeight(key){
  const w=Number(leagueInfo?.scoring_settings?.[key]);
  return Number.isFinite(w)?w:null;
}
function gvNegativeFootballEvidence(evt){
  const stats=evt?.intervalAnalysis?.stats||{};
  const positive=k=>Number(stats?.[k]||0)>0;
  const penaltyCounter=positive('pass_int')||positive('fum_lost')||positive('fum_lost_total')||
    positive('fgmiss')||positive('fg_miss')||positive('fgmissed')||positive('xpmiss')||positive('xp_miss');
  if(penaltyCounter)return {legitimate:true,reason:'penalizing football stat increased'};

  // League scoring can assign a negative value to an increasing stat. Treat that as a
  // football scoring event rather than a correction (for example INTs or missed kicks).
  for(const [key,value] of Object.entries(stats)){
    const weight=gvStatScoringWeight(key);
    if(Number(value)>0&&weight!==null&&weight<0)return {legitimate:true,reason:`${key} increased under negative league scoring`};
  }

  // Negative yardage is a normal football result when a new play-count stat advanced in
  // the same Sleeper interval. This covers tackles for loss, negative catches, etc.
  const negativeYards=Object.entries(stats).some(([k,v])=>GV_YARDAGE_STAT_KEYS.has(k)&&Number(v)<0);
  const actionAdvanced=positive('rush_att')||positive('rec')||positive('pass_att')||positive('pass_cmp');
  if(negativeYards&&actionAdvanced)return {legitimate:true,reason:'negative yardage accompanied by a new football action'};
  return {legitimate:false,reason:''};
}
function gvCorrectionEvidence(evt){
  const stats=evt?.intervalAnalysis?.stats||{};
  const delta=Number(evt?.delta||0);
  const negativeFootball=gvNegativeFootballEvidence(evt);
  if(negativeFootball.legitimate)return {correction:false,negativePlay:delta<0,reason:negativeFootball.reason};

  // Counters such as receptions, attempts, TDs, INTs and made kicks should not move
  // backwards during a game. A decrease is strong evidence Sleeper revised its stat line.
  const reversedCounter=Object.entries(stats).find(([k,v])=>GV_MONOTONIC_STAT_KEYS.has(k)&&Number(v)<0);
  if(reversedCounter)return {correction:true,negativePlay:false,reason:`${reversedCounter[0]} decreased`};

  // Cumulative yardage can legitimately decline on a negative play, but when yardage moves
  // backward without an accompanying new attempt/reception/completion it behaves like a
  // retroactive yardage adjustment rather than a newly observed football play.
  const reversedYard=Object.entries(stats).find(([k,v])=>GV_YARDAGE_STAT_KEYS.has(k)&&Number(v)<0);
  if(reversedYard)return {correction:true,negativePlay:false,reason:`${reversedYard[0]} decreased without a new action`};

  // A negative fantasy delta alone is NOT correction evidence. Preserve it as a real score
  // change unless Sleeper's raw-stat movement provides affirmative revision evidence.
  return {correction:false,negativePlay:delta<0,reason:delta<0?'negative fantasy scoring event':'normal scoring event'};
}
function gvIsLikelyStatCorrection(evt){return gvCorrectionEvidence(evt).correction}
function gvIsLegitimateNegativeEvent(evt){const e=gvCorrectionEvidence(evt);return !e.correction&&e.negativePlay}
function gvReconciliationQualifier(evt){
  if(evt?.overturnedLabel)return evt.overturnedLabel;
  if(gvIsLikelyStatCorrection(evt))return 'STAT CORRECTION';
  if(evt?.revisedExistingEvent)return 'PREVIOUS PLAY UPDATED';
  if(gvIsLegitimateNegativeEvent(evt))return 'NEGATIVE SCORING EVENT';
  return '';
}
function gvSuppressOrReviseDuplicateEvent(feed,evt){
  if(!Array.isArray(feed)||!evt)return {feed,duplicate:false,revised:false};
  let revised=false,duplicate=false;
  const next=[];
  for(const old of feed){
    if(old?.id===evt.id){duplicate=true;continue;}
    if(gvEventsLookLikeSameRevision(old,evt)){
      const oldDelta=Number(old.delta||0),newDelta=Number(evt.delta||0);
      if(Math.abs(oldDelta-newDelta)<0.01){
        duplicate=true;
        continue;
      }
      revised=true;
      continue;
    }
    next.push(old);
  }
  return {feed:next,duplicate,revised};
}

function gvSuppressMinorDefensiveEvent(base){
  const pos=String(base?.pos||'').toUpperCase();
  if(!['DEF','DST'].includes(pos))return false;
  const delta=Math.abs(Number(base?.delta||0));
  const st=base?.intervalAnalysis?.stats||{};
  const qbHit=Number(st.qb_hit||0)>0||/quarterback hit|qb hit/i.test(String(base?.detail||''));
  if(qbHit)return false;
  return delta>0&&delta<1;
}


function gvRosterStarterSet(snapshot,rid){
  return new Set((snapshot?.byRoster?.[String(rid)]?.starters||[]).filter(Boolean).map(String));
}
function gvCountBenchPointDeltas(prevSnap,nextSnap,rid){
  const starters=gvRosterStarterSet(nextSnap,rid),prevAll=prevSnap?.byRoster?.[rid]?.fullPlayersPoints||{},nextAll=nextSnap?.byRoster?.[rid]?.fullPlayersPoints||{};
  let count=0;
  for(const pid of new Set([...Object.keys(prevAll),...Object.keys(nextAll)])){
    if(starters.has(String(pid)))continue;
    const d=Number(((Number(nextAll[pid])||0)-(Number(prevAll[pid])||0)).toFixed(2));
    if(Math.abs(d)>=0.01)count++;
  }
  return count;
}
function gvStarterPointDeltaCount(prevSnap,nextSnap,rid){
  const starters=gvRosterStarterSet(nextSnap,rid),prevPts=prevSnap?.byRoster?.[rid]?.playersPoints||{},nextPts=nextSnap?.byRoster?.[rid]?.playersPoints||{};
  let count=0;
  for(const pid of starters){
    const d=Number(((Number(nextPts[pid])||0)-(Number(prevPts[pid])||0)).toFixed(2));
    if(Math.abs(d)>=0.01)count++;
  }
  return count;
}
function gvDetectUnresolvedTeamScoreChanges(prevSnap,nextSnap){
  const relevant=gvRelevantRosterPair(),unresolved=[];
  gvLiveCaptureDiagnostics.lastAt=Number(nextSnap?.capturedAt||Date.now());
  gvLiveCaptureDiagnostics.teamScoreChanges=0;
  gvLiveCaptureDiagnostics.starterDeltas=0;
  gvLiveCaptureDiagnostics.benchDeltasIgnored=0;
  gvLiveCaptureDiagnostics.unresolvedTeamChanges=0;
  for(const rid of relevant){
    const before=Number(prevSnap?.byRoster?.[rid]?.points||0),after=Number(nextSnap?.byRoster?.[rid]?.points||0),teamDelta=Number((after-before).toFixed(2));
    const starterDeltaCount=gvStarterPointDeltaCount(prevSnap,nextSnap,rid);
    const benchDeltaCount=gvCountBenchPointDeltas(prevSnap,nextSnap,rid);
    if(Math.abs(teamDelta)>=0.01)gvLiveCaptureDiagnostics.teamScoreChanges++;
    gvLiveCaptureDiagnostics.starterDeltas+=starterDeltaCount;
    gvLiveCaptureDiagnostics.benchDeltasIgnored+=benchDeltaCount;
    const statFirstPending=[...gvStatFirstReconciliation.entries()].some(([key,state])=>key.startsWith(`${String(rid)}:`)&&Math.abs(Number(state?.pendingExpected||0))>=.01);
    if(Math.abs(teamDelta)>=0.01&&starterDeltaCount===0&&!statFirstPending){
      unresolved.push({rosterId:String(rid),delta:teamDelta,before,after,time:Number(nextSnap?.capturedAt||Date.now())});
      gvLiveCaptureDiagnostics.unresolvedTeamChanges++;
    }
  }
  gvLiveCaptureDiagnostics.lastMessage=`Team changes ${gvLiveCaptureDiagnostics.teamScoreChanges} • Starter deltas ${gvLiveCaptureDiagnostics.starterDeltas} • Bench deltas ignored ${gvLiveCaptureDiagnostics.benchDeltasIgnored} • Unresolved ${gvLiveCaptureDiagnostics.unresolvedTeamChanges}`;
  return unresolved;
}
function gvUnresolvedTeamSummary(entry,nextSnap){
  const rid=String(entry?.rosterId||''),score=gvSessionScoreLine(nextSnap);
  return gvNormalizeEventSource({
    id:`unresolved-${Number(entry?.time||Date.now())}-${rid}`,
    type:'summary',source:'summary',time:Number(entry?.time||Date.now()),
    rosterId:rid,name:teamName(rosterFor(rid)),delta:Number(entry?.delta||0),total:Number(entry?.after||0),
    leftScore:score.leftScore,rightScore:score.rightScore,
    detail:'Sleeper team score changed before a started-player scoring breakdown was available',
    intervalClass:'UNRESOLVED_TEAM_SCORE',unresolvedTeamScore:true,played:true
  },'summary');
}
function gvIsStartedPlayerForEvent(evt){
  if(!evt?.rosterId||!evt?.playerId)return true;
  const src=gvNormalizeSourceValue(evt?.source,evt||{});
  if(src==='testing'||src==='simulation')return true;
  const pair=chosenPair?.(),row=pair?.rows?.find(r=>String(r.roster_id)===String(evt.rosterId));
  if(!row)return false;
  return new Set((row.starters||[]).filter(Boolean).map(String)).has(String(evt.playerId));
}



function gvStatFirstKey(rid,pid){return `${String(rid)}:${String(pid)}`}
function gvScoringStatDelta(statDelta={},pos=''){
  const out={};
  for(const [key,value] of Object.entries(statDelta||{})){
    const num=Number(value||0);if(!Number.isFinite(num)||Math.abs(num)<.0001)continue;
    const direct=(leagueInfo?.scoring_settings&&Object.prototype.hasOwnProperty.call(leagueInfo.scoring_settings,key))||
      Object.prototype.hasOwnProperty.call(UCL_2026_SCORING_FALLBACK,key);
    const alias=UCL_SCORING_ALIASES[key];
    const scoreKey=direct?key:(alias||key);
    const weight=uclScoringWeight(scoreKey,0);
    if(Math.abs(weight)>.0000001)out[key]=num;
  }
  // Reception bonuses can be position-specific even when Sleeper does not emit
  // a separate bonus stat key. Keep rec so uclScoreStats can apply that bonus.
  const p=String(pos||'').toUpperCase()==='DST'?'DEF':String(pos||'').toUpperCase();
  if(Number(statDelta?.rec||0)){
    const bonusKey=p==='TE'?'bonus_rec_te':p==='RB'?'bonus_rec_rb':p==='WR'?'bonus_rec_wr':'';
    if(bonusKey&&Math.abs(uclScoringWeight(bonusKey,0))>.0000001)out.rec=Number(statDelta.rec);
  }
  return out;
}
function gvExpectedStatFantasyDelta(statDelta={},pos=''){
  return Number(uclScoreStats(gvScoringStatDelta(statDelta,pos),pos).toFixed(2));
}
function gvReconciliationState(rid,pid){
  const state=gvPendingStatCandidates.get(`${rid}:${pid}`);
  return {
    pendingExpected:Number(state?.expectedDelta||0),
    updatedAt:Number(state?.lastSeenAt||0),
    firstSeenAt:Number(state?.firstSeenAt||0)
  };
}
function gvBuildStatFirstEvent(rid,pid,nextSnap,pointBefore,pointAfter,statDelta,expectedDelta){
  const p=playerInfo(pid),colors=nflTeamColors(p.team),scores=gvSessionScoreLine(nextSnap);
  const analysis=gvIntervalPlayAnalysis(pid,p.pos,statDelta,expectedDelta);
  const total=Math.abs(Number(pointAfter-pointBefore))>=.01?Number(pointAfter):Number((pointBefore+expectedDelta).toFixed(2));
  const base={
    id:`stat-${nextSnap.capturedAt}-${rid}-${pid}`,
    time:nextSnap.capturedAt,rosterId:rid,playerId:String(pid),name:p.name,pos:p.pos,nflTeam:p.team,
    opponentNflTeam:gameViewOpponentByPlayer?.[String(pid)]||gvOpponentFromWeeklyMap(p.team)||'',
    opponentSource:gameViewOpponentByPlayer?.[String(pid)]?'stats':(gvOpponentFromWeeklyMap(p.team)?'schedule':''),
    teamPrimary:colors[0],teamSecondary:colors[1],delta:Number(expectedDelta.toFixed(2)),total,
    authoritativeTotal:Number(pointAfter),leftScore:scores.leftScore,rightScore:scores.rightScore,
    detail:analysis.detail,intervalAnalysis:analysis,statFirst:true,likelyCorrection:false,played:false
  };
  const evidence=gvCorrectionEvidence(base);
  base.likelyCorrection=evidence.correction||expectedDelta<0;
  base.negativeScoringEvent=evidence.negativePlay||expectedDelta<0;
  base.correctionReason=evidence.reason||'';
  if(!base.likelyCorrection&&gvSuppressMinorDefensiveEvent(base))return null;
  if(analysis.confidence==='single'){
    const inferred=gameViewEventFromDelta({...base,detail:analysis.detail});
    return {...base,...(inferred||{}),id:base.id,type:'play',source:'live',detail:analysis.detail,intervalClass:'SINGLE_PLAY'};
  }
  if(analysis.confidence==='burst')return {...base,type:'burst',source:'live',intervalClass:'MULTI_PLAY_BURST',played:true};
  return {...base,type:'summary',source:'live',intervalClass:'AMBIGUOUS_SUMMARY',played:true};
}

function gvPendingStatKey(rid,pid){return `${rid}:${pid}`}
function gvPendingStatState(rid,pid){
  const key=gvPendingStatKey(rid,pid);
  let state=gvPendingStatCandidates.get(key);
  if(!state){
    state={statDelta:{},expectedDelta:0,firstSeenAt:0,lastSeenAt:0,pointBefore:0,lastPointSeen:0};
    gvPendingStatCandidates.set(key,state);
  }
  return state;
}
function gvMergeStatDeltas(base={},delta={}){
  const out={...base};
  for(const [k,v] of Object.entries(delta||{})){
    const num=Number(v||0);if(!Number.isFinite(num)||Math.abs(num)<.0001)continue;
    out[k]=Number((Number(out[k]||0)+num).toFixed(4));
    if(Math.abs(out[k])<.0001)delete out[k];
  }
  return out;
}
function gvIsDiscreteMajorStatPackage(statDelta={},pos=''){
  const s=gvScoringStatDelta(statDelta,pos);
  const majorKeys=['pass_td','rush_td','rec_td','int','fum_lost','fum_rec_td','def_td','def_st_td','st_td','safe','def_2pt','pass_2pt','rush_2pt','rec_2pt','blk_kick'];
  return majorKeys.some(k=>Math.abs(Number(s[k]||0))>=1);
}
function gvDiscardExpiredPendingStats(now=Date.now()){
  for(const [key,state] of gvPendingStatCandidates){
    if(now-Number(state.lastSeenAt||0)>GV_FPTS_CONFIRM_WINDOW_MS)gvPendingStatCandidates.delete(key);
  }
}
function gvAccumulatePendingStatCandidate(rid,pid,statDelta,pointBefore,pointAfter,now){
  const state=gvPendingStatState(rid,pid);
  if(!state.firstSeenAt){
    state.firstSeenAt=now;
    state.pointBefore=Number(pointBefore||0);
  }
  state.statDelta=gvMergeStatDeltas(state.statDelta,statDelta);
  state.expectedDelta=gvExpectedStatFantasyDelta(state.statDelta,playerInfo(pid).pos);
  state.lastSeenAt=now;
  state.lastPointSeen=Number(pointAfter||0);
  return state;
}
function gvConfirmedCandidateEvent(rid,pid,nextSnap,state,authoritativeDelta,pointAfter){
  const expected=Number(state.expectedDelta||0),auth=Number(authoritativeDelta||0);
  const sameSign=Math.abs(expected)<.01||Math.sign(expected)===Math.sign(auth);
  if(Math.abs(auth)<.01||!sameSign)return null;
  return gvBuildStatFirstEvent(
    rid,pid,nextSnap,
    Number((pointAfter-auth).toFixed(2)),
    Number(pointAfter),
    state.statDelta,
    Number(auth.toFixed(2))
  );
}
function gvBuildReconciliationCorrection(rid,pid,nextSnap,pointAfter,extra){
  if(Math.abs(extra)<.01)return null;
  const p=playerInfo(pid),colors=nflTeamColors(p.team),scores=gvSessionScoreLine(nextSnap);
  return {
    id:`reconcile-${nextSnap.capturedAt}-${rid}-${pid}`,
    time:nextSnap.capturedAt,rosterId:rid,playerId:String(pid),name:p.name,pos:p.pos,nflTeam:p.team,
    teamPrimary:colors[0],teamSecondary:colors[1],delta:Number(extra.toFixed(2)),total:Number(pointAfter),
    leftScore:scores.leftScore,rightScore:scores.rightScore,type:'summary',source:'live',
    detail:'Sleeper fantasy-point reconciliation',intervalClass:'FPTS_RECONCILIATION',
    statFirstReconciliation:true,likelyCorrection:true,played:true
  };
}

function gvStatActionEvidence(statDelta={}){
  const d=statDelta||{};
  return {
    rush:Number(d.rush_att||0)>0,
    reception:Number(d.rec||0)>0,
    passAttempt:Number(d.pass_att||0)>0,
    passCompletion:Number(d.pass_cmp||0)>0,
    kickReturn:Number(d.kick_ret||d.kr||0)>0,
    puntReturn:Number(d.punt_ret||d.pr||0)>0
  };
}
function gvYardageStatRules(){
  return [
    {key:'rush_yd',action:['rush']},
    {key:'rec_yd',action:['reception']},
    {key:'pass_yd',action:['passAttempt','passCompletion']},
    {key:'kick_ret_yd',action:['kickReturn']},
    {key:'punt_ret_yd',action:['puntReturn']}
  ];
}
function gvPrimaryYardageDecision(rid,pid,statDelta,now=Date.now()){
  const action=gvStatActionEvidence(statDelta);
  const decisions=[];
  for(const rule of gvYardageStatRules()){
    const yards=Number(statDelta?.[rule.key]||0);
    if(!Number.isFinite(yards)||Math.abs(yards)<.0001)continue;
    const hasAction=rule.action.some(k=>action[k]);
    const recentKey=`${rid}:${pid}:${rule.key}`;
    const recent=gvRecentAcceptedStatPlays.get(recentKey);
    const withinWindow=!!recent&&now-Number(recent.time||0)<=GV_STAT_REJECTION_WINDOW_MS;

    if(hasAction){
      decisions.push({key:rule.key,yards,accept:true,reason:'new play-count stat advanced',withinWindow});
      continue;
    }
    if(withinWindow){
      decisions.push({key:rule.key,yards,accept:false,reason:`yardage-only delta inside ${Math.round(GV_STAT_REJECTION_WINDOW_MS/1000)}s of accepted same-stat play`,withinWindow});
      continue;
    }
    if(yards<0){
      decisions.push({key:rule.key,yards,accept:false,reason:'yardage decreased without a new play-count stat',withinWindow});
      continue;
    }
    if(Math.abs(yards)<=GV_SMALL_YARDAGE_CORRECTION_MAX){
      decisions.push({key:rule.key,yards,accept:false,reason:`small yardage-only delta (≤${GV_SMALL_YARDAGE_CORRECTION_MAX})`,withinWindow});
      continue;
    }
    decisions.push({key:rule.key,yards,accept:true,reason:withinWindow?'large yardage delta accepted despite recent same-stat play':'large yardage-only delta accepted',withinWindow});
  }
  return decisions;
}
function gvStatRenderDecision(rid,pid,statDelta,now=Date.now()){
  const yardage=gvPrimaryYardageDecision(rid,pid,statDelta,now);
  const action=gvStatActionEvidence(statDelta);
  const major=gvIsDiscreteMajorStatPackage(statDelta,playerInfo(pid)?.pos||'');
  const hasAction=Object.values(action).some(Boolean);

  // If the interval contains only yardage evidence, every yardage component must
  // survive the correction filter before we manufacture a play from it.
  if(yardage.length&&!hasAction&&!major){
    const accepted=yardage.filter(x=>x.accept);
    if(!accepted.length){
      return {accept:false,reason:yardage.map(x=>`${x.key}: ${x.reason}`).join('; '),yardage,action,major};
    }
  }
  return {accept:true,reason:hasAction?'play-count evidence':major?'major discrete football stat':'yardage threshold passed',yardage,action,major};
}
function gvRememberAcceptedStatPlay(rid,pid,statDelta,evt,now=Date.now()){
  for(const item of gvPrimaryYardageDecision(rid,pid,statDelta,now)){
    if(!item.accept)continue;
    gvRecentAcceptedStatPlays.set(`${rid}:${pid}:${item.key}`,{
      time:now,yards:item.yards,eventId:evt?.id||'',family:evt?.intervalAnalysis?.family||''
    });
  }
  for(const [key,state] of gvRecentAcceptedStatPlays){
    if(now-Number(state?.time||0)>120000)gvRecentAcceptedStatPlays.delete(key);
  }
}
function gvDeltaEvents(prevSnap,nextSnap,options={}){
  if(!prevSnap||!nextSnap)return [];
  const relevant=gvRelevantRosterPair(),out=[],now=Number(nextSnap.capturedAt||Date.now());

  // Away/recovery processing remains conservative because one snapshot interval
  // may contain several real NFL plays that cannot be separated reliably.
  if(options&&options.recovery){
    gvDiscardExpiredPendingStats(now);
  }

  for(const rid of relevant){
    const prev=prevSnap.byRoster?.[rid],next=nextSnap.byRoster?.[rid];
    if(!next)continue;
    const starterIds=new Set((next.starters||[]).filter(Boolean).map(String));
    const ids=new Set([
      ...Object.keys(prev?.playersPoints||{}),...Object.keys(next.playersPoints||{}),
      ...Object.keys(prevSnap?.statsByPlayer||{}),...Object.keys(nextSnap?.statsByPlayer||{})
    ].filter(pid=>starterIds.has(String(pid))));

    for(const pid of ids){
      const before=Number(prev?.playersPoints?.[pid]||0),after=Number(next.playersPoints?.[pid]||0);
      const pointDelta=Number((after-before).toFixed(2));
      const statDelta=gvSnapshotStatDelta(prevSnap,nextSnap,pid);
      const p=playerInfo(pid);
      const expectedDelta=gvExpectedStatFantasyDelta(statDelta,p.pos);

      if(options&&options.recovery){
        const key=gvPendingStatKey(rid,pid);
        if(Math.abs(expectedDelta)>=.01)gvAccumulatePendingStatCandidate(rid,pid,statDelta,before,after,now);
        const pending=gvPendingStatCandidates.get(key);
        if(Math.abs(pointDelta)>=.01&&pending){
          const evt=gvConfirmedCandidateEvent(rid,pid,nextSnap,pending,pointDelta,after);
          gvPendingStatCandidates.delete(key);
          if(evt)out.push(evt);
        }else if(pending&&gvIsDiscreteMajorStatPackage(pending.statDelta,p.pos)){
          const evt=gvBuildStatFirstEvent(rid,pid,nextSnap,before,after,pending.statDelta,pending.expectedDelta);
          gvPendingStatCandidates.delete(key);
          if(evt)out.push(evt);
        }
        continue;
      }

      // Live v0.5.58 path: stats construct the play immediately. players_points is
      // supporting score data only and never creates a second/ghost GameView play.
      if(Math.abs(expectedDelta)<.01&&!gvIsDiscreteMajorStatPackage(statDelta,p.pos))continue;

      const decision=gvStatRenderDecision(rid,pid,statDelta,now);
      if(!decision.accept)continue;

      const evt=gvBuildStatFirstEvent(rid,pid,nextSnap,before,after,statDelta,expectedDelta);
      if(!evt)continue;

      evt.statRenderDecision=decision.reason;
      evt.fptsConfirmationRequired=false;
      evt.authoritativeTotal=Number(after);
      gvRememberAcceptedStatPlay(rid,pid,statDelta,evt,now);
      out.push(evt);
    }
  }

  const intervalCorrelated=gvCorrelateIntervalPassing(out);
  const tandemReady=options && options.recovery
    ?intervalCorrelated
    :gvHoldOrReleaseTandemTdEvents(intervalCorrelated,gvLivePendingTdState);
  return gvCorrelateAdjacentTurnovers(
    gvCorrelateAdjacentTd(tandemReady),
    options && options.recovery ? Number(nextSnap.capturedAt||Date.now()) : null
  ).map(e=>gvNormalizeEventSource(e,e?.type==='summary'?'summary':'live'));
}

function gvSessionGapMs(){
  if(!gameViewSession?.lastSeenAt)return 0;
  return Math.max(0,Date.now()-Number(gameViewSession.lastSeenAt||0));
}
function gvPlayerSnapshotDelta(prevSnap,nextSnap,rid,pid){
  const before=Number(prevSnap?.byRoster?.[rid]?.playersPoints?.[pid]||0);
  const after=Number(nextSnap?.byRoster?.[rid]?.playersPoints?.[pid]||0);
  return {before,after,delta:Number((after-before).toFixed(2))};
}
function gvAwayAtomicEvidence(evt){
  const st=evt?.intervalAnalysis?.stats||{};
  const nonzero=Object.fromEntries(Object.entries(st).filter(([,v])=>Math.abs(Number(v||0))>0));
  const rushAtt=Math.abs(Number(nonzero.rush_att||0));
  const rec=Math.abs(Number(nonzero.rec||0));
  const passCmp=Math.abs(Number(nonzero.pass_cmp||0));
  const passAtt=Math.abs(Number(nonzero.pass_att||0));
  const fg=Math.abs(Number(nonzero.fgm||0));
  const xp=Math.abs(Number(nonzero.xpm||0));
  const tdCount=Math.abs(Number(nonzero.rush_td||0))+Math.abs(Number(nonzero.rec_td||0))+
    Math.abs(Number(nonzero.pass_td||0))+Math.abs(Number(nonzero.def_td||0));
  const turnovers=Math.abs(Number(nonzero.pass_int||0))+Math.abs(Number(nonzero.fum_lost||nonzero.fum_lost_total||0))+
    Math.abs(Number(nonzero.int||0))+Math.abs(Number(nonzero.fum_rec||0));

  if(evt?.correlated&&gvEventHasMultipleFantasyImpacts(evt))return {atomic:true,reason:'correlated multi-player evidence'};
  if(evt?.turnoverKind&&turnovers<=2)return {atomic:true,reason:'paired turnover evidence'};
  if(gvIsLikelyStatCorrection(evt))return {atomic:false,reason:'correction/revision'};
  if(tdCount===1){
    if(rushAtt>1||rec>1||passCmp>1||passAtt>2)return {atomic:false,reason:'TD interval contains multiple offensive actions'};
    return {atomic:true,reason:'single TD evidence'};
  }
  if(fg===1||xp===1)return {atomic:true,reason:'single kick evidence'};
  if(rushAtt===1&&rec===0&&passCmp===0&&passAtt===0)return {atomic:true,reason:'single rushing attempt'};
  if(rec===1&&rushAtt===0&&passCmp===0)return {atomic:true,reason:'single reception'};
  if(passCmp===1&&passAtt<=1&&rushAtt===0&&rec===0)return {atomic:true,reason:'single completion'};
  return {atomic:false,reason:'cumulative interval may contain multiple plays'};
}

function gvAwayConfidence(evt,gapMs=0){
  const evidence=gvAwayAtomicEvidence(evt);
  if(!evidence.atomic)return {score:0,reconstruct:false,reason:evidence.reason};
  let score=3;
  if(evt?.correlated)score+=3;
  if(evt?.turnoverKind)score+=2;
  const detail=String(evt?.detail||'').toLowerCase();
  if(detail.includes('touchdown'))score+=2;
  if(detail.includes('field goal'))score+=2;
  if(evt?.intervalClass==='SINGLE_PLAY')score+=1;

  // After 90 seconds, require especially strong evidence before animating.
  const threshold=Number(gapMs||0)>90000?6:4;
  return {score,reconstruct:score>=threshold,reason:evidence.reason,threshold};
}
function gvMakeAwaySummary(prevSnap,nextSnap,events){
  const score=gvSessionScoreLine(nextSnap);
  const start=Number(prevSnap?.capturedAt||gameViewSession?.lastSeenAt||Date.now());
  const end=Number(nextSnap?.capturedAt||Date.now());
  const byPlayer={};
  const seenRevisionKeys=new Set();

  const addImpact=(impact,e)=>{
    const key=`${String(impact?.rosterId||e?.rosterId||'')}|${String(impact?.playerId||e?.playerId||'')}`;
    if(!byPlayer[key])byPlayer[key]={
      rosterId:String(impact?.rosterId||e?.rosterId||''),
      playerId:String(impact?.playerId||e?.playerId||''),
      name:impact?.name||e?.name||'Player',
      pos:impact?.pos||e?.pos||'',
      delta:0,
      detail:[]
    };
    byPlayer[key].delta=Number((byPlayer[key].delta+Number(impact?.delta??e?.delta??0)).toFixed(2));
    if(e?.detail&&!byPlayer[key].detail.includes(e.detail))byPlayer[key].detail.push(e.detail);
  };

  for(const e of events){
    const rkey=gvEventRevisionKey(e);
    if(rkey&&seenRevisionKeys.has(rkey))continue;
    if(rkey)seenRevisionKeys.add(rkey);
    if(Array.isArray(e?.fantasyImpacts)&&e.fantasyImpacts.length){
      e.fantasyImpacts.forEach(x=>addImpact(x,e));
    }else{
      addImpact(null,e);
    }
  }

  return {
    id:`away-summary-${end}`,
    type:'summary',
    source:'summary',
    time:end,
    startTime:start,
    endTime:end,
    leftScore:score.leftScore,
    rightScore:score.rightScore,
    players:Object.values(byPlayer),
    text:'While You Were Away',
    recoveryGapMs:Math.max(0,end-start),
    played:true
  };
}
function gvProcessAwayRecovery(prevSnap,nextSnap){
  if(!prevSnap||!nextSnap)return {reconstructed:[],summary:null};
  const gapMs=Math.max(0,Number(nextSnap.capturedAt||0)-Number(prevSnap.capturedAt||0));

  // Expire any live TD half left pending before the gap. Recovery snapshots never
  // create a fresh tandem hold because their interval is already too broad.
  const expiredPending=gvReleaseExpiredPendingTds(Number(nextSnap.capturedAt||Date.now()),gvLivePendingTdState);
  const raw=[...expiredPending,...gvDeltaEvents(prevSnap,nextSnap,{recovery:true})];
  if(!raw.length)return {reconstructed:[],summary:null,gapMs};

  const reconstructed=[],ambiguous=[];
  for(const evt of raw){
    const verdict=gvAwayConfidence(evt,gapMs);
    const normalized={
      ...evt,
      recoveryGapMs:gapMs,
      awayEvidenceReason:verdict.reason,
      awayConfidence:verdict.score
    };
    if(verdict.reconstruct){
      reconstructed.push(gvNormalizeEventSource({
        ...normalized,id:`recon-${evt.id}`,source:'reconstructed',played:false
      },'reconstructed'));
    }else{
      ambiguous.push(gvNormalizeEventSource({...normalized,source:'summary',played:true},'summary'));
    }
  }

  if(reconstructed.length){
    gvOpenActivityWindow(nextSnap.capturedAt);
    for(const evt of reconstructed)gvFeedAdd(evt,true);
  }

  let summary=null;
  if(ambiguous.length){
    summary=gvMakeAwaySummary(prevSnap,nextSnap,ambiguous);
    summary.ambiguousEventCount=ambiguous.length;
    gvFeedAdd(summary,false);
  }

  return {reconstructed,summary,ambiguous,gapMs};
}

function gvProcessLiveSnapshot(){
  const s=gvEnsureSession(),snap=gvMatchupScoreSnapshot();if(!s||!snap)return [];
  const prev=s.lastSnapshot;
  if(!prev){s.baseline=snap;s.lastSnapshot=snap;gvSaveSession();gvUpdateActivityState(0);return []}

  const gap=Math.max(0,snap.capturedAt-Number(prev.capturedAt||s.lastSeenAt||snap.capturedAt));
  let events=[];
  if(gap>45000){
    const recovered=gvProcessAwayRecovery(prev,snap);
    events=[...recovered.reconstructed];
    if(recovered.summary)events.push(recovered.summary);
  }else{
    const unresolved=gvDetectUnresolvedTeamScoreChanges(prev,snap);
    events=gvDeltaEvents(prev,snap);
    if(events.length||unresolved.length){
      gvOpenActivityWindow(snap.capturedAt);
      for(const evt of events)gvFeedAdd(evt,evt.type==='play'||evt.type==='burst');
      for(const item of unresolved){
        const summary=gvUnresolvedTeamSummary(item,snap);
        gvFeedAdd(summary,false);
        events.push(summary);
      }
    }
  }
  if(!simulation.active&&events.length){
    const pressureEvents=events.filter(e=>
      Math.abs(Number(e?.delta||0))>0 &&
      !e?.likelyCorrection &&
      !e?.statFirstReconciliation &&
      !e?.unresolvedTeamScore
    );
    if(pressureEvents.length)updateMomentum(pressureEvents,snap.capturedAt);
  }
  s.lastSnapshot=snap;
  if(events.length)s.lastActivityAt=snap.capturedAt;
  gvSaveSession();gvRestorePlaybackQueue();gvUpdateActivityState(events.length);
  renderGameViewFeed();
  if(currentView==='gameview'&&!gameViewPlaying)playNextGameViewEvent();
  return events;
}


function gvSimulationRegressionCheck(evt){
  const issues=[];
  if(!evt)return ['missing event'];
  if(evt.multiActor&&evt.correlated){
    if(evt.qbPlayerId&&evt.receiverPlayerId){
      if(String(evt.qbNflTeam||evt.nflTeam||'')!==String(evt.receiverNflTeam||evt.nflTeam||'')){
        issues.push('correlated passer/receiver simulation event has different NFL teams');
      }
    }
    if(Array.isArray(evt.fantasyImpacts)&&evt.fantasyImpacts.length){
      for(const impact of evt.fantasyImpacts){
        if(!Number.isFinite(Number(impact.delta)))issues.push('non-numeric fantasy impact');
      }
    }
  }
  if(!Number.isFinite(Number(evt.delta||0)))issues.push('non-numeric event delta');
  return issues;
}
function gvNormalizeSimulationEvent(evt){
  if(!evt)return null;
  const normalized=gvNormalizeEventSource({...evt,source:'simulation',testingForced:false},'simulation');
  const issues=gvSimulationRegressionCheck(normalized);
  if(issues.length){
    normalized.simulationRegressionIssues=issues;
    console.warn('UCL GameDay simulation regression check:',issues,normalized);
  }
  return normalized;
}


// v0.4.23 — league-wide CTESPN scoring alert layer
const CTESPN_ALERT_LOGO='data:image/png;base64,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2g8AtPmvt60x+RTQ9//6b15MI7+k/NZv/dbmF37hF87efvvtaZykZxpDYIwl2ljXuIse1dPFPITiR79DUOxY3igP1S/aqSd/UHBp3SQOf2zddbIfAMitA6l6+78oiqIoiqIoiqIoiuJ2qE2WPfzGb/zGRhtYUfBjow5Tm29xM2+0WSY/bZhBtIul8KW4a3HiBnFE8Y79BYCY0u85ALiu38Hubsbwbfv2AQCM7NFviUPiXJd9/Q2KgzmyUz/p4KSH4RcA8QBAZm20vhh++7d/e/PWW2/52GmssPuYdT3T2CLa/EdEi7udRmZmyT8T84e1VOSpOikdpg4AaFfc+NeaCU+unvqm/9VV+xzQ1dWVuzmQ+tEPfnhYZYuiKIqiKIqiKIqiKIq91EbLkfCpIH4ZkA8AsGsjTxLJ7rzRBiO/vIGf40T3yO6bcWtl918AKM5a/iOWvuG8r/3ZDYf47cQxd/Tbtc9vV8PIHv0ya2GwL3wfo/5d63OFYUoEdZFMutj/BoAOANhsxV6brC+Wr33ta5vXX3/dx09jprHEDnJrnPNaAH0/fcpDyB79IOc9IoZtp97ND2K9pnpaPK2PEtLiB1fPn/mmPwcA6COHVBwA1IFUURRFURRFURRFURTF7VKbLTeEjTw2trS5JTtyHfLG3GjTL8eJ7rUw8eMfv9hNtq9//f89VSpXZK3fhmGpr3OcfX8DYMmtfsvhYsn/WEbjE1kaz2yC6rSlh/0AgM3VeuO/uAlf/9r/a6isP/rx/29Vp37jN76+iQdSwIY/8qMflD4WRVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEUXyTOzv7/aiWP0AGEY3wAAAAASUVORK5CYII=';
let ctespnAlertQueue=[],ctespnAlertShowing=false,ctespnAlertTimer=null,ctespnMajorTimer=null,ctespnPreemptTimer=null,ctespnActiveAlert=null;
const CTESPN_CROSS_POLL_WINDOW_MS=35000;
const CTESPN_STORY_MEMORY_MS=120000;
const ctespnCrossPollFragments=[];
const ctespnStoryMemory=[];
function ctespnPruneStoryMemory(now=gameNow()){
  const cutoff=Number(now||Date.now())-CTESPN_STORY_MEMORY_MS;
  for(let i=ctespnStoryMemory.length-1;i>=0;i--)if(Number(ctespnStoryMemory[i]?.time||0)<cutoff)ctespnStoryMemory.splice(i,1);
  if(ctespnStoryMemory.length>160)ctespnStoryMemory.splice(0,ctespnStoryMemory.length-160);
}
function ctespnAlertScoreState(a){
  const line=a?.line;if(!line)return '';
  return `${String(a?.pairId||'')}|${Number(line.aScore||0).toFixed(2)}|${Number(line.bScore||0).toFixed(2)}`;
}
function ctespnStoryFingerprint(a){
  if(!a)return '';
  const item=a.item||a.focal||{};
  return [a.kind||'',a.type||'',a.title||'',String(a.pairId||''),String(item.rosterId||''),String(item.playerId||''),Number(item.delta||0).toFixed(3),ctespnAlertScoreState(a),a.revision?'revision':'normal'].join('|');
}
function ctespnRememberStory(a,now=gameNow()){
  if(!a)return null;ctespnPruneStoryMemory(now);
  const item=a.item||a.focal||{},rec={time:Number(now||Date.now()),pairId:String(a.pairId||''),rosterId:String(item.rosterId||''),playerId:String(item.playerId||''),kind:a.kind||'',type:a.type||'',title:a.title||'',scoreState:ctespnAlertScoreState(a),fingerprint:ctespnStoryFingerprint(a),alert:a};
  ctespnStoryMemory.push(rec);return rec;
}
function ctespnFindRecentStory(item,pairId,now=gameNow()){
  ctespnPruneStoryMemory(now);const rid=String(item?.rosterId||''),pid=String(item?.playerId||''),pair=String(pairId||'');
  return [...ctespnStoryMemory].reverse().find(x=>x.pairId===pair&&x.rosterId===rid&&x.playerId===pid)||null;
}
function ctespnAlreadyAiredState(a,now=gameNow()){
  ctespnPruneStoryMemory(now);const fp=ctespnStoryFingerprint(a),state=ctespnAlertScoreState(a);
  return ctespnStoryMemory.some(x=>x.fingerprint===fp||(state&&x.scoreState===state&&x.kind===a.kind&&x.title===a.title));
}
function ctespnSemantic(item){
  const evt={delta:Number(item?.delta||0),intervalAnalysis:item?.intervalAnalysis||null,detail:item?.detail||''};
  try{return gvCorrectionEvidence(evt)}catch(e){return {correction:false,negativePlay:Number(item?.delta||0)<0,reason:''}}
}

function ctespnPairForRoster(rid){return matchupPairs().find(p=>(p.rows||[]).some(r=>String(r.roster_id)===String(rid)))||null}
function ctespnFeaturedRosterIds(){const p=chosenPair?.();return new Set((p?.rows||[]).map(r=>String(r.roster_id)))}
function ctespnAlertDetail(item){
  if(item?.detail)return String(item.detail);
  const p=playerInfo(item?.playerId);
  try{return playDetailFromStats(item?.playerId,p?.pos,item?.delta)||''}catch(e){return ''}
}
