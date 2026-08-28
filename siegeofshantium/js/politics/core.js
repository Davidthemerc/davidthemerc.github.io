function factionPairKey(a,b){return [a,b].sort().join('|')}
function ensureFactionDiplomacy(){if(!state?.world)return;state.world.factionDiplomacy=state.world.factionDiplomacy||{};for(const [k,v] of Object.entries(FACTION_RELATION_DEFAULTS)){const [a,b]=k.split('|'),key=factionPairKey(a,b);if(state.world.factionDiplomacy[key]===undefined)state.world.factionDiplomacy[key]=v}}
function factionRelation(a,b){if(a===b)return 5;ensureFactionDiplomacy();return state.world.factionDiplomacy[factionPairKey(a,b)]??0}
function factionRelationLabel(v){return v<=-4?'Hostile':v<=-2?'Tense':v<2?'Neutral':v<4?'Cooperative':SOSText("politics_core.factionRelationLabel.001")}
function adjustFactionRelation(a,b,delta,reason=''){if(a===b)return;ensureFactionDiplomacy();const k=factionPairKey(a,b),old=state.world.factionDiplomacy[k]||0;state.world.factionDiplomacy[k]=clamp(old+delta,-5,5);if(reason&&old!==state.world.factionDiplomacy[k])recordWorldHistory(`${a} / ${b}: ${reason} (${factionRelationLabel(state.world.factionDiplomacy[k])}).`,delta>=0?'good':'bad','diplomacy')}
function adjustFactionStanding(faction,delta,reason=''){if(state.world.factionStanding[faction]===undefined)state.world.factionStanding[faction]=0;state.world.factionStanding[faction]=clamp(state.world.factionStanding[faction]+delta,-12,20);if(reason)recordWorldHistory(SOSText("politics_core.adjustFactionStanding.001",majorFaction(faction).name,reason,delta>0?'+':'',delta),delta>=0?'good':'bad','faction')}
function factionPrivileges(faction){
 const s=state.world.factionStanding[faction]||0,p=[];
 if(s>=3)p.push(SOSText("politics_core.factionPrivileges.001"));
 if(s>=6)p.push(SOSText("politics_core.factionPrivileges.002"));
 if(s>=9)p.push(SOSText("politics_core.factionPrivileges.003"));
 if(s>=12)p.push(SOSText("politics_core.factionPrivileges.004"));
 if(s<=-3)p.push(SOSText("politics_core.factionPrivileges.005"));
 if(s<=-7)p.push(SOSText("politics_core.factionPrivileges.006"));
 if(s<=-10)p.push(SOSText("politics_core.factionPrivileges.007"));
 return p
}
function factionTradeModifier(locId){
 const reps=factionRepresentativesAt(locId);let mod=1;
 for(const [f,v] of reps){const s=state.world.factionStanding[f]||0;if(v>=4&&s>=6)mod-=.04;if(v>=7&&s<=-7)mod+=.07}
 return clamp(mod,.82,1.25)
}
function factionPrisonerAid(faction){const s=state.world.factionStanding[faction]||0;return s>=9?2:s>=6?1:0}

