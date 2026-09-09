/* UCL GameDay v0.5.03 — build fragment: 10_testing_area.js
   This file is concatenated in manifest order into the app's single lexical scope.
   It is intentionally not loaded independently in the browser. */
function testingRosteredPlayerIds(){
  const pair=chosenPair?.();const ids=new Set();
  if(!pair)return ids;
  for(const row of pair.rows||[]){
    const roster=rosterFor(row.roster_id);
    for(const id of (roster?.players||[]))if(id!=null)ids.add(String(id));
  }
  return ids;
}
function testingStatChangesForPlayer(pid){
  const now=gameViewStats[String(pid)]||{},prev=lastGameViewStats[String(pid)]||{},changes={};
  const keys=new Set([...Object.keys(prev),...Object.keys(now)]);
  for(const key of keys){
    const a=Number(prev[key]),b=Number(now[key]);
    if(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(b-a)>.0001)changes[key]={before:a,after:b,delta:Number((b-a).toFixed(4))};
    else if(!Number.isFinite(a)&&Number.isFinite(b)&&b!==0)changes[key]={before:0,after:b,delta:b};
  }
  return changes;
}
function testingPlainEnglish(pid,changes){
  const p=playerInfo(pid),d=Object.fromEntries(Object.entries(changes).map(([k,v])=>[k,v.delta]));
  const team=p.team;
  const teammates=[...testingRosteredPlayerIds()].map(id=>({id,...playerInfo(id)})).filter(x=>x.team===team);
  if((d.rec||0)===1){
    const y=Math.round(d.rec_yd||0),td=(d.rec_td||0)>0;
    const qb=teammates.find(x=>{
      if(x.pos!=='QB')return false;
      const q=testingStatChangesForPlayer(x.id);
      return (q.pass_cmp?.delta||0)===1&&Math.abs((q.pass_yd?.delta||0)-y)<=1;
    });
    const base=td?`${y}-yard touchdown catch`:`${y}-yard catch`;
    return qb?`${base} completed by ${p.name}, thrown by ${qb.name}.`:`${p.name} records a ${base}.`;
  }
  if((d.rush_att||0)===1){
    const y=Math.round(d.rush_yd||0),td=(d.rush_td||0)>0;
    return `${p.name} rushes for ${y} yards${td?' and a touchdown':''}.`;
  }
  if((d.pass_cmp||0)===1){
    const y=Math.round(d.pass_yd||0),td=(d.pass_td||0)>0;
    const rec=teammates.find(x=>{
      if(!['WR','TE','RB'].includes(x.pos))return false;
      const r=testingStatChangesForPlayer(x.id);
      return (r.rec?.delta||0)===1&&Math.abs((r.rec_yd?.delta||0)-y)<=1;
    });
    return rec?`${p.name} completes a ${y}-yard${td?' touchdown':''} pass to ${rec.name}.`:`${p.name} completes a pass for ${y} yards${td?' and a touchdown':''}.`;
  }
  if((d.pass_att||0)===1&&(d.pass_cmp||0)===0){
    if((d.pass_int||0)===1)return `${p.name} throws an interception.`;
    return `${p.name} records an incomplete pass.`;
  }
  if((d.pass_int||0)===1)return `${p.name} throws an interception.`;
  if((d.fum_lost||d.fum_lost_total||0)===1)return `${p.name} loses a fumble.`;
  if((d.fgm||0)===1)return `${p.name} makes a field goal.`;
  if((d.xpm||0)===1)return `${p.name} makes an extra point.`;
  if((d.sack||0)===1)return `${p.name} records a sack.`;
  if((d.int||0)===1)return `${p.name} records an interception.`;
  if((d.fum_rec||0)===1)return `${p.name} records a fumble recovery.`;

  const bits=[];
  if(d.rec)bits.push(`${d.rec>0?'+':''}${d.rec} receptions`);
  if(Object.prototype.hasOwnProperty.call(d,'rec_yd'))bits.push(`${d.rec_yd>0?'+':''}${Math.round(d.rec_yd)} receiving yards`);
  if(d.rec_td)bits.push(`${d.rec_td>0?'+':''}${d.rec_td} receiving TD`);
  if(d.rush_att)bits.push(`${d.rush_att>0?'+':''}${d.rush_att} rush attempts`);
  if(Object.prototype.hasOwnProperty.call(d,'rush_yd'))bits.push(`${d.rush_yd>0?'+':''}${Math.round(d.rush_yd)} rushing yards`);
  if(d.rush_td)bits.push(`${d.rush_td>0?'+':''}${d.rush_td} rushing TD`);
  if(d.pass_att)bits.push(`${d.pass_att>0?'+':''}${d.pass_att} pass attempts`);
  if(d.pass_cmp)bits.push(`${d.pass_cmp>0?'+':''}${d.pass_cmp} completions`);
  if(Object.prototype.hasOwnProperty.call(d,'pass_yd'))bits.push(`${d.pass_yd>0?'+':''}${Math.round(d.pass_yd)} passing yards`);
  if(d.pass_td)bits.push(`${d.pass_td>0?'+':''}${d.pass_td} passing TD`);
  if(d.pass_int)bits.push(`${d.pass_int>0?'+':''}${d.pass_int} interceptions thrown`);
  if(d.fum_lost||d.fum_lost_total)bits.push(`${(d.fum_lost||d.fum_lost_total)>0?'+':''}${d.fum_lost||d.fum_lost_total} fumbles lost`);
  return bits.length?`${p.name}: ${bits.join(' • ')}.`:`${p.name}: Sleeper stat data changed.`;
}
function captureTestingAreaPoll(){
  if(!liveLoadingEnabled()||!gameViewStatsAt||gameViewStatsAt===testingLastPollAt)return;
  testingLastPollAt=gameViewStatsAt;
  const rostered=testingRosteredPlayerIds(),pair=chosenPair?.(),currentPoints={};

  if(pair){
    for(const row of pair.rows||[]){
      for(const pid of rostered){
        if(row.players_points&&Object.prototype.hasOwnProperty.call(row.players_points,pid)){
          currentPoints[String(pid)]=Number(row.players_points[pid]||0);
        }
      }
    }
  }

  for(const pid of rostered){
    const sid=String(pid),changes=testingStatChangesForPlayer(pid);
    const hasPrior=Object.prototype.hasOwnProperty.call(testingLastFantasyPoints,sid);
    const current=Number(currentPoints[sid]||0);
    const fantasyDelta=hasPrior?Number((current-Number(testingLastFantasyPoints[sid]||0)).toFixed(2)):0;
    if(!Object.keys(changes).length&&Math.abs(fantasyDelta)<.01)continue;

    const playerMeta=playerInfo(pid),plainText=testingPlainEnglish(pid,changes);
    const statDelta=Object.fromEntries(Object.entries(changes).map(([k,v])=>[k,Number(v.delta)||0]));
    const analysis=gvIntervalPlayAnalysis(pid,playerMeta.pos,statDelta,fantasyDelta);

    testingLog.unshift({
      time:gameViewStatsAt||Date.now(),playerId:sid,player:playerMeta.name||sid,
      pos:playerMeta.pos||'—',nflTeam:playerMeta.team||'FA',side:testingRosterSideForPlayer(pid),
      text:plainText,changes,rawNow:gameViewStats[sid]||{},fantasyDelta,
      intervalClass:analysis.confidence==='burst'?'MULTI_PLAY_BURST':analysis.confidence==='ambiguous'?'AMBIGUOUS_SUMMARY':'SINGLE_PLAY',
      family:analysis.family,scoringRelevant:analysis.scoringRelevant,
      correlated:/thrown by|pass to/i.test(plainText)
    });
  }

  for(const pid of rostered){
    const sid=String(pid);
    if(Object.prototype.hasOwnProperty.call(currentPoints,sid))testingLastFantasyPoints[sid]=currentPoints[sid];
  }

  if(testingLog.length>TESTING_LOG_MAX)testingLog.length=TESTING_LOG_MAX;
  saveTestingState();
  renderTestingArea();
}

function gvRosterPlayersForTest(rosterId){
  const r=rosterFor(rosterId);if(!r)return [];
  return (r.players||[]).map(id=>({id:String(id),...playerInfo(id)})).filter(p=>p&&p.name);
}
function gvTestingRandomInt(min,max){
  const lo=Math.ceil(Number(min)||0),hi=Math.floor(Number(max)||0);
  if(hi<=lo)return lo;
  return lo+Math.floor(Math.random()*(hi-lo+1));
}
function gvTestingRandomPoints(min,max,decimals=2){
  const lo=Number(min)||0,hi=Number(max)||lo;
  const value=lo+Math.random()*Math.max(0,hi-lo);
  return Number(value.toFixed(Math.max(0,decimals)));
}
function gvTestingScoreWeight(key,fallback=0){
  const w=Number(leagueInfo?.scoring_settings?.[key]);
  return Number.isFinite(w)?w:Number(fallback||0);
}

// v0.4.95: Testing Area uses one close synthetic matchup score per page load.
// Test actions calculate against that stable baseline but never re-roll or permanently
// mutate it. Dedicated score controls below the test field are the only way to change it.
let testingIdleScoreContext=null;
function gvTestingIdleScoreContext(force=false){
  if(testingIdleScoreContext&&!force)return testingIdleScoreContext;
  const center=gvTestingRandomPoints(88,124,2);
  const gap=.25+Math.random()*5.75,sign=Math.random()<.5?-1:1;
  testingIdleScoreContext={
    left:Number((center+sign*gap/2).toFixed(2)),
    right:Number((center-sign*gap/2).toFixed(2))
  };
  return testingIdleScoreContext;
}
function gvTestingRenderIdleScore(force=false){
  const ctx=gvTestingIdleScoreContext(force);
  const leftEl=$('#testLeftScore'),rightEl=$('#testRightScore');
  if(leftEl)leftEl.textContent=pts(ctx.left);
  if(rightEl)rightEl.textContent=pts(ctx.right);
  return ctx;
}
function gvTestingAdjustScore(side,delta){
  const ctx=gvTestingIdleScoreContext();
  const key=side==='right'?'right':'left',d=Number(delta||0);
  ctx[key]=Number(Math.max(0,ctx[key]+d).toFixed(2));
  gvTestingRenderIdleScore();
  const status=$('#testFieldStatus');
  if(status)status.textContent=`Testing score set • ${pts(ctx.left)} – ${pts(ctx.right)}`;
  return ctx;
}
function gvTestingResetCloseScore(){
  const ctx=gvTestingRenderIdleScore(true);
  const status=$('#testFieldStatus');
  if(status)status.textContent=`New close testing score • ${pts(ctx.left)} – ${pts(ctx.right)}`;
  return ctx;
}
function gvTestingScoreContext(evt){
  if(!evt||!evt.testingForced)return null;
  const pair=gameViewPair?.();if(!pair)return null;
  const oriented=orientedPair(pair),left=oriented?.rows?.[0],right=oriented?.rows?.[1];
  if(!left||!right)return null;
  const leftId=String(left.roster_id),rightId=String(right.roster_id),base=gvTestingIdleScoreContext();
  let dl=0,dr=0;
  if(Array.isArray(evt.fantasyImpacts)&&evt.fantasyImpacts.length){
    for(const x of evt.fantasyImpacts){
      const rid=String(x?.rosterId||''),d=Number(x?.delta||0);
      if(!Number.isFinite(d))continue;
      if(rid===leftId)dl+=d;else if(rid===rightId)dr+=d;
    }
  }else{
    const rid=String(evt.rosterId||''),d=Number(evt.delta||0);
    if(Number.isFinite(d)){if(rid===leftId)dl=d;else if(rid===rightId)dr=d}
  }
  const preLeft=Number(base.left.toFixed(2)),preRight=Number(base.right.toFixed(2));
  const postLeft=Number((preLeft+dl).toFixed(2)),postRight=Number((preRight+dr).toFixed(2));
  const beforeSign=Math.sign(preLeft-preRight),afterSign=Math.sign(postLeft-postRight);
  const leadChanged=!!afterSign&&beforeSign!==afterSign;
  const eventDelta=Number(evt.delta||0);
  const direction=eventDelta<0?'lost_lead':'took_lead';
  return {leftId,rightId,preLeft,preRight,postLeft,postRight,deltaLeft:Number(dl.toFixed(2)),deltaRight:Number(dr.toFixed(2)),leadChanged,direction};
}
function gvTestingEnsureRandomScoreContext(evt){
  if(!evt||!evt.testingForced)return null;
  if(evt.testingScoreContext)return evt.testingScoreContext;
  const ctx=gvTestingScoreContext(evt);if(!ctx)return null;
  evt.testingScoreContext=ctx;
  evt.leftScore=ctx.postLeft;evt.rightScore=ctx.postRight;
  // Testing treats an actual synthetic lead flip as qualifying so the specialized
  // announcer resolver can be exercised without changing the live late-game rules.
  evt.audioTestLeadChange={qualifying:ctx.leadChanged,direction:ctx.direction,source:'testing-score-controls'};
  return ctx;
}
function gvTestingRenderScorePhase(evt,phase='post'){
  const ctx=gvTestingEnsureRandomScoreContext(evt);if(!ctx)return;
  const pre=phase==='pre',left=pre?ctx.preLeft:ctx.postLeft,right=pre?ctx.preRight:ctx.postRight;
  // The Testing Area scorebar is the fixed test configuration. Only the hidden
  // GameView scorebar tracks the hypothetical play result during playback.
  const gl=$('#gvLeftScore'),gr=$('#gvRightScore');
  if(gl)gl.textContent=pts(left);
  if(gr)gr.textContent=pts(right);
}
function gvTestingPlayValue(play){
  // Testing Area values are intentionally non-deterministic so repeated manual
  // simulation buttons exercise different score/yardage combinations.
  if(play==='tandem'||play==='pass'){
    const yards=gvTestingRandomInt(3,52);
    return {yards,delta:Number((1+yards/10).toFixed(2))};
  }
  if(play==='rb_run'){
    const yards=gvTestingRandomInt(1,34);
    return {yards,delta:Number((yards/10).toFixed(2))};
  }
  if(play==='qb_run'){
    const yards=gvTestingRandomInt(1,28);
    return {yards,delta:Number((yards/10).toFixed(2))};
  }
  if(['wr_rec_fumble','rb_rec_fumble','wr_rush_fumble','rb_rush_fumble'].includes(play)){
    const receiving=play.includes('_rec_');
    const yards=gvTestingRandomInt(receiving?5:3,receiving?24:20);
    return {yards,delta:Number(-Math.abs(gvTestingScoreWeight('fum_lost',-2)||-2).toFixed(2))};
  }
  // v0.4.53 offensive touchdown test values. These use the league scoring
  // settings when available, while preserving UCL's familiar defaults.
  if(play==='qb_td'){
    const yards=gvTestingRandomInt(4,55);
    const qbDelta=yards*gvTestingScoreWeight('pass_yd',.04)+gvTestingScoreWeight('pass_td',6);
    return {yards,qbDelta:Number(qbDelta.toFixed(2)),delta:Number(qbDelta.toFixed(2))};
  }
  if(play==='tandem_td'){
    const yards=gvTestingRandomInt(4,55);
    const qbDelta=yards*gvTestingScoreWeight('pass_yd',.04)+gvTestingScoreWeight('pass_td',6);
    const recDelta=gvTestingScoreWeight('rec',1)+yards*gvTestingScoreWeight('rec_yd',.1)+gvTestingScoreWeight('rec_td',6);
    return {yards,qbDelta:Number(qbDelta.toFixed(2)),recDelta:Number(recDelta.toFixed(2)),delta:Number((qbDelta+recDelta).toFixed(2))};
  }
  if(play==='rush_td'){
    const yards=gvTestingRandomInt(1,45);
    const delta=yards*gvTestingScoreWeight('rush_yd',.1)+gvTestingScoreWeight('rush_td',6);
    return {yards,delta:Number(delta.toFixed(2))};
  }
  if(play==='rec_td'){
    const yards=gvTestingRandomInt(3,55);
    const delta=gvTestingScoreWeight('rec',1)+yards*gvTestingScoreWeight('rec_yd',.1)+gvTestingScoreWeight('rec_td',6);
    return {yards,delta:Number(delta.toFixed(2))};
  }
  if(play==='kick'||play==='kick_miss'){
    const yards=gvTestingRandomInt(21,62);if(play==='kick_miss')return {yards,delta:-1};
    const delta=yards>=50?5:yards>=40?4:3;return {yards,delta};
  }
  if(play==='def_pressure')return {delta:gvTestingRandomPoints(.5,3)};
  if(play==='incomplete')return {delta:0};
  if(play==='def_sack')return {delta:gvTestingRandomPoints(1,3)};
  if(play==='def_qb_hit')return {delta:gvTestingRandomPoints(.2,1)};
  if(play==='def_int'||play==='def_int_td'){
    const yards=gvTestingRandomInt(play==='def_int_td'?25:0,play==='def_int_td'?95:58);
    const td=play==='def_int_td';
    return {yards,delta:Number((gvTestingScoreWeight('int',2)+yards*gvTestingScoreWeight('def_int_ret_yd',.02)+(td?gvTestingScoreWeight('def_td',6):0)).toFixed(2))};
  }
  if(play==='def_fumble'||play==='def_fum_td'){
    const yards=gvTestingRandomInt(play==='def_fum_td'?20:0,play==='def_fum_td'?90:52);
    const td=play==='def_fum_td';
    return {yards,delta:Number((gvTestingScoreWeight('fum_rec',2)+yards*gvTestingScoreWeight('fum_rec_yd',.02)+(td?gvTestingScoreWeight('def_td',6):0)).toFixed(2))};
  }
  if(play==='def_kick_ret_td'||play==='def_punt_ret_td'){
    const isPunt=play==='def_punt_ret_td',yards=gvTestingRandomInt(isPunt?55:82,isPunt?92:108);
    const ydKey=isPunt?'punt_ret_yd':'kick_ret_yd';
    return {yards,delta:Number((yards*gvTestingScoreWeight(ydKey,0)+gvTestingScoreWeight('def_st_td',6)).toFixed(2))};
  }
  return {delta:gvTestingRandomPoints(.7,8)};
}

