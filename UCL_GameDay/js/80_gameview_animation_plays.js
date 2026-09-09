/* UCL GameDay v0.5.03 — build fragment: 80_gameview_animation_plays.js
   This file is concatenated in manifest order into the app's single lexical scope.
   It is intentionally not loaded independently in the browser. */
function gvRbBlockingPlan(concept,built,dir){
  const lineRoles=['LT','LG','C','RG','RT','TE'];
  const side=(concept.includes('left')?-1:concept.includes('right')?1:0);
  return built.units.filter(u=>u.side==='offense'&&lineRoles.includes(u.role)).map((u,i)=>{
    let tx=u.x+dir*4, ty=u.y;
    if(['outside-zone-left','stretch-left','toss-left','sweep-left','bounce-left'].includes(concept)){ty-=6+i*.4;tx+=dir*2}
    if(['outside-zone-right','stretch-right','toss-right','sweep-right','bounce-right'].includes(concept)){ty+=6-i*.4;tx+=dir*2}
    if(concept.startsWith('power-')||concept.startsWith('counter-')){ty+=side*(i<3?5:2);tx+=dir*(i===1?6:3)}
    if(concept.startsWith('trap-')){ty+=side*(i===1?9:2)}
    return {u,tx,ty}
  });
}

async function gvEngagePair(off,def,duration){
  if(!off||!def)return;
  const mx=(off.x+def.x)/2,my=(off.y+def.y)/2,link=gvDrawEngagement(off,def);
  off.el.classList.add('engaged');def.el.classList.add('engaged');
  await Promise.all([
    gvMove(off,[{x:off.x,y:off.y},{x:mx-.8,y:my}],duration),
    gvMove(def,[{x:def.x,y:def.y},{x:mx+.8,y:my}],duration)
  ]);
  gvContact(off,def,false);
  if(link)link.remove();
  off.el.classList.remove('engaged');def.el.classList.remove('engaged');
}
function gvClosest(unit,list,count=1){
  return list.slice().sort((a,b)=>Math.hypot(a.x-unit.x,a.y-unit.y)-Math.hypot(b.x-unit.x,b.y-unit.y)).slice(0,count);
}



function gvFrontSeven(units){
  return units.filter(u=>u.side==='defense'&&['EDGE','DE','DT','NT','LB'].includes(u.role));
}
function gvOffensiveBlockers(units){
  return units.filter(u=>u.side==='offense'&&['LT','LG','C','RG','RT','TE'].includes(u.role));
}
function gvNearestByY(source,target,count=1){
  return source.slice().sort((a,b)=>Math.abs(a.y-target.y)-Math.abs(b.y-target.y)||Math.abs(a.x-target.x)-Math.abs(b.x-target.x)).slice(0,count);
}



function gvRunFitRole(defender,concept,laneRead,built,index=0){
  const family=gvRunConceptFamily(concept),side=gvRunConceptSide(concept);
  const role=String(defender?.role||'');
  if(['EDGE','DE'].includes(role)){
    if(family==='outside-zone'||family==='sweep'||family==='off-tackle')return side&&((defender.y<50?-1:1)===side)?'force':'backside-contain';
    return 'contain';
  }
  if(role==='LB'){
    if(laneRead?.read==='cutback')return index%2===0?'cutback':'fill';
    if(laneRead?.read==='bounce')return index%2===0?'spill':'force';
    if(laneRead?.read==='penetration')return 'downhill';
    return index%3===0?'fill':index%3===1?'scrape':'cutback';
  }
  if(['S','FS','SS','DB','CB'].includes(role)){
    if(laneRead?.read==='bounce')return 'alley';
    if(laneRead?.read==='cutback')return 'overlap';
    return 'pursuit';
  }
  return 'pursuit';
}
function gvRunFitPath(defender,finish,concept,laneRead,built,index=0){
  const dir=built.formation.dir,side=gvRunConceptSide(concept)||(finish.y>=defender.y?1:-1);
  const fit=gvRunFitRole(defender,concept,laneRead,built,index),start={x:defender.x,y:defender.y};
  const los=Number(built.formation.los||50);
  if(fit==='force'){
    const edgeY=side<0?22:78;
    return [start,{x:los-dir*1.5,y:edgeY},{x:finish.x-dir*4,y:gvClamp(finish.y+side*5,8,92)}];
  }
  if(fit==='backside-contain'||fit==='contain'){
    const containY=(defender.y<50?-1:1)*1;
    return [start,{x:los-dir*2,y:gvClamp(defender.y+containY*4,8,92)},{x:finish.x-dir*6,y:gvClamp(defender.y+containY*2,8,92)}];
  }
  if(fit==='cutback'){
    const y=laneRead?.side?50-laneRead.side*10:50;
    return [start,{x:los+dir*2,y},{x:finish.x-dir*3,y:gvClamp((y+finish.y)/2,8,92)}];
  }
  if(fit==='fill'||fit==='downhill'){
    const targetY=gvClamp(laneRead?.side<0?42:laneRead?.side>0?58:finish.y,10,90);
    return [start,{x:los+dir*1.5,y:targetY},{x:finish.x-dir*2,y:finish.y}];
  }
  if(fit==='scrape'){
    const y=gvClamp(defender.y+side*6,8,92);
    return [start,{x:los-dir*.5,y},{x:finish.x-dir*3,y:gvClamp((y+finish.y)/2,8,92)}];
  }
  if(fit==='spill'){
    const y=gvClamp(finish.y-side*5,8,92);
    return [start,{x:los+dir*.5,y},{x:finish.x-dir*2,y}];
  }
  if(fit==='alley'){
    const y=gvClamp(finish.y+side*3,8,92);
    return [start,{x:(start.x+finish.x)/2,y:(start.y+y)/2},{x:finish.x-dir*1.5,y}];
  }
  if(fit==='overlap'){
    const y=gvClamp(50-side*8,8,92);
    return [start,{x:(start.x+los)/2,y},{x:finish.x-dir*2,y:gvClamp((y+finish.y)/2,8,92)}];
  }
  return [start,{x:(start.x+finish.x)/2,y:(start.y+finish.y)/2},{x:finish.x-dir*2.5,y:finish.y}];
}

function gvRunSecondLevelFlowPath(defender,path,concept,laneRead,built,index=0){
  if(!defender||!Array.isArray(path)||path.length<2)return [{x:defender?.x||50,y:defender?.y||50}];
  const dir=built.formation.dir,finish=path.at(-1),start={x:defender.x,y:defender.y};
  const side=gvRunConceptSide(concept)||(finish.y>=50?1:-1);
  const fit=gvRunFitRole(defender,concept,laneRead,built,index);
  if(defender.role==='LB'){
    if(fit==='scrape'){
      const scrapeY=gvClamp(start.y+side*8,8,92);
      return [start,{x:built.formation.los-dir*.8,y:scrapeY},{x:(built.formation.los+finish.x)/2,y:gvClamp((scrapeY+finish.y)/2,8,92)},{x:finish.x-dir*2.8,y:finish.y}];
    }
    if(fit==='cutback'){
      const cutY=gvClamp(50-side*10,8,92);
      return [start,{x:built.formation.los+dir*.5,y:cutY},{x:finish.x-dir*4,y:gvClamp((cutY+finish.y)/2,8,92)}];
    }
    if(fit==='fill'||fit==='downhill'||fit==='spill'){
      const key=path[Math.min(2,path.length-1)]||finish;
      return [start,{x:built.formation.los+dir*1.2,y:gvClamp((start.y+key.y)/2,8,92)},{x:finish.x-dir*2.2,y:finish.y}];
    }
  }
  if(['S','FS','SS','DB','CB'].includes(defender.role)){
    const alleyY=gvClamp(finish.y+side*(index%2?4:-3),8,92);
    return [start,{x:(start.x+finish.x)/2,y:gvClamp((start.y+alleyY)/2,8,92)},{x:finish.x-dir*(2.5+(index%3)*1.1),y:alleyY}];
  }
  return gvRunFitPath(defender,finish,concept,laneRead,built,index);
}
function gvReactiveRunPursuitPath(defender,path,decisionTiming,concept,laneRead,built,index=0){
  if(!defender||!Array.isArray(path)||path.length<2)return [{x:defender?.x||50,y:defender?.y||50}];
  const dir=built.formation.dir,start={x:defender.x,y:defender.y},los=Number(built.formation.los||50);
  const role=String(defender.role||'').toUpperCase(),finish=path.at(-1);
  const ci=Math.max(1,Math.min(path.length-1,Number(decisionTiming?.commitIndex)||Math.min(2,path.length-1)));
  const press=path[Math.max(1,ci-1)]||path[1],commit=path[ci]||finish;
  const laneOrder=[0,-1,1,-2,2,-3,3],lane=laneOrder[index%laneOrder.length];
  const isDb=['CB','S','FS','SS','NB','DB'].includes(role),isLb=role==='LB';
  // Before the runner commits, defenders key the press track rather than the
  // eventual synthetic cut/bounce destination. This prevents them from visibly
  // knowing the runner's future lane before the runner makes the decision.
  let read1,read2;
  if(isDb){
    const depthHold=role==='S'||role==='FS'||role==='SS'?1.1:.55;
    read1={x:gvClamp(start.x-dir*depthHold,5,95),y:gvClamp(start.y+(press.y-start.y)*.14,6,94)};
    read2={x:gvClamp(start.x-dir*(depthHold*.35),5,95),y:gvClamp(start.y+(press.y-start.y)*.28,6,94)};
  }else if(isLb){
    read1={x:gvClamp(los-dir*.75,5,95),y:gvClamp(start.y+(press.y-start.y)*.24,6,94)};
    read2={x:gvClamp(los+dir*.45,5,95),y:gvClamp(start.y+(press.y-start.y)*.42,6,94)};
  }else{
    read1={x:gvClamp(start.x-dir*.65,5,95),y:gvClamp(start.y+(press.y-start.y)*.16,6,94)};
    read2={x:gvClamp(los+dir*.2,5,95),y:gvClamp(start.y+(press.y-start.y)*.30,6,94)};
  }
  // Once the commit point is reached, redirect toward role-specific leverage on
  // the actual committed path. The redirect is intentionally visible but not abrupt.
  const gap=isDb?3.8+(index%3)*.7:isLb?2.5+(index%2)*.55:1.9+(index%3)*.45;
  const lateral=lane*(isDb?2.5:isLb?2.0:1.55);
  const redirect={
    x:gvClamp(read2.x+(commit.x-read2.x)*(isDb?.42:isLb?.54:.62)-dir*(isDb?1.4:.6),5,95),
    y:gvClamp(read2.y+(commit.y-read2.y)*(isDb?.34:isLb?.48:.56)+lateral*.28,6,94)
  };
  const close={x:gvClamp(finish.x-dir*gap,5,95),y:gvClamp(finish.y+lateral,6,94)};
  return [start,read1,read2,redirect,close];
}

function gvRunUnassignedBlockerFlowPath(blocker,path,concept,built,index=0){
  if(!blocker||!Array.isArray(path)||path.length<2)return [{x:blocker?.x||50,y:blocker?.y||50}];
  const dir=built.formation.dir,finish=path.at(-1),family=gvRunConceptFamily(concept),side=gvRunConceptSide(concept)||(finish.y>=50?1:-1);
  const start={x:blocker.x,y:blocker.y};
  // v0.4.40: unassigned OL should not all surge eight or ten yards downfield.
  // Unless a blocker has an explicit climb/lead assignment, keep him near the line
  // and let the paired engagement animation create the visible displacement.
  const climb=family==='sweep'||family==='outside-zone'?3.8:2.8;
  const laneY=gvClamp(start.y+(finish.y-start.y)*.12+side*(index%2?.8:-.6),8,92);
  return [
    start,
    {x:start.x+dir*(climb*.55),y:gvClamp(start.y+(laneY-start.y)*.45,8,92)},
    {x:start.x+dir*climb,y:laneY}
  ];
}
function gvRunFitContainResult(evt,concept,laneRead,built){
  const side=gvRunConceptSide(concept);
  const seed=assignmentHash(`${evt?.id||''}|contain-result|${concept}|${laneRead?.read||''}`);
  const edge=built.units.filter(u=>u.side==='defense'&&['EDGE','DE'].includes(u.role));
  const playEdge=edge.find(u=>side<0?u.y<50:side>0?u.y>=50:false);
  if(!playEdge)return {contained:false,defender:null};
  const profile=gvDefReactionProfile(evt,playEdge,91);
  const chance=profile.name==='contain'||profile.name==='patient'?.78:profile.name==='aggressive'||profile.name==='overpursue'?.42:.6;
  return {contained:simRand(seed,511)<chance,defender:playEdge};
}
function gvApplyContainToLaneRead(laneRead,containResult){
  if(!laneRead||!containResult)return laneRead;
  const next={...laneRead};
  if(next.read==='bounce'&&containResult.contained)next.read='cutback';
  else if(next.read==='press'&&!containResult.contained&&next.family==='outside-zone')next.read='bounce';
  return next;
}


function gvAssignRunBlockOutcomes(evt,concept,assignments){
  return (assignments||[]).map((pair,i)=>{
    const seed=assignmentHash(`${evt?.id||''}|assignment|${i}`);
    pair.outcome=gvRunBlockOutcome(pair,concept,seed);
    pair.outcomeSeed=seed;
    return pair;
  });
}
function gvRunBlockingPicture(concept,assignments){
  const family=gvRunConceptFamily(concept);
  const side=gvRunConceptSide(concept);
  const score={drive:3,control:2,stalemate:0,shed:-3};
  const weighted=(assignments||[]).map(p=>{
    let w=1;
    if(['seal','pull','lead'].includes(p.kind))w=family==='sweep'?1.7:1.35;
    else if(p.kind==='double')w=1.45;
    else if(p.kind==='second-level')w=1.2;
    return {...p,weight:w,value:(score[p.outcome]??0)*w};
  });
  const total=weighted.reduce((a,p)=>a+p.value,0);
  const edge=weighted.filter(p=>['seal','pull','lead'].includes(p.kind));
  const interior=weighted.filter(p=>['base','double','second-level'].includes(p.kind));
  const edgeScore=edge.reduce((a,p)=>a+p.value,0);
  const interiorScore=interior.reduce((a,p)=>a+p.value,0);
  const edgeShed=edge.some(p=>p.outcome==='shed');
  const interiorShed=interior.some(p=>p.outcome==='shed');
  const edgeWin=edge.some(p=>p.outcome==='drive'||p.outcome==='control')&&!edgeShed;
  const interiorWin=interior.some(p=>p.outcome==='drive'||p.outcome==='control')&&!interiorShed;
  const stalled=weighted.filter(p=>p.outcome==='stalemate').length>=Math.max(2,Math.ceil(weighted.length*.35));
  return {family,side,total,edgeScore,interiorScore,edgeShed,interiorShed,edgeWin,interiorWin,stalled,weighted};
}
function gvCarrierDecisionFromBlocks(evt,concept,assignments){
  const pic=gvRunBlockingPicture(concept,assignments);
  const seed=assignmentHash(`${evt?.id||''}|carrier-block-read|${concept}`);
  const r=simRand(seed,921);
  let decision='press';

  if(pic.family==='sweep'||pic.family==='outside-zone'||pic.family==='off-tackle'){
    if(pic.edgeShed&&pic.interiorWin)decision='cut-inside';
    else if(pic.edgeShed)decision='abort-edge';
    else if(pic.edgeWin&&pic.edgeScore>=pic.interiorScore)decision='bounce';
    else if(pic.interiorWin&&pic.edgeScore<1)decision='cut-inside';
    else if(pic.stalled)decision='hesitate';
  }else if(pic.family==='inside-zone'){
    if(pic.interiorShed)decision=r<.55?'cutback':'bounce';
    else if(pic.interiorWin&&pic.interiorScore>3)decision='crease';
    else if(pic.stalled)decision='hesitate';
  }else if(pic.family==='power'||pic.family==='counter'||pic.family==='trap'){
    const pullLost=(assignments||[]).some(p=>p.kind==='pull'&&p.outcome==='shed');
    const pullWon=(assignments||[]).some(p=>p.kind==='pull'&&(p.outcome==='drive'||p.outcome==='control'));
    if(pullLost)decision='cutback';
    else if(pullWon)decision='follow-lead';
    else if(pic.stalled)decision='hesitate';
  }else{
    if(pic.total<=-3)decision='penetration';
    else if(pic.total>=5)decision='crease';
    else if(pic.stalled)decision='hesitate';
  }
  return {decision,picture:pic,seed};
}
function gvApplyBlockDrivenCarrierDecision(path,evt,built,concept,assignments,decisionInfo){
  if(!Array.isArray(path)||path.length<2)return path||[];
  const info=decisionInfo||gvCarrierDecisionFromBlocks(evt,concept,assignments);
  const decision=info.decision,dir=built.formation.dir;
  const p=path.map(x=>({...x})),start=p[0],finish=p.at(-1);
  const side=gvRunConceptSide(concept)||(finish.y>=start.y?1:-1);
  const gain=Math.max(8,Math.abs(finish.x-start.x));

  if(decision==='hesitate'){
    return [
      start,
      {x:start.x+dir*2.2,y:start.y},
      {x:start.x+dir*3.3,y:gvClamp(start.y+side*1.2,10,90)},
      {x:start.x+dir*5.2,y:gvClamp(start.y-side*1.8,10,90)},
      ...p.slice(1)
    ];
  }
  if(decision==='abort-edge'){
    return [
      start,
      {x:start.x+dir*3,y:gvClamp(start.y+side*5,10,90)},
      {x:start.x+dir*Math.max(7,gain*.3),y:gvClamp(start.y-side*7,10,90)},
      {x:finish.x,y:gvClamp(start.y-side*4,10,90)}
    ];
  }
  if(decision==='cut-inside'){
    return [
      start,
      {x:start.x+dir*4,y:gvClamp(start.y+side*5,10,90)},
      {x:start.x+dir*Math.max(8,gain*.38),y:gvClamp(start.y-side*3,10,90)},
      {x:finish.x,y:gvClamp(start.y-side*1.5,10,90)}
    ];
  }
  if(decision==='bounce'){
    return [
      start,
      {x:start.x+dir*3.5,y:gvClamp(start.y+side*7,8,92)},
      {x:start.x+dir*Math.max(8,gain*.4),y:gvClamp(start.y+side*15,8,92)},
      {x:finish.x,y:gvClamp(finish.y+side*4,8,92)}
    ];
  }
  if(decision==='cutback'){
    return [
      start,
      {x:start.x+dir*4.5,y:gvClamp(start.y+side*4,10,90)},
      {x:start.x+dir*Math.max(8,gain*.42),y:gvClamp(start.y-side*9,10,90)},
      {x:finish.x,y:gvClamp(start.y-side*5,10,90)}
    ];
  }
  if(decision==='follow-lead'){
    const lead=(assignments||[]).find(p=>['lead','pull'].includes(p.kind)&&p.outcome!=='shed');
    if(lead?.blocker){
      return [
        start,
        {x:start.x+dir*4,y:gvClamp((start.y+lead.blocker.y)/2,10,90)},
        {x:start.x+dir*Math.max(9,gain*.45),y:gvClamp(lead.blocker.y,10,90)},
        finish
      ];
    }
  }
  if(decision==='crease'){
    return [
      start,
      {x:start.x+dir*Math.max(5,gain*.22),y:gvClamp(start.y+side*1.5,10,90)},
      {x:start.x+dir*Math.max(10,gain*.55),y:gvClamp(start.y+side*2.5,10,90)},
      finish
    ];
  }
  if(decision==='penetration'){
    return [
      start,
      {x:start.x+dir*2,y:start.y},
      {x:start.x+dir*Math.min(6,Math.max(3,gvEventAnimationYards(evt,.3))),y:gvClamp(start.y+side*2,10,90)}
    ];
  }
  return p;
}

function gvRunLaneRead(evt,built,concept,assignments,path){
  const family=gvRunConceptFamily(concept),side=gvRunConceptSide(concept);
  const blockDecision=gvCarrierDecisionFromBlocks(evt,concept,assignments);
  const seed=assignmentHash(`${evt?.id||''}|lane-read|${concept}`);
  const r=simRand(seed,401);
  const hasPull=(assignments||[]).some(x=>x.kind==='pull');
  const hasLead=(assignments||[]).some(x=>x.kind==='lead');
  const hasSeal=(assignments||[]).some(x=>x.kind==='seal');
  const hasDouble=(assignments||[]).some(x=>x.kind==='double');
  const penetration=(assignments||[]).filter(x=>x.kind==='base'||x.kind==='double').length<2 ? .18 : .08;

  let read='press';
  const bd=blockDecision.decision;
  if(['penetration','follow-lead','bounce','cutback','crease'].includes(bd))read=bd;
  else if(bd==='abort-edge'||bd==='cut-inside')read='cutback';
  else if(bd==='hesitate')read='press';
  else if(r<penetration)read='penetration';
  else if((family==='power'||family==='counter'||family==='sweep')&&(hasPull||hasLead)&&r<.58)read='follow-lead';
  else if((family==='outside-zone'||family==='sweep'||family==='off-tackle')&&hasSeal&&r<.66)read='bounce';
  else if((family==='inside-zone'||family==='outside-zone')&&r>.72)read='cutback';
  else if(hasDouble&&r>.56)read='crease';

  return {read,family,side,seed,blockDecision};
}
function gvApplyRunLaneRead(path,evt,built,concept,assignments){
  if(!Array.isArray(path)||path.length<2)return path||[];
  const info=gvRunLaneRead(evt,built,concept,assignments,path),dir=built.formation.dir;
  const p=path.map(x=>({x:x.x,y:x.y})),start=p[0],finish=p.at(-1);
  const side=info.side||(finish.y>=start.y?1:-1);

  if(info.read==='penetration'){
    const stopX=start.x+dir*Math.min(7,Math.max(3,gvEventAnimationYards(evt,.35)));
    const stopY=gvClamp(start.y+side*2,12,88);
    return [start,{x:start.x+dir*2,y:start.y},{x:stopX,y:stopY}];
  }

  if(info.read==='follow-lead'){
    const target=(assignments||[]).find(x=>x.kind==='lead')||(assignments||[]).find(x=>x.kind==='pull');
    if(target?.blocker){
      const by=target.blocker.y;
      const leadPt={x:start.x+dir*5,y:gvClamp((start.y+by)/2,12,88)};
      const through={x:start.x+dir*Math.max(9,gvEventAnimationYards(evt,.65)*.45),y:gvClamp(by,12,88)};
      return [start,leadPt,through,...p.slice(Math.min(2,p.length-1))];
    }
  }

  if(info.read==='bounce'){
    const widen=side*(8+simRand(info.seed,402)*5);
    const bounce1={x:start.x+dir*4,y:gvClamp(start.y+widen*.45,10,90)};
    const bounce2={x:start.x+dir*Math.max(8,Math.abs(finish.x-start.x)*.4),y:gvClamp(start.y+widen,10,90)};
    return [start,bounce1,bounce2,{x:finish.x,y:gvClamp(finish.y+side*3,10,90)}];
  }

  if(info.read==='cutback'){
    const originalSide=side;
    const plant={x:start.x+dir*5,y:gvClamp(start.y+originalSide*4,12,88)};
    const cut={x:start.x+dir*Math.max(8,Math.abs(finish.x-start.x)*.42),y:gvClamp(start.y-originalSide*(6+simRand(info.seed,403)*4),12,88)};
    return [start,plant,cut,{x:finish.x,y:gvClamp(start.y-originalSide*4,12,88)}];
  }

  if(info.read==='crease'){
    const crease={x:start.x+dir*Math.max(7,Math.abs(finish.x-start.x)*.34),y:gvClamp(start.y+side*2,12,88)};
    const burst={x:start.x+dir*Math.max(12,Math.abs(finish.x-start.x)*.63),y:gvClamp(crease.y+side*2,12,88)};
    return [start,crease,burst,finish];
  }

  return p;
}
function gvRunDecisionTimingPlan(path,evt,built,concept,laneRead,blockDecision){
  if(!Array.isArray(path)||path.length<2)return {path:path||[],phase:'direct',read:laneRead?.read||'press',commitIndex:0};
  const p=path.map(q=>({x:Number(q.x),y:Number(q.y)})),start=p[0],finish=p.at(-1),dir=built.formation.dir;
  const family=gvRunConceptFamily(concept),read=laneRead?.read||'press';
  const side=gvRunConceptSide(concept)||(finish.y>=start.y?1:-1);
  const span=Math.max(6,Math.abs(finish.x-start.x));
  const committed=['bounce','cutback','follow-lead','crease'].includes(read)||['abort-edge','cut-inside','hesitate'].includes(blockDecision?.decision);
  if(read==='penetration'){
    const press={x:start.x+dir*Math.min(2.6,span*.28),y:gvClamp(start.y+side*.35,10,90)};
    const diagnose={x:start.x+dir*Math.min(4.1,span*.48),y:gvClamp(start.y+side*.8,10,90)};
    return {path:[start,press,diagnose,finish],phase:'press-diagnose-contact',read,commitIndex:2};
  }
  if(!committed){
    const press={x:start.x+dir*Math.min(4.8,span*.22),y:gvClamp(start.y+side*(family==='outside-zone'?.9:.35),10,90)};
    const diagnose={x:start.x+dir*Math.min(7.2,span*.34),y:gvClamp(press.y+side*.45,10,90)};
    const tail=p.slice(1).filter(q=>dir*(q.x-diagnose.x)>.8);
    return {path:[start,press,diagnose,...(tail.length?tail:[finish])],phase:'press-diagnose-flow',read,commitIndex:2};
  }

  // Keep the runner on the intended track long enough for the blocking picture
  // to develop. The actual bounce/cut/crease then happens after this diagnosis
  // point rather than being visible immediately from the exchange.
  const pressLateral=(family==='outside-zone'||family==='sweep'||family==='off-tackle')?side*1.8:side*.55;
  const press={x:start.x+dir*Math.min(5.2,span*.24),y:gvClamp(start.y+pressLateral,10,90)};
  const diagnose={x:start.x+dir*Math.min(7.8,span*.36),y:gvClamp(press.y-side*.25,10,90)};

  let commitTarget=p.find((q,i)=>i>0&&dir*(q.x-diagnose.x)>1.4);
  if(!commitTarget)commitTarget=p.length>2?p[p.length-2]:finish;
  commitTarget={x:Math.max(4,Math.min(96,commitTarget.x)),y:Math.max(4,Math.min(96,commitTarget.y))};
  const tail=p.filter((q,i)=>i>0&&dir*(q.x-commitTarget.x)>1.1);
  const shaped=[start,press,diagnose,commitTarget,...tail];
  if(Math.hypot(shaped.at(-1).x-finish.x,shaped.at(-1).y-finish.y)>.4)shaped.push(finish);
  return {path:shaped,phase:'press-diagnose-commit',read,commitIndex:3};
}

function gvRunLaneLabel(read='press'){
  return ({
    'press':'PRESS',
    'follow-lead':'FOLLOW LEAD',
    'bounce':'BOUNCE',
    'cutback':'CUTBACK',
    'crease':'CREASE',
    'penetration':'PENETRATION'
  })[read]||'PRESS';
}

function gvRunConceptFamily(name='inside-zone'){
  const n=String(name||'').toLowerCase();
  if(n.includes('counter'))return 'counter';
  if(n.includes('power'))return 'power';
  if(n.includes('jet')||n.includes('end-around')||n.includes('reverse')||n.includes('orbit')||n.includes('fly-sweep')||n.includes('sweep')||n.includes('toss'))return 'sweep';
  if(n.includes('outside')||n.includes('stretch')||n.includes('bounce'))return 'outside-zone';
  if(n.includes('trap'))return 'trap';
  if(n.includes('off-tackle'))return 'off-tackle';
  if(n.includes('draw')||n.includes('delayed'))return 'draw';
  if(n.includes('dive')||n.includes('plunge'))return 'dive';
  return 'inside-zone';
}
function gvRunConceptSide(name=''){
  const n=String(name||'').toLowerCase();
  return n.includes('left')?-1:n.includes('right')?1:0;
}
function gvRunLeadCandidates(built,rb){
  return built.units.filter(u=>u.side==='offense'&&u!==rb&&['TE','FB'].includes(u.role));
}
function gvRunSecondLevelTarget(front,blocker,side=0){
  const lbs=front.filter(d=>d.role==='LB');
  if(!lbs.length)return null;
  const targetY=side<0?35:side>0?65:blocker.y;
  return lbs.slice().sort((a,b)=>Math.abs(a.y-targetY)-Math.abs(b.y-targetY))[0]||null;
}

