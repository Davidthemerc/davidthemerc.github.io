const BASE_GEAR=[
 [SOSText("items_equipment.top.001"),'weapon',5,3,0,5],[SOSText("items_equipment.top.002"),'weapon',7,1,0,0],[SOSText("items_equipment.top.003"),'weapon',9,0,0,-1],[SOSText("items_equipment.top.004"),'weapon',11,-3,1,-2],[SOSText("items_equipment.top.005"),'weapon',10,-2,0,-1],[SOSText("items_equipment.top.006"),'weapon',13,-5,1,-3],[SOSText("items_equipment.top.007"),'weapon',9,2,0,1],[SOSText("items_equipment.top.008"),'weapon',12,-4,2,-3],[SOSText("items_equipment.top.009"),'weapon',8,4,0,3],[SOSText("items_equipment.top.010"),'weapon',11,2,0,0],
 [SOSText("items_equipment.top.011"),'offhand',0,0,3,1],[SOSText("items_equipment.top.012"),'offhand',0,-1,5,-1],[SOSText("items_equipment.top.013"),'offhand',0,-4,8,-4],
 [SOSText("items_equipment.top.014"),'armor',0,1,4,2],[SOSText("items_equipment.top.015"),'armor',0,-1,7,-1],[SOSText("items_equipment.top.016"),'armor',0,-2,9,-2],[SOSText("items_equipment.top.017"),'armor',0,-4,12,-4],
 [SOSText("items_equipment.top.018"),'helm',0,0,3,0],[SOSText("items_equipment.top.019"),'helm',0,-1,5,-1],[SOSText("items_equipment.top.020"),'boots',0,1,1,3],[SOSText("items_equipment.top.021"),'boots',0,0,3,0]
];
let ITEMS=[];
ITEMS.push(
 {id:'starter_sword',name:SOSText("items_equipment.top.022"),slot:'weapon',tier:0,damage:7,accuracy:1,defense:0,initiative:0,price:20,traits:[SOSText("items_equipment.top.023")],special:SOSText("items_equipment.top.024")},
 {id:'starter_spear',name:SOSText("items_equipment.top.025"),slot:'weapon',tier:0,damage:8,accuracy:2,defense:0,initiative:1,price:22,traits:[SOSText("items_equipment.top.026")]},
 {id:'starter_bow',name:SOSText("items_equipment.top.027"),slot:'weapon',tier:0,damage:7,accuracy:5,defense:0,initiative:3,price:24,traits:[SOSText("items_equipment.top.028")]},
 {id:'starter_knife',name:SOSText("items_equipment.top.029"),slot:'weapon',tier:0,damage:5,accuracy:4,defense:0,initiative:5,price:16,traits:[SOSText("items_equipment.top.030")]},
 {id:'starter_staff',name:SOSText("items_equipment.top.031"),slot:'weapon',tier:0,magic:true,damage:5,accuracy:3,defense:0,initiative:1,price:20,traits:[SOSText("items_equipment.top.032")]},
 {id:'starter_leather',name:SOSText("items_equipment.top.033"),slot:'armor',tier:0,damage:0,accuracy:0,defense:3,initiative:1,price:24,traits:[SOSText("items_equipment.top.034")]},
 {id:'starter_mail',name:SOSText("items_equipment.top.035"),slot:'armor',tier:0,damage:0,accuracy:-1,defense:5,initiative:-1,price:30,traits:[SOSText("items_equipment.top.036")]},
 {id:'starter_buckler',name:SOSText("items_equipment.top.037"),slot:'offhand',tier:0,damage:0,accuracy:0,defense:2,initiative:0,price:15,traits:[SOSText("items_equipment.top.038")]},
 {id:'starter_robe',name:SOSText("items_equipment.top.039"),slot:'armor',tier:0,magic:true,damage:0,accuracy:1,defense:2,initiative:1,price:22,traits:[SOSText("items_equipment.top.040")]}
);