function gvTestEventForRoster(rosterId,opts={}){
  const play=opts.play||'random',requestedPos=String(opts.position||'').toUpperCase();
  const requestedPasserId=String(opts.tandemPasserId||'');
  const requestedReceiverId=String(opts.tandemReceiverId||'');
  const pair=chosenPair?.();if(!pair)return null;
  const rid=String(rosterId),rows=pair.rows||[];
  if(!rows.some(r=>String(r.roster_id)===rid))return null;
  const players=gvRosterPlayersForTest(rid);
  if(!players.length)return null;

  const row=rows.find(r=>String(r.roster_id)===rid);
  const baseTime=Date.now();
  const mk=(p,detail,delta,playType,extra={})=>({
    time:baseTime,rosterId:rid,playerId:p.id,name:p.name,delta,
    total:Number(row?.players_points?.[p.id]||0),detail,playType,
    source:'testing',testingForced:true,...extra
  });
  const first=(pos)=>players.find(p=>String(p.pos||'').toUpperCase()===pos);

  if(['wr_rec_fumble','rb_rec_fumble','wr_rush_fumble','rb_rush_fumble'].includes(play)){
    const receiving=play.includes('_rec_'),carrierPos=play.startsWith('wr_')?'WR':'RB';
    const p=first(carrierPos);if(!p)return null;
    const sample=gvTestingPlayValue(play),yards=sample.yards;
    const detail=receiving
      ?`${carrierPos} catch for ${yards} yards, then fumble lost`
      :`${carrierPos} rush for ${yards} yards, then fumble lost`;
    const stats=receiving
      ?{rec:1,rec_yd:yards,fum_lost:1}
      :{rush_att:1,rush_yd:yards,fum_lost:1};
    let item=mk(p,detail,sample.delta,play);
    item.intervalAnalysis={count:1,family:receiving?'reception':'rush',detail,confidence:'single',stats,pointDelta:sample.delta,scoringRelevant:true};
    let evt=gameViewEventFromDelta(item);if(!evt)return null;
    return {...evt,id:`forced-${play}-${rid}-${baseTime}`,type:'play',playType:play,source:'testing',testingForced:true,
      playerId:p.id,name:p.name,pos:carrierPos,nflTeam:p.team,detail,visualYards:yards,
      offensiveFumbleTest:true,fumbleOrigin:receiving?'reception':'rush',fumbleCarrierPos:carrierPos,
      turnoverKind:'fumble',fumbleLost:true,delta:sample.delta};
  }

  if(play==='tandem'||play==='pass'){
    const qbs=players.filter(p=>String(p.pos||'').toUpperCase()==='QB');
    let recs=players.filter(p=>['WR','TE','RB'].includes(String(p.pos||'').toUpperCase()));
    if(['WR','TE','RB'].includes(requestedPos))recs=recs.filter(p=>String(p.pos||'').toUpperCase()===requestedPos);
    let chosen=null;
    if(play==='tandem'&&requestedPasserId&&requestedReceiverId&&requestedPasserId!==requestedReceiverId){
      const passer=players.find(p=>String(p.id)===requestedPasserId&&['QB','RB','WR','TE'].includes(String(p.pos||'').toUpperCase()));
      const rec=players.find(p=>String(p.id)===requestedReceiverId&&['QB','RB','WR','TE'].includes(String(p.pos||'').toUpperCase()));
      if(passer&&rec)chosen=[passer,rec];
    }
    if(!chosen){
      const same=[];
      for(const qb of qbs)for(const rec of recs){
        if(qb.team&&rec.team&&qb.team!=='FA'&&qb.team===rec.team)same.push([qb,rec]);
      }
      if(play==='tandem'&&!same.length)return null;
      if(same.length)chosen=same[assignmentHash(`${rid}|${baseTime}|${play}`)%same.length];
    }
    if(chosen){
      const [passer,rec]=chosen,sample=gvTestingPlayValue(play),yards=sample.yards;
      const passerPos=String(passer.pos||'QB').toUpperCase(),receiverPos=String(rec.pos||'WR').toUpperCase();
      const trickPlay=passerPos!=='QB'||receiverPos==='QB';
      let evt=gameViewEventFromDelta(mk(rec,`${yards}-yard reception`,sample.delta,'reception'));
      if(!evt)return null;
      return {...evt,id:`forced-${play}-${rid}-${baseTime}`,type:'play',playType:'qb_pass',
        source:'testing',testingForced:true,multiActor:true,correlated:true,simulatedTandem:play==='tandem',trickPlay,
        passerPlayerId:passer.id,passerName:passer.name,passerPos,passerNflTeam:passer.team,
        qbPlayerId:passer.id,qbName:passer.name,qbPos:passerPos,qbNflTeam:passer.team,
        receiverPlayerId:rec.id,receiverName:rec.name,receiverPos,receiverNflTeam:rec.team,
        playerId:rec.id,name:rec.name,pos:receiverPos,nflTeam:rec.team,detail:`${yards}-yard reception`,visualYards:yards};
    }
    const qb=first('QB');
    if(qb){
      const sample=gvTestingPlayValue('pass');
      let evt=gameViewEventFromDelta(mk(qb,`${sample.yards} passing yards`,Number((sample.yards*.04).toFixed(2)),'qb_pass'));
      return evt?{...evt,id:`forced-pass-${rid}-${baseTime}`,playType:'qb_pass',source:'testing',testingForced:true}:null;
    }
  }

  if(play==='qb_td'||play==='tandem_td'){
    const qbs=players.filter(p=>String(p.pos||'').toUpperCase()==='QB');
    const recs=players.filter(p=>['WR','TE','RB'].includes(String(p.pos||'').toUpperCase()));
    let passer=qbs[0]||null,target=null;
    if(play==='tandem_td'&&requestedPasserId&&requestedReceiverId&&requestedPasserId!==requestedReceiverId){
      passer=players.find(p=>String(p.id)===requestedPasserId&&['QB','RB','WR','TE'].includes(String(p.pos||'').toUpperCase()))||null;
      target=players.find(p=>String(p.id)===requestedReceiverId&&['QB','RB','WR','TE'].includes(String(p.pos||'').toUpperCase()))||null;
    }
    if(play==='tandem_td'&&(!passer||!target)){
      const same=[];
      for(const qb of qbs)for(const rec of recs){if(qb.team&&rec.team&&qb.team!=='FA'&&qb.team===rec.team)same.push([qb,rec]);}
      if(!same.length)return null;
      [passer,target]=same[assignmentHash(`${rid}|${baseTime}|${play}`)%same.length];
    }
    if(!passer)return null;
    const sample=gvTestingPlayValue(play),yards=sample.yards;
    if(play==='qb_td'&&!target)target=recs[0]||null;
    const passerPos=String(passer.pos||'QB').toUpperCase(),receiverPos=String(target?.pos||'WR').toUpperCase();
    const trickPlay=play==='tandem_td'&&(passerPos!=='QB'||receiverPos==='QB');
    const stats={pass_att:1,pass_cmp:1,pass_yd:yards,pass_td:1,...(play==='tandem_td'?{rec:1,rec_yd:yards,rec_td:1}:{})};
    let item=mk(passer,`${yards}-yard touchdown pass`,sample.delta,'qb_pass');
    item.intervalAnalysis={count:1,family:'qb_pass',detail:item.detail,confidence:'single',stats,pointDelta:sample.delta,scoringRelevant:true};
    let evt=gameViewEventFromDelta(item);if(!evt)return null;
    const passerDelta=play==='tandem_td'?Number((yards*gvTestingScoreWeight('pass_yd',.04)+gvTestingScoreWeight('pass_td',6)).toFixed(2)):Number(sample.qbDelta??sample.delta);
    const receiverDelta=play==='tandem_td'?Number((gvTestingScoreWeight('rec',1)+yards*gvTestingScoreWeight('rec_yd',.1)+gvTestingScoreWeight('rec_td',6)).toFixed(2)):0;
    const impacts=[{rosterId:rid,playerId:passer.id,name:passer.name,pos:passerPos,role:'passer',delta:passerDelta}];
    if(play==='tandem_td'&&target)impacts.push({rosterId:rid,playerId:target.id,name:target.name,pos:receiverPos,role:'receiver',delta:receiverDelta});
    return {...evt,id:`forced-${play}-${rid}-${baseTime}`,type:'play',playType:'qb_pass',source:'testing',testingForced:true,
      multiActor:!!target,correlated:play==='tandem_td',simulatedTandem:play==='tandem_td',trickPlay,
      passerPlayerId:passer.id,passerName:passer.name,passerPos,passerNflTeam:passer.team,
      qbPlayerId:passer.id,qbName:passer.name,qbPos:passerPos,qbNflTeam:passer.team,
      ...(target?{receiverPlayerId:target.id,receiverName:target.name,receiverPos,receiverNflTeam:target.team}:{}),
      playerId:play==='tandem_td'&&target?target.id:passer.id,name:play==='tandem_td'&&target?target.name:passer.name,
      pos:play==='tandem_td'&&target?receiverPos:passerPos,nflTeam:target?.team||passer.team,detail:`${yards}-yard touchdown pass`,visualYards:yards,
      fantasyImpacts:impacts,delta:Number(play==='tandem_td'?(passerDelta+receiverDelta).toFixed(2):sample.delta)};
  }

  if(play==='rush_td'){
    const p=first('RB')||first('QB');if(!p)return null;
    const sample=gvTestingPlayValue('rush_td');
    let item=mk(p,`${sample.yards}-yard rushing touchdown`,sample.delta,p.pos==='QB'?'qb_run':'rb_run');
    item.intervalAnalysis={count:1,family:'rush',detail:item.detail,confidence:'single',stats:{rush_att:1,rush_yd:sample.yards,rush_td:1},pointDelta:sample.delta,scoringRelevant:true};
    let evt=gameViewEventFromDelta(item);
    return evt?{...evt,id:`forced-rush-td-${rid}-${baseTime}`,playType:p.pos==='QB'?'qb_run':'rb_run',source:'testing',testingForced:true,visualYards:sample.yards,detail:item.detail}:null;
  }

  if(play==='rec_td'){
    let recs=players.filter(p=>['WR','TE','RB'].includes(String(p.pos||'').toUpperCase()));
    if(['WR','TE','RB'].includes(requestedPos))recs=recs.filter(p=>String(p.pos||'').toUpperCase()===requestedPos);
    const p=recs[assignmentHash(`${rid}|${baseTime}|rec_td`)%Math.max(1,recs.length)];if(!p)return null;
    const sample=gvTestingPlayValue('rec_td');
    let item=mk(p,`${sample.yards}-yard touchdown reception`,sample.delta,'reception');
    item.intervalAnalysis={count:1,family:'reception',detail:item.detail,confidence:'single',stats:{rec:1,rec_yd:sample.yards,rec_td:1},pointDelta:sample.delta,scoringRelevant:true};
    let evt=gameViewEventFromDelta(item);
    return evt?{...evt,id:`forced-rec-td-${rid}-${baseTime}`,playType:'reception',source:'testing',testingForced:true,visualYards:sample.yards,detail:item.detail}:null;
  }

  if(play==='rb_run'){
    const p=first('RB');if(!p)return null;
    const sample=gvTestingPlayValue('rb_run');
    let evt=gameViewEventFromDelta(mk(p,`${sample.yards} rushing yards`,sample.delta,'rb_run'));
    return evt?{...evt,id:`forced-rb-${rid}-${baseTime}`,playType:'rb_run',source:'testing',testingForced:true}:null;
  }
  if(play==='qb_run'){
    const p=first('QB');if(!p)return null;
    const sample=gvTestingPlayValue('qb_run');
    let evt=gameViewEventFromDelta(mk(p,`${sample.yards} rushing yards`,sample.delta,'qb_run'));
    return evt?{...evt,id:`forced-qbrun-${rid}-${baseTime}`,playType:'qb_run',source:'testing',testingForced:true}:null;
  }
  if(play==='kick'||play==='kick_miss'){
    const p=first('K');if(!p)return null;const sample=gvTestingPlayValue(play),missed=play==='kick_miss',detail=`${sample.yards}-yard field goal${missed?' missed':''}`;
    let evt=gameViewEventFromDelta(mk(p,detail,sample.delta,'kick'));
    return evt?{...evt,id:`forced-${play}-${rid}-${baseTime}`,playType:'kick',source:'testing',testingForced:true,kickMissed:missed}:null;
  }
  if(play==='incomplete'){
    const qb=first('QB');if(!qb)return null;
    const recs=players.filter(p=>['WR','TE','RB'].includes(String(p.pos||'').toUpperCase()));
    const same=recs.filter(p=>p.team&&qb.team&&p.team===qb.team);
    const rec=(same.length?same:recs)[assignmentHash(`${rid}|${baseTime}|incomplete`)%Math.max(1,(same.length?same:recs).length)]||null;
    const item=mk(qb,'Incomplete pass',0,'incomplete');
    item.intervalAnalysis={count:1,family:'qb_pass',detail:'Incomplete pass',confidence:'single',stats:{pass_att:1,pass_cmp:0},pointDelta:0,scoringRelevant:false};
    let evt=gameViewEventFromDelta(item);if(!evt)return null;
    return {...evt,id:`forced-incomplete-${rid}-${baseTime}`,type:'play',playType:'incomplete',source:'testing',testingForced:true,
      multiActor:!!rec,qbPlayerId:qb.id,qbName:qb.name,qbPos:'QB',qbNflTeam:qb.team,
      ...(rec?{receiverPlayerId:rec.id,receiverName:rec.name,receiverPos:rec.pos||'WR',receiverNflTeam:rec.team}:{}),
      playerId:qb.id,name:qb.name,pos:'QB',nflTeam:qb.team,detail:'Incomplete pass'};
  }

  if(['def_pressure','def_sack','def_qb_hit','def_int','def_fumble','def_int_td','def_fum_td','def_kick_ret_td','def_punt_ret_td'].includes(play)){
    const p=first('DEF')||first('DST');if(!p)return null;
    const type=play==='def_pressure'?'def_breakup':play==='def_sack'?'def_sack':play==='def_qb_hit'?'def_qb_hit':play==='def_int'?'def_int':play==='def_int_td'?'def_int_td':play==='def_fum_td'?'def_fum_td':play==='def_kick_ret_td'?'def_kick_ret_td':play==='def_punt_ret_td'?'def_punt_ret_td':'def_fumble';
    const sample=gvTestingPlayValue(play),yards=Number(sample.yards||0),isInt=play==='def_int'||play==='def_int_td',isKickRet=play==='def_kick_ret_td',isPuntRet=play==='def_punt_ret_td',isTd=['def_int_td','def_fum_td','def_kick_ret_td','def_punt_ret_td'].includes(play);
    const detail=play==='def_pressure'?'Pass breakup':play==='def_sack'?'Quarterback sack':play==='def_qb_hit'?'Quarterback hit':isKickRet?`Kick return touchdown • ${yards} yards`:isPuntRet?`Punt return touchdown • ${yards} yards`:isInt?`Interception returned ${yards} yards${isTd?' for a touchdown':''}`:`Fumble recovery returned ${yards} yards${isTd?' for a touchdown':''}`;
    const statDelta=isKickRet?{kick_ret_yd:yards,def_st_td:1}:isPuntRet?{punt_ret_yd:yards,def_st_td:1}:isInt?{int:1,def_int_ret_yd:yards,...(isTd?{def_td:1}:{})}:play==='def_pressure'?{pass_def:1}:{...(play==='def_fumble'||play==='def_fum_td'?{fum_rec:1,fum_rec_yd:yards,...(isTd?{def_td:1}:{})}:{})};
    const family=isKickRet?'kick_return':isPuntRet?'punt_return':isInt?'def_interception':play==='def_pressure'?'def_breakup':(play==='def_fumble'||play==='def_fum_td'?'def_fumble':'defense');
    let item=mk(p,detail,sample.delta,type);item.intervalAnalysis={count:1,family,detail,confidence:'single',stats:statDelta,pointDelta:sample.delta,scoringRelevant:true};
    let evt=gameViewEventFromDelta(item);
    return evt?{...evt,id:`forced-${play}-${rid}-${baseTime}`,playType:type,source:'testing',testingForced:true,pos:p.pos||'DEF',visualYards:yards,turnoverKind:isInt?'interception':((play==='def_fumble'||play==='def_fum_td')?'fumble':null),specialTeamsReturn:isKickRet?'kickoff':(isPuntRet?'punt':null)}:null;
  }

  const preferred=[
    ...players.filter(p=>String(p.pos||'').toUpperCase()==='RB'),
    ...players.filter(p=>['WR','TE'].includes(String(p.pos||'').toUpperCase())),
    ...players.filter(p=>String(p.pos||'').toUpperCase()==='QB'),
    ...players.filter(p=>String(p.pos||'').toUpperCase()==='K'),
    ...players
  ];
  const p=preferred[assignmentHash(`${rid}|${baseTime}|single`)%preferred.length];
  const pos=String(p.pos||'').toUpperCase();
  let detail='8 fantasy points',delta=2.4,playType='generic';
  if(pos==='RB'){detail='15 rushing yards';delta=1.5;playType='rb_run'}
  else if(pos==='WR'||pos==='TE'){detail='15-yard reception';delta=2.5;playType='reception'}
  else if(pos==='QB'){detail='22 passing yards';delta=.88;playType='qb_pass'}
  else if(pos==='K'){detail='42-yard field goal';delta=4;playType='kick'}
  else if(pos==='DEF'||pos==='DST'){detail='Quarterback sack';delta=1;playType='def_sack'}
  let evt=gameViewEventFromDelta(mk(p,detail,delta,playType));
  return evt?{...evt,id:`forced-random-${rid}-${baseTime}`,source:'testing',testingForced:true,playType}:null;
}
const GV_TEST_PLAY_OPTIONS={
  QB:[['qb_run','QB Run'],['pass','Pass / Reception'],['qb_td','QB Pass TD'],['incomplete','Incomplete Pass']],
  RB:[['rb_run','RB Run'],['pass','Reception'],['rb_rec_fumble','Catch → Fumble'],['rb_rush_fumble','Rush → Fumble'],['rush_td','Rush TD'],['rec_td','Reception TD']],
  WR:[['pass','Reception'],['wr_rec_fumble','Catch → Fumble'],['wr_rush_fumble','Rush → Fumble'],['rec_td','Reception TD']],
  TE:[['pass','Reception'],['rec_td','Reception TD']],
  K:[['kick','Made Field Goal'],['kick_miss','Missed Field Goal']],
  DEF:[['def_pressure','Pass Breakup'],['def_sack','Sack'],['def_qb_hit','QB Hit'],['def_int','Interception Return'],['def_int_td','Pick Six'],['def_fumble','Fumble Recovery Return'],['def_fum_td','Scoop & Score'],['def_kick_ret_td','Kick Return TD'],['def_punt_ret_td','Punt Return TD']],
  TANDEM:[['tandem','Pass / Reception'],['tandem_td','Passing TD']]
};
const TESTING_DELTA_PLAY_OPTIONS={
  QB:[['qb_run','QB Run'],['qb_pass','Pass'],['qb_pass_td','Pass TD'],['qb_rush_td','Rush TD'],['qb_interception','Interception']],
  RB:[['rb_run','Rush'],['rb_rush_td','Rush TD'],['rb_reception','Reception'],['rb_rec_td','Reception TD'],['rb_rec_fumble','Catch → Fumble'],['rb_rush_fumble','Rush → Fumble']],
  WR:[['wr_reception','Reception'],['wr_rec_td','Reception TD'],['wr_rec_fumble','Catch → Fumble'],['wr_rush','Rush'],['wr_rush_td','Rush TD'],['wr_rush_fumble','Rush → Fumble']],
  TE:[['te_reception','Reception'],['te_rec_td','Reception TD']],
  K:[['field_goal','Made Field Goal'],['field_goal_miss','Missed Field Goal']],
  DEF:[['def_sack','Sack'],['def_int','Interception Return'],['def_int_td','Pick Six'],['def_fumble','Fumble Recovery Return'],['def_fum_td','Scoop & Score'],['def_kick_ret_td','Kick Return TD'],['def_punt_ret_td','Punt Return TD']],
  TANDEM:[['tandem_pass','Pass / Reception'],['tandem_td','Passing TD']]
};
const testingDeltaArrivalQueue=[];
let testingDeltaArrivalTimer=null;
let testingDeltaQueueSerial=0;
let testingDeltaNextDelayMs=0;

