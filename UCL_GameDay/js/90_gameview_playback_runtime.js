/* UCL GameDay v0.5.60 — build fragment: 90_gameview_playback_runtime.js
   This file is concatenated in manifest order into the app's single lexical scope.
   It is intentionally not loaded independently in the browser. */
function gvPruneCorrelation(now=Date.now()){
  while(gameViewCorrelationWindow.length&&now-(gameViewCorrelationWindow[0].time||0)>GAMEVIEW_CORRELATION_MS*2)gameViewCorrelationWindow.shift();
}

function gvReplaceQueuedEvent(oldId,newEvt){
  const qi=gameViewQueue.findIndex(x=>x.id===oldId);
  if(qi>=0)gameViewQueue[qi]=newEvt;
  const fi=gameViewEvents.findIndex(x=>x.id===oldId);
  if(fi>=0)gameViewEvents[fi]=newEvt;
}

function gvSortBySequence(a,b){
  const ta=Number(a.time)||0,tb=Number(b.time)||0;
  if(ta!==tb)return ta-tb;
  return (a.sequence||0)-(b.sequence||0);
}


const GV_PLAYBACK_TOMBSTONE_MS=7000;
const gvPlaybackTombstones=[];
const gvAutomaticPlaybackClaims=new Set();
const GV_AUTOMATIC_PLAYBACK_CLAIM_MAX=400;
function gvPrunePlaybackTombstones(now=Date.now()){
  for(let i=gvPlaybackTombstones.length-1;i>=0;i--){
    if(now-Number(gvPlaybackTombstones[i]?.claimedAt||0)>GV_PLAYBACK_TOMBSTONE_MS)gvPlaybackTombstones.splice(i,1);
  }
}
function gvPlaybackAlreadyClaimed(evt){
  gvPrunePlaybackTombstones();
  const src=String(evt?.source||'').toLowerCase();
  if(src==='testing'||src==='simulation')return false;
  return !!gvFindRecentEquivalentEvent(gvPlaybackTombstones.map(x=>x.event),evt,GV_EVENT_DEDUPE_WINDOW_MS);
}
function gvClaimPlayback(evt){
  gvPrunePlaybackTombstones();
  const src=String(evt?.source||'').toLowerCase();
  if(src==='testing'||src==='simulation')return '';
  gvPlaybackTombstones.push({claimedAt:Date.now(),event:{...evt}});
  return evt?.semanticKey||evt?.dedupeKey||evt?.id||'';
}


function gvAutomaticPlaybackClaimKey(evt){
  if(!evt)return '';
  return String(evt.id||evt.eventId||evt.dedupeKey||evt.semanticKey||'').trim();
}
function gvWasAutomaticallyDispatched(evt){
  const key=gvAutomaticPlaybackClaimKey(evt);
  return !!key&&gvAutomaticPlaybackClaims.has(key);
}
function gvClaimAutomaticDispatch(evt){
  const key=gvAutomaticPlaybackClaimKey(evt);
  if(!key)return '';
  gvAutomaticPlaybackClaims.add(key);
  if(gvAutomaticPlaybackClaims.size>GV_AUTOMATIC_PLAYBACK_CLAIM_MAX){
    const excess=gvAutomaticPlaybackClaims.size-GV_AUTOMATIC_PLAYBACK_CLAIM_MAX;
    const it=gvAutomaticPlaybackClaims.values();
    for(let i=0;i<excess;i++){
      const next=it.next();
      if(next.done)break;
      gvAutomaticPlaybackClaims.delete(next.value);
    }
  }
  return key;
}

function gvFlushPending(force=false){
  if(gameViewPendingTimer){clearTimeout(gameViewPendingTimer);gameViewPendingTimer=null}
  const now=Date.now(),ready=[],keep=[];
  for(const evt of gameViewPending){
    if(force||now-(evt.ingestedAt||now)>=GAMEVIEW_INGEST_HOLD_MS)ready.push(evt);
    else keep.push(evt);
  }
  gameViewPending.length=0;gameViewPending.push(...keep);
  ready.sort(gvSortBySequence);

  for(const rawEvt of ready){
    let evt=gvNormalizeEventSource(rawEvt);
    const recentRuntime=[...gameViewCorrelationWindow,...gameViewEvents,...gameViewQueue];
    const runtimeDuplicate=gvFindRecentEquivalentEvent(recentRuntime,evt);
    if(runtimeDuplicate)continue;
    evt={...evt,dedupeKey:evt.dedupeKey||gvEventDedupeKey(evt),semanticKey:evt.semanticKey||gvSemanticPlayKey(evt)};
    const hit=gvFindCorrelatedPending(evt);
    if(hit){
      const merged=gvNormalizeEventSource(gvMergePlayEvents(hit.other,evt));
      merged.sequence=Math.min(hit.other.sequence||evt.sequence,evt.sequence);
      gameViewCorrelationWindow.splice(hit.index,1,merged);
      gvReplaceQueuedEvent(hit.other.id,merged);
      if(!gameViewEvents.some(x=>x.id===merged.id)){
        gameViewEvents.unshift(merged);
        gameViewQueue.push(merged);
      }
    }else{
      gameViewCorrelationWindow.push(evt);
      gameViewEvents.unshift(evt);
      gameViewQueue.push(evt);
    }
  }

  gameViewEvents.sort((a,b)=>gvSortBySequence(b,a));
  if(gameViewEvents.length>80)gameViewEvents.length=80;
  gameViewQueue.sort(gvSortBySequence);
  renderGameViewFeed();
  if(!gameViewPlaying)playNextGameViewEvent();

  if(gameViewPending.length){
    const oldest=Math.min(...gameViewPending.map(x=>x.ingestedAt||now));
    gameViewPendingTimer=setTimeout(()=>gvFlushPending(false),Math.max(50,GAMEVIEW_INGEST_HOLD_MS-(now-oldest)));
  }
}

function gvSchedulePendingFlush(){
  if(gameViewPendingTimer)return;
  gameViewPendingTimer=setTimeout(()=>gvFlushPending(false),GAMEVIEW_INGEST_HOLD_MS);
}

function gvHasOutstandingPlayback(){
  return gameViewPlaying||gameViewQueue.length>0||gameViewPending.length>0;
}

async function gvWaitForPlaybackDrain(maxMs=12000){
  const start=Date.now();
  while(gvHasOutstandingPlayback()&&Date.now()-start<maxMs){
    gvFlushPending(true);
    await new Promise(r=>setTimeout(r,100));
  }
}

async function gvStageFormation(built){
  const los=$('#gvLos'),reset=$('#gvPlayReset');
  if(reset){reset.textContent='SET';reset.animate([{opacity:0},{opacity:1},{opacity:0}],{duration:520,easing:'ease-out'})}
  const units=built.units||[],anims=[];
  for(const u of units){
    const p=gvFieldPoint(u.x,u.y),visual=u.el.querySelector('.gv-unit-visual');
    u.el.style.left=p.left;u.el.style.top=p.top;u.el.style.opacity='1';u.el.style.transform='translate(-50%,-50%)';
    if(visual){
      const a=visual.animate([{opacity:0,transform:'scale(.84)'},{opacity:1,transform:'scale(1)'}],
        {duration:420,easing:'ease-out',fill:'forwards'});
      gvActorAnimations.push(a);anims.push(a.finished.catch(()=>{}));
    }
  }
  if(los){los.classList.add('gv-ready');los.hidden=false}
  await Promise.allSettled(anims);
  units.forEach(u=>{u.el.classList.add('gv-ready');u.el.style.opacity='1'});
}

async function gvSnapMoment(){
  const flash=$('#gvSnapFlash');
  if(flash){
    const a=flash.animate(
      [{background:'rgba(255,255,255,0)'},{background:'rgba(255,255,255,.18)'},{background:'rgba(255,255,255,0)'}],
      {duration:240,easing:'ease-out'}
    );
    gvActorAnimations.push(a);
  }
  await new Promise(r=>setTimeout(r,180));
}

async function gvExitFormation(){
  const layer=$('#gvPlayersLayer'),reset=$('#gvPlayReset');
  if(reset){reset.textContent='NEXT PLAY';reset.animate([{opacity:0},{opacity:.9},{opacity:0}],{duration:560,easing:'ease-in-out'})}
  if(layer){
    const visuals=[...layer.querySelectorAll('.gv-unit-visual')];
    const anims=visuals.map((el,i)=>{
      const a=el.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.88)'}],
        {duration:320+(i%4)*25,easing:'ease-in',fill:'forwards'});
      gvActorAnimations.push(a);return a.finished.catch(()=>{});
    });
    await Promise.allSettled(anims);
  }
  await new Promise(r=>setTimeout(r,140));
}

function gvClearPossession(){
  document.querySelectorAll('.gv-unit.has-ball,.gv-unit.highlighted').forEach(el=>{
    el.classList.remove('has-ball','highlighted');
  });
  document.querySelectorAll('.gv-carried-football').forEach(el=>el.remove());
}
function gvAttachCarriedBall(unit){
  if(!unit?.el)return null;
  unit.el.querySelectorAll('.gv-carried-football').forEach(el=>el.remove());
  const ball=document.createElement('span');
  ball.className='gv-carried-football';
  unit.el.appendChild(ball);
  return ball;
}
function gvSetPossession(unit){
  gvClearPossession();
  // Ball-state invariant: once a carrier owns the football there may not also
  // be a free-flight/loose football left on the field.
  document.querySelectorAll('.gv-football').forEach(el=>el.remove());
  if(!unit?.el)return;
  unit.el.classList.add('has-ball','highlighted');
  gvAttachCarriedBall(unit);
}

