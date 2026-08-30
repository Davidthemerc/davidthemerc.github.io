function showFieldEncounter(id){modalRouteEnter(SOSText("events_field_runtime_navigation.showFieldEncounter.001"),Array.from(arguments));const e=state.fieldEncounters.find(x=>x.id===id);if(!e)return;const a=allyDef(e.allyId),t=fieldTemplate(e);overlay(SOSText("events_field_runtime_navigation.showFieldEncounter.002",esc(e.name),e.kind==='friendly'?'notable':'',e.kind==='friendly'?'FRIENDLY':'NEUTRAL',esc(e.text),esc(ROUTES.find(r=>r.id===e.route)?.name||e.route),e.distance,e.rescue?`<div class="warning notice">This contact is under attack. A rescue costs 1 field action.</div>`:`<div class="notice">Approaching and negotiating costs 1 field action.</div>`,state.roundActions<=0?'disabled':'',e.rescue?'Attempt Rescue':'Approach / Negotiate'));$('#fieldApproach').onclick=()=>resolveFieldEncounter(e);wireClose()}
function recruitFieldCompanion(e,origin){const a=allyDef(e.allyId);if(!a||state.allies.includes(a.id))return null;state.allies.push(a.id);state.party.members[a.id]=makePartyMember(a.id,origin,0);if(origin==='rescued')state.party.members[a.id].trust=Math.max(60,state.party.members[a.id].trust);if(state.party.active.length<partyLimit())state.party.active.push(a.id);chronicle(SOSText("events_field_runtime_navigation.recruitFieldCompanion.001"),SOSText("events_field_runtime_navigation.recruitFieldCompanion.002",a.name,origin==='rescued'?'rescued in the field':'met on the road'),'companion');return a}
function resolveFieldEncounter(e){const __encId=typeof e==='string'?e:(e?.id||null);if(__encId)resolveFieldEncounterOnce(__encId);if(state.roundActions<=0)return;state.roundActions--;const a=allyDef(e.allyId);if(e.rescue){const roll=rnd(1,12)+Math.floor(stat(state,'str')/3)+state.level+partyMembers(true).filter(m=>m.hp>0).length*2;if(roll>=9+Math.floor(state.round/3)){const joined=recruitFieldCompanion(e,'rescued');resolveFieldEncounterOnce(e.id);save();return actionResult(SOSText("events_field_runtime_navigation.resolveFieldEncounter.001"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.002",joined.name,joined.name),'good')}state.town.morale=Math.max(0,state.town.morale-1);e.expires=state.round;save();return actionResult(SOSText("events_field_runtime_navigation.resolveFieldEncounter.003"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.004",a.name),'bad')}const roll=rnd(1,12)+stat(state,'cha')+Math.floor(state.reputation/2);if(roll>=14+Math.floor(state.round/4)){const joined=recruitFieldCompanion(e,SOSText("events_field_runtime_navigation.resolveFieldEncounter.005"));resolveFieldEncounterOnce(e.id);save();return actionResult(SOSText("events_field_runtime_navigation.resolveFieldEncounter.006"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.007",joined.name),'good')}e.expires=state.round;save();actionResult(SOSText("events_field_runtime_navigation.resolveFieldEncounter.008"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.009",a.name),'info')}
const ACHIEVEMENTS=[
 ['first',SOSText("events_field_runtime_navigation.resolveFieldEncounter.010"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.011")],['step',SOSText("events_field_runtime_navigation.resolveFieldEncounter.012"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.013")],['people',SOSText("events_field_runtime_navigation.resolveFieldEncounter.014"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.015")],['stone',SOSText("events_field_runtime_navigation.resolveFieldEncounter.016"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.017")],['diplomat',SOSText("events_field_runtime_navigation.resolveFieldEncounter.018"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.019")],['horde',SOSText("events_field_runtime_navigation.resolveFieldEncounter.020"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.021")],['stands',SOSText("events_field_runtime_navigation.resolveFieldEncounter.022"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.023")],['untouched',SOSText("events_field_runtime_navigation.resolveFieldEncounter.024"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.025")],['last',SOSText("events_field_runtime_navigation.resolveFieldEncounter.026"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.027")],['rich',SOSText("events_field_runtime_navigation.resolveFieldEncounter.028"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.029")],
 ['veteran',SOSText("events_field_runtime_navigation.resolveFieldEncounter.030"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.031")],['hunter',SOSText("events_field_runtime_navigation.resolveFieldEncounter.032"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.033")],['builder',SOSText("events_field_runtime_navigation.resolveFieldEncounter.034"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.035")],['militia',SOSText("events_field_runtime_navigation.resolveFieldEncounter.036"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.037")],['merchant',SOSText("events_field_runtime_navigation.resolveFieldEncounter.038"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.039")],['survivor',SOSText("events_field_runtime_navigation.resolveFieldEncounter.040"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.041")],['ranger',SOSText("events_field_runtime_navigation.resolveFieldEncounter.042"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.043")],['legend',SOSText("events_field_runtime_navigation.resolveFieldEncounter.044"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.045")],['mercy',SOSText("events_field_runtime_navigation.resolveFieldEncounter.046"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.047")],['iron',SOSText("events_field_runtime_navigation.resolveFieldEncounter.048"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.049")],['siege',SOSText("events_field_runtime_navigation.resolveFieldEncounter.050"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.051")],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.052"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.053"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.054")],['hands',SOSText("events_field_runtime_navigation.resolveFieldEncounter.055"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.056")],['bareknuckle',SOSText("events_field_runtime_navigation.resolveFieldEncounter.057"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.058")]
].map(x=>({id:x[0],name:x[1],desc:x[2]}));

const EVENTS=[
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.059"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.060"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.061"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.062"),s=>{s.town.population+=14;s.town.food-=12;s.town.morale+=4;s.flags.compassion++;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.063"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.064"),s=>s.town.morale-=5],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.065"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.066"),s=>{s.town.population+=7;s.town.timber+=8;s.town.morale-=1;}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.067"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.068"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.069"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.070"),s=>{if(pay(s,45))s.town.food+=22;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.071"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.072"),s=>{if(pay(s,50))s.town.medicine+=14;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.073"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.074"),s=>{}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.075"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.076"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.077"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.078"),s=>{s.scouting++; if(chance(.2)){s.town.gate-=10;log(SOSText("events_field_runtime_navigation.resolveFieldEncounter.079"),'bad');}}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.080"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.081"),s=>{if(chance(.5))s.scouting++;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.082"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.083"),s=>s.town.morale++]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.084"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.085"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.086"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.087"),s=>{if(s.town.timber>=12)s.town.timber-=12;else{s.town.food-=10;s.town.medicine-=5;}}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.088"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.089"),s=>pay(s,55)],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.090"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.091"),s=>{s.town.food-=15;s.town.medicine-=6;}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.092"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.093"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.094"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.095"),s=>{s.town.militia+=8;s.town.food-=6;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.096"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.097"),s=>{s.town.militia+=4;s.town.morale+=2;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.098"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.099"),s=>{}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.100"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.101"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.102"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.103"),s=>{if(pay(s,45))s.town.gate+=20;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.104"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.105"),s=>s.flags.patrol=true],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.106"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.107"),s=>{if(chance(.6)){s.reputation+=2;}else s.town.gate-=12;}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.108"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.109"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.110"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.111"),s=>{if(pay(s,70)){s.town.morale+=7;s.flags.compassion++;}}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.112"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.113"),s=>{if(pay(s,35))s.town.morale+=3;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.114"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.115"),s=>{s.town.militia+=3;s.town.morale-=4;}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.116"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.117"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.118"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.119"),s=>{if(chance(.45))giveNamed(s); else s.xp+=45;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.120"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.121"),s=>s.gold+=85],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.122"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.123"),s=>s.town.morale+=5]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.124"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.125"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.126"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.127"),s=>diplomacyEvent(s)],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.128"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.129"),s=>{s.town.morale+=3;s.flags.enemyAnger++;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.130"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.131"),s=>{if(chance(.55)){delayEnemy(s,2);s.flags.diplomacy++;}else s.town.morale+=2;}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.132"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.133"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.134"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.135"),s=>{s.town.food+=10;s.town.morale-=12;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.136"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.137"),s=>{if(pay(s,75)){s.town.food+=20;s.town.morale+=3;}}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.138"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.139"),s=>{const r=Math.random();if(r<.5)s.town.food+=25;else if(r>.75)s.town.militia=Math.max(0,s.town.militia-rnd(2,5));}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.140"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.141"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.142"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.143"),s=>{s.town.medicine-=10;s.town.morale+=3;s.flags.compassion++;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.144"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.145"),s=>{s.town.morale-=3;s.town.population-=1;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.146"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.147"),s=>{if(pay(s,40))s.town.medicine-=3;}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.148"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.149"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.150"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.151"),s=>{s.town.militia=Math.max(0,s.town.militia-5);s.town.food+=10;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.152"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.153"),s=>s.town.morale-=4],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.154"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.155"),s=>s.town.morale+=1]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.156"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.157"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.158"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.159"),s=>{s.town.timber-=8;s.town.morale+=2;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.160"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.161"),s=>pay(s,30)],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.162"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.163"),s=>s.town.morale-=3]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.164"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.165"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.166"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.167"),s=>{s.guardian.hp=Math.max(1,s.guardian.hp-5);s.town.morale+=2;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.168"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.169"),s=>{s.gold+=20;s.town.morale-=1;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.170"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.171"),s=>s.town.morale+=chance(.5)?2:-3]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.172"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.173"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.174"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.175"),s=>delayEnemy(s,1)],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.176"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.177"),s=>s.town.food+=4],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.178"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.179"),s=>s.guardian.hp=Math.min(maxHP(s),s.guardian.hp+18)]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.180"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.181"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.182"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.183"),s=>{s.town.morale+=3;s.guardian.hp=Math.max(1,s.guardian.hp-4);}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.184"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.185"),s=>s.town.timber-=10],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.186"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.187"),s=>s.town.morale-=4]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.188"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.189"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.190"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.191"),s=>{s.town.medicine-=4;s.scouting++;s.flags.compassion++;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.192"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.193"),s=>{if(pay(s,25))s.town.morale+=2;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.194"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.195"),s=>s.flags.fullIntel=2]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.196"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.197"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.198"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.199"),s=>{s.gold+=35;s.town.medicine+=5;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.200"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.201"),s=>s.flags.finalCache=true],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.202"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.203"),s=>s.xp+=55]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.204"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.205"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.206"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.207"),s=>{s.town.militia+=12;s.relations.Bluestone+=3;s.flags.occupation++;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.208"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.209"),s=>{if(stat(s,'cha')>=10){s.town.militia+=7;s.relations.Bluestone+=1;}else s.town.morale-=2;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.210"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.211"),s=>s.town.morale+=3]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.212"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.213"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.214"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.215"),s=>{s.relations.Coalition+=2;s.town.morale+=2;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.216"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.217"),s=>{s.town.militia+=3;s.relations.Coalition-=1;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.218"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.219"),s=>{if(stat(s,'cha')>=9){s.relations.Coalition+=2;s.town.morale+=2;}}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.220"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.221"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.222"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.223"),s=>{s.relations.Spawn+=2;s.flags.compassion++;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.224"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.225"),s=>{s.town.food-=5;s.town.medicine+=5;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.226"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.227"),s=>s.relations.Spawn-=2]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.228"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.229"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.230"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.231"),s=>{if(pay(s,60))s.town.militia+=4;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.232"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.233"),s=>s.flags.shopPenalty=1],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.234"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.235"),s=>s.town.militia=Math.max(0,s.town.militia-3)]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.236"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.237"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.238"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.239"),s=>s.guardian.hp=Math.min(maxHP(s),s.guardian.hp+28)],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.240"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.241"),s=>s.xp+=40],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.242"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.243"),s=>{if(pay(s,10))s.town.morale+=3;}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.244"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.245"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.246"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.247"),s=>{s.town.morale+=4;s.relations.Redstone+=1;s.flags.compassion++;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.248"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.249"),s=>{if(chance(.5))s.town.food+=10;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.250"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.251"),s=>{s.town.militia++;s.town.morale-=2;}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.252"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.253"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.254"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.255"),s=>{if(chance(.65))s.town.timber+=15;else s.town.militia=Math.max(0,s.town.militia-2);}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.256"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.257"),s=>{s.guardian.hp=Math.max(1,s.guardian.hp-8);s.town.timber+=12;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.258"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.259"),s=>{s.town.population-=3;s.town.morale-=4;}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.260"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.261"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.262"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.263"),s=>{s.guardian.hp=Math.max(1,s.guardian.hp-6);s.town.stone+=18;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.264"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.265"),s=>{if(pay(s,35))s.town.stone+=14;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.266"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.267"),s=>{}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.268"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.269"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.270"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.271"),s=>{if(chance(.65)){s.scouting++;delayEnemy(s,1);}else log(SOSText("events_field_runtime_navigation.resolveFieldEncounter.272"),'info');}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.273"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.274"),s=>{if(pay(s,15))s.scouting++;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.275"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.276"),s=>{}]]],
 [SOSText("events_field_runtime_navigation.resolveFieldEncounter.277"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.278"),[[SOSText("events_field_runtime_navigation.resolveFieldEncounter.279"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.280"),s=>{s.town.food-=4;s.town.morale+=8;s.flags.compassion++;}],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.281"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.282"),s=>s.town.morale+=3],[SOSText("events_field_runtime_navigation.resolveFieldEncounter.283"),SOSText("events_field_runtime_navigation.resolveFieldEncounter.284"),s=>s.town.morale-=2]]]
].map((e,i)=>({id:'ev'+i,title:e[0],text:e[1],choices:e[2]}));