function gvBlockPhaseDurations(duration,kind='base'){
  const total=Math.max(450,Number(duration)||900);
  const engage=Math.max(180,Math.round(total*(kind==='pull'?.28:.24)));
  const leverage=Math.max(220,Math.round(total*(kind==='double'?.46:.42)));
  const release=Math.max(160,total-engage-leverage);
  return {engage,leverage,release};
}
function gvRunBlockOutcome(pair,concept,seed){
  if(pair?.outcome)return pair.outcome;
  const family=gvRunConceptFamily(concept),kind=pair?.kind||'base';
  const r=simRand(seed,811);
  let win=.56;
  if(kind==='double')win=.76;
  else if(kind==='lead')win=.64;
  else if(kind==='pull')win=.60;
  else if(kind==='seal')win=.62;
  if(family==='sweep'&&['pull','lead','seal'].includes(kind))win+=.08;
  if(family==='outside-zone'&&kind==='seal')win+=.06;
  if(r<win-.12)return 'drive';
  if(r<win)return 'control';
  if(r<win+.18)return 'stalemate';
  return 'shed';
}
function gvBlockEngagePoint(blocker,defender,dir,kind='base'){
  const bx=blocker.x,by=blocker.y,dx=defender.x,dy=defender.y;
  const bias=kind==='pull'?.58:kind==='lead'?.62:.5;
  return {
    x:gvClamp(bx+(dx-bx)*bias-dir*.25,5,95),
    y:gvClamp(by+(dy-by)*bias,6,94)
  };
}
function gvRunBlockLeverageTargets(blocker,defender,built,concept,kind,outcome){
  const dir=built.formation.dir,side=gvRunConceptSide(concept)||(blocker.y<50?-1:1);
  const engage=gvBlockEngagePoint(blocker,defender,dir,kind);
  // v0.4.40: make run blocking look like displacement of an engaged defender,
  // not an offensive line sprinting forward while the front stays planted.
  let push=outcome==='drive'?3.5:outcome==='control'?2.1:outcome==='stalemate'?.65:-.45;
  if(kind==='double')push+=1.0;
  if(kind==='lead')push+=.55;
  if(kind==='seal')push+=.35;
  if(kind==='second-level')push+=.25;
  const lateral=(kind==='seal'?side*4.2:kind==='pull'?side*3.0:kind==='lead'?side*1.8:kind==='second-level'?side*1.0:0);
  const bodySep=outcome==='stalemate'?1.35:outcome==='shed'?1.55:1.05;
  const blockerX=gvClamp(engage.x+dir*(push-.35),5,95);
  // On wins/stalemates, the defender is carried with the block and remains just
  // ahead of the blocker. Only a shed lets him resist/redirect independently.
  const defenderPush=outcome==='shed'?Math.max(-.8,push-1.15):push+.8;
  return {
    engage,
    blockerHold:{x:blockerX,y:gvClamp(engage.y+lateral-side*bodySep*.45,6,94)},
    defenderHold:{x:gvClamp(engage.x+dir*defenderPush,5,95),y:gvClamp(engage.y+lateral+side*bodySep,6,94)}
  };
}
async function gvAnimateRunBlockPhases(pair,built,concept,duration,seed){
  const {blocker,defender,kind='base'}=pair||{};
  if(!blocker||!defender)return;
  const dir=built.formation.dir,outcome=gvRunBlockOutcome(pair,concept,seed);
  const phases=gvBlockPhaseDurations(duration,kind);
  const t=gvRunBlockLeverageTargets(blocker,defender,built,concept,kind,outcome);

  await Promise.allSettled([
    gvMove(blocker,[{x:blocker.x,y:blocker.y},t.engage],phases.engage,'ease-in'),
    gvMove(defender,[{x:defender.x,y:defender.y},{x:t.engage.x+dir*.55,y:t.engage.y}],phases.engage,'ease-in')
  ]);

  await Promise.allSettled([
    gvMove(blocker,[{x:blocker.x,y:blocker.y},t.blockerHold],phases.leverage),
    gvMove(defender,[{x:defender.x,y:defender.y},t.defenderHold],phases.leverage)
  ]);

  if(outcome==='shed'){
    const shedSide=defender.y<50?-1:1,finish=pair?.finish;
    const chase=finish?{
      x:gvClamp(defender.x+(finish.x-defender.x)*.42,5,95),
      y:gvClamp(defender.y+(finish.y-defender.y)*.38,6,94)
    }:{x:defender.x+dir*3.6,y:gvClamp(defender.y+shedSide*4.5,6,94)};
    await Promise.allSettled([
      gvMove(blocker,[{x:blocker.x,y:blocker.y},{x:blocker.x-dir*.7,y:gvClamp(blocker.y-shedSide*2.2,6,94)}],phases.release,'ease-out'),
      gvMove(defender,[{x:defender.x,y:defender.y},{x:defender.x+dir*.9,y:gvClamp(defender.y+shedSide*2.2,6,94)},chase],phases.release,'ease-out')
    ]);
  }else{
    const peel=pair?.finish?{
      x:gvClamp(blocker.x+dir*(2.1+(outcome==='drive'?1.5:0)),5,95),
      y:gvClamp(blocker.y+(pair.finish.y-blocker.y)*.12,6,94)
    }:{x:blocker.x+dir*(2.2+(outcome==='drive'?1.5:0)),y:gvClamp(blocker.y+(50-blocker.y)*.05,6,94)};
    await Promise.allSettled([
      gvMove(blocker,[{x:blocker.x,y:blocker.y},peel],phases.release,'ease-out'),
      gvMove(defender,[{x:defender.x,y:defender.y},{x:defender.x+dir*(outcome==='drive'?1.7:outcome==='control'?.9:.35),y:gvClamp(defender.y+(peel.y-defender.y)*.12,6,94)}],phases.release,'ease-out')
    ]);
  }
}

function gvRunBlockMotion(pair,built,concept,duration,seed){
  const {blocker,defender,kind}=pair||{};if(!blocker||!defender)return Promise.resolve();
  const dir=built.formation.dir,side=gvRunConceptSide(concept);
  // Pull/lead blockers still travel to their assignment before contact; once engaged,
  // all run blocks use the same engage → leverage → shed/release timing model.
  if(kind==='pull'){
    const travel=Math.max(180,Math.round(duration*.24));
    const laneY=side<0?32:side>0?68:(blocker.y<50?68:32);
    return (async()=>{
      await gvMove(blocker,[
        {x:blocker.x,y:blocker.y},
        {x:blocker.x-dir*2,y:blocker.y},
        {x:blocker.x+dir*2,y:laneY}
      ],travel);
      return gvAnimateRunBlockPhases(pair,built,concept,Math.max(420,duration-travel),seed);
    })();
  }
  if(kind==='lead'){
    const travel=Math.max(160,Math.round(duration*.20));
    const laneY=side<0?34:side>0?66:blocker.y;
    return (async()=>{
      await gvMove(blocker,[{x:blocker.x,y:blocker.y},{x:blocker.x+dir*4,y:laneY}],travel);
      return gvAnimateRunBlockPhases(pair,built,concept,Math.max(420,duration-travel),seed);
    })();
  }
  if(kind==='second-level'){
    const travel=Math.max(180,Math.round(duration*.24));
    const climbY=gvClamp(blocker.y+(defender.y-blocker.y)*.45,8,92);
    return (async()=>{
      await gvMove(blocker,[
        {x:blocker.x,y:blocker.y},
        {x:blocker.x+dir*2.6,y:gvClamp(blocker.y+(climbY-blocker.y)*.35,8,92)},
        {x:blocker.x+dir*5.4,y:climbY}
      ],travel,'ease-in-out');
      return gvAnimateRunBlockPhases(pair,built,concept,Math.max(420,duration-travel),seed);
    })();
  }
  return gvAnimateRunBlockPhases(pair,built,concept,duration,seed);
}
function gvRunBlockShedMotion(defender,finish,dir,duration,seed){
  if(!defender)return Promise.resolve();
  const side=simRand(seed,301)>.5?1:-1;
  const shed={x:defender.x+dir*1.5,y:gvClamp(defender.y+side*4,8,92)};
  const chase={x:defender.x+(finish.x-defender.x)*.55,y:defender.y+(finish.y-defender.y)*.5};
  return gvMove(defender,[{x:defender.x,y:defender.y},shed,chase],duration);
}


function gvNormalizeRunBlockAssignments(pairs=[]){
  // One actor should never be given two simultaneous block animations. Prefer
  // concept-specific assignments over generic base blocks, while also keeping
  // defenders unique so no defender is pulled by competing animations.
  const rank={pull:7,lead:7,seal:6,'second-level':5,double:4,base:1};
  const sorted=(pairs||[]).map((p,i)=>({...p,_order:i})).sort((a,b)=>(rank[b.kind]||0)-(rank[a.kind]||0)||a._order-b._order);
  const usedBlockers=new Set(),usedDefenders=new Set(),kept=[];
  for(const p of sorted){
    if(!p?.blocker||!p?.defender)continue;
    if(usedBlockers.has(p.blocker)||usedDefenders.has(p.defender))continue;
    usedBlockers.add(p.blocker);usedDefenders.add(p.defender);kept.push(p);
  }
  return kept.sort((a,b)=>a._order-b._order).map(({_order,...p})=>p);
}
function gvRunBlockAssignments(built,concept='inside-zone'){
  const blockers=gvOffensiveBlockers(built.units),front=gvFrontSeven(built.units),pairs=[];
  const family=gvRunConceptFamily(concept),side=gvRunConceptSide(concept),claimed=new Set();
  const add=(blocker,defender,kind='base')=>{
    if(!blocker||!defender)return;
    if(pairs.some(x=>x.blocker===blocker&&x.defender===defender&&x.kind===kind))return;
    pairs.push({blocker,defender,kind});
    if(kind!=='double')claimed.add(defender);
  };
  const nearestOpen=(b,pool=front)=>gvNearestByY(pool.filter(d=>!claimed.has(d)),b,1)[0]||gvNearestByY(pool,b,1)[0];

  // Base picture first.
  for(const b of blockers){
    const d=nearestOpen(b);
    add(b,d,'base');
  }

  if(family==='inside-zone'){
    const interior=blockers.filter(b=>['LG','C','RG'].includes(b.role));
    const tackles=front.filter(d=>['DT','NT'].includes(d.role));
    if(interior.length>=2&&tackles.length){
      const target=gvNearestByY(tackles,{y:50,x:built.formation.los},1)[0];
      gvNearestByY(interior,target,2).forEach(b=>add(b,target,'double'));
      const climb=interior[side<0?0:side>0?interior.length-1:1]||interior[0];
      const lb=gvRunSecondLevelTarget(front,climb,side);
      if(climb&&lb)add(climb,lb,'second-level');
    }
  }

  if(family==='outside-zone'){
    const edgeBlocker=blockers.find(b=>side<0?['LT','TE'].includes(b.role):['RT','TE'].includes(b.role));
    const edge=front.filter(d=>['EDGE','DE','LB'].includes(d.role));
    const target=gvNearestByY(edge,{x:built.formation.los,y:side<0?25:75},1)[0];
    if(edgeBlocker&&target)add(edgeBlocker,target,'seal');
    const climb=blockers.find(b=>side<0?b.role==='LG':b.role==='RG');
    const lb=gvRunSecondLevelTarget(front,climb||edgeBlocker,side);
    if(climb&&lb)add(climb,lb,'second-level');
  }

  if(family==='power'||family==='counter'){
    const puller=blockers.find(b=>side<0?b.role==='RG':b.role==='LG')||blockers.find(b=>['LG','RG'].includes(b.role));
    const edge=front.filter(d=>['EDGE','DE','LB'].includes(d.role));
    const target=gvNearestByY(edge,{x:built.formation.los,y:side<0?30:70},1)[0];
    if(puller&&target)add(puller,target,'pull');
    const backside=blockers.find(b=>side<0?b.role==='RT':b.role==='LT');
    const backEdge=gvNearestByY(edge,{x:built.formation.los,y:side<0?75:25},1)[0];
    if(backside&&backEdge)add(backside,backEdge,'seal');
  }

  if(family==='sweep'){
    const edgeBlocker=blockers.find(b=>side<0?['LT','TE'].includes(b.role):['RT','TE'].includes(b.role));
    const edge=front.filter(d=>['EDGE','DE','LB'].includes(d.role));
    const edgeTarget=gvNearestByY(edge,{x:built.formation.los,y:side<0?20:80},1)[0];
    if(edgeBlocker&&edgeTarget)add(edgeBlocker,edgeTarget,'seal');
    const puller=blockers.find(b=>side<0?b.role==='RG':b.role==='LG');
    const lb=gvRunSecondLevelTarget(front,puller||edgeBlocker,side);
    if(puller&&lb)add(puller,lb,'pull');
  }

  if(family==='trap'){
    const puller=blockers.find(b=>side<0?b.role==='RG':b.role==='LG')||blockers.find(b=>['LG','RG'].includes(b.role));
    const interior=front.filter(d=>['DT','NT'].includes(d.role));
    const target=gvNearestByY(interior,{x:built.formation.los,y:side<0?43:57},1)[0];
    if(puller&&target)add(puller,target,'pull');
  }

  if(family==='off-tackle'){
    const tackle=blockers.find(b=>side<0?b.role==='LT':b.role==='RT');
    const edge=front.filter(d=>['EDGE','DE'].includes(d.role));
    const target=gvNearestByY(edge,{x:built.formation.los,y:side<0?30:70},1)[0];
    if(tackle&&target)add(tackle,target,'seal');
    const guard=blockers.find(b=>side<0?b.role==='LG':b.role==='RG');
    const lb=gvRunSecondLevelTarget(front,guard||tackle,side);
    if(guard&&lb)add(guard,lb,'second-level');
  }

  return gvNormalizeRunBlockAssignments(pairs);
}


function gvPocketOutcome(evt,built,concept=''){
  const seed=assignmentHash(`${evt?.id||''}|pocket-outcome|${concept}`);
  const r=simRand(seed,211),type=String(evt?.playType||gvPlayType(evt)||'');
  if(type==='def_sack')return 'collapse-sack';
  if(type==='def_qb_hit')return 'hit-release';
  if(String(concept).includes('pressure'))return r<.5?'edge-leak':'interior-push';
  if(r<.22)return 'clean';
  if(r<.42)return 'edge-arc';
  if(r<.60)return 'interior-push';
  if(r<.76)return 'slide-pocket';
  if(r<.90)return 'step-up';
  return 'edge-leak';
}
function gvQbPocketAdjustment(qb,built,outcome,dir){
  if(!qb)return [];
  const s={x:qb.x,y:qb.y};
  if(outcome==='clean')return [s,{x:s.x-dir*1.5,y:s.y}];
  if(outcome==='step-up')return [s,{x:s.x+dir*2.5,y:s.y},{x:s.x+dir*4,y:s.y}];
  if(outcome==='slide-pocket'){
    const side=(assignmentHash(`${qb.playerId||qb.role}|slide`)%2)?1:-1;
    return [s,{x:s.x-dir*1,y:s.y+side*4},{x:s.x+dir*.5,y:s.y+side*6}];
  }
  if(outcome==='edge-arc'){
    const side=(assignmentHash(`${qb.playerId||qb.role}|arc`)%2)?1:-1;
    return [s,{x:s.x-dir*1.5,y:s.y-side*3},{x:s.x+dir*1,y:s.y-side*5}];
  }
  if(outcome==='interior-push')return [s,{x:s.x-dir*2.5,y:s.y},{x:s.x-dir*3.5,y:s.y+2}];
  if(outcome==='edge-leak'){
    const side=(assignmentHash(`${qb.playerId||qb.role}|leak`)%2)?1:-1;
    return [s,{x:s.x-dir*2,y:s.y-side*4},{x:s.x-dir*1,y:s.y-side*7}];
  }
  return [s,{x:s.x-dir*3,y:s.y}];
}
function gvProtectionFailurePair(assignments,outcome){
  if(!assignments?.length||outcome==='clean')return null;
  if(outcome==='interior-push'||outcome==='collapse-sack'){
    return assignments.find(x=>['LG','C','RG'].includes(x.blocker?.role))||assignments[0];
  }
  if(outcome==='edge-arc'||outcome==='edge-leak'||outcome==='hit-release'){
    return assignments.find(x=>['LT','RT','TE'].includes(x.blocker?.role))||assignments.at(-1);
  }
  return assignments[Math.floor(assignments.length/2)]||null;
}
function gvProtectionResolution(outcome,isFailure=false,index=0){
  if(!isFailure)return outcome==='clean'?'win':(index%3===0?'win':'stalemate');
  if(outcome==='collapse-sack'||outcome==='hit-release'||outcome==='edge-leak')return 'beaten';
  if(outcome==='interior-push')return 'shed';
  if(outcome==='edge-arc')return 'shed';
  return 'stalemate';
}
function gvProtectionPairForDefender(assignments,defender,built){
  if(!defender)return null;
  const direct=(assignments||[]).find(x=>x.defender===defender);if(direct)return direct;
  const blockers=gvOffensiveBlockers(built?.units||[]);if(!blockers.length)return null;
  const blocker=blockers.slice().sort((a,b)=>Math.abs(a.y-defender.y)-Math.abs(b.y-defender.y))[0];
  return blocker?{blocker,defender,kind:'pass',pocket:gvProtectionPocketTarget(blocker,built,0)}:null;
}
function gvPocketAssignmentMotion(pair,built,outcome,duration,seed,isFailure=false,index=0){
  const {blocker,defender}=pair||{};if(!blocker||!defender)return Promise.resolve();
  const qb=gvUnit(built,'offense','QB'),dir=built.formation.dir;
  const pocket=pair.pocket||gvProtectionPocketTarget(blocker,built,0),role=String(blocker.role||'');
  const resolution=gvProtectionResolution(outcome,isFailure,index);
  pair._gvResolution=resolution;
  const side=blocker.y<50?-1:1;
  const startB={x:blocker.x,y:blocker.y},startD={x:defender.x,y:defender.y};
  const engage={x:pocket.x+dir*1.0,y:(pocket.y+defender.y)/2};

  if(resolution==='win'){
    const width=['LT','RT','TE'].includes(role)?4.8:2.5;
    const carry={x:pocket.x+dir*(2.4+(index%2)*.5),y:gvClamp(pocket.y+side*width,7,93)};
    const defenderRide={x:carry.x+dir*.7,y:gvClamp(carry.y+side*2.2,7,93)};
    return Promise.allSettled([
      gvMove(blocker,[startB,engage,carry],duration),
      gvMove(defender,[startD,{x:engage.x+dir*.5,y:engage.y},defenderRide],duration)
    ]);
  }
  if(resolution==='stalemate'){
    const hold={x:engage.x,y:engage.y};
    return Promise.allSettled([
      gvMove(blocker,[startB,{x:(startB.x+hold.x)/2,y:(startB.y+hold.y)/2},hold],duration),
      gvMove(defender,[startD,{x:(startD.x+hold.x)/2,y:(startD.y+hold.y)/2},{x:hold.x+dir*.9,y:hold.y}],duration)
    ]);
  }
  if(resolution==='shed'){
    const redirect={x:pocket.x-dir*.3,y:gvClamp(pocket.y+side*3.2,7,93)};
    const threaten=qb?{x:qb.x+dir*3.0,y:qb.y+side*2.2}:{x:pocket.x-dir*2,y:pocket.y};
    return Promise.allSettled([
      gvMove(blocker,[startB,engage,{x:redirect.x+dir*2.2,y:redirect.y+side*3.0}],duration),
      gvMove(defender,[startD,{x:engage.x+dir*.5,y:engage.y},redirect,threaten],duration)
    ]);
  }
  // beaten: the rusher visibly clears the blocker and reaches the quarterback's space.
  const bypass={x:pocket.x-dir*.6,y:gvClamp(pocket.y+side*4.2,7,93)};
  const target=qb?{x:qb.x+dir*.7,y:qb.y+side*.8}:{x:pocket.x-dir*3,y:pocket.y};
  return Promise.allSettled([
    gvMove(blocker,[startB,engage,{x:bypass.x+dir*2.6,y:bypass.y+side*3.5}],duration),
    gvMove(defender,[startD,{x:engage.x+dir*.5,y:engage.y},bypass,target],duration)
  ]);
}

function gvPassProtectionShape(built){
  const qb=gvUnit(built,'offense','QB');
  const dir=built.formation.dir;
  const los=Number(built.formation.los||50);
  const tackles=built.units.filter(u=>u.side==='offense'&&['LT','RT'].includes(u.role));
  const guards=built.units.filter(u=>u.side==='offense'&&['LG','RG'].includes(u.role));
  const center=gvUnit(built,'offense','C');
  return {qb,dir,los,tackles,guards,center};
}
function gvPassRushLane(defender,built,qb,index=0){
  const {dir}=gvPassProtectionShape(built);
  const side=defender.y<50?-1:1;
  const role=String(defender.role||'');
  const edge=['EDGE','DE'].includes(role);
  const interior=['DT','NT'].includes(role);
  const target=qb?{x:qb.x+dir*.8,y:qb.y}:{x:defender.x-dir*10,y:defender.y};
  if(edge)return [
    {x:defender.x,y:defender.y},
    {x:defender.x-dir*4,y:gvClamp(defender.y+side*6,8,92)},
    {x:target.x+dir*2,y:gvClamp(target.y+side*5,8,92)},
    target
  ];
  if(interior)return [
    {x:defender.x,y:defender.y},
    {x:defender.x-dir*3,y:defender.y},
    {x:target.x+dir*2.5,y:target.y+(index%2?2:-2)},
    target
  ];
  return [
    {x:defender.x,y:defender.y},
    {x:defender.x-dir*2,y:defender.y+side*3},
    {x:target.x+dir*3,y:target.y+side*3},
    target
  ];
}
function gvProtectionPocketTarget(blocker,built,index=0){
  const {qb,dir}=gvPassProtectionShape(built);
  if(!qb)return {x:blocker.x-dir*2,y:blocker.y};
  const role=String(blocker.role||'');
  if(role==='LT'||role==='RT'){
    const side=role==='LT'?-1:1;
    return {x:qb.x+dir*3.2,y:qb.y+side*10};
  }
  if(role==='LG'||role==='RG'){
    const side=role==='LG'?-1:1;
    return {x:qb.x+dir*4.2,y:qb.y+side*5};
  }
  if(role==='C')return {x:qb.x+dir*4.5,y:qb.y};
  if(role==='TE'){
    const side=blocker.y<50?-1:1;
    return {x:qb.x+dir*3.8,y:qb.y+side*13};
  }
  return {x:qb.x+dir*4,y:blocker.y};
}
function gvPassHelpBlockers(built,primaryReceiver){
  const qb=gvUnit(built,'offense','QB');
  return built.units.filter(u=>u.side==='offense'&&u!==qb&&u!==primaryReceiver&&['RB','TE'].includes(u.role));
}
function gvPassHelpMotion(helper,built,duration,seed){
  const qb=gvUnit(built,'offense','QB');if(!helper||!qb)return Promise.resolve();
  const dir=built.formation.dir,side=helper.y<50?-1:1;
  const check={x:qb.x+dir*4,y:qb.y+side*(helper.role==='TE'?12:7)};
  const settle={x:qb.x+dir*2.5,y:qb.y+side*(helper.role==='TE'?10:5)};
  return gvMove(helper,[{x:helper.x,y:helper.y},check,settle],duration);
}

function gvPassBlockAssignments(built,excludeUnits=[]){
  const excluded=new Set((Array.isArray(excludeUnits)?excludeUnits:[excludeUnits]).filter(Boolean));
  const blockers=gvOffensiveBlockers(built.units).filter(u=>!excluded.has(u)),rushers=built.units.filter(u=>u.side==='defense'&&['EDGE','DE','DT','NT','LB'].includes(u.role)),pairs=[];
  const claimed=new Set();
  for(const b of blockers){
    const pocket=gvProtectionPocketTarget(b,built,pairs.length);
    const pool=rushers.filter(d=>!claimed.has(d));
    const ranked=(pool.length?pool:rushers).slice().sort((a,c)=>{
      const da=Math.abs(a.y-b.y)+(String(b.role).includes('T')&&['EDGE','DE'].includes(a.role)?-8:0);
      const dc=Math.abs(c.y-b.y)+(String(b.role).includes('T')&&['EDGE','DE'].includes(c.role)?-8:0);
      return da-dc;
    });
    const d=ranked[0];
    if(d){pairs.push({blocker:b,defender:d,kind:'pass',pocket});claimed.add(d)}
  }
  return pairs;
}
function gvBlockAssignmentMotion(pair,dir,duration,seed){
  const {blocker,defender,kind,pocket}=pair;if(!blocker||!defender)return Promise.resolve();
  const midX=(blocker.x+defender.x)/2,midY=(blocker.y+defender.y)/2;
  if(kind==='pull'){
    const bend=blocker.y<50?8:-8;
    return Promise.allSettled([
      gvMove(blocker,[{x:blocker.x,y:blocker.y},{x:blocker.x-dir*1.5,y:blocker.y+bend},{x:midX-dir*.6,y:midY}],duration),
      gvMove(defender,[{x:defender.x,y:defender.y},{x:midX+dir*.8,y:midY}],duration)
    ]);
  }
  if(kind==='pass'){
    const p=pocket||{x:midX-dir*.4,y:midY};
    const engage={x:p.x+dir*1.2,y:(p.y+defender.y)/2};
    const rushPath=[
      {x:defender.x,y:defender.y},
      {x:(defender.x+engage.x)/2,y:(defender.y+engage.y)/2},
      engage,
      {x:p.x+dir*.4,y:p.y}
    ];
    const blockPath=[
      {x:blocker.x,y:blocker.y},
      {x:blocker.x-dir*1.2,y:blocker.y+(p.y-blocker.y)*.35},
      {x:p.x,y:p.y}
    ];
    return Promise.allSettled([gvMove(blocker,blockPath,duration),gvMove(defender,rushPath,duration)]);
  }
  return Promise.allSettled([
    gvMove(blocker,[{x:blocker.x,y:blocker.y},{x:midX-dir*1.4,y:midY},{x:midX-dir*.4,y:midY}],duration),
    gvMove(defender,[{x:defender.x,y:defender.y},{x:midX+dir*1.4,y:midY},{x:midX+dir*.6,y:midY}],duration)
  ]);
}
function gvCoverageShell(built,evt){
  const seed=assignmentHash(`${evt.id}|coverage-shell`);
  const man=seed%2===0;
  return man?'man':'zone';
}
function gvManCoverageAssignments(built){
  const receivers=built.units.filter(u=>u.side==='offense'&&['WR','TE','RB'].includes(u.role));
  const backs=built.units.filter(u=>u.side==='defense'&&['CB','NB','S','LB'].includes(u.role));
  const out=[];const claimed=new Set();
  for(const r of receivers){
    const pool=backs.filter(d=>!claimed.has(d));
    const d=gvNearestByY(pool.length?pool:backs,r,1)[0];
    if(d){out.push({receiver:r,defender:d});claimed.add(d)}
  }
  return out;
}
function gvZoneLandmark(u,built,index){
  const dir=built.formation.dir,los=built.formation.los;
  if(u.role==='CB')return {x:los+dir*8,y:u.y};
  if(u.role==='NB')return {x:los+dir*6,y:u.y};
  if(u.role==='LB')return {x:los+dir*5,y:u.y};
  if(u.role==='S')return {x:los+dir*13,y:u.y};
  return {x:u.x+dir*4,y:u.y};
}
function gvRunReadPath(u,runner,dir,seed){
  const step={x:u.x-dir*(1.2+simRand(seed,91)*2),y:u.y};
  const fit={x:(step.x+runner.x)/2,y:gvClamp((step.y+runner.y)/2+(simRand(seed,92)-.5)*5,10,90)};
  return [{x:u.x,y:u.y},step,fit,{x:runner.x-dir*(1.5+simRand(seed,93)*2),y:gvClamp(runner.y+(simRand(seed,94)-.5)*7,10,90)}];
}


function gvSecondaryRunBlockPath(u,carrierPath,dir,seed){
  const samples=gvCarrierPathSamples(carrierPath,4);
  const target=samples[Math.min(samples.length-1,2)]||{x:u.x+dir*8,y:u.y};
  const crackSide=u.y<target.y?1:-1;
  return [
    {x:u.x,y:u.y},
    {x:gvClamp(u.x+dir*4.5,5,95),y:gvClamp(u.y+crackSide*3.5,7,93)},
    {x:gvClamp(target.x-dir*1.5,5,95),y:gvClamp(target.y-crackSide*2.5,7,93)},
    {x:gvClamp(target.x+dir*1.2,5,95),y:gvClamp(target.y,7,93)}
  ];
}