const SETTLEMENT_LEADERSHIP_DEFAULTS={
 shantium:{leader:SOSText("politics_core.factionPrisonerAid.001"),style:SOSText("politics_core.factionPrisonerAid.002"),autonomy:10},
 river:{leader:SOSText("politics_core.factionPrisonerAid.003"),style:SOSText("politics_core.factionPrisonerAid.004"),autonomy:8},
 stonebridge:{leader:SOSText("politics_core.factionPrisonerAid.005"),style:SOSText("politics_core.factionPrisonerAid.006"),autonomy:9},
 northgate:{leader:SOSText("politics_core.factionPrisonerAid.007"),style:SOSText("politics_core.factionPrisonerAid.008"),autonomy:6},
 southroad:{leader:SOSText("politics_core.factionPrisonerAid.009"),style:SOSText("politics_core.factionPrisonerAid.010"),autonomy:8},
 redoubt:{leader:SOSText("politics_core.factionPrisonerAid.011"),style:SOSText("politics_core.factionPrisonerAid.012"),autonomy:2},
 zion:{leader:SOSText("politics_core.factionPrisonerAid.013"),style:SOSText("politics_core.factionPrisonerAid.014"),autonomy:6},
 lowcreek:{leader:SOSText("politics_core.factionPrisonerAid.015"),style:SOSText("politics_core.factionPrisonerAid.016"),autonomy:7},
 ebonheart:{leader:SOSText("politics_core.factionPrisonerAid.017"),style:SOSText("politics_core.factionPrisonerAid.018"),autonomy:6},
 norwegian:{leader:SOSText("politics_core.factionPrisonerAid.019"),style:SOSText("politics_core.factionPrisonerAid.020"),autonomy:8},
 winterstone:{leader:SOSText("politics_core.factionPrisonerAid.021"),style:SOSText("politics_core.factionPrisonerAid.022"),autonomy:5},
 skybreak:{leader:SOSText("politics_core.factionPrisonerAid.023"),style:SOSText("politics_core.factionPrisonerAid.024"),autonomy:3},
 sengia:{leader:SOSText("politics_core.factionPrisonerAid.025"),style:SOSText("politics_core.factionPrisonerAid.026"),autonomy:3},
 lockwood:{leader:SOSText("politics_core.factionPrisonerAid.027"),style:SOSText("politics_core.factionPrisonerAid.028"),autonomy:4},
 grayhaven:{leader:SOSText("politics_core.factionPrisonerAid.029"),style:SOSText("politics_core.factionPrisonerAid.030"),autonomy:4},
 briarlake:{leader:SOSText("politics_core.factionPrisonerAid.031"),style:SOSText("politics_core.factionPrisonerAid.032"),autonomy:6},
 glenbrook:{leader:SOSText("politics_core.factionPrisonerAid.033"),style:SOSText("politics_core.factionPrisonerAid.034"),autonomy:5},
 tyrdon:{leader:SOSText("politics_core.factionPrisonerAid.035"),style:SOSText("politics_core.factionPrisonerAid.036"),autonomy:6},
 pyreglade:{leader:SOSText("politics_core.factionPrisonerAid.037"),style:SOSText("politics_core.factionPrisonerAid.038"),autonomy:6}
};
function ensurePoliticalState(){
 if(!state?.world)return;const p=state.world.politics||(state.world.politics={settlements:{},treaties:{},roadRights:{},history:[]});
 p.settlements=p.settlements||{};p.treaties=p.treaties||{};p.roadRights=p.roadRights||{};p.history=Array.isArray(p.history)?p.history:[];p.powerEvidence=p.powerEvidence||{};p.factionPriorities=p.factionPriorities||{};
 for(const loc of WORLD_LOCATIONS.filter(x=>state.world.settlements?.[x.id])){
  if(!p.settlements[loc.id]){const d=SETTLEMENT_LEADERSHIP_DEFAULTS[loc.id]||{leader:SOSText("politics_core.ensurePoliticalState.001",loc.name),style:SOSText("politics_core.ensurePoliticalState.002"),autonomy:7};p.settlements[loc.id]={leader:d.leader,style:d.style,autonomy:d.autonomy,pressure:{},pending:null,lastShiftDay:0,lastCouncilDay:0,alignment:state.world.settlements[loc.id].control||loc.faction||SOSText("politics_core.ensurePoliticalState.003"),lean:{},alignmentHistory:[]}}
  if(!p.roadRights[loc.id])p.roadRights[loc.id]={controller:state.world.settlements[loc.id].control||loc.faction||SOSText("politics_core.ensurePoliticalState.004"),openness:7,toll:0,lastChangeDay:0};const ps=p.settlements[loc.id];if(!ps.lean)ps.lean={};if(!Array.isArray(ps.alignmentHistory))ps.alignmentHistory=[];if(!ps.civic||typeof ps.civic!=='object')ps.civic={};if(!Array.isArray(ps.civicHistory))ps.civicHistory=[];if(!Number.isFinite(ps.lastCivicActionDay))ps.lastCivicActionDay=-99;for(const f of Object.keys(OPEN_WORLD_FACTIONS)){if(!ps.civic[f]||typeof ps.civic[f]!=='object')ps.civic[f]={support:0,organization:0,legitimacy:0,merchant:0,security:0,lastActionDay:-99};const c=ps.civic[f];for(const k of ['support','organization','legitimacy','merchant','security'])if(!Number.isFinite(c[k]))c[k]=0;if(!Number.isFinite(c.lastActionDay))c.lastActionDay=-99}if(!p.powerEvidence[loc.id])p.powerEvidence[loc.id]={}
 }
}
function politicalSettlement(locId){ensurePoliticalState();return state.world.politics.settlements[locId]}
function roadRights(locId){ensurePoliticalState();return state.world.politics.roadRights[locId]}
function politicalHistory(text,type='info'){ensurePoliticalState();state.world.politics.history.push({day:state.world.day,text,type});state.world.politics.history=state.world.politics.history.slice(-50);recordWorldHistory(text,type,'politics')}

const FACTION_POWER_CHANNELS={
 security:SOSText("politics_core.politicalHistory.001"),trade:SOSText("politics_core.politicalHistory.002"),contracts:SOSText("politics_core.politicalHistory.003"),personnel:SOSText("politics_core.politicalHistory.004"),politics:SOSText("politics_core.politicalHistory.005"),roads:SOSText("politics_core.politicalHistory.006"),guardian:SOSText("politics_core.politicalHistory.007")
};
function powerEvidence(locId,faction){
 ensurePoliticalState();const P=state.world.politics.powerEvidence;if(!P[locId])P[locId]={};if(!P[locId][faction])P[locId][faction]=[];return P[locId][faction]
}
function recordFactionPower(locId,faction,channel,amount,reason,days=8){
 if(!OPEN_WORLD_FACTIONS[faction]||!state.world.settlements[locId])return;
 const rows=powerEvidence(locId,faction);rows.push({day:state.world.day,expiresDay:state.world.day+days,channel,amount,reason});while(rows.length>14)rows.shift();
 const ps=politicalSettlement(locId);ps.lean[faction]=clamp((ps.lean[faction]||0)+amount*.35,-6,12)
}
function activeFactionPowerEvidence(locId,faction){
 return powerEvidence(locId,faction).filter(x=>x.expiresDay>=state.world.day)
}
function factionPowerEvidenceScore(locId,faction){return activeFactionPowerEvidence(locId,faction).reduce((n,x)=>n+x.amount,0)}
function factionPowerReasons(locId,faction,limit=4){return activeFactionPowerEvidence(locId,faction).slice().sort((a,b)=>b.day-a.day).slice(0,limit)}
function settlementLeanScore(locId,faction){
 const ps=politicalSettlement(locId),presence=factionPresenceAt(locId)[faction]||0,evidence=factionPowerEvidenceScore(locId,faction),standing=state.world.factionStanding[faction]||0,c=localPoliticalFactionState(locId,faction);
 return (ps.lean[faction]||0)+presence*.45+evidence*.5+c.support*.45+c.legitimacy*.30+c.merchant*.18+(standing>=8?1:standing<=-7?-1:0)
}
function settlementLeanTier(locId,faction){
 const n=settlementLeanScore(locId,faction);return n>=10?'Deeply aligned':n>=7?'Strongly leaning':n>=4?'Leaning':n>=2?'Open to influence':n<=-2?'Resistant':SOSText("politics_core.settlementLeanTier.001")
}
function rankedSettlementLeans(locId){
 return Object.keys(OPEN_WORLD_FACTIONS).map(f=>({f,score:settlementLeanScore(locId,f),tier:settlementLeanTier(locId,f)})).filter(x=>Math.abs(x.score)>=.5).sort((a,b)=>b.score-a.score)
}