const EVENT_TIER_WEIGHT={routine:7,notable:4,major:2,rare:1};
function eventFlags(){return state.eventState.flags}
function eventFlag(k,v){if(arguments.length===1)return eventFlags()[k];eventFlags()[k]=v;return v}
function scheduleEvent(id,round){if(!state.eventState.scheduled.some(x=>x.id===id))state.eventState.scheduled.push({id,round})}
function hasGuardianClass(c){return guardianClass()===c}
function partyClassMember(c){return partyMembers(false).find(m=>(m.className||allyDef(m.id)?.className)===c)}
function hasAnyClass(c){return hasGuardianClass(c)||!!partyClassMember(c)}
function spendResource(key,n){if(key==='gold'){if(state.gold<n)return false;state.gold-=n;return true}if((state.town[key]||0)<n)return false;state.town[key]-=n;return true}
function dynamicChoiceAvailable(choice){try{return !choice.available||choice.available(state)}catch(e){return false}}
function markDynamicUsed(ev){if(!ev.repeatable&&!state.eventState.used.includes(ev.id))state.eventState.used.push(ev.id)}
function eventSummaryFlags(){const f=eventFlags(),out=[];if(f.refugees==='admitted')out.push(SOSText("events_field_runtime_navigation.eventSummaryFlags.001"));if(f.refugees==='skilled')out.push(SOSText("events_field_runtime_navigation.eventSummaryFlags.002"));if(f.refugees==='refused')out.push(SOSText("events_field_runtime_navigation.eventSummaryFlags.003"));if(f.merchantsProtected)out.push(SOSText("events_field_runtime_navigation.eventSummaryFlags.004"));if(f.rationing)out.push(SOSText("events_field_runtime_navigation.eventSummaryFlags.005"));if(f.tomasSupport)out.push(SOSText("events_field_runtime_navigation.eventSummaryFlags.006"));if(f.maraSupport)out.push(SOSText("events_field_runtime_navigation.eventSummaryFlags.007"));if(f.coalitionLiaison)out.push(SOSText("events_field_runtime_navigation.eventSummaryFlags.008"));return out}