ITEMS.push(
 {id:'iron_knuckles',name:SOSText("items_equipment.top.041"),slot:'weapon',tier:1,damage:6,accuracy:4,defense:0,initiative:5,price:38,traits:[SOSText("items_equipment.top.042")]},
 {id:'spiked_knuckles',name:SOSText("items_equipment.top.043"),slot:'weapon',tier:2,damage:9,accuracy:3,defense:0,initiative:4,price:72,traits:[SOSText("items_equipment.top.044"),SOSText("items_equipment.top.045")]},
 {id:'raider_axe',name:SOSText("items_equipment.top.046"),slot:'weapon',tier:1,damage:10,accuracy:-1,defense:0,initiative:0,price:44,traits:[SOSText("items_equipment.top.047")]},
 {id:'war_axe',name:SOSText("items_equipment.top.048"),slot:'weapon',tier:2,damage:14,accuracy:-2,defense:0,initiative:-1,price:86,traits:[SOSText("items_equipment.top.049")]},
 {id:'light_crossbow',name:SOSText("items_equipment.top.050"),slot:'weapon',tier:1,damage:9,accuracy:6,defense:0,initiative:1,price:52,traits:[SOSText("items_equipment.top.051")]},
 {id:'repeater_crossbow',name:SOSText("items_equipment.top.052"),slot:'weapon',tier:3,damage:11,accuracy:7,defense:0,initiative:4,price:118,traits:[SOSText("items_equipment.top.053"),SOSText("items_equipment.top.054")]},
 {id:'crude_pistol',name:SOSText("items_equipment.top.055"),slot:'weapon',tier:2,damage:15,accuracy:2,defense:0,initiative:-3,price:95,traits:[SOSText("items_equipment.top.056"),SOSText("items_equipment.top.057")],special:SOSText("items_equipment.top.058")},
 {id:'handgonne',name:SOSText("items_equipment.top.059"),slot:'weapon',tier:3,damage:19,accuracy:0,defense:0,initiative:-5,price:145,traits:[SOSText("items_equipment.top.060")],special:SOSText("items_equipment.top.061")},
 {id:'sorcerer_wand',name:SOSText("items_equipment.top.062"),slot:'weapon',tier:2,magic:true,damage:8,accuracy:5,defense:0,initiative:3,price:88,traits:[SOSText("items_equipment.top.063")]}
);
BASE_GEAR.forEach((g,gi)=>TIERS.forEach((t,ti)=>{
 if(ti>1 && gi>20) return;
 const [base,slot,dmg,acc,def,init]=g; const scale=t[1];
 ITEMS.push({id:`g${gi}_${ti}`,name:`${t[0]} ${base}`,slot,tier:ti,damage:Math.max(0,Math.round(dmg*scale)),accuracy:Math.round(acc*scale),defense:Math.round(def*scale),initiative:Math.round(init*scale),price:Math.round((18+dmg*6+def*6)*t[2])});
}));
const MAGIC_GEAR=[
 [SOSText("items_equipment.top.064"),'weapon',7,4,0,1],[SOSText("items_equipment.top.065"),'weapon',10,6,0,1],[SOSText("items_equipment.top.066"),'weapon',13,7,1,0],
 [SOSText("items_equipment.top.067"),'weapon',6,7,0,4],[SOSText("items_equipment.top.068"),'weapon',8,9,0,5],[SOSText("items_equipment.top.069"),'armor',0,2,3,2],
 [SOSText("items_equipment.top.070"),'armor',0,3,6,2],[SOSText("items_equipment.top.071"),'helm',0,2,2,1],[SOSText("items_equipment.top.072"),'boots',0,2,1,3],
 [SOSText("items_equipment.top.073"),'offhand',0,4,2,2]
];
MAGIC_GEAR.forEach((g,gi)=>TIERS.forEach((t,ti)=>{if(ti>5)return;const [base,slot,dmg,acc,def,init]=g,scale=t[1];ITEMS.push({id:`m${gi}_${ti}`,name:`${t[0]} ${base}`,slot,tier:ti,magic:true,damage:Math.max(0,Math.round(dmg*scale)),accuracy:Math.round(acc*scale),defense:Math.round(def*scale),initiative:Math.round(init*scale),price:Math.round((28+dmg*7+def*7+Math.max(0,acc)*2)*t[2])})}));
const NAMED_ITEMS=[
 {id:'named_blade',name:SOSText("items_equipment.top.074"),slot:'weapon',tier:6,damage:20,accuracy:7,defense:2,initiative:4,price:900,special:SOSText("items_equipment.top.075")},
 {id:'named_shield',name:SOSText("items_equipment.top.076"),slot:'offhand',tier:6,damage:0,accuracy:0,defense:16,initiative:-2,price:880,special:SOSText("items_equipment.top.077")},
 {id:'named_hammer',name:SOSText("items_equipment.top.078"),slot:'weapon',tier:6,damage:25,accuracy:-4,defense:1,initiative:-5,price:930,special:SOSText("items_equipment.top.079")},
 {id:'named_bow',name:SOSText("items_equipment.top.080"),slot:'weapon',tier:6,damage:18,accuracy:11,defense:0,initiative:8,price:940,special:SOSText("items_equipment.top.081")},
 {id:'named_signet',name:SOSText("items_equipment.top.082"),slot:'ring',tier:7,damage:0,accuracy:4,defense:4,initiative:4,price:1100,special:SOSText("items_equipment.top.083")},
 {id:'named_sword',name:SOSText("items_equipment.top.084"),slot:'weapon',tier:7,damage:28,accuracy:8,defense:4,initiative:5,price:1400,special:SOSText("items_equipment.top.085")}
];
const JEWELRY=[
 {id:'ring_soldier',name:SOSText("items_equipment.top.086"),slot:'ring',tier:1,damage:1,accuracy:0,defense:2,initiative:0,price:70,traits:[SOSText("items_equipment.top.087")],special:SOSText("items_equipment.top.088")},
 {id:'ring_quick',name:SOSText("items_equipment.top.089"),slot:'ring',tier:2,damage:0,accuracy:2,defense:0,initiative:5,price:125,traits:[SOSText("items_equipment.top.090")],special:SOSText("items_equipment.top.091")},
 {id:'ring_marksman',name:SOSText("items_equipment.top.092"),slot:'ring',tier:3,damage:1,accuracy:6,defense:0,initiative:2,price:220,traits:[SOSText("items_equipment.top.093")],special:SOSText("items_equipment.top.094")},
 {id:'ring_ember',name:SOSText("items_equipment.top.095"),slot:'ring',tier:4,damage:2,accuracy:2,defense:1,initiative:1,price:330,magic:true,element:'fire',traits:[SOSText("items_equipment.top.096")],special:SOSText("items_equipment.top.097")},
 {id:'ring_tide',name:SOSText("items_equipment.top.098"),slot:'ring',tier:4,damage:0,accuracy:4,defense:2,initiative:2,price:330,magic:true,element:'water',traits:[SOSText("items_equipment.top.099")],special:SOSText("items_equipment.top.100")},
 {id:'ring_gale',name:SOSText("items_equipment.top.101"),slot:'ring',tier:5,damage:1,accuracy:5,defense:0,initiative:6,price:470,magic:true,element:'air',traits:[SOSText("items_equipment.top.102"),SOSText("items_equipment.top.103")],special:SOSText("items_equipment.top.104")},
 {id:'ring_stone',name:SOSText("items_equipment.top.105"),slot:'ring',tier:5,damage:0,accuracy:0,defense:7,initiative:-1,price:460,magic:true,element:'earth',traits:[SOSText("items_equipment.top.106"),SOSText("items_equipment.top.107")],special:SOSText("items_equipment.top.108")},
 {id:'amulet_scout',name:SOSText("items_equipment.top.109"),slot:'amulet',tier:2,damage:0,accuracy:3,defense:1,initiative:4,price:145,traits:[SOSText("items_equipment.top.110")],special:SOSText("items_equipment.top.111")},
 {id:'amulet_warden',name:SOSText("items_equipment.top.112"),slot:'amulet',tier:3,damage:0,accuracy:0,defense:6,initiative:0,price:240,traits:[SOSText("items_equipment.top.113")],special:SOSText("items_equipment.top.114")},
 {id:'amulet_command',name:SOSText("items_equipment.top.115"),slot:'amulet',tier:4,damage:1,accuracy:2,defense:3,initiative:2,price:350,traits:[SOSText("items_equipment.top.116")],special:SOSText("items_equipment.top.117")},
 {id:'amulet_focus',name:SOSText("items_equipment.top.118"),slot:'amulet',tier:3,damage:1,accuracy:5,defense:1,initiative:1,price:250,magic:true,traits:[SOSText("items_equipment.top.119")],special:SOSText("items_equipment.top.120")},
 {id:'amulet_elements',name:SOSText("items_equipment.top.121"),slot:'amulet',tier:6,damage:3,accuracy:5,defense:4,initiative:4,price:690,magic:true,traits:[SOSText("items_equipment.top.122"),SOSText("items_equipment.top.123")],special:SOSText("items_equipment.top.124")},
 {id:'amulet_guardian',name:SOSText("items_equipment.top.125"),slot:'amulet',tier:6,damage:2,accuracy:3,defense:8,initiative:2,price:720,traits:[SOSText("items_equipment.top.126"),SOSText("items_equipment.top.127")],special:SOSText("items_equipment.top.128")}
];
ITEMS=ITEMS.concat(NAMED_ITEMS,JEWELRY);
const BOSS_RELICS=[
 {id:'boss_quarry_cleaver',name:SOSText("items_equipment.top.129"),slot:'weapon',tier:6,damage:24,accuracy:1,defense:2,initiative:-2,price:980,traits:[SOSText("items_equipment.top.130"),SOSText("items_equipment.top.131")],special:SOSText("items_equipment.top.132")},
 {id:'boss_signal_sabre',name:SOSText("items_equipment.top.133"),slot:'weapon',tier:6,damage:19,accuracy:8,defense:3,initiative:7,price:1020,traits:[SOSText("items_equipment.top.134"),SOSText("items_equipment.top.135")],special:SOSText("items_equipment.top.136")},
 {id:'boss_greyfang_charm',name:SOSText("items_equipment.top.137"),slot:'amulet',tier:6,damage:2,accuracy:4,defense:2,initiative:8,price:900,traits:[SOSText("items_equipment.top.138")],special:SOSText("items_equipment.top.139")},
 {id:'boss_drowned_ring',name:SOSText("items_equipment.top.140"),slot:'ring',tier:7,damage:3,accuracy:4,defense:7,initiative:-1,price:1080,magic:true,element:'water',traits:[SOSText("items_equipment.top.141"),SOSText("items_equipment.top.142")],special:SOSText("items_equipment.top.143")}
];
ITEMS=ITEMS.concat(BOSS_RELICS);

