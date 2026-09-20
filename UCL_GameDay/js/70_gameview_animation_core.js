/* UCL GameDay v0.5.60 — build fragment: 70_gameview_animation_core.js
   This file is concatenated in manifest order into the app's single lexical scope.
   It is intentionally not loaded independently in the browser. */
function gvScoringRole(evt){
  const p=String(evt.pos||'').toUpperCase(),type=evt.playType||gvPlayType(evt);
  if(evt?.lateralChain&&['QB','RB','WR','TE'].includes(String(evt?.lateralRecipientPos||'').toUpperCase()))return String(evt.lateralRecipientPos).toUpperCase();
  // A correlated pass is a two-actor play. The QB remains in the QB slot,
  // while the highlighted/scoring actor is the receiver represented by evt.
  if(evt?.multiActor&&(type==='qb_pass'||type==='reception')){
    const rp=String(evt.receiverPos||p||'WR').toUpperCase();
    return ['QB','WR','TE','RB'].includes(rp)?rp:'WR';
  }
  if(type==='off_fum_rec_td'&&['QB','RB','WR','TE'].includes(p))return p;
  if(type==='kick'||p==='K')return 'K';
  if(type.startsWith('def_')||p==='DEF'||p==='DST')return 'DEF';
  if(type==='qb_run'||type==='qb_pass'||type==='two_point_pass'||type==='two_point_rush'||type==='qb_kneel'||p==='QB')return 'QB';
  if(type==='rb_run'){
    if(['RB','WR','TE'].includes(p))return p;
    return 'RB';
  }
  if(p==='RB')return 'RB';
  if(p==='TE')return 'TE';
  if(p==='WR')return 'WR';
  return 'WR';
}

function gvFormationOrientationOk(f){
  if(!f)return false;
  const offenseX=(f.offense||[]).map(u=>Number(u.x)).filter(Number.isFinite);
  if(!offenseX.length)return false;
  const correct=offenseX.filter(x=>f.own?x<=f.los+.05:x>=f.los-.05).length;
  return correct/offenseX.length>=0.9;
}

function gvIsSpecialTeamsReturnType(type){
  return ['def_kick_return','def_kick_ret_td','def_punt_return','def_punt_ret_td'].includes(String(type||''));
}
function gvIsKickAttemptType(type){
  return ['kick','def_blocked_kick'].includes(String(type||''));
}
function gvPrepareKickFormation(evt,built,type='kick'){
  if(!built?.units?.length||!built?.formation||!gvIsKickAttemptType(type))return built;
  const offense=built.units.filter(u=>u.side==='offense');
  const defense=built.units.filter(u=>u.side==='defense');
  const kicker=offense.find(u=>u.role==='K')||built.scorer||null;
  const holder=offense.find(u=>u.role==='H')||null;
  const snapper=offense.find(u=>u.role==='C')||null;
  const line=offense.filter(u=>['LT','LG','C','RG','RT','TE','WB'].includes(u.role));
  if(!kicker||!holder||!snapper)return built;

  const dir=Number(built.formation.dir||1),los=Number(built.formation.los||50);
  const lineUnits=line.filter(u=>u!==holder&&u!==kicker);
  const lineYs=[30,35,40,45,50,55,60,65,70];
  lineUnits.forEach((u,i)=>{
    gvSetUnitPoint(u,los-dir*(i===0||i===lineUnits.length-1?.75:.25),lineYs[Math.min(i,lineYs.length-1)]);
  });
  // Long snapper must remain centered on the kick axis regardless of the
  // original formation-array ordering used for the other protection slots.
  gvSetUnitPoint(snapper,los,50);

  // Holder sits directly behind the snapper; kicker starts a few yards deeper
  // and slightly off-center, giving the approach a natural diagonal rather than
  // backing away from the football before the strike.
  gvSetUnitPoint(holder,los-dir*7.4,50);
  const kickSide=simRand(assignmentHash(`${evt?.id||'kick'}|kick-side`),731)>.5?1:-1;
  gvSetUnitPoint(kicker,los-dir*11.8,50+kickSide*5.2);

  // Compact rush front aligned to the protection wall; only two deeper players
  // remain off the line to preserve a believable kick-defense shell.
  const rush=defense.slice(0,Math.min(9,defense.length));
  const rushYs=[28,34,40,45,50,55,60,66,72];
  rush.forEach((u,i)=>gvSetUnitPoint(u,los+dir*(.7+(i%2)*.45),rushYs[i]??50));
  defense.slice(rush.length).forEach((u,i)=>gvSetUnitPoint(u,los+dir*(6.5+i*2.2),i%2?62:38));

  const kLab=kicker.el?.querySelector('.gv-unit-visual small');if(kLab)kLab.textContent='K';
  const hLab=holder.el?.querySelector('.gv-unit-visual small');if(hLab)hLab.textContent='H';
  const cLab=snapper.el?.querySelector('.gv-unit-visual small');if(cLab)cLab.textContent='LS';

  built.kickTeams={prepared:true,type,kicker,holder,snapper,line:lineUnits,defense,kickSide};
  evt.kickFormationAudit={
    startsFieldGoalFormation:true,
    genericSnapBypassed:true,
    snapperPresent:true,
    holderPresent:true,
    kickerPresent:true,
    noOffenseFormationTransition:true,
    compactProtectionWall:true,
    diagonalKickerApproach:true
  };
  return built;
}
function gvPrepareSpecialTeamsFormation(evt,built,type){
  if(!built?.units?.length||!built?.formation||!gvIsSpecialTeamsReturnType(type))return built;
  const returner=built.scorer||built.units.find(u=>u.side==='defense');
  if(!returner)return built;
  const kickDir=Number(built.formation.dir||1),returnDir=-kickDir,isPunt=String(type).includes('punt');
  const retTeam=built.units.filter(u=>u.side==='defense');
  const coverTeam=built.units.filter(u=>u.side==='offense');
  const kicker=coverTeam.find(u=>u.role==='QB')||coverTeam[0];
  const seed=assignmentHash(`${evt?.id||'event'}|special-return|${type}`);
  const catchX=kickDir>0?(isPunt?80:88):(isPunt?20:12);
  const catchY=gvClamp(50+(simRand(seed,1)-.5)*(isPunt?24:18),18,82);

  gvSetUnitPoint(returner,catchX,catchY);
  const returnSupport=retTeam.filter(u=>u!==returner);

  if(isPunt){
    // Punt return: returner deep, return unit staggered underneath, punter deep
    // behind a compact protection group with two wide coverage lanes.
    const returnYs=[16,28,40,52,64,76,22,36,58,80];
    returnSupport.forEach((u,i)=>{
      const depth=(i<6?12:22)+(i%3)*3;
      gvSetUnitPoint(u,catchX-returnDir*depth,returnYs[i]??50);
      const lab=u.el?.querySelector('.gv-unit-visual small');if(lab)lab.textContent=i<6?'BLK':'RET';
    });

    gvSetUnitPoint(kicker,kickDir>0?24:76,50);
    const coverage=coverTeam.filter(u=>u!==kicker);
    const covYs=[10,90,30,38,45,55,62,70,22,78];
    coverage.forEach((u,i)=>{
      const wide=i<2;
      const x=kickDir>0?(wide?33:30-(i%3)*1.8):(wide?67:70+(i%3)*1.8);
      gvSetUnitPoint(u,x,covYs[i]??50);
      const lab=u.el?.querySelector('.gv-unit-visual small');if(lab)lab.textContent=wide?'GUN':'COV';
    });
  }else{
    // Kickoff return: coverage unit is a broad single wave behind the kicker;
    // return team is layered rather than clustered around the returner.
    gvSetUnitPoint(kicker,kickDir>0?15:85,50);
    const coverage=coverTeam.filter(u=>u!==kicker);
    const covYs=[10,19,28,37,46,55,64,73,82,91];
    coverage.forEach((u,i)=>{
      gvSetUnitPoint(u,kickDir>0?21.5:78.5,covYs[i]??50);
      const lab=u.el?.querySelector('.gv-unit-visual small');if(lab)lab.textContent='COV';
    });

    const returnYs=[14,30,46,62,78,22,38,54,70,86];
    returnSupport.forEach((u,i)=>{
      const depth=i<5?15:27;
      gvSetUnitPoint(u,catchX-returnDir*depth,returnYs[i]??50);
      const lab=u.el?.querySelector('.gv-unit-visual small');if(lab)lab.textContent='BLK';
    });
  }

  const kLab=kicker.el?.querySelector('.gv-unit-visual small');if(kLab)kLab.textContent=isPunt?'P':'K';
  const rLab=returner.el?.querySelector('.gv-unit-visual small');if(rLab)rLab.textContent='RET';

  built.specialTeams={
    prepared:true,type,isPunt,kickDir,returnDir,returner,kicker,retTeam,coverTeam,catchX,catchY
  };
  evt.specialTeamsFormationAudit={
    startsSpecialTeams:true,
    genericSnapBypassed:true,
    kind:isPunt?'punt':'kickoff',
    initialCarrier:isPunt?'punter':'kicker',
    noOffenseFormationTransition:true,
    distinctFormationByKickType:true,
    layeredReturnUnit:true,
    spreadCoverageLanes:true
  };
  return built;
}
function gvBuildUnits(evt){
  gvClearActors();
  const layer=$('#gvPlayersLayer'),losEl=$('#gvLos');if(!layer||!losEl)return {units:[],formation:null,scorer:null};
  const expectedSide=gvEventFieldSide(evt),f=gvFormation(evt);if(f.fieldSide!==expectedSide)(typeof appendJsError==='function')&&appendJsError('GameView event/formation side mismatch');if(!gvFormationOrientationOk(f))(typeof appendJsError==='function')&&appendJsError('GameView formation orientation error');const oppPrimary='#d9dde5',oppSecondary='#5b6472',defAction=String(evt.pos||'').toUpperCase()==='DEF'||String(evt.pos||'').toUpperCase()==='DST';
  if(matchMedia('(orientation: portrait)').matches){losEl.style.top=`${100-f.los}%`;losEl.style.left='';}
  else{losEl.style.left=`${f.los}%`;losEl.style.top='';}
  losEl.hidden=false;
  const units=[];
  const add=(side,row,i)=>{
    const el=document.createElement('div'),
      colors=defAction?(side==='defense'?[evt.teamPrimary,evt.teamSecondary]:[oppPrimary,oppSecondary]):(side==='offense'?[evt.teamPrimary,evt.teamSecondary]:[oppPrimary,oppSecondary]),
      p=gvFieldPoint(row.x,row.y);
    el.className=`gv-unit ${side}`;el.dataset.role=row.role;
    el.style.left=p.left;el.style.top=p.top;el.style.transform='translate(-50%,-50%)';
    el.style.background=colors[0];el.style.borderColor=colors[1];el.style.color=readableText(colors[0]);
    el.innerHTML=`<span class="gv-unit-visual"><small>${row.role}</small></span>`;
    layer.appendChild(el);units.push({el,side,role:row.role,x:row.x,y:row.y});
  };
  f.offense.forEach((r,i)=>add('offense',r,i));f.defense.forEach((r,i)=>add('defense',r,i));
  const role=gvScoringRole(evt);
  let scorer;
  if(role==='DEF')scorer=units.find(u=>u.side==='defense');
  else if(role==='WR'){
    const candidates=units.filter(u=>u.side==='offense'&&u.role==='WR');
    scorer=candidates[gvReceiverUnitIndex(evt,candidates)];
  }
  else if(evt?.multiActor&&['TE','RB'].includes(role)){
    const candidates=units.filter(u=>u.side==='offense'&&u.role===role);
    scorer=candidates[gvReceiverUnitIndex(evt,candidates)]||units.find(u=>u.side==='offense'&&u.role===role);
  }else scorer=units.find(u=>u.side==='offense'&&u.role===role);
  if(!scorer)scorer=units.find(u=>u.side==='offense'&&u.role==='WR');
  if(scorer){
    scorer.el.classList.add('scorer');
    const label=scorer.el.querySelector('.gv-unit-visual small');
    // Never relabel a formation slot with the wrong actor position.
    // For tandem passes the highlighted slot is the receiver; QB remains QB.
    const actorLabel=evt?.multiActor?(evt.receiverPos||role):(evt.pos||role);
    if(label)label.textContent=actorLabel;
  }
  const built={units,formation:f,scorer};
  const playType=evt?.playType||gvPlayType(evt);
  if(gvIsSpecialTeamsReturnType(playType))gvPrepareSpecialTeamsFormation(evt,built,playType);
  else if(gvIsKickAttemptType(playType))gvPrepareKickFormation(evt,built,playType);
  return built;
}

