/* UCL GameDay v0.5.58 — build fragment: 50_ctespn_alerts.js
   This file is concatenated in manifest order into the app's single lexical scope.
   It is intentionally not loaded independently in the browser. */
function ctespnIsTouchdown(item){return /touchdown|td/i.test(ctespnAlertDetail(item))}
function ctespnAlertScoreline(pair){
  const rows=pair?.rows||[],a=rows[0],b=rows[1];if(!a||!b)return null;
  return {a,b,ar:rosterFor(a.roster_id),br:rosterFor(b.roster_id),aScore:n(a.points),bScore:n(b.points)};
}
function ctespnLeadName(diff,aName,bName){return diff>0?aName:diff<0?bName:'TIED'}
function ctespnMajorClassification(pair,group){
  const line=ctespnAlertScoreline(pair);if(!line)return null;
  const aId=String(line.a.roster_id),bId=String(line.b.roster_id);
  const aDelta=group.filter(x=>String(x.rosterId)===aId).reduce((s,x)=>s+Number(x.delta||0),0);
  const bDelta=group.filter(x=>String(x.rosterId)===bId).reduce((s,x)=>s+Number(x.delta||0),0);
  const beforeA=line.aScore-aDelta,beforeB=line.bScore-bDelta,beforeDiff=beforeA-beforeB,afterDiff=line.aScore-line.bScore;
  const aName=teamName(line.ar),bName=teamName(line.br),swing=Math.abs(afterDiff-beforeDiff);
  const beforeLeader=Math.sign(beforeDiff),afterLeader=Math.sign(afterDiff);
  const rawLeadChange=afterLeader!==0&&beforeLeader!==afterLeader;
  const leadMaturity=ctespnLeadChangeMaturity(line,beforeDiff,gameNow());
  const leadChange=rawLeadChange&&leadMaturity.eligible;
  const hugeSwing=!rawLeadChange&&swing>=10&&Math.abs(beforeDiff)<=18&&Math.abs(afterDiff-beforeDiff)>=10;
  const session=currentSessionInfo?.()||{id:'idle',label:'Scoring Window'},late=['snf','mnf'].includes(session.id);
  const endgameOpportunity=ctespnEndgameDecisiveContext(line,beforeDiff,afterDiff,gameNow());
  const lateWindow=late||endgameOpportunity.eligible;
  const lateDecisive=!rawLeadChange&&lateWindow&&Math.abs(beforeDiff)<=10&&Math.abs(afterDiff)>=12&&swing>=7;
  let type=null,title=null;
  if(leadChange){type='lead';title='LEAD CHANGE'}
  else if(lateDecisive){type='late';title='LATE-GAME SWING'}
  else if(hugeSwing){type='huge';title='HUGE SWING'}
  if(!type)return null;
  const winnerId=afterDiff>0?aId:bId;
  const candidates=group.filter(x=>Number(x.delta||0)>0&&String(x.rosterId)===winnerId).sort((x,y)=>Number(y.delta||0)-Number(x.delta||0));
  const focal=candidates[0]||group.slice().sort((x,y)=>Math.abs(Number(y.delta||0))-Math.abs(Number(x.delta||0)))[0];
  return {type,title,focal,line,beforeA,beforeB,beforeDiff,afterDiff,aName,bName,sessionLabel:session.label||'Scoring Window',afterLeader:ctespnLeadName(afterDiff,aName,bName),leadMaturity,endgameOpportunity};
}