const EXPLORATION_ARTIFACTS=[
 {id:'artifact_ashen_sickle',site:'ashfarm',name:SOSText("items_equipment.top.144"),slot:'weapon',tier:6,damage:18,accuracy:7,defense:1,initiative:6,price:940,traits:[SOSText("items_equipment.top.145"),SOSText("items_equipment.top.146")],artifact:true,artifactEffect:'survivor',special:SOSText("items_equipment.top.147")},
 {id:'artifact_wayfarer_chain',site:'oldshrine',name:SOSText("items_equipment.top.148"),slot:'amulet',tier:6,damage:1,accuracy:4,defense:5,initiative:5,price:890,traits:[SOSText("items_equipment.top.149"),SOSText("items_equipment.top.150")],artifact:true,artifactEffect:'traveler',special:SOSText("items_equipment.top.151")},
 {id:'artifact_splitrock_axe',site:'wolfcave',name:SOSText("items_equipment.top.152"),slot:'weapon',tier:6,damage:22,accuracy:3,defense:2,initiative:3,price:1010,traits:[SOSText("items_equipment.top.153"),SOSText("items_equipment.top.154")],artifact:true,artifactEffect:'breaker',special:SOSText("items_equipment.top.155")},
 {id:'artifact_march_breastplate',site:'battlefield',name:SOSText("items_equipment.top.156"),slot:'armor',tier:7,damage:1,accuracy:1,defense:15,initiative:-1,price:1250,traits:[SOSText("items_equipment.top.157"),SOSText("items_equipment.top.158")],artifact:true,artifactEffect:'command',special:SOSText("items_equipment.top.159")},
 {id:'artifact_reedknife',site:'smugglerhide',name:SOSText("items_equipment.top.160"),slot:'weapon',tier:6,damage:16,accuracy:10,defense:0,initiative:10,price:980,traits:[SOSText("items_equipment.top.161"),SOSText("items_equipment.top.162")],artifact:true,artifactEffect:'shadow',special:SOSText("items_equipment.top.163")},
 {id:'artifact_foreman_hammer',site:'collapsedmine',name:SOSText("items_equipment.top.164"),slot:'weapon',tier:7,damage:27,accuracy:-1,defense:3,initiative:-4,price:1280,traits:[SOSText("items_equipment.top.165"),SOSText("items_equipment.top.166")],artifact:true,artifactEffect:'breaker',special:SOSText("items_equipment.top.167")},
 {id:'artifact_hermit_staff',site:'hermit',name:SOSText("items_equipment.top.168"),slot:'weapon',tier:7,magic:true,damage:18,accuracy:9,defense:4,initiative:5,price:1210,traits:[SOSText("items_equipment.top.169"),SOSText("items_equipment.top.170")],artifact:true,artifactEffect:'focus',special:SOSText("items_equipment.top.171")},
 {id:'artifact_signal_bow',site:'oldtower',name:SOSText("items_equipment.top.172"),slot:'weapon',tier:7,damage:20,accuracy:12,defense:0,initiative:9,price:1240,traits:[SOSText("items_equipment.top.173"),SOSText("items_equipment.top.174")],artifact:true,artifactEffect:'highground',special:SOSText("items_equipment.top.175")},
 {id:'artifact_echo_ring',site:'sinkhole',name:SOSText("items_equipment.top.176"),slot:'ring',tier:7,magic:true,damage:2,accuracy:5,defense:5,initiative:3,price:1160,traits:[SOSText("items_equipment.top.177"),SOSText("items_equipment.top.178")],artifact:true,artifactEffect:'echo',special:SOSText("items_equipment.top.179")},
 {id:'artifact_blackthorn_sword',site:'banditcamp',name:SOSText("items_equipment.top.180"),slot:'weapon',tier:7,damage:23,accuracy:8,defense:3,initiative:6,price:1320,traits:[SOSText("items_equipment.top.181"),SOSText("items_equipment.top.182")],artifact:true,artifactEffect:'roadwarden',special:SOSText("items_equipment.top.183")}
];
ITEMS=ITEMS.concat(EXPLORATION_ARTIFACTS);