function localGuardianFactionRelationState(locId,faction){
 ensurePoliticalState();const P=state.world.politics;
 if(!P.guardianFactionRelations||typeof P.guardianFactionRelations!=='object')P.guardianFactionRelations={};
 if(!P.guardianFactionRelations[locId])P.guardianFactionRelations[locId]={};
 if(!P.guardianFactionRelations[locId][faction])P.guardianFactionRelations[locId][faction]={value:0,lastDay:-99,history:[]};
 const r=P.guardianFactionRelations[locId][faction];
 if(!Array.isArray(r.history))r.history=[];
 if(!Number.isFinite(r.value))r.value=0;
 return r
}
function localGuardianFactionRelation(locId,faction){return localGuardianFactionRelationState(locId,faction).value||0}
function localGuardianFactionRelationLabel(v){
 return v>=8?'Trusted locally':v>=4?'Well regarded locally':v>=1?'Favorable locally':v<=-8?'Hostile locally':v<=-4?'Strained locally':v<=-1?'Uneasy locally':SOSText("politics_core.localGuardianFactionRelationLabel.001")
}
function adjustLocalGuardianFactionRelation(locId,faction,delta,reason=''){
 if(!state.world?.settlements?.[locId]||!OPEN_WORLD_FACTIONS[faction]||!delta)return 0;
 const r=localGuardianFactionRelationState(locId,faction),before=r.value||0;
 r.value=clamp(before+delta,-20,20);r.lastDay=state.world.day;
 const actual=r.value-before;
 if(actual&&reason){r.history.push({day:state.world.day,delta:actual,text:reason});r.history=r.history.slice(-30)}
 return actual
}
function guardianFactionIncidentState(){
 ensurePoliticalState();const P=state.world.politics;
 if(!Array.isArray(P.guardianFactionIncidents))P.guardianFactionIncidents=[];
 return P.guardianFactionIncidents
}
function recordGuardianFactionIncident(locId,faction,text,{severity=1,witnessed=true,kind='road_incident',incidentId=null,actorRefs=[]}={}){
 let linked=incidentId?worldIncident(incidentId):null;if(!linked){linked=createWorldIncident(kind,{location:locId,severity,actors:actorRefs.map(ref=>({ref})),political:{faction,witnessed},meta:{guardianFactionIncident:true,text}});incidentId=linked.id}else updateWorldIncident(incidentId,{severity:Math.max(linked.severity||1,severity),political:{faction,witnessed}});
 const row={id:'gfinc_'+uid(),day:state.world.day,locId,faction,text,severity,witnessed,kind,incidentId};
 guardianFactionIncidentState().push(row);state.world.politics.guardianFactionIncidents=guardianFactionIncidentState().slice(-60);
 politicalHistory(`${worldLocation(locId).name}: ${text}`,severity>=3?'bad':'info');
 return row
}
function localPoliticalFactionState(locId,faction){
 const ps=politicalSettlement(locId);if(!ps.civic)ps.civic={};if(!ps.civic[faction])ps.civic[faction]={support:0,organization:0,legitimacy:0,merchant:0,security:0,lastActionDay:-99};return ps.civic[faction]
}
function politicalSupportLabel(v){return v>=82?'Very strong':v>=68?'Strong':v>=54?'Competitive':v>=40?'Mixed':v>=25?'Weak':SOSText("politics_core.politicalSupportLabel.001")}
function politicalOrganizationLabel(v){return v>=80?'Deeply organized':v>=62?'Well organized':v>=45?'Established':v>=28?'Developing':SOSText("politics_core.politicalOrganizationLabel.001")}
function politicalLegitimacyLabel(v){return v>=80?'Widely accepted':v>=62?'Strong':v>=45?'Contested but credible':v>=28?'Questioned':SOSText("politics_core.politicalLegitimacyLabel.001")}
function localPoliticalProfile(locId,faction){
 const ps=politicalSettlement(locId),ss=settlementState(locId),c=localPoliticalFactionState(locId,faction),presence=factionPresenceAt(locId)[faction]||0,evidence=activeFactionPowerEvidence(locId,faction),social=npcFactionWeightAt(locId,faction)+travelerFactionInfluenceAt(locId,faction),control=settlementControl(locId),lean=ps.lean[faction]||0;
 const by=ch=>evidence.filter(x=>x.channel===ch).reduce((n,x)=>n+x.amount,0);
 const publicSupport=clamp(Math.round(38+lean*4.2+social*4.2+c.support*5+(control===faction?5:0)),0,100);
 const organization=clamp(Math.round(10+presence*6+by('personnel')*5+by('contracts')*4+by('politics')*3+c.organization*7),0,100);
 const legitimacy=clamp(Math.round(42+(control===faction?18:0)+c.legitimacy*6+(faction===SOSText("politics_core.localPoliticalProfile.001")&&ps.autonomy>=7?6:0)+(faction===SOSText("politics_core.localPoliticalProfile.002")&&locId==='shantium'?8:0)+(state.world.factionStanding[faction]||0)*.8),0,100);
 const merchantBacking=clamp(Math.round(22+ss.prosperity*.18+by('trade')*7+c.merchant*7+(faction===SOSText("politics_core.localPoliticalProfile.003")?12:0)+(faction===SOSText("politics_core.localPoliticalProfile.004")?7:0)),0,100);
 const securityInfluence=clamp(Math.round(12+presence*5+by('security')*7+c.security*7+([SOSText("politics_core.localPoliticalProfile.005"),SOSText("politics_core.localPoliticalProfile.006"),SOSText("politics_core.localPoliticalProfile.007"),SOSText("politics_core.localPoliticalProfile.008")].includes(faction)?ss.security*.2:0)),0,100);
 const overall=Math.round(publicSupport*.31+organization*.25+legitimacy*.20+merchantBacking*.12+securityInfluence*.12);
 return {faction,publicSupport,organization,legitimacy,merchantBacking,securityInfluence,overall,presence,social}
}
function localPoliticalDrivers(locId,faction,limit=5){
 const rows=[],loc=worldLocation(locId),ss=settlementState(locId),ps=politicalSettlement(locId),c=localPoliticalFactionState(locId,faction),control=settlementControl(locId),social=npcFactionWeightAt(locId,faction)+travelerFactionInfluenceAt(locId,faction);
 if(control===faction)rows.push(SOSText("politics_core.localPoliticalDrivers.001",majorFaction(faction).short,loc.name));
 if(social>=2)rows.push(SOSText("politics_core.localPoliticalDrivers.002"));
 if(c.support>=1)rows.push(SOSText("politics_core.localPoliticalDrivers.003"));
 if(c.organization>=1)rows.push(SOSText("politics_core.localPoliticalDrivers.004"));
 if(c.legitimacy>=1)rows.push(SOSText("politics_core.localPoliticalDrivers.005"));
 if(c.merchant>=1)rows.push(SOSText("politics_core.localPoliticalDrivers.006"));
 if(c.security>=1)rows.push(SOSText("politics_core.localPoliticalDrivers.007"));
 if(control===faction&&ss.security<42)rows.push(SOSText("politics_core.localPoliticalDrivers.008"));
 if(control===faction&&ss.prosperity<42)rows.push(SOSText("politics_core.localPoliticalDrivers.009"));
 if(control===faction&&roadRights(locId).openness<=3)rows.push(SOSText("politics_core.localPoliticalDrivers.010"));
 for(const r of factionPowerReasons(locId,faction,3))rows.push(`${FACTION_POWER_CHANNELS[r.channel]||r.channel}: ${r.reason}.`);
 return [...new Set(rows)].slice(0,limit)
}
function localPoliticalFactions(locId){
 const control=settlementControl(locId),presence=factionPresenceAt(locId),social=factionSocialInfluenceSummary(locId),set=new Set([control]);
 for(const [f,v] of Object.entries(presence))if(OPEN_WORLD_FACTIONS[f]&&v>=1)set.add(f);
 for(const x of social)if(x.n+x.t>=.5)set.add(x.f);
 for(const x of rankedSettlementLeans(locId).slice(0,4))set.add(x.f);
 return [...set].filter(f=>OPEN_WORLD_FACTIONS[f]).sort((a,b)=>localPoliticalProfile(locId,b).overall-localPoliticalProfile(locId,a).overall)
}
function localPoliticalRival(locId,faction){
 return localPoliticalFactions(locId).filter(f=>f!==faction).sort((a,b)=>settlementLeanScore(locId,b)-settlementLeanScore(locId,a))[0]||null
}
function localPoliticalHistory(locId,limit=6){return (politicalSettlement(locId).civicHistory||[]).slice(-limit).reverse()}

