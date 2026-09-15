// v1.6.44.1.1 — restored v1.6.38 MIDI compositions; Tone.js engine retained.
const SOS_MIDI_TRACKS=[{title:"Shantium at Dusk",file:"assets/music/01_shantium_at_dusk.mid",data:'TVRoZAAAAAYAAAABAeBNVHJrAAABmgD/UQMLKjsAwC4AwSoAkEBIAJEwMINggEAAAJBDSINggEMAAJBFSIdAgEUAAIEwAACQQ0gAkSswg2CAQwAAkEBIg2CAQAAAkD5Ih0CAPgAAgSsAAJA8SACRLTCDYIA8AACQPkiDYIA+AACQQEiHQIBAAACBLQAAkD5IAJEwMINggD4AAJA8SIsggDwAAIEwAACQQEgAkTAwg2CAQAAAkENIg2CAQwAAkEVIh0CARQAAgTAAAJBDSACRKzCDYIBDAACQQEiDYIBAAACQPkiHQIA+AACBKwAAkDxIAJEtMINggDwAAJA+SINggD4AAJBASIdAgEAAAIEtAACQPkgAkTAwg2CAPgAAkDxIiyCAPAAAgTAAAJBASACRMDCDYIBAAACQQ0iDYIBDAACQRUiHQIBFAACBMAAAkENIAJErMINggEMAAJBASINggEAAAJA+SIdAgD4AAIErAACQPEgAkS0wg2CAPAAAkD5Ig2CAPgAAkEBIh0CAQAAAgS0AAJA+SACRMDCDYIA+AACQPEiLIIA8AACBMAAA/y8A'},{title:"Road Beyond the Gate",file:"assets/music/02_road_beyond_the_gate.mid",data:'TVRoZAAAAAYAAAABAeBNVHJrAAABwgD/UQMJiWgAwBgAwSoAkD5IAJEyMIFwgD4AAJBASIFwgEAAAJBBSINggEEAAJBFSINggEUAAJBDSINggEMAAIEyAACQQUgAkS0wgXCAQQAAkEBIgXCAQAAAkD5Ih0CAPgAAkDlIg2CAOQAAgS0AAJA8SACRLzCDYIA8AACQPkiDYIA+AACQQEiDYIBAAACQPkiDYIEvAACRMjCDYIA+AACQPkiBcIA+AACQQEiBcIBAAACQQUiDYIBBAACQRUiDYIBFAACBMgAAkENIAJEyMINggEMAAJBBSIFwgEEAAJBASIFwgEAAAJA+SIdAgD4AAIEyAACQOUgAkS0wg2CAOQAAkDxIg2CAPAAAkD5Ig2CAPgAAkEBIg2CAQAAAgS0AAJA+SACRLzCHQIA+AACQPkiBcIA+AACQQEiBcIBAAACQQUiDYIBBAACBLwAAkEVIAJEyMINggEUAAJBDSINggEMAAJBBSIFwgEEAAJBASIFwgEAAAJA+SINggTIAAJEyMINggD4AAJA5SINggDkAAJA8SINggDwAAJA+SINggD4AAIEyAACQQEgAkS0wg2CAQAAAkD5Ih0CAPgAAgS0AAP8vAA=='},{title:"Guardian Hall Lanterns",file:"assets/music/03_guardian_hall_lanterns.mid",data:'TVRoZAAAAAYAAAABAeBNVHJrAAABmgD/UQMMXzoAwBMAwSoAkDxIAJEwMINggDwAAJBASINggEAAAJBDSIdAgEMAAIEwAACQRUgAkSkwg2CARQAAkENIg2CAQwAAkEBIh0CAQAAAgSkAAJA+SACRLTCDYIA+AACQQUiDYIBBAACQRUiHQIBFAACBLQAAkENIAJEwMINggEMAAJBASIsggEAAAIEwAACQPEgAkTAwg2CAPAAAkEBIg2CAQAAAkENIh0CAQwAAgTAAAJBFSACRKTCDYIBFAACQQ0iDYIBDAACQQEiHQIBAAACBKQAAkD5IAJEtMINggD4AAJBBSINggEEAAJBFSIdAgEUAAIEtAACQQ0gAkTAwg2CAQwAAkEBIiyCAQAAAgTAAAJA8SACRMDCDYIA8AACQQEiDYIBAAACQQ0iHQIBDAACBMAAAkEVIAJEpMINggEUAAJBDSINggEMAAJBASIdAgEAAAIEpAACQPkgAkS0wg2CAPgAAkEFIg2CAQQAAkEVIh0CARQAAgS0AAJBDSACRMDCDYIBDAACQQEiLIIBAAACBMAAA/y8A'},{title:"Snow Over Azerdon",file:"assets/music/04_snow_over_azerdon.mid",data:'TVRoZAAAAAYAAAABAeBNVHJrAAABxQD/UQMOThwAwEkAwSoAkEAwAJEtHodAgEAAAJBDLodAgEMAAIEtAACQRTIAkSgeiyCARQCDYIEoAACQQywAkSseh0CAQwAAkEAuh0CAQAAAgSsAAJA+LACRLR6PAIA+AACBLQAAkSkeh0CQQC6HQIBAAACBKQAAkEMwAJErHodAgEMAAJBFMIdAgEUAAIErAACQRy4AkS0eh0CARwAAkEUsh0CBLQAAkSgeh0CARQAAkEMsh0CAQwAAgSgAAJBALACRKx6HQIBAAACQPiqHQIA+AACBKwAAkDwoAJEtHo8AgDwAAIEtAACQQDAAkSkeh0CAQAAAkEMuh0CAQwAAgSkAAJBFMgCRKx6LIIBFAINggSsAAJBDLACRLR6HQIBDAACQQC6HQIBAAACBLQAAkD4sAJEoHo8AgD4AAIEoAACRKx6HQJBALodAgEAAAIErAACQQzAAkS0eh0CAQwAAkEUwh0CARQAAgS0AAJBHLgCRKR6HQIBHAACQRSyHQIEpAACRKx6HQIBFAACQQyyHQIBDAACBKwAAkEAsAJEtHodAgEAAAJA+KodAgD4AAIEtAACQPCgAkSgejwCAPAAAgSgAAP8vAA=='},{title:"Redstone Procession",file:"assets/music/05_redstone_procession.mid",data:'TVRoZAAAAAYAAAABAeBNVHJrAAAB9wD/UQMKpUoAwDwAwSoAkDcyAJErIINggDcAAJA8NINggDwAAJA+NodAgD4AAIErAACQPDAAkTAgh0CAPAAAkDkuh0CAOQAAgTAAAJA3MACRLSCDYIA3AACQOTKDYIA5AACQPDSHQIA8AACBLQAAkD40AJEpIIdAgD4AAJA8MIdAgDwAAIEpAACQOS4AkSsgh0CAOQAAkDcsh0CANwAAgSsAAJA1KgCRMCCHQIA1AACQNy6HQIA3AACBMAAAkDwyAJErIIdAgDwAAJA+NIdAgD4AAIErAACQQDIAkTAgh0CAQAAAkD4wh0CAPgAAgTAAAJA8LgCRLSCPAIA8AACBLQAAkDcyAJEpIINggDcAAJA8NINggDwAAJA+NodAgD4AAIEpAACQPDAAkSsgh0CAPAAAkDkuh0CAOQAAgSsAAJA3MACRMCCDYIA3AACQOTKDYIA5AACQPDSHQIA8AACBMAAAkD40AJErIIdAgD4AAJA8MIdAgDwAAIErAACQOS4AkTAgh0CAOQAAkDcsh0CANwAAgTAAAJA1KgCRLSCHQIA1AACQNy6HQIA3AACBLQAAkDwyAJEpIIdAgDwAAJA+NIdAgD4AAIEpAACQQDIAkSsgh0CAQAAAkD4wh0CAPgAAgSsAAJA8LgCRMCCPAIA8AACBMAAA/y8A'},{title:"Standing Stone Night",file:"assets/music/06_standing_stone_night.mid",data:'TVRoZAAAAAYAAAABAeBNVHJrAAABZAD/UQMPQkAAwDQAwSoAkD5IAJEmMIdAgD4AAJBBSIdAgEEAAIEmAACQRUgAkSkwh0CARQAAkENIh0CAQwAAgSkAAJBBSACRLTCDYIBBAACQPkiDYIA+AACQPEiHQIA8AACBLQAAkD5IAJErMIdAgD4AAJA5SIdAgDkAAIErAACQPkgAkSYwh0CAPgAAkEFIh0CAQQAAgSYAAJBFSACRKTCHQIBFAACQQ0iHQIBDAACBKQAAkEFIAJEtMINggEEAAJA+SINggD4AAJA8SIdAgDwAAIEtAACQPkgAkSswh0CAPgAAkDlIh0CAOQAAgSsAAJA+SACRJjCHQIA+AACQQUiHQIBBAACBJgAAkEVIAJEpMIdAgEUAAJBDSIdAgEMAAIEpAACQQUgAkS0wg2CAQQAAkD5Ig2CAPgAAkDxIh0CAPAAAgS0AAJA+SACRKzCHQIA+AACQOUiHQIA5AACBKwAA/y8A'}];
let musicEnabled=true,musicVolume=.32,sfxVolume=.75,musicTrackIndex=0,musicTimer=null,musicVoices=[],musicStarted=false;
let toneMusicNodes=null,toneScheduled=[],musicPlaybackEngine='native',musicTransitionToken=0;
function toneAvailable(){return typeof window!=='undefined'&&window.Tone&&typeof window.Tone.PolySynth==='function'}
function musicNoteName(n){const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];return names[((n%12)+12)%12]+(Math.floor(n/12)-1)}
function disposeToneMusic(){
 if(musicTimer)clearTimeout(musicTimer);musicTimer=null;
 if(toneScheduled.length&&toneAvailable()){for(const id of toneScheduled)try{Tone.getTransport().clear(id)}catch(e){}}
 toneScheduled=[];
 if(toneMusicNodes){for(const n of Object.values(toneMusicNodes))try{n.dispose?.()}catch(e){}toneMusicNodes=null}
}
function fadeOutToneMusic(seconds=.32){
 if(!toneMusicNodes||!toneAvailable())return Promise.resolve();
 const nodes=toneMusicNodes,token=++musicTransitionToken;
 try{nodes.master.volume.rampTo(-60,seconds)}catch(e){}
 return new Promise(resolve=>setTimeout(()=>{if(token===musicTransitionToken&&toneMusicNodes===nodes)disposeToneMusic();resolve()},Math.max(30,seconds*1000)))
}
function createToneMusicNodes(){
 if(!toneAvailable())return null;
 const master=new Tone.Volume(-10).toDestination(),compressor=new Tone.Compressor(-22,2.2),reverb=new Tone.Reverb({decay:2.4,wet:.18}),filter=new Tone.Filter(5200,'lowpass'),chorus=new Tone.Chorus({frequency:.18,delayTime:2.5,depth:.10,wet:.08}).start();
 filter.connect(chorus);chorus.connect(reverb);reverb.connect(compressor);compressor.connect(master);
 const soft=new Tone.PolySynth({voice:Tone.Synth,maxPolyphony:24,options:{oscillator:{type:'sine'},envelope:{attack:.055,decay:.16,sustain:.62,release:.42}}}).connect(filter);
 const warm=new Tone.PolySynth({voice:Tone.Synth,maxPolyphony:24,options:{oscillator:{type:'triangle'},envelope:{attack:.045,decay:.14,sustain:.60,release:.38}}}).connect(filter);
 const horn=new Tone.PolySynth({voice:Tone.FMSynth,maxPolyphony:16,options:{harmonicity:1.5,modulationIndex:1.2,oscillator:{type:'sine'},modulation:{type:'sine'},envelope:{attack:.085,decay:.18,sustain:.50,release:.48},modulationEnvelope:{attack:.08,decay:.15,sustain:.25,release:.35}}}).connect(filter);
 toneMusicNodes={master,compressor,reverb,filter,chorus,soft,warm,horn};return toneMusicNodes
}
function toneSynthForProgram(program,nodes){
 if(program>=56&&program<=63)return nodes.horn;
 if((program>=72&&program<=79)||(program>=16&&program<=23))return nodes.soft;
 return nodes.warm
}
const SOS_TRACK_MIX=[
 {gain:.94,cutoff:4700,reverb:.16,chorus:.07,velocity:.70},
 {gain:.90,cutoff:5000,reverb:.14,chorus:.06,velocity:.69},
 {gain:.96,cutoff:4300,reverb:.20,chorus:.08,velocity:.70},
 {gain:.88,cutoff:3900,reverb:.23,chorus:.05,velocity:.64},
 {gain:.90,cutoff:3600,reverb:.16,chorus:.04,velocity:.63},
 {gain:.96,cutoff:4100,reverb:.25,chorus:.09,velocity:.68}
];
function currentTrackMix(index=musicTrackIndex){return SOS_TRACK_MIX[(index+SOS_TRACK_MIX.length)%SOS_TRACK_MIX.length]||SOS_TRACK_MIX[0]}
function applyToneTrackMix(nodes,index){
 const m=currentTrackMix(index);nodes.master.volume.value=Tone.gainToDb(Math.max(.0001,musicVolume*.72*m.gain));
 nodes.filter.frequency.value=m.cutoff;nodes.reverb.wet.value=m.reverb;nodes.chorus.wet.value=m.chorus;return m
}

