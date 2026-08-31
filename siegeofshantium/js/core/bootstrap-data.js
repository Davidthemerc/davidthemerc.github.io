const VERSION='1.6.34';
const SAVE_KEY='siegeOfShantium.save.v1'; // legacy/current mirror
const SAVE_OPEN_WORLD_KEY='siegeOfShantium.save.openworld.v1';
const SAVE_SIEGE_KEY='siegeOfShantium.save.siege.v1'; // pre-v1.6.9 Siege migration source only
const SAVE_LEGACY_SIEGE_KEY='siegeOfShantium.save.legacySiege.v1';
const SAVE_SIEGE_II_KEY='siegeOfShantium.save.siegeII.v1';
const SAVE_OPEN_WORLD_BACKUP_KEY='siegeOfShantium.save.openworld.backup.v1';
const SAVE_SIEGE_BACKUP_KEY='siegeOfShantium.save.siege.backup.v1'; // pre-v1.6.9 backup migration source
const SAVE_LEGACY_SIEGE_BACKUP_KEY='siegeOfShantium.save.legacySiege.backup.v1';
const SAVE_SIEGE_II_BACKUP_KEY='siegeOfShantium.save.siegeII.backup.v1';
const SAVE_SLOT_MIGRATION_KEY='siegeOfShantium.saveSlotsMigrated.v1536';
const SAVE_SIEGE_SPLIT_MIGRATION_KEY='siegeOfShantium.siegeSplitMigrated.v169';
const META_KEY='siegeOfShantium.meta.v1';
const $=s=>document.querySelector(s);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const chance=p=>Math.random()<p;
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmt=n=>Math.round(n).toLocaleString();

const DIFFICULTIES={
 Story:{enemy:.90,economy:1.18,town:1.2,advance:.82,label:SOSText("core_bootstrap_data.top.008"),aiNoise:18,moraleLoss:1.18,yield:1.32,injury:.55,retreat:.10,enemyCrit:.68,enemyHealing:.30,staminaRecovery:1.18,innRecovery:1.00,reinforcement:.72},
 Guardian:{enemy:1,economy:1,town:1,advance:1,label:SOSText("core_bootstrap_data.top.009"),aiNoise:8,moraleLoss:1,yield:1,injury:1,retreat:0,enemyCrit:1,enemyHealing:.45,staminaRecovery:1,innRecovery:.86,reinforcement:1},
 Veteran:{enemy:1.05,economy:.88,town:.92,advance:1.08,label:SOSText("core_bootstrap_data.top.010"),aiNoise:4,moraleLoss:.88,yield:.80,injury:1.24,retreat:-.06,enemyCrit:1.18,enemyHealing:.55,staminaRecovery:.92,innRecovery:.74,reinforcement:1.12},
 Siege:{enemy:1.10,economy:.76,town:.84,advance:1.18,label:SOSText("core_bootstrap_data.top.011"),aiNoise:1,moraleLoss:.76,yield:.62,injury:1.48,retreat:-.12,enemyCrit:1.35,enemyHealing:.66,staminaRecovery:.84,innRecovery:.64,reinforcement:1.28}
};
function difficultyProfile(){return DIFFICULTIES[state?.difficulty]||DIFFICULTIES.Guardian}
function difficultySummary(){const d=state?.difficulty||'Guardian';return d==='Story'?'Forgiving combat: less coordinated enemies, faster morale breaks, lighter injuries, easier withdrawal, and stronger recovery.':d==='Veteran'?'Demanding combat: smarter targeting, steadier enemies, harsher injuries, less recovery, and more dangerous reinforcement pressure.':d==='Siege'?'Severe combat: highly coordinated enemies, resilient morale, serious injury pressure, difficult withdrawal, limited recovery, and aggressive reinforcements.':'Balanced combat: baseline enemy judgment, morale, injuries, recovery, and withdrawal.'}
const ROUTES=[
 {id:'north',name:SOSText("core_bootstrap_data.top.012"),x:48,y:5},{id:'west',name:SOSText("core_bootstrap_data.top.013"),x:5,y:38},{id:'quarry',name:SOSText("core_bootstrap_data.top.014"),x:13,y:76},
 {id:'river',name:SOSText("core_bootstrap_data.top.015"),x:73,y:10},{id:'south',name:SOSText("core_bootstrap_data.top.016"),x:46,y:86},{id:'east',name:SOSText("core_bootstrap_data.top.017"),x:82,y:54}
];
const FACTIONS={Brigands:SOSText("core_bootstrap_data.top.018"),Raiders:SOSText("core_bootstrap_data.top.019"),Beasts:SOSText("core_bootstrap_data.top.020"),Redstone:SOSText("core_bootstrap_data.top.021"),Bluestone:SOSText("core_bootstrap_data.top.022"),Coalition:SOSText("core_bootstrap_data.top.023"),Spawn:SOSText("core_bootstrap_data.top.024"),Cult:SOSText("core_bootstrap_data.top.025"),Mercenaries:SOSText("core_bootstrap_data.top.026")};

