const PARTY_BASE_LIMIT=2;
const PARTY_UNLOCK_ROUND=8;


const WORLD_REGIONS={
 shantium:{id:'shantium',name:SOSText("items_equipment.valuableRemove.071"),mapTitle:SOSText("items_equipment.valuableRemove.072"),subtitle:SOSText("items_equipment.valuableRemove.073"),terrain:'mixed'},
 bluestone:{id:'bluestone',name:SOSText("items_equipment.valuableRemove.074"),mapTitle:SOSText("items_equipment.valuableRemove.075"),subtitle:SOSText("items_equipment.valuableRemove.076"),terrain:'mountain'},
 redstone:{id:'redstone',name:SOSText("items_equipment.valuableRemove.077"),mapTitle:SOSText("items_equipment.valuableRemove.078"),subtitle:SOSText("items_equipment.valuableRemove.079"),terrain:'eastern'},
 farnorth:{id:'farnorth',name:'Far Northern Region',mapTitle:'FAR NORTHERN REGION',subtitle:'Frozen roads • Independent frontier • travel takes roughly twice as long',terrain:'frozen'}
};
const REGION_CONNECTIONS=[
 {id:'northwest_highroad',a:'northgate',b:'lowcreek',days:3,name:SOSText("items_equipment.valuableRemove.080"),desc:SOSText("items_equipment.valuableRemove.081")},
 {id:'eastern_redstone_road',a:'redoubt',b:'lockwood',days:3,name:SOSText("items_equipment.valuableRemove.082"),desc:SOSText("items_equipment.valuableRemove.083")},
 {id:'grayhaven_exium',a:'grayhaven',b:'exium',days:4,name:'Frozen North Road',desc:'The northern road leaves Grayhaven and climbs through increasingly severe snow toward Exium.'},
 {id:'crownpass_exium',a:'crownpass',b:'exium',days:4,name:'High Crown–Exium Ice Road',desc:'A brutal high route links Bluestone’s High Crown Pass with the Far Northern gateway at Exium.'}
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
 {id:'crownpass',name:SOSText("items_equipment.valuableRemove.186"),x:48,y:8,type:'camp',faction:SOSText("items_equipment.valuableRemove.187"),region:'bluestone',terrain:'pass',desc:'A small Bluestone-controlled camp settlement at the high, wind-cut pass above Zion. It guards the ice road toward Exium and the Far Northern Region.'},
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
 {id:'resinhollow',name:SOSText("items_equipment.valuableRemove.243"),x:93,y:58,type:'hidden',faction:SOSText("items_equipment.valuableRemove.244"),region:'redstone',terrain:'forest-slope',desc:SOSText("items_equipment.valuableRemove.245"),hidden:true,siteKind:'campsite',minor:true},
 {id:'azerdon',name:'Azerdon',x:55,y:8,type:'town',faction:'Independent',region:'farnorth',terrain:'frozen-city',desc:'The medium-sized capital of the Far Northern Region, strongly Independent and sustained by a stubborn internal northern economy.'},
 {id:'karsen',name:'Karsen',x:55,y:43,type:'settlement',faction:'Independent',region:'farnorth',terrain:'snow-crossroads',desc:'A rugged crossroads village and indispensable staging point for travel across the Far North.'},
 {id:'decius',name:'Decius',x:29,y:42,type:'settlement',faction:'Independent',region:'farnorth',terrain:'snow-village',desc:'A remote western settlement of hunters, trappers, and people accustomed to hard winters.'},
 {id:'snowcaves',name:'Snow Caves',x:10,y:42,type:'wilderness',faction:'Independent',region:'farnorth',terrain:'ice-caves',desc:'A sprawling set of snowbound caves in the western heights. The deeper chambers are poorly known.'},
 {id:'standingstones',name:'Standing Stone Tundra',x:39,y:24,type:'wilderness',faction:'Independent',region:'farnorth',terrain:'stony-tundra',desc:'An exposed tundra scattered with enormous standing stones older than any nearby settlement.'},
 {id:'whitescar',name:'White Scar',x:82,y:43,type:'wilderness',faction:'Independent',region:'farnorth',terrain:'ice-ravine',desc:'A vast frozen ravine and glacial fracture cutting through the eastern tundra.'},
 {id:'velmora',name:'Velmora',x:75,y:63,type:'settlement',faction:'Independent',region:'farnorth',terrain:'snow-village',desc:'An isolated southeastern village built around shelter, livestock, hunting, and endurance.'},
 {id:'roguehold',name:'Roguehold Castle',x:59,y:72,type:'ruins',faction:'Independent',region:'farnorth',terrain:'frozen-castle',desc:'An abandoned frozen castle southwest of Velmora. It is unsettled, but armed outlaws are known to use its halls and towers.'},
 {id:'skallvik',name:'Skallvik',x:34,y:66,type:'settlement',faction:'Independent',region:'farnorth',terrain:'frontier-town',desc:'A rough snowbound frontier village of hunters, trappers, mercenaries, fugitives, and traders who do not ask many questions.'},
 {id:'exium',name:'Exium',x:46,y:88,type:'settlement',faction:'Independent',region:'farnorth',terrain:'gateway-town',desc:'The southern gateway of the Far North and the practical limit of routine foreign faction travel and trade.'}
];

function worldLocation(id){return WORLD_LOCATIONS.find(x=>x.id===id)||WORLD_LOCATIONS[0]}
function locationRegion(locOrId){const loc=typeof locOrId==='string'?worldLocation(locOrId):locOrId;return loc?.region||'shantium'}
function regionDef(id=currentWorldRegion()){return WORLD_REGIONS[id]||WORLD_REGIONS.shantium}
function currentWorldRegion(){return state?.world?.region||locationRegion(state?.world?.location||'shantium')}
function locationsInRegion(region=currentWorldRegion()){return WORLD_LOCATIONS.filter(x=>locationRegion(x)===region)}
function discoveredRegionLocations(region=currentWorldRegion()){return locationsInRegion(region).filter(x=>state.world.discovered.includes(x.id))}
function regionConnectionsAt(locId=state.world.location){return REGION_CONNECTIONS.filter(r=>r.a===locId||r.b===locId)}
function regionConnectionAt(locId=state.world.location){return regionConnectionsAt(locId)[0]||null}
function regionConnectionOther(c,locId){return c.a===locId?c.b:c.a}
function regionConnectionForRegions(a,b){return REGION_CONNECTIONS.find(c=>{const ra=locationRegion(c.a),rb=locationRegion(c.b);return (ra===a&&rb===b)||(ra===b&&rb===a)})||null}
function connectedRegions(region){return [...new Set(REGION_CONNECTIONS.flatMap(c=>{const a=locationRegion(c.a),b=locationRegion(c.b);return a===region?[b]:b===region?[a]:[]}))]}
function regionNameForLocation(id){return regionDef(locationRegion(id)).name}