function gvSecondaryRunPath(u,dir,seed,gain=12){
  const lane=(simRand(seed,31)-.5)*10;
  return [
    {x:u.x,y:u.y},
    {x:u.x+dir*(gain*.38),y:gvClamp(u.y+lane*.45,10,90)},
    {x:u.x+dir*gain,y:gvClamp(u.y+lane,10,90)}
  ];
}
function gvSecondaryPassRoute(u,dir,seed,gain=18){
  const inward=u.y<50?1:-1,kind=seed%4;
  let path;
  if(kind===0)path=[{x:u.x,y:u.y},{x:u.x+dir*(gain*.48),y:u.y},{x:u.x+dir*gain,y:gvClamp(u.y+inward*9,10,90)}];
  else if(kind===1)path=[{x:u.x,y:u.y},{x:u.x+dir*(gain*.58),y:gvClamp(u.y-inward*5,10,90)},{x:u.x+dir*gain,y:gvClamp(u.y-inward*11,10,90)}];
  else if(kind===2)path=[{x:u.x,y:u.y},{x:u.x+dir*(gain*.35),y:u.y},{x:u.x+dir*(gain*.7),y:gvClamp(u.y+inward*7,10,90)},{x:u.x+dir*gain,y:gvClamp(u.y+inward*3,10,90)}];
  else path=[{x:u.x,y:u.y},{x:u.x+dir*gain,y:u.y}];
  return gvNormalizeRoutePath(path,'background',dir);
}
function gvSustainBlockPath(u,dir,seed,gain=7){
  const lat=(simRand(seed,41)-.5)*4;
  return [
    {x:u.x,y:u.y},
    {x:u.x+dir*(gain*.45),y:u.y+lat*.4},
    {x:u.x+dir*gain,y:u.y+lat}
  ];
}



function gvDefenderArrivalGeometry(carrier,defender,dir){
  if(!carrier||!defender)return {distance:999,longitudinal:0,lateral:0,angle:'none'};
  const dx=defender.x-carrier.x,dy=defender.y-carrier.y,distance=Math.hypot(dx,dy);
  const longitudinal=dx*dir;
  const lateral=dy;
  let angle='side';
  if(longitudinal>3)angle='front';
  else if(longitudinal<-3)angle='behind';
  else if(Math.abs(lateral)>5)angle='angle';
  return {distance,longitudinal,lateral,angle};
}

function gvPursuitTarget(carrier,dir,index=0,depth=0,defender=null){
  // Pursuit ends in staggered leverage lanes rather than every defender sharing
  // one synthetic tackle point. Front-seven players close from inside-out while
  // DBs preserve a deeper safety angle until the final beat.
  const role=String(defender?.role||'').toUpperCase();
  const isDb=['CB','S','FS','SS','NB','DB'].includes(role);
  const isLb=role==='LB';
  const laneOrder=[0,-1,1,-2,2,-3,3];
  const lane=laneOrder[index%laneOrder.length];
  const depthGap=Math.min(8,2.2+Math.max(0,depth)*.10+(isDb?2.0:isLb?.8:0));
  const lateralGap=lane*(isDb?2.6:isLb?2.1:1.7);
  return {
    x:gvClamp(carrier.x-dir*depthGap,5,95),
    y:gvClamp(carrier.y+lateralGap,6,94)
  };
}

// v0.4.38: lightweight off-ball spacing guard. It only touches synthetic
// support/continuation paths; deliberate football contact (blocks, coverage contests,
// tackles) is never passed through this helper.
function gvSpacingGuardPath(path,reserved=[],minGap=4,seed=0,dir=1){
  if(!Array.isArray(path)||path.length<2)return path||[];
  const out=path.map(p=>({x:p.x,y:p.y})),original=out.at(-1);
  const occupied=(reserved||[]).filter(Boolean);
  const clear=p=>occupied.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=minGap);
  if(clear(original))return out;
  const side=simRand(seed,811)<.5?-1:1;
  const candidates=[];
  for(let ring=1;ring<=6;ring++){
    const lat=minGap*(.72+.48*ring);
    const depth=minGap*(.16+.17*ring);
    candidates.push(
      {x:original.x-dir*depth,y:original.y+side*lat},
      {x:original.x-dir*depth,y:original.y-side*lat},
      {x:original.x+dir*depth*.45,y:original.y+side*lat*.78},
      {x:original.x+dir*depth*.45,y:original.y-side*lat*.78}
    );
  }
  const chosen=candidates.map(p=>({x:gvClamp(p.x,5,95),y:gvClamp(p.y,6,94)})).find(clear)||original;
  if(chosen.x===original.x&&chosen.y===original.y)return out;
  const dx=chosen.x-original.x,dy=chosen.y-original.y;
  // Bend the approach over the final two waypoints so deconfliction never looks
  // like a last-frame corrective jump.
  if(out.length>=3){
    const pen=out.length-2;
    out[pen]={x:gvClamp(out[pen].x+dx*.38,5,95),y:gvClamp(out[pen].y+dy*.38,6,94)};
  }
  out[out.length-1]=chosen;
  return out;
}
function gvSpacedMoveSet(units,pathBuilder,durationBuilder,{minGap=4,anchors=[],dir=1,seedBase='spacing'}={}){
  const reserved=(anchors||[]).filter(Boolean).map(p=>({x:p.x,y:p.y}));
  return (units||[]).map((u,i)=>{
    const raw=pathBuilder(u,i);
    const path=gvSpacingGuardPath(raw,reserved,minGap,assignmentHash(`${seedBase}|${u?.role||''}|${u?.playerId||''}|${i}`),dir);
    if(path?.length)reserved.push({...path.at(-1)});
    const duration=typeof durationBuilder==='function'?durationBuilder(u,i):durationBuilder;
    return gvMove(u,path,duration);
  });
}

function gvRunExchangeContinuations(evt,built,carrier,qb,dir,duration){
  const units=built?.units||[];
  const moves=[];
  for(const u of units){
    if(u===carrier||u===qb)continue;
    if(u.side==='offense'){
      const skill=['WR','TE','RB'].includes(u.role);
      const target=skill
        ?{x:gvClamp(u.x+dir*(2.2+(Math.abs(u.y-50)>20?1.4:0)),5,95),y:gvClamp(u.y+(50-u.y)*.08,7,93)}
        :{x:gvClamp(u.x+dir*1.2,5,95),y:gvClamp(u.y+(50-u.y)*.025,7,93)};
      moves.push(gvMove(u,[{x:u.x,y:u.y},target],duration));
    }else{
      const front=['EDGE','DE','DT','NT','LB'].includes(u.role);
      const target=front
        ?{x:gvClamp(u.x-dir*(1.5+(u.role==='LB'?.5:0)),5,95),y:gvClamp(u.y+(carrier.y-u.y)*.12,7,93)}
        :{x:gvClamp(u.x-dir*.55,5,95),y:gvClamp(u.y+(carrier.y-u.y)*.08,7,93)};
      moves.push(gvMove(u,[{x:u.x,y:u.y},target],duration));
    }
  }
  return moves;
}

function gvPassProtectionFlightMotions(evt,built,passer,dir,duration,excludeUnits=[]){
  const pairs=gvPassBlockAssignments(built,excludeUnits),moves=[],used=new Set();
  pairs.forEach((pair,i)=>{
    const b=pair?.blocker,d=pair?.defender;if(!b||!d||used.has(b)||used.has(d))return;
    used.add(b);used.add(d);
    const side=b.y<50?-1:1,engageX=gvClamp((b.x+d.x)/2+dir*.25,5,95),engageY=gvClamp((b.y+d.y)/2,7,93);
    const anchor={x:gvClamp(passer.x+dir*(3.2+(i%3)*.7),5,95),y:gvClamp(b.y+side*(i%2?.8:-.8),7,93)};
    const rusherFinish={x:gvClamp(anchor.x-dir*(1.0+(i%2)*.5),5,95),y:gvClamp(anchor.y-side*(2.0+(i%3)),7,93)};
    moves.push(gvMove(b,[{x:b.x,y:b.y},{x:engageX,y:engageY},anchor],duration+(i%3)*25));
    moves.push(gvMove(d,[{x:d.x,y:d.y},{x:engageX-dir*.45,y:engageY-side*.7},rusherFinish],duration+(i%3)*30));
  });
  return {moves,used};
}

function gvPassSecondarySupportPath(u,catchPt,dir,index=0){
  const role=String(u?.role||'').toUpperCase();
  const isSafety=['S','FS','SS'].includes(role),isCorner=['CB','NB','DB'].includes(role),isLb=role==='LB';
  const side=(u.y<catchPt.y?-1:1)||(index%2?1:-1);
  const supportGap=isSafety?12:isCorner?9:isLb?7.5:7;
  const depthHold=isSafety?3.6:isCorner?2.2:isLb?1.2:1.5;
  const recognize={
    x:gvClamp(u.x+dir*(isLb?.7:.15),5,95),
    y:gvClamp(u.y+(catchPt.y-u.y)*(isLb?.08:.04),7,93)
  };
  const support={
    x:gvClamp(catchPt.x-dir*(supportGap+depthHold),5,95),
    y:gvClamp(catchPt.y+side*(supportGap*(isSafety?.62:isCorner?.72:.48)),7,93)
  };
  const mid={
    x:gvClamp(recognize.x+(support.x-recognize.x)*(isSafety?.34:isCorner?.42:.50),5,95),
    y:gvClamp(recognize.y+(support.y-recognize.y)*(isSafety?.32:isCorner?.40:.48),7,93)
  };
  return [{x:u.x,y:u.y},recognize,mid,support];
}

function gvPassShellFlightPath(evt,built,u,catchPt,dir,index=0,shell='zone',secondaryMap=null,manReceiver=null){
  const start={x:u.x,y:u.y},role=String(u?.role||'').toUpperCase();
  const isSafety=['S','FS','SS'].includes(role),isCorner=['CB','NB','DB'].includes(role),isLb=role==='LB';
  if(shell==='man'&&manReceiver){
    const recvPath=secondaryMap?.get(manReceiver);
    if(Array.isArray(recvPath)&&recvPath.length>1){
      const end=recvPath.at(-1),mid=recvPath[Math.min(recvPath.length-1,Math.max(1,Math.floor(recvPath.length*.55)))];
      const leverage=(start.y<=manReceiver.y?-1:1)*(isSafety?3.4:isCorner?2.2:2.8);
      return [start,
        {x:gvClamp(mid.x-dir*(isSafety?2.8:1.5),5,95),y:gvClamp(mid.y+leverage,7,93)},
        {x:gvClamp(end.x-dir*(isSafety?3.2:1.8),5,95),y:gvClamp(end.y+leverage,7,93)}];
    }
  }
  // Zone defenders keep their shell through the ball's flight. They may shade
  // toward the throw, but they do not abandon their landmark before the catch.
  const z=gvZoneLandmark(u,built,index);
  const shade=isSafety?.10:isCorner?.14:isLb?.18:.16;
  const landmark={
    x:gvClamp(z.x+(catchPt.x-z.x)*shade,5,95),
    y:gvClamp(z.y+(catchPt.y-z.y)*shade,7,93)
  };
  const read={
    x:gvClamp(start.x+(landmark.x-start.x)*.38,5,95),
    y:gvClamp(start.y+(landmark.y-start.y)*.34,7,93)
  };
  return [start,read,landmark];
}

function gvPassFlightContinuations(evt,built,passer,receiver,coverage,catchPt,dir,duration,secondaryContinuations=[],shell='zone'){
  const protection=gvPassProtectionFlightMotions(evt,built,passer,dir,duration,[receiver]);
  const excluded=new Set([passer,receiver,...(coverage||[]),...(protection.used||[])].filter(Boolean));
  const secondaryMap=new Map((secondaryContinuations||[]).map(x=>[x.unit,x.after]));
  const manByDefender=new Map((shell==='man'?gvManCoverageAssignments(built):[]).map(pair=>[pair.defender,pair.receiver]));
  const moves=[...(protection.moves||[])];
  const spacingReserved=[catchPt,{x:passer.x,y:passer.y}];
  const addSpaced=(u,path,dur,i)=>{
    const spaced=gvSpacingGuardPath(path,spacingReserved,4.6,assignmentHash(`${evt?.id||''}|pass-flight-spacing|${u?.role||''}|${u?.playerId||''}|${i}`),dir);
    if(spaced?.length)spacingReserved.push({...spaced.at(-1)});
    moves.push(gvMove(u,spaced,dur));
  };
  for(const u of built?.units||[]){
    if(excluded.has(u))continue;
    if(u.side==='offense'){
      const line=['LT','LG','C','RG','RT'].includes(u.role);
      const skill=['WR','TE','RB'].includes(u.role);
      const continuation=secondaryMap.get(u);
      if(skill&&Array.isArray(continuation)&&continuation.length>1){
        // Finish the route the receiver was already running instead of snapping
        // into a generic downfield vector at release.
        addSpaced(u,continuation,duration+(moves.length%3)*25,moves.length);
        continue;
      }
      let target;
      if(line){
        target={x:gvClamp(u.x+dir*1.4,5,95),y:gvClamp(u.y+(50-u.y)*.04,7,93)};
      }else if(skill){
        target={x:gvClamp(u.x+dir*(5+(Math.abs(u.y-catchPt.y)<18?2:0)),5,95),y:gvClamp(u.y+(catchPt.y-u.y)*.22,7,93)};
      }else{
        target={x:gvClamp(u.x+dir*2,5,95),y:u.y};
      }
      addSpaced(u,[{x:u.x,y:u.y},target],duration+(moves.length%3)*25,moves.length);
    }else{
      const rush=['EDGE','DE','DT','NT'].includes(u.role);
      const target=rush
        ?{x:gvClamp(passer.x+dir*.6,5,95),y:gvClamp(passer.y+(u.y-passer.y)*.12,7,93)}
        :{x:gvClamp(catchPt.x-dir*(2.5+(moves.length%4)),5,95),y:gvClamp(catchPt.y+((moves.length%5)-2)*2.2,7,93)};
      if(rush){
        const mid={x:gvClamp(u.x+(target.x-u.x)*.56,5,95),y:gvClamp(u.y+(target.y-u.y)*.55,7,93)};
        addSpaced(u,[{x:u.x,y:u.y},mid,target],duration+(moves.length%4)*30,moves.length);
      }else{
        // v0.4.38: secondary defenders who are not one of the two primary
        // coverage actors no longer all break directly on the receiver.
        // Preserve their shell / leverage and let them close only into a
        // support landmark several yards away from the catch point.
        addSpaced(u,gvPassShellFlightPath(evt,built,u,catchPt,dir,moves.length,shell,secondaryMap,manByDefender.get(u)||null),duration+(moves.length%4)*30,moves.length);
      }
    }
  }
  return moves;
}

function gvFinishOffenseContinuations(evt,carrier,built,dir,duration,exclude=[]){
  return gvContinueOffenseDownfield(evt,carrier,built?.units||[],dir,duration,[carrier,...exclude]);
}


function gvCarrierPathSamples(path,count=5){
  if(!Array.isArray(path)||!path.length)return [];
  if(path.length<=count)return path.map(p=>({...p}));
  const out=[];
  for(let i=0;i<count;i++){
    const idx=Math.round((path.length-1)*(i/(count-1)));
    out.push({...path[idx]});
  }
  return out;
}
function gvLikelyTerminalTacklers(defenders,carrierPath,dir,maxTacklers=2){
  const end=Array.isArray(carrierPath)&&carrierPath.length?carrierPath.at(-1):null;
  if(!end)return [];
  return (defenders||[]).slice().sort((a,b)=>{
    const score=u=>{
      const role=String(u?.role||'').toUpperCase();
      const d=Math.hypot(u.x-end.x,u.y-end.y);
      const ahead=((u.x-end.x)*dir)>0?-.7:0;
      const front=['EDGE','DE','DT','NT','LB'].includes(role)?-.35:0;
      return d+ahead+front;
    };
    return score(a)-score(b);
  }).slice(0,Math.max(0,maxTacklers));
}
function gvPursuitStandoff(role,index=0){
  const r=String(role||'').toUpperCase();
  // v0.4.38: non-tacklers are support players, not extra bodies at the pile.
  // Keep a deliberately larger perimeter around the action player so a whole
  // unit cannot visually home in on the same terminal neighborhood.
  if(['S','FS','SS'].includes(r))return 15+(index%2)*2.0;
  if(['CB','NB','DB'].includes(r))return 12+(index%3)*1.7;
  if(r==='LB')return 9+(index%3)*1.4;
  if(['EDGE','DE','DT','NT'].includes(r))return 7+(index%3)*1.2;
  return 8+(index%3)*1.3;
}
function gvDynamicPursuitPath(defender,carrierPath,dir,index=0,role='',options={}){
  const samples=gvCarrierPathSamples(carrierPath,6);
  if(!samples.length)return [{x:defender.x,y:defender.y}];
  const start={x:defender.x,y:defender.y},r=String(role||defender?.role||'').toUpperCase();
  const out=[start],backside=((start.x-samples[0].x)*dir)<-1;
  const laneOrder=[0,-1,1,-2,2,-3,3],lane=laneOrder[index%laneOrder.length];
  const isDb=['CB','S','FS','SS','NB','DB'].includes(r),isSafety=['S','FS','SS'].includes(r),isLb=r==='LB';
  const primary=!!options?.primaryTackler;
  if(primary){
    // Only the selected tackle candidates are allowed to keep keying the full
    // carrier path all the way to contact.
    for(let i=1;i<samples.length;i++){
      const c=samples[i],phase=i/(samples.length-1);
      const depthBias=(backside?5.8:2.2)+(isDb?2.0:isLb?.8:0)*(1-phase);
      const close=Math.max(.9,depthBias*(1-phase*.68));
      const lateral=lane*(isDb?2.8:isLb?2.2:1.8)*(0.55+phase*.45);
      out.push({x:gvClamp(c.x-dir*close,5,95),y:gvClamp(c.y+lateral,6,94)});
    }
    return out;
  }

  // v0.4.38 anti-homing rule: a non-primary defender reacts to the developing
  // play only through its early/middle samples, then settles into a support
  // perimeter. It never receives the carrier's complete future path as a set
  // of progressively tighter destinations.
  const standoff=gvPursuitStandoff(r,index);
  const readSample=samples[Math.min(samples.length-1,2)]||samples[0];
  const developSample=samples[Math.min(samples.length-1,3)]||readSample;
  const sideSign=lane===0?((start.y<=samples[0].y)?-1:1):Math.sign(lane);
  const lateralBase=isSafety?standoff*.72:isDb?standoff*.62:isLb?standoff*.46:standoff*.38;
  const depthHold=isSafety?standoff*.78:isDb?standoff*.58:isLb?standoff*.32:standoff*.22;
  const read={
    x:gvClamp(start.x+(readSample.x-start.x)*(isSafety?.16:isDb?.22:isLb?.34:.42),5,95),
    y:gvClamp(start.y+(readSample.y-start.y)*(isSafety?.12:isDb?.18:isLb?.30:.36),6,94)
  };
  const leverage={
    x:gvClamp(developSample.x-dir*depthHold,5,95),
    y:gvClamp(developSample.y+sideSign*lateralBase,6,94)
  };
  const settle={
    x:gvClamp(leverage.x-dir*(backside?2.2:.8),5,95),
    y:gvClamp(leverage.y+sideSign*(isSafety?2.4:isDb?1.8:isLb?1.1:.8),6,94)
  };
  return [start,read,leverage,settle];
}
function gvDynamicPursuitMotions(evt,carrier,carrierPath,defenders,dir,duration,exclude=[]){
  const excluded=new Set(exclude.filter(Boolean));
  const available=(defenders||[]).filter(d=>!excluded.has(d));
  const tacklers=new Set(gvLikelyTerminalTacklers(available,carrierPath,dir,2));
  evt&&(evt.pursuitArrival={maxClosers:2,closers:[...tacklers].map(u=>u?.role||u?.playerId||'DEF'),standoffOthers:true});
  return available.map((d,i)=>{
    let path=gvDynamicPursuitPath(d,carrierPath,dir,i,d.role,{primaryTackler:tacklers.has(d)});
    if(!tacklers.has(d))path=gvReactionBudgetPath(path,d.role,'late',i);
    return gvMove(d,path,duration+(i%4)*30);
  });
}
function gvBlockReleasePath(blocker,carrier,dir,index=0){
  const side=blocker.y<50?-1:1;
  const forward=3.5+(index%3)*1.2;
  const laneOffset=side*(2.5+(index%3)*1.2);
  return [
    {x:blocker.x,y:blocker.y},
    {x:gvClamp(blocker.x+dir*forward,5,95),y:gvClamp(blocker.y+side*(1.5+(index%2)),7,93)},
    {x:gvClamp(blocker.x+dir*(forward+2.2),5,95),y:gvClamp(blocker.y+laneOffset,7,93)}
  ];
}
function gvReleaseRunBlockers(evt,built,carrier,dir,duration,exclude=[]){
  const excluded=new Set(exclude.filter(Boolean));
  const blockers=(built?.units||[]).filter(u=>u.side==='offense'&&['LT','LG','C','RG','RT','TE','RB','WR'].includes(u.role)&&u!==carrier&&!excluded.has(u));
  return gvSpacedMoveSet(blockers,(u,i)=>gvBlockReleasePath(u,carrier,dir,i),(u,i)=>duration+(i%3)*25,
    {minGap:4.2,anchors:[carrier],dir,seedBase:`${evt?.id||''}|release-blockers`});
}

function gvContinueDefensivePursuit(evt,carrier,defenders,dir,duration,exclude=[]){
  const excluded=new Set(exclude.filter(Boolean));
  return (defenders||[]).filter(d=>!excluded.has(d)).map((d,i)=>{
    const target=gvPursuitTarget(carrier,dir,i,Math.abs(carrier.x-d.x),d);
    const mid={
      x:gvClamp(d.x+(target.x-d.x)*.62,5,95),
      y:gvClamp(d.y+(target.y-d.y)*.68,6,94)
    };
    return gvMove(d,[{x:d.x,y:d.y},mid,target],duration+(i%4)*35);
  });
}
function gvContinueOffenseDownfield(evt,carrier,units,dir,duration,exclude=[]){
  const excluded=new Set(exclude.filter(Boolean));
  const eligible=(units||[]).filter(u=>u.side==='offense'&&!excluded.has(u));
  return gvSpacedMoveSet(eligible,(u,i)=>{
    const side=u.y<carrier.y?-1:1;
    const trailGap=7+(i%5)*1.6;
    const desiredX=carrier.x-dir*trailGap;
    const advance=u.x+dir*(3+(i%3));
    const x=dir>0?Math.min(advance,desiredX):Math.max(advance,desiredX);
    const target={x:gvClamp(x,5,95),y:gvClamp(u.y+side*(1.2+(i%3)*.8),7,93)};
    return [{x:u.x,y:u.y},target];
  },(u,i)=>duration+(i%3)*30,{minGap:4.5,anchors:[carrier],dir,seedBase:`${evt?.id||''}|offense-downfield`});
}



function gvCarrierInterceptPoint(carrier,defenders,dir,context='run'){
  const list=(defenders||[]).map(d=>({
    d,
    dist:Math.hypot(d.x-carrier.x,d.y-carrier.y),
    ahead:(d.x-carrier.x)*dir,
    lateral:Math.abs(d.y-carrier.y)
  })).sort((a,b)=>a.dist-b.dist);
  if(!list.length)return {x:carrier.x,y:carrier.y,securedBy:null};
  const first=list[0],second=list[1]||null;
  let advance=1.2;
  if(first.ahead>0&&first.lateral<7)advance=.4;
  else if(first.ahead<0)advance=2.2;
  if(context==='yac')advance+=.6;
  const yBias=Math.max(-2.5,Math.min(2.5,(first.d.y-carrier.y)*.22));
  return {
    x:gvClamp(carrier.x+dir*advance,5,95),
    y:gvClamp(carrier.y+yBias,6,94),
    securedBy:first.d,
    second:second?.d||null
  };
}
// Legacy dead-ball spacing helpers are retained for compatibility. Since v0.4.31
// they are not used after a terminal whistle; v0.4.33 prevents uninvolved
// players from receiving new movement once terminal contact begins. v0.4.38
// additionally keeps off-ball endpoints separated before the whistle.
function gvDeadBallFlowTargets(carrier,defenders,dir,securedBy=null){
  return (defenders||[]).filter(d=>d!==securedBy).map((d,i)=>{
    const side=d.y<carrier.y?-1:1;
    const behind=2.5+Math.min(7,i*.6);
    return {
      x:gvClamp(carrier.x-dir*behind,5,95),
      y:gvClamp(carrier.y+side*(3.5+(i%4)*2),6,94)
    };
  });
}
function gvFlowAroundDeadBall(evt,carrier,defenders,dir,duration,securedBy=null){
  const rest=(defenders||[]).filter(d=>d!==securedBy);
  const targets=gvDeadBallFlowTargets(carrier,rest,dir,securedBy);
  return rest.map((d,i)=>gvMove(d,[{x:d.x,y:d.y},targets[i]],duration+(i%3)*25,'ease-out'));
}
function gvDeadBallOffenseFlow(carrier,built,dir,duration,exclude=[]){
  const excluded=new Set([carrier,...exclude].filter(Boolean));
  return (built?.units||[]).filter(u=>u.side==='offense'&&!excluded.has(u)).map((u,i)=>{
    const target={
      x:gvClamp(u.x+dir*(1.2+(i%3)*.6),5,95),
      y:gvClamp(u.y+(carrier.y-u.y)*.12,7,93)
    };
    return gvMove(u,[{x:u.x,y:u.y},target],duration+(i%3)*20,'ease-out');
  });
}

function gvPursuitLaneTargets(carrier,defenders,dir){
  const sorted=(defenders||[]).slice().sort((a,b)=>Math.hypot(a.x-carrier.x,a.y-carrier.y)-Math.hypot(b.x-carrier.x,b.y-carrier.y));
  return sorted.map((d,i)=>{
    if(i===0)return {x:carrier.x-dir*.5,y:carrier.y};
    if(i===1)return {x:carrier.x-dir*1.1,y:gvClamp(carrier.y+(d.y<carrier.y?-2.5:2.5),6,94)};
    const lane=((i%5)-2)*2.4;
    return {x:gvClamp(carrier.x-dir*(2.5+Math.min(6,i*.5)),5,95),y:gvClamp(carrier.y+lane,6,94)};
  });
}