function ctespnRevisionClassification(pair,group,now=gameNow()){
  const revisions=(group||[]).filter(x=>ctespnSemantic(x).correction);if(!revisions.length)return null;
  const line=ctespnAlertScoreline(pair);if(!line)return null;
  const aId=String(line.a.roster_id),bId=String(line.b.roster_id);
  const aDelta=group.filter(x=>String(x.rosterId)===aId).reduce((sum,x)=>sum+Number(x.delta||0),0);
  const bDelta=group.filter(x=>String(x.rosterId)===bId).reduce((sum,x)=>sum+Number(x.delta||0),0);
  const beforeA=line.aScore-aDelta,beforeB=line.bScore-bDelta,beforeDiff=beforeA-beforeB,afterDiff=line.aScore-line.bScore;
  const swing=Math.abs(afterDiff-beforeDiff),rawLeadChange=Math.sign(afterDiff)!==0&&Math.sign(beforeDiff)!==Math.sign(afterDiff);
  const maturity=ctespnLeadChangeMaturity(line,beforeDiff,now);
  const majorLead=rawLeadChange&&maturity.eligible;
  const majorSwing=!rawLeadChange&&swing>=10&&Math.abs(beforeDiff)<=18;
  const focal=revisions.slice().sort((x,y)=>Math.abs(Number(y.delta||0))-Math.abs(Number(x.delta||0)))[0];
  const aName=teamName(line.ar),bName=teamName(line.br),leader=ctespnLeadName(afterDiff,aName,bName);
  return {major:majorLead||majorSwing,type:majorLead?'revision-lead':majorSwing?'revision-swing':'revision',title:majorLead||majorSwing?'SCORE REVISED':'STAT ADJUSTMENT',focal,line,beforeA,beforeB,beforeDiff,afterDiff,aName,bName,afterLeader:leader,sessionLabel:(currentSessionInfo?.()||{}).label||'Scoring Window',leadMaturity:maturity,revision:true,revisionReason:ctespnSemantic(focal).reason||'Sleeper stat adjustment'};
}
function ctespnPlayerMeta(item){
  const p=playerInfo(item?.playerId)||{};
  return {pos:String(p.pos||p.position||'').toUpperCase(),team:String(p.team||'').toUpperCase()};
}
function ctespnFragmentKey(item){
  return `${Number(item?.time||0)}|${String(item?.rosterId||'')}|${String(item?.playerId||'')}|${Number(item?.delta||0).toFixed(3)}|${Number(item?.total||0).toFixed(3)}`;
}
function ctespnAlertContainsFragment(alert,key){
  if(!alert||!key)return false;
  if(Array.isArray(alert.stitchFragmentKeys)&&alert.stitchFragmentKeys.includes(key))return true;
  return ctespnFragmentKey(alert.item)===key;
}
function ctespnPruneCrossPollFragments(now=gameNow()){
  const cutoff=Number(now||Date.now())-CTESPN_CROSS_POLL_WINDOW_MS;
  for(let i=ctespnCrossPollFragments.length-1;i>=0;i--){
    if(Number(ctespnCrossPollFragments[i]?.time||0)<cutoff)ctespnCrossPollFragments.splice(i,1);
  }
  if(ctespnCrossPollFragments.length>120)ctespnCrossPollFragments.splice(0,ctespnCrossPollFragments.length-120);
}
function ctespnRegisterCrossPollFragment(item,pairId,now,consumed=false){
  const meta=ctespnPlayerMeta(item),key=ctespnFragmentKey(item);
  if(!key||!meta.team||!meta.pos)return null;
  const existing=ctespnCrossPollFragments.find(x=>x.key===key);if(existing)return existing;
  const rec={key,item,pairId:String(pairId||''),rosterId:String(item?.rosterId||''),playerId:String(item?.playerId||''),pos:meta.pos,nflTeam:meta.team,time:Number(now||item?.time||Date.now()),consumed:!!consumed};
  ctespnCrossPollFragments.push(rec);ctespnPruneCrossPollFragments(now);return rec;
}
function ctespnCrossPollMate(item,pairId,now){
  ctespnPruneCrossPollFragments(now);
  const meta=ctespnPlayerMeta(item),rid=String(item?.rosterId||''),pid=String(item?.playerId||''),pair=String(pairId||'');
  if(!meta.team||!meta.pos||!rid)return null;
  const currentIsQb=meta.pos==='QB',currentIsTarget=['WR','TE','RB'].includes(meta.pos);
  if(!currentIsQb&&!currentIsTarget)return null;
  const ranked=[];
  for(const frag of ctespnCrossPollFragments){
    if(frag.consumed||frag.pairId!==pair||frag.rosterId!==rid||frag.playerId===pid||frag.nflTeam!==meta.team)continue;
    const lag=Math.abs(Number(now||0)-Number(frag.time||0));
    if(lag<1000||lag>CTESPN_CROSS_POLL_WINDOW_MS)continue;
    const complementary=(currentIsQb&&['WR','TE','RB'].includes(frag.pos))||(currentIsTarget&&frag.pos==='QB');
    if(!complementary)continue;
    ranked.push({frag,lag});
  }
  ranked.sort((a,b)=>a.lag-b.lag);
  if(!ranked.length)return null;
  // If more than one equally plausible mate exists, don't invent a connection.
  if(ranked.length>1&&Math.abs(ranked[0].lag-ranked[1].lag)<1500)return null;
  return ranked[0];
}
function ctespnTdStackStory(q,r,line,pairId,now,extra={}){
  const total=Number((Number(q.delta||0)+Number(r.delta||0)).toFixed(2));
  const focal=Math.abs(Number(q.delta||0))>=Math.abs(Number(r.delta||0))?q:r;
  return {
    kind:'compact',touchdown:true,item:focal,team:teamName(rosterFor(focal.rosterId)),line,pairId:String(pairId||''),time:now,
    combinedItems:[q,r],stitchFragmentKeys:[ctespnFragmentKey(q),ctespnFragmentKey(r)],
    story:{type:'td-stack',passer:q,receiver:r,totalDelta:total,crossPoll:!!extra.crossPoll,correlationLagMs:Number(extra.correlationLagMs||0)},
    ...extra
  };
}
function ctespnTouchdownStackStories(items,line,pairId='',now=gameNow()){
  const groups=new Map(),consumed=new Set(),stories=[];
  for(const item of items){
    if(!ctespnIsTouchdown(item)||Number(item.delta||0)<=0)continue;
    const meta=ctespnPlayerMeta(item);
    if(!meta.team||!meta.pos)continue;
    const key=`${String(item.rosterId)}|${meta.team}`;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push({item,meta});
  }
  for(const group of groups.values()){
    const qbs=group.filter(x=>x.meta.pos==='QB'),targets=group.filter(x=>['WR','TE','RB'].includes(x.meta.pos));
    if(qbs.length!==1||targets.length!==1)continue;
    const q=qbs[0].item,r=targets[0].item;
    stories.push(ctespnTdStackStory(q,r,line,pairId,now));
    consumed.add(q);consumed.add(r);
    ctespnRegisterCrossPollFragment(q,pairId,now,true);ctespnRegisterCrossPollFragment(r,pairId,now,true);
  }
  return {stories,consumed};
}
function ctespnCrossPollStoryForItem(item,line,pairId,now){
  if(!ctespnIsTouchdown(item)||Number(item.delta||0)<=0)return null;
  const hit=ctespnCrossPollMate(item,pairId,now);
  if(!hit){
    const frag=ctespnRegisterCrossPollFragment(item,pairId,now,false);
    return frag?{kind:'single',fragment:frag}:null;
  }
  const prior=hit.frag;prior.consumed=true;
  const current=ctespnRegisterCrossPollFragment(item,pairId,now,true);if(current)current.consumed=true;
  const priorIsQb=prior.pos==='QB',q=priorIsQb?prior.item:item,r=priorIsQb?item:prior.item;
  const priorActive=ctespnActiveAlert&&ctespnAlertContainsFragment(ctespnActiveAlert,prior.key);
  const priorQueued=ctespnAlertQueue.some(a=>ctespnAlertContainsFragment(a,prior.key));
  const story=ctespnTdStackStory(q,r,line,pairId,now,{crossPoll:true,correlationLagMs:hit.lag,liveUpdate:!!priorActive});
  if(priorQueued)ctespnAlertQueue=ctespnAlertQueue.filter(a=>!ctespnAlertContainsFragment(a,prior.key));
  // If the first half already finished airing, suppress the late sibling rather than
  // narrating the same NFL touchdown twice. Major matchup consequences remain independent.
  if(!priorActive&&!priorQueued)return {kind:'suppress',story};
  return {kind:'story',story};
}
function ctespnAlertPriority(a){
  if(!a)return 0;
  if(a.kind==='major'){
    const base=String(a.type||'').startsWith('revision')?1010:(a.type==='lead'?1000:a.type==='late'?980:960);
    const swing=Math.abs(Number(a.afterDiff||0)-Number(a.beforeDiff||0));
    const closeness=Math.max(0,18-Math.abs(Number(a.beforeDiff||0)));
    return base+Math.min(80,swing*3)+Math.min(18,closeness);
  }
  const d=Math.abs(Number(a.story?.totalDelta??a.item?.delta??0));
  if(a.revision)return 805+Math.min(40,d*2);
  if(a.story?.type==='td-stack')return 790+Math.min(60,d*3);
  if(a.touchdown)return 740+Math.min(60,d*3);
  if(d>=6)return 620+Math.min(60,d*3);
  if(Number(a.item?.delta||0)>0)return 520+Math.min(60,d*3);
  return 430+Math.min(50,d*3);
}
function ctespnSortAlerts(alerts){
  return alerts.sort((a,b)=>ctespnAlertPriority(b)-ctespnAlertPriority(a)||Number(a.time||0)-Number(b.time||0));
}
function ctespnBuildAlertBatch(deltas,now){
  if(!Array.isArray(deltas)||!deltas.length)return [];
  ctespnPruneCrossPollFragments(now);
  const featured=ctespnFeaturedRosterIds(),groups=new Map();
  for(const d of deltas){const pair=ctespnPairForRoster(d.rosterId);if(!pair||ctespnAlertsDisabledForPair(pair.id))continue;const key=String(pair.id);if(!groups.has(key))groups.set(key,{pair,items:[]});groups.get(key).items.push(d)}
  const out=[];
  for(const {pair,items} of groups.values()){
    if((pair.rows||[]).some(r=>featured.has(String(r.roster_id))))continue;
    const pairId=String(pair.id),revision=ctespnRevisionClassification(pair,items,now);
    const normalItems=items.filter(item=>!ctespnSemantic(item).correction);
    const major=normalItems.length?ctespnMajorClassification(pair,normalItems):null,majorFocal=major?.focal;
    if(revision?.major)out.push({kind:'major',pairId,...revision,time:now});
    else if(major)out.push({kind:'major',pairId,...major,time:now});
    const line=ctespnAlertScoreline(pair);if(!line)continue;
    const eligible=items.filter(item=>!(majorFocal&&item===majorFocal)&&!(revision?.major&&item===revision.focal));
    const {stories,consumed}=ctespnTouchdownStackStories(eligible,line,pairId,now);
    for(const story of stories)out.push(story);
    for(const item of eligible){
      if(consumed.has(item))continue;
      const semantic=ctespnSemantic(item),team=teamName(rosterFor(item.rosterId));
      if(semantic.correction){
        const prior=ctespnFindRecentStory(item,pairId,now);
        out.push({kind:'compact',touchdown:false,item,team,line,pairId,time:now,revision:true,title:'STAT ADJUSTMENT',revisionReason:semantic.reason||'Sleeper stat adjustment',revisionOf:prior?.alert||null,liveUpdate:!!prior});
        continue;
      }
      const td=ctespnIsTouchdown(item);
      if(td&&Number(item.delta||0)>0){
        const stitched=ctespnCrossPollStoryForItem(item,line,pairId,now);
        if(stitched?.kind==='story'){out.push(stitched.story);continue}
        if(stitched?.kind==='suppress')continue;
        const key=stitched?.fragment?.key||ctespnFragmentKey(item);
        out.push({kind:'compact',touchdown:true,item,team,line,pairId,time:now,stitchFragmentKeys:[key]});
        continue;
      }
      out.push({kind:'compact',touchdown:td,item,team,line,pairId,time:now});
    }
  }
  return ctespnSortAlerts(out).filter(a=>!ctespnAlreadyAiredState(a,now));
}