const DYNAMIC_EVENTS=[
 {id:'refugees_arrive',tier:'major',minRound:1,maxRound:5,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.009"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.010"),condition:s=>!eventFlag('refugees'),choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.011"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.012"),available:s=>s.town.food>=12,apply:s=>{s.town.population+=14;s.town.food-=12;s.town.morale+=4;s.flags.compassion++;eventFlag('refugees','admitted');scheduleEvent('refugees_return',s.round+3)}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.013"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.014"),apply:s=>{s.town.population+=7;s.town.timber+=8;s.town.morale-=1;eventFlag('refugees','skilled');scheduleEvent('refugees_return',s.round+3)}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.015"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.016"),apply:s=>{s.town.morale-=5;eventFlag('refugees','refused');scheduleEvent('refugees_return',s.round+3)}}]},
 {id:'refugees_return',tier:'notable',scheduledOnly:true,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.017"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.018"),condition:s=>!!eventFlag('refugees')&&!eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.019")),choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.020"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.021"),available:s=>eventFlag('refugees')!=='refused'&&s.town.food>=4,apply:s=>{s.town.militia+=5;s.town.food-=4;s.town.morale+=2;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.022"),'volunteers')}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.023"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.024"),available:s=>eventFlag('refugees')==='skilled'||eventFlag('refugees')==='admitted',apply:s=>{s.town.timber+=10;s.town.walls=Math.min(s.town.maxWalls,s.town.walls+8);eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.025"),'repairs')}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.026"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.027"),available:s=>eventFlag('refugees')==='refused'&&s.town.food>=4,apply:s=>{s.town.population+=4;s.town.food-=4;s.town.morale+=2;s.flags.compassion++;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.028"),SOSText("events_field_runtime_navigation.eventSummaryFlags.029"))}}]},
 {id:'merchant_escort',tier:'notable',minRound:2,maxRound:8,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.030"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.031"),condition:s=>!eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.032")),choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.033"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.034"),available:s=>hasAnyClass(SOSText("events_field_runtime_navigation.eventSummaryFlags.035")),apply:s=>{const m=partyClassMember(SOSText("events_field_runtime_navigation.eventSummaryFlags.036"));if(m&&chance(.22))m.hp=Math.max(1,m.hp-rnd(5,14));eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.037"),'ranger');eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.038"),true);scheduleEvent('merchant_return',s.round+2);s.reputation+=2}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.039"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.040"),available:s=>s.town.militia>=4,apply:s=>{s.town.militia-=4;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.041"),'militia');eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.042"),true);scheduleEvent('merchant_return',s.round+2)}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.043"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.044"),available:s=>s.gold>=40,apply:s=>{s.gold-=40;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.045"),'paid');eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.046"),true);scheduleEvent('merchant_return',s.round+2)}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.047"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.048"),apply:s=>eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.049"),'declined')}]},
 {id:'merchant_return',tier:'notable',scheduledOnly:true,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.050"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.051"),condition:s=>eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.052"))&&!eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.053")),choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.054"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.055"),apply:s=>{s.town.food+=14;s.town.medicine+=6;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.056"),'supplies')}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.057"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.058"),apply:s=>{s.flags.marketFavor=(s.flags.marketFavor||0)+1;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.059"),'stock');refreshShopStock()}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.060"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.061"),apply:s=>{gainGold(70);s.reputation++;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.062"),'gold')}}]},
 {id:'tomas_crews',tier:'notable',minRound:3,maxRound:10,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.063"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.064"),condition:s=>!eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.065"))&&(s.town.walls<s.town.maxWalls*.85||s.town.timber<20),choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.066"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.067"),available:s=>s.town.food>=5,apply:s=>{s.town.food-=5;s.town.timber+=10;s.town.walls=Math.min(s.town.maxWalls,s.town.walls+10);eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.068"),'supported');eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.069"),true)}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.070"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.071"),available:s=>hasAnyClass(SOSText("events_field_runtime_navigation.eventSummaryFlags.072")),apply:s=>{s.town.walls=Math.min(s.town.maxWalls,s.town.walls+14);s.town.morale+=2;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.073"),'warden');eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.074"),true)}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.075"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.076"),apply:s=>{s.town.militia+=2;s.town.morale-=2;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.077"),'militia')}}]},
 {id:'perrin_warning',tier:'routine',minRound:2,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.078"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.079"),condition:s=>s.groups.some(g=>g.distance<=2)&&!eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.080")+s.round),repeatable:true,choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.081"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.082"),available:s=>hasAnyClass(SOSText("events_field_runtime_navigation.eventSummaryFlags.083")),apply:s=>{s.flags.fullIntel=Math.max(s.flags.fullIntel,2);eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.084")+s.round,true)}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.085"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.086"),available:s=>hasGuardianClass(SOSText("events_field_runtime_navigation.eventSummaryFlags.087"))?s.guardian.stamina>=8:!!partyClassMember(SOSText("events_field_runtime_navigation.eventSummaryFlags.088"))&&partyClassMember(SOSText("events_field_runtime_navigation.eventSummaryFlags.089")).stamina>=8,apply:s=>{if(hasGuardianClass(SOSText("events_field_runtime_navigation.eventSummaryFlags.090")))s.guardian.stamina=Math.max(0,s.guardian.stamina-8);else{const m=partyClassMember(SOSText("events_field_runtime_navigation.eventSummaryFlags.091"));if(m)m.stamina=Math.max(0,m.stamina-8)}s.flags.fullIntel=Math.max(s.flags.fullIntel,2);eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.092")+s.round,true)}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.093"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.094"),apply:s=>{s.scouting++;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.095")+s.round,true)}}]},
 {id:'eddas_rationing',tier:'major',minRound:3,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.096"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.097"),condition:s=>s.town.food<28&&!eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.098")),choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.099"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.100"),apply:s=>{s.town.food+=12;s.town.morale-=6;eventFlag('rationing',true);eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.101"),'ration')}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.102"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.103"),available:s=>s.gold>=65,apply:s=>{s.gold-=65;s.town.food+=24;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.104"),'buy')}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.105"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.106"),available:s=>s.town.morale>=60,apply:s=>{s.town.food+=12;s.town.morale+=2;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.107"),true);eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.108"),'community')}}]},
 {id:'mara_civilians',tier:'routine',minRound:3,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.109"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.110"),condition:s=>s.town.morale>=72&&!eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.111")+s.round),repeatable:true,choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.112"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.113"),apply:s=>{s.town.food+=5;s.town.medicine+=2;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.114")+s.round,true);eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.115"),true)}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.116"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.117"),apply:s=>{s.town.timber+=5;s.town.walls=Math.min(s.town.maxWalls,s.town.walls+5);eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.118")+s.round,true)}}]},
 {id:'sabotage_hunt',tier:'major',minRound:4,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.119"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.120"),condition:s=>(s.flags.enemyIntel||0)>0&&!eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.121")),choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.122"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.123"),available:s=>hasAnyClass(SOSText("events_field_runtime_navigation.eventSummaryFlags.124")),apply:s=>{s.flags.enemyIntel=Math.max(0,s.flags.enemyIntel-2);s.reputation+=2;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.125"),'ranger')}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.126"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.127"),available:s=>hasAnyClass(SOSText("events_field_runtime_navigation.eventSummaryFlags.128")),apply:s=>{s.flags.enemyIntel=Math.max(0,s.flags.enemyIntel-2);s.xp+=35;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.129"),'wizard')}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.130"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.131"),available:s=>s.town.militia>=2,apply:s=>{s.town.militia-=2;s.town.morale-=4;s.flags.enemyIntel=Math.max(0,s.flags.enemyIntel-1);eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.132"),'militia')}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.133"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.134"),apply:s=>eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.135"),'wait')}]},
 {id:'coalition_liaison',tier:'notable',minRound:4,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.136"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.137"),condition:s=>s.relations.Coalition>=2&&!eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.138")),choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.139"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.140"),apply:s=>{s.relations.Coalition++;s.scouting++;s.reputation++;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.141"),true)}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.142"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.143"),available:s=>hasGuardianClass(SOSText("events_field_runtime_navigation.eventSummaryFlags.144"))||stat(s,'cha')>=10,apply:s=>{s.relations.Coalition++;s.town.militia+=2;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.145"),'limited')}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.146"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.147"),apply:s=>{s.town.morale++;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.148"),'declined')}}]},
 {id:'fever_crisis',tier:'major',minRound:4,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.149"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.150"),condition:s=>s.town.population>130&&s.town.medicine<18&&!eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.151")),choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.152"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.153"),available:s=>s.town.medicine>=10,apply:s=>{s.town.medicine-=10;s.town.morale+=4;s.flags.compassion++;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.154"),'medicine')}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.155"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.156"),available:s=>partyMembers(false).some(m=>m.role==='healer')&&s.town.medicine>=4,apply:s=>{s.town.medicine-=4;const m=partyMembers(false).find(x=>x.role==='healer');if(m)m.stamina=Math.max(0,m.stamina-18);s.town.morale+=3;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.157"),'healer')}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.158"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.159"),apply:s=>{s.town.population-=2;s.town.morale-=3;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.160"),'quarantine')}}]},
 {id:'militia_desertion',tier:'notable',minRound:4,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.161"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.162"),condition:s=>s.town.morale<35&&s.town.militia>=8&&!eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.163")+s.round),repeatable:true,choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.164"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.165"),available:s=>hasGuardianClass(SOSText("events_field_runtime_navigation.eventSummaryFlags.166")),apply:s=>{s.town.morale+=4;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.167")+s.round,true)}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.168"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.169"),apply:s=>{s.town.militia=Math.max(0,s.town.militia-4);s.town.morale++;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.170")+s.round,true)}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.171"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.172"),apply:s=>{s.town.militia=Math.max(0,s.town.militia-1);s.town.morale-=3;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.173")+s.round,true)}}]},
 {id:'citizens_repair',tier:'routine',minRound:3,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.174"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.175"),condition:s=>s.town.morale>=80&&Object.keys(s.townCondition.damaged||{}).length>0&&!eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.176")+s.round),repeatable:true,choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.177"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.178"),apply:s=>{const ids=Object.keys(s.townCondition.damaged);if(ids.length){const id=pick(ids);s.townCondition.damaged[id]--;if(s.townCondition.damaged[id]<=0)delete s.townCondition.damaged[id]}s.town.morale++;eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.179")+s.round,true)}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.180"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.181"),available:s=>s.town.timber>=4,apply:s=>{s.town.timber-=4;const ids=Object.keys(s.townCondition.damaged);if(ids.length)delete s.townCondition.damaged[pick(ids)];eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.182")+s.round,true)}}]},
 {id:'rare_old_signal',tier:'rare',minRound:6,title:SOSText("events_field_runtime_navigation.eventSummaryFlags.183"),text:SOSText("events_field_runtime_navigation.eventSummaryFlags.184"),condition:s=>!eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.185")),choices:[
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.186"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.187"),available:s=>hasAnyClass(SOSText("events_field_runtime_navigation.eventSummaryFlags.188")),apply:s=>{s.scouting++;delayEnemy(s,1);eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.189"),'restored')}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.190"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.191"),available:s=>hasAnyClass(SOSText("events_field_runtime_navigation.eventSummaryFlags.192")),apply:s=>{s.xp+=50;s.flags.fullIntel=Math.max(s.flags.fullIntel,3);eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.193"),'magic')}},
   {label:SOSText("events_field_runtime_navigation.eventSummaryFlags.194"),desc:SOSText("events_field_runtime_navigation.eventSummaryFlags.195"),apply:s=>eventFlag(SOSText("events_field_runtime_navigation.eventSummaryFlags.196"),'ignored')}]}
];

