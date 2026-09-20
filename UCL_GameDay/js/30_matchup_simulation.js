/* UCL GameDay v0.5.58 — build fragment: 30_matchup_simulation.js
   This file is concatenated in manifest order into the app's single lexical scope.
   It is intentionally not loaded independently in the browser. */
function chosenPair(){const pairs=matchupPairs();return pairs.find(p=>String(p.id)===String(featuredMatchupId))||pairForRoster($('#teamSelect')?.value)||pairs[0]}
function orientedPair(pair){if(!pair)return pair;const selected=String($('#teamSelect')?.value||'');const rows=pair.rows.slice();if(selected&&String(rows[1]?.roster_id)===selected)rows.reverse();return {...pair,rows}}

function momentumMatchupLeverage(pair,rid,by){
  const p=orientedPair(pair),left=p.rows[0],right=p.rows[1],leftId=String(left.roster_id),rightId=String(right.roster_id);
  const leftGain=(by[leftId]||[]).reduce((a,x)=>a+x,0),rightGain=(by[rightId]||[]).reduce((a,x)=>a+x,0);
  const beforeLeft=n(left.points)-leftGain,beforeRight=n(right.points)-rightGain;
  const afterLeft=n(left.points),afterRight=n(right.points);
  const beforeDiff=beforeLeft-beforeRight,afterDiff=afterLeft-afterRight,margin=Math.abs(afterDiff);
  let mult=margin<=3?1.38:margin<=7?1.26:margin<=14?1.14:margin<=21?1.07:1;
  const scoringLeft=String(rid)===leftId,beforeOwn=scoringLeft?beforeLeft:beforeRight,beforeOpp=scoringLeft?beforeRight:beforeLeft,afterOwn=scoringLeft?afterLeft:afterRight,afterOpp=scoringLeft?afterRight:afterLeft;
  if(beforeOwn<beforeOpp&&afterOwn>beforeOwn&&Math.abs(afterOwn-afterOpp)<Math.abs(beforeOwn-beforeOpp))mult+=.08;
  if((beforeDiff<0&&afterDiff>=0&&scoringLeft)||(beforeDiff>0&&afterDiff<=0&&!scoringLeft))mult+=.24;
  else if(afterDiff===0)mult+=.18;
  return Math.min(1.75,mult)
}