const GV_DEF_REACTION_PROFILES=Object.freeze([
  'attack','read-and-react','contain','overpursue','patient','aggressive','inside-leverage','outside-leverage'
]);
function gvDefReactionProfile(evt,unit,index=0){
  const seed=assignmentHash(`${evt?.id||'event'}|def-react|${unit?.role||''}|${index}`);
  return {name:GV_DEF_REACTION_PROFILES[seed%GV_DEF_REACTION_PROFILES.length],seed};
}
function gvDefReactionPath(unit,target,dir,profile,index=0){
  const start={x:unit.x,y:unit.y},name=profile?.name||'read-and-react',seed=profile?.seed||0;
  const side=(target.y-start.y)>=0?1:-1;
  const noise=(simRand(seed,300+index)-.5)*4;
  let first={x:start.x-dir*1.5,y:start.y+noise*.25};
  let second={x:start.x+(target.x-start.x)*.48,y:gvClamp(start.y+(target.y-start.y)*.42+noise,10,90)};
  let finish={x:target.x-dir*(1.5+(index%3)),y:gvClamp(target.y+(index%2?1:-1)*(3+(index%3)),10,90)};
  if(name==='attack'){
    first={x:start.x-dir*3.2,y:start.y+side*1.5};
    second={x:start.x+(target.x-start.x)*.62,y:gvClamp(start.y+(target.y-start.y)*.58,10,90)};
  }else if(name==='read-and-react'||name==='patient'){
    first={x:start.x-dir*.8,y:start.y};
    second={x:start.x+(target.x-start.x)*.36,y:gvClamp(start.y+(target.y-start.y)*.32+noise,10,90)};
  }else if(name==='contain'||name==='outside-leverage'){
    first={x:start.x-dir*1.3,y:gvClamp(start.y-side*4,10,90)};
    second={x:start.x+(target.x-start.x)*.44,y:gvClamp(target.y-side*7+noise,10,90)};
    finish={x:target.x-dir*2.5,y:gvClamp(target.y-side*5,10,90)};
  }else if(name==='inside-leverage'){
    first={x:start.x-dir*1.8,y:gvClamp(start.y+side*3,10,90)};
    second={x:start.x+(target.x-start.x)*.5,y:gvClamp(target.y+side*4+noise,10,90)};
  }else if(name==='overpursue'){
    first={x:start.x-dir*2.5,y:start.y+side*4};
    second={x:target.x-dir*4,y:gvClamp(target.y+side*8,10,90)};
    finish={x:target.x-dir*.8,y:gvClamp(target.y-side*2,10,90)};
  }else if(name==='aggressive'){
    first={x:start.x-dir*3.8,y:start.y+noise};
    second={x:start.x+(target.x-start.x)*.68,y:gvClamp(start.y+(target.y-start.y)*.66,10,90)};
    finish={x:target.x-dir*.7,y:gvClamp(target.y+(index%2?2:-2),10,90)};
  }
  return [start,first,second,finish];
}
async function gvPreSnapShift(evt,built,totalDuration){
  const units=built?.units||[];if(!units.length)return;
  const dir=built.formation?.dir||1,seed=assignmentHash(`${evt?.id||'event'}|pre-snap`);
  const offense=units.filter(u=>u.side==='offense');
  const defense=units.filter(u=>u.side==='defense');
  const perimeterRun=/jet|fly-sweep|end-around|reverse|orbit/.test(String(gvRbConcept(evt)?.name||''));
  const skill=offense.filter(u=>['WR','TE','RB'].includes(u.role)&&(perimeterRun||u!==built.scorer));
  const motion=perimeterRun&&built.scorer&&['WR','TE','RB'].includes(built.scorer.role)
    ?built.scorer
    :(skill.length?skill[seed%skill.length]:null);
  const shiftSide=simRand(seed,601)>.5?1:-1;
  const dur=Math.max(180,Math.min(420,gvPhaseDur(totalDuration,.055,280)));
  const moves=[];
  if(motion){
    moves.push(gvMove(motion,[{x:motion.x,y:motion.y},{x:motion.x-dir*.5,y:gvClamp(motion.y+shiftSide*5,10,90)}],dur));
  }
  const preSnapType=String(evt?.playType||gvPlayType(evt)||'');
  // v0.4.52 reliability audit: front-seven engagement belongs to the actual
  // play phase, not pre-snap decoration. Restrict visible defensive shifting
  // to coverage players so no rusher crosses an OL position and gets reset.
  const shiftDefense=defense
    .filter(u=>!['EDGE','DE','DT','NT','LB'].includes(String(u.role||'').toUpperCase()))
    .slice().sort((a,b)=>a.x-b.x).slice(0,4);
  shiftDefense.forEach((u,i)=>{
    const prof=gvDefReactionProfile(evt,u,i);
    const lateral=(prof.name==='contain'||prof.name==='outside-leverage'?shiftSide:-shiftSide)*(1.5+(i%2));
    moves.push(gvMove(u,[{x:u.x,y:u.y},{x:u.x-dir*.35,y:gvClamp(u.y+lateral,10,90)}],dur+(i%2)*40));
  });
  if(evt)evt.preSnapReliability={frontSevenShiftSuppressed:true,coverageOnly:true};
  if(preSnapType==='qb_run'&&evt)evt.qbRunPreSnapProtection={frontSevenShiftSuppressed:true};
  if(moves.length)await Promise.allSettled(moves);
}

async function gvBasicSnapAndPlay(evt,built,totalDuration){
  const {units,formation,scorer}=built;if(!formation)return;
  await gvPreSnapShift(evt,built,totalDuration);
  const dir=formation.dir,dur=gvPhaseDur(totalDuration,.16,700),anims=[];
  const snapType=String(evt?.playType||gvPlayType(evt)||'');
  if(snapType==='qb_run'){
    // v0.4.52 reliability fix: the line of scrimmage is owned by the dedicated
    // QB-run blocking phase. Do not translate OL/front-seven players during the
    // generic snap at all; otherwise they can cross, then be pulled back when
    // paired blocking begins. Skill players and QB can still make a tiny snap read.
    const blockers=units.filter(u=>u.side==='offense'&&['LT','LG','C','RG','RT','TE'].includes(u.role));
    const front=units.filter(u=>u.side==='defense'&&['EDGE','DE','DT','NT','LB'].includes(u.role));
    const frozen=new Set([...blockers,...front]);
    for(const [i,u] of units.entries()){
      let tx=u.x,ty=u.y,seed=assignmentHash(`${evt.id}|qb-run-snap|${u.side}|${u.role}|${u.y}`);
      if(frozen.has(u)){
        // Keep exact field coordinates. A subtle visual pulse is enough to sell
        // the snap without creating a second owner for line engagement.
        const visual=u.el?.querySelector('.gv-unit-visual');
        if(visual){
          const a=visual.animate([{transform:'scale(1)'},{transform:'scale(1.025)'},{transform:'scale(1)'}],{duration:Math.min(260,dur),easing:'ease-out'});
          gvActorAnimations.push(a);anims.push(a.finished.catch(()=>{}));
        }
        continue;
      }
      if(u.side==='offense'&&u.role==='QB'){tx-=dir*.65}
      else if(u.side==='offense'&&u!==scorer){tx+=dir*(.55+simRand(seed,6)*.85);ty+=(simRand(seed,7)-.5)*1.8}
      else if(u.side==='defense'){tx-=dir*.12;ty+=(simRand(seed,8)-.5)*1.2}
      anims.push(gvMove(u,[{x:u.x,y:u.y},{x:tx,y:ty}],dur+(u.side==='defense'?(i%3)*20:0)));
    }
    evt.qbRunSnapProtection={frontCrossesLine:false,genericSurgeSuppressed:true,lineFrozenUntilBlocking:true,phaseOwner:'qb-run-blocking'};
    await Promise.allSettled(anims);
    return;
  }
  // v0.4.52 reliability audit: specialized play animators own line engagement.
  // The generic snap may move backfield/perimeter players, but it must not first
  // drive OL/front-seven through one another and then make the next phase undo it.
  const snapLineActors=new Set(units.filter(u=>
    (u.side==='offense'&&['LT','LG','C','RG','RT','TE'].includes(String(u.role||'').toUpperCase()))||
    (u.side==='defense'&&['EDGE','DE','DT','NT','LB'].includes(String(u.role||'').toUpperCase()))
  ));
  for(const [i,u] of units.entries()){
    let tx=u.x,ty=u.y,seed=assignmentHash(`${evt.id}|snap|${u.side}|${u.role}|${u.y}`);
    if(snapLineActors.has(u)){
      const visual=u.el?.querySelector('.gv-unit-visual');
      if(visual){
        const a=visual.animate([{transform:'scale(1)'},{transform:'scale(1.02)'},{transform:'scale(1)'}],{duration:Math.min(250,dur),easing:'ease-out'});
        gvActorAnimations.push(a);anims.push(a.finished.catch(()=>{}));
      }
      continue;
    }
    if(u.side==='offense'){
      if(u.role==='QB'){tx-=dir*1.25}
      else if(u!==scorer){tx+=dir*(1.0+simRand(seed,4)*2.2);ty+=(simRand(seed,5)-.5)*3.5}
    }else{
      const prof=gvDefReactionProfile(evt,u,i);
      const reaction=prof.name==='patient'||prof.name==='read-and-react'?.45:prof.name==='aggressive'||prof.name==='attack'?.8:.6;
      tx-=dir*(.35+simRand(seed,6)*.85)*reaction;
      ty+=(simRand(seed,7)-.5)*(prof.name==='contain'||prof.name==='outside-leverage'?4:2.8);
    }
    anims.push(gvMove(u,[{x:u.x,y:u.y},{x:tx,y:ty}],dur+(u.side==='defense'?(i%4)*25:0)));
  }
  if(evt)evt.snapPhaseAudit={lineEngagementOwnedByActionPhase:true,lineActorsFrozen:snapLineActors.size};
  await Promise.allSettled(anims);
}