function gvDrawEngagement(off,def){
  const field=$('#gameViewField');if(!field||!off||!def)return null;
  const a=gvFieldPoint(off.x,off.y),b=gvFieldPoint(def.x,def.y);
  const ax=parseFloat(a.left),ay=parseFloat(a.top),bx=parseFloat(b.left),by=parseFloat(b.top);
  const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI;
  const link=document.createElement('div');link.className='gv-engage-link';
  link.style.left=a.left;link.style.top=a.top;link.style.width=`${len}%`;link.style.transform=`rotate(${angle}deg)`;
  field.appendChild(link);return link;
}

function gvContact(a,b,large=false){
  if(a?.el)a.el.classList.add('contact');
  if(b?.el)b.el.classList.add('contact');
  if(Number.isFinite(Number(a?.x))&&Number.isFinite(Number(a?.y))&&Number.isFinite(Number(b?.x))&&Number.isFinite(Number(b?.y))){
    const x=(Number(a.x)+Number(b.x))/2,y=(Number(a.y)+Number(b.y))/2;
    gvImpactAt(x,y,large);
  }
  setTimeout(()=>{a?.el?.classList.remove('contact');b?.el?.classList.remove('contact')},320);
}

function gvKickConcept(evt){
  const index=assignmentHash(`${evt.id}|kick`)%GV_KICK_CONCEPTS.length;
  return {name:GV_KICK_CONCEPTS[index],index};
}

function gvKickDistance(evt){
  const d=String(evt.detail||'').toLowerCase();
  const m=d.match(/(\d{2})-yard field goal/);
  if(m)return Number(m[1]);
  if(d.includes('extra point'))return 33;
  const pts=Math.abs(Number(evt.delta)||0);
  if(pts>=5)return 52+Math.round((pts-5)*4);
  if(pts>=4)return 42+Math.round((pts-4)*6);
  return 28+Math.round(Math.max(0,pts-2)*7);
}

function gvKickIsExtraPoint(evt){
  const d=String(evt.detail||'').toLowerCase();
  return d.includes('extra point')||Math.abs(Number(evt.delta)-1)<.15;
}

function gvKickProtectionPlan(built,dir,concept){
  const blockers=built.units.filter(u=>u.side==='offense'&&['LT','LG','C','RG','RT','TE'].includes(u.role));
  const rushers=built.units.filter(u=>u.side==='defense').slice(0,6);
  const side=concept.includes('left')?-1:concept.includes('right')?1:0;
  return {blockers,rushers,side};
}


function gvKickCoveragePath(u,dir,seed,gain=16){
  const lane=(simRand(seed,61)-.5)*10;
  return [
    {x:u.x,y:u.y},
    {x:u.x+dir*(gain*.45),y:gvClamp(u.y+lane*.35,10,90)},
    {x:u.x+dir*gain,y:gvClamp(u.y+lane,10,90)}
  ];
}
function gvReturnLanePath(u,dir,seed,gain=14){
  const bend=(simRand(seed,73)-.5)*12;
  return [
    {x:u.x,y:u.y},
    {x:u.x+dir*(gain*.35),y:gvClamp(u.y+bend*.35,10,90)},
    {x:u.x+dir*(gain*.7),y:gvClamp(u.y+bend*.8,10,90)},
    {x:u.x+dir*gain,y:gvClamp(u.y+bend,10,90)}
  ];
}
function gvTurnoverReturnDuration(baseDuration,yards,isInterception=false){
  const yd=Math.max(0,Number(yards)||0);
  // v0.4.52 reliability: distance and elapsed return time must tell the same
  // story. Small returns stay compact; long returns get enough time to visibly
  // cover the additional field distance instead of moving unnaturally fast.
  const floor=isInterception?1900:1650;
  const scaled=floor+Math.min(2400,yd*34);
  return Math.max(Number(baseDuration)||0,scaled);
}
function gvCollapseToBallPath(u,target,dir,seed){
  const offset=(simRand(seed,83)-.5)*8;
  return [
    {x:u.x,y:u.y},
    {x:(u.x+target.x)/2,y:gvClamp((u.y+target.y)/2+offset,10,90)},
    {x:target.x-dir*(1.5+simRand(seed,84)*3),y:gvClamp(target.y+offset*.45,10,90)}
  ];
}


function gvMakeUprights(dir=1){
  const field=$('#gameViewField');if(!field)return null;
  const el=document.createElement('div');
  el.className='gv-uprights';
  const x=dir>0?96:4,y=50,p=gvFieldPoint(x,y);
  el.style.left=p.left;el.style.top=p.top;
  el.style.transform='translate(-50%,-50%)';
  el.innerHTML='<span class="gv-upright-post left"></span><span class="gv-upright-crossbar"></span><span class="gv-upright-post right"></span>';
  field.appendChild(el);
  return {el,x,y,dir};
}

