function currentDraftNumber(){
  const apiCount=lastDraftPicks.length;
  if(apiCount)return apiCount+1;
  let drafted=0;PLAYERS.forEach(p=>{if(ps(p.rank).draft!=='available')drafted++;});
  return drafted+1;
}
function myRawPicks(){
  if(!sleeperCtx.userId&&!sleeperCtx.rosterId)return [];
  return lastDraftPicks.filter(p=>
    String(p.picked_by||'')===String(sleeperCtx.userId) ||
    (sleeperCtx.rosterId!=null&&String(p.roster_id||'')===String(sleeperCtx.rosterId))
  );
}
function myRosterProfile(){
  const players=mySleeperPlayers();
  const fallback=players.length?players:minePlayers().map(p=>({...p,ranked:true}));
  const counts={QB:0,RB:0,WR:0,TE:0,K:0,DEF:0};
  fallback.forEach(p=>{
    const pos=String(p.pos||'').toUpperCase()==='DST'?'DEF':String(p.pos||'').toUpperCase();
    if(counts[pos]!==undefined)counts[pos]++;
  });
  // 'mine' is kept as ranked players for bye-week analysis because off-list
  // Sleeper metadata does not reliably include bye week.
  return {mine:fallback.filter(p=>p.rank),allPlayers:fallback,counts,total:fallback.length};
}
function userDraftSlot(){
  if(!sleeperCtx.userId&&!sleeperCtx.rosterId)return null;
  const direct=verifiedDraft?.draft_order?.[sleeperCtx.userId];
  if(direct!=null)return Number(direct);
  const slots=verifiedDraft?.slot_to_roster_id||{};
  for(const [slot,rid] of Object.entries(slots)){
    if(String(rid)===String(sleeperCtx.rosterId))return Number(slot);
  }
  const mine=myRawPicks().find(p=>p.draft_slot);
  return mine?Number(mine.draft_slot):null;
}
function nextUserPickNumber(){
  const teams=Number(verifiedLeague?.total_rosters||8),slot=userDraftSlot();
  if(!slot||!teams)return null;
  const completed=lastDraftPicks.length;
  for(let round=1;round<=30;round++){
    const pick=(round-1)*teams+(round%2===1?slot:(teams-slot+1));
    if(pick>completed)return pick;
  }
  return null;
}
function draftRound(){
  const teams=Number(verifiedLeague?.total_rosters||8);
  return Math.max(1,Math.ceil(currentDraftNumber()/teams));
}
function positionRunSignalForPicks(picks,pos){
  const ordered=(picks||[]).slice().sort((a,b)=>(a.pick_no||0)-(b.pick_no||0));
  const norm=p=>String(p?.metadata?.position||'').toUpperCase();
  const countLast=n=>ordered.slice(-n).filter(p=>norm(p)===pos).length;
  const c4=countLast(4),c5=countLast(5),c7=countLast(7),c8=countLast(8);
  // A run is only actionable while it is still active. If neither of the last
  // two picks was at the position, the burst has cooled and should not keep
  // pushing recommendations upward.
  const recent=countLast(2);
  if(!recent)return null;
  let level='',label='';
  if(c4>=4||c8>=6){level='extreme';label=`${pos} EXTREME • ${c4>=4?`${c4}/4`:`${c8}/8`}`;}
  else if(c7>=5){level='strong';label=`${pos} STRONG • ${c7}/7`;}
  else if(c5>=3||c7>=4){level='mild';label=`${pos} run • ${c5>=3?`${c5}/5`:`${c7}/7`}`;}
  if(!level)return null;
  return {pos,level,label,severity:level==='extreme'?3:level==='strong'?2:1,recent};
}
function detectPositionRuns(){
  const positions=['QB','RB','WR','TE'];
  return positions.map(pos=>positionRunSignalForPicks(lastDraftPicks,pos)).filter(Boolean)
    .sort((a,b)=>b.severity-a.severity||b.recent-a.recent);
}
function byeConcentrationWarning(profile){
  if(profile.mine.length<5)return null;
  const byes={};
  profile.mine.forEach(p=>byes[p.bye]=(byes[p.bye]||0)+1);
  let best=null;
  for(const [bye,count] of Object.entries(byes)){
    const share=count/profile.mine.length;
    if(count>=4||(count>=3&&share>=.40)){
      if(!best||count>best.count)best={bye,count,share};
    }
  }
  return best?`Bye ${best.bye} concentration • ${best.count}/${profile.mine.length} ranked players`:null;
}
function draftPhaseContext(profile=myRosterProfile(),roundOverride=null){
  const rosterSlots=(verifiedLeague?.roster_positions||[]).length||15;
  const total=Number(profile?.total||0);
  const completion=Math.max(0,Math.min(1,total/rosterSlots));
  const round=roundOverride??draftRound();
  const remaining=Math.max(0,rosterSlots-total);
  const endgame=remaining<=3||completion>=.80;
  const phase=endgame?'endgame':completion<.34&&round<=5?'early':completion<.72&&round<=10?'middle':'late';
  return {phase,total,rosterSlots,completion,round,remaining,endgame};
}
function positionSaturation(profile,pos){
  const c=profile?.counts||{},r=draftLineupRequirements(),have=Number(c[pos]||0);
  let soft=0,hard=0;
  if(pos==='QB'){soft=r.QB;hard=r.QB+1;}
  else if(pos==='RB'){soft=r.RB+1;hard=r.RB+3;}
  else if(pos==='WR'){soft=r.WR+1;hard=r.WR+3;}
  else if(pos==='TE'){soft=r.TE>0?r.TE:r.TE+1;hard=r.TE>0?r.TE+2:1;}
  else {soft=1;hard=2;}
  const state=have>=hard?'saturated':have>=soft?'covered':'open';
  const penalty=state==='saturated'?(pos==='QB'||pos==='TE'?-10:-7):state==='covered'?-2:0;
  return {state,have,soft,hard,penalty};
}
function contextualRunBonus(run,profile,pos,roundOverride=null){
  if(!run)return 0;
  const sat=positionSaturation(profile,pos),need=positionNeedState(profile,pos,roundOverride),phase=draftPhaseContext(profile,roundOverride).phase;
  if(sat.state==='saturated'||need.state==='strong')return 0;
  let base=run.severity===3?10:run.severity===2?7:3;

  // In a one-QB league, an early QB burst is market information, not a command
  // to abandon the board. Let the signal grow later if QB is still unfilled.
  if(pos==='QB'&&phase==='early')base=Math.max(1,Math.round(base*.55));

  if(need.state==='desperate'||need.state==='weak')return base;
  if(need.state==='depth')return Math.max(1,Math.round(base*.45));
  return Math.max(0,Math.round(base*.25));
}
function rosterVulnerabilities(){
  const p=myRosterProfile(),c=p.counts,warnings=[];
  const phase=draftPhaseContext(p),r=draftLineupRequirements();
  const eligible=c.RB+c.WR+c.TE,flexFloor=draftFlexStarterFloor();

  // Early in the draft, an unfilled slot is a direction to watch—not yet a
  // vulnerability. Escalate only when the roster has progressed far enough.
  if((phase.phase!=='early'||p.total>=4)&&c.RB===0)warnings.push({level:'danger',text:'RB foundation still empty'});
  else if(p.total>=6&&c.RB<r.RB)warnings.push({level:'warn',text:`Only ${c.RB} RB • RB starter path vulnerable`});

  if(p.total>=5&&c.WR<Math.min(2,r.WR))warnings.push({level:'danger',text:`Only ${c.WR} WR • starter depth vulnerable`});
  else if(p.total>=7&&c.WR<r.WR)warnings.push({level:'warn',text:`WR ${c.WR}/${r.WR} • starter path still uncovered`});

  if(p.total>=Math.max(6,flexFloor-1)&&eligible<flexFloor)
    warnings.push({level:'warn',text:`W/R/T FLEX path ${eligible}/${flexFloor} covered`});

  if((phase.phase==='late'||phase.endgame||phase.round>=7)&&c.QB<r.QB)
    warnings.push({level:phase.endgame?'danger':'warn',text:phase.endgame?'Final rounds • QB still empty':`Round ${phase.round} • QB still empty`});

  const specialistWindow=Math.max(10,phase.rosterSlots-3);
  const specialist=specialistEndgameState(p);
  if(specialist.forced&&specialist.missing.length){
    warnings.push({level:'danger',text:`${phase.remaining} slot${phase.remaining===1?'':'s'} left • reserve for ${specialist.missing.join(' + ')}`});
  }
  if(p.total>=specialistWindow&&c.K<r.K)warnings.push({level:phase.endgame?'danger':'warn',text:phase.endgame?'Final rounds • K still open':'K not yet covered'});
  if(p.total>=specialistWindow&&c.DEF<r.DEF)warnings.push({level:phase.endgame?'danger':'warn',text:phase.endgame?'Final rounds • DEF still open':'DEF not yet covered'});

  const core={QB:c.QB,RB:c.RB,WR:c.WR,TE:c.TE};
  const [maxPos,maxCount]=Object.entries(core).sort((a,b)=>b[1]-a[1])[0];
  if(p.mine.length>=5&&maxCount>=4&&maxCount/p.mine.length>=.60){
    const missing=(c.RB<r.RB?'RB':c.WR<r.WR?'WR':c.QB<r.QB?'QB':'');
    if(missing)warnings.push({level:'warn',text:`Heavy ${maxPos} concentration while ${missing} remains thin`});
  }
  if(phase.phase!=='early'&&p.total>=8&&c.RB<r.RB+1)warnings.push({level:'warn',text:'RB depth vulnerable beyond starters'});
  const bye=byeConcentrationWarning(p);
  if(bye&&phase.phase!=='early')warnings.push({level:'warn',text:bye});
  return warnings.slice(0,5);
}

