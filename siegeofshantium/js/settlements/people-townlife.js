function defaultLocalReputation(){return Object.fromEntries(WORLD_LOCATIONS.filter(x=>['town','settlement','camp','fort'].includes(x.type)).map(x=>[x.id,x.id==='shantium'?4:0]))}
function localReputation(id){ensureWorldState();return state.world.localReputation[id]||0}
function localRepTier(v){return v<=-6?'Resented':v<=-2?'Distrusted':v<3?'Unknown':v<7?'Known':v<12?'Trusted':SOSText("settlements_people_townlife.localRepTier.001")}
function changeLocalReputation(id,delta,reason=''){
 ensureWorldState();state.world.localReputation[id]=clamp((state.world.localReputation[id]||0)+delta,-12,20);
 if(reason)recordWorldHistory(SOSText("settlements_people_townlife.changeLocalReputation.001",worldLocation(id).name,reason,delta>0?'+':'',delta),delta>=0?'good':'bad','reputation');checkReputationMilestones(id)
}
const NPC_DIALOGUE={
 hobb:{work:SOSText("settlements_people_townlife.changeLocalReputation.002"),background:SOSText("settlements_people_townlife.changeLocalReputation.003")},
 sera:{work:SOSText("settlements_people_townlife.changeLocalReputation.004"),background:SOSText("settlements_people_townlife.changeLocalReputation.005")},
 pell:{work:SOSText("settlements_people_townlife.changeLocalReputation.006"),background:SOSText("settlements_people_townlife.changeLocalReputation.007")},
 ilwen:{work:SOSText("settlements_people_townlife.changeLocalReputation.008"),background:SOSText("settlements_people_townlife.changeLocalReputation.009")},
 river_ferryman:{work:SOSText("settlements_people_townlife.changeLocalReputation.010"),background:SOSText("settlements_people_townlife.changeLocalReputation.011")},
 river_trader:{work:SOSText("settlements_people_townlife.changeLocalReputation.012"),background:SOSText("settlements_people_townlife.changeLocalReputation.013")},
 stone_factor:{work:SOSText("settlements_people_townlife.changeLocalReputation.014"),background:SOSText("settlements_people_townlife.changeLocalReputation.015")},
 stone_host:{work:SOSText("settlements_people_townlife.changeLocalReputation.016"),background:SOSText("settlements_people_townlife.changeLocalReputation.017")},
 north_sergeant:{work:SOSText("settlements_people_townlife.changeLocalReputation.018"),background:SOSText("settlements_people_townlife.changeLocalReputation.019")},
 north_clerk:{work:SOSText("settlements_people_townlife.changeLocalReputation.020"),background:SOSText("settlements_people_townlife.changeLocalReputation.021")},
 south_runner:{work:SOSText("settlements_people_townlife.changeLocalReputation.022"),background:SOSText("settlements_people_townlife.changeLocalReputation.023")},
 south_host:{work:SOSText("settlements_people_townlife.changeLocalReputation.024"),background:SOSText("settlements_people_townlife.changeLocalReputation.025")},
 red_captain:{work:SOSText("settlements_people_townlife.changeLocalReputation.026"),background:SOSText("settlements_people_townlife.changeLocalReputation.027")},
 red_quarter:{work:SOSText("settlements_people_townlife.changeLocalReputation.028"),background:SOSText("settlements_people_townlife.changeLocalReputation.029")}
};

Object.assign(NPC_DIALOGUE,{
 sh_healer:{work:SOSText("settlements_people_townlife.changeLocalReputation.030"),background:SOSText("settlements_people_townlife.changeLocalReputation.031")},
 sh_watch:{work:SOSText("settlements_people_townlife.changeLocalReputation.032"),background:SOSText("settlements_people_townlife.changeLocalReputation.033")},
 river_healer:{work:SOSText("settlements_people_townlife.changeLocalReputation.034"),background:SOSText("settlements_people_townlife.changeLocalReputation.035")},
 river_host:{work:SOSText("settlements_people_townlife.changeLocalReputation.036"),background:SOSText("settlements_people_townlife.changeLocalReputation.037")},
 stone_guard:{work:SOSText("settlements_people_townlife.changeLocalReputation.038"),background:SOSText("settlements_people_townlife.changeLocalReputation.039")},
 stone_broker:{work:SOSText("settlements_people_townlife.changeLocalReputation.040"),background:SOSText("settlements_people_townlife.changeLocalReputation.041")},
 north_healer:{work:SOSText("settlements_people_townlife.changeLocalReputation.042"),background:SOSText("settlements_people_townlife.changeLocalReputation.043")},
 north_scout:{work:SOSText("settlements_people_townlife.changeLocalReputation.044"),background:SOSText("settlements_people_townlife.changeLocalReputation.045")},
 south_trader:{work:SOSText("settlements_people_townlife.changeLocalReputation.046"),background:SOSText("settlements_people_townlife.changeLocalReputation.047")},
 south_guard:{work:SOSText("settlements_people_townlife.changeLocalReputation.048"),background:SOSText("settlements_people_townlife.changeLocalReputation.049")},
 red_healer:{work:SOSText("settlements_people_townlife.changeLocalReputation.050"),background:SOSText("settlements_people_townlife.changeLocalReputation.051")},
 red_clerk:{work:SOSText("settlements_people_townlife.changeLocalReputation.052"),background:SOSText("settlements_people_townlife.changeLocalReputation.053")}
});
Object.assign(NPC_DIALOGUE,{zion_councilor:{work:SOSText("settlements_people_townlife.changeLocalReputation.054"),background:SOSText("settlements_people_townlife.changeLocalReputation.055")},zion_cistern:{work:SOSText("settlements_people_townlife.changeLocalReputation.056"),background:SOSText("settlements_people_townlife.changeLocalReputation.057")},zion_packer:{work:SOSText("settlements_people_townlife.changeLocalReputation.058"),background:SOSText("settlements_people_townlife.changeLocalReputation.059")},zion_coalition:{work:SOSText("settlements_people_townlife.changeLocalReputation.060"),background:SOSText("settlements_people_townlife.changeLocalReputation.061")},low_bridge:{work:SOSText("settlements_people_townlife.changeLocalReputation.062"),background:SOSText("settlements_people_townlife.changeLocalReputation.063")},low_mule:{work:SOSText("settlements_people_townlife.changeLocalReputation.064"),background:SOSText("settlements_people_townlife.changeLocalReputation.065")},low_council:{work:SOSText("settlements_people_townlife.changeLocalReputation.066"),background:SOSText("settlements_people_townlife.changeLocalReputation.067")},ebon_council:{work:SOSText("settlements_people_townlife.changeLocalReputation.068"),background:SOSText("settlements_people_townlife.changeLocalReputation.069")},ebon_spring:{work:SOSText("settlements_people_townlife.changeLocalReputation.070"),background:SOSText("settlements_people_townlife.changeLocalReputation.071")},ebon_wood:{work:SOSText("settlements_people_townlife.changeLocalReputation.072"),background:SOSText("settlements_people_townlife.changeLocalReputation.073")},nor_farmer:{work:SOSText("settlements_people_townlife.changeLocalReputation.074"),background:SOSText("settlements_people_townlife.changeLocalReputation.075")},nor_irrigator:{work:SOSText("settlements_people_townlife.changeLocalReputation.076"),background:SOSText("settlements_people_townlife.changeLocalReputation.077")},nor_liaison:{work:SOSText("settlements_people_townlife.changeLocalReputation.078"),background:SOSText("settlements_people_townlife.changeLocalReputation.079")},nor_hamlet:{work:SOSText("settlements_people_townlife.changeLocalReputation.080"),background:SOSText("settlements_people_townlife.changeLocalReputation.081")},winter_guild:{work:SOSText("settlements_people_townlife.changeLocalReputation.082"),background:SOSText("settlements_people_townlife.changeLocalReputation.083")},winter_rigger:{work:SOSText("settlements_people_townlife.changeLocalReputation.084"),background:SOSText("settlements_people_townlife.changeLocalReputation.085")},winter_tool:{work:SOSText("settlements_people_townlife.changeLocalReputation.086"),background:SOSText("settlements_people_townlife.changeLocalReputation.087")},sky_signal:{work:SOSText("settlements_people_townlife.changeLocalReputation.088"),background:SOSText("settlements_people_townlife.changeLocalReputation.089")},sky_scout:{work:SOSText("settlements_people_townlife.changeLocalReputation.090"),background:SOSText("settlements_people_townlife.changeLocalReputation.091")},sky_cook:{work:SOSText("settlements_people_townlife.changeLocalReputation.092"),background:SOSText("settlements_people_townlife.changeLocalReputation.093")}});

