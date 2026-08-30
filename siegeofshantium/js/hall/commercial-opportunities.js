// v1.6.30 — Commercial Opportunities, Prestige & High-End Commerce
// Concrete Hall business is generated from real staff, facilities and spare capacity.
// The Guardian can now delegate routine contracts under explicit standing commercial rules.

const HOME_COMMERCIAL_OPPORTUNITY_DEFS={
 artisan_commission:{
  name:'Artisan Commission',resource:'artisan',base:105,days:[2,5],commitment:'high',
  summary:'Furniture, architectural detail, repairs, decorative fabrication or general construction work for a prosperous Shantium client.',
  available:h=>!!(h.artisan?.master&&(h.artisan.workmen||0)>=2&&!h.artisan.currentProject),
  capability:h=>Math.max(1,(h.artisan.master?.competence||1)+(typeof homeArtisanEffectiveWorkers==='function'?homeArtisanEffectiveWorkers():(h.artisan.workmen||0))*.7+(typeof homeArtisanWorkshopLevel==='function'?homeArtisanWorkshopLevel()*1.5:0)),
  detail:h=>`${h.artisan.master?.name||'The Master Artisan'} and ${h.artisan.workmen||0} Hall Workmen will be committed to the commission.`
 },
 training_contract:{
  name:'Training Contract',resource:'training',base:88,days:[2,4],commitment:'high',
  summary:'Paid drilling and instruction for merchant guards, escorts, militia volunteers or another respectable local company.',
  available:h=>!!(homeUpgradeLevel('trainingYard')&&h.security?.headGuard&&(h.security.guards||0)>=4),
  capability:h=>Math.max(1,(h.security.headGuard?.competence||1)+homeUpgradeLevel('trainingYard')*1.5+(h.security.quality||1)),
  detail:h=>`${h.security.headGuard?.name||'The Head Guard'} will supervise the contract using the Training Yard.`
 },
 archive_commission:{
  name:'Archive & Scribe Commission',resource:'archives',base:62,days:[1,3],commitment:'low',
  summary:'Commercial records, certified copies, route references, inventories or correspondence prepared for paying clients.',
  available:h=>!!(homeUpgradeLevel('archives')&&(h.staff?.steward||(h.staff?.messengers||0)>=2)),
  capability:h=>Math.max(1,homeUpgradeLevel('archives')*2+(h.staff?.steward?.competence||0)+(h.staff?.messengers||0)*.5),
  detail:h=>`${h.staff?.steward?.name||'Hall clerks'} will coordinate paid archive and scribe work.`
 },
 commercial_gathering:{
  name:'Commercial Hall Event',resource:'banquet',base:126,days:[1,2],commitment:'medium',supplies:{food:4,hospitality:3},
  summary:'A merchant association, civic group or prosperous private client hires Guardian Hall for a paid dinner, negotiation or commercial gathering.',
  available:h=>!!(h.upgrades?.banquetFacilities&&(h.staff?.cooks||0)>=2&&(h.staff?.attendants||0)>=3),
  capability:h=>Math.max(1,(h.staff?.cooks||0)*.7+(h.staff?.attendants||0)*.35+homeUpgradeLevel('diningHall')+2),
  detail:h=>'The event uses Hall dining staff and consumes 4 food and 3 hospitality supplies when accepted.'
 },
 procurement_brokerage:{
  name:'Procurement Brokerage',resource:'logistics',base:92,days:[2,4],commitment:'medium',
  summary:'The Hall earns a brokerage and coordination fee by locating difficult goods and arranging terms for a Shantium client.',
  available:h=>!!h.logistics?.master,
  capability:h=>Math.max(1,(h.logistics.master?.competence||1)+homeTradeProcurementCapacity()*1.2),
  detail:h=>`${h.logistics.master?.name||'The Logistics Master'} provides sourcing expertise. This desk-level brokerage does not consume a caravan slot; separate Client Procurement Caravan opportunities use the shared Logistics caravan pool.`
 },
 security_consulting:{
  name:'Security Consulting',resource:'security',base:78,days:[1,3],commitment:'low',
  summary:'A merchant house or local institution pays for a security review, guard procedures, route-risk planning or defensive advice.',
  available:h=>!!(h.security?.headGuard&&(h.security.readiness||0)>=60),
  capability:h=>Math.max(1,(h.security.headGuard?.competence||1)+(h.security.quality||1)*1.4+(h.security.readiness||0)/25),
  detail:h=>`${h.security.headGuard?.name||'The Head Guard'} provides the expertise; high Hall readiness improves the fee.`
 },
 storage_lease:{
  name:'Secure Storage Arrangement',resource:'stores',base:58,days:[3,6],commitment:'low',
  summary:'A reputable Shantium merchant rents protected short-term storage space that the Hall can spare.',
  available:h=>homeUpgradeLevel('storeroom')>0&&homeStorageCapacity()-h.storage.reduce((n,x)=>n+(x.qty||1),0)>=4,
  capability:h=>Math.max(1,homeUpgradeLevel('storeroom')*2+(h.security?.quality||1)+(h.security?.guards||0)/4),
  detail:h=>'The agreement uses spare Hall storage capacity but does not consume the Guardian’s stored inventory.'
 },
 wealthy_patron_commission:{
  name:'Wealthy Patron Commission',resource:'artisan',base:185,days:[4,7],commitment:'high',prestigeSensitive:true,
  summary:'A wealthy Shantium household, guild patron or institution commissions an unusually ambitious piece of general design, furniture, architectural or decorative work.',
  available:h=>!!((typeof homeHallPrestige==='function'?homeHallPrestige():0)>=25&&(settlementState('shantium')?.prosperity||50)>=65&&h.artisan?.master&&(h.artisan.master.competence||0)>=9&&(h.artisan.workmen||0)>=4&&!h.artisan.currentProject),
  capability:h=>Math.max(1,(h.artisan.master?.competence||1)+(typeof homeArtisanEffectiveWorkers==='function'?homeArtisanEffectiveWorkers():(h.artisan.workmen||0))*.9+(typeof homeArtisanWorkshopLevel==='function'?homeArtisanWorkshopLevel()*2:0)+(typeof homeHallPrestige==='function'?homeHallPrestige()/12:0)),
  detail:h=>`Guardian Hall's growing reputation attracts a high-value patron. ${h.artisan.master?.name||'The Master Artisan'} and the work crew will be committed; the client supplies project materials.`
 },
 prestige_event:{
  name:'Prestige Commercial Event',resource:'banquet',base:205,days:[1,3],commitment:'high',prestigeSensitive:true,supplies:{food:6,hospitality:5},
  summary:'A wealthy commercial or civic circle hires Guardian Hall for a premium private dinner, presentation, auction or negotiation because the Hall itself has become a desirable venue.',
  available:h=>!!((typeof homeHallPrestige==='function'?homeHallPrestige():0)>=35&&(settlementState('shantium')?.prosperity||50)>=75&&h.upgrades?.banquetFacilities&&(h.staff?.cooks||0)>=3&&(h.staff?.attendants||0)>=4),
  capability:h=>Math.max(1,(h.staff?.cooks||0)+(h.staff?.attendants||0)*.5+(typeof homeHallPrestige==='function'?homeHallPrestige()/10:0)),
  detail:h=>'A premium event consumes 6 food and 5 hospitality supplies. Its value depends on both prosperous local demand and Guardian Hall prestige.'
 },
 infirmary_service:{
  name:'Paid Convalescent Care',resource:'infirmary',base:72,days:[2,4],commitment:'medium',
  summary:'The Hall accepts a small number of respectable paying patients for supervised recovery and routine care.',
  available:h=>!!(homeUpgradeLevel('infirmary')&&(h.staff?.medical||0)>=1&&(h.logistics?.supplies?.medical||0)>=30),
  capability:h=>Math.max(1,homeUpgradeLevel('infirmary')*1.8+(h.staff?.medical||0)*1.5),
  detail:h=>'The contract uses medical staff capacity; routine Hall medical supplies are assumed in the quoted net margin.'
 }
};