function testingRosterPlayersForSide(side){
  const ids=gvSelectedAndOpponentRosterIds?.()||{};
  const rid=String(side==='opp'?(ids.opp||''):(ids.mine||''));
  return {rid,players:rid?gvRosterPlayersForTest(rid):[]};
}
function testingOffensivePairOptions(side,selectId,otherId=''){
  const sel=$('#'+selectId);if(!sel)return;
  const {players}=testingRosterPlayersForSide(side);
  const list=players.filter(p=>['QB','RB','WR','TE'].includes(String(p.pos||'').toUpperCase()));
  const prior=String(sel.value||'');
  sel.innerHTML=list.map(p=>`<option value="${esc(p.id)}">${esc(p.name)} (${esc(String(p.pos||'').toUpperCase())})</option>`).join('');
  if(list.some(p=>String(p.id)===prior))sel.value=prior;
  if(otherId&&sel.value===String($('#'+otherId)?.value||'')&&list.length>1){
    const alt=list.find(p=>String(p.id)!==String($('#'+otherId)?.value||''));if(alt)sel.value=String(alt.id);
  }
}
function testingPopulateTandemPair(kind='play'){
  const isDelta=kind==='delta';
  const side=$(`#testing${isDelta?'Delta':'Play'}TeamSelect`)?.value||'mine';
  const passerId=`testing${isDelta?'Delta':'Play'}TandemPasser`,receiverId=`testing${isDelta?'Delta':'Play'}TandemReceiver`;
  testingOffensivePairOptions(side,passerId,receiverId);
  testingOffensivePairOptions(side,receiverId,passerId);
  const passer=$('#'+passerId),receiver=$('#'+receiverId);
  if(passer&&receiver&&passer.value===receiver.value&&receiver.options.length>1)receiver.selectedIndex=1;
}
function gvTestingPopulateSimplePlaySelect(){
  const pos=$('#testingPlayPositionSelect')?.value||'QB',sel=$('#testingPlaySelect');if(!sel)return;
  const prior=sel.value,items=GV_TEST_PLAY_OPTIONS[pos]||[];
  sel.innerHTML=items.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  if(items.some(([v])=>v===prior))sel.value=prior;
  const tandem=pos==='TANDEM';
  const pair=$('#testingPlayTandemPair');if(pair)pair.hidden=!tandem;
  if(tandem)testingPopulateTandemPair('play');
  gvTestingUpdateSimplePlaySummary();
}
function gvTestingUpdateSimplePlaySummary(){
  const team=$('#testingPlayTeamSelect')?.selectedOptions?.[0]?.textContent||'Team';
  const pos=$('#testingPlayPositionSelect')?.value||'';
  const play=$('#testingPlaySelect')?.selectedOptions?.[0]?.textContent||'Play';
  let extra='';
  if(pos==='TANDEM'){
    const passer=$('#testingPlayTandemPasser')?.selectedOptions?.[0]?.textContent||'Passer';
    const receiver=$('#testingPlayTandemReceiver')?.selectedOptions?.[0]?.textContent||'Receiver';
    extra=` • ${passer} → ${receiver}`;
  }
  const el=$('#testingPlaySummary');if(el)el.textContent=`${team} • ${pos==='TANDEM'?'Tandem':pos} • ${play}${extra}`;
}
function gvTestingRunSimplePlay(){
  const side=$('#testingPlayTeamSelect')?.value||'mine',play=$('#testingPlaySelect')?.value||'qb_run',position=$('#testingPlayPositionSelect')?.value||'';
  const opts=position==='TANDEM'?{
    tandemPasserId:$('#testingPlayTandemPasser')?.value||'',
    tandemReceiverId:$('#testingPlayTandemReceiver')?.value||''
  }:{};
  gvRunForcedTest(side,play,position,opts);
}
function testingDeltaValueConfig(play){
  const ranges=(...xs)=>xs;
  if(['qb_run','rb_run','wr_rush','rb_rush_fumble','wr_rush_fumble'].includes(play))return {label:'Rush yards',ranges:ranges([1,5],[8,20],[25,45],[50,75])};
  if(['qb_rush_td','rb_rush_td','wr_rush_td'].includes(play))return {label:'TD rush yards',ranges:ranges([1,4],[7,18],[22,45],[50,85])};
  if(['qb_pass','rb_reception','wr_reception','te_reception','tandem_pass'].includes(play))return {label:'Yards',ranges:ranges([3,8],[12,25],[30,55],[60,85])};
  if(['qb_pass_td','rb_rec_td','wr_rec_td','te_rec_td','tandem_td'].includes(play))return {label:'TD yards',ranges:ranges([2,6],[10,24],[30,55],[60,90])};
  if(['rb_rec_fumble','wr_rec_fumble','te_rec_fumble'].includes(play))return {label:'Catch yards before fumble',ranges:ranges([2,6],[8,18],[22,40],[45,70])};
  if(['field_goal','field_goal_miss'].includes(play))return {label:'Kick distance',suffix:' yd',ranges:ranges([20,29],[30,39],[40,49],[50,64])};
  if(['def_int','def_fumble'].includes(play))return {label:'Return yards',ranges:ranges([0,5],[10,25],[30,55],[60,85])};
  if(['def_int_td','def_fum_td'].includes(play))return {label:'TD return yards',ranges:ranges([20,35],[36,55],[56,75],[76,100])};
  if(play==='def_kick_ret_td')return {label:'Kick return yards',ranges:ranges([75,85],[86,95],[96,105],[106,110])};
  if(play==='def_punt_ret_td')return {label:'Punt return yards',ranges:ranges([35,50],[51,65],[66,80],[81,95])};
  return null;
}
function testingRandomValueFromRange([a,b]){return gvTestingRandomInt(a,b)}
function testingPopulateDeltaValueSelect(force=true){
  const play=$('#testingDeltaPlaySelect')?.value||'',cfg=testingDeltaValueConfig(play),wrap=$('#testingDeltaValueWrap'),sel=$('#testingDeltaValueSelect'),label=$('#testingDeltaValueLabel');
  if(!wrap||!sel)return;
  wrap.hidden=!cfg;
  if(!cfg){sel.innerHTML='';return}
  if(label)label.textContent=cfg.label;
  const prior=Number(sel.value),values=cfg.ranges.map(testingRandomValueFromRange);
  const uniq=[...new Set(values)];while(uniq.length<4)uniq.push(uniq.at(-1)+1);
  uniq.sort((a,b)=>a-b);
  sel.innerHTML=uniq.map(v=>`<option value="${v}">${v}${cfg.suffix||' yards'}</option>`).join('');
  if(!force&&uniq.includes(prior))sel.value=String(prior);
}
function testingPopulateDeltaPlaySelect(){
  const pos=$('#testingDeltaPositionSelect')?.value||'QB',sel=$('#testingDeltaPlaySelect');if(!sel)return;
  const prior=sel.value,items=TESTING_DELTA_PLAY_OPTIONS[pos]||[];
  sel.innerHTML=items.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  if(items.some(([v])=>v===prior))sel.value=prior;
  const tandem=pos==='TANDEM';
  const pair=$('#testingDeltaTandemPair');if(pair)pair.hidden=!tandem;
  if(tandem)testingPopulateTandemPair('delta');
  testingPopulateDeltaValueSelect(true);
  testingUpdateQuickDeltaSummary();
}
function testingQuickScore(stats){
  const fallbacks={rush_yd:.1,rec_yd:.1,rec:1,pass_yd:.04,rush_td:6,rec_td:6,pass_td:6,pass_int:-2,fum_lost:-2,
    fgm:3,fgm_0_19:0,fgm_20_29:0,fgm_30_39:0,fgm_40_49:1,fgm_50p:2,fgmiss:-1,
    sack:1,int:2,fum_rec:2,def_td:6,def_st_td:6,def_int_ret_yd:0,fum_rec_yd:0,kick_ret_yd:0,punt_ret_yd:0};
  let total=0;
  for(const [key,val] of Object.entries(stats||{})){
    if(['rush_att','pass_att','pass_cmp'].includes(key))continue;
    total+=Number(val||0)*gvTestingScoreWeight(key,fallbacks[key]??0);
  }
  return Number(total.toFixed(2));
}
function testingDeltaPlayerForPosition(side,pos){
  const {rid,players}=testingRosterPlayersForSide(side);
  const want=String(pos||'').toUpperCase();
  const p=players.find(x=>String(x.pos||'').toUpperCase()===want)||null;
  return {rid,player:p};
}
function testingBuildQuickDeltaSpec(allocateId=true){
  return {
    id:allocateId?++testingDeltaQueueSerial:testingDeltaQueueSerial+1,
    side:$('#testingDeltaTeamSelect')?.value||'mine',
    position:$('#testingDeltaPositionSelect')?.value||'QB',
    play:$('#testingDeltaPlaySelect')?.value||'qb_run',
    value:Number($('#testingDeltaValueSelect')?.value||0),
    passerId:$('#testingDeltaTandemPasser')?.value||'',
    receiverId:$('#testingDeltaTandemReceiver')?.value||'',
    queuedAt:Date.now()
  };
}
function testingQuickDeltaStats(spec){
  const y=Number(spec.value||0),p=spec.play;
  if(p==='qb_run')return [{role:'QB',stats:{rush_att:1,rush_yd:y}}];
  if(p==='qb_pass')return [{role:'QB',stats:{pass_att:1,pass_cmp:1,pass_yd:y}}];
  if(p==='qb_pass_td')return [{role:'QB',stats:{pass_att:1,pass_cmp:1,pass_yd:y,pass_td:1}}];
  if(p==='qb_rush_td')return [{role:'QB',stats:{rush_att:1,rush_yd:y,rush_td:1}}];
  if(p==='qb_interception')return [{role:'QB',stats:{pass_att:1,pass_cmp:0,pass_int:1}}];
  if(p==='rb_run')return [{role:'RB',stats:{rush_att:1,rush_yd:y}}];
  if(p==='rb_rush_td')return [{role:'RB',stats:{rush_att:1,rush_yd:y,rush_td:1}}];
  if(p==='rb_reception')return [{role:'RB',stats:{rec:1,rec_yd:y}}];
  if(p==='rb_rec_td')return [{role:'RB',stats:{rec:1,rec_yd:y,rec_td:1}}];
  if(p==='rb_rec_fumble')return [{role:'RB',stats:{rec:1,rec_yd:y,fum_lost:1}}];
  if(p==='rb_rush_fumble')return [{role:'RB',stats:{rush_att:1,rush_yd:y,fum_lost:1}}];
  if(p==='wr_reception')return [{role:'WR',stats:{rec:1,rec_yd:y}}];
  if(p==='wr_rec_td')return [{role:'WR',stats:{rec:1,rec_yd:y,rec_td:1}}];
  if(p==='wr_rec_fumble')return [{role:'WR',stats:{rec:1,rec_yd:y,fum_lost:1}}];
  if(p==='wr_rush')return [{role:'WR',stats:{rush_att:1,rush_yd:y}}];
  if(p==='wr_rush_td')return [{role:'WR',stats:{rush_att:1,rush_yd:y,rush_td:1}}];
  if(p==='wr_rush_fumble')return [{role:'WR',stats:{rush_att:1,rush_yd:y,fum_lost:1}}];
  if(p==='te_reception')return [{role:'TE',stats:{rec:1,rec_yd:y}}];
  if(p==='te_rec_td')return [{role:'TE',stats:{rec:1,rec_yd:y,rec_td:1}}];
  if(p==='field_goal'||p==='field_goal_miss'){
    if(p==='field_goal_miss')return [{role:'K',stats:{fgmiss:1},detail:`${y}-yard field goal missed`}];
    const band=y>=50?'fgm_50p':y>=40?'fgm_40_49':y>=30?'fgm_30_39':y>=20?'fgm_20_29':'fgm_0_19';
    return [{role:'K',stats:{fgm:1,[band]:1},detail:`${y}-yard field goal`}];
  }
  if(p==='def_sack')return [{role:'DEF',stats:{sack:1}}];
  if(p==='def_int')return [{role:'DEF',stats:{int:1,def_int_ret_yd:y}}];
  if(p==='def_int_td')return [{role:'DEF',stats:{int:1,def_int_ret_yd:y,def_td:1}}];
  if(p==='def_fumble')return [{role:'DEF',stats:{fum_rec:1,fum_rec_yd:y}}];
  if(p==='def_fum_td')return [{role:'DEF',stats:{fum_rec:1,fum_rec_yd:y,def_td:1}}];
  if(p==='def_kick_ret_td')return [{role:'DEF',stats:{kick_ret_yd:y,def_st_td:1}}];
  if(p==='def_punt_ret_td')return [{role:'DEF',stats:{punt_ret_yd:y,def_st_td:1}}];
  if(p==='tandem_pass'||p==='tandem_td'){
    return [{role:'PASSER',playerId:spec.passerId,stats:{pass_att:1,pass_cmp:1,pass_yd:y,...(p==='tandem_td'?{pass_td:1}:{})},forceTeam:'TANDEM'},
      {role:'RECEIVER',playerId:spec.receiverId,stats:{rec:1,rec_yd:y,...(p==='tandem_td'?{rec_td:1}:{})},forceTeam:'TANDEM'}];
  }
  return [];
}
function testingBuildQuickDeltaEvents(spec){
  const {rid,players}=testingRosterPlayersForSide(spec.side),now=testingSequenceTime(),events=[],warnings=[];
  if(!rid)return {events:[],warnings:['No selected matchup roster was available.']};
  const components=testingQuickDeltaStats(spec);
  const byId=id=>players.find(p=>String(p.id)===String(id));
  for(const c of components){
    let player=c.playerId?byId(c.playerId):players.find(p=>{
      const pos=String(p.pos||'').toUpperCase();return c.role==='DEF'?['DEF','DST'].includes(pos):pos===c.role;
    });
    if(!player){warnings.push(`No rostered ${c.role} player could be resolved.`);continue}
    const stats=c.stats||{},delta=testingQuickScore(stats),analysis=gvIntervalPlayAnalysis(player.id,player.pos,stats,delta),colors=nflTeamColors(player.team);
    const forcedTeam=c.forceTeam?`TEST-${rid}-${spec.id}`:(player.team||'FA');
    if(c.detail)analysis.detail=c.detail;
    events.push({
      id:`api-queued-${spec.id}-${now}-${player.id}-${c.role}`,time:now,rosterId:rid,playerId:String(player.id),name:player.name,pos:player.pos||'—',nflTeam:forcedTeam,
      teamPrimary:colors[0],teamSecondary:colors[1],delta,total:delta,leftScore:0,rightScore:0,detail:analysis.detail,intervalAnalysis:analysis,
      visualYards:Number(stats.rec_yd??stats.rush_yd??stats.pass_yd??stats.def_int_ret_yd??stats.fum_rec_yd??stats.kick_ret_yd??stats.punt_ret_yd??spec.value??0),
      type:analysis.confidence==='single'?'play':analysis.confidence==='burst'?'burst':'summary',intervalClass:analysis.confidence==='single'?'SINGLE_PLAY':analysis.confidence==='burst'?'MULTI_PLAY_BURST':'AMBIGUOUS_SUMMARY',
      source:'testing',testingForced:true,played:false,queuedApiSimulation:true
    });
  }
  if(components.some(c=>c.forceTeam))warnings.push('Tandem quick mode supplies matching synthetic NFL-team evidence so the correlation path can be tested with any selected offensive pair.');
  return {events,warnings};
}
function testingDescribeQuickDelta(spec){
  const play=TESTING_DELTA_PLAY_OPTIONS[spec.position]?.find(([v])=>v===spec.play)?.[1]||spec.play;
  const valueCfg=testingDeltaValueConfig(spec.play),value=valueCfg?`${spec.value} ${valueCfg.label.toLowerCase()}`:'';
  const comps=testingQuickDeltaStats(spec),points=comps.map(c=>testingQuickScore(c.stats));
  const total=Number(points.reduce((a,b)=>a+b,0).toFixed(2));
  return `${play}${value?` • ${value}`:''} • ${total>=0?'+':''}${total.toFixed(2)} FPTS${points.length>1?` across ${points.length} correlated players`:''}`;
}
function testingUpdateQuickDeltaSummary(){
  const spec=testingBuildQuickDeltaSpec(false);
  const team=$('#testingDeltaTeamSelect')?.selectedOptions?.[0]?.textContent||'Team';
  let pair='';
  if(spec.position==='TANDEM'){
    const a=$('#testingDeltaTandemPasser')?.selectedOptions?.[0]?.textContent||'Passer',b=$('#testingDeltaTandemReceiver')?.selectedOptions?.[0]?.textContent||'Receiver';pair=` • ${a} → ${b}`;
  }
  const el=$('#testingDeltaQuickSummary');if(el)el.textContent=`${team} • ${testingDescribeQuickDelta(spec)}${pair}`;
}
function testingRenderDeltaQueueStatus(message=''){
  const el=$('#testingDeltaQueueStatus');if(!el)return;
  if(message){el.textContent=message;return}
  if(!testingDeltaArrivalQueue.length&&!testingDeltaArrivalTimer){el.textContent='API queue empty. Run Delta to schedule a synthetic poll arrival.';return}
  const waiting=testingDeltaArrivalQueue.length;
  el.textContent=`API queue • ${waiting} waiting${testingDeltaArrivalTimer?` • next synthetic poll in ~${(testingDeltaNextDelayMs/1000).toFixed(1)}s`:''}`;
}
function testingScheduleNextDeltaArrival(){
  if(testingDeltaArrivalTimer||!testingDeltaArrivalQueue.length)return;
  testingDeltaNextDelayMs=gvTestingRandomInt(2200,4200);
  testingRenderDeltaQueueStatus();
  testingDeltaArrivalTimer=setTimeout(()=>{
    testingDeltaArrivalTimer=null;
    const spec=testingDeltaArrivalQueue.shift();
    if(spec){
      const built=testingBuildQuickDeltaEvents(spec);
      testingRenderDeltaQueueStatus(`Synthetic API poll arrived • ${testingDescribeQuickDelta(spec)}`);
      testingReconcileSyntheticDeltas(built);
      testingAdvancePoll();
    }
    if(testingDeltaArrivalQueue.length){setTimeout(()=>{testingRenderDeltaQueueStatus();testingScheduleNextDeltaArrival()},180)}
    else setTimeout(()=>testingRenderDeltaQueueStatus(),1400);
  },testingDeltaNextDelayMs);
}
function testingRunQuickDelta(){
  const spec=testingBuildQuickDeltaSpec();
  if(spec.position==='TANDEM'&&(!spec.passerId||!spec.receiverId||spec.passerId===spec.receiverId)){
    testingRenderDeltaQueueStatus('Choose two different offensive players for the tandem delta.');return;
  }
  testingDeltaArrivalQueue.push(spec);
  testingRenderDeltaQueueStatus(`Queued API delta #${spec.id} • ${testingDescribeQuickDelta(spec)}`);
  testingScheduleNextDeltaArrival();
}
function testingSyncSimpleTeamLabels(){
  const ids=gvSelectedAndOpponentRosterIds?.()||{};
  const labels={mine:ids.mine?gvRosterLabelById(ids.mine):'My Team',opp:ids.opp?gvRosterLabelById(ids.opp):'Opponent'};
  for(const id of ['testingPlayTeamSelect','testingDeltaTeamSelect']){
    const el=$('#'+id);if(!el)continue;
    const mine=el.querySelector('option[value="mine"]'),opp=el.querySelector('option[value="opp"]');
    if(mine)mine.textContent=labels.mine||'My Team';if(opp)opp.textContent=labels.opp||'Opponent';
  }
}
function testingInitSimpleControls(){
  testingSyncSimpleTeamLabels();gvTestingPopulateSimplePlaySelect();testingPopulateDeltaPlaySelect();testingRenderDeltaQueueStatus();
}