async function gvAnimateKick(evt,built,totalDuration){
  if(!built?.kickTeams?.prepared)gvPrepareKickFormation(evt,built,'kick');
  const kickState=built.kickTeams||{};
  const kicker=kickState.kicker||built.scorer||gvUnit(built,'offense','K');
  const holder=kickState.holder||gvUnit(built,'offense','H');
  const snapper=kickState.snapper||gvUnit(built,'offense','C');
  if(!kicker||!holder||!snapper)return;

  const dir=built.formation.dir,{name,index}=gvKickConcept(evt),distance=gvKickDistance(evt),xp=gvKickIsExtraPoint(evt);
  const snapDur=gvPhaseDur(totalDuration,.10,420),protectDur=gvPhaseDur(totalDuration,.22,820),approachDur=gvPhaseDur(totalDuration,.12,500),flightDur=gvPhaseDur(totalDuration,.34,1300),finishDur=gvPhaseDur(totalDuration,.16,620);
  const blockers=built.units.filter(u=>u.side==='offense'&&u!==kicker&&u!==holder&&['LT','LG','C','RG','RT','TE','WB'].includes(u.role));
  const defenders=built.units.filter(u=>u.side==='defense');
  const front=defenders.filter(u=>['EDGE','DE','DT','NT'].includes(String(u.role||'').toUpperCase()));
  const second=defenders.filter(u=>!front.includes(u));
  const penetrators=front.slice().sort((a,b)=>Math.hypot(a.x-kicker.x,a.y-kicker.y)-Math.hypot(b.x-kicker.x,b.y-kicker.y)).slice(0,2);
  const penetratorSet=new Set(penetrators);
  evt.kickProtection={maxPenetrators:2,lineHolds:true,secondLevelHolds:true,pairedWallLeverage:true,holderPocketProtected:true};

  // Start in the actual kick unit: long snapper owns the ball, then the snap is
  // visibly delivered to the holder before the kicker begins the approach.
  gvSetPossession(snapper);
  gvBallContinuityAudit(evt,'kick-pre-snap','carried',{owner:'snapper'});
  gvSpecialTeamsAudit(evt,built,xp?'extra-point':'field-goal',{
    phase:'pre-snap',
    snapperOwnsBall:true,
    holderPresent:!!holder,
    kickerPresent:!!kicker,
    lineCount:blockers.length
  });
  const snapStart={x:snapper.x,y:snapper.y},holdPoint={x:holder.x,y:holder.y};
  gvClearPossession();
  gvTerminalBallAudit(evt,'released',{owner:null,from:'snapper',specialTeams:true,releasePoint:{...snapStart}});
  const snapBall=gvMakeBall(snapStart.x,snapStart.y);
  gvBallContinuityAudit(evt,'kick-snap','free',{from:'snapper'});

  // Protection begins with the snap; no generic offensive snap phase precedes it.
  const lineX=built.formation.los-dir*.15;
  const protect=[];
  const wallTargets=blockers.map((u,i)=>{
    const laneY=gvClamp(31+i*(38/Math.max(1,blockers.length-1)),26,74);
    return {u,target:{x:gvClamp(lineX-dir*.45,5,95),y:laneY}};
  });
  wallTargets.forEach(({u,target})=>{
    protect.push(gvMove(u,[{x:u.x,y:u.y},{x:(u.x+target.x)/2,y:(u.y+target.y)/2},target],protectDur));
  });
  front.forEach((u,i)=>{
    const nearest=wallTargets.slice().sort((a,b)=>Math.abs(a.target.y-u.y)-Math.abs(b.target.y-u.y))[0];
    if(penetratorSet.has(u)){
      const side=i%2?-1:1;
      const target={x:gvClamp(holder.x+dir*2.3,5,95),y:gvClamp(holder.y+side*(4.2+i%3),7,93)};
      const mid={x:gvClamp(lineX+dir*.25,5,95),y:gvClamp((u.y+(nearest?.target?.y??u.y))/2,7,93)};
      protect.push(gvMove(u,[{x:u.x,y:u.y},mid,target],protectDur+(i%2)*45));
    }else{
      const target={
        x:gvClamp(lineX+dir*.35,5,95),
        y:gvClamp((nearest?.target?.y??u.y)+(i%2?.8:-.8),7,93)
      };
      protect.push(gvMove(u,[{x:u.x,y:u.y},{x:(u.x+target.x)/2,y:(u.y+target.y)/2},target],protectDur+(i%3)*30));
    }
  });
  second.forEach((u,i)=>{
    const target={x:gvClamp(u.x-dir*.35,5,95),y:gvClamp(u.y+(50-u.y)*.025,7,93)};
    protect.push(gvMove(u,[{x:u.x,y:u.y},target],protectDur+(i%2)*35));
  });

  await gvBallMove(snapBall,[snapStart,{x:(snapStart.x+holdPoint.x)/2,y:holdPoint.y},{...holdPoint}],snapDur);
  if(snapBall?.el)snapBall.el.remove();
  gvSetPossession(holder);
  gvBallContinuityAudit(evt,'kick-hold','carried',{owner:'holder'});
  gvSpecialTeamsAudit(evt,built,xp?'extra-point':'field-goal',{
    phase:'hold',
    holderOwnsBall:true,
    snapCompleted:true,
    protectionActive:true
  });
  gvPhaseHandoffAudit(evt,'snap-to-hold',holder,holdPoint,gvPhaseHandoffPoint(holder),.35);
  await Promise.allSettled(protect);

  // The holder keeps the carried football while the kicker approaches. The free
  // kick ball does not exist until the actual strike/release moment.
  const strike={x:holder.x-dir*.75,y:holder.y+(built?.kickTeams?.kickSide||1)*.35};
  const approach=[
    {x:kicker.x,y:kicker.y},
    {x:kicker.x+(strike.x-kicker.x)*.55,y:kicker.y+(strike.y-kicker.y)*.48},
    strike
  ];
  await gvMove(kicker,approach,approachDur);
  gvBallContinuityAudit(evt,'kick-approach','carried',{owner:'holder'});
  gvPhaseHandoffAudit(evt,'kicker-approach-to-strike',kicker,strike,gvPhaseHandoffPoint(kicker),.35);

  const launch={x:holder.x,y:holder.y};
  gvClearPossession();
  gvTerminalBallAudit(evt,'released',{owner:null,from:'holder',by:'kicker',specialTeams:true,releasePoint:{...launch}});
  const ball=gvMakeBall(launch.x,launch.y);
  gvBallContinuityAudit(evt,'kick-release','free',{releasePoint:{...launch}});

  if(String(evt?.playType||gvPlayType(evt))==='def_blocked_kick'){
    const los=Number(built?.formation?.los||50),blocker=(front||[]).slice().sort((a,b)=>Math.hypot(a.x-launch.x,a.y-launch.y)-Math.hypot(b.x-launch.x,b.y-launch.y))[0]||built.scorer;
    const blockPoint={x:gvClamp(los+dir*.9,5,95),y:gvClamp(50+(blocker?.y-50)*.08,22,78)};
    const rebound={x:gvClamp(los-dir*(16+simRand(assignmentHash(`${evt.id}|blocked-kick`),31)*8),5,95),y:gvClamp(50+(simRand(assignmentHash(`${evt.id}|blocked-kick`),32)-.5)*18,12,88)};
    if(blocker)await gvMove(blocker,[{x:blocker.x,y:blocker.y},{x:blockPoint.x-dir*.4,y:blockPoint.y}],Math.max(340,flightDur*.25),'ease-in');
    await Promise.allSettled([
      gvBallMove(ball,[launch,{x:(launch.x+blockPoint.x)/2,y:(launch.y+blockPoint.y)/2-1.5},blockPoint,rebound],Math.max(900,flightDur*.72)),
      gvMomentLabel(blockPoint.x,blockPoint.y,'BLOCKED!','breakup',900)
    ]);
    if(ball?.el)ball.el.remove();
    gvClearPossession();gvTerminalBallAudit(evt,'blocked-kick',{owner:null,reboundPoint:{...rebound}});
    evt.blockedKickAudit={blockedBeforeLine:true,blockPoint,reboundPoint:rebound,knockedBackTowardMidfield:true};
    gvTerminalFrameAudit(evt,'blocked-kick',[kicker,holder,snapper,blocker].filter(Boolean),{blocked:true});
    return;
  }

  const uprights=gvMakeUprights(dir),endX=dir>0?96:4,curve=(name.includes('left')?-1:name.includes('right')?1:0)*5;
  const kickResult=gvKickResult(evt),missProfile=kickResult.missed?gvKickMissProfile(evt):null;
  const goalY=kickResult.missed?gvClamp(50+missProfile.offset,4,96):50;
  evt.kickResult={made:kickResult.made,missed:kickResult.missed,distance,visualGoalY:Number(goalY.toFixed(1)),missKind:missProfile?.kind||null,missSide:missProfile?.side<0?'left':missProfile?.side>0?'right':null};
  const ballPath=kickResult.missed
    ?gvKickMissBallPath(launch,dir,distance,curve,missProfile)
    :[{x:launch.x,y:launch.y,rot:0},{x:launch.x+dir*(Math.min(22,distance*.35)),y:launch.y+curve,rot:180},{x:launch.x+dir*(Math.min(45,distance*.75)),y:launch.y+curve*.45,rot:360},{x:endX,y:50,rot:540}];

  const postKick=[
    ...penetrators.map((u,i)=>gvMove(u,[{x:u.x,y:u.y},{x:gvClamp(u.x+dir*(2.0+i*.7),5,95),y:gvClamp(u.y+(i?1.5:-1.5),7,93)}],flightDur)),
    ...blockers.slice(0,3).map((u,i)=>gvMove(u,[{x:u.x,y:u.y},{x:gvClamp(u.x+dir*.6,5,95),y:u.y}],flightDur))
  ];
  await Promise.allSettled([(kickResult.missed?gvKickBallMove(ball,ballPath,flightDur):gvBallMove(ball,ballPath,flightDur)),...postKick]);
  if(ball?.el)ball.el.remove();
  gvBallContinuityAudit(evt,'kick-result','none',{result:kickResult.made?'made':'missed'});
  if(kickResult.made)gvImpactAt(endX,50,false);
  await gvKickResultIndicator(endX,kickResult.missed?goalY:50,kickResult.made,kickResult.made?(xp?'EXTRA POINT GOOD!':'GOOD!'):'NO GOOD!',920);
  gvTerminalPossessionAudit(evt,xp?'extra_point':'field_goal','none',{kickResult:kickResult.made?'made':'missed'});
  gvTerminalBallAudit(evt,kickResult.made?'kick-good':'kick-missed',{owner:null});
  evt.kickFormationAudit={...(evt.kickFormationAudit||{}),snapToHold:true,holderOwnsThroughApproach:true,releaseFromHoldPoint:true};
  gvTerminalFrameAudit(evt,'kick-result',[kicker,holder,snapper,...blockers,...front,...second].filter(Boolean),{kickResult:kickResult.made?'made':'missed',lineMotionStopped:true});
  gvSpecialTeamsAudit(evt,built,xp?'extra-point':'field-goal',{
    phase:'terminal',
    result:kickResult.made?'made':'missed',
    ballReleasedFromHolder:true,
    terminalPossession:'none',
    lineMotionStopped:true,
    terminalFreeze:true
  });
  await gvSleep(Math.min(360,finishDur));
  if(uprights?.el)uprights.el.remove();
}

async function gvAnimateQbKneel(evt,built,totalDuration){
  const qb=gvUnit(built,'offense','QB');if(!qb)return;
  gvSetPossession(qb);
  const dir=built.formation.dir,start={x:qb.x,y:qb.y},end={x:gvClamp(qb.x-dir*.7,5,95),y:qb.y};
  await gvMove(qb,[start,end],Math.max(420,gvPhaseDur(totalDuration,.12,420)),'ease-out');
  qb.el?.classList.add('tackled');
  await gvPulseUnit(qb,'QB KNEEL',820);
  gvTerminalPossessionAudit(evt,'qb-kneel','offense',{carrier:qb?.playerId||'QB'});
  gvTerminalBallAudit(evt,'possessed',{owner:'offense',kneel:true});
  evt.qbKneelAudit={shortRetreat:true,playEndsImmediately:true};
}

async function gvAnimateSafety(evt,built,totalDuration){
  const qb=gvUnit(built,'offense','QB'),rb=gvUnit(built,'offense','RB');
  const defenders=built.units.filter(u=>u.side==='defense').slice().sort((a,b)=>Math.hypot(a.x-(qb?.x||50),a.y-(qb?.y||50))-Math.hypot(b.x-(qb?.x||50),b.y-(qb?.y||50))).slice(0,3);
  if(!qb||!defenders.length)return;
  const dir=built.formation.dir;
  gvSetPossession(qb);
  const drop={x:gvClamp(qb.x-dir*1.6,3,97),y:qb.y};
  await Promise.allSettled([
    gvMove(qb,[{x:qb.x,y:qb.y},drop],Math.max(620,gvPhaseDur(totalDuration,.18,620)),'ease-in-out'),
    ...(rb?[gvMove(rb,[{x:rb.x,y:rb.y},{x:gvClamp(rb.x-dir*.8,3,97),y:gvClamp(rb.y+(50-rb.y)*.25,10,90)}],620)]:[]),
    ...defenders.map((d,i)=>gvMove(d,[{x:d.x,y:d.y},{x:drop.x+dir*(1.2+i*.45),y:gvClamp(drop.y+(i-1)*2.2,8,92)}],700+i*70,'ease-in'))
  ]);
  const endzoneX=dir>0?6:94,impact={x:endzoneX,y:gvClamp(qb.y+(simRand(assignmentHash(`${evt.id}|safety`),9)-.5)*3,12,88)};
  await Promise.allSettled([
    gvMove(qb,[{x:qb.x,y:qb.y},impact],Math.max(700,gvPhaseDur(totalDuration,.18,700)),'ease-in'),
    ...(rb?[gvMove(rb,[{x:rb.x,y:rb.y},{x:gvClamp(impact.x+dir*1.4,4,96),y:gvClamp(impact.y+3,10,90)}],700)]:[]),
    ...defenders.map((d,i)=>gvMove(d,[{x:d.x,y:d.y},{x:gvClamp(impact.x+dir*(.6+i*.4),4,96),y:gvClamp(impact.y+(i-1)*1.6,8,92)}],700+i*45,'ease-in'))
  ]);
  gvImpactAt(impact.x,impact.y,true);qb.el?.classList.add('tackled');if(rb)rb.el?.classList.add('tackled');
  gvClearPossession();await gvMomentLabel(impact.x,impact.y,'SAFETY','breakup',1100);
  gvTerminalPossessionAudit(evt,'safety','none',{qbDownInEndzone:true});
  gvTerminalBallAudit(evt,'dead',{owner:null,safety:true});
  evt.safetyAudit={qbPreparingToPass:true,qbAndRbCollapse:true,downBehindGoalLine:true};
}

