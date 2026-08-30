function newState(name,difficulty,mode='legacy_siege'){
 const d=DIFFICULTIES[difficulty]||DIFFICULTIES.Guardian;
 return {version:VERSION,mode,difficulty,name:name||SOSText("core_state_party_classes.newState.001"),round:1,maxRounds:12,world:mode==='openworld'?defaultWorldState():null,siegeII:mode==='siege2'?{schema:'siege2_v1',phase:'foundation',phaseLabel:'Command established',createdVersion:VERSION,briefingSeen:false,modernization:{combat:false,forces:false,battlefield:false,economy:false,recovery:false,politics:false,outcomes:false}}:null,gold:Math.round(180*d.economy),xp:0,progressionModel:'cumulative_rs_v1',level:1,skillPoints:0,attributePoints:2,reputation:0,scouting:0,
 guardian:{hp:92,stamina:70,className:null,classChoicePending:false,element:'none',stats:{str:8,dex:8,con:8,int:7,wis:7,cha:7},equipment:{weapon:'starter_sword',offhand:null,armor:null,helm:null,boots:null,amulet:null,ring:null},inventory:[{id:'heal',qty:2},{id:'bandage',qty:2}],skills:{vanguard:0,ranger:0,warden:0,rogue:0,berserker:0,wizard:0,sorcerer:0}},
 town:{walls:Math.round(100*d.town),maxWalls:Math.round(100*d.town),gate:Math.round(75*d.town),maxGate:Math.round(75*d.town),morale:78,food:68,medicine:30,timber:32,stone:18,militia:23,population:187,upgrades:[]},
 valuables:[],customItems:[],enchanter:null,relations:{Coalition:0,Bluestone:0,Redstone:-2,Spawn:0},allies:[],party:{active:[],members:{}},groups:[],fieldEncounters:[],history:[],eventState:{flags:{},scheduled:[],used:[]},prisoners:[],townCondition:{damaged:{},lastVisitRound:{},livingEvents:{}},shopStock:null,commissions:null,defenseAssignments:{},flags:{townDamage:0,retreats:0,compassion:0,diplomacy:0,occupation:0,enemyAnger:0,purchases:0,battlesThisCampaign:0,fullIntel:0,enemyIntel:0,finalCache:false,inventorySeparated:true,neutralLastRound:0,unarmedWins:0,civilianAid:0,legacyWeapon:null,townStanding:0,townVisits:0},roundActions:2,ended:false,ending:null,eventSeen:[],log:[]};
}