const ENEMIES=[
 [SOSText("core_bootstrap_data.top.027"),22,6,62,5,'skirmisher'],[SOSText("core_bootstrap_data.top.028"),26,7,64,6,'raider'],[SOSText("core_bootstrap_data.top.029"),18,5,75,8,'fast'],[SOSText("core_bootstrap_data.top.030"),32,8,68,7,'soldier'],[SOSText("core_bootstrap_data.top.031"),31,8,70,7,'soldier'],[SOSText("core_bootstrap_data.top.032"),30,8,69,8,'soldier'],[SOSText("core_bootstrap_data.top.033"),28,7,72,7,'brace'],[SOSText("core_bootstrap_data.top.034"),24,7,78,10,'archer'],
 [SOSText("core_bootstrap_data.top.035"),40,10,74,8,'veteran'],[SOSText("core_bootstrap_data.top.036"),44,12,62,9,'berserker'],[SOSText("core_bootstrap_data.top.037"),54,10,60,5,'armored'],[SOSText("core_bootstrap_data.top.038"),26,9,78,11,'fast'],[SOSText("core_bootstrap_data.top.039"),32,13,84,13,'assassin'],[SOSText("core_bootstrap_data.top.040"),34,12,76,10,'mage'],[SOSText("core_bootstrap_data.top.041"),66,15,54,4,'brute'],[SOSText("core_bootstrap_data.top.042"),42,11,75,11,'marauder'],
 [SOSText("core_bootstrap_data.top.043"),58,14,78,10,'commander'],[SOSText("core_bootstrap_data.top.044"),45,11,66,6,'engineer'],[SOSText("core_bootstrap_data.top.045"),78,13,58,3,'stone'],[SOSText("core_bootstrap_data.top.046"),82,16,56,5,'regen'],[SOSText("core_bootstrap_data.top.047"),70,15,78,8,'elite'],[SOSText("core_bootstrap_data.top.048"),52,13,82,11,'renegade'],[SOSText("core_bootstrap_data.top.049"),90,17,65,8,'beast'],[SOSText("core_bootstrap_data.top.050"),62,9,64,4,'shield'],
 [SOSText("core_bootstrap_data.top.051"),38,6,72,8,'healer'],[SOSText("core_bootstrap_data.top.052"),46,13,80,9,'archer'],[SOSText("core_bootstrap_data.top.053"),36,10,80,12,'saboteur'],[SOSText("core_bootstrap_data.top.054"),48,12,79,10,'mage'],[SOSText("core_bootstrap_data.top.055"),56,12,73,6,'brace'],[SOSText("core_bootstrap_data.top.056"),52,14,80,12,'charger'],[SOSText("core_bootstrap_data.top.057"),40,12,71,9,'cultist'],[SOSText("core_bootstrap_data.top.058"),50,14,84,14,'duelist'],
 [SOSText("core_bootstrap_data.top.059"),46,13,86,15,'assassin'],[SOSText("core_bootstrap_data.top.060"),72,15,56,4,'engineer'],[SOSText("core_bootstrap_data.top.061"),44,12,84,14,'fast'],[SOSText("core_bootstrap_data.top.062"),54,15,80,8,'archer']
].map((e,i)=>({id:'e'+i,name:e[0],hp:e[1],damage:e[2],acc:e[3],init:e[4],trait:e[5]}));
const enemyByName=n=>ENEMIES.find(e=>e.name===n)||ENEMIES[0];

const COMMANDERS=[
 {name:SOSText("core_bootstrap_data.top.063"),faction:SOSText("core_bootstrap_data.top.064"),trait:'commander',quote:SOSText("core_bootstrap_data.top.065")},
 {name:SOSText("core_bootstrap_data.top.066"),faction:SOSText("core_bootstrap_data.top.067"),trait:'duelist',quote:SOSText("core_bootstrap_data.top.068")},
 {name:SOSText("core_bootstrap_data.top.069"),faction:SOSText("core_bootstrap_data.top.070"),trait:'brute',quote:SOSText("core_bootstrap_data.top.071")},
 {name:SOSText("core_bootstrap_data.top.072"),faction:SOSText("core_bootstrap_data.top.073"),trait:'engineer',quote:SOSText("core_bootstrap_data.top.074")},
 {name:SOSText("core_bootstrap_data.top.075"),faction:SOSText("core_bootstrap_data.top.076"),trait:'mage',quote:SOSText("core_bootstrap_data.top.077")},
 {name:SOSText("core_bootstrap_data.top.078"),faction:SOSText("core_bootstrap_data.top.079"),trait:'marauder',quote:SOSText("core_bootstrap_data.top.080")},
 {name:SOSText("core_bootstrap_data.top.081"),faction:SOSText("core_bootstrap_data.top.082"),trait:'elite',quote:SOSText("core_bootstrap_data.top.083")},
 {name:SOSText("core_bootstrap_data.top.084"),faction:SOSText("core_bootstrap_data.top.085"),trait:'commander',quote:SOSText("core_bootstrap_data.top.086")}
];