const EXPLORATION_RARES=[
 {id:'rare_marchknife',name:SOSText("items_equipment.top.184"),slot:'weapon',tier:4,damage:13,accuracy:7,defense:1,initiative:6,price:430,traits:[SOSText("items_equipment.top.185"),SOSText("items_equipment.top.186")],rareExploration:true},
 {id:'rare_trailcloak',name:SOSText("items_equipment.top.187"),slot:'armor',tier:4,damage:0,accuracy:1,defense:8,initiative:5,price:450,traits:[SOSText("items_equipment.top.188"),SOSText("items_equipment.top.189")],rareExploration:true},
 {id:'rare_hunterbow',name:SOSText("items_equipment.top.190"),slot:'weapon',tier:5,damage:17,accuracy:9,defense:0,initiative:7,price:590,traits:[SOSText("items_equipment.top.191"),SOSText("items_equipment.top.192")],rareExploration:true},
 {id:'rare_watchbuckler',name:SOSText("items_equipment.top.193"),slot:'offhand',tier:5,damage:1,accuracy:0,defense:10,initiative:1,price:570,traits:[SOSText("items_equipment.top.194"),SOSText("items_equipment.top.195")],rareExploration:true},
 {id:'rare_wayfarerring',name:SOSText("items_equipment.top.196"),slot:'ring',tier:5,damage:0,accuracy:3,defense:3,initiative:4,price:525,traits:[SOSText("items_equipment.top.197")],rareExploration:true},
 {id:'rare_ironpick',name:SOSText("items_equipment.top.198"),slot:'weapon',tier:5,damage:19,accuracy:3,defense:2,initiative:0,price:610,traits:[SOSText("items_equipment.top.199"),SOSText("items_equipment.top.200")],rareExploration:true}
];
ITEMS=ITEMS.concat(EXPLORATION_RARES);
const HALL_GIFT_ITEMS=[
 {id:'hall_gift_artisan_case',name:SOSText("items_equipment.hallGiftItems.001"),tier:2,price:180,hallValuable:true,desc:SOSText("items_equipment.hallGiftItems.002"),special:SOSText("items_equipment.hallGiftItems.003")},
 {id:'hall_gift_merchant_casket',name:SOSText("items_equipment.hallGiftItems.004"),tier:2,price:210,hallValuable:true,desc:SOSText("items_equipment.hallGiftItems.005"),special:SOSText("items_equipment.hallGiftItems.006")}
];
ITEMS=ITEMS.concat(HALL_GIFT_ITEMS);

const TRAIT_LIBRARY={
 Balanced:SOSText("items_equipment.top.201"),
 Heavy:SOSText("items_equipment.top.202"),
 Reinforced:SOSText("items_equipment.top.203"),
 Quick:SOSText("items_equipment.top.204"),
 Precise:SOSText("items_equipment.top.205"),
 Channeling:SOSText("items_equipment.top.206")
};
function inferTraits(it){if(!it||!it.slot)return[];if(it.traits?.length)return it.traits;const n=it.name||'',t=[];if(/Hammer|Battle Axe|Broadsword|Plate|Tower/i.test(n))t.push(SOSText("items_equipment.inferTraits.001"));if(/Shield|Mail|Scale|Helm|Reinforced/i.test(n))t.push(SOSText("items_equipment.inferTraits.002"));if(/Bow|Crossbow|Dagger/i.test(n))t.push(SOSText("items_equipment.inferTraits.003"));if(/Leather|Boots|Wand/i.test(n))t.push(SOSText("items_equipment.inferTraits.004"));if(it.magic||/Staff|Robe|Crystal|Signet/i.test(n))t.push(SOSText("items_equipment.inferTraits.005"));if(!t.length)t.push(SOSText("items_equipment.inferTraits.006"));return [...new Set(t)]}
function traitScore(it,className){
 return inferTraits(it).reduce((n,t)=>{
  let v=.5;
  if(t===SOSText("items_equipment.traitScore.001"))v=1;
  else if(t===SOSText("items_equipment.traitScore.002")&&[SOSText("items_equipment.traitScore.003"),SOSText("items_equipment.traitScore.004")].includes(className))v=1.5;
  else if(t===SOSText("items_equipment.traitScore.005")&&[SOSText("items_equipment.traitScore.006"),SOSText("items_equipment.traitScore.007"),SOSText("items_equipment.traitScore.008")].includes(className))v=1.5;
  else if(t===SOSText("items_equipment.traitScore.009")&&[SOSText("items_equipment.traitScore.010"),SOSText("items_equipment.traitScore.011")].includes(className))v=1.25;
  else if(t===SOSText("items_equipment.traitScore.012")&&[SOSText("items_equipment.traitScore.013"),SOSText("items_equipment.traitScore.014")].includes(className))v=1.25;
  else if(t===SOSText("items_equipment.traitScore.015")&&[SOSText("items_equipment.traitScore.016"),SOSText("items_equipment.traitScore.017")].includes(className))v=1.5;
  return n+v
 },0)
}
function traitBadges(it){return inferTraits(it).map(t=>`<span class="gear-trait" title="${esc(TRAIT_LIBRARY[t]||'')}">${esc(t)}</span>`).join(' ')}
function itemStatsLine(it){return SOSText("items_equipment.itemStatsLine.001",it.damage||0,(it.accuracy||0)>=0?'+':'',it.accuracy||0,it.defense||0,(it.initiative||0)>=0?'+':'',it.initiative||0)}
function comparisonHTML(it,ownerId='guardian'){const o=ownerFor(ownerId),cur=item(o?.equipment?.[it.slot]),cls=ownerClassName(ownerId);if(!cur)return SOSText("items_equipment.comparisonHTML.001",esc(it.slot),itemStatsLine(it));const fields=[[SOSText("items_equipment.comparisonHTML.002"),it.damage||0,cur.damage||0],[SOSText("items_equipment.comparisonHTML.003"),it.accuracy||0,cur.accuracy||0],[SOSText("items_equipment.comparisonHTML.004"),it.defense||0,cur.defense||0],[SOSText("items_equipment.comparisonHTML.005"),it.initiative||0,cur.initiative||0]];return `<div class="gear-compare"><b>vs ${esc(cur.name)}</b><br>${fields.map(([n,a,b])=>`${n} ${a-b>0?'+':''}${a-b}`).join(' • ')}<br><small>${gearAffinity(cls,it)>gearAffinity(cls,cur)?'Better class affinity. ':''}${traitScore(it,cls)>traitScore(cur,cls)+.5?'Traits provide a small class-fit edge.':''}</small></div>`}
function bestPartyRecipient(it){
 let best=null,gain=0;for(const oid of ['guardian',...state.allies]){const o=ownerFor(oid);if(!o)continue;const cur=fitEffectiveItem(o.equipment[it.slot],oid),d=gearUtility(it,ownerClassName(oid),'balanced',oid)-gearUtility(cur,ownerClassName(oid),'balanced',oid);if(d>gain){gain=d;best=oid}}return best?SOSText("items_equipment.bestPartyRecipient.001",ownerName(best),Math.round(gain)):SOSText("items_equipment.bestPartyRecipient.002")
}
function itemFitScore(it,ownerId){
 if(!it?.slot)return null;const cls=ownerClassName(ownerId),o=ownerFor(ownerId),equippedId=o?.equipment?.[it.slot]||null,cur=fitEffectiveItem(equippedId,ownerId),raw=Math.round(gearUtility(it,cls,'balanced',ownerId)),current=cur?Math.round(gearUtility(cur,cls,'balanced',ownerId)):0,delta=raw-current,traits=traitScore(it,cls),role=roleSuitability(cls,it),bound=boundPreferenceBonus(it,ownerId),legacy=legacyFitBonus(it,ownerId);
 return {raw,current,delta,traits,role,bound,legacy,equippedId,equippedName:cur?.name||null,label:delta>=12?'Excellent upgrade':delta>=5?'Good upgrade':delta>1?'Minor upgrade':delta>=-1?'Sidegrade':SOSText("items_equipment.itemFitScore.001")}
}
function inspectItem(id,backOwner='guardian'){const it=item(id);if(!it)return;const equipment=!!it.slot,fits=equipment?['guardian',...state.allies].filter(x=>ownerFor(x)).map(oid=>({oid,...itemFitScore(it,oid)})).sort((a,b)=>b.raw-a.raw):[];overlay(SOSText("items_equipment.inspectItem.001",esc(it.name),equipment?esc(it.slot.toUpperCase()):'CONSUMABLE',it.tier||'—',it.price?` • Value ${it.price}g`:'',equipment?`<div class="notice"><b>Stats</b><br>${itemStatsLine(it)}<br>${traitBadges(it)}${it.special?`<br>${esc(it.special)}`:''}</div><h3>Party Fit Analysis</h3><div class="fit-table">${fits.map(f=>`<div class="fit-row"><b>${esc(ownerName(f.oid))}</b><span>Fit ${f.raw}</span><span>${f.delta>=0?'+':''}${f.delta} vs equipped</span><small>${esc(f.label)} • ${esc(f.role.label)} • trait fit ${Number(f.traits).toFixed(1)}${f.bound?` • Bound preference +${f.bound}`:''}${f.legacy?` • Legacy +${f.legacy.toFixed(1)}`:''}${f.equippedName?` • compared with ${esc(f.equippedName)}`:' • no item equipped'}${f.role.reasons.length?` • ${esc(f.role.reasons.join('; '))}`:''}</small></div>`).join('')}</div>`:`<div class="notice"><p>${esc(it.desc||it.special||'Single-use item.')}</p><p>Consumables do not receive equipment fit scores.</p></div>`));$('#inspectBack').onclick=()=>showInventory(backOwner)}