function gvDefPressureConcept(evt){
  const index=assignmentHash(`${evt.id}|def-pressure`)%GV_DEF_PRESSURE_CONCEPTS.length;
  return {name:GV_DEF_PRESSURE_CONCEPTS[index],index};
}

function gvDefReturnConcept(evt){
  const index=assignmentHash(`${evt.id}|def-return`)%GV_DEF_RETURN_CONCEPTS.length;
  return {name:GV_DEF_RETURN_CONCEPTS[index],index};
}


async function gvAnimateIncompletePass(evt,built,totalDuration){
  const dir=built.formation.dir,qb=gvUnit(built,'offense','QB');
  const receivers=built.units.filter(u=>u.side==='offense'&&['WR','TE','RB'].includes(u.role));
  let receiver=null;
  if(evt?.receiverPos){
    const sameRole=receivers.filter(u=>u.role===String(evt.receiverPos).toUpperCase());
    receiver=sameRole[gvReceiverUnitIndex(evt,sameRole)]||null;
  }
  receiver=receiver||receivers[assignmentHash(`${evt.id}|incomplete-target`)%Math.max(1,receivers.length)]
    ||gvUnit(built,'offense','WR',0)||gvUnit(built,'offense','TE')||gvUnit(built,'offense','RB');
  if(!qb||!receiver)return;

  const variant=gvRouteVariant(evt,receiver.role||'WR');
  const gain=10+(assignmentHash(`${evt.id}|incomplete-gain`)%18);
  const route=gvNormalizeRoutePath(
    gvSharpenRoutePath(gvRoutePath({x:receiver.x,y:receiver.y},dir,variant,gain),variant,dir),
    variant,dir
  );
  const catchPt=route.at(-1);
  const coverage=built.units.filter(u=>u.side==='defense').slice().sort(
    (a,b)=>Math.hypot(a.x-receiver.x,a.y-receiver.y)-Math.hypot(b.x-receiver.x,b.y-receiver.y)
  ).slice(0,2);

  await gvAnimateQbPass(evt,built,totalDuration,receiver,route,catchPt,coverage,'incomplete');
  evt.incompletePassAudit={
    ...(evt.incompletePassAudit||{}),
    classifiedAs:'incomplete',
    passDefendedEvidence:false,
    noInventedDefenderCredit:true
  };
  gvClearPossession();
}

async function gvAnimatePassBreakup(evt,built,totalDuration){
  const dir=built.formation.dir,qb=gvUnit(built,'offense','QB');
  const receivers=built.units.filter(u=>u.side==='offense'&&['WR','TE','RB'].includes(u.role));
  const receiver=receivers[assignmentHash(`${evt.id}|breakup-target`)%Math.max(1,receivers.length)]
    ||gvUnit(built,'offense','WR',0)||gvUnit(built,'offense','TE')||gvUnit(built,'offense','RB');
  if(!qb||!receiver)return;

  const variant=gvRouteVariant(evt,receiver.role||'WR');
  const gain=14+(assignmentHash(`${evt.id}|breakup-gain`)%12);
  const route=gvSharpenRoutePath(gvRoutePath({x:receiver.x,y:receiver.y},dir,variant,gain),variant,dir),catchPt=route.at(-1);
  const coverage=built.units.filter(u=>u.side==='defense').slice().sort(
    (a,b)=>Math.hypot(a.x-receiver.x,a.y-receiver.y)-Math.hypot(b.x-receiver.x,b.y-receiver.y)
  ).slice(0,2);

  await gvAnimateQbPass(evt,built,totalDuration,receiver,route,catchPt,coverage,'breakup');
  // v0.4.52 reliability fix: gvAnimateQbPass/gvResolvePassArrival already owns
  // the breakup contact, ball deflection and primary defender arrival. Do not
  // launch a second post-breakup defender movement toward the same catch point.
  evt.passBreakupAudit={
    ...(evt.passBreakupAudit||{}),
    singleContactOwner:true,
    duplicateDefenderCloseRemoved:true,
    statBacked:gvPassDefendedDelta(evt?.intervalAnalysis?.stats||{})>0||/pass breakup|pass defended/i.test(String(evt?.detail||'')),
    defenderDriven:true
  };
  gvClearPossession();
}

async function gvAnimateDefPressure(evt,built,totalDuration,type){
  const defender=built.scorer||built.units.find(u=>u.side==='defense'),qb=gvUnit(built,'offense','QB'),rb=gvUnit(built,'offense','RB');
  if(!defender)return;
  const dir=built.formation.dir,{name,index}=gvDefPressureConcept(evt),seed=assignmentHash(`${evt.id}|pressure|${index}`);
  const pressureDur=gvPhaseDur(totalDuration,.58,2100),impactDur=gvPhaseDur(totalDuration,.14,500);
  const passAssignments=gvPassBlockAssignments(built);
  const pressureOutcome=type==='def_sack'?'collapse-sack':type==='def_qb_hit'?'hit-release':gvPocketOutcome(evt,built,name);
  const failurePair=gvProtectionPairForDefender(passAssignments,defender,built)||gvProtectionFailurePair(passAssignments,pressureOutcome);
  const assignedRushers=new Set(passAssignments.map(x=>x.defender));
  const skill=built.units.filter(u=>u.side==='offense'&&['WR','TE','RB'].includes(u.role)&&u!==qb&&u!==rb);
  const secondary=built.units.filter(u=>u.side==='defense'&&!assignedRushers.has(u)&&u!==defender);

  const side=name.includes('left')?-1:name.includes('right')?1:0;
  const reaction=gvDefReactionProfile(evt,defender,index+31);
  const attackScale=reaction.name==='aggressive'||reaction.name==='attack'?1.35:reaction.name==='patient'?.8:1;
  const lanePath=gvPassRushLane(defender,built,qb,index).map((p,i)=>i===0?p:{
    x:p.x-dir*(reaction.name==='aggressive'||reaction.name==='attack'?1.2:0),
    y:gvClamp(p.y+side*(reaction.name==='outside-leverage'?1.5:reaction.name==='inside-leverage'?-1.2:0),8,92)
  });
  const pressurePath=qb?lanePath:[{x:defender.x,y:defender.y},{x:defender.x-dir*8,y:defender.y+side*6}];

  const shell=gvCoverageShell(built,evt);
  const support=[
    ...passAssignments.filter(x=>x.defender!==defender).map((pair,i)=>gvPocketAssignmentMotion(pair,built,pressureOutcome,pressureDur,assignmentHash(`${evt.id}|pressure-block|${i}`),pair===failurePair,i)),
    ...skill.map((u,i)=>gvMove(u,gvSecondaryPassRoute(u,dir,assignmentHash(`${evt.id}|def-skill|${i}`),12+(i%3)*3),pressureDur))
  ];

  if(shell==='zone'){
    support.push(...secondary.map((u,i)=>gvMove(u,[{x:u.x,y:u.y},gvZoneLandmark(u,built,i)],pressureDur)));
  }else{
    const man=gvManCoverageAssignments(built).filter(x=>secondary.includes(x.defender));
    support.push(...man.map((pair,i)=>gvMove(pair.defender,[{x:pair.defender.x,y:pair.defender.y},{x:pair.receiver.x+dir*10,y:pair.receiver.y+(i%2?3:-3)}],pressureDur)));
  }

  evt.passProtectionOutcome={pocket:pressureOutcome,failureBlocker:failurePair?.blocker?.role||null,failureRusher:defender?.role||failurePair?.defender?.role||null,resolution:gvProtectionResolution(pressureOutcome,true,0)};

  const featuredPressure=failurePair&&failurePair.defender===defender
    ?gvPocketAssignmentMotion(failurePair,built,pressureOutcome,pressureDur,assignmentHash(`${evt.id}|featured-pressure`),true,0)
    :gvMove(defender,pressurePath,pressureDur);
  if(qb&&['edge-leak','interior-push','hit-release','collapse-sack'].includes(pressureOutcome)){
    const adjust=gvQbPocketAdjustment(qb,built,pressureOutcome,dir);
    if(adjust.length>1)support.push(gvMove(qb,adjust,pressureDur));
  }
  await Promise.allSettled([...support,featuredPressure]);

  if(type==='def_sack'&&qb){
    gvImpactAt(qb.x,qb.y,true);qb.el.classList.add('hit','tackled');
    gvSetPossession(qb);
    gvTerminalPossessionAudit(evt,'sack','offense',{carrier:qb?.playerId||qb?.role||null});
    gvTerminalBallAudit(evt,'possessed',{owner:'offense',carrier:'QB'});
    await gvPulseUnit(qb,'SACK',760);await gvSackKnockback(qb,defender,built.formation.dir,560);
    gvTerminalFrameAudit(evt,'sack',[qb,defender],{qbKnockbackComplete:true,postWhistlePursuitSuppressed:true});
  }else if(type==='def_qb_hit'&&qb){
    gvImpactAt(qb.x,qb.y,false);qb.el.classList.add('hit');gvSetPossession(qb);
    gvTerminalPossessionAudit(evt,'qb_hit','offense',{carrier:qb?.playerId||qb?.role||null});
    gvTerminalBallAudit(evt,'possessed',{owner:'offense',carrier:'QB'});
    const a=qb.el.animate([{filter:'brightness(1)'},{filter:'brightness(1.45)',offset:.35},{filter:'brightness(1)'}],{duration:380,easing:'ease-out'});gvActorAnimations.push(a);await a.finished.catch(()=>{});
    gvTerminalFrameAudit(evt,'qb-hit',[qb,defender],{postWhistlePursuitSuppressed:true});
  }else if(type==='def_run_stop'&&rb){
    const stop={x:built.formation.los+dir*3,y:rb.y};
    await Promise.allSettled([gvMove(rb,[{x:rb.x,y:rb.y},stop],impactDur),gvMove(defender,[{x:defender.x,y:defender.y},stop],impactDur)]);
    gvImpactAt(stop.x,stop.y,true);rb.el.classList.add('tackled');
  }else if(type==='def_breakup'){
    const rec=gvUnit(built,'offense','WR',0)||gvUnit(built,'offense','TE');
    if(rec&&qb){
      const catchPt={x:rec.x+dir*12,y:rec.y},ball=gvMakeBall(qb.x,qb.y);
      await Promise.allSettled([
        gvMove(rec,[{x:rec.x,y:rec.y},catchPt],impactDur+500),
        gvMove(defender,[{x:defender.x,y:defender.y},{x:catchPt.x-dir*1,y:catchPt.y}],impactDur+500),
        gvBallMove(ball,[{x:qb.x,y:qb.y,rot:0},{x:(qb.x+catchPt.x)/2,y:(qb.y+catchPt.y)/2-5,rot:180},catchPt],impactDur+500)
      ]);
      gvImpactAt(catchPt.x,catchPt.y,false);if(ball?.el)ball.el.remove();
    }
  }
}

