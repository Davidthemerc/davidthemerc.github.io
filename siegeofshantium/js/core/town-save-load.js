function townStandingScore(){const t=state.town,f=state.flags;return Math.round((state.reputation||0)*2+(f.compassion||0)*3+(f.diplomacy||0)+(t.morale-50)/5-(f.civilianAid||0)*5-(f.townDamage||0)/18)}
function townStandingTier(){const n=townStandingScore();return n>=20?'Beloved Defender':n>=10?'Trusted Guardian':n>=2?'Respected':n>=-5?'Uncertain':n>=-14?'Resented':SOSText("core_town_save_load.townStandingTier.001")}
function siegeStage(){const r=state.round,t=state.town;if(r>=state.maxRounds-1||t.gate<=0)return'final';if(r>=9||t.walls<t.maxWalls*.45)return'desperate';if(r>=6||t.walls<t.maxWalls*.75)return'pressed';return'preparing'}
function livingTownDetails(){const t=state.town,stage=siegeStage(),bits=[];if(stage==='preparing')bits.push(SOSText("core_town_save_load.livingTownDetails.001"),SOSText("core_town_save_load.livingTownDetails.002"));if(stage==='pressed')bits.push('barricades',SOSText("core_town_save_load.livingTownDetails.003"),SOSText("core_town_save_load.livingTownDetails.004"));if(stage==='desperate')bits.push('wounded',SOSText("core_town_save_load.livingTownDetails.005"),SOSText("core_town_save_load.livingTownDetails.006"));if(stage==='final')bits.push(SOSText("core_town_save_load.livingTownDetails.007"),SOSText("core_town_save_load.livingTownDetails.008"),SOSText("core_town_save_load.livingTownDetails.009"));if(t.food<20)bits.push(SOSText("core_town_save_load.livingTownDetails.010"));if(t.medicine<10)bits.push(SOSText("core_town_save_load.livingTownDetails.011"));if(state.flags.civilianAid)bits.push(SOSText("core_town_save_load.livingTownDetails.012"));if(Object.keys(state.townCondition.damaged||{}).length)bits.push(SOSText("core_town_save_load.livingTownDetails.013"));return bits}
function assignedAt(post){return Object.entries(state.defenseAssignments||{}).map(([id,p])=>p===post?state.party.members[id]:null).filter(Boolean)}
function defensePresenceText(){const rows=[];for(const [k,d] of Object.entries(DEFENSE_POSTS)){const ms=assignedAt(k);if(ms.length)rows.push(`${d.name}: ${ms.map(m=>m.name).join(', ')}`)}return rows}
function maybeLivingEncounter(kind){const key=`${state.round}:${kind}`;if(state.townCondition.livingEvents[key])return null;state.townCondition.livingEvents[key]=true;state.flags.townVisits++;const t=state.town,stage=siegeStage();const encounters={walls:[[SOSText("core_town_save_load.maybeLivingEncounter.001"),stage==='final'?'Tomas has stopped talking about repairs in days and started talking in hours. He asks whether the breach crews should sleep in armor.':SOSText("core_town_save_load.maybeLivingEncounter.002")]],square:[[SOSText("core_town_save_load.maybeLivingEncounter.003"),state.flags.civilianAid?'Mara says several families gave nearly everything to the emergency defense fund. They are still working, but the sacrifice is visible in shuttered stalls.':SOSText("core_town_save_load.maybeLivingEncounter.004")]],barracks:[[SOSText("core_town_save_load.maybeLivingEncounter.005"),t.militia<15?'Orin admits the militia roster is getting thin. He has stopped assigning two people to jobs one can perform.':SOSText("core_town_save_load.maybeLivingEncounter.006")]],reserves:[[SOSText("core_town_save_load.maybeLivingEncounter.007"),defensePresenceText().length?SOSText("core_town_save_load.maybeLivingEncounter.008")+defensePresenceText().join('; ')+'.':SOSText("core_town_save_load.maybeLivingEncounter.009")]]};return (encounters[kind]||[])[0]||null}
function populationMood(){const p=state.town.population,m=state.town.morale;if(p<70)return SOSText("core_town_save_load.populationMood.001");if(m<30)return SOSText("core_town_save_load.populationMood.002");if(p<120||m<50)return SOSText("core_town_save_load.populationMood.003");if(m>=80)return SOSText("core_town_save_load.populationMood.004");return SOSText("core_town_save_load.populationMood.005")}
function townAtmosphere(){const t=state.town,m=populationMood(),stage=siegeStage(),r=state.round;const weather=[SOSText("core_town_save_load.townAtmosphere.001"),SOSText("core_town_save_load.townAtmosphere.002"),SOSText("core_town_save_load.townAtmosphere.003"),SOSText("core_town_save_load.townAtmosphere.004")][r%4];if(stage==='final')return SOSText("core_town_save_load.townAtmosphere.005",weather);if(stage==='desperate')return SOSText("core_town_save_load.townAtmosphere.006",weather);if(m===SOSText("core_town_save_load.townAtmosphere.007"))return SOSText("core_town_save_load.townAtmosphere.008",weather);if(m===SOSText("core_town_save_load.townAtmosphere.009"))return SOSText("core_town_save_load.townAtmosphere.010",weather);if(m===SOSText("core_town_save_load.townAtmosphere.011"))return SOSText("core_town_save_load.townAtmosphere.012",weather);if(m===SOSText("core_town_save_load.townAtmosphere.013"))return SOSText("core_town_save_load.townAtmosphere.014",weather);return SOSText("core_town_save_load.townAtmosphere.015",weather)}
function buildingDamageLevel(id){return state.townCondition?.damaged?.[id]||0}
function locationStatus(id){const d=buildingDamageLevel(id);return d>=2?'Badly damaged':d===1?'Damaged':state.town.upgrades.some(u=>u.toLowerCase().includes(id))?'Improved':SOSText("core_town_save_load.locationStatus.001")}
function contextualLine(id){const t=state.town,active=partyMembers(true),reserve=partyMembers(false).filter(m=>!state.party.active.includes(m.id));const low=t.food<20||t.medicine<10,enemy=state.groups.slice().sort((a,b)=>a.distance-b.distance)[0];const lines={hall:[enemy?SOSText("core_town_save_load.contextualLine.001",enemy.name,enemy.distance):SOSText("core_town_save_load.contextualLine.002"),t.morale<35?'Chester: “People are watching us. They need to see that the walls still mean something.”':SOSText("core_town_save_load.contextualLine.003")],council:[SOSText("core_town_save_load.contextualLine.004",populationMood().toLowerCase()),low?'The Mayor has supply tallies spread across the council table.':SOSText("core_town_save_load.contextualLine.005")],blacksmith:[buildingDamageLevel('blacksmith')?'Sera Venn works around a damaged section of the forge.':SOSText("core_town_save_load.contextualLine.006"),active.some(m=>m.className===SOSText("core_town_save_load.contextualLine.007"))?'A companion has been discussing heavy equipment with Sera.':SOSText("core_town_save_load.contextualLine.008")],fletcher:[SOSText("core_town_save_load.contextualLine.009"),enemy&&enemy.speed===2?'Pell has noticed unusually fast movement on the roads.':SOSText("core_town_save_load.contextualLine.010")],wizard:[SOSText("core_town_save_load.contextualLine.011"),state.guardian.className===SOSText("core_town_save_load.contextualLine.012")?SOSText("core_town_save_load.contextualLine.013",state.guardian.element==='none'?'unattuned':state.guardian.element+'-attuned'):SOSText("core_town_save_load.contextualLine.014")],market:[t.morale<40?'The market is subdued; merchants speak in low voices.':SOSText("core_town_save_load.contextualLine.015"),low?'Several stalls are already short of essentials.':SOSText("core_town_save_load.contextualLine.016")],tavern:[reserve.length?SOSText("core_town_save_load.contextualLine.017",reserve[0].name,trustTier(reserve[0].trust)):SOSText("core_town_save_load.contextualLine.018"),active.length?SOSText("core_town_save_load.contextualLine.019",active[0].name):SOSText("core_town_save_load.contextualLine.020")],healer:[t.medicine<10?'Brother Caldus is rationing medicine carefully.':SOSText("core_town_save_load.contextualLine.021"),active.some(m=>m.hp<allyMaxHP(m))?'One of your companions is still carrying wounds from the fighting.':SOSText("core_town_save_load.contextualLine.022")],apothecary:[SOSText("core_town_save_load.contextualLine.023"),buildingDamageLevel('apothecary')?'A cracked shelf has been braced with scrap timber.':SOSText("core_town_save_load.contextualLine.024")],storehouse:[SOSText("core_town_save_load.contextualLine.025",t.food,t.medicine,t.timber,t.stone),t.food<20?'The food bins are visibly thin.':SOSText("core_town_save_load.contextualLine.026")],training:[SOSText("core_town_save_load.contextualLine.027",t.militia),t.morale>=70?'Volunteers are drilling with unusual enthusiasm.':SOSText("core_town_save_load.contextualLine.028")],mason:[t.walls<t.maxWalls||t.gate<t.maxGate?'Repair crews are sorting timber and stone for the defenses.':SOSText("core_town_save_load.contextualLine.029"),SOSText("core_town_save_load.contextualLine.030",t.walls,t.maxWalls,t.gate,t.maxGate)]};return pick(lines[id]||[townAtmosphere()])}
function showTownTalk(id){modalRouteEnter(SOSText("core_town_save_load.showTownTalk.001"),Array.from(arguments));const names={hall:SOSText("core_town_save_load.showTownTalk.002"),council:SOSText("core_town_save_load.showTownTalk.003"),blacksmith:SOSText("core_town_save_load.showTownTalk.004"),fletcher:SOSText("core_town_save_load.showTownTalk.005"),wizard:SOSText("core_town_save_load.showTownTalk.006"),market:SOSText("core_town_save_load.showTownTalk.007"),tavern:SOSText("core_town_save_load.showTownTalk.008"),healer:SOSText("core_town_save_load.showTownTalk.009"),apothecary:SOSText("core_town_save_load.showTownTalk.010"),storehouse:SOSText("core_town_save_load.showTownTalk.011"),training:SOSText("core_town_save_load.showTownTalk.012"),mason:SOSText("core_town_save_load.showTownTalk.013")};if(isOpenWorld()){const ss=settlementState('shantium');overlay(SOSText("core_town_save_load.showTownTalk.014",names[id]||'Shantium',locationStatus(id),esc(id==='hall'?'Guardian Hall serves as the company’s permanent headquarters between journeys.':id==='market'?'Merchants, artisans, and travelers move through the Market District according to the town’s current prosperity.':`This part of Shantium is operating as part of the town’s ordinary day-to-day life.`),esc(`Security ${ss.security} • Prosperity ${ss.prosperity}. ${openWorldShantiumMood()}`)));$('#talkBack').onclick=()=>openLocation(id);return}overlay(SOSText("core_town_save_load.showTownTalk.015",names[id]||'Shantium',locationStatus(id),esc(contextualLine(id)),esc(townAtmosphere())));$('#talkBack').onclick=()=>openLocation(id)}