function gvEventSignedYards(evt){
  const visual=Number(evt?.visualYards);
  if(Number.isFinite(visual)&&visual!==0)return visual;
  const st=evt?.intervalAnalysis?.stats||{};
  const candidates=[
    ['rec_yd',Number(st.rec_yd||0)],
    ['rush_yd',Number(st.rush_yd||0)],
    ['pass_yd',Number(st.pass_yd||0)],
    ['kick_ret_yd',Number(st.kick_ret_yd||0)],
    ['punt_ret_yd',Number(st.punt_ret_yd||0)],
    ['def_int_ret_yd',Number(st.def_int_ret_yd||0)],
    ['fum_rec_yd',Number(st.fum_rec_yd||0)]
  ].filter(([,v])=>Number.isFinite(v)&&v!==0);
  if(candidates.length){
    const preferred=candidates.find(([k])=>{
      const t=String(evt?.playType||evt?.detail||'').toLowerCase();
      if(k==='rec_yd')return t.includes('rec')||t.includes('pass');
      if(k==='rush_yd')return t.includes('rush')||t.includes('run');
      if(k==='pass_yd')return t.includes('pass');
      if(k.includes('ret'))return t.includes('return')||t.includes('interception')||t.includes('fumble');
      return false;
    });
    return Number((preferred||candidates[0])[1]);
  }
  const text=String(evt?.detail||'');
  const m=text.match(/(?:for|of)\s+(-?\d{1,3})\s+yards?/i)||text.match(/(-?\d{1,3})-yard/i);
  if(m)return Number(m[1]);
  return 0;
}
function gvEventStatYards(evt){return Math.abs(gvEventSignedYards(evt))}
function gvPositiveOffensiveStatTarget(evt,built){
  const yards=gvEventSignedYards(evt),type=String(evt?.playType||gvPlayType(evt)||'');
  if(!(yards>0)||!['rb_run','qb_run','reception','qb_pass'].includes(type)||!built?.formation)return null;
  const dir=Number(built.formation.dir||1),los=Number(built.formation.los||50);
  // The playable field is 80 coordinate units across 100 football yards, so
  // 0.8 field units per stat yard keeps visual gain tied to the play stats.
  const progress=gvClamp(yards*.8,.8,60);
  return {yards,progress,los,dir,x:gvClamp(los+dir*progress,5,95)};
}
function gvAlignPathFinalX(path,targetX){
  if(!Array.isArray(path)||path.length<2||!Number.isFinite(Number(targetX)))return path;
  const pts=path.map(p=>({...p})),startX=Number(pts[0].x),endX=Number(pts.at(-1).x),delta=Number(targetX)-endX;
  if(Math.abs(delta)<.01)return pts;
  for(let i=1;i<pts.length;i++){
    const f=i/(pts.length-1),blend=Math.pow(f,1.35);
    pts[i].x=gvClamp(Number(pts[i].x)+delta*blend,5,95);
  }
  pts[pts.length-1].x=gvClamp(Number(targetX),5,95);
  return pts;
}
function gvGuardPostLosRegression(path,built,dir=null,margin=.18){
  if(!Array.isArray(path)||path.length<2||!built?.formation)return path;
  const pts=path.map(p=>({...p}));
  const d=Number(dir??built.formation.dir??1)||1,los=Number(built.formation.los??50);
  let crossed=false,corrections=0;
  for(let i=0;i<pts.length;i++){
    const x=Number(pts[i]?.x);
    if(!Number.isFinite(x))continue;
    const progress=(x-los)*d;
    if(progress>margin)crossed=true;
    if(crossed&&progress<0){
      pts[i].x=gvClamp(los+d*margin,5,95);
      corrections++;
    }
  }
  if(corrections&&built)built.postLosRegressionCorrections=(built.postLosRegressionCorrections||0)+corrections;
  return pts;
}
function gvTerminalPossessionExpected(evt,type=null){
  const t=String(type||evt?.playType||gvPlayType(evt)||'').toLowerCase();
  if(/interception|def_int/.test(t))return 'defense';
  if(/fumble|def_fum/.test(t)){
    const s=evt?.intervalAnalysis?.stats||{};
    if(Number(s.fum_rec||0)>0||Number(s.fum_rec_yd||0)!==0||Number(s.fum_lost||0)>0)return 'defense';
    return 'offense';
  }
  if(/pass_breakup|breakup|pbu|incomplete/.test(t))return 'none';
  if(/sack|qb_hit/.test(t))return 'offense';
  if(/field_goal|fg_|extra_point|xp/.test(t))return 'none';
  if(/reception|rush|run|pass/.test(t))return 'offense';
  return 'unchanged';
}
function gvTerminalPossessionAudit(evt,type,actual,extra={}){
  if(!evt)return null;
  const expected=gvTerminalPossessionExpected(evt,type),ok=expected==='unchanged'||expected===actual;
  evt.terminalPossessionAudit={expected,actual,ok,...(extra||{})};
  return evt.terminalPossessionAudit;
}
function gvTerminalBallAudit(evt,state,extra={}){
  if(!evt)return null;
  evt.terminalBallAudit={state,...(extra||{})};
  return evt.terminalBallAudit;
}

function gvBallContinuitySnapshot(){
  const field=$('#gameViewField');
  const free=field?field.querySelectorAll('.gv-football').length:0;
  const carried=field?field.querySelectorAll('.gv-carried-football').length:0;
  return {free,carried,total:free+carried,valid:(free+carried)<=1};
}
function gvBallContinuityAudit(evt,phase,expected='one',extra={}){
  if(!evt)return null;
  const snap=gvBallContinuitySnapshot();
  const expectedOk=expected==='none'?snap.total===0:expected==='carried'?snap.carried===1&&snap.free===0:expected==='free'?snap.free===1&&snap.carried===0:snap.total===1;
  const item={phase,...snap,expected,ok:snap.valid&&expectedOk,...(extra||{})};
  evt.ballContinuityAudit=Array.isArray(evt.ballContinuityAudit)?evt.ballContinuityAudit:[];
  evt.ballContinuityAudit.push(item);
  return item;
}

function gvFreezeTerminalUnits(units=[]){
  const seen=new Set();
  for(const u of (Array.isArray(units)?units:[])){
    if(!u||seen.has(u))continue;
    seen.add(u);
    try{u.el?.getAnimations?.().forEach(a=>a.cancel())}catch{}
  }
  return seen.size;
}
function gvTerminalFrameAudit(evt,kind,units=[],extra={}){
  if(!evt)return null;
  const frozenUnits=gvFreezeTerminalUnits(units);
  evt.terminalFrameAudit={kind,frozenUnits,whistleHardStop:true,...(extra||{})};
  return evt.terminalFrameAudit;
}

function gvPhaseHandoffPoint(unit){
  return unit&&Number.isFinite(Number(unit.x))&&Number.isFinite(Number(unit.y))
    ?{x:Number(unit.x),y:Number(unit.y)}:null;
}
function gvPhaseHandoffAudit(evt,name,unit,before,after,tolerance=.35){
  if(!evt)return null;
  const a=before||null,b=after||gvPhaseHandoffPoint(unit);
  const jump=a&&b?Math.hypot(Number(b.x)-Number(a.x),Number(b.y)-Number(a.y)):0;
  const item={name,jump:Number(jump.toFixed(3)),continuous:jump<=tolerance,tolerance};
  evt.phaseHandoffAudit=Array.isArray(evt.phaseHandoffAudit)?evt.phaseHandoffAudit:[];
  evt.phaseHandoffAudit.push(item);
  return item;
}