async function playMidiTrackTone(index=musicTrackIndex){
 if(!musicEnabled||!toneAvailable())return false;
 try{
  await Tone.start();if(toneMusicNodes)await fadeOutToneMusic(.24);else disposeToneMusic();musicTrackIndex=(index+SOS_MIDI_TRACKS.length)%SOS_MIDI_TRACKS.length;
  const parsed=parseSOSMidi(SOS_MIDI_TRACKS[musicTrackIndex]);if(!parsed)return false;
  const nodes=createToneMusicNodes();if(!nodes)return false;const mix=applyToneTrackMix(nodes,musicTrackIndex);
  const targetDb=nodes.master.volume.value;nodes.master.volume.value=-60;nodes.master.volume.rampTo(targetDb,.34);
  const now=Tone.now()+.08;
  for(const n of parsed.notes){
   const synth=toneSynthForProgram(n.program,nodes),dur=Math.max(.06,n.endSec-n.startSec),vel=Math.max(.07,Math.min(.68,(n.vel/127)*mix.velocity));
   synth.triggerAttackRelease(musicNoteName(n.note),dur,now+n.startSec,vel);
  }
  musicPlaybackEngine='tone';musicStarted=true;
  musicTimer=setTimeout(()=>{musicTrackIndex=(musicTrackIndex+1)%SOS_MIDI_TRACKS.length;playMidiTrack(musicTrackIndex)},Math.max(250,parsed.duration*1000));
  return true
 }catch(e){console.warn('Tone.js music fallback',e);disposeToneMusic();return false}
}