async function gvAnimateDefReturn(evt,built,totalDuration,type){
  const defender=built.scorer||built.units.find(u=>u.side==='defense');
  if(!defender)return;
  const dir=built.formation.dir,{name,index}=gvDefReturnConcept(evt),seed=assignmentHash(`${evt.id}|def-return|${index}`);
  const qb=gvUnit(built,'offense','QB'),rb=gvUnit(built,'offense','RB'),wr=gvUnit(built,'offense','WR',0);
  const off=built.units.filter(u=>u.side==='offense'),def=built.units.filter(u=>u.side==='defense'&&u!==defender);
  const isIntPlay=type==='def_int'||type==='def_int_td'||type==='def_interception'||type==='def_2pt_int';
  // v0.4.40: turnovers need enough time to read as a pass, interception, transition,
  // and return rather than one compressed animation.
  const setupDur=isIntPlay?Math.max(1150,gvPhaseDur(totalDuration,.28,1150)):gvPhaseDur(totalDuration,.26,950);
  const baseReturnDur=isIntPlay?Math.max(2100,gvPhaseDur(totalDuration,.46,2100)):gvPhaseDur(totalDuration,.42,1750);
  const finishDur=isIntPlay?Math.max(700,gvPhaseDur(totalDuration,.16,700)):gvPhaseDur(totalDuration,.16,650);

  let turnoverSpot={x:defender.x,y:defender.y};

  if(isIntPlay){
    const target=wr||rb||off.find(u=>u!==qb);
    if(qb&&target){
      const fullRoute=gvRoutePath({x:target.x,y:target.y},dir,gvRouteVariant(evt,target.role||'WR'),15+(seed%10));
      // Roughly 60% of INTs happen before the target reaches the synthetic route end.
      // This makes the defender cut through the route and catch while moving.
      const catchInStride=simRand(seed,1207)<.60;
      const frac=catchInStride?(.56+simRand(seed,1208)*.25):1;
      const seg=Math.max(1,Math.min(fullRoute.length-1,Math.floor((fullRoute.length-1)*frac)));
      const a=fullRoute[seg-1]||fullRoute[0],b=fullRoute[seg]||fullRoute.at(-1);
      const local=(frac*(fullRoute.length-1))-Math.floor(frac*(fullRoute.length-1));
      turnoverSpot=catchInStride?{
        x:a.x+(b.x-a.x)*Math.max(.18,local),
        y:a.y+(b.y-a.y)*Math.max(.18,local)
      }:fullRoute.at(-1);
      const intRoute=[];
      for(let i=0;i<seg;i++)intRoute.push(fullRoute[i]);
      intRoute.push(turnoverSpot);
      // QB retains the carried football throughout the setup/dropback.
      // Independent ball flight begins only after the QB reaches the actual release point.
      gvSetPossession(qb);
      const blockers=gvOffensiveBlockers(built.units).filter(u=>u!==target);
      const otherRoutes=off.filter(u=>u!==qb&&u!==target&&!blockers.includes(u));
      const secondary=def.filter(u=>u!==defender);
      const qbDrop={x:qb.x-dir*5,y:qb.y};
      const preCatch={x:turnoverSpot.x-dir*(catchInStride?3.2:1.5),y:gvClamp(turnoverSpot.y+(seed%2?2.5:-2.5),8,92)};
      const setup=[
        gvMove(qb,[{x:qb.x,y:qb.y},qbDrop],setupDur),
        gvMove(target,intRoute,setupDur),
        gvMove(defender,[
          {x:defender.x,y:defender.y},
          {x:defender.x+(preCatch.x-defender.x)*.48,y:defender.y+(preCatch.y-defender.y)*.42},
          preCatch
        ],setupDur),
        ...blockers.map((u,i)=>gvMove(u,[{x:u.x,y:u.y},{x:u.x+dir*1.5,y:u.y+(i%2?1:-1)*1.4}],setupDur)),
        ...otherRoutes.map((u,i)=>gvMove(u,gvSecondaryPassRoute(u,dir,assignmentHash(`${evt.id}|int-route|${i}`),10+(i%3)*3),setupDur)),
        ...secondary.map((u,i)=>gvMove(u,[{x:u.x,y:u.y},gvZoneLandmark(u,built,i)],setupDur))
      ];
      await Promise.allSettled(setup);

      const release={x:qb.x,y:qb.y},flightDur=Math.max(820,gvPhaseDur(totalDuration,.18,820));
      gvClearPossession();
      gvTerminalBallAudit(evt,'released',{owner:null,from:'QB',turnoverSetup:true,releasePoint:{...release}});
      const ball=gvMakeBall(release.x,release.y);
      gvBallContinuityAudit(evt,'interception-release','free',{releasePoint:{...release}});
      evt.interceptionBallContinuity={carriedThroughDrop:true,releaseAtCurrentQb:true,releasePoint:{...release}};
      // The interceptor closes the last few yards while the football is arriving,
      // so some interceptions are visibly made in stride rather than after a stop.
      await Promise.allSettled([
        gvBallMove(ball,[
          {x:release.x,y:release.y,rot:0},
          {x:(release.x+turnoverSpot.x)/2,y:(release.y+turnoverSpot.y)/2-5,rot:180},
          {x:turnoverSpot.x,y:turnoverSpot.y,rot:360}
        ],flightDur),
        gvMove(defender,[{x:defender.x,y:defender.y},turnoverSpot],flightDur,'ease-in-out')
      ]);
      await gvResolveInterceptionArrival(evt,defender,target,turnoverSpot,dir,ball,Math.max(totalDuration,4600));
      if(qb)await gvQbAngrySteam(qb,1050);
      evt.interceptionAnimation={catchInStride,routeFraction:Number(frac.toFixed(2)),extended:true,qbSteam:true};
      if(ball?.el)ball.el.remove();
    }
  }else{
    const carrier=evt?.stripSack?(qb||rb||wr):(rb||qb||wr);
    if(carrier){
      const contactSpot={x:gvClamp(carrier.x+dir*2.2,5,95),y:carrier.y};
      const looseSpot={
        x:gvClamp(contactSpot.x+dir*(1.8+simRand(seed,1501)*2.2),5,95),
        y:gvClamp(contactSpot.y+(simRand(seed,1502)>.5?1:-1)*(2.5+simRand(seed,1503)*3.2),7,93)
      };
      turnoverSpot=looseSpot;
      gvSetPossession(carrier);
      // First show the offensive player reaching the contact point while the
      // defender closes. Then possession is visibly broken and the ball is loose.
      await Promise.allSettled([
        gvMove(carrier,[{x:carrier.x,y:carrier.y},contactSpot],Math.max(600,setupDur*.62)),
        gvMove(defender,[{x:defender.x,y:defender.y},{x:contactSpot.x-dir*.7,y:contactSpot.y}],Math.max(600,setupDur*.62))
      ]);
      gvClearPossession();gvImpactAt(contactSpot.x,contactSpot.y,true);
      if(evt?.stripSack)await gvMomentLabel(contactSpot.x,contactSpot.y,'STRIP SACK','breakup',760);
      gvTerminalBallAudit(evt,'loose',{owner:null,phase:'fumble'});
      const ball=gvMakeBall(contactSpot.x,contactSpot.y);
      gvBallContinuityAudit(evt,'fumble-loose','free',{owner:null});
      await Promise.allSettled([
        gvBallMove(ball,[contactSpot,{x:(contactSpot.x+looseSpot.x)/2,y:(contactSpot.y+looseSpot.y)/2-1.8},looseSpot],520),
        gvLooseBallIndicator(looseSpot.x,looseSpot.y,'FUMBLE',820)
      ]);
      carrier.el.classList.add('tackled');
      // Recovery is a second readable beat: defender reaches the loose football,
      // then receives possession and a recovery pulse before the return begins.
      await gvMove(defender,[{x:defender.x,y:defender.y},looseSpot],Math.max(520,setupDur*.46),'ease-in-out');
      gvSetPossession(defender);
      gvBallContinuityAudit(evt,'fumble-recovery','carried',{owner:'defense'});
      gvTerminalPossessionAudit(evt,'fumble','defense',{carrier:defender?.playerId||defender?.role||null});
      gvTerminalBallAudit(evt,'possessed',{owner:'defense',recovered:true});
      await gvPulseUnit(defender,'RECOVERY',620);
      const recoveryHandoff=gvPhaseHandoffPoint(defender);
      gvTerminalFrameAudit(evt,'fumble-recovery',[carrier,defender],{recoveryReadable:true});
      gvPhaseHandoffAudit(evt,'loose-ball-to-recovery',defender,looseSpot,recoveryHandoff,.8);
      if(ball?.el)ball.el.remove();
      evt.fumbleAnimation={visibleLooseBall:true,recoveryHighlighted:true};
    }
  }

  // v0.4.52: use observed return-yard scoring data directly. UCL scores
  // interception return yardage at 0.02 points/yard, and Sleeper's raw stat
  // delta tells us whether the fantasy points came from INT or fumble return yards.
  const observedReturnYards=Math.max(0,gvEventStatYards(evt));
  const returnGain=observedReturnYards>0?gvClamp(observedReturnYards*.8,0,68):0;
  const returnDur=gvTurnoverReturnDuration(baseReturnDur,observedReturnYards,isIntPlay);
  let returnPath=gvReturnLanePath(defender,-dir,seed,returnGain);
  returnPath=gvGuardNonTouchdownEndzone(returnPath,evt,built,-dir);
  evt.turnoverReturnVisual={
    yards:observedReturnYards,
    fieldUnits:Number(returnGain.toFixed(2)),
    durationMs:Math.round(returnDur),
    statDriven:observedReturnYards>0,
    distanceAndTimeScaled:true
  };
  const finish=returnPath.at(-1);

  const escort=def.map((u,i)=>{
    const lane={x:finish.x+dir*(2+(i%3)*2),y:gvClamp(finish.y+(i%2?1:-1)*(4+(i%4)*2),10,90)};
    let path=[{x:u.x,y:u.y},{x:(u.x+lane.x)/2,y:gvClamp((u.y+lane.y)/2,10,90)},lane];
    // Escorts may organize after the turnover, but should not teleport across
    // the field to form a convoy around the returner.
    path=gvReactionBudgetPath(path,u.role,'turnover',i,7.0+(i%3)*.5);
    return gvMove(u,path,returnDur+(i%3)*60);
  });
  const returnTacklers=new Set(gvLikelyTerminalTacklers(off,returnPath,-dir,2));
  if(evt)evt.turnoverPursuit={maxClosers:2,reactionBudget:true};
  const chase=off.map((u,i)=>{
    let path=gvCollapseToBallPath(u,finish,-dir,assignmentHash(`${evt.id}|return-chase|${i}`));
    if(!returnTacklers.has(u))path=gvReactionBudgetPath(path,u.role,'turnover',i);
    return gvMove(u,path,returnDur+(i%4)*45);
  });
  gvPhaseHandoffAudit(evt,isIntPlay?'interception-to-return':'recovery-to-return',defender,gvPhaseHandoffPoint(defender),returnPath?.[0]||gvPhaseHandoffPoint(defender),.35);
  gvBallContinuityAudit(evt,isIntPlay?'interception-return-start':'fumble-return-start','carried',{owner:'defense'});
  const runner=gvMove(defender,returnPath,returnDur);

  await Promise.allSettled([runner,...escort,...chase]);

  const isDef2pt=type==='def_2pt_int'||type==='def_2pt_fumble'||Number(evt?.intervalAnalysis?.stats?.def_2pt||0)>0;
  const isDefTd=type==='def_int_td'||type==='def_fum_td'||Number(evt?.intervalAnalysis?.stats?.def_td||0)>0||isDef2pt;
  gvSetPossession(defender);
  gvTerminalPossessionAudit(evt,isIntPlay?'interception':'fumble','defense',{carrier:defender?.playerId||defender?.role||null,returnComplete:true});
  gvTerminalBallAudit(evt,'possessed',{owner:'defense',returnComplete:true});
  if(isDefTd){
    await gvExtendTouchdownToEndzone(evt,defender,built,-dir,Math.max(700,finishDur),isDef2pt?'defensive-two-point-return':'defensive-return-td');
    if(isDef2pt)await gvMomentLabel(defender.x,defender.y,'TWO POINTS!','catch',900);
    else await gvAnimateScorerCelebration(evt,defender,'celebration',totalDuration);
  }else{
    await gvAnimateContactFinish(evt,defender,off,-dir,totalDuration,'turnover-return');
  }
  gvTerminalFrameAudit(evt,isDefTd?'turnover-return-td':'turnover-return',[defender,...Array.from(returnTacklers).slice(0,2)],{returnerFrozen:true,maxTacklers:2});
}