function gvGoalLineBounds(buffer=.8){
  const b=Math.max(.25,Number(buffer)||.8);
  return {left:10+b,right:90-b};
}
function gvGuardNonTouchdownEndzone(path,evt,built=null,dir=null,buffer=.8){
  if(!Array.isArray(path)||!path.length||gvIsTouchdownEvent(evt))return path;
  const pts=path.map(p=>({...p})),bounds=gvGoalLineBounds(buffer);
  let corrections=0,leftCorrections=0,rightCorrections=0;
  // Reliability rule: if Sleeper did not award a touchdown, the action player
  // must remain in the field of play. Clamp BOTH goal lines so a backward sack,
  // cutback, return, or late contact animation cannot imply a score/safety.
  for(const p of pts){
    if(!Number.isFinite(Number(p?.x)))continue;
    const x=Number(p.x),clamped=gvClamp(x,bounds.left,bounds.right);
    if(Math.abs(clamped-x)>.001){
      p.x=clamped;corrections++;
      if(x<bounds.left)leftCorrections++;
      if(x>bounds.right)rightCorrections++;
    }
  }
  if(corrections&&built){
    built.nonTdEndzoneCorrections=(built.nonTdEndzoneCorrections||0)+corrections;
    built.goalLineAudit={
      ...(built.goalLineAudit||{}),
      nonTouchdownBothGoalLines:true,
      leftCorrections:(built.goalLineAudit?.leftCorrections||0)+leftCorrections,
      rightCorrections:(built.goalLineAudit?.rightCorrections||0)+rightCorrections,
      bounds
    };
  }
  return pts;
}
function gvGuardActionPath(path,evt,built,dir=null){
  const d=Number(dir??built?.formation?.dir??1)||1;
  return gvGuardNonTouchdownEndzone(gvGuardPostLosRegression(path,built,d),evt,built,d);
}
function gvAlignPositiveOffensivePath(path,evt,built){
  const target=gvPositiveOffensiveStatTarget(evt,built);
  if(!target)return gvGuardActionPath(path,evt,built,built?.formation?.dir);
  const td=/touchdown/i.test(String(evt?.detail||''))||Number(evt?.intervalAnalysis?.stats?.rush_td||0)>0||Number(evt?.intervalAnalysis?.stats?.rec_td||0)>0||Number(evt?.intervalAnalysis?.stats?.pass_td||0)>0;
  const end=Array.isArray(path)&&path.length?path.at(-1):null;
  if(td&&end&&((Number(end.x)-target.los)*target.dir)>=target.progress)return gvGuardActionPath(path,evt,built,target.dir);
  return gvGuardActionPath(gvAlignPathFinalX(path,target.x),evt,built,target.dir);
}
function gvIsTouchdownEvent(evt,type=''){
  const st=evt?.intervalAnalysis?.stats||{},t=String(type||evt?.playType||gvPlayType(evt)||'');
  return /touchdown|\btd\b/i.test(String(evt?.detail||''))||
    Number(st.rush_td||0)>0||Number(st.rec_td||0)>0||Number(st.pass_td||0)>0||Number(st.def_td||0)>0||Number(st.def_st_td||0)>0||
    ['def_int_td','def_fum_td','def_kick_ret_td','def_punt_ret_td'].includes(t);
}
function gvEndzoneTarget(built,dir,currentY=50,inset=7){
  const d=Number(dir||built?.formation?.dir||1);
  return {x:d>0?95-inset:5+inset,y:gvClamp(Number(currentY)||50,8,92)};
}
function gvTouchdownExtensionPath(unit,built,dir,seed=0){
  if(!unit)return [];
  const target=gvEndzoneTarget(built,dir,unit.y,3.2),start={x:unit.x,y:unit.y};
  // Never rubber-band a scorer backward if a prior phase already placed them deeper.
  if((target.x-start.x)*dir<=.15)return [start];
  const laneY=gvClamp(start.y+(simRand(seed,991)-.5)*5,9,91);
  return [start,{x:start.x+(target.x-start.x)*.52,y:laneY},target];
}
async function gvExtendTouchdownToEndzone(evt,unit,built,dir,duration=900,label='touchdown'){
  if(!gvIsTouchdownEvent(evt)||!unit)return false;
  const path=gvTouchdownExtensionPath(unit,built,dir,assignmentHash(`${evt?.id||''}|td-extension|${label}`));
  if(path.length>1)await gvMove(unit,path,Math.max(520,duration),'cubic-bezier(.2,.8,.2,1)');
  gvSetPossession(unit);
  const terminalType=String(evt?.playType||gvPlayType(evt)||'');
  const terminalOwner=/def_int|def_fum|def_kick_ret|def_punt_ret|interception|fumble|kick return|punt return/i.test(terminalType)?'defense':'offense';
  gvTerminalPossessionAudit(evt,evt?.playType||gvPlayType(evt),terminalOwner,{touchdown:true,carrier:unit.role||unit.playerId||null});
  gvTerminalBallAudit(evt,'possessed',{owner:terminalOwner,touchdown:true,carrier:unit.role||unit.playerId||null});
  evt.touchdownFinish={...(evt.touchdownFinish||{}),extendedToEndzone:true,actor:unit.role||unit.playerId||null,direction:dir,targetX:Number(unit.x.toFixed(2)),postLosRegressionGuard:true,goalLineAudit:true,ballSynchronized:true};
  gvTerminalFrameAudit(evt,'touchdown',[unit],{scorerProtected:true,postScoreTackleSuppressed:true});
  return true;
}

function gvEventAnimationYards(evt,fallbackScale=2.2){
  const y=gvEventStatYards(evt);
  if(y>0)return Math.max(1,Math.min(80,y));
  return Math.max(1,Math.min(40,Math.abs(Number(gvEventDisplayDelta(evt)||evt?.delta||0))*fallbackScale));
}
function gvEventIsBigPlay(evt,threshold=20){
  const yards=gvEventStatYards(evt);
  if(yards>0)return yards>=threshold;
  const st=evt?.intervalAnalysis?.stats||{};
  return Number(st.rec_td||0)>0||Number(st.rush_td||0)>0||Number(st.pass_td||0)>0||Number(st.def_td||0)>0;
}

async function gvScorerAdvance(evt,built){
  const s=built.scorer;if(!s)return;
  const dir=built.formation.dir,
    baseGain=Math.min(36,8+gvEventAnimationYards(evt,1.6)),
    statTarget=gvPositiveOffensiveStatTarget(evt,built),
    rawTargetX=statTarget?statTarget.x:Math.max(12,Math.min(88,s.x+dir*baseGain)),
    goalBounds=gvGoalLineBounds(),
    targetX=gvIsTouchdownEvent(evt)?rawTargetX:gvClamp(rawTargetX,goalBounds.left,goalBounds.right),
    targetY=Math.max(16,Math.min(84,s.y+(simRand(assignmentHash(`${evt?.id||'generic'}|scorer-y`),1)-.5)*18));
  const path=gvGuardNonTouchdownEndzone([
    {x:s.x,y:s.y},
    {x:s.x+(targetX-s.x)*.52,y:s.y+(targetY-s.y)*.35},
    {x:targetX,y:targetY}
  ],evt,built,dir);
  await gvMove(s,path,1100,'ease-out');
  gvPhaseHandoffAudit(evt,'generic-scorer-advance',s,path.at(-1),gvPhaseHandoffPoint(s),.35);
  evt.genericScorerAdvanceAudit={stateSynchronized:true,end:gvPhaseHandoffPoint(s)};
  if(gvIsTouchdownEvent(evt)){
    await gvExtendTouchdownToEndzone(evt,s,built,dir,800,'generic-td');
    await gvAnimateScorerCelebration(evt,s,'celebration',1200);
  }
}


function gvUnit(built,side,role,index=0){return built.units.filter(u=>u.side===side&&u.role===role)[index]||null}

function gvClamp(v,a,b){return Math.max(a,Math.min(b,v))}
function gvBezier(p0,p1,p2,p3,t){
  const u=1-t,tt=t*t,uu=u*u;
  return {
    x:uu*u*p0.x+3*uu*t*p1.x+3*u*tt*p2.x+tt*t*p3.x,
    y:uu*u*p0.y+3*uu*t*p1.y+3*u*tt*p2.y+tt*t*p3.y
  };
}
function gvCurveBetween(a,b,bend=0,steps=12){
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.max(1,Math.hypot(dx,dy)),nx=-dy/len,ny=dx/len;
  const c1={x:a.x+dx*.30+nx*bend,y:a.y+dy*.30+ny*bend};
  const c2={x:a.x+dx*.70+nx*bend,y:a.y+dy*.70+ny*bend};
  const out=[];
  for(let i=0;i<=steps;i++)out.push(gvBezier(a,c1,c2,b,i/steps));
  return out;
}
function gvSmoothPath(points,stepsPerLeg=8){
  if(!points||points.length<2)return points||[];
  const out=[];
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+2)];
    const bend=((b.y-prev.y)-(next.y-a.y))*.10;
    const seg=gvCurveBetween(a,b,bend,stepsPerLeg);
    if(i)seg.shift();
    out.push(...seg);
  }
  return out;
}
function gvFacingFrames(path){
  const count=Math.max(1,path.length-1);
  return path.map((p,i)=>{
    const q=path[Math.min(path.length-1,i+1)]||p,dx=q.x-p.x,dy=q.y-p.y,angle=Math.atan2(dy,dx)*180/Math.PI,pt=gvFieldPoint(p.x,p.y);
    return {offset:i/count,left:pt.left,top:pt.top,transform:`translate(-50%,-50%) rotate(${angle}deg)`};
  });
}
function gvPlayDuration(evt,type='generic'){
  const seed=assignmentHash(`${evt.id}|motion-duration|${type}`),yards=gvEventAnimationYards(evt,1.5);
  // v0.4.40: animation length scales with the football distance represented.
  // Short gains stay compact; explosive plays have enough time to visibly develop.
  let ms=4350+Math.min(5200,Math.round(yards*67))+Math.floor(simRand(seed,1)*551);
  if(type==='kick')ms=Math.max(ms,5900);
  if(['def_int','def_int_td','def_fumble','def_fum_td'].includes(type))ms=Math.max(ms,6500+Math.min(2200,Math.round(yards*30)));
  if(['wr_rec_fumble','rb_rec_fumble','wr_rush_fumble','rb_rush_fumble'].includes(type))ms=Math.max(ms,6800+Math.min(1600,Math.round(yards*28)));
  if((evt.tier==='huge'||evt.tier==='celebration')&&['rb_run','qb_run','reception','qb_pass'].includes(type))ms=Math.max(ms,6200);
  return Math.max(4500,Math.min(10300,ms));
}
function gvPhaseDur(total,share,min=250){return Math.max(min,Math.round(total*share))}
function gvSleep(ms=0){return new Promise(resolve=>setTimeout(resolve,Math.max(0,Number(ms)||0)))}
function gvAnimatePath(u,points,duration,easing='linear'){
  if(!u||!u.el||!points?.length)return Promise.resolve();
  const path=gvSmoothPath(points,12);
  if(path.length<2)return Promise.resolve();
  const visual=u.el.querySelector('.gv-unit-visual');
  const final=path[path.length-1],total=Math.max(1,Number(duration)||700);

  return new Promise(resolve=>{
    const started=performance.now();
    let rafId=null;

    const samplePath=t=>{
      const scaled=t*(path.length-1);
      const i=Math.min(path.length-2,Math.max(0,Math.floor(scaled)));
      const local=scaled-i;
      const a=path[i],b=path[i+1];
      return {
        x:a.x+(b.x-a.x)*local,
        y:a.y+(b.y-a.y)*local,
        next:b
      };
    };

    const step=now=>{
      const raw=Math.min(1,(now-started)/total);
      // Most football movement should carry speed across animation phases.
      // Only explicitly eased motions should fully accelerate/decelerate.
      let t=raw;
      if(easing==='ease-in-out'||easing==='smooth')t=raw*raw*(3-2*raw);
      else if(easing==='ease-out')t=1-Math.pow(1-raw,2);
      else if(easing==='ease-in')t=raw*raw;
      const p=samplePath(t);
      const pt=gvFieldPoint(p.x,p.y);
      u.el.style.left=pt.left;
      u.el.style.top=pt.top;
      u.el.style.transform='translate(-50%,-50%)';

      if(visual){
        const angle=Math.atan2(p.next.y-p.y,p.next.x-p.x)*180/Math.PI;
        visual.style.transform=`rotate(${angle}deg)`;
      }

      if(raw<1){
        rafId=requestAnimationFrame(step);
        gvActiveMotionFrames.add(rafId);
      }else{
        u.x=final.x;u.y=final.y;
        const fp=gvFieldPoint(final.x,final.y);
        u.el.style.left=fp.left;u.el.style.top=fp.top;
        u.el.style.transform='translate(-50%,-50%)';
        if(visual)visual.style.transform='';
        if(rafId)gvActiveMotionFrames.delete(rafId);
        resolve();
      }
    };

    rafId=requestAnimationFrame(step);
    gvActiveMotionFrames.add(rafId);
  });
}