// v1.6.19 — Trade Goods & Regional Economies II
// Existing IDs are preserved for save compatibility. New goods are global commodities,
// with intentionally uneven production so regional trade remains meaningful.
const TRADE_GOODS=[
 {id:'food',name:SOSText("world_regions_security.regionNameForLocation.001"),base:18,sources:['river','northgate','southroad','norwegian','grainvalley','briarlake','glenbrook','azerdon','decius','velmora'],demand:['shantium','redoubt','zion','winterstone','sengia','tyrdon','pyreglade','karsen','skallvik','exium']},
 {id:'medicine',name:SOSText("world_regions_security.regionNameForLocation.002"),base:35,sources:['shantium','river','zion','sengia','decius'],demand:['northgate','southroad','redoubt','lowcreek','ebonheart','winterstone','lockwood','tyrdon','pyreglade','azerdon','karsen','velmora','skallvik','exium']},
 {id:'timber',name:SOSText("world_regions_security.regionNameForLocation.003"),base:24,sources:['northgate','river','ebonheart','norwegian','lockwood','pyreglade'],demand:['shantium','stonebridge','redoubt','zion','winterstone','sengia','briarlake','azerdon','karsen','velmora','skallvik','exium']},
 {id:'cloth',name:SOSText("world_regions_security.regionNameForLocation.004"),base:28,sources:['river','stonebridge','zion','sengia','azerdon'],demand:['shantium','northgate','southroad','lowcreek','ebonheart','lockwood','glenbrook','tyrdon','pyreglade','decius','karsen','velmora','skallvik','exium']},
 {id:'iron',name:SOSText("world_regions_security.regionNameForLocation.005"),base:42,sources:['stonebridge','redoubt','winterstone','sengia','karsen'],demand:['shantium','northgate','southroad','zion','lowcreek','lockwood','glenbrook','tyrdon','pyreglade','azerdon','decius','velmora','skallvik','exium']},
 {id:'tools',name:SOSText("world_regions_security.regionNameForLocation.006"),base:38,sources:['stonebridge','redoubt','zion','winterstone','sengia','lockwood','karsen','azerdon'],demand:['river','northgate','southroad','lowcreek','norwegian','ebonheart','briarlake','glenbrook','tyrdon','pyreglade','decius','velmora','skallvik','exium']},
 // Luxury Goods remain deliberately thin outside the eventual Spawn region: capitals are the main current producers.
 {id:'luxury',name:SOSText("world_regions_security.regionNameForLocation.007"),base:55,sources:['shantium','zion','sengia','azerdon'],demand:['river','northgate','redoubt','norwegian','ebonheart','lockwood','briarlake','glenbrook','tyrdon','pyreglade','karsen','decius','velmora','skallvik','exium']},
 {id:'hides',name:'Hides & Furs',base:40,sources:['northgate','ebonheart','norwegian','lockwood','pyreglade','decius','velmora','skallvik'],demand:['shantium','stonebridge','zion','sengia','azerdon','karsen','exium']},
 {id:'stone',name:'Stone',base:26,sources:['quarry','stonebridge','winterstone','crownpass','tyrdon','karsen','standingstones'],demand:['shantium','redoubt','zion','sengia','lockwood','azerdon','velmora','skallvik','exium']},
 // Livestock is present in every established region but intentionally sparse before the future Spawn expansion.
 {id:'livestock',name:'Livestock',base:34,sources:['northgate','lowcreek','briarlake','velmora'],demand:['shantium','stonebridge','zion','sengia','grayhaven','azerdon','karsen','skallvik','exium']},
 {id:'salt',name:'Salt',base:31,sources:['marsh','lowcreek','tyrdon'],demand:['shantium','river','northgate','zion','norwegian','sengia','briarlake','azerdon','karsen','decius','velmora','skallvik','exium']},
 // Spirits are deliberately limited in the current world so Spawn can later become a major source.
 {id:'spirits',name:'Spirits',base:46,sources:['shantium','norwegian','sengia','skallvik'],demand:['river','stonebridge','northgate','redoubt','zion','ebonheart','lockwood','grayhaven','briarlake','glenbrook','tyrdon','azerdon','karsen','decius','velmora','exium']},
 // Dye is a high-value, unevenly produced commodity (and a deliberate Mount & Blade nod).
 {id:'dye',name:'Dye',base:50,sources:['river','ebonheart','pyreglade'],demand:['shantium','stonebridge','zion','sengia','azerdon','karsen','decius','velmora','skallvik','exium']}
];
const WORLD_PARTY_TYPES=[
 {kind:'bandits',name:SOSText("world_regions_security.regionNameForLocation.008"),faction:SOSText("world_regions_security.regionNameForLocation.009"),attitude:'hostile',size:[2,5]},
 {kind:'raiders',name:SOSText("world_regions_security.regionNameForLocation.010"),faction:SOSText("world_regions_security.regionNameForLocation.011"),attitude:'hostile',size:[2,5]},
 {kind:'redstone',name:SOSText("world_regions_security.regionNameForLocation.012"),faction:SOSText("world_regions_security.regionNameForLocation.013"),attitude:'conditional',size:[3,6]},
 {kind:'coalition',name:SOSText("world_regions_security.regionNameForLocation.014"),faction:SOSText("world_regions_security.regionNameForLocation.015"),attitude:'friendly',size:[2,4]},
 {kind:'bluestone',name:SOSText("world_regions_security.regionNameForLocation.016"),faction:SOSText("world_regions_security.regionNameForLocation.017"),attitude:'conditional',size:[2,4]},
 {kind:'spawn',name:SOSText("world_regions_security.regionNameForLocation.018"),faction:SOSText("world_regions_security.regionNameForLocation.019"),attitude:'neutral',size:[2,4]},
 {kind:'merchant',name:SOSText("world_regions_security.regionNameForLocation.020"),faction:SOSText("world_regions_security.regionNameForLocation.021"),attitude:'neutral',size:[2,4]},
 {kind:'refugees',name:SOSText("world_regions_security.regionNameForLocation.022"),faction:SOSText("world_regions_security.regionNameForLocation.023"),attitude:'friendly',size:[1,3]},
 {kind:'mercenary',name:SOSText("world_regions_security.regionNameForLocation.024"),faction:SOSText("world_regions_security.regionNameForLocation.025"),attitude:'neutral',size:[2,5]}
];
const QUEST_TEMPLATES=[
 {type:'delivery',name:SOSText("world_regions_security.regionNameForLocation.026"),desc:SOSText("world_regions_security.regionNameForLocation.027"),days:7,reward:70},
 {type:'visit',name:SOSText("world_regions_security.regionNameForLocation.028"),desc:SOSText("world_regions_security.regionNameForLocation.029"),days:6,reward:55},
 {type:'hunt',name:SOSText("world_regions_security.regionNameForLocation.030"),desc:SOSText("world_regions_security.regionNameForLocation.031"),days:8,reward:95},
 {type:'escort',name:SOSText("world_regions_security.regionNameForLocation.032"),desc:SOSText("world_regions_security.regionNameForLocation.033"),days:9,reward:105},
 {type:'procure',name:SOSText("world_regions_security.regionNameForLocation.034"),desc:SOSText("world_regions_security.regionNameForLocation.035"),days:8,reward:80},
 {type:'diplomacy',name:SOSText("world_regions_security.regionNameForLocation.036"),desc:SOSText("world_regions_security.regionNameForLocation.037"),days:8,reward:90},
 {type:'recovery',name:SOSText("world_regions_security.regionNameForLocation.038"),desc:SOSText("world_regions_security.regionNameForLocation.039"),days:8,reward:100}
];

