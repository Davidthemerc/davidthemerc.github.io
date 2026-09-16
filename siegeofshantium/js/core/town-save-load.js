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
function showTownTalk(id){modalRouteEnter(SOSText("core_town_save_load.showTownTalk.001"),Array.from(arguments));const names={hall:SOSText("core_town_save_load.showTownTalk.002"),council:SOSText("core_town_save_load.showTownTalk.003"),blacksmith:SOSText("core_town_save_load.showTownTalk.004"),fletcher:SOSText("core_town_save_load.showTownTalk.005"),wizard:SOSText("core_town_save_load.showTownTalk.006"),market:SOSText("core_town_save_load.showTownTalk.007"),tavern:SOSText("core_town_save_load.showTownTalk.008"),healer:SOSText("core_town_save_load.showTownTalk.009"),apothecary:SOSText("core_town_save_load.showTownTalk.010"),storehouse:SOSText("core_town_save_load.showTownTalk.011"),training:SOSText("core_town_save_load.showTownTalk.012"),mason:SOSText("core_town_save_load.showTownTalk.013")};if(isOpenWorld()){const ss=settlementState('shantium');overlay(SOSText("core_town_save_load.showTownTalk.014",names[id]||'Shantium',locationStatus(id),esc(id==='hall'?'Guardian Hall serves as the company’s permanent headquarters between journeys.':id==='market'?'Merchants, artisans, and travelers move through the Market District according to the town’s current prosperity.':`This part of Shantium is operating as part of the town’s ordinary day-to-day life.`),esc(`Security ${fmtStat(ss.security)} • Prosperity ${fmtStat(ss.prosperity)}. ${openWorldShantiumMood()}`)));$('#talkBack').onclick=()=>openLocation(id);return}overlay(SOSText("core_town_save_load.showTownTalk.015",names[id]||'Shantium',locationStatus(id),esc(contextualLine(id)),esc(townAtmosphere())));$('#talkBack').onclick=()=>openLocation(id)}

function normalize(){if(state){compactNullArrayRecords(state);migrateLegacyWeaponInstance()}if(state&&!state.mode)state.mode='legacy_siege';if(state?.mode==='siege')state.mode='legacy_siege';if(state?.mode==='openworld'){ensureWorldState();sanitizeLoadedCampaignState();syncOpenWorldProgress()}if(state&&!Array.isArray(state.customItems))state.customItems=[];if(state&&!state.enchanter)state.enchanter=null;if(state?.guardian?.className===SOSText("core_town_save_load.normalize.001"))state.guardian.className=SOSText("core_town_save_load.normalize.002");if(state&&!Array.isArray(state.fieldEncounters))state.fieldEncounters=[];if(state&&!state.defenseAssignments)state.defenseAssignments={};if(state&&!state.commissions)state.commissions=null;if(!state)return;state.skillPoints=0;state.history=Array.isArray(state.history)?state.history:[];state.eventState=state.eventState||{flags:{},scheduled:[],used:[]};state.eventState.flags=state.eventState.flags||{};state.eventState.scheduled=Array.isArray(state.eventState.scheduled)?state.eventState.scheduled:[];state.eventState.used=Array.isArray(state.eventState.used)?state.eventState.used:[];state.prisoners=Array.isArray(state.prisoners)?state.prisoners:[];state.flags=state.flags||{};state.flags.enemyIntel=state.flags.enemyIntel||0;if(Array.isArray(state.groups))state.groups.forEach(g=>{g.objective=g.objective||'assault';g.progress=g.progress||0;g.camp=g.camp||null;g.retreating=!!g.retreating});state.townCondition=state.townCondition||{damaged:{},lastVisitRound:{}};state.townCondition.damaged=state.townCondition.damaged||{};state.townCondition.lastVisitRound=state.townCondition.lastVisitRound||{};state.townCondition.livingEvents=state.townCondition.livingEvents||{};state.flags.townStanding=state.flags.townStanding||0;state.flags.townVisits=state.flags.townVisits||0;state.groups=(state.groups||[]).filter(g=>g&&g.id&&!g.defeated&&Array.isArray(g.members)&&g.members.length);let t=state.town,g=state.guardian;g.equipment={...emptyEquipment(),...(g.equipment||{})};g.inventory=Array.isArray(g.inventory)?g.inventory:[];g.className=g.className||null;g.element=g.element||'none';if(g.className===SOSText("core_town_save_load.normalize.003"))g.className=SOSText("core_town_save_load.normalize.004");if(state.level>=2&&!g.className)g.classChoicePending=true;ensurePartyState();t.walls=clamp(t.walls,0,t.maxWalls);t.gate=clamp(t.gate,0,t.maxGate);t.morale=clamp(t.morale,0,100);t.food=Math.max(0,t.food);t.medicine=Math.max(0,t.medicine);t.timber=Math.max(0,t.timber);t.stone=Math.max(0,t.stone);t.militia=Math.max(0,t.militia);t.population=Math.max(0,t.population);g.hp=clamp(g.hp,0,maxHP());g.stamina=clamp(g.stamina,0,maxStamina());state.flags.neutralLastRound=state.flags.neutralLastRound||0;if(!state.shopStock||state.shopStock.round!==state.round)refreshShopStock();else if(!Array.isArray(state.shopStock.wizard))state.shopStock.wizard=availableGear(SOSText("core_town_save_load.normalize.005")).map(i=>i.id);ensureCommissions();if(state.guardian.skills&&!('wizard' in state.guardian.skills)){state.guardian.skills.wizard=state.guardian.skills.mystic||0;delete state.guardian.skills.mystic}}
function saveKeyForMode(mode){return mode==='openworld'?SAVE_OPEN_WORLD_KEY:mode==='siege2'?SAVE_SIEGE_II_KEY:SAVE_LEGACY_SIEGE_KEY}
function backupKeyForMode(mode){return mode==='openworld'?SAVE_OPEN_WORLD_BACKUP_KEY:mode==='siege2'?SAVE_SIEGE_II_BACKUP_KEY:SAVE_LEGACY_SIEGE_BACKUP_KEY}
function campaignModeOf(s){return s?.mode==='openworld'?'openworld':s?.mode==='siege2'?'siege2':'legacy_siege'}
const STORAGE_CODEC_PREFIX='SOSLZW1:';
const SOSStorageRuntime={validKeys:new Set()};