function gvSelectedAndOpponentRosterIds(){
  const pair=chosenPair?.();if(!pair)return {mine:null,opp:null};
  const selected=String($('#teamSelect')?.value||'');
  const ids=(pair.rows||[]).map(r=>String(r.roster_id));
  const mine=ids.includes(selected)?selected:ids[0]||null;
  const opp=ids.find(id=>id!==mine)||null;
  return {mine,opp};
}

function gvRosterLabelById(rid){
  const r=rosterFor(rid);if(!r)return String(rid||'—');
  const u=owner(r);return teamName(r)||u?.display_name||u?.username||String(rid);
}
function gvTestDiagnostics(evt){
  if(!evt)return null;
  const f=gvFormation(evt),offenseX=(f?.offense||[]).map(u=>Number(u.x)).filter(Number.isFinite);
  const startCorrect=offenseX.length
    ? offenseX.filter(x=>f.own?x<=f.los+.05:x>=f.los-.05).length/offenseX.length>=.9
    : false;
  return {
    roster:gvRosterLabelById(evt.rosterId),
    player:evt.multiActor&&evt.qbName&&evt.receiverName?`${evt.qbName} → ${evt.receiverName}`:(evt.name||'—'),
    playType:evt.playType||gvPlayType(evt)||'—',
    fieldSide:f?.fieldSide||gvEventFieldSide(evt),
    direction:f?.dir===1?'Right →':f?.dir===-1?'← Left':'—',
    los:Number.isFinite(Number(f?.los))?Number(f.los).toFixed(0):'—',
    startCorrect,
    formationCorrect:gvFormationOrientationOk(f)
  };
}
function gvRenderTestDiagnostics(evt){
  const d=gvTestDiagnostics(evt);if(!d)return;
  const set=(id,val,ok)=>{
    const el=$(id);if(!el)return;el.textContent=val;
    el.classList.remove('diag-pass','diag-fail');
    if(typeof ok==='boolean')el.classList.add(ok?'diag-pass':'diag-fail');
  };
  set('#diagRoster',d.roster);
  set('#diagPlayer',d.player);
  set('#diagPlayType',d.playType);
  set('#diagFieldSide',d.fieldSide==='left'?'LEFT / My Team':'RIGHT / Opponent');
  set('#diagDirection',d.direction);
  set('#diagLos',d.los);
  set('#diagStartCheck',d.startCorrect?'PASS':'FAIL',d.startCorrect);
  set('#diagFormationCheck',d.formationCorrect?'PASS':'FAIL',d.formationCorrect);
  const st=$('#testingDiagStatus');
  if(st){
    const ok=d.startCorrect&&d.formationCorrect;
    st.textContent=ok?'Orientation checks passed':'Orientation problem detected';
    st.classList.remove('diag-pass','diag-fail');
    st.classList.add(ok?'diag-pass':'diag-fail');
  }
}