function ctespnAlertPairKey(a){return String(a?.pairId??'')}
function ctespnBroadcastLeverage(a){
  if(!a)return 0;
  const before=Math.abs(Number(a.beforeDiff||0)),after=Math.abs(Number(a.afterDiff||0));
  let v=Math.max(0,24-before)*2;
  if(a.kind==='major'){
    if(a.type==='lead')v+=70;
    else if(a.type==='late')v+=60;
    else if(a.type==='huge')v+=45;
    if(a.leadMaturity?.rockFight)v+=35;
    if(/Sunday Night|Monday Night/i.test(String(a.sessionLabel||'')))v+=10;
    v+=Math.max(0,18-after);
  }
  return v;
}
function ctespnDirectorSort(alerts){
  return alerts.sort((a,b)=>{
    const pa=ctespnAlertPriority(a),pb=ctespnAlertPriority(b);
    if(pb!==pa)return pb-pa;
    const la=ctespnBroadcastLeverage(a),lb=ctespnBroadcastLeverage(b);
    if(lb!==la)return lb-la;
    return Number(a.time||0)-Number(b.time||0);
  });
}
function ctespnDropStaleQueuedForPairs(alerts){
  const pairs=new Set(alerts.map(ctespnAlertPairKey).filter(Boolean));
  if(!pairs.size)return;
  ctespnAlertQueue=ctespnAlertQueue.filter(a=>!pairs.has(ctespnAlertPairKey(a)));
}
function ctespnRefreshActiveSameMatchup(alerts){
  if(!ctespnAlertShowing||!ctespnActiveAlert)return false;
  const pair=ctespnAlertPairKey(ctespnActiveAlert);if(!pair)return false;
  const candidates=ctespnDirectorSort(alerts.filter(a=>ctespnAlertPairKey(a)===pair));
  if(!candidates.length)return false;
  const next=candidates[0];
  if(ctespnActiveAlert.kind==='major'){
    const major=candidates.find(a=>a.kind==='major');if(!major)return false;
    major.liveUpdate=true;ctespnActiveAlert=major;
    const body=$('#ctespnMajorBody');if(body)body.innerHTML=ctespnMajorHtml(major);
    clearTimeout(ctespnMajorTimer);ctespnMajorTimer=setTimeout(ctespnDismissMajor,5600);
    return true;
  }
  if(next.kind==='compact'){
    next.liveUpdate=true;ctespnActiveAlert=next;
    const slot=$('#ctespnCompactSlot');if(slot)slot.innerHTML=ctespnCompactHtml(next);
    clearTimeout(ctespnAlertTimer);ctespnAlertTimer=setTimeout(()=>{const el=$('#ctespnActiveCompact');if(el)el.classList.add('out');setTimeout(()=>{if(slot)slot.innerHTML='';ctespnAlertShowing=false;ctespnActiveAlert=null;ctespnShowNextAlert()},280)},next.touchdown?5200:4300);
    return true;
  }
  return false;
}
function ctespnPreemptCompactForMajor(){
  if(!ctespnAlertShowing||ctespnActiveAlert?.kind!=='compact'||ctespnActiveAlert?.touchdown)return false;
  clearTimeout(ctespnAlertTimer);clearTimeout(ctespnPreemptTimer);
  const el=$('#ctespnActiveCompact');if(el)el.classList.add('out');
  ctespnPreemptTimer=setTimeout(()=>{
    const slot=$('#ctespnCompactSlot');if(slot)slot.innerHTML='';
    ctespnAlertShowing=false;ctespnActiveAlert=null;ctespnShowNextAlert();
  },180);
  return true;
}
function ctespnRemoveQueuedAlertsForPair(pairId){
  const id=String(pairId??'');if(!id)return;
  ctespnAlertQueue=ctespnAlertQueue.filter(a=>ctespnAlertPairKey(a)!==id);
}
function ctespnQueueLeagueAlerts(deltas,now=gameNow()){
  const alerts=ctespnBuildAlertBatch(deltas,now);if(!alerts.length)return;
  // Broadcast director: a newer score update supersedes queued cards for the same matchup.
  // This keeps a busy Sunday queue from narrating an obsolete score several cards later.
  ctespnDropStaleQueuedForPairs(alerts);
  const refreshed=ctespnRefreshActiveSameMatchup(alerts);
  const activePair=ctespnAlertPairKey(ctespnActiveAlert);
  const remaining=refreshed?alerts.filter(a=>ctespnAlertPairKey(a)!==activePair):alerts;
  ctespnAlertQueue.push(...remaining);ctespnDirectorSort(ctespnAlertQueue);
  if(remaining.some(a=>a.kind==='major')&&ctespnPreemptCompactForMajor())return;
  ctespnShowNextAlert();
}
function ctespnConfettiMarkup(count=24){
  let s='';for(let i=0;i<count;i++){const angle=(Math.PI*2*i/count)+(i%4)*.11,dist=52+(i%7)*8,x=Math.cos(angle)*dist,y=Math.sin(angle)*dist-24,r=(i*47)%180;s+=`<i style="--x:${x.toFixed(0)}px;--y:${y.toFixed(0)}px;--r:${r}deg;animation-delay:${(i%5)*.025}s"></i>`}return s;
}
function ctespnCompactHtml(a){
  const i=a.item,d=Number(i.delta||0),line=a.line,detail=ctespnAlertDetail(i),aName=teamName(line.ar),bName=teamName(line.br);
  const title=a.revision?(a.liveUpdate?'SCORE REVISED':'STAT ADJUSTMENT'):(a.touchdown?'TOUCHDOWN':(a.liveUpdate?'LIVE UPDATE':(d<0?'SCORE CHANGE':'SCORE ALERT')));
  if(a.revision){
    const prior=a.revisionOf,priorLabel=prior?(prior.title||prior.type||'PRIOR SCORE STORY'):'RECENT SCORE STORY';
    const reason=a.revisionReason||'Sleeper stat adjustment';
    return `<div class="ctespn-compact-alert" id="ctespnActiveCompact"><div class="ctespn-compact-core"><img class="ctespn-alert-logo" alt="CTESPN" src="${CTESPN_ALERT_LOGO}"><div class="ctespn-alert-copy"><div class="ctespn-alert-kicker">${title}</div><div class="ctespn-alert-main"><b>${esc(i.name||'Scoring update')}</b><strong>${d>=0?'+':''}${d.toFixed(2)} FPTS</strong></div><div class="ctespn-alert-meta">${esc(a.team)} • ${esc(reason)}${prior?` • updates ${esc(priorLabel)}`:''}</div></div><div class="ctespn-alert-score"><b>${esc(aName)} ${pts(line.aScore)} • ${esc(bName)} ${pts(line.bScore)}</b><small>REVISED SLEEPER SCORE</small></div></div><div class="ctespn-alert-accent"></div></div>`;
  }
  if(a.story?.type==='td-stack'){
    const q=a.story.passer,r=a.story.receiver,total=Number(a.story.totalDelta||0);
    const stitched=a.story?.crossPoll?` • STITCHED ${Math.max(1,Math.round(Number(a.story.correlationLagMs||0)/1000))}s APART`:'';
    const meta=`${esc(a.team)} • PASSING TD STACK${stitched} • ${esc(q.name||'QB')} ${Number(q.delta||0)>=0?'+':''}${Number(q.delta||0).toFixed(2)} • ${esc(r.name||'Receiver')} ${Number(r.delta||0)>=0?'+':''}${Number(r.delta||0).toFixed(2)}`;
    return `<div class="ctespn-compact-alert touchdown" id="ctespnActiveCompact"><div class="ctespn-compact-core"><img class="ctespn-alert-logo" alt="CTESPN" src="${CTESPN_ALERT_LOGO}"><div class="ctespn-alert-copy"><div class="ctespn-alert-kicker">TOUCHDOWN</div><div class="ctespn-alert-main"><b>${esc(q.name||'QB')} → ${esc(r.name||'Receiver')}</b><strong>${total>=0?'+':''}${total.toFixed(2)} FPTS</strong></div><div class="ctespn-alert-meta">${meta}</div></div><div class="ctespn-alert-score"><b>${esc(aName)} ${pts(line.aScore)} • ${esc(bName)} ${pts(line.bScore)}</b><small>${a.story?.crossPoll?'CROSS-POLL STITCH • ONE PLAY':'ONE PLAY • TWO FANTASY IMPACTS'}</small></div></div><div class="ctespn-alert-accent"></div><div class="ctespn-confetti">${ctespnConfettiMarkup()}</div></div>`;
  }
  return `<div class="ctespn-compact-alert ${a.touchdown?'touchdown':''}" id="ctespnActiveCompact"><div class="ctespn-compact-core"><img class="ctespn-alert-logo" alt="CTESPN" src="${CTESPN_ALERT_LOGO}"><div class="ctespn-alert-copy"><div class="ctespn-alert-kicker">${title}</div><div class="ctespn-alert-main"><b>${esc(i.name||'Scoring update')}</b><strong>${d>=0?'+':''}${d.toFixed(2)} FPTS</strong></div><div class="ctespn-alert-meta">${esc(a.team)}${detail?` • ${esc(detail)}`:''}</div></div><div class="ctespn-alert-score"><b>${esc(aName)} ${pts(line.aScore)} • ${esc(bName)} ${pts(line.bScore)}</b><small>UCL SCORE UPDATE</small></div></div><div class="ctespn-alert-accent"></div>${a.touchdown?`<div class="ctespn-confetti">${ctespnConfettiMarkup()}</div>`:''}</div>`;
}
function ctespnEndgameConsequence(a){
  const line=a?.line;if(!line)return '';
  const diff=Number(a?.afterDiff ?? (Number(line.aScore)-Number(line.bScore))),leader=diff>0?a.aName:diff<0?a.bName:'TIED';
  if(!diff)return 'MATCHUP IS TIED';
  const trailingName=diff>0?a.bName:a.aName;
  const ctx=a.endgameOpportunity||ctespnEndgameDecisiveContext(line,a.beforeDiff,diff,gameNow());
  const opp=diff>0?ctx?.bOpp:ctx?.aOpp,end=ctespnRosterEndgameState(opp);
  if(!opp||!end.trusted)return `${leader} TAKES CONTROL`;
  if(simulation.active&&opp.meaningfulActive===1&&opp.deepPct>=.75)return `${leader} LEADS • ${trailingName} DOWN TO FINAL ACTIVE STARTER`;
  if(opp.meaningfulActive===1&&opp.deepPct>=.75)return `${leader} LEADS • ${trailingName} HAS ONE STARTER STILL ACTIVE`;
  if(opp.meaningfulActive===0&&opp.weightedPct<=.06)return `${leader} LEADS • ${trailingName} HAS LITTLE SCORING OPPORTUNITY LEFT`;
  if(opp.meaningfulActive<=2&&opp.weightedPct<=.15)return `${leader} LEADS • ${trailingName} IS RUNNING OUT OF SCORING OPPORTUNITY`;
  if(opp.concentration>=.65&&opp.meaningfulActive<=2)return `${leader} LEADS • ${trailingName}'S REMAINING UPSIDE IS CONCENTRATED`;
  return `${leader} TAKES CONTROL`;
}
function ctespnMajorHtml(a){
  const f=a.focal||{},d=Number(f.delta||0),line=a.line,leader=a.afterLeader;
  const revisionType=String(a.type||'').startsWith('revision');
  const consequence=revisionType?(a.type==='revision-lead'?`${esc(leader)} NOW LEADS AFTER REVISION`:`STAT ADJUSTMENT CHANGES THE MATCHUP`):(a.type==='lead'?`${esc(leader)} NOW LEADS`:a.type==='late'?esc(ctespnEndgameConsequence(a)):`${esc(leader)} SWINGS THE MATCHUP`);
  return `<div class="ctespn-major-kicker">${revisionType?'CTESPN STAT UPDATE':(a.liveUpdate?'CTESPN LIVE UPDATE':'CTESPN UCL ALERT')}</div><div class="ctespn-major-title">${esc(a.title)}</div><div class="ctespn-major-player">${esc(f.name||'Scoring update')} <strong>${d>=0?'+':''}${d.toFixed(2)} FPTS</strong></div><div class="ctespn-major-teams"><div class="ctespn-major-team"><b>${esc(a.aName)}</b><strong>${pts(line.aScore)}</strong></div><div class="ctespn-major-vs">UCL LIVE</div><div class="ctespn-major-team"><b>${esc(a.bName)}</b><strong>${pts(line.bScore)}</strong></div></div><div class="ctespn-major-consequence">${consequence}</div><div class="ctespn-major-foot">${esc(a.sessionLabel)} • fantasy scores from Sleeper</div>`;
}
function ctespnDismissMajor(){const bg=$('#ctespnMajorBackdrop');if(bg)bg.classList.remove('show');clearTimeout(ctespnMajorTimer);ctespnMajorTimer=setTimeout(()=>{ctespnAlertShowing=false;ctespnActiveAlert=null;ctespnShowNextAlert()},230)}
function ctespnShowNextAlert(){
  if(ctespnAlertShowing||!ctespnAlertQueue.length)return;
  ctespnDirectorSort(ctespnAlertQueue);
  const a=ctespnAlertQueue.shift();ctespnAlertShowing=true;ctespnActiveAlert=a;ctespnRememberStory(a,gameNow());
  if(a.kind==='major'){const bg=$('#ctespnMajorBackdrop'),body=$('#ctespnMajorBody');if(!bg||!body){ctespnAlertShowing=false;ctespnActiveAlert=null;return ctespnShowNextAlert()}body.innerHTML=ctespnMajorHtml(a);bg.classList.add('show');clearTimeout(ctespnMajorTimer);ctespnMajorTimer=setTimeout(ctespnDismissMajor,5600);return}
  const slot=$('#ctespnCompactSlot');if(!slot){ctespnAlertShowing=false;ctespnActiveAlert=null;return ctespnShowNextAlert()}slot.innerHTML=ctespnCompactHtml(a);clearTimeout(ctespnAlertTimer);ctespnAlertTimer=setTimeout(()=>{const el=$('#ctespnActiveCompact');if(el)el.classList.add('out');setTimeout(()=>{slot.innerHTML='';ctespnAlertShowing=false;ctespnActiveAlert=null;ctespnShowNextAlert()},280)},a.touchdown?5200:4300);
}
function ctespnClearAlerts(){ctespnAlertQueue=[];ctespnCrossPollFragments.length=0;ctespnStoryMemory.length=0;ctespnAlertShowing=false;ctespnActiveAlert=null;clearTimeout(ctespnAlertTimer);clearTimeout(ctespnMajorTimer);clearTimeout(ctespnPreemptTimer);const slot=$('#ctespnCompactSlot'),bg=$('#ctespnMajorBackdrop');if(slot)slot.innerHTML='';if(bg)bg.classList.remove('show')}
setTimeout(()=>{const bg=$('#ctespnMajorBackdrop'),logo=$('#ctespnMajorLogo');if(logo)logo.src=CTESPN_ALERT_LOGO;if(bg)bg.addEventListener('click',e=>{if(e.target.closest('.ctespn-major-card'))ctespnDismissMajor()})},0);