// v1.6.55.1 — IndexedDB is the canonical runtime campaign store.
// Legacy localStorage campaign strings remain readable for transparent migration and recovery.
const SOS_IDB_NAME='siegeOfShantium.campaigns';
const SOS_IDB_VERSION=1;
const SOS_IDB_STORE='campaignSlots';
const SOS_IDB_MIGRATION_KEY='siegeOfShantium.indexedDbMigrated.v16551';
const SOSIndexedDBRuntime={db:null,ready:false,failed:false,promise:null,cache:new Map(),writeChain:Promise.resolve(),retryAfter:0,lastFailure:null,stats:{reads:0,writes:0,migrations:0,failures:0,recoveries:0,legacyWrites:0}};
function sosResetIDBConnection(){try{SOSIndexedDBRuntime.db?.close?.()}catch(e){}SOSIndexedDBRuntime.db=null;SOSIndexedDBRuntime.ready=false;SOSIndexedDBRuntime.promise=null}
function sosMarkIDBFailure(err){SOSIndexedDBRuntime.failed=true;SOSIndexedDBRuntime.lastFailure=String(err?.message||err||'IndexedDB failure');SOSIndexedDBRuntime.retryAfter=Date.now()+1500;sosResetIDBConnection()}
function sosMarkIDBRecovered(){if(SOSIndexedDBRuntime.failed)SOSIndexedDBRuntime.stats.recoveries++;SOSIndexedDBRuntime.failed=false;SOSIndexedDBRuntime.retryAfter=0;SOSIndexedDBRuntime.lastFailure=null}
function sosPerfRecordDuration(name,ms){
 if(typeof SOSRenderPerf==='undefined'||!SOSRenderPerf.enabled)return ms;
 const n=name||'operation',st=SOSRenderPerf.screenStats[n]||(SOSRenderPerf.screenStats[n]={count:0,total:0,max:0,last:0});
 ms=Math.max(0,Number(ms)||0);st.count++;st.total+=ms;st.max=Math.max(st.max,ms);st.last=ms;st.avg=st.total/st.count;
 if(ms>=40){SOSRenderPerf.lastSlow.unshift({name:n,ms:Math.round(ms),day:state?.world?.day||0,at:Date.now()});SOSRenderPerf.lastSlow=SOSRenderPerf.lastSlow.slice(0,12)}
 return ms
}
function sosIDBOpen(){
 if(SOSIndexedDBRuntime.promise)return SOSIndexedDBRuntime.promise;
 SOSIndexedDBRuntime.promise=new Promise(resolve=>{
  if(typeof indexedDB==='undefined'){SOSIndexedDBRuntime.failed=true;resolve(null);return}
  let req;try{req=indexedDB.open(SOS_IDB_NAME,SOS_IDB_VERSION)}catch(e){console.warn('IndexedDB unavailable; using legacy save storage.',e);SOSIndexedDBRuntime.failed=true;resolve(null);return}
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(SOS_IDB_STORE))db.createObjectStore(SOS_IDB_STORE,{keyPath:'key'})};
  req.onsuccess=()=>{SOSIndexedDBRuntime.db=req.result;sosMarkIDBRecovered();SOSIndexedDBRuntime.db.onversionchange=()=>{try{SOSIndexedDBRuntime.db.close()}catch(e){}SOSIndexedDBRuntime.db=null;SOSIndexedDBRuntime.ready=false;SOSIndexedDBRuntime.promise=null};resolve(req.result)};
  req.onerror=()=>{console.warn('IndexedDB open failed; browser save recovery will retry.',req.error);SOSIndexedDBRuntime.stats.failures++;sosMarkIDBFailure(req.error);resolve(null)}
 });return SOSIndexedDBRuntime.promise
}
function sosIDBRequest(mode,fn){
 return sosIDBOpen().then(db=>new Promise(resolve=>{
  if(!db){resolve(null);return}let tx;try{tx=db.transaction(SOS_IDB_STORE,mode);const store=tx.objectStore(SOS_IDB_STORE);fn(store,tx,resolve)}catch(e){console.warn('IndexedDB transaction failed.',e);SOSIndexedDBRuntime.stats.failures++;resolve(null)}
 }))
}
function sosIDBGet(key){
 const t=typeof sosPerfNow==='function'?sosPerfNow():Date.now();
 return sosIDBRequest('readonly',(store,tx,resolve)=>{const r=store.get(key);r.onsuccess=()=>{SOSIndexedDBRuntime.stats.reads++;const row=r.result||null;if(row?.raw)SOSIndexedDBRuntime.cache.set(key,row.raw);sosPerfRecordDuration('IndexedDB — Read',(typeof sosPerfNow==='function'?sosPerfNow():Date.now())-t);resolve(row)};r.onerror=()=>{SOSIndexedDBRuntime.stats.failures++;resolve(null)}})
}
function sosIDBPut(key,raw){
 const t=typeof sosPerfNow==='function'?sosPerfNow():Date.now();
 return sosIDBRequest('readwrite',(store,tx,resolve)=>{let done=false;const finish=ok=>{if(done)return;done=true;sosPerfRecordDuration('IndexedDB — Write',(typeof sosPerfNow==='function'?sosPerfNow():Date.now())-t);resolve(ok)};store.put({key,raw,updatedAt:Date.now()});tx.oncomplete=()=>{SOSIndexedDBRuntime.stats.writes++;SOSIndexedDBRuntime.cache.set(key,raw);finish(true)};tx.onerror=()=>{SOSIndexedDBRuntime.stats.failures++;finish(false)};tx.onabort=()=>finish(false)})
}
function sosIDBDelete(key){SOSIndexedDBRuntime.cache.delete(key);return sosIDBRequest('readwrite',(store,tx,resolve)=>{store.delete(key);tx.oncomplete=()=>{SOSIndexedDBRuntime.cache.delete(key);resolve(true)};tx.onerror=()=>resolve(false);tx.onabort=()=>resolve(false)})}
function sosLegacyRawForKey(key){try{return localStorage.getItem(key)}catch(e){return null}}
async function sosMigrateLegacyCampaignKey(key){
 if(SOSIndexedDBRuntime.cache.has(key))return false;
 const legacy=sosLegacyRawForKey(key);if(!legacy)return false;
 const parsed=parseStoredCampaignRaw(legacy);if(!parsed)return false;
 // IndexedDB stores ordinary JSON, not the expensive legacy LZW wrapper.
 const raw=JSON.stringify(parsed);if(await sosIDBPut(key,raw)){SOSIndexedDBRuntime.stats.migrations++;return true}return false
}
async function sosStorageReady(){
 const db=await sosIDBOpen();if(!db)return false;
 const keys=[SAVE_OPEN_WORLD_KEY,SAVE_OPEN_WORLD_BACKUP_KEY,SAVE_LEGACY_SIEGE_KEY,SAVE_LEGACY_SIEGE_BACKUP_KEY,SAVE_SIEGE_II_KEY,SAVE_SIEGE_II_BACKUP_KEY];
 for(const key of keys){const row=await sosIDBGet(key);if(row?.raw)SOSIndexedDBRuntime.cache.set(key,row.raw)}
 // Transparently seed missing IndexedDB slots from valid legacy localStorage saves.
 for(const key of keys)if(!SOSIndexedDBRuntime.cache.has(key))await sosMigrateLegacyCampaignKey(key);
 SOSIndexedDBRuntime.ready=true;try{localStorage.setItem(SOS_IDB_MIGRATION_KEY,'1')}catch(e){}
 return true
}
function sosStorageRaw(key){return SOSIndexedDBRuntime.cache.get(key)||sosLegacyRawForKey(key)||null}
function writeLegacyCampaignStorage(mode,data){
 const t=typeof sosPerfNow==='function'?sosPerfNow():Date.now(),key=saveKeyForMode(mode),backup=backupKeyForMode(mode),encoded=storageEncodeCampaign(data),previous=localStorage.getItem(key);
 if(previous&&previous!==encoded&&(SOSStorageRuntime.validKeys.has(key)||parseStoredCampaignRaw(previous))){try{localStorage.setItem(backup,previous);SOSStorageRuntime.validKeys.add(backup)}catch(e){}}
 try{localStorage.setItem(key,encoded);SOSStorageRuntime.validKeys.add(key);SOSIndexedDBRuntime.stats.legacyWrites++;sosPerfRecordDuration('Legacy Storage — Write',(typeof sosPerfNow==='function'?sosPerfNow():Date.now())-t);return true}catch(e){console.error('Legacy save fallback failed.',e);sosPerfRecordDuration('Legacy Storage — Write',(typeof sosPerfNow==='function'?sosPerfNow():Date.now())-t);return false}
}
async function sosTryIndexedDBCampaignWrite(key,backup,previous,raw){
 if(previous&&previous!==raw){const bok=await sosIDBPut(backup,previous);if(!bok)throw new Error('IndexedDB backup write failed.')}
 const ok=await sosIDBPut(key,raw);if(!ok)throw new Error('IndexedDB campaign write failed.');sosMarkIDBRecovered();return true
}
function sosQueueIndexedDBWrite(mode,raw){
 const key=saveKeyForMode(mode),backup=backupKeyForMode(mode),previous=SOSIndexedDBRuntime.cache.get(key)||null;
 SOSIndexedDBRuntime.cache.set(key,raw);if(previous&&previous!==raw)SOSIndexedDBRuntime.cache.set(backup,previous);
 SOSIndexedDBRuntime.writeChain=SOSIndexedDBRuntime.writeChain.then(async()=>{
  try{
   if(SOSIndexedDBRuntime.failed&&Date.now()<SOSIndexedDBRuntime.retryAfter)return writeLegacyCampaignStorage(mode,raw);
   if(SOSIndexedDBRuntime.failed)sosResetIDBConnection();
   return await sosTryIndexedDBCampaignWrite(key,backup,previous,raw)
  }catch(e){
   console.warn('IndexedDB save failed; retrying once before browser-storage fallback.',e);SOSIndexedDBRuntime.stats.failures++;sosMarkIDBFailure(e);
   try{sosResetIDBConnection();const db=await sosIDBOpen();if(db)return await sosTryIndexedDBCampaignWrite(key,backup,previous,raw)}catch(retryErr){console.warn('IndexedDB retry failed; using browser save fallback for this write.',retryErr);SOSIndexedDBRuntime.stats.failures++;sosMarkIDBFailure(retryErr)}
   return writeLegacyCampaignStorage(mode,raw)
  }
 });
 return true
}
function storageCompressText(input){
 const data=unescape(encodeURIComponent(String(input||'')));if(!data)return'';
 const dict=new Map();let next=256,phrase=data[0],out=[];
 for(let i=1;i<data.length;i++){
  const curr=data[i],combo=phrase+curr;
  if(dict.has(combo)){phrase=combo;continue}
  const code=phrase.length===1?phrase.charCodeAt(0):dict.get(phrase);out.push(String.fromCharCode(code));
  if(next<65535)dict.set(combo,next++);else{dict.clear();next=256}
  phrase=curr
 }
 out.push(String.fromCharCode(phrase.length===1?phrase.charCodeAt(0):dict.get(phrase)));return out.join('')
}
function storageDecompressText(comp){
 if(!comp)return'';const dict=new Map();let next=256,old=String.fromCharCode(comp.charCodeAt(0)),bytes=old;
 for(let i=1;i<comp.length;i++){
  const code=comp.charCodeAt(i);let entry;
  if(code<256)entry=String.fromCharCode(code);else if(dict.has(code))entry=dict.get(code);else if(code===next)entry=old+old[0];else throw new Error('Invalid compressed campaign data');
  bytes+=entry;if(next<65535)dict.set(next++,old+entry[0]);else{dict.clear();next=256}old=entry
 }
 return decodeURIComponent(escape(bytes))
}
function storageEncodeCampaign(raw){
 if(!raw||raw.startsWith(STORAGE_CODEC_PREFIX))return raw;
 try{return STORAGE_CODEC_PREFIX+storageCompressText(raw)}catch(e){console.warn('Campaign compression failed; using uncompressed storage.',e);return raw}
}
function storageDecodeCampaign(raw){
 if(!raw||!raw.startsWith(STORAGE_CODEC_PREFIX))return raw;
 return storageDecompressText(raw.slice(STORAGE_CODEC_PREFIX.length))
}
function parseStoredCampaignRaw(raw){try{const s=JSON.parse(storageDecodeCampaign(raw)||'null');return s&&s.guardian&&s.town?s:null}catch{return null}}
function parseStoredCampaign(key){const row=parseStoredCampaignRaw(localStorage.getItem(key));if(row)SOSStorageRuntime.validKeys.add(key);return row}
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
   if(!existing||campaignFreshness(legacy)>campaignFreshness(existing))localStorage.setItem(key,storageEncodeCampaign(JSON.stringify(legacy)))
 }
 // Migration is intentionally one-shot. Old builds/tabs may continue writing the legacy mirror,
 // but they must never reseed or replace the explicit mode slots after this point.
 localStorage.setItem(SAVE_SLOT_MIGRATION_KEY,'1')
}
function migrateSiegeModeSplit(){
 if(localStorage.getItem(SAVE_SIEGE_SPLIT_MIGRATION_KEY)==='1')return;
 const candidates=[parseStoredCampaign(SAVE_SIEGE_KEY),parseStoredCampaign(SAVE_SIEGE_BACKUP_KEY),parseStoredCampaign(SAVE_KEY)].filter(Boolean).filter(s=>campaignModeOf(s)==='legacy_siege');
 const source=candidates.sort((a,b)=>campaignFreshness(b)-campaignFreshness(a))[0]||null;
 if(source){
   const migrated=JSON.parse(JSON.stringify(source));migrated.mode='legacy_siege';migrated.legacySiege={...(migrated.legacySiege||{}),migratedFromOriginalSiege:true,migratedAtVersion:VERSION};
   guardianClassIntegrity(migrated,true);
   const existing=parseStoredCampaign(SAVE_LEGACY_SIEGE_KEY);
   if(!existing||campaignFreshness(migrated)>campaignFreshness(existing)){
     localStorage.setItem(SAVE_LEGACY_SIEGE_KEY,storageEncodeCampaign(JSON.stringify(migrated)));
     const verify=parseStoredCampaign(SAVE_LEGACY_SIEGE_KEY);if(!verify||campaignModeOf(verify)!=='legacy_siege')throw new Error('Legacy Siege save migration could not be verified.');
   }
 }
 localStorage.setItem(SAVE_SIEGE_SPLIT_MIGRATION_KEY,'1')
}
function savedCampaign(mode){migrateLegacySaveSlots();migrateSiegeModeSplit();let s=parseStoredCampaignRaw(sosStorageRaw(saveKeyForMode(mode)));if(!s)s=parseStoredCampaignRaw(sosStorageRaw(backupKeyForMode(mode)));if(s){if(s.mode==='siege')s.mode='legacy_siege';guardianClassIntegrity(s,true)}return s}
function hasModeSave(mode){return !!savedCampaign(mode)}
function savedCampaignSummary(mode){
 const s=savedCampaign(mode);if(!s)return mode==='openworld'?'No Open World campaign saved':mode==='siege2'?'No Siege Mode II campaign saved':'No Legacy Siege campaign saved';
 const cls=s.guardian?.className?` • ${s.guardian.className}`:'';
 return mode==='openworld'?SOSText("core_town_save_load.savedCampaignSummary.002",s.name||'Guardian',cls,s.world?.day||1,worldLocationSafeName(s.world?.location)):mode==='siege2'?`${s.name||'Guardian'}${cls} • Siege II • ${s.siegeII?.phaseLabel||'Defending Shantium'}`:SOSText("core_town_save_load.savedCampaignSummary.003",s.name||'Guardian',cls,s.round||1,s.maxRounds||12)
}
function worldLocationSafeName(id){const x=typeof WORLD_LOCATIONS!=='undefined'&&WORLD_LOCATIONS.find?.(v=>v.id===id);return x?.name||id||SOSText("core_town_save_load.worldLocationSafeName.001")}
let lastLoadFailure=null;