Object.assign(NPC_DIALOGUE,{
 sen_warden:{work:SOSText("settlements_people_townlife.changeLocalReputation.094"),background:SOSText("settlements_people_townlife.changeLocalReputation.095")},
 sen_factor:{work:SOSText("settlements_people_townlife.changeLocalReputation.096"),background:SOSText("settlements_people_townlife.changeLocalReputation.097")},
 sen_clerk:{work:SOSText("settlements_people_townlife.changeLocalReputation.098"),background:SOSText("settlements_people_townlife.changeLocalReputation.099")},
 sen_teamster:{work:SOSText("settlements_people_townlife.changeLocalReputation.100"),background:SOSText("settlements_people_townlife.changeLocalReputation.101")},
 lock_speaker:{work:SOSText("settlements_people_townlife.changeLocalReputation.102"),background:SOSText("settlements_people_townlife.changeLocalReputation.103")},
 lock_garrison:{work:SOSText("settlements_people_townlife.changeLocalReputation.104"),background:SOSText("settlements_people_townlife.changeLocalReputation.105")},
 lock_timber:{work:SOSText("settlements_people_townlife.changeLocalReputation.106"),background:SOSText("settlements_people_townlife.changeLocalReputation.107")},
 lock_resin:{work:SOSText("settlements_people_townlife.changeLocalReputation.108"),background:SOSText("settlements_people_townlife.changeLocalReputation.109")},
 gray_council:{work:SOSText("settlements_people_townlife.changeLocalReputation.110"),background:SOSText("settlements_people_townlife.changeLocalReputation.111")},
 gray_officer:{work:SOSText("settlements_people_townlife.changeLocalReputation.112"),background:SOSText("settlements_people_townlife.changeLocalReputation.113")},
 briar_speaker:{work:SOSText("settlements_people_townlife.changeLocalReputation.114"),background:SOSText("settlements_people_townlife.changeLocalReputation.115")},
 briar_farmer:{work:SOSText("settlements_people_townlife.changeLocalReputation.116"),background:SOSText("settlements_people_townlife.changeLocalReputation.117")},
 glen_speaker:{work:SOSText("settlements_people_townlife.changeLocalReputation.118"),background:SOSText("settlements_people_townlife.changeLocalReputation.119")},
 glen_well:{work:SOSText("settlements_people_townlife.changeLocalReputation.120"),background:SOSText("settlements_people_townlife.changeLocalReputation.121")},
 tyr_speaker:{work:SOSText("settlements_people_townlife.changeLocalReputation.122"),background:SOSText("settlements_people_townlife.changeLocalReputation.123")},
 tyr_recruit:{work:SOSText("settlements_people_townlife.changeLocalReputation.124"),background:SOSText("settlements_people_townlife.changeLocalReputation.125")},
 pyre_speaker:{work:SOSText("settlements_people_townlife.changeLocalReputation.126"),background:SOSText("settlements_people_townlife.changeLocalReputation.127")},
 pyre_fire:{work:SOSText("settlements_people_townlife.changeLocalReputation.128"),background:SOSText("settlements_people_townlife.changeLocalReputation.129")},
 sen_teacher:{work:SOSText("settlements_people_townlife.changeLocalReputation.130"),background:SOSText("settlements_people_townlife.changeLocalReputation.131")},
 sen_veteran:{work:SOSText("settlements_people_townlife.changeLocalReputation.132"),background:SOSText("settlements_people_townlife.changeLocalReputation.133")},
 sen_baker:{work:SOSText("settlements_people_townlife.changeLocalReputation.134"),background:SOSText("settlements_people_townlife.changeLocalReputation.135")},
 sen_petitioner:{work:SOSText("settlements_people_townlife.changeLocalReputation.136"),background:SOSText("settlements_people_townlife.changeLocalReputation.137")},
 lock_hunter:{work:SOSText("settlements_people_townlife.changeLocalReputation.138"),background:SOSText("settlements_people_townlife.changeLocalReputation.139")},
 lock_teacher:{work:SOSText("settlements_people_townlife.changeLocalReputation.140"),background:SOSText("settlements_people_townlife.changeLocalReputation.141")},
 lock_veteran:{work:SOSText("settlements_people_townlife.changeLocalReputation.142"),background:SOSText("settlements_people_townlife.changeLocalReputation.143")},
 gray_teamster:{work:SOSText("settlements_people_townlife.changeLocalReputation.144"),background:SOSText("settlements_people_townlife.changeLocalReputation.145")},
 gray_veteran:{work:SOSText("settlements_people_townlife.changeLocalReputation.146"),background:SOSText("settlements_people_townlife.changeLocalReputation.147")},
 gray_cook:{work:SOSText("settlements_people_townlife.changeLocalReputation.148"),background:SOSText("settlements_people_townlife.changeLocalReputation.149")},
 briar_seed:{work:SOSText("settlements_people_townlife.changeLocalReputation.150"),background:SOSText("settlements_people_townlife.changeLocalReputation.151")},
 briar_boat:{work:SOSText("settlements_people_townlife.changeLocalReputation.152"),background:SOSText("settlements_people_townlife.changeLocalReputation.153")},
 briar_youth:{work:SOSText("settlements_people_townlife.changeLocalReputation.154"),background:SOSText("settlements_people_townlife.changeLocalReputation.155")},
 glen_midwife:{work:SOSText("settlements_people_townlife.changeLocalReputation.156"),background:SOSText("settlements_people_townlife.changeLocalReputation.157")},
 glen_carrier:{work:SOSText("settlements_people_townlife.changeLocalReputation.158"),background:SOSText("settlements_people_townlife.changeLocalReputation.159")},
 glen_veteran:{work:SOSText("settlements_people_townlife.changeLocalReputation.160"),background:SOSText("settlements_people_townlife.changeLocalReputation.161")},
 tyr_herder:{work:SOSText("settlements_people_townlife.changeLocalReputation.162"),background:SOSText("settlements_people_townlife.changeLocalReputation.163")},
 tyr_healer:{work:SOSText("settlements_people_townlife.changeLocalReputation.164"),background:SOSText("settlements_people_townlife.changeLocalReputation.165")},
 tyr_veteran:{work:SOSText("settlements_people_townlife.changeLocalReputation.166"),background:SOSText("settlements_people_townlife.changeLocalReputation.167")},
 pyre_farrier:{work:SOSText("settlements_people_townlife.changeLocalReputation.168"),background:SOSText("settlements_people_townlife.changeLocalReputation.169")},
 pyre_family:{work:SOSText("settlements_people_townlife.changeLocalReputation.170"),background:SOSText("settlements_people_townlife.changeLocalReputation.171")},
 pyre_veteran:{work:SOSText("settlements_people_townlife.changeLocalReputation.172"),background:SOSText("settlements_people_townlife.changeLocalReputation.173")}
});