function factionTier(v){return v<=-8?'Hostile':v<=-3?'Distrustful':v<3?'Neutral':v<8?'Friendly':SOSText("world_regions_security.factionTier.001")}
const REGIONAL_CAPITALS={
 shantium:{name:SOSText("world_regions_security.factionTier.002"),defenderKinds:['redstone','coalition','mercenary'],base:6.5},
 zion:{name:SOSText("world_regions_security.factionTier.003"),defenderKinds:['bluestone','coalition'],base:7.0},
 sengia:{name:SOSText("world_regions_security.factionTier.004"),defenderKinds:['redstone','mercenary'],base:7.5}
};
function regionalCapitalDef(id){return REGIONAL_CAPITALS[id]||null}
function regionalCapitalId(region=currentWorldRegion()){return region==='bluestone'?'zion':region==='redstone'?'sengia':'shantium'}
function guardianCaravanAccessState(){ensureWorldState();if(!state.world.guardianCaravanAccess||typeof state.world.guardianCaravanAccess!=='object')state.world.guardianCaravanAccess={};return state.world.guardianCaravanAccess}
function dominantRegionalFaction(region=currentWorldRegion()){const cap=regionalCapitalId(region),f=settlementControl(cap);return OPEN_WORLD_FACTIONS[f]?f:null}
function activeGuardianCaravanAccess(region=currentWorldRegion()){const x=guardianCaravanAccessState()[region];return x&&x.expiresDay>=state.world.day?x:null}
function requestGuardianCaravanAccess(region=currentWorldRegion()){
 const cap=regionalCapitalId(region),f=dominantRegionalFaction(region);if(!f)return actionResult('No Regional Authority','The regional capital is not controlled by a faction capable of issuing a useful road directive.','info',showRegionalPolitics);
 const capital=politicalCapital(cap,f),standing=state.world.factionStanding[f]||0,rep=localReputation(cap),existing=activeGuardianCaravanAccess(region);
 if(existing)return actionResult('Caravan Access Already Active',`${majorFaction(f).name} is already backing Guardian Hall caravan access in ${regionDef(region).name} through Day ${existing.expiresDay}.`,'info',showRegionalPolitics);
 const roll=rnd(1,20)+stat(state,'cha')+Math.floor(capital/5)+Math.floor(standing/3)+Math.floor(rep/4),dc=16;
 if(roll<dc)return actionResult('Request Declined',`${majorFaction(f).name} will not commit regional authority to Guardian Hall's caravan disputes yet. Greater political capital or local standing would strengthen the request.`,'bad',showRegionalPolitics);
 const strength=capital>=30?'strong':capital>=15?'firm':'limited',days=strength==='strong'?21:strength==='firm'?16:12;
 guardianCaravanAccessState()[region]={faction:f,capitalId:cap,startedDay:state.world.day,expiresDay:state.world.day+days,strength};
 adjustPoliticalCapital(cap,f,-Math.min(4,Math.max(1,Math.floor(capital/12))),'Secured regional protection for Guardian Hall caravans');
 recordWorldNews(`${majorFaction(f).name} directs regional patrols to recognize Guardian Hall caravans and intervene when other factions obstruct them.`,'good');save();
 return actionResult('Regional Caravan Protection',`${majorFaction(f).name} has agreed to act on Guardian Hall's behalf. Stops by its own patrols should now be rare, and it will attempt to intervene when another faction obstructs a Guardian caravan. The directive lasts through Day ${state.world.day+days}.`,'good',showRegionalPolitics)
}
function guardianCaravanStopSuppressed(pair,region){
 const access=activeGuardianCaravanAccess(region);if(!pair||!access)return false;const same=pair.patrol.faction===access.faction;
 const prevent=same?(access.strength==='strong'?.94:access.strength==='firm'?.88:.78):(access.strength==='strong'?.76:access.strength==='firm'?.66:.52);
 if(!chance(prevent))return false;
 recordWorldNews(same?`${pair.patrol.name} recognizes ${pair.caravan.name} under the regional Guardian Hall caravan directive and lets it pass.`:`${majorFaction(access.faction).name} intervenes on Guardian Hall's behalf after ${pair.patrol.name} challenges ${pair.caravan.name}; the caravan is allowed to continue.`,'good');
 return true
}
function hostileToCapital(p){return ['bandits','raiders'].includes(p?.kind)}
function capitalDefenseSupportForParty(p){
 if(!p||hostileToCapital(p))return 0;const loc=p.location||p.destination,cap=regionalCapitalDef(loc);if(!cap)return 0;
 if(cap.defenderKinds.includes(p.kind))return 2.25;
 const control=settlementControl(loc);return p.faction===control?1.5:0
}
function capitalGarrisonStrength(capId){
 const cap=regionalCapitalDef(capId);if(!cap)return 0;const ss=settlementState(capId),control=settlementControl(capId);
 let value=cap.base+Math.max(0,ss.security-35)/14;
 if(capId==='shantium'&&control===SOSText("world_regions_security.capitalGarrisonStrength.001"))value+=1.5;
 if(capId==='zion')value+=1.25;
 if(capId==='sengia')value+=1.75;
 return value
}
function capitalHostiles(capId){
 return state.world.parties.filter(p=>hostileToCapital(p)&&(p.location===capId||p.destination===capId))
}
function divertHostileFromCapital(p,capId,reason=SOSText("world_regions_security.divertHostileFromCapital.001")){
 const region=locationRegion(capId),pool=locationsInRegion(region).filter(x=>!x.hidden&&x.id!==capId&&x.type!=='town').map(x=>x.id);
 const dest=purposefulDestination(p.kind,capId),next=dest&&dest!==capId?dest:pick(pool);
 p.origin=p.location||p.origin;p.destination=next;p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays(p.location||capId,next));p.capitalRepelledDay=state.world.day;
 recordWorldNews(SOSText("world_regions_security.divertHostileFromCapital.002",p.name,worldLocation(capId).name,reason),'good')
}
function resolveCapitalSecurityZones(){
 if(!isOpenWorld())return;
 for(const capId of Object.keys(REGIONAL_CAPITALS)){
  const cap=regionalCapitalDef(capId),ss=settlementState(capId),hostiles=capitalHostiles(capId);
  for(const p of [...hostiles]){
   if(!state.world.parties.some(x=>x.id===p.id))continue;
   // Approaching hostiles are usually turned away before they can enter a major capital.
   if(p.destination===capId&&p.location!==capId){
    const approachPower=capitalGarrisonStrength(capId)+ss.security/18,hostilePower=partyStrength(p)+Math.random()*2;
    if(approachPower>=hostilePower+1.5&&chance(.78)){divertHostileFromCapital(p,capId,SOSText("world_regions_security.resolveCapitalSecurityZones.001",cap.name));continue}
   }
   // Once inside the capital marker, garrison response is immediate and strongly favored.
   if(p.location===capId){
    const garrison=capitalGarrisonStrength(capId)+Math.random()*2.5,hostile=partyStrength(p)+Math.random()*2.5;
    if(garrison>=hostile-1){
      recordWorldNews(SOSText("world_regions_security.resolveCapitalSecurityZones.002",cap.name,p.name),'good');
      state.world.parties=state.world.parties.filter(x=>x.id!==p.id);
      ss.security=Math.min(100,ss.security+1);
      if(state.world.trackedPartyId===p.id)state.world.trackedPartyId=null
    }else{
      p.destination=purposefulDestination(p.kind,capId);p.travelTotal=p.travelLeft=Math.max(1,worldTravelDays(capId,p.destination));
      recordWorldNews(SOSText("world_regions_security.resolveCapitalSecurityZones.003",p.name,cap.name),'info')
    }
   }
  }
 }
}function partyStrength(p){
 const t=worldPartyType(p.kind),avg=((t?.size?.[0]||2)+(t?.size?.[1]||4))/2,level=Math.max(1,p.combatLevel||1);
 const quality={bandits:.15,raiders:.35,merchant:-.5,refugees:-1,spawn:0,mercenary:1.1,coalition:1.4,bluestone:1.8,redstone:2.1}[p.kind]||0;
 const deployment=p.securityDeployment?1.4:0,capital=capitalDefenseSupportForParty(p);
 return avg+quality+Math.min(4,(level-1)*.42)+deployment+capital
}
function factionsOpposed(a,b){
 if(OPEN_WORLD_FACTIONS[a]&&OPEN_WORLD_FACTIONS[b])return factionsOpposedPolitically(a,b);
 const pairs=[[SOSText("world_regions_security.factionsOpposed.001"),SOSText("world_regions_security.factionsOpposed.002")],[SOSText("world_regions_security.factionsOpposed.003"),SOSText("world_regions_security.factionsOpposed.004")],[SOSText("world_regions_security.factionsOpposed.005"),SOSText("world_regions_security.factionsOpposed.006")],[SOSText("world_regions_security.factionsOpposed.007"),SOSText("world_regions_security.factionsOpposed.008")]];
 return pairs.some(([x,y])=>(a===x&&b===y)||(a===y&&b===x))
}

