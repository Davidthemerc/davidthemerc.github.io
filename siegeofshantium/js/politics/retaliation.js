
/* v1.6.57.1 — Political Retaliation */
function politicalRetaliationState(){
 ensureWorldState();if(!state.world.politicalRetaliation||typeof state.world.politicalRetaliation!=='object')state.world.politicalRetaliation={};
 const R=state.world.politicalRetaliation;if(!R.locations)R.locations={};if(!Array.isArray(R.history))R.history=[];R.history=R.history.slice(-30);return R
}
function politicalRetaliationLocation(locId){
 const R=politicalRetaliationState();if(!R.locations[locId])R.locations[locId]={lastRollDay:-99,lastAttackDay:-99,lastSupportedFaction:null,lastHeat:0,lastPublicExposureDay:-99,lastActionRollKey:null};
 const L=R.locations[locId];if(!Number.isFinite(L.lastPublicExposureDay))L.lastPublicExposureDay=-99;if(L.lastActionRollKey===undefined)L.lastActionRollKey=null;return L
}
function politicalRetaliationActionWeight(action){
 const a=String(action||'');if(/political_raid|intimidation/.test(a))return 4.5;if(/covert/.test(a))return 3.5;if(/campaign_success|internal_faction/.test(a))return 2.5;if(/endorsement|rally|organize|petition|campaign/.test(a))return 1.8;return 1.2
}
function guardianPoliticalHeat(locId,faction){
 const rows=(politicalSettlement(locId).civicHistory||[]),day=state.world.day;
 let heat=0;for(const r of rows){if(r.faction!==faction)continue;const age=day-r.day;if(age<0||age>7)continue;const recency=age<=1?1.8:age<=3?1.25:age<=5?.7:.35;heat+=politicalRetaliationActionWeight(r.action)*recency}
 return Math.round(heat*10)/10
}
function guardianSupportedLocalFaction(locId){
 const factions=localPoliticalFactions(locId).filter(f=>OPEN_WORLD_FACTIONS[f]);let best=null;
 for(const f of factions){const heat=guardianPoliticalHeat(locId,f);if(!best||heat>best.heat)best={faction:f,heat}}
 return best&&best.heat>=2?best:null
}
function politicalRetaliationRival(locId,supported){
 const rivals=localPoliticalFactions(locId).filter(f=>f!==supported&&OPEN_WORLD_FACTIONS[f]).map(f=>({f,p:localPoliticalProfile(locId,f)}));
 rivals.sort((a,b)=>b.p.overall-a.p.overall);return rivals[0]||null
}
function politicalRetaliationChance(heat,overall){
 if(heat<5||overall<28)return 0;
 const burst=Math.max(0,heat-7),p=2+heat*1.15+burst*1.1+(overall-35)*.12;return clamp(Math.round(p),3,34)
}
function makePoliticalRetaliationGroup(locId,rival,heat){
 const count=clamp(2+Math.floor(heat/5)+rnd(0,2),2,7),members=[];
 const base=enemyByName('Mercenary')||enemyByName('Bandit');
 for(let i=0;i<count;i++)members.push(makeEnemy(base,Math.max(.82,DIFFICULTIES[state.difficulty].enemy*(.88+Math.min(.18,heat*.008))),Math.max(1,state.round)));
 return {id:uid(),name:'Masked Assailants',faction:'Unknown',route:'local',distance:0,speed:0,members,objective:heat>=15?'capture':'attack',status:'engaged',threat:Math.max(1,Math.ceil(count/2)),loot:Math.round(15+count*9),xp:18+count*8,commander:null,engaged:true,politicalRetaliation:true,politicalRetaliationFaction:rival.f,politicalRetaliationLocId:locId,politicalRetaliationHeat:heat,politicalRetaliationIdentified:false}
}
function queuePoliticalRetaliationExposure(locId=state.world.location,source='political_action'){
 if(!isOpenWorld()||!state.world?.settlements?.[locId])return false;
 const R=politicalRetaliationState();R.pendingExposure={locId,source,day:state.world.day,key:`${source}:${locId}:${state.world.day}:${uid()}`};return true
}
function consumePoliticalRetaliationExposure(){
 const R=politicalRetaliationState(),p=R.pendingExposure;if(!p)return false;R.pendingExposure=null;
 return maybeTriggerPoliticalRetaliation({locId:p.locId,source:p.source,key:p.key,allowModal:false})
}
function politicalRetaliationPublicExposureDue(locId=state.world.location){return isOpenWorld()&&!!state.world?.settlements?.[locId]&&politicalRetaliationLocation(locId).lastPublicExposureDay!==state.world.day}
function politicalRetaliationPublicExposure(locId=state.world.location){
 if(!politicalRetaliationPublicExposureDue(locId))return false;
 return maybeTriggerPoliticalRetaliation({locId,source:'public',allowModal:false})
}
function maybeTriggerPoliticalRetaliation(context={}){
 if(!isOpenWorld()||state.world?.captivity?.active||typeof combat!=='undefined'&&combat)return false;
 const source=context.source||null;if(source!=='public'&&source!=='political_action')return false;
 if((typeof modal!=='undefined'&&modal)&&context.allowModal!==true)return false;
 const locId=context.locId||state.world.location;if(locId!==state.world.location||!state.world.settlements?.[locId])return false;
 const L=politicalRetaliationLocation(locId);if(state.world.day-L.lastAttackDay<3)return false;
 if(source==='public'){if(L.lastPublicExposureDay===state.world.day)return false;L.lastPublicExposureDay=state.world.day}
 else{const key=context.key||`political_action:${locId}:${state.world.day}`;if(L.lastActionRollKey===key)return false;L.lastActionRollKey=key}
 const support=guardianSupportedLocalFaction(locId);if(!support){save();return false}const rival=politicalRetaliationRival(locId,support.faction);if(!rival){save();return false}
 const chancePct=politicalRetaliationChance(support.heat,rival.p.overall);L.lastSupportedFaction=support.faction;L.lastHeat=support.heat;
 if(!chancePct||rnd(1,100)>chancePct){save();return false}
 L.lastAttackDay=state.world.day;const gr=makePoliticalRetaliationGroup(locId,rival,support.heat);politicalRetaliationState().history.push({day:state.world.day,locId,supported:support.faction,attacker:rival.f,heat:support.heat,identified:false,outcome:'ambush',exposure:source});
 politicalRetaliationState().history=politicalRetaliationState().history.slice(-30);save();
 overlay(`<h2>You Are Ambushed</h2><p>Several armed figures emerge with unusual purpose and move directly for the Guardian. They carry no obvious faction colors.</p><div class="warning notice">Your recent political activity in ${esc(worldLocation(locId).name)} may have made you a target, but you have no proof of who sent them.</div><div class="dialog-footer"><button id="politicalRetaliationFight">Defend Yourself</button></div>`,true);
 $('#politicalRetaliationFight').onclick=()=>SOSServices.combat.launch(gr,{register:false});return true
}
function politicalRetaliationIdentify(gr,how='battle'){
 if(!gr?.politicalRetaliation||!gr.politicalRetaliationFaction)return null;gr.politicalRetaliationIdentified=true;const f=gr.politicalRetaliationFaction,R=politicalRetaliationState(),row=[...R.history].reverse().find(x=>x.day===state.world.day&&x.locId===gr.politicalRetaliationLocId&&x.attacker===f&&!x.identified);if(row){row.identified=true;row.identifiedHow=how}
 return f
}
function politicalRetaliationVictoryHTML(gr){
 if(!gr?.politicalRetaliation)return'';const identified=chance(.72)||gr.enemyYield==='surrender';
 if(identified){const f=politicalRetaliationIdentify(gr,'defeated attackers'),c=localPoliticalFactionState(gr.politicalRetaliationLocId,f);c.legitimacy=clamp(c.legitimacy-.7,-6,12);markLocalPoliticsDirty(gr.politicalRetaliationLocId);recordWorldHistory(`Evidence recovered after an attack on the Guardian ties the assailants to ${majorFaction(f).short} in ${worldLocation(gr.politicalRetaliationLocId).name}.`,'bad','politics');return `<div class="warning notice"><b>Attackers Identified — ${esc(majorFaction(f).short)}</b><br>Insignia, testimony, documents, or recognizable ties among the defeated attackers establish their local political affiliation. This does not necessarily prove which leader ordered the attack.</div>`}
 return `<div class="notice compact"><b>Likely Political Retaliation</b><br>The timing strongly suggests the ambush was political, but the defeated attackers provide no reliable proof of who ordered it.</div>`
}
function politicalRetaliationCaptivityReveal(c){
 if(!c?.politicalRetaliation||c.politicalRetaliationIdentified||!c.secretFaction)return null;
 if(c.turns<2)return null;c.politicalRetaliationIdentified=true;c.faction=c.secretFaction;const f=c.secretFaction,R=politicalRetaliationState(),row=[...R.history].reverse().find(x=>x.attacker===f&&!x.identified);if(row){row.identified=true;row.identifiedHow='captivity'}
 recordWorldHistory(`During captivity, the Guardian discovered that the masked attackers were acting for ${majorFaction(f).short}.`,'bad','politics');
 return `Enough details have accumulated to make the truth difficult to deny: your captors are acting for ${majorFaction(f).name}.`
}