function snapshotAndEvents(){const now=gameNow(),snap={},deltas=[];for(const p of matchupPairs())for(const m of p.rows){for(const x of starterRows(m)){const key=`${m.roster_id}:${x.id}`,value=x.points;snap[key]=value;if(Object.prototype.hasOwnProperty.call(lastSnapshot,key)){const d=value-lastSnapshot[key];if(Math.abs(d)>=0.09){const detailKey=`${m.roster_id}:${x.id}`,statDelta=statDeltaForPlayer(x.id),analysis=gvIntervalPlayAnalysis(x.id,(playerInfo(x.id)?.pos||x.pos),statDelta,d),item={time:now,rosterId:m.roster_id,playerId:x.id,name:x.name,delta:d,total:value,detail:analysis?.detail||(simulation.active?(simPlayDetails.get(detailKey)||''):''),intervalAnalysis:analysis};if(simulation.active)simPlayDetails.delete(detailKey);events.unshift(item);deltas.push(item);if(simulation.active&&gvQuickBurstScenario()){
      const tandem=simulationTandemCandidate();
      if(tandem){
        const base=gameViewEventFromDelta(item);
        const tandemEvt=buildSimulationTandemEvent(base,tandem);
        if(tandemEvt){recordGameViewEvent(tandemEvt);continue}
      }
    }
    // v0.4.45: Live GameView playback/feed is owned by gvProcessLiveSnapshot().
    // Keep this legacy/transient ingestion only for the in-app simulation engine,
    // otherwise the same live fantasy delta can enter two independent queues.
    if(simulation.active)recordGameViewEvent(item);events=events.slice(0,80)}}}const tk=`team:${m.roster_id}`,tv=n(m.points);snap[tk]=tv}lastSnapshot=snap;captureScoreHistory(now);if(simulation.active)updateMomentum(deltas,now);ctespnQueueLeagueAlerts(deltas,now)}