function gvMove(u,points,duration=700,easing='linear'){
  if(!u||!points?.length)return Promise.resolve();
  const normalized=points.map((p,i)=>i===0
    ?{x:gvClamp(u.x,4,96),y:gvClamp(u.y,4,96)}
    :{x:gvClamp(Number(p.x),4,96),y:gvClamp(Number(p.y),4,96)});
  const compact=[normalized[0]];
  for(let i=1;i<normalized.length;i++){
    const prev=compact.at(-1),cur=normalized[i];
    if(Math.hypot(cur.x-prev.x,cur.y-prev.y)<.18&&i<normalized.length-1)continue;
    compact.push(cur);
  }
  if(compact.length<2)return Promise.resolve();

  let distance=0;
  for(let i=1;i<compact.length;i++)distance+=Math.hypot(compact[i].x-compact[i-1].x,compact[i].y-compact[i-1].y);
  u._gvMoveCount=(u._gvMoveCount||0)+1;
  u._gvMoveDistance=(u._gvMoveDistance||0)+distance;
  if(u._gvMotionActive)u._gvMotionConflicts=(u._gvMotionConflicts||0)+1;
  const token=Symbol('gv-motion');
  u._gvMotionActive=token;

  return gvAnimatePath(u,compact,duration,easing).finally(()=>{
    if(u._gvMotionActive===token)u._gvMotionActive=null;
  });
}
function gvMakeBall(x,y){
  const field=$('#gameViewField');if(!field)return null;
  field.querySelectorAll('.gv-football').forEach(x=>x.remove());
  const ball=document.createElement('div');ball.className='gv-football';const p=gvFieldPoint(x,y);ball.style.left=p.left;ball.style.top=p.top;ball.style.transform='translate(-50%,-50%)';field.appendChild(ball);return {el:ball,x,y};
}
function gvBallFlightPath(points){
  if(!Array.isArray(points)||points.length<2)return [];
  const start=points[0],end=points.at(-1);
  const dx=end.x-start.x,dy=end.y-start.y,len=Math.max(1,Math.hypot(dx,dy));
  const suppliedMid=points.length>2?points[Math.floor(points.length/2)]:null;
  const nx=-dy/len,ny=dx/len;

  // One control point for the entire flight. If a caller supplied an apex/midpoint,
  // use its displacement from the straight-line midpoint as the intended arc.
  const linearMid={x:(start.x+end.x)/2,y:(start.y+end.y)/2};
  let arcOffset=0;
  if(suppliedMid){
    arcOffset=(suppliedMid.x-linearMid.x)*nx+(suppliedMid.y-linearMid.y)*ny;
  }
  if(!Number.isFinite(arcOffset)||Math.abs(arcOffset)<1.25){
    arcOffset=Math.min(7,Math.max(2.5,len*.10));
    // Keep the arc on a deterministic visual side rather than alternating segments.
    arcOffset*=dy>=0?-1:1;
  }
  arcOffset=Math.max(-8,Math.min(8,arcOffset));
  const control={x:linearMid.x+nx*arcOffset*2,y:linearMid.y+ny*arcOffset*2};

  const dense=[];
  const samples=80;
  for(let i=0;i<=samples;i++){
    const t=i/samples,u=1-t;
    dense.push({
      x:u*u*start.x+2*u*t*control.x+t*t*end.x,
      y:u*u*start.y+2*u*t*control.y+t*t*end.y
    });
  }

  // Resample the Bezier at equal physical distances so linear animation timing
  // produces a visually consistent ball speed from release to arrival.
  const cumulative=[0];
  for(let i=1;i<dense.length;i++){
    cumulative[i]=cumulative[i-1]+Math.hypot(dense[i].x-dense[i-1].x,dense[i].y-dense[i-1].y);
  }
  const total=cumulative.at(-1)||1,frameCount=Math.max(18,Math.min(42,Math.round(total*.85)));
  const path=[];
  for(let j=0;j<frameCount;j++){
    const target=total*(j/(frameCount-1));
    let i=1;
    while(i<cumulative.length&&cumulative[i]<target)i++;
    const a=Math.max(0,i-1),b=Math.min(cumulative.length-1,i);
    const span=Math.max(.0001,cumulative[b]-cumulative[a]);
    const mix=(target-cumulative[a])/span;
    path.push({
      x:dense[a].x+(dense[b].x-dense[a].x)*mix,
      y:dense[a].y+(dense[b].y-dense[a].y)*mix
    });
  }
  return path;
}

function gvBallFlightDuration(path,requested=650){
  if(!Array.isArray(path)||path.length<2)return requested;
  let distance=0;
  for(let i=1;i<path.length;i++)distance+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);
  // Approximately constant field-space velocity across short/deep throws while
  // remaining compatible with the surrounding GameView phase timing.
  const natural=distance/48*1000;
  // v0.4.40: deep throws stay in the air visibly longer instead of hitting the
  // old 900 ms ceiling, reinforcing the yardage-proportional play scale.
  return Math.max(380,Math.min(1300,Math.round(natural)));
}

