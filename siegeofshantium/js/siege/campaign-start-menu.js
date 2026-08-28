function chooseObjective(faction,commander,round,size){if(commander)return'command';if(round>=5&&chance(.16))return'engineer';if(size<=3&&chance(.24))return'scout';if([SOSText("siege_campaign_start_menu.chooseObjective.001"),SOSText("siege_campaign_start_menu.chooseObjective.002")].includes(faction)&&chance(.45))return'raid';if(round>=4&&chance(.18))return'reinforce';return'assault'}
function forceObjective(gr){return FORCE_OBJECTIVES[gr.objective||'assault']||FORCE_OBJECTIVES.assault}
function forceStatus(gr){if(gr.camp)return gr.camp==='siege'?'Siege works':SOSText("siege_campaign_start_menu.forceStatus.001");if(gr.retreating)return SOSText("siege_campaign_start_menu.forceStatus.002");if(gr.objective==='reinforce')return SOSText("siege_campaign_start_menu.forceStatus.003");if(gr.objective==='scout')return SOSText("siege_campaign_start_menu.forceStatus.004");return SOSText("siege_campaign_start_menu.forceStatus.005")}
function strategicIntelLevel(){const trustedScout=state.party?.active?.includes('scout')&&state.party?.members?.scout&&companionTrust(state.party.members.scout)>=75?1:0;return state.scouting+(state.allies.includes('scout')?1:0)+trustedScout+(state.town.upgrades.includes('watchtower')?1:0)+(state.town.upgrades.includes(SOSText("siege_campaign_start_menu.strategicIntelLevel.001"))?1:0)+(state.flags.fullIntel>0?3:0)}
function weatherForRound(round=state.round){return [SOSText("siege_campaign_start_menu.weatherForRound.001"),SOSText("siege_campaign_start_menu.weatherForRound.002"),SOSText("siege_campaign_start_menu.weatherForRound.003"),SOSText("siege_campaign_start_menu.weatherForRound.004"),SOSText("siege_campaign_start_menu.weatherForRound.005"),SOSText("siege_campaign_start_menu.weatherForRound.006")][round%6]}
function weatherEffects(){const w=weatherForRound();return w===SOSText("siege_campaign_start_menu.weatherEffects.001")?'Road movement and ranged attacks are hindered.':w===SOSText("siege_campaign_start_menu.weatherEffects.002")?'Scouting information is less reliable.':w===SOSText("siege_campaign_start_menu.weatherEffects.003")?'Ranged attacks are less reliable; Air magic is energized.':w===SOSText("siege_campaign_start_menu.weatherEffects.004")?'Heavy formations move more slowly.':SOSText("siege_campaign_start_menu.weatherEffects.005")}
function routeTrait(id){return {north:SOSText("siege_campaign_start_menu.routeTrait.001"),river:SOSText("siege_campaign_start_menu.routeTrait.002"),quarry:SOSText("siege_campaign_start_menu.routeTrait.003"),south:SOSText("siege_campaign_start_menu.routeTrait.004")}[id]||SOSText("siege_campaign_start_menu.routeTrait.005")}
function createGroups(round){
 const d=DIFFICULTIES[state.difficulty]; let count=round===12?5:clamp(1+Math.floor(round/3)+rnd(0,1),2,4);
 if(state.difficulty===SOSText("siege_campaign_start_menu.createGroups.001")&&chance(.45))count++;
 const pools=round<=3?ENEMIES.slice(0,12):round<=6?ENEMIES.slice(0,22):round<=9?ENEMIES.slice(5,31):ENEMIES.slice(8);
 const groups=[];
 for(let i=0;i<count;i++){
   const faction=round>=4?pick([SOSText("siege_campaign_start_menu.createGroups.002"),SOSText("siege_campaign_start_menu.createGroups.003"),SOSText("siege_campaign_start_menu.createGroups.004"),SOSText("siege_campaign_start_menu.createGroups.005"),SOSText("siege_campaign_start_menu.createGroups.006"),SOSText("siege_campaign_start_menu.createGroups.007"),SOSText("siege_campaign_start_menu.createGroups.008")]):pick([SOSText("siege_campaign_start_menu.createGroups.009"),SOSText("siege_campaign_start_menu.createGroups.010"),SOSText("siege_campaign_start_menu.createGroups.011"),SOSText("siege_campaign_start_menu.createGroups.012")]);
   const size=round===12?rnd(4,7):clamp(rnd(2,3)+Math.floor(round/4),2,6);
   const distance=round===12?rnd(1,2):rnd(2,5);
   const speed=chance(.2+.03*round)?2:1;
   const members=[];
   for(let j=0;j<size;j++){const base=pick(pools);members.push(makeEnemy(base,d.enemy,round));}
   let commander=null;
   if((round>=4&&chance(.2))||round===6||round===9||round===12){commander=round===12?COMMANDERS[7]:pick(COMMANDERS.slice(0,round>=10?7:5));const bossBase=enemyByName(round===12?'War Captain':pick([SOSText("siege_campaign_start_menu.createGroups.013"),SOSText("siege_campaign_start_menu.createGroups.014"),SOSText("siege_campaign_start_menu.createGroups.015"),SOSText("siege_campaign_start_menu.createGroups.016")]));members.push({...makeEnemy(bossBase,d.enemy*1.25,round),name:commander.name,boss:true,trait:commander.trait});}
   const route=pick(ROUTES); const name=commander?SOSText("siege_campaign_start_menu.createGroups.017",commander.name):groupName(faction,round);
   let objective=chooseObjective(faction,commander,round,size);if(round>=11){objective=commander?'command':chance(.3)?'engineer':'assault'}groups.push({id:uid(),name,faction,route:route.id,distance,speed,members,objective,status:'advancing',camp:null,progress:0,retreating:false,threat:Math.round(members.reduce((a,e)=>a+e.maxHp+e.damage*4,0)/10),loot:Math.round((35+round*10+size*9)*d.economy),xp:55+round*18+size*14,commander,engaged:false});
 }
 return groups;
}
function makeEnemy(base,mult,round){const hp=Math.round((base.hp+round*2.2)*mult);return {id:uid(),name:base.name,hp,maxHp:hp,damage:Math.round((base.damage+round*.7)*mult),acc:base.acc,init:base.init,trait:base.trait,status:[]}}
function groupName(faction,round){const a={Redstone:[SOSText("siege_campaign_start_menu.groupName.001"),SOSText("siege_campaign_start_menu.groupName.002"),SOSText("siege_campaign_start_menu.groupName.003")],Bluestone:[SOSText("siege_campaign_start_menu.groupName.004"),SOSText("siege_campaign_start_menu.groupName.005"),SOSText("siege_campaign_start_menu.groupName.006")],Spawn:[SOSText("siege_campaign_start_menu.groupName.007"),SOSText("siege_campaign_start_menu.groupName.008"),SOSText("siege_campaign_start_menu.groupName.009")],Raiders:[SOSText("siege_campaign_start_menu.groupName.010"),SOSText("siege_campaign_start_menu.groupName.011"),SOSText("siege_campaign_start_menu.groupName.012")],Brigands:[SOSText("siege_campaign_start_menu.groupName.013"),SOSText("siege_campaign_start_menu.groupName.014"),SOSText("siege_campaign_start_menu.groupName.015")],Beasts:[SOSText("siege_campaign_start_menu.groupName.016"),SOSText("siege_campaign_start_menu.groupName.017"),SOSText("siege_campaign_start_menu.groupName.018")],Cult:[SOSText("siege_campaign_start_menu.groupName.019"),SOSText("siege_campaign_start_menu.groupName.020"),SOSText("siege_campaign_start_menu.groupName.021")],Mercenaries:[SOSText("siege_campaign_start_menu.groupName.022"),SOSText("siege_campaign_start_menu.groupName.023"),SOSText("siege_campaign_start_menu.groupName.024")]};return pick(a[faction]||[SOSText("siege_campaign_start_menu.groupName.025")])+(round>8?' — Elite':'')}