function gvBurstVisualPlays(evt){
  const a=evt.intervalAnalysis||{},count=Math.max(2,Math.min(5,Number(a.count)||2)),stats=a.stats||{},family=a.family||'unknown';
  let totalYards=0,tds=0;
  if(family==='reception'){totalYards=Math.round(stats.rec_yd||0);tds=Math.round(stats.rec_td||0)}
  else if(family==='rb_run'||family==='qb_run'){totalYards=Math.round(stats.rush_yd||0);tds=Math.round(stats.rush_td||0)}
  else if(family==='qb_pass'){totalYards=Math.round(stats.pass_yd||0);tds=Math.round(stats.pass_td||0)}
  else if(family==='kick'){tds=0}
  const seed=assignmentHash(`${evt.id}|burst`);
  const weights=Array.from({length:count},(_,i)=>.7+simRand(seed,200+i)*.6);
  const sum=weights.reduce((a,b)=>a+b,0)||1;
  const yards=weights.map(w=>Math.round(totalYards*w/sum));
  let diff=totalYards-yards.reduce((a,b)=>a+b,0);
  let idx=0;
  while(diff!==0&&yards.length){
    yards[idx%yards.length]+=diff>0?1:-1;diff+=diff>0?-1:1;idx++;
  }
  const tdSlots=new Set();
  for(let i=0;i<Math.min(tds,count);i++)tdSlots.add((seed+i)%count);
  return yards.map((yd,i)=>({index:i+1,count,yards:yd,td:tdSlots.has(i),family}));
}
function gvBurstSubEvent(evt,play){
  const family=play.family;
  let detail='';
  if(family==='reception')detail=`Reception${play.td?' TD':''}`;
  else if(family==='rb_run'||family==='qb_run')detail=`Run${play.td?' TD':''}`;
  else if(family==='qb_pass')detail=`Pass${play.td?' TD':''}`;
  else if(family==='kick')detail='Field goal';
  else detail='Scoring play';
  const deltaPer=gvEventAnimationYards(evt,1.5)/Math.max(1,play.count);
  return {
    multiActor:!!evt.multiActor,
    qbName:evt.qbName||null,qbPlayerId:evt.qbPlayerId||null,
    receiverName:evt.receiverName||evt.name||null,receiverPlayerId:evt.receiverPlayerId||evt.playerId||null,
    receiverPos:evt.receiverPos||evt.pos||null,
    ...evt,
    id:`${evt.id}-part-${play.index}`,
    type:'play',
    source:gvNormalizeSourceValue(evt.source,evt),
    burstSource:true,
    delta:Number(deltaPer.toFixed(2)),
    detail,
    burstPart:true,
    burstIndex:play.index,
    burstCount:play.count,
    visualYards:play.yards,
    played:false
  };
}
async function playGameViewBurst(evt,replay=false,runnerManaged=false){
  if(!evt)return;
  if(!runnerManaged)gameViewPlaying=true;
  if(!replay&&typeof gvPlayMajorNotification==='function')gvPlayMajorNotification(evt);
  const parts=gvBurstVisualPlays(evt);
  const status=$('#gvStatus');
  for(const p of parts){
    if(status)status.textContent=`${evt.name} • ${p.index} of ${p.count}`;
    const sub=gvBurstSubEvent(evt,p);
    try{
      await playGameViewEvent(sub,true,true);
    }catch(error){
      sub.gameViewPlaybackError={message:String(error?.message||error),recovered:false,time:Date.now()};
      throw error;
    }
    await gvSleep(260);
  }
  if(!replay)gvMarkEventPlayed(evt);
  renderGameViewFeed();
  if(!runnerManaged)gameViewPlaying=false;
}