function normalize(){if(state){compactNullArrayRecords(state);migrateLegacyWeaponInstance()}if(state&&!state.mode)state.mode='siege';if(state?.mode==='openworld'){ensureWorldState();sanitizeLoadedCampaignState();syncOpenWorldProgress()}if(state&&!Array.isArray(state.customItems))state.customItems=[];if(state&&!state.enchanter)state.enchanter=null;if(state?.guardian?.className===SOSText("core_town_save_load.normalize.001"))state.guardian.className=SOSText("core_town_save_load.normalize.002");if(state&&!Array.isArray(state.fieldEncounters))state.fieldEncounters=[];if(state&&!state.defenseAssignments)state.defenseAssignments={};if(state&&!state.commissions)state.commissions=null;if(!state)return;state.skillPoints=0;state.history=Array.isArray(state.history)?state.history:[];state.eventState=state.eventState||{flags:{},scheduled:[],used:[]};state.eventState.flags=state.eventState.flags||{};state.eventState.scheduled=Array.isArray(state.eventState.scheduled)?state.eventState.scheduled:[];state.eventState.used=Array.isArray(state.eventState.used)?state.eventState.used:[];state.prisoners=Array.isArray(state.prisoners)?state.prisoners:[];state.flags=state.flags||{};state.flags.enemyIntel=state.flags.enemyIntel||0;if(Array.isArray(state.groups))state.groups.forEach(g=>{g.objective=g.objective||'assault';g.progress=g.progress||0;g.camp=g.camp||null;g.retreating=!!g.retreating});state.townCondition=state.townCondition||{damaged:{},lastVisitRound:{}};state.townCondition.damaged=state.townCondition.damaged||{};state.townCondition.lastVisitRound=state.townCondition.lastVisitRound||{};state.townCondition.livingEvents=state.townCondition.livingEvents||{};state.flags.townStanding=state.flags.townStanding||0;state.flags.townVisits=state.flags.townVisits||0;state.groups=(state.groups||[]).filter(g=>g&&g.id&&!g.defeated&&Array.isArray(g.members)&&g.members.length);let t=state.town,g=state.guardian;g.equipment={...emptyEquipment(),...(g.equipment||{})};g.inventory=Array.isArray(g.inventory)?g.inventory:[];g.className=g.className||null;g.element=g.element||'none';if(g.className===SOSText("core_town_save_load.normalize.003"))g.className=SOSText("core_town_save_load.normalize.004");if(state.level>=2&&!g.className)g.classChoicePending=true;ensurePartyState();t.walls=clamp(t.walls,0,t.maxWalls);t.gate=clamp(t.gate,0,t.maxGate);t.morale=clamp(t.morale,0,100);t.food=Math.max(0,t.food);t.medicine=Math.max(0,t.medicine);t.timber=Math.max(0,t.timber);t.stone=Math.max(0,t.stone);t.militia=Math.max(0,t.militia);t.population=Math.max(0,t.population);g.hp=clamp(g.hp,0,maxHP());g.stamina=clamp(g.stamina,0,maxStamina());state.flags.neutralLastRound=state.flags.neutralLastRound||0;if(!state.shopStock||state.shopStock.round!==state.round)refreshShopStock();else if(!Array.isArray(state.shopStock.wizard))state.shopStock.wizard=availableGear(SOSText("core_town_save_load.normalize.005")).map(i=>i.id);ensureCommissions();if(state.guardian.skills&&!('wizard' in state.guardian.skills)){state.guardian.skills.wizard=state.guardian.skills.mystic||0;delete state.guardian.skills.mystic}}
function saveKeyForMode(mode){return mode==='openworld'?SAVE_OPEN_WORLD_KEY:SAVE_SIEGE_KEY}
function backupKeyForMode(mode){return mode==='openworld'?SAVE_OPEN_WORLD_BACKUP_KEY:SAVE_SIEGE_BACKUP_KEY}
function campaignModeOf(s){return s?.mode==='openworld'?'openworld':'siege'}
function parseStoredCampaignRaw(raw){try{const s=JSON.parse(raw||'null');return s&&s.guardian&&s.town?s:null}catch{return null}}
function parseStoredCampaign(key){return parseStoredCampaignRaw(localStorage.getItem(key))}
function validGuardianClasses(){return Object.keys(CLASSES||{})}
function historicalGuardianClass(s){
 const valid=validGuardianClasses(),hits=[];
 for(const h of Array.isArray(s?.history)?s.history:[]){
   const text=`${h?.title||''} ${h?.text||''}`;
   for(const cls of valid)if(new RegExp(SOSText("core_town_save_load.historicalGuardianClass.001",cls),'i').test(text)||new RegExp(SOSText("core_town_save_load.historicalGuardianClass.002",cls),'i').test(text))hits.push({cls,t:h?.t||0,round:h?.round||0})
 }
 for(const l of Array.isArray(s?.log)?s.log:[]){
   const text=l?.msg||'';for(const cls of valid)if(new RegExp(SOSText("core_town_save_load.historicalGuardianClass.003",cls),'i').test(text))hits.push({cls,t:l?.t||0,round:0})
 }
 hits.sort((a,b)=>(a.t||0)-(b.t||0)||(a.round||0)-(b.round||0));return hits.length?hits[hits.length-1].cls:null
}
function guardianClassIntegrity(s,repair=false){
 if(!s?.guardian)return {ok:true,current:null,historical:null,repaired:false};
 const current=s.guardian.className||null,historical=historicalGuardianClass(s),valid=validGuardianClasses();
 let repaired=false,reason='';
 if(historical&&current!==historical){
   reason=SOSText("core_town_save_load.guardianClassIntegrity.001",current||'unset',historical);
   if(repair){s.guardian.className=historical;s.guardian.classChoicePending=false;repaired=true}
 }else if(current&&!valid.includes(current)&&current!==SOSText("core_town_save_load.guardianClassIntegrity.002")&&current!==SOSText("core_town_save_load.guardianClassIntegrity.003")){
   reason=SOSText("core_town_save_load.guardianClassIntegrity.004",current);
 }
 return {ok:!reason,current,historical,repaired,reason}
}
function campaignFreshness(s){
 return Number(s?.lastSavedAt||s?.savedAt||0)||0
}
function migrateLegacySaveSlots(){
 if(localStorage.getItem(SAVE_SLOT_MIGRATION_KEY)==='1')return;
 const legacy=parseStoredCampaign(SAVE_KEY);
 if(legacy){
   guardianClassIntegrity(legacy,true);
   const mode=legacy.mode==='openworld'?'openworld':'siege',key=saveKeyForMode(mode),existing=parseStoredCampaign(key);
   if(!existing||campaignFreshness(legacy)>campaignFreshness(existing))localStorage.setItem(key,JSON.stringify(legacy))
 }
 // Migration is intentionally one-shot. Old builds/tabs may continue writing the legacy mirror,
 // but they must never reseed or replace the explicit mode slots after this point.
 localStorage.setItem(SAVE_SLOT_MIGRATION_KEY,'1')
}
function savedCampaign(mode){migrateLegacySaveSlots();let s=parseStoredCampaign(saveKeyForMode(mode));if(!s)s=parseStoredCampaign(backupKeyForMode(mode));if(s)guardianClassIntegrity(s,true);return s}
function hasModeSave(mode){return !!savedCampaign(mode)}
function savedCampaignSummary(mode){
 const s=savedCampaign(mode);if(!s)return mode==='openworld'?'No Open World campaign saved':SOSText("core_town_save_load.savedCampaignSummary.001");
 const cls=s.guardian?.className?` • ${s.guardian.className}`:'';
 return mode==='openworld'?SOSText("core_town_save_load.savedCampaignSummary.002",s.name||'Guardian',cls,s.world?.day||1,worldLocationSafeName(s.world?.location)):SOSText("core_town_save_load.savedCampaignSummary.003",s.name||'Guardian',cls,s.round||1,s.maxRounds||12)
}
function worldLocationSafeName(id){const x=typeof WORLD_LOCATIONS!=='undefined'&&WORLD_LOCATIONS.find?.(v=>v.id===id);return x?.name||id||SOSText("core_town_save_load.worldLocationSafeName.001")}
let lastLoadFailure=null;