function samePosAvailable(available,pos){return available.filter(p=>p.pos===pos).slice().sort((a,b)=>a.rank-b.rank);}
function projectedDrop(a,b){if(!a||!b||a.proj==null||b.proj==null)return 0;return Math.max(0,a.proj-b.proj);}
function tierCliffForPlayer(player,available){
  const same=samePosAvailable(available,player.pos),i=same.findIndex(p=>p.rank===player.rank);
  if(i<0)return {severity:0,label:'',rankGap:0,projGap:0};
  const next=same[i+1];
  if(!next)return {severity:3,label:`Last ranked ${player.pos}`,rankGap:99,projGap:99,next:null};
  const rankGap=next.rank-player.rank,projGap=projectedDrop(player,next);
  let severity=0;
  if(rankGap>=18||projGap>=35)severity=3;
  else if(rankGap>=10||projGap>=22)severity=2;
  else if(rankGap>=6||projGap>=12)severity=1;
  return {severity,rankGap,projGap,next,label:severity===3?`Major ${player.pos} cliff`:severity===2?`${player.pos} tier ending`:severity===1?`${player.pos} drop approaching`:''};
}
function positionTierSnapshot(available){
  const out=[];
  for(const pos of ['QB','RB','WR','TE']){
    const same=samePosAvailable(available,pos); if(!same.length)continue;
    const top=same[0],cliff=tierCliffForPlayer(top,available); if(cliff.severity)out.push({pos,top,cliff});
  }
  return out.sort((a,b)=>b.cliff.severity-a.cliff.severity||b.cliff.rankGap-a.cliff.rankGap);
}
function waitRiskForCandidate(candidate,available){
  const current=currentDraftNumber(),nextMine=nextUserPickNumber(),p=candidate.player,cliff=tierCliffForPlayer(p,available);
  let risk=0,reasons=[];
  if(!nextMine){
    return {risk:1,label:'DRAFT SLOT PENDING',reasons:['Sleeper has not resolved your next pick'],cliff};
  }
  if(nextMine<=current){
    return {risk:4,label:'YOU ARE ON THE CLOCK',reasons:['Make your selection now'],cliff};
  }
  const picksAway=nextMine-current;
  if(picksAway===1){
    risk=2;
    reasons.push('one pick before you');
  }else{
    if(p.rank<=nextMine-2){risk+=2;reasons.push('may not survive to your turn');}
    else if(p.rank<=nextMine+4){risk+=1;reasons.push('borderline survival');}
    else reasons.push('likely available later');
  }
  const tierWeight=(candidate.breakdown||[]).find(x=>x.label==='Tier cliff urgency')?.value||0;
  if(tierWeight>=4){risk+=2;reasons.push(cliff.label);}
  else if(tierWeight>=2){risk+=1;reasons.push(cliff.label);}
  if(candidate.needState==='desperate'){risk+=1;reasons.push('fills urgent roster need');}
  if(picksAway<=3)risk+=1;
  risk=Math.min(4,risk);
  let label;
  if(picksAway===1){
    label=risk>=3?'PREPARE TO TAKE':'NEXT PICK — MONITOR';
  }else if(picksAway<=3&&risk>=3){
    label='LEAN TAKE';
  }else{
    label=risk>=3?'HIGH WAIT RISK':risk===2?'LEAN TAKE':risk===1?'WAIT POSSIBLE':'LIKELY SAFE TO WAIT';
  }
  return {risk,label,reasons:reasons.slice(0,2),cliff};
}
function bestAlternativeCandidate(best,allCandidates){
  if(!best)return null;
  return allCandidates.find(x=>x.player.pos!==best.player.pos)||allCandidates[1]||null;
}
function samePositionScarcity(player,available){
  const same=available.filter(p=>p.pos===player.pos).sort((a,b)=>a.rank-b.rank);
  const i=same.findIndex(p=>p.rank===player.rank);
  if(i<0||i===same.length-1)return 4;
  const gap=same[i+1].rank-player.rank;
  return Math.min(12,Math.max(0,(gap-3)*.7));
}


function draftLineupRequirements(){
  const slots=(verifiedLeague?.roster_positions||[]).map(x=>String(x||'').toUpperCase());
  const count=pos=>slots.filter(x=>x===pos).length;
  const flexLabels=new Set(['FLEX','W/R/T','WR/RB/TE','REC_FLEX']);
  const flexSlots=slots.filter(x=>flexLabels.has(x)).length;
  return {
    QB:Math.max(1,count('QB')),
    RB:Math.max(2,count('RB')),
    WR:Math.max(3,count('WR')),
    TE:count('TE'),
    K:Math.max(1,count('K')),
    DEF:Math.max(1,count('DEF')+count('DST')),
    FLEX:flexSlots||1
  };
}
function draftFlexStarterFloor(){
  const r=draftLineupRequirements();
  return r.RB+r.WR+r.TE+r.FLEX;
}
function draftConstructionScore(profile){
  const c=profile.counts||{},total=Number(profile.total||0),r=draftLineupRequirements();
  const rosterSlots=(verifiedLeague?.roster_positions||[]).length||15;
  const completion=Math.max(0,Math.min(1,total/rosterSlots));
  const finished=total>=rosterSlots||isDraftComplete();
  let score=100;

  const missing=(pos,need,penalty,startAt=.30)=>{
    const have=Number(c[pos]||0);
    if(have>=need)return;
    const urgency=finished?1:Math.max(.15,Math.min(1,(completion-startAt)/(1-startAt)));
    score-=(need-have)*penalty*urgency;
  };

  // Required starters are the foundation of roster construction.
  missing('QB',r.QB,15,.38);
  missing('RB',r.RB,18,.24);
  missing('WR',r.WR,18,.24);
  if(r.TE>0)missing('TE',r.TE,14,.36);

  // TE is FLEX-only in UCL. FLEX is therefore judged as a combined RB/WR/TE
  // pool rather than as a hidden mandatory TE requirement.
  const flexHave=Number(c.RB||0)+Number(c.WR||0)+Number(c.TE||0);
  const flexNeed=draftFlexStarterFloor();
  if(flexHave<flexNeed){
    const urgency=finished?1:Math.max(.18,Math.min(1,(completion-.34)/.66));
    score-=(flexNeed-flexHave)*14*urgency;
  }

  // A finished UCL roster should have playable injury/bye depth, especially at
  // the six RB/WR starter-or-flex slots. Depth is rewarded without requiring a
  // specific drafting style.
  if(completion>=.55||finished){
    const rb=Number(c.RB||0),wr=Number(c.WR||0),te=Number(c.TE||0);
    if(rb<r.RB+1)score-=finished?9:5;
    if(wr<r.WR+1)score-=finished?9:5;
    if(rb+wr+te<flexNeed+2)score-=finished?8:4;
    if(rb>=r.RB+2)score+=2;
    if(wr>=r.WR+2)score+=2;
  }

  // K and DEF matter as actual starting slots once the roster is nearly full.
  const remaining=Math.max(0,rosterSlots-total);
  if(remaining<=3||finished){
    missing('K',r.K,10,.72);
    missing('DEF',r.DEF,10,.72);
  }

  // Bench slots have opportunity cost. Multiple low-leverage specialists or
  // excessive QB/TE accumulation can make a roster less flexible even when the
  // individual picks were reasonable values.
  const qbs=Number(c.QB||0),tes=Number(c.TE||0),ks=Number(c.K||0),defs=Number(c.DEF||0);
  if(qbs>=3)score-=6+(qbs-3)*4;
  if(r.TE===0&&tes>=3)score-=5+(tes-3)*3;
  else if(r.TE>0&&tes>=r.TE+3)score-=5;
  if(ks>1)score-=(ks-1)*6;
  if(defs>1)score-=(defs-1)*6;

  // Bye-week clustering is a construction issue rather than a pick-value issue.
  const bye=byeConcentrationForPlayers(profile.mine||[]);
  if(bye&&total>=10)score-=5;

  return Math.max(35,Math.min(100,Math.round(score)));
}