function loadAudioPrefs(){
 try{const p=JSON.parse(localStorage.getItem('sos_audio_prefs')||'{}');if(typeof p.soundOn==='boolean')soundOn=p.soundOn;if(typeof p.musicEnabled==='boolean')musicEnabled=p.musicEnabled;if(Number.isFinite(p.musicVolume))musicVolume=Math.max(0,Math.min(1,p.musicVolume));if(Number.isFinite(p.sfxVolume))sfxVolume=Math.max(0,Math.min(1,p.sfxVolume))}catch(e){}
}
function saveAudioPrefs(){try{localStorage.setItem('sos_audio_prefs',JSON.stringify({soundOn,musicEnabled,musicVolume,sfxVolume}))}catch(e){}}
function midiBytes(track){const raw=atob(track.data),a=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);return a}
function midiVLQ(a,o){let v=0,b;do{b=a[o.i++];v=(v<<7)|(b&127)}while(b&128);return v}
function parseSOSMidi(track){
 const a=midiBytes(track),dv=new DataView(a.buffer);if(String.fromCharCode(...a.slice(0,4))!=='MThd')return null;
 const tpq=dv.getUint16(12),len=dv.getUint32(18),end=22+len,o={i:22},notes=[],active={},program={},tempo=[{tick:0,us:500000}];let tick=0,running=0;
 while(o.i<end){tick+=midiVLQ(a,o);let st=a[o.i++];if(st<128){o.i--;st=running}else if(st<240)running=st;
  if(st===255){const type=a[o.i++],n=midiVLQ(a,o);if(type===81&&n===3)tempo.push({tick,us:(a[o.i]<<16)|(a[o.i+1]<<8)|a[o.i+2]});o.i+=n;continue}
  const hi=st&240,ch=st&15;if(hi===192||hi===208){const d=a[o.i++];if(hi===192)program[ch]=d;continue}
  const d1=a[o.i++],d2=a[o.i++];if(hi===144&&d2>0)active[ch+':'+d1]={tick,vel:d2,program:program[ch]||0};
  else if(hi===128||(hi===144&&d2===0)){const k=ch+':'+d1,n=active[k];if(n){notes.push({start:n.tick,end:tick,note:d1,vel:n.vel,program:n.program,ch});delete active[k]}}
 }
 tempo.sort((x,y)=>x.tick-y.tick);function secAt(t){let sec=0,last=0,us=tempo[0].us;for(const q of tempo){if(q.tick>t)break;sec+=(q.tick-last)*us/1e6/tpq;last=q.tick;us=q.us}return sec+(t-last)*us/1e6/tpq}
 return {notes:notes.map(n=>({...n,startSec:secAt(n.start),endSec:secAt(n.end)})),duration:secAt(tick)+.15}
}
function midiInstrumentProfile(program){
 if(program>=72&&program<=79)return{wave:'sine',gain:.72,attack:.055,release:.16,cutoff:4200}; // pipes/flutes
 if(program>=64&&program<=71)return{wave:'triangle',gain:.66,attack:.045,release:.14,cutoff:3000}; // reeds
 if(program>=56&&program<=63)return{wave:'triangle',gain:.62,attack:.07,release:.18,cutoff:2200}; // brass/horns
 if(program>=40&&program<=55)return{wave:'triangle',gain:.64,attack:.06,release:.20,cutoff:2600}; // strings/ensemble
 if(program>=24&&program<=39)return{wave:'triangle',gain:.60,attack:.025,release:.12,cutoff:3600}; // guitars/bass
 if(program>=16&&program<=23)return{wave:'sine',gain:.60,attack:.06,release:.18,cutoff:2400}; // organs
 return{wave:'triangle',gain:.58,attack:.035,release:.14,cutoff:3200}
}
let musicBus=null;
function ensureMusicBus(){
 const ctx=ensureAudio();if(!ctx)return null;if(musicBus&&musicBus.ctx===ctx)return musicBus;
 const input=ctx.createGain(),filter=ctx.createBiquadFilter(),dry=ctx.createGain(),wet=ctx.createGain(),delay=ctx.createDelay(.5),feedback=ctx.createGain(),master=ctx.createGain(),comp=ctx.createDynamicsCompressor();
 filter.type='lowpass';filter.frequency.value=5200;filter.Q.value=.35;dry.gain.value=.92;wet.gain.value=.10;delay.delayTime.value=.17;feedback.gain.value=.16;master.gain.value=.90;
 comp.threshold.value=-24;comp.knee.value=18;comp.ratio.value=2.2;comp.attack.value=.02;comp.release.value=.28;
 input.connect(filter);filter.connect(dry);dry.connect(master);filter.connect(delay);delay.connect(wet);wet.connect(master);delay.connect(feedback);feedback.connect(delay);master.connect(comp);comp.connect(ctx.destination);
 musicBus={ctx,input,filter,dry,wet,delay,feedback,master,comp};return musicBus
}
function stopMusicVoices(){for(const v of musicVoices)try{v.stop()}catch(e){}musicVoices=[];if(musicTimer)clearTimeout(musicTimer);musicTimer=null;disposeToneMusic()}
async function stopMusic(){
 if(toneMusicNodes&&toneAvailable()){if(musicTimer)clearTimeout(musicTimer);musicTimer=null;musicStarted=false;await fadeOutToneMusic(.28)}
 else{stopMusicVoices();musicStarted=false}
 saveAudioPrefs()
}
async function playMusic(){if(!musicEnabled){musicEnabled=true;saveAudioPrefs()}await playMidiTrack(musicTrackIndex)}
function musicPlaybackStatus(){return musicStarted?'Playing':'Stopped'}
function currentMusicEngine(){return musicPlaybackEngine==='tone'?'Tone.js':'Native fallback'}
function playMidiTrackNative(index=musicTrackIndex){
 if(!musicEnabled)return;const ctx=ensureAudio();if(!ctx)return;stopMusicVoices();const bus=ensureMusicBus();if(!bus)return;musicTrackIndex=(index+SOS_MIDI_TRACKS.length)%SOS_MIDI_TRACKS.length;const parsed=parseSOSMidi(SOS_MIDI_TRACKS[musicTrackIndex]);if(!parsed)return;
 const base=ctx.currentTime+.06;for(const n of parsed.notes){const p=midiInstrumentProfile(n.program),o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter(),t=base+n.startSec,e=base+n.endSec,d=Math.max(.08,e-t),attack=Math.min(p.attack,d*.28),release=Math.min(p.release,d*.42);o.type=p.wave;o.frequency.value=440*Math.pow(2,(n.note-69)/12);f.type='lowpass';f.frequency.value=p.cutoff;f.Q.value=.25;const amp=Math.max(.0001,(n.vel/127)*.050*musicVolume*p.gain);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(amp,t+attack);g.gain.setValueAtTime(amp,Math.max(t+attack+.01,e-release));g.gain.exponentialRampToValueAtTime(.0001,e);o.connect(f);f.connect(g);g.connect(bus.input);o.start(t);o.stop(e+.03);musicVoices.push(o)}
 musicStarted=true;musicTimer=setTimeout(()=>{musicTrackIndex=(musicTrackIndex+1)%SOS_MIDI_TRACKS.length;playMidiTrack(musicTrackIndex)},Math.max(250,parsed.duration*1000));
}
async function playMidiTrack(index=musicTrackIndex){
 if(!musicEnabled)return false;
 if(toneAvailable()&&await playMidiTrackTone(index))return true;
 musicPlaybackEngine='native';playMidiTrackNative(index);return true
}
function ensureMusicStarted(){if(musicEnabled&&!musicStarted)playMidiTrack(musicTrackIndex)}
function setMusicEnabled(v){musicEnabled=!!v;if(!musicEnabled)stopMusic();else playMusic();saveAudioPrefs()}
function setMusicVolume(v){
 musicVolume=Math.max(0,Math.min(1,Number(v)||0));saveAudioPrefs();
 if(musicEnabled&&musicStarted&&toneMusicNodes&&toneAvailable()){const m=currentTrackMix();toneMusicNodes.master.volume.rampTo(Tone.gainToDb(Math.max(.0001,musicVolume*.72*m.gain)),.08)}
 else if(musicEnabled&&musicStarted)playMidiTrack(musicTrackIndex)
}
function setSfxVolume(v){sfxVolume=Math.max(0,Math.min(1,Number(v)||0));saveAudioPrefs()}
function nextMusicTrack(){musicTrackIndex=(musicTrackIndex+1)%SOS_MIDI_TRACKS.length;if(musicEnabled)playMidiTrack(musicTrackIndex);saveAudioPrefs()}
function currentMusicTrack(){return SOS_MIDI_TRACKS[musicTrackIndex]?.title||'—'}
loadAudioPrefs();
document.addEventListener('pointerdown',()=>ensureMusicStarted(),{once:true,capture:true});
document.addEventListener('keydown',()=>ensureMusicStarted(),{once:true,capture:true});