function writeCampaignStorage(mode,data){
 const key=saveKeyForMode(mode),backup=backupKeyForMode(mode),previous=localStorage.getItem(key);
 // Preserve the previous readable primary as a last-known-good snapshot. If storage
 // pressure makes the extra copy impossible, remove the backup and prioritize the primary.
 if(previous&&previous!==data&&parseStoredCampaignRaw(previous)){
   try{localStorage.setItem(backup,previous)}catch(e){console.warn(SOSText("core_town_save_load.writeCampaignStorage.001"),e)}
 }
 try{
   localStorage.setItem(key,data);
 }catch(e){
   console.warn(SOSText("core_town_save_load.writeCampaignStorage.002"),e);
   try{localStorage.removeItem(backup);localStorage.setItem(key,data)}catch(e2){console.error(SOSText("core_town_save_load.writeCampaignStorage.003"),e2);return false}
 }
 try{localStorage.setItem(SAVE_KEY,data)}catch(e){console.warn(SOSText("core_town_save_load.writeCampaignStorage.004"),e)}
 try{localStorage.setItem(SAVE_SLOT_MIGRATION_KEY,'1')}catch(e){}
 return true
}
function save(){
 if(!state)return false;
 try{
   normalize();state.version=VERSION;state.lastSavedAt=Date.now();
   const data=JSON.stringify(state),mode=campaignModeOf(state);
   const ok=writeCampaignStorage(mode,data);
   if(!ok&&state?.log)log(SOSText("core_town_save_load.save.001"),'bad');
   return ok
 }catch(e){console.error(SOSText("core_town_save_load.save.002"),e);return false}
}
function safeLoadRepair(label,fn,warnings){
 try{return fn()}catch(e){warnings.push(label);console.warn(SOSText("core_town_save_load.safeLoadRepair.001",label),e);return null}
}
function compactNullArrayRecords(root,depth=0){
 if(!root||depth>12)return 0;let fixes=0;
 if(Array.isArray(root)){
   for(let i=root.length-1;i>=0;i--){
     if(root[i]===null||root[i]===undefined){root.splice(i,1);fixes++;continue}
     if(typeof root[i]==='object')fixes+=compactNullArrayRecords(root[i],depth+1)
   }
   return fixes
 }
 if(typeof root==='object')for(const v of Object.values(root))if(v&&typeof v==='object')fixes+=compactNullArrayRecords(v,depth+1);
 return fixes
}
function cleanObjectRecordMap(obj){
 if(!obj||typeof obj!=='object'||Array.isArray(obj))return 0;let fixes=0;
 for(const k of Object.keys(obj))if(obj[k]===null||obj[k]===undefined||typeof obj[k]!=='object'){delete obj[k];fixes++}
 return fixes
}
function sanitizeLoadedCampaignState(){
 if(!state||typeof state!=='object')return 0;let fixes=compactNullArrayRecords(state);
 if(state.party?.relationships&&typeof state.party.relationships==='object'){
   for(const r of Object.values(state.party.relationships)){
     if(!r||typeof r!=='object'||!Array.isArray(r.history))continue;
     const cleaned=[];for(const h of r.history){if(!h?.text)continue;if(relationshipTextIsDuplicate(h.text,cleaned.map(x=>x.text)))continue;cleaned.push(h)}
     if(cleaned.length!==r.history.length){fixes+=r.history.length-cleaned.length;r.history=cleaned.slice(-8)}
   }
 }
 if(!Array.isArray(state.log))state.log=[];else state.log=state.log.filter(Boolean).map(x=>typeof x==='string'?{msg:x,type:'info'}:x);
 if(!Array.isArray(state.history))state.history=[];
 if(!Array.isArray(state.groups))state.groups=[];
 if(!Array.isArray(state.fieldEncounters))state.fieldEncounters=[];
 if(!state.guardian||typeof state.guardian!=='object')throw new Error(SOSText("core_town_save_load.sanitizeLoadedCampaignState.001"));
 if(!state.town||typeof state.town!=='object')throw new Error(SOSText("core_town_save_load.sanitizeLoadedCampaignState.002"));
 if(state.mode!=='openworld')return fixes;
 if(!state.world||typeof state.world!=='object')state.world=defaultWorldState();
 const w=state.world;
 if(!Array.isArray(w.quests))w.quests=[];else w.quests=w.quests.filter(q=>q&&typeof q==='object');
 if(!w.contracts||typeof w.contracts!=='object'||Array.isArray(w.contracts))w.contracts={};
 for(const k of Object.keys(w.contracts))w.contracts[k]=Array.isArray(w.contracts[k])?w.contracts[k].filter(q=>q&&typeof q==='object'):[];
 for(const q of w.quests)safeLoadRepair(SOSText("core_town_save_load.sanitizeLoadedCampaignState.003"),()=>ensureContractPaymentTerms(q),[]);
 for(const arr of Object.values(w.contracts))for(const q of arr)safeLoadRepair(SOSText("core_town_save_load.sanitizeLoadedCampaignState.004"),()=>ensureContractPaymentTerms(q),[]);
 if(!Array.isArray(w.parties))w.parties=[];else w.parties=w.parties.filter(p=>p&&typeof p==='object');
 const maps=[
   w.socialLife?.events,w.politics?.treaties,w.factionIncidents,w.settlementEvents,w.settlementProblems,
   w.regionalStories?.arcs,w.redstoneCivic?.issues,w.redstoneCivic?.districts
 ];
 for(const m of maps)fixes+=cleanObjectRecordMap(m);
 const arrays=[
   w.socialChains?.chains,w.relationshipBridge?.companionSocial?.requests,w.relationshipContracts?.messengers,
   w.regionalSimulation?.threads,w.regionalSimulation?.opportunities,w.regionalSimulation?.interventions,
   w.regionalSimulation?.flows,w.tradeEconomy?.deliveries,w.tradeEconomy?.losses,w.tradeEconomy?.trades,
   w.tradeEconomy?.crossRegion?.flows,w.tradeEconomy?.crossRegion?.disruptions
 ];
 for(const a of arrays)if(Array.isArray(a)){const before=a.length;for(let i=a.length-1;i>=0;i--)if(!a[i]||typeof a[i]!=='object')a.splice(i,1);fixes+=before-a.length}
 return fixes
}
function prepareLoadedCampaign(candidate){
 const warnings=[];
 // Work on a fresh object so a failed compatibility pass cannot damage the parsed source.
 state=JSON.parse(JSON.stringify(candidate));combat=null;townNavStack=[];townNavCurrent=null;townNavRestoring=false;
 const compacted=sanitizeLoadedCampaignState();if(compacted)warnings.push(SOSText("core_town_save_load.prepareLoadedCampaign.001",compacted,compacted===1?'':'s'));
 if(migrateLegacyWeaponInstance())warnings.push(SOSText("core_town_save_load.prepareLoadedCampaign.002"));
 const integrity=guardianClassIntegrity(state,true);
 try{normalize()}catch(e){
   console.warn(SOSText("core_town_save_load.prepareLoadedCampaign.003"),e);
   warnings.push(SOSText("core_town_save_load.prepareLoadedCampaign.004",e?.message||String(e)));
   sanitizeLoadedCampaignState();
   if(state.mode==='openworld')ensureWorldState();
   normalize()
 }
 if(integrity.repaired){log(SOSText("core_town_save_load.prepareLoadedCampaign.005",integrity.historical),'info');chronicle(SOSText("core_town_save_load.prepareLoadedCampaign.006"),integrity.reason,'event')}
 if(state.mode==='openworld'){
   ensureWorldState();
   if(!validWorldLocationId(state.world.location)){state.world.location='shantium';state.world.region='shantium';warnings.push(SOSText("core_town_save_load.prepareLoadedCampaign.007"))}
   // These are compatibility/cleanup systems, not prerequisites for opening the campaign.
   // A bug in one must never make Continue behave like a dead button.
   safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.008"),()=>repairOpenWorldState(),warnings);
   safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.009"),()=>repairPreBeyondIntegrity(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.010"),()=>repairGeneratedGroupGrammar(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.011"),()=>repairPursuitState(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.012"),()=>repairFactionSecurityResponseState(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.013"),()=>repairLongCampaignSimulationState(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.014"),()=>repairPendingWorldLifeTravel(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.015"),()=>repairGuardianPublicEndorsement(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.016"),()=>repairLocalPoliticsState(),warnings);
   safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.017"),()=>repairEscortContracts(),warnings);
   safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.018"),()=>repairActiveContractParties(),warnings);
   sanitizeLoadedCampaignState();
 }
 return warnings
}
function campaignLoadCandidates(mode=null){
 const wanted=mode||null,out=[],seen=new Set(),add=(source,raw)=>{
   if(!raw||seen.has(raw))return;seen.add(raw);
   const s=parseStoredCampaignRaw(raw);if(!s)return;
   if(wanted&&campaignModeOf(s)!==wanted)return;
   out.push({source,state:s})
 };
 if(wanted){
   add('primary',localStorage.getItem(saveKeyForMode(wanted)));
   add(SOSText("core_town_save_load.campaignLoadCandidates.001"),localStorage.getItem(backupKeyForMode(wanted)));
   add(SOSText("core_town_save_load.campaignLoadCandidates.002"),localStorage.getItem(SAVE_KEY));
 }else{
   add(SOSText("core_town_save_load.campaignLoadCandidates.003"),localStorage.getItem(SAVE_KEY))
 }
 return out
}
function load(mode=null){
 migrateLegacySaveSlots();lastLoadFailure=null;
 const candidates=campaignLoadCandidates(mode);
 if(!candidates.length){lastLoadFailure=SOSText("core_town_save_load.load.001");return false}
 for(const candidate of candidates){
   try{
     const warnings=prepareLoadedCampaign(candidate.state);
     const recovered=candidate.source!=='primary';
     if(recovered)log(SOSText("core_town_save_load.load.002",candidate.source),'info');
     if(warnings.length)log(SOSText("core_town_save_load.load.003"),'info');
     const persisted=save();
     if(!persisted)log(SOSText("core_town_save_load.load.004"),'bad');
     lastLoadFailure=null;return true
   }catch(e){
     console.warn(SOSText("core_town_save_load.load.005",candidate.source),e);
     lastLoadFailure=`${candidate.source}: ${e?.message||String(e)}`;
     state=null;combat=null
   }
 }
 return false
}
function clearSave(mode=state?.mode||null){
 const target=mode==='openworld'?'openworld':mode==='siege'?'siege':null;
 if(target){localStorage.removeItem(saveKeyForMode(target));localStorage.removeItem(backupKeyForMode(target))}
 else{localStorage.removeItem(SAVE_OPEN_WORLD_KEY);localStorage.removeItem(SAVE_SIEGE_KEY);localStorage.removeItem(SAVE_OPEN_WORLD_BACKUP_KEY);localStorage.removeItem(SAVE_SIEGE_BACKUP_KEY)}
 const legacy=parseStoredCampaign(SAVE_KEY);if(!target||!legacy||campaignModeOf(legacy)===target)localStorage.removeItem(SAVE_KEY)
 localStorage.setItem(SAVE_SLOT_MIGRATION_KEY,'1')
}
const FORCE_OBJECTIVES={
 assault:{name:SOSText("core_town_save_load.clearSave.001"),desc:SOSText("core_town_save_load.clearSave.002"),move:1},
 raid:{name:SOSText("core_town_save_load.clearSave.003"),desc:SOSText("core_town_save_load.clearSave.004"),move:1},
 scout:{name:SOSText("core_town_save_load.clearSave.005"),desc:SOSText("core_town_save_load.clearSave.006"),move:2},
 engineer:{name:SOSText("core_town_save_load.clearSave.007"),desc:SOSText("core_town_save_load.clearSave.008"),move:1},
 reinforce:{name:SOSText("core_town_save_load.clearSave.009"),desc:SOSText("core_town_save_load.clearSave.010"),move:1},
 command:{name:SOSText("core_town_save_load.clearSave.011"),desc:SOSText("core_town_save_load.clearSave.012"),move:1}
};