const CONSUMABLES=[
 {id:'heal',name:SOSText("items_equipment.inspectItem.002"),price:28,desc:SOSText("items_equipment.inspectItem.003")},{id:'bandage',name:SOSText("items_equipment.inspectItem.004"),price:15,desc:SOSText("items_equipment.inspectItem.005")},{id:'stamina',name:SOSText("items_equipment.inspectItem.006"),price:22,desc:SOSText("items_equipment.inspectItem.007")},{id:'antidote',name:SOSText("items_equipment.inspectItem.008"),price:18,desc:SOSText("items_equipment.inspectItem.009")},{id:'bomb',name:SOSText("items_equipment.inspectItem.010"),price:36,desc:SOSText("items_equipment.inspectItem.011")},{id:'focus',name:SOSText("items_equipment.inspectItem.012"),price:34,desc:SOSText("items_equipment.inspectItem.013")},{id:'stoneskin',name:SOSText("items_equipment.inspectItem.014"),price:42,desc:SOSText("items_equipment.inspectItem.015")},{id:'swift',name:SOSText("items_equipment.inspectItem.016"),price:38,desc:SOSText("items_equipment.inspectItem.017")}
];

const VALUABLES=[
 {id:'val_silver',name:SOSText("items_equipment.inspectItem.018"),value:42},{id:'val_gem',name:SOSText("items_equipment.inspectItem.019"),value:78},{id:'val_buckle',name:SOSText("items_equipment.inspectItem.020"),value:55},{id:'val_tradebar',name:SOSText("items_equipment.inspectItem.021"),value:95},{id:'val_relic',name:SOSText("items_equipment.inspectItem.022"),value:135},{id:'val_paychest',name:SOSText("items_equipment.inspectItem.023"),value:180}
];
function valuable(id){return VALUABLES.find(v=>v.id===id)}
function valuableAdd(id,qty=1){state.valuables=state.valuables||[];const e=state.valuables.find(x=>x.id===id);if(e)e.qty+=qty;else state.valuables.push({id,qty})}
function valuableRemove(id,qty=1){const e=(state.valuables||[]).find(x=>x.id===id);if(!e)return false;e.qty-=qty;if(e.qty<=0)state.valuables=state.valuables.filter(x=>x!==e);return true}
const UPGRADES=[
 ['palisade',SOSText("items_equipment.valuableRemove.001"),120,SOSText("items_equipment.valuableRemove.002")],['gatehouse',SOSText("items_equipment.valuableRemove.003"),135,SOSText("items_equipment.valuableRemove.004")],['watchtower',SOSText("items_equipment.valuableRemove.005"),95,SOSText("items_equipment.valuableRemove.006")],['barracks',SOSText("items_equipment.valuableRemove.007"),110,SOSText("items_equipment.valuableRemove.008")],['granary',SOSText("items_equipment.valuableRemove.009"),90,SOSText("items_equipment.valuableRemove.010")],['ward',SOSText("items_equipment.valuableRemove.011"),120,SOSText("items_equipment.valuableRemove.012")],['signal',SOSText("items_equipment.valuableRemove.013"),150,SOSText("items_equipment.valuableRemove.014")],['barricades',SOSText("items_equipment.valuableRemove.015"),85,SOSText("items_equipment.valuableRemove.016")],['cistern',SOSText("items_equipment.valuableRemove.017"),75,SOSText("items_equipment.valuableRemove.018")],['armory',SOSText("items_equipment.valuableRemove.019"),125,SOSText("items_equipment.valuableRemove.020")],['shelters',SOSText("items_equipment.valuableRemove.021"),100,SOSText("items_equipment.valuableRemove.022")],['stonework',SOSText("items_equipment.valuableRemove.023"),180,SOSText("items_equipment.valuableRemove.024")],[SOSText("items_equipment.valuableRemove.025"),SOSText("items_equipment.valuableRemove.026"),115,SOSText("items_equipment.valuableRemove.027")],[SOSText("items_equipment.valuableRemove.028"),SOSText("items_equipment.valuableRemove.029"),80,SOSText("items_equipment.valuableRemove.030")],['stores',SOSText("items_equipment.valuableRemove.031"),105,SOSText("items_equipment.valuableRemove.032")],['bell',SOSText("items_equipment.valuableRemove.033"),70,SOSText("items_equipment.valuableRemove.034")],['forge',SOSText("items_equipment.valuableRemove.035"),130,SOSText("items_equipment.valuableRemove.036")],['moat',SOSText("items_equipment.valuableRemove.037"),160,SOSText("items_equipment.valuableRemove.038")]
].map(x=>({id:x[0],name:x[1],price:x[2],desc:x[3]}));
const NPCS=[
 [SOSText("items_equipment.valuableRemove.039"),SOSText("items_equipment.valuableRemove.040")],[SOSText("items_equipment.valuableRemove.041"),SOSText("items_equipment.valuableRemove.042")],[SOSText("items_equipment.valuableRemove.043"),SOSText("items_equipment.valuableRemove.044")],[SOSText("items_equipment.valuableRemove.045"),SOSText("items_equipment.valuableRemove.046")],[SOSText("items_equipment.valuableRemove.047"),SOSText("items_equipment.valuableRemove.048")],[SOSText("items_equipment.valuableRemove.049"),SOSText("items_equipment.valuableRemove.050")],[SOSText("items_equipment.valuableRemove.051"),SOSText("items_equipment.valuableRemove.052")],[SOSText("items_equipment.valuableRemove.053"),SOSText("items_equipment.valuableRemove.054")],[SOSText("items_equipment.valuableRemove.055"),SOSText("items_equipment.valuableRemove.056")],[SOSText("items_equipment.valuableRemove.057"),SOSText("items_equipment.valuableRemove.058")],[SOSText("items_equipment.valuableRemove.059"),SOSText("items_equipment.valuableRemove.060")],[SOSText("items_equipment.valuableRemove.061"),SOSText("items_equipment.valuableRemove.062")],[SOSText("items_equipment.valuableRemove.063"),SOSText("items_equipment.valuableRemove.064")],[SOSText("items_equipment.valuableRemove.065"),SOSText("items_equipment.valuableRemove.066")],[SOSText("items_equipment.valuableRemove.067"),SOSText("items_equipment.valuableRemove.068")],[SOSText("items_equipment.valuableRemove.069"),SOSText("items_equipment.valuableRemove.070")]
];
const PARTY_BASE_LIMIT=2;
const PARTY_UNLOCK_ROUND=8;


