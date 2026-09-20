/* UCL GameDay v0.5.58 — build fragment: 15_basic_sounds.js
   Lightweight generic sound playback helper. */
const BASIC_SOUND_ACTIVE=new Set();
let BASIC_SOUND_CURRENT=null;
let BASIC_SOUND_LAST_FINISHED_AT=0;
let BASIC_SOUND_PENDING=null;
let BASIC_SOUND_PENDING_TIMER=null;
const BASIC_SOUND_QUIET_MS=1000;

const UCL_NOTIFICATION_SETTINGS_KEY='ucl-gameday-notification-settings-v1';
function loadNotificationSettings(){
  try{
    const raw=JSON.parse(localStorage.getItem(UCL_NOTIFICATION_SETTINGS_KEY)||'{}');
    return {enabled:raw.enabled!==false,volume:Math.max(0,Math.min(1,Number(raw.volume??1)))};
  }catch(_){return {enabled:true,volume:1}}
}
let UCL_NOTIFICATION_SETTINGS=loadNotificationSettings();
function saveNotificationSettings(){
  try{localStorage.setItem(UCL_NOTIFICATION_SETTINGS_KEY,JSON.stringify(UCL_NOTIFICATION_SETTINGS))}catch(_){}
}
function setNotificationSoundsEnabled(enabled){
  UCL_NOTIFICATION_SETTINGS.enabled=!!enabled;
  if(!UCL_NOTIFICATION_SETTINGS.enabled)stopBasicSounds();
  saveNotificationSettings();
}
function setNotificationVolume(volume){
  UCL_NOTIFICATION_SETTINGS.volume=Math.max(0,Math.min(1,Number(volume||0)));
  if(BASIC_SOUND_CURRENT)BASIC_SOUND_CURRENT.volume=UCL_NOTIFICATION_SETTINGS.volume;
  saveNotificationSettings();
}
window.setNotificationSoundsEnabled=setNotificationSoundsEnabled;
window.setNotificationVolume=setNotificationVolume;
window.getNotificationSettings=()=>({...UCL_NOTIFICATION_SETTINGS});


function basicSoundClearPendingTimer(){
  if(BASIC_SOUND_PENDING_TIMER){clearTimeout(BASIC_SOUND_PENDING_TIMER);BASIC_SOUND_PENDING_TIMER=null}
}
function basicSoundCanStartNow(){
  return !BASIC_SOUND_CURRENT && Date.now()-BASIC_SOUND_LAST_FINISHED_AT>=BASIC_SOUND_QUIET_MS;
}
function basicSoundFinalize(audio){
  if(!audio)return;
  BASIC_SOUND_ACTIVE.delete(audio);
  if(BASIC_SOUND_CURRENT===audio)BASIC_SOUND_CURRENT=null;
  BASIC_SOUND_LAST_FINISHED_AT=Date.now();
  basicSoundClearPendingTimer();
  if(BASIC_SOUND_PENDING){
    BASIC_SOUND_PENDING_TIMER=setTimeout(basicSoundDrainPending,BASIC_SOUND_QUIET_MS);
  }
}
function basicSoundStart(src,options={}){
  if(!src)return null;
  const volume=Math.max(0,Math.min(1,Number(options.volume??1)));
  try{
    const audio=new Audio(src);
    audio.volume=volume;
    audio.preload='auto';
    BASIC_SOUND_CURRENT=audio;
    BASIC_SOUND_ACTIVE.add(audio);
    const finish=()=>basicSoundFinalize(audio);
    audio.addEventListener('ended',finish,{once:true});
    audio.addEventListener('error',finish,{once:true});
    const p=audio.play();
    if(p&&typeof p.catch==='function')p.catch(()=>finish());
    return audio;
  }catch(_){
    BASIC_SOUND_CURRENT=null;
    BASIC_SOUND_LAST_FINISHED_AT=Date.now();
    return null;
  }
}
function basicSoundDrainPending(){
  basicSoundClearPendingTimer();
  if(!BASIC_SOUND_PENDING||BASIC_SOUND_CURRENT)return null;
  const wait=Math.max(0,BASIC_SOUND_QUIET_MS-(Date.now()-BASIC_SOUND_LAST_FINISHED_AT));
  if(wait>0){
    BASIC_SOUND_PENDING_TIMER=setTimeout(basicSoundDrainPending,wait);
    return null;
  }
  const next=BASIC_SOUND_PENDING;
  BASIC_SOUND_PENDING=null;
  return basicSoundStart(next.src,next.options);
}
function playSound(src,options={}){
  if(!src||!UCL_NOTIFICATION_SETTINGS.enabled)return null;
  options={...options,volume:Math.max(0,Math.min(1,Number(options.volume??1)*UCL_NOTIFICATION_SETTINGS.volume))};
  if(basicSoundCanStartNow())return basicSoundStart(src,options);

  // Collapse blocked triggers to a single pending sound instead of building
  // an audio backlog. A newer trigger replaces the older pending trigger.
  BASIC_SOUND_PENDING={src,options:{...options},queuedAt:Date.now()};
  basicSoundClearPendingTimer();
  if(!BASIC_SOUND_CURRENT){
    const wait=Math.max(0,BASIC_SOUND_QUIET_MS-(Date.now()-BASIC_SOUND_LAST_FINISHED_AT));
    BASIC_SOUND_PENDING_TIMER=setTimeout(basicSoundDrainPending,wait);
  }
  return null;
}
function stopBasicSounds(){
  BASIC_SOUND_PENDING=null;
  basicSoundClearPendingTimer();
  for(const audio of BASIC_SOUND_ACTIVE){
    try{audio.pause();audio.currentTime=0}catch(_){}
  }
  BASIC_SOUND_ACTIVE.clear();
  BASIC_SOUND_CURRENT=null;
  BASIC_SOUND_LAST_FINISHED_AT=Date.now();
}
window.playSound=playSound;
window.stopBasicSounds=stopBasicSounds;