function gvWholePlayUnitSnapshot(built){
  return (built?.units||[]).map((u,i)=>({
    key:`${u.side}|${u.role}|${i}`,
    unit:u,
    side:u.side,
    role:u.role,
    x:Number(u.x),
    y:Number(u.y),
    moveDistance:Number(u._gvMoveDistance||0),
    moveCount:Number(u._gvMoveCount||0),
    motionConflicts:Number(u._gvMotionConflicts||0)
  }));
}
function gvWholePlayReliabilityAudit(evt,built,before=[],phase='post-action'){
  if(!evt)return null;
  const after=gvWholePlayUnitSnapshot(built);
  const beforeMap=new Map((before||[]).map(x=>[x.unit,x]));
  const moved=after.filter(a=>{
    const b=beforeMap.get(a.unit);
    return Number(a.moveDistance||0)>=.35 || (b&&Math.hypot(a.x-b.x,a.y-b.y)>.35);
  });
  const stationary=after.filter(a=>!moved.includes(a));
  const conflicts=after.reduce((n,a)=>n+Number(a.motionConflicts||0),0);
  const handoffs=Array.isArray(evt.phaseHandoffAudit)?evt.phaseHandoffAudit:[];
  const badHandoffs=handoffs.filter(h=>h&&h.continuous===false);
  const ballAudits=Array.isArray(evt.ballContinuityAudit)?evt.ballContinuityAudit:[];
  const badBallStates=ballAudits.filter(b=>b&&b.ok===false);
  const ball=gvBallContinuitySnapshot();
  const terminalPossession=evt.terminalPossessionAudit||null;
  const terminalFrame=evt.terminalFrameAudit||null;
  const scorer=built?.scorer||null;
  const scorerState=after.find(a=>a.unit===scorer)||null;
  const maxClosers=Number(
    evt?.pursuitArrival?.maxClosers ??
    evt?.specialTeamsFlowAudit?.maxTerminalTacklers ??
    2
  );

  const result={
    version:'0.4.79',
    phase,
    playType:String(evt?.playType||gvPlayType(evt)||''),
    unitCount:after.length,
    movedUnits:moved.length,
    stationaryUnits:stationary.length,
    stationaryRoles:stationary.map(x=>`${x.side}:${x.role}`),
    actionPlayerMoved:scorerState?scorerState.moveDistance>=.35:null,
    actionPlayerDistance:scorerState?Number(scorerState.moveDistance.toFixed(2)):null,
    motionConflicts:conflicts,
    noDuplicateMovementOwnership:conflicts===0,
    phaseHandoffsChecked:handoffs.length,
    badPhaseHandoffs:badHandoffs.length,
    maxPhaseJump:handoffs.length?Math.max(...handoffs.map(h=>Number(h?.jump||0))):0,
    phaseContinuityOk:badHandoffs.length===0,
    ballAuditsChecked:ballAudits.length,
    badBallStates:badBallStates.length,
    ballContinuityOk:badBallStates.length===0&&ball.valid,
    finalBallState:{free:ball.free,carried:ball.carried,total:ball.total},
    terminalPossessionOk:terminalPossession?terminalPossession.ok!==false:true,
    terminalFrameFrozen:terminalFrame?terminalFrame.whistleHardStop===true:true,
    maxClosers,
    lateMagnetCapOk:maxClosers<=2
  };
  result.ok=
    result.noDuplicateMovementOwnership &&
    result.phaseContinuityOk &&
    result.ballContinuityOk &&
    result.terminalPossessionOk &&
    result.terminalFrameFrozen &&
    result.lateMagnetCapOk;
  evt.wholePlayReliabilityAudit=result;
  return result;
}

async function gvPresentStatCorrection(evt){
  const pop=$('#gvPointsPop'),identity=$('#gvPlayerIdentity'),value=$('#gvPointsValue'),impact=$('#gvPointsImpactBreakdown'),detail=$('#gvPlayDetail'),context=$('#gvMatchupContext');
  const delta=Number(evt?.delta||0),lost=delta<0?delta:-Math.abs(delta||0);
  if(identity)identity.textContent=evt?.overturnedLabel||'STAT CORRECTION';
  if(value)value.textContent=`${lost.toFixed(2)} FPTS`;
  if(impact)impact.textContent='';
  if(detail)detail.textContent=evt?.removedPriorEvent?'PRIOR PLAY REMOVED':(evt?.correctionReason||'Sleeper scoring revision');
  if(context){
    if(gvIsAllTeamsMode())context.textContent='LEAGUE-WIDE GAMEVIEW';
    else if(evt?.leftScore!=null&&evt?.rightScore!=null&&Number.isFinite(Number(evt.leftScore))&&Number.isFinite(Number(evt.rightScore)))context.textContent=`UPDATED SCORE ${Number(evt.leftScore).toFixed(2)}–${Number(evt.rightScore).toFixed(2)}`;
  }
  if(pop){pop.classList.add('stat-correction');pop.hidden=false;pop.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.8)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:300,easing:'ease-out',fill:'forwards'});}
  if($('#gvStatus'))$('#gvStatus').textContent='STAT CORRECTION';
  await gvSleep(1700);
  if(pop){pop.hidden=true;pop.classList.remove('stat-correction');}
}

async function playGameViewEvent(evt,replay=false,runnerManaged=false){
  if(!evt)return;
  if(!replay&&typeof gvPlayMajorNotification==='function')gvPlayMajorNotification(evt);
  if(!runnerManaged)gameViewPlaying=true;clearGameViewEffects();renderGameViewScorebar();
  if(gvIsLikelyStatCorrection(evt)&&!evt?.correctionApplied){
    await gvPresentStatCorrection(evt);
    if(!replay)gvMarkPlayed(evt);
    if(!runnerManaged){gameViewPlaying=false;if(gameViewQueue.length||gameViewPending.length)setTimeout(playNextGameViewEvent,180)}return;
  }
  if(evt.testingForced&&typeof gvTestingRenderScorePhase==='function')gvTestingRenderScorePhase(evt,'pre');
  const field=$('#gameViewField'),pop=$('#gvPointsPop'),detail=$('#gvPlayDetail'),banner=$('#gvBanner');
  if(!field){if(!replay)gvMarkPlayed(evt);
  if(!runnerManaged)gameViewPlaying=false;return}
  $('#gvStatus').textContent=replay?`Replay • ${gvFeedSource(evt)}`:`${gvFeedSource(evt)} play`;
  const totalDuration=gvPlayDuration(evt,evt.playType||gvPlayType(evt));
const built=gvBuildUnits(evt);if(built?.formation?.label&&$('#gvStatus'))$('#gvStatus').textContent=built.formation.label;
  const wholePlayStart=gvWholePlayUnitSnapshot(built);
  gvRenderNflEndzones(evt,built);
  const initialType=evt.playType||gvPlayType(evt),initialQb=gvUnit(built,'offense','QB'),initialRb=gvUnit(built,'offense','RB');
  if(initialType==='rb_run')gvSetPossession(initialRb);
  else if(initialType==='qb_run'||initialType==='qb_pass'||initialType==='reception')gvSetPossession(initialQb);
  else if(gvIsKickAttemptType(initialType))gvSetPossession(built?.kickTeams?.snapper||null);
  else if(gvIsSpecialTeamsReturnType(initialType))gvSetPossession(built?.specialTeams?.kicker||initialQb);
  else if(initialType.startsWith('def_'))gvSetPossession(initialQb);
  if(built.scorer){const v=built.scorer.el.querySelector('.gv-unit-visual');if(v)v.animate([{transform:'scale(1)'},{transform:'scale(1.18)'},{transform:'scale(1)'}],{duration:320,easing:'ease-out'})}
  if(!gvIsSpecialTeamsReturnType(initialType)&&!gvIsKickAttemptType(initialType))await gvBasicSnapAndPlay(evt,built,totalDuration);
  await gvAnimateActionPlay(evt,built,totalDuration);
gvWholePlayReliabilityAudit(evt,built,wholePlayStart,'post-action');
  if(evt.testingForced&&typeof gvTestingRenderScorePhase==='function')gvTestingRenderScorePhase(evt,'post');
  const identity=$('#gvPlayerIdentity'),value=$('#gvPointsValue'),impact=$('#gvPointsImpactBreakdown'),context=$('#gvMatchupContext');
  const hasMultipleImpacts=gvEventHasMultipleFantasyImpacts(evt);
  if(identity)identity.textContent=evt.turnoverKind&&evt.offensivePlayerName&&evt.defensivePlayerName
    ?`${evt.offensivePlayerName} → ${evt.defensivePlayerName}`
    :evt.multiActor&&(evt.passerName||evt.qbName)&&evt.receiverName
      ?`${evt.passerName||evt.qbName} (${evt.passerPos||evt.qbPos||'QB'}) → ${evt.receiverName} (${evt.receiverPos||'REC'})`
      :`${evt.name||'Unknown Player'} (${evt.pos||'—'})`;
  pop.classList.toggle('multi-impact',hasMultipleImpacts);
  if(value)value.textContent=hasMultipleImpacts
    ?(gvEventHasCrossRosterImpacts(evt)?'ONE PLAY':'MULTI IMPACT')
    :`${gvEventPrimaryImpactText(evt)} FPTS`;
  if(impact){
    if(hasMultipleImpacts){
      impact.innerHTML=evt.fantasyImpacts.map(x=>{
        const d=Number(x?.delta||0),pos=String(x?.pos||'').toUpperCase();
        return `<span class="gv-impact-line"><b class="gv-impact-name">${esc(x?.name||x?.role||'Player')}${pos?` <i>(${esc(pos)})</i>`:''}</b><strong class="gv-impact-fpts">${d>=0?'+':''}${d.toFixed(2)} FPTS</strong></span>`;
      }).join('');
    }else impact.textContent='';
  }
  if(detail)detail.textContent=gvPlayLabel(evt)||evt.detail||'';
  if(context){
    const scoreContext=!replay&&(evt.testingForced||['medium','celebration','huge'].includes(String(evt.tier||'')))?gvEventScoreContext(evt):'';
    context.textContent=scoreContext;
    context.classList.toggle('lead-change',/TAKES THE LEAD|MATCHUP IS NOW TIED/i.test(scoreContext));
    context.classList.toggle('edge-extension',/EXTENDS THE EDGE/i.test(scoreContext));
  }
  pop.hidden=false;
  pop.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.55)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.12)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:420,easing:'ease-out',fill:'forwards'});
  const playType=evt.playType||gvPlayType(evt);
  const isTouchdown=gvIsTouchdownEvent(evt,playType);
  const isSack=playType==='def_sack';
  if(evt.tier==='medium')field.classList.add('impact-medium');
  if(isTouchdown||isSack){
    const tdBanner=playType==='def_int_td'?'PICK SIX':playType==='def_fum_td'?'SCOOP AND SCORE':['def_kick_ret_td','def_punt_ret_td'].includes(playType)?'KICK SIX':'TOUCHDOWN!';
    banner.textContent=isTouchdown?tdBanner:'SACK!';
    banner.classList.add(isTouchdown?'touchdown':'sack');
    banner.hidden=false;
    if(isTouchdown)makeConfetti(evt.tier==='huge'?82:64);
    field.classList.add(evt.tier==='huge'?'impact-huge':'impact-medium');
    banner.animate([
      {opacity:0,transform:'translateX(-50%) scale(.55)'},
      {opacity:1,transform:'translateX(-50%) scale(1.12)'},
      {opacity:1,transform:'translateX(-50%) scale(1)'}
    ],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});
  }else if(evt.tier==='celebration'||evt.tier==='huge'){
    banner.textContent=evt.tier==='huge'?'MONSTER PLAY':'BIG PLAY';banner.classList.add('big-play');banner.hidden=false;
    makeConfetti(evt.tier==='huge'?70:42);
    field.classList.add(evt.tier==='huge'?'impact-huge':'impact-medium');
    banner.animate([{opacity:0,transform:'translateX(-50%) scale(.7)'},{opacity:1,transform:'translateX(-50%) scale(1.05)'},{opacity:1,transform:'translateX(-50%) scale(1)'}],{duration:420,easing:'ease-out',fill:'forwards'});
  }