function venueFor(rosterId,idx){return idx===0?'AWAY':'HOME'}

function matchupIndex(){
  const pairs=matchupPairs(),chosen=chosenPair();
  return Math.max(0,pairs.findIndex(p=>String(p.id)===String(chosen?.id)));
}
function cycleMatchup(step=1){
  const pairs=matchupPairs();if(!pairs.length)return;
  const idx=matchupIndex(),next=(idx+step+pairs.length)%pairs.length;
  featuredMatchupId=pairs[next].id;
  render();
  if(currentView==='gameview')renderGameViewScorebar();
}
function watchRecentEvent(pair){
  if(!pair)return null;
  const ids=new Set(pair.rows.map(x=>String(x.roster_id)));
  return events.find(e=>!e.separator&&ids.has(String(e.rosterId)))||null;
}
function watchQueueCount(){
  const live=(gameViewSession?.queue||[]).length;
  const transient=Array.isArray(gameViewQueue)?gameViewQueue.length:0;
  return Math.max(live,transient);
}
function renderWatchBar(pair){
  const label=$('#watchMatchupLabel'),recent=$('#watchRecent'),queue=$('#watchQueue'),state=$('#watchState');
  if(!label||!recent||!queue||!state)return;
  if(!pair){label.textContent='No matchup';recent.textContent='Waiting for Sleeper';queue.textContent='0 plays';state.textContent='Waiting';return}
  const op=orientedPair(pair),[a,b]=op.rows,ra=rosterFor(a.roster_id),rb=rosterFor(b.roster_id);
  label.textContent=`${teamName(ra)} ${pts(a.points)} – ${pts(b.points)} ${teamName(rb)}`;
  const e=watchRecentEvent(op);
  recent.textContent=e?`${e.name} ${e.delta>=0?'+':''}${Number(e.delta||0).toFixed(2)}`:'No scoring yet';
  const q=watchQueueCount();queue.textContent=`${q} ${q===1?'play':'plays'}`;
  state.textContent=simulation.active?(simulation.paused?'Simulation Paused':'Simulation Live'):(liveLoadingEnabled()?'Live Sleeper':'Offline Data');
}

function renderRibbon(){
  const root=$('#scoreRibbon'),chosen=chosenPair();
  root.innerHTML=matchupPairs().map(p=>{
    const a=p.rows[0],b=p.rows[1],ra=rosterFor(a.roster_id),rb=rosterFor(b.roster_id),lead=n(a.points)-n(b.points);
    const margin=Math.abs(lead);
    return `<button class="game-chip ${chosen&&String(chosen.id)===String(p.id)?'active':''}" data-mid="${esc(p.id)}">
      <div class="game-chip-top"><span>GAME ${esc(p.id)}</span><span>W${esc(nflState?.week||'—')}</span></div>
      <div class="mini-team ${lead>0?'leading':''}"><b>${esc(teamName(ra))}</b><strong>${pts(a.points)}</strong></div>
      <div class="mini-team ${lead<0?'leading':''}"><b>${esc(teamName(rb))}</b><strong>${pts(b.points)}</strong></div>
      <div class="game-chip-margin">${lead===0?'TIED':`${margin.toFixed(2)} PT EDGE`}</div>
    </button>`;
  }).join('');
  root.querySelectorAll('[data-mid]').forEach(b=>b.onclick=()=>{
    featuredMatchupId=b.dataset.mid;
    const pair=matchupPairs().find(p=>String(p.id)===String(featuredMatchupId));
    const current=String($('#teamSelect')?.value||'');
    const ids=(pair?.rows||[]).map(r=>String(r.roster_id));
    syncSelectedTeamToFeaturedMatchup(ids.includes(current)?current:(ids[0]||''));
    if(currentView!=='gameday')setView('gameday');else render();
  });
}

function renderScoresView(){
  const root=$('#scoresGrid'),title=$('#scoresTitle'),status=$('#scoresStatus');if(!root)return;
  const week=n(nflState?.week)||1,pairs=matchupPairs();
  if(title)title.textContent=`Week ${week} Scores`;
  if(status)status.textContent=simulation.active?'Simulation scores':'Live Sleeper scoring';
  if(!pairs.length){
    root.innerHTML='<div class="empty scores-empty">No UCL matchups are available for this week yet.</div>';
    return;
  }
  root.innerHTML=pairs.map((pair,index)=>{
    const a=pair.rows?.[0],b=pair.rows?.[1];if(!a||!b)return '';
    const ra=rosterFor(a.roster_id),rb=rosterFor(b.roster_id),ap=n(a.points),bp=n(b.points);
    const lead=ap===bp?'TIED':ap>bp?teamName(ra):teamName(rb);
    const active=String(pair.id)===String(featuredMatchupId||'');
    return `<div class="scores-game ${active?'active':''}" data-scores-mid="${esc(String(pair.id))}" role="button" tabindex="0" aria-label="Select Game ${index+1}">
      <div class="scores-game-top"><span>GAME ${index+1}</span><span>${ap===bp?'TIED':`${esc(lead)} +${Math.abs(ap-bp).toFixed(2)}`}</span></div>
      <div class="scores-team ${ap>bp?'leading':''}">
        <button type="button" class="scores-team-link" data-scores-roster="${esc(String(a.roster_id))}" aria-label="Open ${esc(teamName(ra))} in GameView">${esc(teamName(ra))}</button>
        <strong>${pts(ap)}</strong>
      </div>
      <div class="scores-team ${bp>ap?'leading':''}">
        <button type="button" class="scores-team-link" data-scores-roster="${esc(String(b.roster_id))}" aria-label="Open ${esc(teamName(rb))} in GameView">${esc(teamName(rb))}</button>
        <strong>${pts(bp)}</strong>
      </div>
    </div>`;
  }).join('');

  const chooseMatchup=mid=>{
    featuredMatchupId=mid;
    const pair=matchupPairs().find(p=>String(p.id)===String(featuredMatchupId));
    const current=String($('#teamSelect')?.value||'');
    const ids=(pair?.rows||[]).map(r=>String(r.roster_id));
    syncSelectedTeamToFeaturedMatchup(ids.includes(current)?current:(ids[0]||''));
    renderScoresView();
  };

  root.querySelectorAll('[data-scores-mid]').forEach(card=>{
    card.onclick=e=>{
      if(e.target.closest('[data-scores-roster]'))return;
      chooseMatchup(card.dataset.scoresMid);
    };
    card.onkeydown=e=>{
      if(!['Enter',' '].includes(e.key)||e.target.closest('[data-scores-roster]'))return;
      e.preventDefault();
      chooseMatchup(card.dataset.scoresMid);
    };
  });

  root.querySelectorAll('[data-scores-roster]').forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    const rid=String(btn.dataset.scoresRoster||'');if(!rid)return;
    selectPreferredTeam(rid);
    setView('gameview');
  });
}