function gvSituationalTackleContext(evt,carrier,defenders,dir,context='run'){
  const intercept=gvCarrierInterceptPoint(carrier,defenders,dir,context);
  const nearby=(defenders||[]).map(d=>({d,...gvDefenderArrivalGeometry(intercept,d,dir)}))
    .sort((a,b)=>a.distance-b.distance);
  const nearest=nearby[0]||null,second=nearby[1]||null;
  const nearSideline=carrier?Math.min(carrier.y,100-carrier.y)<10:false;
  const multiple=nearby.filter(x=>x.distance<7).length>=2;
  const frontFit=nearest&&nearest.angle==='front'&&nearest.distance<6;
  const pursuit=nearest&&nearest.angle==='behind'&&nearest.distance<7;
  const angle=nearest&&nearest.angle==='angle'&&nearest.distance<7;
  const seed=assignmentHash(`${evt?.id||''}|tackle-context|${context}|${carrier?.x}|${carrier?.y}`);
  return {nearby,nearest,second,nearSideline,multiple,frontFit,pursuit,angle,seed,intercept};
}
function gvSituationalTackleType(evt,carrier,defenders,dir,context='run'){
  const c=gvSituationalTackleContext(evt,carrier,defenders,dir,context);
  const r=simRand(c.seed,611);
  const big=gvEventIsBigPlay(evt,16);
  if(c.multiple&&r<.72)return 'gang-tackle';
  if(c.nearSideline&&c.nearest&&r<.78)return 'sideline-push';
  if(c.frontFit&&r<.72)return 'hole-stick';
  if(c.pursuit&&r<.72)return 'pursuit-drag';
  if(c.angle&&r<.76)return 'angle-tackle';
  if(big&&r>.73)return 'missed-tackle';
  if(big&&r>.52)return 'broken-tackle';
  return null;
}
async function gvAnimateSituationalTackle(evt,carrier,defenders,dir,totalDuration,context='run',forcedType=null){
  if(!carrier)return;
  const c=gvSituationalTackleContext(evt,carrier,defenders,dir,context);
  const type=forcedType||gvSituationalTackleType(evt,carrier,defenders,dir,context);
  if(!type)return gvAnimateContactFinish(evt,carrier,defenders,dir,totalDuration,context);

  const dur=gvPhaseDur(totalDuration,.12,480);
  const nearest=c.nearest?.d||defenders?.[0];
  const second=c.second?.d||null;
  const hitPoint=c.intercept||{x:carrier.x,y:carrier.y};

  if(type==='hole-stick'&&nearest){
    const hit={x:hitPoint.x,y:hitPoint.y};
    await Promise.allSettled([
      gvMove(nearest,[{x:nearest.x,y:nearest.y},{x:hit.x-dir*.5,y:hit.y}],dur),
      gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},hit],evt,null,dir),dur)
    ]);
    gvImpactAt(hit.x,hit.y,true);carrier.el?.classList.add('tackled');gvTerminalFrameAudit(evt,'hole-stick',[carrier,nearest],{terminalContact:true});return;
  }

  if(type==='pursuit-drag'&&nearest){
    await Promise.allSettled([
      gvMove(nearest,[{x:nearest.x,y:nearest.y},{x:hitPoint.x-dir*.5,y:hitPoint.y}],dur),
      gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},{x:hitPoint.x,y:hitPoint.y}],evt,null,dir),dur)
    ]);
    gvImpactAt(hitPoint.x,hitPoint.y,true);carrier.el?.classList.add('tackled');gvTerminalFrameAudit(evt,'pursuit-drag',[carrier,nearest],{terminalContact:true});return;
  }

  if(type==='angle-tackle'&&nearest){
    const side=Math.sign(c.nearest.lateral||1);
    await Promise.allSettled([
      gvMove(nearest,[{x:nearest.x,y:nearest.y},{x:hitPoint.x-dir*.7,y:hitPoint.y-side*.5}],dur),
      gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},{x:hitPoint.x,y:hitPoint.y}],evt,null,dir),dur)
    ]);
    gvImpactAt(hitPoint.x,hitPoint.y,true);carrier.el?.classList.add('tackled');gvTerminalFrameAudit(evt,'angle-tackle',[carrier,nearest],{terminalContact:true});return;
  }

  if(type==='gang-tackle'&&nearest){
    const tacklers=[nearest,second].filter(Boolean);
    await Promise.allSettled([
      ...tacklers.map((d,i)=>gvMove(d,[{x:d.x,y:d.y},{x:hitPoint.x-dir*(.5+i*.3),y:hitPoint.y+(i?2:-2)}],dur)),
      gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},{x:hitPoint.x,y:hitPoint.y}],evt,null,dir),dur)
    ]);
    gvImpactAt(hitPoint.x,hitPoint.y,true);carrier.el?.classList.add('tackled');gvTerminalFrameAudit(evt,'gang-tackle',[carrier,...tacklers],{terminalContact:true,maxTacklers:2});return;
  }

  if(type==='sideline-push'&&nearest){
    const sideline=carrier.y<50?6:94,side=carrier.y<50?-1:1;
    const dead={x:gvClamp(carrier.x+dir*1.2,5,95),y:sideline};
    await Promise.allSettled([
      gvMove(nearest,[{x:nearest.x,y:nearest.y},{x:dead.x-dir*.5,y:dead.y-side*1.5}],dur),
      gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},{x:dead.x-dir*.4,y:gvClamp(carrier.y+side*4,6,94)},dead],evt,null,dir),dur)
    ]);
    gvImpactAt(carrier.x,carrier.y,false);carrier.el?.classList.add('tackled');gvTerminalFrameAudit(evt,'sideline-push',[carrier,nearest],{terminalContact:true});return;
  }

  if(type==='missed-tackle'&&nearest){
    const side=simRand(c.seed,612)>.5?1:-1;
    await Promise.allSettled([
      gvMove(nearest,[{x:nearest.x,y:nearest.y},{x:carrier.x-dir*.3,y:carrier.y-side*2},{x:carrier.x+dir*.5,y:carrier.y-side*6}],dur),
      gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},{x:carrier.x+dir*2,y:carrier.y+side*2}],evt,null,dir),dur)
    ]);
    gvImpactAt(carrier.x,carrier.y,false);return;
  }

  if(type==='broken-tackle'&&nearest){
    const side=simRand(c.seed,613)>.5?1:-1;
    await Promise.allSettled([
      gvMove(nearest,[{x:nearest.x,y:nearest.y},{x:carrier.x-dir*.5,y:carrier.y},{x:carrier.x-dir*.2,y:carrier.y+side*4}],dur),
      gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},{x:carrier.x+dir*1.5,y:carrier.y-side*1.5},{x:carrier.x+dir*3,y:carrier.y-side*2}],evt,null,dir),dur)
    ]);
    gvImpactAt(carrier.x,carrier.y,false);return;
  }

  return gvAnimateContactFinish(evt,carrier,defenders,dir,totalDuration,context);
}

function gvTerminalContactParticipants(carrier,defenders,maxTacklers=2){
  if(!carrier)return {carrier:null,tacklers:[]};
  const tacklers=(defenders||[]).slice().sort((a,b)=>
    Math.hypot(a.x-carrier.x,a.y-carrier.y)-Math.hypot(b.x-carrier.x,b.y-carrier.y)
  ).slice(0,Math.max(0,maxTacklers));
  return {carrier,tacklers};
}

function gvContactFinishType(evt,carrier,defenders,context='run'){
  const seed=assignmentHash(`${evt?.id||''}|finish|${context}`);
  const r=simRand(seed,73);
  const big=gvEventIsBigPlay(evt,18);
  const yards=gvEventStatYards(evt);
  const nearSideline=carrier?carrier.y<20||carrier.y>80:false;
  const dir=Number(evt?.side==='right'?-1:1);

  if(/touchdown/i.test(String(evt?.detail||''))||Number(evt?.intervalAnalysis?.stats?.rush_td||0)>0||Number(evt?.intervalAnalysis?.stats?.rec_td||0)>0||Number(evt?.intervalAnalysis?.stats?.def_td||0)>0){
    return r<.42?'goal-line-collision':r<.72?'celebration':'walk-in';
  }
  if(nearSideline&&r<.45)return 'sideline-push';
  if(big&&r<.34)return 'missed-tackle';
  if(defenders?.length>=2&&r<.42)return 'gang-tackle';
  if(r<.62)return 'angle-tackle';
  if(r<.78)return 'diving-stop';
  return yards>=12?'wrap-and-drag':'wrap-tackle';
}

async function gvAnimateContactFinish(evt,carrier,defenders,dir,totalDuration,context='run'){
  if(!carrier)return;
  const finishDur=gvPhaseDur(totalDuration,.16,650);
  const type=gvContactFinishType(evt,carrier,defenders,context);
  const seed=assignmentHash(`${evt?.id||''}|finish-motion|${context}|${type}`);
  const persisted=(['yac','broken-tackle','reception'].includes(context)&&Array.isArray(evt?._gvPostCatchClosers))
    ?evt._gvPostCatchClosers.filter(d=>(defenders||[]).includes(d)).slice(0,2):[];
  const eligible=persisted.length?persisted:(defenders||[]);
  const terminal=gvTerminalContactParticipants(carrier,eligible,2);
  const nearest=eligible.slice().sort((a,b)=>Math.hypot(a.x-carrier.x,a.y-carrier.y)-Math.hypot(b.x-carrier.x,b.y-carrier.y));
  evt&&(evt.terminalContact={maxTacklers:2,tacklers:terminal.tacklers.map(u=>u?.role||u?.playerId||'DEF'),freezeOthers:true});

  if(type==='missed-tackle'){
    const d=nearest[0];
    if(d){
      const side=simRand(seed,2)>.5?1:-1;
      await Promise.allSettled([
        gvMove(d,[{x:d.x,y:d.y},{x:carrier.x-dir*.5,y:carrier.y+side*2},{x:carrier.x-dir*2,y:carrier.y+side*8}],Math.max(360,finishDur*.7)),
        gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},{x:carrier.x+dir*5,y:gvClamp(carrier.y-side*5,10,90)}],evt,null,dir),finishDur)
      ]);
      gvImpactAt(carrier.x-dir*2,carrier.y+side*2,false);
    }
    return;
  }

  if(type==='sideline-push'){
    const d=nearest[0];
    const side=carrier.y<50?-1:1;
    const target={x:carrier.x+dir*2,y:gvClamp(carrier.y+side*10,4,96)};
    if(d)await Promise.allSettled([
      gvMove(d,[{x:d.x,y:d.y},{x:carrier.x-dir*.5,y:carrier.y-side*1}],finishDur),
      gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},target],evt,null,dir),finishDur)
    ]);
    else await gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},target],evt,null,dir),finishDur);
    gvImpactAt(target.x,target.y,false);
    carrier.el.classList.add('tackled');
    gvTerminalFrameAudit(evt,'sideline-push',[carrier,d].filter(Boolean),{terminalContact:true});
    return;
  }

  if(type==='gang-tackle'){
    // Terminal contact is deliberately limited to the carrier and at most two
    // actual tacklers. Everyone else holds the coordinate reached during live pursuit.
    const tacklers=nearest.slice(0,2);
    const contact={x:gvClamp(carrier.x+dir*.65,5,95),y:carrier.y};
    await Promise.allSettled([
      gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},contact],evt,null,dir),finishDur),
      ...tacklers.map((u,i)=>gvMove(u,[
        {x:u.x,y:u.y},
        {x:contact.x-dir*(.7+i*.25),y:gvClamp(contact.y+(i?-2.4:2.4),6,94)}
      ],finishDur+i*35))
    ]);
    gvImpactAt(contact.x,contact.y,true);
    carrier.el.classList.add('tackled');
    gvTerminalFrameAudit(evt,'gang-tackle',[carrier,...tacklers],{terminalContact:true,maxTacklers:2});
    return;
  }

  if(type==='diving-stop'){
    const d=nearest[0];
    if(d){
      await gvMove(d,[{x:d.x,y:d.y},{x:carrier.x-dir*3,y:carrier.y},{x:carrier.x,y:carrier.y}],finishDur);
      d.el?.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:'translate(-50%,-50%) scale(1.12) rotate(8deg)'},{transform:'translate(-50%,-50%) scale(.98) rotate(18deg)'}],{duration:finishDur,easing:'ease-out',fill:'forwards'});
    }
    gvImpactAt(carrier.x,carrier.y,true);carrier.el.classList.add('tackled');
    gvTerminalFrameAudit(evt,'diving-stop',[carrier,d].filter(Boolean),{terminalContact:true});
    return;
  }

  if(type==='wrap-and-drag'){
    const d=nearest[0];
    const drag={x:carrier.x+dir*3,y:carrier.y+(simRand(seed,8)-.5)*4};
    if(d)await Promise.allSettled([
      gvMove(d,[{x:d.x,y:d.y},{x:carrier.x-dir*.5,y:carrier.y},drag],finishDur),
      gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},drag],evt,null,dir),finishDur)
    ]);
    gvImpactAt(drag.x,drag.y,false);carrier.el.classList.add('tackled');
    gvTerminalFrameAudit(evt,'wrap-and-drag',[carrier,d].filter(Boolean),{terminalContact:true});
    return;
  }

  if(type==='goal-line-collision'){
    const tacklers=nearest.slice(0,2);
    const target={x:carrier.x+dir*2.5,y:carrier.y};
    await Promise.allSettled([
      gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},target],evt,null,dir),finishDur),
      ...tacklers.map((u,i)=>gvMove(u,[{x:u.x,y:u.y},{x:target.x-dir*.6,y:target.y+(i?4:-4)}],finishDur+i*40))
    ]);
    gvImpactAt(target.x,target.y,true);
    if(!gvIsTouchdownEvent(evt))gvTerminalFrameAudit(evt,'goal-line-collision',[carrier,...tacklers],{terminalContact:true});
    return;
  }

  if(type==='celebration'||type==='walk-in'){
    const extra=type==='walk-in'?6:3;
    await gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},{x:carrier.x+dir*extra,y:carrier.y}],evt,null,dir),Math.max(300,finishDur*.65));
    await gvAnimateScorerCelebration(evt,carrier,type,totalDuration);
    return;
  }

  const d=nearest[0];
  if(d){
    const yoff=type==='angle-tackle'?(simRand(seed,11)>.5?4:-4):0;
    const contact={x:gvClamp(carrier.x+dir*.55,5,95),y:gvClamp(carrier.y+yoff*.12,6,94)};
    await Promise.allSettled([
      gvMove(d,[{x:d.x,y:d.y},{x:contact.x-dir*1.2,y:contact.y+yoff},{x:contact.x-dir*.25,y:contact.y}],finishDur),
      gvMove(carrier,gvGuardNonTouchdownEndzone([{x:carrier.x,y:carrier.y},contact],evt,null,dir),finishDur)
    ]);
    gvImpactAt(contact.x,contact.y,type==='angle-tackle');
  }else gvImpactAt(carrier.x,carrier.y,type==='angle-tackle');
  carrier.el.classList.add('tackled');
  gvTerminalFrameAudit(evt,type,[carrier,d].filter(Boolean),{terminalContact:true});
}

async function gvAnimateScorerCelebration(evt,carrier,style='celebration',totalDuration=1200){
  if(!carrier?.el)return;
  const seed=assignmentHash(`${evt?.id||''}|celebration|${style}`);
  const r=simRand(seed,91);
  let frames;
  if(r<.25)frames=[
    {transform:'translate(-50%,-50%) scale(1) rotate(0deg)'},
    {transform:'translate(-50%,-50%) scale(1.18) rotate(-8deg)'},
    {transform:'translate(-50%,-50%) scale(1.06) rotate(8deg)'},
    {transform:'translate(-50%,-50%) scale(1.12) rotate(0deg)'}
  ];
  else if(r<.5)frames=[
    {transform:'translate(-50%,-50%) scale(1)'},
    {transform:'translate(-50%,-58%) scale(1.16)'},
    {transform:'translate(-50%,-50%) scale(1.08)'}
  ];
  else if(r<.75)frames=[
    {transform:'translate(-50%,-50%) rotate(0deg)'},
    {transform:'translate(-50%,-50%) rotate(18deg) scale(1.12)'},
    {transform:'translate(-50%,-50%) rotate(-12deg) scale(1.08)'},
    {transform:'translate(-50%,-50%) rotate(0deg)'}
  ];
  else frames=[
    {transform:'translate(-50%,-50%) scale(1)'},
    {transform:'translate(-50%,-50%) scale(1.22)'},
    {transform:'translate(-50%,-50%) scale(1.04)'}
  ];
  const a=carrier.el.animate(frames,{duration:Math.max(420,gvPhaseDur(totalDuration,.12,520)),easing:'ease-out',fill:'forwards'});
  gvActorAnimations.push(a);
  await a.finished.catch(()=>{});
}

async function gvAnimateRbConcept(evt,built,totalDuration){
  const rb=built.scorer||gvUnit(built,'offense','RB');if(!rb)return;
  const qb=gvUnit(built,'offense','QB'),dir=built.formation.dir,{name,index}=gvRbConcept(evt),seed=assignmentHash(`${evt.id}|rb|${index}`);
  const basePath=gvRbPath(name,{x:rb.x,y:rb.y},dir,evt.delta,seed);
  const handoffDur=gvPhaseDur(totalDuration,.14,650),runDur=gvPhaseDur(totalDuration,.52,2200),finishDur=gvPhaseDur(totalDuration,.12,500);

  if(qb){
    let qbPath=[{x:qb.x,y:qb.y},{x:qb.x-dir*1.5,y:qb.y}];
    if(name.includes('jet-sweep')||name.includes('fly-sweep')||name.includes('end-around')||name.includes('reverse')||name.includes('orbit-sweep')){
      const side=name.includes('left')?-1:1;
      qbPath.push({x:qb.x-dir*1.2,y:gvClamp(qb.y+side*5,10,90)},{x:rb.x-dir*.8,y:gvClamp(rb.y-side*2,10,90)});
    }else if(name.startsWith('toss-')||name.startsWith('sweep-')||name.includes('crack-toss'))qbPath.push({x:rb.x-dir*1,y:rb.y+(name.includes('left')?-6:6)});
    else if(name==='draw'||name==='delayed-handoff')qbPath.push({x:qb.x-dir*4,y:qb.y});
    else qbPath.push({x:rb.x+dir*.7,y:rb.y});
    await Promise.allSettled([
      gvMove(qb,qbPath,handoffDur),
      ...gvRunExchangeContinuations(evt,built,rb,qb,dir,handoffDur)
    ]);
  }else{
    await Promise.allSettled(gvRunExchangeContinuations(evt,built,rb,null,dir,handoffDur));
  }

  gvSetPossession(rb);
  const blockers=gvOffensiveBlockers(built.units);
  const front=gvFrontSeven(built.units);
  const coverage=built.units.filter(u=>u.side==='defense'&&!front.includes(u));
  const skill=built.units.filter(u=>u.side==='offense'&&u!==rb&&u!==qb&&!blockers.includes(u));
  const conceptName=name;
  const assignments=gvAssignRunBlockOutcomes(evt,conceptName,gvRunBlockAssignments(built,conceptName));
  const blockDecision=gvCarrierDecisionFromBlocks(evt,conceptName,assignments);
  const rawLaneRead=gvRunLaneRead(evt,built,conceptName,assignments,basePath);
  const containResult=gvRunFitContainResult(evt,conceptName,rawLaneRead,built);
  const laneRead=gvApplyContainToLaneRead(rawLaneRead,containResult);
  const blockPath=gvApplyBlockDrivenCarrierDecision(basePath,evt,built,conceptName,assignments,blockDecision);
  const readPath=gvApplyRunLaneRead(blockPath,evt,built,conceptName,assignments.map(x=>x));
  if(laneRead.read!==rawLaneRead.read){
    const forcedBase=basePath.map(p=>({x:p.x,y:p.y}));
    const side=gvRunConceptSide(conceptName)||(forcedBase.at(-1).y>=forcedBase[0].y?1:-1);
    if(laneRead.read==='cutback'&&forcedBase.length>2){
      forcedBase[1]={x:forcedBase[1].x,y:gvClamp(forcedBase[0].y+side*3,12,88)};
      forcedBase[2]={x:forcedBase[2].x,y:gvClamp(forcedBase[0].y-side*7,12,88)};
    }else if(laneRead.read==='bounce'&&forcedBase.length>2){
      forcedBase[1]={x:forcedBase[1].x,y:gvClamp(forcedBase[0].y+side*6,10,90)};
      forcedBase[2]={x:forcedBase[2].x,y:gvClamp(forcedBase[0].y+side*12,10,90)};
    }
    readPath.splice(0,readPath.length,...gvApplyRunLaneRead(forcedBase,evt,built,conceptName,assignments));
  }
  evt.runBlockDecision=blockDecision.decision;
  evt.runBlockPicture={
    total:Number(blockDecision.picture.total.toFixed(2)),
    edge:Number(blockDecision.picture.edgeScore.toFixed(2)),
    interior:Number(blockDecision.picture.interiorScore.toFixed(2))
  };
  const carrierPath=gvApplyCarrierMove(readPath,evt,dir,'rb-run');
  const decisionTiming=gvRunDecisionTimingPlan(carrierPath,evt,built,conceptName,laneRead,blockDecision);
  const path=gvAlignPositiveOffensivePath(decisionTiming.path,evt,built);
  evt.runDecisionTiming={phase:decisionTiming.phase,read:decisionTiming.read,commitIndex:decisionTiming.commitIndex};
  evt.spacingAudit={version:'0.4.39',offBallGuard:true,minSkillGap:5.0};
  const finish=path.at(-1);
  const laneRunDur=laneRead.read==='penetration'?Math.max(900,runDur*.62):runDur;

  const assignedBlockers=new Set(assignments.map(x=>x.blocker));
  const assignedDefenders=new Set(assignments.map(x=>x.defender));
  const leadCandidates=gvRunLeadCandidates(built,rb).filter(u=>!assignedBlockers.has(u));
  const leadTargets=front.filter(d=>!assignedDefenders.has(d)&&d.role==='LB');
  const leadPairs=leadCandidates.slice(0,1).map((u,i)=>({
    blocker:u,
    defender:gvNearestByY(leadTargets.length?leadTargets:front,{x:u.x+dir*8,y:path[Math.min(2,path.length-1)]?.y||u.y},1)[0],
    kind:'lead'
  })).filter(x=>x.defender);
  leadPairs.forEach(x=>{assignedBlockers.add(x.blocker);assignedDefenders.add(x.defender)});

  assignments.forEach(pair=>{pair.finish=finish});
  leadPairs.forEach(pair=>{pair.finish=finish});
  const background=[
    ...assignments.map((pair,i)=>gvRunBlockMotion(pair,built,conceptName,laneRunDur,pair.outcomeSeed??assignmentHash(`${evt.id}|assignment|${i}`))),
    ...leadPairs.map((pair,i)=>gvRunBlockMotion(pair,built,conceptName,laneRunDur,assignmentHash(`${evt.id}|lead|${i}`))),
    ...gvSpacedMoveSet(blockers.filter(u=>!assignedBlockers.has(u)),
      (u,i)=>gvRunUnassignedBlockerFlowPath(u,path,conceptName,built,i),laneRunDur,
      {minGap:3.8,anchors:[finish],dir,seedBase:`${evt.id}|run-free-block-spacing`}),
    ...gvSpacedMoveSet(skill,(u,i)=>{
      const family=gvRunConceptFamily(conceptName);
      return family==='sweep'
        ?gvSecondaryRunBlockPath(u,path,dir,assignmentHash(`${evt.id}|run-skill|${i}`))
        :gvSecondaryRunPath(u,dir,assignmentHash(`${evt.id}|run-skill|${i}`),10+(i%3)*3);
    },laneRunDur,{minGap:5.0,anchors:[finish],dir,seedBase:`${evt.id}|run-skill-spacing`}),
    ...front.filter(u=>!assignedDefenders.has(u)).map((u,i)=>{
      const shedRoll=simRand(assignmentHash(`${evt.id}|shed|${i}`),33);
      if(shedRoll<.24)return gvRunBlockShedMotion(u,finish,dir,laneRunDur+(i%3)*55,assignmentHash(`${evt.id}|shed-path|${i}`));
      return gvMove(u,gvReactiveRunPursuitPath(u,path,decisionTiming,conceptName,laneRead,built,i),laneRunDur+(i%3)*45);
    }),
    ...coverage.map((u,i)=>
      gvMove(u,gvReactiveRunPursuitPath(u,path,decisionTiming,conceptName,laneRead,built,i+7),laneRunDur+(i%4)*45)
    )
  ];

  if(blockDecision.decision==='hesitate'&&rb?.el){
    const a=rb.el.animate([
      {transform:'translate(-50%,-50%) scale(1)'},
      {transform:'translate(-50%,-50%) scale(.96)'},
      {transform:'translate(-50%,-50%) scale(1.04)'},
      {transform:'translate(-50%,-50%) scale(1)'}
    ],{duration:Math.max(420,laneRunDur*.34),easing:'ease-in-out'});
    gvActorAnimations.push(a);
  }else{
    gvCarrierMoveFlourish(evt,rb,'rb-run',laneRunDur*.7);
  }
  await Promise.allSettled([...background,gvMove(rb,path,laneRunDur)]);

  const breakaway=laneRead.read!=='penetration'&&(gvEventIsBigPlay(evt,18)||name.startsWith('breakaway'));
  if(breakaway){
    const extra=Math.min(16,5+gvEventAnimationYards(evt,.7)*.45);
    const target={x:rb.x+dir*extra,y:gvClamp(rb.y+(simRand(seed,120)-.5)*8,15,85)};
    const breakPath=[{x:rb.x,y:rb.y},target];
    await Promise.allSettled([
      gvMove(rb,breakPath,finishDur),
      ...gvDynamicPursuitMotions(evt,rb,breakPath,built.units.filter(u=>u.side==='defense'),dir,finishDur),
      ...gvReleaseRunBlockers(evt,built,rb,dir,finishDur,[qb])
    ]);
  }
  const defenders=built.units.filter(u=>u.side==='defense');
  if(gvIsTouchdownEvent(evt,'rb_run')){
    await Promise.allSettled([
      gvExtendTouchdownToEndzone(evt,rb,built,dir,Math.max(700,finishDur),'rush-td'),
      ...gvDynamicPursuitMotions(evt,rb,gvTouchdownExtensionPath(rb,built,dir,seed),defenders,dir,Math.max(700,finishDur))
    ]);
    await gvAnimateScorerCelebration(evt,rb,'celebration',totalDuration);
    return;
  }
  if(laneRead.read==='penetration'){
    const tacklers=gvFrontSeven(built.units).slice().sort((a,b)=>Math.hypot(a.x-rb.x,a.y-rb.y)-Math.hypot(b.x-rb.x,b.y-rb.y));
    await gvAnimateSituationalTackle(evt,rb,tacklers.length?tacklers:defenders,dir,totalDuration,'rb-run','hole-stick');
  }else{
    await gvAnimateSituationalTackle(evt,rb,defenders,dir,totalDuration,'rb-run');
  }
}


function gvCatchOutcome(evt,routeVariant){
  const seed=assignmentHash(`${evt.id}|catch-outcome|${routeVariant}`),r=simRand(seed,21),big=gvEventIsBigPlay(evt,18);
  const td=/touchdown/i.test(String(evt?.detail||''))||Number(evt?.intervalAnalysis?.stats?.rec_td||0)>0||Number(evt?.intervalAnalysis?.stats?.pass_td||0)>0;
  if(td)return 'endzone';
  if(r<.14)return 'contested';
  if(r<.24)return 'diving';
  if(['sideline','deep-out','quick-out','comeback','back-shoulder'].includes(routeVariant)&&r<.48)return 'sideline';
  if(r<.63)return 'immediate-tackle';
  if(r<.82)return 'broken-tackle';
  return big?'breakaway':'yac';
}
function gvCoveragePlan(receiver,coverage,catchTarget,outcome,dir,totalDuration){
  const dur=gvPhaseDur(totalDuration,.46,1900);
  return coverage.map((u,i)=>{
    const start={x:u.x,y:u.y},prof=gvDefReactionProfile({id:`coverage-${receiver?.playerId||receiver?.role||''}-${catchTarget.x}-${catchTarget.y}`},u,i+21);
    const leverage=(i===0?1:1.8);
    const delay=prof.name==='patient'||prof.name==='read-and-react'?100:prof.name==='aggressive'||prof.name==='attack'?-40:0;
    const lateral=prof.name==='outside-leverage'?(catchTarget.y<50?-1:1)*5:prof.name==='inside-leverage'?(catchTarget.y<50?1:-1)*4:0;
    const mid1={
      x:start.x+(catchTarget.x-start.x)*(prof.name==='aggressive'?.42:.32)-dir*leverage,
      y:start.y+(catchTarget.y-start.y)*.28+(i?3:-3)+lateral*.35
    };
    const mid2={
      x:start.x+(catchTarget.x-start.x)*(prof.name==='patient'?.58:.68)-dir*(1.2+i*.7),
      y:start.y+(catchTarget.y-start.y)*.66+(i?2.5:-2.5)+lateral*.5
    };

    if(outcome==='contested'||outcome==='breakup'||outcome==='immediate-tackle'){
      const finish={x:catchTarget.x-dir*(i===0?.9:2.0),y:catchTarget.y+(i?2.2:-2.2)+lateral*.2};
      return gvMove(u,[start,mid1,mid2,finish],Math.max(500,dur+(i*80)+delay));
    }
    if(outcome==='sideline'){
      const finish={x:catchTarget.x-dir*(2.5+i),y:catchTarget.y+(i?4:-4)+lateral*.35};
      return gvMove(u,[start,mid1,mid2,finish],Math.max(500,dur+(i*70)+delay));
    }
    if(outcome==='diving'){
      const finish={x:catchTarget.x-dir*(1.8+i),y:catchTarget.y+(i?4.5:-4.5)+lateral*.25};
      return gvMove(u,[start,mid1,mid2,finish],Math.max(500,dur+(i*70)+delay));
    }
    const finish={x:catchTarget.x-dir*(3+i),y:catchTarget.y+(i?4:-4)+lateral*.3};
    return gvMove(u,[start,mid1,mid2,finish],Math.max(500,dur+(i*70)+delay));
  });
}

// v0.4.45: global late-play reaction budget. Support actors may react to a
// change in possession/path, but unless they are explicitly interaction-required
// (tackler, blocker, catch-contest defender) they cannot be dragged large distances
// late in a play. The budget is measured from the actor's position at phase start.
function gvReactionBudget(role,phase='late',index=0){
  const r=String(role||'').toUpperCase();
  const safety=['S','FS','SS'].includes(r),db=['CB','NB','DB'].includes(r),lb=r==='LB';
  const base=phase==='post-catch'
    ?(safety?3.2:db?3.8:lb?4.6:5.2)
    :phase==='qb-scramble'
      ?(safety?3.6:db?4.0:lb?5.0:5.8)
      :phase==='turnover'
        ?(safety?4.0:db?4.6:lb?5.6:6.4)
        :(safety?3.8:db?4.4:lb?5.2:6.0);
  return base+(index%3)*.25;
}
function gvReactionBudgetPath(path,role,phase='late',index=0,maxDistance=null){
  if(!Array.isArray(path)||path.length<2)return path||[];
  const start={...path[0]},budget=(maxDistance!==null&&maxDistance!==undefined&&Number.isFinite(Number(maxDistance)))?Number(maxDistance):gvReactionBudget(role,phase,index);
  return path.map((p,i)=>{
    if(i===0)return {...p};
    const dx=p.x-start.x,dy=p.y-start.y,d=Math.hypot(dx,dy);
    if(d<=budget)return {...p};
    const ux=dx/(d||1),uy=dy/(d||1);
    // Earlier waypoints get a slightly smaller ceiling so the actor eases into
    // its reaction rather than hitting a hard invisible wall on the last frame.
    const progress=i/Math.max(1,path.length-1),cap=budget*(.55+.45*progress);
    return {x:gvClamp(start.x+ux*cap,5,95),y:gvClamp(start.y+uy*cap,6,94)};
  });
}