/* v1.6.66.8.2 — MP3 soundtrack with embedded MIDI fallback.
   Modular/GitHub Pages builds use assets/music/*.mp3. A standalone may set
   localStorage.sos_remote_music_base to a public GitHub Pages music folder. */
const SOS_MP3_TRACKS=[
 {title:'Shantium at Dusk',file:'01_shantium_at_dusk.mp3',fallbackMidi:0,tags:['general','shantium']},
 {title:'Road Beyond the Gate',file:'02_road_beyond_the_gate.mp3',fallbackMidi:1,tags:['general','travel']},
 {title:'Guardian Hall Lanterns',file:'03_guardian_hall_lanterns.mp3',fallbackMidi:2,tags:['general','hall']},
 {title:'Snow Over Azerdon',file:'04_snow_over_azerdon.mp3',fallbackMidi:3,tags:['general','azerdon']},
 {title:'Redstone Procession',file:'05_redstone_procession.mp3',fallbackMidi:4,tags:['general','redstone']},
 {title:'Somber Tomorrow',file:'06_somber_tomorrow.mp3',fallbackMidi:5,tags:['general','somber']},
 {title:'The Roads of Spawn',file:'07_the_roads_of_spawn.mp3',fallbackMidi:1,tags:['spawn']},
 {title:'Vast Expanse (Spawn)',file:'08_vast_expanse_spawn.mp3',fallbackMidi:5,tags:['spawn']},
 {title:'The Bells of War',file:'09_the_bells_of_war.mp3',fallbackMidi:4,tags:['war-declaration']},
 {title:'A Realm at War',file:'10_a_realm_at_war.mp3',fallbackMidi:5,tags:['war']}
];
let soundtrackTrackIndex=0,soundtrackAudio=null,soundtrackSourceAttempt=0,soundtrackReturnToRotation=true;
const __sosMidiPlayTrack=playMidiTrack,__sosStopMusic=stopMusic,__sosSetMusicVolume=setMusicVolume;
function sosMusicRemoteBase(){
 let v='';try{v=localStorage.getItem('sos_remote_music_base')||''}catch(e){}
 return String(globalThis.SOS_REMOTE_MUSIC_BASE||v||'').trim().replace(/\/+$/,'')
}
function setRemoteMusicBase(url){try{localStorage.setItem('sos_remote_music_base',String(url||'').trim().replace(/\/+$/,''))}catch(e){}return sosMusicRemoteBase()}
function sosLocalMp3Url(track){return 'assets/music/'+encodeURIComponent(track.file).replace(/%2F/g,'/')}
function sosRemoteMp3Url(track){const b=sosMusicRemoteBase();return b?b+'/'+encodeURIComponent(track.file).replace(/%2F/g,'/'):''}
function sosWarActive(){try{return ensureWarFoundation().wars.some(w=>w.status==='active')}catch(e){return false}}
function sosInSpawn(){const l=String(state?.world?.location||'').toLowerCase();return l.includes('spawn')}
function sosSoundtrackRotation(){
 const a=[0,1,2,3,4,5];if(sosInSpawn())a.push(6,7);if(sosWarActive())a.push(9);return a
}
function sosNextSoundtrackIndex(){const a=sosSoundtrackRotation(),current=a.indexOf(soundtrackTrackIndex);if(current>=0&&Math.random()<.64)return a[(current+1)%a.length];return a[Math.floor(Math.random()*a.length)]}
function stopSoundtrackAudio(){if(soundtrackAudio){soundtrackAudio.onended=null;soundtrackAudio.onerror=null;try{soundtrackAudio.pause();soundtrackAudio.removeAttribute('src');soundtrackAudio.load()}catch(e){}soundtrackAudio=null}}
function sosFallbackToMidi(track){
 stopSoundtrackAudio();musicPlaybackEngine='midi-fallback';musicStarted=false;musicTrackIndex=track.fallbackMidi||0;return __sosMidiPlayTrack(track.fallbackMidi||0)
}
async function playMp3Track(index=soundtrackTrackIndex,opts={}){
 if(!musicEnabled)return false;stopMusicVoices();stopSoundtrackAudio();
 soundtrackTrackIndex=(index+SOS_MP3_TRACKS.length)%SOS_MP3_TRACKS.length;soundtrackReturnToRotation=opts.returnToRotation!==false;
 const track=SOS_MP3_TRACKS[soundtrackTrackIndex],sources=[sosLocalMp3Url(track)];const remote=sosRemoteMp3Url(track);if(remote&&remote!==sources[0])sources.push(remote);soundtrackSourceAttempt=0;
 return await new Promise(resolve=>{
  const trySource=()=>{
   if(soundtrackSourceAttempt>=sources.length){sosFallbackToMidi(track);resolve(false);return}
   const a=new Audio();soundtrackAudio=a;a.preload='auto';a.volume=Math.max(0,Math.min(1,musicVolume));a.src=sources[soundtrackSourceAttempt++];
   a.oncanplay=()=>{musicPlaybackEngine=soundtrackSourceAttempt===1?'MP3 local':'MP3 remote';musicStarted=true;a.play().then(()=>resolve(true)).catch(()=>{if(soundtrackAudio===a){a.onerror=null;trySource()}})};
   a.onerror=()=>{if(soundtrackAudio===a)trySource()};
   a.onended=()=>{if(soundtrackAudio!==a)return;musicStarted=false;const next=soundtrackReturnToRotation?sosNextSoundtrackIndex():(soundtrackTrackIndex+1)%SOS_MP3_TRACKS.length;playMp3Track(next,{returnToRotation:true})};
  };trySource()
 })
}
playMidiTrack=async function(index=soundtrackTrackIndex){return playMp3Track(index,{returnToRotation:true})};
playMusic=async function(){if(!musicEnabled){musicEnabled=true;saveAudioPrefs()}return playMp3Track(soundtrackTrackIndex,{returnToRotation:true})};
stopMusic=async function(){stopSoundtrackAudio();musicStarted=false;await __sosStopMusic()};
setMusicVolume=function(v){musicVolume=Math.max(0,Math.min(1,Number(v)||0));saveAudioPrefs();if(soundtrackAudio)soundtrackAudio.volume=musicVolume;else __sosSetMusicVolume(musicVolume)};
nextMusicTrack=function(){soundtrackTrackIndex=sosNextSoundtrackIndex();if(musicEnabled)playMp3Track(soundtrackTrackIndex,{returnToRotation:true});saveAudioPrefs()};
currentMusicTrack=function(){return SOS_MP3_TRACKS[soundtrackTrackIndex]?.title||'—'};
currentMusicEngine=function(){return musicPlaybackEngine==='MP3 local'?'MP3 (packaged)':musicPlaybackEngine==='MP3 remote'?'MP3 (online)':musicPlaybackEngine==='midi-fallback'?'MIDI fallback':musicPlaybackEngine==='tone'?'Tone.js MIDI':'Native MIDI fallback'};
function playSoundtrackTrackByTitle(title,opts={}){const i=SOS_MP3_TRACKS.findIndex(t=>t.title===title);return i<0?false:(playMp3Track(i,opts),true)}