const WORLD_REGIONS={
 shantium:{id:'shantium',name:SOSText("items_equipment.valuableRemove.071"),mapTitle:SOSText("items_equipment.valuableRemove.072"),subtitle:SOSText("items_equipment.valuableRemove.073"),terrain:'mixed'},
 bluestone:{id:'bluestone',name:SOSText("items_equipment.valuableRemove.074"),mapTitle:SOSText("items_equipment.valuableRemove.075"),subtitle:SOSText("items_equipment.valuableRemove.076"),terrain:'mountain'},
 redstone:{id:'redstone',name:SOSText("items_equipment.valuableRemove.077"),mapTitle:SOSText("items_equipment.valuableRemove.078"),subtitle:SOSText("items_equipment.valuableRemove.079"),terrain:'eastern'}
};
const REGION_CONNECTIONS=[
 {id:'northwest_highroad',a:'northgate',b:'lowcreek',days:3,name:SOSText("items_equipment.valuableRemove.080"),desc:SOSText("items_equipment.valuableRemove.081")},
 {id:'eastern_redstone_road',a:'redoubt',b:'lockwood',days:3,name:SOSText("items_equipment.valuableRemove.082"),desc:SOSText("items_equipment.valuableRemove.083")}
];
const WORLD_LOCATIONS=[
 {id:'shantium',name:SOSText("items_equipment.valuableRemove.084"),x:48,y:49,type:'town',faction:SOSText("items_equipment.valuableRemove.085"),desc:SOSText("items_equipment.valuableRemove.086")},
 {id:'river',name:SOSText("items_equipment.valuableRemove.087"),x:25,y:31,type:'settlement',faction:SOSText("items_equipment.valuableRemove.088"),desc:SOSText("items_equipment.valuableRemove.089")},
 {id:'woods',name:SOSText("items_equipment.valuableRemove.090"),x:12,y:57,type:'wilderness',faction:SOSText("items_equipment.valuableRemove.091"),desc:SOSText("items_equipment.valuableRemove.092")},
 {id:'quarry',name:SOSText("items_equipment.valuableRemove.093"),x:70,y:24,type:'ruins',faction:SOSText("items_equipment.valuableRemove.094"),desc:SOSText("items_equipment.valuableRemove.095")},
 {id:'southroad',name:SOSText("items_equipment.valuableRemove.096"),x:58,y:78,type:'camp',faction:SOSText("items_equipment.valuableRemove.097"),desc:SOSText("items_equipment.valuableRemove.098")},
 {id:'watchfort',name:SOSText("items_equipment.valuableRemove.099"),x:84,y:54,type:'ruins',faction:SOSText("items_equipment.valuableRemove.100"),desc:SOSText("items_equipment.valuableRemove.101")},
 {id:'marsh',name:SOSText("items_equipment.valuableRemove.102"),x:30,y:82,type:'wilderness',faction:SOSText("items_equipment.valuableRemove.103"),desc:SOSText("items_equipment.valuableRemove.104")},
 {id:'stonebridge',name:SOSText("items_equipment.valuableRemove.105"),x:80,y:78,type:'settlement',faction:SOSText("items_equipment.valuableRemove.106"),desc:SOSText("items_equipment.valuableRemove.107")},
 {id:'northgate',name:SOSText("items_equipment.valuableRemove.108"),x:52,y:12,type:'settlement',faction:SOSText("items_equipment.valuableRemove.109"),desc:SOSText("items_equipment.valuableRemove.110")},
 {id:'redoubt',name:SOSText("items_equipment.valuableRemove.111"),x:92,y:18,type:'fort',faction:SOSText("items_equipment.valuableRemove.112"),desc:SOSText("items_equipment.valuableRemove.113")},
 {id:'ashfarm',name:SOSText("items_equipment.valuableRemove.114"),x:18,y:44,type:'hidden',faction:SOSText("items_equipment.valuableRemove.115"),desc:SOSText("items_equipment.valuableRemove.116"),hidden:true,siteKind:'homestead'},
 {id:'oldshrine',name:SOSText("items_equipment.valuableRemove.117"),x:39,y:27,type:'hidden',faction:SOSText("items_equipment.valuableRemove.118"),desc:SOSText("items_equipment.valuableRemove.119"),hidden:true,siteKind:'shrine'},
 {id:'wolfcave',name:SOSText("items_equipment.valuableRemove.120"),x:8,y:69,type:'hidden',faction:SOSText("items_equipment.valuableRemove.121"),desc:SOSText("items_equipment.valuableRemove.122"),hidden:true,siteKind:'cave'},
 {id:'battlefield',name:SOSText("items_equipment.valuableRemove.123"),x:61,y:39,type:'hidden',faction:SOSText("items_equipment.valuableRemove.124"),desc:SOSText("items_equipment.valuableRemove.125"),hidden:true,siteKind:'battlefield'},
 {id:'smugglerhide',name:SOSText("items_equipment.valuableRemove.126"),x:21,y:91,type:'hidden',faction:SOSText("items_equipment.valuableRemove.127"),desc:SOSText("items_equipment.valuableRemove.128"),hidden:true,siteKind:'hideout'},
 {id:'collapsedmine',name:SOSText("items_equipment.valuableRemove.129"),x:77,y:34,type:'hidden',faction:SOSText("items_equipment.valuableRemove.130"),desc:SOSText("items_equipment.valuableRemove.131"),hidden:true,siteKind:'mine'},
 {id:'hermit',name:SOSText("items_equipment.valuableRemove.132"),x:68,y:65,type:'hidden',faction:SOSText("items_equipment.valuableRemove.133"),desc:SOSText("items_equipment.valuableRemove.134"),hidden:true,siteKind:'homestead'},
 {id:'oldtower',name:SOSText("items_equipment.valuableRemove.135"),x:90,y:42,type:'hidden',faction:SOSText("items_equipment.valuableRemove.136"),desc:SOSText("items_equipment.valuableRemove.137"),hidden:true,siteKind:'ruin'},
 {id:'sinkhole',name:SOSText("items_equipment.valuableRemove.138"),x:41,y:91,type:'hidden',faction:SOSText("items_equipment.valuableRemove.139"),desc:SOSText("items_equipment.valuableRemove.140"),hidden:true,siteKind:'strange'},
 {id:'banditcamp',name:SOSText("items_equipment.valuableRemove.141"),x:44,y:68,type:'hidden',faction:SOSText("items_equipment.valuableRemove.142"),desc:SOSText("items_equipment.valuableRemove.143"),hidden:true,siteKind:'hideout'},
 {id:'milepost',name:SOSText("items_equipment.valuableRemove.144"),x:34,y:43,type:'hidden',faction:SOSText("items_equipment.valuableRemove.145"),desc:SOSText("items_equipment.valuableRemove.146"),hidden:true,siteKind:'landmark',minor:true},
 {id:'huntershelter',name:SOSText("items_equipment.valuableRemove.147"),x:15,y:51,type:'hidden',faction:SOSText("items_equipment.valuableRemove.148"),desc:SOSText("items_equipment.valuableRemove.149"),hidden:true,siteKind:'campsite',minor:true},
 {id:'abandonedwagon',name:SOSText("items_equipment.valuableRemove.150"),x:64,y:53,type:'hidden',faction:SOSText("items_equipment.valuableRemove.151"),desc:SOSText("items_equipment.valuableRemove.152"),hidden:true,siteKind:'wreck',minor:true},
 {id:'gravecircle',name:SOSText("items_equipment.valuableRemove.153"),x:55,y:29,type:'hidden',faction:SOSText("items_equipment.valuableRemove.154"),desc:SOSText("items_equipment.valuableRemove.155"),hidden:true,siteKind:'landmark',minor:true},
 {id:'charcoalcamp',name:SOSText("items_equipment.valuableRemove.156"),x:9,y:48,type:'hidden',faction:SOSText("items_equipment.valuableRemove.157"),desc:SOSText("items_equipment.valuableRemove.158"),hidden:true,siteKind:'campsite',minor:true},
 {id:'cistern',name:SOSText("items_equipment.valuableRemove.159"),x:73,y:47,type:'hidden',faction:SOSText("items_equipment.valuableRemove.160"),desc:SOSText("items_equipment.valuableRemove.161"),hidden:true,siteKind:'landmark',minor:true},
 {id:'ferrylanding',name:SOSText("items_equipment.valuableRemove.162"),x:29,y:23,type:'hidden',faction:SOSText("items_equipment.valuableRemove.163"),desc:SOSText("items_equipment.valuableRemove.164"),hidden:true,siteKind:'landmark',minor:true},
 {id:'fallenchapel',name:SOSText("items_equipment.valuableRemove.165"),x:58,y:59,type:'hidden',faction:SOSText("items_equipment.valuableRemove.166"),desc:SOSText("items_equipment.valuableRemove.167"),hidden:true,siteKind:'ruin',minor:true},
 {id:'zion',name:SOSText("items_equipment.valuableRemove.168"),x:52,y:31,type:'town',faction:SOSText("items_equipment.valuableRemove.169"),region:'bluestone',terrain:'mountain-city',desc:SOSText("items_equipment.valuableRemove.170")},
 {id:'lowcreek',name:SOSText("items_equipment.valuableRemove.171"),x:79,y:79,type:'settlement',faction:SOSText("items_equipment.valuableRemove.172"),region:'bluestone',terrain:'mountain-valley',desc:SOSText("items_equipment.valuableRemove.173")},
 {id:'ebonheart',name:SOSText("items_equipment.valuableRemove.174"),x:21,y:53,type:'settlement',faction:SOSText("items_equipment.valuableRemove.175"),region:'bluestone',terrain:'mountain',desc:SOSText("items_equipment.valuableRemove.176")},
 {id:'norwegian',name:SOSText("items_equipment.valuableRemove.177"),x:37,y:72,type:'settlement',faction:SOSText("items_equipment.valuableRemove.178"),region:'bluestone',terrain:'valley',desc:SOSText("items_equipment.valuableRemove.179")},
 {id:'winterstone',name:SOSText("items_equipment.valuableRemove.180"),x:67,y:19,type:'settlement',faction:SOSText("items_equipment.valuableRemove.181"),region:'bluestone',terrain:'quarry',desc:SOSText("items_equipment.valuableRemove.182")},
 {id:'ziongorge',name:SOSText("items_equipment.valuableRemove.183"),x:70,y:52,type:'wilderness',faction:SOSText("items_equipment.valuableRemove.184"),region:'bluestone',terrain:'gorge',desc:SOSText("items_equipment.valuableRemove.185")},
 {id:'crownpass',name:SOSText("items_equipment.valuableRemove.186"),x:48,y:8,type:'wilderness',faction:SOSText("items_equipment.valuableRemove.187"),region:'bluestone',terrain:'pass',desc:SOSText("items_equipment.valuableRemove.188")},
 {id:'westspawnroad',name:SOSText("items_equipment.valuableRemove.189"),x:17,y:88,type:'wilderness',faction:SOSText("items_equipment.valuableRemove.190"),region:'bluestone',terrain:'mountain-road',desc:SOSText("items_equipment.valuableRemove.191")},
 {id:'skybreak',name:SOSText("items_equipment.valuableRemove.192"),x:88,y:44,type:'fort',faction:SOSText("items_equipment.valuableRemove.193"),region:'bluestone',terrain:'mountain-fort',desc:SOSText("items_equipment.valuableRemove.194")},
 {id:'goatshrine',name:SOSText("items_equipment.valuableRemove.195"),x:31,y:34,type:'hidden',faction:SOSText("items_equipment.valuableRemove.196"),region:'bluestone',terrain:'mountain',desc:SOSText("items_equipment.valuableRemove.197"),hidden:true,siteKind:'shrine',minor:true},
 {id:'snowcut',name:SOSText("items_equipment.valuableRemove.198"),x:59,y:63,type:'hidden',faction:SOSText("items_equipment.valuableRemove.199"),region:'bluestone',terrain:'mountain',desc:SOSText("items_equipment.valuableRemove.200"),hidden:true,siteKind:'landmark',minor:true},
 {id:'sengia',name:SOSText("items_equipment.valuableRemove.201"),x:76,y:47,type:'town',faction:SOSText("items_equipment.valuableRemove.202"),region:'redstone',terrain:'walled-city',desc:SOSText("items_equipment.valuableRemove.203")},
 {id:'lockwood',name:SOSText("items_equipment.valuableRemove.204"),x:18,y:48,type:'settlement',faction:SOSText("items_equipment.valuableRemove.205"),region:'redstone',terrain:'forest-town',desc:SOSText("items_equipment.valuableRemove.206")},
 {id:'grayhaven',name:SOSText("items_equipment.valuableRemove.207"),x:25,y:15,type:'settlement',faction:SOSText("items_equipment.valuableRemove.208"),region:'redstone',terrain:'road-town',desc:SOSText("items_equipment.valuableRemove.209")},
 {id:'grainvalley',name:SOSText("items_equipment.valuableRemove.210"),x:46,y:28,type:'wilderness',faction:SOSText("items_equipment.valuableRemove.211"),region:'redstone',terrain:'mountain-valley',desc:SOSText("items_equipment.valuableRemove.212")},
 {id:'briarlake',name:SOSText("items_equipment.valuableRemove.213"),x:55,y:22,type:'settlement',faction:SOSText("items_equipment.valuableRemove.214"),region:'redstone',terrain:'lakeside',desc:SOSText("items_equipment.valuableRemove.215")},
 {id:'glenbrook',name:SOSText("items_equipment.valuableRemove.216"),x:50,y:69,type:'settlement',faction:SOSText("items_equipment.valuableRemove.217"),region:'redstone',terrain:'road-village',desc:SOSText("items_equipment.valuableRemove.218")},
 {id:'tyrdon',name:SOSText("items_equipment.valuableRemove.219"),x:69,y:82,type:'settlement',faction:SOSText("items_equipment.valuableRemove.220"),region:'redstone',terrain:'dry-town',desc:SOSText("items_equipment.valuableRemove.221")},
 {id:'pyreglade',name:SOSText("items_equipment.valuableRemove.222"),x:89,y:72,type:'settlement',faction:SOSText("items_equipment.valuableRemove.223"),region:'redstone',terrain:'resin-slopes',desc:SOSText("items_equipment.valuableRemove.224")},
 {id:'lockwoodforest',name:SOSText("items_equipment.valuableRemove.225"),x:13,y:64,type:'wilderness',faction:SOSText("items_equipment.valuableRemove.226"),region:'redstone',terrain:'forest',desc:SOSText("items_equipment.valuableRemove.227")},
 {id:'grainpass',name:SOSText("items_equipment.valuableRemove.228"),x:36,y:20,type:'wilderness',faction:SOSText("items_equipment.valuableRemove.229"),region:'redstone',terrain:'pass-road',desc:SOSText("items_equipment.valuableRemove.230")},
 {id:'sengiaroad',name:SOSText("items_equipment.valuableRemove.231"),x:66,y:52,type:'wilderness',faction:SOSText("items_equipment.valuableRemove.232"),region:'redstone',terrain:'military-road',desc:SOSText("items_equipment.valuableRemove.233")},
 {id:'pyreslopes',name:SOSText("items_equipment.valuableRemove.234"),x:84,y:57,type:'wilderness',faction:SOSText("items_equipment.valuableRemove.235"),region:'redstone',terrain:'forest-slope',desc:SOSText("items_equipment.valuableRemove.236")},
 {id:'smugglercutred',name:SOSText("items_equipment.valuableRemove.237"),x:29,y:57,type:'hidden',faction:SOSText("items_equipment.valuableRemove.238"),region:'redstone',terrain:'forest',desc:SOSText("items_equipment.valuableRemove.239"),hidden:true,siteKind:'trail',minor:true},
 {id:'oldredway',name:SOSText("items_equipment.valuableRemove.240"),x:61,y:38,type:'hidden',faction:SOSText("items_equipment.valuableRemove.241"),region:'redstone',terrain:'ruin-road',desc:SOSText("items_equipment.valuableRemove.242"),hidden:true,siteKind:'ruin',minor:true},
 {id:'resinhollow',name:SOSText("items_equipment.valuableRemove.243"),x:93,y:58,type:'hidden',faction:SOSText("items_equipment.valuableRemove.244"),region:'redstone',terrain:'forest-slope',desc:SOSText("items_equipment.valuableRemove.245"),hidden:true,siteKind:'campsite',minor:true}
];