function gvSupportProtectedPoint(point,actionPoint,role,dir,index=0,minGap=null){
  if(!point||!actionPoint)return point;
  const r=String(role||'').toUpperCase();
  const required=Number.isFinite(Number(minGap))?Number(minGap):gvPursuitStandoff(r,index);
  const dx=point.x-actionPoint.x,dy=point.y-actionPoint.y,d=Math.hypot(dx,dy);
  if(d>=required)return {...point};
  // Project support actors outward from the action player. When a path lands
  // almost exactly on the carrier, use a deterministic leverage lane rather
  // than an arbitrary last-frame shove.
  const lane=[-1,1,-1,1][index%4];
  let ux=d>.15?dx/d:-dir*.55,uy=d>.15?dy/d:lane*.84;
  const norm=Math.max(.001,Math.hypot(ux,uy));ux/=norm;uy/=norm;
  return {x:gvClamp(actionPoint.x+ux*required,5,95),y:gvClamp(actionPoint.y+uy*required,6,94)};
}
function gvSupportProtectedPath(path,carrierPath,role,dir,index=0,minGap=null){
  if(!Array.isArray(path)||!path.length)return path||[];
  const carrier=gvCarrierPathSamples(carrierPath,Math.max(2,path.length));
  return path.map((p,i)=>{
    if(i===0)return {...p};
    const ci=Math.min(carrier.length-1,Math.round((i/(Math.max(1,path.length-1)))*(carrier.length-1)));
    return gvSupportProtectedPoint(p,carrier[ci]||carrier.at(-1),role,dir,index,minGap);
  });
}

function gvCoveragePursuitHandoffPath(defender,carrierPath,dir,index=0,primary=false,wasPrimaryCoverage=false){
  const role=String(defender?.role||'').toUpperCase();
  const base=gvDynamicPursuitPath(defender,carrierPath,dir,index,role,{primaryTackler:primary});
  if(!Array.isArray(base)||base.length<2)return base;
  const start={x:defender.x,y:defender.y};
  const isSafety=['S','FS','SS'].includes(role),isCorner=['CB','NB','DB'].includes(role),isLb=role==='LB';
  if(primary){
    const first=base[Math.min(1,base.length-1)];
    const recognize={x:gvClamp(start.x+(first.x-start.x)*.24,5,95),y:gvClamp(start.y+(first.y-start.y)*.22,6,94)};
    return [start,recognize,...base.slice(1)];
  }

  // v0.4.45 hard anti-magnet rule: non-closers do NOT inherit the receiver's
  // post-catch trajectory at all. They may recognize the catch and make a small
  // role-aware leverage adjustment, but their destination is derived from their
  // own current position, not from a future carrier sample. This prevents long
  // YAC plays from visually pulling an entire secondary toward the receiver.
  const catchStart=(Array.isArray(carrierPath)&&carrierPath.length)?carrierPath[0]:start;
  const side=(start.y<=catchStart.y)?-1:1;
  const forward=isSafety?.35:isCorner?.75:isLb?1.5:2.0;
  const lateral=isSafety?2.8:isCorner?2.2:isLb?1.5:1.1;
  const hold={
    x:gvClamp(start.x+dir*(isSafety?.10:isCorner?.18:isLb?.35:.45),5,95),
    y:gvClamp(start.y+side*(isSafety?.55:isCorner?.45:isLb?.30:.22),6,94)
  };
  let settle={
    x:gvClamp(start.x+dir*forward,5,95),
    y:gvClamp(start.y+side*lateral,6,94)
  };
  // If already close to the catch point, bias outward rather than allowing a
  // support defender to drift into the tackle neighborhood.
  settle=gvSupportProtectedPoint(settle,catchStart,role,dir,index,gvPursuitStandoff(role,index));
  const read={
    x:gvClamp(hold.x+(settle.x-hold.x)*.48,5,95),
    y:gvClamp(hold.y+(settle.y-hold.y)*.48,6,94)
  };
  return [start,hold,read,settle];
}
function gvCoveragePursuitHandoffMotions(evt,carrier,carrierPath,defenders,coverage,dir,duration,exclude=[]){
  const excluded=new Set((exclude||[]).filter(Boolean));
  const available=(defenders||[]).filter(d=>!excluded.has(d));
  const primaryCoverage=new Set((coverage||[]).filter(d=>d&&!excluded.has(d)));
  // v0.4.38: the old logic could leave two coverage defenders already near the
  // receiver and then nominate two MORE defenders as tacklers. Cap the entire
  // post-catch close group at two bodies total, prioritizing actual coverage.
  const preferred=[...primaryCoverage].filter(d=>available.includes(d));
  const remaining=available.filter(d=>!primaryCoverage.has(d));
  const closers=[...preferred.slice(0,2)];
  if(closers.length<2){
    const fill=gvLikelyTerminalTacklers(remaining,carrierPath,dir,2-closers.length);
    closers.push(...fill);
  }
  const tacklers=new Set(closers);
  // Preserve the exact closer assignment through the terminal YAC finish. Do
  // not re-elect a different pair from the whole defense after everyone has
  // moved, which was a remaining source of late-play magnetic convergence.
  if(evt)evt._gvPostCatchClosers=closers.slice(0,2);
  evt&&(evt.coveragePursuitHandoff={shell:evt?.passCoverageShell||'unknown',maxImmediateClosers:2,totalCloserCap:true,recognitionBeforePursuit:true,protectedSupportRadius:true,nonClosersTrackCarrier:false,persistClosersToFinish:true,reactionBudget:true});
  return available.map((d,i)=>{
    let path=gvCoveragePursuitHandoffPath(d,carrierPath,dir,i+7,tacklers.has(d),primaryCoverage.has(d));
    if(!tacklers.has(d)){
      path=gvSupportProtectedPath(path,carrierPath,d.role,dir,i+7,gvPursuitStandoff(d.role,i+7));
      path=gvReactionBudgetPath(path,d.role,'post-catch',i+7);
    }
    return gvMove(d,path,duration+(i%4)*35);
  });
}

async function gvAnimateCatchFinish(evt,built,receiver,coverage,catchPt,outcome,dir,totalDuration){
  const finishDur=gvPhaseDur(totalDuration,.16,650),seed=assignmentHash(`${evt.id}|catch-finish`),statTarget=gvPositiveOffensiveStatTarget(evt,built);
  const catchAnchor={x:Number(receiver.x),y:Number(receiver.y)};
  catchPt.x=catchAnchor.x;catchPt.y=catchAnchor.y;
  gvPassContinuityAudit(evt,'catch-to-finish',receiver,catchAnchor,{outcome});
  if(outcome==='contested'){
    const d=coverage[0];
    await Promise.allSettled([
      ...(d?[gvMove(d,[{x:d.x,y:d.y},{x:catchPt.x-dir*.5,y:catchPt.y-2}],finishDur)]:[])
    ]);
    gvImpactAt(catchPt.x,catchPt.y,true);
    return;
  }
  if(outcome==='diving'){
    // Diving catch is terminal: preserve the field picture at the catch point.
    await Promise.resolve();
    receiver.el.classList.add('tackled');
    gvImpactAt(catchPt.x,catchPt.y,false);
    return;
  }
  if(outcome==='sideline'){
    const side=catchPt.y<50?-1:1,target={x:statTarget?statTarget.x:catchPt.x+dir*6,y:gvClamp(catchPt.y+side*10,4,96)};
    const defenders=built.units.filter(u=>u.side==='defense');
    const terminalDefender=(coverage&&coverage[0])||defenders.slice().sort((a,b)=>
      Math.hypot(a.x-receiver.x,a.y-receiver.y)-Math.hypot(b.x-receiver.x,b.y-receiver.y)
    )[0]||null;
    const finishers=terminalDefender?[gvMove(terminalDefender,[
      {x:terminalDefender.x,y:terminalDefender.y},
      {x:target.x-dir*1.1,y:gvClamp(target.y-side*2.2,5,95)}
    ],finishDur)]:[];
    await Promise.allSettled([
      gvMove(receiver,gvGuardActionPath([catchAnchor,{x:catchAnchor.x+dir*2,y:gvClamp(catchAnchor.y+side*4,4,96)},target],evt,built,dir),finishDur),
      ...finishers
    ]);
    return;
  }
  if(outcome==='immediate-tackle'){
    const defenders=built.units.filter(u=>u.side==='defense');
    // Terminal-contact hard cutoff: no receivers, linemen, or trailing defenders
    // are given a new cleanup destination once the tackle begins.
    await gvAnimateContactFinish(evt,receiver,defenders,dir,totalDuration,'reception');
    return;
  }
  if(outcome==='broken-tackle'){
    const d=coverage[0];
    if(d){await gvMove(d,[{x:d.x,y:d.y},{x:catchPt.x-dir*.5,y:catchPt.y}],Math.max(350,finishDur*.45),'ease-out');gvImpactAt(catchPt.x,catchPt.y,true)}
    const cutSide=(simRand(seed,31)>.5?1:-1),target={x:statTarget?statTarget.x:catchPt.x+dir*(8+Math.min(14,gvEventAnimationYards(evt,.8)*.45)),y:gvClamp(catchPt.y+cutSide*10,12,88)};
    const brokenPath=gvAnchorPathToActor(gvGuardActionPath([catchAnchor,{x:catchAnchor.x+dir*3,y:catchAnchor.y-cutSide*3},target],evt,built,dir),receiver);
    await Promise.allSettled([
      gvMove(receiver,brokenPath,finishDur),
      ...gvCoveragePursuitHandoffMotions(evt,receiver,brokenPath,built.units.filter(u=>u.side==='defense'),coverage,dir,finishDur,[d]),
      ...gvFinishOffenseContinuations(evt,receiver,built,dir,finishDur,[receiver])
    ]);
    const pursuit=built.units.filter(u=>u.side==='defense'&&!coverage.includes(u));
    if(!gvEventIsBigPlay(evt,22))await gvAnimateContactFinish(evt,receiver,[...coverage,...pursuit],dir,totalDuration,'broken-tackle');
    return;
  }
  if(outcome==='endzone'||outcome==='breakaway'||outcome==='yac'){
    const plannedYac=Number(evt?.receptionMotionPlan?.yacAdvance||0),inStride=!!evt?.receptionMotionPlan?.inStride;
    const fallbackExtra=outcome==='endzone'?Math.min(20,10+gvEventAnimationYards(evt,.8)*.5):outcome==='breakaway'?Math.min(18,8+gvEventAnimationYards(evt,.8)*.45):Math.min(12,4+gvEventAnimationYards(evt,.7)*.35);
    const extra=plannedYac>0?Math.max(inStride?4:1,Math.min(outcome==='endzone'?22:20,plannedYac)):fallbackExtra;
    gvCarrierMoveFlourish(evt,receiver,'yac',finishDur*.75);
    let yacPath=gvYacPath(evt,catchAnchor,dir,extra,seed);
    if(statTarget&&outcome!=='endzone')yacPath=gvAlignPathFinalX(yacPath,statTarget.x);
    yacPath=gvGuardActionPath(yacPath,evt,built,dir);
    yacPath=gvAnchorPathToActor(yacPath,receiver);
    gvPhaseHandoffAudit(evt,'catch-to-yac',receiver,catchAnchor,yacPath[0],.12);
    const target=yacPath.at(-1);
    await Promise.allSettled([
      gvMove(receiver,yacPath,finishDur),
      ...gvCoveragePursuitHandoffMotions(evt,receiver,yacPath,built.units.filter(u=>u.side==='defense'),coverage,dir,finishDur,[]),
      ...gvReleaseRunBlockers(evt,built,receiver,dir,finishDur,[receiver])
    ]);
    if(outcome==='endzone'){
      await gvExtendTouchdownToEndzone(evt,receiver,built,dir,Math.max(700,finishDur),'receiving-td');
      gvImpactAt(receiver.x,receiver.y,false);
      await gvAnimateScorerCelebration(evt,receiver,'celebration',totalDuration);
    }else if(outcome==='yac'){
      await gvAnimateContactFinish(evt,receiver,built.units.filter(u=>u.side==='defense'),dir,totalDuration,'yac');
    }
  }
}


const GV_QB_PASS_CONCEPTS=Object.freeze([
  'three-step','five-step','seven-step','shotgun-quick','shotgun-deep','play-action','bootleg-left','bootleg-right',
  'rollout-left','rollout-right','half-roll-left','half-roll-right','pocket-slide-left','pocket-slide-right','climb-pocket',
  'reset-left','reset-right','pump-and-go','quick-release','deep-hitch','under-center-shot','pistol-pass','rpo-look',
  'scramble-reset-left','scramble-reset-right','pressure-release','cross-body','fade-drop','no-huddle-quick','max-protect'
]);
const GV_QB_RUN_CONCEPTS=Object.freeze([
  'scramble-left','scramble-right','scramble-middle','read-option-left','read-option-right','designed-draw','qb-power-left',
  'qb-power-right','bootleg-keep-left','bootleg-keep-right','naked-boot-left','naked-boot-right','goal-line-sneak',
  'shotgun-sneak','pistol-keeper','zone-read-cutback','broken-pocket-left','broken-pocket-right','spin-escape-left',
  'spin-escape-right','step-up-run','edge-race-left','edge-race-right','open-field-middle','delayed-scramble',
  'pressure-flush-left','pressure-flush-right','red-zone-keeper','long-scramble-left','long-scramble-right',
  'speed-option-left','speed-option-right','qb-sweep-left','qb-sweep-right','orbit-keeper-left','orbit-keeper-right'
]);
function gvQbPassConcept(evt){
  const index=assignmentHash(`${evt.id}|qb-pass`)%GV_QB_PASS_CONCEPTS.length;
  return {name:GV_QB_PASS_CONCEPTS[index],index}
}
function gvQbRunConcept(evt){
  const index=assignmentHash(`${evt.id}|qb-run`)%GV_QB_RUN_CONCEPTS.length;
  return {name:GV_QB_RUN_CONCEPTS[index],index}
}
function gvQbDropPath(qb,dir,concept,seed){
  const s={x:qb.x,y:qb.y};
  const left=concept.includes('left'),right=concept.includes('right'),side=left?-1:right?1:0;
  if(concept==='three-step')return [s,{x:s.x-dir*2,y:s.y},{x:s.x-dir*4,y:s.y}];
  if(concept==='five-step')return [s,{x:s.x-dir*2,y:s.y},{x:s.x-dir*5,y:s.y},{x:s.x-dir*7,y:s.y}];
  if(concept==='seven-step')return [s,{x:s.x-dir*3,y:s.y},{x:s.x-dir*7,y:s.y},{x:s.x-dir*10,y:s.y}];
  if(concept.startsWith('shotgun-'))return [s,{x:s.x-dir*3,y:s.y},{x:s.x-dir*(concept.includes('deep')?7:4),y:s.y}];
  if(concept==='play-action')return [s,{x:s.x+dir*1,y:s.y+4},{x:s.x-dir*5,y:s.y},{x:s.x-dir*7,y:s.y-side*2}];
  if(concept.startsWith('bootleg-')||concept.startsWith('rollout-')||concept.startsWith('half-roll-'))
    return [s,{x:s.x-dir*2,y:s.y},{x:s.x-dir*1,y:s.y+side*8},{x:s.x+dir*3,y:s.y+side*14}];
  if(concept.startsWith('pocket-slide-')||concept.startsWith('reset-'))
    return [s,{x:s.x-dir*5,y:s.y},{x:s.x-dir*5,y:s.y+side*7},{x:s.x-dir*4,y:s.y+side*10}];
  if(concept==='climb-pocket')return [s,{x:s.x-dir*7,y:s.y},{x:s.x-dir*4,y:s.y},{x:s.x-dir*1,y:s.y}];
  if(concept==='pump-and-go')return [s,{x:s.x-dir*6,y:s.y},{x:s.x-dir*5,y:s.y+2},{x:s.x-dir*7,y:s.y}];
  if(concept==='fade-drop')return [s,{x:s.x-dir*4,y:s.y},{x:s.x-dir*8,y:s.y+side*2}];
  if(concept.startsWith('scramble-reset-'))return [s,{x:s.x-dir*6,y:s.y},{x:s.x-dir*3,y:s.y+side*11},{x:s.x-dir*4,y:s.y+side*7}];
  if(concept==='pressure-release')return [s,{x:s.x-dir*4,y:s.y},{x:s.x-dir*2,y:s.y+6}];
  if(concept==='cross-body')return [s,{x:s.x-dir*5,y:s.y},{x:s.x-dir*2,y:s.y+9}];
  return [s,{x:s.x-dir*4,y:s.y},{x:s.x-dir*6,y:s.y+(simRand(seed,2)-.5)*4}];
}
function gvQbRunPath(qb,dir,concept,delta,seed){
  const s={x:qb.x,y:qb.y},gain=Math.min(40,8+Math.abs(delta)*2.4),left=concept.includes('left'),right=concept.includes('right'),side=left?-1:right?1:0;
  if(concept.includes('sneak'))return [s,{x:s.x+dir*3,y:s.y},{x:s.x+dir*7,y:s.y}];
  if(concept.includes('draw'))return [s,{x:s.x-dir*2,y:s.y},{x:s.x+dir*3,y:s.y},{x:s.x+dir*gain,y:s.y+side*4}];
  if(concept.includes('boot')||concept.includes('keeper'))return [s,{x:s.x-dir*1,y:s.y},{x:s.x+dir*6,y:s.y+side*10},{x:s.x+dir*gain,y:s.y+side*14}];
  if(concept.includes('edge-race')||concept.includes('pressure-flush'))return [s,{x:s.x-dir*3,y:s.y},{x:s.x+dir*5,y:s.y+side*12},{x:s.x+dir*gain,y:s.y+side*18}];
  if(concept.includes('broken-pocket')||concept.includes('spin-escape'))return [s,{x:s.x-dir*5,y:s.y},{x:s.x-dir*2,y:s.y-side*5},{x:s.x+dir*5,y:s.y+side*7},{x:s.x+dir*gain,y:s.y+side*12}];
  if(concept==='step-up-run')return [s,{x:s.x-dir*6,y:s.y},{x:s.x-dir*2,y:s.y},{x:s.x+dir*gain,y:s.y}];
  if(concept.includes('zone-read'))return [s,{x:s.x+dir*2,y:s.y-side*6},{x:s.x+dir*(gain*.45),y:s.y+side*7},{x:s.x+dir*gain,y:s.y+side*9}];
  if(concept.includes('speed-option')||concept.includes('qb-sweep')||concept.includes('orbit-keeper'))
    return [s,{x:s.x-dir*1.5,y:gvClamp(s.y-side*5,10,90)},{x:s.x+dir*4,y:gvClamp(s.y+side*11,9,91)},
      {x:s.x+dir*(gain*.46),y:gvClamp(s.y+side*20,8,92)},{x:s.x+dir*gain,y:gvClamp(s.y+side*16,9,91)}];
  return [s,{x:s.x-dir*3,y:s.y},{x:s.x+dir*5,y:s.y+side*6},{x:s.x+dir*(gain*.55),y:s.y+side*10},{x:s.x+dir*gain,y:s.y+side*8}];
}
function gvQbRunPursuitPath(defender,qbPath,dir,index=0,primary=false){
  const role=String(defender?.role||'').toUpperCase();
  const base=gvDynamicPursuitPath(defender,qbPath,dir,index,role,{primaryTackler:primary});
  if(!Array.isArray(base)||base.length<2)return base;
  const start={x:defender.x,y:defender.y};
  const isDb=['CB','NB','DB','S','FS','SS'].includes(role),isSafety=['S','FS','SS'].includes(role),isLb=role==='LB';
  let readX=start.x,readY=start.y;
  if(isSafety){readX=gvClamp(start.x-dir*.45,5,95);readY=gvClamp(start.y+(50-start.y)*.018,6,94)}
  else if(isDb){readX=gvClamp(start.x-dir*.16,5,95);readY=gvClamp(start.y+(50-start.y)*.014,6,94)}
  else if(isLb){readX=gvClamp(start.x+dir*.42,5,95);readY=gvClamp(start.y+(qbPath[0].y-start.y)*.06,6,94)}
  else{readX=gvClamp(start.x+dir*.72,5,95);readY=gvClamp(start.y+(qbPath[0].y-start.y)*.08,6,94)}
  const read={x:readX,y:readY};
  const first=base[Math.min(base.length-1,1)],second=base[Math.min(base.length-1,2)];
  const diagnose={
    x:gvClamp(read.x+(first.x-read.x)*(primary?.42:isSafety?.15:isDb?.20:isLb?.30:.36),5,95),
    y:gvClamp(read.y+(first.y-read.y)*(primary?.42:isSafety?.15:isDb?.20:isLb?.30:.36),6,94)
  };
  if(primary){
    const commit={x:gvClamp(diagnose.x+(second.x-diagnose.x)*.72,5,95),y:gvClamp(diagnose.y+(second.y-diagnose.y)*.72,6,94)};
    return [start,read,diagnose,commit,...base.slice(3)];
  }

  // Non-primary defenders do not chase the full synthetic scramble endpoint.
  // Their base path already terminates in a role-specific support perimeter;
  // blend into that landmark and stay there.
  const settle=base.at(-1);
  const support={
    x:gvClamp(diagnose.x+(settle.x-diagnose.x)*(isSafety?.58:isDb?.64:isLb?.72:.76),5,95),
    y:gvClamp(diagnose.y+(settle.y-diagnose.y)*(isSafety?.58:isDb?.64:isLb?.72:.76),6,94)
  };
  return [start,read,diagnose,support];
}

async function gvAnimateQbRun(evt,built,totalDuration){
  const qb=gvUnit(built,'offense','QB')||built.scorer;if(!qb)return;
  const dir=built.formation.dir,{name,index}=gvQbRunConcept(evt),seed=assignmentHash(`${evt.id}|qb-run|${index}`),path=gvAlignPositiveOffensivePath(gvApplyCarrierMove(gvQbRunPath(qb,dir,name,gvEventAnimationYards(evt,1.4),seed),evt,dir,'qb-run'),evt,built);
  const defenders=built.units.filter(u=>u.side==='defense'),runDur=gvPhaseDur(totalDuration,.62,2300),finishDur=gvPhaseDur(totalDuration,.16,650);
  const blockers=built.units.filter(u=>u.side==='offense'&&u!==qb&&['LT','LG','C','RG','RT','TE'].includes(u.role));
  const skill=built.units.filter(u=>u.side==='offense'&&u!==qb&&!blockers.includes(u));
  gvSetPossession(qb);

  // v0.4.50: QB runs use paired engage/leverage blocking like RB runs. Assigned
  // front defenders are controlled by their blocker instead of simultaneously homing on the QB.
  const qbBlockConcept=(name.includes('left')||name.includes('right')||name.includes('sweep')||name.includes('edge'))?'outside-zone':name.includes('power')?'power':'inside-zone';
  const assignments=gvAssignRunBlockOutcomes(evt,qbBlockConcept,gvRunBlockAssignments(built,qbBlockConcept));
  const assignedBlockers=new Set(assignments.map(x=>x.blocker)),assignedDefenders=new Set(assignments.map(x=>x.defender));
  assignments.forEach(pair=>{pair.finish=path.at(-1)});
  const freeDefenders=defenders.filter(u=>!assignedDefenders.has(u));
  const qbTacklers=new Set(gvLikelyTerminalTacklers(freeDefenders,path,dir,2));
  evt&&(evt.pursuitArrival={maxClosers:2,closers:[...qbTacklers].map(u=>u?.role||u?.playerId||'DEF'),standoffOthers:true,qbRecognitionDelay:true,nonPrimaryFuturePath:false,reactionBudget:true,pairedRunBlocking:true});
  evt&&(evt.qbRunBlocking={pairedAssignments:assignments.length,assignedDefenders:assignedDefenders.size,concept:qbBlockConcept});
  evt&&(evt.spacingAudit={version:'0.4.48',offBallGuard:true,minSkillGap:5.0});
  const pursuit=freeDefenders.map((u,i)=>{let pursuitPath=gvQbRunPursuitPath(u,path,dir,i+13,qbTacklers.has(u));if(!qbTacklers.has(u))pursuitPath=gvReactionBudgetPath(pursuitPath,u.role,'qb-scramble',i+13);return gvMove(u,pursuitPath,runDur+(i%3)*45)});
  const support=[
    ...assignments.map((pair,i)=>gvRunBlockMotion(pair,built,qbBlockConcept,runDur,pair.outcomeSeed??assignmentHash(`${evt.id}|qb-assignment|${i}`))),
    ...gvSpacedMoveSet(blockers.filter(u=>!assignedBlockers.has(u)),(u,i)=>gvRunUnassignedBlockerFlowPath(u,path,qbBlockConcept,built,i),runDur,{minGap:3.6,anchors:[qb],dir,seedBase:`${evt.id}|qb-block-spacing`}),
    ...gvSpacedMoveSet(skill,(u,i)=>gvSecondaryRunPath(u,dir,assignmentHash(`${evt.id}|qb-skill|${i}`),12+(i%3)*3),runDur,{minGap:5.0,anchors:[qb,...blockers],dir,seedBase:`${evt.id}|qb-skill-spacing`})
  ];
  gvCarrierMoveFlourish(evt,qb,'qb-run',runDur*.7);
  const runner=gvMove(qb,path,runDur);
  await Promise.allSettled([...pursuit,...support,runner]);

  if(gvIsTouchdownEvent(evt,'qb_run')){
    const tdPath=gvTouchdownExtensionPath(qb,built,dir,seed);
    await Promise.allSettled([
      gvExtendTouchdownToEndzone(evt,qb,built,dir,Math.max(700,finishDur),'qb-rush-td'),
      ...gvDynamicPursuitMotions(evt,qb,tdPath,defenders,dir,Math.max(700,finishDur))
    ]);
    await gvAnimateScorerCelebration(evt,qb,'celebration',totalDuration);
    return;
  }
  await gvAnimateSituationalTackle(evt,qb,defenders,dir,totalDuration,'qb-run');
}

function gvSplitPathAtFraction(path,fraction=.62){
  if(!Array.isArray(path)||path.length<2)return {before:path||[],after:path||[]};
  const f=Math.max(.05,Math.min(.95,Number(fraction)||.62));
  const lens=[],cum=[0];
  let total=0;
  for(let i=1;i<path.length;i++){
    const d=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);
    lens.push(d);total+=d;cum.push(total);
  }
  if(total<=.001)return {before:[path[0],path.at(-1)],after:[path.at(-1)]};
  const target=total*f;
  let seg=1;
  while(seg<cum.length&&cum[seg]<target)seg++;
  const a=path[seg-1],b=path[Math.min(path.length-1,seg)];
  const span=Math.max(.0001,cum[seg]-cum[seg-1]);
  const t=(target-cum[seg-1])/span;
  const cut={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
  return {
    before:[...path.slice(0,seg),cut],
    after:[cut,...path.slice(seg)]
  };
}

function gvReceptionMotionPlan(evt,routeVariant=''){
  const yards=Math.max(1,gvEventAnimationYards(evt,1.8));
  const seed=assignmentHash(`${evt?.id||''}|reception-motion|${routeVariant}|${Math.round(yards)}`),r=simRand(seed,703);
  const settleRoute=['curl','comeback','hitch','stick','back-shoulder','pivot'].includes(String(routeVariant||''));
  let p=yards<=6?.10:yards<=10?.24:yards<=19?.48:yards<=34?.70:.86;
  if(settleRoute)p*=.42;
  const inStride=r<p;
  // Receiver starts about 0.4 field units behind the LOS. Map the authoritative
  // play yardage to 0.8 field units per football yard so the completed play ends
  // the correct proportional distance beyond the line of scrimmage.
  const totalAdvance=gvClamp(.4+yards*.8,1.2,60.4);
  let airShare=inStride?(.56+simRand(seed,704)*.16):(.78+simRand(seed,705)*.14);
  if(['go','fade','post','corner','deep-out','deep-cross','over-route','wheel','seam'].includes(String(routeVariant||'')))airShare+=.06;
  airShare=gvClamp(airShare,.48,.94);
  const airAdvance=gvClamp(totalAdvance*airShare,.6,Math.max(.6,totalAdvance-.25));
  const yacAdvance=Math.max(0,totalAdvance-airAdvance);
  return {yards,inStride,probability:p,totalAdvance,airAdvance,yacAdvance,airShare};
}

function gvPassReleaseFraction(evt,concept,routeVariant=''){
  const depth=gvRouteDepthClass(routeVariant);
  const seed=assignmentHash(`${evt?.id||''}|release-fraction|${concept}|${routeVariant}`);
  let base=depth==='short'?.48:depth==='intermediate'?.62:.72;
  if(String(concept||'').includes('quick')||concept==='three-step')base-=.08;
  if(String(concept||'').includes('seven-step')||String(concept||'').includes('deep'))base+=.06;
  if(String(concept||'').includes('pressure-release'))base-=.12;
  return Math.max(.38,Math.min(.82,base+(simRand(seed,15)-.5)*.06));
}

