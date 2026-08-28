/* v1.5.25 — Shared World Foundations
   Canonical cross-system records are intentionally additive in this release.
   Existing gameplay systems remain authoritative while they are migrated in
   v1.5.25.x, but new work should link through these records/services. */
function defaultWorldIntegrationState(){
 return {schemaVersion:3,actors:{},matters:{},effects:[],attention:{},dispatches:{},intel:{},incidents:{},workOffers:{},resources:{history:[]},accounts:{},accommodation:{stays:[]},transactions:[],history:[],consolidation:{lastDay:0,history:[],settlementChecks:{}}}
}
function ensureWorldIntegrationState(world=state?.world){
 if(!world)return defaultWorldIntegrationState();
 const d=defaultWorldIntegrationState(),x=world.worldIntegration;
 if(!x||typeof x!=='object'||Array.isArray(x))world.worldIntegration=d;
 const W=world.worldIntegration;
 for(const k of ['actors','matters','attention','dispatches','intel','incidents','workOffers','resources','accounts','accommodation'])if(!W[k]||typeof W[k]!=='object'||Array.isArray(W[k]))W[k]={};if(!Array.isArray(W.resources.history))W.resources.history=[];if(!Array.isArray(W.accommodation.stays))W.accommodation.stays=[];
 for(const k of ['effects','transactions','history'])if(!Array.isArray(W[k]))W[k]=[];
 if(!W.consolidation||typeof W.consolidation!=='object')W.consolidation={lastDay:0,history:[],settlementChecks:{}};
 if(!Array.isArray(W.consolidation.history))W.consolidation.history=[];if(!W.consolidation.settlementChecks||typeof W.consolidation.settlementChecks!=='object')W.consolidation.settlementChecks={};
 W.schemaVersion=Math.max(3,Number(W.schemaVersion)||1);world.consolidation=W.consolidation;return W
}
function worldIntegrationState(){ensureWorldState();return ensureWorldIntegrationState(state.world)}
function worldRecordId(prefix='record'){return `${prefix}_${uid()}`}
function worldActorRef(kind,id,opts={}){
 if(!kind||!id)return null;const key=`${kind}:${id}`,W=worldIntegrationState();let a=W.actors[key];
 if(!a)a=W.actors[key]={key,kind,id,name:opts.name||'',createdDay:state.world.day,lastSeenDay:state.world.day,active:true,meta:{}};
 if(opts.name)a.name=opts.name;if(opts.location!==undefined)a.location=opts.location;if(opts.active!==undefined)a.active=!!opts.active;if(opts.meta)Object.assign(a.meta,opts.meta);a.lastSeenDay=state.world.day;return a
}
function resolveWorldActor(ref){if(!ref)return null;const key=typeof ref==='string'?ref:ref.key||`${ref.kind}:${ref.id}`;return worldIntegrationState().actors[key]||null}
function syncWorldActorRegistry(){
 if(!isOpenWorld())return 0;const W=worldIntegrationState(),seen=new Set(),mark=(kind,id,opts={})=>{if(!id)return null;const a=worldActorRef(kind,id,opts);if(a)seen.add(a.key);return a};let n=0;
 mark('guardian','guardian',{name:SOSText("world_integration_foundations.syncWorldActorRegistry.001"),location:state.world.location,meta:{level:state.level,class:guardianClass?.()||null}});
 for(const m of Object.values(state.party?.members||{}))if(m?.id){mark('companion',m.id,{name:m.name,location:state.world.captiveCompanions?.[m.id]?.location||state.world.location,active:m.hp!==undefined,meta:{class:m.class||null,activeParty:state.party.active?.includes(m.id)||false}});n++}
 for(const p of state.world.parties||[]){const a=mark('world_party',p.id,{name:p.name,location:p.location,meta:{kind:p.kind,faction:p.faction,travelerId:p.travelerId||null,memberCount:p.memberCount||null,combatantCount:p.combatantCount||null}});if(a)p.actorRef=a.key;n++}
 const R=state.world.travelerRegistry?.records||{};for(const r of Object.values(R)){const i=ensureTravelerRecordIdentity(r,activePartyForTraveler(r));const g=mark('traveler_group',r.id,{name:i?.groupName||r.name,location:r.settledAt||r.lastKnownLocation||null,active:r.locationStatus!=='disbanded',meta:{kind:r.kind,faction:r.faction}});if(g)r.actorRef=g.key;for(const m of i?.members||[]){const a=mark('traveler_person',m.id,{name:m.name,location:m.dependentPlacement?.location||m.currentLocation||r.settledAt||r.lastKnownLocation||null,active:m.status!=='dead',meta:{groupId:r.id,groupName:i.groupName,role:m.role,age:m.age,status:m.status||'active'}});if(a)m.actorRef=a.key;n++}}
 const h=state.world.homeBase;if(h){const staff=[['steward',h.staff?.steward],['logistics',h.logistics?.master],['headguard',h.security?.headGuard],['economic',h.business?.adviser]];for(const [role,s] of staff)if(s?.name){const id=s.actorId||`hall_${role}_${String(s.id||s.candidateId||s.name).toLowerCase().replace(/[^a-z0-9]+/g,'_')}`;s.actorId=id;const a=mark('hall_staff',id,{name:s.name,location:'shantium',active:true,meta:{role,competence:s.competence||null,salary:s.salary||null,employedAtHall:true}});if(a)s.actorRef=a.key;n++}}
 if(typeof SETTLEMENT_NPCS!=='undefined')for(const [home,list] of Object.entries(SETTLEMENT_NPCS||{}))for(const npc of list||[]){const loc=typeof currentNpcLocation==='function'?currentNpcLocation(npc.id,home):home;mark('settlement_npc',npc.id,{name:npc.name,location:loc,active:typeof politicalNpcDead==='function'?!politicalNpcDead(npc.id):true,meta:{role:npc.role||'',home}});n++}
 for(const loc of regionalSettlements())if(typeof politicalSettlement==='function'){const ps=politicalSettlement(loc.id),leader=ps?.leader;if(leader)mark('authority',`authority_${loc.id}`,{name:leader,location:loc.id,active:true,meta:{settlement:loc.id,control:typeof settlementControl==='function'?settlementControl(loc.id):null}})}
 for(const a of Object.values(W.actors))if(a.kind==='hall_staff'&&!seen.has(a.key)){a.active=false;a.meta=a.meta||{};a.meta.employedAtHall=false;a.lastSeenDay=state.world.day}
 return n
}
function worldResourceSourceLabel(source){
 const labels={guardian_inventory:SOSText("world_integration_foundations.worldResourceSourceLabel.001"),cargo:SOSText("world_integration_foundations.worldResourceSourceLabel.002"),hall_items:SOSText("world_integration_foundations.worldResourceSourceLabel.003"),hall_trade:SOSText("world_integration_foundations.worldResourceSourceLabel.004")};if(labels[source])return labels[source];if(String(source).startsWith('property:'))return SOSText("world_integration_foundations.worldResourceSourceLabel.005",worldLocation(String(source).slice(9)).name);return source
}
function worldResourceSources(kind,id,locId=state.world.location,opts={}){
 if(!isOpenWorld())return[];ensureWorldState();const rows=[],add=(source,qty,accessible=true,meta={})=>{qty=Math.max(0,Number(qty)||0);if(qty>0)rows.push({source,label:worldResourceSourceLabel(source),qty,accessible:!!accessible,...meta})};
 if(kind==='trade'){
  add('cargo',state.world.cargo?.[id]||0,true,{location:locId});
  if(state.world.homeBase?.tradeGoods)add('hall_trade',state.world.homeBase.tradeGoods[id]||0,locId==='shantium'||opts.includeRemote,{location:'shantium'});
  if(typeof ownedProperty==='function'&&typeof propertyStorage==='function')for(const pid of Object.keys(state.world.economy?.properties||{}))add(`property:${pid}`,propertyStorage(pid)?.[id]||0,pid===locId||opts.includeRemote,{location:pid});
 }else if(kind==='item'){
  add('guardian_inventory',state.guardian.inventory?.find(x=>x.id===id)?.qty||0,true,{location:locId});
  if(state.world.homeBase?.storage)add('hall_items',state.world.homeBase.storage.find(x=>x.id===id)?.qty||0,locId==='shantium'||opts.includeRemote,{location:'shantium'});
 }
 return rows
}
function worldResourceCount(kind,id,locId=state.world.location,opts={}){return worldResourceSources(kind,id,locId,opts).filter(x=>x.accessible).reduce((n,x)=>n+x.qty,0)}
function worldResourceAudit(kind,id,qty,breakdown,context={}){const W=worldIntegrationState();W.resources.history.push({id:worldRecordId('resource'),day:state.world.day,location:state.world.location,kind,resourceId:id,qty,breakdown:{...breakdown},context:{...context}});W.resources.history=W.resources.history.slice(-120)}
function worldResourceConsume(kind,id,qty=1,opts={}){
 qty=Math.max(1,Math.round(Number(qty)||1));const locId=opts.location||state.world.location;if(worldResourceCount(kind,id,locId)<qty)return null;let left=qty,breakdown={};
 const order=opts.order||(kind==='trade'?['cargo','hall_trade',`property:${locId}`]:['guardian_inventory','hall_items']);
 for(const source of order){if(left<=0)break;let have=0,take=0;
  if(kind==='trade'&&source==='cargo'){have=state.world.cargo?.[id]||0;take=Math.min(have,left);if(take){state.world.cargo[id]=have-take;left-=take}}
  else if(kind==='trade'&&source==='hall_trade'&&locId==='shantium'){ensureHomeBase();have=state.world.homeBase.tradeGoods?.[id]||0;take=Math.min(have,left);if(take){state.world.homeBase.tradeGoods[id]=have-take;if(state.world.homeBase.tradeGoods[id]<=0)delete state.world.homeBase.tradeGoods[id];left-=take}}
  else if(kind==='trade'&&source.startsWith('property:')){const pid=source.slice(9);if(pid!==locId)continue;const s=propertyStorage(pid);have=s[id]||0;take=Math.min(have,left);if(take){s[id]=have-take;left-=take}}
  else if(kind==='item'&&source==='guardian_inventory'){have=state.guardian.inventory?.find(x=>x.id===id)?.qty||0;take=Math.min(have,left);if(take){invRemove(id,take);left-=take}}
  else if(kind==='item'&&source==='hall_items'&&locId==='shantium'){ensureHomeBase();const s=state.world.homeBase.storage.find(x=>x.id===id);have=s?.qty||0;take=Math.min(have,left);if(take){s.qty-=take;if(s.qty<=0)state.world.homeBase.storage=state.world.homeBase.storage.filter(x=>x!==s);left-=take}}
  if(take)breakdown[source]=(breakdown[source]||0)+take
 }
 if(left>0)return null;worldResourceAudit(kind,id,qty,breakdown,opts.context||{});return{kind,id,qty,location:locId,breakdown,fromHall:(breakdown.hall_trade||0)+(breakdown.hall_items||0),fromProperty:Object.entries(breakdown).filter(([k])=>k.startsWith('property:')).reduce((n,[,v])=>n+v,0)}
}
function worldResourceTransfer(kind,id,qty,from,to,opts={}){
 qty=Math.max(1,Math.round(Number(qty)||1));const locId=opts.location||state.world.location,allowed=(src)=>src==='cargo'||src==='guardian_inventory'||(src==='hall_trade'||src==='hall_items'?locId==='shantium':src.startsWith('property:')&&src.slice(9)===locId);if(!allowed(from)||!allowed(to))return false;
 const exact=worldResourceConsume(kind,id,qty,{location:locId,order:[from],context:{type:'transfer',to}});if(!exact)return false;let ok=false;
 if(kind==='trade'&&to==='cargo'){state.world.cargo[id]=(state.world.cargo[id]||0)+qty;ok=true}
 else if(kind==='trade'&&to==='hall_trade'){ok=homeStoreTradeGood(id,qty)}
 else if(kind==='trade'&&to.startsWith('property:')){const pid=to.slice(9),s=propertyStorage(pid);if(storedCargoCount(pid)+qty<=propertyCapacity(pid)){s[id]=(s[id]||0)+qty;ok=true}}
 else if(kind==='item'&&to==='guardian_inventory'){invAdd(id,qty);ok=true}
 else if(kind==='item'&&to==='hall_items'){ok=homeReceiveStoredItem(id,qty)}
 if(!ok){if(kind==='trade'&&from==='cargo')state.world.cargo[id]=(state.world.cargo[id]||0)+qty;else if(kind==='trade'&&from==='hall_trade')homeStoreTradeGood(id,qty);else if(kind==='trade'&&from.startsWith('property:')){const s=propertyStorage(from.slice(9));s[id]=(s[id]||0)+qty}else if(kind==='item'&&from==='guardian_inventory')invAdd(id,qty);else if(kind==='item'&&from==='hall_items')homeReceiveStoredItem(id,qty);return false}
 return true
}
function worldAccountBalance(accountId){if(accountId==='guardian')return Math.max(0,state.gold||0);if(accountId==='hall'){ensureHomeBase();return Math.max(0,state.world.homeBase.logistics.budget||0)}return 0}
function worldAccountRecord(type,amount,opts={}){const W=worldIntegrationState(),n=Math.max(0,Math.round(Number(amount)||0)),x={id:worldRecordId('txn'),day:state.world.day,location:opts.location??state.world.location,type,amount:n,from:opts.from||null,to:opts.to||null,category:opts.category||SOSText("world_integration_foundations.worldAccountRecord.001"),text:opts.text||'',source:opts.source||null};W.transactions.push(x);W.transactions=W.transactions.slice(-240);return x}
function worldAccountCredit(accountId,amount,opts={}){amount=Math.max(0,Math.round(Number(amount)||0));if(!amount)return 0;if(accountId==='guardian'){state.gold+=amount;if(opts.earned)meta.goldEarned=(meta.goldEarned||0)+amount}else if(accountId==='hall'){ensureHomeBase();state.world.homeBase.logistics.budget+=amount}else return 0;worldAccountRecord(opts.type||'credit',amount,{...opts,from:opts.sourceAccount||opts.from||'external',to:accountId});return amount}
function worldAccountDebit(accountId,amount,opts={}){amount=Math.max(0,Math.round(Number(amount)||0));if(!amount)return true;if(worldAccountBalance(accountId)<amount)return false;if(accountId==='guardian')state.gold-=amount;else if(accountId==='hall')state.world.homeBase.logistics.budget-=amount;worldAccountRecord(opts.type||'debit',amount,{...opts,from:accountId,to:opts.toAccount||opts.to||'external'});return true}
function worldAccountTransfer(from,to,amount,opts={}){amount=Math.max(0,Math.round(Number(amount)||0));if(!amount||worldAccountBalance(from)<amount)return false;if(from==='guardian')state.gold-=amount;else if(from==='hall')state.world.homeBase.logistics.budget-=amount;else return false;if(to==='guardian')state.gold+=amount;else if(to==='hall')state.world.homeBase.logistics.budget+=amount;else return false;worldAccountRecord('transfer',amount,{...opts,from,to});return true}
function worldAccountsSnapshot(){return{guardian:worldAccountBalance('guardian'),hall:state.world?.homeBase?worldAccountBalance('hall'):0,recent:worldIntegrationState().transactions.slice(-12).reverse()}}
function worldAccommodationProvider(locId=state.world.location,kind='local',size=1,opts={}){
 size=Math.max(1,Math.round(Number(size)||1));const settlement=!!state.world?.settlements?.[locId],loc=worldLocation(locId);
 if(kind==='hall'){if(locId!=='shantium'||typeof homeLodgingOfferState!=='function')return{id:'guardian_hall',kind,locId,size,canOffer:false,reason:'location'};const s=homeLodgingOfferState(size);return{id:'guardian_hall',kind,locId,size,name:SOSText("world_integration_foundations.worldAccommodationProvider.001"),cost:0,canOffer:s.canOffer,available:s.available,total:s.total,after:s.after,supplyOK:s.supplyOK,detail:homeLodgingOfferDetail(size)}}
 if(kind==='inn'){if(!settlement||typeof settlementServiceAvailable!=='function'||!settlementServiceAvailable(locId))return{id:`inn:${locId}`,kind,locId,size,canOffer:false};const base=locId==='southroad'?14:locId==='redoubt'?28:20,cost=settlementServicePrice(locId,base);return{id:`inn:${locId}`,kind,locId,size,name:settlementServiceName(locId),cost,canOffer:true,detail:SOSText("world_integration_foundations.worldAccommodationProvider.002",cost)}}
 if(kind==='referral'){return{id:`lodging:${locId}`,kind,locId,size,name:SOSText("world_integration_foundations.worldAccommodationProvider.003",loc.name),cost:0,canOffer:settlement,detail:SOSText("world_integration_foundations.worldAccommodationProvider.004",loc.name)}}
 return{id:`lodging:${locId}`,kind,locId,size,canOffer:false}
}
function worldAccommodationProviders(locId=state.world.location,size=1,purpose='visitor'){const rows=[];if(locId==='shantium'&&purpose!=='player')rows.push(worldAccommodationProvider(locId,'hall',size));rows.push(worldAccommodationProvider(locId,purpose==='player'?'inn':'referral',size));return rows.filter(Boolean)}
function worldAccommodationRecord(provider,opts={}){const W=worldIntegrationState(),p=typeof provider==='string'?{id:provider,kind:provider,locId:opts.locId||state.world.location}:provider,x={id:worldRecordId('stay'),day:state.world.day,providerId:p.id,providerKind:p.kind,location:p.locId||state.world.location,name:opts.name||'',size:opts.size||p.size||1,purpose:opts.purpose||'lodging',days:opts.days||1,cost:opts.cost??p.cost??0,sourceId:opts.sourceId||null};W.accommodation.stays.push(x);W.accommodation.stays=W.accommodation.stays.slice(-120);return x}
function worldAccountsSummaryHTML(){const s=worldAccountsSnapshot();return `<div class="notice compact"><b>${SOSText("world_integration_foundations.worldAccountsSummaryHTML.001")}</b><br>${SOSText("world_integration_foundations.worldAccountsSummaryHTML.002",s.guardian,s.hall)}</div>${s.recent.length?`<div class="account-transaction-list">${s.recent.slice(0,6).map(x=>`<div class="stat-row"><span>Day ${x.day}: ${esc(x.text||x.category)}</span><b>${x.type==='credit'?'+':x.type==='debit'?'-':'↔'}${x.amount}g</b></div>`).join('')}</div>`:''}`}
function createWorldMatter(type,opts={}){
 const W=worldIntegrationState(),id=opts.id||worldRecordId('matter');if(W.matters[id])return W.matters[id];
 return W.matters[id]={id,type:type||'general',title:opts.title||'',location:opts.location||null,region:opts.region||(opts.location?locationRegion(opts.location):null),status:opts.status||'active',severity:clamp(Number(opts.severity)||1,1,5),createdDay:opts.createdDay||state.world.day,updatedDay:state.world.day,source:opts.source||null,actors:[...(opts.actors||[])],links:{...(opts.links||{})},progress:Number(opts.progress)||0,meta:{...(opts.meta||{})}}
}
function worldMatterForSettlementProblem(locId,p=null){
 p=p||settlementProblem(locId)||state.world?.settlementProblems?.[locId];if(!p)return null;const W=worldIntegrationState();if(p.matterId&&W.matters[p.matterId])return W.matters[p.matterId];
 const prior=Object.values(W.matters).find(m=>m.links?.settlementProblemId===p.id&&m.location===locId);if(prior){p.matterId=prior.id;return prior}
 const m=createWorldMatter(`settlement:${p.type}`,{title:p.title,location:locId,region:locationRegion(locId),severity:clamp(1+Math.floor((3-Math.min(3,p.progress||0))/1.5),1,5),createdDay:p.startedDay||state.world.day,source:'settlement_problem',progress:p.progress||0,links:{settlementProblemId:p.id},meta:{problemType:p.type,kind:p.kind,expiresDay:p.expiresDay}});p.matterId=m.id;return m
}
function worldMatterForRegionalThread(thread){
 if(!thread)return null;const W=worldIntegrationState();if(thread.matterId&&W.matters[thread.matterId])return W.matters[thread.matterId];const locId=thread.to||thread.from||null;
 const prior=Object.values(W.matters).find(m=>m.links?.regionalThreadId===thread.id);if(prior){thread.matterId=prior.id;return prior}
 const type=thread.kind==='supply'?'regional:supply':thread.kind==='security'?'regional:security':thread.kind==='displacement'?'regional:displacement':'regional:issue',m=createWorldMatter(type,{title:thread.title||thread.text||SOSText("world_integration_foundations.worldMatterForRegionalThread.001"),location:locId,region:locId?locationRegion(locId):currentWorldRegion(),severity:2,createdDay:thread.createdDay||state.world.day,source:'regional_thread',links:{regionalThreadId:thread.id},meta:{threadKind:thread.kind,from:thread.from||null,to:thread.to||null}});thread.matterId=m.id;return m
}
function syncSettlementProblemMatter(locId,p=null){
 p=p||state.world?.settlementProblems?.[locId];if(!p)return null;const m=worldMatterForSettlementProblem(locId,p);if(!m)return null;m.title=p.title;m.location=locId;m.region=locationRegion(locId);m.progress=p.progress||0;m.updatedDay=state.world.day;m.meta={...(m.meta||{}),problemType:p.type,kind:p.kind,expiresDay:p.expiresDay};
 if(p.status==='active')m.status='active';else{m.status=p.status==='resolved'?'resolved':p.status||'closed';m.resolvedDay=p.resolvedDay||state.world.day;m.resolution=p.outcome||m.resolution||'';for(const w of Object.values(worldIntegrationState().workOffers))if(w.matterId===m.id&&w.status==='open'){w.status=m.status==='resolved'?'completed':'closed';w.resolvedDay=state.world.day}}
 return m
}
function createWorldWorkOffer(matterId,channel,sourceId,opts={}){
 const W=worldIntegrationState(),m=W.matters[matterId];if(!m)return null;const stable=opts.id||`${channel}:${sourceId}`;let w=W.workOffers[stable];if(!w)w=W.workOffers[stable]={id:stable,matterId,channel,sourceId,status:opts.status||'open',title:opts.title||m.title,location:opts.location??m.location,createdDay:opts.createdDay||state.world.day,updatedDay:state.world.day,links:{},meta:{}};
 w.matterId=matterId;w.channel=channel;w.sourceId=sourceId;w.title=opts.title||w.title||m.title;w.location=opts.location??w.location??m.location;if(opts.status)w.status=opts.status;if(opts.expiresDay!==undefined)w.expiresDay=opts.expiresDay;if(opts.links)Object.assign(w.links,opts.links);if(opts.meta)Object.assign(w.meta,opts.meta);w.updatedDay=state.world.day;m.links=m.links||{};m.links.workOffers=m.links.workOffers||[];if(!m.links.workOffers.includes(w.id))m.links.workOffers.push(w.id);return w
}
function updateWorldWorkOffer(id,patch={}){const w=worldIntegrationState().workOffers[id];if(!w)return null;Object.assign(w,patch);w.updatedDay=state.world.day;if(['completed','expired','declined','superseded','closed'].includes(w.status)&&!w.resolvedDay)w.resolvedDay=state.world.day;return w}
function activeWorldWorkOffers(matterId=null){return Object.values(worldIntegrationState().workOffers).filter(w=>w.status==='open'&&(!matterId||w.matterId===matterId))}
function worldMatterChannelLabel(matterId,currentChannel=''){
 const m=worldIntegrationState().matters[matterId];if(!m)return'';const offers=activeWorldWorkOffers(matterId),labels={townlife:SOSText("world_integration_foundations.worldMatterChannelLabel.001"),regional_opportunity:SOSText("world_integration_foundations.worldMatterChannelLabel.002"),contract:SOSText("world_integration_foundations.worldMatterChannelLabel.003"),correspondence:SOSText("world_integration_foundations.worldMatterChannelLabel.004")},other=[...new Set(offers.map(w=>labels[w.channel]||w.channel).filter(Boolean))];
 return SOSText("world_integration_foundations.worldMatterChannelLabel.005",esc(m.title),other.length?SOSText("world_integration_foundations.worldMatterChannelLabel.006",esc(other.join(' • '))):'',currentChannel&&offers.some(w=>w.channel!==currentChannel)?SOSText("world_integration_foundations.worldMatterChannelLabel.007"):'')
}
function linkSettlementProblemChannel(locId,channel,sourceId,opts={}){const p=settlementProblem(locId)||state.world?.settlementProblems?.[locId];if(!p)return null;const m=syncSettlementProblemMatter(locId,p);return m?createWorldWorkOffer(m.id,channel,sourceId,{...opts,location:locId}):null}
function reconcileWorldMatterLinks(){
 if(!isOpenWorld())return;ensureWorldState();for(const [locId,p] of Object.entries(state.world.settlementProblems||{}))if(p)syncSettlementProblemMatter(locId,p);const W=worldIntegrationState();for(const w of Object.values(W.workOffers)){if(w.status!=='open')continue;if(w.expiresDay&&state.world.day>w.expiresDay)updateWorldWorkOffer(w.id,{status:'expired'});const m=W.matters[w.matterId];if(m&&m.status!=='active')updateWorldWorkOffer(w.id,{status:m.status==='resolved'?'completed':'closed'})}
}
function updateWorldMatter(id,patch={}){const m=worldIntegrationState().matters[id];if(!m)return null;Object.assign(m,patch);m.updatedDay=state.world.day;return m}
function activeWorldMatters(filter={}){return Object.values(worldIntegrationState().matters).filter(m=>m.status==='active'&&(!filter.location||m.location===filter.location)&&(!filter.region||m.region===filter.region)&&(!filter.type||m.type===filter.type))}
function applyWorldEffects(effects,context={}){
 const list=Array.isArray(effects)?effects:[effects],W=worldIntegrationState(),out=[];
 for(const raw of list){if(!raw||!raw.type)continue;const e={id:worldRecordId('effect'),day:state.world.day,...raw,context:{...context,...(raw.context||{})}};let before=null,after=null;
  if(e.type==='localReputation'&&e.location){before=localReputation(e.location);changeLocalReputation(e.location,Number(e.delta)||0,e.reason||'');after=localReputation(e.location)}
  else if(e.type==='settlementSecurity'&&e.location){const ss=settlementState(e.location);before=ss.security;ss.security=clamp(ss.security+(Number(e.delta)||0),0,100);after=ss.security}
  else if(e.type==='settlementProsperity'&&e.location){const ss=settlementState(e.location);before=ss.prosperity;ss.prosperity=clamp(ss.prosperity+(Number(e.delta)||0),0,100);after=ss.prosperity}
  else if(e.type==='gold'){before=state.gold;gainGold(Number(e.delta)||0);after=state.gold}
  else {e.deferred=true}
  e.before=before;e.after=after;W.effects.push(e);out.push(e)
 }
 W.effects=W.effects.slice(-160);return out
}
function worldDispatchEstimateDays(origin,destination,opts={}){
 let base=Number(opts.baseDays);if(!Number.isFinite(base)||base<=0){
  if(origin&&destination&&typeof tradeRouteDistanceDays==='function')base=Math.max(1,tradeRouteDistanceDays(origin,destination));
  else if(origin&&destination&&typeof worldTravelDays==='function')base=Math.max(1,worldTravelDays(origin,destination));
  else base=3
 }
 if(opts.messageSpeed)base=Math.max(1,Math.ceil(base*Number(opts.messageSpeed)));
 if(opts.hallStaff&&origin==='shantium'&&state.world?.homeBase){const n=state.world.homeBase.staff?.messengers||1,st=state.world.homeBase.staff?.steward?.competence||0;base-=Math.floor(Math.max(0,n-1)/2);if(st>=4)base--}
 return Math.max(1,Math.round(base))
}
function createWorldDispatch(kind,opts={}){
 const W=worldIntegrationState(),id=opts.id||worldRecordId('dispatch'),origin=opts.origin||state.world.location,destination=opts.destination||null,days=worldDispatchEstimateDays(origin,destination,opts);
 const d=W.dispatches[id]={id,kind:kind||'message',status:'traveling',origin,destination,sentDay:opts.sentDay??state.world.day,dueDay:(opts.sentDay??state.world.day)+days,arrivedDay:null,completedDay:null,sourceRef:opts.sourceRef||null,targetRef:opts.targetRef||null,title:opts.title||'',payload:{...(opts.payload||{})},links:{...(opts.links||{})},meta:{...(opts.meta||{})}};
 W.history.push({day:state.world.day,type:'dispatch_sent',id,kind:d.kind,origin,destination,title:d.title});W.history=W.history.slice(-160);return d
}
function worldDispatch(id){return id?worldIntegrationState().dispatches[id]||null:null}
function worldDispatchArrived(id){const d=worldDispatch(id);return !!d&&['arrived','delivered','completed'].includes(d.status)}
function completeWorldDispatch(id,status='completed',meta={}){
 const d=worldDispatch(id);if(!d)return null;d.status=status;d.completedDay=state.world.day;Object.assign(d.meta,meta||{});return d
}
function worldDispatchDailyTick(){
 const W=worldIntegrationState();for(const d of Object.values(W.dispatches)){if(d.status==='traveling'&&state.world.day>=d.dueDay){d.status='arrived';d.arrivedDay=state.world.day;W.history.push({day:state.world.day,type:'dispatch_arrived',id:d.id,kind:d.kind,origin:d.origin,destination:d.destination,title:d.title})}}
 W.history=W.history.slice(-160);const keepDay=state.world.day-90;for(const [id,d] of Object.entries(W.dispatches))if(['completed','delivered','cancelled','failed'].includes(d.status)&&(d.completedDay||d.arrivedDay||d.sentDay)<keepDay)delete W.dispatches[id]
}
function worldIntelReliability(i,day=state.world.day){if(!i)return 0;const age=Math.max(0,day-(i.createdDay||day)),decay=Number(i.decayPerDay??2);return clamp(Math.round((i.reliability??70)-age*decay),0,100)}
function createWorldIntel(type,opts={}){
 const W=worldIntegrationState(),location=opts.location||state.world.location,region=opts.region||locationRegion(location),key=opts.key||`${type||'general'}:${location||'unknown'}:${opts.subject||opts.summary||opts.sourceRef||opts.source||'intel'}`;
 let i=Object.values(W.intel).find(x=>x.status==='active'&&x.key===key);
 if(!i){const id=opts.id||worldRecordId('intel');i=W.intel[id]={id,key,type:type||'general',status:'active',createdDay:state.world.day,updatedDay:state.world.day,location,region,subject:opts.subject||'',summary:opts.summary||'',source:opts.source||'',sourceRef:opts.sourceRef||null,reliability:clamp(Number(opts.reliability)||70,1,100),precision:opts.precision||'general',decayPerDay:Number(opts.decayPerDay??2),meta:{...(opts.meta||{})}}}
 else{i.updatedDay=state.world.day;i.createdDay=state.world.day;if(opts.summary)i.summary=opts.summary;i.reliability=Math.max(i.reliability,clamp(Number(opts.reliability)||70,1,100));if(opts.precision)i.precision=opts.precision;if(opts.source)i.source=opts.source;if(opts.sourceRef)i.sourceRef=opts.sourceRef}
 return i
}
function gainScoutingIntel(amount=1,opts={}){
 amount=Math.max(0,Math.round(Number(amount)||0));gainScouting(amount);
 return createWorldIntel(opts.type||'scouting',{...opts,reliability:opts.reliability??clamp(62+amount*9,1,100),summary:opts.summary||SOSText("world_integration_foundations.gainScoutingIntel.001"),source:opts.source||SOSText("world_integration_foundations.gainScoutingIntel.002")})
}
function activeWorldIntel(filter={}){
 return Object.values(worldIntegrationState().intel).filter(i=>i.status==='active'&&worldIntelReliability(i)>0&&(!filter.region||i.region===filter.region)&&(!filter.location||i.location===filter.location)&&(!filter.type||i.type===filter.type)).sort((a,b)=>worldIntelReliability(b)-worldIntelReliability(a)||(b.updatedDay||b.createdDay)-(a.updatedDay||a.createdDay))
}
function worldIntelDailyTick(){
 const W=worldIntegrationState();for(const i of Object.values(W.intel))if(i.status==='active'&&worldIntelReliability(i)<=0){i.status='stale';i.staleDay=state.world.day}
 const cutoff=state.world.day-120;for(const [id,i] of Object.entries(W.intel))if(i.status==='stale'&&(i.staleDay||i.createdDay)<cutoff)delete W.intel[id]
}
function worldAttentionUpsert(kind,sourceId,opts={},desired=null){
 const a=registerAttention(kind,sourceId,{...opts,meta:{...(opts.meta||{}),autoSync:true}});if(desired)desired.add(a.id);return a
}
function syncWorldAttentionRegistry(){
 if(!isOpenWorld())return 0;const W=worldIntegrationState(),desired=new Set(),h=state.world.homeBase;
 if(h){
  if(h.logistics?.disruption)worldAttentionUpsert('hall_logistics',h.logistics.disruption.id||h.logistics.disruption.day||'pending',{title:h.logistics.disruption.text||SOSText("world_integration_foundations.syncWorldAttentionRegistry.001"),priority:5,interruptRest:true,location:'shantium',route:'showHomeLogistics',meta:{hall:true}},desired);
  if(h.security?.pending)worldAttentionUpsert('hall_security',h.security.pending.id||h.security.pending.day||'pending',{title:h.security.pending.title||SOSText("world_integration_foundations.syncWorldAttentionRegistry.002"),priority:5,interruptRest:true,location:'shantium',route:'showHomeSecurity',meta:{hall:true}},desired);
  if(h.staff?.pending)worldAttentionUpsert('hall_staff',h.staff.pending.id||h.staff.pending.day||'pending',{title:h.staff.pending.title||SOSText("world_integration_foundations.syncWorldAttentionRegistry.003"),priority:4,interruptRest:true,location:'shantium',route:'showHomeStaff',meta:{hall:true}},desired);
  if(h.staff?.namedStaffMatter)worldAttentionUpsert('hall_staff_career',h.staff.namedStaffMatter.id||h.staff.namedStaffMatter.day||'career',{title:SOSText("world_integration_foundations.syncWorldAttentionRegistry.004",h.staff.namedStaffMatter.staffName||'Named staff'),priority:4,interruptRest:true,location:'shantium',route:'showHomeStaff',meta:{hall:true}},desired);
  for(const r of h.correspondence?.requests||[])if(r.status==='field_required')worldAttentionUpsert('hall_request',r.id,{title:SOSText("world_integration_foundations.syncWorldAttentionRegistry.005",worldGood(r.goodId)?.name||r.goodId),priority:4,interruptRest:true,location:'shantium',route:'showHomeCorrespondence',meta:{hall:true}},desired);
  for(const m of h.correspondence?.inbox||[])if(typeof homeCorrespondenceActionable==='function'&&homeCorrespondenceActionable(m))worldAttentionUpsert('hall_mail',m.id,{title:m.subject||SOSText("world_integration_foundations.syncWorldAttentionRegistry.006"),priority:3,interruptRest:true,location:'shantium',route:'showHomeMailDetail',meta:{hall:true,mailId:m.id}},desired);
  for(const v of h.audiences?.queue||[])worldAttentionUpsert('hall_audience',v.id,{title:v.name||SOSText("world_integration_foundations.syncWorldAttentionRegistry.007"),priority:v.political?4:3,interruptRest:true,location:'shantium',route:'showHomeAudienceDetail',meta:{hall:true,audienceId:v.id}},desired)
 }
 if(typeof activeLiveRegionalConflicts==='function')for(const c of activeLiveRegionalConflicts()){const pair=c.kind==='guardian_caravan_dispute'&&typeof guardianCaravanDisputeParties==='function'?guardianCaravanDisputeParties(c):null;worldAttentionUpsert(c.kind==='guardian_caravan_dispute'?'guardian_caravan':'regional_conflict',c.id,{title:pair?SOSText("world_integration_foundations.syncWorldAttentionRegistry.008",pair.caravan.name):SOSText("world_integration_foundations.syncWorldAttentionRegistry.009"),priority:c.kind==='guardian_caravan_dispute'?5:3,interruptRest:c.kind==='guardian_caravan_dispute',location:c.locId,route:'showRegionalBattle',meta:{conflictId:c.id}},desired)}
 if(typeof activeRegionalOpportunities==='function')for(const o of activeRegionalOpportunities())if((o.expiresDay||999)-state.world.day<=2)worldAttentionUpsert('regional_opportunity',o.id,{title:o.title||o.name||SOSText("world_integration_foundations.syncWorldAttentionRegistry.010"),priority:2,interruptRest:false,location:o.location,route:'showRegionalOpportunities',meta:{opportunityId:o.id}},desired);
 for(const a of Object.values(W.attention))if(a.status==='open'&&a.meta?.autoSync&&!desired.has(a.id))resolveAttention(a.id);
 return desired.size
}
function worldIntegrationStartDayTick(){worldDispatchDailyTick();worldIntelDailyTick()}
function worldIntegrationEndDayTick(){syncWorldAttentionRegistry();syncWorldActorRegistry()}
function registerAttention(kind,sourceId,opts={}){const W=worldIntegrationState(),id=opts.id||`${kind}:${sourceId}`,old=W.attention[id]||{};return W.attention[id]={...old,id,kind,sourceId,title:opts.title||old.title||'',priority:clamp(Number(opts.priority??old.priority)||1,1,5),interruptRest:opts.interruptRest!==undefined?!!opts.interruptRest:!!old.interruptRest,status:'open',createdDay:old.createdDay||opts.createdDay||state.world.day,location:opts.location??old.location??null,route:opts.route??old.route??null,meta:{...(old.meta||{}),...(opts.meta||{})}}}
function resolveAttention(id){const a=worldIntegrationState().attention[id];if(!a)return false;a.status='resolved';a.resolvedDay=state.world.day;return true}
function openAttention(filter={}){return Object.values(worldIntegrationState().attention).filter(a=>a.status==='open'&&(!filter.interruptRest||a.interruptRest)&&(!filter.location||a.location===filter.location)).sort((a,b)=>b.priority-a.priority||a.createdDay-b.createdDay)}
function createWorldIncident(type,opts={}){
 const W=worldIntegrationState(),id=opts.id||worldRecordId('incident'),actorRows=(opts.actors||[]).map(a=>typeof a==='string'?{ref:a}:({...a})),witnessRows=(opts.witnesses||[]).map(a=>typeof a==='string'?{ref:a}:({...a}));
 return W.incidents[id]={id,type:type||'general',status:opts.status||'open',location:opts.location||state.world.location,region:opts.region||locationRegion(opts.location||state.world.location),severity:clamp(Number(opts.severity)||1,1,5),actors:actorRows,witnesses:witnessRows,outcomes:[...(opts.outcomes||[])],legal:{...(opts.legal||{})},political:{...(opts.political||{})},createdDay:opts.createdDay??state.world.day,updatedDay:state.world.day,resolution:null,links:{...(opts.links||{})},meta:{...(opts.meta||{})}}
}
function worldIncident(id){return id?worldIntegrationState().incidents[id]||null:null}
function worldIncidentActor(id,ref,opts={}){
 const i=worldIncident(id);if(!i||!ref)return null;let row=i.actors.find(a=>a.ref===ref);if(!row){row={ref,...opts};i.actors.push(row)}else Object.assign(row,opts);i.updatedDay=state.world.day;return row
}
function worldIncidentWitness(id,ref,opts={}){
 const i=worldIncident(id);if(!i||!ref)return null;let row=i.witnesses.find(a=>a.ref===ref);if(!row){row={ref,...opts};i.witnesses.push(row)}else Object.assign(row,opts);i.updatedDay=state.world.day;return row
}
function worldIncidentOutcome(id,ref,outcome,opts={}){
 const i=worldIncident(id);if(!i)return null;const row={day:state.world.day,ref:ref||null,outcome,...opts};i.outcomes.push(row);i.outcomes=i.outcomes.slice(-80);i.updatedDay=state.world.day;return row
}
function updateWorldIncident(id,patch={}){
 const i=worldIncident(id);if(!i)return null;if(patch.legal)Object.assign(i.legal,patch.legal);if(patch.political)Object.assign(i.political,patch.political);if(patch.links)Object.assign(i.links,patch.links);if(patch.meta)Object.assign(i.meta,patch.meta);
 for(const k of ['status','severity','location','region'])if(patch[k]!==undefined)i[k]=patch[k];i.updatedDay=state.world.day;return i
}
function resolveWorldIncident(id,resolution={}){
 const i=worldIncident(id);if(!i)return null;i.status='resolved';i.resolvedDay=i.updatedDay=state.world.day;i.resolution={...(i.resolution||{}),...resolution};return i
}
function incidentWitnessCount(id){return worldIncident(id)?.witnesses?.filter(w=>w.status!=='unreliable').length||0}
function incidentOutcomeSummary(id){
 const i=worldIncident(id);if(!i)return null;const out=i.outcomes||[],count=(name)=>out.filter(x=>x.outcome===name).length;
 return {wounded:count('wounded'),escaped:count('escaped'),captured:count('captured'),downed:count('downed'),killed:count('killed'),witnesses:incidentWitnessCount(id)}
}
function worldOpenIncidents(filter={}){
 return Object.values(worldIntegrationState().incidents).filter(i=>i.status==='open'&&(!filter.region||i.region===filter.region)&&(!filter.location||i.location===filter.location)&&(!filter.type||i.type===filter.type)).sort((a,b)=>b.severity-a.severity||a.createdDay-b.createdDay)
}
function worldActiveDispatches(filter={}){
 return Object.values(worldIntegrationState().dispatches).filter(d=>['traveling','arrived'].includes(d.status)&&(!filter.origin||d.origin===filter.origin)&&(!filter.destination||d.destination===filter.destination)&&(!filter.kind||d.kind===filter.kind)).sort((a,b)=>a.dueDay-b.dueDay)
}
function worldRelevantContracts(locId){
 const active=state.world.quests.filter(q=>['active','ready'].includes(q.status)&&(q.origin===locId||q.target===locId)),offered=(state.world.contracts?.[locId]||[]).filter(q=>q.status==='offered');return [...active,...offered]
}
function worldSettlementSnapshot(locId){
 const loc=worldLocation(locId),ss=settlementState(locId),problem=settlementProblem(locId),region=locationRegion(locId),roads=regionalSettlements(region).filter(x=>x.id!==locId).map(x=>({id:x.id,pressure:routePressure(locId,x.id)})).sort((a,b)=>b.pressure-a.pressure),worstRoad=roads[0]||{id:null,pressure:0},lean=rankedSettlementLeans(locId)[0]||null,lowGoods=TRADE_GOODS.filter(g=>tradeStock(locId,g.id)<=1&&tradeDemandScore(locId,g.id)>0),contracts=worldRelevantContracts(locId),stories=activeRegionalStories().filter(a=>regionalStoryDef(a.id).start===locId||regionalStoryTarget(a.id)===locId),intel=activeWorldIntel({location:locId}),incidents=worldOpenIncidents({location:locId}),attention=openAttention({location:locId});
 const bad=(problem?2:0)+(ss.security<35?2:ss.security<55?1:0)+(ss.prosperity<35?2:ss.prosperity<55?1:0)+(worstRoad.pressure>=6?2:worstRoad.pressure>=3?1:0)+(lowGoods.length?1:0),condition=bad>=6?'Under severe strain':bad>=4?'Strained':bad>=2?'Uneasy':SOSText("settlements_people_townlife.settlementConditionLabel.001");
 return {id:locId,location:loc,region,security:ss.security,prosperity:ss.prosperity,condition,problem:problem||null,matters:activeWorldMatters({location:locId}),attention,localReputation:localReputation(locId),worstRoad,politics:{lean},trade:{lowGoods},legal:{tier:wantedTier(locId),bounty:localBounty(locId)},contracts,stories,intel,incidents,opportunities:activeRegionalOpportunities().filter(o=>o.location===locId)}
}
function worldRegionSnapshot(region=currentWorldRegion()){
 const settlements=regionalSettlements(region).map(l=>worldSettlementSnapshot(l.id)),intel=activeWorldIntel({region}),incidents=worldOpenIncidents({region}),matters=activeWorldMatters({region}),attention=openAttention().filter(a=>a.location&&locationRegion(a.location)===region),opportunities=activeRegionalOpportunities().filter(o=>locationRegion(o.location)===region),stories=activeRegionalStories().filter(s=>locationRegion(regionalStoryTarget(s.id)||regionalStoryDef(s.id).start)===region),dispatches=worldActiveDispatches().filter(d=>(d.origin&&locationRegion(d.origin)===region)||(d.destination&&locationRegion(d.destination)===region)),contracts=state.world.quests.filter(q=>['active','ready'].includes(q.status)&&((q.origin&&locationRegion(q.origin)===region)||(q.target&&locationRegion(q.target)===region)));
 const security=Math.round(settlements.reduce((n,s)=>n+s.security,0)/Math.max(1,settlements.length)),prosperity=Math.round(settlements.reduce((n,s)=>n+s.prosperity,0)/Math.max(1,settlements.length));
 return {region,day:state.world.day,name:regionDef(region).name,settlements,security,prosperity,matters,incidents,attention,intel,opportunities,stories,dispatches,contracts,urgent:attention.filter(a=>a.priority>=4).length,strained:settlements.filter(s=>['Strained','Under severe strain'].includes(s.condition)).length}
}
function worldHallSnapshot(){
 ensureHomeBase();syncWorldAttentionRegistry();const h=state.world.homeBase,region=worldRegionSnapshot(currentWorldRegion()),hallAttention=openAttention({location:'shantium'}),requests=homeOutstandingProcurementRequests(),unread=homeMailUnread();
 return {day:state.world.day,budget:h.logistics.budget,accounts:worldAccountsSnapshot(),attention:hallAttention,urgent:hallAttention.filter(a=>a.priority>=4),unread,requests,guest:h.hospitality.guest||null,security:{readiness:h.security.readiness,label:homeSecurityReadinessLabel(h.security.readiness),headGuard:h.security.headGuard||null},staff:{coverage:homeStaffCoverage(),label:homeStaffCoverageLabel(homeStaffCoverage()),steward:h.staff.steward||null},business:{adviser:h.business?.adviser||null,lastIncome:h.business?.lastIncome||0},supplies:{...h.logistics.supplies},region}
}
function worldJournalSnapshot(){
 const region=worldRegionSnapshot(currentWorldRegion()),attention=openAttention(),incidents=worldOpenIncidents(),dispatches=worldActiveDispatches(),intel=activeWorldIntel({region:currentWorldRegion()}),matters=activeWorldMatters({region:currentWorldRegion()});
 return {day:state.world.day,location:worldLocation(state.world.location),region,attention,urgent:attention.filter(a=>a.priority>=4),incidents,dispatches,intel,matters,accounts:worldAccountsSnapshot()}
}
function worldSituationSummaryHTML(region=currentWorldRegion(),compact=false){
 const s=worldRegionSnapshot(region),top=s.attention.slice(0,compact?2:4),inc=s.incidents.slice(0,compact?1:3),intel=s.intel.slice(0,compact?1:3);
 return SOSText("world_integration_foundations.worldSituationSummaryHTML.001",esc(s.name),s.security,s.prosperity,s.strained,s.matters.length,s.incidents.length,s.intel.length,s.urgent,top.map(a=>`<div class="stat-row"><span>${esc(a.title||a.kind)}</span><b>P${a.priority}</b></div>`).join(''),inc.map(i=>`<div class="stat-row"><span>${esc(i.type.replace(/_/g,' '))} — ${esc(worldLocation(i.location)?.name||i.location||'region')}</span><b>Severity ${i.severity}</b></div>`).join(''),intel.map(i=>`<div class="stat-row"><span>${esc(i.summary||i.subject||i.type)}</span><b>${worldIntelReliability(i)}%</b></div>`).join(''),compact?'compact':'')
}
function worldIntegrationAudit(repair=true){
 const W=worldIntegrationState(),issues=[],now=state.world.day;
 for(const [id,a] of Object.entries(W.attention))if(a.status==='open'&&a.meta?.autoSync&&now-(a.createdDay||now)>45){issues.push(`stale attention ${id}`);if(repair)resolveAttention(id)}
 for(const [id,d] of Object.entries(W.dispatches))if(d.status==='traveling'&&d.dueDay<now-14){issues.push(`overdue dispatch ${id}`);if(repair){d.status='failed';d.completedDay=now;d.meta={...(d.meta||{}),auditReason:'overdue'}}}
 for(const [id,o] of Object.entries(W.workOffers))if(o.status==='open'&&!W.matters[o.matterId]){issues.push(`orphan work offer ${id}`);if(repair){o.status='superseded';o.closedDay=now}}
 for(const [id,i] of Object.entries(W.incidents))if(i.status==='open'&&now-(i.createdDay||now)>30){issues.push(`stale incident ${id}`);if(repair)resolveWorldIncident(id,{kind:'expired_unresolved',audit:true})}
 for(const m of Object.values(W.matters))if(m.status==='active'&&m.source?.kind==='settlement_problem'){const p=m.location?settlementProblem(m.location):null;if(!p){issues.push(`stale settlement matter ${m.id}`);if(repair)updateWorldMatter(m.id,{status:'resolved',resolution:'source problem no longer active'})}}
 if(issues.length){W.consolidation.lastAuditDay=now;W.consolidation.lastAuditIssues=issues.slice(-20);recordConsolidation(SOSText("world_integration_foundations.worldIntegrationAudit.001",issues.length))}
 return issues
}
function townJobConflictsWithRegionalWork(locId,job){
 if(!job||job.matterId)return false;const kinds=regionalWorkKindsAt(locId),p=settlementProblem(locId),jk=townJobProblemKind(job.kind);
 if(jk==='security'&&(kinds.has('raider_pressure')||kinds.has('watch_shortage')||kinds.has('hunt')))return true;
 if(jk==='economy'&&(kinds.has('shortage')||kinds.has('trade_slump')||kinds.has('procure')))return true;
 if(jk==='road'&&(kinds.has('route')||kinds.has('visit')))return true;
 return !!(p&&job.kind==='cargo'&&p.type==='shortage'&&kinds.has('shortage'))
}
function recordConsolidation(text){const C=worldIntegrationState().consolidation;C.history.push({day:state.world.day,text});C.history=C.history.slice(-40)}
function consolidateWorldSystems(force=false){
 if(!isOpenWorld())return 0;ensureWorldState();syncWorldActorRegistry();reconcileWorldMatterLinks();const C=worldIntegrationState().consolidation;if(!force&&C.lastDay===state.world.day)return 0;let changes=0;
 for(const loc of regionalSettlements()){
  const id=loc.id,p=settlementProblem(id),stock=ensureTradeStock(id),key=`${state.world.day}:${id}`;
  if(p&&C.settlementChecks[key]!==true){
   if(p.type==='shortage'&&((stock.food||0)+(stock.medicine||0)+(stock.tools||0)>=14)){progressSettlementProblem(id,1,SOSText("settlements_people_townlife.consolidateWorldSystems.001"));recordConsolidation(SOSText("settlements_people_townlife.consolidateWorldSystems.002",loc.name));changes++}
   if(p.type==='trade_slump'&&state.world.parties.some(x=>x.kind==='merchant'&&x.destination===id)){progressSettlementProblem(id,1,SOSText("settlements_people_townlife.consolidateWorldSystems.003"));recordConsolidation(SOSText("settlements_people_townlife.consolidateWorldSystems.004",loc.name));changes++}
   if(['raider_pressure','watch_shortage'].includes(p.type)){const pressure=strongestTroubledRoute(id)?.pressure||0,hostile=state.world.parties.some(x=>['bandits','raiders'].includes(x.kind)&&(x.location===id||x.destination===id));if(pressure<=1&&!hostile){progressSettlementProblem(id,1,SOSText("settlements_people_townlife.consolidateWorldSystems.005"));recordConsolidation(SOSText("settlements_people_townlife.consolidateWorldSystems.006",loc.name));changes++}}
   C.settlementChecks[key]=true
  }
  const job=state.world.townLife?.jobs?.[id];if(job?.status==='available'&&townJobConflictsWithRegionalWork(id,job)){job.status='superseded';job.supersededDay=state.world.day;recordConsolidation(SOSText("settlements_people_townlife.consolidateWorldSystems.007",loc.name));changes++}
  const ss=settlementState(id);ss.security=clamp(ss.security,0,100);ss.prosperity=clamp(ss.prosperity,0,100)
 }
 C.settlementChecks=Object.fromEntries(Object.entries(C.settlementChecks).filter(([k])=>Number(k.split(':')[0])>=state.world.day-3));C.lastDay=state.world.day;if(force||C.lastAuditDay!==state.world.day)worldIntegrationAudit(true);return changes
}