function writeCampaignStorage(mode,data){
 // Routine saves always enqueue persistence work. A transient IndexedDB failure is retried and may
 // fall back for that write without permanently forcing future saves onto synchronous localStorage.
 if(typeof indexedDB!=='undefined'){sosQueueIndexedDBWrite(mode,data);return true}
 SOSIndexedDBRuntime.failed=true;return writeLegacyCampaignStorage(mode,data)
}

function saveOptimizationState(){
 if(!state?.world)return null;
 if(!state.world.saveOptimization||typeof state.world.saveOptimization!=='object')state.world.saveOptimization={lastLightDay:0,lastDeepDay:0,lastManualDay:0,totalRemoved:0,lastReport:null};
 return state.world.saveOptimization
}
function saveOptimizationDay(x){
 if(!x||typeof x!=='object')return -99999;
 for(const k of ['resolvedDay','archivedDay','completedDay','closedDay','deliveredDay','staleDay','arrivedDay','updatedDay','lastSeenDay','day','createdDay','startedDay','sentDay','dueDay','expiresDay'])if(Number.isFinite(Number(x[k])))return Number(x[k]);
 return -99999
}
function saveOptimizationTrimArray(arr,max=100,cutoff=null,protect=null){
 if(!Array.isArray(arr))return 0;const before=arr.length;
 let rows=arr;
 if(cutoff!=null)rows=rows.filter(x=>(protect&&protect(x))||saveOptimizationDay(x)>=cutoff);
 if(rows.length>max){const protectedRows=protect?rows.filter(protect):[],ordinary=protect?rows.filter(x=>!protect(x)):rows;rows=[...protectedRows,...ordinary.slice(-Math.max(0,max-protectedRows.length))]}
 arr.splice(0,arr.length,...rows);return Math.max(0,before-arr.length)
}
function saveOptimizationDeleteMap(map,predicate){
 if(!map||typeof map!=='object'||Array.isArray(map))return 0;let n=0;for(const [k,v] of Object.entries(map))if(predicate(v,k)){delete map[k];n++}return n
}
function compactGuardianHallSaveData(report){
 const h=state.world.homeBase;if(!h)return;const now=state.world.day,C=h.correspondence||{},mailCut=now-45;
 const actionable=m=>typeof homeCorrespondenceActionable==='function'&&homeCorrespondenceActionable(m);
 if(Array.isArray(C.inbox)){const b=C.inbox.length;C.inbox=C.inbox.filter(m=>actionable(m)||!(m.status==='archived'||m.resolvedDay)||saveOptimizationDay(m)>=mailCut);report.correspondence+=b-C.inbox.length}
 if(Array.isArray(C.archive)){const b=C.archive.length;C.archive=C.archive.filter(m=>saveOptimizationDay(m)>=mailCut).slice(-80);report.correspondence+=b-C.archive.length}
 if(Array.isArray(C.sent)){const b=C.sent.length;C.sent=C.sent.filter(m=>saveOptimizationDay(m)>=mailCut).slice(-80);report.correspondence+=b-C.sent.length}
 if(Array.isArray(C.requests)){const active=new Set(['pending','delegated','field_required','overdue','active','traveling','in_progress']);const b=C.requests.length;C.requests=C.requests.filter(r=>active.has(r.status)||saveOptimizationDay(r)>=mailCut);report.correspondence+=b-C.requests.length}
 if(Array.isArray(C.followUps)){const b=C.followUps.length;C.followUps=C.followUps.filter(f=>f.status==='pending'||saveOptimizationDay(f)>=mailCut).slice(-60);report.correspondence+=b-C.followUps.length}
 for(const mem of Object.values(C.memory||{}))if(Array.isArray(mem?.history)&&mem.history.length>8){report.histories+=mem.history.length-8;mem.history=mem.history.slice(-8)}
 const trim=(obj,key,max,days)=>{if(obj&&Array.isArray(obj[key]))report.histories+=saveOptimizationTrimArray(obj[key],max,now-days)};
 trim(h.finance,'ledger',220,120);trim(h.audiences,'history',100,120);trim(h.diplomacy,'history',120,150);trim(h.life,'history',100,120);trim(h.hospitality,'history',100,120);trim(h.hospitality,'diningHistory',80,120);trim(h.activity,'homecomingHistory',60,180);trim(h.business,'reports',100,120)
}
function compactRelationshipBridgeSaveData(report){
 const B=state.world.relationshipBridge;if(!B)return;const now=state.world.day;
 const pruneDayKey=(map,keepDays)=>saveOptimizationDeleteMap(map,(v,k)=>{const d=Number(String(k).split(':')[0]);return Number.isFinite(d)&&d<now-keepDays});
 report.referrals+=pruneDayKey(B.referrals,14);report.referrals+=pruneDayKey(B.companionRecognition,14);
 if(Array.isArray(B.history))report.histories+=saveOptimizationTrimArray(B.history,80,now-120)
}
function compactWorldIntegrationSaveData(report){
 if(!state.world.worldIntegration)return;const W=worldIntegrationState(),now=state.world.day;
 report.worldRecords+=saveOptimizationDeleteMap(W.attention,a=>a.status!=='open'&&saveOptimizationDay(a)<now-30);
 report.worldRecords+=saveOptimizationDeleteMap(W.workOffers,o=>o.status!=='open'&&saveOptimizationDay(o)<now-60);
 report.worldRecords+=saveOptimizationDeleteMap(W.incidents,i=>i.status!=='open'&&saveOptimizationDay(i)<now-60);
 report.worldRecords+=saveOptimizationDeleteMap(W.matters,m=>m.status!=='active'&&saveOptimizationDay(m)<now-90);
 report.worldRecords+=saveOptimizationDeleteMap(W.dispatches,d=>!['traveling','arrived'].includes(d.status)&&saveOptimizationDay(d)<now-60);
 report.worldRecords+=saveOptimizationDeleteMap(W.intel,i=>i.status!=='active'&&saveOptimizationDay(i)<now-30);
 report.histories+=saveOptimizationTrimArray(W.transactions,220,now-120);
 report.histories+=saveOptimizationTrimArray(W.resources?.history,180,now-120);
 report.histories+=saveOptimizationTrimArray(W.accommodation?.stays,100,now-120);
 report.histories+=saveOptimizationTrimArray(W.effects,180,now-120);
 report.histories+=saveOptimizationTrimArray(W.history,120,now-180)
}
function saveOptimizationCollectActorRefs(root,actors,out=new Set(),depth=0,seen=new WeakSet()){
 if(root==null||depth>24)return out;if(typeof root==='string'){if(actors[root])out.add(root);return out}if(typeof root!=='object')return out;if(root===actors||seen.has(root))return out;seen.add(root);
 if(Array.isArray(root)){for(const v of root)saveOptimizationCollectActorRefs(v,actors,out,depth+1,seen);return out}
 for(const v of Object.values(root))saveOptimizationCollectActorRefs(v,actors,out,depth+1,seen);return out
}
function compactWorldActorRegistrySaveData(report){
 const W=worldIntegrationState(),actors=W.actors||{},now=state.world.day,refs=saveOptimizationCollectActorRefs(state,actors),transient=new Set(['world_party','traveler_group','traveler_person','party_member','reinforcement']);let removed=0;
 for(const [key,a] of Object.entries(actors)){if(!transient.has(a?.kind)||refs.has(key))continue;const age=now-(Number(a.retiredDay)||Number(a.lastSeenDay)||Number(a.createdDay)||now);if(a.active!==false&&age<90)continue;if(age<45)continue;if(typeof archiveWorldActorRecord==='function')archiveWorldActorRecord(a);delete actors[key];removed++}
 report.actorRecords=(report.actorRecords||0)+removed
}
function compactTravelerRegistrySaveData(report){
 const T=state.world.travelerRegistry;if(!T?.records)return;const now=state.world.day,important=new Set(['contract','completed','base_established','guardian_hall','introduction','death','killed','captured','rescued','settled','disbanded']);let removed=0;
 for(const r of Object.values(T.records)){if(!Array.isArray(r?.history)||r.history.length<=18)continue;const recent=r.history.slice(-12),keepKeys=new Set(recent.map(x=>`${x.day}|${x.event}|${x.detail||''}`)),milestones=[];
  for(let i=r.history.length-13;i>=0;i--){const e=r.history[i];if(!important.has(e?.event))continue;const signature=`${e.event}|${e.detail||''}`;if(milestones.some(x=>`${x.event}|${x.detail||''}`===signature))continue;milestones.unshift(e);if(milestones.length>=8)break}
  let rows=[...milestones,...recent],dedup=[],seen=new Set();for(const e of rows){const k=`${e.day}|${e.event}|${e.detail||''}`;if(seen.has(k))continue;seen.add(k);dedup.push(e)}if(dedup.length>20)dedup=dedup.slice(-20);removed+=Math.max(0,r.history.length-dedup.length);r.history=dedup
 }
 if(Array.isArray(T.history)){const b=T.history.length;T.history=T.history.filter(x=>saveOptimizationDay(x)>=now-180).slice(-60);removed+=b-T.history.length}
 report.travelerHistory=(report.travelerHistory||0)+removed
}
function compactGeneralWorldHistory(report){
 const w=state.world,now=w.day,trim=(obj,key,max,days)=>{if(obj&&Array.isArray(obj[key]))report.histories+=saveOptimizationTrimArray(obj[key],max,now-days)};
 trim(w,'travelHistory',150,180);trim(w,'routeTravelHistory',120,180);trim(w,'roadEventHistory',100,180);trim(w,'history',220,240);trim(w.roadLife,'history',100,180);trim(w.companionLife,'sharedEvents',120,180);trim(w.companionLife,'campHistory',80,180);trim(w.politics,'history',160,240);trim(w.economy,'ledger',220,180);trim(w.regionalSimulation?.evidence,'history',140,180);trim(w.regionalStories,'history',120,240);trim(w.contractMemory,'history',120,240)
}
function optimizeSaveData(force=false){
 if(!state?.world||!isOpenWorld())return {total:0,skipped:true};const O=saveOptimizationState(),now=state.world.day;
 const doLight=force||now-(O.lastLightDay||0)>=10,doDeep=force||now-(O.lastDeepDay||0)>=30;if(!doLight&&!doDeep)return O.lastReport||{total:0,skipped:true};
 const report={day:now,correspondence:0,referrals:0,worldRecords:0,actorRecords:0,travelerHistory:0,histories:0,lifecycle:0,total:0,manual:!!force};
 compactGuardianHallSaveData(report);compactRelationshipBridgeSaveData(report);compactGeneralWorldHistory(report);if(doDeep){if(typeof worldIntegrationLifecycleMaintenance==='function'){const lr=worldIntegrationLifecycleMaintenance(true);report.lifecycle=lr?.total||0}compactWorldIntegrationSaveData(report);compactWorldActorRegistrySaveData(report);compactTravelerRegistrySaveData(report)};
 report.total=report.correspondence+report.referrals+report.worldRecords+report.actorRecords+report.travelerHistory+report.histories+report.lifecycle;O.lastLightDay=now;if(doDeep)O.lastDeepDay=now;if(force)O.lastManualDay=now;O.totalRemoved=(O.totalRemoved||0)+report.total;O.lastReport=report;return report
}
function showSaveOptimizationResult(){
 const before=JSON.stringify(state).length,r=optimizeSaveData(true),after=JSON.stringify(state).length,saved=Math.max(0,before-after),pct=before?Math.round(saved/before*100):0;save();
 overlay(`<h2>Save Data Optimized</h2><div class="good notice"><b>${r.total.toLocaleString()} stale records compacted, reconciled, or removed</b><br>Approx. ${(saved/1024).toFixed(0)} KB removed from the uncompressed campaign state (${pct}%).</div><div class="card"><div class="stat-row"><span>Lifecycle reconciliation / retirement</span><b>${r.lifecycle||0}</b></div><div class="stat-row"><span>Old Hall correspondence / requests</span><b>${r.correspondence}</b></div><div class="stat-row"><span>Redundant referral/day markers</span><b>${r.referrals}</b></div><div class="stat-row"><span>Resolved world-integration records</span><b>${r.worldRecords}</b></div><div class="stat-row"><span>Unreferenced transient actor records</span><b>${r.actorRecords||0}</b></div><div class="stat-row"><span>Compacted traveler-history rows</span><b>${r.travelerHistory||0}</b></div><div class="stat-row"><span>Old ledger / travel / history rows</span><b>${r.histories}</b></div></div><p class="muted compact">Active contracts, unresolved correspondence, living traveler records, current Parties/world matters, custody, settlement/economy state, exploration progress, and relationships are preserved. Retired temporary actor identities are reduced to bounded archival tombstones so historical references can still resolve names.</p><div class="dialog-footer"><button id="saveOptBack">Back</button></div>`);$('#saveOptBack').onclick=gameMenu
}