function gvReceiverFlightArrivalPath(routeAfter,catchPt){
  const path=(Array.isArray(routeAfter)?routeAfter:[]).map(p=>({x:Number(p.x),y:Number(p.y)})).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
  if(!catchPt||!Number.isFinite(Number(catchPt.x))||!Number.isFinite(Number(catchPt.y)))return path;
  const target={x:Number(catchPt.x),y:Number(catchPt.y)};
  if(!path.length)return [target];
  if(path.length===1)return [path[0],target];
  const last=path.at(-1),dx=target.x-last.x,dy=target.y-last.y;
  // Do not let the receiver finish the route and then teleport sideways to the ball.
  // Blend the coverage-adjusted catch point into the final route segment so the
  // receiver and football arrive at the same place at the same time.
  const start=Math.max(1,path.length-2);
  for(let i=start;i<path.length;i++){
    const f=(i-start+1)/(path.length-start);
    path[i]={x:path[i].x+dx*f,y:path[i].y+dy*f};
  }
  path[path.length-1]=target;
  return path;
}

function gvPassFlightSpec(release,catchPt,totalDuration){
  const points=[
    {x:release.x,y:release.y},
    {x:(release.x+catchPt.x)/2,y:(release.y+catchPt.y)/2-4},
    {x:catchPt.x,y:catchPt.y}
  ];
  const path=gvBallFlightPath(points);
  const duration=gvBallFlightDuration(path,gvPhaseDur(totalDuration,.18,700));
  return {points,path,duration};
}

function gvCoverageResponsibilityPath(evt,built,u,receiver,route,catchPt,dir,releaseFraction,shell,index=0){
  const start={x:u.x,y:u.y},los=built?.formation?.los??42;
  const routeCut=gvSplitPathAtFraction(route,Math.max(.34,Math.min(.78,releaseFraction))).before.at(-1)||catchPt;
  const role=String(u.role||'').toUpperCase();
  const side=start.y<50?-1:1;
  const seed=assignmentHash(`${evt?.id||''}|coverage-responsibility|${role}|${index}|${shell}`);
  let target={x:start.x,y:start.y};

  if(role==='S'){
    // Safeties preserve depth until the QB commits. They may shade the developing
    // route, but they do not sprint to a catch point they cannot yet know.
    const depthX=gvClamp(los+dir*(12.5+(index%2)*1.8),5,95);
    const shadeY=gvClamp(start.y+(routeCut.y-start.y)*.22,9,91);
    target={x:depthX,y:shadeY};
  }else if(role==='LB'){
    const routeDepth=Math.abs((routeCut.x-los)*dir);
    if(routeDepth<11){
      // Carry shallow/crossing traffic briefly before handing it to deeper help.
      target={x:gvClamp(los+dir*(5.2+Math.min(3,routeDepth*.22)),5,95),y:gvClamp(start.y+(routeCut.y-start.y)*.48,8,92)};
    }else{
      // Hook/curl landmark with only a modest squeeze toward the route.
      target={x:gvClamp(los+dir*(5.5+(index%2)*.8),5,95),y:gvClamp(start.y+(routeCut.y-start.y)*.24,8,92)};
    }
  }else if(shell==='man'){
    // Corners/nickels can stay in phase with the receiver in man, but remain on
    // leverage rather than jumping directly to the final ball location.
    target={x:gvClamp(routeCut.x-dir*(1.2+index*.5),5,95),y:gvClamp(routeCut.y+(index?2.2:-2.2),7,93)};
  }else{
    const z=gvZoneLandmark(u,built,index);
    const widen=Math.abs(catchPt.y-start.y)>18 ? Math.sign(catchPt.y-start.y)*(2.2+simRand(seed,17)*1.5) : 0;
    target={x:gvClamp(z.x,5,95),y:gvClamp(z.y+widen,7,93)};
  }

  const read={
    x:gvClamp(start.x+(target.x-start.x)*.48,5,95),
    y:gvClamp(start.y+(target.y-start.y)*.42+(role==='LB'?side*.8:0),7,93)
  };
  return [start,read,target];
}

function gvCoverageReleasePaths(evt,built,coverage,receiver,route,catchPt,dir,releaseFraction,shell){
  return (coverage||[]).map((u,i)=>({
    unit:u,
    path:gvCoverageResponsibilityPath(evt,built,u,receiver,route,catchPt,dir,releaseFraction,shell,i)
  }));
}

function gvCoverageBallReactionPaths(coverage,catchPt,outcome,dir){
  return (coverage||[]).map((u,i)=>{
    const start={x:u.x,y:u.y};
    let finish;
    if(outcome==='contested'||outcome==='breakup'||outcome==='immediate-tackle'){
      finish={x:catchPt.x-dir*(i===0?.9:2.6),y:gvClamp(catchPt.y+(i?3.8:-2.8),6,94)};
    }else if(outcome==='sideline'){
      finish={x:catchPt.x-dir*(2.4+i*1.2),y:gvClamp(catchPt.y+(i?5.5:-5.5),6,94)};
    }else{
      finish={x:catchPt.x-dir*(3.0+i*1.4),y:gvClamp(catchPt.y+(i?5.8:-5.8),6,94)};
    }
    const role=String(u.role||'').toUpperCase();
    // First beat is recognition: preserve current responsibility for a moment,
    // then drive on the football. Safeties break downhill; LBs redirect from
    // hook/carry depth; corners transition from leverage to the catch point.
    const recognize={
      x:gvClamp(start.x+(role==='S'?-dir*.25:dir*.15),5,95),
      y:gvClamp(start.y+(finish.y-start.y)*(role==='LB'?.10:.06),7,93)
    };
    const mid={
      x:recognize.x+(finish.x-recognize.x)*(role==='S'?.54:.62),
      y:recognize.y+(finish.y-recognize.y)*(role==='LB'?.58:.52)+(i?1.1:-1.1)
    };
    return {unit:u,path:[start,recognize,mid,finish]};
  });
}


function gvBallArrivalPoint(actor,catchPt,dir,outcome='catch'){
  if(!actor)return {...catchPt};
  const seed=assignmentHash(`${actor.playerId||actor.role||''}|arrival|${catchPt.x}|${catchPt.y}|${outcome}`);
  const side=simRand(seed,7)>.5?1:-1;
  const reach=outcome==='breakup'||outcome==='contested'?1.8:outcome==='interception'?1.2:.8;
  return {x:catchPt.x-dir*reach*.35,y:gvClamp(catchPt.y+side*reach*.55,6,94)};
}
function gvCatchPoseFrames(outcome='catch'){
  if(outcome==='interception')return [
    {transform:'translate(-50%,-50%) scale(1)'},
    {transform:'translate(-50%,-56%) scale(1.16) rotate(-5deg)'},
    {transform:'translate(-50%,-50%) scale(1.08) rotate(4deg)'}
  ];
  if(outcome==='breakup')return [
    {transform:'translate(-50%,-50%) scale(1)'},
    {transform:'translate(-50%,-57%) scale(1.12) rotate(8deg)'},
    {transform:'translate(-50%,-50%) scale(1.02) rotate(-4deg)'}
  ];
  if(outcome==='contested')return [
    {transform:'translate(-50%,-50%) scale(1)'},
    {transform:'translate(-50%,-58%) scale(1.14)'},
    {transform:'translate(-50%,-50%) scale(1.08)'}
  ];
  return [
    {transform:'translate(-50%,-50%) scale(1)'},
    {transform:'translate(-50%,-54%) scale(1.10)'},
    {transform:'translate(-50%,-50%) scale(1.04)'}
  ];
}
function gvAnimateCatchPose(actor,outcome='catch',duration=420){
  if(!actor?.el)return Promise.resolve();
  const a=actor.el.animate(gvCatchPoseFrames(outcome),{duration:Math.max(280,duration),easing:'ease-out',fill:'forwards'});
  gvActorAnimations.push(a);
  return a.finished.catch(()=>{});
}
function gvAnimateBallArrival(ball,actor,catchPt,dir,outcome='catch',duration=220){
  if(!ball?.el||!actor)return Promise.resolve();
  const arrival=gvBallArrivalPoint(actor,catchPt,dir,outcome);
  const a0=gvFieldPoint(arrival.x,arrival.y),a1=gvFieldPoint(actor.x,actor.y);
  const angle=Math.atan2(actor.y-arrival.y,actor.x-arrival.x)*180/Math.PI;
  const a=ball.el.animate([
    {left:a0.left,top:a0.top,transform:`translate(-50%,-50%) rotate(${angle}deg) scale(1)`},
    {left:a1.left,top:a1.top,transform:`translate(-50%,-50%) rotate(${angle}deg) scale(.92)`}
  ],{duration:Math.max(150,duration),easing:'ease-out',fill:'forwards'});
  gvActorAnimations.push(a);
  return a.finished.catch(()=>{});
}

function gvReceiverCatchSeparation(receiver,catchPt){
  if(!receiver||!catchPt)return Infinity;
  return Math.hypot(Number(receiver.x)-Number(catchPt.x),Number(receiver.y)-Number(catchPt.y));
}
function gvPassCanonicalCatchPoint(ball,catchPt){
  const bx=Number(ball?.x),by=Number(ball?.y),cx=Number(catchPt?.x),cy=Number(catchPt?.y);
  if(Number.isFinite(bx)&&Number.isFinite(by))return {x:bx,y:by,source:'ball'};
  return {x:cx,y:cy,source:'planned'};
}
function gvPassContinuityAudit(evt,stage,receiver,point,extra={}){
  if(!evt)return null;
  const rx=Number(receiver?.x),ry=Number(receiver?.y),px=Number(point?.x),py=Number(point?.y);
  const separation=[rx,ry,px,py].every(Number.isFinite)?Math.hypot(rx-px,ry-py):null;
  const item={stage,separation:separation===null?null:Number(separation.toFixed(3)),...extra};
  evt.passContinuityAudit=Array.isArray(evt.passContinuityAudit)?evt.passContinuityAudit:[];
  evt.passContinuityAudit.push(item);
  return item;
}
function gvAnchorPathToActor(path,actor,target=null){
  const pts=(Array.isArray(path)?path:[]).map(p=>({x:Number(p.x),y:Number(p.y)})).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
  const start={x:Number(actor?.x),y:Number(actor?.y)};
  if(!Number.isFinite(start.x)||!Number.isFinite(start.y))return pts;
  if(!pts.length)pts.push(start);else pts[0]=start;
  if(target&&Number.isFinite(Number(target.x))&&Number.isFinite(Number(target.y))){
    const end={x:Number(target.x),y:Number(target.y)};
    if(pts.length===1)pts.push(end);else pts[pts.length-1]=end;
  }
  return pts;
}
async function gvEnsureReceiverAtCatchPoint(evt,receiver,catchPt,totalDuration){
  const before=gvReceiverCatchSeparation(receiver,catchPt);
  if(!Number.isFinite(before))return {before,after:before,corrected:false};
  if(before<=.65){
    evt.passCatchConvergence={before:Number(before.toFixed(3)),after:Number(before.toFixed(3)),corrected:false,tolerance:.65};
    return evt.passCatchConvergence;
  }
  // Reliability failsafe: possession cannot transfer until the target physically
  // reaches the football. Correct the route while the ball remains at its arrival
  // point rather than crediting a remote catch and teleporting the receiver later.
  const start={x:receiver.x,y:receiver.y},target={x:Number(catchPt.x),y:Number(catchPt.y)};
  const mid={
    x:start.x+(target.x-start.x)*.58,
    y:gvClamp(start.y+(target.y-start.y)*.58,6,94)
  };
  await gvMove(receiver,[start,mid,target],Math.max(180,Math.min(420,gvPhaseDur(totalDuration,.045,260))),'ease-out');
  const after=gvReceiverCatchSeparation(receiver,catchPt);
  evt.passCatchConvergence={before:Number(before.toFixed(3)),after:Number(after.toFixed(3)),corrected:true,tolerance:.65};
  return evt.passCatchConvergence;
}
async function gvResolvePassArrival(evt,built,receiver,coverage,catchPt,outcome,dir,ball,totalDuration){
  const canonical=gvPassCanonicalCatchPoint(ball,catchPt);
  catchPt.x=canonical.x;catchPt.y=canonical.y;
  const inStride=!!evt?.receptionMotionPlan?.inStride;
  const catchDur=inStride?Math.max(150,gvPhaseDur(totalDuration,.025,170)):gvPhaseDur(totalDuration,.08,360),primaryDef=coverage?.[0]||null;

  if(outcome==='incomplete'){
    // Ordinary incompletion: the receiver does NOT get pulled onto the football
    // and no defender is credited with contact. The miss remains visibly separate.
    const separation=gvReceiverCatchSeparation(receiver,canonical);
    gvPassContinuityAudit(evt,'flight-to-incomplete',receiver,canonical,{
      targetSource:canonical.source,
      intentionalSeparation:true,
      defenderCredited:false
    });
    await gvAnimateCatchPose(receiver,'breakup',catchDur);
    gvClearPossession();
    gvTerminalPossessionAudit(evt,'incomplete_pass','none',{receiver:receiver?.playerId||receiver?.role||null});
    gvTerminalBallAudit(evt,'dead-incomplete',{owner:null,knockedAway:false,defenderCredited:false});
    const missSeed=assignmentHash(`${evt?.id||''}|incomplete-miss`);
    await Promise.allSettled([
      gvAnimateIncompleteBall(ball,canonical,dir,missSeed,Math.max(420,catchDur*.9)),
      gvMomentLabel(canonical.x,canonical.y,'INCOMPLETE','incomplete',700)
    ]);
    evt.incompletePassAudit={
      defenderCredited:false,
      defenderContact:false,
      receiverPulledToBall:false,
      separation:Number.isFinite(separation)?Number(separation.toFixed(2)):null
    };
    gvTerminalFrameAudit(evt,'incomplete-pass',[receiver],{ballDead:true,defenderContact:false});
    return;
  }

  gvPassContinuityAudit(evt,'flight-to-catch-before',receiver,canonical,{targetSource:canonical.source,role:String(receiver?.role||evt?.pos||'').toUpperCase()});
  await gvEnsureReceiverAtCatchPoint(evt,receiver,catchPt,totalDuration);
  const resolvedCatchPt={x:Number(receiver.x),y:Number(receiver.y)};
  catchPt.x=resolvedCatchPt.x;catchPt.y=resolvedCatchPt.y;
  gvPassContinuityAudit(evt,'flight-to-catch-after',receiver,catchPt,{targetSource:canonical.source,continuous:gvReceiverCatchSeparation(receiver,catchPt)<=.65});

  if(outcome==='breakup'){
    await Promise.allSettled([
      gvAnimateCatchPose(receiver,'breakup',catchDur),
      primaryDef?gvAnimateCatchPose(primaryDef,'breakup',catchDur):Promise.resolve(),
      primaryDef?gvAnimateBallArrival(ball,primaryDef,catchPt,dir,'breakup',catchDur*.55):Promise.resolve()
    ]);
    // A PBU requires defensive evidence and visibly belongs to the defender.
    gvImpactAt(catchPt.x,catchPt.y,true);gvClearPossession();
    gvTerminalPossessionAudit(evt,'pass_breakup','none',{receiver:receiver?.playerId||receiver?.role||null});
    gvTerminalBallAudit(evt,'dead-incomplete',{owner:null,knockedAway:true,defenderCredited:true});
    const pbuSeed=assignmentHash(`${evt?.id||''}|pbu-knock`),pbuLabels=['KNOCKED AWAY!','KNOCKED DOWN!','BROKEN UP!'];
    await Promise.allSettled([gvAnimateKnockedAwayBall(ball,catchPt,dir,pbuSeed,Math.max(500,catchDur*.95)),gvMomentLabel(catchPt.x,catchPt.y,pbuLabels[pbuSeed%pbuLabels.length],'breakup',760)]);
    gvTerminalFrameAudit(evt,'pass-breakup',[receiver,primaryDef].filter(Boolean),{ballDead:true,defenderContact:true});
    return;
  }
  if(outcome==='contested'){
    await Promise.allSettled([
      gvAnimateCatchPose(receiver,'contested',catchDur),
      primaryDef?gvAnimateCatchPose(primaryDef,'contested',catchDur):Promise.resolve(),
      gvAnimateBallArrival(ball,receiver,catchPt,dir,'contested',catchDur*.55)
    ]);
    gvImpactAt(catchPt.x,catchPt.y,true);gvSetPossession(receiver);
    gvBallContinuityAudit(evt,'reception-catch','carried',{owner:'offense'});
    gvTerminalPossessionAudit(evt,'reception','offense',{carrier:receiver?.playerId||receiver?.role||null});
    gvTerminalBallAudit(evt,'possessed',{owner:'offense'});
    await gvMomentLabel(receiver.x,receiver.y,'CAUGHT!','catch',680);return;
  }
  await Promise.allSettled([
    gvAnimateCatchPose(receiver,'catch',catchDur),
    gvAnimateBallArrival(ball,receiver,catchPt,dir,'catch',catchDur*.55)
  ]);
  gvSetPossession(receiver);
  gvBallContinuityAudit(evt,'reception-catch','carried',{owner:'offense'});
  gvTerminalPossessionAudit(evt,'reception','offense',{carrier:receiver?.playerId||receiver?.role||null});
  gvTerminalBallAudit(evt,'possessed',{owner:'offense'});
  await gvMomentLabel(receiver.x,receiver.y,'CAUGHT!','catch',620);
}
async function gvResolveInterceptionArrival(evt,defender,target,turnoverSpot,dir,ball,totalDuration){
  const dur=gvPhaseDur(totalDuration,.08,360);
  await Promise.allSettled([
    gvAnimateCatchPose(defender,'interception',dur),
    target?gvAnimateCatchPose(target,'breakup',dur):Promise.resolve(),
    gvAnimateBallArrival(ball,defender,turnoverSpot,dir,'interception',dur*.55)
  ]);
  gvSetPossession(defender);gvImpactAt(turnoverSpot.x,turnoverSpot.y,true);
  gvBallContinuityAudit(evt,'interception-catch','carried',{owner:'defense'});
  gvTerminalPossessionAudit(evt,'interception','defense',{carrier:defender?.playerId||defender?.role||null});
  gvTerminalBallAudit(evt,'possessed',{owner:'defense'});
  // v0.4.47: unmistakable turnover ownership cue at the moment of the pick.
  await gvPulseUnit(defender,'INTERCEPTION',Math.max(680,dur*1.45));
}


function gvPasserUnit(evt,built,receiver=null){
  const role=String(evt?.passerPos||evt?.qbPos||'QB').toUpperCase();
  const candidates=(built?.units||[]).filter(u=>u.side==='offense'&&u.role===role&&u!==receiver);
  if(candidates.length){
    const key=String(evt?.passerPlayerId||evt?.qbPlayerId||evt?.id||'passer');
    return candidates[assignmentHash(`${key}|passer-slot`)%candidates.length];
  }
  return gvUnit(built,'offense','QB');
}


function gvCoverageLeverage(receiver,coverage,dir){
  const nearest=(coverage||[]).slice().sort((a,b)=>
    Math.hypot(a.x-receiver.x,a.y-receiver.y)-Math.hypot(b.x-receiver.x,b.y-receiver.y)
  )[0];
  if(!nearest)return {type:'none',defender:null,lateral:0,depth:0};
  const lateral=nearest.y-receiver.y;
  const depth=(nearest.x-receiver.x)*dir;
  let type='trail';
  if(depth>2.5&&Math.abs(lateral)<5)type='over';
  else if(depth<-2.5&&Math.abs(lateral)<5)type='under';
  else if(lateral<-3)type='inside';
  else if(lateral>3)type='outside';
  return {type,defender:nearest,lateral,depth};
}
function gvCoverageAdjustedRoute(evt,built,receiver,route,coverage,variant,dir,forcedShell=null){
  if(!Array.isArray(route)||route.length<2)return route||[];
  const shell=forcedShell||gvCoverageShell(built,evt);
  const lev=gvCoverageLeverage(receiver,coverage,dir);
  const p=route.map(x=>({...x}));
  const start=p[0],finish=p.at(-1);
  const seed=assignmentHash(`${evt?.id||''}|coverage-route|${variant}|${shell}|${lev.type}`);

  if(shell==='man'){
    if(lev.type==='inside'){
      for(let i=1;i<p.length;i++)p[i].y=gvClamp(p[i].y+4+(i/p.length)*3,6,94);
    }else if(lev.type==='outside'){
      for(let i=1;i<p.length;i++)p[i].y=gvClamp(p[i].y-4-(i/p.length)*3,6,94);
    }else if(lev.type==='over'){
      const cut=simRand(seed,31)>.5?1:-1;
      const idx=Math.max(1,Math.floor(p.length*.55));
      p[idx]={x:p[idx].x-dir*1.8,y:gvClamp(p[idx].y+cut*6,6,94)};
      p[p.length-1]={x:gvClamp(finish.x-dir*2.5,5,95),y:gvClamp(finish.y+cut*7,6,94)};
    }else if(lev.type==='under'){
      for(let i=Math.floor(p.length*.45);i<p.length;i++)p[i].x=gvClamp(p[i].x+dir*2.5,5,95);
    }
  }else{
    const zones=(built?.units||[]).filter(u=>u.side==='defense'&&!['EDGE','DE','DT','NT'].includes(u.role));
    if(zones.length){
      const nearestZone=zones.slice().sort((a,b)=>
        Math.hypot(a.x-finish.x,a.y-finish.y)-Math.hypot(b.x-finish.x,b.y-finish.y)
      )[0];
      if(nearestZone){
        const crowdY=nearestZone.y-finish.y;
        const crowdX=(nearestZone.x-finish.x)*dir;
        if(Math.abs(crowdY)<8&&Math.abs(crowdX)<8){
          const escape=crowdY>=0?-1:1;
          p[p.length-1]={
            x:gvClamp(finish.x-dir*(crowdX>0?2.5:-1.2),5,95),
            y:gvClamp(finish.y+escape*(6+simRand(seed,51)*3),6,94)
          };
          if(p.length>2){
            const j=p.length-2;
            p[j]={x:p[j].x,y:gvClamp(p[j].y+escape*4,6,94)};
          }
        }
      }
    }
  }
  return gvNormalizeRoutePath(p,variant,dir);
}
function gvSecondaryCoverageRoute(evt,built,u,dir,seed,gain=12){
  const base=gvSecondaryPassRoute(u,dir,seed,gain);
  const defenders=built.units.filter(d=>d.side==='defense').slice().sort((a,b)=>
    Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y)
  ).slice(0,2);
  return gvCoverageAdjustedRoute(evt,built,u,base,defenders,'secondary',dir);
}
function gvPressureAwareRelease(evt,built,pocketOutcome,releaseFraction){
  let f=releaseFraction;
  if(['edge-leak','interior-push','hit-release','collapse-sack'].includes(pocketOutcome))f-=.10;
  if(pocketOutcome==='clean')f+=.04;
  return Math.max(.36,Math.min(.88,f));
}
function gvTargetWindowRelease(evt,built,receiver,route,coverage,catchPt,shell,pocketOutcome,releaseFraction){
  let f=releaseFraction;
  const depth=gvRouteDepthClass(gvRouteVariant(evt,receiver?.role||evt?.pos||'WR'));
  const defenders=(built?.units||[]).filter(u=>u.side==='defense'&&!['EDGE','DE','DT','NT'].includes(u.role));
  const nearWindow=defenders.filter(u=>Math.hypot(u.x-catchPt.x,u.y-catchPt.y)<11).length;
  const leverage=gvCoverageLeverage(receiver,coverage,built?.formation?.dir||1).type;

  // A crowded window encourages anticipation; a clean intermediate/deep window
  // allows the QB to hold the ball fractionally longer. Pressure still dominates.
  if(nearWindow>=3)f-=.045;
  else if(nearWindow===0&&depth!=='short'&&pocketOutcome==='clean')f+=.035;
  if(shell==='zone'&&['inside','outside','under'].includes(leverage))f-=.018;
  if(shell==='man'&&leverage==='over')f-=.025;
  if(['edge-leak','hit-release','collapse-sack'].includes(pocketOutcome))f=Math.min(f,releaseFraction);
  return Math.max(.34,Math.min(.88,f));
}
function gvCoverageCatchPoint(route,receiver,coverage,dir,outcome){
  const base=route?.at(-1)||{x:receiver.x,y:receiver.y};
  const lev=gvCoverageLeverage(receiver,coverage,dir);
  let x=base.x,y=base.y;
  if(outcome==='contested'&&lev.defender){
    y=gvClamp((base.y+lev.defender.y)/2,6,94);
    x=gvClamp(base.x-dir*.8,5,95);
  }else if(lev.type==='inside'){
    y=gvClamp(base.y+3.5,6,94);
  }else if(lev.type==='outside'){
    y=gvClamp(base.y-3.5,6,94);
  }
  return {x,y};
}
function gvQbPressureEscapePath(qb,built,pocketOutcome,dir){
  if(!qb)return [];
  if(pocketOutcome==='edge-leak'){
    const side=qb.y<50?1:-1;
    return [{x:qb.x,y:qb.y},{x:qb.x+dir*1.8,y:gvClamp(qb.y+side*4,8,92)}];
  }
  if(pocketOutcome==='interior-push'){
    return [{x:qb.x,y:qb.y},{x:qb.x+dir*2.4,y:qb.y}];
  }
  if(pocketOutcome==='hit-release'){
    const side=qb.y<50?-1:1;
    return [{x:qb.x,y:qb.y},{x:qb.x+dir*.8,y:gvClamp(qb.y+side*2.5,8,92)}];
  }
  if(pocketOutcome==='collapse-sack'){
    return [{x:qb.x,y:qb.y},{x:qb.x-dir*.8,y:qb.y}];
  }
  return [];
}

function gvRebaseMotionPath(path,start){
  if(!Array.isArray(path)||!path.length||!start)return [];
  const origin=path[0],dx=start.x-origin.x,dy=start.y-origin.y;
  return path.map(p=>({x:gvClamp(p.x+dx,5,95),y:gvClamp(p.y+dy,6,94)}));
}
function gvQbReleaseDevelopmentPath(qb,built,dropBefore,pocketOutcome,dir){
  const base=(dropBefore||[]).map(p=>({...p}));
  if(!base.length)return [{x:qb.x,y:qb.y}];
  let end=base.at(-1);
  const pocket=gvRebaseMotionPath(gvQbPocketAdjustment(qb,built,pocketOutcome,dir),end);
  if(pocket.length>1){base.push(...pocket.slice(1));end=base.at(-1)}
  const pressure=gvRebaseMotionPath(gvQbPressureEscapePath(qb,built,pocketOutcome,dir),end);
  if(pressure.length>1)base.push(...pressure.slice(1));
  return base;
}
function gvQbPassFollowThroughPath(qb,dir,pocketOutcome){
  const start={x:qb.x,y:qb.y};
  const step=['hit-release','edge-leak','collapse-sack'].includes(pocketOutcome)?.45:1.15;
  const lateral=pocketOutcome==='interior-push'?.4:0;
  return [start,{x:gvClamp(start.x+dir*step,5,95),y:gvClamp(start.y+lateral,6,94)}];
}