function isSengiaNpc(npc){return !!npc&&locationRegion(Object.entries(SETTLEMENT_NPCS).find(([,list])=>list.some(n=>n.id===npc.id))?.[0])==='redstone'}
function redstoneNpcHome(npcId){for(const [id,list] of Object.entries(SETTLEMENT_NPCS))if(list.some(n=>n.id===npcId)&&locationRegion(id)==='redstone')return id;return null}
function sengiaNpcContext(npc,locId){
 if(locationRegion(locId)!=='redstone')return [];
 const home=redstoneNpcHome(npc.id)||locId,e=sengiaEconomyState().settlements[home],m=sengiaSecurityState().settlements[home],precedent=sengiaPrecedentLabel(home),rows=[],role=(npc.role||'').toLowerCase();
 if(precedent!==SOSText("settlements_people_townlife.sengiaNpcContext.001"))rows.push(SOSText("settlements_people_townlife.sengiaNpcContext.002",precedent));
 if(e){
  if(e.food<35)rows.push(SOSText("settlements_people_townlife.sengiaNpcContext.003"));
  else if(e.food>65&&home==='briarlake')rows.push(SOSText("settlements_people_townlife.sengiaNpcContext.004"));
  if(e.recovery<45)rows.push(SOSText("settlements_people_townlife.sengiaNpcContext.005"));
  if(['farmer','miller','seed-store','harvest','baker'].some(x=>role.includes(x)))rows.push(SOSText("settlements_people_townlife.sengiaNpcContext.006",Math.round(e.food),Math.round(e.seed),sengiaFoodPolicyLabel().toLowerCase()));
 }
 if(m){
  if(m.pressure>=7)rows.push(SOSText("settlements_people_townlife.sengiaNpcContext.007"));
  if(m.irregulars>=30&&['veteran','officer','watch','warden','scout'].some(x=>role.includes(x)))rows.push(SOSText("settlements_people_townlife.sengiaNpcContext.008"));
 }
 const civic=redstoneCivicState().history.filter(x=>x.locId===home).slice(-1)[0];if(civic)rows.push(SOSText("settlements_people_townlife.sengiaNpcContext.009",civic.title));
 const auth=sengiaAuthorityState().history.filter(x=>x.locId===home).slice(-1)[0];if(auth)rows.push(SOSText("settlements_people_townlife.sengiaNpcContext.010",auth.title));
 return rows.slice(0,4)
}
function syncSengiaNpcMemory(npc,locId){
 if(locationRegion(locId)!=='redstone')return;const r=npcRelationshipState(npc.id),home=redstoneNpcHome(npc.id)||locId;
 const keys=r.contextKeys||(r.contextKeys=[]),add=(key,text,op=0)=>{if(keys.includes(key))return;keys.push(key);keys.splice(0,Math.max(0,keys.length-12));npcMemoryAdd(npc.id,text,op)};
 const auth=sengiaAuthorityState().history.filter(x=>x.locId===home).slice(-1)[0];if(auth)add(`auth:${auth.day}:${auth.title}`,SOSText("settlements_people_townlife.syncSengiaNpcMemory.001",auth.title,worldLocation(home).name),auth.precedent==='local'||auth.precedent==='review'?1:auth.precedent==='command'&&String(npc.role).toLowerCase().includes('officer')?1:0);
 const econ=sengiaEconomyState(),eh=econ.history.filter(x=>x.text.includes(worldLocation(home).name)||home==='briarlake'&&x.text.includes(SOSText("settlements_people_townlife.syncSengiaNpcMemory.002"))).slice(-1)[0];if(eh)add(`econ:${eh.day}:${eh.text.slice(0,24)}`,SOSText("settlements_people_townlife.syncSengiaNpcMemory.003",eh.text),0);
 const sec=sengiaSecurityState(),sh=sec.history.filter(x=>x.text.includes(worldLocation(home).name)).slice(-1)[0];if(sh)add(`sec:${sh.day}:${sh.text.slice(0,24)}`,SOSText("settlements_people_townlife.syncSengiaNpcMemory.004",sh.text),0);
 const civ=redstoneCivicState().history.filter(x=>x.locId===home).slice(-1)[0];if(civ)add(`civic:${civ.day}:${civ.title}`,SOSText("settlements_people_townlife.syncSengiaNpcMemory.005",civ.title),0)
}
function sengiaNpcReactionText(npc,locId){
 const rows=sengiaNpcContext(npc,locId);if(!rows.length)return SOSText("settlements_people_townlife.sengiaNpcReactionText.001",npc.name);
 return rows.join(' ')
}
function sengiaNpcPersonalProblem(npc,locId,r){
 const role=(npc.role||'').toLowerCase(),e=sengiaEconomyState().settlements[locId],m=sengiaSecurityState().settlements[locId];
 if(role.includes('veteran')||role.includes(SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.001"))||role.includes('demobilized')){
  advanceWorldDays(1,SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.002",npc.name));m.irregulars=Math.max(0,m.irregulars-4);m.manpower=Math.min(100,m.manpower+1);npcMemoryAdd(npc.id,SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.003"),2);changeLocalReputation(locId,1,SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.004",npc.name));return SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.005",npc.name)
 }
 if(role.includes('seed-store')||role.includes('farmer')||role.includes('harvest')){
  e.seed=Math.max(e.seed,sengiaSeedFloor(locId)+3);npcMemoryAdd(npc.id,SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.006"),2);changeLocalReputation(locId,1,SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.007",npc.name));return SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.008",npc.name)
 }
 if(role.includes('petition')){
  adjustJurisdictionRep(locId,1,SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.009"));npcMemoryAdd(npc.id,SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.010"),2);advanceWorldDays(1,SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.011",npc.name));return SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.012",npc.name)
 }
 if(role.includes('midwife')||role.includes('healer')){
  if(narrativeTradeGoodCount('medicine')>0){consumeNarrativeTradeGood('medicine',1);e.recovery=Math.min(100,e.recovery+3);npcMemoryAdd(npc.id,SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.013"),2);return SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.014",npc.name)}
 }
 if(role.includes('herder')||role.includes('cistern')||role.includes('well')){
  advanceWorldDays(1,SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.015",npc.name));settlementState(locId).prosperity=Math.min(100,settlementState(locId).prosperity+1);npcMemoryAdd(npc.id,SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.016"),1);return SOSText("settlements_people_townlife.sengiaNpcPersonalProblem.017",npc.name)
 }
 return null
}
function ensureNpcRelations(){ensureWorldState();if(!state.world.npcRelations)state.world.npcRelations={}}
function npcRelationshipState(id){ensureNpcRelations();if(!state.world.npcRelations[id])state.world.npcRelations[id]={familiarity:state.world.npcFamiliarity[id]||0,lastTalkDay:0,lastRoadInfoDay:0,lastFavorDay:-99,conversations:0,memory:[],opinion:0,lastProblemDay:-99};const r=state.world.npcRelations[id];if(r.familiarity==null)r.familiarity=state.world.npcFamiliarity[id]||0;if(!Array.isArray(r.memory))r.memory=[];if(r.opinion==null)r.opinion=0;if(r.lastProblemDay==null)r.lastProblemDay=-99;return r}
function npcFamiliarity(id){return npcRelationshipState(id).familiarity||0}
function npcFamiliarityTier(v){return v>=9?'Trusted Contact':v>=6?'Familiar':v>=3?'Acquainted':SOSText("settlements_people_townlife.npcFamiliarityTier.001")}
function settlementNpc(locId,npcId){return (SETTLEMENT_NPCS[locId]||[]).find(n=>n.id===npcId)||Object.values(SETTLEMENT_NPCS).flat().find(n=>n.id===npcId)}
function npcRoleAdvice(npc,locId){
 const role=(npc.role||'').toLowerCase(),ss=settlementState(locId);
 if(role.includes('trader')||role.includes('factor')||role.includes('quartermaster'))return ss.prosperity>=65?'Trade is moving well; prices should be fairly stable today.':SOSText("settlements_people_townlife.npcRoleAdvice.001");
 if(role.includes('sergeant')||role.includes('officer')||role.includes('guard')||role.includes('watch')||role.includes('scout'))return ss.security<50?'Road security is poor enough that armed travel is sensible.':SOSText("settlements_people_townlife.npcRoleAdvice.002");
 if(role.includes('smith'))return SOSText("settlements_people_townlife.npcRoleAdvice.003");
 if(role.includes('fletcher'))return SOSText("settlements_people_townlife.npcRoleAdvice.004");
 if(role.includes('archivist')||role.includes('clerk'))return SOSText("settlements_people_townlife.npcRoleAdvice.005");
 if(role.includes('ferryman')||role.includes('runner'))return SOSText("settlements_people_townlife.npcRoleAdvice.006");if(role.includes('baker')||role.includes('cook')||role.includes('fisher'))return SOSText("settlements_people_townlife.npcRoleAdvice.007");if(role.includes('carpenter')||role.includes('wagon')||role.includes('boatwright')||role.includes('engineer')||role.includes('mender'))return SOSText("settlements_people_townlife.npcRoleAdvice.008");if(role.includes('teacher'))return SOSText("settlements_people_townlife.npcRoleAdvice.009");if(role.includes('porter')||role.includes('supplier')||role.includes('farrier'))return SOSText("settlements_people_townlife.npcRoleAdvice.010");
 return SOSText("settlements_people_townlife.npcRoleAdvice.011")
}
function npcRoadNews(locId){
 const hostile=state.world.parties.filter(p=>worldPartyDisposition(p)==='hostile').sort((a,b)=>worldPartyDistanceToPlayer(a)-worldPartyDistanceToPlayer(b));
 if(hostile.length){const p=hostile[0];return SOSText("settlements_people_townlife.npcRoadNews.001",p.name,worldLocation(p.destination).name,worldPartyTravelEstimate(p).label)}
 const merchants=state.world.parties.filter(p=>p.kind==='merchant');if(merchants.length){const p=pick(merchants);return SOSText("settlements_people_townlife.npcRoadNews.002",p.name,worldLocation(p.destination).name)}
 return SOSText("settlements_people_townlife.npcRoadNews.003")
}
function growNpcFamiliarity(locId,npc,r){if(r.lastTalkDay===state.world.day)return false;r.lastTalkDay=state.world.day;r.conversations=(r.conversations||0)+1;const before=r.familiarity||0;r.familiarity=Math.min(10,before+1);state.world.npcFamiliarity[npc.id]=r.familiarity;if(before===0)changeLocalReputation(locId,1,SOSText("settlements_people_townlife.growNpcFamiliarity.001",npc.name));return true}
function npcFavor(npc,locId,r){
 if(r.familiarity<4||r.opinion<=-4)return actionResult(SOSText("settlements_people_townlife.npcFavor.001"),r.opinion<=-4?SOSText("settlements_people_townlife.npcFavor.002",npc.name):SOSText("settlements_people_townlife.npcFavor.003",npc.name),'info',()=>showSettlementNPCConversation(locId,npc.id));
 if(state.world.day-r.lastFavorDay<4)return actionResult(SOSText("settlements_people_townlife.npcFavor.004"),SOSText("settlements_people_townlife.npcFavor.005",npc.name),'info',()=>showSettlementNPCConversation(locId,npc.id));
 r.lastFavorDay=state.world.day;const role=(npc.role||'').toLowerCase();let text='';
 if(role.includes('healer')){restoreActiveCompany(.45);text=SOSText("settlements_people_townlife.npcFavor.006",npc.name)}
 else if(role.includes('tavern')||role.includes('inn')||role.includes('host')){state.guardian.stamina=Math.min(maxStamina(),state.guardian.stamina+20);text=SOSText("settlements_people_townlife.npcFavor.007",npc.name)}
 else if(role.includes('smith')||role.includes('fletcher')){invAdd('bandage');text=SOSText("settlements_people_townlife.npcFavor.008",npc.name)}
 else if(role.includes('trader')||role.includes('factor')||role.includes('quartermaster')||role.includes('broker')){gainScouting(1);text=SOSText("settlements_people_townlife.npcFavor.009",npc.name)}
 else if(role.includes('sergeant')||role.includes('officer')||role.includes('guard')||role.includes('watch')||role.includes('scout')){gainScouting(1);text=SOSText("settlements_people_townlife.npcFavor.010",npc.name)}
 else if(role.includes('baker')||role.includes('cook')||role.includes('fisher')){state.guardian.stamina=Math.min(maxStamina(),state.guardian.stamina+14);text=SOSText("settlements_people_townlife.npcFavor.011",npc.name)}
 else if(role.includes('carpenter')||role.includes('wagon')||role.includes('boatwright')||role.includes('engineer')||role.includes('mender')){settlementState(locId).prosperity=Math.min(100,settlementState(locId).prosperity+1);text=SOSText("settlements_people_townlife.npcFavor.012",npc.name)}
 else if(role.includes('archivist')||role.includes('clerk')){const c=revealCompanionRumor();text=c?SOSText("settlements_people_townlife.npcFavor.013",npc.name,allyDef(c.id).name,worldLocation(c.location).name):SOSText("settlements_people_townlife.npcFavor.014",npc.name);gainScouting(1)}
 else if(role.includes('ferryman')||role.includes('runner')){const p=state.world.parties.find(x=>worldPartyDisposition(x)==='hostile');if(p)setTrackedWorldParty(p);text=p?SOSText("settlements_people_townlife.npcFavor.015",npc.name,p.name):SOSText("settlements_people_townlife.npcFavor.016",npc.name)}
 else{text=SOSText("settlements_people_townlife.npcFavor.017",npc.name);gainScouting(1)}
 if(r.opinion>=5){gainScouting(1);text+=SOSText("settlements_people_townlife.npcFavor.018",npc.name)}recordWorldHistory(SOSText("settlements_people_townlife.npcFavor.019",npc.name,worldLocation(locId).name),'good','relationship');save();actionResult(SOSText("settlements_people_townlife.npcFavor.020",npc.name),text,'good',()=>showSettlementNPCConversation(locId,npc.id))
}
function talkSettlementNPC(locId,npcId,topic){
 const npc=settlementNpc(locId,npcId);if(!npc)return showSettlementPeople(locId);const r=npcRelationshipState(npcId),d=NPC_DIALOGUE[npcId]||{};syncSengiaNpcMemory(npc,locId);const first=growNpcFamiliarity(locId,npc,r);let text='';
 if(topic==='town')text=settlementConditionText(locId);
 if(topic==='roads'){text=npcRoadNews(locId);if(r.lastRoadInfoDay!==state.world.day){r.lastRoadInfoDay=state.world.day;if(r.familiarity>=5&&chance(.35)){const c=revealCompanionRumor();if(c)text+=SOSText("settlements_people_townlife.talkSettlementNPC.001",allyDef(c.id).name,worldLocation(c.location).name)}}}
 if(topic==='work')text=d.work||SOSText("settlements_people_townlife.talkSettlementNPC.002",npc.name,worldLocation(locId).name);
 if(topic==='advice')text=npcRoleAdvice(npc,locId);
 if(topic==='personal')text=d.background||SOSText("settlements_people_townlife.talkSettlementNPC.003",npc.name);
 if(topic==='changed')text=sengiaNpcReactionText(npc,locId);
 if(first)npcMemoryAdd(npcId,SOSText("settlements_people_townlife.talkSettlementNPC.004",npc.name,worldLocation(locId).name),1);save();actionResult(npc.name,`${text}${first?' You part on slightly more familiar terms.':''}`,'info',()=>showSettlementNPCConversation(locId,npcId))
}
function showSettlementNPCConversation(locId,npcId){modalRouteEnter(SOSText("settlements_people_townlife.showSettlementNPCConversation.001"),Array.from(arguments));
 const npc=settlementNpc(locId,npcId);if(!npc)return showSettlementPeople(locId);syncSengiaNpcMemory(npc,locId);const r=npcRelationshipState(npcId),tier=npcFamiliarityTier(r.familiarity),att=npcAttitudeLabel(r),red=locationRegion(locId)==='redstone',roadReaction=travelerNpcReaction(locId,npc),compInterest=npcCompanionInterest(locId,npc);
 overlay(SOSText("settlements_people_townlife.showSettlementNPCConversation.002",esc(npc.name),esc(npc.role),esc(tier),r.familiarity,esc(att),(()=>{const a=npcFactionAlignment(npc.id);return a&&Math.abs(a.support)>=1?`<div class="notice compact"><b>Political leaning:</b> ${esc(npcPoliticalSupportLabel(a.support))} — ${a.support<0?'opposes':'supports'} ${esc(majorFaction(a.faction).short)}<br><small>${esc(a.reason)}</small></div>`:''})(),(()=>{const rr=npcResidenceRecord(npc.id);return rr&&rr.current!==rr.home?`<div class="notice compact"><b>Now based in ${esc(worldLocation(rr.current).name)}</b><br>Originally from ${esc(worldLocation(rr.home).name)} • ${esc(rr.reason)}</div>`:''})(),r.memory.length?`<div class="notice compact"><b>What ${esc(npc.name)} remembers:</b><br>${esc(npcMemorySummary(npcId))}</div>`:'',red?`<div class="npc-current-context">${sengiaNpcContext(npc,locId).map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:'',roadReaction?`<div class="notice compact road-contact-reaction">${esc(roadReaction)}</div>`:'',esc(worldLocation(locId).name),red?'<button data-npctopic="changed">Ask What Has Changed</button>':'',r.familiarity>=6?'':'disabled',r.familiarity>=3?'':'disabled',r.familiarity>=4?'':'disabled',r.familiarity>=2?'':'disabled',travelerInquiryTargets().length?'':'disabled',compInterest?`<button id="npcAskCompanion">Ask About ${esc(compInterest.name)}</button>`:''));
 document.querySelectorAll('[data-npctopic]').forEach(b=>b.onclick=()=>talkSettlementNPC(locId,npcId,b.dataset.npctopic));$('#npcProblem').onclick=()=>npcLocalProblem(npc,locId,r);$('#npcFavor').onclick=()=>npcFavor(npc,locId,r);if($('#npcLocalPolitics'))$('#npcLocalPolitics').onclick=()=>showNpcPoliticalConversation(locId,npcId);if($('#npcAskTraveler'))$('#npcAskTraveler').onclick=()=>showTravelerInquiryPicker('npc',npc,()=>showSettlementNPCConversation(locId,npcId));if($('#npcAskCompanion'))$('#npcAskCompanion').onclick=()=>npcAskAboutCompanion(locId,npcId,compInterest.id);$('#npcConversationBack').onclick=()=>showSettlementPeople(locId)
}
function meetSettlementNPC(locId,npcId){showSettlementNPCConversation(locId,npcId)}
function showSettlementPeople(locId=state.world.location){modalRouteEnter(SOSText("settlements_people_townlife.showSettlementPeople.001"),Array.from(arguments));
 const loc=worldLocation(locId),people=settlementNpcsPresent(locId);
 const home=people.filter(n=>n.home===locId).length,visitors=people.length-home;overlay(SOSText("settlements_people_townlife.showSettlementPeople.002",esc(loc.name),home,home===1?'':'s',visitors,visitors===1?'':'s',people.map(n=>{const r=npcRelationshipState(n.id),away=n.home!==locId;return `<div class="card"><b>${esc(n.name)}</b> — ${esc(n.role)}${away?` <small>• visiting from ${esc(worldLocation(n.home).name)}</small>`:''}<br><small>${esc(npcFamiliarityTier(r.familiarity))} • ${esc(npcAttitudeLabel(r))} • Familiarity ${r.familiarity}/10${r.lastTalkDay===state.world.day?' • spoken with today':''}</small>${r.memory.length?`<p class="compact">${esc(r.memory[r.memory.length-1].text)}</p>`:''}<br><button data-meetnpc="${n.id}">Talk</button></div>`}).join('')||'<div class="notice muted">No named local contact is available here today.</div>'));
 document.querySelectorAll('[data-meetnpc]').forEach(b=>b.onclick=()=>showSettlementNPCConversation(locId,b.dataset.meetnpc));wireClose()
}


const TOWN_LIFE_SCENES={
 shantium:[
  SOSText("settlements_people_townlife.showSettlementPeople.003"),
  SOSText("settlements_people_townlife.showSettlementPeople.004"),
  SOSText("settlements_people_townlife.showSettlementPeople.005"),
  SOSText("settlements_people_townlife.showSettlementPeople.006")
 ],
 river:[
  SOSText("settlements_people_townlife.showSettlementPeople.007"),
  SOSText("settlements_people_townlife.showSettlementPeople.008"),
  SOSText("settlements_people_townlife.showSettlementPeople.009")
 ],
 stonebridge:[
  SOSText("settlements_people_townlife.showSettlementPeople.010"),
  SOSText("settlements_people_townlife.showSettlementPeople.011"),
  SOSText("settlements_people_townlife.showSettlementPeople.012")
 ],
 northgate:[
  SOSText("settlements_people_townlife.showSettlementPeople.013"),
  SOSText("settlements_people_townlife.showSettlementPeople.014"),
  SOSText("settlements_people_townlife.showSettlementPeople.015")
 ],
 southroad:[
  SOSText("settlements_people_townlife.showSettlementPeople.016"),
  SOSText("settlements_people_townlife.showSettlementPeople.017"),
  SOSText("settlements_people_townlife.showSettlementPeople.018")
 ],
 redoubt:[
  SOSText("settlements_people_townlife.showSettlementPeople.019"),
  SOSText("settlements_people_townlife.showSettlementPeople.020"),
  SOSText("settlements_people_townlife.showSettlementPeople.021")
 ]
};
const TOWN_JOB_DEFS=[
 {id:'watch',title:SOSText("settlements_people_townlife.showSettlementPeople.022"),kind:'security',days:1,reward:18},
 {id:'repairs',title:SOSText("settlements_people_townlife.showSettlementPeople.023"),kind:'prosperity',days:1,reward:16},
 {id:'supplies',title:SOSText("settlements_people_townlife.showSettlementPeople.024"),kind:'cargo',days:0,reward:24},
 {id:'messages',title:SOSText("settlements_people_townlife.showSettlementPeople.025"),kind:'scouting',days:1,reward:15},
 {id:'market',title:SOSText("settlements_people_townlife.showSettlementPeople.026"),kind:'market',days:1,reward:20}
];
function townLifeState(){ensureWorldState();return state.world.townLife}

Object.assign(TOWN_LIFE_SCENES,{
 zion:[SOSText("settlements_people_townlife.townLifeState.001"),SOSText("settlements_people_townlife.townLifeState.002"),SOSText("settlements_people_townlife.townLifeState.003")],
 lowcreek:[SOSText("settlements_people_townlife.townLifeState.004"),SOSText("settlements_people_townlife.townLifeState.005"),SOSText("settlements_people_townlife.townLifeState.006")],
 ebonheart:[SOSText("settlements_people_townlife.townLifeState.007"),SOSText("settlements_people_townlife.townLifeState.008"),SOSText("settlements_people_townlife.townLifeState.009")],
 norwegian:[SOSText("settlements_people_townlife.townLifeState.010"),SOSText("settlements_people_townlife.townLifeState.011"),SOSText("settlements_people_townlife.townLifeState.012")],
 winterstone:[SOSText("settlements_people_townlife.townLifeState.013"),SOSText("settlements_people_townlife.townLifeState.014"),SOSText("settlements_people_townlife.townLifeState.015")],
 skybreak:[SOSText("settlements_people_townlife.townLifeState.016"),SOSText("settlements_people_townlife.townLifeState.017"),SOSText("settlements_people_townlife.townLifeState.018")]
});
const BLUESTONE_TOWN_JOBS={
 zion:[{id:'zc',title:SOSText("settlements_people_townlife.townLifeState.019"),kind:'prosperity',days:1,reward:20},{id:'zp',title:SOSText("settlements_people_townlife.townLifeState.020"),kind:'cargo',days:0,reward:22},{id:'zs',title:SOSText("settlements_people_townlife.townLifeState.021"),kind:'market',days:1,reward:18}],
 lowcreek:[{id:'lb',title:SOSText("settlements_people_townlife.townLifeState.022"),kind:'prosperity',days:1,reward:22},{id:'lf',title:SOSText("settlements_people_townlife.townLifeState.023"),kind:'cargo',days:0,reward:24},{id:'la',title:SOSText("settlements_people_townlife.townLifeState.024"),kind:'scouting',days:1,reward:21}],
 ebonheart:[{id:'ew',title:SOSText("settlements_people_townlife.townLifeState.025"),kind:'prosperity',days:1,reward:22},{id:'es',title:SOSText("settlements_people_townlife.townLifeState.026"),kind:'prosperity',days:1,reward:19},{id:'et',title:SOSText("settlements_people_townlife.townLifeState.027"),kind:'scouting',days:1,reward:20}],
 norwegian:[{id:'ni',title:SOSText("settlements_people_townlife.townLifeState.028"),kind:'prosperity',days:1,reward:20},{id:'ng',title:SOSText("settlements_people_townlife.townLifeState.029"),kind:'cargo',days:0,reward:23},{id:'nb',title:SOSText("settlements_people_townlife.townLifeState.030"),kind:'prosperity',days:1,reward:19}],
 winterstone:[{id:'wh',title:SOSText("settlements_people_townlife.townLifeState.031"),kind:'prosperity',days:1,reward:24},{id:'wt',title:SOSText("settlements_people_townlife.townLifeState.032"),kind:'cargo',days:0,reward:24},{id:'wr',title:SOSText("settlements_people_townlife.townLifeState.033"),kind:'security',days:1,reward:26}],
 skybreak:[{id:'ss',title:SOSText("settlements_people_townlife.townLifeState.034"),kind:'cargo',days:0,reward:24},{id:'sr',title:SOSText("settlements_people_townlife.townLifeState.035"),kind:'security',days:1,reward:25},{id:'sp',title:SOSText("settlements_people_townlife.townLifeState.036"),kind:'scouting',days:1,reward:24}]
};


Object.assign(TOWN_LIFE_SCENES,{
 sengia:[SOSText("settlements_people_townlife.townLifeState.037"),SOSText("settlements_people_townlife.townLifeState.038"),SOSText("settlements_people_townlife.townLifeState.039"),SOSText("settlements_people_townlife.townLifeState.040"),SOSText("settlements_people_townlife.townLifeState.041"),SOSText("settlements_people_townlife.townLifeState.042")],
 lockwood:[SOSText("settlements_people_townlife.townLifeState.043"),SOSText("settlements_people_townlife.townLifeState.044"),SOSText("settlements_people_townlife.townLifeState.045"),SOSText("settlements_people_townlife.townLifeState.046"),SOSText("settlements_people_townlife.townLifeState.047"),SOSText("settlements_people_townlife.townLifeState.048")],
 grayhaven:[SOSText("settlements_people_townlife.townLifeState.049"),SOSText("settlements_people_townlife.townLifeState.050"),SOSText("settlements_people_townlife.townLifeState.051"),SOSText("settlements_people_townlife.townLifeState.052"),SOSText("settlements_people_townlife.townLifeState.053"),SOSText("settlements_people_townlife.townLifeState.054")],
 briarlake:[SOSText("settlements_people_townlife.townLifeState.055"),SOSText("settlements_people_townlife.townLifeState.056"),SOSText("settlements_people_townlife.townLifeState.057"),SOSText("settlements_people_townlife.townLifeState.058"),SOSText("settlements_people_townlife.townLifeState.059"),SOSText("settlements_people_townlife.townLifeState.060")],
 glenbrook:[SOSText("settlements_people_townlife.townLifeState.061"),SOSText("settlements_people_townlife.townLifeState.062"),SOSText("settlements_people_townlife.townLifeState.063"),SOSText("settlements_people_townlife.townLifeState.064"),SOSText("settlements_people_townlife.townLifeState.065"),SOSText("settlements_people_townlife.townLifeState.066")],
 tyrdon:[SOSText("settlements_people_townlife.townLifeState.067"),SOSText("settlements_people_townlife.townLifeState.068"),SOSText("settlements_people_townlife.townLifeState.069"),SOSText("settlements_people_townlife.townLifeState.070"),SOSText("settlements_people_townlife.townLifeState.071"),SOSText("settlements_people_townlife.townLifeState.072")],
 pyreglade:[SOSText("settlements_people_townlife.townLifeState.073"),SOSText("settlements_people_townlife.townLifeState.074"),SOSText("settlements_people_townlife.townLifeState.075"),SOSText("settlements_people_townlife.townLifeState.076"),SOSText("settlements_people_townlife.townLifeState.077"),SOSText("settlements_people_townlife.townLifeState.078")]
});
const REDSTONE_TOWN_JOBS={
 sengia:[{id:'sen_convoy',title:SOSText("settlements_people_townlife.townLifeState.079"),kind:'cargo',days:0,reward:27},{id:'sen_gate',title:SOSText("settlements_people_townlife.townLifeState.080"),kind:'prosperity',days:1,reward:25},{id:'sen_records',title:SOSText("settlements_people_townlife.townLifeState.081"),kind:'scouting',days:1,reward:23}],
 lockwood:[{id:'lock_timberjob',title:SOSText("settlements_people_townlife.townLifeState.082"),kind:'cargo',days:0,reward:24},{id:'lock_planks',title:SOSText("settlements_people_townlife.townLifeState.083"),kind:'prosperity',days:1,reward:21},{id:'lock_paths',title:SOSText("settlements_people_townlife.townLifeState.084"),kind:'scouting',days:1,reward:23}],
 grayhaven:[{id:'gray_wagon',title:SOSText("settlements_people_townlife.townLifeState.085"),kind:'prosperity',days:1,reward:22},{id:'gray_scoutjob',title:SOSText("settlements_people_townlife.townLifeState.086"),kind:'scouting',days:1,reward:25},{id:'gray_stores',title:SOSText("settlements_people_townlife.townLifeState.087"),kind:'cargo',days:0,reward:23}],
 briarlake:[{id:'briar_grain',title:SOSText("settlements_people_townlife.townLifeState.088"),kind:'cargo',days:0,reward:22},{id:'briar_ditch',title:SOSText("settlements_people_townlife.townLifeState.089"),kind:'prosperity',days:1,reward:20},{id:'briar_road',title:SOSText("settlements_people_townlife.townLifeState.090"),kind:'scouting',days:1,reward:21}],
 glenbrook:[{id:'glen_welljob',title:SOSText("settlements_people_townlife.townLifeState.091"),kind:'prosperity',days:1,reward:19},{id:'glen_repairs',title:SOSText("settlements_people_townlife.townLifeState.092"),kind:'prosperity',days:1,reward:22},{id:'glen_supplies',title:SOSText("settlements_people_townlife.townLifeState.093"),kind:'cargo',days:0,reward:24}],
 tyrdon:[{id:'tyr_waterjob',title:SOSText("settlements_people_townlife.townLifeState.094"),kind:'cargo',days:0,reward:23},{id:'tyr_cistern',title:SOSText("settlements_people_townlife.townLifeState.095"),kind:'prosperity',days:1,reward:22},{id:'tyr_patrol',title:SOSText("settlements_people_townlife.townLifeState.096"),kind:'scouting',days:1,reward:22}],
 pyreglade:[{id:'pyre_break',title:SOSText("settlements_people_townlife.townLifeState.097"),kind:'security',days:1,reward:26},{id:'pyre_stablejob',title:SOSText("settlements_people_townlife.townLifeState.098"),kind:'prosperity',days:1,reward:22},{id:'pyre_work',title:SOSText("settlements_people_townlife.townLifeState.099"),kind:'cargo',days:0,reward:24}]
};
function settlementPopulationFeel(locId){
 const ss=settlementState(locId),n=(SETTLEMENT_NPCS[locId]||[]).length,pros=ss.prosperity>=75?'busy':ss.prosperity>=50?'active':ss.prosperity>=30?'subdued':'thin',sec=ss.security<35?'guarded':'ordinary';
 return SOSText("settlements_people_townlife.settlementPopulationFeel.001",n,pros,sec)
}
function townVisualState(locId){
 const ss=settlementState(locId),problem=settlementProblem(locId),event=settlementEvent(locId),law=hasWarrant(locId),rep=localReputation(locId);let rows=[];
 if(ss.prosperity>=75)rows.push(SOSText("settlements_people_townlife.townVisualState.001"));
 else if(ss.prosperity<35)rows.push(SOSText("settlements_people_townlife.townVisualState.002"));
 if(ss.security>=75)rows.push(SOSText("settlements_people_townlife.townVisualState.003"));
 else if(ss.security<35)rows.push(SOSText("settlements_people_townlife.townVisualState.004"));
 if(problem)rows.push(SOSText("settlements_people_townlife.townVisualState.005",problem.title));
 if(event&&!event.resolved)rows.push(SOSText("settlements_people_townlife.townVisualState.006",event.title));
 if(law)rows.push(SOSText("settlements_people_townlife.townVisualState.007"));
 const lean=rankedSettlementLeans(locId)[0];if(lean&&lean.f!==settlementControl(locId)&&lean.score>=4)rows.push(SOSText("settlements_people_townlife.townVisualState.008",majorFaction(lean.f).short,lean.tier.toLowerCase()));if(rep>=12)rows.push(SOSText("settlements_people_townlife.townVisualState.009"));
 else if(rep<=-3)rows.push(SOSText("settlements_people_townlife.townVisualState.010"));
 for(const e of settlementEvidence(locId).slice(-2))rows.push(e.text);return rows
}

function sengiaLivingScene(locId){
 if(locationRegion(locId)!=='redstone')return '';
 const e=sengiaEconomyState().settlements[locId],m=sengiaSecurityState().settlements[locId],p=sengiaAuthorityState().precedents[locId],rows=[];
 if(e.food<30)rows.push(SOSText("settlements_people_townlife.sengiaLivingScene.001"));
 else if(e.food>65&&locId==='briarlake')rows.push(SOSText("settlements_people_townlife.sengiaLivingScene.002"));
 if(e.recovery<45)rows.push(SOSText("settlements_people_townlife.sengiaLivingScene.003"));
 else if(e.recovery>65)rows.push(SOSText("settlements_people_townlife.sengiaLivingScene.004"));
 if(m.pressure>=7)rows.push(SOSText("settlements_people_townlife.sengiaLivingScene.005"));
 if(m.irregulars>=32)rows.push(SOSText("settlements_people_townlife.sengiaLivingScene.006"));
 if(p==='review')rows.push(SOSText("settlements_people_townlife.sengiaLivingScene.007"));
 if(p==='local')rows.push(SOSText("settlements_people_townlife.sengiaLivingScene.008"));
 if(p==='command')rows.push(SOSText("settlements_people_townlife.sengiaLivingScene.009"));
 return rows.length?pick(rows):''
}
function townSceneText(locId){
 const base=pick(TOWN_LIFE_SCENES[locId]||[SOSText("settlements_people_townlife.townSceneText.001")]),living=sengiaLivingScene(locId),vis=townVisualState(locId);return `${base}${living?` ${living}`:''}${vis.length?` ${vis[0]}`:''}`
}

function regionSettlementSnapshot(locId){
 const s=worldSettlementSnapshot(locId);return {loc:s.location,security:s.security,prosperity:s.prosperity,problem:s.problem,worstRoad:{id:s.worstRoad.id,p:s.worstRoad.pressure},lean:s.politics.lean,lowGoods:s.trade.lowGoods,legal:s.legal.tier,bounty:s.legal.bounty,contracts:s.contracts.length,stories:s.stories.length,rep:s.localReputation,attention:s.attention,intel:s.intel,incidents:s.incidents,matters:s.matters,condition:s.condition}
}
function settlementConditionLabel(locId){return worldSettlementSnapshot(locId).condition}

function settlementSnapshotHTML(locId,compact=false){
 const s=regionSettlementSnapshot(locId),road=s.worstRoad.id?`${worldLocation(s.worstRoad.id).name} ${s.worstRoad.p}/10`:'none',lean=s.lean&&s.lean.score>=2?`${majorFaction(s.lean.f).short} — ${s.lean.tier}`:SOSText("settlements_people_townlife.settlementSnapshotHTML.001");
 return SOSText("settlements_people_townlife.settlementSnapshotHTML.002",compact?'compact':'',esc(settlementConditionLabel(locId)),s.security,s.prosperity,esc(localRepTier(s.rep)),s.problem?`<span>Local concern: ${esc(s.problem.title)} (${Math.min(3,s.problem.progress||0)}/3 relief)</span>`:'',s.worstRoad.p?`<span>Most pressured road: ${esc(road)}</span>`:'',s.lowGoods.length?`<span>Short supply: ${esc(s.lowGoods.slice(0,2).map(g=>g.name).join(', '))}</span>`:'',esc(lean),s.bounty?` • ${s.bounty}g local bounty`:'',!compact?`<span>${s.contracts} relevant contract${s.contracts===1?'':'s'} • ${s.stories} regional stor${s.stories===1?'y':'ies'}</span>`:'')
}
function townJobProblemKind(kind){return kind==='cargo'||kind==='prosperity'||kind==='market'?'economy':kind==='security'?'security':kind==='scouting'?'road':null}
function townJobMatchesSettlementProblem(def,p){
 if(!p||!def)return true;const economy=['shortage','trade_slump','refugee_load','grain_road','warehouse_backlog','dry_supply','requisition_pressure'].includes(p.type),security=['raider_pressure','watch_shortage','resin_fire','watch_isolation','occupation_tension'].includes(p.type),road=['pass_closure','retaining_damage','valley_access','quarry_hazard'].includes(p.type),governance=['authority_dispute'].includes(p.type);
 if(economy)return ['cargo','prosperity','market'].includes(def.kind);if(security)return ['security','scouting'].includes(def.kind);if(road)return ['scouting','security','prosperity'].includes(def.kind);if(governance)return ['prosperity','scouting'].includes(def.kind);return true
}
function linkTownJobToMatter(locId,job){
 if(!job)return null;const p=settlementProblem(locId);if(!p)return null;const m=syncSettlementProblemMatter(locId,p);if(!m)return null;job.matterId=m.id;job.workOfferId=createWorldWorkOffer(m.id,'townlife',job.id,{title:job.title,location:locId,expiresDay:job.expiresDay,meta:{jobKind:job.kind}})?.id;return m
}
function regionalWorkKindsAt(locId){
 const rows=[...(state.world.contracts[locId]||[]).filter(q=>q.status==='offered'),...state.world.quests.filter(q=>['active','ready'].includes(q.status)&&q.origin===locId)];
 return new Set(rows.map(q=>q.regionalSource?.type||q.type))
}
function showRegionOverview(){modalRouteEnter(SOSText("settlements_people_townlife.showRegionOverview.001"),Array.from(arguments));
 consolidateWorldSystems(true);const reg=currentWorldRegion(),snapshot=worldRegionSnapshot(reg),rows=snapshot.settlements.map(s=>({id:s.id,s:regionSettlementSnapshot(s.id)}));
 overlay(SOSText("settlements_people_townlife.showRegionOverview.002",esc(snapshot.name),`${worldSituationSummaryHTML(reg,true)}${rows.map(x=>`<button class="region-overview-row" data-regionloc="${x.id}"><span><b>${esc(x.s.loc.name)}</b><small>${esc(x.s.condition)} • Security ${x.s.security} • Prosperity ${x.s.prosperity}</small></span><span><small>${x.s.problem?esc(x.s.problem.title):'No active local problem'}${x.s.worstRoad.p?` • road pressure ${x.s.worstRoad.p}/10`:''}${x.s.lowGoods.length?` • ${x.s.lowGoods.length} short good${x.s.lowGoods.length===1?'':'s'}`:''}</small><small>${x.s.lean&&x.s.lean.score>=2?`${esc(majorFaction(x.s.lean.f).short)} ${esc(x.s.lean.tier.toLowerCase())}`:'politically steady'} • ${x.s.contracts} contracts • ${x.s.stories} stories • ${x.s.incidents.length} incidents</small></span></button>`).join('')}`,reg==='redstone'?sengiaConsequenceSummaryHTML():'',reg==='redstone'?'<button id="overviewSengia">Sengia Regional Consequences</button>':''),true);
 document.querySelectorAll('[data-regionloc]').forEach(b=>b.onclick=()=>showTownLife(b.dataset.regionloc));if($('#overviewSengia'))$('#overviewSengia').onclick=showSengiaRegionalConsequences;wireClose()
}
function refreshTownLife(locId,force=false){
 const T=townLifeState();if(!force&&T.lastRefresh[locId]===state.world.day)return;
 T.lastRefresh[locId]=state.world.day;
 const ss=settlementState(locId),rep=localReputation(locId),problem=settlementProblem(locId),event=settlementEvent(locId);if(problem&&T.jobs[locId]?.status==='available'&&!T.jobs[locId].matterId)linkTownJobToMatter(locId,T.jobs[locId]);
 const rumors=[];
 if(problem)rumors.push(SOSText("settlements_people_townlife.refreshTownLife.001",problem.title,worldLocation(locId).name));
 if(event&&!event.resolved)rumors.push(SOSText("settlements_people_townlife.refreshTownLife.002",event.title.toLowerCase()));
 const hostile=state.world.parties.find(p=>['bandits','raiders'].includes(p.kind)&&(p.destination===locId||p.location===locId));
 if(hostile)rumors.push(SOSText("settlements_people_townlife.refreshTownLife.003",hostile.name));
 const merchant=state.world.parties.find(p=>p.kind==='merchant'&&p.destination===locId);
 if(merchant)rumors.push(SOSText("settlements_people_townlife.refreshTownLife.004",merchant.name,worldLocation(merchant.origin||merchant.location).name));
 const threads=regionalThreadAt(locId);if(threads.length)rumors.push(threads[0].notes[threads[0].notes.length-1]||threads[0].text);
 for(const e of settlementEvidence(locId).slice(-2))if(!rumors.includes(e.text))rumors.push(e.text);const lowGoods=TRADE_GOODS.filter(g=>tradeStock(locId,g.id)<=1&&tradeDemandScore(locId,g.id)>0);if(lowGoods.length)rumors.push(SOSText("settlements_people_townlife.refreshTownLife.005",lowGoods.slice(0,2).map(g=>g.name.toLowerCase()).join(' and ')));if(!rumors.length)rumors.push(ss.prosperity>=65?'People are mostly talking about trade, prices, and who arrived recently.':SOSText("settlements_people_townlife.refreshTownLife.006"));
 T.rumors[locId]=rumors.slice(0,4);
 const notices=[];
 notices.push(rep>=7?'The Guardian is listed among trusted local contacts for emergencies.':SOSText("settlements_people_townlife.refreshTownLife.007"));
 if(hasWarrant(locId))notices.push(SOSText("settlements_people_townlife.refreshTownLife.008",localBounty(locId),lawProfile(locId).name));
 if(problem)notices.push(SOSText("settlements_people_townlife.refreshTownLife.009",problem.title));
 if(politicalStatus(locId).pending)notices.push(SOSText("settlements_people_townlife.refreshTownLife.010",politicalStatus(locId).pending.reason));
 T.notices[locId]=notices;
 if(!T.jobs[locId]||T.jobs[locId].expiresDay<state.world.day||!['available','superseded'].includes(T.jobs[locId].status)){
   const source=REDSTONE_TOWN_JOBS[locId]||BLUESTONE_TOWN_JOBS[locId]||TOWN_JOB_DEFS,baseDefs=source.filter(j=>!(j.kind==='cargo'&&narrativeTradeGoodCount('food')<1)),matterDefs=problem?baseDefs.filter(j=>townJobMatchesSettlementProblem(j,problem)):[],defs=matterDefs.length?matterDefs:baseDefs,d=pick(defs);
   T.jobs[locId]={id:uid(),defId:d.id,title:d.title,kind:d.kind,reward:Math.round(d.reward*settlementPriceModifier(locId)),createdDay:state.world.day,expiresDay:state.world.day+3,status:'available'};if(problem)linkTownJobToMatter(locId,T.jobs[locId]);
   if(townJobConflictsWithRegionalWork(locId,T.jobs[locId])){T.jobs[locId].status='superseded';if(T.jobs[locId].workOfferId)updateWorldWorkOffer(T.jobs[locId].workOfferId,{status:'superseded'})}
 }
}
function townJob(locId){refreshTownLife(locId);return townLifeState().jobs[locId]}
function doTownJob(locId){
 const j=townJob(locId);if(!j||j.status!=='available')return showTownLife(locId);const ss=settlementState(locId);let text='';
 if(j.kind==='cargo'){if(narrativeTradeGoodCount('food')<1)return actionResult(SOSText("settlements_people_townlife.doTownJob.001"),SOSText("settlements_people_townlife.doTownJob.002"),'info',()=>showTownLife(locId));consumeNarrativeTradeGood('food',1);ss.prosperity=Math.min(100,ss.prosperity+2);progressSettlementProblem(locId,1,SOSText("settlements_people_townlife.doTownJob.003"));text=SOSText("settlements_people_townlife.doTownJob.004")}
 else {advanceWorldDays(j.days||1,`${j.title} in ${worldLocation(locId).name}`);if(j.kind==='security')ss.security=Math.min(100,ss.security+3);if(['prosperity','market'].includes(j.kind))ss.prosperity=Math.min(100,ss.prosperity+2);if(j.kind==='scouting')gainScouting(2);if(j.matterId&&settlementProblem(locId))progressSettlementProblem(locId,1,SOSText("settlements_people_townlife.doTownJob.012",j.title));text=SOSText("settlements_people_townlife.doTownJob.005",j.title.toLowerCase())}
 gainGold(j.reward);changeLocalReputation(locId,1,SOSText("settlements_people_townlife.doTownJob.006",j.title));j.status='complete';j.completedDay=state.world.day;if(j.workOfferId)updateWorldWorkOffer(j.workOfferId,{status:'completed'});townLifeState().history.push({day:state.world.day,locId,title:j.title,reward:j.reward});SOSServices.companions.noteSharedEvent('local_work',SOSText("settlements_people_townlife.doTownJob.007",j.title,worldLocation(locId).name));recordWorldHistory(SOSText("settlements_people_townlife.doTownJob.008",worldLocation(locId).name,j.title,j.reward),'good',SOSText("settlements_people_townlife.doTownJob.009"));save();actionResult(SOSText("settlements_people_townlife.doTownJob.010"),SOSText("settlements_people_townlife.doTownJob.011",text,j.reward),'good',()=>showTownLife(locId))
}
function settlementVisitorSummary(locId){
 const present=settlementNpcsPresent(locId),vis=present.filter(n=>n.home!==locId);if(vis.length)return vis.map(v=>`${v.name} (${v.role}) from ${worldLocation(v.home).name}`).join(', ');
 const parties=state.world.parties.filter(p=>p.location===locId||p.destination===locId).slice(0,3);return parties.length?parties.map(p=>`${p.name} — ${p.kind}`).join(', '):SOSText("settlements_people_townlife.settlementVisitorSummary.001")
}
function townLifeLocalAffairsReadout(locId){
 const loc=worldLocation(locId),ss=settlementState(locId),standing=state.world.factionStanding[loc.faction]||0;let body='';
 if(locId==='river')body=SOSText("companions_stories_settlement_services.showSettlementSpecial.002");
 else if(locId==='stonebridge')body=SOSText("companions_stories_settlement_services.showSettlementSpecial.003");
 else if(locId==='northgate')body=SOSText("companions_stories_settlement_services.showSettlementSpecial.004");
 else if(locId==='southroad')body=SOSText("companions_stories_settlement_services.showSettlementSpecial.005");
 else if(locId==='redoubt')body=SOSText("companions_stories_settlement_services.showSettlementSpecial.006",standing<-5?'disabled':'');
 else if(locId==='sengia')body=SOSText("companions_stories_settlement_services.showSettlementSpecial.007");
 else if(locId==='lockwood')body=SOSText("companions_stories_settlement_services.showSettlementSpecial.008");
 else if(locId==='grayhaven')body=SOSText("companions_stories_settlement_services.showSettlementSpecial.009");
 else if(locId==='briarlake')body=SOSText("companions_stories_settlement_services.showSettlementSpecial.010");
 else if(locId==='glenbrook')body=SOSText("companions_stories_settlement_services.showSettlementSpecial.011");
 else if(locId==='tyrdon')body=SOSText("companions_stories_settlement_services.showSettlementSpecial.012");
 else if(locId==='pyreglade')body=SOSText("companions_stories_settlement_services.showSettlementSpecial.013");
 return body&& !body.includes('no unique service')?`<h3>Local Notes</h3><div class="card compact">${body}</div>`:''
}
function townLifeSocialize(locId){
 const people=settlementNpcsPresent(locId),loc=worldLocation(locId);advanceWorldDays(1,`Spent time socializing in ${loc.name}`);
 if(people.length){const npc=pick(people),r=npcRelationshipState(npc.id);r.familiarity=Math.min(10,(r.familiarity||0)+1);r.opinion=Math.min(10,(r.opinion||0)+1);npcMemoryAdd(npc.id,`The Guardian spent an ordinary day talking with people around ${loc.name}.`,1);save();return actionResult('A Local Conversation',`While spending time around ${loc.name}, you fall into conversation with ${npc.name}, ${npc.role}. The visit leaves you on slightly more familiar terms.`,'good',()=>showSettlementNPCConversation(locId,npc.id))}
 changeLocalReputation(locId,1,'Spent time among local residents');save();return actionResult('An Ordinary Social Day',`You spend time among the people of ${loc.name}. No particular introduction stands out, but the Guardian becomes a little more familiar around town.`,'info',()=>showTownLife(locId))
}
function showOpenWorldSettlementTownLife(locId=state.world.location){modalRouteEnter(SOSText("settlements_people_townlife.showOpenWorldSettlementTownLife.001"),Array.from(arguments));
 refreshTownLife(locId);const loc=worldLocation(locId),T=townLifeState(),rumors=T.rumors[locId]||[],notices=T.notices[locId]||[],visual=townVisualState(locId),storyArcs=activeRegionalStories().filter(a=>regionalStoryTarget(a.id)===locId||regionalStoryDef(a.id).start===locId),localContacts=knownTravelersAtSettlement(locId);
 overlay(SOSText("settlements_people_townlife.showOpenWorldSettlementTownLife.002",esc(loc.name),esc(townSceneText(locId)),settlementSnapshotHTML(locId),regionalLocalLifeHTML(locId),locationRegion(locId)==='redstone'?redstonePolicyNoticeHTML(locId):'',visual.length?`<h3>What You Can See</h3>${visual.map(x=>`<div class="card compact">${esc(x)}</div>`).join('')}`:'',storyArcs.length?`<h3>Regional Stories</h3>${storyArcs.map(a=>`<button class="regional-story-inline" data-townstory="${a.id}"><b>${esc(regionalStoryDef(a.id).title)}</b><br><small>${esc(regionalStoryObjective(a.id))}</small></button>`).join('')}`:'',esc(settlementVisitorSummary(locId)),'',populationAtSettlementHTML(locId),companionTownInterjection(locId),companionSocialTownHTML(locId),socialEventHTML(locId),socialChainHTML(locId),socialLifeHistoryHTML(locId),rumors.map(x=>`<div class="town-rumor">${esc(x)}</div>`).join(''),notices.map(x=>`<div class="town-notice">${esc(x)}</div>`).join(''),townLifeLocalAffairsReadout(locId),travelerTownLifeHTML(locId)) ,true);
 document.querySelectorAll('[data-townstory]').forEach(b=>b.onclick=()=>showRegionalStory(b.dataset.townstory));document.querySelectorAll('[data-townroadcontact]').forEach(b=>b.onclick=()=>showTownTravelerContact(locId,b.dataset.townroadcontact,'town'));if($('#openCompanionSocialRequest')){const cr=companionSocialRequests(locId)[0];if(cr)$('#openCompanionSocialRequest').onclick=()=>showCompanionSocialRequest(cr.id)}if($('#openSocialLifeEvent'))$('#openSocialLifeEvent').onclick=()=>showSocialLifeEvent(locId);document.querySelectorAll('[data-socialchain]').forEach(b=>b.onclick=()=>showSocialChain(b.dataset.socialchain));if($('#specialAct'))$('#specialAct').onclick=()=>settlementSpecialAction(locId);$('#townPeople').onclick=()=>navigateTownMenu('people',{locId});$('#townSocialize').onclick=()=>townLifeSocialize(locId);wireClose()
}
function townLifeDailyTick(){
 if(!isOpenWorld())return;const T=townLifeState();for(const id of Object.keys(state.world.settlements)){if(T.jobs[id]?.status==='available'&&T.jobs[id].expiresDay<state.world.day){T.jobs[id].status='expired';if(T.jobs[id].workOfferId)updateWorldWorkOffer(T.jobs[id].workOfferId,{status:'expired'})};if(chance(.45))refreshTownLife(id,true)}
}
const SETTLEMENT_EVENT_TYPES=[
 {id:'market',title:SOSText("settlements_people_townlife.townLifeDailyTick.001"),text:SOSText("settlements_people_townlife.townLifeDailyTick.002"),effect:'prosperity'},
 {id:'wounded',title:SOSText("settlements_people_townlife.townLifeDailyTick.003"),text:SOSText("settlements_people_townlife.townLifeDailyTick.004"),effect:'aid'},
 {id:'argument',title:SOSText("settlements_people_townlife.townLifeDailyTick.005"),text:SOSText("settlements_people_townlife.townLifeDailyTick.006"),effect:'mediate'},
 {id:'refugees',title:SOSText("settlements_people_townlife.townLifeDailyTick.007"),text:SOSText("settlements_people_townlife.townLifeDailyTick.008"),effect:'aid'},
 {id:'theft',title:SOSText("settlements_people_townlife.townLifeDailyTick.009"),text:SOSText("settlements_people_townlife.townLifeDailyTick.010"),effect:'security'},
 {id:'funeral',title:SOSText("settlements_people_townlife.townLifeDailyTick.011"),text:SOSText("settlements_people_townlife.townLifeDailyTick.012"),effect:'quiet'},
 {id:'celebration',title:SOSText("settlements_people_townlife.townLifeDailyTick.013"),text:SOSText("settlements_people_townlife.townLifeDailyTick.014"),effect:'prosperity'},
 {id:'inspection',title:SOSText("settlements_people_townlife.townLifeDailyTick.015"),text:SOSText("settlements_people_townlife.townLifeDailyTick.016"),effect:'control'},
 {id:'red_petitions',title:SOSText("settlements_people_townlife.townLifeDailyTick.017"),text:SOSText("settlements_people_townlife.townLifeDailyTick.018"),effect:'mediate',region:'redstone',places:['sengia']},
 {id:'lock_search',title:SOSText("settlements_people_townlife.townLifeDailyTick.019"),text:SOSText("settlements_people_townlife.townLifeDailyTick.020"),effect:'mediate',region:'redstone',places:['lockwood']},
 {id:'grain_count',title:SOSText("settlements_people_townlife.townLifeDailyTick.021"),text:SOSText("settlements_people_townlife.townLifeDailyTick.022"),effect:'mediate',region:'redstone',places:['briarlake']},
 {id:'glen_claim',title:SOSText("settlements_people_townlife.townLifeDailyTick.023"),text:SOSText("settlements_people_townlife.townLifeDailyTick.024"),effect:'aid',region:'redstone',places:['glenbrook']},
 {id:'tyr_roster',title:SOSText("settlements_people_townlife.townLifeDailyTick.025"),text:SOSText("settlements_people_townlife.townLifeDailyTick.026"),effect:'mediate',region:'redstone',places:['tyrdon']},
 {id:'pyre_drill',title:SOSText("settlements_people_townlife.townLifeDailyTick.027"),text:SOSText("settlements_people_townlife.townLifeDailyTick.028"),effect:'security',region:'redstone',places:['pyreglade']},
 {id:'gray_delay',title:SOSText("settlements_people_townlife.townLifeDailyTick.029"),text:SOSText("settlements_people_townlife.townLifeDailyTick.030"),effect:'mediate',region:'redstone',places:['grayhaven']}
];
function settlementEvent(locId){ensureWorldState();const e=state.world.settlementEvents[locId];return e&&e.expiresDay>=state.world.day?e:null}
function createSettlementEvent(locId,force=false){
 ensureWorldState();const ss=settlementState(locId),existing=settlementEvent(locId);if(existing&&!force)return existing;if(!force&&!chance(.22))return null;
 const regional=SETTLEMENT_EVENT_TYPES.filter(e=>e.region==='redstone'&&e.places?.includes(locId)),generic=SETTLEMENT_EVENT_TYPES.filter(e=>!e.region&&!(locId==='redoubt'&&e.id==='market')),pool=regional.length&&chance(.65)?regional:generic,t=pick(pool),e={id:uid(),type:t.id,title:t.title,text:t.text,effect:t.effect,createdDay:state.world.day,expiresDay:state.world.day+rnd(1,3),resolved:false};
 if(t.id==='refugees')e.size=rnd(2,5);
 if(t.id==='market'&&ss.prosperity<25)e.title=SOSText("settlements_people_townlife.createSettlementEvent.001");
 state.world.settlementEvents[locId]=e;recordWorldHistory(`${worldLocation(locId).name}: ${e.title}.`,'info',SOSText("settlements_people_townlife.createSettlementEvent.002"));return e
}
function resolveSettlementEvent(locId,choice){
 const e=settlementEvent(locId);if(!e||e.resolved)return showWorldArea();const ss=settlementState(locId);let text='',tone='info';
 if(e.type==='refugees'&&choice==='hall_lodging'){
   if(locId!=='shantium')return resolveSettlementEvent(locId,'local_lodging');
   const need=Math.max(2,e.size||3),hallProvider=SOSServices.accommodation.provider(locId,'hall',need),admit=hallProvider.canOffer?homeAdmitTemporaryLodging(SOSText("settlements_people_townlife.resolveSettlementEvent.016"),need,`townlife:${e.id}`):{ok:false,reason:hallProvider.available<need?'beds':'supplies',...hallProvider};
   if(!admit.ok&&admit.reason==='beds')return actionResult(SOSText("hall_life_visitors_diplomacy.homeAudienceResult.017"),SOSText("hall_life_visitors_diplomacy.homeAudienceResult.018",need,need===1?'':'s',admit.available,admit.total),'info',modalCurrentReturn(()=>showSettlementSpecial(locId)));
   if(!admit.ok)return actionResult(SOSText("hall_life_visitors_diplomacy.homeAudienceResult.019"),SOSText("hall_life_visitors_diplomacy.homeAudienceResult.020"),'bad',modalCurrentReturn(()=>showSettlementSpecial(locId)));
   changeLocalReputation(locId,2,SOSText("settlements_people_townlife.resolveSettlementEvent.017"));ss.prosperity=Math.min(100,ss.prosperity+1);text=SOSText("settlements_people_townlife.resolveSettlementEvent.018",need,need===1?'':'s');tone='good'
 }else if(e.type==='refugees'&&choice==='local_lodging'){
   SOSServices.accommodation.record(SOSServices.accommodation.provider(locId,'referral',Math.max(2,e.size||3)),{name:e.title,size:Math.max(2,e.size||3),purpose:'referred_shelter',sourceId:`townlife:${e.id}`,cost:0});changeLocalReputation(locId,1,SOSText("settlements_people_townlife.resolveSettlementEvent.019"));ss.prosperity=Math.min(100,ss.prosperity+1);text=SOSText("settlements_people_townlife.resolveSettlementEvent.020",worldLocation(locId).name);tone='good'
 }else if(choice==='help'){
   if(e.type==='glen_claim'&&redstoneCompanionPolicy('red_adjutant')==='accountable'){changeLocalReputation(locId,2,SOSText("settlements_people_townlife.resolveSettlementEvent.001"));ss.prosperity=Math.min(100,ss.prosperity+1);text=SOSText("settlements_people_townlife.resolveSettlementEvent.002");tone='good'}
   else if(e.effect==='aid'){const cost=Math.min(state.gold,10);state.gold-=cost;changeLocalReputation(locId,2,SOSText("settlements_people_townlife.resolveSettlementEvent.003"));ss.prosperity=Math.min(100,ss.prosperity+1);text=SOSText("settlements_people_townlife.resolveSettlementEvent.004",cost);tone='good'}
   else if(e.effect==='security'){ss.security=Math.min(100,ss.security+2);changeLocalReputation(locId,1,SOSText("settlements_people_townlife.resolveSettlementEvent.005"));text=SOSText("settlements_people_townlife.resolveSettlementEvent.006");tone='good'}
   else {changeLocalReputation(locId,1,SOSText("settlements_people_townlife.resolveSettlementEvent.007"));text=SOSText("settlements_people_townlife.resolveSettlementEvent.008");tone='good'}
 }else if(choice==='mediate'){
   const policyBonus=(e.type==='lock_search'&&redstoneCompanionPolicy('red_lockrunner')==='council')||(e.type==='grain_count'&&['reserve','compact'].includes(redstoneCompanionPolicy('red_grainwarden')))||(e.type==='tyr_roster'&&localReputation('tyrdon')>=3)?4:0;
   const roll=rnd(1,20)+stat(state,'cha')+Math.floor(localReputation(locId)/3)+policyBonus;if(roll>=15){changeLocalReputation(locId,2,SOSText("settlements_people_townlife.resolveSettlementEvent.009"));text=policyBonus?'The existing local policy gives both sides a rule they can actually apply, and the dispute settles without inventing a new exception.':SOSText("settlements_people_townlife.resolveSettlementEvent.010");tone='good'}else{text=SOSText("settlements_people_townlife.resolveSettlementEvent.011");tone='bad'}
 }else if(choice==='participate'){ss.prosperity=Math.min(100,ss.prosperity+1);changeLocalReputation(locId,1,SOSText("settlements_people_townlife.resolveSettlementEvent.012"));text=SOSText("settlements_people_townlife.resolveSettlementEvent.013");tone='good'}
 else {text=SOSText("settlements_people_townlife.resolveSettlementEvent.014")}
 e.resolved=true;e.resolvedDay=state.world.day;recordWorldHistory(`${worldLocation(locId).name}: ${e.title} — ${text}`,tone,SOSText("settlements_people_townlife.resolveSettlementEvent.015"));save();actionResult(e.title,text,tone,showWorldArea)
}
function settlementEventHTML(locId){
 const e=settlementEvent(locId);if(!e||e.resolved)return'';
 let options='',extra='';
 if(e.type==='refugees'){
   const need=Math.max(2,e.size||3);
   if(locId==='shantium'){const offer=SOSServices.accommodation.provider(locId,'hall',need);extra=homeLodgingNoteHTML(need);options=SOSText("settlements_people_townlife.settlementEventHTML.002",offer.canOffer?'':'disabled',homeLodgingOfferDetail(need))}
   else options=SOSText("settlements_people_townlife.settlementEventHTML.003",esc(worldLocation(locId).name));
 }else options=e.effect==='mediate'?'<button data-settleevent="mediate">Try to Mediate</button><button data-settleevent="ignore">Stay Out of It</button>':e.effect==='quiet'?'<button data-settleevent="participate">Pay Respect</button><button data-settleevent="ignore">Continue</button>':e.effect==='prosperity'?'<button data-settleevent="participate">Spend Time Here</button><button data-settleevent="ignore">Continue</button>':SOSText("settlements_people_townlife.settlementEventHTML.001");
 return `<div class="settlement-event-card"><b>${esc(e.title)}</b><p>${esc(e.text)}</p>${extra}<div class="choice-list compact">${options}</div></div>`
}
function wireSettlementEvent(locId){document.querySelectorAll('[data-settleevent]').forEach(b=>b.onclick=()=>resolveSettlementEvent(locId,b.dataset.settleevent))}
function settlementWelcomeText(locId){
 const rep=localReputation(locId);if(rep>=12)return SOSText("settlements_people_townlife.settlementWelcomeText.001");if(rep>=7)return SOSText("settlements_people_townlife.settlementWelcomeText.002");if(rep>=3)return SOSText("settlements_people_townlife.settlementWelcomeText.003");if(rep<=-6)return SOSText("settlements_people_townlife.settlementWelcomeText.004");if(rep<=-2)return SOSText("settlements_people_townlife.settlementWelcomeText.005");return SOSText("settlements_people_townlife.settlementWelcomeText.006")
}
function npcMemoryAdd(id,text,opinion=0){
 const r=npcRelationshipState(id);r.memory.push({day:state.world.day,text,opinion});r.memory=r.memory.slice(-6);r.opinion=clamp((r.opinion||0)+opinion,-10,10)
}
function npcMemorySummary(id){
 const r=npcRelationshipState(id),latest=r.memory.slice(-2);return latest.length?latest.map(x=>x.text).join(' '):SOSText("settlements_people_townlife.npcMemorySummary.001")
}
function npcAttitudeLabel(r){const score=(r.familiarity||0)+(r.opinion||0);return score>=14?'Personally Loyal':score>=9?'Warm':score>=5?'Friendly':score>=1?'Civil':score<=-5?'Hostile':SOSText("settlements_people_townlife.npcAttitudeLabel.001")}
function npcLocalProblem(npc,locId,r){
 if(state.world.day-r.lastProblemDay<5)return actionResult(SOSText("settlements_people_townlife.npcLocalProblem.001"),SOSText("settlements_people_townlife.npcLocalProblem.002",npc.name),'info',()=>showSettlementNPCConversation(locId,npc.id));
 const ss=settlementState(locId),role=(npc.role||'').toLowerCase();r.lastProblemDay=state.world.day;
 if(locationRegion(locId)==='redstone'){const special=sengiaNpcPersonalProblem(npc,locId,r);if(special){save();return actionResult(SOSText("settlements_people_townlife.npcLocalProblem.003"),special,'good',()=>showSettlementNPCConversation(locId,npc.id))}}
 if(role.includes('healer')){const need=narrativeTradeGoodCount('medicine')>0;if(need){consumeNarrativeTradeGood('medicine',1);npcMemoryAdd(npc.id,SOSText("settlements_people_townlife.npcLocalProblem.004"),2);changeLocalReputation(locId,2,SOSText("settlements_people_townlife.npcLocalProblem.005",npc.name));progressSettlementProblem(locId,1,SOSText("settlements_people_townlife.npcLocalProblem.006",npc.name));save();return actionResult(SOSText("settlements_people_townlife.npcLocalProblem.007"),SOSText("settlements_people_townlife.npcLocalProblem.008",npc.name),'good',()=>showSettlementNPCConversation(locId,npc.id))}}
 if(role.includes('trader')||role.includes('broker')||role.includes('factor')||role.includes('quartermaster')){const need=narrativeTradeGoodCount('food')>0;if(need){consumeNarrativeTradeGood('food',1);ss.prosperity=Math.min(100,ss.prosperity+2);npcMemoryAdd(npc.id,SOSText("settlements_people_townlife.npcLocalProblem.009"),2);changeLocalReputation(locId,1,SOSText("settlements_people_townlife.npcLocalProblem.010",npc.name));progressSettlementProblem(locId,1,SOSText("settlements_people_townlife.npcLocalProblem.011",npc.name));save();return actionResult(SOSText("settlements_people_townlife.npcLocalProblem.012"),SOSText("settlements_people_townlife.npcLocalProblem.013",npc.name),'good',()=>showSettlementNPCConversation(locId,npc.id))}}
 if(role.includes('guard')||role.includes('watch')||role.includes('sergeant')||role.includes('officer')){ss.security=Math.min(100,ss.security+2);npcMemoryAdd(npc.id,SOSText("settlements_people_townlife.npcLocalProblem.014"),1);changeLocalReputation(locId,1,SOSText("settlements_people_townlife.npcLocalProblem.015",npc.name));progressSettlementProblem(locId,1,SOSText("settlements_people_townlife.npcLocalProblem.016",npc.name));advanceWorldDays(1,SOSText("settlements_people_townlife.npcLocalProblem.017",npc.name));save();return actionResult(SOSText("settlements_people_townlife.npcLocalProblem.018"),SOSText("settlements_people_townlife.npcLocalProblem.019",npc.name),'good',()=>showSettlementNPCConversation(locId,npc.id))}
 npcMemoryAdd(npc.id,SOSText("settlements_people_townlife.npcLocalProblem.020"),1);changeLocalReputation(locId,1,SOSText("settlements_people_townlife.npcLocalProblem.021",npc.name));advanceWorldDays(1,SOSText("settlements_people_townlife.npcLocalProblem.022",npc.name));save();actionResult(SOSText("settlements_people_townlife.npcLocalProblem.023"),SOSText("settlements_people_townlife.npcLocalProblem.024",npc.name),'good',()=>showSettlementNPCConversation(locId,npc.id))
}