// ===== v1.6.22.6 — Runtime Performance & Input Responsiveness =====
const SOSPerfRuntime={
  lastPartyMaintenanceDay:null,
  maintenanceQueued:false,
  saveTimer:null,
  saveQueued:false,
  saveInProgress:false,
  lastSaveResult:true,
  lastFlushAt:0
};
function sosFastOpenWorldStateReady(){
  if(!state||state.mode!=='openworld')return;
  ensureWorldState();
  if(!validWorldLocationId(state.world.location)){state.world.location='shantium';state.world.region='shantium'}
}
function scheduleOpenWorldMaintenance(){
  if(!state?.world||!isOpenWorld()||SOSPerfRuntime.maintenanceQueued)return;
  const day=state.world.day;
  if(SOSPerfRuntime.lastPartyMaintenanceDay===day)return;
  SOSPerfRuntime.maintenanceQueued=true;
  const run=()=>{
    SOSPerfRuntime.maintenanceQueued=false;
    if(!state?.world||!isOpenWorld())return;
    const currentDay=state.world.day;
    if(SOSPerfRuntime.lastPartyMaintenanceDay===currentDay)return;
    try{const deferredPerf=(name,fn)=>typeof sosPerfRun==='function'?sosPerfRun(name,fn):fn();deferredPerf('Deferred Maintenance — Normalize',()=>normalize())}catch(e){console.warn('Deferred daily normalization',e)}
    try{repairEscortContracts()}catch(e){console.warn('Deferred escort maintenance',e)}
    try{repairActiveContractParties()}catch(e){console.warn('Deferred contract-party maintenance',e)}
    try{maintainWorldParties(true)}catch(e){console.warn('Deferred moving-party maintenance',e)}
    SOSPerfRuntime.lastPartyMaintenanceDay=currentDay;
  };
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>setTimeout(run,0));else setTimeout(run,0);
}
function flushCampaignSaveNow(){
  if(!state)return false;
  if(typeof SOSSavePolicy!=='undefined'&&!SOSSavePolicy.dirty&&SOSPerfRuntime.lastSaveResult!==undefined)return SOSPerfRuntime.lastSaveResult;
  if(SOSPerfRuntime.saveInProgress)return SOSPerfRuntime.lastSaveResult;
  SOSPerfRuntime.saveInProgress=true;
  const perf=(name,fn)=>typeof sosPerfRun==='function'?sosPerfRun(name,fn):fn();
  try{
    perf('Save — Normalize',()=>{if(isOpenWorld())sosFastOpenWorldStateReady();else normalize()});
    if(isOpenWorld())perf('Save — Compact',()=>optimizeSaveData(false));
    state.version=VERSION;state.lastSavedAt=Date.now();
    let raw='',mode='';
    perf('Save — Serialize',()=>{raw=JSON.stringify(state)});
    mode=campaignModeOf(state);
    const ok=perf('Save — Queue Storage',()=>writeCampaignStorage(mode,raw));
    SOSPerfRuntime.lastSaveResult=ok;SOSPerfRuntime.lastFlushAt=Date.now();SOSPerfRuntime.saveQueued=false;
    if(!ok&&state?.log)log(SOSText("core_town_save_load.save.001"),'bad');
    return ok;
  }catch(e){console.error(SOSText("core_town_save_load.save.002"),e);SOSPerfRuntime.lastSaveResult=false;return false}
  finally{SOSPerfRuntime.saveInProgress=false}
}