function gvScrollTestingFieldIntoView(){
  const card=$('#testingGameViewMount')?.closest('.testing-field-card')||$('#testingGameViewMount');
  if(!card)return;
  requestAnimationFrame(()=>{
    try{card.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'})}catch(e){card.scrollIntoView()}
  });
}
function gvRunForcedTest(side,play='random',position='',extraOpts={}){
  const {mine,opp}=gvSelectedAndOpponentRosterIds(),rid=side==='mine'?mine:opp;
  const builtEvt=gvTestEventForRoster(rid,{play,position,...extraOpts});
  const evt=gvNormalizeEventSource(builtEvt,'testing');
  if(!evt){
    const status=$('#testingStatus');
    const label=play==='tandem'?'same-NFL-team QB/receiver tandem':play.replaceAll('_',' ');
    if(status)status.textContent=`Unable to build ${label} test for that roster.`;
    return;
  }
  // v0.4.38: switching/refreshing Testing Area used to clear the live field
  // while the first async play was still running, which stranded playback.
  if(currentView!=='testing')setView('testing');
  else gvMountFieldForTesting();
  gvRenderTestDiagnostics(evt);
  if($('#testFieldStatus'))$('#testFieldStatus').textContent=`Forced ${play.replaceAll('_',' ')} • ${side==='mine'?'My Team':'Opponent'}`;
  if(gameViewSession?.feed&&!gameViewSession.feed.some(e=>e.id===evt.id)){
    gameViewSession.feed.unshift({...evt,source:'testing',testingForced:true});
    if(gameViewSession.feed.length>250)gameViewSession.feed.length=250;
    if(typeof saveGameViewSession==='function')saveGameViewSession();
    renderGameViewFeed();
  }
  // Preserve FIFO order for rapid tests. If a play is active, the next waits
  // naturally and starts when the current play completes.
  gameViewQueue.push(evt);
  gvScrollTestingFieldIntoView();
  if(!gameViewPlaying)playNextGameViewEvent();
}


function testingDeltaRosterPlayers(){
  const ids=[...testingRosteredPlayerIds()];
  return ids.map(id=>({id:String(id),...playerInfo(id)})).filter(p=>p.name);
}
function testingDeltaActiveRosterId(){
  const side=$('#testingDeltaTeamSelect')?.value||'mine';
  const ids=gvSelectedAndOpponentRosterIds?.()||{};
  return String(side==='opp'?(ids.opp||''):(ids.mine||$('#teamSelect')?.value||''));
}
function testingPopulateDeltaPlayers(){
  const rosterPlayers=testingDeltaRosterPlayers();
  const byId=new Map(rosterPlayers.map(p=>[String(p.id),p]));
  const currentRosterId=testingDeltaActiveRosterId();
  const selectedRoster=rosterFor(currentRosterId);
  const selectedIds=new Set((selectedRoster?.players||[]).map(String));
  const teamPlayers=rosterPlayers.filter(p=>selectedIds.has(String(p.id)));

  const optionsFor=(allowed,priority)=>{
    const rank=p=>{const pos=String(p.pos||'').toUpperCase(),i=priority.indexOf(pos);return i<0?99:i};
    const list=teamPlayers.filter(p=>allowed.includes(String(p.pos||'').toUpperCase()));
    return `<option value="">Select player…</option>`+list
      .sort((a,b)=>rank(a)-rank(b)||String(a.name).localeCompare(String(b.name)))
      .map(p=>`<option value="${esc(p.id)}">${esc(p.name)} (${esc(p.pos)})${p.team?` • ${esc(p.team)}`:''}</option>`).join('');
  };

  const rush=$('#testingRushPlayer'),rec=$('#testingRecPlayer'),pass=$('#testingPassPlayer');
  const prior={rush:rush?.value||'',rec:rec?.value||'',pass:pass?.value||''};
  const firstEligible=(allowed,priority)=>{
    const rank=p=>{const pos=String(p.pos||'').toUpperCase(),i=priority.indexOf(pos);return i<0?99:i};
    return teamPlayers.filter(p=>allowed.includes(String(p.pos||'').toUpperCase())).sort((a,b)=>rank(a)-rank(b)||String(a.name).localeCompare(String(b.name)))[0];
  };
  if(rush){
    rush.innerHTML=optionsFor(['RB','QB','WR'],['RB','QB','WR']);
    if(byId.has(prior.rush)&&selectedIds.has(prior.rush))rush.value=prior.rush;
    else rush.value=String(firstEligible(['RB','QB','WR'],['RB','QB','WR'])?.id||'');
  }
  if(rec){
    rec.innerHTML=optionsFor(['WR','TE','RB','QB'],['WR','TE','RB','QB']);
    if(byId.has(prior.rec)&&selectedIds.has(prior.rec))rec.value=prior.rec;
    else rec.value=String(firstEligible(['WR','TE','RB','QB'],['WR','TE','RB','QB'])?.id||'');
  }
  if(pass){
    pass.innerHTML=optionsFor(['QB','RB','WR','TE','K'],['QB','RB','WR','TE','K']);
    if(byId.has(prior.pass)&&selectedIds.has(prior.pass))pass.value=prior.pass;
    else pass.value=String(firstEligible(['QB','RB','WR','TE','K'],['QB','RB','WR','TE','K'])?.id||'');
  }
}
function testingResolveDeltaPlayer(value,preferredPositions=[]){
  const raw=String(value||'').trim();
  if(!raw)return null;
  const players=testingDeltaRosterPlayers();
  const byId=players.find(p=>String(p.id)===raw);
  if(byId)return byId;
  const lower=raw.toLowerCase();
  const exact=players.find(p=>String(p.name||'').toLowerCase()===lower);
  if(exact)return exact;
  const preferred=players.find(p=>preferredPositions.includes(String(p.pos||'').toUpperCase())&&String(p.name||'').toLowerCase().includes(lower));
  return preferred||players.find(p=>String(p.name||'').toLowerCase().includes(lower))||null;
}
function testingDeltaRosterIdForPlayer(pid){
  const pair=chosenPair?.();if(!pair)return null;
  for(const row of pair.rows||[]){
    const r=rosterFor(row.roster_id);
    if((r?.players||[]).map(String).includes(String(pid)))return String(row.roster_id);
  }
  return null;
}
function testingSyntheticFantasyDelta(stats){
  const d=stats||{};
  return Number((
    Number(d.rush_yd||0)*.1+Number(d.rec_yd||0)*.1+Number(d.rec||0)*1+
    Number(d.pass_yd||0)*.04+
    Number(d.rush_td||0)*6+Number(d.rec_td||0)*6+Number(d.pass_td||0)*6-
    Number(d.pass_int||0)*2-Number(d.fum_lost||0)*2
  ).toFixed(2));
}

function testingSequenceTime(){
  return testingSequenceBaseTime+testingPollOffsetMs;
}
function testingSequenceStateReset(){
  testingPollSequence.length=0;
  testingPollNumber=1;
  testingPollOffsetMs=0;
  testingSequenceBaseTime=Date.now();
  testingSequenceTdCandidates.length=0;
  testingSequenceConsumedTdKeys.clear();
  testingSequenceTurnoverCandidates.length=0;
  testingSequenceConsumedTurnoverKeys.clear();
  gvTestingPendingTdState.pending.length=0;
  testingClearSyntheticReconciliationState();
  renderTestingSequenceHistory();
}
function testingAdvancePoll(){
  testingPollNumber+=1;
  testingPollOffsetMs+=15000;
  testingRefreshLifecycleHistory();
  renderTestingSequenceHistory();
}
function renderTestingSequenceHistory(){
  const strip=$('#testingSequenceStrip'),host=$('#testingSequenceHistory');
  const now=testingSequenceTime();
  const waitingTurnovers=testingSequenceTurnoverCandidates.filter(x=>
    !testingSequenceConsumedTurnoverKeys.has(x.key) &&
    now-Number(x.time||0)<=GV_TURNOVER_CORRELATION_MS
  ).length;
  if(strip)strip.innerHTML=`<span><b>Sequence:</b> Poll ${testingPollNumber} • T+${Math.round(testingPollOffsetMs/1000)}s • Pending TDs: ${gvTestingPendingTdState.pending.length} • Pending turnovers: ${waitingTurnovers} • NFL Opponents: ${Object.keys(gameViewNflOpponentMap).length?Object.keys(gameViewNflOpponentMap).length/2+' games':'unavailable'}</span>`;
  if(!host)return;
  if(!testingPollSequence.length){
    host.innerHTML='';
    return;
  }
  host.innerHTML=testingPollSequence.slice().reverse().map(p=>`
    <div class="testing-poll-card">
      <b>Poll ${p.pollNumber} • T+${Math.round(p.offsetMs/1000)}s</b>
      <small>${esc(p.summary||'No summary')}</small>
      ${p.lifecycle?.length?`<div class="testing-lifecycle">${p.lifecycle.map(x=>{
        const cls=x.includes('MATCHED')?'matched':x.includes('EXPIRED')?'expired':x.includes('WAITING')?'held':'held';
        return `<span class="${cls}">${esc(x)}</span>`;
      }).join('')}</div>`:''}
    </div>`).join('');
}

function testingLifecycleKey(evt){
  const stats=evt?.intervalAnalysis?.stats||{};
  const kind=Number(stats.pass_td||0)>0?'pass_td':Number(stats.rec_td||0)>0?'rec_td':'event';
  return `${evt.rosterId}|${evt.playerId}|${kind}|${evt.nflTeam||''}|${evt.time||0}`;
}
function testingDescribeLifecycle(raw,reconciled,asOf=testingSequenceTime()){
  const statuses=[];
  const pendingTdKeys=new Set((gvTestingPendingTdState.pending||[]).map(p=>p.key));

  for(const evt of raw||[]){
    if(gvTdCouldBeTandemHalf(evt)){
      const pendingKey=gvPendingTdKey(evt);
      const candidateKey=gvTdCandidateKey(evt);
      const age=Math.max(0,Number(asOf||0)-Number(evt.time||0));
      if(pendingTdKeys.has(pendingKey)){
        statuses.push(`${evt.name}: HELD`);
      }else if(testingSequenceConsumedTdKeys.has(candidateKey)){
        statuses.push(`${evt.name}: MATCHED`);
      }else if(age>=GV_PENDING_TD_MAX_MS){
        statuses.push(`${evt.name}: EXPIRED / RELEASED`);
      }
    }

    if(gvIsOffensiveTurnoverEvent(evt)||gvIsDefensiveTurnoverEvent(evt)){
      const key=gvTurnoverCandidateKey(evt);
      const age=Math.max(0,Number(asOf||0)-Number(evt.time||0));
      if(testingSequenceConsumedTurnoverKeys.has(key)){
        statuses.push(`${evt.name}: TURNOVER MATCHED`);
      }else if(age<=GV_TURNOVER_CORRELATION_MS){
        statuses.push(`${evt.name}: TURNOVER WAITING`);
      }else{
        statuses.push(`${evt.name}: TURNOVER EXPIRED / UNMATCHED`);
      }
    }
  }

  for(const e of reconciled||[]){
    if(e?.pendingTdStatus==='EXPIRED / RELEASED'){
      const label=`${e.name}: EXPIRED / RELEASED`;
      if(!statuses.includes(label))statuses.push(label);
    }
    if(e?.pendingTdStatus==='MATCHED'){
      const label=`${e.name}: MATCHED`;
      if(!statuses.includes(label))statuses.push(label);
    }
    if(e?.turnoverCorrelatedAcrossPolls||e?.turnoverKind){
      const names=[e.offensivePlayerName,e.defensivePlayerName].filter(Boolean);
      if(names.length){
        const label=`${names.join(' ↔ ')}: TURNOVER MATCHED`;
        if(!statuses.includes(label))statuses.push(label);
      }
    }
  }
  return [...new Set(statuses)];
}

function testingRefreshLifecycleHistory(){
  const asOf=testingSequenceTime();
  for(const p of testingPollSequence){
    p.lifecycle=testingDescribeLifecycle(p.raw||[],p.reconciled||[],asOf);
    const base=p.baseSummary||p.summaryBase||'';
    p.summary=p.lifecycle.length?`${base}${base?' | ':''}${p.lifecycle.join(' | ')}`:base;
  }
}

function testingRecordPoll(raw,reconciled,warnings){
  const baseSummary=reconciled.map(e=>{
    const who=e.multiActor&&e.qbName&&e.receiverName?`${e.qbName} → ${e.receiverName}`:e.name;
    const hold=gvTdCouldBeTandemHalf(e)?' • tandem-delay eligible':'';
    return `${who}: ${e.detail||e.intervalClass||e.type}${hold}`;
  }).join(' | ') || raw.map(e=>`${e.name}: ${e.detail||'delta'}`).join(' | ') || 'No fantasy-point change';
  testingPollSequence.push({
    pollNumber:testingPollNumber,
    offsetMs:testingPollOffsetMs,
    time:testingSequenceTime(),
    raw:raw.map(e=>({...e})),
    reconciled:reconciled.map(e=>({...e})),
    warnings:[...(warnings||[])],
    lifecycle:[],
    baseSummary,
    summary:baseSummary
  });
  testingRefreshLifecycleHistory();
  renderTestingSequenceHistory();
}

function testingBuildSyntheticDeltaEvents(){
  const tandemOverride=$('#testingTandemOverride')?.value||'auto';

  const rushOn=!!$('#testingRushEnabled')?.checked,recOn=!!$('#testingRecEnabled')?.checked,passOn=!!$('#testingPassEnabled')?.checked;
  const rushY=Math.round(Number($('#testingRushYds')?.value||0)),recY=Math.round(Number($('#testingRecYds')?.value||0)),passY=Math.round(Number($('#testingPassYds')?.value||0));
  const tdCount=Math.max(0,Math.round(($('#testingTdCount')?.checked?1:0)));
  const tdType=document.querySelector('input[name="testingTdType"]:checked')?.value||'rush';
  const fumble=!!$('#testingFumble')?.checked,interception=!!$('#testingInterception')?.checked;
  const rushP=testingResolveDeltaPlayer($('#testingRushPlayer')?.value,['RB','QB']);
  const recP=testingResolveDeltaPlayer($('#testingRecPlayer')?.value,['WR','TE','RB','QB']);
  const passP=testingResolveDeltaPlayer($('#testingPassPlayer')?.value,['QB','RB','WR','TE','K']);
  const now=testingSequenceTime(),entries=[],warnings=[];

  if(!rushOn&&!recOn&&!passOn&&!fumble&&!interception&&tdCount===0)return {events:[],warnings:['No stat delta is enabled.']};

  const add=(player,stats,label)=>{
    if(!player){warnings.push(`No rostered ${label} player could be resolved.`);return}
    const rid=testingDeltaRosterIdForPlayer(player.id);
    if(!rid){warnings.push(`${player.name} is not on either roster in the selected matchup.`);return}
    const delta=testingSyntheticFantasyDelta(stats);
    const analysis=gvIntervalPlayAnalysis(player.id,player.pos,stats,delta);
    const colors=nflTeamColors(player.team);
    entries.push({
      id:`api-sim-${now}-${label}-${player.id}`,time:now,rosterId:rid,playerId:String(player.id),
      name:player.name,pos:player.pos||'—',nflTeam:player.team||'FA',
      teamPrimary:colors[0],teamSecondary:colors[1],delta,total:delta,
      leftScore:0,rightScore:0,detail:analysis.detail,intervalAnalysis:analysis,
      type:analysis.confidence==='single'?'play':analysis.confidence==='burst'?'burst':'summary',
      intervalClass:analysis.confidence==='single'?'SINGLE_PLAY':analysis.confidence==='burst'?'MULTI_PLAY_BURST':'AMBIGUOUS_SUMMARY',
      source:'testing',testingForced:true,played:false
    });
  };

  const rushStats={},recStats={},passStats={};
  if(rushOn){rushStats.rush_att=1;rushStats.rush_yd=rushY}
  if(recOn){recStats.rec=1;recStats.rec_yd=recY}
  if(passOn){passStats.pass_att=1;passStats.pass_cmp=interception?0:1;passStats.pass_yd=interception?0:passY}
  if(interception){passStats.pass_att=Math.max(1,passStats.pass_att||0);passStats.pass_int=1}
  if(tdCount){
    if(tdType==='rush')rushStats.rush_td=tdCount;
    if(tdType==='rec')recStats.rec_td=tdCount;
    if(tdType==='pass')passStats.pass_td=tdCount;
    // A completed passing TD normally appears on both passer and receiver.
    if(passOn&&recOn&&(tdType==='pass'||tdType==='rec')){
      passStats.pass_td=tdCount;recStats.rec_td=tdCount;
    }
  }
  if(fumble){
    const target=tdType==='pass'?passStats:tdType==='rec'?recStats:rushStats;
    target.fum_lost=1;
  }

  if(rushOn||Object.keys(rushStats).length)add(rushP,rushStats,'rush');
  if(recOn||Object.keys(recStats).length)add(recP,recStats,'reception');
  if(passOn||Object.keys(passStats).length)add(passP,passStats,'pass');

  const syntheticPassEvent=entries.find(e=>(e.intervalAnalysis?.stats?.pass_att||0)>0||(e.intervalAnalysis?.stats?.pass_cmp||0)>0||(e.intervalAnalysis?.stats?.pass_td||0)>0);
  const syntheticRecEvent=entries.find(e=>(e.intervalAnalysis?.stats?.rec||0)>0||(e.intervalAnalysis?.stats?.rec_td||0)>0);
  if(syntheticPassEvent&&syntheticRecEvent){
    const passerPos=String(syntheticPassEvent.pos||'').toUpperCase(),receiverPos=String(syntheticRecEvent.pos||'').toUpperCase();
    if(passerPos!=='QB'||receiverPos==='QB'){
      syntheticPassEvent.trickPlayCandidate=true;
      syntheticRecEvent.trickPlayCandidate=true;
    }
  }

  if(passOn&&recOn&&passP&&recP){
    if(passP.team!==recP.team)warnings.push(`Passer ${passP.name} (${passP.team}) and receiver ${recP.name} (${recP.team}) are on different NFL teams, so they will not correlate.`);
    if(passY!==recY&&!interception)warnings.push(`Pass yards (${passY}) and receiving yards (${recY}) do not match, so strict QB/receiver correlation may be rejected.`);
  }
  
  if(tandemOverride!=='auto'){
    const passEvent=entries.find(e=>(e.intervalAnalysis?.stats?.pass_cmp||0)>0||(e.intervalAnalysis?.stats?.pass_att||0)>0||(e.intervalAnalysis?.stats?.pass_td||0)>0);
    const recEvent=entries.find(e=>(e.intervalAnalysis?.stats?.rec||0)>0||(e.intervalAnalysis?.stats?.rec_td||0)>0);
    if(passEvent&&recEvent){
      if(tandemOverride==='same'){
        const forced=passEvent.nflTeam||recEvent.nflTeam||'FORCED';
        passEvent.nflTeam=forced;recEvent.nflTeam=forced;
        passEvent.testingTeamOverride='same';recEvent.testingTeamOverride='same';
        warnings.push('Tandem override forced passer and receiver to the same NFL team for correlation testing.');
      }else if(tandemOverride==='different'){
        passEvent.nflTeam=passEvent.nflTeam||'FORCED-A';
        recEvent.nflTeam=(recEvent.nflTeam&&recEvent.nflTeam!==passEvent.nflTeam)?recEvent.nflTeam:'FORCED-B';
        passEvent.testingTeamOverride='different';recEvent.testingTeamOverride='different';
        warnings.push('Tandem override forced passer and receiver to different NFL teams for correlation testing.');
      }
    }else{
      warnings.push('Tandem override requires both a pass delta and a reception delta.');
    }
  }
return {events:entries,warnings};
}
function testingQueueVolatileGameViewEvent(entry,queueForPlayback=true){
  const normalized=gvNormalizeEventSource({...entry,source:'testing',testingForced:true},'testing');
  if(testingGameViewFeed.some(e=>e.id===normalized.id))return normalized;
  testingGameViewFeed.push(normalized);
  if(queueForPlayback&&(normalized.type==='play'||normalized.type==='burst')){
    testingGameViewQueue.push(normalized);
    gameViewQueue.push(normalized);
  }
  return normalized;
}

function testingReconcileSyntheticDeltas(suppliedBuilt=null){
  const built=suppliedBuilt||testingBuildSyntheticDeltaEvents(),raw=built.events;
  const sequenceNow=testingSequenceTime();
  let reconciled=gvCorrelateIntervalPassing(raw);
  // Empty synthetic polls still advance lifecycle time so HELD TD halves and
  // waiting turnover candidates can expire exactly like real no-change polls.
  reconciled=gvHoldOrReleaseTandemTdEvents(reconciled,gvTestingPendingTdState,sequenceNow);

  // Temporarily route adjacent-poll correlation through Testing Area sequence state,
  // so live GameView correlation state is not cleared or contaminated.
  const liveTd=[...gvRecentTdCandidates],liveTdKeys=new Set(gvConsumedTdKeys);
  const liveTo=[...gvRecentTurnoverCandidates],liveToKeys=new Set(gvConsumedTurnoverKeys);
  gvRecentTdCandidates.length=0;gvRecentTdCandidates.push(...testingSequenceTdCandidates);
  gvConsumedTdKeys.clear();testingSequenceConsumedTdKeys.forEach(k=>gvConsumedTdKeys.add(k));
  gvRecentTurnoverCandidates.length=0;gvRecentTurnoverCandidates.push(...testingSequenceTurnoverCandidates);
  gvConsumedTurnoverKeys.clear();testingSequenceConsumedTurnoverKeys.forEach(k=>gvConsumedTurnoverKeys.add(k));

  reconciled=gvCorrelateAdjacentTd(reconciled);
  reconciled=gvCorrelateAdjacentTurnovers(reconciled,sequenceNow);

  testingSequenceTdCandidates.length=0;testingSequenceTdCandidates.push(...gvRecentTdCandidates);
  testingSequenceConsumedTdKeys.clear();gvConsumedTdKeys.forEach(k=>testingSequenceConsumedTdKeys.add(k));
  testingSequenceTurnoverCandidates.length=0;testingSequenceTurnoverCandidates.push(...gvRecentTurnoverCandidates);
  testingSequenceConsumedTurnoverKeys.clear();gvConsumedTurnoverKeys.forEach(k=>testingSequenceConsumedTurnoverKeys.add(k));

  gvRecentTdCandidates.length=0;gvRecentTdCandidates.push(...liveTd);
  gvConsumedTdKeys.clear();liveTdKeys.forEach(k=>gvConsumedTdKeys.add(k));
  gvRecentTurnoverCandidates.length=0;gvRecentTurnoverCandidates.push(...liveTo);
  gvConsumedTurnoverKeys.clear();liveToKeys.forEach(k=>gvConsumedTurnoverKeys.add(k));
  reconciled=reconciled.map(e=>gvNormalizeEventSource({...e,source:'testing',testingForced:true},'testing'));

  const turnoverProofWarning=raw.some(e=>gvIsOffensiveTurnoverEvent(e)||gvIsDefensiveTurnoverEvent(e)) &&
    !raw.some(a=>raw.some(b=>a!==b&&gvEventsAreProvenNflOpponents(a,b)))
      ?'Turnover correlation requires proven NFL opponents from Sleeper stats or the weekly schedule map; unrelated or unproven teams remain separate.'
      :'';
  const rawSummary=raw.map(e=>`${e.name}: ${Object.entries(e.intervalAnalysis?.stats||{}).map(([k,v])=>`${k} ${Number(v)>=0?'+':''}${v}`).join(', ')}`).join(' | ') || 'No fantasy-point change in this poll';
  const resultSummary=reconciled.map(e=>{
    const who=e.multiActor&&e.qbName&&e.receiverName?`${e.qbName} → ${e.receiverName}`:e.name;
    const impacts=Array.isArray(e.fantasyImpacts)&&e.fantasyImpacts.length
      ?` [${e.fantasyImpacts.map(x=>`${gvFantasyImpactLabel(x)} / roster ${x.rosterId}`).join(' • ')}]`
      :'';
    const totalLabel=(Array.isArray(e.fantasyImpacts)&&new Set(e.fantasyImpacts.map(x=>String(x.rosterId||''))).size>1)
      ?'cross-roster impacts preserved separately'
      :`${e.delta>=0?'+':''}${Number(gvEventDisplayDelta(e)).toFixed(2)} pts`;
    return `${who}: ${e.intervalClass||e.type} — ${e.detail||'update'} (${totalLabel})${impacts}`;
  }).join(' | ');
  if($('#testingDeltaResult'))$('#testingDeltaResult').innerHTML=
    `<span class="delta-ok">${raw.length?'Synthetic poll reconciled in the current sequence.':'No-change poll processed; pending lifecycle state was advanced.'}</span>`+
    ((built.warnings.length||turnoverProofWarning)?` <span class="delta-warn">${esc([built.warnings.join(' '),turnoverProofWarning].filter(Boolean).join(' '))}</span>`:'')+
    `<div class="delta-event"><b>Input delta:</b> ${esc(rawSummary)}</div>`+
    `<div class="delta-event"><b>GameView result:</b> ${esc(resultSummary)}</div>`;

  // Add exactly what the simulated API supplied to the Testing Area evidence log.
  for(const e of raw){
    testingLog.unshift({
      time:e.time,playerId:e.playerId,player:e.name,pos:e.pos,nflTeam:e.nflTeam,
      side:testingRosterSideForPlayer(e.playerId),text:`SIMULATED API DELTA: ${testingPlainEnglishFromStats(e)}`,
      changes:Object.fromEntries(Object.entries(e.intervalAnalysis?.stats||{}).map(([k,v])=>[k,{before:0,after:v,delta:v}])),
      rawNow:e.intervalAnalysis?.stats||{},fantasyDelta:e.delta,intervalClass:e.intervalClass,
      family:e.intervalAnalysis?.family,scoringRelevant:e.intervalAnalysis?.scoringRelevant,correlated:false,simulatedApi:true
    });
  }
  if(testingLog.length>TESTING_LOG_MAX)testingLog.length=TESTING_LOG_MAX;
  saveTestingState();renderTestingArea();

  testingRecordPoll(raw,reconciled,built.warnings);

  // Testing events are volatile only: animate them, but never write them to the weekly GameView session.
  for(const e of reconciled){
    testingQueueVolatileGameViewEvent(e,e.type==='play'||e.type==='burst');
  }
  renderGameViewFeed();
  if(currentView==='testing'&&!gameViewPlaying)playNextGameViewEvent();
  return reconciled;
}
function testingPlainEnglishFromStats(e){
  const s=e?.intervalAnalysis?.stats||{},name=e?.name||'Player';
  if((s.rec||0)===1)return `${name} records a ${Math.round(s.rec_yd||0)}-yard${s.rec_td?' touchdown':''} catch.`;
  if((s.rush_att||0)===1)return `${name} rushes for ${Math.round(s.rush_yd||0)} yards${s.rush_td?' and a touchdown':''}.`;
  if((s.pass_int||0)>0)return `${name} throws an interception.`;
  if((s.pass_cmp||0)===1)return `${name} completes a pass for ${Math.round(s.pass_yd||0)} yards${s.pass_td?' and a touchdown':''}.`;
  if((s.fum_lost||0)>0)return `${name} loses a fumble.`;
  return `${name}: ${e?.detail||'stat delta received'}.`;
}

function testingClearSyntheticReconciliationState(){
  const ids=new Set(testingGameViewFeed.map(e=>e.id));
  testingGameViewFeed.length=0;
  testingGameViewQueue.length=0;
  for(let i=gameViewQueue.length-1;i>=0;i--){
    const e=gameViewQueue[i];
    if(ids.has(e?.id)||(e?.source==='testing'&&e?.testingForced))gameViewQueue.splice(i,1);
  }
}

function testingResetDeltaSimulator(){
  for(const id of ['testingTdCount','testingRushYds','testingRecYds','testingPassYds'])if($('#'+id))$('#'+id).value='0';
  for(const id of ['testingFumble','testingInterception','testingRushEnabled','testingRecEnabled','testingPassEnabled'])if($('#'+id))$('#'+id).checked=false;
  for(const id of ['testingRushPlayer','testingRecPlayer','testingPassPlayer'])if($('#'+id))$('#'+id).value='';
  const radio=document.querySelector('input[name="testingTdType"][value="rush"]');if(radio)radio.checked=true;
  if($('#testingDeltaResult'))$('#testingDeltaResult').innerHTML='Configure a synthetic poll, then select <b>Send Poll</b>.';

  if($('#testingTandemOverride'))$('#testingTandemOverride').value='auto';
  for(const id of ['testingRushPlayer','testingRecPlayer','testingPassPlayer'])if($('#'+id))$('#'+id).value='';
}


function testingDeltaPreviewPlayer(selectId){
  const el=$('#'+selectId),id=String(el?.value||'').trim();
  if(!id)return {id:'',name:'No player selected',pos:'',team:''};
  const p=(typeof playerFor==='function'?playerFor(id):null)||players?.[id]||{};
  const fallbackName=[p.first_name,p.last_name].filter(Boolean).join(' ').trim();
  return {id,name:p.full_name||p.name||fallbackName||id,pos:p.position||p.pos||'',team:p.team||''};
}
function testingDeltaPreviewStats(kind){
  const cfg={
    rush:{enabled:'#testingRushEnabled',yards:'#testingRushYds',player:'testingRushPlayer',label:'Rushing',td:'rush'},
    rec:{enabled:'#testingRecEnabled',yards:'#testingRecYds',player:'testingRecPlayer',label:'Receiving',td:'rec'},
    pass:{enabled:'#testingPassEnabled',yards:'#testingPassYds',player:'testingPassPlayer',label:'Passing',td:'pass'}
  }[kind];
  const enabled=!!$(cfg.enabled)?.checked,yards=Number($(cfg.yards)?.value||0);
  const tdOn=!!$('#testingTdCount')?.checked;
  const tdType=document.querySelector('input[name="testingTdType"]:checked')?.value||'rush';
  const td=tdOn&&tdType===cfg.td;
  const player=testingDeltaPreviewPlayer(cfg.player);
  let pts=0,parts=[];
  if(enabled){
    if(kind==='rush'){pts+=yards*.1;parts.push(`${yards>=0?'+':''}${yards} rush yd`)}
    if(kind==='rec'){pts+=yards*.1+1;parts.push(`${yards>=0?'+':''}${yards} rec yd`,`+1 reception`)}
    if(kind==='pass'){pts+=yards*.04;parts.push(`${yards>=0?'+':''}${yards} pass yd`)}
  }
  if(td){pts+=6;parts.push('+1 TD')}
  if(kind==='pass'&&$('#testingInterception')?.checked){pts-=2;parts.push('+1 INT')}
  if(kind==='rush'&&$('#testingFumble')?.checked){pts-=2;parts.push('+1 fumble lost')}
  return {kind,label:cfg.label,enabled,td,player,yards,pts:Number(pts.toFixed(2)),parts};
}
function testingUpdateDeltaPreview(){
  const host=$('#testingDeltaPreview');if(!host)return;
  const tdOn=!!$('#testingTdCount')?.checked;
  const tdType=document.querySelector('input[name="testingTdType"]:checked')?.value||'rush';
  const tdCtl=$('.testing-td-control');if(tdCtl)tdCtl.classList.toggle('td-off',!tdOn);

  const map={rush:'.testing-stat-card.rush',rec:'.testing-stat-card.rec',pass:'.testing-stat-card.pass'};
  const rows=['rush','rec','pass'].map(testingDeltaPreviewStats);
  rows.forEach(r=>{
    const card=$(map[r.kind]);
    if(card){
      card.classList.toggle('active',r.enabled||r.td);
      card.classList.toggle('inactive',!r.enabled&&!r.td);
      card.classList.toggle('td-owner',tdOn&&tdType===r.kind);
    }
  });

  const fumble=!!$('#testingFumble')?.checked,interception=!!$('#testingInterception')?.checked;
  const active=rows.filter(r=>r.enabled||r.td||(r.kind==='rush'&&fumble)||(r.kind==='pass'&&interception));
  if(!active.length){
    host.innerHTML='<div class="testing-preview-empty">Enable a stat component or event modifier to preview this poll.</div>';
    return;
  }

  const items=active.map(r=>{
    const detail=r.parts.length?r.parts.join(' • '):'No yardage component enabled';
    const who=r.player.name||'No player selected';
    return `<div class="testing-preview-item">
      <small>${r.label}</small>
      <b>${esc(who)}</b>
      <span>${esc(detail)}</span>
      <div class="testing-preview-points">${r.pts>=0?'+':''}${r.pts.toFixed(2)} fantasy pts</div>
    </div>`;
  });

  const total=rows.reduce((a,r)=>a+r.pts,0);
  const passSel=testingDeltaPreviewPlayer('testingPassPlayer'),recSel=testingDeltaPreviewPlayer('testingRecPlayer');
  const trickSelected=!!$('#testingPassEnabled')?.checked&&!!$('#testingRecEnabled')?.checked&&
    (String(passSel.pos||'').toUpperCase()!=='QB'||String(recSel.pos||'').toUpperCase()==='QB');
  const modifiers=[
    fumble?'Fumble lost ON':null,
    interception?'Interception ON':null,
    tdOn?`TD owner: ${tdType==='rec'?'Receiving':tdType==='pass'?'Passing':'Rushing'}`:null,
    trickSelected?`Trick pass candidate: ${String(passSel.pos||'?').toUpperCase()} → ${String(recSel.pos||'?').toUpperCase()}`:null
  ].filter(Boolean).join(' • ')||'No event modifiers';
  items.push(`<div class="testing-preview-summary"><span>${esc(modifiers)}</span><b>Combined synthetic delta: ${total>=0?'+':''}${total.toFixed(2)} pts</b></div>`);
  host.innerHTML=items.join('');
}


function testingSetChecked(id,on){const el=$('#'+id);if(el)el.checked=!!on}
function testingSetValue(id,value){const el=$('#'+id);if(el)el.value=String(value)}
function testingChooseSameTeamTandem(){
  const rosterPlayers=testingDeltaRosterPlayers();
  const currentRosterId=testingDeltaActiveRosterId();
  const selectedRoster=rosterFor(currentRosterId);
  const selectedIds=new Set((selectedRoster?.players||[]).map(String));
  const teamPlayers=rosterPlayers.filter(p=>selectedIds.has(String(p.id)));
  const qbs=teamPlayers.filter(p=>String(p.pos||'').toUpperCase()==='QB');
  const receivers=teamPlayers.filter(p=>['WR','TE','RB'].includes(String(p.pos||'').toUpperCase()));
  for(const qb of qbs){
    const rec=receivers.find(r=>r.team&&qb.team&&r.team===qb.team);
    if(rec)return {qb,rec};
  }
  return {qb:qbs[0]||null,rec:receivers[0]||null};
}

function testingChooseTrickTandem(){
  const rosterPlayers=testingDeltaRosterPlayers();
  const currentRosterId=testingDeltaActiveRosterId();
  const selectedRoster=rosterFor(currentRosterId);
  const selectedIds=new Set((selectedRoster?.players||[]).map(String));
  const teamPlayers=rosterPlayers.filter(p=>selectedIds.has(String(p.id)));
  const passers=teamPlayers.filter(p=>['RB','WR','TE','K'].includes(String(p.pos||'').toUpperCase()));
  const receivers=teamPlayers.filter(p=>['QB','RB','WR','TE'].includes(String(p.pos||'').toUpperCase()));
  for(const passer of passers){
    const rec=receivers.find(r=>String(r.id)!==String(passer.id)&&r.team&&passer.team&&r.team===passer.team);
    if(rec)return {passer,rec};
  }
  const passer=passers[0]||null;
  const rec=receivers.find(r=>String(r.id)!==String(passer?.id||''))||null;
  return {passer,rec};
}

function testingApplyDeltaPreset(name){
  testingResetDeltaSimulator();
  testingPopulateDeltaPlayers();
  const tandem=testingChooseSameTeamTandem();
  const setTd=type=>{
    testingSetChecked('testingTdCount',true);
    const radio=document.querySelector(`input[name="testingTdType"][value="${type}"]`);if(radio)radio.checked=true;
  };
  if(name==='qb-rec-td'){
    testingSetChecked('testingPassEnabled',true);testingSetChecked('testingRecEnabled',true);
    testingSetValue('testingPassYds',24);testingSetValue('testingRecYds',24);setTd('pass');
    if(tandem.qb)testingSetValue('testingPassPlayer',tandem.qb.id);
    if(tandem.rec)testingSetValue('testingRecPlayer',tandem.rec.id);
  }else if(name==='rb-rush-td'){
    testingSetChecked('testingRushEnabled',true);testingSetValue('testingRushYds',12);setTd('rush');
  }else if(name==='interception'){
    testingSetChecked('testingPassEnabled',true);testingSetChecked('testingInterception',true);testingSetValue('testingPassYds',0);
  }else if(name==='fumble'){
    testingSetChecked('testingRushEnabled',true);testingSetChecked('testingFumble',true);testingSetValue('testingRushYds',7);
  }else if(name==='burst'){
    testingSetChecked('testingRushEnabled',true);testingSetChecked('testingPassEnabled',true);testingSetChecked('testingRecEnabled',true);
    testingSetValue('testingRushYds',8);testingSetValue('testingPassYds',19);testingSetValue('testingRecYds',19);
    if(tandem.qb)testingSetValue('testingPassPlayer',tandem.qb.id);
    if(tandem.rec)testingSetValue('testingRecPlayer',tandem.rec.id);
  }else if(name==='trick-pass-td'){
    const trick=testingChooseTrickTandem();
    testingSetChecked('testingPassEnabled',true);testingSetChecked('testingRecEnabled',true);
    testingSetValue('testingPassYds',27);testingSetValue('testingRecYds',27);setTd('pass');
    if(trick.passer)testingSetValue('testingPassPlayer',trick.passer.id);
    if(trick.rec)testingSetValue('testingRecPlayer',trick.rec.id);
    if($('#testingTandemOverride'))$('#testingTandemOverride').value='auto';
  }
  testingUpdateDeltaPreview();
  const r=$('#testingDeltaResult');
  if(r)r.innerHTML='Preset loaded. Review the poll preview, adjust anything you want, then select <b>Send Poll</b>.';
}



function testingChooseOpponentDefense(offensivePlayerId=''){
  const pair=chosenPair?.();if(!pair)return null;
  const offenseRid=testingDeltaRosterIdForPlayer(offensivePlayerId);
  const otherRows=(pair.rows||[]).filter(r=>String(r.roster_id)!==String(offenseRid));
  const all=testingDeltaRosterPlayers();
  for(const row of otherRows){
    const roster=rosterFor(row.roster_id);
    const ids=new Set((roster?.players||[]).map(String));
    const d=all.find(p=>ids.has(String(p.id))&&['DEF','DST'].includes(String(p.pos||'').toUpperCase()));
    if(d)return {...d,rosterId:String(row.roster_id)};
  }
  return null;
}
function testingMakeDefensiveRecoveryEvent(defense,offenseTeam,now){
  if(!defense)return null;
  const stats={fum_rec:1};
  const delta=2;
  const analysis=gvIntervalPlayAnalysis(defense.id,defense.pos||'DEF',stats,delta);
  const colors=nflTeamColors(defense.team);
  return {
    id:`api-sim-${now}-def-fum-${defense.id}`,time:now,rosterId:String(defense.rosterId||''),
    playerId:String(defense.id),name:defense.name,pos:defense.pos||'DEF',
    nflTeam:defense.team||'DEF',opponentNflTeam:offenseTeam||'',
    teamPrimary:colors[0],teamSecondary:colors[1],delta,total:delta,
    leftScore:0,rightScore:0,detail:analysis.detail,intervalAnalysis:analysis,
    type:'play',intervalClass:'SINGLE_PLAY',source:'testing',testingForced:true,played:false
  };
}

function testingSequencePresetSetResult(text,kind=''){
  const note=$('#testingSequencePresetNote');
  if(note){
    note.textContent=text;
    note.classList.toggle('delta-ok',kind==='ok');
    note.classList.toggle('delta-warn',kind==='warn');
  }
}
function testingSequencePresetLock(on){
  document.querySelectorAll('[data-sequence-preset]').forEach(b=>{
    b.classList.toggle('testing-sequence-preset-running',!!on);
    b.disabled=!!on;
  });
}
function testingResetForSequencePreset(){
  testingSequenceStateReset();
  testingResetDeltaSimulator();
  testingPopulateDeltaPlayers();
  testingUpdateDeltaPreview();
}
function testingSetTdType(type,on=true){
  testingSetChecked('testingTdCount',on);
  const radio=document.querySelector(`input[name="testingTdType"][value="${type}"]`);
  if(radio)radio.checked=true;
}
function testingPresetPollConfig(cfg={}){
  testingResetDeltaSimulator();
  testingPopulateDeltaPlayers();
  if(cfg.rush){
    testingSetChecked('testingRushEnabled',true);
    testingSetValue('testingRushYds',cfg.rush.yards??0);
    if(cfg.rush.playerId)testingSetValue('testingRushPlayer',cfg.rush.playerId);
  }
  if(cfg.rec){
    testingSetChecked('testingRecEnabled',true);
    testingSetValue('testingRecYds',cfg.rec.yards??0);
    if(cfg.rec.playerId)testingSetValue('testingRecPlayer',cfg.rec.playerId);
  }
  if(cfg.pass){
    testingSetChecked('testingPassEnabled',true);
    testingSetValue('testingPassYds',cfg.pass.yards??0);
    if(cfg.pass.playerId)testingSetValue('testingPassPlayer',cfg.pass.playerId);
  }
  if(cfg.tdType)testingSetTdType(cfg.tdType,true);
  if(cfg.fumble)testingSetChecked('testingFumble',true);
  if(cfg.interception)testingSetChecked('testingInterception',true);
  if(cfg.override)testingSetValue('testingTandemOverride',cfg.override);
  testingUpdateDeltaPreview();
}
async function testingRunSequencePreset(name){
  testingSequencePresetLock(true);
  try{
    testingResetForSequencePreset();
    const tandem=testingChooseSameTeamTandem();
    const rushPlayer=$('#testingRushPlayer')?.value||'';
    const passId=String(tandem.qb?.id||$('#testingPassPlayer')?.value||'');
    const recId=String(tandem.rec?.id||$('#testingRecPlayer')?.value||'');

    if(name==='td-delay'){
      testingPresetPollConfig({
        pass:{yards:24,playerId:passId},
        tdType:'pass',
        override:'same'
      });
      testingReconcileSyntheticDeltas();
      testingAdvancePoll();
      testingPresetPollConfig({
        rec:{yards:24,playerId:recId},
        tdType:'rec',
        override:'same'
      });
      testingReconcileSyntheticDeltas();
      testingSequencePresetSetResult('Ran 2 polls: passer TD at T+0s, receiver TD at T+15s. Review lifecycle badges and reconciliation output.','ok');
    }else if(name==='turnover-delay'){
      testingPresetPollConfig({
        rush:{yards:6,playerId:rushPlayer},
        fumble:true
      });
      const first=testingReconcileSyntheticDeltas();
      const offenseRaw=(testingPollSequence.at(-1)?.raw||[]).find(e=>gvIsOffensiveTurnoverEvent(e));
      testingAdvancePoll();
      testingPresetPollConfig({});
      const defense=testingChooseOpponentDefense(offenseRaw?.playerId||rushPlayer);
      const defEvent=testingMakeDefensiveRecoveryEvent(defense,offenseRaw?.nflTeam||'',testingSequenceTime());
      if(defEvent&&offenseRaw){
        offenseRaw.opponentNflTeam=defEvent.nflTeam;
        defEvent.opponentNflTeam=offenseRaw.nflTeam;
        testingReconcileSyntheticDeltas({events:[defEvent],warnings:[]});
        testingSequencePresetSetResult('Ran 2 polls: offensive fumble at T+0s, opposing fantasy defense fumble recovery at T+15s. Review the turnover event and separate fantasy impacts.','ok');
      }else{
        testingReconcileSyntheticDeltas({events:[],warnings:['No opposing rostered DEF/DST could be resolved for the recovery poll.']});
        testingSequencePresetSetResult('Ran the fumble poll, but no opposing rostered DEF/DST was available to inject recovery evidence.','warn');
      }
    }else if(name==='ambiguous-resolve'){
      testingPresetPollConfig({
        rush:{yards:7,playerId:rushPlayer},
        pass:{yards:18,playerId:passId},
        rec:{yards:18,playerId:recId},
        override:'same'
      });
      testingReconcileSyntheticDeltas();
      testingAdvancePoll();
      testingPresetPollConfig({
        pass:{yards:18,playerId:passId},
        rec:{yards:18,playerId:recId},
        override:'same'
      });
      testingReconcileSyntheticDeltas();
      testingSequencePresetSetResult('Ran 2 polls: mixed burst at T+0s, then cleaner pass/receiver evidence at T+15s. Review whether the later poll reconciles cleanly.','ok');
    }
    renderTestingSequenceHistory();
    testingUpdateDeltaPreview();
  }catch(e){
    testingSequencePresetSetResult(`Sequence preset failed: ${e?.message||e}`,'warn');
    if(typeof appendJsError==='function')appendJsError(e?.stack||String(e));
  }finally{
    testingSequencePresetLock(false);
  }
}

function renderTestingArea(){
  testingSyncSimpleTeamLabels();
  renderTestingSequenceHistory();
  testingUpdateDeltaPreview();
  const status=$('#testingStatus'),stream=$('#testingStream');
  testingPopulateDeltaPlayers();
  if(!status||!stream)return;
  const eligible=testingRosteredPlayerIds().size;
  status.textContent=liveLoadingEnabled()
    ?`Live Loading ON • 15-second refresh • ${eligible} currently rostered players eligible`
    :'Live Loading OFF • showing saved Testing Area history';

  document.querySelectorAll('[data-testing-team]').forEach(b=>b.classList.toggle('active',b.dataset.testingTeam===testingTeamFilter));
  document.querySelectorAll('[data-testing-pos]').forEach(b=>b.classList.toggle('active',b.dataset.testingPos===testingPosFilter));
  if($('#testingRawToggle'))$('#testingRawToggle').checked=testingRawVisible;

  const rows=testingLog.filter(testingEntryVisible);
  if(!rows.length){
    stream.innerHTML='<div class="testing-empty">No matching Sleeper stat changes captured yet.</div>';
    return;
  }
  stream.innerHTML=rows.map(entry=>{
    const tag=testingIntervalLabel(entry);
    const t=new Date(entry.time||Date.now()).toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'});
    const raw=testingRawVisible
      ?`<div class="testing-raw">Interpretation: ${esc(entry.family||'unknown')} • ${entry.scoringRelevant===false?'no fantasy-point change detected':'fantasy scoring changed or not yet baselined'}${entry.changes?.pass_td||entry.changes?.rec_td?' • TD correlation candidate':''}${entry.changes?.pass_int||entry.changes?.fum_lost||entry.changes?.fum_lost_total||entry.changes?.int||entry.changes?.fum_rec||entry.changes?.def_td?' • turnover correlation candidate':''}\nChanged fields: ${esc(JSON.stringify(entry.changes||{},null,2))}\nCurrent Sleeper stats: ${esc(JSON.stringify(entry.rawNow||{},null,2))}</div>`
      :'';
    return `<div class="testing-entry">
      <div class="testing-entry-top">
        <span>${esc(t)}</span>
        <b>${esc(entry.player||entry.playerId||'Player')}</b>
        <small>${esc(entry.pos||'—')} • ${esc(entry.nflTeam||'FA')} • ${entry.side==='mine'?'My Team':entry.side==='opp'?'Opponent':'Rostered'}</small>
      </div>
      <div class="testing-entry-text">${esc(entry.text||'Stat change received')}<span class="testing-entry-tag ${tag.cls}">${tag.text}</span></div>
      ${Number.isFinite(Number(entry.fantasyDelta))?`<div class="testing-entry-delta">${Number(entry.fantasyDelta)>=0?'+':''}${Number(entry.fantasyDelta).toFixed(2)} fantasy pts</div>`:''}
      ${raw}
    </div>`;
  }).join('');
}

const simPlayDetails=new Map();const simPlayKeys=new Map();
const storage={
  get(k,d=''){try{return localStorage.getItem(k)||d}catch(e){return d}},
  set(k,v){
    try{localStorage.setItem(k,v);return true}
    catch(e){
      try{console.warn('Local storage write failed',k,e)}catch(_){}
      return false
    }
  }
};
const LIVE_LOADING_KEY='ucl-gameday-live-loading-v2',LIVE_SNAPSHOT_KEY='ucl-gameday-live-snapshot-v1';

const ROSTER_CACHE_V2_KEY='ucl-gameday-roster-cache-v2';

const DISCOVERED_PLAYERS_KEY='ucl-gameday-discovered-players-v1';
const ROSTER_CACHE_KEY='ucl-gameday-roster-cache-v1';
const SIM_OPEN_GAMEVIEW_KEY='ucl-gameday-sim-open-gameview-v1';

let discoveredSleeperPlayers={};

function simOpenGameViewEnabled(){return storage.get(SIM_OPEN_GAMEVIEW_KEY,'off')==='on'}

function normalizeDiscoveredPlayer(p){
  if(!p||typeof p!=='object')return null;
  const full=p.full_name||[p.first_name,p.last_name].filter(Boolean).join(' ')||'';
  const pos=String(p.position||p.fantasy_positions?.[0]||'').toUpperCase();
  const team=String(p.team||'').toUpperCase();
  const injury=String(p.injury_status||'');
  const status=String(p.status||'');
  if(!full&&!pos&&!team)return null;
  return {
    full_name:full,
    first_name:p.first_name||'',
    last_name:p.last_name||'',
    position:pos,
    team,
    injury_status:injury,
    status
  };
}

function loadDiscoveredPlayers(){
  try{
    const raw=storage.get(DISCOVERED_PLAYERS_KEY,'');if(!raw)return false;
    const parsed=JSON.parse(raw);
    const map=(parsed?.players&&typeof parsed.players==='object')?parsed.players:parsed;
    if(map&&typeof map==='object'&&!Array.isArray(map)){
      discoveredSleeperPlayers=map;
      return Object.keys(discoveredSleeperPlayers).length>0;
    }
  }catch(e){}
  return false;
}