function gvBallMove(ball,points,duration=650){
  if(!ball||!points?.length)return Promise.resolve();
  const path=gvBallFlightPath(points);
  if(path.length<2)return Promise.resolve();

  // The football keeps one stable nose orientation for the whole throw. Previous
  // per-frame heading rotation made curved trajectories look like the ball turned
  // sideways in mid-air rather than traveling on a smooth pass arc.
  const start=path[0],end=path.at(-1);
  const flightAngle=Math.atan2(end.y-start.y,end.x-start.x)*180/Math.PI;
  const frames=path.map(p=>{
    const pt=gvFieldPoint(p.x,p.y);
    return {left:pt.left,top:pt.top,transform:`translate(-50%,-50%) rotate(${flightAngle}deg)`};
  });
  const flightDuration=gvBallFlightDuration(path,duration);
  const a=ball.el.animate(frames,{duration:flightDuration,easing:'linear',fill:'forwards'});
  gvActorAnimations.push(a);
  return a.finished.catch(()=>{}).then(()=>{
    ball.x=Number(end.x);ball.y=Number(end.y);
    return ball;
  });
}
function gvImpactAt(x,y,large=false){
  const field=$('#gameViewField');if(!field)return;
  const r=document.createElement('div');r.className='gv-impact-ring';const p=gvFieldPoint(x,y);r.style.left=p.left;r.style.top=p.top;r.style.transform='translate(-50%,-50%)';field.appendChild(r);
  const a=r.animate([{opacity:1,transform:'translate(-50%,-50%) scale(.45)'},{opacity:0,transform:`translate(-50%,-50%) scale(${large?3.1:2})`}],{duration:large?620:420,easing:'ease-out',fill:'forwards'});gvActorAnimations.push(a);a.finished.finally(()=>r.remove());
}
function gvPulseUnit(unit,label='INTERCEPTION',duration=760){
  const field=$('#gameViewField');if(!field||!unit)return Promise.resolve();
  const p=gvFieldPoint(unit.x,unit.y),r=document.createElement('div');
  r.className='gv-turnover-pulse';r.style.left=p.left;r.style.top=p.top;r.style.transform='translate(-50%,-50%) scale(.55)';field.appendChild(r);
  const t=document.createElement('div');t.className='gv-turnover-label';t.textContent=label;t.style.left=p.left;t.style.top=p.top;field.appendChild(t);
  const a=r.animate([
    {opacity:.15,transform:'translate(-50%,-50%) scale(.55)'},
    {opacity:1,transform:'translate(-50%,-50%) scale(1.15)',offset:.35},
    {opacity:.5,transform:'translate(-50%,-50%) scale(.92)',offset:.62},
    {opacity:0,transform:'translate(-50%,-50%) scale(1.45)'}
  ],{duration:Math.max(520,duration),easing:'ease-out',fill:'forwards'});
  gvActorAnimations.push(a);
  return a.finished.catch(()=>{}).finally(()=>{r.remove();t.remove()});
}
function gvLooseBallIndicator(x,y,label='FUMBLE',duration=900){
  const field=$('#gameViewField');if(!field)return Promise.resolve();
  const p=gvFieldPoint(x,y),r=document.createElement('div');r.className='gv-loose-ball-ring';
  r.style.left=p.left;r.style.top=p.top;r.style.transform='translate(-50%,-50%) scale(.65)';field.appendChild(r);
  const t=document.createElement('div');t.className='gv-turnover-label';t.textContent=label;t.style.left=p.left;t.style.top=p.top;field.appendChild(t);
  const a=r.animate([
    {opacity:.35,transform:'translate(-50%,-50%) scale(.65)'},
    {opacity:1,transform:'translate(-50%,-50%) scale(1.18)',offset:.4},
    {opacity:.25,transform:'translate(-50%,-50%) scale(.88)',offset:.72},
    {opacity:0,transform:'translate(-50%,-50%) scale(1.35)'}
  ],{duration:Math.max(650,duration),easing:'ease-out',fill:'forwards'});gvActorAnimations.push(a);
  return a.finished.catch(()=>{}).finally(()=>{r.remove();t.remove()});
}
function gvMomentLabel(x,y,label,kind='catch',duration=720){
  const field=$('#gameViewField');if(!field)return Promise.resolve();
  const p=gvFieldPoint(x,y),t=document.createElement('div');t.className=`gv-play-callout ${kind}`;t.textContent=label;
  t.style.left=p.left;t.style.top=p.top;field.appendChild(t);
  const a=t.animate([{opacity:0,transform:'translate(-50%,-115%) scale(.82)'},{opacity:1,transform:'translate(-50%,-150%) scale(1.06)',offset:.28},{opacity:1,transform:'translate(-50%,-145%) scale(1)',offset:.72},{opacity:0,transform:'translate(-50%,-165%) scale(.96)'}],{duration:Math.max(520,duration),easing:'ease-out',fill:'forwards'});gvActorAnimations.push(a);
  return a.finished.catch(()=>{}).finally(()=>t.remove());
}
function gvKickResultIndicator(x,y,made=true,label='GOOD!',duration=980){
  const field=$('#gameViewField');if(!field)return Promise.resolve();
  const p=gvFieldPoint(x,y),r=document.createElement('div');r.className=`gv-kick-result-pulse${made?'':' missed'}`;
  r.style.left=p.left;r.style.top=p.top;r.style.transform='translate(-50%,-50%) scale(.45)';field.appendChild(r);
  const t=document.createElement('div');t.className='gv-turnover-label';t.textContent=label;t.style.left=p.left;t.style.top=p.top;field.appendChild(t);
  const a=r.animate([{opacity:.15,transform:'translate(-50%,-50%) scale(.45)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.18)',offset:.34},{opacity:.62,transform:'translate(-50%,-50%) scale(.92)',offset:.62},{opacity:0,transform:'translate(-50%,-50%) scale(1.48)'}],{duration:Math.max(700,duration),easing:'ease-out',fill:'forwards'});gvActorAnimations.push(a);
  return a.finished.catch(()=>{}).finally(()=>{r.remove();t.remove()});
}
function gvQbAngrySteam(qb,duration=1100){
  const field=$('#gameViewField');if(!field||!qb)return Promise.resolve();
  const p=gvFieldPoint(qb.x,qb.y),nodes=[],anims=[],offsets=[[-12,-7],[-7,-12],[7,-12],[12,-7]];
  offsets.forEach(([dx,dy],i)=>{const e=document.createElement('div');e.className='gv-qb-steam';e.style.left=`calc(${p.left} + ${dx}px)`;e.style.top=`calc(${p.top} + ${dy}px)`;field.appendChild(e);nodes.push(e);const drift=(i<2?-1:1)*(7+i%2*3);const a=e.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.45)'},{opacity:.95,transform:`translate(calc(-50% + ${drift*.35}px),calc(-50% - 7px)) scale(1.05)`,offset:.25},{opacity:.7,transform:`translate(calc(-50% + ${drift*.75}px),calc(-50% - 18px)) scale(1.35)`,offset:.65},{opacity:0,transform:`translate(calc(-50% + ${drift}px),calc(-50% - 29px)) scale(1.65)`}],{duration:Math.max(800,duration)+(i%2)*120,delay:i*75,easing:'ease-out',fill:'forwards'});gvActorAnimations.push(a);anims.push(a.finished.catch(()=>{}));});
  return Promise.allSettled(anims).finally(()=>nodes.forEach(n=>n.remove()));
}
function gvKickResult(evt){const detail=String(evt?.detail||'').toLowerCase(),explicitMiss=/miss|no good|failed/.test(detail),correction=!!evt?.likelyCorrection,missed=explicitMiss||(!correction&&Number(evt?.delta)<0);return {made:!missed,missed,explicitMiss,correction}}


function gvSackKnockback(qb,defender,dir,duration=520){
  if(!qb)return Promise.resolve();
  const dx=defender?qb.x-defender.x:-dir,dy=defender?qb.y-defender.y:0;
  const mag=Math.max(.01,Math.hypot(dx,dy));
  const priorDistance=1.2+simRand(assignmentHash(`${qb.id||qb.role}|sack-knockback`),1441)*.8;
  const distance=priorDistance*2.5;
  const nx=dx/mag,ny=dy/mag;
  const end={x:gvClamp(qb.x+nx*distance,4,96),y:gvClamp(qb.y+ny*distance,4,96)};
  const mid={x:gvClamp(qb.x+nx*distance*.55,4,96),y:gvClamp(qb.y+ny*distance*.55-1.8,4,96)};
  const spin=defender&&Math.abs(dy)>.8?(dy>0?16:-16):(dir>0?-14:14);
  const anim=qb.el?.animate([
    {transform:'translate(-50%,-50%) rotate(0deg)',offset:0},
    {transform:`translate(-50%,-62%) rotate(${spin}deg)`,offset:.45},
    {transform:'translate(-50%,-50%) rotate(0deg)',offset:1}
  ],{duration:Math.max(420,duration),easing:'cubic-bezier(.2,.8,.25,1)'});
  if(anim)gvActorAnimations.push(anim);
  return Promise.allSettled([gvMove(qb,[{x:qb.x,y:qb.y},mid,end],Math.max(420,duration),'cubic-bezier(.2,.8,.25,1)'),anim?.finished?.catch(()=>{})||Promise.resolve()]);
}
function gvKickMissProfile(evt){
  const seed=assignmentHash(`${evt?.id||'kick'}|kick-miss-profile`),r=simRand(seed,1501),side=simRand(seed,1502)>.5?1:-1;
  let kind,offset;
  if(r<.008){kind='double-upright';offset=side*6.3;}
  else if(r<.06){kind='upright';offset=side*6.3;}
  else if(r<.43){kind='slight';offset=side*(7.8+simRand(seed,1503)*3.2);}
  else{kind='wide';offset=side*(13.5+simRand(seed,1504)*8.0);}
  return {kind,side,offset,seed};
}

function gvKickBallMove(ball,points,duration=900){
  if(!ball?.el||!Array.isArray(points)||points.length<2)return Promise.resolve();
  let total=0;const cumulative=[0];
  for(let i=1;i<points.length;i++){total+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);cumulative.push(total)}
  total=Math.max(.001,total);
  const frames=points.map((p,i)=>{
    const pt=gvFieldPoint(p.x,p.y),prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
    const angle=Math.atan2(next.y-prev.y,next.x-prev.x)*180/Math.PI;
    return {left:pt.left,top:pt.top,transform:`translate(-50%,-50%) rotate(${angle}deg)`,offset:cumulative[i]/total};
  });
  const travel=Math.max(620,Math.min(1500,Math.round(total/48*1000)));
  const a=ball.el.animate(frames,{duration:Math.max(travel,duration),easing:'linear',fill:'forwards'});gvActorAnimations.push(a);
  return a.finished.catch(()=>{});
}

function gvKickMissBallPath(launch,dir,distance,curve,profile){
  const endX=dir>0?96:4,preX=launch.x+dir*Math.min(45,distance*.75),midX=launch.x+dir*Math.min(22,distance*.35);
  const base=[{x:launch.x,y:launch.y,rot:0},{x:midX,y:launch.y+curve,rot:180},{x:preX,y:launch.y+curve*.45+profile.side*2.2,rot:360}];
  if(profile.kind==='upright'){
    const postY=50+profile.side*6.3;
    return [...base,{x:endX-dir*.5,y:postY,rot:500},{x:gvClamp(endX-dir*4.3,4,96),y:gvClamp(postY+profile.side*(7+simRand(profile.seed,1510)*4),4,96),rot:690}];
  }
  if(profile.kind==='double-upright'){
    const firstY=50+profile.side*6.3,secondY=50-profile.side*6.3;
    return [...base,{x:endX-dir*.7,y:firstY,rot:490},{x:endX-dir*.4,y:secondY,rot:650},{x:gvClamp(endX-dir*4.8,4,96),y:gvClamp(secondY-profile.side*7.5,4,96),rot:830}];
  }
  return [...base,{x:endX,y:gvClamp(50+profile.offset,4,96),rot:540}];
}

function gvAnimateKnockedAwayBall(ball,catchPt,dir,seed=0,duration=520){
  if(!ball?.el)return Promise.resolve();
  const side=simRand(seed,41)>.5?1:-1;
  const end={x:gvClamp(catchPt.x+dir*(3.8+simRand(seed,42)*2.8),4,96),y:gvClamp(catchPt.y+side*(6+simRand(seed,43)*5),5,95)};
  const mid={x:(catchPt.x+end.x)/2,y:gvClamp(catchPt.y+side*(3.5+simRand(seed,44)*2),5,95)};
  return gvBallMove(ball,[catchPt,mid,end],Math.max(430,duration));
}
function gvAnimateIncompleteBall(ball,missPt,dir,seed=0,duration=480){
  if(!ball?.el)return Promise.resolve();
  const side=simRand(seed,61)>.5?1:-1;
  const end={
    x:gvClamp(missPt.x+dir*(2.0+simRand(seed,62)*2.2),4,96),
    y:gvClamp(missPt.y+side*(2.2+simRand(seed,63)*3.2),5,95)
  };
  const mid={
    x:(missPt.x+end.x)/2,
    y:gvClamp(missPt.y+side*(1.0+simRand(seed,64)*1.4),5,95)
  };
  return gvBallMove(ball,[missPt,mid,end],Math.max(380,duration));
}
function gvShowUprights(own){
  const field=$('#gameViewField');if(!field)return null;
  field.querySelectorAll('.gv-uprights').forEach(x=>x.remove());
  const u=document.createElement('div');u.className='gv-uprights';u.innerHTML='<i></i><b></b>';
  if(matchMedia('(orientation: portrait)').matches){u.style.left='50%';u.style.top=own?'8%':'92%';u.style.transform='translate(-50%,-50%)'}
  else{u.style.top='50%';u.style.left=own?'92%':'8%';u.style.transform='translate(-50%,-50%) rotate(90deg)'}
  field.appendChild(u);return u;
}

