function checkLevel(){if(!state)return;if(state.progressionModel!==XP_MODEL)migrateCumulativeXpModel();let leveled=false;while(state.xp>=xpTotalForLevel(state.level+1)){state.level++;state.attributePoints+=2;state.guardian.hp=maxHP();state.guardian.stamina=maxStamina();leveled=true;log(SOSText("core_settings_help_audio.checkLevel.001",state.level,guardianClass()?guardianClass()+' training improves automatically.':'Class selection is available at Level 2.'),'good');meta.highestLevel=Math.max(meta.highestLevel,state.level)}if(state.level>=2&&!state.guardian.className)state.guardian.classChoicePending=true;if(leveled){syncClassProgression();partyMembers(false).forEach(m=>{m.level=state.level;m.hp=Math.min(allyMaxHP(m),m.hp+5);m.stamina=allyMaxStamina(m)});sfx('level');saveMeta()}if(state.level>=7)unlock('veteran')}
function unlock(id){if(meta.achievements[id])return;const a=ACHIEVEMENTS.find(x=>x.id===id);if(!a)return;meta.achievements[id]=true;saveMeta();if(state)log(SOSText("core_settings_help_audio.unlock.001",a.name),'good')}
function checkAchievements(){if(!state)return;if(state.gold>=750)unlock('rich');if(state.flags.battlesThisCampaign>=15)unlock('hunter');if(state.town.upgrades.length>=8)unlock('builder');if(state.town.militia>=50)unlock('militia');if(state.flags.purchases>=12)unlock('merchant');if(state.scouting>=3)unlock('ranger');if(state.town.upgrades.includes('palisade')&&state.town.upgrades.includes('stonework'))unlock('stone');if(state.flags.compassion>=3)unlock('mercy')}