function dynamicEventById(id){return DYNAMIC_EVENTS.find(e=>e.id===id)}
function scheduledEventReady(){const ready=state.eventState.scheduled.filter(x=>x.round<=state.round);if(!ready.length)return null;ready.sort((a,b)=>a.round-b.round);const rec=ready[0];state.eventState.scheduled=state.eventState.scheduled.filter(x=>x!==rec);const ev=dynamicEventById(rec.id);return ev&&(!ev.condition||ev.condition(state))?ev:null}
function eligibleDynamicEvents(){return DYNAMIC_EVENTS.filter(ev=>!ev.scheduledOnly&&state.round>=(ev.minRound||1)&&state.round<=(ev.maxRound||99)&&(ev.repeatable||!state.eventState.used.includes(ev.id))&&(!ev.condition||ev.condition(state)))}
function weightedDynamicEvent(list){const bag=[];for(const ev of list){const w=EVENT_TIER_WEIGHT[ev.tier]||3;for(let i=0;i<w;i++)bag.push(ev)}return bag.length?pick(bag):null}
function renderDynamicEvent(ev,after){const available=ev.choices.filter(dynamicChoiceAvailable);overlay(`<h2>${esc(ev.title)}</h2><div class="event-tier ${esc(ev.tier||'notable')}">${esc((ev.tier||'notable').toUpperCase())}</div><p>${esc(ev.text)}</p><div class="choice-list">${ev.choices.map((c,i)=>`<div class="choice"><button data-dynchoice="${i}" ${dynamicChoiceAvailable(c)?'':'disabled'}><b>${esc(c.label)}</b><br><small>${esc(c.desc||'')}</small></button></div>`).join('')}${available.length?'':`<div class="choice"><button id="dynamicDoNothing"><b>Do Nothing</b><br><small>No available option can be used with the present resources or company.</small></button></div>`}</div>`);if($('#dynamicDoNothing'))$('#dynamicDoNothing').onclick=()=>{markDynamicUsed(ev);log(SOSText("events_field_runtime_navigation.renderDynamicEvent.001",ev.title),'info');chronicle(ev.title,SOSText("events_field_runtime_navigation.renderDynamicEvent.002"),'decision');save();closeOverlay();if(after)after();else renderGame()};document.querySelectorAll('[data-dynchoice]').forEach(b=>b.onclick=()=>{const c=ev.choices[+b.dataset.dynchoice];if(!dynamicChoiceAvailable(c))return;c.apply(state);markDynamicUsed(ev);normalize();log(`${ev.title}: ${c.label}.`,'info');chronicle(ev.title,`${c.label}. ${c.desc||''}`,'decision');save();closeOverlay();if(after)after();else renderGame()})}