const HOME_COMMERCIAL_DELEGATION_POLICIES={
 manual:{name:'Guardian Approval',desc:'The Economic Adviser presents every major contract to the Guardian. Nothing is accepted automatically.',auto:false,minProfitPerDay:Infinity,reserveSlots:0,maxCommitment:'none',allowSupplies:false,supplyFloor:100},
 conservative:{name:'Conservative Delegation',desc:'Automatically accept strong, low-commitment contracts while preserving Hall flexibility and scarce supplies.',auto:true,minProfitPerDay:31,reserveSlots:1,maxCommitment:'low',allowSupplies:false,supplyFloor:100},
 balanced:{name:'Balanced Delegation',desc:'Accept worthwhile routine work while keeping one coordination slot available and protecting reasonable supply reserves.',auto:true,minProfitPerDay:23,reserveSlots:1,maxCommitment:'high',allowSupplies:true,supplyFloor:35},
 enterprising:{name:'Enterprising Delegation',desc:'Use available Hall capacity aggressively when contracts remain profitable. The Adviser may fill all coordination slots and use moderate supply reserves.',auto:true,minProfitPerDay:16,reserveSlots:0,maxCommitment:'high',allowSupplies:true,supplyFloor:20}
};
const HOME_COMMERCIAL_COMMITMENT_RANK={none:0,low:1,medium:2,high:3};