function renderHero(pair){pair=orientedPair(pair);const [a,b]=pair.rows,ra=rosterFor(a.roster_id),rb=rosterFor(b.roster_id),diff=n(a.points)-n(b.points),leader=diff===0?'TIED':diff>0?teamName(ra):teamName(rb);$('#hero').innerHTML=`<div class="hero-top"><span class="live-pill">GAMEDAY</span><span>WEEK ${esc(nflState?.week||'—')} • FEATURED MATCHUP</span></div><div class="hero-score"><div class="hero-team"><div class="venue">${venueFor(a.roster_id,0)}</div><h2>${esc(teamName(ra))}</h2><div class="score">${pts(a.points)}</div><div class="record">${esc(record(ra))}</div></div><div class="hero-mid"><div class="edge-label">CURRENT EDGE</div><div class="edge-num">${Math.abs(diff).toFixed(2)}</div><div class="edge-team">${esc(leader)}</div></div><div class="hero-team"><div class="venue">${venueFor(b.roster_id,1)}</div><h2>${esc(teamName(rb))}</h2><div class="score">${pts(b.points)}</div><div class="record">${esc(record(rb))}</div></div></div>`}
function lineupWeekStats(id){
  const sid=String(id||'');
  if(gameViewStats&&Object.prototype.hasOwnProperty.call(gameViewStats,sid))return gameViewStats[sid]||{};
  const saved=gameViewSession?.lastSnapshot?.statsByPlayer;
  if(saved&&Object.prototype.hasOwnProperty.call(saved,sid))return saved[sid]||{};
  return null;
}
function lineupStatSummary(id,pos){
  const s=lineupWeekStats(id);if(s===null)return '';
  const p=String(pos||'').toUpperCase()==='DST'?'DEF':String(pos||'').toUpperCase();
  const v=k=>Number(s?.[k])||0,parts=[];
  const push=x=>{if(x)parts.push(x)};
  const tdLabel=(n,label='TD')=>n>0?`${Math.round(n)} ${label}`:'';

  const pass=()=>{
    const cmp=v('pass_cmp'),att=v('pass_att'),yd=v('pass_yd'),td=v('pass_td'),ints=v('pass_int');
    if(cmp||att||yd||td||ints){
      const x=[];
      if(cmp||att)x.push(`${Math.round(cmp)}/${Math.round(att)} CMP`);
      if(yd)x.push(`${Math.round(yd)} YD`);
      if(td)x.push(tdLabel(td));
      if(ints)x.push(`${Math.round(ints)} INT`);
      push(x.join(', '));
    }
  };
  const rush=()=>{
    const car=v('rush_att'),yd=v('rush_yd'),td=v('rush_td');
    if(car||yd||td){
      const x=[];
      if(car)x.push(`${Math.round(car)} CAR`);
      if(yd)x.push(`${Math.round(yd)} YD`);
      if(td)x.push(tdLabel(td));
      push(x.join(', '));
    }
  };
  const rec=()=>{
    const catches=v('rec'),tgt=v('rec_tgt'),yd=v('rec_yd'),td=v('rec_td');
    if(catches||tgt||yd||td){
      const x=[];
      if(catches||tgt)x.push(`${Math.round(catches)}/${Math.round(tgt||catches)} REC`);
      if(yd)x.push(`${Math.round(yd)} YD`);
      if(td)x.push(tdLabel(td));
      push(x.join(', '));
    }
  };
  const kick=()=>{
    const fgm=v('fgm')||v('fgm_0_19')+v('fgm_20_29')+v('fgm_30_39')+v('fgm_40_49')+v('fgm_50p');
    const fgmiss=v('fgmiss')||v('fg_miss')||v('fgmissed');
    const fga=v('fga')||v('fg_att')||(fgm+fgmiss);
    const xpm=v('xpm'),xpmiss=v('xpmiss')||v('xp_miss'),xpa=v('xpa')||v('xp_att')||(xpm+xpmiss);
    if(fga||fgm)push(`${Math.round(fgm)}/${Math.round(fga||fgm)} FG`);
    if(xpa||xpm)push(`${Math.round(xpm)}/${Math.round(xpa||xpm)} XP`);
  };
  const defense=()=>{
    const pa=v('pts_allow')||v('points_allow')||v('pa');
    const sacks=v('sack'),ints=v('int'),fr=v('fum_rec')||v('st_fum_rec');
    if(pa||Object.prototype.hasOwnProperty.call(s,'pts_allow')||Object.prototype.hasOwnProperty.call(s,'points_allow')||Object.prototype.hasOwnProperty.call(s,'pa'))push(`${Math.round(pa)} PTS ALLOW`);
    if(sacks)push(`${trimStat(sacks)} SACK`);
    if(ints)push(`${trimStat(ints)} INT`);
    if(fr)push(`${trimStat(fr)} FR`);

    // Prefer explicit TD subtype stats when Sleeper supplies them. Fall back to generic TD
    // only for any remaining aggregate D/ST touchdowns.
    const intTd=v('int_td')||v('def_int_td');
    const frTd=v('fum_rec_td')||v('def_fum_td');
    const koTd=v('kick_ret_td')||v('kr_td')||v('def_kick_ret_td');
    const pntTd=v('punt_ret_td')||v('pr_td')||v('def_punt_ret_td');
    if(intTd)push(`${trimStat(intTd)} INT TD`);
    if(frTd)push(`${trimStat(frTd)} FR TD`);
    if(koTd)push(`${trimStat(koTd)} KO TD`);
    if(pntTd)push(`${trimStat(pntTd)} PNT TD`);
    const typed=intTd+frTd+koTd+pntTd;
    const totalTd=v('def_td')+v('def_st_td')+v('st_td');
    if(totalTd>typed)push(`${trimStat(totalTd-typed)} TD`);
  };

  if(p==='QB'){pass();rush();rec()}
  else if(p==='RB'){rush();rec();pass()}
  else if(p==='WR'||p==='TE'){rec();rush();pass()}
  else if(p==='K'){kick();pass();rush();rec()}
  else if(p==='DEF'){defense()}
  else {pass();rush();rec()}

  return parts.join(', ');
}
function trimStat(v){const x=Number(v)||0;return Number.isInteger(x)?String(x):x.toFixed(2).replace(/0+$/,'').replace(/\.$/,'')}
const LINEUP_SCORING_LABELS=Object.freeze({
  pass_yd:'Passing yards',pass_td:'Passing TD',pass_int:'Interception thrown',pass_2pt:'Passing two-point conversion',
  rush_yd:'Rushing yards',rush_td:'Rushing TD',rush_2pt:'Rushing two-point conversion',
  rec:'Reception',rec_yd:'Receiving yards',rec_td:'Receiving TD',rec_2pt:'Receiving two-point conversion',bonus_rec_te:'TE reception bonus',bonus_rec_rb:'RB reception bonus',bonus_rec_wr:'WR reception bonus',
  fum_lost:'Fumble lost',fum_rec:'Fumble recovery',fum_rec_td:'Fumble recovery TD',fum_ret_yd:'Fumble return yards',
  fgm:'Field goal made',fgm_yds_over_30:'FG yards over 30',fgmiss:'Field goal missed',xpm:'Extra point made',
  int:'Interception',int_ret_yd:'Interception return yards',def_int_ret_yd:'Interception return yards',sack:'Sack',sack_yd:'Sack yards',safe:'Safety',blk_kick:'Blocked kick',blk_kick_ret_yd:'Blocked-kick return yards',def_td:'Defensive TD',def_st_td:'D/ST TD',def_2pt:'Defensive two-point return',def_pass_def:'Pass defended',pass_def:'Pass defended',qb_hit:'QB hit',tkl_loss:'Tackle for loss',tkl_solo:'Solo tackle',st_ff:'Special-teams forced fumble',st_fum_rec:'Special-teams fumble recovery',st_td:'Special-teams TD',fg_ret_yd:'Missed-FG return yards'
});
function lineupScoringKey(key){
  return (leagueInfo?.scoring_settings&&Object.prototype.hasOwnProperty.call(leagueInfo.scoring_settings,key))||Object.prototype.hasOwnProperty.call(UCL_2026_SCORING_FALLBACK,key)?key:(UCL_SCORING_ALIASES[key]||key)
}
function lineupScoringBreakdown(id,pos,total){
  const s=lineupWeekStats(id)||{},p=String(pos||'').toUpperCase()==='DST'?'DEF':String(pos||'').toUpperCase(),rows=[];let calc=0;
  for(const [key,raw] of Object.entries(s)){
    const stat=Number(raw);if(!Number.isFinite(stat)||stat===0)continue;
    const scoreKey=lineupScoringKey(key),rate=uclScoringWeight(scoreKey,0),points=stat*rate;if(!rate||Math.abs(points)<.0001)continue;
    rows.push({key,label:LINEUP_SCORING_LABELS[key]||LINEUP_SCORING_LABELS[scoreKey]||key.replaceAll('_',' '),stat,rate,points});calc+=points;
  }
  const rec=Number(s.rec||0),bonusKey=p==='TE'?'bonus_rec_te':p==='RB'?'bonus_rec_rb':p==='WR'?'bonus_rec_wr':'';
  if(rec&&bonusKey&&!Object.prototype.hasOwnProperty.call(s,bonusKey)){
    const rate=uclScoringWeight(bonusKey,0),points=rec*rate;if(rate&&Math.abs(points)>=.0001){rows.push({key:bonusKey,label:LINEUP_SCORING_LABELS[bonusKey]||'Reception bonus',stat:rec,rate,points});calc+=points}
  }
  const order=p==='QB'?['pass','rush','rec','fum']:p==='RB'?['rush','rec','pass','fum']:(p==='WR'||p==='TE')?['rec','rush','pass','fum']:p==='K'?['fg','xp','pass','rush','rec','fum']:p==='DEF'?['def','int','sack','safe','blk','fum','st','return']:['pass','rush','rec','fg','def','fum'];
  const family=k=>k.startsWith('pass_')?'pass':k.startsWith('rush_')?'rush':k==='rec'||k.startsWith('rec_')||k.startsWith('bonus_rec_')?'rec':k.startsWith('fg')?'fg':k==='xpm'?'xp':k.startsWith('fum')?'fum':k==='int'||k.startsWith('int_')||k.startsWith('def_int')?'int':k.startsWith('sack')?'sack':k==='safe'?'safe':k.startsWith('blk')?'blk':k.startsWith('st_')?'st':k.startsWith('def_')||k==='qb_hit'||k.startsWith('tkl_')?'def':k.includes('ret_yd')?'return':'other';
  rows.sort((a,b)=>{const ai=order.indexOf(family(a.key)),bi=order.indexOf(family(b.key));return (ai<0?99:ai)-(bi<0?99:bi)});
  const actual=Number(total)||0,adjustment=actual-calc;if(Math.abs(adjustment)>=.011)rows.push({key:'other',label:'Other Sleeper scoring',stat:null,rate:null,points:adjustment});
  return rows;
}
function formatScoringRate(v){const x=Number(v)||0;return Number.isInteger(x)?x.toFixed(0):x.toFixed(3).replace(/0+$/,'').replace(/\.$/,'')}
function openLineupFptsBreakdown(playerId,pos,total){
  const info=playerInfo(playerId),backdrop=$('#playerFptsBackdrop'),body=$('#playerFptsBody'),title=$('#playerFptsTitle'),meta=$('#playerFptsMeta'),totalEl=$('#playerFptsTotal');if(!backdrop||!body)return;
  title.textContent=info.name;meta.textContent=`${info.pos||pos||'—'} • ${info.team||'FA'}`;const rows=lineupScoringBreakdown(playerId,pos||info.pos,total);
  body.innerHTML=rows.length?rows.map(r=>`<div class="player-fpts-row"><div><b>${esc(r.label)}</b>${r.stat===null?'':`<small>${esc(trimStat(r.stat))} × ${esc(formatScoringRate(r.rate))}</small>`}</div><span class="player-fpts-value ${r.points<0?'neg':''}">${r.points>=0?'+':''}${Number(r.points).toFixed(2)}</span></div>`).join(''):'<div class="player-fpts-empty">No scoring stats detected yet.</div>';
  totalEl.textContent=pts(total);totalEl.classList.toggle('negative',Number(total)<0);backdrop.hidden=false;
}
function closeLineupFptsBreakdown(){const b=$('#playerFptsBackdrop');if(b)b.hidden=true}
function bindLineupFptsBreakdown(){
  const host=$('#lineups');if(host&&!host.dataset.fptsBound){host.dataset.fptsBound='1';host.addEventListener('click',e=>{const b=e.target.closest('[data-fpts-player]');if(b)openLineupFptsBreakdown(b.dataset.fptsPlayer,b.dataset.fptsPos,Number(b.dataset.fptsTotal||0))})}
  const close=$('#playerFptsClose'),backdrop=$('#playerFptsBackdrop');if(close&&!close.dataset.bound){close.dataset.bound='1';close.onclick=closeLineupFptsBreakdown}if(backdrop&&!backdrop.dataset.bound){backdrop.dataset.bound='1';backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeLineupFptsBreakdown()})}
}