function defaultMeta(){return {campaigns:0,wins:0,battles:0,battleWins:0,enemies:0,goldEarned:0,highestLevel:1,bestEnding:SOSText("events_field_runtime_navigation.defaultMeta.001"),guardiansLost:0,perfectVictories:0,boundWeapon:null,boundItem:null,boundHistory:null,achievements:{}}}
function loadMeta(){try{return {...defaultMeta(),...JSON.parse(localStorage.getItem(META_KEY)||'{}')}}catch{return defaultMeta()}}
function saveMeta(){localStorage.setItem(META_KEY,JSON.stringify(meta))}
let meta=loadMeta();
let state=null;
let modal=null;
let combat=null;
let lastCombatJavascriptError='';
const RUNTIME_ERROR_KEY=SOSText("events_field_runtime_navigation.saveMeta.001");
let runtimeJavascriptErrors=[];
try{const savedErrors=JSON.parse(localStorage.getItem(RUNTIME_ERROR_KEY)||'[]');if(Array.isArray(savedErrors))runtimeJavascriptErrors=savedErrors.slice(-40)}catch{}
function formatJavascriptError(err,source=''){
 const message=err?.message||String(err||SOSText("events_field_runtime_navigation.formatJavascriptError.001")),stack=String(err?.stack||'').split('\n').map(x=>x.trim()).filter(Boolean);
 const loc=stack.find(x=>/\.html:\d+|game\.js:\d+|<anonymous>:\d+/.test(x))||source||'';
 return `[JS ERROR] ${message}${loc?` • ${loc.replace(/^at\s+/,'')}`:''}`
}
function runtimeErrorContext(){
 const day=state?.world?.day??null,locId=state?.world?.location||null,locName=locId?(worldLocation(locId)?.name||locId):null;
 return {day,mode:state?.mode||null,location:locName}
}
function saveRuntimeJavascriptErrors(){try{localStorage.setItem(RUNTIME_ERROR_KEY,JSON.stringify(runtimeJavascriptErrors.slice(-40)))}catch{}}
function clearRuntimeJavascriptErrors(){runtimeJavascriptErrors=[];lastCombatJavascriptError='';try{localStorage.removeItem(RUNTIME_ERROR_KEY)}catch{}}
function reportRuntimeJavascriptError(err,source='',kind='error'){
 const line=formatJavascriptError(err,source),ctx=runtimeErrorContext(),last=runtimeJavascriptErrors[runtimeJavascriptErrors.length-1];
 if(last&&last.line===line&&last.day===ctx.day&&last.location===ctx.location)return line;
 runtimeJavascriptErrors.push({time:new Date().toISOString(),kind,line,...ctx});runtimeJavascriptErrors=runtimeJavascriptErrors.slice(-40);saveRuntimeJavascriptErrors();return line
}
function appendCombatConsoleLine(line){
 const box=document.querySelector('.combat-log');if(!box)return;
 const span=document.createElement('span');span.className='combat-js-error';span.textContent=line;
 if(box.textContent)box.appendChild(document.createElement('br'));box.appendChild(span);box.scrollTop=box.scrollHeight
}
function reportCombatJavascriptError(err,source='',line=null){
 if(!combat)return;line=line||formatJavascriptError(err,source);
 if(line===lastCombatJavascriptError)return;lastCombatJavascriptError=line;
 if(!Array.isArray(combat.log))combat.log=[];combat.log.push(line);appendCombatConsoleLine(line)
}
function captureJavascriptError(err,source='',kind='error'){
 const line=reportRuntimeJavascriptError(err,source,kind);if(combat)reportCombatJavascriptError(err,source,line)
}
window.addEventListener('error',e=>captureJavascriptError(e.error||new Error(e.message),`${e.filename||'script'}:${e.lineno||'?'}:${e.colno||'?'}`,'error'));
window.addEventListener('unhandledrejection',e=>captureJavascriptError(e.reason instanceof Error?e.reason:new Error(String(e.reason||SOSText("events_field_runtime_navigation.captureJavascriptError.001"))),'promise','promise'));
function showJavascriptErrorJournal(){modalRouteEnter(SOSText("events_field_runtime_navigation.showJavascriptErrorJournal.001"),Array.from(arguments));
 const rows=runtimeJavascriptErrors.slice().reverse();
 overlay(SOSText("events_field_runtime_navigation.showJavascriptErrorJournal.002",rows.length?rows.map(e=>`<div class="js-error-entry"><small>${esc(e.time||'Unknown time')}${e.day!=null?` • Day ${e.day}`:''}${e.location?` • ${esc(e.location)}`:''}${e.mode?` • ${esc(e.mode)}`:''}</small><br>${esc(e.line)}</div>`).join(''):'<div class="notice success">No JavaScript runtime errors have been recorded.</div>',rows.length?'<button id="clearJavascriptErrors">Clear Error Record</button>':''),true);
 if($('#clearJavascriptErrors'))$('#clearJavascriptErrors').onclick=()=>{clearRuntimeJavascriptErrors();showJavascriptErrorJournal()};$('#javascriptErrorsBack').onclick=()=>modalNavBackOrFallback(showWorldJournal)
}
let townNavStack=[];
let townNavCurrent=null;
let townNavRestoring=false;
let modalNavStack=[];
let modalNavCurrent=null;
let modalNavRestoring=false;
let modalNavReplacing=false;
let modalRouteHint=null;
const modalScrollPositions=new Map();
let guardianHallNavStack=[];
let guardianHallNavCurrent=null;
function modalNavArgKey(v){
 if(v==null||['string','number','boolean'].includes(typeof v))return String(v);
 if(Array.isArray(v))return `[${v.map(modalNavArgKey).join(',')}]`;
 if(typeof v==='object'){if(v.id!=null)return `id:${v.id}`;if(v.name!=null)return `name:${v.name}`;return v.constructor?.name||'object'}
 return typeof v
}
function modalNavEntryKey(e){return e?`${e.name}|${(e.args||[]).map(modalNavArgKey).join('|')}`:''}
function modalScrollKeyForRender(){
 if(modalRouteHint)return`route:${modalNavEntryKey(modalRouteHint)}`;
 if(isOpenWorld()&&townNavCurrent)return`town:${townNavCurrent.route}|${modalNavArgKey(townNavCurrent.args||{})}`;
 if(modalNavCurrent)return`modal:${modalNavEntryKey(modalNavCurrent)}`;
 return''
}
function rememberModalScrollPosition(){
 if(!modal)return;const key=modal.dataset.scrollKey,dlg=modal.querySelector?.('.dialog');if(!key||!dlg)return;
 modalScrollPositions.set(key,Math.max(0,dlg.scrollTop||0));
 if(modalScrollPositions.size>80){const first=modalScrollPositions.keys().next().value;if(first)modalScrollPositions.delete(first)}
}
function restoreModalScrollPosition(el,key){
 if(!el||!key||!modalScrollPositions.has(key))return;const top=modalScrollPositions.get(key),dlg=el.querySelector?.('.dialog');if(!dlg)return;
 requestAnimationFrame(()=>{if(modal===el)dlg.scrollTop=Math.min(top,Math.max(0,dlg.scrollHeight-dlg.clientHeight))})
}
function beginGuardianHallNavigation(){
 if(!isOpenWorld())return;
 if(townNavCurrent)resetTownNavigation();
 if(guardianHallNavCurrent?.name==='showHomeBase'||guardianHallNavStack.some(e=>e?.name==='showHomeBase'))return;
 guardianHallNavStack=[];
 guardianHallNavCurrent={name:'showHomeBase',args:[]};
 resetModalNavigation()
}
function navigationRouteIsTransient(name){
 return new Set([
  'showHomeMailDetail','showHomeAudienceDetail','showHomecomingBriefing',
  'showPendingContractFailureNotice','showSocialLifeEvent','showRoadEvent',
  'showRegionalOpportunity','showLiveRegionalConflict','showRegionalBattle',
  'showFieldEncounter'
 ]).has(name)
}
function navigationPruneDuplicateTarget(stack,next){
 const key=modalNavEntryKey(next);if(!key)return;
 // Returning to a route that is already in the stack closes the intervening branch.
 // This prevents A → B → A → B loops when an older screen uses a direct parent link.
 let found=-1;for(let i=stack.length-1;i>=0;i--)if(modalNavEntryKey(stack[i])===key){found=i;break}
 if(found>=0)stack.splice(found);
 while(stack.length&&modalNavEntryKey(stack[stack.length-1])===key)stack.pop();
 if(stack.length>48)stack.splice(0,stack.length-48)
}
function guardianHallRouteEnter(name,args=[]){
 if(!isOpenWorld())return;
 const next={name,args:Array.from(args||[])};
 if(!guardianHallNavCurrent){guardianHallNavCurrent={name:'showHomeBase',args:[]}}
 if(guardianHallNavCurrent.name===next.name&&JSON.stringify(guardianHallNavCurrent.args||[])===JSON.stringify(next.args||[]))return;
 const leavingTransient=navigationRouteIsTransient(guardianHallNavCurrent.name);
 if(!leavingTransient)guardianHallNavStack.push(guardianHallNavCurrent);
 navigationPruneDuplicateTarget(guardianHallNavStack,next);
 guardianHallNavCurrent=next
}
function guardianHallRouteBack(fallback=showHomeBase){
 const prev=guardianHallNavStack.pop();
 if(prev){
  guardianHallNavCurrent=prev;
  const fn=navigationRouteFunction(prev.name);
  if(typeof fn==='function')return fn(...(prev.args||[]))
 }
 guardianHallNavCurrent={name:'showHomeBase',args:[]};
 return typeof fallback==='function'?fallback():showHomeBase()
}
function guardianHallRouteReset(){
 guardianHallNavStack=[];
 guardianHallNavCurrent=null
}
function modalRouteEnter(name,args=[]){
 const next={name,args:Array.from(args||[])};modalRouteHint=next;
 if(!isOpenWorld()||townNavCurrent)return;
 if(modalNavReplacing){
   modalNavCurrent=next;
   navigationPruneDuplicateTarget(modalNavStack,next);
   return
 }
 // Tabs, filters, and refreshes within the same screen should not become extra Back steps.
 if(modalNavCurrent&&modalNavCurrent.name===next.name){modalNavCurrent=next;return}
 const leavingTransient=modalNavCurrent&&navigationRouteIsTransient(modalNavCurrent.name);
 if(!modalNavRestoring&&modalNavCurrent&&!leavingTransient&&modalNavEntryKey(modalNavCurrent)!==modalNavEntryKey(next))modalNavStack.push(modalNavCurrent);
 navigationPruneDuplicateTarget(modalNavStack,next);
 modalNavCurrent=next
}
function resetModalNavigation(){modalNavStack=[];modalNavCurrent=null;modalNavRestoring=false;modalNavReplacing=false}
function navigationRouteFunction(name){
 switch(name){
  case 'modalRouteEnter':return modalRouteEnter;
  case 'showAdventureSite':return showAdventureSite;
  case 'showApothecary':return showApothecary;
  case 'showArtifactCollection':return showArtifactCollection;
  case 'showAttributeAllocation':return showAttributeAllocation;
  case 'showCaptiveCompanions':return showCaptiveCompanions;
  case 'showCaptivity':return showCaptivity;
  case 'showChronicle':return showChronicle;
  case 'showClassChoice':return showClassChoice;
  case 'showClassGuide':return showClassGuide;
  case 'showCombatHealTargets':return showCombatHealTargets;
  case 'showCombatItems':return showCombatItems;
  case 'showCommandOrders':return showCommandOrders;
  case 'showCommissionInterests':return showCommissionInterests;
  case 'showCommissionOptions':return showCommissionOptions;
  case 'showCommissionRecipients':return showCommissionRecipients;
  case 'showCompanionConversation':return showCompanionConversation;
  case 'showCompanionExpeditionJournal':return showCompanionExpeditionJournal;
  case 'showCompanionExplorationQuest':return showCompanionExplorationQuest;
  case 'showCompanionHistory':return showCompanionHistory;
  case 'showCompanionLifeProfile':return showCompanionLifeProfile;
  case 'showCompanionProfile':return showCompanionProfile;
  case 'showCompanionRelationships':return showCompanionRelationships;
  case 'showCompanionSocialConnections':return showCompanionSocialConnections;
  case 'showCompanionSocialRequest':return showCompanionSocialRequest;
  case 'showCompanionStory':return showCompanionStory;
  case 'showContinueFailure':return showContinueFailure;
  case 'showContractBoard':return showContractBoard;
  case 'showContractDetails':return showContractDetails;
  case 'showContractsJournal':return showContractsJournal;
  case 'showCouncil':return showCouncil;
  case 'showCovertPoliticalActions':return showCovertPoliticalActions;
  case 'showDefenseAssignments':return showDefenseAssignments;
  case 'showDiplomacyDecision':return showDiplomacyDecision;
  case 'showDungeonMap':return showDungeonMap;
  case 'showEconomicAdviserCandidates':return showEconomicAdviserCandidates;
  case 'showEconomyLedger':return showEconomyLedger;
  case 'showEnchantOptions':return showEnchantOptions;
  case 'showEnchanter':return showEnchanter;
  case 'showEnchanterMember':return showEnchanterMember;
  case 'showEncounterRecord':return showEncounterRecord;
  case 'showEndRoundForecast':return showEndRoundForecast;
  case 'showEscortStatus':return showEscortStatus;
  case 'showExplorationClues':return showExplorationClues;
  case 'showExplorationJournal':return showExplorationJournal;
  case 'showFactionCivicActions':return showFactionCivicActions;
  case 'showFactionIncident':return showFactionIncident;
  case 'showFactionOverview':return showFactionOverview;
  case 'showFactionPost':return showFactionPost;
  case 'showFactionQuestDecision':return showFactionQuestDecision;
  case 'showFactionQuestlines':return showFactionQuestlines;
  case 'showFactionSocialNetwork':return showFactionSocialNetwork;
  case 'showFieldDiscovery':return showFieldDiscovery;
  case 'showFieldEncounter':return showFieldEncounter;
  case 'showFriendlyPartyInteraction':return showFriendlyPartyInteraction;
  case 'showGroup':return showGroup;
  case 'showGuardTargets':return showGuardTargets;
  case 'showGuardianOffice':return showGuardianOffice;
  case 'showGuardianQuickInfo':return showGuardianQuickInfo;
  case 'showHall':return showHall;
  case 'showHallCompanionLife':return showHallCompanionLife;
  case 'showHeadGuardCandidates':return showHeadGuardCandidates;
  case 'showHealer':return showHealer;
  case 'showHelp':return showHelp;
  case 'showHiddenInterior':return showHiddenInterior;
  case 'showHomeArchives':return showHomeArchives;
  case 'showHomeArmory':return showHomeArmory;
  case 'showHomeArmoryItem':return showHomeArmoryItem;
  case 'showHomeArmoryPurchase':return showHomeArmoryPurchase;
  case 'showHomeAudienceDetail':return showHomeAudienceDetail;
  case 'showHomeBase':return showHomeBase;
  case 'showHomeBaseStorage':return showHomeBaseStorage;
  case 'showHomeBudget':return showHomeBudget;
  case 'showHomeBusiness':return showHomeBusiness;
  case 'showHomeCorrespondence':return showHomeCorrespondence;
  case 'showHomeDailyLife':return showHomeDailyLife;
  case 'showHomeDelegationChooser':return showHomeDelegationChooser;
  case 'showHomeDining':return showHomeDining;
  case 'showHomeDiningHistory':return showHomeDiningHistory;
  case 'showHomeDiplomacy':return showHomeDiplomacy;
  case 'showHomeEmergencyProcurement':return showHomeEmergencyProcurement;
  case 'showHomeFieldProcurement':return showHomeFieldProcurement;
  case 'showHomeGuestQuarters':return showHomeGuestQuarters;
  case 'showHomeGuestGroupInfo':return showHomeGuestGroupInfo;
  case 'showHomeInfirmary':return showHomeInfirmary;
  case 'showHomeLogistics':return showHomeLogistics;
  case 'showHomeLogisticsReports':return showHomeLogisticsReports;
  case 'showHomeTradeProcurement':return showHomeTradeProcurement;
  case 'showHomeTradeProcurementOrder':return showHomeTradeProcurementOrder;
  case 'showHomeStandingProcurementEditor':return showHomeStandingProcurementEditor;
  case 'showHomeMixedProcurementPlanner':return showHomeMixedProcurementPlanner;
  case 'showHomeMailDetail':return showHomeMailDetail;
  case 'showHomeMediationChooser':return showHomeMediationChooser;
  case 'showHomePartyPresets':return showHomePartyPresets;
  case 'showHomePreparation':return showHomePreparation;
  case 'showHomePrisoners':return showHomePrisoners;
  case 'showHomeSecurity':return showHomeSecurity;
  case 'showHomeSecurityPostures':return showHomeSecurityPostures;
  case 'showHomeSecurityReports':return showHomeSecurityReports;
  case 'showHomeStaff':return showHomeStaff;
  case 'showHomeStaffReports':return showHomeStaffReports;
  case 'showHomeStewardCandidates':return showHomeStewardCandidates;
  case 'showHomeTrainingYard':return showHomeTrainingYard;
  case 'showHomeTrophies':return showHomeTrophies;
  case 'showHomeTrophyDetail':return showHomeTrophyDetail;
  case 'showHomeUpgrades':return showHomeUpgrades;
  case 'showHomeVisitors':return showHomeVisitors;
  case 'showHomecomingBriefing':return showHomecomingBriefing;
  case 'showIndependentCivicActions':return showIndependentCivicActions;
  case 'showInformationPartyInteraction':return showInformationPartyInteraction;
  case 'showInternalBlocChooser':return showInternalBlocChooser;
  case 'showInternalFactionPolitics':return showInternalFactionPolitics;
  case 'showInterregionalTradeSignals':return showInterregionalTradeSignals;
  case 'showInventory':return showInventory;
  case 'showJavascriptErrorJournal':return showJavascriptErrorJournal;
  case 'showLedgerResolution':return showLedgerResolution;
  case 'showLegacyAtHall':return showLegacyAtHall;
  case 'showLevelUpPrompt':return showLevelUpPrompt;
  case 'showLiveRegionalConflict':return showLiveRegionalConflict;
  case 'showLocalEquipment':return showLocalEquipment;
  case 'showLocalLaw':return showLocalLaw;
  case 'showLocalPoliticalActions':return showLocalPoliticalActions;
  case 'showLocalPoliticalPeople':return showLocalPoliticalPeople;
  case 'showLogisticsHireCandidates':return showLogisticsHireCandidates;
  case 'showMarket':return showMarket;
  case 'showMarketIntelligence':return showMarketIntelligence;
  case 'showMason':return showMason;
  case 'showMerchantCaravans':return showMerchantCaravans;
  case 'showMinorHiddenSite':return showMinorHiddenSite;
  case 'showNearbyWorldParties':return showNearbyWorldParties;
  case 'showNeutralEncounter':return showNeutralEncounter;
  case 'showNpcPoliticalConversation':return showNpcPoliticalConversation;
  case 'showOpenWorldCampingMenu':return showOpenWorldCampingMenu;
  case 'showOpenWorldCompanionMenu':return showOpenWorldCompanionMenu;
  case 'showOpenWorldCouncilHall':return showOpenWorldCouncilHall;
  case 'showOpenWorldExplorationMenu':return showOpenWorldExplorationMenu;
  case 'showOpenWorldHelp':return showOpenWorldHelp;
  case 'showOpenWorldPreflight':return showOpenWorldPreflight;
  case 'showOpenWorldRecordsMenu':return showOpenWorldRecordsMenu;
  case 'showOpenWorldRegionMenu':return showOpenWorldRegionMenu;
  case 'showOpenWorldSettlementTownLife':return showOpenWorldSettlementTownLife;
  case 'showOpenWorldTravelMenu':return showOpenWorldTravelMenu;
  case 'showOpenWorldWorldLifeMenu':return showOpenWorldWorldLifeMenu;
  case 'showOutfitter':return showOutfitter;
  case 'showPairRelationship':return showPairRelationship;
  case 'showParty':return showParty;
  case 'showPartyRelationships':return showPartyRelationships;
  case 'showPendingContractFailureNotice':return showPendingContractFailureNotice;
  case 'showPersistentCompanion':return showPersistentCompanion;
  case 'showPoliticalCampaignDesk':return showPoliticalCampaignDesk;
  case 'showPoliticalEndorsementPeople':return showPoliticalEndorsementPeople;
  case 'showPoliticalLeaderRaidOptions':return showPoliticalLeaderRaidOptions;
  case 'showPoliticalLeaderRaidTargets':return showPoliticalLeaderRaidTargets;
  case 'showPoliticalOperationPreparation':return showPoliticalOperationPreparation;
  case 'showPoliticalOutcome':return showPoliticalOutcome;
  case 'showPoliticalProtection':return showPoliticalProtection;
  case 'showPoliticalSituation':return showPoliticalSituation;
  case 'showPoliticalSupporterTargets':return showPoliticalSupporterTargets;
  case 'showPopulationMovementJournal':return showPopulationMovementJournal;
  case 'showPrisoners':return showPrisoners;
  case 'showPropertyStorage':return showPropertyStorage;
  case 'showRecruitment':return showRecruitment;
  case 'showRedstoneCivicDecision':return showRedstoneCivicDecision;
  case 'showRedstoneCivicLife':return showRedstoneCivicLife;
  case 'showRegionOverview':return showRegionOverview;
  case 'showRegionTravel':return showRegionTravel;
  case 'showRegionalBattle':return showRegionalBattle;
  case 'showRegionalEvidence':return showRegionalEvidence;
  case 'showRegionalLaw':return showRegionalLaw;
  case 'showRegionalOpportunities':return showRegionalOpportunities;
  case 'showRegionalOpportunity':return showRegionalOpportunity;
  case 'showRegionalPolitics':return showRegionalPolitics;
  case 'showRegionalSimulation':return showRegionalSimulation;
  case 'showRegionalStory':return showRegionalStory;
  case 'showRegionalStoryJournal':return showRegionalStoryJournal;
  case 'showRegionalTravelHub':return showRegionalTravelHub;
  case 'showRelationshipContractJournal':return showRelationshipContractJournal;
  case 'showRescueRetreatPrompt':return showRescueRetreatPrompt;
  case 'showRoadContact':return showRoadContact;
  case 'showRoadContactLedger':return showRoadContactLedger;
  case 'showRoadEncounterCatalogue':return showRoadEncounterCatalogue;
  case 'showRoadEvent':return showRoadEvent;
  case 'showRoadLife':return showRoadLife;
  case 'showRoadLifeScene':return showRoadLifeScene;
  case 'showSellMode':return showSellMode;
  case 'showSellQty':return showSellQty;
  case 'showSengiaAuthority':return showSengiaAuthority;
  case 'showSengiaAuthorityCase':return showSengiaAuthorityCase;
  case 'showSengiaDistrict':return showSengiaDistrict;
  case 'showSengiaEconomy':return showSengiaEconomy;
  case 'showSengiaRegionalConsequences':return showSengiaRegionalConsequences;
  case 'showSengiaSecurity':return showSengiaSecurity;
  case 'showSettings':return showSettings;
  case 'showSettlementEconomy':return showSettlementEconomy;
  case 'showSettlementFactions':return showSettlementFactions;
  case 'showSettlementNPCConversation':return showSettlementNPCConversation;
  case 'showSettlementPeople':return showSettlementPeople;
  case 'showSettlementPolitics':return showSettlementPolitics;
  case 'showSettlementServices':return showSettlementServices;
  case 'showSettlementSpecial':return showSettlementSpecial;
  case 'showShantiumCommunity':return showShantiumCommunity;
  case 'showShop':return showShop;
  case 'showSiegeHelp':return showSiegeHelp;
  case 'showSocialChain':return showSocialChain;
  case 'showSocialLifeEvent':return showSocialLifeEvent;
  case 'showSocialLifeJournal':return showSocialLifeJournal;
  case 'showSpellSelect':return showSpellSelect;
  case 'showSpotContractOffer':return showSpotContractOffer;
  case 'showStats':return showStats;
  case 'showStorehouse':return showStorehouse;
  case 'showTavern':return showTavern;
  case 'showTownLife':return showTownLife;
  case 'showTownTalk':return showTownTalk;
  case 'showTownTravelerContact':return showTownTravelerContact;
  case 'showTrackedWorldParty':return showTrackedWorldParty;
  case 'showTraining':return showTraining;
  case 'showTravelerInquiryPicker':return showTravelerInquiryPicker;
  case 'showTreasureMaps':return showTreasureMaps;
  case 'showWarRoom':return showWarRoom;
  case 'showWildernessSite':return showWildernessSite;
  case 'showWorldArea':return showWorldArea;
  case 'showWorldEncounterPlan':return showWorldEncounterPlan;
  case 'showWorldHistory':return showWorldHistory;
  case 'showWorldJournal':return showWorldJournal;
  case 'showWorldJournalArchive':return showWorldJournalArchive;
  case 'showWorldMapFilters':return showWorldMapFilters;
  case 'showWorldParty':return showWorldParty;
  case 'showWorldTrade':return showWorldTrade;
  case 'showCampingWildernessMenu':return showCampingWildernessMenu;
  case 'showHomeArtisan':return showHomeArtisan;
  case 'showHomeCommercialDelegation':return showHomeCommercialDelegation;
  case 'showHomeCommercialOpportunities':return showHomeCommercialOpportunities;
  case 'showHomeMasterworks':return showHomeMasterworks;
  case 'showRegionalIntelligence':return showRegionalIntelligence;
  case 'showRegionalPartyActions':return showRegionalPartyActions;
  case 'showRegionalPartyMessenger':return showRegionalPartyMessenger;
  case 'showRegionalWorldParties':return showRegionalWorldParties;
  case 'showSecretPassageStatus':return showSecretPassageStatus;
 }
 return null
}
function restoreModalNavEntry(entry){
 if(!entry)return false;const fn=navigationRouteFunction(entry.name);if(typeof fn!=='function')return false;
 modalNavRestoring=true;modalNavCurrent=entry;try{fn(...(entry.args||[]));return true}finally{modalNavRestoring=false}
}
function modalNavReplaceWith(fn,...args){
 if(typeof fn!=='function')return false;
 modalNavReplacing=true;try{fn(...args);return true}finally{modalNavReplacing=false}
}
function modalCurrentReturn(fallback){
 const entry=isOpenWorld()&&!townNavCurrent&&modalNavCurrent?{name:modalNavCurrent.name,args:[...(modalNavCurrent.args||[])]}:null;
 return ()=>{if(entry&&restoreModalNavEntry(entry))return;return typeof fallback==='function'?fallback():renderGame()}
}
function activeNavigationOwner(){
 if(isOpenWorld()&&guardianHallNavCurrent)return'hall';
 if(isOpenWorld()&&townNavCurrent)return'town';
 if(isOpenWorld()&&modalNavCurrent)return'modal';
 return'root'
}
function navigationBackOrExit(owner=activeNavigationOwner()){
 if(owner==='hall'){
  if(guardianHallNavStack.length||guardianHallNavCurrent?.name!=='showHomeBase')return guardianHallRouteBack(showHomeBase);
  guardianHallRouteReset();resetModalNavigation();closeOverlay();save();return renderGame()
 }
 if(owner==='town')return townNavBackOrExit();
 if(owner==='modal')return modalNavBackOrExit();
 return closeAndRender()
}
function modalNavBackOrExit(){
 if(!isOpenWorld()||townNavCurrent)return townNavCurrent?townNavBackOrExit():closeAndRender();
 if(modalNavStack.length){const prev=modalNavStack.pop();if(restoreModalNavEntry(prev))return}
 resetModalNavigation();closeOverlay();save();renderGame()
}
function modalNavBackOrFallback(fallback){
 if(isOpenWorld()&&!townNavCurrent&&modalNavStack.length)return modalNavBackOrExit();
 if(isOpenWorld()&&!townNavCurrent)resetModalNavigation();
 return typeof fallback==='function'?fallback():closeAndRender()
}