const GV_ROUTE_VARIANTS=Object.freeze([
  'slant','quick-out','deep-out','curl','comeback','dig','drag','shallow-cross','deep-cross','post','corner','go',
  'seam','hitch','fade','wheel','pivot','choice-in','choice-out','bubble','tunnel-screen','back-shoulder','sideline',
  'red-zone-fade','over-route','stick'
]);
function gvRouteVariant(evt,pos='WR'){
  const seed=assignmentHash(`${evt.id}|route|${pos}`);
  return GV_ROUTE_VARIANTS[seed%GV_ROUTE_VARIANTS.length];
}
function gvRoutePath(start,dir,variant,gain){
  const s=start,side=s.y<50?-1:1,wide=side*(10+Math.min(10,gain*.22));
  switch(variant){
    case 'quick-out': return [s,{x:s.x+dir*8,y:s.y},{x:s.x+dir*12,y:s.y+wide}];
    case 'deep-out': return [s,{x:s.x+dir*18,y:s.y},{x:s.x+dir*gain,y:s.y+wide}];
    case 'curl': return [s,{x:s.x+dir*gain,y:s.y},{x:s.x+dir*(gain-5),y:s.y+side*2}];
    case 'comeback': return [s,{x:s.x+dir*gain,y:s.y},{x:s.x+dir*(gain-7),y:s.y+wide*.45}];
    case 'dig': return [s,{x:s.x+dir*16,y:s.y},{x:s.x+dir*gain,y:s.y-side*14}];
    case 'drag': return [s,{x:s.x+dir*5,y:s.y},{x:s.x+dir*12,y:s.y-side*18},{x:s.x+dir*gain,y:s.y-side*22}];
    case 'shallow-cross': return [s,{x:s.x+dir*7,y:s.y},{x:s.x+dir*14,y:s.y-side*20},{x:s.x+dir*gain,y:s.y-side*24}];
    case 'deep-cross': return [s,{x:s.x+dir*15,y:s.y},{x:s.x+dir*(gain*.7),y:s.y-side*18},{x:s.x+dir*gain,y:s.y-side*24}];
    case 'post': return [s,{x:s.x+dir*(gain*.45),y:s.y},{x:s.x+dir*gain,y:50}];
    case 'corner': return [s,{x:s.x+dir*(gain*.45),y:s.y},{x:s.x+dir*gain,y:s.y+side*18}];
    case 'go': return [s,{x:s.x+dir*gain,y:s.y}];
    case 'seam': return [s,{x:s.x+dir*gain,y:gvClamp(s.y-side*7,26,74)}];
    case 'hitch': return [s,{x:s.x+dir*12,y:s.y},{x:s.x+dir*9,y:s.y}];
    case 'fade': return [s,{x:s.x+dir*(gain*.55),y:s.y+side*5},{x:s.x+dir*gain,y:s.y+side*9}];
    case 'wheel': return [s,{x:s.x+dir*6,y:s.y+side*10},{x:s.x+dir*(gain*.45),y:s.y+side*18},{x:s.x+dir*gain,y:s.y+side*18}];
    case 'pivot': return [s,{x:s.x+dir*7,y:s.y-side*8},{x:s.x+dir*5,y:s.y+side*7},{x:s.x+dir*gain,y:s.y+side*12}];
    case 'choice-in': return [s,{x:s.x+dir*10,y:s.y},{x:s.x+dir*gain,y:s.y-side*14}];
    case 'choice-out': return [s,{x:s.x+dir*10,y:s.y},{x:s.x+dir*gain,y:s.y+side*14}];
    case 'bubble': return [s,{x:s.x-dir*2,y:s.y+side*8},{x:s.x+dir*8,y:s.y+side*15}];
    case 'tunnel-screen': return [s,{x:s.x+dir*4,y:s.y},{x:s.x+dir*1,y:s.y-side*8},{x:s.x+dir*12,y:s.y-side*15}];
    case 'back-shoulder': return [s,{x:s.x+dir*gain,y:s.y},{x:s.x+dir*(gain-4),y:s.y-side*3}];
    case 'sideline': return [s,{x:s.x+dir*(gain*.6),y:s.y+side*8},{x:s.x+dir*gain,y:gvClamp(s.y+side*20,8,92)}];
    case 'red-zone-fade': return [s,{x:s.x+dir*(gain*.55),y:s.y+side*6},{x:s.x+dir*gain,y:gvClamp(s.y+side*12,8,92)}];
    case 'over-route': return [s,{x:s.x+dir*12,y:s.y},{x:s.x+dir*(gain*.7),y:s.y-side*16},{x:s.x+dir*gain,y:s.y-side*20}];
    case 'stick': return [s,{x:s.x+dir*8,y:s.y},{x:s.x+dir*10,y:s.y+side*7}];
    case 'slant':
    default: return [s,{x:s.x+dir*8,y:s.y},{x:s.x+dir*gain,y:s.y-side*13}];
  }
}

const GV_KICK_CONCEPTS=Object.freeze([
  'standard-left-hash','standard-middle','standard-right-hash','short-chip-left','short-chip-right','mid-range-left',
  'mid-range-right','long-range-left','long-range-right','deep-long-middle','quick-snap','slow-hold','high-snap-recover',
  'pressure-left','pressure-right','heavy-rush-middle','wide-protection-left','wide-protection-right','tight-protection',
  'extra-point-left','extra-point-middle','extra-point-right','wind-left','wind-right','low-line-drive','high-arc',
  'late-pressure','clean-pocket-kick','crowd-pressure','edge-rush'
]);
const GV_DEF_PRESSURE_CONCEPTS=Object.freeze([
  'edge-rush-left','edge-rush-right','double-a-gap','cross-dog','stunt-left','stunt-right','wide-nine-left','wide-nine-right',
  'bull-rush-middle','speed-rush-left','speed-rush-right','loop-stunt-left','loop-stunt-right','delayed-blitz-middle',
  'slot-blitz-left','slot-blitz-right','safety-blitz-left','safety-blitz-right','contain-left','contain-right','mug-a-gap',
  'zone-blitz-left','zone-blitz-right','sim-pressure-left','sim-pressure-right','green-dog','spy-trigger','inside-twist',
  'overload-left','overload-right'
]);
const GV_DEF_RETURN_CONCEPTS=Object.freeze([
  'int-middle','int-left','int-right','pick-six-middle','pick-six-left','pick-six-right','fumble-scoop-middle',
  'fumble-scoop-left','fumble-scoop-right','strip-sack-return','tip-drill-return','jump-route-return','sideline-pick-return',
  'under-cut-return','goal-line-pick','red-zone-scoop','broken-tackle-return','cutback-return-left','cutback-return-right',
  'escort-left','escort-right','open-field-return','short-field-return','long-field-return','traffic-return','reverse-field-return'
]);
const GV_TEST_FAMILIES=Object.freeze(['RB','WR','QB','K','DEF']);
function gvRoutePoints(start,dir,kind='slant',gain=24){
  if(kind==='out')return [start,{x:start.x+dir*gain*.45,y:start.y},{x:start.x+dir*gain,y:start.y+(start.y<50?-14:14)}];
  if(kind==='post')return [start,{x:start.x+dir*gain*.45,y:start.y},{x:start.x+dir*gain,y:50}];
  if(kind==='cross')return [start,{x:start.x+dir*gain*.3,y:start.y},{x:start.x+dir*gain*.75,y:start.y<50?68:32},{x:start.x+dir*gain,y:start.y<50?72:28}];
  return [start,{x:start.x+dir*gain*.35,y:start.y},{x:start.x+dir*gain,y:start.y+(start.y<50?10:-10)}];
}

const GV_RB_CONCEPTS=Object.freeze([
  'inside-zone-left','inside-zone-right','outside-zone-left','outside-zone-right','power-left','power-right',
  'counter-left','counter-right','draw','trap-left','trap-right','stretch-left','stretch-right','toss-left','toss-right',
  'sweep-left','sweep-right','off-tackle-left','off-tackle-right','dive','goal-line-plunge','cutback-left','cutback-right',
  'shotgun-run','pistol-run','delayed-handoff','bounce-left','bounce-right','breakaway-middle','breakaway-edge',
  'jet-sweep-left','jet-sweep-right','end-around-left','end-around-right','reverse-left','reverse-right',
  'orbit-sweep-left','orbit-sweep-right','fly-sweep-left','fly-sweep-right','crack-toss-left','crack-toss-right'
]);
function gvRbConcept(evt){
  const pos=String(evt?.pos||'RB').toUpperCase();
  const perimeter=['jet-sweep-left','jet-sweep-right','end-around-left','end-around-right','reverse-left','reverse-right',
    'orbit-sweep-left','orbit-sweep-right','fly-sweep-left','fly-sweep-right','crack-toss-left','crack-toss-right'];
  const rbCore=GV_RB_CONCEPTS.filter(x=>!perimeter.includes(x));
  const pool=(pos==='WR'||pos==='TE')?[...perimeter,...perimeter,'outside-zone-left','outside-zone-right','sweep-left','sweep-right']:
    pos==='QB'?[...perimeter,'qb-power-left','qb-power-right','outside-zone-left','outside-zone-right']:
    pos==='K'?[...perimeter,'sweep-left','sweep-right']:
    GV_RB_CONCEPTS;
  const idx=assignmentHash(`${evt.id}|run-concept|${pos}`)%pool.length;
  return {name:pool[idx],index:idx}
}

function gvCarrierMoveStyle(evt,context='run'){
  const seed=assignmentHash(`${evt?.id||''}|carrier-move|${context}`);
  const r=simRand(seed,117),yards=gvEventStatYards(evt);
  if(yards<4)return 'north-south';
  if(r<.17)return 'juke';
  if(r<.31)return 'hesitation';
  if(r<.44)return 'spin';
  if(r<.58)return 'stiff-separate';
  if(r<.72)return 'double-cut';
  if(r<.85)return 'burst';
  return 'north-south';
}
function gvApplyCarrierMove(path,evt,dir,context='run'){
  if(!Array.isArray(path)||path.length<3)return path;
  const style=gvCarrierMoveStyle(evt,context);
  if(style==='north-south')return path;
  const seed=assignmentHash(`${evt?.id||''}|carrier-path|${context}|${style}`),pts=path.map(p=>({...p}));
  const i=Math.max(1,Math.min(pts.length-2,Math.floor(pts.length*.55))),p=pts[i],next=pts[i+1]||p,side=simRand(seed,4)>.5?1:-1;
  if(style==='juke')pts.splice(i+1,0,{x:p.x+dir*1.2,y:gvClamp(p.y+side*7,10,90)},{x:p.x+dir*3.4,y:gvClamp(p.y-side*5,10,90)});
  else if(style==='hesitation')pts.splice(i+1,0,{x:p.x+dir*.8,y:p.y},{x:p.x+dir*1.4,y:gvClamp(p.y+side*2,10,90)});
  else if(style==='spin')pts.splice(i+1,0,{x:p.x+dir*1.5,y:gvClamp(p.y+side*4,10,90)},{x:p.x+dir*3,y:p.y},{x:p.x+dir*4.4,y:gvClamp(p.y-side*3,10,90)});
  else if(style==='stiff-separate')pts.splice(i+1,0,{x:p.x+dir*2,y:gvClamp(p.y+side*3,10,90)},{x:p.x+dir*5,y:gvClamp(p.y+side*5,10,90)});
  else if(style==='double-cut')pts.splice(i+1,0,{x:p.x+dir*1.8,y:gvClamp(p.y+side*6,10,90)},{x:p.x+dir*4,y:gvClamp(p.y-side*6,10,90)});
  else if(style==='burst')pts[i+1]={x:Math.max(5,Math.min(95,next.x+dir*3)),y:next.y};
  return pts;
}
function gvCarrierMoveFlourish(evt,carrier,context='run',duration=700){
  if(!carrier?.el)return;
  const style=gvCarrierMoveStyle(evt,context);
  let frames=null;
  if(style==='spin')frames=[{transform:'translate(-50%,-50%) rotate(0deg)'},{transform:'translate(-50%,-50%) rotate(180deg) scale(1.06)'},{transform:'translate(-50%,-50%) rotate(360deg)'}];
  else if(style==='juke'||style==='double-cut')frames=[{transform:'translate(-50%,-50%) rotate(0deg)'},{transform:'translate(-50%,-50%) rotate(-8deg) scale(1.05)'},{transform:'translate(-50%,-50%) rotate(8deg) scale(1.05)'},{transform:'translate(-50%,-50%) rotate(0deg)'}];
  else if(style==='hesitation')frames=[{transform:'translate(-50%,-50%) scale(1)'},{transform:'translate(-50%,-50%) scale(.96)'},{transform:'translate(-50%,-50%) scale(1.08)'},{transform:'translate(-50%,-50%) scale(1)'}];
  else if(style==='stiff-separate')frames=[{transform:'translate(-50%,-50%) scale(1) rotate(0deg)'},{transform:'translate(-50%,-50%) scale(1.08) rotate(6deg)'},{transform:'translate(-50%,-50%) scale(1) rotate(0deg)'}];
  if(!frames)return;
  const a=carrier.el.animate(frames,{duration:Math.max(420,duration),easing:'ease-in-out'});
  gvActorAnimations.push(a);
}
function gvRouteDepthClass(variant){
  const v=String(variant||'');
  if(['bubble','tunnel-screen','drag','shallow-cross','stick','quick-out','slant','hitch'].includes(v))return 'short';
  if(['curl','comeback','dig','pivot','choice-in','choice-out','over-route','sideline','back-shoulder'].includes(v))return 'intermediate';
  return 'deep';
}