async function gvAnimateQbPass(evt,built,totalDuration,receiver,route,catchPt,coverage,outcome){
  const qb=gvPasserUnit(evt,built,receiver);if(!qb||!receiver)return;
  const dir=built.formation.dir,{name,index}=gvQbPassConcept(evt),seed=assignmentHash(`${evt.id}|pass|${index}`);
  const drop=evt?.trickPlay
    ?[{x:qb.x,y:qb.y},{x:qb.x-dir*1.8,y:gvClamp(qb.y+(50-qb.y)*.22,10,90)},{x:qb.x-dir*3.2,y:gvClamp(qb.y+(50-qb.y)*.34,10,90)}]
    :gvQbDropPath(qb,dir,name,seed);
  const routeVariant=gvRouteVariant(evt,receiver.role||evt.pos||'WR');
  const nominalRelease=gvPassReleaseFraction(evt,name,routeVariant);
  const preReleaseDur=gvPhaseDur(totalDuration,.34,1200);
  const blockers=gvOffensiveBlockers(built.units).filter(u=>u!==receiver);
  const otherRoutes=built.units.filter(u=>u.side==='offense'&&u!==qb&&u!==receiver&&!blockers.includes(u));
  evt.targetRouteAssignment={
    role:String(receiver.role||evt.pos||'').toUpperCase(),
    forcedRouteRunner:true,
    excludedFromPassProtection:true,
    tightEndRouteForced:String(receiver.role||evt.pos||'').toUpperCase()==='TE'
  };
  const passAssignments=gvPassBlockAssignments(built,[receiver]);
  const pocketOutcome=gvPocketOutcome(evt,built,name);
  const shell=gvCoverageShell(built,evt);
  const pressureRelease=gvPressureAwareRelease(evt,built,pocketOutcome,nominalRelease);
  const releaseFraction=gvTargetWindowRelease(evt,built,receiver,route,coverage,catchPt,shell,pocketOutcome,pressureRelease);
  const routeSplit=gvSplitPathAtFraction(route,releaseFraction);
  const dropSplit=gvSplitPathAtFraction(drop,Math.max(.56,Math.min(.9,releaseFraction+.08)));
  const qbReleasePath=gvQbReleaseDevelopmentPath(qb,built,dropSplit.before,pocketOutcome,dir);
  const failurePair=gvProtectionFailurePair(passAssignments,pocketOutcome);
  evt.passPocketOutcome=pocketOutcome;
  evt.passReleaseFraction=Number(releaseFraction.toFixed(3));
  evt.passTargetWindow=releaseFraction<pressureRelease-.02?'anticipation':releaseFraction>pressureRelease+.02?'hold':'rhythm';
  evt.passProtectionOutcome={pocket:pocketOutcome,failureBlocker:failurePair?.blocker?.role||null,failureRusher:failurePair?.defender?.role||null,resolution:failurePair?gvProtectionResolution(pocketOutcome,true,0):'win'};
  const assignedRushers=new Set(passAssignments.map(x=>x.defender));
  const helpBlockers=gvPassHelpBlockers(built,receiver);
  const secondaryRoutes=otherRoutes.filter(u=>!helpBlockers.includes(u)).map((u,i)=>{
    const full=gvSecondaryCoverageRoute(evt,built,u,dir,assignmentHash(`${evt.id}|route-bg|${i}`),10+(i%3)*3);
    const split=gvSplitPathAtFraction(full,releaseFraction);
    return {unit:u,full,before:split.before,after:split.after};
  });
  const secondaryByUnit=new Map(secondaryRoutes.map(x=>[x.unit,x]));

  const support=[
    ...passAssignments.map((pair,i)=>gvPocketAssignmentMotion(pair,built,pocketOutcome,preReleaseDur,assignmentHash(`${evt.id}|pass-assignment|${i}`),pair===failurePair,i)),
    ...secondaryRoutes.map((x,i)=>gvMove(x.unit,x.before,preReleaseDur+(i%3)*25)),
    ...helpBlockers.map((u,i)=>gvPassHelpMotion(u,built,preReleaseDur,assignmentHash(`${evt.id}|help-block|${i}`)))
  ];

  if(shell==='man'){
    const man=gvManCoverageAssignments(built);
    const assigned=new Set(man.map(x=>x.defender));
    support.push(...man.filter(pair=>!coverage.includes(pair.defender)).map((pair,i)=>{
      const r=pair.receiver,d=pair.defender;
      const secondary=secondaryByUnit.get(r);
      const routePoint=secondary?.before?.at(-1);
      const target=routePoint
        ?{x:gvClamp(routePoint.x-dir*(1.2+(i%2)*.5),5,95),y:gvClamp(routePoint.y+(i%2?2.6:-2.6),7,93)}
        :{x:r.x+dir*(7+(i%3)*2),y:r.y+(i%2?3:-3)};
      return gvMove(d,[{x:d.x,y:d.y},{x:d.x+(target.x-d.x)*.5,y:d.y+(target.y-d.y)*.44},target],preReleaseDur+(i%3)*45);
    }));
    support.push(...built.units.filter(u=>u.side==='defense'&&!assigned.has(u)&&!assignedRushers.has(u)&&!coverage.includes(u)).map((u,i)=>{
      const z=gvZoneLandmark(u,built,i);
      return gvMove(u,[{x:u.x,y:u.y},{x:(u.x+z.x)/2,y:(u.y+z.y)/2},z],preReleaseDur);
    }));
  }else{
    support.push(...built.units.filter(u=>u.side==='defense'&&!assignedRushers.has(u)&&!coverage.includes(u)).map((u,i)=>{
      const z=gvZoneLandmark(u,built,i);
      return gvMove(u,[{x:u.x,y:u.y},{x:(u.x+z.x)/2,y:(u.y+z.y)/2},z],preReleaseDur+(i%3)*50);
    }));
  }

  // Develop the play only to the throw point. The receiver and coverage are still
  // moving when the QB releases, instead of freezing until after the entire route.
  const releaseCoverage=gvCoverageReleasePaths(evt,built,coverage,receiver,route,catchPt,dir,releaseFraction,shell);
  await Promise.allSettled([
    gvMove(qb,qbReleasePath,preReleaseDur),
    gvMove(receiver,routeSplit.before,preReleaseDur),
    ...releaseCoverage.map((x,i)=>gvMove(x.unit,x.path,preReleaseDur+(i*45))),
    ...support
  ]);

  // Pocket adjustment and pressure movement are part of the same pre-release
  // development phase, so the other 21 actors do not freeze while only the QB moves.
  const release={x:qb.x,y:qb.y};
  const incompleteMiss=outcome==='incomplete';
  const missSeed=assignmentHash(`${evt.id}|incomplete-flight`);
  const missSide=simRand(missSeed,301)>.5?1:-1;
  const flightTarget=incompleteMiss?{
    x:gvClamp(catchPt.x+dir*(1.4+simRand(missSeed,302)*2.2),5,95),
    y:gvClamp(catchPt.y+missSide*(3.4+simRand(missSeed,303)*3.8),6,94)
  }:catchPt;
  const flight=gvPassFlightSpec(release,flightTarget,totalDuration);
  if(incompleteMiss)evt.incompleteFlightAudit={receiverTarget:{...catchPt},ballTarget:{...flightTarget},intentionalMiss:true};
  gvClearPossession();
  gvTerminalBallAudit(evt,'released',{owner:null,from:'QB'});
  const ball=gvMakeBall(release.x,release.y);
  gvBallContinuityAudit(evt,'pass-release','free',{carrierCleared:true});

  // Ball, target receiver, coverage, and the QB's natural follow-through all move
  // during the same flight window. This keeps catch timing visually coherent.
  const ballCoverage=gvCoverageBallReactionPaths(coverage,catchPt,outcome,dir);
  const qbFollow=gvMove(qb,gvQbPassFollowThroughPath(qb,dir,pocketOutcome),flight.duration);
  const receiverReleasePoint={x:Number(receiver.x),y:Number(receiver.y)};
  let receiverFlightPath=gvReceiverFlightArrivalPath(routeSplit.after,catchPt);
  receiverFlightPath=gvAnchorPathToActor(receiverFlightPath,receiver,catchPt);
  gvPhaseHandoffAudit(evt,'route-to-flight',receiver,receiverReleasePoint,receiverFlightPath[0],.12);
  const receiverArrival=receiverFlightPath.length>1
    ?gvMove(receiver,receiverFlightPath,flight.duration)
    :Promise.resolve();
  evt.passReceiverArrival={
    routeEndpoint:routeSplit.after?.at(-1)?{...routeSplit.after.at(-1)}:null,
    releasePoint:receiverReleasePoint,
    catchPoint:{...catchPt},
    synchronized:true,
    targetExcludedFromProtection:true,
    role:String(receiver?.role||evt?.pos||'').toUpperCase()
  };

  await Promise.allSettled([
    gvBallMove(ball,flight.points,flight.duration),
    receiverArrival,
    qbFollow,
    ...ballCoverage.map((x,i)=>gvMove(x.unit,x.path,flight.duration+(i*25))),
    ...gvPassFlightContinuations(evt,built,qb,receiver,coverage,catchPt,dir,flight.duration,secondaryRoutes,shell)
  ]);

  const actualBallPoint=gvPassCanonicalCatchPoint(ball,catchPt);
  gvPassContinuityAudit(evt,'flight-end',receiver,actualBallPoint,{role:String(receiver?.role||evt?.pos||'').toUpperCase(),expectedTolerance:.65});
  await gvResolvePassArrival(evt,built,receiver,coverage,incompleteMiss?flightTarget:catchPt,outcome,dir,ball,totalDuration);
  if(ball?.el)ball.el.remove();
}


function gvSetUnitPoint(unit,x,y){
  if(!unit?.el)return;
  unit.x=gvClamp(Number(x),3,97);unit.y=gvClamp(Number(y),4,96);
  const p=gvFieldPoint(unit.x,unit.y);unit.el.style.left=p.left;unit.el.style.top=p.top;
}
function gvSpecialTeamsAudit(evt,built,kind,extra={}){
  if(!evt)return null;
  const units=built?.units||[];
  const state=gvBallContinuitySnapshot();
  const st=built?.specialTeams||null,kick=built?.kickTeams||null;
  const audit={
    kind,
    startsSpecialTeams:kind==='field-goal'||kind==='extra-point'
      ?!!evt?.kickFormationAudit?.startsFieldGoalFormation
      :!!evt?.specialTeamsFormationAudit?.startsSpecialTeams,
    genericSnapBypassed:kind==='field-goal'||kind==='extra-point'
      ?!!evt?.kickFormationAudit?.genericSnapBypassed
      :!!evt?.specialTeamsFormationAudit?.genericSnapBypassed,
    noOffenseFormationTransition:kind==='field-goal'||kind==='extra-point'
      ?!!evt?.kickFormationAudit?.noOffenseFormationTransition
      :!!evt?.specialTeamsFormationAudit?.noOffenseFormationTransition,
    unitCount:units.length,
    ballState:{free:state.free,carried:state.carried,total:state.total},
    prepared:!!(st?.prepared||kick?.prepared),
    ...extra
  };
  evt.fullSpecialTeamsAudit=audit;
  return audit;
}

function gvSpecialTeamsLaneTarget(unit,catchPt,kickDir,index,isPunt=false,isGunner=false){
  const start={x:unit.x,y:unit.y};
  const laneSpread=isPunt?(isGunner?18:28):34;
  const laneSlot=(index%7)-3;
  const laneY=gvClamp(catchPt.y+laneSlot*(laneSpread/6),8,92);
  const downfield=isPunt?(isGunner?31:23):29;
  return {
    x:gvClamp(start.x+kickDir*(downfield+(index%3)*1.8),5,95),
    y:laneY
  };
}
function gvSpecialTeamsBlockAssignments(blockers,pursuers,returner,returnDir,seed){
  const available=pursuers.slice();
  const pairs=[];
  blockers.slice(0,Math.min(6,blockers.length)).forEach((blocker,i)=>{
    if(!available.length)return;
    available.sort((a,b)=>{
      const aScore=Math.abs(a.y-blocker.y)+Math.abs((a.x-blocker.x))*0.22;
      const bScore=Math.abs(b.y-blocker.y)+Math.abs((b.x-blocker.x))*0.22;
      return aScore-bScore;
    });
    const defender=available.shift();
    const laneAhead=gvClamp(returner.x+returnDir*(7+(i%3)*4),5,95);
    const leverageY=gvClamp(returner.y+(i%2?1:-1)*(7+(i%3)*3),9,91);
    pairs.push({
      blocker,defender,
      point:{x:laneAhead,y:leverageY},
      seed:assignmentHash(`${seed}|st-block|${i}`)
    });
  });
  return pairs;
}
function gvSpecialTeamsBlockMotions(pair,duration,returnDir,index=0){
  const {blocker,defender,point,seed}=pair;
  const offPoint={x:point.x-returnDir*.9,y:point.y+(index%2?.8:-.8)};
  const defPoint={x:point.x+returnDir*.9,y:point.y-(index%2?.8:-.8)};
  const win=simRand(seed,901)>.42;
  const blockerRelease={
    x:gvClamp(offPoint.x+returnDir*(win?5.0:2.2),5,95),
    y:gvClamp(offPoint.y+(index%2?1:-1)*(win?3.0:1.6),8,92)
  };
  const defenderRedirect={
    x:gvClamp(defPoint.x+returnDir*(win?1.2:4.2),5,95),
    y:gvClamp(defPoint.y+(index%2?-1:1)*(win?5.2:2.2),8,92)
  };
  const engageFrac=.48;
  return [
    gvMove(blocker,[
      {x:blocker.x,y:blocker.y},
      {x:(blocker.x+offPoint.x)/2,y:(blocker.y+offPoint.y)/2},
      offPoint,
      blockerRelease
    ],duration),
    gvMove(defender,[
      {x:defender.x,y:defender.y},
      {x:(defender.x+defPoint.x)/2,y:(defender.y+defPoint.y)/2},
      defPoint,
      defenderRedirect
    ],duration)
  ];
}
function gvSpecialTeamsTerminalTacklers(pursuers,returnPath,returnDir,maxTacklers=2){
  return gvLikelyTerminalTacklers(pursuers,returnPath,returnDir,maxTacklers);
}

function gvSpecialTeamsSecondLevelAssignments(blockers,pursuers,returnPath,returnDir,seed){
  const available=pursuers.slice();
  const pairs=[];
  const path=Array.isArray(returnPath)?returnPath:[];
  const lateAnchor=path[Math.max(1,Math.min(path.length-1,Math.floor((path.length-1)*.78)))]||path.at(-1)||{x:50,y:50};

  blockers.forEach((blocker,i)=>{
    if(!available.length)return;
    available.sort((a,b)=>{
      const aScore=Math.abs(a.y-blocker.y)*.82+Math.abs(a.x-blocker.x)*.18;
      const bScore=Math.abs(b.y-blocker.y)*.82+Math.abs(b.x-blocker.x)*.18;
      return aScore-bScore;
    });
    const defender=available.shift();
    const side=i%2?1:-1;
    pairs.push({
      blocker,
      defender,
      point:{
        x:gvClamp(lateAnchor.x-returnDir*(2+(i%2)*2),5,95),
        y:gvClamp(lateAnchor.y+side*(6+(i%3)*3),8,92)
      },
      seed:assignmentHash(`${seed}|st-second-level|${i}`),
      level:'second'
    });
  });
  return pairs;
}

function gvSpecialTeamsSecondLevelBlockMotions(pair,duration,returnDir,index=0){
  const {blocker,defender,point,seed}=pair;
  const side=index%2?1:-1;
  const flowPoint={
    x:gvClamp(blocker.x+returnDir*(10+(index%3)*3),5,95),
    y:gvClamp(blocker.y+(point.y-blocker.y)*.34,8,92)
  };
  const offPoint={
    x:gvClamp(point.x-returnDir*.9,5,95),
    y:gvClamp(point.y+side*.8,8,92)
  };
  const defPoint={
    x:gvClamp(point.x+returnDir*.9,5,95),
    y:gvClamp(point.y-side*.8,8,92)
  };
  const win=simRand(seed,1701)>.40;
  const blockerRelease={
    x:gvClamp(offPoint.x+returnDir*(win?4.8:2.0),5,95),
    y:gvClamp(offPoint.y+side*(win?2.8:1.3),8,92)
  };
  const defenderRedirect={
    x:gvClamp(defPoint.x+returnDir*(win?1.0:3.8),5,95),
    y:gvClamp(defPoint.y-side*(win?5.0:2.0),8,92)
  };
  const engageAt=.60;
  const blockerPath=[
    {x:blocker.x,y:blocker.y},
    flowPoint,
    {x:(flowPoint.x+offPoint.x)/2,y:(flowPoint.y+offPoint.y)/2},
    offPoint,
    blockerRelease
  ];
  const defenderPath=[
    {x:defender.x,y:defender.y},
    {x:defender.x+(defPoint.x-defender.x)*.42,y:defender.y+(defPoint.y-defender.y)*.35},
    defPoint,
    defenderRedirect
  ];
  return [
    gvMove(blocker,blockerPath,duration,'ease-in-out'),
    gvMove(defender,defenderPath,duration+(index%2)*70,'ease-in-out')
  ];
}


function gvSpecialTeamsReturnDecisionPlan(start,returnDir,visualAdvance,cut,seed,isPunt=false){
  const span=Math.max(8,Number(visualAdvance)||8);
  const side=Math.sign(cut)||1;
  const pressAdvance=Math.min(span*.22,isPunt?8.5:9.5);
  const diagnoseAdvance=Math.min(span*.36,isPunt?13.5:15.0);
  const commitAdvance=Math.min(span*.60,isPunt?24:28);
  const finishAdvance=span;

  // Returner initially presses a vertical lane and waits for blocks to declare.
  // The meaningful lateral cut happens only after the diagnose point.
  const press={
    x:start.x+returnDir*pressAdvance,
    y:gvClamp(start.y+side*Math.min(1.2,Math.abs(cut)*.10),8,92)
  };
  const diagnose={
    x:start.x+returnDir*diagnoseAdvance,
    y:gvClamp(press.y-side*Math.min(.7,Math.abs(cut)*.05),8,92)
  };
  const commit={
    x:start.x+returnDir*commitAdvance,
    y:gvClamp(start.y+side*Math.min(7.2,Math.abs(cut)*.64),8,92)
  };
  const finish={
    x:start.x+returnDir*finishAdvance,
    y:gvClamp(start.y-side*Math.min(4.4,Math.abs(cut)*.34)+(simRand(seed,1201)-.5)*4.0,8,92)
  };
  return {
    path:[{...start},press,diagnose,commit,finish],
    phase:'press-diagnose-commit',
    commitIndex:3,
    cutDirection:side,
    pressAdvance:Number(pressAdvance.toFixed(2)),
    diagnoseAdvance:Number(diagnoseAdvance.toFixed(2))
  };
}

function gvSpecialTeamsReturnSpeedPlan(path,totalDuration,commitIndex=3){
  const p=Array.isArray(path)?path:[];
  const total=Math.max(900,Number(totalDuration)||1800);
  const split=Math.max(2,Math.min(p.length-1,Number(commitIndex)||3));
  const controlledPath=p.slice(0,split);
  const burstPath=p.slice(split-1);
  const distance=pts=>{
    let d=0;
    for(let i=1;i<pts.length;i++)d+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);
    return d;
  };
  const controlledDistance=Math.max(.01,distance(controlledPath));
  const burstDistance=Math.max(.01,distance(burstPath));

  // Give the press/diagnose phase more time per field unit, then accelerate
  // once the returner commits through the crease.
  const controlledDuration=Math.max(500,Math.round(total*.47));
  const burstDuration=Math.max(520,total-controlledDuration);
  return {
    controlledPath,
    burstPath,
    controlledDuration,
    burstDuration,
    controlledDistance,
    burstDistance,
    controlledSpeed:Number((controlledDistance/controlledDuration*1000).toFixed(2)),
    burstSpeed:Number((burstDistance/burstDuration*1000).toFixed(2)),
    accelerates:true
  };
}
async function gvAnimateSpecialTeamsReturner(evt,returner,path,totalDuration,commitIndex=3){
  const speed=gvSpecialTeamsReturnSpeedPlan(path,totalDuration,commitIndex);
  if(speed.controlledPath.length>1){
    await gvMove(returner,speed.controlledPath,speed.controlledDuration,'ease-in-out');
  }
  const handoffBefore=gvPhaseHandoffPoint(returner);
  if(speed.burstPath.length>1){
    // Ease-in on the burst makes the change of pace visible without a stop/start.
    await gvMove(returner,speed.burstPath,speed.burstDuration,'ease-in');
  }
  gvPhaseHandoffAudit(evt,'return-diagnose-to-burst',returner,handoffBefore,speed.burstPath?.[0]||handoffBefore,.35);
  evt.specialTeamsAcceleration={
    controlledDuration:speed.controlledDuration,
    burstDuration:speed.burstDuration,
    controlledSpeed:speed.controlledSpeed,
    burstSpeed:speed.burstSpeed,
    burstFaster:speed.burstSpeed>speed.controlledSpeed,
    commitIndex,
    continuousHandoff:true
  };
  return speed;
}

async function gvSpecialTeamsPursuitMotion(unit,path,totalDuration,primary=false,isGunner=false){
  if(!unit||!Array.isArray(path)||path.length<2)return;
  const start={x:unit.x,y:unit.y};
  const mid=path[Math.min(path.length-1,Math.max(1,Math.floor(path.length*.48)))]||path[0];
  const end=path.at(-1);
  const controlledTarget={
    x:gvClamp(start.x+(mid.x-start.x)*(primary?.58:isGunner?.46:.30),5,95),
    y:gvClamp(start.y+(mid.y-start.y)*(primary?.54:isGunner?.40:.24),8,92)
  };
  const burstTarget={
    x:gvClamp(start.x+(end.x-start.x)*(primary?.86:isGunner?.64:.42),5,95),
    y:gvClamp(start.y+(end.y-start.y)*(primary?.82:isGunner?.58:.36),8,92)
  };
  const controlledDur=Math.max(420,Math.round(totalDuration*.48));
  const burstDur=Math.max(480,totalDuration-controlledDur);
  await gvMove(unit,[start,controlledTarget],controlledDur,'ease-in-out');
  await gvMove(unit,[{x:unit.x,y:unit.y},burstTarget],burstDur,primary?'ease-in':'linear');
}

async function gvAnimateSpecialTeamsReturn(evt,built,totalDuration,type){
  if(!built?.specialTeams?.prepared)gvPrepareSpecialTeamsFormation(evt,built,type);
  const stState=built.specialTeams||{};
  const returner=stState.returner||built.scorer||built.units.find(u=>u.side==='defense');if(!returner)return;
  const kickDir=Number(stState.kickDir??built.formation.dir??1),returnDir=Number(stState.returnDir??-kickDir),isPunt=stState.isPunt??type.includes('punt');
  const retTeam=stState.retTeam||built.units.filter(u=>u.side==='defense'),coverTeam=stState.coverTeam||built.units.filter(u=>u.side==='offense');
  const kicker=stState.kicker||coverTeam.find(u=>u.role==='QB')||coverTeam[0];
  const seed=assignmentHash(`${evt.id}|special-return|${type}`);
  const st=evt?.intervalAnalysis?.stats||{};
  const yards=Math.max(1,Math.abs(Number(isPunt?st.punt_ret_yd:st.kick_ret_yd)||Number(evt.visualYards)|| (isPunt?58:92)));
  const catchX=Number(stState.catchX??(kickDir>0?(isPunt?78:88):(isPunt?22:12)));
  const catchY=Number(stState.catchY??gvClamp(50+(simRand(seed,1)-.5)*22,18,82));

  // The field already starts in special-teams alignment. The kicker/punter owns
  // the football through the approach; the free ball is created only at release.
  if(kicker)gvSetPossession(kicker);
  const kickDur=gvPhaseDur(totalDuration,.24,isPunt?1000:1200);
  const flightDur=gvPhaseDur(totalDuration,.22,isPunt?900:1150);
  if(kicker){
    const step=isPunt?1.0:1.35;
    await gvMove(kicker,[{x:kicker.x,y:kicker.y},{x:kicker.x+kickDir*step,y:kicker.y}],Math.max(260,kickDur*.28));
  }
  const launch={x:kicker?.x ?? (kickDir>0?12:88),y:kicker?.y??50};
  gvClearPossession();
  gvTerminalBallAudit(evt,'released',{owner:null,from:isPunt?'punter':'kicker',specialTeams:true,releasePoint:{...launch}});
  const ball=gvMakeBall(launch.x,launch.y);
  gvBallContinuityAudit(evt,isPunt?'punt-release':'kickoff-release','free',{releasePoint:{...launch}});
  const apex={x:(launch.x+catchX)/2,y:gvClamp((launch.y+catchY)/2+(isPunt?-10:-7),5,95)};
  const coverageUnits=coverTeam.filter(u=>u!==kicker);
  const gunners=isPunt?coverageUnits.filter(u=>u.el?.querySelector('.gv-unit-visual small')?.textContent==='GUN').slice(0,2):[];
  const coverageFlight=coverageUnits.map((u,i)=>{
    const isGunner=gunners.includes(u);
    const target=gvSpecialTeamsLaneTarget(u,{x:catchX,y:catchY},kickDir,i,isPunt,isGunner);
    const mid={
      x:u.x+(target.x-u.x)*(isGunner?.64:.48),
      y:gvClamp(u.y+(target.y-u.y)*(isGunner?.34:.24),8,92)
    };
    return gvMove(u,[{x:u.x,y:u.y},mid,target],flightDur+(isGunner?-40:(i%3)*30));
  });
  await Promise.allSettled([gvBallMove(ball,[launch,apex,{x:catchX,y:catchY}],flightDur),...coverageFlight]);
  if(ball?.el)ball.el.remove();
  gvSetPossession(returner);
  gvBallContinuityAudit(evt,isPunt?'punt-catch':'kickoff-catch','carried',{owner:'return-team'});
  gvSpecialTeamsAudit(evt,built,isPunt?'punt-return':'kickoff-return',{
    phase:'catch',
    ballOwner:'returner',
    returnerAtCatch:true,
    allCoveragePlayersTracked:coverageUnits.length===coverTeam.filter(u=>u!==kicker).length
  });
  gvPhaseHandoffAudit(evt,isPunt?'punt-flight-to-return':'kickoff-flight-to-return',returner,{x:catchX,y:catchY},gvPhaseHandoffPoint(returner),.35);
  await gvMomentLabel(returner.x,returner.y,isPunt?'PUNT RETURN':'KICK RETURN','catch',620);

  const visualAdvance=gvClamp(yards*.8,8,72);
  const cut=(simRand(seed,9)>.5?1:-1)*(5+simRand(seed,10)*7);
  const isReturnTd=gvIsTouchdownEvent(evt,type);
  const decisionPlan=gvSpecialTeamsReturnDecisionPlan(
    {x:returner.x,y:returner.y},
    returnDir,
    visualAdvance,
    cut,
    seed,
    isPunt
  );
  if(isReturnTd&&decisionPlan.path?.length){
    // A return touchdown should play out almost to the goal line before the
    // final scoring burst. Keep roughly 4-5 field units for the final extension.
    const preGoalX=returnDir>0?85.5:14.5;
    const finish=decisionPlan.path.at(-1);
    if((preGoalX-finish.x)*returnDir>0)finish.x=preGoalX;
  }
  let returnPath=gvGuardNonTouchdownEndzone(decisionPlan.path,evt,built,returnDir);
  evt.specialTeamsLaneBreak={
    cutDirection:decisionPlan.cutDirection,
    pathPoints:returnPath.length,
    latePileSuppressed:true,
    terminalCloserCap:2,
    decisionPhase:decisionPlan.phase,
    commitIndex:decisionPlan.commitIndex,
    pressAdvance:decisionPlan.pressAdvance,
    diagnoseAdvance:decisionPlan.diagnoseAdvance,
    immediateZigZagRemoved:true,
    controlledThenBurst:true
  };

  const baseReturnDur=gvTurnoverReturnDuration(Math.max(1800,totalDuration*.52),yards,false);
  const returnDur=baseReturnDur+(isReturnTd?1000:0);
  const allReturnSupport=retTeam.filter(u=>u!==returner);
  const primaryBlockers=allReturnSupport.slice(0,6);
  const secondLevelBlockers=allReturnSupport.slice(6);
  const pursuers=coverageUnits.slice();
  const decisionAnchor=returnPath[Math.min(returnPath.length-1,decisionPlan.commitIndex)]||returnPath.at(-1);

  // Front six establish the first wave of blocks.
  const blockPairs=gvSpecialTeamsBlockAssignments(
    primaryBlockers,
    pursuers,
    {x:decisionAnchor.x,y:decisionAnchor.y},
    returnDir,
    seed
  );
  const primaryPairedPursuers=new Set(blockPairs.map(p=>p.defender));
  const remainingAfterPrimary=pursuers.filter(u=>!primaryPairedPursuers.has(u));

  // The back four are now blockers too. They flow upfield, identify second-level
  // coverage threats, then engage them later in the return rather than acting as escorts.
  const secondLevelPairs=gvSpecialTeamsSecondLevelAssignments(
    secondLevelBlockers,
    remainingAfterPrimary,
    returnPath,
    returnDir,
    seed
  );

  const pairedBlockers=new Set([
    ...blockPairs.map(p=>p.blocker),
    ...secondLevelPairs.map(p=>p.blocker)
  ]);
  const pairedPursuers=new Set([
    ...blockPairs.map(p=>p.defender),
    ...secondLevelPairs.map(p=>p.defender)
  ]);

  const blockMotions=blockPairs.flatMap((pair,i)=>gvSpecialTeamsBlockMotions(pair,returnDur,returnDir,i));
  const secondLevelBlockMotions=secondLevelPairs.flatMap((pair,i)=>gvSpecialTeamsSecondLevelBlockMotions(pair,returnDur,returnDir,i));

  // Fallback only matters if a synthetic formation ever has fewer coverage
  // players than blockers. Any unpaired return-team player still advances into a
  // blocking lane instead of standing still.
  const supportBlockers=allReturnSupport.filter(u=>!pairedBlockers.has(u)).map((u,i)=>{
    const tx=gvClamp(u.x+returnDir*(14+(i%3)*4),5,95);
    const ty=gvClamp(u.y+(returner.y-u.y)*.28+(i%2?6:-6),8,92);
    return gvMove(u,[{x:u.x,y:u.y},{x:tx,y:ty}],returnDur,'ease-in-out');
  });

  const freePursuers=pursuers.filter(u=>!pairedPursuers.has(u));
  const terminalTacklers=new Set(gvSpecialTeamsTerminalTacklers(freePursuers,returnPath,returnDir,2));
  const chase=freePursuers.map((u,i)=>{
    const isGunner=gunners.includes(u),primary=terminalTacklers.has(u);
    if(primary||isGunner){
      // Nearest unblocked coverage players recognize the returner's burst and
      // re-accelerate; blocked/off-lane defenders stay constrained.
      return gvSpecialTeamsPursuitMotion(u,returnPath,returnDur+(isGunner?-60:0),primary,isGunner);
    }
    const pt=returnPath[Math.min(returnPath.length-1,1+(i%2))];
    const frac=.38+Math.min(.18,i*.03);
    const tx=gvClamp(u.x+(pt.x-u.x)*frac,5,95);
    const laneOffset=(i%2?1:-1)*9.5;
    const ty=gvClamp(u.y+(pt.y-u.y)*frac+laneOffset,8,92);
    let path=[{x:u.x,y:u.y},{x:tx,y:ty}];
    path=gvReactionBudgetPath(path,u.role,'turnover',i,6.5);
    return gvMove(u,path,returnDur+(i%3)*60);
  });
  evt.specialTeamsFlowAudit={
    gunners:gunners.length,
    assignedBlocks:blockPairs.length+secondLevelPairs.length,
    primaryBlocks:blockPairs.length,
    secondLevelBlocks:secondLevelPairs.length,
    allTenReturnersBlock:allReturnSupport.length===10&&(blockPairs.length+secondLevelPairs.length)>=10,
    laneIntegrity:true,
    coverageDoesNotHome:true,
    blockersUseUniqueAssignments:true,
    secondLevelUniqueAssignments:true,
    blockReleaseAfterEngagement:true,
    blockedCoverageRedirects:true,
    maxTerminalTacklers:2,
    terminalTacklers:[...terminalTacklers].map(u=>u?.role||'COV'),
    returnerDecisionTiming:true,
    returnerPressesBeforeCut:true,
    decisionCommitIndex:decisionPlan.commitIndex,
    allReturnPlayersFlow:true,
    allCoveragePlayersFlow:pursuers.length===coverageUnits.length,
    coveragePlayers:coverageUnits.length,
    backFourBlockers:secondLevelBlockers.length,
    pursuitReAcceleration:true,
    tdExtraDevelopmentMs:isReturnTd?1000:0
  };
  gvBallContinuityAudit(evt,isPunt?'punt-return-start':'kickoff-return-start','carried',{owner:'return-team'});
  const returnerMotion=gvAnimateSpecialTeamsReturner(evt,returner,returnPath,returnDur,decisionPlan.commitIndex);
  await Promise.allSettled([returnerMotion,...blockMotions,...secondLevelBlockMotions,...supportBlockers,...chase]);
  gvBallContinuityAudit(evt,isPunt?'punt-return-end':'kickoff-return-end','carried',{owner:'return-team'});
  evt.specialTeamsReturnVisual={
    kind:isPunt?'punt':'kickoff',
    yards,
    fieldUnits:Number(visualAdvance.toFixed(1)),
    statDriven:!!Number(isPunt?st.punt_ret_yd:st.kick_ret_yd),
    formationPolished:true,
    variableSpeed:true,
    openFieldBurst:true,
    allReturnPlayersActive:true,
    allReturnPlayersBlock:true,
    secondLevelBlocking:true,
    tdExtraDevelopmentMs:isReturnTd?1000:0,
    preGoalLineFinish:isReturnTd
  };
  const finalTacklers=[...terminalTacklers].slice(0,2);
  if(gvIsTouchdownEvent(evt,type)){
    await gvExtendTouchdownToEndzone(evt,returner,built,returnDir,Math.max(700,totalDuration*.2),isPunt?'punt-return-td':'kick-return-td');
    await gvAnimateScorerCelebration(evt,returner,'celebration',totalDuration);
  }else{
    await gvAnimateContactFinish(evt,returner,finalTacklers,returnDir,totalDuration,isPunt?'punt-return':'kick-return');
  }
  gvTerminalFrameAudit(evt,isPunt?'punt-return':'kick-return',[returner,...finalTacklers],{specialTeams:true,returnerFrozen:true,maxTacklers:2,latePileSuppressed:true});
  gvSpecialTeamsAudit(evt,built,isPunt?'punt-return':'kickoff-return',{
    phase:'terminal',
    allReturnPlayersActive:allReturnSupport.length===retTeam.length-1,
    allCoveragePlayersActive:pursuers.length===coverageUnits.length,
    returnSupportCount:allReturnSupport.length,
    primaryBlockCount:blockPairs.length,
    secondLevelBlockCount:secondLevelPairs.length,
    allReturnPlayersAssignedToBlocking:pairedBlockers.size===allReturnSupport.length,
    coverageCount:coverageUnits.length,
    maxTerminalTacklers:finalTacklers.length,
    touchdown:isReturnTd,
    terminalFreeze:true,
    latePileSuppressed:true
  });
}