function showSettings(returnTo='menu'){modalRouteEnter(SOSText("core_settings_help_audio.showSettings.001"),Array.from(arguments));
 const ow=!!state&&isOpenWorld(),auto=ow?state.world.settings.silentIntegrityOnLoad!==false:true,mv=Math.round((typeof musicVolume==='number'?musicVolume:.32)*100),sv=Math.round((typeof sfxVolume==='number'?sfxVolume:.75)*100),me=typeof musicEnabled==='boolean'?musicEnabled:true,track=typeof currentMusicTrack==='function'?currentMusicTrack():'—',playStatus=typeof musicPlaybackStatus==='function'?musicPlaybackStatus():'Stopped',engine=typeof currentMusicEngine==='function'?currentMusicEngine():'Native';
 overlay(`<h2>Settings</h2><div class="card"><h3>Sound & Music</h3><div class="stat-row"><span>Sound Effects</span><b>${soundOn?'On':'Off'}</b></div><button id="settingsSound">Sound Effects: ${soundOn?'On':'Off'}</button><label class="settings-slider"><span>Sound Effects Volume <b id="sfxVolumeValue">${sv}%</b></span><input id="settingsSfxVolume" type="range" min="0" max="100" step="5" value="${sv}"></label><div class="stat-row"><span>Music</span><b>${me?'On':'Off'}</b></div><button id="settingsMusic">Music: ${me?'On':'Off'}</button><label class="settings-slider"><span>Music Volume <b id="musicVolumeValue">${mv}%</b></span><input id="settingsMusicVolume" type="range" min="0" max="100" step="5" value="${mv}"></label><div class="notice compact"><b>Now playing:</b> ${esc(track)}<br><b>Status:</b> ${esc(playStatus)} • <b>Engine:</b> ${esc(engine)}<br><small>Six original MIDI tracks play continuously as a looping playlist. Tone.js is used when available; the native engine remains a fallback.</small></div><div class="dialog-toolbar"><button id="settingsPlayMusic">▶ Play</button><button id="settingsStopMusic">■ Stop</button><button id="settingsNextTrack">Next Music Track</button></div></div>${ow?`<div class="card"><h3>Open World Save</h3><button id="settingsIntegrityAuto">Automatic Save Repair: ${auto?'On':'Off'}</button><button id="settingsIntegrity">Check Open World Save <small>Review and repair campaign data</small></button><p class="muted compact">Automatic Save Repair checks older or incomplete Open World save data when the campaign is opened.</p></div>`:''}<div class="dialog-footer"><button id="settingsBack">Back</button></div>`,true);
 $('#settingsSound').onclick=()=>{toggleSound();if(typeof saveAudioPrefs==='function')saveAudioPrefs();showSettings(returnTo)};
 $('#settingsSfxVolume').oninput=e=>{if(typeof setSfxVolume==='function')setSfxVolume(Number(e.target.value)/100);$('#sfxVolumeValue').textContent=e.target.value+'%'};
 $('#settingsMusic').onclick=()=>{if(typeof setMusicEnabled==='function')setMusicEnabled(!musicEnabled);showSettings(returnTo)};
 $('#settingsMusicVolume').oninput=e=>{if(typeof setMusicVolume==='function')setMusicVolume(Number(e.target.value)/100);$('#musicVolumeValue').textContent=e.target.value+'%'};
 $('#settingsPlayMusic').onclick=async()=>{if(typeof playMusic==='function')await playMusic();showSettings(returnTo)};
 $('#settingsStopMusic').onclick=async()=>{if(typeof stopMusic==='function')await stopMusic();showSettings(returnTo)};
 $('#settingsNextTrack').onclick=()=>{if(typeof nextMusicTrack==='function')nextMusicTrack();showSettings(returnTo)};
 if($('#settingsIntegrityAuto'))$('#settingsIntegrityAuto').onclick=()=>{state.world.settings.silentIntegrityOnLoad=!auto;save();showSettings(returnTo)};if($('#settingsIntegrity'))$('#settingsIntegrity').onclick=showOpenWorldPreflight;
 $('#settingsBack').onclick=()=>{closeOverlay();returnTo==='game'?gameMenu():renderMenu()}
}
function gameMenu(){overlay(SOSText("core_settings_help_audio.gameMenu.001"));$('#resume').onclick=closeAndRender;$('#saveNow').onclick=()=>{save();log(SOSText("core_settings_help_audio.gameMenu.002"),'good');closeAndRender()};if($('#optimizeSave'))$('#optimizeSave').onclick=showSaveOptimizationResult;$('#export').onclick=exportSave;$('#import').onclick=importSave;$('#help').onclick=showHelp;$('#settings').onclick=()=>showSettings('game');$('#quit').onclick=()=>{save();closeOverlay();state=null;renderMenu()};$('#reset').onclick=()=>{if(confirm(SOSText("core_settings_help_audio.gameMenu.003",isOpenWorld()?'Open World':(typeof isSiegeModeII==='function'&&isSiegeModeII()?'Siege Mode II':'Legacy Siege Mode')))){clearSave();state=null;closeOverlay();renderMenu()}}}
function exportSave(){if(!state)return;save();const blob=new Blob([JSON.stringify({type:SOSText("core_settings_help_audio.exportSave.001"),version:VERSION,state,meta},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`siege-of-shantium-${state.name.replace(/\W+/g,'-').toLowerCase()}-${isOpenWorld()?`day-${state.world.day}`:(typeof isSiegeModeII==='function'&&isSiegeModeII()?'siege-ii':'legacy-siege-round-'+state.round)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);closeOverlay()}
function importSave(){const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.onchange=()=>{const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result),s=data.state||data;if(!s||!s.guardian||!s.town||!Array.isArray(s.groups))throw new Error(SOSText("core_settings_help_audio.importSave.001"));const warnings=prepareLoadedCampaign(s);meta=data.meta?{...defaultMeta(),...data.meta}:meta;saveMeta();if(warnings.length)log(SOSText("core_settings_help_audio.importSave.002"),'info');save();closeOverlay();renderGame()}catch(e){console.error(SOSText("core_settings_help_audio.importSave.003"),e);alert(SOSText("core_settings_help_audio.importSave.004",e?.message?`\n\n${e.message}`:''))}};r.readAsText(f)};inp.click()}
function showStats(){modalRouteEnter(SOSText("core_settings_help_audio.showStats.001"),Array.from(arguments));const unlocked=ACHIEVEMENTS.filter(a=>meta.achievements[a.id]),lh=meta.boundHistory;overlay(SOSText("core_settings_help_audio.showStats.002",[['Campaigns played',meta.campaigns],['Campaigns won',meta.wins],['Battles fought',meta.battles],['Battles won',meta.battleWins],['Enemies defeated',meta.enemies],['Gold earned',meta.goldEarned],['Highest level',meta.highestLevel],['Best ending',meta.bestEnding],['Guardians lost',meta.guardiansLost],['Perfect victories',meta.perfectVictories]].map(x=>`<div class="stat-row"><span>${x[0]}</span><b>${x[1]}</b></div>`).join(''),lh?`<div class="notice compact"><b>Legacy Weapon: ${esc(lh.name)}</b><br>Campaigns ${lh.campaigns||0} • Battles ${lh.battles||0} • Enemies ${lh.enemies||0} • Commanders ${lh.commanders||0}<br><small>Wielders: ${esc((lh.wielders||[]).join(', ')||'—')}</small></div>`:'',unlocked.length,ACHIEVEMENTS.length,ACHIEVEMENTS.map(a=>`<div class="card ${meta.achievements[a.id]?'':'muted'}"><b>${meta.achievements[a.id]?'✓ ':'○ '}${a.name}</b><br><small>${a.desc}</small></div>`).join(''),footer()),true);wireClose()}
function showHelp(){modalRouteEnter(SOSText("core_settings_help_audio.showHelp.001"),Array.from(arguments));
 const mode=state?.mode;
 overlay(SOSText("core_settings_help_audio.showHelp.002",mode?`<div class="notice compact"><b>Current campaign:</b> ${mode==='openworld'?'Open World':mode==='siege2'?'Siege Mode II':'Legacy Siege Mode'}</div>`:'',footer()),true);
 $('#helpOpenWorld').onclick=showOpenWorldHelp;$('#helpSiegeII').onclick=showSiegeIIHelp;$('#helpLegacySiege').onclick=showSiegeHelp;$('#helpStatsGuide').onclick=()=>showClassGuide('help');wireClose()
}
function returnToHelpIndex(){if(typeof resetModalNavigation==='function')resetModalNavigation();showHelp()}
function showOpenWorldHelp(){modalRouteEnter(SOSText("core_settings_help_audio.showOpenWorldHelp.001"),Array.from(arguments));overlay(SOSText("core_settings_help_audio.showOpenWorldHelp.002"),true);$('#openHelpStats').onclick=()=>showClassGuide('help');$('#openHelpSiegeII').onclick=showSiegeIIHelp;$('#openHelpLegacySiege').onclick=showSiegeHelp;$('#openHelpBack').onclick=returnToHelpIndex}
function showSiegeIIHelp(){modalRouteEnter('showSiegeIIHelp',Array.from(arguments));overlay(SOSText('core_settings_help_audio.showSiegeIIHelp.002'),true);$('#siegeIIHelpStats').onclick=()=>showClassGuide('help');$('#siegeIIHelpOpen').onclick=showOpenWorldHelp;$('#siegeIIHelpLegacy').onclick=showSiegeHelp;$('#siegeIIHelpBack').onclick=returnToHelpIndex}
function showSiegeHelp(){modalRouteEnter(SOSText("core_settings_help_audio.showSiegeHelp.001"),Array.from(arguments));overlay(SOSText("core_settings_help_audio.showSiegeHelp.002",PARTY_UNLOCK_ROUND),true);$('#siegeHelpStats').onclick=()=>showClassGuide('help');$('#siegeHelpOpen').onclick=showOpenWorldHelp;$('#siegeHelpII').onclick=showSiegeIIHelp;$('#siegeHelpBack').onclick=returnToHelpIndex}

let audioCtx=null;let soundOn=true;
function toggleSound(){soundOn=!soundOn;if(typeof saveAudioPrefs==='function')saveAudioPrefs()}
function ensureAudio(){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch(e){return null}}
function audioTone(freq,dur=.08,type='sine',gain=.04,when=0,endFreq=null){
 const ctx=ensureAudio();if(!ctx)return;const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+dur);g.gain.setValueAtTime(Math.max(.0001,gain*(typeof sfxVolume==='number'?sfxVolume:1)),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+dur+.01)
}
function audioNoise(dur=.07,gain=.035,when=0,filterFreq=1200,filterType='lowpass'){
 const ctx=ensureAudio();if(!ctx)return;const sr=ctx.sampleRate,len=Math.max(1,Math.floor(sr*dur)),buf=ctx.createBuffer(1,len,sr),data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);
 const src=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter(),t=ctx.currentTime+when;src.buffer=buf;f.type=filterType;f.frequency.value=filterFreq;g.gain.setValueAtTime(gain*(typeof sfxVolume==='number'?sfxVolume:1),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);src.connect(f);f.connect(g);g.connect(ctx.destination);src.start(t)
}
function combatSoundProfile(cls,w){
 const fam=weaponFamily(w||{});if([SOSText("core_settings_help_audio.combatSoundProfile.001"),SOSText("core_settings_help_audio.combatSoundProfile.002")].includes(cls)||[SOSText("core_settings_help_audio.combatSoundProfile.003"),SOSText("core_settings_help_audio.combatSoundProfile.004")].includes(fam))return'magic';
 if(cls===SOSText("core_settings_help_audio.combatSoundProfile.005")||[SOSText("core_settings_help_audio.combatSoundProfile.006"),SOSText("core_settings_help_audio.combatSoundProfile.007")].includes(fam))return fam===SOSText("core_settings_help_audio.combatSoundProfile.008")?'crossbow':'bow';
 if(cls===SOSText("core_settings_help_audio.combatSoundProfile.009")||fam===SOSText("core_settings_help_audio.combatSoundProfile.010"))return fam===SOSText("core_settings_help_audio.combatSoundProfile.011")?'firearm':fam===SOSText("core_settings_help_audio.combatSoundProfile.012")?'crossbow':fam===SOSText("core_settings_help_audio.combatSoundProfile.013")?'blade':'ranged';
 if(fam===SOSText("core_settings_help_audio.combatSoundProfile.014")||fam===SOSText("core_settings_help_audio.combatSoundProfile.015"))return'blunt';
 if([SOSText("core_settings_help_audio.combatSoundProfile.016"),SOSText("core_settings_help_audio.combatSoundProfile.017")].includes(fam))return'blunt';
 return'melee'
}
function sfxCombatAttack(profile,hit=true,armored=false,heavy=false){
 if(!soundOn)return;
 const p=profile||'melee';
 if(p==='magic'){
   audioTone(220,heavy?.24:.16,'sine',.035,0,heavy?880:620);audioTone(330,heavy?.28:.18,'triangle',.025,.015,heavy?1320:900);audioNoise(heavy?.18:.12,.018,.01,2200,'bandpass');if(hit){audioTone(760,.11,'sine',.028,.09,390);audioNoise(.08,.02,.08,1500,'highpass')}return
 }
 if(p==='bow'||p==='ranged'){
   audioTone(p==='bow'?165:210,.055,'triangle',.035,0,p==='bow'?85:120);audioNoise(.10,.022,.018,3200,'highpass');if(hit){audioNoise(.065,.045,.075,armored?3600:1050,armored?'bandpass':'lowpass');if(armored)audioTone(1180,.06,'triangle',.018,.075,720)}return
 }
 if(p==='crossbow'){
   audioNoise(.035,.05,0,2500,'highpass');audioTone(115,.045,'square',.025,0,70);audioNoise(.10,.022,.025,3200,'highpass');if(hit){audioNoise(.07,.05,.075,armored?3800:1100,armored?'bandpass':'lowpass');if(armored)audioTone(1350,.07,'triangle',.02,.075,760)}return
 }
 if(p==='firearm'){
   audioNoise(.045,.085,0,4200,'highpass');audioTone(95,.055,'square',.035,0,48);audioNoise(.14,.035,.025,900,'lowpass');if(hit){audioNoise(.07,.045,.065,armored?4000:1000,armored?'bandpass':'lowpass');if(armored)audioTone(1500,.08,'triangle',.02,.065,800)}return
 }
 // Melee: fast air movement followed by flesh/armor contact.
 audioNoise(heavy?.10:.075,.028,0,2400,'highpass');audioTone(heavy?90:130,heavy?.09:.065,'triangle',.022,0,heavy?52:75);
 if(hit){audioNoise(heavy?.11:.08,heavy?.07:.055,.045,armored?3900:650,armored?'bandpass':'lowpass');if(armored){audioTone(heavy?820:1050,.10,'triangle',.028,.045,heavy?410:580);audioTone(1650,.055,'sine',.012,.05,900)}else{audioTone(heavy?75:105,.065,'sine',.018,.05,55)}} 
}
function sfxAttackForGuardian(hit=true,target=null,heavy=false){
 const cls=guardianClass()||SOSText("core_settings_help_audio.sfxAttackForGuardian.001"),w=weapon(),armored=!!target&&['armored','stone','shield'].includes(target.trait);sfxCombatAttack(combatSoundProfile(cls,w),hit,armored,heavy)
}
function sfxAttackForAlly(m,hit=true,target=null,heavy=false){
 const cls=m.className||allyDef(m.id)?.className,w=allyWeapon(m),armored=!!target&&['armored','stone','shield'].includes(target.trait);sfxCombatAttack(combatSoundProfile(cls,w),hit,armored,heavy)
}
function sfx(type){if(!soundOn)return;const cfg={strike:[150,.06,'square'],miss:[90,.04,'sine'],coin:[780,.08,'square'],potion:[440,.12,'sine'],level:[880,.2,'square'],horn:[110,.3,'sawtooth'],repair:[260,.08,'square'],victory:[660,.28,'triangle'],defeat:[80,.4,'sawtooth']}[type]||[220,.06,'square'];audioTone(cfg[0],cfg[1],cfg[2],.06)}

function sfxWorld(kind){
 if(!soundOn)return;
 switch(kind){
  case 'uiBlocked':audioTone(120,.055,'square',.018);break;
  case 'coinsSmall':audioTone(820,.055,'square',.035);audioTone(1080,.04,'triangle',.022,.035);break;
  case 'coinsLarge':audioTone(650,.07,'square',.04);audioTone(900,.07,'triangle',.032,.04);audioTone(1220,.09,'sine',.02,.075);break;
  case 'cargo':audioNoise(.09,.035,0,520,'lowpass');audioTone(110,.08,'triangle',.022,.035,75);break;
  case 'equip':audioTone(720,.055,'triangle',.025);audioNoise(.05,.018,.02,2800,'bandpass');break;
  case 'parchment':audioNoise(.10,.025,0,1800,'highpass');audioNoise(.06,.012,.04,900,'bandpass');break;
  case 'construction':audioNoise(.06,.045,0,900,'bandpass');audioTone(180,.09,'square',.03,.01,115);audioNoise(.045,.03,.12,1300,'bandpass');break;
  case 'craftComplete':audioTone(330,.08,'triangle',.025);audioTone(495,.10,'triangle',.03,.07);audioTone(660,.14,'sine',.025,.15);break;
  case 'depart':audioTone(145,.08,'triangle',.022);audioNoise(.16,.022,.025,700,'lowpass');audioTone(115,.10,'triangle',.12);break;
  case 'arrive':audioTone(262,.08,'triangle',.025);audioTone(392,.13,'triangle',.03,.075);break;
  case 'camp':audioNoise(.16,.024,0,550,'lowpass');audioTone(95,.11,'sine',.018,.04,70);break;
  case 'meal':audioTone(520,.045,'triangle',.018);audioTone(690,.05,'triangle',.018,.055);audioNoise(.05,.01,.02,2400,'highpass');break;
  case 'healSoft':audioTone(392,.12,'sine',.022);audioTone(523,.16,'sine',.018,.08);break;
  case 'recruit':audioTone(330,.08,'triangle',.025);audioTone(440,.08,'triangle',.03,.08);audioTone(660,.14,'triangle',.025,.16);break;
  case 'relationshipUp':audioTone(440,.07,'sine',.018);audioTone(554,.11,'sine',.02,.065);break;
  case 'relationshipDown':audioTone(330,.08,'sine',.018);audioTone(247,.13,'sine',.02,.07);break;
  case 'discovery':audioTone(392,.08,'sine',.02);audioTone(587,.12,'triangle',.025,.07);audioTone(784,.18,'sine',.02,.16);break;
  case 'questAccept':audioNoise(.06,.018,0,1700,'highpass');audioTone(294,.08,'triangle',.018,.05);audioTone(440,.12,'triangle',.022,.11);break;
  case 'questComplete':audioTone(392,.08,'triangle',.024);audioTone(523,.10,'triangle',.028,.075);audioTone(784,.18,'sine',.025,.165);break;
  case 'questFail':audioTone(294,.10,'triangle',.022);audioTone(220,.18,'sawtooth',.018,.09);break;
  case 'custody':audioNoise(.055,.035,0,2500,'bandpass');audioTone(115,.11,'square',.018,.03,80);break;
  case 'release':audioTone(220,.07,'triangle',.02);audioTone(330,.11,'triangle',.024,.065);break;
  case 'escape':audioNoise(.08,.028,0,2600,'highpass');audioTone(180,.06,'triangle',.016,.02,290);audioTone(360,.10,'triangle',.018,.07,540);break;
  case 'politics':audioNoise(.07,.012,0,1600,'highpass');audioTone(262,.07,'triangle',.018,.05);audioTone(330,.09,'triangle',.018,.11);break;
  case 'warning':audioTone(180,.09,'square',.022);audioTone(150,.14,'square',.02,.10);break;
  case 'door':audioNoise(.10,.025,0,450,'lowpass');audioTone(85,.10,'triangle',.016,.03,60);break;
  default:sfx('strike');
 }
}