function queueCampaignSave(delay=90){
  if(!state)return false;
  SOSPerfRuntime.saveQueued=true;
  if(SOSPerfRuntime.saveTimer)clearTimeout(SOSPerfRuntime.saveTimer);
  SOSPerfRuntime.saveTimer=setTimeout(()=>{SOSPerfRuntime.saveTimer=null;flushCampaignSaveNow()},delay);
  return true;
}
function save(immediate=false){
  if(!state)return false;
  // Normal gameplay saves are intentionally deferred so the browser can paint the
  // clicked state/menu first. Explicit flushes remain available for lifecycle exits.
  return immediate?flushCampaignSaveNow():queueCampaignSave();
}
function sosFlushSaveOnExit(){
  if(SOSPerfRuntime.saveTimer){clearTimeout(SOSPerfRuntime.saveTimer);SOSPerfRuntime.saveTimer=null}
  if(SOSPerfRuntime.saveQueued&&state)flushCampaignSaveNow();
}
window.addEventListener('pagehide',sosFlushSaveOnExit,{capture:true});
window.addEventListener('beforeunload',sosFlushSaveOnExit,{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')sosFlushSaveOnExit()},{capture:true});
// Give taps/clicks visible feedback before a potentially expensive handler begins.
document.addEventListener('pointerdown',e=>{
  const b=e.target?.closest?.('button,[role="button"],.world-location,.world-party');if(!b||b.disabled)return;
  b.classList.add('sos-pressed');
},{capture:true,passive:true});
const sosClearPressed=e=>{const b=e.target?.closest?.('button,[role="button"],.world-location,.world-party');if(!b)return;setTimeout(()=>b.classList.remove('sos-pressed'),70)};
document.addEventListener('pointerup',sosClearPressed,{capture:true,passive:true});
document.addEventListener('pointercancel',sosClearPressed,{capture:true,passive:true});


// ===== v1.6.22.6 — Save Scheduling & Transaction Boundaries =====
const SOSSavePolicy={
  idleDelay:3500,
  importantDelay:900,
  criticalDelay:150,
  dirty:false,
  dirtyReasons:new Set(),
  lastReason:'',
  stats:{dirty:0,queued:0,important:0,critical:0,flushes:0}
};
function markDirty(reason='routine-state-change'){
  if(!state)return false;
  SOSSavePolicy.dirty=true;SOSSavePolicy.lastReason=reason;SOSSavePolicy.dirtyReasons.add(reason);SOSSavePolicy.stats.dirty++;
  SOSPerfRuntime.saveQueued=true;
  return true;
}
function sosScheduleSave(reason='routine-state-change',delay=SOSSavePolicy.idleDelay){
  if(!markDirty(reason))return false;
  SOSSavePolicy.stats.queued++;
  if(SOSPerfRuntime.saveTimer)clearTimeout(SOSPerfRuntime.saveTimer);
  SOSPerfRuntime.saveTimer=setTimeout(()=>{SOSPerfRuntime.saveTimer=null;flushCampaignSaveNow()},Math.max(0,delay));
  return true;
}
function queueSave(reason='routine-state-change',delay=SOSSavePolicy.idleDelay){return sosScheduleSave(reason,delay)}
function importantSave(reason='important-state-change'){SOSSavePolicy.stats.important++;return sosScheduleSave(reason,SOSSavePolicy.importantDelay)}
function criticalSave(reason='critical-state-change',force=false){
  SOSSavePolicy.stats.critical++;markDirty(reason);
  if(force)return flushCampaignSaveNow();
  return sosScheduleSave(reason,SOSSavePolicy.criticalDelay)
}
function save(immediate=false,reason='routine-state-change'){
  if(!state)return false;
  return immediate?criticalSave(reason,true):queueSave(reason,SOSSavePolicy.idleDelay)
}
const _sosFlushCampaignSaveNow16226=flushCampaignSaveNow;
flushCampaignSaveNow=function(){
  if(!state)return false;
  const ok=_sosFlushCampaignSaveNow16226();
  if(ok){SOSSavePolicy.dirty=false;SOSSavePolicy.dirtyReasons.clear();SOSSavePolicy.stats.flushes++}
  return ok
};
function sosWrapSaveBoundary(name,reason,level='critical'){
  const fn=window[name];if(typeof fn!=='function'||fn.__sosSaveBoundary)return false;
  const wrapped=function(...args){
    const out=fn.apply(this,args);
    if(level==='important')importantSave(reason);else if(level==='dirty')markDirty(reason);else criticalSave(reason);
    return out
  };
  wrapped.__sosSaveBoundary=true;window[name]=wrapped;return true
}
// High-value transaction boundaries. Existing internal save() calls coalesce into the same pending write.
[
 ['arriveEscortContract','contract-escort-arrival'],['failEscortContract','contract-failure'],
 ['startPoliticalRaidCombat','political-raid-combat-start'],['enterGuardianHallViaSecretPassage','hidden-passage-entry'],
 ['leaveGuardianHallViaSecretPassage','hidden-passage-exit'],['completeHomeLogisticsShipment','hall-shipment-arrival'],
 ['homeConcludeGuestStay','hall-guest-departure'],['resolveLiveRegionalConflict','regional-conflict-resolution']
].forEach(x=>sosWrapSaveBoundary(x[0],x[1],'critical'));
// A completed game-day simulation is an important natural checkpoint, but it is allowed to paint first.
sosWrapSaveBoundary('advanceWorldDays','day-advanced','important');
// Manual/lifecycle operations always flush now.
const _sosExportSave16226=window.exportSave;
if(typeof _sosExportSave16226==='function')window.exportSave=function(...args){criticalSave('export-save',true);return _sosExportSave16226.apply(this,args)};
const _sosGameMenu16226=window.gameMenu;
if(typeof _sosGameMenu16226==='function')window.gameMenu=function(...args){
  const out=_sosGameMenu16226.apply(this,args);
  const sn=document.querySelector('#saveNow');if(sn)sn.onclick=()=>{criticalSave('manual-save',true);log(SOSText("core_settings_help_audio.gameMenu.002"),'good');closeAndRender()};
  const q=document.querySelector('#quit');if(q)q.onclick=()=>{criticalSave('quit-to-main-menu',true);closeOverlay();state=null;renderMenu()};
  return out
};
// Flush only when there is actually dirty state waiting.
function sosFlushSaveOnExit(){
  if(SOSPerfRuntime.saveTimer){clearTimeout(SOSPerfRuntime.saveTimer);SOSPerfRuntime.saveTimer=null}
  if((SOSSavePolicy.dirty||SOSPerfRuntime.saveQueued)&&state)criticalSave('page-exit',true)
}



// ===== v1.6.23 — Runtime Profiling & Hotspot Optimization =====
const SOSRenderPerf={
  depth:0,cache:null,current:'',screenStats:{},helperHits:0,helperMisses:0,lastSlow:[],enabled:true
};
function sosPerfNow(){return (typeof performance!=='undefined'&&performance.now)?performance.now():Date.now()}
function sosPerfBegin(name){
  if(SOSRenderPerf.depth++===0){SOSRenderPerf.cache=new Map();SOSRenderPerf.current=name||'screen';SOSRenderPerf.helperHits=0;SOSRenderPerf.helperMisses=0}
  return sosPerfNow()
}
function sosPerfEnd(name,start){
  const ms=Math.max(0,sosPerfNow()-start),n=name||SOSRenderPerf.current||'screen',st=SOSRenderPerf.screenStats[n]||(SOSRenderPerf.screenStats[n]={count:0,total:0,max:0,last:0});
  st.count++;st.total+=ms;st.max=Math.max(st.max,ms);st.last=ms;st.avg=st.total/st.count;
  if(ms>=40){SOSRenderPerf.lastSlow.unshift({name:n,ms:Math.round(ms),day:state?.world?.day||0,at:Date.now()});SOSRenderPerf.lastSlow=SOSRenderPerf.lastSlow.slice(0,12)}
  SOSRenderPerf.depth=Math.max(0,SOSRenderPerf.depth-1);if(SOSRenderPerf.depth===0){SOSRenderPerf.cache=null;SOSRenderPerf.current=''}
  return ms
}
function sosPerfRun(name,fn){
  if(!SOSRenderPerf.enabled)return fn();const t=sosPerfBegin(name);try{return fn()}finally{sosPerfEnd(name,t)}
}
function settlementWorldLocations(){
  if(!state?.world?.settlements)return[];
  return sosPerfMemo('settlementWorldLocations',()=>WORLD_LOCATIONS.filter(x=>state.world.settlements?.[x.id]))
}
function sosPerfMemo(key,producer){
  if(!SOSRenderPerf.cache)return producer();
  if(SOSRenderPerf.cache.has(key)){SOSRenderPerf.helperHits++;return SOSRenderPerf.cache.get(key)}
  SOSRenderPerf.helperMisses++;const v=producer();SOSRenderPerf.cache.set(key,v);return v
}
function sosPerfArgKey(v){
  if(v===null)return'null';const t=typeof v;if(t==='string'||t==='number'||t==='boolean')return String(v);
  if(Array.isArray(v))return '['+v.map(sosPerfArgKey).join(',')+']';
  if(t==='object')return v.id?`id:${v.id}`:v.name?`name:${v.name}`:'obj';return t
}
function sosMemoizeGlobal(name,keyer=null){
  const fn=window[name];if(typeof fn!=='function'||fn.__sosMemo16227)return false;
  const wrapped=function(...args){if(!SOSRenderPerf.cache)return fn.apply(this,args);const key=`${name}|${keyer?keyer(args):args.map(sosPerfArgKey).join('|')}`;return sosPerfMemo(key,()=>fn.apply(this,args))};
  wrapped.__sosMemo16227=true;wrapped.__sosOriginal=fn;window[name]=wrapped;return true
}
function sosProfileGlobal(name,label=name){
  const fn=window[name];if(typeof fn!=='function'||fn.__sosProfile16227)return false;
  const wrapped=function(...args){const t=sosPerfBegin(label);try{return fn.apply(this,args)}finally{sosPerfEnd(label,t)}};
  wrapped.__sosProfile16227=true;wrapped.__sosOriginal=fn;window[name]=wrapped;return true
}
// These helpers are read-only derived queries during screen construction. Cache lifetime is one render only.
// Installation is deferred until runtime-start because several targets live in modules loaded after this file.
const SOS_PERF_MEMO_TARGETS=[
 'worldLocation','worldTravelDays','locationsInRegion','locationRegion','nearbyWorldParties','activeLiveRegionalConflicts','settlementConditionText',
 'factionRepresentativesAt','localReputation','settlementControl','jurisdictionRep','wantedTier','localBounty',
 'regionalTravelOptions','regionalTravelSummary','homeHomecomingSummaryHTML','openAttention','bestPartyRecipient',
 'worldPartyDisplayRegion','worldPartyPosition','worldPartyDisposition','worldPartySafeLocationId','regionConnectionAt','roadConditionProfile','politicalMapTag',
 'settlementPriceModifier','tradeDemandScore','tradeStock','routeEvidence','spawnDistrictProfile','spawnAvenuesAt','spawnDistrictLocalIndex'
];
const SOS_PERF_PROFILE_TARGETS=[
 ['renderOpenWorld','Regional Map'],['showNearbyWorldParties','Nearby Parties'],['showWorldParty','Party Detail'],
 ['showInventory','Inventory'],['showContractsJournal','Contracts'],['showHomeBase','Guardian Hall'],
 ['showSettlementPolitics','Settlement Politics'],['showRegionalPolitics','Regional Politics'],
 ['showFactionOverview','Faction Overview'],['showOpenWorldSettlementTownLife','Town Life'],
 ['advanceWorldDays','Advance World Day'],['openWorldMapHTML','Regional Map Build'],['spawnRoadNetworkHTML','Spawn Road Overlay'],
 ['flushCampaignSaveNow','Save Flush'],['load','Campaign Load']
];
function installSOSPerformanceHooks(){
 let memo=0,profile=0;
 for(const n of SOS_PERF_MEMO_TARGETS)if(sosMemoizeGlobal(n))memo++;
 for(const [n,l] of SOS_PERF_PROFILE_TARGETS)if(sosProfileGlobal(n,l))profile++;
 SOSRenderPerf.hooksInstalled={memo,profile,at:Date.now()};return SOSRenderPerf.hooksInstalled
}
function sosPerfRowsHTML(){
  const rows=Object.entries(SOSRenderPerf.screenStats).map(([name,s])=>({name,...s})).sort((a,b)=>(b.avg||0)-(a.avg||0));
  return rows.map(r=>`<div class="stat-row"><span>${esc(r.name)}</span><b>${(r.avg||0).toFixed(1)} ms avg • ${Math.round(r.last||0)} ms last • ${Math.round(r.max||0)} ms max</b></div>`).join('')||'<p class="muted">No profiled screens have been opened yet.</p>'
}
function sosPerformanceDiagnosticsText(){
  const stats=Object.entries(SOSRenderPerf.screenStats).map(([name,v])=>({name,...v})).sort((a,b)=>(b.avg||0)-(a.avg||0)),saveStats=SOSSavePolicy?.stats||{},hooks=SOSRenderPerf.hooksInstalled||{},cacheTotal=SOSRenderPerf.helperHits+SOSRenderPerf.helperMisses,cacheRate=cacheTotal?Math.round(SOSRenderPerf.helperHits/cacheTotal*100):0,loc=state?.world?.location&&typeof worldLocation==='function'?worldLocation(state.world.location):null,lines=[];
  if(state?.world)lines.push(`Day ${state.world.day}`);if(state)lines.push(`${fmt(state.gold)} gold`);if(loc?.name)lines.push(loc.name);
  lines.push('Performance Diagnostics','Session-only profiler','Screen & simulation timings');
  for(const r of stats)lines.push(`${r.name}\n${(r.avg||0).toFixed(1)} ms avg • ${Math.round(r.last||0)} ms last • ${Math.round(r.max||0)} ms max`);
  lines.push(`Profiler hooks: ${hooks.profile||0} timed operations • ${hooks.memo||0} memoized helpers`,`Current render memoization: ${SOSRenderPerf.helperHits} cache hits / ${SOSRenderPerf.helperMisses} misses${cacheTotal?` • ${cacheRate}% hit rate`:''}`,'Recent slow operations');
  if(SOSRenderPerf.lastSlow.length)for(const x of SOSRenderPerf.lastSlow)lines.push(`${x.name} — ${x.ms} ms\nDay ${x.day}`);else lines.push('No 40 ms+ screen builds recorded in this session.');
  lines.push('Save scheduler','Queued requests',String(saveStats.queued||0),'Important checkpoints',String(saveStats.important||0),'Critical checkpoints',String(saveStats.critical||0),'Actual storage flushes',String(saveStats.flushes||0));
  lines.push('Campaign storage',typeof indexedDB==='undefined'?'Browser storage fallback':SOSIndexedDBRuntime.failed?'IndexedDB recovery pending':'IndexedDB (uncompressed routine saves)',`IndexedDB reads: ${SOSIndexedDBRuntime.stats.reads} • writes: ${SOSIndexedDBRuntime.stats.writes} • migrated slots: ${SOSIndexedDBRuntime.stats.migrations} • failures: ${SOSIndexedDBRuntime.stats.failures} • recoveries: ${SOSIndexedDBRuntime.stats.recoveries} • fallback writes: ${SOSIndexedDBRuntime.stats.legacyWrites}`);
  if(typeof SOSNavigationLoopGuard!=='undefined'&&SOSNavigationLoopGuard.lastRecovery)lines.push('Last navigation-loop recovery',`Day ${SOSNavigationLoopGuard.lastRecovery.day} • ${SOSNavigationLoopGuard.lastRecovery.a} ↔ ${SOSNavigationLoopGuard.lastRecovery.b}`);
  return lines.join('\n')
}
function sosCopyText(text){
 const fallback=()=>{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}ta.remove();return ok};
 if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text).then(()=>true).catch(()=>fallback());return Promise.resolve(fallback())
}
function showPerformanceDiagnostics(){
  const slow=SOSRenderPerf.lastSlow.map(x=>`<div class="card compact"><b>${esc(x.name)}</b> — ${x.ms} ms<br><small>Day ${x.day}</small></div>`).join('')||'<p class="muted">No 40 ms+ screen builds recorded in this session.</p>';
  const saveStats=SOSSavePolicy?.stats||{},cacheTotal=SOSRenderPerf.helperHits+SOSRenderPerf.helperMisses,cacheRate=cacheTotal?Math.round(SOSRenderPerf.helperHits/cacheTotal*100):0,hooks=SOSRenderPerf.hooksInstalled||{};
  overlay(`<h2>Performance Diagnostics</h2><div class="notice compact"><b>Session-only profiler</b><br><small>Timings are not written into the campaign save. A screen or day-tick phase consistently above ~50 ms is a useful optimization target.</small></div><h3>Screen & simulation timings</h3><div class="card">${sosPerfRowsHTML()}</div><div class="card compact"><b>Profiler hooks:</b> ${hooks.profile||0} timed operations • ${hooks.memo||0} memoized helpers<br><b>Current render memoization:</b> ${SOSRenderPerf.helperHits} cache hits / ${SOSRenderPerf.helperMisses} misses${cacheTotal?` • ${cacheRate}% hit rate`:''}</div><h3>Recent slow operations</h3>${slow}<h3>Save scheduler</h3><div class="card"><div class="stat-row"><span>Queued requests</span><b>${saveStats.queued||0}</b></div><div class="stat-row"><span>Important checkpoints</span><b>${saveStats.important||0}</b></div><div class="stat-row"><span>Critical checkpoints</span><b>${saveStats.critical||0}</b></div><div class="stat-row"><span>Actual storage flushes</span><b>${saveStats.flushes||0}</b></div></div><div class="dialog-footer"><button id="perfDiagCopy">Quick Copy</button><button id="perfDiagReset">Reset Session Timings</button><button id="perfDiagBack">Back</button></div>`,true);
  $('#perfDiagCopy').onclick=async()=>{const b=$('#perfDiagCopy'),ok=await sosCopyText(sosPerformanceDiagnosticsText());if(b){b.textContent=ok?'Copied!':'Copy Failed';setTimeout(()=>{if(b.isConnected)b.textContent='Quick Copy'},1200)}};$('#perfDiagReset').onclick=()=>{SOSRenderPerf.screenStats={};SOSRenderPerf.lastSlow=[];showPerformanceDiagnostics()};$('#perfDiagBack').onclick=gameMenu
}