const UCL_MAJOR_NOTIFICATION_SRC=window.UCL_MAJOR_NOTIFICATION_SRC_OVERRIDE||'assets/audio/ucl_notification.mp3';
const UCL_MAJOR_NOTIFICATION_PLAYED=new Set();

function gvMajorNotificationYards(evt){
  const direct=Math.abs(Number(evt?.visualYards||evt?.yards||0));
  const stats=evt?.intervalAnalysis?.stats||{};
  const yardKeys=['pass_yd','rush_yd','rec_yd','kick_ret_yd','punt_ret_yd','int_ret_yd','fum_ret_yd'];
  return Math.max(direct,...yardKeys.map(k=>Math.abs(Number(stats[k]||0))));
}
function gvMajorNotificationTouchdown(evt){
  const stats=evt?.intervalAnalysis?.stats||{};
  const tdKeys=['pass_td','rush_td','rec_td','fum_rec_td','def_td','def_st_td','st_td','kick_ret_td','punt_ret_td'];
  if(tdKeys.some(k=>Number(stats[k]||0)>0))return true;
  const text=`${evt?.playType||''} ${evt?.detail||''}`.toLowerCase();
  return /touchdown|pick six|scoop and score|kick six|return td|_td\b/.test(text);
}
function gvMajorNotificationFantasyPoints(evt){
  if(Array.isArray(evt?.fantasyImpacts)&&evt.fantasyImpacts.length){
    return Math.max(...evt.fantasyImpacts.map(x=>Math.abs(Number(x?.delta||0))));
  }
  return Math.abs(Number(evt?.delta||0));
}
function gvIsMajorNotificationEvent(evt){
  if(!evt||evt.type==='summary')return false;
  return gvMajorNotificationFantasyPoints(evt)>=10||gvMajorNotificationTouchdown(evt)||gvMajorNotificationYards(evt)>=50;
}
function gvPlayMajorNotification(evt){
  if(!gvIsMajorNotificationEvent(evt))return false;
  const key=String(evt?.dedupeKey||evt?.id||'');
  if(key&&UCL_MAJOR_NOTIFICATION_PLAYED.has(key))return false;
  if(key)UCL_MAJOR_NOTIFICATION_PLAYED.add(key);
  playSound(UCL_MAJOR_NOTIFICATION_SRC,{volume:1});
  return true;
}
window.gvPlayMajorNotification=gvPlayMajorNotification;