const INTERNAL_FACTION_BLOCS={
 Redstone:[
  {id:'security',name:SOSText("politics_core.localPoliticalHistory.001"),policy:SOSText("politics_core.localPoliticalHistory.002"),desc:SOSText("politics_core.localPoliticalHistory.003")},
  {id:'civic',name:SOSText("politics_core.localPoliticalHistory.004"),policy:SOSText("politics_core.localPoliticalHistory.005"),desc:SOSText("politics_core.localPoliticalHistory.006")},
  {id:'commercial',name:SOSText("politics_core.localPoliticalHistory.007"),policy:SOSText("politics_core.localPoliticalHistory.008"),desc:SOSText("politics_core.localPoliticalHistory.009")},
  {id:'hardline',name:SOSText("politics_core.localPoliticalHistory.010"),policy:SOSText("politics_core.localPoliticalHistory.011"),desc:SOSText("politics_core.localPoliticalHistory.012")}
 ],
 Independent:[
  {id:'localist',name:SOSText("politics_core.localPoliticalHistory.013"),policy:SOSText("politics_core.localPoliticalHistory.014"),desc:SOSText("politics_core.localPoliticalHistory.015")},
  {id:'commercial',name:SOSText("politics_core.localPoliticalHistory.016"),policy:SOSText("politics_core.localPoliticalHistory.017"),desc:SOSText("politics_core.localPoliticalHistory.018")},
  {id:'organizers',name:SOSText("politics_core.localPoliticalHistory.019"),policy:SOSText("politics_core.localPoliticalHistory.020"),desc:SOSText("politics_core.localPoliticalHistory.021")}
 ],
 Coalition:[
  {id:'scouts',name:SOSText("politics_core.localPoliticalHistory.022"),policy:SOSText("politics_core.localPoliticalHistory.023"),desc:SOSText("politics_core.localPoliticalHistory.024")},
  {id:'civic',name:SOSText("politics_core.localPoliticalHistory.025"),policy:SOSText("politics_core.localPoliticalHistory.026"),desc:SOSText("politics_core.localPoliticalHistory.027")},
  {id:'trade',name:SOSText("politics_core.localPoliticalHistory.028"),policy:SOSText("politics_core.localPoliticalHistory.029"),desc:SOSText("politics_core.localPoliticalHistory.030")}
 ],
 Bluestone:[
  {id:'wardens',name:SOSText("politics_core.localPoliticalHistory.031"),policy:SOSText("politics_core.localPoliticalHistory.032"),desc:SOSText("politics_core.localPoliticalHistory.033")},
  {id:'civic',name:SOSText("politics_core.localPoliticalHistory.034"),policy:SOSText("politics_core.localPoliticalHistory.035"),desc:SOSText("politics_core.localPoliticalHistory.036")},
  {id:'trade',name:SOSText("politics_core.localPoliticalHistory.037"),policy:SOSText("politics_core.localPoliticalHistory.038"),desc:SOSText("politics_core.localPoliticalHistory.039")}
 ],
 Shantium:[
  {id:'hall',name:SOSText("politics_core.localPoliticalHistory.040"),policy:SOSText("politics_core.localPoliticalHistory.041"),desc:SOSText("politics_core.localPoliticalHistory.042")},
  {id:'civic',name:SOSText("politics_core.localPoliticalHistory.043"),policy:SOSText("politics_core.localPoliticalHistory.044"),desc:SOSText("politics_core.localPoliticalHistory.045")},
  {id:'market',name:SOSText("politics_core.localPoliticalHistory.046"),policy:SOSText("politics_core.localPoliticalHistory.047"),desc:SOSText("politics_core.localPoliticalHistory.048")}
 ],
 Spawn:[
  {id:'travel',name:SOSText("politics_core.localPoliticalHistory.049"),policy:SOSText("politics_core.localPoliticalHistory.050"),desc:SOSText("politics_core.localPoliticalHistory.051")},
  {id:'trade',name:SOSText("politics_core.localPoliticalHistory.052"),policy:SOSText("politics_core.localPoliticalHistory.053"),desc:SOSText("politics_core.localPoliticalHistory.054")},
  {id:'defense',name:SOSText("politics_core.localPoliticalHistory.055"),policy:SOSText("politics_core.localPoliticalHistory.056"),desc:SOSText("politics_core.localPoliticalHistory.057")}
 ],
 Mercenaries:[
  {id:'captains',name:SOSText("politics_core.localPoliticalHistory.058"),policy:SOSText("politics_core.localPoliticalHistory.059"),desc:SOSText("politics_core.localPoliticalHistory.060")},
  {id:'brokers',name:SOSText("politics_core.localPoliticalHistory.061"),policy:SOSText("politics_core.localPoliticalHistory.062"),desc:SOSText("politics_core.localPoliticalHistory.063")},
  {id:'veterans',name:SOSText("politics_core.localPoliticalHistory.064"),policy:SOSText("politics_core.localPoliticalHistory.065"),desc:SOSText("politics_core.localPoliticalHistory.066")}
 ]
};
function internalFactionPoliticsState(locId,faction){
 const ps=politicalSettlement(locId);if(!ps.internalPolitics||typeof ps.internalPolitics!=='object')ps.internalPolitics={};const defs=INTERNAL_FACTION_BLOCS[faction]||INTERNAL_FACTION_BLOCS.Independent;
 if(!ps.internalPolitics[faction]||typeof ps.internalPolitics[faction]!=='object'){
  const influence={};for(const b of defs)influence[b.id]=28+rnd(0,8);
  const ss=settlementState(locId),control=settlementControl(locId);
  if(faction===SOSText("politics_core.internalFactionPoliticsState.001")){
   if(ss.security<48&&influence.security!==undefined)influence.security+=12;
   if(ps.autonomy>=7&&influence.civic!==undefined)influence.civic+=12;
   if(ss.prosperity<48&&influence.commercial!==undefined)influence.commercial+=10;
   if(control===faction&&politicalPressure(locId,SOSText("politics_core.internalFactionPoliticsState.002"))>=8&&influence.hardline!==undefined)influence.hardline+=10;
  }else{
   if(ps.autonomy>=7&&influence.civic!==undefined)influence.civic+=8;
   if(ps.autonomy>=7&&influence.localist!==undefined)influence.localist+=10;
   if(ss.prosperity<48){for(const id of ['commercial','trade','market','brokers'])if(influence[id]!==undefined)influence[id]+=8}
   if(ss.security<48){for(const id of ['security','wardens','defense','scouts'])if(influence[id]!==undefined)influence[id]+=8}
  }
  const dominant=[...defs].sort((a,b)=>(influence[b.id]||0)-(influence[a.id]||0))[0]?.id||defs[0].id;
  ps.internalPolitics[faction]={influence,dominant,policy:dominant,lastActionDay:-99,lastTickDay:state.world.day,history:[],guardianBacked:null,policySinceDay:state.world.day}
 }
 const s=ps.internalPolitics[faction];if(!s.influence)s.influence={};for(const b of defs)if(!Number.isFinite(s.influence[b.id]))s.influence[b.id]=28+rnd(0,8);if(!Array.isArray(s.history))s.history=[];if(!Number.isFinite(s.lastActionDay))s.lastActionDay=-99;if(!Number.isFinite(s.lastTickDay))s.lastTickDay=state.world.day;if(!Number.isFinite(s.policySinceDay))s.policySinceDay=state.world.day;
 s.dominant=[...defs].sort((a,b)=>(s.influence[b.id]||0)-(s.influence[a.id]||0))[0]?.id||defs[0].id;if(!defs.some(b=>b.id===s.policy)){s.policy=s.dominant;s.policySinceDay=state.world.day}return s
}
function internalFactionBloc(faction,id){return (INTERNAL_FACTION_BLOCS[faction]||[]).find(x=>x.id===id)||null}
function internalFactionAccess(locId,faction){
 const standing=state.world.factionStanding[faction]||0;return standing>=0&&(standing>=6||politicalCapital(locId,faction)>=12)
}
function internalFactionPolicyEffect(locId,faction,apply=false){
 const s=internalFactionPoliticsState(locId,faction),bloc=internalFactionBloc(faction,s.policy)||internalFactionBloc(faction,s.dominant),c=localPoliticalFactionState(locId,faction),ss=settlementState(locId),ps=politicalSettlement(locId);if(!bloc)return {text:SOSText("politics_core.internalFactionPolicyEffect.001")};
 let text='',support=0,legitimacy=0,org=0,merchant=0,security=0;
 if(['security','wardens','defense','hall','scouts'].includes(bloc.id)){security=.10;org=.05;if(ss.security<48){support=.06;legitimacy=.05;text=SOSText("politics_core.internalFactionPolicyEffect.002")}else if(ps.autonomy>=7){support=-.05;legitimacy=-.06;text=SOSText("politics_core.internalFactionPolicyEffect.003")}else text=SOSText("politics_core.internalFactionPolicyEffect.004")}
 else if(['civic','localist'].includes(bloc.id)){support=.09;legitimacy=.11;security=-.025;text=SOSText("politics_core.internalFactionPolicyEffect.005")}
 else if(['commercial','trade','market','brokers'].includes(bloc.id)){merchant=.12;support=.04;if(ss.prosperity<45)legitimacy=.05;text=SOSText("politics_core.internalFactionPolicyEffect.006")}
 else{org=.10;support=.03;if(bloc.id==='hardline'){security=.06;legitimacy=-.10;if(ps.autonomy>=6)support=-.08;text=SOSText("politics_core.internalFactionPolicyEffect.007")}else text=SOSText("politics_core.internalFactionPolicyEffect.008")}
 if(apply){c.support=clamp(c.support+support,-6,12);c.legitimacy=clamp(c.legitimacy+legitimacy,-6,12);c.organization=clamp(c.organization+org,-6,12);c.merchant=clamp(c.merchant+merchant,-6,12);c.security=clamp(c.security+security,-6,12)}
 return {bloc,text,support,legitimacy,org,merchant,security}
}
function simulateInternalFactionPoliticsDay(locId){
 for(const faction of localPoliticalFactions(locId)){
  const s=internalFactionPoliticsState(locId,faction);if(s.lastTickDay===state.world.day)continue;s.lastTickDay=state.world.day;internalFactionPolicyEffect(locId,faction,true);const defs=INTERNAL_FACTION_BLOCS[faction]||[];
  for(const b of defs){const v=s.influence[b.id]||0;if(v>62)s.influence[b.id]=Math.max(0,v-.08);else if(v<18)s.influence[b.id]=Math.min(100,v+.05)}
  if(chance(.06)){const b=pick(defs);s.influence[b.id]=clamp((s.influence[b.id]||0)+.4,0,100)}
  s.dominant=[...defs].sort((a,b)=>(s.influence[b.id]||0)-(s.influence[a.id]||0))[0]?.id||s.dominant;
  const dominantLead=(s.influence[s.dominant]||0)-(s.influence[s.policy]||0),policyAge=state.world.day-(s.policySinceDay||state.world.day);
  if(dominantLead>14&&policyAge>=4&&chance(.12)){s.policy=s.dominant;s.policySinceDay=state.world.day;s.history.push({day:state.world.day,type:'policy_shift',text:SOSText("politics_core.simulateInternalFactionPoliticsDay.001",internalFactionBloc(faction,s.policy)?.name||'A new bloc')});s.history=s.history.slice(-30)}
 }
}
function executeInternalFactionAction(locId,faction,action,blocId=null){
 if(!internalFactionAccess(locId,faction))return showInternalFactionPolitics(locId,faction);const s=internalFactionPoliticsState(locId,faction),defs=INTERNAL_FACTION_BLOCS[faction]||[],bloc=internalFactionBloc(faction,blocId)||internalFactionBloc(faction,s.dominant),before=politicalOutcomeSnapshot(locId,[faction]),standing=state.world.factionStanding[faction]||0;let cost=0,text='',tone='good';
 if(action==='back'){cost=10;if(politicalCapital(locId,faction)<cost)return actionResult(SOSText("politics_core.executeInternalFactionAction.001"),SOSText("politics_core.executeInternalFactionAction.002",bloc.name,cost),'bad',()=>showInternalFactionPolitics(locId,faction));adjustPoliticalCapital(locId,faction,-cost,SOSText("politics_core.executeInternalFactionAction.003",bloc.name));s.influence[bloc.id]=clamp((s.influence[bloc.id]||0)+9,0,100);s.guardianBacked=bloc.id;text=SOSText("politics_core.executeInternalFactionAction.004",bloc.name,majorFaction(faction).short)}
 if(action==='lobby'){cost=7;if(politicalCapital(locId,faction)<cost)return actionResult(SOSText("politics_core.executeInternalFactionAction.005"),SOSText("politics_core.executeInternalFactionAction.006",cost),'bad',()=>showInternalFactionPolitics(locId,faction));adjustPoliticalCapital(locId,faction,-cost,SOSText("politics_core.executeInternalFactionAction.007"));const roll=rnd(1,20)+stat(state,'cha')+Math.floor(standing/3);if(roll>=15){s.influence[bloc.id]=clamp((s.influence[bloc.id]||0)+6,0,100);s.policy=bloc.id;s.policySinceDay=state.world.day;text=SOSText("politics_core.executeInternalFactionAction.008",majorFaction(faction).short,bloc.name)}else{tone='info';text=SOSText("politics_core.executeInternalFactionAction.009",bloc.name);adjustPoliticalCapital(locId,faction,-1,SOSText("politics_core.executeInternalFactionAction.010"))}}
 if(action==='compromise'){cost=12;if(politicalCapital(locId,faction)<cost)return actionResult(SOSText("politics_core.executeInternalFactionAction.011"),SOSText("politics_core.executeInternalFactionAction.012",cost),'bad',()=>showInternalFactionPolitics(locId,faction));adjustPoliticalCapital(locId,faction,-cost,SOSText("politics_core.executeInternalFactionAction.013"));const top=[...defs].sort((a,b)=>(s.influence[b.id]||0)-(s.influence[a.id]||0)).slice(0,2),roll=rnd(1,20)+stat(state,'cha')+Math.floor(localReputation(locId)/3);if(roll>=16){top.forEach(b=>s.influence[b.id]=clamp((s.influence[b.id]||0)+2,0,100));const c=localPoliticalFactionState(locId,faction);c.legitimacy=clamp(c.legitimacy+1.1,-6,12);c.support=clamp(c.support+.55,-6,12);text=SOSText("politics_core.executeInternalFactionAction.014",top.map(x=>x.name).join(' and '))}else{tone='bad';s.influence[s.dominant]=clamp((s.influence[s.dominant]||0)+3,0,100);text=SOSText("politics_core.executeInternalFactionAction.015")}}
 if(action==='public_challenge'){cost=5;if(politicalCapital(locId,faction)<cost)return actionResult(SOSText("politics_core.executeInternalFactionAction.016"),SOSText("politics_core.executeInternalFactionAction.017",cost),'bad',()=>showInternalFactionPolitics(locId,faction));adjustPoliticalCapital(locId,faction,-cost,SOSText("politics_core.executeInternalFactionAction.018"));const old=internalFactionBloc(faction,s.policy),challengingCurrent=bloc.id===s.policy,alternative=challengingCurrent?[...defs].filter(b=>b.id!==s.policy).sort((a,b)=>(s.influence[b.id]||0)-(s.influence[a.id]||0))[0]:bloc,targetBloc=alternative||bloc,roll=rnd(1,20)+stat(state,'cha')+Math.floor(localReputation(locId)/2);if(roll>=17){s.policy=targetBloc.id;s.policySinceDay=state.world.day;s.influence[targetBloc.id]=clamp((s.influence[targetBloc.id]||0)+5,0,100);localPoliticalFactionState(locId,faction).support=clamp(localPoliticalFactionState(locId,faction).support+.8,-6,12);text=SOSText("politics_core.executeInternalFactionAction.019",old?.name||'current leadership',targetBloc.name)}else{tone='bad';adjustFactionStanding(faction,-1,SOSText("politics_core.executeInternalFactionAction.020"));text=SOSText("politics_core.executeInternalFactionAction.021",old?.name||bloc.name)}}
 if(action==='reassign'){cost=22;if(standing<8||politicalCapital(locId,faction)<cost)return actionResult(SOSText("politics_core.executeInternalFactionAction.022"),SOSText("politics_core.executeInternalFactionAction.023"),'bad',()=>showInternalFactionPolitics(locId,faction));const oldDominant=s.dominant;adjustPoliticalCapital(locId,faction,-cost,SOSText("politics_core.executeInternalFactionAction.024"));s.influence[oldDominant]=clamp((s.influence[oldDominant]||0)-10,0,100);s.influence[bloc.id]=clamp((s.influence[bloc.id]||0)+8,0,100);s.policy=bloc.id;s.policySinceDay=state.world.day;adjustPoliticalDebt(locId,faction,3,SOSText("politics_core.executeInternalFactionAction.025"));text=SOSText("politics_core.executeInternalFactionAction.026",majorFaction(faction).short,internalFactionBloc(faction,oldDominant)?.name||'the previous local leadership',bloc.name)}
 if(action==='withdraw'){cost=25;if(standing<10||politicalCapital(locId,faction)<cost)return actionResult(SOSText("politics_core.executeInternalFactionAction.027"),SOSText("politics_core.executeInternalFactionAction.028"),'bad',()=>showInternalFactionPolitics(locId,faction));adjustPoliticalCapital(locId,faction,-cost,SOSText("politics_core.executeInternalFactionAction.029"));adjustFactionStanding(faction,-1,SOSText("politics_core.executeInternalFactionAction.030"));s.policy=bloc.id;s.policySinceDay=state.world.day;s.influence[bloc.id]=clamp((s.influence[bloc.id]||0)+10,0,100);localPoliticalFactionState(locId,faction).legitimacy=clamp(localPoliticalFactionState(locId,faction).legitimacy+.5,-6,12);text=SOSText("politics_core.executeInternalFactionAction.031",bloc.name)}
 s.dominant=[...defs].sort((a,b)=>(s.influence[b.id]||0)-(s.influence[a.id]||0))[0]?.id||s.dominant;s.lastActionDay=state.world.day;s.history.push({day:state.world.day,type:action,blocId:bloc?.id,text});s.history=s.history.slice(-30);recordLocalPoliticalAction(locId,faction,'internal_faction',text);advanceWorldDays(1,SOSText("politics_core.executeInternalFactionAction.032",majorFaction(faction).short,worldLocation(locId).name));const after=politicalOutcomeSnapshot(locId,[faction]);save();showPoliticalOutcome(SOSText("politics_core.executeInternalFactionAction.033"),text,before,after,{tone,notes:[SOSText("politics_core.executeInternalFactionAction.034",internalFactionBloc(faction,s.policy)?.name||s.policy),SOSText("politics_core.executeInternalFactionAction.035",internalFactionBloc(faction,s.dominant)?.name||s.dominant)],back:()=>showInternalFactionPolitics(locId,faction)})
}
function showInternalFactionPolitics(locId=state.world.location,faction=null){modalRouteEnter(SOSText("politics_core.showInternalFactionPolitics.001"),Array.from(arguments));
 const factions=localPoliticalFactions(locId);
 if(!faction){overlay(SOSText("politics_core.showInternalFactionPolitics.002",esc(worldLocation(locId).name),factions.map(f=>{const s=internalFactionPoliticsState(locId,f),access=internalFactionAccess(locId,f),policy=internalFactionBloc(f,s.policy);return `<button class="political-action-faction" data-internalfaction="${f}" ${access?'':'disabled'}><span><b>${esc(majorFaction(f).name)}</b><small>${access?`Current policy: ${esc(policy?.name||s.policy)}`:'Requires standing 6 or 12 Political Capital'}</small></span><b>${politicalCapital(locId,f).toFixed(0)} PC</b></button>`}).join('')),true);document.querySelectorAll('[data-internalfaction]').forEach(b=>b.onclick=()=>showInternalFactionPolitics(locId,b.dataset.internalfaction));$('#internalPoliticsBack').onclick=()=>showSettlementPolitics(locId);return}
 const s=internalFactionPoliticsState(locId,faction),defs=INTERNAL_FACTION_BLOCS[faction]||[],policy=internalFactionBloc(faction,s.policy),effect=internalFactionPolicyEffect(locId,faction,false),standing=state.world.factionStanding[faction]||0,recent=s.history.slice(-6).reverse();
 overlay(SOSText("politics_core.showInternalFactionPolitics.003",esc(worldLocation(locId).name),esc(majorFaction(faction).name),esc(policy?.name||s.policy),esc(effect.text),standing>=0?'+':'',standing,politicalCapital(locId,faction).toFixed(1),defs.map(b=>`<div class="card internal-faction-bloc"><b>${esc(b.name)}</b> — influence ${Math.round(s.influence[b.id]||0)}${s.dominant===b.id?' • DOMINANT':''}${s.policy===b.id?' • SETTING POLICY':''}<p>${esc(b.desc)}</p><small>${esc(b.policy)}</small><div><button data-internalback="${b.id}">Back Bloc — 10 PC</button> <button data-internallobby="${b.id}">Lobby for Policy — 7 PC</button> <button data-internalpublic="${b.id}">${s.policy===b.id?'Publicly Challenge This Policy':'Publicly Back This Policy'} — 5 PC</button></div></div>`).join(''),recent.map(x=>`<div class="card compact">Day ${x.day}: ${esc(x.text)}</div>`).join('')||'<p class="muted">No major Guardian intervention in internal faction affairs yet.</p>'),true);
 document.querySelectorAll('[data-internalback]').forEach(b=>b.onclick=()=>executeInternalFactionAction(locId,faction,'back',b.dataset.internalback));document.querySelectorAll('[data-internallobby]').forEach(b=>b.onclick=()=>executeInternalFactionAction(locId,faction,'lobby',b.dataset.internallobby));document.querySelectorAll('[data-internalpublic]').forEach(b=>b.onclick=()=>executeInternalFactionAction(locId,faction,'public_challenge',b.dataset.internalpublic));$('#internalCompromise').onclick=()=>executeInternalFactionAction(locId,faction,'compromise',s.dominant);$('#internalReassign').onclick=()=>showInternalBlocChooser(locId,faction,'reassign');$('#internalWithdraw').onclick=()=>showInternalBlocChooser(locId,faction,'withdraw');$('#internalFactionBack').onclick=()=>showInternalFactionPolitics(locId)
}
function showInternalBlocChooser(locId,faction,action){modalRouteEnter(SOSText("politics_core.showInternalBlocChooser.001"),Array.from(arguments));const defs=INTERNAL_FACTION_BLOCS[faction]||[];overlay(SOSText("politics_core.showInternalBlocChooser.002",defs.map(b=>`<button data-internalchoice="${b.id}"><b>${esc(b.name)}</b><br><small>${esc(b.policy)}</small></button>`).join('')),true);document.querySelectorAll('[data-internalchoice]').forEach(b=>b.onclick=()=>executeInternalFactionAction(locId,faction,action,b.dataset.internalchoice));$('#internalChoiceBack').onclick=()=>SOSServices.navigation.back(()=>showInternalFactionPolitics(locId,faction))}
