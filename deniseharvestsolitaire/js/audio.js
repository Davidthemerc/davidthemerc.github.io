window.DSH=window.DSH||{};
DSH.Audio=(()=>{
 let ctx=null,state=null;
 function bindState(s){state=s}
 function getCtx(){if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(A)ctx=new A()} if(ctx&&ctx.state==='suspended')ctx.resume();return ctx}
 function tone(freq=440,dur=.06,type='sine',gain=.035,delay=0){
   if(!state?.settings?.sfx)return; const c=getCtx(); if(!c)return;
   const vol=Math.max(0,Math.min(1,Number(state?.settings?.sfxVolume??.65)));if(vol<=0)return;
   const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain*vol),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
   o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur+.02);
 }
 const play={
  card(){tone(235,.045,'triangle',.028);tone(320,.035,'triangle',.018,.025)},
  draw(){tone(180,.05,'triangle',.023);tone(230,.04,'triangle',.018,.035)},
  flip(){tone(360,.035,'square',.012);tone(520,.045,'triangle',.018,.025)},
  bad(){tone(115,.11,'sawtooth',.023)},
  streak(n){tone(420+n*35,.06,'triangle',.03);tone(610+n*28,.07,'sine',.02,.045)},
  harvest(){tone(440,.07,'triangle',.03);tone(660,.08,'triangle',.025,.07);tone(880,.10,'sine',.02,.14)},
  windmill(){for(let i=0;i<7;i++)tone(170+i*45,.18,'sine',.018,i*.035)},
  wild(){tone(520,.06,'sine',.025);tone(740,.08,'triangle',.025,.05);tone(980,.1,'sine',.018,.11)},
  bonus(tier=1){[660,784,990].forEach((f,i)=>tone(f+tier*18,.09,'triangle',.028,i*.055))},
  rescue(){[330,440,590].forEach((f,i)=>tone(f,.07,'triangle',.025,i*.045))},
  achievement(){[523,659,784,1046,1318].forEach((f,i)=>tone(f,.11,'triangle',.028,i*.065))},
  crack(){tone(105,.06,'sawtooth',.018);tone(175,.04,'square',.012,.03)},
  win(){[523,659,784,1046].forEach((f,i)=>tone(f,.13,'triangle',.03,i*.09))}
 };
 return{bindState,play};
})();