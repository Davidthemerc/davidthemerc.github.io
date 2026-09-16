'use strict';
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

function makeEnemy(base,mult,round){
 // v1.5.27: encounter level still matters, but scaling flattens after the early game.
 // This keeps mature Open World campaigns dangerous through composition, traits and tactics
 // instead of runaway HP/damage inflation.
 const r=Math.max(1,Number(round)||1),early=Math.min(r,10),late=Math.max(0,r-10),scale=early+late*.45;
 const hp=Math.round((base.hp+scale*2.05)*mult),damage=Math.round((base.damage+scale*.62)*mult);
 return {id:uid(),name:base.name,hp,maxHp:hp,damage,acc:clamp(base.acc+Math.floor(Math.max(0,r-12)/6),45,92),init:base.init,trait:base.trait,status:[]}
}

function groupName(faction,round){const a={Redstone:[SOSText("siege_campaign_start_menu.groupName.001"),SOSText("siege_campaign_start_menu.groupName.002"),SOSText("siege_campaign_start_menu.groupName.003")],Bluestone:[SOSText("siege_campaign_start_menu.groupName.004"),SOSText("siege_campaign_start_menu.groupName.005"),SOSText("siege_campaign_start_menu.groupName.006")],Spawn:[SOSText("siege_campaign_start_menu.groupName.007"),SOSText("siege_campaign_start_menu.groupName.008"),SOSText("siege_campaign_start_menu.groupName.009")],Raiders:[SOSText("siege_campaign_start_menu.groupName.010"),SOSText("siege_campaign_start_menu.groupName.011"),SOSText("siege_campaign_start_menu.groupName.012")],Brigands:[SOSText("siege_campaign_start_menu.groupName.013"),SOSText("siege_campaign_start_menu.groupName.014"),SOSText("siege_campaign_start_menu.groupName.015")],Beasts:[SOSText("siege_campaign_start_menu.groupName.016"),SOSText("siege_campaign_start_menu.groupName.017"),SOSText("siege_campaign_start_menu.groupName.018")],Cult:[SOSText("siege_campaign_start_menu.groupName.019"),SOSText("siege_campaign_start_menu.groupName.020"),SOSText("siege_campaign_start_menu.groupName.021")],Mercenaries:[SOSText("siege_campaign_start_menu.groupName.022"),SOSText("siege_campaign_start_menu.groupName.023"),SOSText("siege_campaign_start_menu.groupName.024")]};return pick(a[faction]||[SOSText("siege_campaign_start_menu.groupName.025")])+(round>8?' — Elite':'')}