function gvNormalizeRoutePath(path,variant,dir){
  if(!Array.isArray(path)||!path.length)return path;
  const v=String(variant||'').toLowerCase();
  const allowComeback=['curl','comeback','hitch','back-shoulder','pivot'].includes(v);
  const out=path.map((p,i)=>({
    x:gvClamp(Number(p.x),5,95),
    y:gvClamp(Number(p.y),6,94)
  }));
  for(let i=1;i<out.length;i++){
    const progress=(out[i].x-out[i-1].x)*dir;
    if(!allowComeback&&progress<-1.25)out[i].x=out[i-1].x-dir*1.25;
    if(Math.abs(out[i].y-out[i-1].y)>30)out[i].y=gvClamp(out[i-1].y+Math.sign(out[i].y-out[i-1].y)*30,6,94);
  }
  if(out.length>1&&!allowComeback){
    const first=out[0],last=out.at(-1);
    if((last.x-first.x)*dir<4)last.x=gvClamp(first.x+dir*4,5,95);
  }
  return out;
}

function gvSharpenRoutePath(path,variant,dir){
  if(!Array.isArray(path)||path.length<2)return path;
  const depth=gvRouteDepthClass(variant),out=path.map(p=>({...p}));
  if(depth==='short'&&out.length>2){
    const i=out.length-2,a=out[i],b=out[i+1];
    out.splice(i+1,0,{x:a.x+dir*1.5,y:a.y+(b.y-a.y)*.18});
  }else if(depth==='intermediate'&&out.length>2){
    const i=out.length-2,a=out[i],b=out[i+1];
    out.splice(i+1,0,{x:a.x+dir*.8,y:a.y+(b.y-a.y)*.08});
  }else if(depth==='deep'){
    const last=out.at(-1),prev=out.at(-2);
    if(prev&&Math.abs(last.y-prev.y)>3)out.splice(out.length-1,0,{x:prev.x+dir*3,y:prev.y+(last.y-prev.y)*.25});
  }
  return out;
}
function gvYacPath(evt,start,dir,extra,seed){
  const style=gvCarrierMoveStyle(evt,'yac'),side=simRand(seed,41)>.5?1:-1;
  const target={x:start.x+dir*extra,y:gvClamp(start.y+(simRand(seed,42)-.5)*10,12,88)};
  if(style==='juke')return [start,{x:start.x+dir*(extra*.32),y:gvClamp(start.y+side*7,12,88)},{x:start.x+dir*(extra*.58),y:gvClamp(start.y-side*5,12,88)},target];
  if(style==='double-cut')return [start,{x:start.x+dir*(extra*.28),y:gvClamp(start.y+side*6,12,88)},{x:start.x+dir*(extra*.55),y:gvClamp(start.y-side*7,12,88)},target];
  if(style==='hesitation')return [start,{x:start.x+dir*1,y:start.y},{x:start.x+dir*(extra*.36),y:start.y+side*2},target];
  if(style==='spin')return [start,{x:start.x+dir*(extra*.3),y:start.y+side*4},{x:start.x+dir*(extra*.48),y:start.y-side*3},target];
  if(style==='stiff-separate')return [start,{x:start.x+dir*(extra*.4),y:start.y+side*4},target];
  return [start,target];
}

function gvRbPath(concept,start,dir,delta,seed){
  const gain=Math.min(42,8+Math.abs(delta)*2.4);
  const side=(concept.includes('left')?-1:concept.includes('right')?1:0);
  const jitter=(simRand(seed,91)-.5)*4;
  const y0=start.y, yWide=Math.max(15,Math.min(85,y0+side*(12+simRand(seed,92)*8)+jitter));
  const yCut=Math.max(15,Math.min(85,y0-side*(8+simRand(seed,93)*10)));
  switch(concept){
    case 'inside-zone-left':
    case 'inside-zone-right':
      return [start,{x:start.x+dir*5,y:y0+side*3},{x:start.x+dir*(gain*.48),y:y0+side*7},{x:start.x+dir*gain,y:y0+side*5}];
    case 'outside-zone-left':
    case 'outside-zone-right':
    case 'stretch-left':
    case 'stretch-right':
      return [start,{x:start.x+dir*4,y:y0+side*7},{x:start.x+dir*(gain*.42),y:yWide},{x:start.x+dir*gain,y:yWide-side*3}];
    case 'power-left':
    case 'power-right':
      return [start,{x:start.x+dir*4,y:y0},{x:start.x+dir*(gain*.4),y:y0+side*6},{x:start.x+dir*gain,y:y0+side*8}];
    case 'counter-left':
    case 'counter-right':
      return [start,{x:start.x-dir*2,y:y0-side*5},{x:start.x+dir*4,y:y0+side*4},{x:start.x+dir*(gain*.55),y:yWide},{x:start.x+dir*gain,y:yWide}];
    case 'draw':
    case 'delayed-handoff':
      return [start,{x:start.x-dir*1,y:y0},{x:start.x+dir*3,y:y0},{x:start.x+dir*(gain*.55),y:y0+side*4},{x:start.x+dir*gain,y:y0+side*6}];
    case 'trap-left':
    case 'trap-right':
      return [start,{x:start.x+dir*3,y:y0+side*2},{x:start.x+dir*(gain*.45),y:y0+side*10},{x:start.x+dir*gain,y:y0+side*6}];
    case 'toss-left':
    case 'toss-right':
    case 'sweep-left':
    case 'sweep-right':
    case 'crack-toss-left':
    case 'crack-toss-right':
      return [start,{x:start.x-dir*1,y:y0+side*7},{x:start.x+dir*(gain*.25),y:yWide},{x:start.x+dir*(gain*.65),y:yWide},{x:start.x+dir*gain,y:yWide-side*4}];
    case 'jet-sweep-left':
    case 'jet-sweep-right':
    case 'fly-sweep-left':
    case 'fly-sweep-right':
      return [start,{x:start.x-dir*3,y:gvClamp(y0-side*10,10,90)},{x:start.x-dir*.5,y:gvClamp(y0+side*13,8,92)},
        {x:start.x+dir*(gain*.28),y:gvClamp(y0+side*22,7,93)},{x:start.x+dir*(gain*.68),y:gvClamp(y0+side*24,7,93)},
        {x:start.x+dir*gain,y:gvClamp(y0+side*18,9,91)}];
    case 'end-around-left':
    case 'end-around-right':
      return [start,{x:start.x-dir*4,y:gvClamp(y0-side*5,10,90)},{x:start.x-dir*1,y:gvClamp(y0+side*13,8,92)},
        {x:start.x+dir*(gain*.22),y:gvClamp(y0+side*24,7,93)},{x:start.x+dir*(gain*.62),y:gvClamp(y0+side*25,7,93)},
        {x:start.x+dir*gain,y:gvClamp(y0+side*17,9,91)}];
    case 'reverse-left':
    case 'reverse-right':
      return [start,{x:start.x-dir*3,y:gvClamp(y0-side*13,8,92)},{x:start.x-dir*1.5,y:gvClamp(y0-side*19,7,93)},
        {x:start.x+dir*1,y:gvClamp(y0+side*8,8,92)},{x:start.x+dir*(gain*.36),y:gvClamp(y0+side*24,7,93)},
        {x:start.x+dir*gain,y:gvClamp(y0+side*18,9,91)}];
    case 'orbit-sweep-left':
    case 'orbit-sweep-right':
      return [start,{x:start.x-dir*6,y:gvClamp(y0-side*7,10,90)},{x:start.x-dir*5,y:gvClamp(y0+side*15,8,92)},
        {x:start.x+dir*1,y:gvClamp(y0+side*23,7,93)},{x:start.x+dir*(gain*.5),y:gvClamp(y0+side*24,7,93)},
        {x:start.x+dir*gain,y:gvClamp(y0+side*16,9,91)}];
    case 'off-tackle-left':
    case 'off-tackle-right':
      return [start,{x:start.x+dir*4,y:y0+side*4},{x:start.x+dir*(gain*.52),y:y0+side*12},{x:start.x+dir*gain,y:y0+side*10}];
    case 'dive':
    case 'goal-line-plunge':
      return [start,{x:start.x+dir*5,y:y0},{x:start.x+dir*(gain*.5),y:y0},{x:start.x+dir*gain,y:y0+side*2}];
    case 'cutback-left':
    case 'cutback-right':
      return [start,{x:start.x+dir*5,y:y0-side*7},{x:start.x+dir*(gain*.45),y:yCut},{x:start.x+dir*gain,y:y0+side*5}];
    case 'shotgun-run':
    case 'pistol-run':
      return [start,{x:start.x+dir*3,y:y0+side*3},{x:start.x+dir*(gain*.52),y:y0+side*9},{x:start.x+dir*gain,y:y0+side*7}];
    case 'bounce-left':
    case 'bounce-right':
      return [start,{x:start.x+dir*4,y:y0},{x:start.x+dir*(gain*.3),y:y0-side*3},{x:start.x+dir*(gain*.62),y:yWide},{x:start.x+dir*gain,y:yWide}];
    case 'breakaway-edge':
      return [start,{x:start.x+dir*4,y:y0+side*5},{x:start.x+dir*(gain*.4),y:yWide},{x:start.x+dir*gain,y:yWide}];
    case 'breakaway-middle':
    default:
      return [start,{x:start.x+dir*4,y:y0},{x:start.x+dir*(gain*.45),y:y0+(simRand(seed,94)-.5)*6},{x:start.x+dir*gain,y:y0+(simRand(seed,95)-.5)*8}];
  }
}
