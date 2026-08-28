function xpNeed(){return 110+(state.level-1)*85}
function checkLevel(){if(!state)return;let leveled=false;while(state.xp>=xpNeed()){state.xp-=xpNeed();state.level++;state.attributePoints+=2;state.guardian.hp=maxHP();state.guardian.stamina=maxStamina();leveled=true;log(SOSText("core_settings_help_audio.checkLevel.001",state.level,guardianClass()?guardianClass()+' training improves automatically.':'Class selection is available at Level 2.'),'good');meta.highestLevel=Math.max(meta.highestLevel,state.level)}if(state.level>=2&&!state.guardian.className)state.guardian.classChoicePending=true;if(leveled){syncClassProgression();partyMembers(false).forEach(m=>{m.level=state.level;m.hp=Math.min(allyMaxHP(m),m.hp+5);m.stamina=allyMaxStamina(m)});sfx('level');saveMeta()}if(state.level>=7)unlock('veteran')}
function unlock(id){if(meta.achievements[id])return;const a=ACHIEVEMENTS.find(x=>x.id===id);if(!a)return;meta.achievements[id]=true;saveMeta();if(state)log(SOSText("core_settings_help_audio.unlock.001",a.name),'good')}
function checkAchievements(){if(!state)return;if(state.gold>=750)unlock('rich');if(state.flags.battlesThisCampaign>=15)unlock('hunter');if(state.town.upgrades.length>=8)unlock('builder');if(state.town.militia>=50)unlock('militia');if(state.flags.purchases>=12)unlock('merchant');if(state.scouting>=3)unlock('ranger');if(state.town.upgrades.includes('palisade')&&state.town.upgrades.includes('stonework'))unlock('stone');if(state.flags.compassion>=3)unlock('mercy')}