function isGuardianCaravan(p){return !!p&&(!!p.guardianCaravan||!!p.logisticsShipment||!!p.investmentId)}
function isRecognizedFactionPatrol(p){return !!p&&OPEN_WORLD_FACTIONS[p.faction]&&(!!p.securityResponse||['redstone','bluestone','coalition'].includes(p.kind)||/Patrol|Watch|Security/i.test(p.name||''))}
function guardianCaravanPatrolPair(a,b){
 if(isGuardianCaravan(a)&&isRecognizedFactionPatrol(b))return {caravan:a,patrol:b};
 if(isGuardianCaravan(b)&&isRecognizedFactionPatrol(a))return {caravan:b,patrol:a};
 return null
}
function guardianCaravanIncidentLocation(caravan,patrol,c=null){
 if(c?.locId&&state.world.settlements?.[c.locId])return c.locId;
 const region=worldPartyDisplayRegion(caravan||patrol),pos=caravan?worldPartyPosition(caravan):worldPartyPosition(patrol);
 return nearestWorldLocationToPosition(region,pos)
}
function guardianCaravanDisputeLabel(c){
 const a=state.world.parties.find(p=>p.id===c.aId),b=state.world.parties.find(p=>p.id===c.bId),pair=guardianCaravanPatrolPair(a,b);
 return pair?SOSText("world_regions_security.guardianCaravanDisputeLabel.001",pair.patrol.name,pair.caravan.name):SOSText("world_regions_security.guardianCaravanDisputeLabel.002")
}
function partiesConflict(a,b){
 if(a.id===b.id)return false;
 if(!factionsOpposed(a.faction,b.faction)){
   if(['bandits','raiders'].includes(a.kind)&&['merchant','refugees'].includes(b.kind))return true;
   if(['bandits','raiders'].includes(b.kind)&&['merchant','refugees'].includes(a.kind))return true;
   return false;
 }
 return true;
}
function recordWorldNews(text,type='info'){ensureWorldState();state.world.news=state.world.news||[];state.world.news.push({day:state.world.day,text,type});if(state.world.news.length>40)state.world.news.shift();recordWorldHistory(text,type,SOSText("world_regions_security.recordWorldNews.001"));log(text,type)}
function factionSecurityResponseState(){
 ensureWorldState();const w=state.world;
 if(!w.factionSecurityResponse||typeof w.factionSecurityResponse!=='object')w.factionSecurityResponse={lastTickDay:0,lastResponseDay:{},history:[]};
 if(!w.liveRegionalConflicts||!Array.isArray(w.liveRegionalConflicts))w.liveRegionalConflicts=[];
 return w.factionSecurityResponse
}
function activeLiveRegionalConflicts(){factionSecurityResponseState();return state.world.liveRegionalConflicts.filter(c=>c.status==='active')}
function liveRegionalConflict(id){return activeLiveRegionalConflicts().find(c=>c.id===id)||null}
function partyInLiveConflict(id){return activeLiveRegionalConflicts().some(c=>c.aId===id||c.bId===id)}
function liveConflictPosition(c){
 const a=state.world.parties.find(p=>p.id===c.aId),b=state.world.parties.find(p=>p.id===c.bId);
 if(a&&b){const pa=worldPartyPosition(a),pb=worldPartyPosition(b);return{x:(pa.x+pb.x)/2,y:(pa.y+pb.y)/2}}
 const loc=worldLocation(c.locId);return{x:loc?.x||50,y:loc?.y||50}
}
function nearestWorldLocationToPosition(region,pos){
 const rows=locationsInRegion(region).filter(l=>!l.hidden);if(!rows.length)return state.world.location;
 return rows.sort((a,b)=>Math.hypot(a.x-pos.x,a.y-pos.y)-Math.hypot(b.x-pos.x,b.y-pos.y))[0].id
}
function conflictPriorityParty(p){
 if(!p)return 0;let n=0;if(['bandits','raiders'].includes(p.kind))n+=4;if(REGIONAL_CAPITALS?.[p.destination])n+=5;
 if(state.world.settlements?.[p.destination])n+=2;if((p.combatLevel||1)>=state.level)n+=1;return n
}
function createLiveRegionalConflict(a,b){
 if(!a||!b||partyInLiveConflict(a.id)||partyInLiveConflict(b.id))return null;
 const pa=worldPartyPosition(a),pb=worldPartyPosition(b),region=worldPartyDisplayRegion(a),pos={x:(pa.x+pb.x)/2,y:(pa.y+pb.y)/2},locId=nearestWorldLocationToPosition(region,pos),pair=guardianCaravanPatrolPair(a,b);
 if(pair&&guardianCaravanStopSuppressed(pair,region))return null;
 const c={id:'conf_'+uid(),aId:a.id,bId:b.id,region,locId,createdDay:state.world.day,expiresDay:state.world.day+1,status:'active',reinforceA:0,reinforceB:0};
 if(pair){c.kind='guardian_caravan_dispute';c.misunderstanding=true;c.patrolId=pair.patrol.id;c.caravanId=pair.caravan.id;c.patrolFaction=pair.patrol.faction;c.guardianCaravan=true;c.escalated=false;c.expiresDay=state.world.day+2}
 const inc=createWorldIncident(pair?'guardian_caravan_stop':'regional_conflict',{location:locId,region,severity:pair?2:3,actors:[{ref:a.actorRef||`world_party:${a.id}`,side:'a',role:a.kind},{ref:b.actorRef||`world_party:${b.id}`,side:'b',role:b.kind}],political:{factions:[a.faction,b.faction],guardianCaravan:!!pair},links:{regionalConflictId:c.id,aPartyId:a.id,bPartyId:b.id},meta:{misunderstanding:!!pair}});
 c.incidentId=inc.id;state.world.liveRegionalConflicts.push(c);state.world.liveRegionalConflicts=state.world.liveRegionalConflicts.slice(-20);
 if(pair)recordWorldNews(SOSText("world_regions_security.createLiveRegionalConflict.001",pair.patrol.name,pair.caravan.name,worldLocation(locId).name),'info');
 else recordWorldNews(SOSText("world_regions_security.createLiveRegionalConflict.002",worldLocation(locId).name,a.name,b.name),'bad');
 return c
}
function liveConflictReinforcementBonus(c,side){
 const actor=state.world.parties.find(p=>p.id===side==='a'?c.aId:c.bId),enemy=state.world.parties.find(p=>p.id===side==='a'?c.bId:c.aId);if(!actor||!enemy)return 0;
 const pos=liveConflictPosition(c);let bonus=0;
 for(const p of state.world.parties){
  if([c.aId,c.bId].includes(p.id)||partyInLiveConflict(p.id))continue;
  const pp=worldPartyPosition(p),near=Math.hypot(pp.x-pos.x,pp.y-pos.y)<=10;
  if(!near)continue;
  if(partiesConflict(p,enemy)&&!partiesConflict(p,actor)){bonus+=p.securityResponse?2.5:1.25}
 }
 return Math.min(5,bonus)
}
function politicalSecurityResult(p,won,locId){
 if(!p?.securityResponse||!OPEN_WORLD_FACTIONS[p.faction]||!state.world.settlements?.[locId])return;
 if(won){recordFactionPower(locId,p.faction,'security',2,SOSText("world_regions_security.politicalSecurityResult.001",p.name),8);addPoliticalPressure(locId,p.faction,.25,SOSText("world_regions_security.politicalSecurityResult.002"))}
 else{recordFactionPower(locId,p.faction,'security',-1.5,SOSText("world_regions_security.politicalSecurityResult.003",p.name),8);const ps=politicalSettlement(locId);ps.lean[p.faction]=clamp((ps.lean[p.faction]||0)-.5,-6,12);politicalHistory(SOSText("world_regions_security.politicalSecurityResult.004",worldLocation(locId).name,majorFaction(p.faction).short),'bad')}
}