function draftTeamStrengthScore(picks){
  if(!week1ProjectionData||!Array.isArray(picks)||!picks.length)return null;
  const mine=projectedLineupForPicks(picks);
  if(!mine.projected)return null;

  const league=(leagueRosters||[]).map(r=>projectedLineupForPicks(picksForRoster(r.roster_id)))
    .filter(x=>x.projected&&x.starterPts>0);
  if(!league.length)return null;
  const vals=league.map(x=>x.starterPts),hi=Math.max(...vals),lo=Math.min(...vals);
  const relative=hi===lo?90:72+24*((mine.starterPts-lo)/(hi-lo));
  const completeness=Math.max(0,9-mine.missing)/9;

  // Starter projection is the primary signal. A small depth adjustment rewards
  // usable projected bench scoring without allowing a large bench to overpower
  // a weak starting lineup.
  const benchVals=league.map(x=>x.benchPts),benchHi=Math.max(...benchVals),benchLo=Math.min(...benchVals);
  const benchRelative=benchHi===benchLo?85:72+18*((mine.benchPts-benchLo)/(benchHi-benchLo));
  const score=(relative*.88+benchRelative*.12)*completeness;
  return Math.max(45,Math.min(100,Math.round(score)));
}
function positionNeedState(profile,pos,roundOverride=null){
  const c=profile.counts,total=profile.total,r=draftLineupRequirements(),ctx=draftPhaseContext(profile,roundOverride),phase=ctx.phase;
  if(pos==='QB'){
    if(c.QB<r.QB){
      const bonus=phase==='early'?10:phase==='middle'?14:phase==='late'?19:26;
      return {state:'desperate',bonus,label:`QB ${c.QB}/${r.QB}`};
    }
    if(c.QB===r.QB&&total>=10)return {state:'depth',bonus:phase==='endgame'?-4:1,label:'QB covered'};
    return {state:'strong',bonus:phase==='endgame'?-7:-2,label:'QB covered'};
  }
  if(pos==='RB'){
    if(c.RB<r.RB){
      const bonus=(c.RB===0?24:20)+(phase==='endgame'?8:phase==='late'?3:0);
      return {state:'desperate',bonus,label:`RB ${c.RB}/${r.RB}`};
    }
    if(c.RB===r.RB)return {state:'weak',bonus:phase==='early'?6:phase==='middle'?9:phase==='late'?11:13,label:'starters covered, no depth'};
    if(c.RB===r.RB+1)return {state:'depth',bonus:phase==='early'?3:phase==='middle'?5:phase==='late'?6:5,label:'RB depth useful'};
    if(c.RB>=r.RB+3)return {state:'strong',bonus:phase==='endgame'?-10:-5,label:'RB already strong'};
    return {state:'depth',bonus:phase==='early'?1:phase==='endgame'?0:2,label:'RB depth'};
  }
  if(pos==='WR'){
    if(c.WR<r.WR){
      const bonus=(c.WR<=1?22:18)+(phase==='endgame'?8:phase==='late'?3:0);
      return {state:'desperate',bonus,label:`WR ${c.WR}/${r.WR}`};
    }
    if(c.WR===r.WR)return {state:'weak',bonus:phase==='early'?6:phase==='middle'?8:phase==='late'?10:12,label:'starters covered, no depth'};
    if(c.WR===r.WR+1)return {state:'depth',bonus:phase==='early'?3:phase==='middle'?4:phase==='late'?5:4,label:'WR depth useful'};
    if(c.WR>=r.WR+3)return {state:'strong',bonus:phase==='endgame'?-10:-5,label:'WR already strong'};
    return {state:'depth',bonus:phase==='early'?1:phase==='endgame'?0:2,label:'WR depth'};
  }
  if(pos==='TE'){
    const flexEligible=c.RB+c.WR+c.TE;
    if(r.TE>0&&c.TE<r.TE)return {state:'desperate',bonus:18+(phase==='endgame'?7:0),label:`TE ${c.TE}/${r.TE}`};
    if(r.TE===0){
      if(flexEligible<draftFlexStarterFloor()&&c.TE===0)return {state:'weak',bonus:phase==='endgame'?4:6,label:'optional FLEX path'};
      if(c.TE===0)return {state:'depth',bonus:phase==='endgame'?-2:1,label:'optional FLEX depth'};
      return {state:'strong',bonus:phase==='endgame'?-24:-18,label:'TE is FLEX-only and already covered'};
    }
    if(c.TE===r.TE)return {state:'depth',bonus:phase==='endgame'?-2:3,label:'TE depth useful'};
    if(c.TE>=r.TE+2)return {state:'strong',bonus:phase==='endgame'?-10:-5,label:'TE already strong'};
    return {state:'depth',bonus:phase==='endgame'?-2:0,label:'TE covered'};
  }
  return {state:'depth',bonus:0,label:''};
}
function flexNeedBonus(profile,pos){
  const c=profile.counts;
  const eligible=c.RB+c.WR+c.TE;
  const floor=draftFlexStarterFloor();
  if(!['RB','WR','TE'].includes(pos))return {bonus:0,label:''};
  if(eligible<floor)return {bonus:8,label:'FLEX still uncovered'};
  if(eligible===floor)return {bonus:0,label:''};
  return {bonus:0,label:''};
}
function rosterStrengthPenalty(profile,pos){
  const c=profile.counts,sat=positionSaturation(profile,pos);
  let penalty=sat.penalty;
  if(pos==='RB'&&c.RB>=5)penalty=Math.min(penalty,-7);
  if(pos==='WR'&&c.WR>=6)penalty=Math.min(penalty,-7);
  if(pos==='TE'&&c.TE>=2)penalty=Math.min(penalty,-10);
  if(pos==='QB'&&c.QB>=2)penalty=Math.min(penalty,-10);
  return penalty;
}
function candidateFit(player,available,runs,profileOverride=null,contextOverride=null){
  const profile=profileOverride||myRosterProfile();
  const current=contextOverride?.current??currentDraftNumber();
  const nextMine=contextOverride?.nextMine??nextUserPickNumber();
  const round=contextOverride?.round??draftRound();
  let score=100;
  const reasons=[],breakdown=[{label:'Base recommendation score',value:100}];
  const add=(label,value,reason='')=>{
    if(!value)return;
    score+=value;
    breakdown.push({label,value});
    if(reason)reasons.push(reason);
  };

  const boardAdj=player.rank>current
    ?-Math.min(50,(player.rank-current)*.65)
    :Math.min(10,(current-player.rank)*.22);
  add('Board value vs. current pick',boardAdj);

  const need=positionNeedState(profile,player.pos,contextOverride?.round??null);
  add('Roster position need',need.bonus,need.label);

  const flex=flexNeedBonus(profile,player.pos);
  add('FLEX construction',flex.bonus,flex.label);

  const strengthPenalty=rosterStrengthPenalty(profile,player.pos);
  add('Already strong at position',strengthPenalty);

  const saturation=positionSaturation(profile,player.pos);
  const scarcityRaw=samePositionScarcity(player,available);
  const scarcity=saturation.state==='saturated'?Math.round(scarcityRaw*.25):saturation.state==='covered'?Math.round(scarcityRaw*.65):scarcityRaw;
  add('Positional scarcity',scarcity,scarcity>=5?'scarcity':'');

  const run=runs.find(r=>r.pos===player.pos);
  if(run){
    const bonus=contextualRunBonus(run,profile,player.pos,round);
    add('Active position run',bonus,bonus?`${run.level} ${player.pos} run`:'');
  }

  if(nextMine&&nextMine>current){
    const gap=nextMine-current;
    if(player.rank<=nextMine-2)add('Next-pick availability risk',8,'unlikely to reach next pick');
    else if(player.rank<=nextMine+4)add('Next-pick availability risk',3,'borderline availability');
    else if(player.rank>nextMine+14)add('Likely available later',-5);

    if(gap<=3&&need.state==='desperate')add('Urgent need near your turn',6);
    if(gap<=3&&need.state==='strong')add('Strong position near your turn',-3);
  }

  const c=profile.counts;
  const phaseCtx=draftPhaseContext(profile,round);
  const specialist=specialistEndgameState(profile);
  if(specialist.urgent){
    if(specialist.missing.includes(player.pos))add('Required specialist slot',specialist.forced?28:14,'required final roster slot');
    else if(!specialist.forced)add('Protect final specialist slot',-6);
  }
  if(phaseCtx.endgame){
    const r=draftLineupRequirements();
    const missingCore=(c.QB<r.QB)||(c.RB<r.RB)||(c.WR<r.WR)||(r.TE>0&&c.TE<r.TE);
    const fillsMissing=
      (player.pos==='QB'&&c.QB<r.QB)||
      (player.pos==='RB'&&c.RB<r.RB)||
      (player.pos==='WR'&&c.WR<r.WR)||
      (player.pos==='TE'&&r.TE>0&&c.TE<r.TE);
    if(fillsMissing)add('Endgame starter completion',12,'starter slot still open');
    else if(missingCore&&['QB','RB','WR','TE'].includes(player.pos))add('Endgame redundant depth',-7);
    else if(!missingCore&&['RB','WR'].includes(player.pos)&&positionSaturation(profile,player.pos).state!=='saturated')
      add('Endgame bench upside',3,'bench upside');
  }
  if(round>=6&&player.pos==='QB'&&c.QB===0)add('Late QB urgency',7,'late QB urgency');
  if(round>=7&&player.pos==='RB'&&c.RB<2)add('Late RB starter urgency',8,'late RB starter need');
  if(round>=7&&player.pos==='WR'&&c.WR<3)add('Late WR starter urgency',8,'late WR starter need');

  const cliff=tierCliffForPlayer(player,available);
  const cliffScale=saturation.state==='saturated'?.25:saturation.state==='covered'?.65:1;
  if(cliff.severity===3)add('Tier cliff urgency',Math.round(6*cliffScale),cliffScale>=.65?cliff.label:'');
  else if(cliff.severity===2)add('Tier cliff urgency',Math.round(4*cliffScale),cliffScale>=.65?cliff.label:'');
  else if(cliff.severity===1)add('Tier cliff urgency',Math.round(2*cliffScale),cliffScale>=.65?cliff.label:'');

  const s=ps(player.rank);
  if(s.target)add('Your Target flag',4,'your target');
  if(s.sleeper)add('Your Sleeper flag',1);
  if(s.avoid)add('Your Avoid flag',-100);

  return {
    player,
    score:Math.round(score),
    reasons:reasons.slice(0,4),
    needState:need.state,
    needLabel:need.label,
    breakdown:breakdown.map(x=>({...x,value:Math.round(x.value*10)/10}))
  };
}