// v0.4.45: hold the completed, motionless field picture for two extra seconds
  // while the play-stat popup is visible. The action animation has already finished
  // at this point, so this is a true post-play reading pause rather than slow motion.
  const gvPostPlayReadPause=2000;
  await gvSleep(gvPostPlayReadPause+(evt.tier==='huge'?900:evt.tier==='celebration'?700:500));
  await gvExitFormation();
  clearGameViewEffects();$('#gvStatus').textContent='Waiting for scoring';
  if(!runnerManaged)gameViewPlaying=false;
  gvActorAnimations=[];
  if(!replay){
    // v0.4.45: a completed animation must retire its persistent queue entry and
    // immediately become replayable in the GameView Feed. Earlier builds only
    // did this for bursts, leaving ordinary plays permanently marked unplayed.
    gvMarkEventPlayed(evt);
    renderGameViewFeed();
    if(!runnerManaged){
      if(gameViewQueue.length||gameViewPending.length)setTimeout(playNextGameViewEvent,260);
      else playNextGameViewEvent();
    }
  }
}

function cancelGameViewPlayback(blank=true){
  gameViewQueue.length=0;
  gameViewPending.length=0;
  if(gameViewPendingTimer){clearTimeout(gameViewPendingTimer);gameViewPendingTimer=null}
  gameViewCorrelationWindow.length=0;
  gvActiveMotionFrames.forEach(id=>{try{cancelAnimationFrame(id)}catch(e){}});
  gvActiveMotionFrames.clear();
  gameViewPlaying=false;
  clearGameViewEffects(blank);
}

function gvRecoverPlaybackFailure(evt,error,runnerManaged=false){
  const message=String(error?.message||error||'GameView playback error');
  if(evt){
    evt.gameViewPlaybackError={message,recovered:true,time:Date.now()};
  }
  gvActiveMotionFrames.forEach(id=>{try{cancelAnimationFrame(id)}catch(e){}});
  gvActiveMotionFrames.clear();
  try{clearGameViewEffects()}catch(e){}
  if(!runnerManaged)gameViewPlaying=false;
  gvActorAnimations=[];
  const status=$('#gvStatus');
  if(status)status.textContent='Waiting for scoring';
  // Do not let a broken play block a tandem/burst/next queued event.
  if(!runnerManaged&&(gameViewQueue.length||gameViewPending.length))setTimeout(playNextGameViewEvent,260);
  return {recovered:true,message};
}

function playNextGameViewEvent(){
  if(gameViewPlaying)return;
  if(!gameViewQueue.length){
    if(gameViewPending.length)gvSchedulePendingFlush();
    return;
  }

  let evt=null;
  while(gameViewQueue.length&&!evt){
    const candidate=gameViewQueue.shift();
    if(!candidate)continue;

    // A queue item may only be automatically dispatched once.
    if(gvWasAutomaticallyDispatched(candidate))continue;

    // Protect the renderer from a recently claimed equivalent event.
    if(gvPlaybackAlreadyClaimed(candidate))continue;

    gvClaimAutomaticDispatch(candidate);
    gvClaimPlayback(candidate);
    evt=candidate;
  }

  if(!evt){
    if(gameViewPending.length)gvSchedulePendingFlush();
    return;
  }

  // One runner owns the playback lock for the full event/burst lifetime.
  gameViewPlaying=true;
  const playback=evt?.type==='burst'
    ?playGameViewBurst(evt,false,true)
    :playGameViewEvent(evt,false,true);

  Promise.resolve(playback)
    .catch(error=>gvRecoverPlaybackFailure(evt,error,true))
    .finally(()=>{
      gameViewPlaying=false;
      gvActorAnimations=[];
      if(gameViewQueue.length||gameViewPending.length)setTimeout(playNextGameViewEvent,260);
    });
}
function renderGameView(){bindGameViewTeamControls();renderGameViewScorebar();renderGameViewFeed();if(!gameViewPlaying)clearGameViewEffects(true)}

function render(){bindWatchControls();bindGameViewTeamControls();if(currentView==='scores')renderScoresView();const pair=chosenPair();renderRibbon();renderWatchBar(pair);if(!pair){$('#hero').innerHTML='<div class="empty">Sleeper has not published a paired matchup for this week yet.</div>';$('#lineups').innerHTML='';$('#events').innerHTML='';$('#flow').innerHTML='';if($('#momentum'))$('#momentum').innerHTML='';if($('#scoreHistory'))$('#scoreHistory').innerHTML='';return}renderHero(pair);renderLineups(pair);renderEvents(pair);renderFlow(pair);renderMomentum(pair);renderScoreHistory(pair);renderGameViewScorebar();renderGameViewFeed()}


function selectableTeamIds(){const sel=$('#teamSelect');return sel?[...sel.options].map(o=>String(o.value)).filter(Boolean):rosters.map(r=>String(r.roster_id))}
function cycleSelectedTeam(step=1){
  const ids=selectableTeamIds();if(!ids.length)return;
  if(currentView==='gameview'&&gvIsAllTeamsMode()){gvSetAllTeamsMode(false);if(currentView==='gameview')renderGameView();return}
  const current=String($('#teamSelect')?.value||ids[0]),idx=Math.max(0,ids.indexOf(current)),next=ids[(idx+step+ids.length)%ids.length];selectPreferredTeam(next);if(currentView==='gameview')renderGameView()
}
function gvTeamPickerRender(){
  const menu=$('#gvTeamPickerMenu'),label=$('#gvViewingTeamLabel'),btn=$('#gvViewingTeamBtn');if(!menu)return;
  const current=String($('#teamSelect')?.value||''),all=gvIsAllTeamsMode();
  if(label)label.textContent=all?'All Teams':teamName(rosterFor(current));
  const allButton=`<button type="button" role="option" aria-selected="${all?'true':'false'}" data-gv-all-teams="1" class="${all?'active':''}">All Teams</button>`;
  menu.innerHTML=allButton+selectableTeamIds().map(rid=>{
    const roster=rosterFor(rid),name=teamName(roster),active=!all&&String(rid)===current;
    return `<button type="button" role="option" aria-selected="${active?'true':'false'}" data-gv-team-id="${esc(String(rid))}" class="${active?'active':''}">${esc(name)}</button>`;
  }).join('');
  if(btn)btn.setAttribute('aria-expanded',menu.hidden?'false':'true');
}
function gvTeamPickerClose(){
  const menu=$('#gvTeamPickerMenu'),btn=$('#gvViewingTeamBtn');if(menu)menu.hidden=true;if(btn)btn.setAttribute('aria-expanded','false');
}
function gvTeamPickerToggle(){
  const menu=$('#gvTeamPickerMenu'),btn=$('#gvViewingTeamBtn');if(!menu)return;
  gvTeamPickerRender();menu.hidden=!menu.hidden;if(btn)btn.setAttribute('aria-expanded',menu.hidden?'false':'true');
}
function bindGameViewTeamControls(){
  const prev=$('#gvPrevTeamBtn'),next=$('#gvNextTeamBtn'),btn=$('#gvViewingTeamBtn');
  if(prev&&!prev.dataset.bound){prev.dataset.bound='1';prev.onclick=()=>{gvTeamPickerClose();cycleSelectedTeam(-1)}}
  if(next&&!next.dataset.bound){next.dataset.bound='1';next.onclick=()=>{gvTeamPickerClose();cycleSelectedTeam(1)}}
  if(btn&&!btn.dataset.bound){btn.dataset.bound='1';btn.onclick=e=>{e.stopPropagation();gvTeamPickerToggle()}}
  gvTeamPickerRender();
}
function bindWatchControls(){
  const prev=$('#prevMatchupBtn'),next=$('#nextMatchupBtn');
  if(prev&&!prev.dataset.bound){prev.dataset.bound='1';prev.onclick=()=>cycleSelectedTeam(-1)}
  if(next&&!next.dataset.bound){next.dataset.bound='1';next.onclick=()=>cycleSelectedTeam(1)}
}

class SleeperRequestError extends Error{constructor(message,endpoint='',status=0,cause=null){super(message);this.name='SleeperRequestError';this.endpoint=endpoint;this.status=Number(status)||0;this.isSleeperRequestError=true;if(cause)this.cause=cause}}
function sleeperEndpointLabel(url){try{const u=new URL(url);return `${u.hostname}${u.pathname}`}catch(_){return String(url||'Sleeper API')}}
async function get(url){
  if(!liveLoadingEnabled())throw new Error('Live Sleeper loading is disabled in GameDay Settings');
  const endpoint=sleeperEndpointLabel(url);let r;
  try{r=await fetch(url,{cache:'no-store'})}catch(cause){throw new SleeperRequestError('Network request failed',endpoint,0,cause)}
  if(!r.ok)throw new SleeperRequestError(`HTTP ${r.status}${r.statusText?` ${r.statusText}`:''}`,endpoint,r.status);
  try{return await r.json()}catch(cause){throw new SleeperRequestError('Sleeper returned unreadable data',endpoint,r.status,cause)}
}
async 