function guardianCaravanDisputeParties(c){
 if(!c)return null;const a=state.world.parties.find(p=>p.id===c.aId),b=state.world.parties.find(p=>p.id===c.bId),pair=guardianCaravanPatrolPair(a,b);
 return pair?{...pair,a,b}:null
}
function guardianCaravanReportChance(locId,patrol,extra=0){
 const ss=state.world.settlements?.[locId],security=ss?.security||45,presence=factionPresenceAt(locId)?.[patrol.faction]||0;
 return clamp(.28+security/250+presence*.025+extra,.25,.92)
}
function applyGuardianCaravanViolenceConsequences(c,{guardianJoined=false,caravanWon=false,patrolWon=false}={}){
 const pair=guardianCaravanDisputeParties(c);if(!pair)return null;
 const {caravan,patrol}=pair,locId=c.locId||guardianCaravanIncidentLocation(caravan,patrol,c);
 const witnesses=incidentWitnessCount(c.incidentId),reportChance=guardianCaravanReportChance(locId,patrol,guardianJoined?.16:.04)+(witnesses?Math.min(.24,witnesses*.08):0),reported=witnesses>0?chance(clamp(reportChance,.35,.98)):chance(reportChance*.72);
 const formalAuthority=settlementControl(locId)===patrol.faction||jurisdictionRule(locId)?.faction===patrol.faction;
 let delta=0,note='';
 if(reported){
   if(guardianJoined){delta=caravanWon?-4:-3;note=SOSText("world_regions_security.applyGuardianCaravanViolenceConsequences.001",patrol.name,caravan.name)}
   else if(caravanWon){delta=-2;note=SOSText("world_regions_security.applyGuardianCaravanViolenceConsequences.002",majorFaction(patrol.faction).short,caravan.name,patrol.name)}
   else if(patrolWon){delta=-1;note=SOSText("world_regions_security.applyGuardianCaravanViolenceConsequences.003",caravan.name,majorFaction(patrol.faction).short)}
   adjustLocalGuardianFactionRelation(locId,patrol.faction,delta,note);
   recordGuardianFactionIncident(locId,patrol.faction,note,{severity:guardianJoined?3:2,witnessed:true,kind:'guardian_caravan_clash',incidentId:c.incidentId});
   const fc=localPoliticalFactionState(locId,patrol.faction);
   fc.organization=clamp((fc.organization||0)+(guardianJoined?.35:.15),-6,12);
   fc.security=clamp((fc.security||0)+(patrolWon?.3:caravanWon?-.25:0),-6,12);
   if(guardianJoined&&formalAuthority){
     const law=recordCrimeDetailed('assault',locId,patrol.faction,{witnessed:true,severity:2,desc:SOSText("world_regions_security.applyGuardianCaravanViolenceConsequences.004",patrol.name,caravan.name)});
     law.guardianCaravanIncident=true;law.disputeId=c.id;
   }
 }else{
   note=SOSText("world_regions_security.applyGuardianCaravanViolenceConsequences.005",caravan.name,patrol.name);
   recordGuardianFactionIncident(locId,patrol.faction,note,{severity:1,witnessed:false,kind:'guardian_caravan_clash',incidentId:c.incidentId});
 }
 c.politicalReport={reported,locId,faction:patrol.faction,localRelationDelta:delta,formalAuthority,guardianJoined,witnesses};
 if(c.incidentId)updateWorldIncident(c.incidentId,{political:{reported,faction:patrol.faction,localRelationDelta:delta,guardianJoined},legal:{formalAuthority,reported},meta:{reportWitnesses:witnesses}});
 return c.politicalReport
}
function dispatchGuardianCaravanMessenger(c,action){
 const pair=guardianCaravanDisputeParties(c);if(!pair||c.status!=='active'||c.escalated)return actionResult(SOSText("world_regions_security.dispatchGuardianCaravanMessenger.001"),SOSText("world_regions_security.dispatchGuardianCaravanMessenger.002"),'info',renderOpenWorld);
 ensureHomeBase();const distance=Math.max(1,worldTravelDays('shantium',c.locId)),d=createWorldDispatch('guardian_caravan_order',{origin:'shantium',destination:c.locId,baseDays:Math.max(1,Math.ceil(distance*.55)),hallStaff:true,title:SOSText("world_regions_security.dispatchGuardianCaravanMessenger.011",pair.caravan.name),targetRef:pair.caravan.actorRef||`world_party:${pair.caravan.id}`,payload:{conflictId:c.id,action}}),days=d.dueDay-state.world.day;
 c.messengerOrder={action,sentDay:state.world.day,dueDay:d.dueDay,dispatchId:d.id};c.expiresDay=Math.max(c.expiresDay,c.messengerOrder.dueDay+1);c.guardianTracked=true;
 recordWorldHistory(SOSText("world_regions_security.dispatchGuardianCaravanMessenger.003",pair.caravan.name,days,days===1?'':'s'),'info','home');save();actionResult(SOSText("world_regions_security.dispatchGuardianCaravanMessenger.004"),SOSText("world_regions_security.dispatchGuardianCaravanMessenger.005",days,days===1?'':'s'),'info',renderOpenWorld)
}
function processGuardianCaravanMessenger(c){
 if(!c?.messengerOrder||c.messengerOrder.resolved||(c.messengerOrder.dispatchId?!worldDispatchArrived(c.messengerOrder.dispatchId):state.world.day<c.messengerOrder.dueDay)||c.status!=='active'||c.escalated)return false;
 const o=c.messengerOrder;o.resolved=true;o.arrivedDay=state.world.day;if(o.dispatchId)completeWorldDispatch(o.dispatchId,'completed');const pair=guardianCaravanDisputeParties(c);if(!pair)return false;
 if(o.action==='inspect'||o.action==='reroute'){resolveGuardianCaravanDispute(c,o.action,true);return true}
 const {patrol,caravan}=pair,locId=c.locId,rel=localGuardianFactionRelation(locId,patrol.faction),standing=state.world.factionStanding[patrol.faction]||0,stew=state.world.homeBase.staff?.steward?.competence||0,logc=state.world.homeBase.logistics?.master?.competence||0,roll=rnd(1,20)+Math.floor(standing/5)+Math.floor(rel/4)+Math.floor((stew+logc)/4),dc=14;
 if(roll>=dc){c.status='resolved';c.resolvedDay=state.world.day;c.resolution='cleared_by_messenger';if(c.incidentId)resolveWorldIncident(c.incidentId,{kind:'cleared_by_messenger',violent:false});adjustLocalGuardianFactionRelation(locId,patrol.faction,1,SOSText("world_regions_security.dispatchGuardianCaravanMessenger.006",patrol.name,caravan.name));recordGuardianFactionIncident(locId,patrol.faction,SOSText("world_regions_security.dispatchGuardianCaravanMessenger.007",patrol.name,caravan.name),{severity:1,witnessed:true,kind:'messenger_clearance'});recordWorldHistory(SOSText("world_regions_security.dispatchGuardianCaravanMessenger.008",caravan.name,patrol.name),'good','home');save();return true}
 caravan.travelLeft=Math.max(0,(caravan.travelLeft||1)+1);c.status='resolved';c.resolvedDay=state.world.day;c.resolution='messenger_inspection';if(c.incidentId)resolveWorldIncident(c.incidentId,{kind:'inspection',violent:false});recordGuardianFactionIncident(locId,patrol.faction,SOSText("world_regions_security.dispatchGuardianCaravanMessenger.009",patrol.name,caravan.name),{severity:1,witnessed:true,kind:'inspection'});recordWorldHistory(SOSText("world_regions_security.dispatchGuardianCaravanMessenger.010",caravan.name),'info','home');save();return true
}
function resolveGuardianCaravanDispute(c,action='explain'){
 const pair=guardianCaravanDisputeParties(c);if(!pair)return actionResult(SOSText("world_regions_security.resolveGuardianCaravanDispute.001"),SOSText("world_regions_security.resolveGuardianCaravanDispute.002"),'info',renderOpenWorld);
 const {caravan,patrol}=pair,locId=c.locId||guardianCaravanIncidentLocation(caravan,patrol,c),rel=localGuardianFactionRelation(locId,patrol.faction),standing=state.world.factionStanding[patrol.faction]||0,rep=localReputation(locId);
 if(action==='inspect'){
   caravan.travelLeft=Math.max(0,(caravan.travelLeft||1)+1);c.status='resolved';c.resolvedDay=state.world.day;c.resolution='inspection';if(c.incidentId)resolveWorldIncident(c.incidentId,{kind:'inspection',violent:false});
   adjustLocalGuardianFactionRelation(locId,patrol.faction,1,SOSText("world_regions_security.resolveGuardianCaravanDispute.003",patrol.name,caravan.name));
   recordGuardianFactionIncident(locId,patrol.faction,SOSText("world_regions_security.resolveGuardianCaravanDispute.004",patrol.name,caravan.name),{severity:1,witnessed:true,kind:'inspection'});
   save();return actionResult(SOSText("world_regions_security.resolveGuardianCaravanDispute.005"),SOSText("world_regions_security.resolveGuardianCaravanDispute.006",patrol.name),'good',renderOpenWorld)
 }
 if(action==='reroute'){
   caravan.travelLeft=Math.max(0,(caravan.travelLeft||1)+2);c.status='resolved';c.resolvedDay=state.world.day;c.resolution='rerouted';
   recordGuardianFactionIncident(locId,patrol.faction,SOSText("world_regions_security.resolveGuardianCaravanDispute.007",caravan.name,patrol.name),{severity:1,witnessed:true,kind:'reroute'});
   save();return actionResult(SOSText("world_regions_security.resolveGuardianCaravanDispute.008"),SOSText("world_regions_security.resolveGuardianCaravanDispute.009",caravan.name),'info',renderOpenWorld)
 }
 if(action==='explain'){
   const roll=rnd(1,20)+stat(state,'cha')+Math.floor(standing/4)+Math.floor(rel/3)+Math.floor(rep/4)+(homeUpgradeLevel(SOSText("world_regions_security.resolveGuardianCaravanDispute.010"))?1:0),dc=14+(standing<0?2:0);
   if(roll>=dc){
     c.status='resolved';c.resolvedDay=state.world.day;c.resolution='cleared_by_guardian';
     adjustLocalGuardianFactionRelation(locId,patrol.faction,1,SOSText("world_regions_security.resolveGuardianCaravanDispute.011",patrol.name,caravan.name));
     recordGuardianFactionIncident(locId,patrol.faction,SOSText("world_regions_security.resolveGuardianCaravanDispute.012",patrol.name,caravan.name),{severity:1,witnessed:true,kind:'misunderstanding_cleared'});
     save();return actionResult(SOSText("world_regions_security.resolveGuardianCaravanDispute.013"),SOSText("world_regions_security.resolveGuardianCaravanDispute.014",patrol.name,caravan.name,worldLocation(caravan.destination).name),'good',renderOpenWorld)
   }
   c.escalated=true;c.misunderstanding=false;c.expiresDay=Math.max(c.expiresDay,state.world.day+1);
   recordGuardianFactionIncident(locId,patrol.faction,SOSText("world_regions_security.resolveGuardianCaravanDispute.015",patrol.name),{severity:2,witnessed:true,kind:'failed_deescalation'});
   save();return actionResult(SOSText("world_regions_security.resolveGuardianCaravanDispute.016"),SOSText("world_regions_security.resolveGuardianCaravanDispute.017",patrol.name),'bad',()=>showLiveRegionalConflict(c.id))
 }
}
function autoResolveGuardianCaravanDispute(c){
 if(processGuardianCaravanMessenger(c))return c;const pair=guardianCaravanDisputeParties(c);if(!pair){c.status='ended';c.resolvedDay=state.world.day;return null}
 if(!c.escalated&&chance(.66)){
   c.status='resolved';c.resolvedDay=state.world.day;c.resolution='patrol_cleared';
   pair.caravan.travelLeft=Math.max(0,(pair.caravan.travelLeft||1)+1);
   recordGuardianFactionIncident(c.locId,pair.patrol.faction,SOSText("world_regions_security.autoResolveGuardianCaravanDispute.001",pair.patrol.name,pair.caravan.name),{severity:1,witnessed:true,kind:'inspection'});
   return {peaceful:true}
 }
 c.escalated=true;c.misunderstanding=false;
 const result=resolveLiveRegionalConflict(c);
 if(result)applyGuardianCaravanViolenceConsequences(c,{guardianJoined:false,caravanWon:result.winner?.id===pair.caravan.id,patrolWon:result.winner?.id===pair.patrol.id});
 return result
}
function applyGuardianRegionalConflictPoliticalChoice(c,ally,enemy,locId){
 if(!c||c.guardianPoliticalChoice||!state.world.settlements?.[locId]||!OPEN_WORLD_FACTIONS[ally?.faction]||!OPEN_WORLD_FACTIONS[enemy?.faction]||ally.faction===enemy.faction)return false;
 const backed=localPoliticalFactionState(locId,ally.faction),opposed=localPoliticalFactionState(locId,enemy.faction),reason=`The Guardian publicly sides with ${majorFaction(ally.faction).short} in the dispute with ${majorFaction(enemy.faction).short}.`;
 backed.support=clamp((backed.support||0)+.6,-6,12);backed.legitimacy=clamp((backed.legitimacy||0)+.2,-6,12);
 opposed.support=clamp((opposed.support||0)-.6,-6,12);opposed.legitimacy=clamp((opposed.legitimacy||0)-.15,-6,12);
 recordFactionPower(locId,ally.faction,'guardian',.75,reason,7);recordFactionPower(locId,enemy.faction,'guardian',-.75,reason,7);
 const ps=politicalSettlement(locId);ps.lean[ally.faction]=clamp((ps.lean[ally.faction]||0)+.2,-6,12);ps.lean[enemy.faction]=clamp((ps.lean[enemy.faction]||0)-.2,-6,12);
 c.guardianPoliticalChoice={day:state.world.day,backedFaction:ally.faction,opposedFaction:enemy.faction,locId};
 politicalHistory(`${worldLocation(locId).name}: ${reason} ${majorFaction(ally.faction).short} gains slight political ground; ${majorFaction(enemy.faction).short} loses slight ground.`,'info');
 return true
}
function resolveLiveRegionalConflict(c){
 if(!c||c.status!=='active')return null;if(c.kind==='guardian_caravan_dispute'&&!c.escalated)return autoResolveGuardianCaravanDispute(c);const a=state.world.parties.find(p=>p.id===c.aId),b=state.world.parties.find(p=>p.id===c.bId);
 if(!a||!b){c.status='ended';c.resolvedDay=state.world.day;return null}
 const bonusA=liveConflictReinforcementBonus(c,'a'),bonusB=liveConflictReinforcementBonus(c,'b');
 const result=resolvePartyVsParty(a,b,bonusA,bonusB);c.status='resolved';c.resolvedDay=state.world.day;c.winnerId=result?.winner?.id||null;c.loserId=result?.loser?.id||null;c.reinforceA=bonusA;c.reinforceB=bonusB;
 if(c.incidentId)resolveWorldIncident(c.incidentId,{kind:'party_battle',violent:true,winnerRef:result?.winner?.actorRef||`world_party:${result?.winner?.id}`,loserRef:result?.loser?.actorRef||`world_party:${result?.loser?.id}`});
 politicalSecurityResult(a,result?.winner?.id===a.id,c.locId);politicalSecurityResult(b,result?.winner?.id===b.id,c.locId);return result
}
function cleanupLiveRegionalConflicts(){
 factionSecurityResponseState();for(const c of state.world.liveRegionalConflicts){if(c.status==='active'&&(!state.world.parties.some(p=>p.id===c.aId)||!state.world.parties.some(p=>p.id===c.bId))){c.status='ended';c.resolvedDay=state.world.day}}
 state.world.liveRegionalConflicts=state.world.liveRegionalConflicts.filter(c=>c.status==='active'||state.world.day-(c.resolvedDay||c.createdDay||0)<=8).slice(-20)
}
function securityFactionForThreat(p){
 const target=p.destination&&state.world.settlements?.[p.destination]?p.destination:(state.world.settlements?.[p.location]?p.location:null),region=worldPartyDisplayRegion(p);
 if(region==='bluestone')return {faction:SOSText("world_regions_security.securityFactionForThreat.001"),kind:'bluestone',target:target||'zion',name:SOSText("world_regions_security.securityFactionForThreat.002")};
 if(region==='redstone')return {faction:SOSText("world_regions_security.securityFactionForThreat.003"),kind:'redstone',target:target||'sengia',name:SOSText("world_regions_security.securityFactionForThreat.004")};
 const control=target?settlementControl(target):SOSText("world_regions_security.securityFactionForThreat.005");
 if(control===SOSText("world_regions_security.securityFactionForThreat.006"))return {faction:SOSText("world_regions_security.securityFactionForThreat.007"),kind:'redstone',target:target||'shantium',name:SOSText("world_regions_security.securityFactionForThreat.008")};
 if(control===SOSText("world_regions_security.securityFactionForThreat.009"))return {faction:SOSText("world_regions_security.securityFactionForThreat.010"),kind:'coalition',target:target||'shantium',name:SOSText("world_regions_security.securityFactionForThreat.011")};
 if(control===SOSText("world_regions_security.securityFactionForThreat.012"))return {faction:SOSText("world_regions_security.securityFactionForThreat.013"),kind:'coalition',target:target||'northgate',name:SOSText("world_regions_security.securityFactionForThreat.014")};
 return {faction:SOSText("world_regions_security.securityFactionForThreat.015"),kind:'coalition',target:target||'shantium',name:SOSText("world_regions_security.securityFactionForThreat.016")}
}
function securityResponseSource(region,faction,target){
 const cap=region==='bluestone'?'zion':region==='redstone'?'sengia':'shantium',candidates=regionalSettlements(region).filter(l=>l.id!==target).sort((a,b)=>settlementState(b.id).security-settlementState(a.id).security);
 if(state.world.settlements?.[cap]&&settlementState(cap).security>=42)return cap;return candidates[0]?.id||cap
}
function existingSecurityResponseFor(threatId){return state.world.parties.find(p=>p.securityResponse&&p.securityTargetPartyId===threatId)}
function spawnFactionSecurityResponse(threat){
 const spec=securityFactionForThreat(threat),region=worldPartyDisplayRegion(threat),source=securityResponseSource(region,spec.faction,spec.target);if(!source||source===spec.target&&threat.location===spec.target)return null;
 const p=spawnRegionalResponse(spec.kind,source,spec.target,`${spec.name} to ${worldLocation(spec.target).name}`);if(!p)return null;
 p.faction=spec.faction;p.attitude='friendly';p.securityResponse=true;p.securityTargetPartyId=threat.id;p.securityReason=SOSText("world_regions_security.spawnFactionSecurityResponse.001",threat.name);p.combatLevel=Math.max(p.combatLevel||1,(threat.combatLevel||1)+rnd(-1,1));
 const S=factionSecurityResponseState();S.history.push({day:state.world.day,faction:spec.faction,target:spec.target,threatId:threat.id,responseId:p.id,text:SOSText("world_regions_security.spawnFactionSecurityResponse.002",p.name,threat.name)});S.history=S.history.slice(-40);
 recordWorldNews(SOSText("world_regions_security.spawnFactionSecurityResponse.003",majorFaction(spec.faction)?.short||spec.faction,p.name,worldLocation(spec.target).name,threat.name),'info');return p
}
function factionSecurityThreatScore(p){
 if(!['bandits','raiders'].includes(p.kind))return -1;let score=2+(p.combatLevel||1)*.35;
 if(REGIONAL_CAPITALS?.[p.destination])score+=6;if(state.world.settlements?.[p.destination])score+=2;
 const pos=worldPartyPosition(p);for(const q of state.world.parties){if(!['merchant','refugees'].includes(q.kind))continue;const qp=worldPartyPosition(q);if(Math.hypot(pos.x-qp.x,pos.y-qp.y)<=12)score+=q.kind==='refugees'?3:2}
 return score
}
function factionSecurityResponseDailyTick(){
 if(!isOpenWorld())return;const S=factionSecurityResponseState();if(S.lastTickDay>=state.world.day)return;S.lastTickDay=state.world.day;
 for(const region of state.world.unlockedRegions||['shantium']){
  const threats=state.world.parties.filter(p=>worldPartyDisplayRegion(p)===region&&['bandits','raiders'].includes(p.kind)&&!existingSecurityResponseFor(p.id)).sort((a,b)=>factionSecurityThreatScore(b)-factionSecurityThreatScore(a));
  const threat=threats[0];if(!threat||factionSecurityThreatScore(threat)<3.5)continue;
  const last=S.lastResponseDay[region]||0;if(state.world.day-last<2)continue;
  if(spawnFactionSecurityResponse(threat))S.lastResponseDay[region]=state.world.day
 }
}
function nearbyPartyPair(){
 const ps=state.world.parties,candidates=[];
 for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){
   if(ps[i].contractProtected||ps[j].contractProtected||partyInLiveConflict(ps[i].id)||partyInLiveConflict(ps[j].id))continue;
   if(worldPartyDisplayRegion(ps[i])!==worldPartyDisplayRegion(ps[j]))continue;
   const a=worldPartyPosition(ps[i]),b=worldPartyPosition(ps[j]),dist=Math.hypot(a.x-b.x,a.y-b.y);
   if(dist<=8&&partiesConflict(ps[i],ps[j]))candidates.push({a:ps[i],b:ps[j],score:conflictPriorityParty(ps[i])+conflictPriorityParty(ps[j])-dist*.1})
 }
 candidates.sort((x,y)=>y.score-x.score);return candidates.length?[candidates[0].a,candidates[0].b]:null
}
function namedGroupSentenceName(name){
 const s=String(name||'').trim();if(!s)return SOSText("world_regions_security.namedGroupSentenceName.001");
 if(/^the\s+/i.test(s))return s.charAt(0).toUpperCase()+s.slice(1);
 return SOSText("world_regions_security.namedGroupSentenceName.002",s);
}
function resolvePartyVsParty(a,b,bonusA=0,bonusB=0){
 const sa=partyStrength(a)+Math.random()*3+(bonusA||0),sb=partyStrength(b)+Math.random()*3+(bonusB||0);
 const winner=sa>=sb?a:b,loser=winner===a?b:a;
 const lostContract=loser.questId?activeQuest(loser.questId):null;if(loser.tradeProcurementCaravan)homeTradeProcurementLost(loser,`${winner.name} defeated the procurement caravan near ${worldLocation(winner.location||winner.destination).name}.`);if(loser.homeCommercialCaravan&&typeof homeCommercialCaravanLost==='function')homeCommercialCaravanLost(loser,`${winner.name} defeated the commercial caravan near ${worldLocation(winner.location||winner.destination).name}.`);
 if(loser.securityDeployment){const M=sengiaSecurityState(),d=M.deployments.find(x=>x.partyId===loser.id&&x.status==='moving');if(d){d.status='lost';d.endedDay=state.world.day;recordSengiaSecurity(SOSText("world_regions_security.resolvePartyVsParty.001",loser.name,worldLocation(d.to).name),'bad')}}
 if(lostContract?.spotContract&&!['hunt','recovery'].includes(lostContract.type)){
   const reason=SOSText("world_regions_security.resolvePartyVsParty.002",loser.name,winner.name);
   if(lostContract.type==='escort')failEscortContract(lostContract,reason,false);
   else{lostContract.status='failed';lostContract.failReason=reason;lostContract.failedDay=state.world.day;state.world.contractStats.failed++;state.world.factionStanding[lostContract.faction]=(state.world.factionStanding[lostContract.faction]||0)-1;queueContractFailureNotice(lostContract,reason,1)}
   loser.contractProtected=false;loser.contractResolutionAllowed=true;loser.questId=null;
 }
 if(['hunt','recovery'].includes(lostContract?.type)){lostContract.status='failed';lostContract.failReason=SOSText("world_regions_security.resolvePartyVsParty.003",loser.name);lostContract.failedDay=state.world.day;state.world.contractStats.failed++;if(state.world.trackedQuestId===lostContract.id)state.world.trackedPartyId=null;loser.questId=null;log(SOSText("world_regions_security.resolvePartyVsParty.004",lostContract.name),'info')}
 const loc=worldLocation(winner.location||winner.destination);
 recordWorldNews(SOSText("world_regions_security.resolvePartyVsParty.005",winner.name,loser.name,loc.name),winner.faction===SOSText("world_regions_security.resolvePartyVsParty.006")?'bad':'info');
 if(loser.kind==='merchant'){
   recordTradeLoss(loser,winner.location||winner.destination);const target=loser.destination,ss=state.world.settlements[target];
   if(ss){ss.prosperity=Math.max(0,ss.prosperity-2);state.world.marketShock=state.world.marketShock||{};state.world.marketShock[target]=(state.world.marketShock[target]||0)+.08;if(!settlementProblem(target))createSettlementProblem(target,'shortage');regionalThread('supply',loser.origin||loser.location,target,SOSText("world_regions_security.resolvePartyVsParty.007",worldLocation(target).name),SOSText("world_regions_security.resolvePartyVsParty.008",loser.name,worldLocation(target).name));addRoutePressure(loser.origin||loser.location,target,1)}
 }
 if(loser.kind==='refugees'){const target=loser.destination;if(state.world.settlements[target]){regionalThread('displacement',loser.origin||loser.location,target,SOSText("world_regions_security.resolvePartyVsParty.009"),SOSText("world_regions_security.resolvePartyVsParty.010",namedGroupSentenceName(loser.name),worldLocation(target).name));addRoutePressure(loser.origin||loser.location,target,1)}}
 if(['bandits','raiders'].includes(winner.kind)){
   const target=winner.destination,ss=state.world.settlements[target];if(ss){ss.security=Math.max(0,ss.security-1);if(!settlementProblem(target)&&chance(.5))createSettlementProblem(target,'raider_pressure');regionalThread('security',winner.location||winner.origin,target,SOSText("world_regions_security.resolvePartyVsParty.011",worldLocation(target).name),SOSText("world_regions_security.resolvePartyVsParty.012",winner.name,worldLocation(target).name));addRoutePressure(winner.location||winner.origin,target,1)}
 }
 state.world.parties=state.world.parties.filter(p=>p.id!==loser.id);if(state.world.trackedPartyId===loser.id)state.world.trackedPartyId=null;
 maintainWorldParties();return {winner,loser,scoreA:sa,scoreB:sb}
}
function simulateRegionalConflict(){
 if(!isOpenWorld())return;ensureWorldState();cleanupLiveRegionalConflicts();
 for(const c of [...activeLiveRegionalConflicts()])if(state.world.day>=c.expiresDay)resolveLiveRegionalConflict(c);
 const pair=nearbyPartyPair();if(pair&&chance(.78))createLiveRegionalConflict(pair[0],pair[1])
}