function recommendationDriverText(candidate,item){
  const label=String(item?.label||''),value=Number(item?.value||0),p=candidate?.player||{};
  if(!value)return '';
  if(label==='Roster position need')return candidate.needLabel||`${p.pos} roster need`;
  if(label==='FLEX construction')return 'fills an open FLEX path';
  if(label==='Positional scarcity')return value>=5?`${p.pos} depth thins quickly`:`some ${p.pos} scarcity`;
  if(label==='Active position run')return value>=3?`active ${p.pos} run adds pressure`:`recent ${p.pos} activity`;
  if(label==='Next-pick availability risk')return value>=6?'meaningful risk before your next pick':'could go before your next pick';
  if(label==='Likely available later')return 'board suggests waiting may be possible';
  if(label==='Urgent need near your turn')return 'urgent roster need near your turn';
  if(label==='Strong position near your turn')return 'already well covered at this position';
  if(label==='Late QB urgency')return 'QB remains open late';
  if(label==='Late RB starter urgency')return 'RB starter remains open late';
  if(label==='Late WR starter urgency')return 'WR starter remains open late';
  if(label==='Tier cliff urgency')return value>=4?`${p.pos} tier is close to ending`:`minor ${p.pos} tier pressure`;
  if(label==='Your Target flag')return 'marked as your Target';
  if(label==='Your Sleeper flag')return 'marked as your Sleeper';
  if(label==='Already strong at position')return 'roster is already strong here';
  if(label==='Board value vs. current pick'){
    if(value>=5)return 'strong value versus the current pick';
    if(value>0)return 'board value supports the pick';
    if(value<=-12)return 'custom list says this is early';
    if(value<=-4)return 'slightly ahead of the custom list';
  }
  return '';
}
function recommendationExplanation(candidate,limit=3){
  if(!candidate)return [];
  const items=(candidate.breakdown||[]).filter(x=>x.label!=='Base recommendation score'&&Number(x.value)!==0);
  const positives=items.filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
  const negatives=items.filter(x=>x.value<0).sort((a,b)=>a.value-b.value);
  const out=[];
  for(const item of positives){
    const txt=recommendationDriverText(candidate,item);
    if(txt&&!out.includes(txt))out.push(txt);
    if(out.length>=limit)break;
  }
  // Surface material pushback when it actually matters; don't bury a large board penalty.
  const materialNegative=negatives.find(x=>x.value<=-4);
  if(materialNegative){
    const txt=recommendationDriverText(candidate,materialNegative);
    if(txt&&!out.includes(txt)){
      if(out.length>=limit&&materialNegative.value<=-8)out[out.length-1]=txt;
      else if(out.length<limit)out.push(txt);
    }
  }
  if(!out.length){
    const board=items.find(x=>x.label==='Board value vs. current pick');
    const txt=recommendationDriverText(candidate,board);
    out.push(txt||'custom list value is the main driver');
  }
  return out.slice(0,limit);
}
function recommendationExplanationText(candidate,limit=3){return recommendationExplanation(candidate,limit).join(' • ');}
function tierWatchForRoster(available,profile=myRosterProfile()){
  const tiers=positionTierSnapshot(available);
  if(!tiers.length)return {tier:null,suppressed:0};
  const meaningful=tiers.filter(x=>{
    const sat=positionSaturation(profile,x.pos);
    const need=positionNeedState(profile,x.pos);
    return sat.state!=='saturated'&&(need.state==='desperate'||need.state==='weak'||need.state==='depth');
  });
  return {tier:meaningful[0]||null,suppressed:tiers.length-meaningful.length};
}


function samePositionRankAuthority(a,b){
  if(!a||!b||a.player.pos!==b.player.pos)return false;
  const rankGap=Math.abs(a.player.rank-b.player.rank);
  const projGap=Math.abs((a.player.proj||0)-(b.player.proj||0));
  // Within a position, source ranking is normally authoritative.
  // Only allow a lower-ranked player to jump when the projection gap is truly meaningful
  // or when the higher-ranked player is explicitly marked Avoid.
  const higher=a.player.rank<b.player.rank?a:b;
  const lower=a.player.rank<b.player.rank?b:a;
  const higherAvoid=!!ps(higher.player.rank).avoid;
  if(higherAvoid)return false;
  if(projGap>=18)return false;
  return rankGap<=18;
}
function stabilizeSamePositionOrder(candidates){
  const arr=candidates.slice();
  const byPos={};
  arr.forEach(c=>(byPos[c.player.pos]??=[]).push(c));
  for(const pos of Object.keys(byPos)){
    const ranked=byPos[pos].slice().sort((a,b)=>a.player.rank-b.player.rank);
    for(let i=0;i<ranked.length;i++){
      for(let j=i+1;j<ranked.length;j++){
        const higher=ranked[i],lower=ranked[j];
        if(!samePositionRankAuthority(higher,lower))continue;
        const hi=arr.indexOf(higher),lo=arr.indexOf(lower);
        if(lo<hi){
          arr.splice(lo,1);
          const newHi=arr.indexOf(higher);
          arr.splice(newHi+1,0,lower);
        }
      }
    }
  }
  return arr;
}


function recommendationRankLeeway(candidate){
  if(candidate.needState==='desperate')return 18;
  if(candidate.needState==='weak')return 11;
  if(candidate.needState==='depth')return 7;
  return 4;
}
function stabilizeOverallBoardOrder(candidates){
  const arr=candidates.slice();
  let moved=true,passes=0;
  while(moved&&passes++<arr.length){
    moved=false;
    for(let i=0;i<arr.length;i++){
      const lower=arr[i];
      for(let j=i+1;j<arr.length;j++){
        const higher=arr[j];
        if(higher.player.rank>=lower.player.rank)continue;
        const gap=lower.player.rank-higher.player.rank;
        const higherAvoid=!!ps(higher.player.rank).avoid;
        if(higherAvoid)continue;
        const lowerLeeway=recommendationRankLeeway(lower);
        const specialNeed=lower.needState==='desperate'&&higher.needState==='strong'&&gap<=24;
        const majorCliff=(lower.breakdown||[]).some(x=>x.label==='Tier cliff urgency'&&x.value>=6)&&gap<=18;
        if(gap>lowerLeeway&&!specialNeed&&!majorCliff){
          // Promote the higher-ranked board player ahead of the lower-ranked
          // recommendation. The previous implementation removed/reinserted
          // `lower`, which left the order unchanged.
          arr.splice(j,1);
          arr.splice(i,0,higher);
          moved=true;
          break;
        }
      }
      if(moved)break;
    }
  }
  return arr;
}

function specialistEndgameState(profile=myRosterProfile()){
  const r=draftLineupRequirements(),ctx=draftPhaseContext(profile);
  const c=profile?.counts||{};
  const missing=[];
  if(r.K>0&&Number(c.K||0)<r.K)missing.push('K');
  if(r.DEF>0&&Number(c.DEF||0)<r.DEF)missing.push('DEF');
  const missingSlots=missing.reduce((sum,pos)=>sum+Math.max(0,Number(r[pos]||0)-Number(c[pos]||0)),0);
  return {
    ...ctx,
    missing,
    missingSlots,
    forced:ctx.remaining>0&&missingSlots>=ctx.remaining,
    urgent:ctx.remaining>0&&missingSlots>0&&ctx.remaining<=missingSlots+1
  };
}

function recommendationEligiblePlayer(player,profile=myRosterProfile()){
  const req=draftLineupRequirements();
  if(player?.pos==='TE'&&req.TE===0&&Number(profile.counts?.TE||0)>=1)return false;

  // If every remaining roster slot is already needed for required K/DEF spots,
  // stop recommending another skill player simply because the custom ranking
  // list does not contain specialists.
  const specialist=specialistEndgameState(profile);
  if(specialist.forced&&!specialist.missing.includes(player?.pos))return false;
  return true;
}
function bestAvailableForMe(limit=3,profileOverride=null,excludeRank=null){
  const profile=profileOverride||myRosterProfile();
  const available=PLAYERS.filter(p=>ps(p.rank).draft==='available'&&!ps(p.rank).avoid&&p.rank!==excludeRank&&recommendationEligiblePlayer(p,profile));
  const runs=detectPositionRuns();
  const scored=available.map(p=>candidateFit(p,available,runs,profile))
    .sort((a,b)=>b.score-a.score||a.player.rank-b.player.rank);
  const samePosStable=stabilizeSamePositionOrder(scored);
  return stabilizeOverallBoardOrder(samePosStable).slice(0,limit);
}