function equipReturnedBoundWeapon(){
 if(!meta.boundWeapon)return false;
 if(meta.boundItem&&!ITEMS.some(i=>i.id===meta.boundWeapon)&&!state.customItems.some(i=>i.id===meta.boundWeapon))state.customItems.push({...meta.boundItem});
 const legacy=item(meta.boundWeapon);if(!legacy||legacy.slot!=='weapon')return false;
 state.flags.legacyWeapon=meta.boundWeapon;
 // Bound weapons return equipped. Preserve the normal starter weapon in the common pack.
 const current=state.guardian.equipment.weapon;
 if(current&&current!==meta.boundWeapon)invAdd(current);
 // Remove any accidental duplicate copy from the common pack before equipping.
 while(state.guardian.inventory.some(x=>x.id===meta.boundWeapon))invRemove(meta.boundWeapon);
 state.guardian.equipment.weapon=meta.boundWeapon;
 log(SOSText("siege_campaign_start_menu.equipReturnedBoundWeapon.001",legacy.name),'good');
 return true
}
function startCampaign(mode='siege',confirmed=false){
 if(!confirmed&&hasModeSave(mode)){const label=mode==='openworld'?'Open World':SOSText("siege_campaign_start_menu.startCampaign.001");if(!confirm(SOSText("siege_campaign_start_menu.startCampaign.002",label,label)))return}
 const name=$('#guardianName').value.trim()||SOSText("siege_campaign_start_menu.startCampaign.003"),diff=$('#difficulty').value;
 state=newState(name,diff,mode);
 equipReturnedBoundWeapon();
 meta.campaigns++;saveMeta();refreshShopStock();
 if(mode==='siege'){state.groups=createGroups(1);spawnFieldEncounters(1);log(SOSText("siege_campaign_start_menu.startCampaign.004",state.name),'info');log(SOSText("siege_campaign_start_menu.startCampaign.005"),'info')}
 else{state.groups=[];state.fieldEncounters=[];ensureWorldState();maintainWorldParties();refreshContracts();log(SOSText("siege_campaign_start_menu.startCampaign.006",state.name),'info');log(SOSText("siege_campaign_start_menu.startCampaign.007"),'info')}
 save();renderGame()
}
function showContinueFailure(mode,error=null){modalRouteEnter(SOSText("siege_campaign_start_menu.showContinueFailure.001"),Array.from(arguments));
 const savedError=error||null,stack=savedError?.stack?String(savedError.stack).split('\n').slice(0,4).join('\n'):'';
 state=null;combat=null;
 const label=mode==='openworld'?'Open World':SOSText("siege_campaign_start_menu.showContinueFailure.002"),detail=savedError?.message||lastLoadFailure||SOSText("siege_campaign_start_menu.showContinueFailure.003");
 overlay(SOSText("siege_campaign_start_menu.showContinueFailure.004",label,esc(detail),stack?`<pre class="continue-error-stack">${esc(stack)}</pre>`:''),false,true);
 $('#continueRetry').onclick=()=>{closeOverlay();continueSavedCampaign(mode)};
 $('#continueImport').onclick=()=>importSave();
 $('#continueBack').onclick=()=>{closeOverlay();renderMenu()}
}
function continueSavedCampaign(mode){
 const btn=$(mode==='openworld'?'#continueOpenBtn':'#continueSiegeBtn');
 if(btn){btn.disabled=true;btn.dataset.original=btn.innerHTML;btn.innerHTML=SOSText("siege_campaign_start_menu.continueSavedCampaign.001")}
 setTimeout(()=>{
   if(!load(mode)){if(btn){btn.disabled=false;btn.innerHTML=btn.dataset.original||btn.innerHTML}return showContinueFailure(mode)}
   try{
     closeOverlay();renderGame()
   }catch(e){
     console.error(SOSText("siege_campaign_start_menu.continueSavedCampaign.002"),e);
     // One conservative repair attempt before giving up the loaded state.
     try{
       if(state?.mode==='openworld'){ensureWorldState();safeLoadRepair(SOSText("siege_campaign_start_menu.continueSavedCampaign.003"),()=>repairOpenWorldState(),[]);if(!validWorldLocationId(state.world.location)){state.world.location='shantium';state.world.region='shantium'}}
       normalize();renderGame();save();return
     }catch(e2){console.error(SOSText("siege_campaign_start_menu.continueSavedCampaign.004"),e2);return showContinueFailure(mode,e2)}
   }
 },0)
}

function renderMenu(){
 migrateLegacySaveSlots();const openSave=savedCampaign('openworld'),siegeSave=savedCampaign('siege');
 document.getElementById('app').innerHTML=SOSText("siege_campaign_start_menu.renderMenu.001",openSave?'':'disabled',openSave?'Continue Open World':'No Open World Campaign',esc(openSave?savedCampaignSummary('openworld'):'Start one below'),siegeSave?'':'disabled',siegeSave?'Continue Siege Mode':'No Siege Campaign',esc(siegeSave?savedCampaignSummary('siege'):'Start one below'),Object.keys(DIFFICULTIES).map(k=>`<option>${k}</option>`).join(''),VERSION);
 if($('#continueOpenBtn'))$('#continueOpenBtn').onclick=()=>continueSavedCampaign('openworld');if($('#continueSiegeBtn'))$('#continueSiegeBtn').onclick=()=>continueSavedCampaign('siege');
 $('#openWorldBtn').onclick=()=>startCampaign('openworld');$('#siegeBtn').onclick=()=>startCampaign('siege');$('#statsBtn').onclick=showStats;$('#importBtn').onclick=importSave;$('#helpBtn').onclick=showHelp;$('#settingsBtn').onclick=()=>showSettings('menu');
}