const OPEN_WORLD_FACTIONS={
 Shantium:{name:SOSText("world_regions_security.simulateRegionalConflict.001"),short:SOSText("world_regions_security.simulateRegionalConflict.002"),desc:SOSText("world_regions_security.simulateRegionalConflict.003"),agenda:SOSText("world_regions_security.simulateRegionalConflict.004"),color:SOSText("world_regions_security.simulateRegionalConflict.005")},
 Coalition:{name:SOSText("world_regions_security.simulateRegionalConflict.006"),short:SOSText("world_regions_security.simulateRegionalConflict.007"),desc:SOSText("world_regions_security.simulateRegionalConflict.008"),agenda:SOSText("world_regions_security.simulateRegionalConflict.009"),color:SOSText("world_regions_security.simulateRegionalConflict.010")},
 Redstone:{name:SOSText("world_regions_security.simulateRegionalConflict.011"),short:SOSText("world_regions_security.simulateRegionalConflict.012"),desc:SOSText("world_regions_security.simulateRegionalConflict.013"),agenda:SOSText("world_regions_security.simulateRegionalConflict.014"),color:SOSText("world_regions_security.simulateRegionalConflict.015")},
 Independent:{name:SOSText("world_regions_security.simulateRegionalConflict.016"),short:SOSText("world_regions_security.simulateRegionalConflict.017"),desc:SOSText("world_regions_security.simulateRegionalConflict.018"),agenda:SOSText("world_regions_security.simulateRegionalConflict.019"),color:SOSText("world_regions_security.simulateRegionalConflict.020")},
 Bluestone:{name:SOSText("world_regions_security.simulateRegionalConflict.021"),short:SOSText("world_regions_security.simulateRegionalConflict.022"),desc:SOSText("world_regions_security.simulateRegionalConflict.023"),agenda:SOSText("world_regions_security.simulateRegionalConflict.024"),color:SOSText("world_regions_security.simulateRegionalConflict.025")},
 Spawn:{name:SOSText("world_regions_security.simulateRegionalConflict.026"),short:SOSText("world_regions_security.simulateRegionalConflict.027"),desc:SOSText("world_regions_security.simulateRegionalConflict.028"),agenda:SOSText("world_regions_security.simulateRegionalConflict.029"),color:SOSText("world_regions_security.simulateRegionalConflict.030")},
 Mercenaries:{name:SOSText("world_regions_security.simulateRegionalConflict.031"),short:SOSText("world_regions_security.simulateRegionalConflict.032"),desc:SOSText("world_regions_security.simulateRegionalConflict.033"),agenda:SOSText("world_regions_security.simulateRegionalConflict.034"),color:SOSText("world_regions_security.simulateRegionalConflict.035")}
};