function momentumImpulse(delta){const d=Math.max(0,Number(delta)||0);if(d<.09)return 0;let base=7*Math.pow(d,.82);if(d<.5)base*=.28;else if(d<1)base*=.62;return base}
function realSessionInfo(now=Date.now()){
  // UCL scoring windows are fixed to Pacific Time because the league is California-based.
  // Intl keeps this correct across PST/PDT and ignores the viewer device's local timezone.
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now));
  const get=t=>parts.find(p=>p.type===t)?.value||'';
  const dow=get('weekday'),h=Number(get('hour'))+Number(get('minute'))/60;
  if(dow==='Wed')return {id:'wed',label:'Wednesday Kickoff'};
  if(dow==='Thu')return {id:'thu',label:'Thursday Night'};
  if(dow==='Fri')return {id:'fri',label:'Friday Night'};
  if(dow==='Sun'){if(h<17)return {id:'sun-day',label:'Sunday GameDay'};return {id:'snf',label:'Sunday Night'}}
  if(dow==='Mon'&&h>=16)return {id:'mnf',label:'Monday Night'};
  return {id:'idle',label:'Between Scoring Windows'};
}
function currentSessionInfo(now=gameNow()){return simulation.active?simulationSessionAt(simulation.elapsed):realSessionInfo(now)}
function momentumStore(pair){const key=String(pair.id);let store=momentumGames.get(key);if(!store){store={sessions:{},order:[],selected:null};momentumGames.set(key,store)}return store}
function momentumPreviousGame(store,sid){
  const idx=store.order.indexOf(sid);
  const ids=idx>0?store.order.slice(0,idx):store.order;
  for(let i=ids.length-1;i>=0;i--){const g=store.sessions[ids[i]];if(g&&g.sessionId!=='idle')return g}
  return null;
}
function ensureMomentumGame(pair,now=gameNow(),session=currentSessionInfo(now)){
  const p=orientedPair(pair),store=momentumStore(pair),sid=session?.id||'unknown',
    left=String(p.rows[0].roster_id),right=String(p.rows[1].roster_id);
  let g=store.sessions[sid];
  if(!g||g.leftRosterId!==left||g.rightRosterId!==right){
    const prev=momentumPreviousGame(store,sid);
    const carry=prev&&prev.leftRosterId===left&&prev.rightRosterId===right;
    const leftStart=carry?Number(prev.left||0):0,rightStart=carry?Number(prev.right||0):0;
    g={
      sessionId:sid,sessionLabel:session?.label||'Scoring Window',
      leftRosterId:left,rightRosterId:right,
      left:leftStart,right:rightStart,leftQuiet:0,rightQuiet:0,
      leftActive:false,rightActive:false,lastTime:now,
      history:[{t:now,left:leftStart,right:rightStart,carryIn:carry}]
    };
    store.sessions[sid]=g;
    if(!store.order.includes(sid))store.order.push(sid);
  }
  store.selected=store.selected||sid;
  return g
}
function simulationRosterActive(rosterId,sessionId){if(!simulation.active)return null;for(const m of matchups){if(String(m.roster_id)!==String(rosterId))continue;for(const id of (m.starters||[]).filter(Boolean)){const a=simulation.assignments.get(String(id));if(a&&a.sessionId===sessionId){const s=simulationSessionAt(simulation.elapsed),within=simulation.elapsed-s.start;if(within>=a.gameStart&&within<a.gameEnd)return true}}}return false}
function closeMomentumSession(sessionId,now=gameNow()){
  for(const pair of matchupPairs()){
    const store=momentumStore(pair),g=store.sessions[sessionId];if(!g)continue;
    g.leftActive=false;g.rightActive=false;
    // Preserve the final momentum value. Quiet days between NFL scoring windows are a
    // hold, not a decay/reset; the next scoring window carries this endpoint forward.
    g.leftQuiet=0;g.rightQuiet=0;g.lastTime=now;
    const last=g.history[g.history.length-1];
    if(!last||last.t!==now)g.history.push({t:now,left:g.left,right:g.right,sessionEnd:true});
    if(g.history.length>900)g.history=g.history.slice(-900)
  }
}
function updateMomentum(allDeltas,now=gameNow()){
  const session=currentSessionInfo(now);if(!session||session.id==='idle')return;
  for(const pair of matchupPairs()){
    const p=orientedPair(pair),g=ensureMomentumGame(pair,now,session),elapsed=Math.max(.05,(now-g.lastTime)/60000),by={};
    const rosterIds=(p.rows||[]).map(r=>String(r.roster_id));
    const addImpulse=(rid,value)=>{
      rid=String(rid||'');value=Number(value||0);
      if(!rosterIds.includes(rid)||!Number.isFinite(value)||Math.abs(value)<.0001)return;
      if(value>0)(by[rid]||(by[rid]=[])).push(value);
      else{
        // A legitimate negative fantasy event swings momentum to the opponent.
        // Corrections never reach this function from live capture.
        const opp=rosterIds.find(x=>x!==rid);
        if(opp)(by[opp]||(by[opp]=[])).push(Math.abs(value));
      }
    };
    for(const d of allDeltas||[]){
      if(Array.isArray(d?.fantasyImpacts)&&d.fantasyImpacts.length){
        for(const impact of d.fantasyImpacts)addImpulse(impact.rosterId,impact.delta);
      }else addImpulse(d?.rosterId,d?.delta);
    }
    for(const side of ['left','right']){
      const rid=g[side+'RosterId'],ds=by[rid]||[],sum=ds.reduce((a,x)=>a+x,0),count=ds.length;
      const simActive=simulationRosterActive(rid,session.id);
      if(simActive!==null)g[side+'Active']=simActive;else if(count)g[side+'Active']=true;
      let quiet=g[side+'Quiet']+elapsed;
      let decay=Math.exp(-.18*elapsed);
      if(quiet>3)decay*=Math.exp(-.11*Math.min(10,quiet-3)*elapsed);
      if(g[side+'Active']===false)decay*=Math.exp(-1.15*elapsed);
      g[side]*=decay;
      if(count){
        const combo=1+Math.min(.8,.18*Math.max(0,count-1)+.035*Math.max(0,sum-5));
        const leverage=momentumMatchupLeverage(pair,rid,by);
        const impulse=ds.reduce((a,x)=>a+momentumImpulse(x),0)*combo*leverage;
        g[side]=Math.min(100,g[side]+impulse);
        quiet=0;
      }
      if(g[side]<.15)g[side]=0;
      g[side+'Quiet']=quiet;
    }
    g.lastTime=now;g.history.push({t:now,left:g.left,right:g.right});
    if(g.history.length>900)g.history=g.history.slice(-900);
  }
}
function drawMomentumCanvas(canvas,g){if(!canvas||!g)return;const dpr=Math.max(1,window.devicePixelRatio||1),rect=canvas.getBoundingClientRect(),w=Math.max(320,rect.width),h=Math.max(180,rect.height);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);const pad={l:12,r:12,t:14,b:14},mid=h/2,amp=mid-pad.t-7;c.strokeStyle='#cfd8e5';c.lineWidth=1;c.beginPath();c.moveTo(pad.l,mid);c.lineTo(w-pad.r,mid);c.stroke();const hist=g.history||[];if(hist.length<2)return;const t0=hist[0].t,t1=hist[hist.length-1].t||t0+1;const xFor=t=>pad.l+(w-pad.l-pad.r)*((t-t0)/Math.max(1,t1-t0));function line(side,color,dir,active){if(!active&&!hist.some(p=>Number(p[side])>.15))return;c.strokeStyle=color;c.lineWidth=2.4;c.lineJoin='round';c.lineCap='round';c.beginPath();hist.forEach((p,i)=>{const x=xFor(p.t),y=mid-dir*(Math.min(100,p[side])/100)*amp;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()}line('left','#2367d1',1,g.leftActive);line('right','#c73a3a',-1,g.rightActive)}
function renderMomentum(pair){
  const p=orientedPair(pair),root=$('#momentum');if(!root||!p)return;
  const session=currentSessionInfo(),store=momentumStore(pair),now=gameNow();

  // Do not create a fake zero-valued "idle" session between Thursday and Sunday.
  // During quiet gaps show the most recent real scoring window and hold its endpoint.
  if(session?.id!=='idle')ensureMomentumGame(pair,now,session);
  const currentId=session?.id!=='idle'?session.id:null;
  const latestReal=[...store.order].reverse().find(id=>id!=='idle'&&store.sessions[id]);
  const selected=(store.selected&&store.sessions[store.selected]&&store.selected!=='idle')?store.selected:(currentId||latestReal);
  const g=selected?store.sessions[selected]:null;

  if(!g){
    root.innerHTML='<div class="empty">Momentum will begin when the first scoring play is detected.</div>';
    return
  }

  const lr=rosterFor(p.rows[0].roster_id),rr=rosterFor(p.rows[1].roster_id),
    leftShown=g.leftActive||g.history.some(x=>x.left>.15),rightShown=g.rightActive||g.history.some(x=>x.right>.15);
  const opts=store.order.filter(id=>id!=='idle'&&store.sessions[id]).map(id=>`<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(store.sessions[id].sessionLabel)}</option>`).join('');
  const isQuiet=session?.id==='idle',isCurrent=selected===currentId;
  const center=isQuiet?'BETWEEN SCORING WINDOWS':(isCurrent?'LIVE MOMENTUM':'SESSION HISTORY');
  const label=isQuiet?`${g.sessionLabel} • holding through quiet period`:g.sessionLabel;

  root.innerHTML=`<div class="momentum-session">${esc(label)}${store.order.filter(id=>id!=='idle').length>1?`<select id="momentumSessionSelect" aria-label="Momentum scoring window">${opts}</select>`:''}</div>
    <div class="momentum-summary">
      <div class="momentum-side blue ${leftShown?'':'inactive'}"><b>${esc(teamName(lr))}</b><span>Momentum ${Math.round(g.left)}</span></div>
      <div class="momentum-now">${center}</div>
      <div class="momentum-side red right ${rightShown?'':'inactive'}"><b>${esc(teamName(rr))}</b><span>Momentum ${Math.round(g.right)}</span></div>
    </div>
    <canvas class="momentum-canvas" id="momentumCanvas" aria-label="Game momentum chart"></canvas>
    <div class="momentum-legend"><span class="momentum-key ${leftShown?'':'inactive'}"><i class="blue"></i>Left team</span><span class="momentum-key ${rightShown?'':'inactive'}"><i class="red"></i>Right team</span></div>
    <div class="momentum-note">${isQuiet?'Momentum is held from the last scoring window; no artificial Friday/Saturday movement is added.':'Momentum rises only from detected fantasy scoring events and carries forward between scoring windows.'}</div>`;
  const ss=$('#momentumSessionSelect');if(ss)ss.onchange=()=>{store.selected=ss.value;renderMomentum(pair)};
  requestAnimationFrame(()=>drawMomentumCanvas($('#momentumCanvas'),g))
}
function clone(v){return JSON.parse(JSON.stringify(v))}
const SIM_SESSION_LIBRARY={
  wed:{id:'wed',label:'Wednesday Kickoff',duration:210*60},
  thu:{id:'thu',label:'Thursday Night',duration:210*60},
  fri:{id:'fri',label:'Friday Night',duration:210*60},
  'sun-day':{id:'sun-day',label:'Sunday GameDay',duration:390*60},
  snf:{id:'snf',label:'Sunday Night',duration:210*60},
  mnf:{id:'mnf',label:'Monday Night',duration:210*60}
};
const SIM_POSITION_PROFILE={
  QB:{mean:24,sd:7.5,min:8,max:45,events:[14,22]},
  RB:{mean:14.5,sd:8,min:1,max:38,events:[10,17]},
  WR:{mean:15,sd:9,min:1,max:42,events:[8,15]},
  TE:{mean:10,sd:6,min:1,max:30,events:[7,13]},
  K:{mean:9,sd:4.5,min:0,max:22,events:[4,8]},
  DEF:{mean:8,sd:6,min:-2,max:28,events:[4,8]}
};
function simulationTimeline(){let ids;if(['quick','burst30','burst60'].includes(simulation.scenario)){const duration=simulation.scenario==='quick'?10:simulation.scenario==='burst30'?30:60;return [{id:simulation.scenario,label:'GameView Test',duration,start:0,end:duration}]}if(simulation.scenario==='sunday')ids=['sun-day'];else if(simulation.scenario==='night')ids=[['thu','fri','mnf'][assignmentHash('night-football')%3]];else ids=['thu','sun-day','snf','mnf'];let at=0;return ids.map(id=>{const x={...SIM_SESSION_LIBRARY[id],start:at,end:at+SIM_SESSION_LIBRARY[id].duration};at=x.end;return x})}
function refreshSimulationTotal(){const tl=simulationTimeline();simulation.total=tl.length?tl[tl.length-1].end:(simulation.scenario==='quick'?10:390*60);return tl}
function simulationSessionAt(seconds=simulation.elapsed){const tl=simulationTimeline(),s=Math.max(0,Number(seconds)||0);return tl.find(x=>s>=x.start&&s<x.end)||tl[tl.length-1]||{id:'sun-day',label:'Sunday GameDay',start:0,end:simulation.total,duration:simulation.total}}
function sessionClockLabel(seconds=simulation.elapsed){const x=simulationSessionAt(seconds),within=Math.max(0,Math.min(x.duration,seconds-x.start)),h=Math.floor(within/3600),m=Math.floor((within%3600)/60),sec=Math.floor(within%60);return `${x.label} • ${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
function simTimeLabel(seconds=simulation.elapsed){return sessionClockLabel(seconds)}
function gameNow(){return simulation.active?simulation.virtualStart+simulation.elapsed*1000:Date.now()}
function assignmentHash(v){let h=2166136261;for(const ch of String(v)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function simRand(seed,salt=0){let x=(Number(seed)||1)^Math.imul(Number(salt)+1,0x9e3779b1);x^=x<<13;x^=x>>>17;x^=x<<5;return ((x>>>0)%1000000)/1000000}
function simNormal(seed,salt=0){const u1=Math.max(.00001,simRand(seed,salt)),u2=simRand(seed,salt+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function simGameDuration(seed){return (150+Math.floor(simRand(seed,91)*61))*60}

function singleGameScenario(){return simulation.scenario==='night'}
function singleGameSelectedStarters(){
  const selected=new Set(),pairs=matchupPairs(),candidates=[];
  for(const pair of pairs){
    const pairRows=pair.rows||[];
    const pairPlayers=[];
    for(const m of pairRows){
      for(const pid of (m.starters||[]).filter(Boolean))pairPlayers.push({pid:String(pid),rosterId:String(m.roster_id),pairId:String(pair.id)});
    }
    const maxForPair=Math.min(2,pairPlayers.length);
    const desired=assignmentHash(`single|${simulation.scenario}|${pair.id}`)%3; // 0-2
    const take=Math.min(maxForPair,desired);
    pairPlayers.sort((a,b)=>assignmentHash(a.pid+simulation.scenario)-assignmentHash(b.pid+simulation.scenario));
    for(let i=0;i<take;i++)candidates.push(pairPlayers[i]);
  }
  candidates.sort((a,b)=>assignmentHash(a.pid+'league')-assignmentHash(b.pid+'league'));
  for(const x of candidates.slice(0,6))selected.add(x.pid);
  return selected
}



function gvQuickBurstScenario(){
  return quickGameViewScenario();
}
function simulationTandemCandidate(){
  if(!gvQuickBurstScenario()||Math.random()>=0.5)return null;
  const pair=chosenPair?.();if(!pair)return null;
  const leftRoster=rosterFor(pair.rows?.[0]?.roster_id),rightRoster=rosterFor(pair.rows?.[1]?.roster_id);
  const preferred=leftRoster||rightRoster;
  if(!preferred)return null;
  const ids=[...(preferred.players||[])];
  const qbs=ids.filter(id=>String(playerInfo(id).pos||'').toUpperCase()==='QB');
  const elig=ids.filter(id=>['WR','TE','RB'].includes(String(playerInfo(id).pos||'').toUpperCase()));
  if(!qbs.length||!elig.length)return null;

  const sameTeamPairs=[];
  for(const qbId of qbs){
    const qb=playerInfo(qbId);
    if(!qb.team||qb.team==='FA')continue;
    for(const recId of elig){
      const rec=playerInfo(recId);
      if(rec.team&&rec.team===qb.team){
        sameTeamPairs.push({qbId:String(qbId),qb,recId:String(recId),rec});
      }
    }
  }
  if(!sameTeamPairs.length)return null;
  const pick=sameTeamPairs[Math.floor(Math.random()*sameTeamPairs.length)];
  return {
    qbId:pick.qbId,qb:pick.qb,
    wrId:pick.recId,wr:pick.rec,
    rosterId:String(preferred.roster_id),
    nflTeam:pick.qb.team
  };
}
function buildSimulationTandemEvent(baseEvent,tandem){
  if(!baseEvent||!tandem)return baseEvent;
  const yards=Math.max(6,Math.round(8+Math.random()*28));
  const delta=Number(baseEvent.delta||0);
  const receiverImpact={
    rosterId:String(tandem.rosterId||baseEvent.rosterId||''),
    playerId:String(tandem.wrId||''),
    name:tandem.wr.name||'Receiver',
    pos:tandem.wr.pos||'WR',
    role:'receiver',
    delta
  };
  return {
    ...baseEvent,
    id:`${baseEvent.id}-tandem`,
    type:'play',
    source:'simulation',
    rosterId:tandem.rosterId,
    side:'left',
    multiActor:true,
    playType:'qb_pass',
    qbPlayerId:tandem.qbId,
    qbName:tandem.qb.name,
    qbPos:'QB',
    qbNflTeam:tandem.nflTeam,
    receiverPlayerId:tandem.wrId,
    receiverName:tandem.wr.name,
    receiverPos:tandem.wr.pos||'WR',
    receiverNflTeam:tandem.nflTeam,
    playerId:tandem.wrId,
    name:tandem.wr.name,
    pos:tandem.wr.pos||'WR',
    nflTeam:tandem.nflTeam,
    detail:`${yards}-yard reception`,
    correlated:true,
    simulatedTandem:true,
    fantasyImpacts:[receiverImpact],
    delta
  };
}

function normalizeSimulationScenarioId(value){
  const v=String(value||'full');
  if(v==='quick10')return 'quick';
  if(v==='quick30')return 'burst30';
  if(v==='quick60')return 'burst60';
  return v;
}
function quickGameViewScenario(){
  return ['quick','burst30','burst60'].includes(normalizeSimulationScenarioId(simulation.scenario));
}
function quickGameViewStarters(){
  const selectedRoster=String($('#teamSelect')?.value||''),pair=pairForRoster(selectedRoster),pool=[];
  if(pair)for(const m of pair.rows||[])for(const pid of (m.starters||[]).filter(Boolean))pool.push({pid:String(pid),rosterId:String(m.roster_id)});
  if(!pool.length)return [];
  pool.sort((a,b)=>assignmentHash(a.pid+'quick')-assignmentHash(b.pid+'quick'));
  if(pool.length===1)return pool;
  const first=pool[assignmentHash(selectedRoster+'quick-a')%pool.length];
  let second=pool[assignmentHash(selectedRoster+'quick-b')%pool.length];
  if(second.pid===first.pid)second=pool[(pool.indexOf(second)+1)%pool.length];
  return [first,second];
}

function buildSimulationAssignments(){
  simulation.assignments=new Map();
  const timeline=simulationTimeline(),ids=timeline.map(x=>x.id),weights=ids.map(id=>id==='sun-day'?66:(id==='thu'?14:id==='snf'?9:id==='mnf'?9:6)),total=weights.reduce((a,b)=>a+b,0),teamSession=new Map(),teamSundayWindow=new Map(),singleSelected=singleGameScenario()?singleGameSelectedStarters():null,quickSelected=quickGameViewScenario()?new Set(quickGameViewStarters().map(x=>x.pid)):null;
  for(const m of matchups){
    for(const pid of (m.starters||[]).filter(Boolean)){
      if(singleSelected&&!singleSelected.has(String(pid)))continue;
      if(quickSelected&&!quickSelected.has(String(pid)))continue;
      const p=playerInfo(pid),key=p.team&&p.team!=='FA'?p.team:String(pid),seed=assignmentHash(key);
      if(!teamSession.has(key)){
        if(singleGameScenario())teamSession.set(key,ids[0]);
        else{
          let x=seed%total,chosen=ids[0];
          for(let i=0;i<ids.length;i++){if(x<weights[i]){chosen=ids[i];break}x-=weights[i]}
          teamSession.set(key,chosen);
        }
      }
      let sessionId=teamSession.get(key),session=timeline.find(x=>x.id===sessionId)||timeline[0];
      if(quickGameViewScenario()){sessionId=timeline[0].id;session=timeline[0];}
      let gameStart=0,window='prime';
      if(sessionId==='sun-day'){
        if(!teamSundayWindow.has(key))teamSundayWindow.set(key,(assignmentHash(key+'-window')%100)<64?'early':'late');
        window=teamSundayWindow.get(key);
        gameStart=window==='early'?Math.floor(simRand(seed,11)*6*60):(185+Math.floor(simRand(seed,12)*22))*60;
      }else if(quickGameViewScenario())gameStart=0;
      else gameStart=Math.floor(simRand(seed,13)*6*60);
      const gameEnd=quickGameViewScenario()?session.duration:Math.min(session.duration,gameStart+simGameDuration(seed));
      simulation.assignments.set(String(pid),{sessionId,window,gameStart,gameEnd,sessionStart:session.start,sessionEnd:session.end});
    }
  }
}
function simulationMatchups(){
  const existing=matchupPairs();
  if(existing.length){
    return matchups.map(m=>{const r=rosterFor(m.roster_id),starters=(m.starters&&m.starters.length?m.starters:r?.starters||[]).filter(Boolean),playersList=(m.players&&m.players.length?m.players:r?.players||starters).filter(Boolean);return {...clone(m),starters,players:playersList,points:0,custom_points:null,players_points:Object.fromEntries(playersList.map(id=>[String(id),0]))}})
  }
  const rows=[];for(let i=0;i<rosters.length;i+=2){for(let j=0;j<2&&i+j<rosters.length;j++){const r=rosters[i+j],starters=(r.starters||[]).filter(Boolean),plist=(r.players||starters).filter(Boolean);rows.push({matchup_id:Math.floor(i/2)+1,roster_id:r.roster_id,starters,players:plist,points:0,players_points:Object.fromEntries(plist.map(id=>[String(id),0]))})}}return rows
}
function simProfile(pos){const p=String(pos||'').toUpperCase()==='DST'?'DEF':String(pos||'').toUpperCase();return SIM_POSITION_PROFILE[p]||SIM_POSITION_PROFILE.WR}
function simTargetTotal(pos,seed){
  const p=simProfile(pos),styleMean=simulation.style==='high'?1.50:simulation.style==='defensive'?.82:simulation.style==='chaos'?1.04:1,styleSd=simulation.style==='high'?1.22:simulation.style==='chaos'?1.18:simulation.style==='defensive'?.82:1;
  let target=p.mean*styleMean+simNormal(seed,40)*p.sd*styleSd;
  if(simRand(seed,43)<.08)target+=p.sd*(1.2+simRand(seed,44)*1.4);
  return Math.max(p.min,Math.min(p.max,target));
}
function simEventCount(pos,seed){
  const p=simProfile(pos),[lo,hi]=p.events;let count=lo+Math.floor(simRand(seed,31)*(hi-lo+1));
  if(simulation.style==='chaos')count=Math.round(count*1.12);
  if(simulation.style==='high')count=Math.round(count*1.22);
  if(simulation.style==='defensive')count=Math.max(3,Math.round(count*.88));
  return count;
}
function simEventWeight(pos,seed,i){
  const p=String(pos||'').toUpperCase()==='DST'?'DEF':String(pos||'').toUpperCase(),r=simRand(seed,500+i);
  if(p==='K'){if(r<.12)return 5;if(r<.27)return 4;if(r<.68)return 3;return 1}
  if(p==='DEF'){if(r<.08)return 8;if(r<.18)return 6;if(r<.45)return 2;return 1}
  if(p==='QB'){if(r<.11)return 5.2;if(r<.31)return 2.2;if(r<.70)return 1.05;return .35}
  if(['RB','WR','TE'].includes(p)){if(r<.11)return 6.4;if(r<.32)return 2.4;if(r<.72)return 1.15;return .45}
  return 1
}
// v0.5.02: simulated GameDay is stat-first. Every scheduled event produces a
// Sleeper-shaped stat delta, and its fantasy-point delta is calculated from the
// league's scoring_settings. This lets Live Lineups, delta interpretation, and
// GameView all consume the same kind of information they receive on a live Sunday.
function simScoreStats(stats,pos=''){return uclScoreStats(stats,pos)}
function simMergeStats(base,delta){
  const out={...(base||{})};
  for(const [k,v] of Object.entries(delta||{}))out[k]=Number(((Number(out[k])||0)+(Number(v)||0)).toFixed(3));
  return out;
}
function simStatEvent(pos,desired,seed=1){
  const p=String(pos||'').toUpperCase()==='DST'?'DEF':String(pos||'').toUpperCase();
  const h=assignmentHash(`${seed}|stat-event`),r=simRand(h,1),r2=simRand(h,2),want=Math.abs(Number(desired)||0);
  let stats={},detail='Stat update';
  if(p==='QB'){
    if(r<.13){stats={pass_att:1,pass_int:1};detail='Interception thrown'}
    else if(want>=4.2||r<.30){const y=12+Math.round(r2*38);stats={pass_att:1,pass_cmp:1,pass_yd:y,pass_td:1};detail=`Touchdown pass • ${y} yards`}
    else if(r<.48){const y=2+Math.round(r2*20);stats={rush_att:1,rush_yd:y};if(want>=5.5&&r2>.58){stats.rush_td=1;detail=`Rushing touchdown • ${y} yards`}else detail=`${y} rushing yards`}
    else{const y=4+Math.round(r2*34);stats={pass_att:1,pass_cmp:1,pass_yd:y};detail=`Completion • ${y} yards`}
  }else if(p==='RB'){
    if(r<.08){stats={fum_lost:1};detail='Fumble lost'}
    else if(r<.29){const y=1+Math.round(r2*25);stats={rush_att:1,rush_yd:y,rush_td:1};detail=`Rushing touchdown • ${y} yards`}
    else if(r<.66){const y=1+Math.round(r2*18);stats={rush_att:1,rush_yd:y};detail=`Rush • ${y} yards`}
    else{const y=2+Math.round(r2*27);stats={rec:1,rec_yd:y};if(want>=6&&r2>.60){stats.rec_td=1;detail=`Receiving touchdown • ${y} yards`}else detail=`Reception • ${y} yards`}
  }else if(p==='WR'||p==='TE'){
    if(r<.07){stats={fum_lost:1};detail='Fumble lost'}
    else if(r<.31){const y=5+Math.round(r2*42);stats={rec:1,rec_yd:y,rec_td:1};detail=`Receiving touchdown • ${y} yards`}
    else if(r<.91){const y=3+Math.round(r2*34);stats={rec:1,rec_yd:y};detail=`Reception • ${y} yards`}
    else{const y=2+Math.round(r2*19);stats={rush_att:1,rush_yd:y};detail=`Rush • ${y} yards`}
  }else if(p==='K'){
    if(r<.26){stats={xpm:1};detail='Extra point made'}
    else{const y=20+Math.round(r2*39);stats={fgm:1,fgm_yds_over_30:Math.max(0,y-30)};if(y>=50)stats.fgm_50p=1;else if(y>=40)stats.fgm_40_49=1;else if(y>=30)stats.fgm_30_39=1;else if(y>=20)stats.fgm_20_29=1;else stats.fgm_0_19=1;detail=`${y}-yard field goal`}
  }else if(p==='DEF'){
    if(r<.12){const y=Math.round(r2*45);stats={int:1,def_int_ret_yd:y,def_td:1};detail=`Interception return touchdown • ${y} yards`}
    else if(r<.24){const y=Math.round(r2*35);stats={fum_rec:1,fum_rec_yd:y,def_td:1};detail=`Fumble return touchdown • ${y} yards`}
    else if(r<.44){stats={int:1};detail='Interception'}
    else if(r<.61){stats={fum_rec:1};detail='Fumble recovery'}
    else{stats={sack:1};detail='Sack'}
  }else{
    const y=3+Math.round(r2*30);stats={rec:1,rec_yd:y};detail=`Reception • ${y} yards`;
  }
  return {stats,delta:simScoreStats(stats,p),detail};
}
function simResetStatBoard(){
  gameViewStats={};lastGameViewStats={};gameViewStatsAt=Date.now();
  for(const m of matchups)for(const id of (m.players||m.starters||[]).filter(Boolean))gameViewStats[String(id)]={};
}
function buildSimulationScoreSchedule(){
  const schedule=[];
  const pushStatEvent=(base,desired,seed)=>{const made=simStatEvent(base.pos,desired,seed);schedule.push({...base,delta:made.delta,stats:made.stats,detail:made.detail})};
  if(quickGameViewScenario()){
    const selected=quickGameViewStarters(),duration=simulationTimeline()[0].duration,eventCount=simulation.scenario==='quick'?2:simulation.scenario==='burst30'?5:8;
    if(!selected.length){simulation.scoreSchedule=[];simulation.scoreCursor=0;return}
    for(let i=0;i<eventCount;i++){
      const x=selected[i%selected.length],p=playerInfo(x.pid),seed=assignmentHash(`${x.pid}|${simulation.scenario}|${i}`);
      let desired=simTargetTotal(p.pos,seed)*(simulation.scenario==='quick'?(i===0?.28:.55):.20+.22*simRand(seed,9));
      if(simulation.scenario==='quick'&&i===1)desired=Math.max(6,desired);else desired=Math.max(.7,Math.min(12.5,desired));
      const t=eventCount===1?duration/2:2+(duration-4)*(i/(eventCount-1));
      pushStatEvent({t,rosterId:x.rosterId,playerId:x.pid,pos:p.pos},desired,`${x.pid}|${i}|quick`);
    }
    simulation.scoreSchedule=schedule;simulation.scoreCursor=0;return;
  }
  for(const m of matchups){
    for(const id of (m.starters||[]).filter(Boolean)){
      const key=String(id),a=simulation.assignments.get(key);if(!a)continue;
      const p=playerInfo(key),seed=assignmentHash(`${key}|${a.sessionId}|${a.window}`),count=simEventCount(p.pos,seed),target=simTargetTotal(p.pos,seed),span=Math.max(900,a.gameEnd-a.gameStart),raw=[];
      for(let i=0;i<count;i++)raw.push(simEventWeight(p.pos,seed,i));
      const rawSum=Math.max(.01,raw.reduce((x,y)=>x+y,0)),scale=target/rawSum;
      for(let i=0;i<count;i++){
        const u=(i+.25+simRand(seed,100+i)*.7)/count,jitter=(simRand(seed,300+i)-.5)*(span/count)*.95;
        let within=a.gameStart+u*span+jitter;within=Math.max(a.gameStart+20,Math.min(a.gameEnd-10,within));
        const desired=Number((raw[i]*scale).toFixed(2));
        pushStatEvent({t:a.sessionStart+within,rosterId:String(m.roster_id),playerId:key,pos:p.pos},desired,`${key}|${i}|${a.sessionId}`);
      }
    }
  }
  schedule.sort((a,b)=>a.t-b.t||a.rosterId.localeCompare(b.rosterId));simulation.scoreSchedule=schedule;simulation.scoreCursor=0;
}
function simulationRosterActive(rosterId,sessionId){
  if(!simulation.active)return null;
  const session=simulationSessionAt(simulation.elapsed),within=simulation.elapsed-session.start;
  for(const m of matchups){
    if(String(m.roster_id)!==String(rosterId))continue;
    for(const id of (m.starters||[]).filter(Boolean)){
      const a=simulation.assignments.get(String(id));
      if(a&&a.sessionId===sessionId&&within>=a.gameStart&&within<a.gameEnd)return true;
    }
  }
  return false
}
function applyScheduledSimEvent(e){
  const m=matchups.find(x=>String(x.roster_id)===String(e.rosterId));if(!m)return;
  const pid=String(e.playerId),stats=e.stats||{},computed=simScoreStats(stats,e.pos||playerInfo(pid)?.pos||'');
  // The schedule may carry a preview delta for diagnostics, but the scoreboard is
  // always driven by re-scoring the actual simulated stats at arrival time.
  e.delta=computed;
  gameViewStats[pid]=simMergeStats(gameViewStats[pid],stats);gameViewStatsAt=Date.now();
  if(e.detail)simPlayDetails.set(`${e.rosterId}:${pid}`,e.detail);
  const map=m.players_points||(m.players_points={}),old=n(map[pid]),next=old+computed;
  map[pid]=Number(next.toFixed(2));
  m.points=Number((m.starters||[]).reduce((sum,id)=>sum+n(map[String(id)]),0).toFixed(2));
}
function generateSimulationScoring(oldElapsed,newElapsed){
  const schedule=simulation.scoreSchedule||[];
  // Exactly like a real poll, preserve the previous stat snapshot before applying
  // every stat change that arrived in this simulated interval.
  lastGameViewStats=clone(gameViewStats||{});
  while(simulation.scoreCursor<schedule.length&&schedule[simulation.scoreCursor].t<=newElapsed){const e=schedule[simulation.scoreCursor++];if(e.t>oldElapsed)applyScheduledSimEvent(e)}
}
function updateSimulationUi(){
  const speedSel=$('#simSpeed');
  if(speedSel){speedSel.disabled=quickGameViewScenario();if(quickGameViewScenario())speedSel.value='1'}
  const banner=$('#simBanner'),status=$('#simStatus'),start=$('#simStart'),pause=$('#simPause'),stop=$('#simStop');
  if(banner){banner.classList.toggle('show',simulation.active);$('#simClock').textContent=simTimeLabel();const sx=simulationSessionAt(simulation.elapsed);$('#simBannerDetail').innerHTML=simulation.paused?`${simulation.speed}× test paused • <span class="sim-session">${esc(sx.label)}</span>`:`${simulation.speed}× accelerated scoring • <span class="sim-session">${esc(sx.label)}</span> • ${simulation.style==='chaos'?'UCL Chaos':simulation.style==='defensive'?'Low scoring':'Balanced'}`}
  if(status)status.innerHTML=simulation.active?`<b>${simulation.paused?'Paused':'Simulation active'}</b> • ${simulation.speed}× • ${simTimeLabel()} / 4:00:00. Stats are simulated first and converted through the league scoring rules; live Sleeper scoring is temporarily ignored.`:`Simulation is off. GameDay is using the ${liveLoadingEnabled()?'current live/saved':'saved local'} matchup snapshot.`;
  if(start)start.disabled=false;if(pause){pause.disabled=!simulation.active;pause.textContent=simulation.paused?'Resume':'Pause'}if(stop)stop.disabled=!simulation.active;
  const refresh=$('#refreshBtn');if(refresh){refresh.disabled=simulation.active||!liveLoadingEnabled();setRefreshButtonLabel(simulation.active?'Simulation Active':liveLoadingEnabled()?'Refresh Live':'Live Loading Off')}
}

let lastNonQuickSimulationSpeed=Number(storage.get('ucl-gameday-last-sim-speed',storage.get('ucl-gameday-sim-speed','20')))||20;
function applySimulationScenarioChoice(next){
  const speedSel=$('#simSpeed');
  if(!speedSel)return;
  if(['quick','burst30','burst60'].includes(next)){
    if(!quickGameViewScenario()){
      lastNonQuickSimulationSpeed=Number(speedSel.value)||simulation.speed||20;
      storage.set('ucl-gameday-last-sim-speed',String(lastNonQuickSimulationSpeed));
    }
    simulation.scenario='quick';
    simulation.speed=1;
    speedSel.value='1';
    speedSel.disabled=true;
  }else{
    const leavingQuick=quickGameViewScenario();
    simulation.scenario=next;
    speedSel.disabled=false;
    if(leavingQuick){
      const restore=Number(storage.get('ucl-gameday-last-sim-speed',String(lastNonQuickSimulationSpeed)))||20;
      simulation.speed=restore;
      speedSel.value=String(restore);
    }
  }
}
function rememberSimulationSpeed(){
  if(quickGameViewScenario())return;
  const value=Number($('#simSpeed')?.value)||20;
  simulation.speed=value;
  lastNonQuickSimulationSpeed=value;
  storage.set('ucl-gameday-last-sim-speed',String(value));
  storage.set('ucl-gameday-sim-speed',String(value));
}


function clearSimulationTransientState(preserveGameView=false){
  if(simulation.loop){clearInterval(simulation.loop);simulation.loop=null}
  simulation.active=false;simulation.paused=false;simulation.elapsed=0;simulation.total=0;simulation.scoreSchedule=[];simulation.scoreCursor=0;simulation.assignments=new Map();simulation.lastSessionId=null;
  events=[];lastSnapshot={};momentumGames.clear();for(const k of Object.keys(simScoreHistory))delete simScoreHistory[k];if(simPlayDetails)simPlayDetails.clear();
  if(!preserveGameView)cancelGameViewPlayback(true);
}
async function restoreAfterSimulation({preserveGameView=false,preserveView=false}={}){
  const live=simulation.liveMatchups?clone(simulation.liveMatchups):null,current=currentView;
  clearSimulationTransientState(preserveGameView);
  simulation.liveMatchups=null;
  if(live)matchups=live;else if(!liveLoadingEnabled())restoreLiveSnapshot();
  if(simulation.liveGameViewStats){gameViewStats=clone(simulation.liveGameViewStats);lastGameViewStats=clone(simulation.liveLastGameViewStats||{});gameViewStatsAt=Number(simulation.liveGameViewStatsAt||0)}
  simulation.liveGameViewStats=null;simulation.liveLastGameViewStats=null;simulation.liveGameViewStatsAt=0;
  if(liveLoadingEnabled()&&!busy)await sync();else{render();updateLiveLoadingUi()}
  updateSimulationUi();
  if(preserveView&&current==='gameview')setView('gameview');
}

async function startSimulation(){
  if(simulation.active){
    const preservedLive=simulation.liveMatchups?clone(simulation.liveMatchups):null;
    const preservedStats=simulation.liveGameViewStats?clone(simulation.liveGameViewStats):null;
    const preservedPrevStats=simulation.liveLastGameViewStats?clone(simulation.liveLastGameViewStats):{};
    const preservedStatsAt=simulation.liveGameViewStatsAt;
    clearSimulationTransientState();
    if(preservedLive)matchups=preservedLive;
    if(preservedStats){gameViewStats=preservedStats;lastGameViewStats=preservedPrevStats;gameViewStatsAt=Number(preservedStatsAt||0)}
    simulation.liveMatchups=null;simulation.liveGameViewStats=null;simulation.liveLastGameViewStats=null;simulation.liveGameViewStatsAt=0;
  }
  if(!matchups.length||!rosters.length){
    loadRosterCache();
    if(!liveLoadingEnabled()&&(!matchups.length||!rosters.length))restoreLiveSnapshot();
    if(!matchups.length||!rosters.length){
      const status=$('#simStatus');if(status)status.innerHTML='<b>Simulation unavailable</b> • No saved matchup data available.';
      return;
    }
  }
  if(!rosters.length||!Object.keys(players).length){await sync();if(!rosters.length)return}
  simulation.scenario=normalizeSimulationScenarioId($('#simScenario')?.value||'full');simulation.speed=quickGameViewScenario()?1:(Number($('#simSpeed')?.value)||20);simulation.style=$('#simStyle')?.value||'chaos';storage.set('ucl-gameday-sim-speed',String(simulation.speed));storage.set('ucl-gameday-sim-style',simulation.style);storage.set('ucl-gameday-sim-scenario',simulation.scenario);
  cancelGameViewPlayback(true);saveRosterCache();simulation.liveMatchups=clone(matchups);simulation.liveGameViewStats=clone(gameViewStats||{});simulation.liveLastGameViewStats=clone(lastGameViewStats||{});simulation.liveGameViewStatsAt=gameViewStatsAt;matchups=simulationMatchups();simResetStatBoard();simulation.active=true;simulation.paused=false;simulation.elapsed=0;refreshSimulationTotal();buildSimulationAssignments();buildSimulationScoreSchedule();simulation.lastSessionId=simulationSessionAt(0).id;simulation.lastReal=performance.now();simulation.virtualStart=Date.now();events=[];lastSnapshot={};momentumGames.clear();snapshotAndEvents();
  if(!featuredMatchupId)featuredMatchupId=pairForRoster($('#teamSelect')?.value)?.id||matchupPairs()[0]?.id||null;updateSimulationUi();
  closeSettings();
  if(simOpenGameViewEnabled())setView('gameview');else setView(currentView==='gameview'?'gameview':'gameday');
  window.scrollTo({top:0,behavior:'smooth'});
  if(currentView==='gameview')renderGameView();else render();
  if(simulation.loop)clearInterval(simulation.loop);simulation.loop=setInterval(simulationTick,250)
}
async function simulationTick(){
  if(!simulation.active||simulation.paused)return;
  const now=performance.now(),realSec=Math.max(.2,(now-simulation.lastReal)/1000);simulation.lastReal=now;
  const advance=realSec*simulation.speed,oldElapsed=simulation.elapsed,oldSession=simulationSessionAt(oldElapsed);
  simulation.elapsed=Math.min(simulation.total,simulation.elapsed+advance);
  const newSession=simulationSessionAt(simulation.elapsed);
  if(oldSession.id!==newSession.id){closeMomentumSession(oldSession.id,simulation.virtualStart+oldSession.end*1000);for(const store of momentumGames.values())store.selected=newSession.id;events.unshift({separator:true,time:gameNow(),sessionLabel:newSession.label});lastSnapshot={};snapshotAndEvents()}
  generateSimulationScoring(oldElapsed,simulation.elapsed);snapshotAndEvents();simulation.lastSessionId=newSession.id;
  $('#weekLabel').textContent=`Week ${n(nflState?.week)||1} • SIM`;if($('#liveDot'))$('#liveDot').classList.add('on');updateSimulationUi();render();
  if(simulation.elapsed>=simulation.total){closeMomentumSession(newSession.id,gameNow());await restoreAfterSimulation({preserveGameView:true,preserveView:true});return}
}
function toggleSimulationPause(){if(!simulation.active)return;simulation.paused=!simulation.paused;simulation.lastReal=performance.now();updateSimulationUi()}
async function stopSimulation(){
  const wasGameView=currentView==='gameview';
  if(!simulation.active){cancelGameViewPlayback(true);closeSettings();setView(wasGameView?'gameview':'gameday');return}
  await restoreAfterSimulation({preserveGameView:false,preserveView:wasGameView});
  closeSettings();setView(wasGameView?'gameview':'gameday');window.scrollTo({top:0,behavior:'smooth'});
}
function loadLiveScoreHistorySafe(){
  try{return JSON.parse(storage.get(SCORE_HISTORY_KEY,'{}'))||{}}catch(e){return {}}
}
let liveScoreHistory=loadLiveScoreHistorySafe();
const simScoreHistory={};
function saveLiveScoreHistory(){try{storage.set(SCORE_HISTORY_KEY,JSON.stringify(liveScoreHistory))}catch(e){}}
function scoreHistoryWeekKey(){return String(n(nflState?.week)||1)}
function scoreHistoryBucket(pair){
  const root=simulation.active?simScoreHistory:liveScoreHistory;
  const wk=scoreHistoryWeekKey();
  if(!root[wk])root[wk]={};
  const key=String(pair.id);
  if(!root[wk][key])root[wk][key]=[];
  return root[wk][key];
}
function scoreHistoryHalfHourKey(ts){
  if(simulation.active){
    const sec=Math.max(0,Math.floor((ts-simulation.virtualStart)/1000));
    return Math.floor(sec/(30*60))*(30*60);
  }
  const d=new Date(ts);
  d.setSeconds(0,0);
  d.setMinutes(d.getMinutes()<30?0:30);
  return d.getTime();
}
function captureScoreHistory(now=gameNow()){
  const bucketKey=scoreHistoryHalfHourKey(now);
  for(const pair of matchupPairs()){
    const rows=pair.rows||[];
    if(rows.length<2)continue;
    const a=rows[0],b=rows[1],bucket=scoreHistoryBucket(pair);
    const entry={t:bucketKey,aRosterId:String(a.roster_id),bRosterId:String(b.roster_id),a:n(a.points),b:n(b.points)};
    const idx=bucket.findIndex(x=>Number(x.t)===Number(bucketKey));
    if(idx>=0){
      // The half-hour label is immutable; only update the score observed for that fixed block.
      bucket[idx]={...bucket[idx],aRosterId:entry.aRosterId,bRosterId:entry.bRosterId,a:entry.a,b:entry.b};
    }else{
      bucket.push(entry);
      bucket.sort((x,y)=>Number(x.t)-Number(y.t));
      if(bucket.length>700)bucket.splice(0,bucket.length-700);
    }
  }
  if(!simulation.active)saveLiveScoreHistory();
}


function gvRelevantRosterPair(){
  const ids=gvSelectedRosterIds();return new Set(ids);
}

function gvSnapshotStatDelta(prevSnap,nextSnap,pid){
  const a=prevSnap?.statsByPlayer?.[String(pid)]||{},b=nextSnap?.statsByPlayer?.[String(pid)]||{},out={};
  const keys=new Set([...Object.keys(a),...Object.keys(b)]);
  for(const k of keys){
    const d=Number(((Number(b[k])||0)-(Number(a[k])||0)).toFixed(4));
    if(Math.abs(d)>.0001)out[k]=d;
  }
  return out;
}
function gvPassDefendedDelta(stats={}){
  const keys=['pass_def','pass_defended','passes_defended','pd'];
  let best=0;
  for(const key of keys){
    const v=Number(stats?.[key]||0);
    if(Number.isFinite(v)&&Math.abs(v)>Math.abs(best))best=v;
  }
  return best;
}
function gvIntervalPlayAnalysis(pid,pos,statDelta,pointDelta){
  const p=String(pos||'').toUpperCase(),d=statDelta||{};
  let count=0,family='unknown',detail='',confidence='ambiguous';
  const scoringRelevant=Math.abs(Number(pointDelta||0))>=0.01;

  const rec=Math.max(0,Math.round(d.rec||0)),recY=Math.round(d.rec_yd||0),recTd=Math.max(0,Math.round(d.rec_td||0));
  const rush=Math.max(0,Math.round(d.rush_att||0)),rushY=Math.round(d.rush_yd||0),rushTd=Math.max(0,Math.round(d.rush_td||0));
  const passCmp=Math.max(0,Math.round(d.pass_cmp||0)),passAtt=Math.max(0,Math.round(d.pass_att||0)),passY=Math.round(d.pass_yd||0),passTd=Math.max(0,Math.round(d.pass_td||0));
  const passInt=Math.max(0,Math.round(d.pass_int||0));
  const fumLost=Math.max(0,Math.round(d.fum_lost||d.fum_lost_total||0));
  const pass2=Math.max(0,Math.round(d.pass_2pt||0)),rec2=Math.max(0,Math.round(d.rec_2pt||0)),rush2=Math.max(0,Math.round(d.rush_2pt||0));
  const offFumRecTd=Math.max(0,Math.round(d.fum_rec_td||0));

  if(pass2>0){count=Math.max(count,pass2);family='qb_pass';detail=pass2===1?'Successful two-point pass':`${pass2} successful two-point passes`;confidence=pass2===1?'single':'burst'}
  if(rec2>0){count=Math.max(count,rec2);family='reception';detail=rec2===1?'Successful two-point reception':`${rec2} successful two-point receptions`;confidence=rec2===1?'single':'burst'}
  if(rush2>0){count=Math.max(count,rush2);family=p==='QB'?'qb_run':'rb_run';detail=rush2===1?'Successful two-point rush':`${rush2} successful two-point rushes`;confidence=rush2===1?'single':'burst'}
  if(offFumRecTd>0&&!['DEF','DST'].includes(p)){count=Math.max(count,offFumRecTd);family='off_fum_recovery';detail='Offensive fumble recovery touchdown';confidence=offFumRecTd===1?'single':'burst'}

  if(rec>0){
    count=Math.max(count,rec);family='reception';
    if(rec===1){detail=`${recY}-yard ${recTd?'touchdown ':''}reception`;confidence='single'}
    else{detail=`${rec} receptions • ${recY} receiving yards${recTd?` • ${recTd} receiving TD${recTd===1?'':'s'}`:''}`;confidence='burst'}
  }

  if(rec===0&&family==='unknown'&&((d.rec_yd||0)!==0||recTd>0)){
    family='lateral_receive';detail=`${recY} receiving yards after lateral${recTd?' • touchdown':''}`;confidence='single';count=1;
  }

  if(rush>0){
    count=Math.max(count,rush);family=p==='QB'?'qb_run':'rb_run';
    if(rush===1){detail=`${rushY}-yard ${rushTd?'touchdown ':''}run`;confidence=count===1?'single':'burst'}
    else{detail=`${rush} carries • ${rushY} rushing yards${rushTd?` • ${rushTd} rushing TD${rushTd===1?'':'s'}`:''}`;confidence='burst'}
  }else if((d.rush_yd||0)!==0&&family==='unknown'){
    family=p==='QB'?'qb_run':'rb_run';detail=`${rushY} rushing yards`;confidence='ambiguous';
  }else if(rushTd>0&&family==='unknown'){
    family=p==='QB'?'qb_run':'rb_run';detail=`${rushTd} rushing TD${rushTd===1?'':'s'} (attempt delta unavailable)`;confidence='ambiguous';
  }

  if(passAtt>0||passCmp>0){
    const observed=Math.max(passAtt,passCmp);count=Math.max(count,observed);family='qb_pass';
    if(passAtt===1&&passCmp===1){detail=`${passY}-yard ${passTd?'touchdown ':''}pass`;confidence=count===1?'single':'burst'}
    else if(passAtt===1&&passCmp===0){detail=passInt?'Pass intercepted':'Incomplete pass';confidence=passInt===1?'single':'ambiguous'}
    else{detail=`${passCmp} completions on ${passAtt||observed} attempt${(passAtt||observed)===1?'':'s'} • ${passY} passing yards${passTd?` • ${passTd} passing TD${passTd===1?'':'s'}`:''}${passInt?` • ${passInt} INT${passInt===1?'':'s'}`:''}`;confidence='burst'}
  }else if((d.pass_yd||0)!==0&&family==='unknown'){
    family='qb_pass';detail=`${passY} passing yards`;confidence='ambiguous';
  }else if(passTd>0&&family==='unknown'){
    family='qb_pass';detail=`${passTd} passing TD${passTd===1?'':'s'} (completion delta unavailable)`;confidence='ambiguous';
  }else if(passInt>0&&family==='unknown'){
    family='qb_pass';detail=`${passInt} interception${passInt===1?'':'s'} thrown`;confidence=passInt===1?'single':'burst';
  }

  if(fumLost>0&&family==='unknown'){
    family='turnover';detail=`${fumLost} fumble${fumLost===1?'':'s'} lost`;confidence=fumLost===1?'single':'burst';
  }

  const fgMade=Math.max(0,Math.round(d.fgm||0));
  const fgMiss=Math.max(0,Math.round(d.fgmiss||d.fg_miss||d.fgmissed||0));
  if(fgMade>0){
    count=Math.max(count,fgMade);family='kick';
    let range='';
    if(d.fgm_50p)range='50+ yard';
    else if(d.fgm_40_49)range='40–49 yard';
    else if(d.fgm_30_39)range='30–39 yard';
    else if(d.fgm_20_29)range='20–29 yard';
    else if(d.fgm_0_19)range='0–19 yard';
    detail=fgMade===1?`${range?range+' ':''}field goal`:`${fgMade} field goals`;
    confidence=fgMade===1?'single':'burst';
  }
  if(fgMiss>0&&family==='unknown'){
    count=Math.max(count,fgMiss);family='kick';detail=fgMiss===1?'Field goal missed':`${fgMiss} field goals missed`;confidence=fgMiss===1?'single':'burst';
  }
  if((d.xpm||0)>0&&family==='unknown'){
    count=Math.round(d.xpm);family='kick';detail=count===1?'Extra point':`${count} extra points`;confidence=count===1?'single':'burst';
  }

  const sacks=Math.max(0,Math.round(d.sack||0)),ints=Math.max(0,Math.round(d.int||0)),fum=Math.max(0,Math.round(d.fum_rec||0)),defTd=Math.max(0,Math.round(d.def_td||0)),defStTd=Math.max(0,Math.round(d.def_st_td||0));
  const safeties=Math.max(0,Math.round(d.safe||0)),blocked=Math.max(0,Math.round(d.blk_kick||0)),qbHits=Math.max(0,Math.round(d.qb_hit||0)),def2=Math.max(0,Math.round(d.def_2pt||0));
  const passDef=Math.max(0,Math.round(gvPassDefendedDelta(d)));
  const intRetY=Math.round(Number(d.def_int_ret_yd||0)),fumRetY=Math.round(Number(d.fum_rec_yd||0));
  const kickRetY=Math.round(Number(d.kick_ret_yd||0)),puntRetY=Math.round(Number(d.punt_ret_yd||0));
  if(['DEF','DST'].includes(p)&&safeties>0){count=Math.max(count,safeties);family='def_safety';detail=safeties===1?'Safety':`${safeties} safeties`;confidence=safeties===1?'single':'burst'}
  if(['DEF','DST'].includes(p)&&blocked>0){count=Math.max(count,blocked);family='def_blocked_kick';detail=blocked===1?'Blocked kick':`${blocked} blocked kicks`;confidence=blocked===1?'single':'burst'}
  if(['DEF','DST'].includes(p)&&def2>0&&family==='unknown'){
    family=(ints>0?'def_interception':fum>0?'def_fumble':'def_2pt');detail=ints>0?'Defensive two-point interception return':fum>0?'Defensive two-point fumble return':'Defensive two-point return';confidence='single';count=1;
  }
  if(['DEF','DST'].includes(p)&&qbHits>0&&family==='unknown'){count=Math.max(count,qbHits);family='def_qb_hit';detail=qbHits===1?'Quarterback hit':`${qbHits} quarterback hits`;confidence=qbHits===1?'single':'burst'}
  if(['DEF','DST'].includes(p)&&(kickRetY!==0||puntRetY!==0||defStTd>0)){
    if(kickRetY!==0&&puntRetY===0){
      count=Math.max(count,1);family='kick_return';detail=`${kickRetY}-yard kick return${defStTd?' touchdown':''}`;confidence='single';
    }else if(puntRetY!==0&&kickRetY===0){
      count=Math.max(count,1);family='punt_return';detail=`${puntRetY}-yard punt return${defStTd?' touchdown':''}`;confidence='single';
    }else if(defStTd>0&&family==='unknown'){
      family='special_teams_return';detail=`${defStTd} special-teams TD${defStTd===1?'':'s'}`;confidence='ambiguous';
    }
  }
  if((sacks+ints+fum+defTd)>0||(['DEF','DST'].includes(p)&&(intRetY!==0||fumRetY!==0))){
    if(['DEF','DST'].includes(p)){
      count=Math.max(count,sacks+ints+fum);family=defTd?'def_return':sacks?'def_sack':(ints||intRetY)?'def_interception':'def_fumble';
      const bits=[];
      if(sacks)bits.push(`${sacks} sack${sacks===1?'':'s'}`);
      if(ints)bits.push(`${ints} interception${ints===1?'':'s'}`);
      if(intRetY)bits.push(`${intRetY} interception return yard${Math.abs(intRetY)===1?'':'s'}`);
      if(fum)bits.push(`${fum} fumble recover${fum===1?'y':'ies'}`);
      if(fumRetY)bits.push(`${fumRetY} fumble return yard${Math.abs(fumRetY)===1?'':'s'}`);
      if(defTd)bits.push(`${defTd} defensive TD${defTd===1?'':'s'}`);
      detail=bits.join(' • ');confidence=(sacks+ints+fum===1&&defTd<=1)?'single':((ints||fum||intRetY||fumRetY)?'single':'burst');
    }
  }

  // Pass breakup classification requires explicit pass-defended evidence. A generic
  // defensive fantasy delta is never assumed to be a PBU.
  if(['DEF','DST'].includes(p)&&passDef>0&&family==='unknown'){
    count=Math.max(count,passDef);
    family='def_breakup';
    detail=passDef===1?'Pass defended':`${passDef} passes defended`;
    confidence=passDef===1?'single':'burst';
  }

  if(!detail)detail=`${Number(pointDelta||0).toFixed(2)} fantasy points`;
  if(!scoringRelevant&&confidence==='single'&&['qb_pass','turnover'].includes(family))confidence='ambiguous';
  return {count:count||null,family,detail,confidence,stats:d,pointDelta:Number(pointDelta||0),scoringRelevant};
}


function gvSameNflTeam(a,b){
  const ta=String(a?.nflTeam||'').toUpperCase(),tb=String(b?.nflTeam||'').toUpperCase();
  return !!ta&&!!tb&&ta===tb;
}
function gvPassingCandidates(events){
  const passerPositions=['QB','RB','WR','TE','K'];
  const receiverPositions=['QB','RB','WR','TE'];
  return {
    qbs:events.filter(e=>passerPositions.includes(String(e.pos||'').toUpperCase())&&e.intervalAnalysis?.family==='qb_pass'),
    targets:events.filter(e=>receiverPositions.includes(String(e.pos||'').toUpperCase())&&e.intervalAnalysis?.family==='reception')
  };
}

function gvSameTeamReceiverGroups(qb,targets){
  return targets.filter(t=>gvSameNflTeam(qb,t)).map(t=>({
    event:t,
    receptions:Math.max(0,Math.round(t.intervalAnalysis?.stats?.rec||0)),
    yards:Math.round(t.intervalAnalysis?.stats?.rec_yd||0),
    tds:Math.max(0,Math.round(t.intervalAnalysis?.stats?.rec_td||0))
  })).filter(x=>x.receptions>0 || Number(x.event?.intervalAnalysis?.stats?.rec_2pt||0)>0);
}
function gvBuildCorrelatedPassEvent(qb,rec,index=0){
  const r=rec.event;
  if(!gvSameNflTeam(qb,r))return null;
  const passerPos=String(qb?.pos||'QB').toUpperCase();
  const receiverPos=String(r?.pos||'WR').toUpperCase();
  const trickPlay=passerPos!=='QB'||receiverPos==='QB';
  const trickConfidence=gvTrickPlayConfidence(qb,r);
  return {
    ...r,
    id:`corr-${qb.id}-${r.id}-${index}`,
    source:gvResolveSource(qb,r),
    multiActor:true,
    passerPlayerId:qb.playerId,passerName:qb.name,passerPos,passerNflTeam:qb.nflTeam,
    qbPlayerId:qb.playerId,qbName:qb.name,qbPos:passerPos,qbNflTeam:qb.nflTeam,
    receiverPlayerId:r.playerId,receiverName:r.name,receiverPos,receiverNflTeam:r.nflTeam,
    trickPlay,correlationKind:trickPlay?'trick-pass':'standard-pass',
    trickConfidenceLevel:trickConfidence.level,
    trickConfidenceLabel:trickConfidence.label,
    trickConfidenceScore:trickConfidence.score,
    trickConfidenceReasons:trickConfidence.reasons,
    playType:(Number(qb?.intervalAnalysis?.stats?.pass_2pt||0)>0||Number(r?.intervalAnalysis?.stats?.rec_2pt||0)>0)?'two_point_pass':'qb_pass',
    twoPointConversion:Number(qb?.intervalAnalysis?.stats?.pass_2pt||0)>0||Number(r?.intervalAnalysis?.stats?.rec_2pt||0)>0,
    correlated:true
  };
}