function strategyStorageSuffix(){
  return String(sleeperCtx.rosterId||sleeperCtx.username||'unselected').replace(/[^a-zA-Z0-9_-]/g,'_');
}
function strategyHistoryKey(){return `${KEY}-strategy-history-v2-${strategyStorageSuffix()}`;}
function strategySnapshotKey(){return `${KEY}-strategy-snapshots-v2-${strategyStorageSuffix()}`;}
function loadStrategyHistory(){
  return storageGetJson(strategyHistoryKey(),[])||[];
}
function saveStrategyHistory(rows){storageSetJson(strategyHistoryKey(),rows||[]);}
function loadStrategySnapshots(){
  return storageGetJson(strategySnapshotKey(),{})||{};
}
function saveStrategySnapshots(obj){storageSetJson(strategySnapshotKey(),obj||{});}
function captureRecommendationSnapshot(best){
  if(!sleeperCtx.rosterId||!best?.length)return;
  const pickNo=nextUserPickNumber();
  const current=currentDraftNumber();
  if(!pickNo||pickNo<current)return;
  const snapshots=loadStrategySnapshots();
  snapshots[String(pickNo)]={
    pickNo,
    capturedAt:new Date().toISOString(),
    currentPick:current,
    candidates:best.slice(0,12).map((x,i)=>({
      order:i+1,rank:x.player.rank,name:x.player.name,pos:x.player.pos,score:x.score,
      needState:x.needState,reasons:recommendationExplanation(x,4)
    }))
  };
  saveStrategySnapshots(snapshots);
}
function finalizeStrategyHistory(){
  if(!sleeperCtx.rosterId)return;
  const history=loadStrategyHistory(),snapshots=loadStrategySnapshots();
  const seen=new Set(history.map(x=>String(x.pickNo)));
  let changed=false;
  for(const pick of myRawPicks()){
    const pickNo=Number(pick.pick_no||0);
    if(!pickNo||seen.has(String(pickNo)))continue;
    const snap=snapshots[String(pickNo)]||null;
    const ranked=playerFromPick(pick);
    const actualName=ranked?.name||sleeperPickName(pick)||String(pick.player_id||'Unknown Sleeper Player');
    const actualRank=ranked?.rank||null;
    const actualPos=String(pick?.metadata?.position||ranked?.pos||'').toUpperCase();
    const candidates=snap?.candidates||[];
    const exactIndex=candidates.findIndex(c=>actualRank?c.rank===actualRank:normName(c.name)===normName(actualName));
    history.push({
      pickNo,
      pickLabel:pickLabel(pick),
      actualName,
      actualRank,
      actualPos,
      recommended:candidates.slice(0,3),
      topRank:candidates[0]?.rank||null,
      topName:candidates[0]?.name||null,
      outcome:exactIndex===0?'top1':exactIndex>=0&&exactIndex<3?'top3':exactIndex>=3?'other-rec':'miss',
      recommendationPosition:exactIndex>=0?exactIndex+1:null,
      snapshotCapturedAt:snap?.capturedAt||null
    });
    seen.add(String(pickNo)); changed=true;
  }
  if(changed){
    history.sort((a,b)=>a.pickNo-b.pickNo);
    saveStrategyHistory(history);
  }
  return history;
}
function strategyHistoryStats(){
  // Rendering/reporting is read-only. Completed picks are finalized by the
  // explicit Sleeper sync path, never by opening Report Card.
  const rows=loadStrategyHistory();
  const tracked=rows.filter(x=>x.recommended?.length);
  const top1=tracked.filter(x=>x.outcome==='top1').length;
  const top3=tracked.filter(x=>x.outcome==='top1'||x.outcome==='top3').length;
  return {
    rows,tracked:tracked.length,top1,top3,
    top1Pct:tracked.length?Math.round(top1/tracked.length*100):null,
    top3Pct:tracked.length?Math.round(top3/tracked.length*100):null
  };
}
function renderStrategyHistory(){
  const list=$('#strategyHistoryList');if(!list)return;
  const s=strategyHistoryStats();
  $('#strategyTopHit').textContent=s.top1Pct==null?'—':`${s.top1Pct}%`;
  $('#strategyTop3Hit').textContent=s.top3Pct==null?'—':`${s.top3Pct}%`;
  $('#strategyTracked').textContent=s.tracked;
  $('#strategyHistoryCopy').textContent=s.tracked
    ?`The app's #1 recommendation matched ${s.top1} of ${s.tracked} tracked picks; ${s.top3} selections came from the recommended top three.`
    :'The app will record what it recommended before each of your Sleeper picks and compare that with what you actually drafted.';
  list.innerHTML=s.rows.length?s.rows.map(x=>{
    const cls=x.outcome==='top1'?'hit':x.outcome==='top3'?'top3':'miss';
    const rec=x.recommended?.[0];
    const outcome=x.outcome==='top1'?'Matched #1 recommendation':x.outcome==='top3'?`Selected recommendation #${x.recommendationPosition}`:x.outcome==='other-rec'?`Selected recommendation #${x.recommendationPosition}`:'Went another direction';
    return `<div class="strategy-history-item ${cls}">
      <div class="strategy-pick">${esc(x.pickLabel||`#${x.pickNo}`)}</div>
      <b>${esc(x.actualName)}${x.actualRank?` • List #${x.actualRank}`:' • NR'}</b>
      <small>${esc(outcome)}${rec?` • App #1: ${esc(rec.name)} (#${rec.rank})`:''}</small>
    </div>`;
  }).join(''):'<div class="intel-muted">No picks tracked yet.</div>';
}
function renderPostDraftStrategyReview(g){
  const s=strategyHistoryStats();
  const el=$('#reportStrategySummary');if(!el)return;
  $('#reportStrategyTop1').textContent=s.top1Pct==null?'—':`${s.top1Pct}%`;
  $('#reportStrategyTop3').textContent=s.top3Pct==null?'—':`${s.top3Pct}%`;
  $('#reportStrategyTracked').textContent=s.tracked;
  $('#reportStrategyGrade').textContent=g?.letter||'—';
  el.textContent=s.tracked?`${s.tracked} selections compared with live recommendations`:'No recommendation history captured';
  let copy='';
  if(!s.tracked)copy='No pre-pick recommendation snapshots were available for this draft.';
  else if(s.top3Pct>=75)copy=`Your actual draft stayed close to the app's board: ${s.top3Pct}% of tracked selections came from its top three recommendations.`;
  else if(s.top3Pct>=45)copy=`Your draft partially followed the app's advice: ${s.top3Pct}% of tracked selections were inside its top three, with several independent choices mixed in.`;
  else copy=`You frequently departed from the recommendation engine: only ${s.top3Pct}% of tracked selections came from its top three.`;
  if(g?.letter)copy+=` The finished roster received a ${g.letter} overall draft grade, which provides context for how those decisions worked together.`;
  $('#reportStrategyCopy').textContent=copy;
}
function currentPickText(){
  const teams=Number(verifiedLeague?.total_rosters||8);
  const current=currentDraftNumber();
  const round=Math.max(1,Math.ceil(current/teams));
  const within=((current-1)%teams)+1;
  return `${round}.${String(within).padStart(2,'0')} • #${current}`;
}
function updatePickFocus(){
  const bar=$('#pickFocus'),mobile=$('#mobileLiveBar');
  if(!bar)return;
  const current=currentDraftNumber(),next=nextUserPickNumber(),top=bestAvailableForMe(1)[0]||null;
  const currentText=lastDraftPicks.length?currentPickText():'Pre-draft';
  $('#currentPickFocus').textContent=currentText;
  if($('#mobilePick'))$('#mobilePick').textContent=currentText.replace(' • ',' / ');

  bar.classList.remove('on-clock','soon');
  if(mobile)mobile.classList.remove('on-clock','soon');

  let turnText='Select team';
  if(!sleeperCtx.username){
    turnText='Select team';
  }else if(next==null){
    turnText='Slot pending';
  }else if(next<=current){
    turnText='ON CLOCK';
    bar.classList.add('on-clock');
    if(mobile)mobile.classList.add('on-clock');
  }else{
    const away=next-current;
    turnText=away===1?'NEXT':`IN ${away}`;
    if(away<=3){
      bar.classList.add('soon');
      if(mobile)mobile.classList.add('soon');
    }
  }
  $('#yourTurnFocus').textContent=turnText==='ON CLOCK'?'YOU ARE ON THE CLOCK':turnText==='NEXT'?'Next pick':turnText.startsWith('IN ')?`In ${turnText.slice(3)} picks`:turnText;
  if($('#mobileTurn'))$('#mobileTurn').textContent=turnText;

  const recText=top?`#${top.player.rank} ${top.player.name}`:'—';
  $('#recommendFocus').textContent=recText;
  if($('#mobileRec'))$('#mobileRec').textContent=recText;

  document.querySelectorAll('[data-r],[data-rec-rank]').forEach(el=>el.classList.remove('recommended-now','recommended-soon'));
  if(top){
    const cls=bar.classList.contains('on-clock')?'recommended-now':bar.classList.contains('soon')?'recommended-soon':'';
    if(cls){
      document.querySelectorAll(`[data-r="${top.player.rank}"],[data-rec-rank="${top.player.rank}"]`).forEach(el=>el.classList.add(cls));
    }
  }
}

function profileAfterTaking(player){
  const base=myRosterProfile();
  const counts={...base.counts};
  if(counts[player.pos]!==undefined)counts[player.pos]++;
  return {...base,counts,total:base.total+1};
}
function mostVulnerableNeed(profile){
  const c=profile.counts,r=draftLineupRequirements(),needs=[];
  if(c.QB<r.QB)needs.push({label:`QB starter (${c.QB}/${r.QB})`,severity:4});
  if(c.RB<r.RB)needs.push({label:`RB starter (${c.RB}/${r.RB})`,severity:5});
  else if(c.RB<r.RB+1)needs.push({label:'RB depth',severity:2});
  if(c.WR<r.WR)needs.push({label:`WR starter (${c.WR}/${r.WR})`,severity:5});
  else if(c.WR<r.WR+1)needs.push({label:'WR depth',severity:2});
  if(r.TE>0&&c.TE<r.TE)needs.push({label:`TE starter (${c.TE}/${r.TE})`,severity:4});
  if(c.RB+c.WR+c.TE<draftFlexStarterFloor())needs.push({label:'FLEX path',severity:4});
  if(draftRound()>=10&&c.K<r.K)needs.push({label:'K',severity:1});
  if(draftRound()>=10&&c.DEF<r.DEF)needs.push({label:'DEF',severity:1});
  return needs.sort((a,b)=>b.severity-a.severity)[0]?.label||'No major need';
}
function solvedNeedLabel(before,after,player){
  const b=positionNeedState(before,player.pos),a=positionNeedState(after,player.pos);
  if(b.state==='desperate'&&a.state!=='desperate')return `${player.pos} starter need improved`;
  if(b.state==='weak'&&['depth','strong'].includes(a.state))return `${player.pos} weakness improved`;
  if(player.pos==='RB'&&before.counts.RB<2&&after.counts.RB>=2)return 'RB starters covered';
  if(player.pos==='WR'&&before.counts.WR<3&&after.counts.WR>=3)return 'WR starters covered';
  if(player.pos==='QB'&&before.counts.QB<1&&after.counts.QB>=1)return 'QB starter covered';
  const beforeFlex=before.counts.RB+before.counts.WR+before.counts.TE;
  const afterFlex=after.counts.RB+after.counts.WR+after.counts.TE;
  if(beforeFlex<draftFlexStarterFloor()&&afterFlex>=draftFlexStarterFloor())return 'FLEX path covered';
  return b.label||`${player.pos} depth added`;
}
function survivalLabel(candidate){
  const current=currentDraftNumber(),next=nextUserPickNumber();
  if(!next)return 'Next pick unknown';
  if(next<=current)return 'You are on the clock';
  if(candidate.player.rank<=next-2)return 'High risk before next pick';
  if(candidate.player.rank<=next+4)return 'Could go before next pick';
  return 'Likely to remain available';
}
function whatIfForCandidate(candidate,available){
  const before=myRosterProfile(),after=profileAfterTaking(candidate.player);
  const cliff=tierCliffForPlayer(candidate.player,available);
  return {
    candidate,
    solved:solvedNeedLabel(before,after,candidate.player),
    vulnerable:mostVulnerableNeed(after),
    tier:((candidate.breakdown||[]).find(x=>x.label==='Tier cliff urgency')?.value||0)>=4?cliff.label:
      ((candidate.breakdown||[]).find(x=>x.label==='Tier cliff urgency')?.value||0)>=2?'Minor tier pressure':'No meaningful tier pressure for your roster',
    survival:survivalLabel(candidate)
  };
}
function openWhatIfPreview(rank){
  const player=PLAYERS.find(p=>p.rank===Number(rank));if(!player)return;
  const whatIfDialog=$('#whatIfDialog');
  if(whatIfDialog)whatIfDialog.dataset.rank=String(player.rank);
  const available=PLAYERS.filter(p=>ps(p.rank).draft==='available'&&!ps(p.rank).avoid);
  const runs=detectPositionRuns();
  const candidate=candidateFit(player,available,runs);
  const w=whatIfForCandidate(candidate,available);
  const after=profileAfterTaking(player);
  const next=bestAvailableForMe(3,after,player.rank);
  $('#whatIfTitle').textContent=`Take ${player.name}?`;
  $('#whatIfSolved').textContent=w.solved;
  $('#whatIfWeakness').textContent=w.vulnerable;
  $('#whatIfTier').textContent=w.tier;
  $('#whatIfNext').innerHTML=next.length?next.map((x,i)=>`<div class="whatif-next-row"><span class="n">${i+1}</span><div><b>#${x.player.rank} ${esc(x.player.name)}</b><small>${esc(x.player.posRank)} • ${esc(x.player.team)}${recommendationExplanation(x,2).length?` • ${esc(recommendationExplanationText(x,2))}`:''}</small></div><span class="score">${x.score}</span></div>`).join(''):'<div class="intel-muted">No ranked alternatives available.</div>';
  $('#whatIfDialog').showModal();
}


function recommendationAudit(best,allBest){
  const issues=[];
  if(!best.length)return [{kind:'good',text:'No recommendation available to audit'}];

  // 1) Same-position inversion check.
  for(const c of best){
    const higher=PLAYERS.filter(p=>p.pos===c.player.pos&&p.rank<c.player.rank&&ps(p.rank).draft==='available'&&!ps(p.rank).avoid)
      .sort((a,b)=>a.rank-b.rank)[0];
    if(higher){
      const higherC=allBest.find(x=>x.player.rank===higher.rank);
      if(higherC && allBest.indexOf(c)<allBest.indexOf(higherC)){
        issues.push({kind:'bad',text:`${c.player.name} jumped higher-ranked ${higher.name}`});
      }
    }
  }

  // 2) Dominant bonus check.
  for(const c of best){
    const extras=(c.breakdown||[]).filter(x=>x.label!=='Base recommendation score');
    const max=extras.slice().sort((a,b)=>Math.abs(b.value)-Math.abs(a.value))[0];
    const positive=extras.filter(x=>x.value>0).reduce((s,x)=>s+x.value,0);
    if(max&&max.value>0&&positive>0&&max.value/positive>=.58&&max.value>=12){
      issues.push({kind:'warn',text:`${c.player.name}: ${max.label} drives ${Math.round(max.value/positive*100)}% of bonuses`});
    }
  }

  // 3) Need-state contradiction.
  const profile=myRosterProfile();
  for(const c of best){
    const expected=positionNeedState(profile,c.player.pos);
    if(expected.state!==c.needState){
      issues.push({kind:'bad',text:`${c.player.name}: need-state mismatch (${c.needState} vs ${expected.state})`});
    }
  }

  // 4) Tier bonus overpowering board order across same position.
  for(const c of best){
    const tier=(c.breakdown||[]).find(x=>x.label==='Tier cliff urgency')?.value||0;
    const board=(c.breakdown||[]).find(x=>x.label==='Board value vs. current pick')?.value||0;
    if(tier>=6&&board<=-10){
      issues.push({kind:'warn',text:`${c.player.name}: tier bonus may be masking weak board value`});
    }
  }

  if(!issues.length)issues.push({kind:'good',text:'No suspicious recommendation logic detected'});
  return issues.slice(0,6);
}

function playerResearchUrls(player){
  const name=player.name;
  return {
    fantasypros:`https://www.fantasypros.com/nfl/players/${fantasyProsSlug(name)}.php`,
    rotowire:`https://www.google.com/search?q=${encodeURIComponent(`site:rotowire.com/football/player "${name}"`)}`,
    pfr:`https://www.pro-football-reference.com/search/search.fcgi?search=${encodeURIComponent(name)}`
  };
}
function compareResearchUrls(players){
  const names=players.map(x=>x.player.name).filter(Boolean);
  const joined=names.join(' vs ');
  return {
    fantasypros:`https://www.google.com/search?q=${encodeURIComponent(`site:fantasypros.com ${joined} fantasy football 2026 PPR`)}`,
    rotowire:`https://www.google.com/search?q=${encodeURIComponent(`site:rotowire.com ${joined} fantasy football 2026`)}`,
    general:`https://www.google.com/search?q=${encodeURIComponent(`${joined} fantasy football 2026 PPR comparison`)}`
  };
}
function renderQuickResearch(best){
  const grid=$('#quickResearchGrid'),row=$('#quickCompareRow');
  if(!grid||!row)return;
  grid.innerHTML=best.map(x=>{
    const u=playerResearchUrls(x.player);
    return `<div class="quick-research-card">
      <div class="quick-research-name">#${x.player.rank} ${esc(x.player.name)}</div>
      <div class="quick-research-links">
        <a href="${u.fantasypros}" target="_blank" rel="noopener noreferrer" title="FantasyPros player page">FantasyPros ↗</a>
        <a href="${u.rotowire}" target="_blank" rel="noopener noreferrer" title="Find current RotoWire news and role analysis">RotoWire ↗</a>
        <a href="${u.pfr}" target="_blank" rel="noopener noreferrer" title="Pro Football Reference stats and game logs">PFR ↗</a>
      </div>
    </div>`;
  }).join('') || '<span class="intel-muted">No players to research.</span>';

  if(best.length>=2){
    const c=compareResearchUrls(best.slice(0,3));
    row.innerHTML=`
      <a href="${c.fantasypros}" target="_blank" rel="noopener noreferrer">Compare top ${best.length} on FantasyPros ↗</a>
      <a href="${c.rotowire}" target="_blank" rel="noopener noreferrer">Compare latest RotoWire coverage ↗</a>
      <a href="${c.general}" target="_blank" rel="noopener noreferrer">Web comparison ↗</a>`;
  }else{
    row.innerHTML='';
  }
}

function recommendationConfidence(best,allBest){
  if(!best.length)return {score:0,state:'volatile',label:'NO DATA',copy:'No recommendation data is available.'};
  const top=best[0],second=best[1]||null;
  let score=70,reasons=[];

  if(second){
    const gap=top.score-second.score;
    if(gap>=15){score+=18;reasons.push(`clear ${gap}-point lead`);}
    else if(gap>=8){score+=10;reasons.push(`${gap}-point lead`);}
    else if(gap<=3){score-=22;reasons.push(`only ${gap}-point separation`);}
    else if(gap<=6){score-=10;reasons.push(`close ${gap}-point race`);}
  }

  const findings=recommendationAudit(best,allBest);
  if(findings.some(x=>x.kind==='bad')){score-=28;reasons.push('recommendation signals conflict');}
  else if(findings.some(x=>x.kind==='warn')){score-=12;reasons.push('some recommendation signals conflict');}
  else {score+=8;reasons.push('recommendation signals agree');}

  const topExtras=(top.breakdown||[]).filter(x=>x.label!=='Base recommendation score'&&x.value>0);
  const posTotal=topExtras.reduce((s,x)=>s+x.value,0);
  const max=topExtras.slice().sort((a,b)=>b.value-a.value)[0];
  if(max&&posTotal>0&&max.value/posTotal>=.6){score-=14;reasons.push(`heavily driven by ${max.label.toLowerCase()}`);}

  const board=(top.breakdown||[]).find(x=>x.label==='Board value vs. current pick')?.value||0;
  if(board>=0){score+=7;reasons.push('board value supports pick');}
  else if(board<=-12){score-=10;reasons.push('board value pushes back');}

  score=Math.max(5,Math.min(100,Math.round(score)));
  const state=score>=78?'high':score>=52?'close':'volatile';
  const label=state==='high'?'HIGH CONFIDENCE':state==='close'?'CLOSE CALL':'VOLATILE';
  return {score,state,label,copy:reasons.slice(0,3).join(' • ')};
}
function alternateWinner(mode,available,runs){
  const profile=myRosterProfile();
  const current=currentDraftNumber();
  const candidates=available.map(player=>{
    let score=0;
    if(mode==='pure'){
      score=-player.rank;
    }else if(mode==='noNeed'){
      const base=candidateFit(player,available,runs);
      const need=positionNeedState(profile,player.pos).bonus||0;
      const flex=flexNeedBonus(profile,player.pos).bonus||0;
      score=base.score-need-flex;
    }else if(mode==='noWait'){
      const base=candidateFit(player,available,runs);
      const wait=(base.breakdown||[]).filter(x=>
        x.label==='Next-pick availability risk'||
        x.label==='Likely available later'||
        x.label==='Urgent need near your turn'||
        x.label==='Strong position near your turn'
      ).reduce((s,x)=>s+x.value,0);
      score=base.score-wait;
    }
    return {player,score};
  }).sort((a,b)=>b.score-a.score||a.player.rank-b.player.rank);
  return candidates[0]||null;
}
function renderConfidenceAndSensitivity(best,allBest,available){
  const state=$('#confidenceState'),fill=$('#confidenceFill'),copy=$('#confidenceCopy'),grid=$('#sensitivityGrid');
  if(!state||!fill||!copy||!grid)return;
  const c=recommendationConfidence(best,allBest);
  state.textContent=`${c.label} • ${c.score}%`;
  state.className=c.state;
  fill.style.width=`${c.score}%`; fill.className=c.state;
  copy.textContent=c.copy||'Confidence reflects how clearly the top option separates from alternatives and whether the main recommendation signals agree.';

  const runs=detectPositionRuns();
  const pure=alternateWinner('pure',available,runs);
  const noNeed=alternateWinner('noNeed',available,runs);
  const noWait=alternateWinner('noWait',available,runs);
  const current=best[0]?.player||null;

  const card=(label,x,detail)=>{
    if(!x)return `<div class="sensitivity-card"><span>${label}</span><b>—</b><small>No data</small></div>`;
    const changed=current&&x.player.rank!==current.rank;
    return `<div class="sensitivity-card"><span>${label}</span><b>#${x.player.rank} ${esc(x.player.name)}</b><small>${changed?'Changes the #1 pick':'Same #1 pick'}${detail?` • ${detail}`:''}</small></div>`;
  };
  grid.innerHTML=
    card('Pure list value',pure,'ignores roster/context')+
    card('Ignore roster need',noNeed,'keeps timing/scarcity')+
    card('Ignore wait risk',noWait,'keeps roster/scarcity');
}
function renderWhatIfAndAudit(best,allBest,available){
  const grid=$('#whatIfGrid'),audit=$('#auditList'),state=$('#auditState');
  if(!grid||!audit||!state)return;

  grid.innerHTML=best.map(x=>{
    const w=whatIfForCandidate(x,available);
    const riskClass=w.survival.includes('High risk')?'bad':w.survival.includes('Could go')?'warn':'good';
    return `<button type="button" class="whatif-card" data-whatif-rank="${x.player.rank}" aria-label="Preview taking ${esc(x.player.name)}">
      <div class="whatif-name"><b>${esc(x.player.name)}</b><span class="whatif-rank">#${x.player.rank}</span></div>
      <div class="whatif-line"><span class="whatif-chip good">${esc(w.solved)}</span></div>
      <div class="whatif-line"><strong>Next weakness:</strong> ${esc(w.vulnerable)}</div>
      <div class="whatif-line"><strong>Tier:</strong> ${esc(w.tier)}</div>
      <div class="whatif-line"><span class="whatif-chip ${riskClass}">${esc(w.survival)}</span></div>
    </button>`;
  }).join('') || '<div class="intel-muted">No candidates to compare.</div>';

  const findings=recommendationAudit(best,allBest);
  const worst=findings.some(x=>x.kind==='bad')?'bad':findings.some(x=>x.kind==='warn')?'warn':'good';
  state.textContent=worst==='bad'?'Issue Found':worst==='warn'?'Review':'Passed';
  state.className=worst==='good'?'':worst;
  const help=$('#auditHelpBtn');
  if(help){
    help.classList.toggle('warn',worst==='warn');
    help.classList.toggle('bad',worst==='bad');
    help.title=`Recommendation Audit: ${state.textContent}`;
  }
  audit.innerHTML=findings.map(x=>`<span class="audit-item ${x.kind}">${esc(x.text)}</span>`).join('');
}


const MOBILE_FOCUS_KEY=KEY+'-mobile-draft-focus';
function setMobileDraftFocus(on){
  document.body.classList.toggle('mobile-draft-focus',!!on);
  storageSet(MOBILE_FOCUS_KEY,on?'1':'0');
}
function flashIntel(){
  setIntelCollapsed(false);
  const panel=$('#draftIntelPanel');
  if(panel){
    panel.scrollIntoView({behavior:'smooth',block:'start'});
    panel.classList.remove('mobile-intel-flash');
    void panel.offsetWidth;
    panel.classList.add('mobile-intel-flash');
  }
}
const INTEL_COLLAPSE_KEY=KEY+'-intel-collapsed';
function setIntelCollapsed(collapsed){
  const panel=$('#draftIntelPanel'),body=$('#intelBody'),label=$('#intelCollapseLabel'),head=$('#draftIntelPanel .intel-head');
  if(!panel||!body||!label||!head)return;
  body.hidden=!!collapsed;
  panel.classList.toggle('collapsed',!!collapsed);
  label.setAttribute('aria-expanded',String(!collapsed));
  label.title=collapsed?'Expand Draft Intelligence':'Collapse Draft Intelligence';
  head.setAttribute('aria-expanded',String(!collapsed));
  head.title=collapsed?'Expand Draft Intelligence':'Collapse Draft Intelligence';
  storageSet(INTEL_COLLAPSE_KEY,collapsed?'1':'0');
}
function toggleIntelCollapsed(){
  setIntelCollapsed(!$('#intelBody')?.hidden);
}
function initIntelCollapse(){
  const saved=storageGet(INTEL_COLLAPSE_KEY,'');
  if(saved==='')setIntelCollapsed(storageGet(INTEL_DEFAULT_KEY,'1')==='0');
  else setIntelCollapsed(saved==='1');
}

const SEARCH_COLLAPSE_KEY=KEY+'-search-collapsed';
const AUTO_SYNC_KEY=KEY+'-auto-sync';
const REC_DETAIL_KEY=KEY+'-rec-detail';
const INTEL_DEFAULT_KEY=KEY+'-intel-default';
const SEARCH_DEFAULT_KEY=KEY+'-search-default';
const BOARD_DENSITY_KEY=KEY+'-board-density';

const USER_PREFERENCE_KEYS=[
  AUTO_SYNC_KEY,REC_DETAIL_KEY,INTEL_DEFAULT_KEY,SEARCH_DEFAULT_KEY,BOARD_DENSITY_KEY,KEY+'-color-theme',
  MOBILE_FOCUS_KEY,KEY+'-condensed',INTEL_COLLAPSE_KEY,SEARCH_COLLAPSE_KEY
];


function setSearchCollapsed(collapsed){
  const panel=$('#searchPanel'),body=$('#searchBody'),toggle=$('#searchToggle');
  if(!panel||!body||!toggle)return;
  body.hidden=!!collapsed;
  panel.classList.toggle('collapsed',!!collapsed);
  toggle.setAttribute('aria-expanded',String(!collapsed));
  toggle.title=collapsed?'Expand Search':'Collapse Search';
  storageSet(SEARCH_COLLAPSE_KEY,collapsed?'1':'0');
}
function toggleSearchCollapsed(){
  setSearchCollapsed(!$('#searchBody')?.hidden);
}
function initSearchCollapse(){
  const saved=storageGet(SEARCH_COLLAPSE_KEY,'');
  if(saved==='')setSearchCollapsed(storageGet(SEARCH_DEFAULT_KEY,'1')==='0');
  else setSearchCollapsed(saved==='1');
}
function toggleAuditHelp(open){
  const pop=$('#auditHelpPop');
  if(!pop)return;
  pop.classList.toggle('open',open==null?!pop.classList.contains('open'):!!open);
}
function renderDraftIntelligence(){
  const bestEl=$('#bestForMe'),runsEl=$('#positionRuns'),watchEl=$('#rosterWatch'),contextEl=$('#draftContext');
  if(!bestEl||!runsEl||!watchEl||!contextEl)return;

  const current=currentDraftNumber(),teams=Number(verifiedLeague?.total_rosters||8);
  const round=Math.max(1,Math.ceil(current/teams));
  const currentLabel=pickLabel({pick_no:current,round});
  const nextMine=nextUserPickNumber();
  contextEl.textContent=nextMine
    ?`${currentLabel} • yours ${nextMine===current?'NOW':`in ${nextMine-current}`}`
    :`${currentLabel}${sleeperCtx.username?' • draft slot pending':''}`;

  const available=PLAYERS.filter(p=>ps(p.rank).draft==='available'&&!ps(p.rank).avoid);
  const allBest=bestAvailableForMe(12);
  const best=allBest.slice(0,3);
  captureRecommendationSnapshot(allBest);
  bestEl.innerHTML=best.length?best.map((x,i)=>{
    const explanation=recommendationExplanationText(x,3);
    return `<div class="best-card-wrap">
      <button class="best-card" type="button" data-rec-rank="${x.player.rank}" title="${esc(explanation)}">
        <div class="best-top"><span class="best-num">${i+1}</span><span class="best-name">${esc(x.player.name)}</span><span class="best-score">${x.score}</span></div>
        <div class="best-meta">#${x.player.rank} • ${x.player.posRank} • ${x.player.team}<span class="need-state ${x.needState}">${x.needState}</span></div>
        <div class="best-why">${esc(explanation)}</div>
      </button>
      <div class="rec-quick-actions">
        <button class="why-player-btn" type="button" data-why-rank="${x.player.rank}">Why?</button>
        <button class="whatif-player-btn" type="button" data-whatif-rank="${x.player.rank}">What if?</button>
      </div>
    </div>`;
  }).join(''):(specialistEndgameState().forced
    ?`<span class="intel-muted">Reserve the remaining roster slot${specialistEndgameState().remaining===1?'':'s'} for ${esc(specialistEndgameState().missing.join(' + '))}.</span>`
    :'<span class="intel-muted">No ranked players available.</span>');

  renderWhatIfAndAudit(best,allBest,available);
  renderQuickResearch(best);
  renderConfidenceAndSensitivity(best,allBest,available);
  const top=best[0]||null,alt=bestAlternativeCandidate(top,allBest),wait=top?waitRiskForCandidate(top,available):null;
  const tierContext=tierWatchForRoster(available),tier=tierContext.tier;
  if(wait){
    const advice=$('#takeWaitAdvice'),reason=$('#takeWaitReason');
    advice.textContent=wait.label; advice.className=wait.risk>=3?'take-now':wait.risk===0?'wait-ok':'';
    reason.textContent=wait.reasons.join(' • ');
  }else{$('#takeWaitAdvice').textContent='—';$('#takeWaitReason').textContent='';}
  if(alt){
    $('#bestAlternative').textContent=`#${alt.player.rank} ${alt.player.name}`;
    $('#bestAlternativeReason').textContent=`${alt.player.posRank} • ${recommendationExplanationText(alt,2)}`;
  }else{$('#bestAlternative').textContent='—';$('#bestAlternativeReason').textContent='';}
  if(tier){
    const el=$('#tierWatch');el.textContent=`${tier.cliff.label}: ${tier.top.name}`;
    el.className=tier.cliff.severity>=3?'tier-cliff':'tier-warning';
    $('#tierWatchReason').textContent=tier.cliff.next?`${tier.cliff.rankGap}-rank gap${tier.cliff.projGap?` • ${tier.cliff.projGap} projected-point drop`:''}`:'No comparable ranked option behind him';
  }else{
    $('#tierWatch').textContent='No urgent tier pressure';$('#tierWatch').className='';
    $('#tierWatchReason').textContent=tierContext.suppressed?'The strongest current cliffs are at positions your roster already covers.':'Current relevant position pools remain relatively flat.';
  }

  const runs=detectPositionRuns();
  runsEl.innerHTML=runs.length
    ?runs.slice(0,3).map(r=>`<span class="intel-chip ${r.level}" title="Recent draft-market signal; recommendation impact is reduced when your roster is already covered at this position.">${esc(r.label)}</span>`).join('')
    :'<span class="intel-muted">No meaningful run detected.</span>';

  const warnings=rosterVulnerabilities();
  watchEl.innerHTML=warnings.length
    ?warnings.map(w=>`<span class="intel-chip ${w.level}">${esc(w.text)}</span>`).join('')
    :'<span class="intel-chip ok">No major roster vulnerability yet</span>';
  updatePickFocus();
}

function fantasyProsSlug(name){
  return String(name||'').toLowerCase()
    .replace(/[.'’]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}
function researchLinksForPlayer(player){
  const name=player.name;
  const fp=`https://www.fantasypros.com/nfl/players/${fantasyProsSlug(name)}.php`;
  const rw=`https://www.google.com/search?q=${encodeURIComponent(`site:rotowire.com/football/player "${name}"`)}`;
  const pfr=`https://www.pro-football-reference.com/search/search.fcgi?search=${encodeURIComponent(name)}`;
  return [
    {label:'FantasyPros',url:fp,desc:'ECR / ADP / fantasy outlook'},
    {label:'RotoWire',url:rw,desc:'News / injury / role research'},
    {label:'Pro Football Reference',url:pfr,desc:'Stats / game logs / history'}
  ];
}
function openWhyPlayer(rank){
  const player=PLAYERS.find(p=>p.rank===rank);if(!player)return;
  const whyDialog=$('#whyDialog');
  if(whyDialog)whyDialog.dataset.rank=String(player.rank);
  const available=PLAYERS.filter(p=>ps(p.rank).draft==='available'&&!ps(p.rank).avoid);
  const runs=detectPositionRuns();
  const c=candidateFit(player,available,runs);
  $('#whyTitle').textContent=`Why ${player.name}?`;
  $('#whySub').textContent=`${player.posRank} • ${player.team} • ${player.proj} projected points • Bye ${player.bye}`;
  $('#whyScore').textContent=c.score;
  $('#whyRank').textContent=`#${player.rank}`;
  $('#whyNeed').textContent=(c.needState||'—').toUpperCase();

  $('#whyBreakdown').innerHTML=c.breakdown.map(x=>{
    const cls=x.value>0?'positive':x.value<0?'negative':'neutral';
    const val=x.value>0?`+${x.value}`:`${x.value}`;
    return `<div class="why-row ${cls}"><span>${esc(x.label)}</span><b>${val}</b></div>`;
  }).join('');

  const next=nextUserPickNumber(),current=currentDraftNumber();
  const timing=next&&next>current?`Your next pick is ${next-current} pick${next-current===1?'':'s'} away.`:
    next&&next<=current?'You are on the clock.':'Your draft slot is not fully resolved yet.';
  const reasons=recommendationExplanationText(c,4);
  $('#whySummary').textContent=`${player.name}: ${reasons}. ${timing} Your custom list remains the baseline; roster need, timing, scarcity, active runs, tier pressure, and your flags make bounded adjustments.`;

  $('#whyResearchLinks').innerHTML=researchLinksForPlayer(player).map(x=>
    `<a class="research-link" href="${x.url}" target="_blank" rel="noopener noreferrer" title="${esc(x.desc)}">${esc(x.label)} ↗</a>`
  ).join('');
  $('#whyDialog').showModal();
}
document.addEventListener('click',e=>{
  const why=e.target.closest('[data-why-rank]');
  if(why){e.preventDefault();e.stopPropagation();openWhyPlayer(Number(why.dataset.whyRank));}
  const whatIf=e.target.closest('[data-whatif-rank]');
  if(whatIf){e.preventDefault();e.stopPropagation();openWhatIfPreview(Number(whatIf.dataset.whatifRank));}
});
$('#whatIfClose').addEventListener('click',()=>{const d=$('#whatIfDialog');d.close();d.removeAttribute('data-rank');});
$('#whatIfDialog').addEventListener('click',e=>{if(e.target===$('#whatIfDialog')){e.target.close();e.target.removeAttribute('data-rank');}});
$('#whyClose').addEventListener('click',()=>{const d=$('#whyDialog');d.close();d.removeAttribute('data-rank');});
$('#whyDialog').addEventListener('click',e=>{if(e.target===$('#whyDialog')){e.target.close();e.target.removeAttribute('data-rank');}});

document.addEventListener('click',e=>{
  const rec=e.target.closest('[data-rec-rank]');
  if(!rec)return;
  const rank=Number(rec.dataset.recRank),p=PLAYERS.find(x=>x.rank===rank);
  if(!p)return;
  switchTab('draft');
  $('#search').value=p.name;
  $('#statusFilter').value='available';
  $('#posFilter').value='';
  $('#byeFilter').value='';
  $('#sortBy').value='rank';
  render();
  setTimeout(()=>document.querySelector('.table-wrap, .mobile-list')?.scrollIntoView({behavior:'smooth',block:'start'}),20);
});