function homeCommercialState(){
 ensureHomeBase();const B=state.world.homeBase.business;
 if(!B.commercial||typeof B.commercial!=='object')B.commercial={offers:[],active:[],history:[],lastOfferDay:-99,totalCompleted:0,lifetimeGross:0,delegation:{policy:'manual',autoAccepted:0,lastDecisionDay:-99}};
 const C=B.commercial;C.offers=Array.isArray(C.offers)?C.offers:[];C.active=Array.isArray(C.active)?C.active:[];C.history=Array.isArray(C.history)?C.history:[];C.lastOfferDay=Number.isFinite(C.lastOfferDay)?C.lastOfferDay:-99;C.totalCompleted=C.totalCompleted||0;C.lifetimeGross=C.lifetimeGross||0;if(!C.delegation||typeof C.delegation!=='object')C.delegation={policy:'manual',autoAccepted:0,lastDecisionDay:-99};if(!HOME_COMMERCIAL_DELEGATION_POLICIES[C.delegation.policy])C.delegation.policy='manual';C.delegation.autoAccepted=C.delegation.autoAccepted||0;C.delegation.lastDecisionDay=Number.isFinite(C.delegation.lastDecisionDay)?C.delegation.lastDecisionDay:-99;return C
}
function homeCommercialUsesResource(resource){return homeCommercialState().active.some(x=>x.resource===resource&&x.status==='active')}
function homeCommercialActiveLimit(){const c=state.world.homeBase.business?.adviser?.competence||0;return c>=8?4:c>=5?3:2}
function homeCommercialOpportunityAvailable(def){ensureHomeBase();const h=state.world.homeBase;try{return !!def.available(h)}catch(e){return false}}
function homeCommercialCapability(def){try{return Math.max(1,Number(def.capability(state.world.homeBase))||1)}catch(e){return 1}}
function homeCommercialMarketLabel(p){return p>=85?'exceptional demand':p>=70?'strong demand':p>=55?'healthy demand':p>=35?'limited demand':'weak demand'}
function homeCommercialOfferValue(def){
 const h=state.world.homeBase,B=h.business,pros=settlementState('shantium')?.prosperity||50,adv=B.adviser?.competence||1,cap=homeCommercialCapability(def);
 const market=.58+pros/105,adviser=1+adv*.055,skill=.82+Math.min(18,cap)*.026,variance=rnd(92,110)/100;
 const prestige=(typeof homeHallPrestige==='function'?homeHallPrestige():0),prestigeFactor=def.prestigeSensitive?1+Math.min(.18,prestige*.0022):1;return Math.max(24,Math.round(def.base*market*adviser*skill*variance*prestigeFactor))
}
function homeCommercialGenerateOffer(force=false){
 ensureHomeBase();const h=state.world.homeBase,B=h.business,C=homeCommercialState();if(!B.adviser)return null;
 C.offers=C.offers.filter(o=>o.expiresDay>=state.world.day&&!['accepted','declined','expired'].includes(o.status));
 if(C.offers.length>=4)return null;if(!force&&state.world.day-C.lastOfferDay<2)return null;
 const pool=Object.entries(HOME_COMMERCIAL_OPPORTUNITY_DEFS).filter(([id,d])=>homeCommercialOpportunityAvailable(d)&&!homeCommercialUsesResource(d.resource)&&!C.offers.some(o=>o.type===id));
 if(!pool.length){C.lastOfferDay=state.world.day;return null}
 const [type,def]=pick(pool),duration=rnd(def.days[0],def.days[1]),pros=settlementState('shantium')?.prosperity||50,payout=homeCommercialOfferValue(def),offer={id:'bizopp_'+uid(),type,name:def.name,resource:def.resource,summary:def.summary,detail:def.detail(h),createdDay:state.world.day,expiresDay:state.world.day+rnd(4,7),duration,payout,prosperity:pros,status:'offered',supplies:def.supplies?{...def.supplies}:null};
 if(typeof def.prepareOffer==='function')Object.assign(offer,def.prepareOffer(h,offer)||{});
 C.offers.push(offer);C.lastOfferDay=state.world.day;homeBusinessReport(`${B.adviser.name} identifies a ${def.name.toLowerCase()} worth approximately ${payout}g in net business profit.`,'info');return offer
}
function homeCommercialCanAccept(o){
 const C=homeCommercialState(),def=HOME_COMMERCIAL_OPPORTUNITY_DEFS[o?.type];if(!o||!def||o.status!=='offered'||o.expiresDay<state.world.day)return {ok:false,why:'This opportunity is no longer available.'};if(C.active.filter(x=>x.status==='active').length>=homeCommercialActiveLimit())return {ok:false,why:'The Economic Adviser is already coordinating the maximum number of major commercial commitments.'};if(homeCommercialUsesResource(def.resource))return {ok:false,why:'The required Hall capability is already committed to another commercial contract.'};if(!homeCommercialOpportunityAvailable(def))return {ok:false,why:'The Hall no longer has the staff, facility condition, or capacity required for this work.'};if(def.supplies){const L=state.world.homeBase.logistics?.supplies||{};for(const [k,q] of Object.entries(def.supplies))if((L[k]||0)<q)return {ok:false,why:`Hall ${k} supplies are too low for this contract.`}}if(def.worldCaravan&&typeof homeCommercialCaravanCanAccept==='function'){const cc=homeCommercialCaravanCanAccept(o);if(!cc.ok)return cc}return {ok:true}
}
function homeCommercialDelegationPolicy(){const C=homeCommercialState();return HOME_COMMERCIAL_DELEGATION_POLICIES[C.delegation.policy]||HOME_COMMERCIAL_DELEGATION_POLICIES.manual}
function homeCommercialProfitPerDay(o){return Math.round(((o?.payout||0)/Math.max(1,o?.duration||1))*10)/10}
function homeCommercialDelegationDecision(o){
 const C=homeCommercialState(),P=homeCommercialDelegationPolicy(),def=HOME_COMMERCIAL_OPPORTUNITY_DEFS[o?.type],adv=state.world.homeBase.business?.adviser?.competence||0,check=homeCommercialCanAccept(o);
 if(!P.auto)return {accept:false,why:'Guardian approval required by policy.'};if(!check.ok)return {accept:false,why:check.why};if(!def)return {accept:false,why:'Unknown commercial work.'};
 const active=C.active.filter(x=>x.status==='active').length,limit=homeCommercialActiveLimit();if(active>=Math.max(0,limit-P.reserveSlots))return {accept:false,why:`Policy reserves ${P.reserveSlots} coordination slot${P.reserveSlots===1?'':'s'}.`};
 const commitment=HOME_COMMERCIAL_COMMITMENT_RANK[def.commitment||'medium']||2,max=HOME_COMMERCIAL_COMMITMENT_RANK[P.maxCommitment]||0;if(commitment>max)return {accept:false,why:`${P.name} does not automatically commit ${def.commitment||'medium'}-impact Hall capabilities.`};
 if(def.supplies){if(!P.allowSupplies)return {accept:false,why:'Policy forbids automatic use of Hall supplies.'};const L=state.world.homeBase.logistics?.supplies||{};for(const [k,q] of Object.entries(def.supplies))if((L[k]||0)-q<P.supplyFloor)return {accept:false,why:`Policy protects a ${P.supplyFloor}-point reserve of Hall ${k} supplies.`}}
 if(def.worldCaravan&&typeof homeCommercialDelegationCaravanDecision==='function'){const cd=homeCommercialDelegationCaravanDecision(o,P);if(!cd.accept)return cd}
 // Better advisers can safely recognize thinner but still worthwhile margins without changing the Guardian's overall posture.
 const competenceRelief=Math.min(5,Math.max(0,adv-3))*1.1,threshold=Math.max(10,P.minProfitPerDay-competenceRelief),ppd=homeCommercialProfitPerDay(o);if(ppd<threshold)return {accept:false,why:`Expected ${ppd}g/day is below the Adviser's ${Math.round(threshold)}g/day delegation threshold.`};
 return {accept:true,why:`Fits ${P.name}: ${ppd}g/day, ${def.commitment||'medium'} commitment.`}
}
function setHomeCommercialDelegationPolicy(id){const C=homeCommercialState();if(!HOME_COMMERCIAL_DELEGATION_POLICIES[id])return showHomeCommercialDelegation();C.delegation.policy=id;homeBusinessReport(`Commercial delegation changed to ${HOME_COMMERCIAL_DELEGATION_POLICIES[id].name}.`,'info');save();showHomeCommercialDelegation()}
function showHomeCommercialDelegation(){
 guardianHallRouteEnter('showHomeCommercialDelegation',[]);ensureHomeBase();const B=state.world.homeBase.business,C=homeCommercialState(),P=homeCommercialDelegationPolicy();if(!B.adviser)return actionResult('Economic Adviser Required','Hire an Economic Adviser before setting commercial delegation policy.','info',showHomeBusiness);
 const rows=Object.entries(HOME_COMMERCIAL_DELEGATION_POLICIES).map(([id,p])=>`<button data-delegation="${id}" ${C.delegation.policy===id?'disabled':''}><b>${esc(p.name)}</b><small>${esc(p.desc)}${p.auto?`<br>Minimum quality about ${p.minProfitPerDay}g/day • reserves ${p.reserveSlots} slot${p.reserveSlots===1?'':'s'} • ${p.allowSupplies?`supplies allowed above ${p.supplyFloor}`:'no automatic supply use'}`:''}</small></button>`).join('');
 overlay(`<h2>Guardian Hall — Commercial Delegation</h2><p>Set how much authority ${esc(B.adviser.name)} has to accept routine paid work without asking the Guardian.</p><div class="notice compact"><b>Current policy: ${esc(P.name)}</b><br>${esc(P.desc)}</div><div class="choice-list compact">${rows}</div><div class="two-col"><div class="card"><div class="stat-row"><span>Adviser competence</span><b>${B.adviser.competence}/10</b></div><div class="stat-row"><span>Auto-accepted contracts</span><b>${C.delegation.autoAccepted||0}</b></div></div><div class="card compact"><b>Standing safeguards</b><p>Automatic acceptance never bypasses actual staff/facility availability, active-contract limits, or resource conflicts. Offers outside policy remain on the desk for manual approval.</p></div></div><div class="dialog-footer"><button id="delegationBack">Back to Commercial Opportunities</button></div>`,true);document.querySelectorAll('[data-delegation]').forEach(b=>b.onclick=()=>setHomeCommercialDelegationPolicy(b.dataset.delegation));$('#delegationBack').onclick=()=>guardianHallRouteBack(showHomeCommercialOpportunities)
}
function homeCommercialTryDelegation(){
 const C=homeCommercialState(),P=homeCommercialDelegationPolicy();if(!P.auto)return 0;let accepted=0;const candidates=C.offers.filter(o=>o.status==='offered'&&o.expiresDay>=state.world.day).sort((a,b)=>homeCommercialProfitPerDay(b)-homeCommercialProfitPerDay(a));for(const o of candidates){const d=homeCommercialDelegationDecision(o);if(!d.accept)continue;if(homeCommercialAccept(o.id,true)){accepted++;C.delegation.autoAccepted=(C.delegation.autoAccepted||0)+1;C.delegation.lastDecisionDay=state.world.day}}return accepted
}
function homeCommercialAccept(id,delegated=false){
 ensureHomeBase();const C=homeCommercialState(),o=C.offers.find(x=>x.id===id),check=homeCommercialCanAccept(o);if(!check.ok){if(delegated)return false;return actionResult('Commercial Contract Unavailable',check.why,'info',showHomeCommercialOpportunities)}const def=HOME_COMMERCIAL_OPPORTUNITY_DEFS[o.type];if(def.worldCaravan&&typeof homeCommercialLaunchCaravan==='function')return homeCommercialLaunchCaravan(o,delegated,def);if(def.supplies){const L=state.world.homeBase.logistics.supplies;for(const [k,q] of Object.entries(def.supplies))L[k]=Math.max(0,(L[k]||0)-q)}o.status='accepted';o.acceptedDay=state.world.day;o.completeDay=state.world.day+o.duration;o.delegated=!!delegated;C.offers=C.offers.filter(x=>x.id!==id);C.active.push({...o,status:'active'});homeBusinessReport(`${state.world.homeBase.business.adviser.name} ${delegated?'automatically ':''}accepts ${o.name}: ${o.payout}g expected net profit over ${o.duration} day${o.duration===1?'':'s'}.`,'good');recordWorldHistory(`Guardian Hall ${delegated?'delegates acceptance of':'accepts'} a paid ${o.name.toLowerCase()} in Shantium.`,'info','home');save();if(!delegated)showHomeCommercialOpportunities();return true
}
function homeCommercialDecline(id){const C=homeCommercialState(),o=C.offers.find(x=>x.id===id);if(!o)return showHomeCommercialOpportunities();o.status='declined';C.history.push({...o,resolvedDay:state.world.day});C.offers=C.offers.filter(x=>x.id!==id);save();showHomeCommercialOpportunities()}
function homeCommercialComplete(o){
 const C=homeCommercialState(),B=state.world.homeBase.business;let gross=Math.max(1,o.payout||0);const condition=(typeof homeArtisanConditionFactor==='function'?homeArtisanConditionFactor():1);if(['artisan','stores','banquet','training'].includes(o.resource)&&condition<.9)gross=Math.max(1,Math.round(gross*condition));const shares=typeof homeBusinessDistributeProfit==='function'?homeBusinessDistributeProfit(gross,o.name,`${B.adviser?.name||'The Economic Adviser'} completes ${o.name}.`):{hall:gross,guardian:0};o.status='completed';o.completedDay=state.world.day;o.actualPayout=gross;o.hallShare=shares.hall||0;o.guardianShare=shares.guardian||0;C.totalCompleted++;C.lifetimeGross+=gross;C.history.push({...o});C.history=C.history.slice(-50);homeBusinessReport(`${o.name} completed for ${gross}g net profit — ${shares.hall||0}g to Hall, ${shares.guardian||0}g to Guardian.`,'good');recordWorldHistory(`Guardian Hall completes ${o.name.toLowerCase()} for ${gross}g in commercial profit.`,'good','home')
}
function homeCommercialDailyTick(){
 if(!isOpenWorld())return;ensureHomeBase();const B=state.world.homeBase.business,C=homeCommercialState();if(!B.adviser)return;for(const o of C.offers)if(o.status==='offered'&&o.expiresDay<state.world.day){o.status='expired';C.history.push({...o,resolvedDay:state.world.day})}C.offers=C.offers.filter(o=>o.status==='offered'&&o.expiresDay>=state.world.day);const finished=[];for(const o of C.active)if(!o.worldCaravan&&o.status==='active'&&state.world.day>=o.completeDay){homeCommercialComplete(o);finished.push(o.id)}C.active=C.active.filter(o=>!finished.includes(o.id));homeCommercialGenerateOffer(false);const prestige=(typeof homeHallPrestige==='function'?homeHallPrestige():0),premiumChance=Math.min(.22,prestige/450);if((B.adviser.competence||0)>=6&&C.offers.length<2&&state.world.day-C.lastOfferDay>=1&&chance(.28+premiumChance))homeCommercialGenerateOffer(true);homeCommercialTryDelegation()
}
function homeCommercialOpportunityCard(o,active=false){
 const pros=o.prosperity??(settlementState('shantium')?.prosperity||50),def=HOME_COMMERCIAL_OPPORTUNITY_DEFS[o.type],days=active&&o.worldCaravan?Math.max(0,o.etaDay?o.etaDay-state.world.day:o.duration):active?Math.max(0,(o.completeDay||state.world.day)-state.world.day):o.duration,check=active?{ok:true}:homeCommercialCanAccept(o),delegation=active?null:homeCommercialDelegationDecision(o),caravanDetails=(typeof homeCommercialCaravanCardDetails==='function'?homeCommercialCaravanCardDetails(o,active):'');return `<div class="card"><h4>${esc(o.name)}</h4><p>${esc(o.summary)}</p><div class="stat-row"><span>${active?'Remaining / ETA':'Duration'}</span><b>${days} day${days===1?'':'s'}</b></div><div class="stat-row"><span>Net business profit</span><b>${o.payout}g</b></div><div class="stat-row"><span>Profit / day</span><b>${homeCommercialProfitPerDay(o)}g</b></div><div class="stat-row"><span>Market</span><b>${esc(homeCommercialMarketLabel(pros))}</b></div><div class="stat-row"><span>Uses</span><b>${esc(def?.resource||o.resource)}</b></div>${caravanDetails}<small>${esc(o.detail||'')}</small>${active?`<div class="notice compact">Accepted Day ${o.acceptedDay} • completes Day ${o.completeDay}${o.delegated?' • delegated':''}</div>`:`<div class="notice compact">Offer expires after Day ${o.expiresDay}.<br><small>${esc(delegation?.accept?'Eligible for automatic acceptance':delegation?.why||'Manual review')}</small></div><div class="project-action-grid"><button data-bizaccept="${o.id}" ${check.ok?'':'disabled'}>Accept Contract</button><button data-bizdecline="${o.id}">Decline</button></div>${check.ok?'':`<small class="danger-text">${esc(check.why)}</small>`}`}</div>`
}
function showHomeCommercialOpportunities(){
 guardianHallRouteEnter('showHomeCommercialOpportunities',[]);ensureHomeBase();const h=state.world.homeBase,B=h.business,C=homeCommercialState(),pros=settlementState('shantium')?.prosperity||50,P=homeCommercialDelegationPolicy();if(!B.adviser)return actionResult('Economic Adviser Required','Guardian Hall needs an Economic Adviser before it can systematically identify and coordinate major commercial opportunities.','info',showHomeBusiness);const active=C.active.filter(x=>x.status==='active'),offers=C.offers.filter(x=>x.status==='offered'&&x.expiresDay>=state.world.day),history=C.history.slice(-8).reverse();overlay(`<h2>Guardian Hall — Commercial Opportunities</h2><p>${esc(B.adviser.name)} looks for profitable work that matches the Hall’s actual staff, facilities and available capacity.</p><div class="two-col"><div class="card"><div class="stat-row"><span>Shantium prosperity</span><b>${pros}/100</b></div><div class="stat-row"><span>Local market</span><b>${esc(homeCommercialMarketLabel(pros))}</b></div><div class="stat-row"><span>Hall Prestige</span><b>${typeof homeHallPrestige==='function'?homeHallPrestige():0}/100</b></div><div class="stat-row"><span>Major commitments</span><b>${active.length}/${homeCommercialActiveLimit()}</b></div></div><div class="card"><div class="stat-row"><span>Delegation</span><b>${esc(P.name)}</b></div><div class="stat-row"><span>Completed contracts</span><b>${C.totalCompleted||0}</b></div><div class="stat-row"><span>Lifetime opportunity profit</span><b>${C.lifetimeGross||0}g</b></div><div class="stat-row"><span>Open opportunities</span><b>${offers.length}</b></div></div></div><div class="project-action-grid"><button id="commercialDelegation"><b>Delegation & Business Policy</b><small>${esc(P.desc)}</small></button></div><div class="notice compact"><b>Endgame commerce:</b> prosperous Shantium and a well-developed Hall can support substantial recurring business. These contracts consume real institutional capacity; staff committed here may be unavailable for competing Hall work.</div><h3>Active Contracts</h3>${active.length?`<div class="card-grid">${active.map(o=>homeCommercialOpportunityCard(o,true)).join('')}</div>`:'<p class="muted">No major commercial contracts are currently active.</p>'}<h3>Available Opportunities</h3>${offers.length?`<div class="card-grid">${offers.map(o=>homeCommercialOpportunityCard(o,false)).join('')}</div>`:'<p class="muted">No major opportunity is currently on the Adviser’s desk. New opportunities are reviewed as days pass.</p>'}<h3>Recent Commercial History</h3>${history.map(o=>`<div class="card compact"><b>${esc(o.name)}</b> • ${esc(o.status)}${o.delegated?' • delegated':''}${o.actualPayout!=null?` • ${o.actualPayout}g`:''}<br><small>Day ${o.completedDay||o.resolvedDay||o.createdDay}</small></div>`).join('')||'<p class="muted">No major commercial contracts have been resolved yet.</p>'}<div class="dialog-footer"><button id="commercialBack">Back to Hall Business</button></div>`,true);document.querySelectorAll('[data-bizaccept]').forEach(b=>b.onclick=()=>homeCommercialAccept(b.dataset.bizaccept));document.querySelectorAll('[data-bizdecline]').forEach(b=>b.onclick=()=>homeCommercialDecline(b.dataset.bizdecline));$('#commercialDelegation').onclick=showHomeCommercialDelegation;$('#commercialBack').onclick=()=>guardianHallRouteBack(showHomeBusiness)
}