function showSettings(returnTo='menu'){modalRouteEnter(SOSText("core_settings_help_audio.showSettings.001"),Array.from(arguments));
 const ow=!!state&&isOpenWorld(),auto=ow?state.world.settings.silentIntegrityOnLoad!==false:true;overlay(SOSText("core_settings_help_audio.showSettings.002",soundOn?'On':'Off',ow?`<button id="settingsIntegrityAuto">Automatic Save Repair: ${auto?'On':'Off'}</button><button id="settingsIntegrity">Check Open World Save <small>Review and repair campaign data</small></button>`:'',ow?'<p class="muted compact">Automatic Save Repair checks older or incomplete Open World save data when the campaign is opened.</p>':''),true);
 $('#settingsSound').onclick=()=>{toggleSound();showSettings(returnTo)};if($('#settingsIntegrityAuto'))$('#settingsIntegrityAuto').onclick=()=>{state.world.settings.silentIntegrityOnLoad=!auto;save();showSettings(returnTo)};if($('#settingsIntegrity'))$('#settingsIntegrity').onclick=showOpenWorldPreflight;$('#settingsBack').onclick=()=>{closeOverlay();returnTo==='game'?gameMenu():renderMenu()}
}
function gameMenu(){overlay(SOSText("core_settings_help_audio.gameMenu.001"));$('#resume').onclick=closeAndRender;$('#saveNow').onclick=()=>{save();log(SOSText("core_settings_help_audio.gameMenu.002"),'good');closeAndRender()};$('#export').onclick=exportSave;$('#import').onclick=importSave;$('#help').onclick=showHelp;$('#settings').onclick=()=>showSettings('game');$('#quit').onclick=()=>{save();closeOverlay();state=null;renderMenu()};$('#reset').onclick=()=>{if(confirm(SOSText("core_settings_help_audio.gameMenu.003",isOpenWorld()?'Open World':'Siege'))){clearSave();state=null;closeOverlay();renderMenu()}}}
function exportSave(){if(!state)return;save();const blob=new Blob([JSON.stringify({type:SOSText("core_settings_help_audio.exportSave.001"),version:VERSION,state,meta},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`siege-of-shantium-${state.name.replace(/\W+/g,'-').toLowerCase()}-${isOpenWorld()?`day-${state.world.day}`:`round-${state.round}`}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);closeOverlay()}
function importSave(){const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.onchange=()=>{const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result),s=data.state||data;if(!s||!s.guardian||!s.town||!Array.isArray(s.groups))throw new Error(SOSText("core_settings_help_audio.importSave.001"));const warnings=prepareLoadedCampaign(s);meta=data.meta?{...defaultMeta(),...data.meta}:meta;saveMeta();if(warnings.length)log(SOSText("core_settings_help_audio.importSave.002"),'info');save();closeOverlay();renderGame()}catch(e){console.error(SOSText("core_settings_help_audio.importSave.003"),e);alert(SOSText("core_settings_help_audio.importSave.004",e?.message?`\n\n${e.message}`:''))}};r.readAsText(f)};inp.click()}
function showStats(){modalRouteEnter(SOSText("core_settings_help_audio.showStats.001"),Array.from(arguments));const unlocked=ACHIEVEMENTS.filter(a=>meta.achievements[a.id]),lh=meta.boundHistory;overlay(SOSText("core_settings_help_audio.showStats.002",[['Campaigns played',meta.campaigns],['Campaigns won',meta.wins],['Battles fought',meta.battles],['Battles won',meta.battleWins],['Enemies defeated',meta.enemies],['Gold earned',meta.goldEarned],['Highest level',meta.highestLevel],['Best ending',meta.bestEnding],['Guardians lost',meta.guardiansLost],['Perfect victories',meta.perfectVictories]].map(x=>`<div class="stat-row"><span>${x[0]}</span><b>${x[1]}</b></div>`).join(''),lh?`<div class="notice compact"><b>Legacy Weapon: ${esc(lh.name)}</b><br>Campaigns ${lh.campaigns||0} • Battles ${lh.battles||0} • Enemies ${lh.enemies||0} • Commanders ${lh.commanders||0}<br><small>Wielders: ${esc((lh.wielders||[]).join(', ')||'—')}</small></div>`:'',unlocked.length,ACHIEVEMENTS.length,ACHIEVEMENTS.map(a=>`<div class="card ${meta.achievements[a.id]?'':'muted'}"><b>${meta.achievements[a.id]?'✓ ':'○ '}${a.name}</b><br><small>${a.desc}</small></div>`).join(''),footer()),true);wireClose()}
function showHelp(){modalRouteEnter(SOSText("core_settings_help_audio.showHelp.001"),Array.from(arguments));
 const mode=state?.mode;
 overlay(SOSText("core_settings_help_audio.showHelp.002",mode?`<div class="notice compact"><b>Current campaign:</b> ${mode==='openworld'?'Open World':'Siege Mode'}</div>`:'',footer()),true);
 $('#helpOpenWorld').onclick=showOpenWorldHelp;$('#helpSiege').onclick=showSiegeHelp;$('#helpStatsGuide').onclick=()=>showClassGuide('help');wireClose()
}
function showOpenWorldHelp(){modalRouteEnter(SOSText("core_settings_help_audio.showOpenWorldHelp.001"),Array.from(arguments));overlay(SOSText("core_settings_help_audio.showOpenWorldHelp.002"),true);$('#openHelpStats').onclick=()=>showClassGuide('help');$('#openHelpSiege').onclick=showSiegeHelp;$('#openHelpBack').onclick=()=>SOSServices.navigation.back(showHelp)}
function showSiegeHelp(){modalRouteEnter(SOSText("core_settings_help_audio.showSiegeHelp.001"),Array.from(arguments));overlay(SOSText("core_settings_help_audio.showSiegeHelp.002",PARTY_UNLOCK_ROUND),true);$('#siegeHelpStats').onclick=()=>showClassGuide('help');$('#siegeHelpOpen').onclick=showOpenWorldHelp;$('#siegeHelpBack').onclick=()=>SOSServices.navigation.back(showHelp)}

let audioCtx=null;let soundOn=true;
function toggleSound(){soundOn=!soundOn}
function ensureAudio(){if(!soundOn)return null;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch(e){return null}}
function audioTone(freq,dur=.08,type='sine',gain=.04,when=0,endFreq=null){
 const ctx=ensureAudio();if(!ctx)return;const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+dur);g.gain.setValueAtTime(Math.max(.0001,gain),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+dur+.01)
}
function audioNoise(dur=.07,gain=.035,when=0,filterFreq=1200,filterType='lowpass'){
 const ctx=ensureAudio();if(!ctx)return;const sr=ctx.sampleRate,len=Math.max(1,Math.floor(sr*dur)),buf=ctx.createBuffer(1,len,sr),data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);
 const src=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter(),t=ctx.currentTime+when;src.buffer=buf;f.type=filterType;f.frequency.value=filterFreq;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);src.connect(f);f.connect(g);g.connect(ctx.destination);src.start(t)
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


window.addEventListener('beforeunload',()=>{if(state&&!state.ended)save()});
renderMenu();