function sosPersistentStateSnapshot(){
 const W=typeof worldIntegrationState==='function'?worldIntegrationState():state.world?.worldIntegration||{},R=state.world?.travelerRegistry?.records||{},F=state.world?.factionSocial?.travelerInfluence||{},actors=W.actors||{},offers=W.workOffers||{},matters=W.matters||{},intel=W.intel||{},day=state.world?.day||0;
 const backing=typeof worldActorLiveBackingSets==='function'?worldActorLiveBackingSets():{parties:new Set((state.world?.parties||[]).map(p=>p.id)),travelers:new Set(Object.keys(R)),travelerPeople:new Set()},temporary=new Set(['world_party','traveler_group','traveler_person','party_member','reinforcement']);
 const actorRows=Object.values(actors),candidateRows=actorRows.filter(a=>{if(!a||!temporary.has(a.kind))return false;if(a.active===false)return true;if(a.kind==='world_party')return!backing.parties.has(a.id);if(a.kind==='traveler_group')return!backing.travelers.has(a.id);if(a.kind==='traveler_person')return!backing.travelerPeople.has(a.id);return false}),actorCandidateByType={},actorCandidateByAge={'0-6d':0,'7-29d':0,'30-44d':0,'45d+':0},actor45ByType={},actor45Retention={};
 const actorHasBacking=a=>a?.kind==='world_party'?backing.parties.has(a.id):a?.kind==='traveler_group'?backing.travelers.has(a.id):a?.kind==='traveler_person'?backing.travelerPeople.has(a.id):false;
 for(const a of candidateRows){actorCandidateByType[a.kind]=(actorCandidateByType[a.kind]||0)+1;const age=Math.max(0,day-(a.retiredDay||a.lastSeenDay||day)),bucket=age<7?'0-6d':age<30?'7-29d':age<45?'30-44d':'45d+';actorCandidateByAge[bucket]++;if(age>=45){actor45ByType[a.kind]=(actor45ByType[a.kind]||0)+1;let reason='other';if(a.active===false&&!actorHasBacking(a))reason='retired — awaiting lifecycle archive';else if(a.active===false&&actorHasBacking(a))reason='retired flag — live backing still present';else if(a.active!==false&&!actorHasBacking(a))reason='missing source — awaiting retirement';else reason='live backing / reference';actor45Retention[reason]=(actor45Retention[reason]||0)+1}}
 const influenceRows=Object.entries(F),orphanInfluence=influenceRows.filter(([id])=>!R[id]||R[id]?.locationStatus==='disbanded').length,offerRows=Object.values(offers),openOffers=offerRows.filter(w=>w.status==='open'),orphanOpenOffers=openOffers.filter(w=>typeof worldWorkOfferSourceStatus==='function'&&!worldWorkOfferSourceStatus(w).exists&&day-(w.createdDay||day)>14).length,matterRows=Object.values(matters),activeMatters=matterRows.filter(m=>m.status==='active'),oldActiveMatters=activeMatters.filter(m=>day-(m.createdDay||day)>90).length,intelRows=Object.values(intel),staleRows=intelRows.filter(i=>i.status==='stale'),intelBuckets={staleUnder30:0,stale30Persistent:0,stale30Referenced:0,stale30Eligible:0},refText=JSON.stringify({matters,offers,incidents:W.incidents||{},attention:W.attention||{},dispatches:W.dispatches||{}});
 for(const i of staleRows){const age=typeof worldIntelLifecycleAge==='function'?worldIntelLifecycleAge(i,day):day-(i.staleDay??i.updatedDay??i.createdDay??day),referenced=!!(i.id&&refText.includes(i.id));if(age<30)intelBuckets.staleUnder30++;else if(i.meta?.persistent)intelBuckets.stale30Persistent++;else if(referenced)intelBuckets.stale30Referenced++;else if(typeof worldIntelPruneEligible==='function'?worldIntelPruneEligible(i,day):age>=30)intelBuckets.stale30Eligible++}
 let approxBytes=0;try{approxBytes=JSON.stringify(state).length}catch(e){}
 return {day,travelers:Object.keys(R).length,parties:(state.world?.parties||[]).length,actors:actorRows.length,actorArchive:Object.keys(W.actorArchive||{}).length,orphanActors:candidateRows.length,actorCandidateByType,actorCandidateByAge,actor45ByType,actor45Retention,influence:influenceRows.length,orphanInfluence,matters:matterRows.length,activeMatters:activeMatters.length,oldActiveMatters,offers:offerRows.length,openOffers:openOffers.length,orphanOpenOffers,intel:intelRows.length,staleIntel:staleRows.length,intelBuckets,approxBytes,lastLifecycle:W.lifecycle?.lastReport||null}
}
function sosPersistentStateDiagnosticsText(){
 const s=sosPersistentStateSnapshot(),L=s.lastLifecycle||{};return [
  `Day ${s.day}`,'Persistent State Diagnostics',
  `Live travelers: ${s.travelers} • live world parties: ${s.parties}`,
  `World Integration actors: ${s.actors} • archived tombstones: ${s.actorArchive} • orphan/retired candidates: ${s.orphanActors}`,
  `Actor candidates by type: ${Object.entries(s.actorCandidateByType||{}).map(([k,v])=>`${k} ${v}`).join(' • ')||'none'}`,
  `Actor candidate ages: ${Object.entries(s.actorCandidateByAge||{}).map(([k,v])=>`${k} ${v}`).join(' • ')}`,
  `45d+ candidates by type: ${Object.entries(s.actor45ByType||{}).map(([k,v])=>`${k} ${v}`).join(' • ')||'none'}`,
  `45d+ retention: ${Object.entries(s.actor45Retention||{}).map(([k,v])=>`${k} ${v}`).join(' • ')||'none'}`,
  `Traveler political influence: ${s.influence} • orphan entries: ${s.orphanInfluence}`,
  `Matters: ${s.matters} • active: ${s.activeMatters} • active older than 90 days: ${s.oldActiveMatters}`,
  `Work offers: ${s.offers} • open: ${s.openOffers} • open with missing source (>14d): ${s.orphanOpenOffers}`,
  `Intel: ${s.intel} • stale: ${s.staleIntel}`,
  `Intel stale buckets: <30d ${s.intelBuckets?.staleUnder30||0} • ≥30d referenced ${s.intelBuckets?.stale30Referenced||0} • persistent ${s.intelBuckets?.stale30Persistent||0} • eligible ${s.intelBuckets?.stale30Eligible||0}`,
  `Approx. uncompressed state: ${(s.approxBytes/1024/1024).toFixed(2)} MB`,
  'Last lifecycle maintenance',
  L.day?`Day ${L.day} • ${L.total||0} changes • ${L.travelerInfluenceRemoved||0} traveler influence removed • ${L.actorsRetired||0} actors retired • ${L.offersReconciled||0} offers reconciled • ${L.mattersReconciled||0} matters reconciled • ${L.intelPruned||0} intel pruned`:'Not yet run in this campaign session.'
 ].join('\n')
}
function showPersistentStateDiagnostics(){
 const s=sosPersistentStateSnapshot(),L=s.lastLifecycle||{};
 overlay(`<h2>Persistent State Diagnostics</h2><div class="notice compact"><b>Long-campaign state health</b><br><small>These counts identify registries that can grow as the campaign ages. Lifecycle maintenance preserves live gameplay state while retiring obsolete mirrors and short-lived records.</small></div><div class="card"><div class="stat-row"><span>Live traveler groups</span><b>${s.travelers}</b></div><div class="stat-row"><span>Live world parties</span><b>${s.parties}</b></div><div class="stat-row"><span>World Integration actors</span><b>${s.actors}</b></div><div class="stat-row"><span>Archived actor tombstones</span><b>${s.actorArchive}</b></div><div class="stat-row"><span>Orphan / retired actor candidates</span><b>${s.orphanActors}</b></div><div class="stat-row"><span>Actor candidates by type</span><b>${esc(Object.entries(s.actorCandidateByType||{}).map(([k,v])=>`${k} ${v}`).join(' • ')||'none')}</b></div><div class="stat-row"><span>Actor candidate ages</span><b>${esc(Object.entries(s.actorCandidateByAge||{}).map(([k,v])=>`${k} ${v}`).join(' • '))}</b></div><div class="stat-row"><span>45d+ candidates by type</span><b>${esc(Object.entries(s.actor45ByType||{}).map(([k,v])=>`${k} ${v}`).join(' • ')||'none')}</b></div><div class="stat-row"><span>45d+ retention reasons</span><b>${esc(Object.entries(s.actor45Retention||{}).map(([k,v])=>`${k} ${v}`).join(' • ')||'none')}</b></div><div class="stat-row"><span>Traveler political influence</span><b>${s.influence}</b></div><div class="stat-row"><span>Orphan influence entries</span><b>${s.orphanInfluence}</b></div><div class="stat-row"><span>World matters</span><b>${s.matters} • ${s.activeMatters} active</b></div><div class="stat-row"><span>Active matters older than 90 days</span><b>${s.oldActiveMatters}</b></div><div class="stat-row"><span>World work offers</span><b>${s.offers} • ${s.openOffers} open</b></div><div class="stat-row"><span>Open offers missing source (&gt;14 days)</span><b>${s.orphanOpenOffers}</b></div><div class="stat-row"><span>World intel</span><b>${s.intel} • ${s.staleIntel} stale</b></div><div class="stat-row"><span>Stale intel &lt;30 days</span><b>${s.intelBuckets?.staleUnder30||0}</b></div><div class="stat-row"><span>Stale intel ≥30d referenced / persistent / eligible</span><b>${s.intelBuckets?.stale30Referenced||0} / ${s.intelBuckets?.stale30Persistent||0} / ${s.intelBuckets?.stale30Eligible||0}</b></div><div class="stat-row"><span>Approx. uncompressed campaign state</span><b>${(s.approxBytes/1024/1024).toFixed(2)} MB</b></div></div><h3>Last lifecycle maintenance</h3><div class="card compact">${L.day?`Day ${L.day} • <b>${L.total||0}</b> changes<br>${L.travelerInfluenceRemoved||0} orphan traveler influence • ${L.actorsRetired||0} retired actors • ${L.offersReconciled||0} work offers reconciled • ${L.mattersReconciled||0} matters reconciled • ${L.offersPruned||0} archived offers pruned • ${L.mattersPruned||0} archived matters pruned • ${L.intelPruned||0} stale intel pruned`:'Lifecycle maintenance has not run yet in this campaign session.'}</div><div class="dialog-footer"><button id="persistentDiagRun">Run Maintenance Now</button><button id="persistentDiagCopy">Quick Copy</button><button id="persistentDiagBack">Back</button></div>`,true);
 $('#persistentDiagRun').onclick=()=>{if(typeof worldIntegrationLifecycleMaintenance==='function')worldIntegrationLifecycleMaintenance(true);showPersistentStateDiagnostics()};
 $('#persistentDiagCopy').onclick=async()=>{const b=$('#persistentDiagCopy'),ok=await sosCopyText(sosPersistentStateDiagnosticsText());if(b){b.textContent=ok?'Copied!':'Copy Failed';setTimeout(()=>{if(b.isConnected)b.textContent='Quick Copy'},1200)}};
 $('#persistentDiagBack').onclick=gameMenu
}
// Add diagnostics without changing ordinary screen layout or generating save activity.
const _sosGameMenu16227=window.gameMenu;
if(typeof _sosGameMenu16227==='function')window.gameMenu=function(...args){
  const out=_sosGameMenu16227.apply(this,args),settings=document.querySelector('#settings');
  if(settings&&!document.querySelector('#perfDiag')){const b=document.createElement('button');b.id='perfDiag';b.textContent='Performance Diagnostics';settings.parentNode.insertBefore(b,settings);b.onclick=showPerformanceDiagnostics}
  if(settings&&!document.querySelector('#persistentDiag')){const b=document.createElement('button');b.id='persistentDiag';b.textContent='Persistent State Diagnostics';settings.parentNode.insertBefore(b,settings);b.onclick=showPersistentStateDiagnostics}
  return out
};

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
 const warnings=[],loadPerf=(name,fn)=>typeof sosPerfRun==='function'?sosPerfRun(name,fn):fn();
 // Work on a fresh object so a failed compatibility pass cannot damage the parsed source.
 state=loadPerf('Campaign Load — Clone State',()=>JSON.parse(JSON.stringify(candidate)));if(state.mode==='siege')state.mode='legacy_siege';combat=null;townNavStack=[];townNavCurrent=null;townNavRestoring=false;
 const compacted=loadPerf('Campaign Load — Initial Sanitize',()=>sanitizeLoadedCampaignState());if(compacted)warnings.push(SOSText("core_town_save_load.prepareLoadedCampaign.001",compacted,compacted===1?'':'s'));
 if(typeof migrateCumulativeXpModel==='function'&&migrateCumulativeXpModel())warnings.push('Advancement XP converted to cumulative progression without changing Guardian level.');
 if(migrateLegacyWeaponInstance())warnings.push(SOSText("core_town_save_load.prepareLoadedCampaign.002"));
 const integrity=guardianClassIntegrity(state,true);
 try{loadPerf('Campaign Load — Normalize',()=>normalize())}catch(e){
   console.warn(SOSText("core_town_save_load.prepareLoadedCampaign.003"),e);
   warnings.push(SOSText("core_town_save_load.prepareLoadedCampaign.004",e?.message||String(e)));
   sanitizeLoadedCampaignState();
   if(state.mode==='openworld')ensureWorldState();
   loadPerf('Campaign Load — Normalize Recovery',()=>normalize())
 }
 if(integrity.repaired){log(SOSText("core_town_save_load.prepareLoadedCampaign.005",integrity.historical),'info');chronicle(SOSText("core_town_save_load.prepareLoadedCampaign.006"),integrity.reason,'event')}
 if(state.mode==='openworld'){
   ensureWorldState();
   if(!validWorldLocationId(state.world.location)){state.world.location='shantium';state.world.region='shantium';warnings.push(SOSText("core_town_save_load.prepareLoadedCampaign.007"))}
   // These are compatibility/cleanup systems, not prerequisites for opening the campaign.
   // A bug in one must never make Continue behave like a dead button.
   safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.008"),()=>loadPerf('Campaign Load — Open World Repair',()=>repairOpenWorldState()),warnings);
   loadPerf('Campaign Load — Compatibility Repairs',()=>{safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.009"),()=>repairPreBeyondIntegrity(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.010"),()=>repairGeneratedGroupGrammar(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.011"),()=>repairPursuitState(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.012"),()=>repairFactionSecurityResponseState(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.013"),()=>repairLongCampaignSimulationState(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.014"),()=>repairPendingWorldLifeTravel(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.015"),()=>repairGuardianPublicEndorsement(),warnings);safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.016"),()=>repairLocalPoliticsState(),warnings);
   safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.017"),()=>repairEscortContracts(),warnings);
   safeLoadRepair(SOSText("core_town_save_load.prepareLoadedCampaign.018"),()=>repairActiveContractParties(),warnings)});
   loadPerf('Campaign Load — Final Sanitize',()=>sanitizeLoadedCampaignState());
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
   add('primary',sosStorageRaw(saveKeyForMode(wanted)));
   add(SOSText("core_town_save_load.campaignLoadCandidates.001"),sosStorageRaw(backupKeyForMode(wanted)));
   add(SOSText("core_town_save_load.campaignLoadCandidates.002"),localStorage.getItem(SAVE_KEY));
 }else{
   add(SOSText("core_town_save_load.campaignLoadCandidates.003"),localStorage.getItem(SAVE_KEY))
 }
 return out
}
function load(mode=null){
 migrateLegacySaveSlots();migrateSiegeModeSplit();lastLoadFailure=null;
 const candidates=campaignLoadCandidates(mode);
 if(!candidates.length){lastLoadFailure=SOSText("core_town_save_load.load.001");return false}
 for(const candidate of candidates){
   try{
     const loadPerf=(name,fn)=>typeof sosPerfRun==='function'?sosPerfRun(name,fn):fn();
     const warnings=loadPerf('Campaign Load — Prepare Campaign',()=>prepareLoadedCampaign(candidate.state));
     const recovered=candidate.source!=='primary';
     if(recovered)log(SOSText("core_town_save_load.load.002",candidate.source),'info');
     if(warnings.length)log(SOSText("core_town_save_load.load.003"),'info');
     const persisted=loadPerf('Campaign Load — Post-load Save',()=>save());
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
 const target=mode==='openworld'?'openworld':mode==='siege2'?'siege2':(['legacy_siege','siege'].includes(mode)?'legacy_siege':null);
 if(target){localStorage.removeItem(saveKeyForMode(target));localStorage.removeItem(backupKeyForMode(target));sosIDBDelete(saveKeyForMode(target));sosIDBDelete(backupKeyForMode(target))}
 else{for(const k of [SAVE_OPEN_WORLD_KEY,SAVE_OPEN_WORLD_BACKUP_KEY,SAVE_LEGACY_SIEGE_KEY,SAVE_LEGACY_SIEGE_BACKUP_KEY,SAVE_SIEGE_II_KEY,SAVE_SIEGE_II_BACKUP_KEY]){localStorage.removeItem(k);sosIDBDelete(k)}}
 const mirror=parseStoredCampaign(SAVE_KEY);if(!target||!mirror||campaignModeOf(mirror)===target)localStorage.removeItem(SAVE_KEY);
 localStorage.setItem(SAVE_SLOT_MIGRATION_KEY,'1');localStorage.setItem(SAVE_SIEGE_SPLIT_MIGRATION_KEY,'1')
}
const FORCE_OBJECTIVES={
 assault:{name:SOSText("core_town_save_load.clearSave.001"),desc:SOSText("core_town_save_load.clearSave.002"),move:1},
 raid:{name:SOSText("core_town_save_load.clearSave.003"),desc:SOSText("core_town_save_load.clearSave.004"),move:1},
 scout:{name:SOSText("core_town_save_load.clearSave.005"),desc:SOSText("core_town_save_load.clearSave.006"),move:2},
 engineer:{name:SOSText("core_town_save_load.clearSave.007"),desc:SOSText("core_town_save_load.clearSave.008"),move:1},
 reinforce:{name:SOSText("core_town_save_load.clearSave.009"),desc:SOSText("core_town_save_load.clearSave.010"),move:1},
 command:{name:SOSText("core_town_save_load.clearSave.011"),desc:SOSText("core_town_save_load.clearSave.012"),move:1}
};