function lineupAvailabilityLabel(player){
  const injury=String(player?.injury_status||player?.injuryStatus||'').trim();
  const status=String(player?.status||'').trim();
  const raw=injury||status;
  if(!raw||/^active$/i.test(raw))return '';
  const map={
    'questionable':'Q','q':'Q','doubtful':'D','d':'D','out':'OUT',
    'injured reserve':'IR','injured_reserve':'IR','ir':'IR',
    'physically unable to perform':'PUP','physically_unable_to_perform':'PUP','pup':'PUP',
    'suspended':'SUSP','susp':'SUSP',
    'non-football injury':'NFI','non_football_injury':'NFI','nfi':'NFI'
  };
  return map[raw.toLowerCase()]||raw.toUpperCase();
}
function lineupAvailabilityClass(player){
  const label=lineupAvailabilityLabel(player);
  if(label==='Q')return 'injury-questionable';
  if(label==='D')return 'injury-doubtful';
  if(['OUT','IR','PUP','SUSP','NFI'].includes(label))return 'injury-out';
  return label?'injury-other':'';
}
function renderLineups(pair){
  pair=orientedPair(pair);
  const html=pair.rows.map((m,side)=>{
    const r=rosterFor(m.roster_id),rows=starterRows(m),rid=String(m.roster_id);
    return `<div class="lineup-side"><div class="lineup-title"><span>${esc(teamName(r))}</span><span>${pts(m.points)}</span></div>${
      rows.length?rows.map(x=>{
        const statLine=lineupStatSummary(x.id,x.pos),activity=nflTeamGameActivity(x.team),activeGame=activity.active;
        const injuryLabel=lineupAvailabilityLabel(x),injuryClass=lineupAvailabilityClass(x);
        const tip=activeGame?(['status','espn-status'].includes(activity.source)?'NFL game currently in progress':'NFL game expected to be in progress'):(['final','espn-final'].includes(activity.source)?'NFL game final':'Open this UCL team in GameView');
        return `<div class="player-row ${activeGame?'nfl-game-active':''}" data-player="${esc(x.id)}">
          <span class="pos">${esc(x.slot)}</span>
          <div class="player-copy player-gameview-link" role="button" tabindex="0" data-gameday-gv-roster="${esc(rid)}" aria-label="Open ${esc(teamName(r))} in UCL GameView" title="${esc(tip)}">
            <div class="pname">${esc(x.name)}${activeGame?'<span class="game-active-dot" aria-label="NFL game in progress"></span>':''}</div>
            <div class="pmeta">${esc(x.pos)} • ${esc(x.team)}${injuryLabel?` <span class="injury-badge ${injuryClass}" title="Availability: ${esc(injuryLabel)}">${esc(injuryLabel)}</span>`:''}</div>
            ${statLine?`<div class="pstats">${esc(statLine)}</div>`:''}
          </div>
          <button type="button" class="pts player-fpts-trigger ${x.points<0?'negative':''}" data-fpts-player="${esc(x.id)}" data-fpts-pos="${esc(x.pos)}" data-fpts-total="${esc(x.points)}" aria-label="Show ${esc(x.name)} fantasy point breakdown">${pts(x.points)}<small>PTS</small></button>
        </div>`;
      }).join(''):'<div class="empty">No starters reported.</div>'
    }</div>`;
  }).join('');
  $('#lineups').innerHTML=html;
  bindLineupFptsBreakdown();
}
function renderEvents(pair){pair=orientedPair(pair);const ids=new Set(pair.rows.map(x=>String(x.roster_id))),rows=events.filter(e=>e.separator||ids.has(String(e.rosterId))).slice(0,28);$('#events').innerHTML=rows.length?rows.map(e=>e.separator?`<div class="session-sep">${esc(e.sessionLabel)}</div>`:`<div class="event"><span class="event-time">${simulation.active?simTimeLabel((e.time-simulation.virtualStart)/1000):new Date(e.time).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</span><div><b>${esc(e.name)}</b><small>${esc(teamName(rosterFor(e.rosterId)))} • now ${pts(e.total)}</small></div><span class="delta ${e.delta<0?'neg':''}">${e.delta>=0?'+':''}${e.delta.toFixed(2)}</span></div>`).join(''):'<div class="empty">No score changes detected yet. GameDay will build this feed while it is open.</div>'}

function condensedScoreHistory(rows,maxRows=10){
  if(rows.length<=maxRows)return rows;
  const keep=[rows[0]],slots=maxRows-2;
  for(let i=1;i<=slots;i++){const idx=Math.round(i*(rows.length-1)/(slots+1));if(rows[idx]&&keep.at(-1)!==rows[idx])keep.push(rows[idx])}
  if(keep.at(-1)!==rows.at(-1))keep.push(rows.at(-1));
  return keep
}