function gvResolvePassParticipants(evt,built,initialReceiver,type='qb_pass'){
  let receiver=initialReceiver||null;
  const explicitSelfReception=!!(
    evt?.selfReceptionConfirmed===true||
    (evt?.passerPlayerId&&evt?.receiverPlayerId&&String(evt.passerPlayerId)===String(evt.receiverPlayerId))
  );
  let passer=gvPasserUnit(evt,built,null);

  if(evt?.multiActor&&evt?.receiverPos){
    const candidates=(built?.units||[]).filter(u=>u.side==='offense'&&u.role===evt.receiverPos);
    receiver=candidates[gvReceiverUnitIndex(evt,candidates)]||receiver;
  }

  const receiverIsPasser=!!(receiver&&passer&&(receiver===passer||
    (receiver.playerId&&passer.playerId&&String(receiver.playerId)===String(passer.playerId))));

  if(type==='qb_pass'&&(!receiver||(!explicitSelfReception&&(receiver.role==='QB'||receiverIsPasser)))){
    const eligible=(built?.units||[]).filter(u=>u.side==='offense'&&['WR','TE','RB'].includes(u.role)&&u!==passer);
    receiver=eligible.length
      ?eligible[assignmentHash(`${evt?.id||''}|qb-pass-target`)%eligible.length]
      :gvUnit(built,'offense','WR',assignmentHash(evt?.id||'')%3)||gvUnit(built,'offense','TE')||gvUnit(built,'offense','RB');
  }else if(!receiver){
    receiver=gvUnit(built,'offense','WR',assignmentHash(evt?.id||'')%3)||gvUnit(built,'offense','TE')||gvUnit(built,'offense','RB');
  }

  passer=gvPasserUnit(evt,built,explicitSelfReception?null:receiver);
  return {passer,receiver,explicitSelfReception};
}

async function gvAnimateTestingOffensiveFumble(evt,built,totalDuration,type){
  const dir=built.formation.dir,seed=assignmentHash(`${evt.id}|testing-offensive-fumble`);
  const carrierPos=String(evt.fumbleCarrierPos||(type.startsWith('wr_')?'WR':'RB')).toUpperCase();
  const receiving=String(evt.fumbleOrigin||'')==='reception'||type.includes('_rec_');
  // The highlighted action player is authoritative for these dedicated tests.
  // This is especially important with three-WR formations: selecting the first WR
  // can make the pass/fumble animation go to an unhighlighted teammate.
  const highlighted=(built.scorer&&built.scorer.side==='offense'&&built.scorer.role===carrierPos)?built.scorer:null;
  const carrier=highlighted||(built.units||[]).find(u=>u.side==='offense'&&u.role===carrierPos)||gvUnit(built,'offense',carrierPos);
  const qb=gvUnit(built,'offense','QB');
  const defenders=(built.units||[]).filter(u=>u.side==='defense');
  if(!carrier||!defenders.length)return;

  // A rush test always starts from a backfield exchange look, regardless of the
  // scorer's roster position. WR rushes therefore pull the highlighted WR next to
  // the QB instead of leaving him split wide; RB rushes do the same.
  let rushBackfieldStart=null;
  if(!receiving&&qb){
    const side=simRand(seed,5)>.5?1:-1;
    rushBackfieldStart={x:gvClamp(qb.x-dir*.8,5,95),y:gvClamp(qb.y+side*7.2,10,90)};
    gvSetUnitPoint(carrier,rushBackfieldStart.x,rushBackfieldStart.y);
  }

  const defender=defenders.slice().sort((a,b)=>Math.hypot(a.x-carrier.x,a.y-carrier.y)-Math.hypot(b.x-carrier.x,b.y-carrier.y))[0];
  const yards=Math.max(3,Number(evt.visualYards)||10),advance=gvClamp(yards*.8,5,22);
  let contactSpot={x:gvClamp(carrier.x+dir*advance,5,95),y:gvClamp(carrier.y+(simRand(seed,9)>.5?1:-1)*(2+simRand(seed,10)*4),8,92)};

  if(receiving&&qb){
    const routeVariant=carrierPos==='RB'?'angle':gvRouteVariant(evt,carrierPos);
    let route=gvRoutePath({x:carrier.x,y:carrier.y},dir,routeVariant,Math.max(7,advance*.72));
    route=gvGuardActionPath(route,evt,built,dir);
    const catchPt=route.at(-1)||{x:gvClamp(carrier.x+dir*Math.max(5,advance*.55),5,95),y:carrier.y};
    const drop={x:qb.x-dir*4.4,y:qb.y};
    gvSetPossession(qb);
    const setupDur=Math.max(950,gvPhaseDur(totalDuration,.22,950));
    await Promise.allSettled([
      gvMove(qb,[{x:qb.x,y:qb.y},drop],setupDur,'ease-in-out'),
      gvMove(carrier,route,setupDur,'ease-in-out'),
      ...defenders.slice(0,5).map((u,i)=>gvMove(u,[{x:u.x,y:u.y},{x:u.x+dir*(i%2?.4:-.2),y:gvClamp(u.y+(catchPt.y-u.y)*.16,8,92)}],setupDur))
    ]);
    const release={x:qb.x,y:qb.y},flightDur=Math.max(620,gvPhaseDur(totalDuration,.12,620));
    gvClearPossession();
    const ball=gvMakeBall(release.x,release.y);
    gvBallContinuityAudit(evt,'testing-fumble-pass-release','free',{releasePoint:{...release}});
    await gvBallMove(ball,[release,{x:(release.x+catchPt.x)/2,y:(release.y+catchPt.y)/2-4},{x:catchPt.x,y:catchPt.y}],flightDur);
    await gvEnsureReceiverAtCatchPoint(evt,carrier,catchPt,totalDuration);
    await gvAnimateCatchPose(carrier,'catch',Math.max(300,gvPhaseDur(totalDuration,.05,300)));
    if(ball?.el)ball.el.remove();
    gvSetPossession(carrier);
    gvBallContinuityAudit(evt,'testing-fumble-catch','carried',{owner:'offense',carrier:carrierPos});
    await gvMomentLabel(carrier.x,carrier.y,'CAUGHT!','catch',560);
    const yacStart={x:carrier.x,y:carrier.y};
    contactSpot={x:gvClamp(yacStart.x+dir*Math.max(3.5,advance*.38),5,95),y:gvClamp(yacStart.y+(simRand(seed,13)>.5?1:-1)*(1.5+simRand(seed,14)*2.5),8,92)};
    await Promise.allSettled([
      gvMove(carrier,[yacStart,contactSpot],Math.max(700,gvPhaseDur(totalDuration,.12,700)),'ease-in'),
      gvMove(defender,[{x:defender.x,y:defender.y},{x:contactSpot.x-dir*.7,y:contactSpot.y}],Math.max(700,gvPhaseDur(totalDuration,.12,700)),'ease-in')
    ]);
  }else{
    // Rush/fumble tests explicitly show the exchange: QB owns the ball in the
    // backfield, the highlighted RB/WR meets him at the mesh point, then takes
    // possession and runs. This avoids a wide WR simply materializing with the ball.
    if(qb){
      gvSetPossession(qb);
      const carrierStart={x:carrier.x,y:carrier.y},qbStart={x:qb.x,y:qb.y};
      const mesh={x:gvClamp(qb.x+dir*.55,5,95),y:gvClamp((qb.y+carrier.y)/2,10,90)};
      const exchangeDur=Math.max(700,gvPhaseDur(totalDuration,.12,700));
      await Promise.allSettled([
        gvMove(qb,[qbStart,{x:mesh.x-dir*.35,y:mesh.y}],exchangeDur,'ease-in-out'),
        gvMove(carrier,[carrierStart,{x:mesh.x+dir*.45,y:mesh.y}],exchangeDur,'ease-in-out'),
        ...gvRunExchangeContinuations(evt,built,carrier,qb,dir,exchangeDur)
      ]);
      gvSetPossession(carrier);
      gvBallContinuityAudit(evt,'testing-fumble-handoff','carried',{owner:'offense',carrier:carrierPos,from:'QB'});
    }else gvSetPossession(carrier);

    const runStart={x:carrier.x,y:carrier.y};
    contactSpot={x:gvClamp(runStart.x+dir*advance,5,95),y:gvClamp(runStart.y+(simRand(seed,9)>.5?1:-1)*(2+simRand(seed,10)*4),8,92)};
    const mid={x:runStart.x+dir*advance*.52,y:gvClamp(runStart.y+(simRand(seed,21)>.5?1:-1)*2.6,8,92)};
    await Promise.allSettled([
      gvMove(carrier,[runStart,mid,contactSpot],Math.max(1450,gvPhaseDur(totalDuration,.30,1450)),'ease-in-out'),
      gvMove(defender,[{x:defender.x,y:defender.y},{x:contactSpot.x-dir*.8,y:contactSpot.y}],Math.max(1450,gvPhaseDur(totalDuration,.30,1450)),'ease-in')
    ]);
  }

  const looseSpot={
    x:gvClamp(contactSpot.x+dir*(2+simRand(seed,31)*2.4),5,95),
    y:gvClamp(contactSpot.y+(simRand(seed,32)>.5?1:-1)*(2.8+simRand(seed,33)*3.4),7,93)
  };
  gvClearPossession();gvImpactAt(contactSpot.x,contactSpot.y,true);
  const ball=gvMakeBall(contactSpot.x,contactSpot.y);
  gvTerminalBallAudit(evt,'loose',{owner:null,phase:'offensive-fumble-test'});
  gvBallContinuityAudit(evt,'testing-offensive-fumble-loose','free',{owner:null,origin:receiving?'reception':'rush',carrierPos});
  await Promise.allSettled([
    gvBallMove(ball,[contactSpot,{x:(contactSpot.x+looseSpot.x)/2,y:(contactSpot.y+looseSpot.y)/2-1.8},looseSpot],560),
    gvLooseBallIndicator(looseSpot.x,looseSpot.y,'FUMBLE',850)
  ]);
  carrier.el?.classList.add('tackled');
  await gvMove(defender,[{x:defender.x,y:defender.y},looseSpot],Math.max(620,gvPhaseDur(totalDuration,.10,620)),'ease-in-out');
  if(ball?.el)ball.el.remove();
  gvSetPossession(defender);
  gvBallContinuityAudit(evt,'testing-offensive-fumble-recovery','carried',{owner:'defense'});
  gvTerminalPossessionAudit(evt,'fumble','defense',{carrier:defender?.playerId||defender?.role||null});
  gvTerminalBallAudit(evt,'possessed',{owner:'defense',recovered:true});
  await gvPulseUnit(defender,'RECOVERY',680);
  evt.testingOffensiveFumbleAudit={origin:receiving?'reception':'rush',carrierPos,catchShown:receiving,runShown:true,looseBallShown:true,recoveryShown:true,highlightedCarrier:carrier===built.scorer,backfieldStart:!receiving&&!!rushBackfieldStart,handoffShown:!receiving&&!!qb};
  gvTerminalFrameAudit(evt,'testing-offensive-fumble',[carrier,defender],{origin:receiving?'reception':'rush',carrierPos,recoveryReadable:true});
}

async function gvAnimateActionPlay(evt,built,totalDuration){
  const type=evt.playType||gvPlayType(evt),dir=built.formation.dir,s=built.scorer;
  const qb=gvUnit(built,'offense','QB'),rb=gvUnit(built,'offense','RB');
  if(['wr_rec_fumble','rb_rec_fumble','wr_rush_fumble','rb_rush_fumble'].includes(type)){await gvAnimateTestingOffensiveFumble(evt,built,totalDuration,type);return}
  if(type==='rb_run'){await gvAnimateRbConcept(evt,built,totalDuration);return}
  if(type==='qb_run'){await gvAnimateQbRun(evt,built,totalDuration);return}
  if(type==='reception'||type==='qb_pass'){
    let receiver=s;
    // v0.4.86: ordinary QB fantasy events identify the passer, not the target.
    // Resolve the actual target separately; self-receptions remain available only
    // when the event explicitly identifies the passer and receiver as the same player.
    const participants=gvResolvePassParticipants(evt,built,receiver,type);
    receiver=participants.receiver;
    const passer=participants.passer,explicitSelfReception=participants.explicitSelfReception;
    if(!receiver||!passer)return;
    evt.passTargetAudit={
      passerRole:passer.role||null,
      receiverRole:receiver.role||null,
      sameUnit:receiver===passer,
      selfReceptionAllowed:explicitSelfReception,
      ordinarySelfTargetPrevented:type==='qb_pass'&&!explicitSelfReception&&receiver!==passer
    };
    if(evt?.multiActor){
      built.units.filter(u=>u.side==='offense').forEach(u=>u.el?.classList.remove('scorer','highlighted'));
      receiver.el?.classList.add('scorer','highlighted');
      built.scorer=receiver;
    }

    const variant=gvRouteVariant(evt,receiver.role||evt.pos),motionPlan=gvReceptionMotionPlan(evt,variant),gain=motionPlan.airAdvance;
    evt.receptionMotionPlan=motionPlan;
    const rawRoute=gvNormalizeRoutePath(gvSharpenRoutePath(gvRoutePath({x:receiver.x,y:receiver.y},dir,variant,gain),variant,dir),variant,dir);
    const coverage=built.units.filter(u=>u.side==='defense').slice().sort((a,b)=>Math.hypot(a.x-receiver.x,a.y-receiver.y)-Math.hypot(b.x-receiver.x,b.y-receiver.y)).slice(0,2);
    const outcome=gvCatchOutcome(evt,variant);
    if(['contested','diving','sideline'].includes(outcome))motionPlan.inStride=false;
    const statTarget=gvPositiveOffensiveStatTarget(evt,built);
    const terminalCatch=['contested','diving','immediate-tackle'].includes(outcome);
    const catchProgress=statTarget?(terminalCatch?statTarget.progress:gvClamp(statTarget.progress*motionPlan.airShare,.45,statTarget.progress)):null;
    const catchX=statTarget?gvClamp(statTarget.los+dir*catchProgress,5,95):null;
    let route=gvCoverageAdjustedRoute(evt,built,receiver,rawRoute,coverage,variant,dir);
    if(catchX!==null)route=gvAlignPathFinalX(route,catchX);
    route=gvGuardActionPath(route,evt,built,dir);
    const catchPt=gvCoverageCatchPoint(route,receiver,coverage,dir,outcome);
    if(catchX!==null)catchPt.x=catchX;
    if(!gvIsTouchdownEvent(evt)){
      const goalBounds=gvGoalLineBounds();
      catchPt.x=gvClamp(catchPt.x,goalBounds.left,goalBounds.right);
    }
    if(statTarget){
      motionPlan.airAdvance=Math.max(0,catchProgress);
      motionPlan.yacAdvance=Math.max(0,statTarget.progress-catchProgress);
      motionPlan.totalAdvance=statTarget.progress;
      evt.offensiveProgressTarget={yards:statTarget.yards,fieldUnits:Number(statTarget.progress.toFixed(2)),los:statTarget.los,targetX:Number(statTarget.x.toFixed(2)),catchX:Number(catchPt.x.toFixed(2))};
    }
    evt.passCoverageRead=gvCoverageLeverage(receiver,coverage,dir).type;
    evt.passCoverageShell=gvCoverageShell(built,evt);
    evt.passSecondarySupport={primaryCoverage:coverage.length,maxDirectConvergers:2,shellPreserved:true};
    evt.passVisualScale={yards:motionPlan.yards,totalAdvance:motionPlan.totalAdvance,airAdvance:motionPlan.airAdvance,yacAdvance:motionPlan.yacAdvance,inStride:motionPlan.inStride};
    await gvAnimateQbPass(evt,built,totalDuration,receiver,route,catchPt,coverage,outcome);

    if(outcome==='immediate-tackle'||outcome==='broken-tackle')gvImpactAt(catchPt.x,catchPt.y,true);
    await gvAnimateCatchFinish(evt,built,receiver,coverage,catchPt,outcome,dir,totalDuration);
    return;
  }
  if(type==='pass_incomplete'||type==='incomplete'){await gvAnimateIncompletePass(evt,built,totalDuration);return}
  if(type==='kick'){await gvAnimateKick(evt,built,totalDuration);return}
  if(type.startsWith('def_')){
    if(['def_kick_return','def_kick_ret_td','def_punt_return','def_punt_ret_td'].includes(type)){await gvAnimateSpecialTeamsReturn(evt,built,totalDuration,type);return}
    if(['def_int','def_int_td','def_fumble','def_fum_td'].includes(type)){await gvAnimateDefReturn(evt,built,totalDuration,type);return}
    if(type==='def_breakup'){await gvAnimatePassBreakup(evt,built,totalDuration);return}
    if(type==='def_generic'){await gvScorerAdvance(evt,built);return}
    await gvAnimateDefPressure(evt,built,totalDuration,type);return
  }
  await gvScorerAdvance(evt,built);
}

function gvStatFamily(detail='',pos=''){
  const d=String(detail||'').toLowerCase(),p=String(pos||'').toUpperCase();
  if(d.includes('passing')||d.includes('touchdown pass')||d.includes('pass '))return 'pass';
  if(d.includes('receiving')||d.includes('reception'))return 'receive';
  if(d.includes('rushing')||d.includes('run '))return 'rush';
  if(d.includes('field goal')||d.includes('extra point'))return 'kick';
  if(p==='QB')return 'pass';
  if(p==='WR'||p==='TE')return 'receive';
  if(p==='RB')return d.includes('receiv')||d.includes('reception')?'receive':'rush';
  if(p==='K')return 'kick';
  if(p==='DEF'||p==='DST')return 'defense';
  return 'other';
}

function gvExtractNumber(detail,patterns){
  const d=String(detail||'').toLowerCase();
  for(const p of patterns){
    const m=d.match(p);
    if(m)return Number(m[1]);
  }
  return null;
}

function gvExtractPlayFacts(evt){
  const d=String(evt?.detail||'').toLowerCase(),family=gvStatFamily(evt?.detail,evt?.pos);
  const passYds=gvExtractNumber(d,[/([+-]?\d+)\s+passing yards?/,/touchdown pass\s*•\s*(\d+)\s+yards?/]);
  const recYds=gvExtractNumber(d,[/([+-]?\d+)\s+receiving yards?/,/receiving touchdown\s*•\s*(\d+)\s+yards?/]);
  const rushYds=gvExtractNumber(d,[/([+-]?\d+)\s+rushing yards?/,/rushing touchdown\s*•\s*(\d+)\s+yards?/]);
  const reception=gvExtractNumber(d,[/([+-]?\d+)\s+receptions?/]);
  const passTd=d.includes('passing td')||d.includes('touchdown pass');
  const recTd=d.includes('receiving td')||d.includes('receiving touchdown');
  const simTag=evt?.simPlayKey||evt?.playKey||null;
  return {family,passYds,recYds,rushYds,reception,passTd,recTd,simTag};
}


function gvCorrelationScore(a,b){
  if(!a||!b)return -Infinity;
  const ta=String(a.nflTeam||'').toUpperCase(),tb=String(b.nflTeam||'').toUpperCase();
  if(!ta||!tb||ta!==tb)return -Infinity;

  const pa=String(a.pos||'').toUpperCase(),pb=String(b.pos||'').toUpperCase();
  const passerPos=p=>['QB','RB','WR','TE','K'].includes(p);
  const receiverPos=p=>['QB','RB','WR','TE'].includes(p);
  const fa=gvExtractPlayFacts(a),fb=gvExtractPlayFacts(b);
  const passA=passerPos(pa)&&(a.intervalAnalysis?.family==='qb_pass'||fa.family==='pass');
  const passB=passerPos(pb)&&(b.intervalAnalysis?.family==='qb_pass'||fb.family==='pass');
  const recA=receiverPos(pa)&&(a.intervalAnalysis?.family==='reception'||fa.family==='receive');
  const recB=receiverPos(pb)&&(b.intervalAnalysis?.family==='reception'||fb.family==='receive');
  if(!((passA&&recB)||(passB&&recA)))return -Infinity;

  let score=6;
  if(fa.simTag&&fb.simTag){
    if(fa.simTag!==fb.simTag)return -Infinity;
    score+=8;
  }

  const pass=passA?fa:fb,rec=passA?fb:fa;
  if(pass.passYds!=null&&rec.recYds!=null){
    const diff=Math.abs(Number(pass.passYds)-Number(rec.recYds));
    if(diff<=1)score+=5;
    else if(diff<=3)score+=2;
    else return -Infinity;
  }
  if(pass.passTd===rec.recTd&&pass.passTd)score+=3;

  const age=Math.abs((Number(a.time)||0)-(Number(b.time)||0));
  if(age<=GAMEVIEW_CORRELATION_MS)score+=2;
  else if(age>GAMEVIEW_CORRELATION_MS*2)return -Infinity;

  return score;
}
function gvLikelySamePlay(a,b){
  return gvCorrelationScore(a,b)>=9;
}

function gvMergePlayEvents(primary,secondary){
  const a=primary,b=secondary;if(!gvSameNflTeam(a,b))return {...a};
  const factsA=gvExtractPlayFacts(a),factsB=gvExtractPlayFacts(b);
  const isPass=e=>e?.intervalAnalysis?.family==='qb_pass'||gvExtractPlayFacts(e).family==='pass';
  const isRec=e=>e?.intervalAnalysis?.family==='reception'||gvExtractPlayFacts(e).family==='receive';
  const passer=isPass(a)?a:(isPass(b)?b:null);
  const receiver=isRec(a)?a:(isRec(b)?b:null);
  if(!passer||!receiver)return {...a};
  const base=passer||a;
  const passerPos=String(passer.pos||'QB').toUpperCase();
  const receiverPos=String(receiver.pos||'WR').toUpperCase();
  const trickPlay=passerPos!=='QB'||receiverPos==='QB';
  const merged={...base};
  merged.id=`play-${Math.min(a.time||0,b.time||0)}-${a.rosterId}-${a.playerId}-${b.playerId}`;
  merged.time=Math.min(a.time||Date.now(),b.time||Date.now());
  merged.delta=Number(((Number(a.delta)||0)+(Number(b.delta)||0)).toFixed(2));
  merged.total=Number(a.total)||Number(b.total)||0;
  merged.passerPlayerId=passer.playerId||null;
  merged.passerName=passer.name||null;
  merged.passerPos=passerPos;
  merged.passerNflTeam=passer.nflTeam||null;
  merged.qbPlayerId=passer.playerId||null;
  merged.qbName=passer.name||null;
  merged.qbPos=passerPos;
  merged.qbNflTeam=passer.nflTeam||null;
  merged.receiverPlayerId=receiver.playerId||null;
  merged.receiverName=receiver.name||null;
  merged.receiverPos=receiverPos;
  merged.receiverNflTeam=receiver.nflTeam||null;
  merged.source=gvResolveSource(a,b);
  merged.testingForced=merged.source==='testing';
  merged.reconstructed=merged.source==='reconstructed';
  merged.multiActor=true;
  merged.trickPlay=trickPlay;
  merged.correlationKind=trickPlay?'trick-pass':'standard-pass';
  const trickConfidence=gvTrickPlayConfidence(passer,receiver);
  merged.trickConfidenceLevel=trickConfidence.level;
  merged.trickConfidenceLabel=trickConfidence.label;
  merged.trickConfidenceScore=trickConfidence.score;
  merged.trickConfidenceReasons=trickConfidence.reasons;
  merged.playType='qb_pass';
  merged.detail=receiver?.detail||passer?.detail||a.detail||b.detail||'Pass';
  merged.correlationScore=gvCorrelationScore(a,b);
  merged.playSeed=assignmentHash(`${merged.id}|pass|${merged.passerPlayerId}|${merged.receiverPlayerId}`);
  merged.tier=gameViewTier(merged.delta);
  return merged;
}
function gvFindCorrelatedPending(evt){
  let best=null;
  for(let i=gameViewCorrelationWindow.length-1;i>=0;i--){
    const other=gameViewCorrelationWindow[i];if(!gvSameNflTeam(evt,other))continue;
    const age=(evt.time||0)-(other.time||0);
    if(age>GAMEVIEW_CORRELATION_MS*2)break;
    const score=gvCorrelationScore(evt,other);
    if(score>=9&&(!best||score>best.score))best={other,index:i,score};
  }
  return best;
}