const EQUIP_SLOTS=['weapon','offhand','armor','helm','boots','amulet','ring'];
function emptyEquipment(){return Object.fromEntries(EQUIP_SLOTS.map(k=>[k,null]))}
function rawItem(id){return state?.customItems?.find(x=>x.id===id)||ITEMS.find(x=>x.id===id)||CONSUMABLES.find(x=>x.id===id)}
function item(id){const base=rawItem(id);if(!base||!state||state.flags?.legacyWeapon!==id)return base;const f=Math.min(1,.42+Math.max(0,(state.level||1)-1)*.075);return {...base,name:base.name+' [Bound]',damage:Math.round((base.damage||0)*f),accuracy:Math.round((base.accuracy||0)*f),defense:Math.round((base.defense||0)*f),initiative:Math.round((base.initiative||0)*f),special:(base.special?base.special+' • ':'')+SOSText("core_state_party_classes.item.001",Math.round(f*100))}}
function makeLegacyInstance(baseId){
 const base=rawItem(baseId);if(!base||base.slot!=='weapon')return null;
 state.customItems=Array.isArray(state.customItems)?state.customItems:[];
 const id=`legacy_${String(base.sourceId||base.id).replace(/[^a-z0-9_-]/gi,'_')}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
 const clone={...base,id,name:String(base.name||SOSText("core_state_party_classes.makeLegacyInstance.001")).replace(/ \[Bound\]$/,''),sourceId:base.sourceId||base.id,legacyInstance:true};
 delete clone.enchantmentPreview;state.customItems.push(clone);return clone
}
function replaceOneInventoryItemId(oldId,newId){
 const e=state.guardian.inventory.find(x=>x.id===oldId);if(!e)return false;
 e.qty=(e.qty||1)-1;if(e.qty<=0)state.guardian.inventory=state.guardian.inventory.filter(x=>x!==e);
 invAdd(newId,1);return true
}
function migrateLegacyWeaponInstance(){
 if(!state||!meta.boundWeapon)return false;
 const oldId=meta.boundWeapon;
 // Custom IDs already identify a physical item. The old bug affects shared base definitions.
 if(!ITEMS.some(i=>i.id===oldId))return false;
 const legacy=makeLegacyInstance(oldId);if(!legacy)return false;
 let moved=false;
 if(state.guardian?.equipment?.weapon===oldId){state.guardian.equipment.weapon=legacy.id;moved=true}
 if(!moved&&state.party?.members){
   const holder=Object.values(state.party.members).find(m=>m?.equipment?.weapon===oldId);
   if(holder){holder.equipment.weapon=legacy.id;moved=true}
 }
 if(!moved)moved=replaceOneInventoryItemId(oldId,legacy.id);
 if(!moved&&state.world?.homeBase?.storage){
   const stack=state.world.homeBase.storage.find(x=>x?.id===oldId);
   if(stack){stack.qty=(stack.qty||1)-1;if(stack.qty<=0)state.world.homeBase.storage=state.world.homeBase.storage.filter(x=>x!==stack);state.world.homeBase.storage.push({id:legacy.id,qty:1});moved=true}
 }
 // Even if an older save temporarily lost the physical copy, preserve a unique career identity
 // so a future campaign cannot mark every base copy as bound again.
 meta.boundWeapon=legacy.id;meta.boundItem={...legacy};state.flags.legacyWeapon=legacy.id;
 if(meta.boundHistory){meta.boundHistory.id=legacy.id;meta.boundHistory.name=legacy.name}
 saveMeta();
 if(moved&&state.log)log(SOSText("core_state_party_classes.migrateLegacyWeaponInstance.001",legacy.name),'info');
 return true
}
function allyDef(id){return ALLIES.find(a=>a.id===id)}

function partyLimit(){return state&&state.round>=PARTY_UNLOCK_ROUND?3:PARTY_BASE_LIMIT}
function classDef(name){return CLASSES[name]||null}
function guardianClass(){return state?.guardian?.className||null}
function classRank(level=state?.level||1){return Math.max(0,(level||1)-1)}
function syncClassProgression(){if(!state)return;state.valuables=Array.isArray(state.valuables)?state.valuables:[];state.skillPoints=0;const cls=guardianClass();if(state.guardian?.skills){for(const k of Object.keys(state.guardian.skills))state.guardian.skills[k]=0;if(cls)state.guardian.skills[cls.toLowerCase()]=classRank(state.level)}partyMembers(false).forEach(m=>{if(m.className)m.classRank=classRank(m.level||state.level)})}
function classProgressText(cls=guardianClass(),level=state.level){if(!cls)return SOSText("core_state_party_classes.classProgressText.001");const rank=classRank(level),sig=level>=7?'Signature II':level>=5?'Equipment Mastery':level>=4?'Signature I':SOSText("core_state_party_classes.classProgressText.002");return SOSText("core_state_party_classes.classProgressText.003",cls,rank,sig)}

function ownerClassName(id='guardian'){if(id==='guardian')return guardianClass();return allyDef(id)?.className||state?.party?.members?.[id]?.className||null}
function isRangedGear(it){return !!it&&/(Bow|Crossbow)/i.test(it.name)}
function weaponFamily(it){if(!it)return SOSText("core_state_party_classes.weaponFamily.001");const n=it.name||'';if(it.unarmed)return SOSText("core_state_party_classes.weaponFamily.002");if(/Knuckle|Gauntlet/i.test(n))return SOSText("core_state_party_classes.weaponFamily.003");if(/Axe/i.test(n))return SOSText("core_state_party_classes.weaponFamily.004");if(/Crossbow/i.test(n))return SOSText("core_state_party_classes.weaponFamily.005");if(/Pistol|Handgonne|Arquebus|Firearm/i.test(n))return SOSText("core_state_party_classes.weaponFamily.006");if(/Longbow|Bow/i.test(n))return SOSText("core_state_party_classes.weaponFamily.007");if(/Spear/i.test(n))return SOSText("core_state_party_classes.weaponFamily.008");if(/Staff/i.test(n))return SOSText("core_state_party_classes.weaponFamily.009");if(/Wand/i.test(n))return SOSText("core_state_party_classes.weaponFamily.010");if(/Knife|Dagger/i.test(n))return SOSText("core_state_party_classes.weaponFamily.011");if(/Sword|Blade/i.test(n))return SOSText("core_state_party_classes.weaponFamily.012");if(/Hammer|Mace/i.test(n))return SOSText("core_state_party_classes.weaponFamily.013");return SOSText("core_state_party_classes.weaponFamily.014")}
function armorWeight(it){if(!it||it.slot!=='armor')return null;const n=it.name||'';if(/Plate|Heavy Mail|Siege Armor/i.test(n))return SOSText("core_state_party_classes.armorWeight.001");if(/Chain|Mail|Scale|Brigandine|Breastplate/i.test(n))return SOSText("core_state_party_classes.armorWeight.002");return SOSText("core_state_party_classes.armorWeight.003")}
function armorSuitability(cls,it){const w=armorWeight(it);if(!w)return 0;const fav={Vanguard:[SOSText("core_state_party_classes.armorSuitability.001"),SOSText("core_state_party_classes.armorSuitability.002")],Warden:[SOSText("core_state_party_classes.armorSuitability.003"),SOSText("core_state_party_classes.armorSuitability.004")],Ranger:[SOSText("core_state_party_classes.armorSuitability.005"),SOSText("core_state_party_classes.armorSuitability.006")],Rogue:[SOSText("core_state_party_classes.armorSuitability.007")],Berserker:[SOSText("core_state_party_classes.armorSuitability.008")],Wizard:[SOSText("core_state_party_classes.armorSuitability.009")],Sorcerer:[SOSText("core_state_party_classes.armorSuitability.010")]}[cls]||[];if(fav.includes(w))return 4;if(cls===SOSText("core_state_party_classes.armorSuitability.011")&&w===SOSText("core_state_party_classes.armorSuitability.012"))return 1;if(cls===SOSText("core_state_party_classes.armorSuitability.013")&&w===SOSText("core_state_party_classes.armorSuitability.014"))return 1;if(cls===SOSText("core_state_party_classes.armorSuitability.015")&&w===SOSText("core_state_party_classes.armorSuitability.016"))return-5;if([SOSText("core_state_party_classes.armorSuitability.017"),SOSText("core_state_party_classes.armorSuitability.018"),SOSText("core_state_party_classes.armorSuitability.019")].includes(cls)&&w!==SOSText("core_state_party_classes.armorSuitability.020"))return-7;return 0}
function weaponSuitability(cls,it){const f=weaponFamily(it),fav={Vanguard:[SOSText("core_state_party_classes.weaponSuitability.001"),SOSText("core_state_party_classes.weaponSuitability.002"),SOSText("core_state_party_classes.weaponSuitability.003"),SOSText("core_state_party_classes.weaponSuitability.004")],Warden:[SOSText("core_state_party_classes.weaponSuitability.005"),SOSText("core_state_party_classes.weaponSuitability.006"),SOSText("core_state_party_classes.weaponSuitability.007")],Ranger:[SOSText("core_state_party_classes.weaponSuitability.008")],Rogue:[SOSText("core_state_party_classes.weaponSuitability.009"),SOSText("core_state_party_classes.weaponSuitability.010"),SOSText("core_state_party_classes.weaponSuitability.011")],Berserker:[SOSText("core_state_party_classes.weaponSuitability.012"),SOSText("core_state_party_classes.weaponSuitability.013"),SOSText("core_state_party_classes.weaponSuitability.014")],Wizard:[SOSText("core_state_party_classes.weaponSuitability.015"),SOSText("core_state_party_classes.weaponSuitability.016")],Sorcerer:[SOSText("core_state_party_classes.weaponSuitability.017"),SOSText("core_state_party_classes.weaponSuitability.018"),SOSText("core_state_party_classes.weaponSuitability.019")]}[cls]||[];if(fav.includes(f))return 5;if(cls===SOSText("core_state_party_classes.weaponSuitability.020")&&f===SOSText("core_state_party_classes.weaponSuitability.021"))return 1;if(cls===SOSText("core_state_party_classes.weaponSuitability.022")&&f===SOSText("core_state_party_classes.weaponSuitability.023"))return-6;if(cls===SOSText("core_state_party_classes.weaponSuitability.024")&&[SOSText("core_state_party_classes.weaponSuitability.025"),SOSText("core_state_party_classes.weaponSuitability.026")].includes(f))return 1;return 0}

function roleSuitability(className,it){
 if(!it||!it.slot||!className)return {score:0,ok:true,label:SOSText("core_state_party_classes.roleSuitability.001"),reasons:[]};
 let score=gearAffinity(className,it),reasons=[];
 const fam=weaponFamily(it),weight=armorWeight(it);
 const caster=[SOSText("core_state_party_classes.roleSuitability.002"),SOSText("core_state_party_classes.roleSuitability.003")].includes(className);
 const martial=[SOSText("core_state_party_classes.roleSuitability.004"),SOSText("core_state_party_classes.roleSuitability.005"),SOSText("core_state_party_classes.roleSuitability.006"),SOSText("core_state_party_classes.roleSuitability.007"),SOSText("core_state_party_classes.roleSuitability.008")].includes(className);
 if(it.slot==='armor'){
   if(it.magic&&!caster){score-=8;reasons.push(SOSText("core_state_party_classes.roleSuitability.009"))}
   if(caster&&!it.magic&&weight!==SOSText("core_state_party_classes.roleSuitability.010")){score-=6;reasons.push(SOSText("core_state_party_classes.roleSuitability.011"))}
   if(className===SOSText("core_state_party_classes.roleSuitability.012")&&it.magic){score-=8;reasons.push(SOSText("core_state_party_classes.roleSuitability.013"))}
   if(className===SOSText("core_state_party_classes.roleSuitability.014")&&weight!==SOSText("core_state_party_classes.roleSuitability.015")){score-=8;reasons.push(SOSText("core_state_party_classes.roleSuitability.016"))}
   if(className===SOSText("core_state_party_classes.roleSuitability.017")&&weight===SOSText("core_state_party_classes.roleSuitability.018")){score-=8;reasons.push(SOSText("core_state_party_classes.roleSuitability.019"))}
 }
 if(it.slot==='weapon'){
   if(className===SOSText("core_state_party_classes.roleSuitability.020")&&![SOSText("core_state_party_classes.roleSuitability.021"),SOSText("core_state_party_classes.roleSuitability.022")].includes(fam))score-=5;
   if(className===SOSText("core_state_party_classes.roleSuitability.023")&&fam===SOSText("core_state_party_classes.roleSuitability.024")){score-=8;reasons.push(SOSText("core_state_party_classes.roleSuitability.025"))}
   if(caster&&![SOSText("core_state_party_classes.roleSuitability.026"),SOSText("core_state_party_classes.roleSuitability.027"),SOSText("core_state_party_classes.roleSuitability.028")].includes(fam)){score-=7;reasons.push(SOSText("core_state_party_classes.roleSuitability.029"))}
   if(martial&&it.magic&&[SOSText("core_state_party_classes.roleSuitability.030"),SOSText("core_state_party_classes.roleSuitability.031")].includes(fam)){score-=8;reasons.push(SOSText("core_state_party_classes.roleSuitability.032"))}
 }
 if(it.slot==='offhand'&&[SOSText("core_state_party_classes.roleSuitability.033"),SOSText("core_state_party_classes.roleSuitability.034"),SOSText("core_state_party_classes.roleSuitability.035"),SOSText("core_state_party_classes.roleSuitability.036")].includes(className)){score-=3;reasons.push(SOSText("core_state_party_classes.roleSuitability.037"))}
 const ok=score>=0;
 const label=score>=5?'Excellent role fit':score>=2?'Good role fit':score>=0?'Acceptable role fit':score>=-4?'Poor role fit':SOSText("core_state_party_classes.roleSuitability.038");
 return {score,ok,label,reasons}
}
function balancedEmptySlotCandidate(ownerId,it){
 const o=ownerFor(ownerId),cls=ownerClassName(ownerId);
 if(!o||!it?.slot||o.equipment[it.slot])return false;
 const fit=roleSuitability(cls,it);
 if(!fit.ok)return false;
 if(['armor','weapon','offhand'].includes(it.slot)&&fit.score<1)return false;
 if(it.magic&&![SOSText("core_state_party_classes.balancedEmptySlotCandidate.001"),SOSText("core_state_party_classes.balancedEmptySlotCandidate.002")].includes(cls)&&['armor','weapon'].includes(it.slot))return false;
 return true
}
function gearAffinity(className,it){if(!className||!it||!it.slot)return 0;if(it.slot==='armor')return armorSuitability(className,it);if(it.slot==='weapon')return weaponSuitability(className,it);if(it.slot==='offhand')return [SOSText("core_state_party_classes.gearAffinity.001"),SOSText("core_state_party_classes.gearAffinity.002")].includes(className)?3:[SOSText("core_state_party_classes.gearAffinity.003"),SOSText("core_state_party_classes.gearAffinity.004"),SOSText("core_state_party_classes.gearAffinity.005"),SOSText("core_state_party_classes.gearAffinity.006")].includes(className)?-2:0;if(it.slot==='amulet'||it.slot==='ring')return [SOSText("core_state_party_classes.gearAffinity.007"),SOSText("core_state_party_classes.gearAffinity.008")].includes(className)?4:1;if(it.slot==='boots'||it.slot==='helm')return 1;return 0}
function classGearBonuses(className,equipment){const its=Object.values(equipment||{}).map(item).filter(Boolean),fav=its.reduce((n,it)=>n+gearAffinity(className,it),0),weaponIt=item(equipment?.weapon),weaponFav=gearAffinity(className,weaponIt),defFav=its.filter(it=>['armor','offhand','helm','boots'].includes(it.slot)).reduce((n,it)=>n+gearAffinity(className,it),0),b={damage:0,accuracy:0,defense:0,initiative:0,interpose:0,healing:0,partyAccuracy:0,retreat:0,affinity:fav},rank=boundedClassRank(classRank());if(className===SOSText("core_state_party_classes.classGearBonuses.001")){b.damage=weaponFav*2;b.defense=Math.max(0,Math.floor(defFav/2));b.interpose=.03*Math.max(0,defFav)}if(className===SOSText("core_state_party_classes.classGearBonuses.002")){b.accuracy=fav*2;b.initiative=Math.ceil(fav*.8);b.damage=weaponFamily(weaponIt)===SOSText("core_state_party_classes.classGearBonuses.003")?weaponFav*2:0;b.retreat=.015*Math.max(0,fav)}if(className===SOSText("core_state_party_classes.classGearBonuses.004")){b.defense=Math.max(0,defFav);b.interpose=.045*Math.max(0,defFav);b.accuracy=weaponFav}if(className===SOSText("core_state_party_classes.classGearBonuses.005")){b.accuracy=Math.max(0,fav)*2;b.initiative=Math.max(0,fav);b.damage=[SOSText("core_state_party_classes.classGearBonuses.006"),SOSText("core_state_party_classes.classGearBonuses.007"),SOSText("core_state_party_classes.classGearBonuses.008")].includes(weaponFamily(weaponIt))?weaponFav*2:0}if(className===SOSText("core_state_party_classes.classGearBonuses.009")){b.damage=Math.max(0,weaponFav)*2+(armorWeight(item(equipment?.armor))===SOSText("core_state_party_classes.classGearBonuses.010")?3:0);b.initiative=armorWeight(item(equipment?.armor))===SOSText("core_state_party_classes.classGearBonuses.011")?3:0}if(className===SOSText("core_state_party_classes.classGearBonuses.012")){b.healing=Math.max(0,fav);b.accuracy=Math.floor(Math.max(0,fav)/2)}if(className===SOSText("core_state_party_classes.classGearBonuses.013")){b.damage=Math.floor(Math.max(0,fav)/2);b.accuracy=Math.floor(Math.max(0,fav)/2)}if(className){b.damage+=Math.floor(rank*.18);b.accuracy+=Math.floor(rank*.22);b.defense+=Math.floor(rank*.14);b.initiative+=Math.floor(rank*.12)}return b}
function guardianClassBonus(){return classGearBonuses(guardianClass(),state?.guardian?.equipment||{})}
function allyClassBonus(m){return classGearBonuses(allyDef(m.id)?.className||m.className,m.equipment||{})}
function affinityBadge(className,it){const a=gearAffinity(className,it);return a>=3?'<span class="badge favored">Favored</span>':a===2?'<span class="badge">Suited</span>':''}
function defenderId(t){return t.kind==='guardian'?'guardian':t.member.id}
function defenderAlive(id){if(id==='guardian')return state.guardian.hp>0;return !!state.party?.members?.[id]&&state.party.members[id].hp>0}
function makePartyMember(id,origin='recruited',fee=0){const a=allyDef(id);if(!a)return null;const load={...emptyEquipment(),...(STARTER_LOADOUTS[id]||a.starterGear||{})};const purse=rnd(18,65)+Math.round((a.minRound||1)*4)+Math.max(0,fee||0);const m={id,name:a.name,title:a.title,role:a.role,className:a.className||null,level:state?.level||1,stats:{...a.stats},equipment:load,hp:1,stamina:1,skipNext:false,trust:a.fieldOnly?50:45,recruitedRound:state?.round||1,lastTalkRound:0,preparedRound:0,battles:0,rescues:0,storyStage:0,personalGold:purse,reserveGold:Math.max(15,Math.round(purse*.42)),recruitmentOrigin:origin};m.hp=allyMaxHP(m);m.stamina=allyMaxStamina(m);return m}
function ensurePartyState(){if(!state)return;if(!Array.isArray(state.allies))state.allies=[];if(!state.party||typeof state.party!=='object')state.party={active:[],members:{}};if(!Array.isArray(state.party.active))state.party.active=[];if(!state.party.members||typeof state.party.members!=='object')state.party.members={};if(!state.party.relationships||typeof state.party.relationships!=='object')state.party.relationships={};state.allies=state.allies.filter(id=>!!allyDef(id));state.allies.forEach(id=>{if(!state.party.members[id])state.party.members[id]=makePartyMember(id)});Object.keys(state.party.members).forEach(id=>{if(!state.allies.includes(id))delete state.party.members[id]});const limit=partyLimit();state.party.active=state.party.active.filter(id=>state.allies.includes(id)).slice(0,limit);if(!state.party.active.length&&state.allies.length)state.party.active=state.allies.slice(0,limit);for(const m of Object.values(state.party.members)){m.className=m.className||allyDef(m.id)?.className||null;if(m.className===SOSText("core_state_party_classes.ensurePartyState.001"))m.className=SOSText("core_state_party_classes.ensurePartyState.002");m.level=Math.max(m.level||1,state.level||1);m.stats={...(allyDef(m.id)?.stats||{}),...(m.stats||{})};m.equipment={...emptyEquipment(),...(m.equipment||{})};m.hp=clamp(Number.isFinite(m.hp)?m.hp:allyMaxHP(m),0,allyMaxHP(m));m.stamina=clamp(Number.isFinite(m.stamina)?m.stamina:allyMaxStamina(m),0,allyMaxStamina(m));m.skipNext=!!m.skipNext;m.trust=clamp(Number.isFinite(m.trust)?m.trust:(allyDef(m.id)?.fieldOnly?50:45),0,100);m.recruitedRound=m.recruitedRound||Math.max(1,state.round-1);m.lastTalkRound=m.lastTalkRound||0;m.preparedRound=m.preparedRound||0;m.battles=m.battles||0;m.rescues=m.rescues||0;m.storyStage=m.storyStage||0;ensureCombatInjuries(m);
m.conversationMemory=m.conversationMemory&&typeof m.conversationMemory==='object'?m.conversationMemory:{topics:{},history:[],lastDay:0,newTopics:0};
if(!m.conversationMemory.topics)m.conversationMemory.topics={};if(!Array.isArray(m.conversationMemory.history))m.conversationMemory.history=[];m.personalGold=Number.isFinite(m.personalGold)?m.personalGold:rnd(18,55);m.reserveGold=Number.isFinite(m.reserveGold)?m.reserveGold:Math.max(15,Math.round(m.personalGold*.42));m.recruitmentOrigin=m.recruitmentOrigin||'legacy'}if(!state.guardian.className)state.guardian.className=null;if(state.level>=2&&!state.guardian.className)state.guardian.classChoicePending=true;if(!state.flags)state.flags={};if(!state.flags.inventorySeparated){const equipped=[...Object.values(state.guardian.equipment||{}),...Object.values(state.party.members).flatMap(m=>Object.values(m.equipment||{}))].filter(Boolean);equipped.forEach(id=>invRemove(id));state.flags.inventorySeparated=true}}
function partyMembers(activeOnly=false){ensurePartyState();const override=activeOnly&&combat?.group&&Array.isArray(combat.group.combatPartyIds)?combat.group.combatPartyIds:null,ids=override!==null?override:(activeOnly?state.party.active:state.allies);return ids.map(id=>state.party.members[id]).filter(Boolean)}
function allEquipmentIds(){ensurePartyState();return [...Object.values(state.guardian.equipment),...partyMembers(false).flatMap(m=>Object.values(m.equipment))].filter(Boolean)}
function ownerFor(id='guardian'){if(id==='guardian')return state.guardian;ensurePartyState();return state.party.members[id]||state.guardian}
function ownerName(id='guardian'){if(id==='guardian')return state.name;const m=ownerFor(id);return `${m.name} — ${m.title}`}

function companionInteractionPeriod(){return isOpenWorld()?state.world.day:state.round}
function companionInteractionLabel(){return isOpenWorld()?'Day':SOSText("core_state_party_classes.companionInteractionLabel.001")}
function companionTrust(m){return clamp(m?.trust??45,0,100)}
function trustTier(v){v=Number(v)||0;return v>=90?'Unshakable':v>=75?'Loyal':v>=60?'Trusted':v>=45?'Steady':SOSText("core_state_party_classes.trustTier.001")}
function companionData(id){return COMPANION_DATA[id]||{trait:SOSText("core_state_party_classes.companionData.001"),perk:SOSText("core_state_party_classes.companionData.002"),lines:[SOSText("core_state_party_classes.companionData.003")]}}
function companionBonuses(m){const trust=companionTrust(m),d=companionData(m.id),b={damage:0,accuracy:0,defense:0,initiative:0,healing:0,interpose:0,partyAccuracy:0};if(trust>=60){b.accuracy+=1;b.defense+=1}if(trust>=75){b.accuracy+=1;b.initiative+=1}if(trust>=90){b.damage+=1;b.defense+=1;b.interpose+=.02}if((m.preparedPeriod??m.preparedRound)===companionInteractionPeriod()){b.accuracy+=2;b.initiative+=2}const strong=trust>=75?1:0,deep=trust>=90?1:0;if(m.id==='spear'){b.defense+=2+strong+deep;b.interpose+=.03+.02*strong}if(m.id==='archer'){b.accuracy+=3+2*strong;b.initiative+=1+strong}if(m.id==='scout'){b.accuracy+=2+strong;b.initiative+=3+deep}if(m.id==='healer'){b.healing+=3+2*strong+deep}if(m.id==='defector'){b.damage+=1+strong;b.defense+=2+deep}if(m.id==='spawn'){b.defense+=3+strong+deep;b.interpose+=.04+.02*strong}if(m.id==='field_sellsword'){b.damage+=2+strong;b.defense+=1+deep}if(m.id==='field_hunter'){b.accuracy+=3+strong;b.initiative+=2+deep}if(m.id==='field_mender'){b.healing+=3+strong;b.defense+=deep}if(m.id==='field_guard'){b.accuracy+=1+strong;b.defense+=2+deep;b.partyAccuracy+=strong?1:0}if(m.id==='red_adjutant'){b.defense+=2+strong;b.partyAccuracy+=strong?1:0;b.interpose+=.02*deep}if(m.id==='red_lockrunner'){b.accuracy+=2+strong;b.initiative+=2+deep}if(m.id==='red_grainwarden'){b.defense+=2+strong+deep;b.interpose+=.03+.01*strong}if(m.id==='red_firebreak'){b.accuracy+=2+strong;b.initiative+=2+deep;b.retreat=(b.retreat||0)+.02*strong}if(m.storyStage>0||m.openWorldStoryComplete){b.damage+=1;b.accuracy+=1;b.defense+=1}if(m.openWorldStoryComplete)b.initiative+=1;return b}
function companionPerkText(m){const d=companionData(m.id),tier=trustTier(companionTrust(m));return `${d.trait} • ${tier}: ${d.perk}`}
function adjustTrust(id,amount,reason=''){const m=state.party?.members?.[id];if(!m)return;const before=m.trust||45;m.trust=clamp(before+amount,0,100);const oldTier=trustTier(before),newTier=trustTier(m.trust);if(newTier!==oldTier&&amount>0){log(SOSText("core_state_party_classes.adjustTrust.001",m.name,newTier.toLowerCase()),'good');chronicle(`${m.name}: ${newTier}`,SOSText("core_state_party_classes.adjustTrust.002",m.name,isOpenWorld()?'during their travels':'during the siege'),'companion')}}
function companionContextLine(m){const d=companionData(m.id),base=pick(d.lines);if(m.hp<=0)return SOSText("core_state_party_classes.companionContextLine.001",m.name);if(m.hp<allyMaxHP(m)*.45)return SOSText("core_state_party_classes.companionContextLine.002",m.name);if(!state.party.active.includes(m.id))return isOpenWorld()?SOSText("core_state_party_classes.companionContextLine.003",base,m.name):SOSText("core_state_party_classes.companionContextLine.004",base,m.name);if(state.groups.some(g=>g.distance<=1))return SOSText("core_state_party_classes.companionContextLine.005",base);return base}
function companionStoryReady(){ensurePartyState();if(isOpenWorld())return null;return partyMembers(false).filter(m=>m.storyStage===0&&companionTrust(m)>=60&&state.round>=(m.recruitedRound||1)+2&&COMPANION_STORIES[m.id]).sort((a,b)=>companionTrust(b)-companionTrust(a))[0]||null}
function applyCompanionStoryChoice(m,key){if(m.id==='spear'){if(key==='militia')state.town.militia+=3;else m.stats.con++;}if(m.id==='archer'){if(key==='belong')state.town.morale=Math.min(100,state.town.morale+2);else gainGold(20)}if(m.id==='scout'){if(key==='coalition')state.relations.Coalition++;else gainScouting(1);}if(m.id==='healer'){if(key==='mercy'){state.town.medicine=Math.max(0,state.town.medicine-3);state.town.morale=Math.min(100,state.town.morale+3)}else state.town.medicine+=2}if(m.id==='defector'){if(key==='open')state.relations.Bluestone++;else state.town.morale=Math.min(100,state.town.morale+1)}if(m.id==='spawn'){if(key==='gate')state.town.gate=Math.min(state.town.maxGate,state.town.gate+5),state.town.morale=Math.min(100,state.town.morale+2);else m.stats.con++;}if(m.id==='field_sellsword'){if(key==='stay')state.reputation++;else gainGold(25)}if(m.id==='field_hunter'){if(key==='scouts')gainScouting(1);else m.stats.dex++;}if(m.id==='field_mender'){if(key==='town')state.town.medicine+=5;else m.stats.wis++;}if(m.id==='field_guard'){if(key==='strict'){state.town.militia+=2;state.town.morale=Math.max(0,state.town.morale-1)}else state.town.morale=Math.min(100,state.town.morale+1)}}
function companionStoryChoiceAvailable(m,c){if(m.id==='healer'&&c[2]==='mercy')return state.town.medicine>=3;return true}
function renderCompanionStory(m,after){const s=COMPANION_STORIES[m.id];overlay(SOSText("core_state_party_classes.renderCompanionStory.001",esc(s.title),esc(s.text),esc(m.name),trustTier(m.trust),m.trust,esc(companionData(m.id).trait),s.choices.map((c,i)=>`<button data-storychoice="${i}" ${companionStoryChoiceAvailable(m,c)?'':'disabled'}><b>${esc(c[0])}</b><br><small>${esc(c[1])}</small></button>`).join('')));document.querySelectorAll('[data-storychoice]').forEach(b=>b.onclick=()=>{const c=s.choices[+b.dataset.storychoice];if(!companionStoryChoiceAvailable(m,c))return;applyCompanionStoryChoice(m,c[2]);const tm=/Trust \+(\d+)/i.exec(c[1]||'');adjustTrust(m.id,tm?+tm[1]:4);m.storyStage=1;chronicle(s.title,`${m.name}: ${c[0]}.`,'companion');log(`${m.name}: ${c[0]}.`,'info');normalize();save();closeOverlay();if(after)after();else renderGame()})}

function equippedItems(s=state){return Object.values(s.guardian.equipment).map(item).filter(Boolean)}
function stat(s,key){let v=s.guardian.stats[key]||0; if(s.guardian.equipment.ring==='named_signet'&&(key==='int'||key==='cha'))v+=2; return v}
// v1.5.34 — persistent short-term combat injuries. Injuries expire by world day and
// reduce derived combat performance rather than deleting earned attributes or equipment.
const COMBAT_INJURY_DEFS={
 bruised:{name:'Bruised',accuracy:1,defense:1,initiative:1,recovery:0},
 wounded:{name:'Wounded',accuracy:3,defense:2,initiative:3,recovery:1},
 serious:{name:'Serious Wound',accuracy:5,defense:3,initiative:5,recovery:2}
};
function combatDay(){return isOpenWorld()?(state.world?.day||1):(state.round||1)}
function ensureCombatInjuries(owner){if(!owner)return[];if(!Array.isArray(owner.injuries))owner.injuries=[];owner.injuries=owner.injuries.filter(x=>x&&COMBAT_INJURY_DEFS[x.type]&&(x.untilDay||0)>=combatDay());return owner.injuries}
function activeCombatInjuries(owner){return ensureCombatInjuries(owner).slice()}
function combatInjuryPenalty(owner,key){return activeCombatInjuries(owner).reduce((n,x)=>n+(COMBAT_INJURY_DEFS[x.type]?.[key]||0),0)}
function combatInjurySummary(owner){const rows=activeCombatInjuries(owner);return rows.map(x=>`${COMBAT_INJURY_DEFS[x.type].name} (${Math.max(1,(x.untilDay||combatDay())-combatDay()+1)}d)`).join(', ')}
function combatInjuryPanelHTML(owner){const t=combatInjurySummary(owner);return t?`<div class="warning notice compact"><b>Injury:</b> ${esc(t)}</div>`:''}
function clearCombatInjuries(owner){if(owner)owner.injuries=[]}
function treatCombatInjuries(owner,days=2){for(const x of ensureCombatInjuries(owner))x.untilDay=Math.max(combatDay()-1,(x.untilDay||combatDay())-Math.max(1,days));ensureCombatInjuries(owner)}
function addCombatInjury(owner,type,days,source='battle'){if(!owner||!COMBAT_INJURY_DEFS[type])return null;const now=combatDay(),row={id:uid(),type,day:now,untilDay:now+Math.max(1,days)-1,source};ensureCombatInjuries(owner);owner.injuries.push(row);return row}
// v1.5.27 bounded progression: attributes remain valuable without letting long-running saves
// turn HP, accuracy, defense, or damage into effectively unbounded numbers.
function boundedStatValue(v,soft=12){v=Math.max(0,Number(v)||0);return v<=soft?v:soft+(v-soft)*.45}
function boundedClassRank(v,soft=10){v=Math.max(0,Number(v)||0);return v<=soft?v:soft+(v-soft)*.22}
function boundedLevelGrowth(level,early=6,mid=3,late=1){const n=Math.max(0,(Number(level)||1)-1),a=Math.min(n,9),b=Math.min(Math.max(0,n-9),10),c=Math.max(0,n-19);return a*early+b*mid+c*late}
function maxHP(s=state){return Math.round(72+boundedStatValue(stat(s,'con'))*3+boundedLevelGrowth(s.level,6,3,1))}
function maxStamina(s=state){return Math.round(52+boundedStatValue(stat(s,'con'))*2+boundedStatValue(stat(s,'wis')))}
function allyStat(m,key){let v=m.stats?.[key]||0;if(m.equipment?.ring==='named_signet'&&(key==='int'||key==='cha'))v+=2;return v}
function allyMaxHP(m){return Math.round(48+boundedStatValue(allyStat(m,'con'))*3+boundedLevelGrowth(m.level||1,5,2.5,.8))}
function allyMaxStamina(m){return Math.round(42+boundedStatValue(allyStat(m,'con'))*2+boundedStatValue(allyStat(m,'wis')))}
function allyEquippedItems(m){return Object.values(m.equipment||{}).map(item).filter(Boolean)}
function boundedGearStat(raw,kind='accuracy'){
 raw=Number(raw)||0;if(raw<=0)return raw;
 const cfg={accuracy:[7,.48,15],defense:[12,.55,24],initiative:[8,.5,17],damage:[18,.62,32]}[kind]||[8,.5,18],base=cfg[0],rate=cfg[1],cap=cfg[2];
 return Math.min(cap,raw<=base?raw:base+(raw-base)*rate)
}
function equipmentStatTotal(items,kind){return boundedGearStat((items||[]).reduce((n,i)=>n+(Number(i?.[kind])||0),0),kind)}

function allyWeapon(m){const a=allyDef(m.id);return item(m.equipment?.weapon)||a?.baseWeapon||{name:SOSText("core_state_party_classes.allyWeapon.001"),damage:2,accuracy:2,initiative:2,unarmed:true}}
function partyTrustSynergy(){const active=partyMembers(true).filter(m=>m.hp>0),trusted=active.filter(m=>companionTrust(m)>=75).length;return {accuracy:trusted>=2?2:0,defense:trusted>=2?2:0,retreat:trusted>=2?.03:0}}

function allyDefense(m){return Math.max(0,equipmentStatTotal(allyEquippedItems(m),'defense')+(m.role==='spawn'?4:0)+allyClassBonus(m).defense+companionBonuses(m).defense+partyTrustSynergy().defense+companionArtifactBonus(m,'defense')-combatInjuryPenalty(m,'defense'))}
function allyAccuracy(m){const cmd=guardianClass()===SOSText("core_state_party_classes.allyAccuracy.001")?guardianClassBonus().partyAccuracy:0,tac=combat?.tactical?.acc||0,terr=combat?.tactical?.terrain?.acc||0;return 54+boundedStatValue(allyStat(m,'dex'))*1.1+equipmentStatTotal(allyEquippedItems(m),'accuracy')+allyClassBonus(m).accuracy+companionBonuses(m).accuracy+cmd+partyTrustSynergy().accuracy+tac+terr-combatInjuryPenalty(m,'accuracy')}
function allyInitiative(m){return Math.round(boundedStatValue(allyStat(m,'dex'))*.82+equipmentStatTotal(allyEquippedItems(m),'initiative')+allyClassBonus(m).initiative+companionBonuses(m).initiative-combatInjuryPenalty(m,'initiative'))}
function defense(s=state){return Math.max(0,equipmentStatTotal(equippedItems(s),'defense')+Math.round(boundedClassRank(s.guardian.skills.warden)*.45)+guardianClassBonus().defense+(combat?.tactical?.def||0)+(combat?.tactical?.terrain?.def||0)+guardianArtifactBonus('defense')-combatInjuryPenalty(s.guardian,'defense'))}
function damageBonus(s=state){return Math.floor(boundedStatValue(stat(s,'str'))*.62)+Math.round(boundedClassRank(s.guardian.skills.vanguard)*.35)+guardianClassBonus().damage}
function accuracy(s=state){return 56+boundedStatValue(stat(s,'dex'))*1.1+equipmentStatTotal(equippedItems(s),'accuracy')+Math.round(boundedClassRank(s.guardian.skills.ranger)*.45)+guardianClassBonus().accuracy+(combat?.tactical?.acc||0)+(combat?.tactical?.terrain?.acc||0)+guardianArtifactBonus('accuracy')-combatInjuryPenalty(s.guardian,'accuracy')}
function weapon(s=state){return item(s.guardian.equipment.weapon)||{id:'unarmed',name:SOSText("core_state_party_classes.weapon.001"),damage:2,accuracy:3,initiative:3,unarmed:true}}
function initiative(s=state){return Math.round(boundedStatValue(stat(s,'dex'))*.82+equipmentStatTotal(equippedItems(s),'initiative')+guardianClassBonus().initiative+guardianArtifactBonus('initiative')-combatInjuryPenalty(s.guardian,'initiative'))}
function pay(s,n){if(s.gold<n){log(SOSText("core_state_party_classes.pay.001"),'bad');return false}s.gold-=n;return true}
function gainGold(n){state.gold+=n;meta.goldEarned+=n;saveMeta()}
function log(msg,type=''){state&&state.log.push({msg,type,t:Date.now()}); if(state&&state.log.length>100)state.log.shift()}
function chronicle(title,text,type='event'){if(!state)return;state.history.push({round:state.round,title,text,type,t:Date.now()});if(state.history.length>180)state.history.shift()}

function townStandingScore(){const t=state.town,f=state.flags;return Math.round((state.reputation||0)*2+(f.compassion||0)*3+(f.diplomacy||0)+(t.morale-50)/5-(f.civilianAid||0)*5-(f.townDamage||0)/18)}