function historyTimeLabel(t){
  if(simulation.active){
    const sec=Math.max(0,Number(t)||0),session=simulationSessionAt(sec),within=Math.max(0,sec-session.start);
    const h=Math.floor(within/3600),m=Math.floor((within%3600)/60);
    return `${session.label} • ${h}:${String(m).padStart(2,'0')}`;
  }
  return new Date(Number(t)).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
}
function renderScoreHistory(pair){
  const root=$('#scoreHistory');if(!root||!pair)return;
  const oriented=orientedPair(pair),leftId=String(oriented.rows[0].roster_id),rightId=String(oriented.rows[1].roster_id),bucket=scoreHistoryBucket(pair);
  const rows=condensedScoreHistory(bucket,10);
  if(!rows.length){root.innerHTML='<div class="empty">No score history has been observed yet.</div><div class="score-history-note">No score history yet.</div>';return}
  const lr=rosterFor(leftId),rr=rosterFor(rightId);
  root.innerHTML=`<div class="score-history-list">${rows.map(x=>{let l,r;if(String(x.aRosterId)===leftId){l=x.a;r=x.b}else{l=x.b;r=x.a}const diff=l-r,edge=diff===0?'Tied':`${diff>0?teamName(lr):teamName(rr)} +${Math.abs(diff).toFixed(2)}`;return `<div class="score-history-row"><time>${esc(historyTimeLabel(x.t))}</time><div class="score-history-score">${esc(teamName(lr))} ${pts(l)} — ${pts(r)} ${esc(teamName(rr))}</div><div class="score-history-edge">${esc(edge)}</div></div>`}).join('')}</div><div class="score-history-note">${simulation.active?'Simulation score history.':'Half-hour score history saved by GameDay.'}</div>`
}

function renderFlow(pair){pair=orientedPair(pair);const [a,b]=pair.rows,ta=Math.max(0,n(a.points)),tb=Math.max(0,n(b.points)),max=Math.max(1,ta,tb);$('#flow').innerHTML=`<div class="flow-bars"><div class="flow-row"><b>${esc(teamName(rosterFor(a.roster_id)))}</b><div class="bar"><span style="width:${Math.max(2,ta/max*100)}%"></span></div><strong>${pts(ta)}</strong></div><div class="flow-row"><b>${esc(teamName(rosterFor(b.roster_id)))}</b><div class="bar"><span style="width:${Math.max(2,tb/max*100)}%"></span></div><strong>${pts(tb)}</strong></div></div>`}

function gameViewPair(){return chosenPair()}
function gameViewInitials(name=''){const parts=String(name).trim().split(/\s+/).filter(Boolean);return (parts[0]?.[0]||'P')+(parts.length>1?(parts.at(-1)?.[0]||''):'')}
function gameViewTier(delta){const d=Math.abs(Number(delta)||0);return d>=10?'huge':d>=6?'celebration':d>=2?'medium':'small'}

function statNum(obj,key){const v=obj?.[key];return Number.isFinite(Number(v))?Number(v):0}
function statsForPlayer(id){return gameViewStats[String(id)]||{}}
function statDeltaForPlayer(id){const now=statsForPlayer(id),prev=lastGameViewStats[String(id)]||{},out={};for(const k of ['rush_att','rush_yd','rush_td','rec','rec_yd','rec_td','pass_att','pass_cmp','pass_yd','pass_td','pass_int','fum_lost','fgm','fgm_0_19','fgm_20_29','fgm_30_39','fgm_40_49','fgm_50p','xpm','def_td','def_st_td','int','fum_rec','sack','pass_def','pass_defended','passes_defended','pd','def_int_ret_yd','fum_rec_yd','kick_ret_yd','punt_ret_yd']){const d=statNum(now,k)-statNum(prev,k);if(Math.abs(d)>.0001)out[k]=d}return out}
function playDetailFromStats(id,pos,delta){
  const d=statDeltaForPlayer(id),bits=[],p=String(pos||'').toUpperCase();
  if(d.rush_td)bits.push(`${d.rush_td>0?'+':''}${d.rush_td} rushing TD`);
  if(d.rush_yd)bits.push(`${d.rush_yd>0?'+':''}${Math.round(d.rush_yd)} rushing yards`);
  if(d.rec_td)bits.push(`${d.rec_td>0?'+':''}${d.rec_td} receiving TD`);
  if(d.rec)bits.push(`${d.rec>0?'+':''}${d.rec} reception${Math.abs(d.rec)===1?'':'s'}`);
  if(d.rec_yd)bits.push(`${d.rec_yd>0?'+':''}${Math.round(d.rec_yd)} receiving yards`);
  if(d.pass_td)bits.push(`${d.pass_td>0?'+':''}${d.pass_td} passing TD`);
  if(d.pass_yd)bits.push(`${d.pass_yd>0?'+':''}${Math.round(d.pass_yd)} passing yards`);
  if(d.pass_int)bits.push(`${d.pass_int>0?'+':''}${d.pass_int} INT`);
  if(d.fgm_50p)bits.push(`${d.fgm_50p>0?'+':''}${d.fgm_50p} FG 50+`);
  if(d.fgm_40_49)bits.push(`${d.fgm_40_49>0?'+':''}${d.fgm_40_49} FG 40–49`);
  if(d.fgm_30_39)bits.push(`${d.fgm_30_39>0?'+':''}${d.fgm_30_39} FG 30–39`);
  if(d.fgm_20_29||d.fgm_0_19)bits.push(`+${(d.fgm_20_29||0)+(d.fgm_0_19||0)} FG`);
  if(d.xpm)bits.push(`${d.xpm>0?'+':''}${d.xpm} XP`);
  if(d.def_td)bits.push(`${d.def_td>0?'+':''}${d.def_td} defensive TD`);
  if(d.def_st_td)bits.push(`${d.def_st_td>0?'+':''}${d.def_st_td} special-teams TD`);
  if(d.kick_ret_yd)bits.push(`${d.kick_ret_yd>0?'+':''}${Math.round(d.kick_ret_yd)} kick return yards`);
  if(d.punt_ret_yd)bits.push(`${d.punt_ret_yd>0?'+':''}${Math.round(d.punt_ret_yd)} punt return yards`);
  if(d.int)bits.push(`${d.int>0?'+':''}${d.int} interception`);
  if(d.def_int_ret_yd)bits.push(`${d.def_int_ret_yd>0?'+':''}${Math.round(d.def_int_ret_yd)} INT return yards`);
  if(d.fum_rec)bits.push(`${d.fum_rec>0?'+':''}${d.fum_rec} fumble recovery`);
  if(d.fum_rec_yd)bits.push(`${d.fum_rec_yd>0?'+':''}${Math.round(d.fum_rec_yd)} fumble return yards`);
  if(d.sack)bits.push(`${d.sack>0?'+':''}${d.sack} sack`);
  return bits.slice(0,2).join(' • ');
}
function simulatedPlayDetail(pos,delta,seed=1){
  const p=String(pos||'').toUpperCase(),d=Math.abs(Number(delta)||0),r=simRand(assignmentHash(seed),77);
  if(p==='QB'){if(d>=4)return `Touchdown pass • ${Math.round(12+r*35)} yards`;return `${Math.round(8+r*28)} passing yards`}
  if(p==='RB'){if(d>=6)return `Rushing touchdown • ${Math.round(2+r*28)} yards`;return `${Math.round(5+r*24)} rushing yards`}
  if(p==='WR'||p==='TE'){if(d>=6)return `Receiving touchdown • ${Math.round(8+r*38)} yards`;return `${Math.max(1,Math.round(d<2?1:1+r))} reception • ${Math.round(6+r*30)} yards`}
  if(p==='K'){const y=d>=5?50+Math.round(r*17):d>=4?40+Math.round(r*9):25+Math.round(r*14);return `${y}-yard field goal`}
  if(p==='DEF'){
    if(d>=8)return r>.5?'Interception return touchdown':'Fumble return touchdown';
    if(d>=4.5)return r>.66?'Sack':r>.33?'Run stop':'Pass breakup';
    if(d>=2)return r>.55?'Quarterback hit':'Run stop';
    return 'Pass breakup';
  }
  return `${d.toFixed(1)} fantasy points`
}

function gvScheduleTeamCode(v){
  return String(v||'').trim().toUpperCase();
}
